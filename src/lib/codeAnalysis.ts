/**
 * Code Analysis Service
 * Analyzes code datasets to extract languages, frameworks, and quality metrics
 */

import { CodeMetadata } from './types';

// Common programming languages with their file extensions
const LANGUAGE_EXTENSIONS: { [key: string]: string[] } = {
  JavaScript: ['.js', '.jsx', '.mjs', '.cjs'],
  TypeScript: ['.ts', '.tsx'],
  Python: ['.py', '.pyw', '.pyi'],
  Java: ['.java'],
  'C++': ['.cpp', '.cxx', '.cc', '.c++', '.hpp', '.hxx'],
  C: ['.c', '.h'],
  'C#': ['.cs'],
  Go: ['.go'],
  Rust: ['.rs'],
  Ruby: ['.rb', '.rake'],
  PHP: ['.php', '.phtml'],
  Swift: ['.swift'],
  Kotlin: ['.kt', '.kts'],
  Dart: ['.dart'],
  R: ['.r', '.R'],
  Scala: ['.scala'],
  Shell: ['.sh', '.bash', '.zsh'],
  PowerShell: ['.ps1', '.psm1'],
  HTML: ['.html', '.htm'],
  CSS: ['.css', '.scss', '.sass', '.less'],
  SQL: ['.sql'],
  JSON: ['.json'],
  YAML: ['.yaml', '.yml'],
  Markdown: ['.md', '.markdown'],
};

// Framework detection patterns
const FRAMEWORK_PATTERNS: { [key: string]: { files: string[]; dependencies: string[] } } = {
  React: {
    files: ['package.json', 'tsconfig.json'],
    dependencies: ['react', 'react-dom'],
  },
  Vue: {
    files: ['package.json'],
    dependencies: ['vue', '@vue/cli'],
  },
  Angular: {
    files: ['angular.json', 'package.json'],
    dependencies: ['@angular/core'],
  },
  Next: {
    files: ['next.config.js', 'next.config.ts'],
    dependencies: ['next'],
  },
  Django: {
    files: ['manage.py', 'requirements.txt'],
    dependencies: ['django'],
  },
  Flask: {
    files: ['requirements.txt', 'app.py'],
    dependencies: ['flask'],
  },
  Express: {
    files: ['package.json'],
    dependencies: ['express'],
  },
  Spring: {
    files: ['pom.xml', 'build.gradle'],
    dependencies: ['spring-boot', 'spring-core'],
  },
  Laravel: {
    files: ['artisan', 'composer.json'],
    dependencies: ['laravel/framework'],
  },
  Rails: {
    files: ['Gemfile', 'config.ru'],
    dependencies: ['rails'],
  },
};

/**
 * Detect programming languages from file extensions
 */
export function detectLanguages(files: Array<{ name: string; size: number }>): {
  [language: string]: { percentage: number; linesOfCode: number; fileCount: number };
} {
  const languageStats: { [key: string]: { linesOfCode: number; fileCount: number } } = {};
  let totalSize = 0;

  files.forEach((file) => {
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    totalSize += file.size;

    // Find matching language
    for (const [language, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
      if (extensions.includes(extension)) {
        if (!languageStats[language]) {
          languageStats[language] = { linesOfCode: 0, fileCount: 0 };
        }
        // Estimate lines of code (rough approximation: 1KB ≈ 50 lines)
        languageStats[language].linesOfCode += Math.floor(file.size / 20);
        languageStats[language].fileCount += 1;
        break;
      }
    }
  });

  // Calculate percentages
  const totalLines = Object.values(languageStats).reduce(
    (sum, stat) => sum + stat.linesOfCode,
    0
  );

  const result: { [key: string]: { percentage: number; linesOfCode: number; fileCount: number } } =
    {};
  for (const [language, stats] of Object.entries(languageStats)) {
    result[language] = {
      percentage: totalLines > 0 ? (stats.linesOfCode / totalLines) * 100 : 0,
      linesOfCode: stats.linesOfCode,
      fileCount: stats.fileCount,
    };
  }

  return result;
}

/**
 * Detect frameworks from repository structure and dependencies
 */
export function detectFrameworks(
  files: Array<{ name: string; content?: string }>,
  dependencies?: { [key: string]: string }
): string[] {
  const detectedFrameworks: string[] = [];
  const fileNames = files.map((f) => f.name.toLowerCase());

  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    // Check for framework-specific files
    const hasFrameworkFile = patterns.files.some((file) =>
      fileNames.some((name) => name.includes(file))
    );

    // Check for framework dependencies
    const hasFrameworkDependency =
      dependencies &&
      patterns.dependencies.some((dep) =>
        Object.keys(dependencies).some((key) => key.toLowerCase().includes(dep.toLowerCase()))
      );

    if (hasFrameworkFile || hasFrameworkDependency) {
      detectedFrameworks.push(framework);
    }
  }

  return detectedFrameworks;
}

/**
 * Analyze code quality metrics
 */
export function analyzeCodeQuality(files: Array<{ name: string; size: number }>): {
  score: number;
  hasTests: boolean;
  testCoverage?: number;
  hasDocumentation: boolean;
  complexityScore?: number;
} {
  const fileNames = files.map((f) => f.name.toLowerCase());
  const totalFiles = files.length;

  // Check for test files
  const hasTests =
    fileNames.some((name) => name.includes('test')) ||
    fileNames.some((name) => name.includes('spec')) ||
    fileNames.some((name) => name.includes('__tests__'));

  // Check for documentation
  const hasDocumentation =
    fileNames.some((name) => name.includes('readme')) ||
    fileNames.some((name) => name.includes('docs')) ||
    fileNames.some((name) => name.includes('.md'));

  // Calculate quality score (0-100)
  let score = 50; // Base score
  if (hasTests) score += 20;
  if (hasDocumentation) score += 15;
  if (totalFiles > 10) score += 10; // More files = more complete project
  if (totalFiles > 50) score += 5;

  // Estimate complexity (simple heuristic)
  const avgFileSize = files.reduce((sum, f) => sum + f.size, 0) / totalFiles;
  const complexityScore = Math.min(100, Math.floor(avgFileSize / 100));

  return {
    score: Math.min(100, score),
    hasTests,
    hasDocumentation,
    complexityScore,
  };
}

/**
 * Analyze license compatibility
 */
export function analyzeLicenseCompatibility(
  detectedLicenses: string[],
  datasetLicense: string
): {
  compatible: boolean;
  detectedLicenses: string[];
  conflicts: string[];
} {
  // GPL licenses are incompatible with proprietary licenses
  const gplLicenses = ['GPL', 'AGPL', 'LGPL'];
  const proprietaryLicenses = ['proprietary', 'commercial'];

  const hasGPL = detectedLicenses.some((l) =>
    gplLicenses.some((gpl) => l.toUpperCase().includes(gpl))
  );
  const isProprietary = proprietaryLicenses.some((p) =>
    datasetLicense.toLowerCase().includes(p)
  );

  const conflicts: string[] = [];
  if (hasGPL && isProprietary) {
    conflicts.push('GPL licenses are incompatible with proprietary licensing');
  }

  return {
    compatible: conflicts.length === 0,
    detectedLicenses,
    conflicts,
  };
}

/**
 * Main function to analyze code dataset
 */
export async function analyzeCodeDataset(
  files: Array<{ name: string; size: number; content?: string }>,
  dependencies?: { [key: string]: string },
  repositoryInfo?: {
    stars?: number;
    forks?: number;
    contributors?: number;
    lastCommit?: string;
    primaryLanguage?: string;
  },
  detectedLicenses?: string[]
): Promise<CodeMetadata> {
  const languages = detectLanguages(files);
  const frameworks = detectFrameworks(files, dependencies);
  const codeQuality = analyzeCodeQuality(files);

  const totalLinesOfCode = Object.values(languages).reduce(
    (sum, lang) => sum + lang.linesOfCode,
    0
  );
  const averageFileSize =
    files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) / files.length : 0;

  const licenseCompatibility = analyzeLicenseCompatibility(
    detectedLicenses || [],
    'professional' // Default, should be passed from dataset
  );

  return {
    languages,
    frameworks,
    totalLinesOfCode,
    averageFileSize,
    licenseCompatibility,
    codeQuality,
    repositoryInfo: repositoryInfo
      ? {
          stars: repositoryInfo.stars || 0,
          forks: repositoryInfo.forks || 0,
          contributors: repositoryInfo.contributors || 0,
          lastCommit: repositoryInfo.lastCommit || new Date().toISOString(),
          primaryLanguage: repositoryInfo.primaryLanguage || 'Unknown',
        }
      : undefined,
  };
}



