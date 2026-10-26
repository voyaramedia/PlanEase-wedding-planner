import React, { useState } from 'react';
import type { Task, WeddingEvent } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit2,
  AlertTriangle,
  Calendar,
  Sparkles,
  LayoutList,
  Columns,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  events: WeddingEvent[];
  onRefresh: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  events,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [eventFilter, setEventFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [eventId, setEventId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
  const [status, setStatus] = useState<Task['status']>('NOT_STARTED');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [actualCost, setActualCost] = useState('0');
  const [notes, setNotes] = useState('');

  const now = new Date();

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('General');
    setEventId(events[0]?.id || '');
    setAssignedTo('');
    setDueDate('');
    setPriority('MEDIUM');
    setStatus('NOT_STARTED');
    setEstimatedCost('0');
    setActualCost('0');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setCategory(t.category);
    setEventId(t.event_id || '');
    setAssignedTo(t.assigned_to || '');
    setDueDate(t.due_date || '');
    setPriority(t.priority);
    setStatus(t.status);
    setEstimatedCost(String(t.estimated_cost || 0));
    setActualCost(String(t.actual_cost || 0));
    setNotes(t.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description,
        category,
        event_id: eventId || undefined,
        assigned_to: assignedTo,
        due_date: dueDate || undefined,
        priority,
        status,
        estimated_cost: parseFloat(estimatedCost) || 0,
        actual_cost: parseFloat(actualCost) || 0,
        notes,
      };

      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: Task['status'] = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    await api.updateTask(task.id, { status: nextStatus });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await api.deleteTask(id);
      onRefresh();
    }
  };

  const handleDuplicate = async (id: string) => {
    await api.duplicateTask(id);
    onRefresh();
  };

  const handleLoadTemplate = async (templateType: string) => {
    if (confirm(`Load the ${templateType === 'traditional_indian' ? 'Traditional Indian' : 'Essential'} wedding checklist template into your workspace?`)) {
      setLoading(true);
      try {
        await api.loadTaskTemplate(templateType);
        onRefresh();
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter & Search
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.assigned_to && t.assigned_to.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesEvent = eventFilter === 'ALL' || t.event_id === eventFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesEvent;
  });

  const categories = [
    'General',
    'Venue',
    'Decoration',
    'Outfits',
    'Jewellery',
    'Makeup',
    'Photography',
    'Catering',
    'Invitations',
    'Entertainment',
    'Rituals',
    'Travel',
    'Accommodation',
    'Legal & Registry',
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">Tasks &amp; Milestones</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Organize preparation checklists, deadlines, and ceremony responsibilities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tasks.length === 0 && (
            <button
              onClick={() => handleLoadTemplate('traditional_indian')}
              disabled={loading}
              className="px-3.5 py-2 bg-[#FAF5EE] border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#8C6D3B] text-xs font-medium rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Traditional Checklist
            </button>
          )}

          <div className="bg-[#EFE8DF] p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-white text-[#2C2420] shadow-xs' : 'text-[#7A6A5C]'
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'board' ? 'bg-white text-[#2C2420] shadow-xs' : 'text-[#7A6A5C]'
              }`}
              title="Kanban Board View"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#E8DFD5] rounded-2xl shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, categories, assignees..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E0D5C7] rounded-xl text-xs text-[#2C2420] placeholder-[#9A8B7C] focus:outline-none focus:ring-1 focus:ring-[#8C6D3B]"
          />
          <Search className="w-4 h-4 text-[#9A8B7C] absolute left-2.5 top-2" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#7A6A5C]">
            <Filter className="w-3.5 h-3.5 text-[#9A8B7C]" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2 py-1 text-xs text-[#2C2420] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#7A6A5C]">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2 py-1 text-xs text-[#2C2420] focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {events.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#7A6A5C]">
              <span>Event:</span>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2 py-1 text-xs text-[#2C2420] focus:outline-none"
              >
                <option value="ALL">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content Rendering: List vs Board */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-[#E8DFD5] rounded-2xl p-12 text-center text-xs text-[#8C7A6B]">
          <CheckSquare className="w-8 h-8 text-[#D4C3B3] mx-auto mb-3" />
          <p className="font-serif text-base font-medium text-[#2C2420]">No tasks found</p>
          <p className="mt-1">
            {tasks.length === 0
              ? 'No tasks created yet. Click "Add Task" or load our curated wedding checklist.'
              : 'No tasks match the active search and filter criteria.'}
          </p>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#8C6D3B] text-white rounded-xl font-medium"
              >
                Create First Task
              </button>
              <button
                onClick={() => handleLoadTemplate('traditional_indian')}
                className="px-4 py-2 bg-[#FAF5EE] border border-[#D4C3B3] text-[#8C6D3B] rounded-xl font-medium"
              >
                Load Traditional Checklist
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-[#E8DFD5] rounded-2xl overflow-hidden shadow-2xs divide-y divide-[#F2ECE3]">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isOverdue = !isCompleted && task.due_date && new Date(task.due_date) < now;
            const eventMatch = events.find((e) => e.id === task.event_id);

            return (
              <div
                key={task.id}
                className={`p-4 transition-colors hover:bg-[#FAF8F5] flex items-center justify-between gap-4 ${
                  isCompleted ? 'bg-[#FCFAF8]/60' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 text-[#9A8B7C] hover:text-[#8C6D3B] focus:outline-none"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2D7A4D] fill-[#E5F5EC]" />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-[#D4C3B3] hover:border-[#8C6D3B]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isCompleted ? 'line-through text-[#9A8B7C]' : 'text-[#2C2420]'
                        }`}
                      >
                        {task.title}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] text-[#B43B2A] font-semibold bg-[#FDF0ED] px-1.5 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#7A6A5C] mt-0.5 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#8C7A6B] mt-1.5">
                      <span>{task.category}</span>
                      {eventMatch && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{eventMatch.title}</span>
                        </>
                      )}
                      {task.assigned_to && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Assigned: {task.assigned_to}</span>
                        </>
                      )}
                      {task.estimated_cost > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Est: ₹{task.estimated_cost.toLocaleString('en-IN')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {task.due_date && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] uppercase text-[#9A8B7C] block font-medium">Due Date</span>
                      <span className={`text-xs font-mono tabular-nums ${isOverdue ? 'text-[#B43B2A] font-bold' : 'text-[#6B5E52]'}`}>
                        {task.due_date}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(task.id)}
                      title="Duplicate Task"
                      className="p-1.5 text-[#9A8B7C] hover:text-[#2C2420] hover:bg-[#F0EAE1] rounded-lg"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(task)}
                      title="Edit Task"
                      className="p-1.5 text-[#9A8B7C] hover:text-[#2C2420] hover:bg-[#F0EAE1] rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      title="Delete Task"
                      className="p-1.5 text-[#9A8B7C] hover:text-[#B43B2A] hover:bg-[#FDF0ED] rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);
            const colTitle =
              colStatus === 'NOT_STARTED'
                ? 'To Do'
                : colStatus === 'IN_PROGRESS'
                ? 'In Progress'
                : 'Completed';

            return (
              <div key={colStatus} className="bg-[#FAF5EE] border border-[#E5DACD] rounded-2xl p-4 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E0D5C7]">
                  <span className="font-serif font-semibold text-sm text-[#2C2420]">{colTitle}</span>
                  <span className="font-mono text-xs text-[#8C7A6B] bg-white px-2 py-0.5 rounded-full border border-[#E0D5C7]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-white border border-[#E8DFD5] rounded-xl shadow-2xs space-y-2 hover:border-[#8C6D3B]/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#2C2420] line-clamp-2">
                          {task.title}
                        </span>
                        <button
                          onClick={() => openEditModal(task)}
                          className="text-[#9A8B7C] hover:text-[#2C2420]"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#8C7A6B]">
                        <span>{task.category}</span>
                        {task.due_date && <span className="font-mono tabular-nums">{task.due_date}</span>}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#F2ECE3]">
                        <span className="text-[10px] text-[#9A8B7C]">
                          {task.priority} Priority
                        </span>
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className="text-[11px] text-[#8C6D3B] font-medium hover:underline"
                        >
                          {colStatus === 'COMPLETED' ? 'Reopen' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-4">
              {editingTask ? 'Edit Task Details' : 'Create New Wedding Task'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#F2C5BD] rounded-xl text-xs text-[#B43B2A]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Task Title <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule bridal hair & makeup trial"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, reference contacts or instructions"
                  className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Related Ceremony</label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    <option value="">General Celebration</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Assigned Person</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Groom's Brother / Bride"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Actual Cost (₹)</label>
                  <input
                    type="number"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#EFE8DF] text-[#4A3B32] rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium"
                >
                  {loading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
