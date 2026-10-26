import React, { useState } from 'react';
import type { Expense, WeddingEvent, Vendor, FinancesSummary } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Wallet,
  Plus,
  Download,
  Filter,
  Search,
  Trash2,
  Edit2,
  Receipt,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface BudgetExpensesProps {
  expenses: Expense[];
  events: WeddingEvent[];
  vendors: Vendor[];
  finances: FinancesSummary | null;
  onRefresh: () => void;
}

export const BudgetExpenses: React.FC<BudgetExpensesProps> = ({
  expenses,
  events,
  vendors,
  finances,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Venue');
  const [eventId, setEventId] = useState('');
  const [plannedAmount, setPlannedAmount] = useState('0');
  const [actualAmount, setActualAmount] = useState('0');
  const [committedAmount, setCommittedAmount] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [vendorId, setVendorId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const categories = [
    'Venue',
    'Decoration',
    'Catering',
    'Photography & Film',
    'Outfits & Wardrobe',
    'Jewellery',
    'Makeup & Mehndi',
    'Invitations & Stationery',
    'Gifts & Favors',
    'Travel & Transport',
    'Accommodation',
    'Entertainment & DJ',
    'Rituals & Priest',
    'Miscellaneous',
  ];

  const openCreateModal = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('Venue');
    setEventId(events[0]?.id || '');
    setPlannedAmount('0');
    setActualAmount('0');
    setCommittedAmount('0');
    setAmountPaid('0');
    setVendorId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setResponsiblePerson('');
    setNotes('');
    setReceiptUrl('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setEventId(exp.event_id || '');
    setPlannedAmount(String(exp.planned_amount || 0));
    setActualAmount(String(exp.actual_amount || 0));
    setCommittedAmount(String(exp.committed_amount || 0));
    setAmountPaid(String(exp.amount_paid || 0));
    setVendorId(exp.vendor_id || '');
    setPaymentDate(exp.payment_date || '');
    setPaymentMethod(exp.payment_method || 'UPI');
    setResponsiblePerson(exp.responsible_person || '');
    setNotes(exp.notes || '');
    setReceiptUrl(exp.receipt_url || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const res = await api.uploadFile(file);
      setReceiptUrl(res.url);
    } catch (err: any) {
      alert(err.message || 'Failed to upload receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        category,
        event_id: eventId || undefined,
        planned_amount: parseFloat(plannedAmount) || 0,
        actual_amount: parseFloat(actualAmount) || 0,
        committed_amount: parseFloat(committedAmount) || 0,
        amount_paid: parseFloat(amountPaid) || 0,
        vendor_id: vendorId || undefined,
        payment_date: paymentDate || undefined,
        payment_method: paymentMethod,
        responsible_person: responsiblePerson,
        notes,
        receipt_url: receiptUrl || undefined,
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, payload);
      } else {
        await api.createExpense(payload);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense entry?')) {
      await api.deleteExpense(id);
      onRefresh();
    }
  };

  const handleExportCSV = () => {
    const token = api.getToken();
    window.location.href = `/api/finances/export?token=${token}`;
  };

  // Filtered list
  const filtered = expenses.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
      (e.responsible_person && e.responsible_person.toLowerCase().includes(search.toLowerCase()));

    const matchCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchEvent = eventFilter === 'ALL' || e.event_id === eventFilter;
    const matchStatus = statusFilter === 'ALL' || e.payment_status === statusFilter;

    return matchSearch && matchCategory && matchEvent && matchStatus;
  });

  const totals = finances?.totals || {
    planned: 0,
    actual: 0,
    committed: 0,
    paid: 0,
    outstanding: 0,
    vendorTotalQuoted: 0,
    vendorTotalPaid: 0,
    vendorOutstanding: 0,
    expenseCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">
            Finances, Budget &amp; Expenses
          </h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Audit-ready calculations, vendor payables, and ceremony expenditure
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#8C6D3B]" />
            Export CSV
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Real Financial Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Planned Budget
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[#2C2420] tabular-nums mt-1 block">
            {formatINR(totals.planned)}
          </span>
          <span className="text-[10px] text-[#8C7A6B] mt-1 block">
            Sum of ceremony allocations
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Actual Incurred
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[#2C2420] tabular-nums mt-1 block">
            {formatINR(totals.actual)}
          </span>
          <span className="text-[10px] text-[#8C7A6B] mt-1 block">
            {totals.actual > totals.planned && totals.planned > 0
              ? 'Exceeds planned budget'
              : 'Within estimated bounds'}
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Total Settled / Paid
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[#2D7A4D] tabular-nums mt-1 block">
            {formatINR(totals.paid)}
          </span>
          <span className="text-[10px] text-[#8C7A6B] mt-1 block">
            Verified disbursements
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Outstanding Payables
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-[#B43B2A] tabular-nums mt-1 block">
            {formatINR(totals.outstanding)}
          </span>
          <span className="text-[10px] text-[#8C7A6B] mt-1 block">
            Pending vendor balances
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#E8DFD5] rounded-2xl shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items, responsible person, notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E0D5C7] rounded-xl text-xs text-[#2C2420] placeholder-[#9A8B7C] focus:outline-none focus:ring-1 focus:ring-[#8C6D3B]"
          />
          <Search className="w-4 h-4 text-[#9A8B7C] absolute left-2.5 top-2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2 py-1 text-xs text-[#2C2420]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2 py-1 text-xs text-[#2C2420]"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Expense Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E8DFD5] rounded-2xl p-12 text-center text-xs text-[#8C7A6B]">
          <Wallet className="w-8 h-8 text-[#D4C3B3] mx-auto mb-3" />
          <p className="font-serif text-base font-medium text-[#2C2420]">No expenses recorded yet</p>
          <p className="mt-1">
            {expenses.length === 0
              ? 'Start tracking vendor deposits, caterer advances, jewellery, and decor costs.'
              : 'No expenses match the current filter selection.'}
          </p>
          {expenses.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#8C6D3B] text-white rounded-xl font-medium"
            >
              Record First Expense
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E8DFD5] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E8DFD5] text-[#8C7A6B] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item &amp; Category</th>
                  <th className="py-3 px-4">Ceremony</th>
                  <th className="py-3 px-4 text-right">Planned (₹)</th>
                  <th className="py-3 px-4 text-right">Actual (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Method &amp; Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {filtered.map((item) => {
                  const ev = events.find((e) => e.id === item.event_id);
                  const vnd = vendors.find((v) => v.id === item.vendor_id);

                  return (
                    <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#2C2420]">{item.title}</div>
                        <div className="text-[11px] text-[#8C7A6B]">
                          {item.category}
                          {vnd && ` · Vendor: ${vnd.name}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#6B5E52]">
                        {ev ? ev.title : 'General'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#7A6A5C]">
                        {formatINR(item.planned_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#2C2420]">
                        {formatINR(item.actual_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#2D7A4D]">
                        {formatINR(item.amount_paid)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            item.payment_status === 'PAID'
                              ? 'bg-[#EBF7F0] text-[#1D7543]'
                              : item.payment_status === 'PARTIALLY_PAID'
                              ? 'bg-[#FEF5E7] text-[#C46A28]'
                              : 'bg-[#FDF2F0] text-[#B43B2A]'
                          }`}
                        >
                          {item.payment_status === 'PAID'
                            ? 'Paid'
                            : item.payment_status === 'PARTIALLY_PAID'
                            ? 'Partial'
                            : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6B5E52]">
                        <div>{item.payment_method || '—'}</div>
                        <div className="text-[10px] text-[#9A8B7C] font-mono">
                          {item.payment_date || 'No date'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.receipt_url && (
                            <a
                              href={item.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              title="View Receipt"
                              className="p-1 text-[#8C6D3B] hover:text-[#5A4520]"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit"
                            className="p-1 text-[#9A8B7C] hover:text-[#2C2420]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                            className="p-1 text-[#9A8B7C] hover:text-[#B43B2A]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-4">
              {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#F2C5BD] rounded-xl text-xs text-[#B43B2A]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Expense Title <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandap Floral Architecture Deposit"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420]"
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
                  <label className="block font-medium text-[#4A3B32] mb-1">Associated Ceremony</label>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Planned (₹)</label>
                  <input
                    type="number"
                    value={plannedAmount}
                    onChange={(e) => setPlannedAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Actual (₹)</label>
                  <input
                    type="number"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Linked Vendor</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    <option value="">No vendor linked</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.service_category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit/Debit Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Responsible Person</label>
                  <input
                    type="text"
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    placeholder="e.g. Groom's Father"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Receipt / Invoice File</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handleReceiptUpload}
                    className="text-xs text-[#7A6A5C] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#EFE8DF] file:text-[#4A3B32] hover:file:bg-[#E5DBCF]"
                  />
                  {uploadingReceipt && <span className="text-xs text-[#8C6D3B]">Uploading...</span>}
                  {receiptUrl && <span className="text-xs text-[#2D7A4D]">Uploaded ✓</span>}
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional payment terms, milestone release dates"
                  className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                />
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
                  disabled={loading || uploadingReceipt}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium"
                >
                  {loading ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
