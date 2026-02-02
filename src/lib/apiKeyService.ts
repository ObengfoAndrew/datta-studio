/**
 * API Key Service for AI Lab connections
 * Generates and validates API keys for external AI labs
 */

import { doc, collection, addDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface ApiKey {
  id: string;
  userId: string;
  connectionId: string;
  apiKey: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  lastUsed?: string;
  requestCount: number;
  datasetAccessCount: number;
}

/**
 * Generate a secure API key
 */
export function generateApiKey(): string {
  const prefix = 'datta_';
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}${randomPart}`;
}

/**
 * Create an API key for a user's AI Lab connection
 */
export async function createApiKey(userId: string, connectionId: string): Promise<ApiKey> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const apiKeysRef = collection(userDocRef, 'apiKeys');
    
    const apiKey = generateApiKey();
    const apiKeyData = {
      connectionId,
      apiKey,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      requestCount: 0,
      datasetAccessCount: 0,
    };

    const docRef = await addDoc(apiKeysRef, apiKeyData);
    
    return {
      id: docRef.id,
      userId,
      ...apiKeyData,
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
}

/**
 * Validate an API key and return the user ID
 */
export async function validateApiKey(apiKey: string): Promise<{ userId: string; connectionId: string } | null> {
  try {
    // Search across all users for the API key
    // Note: This is not efficient for large scale - consider using a separate collection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const apiKeysRef = collection(userDoc.ref, 'apiKeys');
      const q = query(
        apiKeysRef,
        where('apiKey', '==', apiKey),
        where('status', '==', 'active')
      );
      const apiKeySnapshot = await getDocs(q);

      if (!apiKeySnapshot.empty) {
        const apiKeyData = apiKeySnapshot.docs[0].data();
        
        // Update last used timestamp
        await updateDoc(apiKeySnapshot.docs[0].ref, {
          lastUsed: new Date().toISOString(),
          requestCount: (apiKeyData.requestCount || 0) + 1,
        });

        return {
          userId: userDoc.id,
          connectionId: apiKeyData.connectionId,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Get API key by connection ID
 */
export async function getApiKeyByConnectionId(userId: string, connectionId: string): Promise<ApiKey | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const apiKeysRef = collection(userDocRef, 'apiKeys');
    const q = query(
      apiKeysRef,
      where('connectionId', '==', connectionId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      userId,
      ...data,
    } as ApiKey;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(userId: string, apiKeyId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const apiKeysRef = collection(userDocRef, 'apiKeys');
    const apiKeyRef = doc(apiKeysRef, apiKeyId);

    await updateDoc(apiKeyRef, {
      status: 'revoked',
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    throw error;
  }
}


