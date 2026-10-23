import React from 'react';
import {
  Sparkles,
  BookOpen,
  User as UserIcon,
  Building2,
  LogOut,
  Shield,
  Award,
} from 'lucide-react';
import { User } from '../types.js';

interface TopAppBarProps {
  currentUser: User;
  aiConfigured: boolean;
  onOpenRoutingGuide: () => void;
  onOpenPresentationModal?: () => void;
  onLogout: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentUser,
  aiConfigured,
  onOpenRoutingGuide,
  onOpenPresentationModal,
  onLogout,
}) => {
  const isStaff = currentUser.role === 'staff' || currentUser.role === 'admin';

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
              backgroundColor: isStaff ? 'var(--cat-electricity-color)' : 'var(--md-sys-color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--md-sys-elevation-2)',
            }}
          >
            {isStaff ? <Shield size={22} /> : <Building2 size={24} />}
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
                  fontSize: '0.6875rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor: isStaff
                    ? 'var(--cat-electricity-container)'
                    : 'var(--md-sys-color-primary-container)',
                  color: isStaff
                    ? 'var(--cat-electricity-on-container)'
                    : 'var(--md-sys-color-on-primary-container)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {isStaff ? 'Staff Operations Desk' : 'Student Portal'}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-outline)' }}>
              {isStaff
                ? 'Campus Facilities Maintenance & Triage Management'
                : 'Student Facilities Care & Live Complaint Tracking'}
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
                : 'var(--md-sys-color-surface-container)',
              color: aiConfigured
                ? 'var(--cat-cleanliness-on-container)'
                : 'var(--md-sys-color-outline)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
            title={
              aiConfigured
                ? 'Gemini 3.8 Flash active via Google AI Studio'
                : 'Standard rule engine active'
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
            <span>SLA Directory</span>
          </button>

          {/* Hackathon Rubric & Pitch Guide */}
          {onOpenPresentationModal && (
            <button
              className="md3-button-tonal"
              onClick={onOpenPresentationModal}
              style={{
                fontSize: '0.8125rem',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 600,
              }}
            >
              <Award size={15} />
              <span>Rubric (50/50)</span>
            </button>
          )}

          {/* User Profile & Sign Out */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              fontSize: '0.8125rem',
            }}
          >
            <UserIcon size={14} color="var(--md-sys-color-primary)" />
            <span style={{ fontWeight: 600 }}>{currentUser.name}</span>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="md3-button-text"
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--md-sys-color-error)',
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
