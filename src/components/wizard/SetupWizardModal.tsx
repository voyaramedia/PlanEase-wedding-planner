import React, { useState } from 'react';
import type { Workspace, CoupleProfile, WeddingEvent } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Sparkles,
  Calendar,
  Wallet,
  Users2,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  coupleProfile: CoupleProfile | null;
  events: WeddingEvent[];
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  workspace,
  coupleProfile,
  events,
  onRefresh,
  onNavigateTab,
}) => {
  const [step, setStep] = useState<number>(1);
  const [groomName, setGroomName] = useState(coupleProfile?.groom_name || '');
  const [brideName, setBrideName] = useState(coupleProfile?.bride_name || '');
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingVenue, setWeddingVenue] = useState('');
  const [engagementDate, setEngagementDate] = useState('');
  const [engagementVenue, setEngagementVenue] = useState('');
  const [budgetAllocation, setBudgetAllocation] = useState('1500000');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSaveStep1 = async () => {
    setLoading(true);
    try {
      await api.updateCoupleProfile({ groom_name: groomName, bride_name: brideName });
      onRefresh();
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStep2 = async () => {
    setLoading(true);
    try {
      if (weddingDate) {
        await api.createEvent({
          event_type: 'WEDDING',
          title: 'Wedding Ceremony & Reception',
          date_time: new Date(weddingDate).toISOString(),
          venue_name: weddingVenue,
          venue_address: '',
          budget_allocated: parseFloat(budgetAllocation) || 0,
        });
      }
      if (engagementDate) {
        await api.createEvent({
          event_type: 'ENGAGEMENT',
          title: 'Engagement & Ring Ceremony',
          date_time: new Date(engagementDate).toISOString(),
          venue_name: engagementVenue,
          venue_address: '',
          budget_allocated: 0,
        });
      }
      onRefresh();
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onClose();
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E0D5C7] rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EE] text-[#8C6D3B] border border-[#E2D5C8] flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">
            Welcome to Your Wedding Planner
          </h2>
          <p className="text-xs text-[#7A6A5C] mt-1">
            Let's configure your wedding journal, countdowns, and key celebration milestones
          </p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`w-8 h-1 rounded-full ${step >= 1 ? 'bg-[#8C6D3B]' : 'bg-[#E0D5C7]'}`} />
            <span className={`w-8 h-1 rounded-full ${step >= 2 ? 'bg-[#8C6D3B]' : 'bg-[#E0D5C7]'}`} />
            <span className={`w-8 h-1 rounded-full ${step >= 3 ? 'bg-[#8C6D3B]' : 'bg-[#E0D5C7]'}`} />
          </div>
        </div>

        {/* STEP 1: Couple Names */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl space-y-3">
              <span className="font-serif font-semibold text-sm text-[#2C2420] block">
                Confirm Couple Names
              </span>
              <div>
                <label className="block text-[#4A3B32] mb-1 font-medium">Groom's Full Name</label>
                <input
                  type="text"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[#4A3B32] mb-1 font-medium">Bride's Full Name</label>
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="e.g. Ananya Roy"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-[#8C7A6B] hover:underline"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleSaveStep1}
                disabled={loading}
                className="px-5 py-2.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium"
              >
                Next: Ceremony Dates →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Ceremony Dates */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl space-y-3">
              <span className="font-serif font-semibold text-sm text-[#2C2420] block">
                Set Event Dates for Live Countdown
              </span>

              <div>
                <label className="block text-[#4A3B32] mb-1 font-medium">Wedding Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[#4A3B32] mb-1 font-medium">Wedding Venue Name</label>
                <input
                  type="text"
                  value={weddingVenue}
                  onChange={(e) => setWeddingVenue(e.target.value)}
                  placeholder="e.g. The Taj Palace Ballroom"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 border-t border-[#F2ECE3]">
                <label className="block text-[#4A3B32] mb-1 font-medium">Engagement Date &amp; Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={engagementDate}
                  onChange={(e) => setEngagementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-[#8C7A6B] hover:underline"
              >
                Skip this step
              </button>
              <button
                type="button"
                onClick={handleSaveStep2}
                disabled={loading}
                className="px-5 py-2.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium"
              >
                Next: Budget Planning →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Quick Start Hub */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="p-5 bg-white border border-[#E8DFD5] rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#2D7A4D] mx-auto" />
              <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
                Your Wedding Workspace is Ready!
              </h3>
              <p className="text-xs text-[#7A6A5C] max-w-sm mx-auto leading-relaxed">
                You can now log expenses, track vendors, design digital invitations, and manage RSVPs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('tasks');
                }}
                className="p-3 bg-[#FAF5EE] border border-[#E2D5C8] rounded-xl text-left hover:border-[#8C6D3B] transition-colors"
              >
                <span className="font-semibold text-[#2C2420] block">Tasks Checklist</span>
                <span className="text-[10px] text-[#7A6A5C]">Load preparation milestones</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('guests');
                }}
                className="p-3 bg-[#FAF5EE] border border-[#E2D5C8] rounded-xl text-left hover:border-[#8C6D3B] transition-colors"
              >
                <span className="font-semibold text-[#2C2420] block">Guest List</span>
                <span className="text-[10px] text-[#7A6A5C]">Add and invite your guests</span>
              </button>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white font-medium rounded-xl text-xs mt-2"
            >
              Enter Wedding Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
