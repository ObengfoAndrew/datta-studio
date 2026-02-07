/**
 * GitHub OAuth Configuration Validator
 * Helps diagnose GitHub OAuth setup issues
 */

export interface GitHubOAuthConfigStatus {
  isConfigValid: boolean;
  missingVariables: string[];
  errors: string[];
  warnings: string[];
  suggestions: string[];
  currentDomain: string;
  expectedCallbackUrl: string;
}

export function validateGitHubOAuthConfig(): GitHubOAuthConfigStatus {
  const status: GitHubOAuthConfigStatus = {
    isConfigValid: true,
    missingVariables: [],
    errors: [],
    warnings: [],
    suggestions: [],
    currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    expectedCallbackUrl: ''
  };

  // Generate expected callback URL
  if (typeof window !== 'undefined') {
    status.expectedCallbackUrl = `${window.location.origin}/api/auth/github/callback`;
  }

  // Check required environment variables
  const requiredVars = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  };

  // Check for missing variables
  for (const [varName, value] of Object.entries(requiredVars)) {
    if (!value) {
      status.missingVariables.push(varName);
      status.isConfigValid = false;
    }
  }

  if (status.missingVariables.length > 0) {
    status.errors.push(
      `Missing required environment variables: ${status.missingVariables.join(', ')}`
    );
    status.suggestions.push(
      'Create or update .env.local with GitHub OAuth credentials from GitHub Developer Settings'
    );
  }

  // Check if client ID format looks valid (should be alphanumeric)
  if (requiredVars.GITHUB_CLIENT_ID && requiredVars.GITHUB_CLIENT_ID.length < 10) {
    status.warnings.push('GitHub Client ID appears to be too short');
  }

  if (requiredVars.NEXT_PUBLIC_GITHUB_CLIENT_ID && requiredVars.NEXT_PUBLIC_GITHUB_CLIENT_ID.length < 10) {
    status.warnings.push('NEXT_PUBLIC_GITHUB_CLIENT_ID appears to be too short');
  }

  // Check if client secret looks valid
  if (requiredVars.GITHUB_CLIENT_SECRET && requiredVars.GITHUB_CLIENT_SECRET.length < 20) {
    status.warnings.push('GitHub Client Secret appears to be too short');
  }

  return status;
}

export function logGitHubOAuthConfigStatus(): void {
  const status = validateGitHubOAuthConfig();
  
  console.group('🔐 GitHub OAuth Configuration Status');
  
  if (status.isConfigValid) {
    console.log('✅ Configuration appears valid');
  } else {
    console.error('❌ Configuration issues found');
  }

  if (status.missingVariables.length > 0) {
    console.error('Missing variables:', status.missingVariables);
  }

  if (status.errors.length > 0) {
    console.error('Errors:', status.errors);
  }

  if (status.warnings.length > 0) {
    console.warn('Warnings:', status.warnings);
  }

  if (status.suggestions.length > 0) {
    console.log('Suggestions:', status.suggestions);
  }

  console.log('Current domain:', status.currentDomain);
  console.log('Expected callback URL:', status.expectedCallbackUrl);
  console.groupEnd();
}

/**
 * Get GitHub OAuth setup instructions
 */
export function getGitHubOAuthSetupInstructions(): string {
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com';
  const callbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/github/callback`
    : `https://${domain}/api/auth/github/callback`;
  
  return `
GITHUB OAUTH SETUP CHECKLIST:
=============================

1. CREATE GITHUB OAUTH APP:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Or visit: https://github.com/settings/developers
   - Click "New OAuth App"
   
2. FILL IN OAUTH APP DETAILS:
   - Application name: "Datta Studio"
   - Homepage URL: https://${domain}
   - Application description: "Data management and AI training platform"
   - Authorization callback URL: ${callbackUrl}
   - Check "Enable Device Flow" (optional)
   - Click "Register application"

3. COPY CREDENTIALS:
   - Copy "Client ID"
   - Click "Generate a new client secret"
   - Copy the "Client Secret" (only shown once!)
   - Update .env.local:
     GITHUB_CLIENT_ID=your_client_id
     GITHUB_CLIENT_SECRET=your_client_secret
     NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id

4. CONFIGURE CALLBACK URL:
   Important: Make sure callback URL exactly matches:
   ${callbackUrl}
   
   Common mistakes:
   - Using http instead of https
   - Missing /api/auth/github/callback path
   - Including port number when not needed
   - Trailing slash differences

5. RESTART YOUR APPLICATION:
   - Stop dev server: Ctrl+C
   - Start dev server: npm run dev
   - Clear browser cache if needed

TESTING:
========
1. Go to your application
2. Click "Continue with GitHub"
3. You should be redirected to GitHub to authorize
4. After authorizing, you should be redirected back

COMMON ISSUES:
==============
• "redirect_uri_mismatch": Callback URL doesn't match
  → Check Authorization callback URL in GitHub App settings
  
• "access_denied": User clicked Cancel on GitHub
  → Have user try again and click "Authorize"
  
• "Popup blocked": Browser is blocking the popup
  → Whitelist your domain in popup blocker settings
  
• "GitHub OAuth is not properly configured"
  → Verify Client ID and Client Secret are correct
  → Restart dev server after updating .env.local
  
• "Cannot reach GitHub API"
  → Check internet connection
  → Check GitHub status: https://www.githubstatus.com
  → Try disabling VPN

ENVIRONMENT VARIABLES REFERENCE:
================================
GITHUB_CLIENT_ID                    - From GitHub App settings (server-side)
GITHUB_CLIENT_SECRET                - From GitHub App settings (server-side only!)
NEXT_PUBLIC_GITHUB_CLIENT_ID        - Client ID for frontend (public)

Note: Never expose GITHUB_CLIENT_SECRET in client code!
  `;
}

/**
 * Validate GitHub App callback URL configuration
 */
export function validateCallbackUrl(configuredUrl: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const valid = true;

  if (!configuredUrl.includes('http')) {
    issues.push('Callback URL must start with http:// or https://');
  }

  if (!configuredUrl.includes('/api/auth/github/callback')) {
    issues.push('Callback URL must end with /api/auth/github/callback');
  }

  if (configuredUrl.endsWith('/')) {
    issues.push('Callback URL should not have a trailing slash');
  }

  const expectedCallbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/auth/github/callback`
    : 'https://your-domain.com/api/auth/github/callback';

  if (configuredUrl !== expectedCallbackUrl && typeof window !== 'undefined') {
    issues.push(`Callback URL should be: ${expectedCallbackUrl}`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
