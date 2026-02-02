import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
 * GET /api/pilot/datasets/public
 * List all published datasets (PUBLIC - no authentication required)
 */
export async function GET() {
  try {
    console.log('🔍 Fetching public datasets...');

    const db = getAdminDb();
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    console.log(`👥 Found ${usersSnapshot.size} users`);

    const allDatasets: any[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const datasetsRef = userDoc.ref.collection('datasets');
      
      // First, get ALL datasets for this user (no filter) to debug
      const allUserDatasetsSnapshot = await datasetsRef.get();
      console.log(`📊 User ${userId}: ${allUserDatasetsSnapshot.size} total datasets`);
      
      // Log each dataset's status
      allUserDatasetsSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        console.log(`  - Dataset: ${data.title || data.sourceName} | Status: "${data.status}" | Has status field: ${data.status !== undefined}`);
      });
      
      // Now filter for published only
      const datasetsSnapshot = await datasetsRef
        .where('status', '==', 'published')
        .get();

      console.log(`  ✅ Published: ${datasetsSnapshot.size} datasets`);

      datasetsSnapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        
        // Skip the Test Dataset
        if (data.title === 'Test Dataset' || data.sourceName === 'Test Dataset') {
          console.log(`  ⏭️  Skipping Test Dataset`);
          return;
        }
        
        allDatasets.push({
          id: doc.id,
          userId: userDoc.id,
          title: data.sourceName || data.title || 'Untitled Dataset',
          description:
            data.metadata?.description || data.description || 'No description available',
          status: data.status || 'published',
          createdAt: data.dateAdded || data.createdAt || new Date().toISOString(),
          updatedAt: data.lastModified || data.updatedAt,
          licenseType: data.licenseType,
          fileCount: data.fileCount || 1,
          size: data.fileSize || data.size,
          downloadURL: data.downloadURL,
          downloads: data.downloads || 0,
          views: data.views || 0,
          metadata: data.metadata || {
            tags: data.tags || [],
            language: 'unknown',
            framework: 'unknown',
          },
        });
      });
    }

    console.log(`✅ Found ${allDatasets.length} published datasets total`);

    const uniqueCreators = new Set(allDatasets.map((d) => d.userId)).size;

    return Response.json({
      datasets: allDatasets,
      activeCreators: uniqueCreators,
      total: allDatasets.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching datasets:', error);
    return Response.json(
      {
        error: (error as Error).message,
        datasets: [],
        activeCreators: 0,
        total: 0,
      },
      { status: 500 }
    );
  }
}