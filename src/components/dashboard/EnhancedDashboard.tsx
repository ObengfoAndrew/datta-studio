// src/components/dashboard/EnhancedDashboard.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getDatasets } from '@/lib/datasetService';
import { getApiKeyEmail, getRejectionEmail } from '@/lib/emailService';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardContent } from './DashboardContent';
import { DashboardFooter } from './DashboardFooter';
import { HowToUsePage } from './HowToUsePage';
import { DataWallet } from './DataWallet';
import { AuthModals } from './AuthModals';
import { AILabsModal } from './AILabsModal';
import { ProfileModal } from './ProfileModal';
import { AccessRequestsModal } from './AccessRequestsModal';
import AddDataSourceModal from './AddDataSourceModal';
import AnnotationDashboard from './AnnotationDashboard';
import { getTheme } from '../shared/theme';
import { Activity, Dataset, DataSource } from '../shared/types';
import { SourceType, LicenseType, AccessRequest } from '@/lib/types';
import { requestDeduplicator } from '@/lib/performanceOptimizations';

interface EnhancedDashboardState {
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  isDarkMode: boolean;
  activeView: 'dashboard' | 'annotations' | 'how-to-use';
  showAuthModal: boolean;
  showAILabsModal: boolean;
  showProfileModal: boolean;
  showDataWallet: boolean;
  showAddSourceModal: boolean;
  showAccessRequestsModal: boolean;
  selectedWalletFolder: string | null;
  isMobile: boolean;
  dataSources: DataSource[];
  recentActivity: Activity[];
  datasets: Dataset[];
  uploadedFiles: Array<{
    name: string;
    size: number;
    type: string;
    uploadDate: string;
  }>;
  walletFolders: string[];
  accessRequests: AccessRequest[];
  selectedRequestId?: string;
}

const EnhancedDashboard: React.FC = () => {
  // ============ STATE MANAGEMENT ============
  const [state, setState] = useState<EnhancedDashboardState>({
    isAuthenticated: false,
    currentUser: null,
    isDarkMode: false,
    activeView: 'dashboard',
    showAuthModal: false,
    showAILabsModal: false,
    showProfileModal: false,
    showDataWallet: false,
    showAddSourceModal: false,
    showAccessRequestsModal: false,
    selectedWalletFolder: null,
    isMobile: false,
    dataSources: [],
    recentActivity: [],
    datasets: [],
    uploadedFiles: [],
    walletFolders: [],
    accessRequests: [],
    selectedRequestId: undefined
  });

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const updateState = <K extends keyof EnhancedDashboardState>(
    key: K,
    value: EnhancedDashboardState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  // ============ EFFECTS ============

  // Check mobile responsiveness
  useEffect(() => {
    const checkMobile = () => updateState('isMobile', window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle URL parameters for direct access request review
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestId = params.get('requestId');
      const datasetId = params.get('datasetId');
      
      if (requestId) {
        updateState('selectedRequestId', requestId);
        // Auto-open the access requests modal when document is ready
        // The modal will open after data is loaded
      }
    }
  }, []);

  // Firebase Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        updateState('currentUser', user);
        updateState('isAuthenticated', true);
        console.log('✅ User authenticated:', user.uid);
      } else {
        updateState('currentUser', null);
        updateState('isAuthenticated', false);
        updateState('showAuthModal', true);
        console.log('👤 User signed out');
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user datasets and access requests in parallel with deduplication
  useEffect(() => {
    if (state.currentUser?.uid) {
      const fetchUserData = async () => {
        try {
          const userId = state.currentUser!.uid;
          
          // Use request deduplication to avoid duplicate requests during re-renders
          await requestDeduplicator.execute(
            `user_data_${userId}`,
            async () => {
              // Fetch both datasets and access requests in parallel
              const [firestoreDatasets, accessRequestsData] = await Promise.all([
                // Fetch datasets
                (async () => {
                  try {
                    console.log('📊 Fetching datasets for user:', userId);
                    const datasets = await getDatasets(userId);
                    if (datasets.length > 0) {
                      console.log('✅ Loaded', datasets.length, 'datasets from Firestore');
                      return datasets.map((ds: any) => ({
                        id: ds.id || ds.docId,
                        title: ds.sourceName || ds.title || 'Untitled Dataset',
                        sourceName: ds.sourceName,
                        sourceType: ds.sourceType,
                        licenseType: ds.licenseType,
                        status: ds.status,
                        downloads: ds.downloads || 0,
                        fileSize: ds.fileSize || 0,
                        dateAdded: ds.dateAdded,
                        metadata: ds.metadata || { description: '', tags: [] }
                      }));
                    }
                    return [];
                  } catch (error) {
                    console.error('❌ Error fetching datasets:', error);
                    return [];
                  }
                })(),
                // Fetch access requests
                (async () => {
                  try {
                    if (!db) return [];
                    console.log('📬 Fetching access requests for user:', userId);
                    
                    const userAccessRequestsRef = collection(db as any, 'users', userId, 'accessRequests');
                    const accessRequestsSnapshot = await getDocs(userAccessRequestsRef);
                    
                    const requests: AccessRequest[] = [];
                    accessRequestsSnapshot.forEach(doc => {
                      const data = doc.data();
                      requests.push({
                        id: doc.id,
                        datasetName: data.datasetTitle || data.datasetName || 'Unknown Dataset',
                        aiLabName: data.requesterCompany || data.requesterName || 'Unknown Lab',
                        requesterEmail: data.requesterEmail || '',
                        purpose: data.purpose || '',
                        requestedAt: data.createdAt || new Date().toISOString(),
                        status: data.status || 'pending',
                        apiKey: data.apiKey,
                      });
                    });
                    
                    if (requests.length > 0) {
                      console.log('✅ Loaded', requests.length, 'access requests from Firestore');
                    }
                    return requests;
                  } catch (error) {
                    console.error('❌ Error fetching access requests:', error);
                    return [];
                  }
                })()
              ]);

              // Update state with both datasets and access requests
              updateState('datasets', firestoreDatasets);
              updateState('accessRequests', accessRequestsData);
            }
          );
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
        }
      };

      fetchUserData();
    }
  }, [state.currentUser?.uid]);

  // Auto-open access requests modal when URL has requestId parameter and data is loaded
  useEffect(() => {
    if (state.selectedRequestId && state.accessRequests.length > 0) {
      const requestExists = state.accessRequests.some(r => r.id === state.selectedRequestId);
      if (requestExists) {
        updateState('showAccessRequestsModal', true);
        // Clean up URL params after opening modal
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, '/dashboard');
        }
      }
    }
  }, [state.selectedRequestId, state.accessRequests]);

  const handleToggleTheme = () => {
    updateState('isDarkMode', !state.isDarkMode);
  };

  const handleNavigate = (view: 'dashboard' | 'annotations' | 'how-to-use') => {
    updateState('activeView', view);
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Signing out...');
      if (!auth) throw new Error('Auth not initialized');
      await signOut(auth);
      updateState('isAuthenticated', false);
      updateState('currentUser', null);
      updateState('showAuthModal', true);
      alert('👋 You have been signed out.');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      alert('Error logging out: ' + error.message);
    }
  };

  const handleAddActivity = (action: string, type: string, icon: string) => {
    const newActivity: Activity = {
      action,
      time: 'Just now',
      type,
      icon
    };
    setState(prev => ({
      ...prev,
      recentActivity: [newActivity, ...prev.recentActivity].slice(0, 10)
    }));
  };

  // ============ RENDER ============

  const theme = getTheme(state.isDarkMode);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: theme.bg,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Sidebar */}
      <DashboardSidebar
        isDarkMode={state.isDarkMode}
        activeView={state.activeView}
        onNavigate={handleNavigate}
        isMobile={state.isMobile}
        showMobileMenu={showMobileMenu}
        onCloseMobileMenu={() => setShowMobileMenu(false)}
      />

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: '60px' }}>
        {state.activeView === 'annotations' ? (
          <AnnotationDashboard
            isDarkMode={state.isDarkMode}
            onBack={() => updateState('activeView', 'dashboard')}
          />
        ) : state.activeView === 'how-to-use' ? (
          <HowToUsePage
            isDarkMode={state.isDarkMode}
            isMobile={state.isMobile}
            onStartUpload={() => updateState('activeView', 'dashboard')}
          />
        ) : (
          <>
            {/* Header */}
            <DashboardHeader
              isDarkMode={state.isDarkMode}
              onToggleTheme={handleToggleTheme}
              isAuthenticated={state.isAuthenticated}
              currentUser={state.currentUser}
              onProfileClick={() => updateState('showProfileModal', true)}
              onLogout={handleLogout}
              onAILabsClick={() => updateState('showAILabsModal', true)}
              onSignIn={() => updateState('showAuthModal', true)}
              onAccessClick={() => updateState('showAccessRequestsModal', true)}
              accessRequestCount={state.accessRequests.length}
              isMobile={state.isMobile}
              showMobileMenu={showMobileMenu}
              onToggleMobileMenu={() => setShowMobileMenu(!showMobileMenu)}
            />

            {/* Dashboard Content */}
            <DashboardContent
              isDarkMode={state.isDarkMode}
              isAuthenticated={state.isAuthenticated}
              currentUser={state.currentUser}
              dataSources={state.dataSources}
              recentActivity={state.recentActivity}
              onViewWallet={(folder?: string) => {
                updateState('selectedWalletFolder', folder || null);
                updateState('showDataWallet', true);
              }}
              onAddSource={() => {
                updateState('showAddSourceModal', true);
              }}
              onAddActivity={handleAddActivity}
              isMobile={state.isMobile}
            />

            {/* Footer */}
            <DashboardFooter
              isDarkMode={state.isDarkMode}
              isMobile={state.isMobile}
            />
          </>
        )}
      </div>

      {/* ============ MODALS ============ */}

      {/* Auth Modals */}
      <AuthModals
        isOpen={state.showAuthModal}
        isDarkMode={state.isDarkMode}
        onClose={() => updateState('showAuthModal', false)}
        onAuthSuccess={(user) => {
          updateState('currentUser', user);
          updateState('isAuthenticated', true);
          updateState('showAuthModal', false);
        }}
      />

      {/* AI Labs Modal */}
      <AILabsModal
        isOpen={state.showAILabsModal}
        isDarkMode={state.isDarkMode}
        onClose={() => updateState('showAILabsModal', false)}
        isAuthenticated={state.isAuthenticated}
        currentUser={state.currentUser}
        datasets={state.datasets}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={state.showProfileModal}
        isDarkMode={state.isDarkMode}
        onClose={() => updateState('showProfileModal', false)}
        currentUser={state.currentUser}
      />

      {/* Add Data Source Modal */}
      <AddDataSourceModal
        isOpen={state.showAddSourceModal}
        isDarkMode={state.isDarkMode}
        onClose={() => updateState('showAddSourceModal', false)}
        currentUser={state.currentUser}
        onDatasetAdded={(sourceType: SourceType, licenseType: LicenseType, file?: File, sourceProvider?: string) => {
          if (file) {
            // Create a new dataset from the uploaded file
            const newDataset: Dataset = {
              id: `ds-${Date.now()}`,
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              sourceName: file.name,
              sourceType: sourceType as any, // Cast to allow both types
              licenseType: licenseType,
              fileSize: file.size,
              status: 'published',
              downloads: 0,
              dateAdded: new Date().toISOString(),
              metadata: {
                description: `Uploaded ${sourceType} dataset: ${file.name}`,
                tags: [sourceType, 'uploaded']
              }
            };

            // Add to datasets
            const updatedDatasets = [...state.datasets, newDataset];
            updateState('datasets', updatedDatasets);

            // Add to uploaded files with proper structure for Data Wallet
            const newUploadedFile = {
              id: `file-${Date.now()}`,
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
              uploadDate: new Date().toISOString(),
              folder: 'Uploaded Files' // Default folder
            } as any;
            const updatedFiles = [...state.uploadedFiles, newUploadedFile];
            updateState('uploadedFiles', updatedFiles);

            handleAddActivity(`Uploaded ${file.name}`, 'upload', '📤');
          }
          updateState('showAddSourceModal', false);
        }}
      />

      {/* Data Wallet Modal */}
      <DataWallet
        isOpen={state.showDataWallet}
        onClose={() => {
          updateState('showDataWallet', false);
          updateState('selectedWalletFolder', null);
        }}
        isDarkMode={state.isDarkMode}
        initialFolder={state.selectedWalletFolder}
        uploadedFiles={state.uploadedFiles as any}
        userId={state.currentUser?.uid}
      />

      {/* Access Requests Modal */}
      <AccessRequestsModal
        isOpen={state.showAccessRequestsModal}
        isDarkMode={state.isDarkMode}
        onClose={() => updateState('showAccessRequestsModal', false)}
        requests={state.accessRequests}
        selectedRequestId={state.selectedRequestId}
        onApprove={async (requestId: string) => {
          try {
            // Find the request to get requester details
            const request = state.accessRequests.find(r => r.id === requestId);
            if (!request) {
              alert('Request not found');
              return;
            }

            // Generate API key
            const apiKey = `datta_${Math.random().toString(36).substr(2, 9)}`;
            
            // Update in Firestore
            if (state.currentUser?.uid && db) {
              const requestRef = doc(db as any, 'users', state.currentUser.uid, 'accessRequests', requestId);
              await updateDoc(requestRef, {
                status: 'approved',
                apiKey: apiKey,
                reviewedAt: new Date().toISOString(),
                reviewedBy: state.currentUser.uid
              });
              console.log('✅ Request approved in Firestore:', requestId);
            }
            
            // Send approval email with API key
            try {
              const emailPayload = getApiKeyEmail(
                request.requesterEmail,
                request.aiLabName,
                request.datasetName,
                apiKey
              );
              
              const emailResponse = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailPayload)
              });

              if (emailResponse.ok) {
                console.log('✅ Approval email sent to:', request.requesterEmail);
              } else {
                console.warn('⚠️ Failed to send approval email, but request was approved');
              }
            } catch (emailError) {
              console.warn('⚠️ Error sending email:', emailError);
            }
            
            // Update local state
            const updatedRequests = state.accessRequests.map(req => {
              if (req.id === requestId) {
                return {
                  ...req,
                  status: 'approved' as const,
                  apiKey: apiKey,
                };
              }
              return req;
            });
            updateState('accessRequests', updatedRequests);
            handleAddActivity('Approved dataset access request', 'approval', '✅');
            alert('✅ Request approved! API key sent to requester.');
          } catch (error) {
            console.error('❌ Error approving request:', error);
            alert('Failed to approve request. Please try again.');
          }
        }}
        onReject={async (requestId: string) => {
          try {
            // Find the request to get requester details
            const request = state.accessRequests.find(r => r.id === requestId);
            if (!request) {
              alert('Request not found');
              return;
            }

            // Update in Firestore
            if (state.currentUser?.uid && db) {
              const requestRef = doc(db as any, 'users', state.currentUser.uid, 'accessRequests', requestId);
              await updateDoc(requestRef, {
                status: 'rejected',
                reviewedAt: new Date().toISOString(),
                reviewedBy: state.currentUser.uid,
                reason: 'Rejected by dataset owner'
              });
              console.log('❌ Request rejected in Firestore:', requestId);
            }

            // Send rejection email
            try {
              const emailPayload = getRejectionEmail(
                request.requesterEmail,
                request.aiLabName,
                request.datasetName,
                'The dataset owner has decided not to approve this request at this time.'
              );
              
              const emailResponse = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailPayload)
              });

              if (emailResponse.ok) {
                console.log('✅ Rejection email sent to:', request.requesterEmail);
              } else {
                console.warn('⚠️ Failed to send rejection email, but request was rejected');
              }
            } catch (emailError) {
              console.warn('⚠️ Error sending email:', emailError);
            }
            
            // Update local state
            const updatedRequests = state.accessRequests.map(req => {
              if (req.id === requestId) {
                return { ...req, status: 'rejected' as const };
              }
              return req;
            });
            updateState('accessRequests', updatedRequests);
            handleAddActivity('Rejected dataset access request', 'rejection', '❌');
            alert('✅ Request rejected. Rejection email sent to requester.');
          } catch (error) {
            console.error('❌ Error rejecting request:', error);
            alert('Failed to reject request. Please try again.');
          }
        }}
      />
    </div>
  );
};

export default EnhancedDashboard;