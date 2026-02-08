'use client';

import React, { useState } from 'react';
import { Github, GitBranch, ExternalLink } from 'lucide-react';
import { 
  githubOAuthService, 
  gitlabOAuthService, 
  bitbucketOAuthService,
  saveDatasetToFirestore,
  saveConnectedSource 
} from '@/lib/oauthService';

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
  const [loading, setLoading] = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
    },
  };

  const current = isDarkMode ? theme.dark : theme.light;

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

    window.location.href = `${config.authUrl}?${params.toString()}`;
  };

  const handleSelectRepository = (repoId: string) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleImportRepositories = async () => {
    if (selectedRepos.size === 0) {
      setError('Please select at least one repository');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      for (const repoId of selectedRepos) {
        const repo = repositories.find((r) => r.id === repoId || r.id.toString() === repoId);
        if (!repo) continue;

        const dataset = await saveDatasetToFirestore(userId, provider, repo, licenseType);
        console.log('✅ Dataset imported:', dataset);
      }

      if (onComplete) {
        onComplete({
          provider,
          reposCount: selectedRepos.size,
          licenseType,
        });
      }

      // Reset state
      setSelectedRepos(new Set());
      setRepositories([]);
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
    </div>
  );
};

export default RepositoryConnector;
