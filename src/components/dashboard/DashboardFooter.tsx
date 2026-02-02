// src/components/dashboard/DashboardFooter.tsx

import React from 'react';
import { Github, Twitter, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { getTheme } from '../shared/theme';

interface DashboardFooterProps {
  isDarkMode: boolean;
  isMobile: boolean;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({ isDarkMode, isMobile }) => {
  const theme = getTheme(isDarkMode);

  const footerLinks = {
    product: [
      { label: 'Features', url: '#' },
      { label: 'Pricing', url: '#' },
      { label: 'API Documentation', url: '#' },
      { label: 'Data Sources', url: '#' },
      { label: 'Annotation Services', url: '#' }
    ],
    company: [
      { label: 'About Us', url: '#' },
      { label: 'Blog', url: '#' },
      { label: 'Careers', url: '#' },
      { label: 'Contact', url: '#' },
      { label: 'Partners', url: '#' }
    ],
    legal: [
      { label: 'Help Center', url: '#' },
      { label: 'Documentation', url: '#' },
      { label: 'Terms of Service', url: '#' },
      { label: 'Privacy Policy', url: '#' },
      { label: 'Cookie Policy', url: '#' }
    ]
  };

  const socialLinks = [
    { icon: Github, url: 'https://github.com', name: 'GitHub' },
    { icon: Twitter, url: 'https://twitter.com', name: 'Twitter' },
    { icon: Linkedin, url: 'https://linkedin.com', name: 'LinkedIn' },
    { icon: Mail, url: 'mailto:support@dattastudio.com', name: 'Email' }
  ];

  return (
    <footer
      style={{
        background: isDarkMode
          ? 'linear-gradient(to bottom, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
          : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 1))',
        borderTop: isDarkMode ? `2px solid rgba(102, 126, 234, 0.3)` : `2px solid rgba(102, 126, 234, 0.2)`,
        padding: isMobile ? '40px 20px 28px' : '56px 32px 40px',
        marginTop: '64px',
        position: 'relative',
        boxShadow: isDarkMode
          ? '0 -4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 -4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
      }}
    >
      {/* Decorative gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: isDarkMode
            ? 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent)',
          opacity: 0.6
        }}
      />

      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Main Footer Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? '32px' : '48px',
            marginBottom: isMobile ? '32px' : '40px'
          }}
        >
          {/* Brand Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
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
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '-2px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '14px',
                    opacity: 0.3,
                    filter: 'blur(8px)',
                    zIndex: -1
                  }}
                />
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
            <p
              style={{
                fontSize: '14px',
                color: theme.textSecondary,
                lineHeight: '1.6',
                margin: 0,
                maxWidth: '280px'
              }}
            >
              The YouTube of AI training data - collect, manage and monetize the data that powers tomorrow's intelligence.
            </p>
            {/* Social Links */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: isDarkMode
                      ? 'rgba(102, 126, 234, 0.1)'
                      : 'rgba(102, 126, 234, 0.08)',
                    border: `1.5px solid ${
                      isDarkMode
                        ? 'rgba(102, 126, 234, 0.3)'
                        : 'rgba(102, 126, 234, 0.2)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.textSecondary,
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
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? 'rgba(102, 126, 234, 0.1)'
                      : 'rgba(102, 126, 234, 0.08)';
                    e.currentTarget.style.color = theme.textSecondary;
                    e.currentTarget.style.borderColor = isDarkMode
                      ? 'rgba(102, 126, 234, 0.3)'
                      : 'rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <social.icon style={{ width: '18px', height: '18px' }} />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: theme.text,
                margin: '0 0 20px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span
                style={{
                  width: '4px',
                  height: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '2px'
                }}
              />
              Product
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    style={{
                      fontSize: '14px',
                      color: theme.textSecondary,
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = theme.textSecondary;
                    }}
                  >
                    {link.label}
                    <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: theme.text,
                margin: '0 0 20px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span
                style={{
                  width: '4px',
                  height: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '2px'
                }}
              />
              Company
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    style={{
                      fontSize: '14px',
                      color: theme.textSecondary,
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = theme.textSecondary;
                    }}
                  >
                    {link.label}
                    <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: theme.text,
                margin: '0 0 20px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span
                style={{
                  width: '4px',
                  height: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '2px'
                }}
              />
              Support & Legal
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    style={{
                      fontSize: '14px',
                      color: theme.textSecondary,
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = theme.textSecondary;
                    }}
                  >
                    {link.label}
                    <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5 }} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: isMobile ? '32px' : '40px',
            borderTop: isDarkMode ? `1px solid rgba(102, 126, 234, 0.2)` : `1px solid rgba(102, 126, 234, 0.15)`,
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
          }}
        >
          <div style={{ fontSize: '14px', color: theme.text, fontWeight: '500' }}>
            © {new Date().getFullYear()} Datta Studio. All rights reserved.
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: isMobile ? '16px' : '28px',
              fontSize: '13px',
              color: theme.textSecondary,
              alignItems: 'center'
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: isDarkMode
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(16, 185, 129, 0.08)',
                borderRadius: '20px',
                border: `1px solid ${
                  isDarkMode
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(16, 185, 129, 0.2)'
                }`
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                }}
              />
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 1; transform: scale(1); }
                  50% { opacity: 0.7; transform: scale(1.1); }
                }
              `}</style>
              <span style={{ color: '#10b981', fontWeight: '500', fontSize: '13px' }}>
                All systems operational
              </span>
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: isDarkMode
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(239, 68, 68, 0.08)',
                borderRadius: '20px',
                border: `1px solid ${
                  isDarkMode
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(239, 68, 68, 0.2)'
                }`
              }}
            >
              Made with{' '}
              <span
                style={{
                  color: '#ef4444',
                  fontSize: '16px',
                  animation: 'heartbeat 1.5s infinite'
                }}
              >
                ♥
              </span>
              <style>{`
                @keyframes heartbeat {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.2); }
                }
              `}</style>
              <span style={{ color: theme.textSecondary, marginLeft: '4px' }}>
                for AI
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};