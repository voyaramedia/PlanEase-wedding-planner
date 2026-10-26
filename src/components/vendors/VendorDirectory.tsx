import React, { useState } from 'react';
import type { Vendor, WeddingEvent } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  HeartHandshake,
  Plus,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';

interface VendorDirectoryProps {
  vendors: Vendor[];
  events: WeddingEvent[];
  onRefresh: () => void;
}

export const VendorDirectory: React.FC<VendorDirectoryProps> = ({
  vendors,
  events,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Venue');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('0');
  const [agreedAmount, setAgreedAmount] = useState('0');
  const [advancePaid, setAdvancePaid] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [bookingStatus, setBookingStatus] = useState<Vendor['booking_status']>('INQUIRY');
  const [notes, setNotes] = useState('');

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const categories = [
    'Venue & Hospitality',
    'Catering & Sweets',
    'Photography & Cinematography',
    'Floral & Mandap Decoration',
    'Sound, Lights & DJ',
    'Bridal Makeup & Styling',
    'Mehndi Artists',
    'Wedding Attire & Sherwani',
    'Jewellery & Accessories',
    'Pandit Ji / Religious Officiant',
    'Choreographer & Entertainment',
    'Transportation & Luxury Cars',
    'Wedding Cake & Desserts',
    'Invitation Printing',
  ];

  const openCreateModal = () => {
    setEditingVendor(null);
    setName('');
    setServiceCategory('Venue & Hospitality');
    setContactPerson('');
    setMobile('');
    setEmail('');
    setQuotedAmount('0');
    setAgreedAmount('0');
    setAdvancePaid('0');
    setAmountPaid('0');
    setBookingStatus('INQUIRY');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vendor) => {
    setEditingVendor(v);
    setName(v.name);
    setServiceCategory(v.service_category);
    setContactPerson(v.contact_person || '');
    setMobile(v.mobile || '');
    setEmail(v.email || '');
    setQuotedAmount(String(v.quoted_amount || 0));
    setAgreedAmount(String(v.agreed_amount || 0));
    setAdvancePaid(String(v.advance_paid || 0));
    setAmountPaid(String(v.amount_paid || 0));
    setBookingStatus(v.booking_status);
    setNotes(v.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vendor name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        service_category: serviceCategory,
        contact_person: contactPerson,
        mobile,
        email,
        quoted_amount: parseFloat(quotedAmount) || 0,
        agreed_amount: parseFloat(agreedAmount) || parseFloat(quotedAmount) || 0,
        advance_paid: parseFloat(advancePaid) || 0,
        amount_paid: parseFloat(amountPaid) || parseFloat(advancePaid) || 0,
        booking_status: bookingStatus,
        notes,
      };

      if (editingVendor) {
        await api.updateVendor(editingVendor.id, payload);
      } else {
        await api.createVendor(payload);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save vendor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this vendor from directory?')) {
      await api.deleteVendor(id);
      onRefresh();
    }
  };

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.service_category.toLowerCase().includes(search.toLowerCase()) ||
      (v.contact_person && v.contact_person.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || v.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">Vendors &amp; Partners</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Manage wedding vendors, contracted amounts, advance deposits, and settlement status
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#E8DFD5] rounded-2xl shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, category, or representative..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E0D5C7] rounded-xl text-xs text-[#2C2420] placeholder-[#9A8B7C] focus:outline-none focus:ring-1 focus:ring-[#8C6D3B]"
          />
          <Search className="w-4 h-4 text-[#9A8B7C] absolute left-2.5 top-2" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2.5 py-1 text-xs text-[#2C2420]"
        >
          <option value="ALL">All Booking Statuses</option>
          <option value="INQUIRY">Inquiry</option>
          <option value="QUOTED">Quoted</option>
          <option value="BOOKED">Booked</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Vendor Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E8DFD5] rounded-2xl p-12 text-center text-xs text-[#8C7A6B]">
          <HeartHandshake className="w-8 h-8 text-[#D4C3B3] mx-auto mb-3" />
          <p className="font-serif text-base font-medium text-[#2C2420]">No vendors in directory yet</p>
          <p className="mt-1">
            {vendors.length === 0
              ? 'Add photographers, caterers, florists, and artists to track bookings.'
              : 'No vendors match your search.'}
          </p>
          {vendors.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#8C6D3B] text-white rounded-xl font-medium"
            >
              Add First Vendor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((vendor) => {
            const agreed = vendor.agreed_amount || vendor.quoted_amount || 0;
            const paid = vendor.amount_paid || 0;
            const balance = Math.max(0, agreed - paid);

            return (
              <div
                key={vendor.id}
                className="p-5 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs flex flex-col justify-between hover:border-[#8C6D3B]/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] tracking-wider block">
                        {vendor.service_category}
                      </span>
                      <h3 className="font-serif text-lg font-semibold text-[#2C2420] mt-0.5">
                        {vendor.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        vendor.booking_status === 'BOOKED'
                          ? 'bg-[#EBF7F0] text-[#1D7543]'
                          : vendor.booking_status === 'COMPLETED'
                          ? 'bg-[#EAF0F9] text-[#1E5296]'
                          : vendor.booking_status === 'CANCELLED'
                          ? 'bg-[#FDF2F0] text-[#B43B2A]'
                          : 'bg-[#FAF5EE] text-[#8C6D3B]'
                      }`}
                    >
                      {vendor.booking_status}
                    </span>
                  </div>

                  {vendor.contact_person && (
                    <p className="text-xs text-[#6B5E52] mb-3">
                      Contact: <span className="font-medium text-[#2C2420]">{vendor.contact_person}</span>
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-[#7A6A5C] mb-4">
                    {vendor.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#9A8B7C]" />
                        <a href={`tel:${vendor.mobile}`} className="hover:underline">
                          {vendor.mobile}
                        </a>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#9A8B7C]" />
                        <a href={`mailto:${vendor.email}`} className="hover:underline truncate">
                          {vendor.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {vendor.notes && (
                    <p className="text-xs text-[#7A6A5C] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#F2ECE3] line-clamp-2 mb-4">
                      {vendor.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F2ECE3] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C7A6B]">Agreed:</span>
                    <span className="font-mono font-semibold text-[#2C2420] tabular-nums">
                      {formatINR(agreed)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8C7A6B]">Paid:</span>
                    <span className="font-mono font-medium text-[#2D7A4D] tabular-nums">
                      {formatINR(paid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-[#F2ECE3]">
                    <span className="text-[#8C7A6B]">Outstanding:</span>
                    <span className="font-mono font-bold text-[#B43B2A] tabular-nums">
                      {formatINR(balance)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="px-2.5 py-1 text-xs text-[#8C6D3B] hover:bg-[#FAF5EE] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="p-1 text-[#9A8B7C] hover:text-[#B43B2A] hover:bg-[#FDF0ED] rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-4">
              {editingVendor ? 'Edit Vendor Record' : 'Register New Vendor'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#F2C5BD] rounded-xl text-xs text-[#B43B2A]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Vendor / Business Name <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Heritage Mandap & Decor"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Service Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Booking Status</label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    <option value="INQUIRY">Inquiry</option>
                    <option value="QUOTED">Quoted</option>
                    <option value="BOOKED">Booked</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@studio.com"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Quoted (₹)</label>
                  <input
                    type="number"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Final Agreed (₹)</label>
                  <input
                    type="number"
                    value={agreedAmount}
                    onChange={(e) => setAgreedAmount(e.target.value)}
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

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Inclusions, sound setup requirements, delivery timings"
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
                  disabled={loading}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium"
                >
                  {loading ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
