import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error('GitHub OAuth configuration missing: set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
    return NextResponse.json({ error: 'Configuration error: missing GitHub env vars' }, { status: 500 });
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 400 });
    }

    const accessToken = tokenData.access_token as string;

    const [userResponse, reposResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const userData = await userResponse.json();
    const reposData = await reposResponse.json();

    // Return lightweight HTML to postMessage back to opener (local only)
    return new Response(
      `<!DOCTYPE html>
      <html><body>
          <script>
          try {
            window.opener && window.opener.postMessage({ type: 'github-auth-success', data: { user: ${JSON.stringify(
              userData
            )}, repos: ${JSON.stringify(reposData)} } }, '*');
          } catch (e) {}
            window.close();
          </script>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    return NextResponse.json({ error: 'Failed to authenticate with GitHub' }, { status: 500 });
  }
}