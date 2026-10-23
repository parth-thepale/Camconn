import { Router } from 'express';
import { z } from 'zod';
import { ticketService } from '../services/ticketService.js';
import { storage } from '../services/storage.js';
import { duplicateService } from '../services/duplicateService.js';
import { AuthenticatedRequest, verifyToken } from '../services/auth.js';

export const ticketRouter = Router();

// Middleware to extract optional user from bearer header if present
ticketRouter.use((req: AuthenticatedRequest, _res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const decoded = verifyToken(auth.split(' ')[1]);
    if (decoded) req.user = decoded;
  }
  next();
});

const CreateTicketSchema = z.object({
  createdBy: z.string().optional(),
  creatorName: z.string().optional(),
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
 * Create a confirmed ticket with persistent reference number and optional checkout linkage
 */
ticketRouter.post('/', (req: AuthenticatedRequest, res) => {
  const parsed = CreateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid ticket payload',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return;
  }

  const payload = parsed.data;
  const createdBy = req.user?.id || payload.createdBy || 'student-ananya';
  const creatorName = req.user?.name || payload.creatorName || 'Student Reporter';

  try {
    const ticket = ticketService.createTicket({
      ...payload,
      createdBy,
      creatorName,
    });

    // Check for duplicate candidates in background and flag if any found
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
 * List tickets for current student
 */
ticketRouter.get('/mine', (req: AuthenticatedRequest, res) => {
  const studentId = (req.query.studentId as string) || req.user?.id || 'all';
  const tickets = storage.getTickets().filter(
    (t) => t.createdBy === studentId || studentId === 'all'
  );

  res.json({
    success: true,
    tickets,
  });
});

/**
 * GET /api/tickets/:id
 * Retrieve single ticket with chronological audit timeline
 */
ticketRouter.get('/:id', (req, res) => {
  const ticket = storage.getTicketById(req.params.id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
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
