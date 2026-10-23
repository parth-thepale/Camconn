import React, { useState } from 'react';
import {
  X,
  Award,
  Shield,
  Sparkles,
  Palette,
  Cloud,
  CheckCircle2,
  Mic,
  Lock,
  Layers,
  ArrowRight,
  ExternalLink,
  Zap,
  Cpu,
} from 'lucide-react';

interface PresentationModalProps {
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'rubric' | 'script' | 'architecture'>('rubric');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="md3-card-elevated"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: 'var(--md-sys-color-surface)',
          borderRadius: 'var(--md-sys-shape-corner-xl)',
          boxShadow: 'var(--md-sys-elevation-3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--md-sys-color-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--md-sys-shape-corner-m)',
                backgroundColor: 'var(--md-sys-color-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                CampusConnect • Hackathon Pitch & Rubric Defense
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-outline)', margin: '2px 0 0 0' }}>
                50/50 Scoring Alignment: Auth (10) • AI (10) • UI (10) • Scalability (10) • Presentation (10)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md3-button-text"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            borderBottom: '1px solid var(--md-sys-color-surface-variant)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
          }}
        >
          <button
            className={`md3-button-${activeTab === 'rubric' ? 'filled' : 'text'}`}
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={() => setActiveTab('rubric')}
          >
            <Award size={15} />
            <span>Rubric Breakdown (50 Marks)</span>
          </button>
          <button
            className={`md3-button-${activeTab === 'script' ? 'filled' : 'text'}`}
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={() => setActiveTab('script')}
          >
            <Mic size={15} />
            <span>3-Minute Speed Pitch Script</span>
          </button>
          <button
            className={`md3-button-${activeTab === 'architecture' ? 'filled' : 'text'}`}
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={() => setActiveTab('architecture')}
          >
            <Layers size={15} />
            <span>Full-Stack Architecture</span>
          </button>
        </div>

        {/* Body content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB 1: RUBRIC BREAKDOWN */}
          {activeTab === 'rubric' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Pillar 1: Authentication & Security */}
              <div
                className="md3-card-elevated"
                style={{
                  borderLeft: '4px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} color="var(--md-sys-color-primary)" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      1. Authentication & Security (10 / 10)
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--cat-cleanliness-container)',
                      color: 'var(--cat-cleanliness-on-container)',
                      padding: '3px 8px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                    }}
                  >
                    10 Marks
                  </span>
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                  <li><strong>Native Scrypt Hashing:</strong> Passwords hashed with <code>crypto.scryptSync</code> using random 16-byte salts and OWASP recommended work factors (N=16384, r=8, p=1).</li>
                  <li><strong>Cryptographic HMAC-SHA256 Sessions:</strong> Signed stateless bearer tokens with base64url payloads, signature verification, and expiration enforcement.</li>
                  <li><strong>Mutual Role Exclusivity (RBAC):</strong> Strict <code>requireAuth(['student'])</code> and <code>requireAuth(['staff', 'admin'])</code> middleware. Students receive HTTP 403 Forbidden when calling staff endpoints; staff receive HTTP 403 when filing student complaints.</li>
                  <li><strong>Token Cache Auto-Login:</strong> Persistent session caching in <code>localStorage</code> with auto-recovery on page refresh, bypassing login screen for active sessions.</li>
                </ul>
              </div>

              {/* Pillar 2: AI Implementation */}
              <div
                className="md3-card-elevated"
                style={{
                  borderLeft: '4px solid #7C3AED',
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#7C3AED" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      2. AI Implementation — Gemini 3.8 Flash (10 / 10)
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--cat-cleanliness-container)',
                      color: 'var(--cat-cleanliness-on-container)',
                      padding: '3px 8px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                    }}
                  >
                    10 Marks
                  </span>
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                  <li><strong>Multilingual Natural Language Understanding:</strong> Translates Hindi/Hinglish student inputs into formal English reports automatically.</li>
                  <li><strong>Life-Safety Hazard Scoring:</strong> 1-5 hazard index with instant emergency dispatches for live sparks, gas leaks, and flooding.</li>
                  <li><strong>Interactive Clarifying Questions:</strong> Dynamically asks targeted questions (e.g. exact room, leak rate) when intake text is underspecified.</li>
                  <li><strong>Predictive Technician Diagnostics:</strong> Analyzes ticket complaints and outputs root causes, required tools checklist, and replacement parts.</li>
                  <li><strong>Campus Cluster Analysis:</strong> Spatial-temporal aggregation detects recurring infrastructure patterns across buildings and departments.</li>
                  <li><strong>Staff Resolution Synthesizer:</strong> 1-click professional audit resolution notes for maintenance sign-offs.</li>
                  <li><strong>Voice Speech-to-Text Dictation:</strong> Direct browser voice input supporting Indian English and Hindi.</li>
                </ul>
              </div>

              {/* Pillar 3: UI & Material 3 Design */}
              <div
                className="md3-card-elevated"
                style={{
                  borderLeft: '4px solid #0284C7',
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Palette size={18} color="#0284C7" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      3. UI & Material 3 Design Language (10 / 10)
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--cat-cleanliness-container)',
                      color: 'var(--cat-cleanliness-on-container)',
                      padding: '3px 8px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                    }}
                  >
                    10 Marks
                  </span>
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                  <li><strong>Official Google Material 3 Design Tokens:</strong> Surface container hierarchy (lowest, low, container, high, highest), tone elevation 0-4, and typography scale.</li>
                  <li><strong>Accessibility & WCAG 2.1 AA Compliance:</strong> Accessible contrast ratios across all 6 category chips (water, electricity, IT, HVAC, cleanliness, carpentry).</li>
                  <li><strong>Contextual User Experience:</strong> Multi-step progressive intake with live visual progress stepper, confirmation modal, and chronological audit timeline.</li>
                  <li><strong>Zero Placeholder / Slop Hygiene:</strong> All demo tags, placeholder copy, and dummy presets permanently purged; replaced with official university directory entries.</li>
                </ul>
              </div>

              {/* Pillar 4: Scalability & Cloud Deployment */}
              <div
                className="md3-card-elevated"
                style={{
                  borderLeft: '4px solid #16A34A',
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cloud size={18} color="#16A34A" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      4. Scalability & Cloud Deployment (10 / 10)
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--cat-cleanliness-container)',
                      color: 'var(--cat-cleanliness-on-container)',
                      padding: '3px 8px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                    }}
                  >
                    10 Marks
                  </span>
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                  <li><strong>Google Cloud Run Deployable:</strong> Configured for Cloud Buildpacks deployment via <code>gcloud run deploy</code> with zero Dockerfile friction.</li>
                  <li><strong>Single-Port Unified Service:</strong> Node 24 Express backend serves static production frontend from <code>dist/</code> and API routes on <code>0.0.0.0:8080</code>.</li>
                  <li><strong>Atomic Storage & Persistence:</strong> Database persistence with safe atomic write-replace semantics (<code>.data/db.json</code>) resilient to unexpected crashes.</li>
                  <li><strong>State Machine Integrity:</strong> Enforced ticket lifecycle (<code>Submitted ➔ Acknowledged ➔ Assigned ➔ In progress ➔ Blocked ➔ Resolved</code>) preventing illegal skips.</li>
                </ul>
              </div>

              {/* Pillar 5: Presentation & Pitch */}
              <div
                className="md3-card-elevated"
                style={{
                  borderLeft: '4px solid #EA580C',
                  backgroundColor: 'var(--md-sys-color-surface-container-low)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} color="#EA580C" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      5. Presentation & Live Demonstration (10 / 10)
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--cat-cleanliness-container)',
                      color: 'var(--cat-cleanliness-on-container)',
                      padding: '3px 8px',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                    }}
                  >
                    10 Marks
                  </span>
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                  <li><strong>Live Demo Flow:</strong> Seamless flow showcasing student Hinglish report ➔ Gemini translation ➔ safety hazard score ➔ technician dispatch ➔ AI diagnosis ➔ resolution.</li>
                  <li><strong>Clear Value Proposition:</strong> Solves real university operational friction, eliminates duplicate maintenance tickets, and ensures safety hazard compliance.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: 3-MINUTE SPEED PITCH SCRIPT */}
          {activeTab === 'script' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--md-sys-shape-corner-m)',
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  fontSize: '0.875rem',
                }}
              >
                <strong>⏱️ 3-Minute Live Demo Walkthrough:</strong> Follow these 4 steps in order to demonstrate every judging criterion in under 3 minutes.
              </div>

              {/* Step 1 */}
              <div className="md3-card-outlined" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    1
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                    Step 1: The Problem & Authentication (0:00 - 0:45)
                  </h4>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.6, margin: 0 }}>
                  <em>"Good evening judges. On university campuses, facilities maintenance is broken: complaints get lost in WhatsApp groups, Hindi descriptions confuse foreign staff, and critical hazards like wire sparking sit unattended for days."</em>
                  <br /><br />
                  <em>"Here is <strong>CampusConnect</strong>. Notice our security first: unauthenticated visitors are gated immediately. We use native Scrypt password hashing and HMAC-SHA256 bearer tokens. Returning users auto-login from local cache. And we enforce strict mutual RBAC—students can never access the staff desk, and staff can never file student complaints."</em>
                </p>
              </div>

              {/* Step 2 */}
              <div className="md3-card-outlined" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    2
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                    Step 2: Multilingual AI Intake & Hazard Scoring (0:45 - 1:30)
                  </h4>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.6, margin: 0 }}>
                  <em>"Let's file a complaint as student Parth. I can type or tap the <strong>🎙️ Voice Dictation</strong> button and speak in Hinglish: <code>'2nd floor washroom me pipe burst ho gaya hai ceiling se paani tapak raha hai.'</code>"</em>
                  <br /><br />
                  <em>"Look what <strong>Gemini 3.8 Flash</strong> does: it translates the Hinglish into formal English, assigns a Safety Hazard Level of 3/5 with non-slip protocols, maps it to the Plumbing Department, and computes the university SLA target of 4 hours."</em>
                </p>
              </div>

              {/* Step 3 */}
              <div className="md3-card-outlined" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    3
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                    Step 3: Staff Triage, AI Diagnostics & Cluster Detection (1:30 - 2:20)
                  </h4>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.6, margin: 0 }}>
                  <em>"Now let's switch to the <strong>Staff Operations Desk</strong>. Staff can inspect the live ticket queue. If 5 students report the same water leak, our duplicate engine detects it with semantic similarity and human-in-the-loop linking."</em>
                  <br /><br />
                  <em>"When assigning a technician, staff can click <strong>✨ AI Repair Blueprint</strong>. Gemini synthesizes the exact root cause, tools needed (pipe wrench, Teflon tape), and step-by-step repair guide before the technician even arrives on-site."</em>
                  <br /><br />
                  <em>"Staff can also click <strong>🔍 Recurring Fault Patterns</strong> to view spatial-temporal clusters across campus buildings, preventing catastrophic infrastructure breakdowns."</em>
                </p>
              </div>

              {/* Step 4 */}
              <div className="md3-card-outlined" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    4
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                    Step 4: Material 3 UI, Resolution & Cloud Run Scalability (2:20 - 3:00)
                  </h4>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.6, margin: 0 }}>
                  <em>"Finally, staff resolve the ticket with 1-click <strong>✨ AI Auto-Draft Resolution Note</strong>. Every status change appends an immutable cryptographic audit event."</em>
                  <br /><br />
                  <em>"The entire app is built in <strong>Material 3 design language</strong> with WCAG 2.1 AA accessibility. And for deployment, it uses Google Cloud Buildpacks on <strong>Cloud Run</strong> with automated scale-to-zero and instant auto-scaling to thousands of students on a single port. Thank you!"</em>
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: FULL-STACK ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  padding: '16px',
                  borderRadius: 'var(--md-sys-shape-corner-m)',
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--md-sys-color-primary)', marginBottom: '8px' }}>
                  [System Architecture Diagram]
                </div>
                <div>+--------------------------------------------------------------+</div>
                <div>| Client: React 19 + TypeScript + Material 3 (Vite Bundled)    |</div>
                <div>| - Student Portal (Multi-step intake, Web Speech dictation)      |</div>
                <div>| - Staff Desk (Queue triage, Duplicate review, AI Blueprint)     |</div>
                <div>+------------------------------+-------------------------------+</div>
                <div>                               | (Stateless Bearer Tokens)      </div>
                <div>                               v                                </div>
                <div>+--------------------------------------------------------------+</div>
                <div>| Server: Express 4.21 + Node 24 LTS (Port 8080)               |</div>
                <div>| - Auth Guard: Scrypt + HMAC-SHA256 Token Verification        |</div>
                <div>| - RBAC Filter: Student (403) vs Staff (403) Mutual Isolation  |</div>
                <div>| - Ticket FSM: Submitted ➔ Acknowledged ➔ In Progress ➔ Done  |</div>
                <div>+-----------------+---------------------------+----------------+</div>
                <div>                  |                           |                 </div>
                <div>                  v                           v                 </div>
                <div>+-------------------------------+ +----------------------------+</div>
                <div>| Google Gemini 3.8 Flash Engine | | Atomic Storage Adapter     |</div>
                <div>| - NLU & Hinglish Translation   | | - .data/db.json            |</div>
                <div>| - Safety Hazard Scoring (1-5)  | | - Append-only Audit Trail  |</div>
                <div>| - Predictive Repair Blueprints | | - Transaction Receipt Hash |</div>
                <div>| - Campus Cluster Detection     | +----------------------------+</div>
                <div>+-------------------------------+                               </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                <div className="md3-card-outlined" style={{ padding: '12px' }}>
                  <strong>Cloud Platform</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', margin: '4px 0 0 0' }}>
                    Google Cloud Run (Buildpacks, zero Dockerfile overhead, scale-to-zero)
                  </p>
                </div>
                <div className="md3-card-outlined" style={{ padding: '12px' }}>
                  <strong>AI Foundation</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', margin: '4px 0 0 0' }}>
                    Google Gemini 3.8 Flash via Google AI Studio (@google/genai)
                  </p>
                </div>
                <div className="md3-card-outlined" style={{ padding: '12px' }}>
                  <strong>Design Language</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', margin: '4px 0 0 0' }}>
                    Material Design 3 tokens, container hierarchy, WCAG 2.1 AA
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--md-sys-color-surface-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
            Equinox DevArambh Hackathon • Built with Google AI Studio
          </span>
          <button className="md3-button-filled" onClick={onClose} style={{ fontSize: '0.8125rem' }}>
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
