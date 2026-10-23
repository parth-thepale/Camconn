import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Sparkles,
  CheckSquare,
  Clock,
  Layers,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Ticket, TechnicianDiagnosis } from '../types.js';
import { fetchTechnicianDiagnosis } from '../api.js';

interface TechnicianDiagnosisModalProps {
  ticket: Ticket;
  onClose: () => void;
}

export const TechnicianDiagnosisModal: React.FC<TechnicianDiagnosisModalProps> = ({
  ticket,
  onClose,
}) => {
  const [diagnosis, setDiagnosis] = useState<TechnicianDiagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTechnicianDiagnosis(ticket.id);
        setDiagnosis(data);
      } catch (err: any) {
        setError(err.message || 'Failed to generate diagnosis');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticket.id]);

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

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
            <Sparkles size={20} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              AI Field Diagnostics & Action Plan
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

        {error && (
          <div
            style={{
              backgroundColor: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
              padding: '10px 14px',
              borderRadius: 'var(--md-sys-shape-corner-s)',
              marginBottom: '16px',
              fontSize: '0.8125rem',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={28} className="spin-icon" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>
              Gemini 3.8 Flash is analyzing fault symptoms & synthesizing repair blueprint...
            </p>
          </div>
        ) : diagnosis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info */}
            <div
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                padding: '14px 18px',
                borderRadius: 'var(--md-sys-shape-corner-m)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                  TARGET FAULT
                </span>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {ticket.reference} • {ticket.title}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  padding: '6px 12px',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <Clock size={14} />
                <span>Est. {diagnosis.estimatedRepairMinutes} mins</span>
              </div>
            </div>

            {/* Root cause */}
            <div
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                padding: '16px',
                borderRadius: 'var(--md-sys-shape-corner-m)',
                borderLeft: '4px solid var(--md-sys-color-primary)',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--md-sys-color-primary)',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Likely Technical Root Cause
              </span>
              <p style={{ fontSize: '0.9375rem', color: 'var(--md-sys-color-on-surface)' }}>
                {diagnosis.likelyRootCause}
              </p>
            </div>

            {/* Tools & Parts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div
                className="md3-card-outlined"
                style={{ padding: '14px', backgroundColor: 'var(--md-sys-color-surface-container-lowest)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Wrench size={16} color="var(--md-sys-color-primary)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Toolbox Checklist</span>
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {diagnosis.recommendedTools.map((tool, idx) => (
                    <li key={idx}>{tool}</li>
                  ))}
                </ul>
              </div>

              <div
                className="md3-card-outlined"
                style={{ padding: '14px', backgroundColor: 'var(--md-sys-color-surface-container-lowest)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Layers size={16} color="var(--cat-cleanliness-color)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Replacement Hardware</span>
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {diagnosis.replacementParts.map((part, idx) => (
                    <li key={idx}>{part}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Steps */}
            <div>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                On-Site Field Procedure Checklist
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {diagnosis.actionPlanSteps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: 'var(--md-sys-shape-corner-s)',
                      backgroundColor: completedSteps[idx]
                        ? 'var(--cat-cleanliness-container)'
                        : 'var(--md-sys-color-surface-container)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(completedSteps[idx])}
                      onChange={() => {}}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        textDecoration: completedSteps[idx] ? 'line-through' : 'none',
                        color: completedSteps[idx]
                          ? 'var(--cat-cleanliness-on-container)'
                          : 'var(--md-sys-color-on-surface)',
                      }}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="md3-button-filled" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
