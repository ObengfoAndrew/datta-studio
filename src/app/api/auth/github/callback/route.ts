import { NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const MOCK_OAUTH = process.env.NEXT_PUBLIC_MOCK_OAUTH === 'true';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle GitHub OAuth error responses
  if (error) {
    console.error(`GitHub OAuth Error: ${error} - ${errorDescription}`);
    const errorHtml = `<!DOCTYPE html>
      <html><body style="font-family: sans-serif; padding: 20px;">
        <h2>GitHub OAuth Error</h2>
        <p><strong>Error:</strong> ${error}</p>
        <p><strong>Details:</strong> ${errorDescription || 'No details provided'}</p>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Common causes:
          <ul>
            <li><strong>redirect_uri_mismatch:</strong> The redirect URL in your code doesn't match GitHub app settings</li>
            <li>GitHub Authorization callback URL should be: <code>http://localhost:3000/api/auth/github/callback</code></li>
            <li><a href="https://github.com/settings/developers" target="_blank">Go to GitHub OAuth Apps Settings</a></li>
          </ul>
        </p>
        <button onclick="window.close()">Close</button>
      </body></html>`;
    return new Response(errorHtml, { 
      headers: { 'Content-Type': 'text/html' },
      status: 400
    });
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error('GitHub OAuth configuration missing: set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
    return NextResponse.json({ error: 'Configuration error: missing GitHub env vars' }, { status: 500 });
  }

  try {
    // Log for debugging
    console.log('=== GitHub OAuth Token Exchange START ===');
    console.log('Mock Mode:', MOCK_OAUTH ? '✅ ENABLED' : '❌ DISABLED');
    console.log('Client ID:', GITHUB_CLIENT_ID?.substring(0, 10) + '...');
    console.log('Code:', code?.substring(0, 10) + '...');

    let tokenData: any;

    if (MOCK_OAUTH) {
      // Mock OAuth response for development when GitHub is unreachable
      console.log('📦 Using mock OAuth data for development');
      tokenData = {
        access_token: 'ghu_mock_token_' + Math.random().toString(36).substring(7),
        scope: 'repo user',
        token_type: 'bearer',
      };
    } else {
      // Real GitHub OAuth token exchange
      const body = `client_id=${encodeURIComponent(GITHUB_CLIENT_ID)}&client_secret=${encodeURIComponent(GITHUB_CLIENT_SECRET)}&code=${encodeURIComponent(code)}`;
      
      console.log('Request body (sanitized):', body.replace(GITHUB_CLIENT_SECRET!, '***'));

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'Datta-Studio',
        },
        body: body,
      });

      console.log('Response status:', tokenResponse.status, tokenResponse.statusText);
      
      const responseText = await tokenResponse.text();
      console.log('Response body (first 200 chars):', responseText.substring(0, 200));

      // Check if response is ok before parsing JSON
      if (!tokenResponse.ok) {
        console.error('❌ GitHub API Error:', tokenResponse.status, responseText);
        return new Response(
          `<!DOCTYPE html>
          <html><body style="font-family: sans-serif; padding: 20px;">
            <h2>❌ GitHub API Error</h2>
            <p><strong>Status:</strong> ${tokenResponse.status} ${tokenResponse.statusText}</p>
            <p><strong>Details:</strong> ${responseText || 'No details provided'}</p>
            <p style="color: #666; margin-top: 20px;">
              <strong>Possible causes:</strong>
              <ul>
                <li><strong>Network Issue:</strong> Your network cannot reach github.com (firewall/proxy?)</li>
                <li><strong>Credentials:</strong> Client ID or Secret don't match GitHub OAuth app</li>
                <li><strong>Server Issue:</strong> GitHub OAuth endpoint is temporarily unavailable</li>
              </ul>
            </p>
            <p style="font-size: 12px; color: #999;">Try visiting <code>https://github.com</code> manually to verify internet access.</p>
            <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer;">Close & Try Again</button>
          </body></html>`,
          { 
            headers: { 'Content-Type': 'text/html' },
            status: 400
          }
        );
      }

      try {
        tokenData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', responseText);
        // GitHub sometimes returns form-encoded responses
        const params = new URLSearchParams(responseText);
        tokenData = Object.fromEntries(params);
        console.log('Parsed as form data:', Object.keys(tokenData));
      }
    }

    console.log('Token response keys:', Object.keys(tokenData));
    console.log('- Token data keys:', Object.keys(tokenData));
    
    if (tokenData.error) {
      console.error('GitHub Token Error:', tokenData.error, tokenData.error_description);
      return new Response(
        `<!DOCTYPE html>
        <html><body style="font-family: sans-serif; padding: 20px;">
          <h2>GitHub Token Error</h2>
          <p><strong>Error:</strong> ${tokenData.error}</p>
          <p><strong>Details:</strong> ${tokenData.error_description || 'No details provided'}</p>
          <p style="color: #666; margin-top: 20px;">
            <strong>Common causes:</strong>
            <ul>
              <li>Client ID/Secret mismatch - verify they match your GitHub OAuth app</li>
              <li>Code expired - GitHub auth codes expire after ~10 minutes, try again</li>
              <li>Wrong GitHub app - make sure you're using the correct OAuth app</li>
            </ul>
          </p>
          <p style="font-size: 12px; color: #999;">
            Verification: Check that GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local
            exactly match your GitHub OAuth app settings at https://github.com/settings/developers
          </p>
          <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer;">Close & Try Again</button>
        </body></html>`,
        { 
          headers: { 'Content-Type': 'text/html' },
          status: 400
        }
      );
    }

    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 400 });
    }

    const accessToken = tokenData.access_token as string;

    // Fetch user data and repos
    let userData: any;
    let reposData: any;

    if (MOCK_OAUTH) {
      // Mock user and repos data for development
      console.log('📦 Using mock user and repos data');
      userData = {
        id: 12345,
        login: 'demo-user',
        name: 'Demo User',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
        bio: 'Demo GitHub Account for Testing',
        public_repos: 5,
        email: 'demo@example.com',
      };
      reposData = [
        {
          id: 1,
          name: 'sample-repo-1',
          full_name: 'demo-user/sample-repo-1',
          description: 'Sample Repository 1 - Demonstrating OAuth Integration',
          url: 'https://github.com/demo-user/sample-repo-1',
          size: 2048,
          stargazers_count: 10,
          language: 'JavaScript',
          created_at: '2023-01-15T10:00:00Z',
          updated_at: '2024-12-01T15:30:00Z',
        },
        {
          id: 2,
          name: 'sample-repo-2',
          full_name: 'demo-user/sample-repo-2',
          description: 'Sample Repository 2 - Testing Repository',
          url: 'https://github.com/demo-user/sample-repo-2',
          size: 4096,
          stargazers_count: 25,
          language: 'Python',
          created_at: '2023-06-20T12:00:00Z',
          updated_at: '2024-11-28T08:15:00Z',
        },
        {
          id: 3,
          name: 'sample-repo-3',
          full_name: 'demo-user/sample-repo-3',
          description: 'Sample Repository 3 - Mock Data Demo',
          url: 'https://github.com/demo-user/sample-repo-3',
          size: 1024,
          stargazers_count: 5,
          language: 'TypeScript',
          created_at: '2024-03-10T14:00:00Z',
          updated_at: '2024-12-01T11:00:00Z',
        },
      ];
    } else {
      // Fetch real data from GitHub API
      const [userResponse, reposResponse] = await Promise.all([
        fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      userData = await userResponse.json();
      reposData = await reposResponse.json();
    }

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('GitHub OAuth Exception:', errorMessage, error);
    return new Response(
      `<!DOCTYPE html>
      <html><body style="font-family: sans-serif; padding: 20px;">
        <h2>GitHub OAuth Exception</h2>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <p style="color: #666; margin-top: 20px;">
          An unexpected error occurred while connecting to GitHub.
        </p>
        <details style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <summary>Technical Details</summary>
          <pre style="font-size: 12px; overflow-x: auto;">${errorMessage}</pre>
        </details>
        <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer; margin-top: 20px;">Close & Try Again</button>
      </body></html>`,
      { 
        headers: { 'Content-Type': 'text/html' },
        status: 500
      }
    );
  }
}