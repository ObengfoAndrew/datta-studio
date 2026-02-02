'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, Mail, Calendar, Database } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { getTheme } from '../shared/theme';

interface AccessRequest {
  id: string;
  aiLabName: string;
  datasetName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  apiKey?: string;
}

interface AccessTabProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
}

export const AccessTab: React.FC<AccessTabProps> = ({
  isOpen,
  isDarkMode,
  onClose,
  currentUser
}) => {
  const theme = getTheme(isDarkMode);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([
    {
      id: '1',
      aiLabName: 'TensorFlow Lab',
      datasetName: 'Code Repository Dataset',
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      id: '2',
      aiLabName: 'OpenAI Research',
      datasetName: 'Python Code Samples',
      requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    }
  ]);

  const handleApprove = async (requestId: string) => {
    try {
      // Generate API key for the requester
      const apiKey = `key_${Math.random().toString(36).substr(2, 32)}`;
      
      // Update request status
      setAccessRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'approved', apiKey }
            : req
        )
      );

      // TODO: Send API key to requester via email
      // TODO: Update Firestore with approval
      console.log('✅ Access approved for request:', requestId, 'API Key:', apiKey);
    } catch (error) {
      console.error('❌ Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setAccessRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'rejected', reason: 'Rejected by data creator' }
            : req
        )
      );

      // TODO: Send rejection email to requester
      // TODO: Update Firestore with rejection
      console.log('❌ Access rejected for request:', requestId);
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
    }
  };

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');
  const processedRequests = accessRequests.filter(r => r.status !== 'pending');

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
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 1000,
        paddingTop: '80px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.cardBg,
          borderRadius: '16px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: `1px solid ${theme.border}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: `1px solid ${theme.border}`
          }}
        >
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: theme.text, margin: '0 0 8px 0' }}>
              Access Requests
            </h2>
            <p style={{ fontSize: '14px', color: theme.textSecondary, margin: 0 }}>
              Review and approve requests from AI Labs to access your datasets
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '24px', height: '24px', color: theme.text }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.text, marginBottom: '16px' }}>
                Pending Requests ({pendingRequests.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequests.map(request => (
                  <div
                    key={request.id}
                    style={{
                      backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '4px', margin: 0 }}>
                        {request.aiLabName}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: theme.textSecondary }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Database style={{ width: '14px', height: '14px' }} />
                          {request.datasetName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar style={{ width: '14px', height: '14px' }} />
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleApprove(request.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#10b981';
                        }}
                      >
                        <Check style={{ width: '16px', height: '16px' }} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                        }}
                      >
                        <XCircle style={{ width: '16px', height: '16px' }} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processed Requests */}
          {processedRequests.length > 0 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: theme.text, marginBottom: '16px' }}>
                History ({processedRequests.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {processedRequests.map(request => (
                  <div
                    key={request.id}
                    style={{
                      backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      opacity: 0.7
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '4px', margin: 0 }}>
                        {request.aiLabName}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: theme.textSecondary }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Database style={{ width: '14px', height: '14px' }} />
                          {request.datasetName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar style={{ width: '14px', height: '14px' }} />
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {request.apiKey && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: theme.textSecondary }}>
                          API Key sent: {request.apiKey.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                    <div>
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: request.status === 'approved' ? '#d1fae5' : '#fee2e2',
                          color: request.status === 'approved' ? '#059669' : '#dc2626'
                        }}
                      >
                        {request.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {accessRequests.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: theme.textSecondary
              }}
            >
              <Mail style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No access requests yet</p>
              <p style={{ fontSize: '14px' }}>AI Labs will send requests when they want to access your datasets</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
