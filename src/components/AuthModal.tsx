import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Shield, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { User as UserType } from '../types.js';
import { loginUser, registerUser, fetchDemoAccounts } from '../api.js';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'staff' | 'admin'>('student');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchDemoAccounts().then(setDemoAccounts).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(email, password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await registerUser({
          email,
          password,
          name,
          role,
          department: department.trim() || undefined,
        });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (acc: any) => {
    setEmail(acc.email);
    setPassword(acc.password);
    loginUser(acc.email, acc.password)
      .then((res) => {
        onAuthSuccess(res.user);
        onClose();
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className="md3-dialog-backdrop">
      <div className="md3-dialog" style={{ maxWidth: '480px' }}>
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
            <Lock size={20} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {mode === 'login' ? 'Sign In to CampusConnect' : 'Create Campus Account'}
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

        {/* 1-Click Demo Profiles */}
        <div
          style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            padding: '12px 16px',
            borderRadius: 'var(--md-sys-shape-corner-m)',
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ 1-Click Demo Profiles (Pre-Authenticated)
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="md3-button-tonal"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
                onClick={() => handleQuickLogin(acc)}
              >
                <span>{acc.name} ({acc.role})</span>
              </button>
            ))}
          </div>
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
                <label className="md3-label">Role</label>
                <select
                  className="md3-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="student">Student Reporter</option>
                  <option value="staff">Facilities Maintenance Staff</option>
                  <option value="admin">Administrator / Lead</option>
                </select>
              </div>

              <div className="md3-textfield">
                <label className="md3-label">Department / Major</label>
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
            <label className="md3-label">Campus Email</label>
            <input
              type="email"
              className="md3-input"
              required
              placeholder="e.g. student@campus.edu"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="submit"
              className="md3-button-filled"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Register Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="md3-button-text"
            style={{ fontSize: '0.8125rem' }}
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login'
              ? "Don't have an account? Register here"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
