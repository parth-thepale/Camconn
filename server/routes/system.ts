import { Router } from 'express';
import { storage } from '../services/storage.js';
import { CAMPUS_LOCATIONS, GEMINI_API_KEY, NODE_ENV } from '../config.js';

export const systemRouter = Router();

/**
 * GET /api/health
 * Health check & runtime diagnostics
 */
systemRouter.get('/health', (_req, res) => {
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
 * Get official campus routing directory & provenance standards
 */
systemRouter.get('/routing-rules', (_req, res) => {
  res.json({
    success: true,
    rules: storage.getRoutingRules(),
  });
});

/**
 * GET /api/campus-locations
 * Campus directory buildings and zones
 */
systemRouter.get('/campus-locations', (_req, res) => {
  res.json({
    success: true,
    locations: CAMPUS_LOCATIONS,
  });
});
