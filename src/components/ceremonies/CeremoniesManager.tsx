import React, { useState } from 'react';
import type { WeddingEvent, Task, Expense, Vendor } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wallet,
  CheckSquare,
  HeartHandshake,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface RitualItem {
  id: string;
  time: string;
  title: string;
  details?: string;
  in_charge?: string;
}

interface CeremoniesManagerProps {
  events: WeddingEvent[];
  tasks?: Task[];
  expenses?: Expense[];
  vendors?: Vendor[];
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const CeremoniesManager: React.FC<CeremoniesManagerProps> = ({
  events,
  tasks = [],
  expenses = [],
  vendors = [],
  onRefresh,
  onNavigateTab,
}) => {
  // Expanded event cards
  const [expandedEventId, setExpandedEventId] = useState<string | null>(events[0]?.id || null);
  const [activeEntryTab, setActiveEntryTab] = useState<'RITUALS' | 'TASKS' | 'EXPENSES' | 'VENDORS'>('RITUALS');

  // Loading & error state
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Ceremony Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [eventType, setEventType] = useState<WeddingEvent['event_type']>('WEDDING');
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [budgetAllocated, setBudgetAllocated] = useState('0');
  const [notes, setNotes] = useState('');

  // 2. Ritual Milestone Modal State
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [targetEventForRitual, setTargetEventForRitual] = useState<WeddingEvent | null>(null);
  const [editingRitual, setEditingRitual] = useState<RitualItem | null>(null);
  const [ritualTime, setRitualTime] = useState('');
  const [ritualTitle, setRitualTitle] = useState('');
  const [ritualDetails, setRitualDetails] = useState('');
  const [ritualInCharge, setRitualInCharge] = useState('');

  // 3. Task Under Event Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetEventForTask, setTargetEventForTask] = useState<WeddingEvent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Rituals');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [taskEstimatedCost, setTaskEstimatedCost] = useState('0');

  // 4. Expense Under Event Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [targetEventForExpense, setTargetEventForExpense] = useState<WeddingEvent | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Venue');
  const [expensePlannedAmount, setExpensePlannedAmount] = useState('0');
  const [expenseActualAmount, setExpenseActualAmount] = useState('0');
  const [expenseAmountPaid, setExpenseAmountPaid] = useState('0');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState('UPI');

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Helper to extract ritual schedule items from event notes
  const getRitualsFromEvent = (ev: WeddingEvent): { rituals: RitualItem[]; userNotes: string } => {
    if (!ev.notes) return { rituals: [], userNotes: '' };
    try {
      const parsed = JSON.parse(ev.notes);
      if (parsed && Array.isArray(parsed.rituals)) {
        return { rituals: parsed.rituals, userNotes: parsed.userNotes || '' };
      }
    } catch {
      // Notes is plain text
    }
    return { rituals: [], userNotes: ev.notes };
  };

  // -------------------------------------------------------------
  // EVENT CRUD
  // -------------------------------------------------------------
  const openCreateEvent = (type?: WeddingEvent['event_type']) => {
    setEditingEvent(null);
    setEventType(type || 'WEDDING');
    setTitle(
      type === 'ENGAGEMENT'
        ? 'Engagement Ceremony & Roka'
        : type === 'SANGEET'
        ? 'Sangeet & Dance Celebration'
        : type === 'HALDI'
        ? 'Haldi & Mangalsnanam'
        : type === 'MEHENDI'
        ? 'Mehendi & Henna Ritual'
        : type === 'RECEPTION'
        ? 'Grand Wedding Reception'
        : 'Wedding Ceremony & Muhurat'
    );
    setDateTime('');
    setVenueName('');
    setVenueAddress('');
    setBudgetAllocated('0');
    setNotes('');
    setIsEventModalOpen(true);
  };

  const openEditEvent = (ev: WeddingEvent) => {
    setEditingEvent(ev);
    setEventType(ev.event_type);
    setTitle(ev.title);
    setDateTime(ev.date_time ? ev.date_time.slice(0, 16) : '');
    setVenueName(ev.venue_name || '');
    setVenueAddress(ev.venue_address || '');
    setBudgetAllocated(String(ev.budget_allocated || 0));

    const { userNotes } = getRitualsFromEvent(ev);
    setNotes(userNotes);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateTime) {
      alert('Ceremony title and date/time are required.');
      return;
    }

    setLoading(true);
    try {
      let finalNotes = notes;
      if (editingEvent) {
        const { rituals } = getRitualsFromEvent(editingEvent);
        if (rituals.length > 0) {
          finalNotes = JSON.stringify({ rituals, userNotes: notes.trim() });
        }
      }

      const payload = {
        event_type: eventType,
        title: title.trim(),
        date_time: new Date(dateTime).toISOString(),
        venue_name: venueName.trim(),
        venue_address: venueAddress.trim(),
        budget_allocated: parseFloat(budgetAllocated) || 0,
        notes: finalNotes,
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, payload);
      } else {
        await api.createEvent(payload);
      }
      setIsEventModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save ceremony event.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string, eventTitle: string) => {
    if (confirm(`Are you sure you want to delete the ceremony "${eventTitle}"? All associated views will be removed.`)) {
      setLoading(true);
      try {
        await api.deleteEvent(id);
        if (expandedEventId === id) setExpandedEventId(null);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete ceremony.');
      } finally {
        setLoading(false);
      }
    }
  };

  // -------------------------------------------------------------
  // RITUAL MILESTONES CRUD (Under Event)
  // -------------------------------------------------------------
  const openAddRitual = (ev: WeddingEvent) => {
    setTargetEventForRitual(ev);
    setEditingRitual(null);
    setRitualTime('');
    setRitualTitle('');
    setRitualDetails('');
    setRitualInCharge('');
    setIsRitualModalOpen(true);
  };

  const openEditRitual = (ev: WeddingEvent, ritual: RitualItem) => {
    setTargetEventForRitual(ev);
    setEditingRitual(ritual);
    setRitualTime(ritual.time);
    setRitualTitle(ritual.title);
    setRitualDetails(ritual.details || '');
    setRitualInCharge(ritual.in_charge || '');
    setIsRitualModalOpen(true);
  };

  const handleSaveRitual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEventForRitual || !ritualTitle.trim()) {
      alert('Ritual milestone title is required.');
      return;
    }

    setLoading(true);
    try {
      const { rituals, userNotes } = getRitualsFromEvent(targetEventForRitual);
      let updatedRituals: RitualItem[] = [];

      if (editingRitual) {
        updatedRituals = rituals.map((r) =>
          r.id === editingRitual.id
            ? {
                ...r,
                time: ritualTime.trim(),
                title: ritualTitle.trim(),
                details: ritualDetails.trim(),
                in_charge: ritualInCharge.trim(),
              }
            : r
        );
      } else {
        const newRitual: RitualItem = {
          id: `rit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          time: ritualTime.trim(),
          title: ritualTitle.trim(),
          details: ritualDetails.trim(),
          in_charge: ritualInCharge.trim(),
        };
        updatedRituals = [...rituals, newRitual];
      }

      // Sort by time if provided
      updatedRituals.sort((a, b) => a.time.localeCompare(b.time));

      const updatedNotes = JSON.stringify({ rituals: updatedRituals, userNotes });
      await api.updateEvent(targetEventForRitual.id, { notes: updatedNotes });
      setIsRitualModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save ritual milestone.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRitual = async (ev: WeddingEvent, ritualId: string) => {
    if (confirm('Delete this ritual milestone entry?')) {
      setLoading(true);
      try {
        const { rituals, userNotes } = getRitualsFromEvent(ev);
        const filtered = rituals.filter((r) => r.id !== ritualId);
        const updatedNotes = JSON.stringify({ rituals: filtered, userNotes });
        await api.updateEvent(ev.id, { notes: updatedNotes });
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete ritual entry.');
      } finally {
        setLoading(false);
      }
    }
  };

  // -------------------------------------------------------------
  // TASK CRUD (Under Event)
  // -------------------------------------------------------------
  const openAddTask = (ev: WeddingEvent) => {
    setTargetEventForTask(ev);
    setEditingTask(null);
    setTaskTitle('');
    setTaskCategory('Rituals');
    setTaskAssignedTo('');
    setTaskDueDate(ev.date_time ? ev.date_time.slice(0, 10) : '');
    setTaskPriority('MEDIUM');
    setTaskEstimatedCost('0');
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task: Task, ev: WeddingEvent) => {
    setTargetEventForTask(ev);
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category);
    setTaskAssignedTo(task.assigned_to || '');
    setTaskDueDate(task.due_date || '');
    setTaskPriority(task.priority);
    setTaskEstimatedCost(String(task.estimated_cost || 0));
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEventForTask || !taskTitle.trim()) {
      alert('Task title is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: taskTitle.trim(),
        category: taskCategory,
        event_id: targetEventForTask.id,
        assigned_to: taskAssignedTo.trim(),
        due_date: taskDueDate,
        priority: taskPriority,
        estimated_cost: parseFloat(taskEstimatedCost) || 0,
      };

      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask({
          ...payload,
          status: 'NOT_STARTED',
        });
      }
      setIsTaskModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save task entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update task.');
    }
  };

  const handleDeleteTask = async (taskId: string, titleText: string) => {
    if (confirm(`Delete the task "${titleText}"?`)) {
      setLoading(true);
      try {
        await api.deleteTask(taskId);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete task.');
      } finally {
        setLoading(false);
      }
    }
  };

  // -------------------------------------------------------------
  // EXPENSE CRUD (Under Event)
  // -------------------------------------------------------------
  const openAddExpense = (ev: WeddingEvent) => {
    setTargetEventForExpense(ev);
    setEditingExpense(null);
    setExpenseTitle('');
    setExpenseCategory('Venue');
    setExpensePlannedAmount('0');
    setExpenseActualAmount('0');
    setExpenseAmountPaid('0');
    setExpensePaymentMethod('UPI');
    setIsExpenseModalOpen(true);
  };

  const openEditExpense = (expense: Expense, ev: WeddingEvent) => {
    setTargetEventForExpense(ev);
    setEditingExpense(expense);
    setExpenseTitle(expense.title);
    setExpenseCategory(expense.category);
    setExpensePlannedAmount(String(expense.planned_amount || 0));
    setExpenseActualAmount(String(expense.actual_amount || 0));
    setExpenseAmountPaid(String(expense.amount_paid || 0));
    setExpensePaymentMethod(expense.payment_method || 'UPI');
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEventForExpense || !expenseTitle.trim()) {
      alert('Expense title is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: expenseTitle.trim(),
        category: expenseCategory,
        event_id: targetEventForExpense.id,
        planned_amount: parseFloat(expensePlannedAmount) || 0,
        actual_amount: parseFloat(expenseActualAmount) || parseFloat(expensePlannedAmount) || 0,
        amount_paid: parseFloat(expenseAmountPaid) || 0,
        payment_method: expensePaymentMethod,
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, payload);
      } else {
        await api.createExpense(payload);
      }
      setIsExpenseModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string, titleText: string) => {
    if (confirm(`Delete the expense entry "${titleText}"?`)) {
      setLoading(true);
      try {
        await api.deleteExpense(expenseId);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete expense entry.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">
            Wedding Ceremonies &amp; Milestones
          </h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Manage your ceremonies and edit or delete any task, expense, or ritual schedule under each event
          </p>
        </div>

        <button
          onClick={() => openCreateEvent()}
          className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Ceremony Event
        </button>
      </div>

      {/* Ceremonies List */}
      {events.length === 0 ? (
        <div className="bg-white border border-[#E8DFD5] rounded-3xl p-12 text-center text-xs text-[#8C7A6B]">
          <Sparkles className="w-8 h-8 text-[#D4C3B3] mx-auto mb-3" />
          <p className="font-serif text-base font-medium text-[#2C2420]">No ceremony events set up yet</p>
          <p className="mt-1">
            Add your Wedding, Engagement, Sangeet, Mehendi, or Haldi rituals to activate countdowns and timelines.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button
              onClick={() => openCreateEvent('WEDDING')}
              className="px-4 py-2 bg-[#8C6D3B] text-white rounded-xl font-medium cursor-pointer"
            >
              Add Wedding Ceremony
            </button>
            <button
              onClick={() => openCreateEvent('ENGAGEMENT')}
              className="px-4 py-2 bg-[#FAF5EE] border border-[#D4C3B3] text-[#8C6D3B] rounded-xl font-medium cursor-pointer"
            >
              Add Engagement Ceremony
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((ev) => {
            const isExpanded = expandedEventId === ev.id;
            const eventTasks = tasks.filter((t) => t.event_id === ev.id);
            const completedTasks = eventTasks.filter((t) => t.status === 'COMPLETED');
            const eventExpenses = expenses.filter((e) => e.event_id === ev.id);
            const totalSpent = eventExpenses.reduce((sum, e) => sum + (e.actual_amount || e.planned_amount || 0), 0);
            const totalPaid = eventExpenses.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
            const eventVendors = vendors.filter((v) => v.event_id === ev.id || ((v as any).event_ids && (v as any).event_ids.includes(ev.id)));
            const { rituals } = getRitualsFromEvent(ev);
            const totalEntries = eventTasks.length + eventExpenses.length + eventVendors.length + rituals.length;

            return (
              <div
                key={ev.id}
                className="bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs overflow-hidden transition-all hover:border-[#8C6D3B]/40"
              >
                {/* Event Card Header */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-white via-[#FAF8F5] to-white border-b border-[#F2ECE3]">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF5EE] text-[#8C6D3B] border border-[#E2D5C3]">
                          {ev.event_type}
                        </span>
                        <span className="text-xs text-[#8C7A6B]">
                          Total Entries Under Ceremony: <strong className="text-[#2C2420]">{totalEntries}</strong>
                        </span>
                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#2C2420]">
                        {ev.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-[#6B5E52]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8C6D3B]" />
                          <span className="font-medium text-[#2C2420]">
                            {new Date(ev.date_time).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#8C6D3B]" />
                          <span>
                            {new Date(ev.date_time).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {ev.venue_name && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#8C6D3B]" />
                            <span>
                              {ev.venue_name}
                              {ev.venue_address && <span className="text-[#9A8B7C]"> ({ev.venue_address})</span>}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats & Event Actions */}
                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#F2ECE3]">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-[#8C7A6B] block uppercase tracking-wider">
                          Allocated Budget
                        </span>
                        <span className="font-mono text-sm sm:text-base font-bold text-[#2C2420] tabular-nums">
                          {formatINR(ev.budget_allocated || 0)}
                        </span>
                        <div className="text-[10px] text-[#7A6A5C]">
                          Actual Spent: <strong className="font-mono text-[#8C6D3B]">{formatINR(totalSpent)}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditEvent(ev)}
                          className="px-3 py-1.5 bg-[#FAF5EE] border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#4A3B32] text-xs font-medium rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit Ceremony Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#8C6D3B]" />
                          Edit Event
                        </button>

                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          className="p-1.5 text-[#9A8B7C] hover:text-[#B43B2A] hover:bg-[#FDF2F0] rounded-xl transition-colors cursor-pointer"
                          title="Delete Ceremony Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-[#8C6D3B] text-white shadow-xs'
                              : 'bg-white border border-[#D8CCBD] text-[#2C2420] hover:border-[#8C6D3B]'
                          }`}
                        >
                          <span>{isExpanded ? 'Hide Entries' : 'Manage Entries'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#F2ECE3] text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF5EE] border border-[#E8DFD5] text-[#4A3B32]">
                      <Clock className="w-3 h-3 text-[#8C6D3B]" />
                      <strong>{rituals.length}</strong> Ritual Milestone{rituals.length !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF5EE] border border-[#E8DFD5] text-[#4A3B32]">
                      <CheckSquare className="w-3 h-3 text-[#8C6D3B]" />
                      <strong>{completedTasks.length}/{eventTasks.length}</strong> Tasks Completed
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF5EE] border border-[#E8DFD5] text-[#4A3B32]">
                      <Wallet className="w-3 h-3 text-[#8C6D3B]" />
                      <strong>{eventExpenses.length}</strong> Expense Entries ({formatINR(totalPaid)} paid)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF5EE] border border-[#E8DFD5] text-[#4A3B32]">
                      <HeartHandshake className="w-3 h-3 text-[#8C6D3B]" />
                      <strong>{eventVendors.length}</strong> Vendors Assigned
                    </span>
                  </div>
                </div>

                {/* EXPANDABLE SECTION: MANAGE ENTRIES UNDER THIS CEREMONY */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-[#FAF8F5] border-t border-[#F2ECE3] space-y-5 animate-in fade-in duration-200">
                    {/* Sub-Navigation Tabs for Entries */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8DFD5]">
                      <div className="flex items-center gap-1.5 p-1 bg-[#EFE8DF] rounded-xl text-xs">
                        <button
                          onClick={() => setActiveEntryTab('RITUALS')}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                            activeEntryTab === 'RITUALS'
                              ? 'bg-white text-[#2C2420] shadow-xs'
                              : 'text-[#7A6A5C] hover:text-[#2C2420]'
                          }`}
                        >
                          Ritual Schedule ({rituals.length})
                        </button>
                        <button
                          onClick={() => setActiveEntryTab('TASKS')}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                            activeEntryTab === 'TASKS'
                              ? 'bg-white text-[#2C2420] shadow-xs'
                              : 'text-[#7A6A5C] hover:text-[#2C2420]'
                          }`}
                        >
                          Tasks ({eventTasks.length})
                        </button>
                        <button
                          onClick={() => setActiveEntryTab('EXPENSES')}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                            activeEntryTab === 'EXPENSES'
                              ? 'bg-white text-[#2C2420] shadow-xs'
                              : 'text-[#7A6A5C] hover:text-[#2C2420]'
                          }`}
                        >
                          Expenses ({eventExpenses.length})
                        </button>
                        <button
                          onClick={() => setActiveEntryTab('VENDORS')}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                            activeEntryTab === 'VENDORS'
                              ? 'bg-white text-[#2C2420] shadow-xs'
                              : 'text-[#7A6A5C] hover:text-[#2C2420]'
                          }`}
                        >
                          Vendors ({eventVendors.length})
                        </button>
                      </div>

                      {/* Contextual Action Button */}
                      <div>
                        {activeEntryTab === 'RITUALS' && (
                          <button
                            onClick={() => openAddRitual(ev)}
                            className="px-3 py-1.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-medium rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Ritual Milestone
                          </button>
                        )}
                        {activeEntryTab === 'TASKS' && (
                          <button
                            onClick={() => openAddTask(ev)}
                            className="px-3 py-1.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-medium rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Task Under Ceremony
                          </button>
                        )}
                        {activeEntryTab === 'EXPENSES' && (
                          <button
                            onClick={() => openAddExpense(ev)}
                            className="px-3 py-1.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-medium rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Expense Under Ceremony
                          </button>
                        )}
                        {activeEntryTab === 'VENDORS' && onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('vendors')}
                            className="px-3 py-1.5 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#8C6D3B] text-xs font-medium rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Manage in Vendor Directory
                          </button>
                        )}
                      </div>
                    </div>

                    {/* TAB 1: RITUAL SCHEDULE UNDER THIS EVENT */}
                    {activeEntryTab === 'RITUALS' && (
                      <div className="space-y-3">
                        {rituals.length === 0 ? (
                          <div className="p-8 text-center bg-white border border-[#E8DFD5] rounded-2xl text-xs text-[#8C7A6B]">
                            <Clock className="w-6 h-6 text-[#D4C3B3] mx-auto mb-2" />
                            <p className="font-medium text-[#2C2420]">No ritual milestones scheduled yet</p>
                            <p className="mt-0.5">
                              Plan specific auspicious timings (e.g., Ganesh Pooja, Baraat Arrival, Varmala, Pheras, Banquet).
                            </p>
                            <button
                              onClick={() => openAddRitual(ev)}
                              className="mt-3 px-3 py-1.5 bg-[#FAF5EE] border border-[#D4C3B3] text-[#8C6D3B] font-semibold rounded-xl cursor-pointer"
                            >
                              + Add First Ritual Milestone
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white border border-[#E8DFD5] rounded-2xl divide-y divide-[#F2ECE3] overflow-hidden">
                            {rituals.map((ritual, idx) => (
                              <div
                                key={ritual.id}
                                className="p-3.5 flex items-start justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="px-2.5 py-1 bg-[#FAF5EE] border border-[#E0D5C7] rounded-lg text-center shrink-0">
                                    <span className="font-mono text-xs font-bold text-[#8C6D3B] block">
                                      {ritual.time || `Step ${idx + 1}`}
                                    </span>
                                  </div>

                                  <div className="min-w-0">
                                    <div className="font-semibold text-sm text-[#2C2420] truncate">
                                      {ritual.title}
                                    </div>
                                    {ritual.details && (
                                      <p className="text-xs text-[#7A6A5C] mt-0.5">{ritual.details}</p>
                                    )}
                                    {ritual.in_charge && (
                                      <div className="text-[11px] text-[#8C7A6B] mt-1">
                                        In-charge: <strong className="text-[#4A3B32]">{ritual.in_charge}</strong>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* EDIT & DELETE ENTRY UNDER THIS EVENT */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => openEditRitual(ev, ritual)}
                                    className="p-1.5 text-[#9A8B7C] hover:text-[#2C2420] hover:bg-[#FAF5EE] rounded-lg cursor-pointer"
                                    title="Edit Ritual Milestone"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRitual(ev, ritual.id)}
                                    className="p-1.5 text-[#9A8B7C] hover:text-[#B43B2A] hover:bg-[#FDF2F0] rounded-lg cursor-pointer"
                                    title="Delete Ritual Milestone"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: TASKS UNDER THIS EVENT */}
                    {activeEntryTab === 'TASKS' && (
                      <div className="space-y-3">
                        {eventTasks.length === 0 ? (
                          <div className="p-8 text-center bg-white border border-[#E8DFD5] rounded-2xl text-xs text-[#8C7A6B]">
                            <CheckSquare className="w-6 h-6 text-[#D4C3B3] mx-auto mb-2" />
                            <p className="font-medium text-[#2C2420]">No tasks assigned to this ceremony yet</p>
                            <p className="mt-0.5">
                              Keep preparation on track by adding specific responsibilities for {ev.title}.
                            </p>
                            <button
                              onClick={() => openAddTask(ev)}
                              className="mt-3 px-3 py-1.5 bg-[#FAF5EE] border border-[#D4C3B3] text-[#8C6D3B] font-semibold rounded-xl cursor-pointer"
                            >
                              + Add Task for this Event
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white border border-[#E8DFD5] rounded-2xl divide-y divide-[#F2ECE3] overflow-hidden">
                            {eventTasks.map((task) => (
                              <div
                                key={task.id}
                                className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTaskStatus(task)}
                                    className="shrink-0 cursor-pointer"
                                    title={task.status === 'COMPLETED' ? 'Mark Incomplete' : 'Mark Completed'}
                                  >
                                    {task.status === 'COMPLETED' ? (
                                      <CheckCircle2 className="w-5 h-5 text-[#2D7A4D] fill-[#E5F5EC]" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-md border-2 border-[#D4C3B3] hover:border-[#8C6D3B]" />
                                    )}
                                  </button>

                                  <div className="min-w-0">
                                    <div
                                      className={`text-xs font-semibold truncate ${
                                        task.status === 'COMPLETED' ? 'line-through text-[#9A8B7C]' : 'text-[#2C2420]'
                                      }`}
                                    >
                                      {task.title}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#8C7A6B] mt-0.5">
                                      <span>{task.category}</span>
                                      {task.assigned_to && <span>· Assigned: {task.assigned_to}</span>}
                                      {task.due_date && <span>· Due: {task.due_date}</span>}
                                      {task.priority && (
                                        <span
                                          className={`px-1.5 py-0.2 rounded font-medium ${
                                            task.priority === 'URGENT'
                                              ? 'bg-[#FDF0ED] text-[#B43B2A]'
                                              : task.priority === 'HIGH'
                                              ? 'bg-[#FEF5E7] text-[#C46A28]'
                                              : 'bg-[#F2ECE3] text-[#7A6A5C]'
                                          }`}
                                        >
                                          {task.priority}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* EDIT & DELETE ENTRY UNDER THIS EVENT */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => openEditTask(task, ev)}
                                    className="p-1.5 text-[#9A8B7C] hover:text-[#2C2420] hover:bg-[#FAF5EE] rounded-lg cursor-pointer"
                                    title="Edit Task"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id, task.title)}
                                    className="p-1.5 text-[#9A8B7C] hover:text-[#B43B2A] hover:bg-[#FDF2F0] rounded-lg cursor-pointer"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: EXPENSES UNDER THIS EVENT */}
                    {activeEntryTab === 'EXPENSES' && (
                      <div className="space-y-3">
                        {eventExpenses.length === 0 ? (
                          <div className="p-8 text-center bg-white border border-[#E8DFD5] rounded-2xl text-xs text-[#8C7A6B]">
                            <Wallet className="w-6 h-6 text-[#D4C3B3] mx-auto mb-2" />
                            <p className="font-medium text-[#2C2420]">No expenses recorded for this ceremony</p>
                            <p className="mt-0.5">
                              Track venue rent, decor deposits, catering advances, and sound setup for {ev.title}.
                            </p>
                            <button
                              onClick={() => openAddExpense(ev)}
                              className="mt-3 px-3 py-1.5 bg-[#FAF5EE] border border-[#D4C3B3] text-[#8C6D3B] font-semibold rounded-xl cursor-pointer"
                            >
                              + Add Expense for this Event
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white border border-[#E8DFD5] rounded-2xl divide-y divide-[#F2ECE3] overflow-hidden">
                            {eventExpenses.map((expense) => (
                              <div
                                key={expense.id}
                                className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-[#2C2420] truncate">
                                    {expense.title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#8C7A6B] mt-0.5">
                                    <span>{expense.category}</span>
                                    <span>· Paid via {expense.payment_method || 'UPI'}</span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-mono text-xs font-bold text-[#2C2420] tabular-nums block">
                                    {formatINR(expense.actual_amount || expense.planned_amount || 0)}
                                  </span>
                                  <span className="text-[10px] text-[#2D7A4D] font-mono">
                                    Paid: {formatINR(expense.amount_paid || 0)}
                                  </span>
                                </div>

                                {/* EDIT & DELETE ENTRY UNDER THIS EVENT */}
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <button
                                    onClick={() => openEditExpense(expense, ev)}
                                    className="p-1.5 text-[#9A8B7C] hover:text-[#2C2420] hover:bg-[#FAF5EE] rounded-lg cursor-pointer"
                                    title="Edit Expense Entry"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(expense.id, expense.title)}
                                    className="p-1.5 text-[#9A8B7C] hover:text-[#B43B2A] hover:bg-[#FDF2F0] rounded-lg cursor-pointer"
                                    title="Delete Expense Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: VENDORS ASSIGNED TO THIS EVENT */}
                    {activeEntryTab === 'VENDORS' && (
                      <div className="space-y-3">
                        {eventVendors.length === 0 ? (
                          <div className="p-8 text-center bg-white border border-[#E8DFD5] rounded-2xl text-xs text-[#8C7A6B]">
                            <HeartHandshake className="w-6 h-6 text-[#D4C3B3] mx-auto mb-2" />
                            <p className="font-medium text-[#2C2420]">No vendors specifically linked to this ceremony</p>
                            <p className="mt-0.5">
                              Link caterers, decorators, photographers, and priests to {ev.title}.
                            </p>
                            {onNavigateTab && (
                              <button
                                onClick={() => onNavigateTab('vendors')}
                                className="mt-3 px-3 py-1.5 bg-[#FAF5EE] border border-[#D4C3B3] text-[#8C6D3B] font-semibold rounded-xl cursor-pointer"
                              >
                                Go to Vendor Directory
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {eventVendors.map((vendor) => (
                              <div
                                key={vendor.id}
                                className="p-3.5 bg-white border border-[#E8DFD5] rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-[#2C2420] truncate">
                                    {vendor.name}
                                  </div>
                                  <div className="text-[10px] text-[#8C7A6B] truncate">
                                    {vendor.service_category} · {vendor.mobile || vendor.email || 'No contact'}
                                  </div>
                                  <div className="font-mono text-[11px] text-[#8C6D3B] mt-1">
                                    Agreed: {formatINR(vendor.agreed_amount || vendor.quoted_amount || 0)}
                                  </div>
                                </div>

                                {onNavigateTab && (
                                  <button
                                    onClick={() => onNavigateTab('vendors')}
                                    className="px-2.5 py-1 bg-[#FAF5EE] hover:bg-[#F2ECE3] text-[#4A3B32] text-[11px] rounded-lg font-medium cursor-pointer shrink-0"
                                  >
                                    View in Directory
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. CEREMONY EVENT MODAL (Edit / Create Ceremony) */}
      {/* ------------------------------------------------------------- */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-4">
              {editingEvent ? 'Edit Ceremony Event' : 'Schedule New Ceremony'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Ceremony Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                >
                  <option value="WEDDING">Wedding Ceremony &amp; Pheras</option>
                  <option value="ENGAGEMENT">Engagement / Roka Ceremony</option>
                  <option value="SANGEET">Sangeet &amp; Dance Night</option>
                  <option value="MEHENDI">Mehendi Ceremony</option>
                  <option value="HALDI">Haldi &amp; Mangalsnanam</option>
                  <option value="RECEPTION">Reception Banquet</option>
                  <option value="OTHER">Other Auspicious Ritual</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Ceremony Title <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Traditional Wedding Ceremony"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Date &amp; Auspicious Time <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Venue Name</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Royal Palace Banquet Hall"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Venue Address</label>
                <input
                  type="text"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="City, locality, or landmark"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Allocated Budget (₹)</label>
                <input
                  type="number"
                  value={budgetAllocated}
                  onChange={(e) => setBudgetAllocated(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Notes &amp; Guidelines</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Special instructions, attire dress code, or traditions"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 bg-[#EFE8DF] text-[#4A3B32] rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium cursor-pointer"
                >
                  {loading ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Ceremony'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. RITUAL MILESTONE MODAL (Edit / Add Ritual Under Event) */}
      {/* ------------------------------------------------------------- */}
      {isRitualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setIsRitualModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-1">
              {editingRitual ? 'Edit Ritual Milestone' : 'Add Ritual Milestone'}
            </h3>
            <p className="text-xs text-[#7A6A5C] mb-4">
              Under: <strong className="text-[#2C2420]">{targetEventForRitual?.title}</strong>
            </p>

            <form onSubmit={handleSaveRitual} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Scheduled Time / Muhurat (e.g., "11:30 AM" or "18:00")
                </label>
                <input
                  type="text"
                  value={ritualTime}
                  onChange={(e) => setRitualTime(e.target.value)}
                  placeholder="e.g. 10:30 AM"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Ritual / Milestone Title <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={ritualTitle}
                  onChange={(e) => setRitualTitle(e.target.value)}
                  placeholder="e.g. Ganesh Pooja, Baraat Swagat, or Varmala"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Details &amp; Significance</label>
                <textarea
                  value={ritualDetails}
                  onChange={(e) => setRitualDetails(e.target.value)}
                  rows={2}
                  placeholder="e.g. Groom assembly at entrance with band; garlands exchange"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">In-Charge Family Member / Coordinator</label>
                <input
                  type="text"
                  value={ritualInCharge}
                  onChange={(e) => setRitualInCharge(e.target.value)}
                  placeholder="e.g. Rajesh Mama, Best Man, Sister"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => setIsRitualModalOpen(false)}
                  className="px-4 py-2 bg-[#EFE8DF] text-[#4A3B32] rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium cursor-pointer"
                >
                  {loading ? 'Saving...' : editingRitual ? 'Update Ritual' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TASK MODAL (Edit / Add Task Under Event) */}
      {/* ------------------------------------------------------------- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-1">
              {editingTask ? 'Edit Task Entry' : 'Add Task Under Ceremony'}
            </h3>
            <p className="text-xs text-[#7A6A5C] mb-4">
              Event: <strong className="text-[#2C2420]">{targetEventForTask?.title}</strong>
            </p>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Task Title <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Order fresh rose varmala garlands"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Category</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                  >
                    <option value="Rituals">Rituals &amp; Puja</option>
                    <option value="Venue">Venue &amp; Setup</option>
                    <option value="Decoration">Decoration &amp; Flowers</option>
                    <option value="Catering">Catering &amp; Sweets</option>
                    <option value="Outfits">Outfits &amp; Jewelry</option>
                    <option value="Photography">Photography</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Assigned Person</label>
                  <input
                    type="text"
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    placeholder="e.g. Groom, Brother"
                    className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={taskEstimatedCost}
                  onChange={(e) => setTaskEstimatedCost(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-[#EFE8DF] text-[#4A3B32] rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium cursor-pointer"
                >
                  {loading ? 'Saving...' : editingTask ? 'Save Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. EXPENSE MODAL (Edit / Add Expense Under Event) */}
      {/* ------------------------------------------------------------- */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-1">
              {editingExpense ? 'Edit Expense Entry' : 'Add Expense Under Ceremony'}
            </h3>
            <p className="text-xs text-[#7A6A5C] mb-4">
              Ceremony: <strong className="text-[#2C2420]">{targetEventForExpense?.title}</strong>
            </p>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Expense Title <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Mandap Floral Decor Advance"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Catering">Catering</option>
                    <option value="Photography & Film">Photography &amp; Film</option>
                    <option value="Outfits & Wardrobe">Outfits &amp; Wardrobe</option>
                    <option value="Rituals & Priest">Rituals &amp; Priest</option>
                    <option value="Entertainment & DJ">Entertainment &amp; DJ</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Payment Method</label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Actual / Agreed Cost (₹)</label>
                  <input
                    type="number"
                    value={expenseActualAmount}
                    onChange={(e) => setExpenseActualAmount(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Amount Paid So Far (₹)</label>
                  <input
                    type="number"
                    value={expenseAmountPaid}
                    onChange={(e) => setExpenseAmountPaid(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-[#EFE8DF] text-[#4A3B32] rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium cursor-pointer"
                >
                  {loading ? 'Saving...' : editingExpense ? 'Save Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
