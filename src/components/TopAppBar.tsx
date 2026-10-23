import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  User as UserIcon,
  Wrench,
  Building2,
  LogIn,
  LogOut,
} from 'lucide-react';
import { User, UserRole } from '../types.js';

interface TopAppBarProps {
  currentRole: UserRole;
  currentUser: User | null;
  onRoleChange: (role: UserRole) => void;
  aiConfigured: boolean;
  onOpenRoutingGuide: () => void;
  onResetDemo: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentRole,
  currentUser,
  onRoleChange,
  aiConfigured,
  onOpenRoutingGuide,
  onResetDemo,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderBottom: '1px solid var(--md-sys-color-surface-variant)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--md-sys-elevation-1)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--md-sys-shape-corner-m)',
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-sys-elevation-2)',
            }}
          >
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface)',
                  letterSpacing: '-0.02em',
                }}
              >
                CampusConnect
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  fontWeight: 600,
                }}
              >
                M3 FullStack
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-outline)' }}>
              Intelligent Facilities Care & Real-Time Lifecycle
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* AI Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              backgroundColor: aiConfigured
                ? 'var(--cat-cleanliness-container)'
                : 'var(--cat-electricity-container)',
              color: aiConfigured
                ? 'var(--cat-cleanliness-on-container)'
                : 'var(--cat-electricity-on-container)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
            title={
              aiConfigured
                ? 'Gemini 3.8 Flash configured via Google AI Studio'
                : 'Using local deterministic triage fallback'
            }
          >
            <Sparkles size={14} />
            <span>{aiConfigured ? 'Gemini 3.8 Flash' : 'Rule Engine Active'}</span>
          </div>

          {/* Routing Guide */}
          <button
            className="md3-button-text"
            onClick={onOpenRoutingGuide}
            style={{ fontSize: '0.8125rem' }}
          >
            <BookOpen size={16} />
            <span>Routing</span>
          </button>

          {/* Reset Demo */}
          <button
            className="md3-button-text"
            onClick={onResetDemo}
            title="Reset to default seed tickets"
            style={{ fontSize: '0.8125rem' }}
          >
            <RotateCcw size={15} />
            <span>Reset Demo</span>
          </button>

          {/* User Auth Info / Login Button */}
          {currentUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                fontSize: '0.8125rem',
              }}
            >
              <UserIcon size={14} color="var(--md-sys-color-primary)" />
              <span style={{ fontWeight: 600 }}>{currentUser.name}</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {currentUser.role}
              </span>
              <button
                onClick={onLogout}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--md-sys-color-outline)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              className="md3-button-filled"
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
              onClick={onOpenAuth}
            >
              <LogIn size={15} />
              <span>Sign In / Demo</span>
            </button>
          )}

          {/* Role Switcher */}
          <div className="md3-segmented-button-group">
            <button
              className={`md3-segment ${currentRole === 'student' ? 'active' : ''}`}
              onClick={() => onRoleChange('student')}
            >
              <UserIcon size={15} />
              <span>Student</span>
            </button>
            <button
              className={`md3-segment ${currentRole === 'staff' ? 'active' : ''}`}
              onClick={() => onRoleChange('staff')}
            >
              <Wrench size={15} />
              <span>Staff Queue</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
