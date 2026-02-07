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
      setSignupLoading(false);

      if (error?.code === 'auth/popup-closed-by-user') {
        setSignupError('Sign-in was cancelled. Please try again.');
      } else if (error?.code === 'auth/popup-blocked') {
        setSignupError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (error?.code === 'auth/internal-error') {
        setSignupError('Authentication internal error. Check Firebase configuration and OAuth redirect domains in the Firebase Console.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        setSignupError('This domain is not authorized for OAuth. Add it to Firebase Console OAuth redirect domains.');
      } else {
        setSignupError(error?.message || 'Failed to sign in with Google. Please try again.');
      }
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
              setSignupError('Failed to create user profile: ' + error.message);
              setSignupLoading(false);
              window.removeEventListener('message', handleMessage);
            }
          })();
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout after 5 minutes
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setSignupLoading(false);
        setSignupError('GitHub sign-in timed out. Please try again.');
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
            setSignupError('Sign-in window was closed. Please try again.');
          }
        }
      }, 500);

    } catch (error: any) {
      console.error('❌ GitHub sign-in error:', error);
      setSignupLoading(false);
      setSignupError(error?.message || 'Failed to sign in with GitHub. Please try again.');
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
              fontSize: '14px',
              marginBottom: '16px',
              border: '1px solid #fecaca'
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