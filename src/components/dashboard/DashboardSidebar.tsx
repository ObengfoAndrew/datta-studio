// src/components/dashboard/DashboardSidebar.tsx

import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Tag,
  Search,
  HelpCircle,
} from 'lucide-react';
import { getTheme } from '../shared/theme';

interface SidebarItem {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  badge?: string;
  onClick: () => void;
}

interface DashboardSidebarProps {
  isDarkMode: boolean;
  activeView: 'dashboard' | 'annotations' | 'how-to-use';
  onNavigate: (view: 'dashboard' | 'annotations' | 'how-to-use') => void;
  isMobile: boolean;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isDarkMode,
  activeView,
  onNavigate,
  isMobile
}) => {
  const theme = getTheme(isDarkMode);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const sidebarItems: SidebarItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      onClick: () => onNavigate('dashboard')
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      onClick: () => onNavigate('dashboard')
    },
    {
      icon: DollarSign,
      label: 'Earnings',
      badge: 'New',
      onClick: () => onNavigate('dashboard')
    },
    {
      icon: Tag,
      label: 'Annotation Services',
      onClick: () => onNavigate('annotations')
    },
    {
      icon: Search,
      label: 'AI Datasets',
      onClick: () => window.location.href = '/discover'
    },
    {
      icon: HelpCircle,
      label: 'How to Use',
      onClick: () => onNavigate('how-to-use')
    }
  ];

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: theme.sidebarBg,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        borderRight: `1px solid ${theme.border}`,
        transition: 'all 0.3s ease',
        display: isMobile ? 'none' : 'block',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: `1px solid ${theme.borderLight}`
        }}
      >
        <div
          style={{
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
          }}
        >
          D
        </div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '18px', color: theme.text }}>
            DATTA STUDIO
          </div>
          <div style={{ fontSize: '12px', color: theme.textSecondary }}>
            Data Intelligence Platform
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ marginTop: '24px', padding: '0 16px' }}>
        {sidebarItems.map((item, index) => {
          const isActive = (item.label === 'Dashboard' && activeView === 'dashboard') ||
                          (item.label === 'Annotation Services' && activeView === 'annotations');

          return (
            <button
              key={index}
              onClick={item.onClick}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                borderRadius: '12px',
                margin: '4px 0',
                transition: 'all 0.2s ease',
                color: isActive
                  ? '#3b82f6'
                  : hoveredItem === index
                  ? isDarkMode ? '#a5b4fc' : '#1e40af'
                  : theme.textSecondary,
                backgroundColor: isActive
                  ? (isDarkMode ? '#1e40af20' : '#eff6ff')
                  : hoveredItem === index
                  ? isDarkMode ? '#312e81' : '#e0e7ff'
                  : 'transparent',
                boxShadow: isActive
                  ? '0 2px 4px rgba(59, 130, 246, 0.1)'
                  : hoveredItem === index
                  ? '0 2px 8px rgba(59, 130, 246, 0.08)'
                  : undefined,
                transform: isActive
                  ? 'translateX(4px)'
                  : hoveredItem === index
                  ? 'translateX(2px)'
                  : undefined,
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <item.icon style={{ width: '20px', height: '20px' }} />
                {item.label}
              </div>
              {item.badge && (
                <span
                  style={{
                    backgroundColor: item.badge === 'New' ? '#f59e0b' : '#3b82f6',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: '600'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
};