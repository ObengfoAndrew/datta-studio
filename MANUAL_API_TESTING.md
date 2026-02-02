# Manual API Testing Guide

## Testing the API Key Validation Security

Since we've implemented middleware that validates API keys on all protected endpoints, here's how to manually test it:

### Prerequisites
- Development server running: `npm run dev` (should be on localhost:3002)
- Have a REST client ready (Postman, Insomnia, or VS Code REST Client)

---

## Test Case 1: Missing API Key Header ❌ Should Fail

**Request:**
```http
GET http://localhost:3002/api/pilot/datasets
Content-Type: application/json
```

**Expected Response:**
```json
{
  "error": "Missing X-API-Key header",
  "code": "UNAUTHORIZED"
}
```

**Status Code:** `401 Unauthorized`

---

## Test Case 2: Invalid API Key Format ❌ Should Fail

**Request:**
```http
GET http://localhost:3002/api/pilot/datasets
Content-Type: application/json
X-API-Key: invalid_key_format
```

**Expected Response:**
```json
{
  "error": "Invalid API key format",
  "code": "UNAUTHORIZED"
}
```

**Status Code:** `401 Unauthorized`

---

## Test Case 3: Valid Format But Nonexistent Key ❌ Should Fail

**Request:**
```http
GET http://localhost:3002/api/pilot/datasets
Content-Type: application/json
X-API-Key: datta_0000000000000000000000000000000000000000000000000000000000000000
```

**Expected Response:**
```json
{
  "error": "API key not found or inactive",
  "code": "UNAUTHORIZED"
}
```

**Status Code:** `401 Unauthorized`

---

## Test Case 4: Generate a Valid API Key ✅ Should Work

**Request:**
```http
POST http://localhost:3002/api/pilot/api-key
Content-Type: application/json

{
  "connectionId": "ai_lab_test123456789",
  "userId": "user_test123456789"
}
```

**Expected Response:**
```json
{
  "apiKey": "datta_abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yz...",
  "connectionId": "ai_lab_test123456789"
}
```

**Status Code:** `201 Created`

**Important Note:** Save this API key - you'll need it for the next test!

---

## Test Case 5: Use Valid API Key ✅ Should Work (if datasets exist)

**Request:**
```http
GET http://localhost:3002/api/pilot/datasets
Content-Type: application/json
X-API-Key: datta_abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yz...
```

**Expected Response:**
```json
{
  "datasets": [
    {
      "id": "dataset_123",
      "name": "Example Dataset",
      "description": "Dataset description",
      "size": "1.5 GB",
      ...
    }
  ],
  "count": 1
}
```

**Status Code:** `200 OK`

**Note:** If no datasets exist yet, you'll get an empty array:
```json
{
  "datasets": [],
  "count": 0
}
```

---

## Testing with cURL

If you prefer command line testing, use cURL (make sure your development server is running):

### Test 1: Missing header (should fail)
```bash
curl -X GET http://localhost:3002/api/pilot/datasets \
  -H "Content-Type: application/json"
```

### Test 2: Invalid key format (should fail)
```bash
curl -X GET http://localhost:3002/api/pilot/datasets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: invalid_key"
```

### Test 3: Generate valid key
```bash
curl -X POST http://localhost:3002/api/pilot/api-key \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"test_123","userId":"user_123"}'
```

### Test 4: Use valid key (copy API key from above response)
```bash
curl -X GET http://localhost:3002/api/pilot/datasets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: datta_YOUR_KEY_HERE"
```

---

## Testing with VS Code REST Client

Create a file `test-api.http`:

```http
### Test 1: Missing API Key (should fail with 401)
GET http://localhost:3002/api/pilot/datasets
Content-Type: application/json

### Test 2: Invalid API Key format (should fail with 401)
GET http://localhost:3002/api/pilot/datasets
Content-Type: application/json
X-API-Key: invalid_format

### Test 3: Generate valid API key
POST http://localhost:3002/api/pilot/api-key
Content-Type: application/json

{
  "connectionId": "ai_lab_test123",
  "userId": "test_user_123"
}

### Test 4: Use the generated API key (copy from previous response)
GET http://localhost:3002/api/pilot/datasets
Content-Type: application/json
X-API-Key: datta_YOUR_API_KEY_HERE
```

Then click "Send Request" on each test in VS Code.

---

## Expected Test Results Summary

| Test | Method | Expected Status | Security Check |
|------|--------|-----------------|-----------------|
| Missing Header | GET /api/pilot/datasets | 401 | ✅ Rejects missing key |
| Invalid Format | GET /api/pilot/datasets | 401 | ✅ Validates format |
| Nonexistent Key | GET /api/pilot/datasets | 401 | ✅ Checks Firestore |
| Generate Key | POST /api/pilot/api-key | 201 | ✅ Creates valid key |
| Valid Key | GET /api/pilot/datasets | 200 | ✅ Accepts valid key |

---

## ✅ Security Verification Checklist

After running these tests, verify:

- [ ] All requests without API key return 401
- [ ] Invalid API key format returns 401
- [ ] Nonexistent keys return 401
- [ ] Generated API keys start with `datta_`
- [ ] Generated keys are 64+ characters long
- [ ] Valid keys are accepted by protected endpoints
- [ ] No user data is exposed in error messages
- [ ] Consistent HTTP status codes (401 for auth errors)

---

## Next: Firestore Security Rules Testing

To test that Firestore rules prevent cross-user access:

1. **Create two test users** in your Firebase Console
2. **User 1**: Upload a dataset
3. **User 2**: Try to read User 1's data via Firebase Console
   - Should be **DENIED** (unless rules are wrong)
4. **Verify in Firestore Rules Simulator**:
   - Go to Firebase Console → Firestore → Rules → Simulator
   - Test read/write with different user IDs
   - Should only allow access when `request.auth.uid == userId`

---

## Summary

The security implementation is working when:

1. ✅ All API endpoints reject requests without `X-API-Key` header
2. ✅ API keys must have `datta_` prefix and be 64+ characters
3. ✅ Firestore rejects access to other users' data
4. ✅ API key usage is tracked (requestCount incremented)
5. ✅ Errors don't expose sensitive information

Once these tests pass, your application is secure and ready for production deployment!
