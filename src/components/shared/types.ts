// src/components/shared/types.ts

// Ensure these match your @/lib/types.ts
export type SourceType = 'github' | 'gitlab' | 'bitbucket' | 'code' | 'art' | 'music' | 'api' | 'twitter' | 'linkedin' | 'fitbit';

export type LicenseType = 'personal' | 'creative' | 'professional' | 'enterprise';

export interface Dataset {
  id?: string;
  title: string;
  sourceName: string;
  sourceType: SourceType;
  licenseType: LicenseType;
  status: 'draft' | 'published' | 'uploaded';
  downloads: number;
  views?: number;
  userId?: string;
  dateAdded?: string;
  fileSize: number;
  fileCount?: number;
  storageRef?: string;
  metadata?: {
    description: string;
    tags: string[];
    quality?: number;
    originalFormat?: string;
  };
  earnings?: {
    totalLicensed: number;
    monthlyRevenue: number;
    licensedToCount: number;
  };
  lastModified?: string;
}

export interface WalletFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  folder: string;
  thumbnail?: string;
  downloadURL?: string;
  storagePath?: string;
}

export interface WalletFolder {
  name: string;
  fileCount: number;
  totalSize: number;
  lastModified: string;
}

export interface DataSource {
  name: string;
  icon: string;
  status: string;
  lastSync: string;
  dataSize: string;
}

export interface Activity {
  action: string;
  time: string;
  type: string;
  icon: string;
  folderName?: string;
}

export interface SourceOption {
  name: string;
  icon: string;
  description: string;
  onClick: (onClose: () => void) => void | Promise<void>;
}