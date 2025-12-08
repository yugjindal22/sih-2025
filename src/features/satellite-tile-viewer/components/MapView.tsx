"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, ImageOverlay, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  overlayImage: string | null;
  overlayBounds: any;
  position: any;
  setPosition: (pos: any) => void;
  setViewBounds: (bounds: any) => void;
}

// Map updater component
function MapUpdater({ bounds }: { bounds: any }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

// Location marker component
function LocationMarker({ setPosition, setViewBounds }: { setPosition: any, setViewBounds: any }) {
  const map = useMapEvents({
    click(e: any) {
      setPosition(e.latlng);
    },
    moveend() {
      setViewBounds(map.getBounds());
    }
  });
  return null;
}

export default function MapView({ overlayImage, overlayBounds, position, setPosition, setViewBounds }: MapViewProps) {
  return (
    <MapContainer 
      center={[20.5937, 78.9629]} 
      zoom={5} 
      className="h-full w-full z-0"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='&copy; Esri'
      />
      
      {/* Auto-Zoomer */}
      <MapUpdater bounds={overlayBounds} />
      
      {/* Satellite Overlay */}
      {overlayImage && overlayBounds && (
        <ImageOverlay url={overlayImage} bounds={overlayBounds} opacity={0.8} />
      )}

      <LocationMarker setPosition={setPosition} setViewBounds={setViewBounds} />
      {position && <Marker position={position} />}
    </MapContainer>
  );
}
