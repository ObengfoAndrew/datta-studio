'use client';

import React, { useState, useEffect } from 'react';
import { Github, GitBranch, ExternalLink, ChevronLeft, Check } from 'lucide-react';
import { 
  githubOAuthService, 
  gitlabOAuthService, 
  bitbucketOAuthService,
  saveDatasetToFirestore,
  saveConnectedSource 
} from '@/lib/oauthService';
import RepositoryList from './RepositoryList';

interface RepositoryConnectorProps {
  userId: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  licenseType: string;
  isDarkMode: boolean;
  onComplete?: (dataset: any) => void;
  onError?: (error: Error) => void;
}

const RepositoryConnector: React.FC<RepositoryConnectorProps> = ({
  userId,
  provider,
  licenseType,
  isDarkMode,
  onComplete,
  onError,
}) => {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [showRepositories, setShowRepositories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      borderLight: '#475569',
    },
  };

  const current = isDarkMode ? theme.dark : theme.light;

  // Listen for postMessage from OAuth callback
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'github-auth-success' || event.data.type === 'gitlab-auth-success') {
        const { user, repos } = event.data.data;
        console.log('✅ OAuth Success:', { provider, user: user?.login || user?.username, repoCount: repos?.length });
        
        setUserData(user);
        setRepositories(repos || []);
        setShowRepositories(true);
        setError(null);
      } else if (event.data.type === 'github-auth-error' || event.data.type === 'gitlab-auth-error') {
        const errorMsg = event.data.error || 'OAuth authentication failed';
        console.error('❌ OAuth Error:', errorMsg);
        setError(`Authentication failed: ${errorMsg}`);
        if (onError) onError(new Error(errorMsg));
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [provider, onError]);

  const getProviderConfig = () => {
    switch (provider) {
      case 'github':
        return {
          name: 'GitHub',
          icon: '🔗',
          clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
          redirectUri: `${window.location.origin}/api/auth/github/callback`,
          authUrl: 'https://github.com/login/oauth/authorize',
          scopes: ['repo', 'user'],
        };
      case 'gitlab':
        return {
          name: 'GitLab',
          icon: '🦊',
          clientId: process.env.NEXT_PUBLIC_GITLAB_CLIENT_ID || '',
          redirectUri: `${window.location.origin}/api/auth/gitlab/callback`,
          authUrl: 'https://gitlab.com/oauth/authorize',
          scopes: ['api', 'read_user', 'read_repository'],
        };
      case 'bitbucket':
        return {
          name: 'Bitbucket',
          icon: '🪣',
          clientId: process.env.NEXT_PUBLIC_BITBUCKET_CLIENT_ID || '',
          redirectUri: `${window.location.origin}/api/auth/bitbucket/callback`,
          authUrl: 'https://bitbucket.org/site/oauth2/authorize',
          scopes: ['repository'],
        };
      default:
        return null;
    }
  };

  const handleOAuthConnect = () => {
    const config = getProviderConfig();
    if (!config) return;

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state: JSON.stringify({ provider, userId, licenseType }),
      response_type: 'code',
    });

    // Open OAuth in a popup window so postMessage can work
    const authUrl = `${config.authUrl}?${params.toString()}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      authUrl,
      'GitHub OAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleSelectRepository = (repo: any) => {
    // Handle both single and multiple selection
    const isSelected = selectedRepos.some((r) => r.id === repo.id);
    const newSelected = isSelected 
      ? selectedRepos.filter((r) => r.id !== repo.id) 
      : [...selectedRepos, repo];
    setSelectedRepos(newSelected);
  };

  const handleSelectMultiple = (repos: any[]) => {
    setSelectedRepos(repos);
  };

  const handleBackToConnect = () => {
    setShowRepositories(false);
    setRepositories([]);
    setUserData(null);
    setSelectedRepos([]);
    setError(null);
  };

  const handleImportRepositories = async () => {
    if (selectedRepos.length === 0) {
      setError('Please select at least one repository');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      let successCount = 0;
      
      for (const repo of selectedRepos) {
        try {
          const dataset = await saveDatasetToFirestore(userId, provider, repo, licenseType);
          console.log('✅ Dataset imported:', dataset);
          successCount++;
        } catch (repoError) {
          console.error(`⚠️ Failed to import ${repo.name}:`, repoError);
          // Continue with next repo if one fails
        }
      }

      if (successCount === 0) {
        throw new Error('Failed to import any repositories');
      }

      if (onComplete) {
        onComplete({
          provider,
          reposCount: successCount,
          licenseType,
          user: userData,
        });
      }

      // Reset state
      setSelectedRepos([]);
      setRepositories([]);
      setShowRepositories(false);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to import repositories';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: current.cardBg,
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${current.border}`,
      }}
    >
      {!showRepositories ? (
        // Initial OAuth Connection Screen
        <>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: current.text, margin: '0 0 12px 0' }}>
              Connect {getProviderConfig()?.name}
            </h3>
            <p style={{ fontSize: '14px', color: current.textSecondary, margin: 0 }}>
              Authorize Datta Studio to access your {getProviderConfig()?.name} repositories and import code datasets.
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#dc2626',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleOAuthConnect}
            disabled={connecting}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: connecting ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: connecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <ExternalLink style={{ width: '16px', height: '16px' }} />
            {connecting ? 'Connecting...' : `Connect with ${getProviderConfig()?.name}`}
          </button>

          <p style={{ fontSize: '12px', color: current.textSecondary, marginTop: '12px', margin: '12px 0 0 0' }}>
            You'll be redirected to {getProviderConfig()?.name} to authorize access.
          </p>
        </>
      ) : (
        // Repository Selection Screen
        <>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <button
                onClick={handleBackToConnect}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  padding: '0',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#3b82f6')}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
                Back
              </button>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: current.text, margin: '0 0 8px 0' }}>
                {repositories.length} Repositories Found
              </h3>
              <p style={{ fontSize: '14px', color: current.textSecondary, margin: 0 }}>
                {userData?.login || userData?.username} • License: {licenseType}
              </p>
            </div>
            {selectedRepos.length > 0 && (
              <div
                style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {selectedRepos.length} selected
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#dc2626',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {repositories.length > 0 ? (
            <>
              <div style={{ marginBottom: '24px', maxHeight: 'calc(70vh - 300px)', overflowY: 'auto' }}>
                <RepositoryList
                  repos={repositories}
                  provider={provider}
                  isDarkMode={isDarkMode}
                  onSelectRepo={handleSelectRepository}
                  onSelectMultiple={handleSelectMultiple}
                  isLoading={loading}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={handleBackToConnect}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
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
                  onClick={handleImportRepositories}
                  disabled={selectedRepos.length === 0 || connecting}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    backgroundColor: selectedRepos.length === 0 || connecting ? '#d1d5db' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: selectedRepos.length === 0 || connecting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRepos.length > 0 && !connecting) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRepos.length > 0 && !connecting) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                    }
                  }}
                >
                  <Check style={{ width: '16px', height: '16px' }} />
                  {connecting ? 'Importing...' : `Import ${selectedRepos.length} Repository(${selectedRepos.length !== 1 ? 'ies' : 'y'})`}
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: current.textSecondary,
              }}
            >
              <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>No repositories found</p>
              <p style={{ fontSize: '12px', margin: 0, opacity: 0.75 }}>
                Make sure you have at least one repository on {getProviderConfig()?.name}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RepositoryConnector;
