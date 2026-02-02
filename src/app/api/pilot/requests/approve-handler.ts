/**
 * POST /api/pilot/requests/{requestId}/approve
 * Approve or reject an access request for a dataset
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKeyValidation';
import { ValidationUtils } from '@/lib/validationUtils';
import { approveAccessRequest, rejectAccessRequest } from '@/lib/datasetApproval';

interface RouteParams {
  requestId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // Step 1: Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }

    const userId = validation.userId!;
    const requestId = params.requestId;

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
    const payloadValidation = ValidationUtils.validateAccessRequestPayload(payload);
    if (!payloadValidation.valid) {
      return NextResponse.json(
        ValidationUtils.formatValidationError(payloadValidation.errors!),
        { status: 400 }
      );
    }

    // Step 4: Extract required fields from query parameters
    const searchParams = request.nextUrl.searchParams;
    const datasetId = searchParams.get('datasetId');

    if (!datasetId) {
      return NextResponse.json(
        ValidationUtils.formatError('missing_parameter', 'datasetId query parameter is required'),
        { status: 400 }
      );
    }

    // Step 5: Process based on action
    const action = payload.action;
    let result;

    if (action === 'approve') {
      result = await approveAccessRequest(
        userId,
        datasetId,
        requestId,
        payload.accessDurationDays,
        payload.notes
      );
    } else if (action === 'reject') {
      result = await rejectAccessRequest(userId, datasetId, requestId, payload.notes);
    } else {
      return NextResponse.json(
        ValidationUtils.formatError('invalid_action', "Action must be 'approve' or 'reject'"),
        { status: 400 }
      );
    }

    // Step 6: Return result
    if (!result.success) {
      // Determine appropriate status code
      let statusCode = 500;
      if (result.error === 'REQUEST_NOT_FOUND') {
        statusCode = 404;
      } else if (result.error === 'DATASET_NOT_FOUND') {
        statusCode = 404;
      } else if (result.error === 'REQUEST_NOT_PENDING') {
        statusCode = 409; // Conflict
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'UNKNOWN_ERROR',
          message: result.message,
        },
        { status: statusCode }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          requestId: result.requestId,
          status: result.status,
          message: result.message,
          ...(result.downloadUrl && { downloadUrl: result.downloadUrl }),
          ...(result.expiresAt && { expiresAt: result.expiresAt.toISOString() }),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/pilot/requests/[requestId]/approve error:', error);

    return NextResponse.json(
      ValidationUtils.formatError('internal_error', 'Failed to process request'),
      { status: 500 }
    );
  }
}
