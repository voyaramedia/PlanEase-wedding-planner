import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Heart, AlertCircle, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onRegisteredSuccess?: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onRegisteredSuccess,
}) => {
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 Fields
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingVenue, setWeddingVenue] = useState('');
  const [engagementDate, setEngagementDate] = useState('');
  const [engagementVenue, setEngagementVenue] = useState('');
  const [currency, setCurrency] = useState('INR');

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !mobile || !email || !password) {
      setError('Please fill in all required user account fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groomName && !brideName) {
      setError('Please provide at least the Groom and Bride names.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        full_name: fullName,
        mobile,
        email,
        password,
        confirm_password: confirmPassword,
        workspace_name: workspaceName,
        groom_name: groomName,
        bride_name: brideName,
        wedding_date: weddingDate || undefined,
        engagement_date: engagementDate || undefined,
        venues: {
          wedding: weddingVenue,
          engagement: engagementVenue,
        },
        currency,
      });

      onClose();
      if (onRegisteredSuccess) {
        onRegisteredSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] hover:bg-[#F2ECE4] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EFE8DF] text-[#8C6D3B] mb-2 border border-[#D9CDBF]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">Create Your Wedding Workspace</h2>
          <p className="text-xs text-[#7A6A5C] mt-1">
            {step === 1 ? 'Step 1 of 2: Administrator & Account Details' : 'Step 2 of 2: Couple & Celebration Setup'}
          </p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <span className={`w-8 h-1 rounded-full ${step === 1 ? 'bg-[#8C6D3B]' : 'bg-[#D4C3B3]'}`} />
            <span className={`w-8 h-1 rounded-full ${step === 2 ? 'bg-[#8C6D3B]' : 'bg-[#D4C3B3]'}`} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#F2C5BD] rounded-xl flex items-start gap-2 text-xs text-[#B43B2A]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                Your Full Name <span className="text-[#B43B2A]">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Mayur Deshmukh"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Mobile Number <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Email Address <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="couple@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Password <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Confirm Password <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#8C6D3B] hover:bg-[#785C30] active:bg-[#684F29] text-white text-sm font-medium rounded-xl shadow-xs transition-colors mt-2"
            >
              Continue to Couple Details
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Groom's Full Name <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="e.g. Siddharth Malhotra"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Bride's Full Name <span className="text-[#B43B2A]">*</span>
                </label>
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="e.g. Kiara Advani"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                Workspace Name (Optional)
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={groomName && brideName ? `${groomName} & ${brideName}'s Wedding` : "e.g. The Royal Wedding 2026"}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Wedding Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Wedding Venue (Optional)
                </label>
                <input
                  type="text"
                  value={weddingVenue}
                  onChange={(e) => setWeddingVenue(e.target.value)}
                  placeholder="e.g. Suryagarh Palace, Jaisalmer"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Engagement Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={engagementDate}
                  onChange={(e) => setEngagementDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3B32] mb-1">
                  Engagement Venue (Optional)
                </label>
                <input
                  type="text"
                  value={engagementVenue}
                  onChange={(e) => setEngagementVenue(e.target.value)}
                  placeholder="e.g. Grand Heritage Hall, Mumbai"
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CCBD] rounded-xl text-xs text-[#2C2420] focus:ring-2 focus:ring-[#8C6D3B]/40"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 px-4 bg-[#EFE8DF] hover:bg-[#E5DBCF] text-[#4A3B32] text-sm font-medium rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 px-4 bg-[#8C6D3B] hover:bg-[#785C30] active:bg-[#684F29] text-white text-sm font-medium rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Workspace...' : 'Create Wedding Workspace'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-[#E8DFD5] text-center text-xs text-[#7A6A5C]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToLogin();
            }}
            className="font-semibold text-[#8C6D3B] hover:underline"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};
