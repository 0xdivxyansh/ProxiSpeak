import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { audioApi } from '../api/audio';
import type { NearbyAudioItem } from '../api/audio';

interface AudioPlayerContextType {
  currentAudio: NearbyAudioItem | null;
  isPlaying: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
  playAudio: (audio: NearbyAudioItem) => Promise<void>;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  changeVolume: (volume: number) => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAudio, setCurrentAudio] = useState<NearbyAudioItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setLoading(false);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = () => {
      const mediaErr = audio.error;
      const detail = mediaErr ? ` (${mediaErr.message || 'code ' + mediaErr.code})` : '';
      setError(`Failed to play audio stream${detail}`);
      setLoading(false);
      setIsPlaying(false);
    };
    const onPlaying = () => {
      setIsPlaying(true);
      setLoading(false);
    };
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.src = '';
    };
  }, []);

  const playAudio = async (item: NearbyAudioItem) => {
    if (!audioRef.current) return;
    setError(null);
    setCurrentAudio(item);
    setLoading(true);

    try {
      // Fetch signed playback URL from backend
      const playbackData = await audioApi.getPlayback(item.id);
      let streamUrl = playbackData.playbackUrl;

      // When running in the browser and the playback URL points to the backend /api/... path,
      // convert to a relative path so it routes through the same-origin reverse proxy
      if (typeof window !== 'undefined' && streamUrl.startsWith('http')) {
        try {
          const parsed = new URL(streamUrl);
          if (parsed.pathname.startsWith('/api/')) {
            streamUrl = `${parsed.pathname}${parsed.search}`;
          }
        } catch {
          // Keep original absolute URL
        }
      }

      audioRef.current.src = streamUrl;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting playback';
      setError(msg);
      setLoading(false);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => setError(e.message));
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const changeVolume = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentAudio(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentAudio,
        isPlaying,
        loading,
        currentTime,
        duration,
        volume,
        error,
        playAudio,
        togglePlayPause,
        seek,
        changeVolume,
        closePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
