# Firebase Storage Rules Deployment Guide

## Problem
The file upload feature ("Upload Code Files") was not working because **Firebase Storage didn't have security rules configured**. By default, Firebase Storage denies all write access unless explicitly allowed.

## Solution
Created `storage.rules` file with proper security rules that allow authenticated users to upload files to their own user directory.

## What the Rules Do

### 1. **User-Owned Upload Directory** (`/users/{userId}/**`)
- ✅ **Authenticated users can upload** files to their own directory
- ✅ **Max file size: 500MB** to prevent abuse
- ✅ **Owner can read/write/delete** their own files
- ✅ **Denies all other access** to other users' files

### 2. **Default Deny All** (all other paths)
- Blocks any access to undefined paths for security

## How to Deploy

### Option 1: Using Firebase Console (Easiest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** → **Rules**
4. Copy the content of `storage.rules` file
5. Paste it into the Firebase Console rules editor
6. Click **Publish**

### Option 2: Using Firebase CLI
```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy the storage rules
firebase deploy --only storage
```

### Option 3: Using `firebaserc` Configuration
Ensure your `.firebaserc` file has the correct project:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Then run:
```bash
firebase deploy --only storage
```

## Testing the Fix
1. Go to the Dashboard
2. Click "Add Data Source"
3. Click "Upload Code Files"
4. Select a valid code file (.zip, .py, .js, .ts, etc.)
5. Select a license
6. The file should upload successfully ✅

## Security Details

| Rule | Purpose |
|------|---------|
| `isAuthenticated()` | Ensures user is signed in |
| `isOwner(userId)` | Ensures user can only access their own files |
| `request.resource.size < 500 * 1024 * 1024` | Prevents uploading files larger than 500MB |
| Default deny | Blocks any unexpected or unauthorized access |

## Troubleshooting

### "Permission denied" Error
- ✅ Make sure you're **signed in** to the application
- ✅ Check that **Firebase Authentication is configured** correctly
- ✅ Verify storage rules are **published** in Firebase Console

### File Upload Still Not Working
1. Check **browser console** for specific error messages (F12 → Console tab)
2. Check **Firebase Console → Storage → Files** to see if file appears
3. Verify your **Firebase project ID** is correct in `.env.local`

## What Changed
- Created new file: `storage.rules`
- This is the configuration that Firebase needs to allow uploads
- Need to be deployed to Firebase Console (not automatically deployed)

## Next Steps
1. **Deploy these rules** to your Firebase project
2. **Test file upload** in the application
3. **Verify** in Firebase Storage console that files are being uploaded

---

**File Size Limits by License:**
- Free: 100MB max per file
- Professional: 300MB max per file  
- Enterprise: 500MB max per file

These are enforced in `licenseService.ts` - the storage.rules provides an additional safety limit.
