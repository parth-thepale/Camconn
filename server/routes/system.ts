import { Router } from 'express';
import { storage } from '../services/storage.js';
import { CAMPUS_LOCATIONS, GEMINI_API_KEY, NODE_ENV } from '../config.js';

export const systemRouter = Router();

/**
 * GET /api/health
 * Health check & runtime diagnostics
 */
systemRouter.get('/health', (req, res) => {
  const tickets = storage.getTickets();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    aiConfigured: Boolean(GEMINI_API_KEY),
    stats: {
      totalTickets: tickets.length,
      activeRules: storage.getRoutingRules().length,
    },
  });
});

/**
 * GET /api/routing-rules
 * Get campus routing guide & explainable provenance
 */
systemRouter.get('/routing-rules', (req, res) => {
  res.json({
    success: true,
    rules: storage.getRoutingRules(),
  });
});

/**
 * GET /api/campus-locations
 * Campus directory buildings and zones
 */
systemRouter.get('/campus-locations', (req, res) => {
  res.json({
    success: true,
    locations: CAMPUS_LOCATIONS,
  });
});

/**
 * POST /api/reset-demo
 * Reset database to default seed data for presentation/judging walkthrough
 */
systemRouter.post('/reset-demo', (req, res) => {
  storage.resetSeed();
  res.json({
    success: true,
    message: 'Demo dataset reset successfully',
  });
});
