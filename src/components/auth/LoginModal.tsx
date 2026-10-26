import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Eye, EyeOff, Lock, Mail, AlertCircle, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always reset fields to empty strings whenever the modal opens to guarantee no prefilled data
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(cleanEmail, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#E0D5C7] rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#8C7A6B] hover:text-[#2C2420] hover:bg-[#F2ECE4] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EFE8DF] text-[#8C6D3B] mb-3 border border-[#D9CDBF]">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#2C2420]">Welcome to Our Wedding Planner</h2>
          <p className="text-xs text-[#7A6A5C] mt-1">
            Sign in with your email and password to access your wedding workspace
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FDF2F0] border border-[#F2C5BD] rounded-xl flex items-start gap-2 text-xs text-[#B43B2A]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          autoComplete="off"
          key={isOpen ? 'modal-opened' : 'modal-closed'}
        >
          {/* Decoy hidden fields to trap aggressive browser password managers from auto-injecting saved credentials */}
          <div
            className="sr-only"
            aria-hidden="true"
            style={{
              position: 'absolute',
              opacity: 0,
              height: 0,
              width: 0,
              zIndex: -1,
              pointerEvents: 'none',
            }}
          >
            <input type="text" name="decoy_email" tabIndex={-1} autoComplete="off" defaultValue="" />
            <input type="password" name="decoy_pwd" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A3B32] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="user_login_email"
                name="voyara_auth_email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                readOnly
                onFocus={(e) => e.target.removeAttribute('readonly')}
                onMouseDown={(e) => (e.target as HTMLElement).removeAttribute('readonly')}
                onTouchStart={(e) => (e.target as HTMLElement).removeAttribute('readonly')}
                autoComplete="off"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] placeholder-[#A89A8D] focus:outline-none focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
              />
              <Mail className="absolute right-3.5 top-3 w-4 h-4 text-[#A89A8D] pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#4A3B32]">Password</label>
              <button
                type="button"
                onClick={() => setError('Please contact VoyaraMedia administrator or request password reset.')}
                className="text-[11px] text-[#8C6D3B] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="user_login_pwd"
                name="voyara_auth_secret"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                readOnly
                onFocus={(e) => e.target.removeAttribute('readonly')}
                onMouseDown={(e) => (e.target as HTMLElement).removeAttribute('readonly')}
                onTouchStart={(e) => (e.target as HTMLElement).removeAttribute('readonly')}
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D8CCBD] rounded-xl text-sm text-[#2C2420] placeholder-[#A89A8D] focus:outline-none focus:ring-2 focus:ring-[#8C6D3B]/40 focus:border-[#8C6D3B]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#A89A8D] hover:text-[#5A4B40]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#8C6D3B] hover:bg-[#785C30] active:bg-[#684F29] text-white text-sm font-medium rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing In...' : 'Sign In with Email'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#E8DFD5] text-center text-xs text-[#7A6A5C]">
          Don't have a wedding workspace yet?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="font-semibold text-[#8C6D3B] hover:underline cursor-pointer"
          >
            Create New Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
