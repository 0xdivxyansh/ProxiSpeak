import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/user';
import type { UserProfile } from '../../api/user';
import { X, User, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      setError(null);
      setSuccess(false);

      userApi
        .getMe()
        .then((p) => {
          setProfile(p);
          setDisplayName(p.displayName);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to fetch profile';
          setError(msg);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await userApi.updateMe({ displayName: displayName.trim() });
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">User Profile</h3>
              <p className="text-xs text-gray-500">Manage your ProxiSpeak explorer identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {/* Readonly UID & Status */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">
                  Firebase UID
                </span>
                <span className="font-mono text-gray-700 truncate block font-medium">
                  {profile?.uid || user?.uid}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Status</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {profile?.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Editable Display Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your explorer display name"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
