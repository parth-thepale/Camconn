import React, { useState, useEffect } from 'react';
import { X, Network, AlertOctagon, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { ClusterPattern } from '../types.js';
import { fetchCampusClusters } from '../api.js';

interface CampusClustersModalProps {
  onClose: () => void;
}

export const CampusClustersModal: React.FC<CampusClustersModalProps> = ({ onClose }) => {
  const [clusters, setClusters] = useState<ClusterPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampusClusters()
      .then(setClusters)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="md3-dialog-backdrop">
      <div className="md3-dialog" style={{ maxWidth: '780px' }}>
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
            <Network size={22} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              AI Campus Infrastructure Cluster Analysis
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

        <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-outline)', marginBottom: '20px' }}>
          Gemini 3.8 Flash automatically scans campus reports across space and time to identify
          systemic hardware failures before catastrophic outages occur.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={28} className="spin-icon" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.875rem' }}>Analyzing building clusters...</p>
          </div>
        ) : clusters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <CheckCircle2 size={36} color="var(--cat-cleanliness-color)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>No Systemic Clusters Detected</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-outline)' }}>
              Current maintenance reports do not exceed single-fault thresholds.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {clusters.map((c, i) => (
              <div
                key={i}
                className="md3-card-outlined"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                  padding: '16px',
                  borderLeft: `4px solid ${
                    c.systemicRisk === 'high'
                      ? 'var(--md-sys-color-error)'
                      : 'var(--cat-electricity-color)'
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{c.building}</span>
                    <span className={`md3-chip chip-${c.category}`}>
                      {c.category.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      backgroundColor:
                        c.systemicRisk === 'high'
                          ? 'var(--md-sys-color-error-container)'
                          : 'var(--cat-electricity-container)',
                      color:
                        c.systemicRisk === 'high'
                          ? 'var(--md-sys-color-on-error-container)'
                          : 'var(--cat-electricity-on-container)',
                    }}
                  >
                    {c.systemicRisk.toUpperCase()} RECURRENCE RISK ({c.ticketCount} REPORTS)
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    marginBottom: '10px',
                  }}
                >
                  {c.patternSummary}
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    padding: '10px 14px',
                    borderRadius: 'var(--md-sys-shape-corner-s)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <strong style={{ color: 'var(--md-sys-color-primary)' }}>
                    Engineering Recommendation:
                  </strong>{' '}
                  {c.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="md3-button-filled" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
