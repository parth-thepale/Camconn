import { Router } from 'express';
import { z } from 'zod';
import { analyzeComplaintWithGemini } from '../services/gemini.js';

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
 * Extract structured issue fields and clarification proposal
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
