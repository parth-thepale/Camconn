import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, Building2, ArrowRight, Loader2, ShieldCheck, Check } from 'lucide-react';
import { User, UserRole } from '../types.js';
import { loginUser, registerUser, setStoredToken, clearStoredToken } from '../api.js';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(email.trim(), password);
        if (rememberMe) {
          setStoredToken(res.token);
        } else {
          sessionStorage.setItem('campusconnect_token', res.token);
          clearStoredToken();
        }
        onAuthSuccess(res.user);
      } else {
        const res = await registerUser({
          email: email.trim(),
          password,
          name: name.trim(),
          role,
          department: department.trim() || undefined,
        });
        if (rememberMe) {
          setStoredToken(res.token);
        } else {
          sessionStorage.setItem('campusconnect_token', res.token);
          clearStoredToken();
        }
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--md-sys-color-background)',
        padding: '24px 16px',
      }}
    >
      <div
        className="md3-card-elevated"
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          padding: '36px 32px',
          borderRadius: 'var(--md-sys-shape-corner-xl)',
          boxShadow: 'var(--md-sys-elevation-3)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--md-sys-shape-corner-l)',
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: 'var(--md-sys-elevation-2)',
            }}
          >
            <Building2 size={30} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--md-sys-color-on-surface)' }}>
            CampusConnect
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-outline)', marginTop: '4px' }}>
            University Facilities Management & Triage Portal
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          className="md3-segmented-button-group"
          style={{ width: '100%', display: 'flex', marginBottom: '24px' }}
        >
          <button
            type="button"
            className={`md3-segment ${mode === 'login' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`md3-segment ${mode === 'register' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
              padding: '12px 16px',
              borderRadius: 'var(--md-sys-shape-corner-m)',
              marginBottom: '20px',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="md3-textfield">
                <label className="md3-label">Full Name</label>
                <input
                  type="text"
                  className="md3-input"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="md3-textfield">
                <label className="md3-label">Portal Account Role</label>
                <select
                  className="md3-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="student">Student (Fault Reporting & Tracking)</option>
                  <option value="staff">Facilities Staff (Operations & Triage Desk)</option>
                  <option value="admin">Administrator (Campus Operations)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                  Students access student intake; staff access the operational dispatch queue.
                </span>
              </div>

              <div className="md3-textfield">
                <label className="md3-label">Department / Faculty</label>
                <input
                  type="text"
                  className="md3-input"
                  placeholder="e.g. Electrical Engineering or Estates"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="md3-textfield">
            <label className="md3-label">Campus or Institutional Email</label>
            <input
              type="email"
              className="md3-input"
              required
              placeholder="e.g. yourname@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="md3-textfield">
            <label className="md3-label">Password</label>
            <input
              type="password"
              className="md3-input"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              fontSize: '0.8125rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          <button
            type="submit"
            className="md3-button-filled"
            style={{ width: '100%', padding: '14px', fontSize: '0.9375rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-outline)' }}>
            Strict role-based isolation: Student and Facilities staff portals are mutually exclusive.
          </p>
        </div>
      </div>
    </div>
  );
};
