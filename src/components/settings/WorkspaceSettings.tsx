import React, { useState } from 'react';
import type { Workspace, User } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Settings,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Key,
  Lock,
} from 'lucide-react';

interface WorkspaceSettingsProps {
  workspace: Workspace | null;
  user: User | null;
  onRefresh: () => void;
  onOpenChangePassword: () => void;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({
  workspace,
  user,
  onRefresh,
  onOpenChangePassword,
}) => {
  const [name, setName] = useState(workspace?.name || '');
  const [currency, setCurrency] = useState(workspace?.currency || 'INR');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateWorkspace({ name, currency });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="pb-4 border-b border-[#E8DFD5]">
        <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">Workspace Settings</h2>
        <p className="text-xs text-[#7A6A5C] mt-0.5">
          Manage workspace naming, display currency, and security credentials
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-[#EDF8F2] border border-[#BCE4CD] rounded-xl text-xs text-[#1B6E44] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Workspace settings saved successfully.
        </div>
      )}

      {/* Workspace Configuration Form */}
      <form onSubmit={handleSave} className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4 text-xs">
        <div>
          <label className="block font-medium text-[#4A3B32] mb-1">Wedding Workspace Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
          />
        </div>

        <div>
          <label className="block font-medium text-[#4A3B32] mb-1">Preferred Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
          >
            <option value="INR">Indian Rupee (₹ INR)</option>
            <option value="USD">US Dollar ($ USD)</option>
            <option value="GBP">British Pound (£ GBP)</option>
            <option value="EUR">Euro (€ EUR)</option>
            <option value="AED">UAE Dirham (AED)</option>
          </select>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Account Security & Password */}
      <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-semibold text-[#2C2420] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#8C6D3B]" />
              Account Password &amp; Authentication
            </h3>
            <p className="text-xs text-[#7A6A5C] mt-0.5">
              Signed in as <span className="font-medium text-[#2C2420]">{user?.email}</span> ({user?.role})
            </p>
          </div>

          <button
            onClick={onOpenChangePassword}
            className="px-3.5 py-2 border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl transition-colors shadow-2xs"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Tenant Isolation Info */}
      <div className="p-5 bg-[#FAF5EE] border border-[#E5DACD] rounded-2xl text-xs text-[#6B5E52] space-y-2">
        <div className="flex items-center gap-2 font-semibold text-[#2C2420]">
          <ShieldCheck className="w-4 h-4 text-[#8C6D3B]" />
          <span>Tenant Data Isolation Guarantee</span>
        </div>
        <p className="leading-relaxed text-[11px] text-[#7A6A5C]">
          All events, guests, budgets, tasks, and private attachments in this workspace ({workspace?.id}) are cryptographically and server-isolated. No other couples or workspaces can access your information.
        </p>
      </div>
    </div>
  );
};
