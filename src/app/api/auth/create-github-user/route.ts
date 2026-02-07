import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

let adminDb: any = null;

function getAdminDb() {
  if (adminDb) return adminDb;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      adminDb = getFirestore(apps[0]);
      return adminDb;
    }
    const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    const containsLiteralEscapes = rawKey.includes('\\n');
    const hasSurroundingQuotes = rawKey.startsWith('"') && rawKey.endsWith('"');
    const privateKey = rawKey.replace(/\\n/g, '\n').replace(/^"/, '').replace(/"$/, '');

    // Diagnostics (do not log the key itself)
    console.log('Firebase private key diagnostics:', {
      length: privateKey.length,
      containsBeginHeader: privateKey.includes('BEGIN PRIVATE KEY'),
      containsLiteralEscapes,
      hasSurroundingQuotes,
    });

    if (!privateKey || !privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Invalid or missing FIREBASE_PRIVATE_KEY. Please check your .env/local or Netlify environment variables.');
    }

    let adminApp;
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } catch (initErr) {
      console.error('Firebase initializeApp error:', initErr && initErr.message ? initErr.message : initErr);
      throw initErr;
    }
    adminDb = getFirestore(adminApp);
    return adminDb;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, displayName, photoURL, githubLogin } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    console.log(`🔐 Creating GitHub user profile for ${userId}`);

    const db = getAdminDb();
    const userDocRef = db.collection('users').doc(userId);

    // Create user profile with admin SDK (bypasses security rules)
    await userDocRef.set(
      {
        uid: userId,
        email: email || '',
        displayName: displayName || 'GitHub User',
        photoURL: photoURL || '',
        authProvider: 'github',
        githubLogin: githubLogin || '',
        createdAt: new Date().toISOString(),
        dataSources: [],
        wallet: [],
        apiKeys: []
      },
      { merge: true }
    );

    console.log(`✅ User profile created for ${userId}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'User profile created successfully',
        userId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating GitHub user:', error, error instanceof Error ? error.stack : undefined);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create user profile',
      },
      { status: 500 }
    );
  }
}
