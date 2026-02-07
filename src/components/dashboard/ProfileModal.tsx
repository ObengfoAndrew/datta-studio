// src/components/dashboard/ProfileModal.tsx

import React, { useState, useEffect } from 'react';
import { X, User, Settings, FileText, Zap, DollarSign, Github, Database, File } from 'lucide-react';
import { User as FirebaseUser, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTheme } from '../shared/theme';
import { getDatasets } from '@/lib/datasetService';

// Helper function to ensure db is initialized
function ensureDb() {
  if (!db) throw new Error('Database not initialized');
  return db as any;
}

interface ProfileModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  isDarkMode,
  onClose,
  currentUser
}) => {
  const theme = getTheme(isDarkMode);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security' | 'billing'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.displayName || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [profileStats, setProfileStats] = useState({
    totalDatasets: 0,
    totalFiles: 0,
    totalEarnings: 0,
    apiConnections: 0
  });

  useEffect(() => {
    if (isOpen && currentUser) {
      loadProfileData();
      setEditName(currentUser.displayName || '');
      setEditEmail(currentUser.email || '');
    }
  }, [isOpen, currentUser]);

  const loadProfileData = async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.uid;
      const userDocRef = doc(ensureDb(), 'users', userId);

      // Get datasets
      const datasets = await getDatasets(userId);
      const totalEarnings = datasets.reduce((sum, d) => sum + (d.earnings?.monthlyRevenue || 0), 0);

      // Get API connections
      const aiLabsRef = collection(userDocRef, 'aiLabConnections');
      const aiLabsSnapshot = await getDocs(aiLabsRef);

      setProfileStats({
        totalDatasets: datasets.length,
        totalFiles: datasets.reduce((sum, d) => sum + (d.fileCount || 0), 0),
        totalEarnings,
        apiConnections: aiLabsSnapshot.size
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.uid;
      const userDocRef = doc(ensureDb(), 'users', userId);

      await setDoc(
        userDocRef,
        {
          displayName: editName,
          email: editEmail,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: editName
      });

      setIsEditing(false);
      alert('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Failed to update profile');
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'security' as const, label: 'Security', icon: Zap },
    { id: 'billing' as const, label: 'Billing', icon: DollarSign }
  ];

  const statCards = [
    { label: 'Total Datasets', value: profileStats.totalDatasets, icon: Database, color: '#3b82f6' },
    { label: 'Total Files', value: profileStats.totalFiles, icon: File, color: '#10b981' },
    { label: 'Monthly Earnings', value: `$${profileStats.totalEarnings.toFixed(2)}`, icon: DollarSign, color: '#f59e0b' },
    { label: 'API Connections', value: profileStats.apiConnections, icon: Code, color: '#8b5cf6' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.cardBg,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: theme.text, margin: 0 }}>
            Profile & Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textSecondary,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.text;
              e.currentTarget.style.backgroundColor = theme.borderLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textSecondary;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, padding: '0 32px', gap: '8px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
                color: activeTab === tab.id ? '#3b82f6' : theme.textSecondary,
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {activeTab === 'profile' && (
            <div>
              {/* Profile Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  marginBottom: '32px',
                  paddingBottom: '24px',
                  borderBottom: `1px solid ${theme.border}`
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: '700'
                  }}
                >
                  {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Display Name"
                        style={{
                          padding: '10px 16px',
                          border: `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          fontSize: '16px',
                          backgroundColor: theme.cardBg,
                          color: theme.text
                        }}
                      />
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Email"
                        style={{
                          padding: '10px 16px',
                          border: `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          fontSize: '16px',
                          backgroundColor: theme.cardBg,
                          color: theme.text
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleSaveProfile}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditName(currentUser?.displayName || '');
                            setEditEmail(currentUser?.email || '');
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: theme.borderLight,
                            color: theme.text,
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ fontSize: '24px', fontWeight: '700', color: theme.text, margin: '0 0 8px 0' }}>
                        {currentUser?.displayName || 'User'}
                      </h3>
                      <p style={{ fontSize: '14px', color: theme.textSecondary, margin: '0 0 16px 0' }}>
                        {currentUser?.email || 'No email'}
                      </p>
                      <button
                        onClick={() => setIsEditing(true)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: theme.borderLight,
                          color: theme.text,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '32px'
                }}
              >
                {statCards.map((stat, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: theme.activityBg,
                      padding: '20px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.borderLight}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          backgroundColor: `${stat.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: stat.color
                        }}
                      >
                        <stat.icon style={{ width: '20px', height: '20px' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: theme.text }}>
                          {stat.value}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Account Info */}
              <div style={{ backgroundColor: theme.activityBg, padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, margin: '0 0 16px 0' }}>
                  Account Information
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.textSecondary }}>User ID:</span>
                    <span style={{ color: theme.text, fontFamily: 'monospace', fontSize: '12px' }}>
                      {currentUser?.uid?.substring(0, 8)}...
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.textSecondary }}>Member Since:</span>
                    <span style={{ color: theme.text }}>
                      {currentUser?.metadata?.creationTime
                        ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.textSecondary }}>Account Type:</span>
                    <span style={{ color: '#10b981', fontWeight: '600', backgroundColor: '#10b98120', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      Premium
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: theme.text, margin: '0 0 24px 0' }}>
                Preferences
              </h3>
              <p style={{ color: theme.textSecondary }}>Settings coming soon</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: theme.text, margin: '0 0 24px 0' }}>
                Security Settings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: theme.activityBg, borderRadius: '8px' }}>
                  <div style={{ fontWeight: '600', color: theme.text, marginBottom: '8px' }}>
                    Connected Accounts
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '12px' }}>
                    Manage your connected authentication providers
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentUser?.providerData?.map((provider: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: theme.cardBg,
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {provider.providerId === 'github.com' && <Github style={{ width: '16px', height: '16px' }} />}
                          <span style={{ color: theme.text, fontSize: '14px' }}>
                            {provider.providerId === 'google.com' ? 'Google' : provider.providerId === 'github.com' ? 'GitHub' : provider.providerId}
                          </span>
                        </div>
                        <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '600' }}>
                          Connected
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: theme.text, margin: '0 0 24px 0' }}>
                Billing & Subscription
              </h3>
              <div
                style={{
                  padding: '24px',
                  backgroundColor: theme.activityBg,
                  borderRadius: '12px',
                  border: `2px solid #3b82f6`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <DollarSign style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontWeight: '600', color: theme.text, fontSize: '18px' }}>
                      Premium Plan
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                      Active subscription
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginTop: '20px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
                      Monthly Earnings
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
                      ${profileStats.totalEarnings.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
                      Next Payment
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
                      Free
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Code icon import at the top
const Code = ({ style }: { style?: React.CSSProperties }) => (
  <svg
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);