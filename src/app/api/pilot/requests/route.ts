import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/apiKeyValidation';
import { doc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * POST /api/pilot/requests
 * Submit an access request for a dataset
 * Requires: X-API-Key header
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid) {
      return createUnauthorizedResponse(validation.error);
    }

    const body = await request.json();
    const { datasetId, company, contactEmail, purpose, usageWindowDays } = body;

    // Validate required fields
    if (!datasetId || !company || !contactEmail || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: datasetId, company, contactEmail, purpose' },
        { status: 400 }
      );
    }

    // Find the dataset owner
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let requestCreated = false;
    for (const userDoc of usersSnapshot.docs) {
      const datasetsRef = collection(userDoc.ref, 'datasets');
      const q = query(datasetsRef, where('id', '==', datasetId));
      const datasetsSnapshot = await getDocs(q);

      if (!datasetsSnapshot.empty) {
        // Create access request
        const requestsRef = collection(userDoc.ref, 'accessRequests');
        const requestData = {
          datasetId,
          requesterConnectionId: validation.connectionId,
          company,
          contactEmail,
          purpose,
          usageWindowDays: usageWindowDays || 30,
          status: 'pending',
          createdAt: new Date().toISOString(),
          reviewedAt: null,
          reviewedBy: null,
        };

        const requestDoc = await addDoc(requestsRef, requestData);
        requestCreated = true;

        return NextResponse.json({
          id: requestDoc.id,
          datasetId,
          status: 'pending',
          sla: '24 hours', // Standard response time
          receivedAt: requestData.createdAt,
          message: 'Your access request has been submitted. The dataset owner will review it within 24 hours.',
        }, { status: 201 });
      }
    }

    if (!requestCreated) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error creating access request:', error);
    return NextResponse.json(
      { error: 'Failed to submit access request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pilot/requests
 * Get access requests for the authenticated connection
 * Requires: X-API-Key header
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid) {
      return createUnauthorizedResponse(validation.error);
    }

    // Find all requests for this connection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const requests: any[] = [];
    for (const userDoc of usersSnapshot.docs) {
      const requestsRef = collection(userDoc.ref, 'accessRequests');
      const q = query(
        requestsRef,
        where('requesterConnectionId', '==', validation.connectionId)
      );
      const requestsSnapshot = await getDocs(q);

      requestsSnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
        });
      });
    }

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}
