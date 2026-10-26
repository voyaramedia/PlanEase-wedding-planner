import React from 'react';
import type { Task, Expense, Guest, Vendor, FinancesSummary, WeddingEvent } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  FileBarChart,
  Download,
  Calendar,
  Wallet,
  CheckSquare,
  Users2,
  HeartHandshake,
} from 'lucide-react';

interface ReportsViewProps {
  tasks: Task[];
  expenses: Expense[];
  guests: Guest[];
  vendors: Vendor[];
  events: WeddingEvent[];
  finances: FinancesSummary | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  tasks,
  expenses,
  guests,
  vendors,
  events,
  finances,
}) => {
  const currentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleExportFinances = () => {
    const token = api.getToken();
    window.location.href = `/api/finances/export?token=${token}`;
  };

  const handleExportGuests = () => {
    const token = api.getToken();
    window.location.href = `/api/guests/export?token=${token}`;
  };

  const totalPlanned = finances?.totals.planned || 0;
  const totalActual = finances?.totals.actual || 0;
  const totalPaid = finances?.totals.paid || 0;
  const outstanding = finances?.totals.outstanding || 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalConfirmed = guests.filter((g) => g.rsvp_status === 'CONFIRMED').length;
  const totalDeclined = guests.filter((g) => g.rsvp_status === 'DECLINED').length;
  const totalPending = guests.filter((g) => g.rsvp_status === 'PENDING').length;
  const totalHeads = guests
    .filter((g) => g.rsvp_status === 'CONFIRMED')
    .reduce((sum, g) => sum + 1 + (g.accompanying_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#8C7A6B]">
            <Calendar className="w-3.5 h-3.5 text-[#8C6D3B]" />
            <span>Reporting Date: {currentDate}</span>
            <span aria-hidden="true">·</span>
            <span>Currency: Indian Rupee (INR ₹)</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420] mt-1">
            Platform Reports &amp; Comprehensive Analytics
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportFinances}
            className="px-3.5 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#8C6D3B]" />
            Export Financial Ledger
          </button>
          <button
            onClick={handleExportGuests}
            className="px-3.5 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#8C6D3B]" />
            Export Guest &amp; RSVP Data
          </button>
        </div>
      </div>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#8C6D3B]" />
              Financial &amp; Budget Audit
            </h3>
            <span className="text-xs text-[#8C7A6B] font-mono tabular-nums">
              {expenses.length} Records
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl">
              <span className="text-[#6B5E52]">Planned Celebration Budget:</span>
              <span className="font-mono font-semibold text-[#2C2420] tabular-nums">
                {formatINR(totalPlanned)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl">
              <span className="text-[#6B5E52]">Total Actual Expenses Incurred:</span>
              <span className="font-mono font-semibold text-[#2C2420] tabular-nums">
                {formatINR(totalActual)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl">
              <span className="text-[#6B5E52]">Amount Disbursed to Date:</span>
              <span className="font-mono font-semibold text-[#2D7A4D] tabular-nums">
                {formatINR(totalPaid)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl">
              <span className="text-[#6B5E52]">Outstanding Payables Balance:</span>
              <span className="font-mono font-bold text-[#B43B2A] tabular-nums">
                {formatINR(outstanding)}
              </span>
            </div>
          </div>
        </div>

        {/* Guest & RSVP Analytics */}
        <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420] flex items-center gap-2">
              <Users2 className="w-4 h-4 text-[#8C6D3B]" />
              Guest RSVP Breakdown
            </h3>
            <span className="text-xs text-[#8C7A6B] font-mono tabular-nums">
              {guests.length} Parties
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#EBF7F0] rounded-xl text-[#1D7543]">
              <span className="font-medium">Confirmed Attending:</span>
              <span className="font-mono font-bold tabular-nums">
                {totalHeads} Attendees ({totalConfirmed} primary guests)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FEF5E7] rounded-xl text-[#C46A28]">
              <span className="font-medium">Awaiting Digital RSVP:</span>
              <span className="font-mono font-bold tabular-nums">
                {totalPending} Invitations
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FDF2F0] rounded-xl text-[#B43B2A]">
              <span className="font-medium">Regretfully Declined:</span>
              <span className="font-mono font-bold tabular-nums">
                {totalDeclined} Guests
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl text-[#6B5E52]">
              <span>Invitation Sent Coverage:</span>
              <span className="font-mono font-semibold tabular-nums">
                {guests.length > 0
                  ? Math.round((guests.filter((g) => g.invitation_status === 'SENT').length / guests.length) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Tasks & Milestones */}
        <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#8C6D3B]" />
              Operational Milestones
            </h3>
            <span className="text-xs text-[#8C7A6B] font-mono tabular-nums">
              {completedTasks}/{totalTasks} Completed
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#6B5E52]">Overall Checklist Progress</span>
                <span className="font-mono font-bold text-[#8C6D3B] tabular-nums">{taskPercent}%</span>
              </div>
              <div className="w-full h-2 bg-[#F2ECE3] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8C6D3B] rounded-full transition-all duration-300"
                  style={{ width: `${taskPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[#6B5E52]">Total Preparation Tasks:</span>
              <span className="font-mono font-semibold text-[#2C2420] tabular-nums">{totalTasks}</span>
            </div>
          </div>
        </div>

        {/* Vendors Summary */}
        <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420] flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#8C6D3B]" />
              Contracted Vendors
            </h3>
            <span className="text-xs text-[#8C7A6B] font-mono tabular-nums">
              {vendors.length} Vendors
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl">
              <span className="text-[#6B5E52]">Booked &amp; Confirmed:</span>
              <span className="font-mono font-semibold text-[#1D7543] tabular-nums">
                {vendors.filter((v) => v.booking_status === 'BOOKED').length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl">
              <span className="text-[#6B5E52]">Inquiry &amp; Quoted Stage:</span>
              <span className="font-mono font-semibold text-[#C46A28] tabular-nums">
                {vendors.filter((v) => v.booking_status === 'INQUIRY' || v.booking_status === 'QUOTED').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
