import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithDemo } = useAuth();

  const [demoName, setDemoName] = useState('UrbanExplorer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Google authentication failed';
      if (msg.includes('auth/configuration-not-found') || msg.includes('configuration-not-found')) {
        msg =
          'Firebase Authentication is not yet enabled in your Firebase Console. Go to console.firebase.google.com -> Build -> Authentication -> "Get Started" -> Enable "Google". Or use the Quick Test Explorer below to test immediately!';
      } else if (msg.includes('auth/operation-not-allowed')) {
        msg =
          'Google Sign-In is not enabled in Firebase Console. Go to console.firebase.google.com -> Authentication -> Sign-in method -> "Google" -> toggle "Enable" and Save.';
      } else if (msg.includes('auth/popup-closed-by-user')) {
        msg = 'Sign-in popup was closed before completing.';
      } else if (msg.includes('auth/popup-blocked')) {
        msg = 'Sign-in popup was blocked by browser. Please allow popups for localhost.';
      } else if (msg.includes('auth/unauthorized-domain')) {
        msg =
          'Domain not authorized. Add "localhost" under Firebase Console -> Authentication -> Settings -> Authorized Domains.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim()) return;
    signInWithDemo(demoName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Welcome to ProxiSpeak</h3>
              <p className="text-xs text-gray-500">Record, explore & discover proximity audio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 text-amber-900 text-xs border border-amber-200/80 leading-relaxed">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action: Google Sign-in */}
        <div className="mt-6 space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm py-3 px-4 rounded-2xl border border-gray-300 shadow-sm hover:shadow transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-[11px] text-gray-400">
            One-click sign in. No separate login or registration needed.
          </p>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-gray-400">
              or instant test explorer
            </span>
          </div>

          {/* Instant Explorer Quick Mode */}
          <form onSubmit={handleDemoSubmit} className="space-y-3 bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
            <div>
              <label className="block text-xs font-semibold text-purple-900 mb-1">
                Explorer Nickname
              </label>
              <input
                type="text"
                required
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                placeholder="e.g. SonicVoyager"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-purple-500/10 transition-all active:scale-[0.98] cursor-pointer"
            >
              Start Exploring as {demoName.trim() || 'Explorer'}
            </button>
            <p className="text-[10.5px] text-purple-700/80 text-center leading-tight">
              Test microphone recording, geo-tagging, and audio playback immediately.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
