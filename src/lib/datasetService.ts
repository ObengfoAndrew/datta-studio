import {
  db,
  auth,
} from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { Dataset, LicenseType, SourceType, DatasetStatus } from './types';
import { validateFileSize, validateTotalSize, validateFileCount } from './licenseService';
import { analyzeCodeDataset } from './codeAnalysis';
import { queryCache, getDatasetsCacheKey } from './cacheService';

/**
 * Validate that a file is a valid code file and not a document, spreadsheet, or media file
 */
function isValidCodeFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

  // Blocked file types that should never be uploaded
  const BLOCKED_EXTENSIONS = [
    '.xlsx', '.xls', '.xlsm', '.xlsb', // Excel
    '.docx', '.doc', '.docm', // Word
    '.pptx', '.ppt', '.pptm', // PowerPoint
    '.pdf', // PDF
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', // Images
    '.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav', '.flac', // Media
    '.exe', '.dll', '.so', '.dylib', // Binaries
  ];

  const BLOCKED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-excel.sheet.binary.macroEnabled.12', // .xlsb
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt
    'application/pdf', // .pdf
    'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', // Images
    'audio/mpeg', 'audio/wav', 'video/mp4', 'video/quicktime', // Media
  ];

  // Check if blocked by MIME type
  if (BLOCKED_MIME_TYPES.includes(file.type)) {
    return false;
  }

  // Check if blocked by extension
  if (BLOCKED_EXTENSIONS.includes(fileExtension)) {
    return false;
  }

  return true;
}

// Helper function to ensure db is initialized
function ensureDb() {
  if (!db) throw new Error('Database not initialized');
  return db as any;
}

/**
 * Upload a dataset file to Firestore (no Cloud Storage needed)
 */
export async function uploadDataset(
  file: File,
  sourceType: SourceType,
  licenseType: LicenseType,
  userId: string,
  metadata?: {
    description?: string;
    tags?: string[];
    quality?: number;
  }
): Promise<Dataset> {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  if (!isValidCodeFile(file)) {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const fileType = file.type || 'unknown type';
    throw new Error(
      `File type not allowed: ${file.name} (${fileType}). ` +
      `Only code files (.js, .py, .ts, .json, .zip, etc.) are accepted.`
    );
  }

  // Validate file size
  const fileSizeValidation = validateFileSize(file.size, licenseType);
  if (!fileSizeValidation.valid) {
    throw new Error(fileSizeValidation.error);
  }

  try {
    const datasetId = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`📤 Starting upload for ${file.name} (${file.size} bytes)`);

    // Convert file to base64 string for Firestore storage
    const fileData = await fileToBase64(file);

    console.log(`✅ File encoded, saving to Firestore...`);

    // Create dataset document in Firestore
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');

    const datasetDoc = {
      id: datasetId,
      userId: userId,
      sourceName: file.name.replace(/\.[^.]+$/, ''), // Remove extension
      title: file.name.replace(/\.[^.]+$/, ''), // Add title field
      sourceType: sourceType,
      licenseType: licenseType,
      dateAdded: new Date().toISOString(),
      fileSize: file.size,
      fileCount: 1,
      status: 'published' as DatasetStatus, // Changed from 'processing' to 'published' so it shows in Discover
      fileName: file.name,
      fileData: fileData, // Store base64 encoded file data in Firestore
      storageRef: '', // Store base64 in Firestore instead of Cloud Storage
      metadata: {
        originalFormat: file.type || 'unknown',
        processingStatus: 100, // Mark as complete
        quality: metadata?.quality || 3,
        anonymized: false,
        description: metadata?.description || '',
        tags: metadata?.tags || [],
      },
      earnings: {
        totalLicensed: 0,
        monthlyRevenue: 0,
        licensedToCount: 0,
      },
      downloads: 0,
      views: 0,
      lastModified: new Date().toISOString(),
    };

    console.log('📝 Creating dataset with data:', datasetDoc);
    console.log('User ID:', userId);
    console.log('Status:', datasetDoc.status);

    const docRef = await addDoc(datasetsRef, datasetDoc);

    console.log(`✅ Dataset created in Firestore: ${docRef.id}`);

    // Notify all listeners (e.g., Discover page) to refresh
    notifyDatasetUpload();

    // Clear cache so fresh data is loaded next time
    queryCache.delete(getDatasetsCacheKey(userId));
    queryCache.delete(getDatasetsCacheKey(userId, 20));

    return {
      ...datasetDoc,
      id: docRef.id,
    };
  } catch (error) {
    console.error('Error uploading dataset:', error);
    console.error('❌ Full error uploading dataset:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Convert File to base64 string for Firestore storage
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
/**
 * Get all datasets for a user with pagination support and caching
 */
export async function getDatasets(userId: string, pageSize: number = 20): Promise<Dataset[]> {
  try {
    // Check cache first
    const cacheKey = getDatasetsCacheKey(userId, pageSize);
    const cachedDatasets = queryCache.get<Dataset[]>(cacheKey);
    
    if (cachedDatasets) {
      console.log('📦 Returning cached datasets for user:', userId);
      return cachedDatasets;
    }

    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    const q = query(datasetsRef, orderBy('dateAdded', 'desc'), limit(pageSize));

    const snapshot = await getDocs(q);
    const datasets: Dataset[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        datasets.push({
          id: doc.id,
          ...data,
        } as Dataset);
      }
    });

    // Cache the results for 5 minutes
    queryCache.set(cacheKey, datasets, 5 * 60 * 1000);
    
    return datasets;
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
}

/**
 * Get datasets with pagination - load next batch
 */
export async function getDatasetsPaginated(
  userId: string,
  pageSize: number = 20,
  lastDocument?: any
): Promise<{ datasets: Dataset[]; lastDoc: any }> {
  try {
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    
    let q: any;
    if (lastDocument) {
      q = query(
        datasetsRef,
        orderBy('dateAdded', 'desc'),
        limit(pageSize)
      );
    } else {
      q = query(
        datasetsRef,
        orderBy('dateAdded', 'desc'),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    const datasets: Dataset[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        datasets.push({
          id: doc.id,
          ...data,
        } as Dataset);
      }
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    return { datasets, lastDoc };
  } catch (error) {
    console.error('Error fetching paginated datasets:', error);
    throw error;
  }
}

/**
 * Get datasets by source type
 */
export async function getDatasetsBySourceType(
  userId: string,
  sourceType: SourceType
): Promise<Dataset[]> {
  try {
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    const q = query(
      datasetsRef,
      where('sourceType', '==', sourceType),
      orderBy('dateAdded', 'desc')
    );

    const snapshot = await getDocs(q);
    const datasets: Dataset[] = [];

    snapshot.forEach((doc) => {
      datasets.push({
        id: doc.id,
        ...doc.data(),
      } as Dataset);
    });

    return datasets;
  } catch (error) {
    console.error('Error fetching datasets by source type:', error);
    throw error;
  }
}

/**
 * Get datasets by license type
 */
export async function getDatasetsByLicenseType(
  userId: string,
  licenseType: LicenseType
): Promise<Dataset[]> {
  try {
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    const q = query(
      datasetsRef,
      where('licenseType', '==', licenseType),
      orderBy('dateAdded', 'desc')
    );

    const snapshot = await getDocs(q);
    const datasets: Dataset[] = [];

    snapshot.forEach((doc) => {
      datasets.push({
        id: doc.id,
        ...doc.data(),
      } as Dataset);
    });

    return datasets;
  } catch (error) {
    console.error('Error fetching datasets by license type:', error);
    throw error;
  }
}

/**
 * Get a single dataset by ID
 */
export async function getDataset(userId: string, datasetId: string): Promise<Dataset> {
  try {
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    const datasetRef = doc(datasetsRef, datasetId);

    const snapshot = await getDocs(
      query(datasetsRef, where('id', '==', datasetId), limit(1))
    );

    if (snapshot.empty) {
      throw new Error('Dataset not found');
    }

    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...data,
    } as Dataset;
  } catch (error) {
    console.error('Error fetching dataset:', error);
    throw error;
  }
}

/**
 * Update dataset license type
 */
export async function updateDatasetLicense(
  userId: string,
  datasetId: string,
  newLicenseType: LicenseType
): Promise<void> {
  try {
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    const datasetRef = doc(datasetsRef, datasetId);

    await updateDoc(datasetRef, {
      licenseType: newLicenseType,
      lastModified: new Date().toISOString(),
    });

    console.log(`Dataset ${datasetId} license updated to ${newLicenseType}`);
  } catch (error) {
    console.error('Error updating dataset license:', error);
    throw error;
  }
}

/**
 * Update dataset status
 */
export async function updateDatasetStatus(
  userId: string,
  datasetId: string,
  status: DatasetStatus,
  processingStatus?: number
): Promise<void> {
  try {
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    const datasetRef = doc(datasetsRef, datasetId);

    const updateData: any = {
      status: status,
      lastModified: new Date().toISOString(),
    };

    if (processingStatus !== undefined) {
      updateData['metadata.processingStatus'] = processingStatus;
    }

    await updateDoc(datasetRef, updateData);
  } catch (error) {
    console.error('Error updating dataset status:', error);
    throw error;
  }
}

/**
 * Delete a dataset
 */
export async function deleteDataset(
  userId: string,
  datasetId: string,
  storageRef?: string
): Promise<void> {
  try {
    // Delete from Firestore (file data is stored inline, no Cloud Storage cleanup needed)
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    const datasetRef = doc(datasetsRef, datasetId);

    await deleteDoc(datasetRef);
    console.log(`Dataset ${datasetId} deleted from Firestore`);
    
    // Clear cache for this user's datasets
    queryCache.delete(getDatasetsCacheKey(userId));
    queryCache.delete(getDatasetsCacheKey(userId, 20));
  } catch (error) {
    console.error('Error deleting dataset:', error);
    throw error;
  }
}

/**
 * Create dataset from GitHub repositories
 */
export async function createGitHubDataset(
  userId: string,
  repos: any[],
  licenseType: LicenseType
): Promise<Dataset> {
  try {
    const datasetId = `dataset_github_${Date.now()}`;

    // Create JSON file with repository data
    const reposData = JSON.stringify(repos, null, 2);
    const file = new File([reposData], 'repositories.json', { type: 'application/json' });

    // Convert to base64 for Firestore storage
    const fileData = await fileToBase64(file);

    // Analyze code metadata from repositories
    const files = repos.flatMap((repo: any) => {
      // Simulate file structure from repo metadata
      const repoFiles: Array<{ name: string; size: number }> = [];
      if (repo.language) {
        // Estimate files based on repo size
        const estimatedFiles = Math.max(1, Math.floor((repo.size || 0) / 1000));
        for (let i = 0; i < estimatedFiles; i++) {
          repoFiles.push({
            name: `file_${i}.${getExtensionForLanguage(repo.language)}`,
            size: (repo.size || 0) / estimatedFiles,
          });
        }
      }
      return repoFiles;
    });

    // Extract repository info for analysis
    const repositoryInfo = repos.length > 0 ? {
      stars: repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || r.stars || 0), 0),
      forks: repos.reduce((sum: number, r: any) => sum + (r.forks_count || r.forks || 0), 0),
      contributors: repos.length, // Simplified
      lastCommit: repos[0]?.updated_at || repos[0]?.pushed_at || new Date().toISOString(),
      primaryLanguage: repos[0]?.language || 'Unknown',
    } : undefined;

    // Perform code analysis
    const codeMetadata = await analyzeCodeDataset(
      files,
      undefined, // dependencies would need to be fetched separately
      repositoryInfo,
      [] // detected licenses would need to be parsed from repo
    );

    // Create dataset in Firestore
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');

    const datasetDoc = {
      id: datasetId,
      sourceName: 'GitHub Repositories',
      sourceType: 'code' as SourceType,
      licenseType: licenseType,
      dateAdded: new Date().toISOString(),
      fileSize: file.size,
      fileCount: repos.length,
      status: 'published' as DatasetStatus,
      fileName: 'repositories.json',
      fileData: fileData,
      storageRef: '',
      metadata: {
        originalFormat: 'application/json',
        processingStatus: 100,
        quality: Math.min(5, Math.max(1, Math.floor(codeMetadata.codeQuality.score / 20))),
        anonymized: false,
        description: `${repos.length} GitHub repositories`,
        tags: ['github', 'code', 'repositories', ...codeMetadata.frameworks],
        codeMetadata: codeMetadata,
      },
      earnings: {
        totalLicensed: 0,
        monthlyRevenue: 0,
        licensedToCount: 0,
      },
      downloads: 0,
      views: 0,
      lastModified: new Date().toISOString(),
    };

    const docRef = await addDoc(datasetsRef, datasetDoc);

    return {
      ...datasetDoc,
      id: docRef.id,
      userId: userId,
    } as Dataset;
  } catch (error) {
    console.error('Error creating GitHub dataset:', error);
    throw error;
  }
}

/**
 * Helper function to get file extension for a language
 */
function getExtensionForLanguage(language: string): string {
  const langMap: { [key: string]: string } = {
    JavaScript: 'js',
    TypeScript: 'ts',
    Python: 'py',
    Java: 'java',
    'C++': 'cpp',
    C: 'c',
    'C#': 'cs',
    Go: 'go',
    Rust: 'rs',
    Ruby: 'rb',
    PHP: 'php',
    Swift: 'swift',
    Kotlin: 'kt',
  };
  return langMap[language] || 'txt';
}

/**
 * Update dataset download count
 */
export async function incrementDownloadCount(
  userId: string,
  datasetId: string
): Promise<void> {
  try {
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');
    const datasetRef = doc(datasetsRef, datasetId);

    const snapshot = await getDocs(
      query(datasetsRef, where('id', '==', datasetId), limit(1))
    );

    if (!snapshot.empty) {
      const currentData = snapshot.docs[0].data();
      await updateDoc(doc(datasetsRef, snapshot.docs[0].id), {
        downloads: (currentData.downloads || 0) + 1,
      });
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
}

/**
 * Update dataset view count
 */
export async function incrementViewCount(
  userId: string,
  datasetId: string
): Promise<void> {
  try {
    const userDocRef = doc(ensureDb(), 'users', userId);
    const datasetsRef = collection(userDocRef, 'datasets');

    const snapshot = await getDocs(
      query(datasetsRef, where('id', '==', datasetId), limit(1))
    );

    if (!snapshot.empty) {
      const currentData = snapshot.docs[0].data();
      await updateDoc(doc(datasetsRef, snapshot.docs[0].id), {
        views: (currentData.views || 0) + 1,
      });
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

/**
 * Get total statistics for user's datasets
 */
export async function getDatasetStats(userId: string): Promise<{
  totalDatasets: number;
  totalSize: number;
  totalDownloads: number;
  totalViews: number;
  totalEarnings: number;
  bySourceType: Record<SourceType, number>;
  byLicenseType: Record<LicenseType, number>;
}> {
  try {
    const datasets = await getDatasets(userId);

    const stats = {
      totalDatasets: datasets.length,
      totalSize: 0,
      totalDownloads: 0,
      totalViews: 0,
      totalEarnings: 0,
      bySourceType: { code: 0, art: 0, voice: 0 },
      byLicenseType: { personal: 0, creative: 0, professional: 0, enterprise: 0 },
    };

    datasets.forEach((dataset) => {
      stats.totalSize += dataset.fileSize;
      stats.totalDownloads += dataset.downloads;
      stats.totalViews += dataset.views;
      stats.totalEarnings += dataset.earnings.monthlyRevenue;
      stats.bySourceType[dataset.sourceType]++;
      stats.byLicenseType[dataset.licenseType]++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting dataset stats:', error);
    throw error;
  }
}

// ============================================
// Event system for dataset changes
// ============================================
type DatasetEventListener = () => void;
const datasetEventListeners = new Set<DatasetEventListener>();

export function onDatasetUpload(listener: DatasetEventListener): () => void {
  datasetEventListeners.add(listener);
  // Return unsubscribe function
  return () => datasetEventListeners.delete(listener);
}

function notifyDatasetUpload() {
  datasetEventListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Error in dataset upload listener:', error);
    }
  });
}
