import { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { audioApi } from './api/audio';
import type { NearbyAudioItem } from './api/audio';
import { Navbar } from './components/Navbar';
import { ProxiMap } from './components/Map/ProxiMap';
import { MapControls } from './components/Map/MapControls';
import { AudioListSidebar } from './components/Audio/AudioListSidebar';
import { AudioPlayerBar } from './components/Audio/AudioPlayerBar';
import { AudioRecorderModal } from './components/Audio/AudioRecorderModal';
import { AuthModal } from './components/Auth/AuthModal';
import { ProfileModal } from './components/Profile/ProfileModal';
import { MyRecordingsModal } from './components/Audio/MyRecordingsModal';

// Default initial location: San Francisco Market & Powell
const DEFAULT_CENTER: [number, number] = [37.7844, -122.408];

function ProxiSpeakApp() {
  const [userPosition, setUserPosition] = useState<[number, number]>(DEFAULT_CENTER);
  const [searchRadiusMeters, setSearchRadiusMeters] = useState(5000);
  const [selectedPin, setSelectedPin] = useState<[number, number] | null>(null);
  const [audioItems, setAudioItems] = useState<NearbyAudioItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal open states
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMyRecordingsOpen, setIsMyRecordingsOpen] = useState(false);

  // Fetch nearby audio recordings from backend API
  const fetchNearbyAudio = useCallback(async () => {
    setLoading(true);
    try {
      const data = await audioApi.getNearby({
        lat: userPosition[0],
        lng: userPosition[1],
        radius: searchRadiusMeters,
        limit: 50,
      });
      setAudioItems(data.results);
    } catch {
      // Backend may be starting or offline
    } finally {
      setLoading(false);
    }
  }, [userPosition, searchRadiusMeters]);

  // Request browser geolocation on initial mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Fallback to default center if user denies permission
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
  }, []);

  // Re-fetch when user position or radius changes
  useEffect(() => {
    fetchNearbyAudio();
  }, [fetchNearbyAudio]);

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  const handleMapClick = (coords: [number, number]) => {
    setSelectedPin(coords);
  };

  const handleSelectAudioFromSidebar = (item: NearbyAudioItem) => {
    setUserPosition([item.latitude, item.longitude]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Top Navigation */}
      <Navbar
        discoveredCount={audioItems.length}
        onOpenRecord={() => setIsRecordOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenMyRecordings={() => setIsMyRecordingsOpen(true)}
      />

      {/* Main Map & Interactive Views */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        <ProxiMap
          userPosition={userPosition}
          searchRadiusMeters={searchRadiusMeters}
          audioItems={audioItems}
          selectedPin={selectedPin}
          onMapClick={handleMapClick}
        />

        {/* Floating Map Controls */}
        <MapControls
          radiusMeters={searchRadiusMeters}
          onRadiusChange={setSearchRadiusMeters}
          onLocateMe={handleLocateMe}
          onRefresh={fetchNearbyAudio}
          selectedPin={selectedPin}
          onClearPin={() => setSelectedPin(null)}
          loading={loading}
        />

        {/* Nearby Soundscapes Sidebar Drawer */}
        <AudioListSidebar
          audioItems={audioItems}
          radiusMeters={searchRadiusMeters}
          loading={loading}
          onSelectAudioMarker={handleSelectAudioFromSidebar}
        />

        {/* Floating Persistent Audio Player */}
        <AudioPlayerBar />
      </main>

      {/* Modals */}
      <AudioRecorderModal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        defaultCoordinates={selectedPin || userPosition}
        onUploadSuccess={() => {
          setSelectedPin(null);
          fetchNearbyAudio();
        }}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <MyRecordingsModal
        isOpen={isMyRecordingsOpen}
        onClose={() => setIsMyRecordingsOpen(false)}
        recordings={audioItems}
        onRefresh={fetchNearbyAudio}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <ProxiSpeakApp />
      </AudioPlayerProvider>
    </AuthProvider>
  );
}

export default App;
