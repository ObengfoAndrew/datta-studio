import { db } from './firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Helper function to ensure db is initialized
function ensureDb() {
  if (!db) throw new Error('Database not initialized');
  return db as any;
}

/**
 * GitHub OAuth Service
 * Fetches repositories and user data from GitHub
 */
export const githubOAuthService = {
  /**
   * Get GitHub user and repos after OAuth callback
   */
  async fetchUserRepos(accessToken: string) {
    try {
      // Fetch user data
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) throw new Error('Failed to fetch GitHub user');
      const userData = await userResponse.json();

      // Fetch user repositories
      const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!reposResponse.ok) throw new Error('Failed to fetch GitHub repos');
      const repos = await reposResponse.json();

      return {
        user: {
          id: userData.id,
          login: userData.login,
          name: userData.name,
          avatar: userData.avatar_url,
          bio: userData.bio,
          profileUrl: userData.html_url,
        },
        repos: repos.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          isPrivate: repo.private,
          cloneUrl: repo.clone_url,
          size: repo.size, // in KB
          topics: repo.topics || [],
        })),
      };
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      throw error;
    }
  },

  /**
   * Download repository as ZIP
   */
  async downloadRepository(repoUrl: string, repoName: string) {
    try {
      const zipUrl = `${repoUrl}/archive/refs/heads/main.zip`;
      const response = await fetch(zipUrl);
      if (!response.ok) throw new Error('Failed to download repository');
      return response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },
};

/**
 * GitLab OAuth Service
 * Fetches projects and user data from GitLab
 */
export const gitlabOAuthService = {
  /**
   * Get GitLab user and projects after OAuth callback
   */
  async fetchUserProjects(accessToken: string) {
    try {
      // Fetch user data
      const userResponse = await fetch('https://gitlab.com/api/v4/user', {
        headers: {
          'PRIVATE-TOKEN': accessToken,
        },
      });

      if (!userResponse.ok) throw new Error('Failed to fetch GitLab user');
      const userData = await userResponse.json();

      // Fetch user projects
      const projectsResponse = await fetch(
        'https://gitlab.com/api/v4/projects?owned=true&per_page=100',
        {
          headers: {
            'PRIVATE-TOKEN': accessToken,
          },
        }
      );

      if (!projectsResponse.ok) throw new Error('Failed to fetch GitLab projects');
      const projects = await projectsResponse.json();

      return {
        user: {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          avatar: userData.avatar_url,
          bio: userData.bio,
          profileUrl: userData.web_url,
        },
        projects: projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          url: project.web_url,
          language: project.language,
          stars: project.star_count,
          visibility: project.visibility,
          isPrivate: project.visibility === 'private',
          cloneUrl: project.http_url_to_repo,
          size: project.statistics?.repository_size || 0,
          topics: project.tag_list || [],
        })),
      };
    } catch (error) {
      console.error('GitLab OAuth error:', error);
      throw error;
    }
  },

  /**
   * Download GitLab project as ZIP
   */
  async downloadProject(projectId: number, branch: string = 'main', accessToken: string) {
    try {
      const zipUrl = `https://gitlab.com/api/v4/projects/${projectId}/repository/archive.zip?sha=${branch}`;
      const response = await fetch(zipUrl, {
        headers: {
          'PRIVATE-TOKEN': accessToken,
        },
      });
      if (!response.ok) throw new Error('Failed to download project');
      return response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },
};

/**
 * Bitbucket OAuth Service
 * Fetches repositories and user data from Bitbucket
 */
export const bitbucketOAuthService = {
  /**
   * Get Bitbucket user and repositories after OAuth callback
   */
  async fetchUserRepositories(accessToken: string) {
    try {
      // Fetch user data
      const userResponse = await fetch('https://api.bitbucket.org/2.0/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) throw new Error('Failed to fetch Bitbucket user');
      const userData = await userResponse.json();

      // Fetch user repositories
      const reposResponse = await fetch(
        'https://api.bitbucket.org/2.0/repositories?pagelen=100',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!reposResponse.ok) throw new Error('Failed to fetch Bitbucket repositories');
      const reposData = await reposResponse.json();

      return {
        user: {
          id: userData.uuid,
          username: userData.username,
          name: userData.display_name,
          avatar: userData.links.avatar.href,
          profileUrl: userData.links.self[0].href,
        },
        repositories: (reposData.values || []).map((repo: any) => ({
          id: repo.uuid,
          name: repo.name,
          description: repo.description,
          url: repo.links.html.href,
          language: repo.language,
          isPrivate: repo.is_private,
          cloneUrl: repo.links.clone.find((c: any) => c.name === 'http')?.href,
          size: repo.size || 0,
          topics: [],
        })),
      };
    } catch (error) {
      console.error('Bitbucket OAuth error:', error);
      throw error;
    }
  },

  /**
   * Download Bitbucket repository as ZIP
   */
  async downloadRepository(repoSlug: string, workspace: string, branch: string = 'main', accessToken: string) {
    try {
      const zipUrl = `https://bitbucket.org/${workspace}/${repoSlug}/get/${branch}.zip`;
      const response = await fetch(zipUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to download repository');
      return response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },
};

/**
 * Save dataset to Firestore after OAuth connection
 */
export async function saveDatasetToFirestore(
  userId: string,
  sourceProvider: 'github' | 'gitlab' | 'bitbucket',
  sourceData: {
    id: string | number;
    name: string;
    description?: string;
    url: string;
    language?: string;
    size?: number;
  },
  licenseType: string,
  file?: Blob
) {
  try {
    const datasetsCollection = collection(ensureDb(), 'users', userId, 'datasets');
    const dataset = {
      id: `${sourceProvider}-${sourceData.id}`,
      userId,
      sourceName: sourceData.name,
      sourceType: 'code',
      sourceProvider,
      licenseType,
      description: sourceData.description || '',
      sourceUrl: sourceData.url,
      language: sourceData.language || 'unknown',
      fileSize: sourceData.size || file?.size || 0,
      fileCount: 1,
      status: 'ready',
      dateAdded: new Date().toISOString(),
      downloads: 0,
      views: 0,
      lastModified: new Date().toISOString(),
      metadata: {
        provider: sourceProvider,
        originalUrl: sourceData.url,
        importedAt: new Date().toISOString(),
        anonymized: false,
        quality: 'verified',
      },
      earnings: {
        totalLicensed: 0,
        monthlyRevenue: 0,
        licensedToCount: 0,
      },
    };

    const docRef = await addDoc(datasetsCollection, dataset);
    console.log('✅ Dataset saved to Firestore:', docRef.id);

    return {
      ...dataset,
      docId: docRef.id,
    };
  } catch (error) {
    console.error('❌ Error saving dataset to Firestore:', error);
    throw error;
  }
}

/**
 * Get all connected OAuth sources for a user
 */
export async function getConnectedSources(userId: string) {
  try {
    const sourcesRef = collection(ensureDb(), 'users', userId, 'connectedSources');
    // In real implementation, you'd query this collection
    return [];
  } catch (error) {
    console.error('Error fetching connected sources:', error);
    throw error;
  }
}

/**
 * Save connected OAuth source
 */
export async function saveConnectedSource(
  userId: string,
  provider: 'github' | 'gitlab' | 'bitbucket',
  userData: any,
  accessToken: string
) {
  try {
    const sourceDoc = doc(ensureDb(), 'users', userId, 'connectedSources', provider);
    await setDoc(sourceDoc, {
      provider,
      userData,
      accessToken, // Store securely - consider encryption in production
      connectedAt: new Date().toISOString(),
      isActive: true,
    });
    console.log(`✅ Connected source saved: ${provider}`);
  } catch (error) {
    console.error('Error saving connected source:', error);
    throw error;
  }
}
