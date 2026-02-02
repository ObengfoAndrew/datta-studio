import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, createUnauthorizedResponse } from '@/lib/apiKeyValidation';

/**
 * POST /api/pilot/api-key
 * Create a new API key for a connection
 * Requires authentication (user context from client)
 * This endpoint generates and returns the API key
 * The actual storage is handled by the client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, userId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Generate API key on the server
    const apiKey = generateApiKey();

    return NextResponse.json({
      apiKey,
      connectionId,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to create API key: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Generate a secure API key
 */
function generateApiKey(): string {
  const prefix = 'datta_';
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}${randomPart}`;
}

/**
 * GET /api/pilot/api-key?connectionId=xxx
 * Validate/check if an API key exists
 * Requires X-API-Key header for validation
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const validation = await validateApiKey(request);
    if (!validation.valid) {
      return createUnauthorizedResponse(validation.error);
    }

    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      connectionId,
      userId: validation.userId,
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json(
      { error: 'Failed to validate API key' },
      { status: 500 }
    );
  }
}


