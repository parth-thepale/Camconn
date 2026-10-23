import {
  Ticket,
  TicketEvent,
  DraftAnalysis,
  LocationData,
  DuplicateCandidate,
  DuplicateReview,
  RoutingRule,
  StaffSummary,
  TicketStatus,
  Category,
  User,
  CheckoutSession,
  TechnicianDiagnosis,
  ClusterPattern,
} from './types.js';

const API_BASE = '/api';

// Auth Token management
export function getStoredToken(): string | null {
  return localStorage.getItem('campusconnect_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('campusconnect_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('campusconnect_token');
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Auth API
export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setStoredToken(data.token);
  return data;
}

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'staff' | 'admin';
  department?: string;
}): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  setStoredToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function fetchDemoAccounts(): Promise<Array<{ email: string; password: string; name: string; role: string }>> {
  const res = await fetch(`${API_BASE}/auth/demo-users`);
  const data = await res.json();
  return data.demoAccounts || [];
}

// System API
export async function fetchHealth(): Promise<{
  status: string;
  aiConfigured: boolean;
  stats: { totalTickets: number; activeRules: number };
}> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchRoutingRules(): Promise<RoutingRule[]> {
  const res = await fetch(`${API_BASE}/routing-rules`);
  const data = await res.json();
  return data.rules || [];
}

export async function fetchCampusLocations(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/campus-locations`);
  const data = await res.json();
  return data.locations || [];
}

// AI API
export async function generateAiDraft(params: {
  complaintText: string;
  location: LocationData;
  photoBase64?: string | null;
  answers?: Array<{ question: string; answer: string }>;
}): Promise<DraftAnalysis> {
  const res = await fetch(`${API_BASE}/ai/draft`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate AI draft');
  }
  return data.draft;
}

export async function fetchTechnicianDiagnosis(ticketId: string): Promise<TechnicianDiagnosis> {
  const res = await fetch(`${API_BASE}/ai/diagnose`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ticketId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch technician diagnosis');
  return data.diagnosis;
}

export async function fetchCampusClusters(): Promise<ClusterPattern[]> {
  const res = await fetch(`${API_BASE}/ai/patterns`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.clusters || [];
}

// Tickets API
export async function submitConfirmedTicket(params: {
  originalText: string;
  title: string;
  summary: string;
  category: Category;
  location: LocationData;
  photoUrl?: string | null;
  routingSuggestion: string;
  routingReason: string;
  clarifications?: Array<{ question: string; answer: string }>;
  urgencyLevel?: string;
  safetyWarning?: string | null;
  detectedLanguage?: string;
  translatedText?: string | null;
  priorityTier?: 'standard' | 'expedited_emergency';
  paymentStatus?: 'waived' | 'paid' | 'pending';
  checkoutReference?: string | null;
  createdBy?: string;
  creatorName?: string;
}): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit ticket');
  }
  return data.ticket;
}

export async function fetchMyTickets(studentId?: string): Promise<Ticket[]> {
  const query = studentId ? `?studentId=${studentId}` : '';
  const res = await fetch(`${API_BASE}/tickets/mine${query}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.tickets || [];
}

export async function fetchTicketDetails(
  id: string
): Promise<{ ticket: Ticket; events: TicketEvent[]; duplicateReviews: DuplicateReview[] }> {
  const res = await fetch(`${API_BASE}/tickets/${id}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ticket not found');
  }
  return data;
}

export async function fetchStaffTickets(filters?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<{ summary: StaffSummary; tickets: Ticket[] }> {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.category) query.set('category', filters.category);
  if (filters?.search) query.set('search', filters.search);

  const res = await fetch(`${API_BASE}/staff/tickets?${query.toString()}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data;
}

export async function updateTicketStatus(params: {
  ticketId: string;
  toStatus: TicketStatus;
  note: string;
  actorName?: string;
}): Promise<{ ticket: Ticket; event: TicketEvent }> {
  const res = await fetch(`${API_BASE}/staff/tickets/${params.ticketId}/status`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to transition status');
  }
  return data;
}

export async function assignTicket(params: {
  ticketId: string;
  assignedTo: string;
  note?: string;
}): Promise<{ ticket: Ticket; event: TicketEvent }> {
  const res = await fetch(`${API_BASE}/staff/tickets/${params.ticketId}/assignment`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to assign ticket');
  }
  return data;
}

export async function fetchTicketDuplicates(ticketId: string): Promise<DuplicateCandidate[]> {
  const res = await fetch(`${API_BASE}/staff/tickets/${ticketId}/duplicates`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.candidates || [];
}

export async function submitDuplicateReview(params: {
  ticketId: string;
  candidateTicketId: string;
  decision: 'same_issue' | 'separate_issue' | 'deferred';
  reason: string;
}): Promise<DuplicateReview> {
  const res = await fetch(`${API_BASE}/staff/duplicate-reviews`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to record review');
  }
  return data.review;
}

// Secure Checkout API
export async function createCheckoutSession(params: {
  ticketId?: string;
  ticketReference?: string;
  tier: 'standard' | 'expedited_emergency';
}): Promise<CheckoutSession> {
  const res = await fetch(`${API_BASE}/checkout/create-session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to initiate checkout session');
  return data.session;
}

export async function processPayment(params: {
  sessionId: string;
  paymentMethod: {
    type: 'campus_card' | 'credit_card' | 'upi';
    accountOrCard: string;
    holderName: string;
    expiry?: string;
    cvv?: string;
  };
}): Promise<{
  paymentReference: string;
  session: CheckoutSession;
  receipt: any;
}> {
  const res = await fetch(`${API_BASE}/checkout/process`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment processing failed');
  return data;
}

export async function resetDemoDataset(): Promise<void> {
  await fetch(`${API_BASE}/reset-demo`, { method: 'POST', headers: authHeaders() });
}
