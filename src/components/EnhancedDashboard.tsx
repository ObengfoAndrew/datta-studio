'use client'

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  DollarSign,
  Settings,
  User,
  Plus,
  RefreshCw,
  Bell,
  Search,
  ChevronDown,
  TrendingUp,
  Activity,
  Zap,
  Moon,
  Sun,
  Folder,
  Upload,
  File,
  X,
  Grid,
  List,
  ArrowLeft,
  Calendar,
  FileText,
  Video,
  Music,
  Archive,
  Code,
  Eye,
  Download,
  Trash2,
  Tag,
  Github,
  Twitter,
  Linkedin,
  Mail,
  ExternalLink
} from 'lucide-react';

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { addDoc, getDocs, collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { db, storage, auth } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import AnnotationDashboard from './AnnotationDashboard';

interface Theme {
  bg: string;
  cardBg: string;
  text: string;
  textSecondary: string;
  border: string;
  borderLight: string;
  searchBg: string;
  sidebarBg: string;
  activityBg: string;
}

interface WalletFile {
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

interface WalletFolder {
  name: string;
  fileCount: number;
  totalSize: number;
  lastModified: string;
}

// Data Wallet Component
const DataWallet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  initialFolder?: string | null;
  uploadedFiles?: WalletFile[];
  userId?: string;
}> = ({ isOpen, onClose, isDarkMode, initialFolder, uploadedFiles = [], userId }) => {
  const [currentFolder, setCurrentFolder] = useState<string | null>(initialFolder || null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [folders, setFolders] = useState<WalletFolder[]>([]);
  const [files, setFiles] = useState<WalletFile[]>([]);

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e5e7eb',
      borderLight: '#f1f5f9',
      searchBg: '#f8fafc',
      hover: '#e0e7ff'
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      borderLight: '#475569',
      searchBg: '#334155',
      hover: '#312e81'
    }
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  useEffect(() => {
    // Fetch data from both Firebase and local state
    const fetchWalletData = async () => {
      try {
        console.log('🔍 Fetching wallet data...');
        
        // Get local uploaded files from parent component
        const localFiles = uploadedFiles || [];
        console.log('📁 Local files found:', localFiles.length);
        
        // Group local files by folder
        const localFolders: { [key: string]: WalletFile[] } = {};
        localFiles.forEach(file => {
          if (!localFolders[file.folder]) {
            localFolders[file.folder] = [];
          }
          localFolders[file.folder].push(file);
        });
        
        // Create folder data from local files
        const localFoldersData: WalletFolder[] = Object.entries(localFolders).map(([folderName, files]) => ({
          name: folderName,
          fileCount: files.length,
          totalSize: files.reduce((acc, file) => acc + file.size, 0),
          lastModified: files.reduce((latest, file) => 
            file.uploadDate > latest ? file.uploadDate : latest, files[0].uploadDate)
        }));
        
        console.log('📂 Local folders created:', localFoldersData);
        
        // Fetch data from Firestore
        let firebaseFolders: WalletFolder[] = [];
        let firebaseFiles: WalletFile[] = [];
        
        // Get userId from prop or use demo-user as fallback
        const walletUserId = userId || 'demo-user';
        try {
          const userDocRef = doc(db, 'users', walletUserId);
          
          // Fetch wallet folders from Firestore
          const walletRef = collection(userDocRef, 'wallet');
          const walletSnapshot = await getDocs(walletRef);
          
          if (!walletSnapshot.empty) {
            walletSnapshot.forEach((folderDoc) => {
              const folderData = folderDoc.data();
              const folderName = folderData.sanitizedFolderName || folderDoc.id;
              
              // Create folder info
              firebaseFolders.push({
                name: folderName,
                fileCount: folderData.fileCount || 0,
                totalSize: folderData.totalSize || 0,
                lastModified: folderData.updatedAt || folderData.createdAt || new Date().toISOString()
              });
              
              // Extract files from folder data
              if (folderData.files && Array.isArray(folderData.files)) {
                folderData.files.forEach((file: any, index: number) => {
                  firebaseFiles.push({
                    id: `${folderDoc.id}-${index}-${file.name}`,
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size || 0,
                    uploadDate: folderData.createdAt || new Date().toISOString(),
                    folder: folderName,
                    downloadURL: file.url,
                    storagePath: file.storagePath || `users/${walletUserId}/wallet/${folderName}/${file.name}`
                  });
                });
              }
            });
            
            console.log(`✅ Fetched ${firebaseFolders.length} folders and ${firebaseFiles.length} files from Firestore`);
          } else {
            console.log('📭 No wallet data found in Firestore');
          }
          
          // Also fetch legacy collections for backward compatibility
          const legacyCollections = ['csv-files', 'uploads'];
          for (const collectionName of legacyCollections) {
          try {
            const collectionRef = collection(userDocRef, collectionName);
            const snapshot = await getDocs(collectionRef);

            if (!snapshot.empty) {
              snapshot.forEach(docSnapshot => {
                const data = docSnapshot.data();
                
                if (collectionName === 'csv-files' && data.files) {
                  data.files.forEach((file: any, index: number) => {
                      firebaseFiles.push({
                      id: `${docSnapshot.id}-${index}`,
                      name: file.name,
                      type: 'text/csv',
                      size: data.totalSize ? data.totalSize / data.files.length : 1024,
                      uploadDate: data.uploadedAt || new Date().toISOString(),
                      folder: 'csv',
                      downloadURL: file.url
                    });
                    });
                    
                    if (!firebaseFolders.find(f => f.name === 'csv')) {
                  firebaseFolders.push({
                        name: 'csv',
                        fileCount: data.files.length,
                        totalSize: data.totalSize || 0,
                        lastModified: data.uploadedAt || new Date().toISOString()
                      });
                    }
                  }
                });
            }
          } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
          }
          }
        } catch (error) {
          console.error('⚠️ Error fetching from Firestore:', error);
          console.log('⚠️ Using local data only');
        }

        // Combine local and Firebase data
        const allFolders = [...localFoldersData, ...firebaseFolders];
        const allFiles = [...localFiles, ...firebaseFiles];
        
        console.log('✅ Final folders:', allFolders);
        console.log('✅ Final files:', allFiles);

        setFolders(allFolders);
        setFiles(allFiles);
        
      } catch (error) {
        console.error('❌ Error fetching wallet data:', error);
        setFolders([]);
        setFiles([]);
      }
    };

    if (isOpen) {
      fetchWalletData();
    }
  }, [isOpen, uploadedFiles]); // Re-fetch when modal opens or uploadedFiles changes

  useEffect(() => {
    if (initialFolder) {
      setCurrentFolder(initialFolder);
    }
  }, [initialFolder]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf')) return FileText;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    if (type.includes('javascript') || type.includes('json') || type.includes('html')) return Code;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // File action handlers
  const handleFileView = (file: WalletFile) => {
    // For now, just show file info - you can implement actual file preview
    alert(`Viewing ${file.name}\nSize: ${formatFileSize(file.size)}\nType: ${file.type}`);
  };

  const handleFileDownload = async (file: WalletFile) => {
    try {
      if (file.downloadURL) {
        // If we have a Firebase download URL, use it directly
        const a = document.createElement('a');
        a.href = file.downloadURL;
        a.download = file.name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log(`Downloading from Firebase: ${file.name}`);
      } else {
        // Fallback for files without download URL
        alert(`Download URL not available for ${file.name}. This file may not be stored in Firebase Storage.`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const handleFileDelete = async (file: WalletFile) => {
    if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }

    // Get userId from prop or use demo-user as fallback
    const walletUserId = userId || 'demo-user';
    try {
      const userDocRef = doc(db, 'users', walletUserId);

      // Delete from Firebase Storage if storage path exists
      if (file.storagePath) {
        try {
          const fileRef = ref(storage, file.storagePath);
          await deleteObject(fileRef);
          console.log(`Deleted from Storage: ${file.storagePath}`);
        } catch (storageError) {
          console.error('Error deleting from Storage:', storageError);
          // Continue with Firestore deletion even if Storage deletion fails
        }
      }

      // Delete from Firestore wallet collection
      const walletRef = collection(userDocRef, 'wallet');
      const folderDocRef = doc(walletRef, file.folder);
      
      try {
        const folderDoc = await getDocs(collection(userDocRef, 'wallet'));
        const folderDocSnapshot = folderDoc.docs.find(d => d.id === file.folder);
        
        if (folderDocSnapshot) {
          const folderData = folderDocSnapshot.data();
          
          if (folderData.files && Array.isArray(folderData.files)) {
            // Remove the file from the files array
            const updatedFiles = folderData.files.filter((f: any) => f.name !== file.name);
            
            if (updatedFiles.length === 0) {
              // If no files left, delete the entire folder document
              await deleteDoc(folderDocRef);
              console.log(`Deleted folder document from Firestore: ${file.folder}`);
            } else {
              // Update the folder document with remaining files
              await setDoc(folderDocRef, {
                ...folderData,
                files: updatedFiles,
                fileCount: updatedFiles.length,
                totalSize: updatedFiles.reduce((acc: number, f: any) => acc + (f.size || 0), 0),
                updatedAt: new Date().toISOString()
              }, { merge: true });
              console.log(`Updated folder document in Firestore: ${file.folder}`);
            }
          }
        }
        
        // Also handle legacy collections for backward compatibility
      if (file.folder === 'csv') {
        const csvRef = collection(userDocRef, 'csv-files');
        const csvSnapshot = await getDocs(csvRef);
        
        for (const docSnapshot of csvSnapshot.docs) {
          const data = docSnapshot.data();
          if (data.files && data.files.some((f: any) => f.name === file.name)) {
            await deleteDoc(doc(csvRef, docSnapshot.id));
            console.log(`Deleted from Firestore csv-files: ${docSnapshot.id}`);
          }
        }
      } else if (file.folder === 'uploads') {
        const uploadsRef = collection(userDocRef, 'uploads');
        const uploadsSnapshot = await getDocs(uploadsRef);
        
        for (const docSnapshot of uploadsSnapshot.docs) {
          const data = docSnapshot.data();
          if (data.files && data.files.some((f: any) => f.name === file.name)) {
            if (data.files.length > 1) {
              const updatedFiles = data.files.filter((f: any) => f.name !== file.name);
              await setDoc(doc(uploadsRef, docSnapshot.id), {
                ...data,
                files: updatedFiles,
                totalFiles: updatedFiles.length,
                totalSize: updatedFiles.reduce((acc: number, f: any) => acc + (f.size || 0), 0)
              });
              console.log(`Updated document in uploads: ${docSnapshot.id}`);
            } else {
              await deleteDoc(doc(uploadsRef, docSnapshot.id));
              console.log(`Deleted document from uploads: ${docSnapshot.id}`);
            }
          }
        }
        }
      } catch (firestoreError) {
        console.error('Error deleting from Firestore:', firestoreError);
      }

      // Update local state
      setFiles((prev: any[]) => prev.filter((f: any) => f.id !== file.id));
      setFolders(prev => prev.map(folder => {
        if (folder.name === file.folder) {
          return {
            ...folder,
            fileCount: Math.max(0, folder.fileCount - 1),
            totalSize: Math.max(0, folder.totalSize - file.size)
          };
        }
        return folder;
      }).filter(folder => folder.fileCount > 0)); // Remove empty folders

      alert(`${file.name} deleted successfully from Firebase!`);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Error deleting file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = currentFolder ? 
      (file.folder === currentFolder || file.folder === currentFolder.toLowerCase().replace(/\s+/g, '_')) : true;
    const matchesFilter = selectedFilter === 'all' || file.type.startsWith(selectedFilter);
    return matchesSearch && matchesFolder && matchesFilter;
  });

  const filteredFolders = folders.filter(folder => {
    return folder.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: currentTheme.cardBg,
        borderRadius: '16px',
        width: '90%',
        maxWidth: '1200px',
        height: '80vh',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${currentTheme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {currentFolder && (
              <button
                onClick={() => setCurrentFolder(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: currentTheme.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowLeft style={{ width: '20px', height: '20px' }} />
              </button>
            )}
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: currentTheme.text,
              margin: 0
            }}>
              {currentFolder ? `${currentFolder} Folder` : 'Data Wallet'}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: currentTheme.textSecondary,
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Controls */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${currentTheme.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: currentTheme.textSecondary
            }} />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 40px',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: currentTheme.searchBg,
                color: currentTheme.text
              }}
            />
          </div>

          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: currentTheme.cardBg,
              color: currentTheme.text
            }}
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="text">Documents</option>
            <option value="application">Data Files</option>
          </select>

          <div style={{
            display: 'flex',
            backgroundColor: currentTheme.searchBg,
            borderRadius: '8px',
            padding: '4px'
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: viewMode === 'grid' ? '#3b82f6' : 'transparent',
                color: viewMode === 'grid' ? 'white' : currentTheme.textSecondary,
                cursor: 'pointer'
              }}
            >
              <Grid style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: viewMode === 'list' ? '#3b82f6' : 'transparent',
                color: viewMode === 'list' ? 'white' : currentTheme.textSecondary,
                cursor: 'pointer'
              }}
            >
              <List style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto'
        }}>
          {!currentFolder ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
              gap: '16px'
            }}>
              {filteredFolders.map((folder) => (
                <div
                  key={folder.name}
                  onClick={() => setCurrentFolder(folder.name)}
                  style={{
                    padding: '20px',
                    backgroundColor: currentTheme.cardBg,
                    border: `1px solid ${currentTheme.borderLight}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: viewMode === 'list' ? 'center' : 'flex-start',
                    gap: '16px',
                    flexDirection: viewMode === 'list' ? 'row' : 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentTheme.hover;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = currentTheme.cardBg;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    width: viewMode === 'list' ? '48px' : '64px',
                    height: viewMode === 'list' ? '48px' : '64px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Folder style={{ width: viewMode === 'list' ? '24px' : '32px', height: viewMode === 'list' ? '24px' : '32px' }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: currentTheme.text,
                      margin: '0 0 8px 0',
                      textTransform: 'capitalize'
                    }}>
                      {folder.name}
                    </h3>
                    <div style={{
                      fontSize: '14px',
                      color: currentTheme.textSecondary,
                      display: 'flex',
                      flexDirection: viewMode === 'list' ? 'row' : 'column',
                      gap: viewMode === 'list' ? '16px' : '4px'
                    }}>
                      <span>{folder.fileCount} files</span>
                      <span>{formatFileSize(folder.totalSize)}</span>
                      <span>Modified {formatDate(folder.lastModified)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr',
              gap: '16px'
            }}>
              {filteredFiles.map((file) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    style={{
                      padding: '16px',
                      backgroundColor: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.borderLight}`,
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: viewMode === 'list' ? 'center' : 'flex-start',
                      gap: '12px',
                      flexDirection: viewMode === 'list' ? 'row' : 'column'
                    }}
                  >
                    <div style={{
                      width: viewMode === 'list' ? '40px' : '48px',
                      height: viewMode === 'list' ? '40px' : '48px',
                      backgroundColor: '#f59e0b',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: currentTheme.text,
                        margin: '0 0 4px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </h4>
                      <div style={{
                        fontSize: '12px',
                        color: currentTheme.textSecondary,
                        display: 'flex',
                        flexDirection: viewMode === 'list' ? 'row' : 'column',
                        gap: viewMode === 'list' ? '12px' : '2px'
                      }}>
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.uploadDate)}</span>
                      </div>
                    </div>

                    {/* Action buttons for both grid and list view */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px',
                      flexDirection: viewMode === 'grid' ? 'row' : 'row',
                      justifyContent: viewMode === 'grid' ? 'center' : 'flex-end',
                      width: viewMode === 'grid' ? '100%' : 'auto',
                      marginTop: viewMode === 'grid' ? '12px' : '0'
                    }}>
                      <button
                        onClick={() => handleFileView(file)}
                        style={{
                          padding: '6px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: currentTheme.searchBg,
                          color: currentTheme.textSecondary,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
                          (e.currentTarget as HTMLButtonElement).style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.searchBg;
                          (e.currentTarget as HTMLButtonElement).style.color = currentTheme.textSecondary;
                        }}
                        title="View"
                      >
                        <Eye style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleFileDownload(file)}
                        style={{
                          padding: '6px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: currentTheme.searchBg,
                          color: currentTheme.textSecondary,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                          (e.currentTarget as HTMLButtonElement).style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = currentTheme.searchBg;
                          (e.currentTarget as HTMLButtonElement).style.color = currentTheme.textSecondary;
                        }}
                        title="Download"
                      >
                        <Download style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleFileDelete(file)}
                        style={{
                          padding: '6px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626';
                          (e.currentTarget as HTMLButtonElement).style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fee2e2';
                          (e.currentTarget as HTMLButtonElement).style.color = '#dc2626';
                        }}
                        title="Delete"
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {((!currentFolder && filteredFolders.length === 0) || (currentFolder && filteredFiles.length === 0)) && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: currentTheme.textSecondary
            }}>
              <Folder style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                opacity: 0.5
              }} />
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                {searchTerm ? 'No results found' : 'No files yet'}
              </h3>
              <p style={{
                fontSize: '14px',
                margin: 0
              }}>
                {searchTerm 
                  ? 'Try adjusting your search terms or filters' 
                  : 'Upload files to see them here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EnhancedDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6M');
  const [notifications, setNotifications] = useState(3);
  const [activeView, setActiveView] = useState<'dashboard' | 'annotations'>('dashboard');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dataSources, setDataSources] = useState<Array<{
    name: string;
    icon: string;
    status: string;
    lastSync: string;
    dataSize: string;
  }>>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hoveredSidebar, setHoveredSidebar] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredDataSource, setHoveredDataSource] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [walletFolders, setWalletFolders] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    size: number;
    type: string;
    uploadDate: string;
  }>>([]);
  const [showDataWallet, setShowDataWallet] = useState(false);
  const [selectedWalletFolder, setSelectedWalletFolder] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{
    action: string;
    time: string;
    type: string;
    icon: string;
    folderName?: string;
  }>>([
    { action: 'Data uploaded from Fitbit', time: '2 hours ago', type: 'upload', icon: '⌚' },
    { action: 'New data source connected, Twitter', time: '1 day ago', type: 'connection', icon: '🐦' },
    { action: 'Data upload completed from Facebook', time: '3 days ago', type: 'upload', icon: '📘' },
    { action: 'Payment of $500 received', time: '1 week ago', type: 'payment', icon: '💰' }
  ]);

  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Firebase Auth state management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        console.log('✅ User authenticated:', user.uid);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        console.log('👤 User signed out');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to get current user ID
  const getUserId = () => {
    if (currentUser) {
      return currentUser.uid;
    }
    // Fallback to demo-user only if no auth (shouldn't happen in production)
    return 'demo-user';
  };

  // Load data sources from Firestore on mount
  useEffect(() => {
    const loadDataSources = async () => {
      try {
        const userId = getUserId();
        const userDocRef = doc(db, 'users', userId);
        const dataSourcesRef = collection(userDocRef, 'dataSources');
        const snapshot = await getDocs(dataSourcesRef);

        if (!snapshot.empty) {
          const loadedSources = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              name: data.name || '',
              icon: data.icon || '📁',
              status: data.status || 'Active',
              lastSync: data.lastSync || new Date().toISOString(),
              dataSize: data.dataSize || '0'
            };
          });
          setDataSources(loadedSources);
          console.log(`✅ Loaded ${loadedSources.length} data sources from Firestore`);
        }
      } catch (error) {
        console.error('❌ Error loading data sources from Firestore:', error);
      }
    };

    if (isAuthenticated && currentUser) {
      loadDataSources();
    }
  }, [isAuthenticated, currentUser]);

  // Load recent activity from Firestore on mount
  useEffect(() => {
    const loadRecentActivity = async () => {
      if (!isAuthenticated || !currentUser) return;
      try {
        const userId = getUserId();
        const userDocRef = doc(db, 'users', userId);
        const activitiesRef = collection(userDocRef, 'activities');
        const snapshot = await getDocs(activitiesRef);

        if (!snapshot.empty) {
          const loadedActivities = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                action: data.action || '',
                time: data.time || 'Just now',
                type: data.type || 'upload',
                icon: data.icon || '📁',
                folderName: data.folderName || undefined
              };
            })
            .sort((a, b) => {
              // Sort by time (most recent first)
              const timeA = a.time.includes('Just now') ? 0 : 
                           a.time.includes('hour') ? 1 : 
                           a.time.includes('day') ? 2 : 3;
              const timeB = b.time.includes('Just now') ? 0 : 
                           b.time.includes('hour') ? 1 : 
                           b.time.includes('day') ? 2 : 3;
              return timeA - timeB;
            })
            .slice(0, 10); // Limit to 10 most recent
          
          if (loadedActivities.length > 0) {
            setRecentActivity(loadedActivities);
            console.log(`✅ Loaded ${loadedActivities.length} activities from Firestore`);
          }
        }
      } catch (error) {
        console.error('❌ Error loading activities from Firestore:', error);
      }
    };

    if (isAuthenticated && currentUser) {
      loadRecentActivity();
    }
  }, [isAuthenticated, currentUser]);

  // Load wallet folders from Firestore on mount
  useEffect(() => {
    const loadWalletFolders = async () => {
      if (!isAuthenticated || !currentUser) return;
      try {
        const userId = getUserId();
        const userDocRef = doc(db, 'users', userId);
        const walletRef = collection(userDocRef, 'wallet');
        const snapshot = await getDocs(walletRef);

        if (!snapshot.empty) {
          const loadedFolders = snapshot.docs.map(doc => {
            const data = doc.data();
            return data.sanitizedFolderName || doc.id;
          });
          setWalletFolders(loadedFolders);
          console.log(`✅ Loaded ${loadedFolders.length} wallet folders from Firestore`);
        }
      } catch (error) {
        console.error('❌ Error loading wallet folders from Firestore:', error);
      }
    };

    if (isAuthenticated && currentUser) {
      loadWalletFolders();
    }
  }, [isAuthenticated, currentUser]);

  // Load uploaded files summary from Firestore on mount
  useEffect(() => {
    const loadUploadedFiles = async () => {
      if (!isAuthenticated || !currentUser) return;
      try {
        const userId = getUserId();
        const userDocRef = doc(db, 'users', userId);
        const walletRef = collection(userDocRef, 'wallet');
        const snapshot = await getDocs(walletRef);

        if (!snapshot.empty) {
          const loadedFiles: Array<{
            name: string;
            size: number;
            type: string;
            uploadDate: string;
          }> = [];

          snapshot.docs.forEach(folderDoc => {
            const folderData = folderDoc.data();
            if (folderData.files && Array.isArray(folderData.files)) {
              folderData.files.forEach((file: any) => {
                loadedFiles.push({
                  name: file.name || '',
                  size: file.size || 0,
                  type: file.type || 'application/octet-stream',
                  uploadDate: folderData.createdAt || new Date().toISOString()
                });
              });
            }
          });

          setUploadedFiles(loadedFiles);
          console.log(`✅ Loaded ${loadedFiles.length} uploaded files from Firestore`);
        }
      } catch (error) {
        console.error('❌ Error loading uploaded files from Firestore:', error);
      }
    };

    if (isAuthenticated && currentUser) {
      loadUploadedFiles();
    }
  }, [isAuthenticated, currentUser]);

  // Sample data for the earnings chart
  const earningsData = [
    { month: 'Jan', value: 1200, growth: 5 },
    { month: 'Feb', value: 1400, growth: 16.7 },
    { month: 'Mar', value: 1800, growth: 28.6 },
    { month: 'Apr', value: 1600, growth: -11.1 }
  ];

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e5e7eb',
      borderLight: '#f1f5f9',
      searchBg: '#f8fafc',
      sidebarBg: 'white',
      activityBg: '#f8fafc'
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      borderLight: '#475569',
      searchBg: '#334155',
      sidebarBg: '#1e293b',
      activityBg: '#334155'
    }
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { icon: Database, label: 'Data Sources', badge: '5' },
    { icon: BarChart3, label: 'Analytics', badge: null },
    { icon: DollarSign, label: 'Earnings', badge: 'New' },
    { icon: Tag, label: 'Annotation Services', badge: null },
    { icon: Settings, label: 'Settings', badge: null }
  ];

  // Function to add new activity
  const addActivity = async (action: string, type: string, icon: string, folderName?: string) => {
    const newActivity = {
      action,
      time: 'Just now',
      type,
      icon,
      folderName
    };
    
    // Update local state
    setRecentActivity(prev => [newActivity, ...prev]);
    
    // Save to Firestore
    if (!isAuthenticated || !currentUser) return;
    try {
      const userId = getUserId();
      const userDocRef = doc(db, 'users', userId);
      const activitiesRef = collection(userDocRef, 'activities');
      await addDoc(activitiesRef, {
        ...newActivity,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Activity saved to Firestore: ${action}`);
    } catch (error) {
      console.error('❌ Error saving activity to Firestore:', error);
    }
  };

  // Function to handle activity clicks
  const handleActivityClick = (activity: { action: string; time: string; type: string; icon: string; folderName?: string }) => {
    if (activity.folderName) {
      setSelectedWalletFolder(activity.folderName);
      setShowDataWallet(true);
    }
  };

  // File upload handler
  const handleFileUpload = (onClose: () => void, sourceName?: string) => {
    if (!isAuthenticated || !currentUser) {
      alert('Please sign in to upload files.');
      return;
    }
    console.log('🚀 File upload initiated with source:', sourceName);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*'; // Accept all file types
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      console.log('📁 Files selected:', files ? files.length : 0);
      
      if (files && files.length > 0) {
        try {
          // Create a labeled folder name based on source or timestamp
          const folderName = sourceName || `Desktop Upload ${new Date().toLocaleDateString()}`;
          const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
          
          console.log(`📂 Creating folder: "${folderName}" (ID: ${sanitizedFolderName})`);
          
          const newFiles: WalletFile[] = [];
          const fileRefs = [];

          console.log(`📤 Processing ${files.length} file(s) for folder: ${folderName}...`);

          const userId = getUserId();
          setIsUploading(true);
          
          const userDocRef = doc(db, 'users', userId);
          const walletRef = collection(userDocRef, 'wallet');
          const folderDocRef = doc(walletRef, sanitizedFolderName);

          // Upload files to Firebase Storage and save metadata to Firestore
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            console.log(`📄 Processing file ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
            
            try {
              // Upload file to Firebase Storage
              const storagePath = `users/${userId}/wallet/${sanitizedFolderName}/${file.name}`;
              const storageRef = ref(storage, storagePath);
              await uploadBytes(storageRef, file);
              const downloadURL = await getDownloadURL(storageRef);
              
              console.log(`✅ File uploaded to Storage: ${storagePath}`);
              
              // Create file data with Firebase URLs
            const fileData: WalletFile = {
              id: `${Date.now()}-${i}-${file.name}`,
              name: file.name,
              size: file.size,
              type: file.type || 'application/octet-stream',
              uploadDate: new Date().toISOString(),
                downloadURL: downloadURL,
                storagePath: storagePath,
              folder: sanitizedFolderName
            };
            
            newFiles.push(fileData);
            fileRefs.push({ 
              name: file.name, 
                url: downloadURL,
              size: file.size,
              type: file.type || 'application/octet-stream',
                storagePath: storagePath
              });
            } catch (storageError) {
              console.error(`❌ Error uploading ${file.name} to Storage:`, storageError);
              // Fallback to local file data if Storage upload fails
              const fileData: WalletFile = {
                id: `${Date.now()}-${i}-${file.name}`,
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                uploadDate: new Date().toISOString(),
                downloadURL: URL.createObjectURL(file),
                storagePath: `local/${sanitizedFolderName}/${file.name}`,
                folder: sanitizedFolderName
              };
              newFiles.push(fileData);
            }
          }

          // Save folder metadata to Firestore
          try {
            await setDoc(folderDocRef, {
              folderName: folderName,
              sanitizedFolderName: sanitizedFolderName,
              fileCount: newFiles.length,
              totalSize: newFiles.reduce((acc, f) => acc + f.size, 0),
              files: fileRefs,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
            
            console.log(`✅ Folder metadata saved to Firestore: ${sanitizedFolderName}`);
          } catch (firestoreError) {
            console.error('❌ Error saving to Firestore:', firestoreError);
          }

          // Save data source to Firestore
          try {
            const dataSourcesRef = collection(userDocRef, 'dataSources');
            await addDoc(dataSourcesRef, {
              name: `${folderName} (${files.length} files)`,
              icon: '📁',
              status: 'Active',
              lastSync: new Date().toISOString(),
              dataSize: `${files.length} file${files.length > 1 ? 's' : ''}`,
              folderName: sanitizedFolderName,
              createdAt: new Date().toISOString()
            });
            console.log(`✅ Data source saved to Firestore`);
          } catch (dataSourceError) {
            console.error('❌ Error saving data source to Firestore:', dataSourceError);
          }

          console.log('💾 Updating local state...');

          // Update local state
          setUploadedFiles(prev => [...newFiles, ...prev]);

          const newSource = { 
            name: `${folderName} (${files.length} files)`,
            icon: '📁',
            status: 'Active',
            lastSync: 'Just now',
            dataSize: `${files.length} file${files.length > 1 ? 's' : ''}`
          };

          setDataSources(prev => [newSource, ...prev]);
          
          setWalletFolders(prev => {
            if (!prev.includes(sanitizedFolderName)) {
              console.log(`📁 Adding new folder to wallet: ${sanitizedFolderName}`);
              return [...prev, sanitizedFolderName];
            }
            return prev;
          });

          // Add activity
          addActivity(`Data uploaded from ${folderName}`, 'upload', '📁', sanitizedFolderName);

          onClose();
          
          const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);
          const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
          
          // Enhanced success message with folder details
          const fileList = Array.from(files).map(f => `• ${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join('\n');
          
          setIsUploading(false);
          console.log('✅ Upload completed successfully!');
          alert(`🎉 UPLOAD SUCCESSFUL!\n\n📁 Folder: "${folderName}"\n📊 Files: ${files.length}\n💾 Total Size: ${sizeInMB} MB\n\n📋 File Details:\n${fileList}\n\n✅ Your files are now available in the Data Wallet!\n\nClick OK to view your files in the Data Wallet.`);
          
          setTimeout(() => {
            console.log(`🔍 Opening Data Wallet with folder: ${sanitizedFolderName}`);
            setSelectedWalletFolder(sanitizedFolderName);
            setShowDataWallet(true);
          }, 500);

        } catch (error) {
          setIsUploading(false);
          console.error('❌ Error during file upload:', error);
          alert(`❌ UPLOAD FAILED\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`);
        }
      } else {
        console.log('⚠️ No files selected');
      }
    };

    console.log('🖱️ Triggering file input click...');
    input.click();
  };

  // GitHub connection handler (real OAuth via popup, local only)
  const handleGitHubConnection = (onClose: () => void) => {
    if (!isAuthenticated || !currentUser) {
      alert('Please sign in to connect data sources.');
      return;
    }
    try {
      const popup = window.open('/api/auth/github/start', 'github-auth', 'width=600,height=720');
      if (!popup) {
        alert('Please allow popups to connect GitHub.');
        return;
      }
      const messageHandler = async (event: MessageEvent) => {
        if (!event.data || event.data.type !== 'github-auth-success') return;
        const { user, repos } = event.data.data || {};
        if (!repos || !Array.isArray(repos)) return;

      const folderName = 'GitHub Repositories';
      const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
      setIsConnecting(true);
      
      const userId = getUserId();
      const userDocRef = doc(db, 'users', userId);
      
        const newFiles: WalletFile[] = repos.map((repo: any) => ({
          id: `github-${repo.id}-${Date.now()}`,
          name: `${repo.name}.json`,
          size: Math.floor((repo.size || 100) * 1024),
          type: 'application/json',
          uploadDate: new Date().toISOString(),
          downloadURL: repo.html_url || undefined,
          storagePath: `github/${sanitizedFolderName}/${repo.name}.json`,
          folder: sanitizedFolderName
        }));

        // Save to Firestore
        try {
          const walletRef = collection(userDocRef, 'wallet');
          const folderDocRef = doc(walletRef, sanitizedFolderName);
          
          await setDoc(folderDocRef, {
            folderName: folderName,
            sanitizedFolderName: sanitizedFolderName,
            fileCount: newFiles.length,
            totalSize: newFiles.reduce((acc, f) => acc + f.size, 0),
            files: newFiles.map(f => ({
              name: f.name,
              url: f.downloadURL,
              size: f.size,
              type: f.type,
              storagePath: f.storagePath
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          const dataSourcesRef = collection(userDocRef, 'dataSources');
          await addDoc(dataSourcesRef, {
            name: `${folderName} (${newFiles.length} repos)`,
            icon: '🔗',
            status: 'Active',
            lastSync: new Date().toISOString(),
            dataSize: `${newFiles.length} repositories`,
            folderName: sanitizedFolderName,
            createdAt: new Date().toISOString()
          });
          
          console.log(`✅ GitHub data saved to Firestore`);
        } catch (firestoreError) {
          console.error('❌ Error saving GitHub data to Firestore:', firestoreError);
        } finally {
          setIsConnecting(false);
        }

      setUploadedFiles(prev => [...newFiles, ...prev]);
        setDataSources(prev => [
          {
            name: `${folderName} (${newFiles.length} repos)`,
        icon: '🔗',
        status: 'Active',
        lastSync: 'Just now',
            dataSize: `${newFiles.length} repositories`
          },
          ...prev
        ]);
        setWalletFolders(prev => (prev.includes(sanitizedFolderName) ? prev : [...prev, sanitizedFolderName]));

        // Add activity
        addActivity(`GitHub connected (${newFiles.length} repos)`, 'connection', '🔗', 'github_repositories');

        window.removeEventListener('message', messageHandler);
        onClose();

        setTimeout(() => {
          setSelectedWalletFolder(sanitizedFolderName);
          setShowDataWallet(true);
        }, 300);
      };
      window.addEventListener('message', messageHandler);
    } catch (error) {
      console.error('❌ Error during GitHub connection:', error);
      alert(`❌ GITHUB CONNECTION FAILED\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`);
    }
  };

  // Twitter/X connection handler (real OAuth via popup, local only)
  const handleTwitterConnection = (onClose: () => void) => {
    if (!isAuthenticated || !currentUser) {
      alert('Please sign in to connect data sources.');
      return;
    }
    try {
      const popup = window.open('/api/auth/twitter/start', 'twitter-auth', 'width=600,height=720');
      if (!popup) {
        alert('Please allow popups to connect Twitter/X.');
        return;
      }
      const messageHandler = async (event: MessageEvent) => {
        if (!event.data || event.data.type !== 'twitter-auth-success') return;
        const { user, tweets } = event.data.data || {};
        if (!user) return;

        const folderName = 'Twitter/X Data';
        const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
        setIsConnecting(true);
        
        const userId = getUserId();
        const userDocRef = doc(db, 'users', userId);

        const newFiles: WalletFile[] = [];

        // Create user profile file
        newFiles.push({
          id: `twitter-user-${user.id}-${Date.now()}`,
          name: `${user.username}_profile.json`,
          size: JSON.stringify(user).length,
          type: 'application/json',
          uploadDate: new Date().toISOString(),
          downloadURL: `https://twitter.com/${user.username}`,
          storagePath: `twitter/${sanitizedFolderName}/${user.username}_profile.json`,
          folder: sanitizedFolderName
        });

        // Create tweets file if available
        if (tweets && Array.isArray(tweets) && tweets.length > 0) {
          newFiles.push({
            id: `twitter-tweets-${user.id}-${Date.now()}`,
            name: `${user.username}_tweets.json`,
            size: JSON.stringify(tweets).length,
            type: 'application/json',
            uploadDate: new Date().toISOString(),
            downloadURL: `https://twitter.com/${user.username}`,
            storagePath: `twitter/${sanitizedFolderName}/${user.username}_tweets.json`,
            folder: sanitizedFolderName
          });
        }

        // Save to Firestore
        try {
          const walletRef = collection(userDocRef, 'wallet');
          const folderDocRef = doc(walletRef, sanitizedFolderName);
          
          await setDoc(folderDocRef, {
            folderName: folderName,
            sanitizedFolderName: sanitizedFolderName,
            fileCount: newFiles.length,
            totalSize: newFiles.reduce((acc, f) => acc + f.size, 0),
            files: newFiles.map(f => ({
              name: f.name,
              url: f.downloadURL,
              size: f.size,
              type: f.type,
              storagePath: f.storagePath,
              data: f.name.includes('profile') ? user : (f.name.includes('tweets') ? tweets : null)
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          const dataSourcesRef = collection(userDocRef, 'dataSources');
          await addDoc(dataSourcesRef, {
            name: `${folderName} (@${user.username})`,
            icon: '🐦',
            status: 'Active',
            lastSync: new Date().toISOString(),
            dataSize: `${newFiles.length} files`,
            folderName: sanitizedFolderName,
            createdAt: new Date().toISOString()
          });
          
          console.log(`✅ Twitter data saved to Firestore`);
        } catch (firestoreError) {
          console.error('❌ Error saving Twitter data to Firestore:', firestoreError);
        } finally {
          setIsConnecting(false);
        }

        setUploadedFiles(prev => [...newFiles, ...prev]);
        setDataSources(prev => [
          {
            name: `${folderName} (@${user.username})`,
            icon: '🐦',
            status: 'Active',
            lastSync: 'Just now',
            dataSize: `${newFiles.length} files`
          },
          ...prev
        ]);
        setWalletFolders(prev => (prev.includes(sanitizedFolderName) ? prev : [...prev, sanitizedFolderName]));

        // Add activity
        addActivity(`Twitter/X connected (@${user.username})`, 'connection', '🐦', 'twitter_x_data');

        window.removeEventListener('message', messageHandler);
        onClose();
      
      setTimeout(() => {
        setSelectedWalletFolder(sanitizedFolderName);
        setShowDataWallet(true);
        }, 300);
      };
      window.addEventListener('message', messageHandler);
    } catch (error) {
      console.error('❌ Error during Twitter connection:', error);
      alert(`❌ TWITTER CONNECTION FAILED\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`);
    }
  };

  const sourceOptions = [
    { 
      name: 'Upload Files', 
      icon: '📁', 
      description: 'Upload any file type (CSV, PDF, images, etc.)',
      onClick: (onClose: () => void) => handleFileUpload(onClose, 'Desktop Files')
    },
    { 
      name: 'GitHub', 
      icon: '🔗', 
      description: 'Connect your GitHub repositories',
      onClick: (onClose: () => void) => handleGitHubConnection(onClose)
    },
    { 
      name: 'API Connection', 
      icon: '🔌', 
      description: 'Connect via REST API',
      onClick: async (onClose: () => void) => {
        if (!isAuthenticated || !currentUser) {
          alert('Please sign in to connect data sources.');
          return;
        }
        const newSource = { 
          name: 'API Connection',
          icon: '🔌',
          status: 'Active',
          lastSync: 'Just now',
          dataSize: 'Real-time'
        };
        
        // Save to Firestore
        try {
          const userId = getUserId();
          const userDocRef = doc(db, 'users', userId);
          const dataSourcesRef = collection(userDocRef, 'dataSources');
          await addDoc(dataSourcesRef, {
            name: 'API Connection',
            icon: '🔌',
            status: 'Active',
            lastSync: new Date().toISOString(),
            dataSize: 'Real-time',
            createdAt: new Date().toISOString()
          });
          console.log(`✅ API Connection saved to Firestore`);
        } catch (firestoreError) {
          console.error('❌ Error saving API Connection to Firestore:', firestoreError);
        }
        
        setDataSources(prev => [newSource, ...prev]);
        
        // Add activity
        addActivity('API connection established', 'connection', '🔌');
        
        onClose();
        alert('API connection established!');
      }
    },
    { 
      name: 'Twitter/X', 
      icon: '🐦', 
      description: 'Connect your Twitter/X account',
      onClick: (onClose: () => void) => handleTwitterConnection(onClose)
    },
    { 
      name: 'LinkedIn', 
      icon: '💼', 
      description: 'Connect your LinkedIn profile',
      onClick: async (onClose: () => void) => {
        if (!isAuthenticated || !currentUser) {
          alert('Please sign in to connect data sources.');
          return;
        }
        const newSource = { 
          name: 'LinkedIn',
          icon: '💼',
          status: 'Active',
          lastSync: 'Just now',
          dataSize: 'Professional data'
        };
        
        // Save to Firestore
        try {
          const userId = getUserId();
          const userDocRef = doc(db, 'users', userId);
          const dataSourcesRef = collection(userDocRef, 'dataSources');
          await addDoc(dataSourcesRef, {
            name: 'LinkedIn',
            icon: '💼',
            status: 'Active',
            lastSync: new Date().toISOString(),
            dataSize: 'Professional data',
            createdAt: new Date().toISOString()
          });
          console.log(`✅ LinkedIn connection saved to Firestore`);
        } catch (firestoreError) {
          console.error('❌ Error saving LinkedIn connection to Firestore:', firestoreError);
        }
        
        setDataSources(prev => [newSource, ...prev]);
        
        // Add activity
        addActivity('LinkedIn connection established', 'connection', '💼');
        
        onClose();
        alert('LinkedIn connection established!');
      }
    }
  ];

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '8px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0', fontSize: '14px', fontWeight: '500' }}>{`$${payload[0].value}`}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{label}</p>
        </div>
      );
    }
    return null;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleViewWallet = (folder?: string) => {
    setSelectedWalletFolder(folder || null);
    setShowDataWallet(true);
  };

  // Google Sign-in handler
  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 Google sign-in initiated...');
      setIsLoading(true);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('✅ Google sign-in successful!', user.uid);
      setIsAuthenticated(true);
      setCurrentUser(user);
      setIsLoading(false);
      
      // Show success message
      alert('🎉 Welcome to Datta Studio!\n\nYou have successfully signed in with Google.\n\nYour dashboard is now ready to use.');
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      setIsLoading(false);
      
      if (error.code === 'auth/popup-closed-by-user') {
        alert('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('Popup was blocked. Please allow popups for this site and try again.');
      } else {
        alert(`Sign-in failed: ${error.message || 'Unknown error'}\n\nPlease try again.`);
      }
    }
  };

  // Google Sign-in Modal Component
  const GoogleSignInModal = () => {
    if (isAuthenticated) return null;
    
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div
          style={{
            backgroundColor: currentTheme.cardBg,
            borderRadius: '20px',
            padding: '48px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${currentTheme.borderLight}`
          }}
        >
          {/* Logo */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
          }}>
            D
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: currentTheme.text,
            margin: '0 0 8px 0'
          }}>
            Welcome to Datta Studio
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: currentTheme.textSecondary,
            margin: '0 0 32px 0',
            lineHeight: '1.5'
          }}>
            Sign in to access your data intelligence platform and manage your data sources.
          </p>

          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: isLoading ? '#f5f5f5' : 'white',
              color: isLoading ? '#9ca3af' : '#4285f4',
              border: '1px solid #dadce0',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                Signing in...
              </>
            ) : (
              <>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
              </>
            )}
          </button>

          {/* Footer */}
          <p style={{
            fontSize: '12px',
            color: currentTheme.textSecondary,
            margin: '24px 0 0 0',
            lineHeight: '1.4'
          }}>
            By signing in, you agree to our{' '}
            <a href="#" style={{ color: '#4285f4', textDecoration: 'none' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#4285f4', textDecoration: 'none' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    );
  };

  // Source Picker Modal Component
  const SourcePickerModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    if (!open) return null;
    
    return (
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: currentTheme.cardBg,
            color: currentTheme.text,
            borderRadius: 16,
            minWidth: 400,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            padding: 32,
            position: 'relative',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              color: currentTheme.textSecondary,
              fontSize: 24,
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = currentTheme.text}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = currentTheme.textSecondary}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
          
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: 24, 
            fontSize: 24, 
            fontWeight: 700,
            color: currentTheme.text 
          }}>
            Add Data Source
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sourceOptions.map((option, index) => (
              <button
                key={option.name}
                onClick={() => option.onClick(onClose)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  width: '100%',
                  background: isDarkMode ? '#232946' : '#f8fafc',
                  color: currentTheme.text,
                  border: `1px solid ${currentTheme.borderLight}`,
                  borderRadius: 12,
                  padding: '16px 20px',
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = isDarkMode ? '#312e81' : '#e0e7ff';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = isDarkMode ? '#232946' : '#f8fafc';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = currentTheme.borderLight;
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: 24,
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? '#1e293b' : 'white',
                  borderRadius: 8,
                  border: `1px solid ${currentTheme.borderLight}`
                }}>
                  {option.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{option.name}</div>
                  <div style={{ fontSize: 14, color: currentTheme.textSecondary, lineHeight: 1.4 }}>
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {uploadedFiles.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${currentTheme.borderLight}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: currentTheme.text }}>
                Recently Uploaded ({uploadedFiles.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 120, overflowY: 'auto' }}>
                {uploadedFiles.slice(0, 3).map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      backgroundColor: currentTheme.activityBg,
                      borderRadius: 8,
                      fontSize: 13
                    }}
                  >
                    <File style={{ width: 16, height: 16, color: currentTheme.textSecondary }} />
                    <span style={{ flex: 1, fontWeight: 500 }}>{file.name}</span>
                    <span style={{ color: currentTheme.textSecondary }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate stats from Firestore data
  const [statsFromFirestore, setStatsFromFirestore] = useState({
    totalUploadedBytes: 0,
    totalFiles: 0,
    totalFolders: 0,
    totalDataSources: 0
  });

  useEffect(() => {
    const calculateStatsFromFirestore = async () => {
      if (!isAuthenticated || !currentUser) return;
      try {
        const userId = getUserId();
        const userDocRef = doc(db, 'users', userId);
        
        // Calculate from wallet collection
        const walletRef = collection(userDocRef, 'wallet');
        const walletSnapshot = await getDocs(walletRef);
        
        let totalBytes = 0;
        let totalFiles = 0;
        let totalFolders = 0;
        
        walletSnapshot.forEach(folderDoc => {
          const folderData = folderDoc.data();
          totalFolders++;
          
          // Use totalSize if available, otherwise calculate from files array
          if (folderData.totalSize) {
            totalBytes += folderData.totalSize;
            totalFiles += folderData.fileCount || 0;
          } else if (folderData.files && Array.isArray(folderData.files)) {
            folderData.files.forEach((file: any) => {
              totalFiles++;
              totalBytes += file.size || 0;
            });
          }
        });
        
        // Get data sources count
        const dataSourcesRef = collection(userDocRef, 'dataSources');
        const dataSourcesSnapshot = await getDocs(dataSourcesRef);
        const totalDataSources = dataSourcesSnapshot.size;
        
        setStatsFromFirestore({
          totalUploadedBytes: totalBytes,
          totalFiles: totalFiles,
          totalFolders: totalFolders,
          totalDataSources: totalDataSources
        });
        
        console.log(`✅ Stats calculated from Firestore:`, {
          totalBytes: formatBytes(totalBytes),
          totalFiles,
          totalFolders,
          totalDataSources
        });
      } catch (error) {
        console.error('❌ Error calculating stats from Firestore:', error);
      }
    };

    if (isAuthenticated && currentUser) {
      calculateStatsFromFirestore();
    }
  }, [isAuthenticated, currentUser, uploadedFiles, dataSources, walletFolders]);

  // Calculate total uploaded bytes - use Firestore stats if available, otherwise use local state
  const totalUploadedBytes = statsFromFirestore.totalUploadedBytes > 0 
    ? statsFromFirestore.totalUploadedBytes 
    : uploadedFiles.reduce((acc, file) => acc + (file.size || 0), 0);

  return (
    <>
      {/* Google Sign-in Modal */}
      <GoogleSignInModal />
      
      <div style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: currentTheme.bg,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          transition: 'background-color 0.3s ease'
        }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        backgroundColor: currentTheme.sidebarBg,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        borderRight: `1px solid ${currentTheme.border}`,
        transition: 'all 0.3s ease',
        display: isMobile ? 'none' : 'block'
      }}>
        <div style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: `1px solid ${currentTheme.borderLight}`
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}>
            D
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '18px', color: currentTheme.text }}>DATTA STUDIO</div>
            <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>Data Intelligence Platform</div>
          </div>
        </div>
       
        <nav style={{ marginTop: '24px', padding: '0 16px' }}>
          {sidebarItems.map((item, index) => {
            const isActive = (item.label === 'Dashboard' && activeView === 'dashboard') || 
                           (item.label === 'Annotation Services' && activeView === 'annotations');
            
            return (
            <a
              key={index}
              href="#"
              onMouseEnter={() => setHoveredSidebar(index)}
              onMouseLeave={() => setHoveredSidebar(null)}
              onClick={(e) => {
                  e.preventDefault();
                  if (item.label === 'Annotation Services') {
                    setActiveView('annotations');
                  } else if (item.label === 'Dashboard') {
                    setActiveView('dashboard');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                borderRadius: '12px',
                margin: '4px 0',
                transition: 'all 0.2s ease',
                  color: isActive
                  ? '#3b82f6'
                  : hoveredSidebar === index
                  ? isDarkMode
                    ? '#a5b4fc'
                    : '#1e40af'
                  : currentTheme.textSecondary,
                  backgroundColor: isActive
                  ? (isDarkMode ? '#1e40af20' : '#eff6ff')
                  : hoveredSidebar === index
                  ? isDarkMode ? '#312e81' : '#e0e7ff'
                  : 'transparent',
                  boxShadow: isActive
                  ? '0 2px 4px rgba(59, 130, 246, 0.1)'
                  : hoveredSidebar === index
                  ? '0 2px 8px rgba(59, 130, 246, 0.08)'
                  : undefined,
                  transform: isActive
                  ? 'translateX(4px)'
                  : hoveredSidebar === index
                  ? 'translateX(2px)'
                  : undefined,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <item.icon style={{ width: '20px', height: '20px' }} />
                {item.label}
              </div>
              {item.badge && (
                <span style={{
                  backgroundColor: item.badge === 'New' ? '#f59e0b' : '#3b82f6',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: '600'
                }}>
                  {item.badge}
                </span>
              )}
            </a>
            );
          })}
        </nav>

        {/* Pro Plan Upgrade Section */}
        <div
          style={{
            margin: '32px 16px 0 16px',
            padding: '20px',
            background: isDarkMode
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            borderRadius: '14px',
            color: '#fff',
            textAlign: 'center',
            boxShadow: isDarkMode
              ? '0 4px 16px rgba(102,126,234,0.15)'
              : '0 4px 16px rgba(59,130,246,0.15)'
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '16px', display: 'block', marginBottom: '8px' }}>
            Upgrade to Pro
          </span>
          <span style={{ fontSize: '13px', opacity: 0.95, display: 'block', marginBottom: '16px' }}>
            Unlock advanced analytics, priority support, and more.
          </span>
          <button
            style={{
              background: '#fff',
              color: isDarkMode ? '#667eea' : '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Upgrade Now
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: '60px' }}>
        {activeView === 'annotations' ? (
          <AnnotationDashboard isDarkMode={isDarkMode} onBack={() => setActiveView('dashboard')} />
        ) : (
          <>
        {/* Header */}
        <header style={{
          backgroundColor: currentTheme.cardBg,
          borderBottom: `1px solid ${currentTheme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 16px' : '16px 32px',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: currentTheme.text, margin: 0 }}>
              Dashboard
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {['1M', '3M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedTimeframe(period)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selectedTimeframe === period ? '#3b82f6' : currentTheme.activityBg,
                    color: selectedTimeframe === period ? 'white' : currentTheme.textSecondary
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
         
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: currentTheme.textSecondary
              }} />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: currentTheme.searchBg,
                  width: '200px',
                  color: currentTheme.text
                }}
              />
            </div>

            <button onClick={toggleTheme} style={{
              padding: '8px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border}`,
              backgroundColor: currentTheme.cardBg,
              cursor: 'pointer'
            }}>
              {isDarkMode ? (
                <Sun style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
              ) : (
                <Moon style={{ width: '18px', height: '18px', color: currentTheme.textSecondary }} />
              )}
            </button>
           
            <div style={{ position: 'relative' }}>
              <Bell style={{ width: '20px', height: '20px', color: currentTheme.textSecondary, cursor: 'pointer' }} />
              {notifications > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 5px',
                  borderRadius: '10px'
                }}>
                  {notifications}
                </span>
              )}
            </div>
           
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: currentTheme.text }}>John Doe</div>
                <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>Premium Member</div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <User style={{ width: '18px', height: '18px', color: 'white' }} />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main style={{ padding: isMobile ? '20px' : '32px' }}>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {[
              { 
                label: 'Data Uploaded', 
                value: formatBytes(totalUploadedBytes), 
                icon: Database, 
                color: '#3b82f6', 
                trend: statsFromFirestore.totalFiles > 0 ? `+${statsFromFirestore.totalFiles}` : (uploadedFiles.length > 0 ? `+${uploadedFiles.length}` : '') 
              },
              { 
                label: 'Active Sources', 
                value: statsFromFirestore.totalDataSources > 0 ? statsFromFirestore.totalDataSources.toString() : dataSources.length.toString(), 
                icon: Activity, 
                color: '#10b981', 
                trend: statsFromFirestore.totalDataSources > 0 ? `+${statsFromFirestore.totalDataSources}` : `+${dataSources.length}` 
              },
              { label: 'Total Earnings', value: '$2,300', icon: DollarSign, color: '#f59e0b', trend: '+15%' },
              { label: 'Companies', value: '8', icon: TrendingUp, color: '#8b5cf6', trend: '+1' },
              {
                label: 'Data Wallet',
                value: statsFromFirestore.totalFolders > 0 
                  ? `${statsFromFirestore.totalFolders} folders` 
                  : `${walletFolders.length} folders`,
                icon: Folder,
                color: '#6366f1',
                trend: statsFromFirestore.totalFolders > 0 
                  ? `+${statsFromFirestore.totalFolders}` 
                  : `+${walletFolders.length}`
              }
            ].map((stat, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => stat.label === 'Data Wallet' && handleViewWallet()}
                style={{
                  backgroundColor: currentTheme.cardBg,
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: hoveredCard === index ? '0 8px 25px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${currentTheme.borderLight}`,
                  transition: 'all 0.3s ease',
                  transform: hoveredCard === index ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                  cursor: stat.label === 'Data Wallet' ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: stat.color,
                    backgroundColor: `${stat.color}15`,
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    {stat.trend}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: currentTheme.textSecondary, marginBottom: '8px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: currentTheme.text }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Insert Data Upload Card here */}
          {/* <DataUploadCard /> */}

          {/* Main Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
            gap: isMobile ? '20px' : '32px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Earnings Chart */}
              <div style={{
                backgroundColor: currentTheme.cardBg,
                padding: '32px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: `1px solid ${currentTheme.borderLight}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: currentTheme.text, margin: 0 }}>
                    Earnings Overview
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap style={{ width: '16px', height: '16px', color: '#10b981' }} />
                    <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
                      +15% this month
                    </span>
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={earningsData}>
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: currentTheme.textSecondary }}
                      />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, fill: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Sources */}
              <div style={{
                backgroundColor: currentTheme.cardBg,
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: `1px solid ${currentTheme.borderLight}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: currentTheme.text, margin: 0 }}>
                    Data Sources
                  </h2>
                  <button
                    disabled={isConnecting}
                    style={{
                      backgroundColor: isConnecting ? '#9ca3af' : (hoveredButton === 'add-source' ? '#2563eb' : '#3b82f6'),
                      color: 'white',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: isConnecting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      opacity: isConnecting ? 0.7 : 1
                    }}
                    onMouseEnter={() => !isConnecting && setHoveredButton('add-source')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => {
                      if (isConnecting) return;
                      setShowAddSourceModal(true);
                    }}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        <style>{`
                          @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                          }
                        `}</style>
                        Connecting...
                      </>
                    ) : (
                      <>
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Add Source
                      </>
                    )}
                  </button>
                </div>
               
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dataSources.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: currentTheme.textSecondary,
                      fontSize: '14px'
                    }}>
                      <Upload style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
                      <p>No data sources connected yet.</p>
                      <p>Click "Add Source" to get started!</p>
                    </div>
                  ) : (
                    dataSources.map((source, index) => (
                      <div
                        key={index}
                        onMouseEnter={() => setHoveredDataSource(index)}
                        onMouseLeave={() => setHoveredDataSource(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          borderRadius: '12px',
                          backgroundColor: hoveredDataSource === index
                            ? isDarkMode ? '#312e81' : '#e0e7ff'
                            : currentTheme.activityBg,
                          border: `1px solid ${currentTheme.borderLight}`,
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>{source.icon}</span>
                          <div>
                            <div style={{ fontWeight: '500', color: currentTheme.text }}>{source.name}</div>
                            <div style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                              {source.dataSize} • Last sync: {source.lastSync}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#10b981',
                          backgroundColor: '#d1fae5',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}>
                          {source.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Data Sources Note */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px 20px',
                  backgroundColor: isDarkMode ? '#4f46e520' : '#fff7ed',
                  borderRadius: '10px',
                  border: `1px solid ${isDarkMode ? '#6366f1' : '#f59e0b'}`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  fontSize: '13px',
                  color: isDarkMode ? '#e5e7eb' : '#7c2d12',
                  lineHeight: '1.6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: isDarkMode ? '#312e81' : '#ffedd5',
                    color: isDarkMode ? '#c7d2fe' : '#f59e0b',
                    fontWeight: 700
                  }}>⚠️</span>
                  <span>
                    <span style={{ fontWeight: 700 }}>Note:</span> Your data or content is permission-based and monetized only when licensed by AI companies.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Quick Upload Card */}
              <div style={{
                backgroundColor: currentTheme.cardBg,
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: `1px solid ${currentTheme.borderLight}`,
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                  : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: currentTheme.text }}>
                  Quick Upload
                </h2>
                <p style={{ marginBottom: '20px', color: currentTheme.textSecondary, fontSize: '14px' }}>
                  Drag and drop files or click to upload any file type
                </p>
                <button
                  style={{
                    width: '100%',
                    backgroundColor: isUploading ? '#9ca3af' : (hoveredButton === 'quick-upload' ? '#2563eb' : '#3b82f6'),
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    opacity: isUploading ? 0.7 : 1
                  }}
                  disabled={isUploading}
                  onMouseEnter={() => !isUploading && setHoveredButton('quick-upload')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => {
                    if (isUploading) return;
                    console.log('🧪 Testing file upload...');
                    handleFileUpload(() => {}, 'Quick Upload');
                  }}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                      <style>{`
                        @keyframes spin {
                          from { transform: rotate(0deg); }
                          to { transform: rotate(360deg); }
                        }
                      `}</style>
                      Uploading...
                    </>
                  ) : (
                    <>
                  <Upload style={{ width: '18px', height: '18px' }} />
                      Upload Files
                    </>
                  )}
                </button>
              </div>

              {/* Recent Activity */}
              <div style={{
                backgroundColor: currentTheme.cardBg,
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: `1px solid ${currentTheme.borderLight}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: currentTheme.text, margin: 0 }}>
                    Recent Activity
                  </h2>
                  <RefreshCw
                    style={{
                      width: '20px',
                      height: '20px',
                      color: hoveredButton === 'refresh' ? '#3b82f6' : currentTheme.textSecondary,
                      cursor: 'pointer',
                      transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                      transition: 'transform 0.5s ease, color 0.2s'
                    }}
                    onClick={handleRefresh}
                    onMouseEnter={() => setHoveredButton('refresh')}
                    onMouseLeave={() => setHoveredButton(null)}
                  />
                </div>
               
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredActivity(index)}
                      onMouseLeave={() => setHoveredActivity(null)}
                      onClick={() => handleActivityClick(activity)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: hoveredActivity === index
                          ? isDarkMode ? '#312e81' : '#e0e7ff'
                          : currentTheme.activityBg,
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: currentTheme.cardBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        border: `1px solid ${currentTheme.border}`
                      }}>
                        {activity.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          margin: '0 0 4px 0',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: currentTheme.text
                        }}>
                          {activity.action}
                        </p>
                        <span style={{ fontSize: '12px', color: currentTheme.textSecondary }}>
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
          </>
        )}
        
        {/* Footer */}
        {activeView === 'dashboard' && (
          <footer style={{
            background: isDarkMode 
              ? 'linear-gradient(to bottom, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
              : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 1))',
            borderTop: isDarkMode 
              ? `2px solid rgba(102, 126, 234, 0.3)`
              : `2px solid rgba(102, 126, 234, 0.2)`,
            padding: isMobile ? '40px 20px 28px' : '56px 32px 40px',
            marginTop: '64px',
            position: 'relative',
            boxShadow: isDarkMode 
              ? '0 -4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 -4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          }}>
            {/* Decorative gradient overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: isDarkMode
                ? 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent)',
              opacity: 0.6
            }}></div>
            
            <div style={{
              maxWidth: '1400px',
              margin: '0 auto',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Main Footer Content */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                gap: isMobile ? '32px' : '48px',
                marginBottom: isMobile ? '32px' : '40px'
              }}>
                {/* Brand Section */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        inset: '-2px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '14px',
                        opacity: 0.3,
                        filter: 'blur(8px)',
                        zIndex: -1
                      }}></div>
                      D
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '700',
                        fontSize: '18px',
                        color: currentTheme.text
                      }}>
                        DATTA STUDIO
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: currentTheme.textSecondary
                      }}>
                        Data Intelligence Platform
                      </div>
                    </div>
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: currentTheme.textSecondary,
                    lineHeight: '1.6',
                    margin: 0,
                    maxWidth: '280px'
                  }}>
                    The YouTube of AI training data - collect, manage and monetize the data that powers tomorrow's intelligence.
                  </p>
                  {/* Social Links */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px'
                  }}>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                        border: `1.5px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: currentTheme.textSecondary,
                        textDecoration: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#667eea';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)';
                        e.currentTarget.style.color = currentTheme.textSecondary;
                        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <Github style={{ width: '18px', height: '18px' }} />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                        border: `1.5px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: currentTheme.textSecondary,
                        textDecoration: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#667eea';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)';
                        e.currentTarget.style.color = currentTheme.textSecondary;
                        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <Twitter style={{ width: '18px', height: '18px' }} />
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                        border: `1.5px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: currentTheme.textSecondary,
                        textDecoration: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#667eea';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)';
                        e.currentTarget.style.color = currentTheme.textSecondary;
                        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <Linkedin style={{ width: '18px', height: '18px' }} />
                    </a>
                    <a
                      href="mailto:support@dattastudio.com"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)',
                        border: `1.5px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: currentTheme.textSecondary,
                        textDecoration: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#667eea';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.08)';
                        e.currentTarget.style.color = currentTheme.textSecondary;
                        e.currentTarget.style.borderColor = isDarkMode ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <Mail style={{ width: '18px', height: '18px' }} />
                    </a>
                  </div>
                </div>

                {/* Product Links */}
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: currentTheme.text,
                    margin: '0 0 20px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      width: '4px',
                      height: '16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '2px'
                    }}></span>
                    Product
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {['Features', 'Pricing', 'API Documentation', 'Data Sources', 'Annotation Services'].map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          style={{
                            fontSize: '14px',
                            color: currentTheme.textSecondary,
                            textDecoration: 'none',
                            transition: 'color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#667eea';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = currentTheme.textSecondary;
                          }}
                        >
                          {link}
                          <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Company Links */}
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: currentTheme.text,
                    margin: '0 0 20px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      width: '4px',
                      height: '16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '2px'
                    }}></span>
                    Company
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {['About Us', 'Blog', 'Careers', 'Contact', 'Partners'].map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          style={{
                            fontSize: '14px',
                            color: currentTheme.textSecondary,
                            textDecoration: 'none',
                            transition: 'color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#667eea';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = currentTheme.textSecondary;
                          }}
                        >
                          {link}
                          <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Support & Legal */}
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: currentTheme.text,
                    margin: '0 0 20px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      width: '4px',
                      height: '16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '2px'
                    }}></span>
                    Support & Legal
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {['Help Center', 'Documentation', 'Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          style={{
                            fontSize: '14px',
                            color: currentTheme.textSecondary,
                            textDecoration: 'none',
                            transition: 'color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#667eea';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = currentTheme.textSecondary;
                          }}
                        >
                          {link}
                          <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div style={{
                paddingTop: isMobile ? '32px' : '40px',
                borderTop: isDarkMode 
                  ? `1px solid rgba(102, 126, 234, 0.2)`
                  : `1px solid rgba(102, 126, 234, 0.15)`,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: isMobile ? '20px' : '0',
                background: isDarkMode 
                  ? 'linear-gradient(to right, rgba(102, 126, 234, 0.05), transparent, rgba(102, 126, 234, 0.05))'
                  : 'linear-gradient(to right, rgba(102, 126, 234, 0.03), transparent, rgba(102, 126, 234, 0.03))',
                borderRadius: '12px',
                paddingLeft: isMobile ? '16px' : '24px',
                paddingRight: isMobile ? '16px' : '24px',
                paddingBottom: isMobile ? '24px' : '32px',
                marginTop: '8px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: currentTheme.text,
                  fontWeight: '500'
                }}>
                  © {new Date().getFullYear()} Datta Studio. All rights reserved.
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: isMobile ? '16px' : '28px',
                  fontSize: '13px',
                  color: currentTheme.textSecondary,
                  alignItems: 'center'
                }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '20px',
                    border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`
                  }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'inline-block',
                      animation: 'pulse 2s infinite',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                    }}></span>
                    <style>{`
                      @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.1); }
                      }
                    `}</style>
                    <span style={{ 
                      color: '#10b981',
                      fontWeight: '500',
                      fontSize: '13px'
                    }}>All systems operational</span>
                  </span>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '20px',
                    border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
                  }}>
                    Made with <span style={{ 
                      color: '#ef4444',
                      fontSize: '16px',
                      animation: 'heartbeat 1.5s infinite'
                    }}>♥</span>
                    <style>{`
                      @keyframes heartbeat {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                      }
                    `}</style>
                    <span style={{ 
                      color: currentTheme.textSecondary,
                      marginLeft: '4px'
                    }}>for AI</span>
                  </span>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Modal */}
      <SourcePickerModal
        open={showAddSourceModal}
        onClose={() => setShowAddSourceModal(false)}
      />

      {/* Data Wallet Modal */}
      <DataWallet
        isOpen={showDataWallet}
        onClose={() => setShowDataWallet(false)}
        isDarkMode={isDarkMode}
        initialFolder={selectedWalletFolder}
        uploadedFiles={uploadedFiles as any as WalletFile[]}
        userId={getUserId()}
      />
        </div>
    </>
  );
};

export default EnhancedDashboard;

// Helper function to format bytes as human-readable string
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}