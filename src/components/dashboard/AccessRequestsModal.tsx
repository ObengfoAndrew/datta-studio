'use client';

import React, { useState } from 'react';
import { X, Check, XCircle, Copy, CheckCircle } from 'lucide-react';
import { AccessRequest } from '@/lib/types';
import { getTheme } from '../shared/theme';

interface AccessRequestsModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  requests: AccessRequest[];
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  selectedRequestId?: string;
}

export const AccessRequestsModal: React.FC<AccessRequestsModalProps> = ({
  isOpen,
  isDarkMode,
  onClose,
  requests,
  onApprove,
  onReject,
  selectedRequestId,
}) => {
  const theme = getTheme(isDarkMode);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await onApprove(requestId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await onReject(requestId);
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
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
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
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
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.text, margin: 0 }}>
            Dataset Access Requests
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.textSecondary
            }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 16px' }} />
              <p style={{ color: theme.textSecondary, fontSize: '16px' }}>
                No access requests at this time
              </p>
            </div>
          ) : (
            <>
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '16px' }}>
                    Pending Requests ({pendingRequests.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        style={{
                          padding: '16px',
                          backgroundColor: request.id === selectedRequestId 
                            ? (isDarkMode ? '#1e3a3a' : '#d1fae5')
                            : (isDarkMode ? '#1e293b' : '#f8fafc'),
                          borderRadius: '8px',
                          border: request.id === selectedRequestId
                            ? '2px solid #10b981'
                            : `1px solid ${theme.border}`,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: theme.text, margin: '0 0 4px 0' }}>
                              {request.aiLabName}
                            </p>
                            <p style={{ fontSize: '13px', color: theme.textSecondary, margin: 0 }}>
                              {request.requesterEmail}
                            </p>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#fbbf24',
                            color: '#000',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Pending
                          </span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '4px' }}>
                            <strong>Dataset:</strong> {request.datasetName}
                          </p>
                          <p style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '4px' }}>
                            <strong>Purpose:</strong> {request.purpose}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              opacity: processingId === request.id ? 0.7 : 1
                            }}
                          >
                            <Check style={{ width: '16px', height: '16px' }} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              opacity: processingId === request.id ? 0.7 : 1
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

              {/* Approved Requests */}
              {approvedRequests.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, marginBottom: '16px' }}>
                    Approved Requests ({approvedRequests.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {approvedRequests.map((request) => (
                      <div
                        key={request.id}
                        style={{
                          padding: '16px',
                          backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                          borderRadius: '8px',
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: theme.text, margin: '0 0 4px 0' }}>
                              {request.aiLabName}
                            </p>
                            <p style={{ fontSize: '13px', color: theme.textSecondary, margin: 0 }}>
                              {request.requesterEmail}
                            </p>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Approved
                          </span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '4px' }}>
                            <strong>Dataset:</strong> {request.datasetName}
                          </p>
                        </div>
                        {request.apiKey && (
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: isDarkMode ? '#0f172a' : '#f0fdf4',
                              borderRadius: '6px',
                              border: `1px solid ${isDarkMode ? '#334155' : '#bbf7d0'}`
                            }}
                          >
                            <p style={{ fontSize: '12px', color: theme.textSecondary, margin: '0 0 8px 0' }}>
                              API Key (expires {request.expiresAt}):
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <code
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  backgroundColor: theme.cardBg,
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: theme.text,
                                  wordBreak: 'break-all',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {request.apiKey}
                              </code>
                              <button
                                onClick={() => copyToClipboard(request.apiKey!, request.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: copiedKey === request.id ? '#10b981' : theme.border,
                                  color: copiedKey === request.id ? 'white' : theme.textSecondary,
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {copiedKey === request.id ? (
                                  <>
                                    <Check style={{ width: '14px', height: '14px' }} />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy style={{ width: '14px', height: '14px' }} />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
