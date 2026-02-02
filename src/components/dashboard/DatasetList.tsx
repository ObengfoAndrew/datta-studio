'use client';

import React, { useState, useEffect } from 'react';
import { Dataset, SourceType, LicenseType } from '@/lib/types';
import DatasetCard from './DatasetCard';
import { getDatasets, deleteDataset } from '@/lib/datasetService';
import {
  Grid,
  List,
  Filter,
  Search,
  Plus,
  Download,
  TrendingUp,
} from 'lucide-react';

interface DatasetListProps {
  userId?: string;
  isDarkMode: boolean;
  onAddDataset?: () => void;
  onDatasetDownload?: (dataset: Dataset) => void;
  onDatasetDelete?: (dataset: Dataset) => void;
  onDatasetShare?: (dataset: Dataset) => void;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | SourceType | LicenseType;

const DatasetList: React.FC<DatasetListProps> = ({
  userId = 'demo-user',
  isDarkMode,
  onAddDataset,
  onDatasetDownload,
  onDatasetDelete,
  onDatasetShare,
}) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'revenue'>('date');

  const theme = {
    light: {
      bg: '#f8fafc',
      cardBg: 'white',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      buttonBg: '#3b82f6',
      buttonHover: '#2563eb',
    },
    dark: {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      borderLight: '#475569',
      buttonBg: '#3b82f6',
      buttonHover: '#2563eb',
    },
  };

  const current = isDarkMode ? theme.dark : theme.light;

  // Load datasets
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setIsLoading(true);
        const loadedDatasets = await getDatasets(userId);
        setDatasets(loadedDatasets);
      } catch (error) {
        console.error('Error loading datasets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadDatasets();
    }
  }, [userId]);

  // Filter and sort datasets
  useEffect(() => {
    let filtered = datasets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((dataset) =>
        dataset.sourceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category/license filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((dataset) => {
        // Standard filters
        if (dataset.sourceType === activeFilter || dataset.licenseType === activeFilter) {
          return true;
        }
        // Code-specific filters (language or framework)
        if (
          dataset.sourceType === 'code' &&
          dataset.metadata.codeMetadata &&
          (dataset.metadata.codeMetadata.languages[activeFilter] ||
            dataset.metadata.codeMetadata.frameworks.includes(activeFilter))
        ) {
          return true;
        }
        return false;
      });
    }

    // Sort
    switch (sortBy) {
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'revenue':
        filtered.sort(
          (a, b) => b.earnings.monthlyRevenue - a.earnings.monthlyRevenue
        );
        break;
      case 'date':
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
        break;
    }

    setFilteredDatasets(filtered);
  }, [datasets, searchTerm, activeFilter, sortBy]);

  const handleDelete = async (dataset: Dataset) => {
    if (window.confirm(`Delete "${dataset.sourceName}"?`)) {
      try {
        await deleteDataset(userId, dataset.id, dataset.storageRef);
        setDatasets((prev) => prev.filter((d) => d.id !== dataset.id));
        if (onDatasetDelete) onDatasetDelete(dataset);
      } catch (error) {
        console.error('Error deleting dataset:', error);
        alert('Failed to delete dataset');
      }
    }
  };

  const filterOptions: Array<{ label: string; value: FilterType }> = [
    { label: 'All', value: 'all' },
    { label: 'Code', value: 'code' },
    { label: 'Art', value: 'art' },
    { label: 'Voice', value: 'voice' },
    { label: 'Personal', value: 'personal' },
    { label: 'Creative', value: 'creative' },
    { label: 'Professional', value: 'professional' },
    { label: 'Enterprise', value: 'enterprise' },
  ];

  // Extract unique languages and frameworks from code datasets for filtering
  const codeLanguages = new Set<string>();
  const codeFrameworks = new Set<string>();
  datasets
    .filter((d) => d.sourceType === 'code' && d.metadata.codeMetadata)
    .forEach((d) => {
      if (d.metadata.codeMetadata) {
        Object.keys(d.metadata.codeMetadata.languages).forEach((lang) => codeLanguages.add(lang));
        d.metadata.codeMetadata.frameworks.forEach((fw) => codeFrameworks.add(fw));
      }
    });

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          color: current.textSecondary,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
              animation: 'spin 1s linear infinite',
            }}
          >
            ⏳
          </div>
          <p>Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: current.text,
              margin: 0,
            }}
          >
            My Datasets
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: current.textSecondary,
              margin: '4px 0 0 0',
            }}
          >
            {filteredDatasets.length} dataset{filteredDatasets.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={onAddDataset}
          style={{
            padding: '10px 20px',
            backgroundColor: current.buttonBg,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              current.buttonHover;
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              current.buttonBg;
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Dataset
        </button>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto auto auto',
          gap: '12px',
          marginBottom: '24px',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: current.textSecondary,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 40px',
              border: `1px solid ${current.border}`,
              borderRadius: '8px',
              fontSize: '13px',
              backgroundColor: current.cardBg,
              color: current.text,
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = current.buttonBg;
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = current.border;
            }}
          />
        </div>

        {/* Filter */}
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as FilterType)}
          style={{
            padding: '8px 12px',
            border: `1px solid ${current.border}`,
            borderRadius: '8px',
            fontSize: '13px',
            backgroundColor: current.cardBg,
            color: current.text,
            cursor: 'pointer',
          }}
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'views' | 'revenue')}
          style={{
            padding: '8px 12px',
            border: `1px solid ${current.border}`,
            borderRadius: '8px',
            fontSize: '13px',
            backgroundColor: current.cardBg,
            color: current.text,
            cursor: 'pointer',
          }}
        >
          <option value="date">Latest First</option>
          <option value="views">Most Viewed</option>
          <option value="revenue">Highest Revenue</option>
        </select>

        {/* View Mode Toggle */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: current.borderLight,
            padding: '4px',
            borderRadius: '6px',
          }}
        >
          {[
            { mode: 'grid' as ViewMode, icon: Grid },
            { mode: 'list' as ViewMode, icon: List },
          ].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '6px 10px',
                backgroundColor: viewMode === mode ? current.buttonBg : 'transparent',
                color: viewMode === mode ? 'white' : current.text,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon style={{ width: '16px', height: '16px' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredDatasets.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            color: current.textSecondary,
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📂</div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: current.text,
              margin: '0 0 8px 0',
            }}
          >
            {searchTerm ? 'No datasets found' : 'No datasets yet'}
          </h3>
          <p style={{ fontSize: '14px', margin: '0 0 24px 0' }}>
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Add your first dataset to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={onAddDataset}
              style={{
                padding: '12px 24px',
                backgroundColor: current.buttonBg,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Add First Dataset
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Datasets Grid/List */}
          <div
            style={{
              display:
                viewMode === 'grid'
                  ? 'grid'
                  : 'flex',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {filteredDatasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                isDarkMode={isDarkMode}
                onDownload={() => {
                  if (onDatasetDownload) onDatasetDownload(dataset);
                }}
                onDelete={() => handleDelete(dataset)}
                onShare={() => {
                  if (onDatasetShare) onDatasetShare(dataset);
                }}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(DatasetList);
