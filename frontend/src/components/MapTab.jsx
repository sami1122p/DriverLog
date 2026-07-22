import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to auto-pan/zoom map to fit the route bounds
function RecenterMap({ routeCoords, startLoc, pickupLoc, dropoffLoc }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points = [];
    if (startLoc) points.push([startLoc.lat, startLoc.lon]);
    if (pickupLoc) points.push([pickupLoc.lat, pickupLoc.lon]);
    if (dropoffLoc) points.push([dropoffLoc.lat, dropoffLoc.lon]);

    if (routeCoords && routeCoords.leg1 && routeCoords.leg1.length > 0) {
      routeCoords.leg1.forEach(pt => points.push(pt));
    }
    if (routeCoords && routeCoords.leg2 && routeCoords.leg2.length > 0) {
      routeCoords.leg2.forEach(pt => points.push(pt));
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, routeCoords, startLoc, pickupLoc, dropoffLoc]);

  return null;
}

// Create custom markers using SVG to avoid image load issues and look beautiful
const createCustomIcon = (htmlContent, className) => {
  return L.divIcon({
    html: `<div class="custom-map-icon ${className}">${htmlContent}</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const icons = {
  start: createCustomIcon(`
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  `, 'icon-start'),
  
  pickup: createCustomIcon(`
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #3b82f6;">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  `, 'icon-pickup'),
  
  dropoff: createCustomIcon(`
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;">
      <path d="M3 21h18"></path>
      <path d="M10 21V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v15"></path>
      <path d="M22 21V11a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v10"></path>
      <path d="M14 21v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
    </svg>
  `, 'icon-dropoff'),
  
  rest: createCustomIcon(`
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #06b6d4;">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>
  `, 'icon-rest'),
  
  sleep: createCustomIcon(`
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #a855f7;">
      <path d="M2 4v16"></path>
      <path d="M2 8h18a2 2 0 0 1 2 2v10"></path>
      <path d="M2 17h20"></path>
      <path d="M6 8v9"></path>
    </svg>
  `, 'icon-sleep'),
  
  restart: createCustomIcon(`
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
    </svg>
  `, 'icon-restart'),
  
  fuel: createCustomIcon(`
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;">
      <path d="M3 22h12F"></path>
      <path d="M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"></path>
      <path d="M14 9h6a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-6"></path>
      <circle cx="9" cy="9" r="2"></circle>
    </svg>
  `, 'icon-fuel'),
};

export default function MapTab({ routeData }) {
  const defaultCenter = [37.0902, -95.7129]; // US Center
  const defaultZoom = 4;
  
  if (!routeData) {
    return (
      <div className="map-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <h3>No Route Generated Yet</h3>
          <p>Fill out the trip details in the sidebar to visualize the route map.</p>
        </div>
      </div>
    );
  }

  const { start_location, pickup_location, dropoff_location, route_coordinates, timeline } = routeData;

  // Extract intermediate stops (fuel, sleep, rest, restart) from timeline
  // Exclude start, pickup, and dropoff events themselves to prevent double markers
  const stops = timeline.filter(ev => 
    ["30-min Rest Break", "Sleeper Berth (10-hr rest)", "34-hour Restart (Off-Duty)", "Fueling truck"].includes(ev.description)
  );

  return (
    <div className="map-wrapper">
      <style>{`
        .custom-map-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 32px;
          height: 32px;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        .custom-map-icon:hover {
          transform: scale(1.15);
          box-shadow: 0 6px 15px rgba(0,0,0,0.4);
        }
        .icon-start { border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .icon-pickup { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .icon-dropoff { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .icon-rest { border-color: #06b6d4; }
        .icon-sleep { border-color: #a855f7; }
        .icon-restart { border-color: #10b981; }
        .icon-fuel { border-color: #f59e0b; }
      `}</style>
      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Premium Dark Map Tile Layer
        />
        
        {/* Draw leg routes */}
        {route_coordinates.leg1 && (
          <Polyline positions={route_coordinates.leg1} color="var(--accent-primary)" weight={4} opacity={0.8} />
        )}
        {route_coordinates.leg2 && (
          <Polyline positions={route_coordinates.leg2} color="var(--accent-secondary)" weight={4} opacity={0.8} dashArray="5, 10" />
        )}

        {/* Primary Markers */}
        {start_location && (
          <Marker position={[start_location.lat, start_location.lon]} icon={icons.start}>
            <Popup>
              <strong>Start Location</strong><br />
              {start_location.name}
            </Popup>
          </Marker>
        )}

        {pickup_location && (
          <Marker position={[pickup_location.lat, pickup_location.lon]} icon={icons.pickup}>
            <Popup>
              <strong>Pickup Location</strong><br />
              {pickup_location.name}
            </Popup>
          </Marker>
        )}

        {dropoff_location && (
          <Marker position={[dropoff_location.lat, dropoff_location.lon]} icon={icons.dropoff}>
            <Popup>
              <strong>Dropoff Location</strong><br />
              {dropoff_location.name}
            </Popup>
          </Marker>
        )}

        {/* Dynamic Stop Markers */}
        {stops.map((stop, index) => {
          let icon = icons.rest;
          if (stop.description.includes("Sleeper")) icon = icons.sleep;
          if (stop.description.includes("Restart")) icon = icons.restart;
          if (stop.description.includes("Fuel")) icon = icons.fuel;

          return (
            <Marker key={index} position={[stop.lat, stop.lon]} icon={icon}>
              <Popup>
                <strong>{stop.description}</strong><br />
                Location: {stop.location}<br />
                Time: {new Date(stop.start_time).toLocaleString()}
              </Popup>
            </Marker>
          );
        })}

        {/* Auto Recenter */}
        <RecenterMap 
          routeCoords={route_coordinates} 
          startLoc={start_location} 
          pickupLoc={pickup_location} 
          dropoffLoc={dropoff_location} 
        />
      </MapContainer>
    </div>
  );
}
