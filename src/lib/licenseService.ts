import { LicenseType, LicenseTier } from './types';

// Define 3 clean licensing tiers for Code (Beta - All Free!)
export const LICENSE_TIERS: Record<LicenseType, LicenseTier> = {
  personal: {
    id: 'personal',
    name: 'Personal Tier',
    description: 'Perfect for learning and hobby projects',
    color: '#10b981', // Green
    colorDark: '#6ee7b7',
    badgeColor: '#d1fae5',
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxFilesPerUpload: 10,
    maxTotalSize: 5 * 1024 * 1024 * 1024, // 5GB
    pricing: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Personal & learning projects',
      'Up to 500MB per file',
      'Up to 10 files per upload',
      'Basic analytics',
      'Community support',
      'Non-commercial use',
    ],
    allowCommercialUse: false,
    allowDerivatives: false,
    allowRedistribution: false,
    royaltyPercentage: 0,
  },
  creative: {
    id: 'creative',
    name: 'Professional Tier',
    description: 'For professional developers & teams',
    color: '#3b82f6', // Blue
    colorDark: '#60a5fa',
    badgeColor: '#dbeafe',
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    maxFilesPerUpload: 100,
    maxTotalSize: 100 * 1024 * 1024 * 1024, // 100GB
    pricing: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Commercial use allowed',
      'Up to 5GB per file',
      'Up to 100 files per upload',
      'Advanced analytics',
      'Email support',
      'Derivative works allowed',
      'Revenue sharing: 75% to you',
      'API access',
    ],
    allowCommercialUse: true,
    allowDerivatives: true,
    allowRedistribution: false,
    royaltyPercentage: 0.75,
  },
  professional: {
    id: 'professional',
    name: 'Enterprise Tier',
    description: 'Large-scale operations & custom needs',
    color: '#8b5cf6', // Purple
    colorDark: '#d8b4fe',
    badgeColor: '#f3e8ff',
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    maxFilesPerUpload: 500,
    maxTotalSize: 1 * 1024 * 1024 * 1024 * 1024, // 1TB
    pricing: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Unlimited commercial use',
      'Up to 10GB per file',
      'Up to 500 files per upload',
      'Real-time analytics',
      '24/7 priority support',
      'Full derivative & redistribution rights',
      'Revenue sharing: 80% to you',
      'Dedicated API with webhooks',
      'Custom integrations',
      'SLA & uptime guarantees',
    ],
    allowCommercialUse: true,
    allowDerivatives: true,
    allowRedistribution: true,
    royaltyPercentage: 0.8,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Tier',
    description: 'Custom enterprise solutions',
    color: '#ef4444', // Red
    colorDark: '#f87171',
    badgeColor: '#fee2e2',
    maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB
    maxFilesPerUpload: 1000,
    maxTotalSize: 10 * 1024 * 1024 * 1024 * 1024, // 10TB
    pricing: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Unlimited everything',
      'Up to 50GB per file',
      'Up to 1000 files per upload',
      'Custom analytics',
      'Dedicated support',
      'Full rights & redistribution',
      'Revenue sharing: 85% to you',
      'Custom API solutions',
      'White-label options',
      'Premium SLA & uptime guarantees',
    ],
    allowCommercialUse: true,
    allowDerivatives: true,
    allowRedistribution: true,
    royaltyPercentage: 0.85,
  },
};

/**
 * Get license tier by ID
 */
export function getLicense(licenseType: LicenseType): LicenseTier {
  return LICENSE_TIERS[licenseType];
}

/**
 * Get all license tiers in order
 */
export function getAllLicenses(): LicenseTier[] {
  return [
    LICENSE_TIERS.personal,
    LICENSE_TIERS.creative,
    LICENSE_TIERS.professional,
  ];
}

/**
 * Validate file size against license tier
 */
export function validateFileSize(
  fileSize: number,
  licenseType: LicenseType
): { valid: boolean; error?: string } {
  const license = getLicense(licenseType);

  if (fileSize > license.maxFileSize) {
    return {
      valid: false,
      error: `File exceeds ${formatBytes(license.maxFileSize)} limit for ${license.name}`,
    };
  }

  return { valid: true };
}

/**
 * Validate total upload size against license tier
 */
export function validateTotalSize(
  totalSize: number,
  licenseType: LicenseType
): { valid: boolean; error?: string } {
  const license = getLicense(licenseType);

  if (totalSize > license.maxTotalSize) {
    return {
      valid: false,
      error: `Total size exceeds ${formatBytes(license.maxTotalSize)} limit for ${license.name}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file count against license tier
 */
export function validateFileCount(
  fileCount: number,
  licenseType: LicenseType
): { valid: boolean; error?: string } {
  const license = getLicense(licenseType);

  if (fileCount > license.maxFilesPerUpload) {
    return {
      valid: false,
      error: `Cannot upload more than ${license.maxFilesPerUpload} files for ${license.name}`,
    };
  }

  return { valid: true };
}

/**
 * Calculate revenue for a dataset
 */
export function calculateRevenue(
  licenseType: LicenseType,
  licensedCount: number,
  monthlyDownloads: number
): number {
  const license = getLicense(licenseType);
  const baseRevenuePerLicense = 10; // Base amount per license (in USD)
  const downloadRevenuePerFile = 0.01; // Revenue per download

  const licenseRevenue = licensedCount * baseRevenuePerLicense * license.royaltyPercentage;
  const downloadRevenue = monthlyDownloads * downloadRevenuePerFile * license.royaltyPercentage;

  return licenseRevenue + downloadRevenue;
}

/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get license color for UI
 */
export function getLicenseColor(licenseType: LicenseType, isDarkMode: boolean): string {
  const license = getLicense(licenseType);
  if (!license) {
    // Fallback to personal tier if license not found
    return isDarkMode ? LICENSE_TIERS.personal.colorDark : LICENSE_TIERS.personal.color;
  }
  return isDarkMode ? license.colorDark : license.color;
}

/**
 * Get license badge color
 */
export function getLicenseBadgeColor(licenseType: LicenseType): string {
  const license = getLicense(licenseType);
  if (!license) {
    // Fallback to personal tier if license not found
    return LICENSE_TIERS.personal.badgeColor;
  }
  return license.badgeColor;
}

/**
 * Check if license allows commercial use
 */
export function allowsCommercialUse(licenseType: LicenseType): boolean {
  const license = getLicense(licenseType);
  return license ? license.allowCommercialUse : false;
}

/**
 * Check if license allows derivatives
 */
export function allowsDerivatives(licenseType: LicenseType): boolean {
  const license = getLicense(licenseType);
  return license ? license.allowDerivatives : false;
}

/**
 * Check if license allows redistribution
 */
export function allowsRedistribution(licenseType: LicenseType): boolean {
  const license = getLicense(licenseType);
  return license ? license.allowRedistribution : false;
}

/**
 * Get royalty percentage for license
 */
export function getRoyaltyPercentage(licenseType: LicenseType): number {
  const license = getLicense(licenseType);
  return license ? license.royaltyPercentage * 100 : 0;
}

/**
 * Recommend license based on use case
 */
export function recommendLicense(
  isCommercial: boolean,
  needsDerivatives: boolean,
  estimatedMonthlyRevenue: number
): LicenseType {
  if (!isCommercial && !needsDerivatives) {
    return 'personal';
  }

  if (!isCommercial && needsDerivatives) {
    return 'creative';
  }

  if (isCommercial && estimatedMonthlyRevenue < 5000) {
    return 'professional';
  }

  return 'enterprise';
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Get estimated monthly revenue
 */
export function getEstimatedMonthlyRevenue(
  licenseType: LicenseType,
  assumedLicenses: number = 10,
  assumedDownloads: number = 1000
): number {
  return calculateRevenue(licenseType, assumedLicenses, assumedDownloads);
}
