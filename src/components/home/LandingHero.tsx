import React from 'react';
import {
  Heart,
  Calendar,
  Wallet,
  Users2,
  Sparkles,
  ShieldCheck,
  Send,
  ArrowRight,
} from 'lucide-react';

interface LandingHeroProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onSuperAdminClick?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenLogin,
  onOpenRegister,
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E8DFD5] bg-[#FAF8F5] shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Hero Text (7 cols) */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8C6D3B]">
              <Heart className="w-4 h-4 fill-[#C5A880]/30 stroke-[#8C6D3B]" />
              <span>Our Wedding Planner · VoyaraMedia</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#2C2420] text-balance leading-tight">
              A timeless journal for your celebration and sacred vows.
            </h1>

            <p className="text-sm sm:text-base text-[#6B5E52] max-w-xl leading-relaxed">
              Centrally manage your engagement rituals, wedding countdowns, financial ledgers, vendor bookings, digital invitations, and real guest RSVPs in an elegant, private workspace.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenRegister}
                className="px-6 py-3 bg-[#8C6D3B] hover:bg-[#785C30] active:bg-[#684F29] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                Create Wedding Workspace
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenLogin}
                className="px-6 py-3 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-sm font-medium rounded-xl transition-colors shadow-2xs"
              >
                Sign In to Workspace
              </button>
            </div>

            <div className="pt-6 border-t border-[#EAE2D8] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#8C7A6B]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8C6D3B]" />
                Tenant Isolated Workspaces
              </span>
              <span className="flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#8C6D3B]" />
                Digital Cards &amp; Verified RSVP
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#8C6D3B]" />
                Actual Budget Ledger
              </span>
            </div>
          </div>

          {/* Right Hero Image (5 cols) */}
          <div className="lg:col-span-5 relative min-h-[340px] lg:min-h-full">
            <img
              src="/src/assets/images/hero_wedding_couple_1793002740598.jpg"
              alt="Luxury Wedding Couple"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#FAF8F5]/80 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Feature Pillar Bento Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] tracking-wider">
            Curated Capabilities
          </span>
          <h2 className="font-serif text-3xl font-medium text-[#2C2420]">
            Everything needed for seamless wedding preparation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF5EE] text-[#8C6D3B] flex items-center justify-center border border-[#E8DFD5]">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
              Live Second-by-Second Countdowns
            </h3>
            <p className="text-xs text-[#7A6A5C] leading-relaxed">
              Independent, accurate countdown clocks for your engagement and wedding rituals based on verified event dates.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF5EE] text-[#8C6D3B] flex items-center justify-center border border-[#E8DFD5]">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
              Mathematical Financial Ledger
            </h3>
            <p className="text-xs text-[#7A6A5C] leading-relaxed">
              Track planned allocations, actual amounts, and vendor advances without fabricated numbers or double counting.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF5EE] text-[#8C6D3B] flex items-center justify-center border border-[#E8DFD5]">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
              Digital Invitations &amp; Public RSVP
            </h3>
            <p className="text-xs text-[#7A6A5C] leading-relaxed">
              Upload custom card designs, deliver personalized links, and gather confirmed headcounts directly from guests.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
