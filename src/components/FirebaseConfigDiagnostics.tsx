/**
 * FirebaseConfigDiagnostics.tsx
 * Displays Firebase configuration status and troubleshooting help
 * Add this to your layout for debugging authentication issues
 */

'use client'

import React, { useState, useEffect } from 'react';
import { validateFirebaseConfig, getFirebaseSetupInstructions, FirebaseConfigStatus } from '@/lib/firebaseConfigValidator';

export const FirebaseConfigDiagnostics: React.FC = () => {
  const [status, setStatus] = useState<FirebaseConfigStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const configStatus = validateFirebaseConfig();
    setStatus(configStatus);

    // Log to console for development
    if (configStatus.missingVariables.length > 0 || configStatus.errors.length > 0) {
      console.warn('⚠️ Firebase Configuration Issues Detected');
      console.warn('Click the 🔧 icon in the bottom-right to see details');
    }
  }, []);

  if (!status) return null;

  const hasIssues = !status.isConfigValid || status.warnings.length > 0;

  return (
    <>
      {/* Floating Diagnostic Button */}
      {hasIssues && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: status.isConfigValid ? '#fbbf24' : '#ef4444',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 9998,
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Firebase Configuration Status"
        >
          🔧
        </button>
      )}

      {/* Diagnostic Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '400px',
            maxHeight: '600px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 9998,
            overflow: 'auto',
            border: status.isConfigValid ? '2px solid #fbbf24' : '2px solid #ef4444'
          }}
        >
          <div style={{ padding: '16px' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                🔐 Firebase Config
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Status */}
            <div
              style={{
                padding: '8px',
                borderRadius: '6px',
                marginBottom: '12px',
                backgroundColor: status.isConfigValid ? '#dcfce7' : '#fee2e2',
                color: status.isConfigValid ? '#166534' : '#991b1b'
              }}
            >
              {status.isConfigValid ? '✅ Configuration Valid' : '❌ Configuration Issues'}
            </div>

            {/* Missing Variables */}
            {status.missingVariables.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 'bold', color: '#991b1b' }}>
                  Missing Variables:
                </h4>
                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px' }}>
                  {status.missingVariables.map((v) => (
                    <li key={v} style={{ color: '#666' }}>
                      <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>
                        {v}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errors */}
            {status.errors.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 'bold', color: '#991b1b' }}>
                  Errors:
                </h4>
                {status.errors.map((error, idx) => (
                  <p key={idx} style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                    • {error}
                  </p>
                ))}
              </div>
            )}

            {/* Warnings */}
            {status.warnings.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 'bold', color: '#b45309' }}>
                  Warnings:
                </h4>
                {status.warnings.map((warning, idx) => (
                  <p key={idx} style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                    ⚠️ {warning}
                  </p>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {status.suggestions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>
                  Suggestions:
                </h4>
                {status.suggestions.map((suggestion, idx) => (
                  <p key={idx} style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                    💡 {suggestion}
                  </p>
                ))}
              </div>
            )}

            {/* Current Domain */}
            <div style={{ marginBottom: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold' }}>
                Current Domain:
              </p>
              <code style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '6px 8px', 
                borderRadius: '4px', 
                fontSize: '11px',
                display: 'block',
                wordBreak: 'break-all'
              }}>
                {status.currentDomain}
              </code>
            </div>

            {/* Instructions Button */}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#0369a1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                marginTop: '12px'
              }}
            >
              {showInstructions ? 'Hide' : 'Show'} Setup Instructions
            </button>

            {/* Instructions */}
            {showInstructions && (
              <pre style={{
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '10px',
                overflow: 'auto',
                maxHeight: '300px',
                marginTop: '12px',
                marginBottom: 0,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {getFirebaseSetupInstructions()}
              </pre>
            )}
          </div>
        </div>
      )}
    </>
  );
};
