import { NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Force Node runtime so the server route can use Firebase SDK
export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }
    const userId = 'demo-user';
    const userDocRef = doc(db as any, 'users', userId);
    const walletRef = collection(userDocRef, 'wallet');
    
    console.log('Attempting to read from Firestore...');
    const snapshot = await getDocs(walletRef);
    
    const data: any[] = [];
    snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      message: 'Firestore connection working',
      dataCount: snapshot.size,
      data
    });
  } catch (error: any) {
    console.error('Firestore debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }
    const userId = 'demo-user';
    const userDocRef = doc(db as any, 'users', userId);
    const walletRef = collection(userDocRef, 'wallet');
    
    const testDocId = `test-${Date.now()}`;
    await setDoc(doc(walletRef, testDocId), {
      source: 'Test',
      type: 'debug',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      data: { message: 'This is a test document', timestamp: Date.now() }
    });

    return NextResponse.json({
      success: true,
      message: 'Test document created successfully',
      documentId: testDocId
    });
  } catch (error: any) {
    console.error('Firestore write error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}