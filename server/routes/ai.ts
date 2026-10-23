import { Router } from 'express';
import { z } from 'zod';
import {
  analyzeComplaintWithGemini,
  generateTechnicianDiagnosis,
  analyzeCampusClusters,
  generateResolutionSummary,
} from '../services/gemini.js';
import { storage } from '../services/storage.js';

export const aiRouter = Router();

const DraftRequestSchema = z.object({
  complaintText: z.string().min(5, 'Complaint must be at least 5 characters long').max(2000),
  location: z.object({
    building: z.string(),
    floor: z.string().optional(),
    room: z.string().optional(),
    zone: z.string().optional(),
    details: z.string().optional(),
  }),
  photoBase64: z.string().nullable().optional(),
  answers: z
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
 * POST /api/ai/draft
 * Extract structured issue fields, language detection, urgency, and clarification proposal
 */
aiRouter.post('/draft', async (req, res) => {
  const parsed = DraftRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid input',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return;
  }

  const { complaintText, location, photoBase64, answers } = parsed.data;

  try {
    const analysis = await analyzeComplaintWithGemini(
      complaintText,
      location,
      photoBase64,
      answers
    );
    res.json({
      success: true,
      draft: analysis,
    });
  } catch (error: any) {
    console.error('AI draft generation error:', error);
    res.status(500).json({
      error: 'Failed to generate AI draft proposal',
      message: error?.message || 'Internal error',
    });
  }
});

/**
 * POST /api/ai/diagnose
 * INNOVATIVE FEATURE: AI Technician Root Cause Diagnosis & Step-by-Step Field Blueprint
 */
aiRouter.post('/diagnose', async (req, res) => {
  const { ticketId } = req.body;
  if (!ticketId) {
    res.status(400).json({ error: 'ticketId is required' });
    return;
  }

  const ticket = storage.getTicketById(ticketId);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  try {
    const diagnosis = await generateTechnicianDiagnosis({
      title: ticket.title,
      summary: ticket.summary,
      originalText: ticket.originalText,
      category: ticket.category,
      location: ticket.location,
    });

    res.json({
      success: true,
      ticketId: ticket.id,
      diagnosis,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate diagnosis', message: err?.message });
  }
});

/**
 * GET /api/ai/patterns
 * INNOVATIVE FEATURE: Campus Infrastructure Recurring Cluster Detection
 */
aiRouter.get('/patterns', async (_req, res) => {
  try {
    const tickets = storage.getTickets();
    const clusters = await analyzeCampusClusters(tickets);
    res.json({
      success: true,
      clusters,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to analyze patterns', message: err?.message });
  }
});

/**
 * POST /api/ai/resolution-note
 * INNOVATIVE FEATURE: AI Automated Resolution Note & Student Update Generator
 */
aiRouter.post('/resolution-note', async (req, res) => {
  const { title, category, actionTaken } = req.body;
  if (!title || !category) {
    res.status(400).json({ error: 'title and category are required' });
    return;
  }

  try {
    const note = await generateResolutionSummary({
      title,
      category,
      actionTaken: actionTaken || '',
    });
    res.json({
      success: true,
      note,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate resolution note', message: err?.message });
  }
});

