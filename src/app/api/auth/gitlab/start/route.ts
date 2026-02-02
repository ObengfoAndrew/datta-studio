/**
 * GET /api/auth/gitlab/start
 * Initiates GitLab OAuth flow
 */

import { NextResponse } from 'next/server';

const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID || process.env.NEXT_PUBLIC_GITLAB_CLIENT_ID;
const GITLAB_INSTANCE = process.env.GITLAB_INSTANCE || 'https://gitlab.com';
const GITLAB_REDIRECT_URI = process.env.GITLAB_REDIRECT_URI; // Optional: override redirect URI for different ports

export async function GET(request: Request) {
  if (!GITLAB_CLIENT_ID) {
    console.error('GitLab OAuth configuration missing: set GITLAB_CLIENT_ID (or NEXT_PUBLIC_GITLAB_CLIENT_ID)');
    return NextResponse.json(
      { error: 'Configuration error: missing GitLab Client ID' },
      { status: 500 }
    );
  }

  const { origin } = new URL(request.url);
  const redirectUri = GITLAB_REDIRECT_URI || `${origin}/api/auth/gitlab/callback`;

  const params = new URLSearchParams({
    client_id: GITLAB_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read_user read_api read_repository',
    state: Math.random().toString(36).substring(7),
  });

  const authUrl = `${GITLAB_INSTANCE}/oauth/authorize?${params.toString()}`;
  
  console.log('GitLab OAuth Start:');
  console.log('  Instance:', GITLAB_INSTANCE);
  console.log('  Client ID:', GITLAB_CLIENT_ID.substring(0, 10) + '...');
  console.log('  Redirect URI:', redirectUri);
  console.log('  Auth URL:', authUrl.substring(0, 100) + '...');

  return NextResponse.redirect(authUrl);
}
