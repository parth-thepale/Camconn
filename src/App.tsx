import React, { useState, useEffect } from 'react';
import './theme.css';
import { TopAppBar } from './components/TopAppBar.js';
import { ReportIssue } from './components/ReportIssue.js';
import { StudentTracker } from './components/StudentTracker.js';
import { StaffDashboard } from './components/StaffDashboard.js';
import { RoutingGuideModal } from './components/RoutingGuideModal.js';
import { PresentationModal } from './components/PresentationModal.js';
import { AuthScreen } from './components/AuthScreen.js';
import {
  fetchHealth,
  fetchCampusLocations,
  fetchCurrentUser,
  clearStoredToken,
} from './api.js';
import { PlusCircle, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { Ticket, User } from './types.js';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [studentTab, setStudentTab] = useState<'report' | 'track'>('report');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [campusLocations, setCampusLocations] = useState<string[]>([]);
  const [isRoutingGuideOpen, setIsRoutingGuideOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [trackingTicketId, setTrackingTicketId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Check health & locations
        const health = await fetchHealth();
        setAiConfigured(health.aiConfigured);

        const locs = await fetchCampusLocations();
        setCampusLocations(locs);

        // Auto-login from cache if token exists
        const cachedUser = await fetchCurrentUser();
        if (cachedUser) {
          setCurrentUser(cachedUser);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    init();
  }, []);

  const handleTicketCreated = (ticket: Ticket) => {
    setTrackingTicketId(ticket.id);
    showToast(`Ticket ${ticket.reference} submitted successfully!`);
  };

  const handleLogout = () => {
    clearStoredToken();
    sessionStorage.removeItem('campusconnect_token');
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Initial loading screen while checking cached session
  if (authChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--md-sys-color-background)',
          gap: '16px',
        }}
      >
        <Loader2 size={36} className="spin-icon" color="var(--md-sys-color-primary)" />
        <p style={{ fontSize: '0.9375rem', color: 'var(--md-sys-color-outline)' }}>
          Connecting to campus authentication system...
        </p>
      </div>
    );
  }

  // FIRST SCREEN GATE: If not logged in, render the AuthScreen directly!
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const isStaffOrAdmin = currentUser.role === 'staff' || currentUser.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <TopAppBar
        currentUser={currentUser}
        aiConfigured={aiConfigured}
        onOpenRoutingGuide={() => setIsRoutingGuideOpen(true)}
        onOpenPresentationModal={() => setIsPresentationOpen(true)}
        onLogout={handleLogout}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--md-sys-color-on-surface)',
            color: 'var(--md-sys-color-surface)',
            padding: '12px 20px',
            borderRadius: 'var(--md-sys-shape-corner-m)',
            boxShadow: 'var(--md-sys-elevation-3)',
            zIndex: 1000,
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} color="#4CAF50" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STRICT ROLE ISOLATION:
          - If Student: only student intake and personal tracker. Staff desk is completely inaccessible.
          - If Staff / Admin: only staff operations desk. Student intake is completely inaccessible.
      */}
      {!isStaffOrAdmin ? (
        /* STUDENT PORTAL ONLY */
        <>
          <div
            style={{
              backgroundColor: 'var(--md-sys-color-surface)',
              borderBottom: '1px solid var(--md-sys-color-surface-variant)',
              padding: '8px 24px',
            }}
          >
            <div
              style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'flex',
                gap: '8px',
              }}
            >
              <button
                className={`md3-button-${studentTab === 'report' ? 'filled' : 'text'}`}
                style={{ fontSize: '0.875rem', padding: '8px 18px' }}
                onClick={() => setStudentTab('report')}
              >
                <PlusCircle size={16} />
                <span>Report Campus Fault</span>
              </button>
              <button
                className={`md3-button-${studentTab === 'track' ? 'filled' : 'text'}`}
                style={{ fontSize: '0.875rem', padding: '8px 18px' }}
                onClick={() => setStudentTab('track')}
              >
                <Search size={16} />
                <span>Track My Reports</span>
              </button>
            </div>
          </div>

          <main style={{ flex: 1, backgroundColor: 'var(--md-sys-color-background)' }}>
            {studentTab === 'report' ? (
              <ReportIssue
                campusLocations={campusLocations}
                currentUser={currentUser}
                onTicketCreated={handleTicketCreated}
                onRequestAuth={() => {}}
              />
            ) : (
              <StudentTracker initialTicketId={trackingTicketId} />
            )}
          </main>
        </>
      ) : (
        /* STAFF & ADMIN OPERATIONS DESK ONLY */
        <main style={{ flex: 1, backgroundColor: 'var(--md-sys-color-background)' }}>
          <StaffDashboard />
        </main>
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--md-sys-color-surface-variant)',
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--md-sys-color-outline)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          CampusConnect • University Facilities Operations • Material 3 Architecture
        </div>
      </footer>

      {/* Routing Directory Modal */}
      {isRoutingGuideOpen && (
        <RoutingGuideModal onClose={() => setIsRoutingGuideOpen(false)} />
      )}

      {/* Presentation & Rubric Defense Modal */}
      {isPresentationOpen && (
        <PresentationModal onClose={() => setIsPresentationOpen(false)} />
      )}
    </div>
  );
};
export default App;
