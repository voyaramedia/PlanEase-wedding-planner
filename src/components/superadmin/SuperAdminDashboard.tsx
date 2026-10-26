import React, { useState, useEffect } from 'react';
import type { AdminOverview, Workspace, User, AuditLog, SystemSettings } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  ShieldCheck,
  Building2,
  Users,
  ScrollText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Lock,
  Server,
  Mail,
  MessageSquare,
  HardDrive,
  UserCheck,
  UserX,
  ExternalLink,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  activeSection: string;
  onNavigateSection: (sec: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  activeSection,
  onNavigateSection,
}) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Password Reset result banner
  const [resetResult, setResetResult] = useState<{ userId: string; tempPass: string } | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Search filters
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, ws, usr, logs, sett] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminWorkspaces(),
        api.getAdminUsers(),
        api.getAdminAuditLogs(150),
        api.getAdminSettings(),
      ]);
      setOverview(ov);
      setWorkspaces(ws);
      setUsers(usr);
      setAuditLogs(logs);
      setSettings(sett);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleWorkspaceStatus = async (wsId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (confirm(`Change workspace status to ${nextStatus}?`)) {
      await api.updateWorkspaceStatus(wsId, nextStatus as any);
      fetchData();
    }
  };

  const handleAdminResetPassword = async (userId: string, email: string) => {
    if (confirm(`Generate secure temporary password for ${email}? First-login password change will be enforced.`)) {
      const res = await api.adminResetPassword(userId);
      setResetResult({ userId, tempPass: res.tempPassword });
      fetchData();
    }
  };

  const handleToggleUserActive = async (userId: string) => {
    await api.adminToggleUserActive(userId);
    fetchData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      await api.updateAdminSettings(settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update system settings');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#8C7A6B]">
        Loading VoyaraMedia administrator telemetry...
      </div>
    );
  }

  const counts = overview?.counts || {
    totalUsers: 0,
    totalWorkspaces: 0,
    activeWorkspaces: 0,
    suspendedWorkspaces: 0,
    archivedWorkspaces: 0,
    failedLogins: 0,
    auditLogsTotal: 0,
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] tracking-wider">
              VoyaraMedia Global Super Admin
            </span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">
            Platform Administration Console
          </h2>
        </div>

        <button
          onClick={fetchData}
          className="px-3.5 py-1.5 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl shadow-2xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#8C6D3B]" />
          Refresh Telemetry
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8DFD5] pb-3 text-xs font-medium">
        {[
          { id: 'admin-overview', label: 'Platform Telemetry', icon: Server },
          { id: 'admin-workspaces', label: `Workspaces (${counts.totalWorkspaces})`, icon: Building2 },
          { id: 'admin-users', label: `Users (${counts.totalUsers})`, icon: Users },
          { id: 'admin-audit', label: 'Security & Audit Logs', icon: ScrollText },
          { id: 'admin-settings', label: 'Integrations & Config', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigateSection(tab.id)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                isActive
                  ? 'bg-[#8C6D3B] text-white shadow-xs'
                  : 'bg-white border border-[#E8DFD5] text-[#6B5E52] hover:bg-[#FAF5EE]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Temp Password Reveal Banner */}
      {resetResult && (
        <div className="p-4 bg-[#EDF8F2] border border-[#BCE4CD] rounded-2xl flex items-center justify-between text-xs text-[#1B6E44] animate-in fade-in">
          <div>
            <span className="font-semibold block">Password Reset Successful!</span>
            <span className="text-[11px]">
              Temporary credential generated: <code className="font-mono bg-white px-2 py-0.5 rounded text-[#2C2420] font-bold">{resetResult.tempPass}</code> (User is forced to change on next login).
            </span>
          </div>
          <button
            onClick={() => setResetResult(null)}
            className="text-xs text-[#1B6E44] underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: OVERVIEW TELEMETRY */}
      {activeSection === 'admin-overview' && (
        <div className="space-y-6">
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
                Total Workspaces
              </span>
              <span className="font-mono text-2xl font-bold text-[#2C2420] tabular-nums mt-1 block">
                {counts.totalWorkspaces}
              </span>
              <span className="text-[10px] text-[#8C7A6B] mt-1 block">
                {counts.activeWorkspaces} active · {counts.suspendedWorkspaces} suspended
              </span>
            </div>

            <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
                User Accounts
              </span>
              <span className="font-mono text-2xl font-bold text-[#2C2420] tabular-nums mt-1 block">
                {counts.totalUsers}
              </span>
              <span className="text-[10px] text-[#8C7A6B] mt-1 block">Couples, admins &amp; family</span>
            </div>

            <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
                Failed Auth Events
              </span>
              <span className="font-mono text-2xl font-bold text-[#B43B2A] tabular-nums mt-1 block">
                {counts.failedLogins}
              </span>
              <span className="text-[10px] text-[#8C7A6B] mt-1 block">Security incident monitoring</span>
            </div>

            <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
                Audit Trail Entries
              </span>
              <span className="font-mono text-2xl font-bold text-[#8C6D3B] tabular-nums mt-1 block">
                {counts.auditLogsTotal}
              </span>
              <span className="text-[10px] text-[#8C7A6B] mt-1 block">Immutable platform operations</span>
            </div>
          </div>

          {/* Integration Status Cards */}
          <div className="p-5 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#2C2420]">
              Subsystem &amp; Provider Health
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#FAF8F5] border border-[#EAE2D8] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#2C2420] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#8C6D3B]" />
                    Email Delivery (SMTP)
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      overview?.integrations.smtp.configured
                        ? 'bg-[#EBF7F0] text-[#1D7543]'
                        : 'bg-[#FDF2F0] text-[#B43B2A]'
                    }`}
                  >
                    {overview?.integrations.smtp.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6A5C]">
                  Host: {overview?.integrations.smtp.host}
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EAE2D8] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#2C2420] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#8C6D3B]" />
                    WhatsApp Business API
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      overview?.integrations.whatsapp.configured
                        ? 'bg-[#EBF7F0] text-[#1D7543]'
                        : 'bg-[#FAF5EE] text-[#8C6D3B]'
                    }`}
                  >
                    {overview?.integrations.whatsapp.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6A5C]">
                  Phone ID: {overview?.integrations.whatsapp.phoneId}
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#EAE2D8] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#2C2420] flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-[#8C6D3B]" />
                    Media Storage
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#EBF7F0] text-[#1D7543]">
                    OPERATIONAL
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6A5C]">
                  {overview?.integrations.storage.provider}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WORKSPACES */}
      {activeSection === 'admin-workspaces' && (
        <div className="bg-white border border-[#E8DFD5] rounded-3xl overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
              Registered Wedding Workspaces
            </h3>
            <div className="relative w-64">
              <input
                type="text"
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E0D5C7] rounded-xl text-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9A8B7C] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E8DFD5] text-[#8C7A6B] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Workspace Title &amp; Couple</th>
                  <th className="py-3 px-4 text-center">Users</th>
                  <th className="py-3 px-4 text-center">Guests</th>
                  <th className="py-3 px-4 text-right">Budget (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {workspaces
                  .filter((w) => w.name.toLowerCase().includes(workspaceSearch.toLowerCase()))
                  .map((ws) => (
                    <tr key={ws.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2C2420]">{ws.name}</div>
                        <div className="text-[11px] text-[#8C7A6B]">
                          {ws.couple ? `${ws.couple.groom} & ${ws.couple.bride}` : 'Couple pending'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums">{ws.user_count}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums">{ws.guest_count}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {formatINR(ws.financials?.budget || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            ws.status === 'ACTIVE'
                              ? 'bg-[#EBF7F0] text-[#1D7543]'
                              : 'bg-[#FDF2F0] text-[#B43B2A]'
                          }`}
                        >
                          {ws.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleWorkspaceStatus(ws.id, ws.status)}
                          className="px-2.5 py-1 text-xs border border-[#D4C3B3] hover:border-[#8C6D3B] rounded-lg transition-colors"
                        >
                          {ws.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: USERS & ROLES */}
      {activeSection === 'admin-users' && (
        <div className="bg-white border border-[#E8DFD5] rounded-3xl overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
              User Accounts &amp; Global Permissions
            </h3>
            <div className="relative w-64">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, role..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E0D5C7] rounded-xl text-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9A8B7C] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E8DFD5] text-[#8C7A6B] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User &amp; Workspace</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {users
                  .filter(
                    (u) =>
                      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.role.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2C2420]">{u.full_name}</div>
                        <div className="text-[11px] text-[#8C7A6B]">{u.workspace_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-[#FAF5EE] px-2 py-0.5 rounded border border-[#E2D5C8]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6B5E52]">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-[#9A8B7C]">{u.mobile}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            u.is_active ? 'bg-[#EBF7F0] text-[#1D7543]' : 'bg-[#FDF2F0] text-[#B43B2A]'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAdminResetPassword(u.id, u.email)}
                            className="px-2.5 py-1 text-xs text-[#8C6D3B] hover:bg-[#FAF5EE] rounded-lg transition-colors border border-[#E0D5C7]"
                          >
                            Reset Password
                          </button>
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleToggleUserActive(u.id)}
                              className="p-1 text-[#9A8B7C] hover:text-[#B43B2A] rounded-lg"
                              title={u.is_active ? 'Deactivate' : 'Reactivate'}
                            >
                              {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: SECURITY AUDIT LOGS */}
      {activeSection === 'admin-audit' && (
        <div className="bg-white border border-[#E8DFD5] rounded-3xl overflow-hidden shadow-2xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
              Platform Security &amp; Audit Logs
            </h3>
            <div className="relative w-64">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filter action, user, IP..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E0D5C7] rounded-xl text-xs"
              />
              <Search className="w-3.5 h-3.5 text-[#9A8B7C] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E8DFD5] text-[#8C7A6B] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor &amp; Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3] font-mono text-[11px]">
                {auditLogs
                  .filter(
                    (l) =>
                      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      l.user_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      l.details.toLowerCase().includes(auditSearch.toLowerCase())
                  )
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-2.5 px-3 text-[#7A6A5C] tabular-nums whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-sans font-medium text-[#2C2420]">
                        {log.user_name} ({log.role})
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            log.action.includes('FAILED')
                              ? 'bg-[#FDF2F0] text-[#B43B2A]'
                              : log.action.includes('PASSWORD')
                              ? 'bg-[#FEF5E7] text-[#C46A28]'
                              : 'bg-[#FAF5EE] text-[#8C6D3B]'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[#6B5E52] max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#9A8B7C]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: SYSTEM CONFIGURATION & INTEGRATIONS */}
      {activeSection === 'admin-settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-[#E8DFD5] rounded-3xl p-6 shadow-2xs space-y-6 max-w-3xl">
          <div className="pb-3 border-b border-[#F2ECE3]">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
              Global Platform &amp; Integration Settings
            </h3>
            <p className="text-xs text-[#7A6A5C] mt-0.5">
              Configure VoyaraMedia application branding and external communication providers
            </p>
          </div>

          {settingsSaved && (
            <div className="p-3 bg-[#EDF8F2] border border-[#BCE4CD] rounded-xl text-xs text-[#1B6E44] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated successfully.
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#4A3B32] mb-1">Brand Name</label>
              <input
                type="text"
                value={settings.brand_name}
                onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Support Contact Email</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Public Registration Open</label>
                <select
                  value={settings.allow_new_registrations ? 'true' : 'false'}
                  onChange={(e) => setSettings({ ...settings, allow_new_registrations: e.target.value === 'true' })}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs"
                >
                  <option value="true">Allowed (Couples can create workspace)</option>
                  <option value="false">Closed (Invite only / Administrator provisioned)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F2ECE3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#2C2420]">SMTP Transactional Email Provider</span>
                <label className="flex items-center gap-2 text-xs text-[#4A3B32] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smtp_configured}
                    onChange={(e) => setSettings({ ...settings, smtp_configured: e.target.checked })}
                    className="rounded border-[#D4C3B3] text-[#8C6D3B]"
                  />
                  <span>Enable Live SMTP Dispatch</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#7A6A5C] mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.smtp_host || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    placeholder="smtp.sendgrid.net or smtp.gmail.com"
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#D8CCBD] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[#7A6A5C] mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.smtp_port || 587}
                    onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#D8CCBD] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#7A6A5C] mb-1">SMTP User / API Key</label>
                  <input
                    type="text"
                    value={settings.smtp_user || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#D8CCBD] rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[#7A6A5C] mb-1">From Sender Address</label>
                  <input
                    type="text"
                    value={settings.smtp_from || 'no-reply@voyaramedia.com'}
                    onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#D8CCBD] rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F2ECE3] flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white font-medium rounded-xl shadow-xs text-xs"
              >
                Save System Settings
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
