'use client';

import React, { useState } from 'react';
import { ChevronDown, Check, Loader2, AlertCircle, GitBranch, Star } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  url: string;
  size?: number;
  stargazers_count?: number;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

interface RepositoryListProps {
  repos: Repository[];
  provider: 'github' | 'gitlab' | 'bitbucket';
  isDarkMode: boolean;
  onSelectRepo: (repo: Repository) => void;
  onSelectMultiple?: (repos: Repository[]) => void;
  isLoading?: boolean;
}

const RepositoryList: React.FC<RepositoryListProps> = ({
  repos,
  provider,
  isDarkMode,
  onSelectRepo,
  onSelectMultiple,
  isLoading = false,
}) => {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [expandedRepo, setExpandedRepo] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');
  const [filterLanguage, setFilterLanguage] = useState<string | null>(null);

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      hoverBg: '#f1f5f9',
      accentBg: '#eff6ff',
      accentBorder: '#bfdbfe',
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      hoverBg: '#334155',
      accentBg: '#0c4a6e',
      accentBorder: '#0ea5e9',
    },
  };

  const current = isDarkMode ? theme.dark : theme.light;

  // Get unique languages
  const languages = Array.from(new Set(repos.map((r) => r.language).filter(Boolean))).sort();

  // Filter and sort repos
  const filteredRepos = repos
    .filter((r) => !filterLanguage || r.language === filterLanguage)
    .sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      } else if (sortBy === 'stars') {
        return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  const handleSelectRepo = (repo: Repository) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repo.id)) {
      newSelected.delete(repo.id);
    } else {
      newSelected.add(repo.id);
    }
    setSelectedRepos(newSelected);
    
    if (onSelectMultiple) {
      const selectedRepoObjects = repos.filter((r) => newSelected.has(r.id));
      onSelectMultiple(selectedRepoObjects);
    } else {
      onSelectRepo(repo);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      style={{
        backgroundColor: current.bg,
        borderRadius: '12px',
        padding: '24px',
        marginTop: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: current.text,
              margin: '0 0 8px 0',
            }}
          >
            {provider === 'github' ? '🐙' : '🦊'} {repos.length} Repositories
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: current.textSecondary,
              margin: 0,
            }}
          >
            Select repositories to sync as datasets
          </p>
        </div>
        {isLoading && <Loader2 style={{ animation: 'spin 1s linear infinite' }} />}
      </div>

      {/* Filters and Sort */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${current.border}`,
            backgroundColor: current.cardBg,
            color: current.text,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="updated">Recently Updated</option>
          <option value="stars">Most Stars</option>
          <option value="name">Name (A-Z)</option>
        </select>

        {languages.length > 0 && (
          <select
            value={filterLanguage || ''}
            onChange={(e) => setFilterLanguage(e.target.value || null)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${current.border}`,
              backgroundColor: current.cardBg,
              color: current.text,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="">All Languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        )}

        {selectedRepos.size > 0 && (
          <div
            style={{
              marginLeft: 'auto',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: current.accentBg,
              border: `1px solid ${current.accentBorder}`,
              color: current.text,
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {selectedRepos.size} selected
          </div>
        )}
      </div>

      {/* Repositories List */}
      <div
        style={{
          display: 'grid',
          gap: '12px',
        }}
      >
        {filteredRepos.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: current.textSecondary,
            }}
          >
            <AlertCircle style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No repositories found</p>
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <div
              key={repo.id}
              style={{
                backgroundColor: current.cardBg,
                border: `2px solid ${selectedRepos.has(repo.id) ? '#3b82f6' : current.border}`,
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.6 : 1,
              }}
              onClick={() => handleSelectRepo(repo)}
            >
              {/* Repo Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: `2px solid ${selectedRepos.has(repo.id) ? '#3b82f6' : current.border}`,
                    backgroundColor: selectedRepos.has(repo.id) ? '#3b82f6' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {selectedRepos.has(repo.id) && (
                    <Check style={{ width: '14px', height: '14px', color: 'white' }} />
                  )}
                </div>

                {/* Repo Info */}
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: current.text,
                      margin: '0 0 4px 0',
                      wordBreak: 'break-word',
                    }}
                  >
                    {repo.name}
                  </h4>
                  <p
                    style={{
                      fontSize: '12px',
                      color: current.textSecondary,
                      margin: 0,
                    }}
                  >
                    {repo.full_name}
                  </p>
                </div>

                {/* Expand Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedRepo(expandedRepo === repo.id ? null : repo.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: current.textSecondary,
                    transition: 'transform 0.2s ease',
                    transform: expandedRepo === repo.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <ChevronDown style={{ width: '18px', height: '18px' }} />
                </button>
              </div>

              {/* Description */}
              {repo.description && (
                <p
                  style={{
                    fontSize: '13px',
                    color: current.textSecondary,
                    margin: '8px 0 0 32px',
                    lineHeight: '1.4',
                  }}
                >
                  {repo.description}
                </p>
              )}

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '12px',
                  marginLeft: '32px',
                  fontSize: '12px',
                  color: current.textSecondary,
                  flexWrap: 'wrap',
                }}
              >
                {repo.language && (
                  <span>
                    📝 {repo.language}
                  </span>
                )}
                {repo.stargazers_count !== undefined && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star style={{ width: '12px', height: '12px' }} />
                    {repo.stargazers_count}
                  </span>
                )}
                {repo.size && (
                  <span>
                    💾 {formatSize(repo.size)}
                  </span>
                )}
                {repo.updated_at && (
                  <span>
                    ⏱️ Updated {formatDate(repo.updated_at)}
                  </span>
                )}
              </div>

              {/* Expanded Details */}
              {expandedRepo === repo.id && (
                <div
                  style={{
                    marginTop: '12px',
                    marginLeft: '32px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${current.border}`,
                    fontSize: '12px',
                    color: current.textSecondary,
                  }}
                >
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <GitBranch style={{ width: '12px', height: '12px' }} />
                    View on {provider === 'github' ? 'GitHub' : 'GitLab'}
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          marginTop: '20px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: current.accentBg,
          border: `1px solid ${current.accentBorder}`,
          fontSize: '13px',
          color: current.text,
        }}
      >
        Showing {filteredRepos.length} of {repos.length} repositories
        {filterLanguage && ` (${filterLanguage})`}
      </div>
    </div>
  );
};

export default RepositoryList;
