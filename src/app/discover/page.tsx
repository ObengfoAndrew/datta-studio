'use client'

// This page should be dynamic (client-rendered, not statically generated)
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Database,
  Download,
  Star,
  Tag,
  Calendar,
  User,
  Mail,
  FileText,
  ArrowRight,
  Loader,
  AlertCircle,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { onDatasetUpload } from '@/lib/datasetService';

interface Dataset {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'published' | 'draft';
  createdAt: any;
  updatedAt?: any;
  licenseType?: string;
  fileCount?: number;
  size?: number;
  metadata?: {
    tags: string[];
    language?: string;
    framework?: string;
  };
}

export default function DiscoverPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);  // Disabled by default for performance
  const [activeCreators, setActiveCreators] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
  const [newDatasetNotification, setNewDatasetNotification] = useState('');
  const [aiLabConnectionActive, setAiLabConnectionActive] = useState(false);

  // Form state
  const [requestForm, setRequestForm] = useState({
    company: '',
    contactEmail: '',
    name: '',
    purpose: '',
    usageWindowDays: '30'
  });

  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e5e7eb',
      hover: '#f1f5f9'
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      hover: '#1e293b'
    }
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  // Fetch public datasets
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for AI Lab connections in real-time
  useEffect(() => {
    try {
      // Simple check - don't query ALL users every time
      // Instead, just set a flag that could be true
      console.log('🔌 AI Lab connection listener initialized');
      setAiLabConnectionActive(false); // Default to false, only set true if user has connection
    } catch (error) {
      console.error('Error initializing connection listeners:', error);
    }
  }, []);

  // Listen for dataset uploads from other components
  useEffect(() => {
    const unsubscribe = onDatasetUpload(() => {
      console.log('📢 Dataset upload detected! Refreshing...');
      fetchDatasetsNow();
    });

    return unsubscribe;
  }, []);

  // Fetch public datasets
  const fetchDatasetsNow = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching public datasets...');
      const response = await fetch('/api/pilot/datasets/public');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datasets fetched:', data);
        setDatasets(data.datasets || []);
        setFilteredDatasets(data.datasets || []);
        setActiveCreators(data.activeCreators || 0);
        setLastRefresh(new Date());
      } else {
        console.error('❌ Failed to fetch datasets. Status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDatasets = async () => {
      await fetchDatasetsNow();
    };

    fetchDatasets();

    // Set up auto-refresh every 30 seconds if enabled
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchDatasets, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDatasets(datasets);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = datasets.filter(ds =>
        ds.title.toLowerCase().includes(query) ||
        ds.description.toLowerCase().includes(query) ||
        ds.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredDatasets(filtered);
    }
  }, [searchQuery, datasets]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDataset) {
      setFormError('Dataset not selected');
      return;
    }

    if (!requestForm.company || !requestForm.contactEmail || !requestForm.name || !requestForm.purpose) {
      setFormError('Please fill in all required fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestForm.contactEmail)) {
      setFormError('Invalid email address');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      // Submit request without API key (anonymous request)
      const response = await fetch('/api/pilot/requests/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset.id,
          company: requestForm.company,
          contactEmail: requestForm.contactEmail,
          requesterName: requestForm.name,
          purpose: requestForm.purpose,
          usageWindowDays: parseInt(requestForm.usageWindowDays)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`✅ Request submitted! The dataset owner will review it within 24 hours. You'll receive an email at ${requestForm.contactEmail} with API access details once approved.`);
        
        // Reset form
        setRequestForm({
          company: '',
          contactEmail: '',
          name: '',
          purpose: '',
          usageWindowDays: '30'
        });
        
        setTimeout(() => {
          setShowRequestForm(false);
          setSelectedDataset(null);
          setSuccessMessage('');
        }, 3000);
      } else {
        const error = await response.json();
        setFormError(error.error || 'Failed to submit request');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | any) => {
    let date: Date;
    
    // Handle Firestore Timestamp objects
    if (dateString?.toDate) {
      date = dateString.toDate();
    } else if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else {
      date = new Date();
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      padding: '40px 20px',
      transition: 'background-color 0.3s'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <Database style={{ width: '32px', height: '32px', color: '#7c3aed' }} />
            <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>
              AI Datasets
            </h1>
          </div>
          <p style={{
            fontSize: '16px',
            color: currentTheme.textSecondary,
            margin: 0,
            marginBottom: '24px'
          }}>
            Discover and request access to datasets shared by Data Creators in the Datta Studio community
          </p>

          {/* Real-time Notification */}
          {newDatasetNotification && (
            <div style={{
              backgroundColor: '#7c3aed20',
              border: '1px solid #7c3aed',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#7c3aed',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <Zap style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              {newDatasetNotification}
            </div>
          )}

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            gap: '12px',
            maxWidth: '600px',
            margin: '0 auto',
            marginBottom: '24px'
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                width: '20px',
                height: '20px',
                color: currentTheme.textSecondary,
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                placeholder="Search datasets by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  backgroundColor: currentTheme.cardBg,
                  color: currentTheme.text,
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Auto-refresh enabled (every 30s)' : 'Auto-refresh disabled'}
              style={{
                padding: '12px 16px',
                border: `2px solid ${autoRefresh ? '#10b981' : currentTheme.border}`,
                borderRadius: '8px',
                backgroundColor: autoRefresh ? isDarkMode ? '#10b98115' : '#d1fae5' : currentTheme.cardBg,
                color: autoRefresh ? '#10b981' : currentTheme.text,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔄 {autoRefresh ? 'Live' : 'Off'}
            </button>
            <button
              onClick={() => {
                setLoading(true);
                fetch('/api/pilot/datasets/public')
                  .then(res => res.ok ? res.json() : null)
                  .then(data => {
                    if (data) {
                      setDatasets(data.datasets || []);
                      setFilteredDatasets(data.datasets || []);
                      setActiveCreators(data.activeCreators || 0);
                      setLastRefresh(new Date());
                    }
                    setLoading(false);
                  })
                  .catch(() => setLoading(false));
              }}
              style={{
                padding: '12px 16px',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '8px',
                backgroundColor: currentTheme.cardBg,
                color: currentTheme.text,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ⟳
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                padding: '12px 16px',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '8px',
                backgroundColor: currentTheme.cardBg,
                color: currentTheme.text,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Info Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            fontSize: '13px',
            color: currentTheme.textSecondary,
            marginBottom: '24px',
            padding: '12px',
            backgroundColor: isDarkMode ? '#1e293b20' : '#f1f5f920',
            borderRadius: '8px',
            flexWrap: 'wrap'
          }}>
            <span>📊 {datasets.length} datasets available</span>
            <span>👥 {activeCreators} active creators</span>
            <span>🔄 {autoRefresh ? 'Live updates' : 'Manual refresh'}</span>
            {aiLabConnectionActive && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#7c3aed',
                fontWeight: '600'
              }}>
                🔌 AI Lab Connected
              </span>
            )}
            {mounted && <span>⏰ Last updated: {lastRefresh.toLocaleTimeString()}</span>}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            color: currentTheme.textSecondary
          }}>
            <Loader style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: '12px' }}>Loading datasets...</span>
          </div>
        )}

        {/* AI Lab Connection Required Message */}
        {/* Datasets Grid - Show without needing AI Lab connection */}
        {!loading && filteredDatasets.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {filteredDatasets.map(dataset => (
              <div
                key={dataset.id}
                style={{
                  backgroundColor: currentTheme.cardBg,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = currentTheme.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Title */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 8px',
                  color: currentTheme.text
                }}>
                  {dataset.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '13px',
                  color: currentTheme.textSecondary,
                  margin: '0 0 16px',
                  lineHeight: '1.5',
                  minHeight: '40px'
                }}>
                  {dataset.description}
                </p>

                {/* License Type */}
                {dataset.licenseType && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px'
                  }}>
                    <FileText style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                    <span style={{
                      fontSize: '12px',
                      color: '#3b82f6',
                      fontWeight: '500'
                    }}>
                      {dataset.licenseType}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {dataset.metadata?.tags && dataset.metadata.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: '16px'
                  }}>
                    {dataset.metadata.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} style={{
                        backgroundColor: isDarkMode ? '#3b82f615' : '#dbeafe',
                        color: '#3b82f6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {tag}
                      </span>
                    ))}
                    {dataset.metadata.tags.length > 3 && (
                      <span style={{
                        color: currentTheme.textSecondary,
                        fontSize: '11px'
                      }}>
                        +{dataset.metadata.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Meta Info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: currentTheme.textSecondary,
                  paddingTop: '12px',
                  borderTop: `1px solid ${currentTheme.border}`,
                  marginBottom: '16px'
                }}>
                  {dataset.fileCount !== undefined && <span>{dataset.fileCount} files</span>}
                  <span>{formatDate(dataset.createdAt)}</span>
                </div>

                {/* Request Button */}
                <button
                  onClick={() => {
                    setSelectedDataset(dataset);
                    setShowRequestForm(true);
                    setFormError('');
                    setSuccessMessage('');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Download style={{ width: '14px', height: '14px' }} />
                  Request Access
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDatasets.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: currentTheme.textSecondary
          }}>
            <Database style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              opacity: 0.5
            }} />
            <p style={{ fontSize: '16px', margin: 0 }}>
              {datasets.length === 0
                ? 'No datasets available yet'
                : 'No datasets match your search'}
            </p>
          </div>
        )}

        {/* Request Form Modal */}
        {showRequestForm && selectedDataset && (
          <div style={{
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
          }}>
            <div style={{
              backgroundColor: currentTheme.cardBg,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}>
              {/* Close button - Fixed positioning */}
              <button
                onClick={() => setShowRequestForm(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = currentTheme.border;
                  e.currentTarget.style.color = currentTheme.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = currentTheme.textSecondary;
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: currentTheme.textSecondary,
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.2s'
                }}
                title="Close form"
              >
                ✕
              </button>

              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 0 8px',
                paddingRight: '32px',
                color: currentTheme.text
              }}>
                Request Dataset Access
              </h2>

              <p style={{
                fontSize: '14px',
                color: currentTheme.textSecondary,
                margin: '0 0 24px'
              }}>
                {selectedDataset.title}
              </p>

              {/* Success Message */}
              {successMessage && (
                <div style={{
                  backgroundColor: isDarkMode ? '#10b98115' : '#d1fae5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  color: '#10b981',
                  fontSize: '13px'
                }}>
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {formError && (
                <div style={{
                  backgroundColor: isDarkMode ? '#ef444415' : '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  color: '#ef4444',
                  fontSize: '13px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  {formError}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name */}
                <div>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.text,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={requestForm.name}
                    onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                    placeholder="John Doe"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? '#0f172a' : 'white',
                      color: currentTheme.text,
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Company */}
                <div>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.text,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Organization/Company *
                  </label>
                  <input
                    type="text"
                    value={requestForm.company}
                    onChange={(e) => setRequestForm({ ...requestForm, company: e.target.value })}
                    placeholder="Your Company"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? '#0f172a' : 'white',
                      color: currentTheme.text,
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.text,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={requestForm.contactEmail}
                    onChange={(e) => setRequestForm({ ...requestForm, contactEmail: e.target.value })}
                    placeholder="your@email.com"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? '#0f172a' : 'white',
                      color: currentTheme.text,
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{
                    fontSize: '11px',
                    color: currentTheme.textSecondary,
                    margin: '4px 0 0'
                  }}>
                    We'll send your API key here after approval
                  </p>
                </div>

                {/* Purpose */}
                <div>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.text,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Purpose of Use *
                  </label>
                  <textarea
                    value={requestForm.purpose}
                    onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                    placeholder="Tell us how you plan to use this dataset..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? '#0f172a' : 'white',
                      color: currentTheme.text,
                      fontSize: '13px',
                      minHeight: '100px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Usage Window */}
                <div>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: currentTheme.text,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Access Duration (Days)
                  </label>
                  <select
                    value={requestForm.usageWindowDays}
                    onChange={(e) => setRequestForm({ ...requestForm, usageWindowDays: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? '#0f172a' : 'white',
                      color: currentTheme.text,
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '12px',
                    backgroundColor: submitting ? '#9ca3af' : '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Mail style={{ width: '16px', height: '16px' }} />
                      Submit Request
                    </>
                  )}
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    setFormError('');
                    setRequestForm({
                      company: '',
                      contactEmail: '',
                      name: '',
                      purpose: '',
                      usageWindowDays: '30'
                    });
                  }}
                  disabled={submitting}
                  style={{
                    padding: '12px',
                    backgroundColor: currentTheme.border,
                    color: currentTheme.text,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Cancel
                </button>

                <p style={{
                  fontSize: '12px',
                  color: currentTheme.textSecondary,
                  margin: '8px 0 0',
                  textAlign: 'center'
                }}>
                  The dataset owner will review your request within 24 hours
                </p>
              </form>

              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

