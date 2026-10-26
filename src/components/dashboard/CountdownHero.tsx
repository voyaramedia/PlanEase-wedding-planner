import React, { useState, useEffect } from 'react';
import type { WeddingEvent, CoupleProfile } from '../../types/index.ts';
import { Calendar, MapPin, Clock, Edit3, Heart, Sparkles } from 'lucide-react';

interface CountdownHeroProps {
  weddingEvent?: WeddingEvent;
  engagementEvent?: WeddingEvent;
  coupleProfile: CoupleProfile | null;
  onEditDates: () => void;
  taskCompletionPercent?: number;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function calculateTimeRemaining(dateString?: string): TimeRemaining | null {
  if (!dateString) return null;
  const target = new Date(dateString).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
}

export const CountdownHero: React.FC<CountdownHeroProps> = ({
  weddingEvent,
  engagementEvent,
  coupleProfile,
  onEditDates,
  taskCompletionPercent = 0,
}) => {
  const [weddingTime, setWeddingTime] = useState<TimeRemaining | null>(null);
  const [engagementTime, setEngagementTime] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const update = () => {
      setWeddingTime(calculateTimeRemaining(weddingEvent?.date_time));
      setEngagementTime(calculateTimeRemaining(engagementEvent?.date_time));
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [weddingEvent?.date_time, engagementEvent?.date_time]);

  const groom = coupleProfile?.groom_name || 'Groom';
  const bride = coupleProfile?.bride_name || 'Bride';

  return (
    <div className="space-y-6">
      {/* Primary Wedding Countdown Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E8DFD5] bg-[#FAF8F5] shadow-sm">
        {/* Ambient Photographic Layer */}
        <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
          <img
            src="/src/assets/images/hero_wedding_couple_1793002740598.jpg"
            alt="Wedding Couple Hero"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top filter blur-xs scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 to-[#FAF8F5]/60 pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-10 lg:p-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs text-[#8C6D3B] font-medium uppercase tracking-wider mb-2">
                <Heart className="w-3.5 h-3.5 fill-[#C5A880]/40 stroke-[#8C6D3B]" />
                <span>Wedding Celebration Countdown</span>
                <span aria-hidden="true">·</span>
                <span>VoyaraMedia Dedicated Workspace</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#2C2420] text-balance">
                {groom} <span className="font-light italic text-[#A37B47]">&amp;</span> {bride}
              </h1>

              {weddingEvent?.date_time ? (
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-[#6B5E52] mt-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-[#8C6D3B]" />
                    {new Date(weddingEvent.date_time).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span aria-hidden="true" className="text-[#C4B5A5]">·</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#8C6D3B]" />
                    {new Date(weddingEvent.date_time).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {weddingEvent.venue_name && (
                    <>
                      <span aria-hidden="true" className="text-[#C4B5A5]">·</span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#8C6D3B]" />
                        {weddingEvent.venue_name}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#8C7A6B] mt-2 italic">
                  Set your wedding date to start the live countdown.
                </p>
              )}
            </div>

            {/* Countdown Blocks or Set Date Button */}
            <div className="shrink-0 flex flex-col items-start lg:items-end gap-3">
              {weddingTime ? (
                weddingTime.isPast ? (
                  <div className="p-4 bg-[#F2ECE3] border border-[#E0D5C7] rounded-2xl text-center">
                    <p className="font-serif text-lg font-semibold text-[#8C6D3B]">
                      The Wedding Festivities Have Begun!
                    </p>
                    <p className="text-xs text-[#7A6A5C] mt-0.5">
                      Wishing {groom} and {bride} a lifetime of endless happiness.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
                    <div className="bg-white/95 border border-[#E8DFD5] shadow-xs rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[84px]">
                      <span className="block font-mono text-2xl sm:text-3xl font-bold text-[#2C2420] tabular-nums">
                        {String(weddingTime.days).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#8C7A6B] font-medium">
                        Days
                      </span>
                    </div>

                    <div className="bg-white/95 border border-[#E8DFD5] shadow-xs rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[84px]">
                      <span className="block font-mono text-2xl sm:text-3xl font-bold text-[#2C2420] tabular-nums">
                        {String(weddingTime.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#8C7A6B] font-medium">
                        Hours
                      </span>
                    </div>

                    <div className="bg-white/95 border border-[#E8DFD5] shadow-xs rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[84px]">
                      <span className="block font-mono text-2xl sm:text-3xl font-bold text-[#2C2420] tabular-nums">
                        {String(weddingTime.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#8C7A6B] font-medium">
                        Mins
                      </span>
                    </div>

                    <div className="bg-white/95 border border-[#E8DFD5] shadow-xs rounded-2xl p-3 sm:p-4 min-w-[70px] sm:min-w-[84px]">
                      <span className="block font-mono text-2xl sm:text-3xl font-bold text-[#8C6D3B] tabular-nums">
                        {String(weddingTime.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#8C7A6B] font-medium">
                        Secs
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <button
                  onClick={onEditDates}
                  className="px-5 py-2.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Set Wedding Date
                </button>
              )}

              <button
                onClick={onEditDates}
                className="text-xs text-[#8C6D3B] hover:text-[#5A4520] hover:underline flex items-center gap-1.5 self-start lg:self-end mt-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Configure Ceremony Dates &amp; Venues</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Ceremony Secondary Strip */}
      {engagementEvent?.date_time && (
        <div className="p-4 sm:p-5 bg-white border border-[#EAE2D8] rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F6EFEB] border border-[#E2D5C8] flex items-center justify-center text-[#8C6D3B] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-semibold text-sm text-[#2C2420]">
                  {engagementEvent.title || 'Engagement Ceremony'}
                </span>
                <span className="text-xs text-[#8C7A6B]">
                  · {engagementEvent.venue_name || 'Venue pending'}
                </span>
              </div>
              <p className="text-xs text-[#6B5E52] mt-0.5">
                {new Date(engagementEvent.date_time).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {new Date(engagementEvent.date_time).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end">
            {engagementTime && !engagementTime.isPast ? (
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-[#9A8B7C] block">
                  Engagement Countdown
                </span>
                <span className="font-mono text-sm font-bold text-[#8C6D3B] tabular-nums">
                  {engagementTime.days}d {engagementTime.hours}h {engagementTime.minutes}m {engagementTime.seconds}s
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#8C7A6B] italic">
                {engagementTime?.isPast ? 'Ceremony Completed' : 'Date unconfigured'}
              </span>
            )}

            <div className="text-right border-l border-[#EAE2D8] pl-5">
              <span className="text-[11px] uppercase tracking-wider text-[#9A8B7C] block">
                Tasks Completed
              </span>
              <span className="font-mono text-sm font-semibold text-[#2C2420] tabular-nums">
                {Math.round(taskCompletionPercent)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
