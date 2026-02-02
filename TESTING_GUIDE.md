# OAuth Repository Syncing - Testing Guide

## Quick Start Testing

### Prerequisites
1. GitHub OAuth Application created (or use mock mode)
2. GitLab OAuth Application created (or use mock mode)
3. Firebase configured with Firestore
4. User logged in to the application

### Mock Mode Testing (No OAuth Setup Required)
```bash
# Set this environment variable to test without OAuth providers
NEXT_PUBLIC_MOCK_OAUTH=true
```

When enabled, OAuth callbacks return sample data instead of calling actual provider APIs.

---

## Test Scenarios

### Scenario 1: GitHub OAuth Flow
**Objective:** Test complete GitHub OAuth authentication and repository syncing

**Steps:**
1. Log into the application
2. Click "Add Dataset" → "Connect GitHub"
3. Select "Free" license tier
4. Get redirected to GitHub OAuth approval screen
5. Click "Authorize Datta Studio"
6. Get redirected back to the app
7. See modal with your GitHub repositories

**Expected Results:**
- ✅ Redirected to GitHub OAuth screen
- ✅ Authorized successfully
- ✅ RepositoryList modal appears with repos
- ✅ User profile info displayed (avatar, name, email)
- ✅ Repositories sorted by updated date (newest first)

**Verification:**
```typescript
// Check browser console for logs:
✅ GitHub OAuth success: {...}
✅ OAuth connection stored: {connectionId}
✅ {N} repositories stored to Firestore
✅ {N} datasets created with license: free
```

---

### Scenario 2: Repository Selection and Multi-Select
**Objective:** Test multi-repository selection with different sort/filter options

**Steps:**
1. In the RepositoryList modal, sort by "Most Stars"
2. Filter by language (e.g., "TypeScript")
3. Select 2-3 repositories with checkboxes
4. Click "Sync Selected" button
5. Wait for sync to complete

**Expected Results:**
- ✅ Repositories re-sort by stargazers_count (descending)
- ✅ Only TypeScript repos visible
- ✅ Selected repos are highlighted
- ✅ Sync button shows "Syncing..." state
- ✅ Success message appears: "Successfully connected and synced N repositories"

**Verification in Firestore:**
```javascript
// Users/{userId}/repositories/
// Should contain selected repos with:
- name: string
- fullName: string
- provider: "github"
- stars: number
- language: "TypeScript"
- connectionId: {connectionId}

// Users/{userId}/datasets/
// Should contain entries for each synced repo:
- name: string
- sourceProvider: "github"
- licenseType: "free"
- status: "synced"
- metadata.stars: number
```

---

### Scenario 3: GitLab OAuth Flow
**Objective:** Test GitLab OAuth (similar to GitHub but different API)

**Steps:**
1. Log into the application
2. Click "Add Dataset" → "Connect GitLab"
3. Select "Pro" license tier
4. Get redirected to GitLab.com OAuth approval screen
5. Authorize the application
6. Get redirected back to the app
7. See RepositoryList with your GitLab projects

**Expected Results:**
- ✅ Redirected to GitLab OAuth screen
- ✅ Shows GitLab user profile
- ✅ Lists GitLab projects (converted to "repositories" format)
- ✅ Pro license stored with datasets

**Note:** Self-hosted GitLab instances supported via `GITLAB_INSTANCE` env var

---

### Scenario 4: Error Handling

#### Test 4.1: Missing License Selection
**Steps:**
1. Try to OAuth without selecting a license first
2. Verify error handling

**Expected Result:**
- ✅ License selection is required before OAuth
- ✅ Clear error message shown

#### Test 4.2: OAuth Cancellation
**Steps:**
1. Start GitHub OAuth flow
2. Click "Cancel" on GitHub approval screen
3. Verify app handles cancellation gracefully

**Expected Result:**
- ✅ Close OAuth window without hanging
- ✅ Modal closed, ready for another attempt
- ✅ No partial data stored

#### Test 4.3: Network Error During Sync
**Steps:**
1. Open browser DevTools → Network tab
2. Set offline during repository selection
3. Try to sync

**Expected Result:**
- ✅ Error message shows: "Failed to store connection"
- ✅ Modal remains open for retry
- ✅ No partial data in Firestore

---

### Scenario 5: Firestore Data Persistence

**Steps:**
1. Complete GitHub OAuth flow and sync 3 repos with "Free" license
2. Complete GitLab OAuth flow and sync 2 repos with "Pro" license
3. Refresh the page
4. Check dashboard for synced datasets

**Expected Results:**

**In Firestore (Users/{userId}/connections/):**
```javascript
{
  provider: "github",
  userName: "octocat",
  userEmail: "octocat@github.com",
  createdAt: Timestamp,
  updatedAt: Timestamp
}

{
  provider: "gitlab",
  userName: "johndoe",
  userEmail: "john@example.com",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**In Firestore (Users/{userId}/datasets/):**
```javascript
{
  name: "react",
  sourceProvider: "github",
  licenseType: "free",
  status: "synced",
  metadata: {
    stars: 200000,
    language: "JavaScript",
    url: "https://github.com/facebook/react"
  }
}

{
  name: "gitlab-ce",
  sourceProvider: "gitlab",
  licenseType: "pro",
  status: "synced",
  metadata: {
    stars: 23000,
    language: "Ruby",
    url: "https://gitlab.com/gitlab-org/gitlab-foss"
  }
}
```

**In Recent Activity:**
- ✅ "Connected github account" - 🐙 icon
- ✅ "Connected gitlab account" - 🦊 icon
- ✅ "Created 3 datasets from github" - 📊 icon
- ✅ "Created 2 datasets from gitlab" - 📊 icon

---

### Scenario 6: Dark Mode & Responsive Design

**Steps:**
1. Toggle dark mode in settings
2. Complete OAuth flow
3. Check RepositoryList modal appearance
4. Resize window to test mobile view
5. Verify modal layout on mobile

**Expected Results:**
- ✅ RepositoryList modal matches dark mode colors
- ✅ Text readable in both modes
- ✅ Modal responsive on mobile (90% width)
- ✅ Scroll works for long repo lists

---

## API Testing

### Test POST /api/pilot/sync

```bash
curl -X POST http://localhost:3000/api/pilot/sync \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "abc123",
    "repositories": [
      {
        "id": 1234567,
        "name": "react",
        "full_name": "facebook/react",
        "description": "A JavaScript library for building user interfaces",
        "html_url": "https://github.com/facebook/react",
        "size": 300000,
        "stargazers_count": 200000,
        "language": "JavaScript",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "licenseType": "pro",
    "provider": "github"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "datasetsCreated": 1,
  "datasets": [
    {
      "id": "github-abc123-1234567",
      "name": "react",
      "status": "syncing",
      "url": "https://github.com/facebook/react",
      "provider": "github",
      "licenseType": "pro"
    }
  ],
  "message": "✅ Successfully queued 1 repositories for sync from github",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Test GET /api/pilot/sync

```bash
# Get all sync status
curl http://localhost:3000/api/pilot/sync

# Filter by provider
curl http://localhost:3000/api/pilot/sync?provider=github

# Filter by connection
curl http://localhost:3000/api/pilot/sync?connectionId=abc123

# Filter by status
curl http://localhost:3000/api/pilot/sync?status=synced
```

**Expected Response:**
```json
{
  "success": true,
  "syncStatus": "idle",
  "activeSyncs": 0,
  "completedSyncs": 5,
  "failedSyncs": 0,
  "lastSyncTime": "2024-01-15T10:25:00Z",
  "datasets": [
    {
      "id": "github-abc123-1234567",
      "name": "react",
      "provider": "github",
      "status": "synced",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Test DELETE /api/pilot/sync

```bash
curl -X DELETE http://localhost:3000/api/pilot/sync \
  -H "Content-Type: application/json" \
  -d '{
    "datasetId": "github-abc123-1234567",
    "connectionId": "abc123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Sync/dataset github-abc123-1234567 cancelled successfully",
  "datasetId": "github-abc123-1234567",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Browser DevTools Testing

### Console Logs to Watch For
```javascript
// OAuth initiation
🔐 Initiating OAuth connection: github
🔐 Initiating OAuth connection: gitlab

// OAuth success
✅ GitHub OAuth success: {...}
✅ GitLab OAuth success: {...}

// Firestore operations
✅ OAuth connection stored: {connectionId}
✅ {N} repositories stored to Firestore
✅ {N} datasets created with license: {licenseType}

// Activity logging
✅ Activity saved to Firestore: Connected github account
✅ Activity saved to Firestore: Created N datasets from github
```

### Network Tab Tests
1. Check `/api/auth/github/start` request - redirects to GitHub
2. Check `/api/auth/github/callback` request - exchanges code for token
3. Check Firestore writes (Firebase SDK calls)
4. Check `/api/pilot/sync` POST requests if sync is triggered

### Application Tab (Storage)
1. Check `sessionStorage` for `oauth_access_token`
2. Check `sessionStorage` for `selectedLicense`
3. Verify values are cleared after successful sync

---

## Performance Testing

### Metric: Repository List Load Time
```
Expected: < 2 seconds from OAuth callback to modal display
```

### Metric: Firestore Write Time
```
Expected: < 5 seconds for 10 repositories
Expected: < 10 seconds for 50 repositories
```

### Metric: Modal Render Time
```
Expected: < 500ms with 100 repositories
Expected: < 1s with 500 repositories
```

### Testing Steps:
1. Open DevTools → Performance tab
2. Record while completing OAuth flow
3. Check timeline for bottlenecks
4. Verify no memory leaks during multiple syncs

---

## Regression Testing

### After Each Update, Test:
1. ✅ OAuth flow still works (GitHub)
2. ✅ OAuth flow still works (GitLab)
3. ✅ Repository list displays correctly
4. ✅ Multi-select works
5. ✅ Firestore writes succeed
6. ✅ Activity logging works
7. ✅ Error messages display properly
8. ✅ Dark mode works
9. ✅ Mobile responsive
10. ✅ No console errors

---

## Known Limitations (To Address in Future)

1. **Token Storage:** Tokens stored in sessionStorage (should use secure storage)
2. **Token Refresh:** No automatic token refresh implemented
3. **Rate Limiting:** No rate limiting on sync operations
4. **Pagination:** Only fetches first 100 repositories
5. **Webhook Sync:** No webhook support for auto-sync on push events
6. **Dataset Download:** Actual repository cloning not implemented

---

## Troubleshooting

### Issue: "OAuth configuration missing for github"
**Cause:** Missing environment variables
**Fix:** Set `NEXT_PUBLIC_GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### Issue: "Redirect URI mismatch"
**Cause:** OAuth app redirect URI doesn't match code
**Fix:** Update OAuth app settings to match callback URL
```
Expected: https://yourdomain.com/api/auth/github/callback
```

### Issue: Empty repository list in modal
**Cause:** User has no public repositories or token lacks permissions
**Fix:** 
- User should have at least one public repo in GitHub/GitLab
- Check OAuth scopes: `repo user` for GitHub, `api read_user` for GitLab

### Issue: Firestore writes failing
**Cause:** Security rules denying writes
**Fix:** Update Firestore security rules to allow writes to user's subcollections

### Issue: postMessage not received
**Cause:** Cross-origin or timing issue
**Fix:** Verify callback redirects to same origin, check message event listener

---

## Success Criteria Checklist

- [ ] GitHub OAuth flow works end-to-end
- [ ] GitLab OAuth flow works end-to-end
- [ ] RepositoryList modal displays all repos
- [ ] Multi-repository selection works
- [ ] Firestore documents created correctly
- [ ] Activity logging works
- [ ] Error messages display clearly
- [ ] Dark mode fully supported
- [ ] Mobile responsive (tested on 375px width)
- [ ] Console clean (no warnings/errors)
- [ ] API endpoints return correct responses
- [ ] Performance meets targets (<2s modal load)

---

**Ready to test!** 🧪
