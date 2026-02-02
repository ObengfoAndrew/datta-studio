/**
 * Week 2 API Data Types
 * Type definitions for dataset publishing and access requests
 */

export interface CodeMetadata {
  languages: {
    [language: string]: {
      count: number;
      lines: number;
      percentage?: number;
    };
  };
  frameworks: string[];
  totalLinesOfCode: number;
  hasTests: boolean;
  hasDocumentation: boolean;
  codeQuality: {
    score: number; // 0-100
    complexity: 'low' | 'medium' | 'high';
    maintainability: number; // 0-100
  };
}

export interface DataMetadata {
  rowCount: number;
  columnCount: number;
  dataTypes: {
    [column: string]: string;
  };
  sampleData?: Record<string, any>;
}

export interface DatasetMetadata {
  tags: string[];
  quality: number; // 0-5
  language: string;
  framework: string;
  documentation: string | null;
  codeMetadata?: CodeMetadata;
  dataMetadata?: DataMetadata;
}

export interface DatasetStats {
  downloads: number;
  accessRequests: number;
  approvedAccess: number;
  ratings: {
    average: number;
    count: number;
  };
}

export interface DatasetFile {
  name: string;
  size: number;
  type: string;
  path: string; // Storage path
}

export interface DatasetOwner {
  userId: string;
  connectionId: string;
  publishedAt: Date;
}

export interface DatasetAccessControl {
  requestApprovalRequired: boolean;
  allowedUsers: string[];
  deniedUsers: string[];
}

export interface Dataset {
  id: string;
  datasetId: string;
  name: string;
  description: string;
  sourceType: 'code' | 'data' | 'ml-model';
  licenseType: 'open-source' | 'research' | 'professional' | 'commercial';
  status: 'draft' | 'published' | 'archived';
  visibility: 'private' | 'request-only' | 'public';
  owner: DatasetOwner;
  fileList: DatasetFile[];
  metadata: DatasetMetadata;
  stats: DatasetStats;
  accessControl: DatasetAccessControl;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AccessRequest {
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

export interface PublishDatasetPayload {
  datasetId: string;
  name: string;
  description: string;
  sourceType: 'code' | 'data' | 'ml-model';
  licenseType: 'open-source' | 'research' | 'professional' | 'commercial';
  visibility?: 'private' | 'request-only' | 'public';
  tags?: string[];
  quality?: number;
}

export interface ApproveAccessRequestPayload {
  requestId: string;
  action: 'approve' | 'reject';
  notes?: string;
  accessDurationDays?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}
