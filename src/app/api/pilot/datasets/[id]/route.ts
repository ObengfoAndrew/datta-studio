import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/apiKeyValidation';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * GET /api/pilot/datasets/[id]
 * Get detailed information about a specific dataset
 * Requires: X-API-Key header
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid) {
      return createUnauthorizedResponse(validation.error);
    }

    const datasetId = params.id;
    if (!datasetId) {
      return NextResponse.json(
        { error: 'Dataset ID is required' },
        { status: 400 }
      );
    }

    // Get dataset - query by id field (datasets are stored with id field)
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    const userDocRef = doc(db as any, 'users', validation.userId!);
    const datasetsRef = collection(userDocRef, 'datasets');
    const q = query(datasetsRef, where('id', '==', datasetId));
    const snapshot = await getDocs(q);
    
    let dataset: any;
    if (!snapshot.empty) {
      const datasetDoc = snapshot.docs[0];
      dataset = {
        id: datasetDoc.id,
        userId: validation.userId,
        ...datasetDoc.data(),
      };
    } else {
      // Try by document ID as fallback
      const allDatasets = await getDocs(datasetsRef);
      const found = allDatasets.docs.find(d => d.id === datasetId);
      if (!found) {
        return NextResponse.json(
          { error: 'Dataset not found' },
          { status: 404 }
        );
      }
      dataset = {
        id: found.id,
        userId: validation.userId,
        ...found.data(),
      };
    }

    // Return dataset details (without sensitive information)
    return NextResponse.json({
      id: dataset.id,
      name: dataset.sourceName,
      description: dataset.metadata.description || '',
      schema: {
        sourceType: dataset.sourceType,
        licenseType: dataset.licenseType,
        fileCount: dataset.fileCount,
        fileSize: dataset.fileSize,
      },
      sample: {
        languages: dataset.metadata.codeMetadata?.languages || {},
        frameworks: dataset.metadata.codeMetadata?.frameworks || [],
        totalLinesOfCode: dataset.metadata.codeMetadata?.totalLinesOfCode || 0,
        quality: dataset.metadata.codeMetadata?.codeQuality || {},
      },
      license: dataset.licenseType,
      access: 'request_required', // AI labs need to request access
      tags: dataset.metadata.tags || [],
      updatedAt: dataset.lastModified,
      metadata: {
        quality: dataset.metadata.quality,
        hasTests: dataset.metadata.codeMetadata?.codeQuality?.hasTests || false,
        hasDocumentation: dataset.metadata.codeMetadata?.codeQuality?.hasDocumentation || false,
      },
    });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}