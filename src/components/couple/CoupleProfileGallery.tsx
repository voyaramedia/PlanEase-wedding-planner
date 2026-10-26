import React, { useState } from 'react';
import type { CoupleProfile, GalleryItem } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Heart,
  Camera,
  Edit2,
  Trash2,
  Plus,
  Sparkles,
  Phone,
  Calendar,
  Check,
  User,
} from 'lucide-react';

interface CoupleProfileGalleryProps {
  coupleProfile: CoupleProfile | null;
  gallery: GalleryItem[];
  onRefresh: () => void;
  onProfileUpdated: (updated: CoupleProfile) => void;
}

export const CoupleProfileGallery: React.FC<CoupleProfileGalleryProps> = ({
  coupleProfile,
  gallery,
  onRefresh,
  onProfileUpdated,
}) => {
  const [isEditingGroom, setIsEditingGroom] = useState(false);
  const [isEditingBride, setIsEditingBride] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);

  // Groom Form
  const [groomName, setGroomName] = useState(coupleProfile?.groom_name || '');
  const [groomNickname, setGroomNickname] = useState(coupleProfile?.groom_nickname || '');
  const [groomDob, setGroomDob] = useState(coupleProfile?.groom_dob || '');
  const [groomMobile, setGroomMobile] = useState(coupleProfile?.groom_mobile || '');
  const [groomBio, setGroomBio] = useState(coupleProfile?.groom_bio || '');
  const [groomPhoto, setGroomPhoto] = useState(coupleProfile?.groom_photo || '');

  // Bride Form
  const [brideName, setBrideName] = useState(coupleProfile?.bride_name || '');
  const [brideNickname, setBrideNickname] = useState(coupleProfile?.bride_nickname || '');
  const [brideDob, setBrideDob] = useState(coupleProfile?.bride_dob || '');
  const [brideMobile, setBrideMobile] = useState(coupleProfile?.bride_mobile || '');
  const [brideBio, setBrideBio] = useState(coupleProfile?.bride_bio || '');
  const [bridePhoto, setBridePhoto] = useState(coupleProfile?.bride_photo || '');

  // Gallery Form
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCategory, setPhotoCategory] = useState('Engagement');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (file: File, target: 'groom' | 'bride' | 'gallery') => {
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      if (target === 'groom') {
        setGroomPhoto(res.url);
      } else if (target === 'bride') {
        setBridePhoto(res.url);
      } else {
        setPhotoUrl(res.url);
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveGroom = async () => {
    try {
      const updated = await api.updateCoupleProfile({
        groom_name: groomName,
        groom_nickname: groomNickname,
        groom_dob: groomDob,
        groom_mobile: groomMobile,
        groom_bio: groomBio,
        groom_photo: groomPhoto,
      });
      setIsEditingGroom(false);
      onProfileUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update groom profile.');
    }
  };

  const saveBride = async () => {
    try {
      const updated = await api.updateCoupleProfile({
        bride_name: brideName,
        bride_nickname: brideNickname,
        bride_dob: brideDob,
        bride_mobile: brideMobile,
        bride_bio: brideBio,
        bride_photo: bridePhoto,
      });
      setIsEditingBride(false);
      onProfileUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update bride profile.');
    }
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      alert('Please select or upload a photo.');
      return;
    }

    try {
      await api.addGalleryItem({
        title: photoTitle.trim() || 'Wedding Festivities',
        category: photoCategory,
        image_url: photoUrl,
      });
      setIsAddPhotoOpen(false);
      setPhotoTitle('');
      setPhotoUrl('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to save gallery photo.');
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (confirm('Delete this photo from memory gallery?')) {
      await api.deleteGalleryItem(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD5]">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">Couple Profiles &amp; Gallery</h2>
          <p className="text-xs text-[#7A6A5C] mt-0.5">
            Personal profiles for the couple and visual keepsake album
          </p>
        </div>

        <button
          onClick={() => setIsAddPhotoOpen(true)}
          className="px-4 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Memory Photo
        </button>
      </div>

      {/* Side-by-Side Couple Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Groom Profile */}
        <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] tracking-wider">
                The Groom
              </span>
              {coupleProfile?.groom_nickname && (
                <span className="text-xs text-[#8C7A6B]">"{coupleProfile.groom_nickname}"</span>
              )}
            </div>

            <button
              onClick={() => setIsEditingGroom(!isEditingGroom)}
              className="text-xs text-[#8C6D3B] hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {isEditingGroom ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Groom Photo */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-[#E0D5C7] bg-[#FAF5EE] shadow-inner">
                {groomPhoto ? (
                  <img
                    src={groomPhoto}
                    alt={groomName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D4C3B3]">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              {isEditingGroom && (
                <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'groom')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              {isEditingGroom ? (
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    placeholder="Groom's Full Name"
                    className="w-full px-3 py-1.5 border border-[#D8CCBD] rounded-lg font-serif font-semibold text-sm"
                  />
                  <input
                    type="text"
                    value={groomNickname}
                    onChange={(e) => setGroomNickname(e.target.value)}
                    placeholder="Nickname (optional)"
                    className="w-full px-3 py-1.5 border border-[#D8CCBD] rounded-lg"
                  />
                  <input
                    type="tel"
                    value={groomMobile}
                    onChange={(e) => setGroomMobile(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full px-3 py-1.5 border border-[#D8CCBD] rounded-lg"
                  />
                  <textarea
                    rows={2}
                    value={groomBio}
                    onChange={(e) => setGroomBio(e.target.value)}
                    placeholder="Short biography / background"
                    className="w-full px-3 py-1.5 border border-[#D8CCBD] rounded-lg"
                  />
                  <button
                    onClick={saveGroom}
                    className="px-4 py-1.5 bg-[#8C6D3B] text-white rounded-lg font-medium text-xs shadow-2xs"
                  >
                    Save Groom Details
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-serif text-2xl font-semibold text-[#2C2420]">
                    {coupleProfile?.groom_name || 'Groom'}
                  </h3>
                  {coupleProfile?.groom_mobile && (
                    <p className="text-xs text-[#7A6A5C] flex items-center justify-center sm:justify-start gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#9A8B7C]" />
                      {coupleProfile.groom_mobile}
                    </p>
                  )}
                  <p className="text-xs text-[#6B5E52] leading-relaxed pt-1">
                    {coupleProfile?.groom_bio || 'No biography recorded yet.'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bride Profile */}
        <div className="p-6 bg-white border border-[#E8DFD5] rounded-3xl shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-[#8C6D3B] tracking-wider">
                The Bride
              </span>
              {coupleProfile?.bride_nickname && (
                <span className="text-xs text-[#8C7A6B]">"{coupleProfile.bride_nickname}"</span>
              )}
            </div>

            <button
              onClick={() => setIsEditingBride(!isEditingBride)}
              className="text-xs text-[#8C6D3B] hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {isEditingBride ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Bride Photo */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-[#E0D5C7] bg-[#FAF5EE] shadow-inner">
                {bridePhoto ? (
                  <img
                    src={bridePhoto}
                    alt={brideName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D4C3B3]">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              {isEditingBride && (
                <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'bride')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              {isEditingBride ? (
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    placeholder="Bride's Full Name"
                    className="w-full px-3 py-1.5 border border-[#D8CCBD] rounded-lg font-serif font-semibold text-sm"
                  />
                  <input
                    type="text"
                    value={brideNickname}
                    onChange={(e) => setBrideNickname(e.target.value)}
                    placeholder="Nickname (optional)"
                    className="w-full px-3 py-1.5 border border-[#D8CCBD] rounded-lg"
                  />
                  <input
                    type="tel"
                    value={brideMobile}
                    onChange={(e) => setBrideMobile(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full px-3 py-1.5 border border-[#D8CCBD] rounded-lg"
                  />
                  <textarea
                    rows={2}
                    value={brideBio}
                    onChange={(e) => setBrideBio(e.target.value)}
                    placeholder="Short biography / background"
                    className="w-full px-3 py-1.5 border border-[#D8CCBD] rounded-lg"
                  />
                  <button
                    onClick={saveBride}
                    className="px-4 py-1.5 bg-[#8C6D3B] text-white rounded-lg font-medium text-xs shadow-2xs"
                  >
                    Save Bride Details
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-serif text-2xl font-semibold text-[#2C2420]">
                    {coupleProfile?.bride_name || 'Bride'}
                  </h3>
                  {coupleProfile?.bride_mobile && (
                    <p className="text-xs text-[#7A6A5C] flex items-center justify-center sm:justify-start gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#9A8B7C]" />
                      {coupleProfile.bride_mobile}
                    </p>
                  )}
                  <p className="text-xs text-[#6B5E52] leading-relaxed pt-1">
                    {coupleProfile?.bride_bio || 'No biography recorded yet.'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keepsake Album Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#2C2420]">
              Engagement &amp; Wedding Keepsake Gallery
            </h3>
            <p className="text-xs text-[#7A6A5C] mt-0.5">
              Cherished memories, ceremony captures, and venue styling
            </p>
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="bg-white border border-[#E8DFD5] rounded-3xl p-12 text-center text-xs text-[#8C7A6B]">
            <Sparkles className="w-8 h-8 text-[#D4C3B3] mx-auto mb-3" />
            <p className="font-serif text-base font-medium text-[#2C2420]">
              No photographs added to gallery yet
            </p>
            <p className="mt-1">
              Upload pre-wedding shoots, venue layouts, ring ceremonies, and candid portraits.
            </p>
            <button
              onClick={() => setIsAddPhotoOpen(true)}
              className="mt-4 px-4 py-2 bg-[#8C6D3B] text-white rounded-xl font-medium"
            >
              Add First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-[#E8DFD5] bg-[#FAF5EE] shadow-2xs"
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteGallery(item.id)}
                      className="p-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-white"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/80 uppercase tracking-wider block font-medium">
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold truncate block">{item.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8">
            <h3 className="font-serif text-xl font-semibold text-[#2C2420] mb-4">
              Add Photograph to Keepsake Gallery
            </h3>

            <form onSubmit={handleAddGalleryItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Photo Title</label>
                <input
                  type="text"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  placeholder="e.g. Ring Exchange at Sunset"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Occasion / Category</label>
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420]"
                >
                  <option value="Engagement">Engagement Ceremony</option>
                  <option value="Wedding">Wedding Rituals</option>
                  <option value="Sangeet">Sangeet &amp; Dance</option>
                  <option value="Mehndi">Mehndi &amp; Haldi</option>
                  <option value="Reception">Grand Reception</option>
                  <option value="Pre-Wedding">Pre-Wedding Shoot</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#4A3B32] mb-1">Upload Photo File</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'gallery')}
                  className="text-xs text-[#7A6A5C] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#EFE8DF] file:text-[#4A3B32]"
                />
                {uploading && <p className="text-xs text-[#8C6D3B] mt-1">Uploading image...</p>}
                {photoUrl && <p className="text-xs text-[#2D7A4D] mt-1">Photo uploaded successfully ✓</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(false)}
                  className="px-4 py-2 bg-[#EFE8DF] text-[#4A3B32] rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !photoUrl}
                  className="px-5 py-2 bg-[#8C6D3B] hover:bg-[#785C30] text-white rounded-xl font-medium disabled:opacity-50"
                >
                  Add to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
