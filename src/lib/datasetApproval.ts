/**
 * Dataset Approval Workflow Handler
 * Manages access request approval, rejection, and signed URL generation
 */

import { collection, doc, getDoc, updateDoc, serverTimestamp, setDoc, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ref, getBytes } from 'firebase/storage';

export interface ApprovalResult {
  success: boolean;
  requestId: string;
  status: 'approved' | 'rejected';
  message: string;
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Approve an access request for a dataset
 * Grants user access and generates signed download URL
 */
export async function approveAccessRequest(
  userId: string,
  datasetId: string,
  requestId: string,
  accessDurationDays?: number,
  notes?: string
): Promise<ApprovalResult> {
  const expiryDays = accessDurationDays || 30; // Default 30 days

  try {
    // Step 1: Get the access request
    const requestRef = doc(db, 'users', userId, 'datasets', datasetId, 'accessRequests', requestId);
    const requestSnapshot = await getDoc(requestRef);

    if (!requestSnapshot.exists()) {
      return {
        success: false,
        requestId,
        status: 'approved',
        message: 'Access request not found',
        error: 'REQUEST_NOT_FOUND',
      };
    }

    const requestData = requestSnapshot.data();

    // Step 2: Verify request is pending
    if (requestData.status !== 'pending') {
      return {
        success: false,
        requestId,
        status: 'approved',
        message: `Request is already ${requestData.status}`,
        error: 'REQUEST_NOT_PENDING',
      };
    }

    // Step 3: Calculate expiry date
    const now = new Date();
    const expiryDate = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    // Step 4: Update access request
    await updateDoc(requestRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvalNotes: notes || '',
      expiresAt: expiryDate,
      accessDurationDays: expiryDays,
    });

    // Step 5: Add to allowed users in dataset
    const datasetRef = doc(db, 'users', userId, 'datasets', datasetId);
    const datasetSnapshot = await getDoc(datasetRef);
    
    if (!datasetSnapshot.exists()) {
      return {
        success: false,
        requestId,
        status: 'approved',
        message: 'Dataset not found',
        error: 'DATASET_NOT_FOUND',
      };
    }

    const dataset = datasetSnapshot.data();
    const allowedUsers = dataset.accessControl?.allowedUsers || [];
    const requesterConnectionId = requestData.requesterConnectionId;

    // Add to allowed users if not already present
    if (!allowedUsers.includes(requesterConnectionId)) {
      allowedUsers.push(requesterConnectionId);
      await updateDoc(datasetRef, {
        'accessControl.allowedUsers': allowedUsers,
        updatedAt: serverTimestamp(),
      });
    }

    // Step 6: Update dataset stats
    const stats = dataset.stats || {};
    await updateDoc(datasetRef, {
      'stats.approvedAccess': (stats.approvedAccess || 0) + 1,
    });

    // Step 7: Generate signed URL (simplified - in production use Firebase Storage signed URLs)
    const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/pilot/download/${datasetId}?token=${generateAccessToken(
      requesterConnectionId,
      expiryDate
    )}`;

    return {
      success: true,
      requestId,
      status: 'approved',
      message: 'Access request approved successfully',
      downloadUrl,
      expiresAt: expiryDate,
    };
  } catch (error) {
    console.error('Error approving access request:', error);
    return {
      success: false,
      requestId,
      status: 'approved',
      message: 'Failed to approve access request',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Reject an access request for a dataset
 */
export async function rejectAccessRequest(
  userId: string,
  datasetId: string,
  requestId: string,
  notes?: string
): Promise<ApprovalResult> {
  try {
    // Step 1: Get the access request
    const requestRef = doc(db, 'users', userId, 'datasets', datasetId, 'accessRequests', requestId);
    const requestSnapshot = await getDoc(requestRef);

    if (!requestSnapshot.exists()) {
      return {
        success: false,
        requestId,
        status: 'rejected',
        message: 'Access request not found',
        error: 'REQUEST_NOT_FOUND',
      };
    }

    const requestData = requestSnapshot.data();

    // Step 2: Verify request is pending
    if (requestData.status !== 'pending') {
      return {
        success: false,
        requestId,
        status: 'rejected',
        message: `Request is already ${requestData.status}`,
        error: 'REQUEST_NOT_PENDING',
      };
    }

    // Step 3: Update access request to rejected
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectionNotes: notes || '',
    });

    // Step 4: Update dataset stats
    const datasetRef = doc(db, 'users', userId, 'datasets', datasetId);
    const datasetSnapshot = await getDoc(datasetRef);
    const dataset = datasetSnapshot.data();
    const stats = dataset?.stats || {};

    await updateDoc(datasetRef, {
      'stats.rejectedRequests': (stats.rejectedRequests || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      requestId,
      status: 'rejected',
      message: 'Access request rejected successfully',
    };
  } catch (error) {
    console.error('Error rejecting access request:', error);
    return {
      success: false,
      requestId,
      status: 'rejected',
      message: 'Failed to reject access request',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Generate a temporary access token for dataset download
 */
export function generateAccessToken(connectionId: string, expiryDate: Date): string {
  // In production, this should use proper JWT or encrypted tokens
  // For now, create a simple encoded token
  const payload = {
    connectionId,
    expiresAt: expiryDate.toISOString(),
    issuedAt: new Date().toISOString(),
  };

  // Simple base64 encoding (NOT SECURE for production)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Validate an access token
 */
export function validateAccessToken(token: string): {
  valid: boolean;
  connectionId?: string;
  expiresAt?: Date;
  error?: string;
} {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const expiryDate = new Date(payload.expiresAt);
    const now = new Date();

    if (expiryDate < now) {
      return {
        valid: false,
        error: 'TOKEN_EXPIRED',
      };
    }

    return {
      valid: true,
      connectionId: payload.connectionId,
      expiresAt: expiryDate,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'INVALID_TOKEN',
    };
  }
}

/**
 * Get all pending access requests for a dataset
 */
export async function getPendingRequests(userId: string, datasetId: string) {
  try {
    const requestsRef = collection(db, 'users', userId, 'datasets', datasetId, 'accessRequests');
    const q = query(requestsRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return [];
  }
}

/**
 * Get all access requests for a dataset with optional status filter
 */
export async function getAccessRequests(userId: string, datasetId: string, status?: string) {
  try {
    const requestsRef = collection(db, 'users', userId, 'datasets', datasetId, 'accessRequests');
    let q;

    if (status) {
      q = query(requestsRef, where('status', '==', status));
    } else {
      q = query(requestsRef);
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting access requests:', error);
    return [];
  }
}

/**
 * Approve a public access request (from discovery page)
 * Auto-generates API key and sends it to requester
 */
export async function approvePublicAccessRequest(
  userId: string,
  requestId: string,
  accessDurationDays?: number
): Promise<ApprovalResult> {
  const expiryDays = accessDurationDays || 30;

  try {
    // Step 1: Get the request (search in accessRequests collection)
    const userDocRef = doc(db, 'users', userId);
    const accessRequestsRef = collection(userDocRef, 'accessRequests');
    
    // Find the specific request
    const requestRef = doc(userDocRef, 'accessRequests', requestId);
    const requestSnapshot = await getDoc(requestRef);

    if (!requestSnapshot.exists()) {
      return {
        success: false,
        requestId,
        status: 'approved',
        message: 'Access request not found',
        error: 'REQUEST_NOT_FOUND',
      };
    }

    const requestData = requestSnapshot.data();

    // Step 2: Verify request is pending
    if (requestData.status !== 'pending') {
      return {
        success: false,
        requestId,
        status: 'approved',
        message: `Request is already ${requestData.status}`,
        error: 'REQUEST_NOT_PENDING',
      };
    }

    // Step 3: Generate API key for the requester
    const apiKey = `datta_${Math.random().toString(36).substr(2, 40)}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    // Step 4: Create a connection record for the requester
    const connectionId = `public_req_${requestId}`;
    const connectionsRef = collection(userDocRef, 'aiLabConnections');
    await addDoc(connectionsRef, {
      connectionId,
      requesterEmail: requestData.requesterEmail,
      requesterName: requestData.requesterName,
      requesterCompany: requestData.requesterCompany,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate,
      accessRequestId: requestId,
      approvalNotes: `Public discovery request approved`
    });

    // Step 5: Create API key record
    const apiKeysRef = collection(userDocRef, 'apiKeys');
    await addDoc(apiKeysRef, {
      connectionId,
      apiKey,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate,
      requesterEmail: requestData.requesterEmail,
      requesterName: requestData.requesterName,
      requestCount: 0,
      datasetAccessCount: 0,
    });

    // Step 6: Update the access request with API key
    await updateDoc(requestRef, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      apiKeyGenerated: true,
      apiKey,
      connectionId,
      expiresAt: expiryDate,
      accessDurationDays: expiryDays,
    });

    // Step 7: Send email with API key to requester
    try {
      const { sendEmail, getApiKeyEmail } = await import('./emailService');
      const emailPayload = getApiKeyEmail(
        requestData.requesterEmail,
        requestData.requesterName,
        requestData.datasetTitle || 'Dataset',
        apiKey
      );
      await sendEmail(emailPayload);
      console.log('✅ API key email sent to:', requestData.requesterEmail);
    } catch (emailError) {
      console.warn('⚠️ Failed to send API key email:', emailError);
      // Don't fail the approval if email fails
    }

    return {
      success: true,
      requestId,
      status: 'approved',
      message: 'Access approved. API key has been sent to ' + requestData.requesterEmail,
      expiresAt: expiryDate,
    };
  } catch (error) {
    console.error('Error approving public access request:', error);
    return {
      success: false,
      requestId,
      status: 'approved',
      message: 'Failed to approve access request',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Check if a connection has approved access to a dataset
 */
export async function hasAccessToDataset(userId: string, datasetId: string, connectionId: string): Promise<boolean> {
  try {
    const datasetRef = doc(db, 'users', userId, 'datasets', datasetId);
    const datasetSnapshot = await getDoc(datasetRef);

    if (!datasetSnapshot.exists()) {
      return false;
    }

    const dataset = datasetSnapshot.data();
    const allowedUsers = dataset.accessControl?.allowedUsers || [];

    if (allowedUsers.includes(connectionId)) {
      // Check if access has expired
      const requestsRef = collection(db, 'users', userId, 'datasets', datasetId, 'accessRequests');
      const q = query(
        requestsRef,
        where('requesterConnectionId', '==', connectionId),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const request = doc.data();
        const expiryDate = request.expiresAt?.toDate?.() || new Date(request.expiresAt);
        if (expiryDate > new Date()) {
          return true; // Access still valid
        } else {
          // Access expired, remove from allowed users
          const updatedAllowed = allowedUsers.filter((id: string) => id !== connectionId);
          await updateDoc(datasetRef, {
            'accessControl.allowedUsers': updatedAllowed,
          });
          return false;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking access:', error);
    return false;
  }
}
