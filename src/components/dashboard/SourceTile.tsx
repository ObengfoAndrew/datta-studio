'use client';

import React, { useState } from 'react';
import { SourceDefinition } from '@/lib/types';
import { ChevronRight, Loader } from 'lucide-react';

interface SourceTileProps {
  source: SourceDefinition;
  isDarkMode: boolean;
  isLoading?: boolean;
  onConnect?: () => void;
  onUpload?: () => void;
}

const SourceTile: React.FC<SourceTileProps> = ({
  source,
  isDarkMode,
  isLoading = false,
  onConnect,
  onUpload,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const theme = {
    light: {
      bg: 'white',
      bgHover: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      borderHover: '#cbd5e1',
      button: '#3b82f6',
      buttonHover: '#2563eb',
    },
    dark: {
      bg: '#1e293b',
      bgHover: '#334155',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#475569',
      borderHover: '#64748b',
      button: '#3b82f6',
      buttonHover: '#2563eb',
    },
  };

  const current = isDarkMode ? theme.dark : theme.light;
  const isOAuth = source.requiresOAuth;
  const actionLabel = isOAuth ? 'Connect' : 'Upload';
  const actionHandler = isOAuth ? onConnect : onUpload;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '12px',
        border: `2px solid ${isHovered ? current.borderHover : current.border}`,
        backgroundColor: isHovered ? current.bgHover : current.bg,
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backdropFilter: 'blur(10px)',
        boxShadow: isHovered
          ? `0 10px 30px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'}`
          : `0 2px 8px ${isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '48px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          backgroundColor: current.bgHover,
          borderRadius: '12px',
          animation: isHovered ? 'scale 0.3s ease-out' : 'none',
        }}
      >
        {source.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: current.text,
            margin: '0 0 8px 0',
          }}
        >
          {source.name}
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: current.textSecondary,
            margin: '0 0 16px 0',
            lineHeight: '1.5',
          }}
        >
          {source.description}
        </p>

        {/* Supported formats */}
        {source.supportedFormats.length > 0 && (
          <div
            style={{
              fontSize: '12px',
              color: current.textSecondary,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '16px',
            }}
          >
            {source.supportedFormats.slice(0, 3).map((format, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: current.bgHover,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {format}
              </span>
            ))}
            {source.supportedFormats.length > 3 && (
              <span
                style={{
                  backgroundColor: current.bgHover,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: '500',
                }}
              >
                +{source.supportedFormats.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          if (actionHandler) actionHandler();
        }}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: isLoading ? current.bgHover : current.button,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            (e.target as HTMLButtonElement).style.backgroundColor = current.buttonHover;
            (e.target as HTMLButtonElement).style.transform = 'translateX(2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            (e.target as HTMLButtonElement).style.backgroundColor = current.button;
            (e.target as HTMLButtonElement).style.transform = 'translateX(0)';
          }
        }}
      >
        {isLoading ? (
          <>
            <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
            Connecting...
          </>
        ) : (
          <>
            {actionLabel}
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </>
        )}
      </button>

      <style>{`
        @keyframes scale {
          from {
            transform: scale(0.95);
          }
          to {
            transform: scale(1);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SourceTile;
