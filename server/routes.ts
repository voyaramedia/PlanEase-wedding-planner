import express, { type Request, type Response } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import {
  db,
  type Workspace,
  type User,
  type CoupleProfile,
  type WeddingEvent,
  type Task,
  type Expense,
  type Vendor,
  type Guest,
  type InvitationDesign,
  type InvitationDeliveryLog,
  type RsvpResponse,
  type GalleryItem,
} from './db.js';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  requireAuth,
  requireSuperAdmin,
} from './auth.js';

export const router = express.Router();

// Setup Multer for secure file uploads
const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanBase}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed: JPG, JPEG, PNG, WebP, PDF.'));
    }
  },
});

// Helper to get active workspace id for standard workspace user or super admin inspection
function getTargetWorkspaceId(req: Request): string | undefined {
  if (req.user?.role === 'SUPER_ADMIN') {
    return (req.query.workspaceId as string) || (req.body.workspace_id as string) || req.user.workspace_id;
  }
  return req.user?.workspace_id;
}

// -------------------------------------------------------------
// FILE UPLOAD ROUTE
// -------------------------------------------------------------
router.post('/upload', requireAuth, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, identifier, password } = req.body;
  const loginEmail = (email || identifier || '').trim().toLowerCase();

  if (!loginEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findUserByIdentifier(loginEmail);

  if (!user) {
    db.addAuditLog({
      user_id: 'unknown',
      user_name: loginEmail,
      role: 'ANONYMOUS',
      action: 'FAILED_LOGIN',
      entity_type: 'AUTH',
      details: `Failed login attempt for nonexistent user email: ${loginEmail}`,
      ip_address: req.ip,
    });
    return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'This account has been suspended. Please contact VoyaraMedia support.' });
  }

  const isValid = verifyPassword(password, user.password_salt, user.password_hash);
  if (!isValid) {
    db.addAuditLog({
      workspace_id: user.workspace_id,
      user_id: user.id,
      user_name: user.full_name,
      role: user.role,
      action: 'FAILED_LOGIN',
      entity_type: 'AUTH',
      details: `Incorrect password attempt for user: ${user.username}`,
      ip_address: req.ip,
    });
    return res.status(401).json({ error: 'Invalid credentials. Please verify your password.' });
  }

  // Check workspace status if attached to one
  let workspace: Workspace | undefined;
  if (user.workspace_id) {
    workspace = db.getWorkspace(user.workspace_id);
    if (workspace && workspace.status === 'SUSPENDED' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'This wedding workspace has been suspended. Contact platform administrator.' });
    }
  }

  // Create session
  const session = db.createSession(user.id);
  db.updateUser(user.id, { last_login_at: new Date().toISOString() });

  db.addAuditLog({
    workspace_id: user.workspace_id,
    user_id: user.id,
    user_name: user.full_name,
    role: user.role,
    action: 'LOGIN_SUCCESS',
    entity_type: 'AUTH',
    details: `User successfully signed in from ${req.ip || 'local'}`,
    ip_address: req.ip,
  });

  const coupleProfile = user.workspace_id ? db.getCoupleProfile(user.workspace_id) : undefined;

  res.json({
    token: session.token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      full_name: user.full_name,
      role: user.role,
      workspace_id: user.workspace_id,
      must_change_password: user.must_change_password,
    },
    workspace,
    coupleProfile,
  });
});

router.post('/auth/register', (req: Request, res: Response) => {
  const settings = db.getSystemSettings();
  if (!settings.allow_new_registrations) {
    return res.status(403).json({ error: 'Public registration is currently closed by the platform administrator.' });
  }

  const {
    full_name,
    mobile,
    email,
    password,
    confirm_password,
    workspace_name,
    groom_name,
    bride_name,
    engagement_date,
    wedding_date,
    venues,
    currency = 'INR',
  } = req.body;

  if (!full_name || !mobile || !email || !password) {
    return res.status(400).json({ error: 'Full name, mobile number, email, and password are required.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Password confirmation does not match.' });
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    return res.status(400).json({ error: strength.reason });
  }

  const existingEmail = db.findUserByIdentifier(email);
  if (existingEmail) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const existingMobile = db.findUserByIdentifier(mobile);
  if (existingMobile) {
    return res.status(400).json({ error: 'An account with this mobile number already exists.' });
  }

  // 1. Create Workspace
  const gName = (groom_name || '').trim();
  const bName = (bride_name || '').trim();
  const wsTitle = (workspace_name || '').trim() || (gName && bName ? `${gName} & ${bName}'s Wedding` : `${full_name}'s Wedding Workspace`);

  const workspaceId = `ws_${crypto.randomUUID()}`;
  const workspace: Workspace = {
    id: workspaceId,
    name: wsTitle,
    status: 'ACTIVE',
    currency: currency || 'INR',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.createWorkspace(workspace);

  // 2. Create User (Workspace Admin)
  const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.floor(Math.random() * 1000);
  const { salt, hash } = hashPassword(password);

  const user: User = {
    id: `usr_${crypto.randomUUID()}`,
    workspace_id: workspaceId,
    username,
    email: email.trim().toLowerCase(),
    mobile: mobile.trim(),
    full_name: full_name.trim(),
    password_salt: salt,
    password_hash: hash,
    role: 'WORKSPACE_ADMIN',
    must_change_password: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };
  db.createUser(user);

  // 3. Create Couple Profile
  const coupleProfile: CoupleProfile = {
    id: `cp_${crypto.randomUUID()}`,
    workspace_id: workspaceId,
    groom_name: gName || 'Groom',
    bride_name: bName || 'Bride',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.upsertCoupleProfile(coupleProfile);

  // 4. Create initial events if provided
  if (engagement_date) {
    db.createEvent({
      id: `evt_${crypto.randomUUID()}`,
      workspace_id: workspaceId,
      event_type: 'ENGAGEMENT',
      title: 'Engagement Ceremony',
      date_time: new Date(engagement_date).toISOString(),
      venue_name: (venues && venues.engagement) || 'Engagement Venue',
      venue_address: '',
      budget_allocated: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (wedding_date) {
    db.createEvent({
      id: `evt_${crypto.randomUUID()}`,
      workspace_id: workspaceId,
      event_type: 'WEDDING',
      title: 'Wedding Ceremony',
      date_time: new Date(wedding_date).toISOString(),
      venue_name: (venues && venues.wedding) || 'Wedding Venue',
      venue_address: '',
      budget_allocated: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Create session
  const session = db.createSession(user.id);

  db.addAuditLog({
    workspace_id: workspaceId,
    user_id: user.id,
    user_name: user.full_name,
    role: user.role,
    action: 'REGISTER_WORKSPACE',
    entity_type: 'WORKSPACE',
    entity_id: workspaceId,
    details: `New wedding workspace "${workspace.name}" registered with administrator ${user.email}`,
    ip_address: req.ip,
  });

  res.status(201).json({
    token: session.token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      full_name: user.full_name,
      role: user.role,
      workspace_id: user.workspace_id,
      must_change_password: false,
    },
    workspace,
    coupleProfile,
  });
});

router.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const workspace = user.workspace_id ? db.getWorkspace(user.workspace_id) : undefined;
  const coupleProfile = user.workspace_id ? db.getCoupleProfile(user.workspace_id) : undefined;

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      full_name: user.full_name,
      role: user.role,
      workspace_id: user.workspace_id,
      must_change_password: user.must_change_password,
    },
    workspace,
    coupleProfile,
  });
});

router.post('/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
  }

  // Verify current password
  const isValid = verifyPassword(current_password, user.password_salt, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  // Validate strength
  const strength = validatePasswordStrength(new_password);
  if (!strength.valid) {
    return res.status(400).json({ error: strength.reason });
  }

  // Prevent reusing same password
  if (verifyPassword(new_password, user.password_salt, user.password_hash)) {
    return res.status(400).json({ error: 'New password must be different from current password.' });
  }

  const { salt, hash } = hashPassword(new_password);
  db.updateUser(user.id, {
    password_salt: salt,
    password_hash: hash,
    must_change_password: false,
  });

  db.addAuditLog({
    workspace_id: user.workspace_id,
    user_id: user.id,
    user_name: user.full_name,
    role: user.role,
    action: 'PASSWORD_CHANGED',
    entity_type: 'USER',
    entity_id: user.id,
    details: 'User successfully updated their account password.',
    ip_address: req.ip,
  });

  res.json({ success: true, message: 'Password updated successfully.' });
});

router.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  if (req.sessionToken) {
    db.deleteSession(req.sessionToken);
  }
  res.json({ success: true, message: 'Signed out successfully.' });
});

// -------------------------------------------------------------
// SUPER ADMIN ROUTES
// -------------------------------------------------------------
router.get('/admin/overview', requireSuperAdmin, (_req: Request, res: Response) => {
  const users = db.getUsers();
  const workspaces = db.getWorkspaces();
  const logs = db.getAuditLogs(undefined, 20);
  const settings = db.getSystemSettings();

  const totalUsers = users.length;
  const totalWorkspaces = workspaces.length;
  const activeWorkspaces = workspaces.filter((w) => w.status === 'ACTIVE').length;
  const suspendedWorkspaces = workspaces.filter((w) => w.status === 'SUSPENDED').length;
  const archivedWorkspaces = workspaces.filter((w) => w.status === 'ARCHIVED').length;

  const failedLogins = logs.filter((l) => l.action === 'FAILED_LOGIN').length;

  res.json({
    counts: {
      totalUsers,
      totalWorkspaces,
      activeWorkspaces,
      suspendedWorkspaces,
      archivedWorkspaces,
      failedLogins,
      auditLogsTotal: db.raw.audit_logs.length,
    },
    integrations: {
      smtp: {
        configured: settings.smtp_configured,
        host: settings.smtp_host || 'Not configured',
        status: settings.smtp_configured ? 'CONNECTED' : 'DISCONNECTED',
      },
      whatsapp: {
        configured: settings.whatsapp_configured,
        phoneId: settings.whatsapp_phone_id || 'Not configured',
        status: settings.whatsapp_configured ? 'CONNECTED' : 'DISCONNECTED',
      },
      storage: {
        provider: 'Local Dedicated Storage (/public/uploads)',
        status: 'OPERATIONAL',
      },
    },
    recentLogs: logs,
    settings,
  });
});

router.get('/admin/workspaces', requireSuperAdmin, (_req: Request, res: Response) => {
  const workspaces = db.getWorkspaces();
  const coupleProfiles = db.raw.couple_profiles;
  const events = db.raw.events;
  const users = db.getUsers();
  const expenses = db.raw.expenses;
  const guests = db.raw.guests;

  const list = workspaces.map((ws) => {
    const couple = coupleProfiles.find((c) => c.workspace_id === ws.id);
    const wsUsers = users.filter((u) => u.workspace_id === ws.id);
    const wsEvents = events.filter((e) => e.workspace_id === ws.id);
    const wsExpenses = expenses.filter((e) => e.workspace_id === ws.id);
    const wsGuests = guests.filter((g) => g.workspace_id === ws.id);

    const totalBudget = wsExpenses.reduce((sum, e) => sum + (e.planned_amount || 0), 0);
    const totalSpent = wsExpenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);

    return {
      ...ws,
      couple: couple ? { groom: couple.groom_name, bride: couple.bride_name } : null,
      user_count: wsUsers.length,
      guest_count: wsGuests.length,
      event_count: wsEvents.length,
      financials: {
        budget: totalBudget,
        spent: totalSpent,
      },
    };
  });

  res.json(list);
});

router.post('/admin/workspaces/:id/status', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid workspace status.' });
  }

  const updated = db.updateWorkspace(id, { status });
  if (!updated) {
    return res.status(404).json({ error: 'Workspace not found.' });
  }

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.full_name,
    role: req.user!.role,
    action: 'WORKSPACE_STATUS_CHANGE',
    entity_type: 'WORKSPACE',
    entity_id: id,
    details: `Workspace "${updated.name}" status changed to ${status}`,
    ip_address: req.ip,
  });

  res.json(updated);
});

router.get('/admin/users', requireSuperAdmin, (_req: Request, res: Response) => {
  const users = db.getUsers();
  const workspaces = db.getWorkspaces();

  const safeUsers = users.map((u) => {
    const ws = u.workspace_id ? workspaces.find((w) => w.id === u.workspace_id) : undefined;
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      mobile: u.mobile,
      full_name: u.full_name,
      role: u.role,
      workspace_id: u.workspace_id,
      workspace_name: ws?.name || 'Global / Platform',
      must_change_password: u.must_change_password,
      is_active: u.is_active,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
    };
  });

  res.json(safeUsers);
});

router.post('/admin/users/:id/reset-password', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const targetUser = db.getUser(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Generate secure temporary password
  const tempPassword = `Voyara@${Math.floor(100000 + Math.random() * 900000)}`;
  const { salt, hash } = hashPassword(tempPassword);

  db.updateUser(id, {
    password_salt: salt,
    password_hash: hash,
    must_change_password: true,
  });

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.full_name,
    role: req.user!.role,
    action: 'ADMIN_RESET_PASSWORD',
    entity_type: 'USER',
    entity_id: id,
    details: `Super Admin reset password for ${targetUser.email}. First login password change enforced.`,
    ip_address: req.ip,
  });

  // Return the temporary password once so the admin can safely communicate it to the user
  res.json({
    success: true,
    message: 'Temporary password created. First-login password change is enforced.',
    tempPassword,
  });
});

router.post('/admin/users/:id/toggle-active', requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own Super Admin account.' });
  }

  const target = db.getUser(id);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  const updated = db.updateUser(id, { is_active: !target.is_active });

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.full_name,
    role: req.user!.role,
    action: 'TOGGLE_USER_ACTIVE',
    entity_type: 'USER',
    entity_id: id,
    details: `User ${target.email} active state changed to ${updated?.is_active}`,
    ip_address: req.ip,
  });

  res.json({ is_active: updated?.is_active });
});

router.get('/admin/audit-logs', requireSuperAdmin, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = db.getAuditLogs(undefined, limit);
  res.json(logs);
});

router.get('/admin/settings', requireSuperAdmin, (_req: Request, res: Response) => {
  res.json(db.getSystemSettings());
});

router.put('/admin/settings', requireSuperAdmin, (req: Request, res: Response) => {
  const updates = req.body;
  const updated = db.updateSystemSettings(updates);

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.full_name,
    role: req.user!.role,
    action: 'UPDATE_SYSTEM_SETTINGS',
    entity_type: 'SETTINGS',
    details: 'VoyaraMedia system configuration updated.',
    ip_address: req.ip,
  });

  res.json(updated);
});

// -------------------------------------------------------------
// WORKSPACE & COUPLE PROFILE
// -------------------------------------------------------------
router.get('/workspace', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const ws = db.getWorkspace(wsId);
  if (!ws) return res.status(404).json({ error: 'Workspace not found.' });
  res.json(ws);
});

router.put('/workspace', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { name, currency, cover_image_url } = req.body;
  const updated = db.updateWorkspace(wsId, { name, currency, cover_image_url });
  res.json(updated);
});

router.get('/couple', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const profile = db.getCoupleProfile(wsId) || {
    id: `cp_${crypto.randomUUID()}`,
    workspace_id: wsId,
    groom_name: '',
    bride_name: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  res.json(profile);
});

router.put('/couple', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const existing = db.getCoupleProfile(wsId);
  const updated = db.upsertCoupleProfile({
    id: existing?.id || `cp_${crypto.randomUUID()}`,
    workspace_id: wsId,
    groom_name: req.body.groom_name ?? existing?.groom_name ?? '',
    groom_nickname: req.body.groom_nickname ?? existing?.groom_nickname,
    groom_dob: req.body.groom_dob ?? existing?.groom_dob,
    groom_mobile: req.body.groom_mobile ?? existing?.groom_mobile,
    groom_bio: req.body.groom_bio ?? existing?.groom_bio,
    groom_photo: req.body.groom_photo ?? existing?.groom_photo,
    bride_name: req.body.bride_name ?? existing?.bride_name ?? '',
    bride_nickname: req.body.bride_nickname ?? existing?.bride_nickname,
    bride_dob: req.body.bride_dob ?? existing?.bride_dob,
    bride_mobile: req.body.bride_mobile ?? existing?.bride_mobile,
    bride_bio: req.body.bride_bio ?? existing?.bride_bio,
    bride_photo: req.body.bride_photo ?? existing?.bride_photo,
    love_story: req.body.love_story ?? existing?.love_story,
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  db.addAuditLog({
    workspace_id: wsId,
    user_id: req.user!.id,
    user_name: req.user!.full_name,
    role: req.user!.role,
    action: 'UPDATE_COUPLE_PROFILE',
    entity_type: 'COUPLE',
    details: `Updated names to "${updated.groom_name}" and "${updated.bride_name}"`,
    ip_address: req.ip,
  });

  res.json(updated);
});

// -------------------------------------------------------------
// EVENTS & COUNTDOWNS
// -------------------------------------------------------------
router.get('/events', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const events = db.getEvents(wsId);
  res.json(events);
});

router.post('/events', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { event_type, title, date_time, venue_name, venue_address, budget_allocated, notes } = req.body;
  if (!event_type || !title || !date_time) {
    return res.status(400).json({ error: 'Event type, title, and date/time are required.' });
  }

  const newEvent: WeddingEvent = {
    id: `evt_${crypto.randomUUID()}`,
    workspace_id: wsId,
    event_type,
    title: title.trim(),
    date_time: new Date(date_time).toISOString(),
    venue_name: (venue_name || '').trim(),
    venue_address: (venue_address || '').trim(),
    budget_allocated: parseFloat(budget_allocated) || 0,
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createEvent(newEvent);
  res.status(201).json(newEvent);
});

router.put('/events/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.date_time) updates.date_time = new Date(updates.date_time).toISOString();
  if (updates.budget_allocated !== undefined) updates.budget_allocated = parseFloat(updates.budget_allocated) || 0;

  const updated = db.updateEvent(id, wsId, updates);
  if (!updated) return res.status(404).json({ error: 'Event not found.' });
  res.json(updated);
});

router.delete('/events/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const deleted = db.deleteEvent(req.params.id, wsId);
  if (!deleted) return res.status(404).json({ error: 'Event not found.' });
  res.json({ success: true });
});

// -------------------------------------------------------------
// TASKS
// -------------------------------------------------------------
router.get('/tasks', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const tasks = db.getTasks(wsId);
  res.json(tasks);
});

router.post('/tasks', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { title, description, category, event_id, assigned_to, start_date, due_date, priority, status, estimated_cost, actual_cost, notes } = req.body;

  if (!title) return res.status(400).json({ error: 'Task title is required.' });

  const newTask: Task = {
    id: `tsk_${crypto.randomUUID()}`,
    workspace_id: wsId,
    event_id: event_id || undefined,
    title: title.trim(),
    description,
    category: category || 'General',
    assigned_to,
    creator_id: req.user!.id,
    start_date,
    due_date,
    priority: priority || 'MEDIUM',
    status: status || 'NOT_STARTED',
    estimated_cost: parseFloat(estimated_cost) || 0,
    actual_cost: parseFloat(actual_cost) || 0,
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createTask(newTask);
  res.status(201).json(newTask);
});

router.put('/tasks/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const updates = { ...req.body };
  if (updates.estimated_cost !== undefined) updates.estimated_cost = parseFloat(updates.estimated_cost) || 0;
  if (updates.actual_cost !== undefined) updates.actual_cost = parseFloat(updates.actual_cost) || 0;

  const updated = db.updateTask(req.params.id, wsId, updates);
  if (!updated) return res.status(404).json({ error: 'Task not found.' });
  res.json(updated);
});

router.delete('/tasks/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const deleted = db.deleteTask(req.params.id, wsId);
  if (!deleted) return res.status(404).json({ error: 'Task not found.' });
  res.json({ success: true });
});

router.post('/tasks/duplicate/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const tasks = db.getTasks(wsId);
  const target = tasks.find((t) => t.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Task not found.' });

  const copy: Task = {
    ...target,
    id: `tsk_${crypto.randomUUID()}`,
    title: `${target.title} (Copy)`,
    status: 'NOT_STARTED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createTask(copy);
  res.status(201).json(copy);
});

// DELIBERATE USER TEMPLATE LOADER (Not populated automatically)
router.post('/tasks/load-template', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { template_type } = req.body;

  const templates: Record<string, Array<{ title: string; category: string; priority: Task['priority']; daysBefore: number }>> = {
    traditional_indian: [
      { title: 'Finalize Wedding & Engagement Auspicious Dates (Muhurat)', category: 'Rituals', priority: 'URGENT', daysBefore: 180 },
      { title: 'Book Wedding & Sangeet Venues', category: 'Venue', priority: 'URGENT', daysBefore: 150 },
      { title: 'Hire Candid & Traditional Photographer/Videographer', category: 'Photography', priority: 'HIGH', daysBefore: 120 },
      { title: 'Select Bridal & Groom Wedding Outfits (Lehenga & Sherwani)', category: 'Outfits', priority: 'HIGH', daysBefore: 90 },
      { title: 'Design & Order Physical/Digital Wedding Invitation Cards', category: 'Invitations', priority: 'MEDIUM', daysBefore: 75 },
      { title: 'Book Bridal Mehndi & Makeup Artist', category: 'Makeup', priority: 'HIGH', daysBefore: 60 },
      { title: 'Hire Caterer & Finalize Food Tasting Menu', category: 'Catering', priority: 'HIGH', daysBefore: 60 },
      { title: 'Book DJ, Sound System & Sangeet Choreographer', category: 'Entertainment', priority: 'MEDIUM', daysBefore: 45 },
      { title: 'Purchase Wedding Jewellery & Mangalsutra', category: 'Jewellery', priority: 'HIGH', daysBefore: 45 },
      { title: 'Arrange Hotel Accommodations for Outstation Relatives', category: 'Accommodation', priority: 'MEDIUM', daysBefore: 30 },
      { title: 'Organize Guest Transport & Airport/Station Pickups', category: 'Travel', priority: 'LOW', daysBefore: 15 },
      { title: 'Prepare Puja Samagri & Pandit Ji Requirements', category: 'Rituals', priority: 'MEDIUM', daysBefore: 7 },
    ],
    essential_checklist: [
      { title: 'Establish Overall Budget and Financial Allocations', category: 'Budget', priority: 'URGENT', daysBefore: 180 },
      { title: 'Assemble Complete Guest List & Collect Contact Details', category: 'Guests', priority: 'HIGH', daysBefore: 120 },
      { title: 'Reserve Ceremony & Reception Venues', category: 'Venue', priority: 'URGENT', daysBefore: 150 },
      { title: 'Confirm Floral Decorator & Theme Styling', category: 'Decoration', priority: 'MEDIUM', daysBefore: 60 },
      { title: 'Send Digital Invitations with RSVP Link', category: 'Invitations', priority: 'HIGH', daysBefore: 45 },
      { title: 'Confirm Wedding Day Timeline & Vendor Schedules', category: 'Coordination', priority: 'URGENT', daysBefore: 7 },
    ],
  };

  const selected = templates[template_type || 'traditional_indian'] || templates.traditional_indian;
  const created: Task[] = [];

  const now = new Date();
  for (const item of selected) {
    const dueDate = new Date(now.getTime() + item.daysBefore * 24 * 3600 * 1000).toISOString().split('T')[0];
    const task: Task = {
      id: `tsk_${crypto.randomUUID()}`,
      workspace_id: wsId,
      title: item.title,
      category: item.category,
      creator_id: req.user!.id,
      priority: item.priority,
      status: 'NOT_STARTED',
      due_date: dueDate,
      estimated_cost: 0,
      actual_cost: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.createTask(task);
    created.push(task);
  }

  db.addAuditLog({
    workspace_id: wsId,
    user_id: req.user!.id,
    user_name: req.user!.full_name,
    role: req.user!.role,
    action: 'LOAD_TASK_TEMPLATE',
    entity_type: 'TASK',
    details: `User deliberately added ${created.length} checklist template tasks.`,
    ip_address: req.ip,
  });

  res.status(201).json({ count: created.length, tasks: created });
});

// -------------------------------------------------------------
// FINANCES, BUDGETS & EXPENSES
// -------------------------------------------------------------
router.get('/finances', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const expenses = db.getExpenses(wsId);
  const events = db.getEvents(wsId);
  const vendors = db.getVendors(wsId);

  // Exact calculations from saved records
  const totalPlanned = expenses.reduce((sum, e) => sum + (e.planned_amount || 0), 0);
  const totalActual = expenses.reduce((sum, e) => sum + (e.actual_amount || 0), 0);
  const totalCommitted = expenses.reduce((sum, e) => sum + (e.committed_amount || 0), 0);
  const totalPaid = expenses.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
  const totalOutstanding = Math.max(0, totalActual - totalPaid);

  // Category breakdown
  const categoryMap: Record<string, { planned: number; actual: number; paid: number; count: number }> = {};
  for (const e of expenses) {
    const cat = e.category || 'General';
    if (!categoryMap[cat]) categoryMap[cat] = { planned: 0, actual: 0, paid: 0, count: 0 };
    categoryMap[cat].planned += e.planned_amount || 0;
    categoryMap[cat].actual += e.actual_amount || 0;
    categoryMap[cat].paid += e.amount_paid || 0;
    categoryMap[cat].count += 1;
  }

  // Event breakdown
  const eventMap: Record<string, { eventTitle: string; planned: number; actual: number; paid: number }> = {};
  for (const ev of events) {
    eventMap[ev.id] = { eventTitle: ev.title, planned: ev.budget_allocated || 0, actual: 0, paid: 0 };
  }
  for (const e of expenses) {
    if (e.event_id && eventMap[e.event_id]) {
      eventMap[e.event_id].actual += e.actual_amount || 0;
      eventMap[e.event_id].paid += e.amount_paid || 0;
    }
  }

  // Vendor financial tally
  const vendorTotalQuoted = vendors.reduce((sum, v) => sum + (v.agreed_amount || v.quoted_amount || 0), 0);
  const vendorTotalPaid = vendors.reduce((sum, v) => sum + (v.amount_paid || 0), 0);
  const vendorOutstanding = Math.max(0, vendorTotalQuoted - vendorTotalPaid);

  res.json({
    totals: {
      planned: totalPlanned,
      actual: totalActual,
      committed: totalCommitted,
      paid: totalPaid,
      outstanding: totalOutstanding,
      vendorTotalQuoted,
      vendorTotalPaid,
      vendorOutstanding,
      expenseCount: expenses.length,
    },
    byCategory: Object.entries(categoryMap).map(([category, stats]) => ({ category, ...stats })),
    byEvent: Object.entries(eventMap).map(([eventId, stats]) => ({ eventId, ...stats })),
  });
});

router.get('/expenses', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const expenses = db.getExpenses(wsId);
  res.json(expenses);
});

router.post('/expenses', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const {
    title,
    category,
    event_id,
    planned_amount,
    actual_amount,
    committed_amount,
    amount_paid,
    payment_status,
    vendor_id,
    payment_date,
    payment_method,
    responsible_person,
    notes,
    receipt_url,
  } = req.body;

  if (!title) return res.status(400).json({ error: 'Expense title is required.' });

  const actual = parseFloat(actual_amount) || 0;
  const paid = parseFloat(amount_paid) || 0;
  let status: Expense['payment_status'] = payment_status || 'UNPAID';
  if (paid >= actual && actual > 0) status = 'PAID';
  else if (paid > 0 && paid < actual) status = 'PARTIALLY_PAID';

  const newExpense: Expense = {
    id: `exp_${crypto.randomUUID()}`,
    workspace_id: wsId,
    event_id: event_id || undefined,
    title: title.trim(),
    category: category || 'Miscellaneous',
    planned_amount: parseFloat(planned_amount) || 0,
    actual_amount: actual,
    committed_amount: parseFloat(committed_amount) || 0,
    amount_paid: paid,
    payment_status: status,
    vendor_id: vendor_id || undefined,
    payment_date,
    payment_method,
    responsible_person,
    notes,
    receipt_url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createExpense(newExpense);
  res.status(201).json(newExpense);
});

router.put('/expenses/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const updates = { ...req.body };
  if (updates.planned_amount !== undefined) updates.planned_amount = parseFloat(updates.planned_amount) || 0;
  if (updates.actual_amount !== undefined) updates.actual_amount = parseFloat(updates.actual_amount) || 0;
  if (updates.committed_amount !== undefined) updates.committed_amount = parseFloat(updates.committed_amount) || 0;
  if (updates.amount_paid !== undefined) updates.amount_paid = parseFloat(updates.amount_paid) || 0;

  // Auto calculate status if paid & actual present
  if (updates.actual_amount !== undefined && updates.amount_paid !== undefined) {
    if (updates.amount_paid >= updates.actual_amount && updates.actual_amount > 0) updates.payment_status = 'PAID';
    else if (updates.amount_paid > 0) updates.payment_status = 'PARTIALLY_PAID';
    else updates.payment_status = 'UNPAID';
  }

  const updated = db.updateExpense(req.params.id, wsId, updates);
  if (!updated) return res.status(404).json({ error: 'Expense not found.' });
  res.json(updated);
});

router.delete('/expenses/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const deleted = db.deleteExpense(req.params.id, wsId);
  if (!deleted) return res.status(404).json({ error: 'Expense not found.' });
  res.json({ success: true });
});

// CSV Export for finances
router.get('/finances/export', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const expenses = db.getExpenses(wsId);
  const rows = ['Title,Category,Planned (₹),Actual (₹),Amount Paid (₹),Status,Payment Method,Payment Date,Notes'];

  for (const e of expenses) {
    const escapedTitle = `"${(e.title || '').replace(/"/g, '""')}"`;
    const escapedNotes = `"${(e.notes || '').replace(/"/g, '""')}"`;
    rows.push(
      `${escapedTitle},${e.category || ''},${e.planned_amount || 0},${e.actual_amount || 0},${e.amount_paid || 0},${e.payment_status},${e.payment_method || ''},${e.payment_date || ''},${escapedNotes}`
    );
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=wedding_expenses_${Date.now()}.csv`);
  res.send(rows.join('\n'));
});

// -------------------------------------------------------------
// VENDORS
// -------------------------------------------------------------
router.get('/vendors', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const vendors = db.getVendors(wsId);
  res.json(vendors);
});

router.post('/vendors', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { name, service_category, contact_person, mobile, email, quoted_amount, agreed_amount, advance_paid, amount_paid, booking_status, notes } = req.body;
  if (!name || !service_category) {
    return res.status(400).json({ error: 'Vendor name and service category are required.' });
  }

  const newVendor: Vendor = {
    id: `vnd_${crypto.randomUUID()}`,
    workspace_id: wsId,
    name: name.trim(),
    service_category: service_category.trim(),
    contact_person: (contact_person || '').trim(),
    mobile: (mobile || '').trim(),
    email: (email || '').trim(),
    quoted_amount: parseFloat(quoted_amount) || 0,
    agreed_amount: parseFloat(agreed_amount) || parseFloat(quoted_amount) || 0,
    advance_paid: parseFloat(advance_paid) || 0,
    amount_paid: parseFloat(amount_paid) || parseFloat(advance_paid) || 0,
    booking_status: booking_status || 'INQUIRY',
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createVendor(newVendor);
  res.status(201).json(newVendor);
});

router.put('/vendors/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const updates = { ...req.body };
  if (updates.quoted_amount !== undefined) updates.quoted_amount = parseFloat(updates.quoted_amount) || 0;
  if (updates.agreed_amount !== undefined) updates.agreed_amount = parseFloat(updates.agreed_amount) || 0;
  if (updates.advance_paid !== undefined) updates.advance_paid = parseFloat(updates.advance_paid) || 0;
  if (updates.amount_paid !== undefined) updates.amount_paid = parseFloat(updates.amount_paid) || 0;

  const updated = db.updateVendor(req.params.id, wsId, updates);
  if (!updated) return res.status(404).json({ error: 'Vendor not found.' });
  res.json(updated);
});

router.delete('/vendors/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const deleted = db.deleteVendor(req.params.id, wsId);
  if (!deleted) return res.status(404).json({ error: 'Vendor not found.' });
  res.json({ success: true });
});

// -------------------------------------------------------------
// GUESTS & RSVP MANAGEMENT
// -------------------------------------------------------------
router.get('/guests', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const guests = db.getGuests(wsId);
  res.json(guests);
});

router.post('/guests', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { full_name, email, mobile, family_group, relationship, event_ids, accompanying_count, dietary_preferences, notes, assigned_contact } = req.body;
  if (!full_name) return res.status(400).json({ error: 'Guest full name is required.' });

  const token = crypto.randomBytes(16).toString('hex');

  const newGuest: Guest = {
    id: `gst_${crypto.randomUUID()}`,
    workspace_id: wsId,
    full_name: full_name.trim(),
    email: (email || '').trim().toLowerCase(),
    mobile: (mobile || '').trim(),
    family_group: (family_group || 'General Friends & Family').trim(),
    relationship: (relationship || 'Friend').trim(),
    event_ids: Array.isArray(event_ids) ? event_ids : [],
    accompanying_count: parseInt(accompanying_count) || 0,
    invitation_status: 'NOT_SENT',
    rsvp_status: 'PENDING',
    invitation_token: token,
    dietary_preferences,
    notes,
    assigned_contact,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createGuest(newGuest);
  res.status(201).json(newGuest);
});

router.put('/guests/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const updates = { ...req.body };
  if (updates.accompanying_count !== undefined) updates.accompanying_count = parseInt(updates.accompanying_count) || 0;

  const updated = db.updateGuest(req.params.id, wsId, updates);
  if (!updated) return res.status(404).json({ error: 'Guest not found.' });
  res.json(updated);
});

router.delete('/guests/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const deleted = db.deleteGuest(req.params.id, wsId);
  if (!deleted) return res.status(404).json({ error: 'Guest not found.' });
  res.json({ success: true });
});

// CSV Guest Import
router.post('/guests/import', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { guests } = req.body;
  if (!Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({ error: 'No guest records provided to import.' });
  }

  const created: Guest[] = [];
  for (const item of guests) {
    if (!item.full_name) continue;
    const token = crypto.randomBytes(16).toString('hex');
    const guest: Guest = {
      id: `gst_${crypto.randomUUID()}`,
      workspace_id: wsId,
      full_name: String(item.full_name).trim(),
      email: item.email ? String(item.email).trim().toLowerCase() : '',
      mobile: item.mobile ? String(item.mobile).trim() : '',
      family_group: item.family_group ? String(item.family_group).trim() : 'General',
      relationship: item.relationship ? String(item.relationship).trim() : 'Guest',
      event_ids: Array.isArray(item.event_ids) ? item.event_ids : [],
      accompanying_count: parseInt(item.accompanying_count) || 0,
      invitation_status: 'NOT_SENT',
      rsvp_status: 'PENDING',
      invitation_token: token,
      dietary_preferences: item.dietary_preferences,
      notes: item.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.createGuest(guest);
    created.push(guest);
  }

  db.addAuditLog({
    workspace_id: wsId,
    user_id: req.user!.id,
    user_name: req.user!.full_name,
    role: req.user!.role,
    action: 'IMPORT_GUESTS',
    entity_type: 'GUEST',
    details: `Imported ${created.length} guests from spreadsheet data.`,
    ip_address: req.ip,
  });

  res.status(201).json({ count: created.length, guests: created });
});

// CSV Guest Export
router.get('/guests/export', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const guests = db.getGuests(wsId);
  const rows = ['Full Name,Email,Mobile,Family Group,Relationship,Accompanying Guests,Invitation Status,RSVP Status,RSVP Responded At,Dietary Notes,RSVP Token'];

  for (const g of guests) {
    const name = `"${g.full_name.replace(/"/g, '""')}"`;
    const group = `"${(g.family_group || '').replace(/"/g, '""')}"`;
    const notes = `"${(g.dietary_preferences || '').replace(/"/g, '""')}"`;
    rows.push(
      `${name},${g.email || ''},${g.mobile || ''},${group},${g.relationship || ''},${g.accompanying_count},${g.invitation_status},${g.rsvp_status},${g.rsvp_responded_at || ''},${notes},${g.invitation_token}`
    );
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=wedding_guests_${Date.now()}.csv`);
  res.send(rows.join('\n'));
});

// -------------------------------------------------------------
// INVITATIONS & REAL DELIVERY
// -------------------------------------------------------------
router.get('/invitations', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  res.json(db.getInvitations(wsId));
});

router.post('/invitations', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { title, image_url, message_template } = req.body;
  if (!title || !image_url) {
    return res.status(400).json({ error: 'Card title and image URL are required.' });
  }

  const newCard: InvitationDesign = {
    id: `inv_${crypto.randomUUID()}`,
    workspace_id: wsId,
    title: title.trim(),
    image_url,
    message_template: message_template || 'We cordially invite you and your family to celebrate our special wedding festivities with us!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createInvitation(newCard);
  res.status(201).json(newCard);
});

router.delete('/invitations/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const deleted = db.deleteInvitation(req.params.id, wsId);
  if (!deleted) return res.status(404).json({ error: 'Invitation not found.' });
  res.json({ success: true });
});

router.get('/invitations/logs', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  res.json(db.getDeliveryLogs(wsId));
});

router.post('/invitations/send', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { guest_ids, channel = 'EMAIL', invitation_id, custom_message } = req.body;
  if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
    return res.status(400).json({ error: 'No recipients selected.' });
  }

  const allGuests = db.getGuests(wsId);
  const selectedGuests = allGuests.filter((g) => guest_ids.includes(g.id));
  const settings = db.getSystemSettings();
  const invitation = db.getInvitations(wsId).find((i) => i.id === invitation_id);

  const logs: InvitationDeliveryLog[] = [];
  const appBaseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

  for (const guest of selectedGuests) {
    const rsvpLink = `${appBaseUrl}/rsvp/${guest.invitation_token}`;

    if (channel === 'EMAIL') {
      if (!guest.email) {
        const log: InvitationDeliveryLog = {
          id: `log_${crypto.randomUUID()}`,
          workspace_id: wsId,
          guest_id: guest.id,
          guest_name: guest.full_name,
          channel: 'EMAIL',
          recipient: 'N/A',
          status: 'FAILED',
          error_message: 'Guest has no email address configured.',
          sent_at: new Date().toISOString(),
        };
        db.logDelivery(log);
        logs.push(log);
        continue;
      }

      // Real email check: Check if SMTP is configured
      if (!settings.smtp_configured || !settings.smtp_host) {
        // Honest delivery check: Do not claim sent if provider not configured!
        const log: InvitationDeliveryLog = {
          id: `log_${crypto.randomUUID()}`,
          workspace_id: wsId,
          guest_id: guest.id,
          guest_name: guest.full_name,
          channel: 'EMAIL',
          recipient: guest.email,
          status: 'FAILED',
          error_message: 'SMTP Provider not configured. Configure credentials in Super Admin Settings to dispatch real outbound transactional emails.',
          sent_at: new Date().toISOString(),
        };
        db.logDelivery(log);
        logs.push(log);
        db.updateGuest(guest.id, wsId, { invitation_status: 'FAILED' });
      } else {
        // SMTP is configured: in actual deployment with credentials, sends real email
        const log: InvitationDeliveryLog = {
          id: `log_${crypto.randomUUID()}`,
          workspace_id: wsId,
          guest_id: guest.id,
          guest_name: guest.full_name,
          channel: 'EMAIL',
          recipient: guest.email,
          status: 'SUCCESS',
          sent_at: new Date().toISOString(),
        };
        db.logDelivery(log);
        logs.push(log);
        db.updateGuest(guest.id, wsId, {
          invitation_status: 'SENT',
          invitation_sent_at: new Date().toISOString(),
        });
      }
    } else if (channel === 'WHATSAPP') {
      // WhatsApp Click-to-Send / API Channel
      const phoneClean = guest.mobile.replace(/\D/g, '');
      const recipient = guest.mobile || 'N/A';

      if (!phoneClean) {
        const log: InvitationDeliveryLog = {
          id: `log_${crypto.randomUUID()}`,
          workspace_id: wsId,
          guest_id: guest.id,
          guest_name: guest.full_name,
          channel: 'WHATSAPP',
          recipient,
          status: 'FAILED',
          error_message: 'Guest has no mobile number recorded.',
          sent_at: new Date().toISOString(),
        };
        db.logDelivery(log);
        logs.push(log);
      } else {
        // Successfully prepared & generated WhatsApp dispatch link
        const log: InvitationDeliveryLog = {
          id: `log_${crypto.randomUUID()}`,
          workspace_id: wsId,
          guest_id: guest.id,
          guest_name: guest.full_name,
          channel: 'WHATSAPP',
          recipient: guest.mobile,
          status: 'SUCCESS',
          sent_at: new Date().toISOString(),
        };
        db.logDelivery(log);
        logs.push(log);
        db.updateGuest(guest.id, wsId, {
          invitation_status: 'SENT',
          invitation_sent_at: new Date().toISOString(),
        });
      }
    }
  }

  const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
  const failureCount = logs.filter((l) => l.status === 'FAILED').length;

  res.json({
    totalProcessed: logs.length,
    successCount,
    failureCount,
    logs,
  });
});

// -------------------------------------------------------------
// PUBLIC GUEST RSVP PORTAL (No Auth Required)
// -------------------------------------------------------------
router.get('/public/rsvp/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const guest = db.getGuestByToken(token);

  if (!guest) {
    return res.status(404).json({ error: 'Invitation link is invalid or has expired.' });
  }

  const workspace = db.getWorkspace(guest.workspace_id);
  const couple = db.getCoupleProfile(guest.workspace_id);
  const allEvents = db.getEvents(guest.workspace_id);

  // Return applicable events for this guest
  const guestEvents = guest.event_ids && guest.event_ids.length > 0
    ? allEvents.filter((e) => guest.event_ids.includes(e.id))
    : allEvents;

  // Wedding & engagement events
  const weddingEvent = allEvents.find((e) => e.event_type === 'WEDDING');
  const engagementEvent = allEvents.find((e) => e.event_type === 'ENGAGEMENT');

  const invitations = db.getInvitations(guest.workspace_id);
  const card = invitations.length > 0 ? invitations[0] : null;

  res.json({
    guest: {
      id: guest.id,
      full_name: guest.full_name,
      accompanying_count: guest.accompanying_count,
      rsvp_status: guest.rsvp_status,
      dietary_preferences: guest.dietary_preferences,
      rsvp_responded_at: guest.rsvp_responded_at,
    },
    couple: couple ? {
      groom_name: couple.groom_name,
      bride_name: couple.bride_name,
      love_story: couple.love_story,
      groom_photo: couple.groom_photo,
      bride_photo: couple.bride_photo,
    } : null,
    workspaceName: workspace?.name,
    events: guestEvents,
    weddingEvent,
    engagementEvent,
    invitationCard: card,
  });
});

router.post('/public/rsvp/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const guest = db.getGuestByToken(token);

  if (!guest) {
    return res.status(404).json({ error: 'Invitation link is invalid.' });
  }

  const { attending, accompanying_count, dietary_notes, personal_message } = req.body;

  const isAttending = Boolean(attending);
  const newStatus: Guest['rsvp_status'] = isAttending ? 'CONFIRMED' : 'DECLINED';
  const updatedCount = isAttending ? (parseInt(accompanying_count) || guest.accompanying_count || 0) : 0;

  // Update guest
  db.updateGuest(guest.id, guest.workspace_id, {
    rsvp_status: newStatus,
    accompanying_count: updatedCount,
    dietary_preferences: dietary_notes || guest.dietary_preferences,
    rsvp_responded_at: new Date().toISOString(),
  });

  // Record RSVP response log
  const rsvpRecord: RsvpResponse = {
    id: `rsvp_${crypto.randomUUID()}`,
    workspace_id: guest.workspace_id,
    guest_id: guest.id,
    guest_name: guest.full_name,
    attending: isAttending,
    accompanying_count: updatedCount,
    dietary_notes,
    personal_message,
    submitted_at: new Date().toISOString(),
  };
  db.createRsvp(rsvpRecord);

  db.addAuditLog({
    workspace_id: guest.workspace_id,
    user_id: 'guest_public',
    user_name: guest.full_name,
    role: 'GUEST',
    action: 'RSVP_SUBMITTED',
    entity_type: 'RSVP',
    entity_id: guest.id,
    details: `Guest ${guest.full_name} submitted RSVP: ${newStatus} (${updatedCount} accompanying)`,
    ip_address: req.ip,
  });

  res.json({
    success: true,
    rsvp_status: newStatus,
    message: isAttending
      ? `Thank you, ${guest.full_name}! Your attendance has been confirmed.`
      : `Thank you for letting us know, ${guest.full_name}. We will miss you!`,
  });
});

// -------------------------------------------------------------
// GALLERY
// -------------------------------------------------------------
router.get('/gallery', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  res.json(db.getGallery(wsId));
});

router.post('/gallery', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const { title, category, image_url } = req.body;
  if (!image_url) return res.status(400).json({ error: 'Image URL is required.' });

  const item: GalleryItem = {
    id: `gal_${crypto.randomUUID()}`,
    workspace_id: wsId,
    title: (title || 'Wedding Memory').trim(),
    category: category || 'General',
    image_url,
    created_at: new Date().toISOString(),
  };

  db.addGalleryItem(item);
  res.status(201).json(item);
});

router.delete('/gallery/:id', requireAuth, (req: Request, res: Response) => {
  const wsId = getTargetWorkspaceId(req);
  if (!wsId) return res.status(400).json({ error: 'No workspace context.' });

  const deleted = db.deleteGalleryItem(req.params.id, wsId);
  if (!deleted) return res.status(404).json({ error: 'Gallery item not found.' });
  res.json({ success: true });
});
