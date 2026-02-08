import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/apiKeyValidation';
import { ValidationUtils } from '@/lib/validationUtils';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

// This route should be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * GET /api/pilot/datasets
 * List all available published datasets with search and pagination
 * Requires: X-API-Key header
 * Query Parameters:
 *   - q: Search query (searches name, description, tags)
 *   - license: Filter by license type (open-source, research, professional, commercial)
 *   - language: Filter by programming language (TypeScript, Python, etc.)
 *   - framework: Filter by framework (React, Django, etc.)
 *   - tags: Filter by tags (comma-separated)
 *   - limit: Results per page (default: 20, max: 100)
 *   - offset: Pagination offset (default: 0)
 *   - sort: Sort by (createdAt, name, quality; default: createdAt desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid) {
      return createUnauthorizedResponse(validation.error);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';
    const licenseFilter = searchParams.get('license')?.toLowerCase() || '';
    const languageFilter = searchParams.get('language')?.toLowerCase() || '';
    const frameworkFilter = searchParams.get('framework')?.toLowerCase() || '';
    const tagsFilter = searchParams.get('tags')?.split(',').map(t => t.trim().toLowerCase()) || [];
    const sortBy = searchParams.get('sort') || 'createdAt';
    
    // Pagination
    let limit = parseInt(searchParams.get('limit') || '20');
    let offset = parseInt(searchParams.get('offset') || '0');
    
    // Validate pagination
    limit = Math.min(Math.max(limit, 1), 100); // 1-100
    offset = Math.max(offset, 0);

    // Get all published datasets from Firestore
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    const usersRef = collection(db as any, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const allDatasets: any[] = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const datasetsRef = collection(userDoc.ref, 'datasets');
      // Fetch all datasets and filter in code to include published and datasets without status
      const datasetsSnapshot = await getDocs(datasetsRef);

      datasetsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Include datasets that are published OR don't have a status field (treat as published)
        // Only exclude datasets with explicit 'draft' status
        if (data.status && data.status !== 'published' && data.status !== 'uploaded') {
          return;
        }
        
        allDatasets.push({
          userId: userDoc.id,
          id: doc.id,
          ...data,
        });
      });
    }

    // Apply filters
    let filtered = allDatasets.filter(dataset => {
      // Search in name, description, tags
      if (searchQuery) {
        const nameMatch = (dataset.sourceName || dataset.title || dataset.name)?.toLowerCase().includes(searchQuery);
        const descMatch = (dataset.metadata?.description || dataset.description)?.toLowerCase().includes(searchQuery);
        const tagsMatch = dataset.metadata?.tags?.some((tag: string) =>
          tag.toLowerCase().includes(searchQuery)
        );
        if (!nameMatch && !descMatch && !tagsMatch) {
          return false;
        }
      }

      // Filter by license
      if (licenseFilter && dataset.licenseType?.toLowerCase() !== licenseFilter) {
        return false;
      }

      // Filter by language
      if (languageFilter && dataset.metadata?.language?.toLowerCase() !== languageFilter) {
        return false;
      }

      // Filter by framework
      if (frameworkFilter && dataset.metadata?.framework?.toLowerCase() !== frameworkFilter) {
        return false;
      }

      // Filter by tags (must have all specified tags)
      if (tagsFilter.length > 0) {
        const datasetTags = (dataset.metadata?.tags || []).map((t: string) => t.toLowerCase());
        const hasAllTags = tagsFilter.every(tag => datasetTags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });

    // Sort results
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const aName = (a.sourceName || a.title || a.name) || '';
        const bName = (b.sourceName || b.title || b.name) || '';
        return aName.localeCompare(bName);
      } else if (sortBy === 'quality') {
        return (b.metadata?.quality || 0) - (a.metadata?.quality || 0);
      } else {
        // Default: createdAt descending
        const aDate = a.dateAdded?.toDate?.() || new Date(a.dateAdded) || a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bDate = b.dateAdded?.toDate?.() || new Date(b.dateAdded) || b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      }
    });

    // Get total count before pagination
    const total = filtered.length;

    // Apply pagination
    const paginatedDatasets = filtered.slice(offset, offset + limit);

    // Format response
    const datasets = paginatedDatasets.map(dataset => ({
      id: dataset.id,
      datasetId: dataset.datasetId,
      name: dataset.sourceName || dataset.title || dataset.name || 'Untitled Dataset',
      description: dataset.metadata?.description || dataset.description || 'No description available',
      sourceType: dataset.sourceType,
      licenseType: dataset.licenseType,
      visibility: dataset.visibility,
      quality: dataset.metadata?.quality || 3,
      tags: dataset.metadata?.tags || [],
      language: dataset.metadata?.language,
      framework: dataset.metadata?.framework,
      owner: {
        userId: dataset.owner?.userId,
        connectionId: dataset.owner?.connectionId,
      },
      stats: {
        downloads: dataset.stats?.downloads || dataset.downloads || 0,
        accessRequests: dataset.stats?.accessRequests || 0,
        approvedAccess: dataset.stats?.approvedAccess || 0,
        ratings: dataset.stats?.ratings || { average: 0, count: 0 },
      },
      createdAt: dataset.dateAdded || dataset.createdAt?.toDate?.() || dataset.createdAt,
      updatedAt: dataset.lastModified || dataset.updatedAt?.toDate?.() || dataset.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: datasets,
        pagination: {
          count: datasets.length,
          total,
          offset,
          limit,
          hasMore: offset + limit < total,
        },
        filters: {
          search: searchQuery,
          license: licenseFilter,
          language: languageFilter,
          framework: frameworkFilter,
          tags: tagsFilter,
        },
        sort: sortBy,
      },
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pilot/datasets
 * Publish a new dataset to Datta Pilot
 */
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    // Step 1: Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid) {
      return createUnauthorizedResponse(validation.error);
    }

    const userId = validation.userId!;
    const connectionId = validation.connectionId!;

    // Step 2: Parse request body
    let payload: any;
    try {
      payload = await request.json();
    } catch (error) {
      return NextResponse.json(
        ValidationUtils.formatError('invalid_json', 'Request body must be valid JSON'),
        { status: 400 }
      );
    }

    // Step 3: Validate payload
    const payloadValidation = ValidationUtils.validatePublishDatasetPayload(payload);
    if (!payloadValidation.valid) {
      return NextResponse.json(
        ValidationUtils.formatValidationError(payloadValidation.errors!),
        { status: 400 }
      );
    }

    const validatedData = payloadValidation.data!;

    // Step 4: Check for duplicate dataset ID
    const userDatasetsRef = collection(db, 'users', userId, 'datasets');
    const duplicateQuery = query(userDatasetsRef, where('datasetId', '==', validatedData.datasetId));
    const duplicateSnapshot = await getDocs(duplicateQuery);

    if (!duplicateSnapshot.empty) {
      return NextResponse.json(
        ValidationUtils.formatError('duplicate_dataset', 'Dataset ID already exists for this user'),
        { status: 409 }
      );
    }

    // Step 5: Create dataset document
    const datasetId = doc(userDatasetsRef).id;
    const now = serverTimestamp();

    const newDataset = {
      id: datasetId,
      datasetId: validatedData.datasetId,
      name: validatedData.name,
      description: validatedData.description,
      sourceType: validatedData.sourceType,
      licenseType: validatedData.licenseType,
      status: 'published',
      visibility: validatedData.visibility as 'private' | 'request-only' | 'public',
      owner: {
        userId: userId,
        connectionId: connectionId,
        publishedAt: now,
      },
      metadata: {
        tags: validatedData.tags || [],
        quality: validatedData.quality || 3,
        language: payload.language || 'unknown',
        framework: payload.framework || 'unknown',
        documentation: payload.documentation || null,
      },
      stats: {
        downloads: 0,
        accessRequests: 0,
        approvedAccess: 0,
        ratings: {
          average: 0,
          count: 0,
        },
      },
      fileList: payload.fileList || [],
      accessControl: {
        requestApprovalRequired: validatedData.visibility === 'private' || validatedData.visibility === 'request-only',
        allowedUsers: [],
        deniedUsers: [],
      },
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // Step 6: Write to Firestore
    await setDoc(doc(userDatasetsRef, datasetId), newDataset);

    // Step 7: Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: datasetId,
          datasetId: validatedData.datasetId,
          name: validatedData.name,
          status: 'published',
          visibility: validatedData.visibility,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/pilot/datasets error:', error);

    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        return NextResponse.json(
          ValidationUtils.formatError('permission_denied', 'Insufficient permissions to publish dataset'),
          { status: 403 }
        );
      }
      if (error.message.includes('not-found')) {
        return NextResponse.json(
          ValidationUtils.formatError('resource_not_found', 'User or connection data not found'),
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      ValidationUtils.formatError('internal_error', 'Failed to publish dataset'),
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
