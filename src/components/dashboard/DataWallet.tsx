// src/components/dashboard/DataWallet.tsx
'use client'

import React, { useState, useEffect } from 'react';
import {
  Search, Folder, Plus, X, Grid, List, ArrowLeft,
  Eye, Download, Trash2, Image, Video, Music, FileText, Archive, Code, File
} from 'lucide-react';
import { getDocs, collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { getTheme } from '../shared/theme';

// Helper function to ensure db is initialized
function ensureDb() {
  if (!db) throw new Error('Database not initialized');
  return db as any;
}

// Helper function to ensure storage is initialized
function ensureStorage() {
  if (!storage) throw new Error('Storage not initialized');
  return storage as any;
}

interface WalletFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  folder: string;
  downloadURL?: string;
  storagePath?: string;
}

interface WalletFolder {
  name: string;
  fileCount: number;
  totalSize: number;
  lastModified: string;
}

interface DataWalletProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  initialFolder?: string | null;
  uploadedFiles?: WalletFile[];
  userId?: string;
}

export const DataWallet: React.FC<DataWalletProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  initialFolder,
  uploadedFiles = [],
  userId
}) => {
  const theme = getTheme(isDarkMode);
  const [currentFolder, setCurrentFolder] = useState<string | null>(initialFolder || null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [folders, setFolders] = useState<WalletFolder[]>([]);
  const [files, setFiles] = useState<WalletFile[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Fetch wallet data from Firestore and local state
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        console.log('📂 Fetching wallet data...');
        
        // Get local uploaded files
        const localFiles = uploadedFiles || [];
        console.log('📂 Local files found:', localFiles.length);

        // Group by folder
        const localFolders: { [key: string]: WalletFile[] } = {};
        localFiles.forEach(file => {
          if (!localFolders[file.folder]) localFolders[file.folder] = [];
          localFolders[file.folder].push(file);
        });

        // Create folder data
        const localFoldersData: WalletFolder[] = Object.entries(localFolders).map(([folderName, files]) => ({
          name: folderName,
          fileCount: files.length,
          totalSize: files.reduce((acc, f) => acc + f.size, 0),
          lastModified: files.reduce((latest, f) => f.uploadDate > latest ? f.uploadDate : latest, files[0].uploadDate)
        }));

        let firebaseFolders: WalletFolder[] = [];
        let firebaseFiles: WalletFile[] = [];

        // FIXED: Only fetch Firestore if userId exists
        if (userId) {
          try {
            const userDocRef = doc(ensureDb(), 'users', userId);
            const walletRef = collection(userDocRef, 'wallet');
            const walletSnapshot = await getDocs(walletRef);

            if (!walletSnapshot.empty) {
              walletSnapshot.forEach((folderDoc) => {
                const folderData = folderDoc.data();
                const folderName = folderData.sanitizedFolderName || folderDoc.id;

                firebaseFolders.push({
                  name: folderName,
                  fileCount: folderData.fileCount || 0,
                  totalSize: folderData.totalSize || 0,
                  lastModified: folderData.updatedAt || folderData.createdAt || new Date().toISOString()
                });

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
                      storagePath: file.storagePath
                    });
                  });
                }
              });
            }
          } catch (error) {
            console.error('❌ Firestore error:', error);
          }
        }

        const allFolders = [...localFoldersData, ...firebaseFolders];
        const allFiles = [...localFiles, ...firebaseFiles];

        console.log('✅ Final data:', { folders: allFolders.length, files: allFiles.length });
        setFolders(allFolders);
        setFiles(allFiles);
      } catch (error) {
        console.error('❌ Error fetching wallet data:', error);
        setFolders([]);
        setFiles([]);
      }
    };

    if (isOpen) fetchWalletData();
  }, [isOpen, userId]);

  useEffect(() => {
    if (initialFolder) setCurrentFolder(initialFolder);
  }, [initialFolder]);

  // FIXED: Require userId for folder operations
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    if (!userId) {
      alert('Please sign in to create folders');
      return;
    }

    try {
      const sanitizedName = newFolderName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');

      if (folders.some(f => f.name === sanitizedName)) {
        alert('Folder already exists');
        return;
      }

      const userDocRef = doc(ensureDb(), 'users', userId);
      const folderDocRef = doc(collection(userDocRef, 'wallet'), sanitizedName);

      await setDoc(folderDocRef, {
        folderName: newFolderName.trim(),
        sanitizedFolderName: sanitizedName,
        fileCount: 0,
        totalSize: 0,
        files: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setFolders(prev => [...prev, {
        name: sanitizedName,
        fileCount: 0,
        totalSize: 0,
        lastModified: new Date().toISOString()
      }]);
      setNewFolderName('');
      setShowCreateFolderModal(false);
      alert(`✅ Folder created!`);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // FIXED: Require userId for delete operations
  const handleDeleteFolder = async (folderName: string) => {
    if (!window.confirm(`Delete "${folderName}" and all contents?`)) return;

    if (!userId) {
      alert('Please sign in to delete folders');
      return;
    }

    try {
      const userDocRef = doc(ensureDb(), 'users', userId);
      const walletRef = collection(userDocRef, 'wallet');
      const folderDocRef = doc(walletRef, folderName);
      const folderDocs = await getDocs(walletRef);
      const targetFolder = folderDocs.docs.find(d => d.id === folderName)?.data();

      if (targetFolder?.files) {
        for (const file of targetFolder.files) {
          if (file.storagePath && !file.storagePath.startsWith('local/')) {
            try {
              await deleteObject(ref(ensureStorage(), file.storagePath));
            } catch (e) {
              console.warn('Could not delete storage file:', e);
            }
          }
        }
      }

      await deleteDoc(folderDocRef);
      setFolders(prev => prev.filter(f => f.name !== folderName));
      setFiles(prev => prev.filter(f => f.folder !== folderName));
      alert(`✅ Folder deleted!`);
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileDelete = async (file: WalletFile) => {
    if (!window.confirm(`Delete ${file.name}?`)) return;

    if (!userId) {
      alert('Please sign in to delete files');
      return;
    }

    try {
      if (file.storagePath) {
        try {
          await deleteObject(ref(ensureStorage(), file.storagePath));
        } catch (e) {
          console.warn('Storage delete failed:', e);
        }
      }

      const userDocRef = doc(ensureDb(), 'users', userId);
      const walletRef = collection(userDocRef, 'wallet');
      const folderDocs = await getDocs(walletRef);
      const folderDoc = folderDocs.docs.find((d: any) => d.id === file.folder);

      if (folderDoc) {
        const folderData = folderDoc.data();
        if (folderData.files) {
          const updated = folderData.files.filter((f: any) => f.name !== file.name);
          if (updated.length === 0) {
            await deleteDoc(doc(walletRef, file.folder));
          } else {
            await setDoc(doc(walletRef, file.folder), {
              ...folderData,
              files: updated,
              fileCount: updated.length,
              totalSize: updated.reduce((acc: number, f: any) => acc + (f.size || 0), 0),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
      }

      setFiles(prev => prev.filter(f => f.id !== file.id));
      setFolders(prev => prev.map(folder => {
        if (folder.name === file.folder) {
          return { ...folder, fileCount: Math.max(0, folder.fileCount - 1), totalSize: Math.max(0, folder.totalSize - file.size) };
        }
        return folder;
      }).filter(f => f.fileCount > 0));

      alert(`✅ Deleted!`);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf')) return FileText;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    if (type.includes('javascript') || type.includes('json') || type.includes('html')) return Code;
    return File;
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!currentFolder || f.folder === currentFolder) &&
    (selectedFilter === 'all' || f.type.startsWith(selectedFilter))
  );

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', width: '90%', maxWidth: '1200px', height: '80vh', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {currentFolder && <button onClick={() => setCurrentFolder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary }}><ArrowLeft style={{ width: '20px', height: '20px' }} /></button>}
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: theme.text, margin: 0 }}>{currentFolder ? `${currentFolder}` : 'Data Wallet'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textSecondary, fontSize: '24px', cursor: 'pointer' }}><X style={{ width: '20px', height: '20px' }} /></button>
        </div>

        {/* Controls */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: theme.textSecondary }} />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 40px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '14px', backgroundColor: theme.searchBg, color: theme.text }} />
          </div>
          <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)} style={{ padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '14px', backgroundColor: theme.cardBg, color: theme.text }}>
            <option value="all">All</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="text">Docs</option>
          </select>
          <div style={{ display: 'flex', backgroundColor: theme.searchBg, borderRadius: '8px', padding: '4px', gap: '4px' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', backgroundColor: viewMode === 'grid' ? '#3b82f6' : 'transparent', color: viewMode === 'grid' ? 'white' : theme.textSecondary, cursor: 'pointer' }}><Grid style={{ width: '16px', height: '16px' }} /></button>
            <button onClick={() => setViewMode('list')} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', backgroundColor: viewMode === 'list' ? '#3b82f6' : 'transparent', color: viewMode === 'list' ? 'white' : theme.textSecondary, cursor: 'pointer' }}><List style={{ width: '16px', height: '16px' }} /></button>
          </div>
          <button onClick={() => setShowCreateFolderModal(true)} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus style={{ width: '16px', height: '16px' }} />New</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {!currentFolder ? (
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', gap: '16px' }}>
              {filteredFolders.map((folder) => (
                <div key={folder.name} onClick={() => setCurrentFolder(folder.name)} style={{ padding: '20px', backgroundColor: theme.cardBg, border: `1px solid ${theme.borderLight}`, borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Folder style={{ width: '32px', height: '32px' }} /></div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: theme.text, margin: 0, marginBottom: '8px' }}>{folder.name}</h3>
                    <div style={{ fontSize: '12px', color: theme.textSecondary }}>{folder.fileCount} files • {formatFileSize(folder.totalSize)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.name); }} style={{ padding: '4px 8px', backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Trash2 style={{ width: '16px', height: '16px' }} /></button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr', gap: '16px' }}>
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.type);
                return (
                  <div key={file.id} style={{ padding: '16px', backgroundColor: theme.cardBg, border: `1px solid ${theme.borderLight}`, borderRadius: '12px' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#f59e0b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '12px' }}><Icon style={{ width: '24px', height: '24px' }} /></div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: theme.text, margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</h4>
                    <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '12px' }}>{formatFileSize(file.size)}</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {file.downloadURL && <button onClick={() => window.open(file.downloadURL)} style={{ flex: 1, padding: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}><Eye style={{ width: '14px', height: '14px', margin: '0 auto' }} /></button>}
                      <button onClick={() => handleFileDelete(file)} style={{ flex: 1, padding: '6px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}><Trash2 style={{ width: '14px', height: '14px', margin: '0 auto' }} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {((!currentFolder && filteredFolders.length === 0) || (currentFolder && filteredFiles.length === 0)) && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textSecondary }}>
              <Folder style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>No {currentFolder ? 'files' : 'folders'}</h3>
            </div>
          )}
        </div>

        {/* Create Folder Modal */}
        {showCreateFolderModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ backgroundColor: theme.cardBg, borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '16px', color: theme.text }}>Create Folder</h2>
              <input type="text" placeholder="Folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()} autoFocus style={{ width: '100%', padding: '10px 12px', border: `1px solid ${theme.border}`, borderRadius: '8px', fontSize: '14px', backgroundColor: theme.searchBg, color: theme.text, marginBottom: '20px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowCreateFolderModal(false); setNewFolderName(''); }} style={{ padding: '8px 16px', backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateFolder} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};