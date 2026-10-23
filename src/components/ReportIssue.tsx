import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  X,
  FileText,
  MapPin,
  Send,
  Loader2,
  RefreshCw,
  Globe,
  AlertTriangle,
  Zap,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { DraftAnalysis, LocationData, Ticket, Category, User } from '../types.js';
import { generateAiDraft, submitConfirmedTicket } from '../api.js';
import { CheckoutModal } from './CheckoutModal.js';

interface ReportIssueProps {
  campusLocations: string[];
  currentUser: User | null;
  onTicketCreated: (ticket: Ticket) => void;
  onRequestAuth: () => void;
}

export const ReportIssue: React.FC<ReportIssueProps> = ({
  campusLocations,
  currentUser,
  onTicketCreated,
  onRequestAuth,
}) => {
  // Step state: 1 = Form Input, 2 = AI Draft & Clarification, 3 = Confirmation, 4 = Receipt
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form inputs
  const [complaintText, setComplaintText] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [zone, setZone] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // AI draft state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draft, setDraft] = useState<DraftAnalysis | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [currentClarificationInput, setCurrentClarificationInput] = useState('');

  // Priority & Checkout state
  const [selectedTier, setSelectedTier] = useState<'standard' | 'expedited_emergency'>('standard');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutReceipt, setCheckoutReceipt] = useState<any | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Photo Picker
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 -> 2: Generate AI Draft
  const handleGenerateDraft = async () => {
    if (!complaintText.trim() || complaintText.length < 5) {
      setErrorMessage('Please describe the issue in at least a few words.');
      return;
    }
    if (!building) {
      setErrorMessage('Please select a campus building.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);

    try {
      const location: LocationData = {
        building,
        floor: floor.trim() || undefined,
        room: room.trim() || undefined,
        zone: zone.trim() || undefined,
      };

      const analysis = await generateAiDraft({
        complaintText,
        location,
        photoBase64: photoPreview,
        answers: clarificationAnswers,
      });

      setDraft(analysis);
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze complaint.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2 Clarification Answer
  const handleAnswerClarification = async () => {
    if (!currentClarificationInput.trim() || !draft?.clarifyingQuestion) return;

    const updatedAnswers = [
      ...clarificationAnswers,
      { question: draft.clarifyingQuestion, answer: currentClarificationInput.trim() },
    ];
    setClarificationAnswers(updatedAnswers);
    setCurrentClarificationInput('');
    setIsAnalyzing(true);

    try {
      const location: LocationData = {
        building,
        floor: floor.trim() || undefined,
        room: room.trim() || undefined,
        zone: zone.trim() || undefined,
      };

      const analysis = await generateAiDraft({
        complaintText,
        location,
        photoBase64: photoPreview,
        answers: updatedAnswers,
      });

      setDraft(analysis);
    } catch (err: any) {
      setErrorMessage('Failed to process clarification answer.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 3 -> 4: Final Submit
  const handleConfirmAndSubmit = async () => {
    if (!draft) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const location: LocationData = {
        building,
        floor: floor.trim() || undefined,
        room: room.trim() || undefined,
        zone: zone.trim() || undefined,
      };

      const ticket = await submitConfirmedTicket({
        originalText: complaintText,
        title: draft.title,
        summary: draft.summary,
        category: draft.category,
        location,
        photoUrl: photoPreview,
        routingSuggestion: draft.routingSuggestion,
        routingReason: draft.routingReason,
        clarifications: clarificationAnswers,
        urgencyLevel: draft.urgencyLevel,
        safetyWarning: draft.safetyWarning,
        detectedLanguage: draft.detectedLanguage,
        translatedText: draft.translatedText,
        priorityTier: selectedTier,
        paymentStatus: selectedTier === 'expedited_emergency' && checkoutReceipt ? 'paid' : 'waived',
        checkoutReference: checkoutReceipt?.transactionId || null,
        createdBy: currentUser?.id || 'student-ananya',
        creatorName: currentUser?.name || 'Ananya Sharma (Student)',
      });

      setCreatedTicket(ticket);
      setCurrentStep(4);
      onTicketCreated(ticket);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit confirmed ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewReport = () => {
    setComplaintText('');
    setBuilding('');
    setFloor('');
    setRoom('');
    setZone('');
    setPhotoPreview(null);
    setDraft(null);
    setClarificationAnswers([]);
    setCurrentClarificationInput('');
    setCreatedTicket(null);
    setSelectedTier('standard');
    setCheckoutReceipt(null);
    setCurrentStep(1);
    setErrorMessage(null);
  };

  const getCategoryClass = (cat: Category) => {
    return `md3-chip chip-${cat}`;
  };

  const getUrgencyBadge = (level: string) => {
    if (level === 'critical') {
      return (
        <span style={{ backgroundColor: '#BA1A1A', color: '#FFF', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
          🚨 CRITICAL HAZARD
        </span>
      );
    }
    if (level === 'high') {
      return (
        <span style={{ backgroundColor: '#FFE082', color: '#5D4037', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
          ⚠️ HIGH PRIORITY
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#ECEEF4', color: '#43474E', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
        STANDARD ({level.toUpperCase()})
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Stepper Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          padding: '0 8px',
        }}
      >
        {[
          { num: 1, label: 'Describe Issue' },
          { num: 2, label: 'AI Clarification' },
          { num: 3, label: 'Review & Confirm' },
          { num: 4, label: 'Ticket Receipt' },
        ].map((step, idx) => (
          <div
            key={step.num}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color:
                currentStep >= step.num
                  ? 'var(--md-sys-color-primary)'
                  : 'var(--md-sys-color-outline)',
              fontWeight: currentStep === step.num ? 600 : 500,
              fontSize: '0.875rem',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor:
                  currentStep >= step.num
                    ? 'var(--md-sys-color-primary)'
                    : 'var(--md-sys-color-surface-variant)',
                color:
                  currentStep >= step.num
                    ? 'var(--md-sys-color-on-primary)'
                    : 'var(--md-sys-color-on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <span style={{ display: idx === 0 || idx === 3 ? 'inline' : 'none' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div
          style={{
            backgroundColor: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            padding: '12px 16px',
            borderRadius: 'var(--md-sys-shape-corner-m)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: INTAKE FORM */}
      {currentStep === 1 && (
        <div className="md3-card-elevated">
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '4px',
              }}
            >
              Report a Campus Maintenance Concern
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-outline)' }}>
              Type naturally in English or Hindi/Hinglish. Gemini 3.8 Flash automatically translates,
              assesses hazard urgency, and extracts structured fields.
            </p>
          </div>

          {/* Natural Language Complaint Text Area */}
          <div className="md3-textfield">
            <label className="md3-label">
              What seems to be the problem? <span style={{ color: 'var(--md-sys-color-error)' }}>*</span>
            </label>
            <textarea
              className="md3-textarea"
              rows={4}
              placeholder="e.g. Water is leaking from the ceiling near Lab 2... or '2nd floor washroom me paani tapak raha hai ceiling se...'"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
              <span>Includes auto-translation & safety hazard analysis</span>
              <span>English & Hindi supported</span>
            </div>
          </div>

          {/* Location Selection */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div className="md3-textfield">
              <label className="md3-label">
                Campus Building <span style={{ color: 'var(--md-sys-color-error)' }}>*</span>
              </label>
              <select
                className="md3-select"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
              >
                <option value="">-- Choose Building --</option>
                {campusLocations.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="md3-textfield">
              <label className="md3-label">Floor</label>
              <input
                type="text"
                className="md3-input"
                placeholder="e.g. Ground, 2nd Floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>

            <div className="md3-textfield">
              <label className="md3-label">Room / Corridor / Zone</label>
              <input
                type="text"
                className="md3-input"
                placeholder="e.g. Room 204 or East Wing"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
          </div>

          {/* Optional Photo Attachment */}
          <div style={{ marginBottom: '24px' }}>
            <label className="md3-label" style={{ display: 'block', marginBottom: '8px' }}>
              Photograph (Optional)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label
                className="md3-button-outlined"
                style={{ cursor: 'pointer', display: 'inline-flex' }}
              >
                <Camera size={18} />
                <span>Upload / Take Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />
              </label>

              {photoPreview && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={photoPreview}
                    alt="Uploaded preview"
                    style={{
                      width: '64px',
                      height: '64px',
                      objectFit: 'cover',
                      borderRadius: 'var(--md-sys-shape-corner-m)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      backgroundColor: 'var(--md-sys-color-error)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="md3-button-filled"
              onClick={handleGenerateDraft}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Analyzing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Analyze & Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI DRAFT & CLARIFICATION */}
      {currentStep === 2 && draft && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* AI Extraction Proposal Card */}
          <div className="md3-card-elevated">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid var(--md-sys-color-surface-variant)',
                paddingBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--md-sys-color-primary)" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>AI Structured Extraction</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getUrgencyBadge(draft.urgencyLevel)}
                <span className={getCategoryClass(draft.category)}>
                  {draft.category.toUpperCase().replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Safety Hazard Warning */}
            {draft.safetyWarning && (
              <div
                style={{
                  backgroundColor: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  padding: '12px 16px',
                  borderRadius: 'var(--md-sys-shape-corner-m)',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={20} />
                <span>{draft.safetyWarning}</span>
              </div>
            )}

            {/* Multilingual Translation Notice */}
            {draft.detectedLanguage !== 'English' && draft.translatedText && (
              <div
                style={{
                  backgroundColor: 'var(--cat-internet-container)',
                  color: 'var(--cat-internet-on-container)',
                  padding: '10px 14px',
                  borderRadius: 'var(--md-sys-shape-corner-m)',
                  marginBottom: '14px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Globe size={16} />
                <span>
                  Detected <strong>{draft.detectedLanguage}</strong>. Translated to English: "{draft.translatedText}"
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Proposed Title
                </span>
                <p style={{ fontSize: '1.0625rem', fontWeight: 600, marginTop: '2px' }}>
                  {draft.title}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Actionable Summary
                </span>
                <p style={{ fontSize: '0.9375rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                  {draft.summary}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  padding: '12px 16px',
                  borderRadius: 'var(--md-sys-shape-corner-m)',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
                  🏛️ Routing: {draft.routingSuggestion}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--md-sys-color-outline)' }}>
                  {draft.routingReason}
                </div>
              </div>
            </div>
          </div>

          {/* Clarification Dialogue Card */}
          {draft.clarifyingQuestion ? (
            <div
              className="md3-card-outlined"
              style={{
                borderColor: 'var(--md-sys-color-primary)',
                backgroundColor: 'rgba(0, 99, 155, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <HelpCircle size={20} color="var(--md-sys-color-primary)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--md-sys-color-primary)' }}>
                  Missing Detail Needed
                </h4>
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--md-sys-color-on-surface)', marginBottom: '16px' }}>
                {draft.clarifyingQuestion}
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="md3-input"
                  style={{ flex: 1 }}
                  placeholder="Type your response here..."
                  value={currentClarificationInput}
                  onChange={(e) => setCurrentClarificationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAnswerClarification();
                  }}
                />
                <button
                  className="md3-button-filled"
                  onClick={handleAnswerClarification}
                  disabled={isAnalyzing || !currentClarificationInput.trim()}
                >
                  {isAnalyzing ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
                  <span>Answer</span>
                </button>
              </div>

              {clarificationAnswers.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--md-sys-color-outline-variant)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>
                    Previous Clarifications:
                  </span>
                  {clarificationAnswers.map((a, i) => (
                    <div key={i} style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                      <strong>Q:</strong> {a.question} <br />
                      <strong>A:</strong> {a.answer}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--cat-cleanliness-container)',
                color: 'var(--cat-cleanliness-on-container)',
                padding: '12px 16px',
                borderRadius: 'var(--md-sys-shape-corner-m)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.875rem',
              }}
            >
              <CheckCircle size={18} />
              <span>All essential details present! Ready for final review.</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <button className="md3-button-text" onClick={() => setCurrentStep(1)}>
              Back to Edit
            </button>
            <button className="md3-button-filled" onClick={() => setCurrentStep(3)} disabled={isAnalyzing}>
              <span>Proceed to Confirmation</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRMATION REVIEW & CHECKOUT CARD */}
      {currentStep === 3 && draft && (
        <div className="md3-card-elevated">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>
              Confirm Your Complaint Submission
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-outline)' }}>
              Verify the report details and select service dispatch tier.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: 'var(--md-sys-color-surface-container-lowest)',
              padding: '20px',
              borderRadius: 'var(--md-sys-shape-corner-l)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              marginBottom: '24px',
            }}
          >
            {/* Student's Original Text vs AI Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', padding: '16px', borderRadius: 'var(--md-sys-shape-corner-m)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--md-sys-color-outline)', marginBottom: '4px' }}>
                  Your Original Words ({draft.detectedLanguage})
                </div>
                <p style={{ fontSize: '0.9375rem' }}>"{complaintText}"</p>
              </div>

              <div style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', padding: '16px', borderRadius: 'var(--md-sys-shape-corner-m)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> AI Extraction Title & Summary
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '4px' }}>
                  {draft.title}
                </div>
                <p style={{ fontSize: '0.875rem' }}>{draft.summary}</p>
              </div>
            </div>

            {/* Service Priority Selector */}
            <div style={{ paddingTop: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Choose Dispatch Level & Checkout Tier
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  className="md3-card-outlined"
                  onClick={() => setSelectedTier('standard')}
                  style={{
                    cursor: 'pointer',
                    padding: '12px',
                    borderColor: selectedTier === 'standard' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                    backgroundColor: selectedTier === 'standard' ? 'rgba(0, 99, 155, 0.05)' : '#FFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.875rem' }}>Standard Campus Plan</strong>
                    <span style={{ color: 'var(--cat-cleanliness-color)', fontWeight: 700 }}>₹0 FREE</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                    Normal maintenance rotation
                  </span>
                </div>

                <div
                  className="md3-card-outlined"
                  onClick={() => setSelectedTier('expedited_emergency')}
                  style={{
                    cursor: 'pointer',
                    padding: '12px',
                    borderColor: selectedTier === 'expedited_emergency' ? 'var(--cat-electricity-color)' : 'var(--md-sys-color-outline-variant)',
                    backgroundColor: selectedTier === 'expedited_emergency' ? 'var(--cat-electricity-container)' : '#FFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Zap size={13} color="#D97706" /> Rapid Dispatch
                    </strong>
                    <span style={{ color: '#B45309', fontWeight: 700 }}>₹499</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cat-electricity-on-container)' }}>
                    Guaranteed 60-min emergency response
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="md3-button-text" onClick={() => setCurrentStep(2)}>
              Back to Clarification
            </button>
            <button
              className="md3-button-filled"
              onClick={handleConfirmAndSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>
                    {selectedTier === 'expedited_emergency' ? 'Submit & Proceed to Checkout' : 'Confirm & Submit Ticket'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RECEIPT */}
      {currentStep === 4 && createdTicket && (
        <div className="md3-card-elevated" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--cat-cleanliness-container)',
              color: 'var(--cat-cleanliness-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>
            Ticket Submitted Successfully!
          </h2>
          <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.9375rem', marginBottom: '24px' }}>
            Your concern is logged in the facilities lifecycle database.
          </p>

          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              padding: '16px 32px',
              borderRadius: 'var(--md-sys-shape-corner-l)',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--md-sys-color-outline)', display: 'block', marginBottom: '4px' }}>
              Official Tracking Reference
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--md-sys-color-primary)', fontFamily: 'monospace' }}>
              {createdTicket.reference}
            </span>
          </div>

          {/* Checkout Status / Action */}
          <div style={{ marginBottom: '28px' }}>
            {createdTicket.paymentStatus === 'paid' ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--cat-cleanliness-container)',
                  color: 'var(--cat-cleanliness-on-container)',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <BadgeCheck size={16} />
                <span>Priority Emergency Checkout Paid (Ref: {createdTicket.checkoutReference})</span>
              </div>
            ) : selectedTier === 'expedited_emergency' ? (
              <div>
                <button className="md3-button-filled" onClick={() => setIsCheckoutOpen(true)}>
                  <CreditCard size={16} />
                  <span>Complete Secure Checkout for Rapid Response (₹499)</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.8125rem',
                  color: 'var(--md-sys-color-outline)',
                }}
              >
                <ShieldCheck size={16} />
                <span>Standard Student Plan • Campus Fee Waived (₹0)</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="md3-button-tonal" onClick={handleStartNewReport}>
              <RefreshCw size={16} />
              <span>Submit Another Complaint</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && createdTicket && (
        <CheckoutModal
          ticket={createdTicket}
          onClose={() => setIsCheckoutOpen(false)}
          onPaymentCompleted={(receipt) => {
            setCheckoutReceipt(receipt);
            setCreatedTicket((prev) => (prev ? { ...prev, paymentStatus: 'paid', checkoutReference: receipt.transactionId } : null));
            setIsCheckoutOpen(false);
          }}
        />
      )}
    </div>
  );
};
