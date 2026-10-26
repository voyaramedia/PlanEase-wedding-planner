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
  role: 'SUPER_ADMIN' | 'WORKSPACE_ADMIN' | 'GROOM' | 'BRIDE' | 'FAMILY_MEMBER';
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  workspace_name?: string;
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
  date_time: string;
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

export interface FinancesSummary {
  totals: {
    planned: number;
    actual: number;
    committed: number;
    paid: number;
    outstanding: number;
    vendorTotalQuoted: number;
    vendorTotalPaid: number;
    vendorOutstanding: number;
    expenseCount: number;
  };
  byCategory: Array<{ category: string; planned: number; actual: number; paid: number; count: number }>;
  byEvent: Array<{ eventId: string; eventTitle: string; planned: number; actual: number; paid: number }>;
}

export interface AdminOverview {
  counts: {
    totalUsers: number;
    totalWorkspaces: number;
    activeWorkspaces: number;
    suspendedWorkspaces: number;
    archivedWorkspaces: number;
    failedLogins: number;
    auditLogsTotal: number;
  };
  integrations: {
    smtp: { configured: boolean; host: string; status: string };
    whatsapp: { configured: boolean; phoneId: string; status: string };
    storage: { provider: string; status: string };
  };
  recentLogs: AuditLog[];
  settings: SystemSettings;
}
