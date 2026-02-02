/**
 * GET /api/auth/bitbucket/start
 * Initiates Bitbucket OAuth flow
 */

import { NextResponse } from 'next/server';

const BITBUCKET_CLIENT_ID = process.env.BITBUCKET_CLIENT_ID || process.env.NEXT_PUBLIC_BITBUCKET_CLIENT_ID;
const BITBUCKET_REDIRECT_URI = process.env.BITBUCKET_REDIRECT_URI;

export async function GET(request: Request) {
  if (!BITBUCKET_CLIENT_ID) {
    console.error('Bitbucket OAuth configuration missing: set BITBUCKET_CLIENT_ID (or NEXT_PUBLIC_BITBUCKET_CLIENT_ID)');
    return NextResponse.json(
      { error: 'Configuration error: missing Bitbucket Client ID' },
      { status: 500 }
    );
  }

  const { origin } = new URL(request.url);
  const redirectUri = BITBUCKET_REDIRECT_URI || `${origin}/api/auth/bitbucket/callback`;

  const params = new URLSearchParams({
    client_id: BITBUCKET_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'repository account',
  });

  const authUrl = `https://bitbucket.org/site/oauth2/authorize?${params.toString()}`;
  
  console.log('Bitbucket OAuth Start:');
  console.log('  Client ID:', BITBUCKET_CLIENT_ID.substring(0, 10) + '...');
  console.log('  Redirect URI:', redirectUri);
  console.log('  Auth URL:', authUrl.substring(0, 100) + '...');

  return NextResponse.redirect(authUrl);
}
