'use client';

import React, { useState, useRef } from 'react';
import { SourceType, LicenseType, SourceDefinition } from '@/lib/types';
import { X, Github, Upload, Zap } from 'lucide-react';
import SourceTile from './SourceTile';
import LicenseSelectionModal from './LicenseSelectionModal';
import RepositoryConnector from './RepositoryConnector';
import { User as FirebaseUser } from 'firebase/auth';

interface AddDataSourceModalProps {
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onDatasetAdded?: (sourceType: SourceType, licenseType: LicenseType, file?: File, sourceProvider?: string) => void;
  currentUser?: FirebaseUser | null;
}

const AddDataSourceModal: React.FC<AddDataSourceModalProps> = ({
  isOpen,
  isDarkMode,
  onClose,
  onDatasetAdded,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<SourceType>('code');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showRepositoryConnector, setShowRepositoryConnector] = useState(false);
  const [pendingSourceType, setPendingSourceType] = useState<SourceType | null>(null);
  const [pendingSourceProvider, setPendingSourceProvider] = useState<string | null>(null);
  const [pendingLicenseType, setPendingLicenseType] = useState<LicenseType | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      overlay: 'rgba(0, 0, 0, 0.5)',
      tabBg: '#f1f5f9',
      tabBgActive: '#3b82f6',
      tabTextActive: 'white',
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      borderLight: '#475569',
      overlay: 'rgba(0, 0, 0, 0.7)',
      tabBg: '#334155',
      tabBgActive: '#3b82f6',
      tabTextActive: 'white',
    },
  };

  const current = isDarkMode ? theme.dark : theme.light;

  // Define source categories
  const codeSources: SourceDefinition[] = [
    {
      id: 'github',
      type: 'code',
      name: 'GitHub',
      icon: '🔗',
      description: 'Connect your GitHub repositories',
      supportedFormats: ['.zip', '.tar', '.gz', 'JSON'],
      requiresOAuth: true,
      oauthProvider: 'github',
    },
    {
      id: 'gitlab',
      type: 'code',
      name: 'GitLab',
      icon: '🦊',
      description: 'Connect your GitLab projects',
      supportedFormats: ['.zip', '.tar', '.gz', 'JSON'],
      requiresOAuth: true,
      oauthProvider: 'gitlab',
    },
    {
      id: 'code-upload',
      type: 'code',
      name: 'Upload Code Files',
      icon: '📁',
      description: 'Upload ZIP, TAR, or code files',
      supportedFormats: ['.zip', '.tar', '.gz', '.py', '.js', '.ts', '.java'],
      requiresOAuth: false,
    },
  ];

  const sourceMap: Record<SourceType, SourceDefinition[]> = {
    code: codeSources,
    art: codeSources, // Not used, but kept for type compatibility
    voice: codeSources, // Not used, but kept for type compatibility
  };

  const currentSources = sourceMap[activeTab];

  // Define valid code file extensions and MIME types
  const VALID_CODE_EXTENSIONS = [
    '.zip', '.tar', '.gz', '.tar.gz',
    '.py', '.js', '.ts', '.tsx', '.jsx',
    '.java', '.cpp', '.c', '.go', '.rb', '.php',
    '.cs', '.swift', '.kotlin', '.scala',
    '.json', '.xml', '.yaml', '.yml',
    '.html', '.css', '.scss', '.sass',
    '.sql', '.sh', '.bash', '.zsh',
    '.md', '.txt', '.conf', '.config'
  ];

  // Explicitly blocked file extensions (non-code files)
  const BLOCKED_EXTENSIONS = [
    '.xlsx', '.xls', '.xlsm', '.xlsb', // Excel
    '.docx', '.doc', '.docm', // Word
    '.pptx', '.ppt', '.pptm', // PowerPoint
    '.pdf', // PDF
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', // Images
    '.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav', '.flac', // Media
    '.exe', '.dll', '.so', '.dylib', // Binaries
    '.7z', '.rar', // Some archives (but allow .zip, .tar, .gz)
  ];

  const VALID_CODE_MIME_TYPES = [
    'application/zip',
    'application/x-zip-compressed',
    'application/gzip',
    'application/x-gzip',
    'application/x-tar',
    'text/plain',
    'text/x-python',
    'text/javascript',
    'application/json',
    'application/xml',
    'text/xml',
    'text/html',
    'text/css',
    'text/x-shellscript',
  ];

  // Blocked MIME types (non-code files)
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

  // Function to check if file is a valid code file
  const isValidCodeFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    // FIRST: Check if the file is explicitly blocked
    if (BLOCKED_MIME_TYPES.includes(file.type)) {
      return false;
    }

    if (BLOCKED_EXTENSIONS.includes(fileExtension)) {
      return false;
    }

    // Check for double extensions like .tar.gz
    if (fileName.endsWith('.tar.gz') && !BLOCKED_EXTENSIONS.includes('.tar.gz')) {
      return true;
    }

    // THEN: Check if file has a valid code MIME type
    if (VALID_CODE_MIME_TYPES.includes(file.type)) {
      return true;
    }

    // FINALLY: Check if file has a valid code extension
    if (VALID_CODE_EXTENSIONS.includes(fileExtension)) {
      return true;
    }

    return false;
  };

  const handleSourceSelect = (source: SourceDefinition) => {
    if (source.requiresOAuth) {
      // For OAuth, track the provider and trigger license selection
      setPendingSourceType(source.type);
      setPendingSourceProvider(source.oauthProvider || source.id);
      setPendingFile(null);
      setShowLicenseModal(true);
    } else {
      // For file upload, open file picker
      setPendingSourceType(source.type);
      setPendingSourceProvider(null);
      fileInputRef.current?.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingSourceType) {
      // Validate that the file is a code file
      if (!isValidCodeFile(file)) {
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
        
        let errorMsg = `❌ Invalid file type!\n\n`;
        
        // Provide specific error for common non-code files
        if (BLOCKED_EXTENSIONS.includes(fileExtension) || BLOCKED_MIME_TYPES.includes(file.type)) {
          if (['.xlsx', '.xls', '.xlsm', '.xlsb'].includes(fileExtension)) {
            errorMsg += `Excel files (.xlsx, .xls, etc.) are not allowed.\n\n`;
          } else if (['.docx', '.doc', '.docm'].includes(fileExtension)) {
            errorMsg += `Word documents (.docx, .doc, etc.) are not allowed.\n\n`;
          } else if (['.pptx', '.ppt', '.pptm'].includes(fileExtension)) {
            errorMsg += `PowerPoint files (.pptx, .ppt, etc.) are not allowed.\n\n`;
          } else if (fileExtension === '.pdf') {
            errorMsg += `PDF files are not allowed.\n\n`;
          } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'].includes(fileExtension)) {
            errorMsg += `Image files are not allowed.\n\n`;
          } else if (['.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav'].includes(fileExtension)) {
            errorMsg += `Media files (audio/video) are not allowed.\n\n`;
          }
        }
        
        errorMsg += `Only code files are accepted. Valid formats include:\n\n` +
          `Archives: .zip, .tar, .tar.gz, .gz\n` +
          `Code: .js, .ts, .py, .java, .cpp, .go, .rb, .php, .cs, .swift, etc.\n` +
          `Data: .json, .xml, .yaml, .sql\n` +
          `Web: .html, .css, .scss\n` +
          `Text: .txt, .md, .conf\n\n` +
          `You uploaded: ${file.name} (${file.type || 'unknown type'})`;
        
        alert(errorMsg);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setPendingFile(file);
      setSelectedFile(file);
      setShowLicenseModal(true);
    }
  };

  const handleLicenseSelected = (licenseType: LicenseType) => {
    if (pendingSourceProvider) {
      // For OAuth providers (GitHub, GitLab), show repository connector
      setPendingLicenseType(licenseType);
      setShowRepositoryConnector(true);
      setShowLicenseModal(false);
    } else if (pendingSourceType && onDatasetAdded) {
      // For file uploads, directly call onDatasetAdded
      onDatasetAdded(pendingSourceType, licenseType, pendingFile || undefined, pendingSourceProvider || undefined);
      setShowLicenseModal(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: current.overlay,
          zIndex: 2999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out',
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: current.cardBg,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '85vh',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '32px',
              borderBottom: `1px solid ${current.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: current.text,
                  margin: '0 0 8px 0',
                }}
              >
                Add Data Source
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: current.textSecondary,
                  margin: 0,
                }}
              >
                Upload or connect data from your favorite platforms
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'none',
                border: 'none',
                color: current.textSecondary,
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.borderLight;
                (e.currentTarget as HTMLButtonElement).style.color = current.text;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = current.textSecondary;
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Header - Code Sources Only */}
          <div
            style={{
              padding: '16px 32px',
              borderBottom: `1px solid ${current.border}`,
              backgroundColor: current.bg,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Github style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: current.text }}>
              Code Sources
            </h3>
          </div>

          {/* Sources Grid */}
          <div
            style={{
              flex: 1,
              padding: '32px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '20px',
              }}
            >
              {currentSources.map((source) => (
                <SourceTile
                  key={source.id}
                  source={source}
                  isDarkMode={isDarkMode}
                  onConnect={() => handleSourceSelect(source)}
                  onUpload={() => handleSourceSelect(source)}
                />
              ))}
            </div>

            {/* Info Section */}
            <div
              style={{
                marginTop: '40px',
                padding: '20px',
                backgroundColor: current.borderLight,
                borderRadius: '12px',
                borderLeft: `4px solid #3b82f6`,
              }}
            >
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: current.text,
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Zap style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                Choose Your License
              </h4>
              <p
                style={{
                  fontSize: '13px',
                  color: current.textSecondary,
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                After selecting a source, you'll choose a license tier that determines who can use your data
                and how much you earn. Personal is free for personal use, while Professional and Enterprise
                unlock commercial opportunities.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '24px 32px',
              borderTop: `1px solid ${current.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: current.borderLight,
                color: current.text,
                border: `1px solid ${current.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.border;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.borderLight;
              }}
            >
              Close
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelected}
            style={{ display: 'none' }}
            accept={
              activeTab === 'code'
                ? '.zip,.tar,.gz,.tar.gz,.py,.js,.ts,.tsx,.jsx,.java,.cpp,.c,.go,.rb,.php,.cs,.swift,.kotlin,.scala,.json,.xml,.yaml,.yml,.html,.css,.scss,.sass,.sql,.sh,.bash,.zsh,.md,.txt,.conf,.config'
                : activeTab === 'art'
                  ? '.png,.jpg,.jpeg,.psd,.svg,.ai,.gif'
                  : '.wav,.mp3,.m4a,.flac,.aac,.webm'
            }
          />

          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      </div>

      {/* License Selection Modal */}
      <LicenseSelectionModal
        isOpen={showLicenseModal}
        isDarkMode={isDarkMode}
        onClose={() => setShowLicenseModal(false)}
        onLicenseSelected={handleLicenseSelected}
        fileSize={pendingFile?.size}
        fileName={pendingFile?.name}
        sourceType={pendingSourceType || undefined}
        sourceProvider={pendingSourceProvider || undefined}
      />

      {/* Repository Connector Modal */}
      {showRepositoryConnector && currentUser && pendingSourceProvider && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => {
            setShowRepositoryConnector(false);
            setShowLicenseModal(true);
          }}
        >
          <div
            style={{
              backgroundColor: current.cardBg,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowRepositoryConnector(false);
                setShowLicenseModal(true);
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: current.textSecondary,
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>

            <RepositoryConnector
              userId={currentUser.uid}
              provider={pendingSourceProvider as 'github' | 'gitlab' | 'bitbucket'}
              licenseType={pendingLicenseType || 'professional'}
              isDarkMode={isDarkMode}
              onComplete={() => {
                setShowRepositoryConnector(false);
                onClose();
                // Trigger a refresh of datasets
                if (onDatasetAdded) {
                  onDatasetAdded(pendingSourceType || 'code', pendingLicenseType || 'professional', undefined, pendingSourceProvider || undefined);
                }
              }}
              onError={(error) => {
                console.error('Repository connector error:', error);
                alert(`Error: ${error.message}`);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AddDataSourceModal;
