# 🚀 Datta Studio - Beta Testing Guide

Welcome to the Datta Studio beta program! This document will help you get started and understand what to test.

---

## 📖 Table of Contents

1. [What is Datta Studio?](#what-is-datta-studio)
2. [Getting Started](#getting-started)
3. [Features to Test](#features-to-test)
4. [Testing Scenarios](#testing-scenarios)
5. [Reporting Bugs](#reporting-bugs)
6. [Known Limitations](#known-limitations)
7. [FAQ](#faq)
8. [Support & Contact](#support--contact)

---

## What is Datta Studio?

**Datta Studio** is a platform for managing, sharing, and monetizing datasets and code repositories. It provides:

- 📤 **Secure file uploads** with validation
- 🔗 **OAuth integrations** (GitHub, GitLab, Twitter)
- 🤖 **AI Labs connection** for data analysis
- 💾 **Data wallet** for file management
- 📊 **Dataset publishing & sharing**
- 🔑 **API key management** for AI Labs access

---

## Getting Started

### Step 1: Access the Platform
- Navigate to your Datta Studio instance
- Bookmark it for easy access during testing

### Step 2: Create an Account
You have two options:

**Option A: Email & Password**
1. Click "Sign Up" on the login screen
2. Enter your email and create a password
3. Verify your email (if verification is enabled)
4. You're ready to go!

**Option B: OAuth (Google, GitHub)**
1. Click "Sign in with Google" or "Sign in with GitHub"
2. Follow the OAuth provider's instructions
3. Approve the requested permissions
4. You're automatically logged in!

### Step 3: Explore the Dashboard
- Review the main dashboard
- Familiarize yourself with the navigation menu
- Check out your profile settings

---

## Features to Test

### 1. 🔐 Authentication

**What to test:**
- [ ] Email/password signup
- [ ] Email/password login
- [ ] Password reset (if available)
- [ ] Google OAuth login
- [ ] GitHub OAuth login
- [ ] Session persistence (refresh page - should stay logged in)
- [ ] Logout functionality
- [ ] Profile settings update

**Success criteria:**
- Login/signup completes without errors
- Session persists across page refreshes
- User can logout successfully
- OAuth redirects work smoothly

---

### 2. 📤 File Upload (Quick Upload Section)

**What to test:**
- [ ] Upload a single code file (.js, .py, .ts, etc.)
- [ ] Upload multiple files at once (5-10 files)
- [ ] Upload large files (50MB+)
- [ ] Attempt to upload Excel file (.xlsx) - should be **REJECTED**
- [ ] Attempt to upload PDF - should be **REJECTED**
- [ ] Attempt to upload image - should be **REJECTED**
- [ ] Upload progress feedback
- [ ] Cancel upload mid-way
- [ ] View uploaded files in Data Wallet

**Success criteria:**
- Valid code files upload successfully
- Invalid file types show error message
- Progress feedback is visible
- Files appear in Data Wallet after upload
- Error messages are clear and helpful

**Files to test with:**
```
✅ Valid:  script.js, data.json, README.md, main.py, config.yaml
❌ Invalid: spreadsheet.xlsx, document.pdf, image.png, video.mp4
```

---

### 3. 🔗 OAuth Connections (Add Data Source)

**What to test:**
- [ ] GitHub connection flow
- [ ] GitLab connection flow
- [ ] Approve OAuth permissions
- [ ] View connected repositories
- [ ] Disconnect from OAuth provider
- [ ] Reconnect after disconnecting

**Success criteria:**
- OAuth window opens and closes properly
- Permissions are clearly explained
- Repositories appear after connection
- Disconnect/reconnect works smoothly

---

### 4. 🤖 AI Labs Integration

**What to test:**
- [ ] Click "Enable AI Lab Connection" button
- [ ] Verify connection is established
- [ ] View generated API key
- [ ] Copy API key (if copy button available)
- [ ] Disconnect AI Lab connection
- [ ] Reconnect to AI Labs

**Success criteria:**
- Connection enables without errors
- API key is generated and displayed
- Success message appears
- Connection status updates in real-time

---

### 5. 📊 Dataset Publishing

**What to test:**
- [ ] Create new dataset from uploaded files
- [ ] Set dataset visibility (private/public/request-only)
- [ ] Add dataset description and tags
- [ ] Publish dataset
- [ ] View published dataset
- [ ] View dataset details
- [ ] Delete dataset (if available)

**Success criteria:**
- Dataset publishes without errors
- Visibility settings are respected
- Dataset appears in your library
- All metadata is saved correctly

---

### 6. 💾 Data Wallet

**What to test:**
- [ ] View all uploaded files
- [ ] Switch between grid and list view
- [ ] Search for files
- [ ] Filter by file type
- [ ] Download files
- [ ] Delete files
- [ ] View file details (size, date uploaded)

**Success criteria:**
- Files display correctly
- Search/filter works
- Download functionality works
- Deleted files disappear from wallet

---

### 7. 🎨 UI/UX Features

**What to test:**
- [ ] Dark mode toggle
- [ ] Light mode toggle
- [ ] Theme persists on page reload
- [ ] Responsive design (test on mobile/tablet)
- [ ] Navigation menu works
- [ ] All buttons are clickable
- [ ] Tooltips/help text appears correctly

**Success criteria:**
- Dark mode displays correctly
- Light mode is readable
- Layout looks good on different screen sizes
- Navigation is intuitive

---

## Testing Scenarios

### Scenario 1: Complete User Journey
1. Sign up with new account
2. Upload 3 code files (JavaScript, Python, JSON)
3. Create a dataset from these files
4. Set visibility to "public"
5. Enable AI Lab connection
6. View the API key
7. Logout and login again to verify persistence

### Scenario 2: File Upload Validation
1. Try uploading an Excel file → Should show error
2. Try uploading a PDF → Should show error
3. Try uploading an image → Should show error
4. Upload a valid .js file → Should succeed
5. Verify error messages are clear

### Scenario 3: Multiple Files (Performance)
1. Select 10+ code files
2. Click "Upload Files"
3. Monitor upload progress
4. Wait for completion
5. Verify all files appear in Data Wallet
6. Check total size calculation

### Scenario 4: OAuth Integration
1. Click "Connect GitHub"
2. Approve permissions
3. View connected repositories
4. Disconnect
5. Reconnect to verify it works again

### Scenario 5: Network Interruption
1. Start uploading a large file
2. Simulate network interruption (throttle in DevTools)
3. Try to cancel upload
4. Observe error handling
5. Try uploading again

---

## Reporting Bugs

### 🐛 Found a Bug?

**Please report it with the following information:**

1. **Bug Title**: Clear, short description
2. **Severity**: 
   - 🔴 Critical (app crashes, can't use feature)
   - 🟠 High (feature broken, wrong behavior)
   - 🟡 Medium (minor issue, workaround exists)
   - 🟢 Low (cosmetic, nice-to-have)

3. **Steps to Reproduce**:
   ```
   1. First step
   2. Second step
   3. What went wrong
   ```

4. **Expected Behavior**: What should happen

5. **Actual Behavior**: What actually happened

6. **Environment**:
   - Browser: Chrome/Firefox/Safari/Edge
   - OS: Windows/Mac/Linux
   - Screen size: Desktop/Mobile/Tablet
   - Network: Fast/Slow/Offline

7. **Screenshots**: If applicable, include screenshots

8. **Console Errors**: 
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Copy any red error messages

### 📧 How to Report

**Option 1: Email**
- Send to: `beta@dattastudio.com` (or your provided email)
- Subject: `[BUG] Brief description`
- Include all information from above

**Option 2: Bug Tracker**
- If provided, use the shared bug tracker
- Label as "beta-bug"

**Option 3: Feedback Form**
- If available on the platform, use the feedback button

---

## Known Limitations

These are known issues we're working on. No need to report these:

### ⚠️ Current Limitations

1. **Rate Limiting**
   - Currently no rate limiting on file uploads
   - This will be added before production

2. **Email Verification**
   - Email verification may not work in beta
   - This will be enabled in full release

3. **Data Export**
   - Cannot export all user data yet
   - Planned for production

4. **Advanced Search**
   - Basic search only
   - Advanced filters coming soon

5. **Notifications**
   - Email notifications not yet implemented
   - In-app notifications may be limited

6. **Offline Mode**
   - Requires internet connection
   - Offline support planned for future

---

## FAQ

### Q: What browsers are supported?
**A:** Chrome, Firefox, Safari, and Edge (latest versions). Please test on your preferred browser.

### Q: Can I upload files larger than 100MB?
**A:** Currently, there may be size limitations. Please test and report any issues.

### Q: Is my data safe during beta?
**A:** Yes, we use industry-standard encryption and Firebase security. However, this is beta software, so please don't upload truly sensitive data.

### Q: What happens to my data after beta?
**A:** Your data will be preserved. Once we move to production, your account and files will be migrated.

### Q: Can I invite other users?
**A:** Beta is currently closed. Only users with beta invites can access.

### Q: How do I reset my password?
**A:** Click "Forgot Password" on the login screen. If email verification isn't working, contact support.

### Q: What file types are allowed?
**A:** Code files (.js, .ts, .py, .java, .go, etc.), archives (.zip, .tar), data files (.json, .yaml, .sql), and text files (.md, .txt). No Excel, Word, PDF, or media files.

### Q: Can I delete my account?
**A:** Contact support to delete your account. Your data will be permanently removed.

### Q: How often should I test?
**A:** As much as possible! Even 30 minutes testing different features helps.

### Q: What should I do if I find a UI bug?
**A:** Please report it! Screenshots are helpful. Even small UI issues help us improve.

---

## Performance Benchmarks

Please note these baseline performance targets during testing:

| Operation | Target Time | Acceptable Range |
|-----------|------------|------------------|
| Login | < 2 sec | < 5 sec |
| File Upload (10MB) | < 5 sec | < 15 sec |
| File Upload (100MB) | < 30 sec | < 60 sec |
| Dataset Creation | < 2 sec | < 5 sec |
| OAuth Connection | < 3 sec | < 8 sec |
| AI Labs Connection | < 2 sec | < 5 sec |
| Data Wallet Load | < 2 sec | < 5 sec |

---

## 📱 Mobile Testing

Please test on mobile devices:

- [ ] iPhone (iOS)
- [ ] Android phone
- [ ] Tablet
- [ ] Portrait and landscape orientation

**Key mobile features to test:**
- Navigation works on small screens
- Buttons are easy to tap (not too small)
- Upload works on mobile
- File selection works smoothly
- No horizontal scrolling needed

---

## Browser DevTools Tips

### Enable Slow Network for Testing
1. Open DevTools (F12)
2. Go to Network tab
3. Click the speed dropdown (currently "No throttling")
4. Select "Slow 3G" or "Fast 3G"
5. This simulates slow internet

### View Console Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Right-click and copy error details
5. Include in bug report

---

## Support & Contact

### 📞 Need Help?

**Email**: `beta-support@dattastudio.com`
**Response Time**: Within 24 hours during beta

**Include in your email:**
- Your beta test account email
- What you were trying to do
- What went wrong
- Screenshots if possible

### 💬 Community Discussion

If available, join our beta community channel to:
- Share feedback
- Discuss findings with other testers
- Ask questions
- Share tips

---

## 🙏 Thank You!

Thank you for testing Datta Studio! Your feedback is invaluable in helping us build a better product. 

**Remember:**
- Be thorough but have fun testing
- Report bugs, no matter how small
- Suggest features and improvements
- Help us make Datta Studio amazing

---

## Feedback Template

**Copy and use this template for structured feedback:**

```
Feature: [Which feature?]
Test Date: [Today's date]
Severity: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

What I tested:
[Your description]

What happened:
[Your findings]

What should happen:
[Expected behavior]

Screenshots:
[Include if relevant]

Browser/Device:
[Your setup]
```

---

**Beta Testing Ends**: [End Date]
**Feedback Deadline**: [Deadline]

---

*Last Updated: December 29, 2025*
*Datta Studio Beta Team*
