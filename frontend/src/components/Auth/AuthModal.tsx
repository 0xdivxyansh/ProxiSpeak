import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Sparkles, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, signUpWithEmail, signInWithDemo } = useAuth();

  const [mode, setMode] = useState<'demo' | 'login' | 'register'>('demo');
  const [demoName, setDemoName] = useState('UrbanExplorer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName.trim()) return;
    signInWithDemo(demoName.trim());
    onClose();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      onClose();
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('auth/configuration-not-found') || msg.includes('configuration-not-found')) {
        msg = 'Firebase Authentication is not yet enabled in your Firebase Console. Go to console.firebase.google.com -> Build -> Authentication -> "Get Started" -> Enable "Email/Password". Or click the "Quick Test Account" tab above to test immediately!';
      } else if (msg.includes('auth/operation-not-allowed')) {
        msg = 'Email/Password sign-in provider is disabled. Please enable it in Firebase Console -> Authentication -> Sign-in method.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please switch to Email Login.';
      } else if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
        msg = 'Incorrect email or password.';
      } else if (msg.includes('auth/user-not-found')) {
        msg = 'No user account found with this email. Please click "Register" to create one.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters.';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sign In to ProxiSpeak</h3>
            <p className="text-xs text-gray-500">Record, upload, and manage geo-anchored sounds</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex p-1 bg-gray-100 rounded-xl mt-4 text-xs font-semibold">
          <button
            onClick={() => {
              setMode('demo');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'demo' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Quick Test Account</span>
          </button>
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Email Login</span>
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode A: Instant Demo / Test Mode */}
        {mode === 'demo' && (
          <form onSubmit={handleDemoSubmit} className="mt-4 space-y-4">
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-xs text-purple-900 leading-relaxed">
              <span className="font-semibold block mb-0.5">Instant Test Mode</span>
              Sign in with any nickname to instantly test audio recording, upload pipelines, and metadata updates without needing Firebase client API keys!
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Your Explorer Nickname
              </label>
              <input
                type="text"
                required
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                placeholder="e.g. SonicVoyager"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              Continue as {demoName || 'Explorer'}
            </button>
          </form>
        )}

        {/* Mode B: Real Firebase Email Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alice Soundscape"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
