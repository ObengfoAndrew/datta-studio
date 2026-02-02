// License types
export type LicenseType = 'personal' | 'creative' | 'professional' | 'enterprise';

// Source types
export type SourceType = 'code' | 'art' | 'voice';

// Dataset status types
export type DatasetStatus = 'processing' | 'ready' | 'error' | 'pending';

// License tier definition
export interface LicenseTier {
  id: LicenseType;
  name: string;
  description: string;
  color: string;
  colorDark: string;
  badgeColor: string;
  maxFileSize: number; // in bytes
  maxFilesPerUpload: number;
  maxTotalSize: number; // in bytes
  pricing: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  allowCommercialUse: boolean;
  allowDerivatives: boolean;
  allowRedistribution: boolean;
  royaltyPercentage: number;
}

// Source definition
export interface SourceDefinition {
  id: string;
  type: SourceType;
  name: string;
  icon: string;
  description: string;
  supportedFormats: string[];
  requiresOAuth: boolean;
  oauthProvider?: string;
}

// Code-specific metadata
export interface CodeMetadata {
  languages: {
    [language: string]: {
      percentage: number;
      linesOfCode: number;
      fileCount: number;
    };
  };
  frameworks: string[];
  totalLinesOfCode: number;
  averageFileSize: number;
  licenseCompatibility: {
    compatible: boolean;
    detectedLicenses: string[];
    conflicts: string[];
  };
  codeQuality: {
    score: number; // 0-100
    hasTests: boolean;
    testCoverage?: number;
    hasDocumentation: boolean;
    complexityScore?: number;
  };
  repositoryInfo?: {
    stars: number;
    forks: number;
    contributors: number;
    lastCommit: string;
    primaryLanguage: string;
  };
}

// Dataset metadata
export interface Dataset {
  id: string;
  userId: string;
  sourceName: string;
  sourceType: SourceType;
  licenseType: LicenseType;
  dateAdded: string; // ISO timestamp
  fileSize: number; // bytes
  fileCount: number;
  status: DatasetStatus;
  storageRef: string; // Firebase Storage path
  metadata: {
    originalFormat: string;
    processingStatus: number; // 0-100
    quality: number; // 1-5
    anonymized: boolean;
    description?: string;
    tags?: string[];
    // Code-specific metadata (only for code datasets)
    codeMetadata?: CodeMetadata;
  };
  earnings: {
    totalLicensed: number;
    monthlyRevenue: number;
    licensedToCount: number;
  };
  downloads: number;
  views: number;
  lastModified: string; // ISO timestamp
}

// Component prop interfaces
export interface SourceTileProps {
  source: SourceDefinition;
  isDarkMode: boolean;
  isLoading?: boolean;
  onConnect: () => void;
  onUpload: () => void;
}

export interface LicenseTierCardProps {
  tier: LicenseTier;
  isSelected: boolean;
  isDarkMode: boolean;
  onSelect: () => void;
}

export interface DatasetCardProps {
  dataset: Dataset;
  isDarkMode: boolean;
  onDownload: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export interface AddDataSourceModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onDatasetAdded?: (dataset: Dataset) => void;
  currentUserId?: string;
}

export interface LicenseSelectionModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onLicenseSelected: (licenseType: LicenseType) => void;
  fileSize?: number;
  fileName?: string;
  sourceType?: SourceType;
}

// API response types
export interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string;
  size: number;
  language: string;
  stars: number;
}

export interface GitLabProject {
  id: number;
  name: string;
  web_url: string;
  description: string;
  path_with_namespace: string;
  star_count: number;
}

export interface BitbucketRepository {
  uuid: string;
  name: string;
  links: {
    html: {
      href: string;
    };
  };
  description: string;
  size: number;
}

// Form state types
export interface UploadFormState {
  selectedLicense: LicenseType | null;
  sourceType: SourceType | null;
  file: File | null;
  description: string;
  tags: string[];
  isUploading: boolean;
  error: string | null;
}

export interface OAuthFormState {
  provider: 'github' | 'gitlab' | 'bitbucket' | null;
  selectedLicense: LicenseType | null;
  isConnecting: boolean;
  error: string | null;
}
// Access Request Types
export interface AccessRequest {
  id: string;
  datasetId?: string;
  datasetName: string;
  requesterId?: string;
  requesterName?: string;
  requesterEmail: string;
  aiLabName: string;
  purpose: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  apiKey?: string;
  expiresAt?: string;
  reason?: string;
}

export interface AccessRequestNotification {
  id: string;
  requestId: string;
  datasetName: string;
  aiLabName: string;
  read: boolean;
  createdAt: string;
}