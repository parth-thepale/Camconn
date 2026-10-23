export type Category = 'plumbing' | 'electricity' | 'cleanliness' | 'internet_connectivity';

export type TicketStatus =
  | 'Submitted'
  | 'Acknowledged'
  | 'Assigned'
  | 'In progress'
  | 'Blocked'
  | 'Resolved';

export type UserRole = 'student' | 'staff' | 'admin';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export const ALLOWED_CATEGORIES: Category[] = [
  'plumbing',
  'electricity',
  'cleanliness',
  'internet_connectivity',
];

export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  Submitted: ['Acknowledged', 'Assigned', 'In progress'],
  Acknowledged: ['Assigned', 'In progress', 'Resolved'],
  Assigned: ['In progress', 'Blocked', 'Resolved'],
  'In progress': ['Blocked', 'Resolved'],
  Blocked: ['Assigned', 'In progress', 'Resolved'],
  Resolved: [],
};

export interface LocationData {
  building: string;
  floor?: string;
  room?: string;
  zone?: string;
  details?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  token?: string;
}

export interface Ticket {
  id: string;
  reference: string;
  createdBy: string;
  creatorName: string;
  originalText: string;
  title: string;
  summary: string;
  category: Category;
  location: LocationData;
  status: TicketStatus;
  assignedTo: string | null;
  photoUrl?: string | null;
  routingSuggestion: string;
  routingReason: string;
  clarifications: Array<{ question: string; answer: string }>;
  duplicateOf: string | null;
  hasDuplicateCandidates: boolean;
  // Extended AI & Safety
  urgencyLevel: UrgencyLevel;
  safetyWarning?: string | null;
  detectedLanguage?: string;
  translatedText?: string | null;
  // Checkout & Priority
  paymentStatus: 'waived' | 'paid' | 'pending';
  checkoutReference?: string | null;
  priorityTier: 'standard' | 'expedited_emergency';
  createdAt: string;
  updatedAt: string;
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  type: 'CREATED' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'NOTE' | 'DUPLICATE_LINK' | 'PAYMENT_CHECKOUT';
  fromStatus?: TicketStatus;
  toStatus?: TicketStatus;
  actorId: string;
  actorName: string;
  actorRole: 'student' | 'staff' | 'admin' | 'system';
  note: string;
  isInternal: boolean;
  createdAt: string;
}

export interface DraftAnalysis {
  title: string;
  summary: string;
  category: Category;
  missingFields: string[];
  clarifyingQuestion: string | null;
  routingSuggestion: string;
  routingReason: string;
  confidence: number;
  urgencyLevel: UrgencyLevel;
  safetyWarning: string | null;
  detectedLanguage: string;
  translatedText: string | null;
}

export interface DuplicateCandidate {
  ticketId: string;
  reference: string;
  title: string;
  category: Category;
  location: LocationData;
  status: TicketStatus;
  createdAt: string;
  similarityScore: number;
  reason: string;
}

export interface DuplicateReview {
  id: string;
  ticketId: string;
  candidateTicketId: string;
  state: 'pending' | 'same_issue' | 'separate_issue' | 'deferred';
  reason: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface RoutingRule {
  id: string;
  category: Category;
  departmentLabel: string;
  sourceLabel: string;
  matchingTerms: string[];
  enabled: boolean;
  isDemo: boolean;
}

export interface StaffSummary {
  total: number;
  unassigned: number;
  inProgress: number;
  awaitingAction: number;
  resolved: number;
}

export interface CheckoutSession {
  id: string;
  ticketId?: string;
  ticketReference?: string;
  amount: number;
  currency: string;
  tier: 'standard' | 'expedited_emergency';
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  receiptHash: string;
  paidAt?: string;
  createdAt: string;
}

export interface TechnicianDiagnosis {
  likelyRootCause: string;
  recommendedTools: string[];
  replacementParts: string[];
  actionPlanSteps: string[];
  estimatedRepairMinutes: number;
}

export interface ClusterPattern {
  building: string;
  category: Category;
  ticketCount: number;
  patternSummary: string;
  systemicRisk: 'low' | 'medium' | 'high';
  recommendedAction: string;
}
