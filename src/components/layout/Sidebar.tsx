import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  CheckSquare,
  Wallet,
  Users2,
  Send,
  HeartHandshake,
  Image as ImageIcon,
  FileBarChart,
  Settings,
  Shield,
  Building2,
  Users,
  ScrollText,
  Sliders,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, isSuperAdmin, workspace } = useAuth();

  const handleSelect = (tab: string) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const workspaceNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ceremonies', label: 'Ceremonies & Timeline', icon: Sparkles },
    { id: 'tasks', label: 'Tasks & Deadlines', icon: CheckSquare },
    { id: 'finances', label: 'Budget & Expenses', icon: Wallet },
    { id: 'vendors', label: 'Vendors Directory', icon: HeartHandshake },
    { id: 'guests', label: 'Guest List & RSVP', icon: Users2 },
    { id: 'invitations', label: 'Digital Invitations', icon: Send },
    { id: 'calendar', label: 'Wedding Calendar', icon: CalendarDays },
    { id: 'couple', label: 'Couple Profile & Gallery', icon: ImageIcon },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart },
    { id: 'settings', label: 'Workspace Settings', icon: Settings },
  ];

  const adminNav = [
    { id: 'admin-overview', label: 'Platform Console', icon: LayoutDashboard },
    { id: 'admin-workspaces', label: 'Wedding Workspaces', icon: Building2 },
    { id: 'admin-users', label: 'Users & Roles', icon: Users },
    { id: 'admin-audit', label: 'Security & Audit Logs', icon: ScrollText },
    { id: 'admin-settings', label: 'Integration Settings', icon: Sliders },
  ];

  const items = isSuperAdmin ? adminNav : workspaceNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-18 left-0 z-40 h-[calc(100vh-4.5rem)] w-64 bg-[#FAF8F5] border-r border-[#EAE2D8] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="py-5 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-3 mb-2 border-b border-[#EAE2D8]">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#9A8B7C]">
              {isSuperAdmin ? 'VoyaraMedia Super Admin' : (workspace?.name || 'Wedding Workspace')}
            </span>
            <p className="text-xs text-[#6B5E52] mt-0.5 truncate">
              {isSuperAdmin ? 'Global Administrative Panel' : `Role: ${user?.role?.replace('_', ' ') || 'User'}`}
            </p>
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#EFE7DE] text-[#2C2420] font-semibold shadow-2xs'
                    : 'text-[#6B5E52] hover:bg-[#F4ECE3] hover:text-[#2C2420]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8C6D3B]' : 'text-[#9A8B7C]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Brand Info */}
        <div className="p-4 border-t border-[#EAE2D8] bg-[#F7F2EC]/60">
          <div className="flex items-center justify-between text-[11px] text-[#9A8B7C]">
            <span>VoyaraMedia © 2026</span>
            <span className="font-mono text-[10px]">v1.0-PRO</span>
          </div>
        </div>
      </aside>
    </>
  );
};
