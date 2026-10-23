import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Filter,
  UserCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Copy,
  ExternalLink,
  MessageSquare,
  Shield,
  Loader2,
  Sparkles,
  Network,
  Zap,
  CreditCard,
  BadgeCheck,
} from 'lucide-react';
import {
  Ticket,
  TicketEvent,
  TicketStatus,
  Category,
  StaffSummary,
  STATUS_TRANSITIONS,
} from '../types.js';
import {
  fetchStaffTickets,
  fetchTicketDetails,
  updateTicketStatus,
  assignTicket,
} from '../api.js';
import { DuplicateReviewModal } from './DuplicateReviewModal.js';
import { TechnicianDiagnosisModal } from './TechnicianDiagnosisModal.js';
import { CampusClustersModal } from './CampusClustersModal.js';

export const StaffDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState<StaffSummary>({
    total: 0,
    unassigned: 0,
    inProgress: 0,
    awaitingAction: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for drawer / actions
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Action states
  const [nextStatus, setNextStatus] = useState<TicketStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [assigneeInput, setAssigneeInput] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Modals state
  const [reviewingDuplicateTicket, setReviewingDuplicateTicket] = useState<Ticket | null>(null);
  const [diagnosingTicket, setDiagnosingTicket] = useState<Ticket | null>(null);
  const [isClustersModalOpen, setIsClustersModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchStaffTickets({
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery,
      });
      setTickets(data.tickets);
      setSummary(data.summary);

      if (selectedTicket) {
        const refreshed = data.tickets.find((t) => t.id === selectedTicket.id);
        if (refreshed) {
          setSelectedTicket(refreshed);
        }
      }
    } catch (err) {
      console.error('Failed to load staff queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [statusFilter, categoryFilter, searchQuery]);

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setNextStatus('');
    setStatusNote('');
    setAssigneeInput(ticket.assignedTo || '');
    setActionMessage(null);
    setLoadingEvents(true);

    try {
      const details = await fetchTicketDetails(ticket.id);
      setTicketEvents(details.events);
    } catch (err) {
      console.error('Failed to fetch details:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedTicket || !nextStatus || !statusNote.trim()) {
      setActionMessage({ text: 'Please select a status and enter an explanation note.', type: 'error' });
      return;
    }

    setIsUpdatingStatus(true);
    setActionMessage(null);

    try {
      const res = await updateTicketStatus({
        ticketId: selectedTicket.id,
        toStatus: nextStatus as TicketStatus,
        note: statusNote.trim(),
        actorName: 'Facilities Lead',
      });
      setSelectedTicket(res.ticket);
      setStatusNote('');
      setNextStatus('');
      setActionMessage({ text: `Status updated to ${res.ticket.status}`, type: 'success' });
      await loadQueue();
      const details = await fetchTicketDetails(selectedTicket.id);
      setTicketEvents(details.events);
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Status transition failed', type: 'error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTicket || !assigneeInput.trim()) return;

    setIsAssigning(true);
    setActionMessage(null);

    try {
      const res = await assignTicket({
        ticketId: selectedTicket.id,
        assignedTo: assigneeInput.trim(),
        note: `Assigned to ${assigneeInput.trim()} for immediate action.`,
      });
      setSelectedTicket(res.ticket);
      setActionMessage({ text: `Assigned to ${assigneeInput.trim()}`, type: 'success' });
      await loadQueue();
      const details = await fetchTicketDetails(selectedTicket.id);
      setTicketEvents(details.events);
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Assignment failed', type: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    const s = status.toLowerCase().replace(' ', '-');
    return <span className={`status-badge status-${s}`}>{status}</span>;
  };

  const getCategoryClass = (cat: Category) => {
    return `md3-chip chip-${cat}`;
  };

  const allowedTransitions = selectedTicket
    ? STATUS_TRANSITIONS[selectedTicket.status] || []
    : [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
      {/* KPI Summary Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="md3-card-elevated" style={{ borderLeft: '4px solid var(--md-sys-color-primary)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>
            TOTAL WORKLOAD
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>
            {summary.total}
          </div>
        </div>

        <div className="md3-card-elevated" style={{ borderLeft: '4px solid var(--md-sys-color-error)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>
            UNASSIGNED TICKETS
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: 'var(--md-sys-color-error)' }}>
            {summary.unassigned}
          </div>
        </div>

        <div className="md3-card-elevated" style={{ borderLeft: '4px solid var(--cat-electricity-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>
            IN PROGRESS
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: 'var(--cat-electricity-color)' }}>
            {summary.inProgress}
          </div>
        </div>

        <div className="md3-card-elevated" style={{ borderLeft: '4px solid var(--cat-cleanliness-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>
            RESOLVED
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: 'var(--cat-cleanliness-color)' }}>
            {summary.resolved}
          </div>
        </div>
      </div>

      {/* Filter, Search & AI Tools Bar */}
      <div
        className="md3-card-filled"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <input
            type="text"
            className="md3-input"
            style={{ minWidth: '220px', flex: 1 }}
            placeholder="Search tickets, buildings, references..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="md3-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="plumbing">Plumbing</option>
            <option value="electricity">Electricity</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="internet_connectivity">Internet Connectivity</option>
          </select>

          <select
            className="md3-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="assigned">Assigned</option>
            <option value="in progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* AI Cluster Insights Tool */}
          <button
            className="md3-button-tonal"
            style={{ fontSize: '0.8125rem' }}
            onClick={() => setIsClustersModalOpen(true)}
          >
            <Network size={15} />
            <span>AI Cluster Insights</span>
          </button>

          <button className="md3-button-text" onClick={loadQueue}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid: Table List & Detail Drawer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedTicket ? '1.2fr 1fr' : '1fr',
          gap: '24px',
        }}
      >
        {/* Tickets Queue Table */}
        <div className="md3-card-elevated" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--md-sys-color-surface-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                }}
              >
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600 }}>REF & TIER</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600 }}>TITLE & LOCATION</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600 }}>CATEGORY</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600 }}>ASSIGNED TO</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600 }}>FLAGS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    Loading triage queue...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    No tickets matching current filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    style={{
                      borderBottom: '1px solid var(--md-sys-color-surface-variant)',
                      cursor: 'pointer',
                      backgroundColor:
                        selectedTicket?.id === t.id
                          ? 'rgba(0, 99, 155, 0.08)'
                          : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' }}>
                        {t.reference}
                      </div>
                      {t.priorityTier === 'expedited_emergency' && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: '#B45309',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <Zap size={10} /> EMERGENCY (PAID)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                        {t.location.building} {t.location.floor ? `• ${t.location.floor}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={getCategoryClass(t.category)}>
                        {t.category.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{getStatusBadge(t.status)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem' }}>
                      {t.assignedTo ? (
                        <span style={{ fontWeight: 500 }}>{t.assignedTo}</span>
                      ) : (
                        <span style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {t.duplicateOf ? (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--cat-electricity-container)',
                            color: 'var(--cat-electricity-on-container)',
                          }}
                        >
                          Duplicate
                        </span>
                      ) : t.hasDuplicateCandidates ? (
                        <button
                          className="md3-chip"
                          style={{
                            cursor: 'pointer',
                            backgroundColor: 'var(--md-sys-color-tertiary-container)',
                            color: 'var(--md-sys-color-on-tertiary-container)',
                            border: 'none',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewingDuplicateTicket(t);
                          }}
                        >
                          Check Duplicates
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Ticket Action Drawer / Detail */}
        {selectedTicket && (
          <div className="md3-card-elevated" style={{ height: 'fit-content' }}>
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
              <div>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  {selectedTicket.reference}
                </span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '2px' }}>
                  {selectedTicket.title}
                </h3>
              </div>
              {getStatusBadge(selectedTicket.status)}
            </div>

            {actionMessage && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--md-sys-shape-corner-s)',
                  marginBottom: '14px',
                  fontSize: '0.8125rem',
                  backgroundColor:
                    actionMessage.type === 'success'
                      ? 'var(--cat-cleanliness-container)'
                      : 'var(--md-sys-color-error-container)',
                  color:
                    actionMessage.type === 'success'
                      ? 'var(--cat-cleanliness-on-container)'
                      : 'var(--md-sys-color-on-error-container)',
                }}
              >
                {actionMessage.text}
              </div>
            )}

            {/* Reporter details */}
            <div
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                padding: '12px',
                borderRadius: 'var(--md-sys-shape-corner-m)',
                marginBottom: '16px',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ marginBottom: '4px' }}>
                <strong>Reported By:</strong> {selectedTicket.creatorName} ({new Date(selectedTicket.createdAt).toLocaleString()})
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Original Complaint:</strong> "{selectedTicket.originalText}"
              </div>
              {selectedTicket.translatedText && (
                <div style={{ color: 'var(--md-sys-color-primary)', marginBottom: '4px' }}>
                  <strong>Auto-Translated:</strong> "{selectedTicket.translatedText}"
                </div>
              )}
              <div style={{ color: 'var(--md-sys-color-outline)' }}>
                <strong>Routing Provenance:</strong> {selectedTicket.routingReason}
              </div>
            </div>

            {/* AI Field Diagnostics Button */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                className="md3-button-filled"
                style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
                onClick={() => setDiagnosingTicket(selectedTicket)}
              >
                <Sparkles size={14} />
                <span>AI Repair Blueprint</span>
              </button>

              <button
                className="md3-button-tonal"
                style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
                onClick={() => setReviewingDuplicateTicket(selectedTicket)}
              >
                <AlertTriangle size={14} />
                <span>Review Duplicates</span>
              </button>
            </div>

            {/* Staff Action 1: Assignment */}
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-m)',
                marginBottom: '16px',
              }}
            >
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                Assign Maintenance Technician
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="md3-input"
                  style={{ flex: 1, padding: '8px 12px' }}
                  placeholder="Technician name (e.g. Vikram Singh)"
                  value={assigneeInput}
                  onChange={(e) => setAssigneeInput(e.target.value)}
                />
                <button
                  className="md3-button-filled"
                  style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                  onClick={handleAssign}
                  disabled={isAssigning || !assigneeInput.trim()}
                >
                  {isAssigning ? <Loader2 size={14} className="spin-icon" /> : 'Assign'}
                </button>
              </div>
            </div>

            {/* Staff Action 2: Status Transition */}
            <div
              style={{
                padding: '14px',
                backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-m)',
                marginBottom: '20px',
              }}
            >
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                Advance Ticket Status
              </h4>

              {allowedTransitions.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-outline)' }}>
                  Ticket is in terminal state ({selectedTicket.status}). No further transitions allowed.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <select
                    className="md3-select"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as TicketStatus)}
                  >
                    <option value="">-- Choose Next Status --</option>
                    {allowedTransitions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    className="md3-input"
                    placeholder="Mandatory status change note (e.g. parts replaced, area safe)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />

                  <button
                    className="md3-button-filled"
                    onClick={handleStatusChange}
                    disabled={isUpdatingStatus || !nextStatus || !statusNote.trim()}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 size={15} className="spin-icon" />
                    ) : (
                      <CheckCircle size={15} />
                    )}
                    <span>Apply Status Transition</span>
                  </button>
                </div>
              )}
            </div>

            {/* Timeline Audit Trail */}
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>
                Audit Trail ({ticketEvents.length} events)
              </h4>
              <div className="md3-timeline">
                {ticketEvents.map((evt) => (
                  <div key={evt.id} className="md3-timeline-item">
                    <div className="md3-timeline-bead" />
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      {evt.toStatus ? `Status: ${evt.toStatus}` : evt.type}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {evt.note}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--md-sys-color-outline)' }}>
                      {evt.actorName} • {new Date(evt.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {reviewingDuplicateTicket && (
        <DuplicateReviewModal
          ticket={reviewingDuplicateTicket}
          onClose={() => setReviewingDuplicateTicket(null)}
          onReviewCompleted={loadQueue}
        />
      )}

      {diagnosingTicket && (
        <TechnicianDiagnosisModal
          ticket={diagnosingTicket}
          onClose={() => setDiagnosingTicket(null)}
        />
      )}

      {isClustersModalOpen && (
        <CampusClustersModal onClose={() => setIsClustersModalOpen(false)} />
      )}
    </div>
  );
};
