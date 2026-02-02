# AI Lab API Documentation

## Overview

The AI Lab API allows external AI laboratories and research teams to discover, browse, and request access to code datasets published on Datta Studio.

## Authentication

All API requests require an API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: datta_your_api_key_here" https://your-domain.com/api/pilot/datasets
```

## Getting Your API Key

1. Sign in to Datta Studio
2. Click the **"AI Labs API"** button in the header
3. Click **"Enable AI Lab Connection"**
4. Your API key will be displayed in the modal
5. Copy the API key (keep it secure!)

## Endpoints

### 1. List Datasets

**GET** `/api/pilot/datasets`

List all available code datasets.

**Query Parameters:**
- `q` (optional): Search query to filter datasets by name, description, or tags

**Response:**
```json
{
  "datasets": [
    {
      "id": "dataset_123",
      "name": "Python ML Libraries",
      "description": "Collection of Python machine learning libraries",
      "size": "2.5 GB",
      "records": 1500,
      "updatedAt": "2024-01-15T10:30:00Z",
      "tags": ["python", "machine-learning", "code"],
      "license": "professional",
      "languages": ["Python", "JavaScript"],
      "frameworks": ["TensorFlow", "PyTorch"],
      "quality": 85
    }
  ],
  "count": 1
}
```

**Example:**
```bash
curl -H "X-API-Key: datta_your_key" \
  "https://your-domain.com/api/pilot/datasets?q=python"
```

---

### 2. Get Dataset Details

**GET** `/api/pilot/datasets/{id}`

Get detailed information about a specific dataset.

**Response:**
```json
{
  "id": "dataset_123",
  "name": "Python ML Libraries",
  "description": "Collection of Python machine learning libraries",
  "schema": {
    "sourceType": "code",
    "licenseType": "professional",
    "fileCount": 1500,
    "fileSize": 2684354560
  },
  "sample": {
    "languages": {
      "Python": { "percentage": 75, "linesOfCode": 50000, "fileCount": 1000 },
      "JavaScript": { "percentage": 25, "linesOfCode": 15000, "fileCount": 500 }
    },
    "frameworks": ["TensorFlow", "PyTorch"],
    "totalLinesOfCode": 65000,
    "quality": {
      "score": 85,
      "hasTests": true,
      "hasDocumentation": true
    }
  },
  "license": "professional",
  "access": "request_required",
  "tags": ["python", "machine-learning"],
  "updatedAt": "2024-01-15T10:30:00Z",
  "metadata": {
    "quality": 4,
    "hasTests": true,
    "hasDocumentation": true
  }
}
```

**Example:**
```bash
curl -H "X-API-Key: datta_your_key" \
  "https://your-domain.com/api/pilot/datasets/dataset_123"
```

---

### 3. Request Dataset Access

**POST** `/api/pilot/requests`

Submit a request to access a dataset.

**Request Body:**
```json
{
  "datasetId": "dataset_123",
  "company": "AI Research Lab Inc.",
  "contactEmail": "researcher@example.com",
  "purpose": "Training a language model for code generation",
  "usageWindowDays": 30
}
```

**Response:**
```json
{
  "id": "request_456",
  "datasetId": "dataset_123",
  "status": "pending",
  "sla": "24 hours",
  "receivedAt": "2024-01-15T10:30:00Z",
  "message": "Your access request has been submitted. The dataset owner will review it within 24 hours."
}
```

**Example:**
```bash
curl -X POST \
  -H "X-API-Key: datta_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "datasetId": "dataset_123",
    "company": "AI Research Lab Inc.",
    "contactEmail": "researcher@example.com",
    "purpose": "Training a language model",
    "usageWindowDays": 30
  }' \
  "https://your-domain.com/api/pilot/requests"
```

---

### 4. Get Your Requests

**GET** `/api/pilot/requests`

Get all access requests you've submitted.

**Response:**
```json
{
  "requests": [
    {
      "id": "request_456",
      "datasetId": "dataset_123",
      "company": "AI Research Lab Inc.",
      "contactEmail": "researcher@example.com",
      "purpose": "Training a language model",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (invalid or missing API key)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

---

## Rate Limiting

- **Rate Limit:** 100 requests per minute per API key
- **Burst:** 20 requests per second

If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

---

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:

```
GET /api/pilot/openapi
```

This returns the complete API specification in OpenAPI format, which can be imported into tools like Postman, Swagger UI, or used to generate client SDKs.

---

## Code Examples

### Python

```python
import requests

API_KEY = "datta_your_api_key_here"
BASE_URL = "https://your-domain.com/api/pilot"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# List datasets
response = requests.get(f"{BASE_URL}/datasets", headers=headers)
datasets = response.json()["datasets"]

# Get dataset details
dataset_id = datasets[0]["id"]
response = requests.get(f"{BASE_URL}/datasets/{dataset_id}", headers=headers)
dataset = response.json()

# Request access
request_data = {
    "datasetId": dataset_id,
    "company": "AI Research Lab",
    "contactEmail": "researcher@example.com",
    "purpose": "Research purposes",
    "usageWindowDays": 30
}
response = requests.post(f"{BASE_URL}/requests", headers=headers, json=request_data)
request_result = response.json()
```

### JavaScript/Node.js

```javascript
const API_KEY = "datta_your_api_key_here";
const BASE_URL = "https://your-domain.com/api/pilot";

const headers = {
  "X-API-Key": API_KEY,
  "Content-Type": "application/json"
};

// List datasets
const datasetsResponse = await fetch(`${BASE_URL}/datasets`, { headers });
const { datasets } = await datasetsResponse.json();

// Get dataset details
const datasetId = datasets[0].id;
const datasetResponse = await fetch(`${BASE_URL}/datasets/${datasetId}`, { headers });
const dataset = await datasetResponse.json();

// Request access
const requestData = {
  datasetId,
  company: "AI Research Lab",
  contactEmail: "researcher@example.com",
  purpose: "Research purposes",
  usageWindowDays: 30
};
const requestResponse = await fetch(`${BASE_URL}/requests`, {
  method: "POST",
  headers,
  body: JSON.stringify(requestData)
});
const requestResult = await requestResponse.json();
```

---

## Support

For API support, contact: support@dattastudio.com

For technical issues, check the status page or open an issue on GitHub.


