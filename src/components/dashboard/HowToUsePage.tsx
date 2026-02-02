// src/components/dashboard/HowToUsePage.tsx

import React from 'react';
import {
  BookOpen,
  Upload,
  Settings,
  Users,
  BarChart3,
  Lock,
  MessageSquare,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { getTheme } from '../shared/theme';

interface HowToUsePageProps {
  isDarkMode: boolean;
  isMobile?: boolean;
  onStartUpload?: () => void;
}

export const HowToUsePage: React.FC<HowToUsePageProps> = ({ isDarkMode, isMobile = false, onStartUpload }) => {
  const theme = getTheme(isDarkMode);

  const tutorials = [
    {
      icon: Upload,
      title: '📤 Share Your Code Datasets (If You\'re a Data Creator)',
      description: 'Monetize your code dataset by turning your datasets into something AI teams can use and earn money!',
      steps: [
        '1️⃣ Sign in with your Google account or GitHub account (takes 30 seconds)',
        '2️⃣ Click "Add Source/Upload" - choose your data source',
        '3️⃣ Select your preferred data source either GitHub or GitLab - choose your preferred license and confirm to connect',
        '4️⃣ Can also extract your dataset from GitHub or GitLab and upload the dataset',
        '5️⃣ Datasets are saved in the Data Wallet',
        '6️⃣ Click "AI Lab API" - Enable connection and make your dataset visible to AI Lab 🎉',
        'ℹ️ AI teams will see your dataset and ask permission to use it'
      ]
    },
    {
      icon: Users,
      title: '✅ Approve or Reject Requests (If You Shared Data)',
      description: 'An AI team wants your data? You decide if they can have it!',
      steps: [
        '1️⃣ You\'ll get a notification: "Someone wants to use your dataset"',
        '2️⃣ Click "Access Requests" to see who wants it',
        '3️⃣ Read their info: What company? What will they do with it?',
        '4️⃣ Thumbs up? Click "Approve" → They get an API key (secret password)',
        '5️⃣ Thumbs down? Click "Reject" → They get a nice message saying no thanks',
        '💰 Bonus: You can earn money every time someone uses your data!',
        '📧 A confirmation email gets sent to them automatically'
      ]
    },
    {
      icon: Users,
      title: '🔍 Find & Request Data (If You\'re an AI Team)',
      description: 'Looking for datasets to train your AI? Here\'s how!',
      steps: [
        '1️⃣ Go to "AI datasets" tab',
        '2️⃣ A list of datasets becomes visible',
        '3️⃣ Found something? Click on it to see more details',
        '4️⃣ Click "Submit Request" and fill out a quick form:',
        '   • Your company name (or just your name)',
        '   • Your email (important! You\'ll get the API key here)',
        '   • Why you want it (be honest and clear)',
        '5️⃣ Click "Submit" and wait (usually approved in 24 hours) ⏳',
        '✨ Approved? You\'ll get an email with your special API key'
      ]
    },
    {
      icon: Lock,
      title: '🔐 Use Your API Key (If You Got Approved)',
      description: 'Now you can use the data the creator shared with you',
      steps: [
        '1️⃣ Check your email for a message from Datta Studio',
        '2️⃣ Copy your secret API key (it looks like: datta_abc123xyz)',
        '3️⃣ Keep it SECRET! Don\'t share it with anyone 🤐',
        '4️⃣ Use it in your AI/code projects (we\'ll send you example code)',
        '5️⃣ You can now download or access the dataset!',
        '⚠️ Important: If you leak your key, regenerate it immediately',
        '📚 Check the API docs if you need help'
      ]
    },
    {
      icon: BarChart3,
      title: '📊 Check Your Dashboard',
      description: 'See all your uploads, requests, and earnings in one place',
      steps: [
        '1️⃣ Click your profile picture in the top-right corner',
        '2️⃣ You\'ll see your dashboard with:',
        '   • Datasets you uploaded 📁',
        '   • Access requests from other teams 📬',
        '   • Datasets you requested access to 📥',
        '   • How much data was downloaded 📊',
        '   • Money you earned (if any) 💰',
        '3️⃣ Click on any dataset to see details',
        '4️⃣ Dark mode? Light mode? Toggle it in settings ✨'
      ]
    },
    {
      icon: CheckCircle,
      title: '🎯 Best Practices & Tips',
      description: 'Do this and you\'ll be a Datta Studio pro!',
      steps: [
        '✅ FOR DATA CREATORS: Write clear descriptions (people will find it easier)',
        '✅ FOR DATA CREATORS: Keep data clean (AI teams love organized data)',
        '✅ FOR DATA CREATORS: Check requests before approving (make sure it\'s legit)',
        '✅ FOR AI TEAMS: Be specific when requesting (explain your project)',
        '✅ FOR AI TEAMS: Use the data legally (respect the license)',
        '✅ FOR EVERYONE: Check emails regularly (don\'t miss important messages)',
        '❌ NEVER: Share your API key online or in public code',
        '❓ STUCK?: Email us or check our FAQ'
      ]
    }
  ];

  return (
    <div style={{
      backgroundColor: theme.bg,
      color: theme.text,
      minHeight: '100vh',
      padding: isMobile ? '20px' : '40px 60px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? '40px' : '60px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <BookOpen style={{ width: '28px', height: '28px' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: '700',
              margin: '0'
            }}>
              How to Use Datta Studio
            </h1>
            <p style={{
              fontSize: isMobile ? '14px' : '16px',
              color: theme.textSecondary,
              margin: '8px 0 0 0'
            }}>
              Think of us as "YouTube for AI Training Data" 🎬📊 - Share your datasets, get them used by AI teams, or find data to power your AI project. Easy as 1-2-3!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: isMobile ? '12px' : '20px',
        marginBottom: isMobile ? '40px' : '60px'
      }}>
        {[
          { label: 'Features', value: '10+' },
          { label: 'Active Users', value: '5K+' },
          { label: 'Datasets Hosted', value: '10K+' },
          { label: 'Support Available', value: '24/7' }
        ].map((stat, idx) => (
          <div key={idx} style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#667eea',
              marginBottom: '8px'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.textSecondary
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Two Paths Section */}
      <div style={{
        backgroundColor: isDarkMode ? '#1e293b' : '#f0f4ff',
        border: `2px solid ${isDarkMode ? '#334155' : '#d4d7ff'}`,
        borderRadius: '16px',
        padding: isMobile ? '24px' : '32px',
        marginBottom: isMobile ? '40px' : '60px'
      }}>
        <h2 style={{
          fontSize: isMobile ? '24px' : '28px',
          fontWeight: '700',
          marginTop: 0,
          marginBottom: '24px',
          color: theme.text
        }}>
          🎯 Which Path Are You? Pick One Below!
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '16px' : '24px'
        }}>
          {/* Path 1: Creator */}
          <div style={{
            backgroundColor: theme.cardBg,
            padding: '24px',
            borderRadius: '12px',
            border: `2px solid #667eea`
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: '0 0 16px 0',
              color: '#667eea'
            }}>
              👨‍💼 I Want to Become a Data Creator
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.textSecondary,
              margin: '0 0 16px 0',
              lineHeight: '1.6'
            }}>
              You have cool code datasets you want to monetize and want to help AI teams train their models ethically and legally.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#667eea',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              ➜ See: "📤 Share Your Data" below
            </div>
          </div>

          {/* Path 2: AI Team */}
          <div style={{
            backgroundColor: theme.cardBg,
            padding: '24px',
            borderRadius: '12px',
            border: `2px solid #10b981`
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: '0 0 16px 0',
              color: '#10b981'
            }}>
              🤖 I Want to USE Ethical and Legal Datasets
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.textSecondary,
              margin: '0 0 16px 0',
              lineHeight: '1.6'
            }}>
              You need datasets to train your AI or build a project? 🔍
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#10b981',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              ➜ See: "🔍 Find & Request Data" below
            </div>
          </div>
        </div>
      </div>      {/* Tutorial Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: isMobile ? '16px' : '24px'
      }}>
        {tutorials.map((tutorial, idx) => {
          const Icon = tutorial.icon;
          return (
            <div key={idx} style={{
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '32px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              transform: 'translateY(0)',
              boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = 'translateY(-8px)';
              el.style.boxShadow = isDarkMode 
                ? '0 8px 20px rgba(102,126,234,0.2)' 
                : '0 8px 20px rgba(102,126,234,0.15)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)';
            }}>
              {/* Icon */}
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '20px'
              }}>
                <Icon style={{ width: '32px', height: '32px' }} />
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: theme.text
              }}>
                {tutorial.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '14px',
                color: theme.textSecondary,
                margin: '0 0 24px 0',
                lineHeight: '1.6'
              }}>
                {tutorial.description}
              </p>

              {/* Steps */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {tutorial.steps.map((step, stepIdx) => (
                  <div key={stepIdx} style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    <CheckCircle style={{
                      width: '18px',
                      height: '18px',
                      color: '#10b981',
                      flexShrink: 0,
                      marginTop: '2px'
                    }} />
                    <span style={{
                      fontSize: '13px',
                      color: theme.textSecondary,
                      lineHeight: '1.5'
                    }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              {/* Learn More Button */}
              <button style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: '#667eea',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.backgroundColor = '#667eea';
                el.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.backgroundColor = 'transparent';
                el.style.color = '#667eea';
              }}>
                Learn More
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div style={{
        marginTop: isMobile ? '40px' : '80px',
        padding: isMobile ? '20px' : '40px',
        backgroundColor: theme.cardBg,
        borderRadius: '16px',
        border: `1px solid ${theme.border}`
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '32px',
          color: theme.text
        }}>
          Frequently Asked Questions
        </h2>

        <div style={{
          display: 'grid',
          gap: '24px'
        }}>
          {[
            {
              q: 'How do I upload large files?',
              a: 'You can upload files up to 10GB in size. For larger datasets, please contact our support team at support@datta.studio.'
            },
            {
              q: 'Can I delete my datasets?',
              a: 'Yes, you can delete datasets anytime from your dashboard. Once deleted, they cannot be recovered.'
            },
            {
              q: 'How do I track downloads and usage?',
              a: 'Check the Analytics section for real-time statistics on downloads, usage, and engagement with your datasets.'
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards, PayPal, and bank transfers. Pricing is based on data storage and bandwidth usage.'
            },
            {
              q: 'Is my data secure?',
              a: 'Yes, we use industry-standard encryption and security measures. All data is backed up regularly and protected with SSL/TLS.'
            },
            {
              q: 'How do I get support?',
              a: 'Contact our support team via email (support@datta.studio), live chat, or visit our help center for documentation.'
            }
          ].map((faq, idx) => (
            <div key={idx} style={{
              borderBottom: idx < 5 ? `1px solid ${theme.border}` : 'none',
              paddingBottom: '24px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
                color: theme.text,
                margin: '0 0 12px 0'
              }}>
                {faq.q}
              </h4>
              <p style={{
                fontSize: '14px',
                color: theme.textSecondary,
                lineHeight: '1.6',
                margin: 0
              }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        marginTop: isMobile ? '40px' : '60px',
        padding: isMobile ? '20px' : '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '16px',
          margin: '0 0 16px 0'
        }}>
          Ready to Get Started?
        </h2>
        <p style={{
          fontSize: '16px',
          marginBottom: '12px',
          opacity: 0.9,
          margin: '0 0 12px 0'
        }}>
          Start uploading your datasets and reach thousands of researchers and developers today.
        </p>
        <p style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '24px',
          margin: '0 0 24px 0'
        }}>
          Welcome to the Data Creator Economy
        </p>
        <button 
          onClick={onStartUpload}
          style={{
          padding: '14px 32px',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '8px',
          color: '#667eea',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.transform = 'translateY(0)';
        }}>
          Start Uploading Now
        </button>
      </div>
    </div>
  );
};
