import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../services/storage.js';
import { ticketService } from '../services/ticketService.js';
import { duplicateService } from '../services/duplicateService.js';
import { Category, TicketStatus } from '../types.js';
import { requireAuth, AuthenticatedRequest } from '../services/auth.js';

export const staffRouter = Router();

// Strict server-side security: ONLY staff and admin accounts can access the staff desk
staffRouter.use(requireAuth(['staff', 'admin']));

/**
 * GET /api/staff/tickets
 * Staff triage queue with filters, search, and operational counters
 */
staffRouter.get('/tickets', (req: AuthenticatedRequest, res) => {
  const { status, category, search } = req.query;

  let list = storage.getTickets();

  // Metrics summary
  const summary = {
    total: list.length,
    unassigned: list.filter((t) => !t.assignedTo && t.status !== 'Resolved').length,
    inProgress: list.filter((t) => t.status === 'In progress').length,
    awaitingAction: list.filter((t) => t.status === 'Submitted' || t.status === 'Acknowledged').length,
    resolved: list.filter((t) => t.status === 'Resolved').length,
  };

  // Filter by status
  if (status && status !== 'all') {
    list = list.filter((t) => t.status.toLowerCase() === (status as string).toLowerCase());
  }

  // Filter by category
  if (category && category !== 'all') {
    list = list.filter((t) => t.category === (category as Category));
  }

  // Search by reference or keyword
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (t) =>
        t.reference.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.location.building.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    summary,
    tickets: list,
  });
});

/**
 * PATCH /api/staff/tickets/:id/assignment
 * Assign or reassign ticket to maintenance technician
 */
const AssignmentSchema = z.object({
  assignedTo: z.string().min(2),
  note: z.string().optional(),
});

staffRouter.patch('/tickets/:id/assignment', (req: AuthenticatedRequest, res) => {
  const parsed = AssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid assignment payload', details: parsed.error.issues });
    return;
  }

  try {
    const result = ticketService.assignTicket({
      ticketId: req.params.id,
      assignedTo: parsed.data.assignedTo,
      actorId: req.user?.id || 'staff-admin',
      actorName: req.user?.name || 'Facilities Operations',
      actorRole: req.user?.role || 'staff',
      note: parsed.data.note,
    });

    res.json({
      success: true,
      ticket: result.ticket,
      event: result.event,
    });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Assignment failed' });
  }
});

/**
 * POST /api/staff/tickets/:id/status
 * Update status with finite state machine validation and event logging
 */
const StatusTransitionSchema = z.object({
  toStatus: z.enum([
    'Submitted',
    'Acknowledged',
    'Assigned',
    'In progress',
    'Blocked',
    'Resolved',
  ]),
  note: z.string().min(3, 'A status transition requires an explanation note'),
});

staffRouter.post('/tickets/:id/status', (req: AuthenticatedRequest, res) => {
  const parsed = StatusTransitionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid status transition input',
      details: parsed.error.issues.map((i) => i.message),
    });
    return;
  }

  try {
    const result = ticketService.transitionStatus({
      ticketId: req.params.id,
      toStatus: parsed.data.toStatus as TicketStatus,
      note: parsed.data.note,
      actorId: req.user?.id || 'staff-admin',
      actorName: req.user?.name || 'Facilities Operations',
      actorRole: req.user?.role || 'staff',
    });

    res.json({
      success: true,
      ticket: result.ticket,
      event: result.event,
    });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Status transition failed' });
  }
});

/**
 * GET /api/staff/tickets/:id/duplicates
 * Get bounded candidate duplicates for human staff review
 */
staffRouter.get('/tickets/:id/duplicates', (_req: AuthenticatedRequest, res) => {
  try {
    const candidates = duplicateService.findCandidates(_req.params.id);
    res.json({
      success: true,
      candidates,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to detect duplicates' });
  }
});

/**
 * POST /api/staff/duplicate-reviews
 * Human staff review decision: record review and link tickets safely
 */
const DuplicateReviewSchema = z.object({
  ticketId: z.string(),
  candidateTicketId: z.string(),
  decision: z.enum(['same_issue', 'separate_issue', 'deferred']),
  reason: z.string().min(3),
});

staffRouter.post('/duplicate-reviews', (req: AuthenticatedRequest, res) => {
  const parsed = DuplicateReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid review payload', details: parsed.error.issues });
    return;
  }

  try {
    const review = duplicateService.recordReview({
      ticketId: parsed.data.ticketId,
      candidateTicketId: parsed.data.candidateTicketId,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
      reviewerId: req.user?.id || 'staff-admin',
      reviewerName: req.user?.name || 'Facilities Operations',
    });
    res.json({
      success: true,
      review,
    });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to record review' });
  }
});
