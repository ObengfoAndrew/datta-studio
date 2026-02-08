# Add Source Feature - API Reference

## OAuth Endpoints

### GitHub OAuth Start
**Endpoint:** `GET /api/auth/github/start`

**Purpose:** Initiates GitHub OAuth flow

**Response:** Redirects to `https://github.com/login/oauth/authorize`

**Example:**
```
GET http://localhost:3000/api/auth/github/start
↓
Redirects to GitHub authorization page
```

---

### GitHub OAuth Callback
**Endpoint:** `GET /api/auth/github/callback`

**Query Parameters:**
- `code` - Authorization code from GitHub
- `state` - State parameter for security

**Process:**
1. Exchanges `code` for access token
2. Fetches user profile from GitHub API
3. Fetches user repositories (up to 100)
4. Returns HTML with postMessage to parent window

**PostMessage Sent:**
```javascript
{
  type: 'github-auth-success',
  data: {
    user: {
      id: number,
      login: string,
      name: string,
      avatar_url: string,
      bio?: string,
      profileUrl: string
    },
    repos: Array<{
      id: number,
      name: string,
      description?: string,
      url: string,
      language?: string,
      stars: number,
      forks: number,
      isPrivate: boolean,
      cloneUrl: string,
      size: number,
      topics: string[]
    }>
  }
}
```

**Error Response:**
```javascript
{
  type: 'github-auth-error',
  error: string,           // e.g., 'access_denied'
  description?: string
}
```

---

### GitLab OAuth Start
**Endpoint:** `GET /api/auth/gitlab/start`

**Purpose:** Initiates GitLab OAuth flow

**Response:** Redirects to `https://gitlab.com/oauth/authorize`

---

### GitLab OAuth Callback
**Endpoint:** `GET /api/auth/gitlab/callback`

**Query Parameters:**
- `code` - Authorization code from GitLab
- `state` - State parameter for security

**PostMessage Sent:**
```javascript
{
  type: 'gitlab-auth-success',
  data: {
    user: {
      id: number,
      username: string,
      name: string,
      avatar?: string,
      bio?: string,
      profileUrl: string
    },
    repos: Array<{
      id: number,
      name: string,
      description?: string,
      url: string,
      language?: string,
      stars: number,
      visibility: 'public' | 'private',
      isPrivate: boolean,
      cloneUrl: string,
      size: number,
      topics: string[]
    }>
  }
}
```

---

### Bitbucket OAuth Start
**Endpoint:** `GET /api/auth/bitbucket/start`

**Purpose:** Initiates Bitbucket OAuth flow

**Response:** Redirects to `https://bitbucket.org/site/oauth2/authorize`

---

### Bitbucket OAuth Callback
**Endpoint:** `GET /api/auth/bitbucket/callback`

**PostMessage Sent:**
```javascript
{
  type: 'bitbucket-auth-success',
  data: {
    user: {
      id: string,
      username: string,
      display_name: string,
      avatar: string,
      profileUrl: string
    },
    repositories: Array<{
      id: string,
      name: string,
      description?: string,
      url: string,
      language?: string,
      isPrivate: boolean,
      cloneUrl: string,
      size: number
    }>
  }
}
```

---

## Data Service Methods

### saveDatasetToFirestore()
**Location:** `src/lib/oauthService.ts`

**Signature:**
```typescript
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
): Promise<Dataset>
```

**Parameters:**
- `userId` - Firebase user ID
- `sourceProvider` - OAuth provider name
- `sourceData` - Repository data from OAuth
- `licenseType` - License selection (personal, professional, enterprise)
- `file` - Optional file blob

**Returns:** Created Dataset object

**Example:**
```typescript
const dataset = await saveDatasetToFirestore(
  'user-123',
  'github',
  {
    id: 123456,
    name: 'my-awesome-repo',
    description: 'An awesome repository',
    url: 'https://github.com/user/my-awesome-repo',
    language: 'TypeScript',
    size: 5120
  },
  'professional'
);
```

---

### saveConnectedSource()
**Location:** `src/lib/oauthService.ts`

**Signature:**
```typescript
export async function saveConnectedSource(
  userId: string,
  provider: 'github' | 'gitlab' | 'bitbucket',
  userData: any,
  accessToken: string
): Promise<string>
```

**Purpose:** Saves OAuth connection for future use

**Returns:** Connection ID

---

### getConnectedSources()
**Location:** `src/lib/oauthService.ts`

**Signature:**
```typescript
export async function getConnectedSources(userId: string): Promise<any[]>
```

**Purpose:** Retrieves all connected OAuth sources for a user

**Returns:** Array of connected sources

---

## React Components

### AddDataSourceModal
**Props:**
```typescript
interface AddDataSourceModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onDatasetAdded?: (
    sourceType: SourceType,
    licenseType: LicenseType,
    file?: File,
    sourceProvider?: string
  ) => void;
  currentUser?: FirebaseUser | null;
}
```

---

### RepositoryConnector
**Props:**
```typescript
interface RepositoryConnectorProps {
  userId: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  licenseType: string;
  isDarkMode: boolean;
  onComplete?: (dataset: any) => void;
  onError?: (error: Error) => void;
}
```

**State Events:**
- Listens for `'github-auth-success'` postMessage
- Listens for `'gitlab-auth-success'` postMessage
- Listens for `'github-auth-error'` postMessage
- Listens for `'gitlab-auth-error'` postMessage

---

### RepositoryList
**Props:**
```typescript
interface RepositoryListProps {
  repos: Repository[];
  provider: 'github' | 'gitlab' | 'bitbucket';
  isDarkMode: boolean;
  onSelectRepo: (repo: Repository) => void;
  onSelectMultiple?: (repos: Repository[]) => void;
  isLoading?: boolean;
}
```

**Repository Interface:**
```typescript
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
```

---

## Firestore Collections

### users/{userId}/datasets
**Schema:**
```typescript
{
  id: string;
  title: string;
  sourceType: 'code' | 'art' | 'voice';
  sourceProvider: string;
  licenseType: 'personal' | 'professional' | 'enterprise';
  status: 'published' | 'draft';
  metadata: {
    description: string;
    tags: string[];
    repositoryUrl?: string;
  };
  fileSize: number;
  downloads: number;
  views: number;
  dateAdded: string; // ISO timestamp
}
```

### users/{userId}/connections
**Schema:**
```typescript
{
  id: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  userName: string;
  userEmail: string;
  avatar: string;
  accessToken: string; // Encrypted
  createdAt: string;
  lastUsed?: string;
}
```

---

## Error Messages

### Common OAuth Errors
| Code | Message | Solution |
|------|---------|----------|
| `redirect_uri_mismatch` | The redirect URI doesn't match OAuth app settings | Update callback URL in OAuth app |
| `access_denied` | User declined authorization | User needs to approve OAuth consent |
| `invalid_client_id` | Client ID is invalid | Verify NEXT_PUBLIC_GITHUB_CLIENT_ID |
| `invalid_client_secret` | Client secret is invalid | Verify GITHUB_CLIENT_SECRET |
| `No repositories found` | User has no repositories | Create a repository on GitHub/GitLab |
| `Network timeout` | Cannot reach OAuth provider | Check internet connection |

---

## Testing with Mock Data

**Enable Mock Mode:**
```env
NEXT_PUBLIC_MOCK_OAUTH=true
```

**Mock Response:**
```javascript
{
  user: {
    id: 12345,
    login: 'demo-user',
    name: 'Demo User',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
  },
  repos: [
    {
      id: 1,
      name: 'demo-repo-1',
      description: 'A demo repository',
      url: 'https://github.com/demo-user/demo-repo-1',
      language: 'JavaScript',
      stargazers_count: 42
    },
    // ... additional sample repos
  ]
}
```

---

## Rate Limiting

### GitHub API
- Authenticated: 5,000 requests/hour
- Per repository: 60 requests/hour (unauthenticated)

### GitLab API
- Default: 300 requests/minute
- Can be increased with authentication

### Bitbucket API
- Rate: 60-70,000 requests/hour (authenticated)

---

## Security Considerations

### 1. Access Token Handling
- Tokens should be encrypted before storage
- Never log tokens in console
- Use HTTPS for all OAuth flows

### 2. CORS & Origin Validation
- Always validate postMessage origin
- Only accept messages from same origin
- Never use wildcard `*` in production

### 3. State Parameter
- Random state generated per request
- Validates against response state
- Prevents CSRF attacks

### 4. Environment Variables
- Keep secrets in `.env.local` (not committed)
- Never expose client secrets in frontend code
- Use backend for token exchange only

---

## Aliases & Connections

When connecting multiple OAuth sources:
- Each connection stored separately
- Can have multiple providers per user
- Connections are reusable
- Lost tokens cannot be recovered (user must reconnect)
