import React, { useState } from 'react';
import type { WeddingEvent, Task, Expense } from '../../types/index.ts';
import {
  CalendarDays,
  Sparkles,
  CheckSquare,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface WeddingCalendarProps {
  events: WeddingEvent[];
  tasks: Task[];
  expenses: Expense[];
  onOpenNewEvent: () => void;
}

export const WeddingCalendar: React.FC<WeddingCalendarProps> = ({
  events,
  tasks,
  expenses,
  onOpenNewEvent,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Group items by date YYYY-MM-DD
  const itemsByDate: Record<
    string,
    Array<{ type: 'event' | 'task' | 'payment'; title: string; subtitle?: string; color: string }>
  > = {};

  for (const ev of events) {
    if (!ev.date_time) continue;
    const key = ev.date_time.split('T')[0];
    if (!itemsByDate[key]) itemsByDate[key] = [];
    itemsByDate[key].push({
      type: 'event',
      title: ev.title,
      subtitle: ev.venue_name,
      color: 'bg-[#FAF5EE] text-[#8C6D3B] border-[#E8DFD5]',
    });
  }

  for (const t of tasks) {
    if (!t.due_date) continue;
    const key = t.due_date.split('T')[0];
    if (!itemsByDate[key]) itemsByDate[key] = [];
    itemsByDate[key].push({
      type: 'task',
      title: t.title,
      subtitle: t.category,
      color: 'bg-[#F2ECE3] text-[#4A3B32] border-[#E0D5C7]',
    });
  }

  for (const exp of expenses) {
    if (!exp.payment_date) continue;
    const key = exp.payment_date.split('T')[0];
    if (!itemsByDate[key]) itemsByDate[key] = [];
    itemsByDate[key].push({
      type: 'payment',
      title: `₹${exp.amount_paid || exp.actual_amount} ${exp.title}`,
      color: 'bg-[#EDF8F2] text-[#1B6E44] border-[#BCE4CD]',
    });
  }

  // Agenda list (chronological)
  const allChronological = [
    ...events.map((e) => ({
      date: e.date_time,
      type: 'Ceremony',
      title: e.title,
      details: e.venue_name || 'Venue pending',
    })),
    ...tasks.filter((t) => t.due_date).map((t) => ({
      date: t.due_date!,
      type: 'Task Due',
      title: t.title,
      details: `${t.category} (${t.status})`,
    })),
    ...expenses.filter((e) => e.payment_date).map((e) => ({
      date: e.payment_date!,
      type: 'Payment',
      title: e.title,
      details: `₹${e.amount_paid} via ${e.payment_method || 'UPI'}`,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">
            Wedding Schedule &amp; Calendar
          </h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Synchronized ceremony dates, deadline alerts, and vendor payment schedules
          </p>
        </div>

        <button
          onClick={onOpenNewEvent}
          className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Ceremony Event
        </button>
      </div>

      {/* Calendar Grid & Agenda Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Month View (8 cols) */}
        <div className="lg:col-span-8 p-5 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-[#2C2420]">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 text-[#8C7A6B] hover:text-[#2C2420] hover:bg-[#F2ECE3] rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs text-[#8C6D3B] hover:bg-[#FAF5EE] rounded-lg font-medium"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 text-[#8C7A6B] hover:text-[#2C2420] hover:bg-[#F2ECE3] rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-semibold text-[#8C7A6B] pb-2 border-b border-[#F2ECE3]">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[85px] bg-[#FAF8F5]/50 rounded-xl" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayItems = itemsByDate[dateStr] || [];
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={day}
                  className={`min-h-[85px] p-1.5 rounded-xl border flex flex-col justify-between transition-colors ${
                    isToday
                      ? 'bg-[#FAF5EE] border-[#8C6D3B]'
                      : 'bg-white border-[#F2ECE3] hover:border-[#D4C3B3]'
                  }`}
                >
                  <span
                    className={`font-mono text-xs block tabular-nums ${
                      isToday ? 'font-bold text-[#8C6D3B]' : 'text-[#4A3B32]'
                    }`}
                  >
                    {day}
                  </span>

                  <div className="space-y-1 overflow-y-auto max-h-[55px]">
                    {dayItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium border truncate ${item.color}`}
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda Column (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-4 flex flex-col">
          <div className="pb-3 border-b border-[#F2ECE3]">
            <h3 className="font-serif text-base font-semibold text-[#2C2420]">
              Upcoming Chronology
            </h3>
            <p className="text-xs text-[#7A6A5C] mt-0.5">Key milestones in order</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
            {allChronological.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#8C7A6B]">
                No dates scheduled yet. Set your wedding or ceremony dates to populate the timeline.
              </p>
            ) : (
              allChronological.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[#F2ECE3] hover:border-[#D4C3B3] transition-colors space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-[#8C6D3B]">
                      {item.type}
                    </span>
                    <span className="font-mono text-[10px] text-[#8C7A6B] tabular-nums">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="font-semibold text-[#2C2420] truncate">{item.title}</p>
                  <p className="text-[11px] text-[#7A6A5C] truncate">{item.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
