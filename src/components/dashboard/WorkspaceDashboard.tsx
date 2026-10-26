import React from 'react';
import type {
  WeddingEvent,
  CoupleProfile,
  Task,
  Expense,
  Guest,
  Vendor,
  FinancesSummary,
} from '../../types/index.ts';
import { CountdownHero } from './CountdownHero.tsx';
import {
  Wallet,
  CheckSquare,
  Users2,
  HeartHandshake,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  Send,
  Calendar,
} from 'lucide-react';

interface WorkspaceDashboardProps {
  weddingEvent?: WeddingEvent;
  engagementEvent?: WeddingEvent;
  coupleProfile: CoupleProfile | null;
  tasks: Task[];
  expenses: Expense[];
  guests: Guest[];
  vendors: Vendor[];
  finances: FinancesSummary | null;
  onNavigateTab: (tab: string) => void;
  onOpenNewTask: () => void;
  onOpenNewExpense: () => void;
  onOpenNewGuest: () => void;
  onEditDates: () => void;
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({
  weddingEvent,
  engagementEvent,
  coupleProfile,
  tasks,
  expenses,
  guests,
  vendors,
  finances,
  onNavigateTab,
  onOpenNewTask,
  onOpenNewExpense,
  onOpenNewGuest,
  onEditDates,
}) => {
  // Calculations from saved real data
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const taskPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'COMPLETED' && t.due_date && new Date(t.due_date) < now
  );

  const totalGuests = guests.length;
  const confirmedGuests = guests.filter((g) => g.rsvp_status === 'CONFIRMED').length;
  const totalConfirmedAttendees = guests
    .filter((g) => g.rsvp_status === 'CONFIRMED')
    .reduce((sum, g) => sum + 1 + (g.accompanying_count || 0), 0);
  const pendingRsvpGuests = guests.filter((g) => g.rsvp_status === 'PENDING').length;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const plannedBudget = finances?.totals.planned || 0;
  const actualSpent = finances?.totals.actual || 0;
  const amountPaid = finances?.totals.paid || 0;
  const outstanding = finances?.totals.outstanding || 0;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Countdown Hero */}
      <CountdownHero
        weddingEvent={weddingEvent}
        engagementEvent={engagementEvent}
        coupleProfile={coupleProfile}
        onEditDates={onEditDates}
        taskCompletionPercent={taskPercent}
      />

      {/* 2. Real Calculations KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget & Spend */}
        <div
          onClick={() => onNavigateTab('finances')}
          className="p-5 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs hover:border-[#D4AF37]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider">
              Finances &amp; Spend
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF5EE] text-[#8C6D3B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold text-[#2C2420] tabular-nums">
            {formatINR(actualSpent)}
          </p>
          <div className="flex items-center justify-between text-xs text-[#7A6A5C] mt-2 pt-2 border-t border-[#F2ECE3]">
            <span>Planned: {formatINR(plannedBudget)}</span>
            <span className="text-[#8C6D3B] font-medium">Paid: {formatINR(amountPaid)}</span>
          </div>
        </div>

        {/* Tasks & Deadlines */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="p-5 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs hover:border-[#D4AF37]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider">
              Task Checklist
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF5EE] text-[#8C6D3B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-2xl font-bold text-[#2C2420] tabular-nums">
              {completedTasks}
              <span className="text-base font-normal text-[#8C7A6B]">/{totalTasks}</span>
            </p>
            <span className="text-xs text-[#8C7A6B] font-medium">({Math.round(taskPercent)}%)</span>
          </div>
          <div className="text-xs text-[#7A6A5C] mt-2 pt-2 border-t border-[#F2ECE3] flex items-center justify-between">
            {overdueTasks.length > 0 ? (
              <span className="text-[#B43B2A] font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {overdueTasks.length} overdue
              </span>
            ) : (
              <span className="text-[#2D7A4D]">All deadlines on schedule</span>
            )}
            <span className="text-[#8C6D3B] group-hover:underline">View tasks →</span>
          </div>
        </div>

        {/* Guests & RSVPs */}
        <div
          onClick={() => onNavigateTab('guests')}
          className="p-5 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs hover:border-[#D4AF37]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider">
              Guests &amp; RSVPs
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF5EE] text-[#8C6D3B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-2xl font-bold text-[#2C2420] tabular-nums">
              {totalConfirmedAttendees}
            </p>
            <span className="text-xs text-[#8C7A6B]">attending</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#7A6A5C] mt-2 pt-2 border-t border-[#F2ECE3]">
            <span>Total on list: {totalGuests}</span>
            <span className="text-[#8C6D3B]">{pendingRsvpGuests} pending</span>
          </div>
        </div>

        {/* Vendors */}
        <div
          onClick={() => onNavigateTab('vendors')}
          className="p-5 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs hover:border-[#D4AF37]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#8C7A6B] uppercase tracking-wider">
              Vendors Directory
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF5EE] text-[#8C6D3B] flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold text-[#2C2420] tabular-nums">
            {vendors.length}
          </p>
          <div className="flex items-center justify-between text-xs text-[#7A6A5C] mt-2 pt-2 border-t border-[#F2ECE3]">
            <span>Booked: {vendors.filter((v) => v.booking_status === 'BOOKED').length}</span>
            <span className="text-[#8C6D3B] group-hover:underline">Manage vendors →</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Hub */}
      <div className="p-4 sm:p-6 bg-[#FAF5EE] border border-[#E5DACD] rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-base font-semibold text-[#2C2420]">Quick Management Actions</h3>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Log financial entries, record tasks, and manage guests in your workspace
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenNewExpense}
            className="px-3.5 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#8C6D3B]" />
            Record Expense
          </button>
          <button
            onClick={onOpenNewTask}
            className="px-3.5 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#8C6D3B]" />
            Add Task
          </button>
          <button
            onClick={onOpenNewGuest}
            className="px-3.5 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#8C6D3B]" />
            Add Guest
          </button>
          <button
            onClick={() => onNavigateTab('invitations')}
            className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Send Invitations
          </button>
        </div>
      </div>

      {/* 4. Split Grid: Upcoming Tasks & Urgent Deadlines / Financial Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="p-6 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
              <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
                Immediate Tasks &amp; Deadlines
              </h3>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs text-[#8C6D3B] hover:underline flex items-center gap-1"
              >
                View all ({tasks.length}) <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8C7A6B]">
                  <p>No tasks created yet.</p>
                  <p className="mt-1">Add your wedding preparations or load a checklist template.</p>
                  <button
                    onClick={onOpenNewTask}
                    className="mt-3 px-3 py-1.5 bg-[#FAF5EE] border border-[#E2D5C8] text-[#8C6D3B] rounded-lg text-xs font-medium hover:bg-[#F0E6D8]"
                  >
                    Create First Task
                  </button>
                </div>
              ) : (
                tasks.slice(0, 5).map((task) => {
                  const isOverdue = task.status !== 'COMPLETED' && task.due_date && new Date(task.due_date) < now;
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-[#F2ECE3] hover:border-[#D4C3B3] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            task.status === 'COMPLETED'
                              ? 'bg-[#2D7A4D]'
                              : task.priority === 'URGENT'
                              ? 'bg-[#B43B2A]'
                              : 'bg-[#D4AF37]'
                          }`}
                        />
                        <span
                          className={`truncate font-medium ${
                            task.status === 'COMPLETED' ? 'line-through text-[#9A8B7C]' : 'text-[#2C2420]'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 text-[#7A6A5C]">
                        {task.due_date && (
                          <span
                            className={`tabular-nums ${
                              isOverdue ? 'text-[#B43B2A] font-semibold' : ''
                            }`}
                          >
                            {task.due_date}
                          </span>
                        )}
                        <span className="text-[10px] uppercase text-[#9A8B7C] bg-[#FAF5EE] px-1.5 py-0.5 rounded">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Financial Distribution Preview */}
        <div className="p-6 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
              <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
                Budget Utilization &amp; Categories
              </h3>
              <button
                onClick={() => onNavigateTab('finances')}
                className="text-xs text-[#8C6D3B] hover:underline flex items-center gap-1"
              >
                Detailed Ledger <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {finances?.byCategory && finances.byCategory.length > 0 ? (
                finances.byCategory.slice(0, 5).map((cat) => {
                  const maxAmount = Math.max(cat.planned, cat.actual, 1);
                  const spendPercent = Math.min(100, Math.round((cat.actual / maxAmount) * 100));
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#2C2420]">{cat.category}</span>
                        <div className="flex items-center gap-2 text-[#7A6A5C] tabular-nums font-mono text-[11px]">
                          <span>Actual: {formatINR(cat.actual)}</span>
                          <span className="text-[#C4B5A5]">/</span>
                          <span>Plan: {formatINR(cat.planned)}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[#F2ECE3] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            cat.actual > cat.planned && cat.planned > 0 ? 'bg-[#B43B2A]' : 'bg-[#8C6D3B]'
                          }`}
                          style={{ width: `${spendPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-[#8C7A6B]">
                  <p>No expenses recorded yet.</p>
                  <p className="mt-1">Log costs for venue, decoration, catering, and attire.</p>
                  <button
                    onClick={onOpenNewExpense}
                    className="mt-3 px-3 py-1.5 bg-[#FAF5EE] border border-[#E2D5C8] text-[#8C6D3B] rounded-lg text-xs font-medium hover:bg-[#F0E6D8]"
                  >
                    Log First Expense
                  </button>
                </div>
              )}
            </div>
          </div>

          {outstanding > 0 && (
            <div className="mt-5 p-3 bg-[#FDF8EE] border border-[#F0E2C8] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#8C6D3B] font-medium">Outstanding Balances to Vendors:</span>
              <span className="font-mono font-bold text-[#2C2420] tabular-nums">{formatINR(outstanding)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
