import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  User,
  Wrench,
  Building2,
} from 'lucide-react';

interface TopAppBarProps {
  currentRole: 'student' | 'staff' | 'admin';
  onRoleChange: (role: 'student' | 'staff' | 'admin') => void;
  aiConfigured: boolean;
  onOpenRoutingGuide: () => void;
  onResetDemo: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentRole,
  onRoleChange,
  aiConfigured,
  onOpenRoutingGuide,
  onResetDemo,
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
                M3 Edition
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-outline)' }}>
              Intelligent Facilities Care & Ticket Lifecycle
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

          {/* Routing Guide Button */}
          <button
            className="md3-button-text"
            onClick={onOpenRoutingGuide}
            style={{ fontSize: '0.8125rem' }}
          >
            <BookOpen size={16} />
            <span>Routing Guide</span>
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

          {/* Role Switcher */}
          <div className="md3-segmented-button-group">
            <button
              className={`md3-segment ${currentRole === 'student' ? 'active' : ''}`}
              onClick={() => onRoleChange('student')}
            >
              <User size={15} />
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
