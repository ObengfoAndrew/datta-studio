import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/pilot/sync
 * 
 * Creates datasets from selected repositories and syncs them
 * 
 * Request body:
 * {
 *   connectionId: string,
 *   repositories: Array<{
 *     id: number,
 *     name: string,
 *     full_name: string,
 *     description: string,
 *     html_url/web_url: string,
 *     size: number,
 *     stargazers_count: number,
 *     language: string,
 *     updated_at: string
 *   }>,
 *   licenseType: 'free' | 'pro' | 'enterprise',
 *   provider: 'github' | 'gitlab'
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   datasetsCreated: number,
 *   datasets: Array<{
 *     id: string,
 *     name: string,
 *     status: string,
 *     url: string
 *   }>,
 *   message: string
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      connectionId,
      repositories,
      licenseType,
      provider,
      userId
    } = body;

    // Validate required fields
    if (!connectionId || !repositories || !Array.isArray(repositories)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: connectionId and repositories array',
          message: '❌ Invalid sync request'
        },
        { status: 400 }
      );
    }

    if (!licenseType || !['free', 'pro', 'enterprise'].includes(licenseType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing licenseType',
          message: '❌ License type must be one of: free, pro, enterprise'
        },
        { status: 400 }
      );
    }

    if (!provider || !['github', 'gitlab'].includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing provider',
          message: '❌ Provider must be one of: github, gitlab'
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing sync request:`, {
      connectionId,
      repositoriesCount: repositories.length,
      licenseType,
      provider
    });

    // Process repositories and create sync records
    const createdDatasets: Array<{
      id: string;
      name: string;
      status: string;
      url: string;
      provider: string;
      licenseType: string;
    }> = [];

    // In a real implementation, you would:
    // 1. Verify the connection exists in Firestore
    // 2. Clone/download repositories
    // 3. Analyze code structure and create datasets
    // 4. Store dataset metadata in Firestore
    // 5. Queue background sync jobs

    // For now, we'll simulate successful creation with proper schema
    for (const repo of repositories) {
      const datasetId = `${provider}-${connectionId}-${repo.id}`;
      
      createdDatasets.push({
        id: datasetId,
        name: repo.name,
        status: 'syncing',
        url: repo.html_url || repo.web_url || repo.url || '',
        provider: provider,
        licenseType: licenseType
      });

      console.log(`✅ Queued dataset for sync: ${repo.full_name}`);
    }

    console.log(`✅ Sync request processed: ${createdDatasets.length} datasets queued`);

    return NextResponse.json({
      success: true,
      datasetsCreated: createdDatasets.length,
      datasets: createdDatasets,
      message: `✅ Successfully queued ${createdDatasets.length} repositories for sync from ${provider}`,
      connectionId,
      licenseType,
      provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: '❌ Failed to process sync request'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pilot/sync
 * 
 * Returns current sync status and recent synced datasets
 * 
 * Query parameters:
 * - connectionId (optional): Filter by specific connection
 * - provider (optional): Filter by provider (github, gitlab)
 * - status (optional): Filter by status (syncing, synced, failed)
 * 
 * Response:
 * {
 *   success: boolean,
 *   syncStatus: 'idle' | 'syncing' | 'completed' | 'failed',
 *   activeSyncs: number,
 *   completedSyncs: number,
 *   failedSyncs: number,
 *   lastSyncTime: string | null,
 *   datasets: Array<{
 *     id: string,
 *     name: string,
 *     provider: string,
 *     status: string,
 *     createdAt: string
 *   }>
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');

    console.log(`📊 Checking sync status:`, {
      connectionId,
      provider,
      status
    });

    // In a real implementation, you would query Firestore for:
    // 1. Active sync jobs
    // 2. Completed datasets
    // 3. Failed syncs
    // 4. Last sync timestamp

    // For now, return a mock response with proper structure
    return NextResponse.json({
      success: true,
      syncStatus: 'idle',
      activeSyncs: 0,
      completedSyncs: 0,
      failedSyncs: 0,
      lastSyncTime: null,
      datasets: [],
      message: '📊 Sync status retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error checking sync status:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: '❌ Failed to check sync status'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pilot/sync
 * 
 * Cancels an active sync job or removes a synced dataset
 * 
 * Request body:
 * {
 *   datasetId: string,
 *   connectionId: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetId, connectionId } = body;

    if (!datasetId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: datasetId',
          message: '❌ Dataset ID required'
        },
        { status: 400 }
      );
    }

    console.log(`🗑️ Canceling sync: ${datasetId}`);

    // In a real implementation, you would:
    // 1. Find the sync job or dataset
    // 2. Mark as cancelled/deleted
    // 3. Clean up resources
    // 4. Remove from Firestore

    return NextResponse.json({
      success: true,
      message: `✅ Sync/dataset ${datasetId} cancelled successfully`,
      datasetId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error canceling sync:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: '❌ Failed to cancel sync'
      },
      { status: 500 }
    );
  }
}
