'use client';

import React, { useState } from 'react';
import { Dataset, LicenseType } from '@/lib/types';
import { formatBytes, getLicenseColor, getLicense } from '@/lib/licenseService';
import {
  Download,
  Trash2,
  Share2,
  Eye,
  TrendingUp,
  MoreVertical,
  FileText,
  Code,
  Layers,
  Star,
} from 'lucide-react';

interface DatasetCardProps {
  dataset: Dataset;
  isDarkMode: boolean;
  onDownload: () => void;
  onDelete: () => void;
  onShare: () => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({
  dataset,
  isDarkMode,
  onDownload,
  onDelete,
  onShare,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const theme = {
    light: {
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      hoverBg: '#f8fafc',
      statusBg: '#e0f2fe',
      statusText: '#0369a1',
      menuBg: 'white',
      menuBorder: '#e2e8f0',
    },
    dark: {
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      borderLight: '#475569',
      hoverBg: '#334155',
      statusBg: '#1e3a8a',
      statusText: '#93c5fd',
      menuBg: '#334155',
      menuBorder: '#475569',
    },
  };

  const current = isDarkMode ? theme.dark : theme.light;
  const licenseColor = getLicenseColor(dataset.licenseType, isDarkMode);
  const license = getLicense(dataset.licenseType);

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'code':
        return '💻';
      case 'art':
        return '🎨';
      case 'voice':
        return '🎵';
      default:
        return '📁';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div
        style={{
          backgroundColor: current.cardBg,
          borderRadius: '12px',
          border: `1px solid ${isHovered ? licenseColor + '40' : current.border}`,
          padding: '16px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isHovered
            ? `0 10px 30px ${isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'}`
            : `0 2px 8px ${isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'}`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowMenu(false);
        }}
      >
        {/* License Color Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: licenseColor,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '12px',
            marginTop: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Icon */}
            <div
              style={{
                fontSize: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                backgroundColor: current.borderLight,
                borderRadius: '8px',
              }}
            >
              {getSourceIcon(dataset.sourceType)}
            </div>

            {/* Title & Source */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: current.text,
                  margin: '0 0 4px 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {dataset.sourceName}
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: current.textSecondary,
                  margin: 0,
                  textTransform: 'capitalize',
                }}
              >
                {dataset.sourceType} • {formatBytes(dataset.fileSize)}
                {dataset.sourceType === 'code' && dataset.metadata.codeMetadata && (
                  <>
                    {' • '}
                    {Object.keys(dataset.metadata.codeMetadata.languages).slice(0, 2).join(', ')}
                    {Object.keys(dataset.metadata.codeMetadata.languages).length > 2 && '...'}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Menu Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: current.textSecondary,
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
              <MoreVertical style={{ width: '16px', height: '16px' }} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  right: 0,
                  backgroundColor: current.menuBg,
                  borderRadius: '8px',
                  border: `1px solid ${current.menuBorder}`,
                  boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                  zIndex: 100,
                  minWidth: '160px',
                  overflow: 'hidden',
                  animation: 'slideInDown 0.2s ease-out',
                }}
              >
                {[
                  { label: 'Download', icon: Download, onClick: onDownload },
                  { label: 'Share', icon: Share2, onClick: onShare },
                  { label: 'Delete', icon: Trash2, onClick: onDelete, danger: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={(e) => {
                      e.preventDefault();
                      item.onClick();
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      color: item.danger ? '#ef4444' : current.text,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      borderBottom: item === [{ label: 'Download', icon: Download, onClick: onDownload }][0]
                        ? `1px solid ${current.menuBorder}`
                        : item === [{ label: 'Share', icon: Share2, onClick: onShare }][0]
                          ? `1px solid ${current.menuBorder}`
                          : 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.borderLight;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <item.icon style={{ width: '14px', height: '14px' }} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* License Badge */}
        {license && (
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: license.badgeColor,
              color: licenseColor,
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              width: 'fit-content',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {license.name.replace('Datta ', '').replace('™', '')}
          </div>
        )}

        {/* Metadata */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${current.border}`,
          }}
        >
          {/* Date */}
          <div>
            <p
              style={{
                fontSize: '11px',
                color: current.textSecondary,
                margin: '0 0 2px 0',
                fontWeight: '500',
              }}
            >
              Added
            </p>
            <p
              style={{
                fontSize: '12px',
                color: current.text,
                margin: 0,
                fontWeight: '600',
              }}
            >
              {formatDate(dataset.dateAdded)}
            </p>
          </div>

          {/* Status */}
          <div>
            <p
              style={{
                fontSize: '11px',
                color: current.textSecondary,
                margin: '0 0 2px 0',
                fontWeight: '500',
              }}
            >
              Status
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(dataset.status),
                }}
              />
              <p
                style={{
                  fontSize: '12px',
                  color: current.text,
                  margin: 0,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}
              >
                {dataset.status}
              </p>
            </div>
          </div>
        </div>

        {/* Code-Specific Metadata */}
        {dataset.sourceType === 'code' && dataset.metadata.codeMetadata && (
          <div
            style={{
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: `1px solid ${current.border}`,
            }}
          >
            {/* Languages */}
            {Object.keys(dataset.metadata.codeMetadata.languages).length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <Code style={{ width: '12px', height: '12px', color: current.textSecondary }} />
                  <p
                    style={{
                      fontSize: '11px',
                      color: current.textSecondary,
                      margin: 0,
                      fontWeight: '500',
                    }}
                  >
                    Languages
                  </p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Object.entries(dataset.metadata.codeMetadata.languages)
                    .sort((a, b) => b[1].percentage - a[1].percentage)
                    .slice(0, 3)
                    .map(([lang, data]) => (
                      <span
                        key={lang}
                        style={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          backgroundColor: current.borderLight,
                          color: current.text,
                          borderRadius: '4px',
                          fontWeight: '500',
                        }}
                      >
                        {lang} {Math.round(data.percentage)}%
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Frameworks */}
            {dataset.metadata.codeMetadata.frameworks.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <Layers style={{ width: '12px', height: '12px', color: current.textSecondary }} />
                  <p
                    style={{
                      fontSize: '11px',
                      color: current.textSecondary,
                      margin: 0,
                      fontWeight: '500',
                    }}
                  >
                    Frameworks
                  </p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {dataset.metadata.codeMetadata.frameworks.slice(0, 3).map((framework) => (
                    <span
                      key={framework}
                      style={{
                        fontSize: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#3b82f640',
                        color: '#3b82f6',
                        borderRadius: '4px',
                        fontWeight: '500',
                      }}
                    >
                      {framework}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Repository Info */}
            {dataset.metadata.codeMetadata.repositoryInfo && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '11px',
                  color: current.textSecondary,
                }}
              >
                {dataset.metadata.codeMetadata.repositoryInfo.stars > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star style={{ width: '12px', height: '12px', fill: '#fbbf24', color: '#fbbf24' }} />
                    <span>{dataset.metadata.codeMetadata.repositoryInfo.stars}</span>
                  </div>
                )}
                {dataset.metadata.codeMetadata.codeQuality.score > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Quality: {dataset.metadata.codeMetadata.codeQuality.score}/100</span>
                  </div>
                )}
                {dataset.metadata.codeMetadata.totalLinesOfCode > 0 && (
                  <div>
                    <span>
                      {dataset.metadata.codeMetadata.totalLinesOfCode.toLocaleString()} LOC
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: current.textSecondary,
            }}
          >
            <Eye style={{ width: '14px', height: '14px' }} />
            <span>
              <strong style={{ color: current.text }}>{dataset.views}</strong> views
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: current.textSecondary,
            }}
          >
            <Download style={{ width: '14px', height: '14px' }} />
            <span>
              <strong style={{ color: current.text }}>{dataset.downloads}</strong> downloads
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: current.textSecondary,
            }}
          >
            <TrendingUp style={{ width: '14px', height: '14px' }} />
            <span>
              <strong style={{ color: current.text }}>
                ${dataset.earnings.monthlyRevenue.toFixed(2)}
              </strong>
              /mo
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: current.textSecondary,
            }}
          >
            <FileText style={{ width: '14px', height: '14px' }} />
            <span>
              <strong style={{ color: current.text }}>{dataset.fileCount}</strong> file
              {dataset.fileCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <style>{`
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default React.memo(DatasetCard);
