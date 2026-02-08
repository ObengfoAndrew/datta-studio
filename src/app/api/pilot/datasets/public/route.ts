import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// This route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

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

// Simple in-memory cache for public datasets
let cachedPublicDatasets: any[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedPublicDatasets(db: any): Promise<any[]> {
  const now = Date.now();
  
  // Return cached results if still valid
  if (cachedPublicDatasets.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    console.log(`📦 Returning cached ${cachedPublicDatasets.length} datasets`);
    return cachedPublicDatasets;
  }

  console.log('🔄 Refreshing dataset cache...');
  
  try {
    const publishedLimit = Number(process.env.PUBLIC_DATASETS_LIMIT) || 200;
    const allDatasets: any[] = [];

    // Get all users
    console.log('📋 Step 1: Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    const userIds: string[] = [];
    usersSnapshot.forEach((doc: any) => {
      userIds.push(doc.id);
    });
    console.log(`📋 Found ${userIds.length} users`);

    // Fetch published datasets for each user in optimized batches
    console.log('📋 Step 2: Fetching published datasets...');
    const batchSize = 50;
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Fetch all datasets for batch users in parallel
      const batchPromises = batch.map(async (userId) => {
        try {
          // Fetch all datasets (no where clause) and filter in code to include published and datasets without status
          const datasetsSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('datasets')
            .orderBy('dateAdded', 'desc')
            .limit(20) // Increased limit since we'll filter
            .get();
          
          const userDatasets: any[] = [];
          datasetsSnapshot.forEach((d: any) => {
            const data = d.data();
            if (data.title === 'Test Dataset' || data.sourceName === 'Test Dataset') return;
            
            // Include datasets that are published OR don't have a status field (treat as published)
            // Only exclude datasets with explicit 'draft' status
            if (data.status && data.status !== 'published' && data.status !== 'uploaded') {
              return;
            }
            
            userDatasets.push({
              id: d.id,
              userId: userId,
              title: data.sourceName || data.title || 'Untitled Dataset',
              description: data.metadata?.description || data.description || 'No description available',
              status: data.status || 'published',
              createdAt: data.dateAdded || data.createdAt || new Date().toISOString(),
              updatedAt: data.lastModified || data.updatedAt,
              licenseType: data.licenseType,
              fileCount: data.fileCount || 1,
              size: data.fileSize || data.size,
              downloadURL: data.downloadURL,
              downloads: data.downloads || 0,
              views: data.views || 0,
              metadata: data.metadata || { tags: data.tags || [], language: 'unknown', framework: 'unknown' },
            });
          });
          return userDatasets;
        } catch (error) {
          console.warn(`⚠️ Error fetching datasets for user ${userId}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((datasets) => {
        allDatasets.push(...datasets);
      });

      // Stop if we've reached the limit
      if (allDatasets.length >= publishedLimit) {
        break;
      }
    }

    // Sort by date and apply limit
    const sortedDatasets = allDatasets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, publishedLimit);
    
    console.log(`✅ Retrieved ${sortedDatasets.length} published datasets`);

    // Cache the results
    cachedPublicDatasets = sortedDatasets;
    cacheTimestamp = now;

    return sortedDatasets;
  } catch (error) {
    console.error('❌ Error fetching datasets:', error);
    return [];
  }
}

/**
 * GET /api/pilot/datasets/public
 * List all published datasets (PUBLIC - no authentication required)
 * Query Parameters:
 *   - limit: Number of datasets to return (default: 20, max: 100)
 *   - offset: Pagination offset (default: 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const db = getAdminDb();
    
    // Get datasets from cache
    const allDatasets = await getCachedPublicDatasets(db);

    // Apply pagination
    const paginatedDatasets = allDatasets.slice(offset, offset + limit);
    const uniqueCreators = new Set(allDatasets.map((d) => d.userId)).size;

    console.log(`📊 Returning ${paginatedDatasets.length} datasets (offset: ${offset}, limit: ${limit})`);

    return Response.json({ 
      datasets: paginatedDatasets, 
      activeCreators: uniqueCreators, 
      total: allDatasets.length,
      limit,
      offset,
      hasMore: offset + limit < allDatasets.length,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('❌ Error in GET /api/pilot/datasets/public:', error);
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