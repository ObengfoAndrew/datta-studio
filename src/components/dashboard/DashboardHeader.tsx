// src/components/dashboard/DashboardHeader.tsx

import React from 'react';
import {
  Search,
  Moon,
  Sun,
  Code,
  User,
  LogOut,
  Bell
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getTheme } from '../shared/theme';

interface DashboardHeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  onProfileClick: () => void;
  onLogout: () => void;
  onAILabsClick: () => void;
  onSignIn: () => void;
  onAccessClick?: () => void;
  accessRequestCount?: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  isAuthenticated,
  currentUser,
  onProfileClick,
  onLogout,
  onAILabsClick,
  onSignIn,
  onAccessClick,
  accessRequestCount = 0
}) => {
  const theme = getTheme(isDarkMode);

  return (
    <header
      style={{
        backgroundColor: theme.cardBg,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: theme.text, margin: 0 }}>
          DATTA
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: theme.textSecondary
            }}
          />
          <input
            type="text"
            placeholder="Search..."
            style={{
              paddingLeft: '36px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: theme.searchBg,
              width: '200px',
              color: theme.text
            }}
          />
        </div>

        {/* Access Tab Button */}
        {isAuthenticated && (
          <button
            onClick={onAccessClick}
            style={{
              position: 'relative',
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: theme.text,
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.cardBg;
            }}
            title="Review access requests"
          >
            <Bell style={{ width: '18px', height: '18px' }} />
            Access
            {accessRequestCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                {accessRequestCount > 9 ? '9+' : accessRequestCount}
              </span>
            )}
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          style={{
            padding: '8px',
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.cardBg,
            cursor: 'pointer'
          }}
        >
          {isDarkMode ? (
            <Sun style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
          ) : (
            <Moon style={{ width: '18px', height: '18px', color: theme.textSecondary }} />
          )}
        </button>

        {/* AI Labs Button or Sign In */}
        {!isAuthenticated ? (
          <button
            onClick={onSignIn}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Sign Up
          </button>
        ) : (
          <>
            <button
              onClick={onAILabsClick}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#7c3aed',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#a78bfa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#7c3aed';
              }}
              title="Connect AI Labs to access your datasets"
            >
              <Code style={{ width: '16px', height: '16px' }} />
              AI Labs API
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>
                  {currentUser?.displayName || 'User'}
                </div>
                <div style={{ fontSize: '12px', color: theme.textSecondary }}>Premium Member</div>
              </div>
              <button
                onClick={onProfileClick}
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                title="View Profile"
              >
                <User style={{ width: '18px', height: '18px', color: 'white' }} />
              </button>
              <button
                onClick={onLogout}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #ef4444',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fecaca';
                  e.currentTarget.style.borderColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};