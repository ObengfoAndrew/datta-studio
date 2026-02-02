/**
 * API Key Validation Middleware
 * Validates X-API-Key header and extracts user/connection information
 */

import { NextRequest } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface ApiKeyValidationResult {
  valid: boolean;
  userId?: string;
  connectionId?: string;
  error?: string;
}

/**
 * Validate API key from request headers
 * Returns user ID and connection ID if valid
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyValidationResult> {
  try {
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return {
        valid: false,
        error: 'Missing X-API-Key header',
      };
    }

    // Validate API key format (should start with 'datta_')
    if (!apiKey.startsWith('datta_')) {
      return {
        valid: false,
        error: 'Invalid API key format',
      };
    }

    // Search for the API key in Firestore
    // Since we can't do cross-collection queries easily, we search all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const apiKeysRef = collection(userDoc.ref, 'apiKeys');
      const q = query(
        apiKeysRef,
        where('apiKey', '==', apiKey),
        where('status', '==', 'active')
      );

      const keySnapshot = await getDocs(q);

      if (!keySnapshot.empty) {
        const keyData = keySnapshot.docs[0].data();

        // Update last used timestamp
        try {
          const keyRef = keySnapshot.docs[0].ref;
          await import('firebase/firestore').then(({ updateDoc }) => {
            return updateDoc(keyRef, {
              lastUsed: new Date().toISOString(),
              requestCount: (keyData.requestCount || 0) + 1,
            });
          });
        } catch (updateError) {
          // Log but don't fail if update fails
          console.error('Failed to update API key usage:', updateError);
        }

        return {
          valid: true,
          userId: userDoc.id,
          connectionId: keyData.connectionId,
        };
      }
    }

    return {
      valid: false,
      error: 'API key not found or inactive',
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return {
      valid: false,
      error: 'Error validating API key',
    };
  }
}

/**
 * Create a middleware response for invalid API key
 */
export function createUnauthorizedResponse(error: string = 'Unauthorized') {
  return new Response(
    JSON.stringify({
      error: error,
      code: 'UNAUTHORIZED',
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
