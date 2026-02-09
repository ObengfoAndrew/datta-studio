// src/components/dashboard/AuthModals.tsx

'use client'

import React, { useState } from 'react';
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
            marginBottom: '16px'
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