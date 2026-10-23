import { Router } from 'express';
import { z } from 'zod';
import { ticketService } from '../services/ticketService.js';
import { storage } from '../services/storage.js';
import { duplicateService } from '../services/duplicateService.js';

export const ticketRouter = Router();

const CreateTicketSchema = z.object({
  createdBy: z.string().default('student-current'),
  creatorName: z.string().default('Student Reporter'),
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
});

/**
 * POST /api/tickets
 * Create a confirmed ticket with persistent reference number
 */
ticketRouter.post('/', (req, res) => {
  const parsed = CreateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid ticket payload',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return;
  }

  try {
    const ticket = ticketService.createTicket(parsed.data);

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
ticketRouter.get('/mine', (req, res) => {
  const studentId = (req.query.studentId as string) || 'student-current';
  // Also return all tickets if querying default demo student or fallback
  const tickets = storage.getTickets().filter(
    (t) => t.createdBy === studentId || studentId === 'all' || studentId === 'student-current'
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
