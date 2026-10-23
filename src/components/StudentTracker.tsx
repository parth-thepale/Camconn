import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  FileText,
  Activity,
} from 'lucide-react';
import { Ticket, TicketEvent, TicketStatus, Category } from '../types.js';
import { fetchMyTickets, fetchTicketDetails } from '../api.js';

interface StudentTrackerProps {
  initialTicketId?: string | null;
}

export const StudentTracker: React.FC<StudentTrackerProps> = ({ initialTicketId }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketEvents, setTicketEvents] = useState<TicketEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await fetchMyTickets();
      setTickets(data);
      if (initialTicketId) {
        const found = data.find((t) => t.id === initialTicketId || t.reference === initialTicketId);
        if (found) {
          handleSelectTicket(found);
        }
      }
    } catch (err) {
      console.error('Failed to load student tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [initialTicketId]);

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setLoadingEvents(true);
    try {
      const details = await fetchTicketDetails(ticket.id);
      setTicketEvents(details.events);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Helper for status styling
  const getStatusBadge = (status: TicketStatus) => {
    const s = status.toLowerCase().replace(' ', '-');
    return <span className={`status-badge status-${s}`}>{status}</span>;
  };

  const getCategoryClass = (cat: Category) => {
    return `md3-chip chip-${cat}`;
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.building.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 600 }}>Track Campus Tickets</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-outline)' }}>
            Real-time status updates and transparent resolution timeline
          </p>
        </div>

        <button className="md3-button-outlined" onClick={loadTickets} style={{ fontSize: '0.8125rem' }}>
          <RefreshCw size={14} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--md-sys-color-outline)',
            }}
          />
          <input
            type="text"
            className="md3-input"
            style={{ width: '100%', paddingLeft: '44px' }}
            placeholder="Search by ticket reference (e.g. CC-2026-000101) or building name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid: List on Left, Timeline Drawer on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr',
          gap: '24px',
        }}
      >
        {/* Ticket List */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div
                className="md3-card-outlined"
                style={{ textAlign: 'center', padding: '40px 16px' }}
              >
                <FileText size={36} color="var(--md-sys-color-outline)" style={{ marginBottom: '8px' }} />
                <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.9375rem' }}>
                  No tickets found matching your query.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="md3-card-outlined"
                  onClick={() => handleSelectTicket(ticket)}
                  style={{
                    cursor: 'pointer',
                    borderColor:
                      selectedTicket?.id === ticket.id
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-outline-variant)',
                    backgroundColor:
                      selectedTicket?.id === ticket.id
                        ? 'rgba(0, 99, 155, 0.04)'
                        : 'var(--md-sys-color-surface-container-lowest)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.9375rem',
                        color: 'var(--md-sys-color-primary)',
                      }}
                    >
                      {ticket.reference}
                    </span>
                    {getStatusBadge(ticket.status)}
                  </div>

                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '6px' }}>
                    {ticket.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {ticket.summary}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--md-sys-color-surface-variant)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={getCategoryClass(ticket.category)}>
                        {ticket.category.toUpperCase().replace('_', ' ')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--md-sys-color-outline)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <MapPin size={12} />
                        {ticket.location.building}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Ticket Timeline Card */}
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
                    fontSize: '1rem',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', fontWeight: 600 }}>
                  LOCATION
                </span>
                <p style={{ fontSize: '0.875rem' }}>
                  {selectedTicket.location.building}
                  {selectedTicket.location.floor ? ` • ${selectedTicket.location.floor}` : ''}
                  {selectedTicket.location.room ? ` • ${selectedTicket.location.room}` : ''}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', fontWeight: 600 }}>
                  ROUTED TO
                </span>
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {selectedTicket.routingSuggestion}
                </p>
              </div>

              {selectedTicket.assignedTo && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', fontWeight: 600 }}>
                    ASSIGNED TECHNICIAN
                  </span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>
                    {selectedTicket.assignedTo}
                  </p>
                </div>
              )}

              {selectedTicket.duplicateOf && (
                <div
                  style={{
                    backgroundColor: 'var(--cat-electricity-container)',
                    color: 'var(--cat-electricity-on-container)',
                    padding: '8px 12px',
                    borderRadius: 'var(--md-sys-shape-corner-s)',
                    fontSize: '0.8125rem',
                  }}
                >
                  Associated with master maintenance ticket: <strong>{selectedTicket.duplicateOf}</strong>
                </div>
              )}
            </div>

            {/* Event Timeline */}
            <div>
              <h4
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Activity size={16} />
                <span>Progress History & Audit Trail</span>
              </h4>

              {loadingEvents ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-outline)' }}>
                  Loading timeline...
                </div>
              ) : ticketEvents.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-outline)' }}>
                  No updates recorded yet.
                </p>
              ) : (
                <div className="md3-timeline">
                  {ticketEvents.map((evt) => (
                    <div key={evt.id} className="md3-timeline-item">
                      <div className="md3-timeline-bead" />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {evt.toStatus ? `Status: ${evt.toStatus}` : evt.type}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                          {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {evt.note}
                      </p>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--md-sys-color-outline)', display: 'block', marginTop: '2px' }}>
                        By {evt.actorName} ({evt.actorRole})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
