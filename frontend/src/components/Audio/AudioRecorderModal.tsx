import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { audioApi } from '../../api/audio';
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCoordinates: [number, number];
  onUploadSuccess: () => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  defaultCoordinates,
  onUploadSuccess,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [lat, setLat] = useState(defaultCoordinates[0]);
  const [lng, setLng] = useState(defaultCoordinates[1]);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLat(defaultCoordinates[0]);
    setLng(defaultCoordinates[1]);
  }, [defaultCoordinates]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  // Start in-browser microphone recording
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setAudioBlob(null);
      setAudioFile(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(recordedBlob);
        const url = URL.createObjectURL(recordedBlob);
        setAudioUrl(url);

        // Stop all tracks to release mic hardware
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not access microphone';
      setErrorMessage(`Microphone access error: ${msg}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Audio file size exceeds 10MB limit.');
      return;
    }

    setAudioFile(file);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  const togglePreview = () => {
    if (!audioUrl) return;
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  // Execute full 3-step upload pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Please sign in or use a demo account to upload audio recordings.');
      return;
    }

    const payloadBlob = audioFile || audioBlob;
    if (!payloadBlob) {
      setErrorMessage('Please record audio or upload an audio file first.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress(0);

      // Step 1: Initiate session on backend
      setUploadStatusText('1/3 Creating upload session...');
      const declaredMimeType = payloadBlob.type || 'audio/mpeg';
      const declaredSizeBytes = payloadBlob.size;

      const session = await audioApi.createUploadSession({
        title,
        description,
        latitude: lat,
        longitude: lng,
        visibility,
        declaredMimeType,
        declaredSizeBytes,
      });

      // Step 2: Binary PUT directly to Google Cloud Storage
      setUploadStatusText('2/3 Uploading audio to Cloud Storage...');
      await audioApi.uploadBinary(session.uploadUrl, payloadBlob, declaredMimeType, (pct) => {
        setUploadProgress(pct);
      });

      // Step 3: Complete and publish on backend
      setUploadStatusText('3/3 Verifying and publishing recording...');
      await audioApi.completeUpload(session.audioId);

      setSuccess(true);
      setIsUploading(false);
      onUploadSuccess();

      setTimeout(() => {
        onClose();
        // Reset state
        setTitle('');
        setDescription('');
        setAudioBlob(null);
        setAudioFile(null);
        setSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorMessage(msg);
      setIsUploading(false);
    }
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Drop a Proximity Sound</h3>
            <p className="text-xs text-gray-500">Record live ambience or upload an audio file</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
            <h4 className="text-lg font-bold text-gray-900 mt-3">Published Successfully!</h4>
            <p className="text-xs text-gray-500 mt-1">Your sound is now discoverable on the map.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Audio Capture Section */}
            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4">
              <label className="block text-xs font-semibold text-purple-950 mb-2">
                1. Capture or Select Audio
              </label>

              <div className="flex items-center gap-3">
                {/* Mic Record Button */}
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Record Mic</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop ({formatTimer(recordDuration)})</span>
                  </button>
                )}

                <span className="text-xs text-gray-400 font-semibold">OR</span>

                {/* File Upload Selector */}
                <label className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-sm transition-all">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span className="truncate">
                    {audioFile ? audioFile.name : 'Choose File'}
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Audio Preview if available */}
              {audioUrl && (
                <div className="mt-3 pt-3 border-t border-purple-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePreview}
                      className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700"
                    >
                      {isPlayingPreview ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                    <span className="text-xs text-purple-900 font-medium">
                      Audio Ready (
                      {audioBlob
                        ? `${Math.round(audioBlob.size / 1024)} KB`
                        : audioFile
                          ? `${Math.round(audioFile.size / 1024)} KB`
                          : ''}
                      )
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Ready
                  </span>
                </div>
              )}
            </div>

            {/* Metadata inputs */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sound Title *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Portsmouth Square Morning Ambience"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                maxLength={500}
                rows={2}
                placeholder="Describe what people will hear at this location..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 resize-none"
              />
            </div>

            {/* Coordinates and Visibility */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-600" /> Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-600" /> Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private' | 'unlisted')}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white"
              >
                <option value="public">Public (Discoverable by anyone nearby)</option>
                <option value="unlisted">Unlisted (Direct link playback only)</option>
                <option value="private">Private (Only you can discover and play)</option>
              </select>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Upload Progress Status */}
            {isUploading && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-purple-900 font-medium">
                  <span>{uploadStatusText}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isUploading || isRecording || (!audioBlob && !audioFile)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Sound...</span>
                  </>
                ) : (
                  <span>Publish to Location</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
