import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const ForcePasswordChangeModal: React.FC = () => {
  const { user, refreshMe, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user?.must_change_password) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      setTimeout(async () => {
        await refreshMe();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFF3E8] text-[#C46A28] mb-3 border border-[#F2D0B6]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">Password Update Required</h2>
          <p className="text-xs text-[#7A6A5C] mt-1.5 leading-relaxed">
            For security compliance, you must set a new personal password before accessing administrative features or workspace management.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#F2C5BD] rounded-xl flex items-start gap-2 text-xs text-[#B43B2A]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-[#EDF8F2] border border-[#BCE4CD] rounded-xl flex items-center gap-3 text-sm text-[#1B6E44]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Password updated successfully! Unlocking your dashboard...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                Current / Initial Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#4A3B32]">New Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#8C6D3B] flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars (letters, numbers)"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={logout}
                className="w-1/3 py-2.5 px-4 bg-[#EFE8DF] hover:bg-[#E5DBCF] text-[#4A3B32] text-xs font-medium rounded-xl transition-colors"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 px-4 bg-[#8C6D3B] hover:bg-[#785C30] text-white text-xs font-medium rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Set New Password & Continue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
