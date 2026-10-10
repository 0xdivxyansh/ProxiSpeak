import React from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { NearbyAudioItem } from '../../api/audio';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import {
  userLocationIcon,
  audioPinIcon,
  activePlayingIcon,
  dropPinIcon,
} from './CustomMarkers';
import { Play, Pause, MapPin } from 'lucide-react';

interface ProxiMapProps {
  userPosition: [number, number];
  searchRadiusMeters: number;
  audioItems: NearbyAudioItem[];
  selectedPin: [number, number] | null;
  onMapClick: (coords: [number, number]) => void;
}

// Controller component to dynamically pan/zoom map when userPosition changes
const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    map.panTo(center, { animate: true });
  }, [center, map]);
  return null;
};

// Map click listener component
const MapClickHandler: React.FC<{ onClick: (coords: [number, number]) => void }> = ({
  onClick,
}) => {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

export const ProxiMap: React.FC<ProxiMapProps> = ({
  userPosition,
  searchRadiusMeters,
  audioItems,
  selectedPin,
  onMapClick,
}) => {
  const { currentAudio, isPlaying, playAudio, togglePlayPause } = useAudioPlayer();

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={userPosition as LatLngExpression}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={userPosition} />
        <MapClickHandler onClick={onMapClick} />

        {/* User Current Position Marker */}
        <Marker position={userPosition as LatLngExpression} icon={userLocationIcon}>
          <Popup>
            <div className="p-1 font-sans text-xs">
              <span className="font-semibold text-blue-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Your Center Location
              </span>
              <p className="text-gray-500 mt-1">
                {userPosition[0].toFixed(4)}, {userPosition[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Search Radius Visual Boundary Circle */}
        <Circle
          center={userPosition as LatLngExpression}
          radius={searchRadiusMeters}
          pathOptions={{
            color: '#8b5cf6',
            fillColor: '#8b5cf6',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 6',
          }}
        />

        {/* Selected Dropped Pin for Audio Creation */}
        {selectedPin && (
          <Marker position={selectedPin as LatLngExpression} icon={dropPinIcon}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <span className="font-semibold text-red-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Selected Audio Location
                </span>
                <p className="text-gray-500 mt-0.5">Click &quot;Drop Sound&quot; to record or upload here!</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Discovered Nearby Audio Markers */}
        {audioItems.map((audio) => {
          const isCurrentlyActive = currentAudio?.id === audio.id;
          const isCurrentPlaying = isCurrentlyActive && isPlaying;

          return (
            <Marker
              key={audio.id}
              position={[audio.latitude, audio.longitude]}
              icon={isCurrentlyActive ? activePlayingIcon : audioPinIcon}
            >
              <Popup className="proxispeak-popup">
                <div className="p-2 min-w-[210px] max-w-[260px] font-sans">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                      {formatDistance(audio.distanceMeters)} away
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(audio.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-1">
                    {audio.title}
                  </h3>

                  {audio.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                      {audio.description}
                    </p>
                  )}

                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <span>By</span>
                    <span className="font-medium text-gray-700">{audio.owner.displayName}</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (isCurrentlyActive) {
                          togglePlayPause();
                        } else {
                          playAudio(audio);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs py-1.5 px-3 rounded-lg transition-colors shadow-sm"
                    >
                      {isCurrentPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause Sound
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> Play Recording
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
