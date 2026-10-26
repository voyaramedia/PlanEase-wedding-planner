import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface Workspace {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  currency: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  workspace_id?: string;
  username: string;
  email: string;
  mobile: string;
  full_name: string;
  password_salt: string;
  password_hash: string;
  role: 'SUPER_ADMIN' | 'WORKSPACE_ADMIN' | 'GROOM' | 'BRIDE' | 'FAMILY_MEMBER';
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface CoupleProfile {
  id: string;
  workspace_id: string;
  groom_name: string;
  groom_nickname?: string;
  groom_dob?: string;
  groom_mobile?: string;
  groom_bio?: string;
  groom_photo?: string;
  bride_name: string;
  bride_nickname?: string;
  bride_dob?: string;
  bride_mobile?: string;
  bride_bio?: string;
  bride_photo?: string;
  love_story?: string;
  created_at: string;
  updated_at: string;
}

export interface WeddingEvent {
  id: string;
  workspace_id: string;
  event_type: 'WEDDING' | 'ENGAGEMENT' | 'SANGEET' | 'MEHENDI' | 'HALDI' | 'RECEPTION' | 'OTHER';
  title: string;
  date_time: string; // ISO string
  venue_name: string;
  venue_address: string;
  budget_allocated: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  event_id?: string;
  title: string;
  description?: string;
  category: string;
  assigned_to?: string;
  creator_id: string;
  start_date?: string;
  due_date?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  estimated_cost: number;
  actual_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  workspace_id: string;
  event_id?: string;
  title: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
  committed_amount: number;
  amount_paid: number;
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  vendor_id?: string;
  payment_date?: string;
  payment_method?: string;
  responsible_person?: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  workspace_id: string;
  event_id?: string;
  name: string;
  service_category: string;
  contact_person: string;
  mobile: string;
  email: string;
  quoted_amount: number;
  agreed_amount: number;
  advance_paid: number;
  amount_paid: number;
  booking_status: 'INQUIRY' | 'QUOTED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';
  contract_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  workspace_id: string;
  full_name: string;
  email: string;
  mobile: string;
  family_group: string;
  relationship: string;
  event_ids: string[];
  accompanying_count: number;
  invitation_status: 'NOT_SENT' | 'SENT' | 'DELIVERED' | 'FAILED';
  rsvp_status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  invitation_token: string;
  invitation_sent_at?: string;
  rsvp_responded_at?: string;
  dietary_preferences?: string;
  notes?: string;
  assigned_contact?: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationDesign {
  id: string;
  workspace_id: string;
  title: string;
  image_url: string;
  message_template: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationDeliveryLog {
  id: string;
  workspace_id: string;
  guest_id: string;
  guest_name: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
  recipient: string;
  status: 'SUCCESS' | 'FAILED';
  error_message?: string;
  sent_at: string;
}

export interface RsvpResponse {
  id: string;
  workspace_id: string;
  guest_id: string;
  guest_name: string;
  attending: boolean;
  accompanying_count: number;
  dietary_notes?: string;
  personal_message?: string;
  submitted_at: string;
}

export interface GalleryItem {
  id: string;
  workspace_id: string;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id?: string;
  user_id: string;
  user_name: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  brand_name: string;
  contact_email: string;
  smtp_configured: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_from?: string;
  whatsapp_configured: boolean;
  whatsapp_phone_id?: string;
  allow_new_registrations: boolean;
  updated_at: string;
}

export interface Session {
  id: string;
  token: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface DatabaseSchema {
  workspaces: Workspace[];
  users: User[];
  couple_profiles: CoupleProfile[];
  events: WeddingEvent[];
  tasks: Task[];
  expenses: Expense[];
  vendors: Vendor[];
  guests: Guest[];
  invitations: InvitationDesign[];
  invitation_delivery_logs: InvitationDeliveryLog[];
  rsvps: RsvpResponse[];
  gallery: GalleryItem[];
  audit_logs: AuditLog[];
  system_settings: SystemSettings;
  sessions: Session[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'wedding_planner_db.json');

const INITIAL_DB: DatabaseSchema = {
  workspaces: [],
  users: [],
  couple_profiles: [],
  events: [],
  tasks: [],
  expenses: [],
  vendors: [],
  guests: [],
  invitations: [],
  invitation_delivery_logs: [],
  rsvps: [],
  gallery: [],
  audit_logs: [],
  system_settings: {
    id: 'voyara_settings_1',
    brand_name: 'Our Wedding Planner — VoyaraMedia',
    contact_email: 'voyaramedia@gmail.com',
    smtp_configured: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    smtp_from: 'no-reply@voyaramedia.com',
    whatsapp_configured: false,
    allow_new_registrations: true,
    updated_at: new Date().toISOString(),
  },
  sessions: [],
};

class Database {
  private data: DatabaseSchema;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.data = this.load();
    this.cleanExpiredSessions();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        return { ...INITIAL_DB, ...parsed };
      }
    } catch (err) {
      console.error('[DB] Failed to load database file, resetting to initial schema:', err);
    }
    this.saveDirect(INITIAL_DB);
    return INITIAL_DB;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveDirect(this.data);
      this.saveDebounceTimer = null;
    }, 50);
  }

  public saveImmediate() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    this.saveDirect(this.data);
  }

  // Schema accessor
  public get raw(): DatabaseSchema {
    return this.data;
  }

  // Workspaces
  public getWorkspaces(): Workspace[] {
    return this.data.workspaces;
  }

  public getWorkspace(id: string): Workspace | undefined {
    return this.data.workspaces.find((w) => w.id === id);
  }

  public createWorkspace(ws: Workspace): Workspace {
    this.data.workspaces.push(ws);
    this.save();
    return ws;
  }

  public updateWorkspace(id: string, updates: Partial<Workspace>): Workspace | null {
    const idx = this.data.workspaces.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    this.data.workspaces[idx] = {
      ...this.data.workspaces[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.workspaces[idx];
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUser(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByIdentifier(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        u.mobile.replace(/\D/g, '') === identifier.replace(/\D/g, '')
    );
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.users[idx];
  }

  // Couple Profile
  public getCoupleProfile(workspaceId: string): CoupleProfile | undefined {
    return this.data.couple_profiles.find((p) => p.workspace_id === workspaceId);
  }

  public upsertCoupleProfile(profile: CoupleProfile): CoupleProfile {
    const idx = this.data.couple_profiles.findIndex((p) => p.workspace_id === profile.workspace_id);
    if (idx !== -1) {
      this.data.couple_profiles[idx] = {
        ...this.data.couple_profiles[idx],
        ...profile,
        updated_at: new Date().toISOString(),
      };
      this.save();
      return this.data.couple_profiles[idx];
    } else {
      this.data.couple_profiles.push(profile);
      this.save();
      return profile;
    }
  }

  // Events
  public getEvents(workspaceId: string): WeddingEvent[] {
    return this.data.events
      .filter((e) => e.workspace_id === workspaceId)
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
  }

  public getEvent(id: string, workspaceId: string): WeddingEvent | undefined {
    return this.data.events.find((e) => e.id === id && e.workspace_id === workspaceId);
  }

  public createEvent(event: WeddingEvent): WeddingEvent {
    this.data.events.push(event);
    this.save();
    return event;
  }

  public updateEvent(id: string, workspaceId: string, updates: Partial<WeddingEvent>): WeddingEvent | null {
    const idx = this.data.events.findIndex((e) => e.id === id && e.workspace_id === workspaceId);
    if (idx === -1) return null;
    this.data.events[idx] = {
      ...this.data.events[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.events[idx];
  }

  public deleteEvent(id: string, workspaceId: string): boolean {
    const before = this.data.events.length;
    this.data.events = this.data.events.filter((e) => !(e.id === id && e.workspace_id === workspaceId));
    const changed = this.data.events.length !== before;
    if (changed) this.save();
    return changed;
  }

  // Tasks
  public getTasks(workspaceId: string): Task[] {
    return this.data.tasks.filter((t) => t.workspace_id === workspaceId);
  }

  public createTask(task: Task): Task {
    this.data.tasks.push(task);
    this.save();
    return task;
  }

  public updateTask(id: string, workspaceId: string, updates: Partial<Task>): Task | null {
    const idx = this.data.tasks.findIndex((t) => t.id === id && t.workspace_id === workspaceId);
    if (idx === -1) return null;
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.tasks[idx];
  }

  public deleteTask(id: string, workspaceId: string): boolean {
    const before = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter((t) => !(t.id === id && t.workspace_id === workspaceId));
    const changed = this.data.tasks.length !== before;
    if (changed) this.save();
    return changed;
  }

  // Expenses
  public getExpenses(workspaceId: string): Expense[] {
    return this.data.expenses.filter((e) => e.workspace_id === workspaceId);
  }

  public createExpense(expense: Expense): Expense {
    this.data.expenses.push(expense);
    this.save();
    return expense;
  }

  public updateExpense(id: string, workspaceId: string, updates: Partial<Expense>): Expense | null {
    const idx = this.data.expenses.findIndex((e) => e.id === id && e.workspace_id === workspaceId);
    if (idx === -1) return null;
    this.data.expenses[idx] = {
      ...this.data.expenses[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.expenses[idx];
  }

  public deleteExpense(id: string, workspaceId: string): boolean {
    const before = this.data.expenses.length;
    this.data.expenses = this.data.expenses.filter((e) => !(e.id === id && e.workspace_id === workspaceId));
    const changed = this.data.expenses.length !== before;
    if (changed) this.save();
    return changed;
  }

  // Vendors
  public getVendors(workspaceId: string): Vendor[] {
    return this.data.vendors.filter((v) => v.workspace_id === workspaceId);
  }

  public createVendor(vendor: Vendor): Vendor {
    this.data.vendors.push(vendor);
    this.save();
    return vendor;
  }

  public updateVendor(id: string, workspaceId: string, updates: Partial<Vendor>): Vendor | null {
    const idx = this.data.vendors.findIndex((v) => v.id === id && v.workspace_id === workspaceId);
    if (idx === -1) return null;
    this.data.vendors[idx] = {
      ...this.data.vendors[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.vendors[idx];
  }

  public deleteVendor(id: string, workspaceId: string): boolean {
    const before = this.data.vendors.length;
    this.data.vendors = this.data.vendors.filter((v) => !(v.id === id && v.workspace_id === workspaceId));
    const changed = this.data.vendors.length !== before;
    if (changed) this.save();
    return changed;
  }

  // Guests
  public getGuests(workspaceId: string): Guest[] {
    return this.data.guests.filter((g) => g.workspace_id === workspaceId);
  }

  public getGuestByToken(token: string): Guest | undefined {
    return this.data.guests.find((g) => g.invitation_token === token);
  }

  public createGuest(guest: Guest): Guest {
    this.data.guests.push(guest);
    this.save();
    return guest;
  }

  public updateGuest(id: string, workspaceId: string, updates: Partial<Guest>): Guest | null {
    const idx = this.data.guests.findIndex((g) => g.id === id && g.workspace_id === workspaceId);
    if (idx === -1) return null;
    this.data.guests[idx] = {
      ...this.data.guests[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.guests[idx];
  }

  public deleteGuest(id: string, workspaceId: string): boolean {
    const before = this.data.guests.length;
    this.data.guests = this.data.guests.filter((g) => !(g.id === id && g.workspace_id === workspaceId));
    const changed = this.data.guests.length !== before;
    if (changed) this.save();
    return changed;
  }

  // Invitations
  public getInvitations(workspaceId: string): InvitationDesign[] {
    return this.data.invitations.filter((inv) => inv.workspace_id === workspaceId);
  }

  public createInvitation(invitation: InvitationDesign): InvitationDesign {
    this.data.invitations.push(invitation);
    this.save();
    return invitation;
  }

  public updateInvitation(id: string, workspaceId: string, updates: Partial<InvitationDesign>): InvitationDesign | null {
    const idx = this.data.invitations.findIndex((inv) => inv.id === id && inv.workspace_id === workspaceId);
    if (idx === -1) return null;
    this.data.invitations[idx] = {
      ...this.data.invitations[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.invitations[idx];
  }

  public deleteInvitation(id: string, workspaceId: string): boolean {
    const before = this.data.invitations.length;
    this.data.invitations = this.data.invitations.filter((i) => !(i.id === id && i.workspace_id === workspaceId));
    const changed = this.data.invitations.length !== before;
    if (changed) this.save();
    return changed;
  }

  // Delivery Logs
  public getDeliveryLogs(workspaceId: string): InvitationDeliveryLog[] {
    return this.data.invitation_delivery_logs
      .filter((l) => l.workspace_id === workspaceId)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
  }

  public logDelivery(log: InvitationDeliveryLog): InvitationDeliveryLog {
    this.data.invitation_delivery_logs.unshift(log);
    this.save();
    return log;
  }

  // RSVPs
  public getRsvps(workspaceId: string): RsvpResponse[] {
    return this.data.rsvps
      .filter((r) => r.workspace_id === workspaceId)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }

  public createRsvp(rsvp: RsvpResponse): RsvpResponse {
    this.data.rsvps.unshift(rsvp);
    this.save();
    return rsvp;
  }

  // Gallery
  public getGallery(workspaceId: string): GalleryItem[] {
    return this.data.gallery.filter((g) => g.workspace_id === workspaceId);
  }

  public addGalleryItem(item: GalleryItem): GalleryItem {
    this.data.gallery.push(item);
    this.save();
    return item;
  }

  public deleteGalleryItem(id: string, workspaceId: string): boolean {
    const before = this.data.gallery.length;
    this.data.gallery = this.data.gallery.filter((g) => !(g.id === id && g.workspace_id === workspaceId));
    const changed = this.data.gallery.length !== before;
    if (changed) this.save();
    return changed;
  }

  // Audit Logs
  public getAuditLogs(workspaceId?: string, limit = 100): AuditLog[] {
    let logs = this.data.audit_logs;
    if (workspaceId) {
      logs = logs.filter((l) => l.workspace_id === workspaceId);
    }
    return logs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const fullLog: AuditLog = {
      id: `audit_${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
      ...log,
    };
    this.data.audit_logs.unshift(fullLog);
    // Keep max 2000 logs
    if (this.data.audit_logs.length > 2000) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 2000);
    }
    this.save();
    return fullLog;
  }

  // System Settings
  public getSystemSettings(): SystemSettings {
    return this.data.system_settings;
  }

  public updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.system_settings = {
      ...this.data.system_settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.system_settings;
  }

  // Sessions
  public createSession(userId: string, hoursValid = 72): Session {
    const session: Session = {
      id: `sess_${crypto.randomUUID()}`,
      token: crypto.randomBytes(32).toString('hex'),
      user_id: userId,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + hoursValid * 3600 * 1000).toISOString(),
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public getSession(token: string): Session | undefined {
    return this.data.sessions.find((s) => s.token === token && new Date(s.expires_at) > new Date());
  }

  public deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  public cleanExpiredSessions(): void {
    const now = new Date();
    this.data.sessions = this.data.sessions.filter((s) => new Date(s.expires_at) > now);
  }
}

export const db = new Database();
