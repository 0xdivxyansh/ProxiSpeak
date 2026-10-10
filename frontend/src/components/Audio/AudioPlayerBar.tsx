import React from 'react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Radio,
  MapPin,
  Loader2,
} from 'lucide-react';

export const AudioPlayerBar: React.FC = () => {
  const {
    currentAudio,
    isPlaying,
    loading,
    currentTime,
    duration,
    volume,
    error,
    togglePlayPause,
    seek,
    changeVolume,
    closePlayer,
  } = useAudioPlayer();

  if (!currentAudio) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[94%] bg-gray-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-gray-700/60 p-3.5 transition-all animate-in slide-in-from-bottom-5">
      {/* Progress slider bar */}
      <div className="relative w-full group mb-2.5">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          disabled={loading || duration === 0}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-1.5 transition-all"
        />
        <div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Left: Metadata info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0 text-purple-400">
            <Radio className={`w-5 h-5 ${isPlaying ? 'animate-pulse text-purple-300' : ''}`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate text-gray-100">{currentAudio.title}</h4>
              <span className="flex-shrink-0 text-[10px] font-medium bg-purple-900/60 text-purple-300 border border-purple-700/50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {formatDistance(currentAudio.distanceMeters)}
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate">
              Recorded by {currentAudio.owner.displayName}
            </p>
          </div>
        </div>

        {/* Center: Play/Pause controls */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            onClick={togglePlayPause}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Right: Volume & Close */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => changeVolume(volume === 0 ? 0.8 : 0)}
              className="text-gray-400 hover:text-white p-1"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          <button
            onClick={closePlayer}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-900/50 px-2.5 py-1 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};
