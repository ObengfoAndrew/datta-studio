/**
 * GET /api/auth/bitbucket/callback
 * Bitbucket OAuth callback handler
 * Exchanges authorization code for access token
 */

import { NextResponse } from 'next/server';

const BITBUCKET_CLIENT_ID = process.env.BITBUCKET_CLIENT_ID;
const BITBUCKET_CLIENT_SECRET = process.env.BITBUCKET_CLIENT_SECRET;
const MOCK_OAUTH = process.env.NEXT_PUBLIC_MOCK_OAUTH === 'true';

interface BitbucketUser {
  uuid: string;
  username: string;
  display_name: string;
  email?: string;
  links?: {
    avatar?: {
      href: string;
    };
    html?: {
      href: string;
    };
  };
}

interface BitbucketTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle Bitbucket OAuth error responses
  if (error) {
    console.error(`Bitbucket OAuth Error: ${error} - ${errorDescription}`);
    const errorHtml = `<!DOCTYPE html>
      <html><body style="font-family: sans-serif; padding: 20px;">
        <h2>Bitbucket OAuth Error</h2>
        <p><strong>Error:</strong> ${error}</p>
        <p><strong>Details:</strong> ${errorDescription || 'No details provided'}</p>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Common causes:
          <ul>
            <li><strong>redirect_uri_mismatch:</strong> The redirect URL doesn't match Bitbucket app settings</li>
            <li>Bitbucket Redirect URI should be: <code>${origin}/api/auth/bitbucket/callback</code></li>
            <li><a href="https://bitbucket.org/account/settings/app-passwords" target="_blank">Go to Bitbucket App Passwords Settings</a></li>
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

  if (!BITBUCKET_CLIENT_ID || !BITBUCKET_CLIENT_SECRET) {
    console.error('Bitbucket OAuth configuration missing: set BITBUCKET_CLIENT_ID and BITBUCKET_CLIENT_SECRET');
    return NextResponse.json(
      { error: 'Configuration error: missing Bitbucket env vars' },
      { status: 500 }
    );
  }

  try {
    console.log('=== Bitbucket OAuth Token Exchange START ===');
    console.log('Mock Mode:', MOCK_OAUTH ? '✅ ENABLED' : '❌ DISABLED');
    console.log('Client ID:', BITBUCKET_CLIENT_ID.substring(0, 10) + '...');
    console.log('Code:', code.substring(0, 10) + '...');

    const redirectUri = `${origin}/api/auth/bitbucket/callback`;
    let tokenData: BitbucketTokenResponse;
    let userData: BitbucketUser;

    if (MOCK_OAUTH) {
      // Mock OAuth response for development
      console.log('📦 Using mock OAuth data for development');
      tokenData = {
        access_token: 'mock_token_' + Math.random().toString(36).substring(7),
        token_type: 'Bearer',
        expires_in: 3600,
      };
      userData = {
        uuid: '{12345678-1234-5678-1234-567812345678}',
        username: 'demo.user',
        display_name: 'Demo User',
        email: 'demo@datta.local',
        links: {
          avatar: {
            href: 'https://bitbucket.org/account/demo.user/avatar/',
          },
          html: {
            href: 'https://bitbucket.org/demo.user/',
          },
        },
      };
    } else {
      // Real Bitbucket OAuth token exchange
      const credentials = Buffer.from(`${BITBUCKET_CLIENT_ID}:${BITBUCKET_CLIENT_SECRET}`).toString('base64');
      
      const tokenBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      });

      console.log('Request to: https://bitbucket.org/site/oauth2/access_token');

      const tokenResponse = await fetch('https://bitbucket.org/site/oauth2/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
          'User-Agent': 'Datta-Studio',
        },
        body: tokenBody.toString(),
      });

      console.log('Token Response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const responseText = await tokenResponse.text();
        console.error('❌ Bitbucket Token API Error:', tokenResponse.status, responseText);
        return new Response(
          `<!DOCTYPE html>
          <html><body style="font-family: sans-serif; padding: 20px;">
            <h2>❌ Bitbucket OAuth Error</h2>
            <p><strong>Status:</strong> ${tokenResponse.status} ${tokenResponse.statusText}</p>
            <p><strong>Details:</strong> ${responseText || 'No details provided'}</p>
            <p style="color: #666; margin-top: 20px;">
              <strong>Possible causes:</strong>
              <ul>
                <li><strong>Network Issue:</strong> Cannot reach bitbucket.org</li>
                <li><strong>Credentials:</strong> Client ID or Secret don't match Bitbucket app</li>
              </ul>
            </p>
          </body></html>`,
          {
            headers: { 'Content-Type': 'text/html' },
            status: tokenResponse.status,
          }
        );
      }

      tokenData = (await tokenResponse.json()) as BitbucketTokenResponse;
      console.log('✅ Token exchange successful');

      // Fetch user data
      console.log('Fetching user data...');
      const userResponse = await fetch('https://api.bitbucket.org/2.0/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Datta-Studio',
        },
      });

      if (!userResponse.ok) {
        const userError = await userResponse.text();
        console.error('❌ Bitbucket User API Error:', userResponse.status, userError);
        return NextResponse.json(
          { error: 'Failed to fetch Bitbucket user data' },
          { status: userResponse.status }
        );
      }

      userData = (await userResponse.json()) as BitbucketUser;
      console.log('✅ User data fetched:', userData.username);
    }

    // Generate connection ID
    const connectionId = `bitbucket_${userData.uuid}_${Date.now()}`;
    
    console.log('✅ Bitbucket OAuth successful');
    console.log('User:', userData.username);
    console.log('Connection ID:', connectionId);

    // Success HTML with connection details and token storage
    const successHtml = `<!DOCTYPE html>
      <html>
        <head>
          <title>Bitbucket OAuth Success</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; }
            .success { color: #10b981; font-size: 24px; font-weight: bold; }
            .details { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
            code { background: #fff; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            button { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="success">✅ Bitbucket Connection Successful!</div>
          <div class="details">
            <p><strong>User:</strong> ${userData.username}</p>
            <p><strong>Display Name:</strong> ${userData.display_name}</p>
            <p><strong>UUID:</strong> <code>${userData.uuid}</code></p>
            <p><strong>Connection ID:</strong> <code>${connectionId}</code></p>
            <p><strong>Token Type:</strong> ${tokenData.token_type}</p>
            <p><strong>Scope:</strong> <code>${tokenData.scope || 'repository account'}</code></p>
          </div>
          <p style="color: #666; font-size: 14px;">You can now close this window and start using Bitbucket as a datasource.</p>
          <button onclick="
            // Store Bitbucket connection data in session storage
            const connectionData = {
              connectionId: '${connectionId}',
              accessToken: '${tokenData.access_token}',
              tokenType: '${tokenData.token_type}',
              uuid: '${userData.uuid}',
              username: '${userData.username}',
              displayName: '${userData.display_name}',
              email: '${userData.email || ''}',
              avatar: '${userData.links?.avatar?.href || ''}',
              connectedAt: new Date().toISOString()
            };
            sessionStorage.setItem('bitbucketConnection', JSON.stringify(connectionData));
            localStorage.setItem('bitbucketConnection_' + '${userData.uuid}', JSON.stringify(connectionData));
            console.log('✅ Bitbucket connection stored:', connectionData);
            window.close();
          ">Store & Close Window</button>
        </body>
      </html>`;

    return new Response(successHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Bitbucket OAuth Error:', error);
    
    const errorHtml = `<!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body style="font-family: sans-serif; padding: 40px;">
          <h2>❌ Bitbucket OAuth Error</h2>
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
