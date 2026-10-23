import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Check, Link, CornerDownRight, Loader2 } from 'lucide-react';
import { Ticket, DuplicateCandidate } from '../types.js';
import { fetchTicketDuplicates, submitDuplicateReview } from '../api.js';

interface DuplicateReviewModalProps {
  ticket: Ticket;
  onClose: () => void;
  onReviewCompleted: () => void;
}

export const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  ticket,
  onClose,
  onReviewCompleted,
}) => {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTicketDuplicates(ticket.id);
        setCandidates(data);
        if (data.length > 0) {
          setSelectedCandidate(data[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load duplicate candidates');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticket.id]);

  const handleDecision = async (decision: 'same_issue' | 'separate_issue' | 'deferred') => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await submitDuplicateReview({
        ticketId: ticket.id,
        candidateTicketId: selectedCandidate.ticketId,
        decision,
        reason: reviewNote.trim() || `Staff decided ${decision.replace('_', ' ')} based on review.`,
      });
      onReviewCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="md3-dialog-backdrop">
      <div className="md3-dialog" style={{ maxWidth: '800px' }}>
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
            <AlertTriangle size={20} color="var(--cat-electricity-color)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              Duplicate Report Detection & Triage
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
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.875rem' }}>Analyzing candidate reports...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ color: 'var(--md-sys-color-outline)', marginBottom: '16px' }}>
              No strong duplicate candidates detected in the same category or building.
            </p>
            <button className="md3-button-tonal" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <div>
            {/* Side by side comparison */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              {/* Target Ticket */}
              <div
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  padding: '16px',
                  borderRadius: 'var(--md-sys-shape-corner-m)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    color: 'var(--md-sys-color-primary)',
                    fontWeight: 700,
                  }}
                >
                  Current Ticket Under Review
                </span>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '1rem',
                    margin: '4px 0',
                  }}
                >
                  {ticket.reference}
                </div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '6px' }}>
                  {ticket.title}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {ticket.summary}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', marginTop: '8px' }}>
                  📍 {ticket.location.building} {ticket.location.floor ? `• ${ticket.location.floor}` : ''}
                </div>
              </div>

              {/* Candidate Ticket */}
              {selectedCandidate && (
                <div
                  style={{
                    backgroundColor: 'var(--cat-electricity-container)',
                    color: 'var(--cat-electricity-on-container)',
                    padding: '16px',
                    borderRadius: 'var(--md-sys-shape-corner-m)',
                    border: '1px solid rgba(122, 89, 0, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                      }}
                    >
                      Plausible Existing Incident ({selectedCandidate.similarityScore}% match)
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '1rem',
                      margin: '4px 0',
                    }}
                  >
                    {selectedCandidate.reference}
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '6px' }}>
                    {selectedCandidate.title}
                  </h4>
                  <div style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                    📍 {selectedCandidate.location.building} {selectedCandidate.location.floor ? `• ${selectedCandidate.location.floor}` : ''}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      padding: '6px 8px',
                      borderRadius: 'var(--md-sys-shape-corner-xs)',
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <strong>Signals:</strong> {selectedCandidate.reason}
                  </div>
                </div>
              )}
            </div>

            {/* Note input */}
            <div className="md3-textfield">
              <label className="md3-label">Staff Reviewer Note / Justification</label>
              <input
                type="text"
                className="md3-input"
                placeholder="e.g. Confirmed same 2nd floor restroom leak; linked to avoid dispatching double crews."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>

            {/* Decision Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                flexWrap: 'wrap',
                marginTop: '16px',
              }}
            >
              <button
                className="md3-button-text"
                onClick={() => handleDecision('deferred')}
                disabled={isSubmitting}
              >
                Defer Decision
              </button>
              <button
                className="md3-button-outlined"
                onClick={() => handleDecision('separate_issue')}
                disabled={isSubmitting}
              >
                Mark as Separate Incident
              </button>
              <button
                className="md3-button-filled"
                onClick={() => handleDecision('same_issue')}
                disabled={isSubmitting}
              >
                <Link size={16} />
                <span>Mark Same Underlying Incident</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
