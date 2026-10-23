import React, { useState, useEffect } from 'react';
import './theme.css';
import { TopAppBar } from './components/TopAppBar.js';
import { ReportIssue } from './components/ReportIssue.js';
import { StudentTracker } from './components/StudentTracker.js';
import { StaffDashboard } from './components/StaffDashboard.js';
import { RoutingGuideModal } from './components/RoutingGuideModal.js';
import { AuthModal } from './components/AuthModal.js';
import {
  fetchHealth,
  fetchCampusLocations,
  resetDemoDataset,
  fetchCurrentUser,
  clearStoredToken,
} from './api.js';
import { PlusCircle, Search, CheckCircle2 } from 'lucide-react';
import { Ticket, User, UserRole } from './types.js';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [studentTab, setStudentTab] = useState<'report' | 'track'>('report');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [campusLocations, setCampusLocations] = useState<string[]>([]);
  const [isRoutingGuideOpen, setIsRoutingGuideOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [trackingTicketId, setTrackingTicketId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const health = await fetchHealth();
        setAiConfigured(health.aiConfigured);

        const locs = await fetchCampusLocations();
        setCampusLocations(locs);

        const user = await fetchCurrentUser();
        if (user) {
          setCurrentUser(user);
          setCurrentRole(user.role);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const handleTicketCreated = (ticket: Ticket) => {
    setTrackingTicketId(ticket.id);
    showToast(`Ticket ${ticket.reference} created successfully!`);
  };

  const handleResetDemo = async () => {
    try {
      await resetDemoDataset();
      showToast('Demo dataset has been reset to default state.');
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setCurrentUser(null);
    setCurrentRole('student');
    showToast('Signed out of campus account.');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    showToast(`Welcome back, ${user.name} (${user.role.toUpperCase()})`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top App Bar */}
      <TopAppBar
        currentRole={currentRole}
        currentUser={currentUser}
        onRoleChange={(role) => setCurrentRole(role)}
        aiConfigured={aiConfigured}
        onOpenRoutingGuide={() => setIsRoutingGuideOpen(true)}
        onResetDemo={handleResetDemo}
        onOpenAuth={() => setIsAuthModalOpen(true)}
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

      {/* Student View Secondary Nav */}
      {currentRole === 'student' && (
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
              <span>Report New Fault</span>
            </button>
            <button
              className={`md3-button-${studentTab === 'track' ? 'filled' : 'text'}`}
              style={{ fontSize: '0.875rem', padding: '8px 18px' }}
              onClick={() => setStudentTab('track')}
            >
              <Search size={16} />
              <span>Track My Tickets</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, backgroundColor: 'var(--md-sys-color-background)' }}>
        {currentRole === 'student' ? (
          studentTab === 'report' ? (
            <ReportIssue
              campusLocations={campusLocations}
              currentUser={currentUser}
              onTicketCreated={handleTicketCreated}
              onRequestAuth={() => setIsAuthModalOpen(true)}
            />
          ) : (
            <StudentTracker initialTicketId={trackingTicketId} />
          )
        ) : (
          <StaffDashboard />
        )}
      </main>

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
          CampusConnect • Powered by Google AI Studio & Gemini 3.8 Flash • Material 3 Full-Stack
        </div>
      </footer>

      {/* Modals */}
      {isRoutingGuideOpen && (
        <RoutingGuideModal onClose={() => setIsRoutingGuideOpen(false)} />
      )}

      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};
export default App;
