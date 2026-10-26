import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import confetti from 'canvas-confetti';
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  Send,
  Users,
} from 'lucide-react';

interface PublicRsvpPageProps {
  token: string;
  onGoHome?: () => void;
}

export const PublicRsvpPage: React.FC<PublicRsvpPageProps> = ({
  token,
  onGoHome,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RSVP Form State
  const [attending, setAttending] = useState<boolean | null>(null);
  const [accompanyingCount, setAccompanyingCount] = useState<number>(0);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRsvp = async () => {
      setLoading(true);
      try {
        const res = await api.getPublicRsvp(token);
        setData(res);
        if (res.guest.rsvp_status === 'CONFIRMED') setAttending(true);
        if (res.guest.rsvp_status === 'DECLINED') setAttending(false);
        setAccompanyingCount(res.guest.accompanying_count || 0);
        setDietaryNotes(res.guest.dietary_preferences || '');
      } catch (err: any) {
        setError(err.message || 'Invitation not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchRsvp();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attending === null) {
      alert('Please select whether you will be attending.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitPublicRsvp(token, {
        attending,
        accompanying_count: attending ? accompanyingCount : 0,
        dietary_notes: dietaryNotes,
        personal_message: personalMessage,
      });

      setSubmittedMessage(res.message);

      if (attending) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#E8D8C8', '#C5A880', '#F2ECE3'],
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit RSVP.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#8C6D3B] border-t-transparent animate-spin mx-auto" />
          <p className="font-serif text-sm text-[#6B5E52]">Opening your wedding invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#E8DFD5] rounded-3xl p-8 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FDF2F0] text-[#B43B2A] flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-[#2C2420]">Invitation Not Available</h2>
          <p className="text-xs text-[#7A6A5C] leading-relaxed">
            {error || 'This invitation link could not be verified. Please check the link or contact the wedding hosts.'}
          </p>
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="mt-2 px-4 py-2 bg-[#8C6D3B] text-white text-xs font-medium rounded-xl"
            >
              Go to Homepage
            </button>
          )}
        </div>
      </div>
    );
  }

  const groom = data.couple?.groom_name || 'Groom';
  const bride = data.couple?.bride_name || 'Bride';
  const wedding = data.weddingEvent;

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Brand Tag */}
        <div className="text-center">
          <span className="text-[10px] uppercase font-semibold tracking-widest text-[#9A8B7C]">
            Our Wedding Planner · VoyaraMedia
          </span>
        </div>

        {/* Romantic Invitation Card Header */}
        <div className="relative overflow-hidden rounded-3xl border border-[#E8DFD5] bg-white shadow-md p-8 sm:p-12 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D4AF37]/20 via-[#E8D8C8] to-[#C5A880]/30 border border-[#D4AF37]/40 flex items-center justify-center text-[#8C6D3B] mx-auto">
            <Heart className="w-6 h-6 fill-[#C5A880]/40 stroke-[#8C6D3B]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#8C6D3B] font-medium block">
              Wedding Celebration of
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#2C2420] tracking-tight">
              {groom} <span className="font-light italic text-[#A37B47]">&amp;</span> {bride}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-[#6B5E52] max-w-lg mx-auto leading-relaxed italic">
            "With great joy and gratitude in our hearts, we invite you to be part of the most special chapter of our lives."
          </p>

          {/* Ceremony Schedule Details */}
          {wedding?.date_time && (
            <div className="pt-6 border-t border-[#F2ECE3] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE2D8] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] block">
                  Date &amp; Time
                </span>
                <p className="font-medium text-[#2C2420]">
                  {new Date(wedding.date_time).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-[#7A6A5C]">
                  {new Date(wedding.date_time).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE2D8] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] block">
                  Venue &amp; Location
                </span>
                <p className="font-medium text-[#2C2420]">
                  {wedding.venue_name || 'Ceremony Venue'}
                </p>
                {wedding.venue_address && (
                  <p className="text-[#7A6A5C] truncate">{wedding.venue_address}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Guest RSVP Card */}
        <div className="bg-white border border-[#E8DFD5] rounded-3xl shadow-sm p-6 sm:p-10 space-y-6">
          <div className="pb-4 border-b border-[#F2ECE3]">
            <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] tracking-wider block">
              Personalized RSVP for
            </span>
            <h2 className="font-serif text-2xl font-semibold text-[#2C2420] mt-0.5">
              {data.guest.full_name}
            </h2>
            <p className="text-xs text-[#7A6A5C] mt-1">
              Please respond by your earliest convenience to assist our hosts with banquet arrangements.
            </p>
          </div>

          {submittedMessage ? (
            <div className="p-6 bg-[#EDF8F2] border border-[#BCE4CD] rounded-2xl text-center space-y-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-10 h-10 text-[#2D7A4D] mx-auto" />
              <h3 className="font-serif text-lg font-semibold text-[#1B6E44]">RSVP Confirmed!</h3>
              <p className="text-xs text-[#2D7A4D] max-w-md mx-auto">{submittedMessage}</p>
              <button
                onClick={() => setSubmittedMessage(null)}
                className="mt-3 text-xs text-[#1B6E44] underline font-medium"
              >
                Change or Update Response
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Attendance Choice Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#4A3B32]">
                  Will you be attending the wedding celebrations?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAttending(true)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      attending === true
                        ? 'border-[#2D7A4D] bg-[#EBF7F0] shadow-xs'
                        : 'border-[#E0D5C7] bg-[#FAF8F5] text-[#7A6A5C] hover:border-[#D4C3B3]'
                    }`}
                  >
                    <CheckCircle2 className={`w-6 h-6 mx-auto mb-1.5 ${attending === true ? 'text-[#2D7A4D]' : 'text-[#A89A8D]'}`} />
                    <span className="font-serif text-sm font-semibold block text-[#2C2420]">
                      Joyfully Accept
                    </span>
                    <span className="text-[10px] text-[#6B5E52]">I will be attending</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttending(false)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      attending === false
                        ? 'border-[#B43B2A] bg-[#FDF2F0] shadow-xs'
                        : 'border-[#E0D5C7] bg-[#FAF8F5] text-[#7A6A5C] hover:border-[#D4C3B3]'
                    }`}
                  >
                    <XCircle className={`w-6 h-6 mx-auto mb-1.5 ${attending === false ? 'text-[#B43B2A]' : 'text-[#A89A8D]'}`} />
                    <span className="font-serif text-sm font-semibold block text-[#2C2420]">
                      Regretfully Decline
                    </span>
                    <span className="text-[10px] text-[#6B5E52]">Sending warm wishes from afar</span>
                  </button>
                </div>
              </div>

              {attending === true && (
                <div className="space-y-4 pt-2 border-t border-[#F2ECE3] animate-in fade-in">
                  <div>
                    <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                      Number of Accompanying Guests (Plus Ones / Family)
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAccompanyingCount(Math.max(0, accompanyingCount - 1))}
                        className="w-10 h-10 rounded-xl bg-[#FAF5EE] border border-[#E0D5C7] text-sm font-semibold text-[#2C2420]"
                      >
                        -
                      </button>
                      <span className="font-mono text-lg font-bold text-[#2C2420] min-w-[30px] text-center tabular-nums">
                        {accompanyingCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAccompanyingCount(accompanyingCount + 1)}
                        className="w-10 h-10 rounded-xl bg-[#FAF5EE] border border-[#E0D5C7] text-sm font-semibold text-[#2C2420]"
                      >
                        +
                      </button>
                      <span className="text-xs text-[#8C7A6B]">
                        Total in your party: {accompanyingCount + 1}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                      Dietary Preferences or Allergies
                    </label>
                    <input
                      type="text"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="e.g. Vegetarian, Jain Meal, Nut Allergy"
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Personal Blessing / Message to {groom} &amp; {bride}
                </label>
                <textarea
                  rows={3}
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Share a heartfelt note, blessing, or memory with the couple..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || attending === null}
                className="w-full py-3 px-4 bg-[#8C6D3B] hover:bg-[#785C30] active:bg-[#684F29] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting Your Response...' : 'Confirm Wedding RSVP'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[#9A8B7C]">
          Our Wedding Planner platform by VoyaraMedia · Real-time attendance verification
        </div>
      </div>
    </div>
  );
};
