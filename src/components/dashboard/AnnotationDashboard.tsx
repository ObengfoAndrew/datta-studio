'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Image, Video, Tag, CheckCircle, Clock, AlertCircle, Plus, Upload, Users, TrendingUp, X, Github, Twitter, Linkedin, Mail, ExternalLink, MessageCircle, Keyboard, Download, Share2, MoreVertical, Send, Zap, Flag } from 'lucide-react';

interface AnnotationProject {
  id: number;
  name: string;
  type: string;
  totalItems: number;
  completed: number;
  inProgress: number;
  status: string;
  lastSync: string;
  annotators: number;
}

interface AnnotationItem {
  id: string;
  content: string;
  type: 'image' | 'text' | 'video';
  labels: string[];
  annotatedBy?: string;
  timestamp?: string;
  comment?: string;
  quality?: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'idle' | 'offline';
  currentItem?: string;
}

interface AnnotationDashboardProps {
  isDarkMode: boolean;
  onBack?: () => void;
}

const AnnotationDashboard: React.FC<AnnotationDashboardProps> = ({ isDarkMode, onBack }) => {
  const [showAddProject, setShowAddProject] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedProject, setSelectedProject] = useState<AnnotationProject | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [showTeam, setShowTeam] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);

  // Mobile responsiveness
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === '?') setShowShortcuts(!showShortcuts);
      if (e.key === 'ArrowRight' && showAnnotator) moveToNext();
      if (e.key === 'ArrowLeft' && showAnnotator) moveToPrev();
      if (e.key === 's' && showAnnotator) submitAnnotation();
      if (e.key === '1' && showAnnotator) toggleLabel('positive');
      if (e.key === '2' && showAnnotator) toggleLabel('negative');
      if (e.key === '3' && showAnnotator) toggleLabel('neutral');
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedLabels, showAnnotator, currentItemIndex]);

  // Helper functions
  const moveToNext = () => {
    if (selectedProject && currentItemIndex < selectedProject.totalItems - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setSelectedLabels([]);
      setQualityScore(0);
    }
  };

  const moveToPrev = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
      setSelectedLabels([]);
      setQualityScore(0);
    }
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const submitAnnotation = () => {
    if (selectedLabels.length > 0) {
      // Quality score based on multiple labels and comments
      const score = Math.min(100, (selectedLabels.length * 20) + (comment.length > 0 ? 20 : 0));
      setQualityScore(score);
      
      // Simulate submission delay
      setTimeout(() => {
        moveToNext();
        setComment('');
      }, 500);
    }
  };

  const generateAnnotationItems = (): AnnotationItem[] => {
    const items: AnnotationItem[] = [];
    for (let i = 0; i < 50; i++) {
      items.push({
        id: `item-${i}`,
        content: `Sample ${selectedProject?.type} content #${i + 1}`,
        type: (selectedProject?.type === 'image' ? 'image' : selectedProject?.type === 'video' ? 'video' : 'text') as 'image' | 'text' | 'video',
        labels: []
      });
    }
    return items;
  };

  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Sarah Chen', avatar: 'SC', status: 'active', currentItem: 'Product Image #45' },
    { id: '2', name: 'Alex Kumar', avatar: 'AK', status: 'active', currentItem: 'Review #23' },
    { id: '3', name: 'Jamie Lee', avatar: 'JL', status: 'idle', currentItem: undefined },
    { id: '4', name: 'Marcus Brown', avatar: 'MB', status: 'offline', currentItem: undefined }
  ];

  const availableLabels = ['positive', 'negative', 'neutral', 'urgent', 'review-needed'];
  const labelColors = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280',
    urgent: '#f59e0b',
    'review-needed': '#a855f7'
  };

  const annotationProjects: AnnotationProject[] = [
    {
      id: 1,
      name: "Product Image Labeling",
      type: "image",
      totalItems: 5000,
      completed: 3750,
      inProgress: 800,
      status: "active",
      lastSync: "2 min ago",
      annotators: 5
    },
    {
      id: 2,
      name: "Customer Sentiment Analysis",
      type: "text",
      totalItems: 12000,
      completed: 9600,
      inProgress: 1200,
      status: "active",
      lastSync: "5 min ago",
      annotators: 8
    },
    {
      id: 3,
      name: "Video Action Recognition",
      type: "video",
      totalItems: 800,
      completed: 320,
      inProgress: 180,
      status: "active",
      lastSync: "1 hr ago",
      annotators: 3
    },
    {
      id: 4,
      name: "Document Classification",
      type: "document",
      totalItems: 3000,
      completed: 3000,
      inProgress: 0,
      status: "completed",
      lastSync: "3 hrs ago",
      annotators: 4
    }
  ];

  const stats = {
    totalProjects: 12,
    activeProjects: 8,
    totalAnnotations: 45780,
    averageQuality: 94.5,
    totalAnnotators: 24,
    annotationsToday: 1250
  };

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e5e7eb',
      borderLight: '#f1f5f9',
      searchBg: '#f8fafc',
      sidebarBg: 'white',
      activityBg: '#f8fafc',
      accent: '#3b82f6'
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      borderLight: '#475569',
      searchBg: '#334155',
      sidebarBg: '#1e293b',
      activityBg: '#334155',
      accent: '#60a5fa'
    }
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'image': return <Image style={{ width: '20px', height: '20px' }} />;
      case 'video': return <Video style={{ width: '20px', height: '20px' }} />;
      case 'text': return <FileText style={{ width: '20px', height: '20px' }} />;
      case 'document': return <FileText style={{ width: '20px', height: '20px' }} />;
      default: return <Tag style={{ width: '20px', height: '20px' }} />;
    }
  };

  // If project is selected, show annotation interface
  if (showAnnotator && selectedProject) {
    const items = generateAnnotationItems();
    const currentItem = items[currentItemIndex];
    const progress = ((currentItemIndex + 1) / selectedProject.totalItems) * 100;

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: currentTheme.bg,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: currentTheme.cardBg,
          borderBottom: `1px solid ${currentTheme.borderLight}`,
          padding: isMobile ? '16px' : '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: currentTheme.text, margin: '0 0 8px 0' }}>
              {selectedProject.name}
            </h2>
            <div style={{
              width: '100%',
              backgroundColor: currentTheme.activityBg,
              borderRadius: '4px',
              height: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: `linear-gradient(to right, ${progress < 50 ? '#3b82f6' : progress < 80 ? '#f59e0b' : '#10b981'}, ${progress < 50 ? '#60a5fa' : progress < 80 ? '#fbbf24' : '#34d399'})`,
                height: '100%',
                width: `${progress}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginTop: '6px' }}>
              Item {currentItemIndex + 1} of {selectedProject.totalItems} ({progress.toFixed(1)}%)
            </div>
          </div>
          <button
            onClick={() => setShowAnnotator(false)}
            style={{
              backgroundColor: currentTheme.activityBg,
              color: currentTheme.text,
              border: `1px solid ${currentTheme.border}`,
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Back
          </button>
        </div>

        {/* Main Annotation Area */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: showTeam && !isMobile ? '1fr 280px' : '1fr',
          gap: '20px',
          padding: isMobile ? '16px' : '32px',
          overflow: 'auto'
        }}>
          {/* Content Editor */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Content Display */}
            <div style={{
              backgroundColor: currentTheme.cardBg,
              border: `2px solid ${currentTheme.borderLight}`,
              borderRadius: '12px',
              padding: '24px',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selectedProject.type === 'image' ? (
                <div style={{
                  width: '100%',
                  height: '300px',
                  backgroundColor: currentTheme.activityBg,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentTheme.textSecondary
                }}>
                  <Image style={{ width: '48px', height: '48px', opacity: 0.5 }} />
                </div>
              ) : selectedProject.type === 'video' ? (
                <div style={{
                  width: '100%',
                  height: '300px',
                  backgroundColor: currentTheme.activityBg,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentTheme.textSecondary
                }}>
                  <Video style={{ width: '48px', height: '48px', opacity: 0.5 }} />
                </div>
              ) : (
                <div style={{
                  fontSize: '16px',
                  color: currentTheme.text,
                  lineHeight: '1.8',
                  maxWidth: '600px',
                  fontFamily: 'monospace',
                  backgroundColor: currentTheme.activityBg,
                  padding: '20px',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  {currentItem.content}
                </div>
              )}
            </div>

            {/* Quality Indicator */}
            {qualityScore > 0 && (
              <div style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.borderLight}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginBottom: '4px' }}>Quality Score</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: currentTheme.text }}>{qualityScore}%</div>
                </div>
                <div style={{
                  width: '60px',
                  height: '4px',
                  backgroundColor: currentTheme.activityBg,
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: qualityScore > 80 ? '#10b981' : qualityScore > 60 ? '#f59e0b' : '#ef4444',
                    width: `${qualityScore}%`
                  }}></div>
                </div>
              </div>
            )}

            {/* Labels */}
            <div style={{
              backgroundColor: currentTheme.cardBg,
              border: `1px solid ${currentTheme.borderLight}`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: currentTheme.text, marginBottom: '16px', margin: '0 0 16px 0' }}>
                Select Labels
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {availableLabels.map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => toggleLabel(label)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: `2px solid ${selectedLabels.includes(label) ? labelColors[label as keyof typeof labelColors] : currentTheme.border}`,
                      backgroundColor: selectedLabels.includes(label) 
                        ? (labelColors[label as keyof typeof labelColors] + '20') 
                        : currentTheme.activityBg,
                      color: selectedLabels.includes(label) 
                        ? labelColors[label as keyof typeof labelColors]
                        : currentTheme.text,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedLabels.includes(label)) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = labelColors[label as keyof typeof labelColors];
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedLabels.includes(label)) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = currentTheme.border;
                      }
                    }}
                  >
                    {label.replace('-', ' ')} {idx < 3 && <span style={{ fontSize: '11px', opacity: 0.6 }}>({idx + 1})</span>}
                  </button>
                ))}
              </div>

              {/* Comment */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: currentTheme.textSecondary, marginBottom: '8px' }}>
                  Add a comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Notes about this annotation..."
                  style={{
                    width: '100%',
                    backgroundColor: currentTheme.activityBg,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: currentTheme.text,
                    fontFamily: 'inherit',
                    outline: 'none',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              <button
                onClick={moveToPrev}
                disabled={currentItemIndex === 0}
                style={{
                  padding: '12px 16px',
                  backgroundColor: currentItemIndex === 0 ? currentTheme.activityBg : currentTheme.cardBg,
                  color: currentItemIndex === 0 ? currentTheme.textSecondary : currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  cursor: currentItemIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (currentItemIndex > 0) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDarkMode ? '#475569' : '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentItemIndex > 0) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.cardBg;
                  }
                }}
              >
                ← Previous (←)
              </button>

              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: currentTheme.activityBg,
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Keyboard style={{ width: '14px', height: '14px' }} />
                Shortcuts (?)
              </button>

              <button
                onClick={() => setShowTeam(!showTeam)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: showTeam ? '#667eea' : currentTheme.activityBg,
                  color: showTeam ? 'white' : currentTheme.text,
                  border: `1px solid ${showTeam ? '#667eea' : currentTheme.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Users style={{ width: '14px', height: '14px' }} />
                Team ({teamMembers.filter(m => m.status !== 'offline').length})
              </button>

              <button
                onClick={submitAnnotation}
                disabled={selectedLabels.length === 0}
                style={{
                  padding: '12px 16px',
                  backgroundColor: selectedLabels.length === 0 ? currentTheme.activityBg : '#10b981',
                  color: selectedLabels.length === 0 ? currentTheme.textSecondary : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedLabels.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedLabels.length > 0) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLabels.length > 0) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                  }
                }}
              >
                Submit (S)
              </button>

              <button
                onClick={moveToNext}
                disabled={currentItemIndex >= selectedProject.totalItems - 1}
                style={{
                  padding: '12px 16px',
                  backgroundColor: currentItemIndex >= selectedProject.totalItems - 1 ? currentTheme.activityBg : currentTheme.cardBg,
                  color: currentItemIndex >= selectedProject.totalItems - 1 ? currentTheme.textSecondary : currentTheme.text,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  cursor: currentItemIndex >= selectedProject.totalItems - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  gridColumn: isMobile ? '1' : '4'
                }}
                onMouseEnter={(e) => {
                  if (currentItemIndex < selectedProject.totalItems - 1) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDarkMode ? '#475569' : '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentItemIndex < selectedProject.totalItems - 1) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.cardBg;
                  }
                }}
              >
                Next (→)
              </button>
            </div>
          </div>

          {/* Team Sidebar */}
          {showTeam && !isMobile && (
            <div style={{
              backgroundColor: currentTheme.cardBg,
              border: `1px solid ${currentTheme.borderLight}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: 'fit-content',
              position: 'sticky',
              top: '16px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: currentTheme.text, margin: 0 }}>
                Team Activity
              </h3>
              {teamMembers.map((member) => (
                <div key={member.id} style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0,
                    position: 'relative'
                  }}>
                    {member.avatar}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: member.status === 'active' ? '#10b981' : member.status === 'idle' ? '#f59e0b' : '#6b7280',
                      border: `2px solid ${currentTheme.cardBg}`
                    }}></div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: currentTheme.text }}>
                      {member.name}
                    </div>
                    {member.currentItem && (
                      <div style={{ fontSize: '11px', color: currentTheme.textSecondary, marginTop: '2px' }}>
                        {member.currentItem}
                      </div>
                    )}
                    {!member.currentItem && (
                      <div style={{ fontSize: '11px', color: currentTheme.textSecondary, marginTop: '2px' }}>
                        {member.status === 'offline' ? 'Offline' : 'Idle'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: currentTheme.cardBg,
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: currentTheme.text, margin: 0 }}>
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: currentTheme.textSecondary,
                    padding: '4px'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: '1', desc: 'Label: Positive' },
                  { key: '2', desc: 'Label: Negative' },
                  { key: '3', desc: 'Label: Neutral' },
                  { key: '←', desc: 'Previous item' },
                  { key: '→', desc: 'Next item' },
                  { key: 'S', desc: 'Submit annotation' },
                  { key: '?', desc: 'Show shortcuts' }
                ].map((shortcut) => (
                  <div key={shortcut.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: currentTheme.activityBg,
                    borderRadius: '6px'
                  }}>
                    <span style={{ color: currentTheme.textSecondary, fontSize: '13px' }}>
                      {shortcut.desc}
                    </span>
                    <kbd style={{
                      backgroundColor: currentTheme.bg,
                      border: `1px solid ${currentTheme.border}`,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: currentTheme.text
                    }}>
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Main Content */}
      <div style={{ flex: 1, padding: isMobile ? '16px' : '32px', overflow: 'auto' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          gap: isMobile ? '12px' : '0',
          marginBottom: '24px' 
        }}>
          <h2 style={{ 
            fontSize: isMobile ? '24px' : '32px', 
            fontWeight: '700', 
            color: currentTheme.text, 
            margin: 0 
          }}>
            Annotation Projects
          </h2>
          <button 
            onClick={() => setShowAddProject(!showAddProject)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              width: isMobile ? '100%' : 'auto'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            New Project
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: currentTheme.cardBg,
            border: `1px solid ${currentTheme.borderLight}`,
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Tag style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>+12%</span>
            </div>
            <div style={{ fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px' }}>Active Projects</div>
            <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: currentTheme.text }}>{stats.activeProjects}</div>
          </div>

          <div style={{
            backgroundColor: currentTheme.cardBg,
            border: `1px solid ${currentTheme.borderLight}`,
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>+8%</span>
            </div>
            <div style={{ fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px' }}>Total Annotations</div>
            <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: currentTheme.text }}>{stats.totalAnnotations.toLocaleString()}</div>
          </div>

          <div style={{
            backgroundColor: currentTheme.cardBg,
            border: `1px solid ${currentTheme.borderLight}`,
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <TrendingUp style={{ width: '20px', height: '20px', color: '#a855f7' }} />
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>+5%</span>
            </div>
            <div style={{ fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px' }}>Quality Score</div>
            <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: currentTheme.text }}>{stats.averageQuality}%</div>
          </div>

          <div style={{
            backgroundColor: currentTheme.cardBg,
            border: `1px solid ${currentTheme.borderLight}`,
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Users style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>+3</span>
            </div>
            <div style={{ fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px' }}>Active Annotators</div>
            <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: currentTheme.text }}>{stats.totalAnnotators}</div>
          </div>
        </div>

        {/* Add Project Modal */}
        {showAddProject && (
          <div style={{
            backgroundColor: currentTheme.cardBg,
            border: `1px solid ${currentTheme.borderLight}`,
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: currentTheme.text, margin: 0 }}>
                Create New Annotation Project
              </h3>
              <button
                onClick={() => setShowAddProject(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: currentTheme.textSecondary,
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '16px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px' }}>
                  Project Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., Product Classification"
                  style={{
                    width: '100%',
                    backgroundColor: currentTheme.activityBg,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    color: currentTheme.text,
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px' }}>
                  Annotation Type
                </label>
                <select style={{
                  width: '100%',
                  backgroundColor: currentTheme.activityBg,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: currentTheme.text,
                  outline: 'none',
                  cursor: 'pointer'
                }}>
                  <option>Image Classification</option>
                  <option>Object Detection</option>
                  <option>Text Classification</option>
                  <option>Named Entity Recognition</option>
                  <option>Video Annotation</option>
                  <option>Audio Transcription</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px' }}>
                  Data Source
                </label>
                <select style={{
                  width: '100%',
                  backgroundColor: currentTheme.activityBg,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  color: currentTheme.text,
                  outline: 'none',
                  cursor: 'pointer'
                }}>
                  <option>Google Drive</option>
                  <option>Upload CSV</option>
                  <option>API Import</option>
                  <option>Facebook</option>
                  <option>Instagram</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: currentTheme.textSecondary, marginBottom: '8px' }}>
                  Assign Annotators
                </label>
                <input 
                  type="number" 
                  placeholder="Number of annotators"
                  style={{
                    width: '100%',
                    backgroundColor: currentTheme.activityBg,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    color: currentTheme.text,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: '12px', 
              marginTop: '16px' 
            }}>
              <button style={{
                flex: 1,
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: isMobile ? '100%' : 'auto'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
              }}
              >
                Create Project
              </button>
              <button 
                onClick={() => setShowAddProject(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: currentTheme.activityBg,
                  color: currentTheme.text,
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDarkMode ? '#475569' : '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.activityBg;
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Projects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {annotationProjects.map((project) => {
            const progress = (project.completed / project.totalItems) * 100;
            
            return (
              <div key={project.id} style={{
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.borderLight}`,
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.borderColor = currentTheme.borderLight;
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                }
              }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between', 
                  gap: isMobile ? '12px' : '0',
                  marginBottom: '16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', width: '100%' }}>
                    <div style={{
                      width: isMobile ? '40px' : '48px',
                      height: isMobile ? '40px' : '48px',
                      backgroundColor: currentTheme.activityBg,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#60a5fa',
                      flexShrink: 0
                    }}>
                      {getTypeIcon(project.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        fontSize: isMobile ? '16px' : '18px', 
                        fontWeight: '700', 
                        color: currentTheme.text, 
                        margin: '0 0 4px 0' 
                      }}>
                        {project.name}
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center', 
                        gap: isMobile ? '6px' : '12px', 
                        fontSize: '14px', 
                        color: currentTheme.textSecondary 
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '12px', height: '12px' }} />
                          Last sync: {project.lastSync}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users style={{ width: '12px', height: '12px' }} />
                          {project.annotators} annotators
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {project.status === 'active' ? (
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#10b98120',
                        color: '#10b981',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Active
                      </span>
                    ) : (
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#3b82f620',
                        color: '#3b82f6',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: currentTheme.textSecondary }}>Progress</span>
                    <span style={{ fontWeight: '500', color: currentTheme.text }}>{progress.toFixed(1)}%</span>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    backgroundColor: currentTheme.activityBg,
                    borderRadius: '4px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{
                        background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                        height: '100%',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                        width: `${progress}%`
                      }}
                    ></div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: '16px',
                    paddingTop: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginBottom: '4px' }}>Completed</div>
                      <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#10b981' }}>
                        {project.completed.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginBottom: '4px' }}>In Progress</div>
                      <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#f59e0b' }}>
                        {project.inProgress.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginBottom: '4px' }}>Remaining</div>
                      <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: currentTheme.textSecondary }}>
                        {(project.totalItems - project.completed - project.inProgress).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '8px', 
                    paddingTop: '8px' 
                  }}>
                    <button style={{
                      flex: 1,
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
                    }}
                    >
                      View Details
                    </button>
                    <button style={{
                      padding: '10px 16px',
                      backgroundColor: currentTheme.activityBg,
                      color: currentTheme.text,
                      borderRadius: '8px',
                      border: `1px solid ${currentTheme.border}`,
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDarkMode ? '#475569' : '#e2e8f0';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.activityBg;
                    }}
                    >
                      Export
                    </button>
                    <button style={{
                      padding: '10px 16px',
                      backgroundColor: currentTheme.activityBg,
                      color: currentTheme.text,
                      borderRadius: '8px',
                      border: `1px solid ${currentTheme.border}`,
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDarkMode ? '#475569' : '#e2e8f0';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.activityBg;
                    }}
                    >
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Annotation Services Integration */}
        <div style={{
          marginTop: '32px',
          backgroundColor: currentTheme.cardBg,
          border: `1px solid ${currentTheme.borderLight}`,
          borderRadius: '12px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <h3 style={{ 
            fontSize: isMobile ? '18px' : '20px', 
            fontWeight: '700', 
            color: currentTheme.text, 
            marginBottom: '16px' 
          }}>
            Connect Annotation Services
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            <button style={{
              backgroundColor: currentTheme.activityBg,
              color: currentTheme.text,
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDarkMode ? '#475569' : '#e2e8f0';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.activityBg;
              (e.currentTarget as HTMLButtonElement).style.borderColor = currentTheme.border;
            }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Label Studio</div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginBottom: '12px' }}>
                Open source annotation platform
              </div>
              <div style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600' }}>Connect →</div>
            </button>
            
            <button style={{
              backgroundColor: currentTheme.activityBg,
              color: currentTheme.text,
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDarkMode ? '#475569' : '#e2e8f0';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.activityBg;
              (e.currentTarget as HTMLButtonElement).style.borderColor = currentTheme.border;
            }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Labelbox</div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginBottom: '12px' }}>
                Enterprise annotation solution
              </div>
              <div style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600' }}>Connect →</div>
            </button>
            
            <button style={{
              backgroundColor: currentTheme.activityBg,
              color: currentTheme.text,
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = isDarkMode ? '#475569' : '#e2e8f0';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.activityBg;
              (e.currentTarget as HTMLButtonElement).style.borderColor = currentTheme.border;
            }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Amazon SageMaker</div>
              <div style={{ fontSize: '12px', color: currentTheme.textSecondary, marginBottom: '12px' }}>
                Ground Truth annotation service
              </div>
              <div style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600' }}>Connect →</div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          background: isDarkMode 
            ? 'linear-gradient(to bottom, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
            : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 1))',
          borderTop: isDarkMode 
            ? `2px solid rgba(102, 126, 234, 0.3)`
            : `2px solid rgba(102, 126, 234, 0.2)`,
          padding: isMobile ? '40px 20px 28px' : '56px 32px 40px',
          marginTop: '64px',
          position: 'relative',
          boxShadow: isDarkMode 
            ? '0 -4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 -4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }}>
          {/* Decorative gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: isDarkMode
              ? 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent)',
            opacity: 0.6
          }}></div>
          
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Main Footer Content */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? '32px' : '48px',
              marginBottom: isMobile ? '32px' : '40px'
            }}>
              {/* Brand Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: '-2px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '14px',
                      opacity: 0.3,
                      filter: 'blur(8px)',
                      zIndex: -1
                    }}></div>
                    D
                  </div>
                  <div>
                    <div style={{
                      fontWeight: '700',
                      fontSize: '18px',
                      color: currentTheme.text
                    }}>
                      DATTA STUDIO
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: currentTheme.textSecondary
                    }}>
                      Data Intelligence Platform
                    </div>
                  </div>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: currentTheme.textSecondary,
                  lineHeight: '1.6',
                  margin: 0,
                  maxWidth: '280px'
                }}>
                  The YouTube of AI training data - collect, manage and monetize the data that powers tomorrow's intelligence.
                </p>
                {/* Social Links */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '8px'
                }}>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                      border: `1.5px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: currentTheme.textSecondary,
                      textDecoration: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)';
                      e.currentTarget.style.color = currentTheme.textSecondary;
                      e.currentTarget.style.borderColor = isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <Github style={{ width: '18px', height: '18px' }} />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                      border: `1.5px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: currentTheme.textSecondary,
                      textDecoration: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)';
                      e.currentTarget.style.color = currentTheme.textSecondary;
                      e.currentTarget.style.borderColor = isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <Twitter style={{ width: '18px', height: '18px' }} />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                      border: `1.5px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: currentTheme.textSecondary,
                      textDecoration: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)';
                      e.currentTarget.style.color = currentTheme.textSecondary;
                      e.currentTarget.style.borderColor = isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <Linkedin style={{ width: '18px', height: '18px' }} />
                  </a>
                  <a
                    href="mailto:support@dattastudio.com"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                      border: `1.5px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: currentTheme.textSecondary,
                      textDecoration: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#667eea';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)';
                      e.currentTarget.style.color = currentTheme.textSecondary;
                      e.currentTarget.style.borderColor = isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <Mail style={{ width: '18px', height: '18px' }} />
                  </a>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: currentTheme.text,
                  margin: '0 0 20px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '4px',
                    height: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '2px'
                  }}></span>
                  Product
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {['Features', 'Pricing', 'API Documentation', 'Data Sources', 'Annotation Services'].map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        style={{
                          fontSize: '14px',
                          color: currentTheme.textSecondary,
                          textDecoration: 'none',
                          transition: 'color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#667eea';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = currentTheme.textSecondary;
                        }}
                      >
                        {link}
                        <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: currentTheme.text,
                  margin: '0 0 20px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '4px',
                    height: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '2px'
                  }}></span>
                  Company
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {['About Us', 'Blog', 'Careers', 'Contact', 'Partners'].map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        style={{
                          fontSize: '14px',
                          color: currentTheme.textSecondary,
                          textDecoration: 'none',
                          transition: 'color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#667eea';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = currentTheme.textSecondary;
                        }}
                      >
                        {link}
                        <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support & Legal */}
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: currentTheme.text,
                  margin: '0 0 20px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '4px',
                    height: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '2px'
                  }}></span>
                  Support & Legal
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {['Help Center', 'Documentation', 'Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        style={{
                          fontSize: '14px',
                          color: currentTheme.textSecondary,
                          textDecoration: 'none',
                          transition: 'color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#667eea';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = currentTheme.textSecondary;
                        }}
                      >
                        {link}
                        <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div style={{
              paddingTop: isMobile ? '32px' : '40px',
              borderTop: isDarkMode 
                ? `1px solid rgba(102, 126, 234, 0.2)`
                : `1px solid rgba(102, 126, 234, 0.15)`,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: isMobile ? '20px' : '0',
              background: isDarkMode 
                ? 'linear-gradient(to right, rgba(102, 126, 234, 0.05), transparent, rgba(102, 126, 234, 0.05))'
                : 'linear-gradient(to right, rgba(102, 126, 234, 0.03), transparent, rgba(102, 126, 234, 0.03))',
              borderRadius: '12px',
              paddingLeft: isMobile ? '16px' : '24px',
              paddingRight: isMobile ? '16px' : '24px',
              paddingBottom: isMobile ? '24px' : '32px',
              marginTop: '8px'
            }}>
              <div style={{
                fontSize: '14px',
                color: currentTheme.text,
                fontWeight: '500'
              }}>
                © {new Date().getFullYear()} Datta Studio. All rights reserved.
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: isMobile ? '16px' : '28px',
                fontSize: '13px',
                color: currentTheme.textSecondary,
                alignItems: 'center'
              }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                  borderRadius: '20px',
                  border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`
                }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'inline-block',
                    animation: 'pulse 2s infinite',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                  }}></span>
                  <style>{`
                    @keyframes pulse {
                      0%, 100% { opacity: 1; transform: scale(1); }
                      50% { opacity: 0.7; transform: scale(1.1); }
                    }
                  `}</style>
                  <span style={{ 
                    color: '#10b981',
                    fontWeight: '500',
                    fontSize: '13px'
                  }}>All systems operational</span>
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                  borderRadius: '20px',
                  border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                  Made with <span style={{ 
                    color: '#ef4444',
                    fontSize: '16px',
                    animation: 'heartbeat 1.5s infinite'
                  }}>♥</span>
                  <style>{`
                    @keyframes heartbeat {
                      0%, 100% { transform: scale(1); }
                      50% { transform: scale(1.2); }
                    }
                  `}</style>
                  <span style={{ 
                    color: currentTheme.textSecondary,
                    marginLeft: '4px'
                  }}>for AI</span>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AnnotationDashboard;

