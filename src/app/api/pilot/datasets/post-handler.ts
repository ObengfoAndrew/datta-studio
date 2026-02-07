/**
 * POST /api/pilot/datasets
 * Publish a new dataset to Datta Pilot
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKeyValidation';
import { ValidationUtils } from '@/lib/validationUtils';
import { PublishDatasetPayload, Dataset } from '@/lib/week2Types';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    // Step 1: Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid) {
      return NextResponse.json(validation.error, { status: 401 });
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
    const datasetId = doc(userDatasetsRef).id; // Generate Firestore doc ID
    const now = serverTimestamp();

    const newDataset: Dataset = {
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
        publishedAt: now as any,
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
      createdAt: now as any,
      updatedAt: now as any,
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

    // Handle Firestore-specific errors
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
