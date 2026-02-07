// src/components/dashboard/AuthModals.tsx

'use client'

import React, { useState } from 'react';
import { Github } from 'lucide-react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getTheme } from '../shared/theme';

// Helper function to ensure db is initialized
function ensureDb() {
  if (!db) throw new Error('Database not initialized');
  return db as any;
}

interface AuthModalsProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onAuthSuccess: (user: FirebaseUser) => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isOpen,
  isDarkMode,
  onClose,
  onAuthSuccess
}) => {
  const theme = getTheme(isDarkMode);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 Google sign-in initiated...');
      setSignupLoading(true);
      setSignupError('');
      if (!auth) {
        setSignupLoading(false);
        setSignupError('Authentication not initialized. Check Firebase client config (NEXT_PUBLIC_... env vars) and reload the page.');
        return;
      }
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('✅ Google sign-in successful!', user.uid);

      // Store/update user profile in Firestore
      const userDocRef = doc(ensureDb(), 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Google User',
          photoURL: user.photoURL || '',
          authProvider: 'google',
          createdAt: new Date().toISOString(),
          dataSources: [],
          wallet: [],
          apiKeys: []
        },
        { merge: true }
      );

      console.log('✅ User profile updated in Firestore');

      setSignupError('');
      setSignupLoading(false);
      onAuthSuccess(user);
      onClose();
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      setSignupLoading(false);

      let errorMessage = '';
      
      if (error?.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error?.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error?.code === 'auth/internal-error') {
        errorMessage = `Authentication error. This usually means:\n\n1. Check your Firebase Configuration:\n   - Go to Firebase Console > Project Settings\n   - Copy your Web API credentials\n   - Ensure NEXT_PUBLIC_FIREBASE_* env vars are set\n\n2. Add OAuth Redirect Domains:\n   - Firebase Console > Authentication > Settings\n   - Add your current domain: ${typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com'}\n   - Also add: localhost, 127.0.0.1\n\n3. Reload the page after updating Firebase Console`;
      } else if (error?.code === 'auth/unauthorized-domain') {
        errorMessage = `Domain not authorized for OAuth.\n\nFix:\n1. Go to Firebase Console > Authentication > Settings\n2. Under "Authorized domains", add:\n   - ${typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com'}\n   - localhost\n   - 127.0.0.1\n3. Reload this page`;
      } else if (error?.code === 'auth/invalid-api-key') {
        errorMessage = 'Invalid Firebase API Key. Check your NEXT_PUBLIC_FIREBASE_API_KEY env var.';
      } else if (error?.code === 'auth/invalid-user-token') {
        errorMessage = 'Session expired. Please try again.';
      } else {
        errorMessage = error?.message || 'Failed to sign in with Google. Please try again.';
      }
      
      setSignupError(errorMessage);
    }
  };

  // GitHub Sign In Handler - Using custom OAuth popup instead of Firebase provider
  const handleGithubSignIn = async () => {
    try {
      console.log('🔐 GitHub sign-in initiated via custom OAuth flow...');
      setSignupLoading(true);
      setSignupError('');

      // Open GitHub OAuth in a popup window
      const popupWidth = 500;
      const popupHeight = 600;
      const popupLeft = window.screenX + (window.outerWidth - popupWidth) / 2;
      const popupTop = window.screenY + (window.outerHeight - popupHeight) / 2;

      const popup = window.open(
        '/api/auth/github/start',
        'github-auth',
        `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`
      );

      if (!popup) {
        setSignupLoading(false);
        setSignupError('Popup blocked. Please allow popups for this site.');
        return;
      }

      // Wait for postMessage from GitHub callback
      const handleMessage = (event: MessageEvent) => {
        // Validate origin for security
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'github-auth-success') {
          console.log('✅ GitHub OAuth callback received');
          const { user: githubUser, repos } = event.data.data;

          // Create user profile via API with admin permissions
          (async () => {
            try {
              const createUserResponse = await fetch('/api/auth/create-github-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: githubUser.id.toString(),
                  email: githubUser.email || `${githubUser.login}@github.com`,
                  displayName: githubUser.name || githubUser.login,
                  photoURL: githubUser.avatar_url,
                  githubLogin: githubUser.login
                })
              });

              if (!createUserResponse.ok) {
                const errorData = await createUserResponse.json();
                throw new Error(errorData.error || 'Failed to create user profile');
              }

              console.log('✅ User profile created via API');

              // Create a mock Firebase User object from GitHub data for local state
              const mockUser = {
                uid: githubUser.id.toString(),
                email: githubUser.email || `${githubUser.login}@github.com`,
                displayName: githubUser.name || githubUser.login,
                photoURL: githubUser.avatar_url,
                metadata: {
                  creationTime: new Date().toISOString(),
                  lastSignInTime: new Date().toISOString()
                },
                isAnonymous: false,
                emailVerified: !!githubUser.email,
                providerData: [{
                  uid: githubUser.id.toString(),
                  displayName: githubUser.name || githubUser.login,
                  photoURL: githubUser.avatar_url,
                  email: githubUser.email || `${githubUser.login}@github.com`,
                  phoneNumber: null,
                  providerId: 'github.com'
                }],
                getIdToken: async () => 'github-' + githubUser.id,
                getIdTokenResult: async () => ({ token: 'github-' + githubUser.id }),
                reload: async () => {},
                delete: async () => {},
                toJSON: () => ({})
              } as unknown as FirebaseUser;

              setSignupError('');
              setSignupLoading(false);
              onAuthSuccess(mockUser);
              onClose();
              window.removeEventListener('message', handleMessage);
            } catch (error: any) {
              console.error('❌ Error creating user profile:', error);
              console.error('Error details:', error);
              
              let errorMessage = '';
              if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorMessage = `GitHub API Error: Access denied. This usually means:\n\n1. GitHub OAuth App credentials may be invalid:\n   - Check GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET\n   - Verify they're correct in GitHub App Settings\n\n2. Token may have expired:\n   - Try signing in again\n\n3. User account issue:\n   - Ensure your GitHub account is active\n   - Check for 2FA requirements`;
              } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                errorMessage = `GitHub API Limit: Rate limited or forbidden. This usually means:\n\n1. GitHub API rate limit exceeded:\n   - Wait a few minutes and try again\n   - Limit is typically 5000/hour for authenticated requests\n\n2. GitHub OAuth App may need approval:\n   - Check GitHub App Settings\n   - Ensure app has required permissions\n\n3. Network connectivity issue:\n   - Check your internet connection`;
              } else if (error.message.includes('Failed to fetch')) {
                errorMessage = `Network Error: Cannot reach GitHub API.\n\nThis usually means:\n1. Network connectivity issue:\n   - Check your internet connection\n   - Try disabling VPN if using one\n\n2. GitHub API might be down:\n   - Check GitHub Status: https://www.githubstatus.com\n\n3. Browser privacy settings blocking request:\n   - Check browser's privacy/security settings\n   - Try a different browser`;
              } else {
                errorMessage = `Error creating user profile:\n\n${error.message}\n\nThis might be:\n• GitHub API is unreachable\n• User data from GitHub is incomplete\n• Server error processing your account\n\nTry again, or contact support if issue persists`;
              }
              
              setSignupError(errorMessage);
              setSignupLoading(false);
              window.removeEventListener('message', handleMessage);
            }
          })();
        } else if (event.data.type === 'github-auth-error') {
          console.error('❌ GitHub OAuth error received:', event.data.error);
          
          let errorMessage = '';
          const errorCode = event.data.error;
          
          if (errorCode === 'access_denied') {
            errorMessage = `GitHub OAuth Denied.\n\nYou clicked "Cancel" or denied permissions.\n\nTo authorize:\n1. Click "Continue with GitHub" again\n2. Click "Authorize" on the GitHub permission screen\n3. Do not click "Cancel"`;
          } else if (errorCode === 'redirect_uri_mismatch') {
            errorMessage = `Redirect URI Mismatch.\n\nThe GitHub OAuth redirect is misconfigured.\n\nFix:\n1. Go to GitHub Settings > Developer settings > OAuth Apps\n2. Find your app: "Datta Studio"\n3. Verify "Authorization callback URL" is:\n   ${typeof window !== 'undefined' ? window.location.origin + '/api/auth/github/callback' : 'your-domain.com/api/auth/github/callback'}\n4. Save and try again`;
          } else if (errorCode === 'invalid_scope') {
            errorMessage = `GitHub OAuth Scope Error.\n\nThe requested permissions are invalid.\n\nFix:\n1. Check GitHub OAuth App settings\n2. Valid scopes are: repo, read:user, user:email\n3. Contact support if issue persists`;
          } else {
            errorMessage = `GitHub OAuth Error: ${errorCode}\n\nThis usually means:\n1. GitHub OAuth is not properly configured\n2. Check GitHub Developer Settings > OAuth Apps\n3. Verify:\n   - Client ID is correct\n   - Client Secret is correct\n   - Authorization callback URL matches\n4. If still failing, create a new OAuth App`;
          }
          
          setSignupError(errorMessage);
          setSignupLoading(false);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout after 5 minutes
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setSignupLoading(false);
        setSignupError('GitHub sign-in timed out (5 minutes).\n\nThis usually means:\n1. GitHub OAuth window was left open too long\n2. Network connection was lost\n3. Browser privacy settings blocked the request\n\nTry again and complete sign-in within 5 minutes.');
      }, 5 * 60 * 1000);

      // Check if popup was closed
      const popupCheckInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(popupCheckInterval);
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          // Only set error if we didn't already succeed
          if (signupLoading) {
            setSignupLoading(false);
            setSignupError('GitHub sign-in window was closed.\n\nThis usually means:\n1. You accidentally closed the popup\n2. Browser privacy settings closed it\n3. Another app blocked the popup\n\nTry again and keep the popup window open until sign-in completes.');
          }
        }
      }, 500);

    } catch (error: any) {
      console.error('❌ GitHub sign-in error:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      setSignupLoading(false);
      
      let errorMessage = '';
      if (error?.message?.includes('popup') || error?.message?.includes('Popup')) {
        errorMessage = `Popup Error.\n\nThe GitHub sign-in popup couldn't be opened.\n\nFix:\n1. Check if popup blocker is enabled\n2. Add this site to popup whitelist\n3. Try a different browser\n4. Disable browser extensions that block popups`;
      } else {
        errorMessage = `GitHub Sign-In Error:\n\n${error?.message || 'Unknown error'}\n\nTroubleshooting:\n1. Check your internet connection\n2. Verify GitHub is not down (https://www.githubstatus.com)\n3. Clear browser cache and try again\n4. Try a different browser\n5. Check browser console (F12) for more details`;
      }
      
      setSignupError(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'auto'
      }}
    >
      <div
        style={{
          backgroundColor: theme.cardBg,
          borderRadius: '20px',
          padding: '48px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          border: `1px solid ${theme.borderLight}`,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
          }}
        >
          D
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: theme.text,
            margin: '0 0 8px 0'
          }}
        >
          Welcome to Datta Studio
        </h1>

        <p
          style={{
            fontSize: '16px',
            color: theme.textSecondary,
            margin: '0 0 24px 0',
            lineHeight: '1.5'
          }}
        >
          Turn your work, code, and creativity into data that earns everytime it trains AI
        </p>

        {/* Error Message */}
        {signupError && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #fecaca',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {signupError}
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={signupLoading}
          style={{
            width: '100%',
            backgroundColor: signupLoading ? '#f5f5f5' : 'white',
            color: signupLoading ? '#9ca3af' : '#1f2937',
            border: '1px solid #dadce0',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: signupLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            opacity: signupLoading ? 0.7 : 1,
            marginBottom: '12px'
          }}
          onMouseEnter={(e) => {
            if (!signupLoading) {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* GitHub Sign-in Button */}
        <button
          onClick={handleGithubSignIn}
          disabled={signupLoading}
          style={{
            width: '100%',
            backgroundColor: signupLoading ? '#f5f5f5' : (isDarkMode ? '#1f2937' : '#000000'),
            color: 'white',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: signupLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            opacity: signupLoading ? 0.7 : 1,
            marginBottom: '12px'
          }}
          onMouseEnter={(e) => {
            if (!signupLoading) {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Github style={{ width: '20px', height: '20px' }} />
          Continue with GitHub
        </button>

        {/* Footer */}
        <p
          style={{
            fontSize: '12px',
            color: theme.textSecondary,
            margin: '0',
            lineHeight: '1.4'
          }}
        >
          By signing in, you agree to our{' '}
          <a
            href="#"
            style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}
          >
            Terms of Service
          </a>
          {' '}and{' '}
          <a
            href="#"
            style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};