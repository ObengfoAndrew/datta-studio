'use client';

import React, { useState } from 'react';
import { LicenseType, SourceType } from '@/lib/types';
import { getAllLicenses, formatBytes, formatPrice } from '@/lib/licenseService';
import { X, Check, ChevronRight } from 'lucide-react';

interface LicenseSelectionModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onLicenseSelected: (licenseType: LicenseType) => void;
  fileSize?: number;
  fileName?: string;
  sourceType?: SourceType;
  sourceProvider?: string; // github, gitlab, bitbucket
  onOAuthConnect?: (provider: string, licenseType: LicenseType) => void;
}

const LicenseSelectionModal: React.FC<LicenseSelectionModalProps> = ({
  isOpen,
  isDarkMode,
  onClose,
  onLicenseSelected,
  fileSize,
  fileName,
  sourceType,
  sourceProvider,
  onOAuthConnect,
}) => {
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>('personal');
  const [isAnimating, setIsAnimating] = useState(true);

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      borderLight: '#475569',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
  };

  const current = isDarkMode ? theme.dark : theme.light;
  const licenses = getAllLicenses();

  if (!isOpen) return null;

  const handleSelect = (licenseType: LicenseType) => {
    setSelectedLicense(licenseType);
    setIsAnimating(false);
    setTimeout(() => {
      onLicenseSelected(licenseType);
      setIsAnimating(true);
    }, 500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: current.overlay,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: current.cardBg,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '85vh',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '32px',
            borderBottom: `1px solid ${current.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: current.text,
                margin: '0 0 8px 0',
              }}
            >
              Choose Your License
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: current.textSecondary,
                margin: 0,
              }}
            >
              Select a license tier for{' '}
              <strong style={{ color: current.text }}>
                {fileName || sourceType || 'your dataset'}
              </strong>
              {fileSize && (
                <>
                  {' '}
                  ({formatBytes(fileSize)})
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              color: current.textSecondary,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.borderLight;
              (e.currentTarget as HTMLButtonElement).style.color = current.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = current.textSecondary;
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Licenses Grid */}
        <div
          style={{
            flex: 1,
            padding: '32px',
            overflowY: 'auto',
          }}
        >
          {/* Beta Banner */}
          <div
            style={{
              backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
              border: `1px solid ${isDarkMode ? '#3b82f6' : '#93c5fd'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🚀</span>
            <div>
              <p
                style={{
                  margin: '0 0 4px 0',
                  fontWeight: '600',
                  color: isDarkMode ? '#93c5fd' : '#1e40af',
                  fontSize: '14px',
                }}
              >
                BETA PROGRAM
              </p>
              <p
                style={{
                  margin: 0,
                  color: isDarkMode ? '#bfdbfe' : '#0369a1',
                  fontSize: '13px',
                }}
              >
                All tiers are free during our beta phase. Pricing will be introduced after launch.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '24px',
            }}
          >
            {licenses.map((license, idx) => {
              const isSelected = selectedLicense === license.id;

              return (
                <div
                  key={license.id}
                  onClick={() => handleSelect(license.id as LicenseType)}
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    border: `2px solid ${isSelected ? license.color : current.border}`,
                    backgroundColor: isSelected ? current.borderLight : current.bg,
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: isAnimating ? `slideIn 0.4s ease-out ${idx * 0.05}s both` : 'none',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected
                      ? `0 10px 30px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'}`
                      : `0 2px 8px ${isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = license.color;
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = current.border;
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        backgroundColor: license.color,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: `0 4px 12px ${license.color}40`,
                        animation: 'popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                      }}
                    >
                      <Check style={{ width: '18px', height: '18px' }} />
                    </div>
                  )}

                  {/* Badge */}
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: license.badgeColor,
                      color: license.color,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      width: 'fit-content',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {license.name}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: current.text,
                      margin: '0 0 8px 0',
                    }}
                  >
                    {license.name.replace('Datta ', '').replace('™', '')}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '12px',
                      color: current.textSecondary,
                      margin: '0 0 16px 0',
                      lineHeight: '1.4',
                      minHeight: '24px',
                    }}
                  >
                    {license.description}
                  </p>

                  {/* Price */}
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: current.text,
                      marginBottom: '16px',
                    }}
                  >
                    {license.pricing.monthly === 0 ? (
                      <span style={{ color: '#10b981' }}>Free</span>
                    ) : (
                      <>
                        <span style={{ fontSize: '18px' }}>{formatPrice(license.pricing.monthly)}</span>
                        <span style={{ fontSize: '12px', color: current.textSecondary }}>
                          {' '}
                          /month
                        </span>
                      </>
                    )}
                  </div>

                  {/* Limit info */}
                  <div
                    style={{
                      fontSize: '11px',
                      color: current.textSecondary,
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: `1px solid ${current.border}`,
                    }}
                  >
                    Max file: <strong>{formatBytes(license.maxFileSize)}</strong>
                    <br />
                    Max files: <strong>{license.maxFilesPerUpload}</strong>
                  </div>

                  {/* Top Features */}
                  <div style={{ marginBottom: '12px' }}>
                    {license.features.slice(0, 3).map((feature, featureIdx) => (
                      <div
                        key={featureIdx}
                        style={{
                          fontSize: '11px',
                          color: current.textSecondary,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: '14px',
                            height: '14px',
                            backgroundColor: license.color,
                            borderRadius: '3px',
                            flexShrink: 0,
                            marginTop: '1px',
                          }}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {license.features.length > 3 && (
                    <p
                      style={{
                        fontSize: '11px',
                        color: license.color,
                        fontWeight: '600',
                        margin: '8px 0 0 0',
                      }}
                    >
                      +{license.features.length - 3} more features
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '24px 32px',
            borderTop: `1px solid ${current.border}`,
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: current.borderLight,
              color: current.text,
              border: `1px solid ${current.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.border;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.borderLight;
            }}
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (sourceProvider && onOAuthConnect) {
                // If this is an OAuth source, trigger OAuth connection
                onOAuthConnect(sourceProvider, selectedLicense);
              } else {
                // Otherwise, proceed with license selection
                handleSelect(selectedLicense);
              }
            }}
            style={{
              padding: '12px 32px',
              backgroundColor: getLicenseColor(selectedLicense, isDarkMode),
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 12px ${getLicenseColor(selectedLicense, isDarkMode)}40`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            Confirm & Continue
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes popIn {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LicenseSelectionModal;

// Helper function to get license color
function getLicenseColor(licenseType: LicenseType, isDarkMode: boolean): string {
  const colors: Record<LicenseType, { light: string; dark: string }> = {
    personal: { light: '#3b82f6', dark: '#60a5fa' },
    creative: { light: '#a855f7', dark: '#d8b4fe' },
    professional: { light: '#f59e0b', dark: '#fbbf24' },
    enterprise: { light: '#ef4444', dark: '#f87171' },
  };
  return isDarkMode ? colors[licenseType].dark : colors[licenseType].light;
}
