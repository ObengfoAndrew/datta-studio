// src/components/dashboard/AILabsModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Database, Loader, AlertCircle } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { getDatasets } from '@/lib/datasetService';
import { getTheme } from '../shared/theme';
import { Dataset } from '../shared/types';

// Helper function to ensure db is initialized
function ensureDb() {
  if (!db) throw new Error('Database not initialized');
  return db as any;
}

interface AILabsModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  datasets: Dataset[];
}

export const AILabsModal: React.FC<AILabsModalProps> = ({
  isOpen,
  isDarkMode,
  onClose,
  isAuthenticated,
  currentUser,
  datasets
}) => {
  const theme = getTheme(isDarkMode);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [apiKey, setApiKey] = useState<string>('');
  const [connectionId, setConnectionId] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [modalDatasets, setModalDatasets] = useState<Dataset[]>(datasets);

  useEffect(() => {
    // Only check connection when modal first opens and user is authenticated
    if (isOpen && isAuthenticated && currentUser) {
      // Only check if we don't already have a connection loaded
      if (connectionStatus === 'idle' && !connectionId) {
        checkExistingConnection();
      }
    }
  }, [isOpen, isAuthenticated, currentUser]);

  // Fetch datasets when connection status changes to connected
  useEffect(() => {
    if (connectionStatus === 'connected' && isOpen) {
      fetchAndDisplayDatasets();
    }
  }, [connectionStatus, isOpen]);

  // Keep local state in sync with prop datasets
  useEffect(() => {
    // Filter to show only published datasets (also include datasets without status field)
    const publishedDatasets = datasets.filter((d) => !d.status || d.status === 'published');
    console.log(`📊 Filtered ${datasets.length} total datasets → ${publishedDatasets.length} published`);
    setModalDatasets(publishedDatasets);
  }, [datasets]);

  const fetchAndDisplayDatasets = async () => {
    try {
      setLoadingDatasets(true);
      console.log('📊 Fetching all published datasets for modal');
      
      // Fetch all published datasets from the public API endpoint
      const response = await fetch('/api/pilot/datasets/public');
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.datasets && Array.isArray(data.datasets)) {
        console.log('✅ Loaded', data.datasets.length, 'published datasets in modal');
        setModalDatasets(data.datasets);
      } else if (data.success && data.data && data.data.items) {
        console.log('✅ Loaded', data.data.items.length, 'published datasets in modal');
        setModalDatasets(data.data.items);
      } else if (Array.isArray(data)) {
        // In case the API returns an array directly
        console.log('✅ Loaded', data.length, 'published datasets in modal (direct array)');
        setModalDatasets(data);
      } else {
        console.warn('Unexpected API response format:', data);
        setModalDatasets([]);
      }
    } catch (error) {
      console.error('❌ Error fetching datasets in modal:', error);
      setModalDatasets([]);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const checkExistingConnection = async () => {
    try {
      const userDocRef = doc(ensureDb(), 'users', currentUser!.uid);
      const aiLabsRef = collection(userDocRef, 'aiLabConnections');
      const snapshot = await getDocs(aiLabsRef);

      if (!snapshot.empty) {
        const connection = snapshot.docs[0].data();
        setConnectionId(connection.connectionId);
        setConnectionStatus('connected');

        try {
          const response = await fetch(`/api/pilot/api-key?connectionId=${connection.connectionId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.apiKey) {
              setApiKey(data.apiKey);
            }
          }
        } catch (error) {
          console.error('Error fetching API key:', error);
        }

        // Fetch datasets for existing connections
        await fetchAndDisplayDatasets();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleConnectAILab = async () => {
    if (!isAuthenticated || !currentUser) {
      alert('Please sign in to enable AI lab connections.');
      return;
    }

    try {
      setConnectionStatus('connecting');

      const userId = currentUser.uid;
      console.log('🔌 Creating AI Lab connection for user:', userId);

      const userDocRef = doc(ensureDb(), 'users', userId);
      const aiLabsRef = collection(userDocRef, 'aiLabConnections');
      const newConnectionId = `ai_lab_${Math.random().toString(36).substr(2, 16)}`;

      // Create connection in Firestore
      await addDoc(aiLabsRef, {
        connectionId: newConnectionId,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastAccessed: null,
        datasetAccessCount: 0,
        authorizedDatasets: [],
        requestsProcessed: 0
      });

      console.log('✅ Firestore write successful');

      // Get API key from server
      const response = await fetch('/api/pilot/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: newConnectionId, userId })
      });

      const responseData = await response.json();

      if (response.ok) {
        const newApiKey = responseData.apiKey;

        // Save API key to Firestore
        const apiKeysRef = collection(userDocRef, 'apiKeys');
        await addDoc(apiKeysRef, {
          connectionId: newConnectionId,
          apiKey: newApiKey,
          status: 'active',
          createdAt: new Date().toISOString(),
          requestCount: 0,
          datasetAccessCount: 0
        });

        setApiKey(newApiKey);
        setConnectionId(newConnectionId);
        setConnectionStatus('connected');

        console.log('✅ AI Lab connection established successfully');
        
        // Fetch and display datasets after successful connection
        await fetchAndDisplayDatasets();
        
        alert(`✅ AI Lab connection enabled!\n\nAPI Key: ${newApiKey.substring(0, 20)}...`);
      } else {
        throw new Error(responseData.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('❌ Error enabling AI lab connection:', error);
      setConnectionStatus('idle');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to enable AI lab connection: ${errorMessage}`);
    }
  };

  const handleDisconnectAILab = async () => {
    if (!isAuthenticated || !currentUser || !connectionId) {
      alert('Not connected. Please sign in first.');
      return;
    }

    const confirmMessage =
      '⚠️ DISABLE AI LAB CONNECTION\n\n' +
      'Are you sure you want to disable the AI Lab connection?\n\n' +
      '• AI labs will no longer be able to access your datasets\n' +
      '• Your current API key will become invalid\n' +
      '• When you re-enable later, you\'ll receive a NEW API key\n\n' +
      'Do you want to continue?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setConnectionStatus('connecting');

      const userId = currentUser.uid;
      const userDocRef = doc(ensureDb(), 'users', userId);
      const aiLabsRef = collection(userDocRef, 'aiLabConnections');

      const snapshot = await getDocs(aiLabsRef);
      for (const connDoc of snapshot.docs) {
        await deleteDoc(connDoc.ref);
      }

      // Delete API keys
      const apiKeysRef = collection(userDocRef, 'apiKeys');
      const apiKeysSnapshot = await getDocs(apiKeysRef);
      for (const keyDoc of apiKeysSnapshot.docs) {
        if (keyDoc.data().connectionId === connectionId) {
          await deleteDoc(keyDoc.ref);
        }
      }

      console.log('✅ AI Lab connection disabled successfully');

      setConnectionStatus('idle');
      setApiKey('');
      setConnectionId('');
      setShowApiKey(false);

      alert('✅ AI Lab connection disabled successfully. Your datasets are no longer visible to external AI labs.');
    } catch (error) {
      console.error('❌ Error disabling AI lab connection:', error);
      setConnectionStatus('idle');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to disable AI lab connection: ${errorMessage}`);
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: theme.cardBg,
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '700px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: theme.textSecondary,
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X style={{ width: '20px', height: '20px' }} />
        </button>

        <h2 style={{ fontSize: '24px', fontWeight: '700', color: theme.text, marginBottom: '8px', marginTop: 0 }}>
          🔌 AI Labs Dataset Connection
        </h2>

        <p style={{ fontSize: '13px', color: theme.textSecondary, marginTop: 0, marginBottom: '24px' }}>
          Enable external AI laboratories and research teams to discover and access your datasets
        </p>

        {/* Connection Status Card */}
        <div
          style={{
            backgroundColor:
              connectionStatus === 'connected'
                ? isDarkMode
                  ? '#10b98115'
                  : '#d1fae515'
                : theme.activityBg,
            borderLeft: `4px solid ${connectionStatus === 'connected' ? '#10b981' : '#7c3aed'}`,
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor:
                  connectionStatus === 'connected'
                    ? '#10b981'
                    : connectionStatus === 'connecting'
                    ? '#f59e0b'
                    : '#9ca3af',
                animation: connectionStatus === 'connecting' ? 'pulse 2s infinite' : 'none'
              }}
            />
            <span
              style={{
                fontWeight: '600',
                color: theme.text,
                fontSize: '14px'
              }}
            >
              {connectionStatus === 'idle' && 'Not Connected'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'connected' && 'Connected'}
            </span>
          </div>
          {connectionStatus === 'connected' && (
            <p style={{ margin: 0, fontSize: '13px', color: theme.textSecondary }}>
              ✅ Your datasets are now discoverable by AI labs on the network
            </p>
          )}
        </div>

        {/* Available Datasets Section - Only show when connected */}
        {connectionStatus === 'connected' && (
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.text,
              marginTop: 0,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Database style={{ width: '16px', height: '16px' }} />
            Published Datasets ({modalDatasets.length})
          </h3>

          <div
            style={{
              backgroundColor: theme.activityBg,
              borderRadius: '12px',
              padding: '16px',
              maxHeight: '250px',
              overflowY: 'auto'
            }}
          >
            {loadingDatasets ? (
              <div style={{ textAlign: 'center', padding: '24px', color: theme.textSecondary }}>
                <Loader
                  style={{
                    width: '24px',
                    height: '24px',
                    margin: '0 auto 12px',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                <p style={{ margin: 0, fontSize: '13px' }}>Loading your datasets...</p>
              </div>
            ) : modalDatasets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: theme.textSecondary }}>
                <Database style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>
                  No published datasets yet. <br/> Upload and publish data to share with AI labs.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {modalDatasets.map((dataset, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      backgroundColor: theme.cardBg,
                      borderRadius: '8px',
                      borderLeft: '3px solid #7c3aed',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: '500',
                          color: theme.text,
                          fontSize: '13px',
                          marginBottom: '4px'
                        }}
                      >
                        {dataset.title || dataset.sourceName || 'Unnamed Dataset'}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                        {dataset.fileSize ? (dataset.fileSize / 1024 / 1024).toFixed(2) : 'Unknown'} MB {dataset.sourceType ? `• ${dataset.sourceType}` : ''}
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: isDarkMode ? '#10b98120' : '#10b98130',
                        color: '#10b981',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        marginLeft: '12px'
                      }}
                    >
                      Available
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* API Key Display */}
        {connectionStatus === 'connected' && apiKey && (
          <div
            style={{
              backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: theme.text,
                marginTop: 0,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔑 API Key
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <code
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: isDarkMode ? '#0f172a' : 'white',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: theme.text,
                  wordBreak: 'break-all'
                }}
              >
                {showApiKey ? apiKey : '•'.repeat(32)}
              </code>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  backgroundColor: theme.cardBg,
                  color: theme.text,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {showApiKey ? '👁️ Hide' : '👁️ Show'}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  alert('API key copied to clipboard!');
                }}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {connectionStatus !== 'connected' && (
            <button
              onClick={handleConnectAILab}
              disabled={connectionStatus === 'connecting'}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#7c3aed',
                color: 'white',
                cursor: connectionStatus === 'connecting' ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                opacity: connectionStatus === 'connecting' ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {connectionStatus === 'idle' && '🚀 Enable AI Lab Connection'}
              {connectionStatus === 'connecting' && '⏳ Connecting...'}
            </button>
          )}

          {connectionStatus === 'connected' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDisconnectAILab}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                🔌 Disable Connection
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: 'default',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                ✅ Connected
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              backgroundColor: theme.cardBg,
              color: theme.text,
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};