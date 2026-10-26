import React, { useState } from 'react';
import type { Guest, WeddingEvent, CoupleProfile } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Users2,
  Plus,
  Download,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Trash2,
  Edit2,
  Link,
  Check,
  Mail,
  MessageSquare,
  ExternalLink,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';

interface GuestManagerProps {
  guests: Guest[];
  events: WeddingEvent[];
  coupleProfile: CoupleProfile | null;
  onRefresh: () => void;
  onSendInvitationsForGuests: (guestIds: string[]) => void;
}

export const GuestManager: React.FC<GuestManagerProps> = ({
  guests,
  events,
  coupleProfile,
  onRefresh,
  onSendInvitationsForGuests,
}) => {
  const [search, setSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('ALL');
  const [invitationFilter, setInvitationFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');

  // Selected for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Email Send Modal State
  const [emailModalGuest, setEmailModalGuest] = useState<Guest | null>(null);
  const [emailBatchMode, setEmailBatchMode] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);

  // WhatsApp Batch Queue Modal State
  const [isWhatsAppBatchOpen, setIsWhatsAppBatchOpen] = useState(false);
  const [sentWhatsAppIds, setSentWhatsAppIds] = useState<string[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [familyGroup, setFamilyGroup] = useState('Friends');
  const [relationship, setRelationship] = useState('Friend');
  const [accompanyingCount, setAccompanyingCount] = useState('0');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [notes, setNotes] = useState('');

  // CSV Import State
  const [importText, setImportText] = useState('');

  const groom = coupleProfile?.groom_name || 'Groom';
  const bride = coupleProfile?.bride_name || 'Bride';
  const weddingEvent = events.find((e) => e.event_type === 'WEDDING');

  // Extract distinct family groups
  const existingGroups = Array.from(new Set(guests.map((g) => g.family_group || 'General'))).filter(Boolean);

  const openCreateModal = () => {
    setEditingGuest(null);
    setFullName('');
    setEmail('');
    setMobile('');
    setFamilyGroup(existingGroups[0] || 'Friends');
    setRelationship('Friend');
    setAccompanyingCount('0');
    setSelectedEvents(events.map((e) => e.id));
    setDietaryPreferences('');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (g: Guest) => {
    setEditingGuest(g);
    setFullName(g.full_name);
    setEmail(g.email || '');
    setMobile(g.mobile || '');
    setFamilyGroup(g.family_group || 'General');
    setRelationship(g.relationship || 'Friend');
    setAccompanyingCount(String(g.accompanying_count || 0));
    setSelectedEvents(g.event_ids || []);
    setDietaryPreferences(g.dietary_preferences || '');
    setNotes(g.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Guest full name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        family_group: familyGroup.trim() || 'General',
        relationship: relationship.trim(),
        accompanying_count: parseInt(accompanyingCount) || 0,
        event_ids: selectedEvents,
        dietary_preferences: dietaryPreferences,
        notes,
      };

      if (editingGuest) {
        await api.updateGuest(editingGuest.id, payload);
      } else {
        await api.createGuest(payload);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save guest.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this guest from list?')) {
      await api.deleteGuest(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      onRefresh();
    }
  };

  const handleCopyRsvpLink = (token: string) => {
    const url = `${window.location.origin}/rsvp/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleExportCSV = () => {
    const token = api.getToken();
    window.location.href = `/api/guests/export?token=${token}`;
  };

  // Build Personalized Invitation Message
  const getPersonalizedMessage = (guest: Guest) => {
    const rsvpUrl = `${window.location.origin}/rsvp/${guest.invitation_token}`;
    const venueText = weddingEvent?.venue_name ? ` at ${weddingEvent.venue_name}` : '';
    const dateText = weddingEvent?.date_time
      ? ` on ${new Date(weddingEvent.date_time).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}`
      : '';

    return `Namaste ${guest.full_name}! ✨\n\nWith great joy, we invite you and your family to celebrate the auspicious wedding of ${groom} & ${bride}${dateText}${venueText}.\n\nPlease view your personalized wedding card and confirm your attendance here:\n${rsvpUrl}\n\nWe look forward to celebrating together!`;
  };

  // Direct WhatsApp Send for a Single Guest
  const handleSendWhatsAppSingle = async (guest: Guest) => {
    const cleanPhone = guest.mobile.replace(/\D/g, '');
    if (!cleanPhone) {
      alert(`Please enter a valid mobile number for ${guest.full_name} to send via WhatsApp.`);
      openEditModal(guest);
      return;
    }

    // Format phone with international code if needed (default to 91 for Indian numbers if 10 digits)
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = getPersonalizedMessage(guest);
    const waUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    window.open(waUrl, '_blank');

    // Sync with backend: log delivery & update status
    try {
      await api.sendInvitations({
        guest_ids: [guest.id],
        channel: 'WHATSAPP',
      });
      onRefresh();
    } catch (err) {
      console.warn('Failed to record WhatsApp delivery status:', err);
    }
  };

  // Direct Email Send Single Guest
  const handleOpenEmailModal = (guest: Guest) => {
    setEmailModalGuest(guest);
    setEmailBatchMode(false);
    setEmailStatusMessage(null);
  };

  const handleOpenBatchEmailModal = () => {
    setEmailModalGuest(null);
    setEmailBatchMode(true);
    setEmailStatusMessage(null);
  };

  const handleSendServerEmail = async () => {
    setLoading(true);
    setEmailStatusMessage(null);

    const targetGuestIds = emailBatchMode
      ? selectedIds
      : emailModalGuest
      ? [emailModalGuest.id]
      : [];

    if (targetGuestIds.length === 0) return;

    try {
      const res = await api.sendInvitations({
        guest_ids: targetGuestIds,
        channel: 'EMAIL',
      });

      if (res.failureCount > 0) {
        setEmailStatusMessage(
          `Processed ${res.totalProcessed} recipients. ${res.failureCount} failed because SMTP server is not yet configured in Super Admin settings. You can still send directly using your personal Email App below!`
        );
      } else {
        setEmailStatusMessage(`Successfully delivered invitations to ${res.successCount} guest(s)!`);
        setTimeout(() => {
          setEmailModalGuest(null);
          setEmailBatchMode(false);
        }, 1500);
      }
      onRefresh();
    } catch (err: any) {
      setEmailStatusMessage(err.message || 'Failed to dispatch emails.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendClientMailto = (guest: Guest) => {
    const subject = encodeURIComponent(`Wedding Invitation: ${groom} & ${bride}'s Wedding Celebration`);
    const body = encodeURIComponent(getPersonalizedMessage(guest));
    window.location.href = `mailto:${guest.email}?subject=${subject}&body=${body}`;

    // Mark as sent in database
    api.sendInvitations({
      guest_ids: [guest.id],
      channel: 'EMAIL',
    }).then(() => onRefresh());
  };

  // Batch WhatsApp Modal Open
  const handleOpenWhatsAppBatch = () => {
    setSentWhatsAppIds([]);
    setIsWhatsAppBatchOpen(true);
  };

  const handleMarkAllSelectedWhatsAppSent = async () => {
    setLoading(true);
    try {
      await api.sendInvitations({
        guest_ids: selectedIds,
        channel: 'WHATSAPP',
      });
      setSentWhatsAppIds(selectedIds);
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!importText.trim()) {
      setError('Please provide CSV data.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lines = importText.split('\n').filter((l) => l.trim().length > 0);
      const importedList: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (i === 0 && (lines[i].toLowerCase().includes('name') || lines[i].toLowerCase().includes('email'))) {
          continue;
        }

        const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts[0]) {
          importedList.push({
            full_name: parts[0],
            email: parts[1] || '',
            mobile: parts[2] || '',
            family_group: parts[3] || 'General',
            relationship: parts[4] || 'Guest',
            accompanying_count: parseInt(parts[5]) || 0,
          });
        }
      }

      if (importedList.length === 0) {
        throw new Error('No valid guest records found in input.');
      }

      await api.importGuests(importedList);
      setIsImportModalOpen(false);
      setImportText('');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Import failed. Check CSV formatting.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map((g) => g.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered List
  const filtered = guests.filter((g) => {
    const matchSearch =
      g.full_name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.mobile.includes(search) ||
      g.family_group.toLowerCase().includes(search.toLowerCase());

    const matchRsvp = rsvpFilter === 'ALL' || g.rsvp_status === rsvpFilter;
    const matchInv = invitationFilter === 'ALL' || g.invitation_status === invitationFilter;
    const matchGroup = groupFilter === 'ALL' || g.family_group === groupFilter;

    return matchSearch && matchRsvp && matchInv && matchGroup;
  });

  const totalConfirmed = guests.filter((g) => g.rsvp_status === 'CONFIRMED').length;
  const totalDeclined = guests.filter((g) => g.rsvp_status === 'DECLINED').length;
  const totalPending = guests.filter((g) => g.rsvp_status === 'PENDING').length;
  const totalHeads = guests
    .filter((g) => g.rsvp_status === 'CONFIRMED')
    .reduce((sum, g) => sum + 1 + (g.accompanying_count || 0), 0);

  const selectedGuestsList = guests.filter((g) => selectedIds.includes(g.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">Guest List &amp; RSVPs</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Link and sync your guest list with WhatsApp and Email invitations, RSVP links, and attendee counts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#2C2420] text-xs font-medium rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-[#8C6D3B]" />
            Import CSV
          </button>
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
            Add Guest
          </button>
        </div>
      </div>

      {/* KPI Tally */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Total Guest Records
          </span>
          <span className="font-mono text-2xl font-bold text-[#2C2420] tabular-nums mt-1 block">
            {guests.length}
          </span>
          <span className="text-[10px] text-[#8C7A6B] mt-1 block">
            {guests.filter((g) => g.invitation_status === 'SENT').length} invites sent
          </span>
        </div>

        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Confirmed Attendees
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-bold text-[#2D7A4D] tabular-nums">
              {totalHeads}
            </span>
            <span className="text-xs text-[#8C7A6B]">({totalConfirmed} parties)</span>
          </div>
          <span className="text-[10px] text-[#8C7A6B] mt-1 block">Including plus-ones</span>
        </div>

        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Awaiting Response
          </span>
          <span className="font-mono text-2xl font-bold text-[#8C6D3B] tabular-nums mt-1 block">
            {totalPending}
          </span>
          <span className="text-[10px] text-[#8C7A6B] mt-1 block">Pending digital RSVPs</span>
        </div>

        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block">
            Declined
          </span>
          <span className="font-mono text-2xl font-bold text-[#9A8B7C] tabular-nums mt-1 block">
            {totalDeclined}
          </span>
          <span className="text-[10px] text-[#8C7A6B] mt-1 block">Cannot attend festivities</span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#E8DFD5] rounded-2xl shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest by name, phone, email, or family..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E0D5C7] rounded-xl text-xs text-[#2C2420] placeholder-[#9A8B7C] focus:outline-none focus:ring-1 focus:ring-[#8C6D3B]"
          />
          <Search className="w-4 h-4 text-[#9A8B7C] absolute left-2.5 top-2" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rsvpFilter}
            onChange={(e) => setRsvpFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2 py-1 text-xs text-[#2C2420]"
          >
            <option value="ALL">All RSVPs</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="DECLINED">Declined</option>
          </select>

          <select
            value={invitationFilter}
            onChange={(e) => setInvitationFilter(e.target.value)}
            className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2 py-1 text-xs text-[#2C2420]"
          >
            <option value="ALL">All Invitation Statuses</option>
            <option value="NOT_SENT">Not Sent</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
          </select>

          {existingGroups.length > 0 && (
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg px-2 py-1 text-xs text-[#2C2420]"
            >
              <option value="ALL">All Groups</option>
              {existingGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Multi-Select Batch Actions Bar: Linked and Synced with Email and WhatsApp */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-[#FAF5EE] border border-[#E0D5C7] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium text-[#2C2420]">
            <span className="font-semibold">{selectedIds.length}</span> guest{selectedIds.length > 1 ? 's' : ''} selected
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenWhatsAppBatch}
              className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Send via WhatsApp ({selectedIds.length})
            </button>

            <button
              onClick={handleOpenBatchEmailModal}
              className="px-3.5 py-1.5 bg-[#8C6D3B] hover:bg-[#785C30] text-white font-medium rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Send via Email ({selectedIds.length})
            </button>

            <button
              onClick={() => onSendInvitationsForGuests(selectedIds)}
              className="px-3 py-1.5 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#4A3B32] font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8C6D3B]" />
              Open in Invitation Studio
            </button>
          </div>
        </div>
      )}

      {/* Guests Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E8DFD5] rounded-2xl p-12 text-center text-xs text-[#8C7A6B]">
          <Users2 className="w-8 h-8 text-[#D4C3B3] mx-auto mb-3" />
          <p className="font-serif text-base font-medium text-[#2C2420]">No guests on list</p>
          <p className="mt-1">
            {guests.length === 0
              ? 'Add friends, family, and colleagues to track ceremony RSVPs and send invites via Email and WhatsApp.'
              : 'No guests match the search and filter selection.'}
          </p>
          {guests.length === 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#8C6D3B] text-white rounded-xl font-medium"
              >
                Add First Guest
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-[#FAF5EE] border border-[#D4C3B3] text-[#8C6D3B] rounded-xl font-medium"
              >
                Import from CSV
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E8DFD5] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E8DFD5] text-[#8C7A6B] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-[#D4C3B3] text-[#8C6D3B] focus:ring-[#8C6D3B]"
                    />
                  </th>
                  <th className="py-3 px-4">Guest &amp; Family Group</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-3 text-center">Plus Ones</th>
                  <th className="py-3 px-3 text-center">RSVP</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Send Invitation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {filtered.map((guest) => {
                  const isSelected = selectedIds.includes(guest.id);

                  return (
                    <tr
                      key={guest.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        isSelected ? 'bg-[#FAF5EE]/60' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(guest.id)}
                          className="rounded border-[#D4C3B3] text-[#8C6D3B] focus:ring-[#8C6D3B]"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2C2420]">{guest.full_name}</div>
                        <div className="text-[11px] text-[#8C7A6B]">
                          {guest.family_group} · {guest.relationship}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#6B5E52]">
                        <div className="font-mono text-xs">{guest.mobile || 'No mobile'}</div>
                        <div className="text-[11px] text-[#8C7A6B] truncate max-w-[170px]">
                          {guest.email || 'No email'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono tabular-nums text-[#2C2420]">
                        {guest.accompanying_count > 0 ? `+${guest.accompanying_count}` : '0'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            guest.rsvp_status === 'CONFIRMED'
                              ? 'bg-[#EBF7F0] text-[#1D7543]'
                              : guest.rsvp_status === 'DECLINED'
                              ? 'bg-[#FDF2F0] text-[#B43B2A]'
                              : 'bg-[#FEF5E7] text-[#C46A28]'
                          }`}
                        >
                          {guest.rsvp_status === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3" />}
                          {guest.rsvp_status === 'DECLINED' && <XCircle className="w-3 h-3" />}
                          {guest.rsvp_status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {guest.rsvp_status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            guest.invitation_status === 'SENT' || guest.invitation_status === 'DELIVERED'
                              ? 'bg-[#EAF0F9] text-[#1E5296]'
                              : guest.invitation_status === 'FAILED'
                              ? 'bg-[#FDF2F0] text-[#B43B2A]'
                              : 'bg-[#F2ECE3] text-[#7A6A5C]'
                          }`}
                        >
                          {guest.invitation_status === 'NOT_SENT' ? 'Not Sent' : guest.invitation_status}
                        </span>
                      </td>

                      {/* DIRECT 1-CLICK SEND VIA WHATSAPP & EMAIL */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8DFD5]">
                          <button
                            onClick={() => handleSendWhatsAppSingle(guest)}
                            title="Send Invitation via WhatsApp"
                            className="px-2.5 py-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg flex items-center gap-1 text-[11px] font-medium transition-colors shadow-2xs"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => handleOpenEmailModal(guest)}
                            title="Send Invitation via Email"
                            className="px-2.5 py-1 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-lg flex items-center gap-1 text-[11px] font-medium transition-colors shadow-2xs"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyRsvpLink(guest.invitation_token)}
                            title="Copy Guest RSVP Link"
                            className="p-1.5 text-[#8C6D3B] hover:text-[#5A4520] hover:bg-[#FAF5EE] rounded-lg transition-colors flex items-center gap-1"
                          >
                            {copiedToken === guest.invitation_token ? (
                              <Check className="w-3.5 h-3.5 text-[#2D7A4D]" />
                            ) : (
                              <Link className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[10px]">
                              {copiedToken === guest.invitation_token ? 'Copied' : 'Link'}
                            </span>
                          </button>

                          <button
                            onClick={() => openEditModal(guest)}
                            title="Edit Guest"
                            className="p-1.5 text-[#9A8B7C] hover:text-[#2C2420] rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(guest.id)}
                            title="Remove Guest"
                            className="p-1.5 text-[#9A8B7C] hover:text-[#B43B2A] rounded-lg"
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

      {/* WHATSAPP BATCH QUEUE MODAL */}
      {isWhatsAppBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-[#FAF8F5] border border-[#E0D5C7] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <button
              onClick={() => setIsWhatsAppBatchOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-[#E8DFD5] mb-4">
              <div className="flex items-center gap-2 text-[#25D366]">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-serif text-xl font-semibold text-[#2C2420]">
                  WhatsApp Invitation Queue
                </h3>
              </div>
              <p className="text-xs text-[#7A6A5C] mt-1">
                Click to open WhatsApp directly for each guest with their personalized RSVP link pre-filled.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {selectedGuestsList.map((g) => {
                const isSent = sentWhatsAppIds.includes(g.id) || g.invitation_status === 'SENT';
                const hasPhone = Boolean(g.mobile && g.mobile.replace(/\D/g, ''));

                return (
                  <div
                    key={g.id}
                    className="p-3 bg-white border border-[#E8DFD5] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#2C2420]">{g.full_name}</div>
                      <div className="text-[11px] text-[#8C7A6B]">
                        {g.mobile || 'No mobile recorded'} · {g.family_group}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSent && (
                        <span className="text-[10px] text-[#2D7A4D] font-medium bg-[#EBF7F0] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Sent
                        </span>
                      )}

                      <button
                        onClick={() => {
                          handleSendWhatsAppSingle(g);
                          setSentWhatsAppIds((prev) => [...prev, g.id]);
                        }}
                        disabled={!hasPhone}
                        className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg font-medium flex items-center gap-1 shadow-2xs disabled:opacity-40"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-[#E8DFD5] flex items-center justify-between text-xs">
              <span className="text-[#8C7A6B]">
                {sentWhatsAppIds.length} of {selectedGuestsList.length} processed
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllSelectedWhatsAppSent}
                  disabled={loading}
                  className="px-3.5 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#4A3B32] rounded-xl font-medium"
                >
                  Mark All as Sent
                </button>
                <button
                  onClick={() => setIsWhatsAppBatchOpen(false)}
                  className="px-4 py-2 bg-[#8C6D3B] text-white rounded-xl font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL INVITATION MODAL (Single or Batch) */}
      {(emailModalGuest || emailBatchMode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E0D5C7] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <button
              onClick={() => {
                setEmailModalGuest(null);
                setEmailBatchMode(false);
              }}
              className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-[#8C6D3B] mb-2">
              <Mail className="w-5 h-5" />
              <h3 className="font-serif text-xl font-semibold text-[#2C2420]">
                {emailBatchMode ? `Send Email to ${selectedIds.length} Guests` : `Send Email to ${emailModalGuest?.full_name}`}
              </h3>
            </div>
            <p className="text-xs text-[#7A6A5C] mb-4">
              Delivers your wedding card, ceremony timing, and unique guest RSVP confirmation link.
            </p>

            {emailStatusMessage && (
              <div className="mb-4 p-3.5 bg-[#FAF5EE] border border-[#E2D5C8] rounded-xl text-xs text-[#5A4B40] leading-relaxed">
                {emailStatusMessage}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-white border border-[#E8DFD5] rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-[#8C7A6B] block">Email Subject</span>
                <p className="font-medium text-[#2C2420]">
                  Wedding Invitation: {groom} &amp; {bride}'s Wedding Celebration
                </p>
              </div>

              <div className="p-3.5 bg-white border border-[#E8DFD5] rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] block">Invitation Preview</span>
                <p className="text-[#4A3B32] whitespace-pre-line leading-relaxed font-serif text-[11px]">
                  {emailModalGuest ? getPersonalizedMessage(emailModalGuest) : `Namaste {Guest Name}! ✨\n\nWith great joy, we invite you and your family to celebrate the wedding of ${groom} & ${bride}...\n\nRSVP Link: https://.../rsvp/{token}`}
                </p>
              </div>

              {/* Delivery Options */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendServerEmail}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium shadow-xs flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? 'Dispatching...' : 'Dispatch via System SMTP Server'}
                </button>

                {!emailBatchMode && emailModalGuest && (
                  <button
                    type="button"
                    onClick={() => handleSendClientMailto(emailModalGuest)}
                    className="w-full py-2.5 px-4 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#4A3B32] rounded-xl font-medium shadow-2xs flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#8C6D3B]" />
                    Send with My Email App (Gmail / Outlook)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Guest Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-4">
              {editingGuest ? 'Edit Guest Record' : 'Add Guest to List'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#F2C5BD] rounded-xl text-xs text-[#B43B2A]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">
                  Full Name <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">
                    Mobile / WhatsApp (with country code)
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98200 54321"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Family / Group</label>
                  <input
                    type="text"
                    value={familyGroup}
                    onChange={(e) => setFamilyGroup(e.target.value)}
                    placeholder="e.g. Patel Family"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Relationship</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Groom's Uncle"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Accompanying (+)</label>
                  <input
                    type="number"
                    min="0"
                    value={accompanyingCount}
                    onChange={(e) => setAccompanyingCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Dietary Preferences / Notes</label>
                <textarea
                  rows={2}
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                  placeholder="e.g. Pure Vegetarian, Jain Food, No Garlic"
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
                  {loading ? 'Saving...' : editingGuest ? 'Update Guest' : 'Save Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-2">
              Import Guests from CSV / Excel
            </h3>
            <p className="text-xs text-[#7A6A5C] mb-4">
              Paste comma-separated rows: <code className="bg-white px-1 py-0.5 rounded text-[#2C2420]">Full Name, Email, Mobile, Group, Relationship, Accompanying</code>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#F2C5BD] rounded-xl text-xs text-[#B43B2A]">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Rohan Sharma, rohan@example.com, +919876543210, Sharma Family, Friend, 1&#10;Priya Verma, priya@example.com, +919811122233, Verma Family, Bride's Cousin, 2"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl font-mono text-xs text-[#2C2420] placeholder-[#A89A8D]"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-[#EFE8DF] text-[#4A3B32] rounded-xl font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={loading}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium text-xs"
                >
                  {loading ? 'Importing...' : 'Parse & Import Guests'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
