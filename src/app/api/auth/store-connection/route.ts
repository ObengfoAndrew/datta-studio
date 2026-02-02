/**
 * POST /api/auth/store-connection
 * Helper endpoint for storing OAuth connection to Firestore
 * NOTE: Actual storage happens on client-side with Firebase SDK
 * This endpoint validates the connection data
 */

import { NextResponse } from 'next/server';

interface StoreConnectionRequest {
  provider: 'github' | 'gitlab' | 'bitbucket';
  accessToken: string;
  userData: {
    id: number;
    login?: string;
    username?: string;
    name: string;
    avatar_url?: string;
    email?: string;
    public_repos?: number;
  };
  reposData?: Array<{
    id: number;
    name: string;
    full_name: string;
    description?: string;
    url: string;
    size?: number;
    stargazers_count?: number;
    language?: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StoreConnectionRequest;

    const { provider, accessToken, userData, reposData } = body;

    if (!provider || !accessToken || !userData) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, accessToken, userData' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['github', 'gitlab', 'bitbucket'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Validate userData has required fields
    if (!userData.id || !userData.name) {
      return NextResponse.json(
        { error: 'userData must include id and name' },
        { status: 400 }
      );
    }

    // Validate access token format
    if (typeof accessToken !== 'string' || accessToken.length < 10) {
      return NextResponse.json({ error: 'Invalid access token format' }, { status: 400 });
    }

    console.log(`✅ Connection data validated for ${provider} (${userData.name})`);
    console.log(`   Repos: ${reposData?.length || 0}`);

    // Return validation success
    // Client will handle actual Firestore storage with user's auth token
    return NextResponse.json(
      {
        success: true,
        message: 'Connection data validated. Client should now store to Firestore.',
        connectionId: `${provider}_${userData.id}_${Date.now()}`,
        provider,
        username: userData.login || userData.username || userData.name,
        reposCount: reposData?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error validating connection:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to validate connection',
      },
      { status: 500 }
    );
  }
}
