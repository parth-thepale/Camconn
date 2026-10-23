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
} from './types.js';

const API_BASE = '/api';

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

export async function generateAiDraft(params: {
  complaintText: string;
  location: LocationData;
  photoBase64?: string | null;
  answers?: Array<{ question: string; answer: string }>;
}): Promise<DraftAnalysis> {
  const res = await fetch(`${API_BASE}/ai/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate AI draft');
  }
  return data.draft;
}

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
  createdBy?: string;
  creatorName?: string;
}): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit ticket');
  }
  return data.ticket;
}

export async function fetchMyTickets(studentId = 'student-current'): Promise<Ticket[]> {
  const res = await fetch(`${API_BASE}/tickets/mine?studentId=${studentId}`);
  const data = await res.json();
  return data.tickets || [];
}

export async function fetchTicketDetails(
  id: string
): Promise<{ ticket: Ticket; events: TicketEvent[]; duplicateReviews: DuplicateReview[] }> {
  const res = await fetch(`${API_BASE}/tickets/${id}`);
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

  const res = await fetch(`${API_BASE}/staff/tickets?${query.toString()}`);
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to assign ticket');
  }
  return data;
}

export async function fetchTicketDuplicates(ticketId: string): Promise<DuplicateCandidate[]> {
  const res = await fetch(`${API_BASE}/staff/tickets/${ticketId}/duplicates`);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to record review');
  }
  return data.review;
}

export async function resetDemoDataset(): Promise<void> {
  await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
}
