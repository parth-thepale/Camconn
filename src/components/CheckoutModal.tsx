import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  Zap,
  Lock,
  ArrowRight,
  Loader2,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Ticket } from '../types.js';
import { createCheckoutSession, processPayment } from '../api.js';

interface CheckoutModalProps {
  ticket: Ticket;
  onClose: () => void;
  onPaymentCompleted: (receipt: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  ticket,
  onClose,
  onPaymentCompleted,
}) => {
  const [tier, setTier] = useState<'standard' | 'expedited_emergency'>('standard');
  const [paymentType, setPaymentType] = useState<'campus_card' | 'credit_card' | 'upi'>('campus_card');
  const [accountOrCard, setAccountOrCard] = useState('STUDENT-2024-8841');
  const [holderName, setHolderName] = useState(ticket.creatorName || 'Student Account');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('782');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  const amount = tier === 'expedited_emergency' ? 499 : 0;

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create session
      const session = await createCheckoutSession({
        ticketId: ticket.id,
        ticketReference: ticket.reference,
        tier,
      });

      // 2. Process payment
      const result = await processPayment({
        sessionId: session.id,
        paymentMethod: {
          type: paymentType,
          accountOrCard,
          holderName,
          expiry: paymentType === 'credit_card' ? expiry : undefined,
          cvv: paymentType === 'credit_card' ? cvv : undefined,
        },
      });

      setCompletedReceipt(result.receipt);
      onPaymentCompleted(result.receipt);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md3-dialog-backdrop">
      <div className="md3-dialog" style={{ maxWidth: '580px' }}>
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
            <ShieldCheck size={22} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              Secure Ticket Checkout & Service Tiers
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

        {completedReceipt ? (
          /* Receipt Screen */
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--cat-cleanliness-container)',
                color: 'var(--cat-cleanliness-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <BadgeCheck size={36} />
            </div>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
              Checkout Verified & Confirmed!
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-outline)', marginBottom: '20px' }}>
              Service level attached to ticket <strong>{ticket.reference}</strong>
            </p>

            <div
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                padding: '16px',
                borderRadius: 'var(--md-sys-shape-corner-m)',
                textAlign: 'left',
                fontSize: '0.8125rem',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-outline)' }}>Transaction Reference:</span>
                <strong style={{ fontFamily: 'monospace' }}>{completedReceipt.transactionId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-outline)' }}>Service Tier:</span>
                <strong>{completedReceipt.tier}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-outline)' }}>Amount:</span>
                <strong>
                  {completedReceipt.amount === 0 ? '₹0.00 (Campus Waived)' : `₹${completedReceipt.amount}.00`}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-outline)' }}>Digital Verification Hash:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {completedReceipt.verificationHash}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-outline)' }}>Timestamp:</span>
                <span>{new Date(completedReceipt.paidAt).toLocaleString()}</span>
              </div>
            </div>

            <button className="md3-button-filled" onClick={onClose} style={{ width: '100%' }}>
              Return to Ticket
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleProcessCheckout}>
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

            {/* Service Tier Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label className="md3-label" style={{ display: 'block', marginBottom: '8px' }}>
                Select Response Priority Tier
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  className="md3-card-outlined"
                  onClick={() => setTier('standard')}
                  style={{
                    cursor: 'pointer',
                    padding: '14px',
                    borderColor:
                      tier === 'standard'
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-outline-variant)',
                    backgroundColor:
                      tier === 'standard'
                        ? 'rgba(0, 99, 155, 0.05)'
                        : 'var(--md-sys-color-surface-container-lowest)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Standard Campus Plan</span>
                    <span style={{ fontWeight: 700, color: 'var(--cat-cleanliness-color)' }}>FREE</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                    Covered by campus welfare. Standard dispatch queue within regular maintenance hours.
                  </p>
                </div>

                <div
                  className="md3-card-outlined"
                  onClick={() => setTier('expedited_emergency')}
                  style={{
                    cursor: 'pointer',
                    padding: '14px',
                    borderColor:
                      tier === 'expedited_emergency'
                        ? 'var(--cat-electricity-color)'
                        : 'var(--md-sys-color-outline-variant)',
                    backgroundColor:
                      tier === 'expedited_emergency'
                        ? 'var(--cat-electricity-container)'
                        : 'var(--md-sys-color-surface-container-lowest)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={14} color="#D97706" /> Rapid Response
                    </span>
                    <span style={{ fontWeight: 700, color: '#B45309' }}>₹499</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cat-electricity-on-container)' }}>
                    Guaranteed 60-min emergency technician dispatch with priority spare parts allocation.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label className="md3-label" style={{ display: 'block', marginBottom: '8px' }}>
                Payment & Billing Channel
              </label>
              <div className="md3-segmented-button-group" style={{ width: '100%', display: 'flex' }}>
                <button
                  type="button"
                  className={`md3-segment ${paymentType === 'campus_card' ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setPaymentType('campus_card')}
                >
                  Campus ID Card
                </button>
                <button
                  type="button"
                  className={`md3-segment ${paymentType === 'credit_card' ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setPaymentType('credit_card')}
                >
                  Debit/Credit Card
                </button>
                <button
                  type="button"
                  className={`md3-segment ${paymentType === 'upi' ? 'active' : ''}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setPaymentType('upi')}
                >
                  Instant UPI
                </button>
              </div>
            </div>

            {/* Inputs based on payment method */}
            {paymentType === 'campus_card' && (
              <div className="md3-textfield">
                <label className="md3-label">Student Campus Card ID Number</label>
                <input
                  type="text"
                  className="md3-input"
                  required
                  value={accountOrCard}
                  onChange={(e) => setAccountOrCard(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                  Auto-validated against student registry database.
                </span>
              </div>
            )}

            {paymentType === 'credit_card' && (
              <>
                <div className="md3-textfield">
                  <label className="md3-label">Card Number</label>
                  <input
                    type="text"
                    className="md3-input"
                    required
                    placeholder="4532 •••• •••• 8821"
                    value={accountOrCard}
                    onChange={(e) => setAccountOrCard(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="md3-textfield">
                    <label className="md3-label">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      className="md3-input"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                    />
                  </div>
                  <div className="md3-textfield">
                    <label className="md3-label">CVV</label>
                    <input
                      type="password"
                      className="md3-input"
                      maxLength={4}
                      required
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {paymentType === 'upi' && (
              <div className="md3-textfield">
                <label className="md3-label">Virtual Payment Address (UPI ID)</label>
                <input
                  type="text"
                  className="md3-input"
                  required
                  placeholder="student@okhdfcbank"
                  value={accountOrCard}
                  onChange={(e) => setAccountOrCard(e.target.value)}
                />
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <button
                type="submit"
                className="md3-button-filled"
                style={{ width: '100%', padding: '12px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Processing Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>
                      {amount === 0 ? 'Confirm Free Student Dispatch (₹0)' : `Authorize & Pay ₹${amount}.00`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
