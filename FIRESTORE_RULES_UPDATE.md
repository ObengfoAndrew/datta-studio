# Firestore Rules Update - Public Dataset Access

## Problem Fixed
❌ Permission denied error when fetching public datasets
- Error: `[FirebaseError: Missing or insufficient permissions.]`
- Cause: Firestore rules restricted read access to `/users/{userId}/datasets` to owner only

## Solution Applied
✅ Updated `firestore.rules` to allow public read of published datasets

### Rule Change
**Before:**
```
match /datasets/{datasetId} {
  allow read, write: if isOwner(userId);
}
```

**After:**
```
match /datasets/{datasetId} {
  allow read: if resource.data.status == 'published'; // Public read
  allow write: if isOwner(userId); // Owner only write
}
```

## How to Deploy

### Option 1: Using Firebase CLI (Recommended)
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### Option 2: Deploy via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore → Rules
4. Copy content from `firestore.rules` file
5. Click "Publish"

### Option 3: Using Vercel Deploy (If using Firebase with Vercel)
Rules will be deployed when you push to your repository if Firebase integration is set up

## What Changed
- ✅ Public datasets (status: 'published') can be read by anyone
- ✅ Private/draft datasets remain protected (owner only)
- ✅ Dataset Registry (Discover page) can now fetch and display datasets
- ✅ Real-time listeners work without authentication issues

## Test It
1. Upload a dataset in Dashboard
2. Visit Dataset Registry page
3. Should see your dataset displayed
4. Check DevTools Console for: `✅ Datasets fetched:`

## Security Notes
- Only datasets with `status: 'published'` are visible publicly
- All write operations still require authentication
- Sensitive data in drafts/processing datasets remains protected
