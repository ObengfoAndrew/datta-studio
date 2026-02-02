/**
 * GET /api/auth/gitlab/callback
 * GitLab OAuth callback handler
 * Exchanges authorization code for access token
 */

import { NextResponse } from 'next/server';

const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID || process.env.NEXT_PUBLIC_GITLAB_CLIENT_ID;
const GITLAB_CLIENT_SECRET = process.env.GITLAB_CLIENT_SECRET;
const GITLAB_INSTANCE = process.env.GITLAB_INSTANCE || 'https://gitlab.com';
const MOCK_OAUTH = process.env.NEXT_PUBLIC_MOCK_OAUTH === 'true';

interface GitLabUser {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar_url?: string;
  web_url?: string;
}

interface GitLabTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
  created_at?: number;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle GitLab OAuth error responses
  if (error) {
    console.error(`GitLab OAuth Error: ${error} - ${errorDescription}`);
    const errorHtml = `<!DOCTYPE html>
      <html><body style="font-family: sans-serif; padding: 20px;">
        <h2>GitLab OAuth Error</h2>
        <p><strong>Error:</strong> ${error}</p>
        <p><strong>Details:</strong> ${errorDescription || 'No details provided'}</p>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Common causes:
          <ul>
            <li><strong>redirect_uri_mismatch:</strong> The redirect URL doesn't match GitLab app settings</li>
            <li>GitLab Redirect URI should be: <code>${origin}/api/auth/gitlab/callback</code></li>
            <li><a href="https://gitlab.com/-/user_settings/applications" target="_blank">Go to GitLab OAuth Apps Settings</a></li>
          </ul>
        </p>
        <button onclick="window.close()">Close</button>
      </body></html>`;
    return new Response(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    });
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  if (!GITLAB_CLIENT_ID || !GITLAB_CLIENT_SECRET) {
    console.error('GitLab OAuth configuration missing: set GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET');
    return NextResponse.json(
      { error: 'Configuration error: missing GitLab env vars' },
      { status: 500 }
    );
  }

  try {
    console.log('=== GitLab OAuth Token Exchange START ===');
    console.log('Mock Mode:', MOCK_OAUTH ? '✅ ENABLED' : '❌ DISABLED');
    console.log('GitLab Instance:', GITLAB_INSTANCE);
    console.log('Client ID:', GITLAB_CLIENT_ID.substring(0, 10) + '...');
    console.log('Code:', code.substring(0, 10) + '...');

    const redirectUri = `${origin}/api/auth/gitlab/callback`;
    let tokenData: GitLabTokenResponse;
    let userData: GitLabUser;

    if (MOCK_OAUTH) {
      // Mock OAuth response for development
      console.log('📦 Using mock OAuth data for development');
      tokenData = {
        access_token: 'glpat_mock_token_' + Math.random().toString(36).substring(7),
        token_type: 'Bearer',
        expires_in: 7200,
      };
      userData = {
        id: 12345,
        username: 'demo.user',
        email: 'demo@datta.local',
        name: 'Demo User',
        avatar_url: 'https://www.gravatar.com/avatar/demo',
        web_url: `${GITLAB_INSTANCE}/demo.user`,
      };
    } else {
      // Real GitLab OAuth token exchange
      const tokenBody = new URLSearchParams({
        client_id: GITLAB_CLIENT_ID,
        client_secret: GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      console.log('Request to:', `${GITLAB_INSTANCE}/oauth/token`);

      const tokenResponse = await fetch(`${GITLAB_INSTANCE}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Datta-Studio',
        },
        body: tokenBody.toString(),
      });

      console.log('Token Response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const responseText = await tokenResponse.text();
        console.error('❌ GitLab Token API Error:', tokenResponse.status, responseText);
        return new Response(
          `<!DOCTYPE html>
          <html><body style="font-family: sans-serif; padding: 20px;">
            <h2>❌ GitLab OAuth Error</h2>
            <p><strong>Status:</strong> ${tokenResponse.status} ${tokenResponse.statusText}</p>
            <p><strong>Details:</strong> ${responseText || 'No details provided'}</p>
            <p style="color: #666; margin-top: 20px;">
              <strong>Possible causes:</strong>
              <ul>
                <li><strong>Network Issue:</strong> Cannot reach ${GITLAB_INSTANCE}</li>
                <li><strong>Credentials:</strong> Client ID or Secret don't match GitLab app</li>
                <li><strong>GitLab Instance:</strong> Check GITLAB_INSTANCE environment variable</li>
              </ul>
            </p>
          </body></html>`,
          {
            headers: { 'Content-Type': 'text/html' },
            status: tokenResponse.status,
          }
        );
      }

      tokenData = (await tokenResponse.json()) as GitLabTokenResponse;
      console.log('✅ Token exchange successful');

      // Fetch user data
      console.log('Fetching user data...');
      const userResponse = await fetch(`${GITLAB_INSTANCE}/api/v4/user`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Datta-Studio',
        },
      });

      if (!userResponse.ok) {
        const userError = await userResponse.text();
        console.error('❌ GitLab User API Error:', userResponse.status, userError);
        return NextResponse.json(
          { error: 'Failed to fetch GitLab user data' },
          { status: userResponse.status }
        );
      }

      userData = (await userResponse.json()) as GitLabUser;
      console.log('✅ User data fetched:', userData.username);
    }

    // Generate connection ID
    const connectionId = `gitlab_${userData.id}_${Date.now()}`;
    
    console.log('✅ GitLab OAuth successful');
    console.log('User:', userData.username);
    console.log('Connection ID:', connectionId);

    // Success HTML with connection details and token storage
    const successHtml = `<!DOCTYPE html>
      <html>
        <head>
          <title>GitLab OAuth Success</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; }
            .success { color: #10b981; font-size: 24px; font-weight: bold; }
            .details { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
            code { background: #fff; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            button { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="success">✅ GitLab Connection Successful!</div>
          <div class="details">
            <p><strong>User:</strong> ${userData.username}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Name:</strong> ${userData.name}</p>
            <p><strong>User ID:</strong> <code>${userData.id}</code></p>
            <p><strong>Connection ID:</strong> <code>${connectionId}</code></p>
            <p><strong>Token Type:</strong> ${tokenData.token_type}</p>
            <p><strong>Scope:</strong> <code>${tokenData.scope || 'read_user read_api read_repository'}</code></p>
          </div>
          <p style="color: #666; font-size: 14px;">You can now close this window and start using GitLab as a datasource.</p>
          <button onclick="
            // Store GitLab connection data in session storage
            const connectionData = {
              connectionId: '${connectionId}',
              accessToken: '${tokenData.access_token}',
              tokenType: '${tokenData.token_type}',
              userId: ${userData.id},
              username: '${userData.username}',
              email: '${userData.email}',
              name: '${userData.name}',
              avatar: '${userData.avatar_url || ''}',
              connectedAt: new Date().toISOString()
            };
            sessionStorage.setItem('gitlabConnection', JSON.stringify(connectionData));
            localStorage.setItem('gitlabConnection_' + ${userData.id}, JSON.stringify(connectionData));
            console.log('✅ GitLab connection stored:', connectionData);
            window.close();
          ">Store & Close Window</button>
        </body>
      </html>`;

    return new Response(successHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ GitLab OAuth Error:', error);
    
    const errorHtml = `<!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: sans-serif; padding: 40px;">
          <h2>❌ GitLab OAuth Error</h2>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p style="color: #666; font-size: 14px;">
            Check the server logs for more details.
          </p>
          <button onclick="window.history.back()">Go Back</button>
        </body>
      </html>`;

    return new Response(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
}
