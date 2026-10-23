import { Router } from 'express';
import { z } from 'zod';
import { ticketService } from '../services/ticketService.js';
import { storage } from '../services/storage.js';
import { duplicateService } from '../services/duplicateService.js';
import { requireAuth, AuthenticatedRequest } from '../services/auth.js';

export const ticketRouter = Router();

const CreateTicketSchema = z.object({
  originalText: z.string().min(5),
  title: z.string().min(3),
  summary: z.string().min(5),
  category: z.enum(['plumbing', 'electricity', 'cleanliness', 'internet_connectivity']),
  location: z.object({
    building: z.string(),
    floor: z.string().optional(),
    room: z.string().optional(),
    zone: z.string().optional(),
    details: z.string().optional(),
  }),
  photoUrl: z.string().nullable().optional(),
  routingSuggestion: z.string(),
  routingReason: z.string(),
  clarifications: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional()
    .default([]),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  safetyWarning: z.string().nullable().optional(),
  detectedLanguage: z.string().optional(),
  translatedText: z.string().nullable().optional(),
  priorityTier: z.enum(['standard', 'expedited_emergency']).optional(),
  paymentStatus: z.enum(['waived', 'paid', 'pending']).optional(),
  checkoutReference: z.string().nullable().optional(),
});

/**
 * POST /api/tickets
 * Create a confirmed ticket - Strictly student role
 */
ticketRouter.post('/', requireAuth(['student']), (req: AuthenticatedRequest, res) => {
  const parsed = CreateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid ticket payload',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return;
  }

  const payload = parsed.data;
  const createdBy = req.user!.id;
  const creatorName = req.user!.name;

  try {
    const ticket = ticketService.createTicket({
      ...payload,
      createdBy,
      creatorName,
    });

    const candidates = duplicateService.findCandidates(ticket.id);
    if (candidates.length > 0) {
      storage.updateTicket(ticket.id, { hasDuplicateCandidates: true });
      ticket.hasDuplicateCandidates = true;
    }

    res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Ticket creation failed:', error);
    res.status(500).json({
      error: 'Failed to persist ticket',
      message: error?.message || 'Internal error',
    });
  }
});

/**
 * GET /api/tickets/mine
 * List tickets for current authenticated student only
 */
ticketRouter.get('/mine', requireAuth(['student']), (req: AuthenticatedRequest, res) => {
  const studentId = req.user!.id;
  const tickets = storage.getTickets().filter((t) => t.createdBy === studentId);

  res.json({
    success: true,
    tickets,
  });
});

/**
 * GET /api/tickets/:id
 * Retrieve single ticket with chronological audit timeline (accessible by student owner or staff/admin)
 */
ticketRouter.get('/:id', requireAuth(), (req: AuthenticatedRequest, res) => {
  const ticket = storage.getTicketById(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  // Access control: only creator student or staff/admin can view ticket details
  if (req.user!.role === 'student' && ticket.createdBy !== req.user!.id) {
    res.status(403).json({ error: 'Access denied: You can only view your own tickets.' });
    return;
  }

  const events = storage.getEventsByTicketId(ticket.id);
  const reviews = storage.getDuplicateReviews(ticket.id);

  res.json({
    success: true,
    ticket,
    events,
    duplicateReviews: reviews,
  });
});
