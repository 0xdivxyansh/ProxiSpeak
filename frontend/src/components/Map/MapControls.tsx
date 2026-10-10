import React from 'react';
import { Navigation, Sliders, RefreshCw, MapPin } from 'lucide-react';

interface MapControlsProps {
  radiusMeters: number;
  onRadiusChange: (newRadius: number) => void;
  onLocateMe: () => void;
  onRefresh: () => void;
  selectedPin: [number, number] | null;
  onClearPin: () => void;
  loading: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  radiusMeters,
  onRadiusChange,
  onLocateMe,
  onRefresh,
  selectedPin,
  onClearPin,
  loading,
}) => {
  const formatRadiusLabel = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const radiusPresets = [1000, 3000, 5000, 10000, 25000];

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-100 pointer-events-auto transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Search Radius:</span>
            <span className="text-purple-600 font-bold">{formatRadiusLabel(radiusMeters)}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh nearby audio"
            className="p-1 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>

        {/* Range slider */}
        <input
          type="range"
          min="500"
          max="50000"
          step="500"
          value={radiusMeters}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />

        {/* Quick presets */}
        <div className="flex items-center justify-between gap-1 mt-2.5">
          {radiusPresets.map((r) => (
            <button
              key={r}
              onClick={() => onRadiusChange(r)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded-full transition-all ${
                radiusMeters === r
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {formatRadiusLabel(r)}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onLocateMe}
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-100 text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-600 fill-current" />
          <span>My GPS</span>
        </button>

        {selectedPin && (
          <button
            onClick={onClearPin}
            className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-red-100 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>Clear Pin</span>
          </button>
        )}
      </div>
    </div>
  );
};
