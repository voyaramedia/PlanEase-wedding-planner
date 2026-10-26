import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { api } from './services/api.ts';
import type {
  WeddingEvent,
  Task,
  Expense,
  Vendor,
  Guest,
  InvitationDesign,
  InvitationDeliveryLog,
  GalleryItem,
  FinancesSummary,
} from './types/index.ts';

// Layout & Components
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { LandingHero } from './components/home/LandingHero.tsx';
import { WorkspaceDashboard } from './components/dashboard/WorkspaceDashboard.tsx';
import { CeremoniesManager } from './components/ceremonies/CeremoniesManager.tsx';
import { TaskManager } from './components/tasks/TaskManager.tsx';
import { BudgetExpenses } from './components/finances/BudgetExpenses.tsx';
import { VendorDirectory } from './components/vendors/VendorDirectory.tsx';
import { GuestManager } from './components/guests/GuestManager.tsx';
import { InvitationStudio } from './components/invitations/InvitationStudio.tsx';
import { WeddingCalendar } from './components/calendar/WeddingCalendar.tsx';
import { CoupleProfileGallery } from './components/couple/CoupleProfileGallery.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { WorkspaceSettings } from './components/settings/WorkspaceSettings.tsx';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard.tsx';

// Modals
import { LoginModal } from './components/auth/LoginModal.tsx';
import { RegisterModal } from './components/auth/RegisterModal.tsx';
import { ForcePasswordChangeModal } from './components/auth/ForcePasswordChangeModal.tsx';
import { SetupWizardModal } from './components/wizard/SetupWizardModal.tsx';
import { PublicRsvpPage } from './components/rsvp/PublicRsvpPage.tsx';

function MainApp() {
  const { user, workspace, coupleProfile, isAuthenticated, isSuperAdmin, setCoupleProfile, refreshMe } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // Workspace Data
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invitations, setInvitations] = useState<InvitationDesign[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<InvitationDeliveryLog[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [finances, setFinances] = useState<FinancesSummary | null>(null);
  const [preselectedGuestIds, setPreselectedGuestIds] = useState<string[]>([]);

  // Fetch workspace data
  const loadWorkspaceData = async () => {
    if (!isAuthenticated || isSuperAdmin) return;

    try {
      const [evts, tsks, exps, vnds, gsts, invs, logs, gal, fins] = await Promise.all([
        api.getEvents(),
        api.getTasks(),
        api.getExpenses(),
        api.getVendors(),
        api.getGuests(),
        api.getInvitations(),
        api.getDeliveryLogs(),
        api.getGallery(),
        api.getFinancesSummary(),
      ]);

      setEvents(evts);
      setTasks(tsks);
      setExpenses(exps);
      setVendors(vnds);
      setGuests(gsts);
      setInvitations(invs);
      setDeliveryLogs(logs);
      setGallery(gal);
      setFinances(fins);
    } catch (err) {
      console.error('Error fetching workspace data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (isSuperAdmin) {
        setActiveTab('admin-overview');
      } else {
        setActiveTab('dashboard');
        loadWorkspaceData();
      }
    }
  }, [isAuthenticated, isSuperAdmin]);

  const weddingEvent = events.find((e) => e.event_type === 'WEDDING');
  const engagementEvent = events.find((e) => e.event_type === 'ENGAGEMENT');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2C2420]">
      {/* Top Bar Contract Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Main Body */}
      {isAuthenticated ? (
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Content Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
            {/* Super Admin Tabs */}
            {isSuperAdmin && activeTab.startsWith('admin-') && (
              <SuperAdminDashboard
                activeSection={activeTab}
                onNavigateSection={setActiveTab}
              />
            )}

            {/* Wedding Workspace Tabs */}
            {!isSuperAdmin && (
              <>
                {activeTab === 'dashboard' && (
                  <WorkspaceDashboard
                    weddingEvent={weddingEvent}
                    engagementEvent={engagementEvent}
                    coupleProfile={coupleProfile}
                    tasks={tasks}
                    expenses={expenses}
                    guests={guests}
                    vendors={vendors}
                    finances={finances}
                    onNavigateTab={setActiveTab}
                    onOpenNewTask={() => setActiveTab('tasks')}
                    onOpenNewExpense={() => setActiveTab('finances')}
                    onOpenNewGuest={() => setActiveTab('guests')}
                    onEditDates={() => setActiveTab('ceremonies')}
                  />
                )}

                {activeTab === 'ceremonies' && (
                  <CeremoniesManager
                    events={events}
                    tasks={tasks}
                    expenses={expenses}
                    vendors={vendors}
                    onRefresh={loadWorkspaceData}
                    onNavigateTab={setActiveTab}
                  />
                )}

                {activeTab === 'tasks' && (
                  <TaskManager
                    tasks={tasks}
                    events={events}
                    onRefresh={loadWorkspaceData}
                  />
                )}

                {activeTab === 'finances' && (
                  <BudgetExpenses
                    expenses={expenses}
                    events={events}
                    vendors={vendors}
                    finances={finances}
                    onRefresh={loadWorkspaceData}
                  />
                )}

                {activeTab === 'vendors' && (
                  <VendorDirectory
                    vendors={vendors}
                    events={events}
                    onRefresh={loadWorkspaceData}
                  />
                )}

                {activeTab === 'guests' && (
                  <GuestManager
                    guests={guests}
                    events={events}
                    coupleProfile={coupleProfile}
                    onRefresh={loadWorkspaceData}
                    onSendInvitationsForGuests={(ids) => {
                      setPreselectedGuestIds(ids);
                      setActiveTab('invitations');
                    }}
                  />
                )}

                {activeTab === 'invitations' && (
                  <InvitationStudio
                    invitations={invitations}
                    guests={guests}
                    events={events}
                    coupleProfile={coupleProfile}
                    deliveryLogs={deliveryLogs}
                    preselectedGuestIds={preselectedGuestIds}
                    onClearPreselected={() => setPreselectedGuestIds([])}
                    onRefresh={loadWorkspaceData}
                  />
                )}

                {activeTab === 'calendar' && (
                  <WeddingCalendar
                    events={events}
                    tasks={tasks}
                    expenses={expenses}
                    onOpenNewEvent={() => setActiveTab('ceremonies')}
                  />
                )}

                {activeTab === 'couple' && (
                  <CoupleProfileGallery
                    coupleProfile={coupleProfile}
                    gallery={gallery}
                    onRefresh={loadWorkspaceData}
                    onProfileUpdated={(updated) => setCoupleProfile(updated)}
                  />
                )}

                {activeTab === 'reports' && (
                  <ReportsView
                    tasks={tasks}
                    expenses={expenses}
                    guests={guests}
                    vendors={vendors}
                    events={events}
                    finances={finances}
                  />
                )}

                {activeTab === 'settings' && (
                  <WorkspaceSettings
                    workspace={workspace}
                    user={user}
                    onRefresh={loadWorkspaceData}
                    onOpenChangePassword={() => {}}
                  />
                )}
              </>
            )}
          </main>
        </div>
      ) : (
        /* Unauthenticated Landing Experience */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <LandingHero
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        </main>
      )}

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => setIsRegisterOpen(true)}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => setIsLoginOpen(true)}
        onRegisteredSuccess={() => setIsSetupWizardOpen(true)}
      />

      {/* Enforce Password Change if Required */}
      <ForcePasswordChangeModal />

      {/* First-Time Guided Setup Wizard */}
      <SetupWizardModal
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        workspace={workspace}
        coupleProfile={coupleProfile}
        events={events}
        onRefresh={loadWorkspaceData}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}

export default function App() {
  // Check if current browser URL is a public guest RSVP link (e.g. /rsvp/:token)
  const pathname = window.location.pathname;
  if (pathname.startsWith('/rsvp/')) {
    const token = pathname.replace('/rsvp/', '').trim();
    if (token) {
      return (
        <PublicRsvpPage
          token={token}
          onGoHome={() => {
            window.location.href = '/';
          }}
        />
      );
    }
  }

  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
