# Week 2: Dataset Schema & API Implementation

## Firestore Collection Structure

```
users/{userId}
├── datasets/{datasetId}
│   ├── id: string (unique identifier)
│   ├── name: string (dataset name)
│   ├── description: string (detailed description)
│   ├── sourceType: string (code|data|ml-model)
│   ├── licenseType: string (open-source|research|professional|commercial)
│   ├── status: string (draft|published|archived)
│   ├── visibility: string (private|request-only|public)
│   ├── owner: object
│   │   ├── userId: string
│   │   ├── name: string
│   │   └── email: string
│   ├── fileCount: number
│   ├── fileSize: number (bytes)
│   ├── fileList: array
│   │   └── [{
│   │       name: string,
│   │       size: number,
│   │       type: string,
│   │       path: string (storage path)
│   │     }]
│   ├── metadata: object
│   │   ├── tags: array<string>
│   │   ├── description: string
│   │   ├── quality: number (0-5 rating)
│   │   ├── codeMetadata: object
│   │   │   ├── languages: object
│   │   │   │   └── {Python: {count: 150, lines: 2500}, JavaScript: {count: 45, lines: 800}}
│   │   │   ├── frameworks: array<string>
│   │   │   ├── totalLinesOfCode: number
│   │   │   ├── hasTests: boolean
│   │   │   ├── hasDocumentation: boolean
│   │   │   └── codeQuality: object
│   │   │       ├── score: number (0-100)
│   │   │       ├── complexity: string (low|medium|high)
│   │   │       └── maintainability: number (0-100)
│   │   └── dataMetadata: object
│   │       ├── rowCount: number
│   │       ├── columnCount: number
│   │       ├── dataTypes: object
│   │       └── sampleData: object
│   ├── stats: object
│   │   ├── viewCount: number
│   │   ├── downloadCount: number
│   │   ├── accessRequestCount: number
│   │   ├── lastViewed: timestamp
│   │   └── lastModified: timestamp
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── publishedAt: timestamp (when moved to published status)
│   └── accessControl: object
│       ├── allowedUsers: array<string> (user IDs with access)
│       └── deniedUsers: array<string> (blocked users)
│
├── accessRequests/{requestId}
│   ├── id: string (unique request ID)
│   ├── datasetId: string (which dataset is being requested)
│   ├── requesterConnectionId: string (AI Lab connection ID)
│   ├── requesterEmail: string (AI Lab contact email)
│   ├── company: string (requesting company name)
│   ├── purpose: string (intended use)
│   ├── usageWindowDays: number (how long they need access)
│   ├── status: string (pending|approved|rejected|expired)
│   ├── createdAt: timestamp
│   ├── reviewedAt: timestamp (when owner reviewed)
│   ├── reviewedBy: string (user ID of reviewer)
│   ├── reviewNotes: string (approval/rejection reason)
│   ├── expiresAt: timestamp (when access expires)
│   └── downloadUrl: string (signed download URL if approved)
│
└── publishedDatasets/{datasetId}
    └── (same structure as datasets, but copies for easy querying)
    └── (indexed by status=published for faster queries)
```

---

## Firestore Indexes Required

### Index 1: Published Datasets with Search
```
Collection: users/{userId}/datasets
Fields:
  - status (Ascending)
  - publishedAt (Descending)
Purpose: Query published datasets ordered by most recent
Query: where('status', '==', 'published').orderBy('publishedAt', 'desc')
```

### Index 2: Access Requests by Status
```
Collection: users/{userId}/accessRequests
Fields:
  - status (Ascending)
  - createdAt (Descending)
Purpose: Track pending, approved, and rejected requests
Query: where('status', '==', 'pending').orderBy('createdAt', 'desc')
```

### Index 3: Datasets by License Type
```
Collection: users/{userId}/datasets
Fields:
  - status (Ascending)
  - licenseType (Ascending)
  - publishedAt (Descending)
Purpose: Filter datasets by license type
Query: where('status', '==', 'published').where('licenseType', '==', 'open-source')
```

### Index 4: Search Across Multiple Fields
```
Collection: users/{userId}/datasets
Fields:
  - status (Ascending)
  - metadata.tags (Ascending)
  - publishedAt (Descending)
Purpose: Search by tags
Query: where('status', '==', 'published').where('metadata.tags', 'array-contains', 'python')
```

---

## API Endpoints

### POST /api/pilot/datasets
**Purpose:** Publish a dataset (make it available to AI Labs)

**Request:**
```json
{
  "datasetId": "dataset_123",
  "name": "Python ML Libraries",
  "description": "Collection of production-ready ML libraries",
  "sourceType": "code",
  "licenseType": "professional",
  "visibility": "request-only",
  "tags": ["python", "machine-learning"],
  "quality": 4
}
```

**Validation:**
- `datasetId` required, must be unique per user
- `name` required, 3-255 characters
- `description` required, 20-5000 characters
- `sourceType` required, must be one of: code|data|ml-model
- `licenseType` required, must be one of: open-source|research|professional|commercial
- `visibility` required, must be one of: private|request-only|public
- `tags` optional, max 10 tags, each 2-50 chars
- `quality` optional, 0-5 number

**Response:** (201 Created)
```json
{
  "id": "dataset_123",
  "status": "published",
  "publishedAt": "2024-01-15T10:30:00Z",
  "message": "Dataset published successfully"
}
```

**Errors:**
- 400: Invalid input (validation error)
- 401: Unauthorized (no valid API key - for future)
- 409: Dataset already published
- 500: Server error

---

### GET /api/pilot/datasets
**Purpose:** List published datasets (already exists, will enhance)

**Query Parameters:**
- `q` (optional): Search query
- `license` (optional): Filter by license type
- `language` (optional): Filter by programming language
- `framework` (optional): Filter by framework
- `limit` (optional, default: 20): Results per page
- `offset` (optional, default: 0): Pagination offset

**Response:** (200 OK)
```json
{
  "datasets": [...],
  "count": 150,
  "total": 500,
  "hasMore": true
}
```

---

### GET /api/pilot/datasets/{id}
**Purpose:** Get dataset details (already exists, will enhance)

**Response:** (200 OK)
```json
{
  "id": "dataset_123",
  "name": "Python ML Libraries",
  "description": "...",
  "owner": {
    "userId": "user_123",
    "name": "Data Provider",
    "email": "provider@example.com"
  },
  "stats": {
    "viewCount": 1250,
    "downloadCount": 45,
    "accessRequestCount": 12,
    "lastViewed": "2024-01-20T15:00:00Z"
  },
  "schema": {
    "fileCount": 1500,
    "fileSize": 2684354560,
    "sourceType": "code"
  },
  "metadata": {
    "languages": {...},
    "frameworks": [...],
    "codeQuality": {...}
  }
}
```

---

### POST /api/pilot/requests (approval)
**Purpose:** Approve or reject dataset access request (for dataset owner)

**Request:**
```json
{
  "requestId": "request_123",
  "action": "approve|reject",
  "notes": "Approved for research purposes",
  "accessDurationDays": 90
}
```

**Response:** (200 OK)
```json
{
  "id": "request_123",
  "status": "approved",
  "downloadUrl": "https://storage.example.com/...",
  "expiresAt": "2024-04-20T10:30:00Z"
}
```

---

## Data Flow

### Publishing a Dataset
```
1. User uploads files to Firebase Storage
2. User fills dataset metadata in Dashboard
3. Dashboard calls POST /api/pilot/datasets
4. API validates input
5. Creates document in users/{userId}/datasets
6. Copies to users/{userId}/publishedDatasets (indexed)
7. Increments user's publishedCount stat
8. Returns success with dataset ID
```

### Requesting Dataset Access
```
1. AI Lab calls GET /api/pilot/datasets (list published)
2. AI Lab selects dataset and calls POST /api/pilot/requests
3. Creates document in users/{datasetOwner}/accessRequests
4. Sends notification to dataset owner
5. Owner reviews request in dashboard
6. Owner approves/rejects via POST /api/pilot/requests/approve
7. If approved: generates signed download URL, sets expiry date
8. If rejected: notifies requester, creates audit log
```

### Accessing Dataset
```
1. AI Lab downloads file using signed URL
2. Access is logged (downloadCount incremented)
3. Expiry timestamp checked, access denied if expired
4. If data is sensitive, audit trail recorded
```

---

## Error Handling Strategy

### Validation Errors (400 Bad Request)
```json
{
  "error": "validation_error",
  "details": [
    {
      "field": "name",
      "message": "Name must be between 3 and 255 characters"
    },
    {
      "field": "description",
      "message": "Description is required"
    }
  ]
}
```

### Authentication Errors (401 Unauthorized)
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing API key"
}
```

### Permission Errors (403 Forbidden)
```json
{
  "error": "forbidden",
  "message": "You don't have permission to perform this action"
}
```

### Not Found (404)
```json
{
  "error": "not_found",
  "message": "Dataset not found"
}
```

### Conflict (409)
```json
{
  "error": "conflict",
  "message": "Dataset with ID 'dataset_123' already published"
}
```

### Server Error (500)
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

---

## Type Definitions

```typescript
interface Dataset {
  id: string;
  name: string;
  description: string;
  sourceType: 'code' | 'data' | 'ml-model';
  licenseType: 'open-source' | 'research' | 'professional' | 'commercial';
  status: 'draft' | 'published' | 'archived';
  visibility: 'private' | 'request-only' | 'public';
  owner: {
    userId: string;
    name: string;
    email: string;
  };
  fileCount: number;
  fileSize: number;
  metadata: {
    tags: string[];
    description: string;
    quality: number;
    codeMetadata?: CodeMetadata;
  };
  stats: {
    viewCount: number;
    downloadCount: number;
    accessRequestCount: number;
    lastViewed: Date;
    lastModified: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

interface AccessRequest {
  id: string;
  datasetId: string;
  requesterConnectionId: string;
  requesterEmail: string;
  company: string;
  purpose: string;
  usageWindowDays: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  expiresAt?: Date;
  downloadUrl?: string;
}

interface PublishDatasetRequest {
  datasetId: string;
  name: string;
  description: string;
  sourceType: 'code' | 'data' | 'ml-model';
  licenseType: 'open-source' | 'research' | 'professional' | 'commercial';
  visibility?: 'private' | 'request-only' | 'public';
  tags?: string[];
  quality?: number;
}

interface ApproveRequestPayload {
  requestId: string;
  action: 'approve' | 'reject';
  notes?: string;
  accessDurationDays?: number;
}
```

---

## Implementation Notes

1. **Indexing:** Create Firestore indexes before going to production
2. **Signed URLs:** Use Firebase Storage signed URLs with expiry for secure downloads
3. **Validation:** Use schema validation library (e.g., Zod) for input validation
4. **Rate Limiting:** Consider rate limiting API calls per API key
5. **Caching:** Cache published datasets list for faster queries
6. **Audit Logging:** Log all access approvals/rejections for compliance
7. **Notifications:** Send email notifications on access requests/approvals
8. **Versioning:** Support dataset versioning for updates
