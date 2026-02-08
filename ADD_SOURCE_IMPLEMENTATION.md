# Add Source Feature Implementation

## Overview
The "Add Source" feature allows users to connect their GitHub, GitLab, and Bitbucket repositories to import code datasets into their Data Wallet. The complete flow has been implemented with OAuth authentication and repository selection.

## Feature Flow

### 1. **Dashboard** (Initial State)
- User clicks the **"Add Source"** button in the Data Sources section
- This opens the `AddDataSourceModal`

### 2. **Add Data Source Modal** (`AddDataSourceModal.tsx`)
Shows three source options:
- 🔗 **GitHub** - Connect your GitHub repositories
- 🦊 **GitLab** - Connect your GitLab projects  
- 📁 **Upload Code Files** - Upload ZIP, TAR, or code files

**When user selects GitHub or GitLab:**
1. License selection modal appears
2. User chooses license tier (Personal, Professional, Enterprise)
3. Repository Connector component opens

### 3. **Repository Connector** (`RepositoryConnector.tsx`)

#### **Phase 1: OAuth Connection**
- Shows "Connect with GitHub/GitLab" button
- User clicks to initiate OAuth flow
- Redirected to GitHub/GitLab login
- User approves permission scopes
- OAuth callback window closes automatically

#### **Phase 2: Repository Display**
After OAuth succeeds:
- Component receives repositories via `postMessage` from callback
- Displays user's repositories in a scrollable list
- Shows repository details:
  - Repository name
  - Description
  - Language/Technology stack
  - Stars count
  - Last updated date
  - Repository size

#### **Phase 3: Repository Selection**
- User can select multiple repositories with checkboxes
- "X selected" badge shows count
- Selection persists while scrolling

#### **Phase 4: Import**
- User clicks **"Import Repository(ies)"** button
- System saves selected repositories to Firestore:
  - Creates dataset entry for each repository
  - Associates with selected license tier
  - Stores user profile information
  - Logs activity

## Key Components Updated

### 1. **RepositoryConnector.tsx** - Main Enhancement
**New Features:**
- ✅ PostMessage listener for OAuth callback
- ✅ Two-phase UI (connect → select repositories)
- ✅ Integration with RepositoryList component
- ✅ Multi-select repository support
- ✅ Error handling with user feedback
- ✅ Back navigation to re-authenticate

**State Management:**
```typescript
const [repositories, setRepositories] = useState<any[]>([]);
const [userData, setUserData] = useState<any>(null);
const [selectedRepos, setSelectedRepos] = useState<any[]>([]);
const [showRepositories, setShowRepositories] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 2. **RepositoryList.tsx** - Type Update
**Change:**
- Updated provider type to include `'bitbucket'`
- Now supports: `'github' | 'gitlab' | 'bitbucket'`

### 3. **AddDataSourceModal.tsx** - Integration Point
**Already Implemented:**
- Takes OAuth flow output
- Passes to onDatasetAdded callback
- Triggers data wallet update

## OAuth Callback Flow

### GitHub Example
**Request:**
```
https://github.com/login/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://yourapp.com/api/auth/github/callback&
  scope=repo user&
  state=...
```

**Callback Response** (`/api/auth/github/callback`):
1. Server exchanges code for access token via GitHub API
2. Fetches user profile and repositories (up to 100)
3. Returns HTML page that posts message back to opener:
```javascript
window.opener.postMessage({
  type: 'github-auth-success',
  data: {
    user: { id, login, name, avatar_url, ... },
    repos: [ { id, name, description, url, ... }, ... ]
  }
}, '*')
```
4. RepositoryConnector listens for this message
5. Displays repositories immediately

## Firestore Data Structure

### Datasets Created
```
users/{userId}/datasets/{datasetId}
├── title: "repository-name"
├── sourceType: "code"
├── sourceProvider: "github"
├── licenseType: "professional"
├── metadata:
│   └── repositoryUrl: "https://github.com/user/repo"
├── status: "published"
└── dateAdded: timestamp
```

### Connections Stored
```
users/{userId}/connections/{connectionId}
├── provider: "github"
├── userName: "github-username"
├── userEmail: "user@example.com"
├── avatar: "avatar-url"
├── accessToken: "encrypted-token"
└── createdAt: timestamp
```

## User Experience Walkthrough

### Step-by-Step
1. **Click "Add Source"** → Add Source Modal opens
2. **Select GitHub** → License selection prompt appears
3. **Choose License** → Repository Connector shows "Connect with GitHub"
4. **Click Connect** → Redirected to GitHub (new window)
5. **Approve Permissions** → Window closes automatically
6. **See Repositories** → Connector now shows your GitHub repos
7. **Select Repos** → Checkboxes enable multi-select
8. **Click Import** → System processes and saves repos

### Feedback Messages
- **Connecting...** - Shows while OAuth is in progress
- **X selected** - Badge shows number of repos selected
- **Error messages** - Clear, actionable error descriptions
- **Success** - Modal closes, datasets appear in wallet

## Environment Variables Required

```env
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# GitLab OAuth
NEXT_PUBLIC_GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret

# Bitbucket OAuth (optional)
NEXT_PUBLIC_BITBUCKET_CLIENT_ID=your_bitbucket_client_id
BITBUCKET_CLIENT_SECRET=your_bitbucket_client_secret

# Mock Mode (for development without actual OAuth)
NEXT_PUBLIC_MOCK_OAUTH=false
```

## Testing Checklist

- [ ] Click "Add Source" button opens modal
- [ ] All three source options are visible (GitHub, GitLab, Upload)
- [ ] Selecting GitHub → shows license modal
- [ ] License selection → shows RepositoryConnector
- [ ] Click "Connect with GitHub" → redirects to GitHub
- [ ] Grant permissions → auto returns to app
- [ ] Repositories list displays with 3+ repos
- [ ] Can select multiple repositories (checkboxes work)
- [ ] Selected count badge updates
- [ ] "Import" button only enabled when repos selected
- [ ] Click Import → saves to Firestore
- [ ] Error handling: connection failure shows user-friendly message
- [ ] Dark mode styling applies correctly
- [ ] Works on mobile view

## Mock Data for Testing

When `NEXT_PUBLIC_MOCK_OAUTH=true`, the OAuth callback returns mock data:

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
      name: 'sample-repo-1',
      description: 'Sample Repository 1',
      url: 'https://github.com/demo-user/sample-repo-1',
      language: 'JavaScript',
      stargazers_count: 10
    },
    // ... more repos
  ]
}
```

## Error Handling

### Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| redirect_uri_mismatch | OAuth app settings don't match | Check GitHub/GitLab app settings |
| access_denied | User clicked "Cancel" | Try again, click "Authorize" |
| No repositories found | User has no repos on provider | Create a repository first |
| Connection timeout | Network issue | Check internet connection |

## Related Files

- `src/components/dashboard/AddDataSourceModal.tsx` - Main modal
- `src/components/dashboard/RepositoryConnector.tsx` - OAuth + selection
- `src/components/dashboard/RepositoryList.tsx` - Repository list display
- `src/components/dashboard/EnhancedDashboard.tsx` - Dashboard container
- `src/components/dashboard/DashboardContent.tsx` - Dashboard content
- `src/app/api/auth/github/callback/route.ts` - GitHub OAuth endpoint
- `src/app/api/auth/gitlab/callback/route.ts` - GitLab OAuth endpoint
- `src/lib/oauthService.ts` - OAuth service methods

## Future Enhancements

- [ ] GitLab self-hosted instance support
- [ ] Filter repositories by language during selection
- [ ] Search repositories by name
- [ ] Pagination for users with 100+ repositories
- [ ] Sync repositories on a schedule
- [ ] Show repository stats (commits, contributors)
- [ ] Support for Bitbucket with proper OAuth flow
- [ ] Private repository handling with proper permissions

## Support

For issues or questions:
1. Check the error message displayed in the UI
2. Review browser console for detailed logs
3. Verify OAuth app credentials in GitHub/GitLab settings
4. Check that `.env.local` has required environment variables
5. Ensure redirect URL matches in OAuth app settings
