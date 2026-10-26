import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db, type User } from './db.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionToken?: string;
    }
  }
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number or special character.' };
  }
  return { valid: true };
}

/**
 * One-time server-side bootstrap process for the VoyaraMedia Super Admin
 * Preserves existing accounts and never overwrites customized passwords on restart.
 */
export function bootstrapSuperAdmin(): void {
  const existingSuperAdmin = db.findUserByIdentifier('voyaramedia') || db.findUserByIdentifier('voyaramedia@gmail.com');

  if (existingSuperAdmin) {
    // Already provisioned; do not overwrite
    return;
  }

  // Initial provision using bootstrap credentials
  const initialPassword = process.env.INITIAL_SUPER_ADMIN_PASSWORD || 'Mayur@2107';
  const { salt, hash } = hashPassword(initialPassword);

  const superAdmin: User = {
    id: `usr_${crypto.randomUUID()}`,
    username: 'voyaramedia',
    email: 'voyaramedia@gmail.com',
    mobile: '+919999999999',
    full_name: 'VoyaraMedia Administrator',
    password_salt: salt,
    password_hash: hash,
    role: 'SUPER_ADMIN',
    must_change_password: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createUser(superAdmin);

  db.addAuditLog({
    user_id: superAdmin.id,
    user_name: superAdmin.full_name,
    role: superAdmin.role,
    action: 'INITIAL_BOOTSTRAP',
    entity_type: 'USER',
    entity_id: superAdmin.id,
    details: 'Initial VoyaraMedia Super Admin account bootstrapped with first-login password change enforced.',
  });

  console.log('[Auth] VoyaraMedia Super Admin initialized. Password change enforced on first login.');
}

/**
 * Authentication Middleware
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  const session = db.getSession(token);

  if (!session) {
    return next();
  }

  const user = db.getUser(session.user_id);
  if (user && user.is_active) {
    req.user = user;
    req.sessionToken = token;
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied: Super Admin privileges required.' });
  }
  next();
}

export function requireWorkspaceAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Super Admin can inspect workspace if explicitly requested or defaults to workspace
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const workspaceId = req.params.workspaceId || req.query.workspaceId || req.body.workspace_id;
  if (workspaceId && workspaceId !== req.user.workspace_id) {
    return res.status(403).json({ error: 'Access denied: You do not have permission to access this workspace.' });
  }

  next();
}
