import React, { useState, useEffect } from 'react';
import { X, BookOpen, CheckCircle, Info } from 'lucide-react';
import { RoutingRule } from '../types.js';
import { fetchRoutingRules } from '../api.js';

interface RoutingGuideModalProps {
  onClose: () => void;
}

export const RoutingGuideModal: React.FC<RoutingGuideModalProps> = ({ onClose }) => {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRoutingRules();
        setRules(data);
      } catch (err) {
        console.error('Failed to load routing rules:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="md3-dialog-backdrop">
      <div className="md3-dialog" style={{ maxWidth: '720px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid var(--md-sys-color-surface-variant)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              Campus Facilities Routing Directory & Service Standards
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--md-sys-color-outline)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            backgroundColor: 'var(--md-sys-color-secondary-container)',
            color: 'var(--md-sys-color-on-secondary-container)',
            padding: '12px 16px',
            borderRadius: 'var(--md-sys-shape-corner-m)',
            marginBottom: '20px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Info size={18} />
          <span>
            These official routing guidelines determine departmental ownership, priority triage, and response protocols.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="md3-card-outlined"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span className={`md3-chip chip-${rule.category}`}>
                  {rule.category.toUpperCase().replace('_', ' ')}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    backgroundColor: 'var(--md-sys-color-surface-variant)',
                    padding: '2px 8px',
                    borderRadius: 'var(--md-sys-shape-corner-xs)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontWeight: 600,
                  }}
                >
                  Standard Operating Protocol
                </span>
              </div>

              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '4px' }}>
                {rule.departmentLabel}
              </h4>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--md-sys-color-outline)',
                  marginBottom: '8px',
                }}
              >
                <strong>Source:</strong> {rule.sourceLabel}
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    color: 'var(--md-sys-color-outline)',
                    fontWeight: 700,
                  }}
                >
                  Trigger Keywords
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {rule.matchingTerms.map((term) => (
                    <span
                      key={term}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        borderRadius: 'var(--md-sys-shape-corner-full)',
                      }}
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="md3-button-filled" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
