# Repository Sync Implementation Progress

## ✅ Completed

### 1. OAuth Callbacks Already Fetch Repos
- GitHub callback: Fetches user data + repos via `/api/github/callback`
- GitLab callback: Fetches user data + repos via `/api/gitlab/callback`
- Both return repos data via postMessage to opener

### 2. Firestore Schema Documented
- Created comprehensive [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md)
- Defined users, connections, and datasets collections
- Includes TypeScript interfaces and query examples

### 3. Validation Endpoint Created
- `POST /api/auth/store-connection` - Validates connection data
- Prepares data for client-side Firestore storage
- Returns validation success

### 4. Repository List Component Created
- New component: `RepositoryList.tsx`
- Features:
  - Display repos with metadata (stars, size, language, etc)
  - Multi-select with checkboxes
  - Sort by: updated, stars, name
  - Filter by language
  - Expandable details with link to source
  - Dark/light mode support

---

## 🔄 In Progress

### Step 1: Integrate OAuth with Firestore Storage ⏳

**What needs to happen:**
1. OAuth callback returns user + repos via postMessage
2. EnhancedDashboard receives postMessage event
3. Store connection to Firestore using client-side SDK
4. Show RepositoryList component

**Files to update:**
- `src/components/EnhancedDashboard.tsx` - Add postMessage listener and Firestore storage

---

## ⏳ Next Steps

### Step 2: Create Repo Sync API Endpoint
- `POST /api/pilot/sync` - Sync selected repos to datasets
- Query repo contents from GitHub/GitLab
- Create dataset documents in Firestore
- Track sync status

### Step 3: Display Connected Repositories in Dashboard
- Show list of user's connections
- List all connected repos for each provider
- Allow selecting repos to sync
- Show sync status and history

### Step 4: Implement Auto-Sync
- Background job to refresh repo list
- Automatic syncing when repos update
- Notification on sync completion

---

## Current Data Flow

```
User OAuth Flow:
1. User selects GitHub/GitLab + License in UI
2. Redirects to OAuth provider
3. OAuth provider redirects to callback
4. Callback fetches user data + repos
5. Callback sends postMessage with data to opener
6. [NEXT] EnhancedDashboard receives postMessage
7. [NEXT] Display RepositoryList component
8. User selects repos
9. [NEXT] Store connection to Firestore
10. [NEXT] Sync selected repos via /api/pilot/sync
```

---

## File Structure

```
src/
├── app/api/auth/
│   ├── github/
│   │   ├── start/route.ts ✅
│   │   └── callback/route.ts ✅ (fetches repos)
│   ├── gitlab/
│   │   ├── start/route.ts ✅
│   │   └── callback/route.ts ✅ (fetches repos)
│   └── store-connection/route.ts ✅ (validates)
├── app/api/pilot/
│   └── sync/ (⏳ TODO: needs creation)
└── components/
    ├── EnhancedDashboard.tsx (⏳ TODO: add postMessage listener)
    ├── RepositoryList.tsx ✅ (new component)
    └── AddDataSourceModal.tsx ✅
```

---

## Component Integration Plan

### RepositoryList Component

**Props:**
```typescript
repos: Repository[]              // Array of repos to display
provider: 'github' | 'gitlab'    // Which provider
isDarkMode: boolean              // Theme
onSelectRepo: (repo) => void     // Single selection
onSelectMultiple?: (repos) => void // Multi selection
isLoading?: boolean              // Loading state
```

**Usage Example:**
```typescript
<RepositoryList
  repos={reposData}
  provider="github"
  isDarkMode={isDarkMode}
  onSelectMultiple={(selectedRepos) => {
    // Handle selected repos
    syncRepos(selectedRepos);
  }}
/>
```

---

## Firestore Integration Checklist

- [ ] Update EnhancedDashboard to listen for postMessage
- [ ] Store connections to Firestore with user auth
- [ ] Store repo metadata in Firestore
- [ ] Create RepositoryList display modal/page
- [ ] Implement repo selection UI
- [ ] Create sync API endpoint
- [ ] Trigger sync on repo selection
- [ ] Display sync status to user
- [ ] Show synced datasets in main dashboard

---

## API Endpoints Overview

### Existing ✅
- `GET /api/auth/github/start` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - Handle GitHub callback + fetch repos
- `GET /api/auth/gitlab/start` - Initiate GitLab OAuth
- `GET /api/auth/gitlab/callback` - Handle GitLab callback + fetch repos
- `POST /api/auth/store-connection` - Validate connection data

### Todo ⏳
- `POST /api/pilot/sync` - Sync repos to datasets
- `GET /api/pilot/connections` - List user's connections
- `GET /api/pilot/repositories` - List connected repos
- `POST /api/pilot/repos/{id}/sync` - Sync specific repo

---

## Environment Setup

All environment variables already configured in `.env.local`:
- ✅ GITHUB_CLIENT_ID & SECRET
- ✅ NEXT_PUBLIC_GITHUB_CLIENT_ID
- ✅ GITLAB_CLIENT_ID & SECRET
- ✅ NEXT_PUBLIC_GITLAB_CLIENT_ID
- ✅ NEXT_PUBLIC_MOCK_OAUTH

---

## Testing the Flow

### Test Repos Fetching
1. Start dev server: `npm run dev`
2. Open: `http://localhost:3002/api/auth/github/start`
3. Authorize with GitHub
4. Check browser console for postMessage event
5. Should see repos data with stars, languages, etc

### Test Component Display
Once EnhancedDashboard is updated:
1. OAuth flow triggers
2. RepositoryList appears
3. Can filter by language
4. Can sort by updated/stars/name
5. Can select multiple repos

---

## Next Immediate Task

Update `src/components/EnhancedDashboard.tsx` to:

1. Listen for `postMessage` events from OAuth callback
2. Extract user + repos data
3. Display RepositoryList component with repos
4. Handle repo selection
5. Store connection to Firestore

This is the crucial link between OAuth and the repo list display!
