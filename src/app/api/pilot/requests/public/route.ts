import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { sendEmail, getOwnerNotificationEmail, getRequestReceivedEmail } from '@/lib/emailService';

let adminDb: any = null;

function getAdminDb() {
  if (adminDb) return adminDb;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      adminDb = getFirestore(apps[0]);
      return adminDb;
    }

    const adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    adminDb = getFirestore(adminApp);
    return adminDb;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

/**
 * POST /api/pilot/requests/public
 * Submit an access request for a dataset (PUBLIC - no authentication required)
 * Used by external AI labs to request access from the discovery page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      datasetId,
      company,
      contactEmail,
      requesterName,
      purpose,
      usageWindowDays
    } = body;

    console.log('📋 Access request received:', {
      datasetId,
      company,
      requesterName,
      contactEmail
    });

    // Validate required fields
    if (!datasetId || !company || !contactEmail || !requesterName || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: datasetId, company, contactEmail, requesterName, purpose' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    console.log(`👥 Searching ${usersSnapshot.size} users for dataset ${datasetId}...`);

    let requestCreated = false;
    let datasetOwnerUserId = '';
    let datasetData: any = null;

    // Search for the dataset across all users
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const datasetsRef = userDoc.ref.collection('datasets');
      
      // Search by document ID (not field)
      const datasetRef = datasetsRef.doc(datasetId);
      const datasetDoc = await datasetRef.get();

      if (datasetDoc.exists) {
        datasetData = datasetDoc.data();
        datasetOwnerUserId = userId;
        console.log(`✅ Found dataset in user ${userId}`);

        // Create access request
        const requestsRef = userDoc.ref.collection('accessRequests');
        const requestData = {
          datasetId,
          datasetTitle: datasetData.title || datasetData.sourceName || 'Unknown Dataset',
          requesterName,
          requesterCompany: company,
          requesterEmail: contactEmail,
          purpose,
          usageWindowDays: usageWindowDays || 30,
          status: 'pending',
          createdAt: new Date().toISOString(),
          reviewedAt: null,
          reviewedBy: null,
          apiKeyGenerated: false,
          apiKey: null
        };

        const requestDocRef = await requestsRef.add(requestData);
        requestCreated = true;

        console.log(`✅ Access request created: ${requestDocRef.id}`);
        
        // Send email notifications
        console.log('📧 Sending email notifications...');
        
        // Get the dataset owner's email
        const ownerData = userDoc.data();
        const ownerEmail = ownerData?.email || '';
        
        if (ownerEmail) {
          // Notify dataset owner about new request
          const ownerEmailPayload = getOwnerNotificationEmail(
            ownerEmail,
            requesterName,
            company,
            datasetData.title || datasetData.sourceName || 'Unknown Dataset',
            purpose,
            requestDocRef.id,
            datasetId
          );
          
          const ownerEmailSent = await sendEmail(ownerEmailPayload);
          if (ownerEmailSent) {
            console.log('✅ Owner notification sent to:', ownerEmail);
          } else {
            console.warn('⚠️ Failed to send owner notification to:', ownerEmail);
          }
        } else {
          console.warn('⚠️ Dataset owner email not found');
        }
        
        // Notify requester that request was received
        const requesterEmailPayload = getRequestReceivedEmail(
          contactEmail,
          requesterName,
          datasetData.title || datasetData.sourceName || 'Unknown Dataset'
        );
        
        const requesterEmailSent = await sendEmail(requesterEmailPayload);
        if (requesterEmailSent) {
          console.log('✅ Confirmation email sent to:', contactEmail);
        } else {
          console.warn('⚠️ Failed to send confirmation email to:', contactEmail);
        }

        return NextResponse.json({
          id: requestDocRef.id,
          datasetId,
          datasetTitle: datasetData.title || datasetData.sourceName,
          status: 'pending',
          sla: '24 hours',
          receivedAt: requestData.createdAt,
          message: 'Your access request has been submitted. The dataset owner will review it within 24 hours and send you an API key if approved.'
        }, { status: 201 });
      }
    }

    if (!requestCreated) {
      console.log(`❌ Dataset not found: ${datasetId}`);
      return NextResponse.json(
        { error: `Dataset not found: ${datasetId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  } catch (error) {
    console.error('POST /api/pilot/requests/public error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: `Failed to submit request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
