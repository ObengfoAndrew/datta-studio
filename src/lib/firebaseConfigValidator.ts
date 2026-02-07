/**
 * Firebase Configuration Validator
 * Helps diagnose Firebase setup issues
 */

export interface FirebaseConfigStatus {
  isConfigValid: boolean;
  missingVariables: string[];
  errors: string[];
  warnings: string[];
  suggestions: string[];
  currentDomain: string;
}

export function validateFirebaseConfig(): FirebaseConfigStatus {
  const status: FirebaseConfigStatus = {
    isConfigValid: true,
    missingVariables: [],
    errors: [],
    warnings: [],
    suggestions: [],
    currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
  };

  // Check required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const envVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // Check for missing variables
  for (const varName of requiredVars) {
    if (!envVars[varName as keyof typeof envVars]) {
      status.missingVariables.push(varName);
      status.isConfigValid = false;
    }
  }

  if (status.missingVariables.length > 0) {
    status.errors.push(
      `Missing required environment variables: ${status.missingVariables.join(', ')}`
    );
    status.suggestions.push(
      'Create or update .env.local with Firebase configuration from Firebase Console > Project Settings'
    );
  }

  // Validate format of API key
  if (envVars.NEXT_PUBLIC_FIREBASE_API_KEY) {
    if (envVars.NEXT_PUBLIC_FIREBASE_API_KEY.length < 30) {
      status.warnings.push('Firebase API Key appears to be too short');
    }
  }

  // Check if auth domain is properly formatted
  if (envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    if (!envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.includes('firebaseapp.com')) {
      status.warnings.push(
        'Auth domain should typically end with "firebaseapp.com"'
      );
    }
  }

  // Check OAuth redirect domains
  if (typeof window !== 'undefined') {
    const currentDomain = window.location.hostname;
    const isDevelopment = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
    
    if (!isDevelopment && !envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.includes(currentDomain)) {
      status.warnings.push(
        `Current domain (${currentDomain}) may not be added to Firebase OAuth redirect domains`
      );
      status.suggestions.push(
        `Add "${currentDomain}" to Firebase Console > Authentication > Settings > Authorized domains`
      );
    }
  }

  return status;
}

export function logFirebaseConfigStatus(): void {
  const status = validateFirebaseConfig();
  
  console.group('🔐 Firebase Configuration Status');
  
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
  console.groupEnd();
}

/**
 * Get Firebase Console setup instructions
 */
export function getFirebaseSetupInstructions(): string {
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com';
  
  return `
FIREBASE CONSOLE SETUP CHECKLIST:
================================

1. ENABLE GOOGLE AUTHENTICATION:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable "Google"
   - Set up OAuth consent screen if needed

2. ADD AUTHORIZED DOMAINS:
   - Go to Firebase Console > Authentication > Settings
   - Under "Authorized domains", add:
     • localhost
     • 127.0.0.1
     • ${domain}
   - Save and wait for deployment (can take a few minutes)

3. GET FIREBASE CONFIG:
   - Go to Firebase Console > Project Settings (⚙️)
   - Under "Your apps", find your Web app (</> icon)
   - Copy the Firebase config object
   - Update .env.local with these values:
     NEXT_PUBLIC_FIREBASE_API_KEY=...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     NEXT_PUBLIC_FIREBASE_APP_ID=...

4. RELOAD YOUR APPLICATION:
   - After updating Firebase Console, reload the page
   - Clear browser cache if still getting errors

TROUBLESHOOTING:
================
• auth/internal-error: Check Firebase config and authorized domains
• auth/unauthorized-domain: Add current domain to authorized domains
• auth/invalid-api-key: Verify NEXT_PUBLIC_FIREBASE_API_KEY
• Popups blocked: Allow popups for your domain in browser settings
  `;
}
