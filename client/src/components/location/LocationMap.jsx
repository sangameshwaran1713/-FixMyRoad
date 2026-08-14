import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon asset paths for Vite build bundles
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center map when selected coordinates update
function MapRecenter({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 16, { animate: true });
    }
  }, [lat, lon, map]);
  return null;
}

// Helper component to handle click events on the map for manual selection
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const LocationMap = ({ lat, lon, source, onMapClick }) => {
  // Default neutral center (India center if no location selected yet)
  const defaultCenter = [20.5937, 78.9629];
  const center = lat && lon ? [lat, lon] : defaultCenter;
  const zoom = lat && lon ? 16 : 5;

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap Tile Layer with Required Attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Recenter helper */}
        <MapRecenter lat={lat} lon={lon} />

        {/* Click listener */}
        <MapClickHandler onMapClick={onMapClick} />

        {/* Selected Marker */}
        {lat && lon && (
          <Marker position={[lat, lon]}>
            <Popup>
              <div className="text-xs space-y-1 p-0.5 text-slate-900">
                <p className="font-bold text-slate-900">Selected Road Issue Location</p>
                <p><strong>Latitude:</strong> {lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {lon.toFixed(6)}</p>
                <p><strong>Source:</strong> <span className="font-bold text-cyan-600">{source || 'GPS'}</span></p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Manual Selection Overlay Instruction */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
        💡 Click anywhere on map to adjust position
      </div>
    </div>
  );
};

export default LocationMap;
