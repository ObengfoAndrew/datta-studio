# Add Source Feature - Complete Test Plan

## Test Environment Setup

### Prerequisites
- Node.js 18+ installed
- Git configured with GitHub credentials
- GitHub OAuth App created (if testing real OAuth)
- Firebase project configured
- Firestore database initialized

### Environment Variables
```env
# Required for testing
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_test_client_id
GITHUB_CLIENT_SECRET=your_test_client_secret

# Optional for mock testing
NEXT_PUBLIC_MOCK_OAUTH=true
```

---

## Test Suite 1: Component Rendering

### Test 1.1: Dashboard "Add Source" Button
**Steps:**
1. Navigate to dashboard home page
2. Look for "Data Sources" section
3. Verify "+ Add Source" button is visible

**Expected Result:**
- ✓ Button visible with blue background
- ✓ Button has Plus icon and "Add Source" text
- ✓ Button is clickable

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 1.2: AddDataSourceModal Opens
**Steps:**
1. Click "+ Add Source" button
2. Wait for modal animation to complete

**Expected Result:**
- ✓ Modal appears with dark overlay
- ✓ Modal title: "Add Data Source"
- ✓ Modal description visible
- ✓ Close (X) button visible in top right
- ✓ Three source tiles visible below

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 1.3: Source Tiles Display
**Steps:**
1. Verify all three source tiles are visible

**Expected Result:**
- ✓ GitHub tile: 🔗 icon, "GitHub" title, description
- ✓ GitLab tile: 🦊 icon, "GitLab" title, description
- ✓ Upload tile: 📁 icon, "Upload Code Files" title
- ✓ All tiles have clickable surface
- ✓ License info section below tiles

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 1.4: Dark Mode Support
**Steps:**
1. Toggle dark mode in dashboard
2. Open Add Source modal
3. Verify colors

**Expected Result:**
- ✓ Modal background: dark (#1e293b)
- ✓ Text: light (#f1f5f9)
- ✓ Borders: dark gray (#334155)
- ✓ All text readable
- ✓ Buttons visible with proper contrast

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 2: License Selection

### Test 2.1: Personal License Selection
**Steps:**
1. Click on GitHub source tile
2. Wait for license modal
3. Select "Personal" license

**Expected Result:**
- ✓ License modal appears
- ✓ Three license options visible
- ✓ Personal option can be selected
- ✓ Selection state shows with checkmark/highlight

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 2.2: Professional License Selection
**Steps:**
1. Click on GitHub source tile
2. Select "Professional" license
3. Click "Continue"

**Expected Result:**
- ✓ Professional selected
- ✓ License details visible
- ✓ Continue button enabled
- ✓ Proceed to next step

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 2.3: Enterprise License Selection
**Steps:**
1. Click on GitHub source tile
2. Select "Enterprise" license
3. Verify details

**Expected Result:**
- ✓ Enterprise option selectable
- ✓ Details visible
- ✓ Can proceed with selection

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 3: OAuth Connection

### Test 3.1: GitHub OAuth Button Display
**Steps:**
1. Select GitHub and Professional license
2. Wait for RepositoryConnector

**Expected Result:**
- ✓ "Connect GitHub" button visible
- ✓ Button has 🔗 icon and text
- ✓ Button is active/clickable
- ✓ Description: "Authorize Datta Studio..."

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 3.2: OAuth Redirect (Real OAuth)
**Steps:**
1. Click "Connect with GitHub" button
2. New window/tab should open

**Expected Result:**
- ✓ Redirected to github.com OAuth page
- ✓ GitHub login shown (if not logged in)
- ✓ Permission request visible
- ✓ Can grant or deny permissions

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 3.3: OAuth Approval Flow
**Steps:**
1. Sign into GitHub (if needed)
2. Click "Authorize datta-studio"
3. Wait for callback

**Expected Result:**
- ✓ Redirected to /api/auth/github/callback
- ✓ OAuth window closes automatically
- ✓ Parent window receives postMessage
- ✓ RepositoryConnector updates to show repos

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 3.4: OAuth Error Handling
**Steps:**
1. Click "Connect with GitHub"
2. Click "Cancel" or deny permissions
3. Monitor error handling

**Expected Result:**
- ✓ OAuth window closes
- ✓ Error message displayed: "Authentication failed: access_denied"
- ✓ "Back" button appears
- ✓ Can retry connection

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 3.5: Mock OAuth (Development)
**Steps:**
1. Set NEXT_PUBLIC_MOCK_OAUTH=true
2. Click "Connect with GitHub"
3. Observe mock data flow

**Expected Result:**
- ✓ Mock user data displays
- ✓ Mock repositories appear
- ✓ Flow works without real OAuth
- ✓ Useful for UI testing

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 4: Repository Display

### Test 4.1: Repository List Display
**Steps:**
1. Complete OAuth successfully
2. Wait for repository list

**Expected Result:**
- ✓ "5 Repositories Found" title visible
- ✓ User name displayed: (e.g., "demo-user")
- ✓ License shown: "professional"
- ✓ Back button visible
- ✓ Repository list scrollable

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 4.2: Repository Information Display
**Steps:**
1. View repository list
2. Check each repository item

**Expected Result:**
- ✓ Repository name visible
- ✓ Description displayed
- ✓ Language/Technology shown
- ✓ Stars count visible
- ✓ Updated date visible
- ✓ Repository size shown

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 4.3: Repository Checkbox Selection
**Steps:**
1. View repository list
2. Click checkbox for first repo
3. Verify selection

**Expected Result:**
- ✓ Checkbox becomes checked
- ✓ Visual highlight on row
- ✓ "X selected" badge appears
- ✓ Multiple repos can be selected

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 4.4: Multi-Select Repositories
**Steps:**
1. Select multiple repositories (3+)
2. Watch selection counter
3. Scroll in list while maintaining selections

**Expected Result:**
- ✓ Multiple checkboxes can be checked
- ✓ Counter updates: "1 selected", "2 selected", etc.
- ✓ Selections persist while scrolling
- ✓ Badge reflects current count
- ✓ Import button button updates: "Import 3 Repository(ies)"

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 4.5: Deselect Repositories
**Steps:**
1. Select a repository
2. Click checkbox again to deselect
3. Verify counter updates

**Expected Result:**
- ✓ Checkbox becomes unchecked
- ✓ Row no longer highlighted
- ✓ Counter decreases: "2 selected" → "1 selected"
- ✓ Badge disappears if all deselected
- ✓ Import button disabled when 0 selected

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 5: Repository Import

### Test 5.1: Import Button State
**Steps:**
1. View repository list with no selections
2. Check import button state
3. Select 1 repository
4. Check button state again

**Expected Result:**
- ✓ Disabled when no repos selected (gray)
- ✓ Enabled when repos selected (green)
- ✓ Hover effect on enabled button
- ✓ Text changes: "Import 1 Repository(y)"

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 5.2: Import Single Repository
**Steps:**
1. Select 1 repository
2. Click "Import 1 Repository(y)"
3. Monitor progress

**Expected Result:**
- ✓ Button text: "Importing..."
- ✓ Button disabled
- ✓ Process completes in 2-5 seconds
- ✓ Modal closes automatically
- ✓ Returns to dashboard

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 5.3: Import Multiple Repositories
**Steps:**
1. Select 3 repositories
2. Click "Import 3 Repository(ies)"
3. Monitor progress

**Expected Result:**
- ✓ Button disabled during import
- ✓ Process shows "Importing..."
- ✓ All repos imported to Firestore
- ✓ Modal closes
- ✓ Activity logged for each import

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 5.4: Verify Datasets Created
**Steps:**
1. After import completes
2. Open Data Wallet
3. Check imported datasets

**Expected Result:**
- ✓ New datasets appear in Data Wallet
- ✓ Dataset names match repository names
- ✓ License type matches selection
- ✓ Source type: "GitHub" or "GitLab"
- ✓ Timestamps are current

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 5.5: Verify Firestore Database
**Steps:**
1. After import, check Firestore
2. Navigate to: users/{userId}/datasets
3. Verify repository data

**Expected Result:**
- ✓ Dataset documents created
- ✓ Contains fields:
  - `title`: repo name
  - `sourceProvider`: "github" or "gitlab"
  - `sourceType`: "code"
  - `licenseType`: selected license
  - `metadata.repositoryUrl`: GitHub URL
- ✓ Correct number of documents

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 6: Error Handling

### Test 6.1: Network Connection Error
**Steps:**
1. Disconnect internet/VPN
2. Try to click "Connect with GitHub"
3. Observe error handling

**Expected Result:**
- ✓ Error message shown to user
- ✓ Message: "Network timeout" or similar
- ✓ "Back" button available
- ✓ Can retry when connection restored

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 6.2: No Repositories Error
**Steps:**
1. OAuth with account that has no repos
2. Wait for repository list

**Expected Result:**
- ✓ Message: "No repositories found"
- ✓ Helpful text: "Make sure you have at least one..."
- ✓ "Back" button available
- ✓ Can return and retry

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 6.3: Import Error Handling
**Steps:**
1. Select repositories
2. Attempt import
3. If Firestore has issues, verify error

**Expected Result:**
- ✓ Error message displayed
- ✓ Clear description of issue
- ✓ "Back" button available
- ✓ No partial data in Firestore

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 6.4: Permission Scope Error
**Steps:**
1. OAuth with insufficient permissions
2. Try to fetch repositories

**Expected Result:**
- ✓ Error message: "Permission denied" or similar
- ✓ Explanation visible
- ✓ Can reconnect with proper permissions
- ✓ Back button works

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 7: GitLab Functionality

### Test 7.1: GitLab Selection
**Steps:**
1. Click "Add Source"
2. Select GitLab tile
3. Complete license selection

**Expected Result:**
- ✓ GitLab option selectable
- ✓ Shows "Connect with GitLab"
- ✓ Redirects to gitlab.com

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 7.2: GitLab OAuth Flow
**Steps:**
1. Click "Connect with GitLab"
2. Authorize on gitlab.com
3. Wait for callback

**Expected Result:**
- ✓ Redirects to gitlab.com
- ✓ Can authorize access
- ✓ Returns to app
- ✓ Shows GitLab projects

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 7.3: GitLab Projects Display
**Steps:**
1. Complete GitLab auth
2. View projects list

**Expected Result:**
- ✓ Shows "XXX Repositories Found"
- ✓ Projects from GitLab visible
- ✓ Same selection/import flow works
- ✓ Saves correctly to Firestore

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 8: Upload Code Files

### Test 8.1: Upload Option
**Steps:**
1. Click "Add Source"
2. Select "Upload Code Files"
3. Complete license selection

**Expected Result:**
- ✓ File picker opens
- ✓ Can select .zip, .tar, .gz files
- ✓ Shows file size

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 8.2: File Type Validation
**Steps:**
1. Try to upload invalid file types:
   - .docx (Word doc)
   - .xlsx (Excel)
   - .pdf
   - .jpg
2. Verify rejection

**Expected Result:**
- ✓ Invalid files rejected
- ✓ Clear error message
- ✓ Specific format guidance
- ✓ Lists allowed types

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 9: Performance & Load Testing

### Test 9.1: Large Repository List
**Steps:**
1. Initialize OAuth with account having 100+ repos
2. Load repository list
3. Test scrolling performance

**Expected Result:**
- ✓ All repos load (paginated if applicable)
- ✓ Smooth scrolling
- ✓ Selection works on all items
- ✓ No UI freezing

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 9.2: Large Import
**Steps:**
1. Select 10+ repositories
2. Click import
3. Monitor completion

**Expected Result:**
- ✓ All repos imported successfully
- ✓ Firestore updates properly
- ✓ No timeout errors
- ✓ Performance acceptable (< 30 seconds)

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 10: Browser Compatibility

### Test 10.1: Chrome/Edge
**Steps:**
1. Complete full Add Source flow
2. Test all features

**Expected Result:**
- ✓ All features working
- ✓ Styling correct
- ✓ OAuth redirects work
- ✓ No console errors

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 10.2: Firefox
**Steps:**
1. Complete full Add Source flow
2. Verify postMessage handling

**Expected Result:**
- ✓ OAuth flow works
- ✓ postMessage received correctly
- ✓ Repos display properly

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 10.3: Safari
**Steps:**
1. Complete full Add Source flow
2. Test on Mac

**Expected Result:**
- ✓ All features working
- ✓ Styling renders correctly
- ✓ OAuth works properly

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Suite 11: Mobile Responsiveness

### Test 11.1: Mobile View (< 600px)
**Steps:**
1. Open on mobile device or simulate
2. Open Add Source modal
3. Complete OAuth flow
4. View repositories

**Expected Result:**
- ✓ Modal full width with padding
- ✓ Buttons stack vertically
- ✓ Repository list readable
- ✓ Text sizes appropriate
- ✓ Selections work with touch

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

### Test 11.2: Tablet View (600-1024px)
**Steps:**
1. View on tablet/iPad
2. Test all interactions
3. Check layout

**Expected Result:**
- ✓ Modal scales appropriately
- ✓ Buttons side-by-side or stacked
- ✓ Repository list has good spacing
- ✓ Scrolling smooth

**Actual Result:**
- [ ] Pass / [ ] Fail / [ ] Not Tested

---

## Test Summary

### Passing Tests: ___ / 60+
### Failing Tests: ___ / 60+
### Not Tested: ___ / 60+

### Critical Issues Found:
[ ] None
[ ] Major
[ ] Minor

**Details:**
```
[List any issues found here]
```

### Recommendations:
```
[Any improvements or fixes needed]
```

---

## Sign-Off

**Tested By:** _________________
**Date:** _________________
**Status:** [ ] Ready for Production [ ] Needs Fixes [ ] In Review

**Notes:**
```
[Additional notes about testing]
```
