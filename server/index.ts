import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PORT, NODE_ENV, GEMINI_API_KEY } from './config.js';
import { authRouter } from './routes/auth.js';
import { checkoutRouter } from './routes/checkout.js';
import { aiRouter } from './routes/ai.js';
import { ticketRouter } from './routes/tickets.js';
import { staffRouter } from './routes/staff.js';
import { systemRouter } from './routes/system.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (sanitized, no secrets or full payloads)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/ai', aiRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/staff', staffRouter);
app.use('/api', systemRouter);

// Unknown /api/* paths must return JSON 404 (not HTML index)
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Serve frontend static files in production or when dist exists
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>CampusConnect Server</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: auto;">
          <h2>CampusConnect API Server is Running</h2>
          <p>Frontend static build not detected at <code>dist/</code>. Run <code>npm run build</code> or start client with <code>npm run dev</code>.</p>
          <p>Check health at: <a href="/api/health">/api/health</a></p>
        </body>
      </html>
    `);
  });
}

// Start HTTP server on 0.0.0.0 and process.env.PORT for Cloud Run / AI Studio compatibility
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`CampusConnect Server listening on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Gemini AI: ${GEMINI_API_KEY ? 'Configured (Active)' : 'Unconfigured (Deterministic Fallback Enabled)'}`);
  console.log(`=======================================================`);
});

export default app;
