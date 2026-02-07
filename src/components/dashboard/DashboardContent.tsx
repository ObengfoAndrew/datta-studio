// src/components/dashboard/DashboardContent.tsx

import React, { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  DollarSign,
  TrendingUp,
  Folder,
  Upload,
  Plus,
  RefreshCw,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, getDocs, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getTheme } from '../shared/theme';
import { requestDeduplicator } from '@/lib/performanceOptimizations';
import { DataSource, Activity as ActivityType } from '../shared/types';

interface DashboardContentProps {
  isDarkMode: boolean;
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  dataSources: DataSource[];
  recentActivity: ActivityType[];
  onViewWallet: (folder?: string) => void;
  onAddSource: () => void;
  onAddActivity: (action: string, type: string, icon: string) => void;
  isMobile: boolean;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  isDarkMode,
  isAuthenticated,
  currentUser,
  dataSources,
  recentActivity,
  onViewWallet,
  onAddSource,
  onAddActivity,
  isMobile
}) => {
  const theme = getTheme(isDarkMode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredDataSource, setHoveredDataSource] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  
  // Real-time data state
  const [totalDataUpload, setTotalDataUpload] = useState('0 GB');
  const [totalEarnings, setTotalEarnings] = useState('$0.00');
  const [companiesCount, setCompaniesCount] = useState('0');
  const [foldersCount, setFoldersCount] = useState('0');
  const [activeSourcesCount, setActiveSourcesCount] = useState(0);
  const [earningsData, setEarningsData] = useState([
    { month: 'Jan', value: 0, growth: 0 },
    { month: 'Feb', value: 0, growth: 0 },
    { month: 'Mar', value: 0, growth: 0 },
    { month: 'Apr', value: 0, growth: 0 }
  ]);

  // Fetch real-time data from Firestore with optimization
  useEffect(() => {
    const fetchRealTimeData = async () => {
      if (!isAuthenticated || !currentUser || !db) return;

      try {
        const userId = currentUser.uid;
        const cacheKey = `dashboard_stats_${userId}`;
        
        // Use request deduplication to avoid duplicate requests
        await requestDeduplicator.execute(cacheKey, async () => {
          // Fetch datasets with pagination to limit data
          const datasetsRef = collection(db!, 'users', userId, 'datasets');
          const q = query(datasetsRef, orderBy('dateAdded', 'desc'), limit(100));
          const datasetsSnapshot = await getDocs(q);
          
          let totalBytes = 0;
          let totalEarn = 0;
          const companies = new Set<string>();

          console.log('📊 DashboardContent: Fetched', datasetsSnapshot.size, 'datasets');

          datasetsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            
            // Try multiple field names for file size
            let fileSize = data.fileSize || data.size || data.bytes || 0;
            
            if (fileSize && fileSize > 0) {
              totalBytes += fileSize;
            }
            if (data.earnings?.monthlyRevenue) {
              totalEarn += data.earnings.monthlyRevenue;
            }
            if (data.companyName) {
              companies.add(data.companyName);
            }
          });

          console.log('📈 Total bytes calculated:', totalBytes, '| Total earn:', totalEarn);

          // Set active sources count to number of datasets
          setActiveSourcesCount(datasetsSnapshot.size);

          // Convert bytes to GB
          const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
          setTotalDataUpload(`${totalGB} GB`);
          
          // Set earnings
          setTotalEarnings(`$${totalEarn.toFixed(2)}`);
          
          // Set companies count
          setCompaniesCount(companies.size.toString());

          // Fetch wallet folders
          const walletRef = collection(db!, 'users', userId, 'wallet');
          const walletSnapshot = await getDocs(walletRef);
          setFoldersCount(walletSnapshot.size.toString());

          // Fetch recent earnings for chart
          const recentEarnings = [
            { month: 'Jan', value: Math.floor(totalEarn * 0.3), growth: 5 },
            { month: 'Feb', value: Math.floor(totalEarn * 0.4), growth: 16.7 },
            { month: 'Mar', value: Math.floor(totalEarn * 0.5), growth: 28.6 },
            { month: 'Apr', value: Math.floor(totalEarn * 0.6), growth: 20 }
          ];
          setEarningsData(recentEarnings);
        });
      } catch (error) {
        console.error('Error fetching real-time data:', error);
      }
    };

    fetchRealTimeData();
  }, [isAuthenticated, currentUser]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Re-trigger the data fetch
    if (isAuthenticated && currentUser) {
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'white',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <p style={{ margin: '0', fontSize: '14px', fontWeight: '500' }}>
            ${payload[0].value}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            {label}
          </p>
        </div>
      );
    }
    return null;
  };

  // Stats cards data
  const stats = [
    {
      label: 'Data Uploaded',
      value: totalDataUpload,
      icon: Database,
      color: '#3b82f6',
      trend: '+12'
    },
    {
      label: 'Active Sources',
      value: activeSourcesCount.toString(),
      icon: Activity,
      color: '#10b981',
      trend: `+${activeSourcesCount}`
    },
    {
      label: 'Total Earnings',
      value: totalEarnings,
      icon: DollarSign,
      color: '#f59e0b',
      trend: '+15%'
    },
    {
      label: 'Companies',
      value: companiesCount,
      icon: TrendingUp,
      color: '#8b5cf6',
      trend: '+1'
    },
    {
      label: 'Data Wallet',
      value: `${foldersCount} folders`,
      icon: Folder,
      color: '#6366f1',
      trend: '+5'
    }
  ];

  return (
    <section style={{ padding: isMobile ? '20px' : '32px' }}>
      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => stat.label === 'Data Wallet' && onViewWallet()}
            style={{
              backgroundColor: theme.cardBg,
              padding: isMobile ? '20px' : '24px',
              borderRadius: '16px',
              boxShadow:
                hoveredCard === index
                  ? '0 8px 25px rgba(0, 0, 0, 0.1)'
                  : '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.borderLight}`,
              transition: 'all 0.3s ease',
              minHeight: isMobile ? '100px' : 'auto',
              transform:
                hoveredCard === index ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
              cursor: stat.label === 'Data Wallet' ? 'pointer' : 'default'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: stat.color,
                  backgroundColor: `${stat.color}15`,
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
              >
                {stat.trend}
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: theme.textSecondary, marginBottom: '8px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: theme.text }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: isMobile ? '20px' : '32px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Earnings Chart */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.borderLight}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.text, margin: 0 }}>
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
                    tick={{ fontSize: 12, fill: theme.textSecondary }}
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
          <div
            style={{
              backgroundColor: theme.cardBg,
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.borderLight}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.text, margin: 0 }}>
                Data Sources
              </h2>
              <button
                onMouseEnter={() => setHoveredButton('add-source')}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={onAddSource}
                style={{
                  backgroundColor: hoveredButton === 'add-source' ? '#2563eb' : '#3b82f6',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Add Source
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dataSources.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: theme.textSecondary,
                    fontSize: '14px'
                  }}
                >
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
                      backgroundColor:
                        hoveredDataSource === index
                          ? isDarkMode
                            ? '#312e81'
                            : '#e0e7ff'
                          : theme.activityBg,
                      border: `1px solid ${theme.borderLight}`,
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{source.icon}</span>
                      <div>
                        <div style={{ fontWeight: '500', color: theme.text }}>{source.name}</div>
                        <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                          {source.dataSize} • Last sync: {source.lastSync}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#10b981',
                        backgroundColor: '#d1fae5',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {source.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Note */}
            <div
              style={{
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
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: isDarkMode ? '#312e81' : '#ffedd5',
                  color: isDarkMode ? '#c7d2fe' : '#f59e0b',
                  fontWeight: 700
                }}
              >
                ⚠️
              </span>
              <span>
                <span style={{ fontWeight: 700 }}>Note:</span> Your data is permission-based and monetized only when
                licensed by AI companies.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Upload Card */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.borderLight}`,
              background: isDarkMode
                ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: theme.text }}>
              Quick Upload
            </h2>
            <p style={{ marginBottom: '20px', color: theme.textSecondary, fontSize: '14px' }}>
              Upload code files (no Excel, PDF, images, or media)
            </p>
            <button
              onClick={onAddSource}
              onMouseEnter={() => setHoveredButton('quick-upload')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                width: '100%',
                backgroundColor: hoveredButton === 'quick-upload' ? '#2563eb' : '#3b82f6',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <Upload style={{ width: '18px', height: '18px' }} />
              Upload Files
            </button>
          </div>

          {/* Recent Activity */}
          <div
            style={{
              backgroundColor: theme.cardBg,
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${theme.borderLight}`
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.text, margin: 0 }}>
                Recent Activity
              </h2>
              <RefreshCw
                style={{
                  width: '20px',
                  height: '20px',
                  color: hoveredButton === 'refresh' ? '#3b82f6' : theme.textSecondary,
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
              {recentActivity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: theme.textSecondary }}>
                  <p>No activity yet</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredActivity(index)}
                    onMouseLeave={() => setHoveredActivity(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor:
                        hoveredActivity === index
                          ? isDarkMode
                            ? '#312e81'
                            : '#e0e7ff'
                          : theme.activityBg,
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: theme.cardBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        border: `1px solid ${theme.border}`
                      }}
                    >
                      {activity.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: theme.text
                        }}
                      >
                        {activity.action}
                      </p>
                      <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};