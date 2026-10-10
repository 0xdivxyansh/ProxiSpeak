import React, { useState } from 'react';
import type { NearbyAudioItem } from '../../api/audio';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import {
  Search,
  Play,
  Pause,
  MapPin,
  Clock,
  Radio,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface AudioListSidebarProps {
  audioItems: NearbyAudioItem[];
  radiusMeters: number;
  loading: boolean;
  onSelectAudioMarker: (audio: NearbyAudioItem) => void;
}

export const AudioListSidebar: React.FC<AudioListSidebarProps> = ({
  audioItems,
  radiusMeters,
  loading,
  onSelectAudioMarker,
}) => {
  const { currentAudio, isPlaying, playAudio, togglePlayPause } = useAudioPlayer();

  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = audioItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-20 right-4 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-gray-100 text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <Radio className="w-4 h-4 text-purple-600" />
          <span>Sounds ({audioItems.length})</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Sidebar drawer */}
      {isOpen && (
        <aside className="absolute top-20 right-4 bottom-24 z-20 w-80 md:w-96 max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all animate-in slide-in-from-right-5">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Nearby Soundscapes</h3>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {audioItems.length} found
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Within {radiusMeters < 1000 ? `${radiusMeters}m` : `${radiusMeters / 1000}km`} radius
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-gray-50 flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by title, description or author..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* List items */}
          <div className="overflow-y-auto flex-1 p-3 space-y-2.5">
            {loading ? (
              <div className="py-16 text-center text-xs text-gray-400">
                <Radio className="w-8 h-8 mx-auto text-purple-400 animate-pulse mb-2" />
                <span>Scanning acoustic frequencies nearby...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400">
                <MapPin className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p>No audio recordings found within this radius.</p>
                <p className="text-purple-600 mt-1 font-medium">
                  Try expanding the search radius slider or drop the first sound!
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isCurrentlyActive = currentAudio?.id === item.id;
                const isCurrentlyPlaying = isCurrentlyActive && isPlaying;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectAudioMarker(item)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isCurrentlyActive
                        ? 'bg-purple-50/80 border-purple-300 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-purple-200 hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full">
                            {formatDistance(item.distanceMeters)}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-gray-900 truncate">{item.title}</h4>

                        {item.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}

                        <span className="text-[10px] text-gray-400 block mt-1">
                          By <span className="text-gray-700 font-medium">{item.owner.displayName}</span>
                        </span>
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrentlyActive) {
                            togglePlayPause();
                          } else {
                            playAudio(item);
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCurrentlyActive
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}
    </>
  );
};
