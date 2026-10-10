import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { audioApi } from '../../api/audio';
import type { NearbyAudioItem } from '../../api/audio';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import {
  X,
  Trash2,
  Edit2,
  Play,
  Pause,
  Music,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface MyRecordingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: NearbyAudioItem[];
  onRefresh: () => void;
}

export const MyRecordingsModal: React.FC<MyRecordingsModalProps> = ({
  isOpen,
  onClose,
  recordings,
  onRefresh,
}) => {
  const { user } = useAuth();
  const { currentAudio, isPlaying, playAudio, togglePlayPause } = useAudioPlayer();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter recordings owned by the active user
  const myRecordings = recordings.filter((r) => r.owner.uid === user?.uid);

  const startEdit = (rec: NearbyAudioItem) => {
    setEditingId(rec.id);
    setEditTitle(rec.title);
    setEditDesc(rec.description || '');
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    setLoadingAction(id);
    setError(null);

    try {
      await audioApi.update(id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
      setEditingId(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update audio';
      setError(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this audio recording?')) return;

    setLoadingAction(id);
    setError(null);

    try {
      await audioApi.delete(id);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete audio';
      setError(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">My Uploaded Audio Recordings</h3>
            <p className="text-xs text-gray-500">
              Manage your geo-anchored sounds ({myRecordings.length} found)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* List of recordings */}
        <div className="overflow-y-auto mt-4 space-y-3 pr-1 flex-1">
          {myRecordings.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Music className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p>You haven&apos;t uploaded any audio recordings in this area yet.</p>
              <p className="mt-1 text-purple-600 font-medium">
                Click &quot;Drop Sound&quot; on the top bar to record your first sound!
              </p>
            </div>
          ) : (
            myRecordings.map((rec) => {
              const isEditing = editingId === rec.id;
              const isCurrentlyPlaying = currentAudio?.id === rec.id && isPlaying;
              const isActionLoading = loadingAction === rec.id;

              return (
                <div
                  key={rec.id}
                  className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col gap-2 hover:border-purple-200 transition-all"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-purple-300 focus:outline-none"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-purple-300 focus:outline-none resize-none"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded-lg text-xs text-gray-600 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(rec.id)}
                          disabled={isActionLoading}
                          className="px-3 py-1 rounded-lg text-xs bg-purple-600 text-white font-medium hover:bg-purple-700 flex items-center gap-1"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-gray-900 truncate">
                            {rec.title}
                          </h4>
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full">
                            {Math.round(rec.distanceMeters)}m
                          </span>
                        </div>
                        {rec.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {rec.description}
                          </p>
                        )}
                        <span className="text-[10px] text-gray-400 block mt-1">
                          Created {new Date(rec.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Play button */}
                        <button
                          onClick={() => {
                            if (currentAudio?.id === rec.id) {
                              togglePlayPause();
                            } else {
                              playAudio(rec);
                            }
                          }}
                          className="w-7 h-7 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center justify-center transition-colors"
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                          )}
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => startEdit(rec)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(rec.id)}
                          disabled={isActionLoading}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
