import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../services/storage.js';
import {
  hashPassword,
  verifyPassword,
  createToken,
  requireAuth,
  AuthenticatedRequest,
} from '../services/auth.js';
import { UserRole } from '../types.js';

export const authRouter = Router();

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid campus or personal email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'staff', 'admin']).default('student'),
  department: z.string().optional(),
});

/**
 * POST /api/auth/login
 * Real email & password login
 */
authRouter.post('/login', (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email or password format' });
    return;
  }

  const { email, password } = parsed.data;
  const user = storage.getUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
    return;
  }

  const token = createToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    },
  });
});

/**
 * POST /api/auth/register
 * Real user registration with role specification (Student vs. Facilities Staff)
 */
authRouter.post('/register', (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration details' });
    return;
  }

  const { email, password, name, role, department } = parsed.data;
  const existing = storage.getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    return;
  }

  const newUser = storage.createUser({
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email,
    passwordHash: hashPassword(password),
    name,
    role: role as UserRole,
    department: department || (role === 'student' ? 'Student Body' : 'Campus Operations'),
    createdAt: new Date().toISOString(),
  });

  const token = createToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  });

  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      department: newUser.department,
    },
  });
});

/**
 * GET /api/auth/me
 * Validate session from token cache
 */
authRouter.get('/me', requireAuth(), (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const fullUser = storage.getUserById(req.user.id);
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      department: fullUser?.department,
    },
  });
});
