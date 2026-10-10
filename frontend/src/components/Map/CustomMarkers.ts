import L from 'leaflet';

export const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; width: 24px; height: 24px; background: rgba(59, 130, 246, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #2563eb; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const audioPinIcon = L.divIcon({
  className: 'custom-audio-marker',
  html: `
    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(109, 40, 217, 0.4);">
      <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const activePlayingIcon = L.divIcon({
  className: 'custom-active-marker',
  html: `
    <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6); animation: bounce 1s infinite alternate;">
      <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export const dropPinIcon = L.divIcon({
  className: 'custom-drop-marker',
  html: `
    <div style="width: 34px; height: 34px; background: #ef4444; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.5);">
      <div style="transform: rotate(45deg); width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});
