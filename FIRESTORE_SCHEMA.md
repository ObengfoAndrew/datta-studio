# Firestore Schema Design

## Database Structure

### Collections

```
firestore
├── users/{userId}
│   ├── profile (document)
│   │   ├── displayName: string
│   │   ├── email: string
│   │   ├── avatar: string
│   │   └── createdAt: timestamp
│   │
│   └── connections/{connectionId} (collection)
│       ├── provider: 'github' | 'gitlab'
│       ├── username: string
│       ├── accessToken: string (encrypted in production)
│       ├── tokenType: string
│       ├── scope: string
│       ├── connectedAt: timestamp
│       ├── lastSyncedAt: timestamp (nullable)
│       └── metadata: {
│           userId: number
│           profileUrl: string
│           avatar: string
│           publicRepos: number
│       }
│
└── datasets/{datasetId}
    ├── title: string
    ├── description: string
    ├── type: 'github-repo' | 'gitlab-project' | 'uploaded'
    ├── sourceConnection: {
    │   connectionId: string
    │   provider: 'github' | 'gitlab'
    │   userId: number
    │   username: string
    │}
    ├── sourceRepo: {
    │   id: number
    │   name: string
    │   fullName: string
    │   url: string
    │   description: string
    │}
    ├── licenseType: 'personal' | 'professional' | 'enterprise'
    ├── status: 'syncing' | 'synced' | 'failed'
    ├── stats: {
    │   files: number
    │   size: number
    │   lastCommit: timestamp
    │}
    ├── createdAt: timestamp
    ├── updatedAt: timestamp
    ├── syncedAt: timestamp (nullable)
    └── metadata: {
        branches: string[]
        languages: string[]
        stars: number
    }
```

---

## Collection Details

### users/{userId}

Main user document containing profile and all connections.

**Example:**
```json
{
  "profile": {
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatar": "https://avatars.githubusercontent.com/u/12345?v=4",
    "createdAt": "2024-12-28T10:00:00Z"
  },
  "connections": {
    "github_12345_1703761200000": {
      "provider": "github",
      "username": "johndoe",
      "accessToken": "ghu_16Cs...",
      "tokenType": "bearer",
      "scope": "repo user",
      "connectedAt": "2024-12-28T10:00:00Z",
      "lastSyncedAt": null,
      "metadata": {
        "userId": 12345,
        "profileUrl": "https://github.com/johndoe",
        "avatar": "https://avatars.githubusercontent.com/u/12345?v=4",
        "publicRepos": 15
      }
    }
  }
}
```

### datasets/{datasetId}

Dataset document linking to source repo and connection.

**Example:**
```json
{
  "title": "my-awesome-repo",
  "description": "An awesome repository for data science",
  "type": "github-repo",
  "sourceConnection": {
    "connectionId": "github_12345_1703761200000",
    "provider": "github",
    "userId": 12345,
    "username": "johndoe"
  },
  "sourceRepo": {
    "id": 123456,
    "name": "my-awesome-repo",
    "fullName": "johndoe/my-awesome-repo",
    "url": "https://github.com/johndoe/my-awesome-repo",
    "description": "An awesome repository for data science"
  },
  "licenseType": "professional",
  "status": "synced",
  "stats": {
    "files": 256,
    "size": 5242880,
    "lastCommit": "2024-12-27T15:30:00Z"
  },
  "createdAt": "2024-12-28T10:00:00Z",
  "updatedAt": "2024-12-28T10:05:00Z",
  "syncedAt": "2024-12-28T10:05:00Z",
  "metadata": {
    "branches": ["main", "develop"],
    "languages": ["Python", "JavaScript"],
    "stars": 42
  }
}
```

---

## Firestore Rules

```rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own user data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Connections subcollection
      match /connections/{connectionId} {
        allow read, write: if request.auth.uid == userId;
      }
    }
    
    // Datasets
    match /datasets/{datasetId} {
      allow read: if true; // Public read
      allow create, write: if request.auth.uid != null; // Auth required to create/edit
      allow delete: if request.auth.uid == resource.data.creatorId;
    }
  }
}
```

---

## TypeScript Interfaces

```typescript
// Connection
interface OAuthConnection {
  connectionId: string;
  provider: 'github' | 'gitlab';
  username: string;
  accessToken: string;
  tokenType: string;
  scope: string;
  connectedAt: Timestamp;
  lastSyncedAt?: Timestamp;
  metadata: {
    userId: number;
    profileUrl: string;
    avatar: string;
    publicRepos: number;
  };
}

// Repository
interface SourceRepository {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description?: string;
  size?: number;
  stargazers_count?: number;
  language?: string;
}

// Dataset
interface SyncedDataset {
  id: string;
  title: string;
  description?: string;
  type: 'github-repo' | 'gitlab-project' | 'uploaded';
  sourceConnection: {
    connectionId: string;
    provider: 'github' | 'gitlab';
    userId: number;
    username: string;
  };
  sourceRepo: SourceRepository;
  licenseType: 'personal' | 'professional' | 'enterprise';
  status: 'syncing' | 'synced' | 'failed';
  stats: {
    files: number;
    size: number;
    lastCommit: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  syncedAt?: Timestamp;
  metadata: {
    branches: string[];
    languages: string[];
    stars: number;
  };
}
```

---

## Migration Notes

When storing connections:

1. **First Time Connection**
   - Create user profile if doesn't exist
   - Add connection to user's connections subcollection

2. **Subsequent Connections**
   - Just add new connection document
   - Allow multiple providers per user

3. **Token Storage**
   - In development: Store plaintext (OK for testing)
   - In production: Encrypt tokens using Cloud Functions or server-side encryption

4. **Sync Data**
   - Store repo metadata when syncing
   - Update lastSyncedAt timestamp
   - Store sync status for UI display

---

## Index Requirements

For efficient queries, create these Firestore indexes:

```
- Collection: users
  Fields: 
    - provider (Ascending)
    - connectedAt (Descending)

- Collection: datasets
  Fields:
    - provider (Ascending)
    - status (Ascending)
    - syncedAt (Descending)

- Collection: datasets
  Fields:
    - sourceConnection.connectionId (Ascending)
    - createdAt (Descending)
```

---

## API Contract

### Store Connection Endpoint (POST)
```
POST /api/auth/{provider}/store

Request Body:
{
  "provider": "github" | "gitlab",
  "accessToken": string,
  "userData": { ... },
  "reposData": [ ... ]
}

Response:
{
  "success": true,
  "connectionId": "github_12345_1703761200000",
  "userId": "firebase_uid",
  "reposStored": 15
}
```

### Sync Dataset Endpoint (POST)
```
POST /api/pilot/sync

Request Body:
{
  "connectionId": "github_12345_1703761200000",
  "repoId": 123456,
  "licenseType": "professional"
}

Response:
{
  "success": true,
  "datasetId": "ds_abc123",
  "status": "syncing"
}
```

---

## Storage Limits

- Max connections per user: Unlimited
- Max datasets per user: Unlimited
- Max access token length: ~256 chars (encrypted)
- Repo metadata size: ~5KB per repo

---

## Query Examples

### Get user's connections
```typescript
const connectionsRef = collection(db, 'users', userId, 'connections');
const snapshot = await getDocs(connectionsRef);
const connections = snapshot.docs.map(doc => doc.data());
```

### Get all datasets from a connection
```typescript
const datasetsRef = collection(db, 'datasets');
const q = query(datasetsRef, where('sourceConnection.connectionId', '==', connectionId));
const snapshot = await getDocs(q);
```

### Get active syncs
```typescript
const datasetsRef = collection(db, 'datasets');
const q = query(datasetsRef, where('status', '==', 'syncing'));
const snapshot = await getDocs(q);
```
