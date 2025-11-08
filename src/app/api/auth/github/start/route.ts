import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

export async function GET(request: Request) {
  if (!GITHUB_CLIENT_ID) {
    console.error('GitHub OAuth configuration missing: set GITHUB_CLIENT_ID (or NEXT_PUBLIC_GITHUB_CLIENT_ID)');
    return NextResponse.json({ error: 'Configuration error: missing GitHub Client ID' }, { status: 500 });
  }

  const { origin } = new URL(request.url);
  const redirectUri = `${origin}/api/auth/github/callback`;

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user user:email repo',
    state: Math.random().toString(36).substring(7)
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}