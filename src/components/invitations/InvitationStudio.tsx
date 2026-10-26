import React, { useState, useEffect } from 'react';
import type { InvitationDesign, Guest, WeddingEvent, CoupleProfile, InvitationDeliveryLog } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Trash2,
  Mail,
  MessageSquare,
  Users2,
  ExternalLink,
  Sparkles,
  Search,
  Check,
  X,
} from 'lucide-react';

interface InvitationStudioProps {
  invitations: InvitationDesign[];
  guests: Guest[];
  events: WeddingEvent[];
  coupleProfile: CoupleProfile | null;
  deliveryLogs: InvitationDeliveryLog[];
  preselectedGuestIds?: string[];
  onClearPreselected?: () => void;
  onRefresh: () => void;
}

export const InvitationStudio: React.FC<InvitationStudioProps> = ({
  invitations,
  guests,
  events,
  coupleProfile,
  deliveryLogs,
  preselectedGuestIds,
  onClearPreselected,
  onRefresh,
}) => {
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationDesign | null>(
    invitations[0] || null
  );

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [templateMessage, setTemplateMessage] = useState(
    'We cordially invite you and your family to grace the auspicious wedding festivities of {GROOM} & {BRIDE}. Your presence will bless the joyous beginning of our new chapter together.'
  );

  // Dispatch Modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'ALL' | 'UNSENT' | 'SELECTED_GROUP' | 'CUSTOM'>('UNSENT');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [guestSearch, setGuestSearch] = useState('');
  const [dispatchChannel, setDispatchChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    total: number;
    success: number;
    failed: number;
    errorNote?: string;
  } | null>(null);

  // React to preselected guests from Guest List
  useEffect(() => {
    if (preselectedGuestIds && preselectedGuestIds.length > 0) {
      setSelectedGuestIds(preselectedGuestIds);
      setRecipientMode('CUSTOM');
      setIsDispatchModalOpen(true);
    }
  }, [preselectedGuestIds]);

  const groom = coupleProfile?.groom_name || 'Groom';
  const bride = coupleProfile?.bride_name || 'Bride';

  const familyGroups = Array.from(new Set(guests.map((g) => g.family_group || 'General'))).filter(Boolean);

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      const newCard = await api.createInvitation({
        title: cardTitle.trim() || `${groom} & ${bride} Invitation Card`,
        image_url: res.url,
        message_template: templateMessage,
      });
      setSelectedInvitation(newCard);
      setCardTitle('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to upload card.');
    } finally {
      setUploading(false);
    }
  };

  const handleUsePresetArt = async () => {
    setUploading(true);
    try {
      const newCard = await api.createInvitation({
        title: `${groom} & ${bride} Royal Suite`,
        image_url: '/src/assets/images/invitation_art_card_1793002743107.jpg',
        message_template: templateMessage,
      });
      setSelectedInvitation(newCard);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to initialize invitation card.');
    } finally {
      setUploading(false);
    }
  };

  const weddingEvent = events.find((e) => e.event_type === 'WEDDING');

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

    return `Namaste ${guest.full_name}! ✨\n\nWith immense joy, we invite you and your family to celebrate the wedding festivities of ${groom} & ${bride}${dateText}${venueText}.\n\nPlease view your digital invitation card and kindly RSVP here:\n${rsvpUrl}\n\nWe look forward to celebrating together!`;
  };

  const handleSingleWhatsApp = async (guest: Guest) => {
    const cleanPhone = guest.mobile ? guest.mobile.replace(/\D/g, '') : '';
    if (!cleanPhone) {
      alert(`Please update ${guest.full_name}'s mobile number in the Guest List before sending via WhatsApp.`);
      return;
    }
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = getPersonalizedMessage(guest);
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`, '_blank');

    try {
      await api.sendInvitations({
        guest_ids: [guest.id],
        channel: 'WHATSAPP',
        invitation_id: selectedInvitation?.id,
      });
      onRefresh();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSingleMailto = (guest: Guest) => {
    if (!guest.email) {
      alert(`No email address recorded for ${guest.full_name}.`);
      return;
    }
    const subject = encodeURIComponent(`Wedding Invitation: ${groom} & ${bride}'s Wedding Celebration`);
    const body = encodeURIComponent(getPersonalizedMessage(guest));
    window.location.href = `mailto:${guest.email}?subject=${subject}&body=${body}`;

    api.sendInvitations({
      guest_ids: [guest.id],
      channel: 'EMAIL',
      invitation_id: selectedInvitation?.id,
    }).then(() => onRefresh());
  };

  const handleDeleteCard = async (id: string) => {
    if (confirm('Delete this invitation design?')) {
      await api.deleteInvitation(id);
      setSelectedInvitation(null);
      onRefresh();
    }
  };

  // Determine target guests for dispatch
  const getTargetGuests = (): Guest[] => {
    if (recipientMode === 'ALL') return guests;
    if (recipientMode === 'UNSENT') return guests.filter((g) => g.invitation_status !== 'SENT');
    if (recipientMode === 'SELECTED_GROUP') return guests.filter((g) => g.family_group === selectedGroup);
    return guests.filter((g) => selectedGuestIds.includes(g.id));
  };

  const targetGuests = getTargetGuests();

  const handleDispatch = async () => {
    if (targetGuests.length === 0) {
      alert('No eligible recipients match the current selection.');
      return;
    }

    setDispatchLoading(true);
    setDispatchResult(null);

    try {
      const res = await api.sendInvitations({
        guest_ids: targetGuests.map((g) => g.id),
        channel: dispatchChannel,
        invitation_id: selectedInvitation?.id,
        custom_message: templateMessage,
      });

      setDispatchResult({
        total: res.totalProcessed,
        success: res.successCount,
        failed: res.failureCount,
        errorNote:
          res.failureCount > 0
            ? 'Some dispatches could not be delivered. If using Email, verify SMTP configuration in Super Admin settings. You can also send via WhatsApp or personal mail client.'
            : undefined,
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch invitations.');
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">
            Digital Invitations &amp; Dispatch
          </h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Design cards, craft personalized messages, and track actual delivery outcomes
          </p>
        </div>

        <button
          onClick={() => {
            setDispatchResult(null);
            setIsDispatchModalOpen(true);
          }}
          disabled={guests.length === 0}
          className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Send Invitations to Guests
        </button>
      </div>

      {/* Preselected Sync Banner */}
      {preselectedGuestIds && preselectedGuestIds.length > 0 && (
        <div className="p-3.5 bg-[#FAF5EE] border border-[#E0D5C7] rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C6D3B] shrink-0" />
            <span className="text-[#2C2420]">
              <strong className="font-semibold">{preselectedGuestIds.length}</strong> guest{preselectedGuestIds.length > 1 ? 's' : ''} synchronized from Guest List ready for invitation dispatch.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedGuestIds(preselectedGuestIds);
                setRecipientMode('CUSTOM');
                setIsDispatchModalOpen(true);
              }}
              className="px-3 py-1 bg-[#8C6D3B] text-white rounded-lg font-medium hover:bg-[#785C30] transition-colors"
            >
              Configure Dispatch
            </button>
            {onClearPreselected && (
              <button
                onClick={onClearPreselected}
                className="p-1 text-[#8C7A6B] hover:text-[#2C2420] rounded"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Card Canvas & Delivery Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Invitation Card Preview & Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-serif text-base font-semibold text-[#2C2420]">
                Active Invitation Design
              </span>
              {selectedInvitation && (
                <button
                  onClick={() => handleDeleteCard(selectedInvitation.id)}
                  className="p-1.5 text-[#9A8B7C] hover:text-[#B43B2A] rounded-lg"
                  title="Delete Card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedInvitation ? (
              <div className="space-y-3">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#E0D5C7] shadow-inner bg-[#FAF5EE]">
                  <img
                    src={selectedInvitation.image_url}
                    alt={selectedInvitation.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                    <p className="font-serif text-sm font-medium">{selectedInvitation.title}</p>
                    <p className="text-[10px] text-white/80">Digital Wedding Suite</p>
                  </div>
                </div>

                <div className="text-xs text-[#7A6A5C]">
                  <span className="font-medium text-[#2C2420]">Message Template:</span>
                  <p className="mt-1 p-2.5 bg-[#FAF8F5] border border-[#F2ECE3] rounded-xl italic">
                    "{selectedInvitation.message_template}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-[#D4C3B3] rounded-2xl text-center space-y-3 bg-[#FAF8F5]">
                <ImageIcon className="w-10 h-10 text-[#C4B5A5] mx-auto" />
                <div>
                  <p className="font-serif text-sm font-semibold text-[#2C2420]">
                    No invitation design uploaded
                  </p>
                  <p className="text-xs text-[#8C7A6B] mt-0.5">
                    Upload your digital invitation card (JPG, PNG) or use our luxury royal suite
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <label className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs">
                    {uploading ? 'Uploading Design...' : 'Upload Invitation Image'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleCardUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleUsePresetArt}
                    disabled={uploading}
                    className="px-4 py-2 bg-white border border-[#D4C3B3] hover:border-[#8C6D3B] text-[#8C6D3B] text-xs font-medium rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Use Luxury Gold Foil Design
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real Delivery Audit Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-white border border-[#E8DFD5] rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
              <div>
                <h3 className="font-serif text-base font-semibold text-[#2C2420]">
                  Actual Dispatch &amp; Delivery Log
                </h3>
                <p className="text-xs text-[#7A6A5C] mt-0.5">
                  Verified server-side outbound records and provider responses
                </p>
              </div>

              <span className="font-mono text-xs text-[#8C7A6B] bg-[#FAF5EE] px-2.5 py-1 rounded-full border border-[#E2D5C8]">
                {deliveryLogs.length} attempts
              </span>
            </div>

            {deliveryLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8C7A6B]">
                <Send className="w-8 h-8 text-[#D4C3B3] mx-auto mb-2" />
                <p className="font-medium text-[#2C2420]">No invitations dispatched yet</p>
                <p className="mt-1">
                  Once you send digital invites to guests, real delivery logs will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF5EE] border-b border-[#E8DFD5] text-[#8C7A6B] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Guest &amp; Channel</th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3 text-center">Outcome</th>
                      <th className="py-2.5 px-3 text-right">Sent Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE3]">
                    {deliveryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[#2C2420]">{log.guest_name}</div>
                          <div className="text-[10px] text-[#8C7A6B]">{log.channel}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[#6B5E52] truncate max-w-[140px]">
                          {log.recipient}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              log.status === 'SUCCESS'
                                ? 'bg-[#EBF7F0] text-[#1D7543]'
                                : 'bg-[#FDF2F0] text-[#B43B2A]'
                            }`}
                          >
                            {log.status === 'SUCCESS' ? 'Delivered' : 'Failed'}
                          </span>
                          {log.error_message && (
                            <div className="text-[9px] text-[#B43B2A] mt-0.5 max-w-[200px] truncate" title={log.error_message}>
                              {log.error_message}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#7A6A5C]">
                          {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-2">
              Dispatch Digital Wedding Invitations
            </h3>
            <p className="text-xs text-[#7A6A5C] mb-4">
              Select delivery channel, recipients, and review dispatch count before initiating.
            </p>

            {dispatchResult && (
              <div
                className={`mb-4 p-4 rounded-xl text-xs space-y-1.5 ${
                  dispatchResult.failed > 0
                    ? 'bg-[#FDF6E8] border border-[#F2D7A5] text-[#8C6D3B]'
                    : 'bg-[#EDF8F2] border border-[#BCE4CD] text-[#1B6E44]'
                }`}
              >
                <div className="font-semibold text-sm">
                  Processed {dispatchResult.total} recipient{dispatchResult.total > 1 ? 's' : ''}:
                </div>
                <div>Delivered: {dispatchResult.success} · Failed: {dispatchResult.failed}</div>
                {dispatchResult.errorNote && (
                  <p className="text-[11px] text-[#A05A18] pt-1 border-t border-[#E8D09E]">
                    {dispatchResult.errorNote}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Channel Selector */}
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1.5">Dispatch Channel</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDispatchChannel('EMAIL')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      dispatchChannel === 'EMAIL'
                        ? 'border-[#8C6D3B] bg-white shadow-xs text-[#2C2420]'
                        : 'border-[#E0D5C7] bg-[#FAF8F5] text-[#7A6A5C]'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-[#8C6D3B] mb-1" />
                    <span className="font-semibold block">Email Delivery</span>
                    <span className="text-[10px] text-[#9A8B7C]">Embeds card &amp; RSVP link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchChannel('WHATSAPP')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      dispatchChannel === 'WHATSAPP'
                        ? 'border-[#8C6D3B] bg-white shadow-xs text-[#2C2420]'
                        : 'border-[#E0D5C7] bg-[#FAF8F5] text-[#7A6A5C]'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-[#8C6D3B] mb-1" />
                    <span className="font-semibold block">WhatsApp Delivery</span>
                    <span className="text-[10px] text-[#9A8B7C]">Personalized direct link</span>
                  </button>
                </div>
              </div>

              {/* Recipient Mode */}
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1.5">Recipient Selection</label>
                <select
                  value={recipientMode}
                  onChange={(e) => setRecipientMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                >
                  <option value="UNSENT">All guests who haven't been invited yet</option>
                  <option value="ALL">All guests on workspace list ({guests.length})</option>
                  {familyGroups.length > 0 && <option value="SELECTED_GROUP">By Specific Family Group</option>}
                  <option value="CUSTOM">Specific Selected Guests ({selectedGuestIds.length})</option>
                </select>
              </div>

              {recipientMode === 'SELECTED_GROUP' && (
                <div>
                  <label className="block font-medium text-[#4A3B32] mb-1">Select Family Group</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                  >
                    <option value="">Select Group</option>
                    {familyGroups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Guest Checklist */}
              {recipientMode === 'CUSTOM' && (
                <div className="space-y-2 border border-[#E8DFD5] rounded-xl p-3 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[#2C2420]">Choose Specific Guests:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGuestIds(guests.map((g) => g.id))}
                        className="text-[11px] text-[#8C6D3B] hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-[#D8CCBD]">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedGuestIds([])}
                        className="text-[11px] text-[#8C7A6B] hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Search inside selector */}
                  <div className="relative">
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Filter guests by name or contact..."
                      className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E0D5C7] rounded-lg text-xs placeholder-[#9A8B7C] focus:outline-none focus:ring-1 focus:ring-[#8C6D3B]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#9A8B7C] absolute left-2.5 top-2" />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-[#F2ECE3] pr-1">
                    {guests
                      .filter(
                        (g) =>
                          g.full_name.toLowerCase().includes(guestSearch.toLowerCase()) ||
                          g.email.toLowerCase().includes(guestSearch.toLowerCase()) ||
                          g.mobile.includes(guestSearch)
                      )
                      .map((g) => {
                        const isChecked = selectedGuestIds.includes(g.id);
                        return (
                          <div
                            key={g.id}
                            className="py-2 flex items-center justify-between gap-2 hover:bg-[#FAF8F5] px-1 rounded transition-colors"
                          >
                            <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGuestIds((prev) => [...prev, g.id]);
                                  } else {
                                    setSelectedGuestIds((prev) => prev.filter((id) => id !== g.id));
                                  }
                                }}
                                className="rounded border-[#D4C3B3] text-[#8C6D3B] focus:ring-[#8C6D3B]"
                              />
                              <div className="truncate">
                                <span className="font-medium text-[#2C2420] text-xs block truncate">
                                  {g.full_name}
                                </span>
                                <span className="text-[10px] text-[#8C7A6B] block">
                                  {g.family_group} · {g.mobile || g.email || 'No contact'}
                                </span>
                              </div>
                            </label>

                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                  g.invitation_status === 'SENT'
                                    ? 'bg-[#EAF0F9] text-[#1E5296]'
                                    : 'bg-[#F2ECE3] text-[#7A6A5C]'
                                }`}
                              >
                                {g.invitation_status === 'SENT' ? 'Sent' : 'Unsent'}
                              </span>

                              {/* 1-click WhatsApp preview trigger */}
                              {g.mobile && (
                                <button
                                  type="button"
                                  onClick={() => handleSingleWhatsApp(g)}
                                  className="p-1 text-[#25D366] hover:bg-[#25D366]/10 rounded"
                                  title="Send individual WhatsApp now"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 1-click Email client trigger */}
                              {g.email && (
                                <button
                                  type="button"
                                  onClick={() => handleSingleMailto(g)}
                                  className="p-1 text-[#8C6D3B] hover:bg-[#8C6D3B]/10 rounded"
                                  title="Send individual Email via client"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Channel Information Note */}
              <div className="p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E8DFD5] text-[11px] text-[#7A6A5C]">
                {dispatchChannel === 'WHATSAPP' ? (
                  <p>
                    <strong className="text-[#2C2420]">WhatsApp Sync:</strong> Each guest receives a personalized message with the couple's ceremony details and unique token RSVP link (<code className="text-[#8C6D3B]">/rsvp/:token</code>). Outbound logs and guest statuses are recorded instantly.
                  </p>
                ) : (
                  <p>
                    <strong className="text-[#2C2420]">Email Sync:</strong> Delivers invitation card layout and RSVP buttons. If SMTP is not yet configured in Super Admin settings, real delivery errors are logged with an option to dispatch via your desktop/mobile mail client.
                  </p>
                )}
              </div>

              {/* Confirmation Count */}
              <div className="p-3 bg-[#FAF5EE] border border-[#E0D5C7] rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#6B5E52]">Selected Recipients Count:</span>
                <span className="font-mono font-bold text-[#8C6D3B] text-sm tabular-nums">
                  {targetGuests.length} guest{targetGuests.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 bg-[#EFE8DF] text-[#4A3B32] rounded-xl font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDispatch}
                  disabled={dispatchLoading || targetGuests.length === 0}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {dispatchLoading ? 'Processing...' : `Send to ${targetGuests.length} Guests`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
