import type {
  Workspace,
  User,
  CoupleProfile,
  WeddingEvent,
  Task,
  Expense,
  Vendor,
  Guest,
  InvitationDesign,
  InvitationDeliveryLog,
  GalleryItem,
  AuditLog,
  SystemSettings,
  FinancesSummary,
  AdminOverview,
} from '../types/index.ts';

const TOKEN_KEY = 'voyara_wedding_planner_token';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errMsg = 'An unexpected error occurred.';
      try {
        const data = await res.json();
        errMsg = data.error || data.message || errMsg;
      } catch {
        errMsg = res.statusText || errMsg;
      }
      throw new Error(errMsg);
    }

    // Check for empty body (e.g. 204 or CSV stream)
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    return res.text() as unknown as T;
  }

  // Auth
  public async login(identifier: string, password: string) {
    const data = await this.request<{
      token: string;
      user: User;
      workspace?: Workspace;
      coupleProfile?: CoupleProfile;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(data.token);
    return data;
  }

  public async register(payload: {
    full_name: string;
    mobile: string;
    email: string;
    password: string;
    confirm_password: string;
    workspace_name?: string;
    groom_name: string;
    bride_name: string;
    engagement_date?: string;
    wedding_date?: string;
    venues?: { wedding?: string; engagement?: string };
    currency?: string;
  }) {
    const data = await this.request<{
      token: string;
      user: User;
      workspace: Workspace;
      coupleProfile: CoupleProfile;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.token);
    return data;
  }

  public async getMe() {
    return this.request<{
      user: User;
      workspace?: Workspace;
      coupleProfile?: CoupleProfile;
    }>('/auth/me');
  }

  public async changePassword(payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Upload
  public async uploadFile(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ url: string; filename: string }>('/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // Workspace & Couple
  public async getWorkspace() {
    return this.request<Workspace>('/workspace');
  }

  public async updateWorkspace(data: Partial<Workspace>) {
    return this.request<Workspace>('/workspace', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async getCoupleProfile() {
    return this.request<CoupleProfile>('/couple');
  }

  public async updateCoupleProfile(data: Partial<CoupleProfile>) {
    return this.request<CoupleProfile>('/couple', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Events
  public async getEvents() {
    return this.request<WeddingEvent[]>('/events');
  }

  public async createEvent(event: Omit<WeddingEvent, 'id' | 'created_at' | 'updated_at' | 'workspace_id'>) {
    return this.request<WeddingEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  public async updateEvent(id: string, updates: Partial<WeddingEvent>) {
    return this.request<WeddingEvent>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteEvent(id: string) {
    return this.request<{ success: boolean }>(`/events/${id}`, { method: 'DELETE' });
  }

  // Tasks
  public async getTasks() {
    return this.request<Task[]>('/tasks');
  }

  public async createTask(task: Partial<Task>) {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  public async updateTask(id: string, updates: Partial<Task>) {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteTask(id: string) {
    return this.request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' });
  }

  public async duplicateTask(id: string) {
    return this.request<Task>(`/tasks/duplicate/${id}`, { method: 'POST' });
  }

  public async loadTaskTemplate(template_type: string) {
    return this.request<{ count: number; tasks: Task[] }>('/tasks/load-template', {
      method: 'POST',
      body: JSON.stringify({ template_type }),
    });
  }

  // Finances
  public async getFinancesSummary() {
    return this.request<FinancesSummary>('/finances');
  }

  public async getExpenses() {
    return this.request<Expense[]>('/expenses');
  }

  public async createExpense(expense: Partial<Expense>) {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  public async updateExpense(id: string, updates: Partial<Expense>) {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteExpense(id: string) {
    return this.request<{ success: boolean }>(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Vendors
  public async getVendors() {
    return this.request<Vendor[]>('/vendors');
  }

  public async createVendor(vendor: Partial<Vendor>) {
    return this.request<Vendor>('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
  }

  public async updateVendor(id: string, updates: Partial<Vendor>) {
    return this.request<Vendor>(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteVendor(id: string) {
    return this.request<{ success: boolean }>(`/vendors/${id}`, { method: 'DELETE' });
  }

  // Guests
  public async getGuests() {
    return this.request<Guest[]>('/guests');
  }

  public async createGuest(guest: Partial<Guest>) {
    return this.request<Guest>('/guests', {
      method: 'POST',
      body: JSON.stringify(guest),
    });
  }

  public async updateGuest(id: string, updates: Partial<Guest>) {
    return this.request<Guest>(`/guests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteGuest(id: string) {
    return this.request<{ success: boolean }>(`/guests/${id}`, { method: 'DELETE' });
  }

  public async importGuests(guests: Partial<Guest>[]) {
    return this.request<{ count: number; guests: Guest[] }>('/guests/import', {
      method: 'POST',
      body: JSON.stringify({ guests }),
    });
  }

  // Invitations
  public async getInvitations() {
    return this.request<InvitationDesign[]>('/invitations');
  }

  public async createInvitation(inv: Partial<InvitationDesign>) {
    return this.request<InvitationDesign>('/invitations', {
      method: 'POST',
      body: JSON.stringify(inv),
    });
  }

  public async deleteInvitation(id: string) {
    return this.request<{ success: boolean }>(`/invitations/${id}`, { method: 'DELETE' });
  }

  public async getDeliveryLogs() {
    return this.request<InvitationDeliveryLog[]>('/invitations/logs');
  }

  public async sendInvitations(payload: {
    guest_ids: string[];
    channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
    invitation_id?: string;
    custom_message?: string;
  }) {
    return this.request<{
      totalProcessed: number;
      successCount: number;
      failureCount: number;
      logs: InvitationDeliveryLog[];
    }>('/invitations/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Public RSVP
  public async getPublicRsvp(token: string) {
    return this.request<{
      guest: {
        id: string;
        full_name: string;
        accompanying_count: number;
        rsvp_status: string;
        dietary_preferences?: string;
        rsvp_responded_at?: string;
      };
      couple: {
        groom_name: string;
        bride_name: string;
        love_story?: string;
        groom_photo?: string;
        bride_photo?: string;
      } | null;
      workspaceName?: string;
      events: WeddingEvent[];
      weddingEvent?: WeddingEvent;
      engagementEvent?: WeddingEvent;
      invitationCard?: InvitationDesign;
    }>(`/public/rsvp/${token}`);
  }

  public async submitPublicRsvp(
    token: string,
    payload: {
      attending: boolean;
      accompanying_count: number;
      dietary_notes?: string;
      personal_message?: string;
    }
  ) {
    return this.request<{
      success: boolean;
      rsvp_status: string;
      message: string;
    }>(`/public/rsvp/${token}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Gallery
  public async getGallery() {
    return this.request<GalleryItem[]>('/gallery');
  }

  public async addGalleryItem(item: { title: string; category: string; image_url: string }) {
    return this.request<GalleryItem>('/gallery', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  public async deleteGalleryItem(id: string) {
    return this.request<{ success: boolean }>(`/gallery/${id}`, { method: 'DELETE' });
  }

  // Super Admin
  public async getAdminOverview() {
    return this.request<AdminOverview>('/admin/overview');
  }

  public async getAdminWorkspaces() {
    return this.request<any[]>('/admin/workspaces');
  }

  public async updateWorkspaceStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED') {
    return this.request<Workspace>(`/admin/workspaces/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  public async getAdminUsers() {
    return this.request<User[]>('/admin/users');
  }

  public async adminResetPassword(userId: string) {
    return this.request<{ success: boolean; message: string; tempPassword: string }>(
      `/admin/users/${userId}/reset-password`,
      { method: 'POST' }
    );
  }

  public async adminToggleUserActive(userId: string) {
    return this.request<{ is_active: boolean }>(`/admin/users/${userId}/toggle-active`, { method: 'POST' });
  }

  public async getAdminAuditLogs(limit = 100) {
    return this.request<AuditLog[]>(`/admin/audit-logs?limit=${limit}`);
  }

  public async getAdminSettings() {
    return this.request<SystemSettings>('/admin/settings');
  }

  public async updateAdminSettings(settings: Partial<SystemSettings>) {
    return this.request<SystemSettings>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiService();
