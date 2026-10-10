import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { healthApi } from '../api/health';
import {
  Radio,
  PlusCircle,
  User,
  Music,
  LogOut,
  LogIn,
  Activity,
} from 'lucide-react';

interface NavbarProps {
  discoveredCount: number;
  onOpenRecord: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenMyRecordings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  discoveredCount,
  onOpenRecord,
  onOpenAuth,
  onOpenProfile,
  onOpenMyRecordings,
}) => {
  const { user, signOut } = useAuth();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    healthApi
      .getHealth()
      .then((res) => setIsBackendHealthy(res.status === 'healthy'))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  return (
    <header className="h-16 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 flex items-center justify-between z-30 shadow-xs">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-gray-900 leading-none">
              ProxiSpeak
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
              Soundscapes
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">
            Geospatial Proximity Audio Discovery
          </p>
        </div>
      </div>

      {/* Center status info */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Backend status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs">
          <Activity
            className={`w-3.5 h-3.5 ${
              isBackendHealthy === true
                ? 'text-emerald-500'
                : isBackendHealthy === false
                  ? 'text-red-500'
                  : 'text-amber-500 animate-spin'
            }`}
          />
          <span className="text-gray-600 font-medium">
            API:{' '}
            {isBackendHealthy === true
              ? 'Online'
              : isBackendHealthy === false
                ? 'Offline'
                : 'Connecting...'}
          </span>
        </div>

        {/* Discovery Counter */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>Discovered:</span>
          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
            {discoveredCount} audio pins
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5">
        {/* Drop sound button */}
        <button
          onClick={onOpenRecord}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-md shadow-purple-600/20 active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Drop Sound</span>
        </button>

        {user ? (
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2.5">
            {/* My Sounds Button */}
            <button
              onClick={onOpenMyRecordings}
              title="My Uploaded Sounds"
              className="p-2 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Music className="w-4 h-4" />
            </button>

            {/* Profile Button */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                {user.displayName?.charAt(0).toUpperCase() || <User className="w-3 h-3" />}
              </div>
              <span className="max-w-[100px] truncate hidden md:inline">{user.displayName}</span>
            </button>

            {/* Sign Out */}
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 px-3.5 py-2 rounded-xl transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
