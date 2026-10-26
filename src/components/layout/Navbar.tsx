import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { LogOut, ShieldCheck, Heart, UserCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenRegister,
}) => {
  const { user, workspace, coupleProfile, isAuthenticated, isSuperAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8DFD5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title (One line, clean wordmark) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab(isSuperAdmin ? 'admin-overview' : 'dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#D4AF37]/20 via-[#E8D8C8] to-[#C5A880]/30 border border-[#D4AF37]/40 flex items-center justify-center text-[#8C6D3B] group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4 fill-[#C5A880]/40 stroke-[#8C6D3B]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-[#2C2420] whitespace-nowrap">
                Our Wedding Planner
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#9A8B7C] font-medium -mt-1">
                by VoyaraMedia
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-5 Concise Single-line Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#6B5E52]">
          {isAuthenticated && !isSuperAdmin && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'dashboard'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('ceremonies')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'ceremonies'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Ceremonies
              </button>
              <button
                onClick={() => setActiveTab('finances')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'finances'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Finances & Budget
              </button>
              <button
                onClick={() => setActiveTab('guests')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'guests'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Guests & RSVP
              </button>
              <button
                onClick={() => setActiveTab('invitations')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'invitations'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Digital Invitations
              </button>
            </>
          )}

          {isSuperAdmin && (
            <>
              <button
                onClick={() => setActiveTab('admin-overview')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'admin-overview'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Platform Console
              </button>
              <button
                onClick={() => setActiveTab('admin-workspaces')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'admin-workspaces'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Workspaces
              </button>
              <button
                onClick={() => setActiveTab('admin-users')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'admin-users'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Users & Roles
              </button>
              <button
                onClick={() => setActiveTab('admin-audit')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'admin-audit'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Security Audit
              </button>
              <button
                onClick={() => setActiveTab('admin-settings')}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  activeTab === 'admin-settings'
                    ? 'border-[#A37B47] text-[#2C2420] font-semibold'
                    : 'border-transparent hover:text-[#2C2420] hover:border-[#D4C3B3]'
                }`}
              >
                Settings
              </button>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-2 text-xs text-[#8C7A6B]">
              <span>Private Wedding Workspaces</span>
              <span aria-hidden="true">·</span>
              <span>Secure Guest RSVPs</span>
              <span aria-hidden="true">·</span>
              <span>Real-Time Budgeting</span>
            </div>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-[#2C2420] truncate max-w-[140px]">
                  {isSuperAdmin ? 'Voyara Administrator' : (coupleProfile?.groom_name && coupleProfile?.bride_name ? `${coupleProfile.groom_name} & ${coupleProfile.bride_name}` : user?.full_name)}
                </span>
                <span className="text-[11px] text-[#8C7A6B]">
                  {isSuperAdmin ? 'Global Super Admin' : (workspace?.name || 'Wedding Workspace')}
                </span>
              </div>

              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#A37B47] bg-[#F4EFEB] px-2 py-0.5 rounded border border-[#E0D4C5]">
                  <ShieldCheck className="w-3 h-3 text-[#A37B47]" />
                  Admin
                </span>
              )}

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-[#7A6A5C] hover:text-[#2C2420] hover:bg-[#F2ECE4] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 text-xs font-medium text-[#4A3B32] hover:text-[#1A1412] hover:bg-[#F0EAE1] rounded-lg transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={onOpenRegister}
                className="px-4 py-2 text-xs font-medium text-white bg-[#8C6D3B] hover:bg-[#785C30] active:bg-[#684F29] rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                Create Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
