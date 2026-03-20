"use client"

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Krijojmë ikonën statike jashtë komponentit për stabilitet maksimal
const createUserArrowIcon = () => {
  if (typeof window === 'undefined') return null;
  
  return L.divIcon({
    className: 'user-arrow-wrapper',
    html: `
      <div class="relative w-12 h-12 flex items-center justify-center">
        <div class="user-arrow-container relative w-12 h-12 flex items-center justify-center">
          <div class="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
          <div class="relative w-10 h-10 bg-[#007aff] rounded-full border-[3px] border-white shadow-2xl flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L34 34L20 27L6 34L20 4Z" fill="white" />
            </svg>
          </div>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

function MapControls({ 
  center, 
  heading,
  isNavigating,
  forceCenter,
  zoom,
  allRoutes,
  activeRoute,
  isSearchActive
}: { 
  center?: [number, number], 
  heading: number | null,
  isNavigating: boolean,
  forceCenter: number,
  zoom: number,
  allRoutes: any[],
  activeRoute: any | null,
  isSearchActive?: boolean
}) {
  const map = useMap();
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!map) return;
    
    try {
      const container = map.getContainer();
      if (!container) return;

      if (isNavigating && heading !== null && heading !== undefined) {
        container.style.transform = `rotate(${-heading}deg)`;
        container.style.transition = 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)';
        
        const arrow = container.querySelector('.user-arrow-container') as HTMLElement;
        if (arrow) {
          arrow.style.transform = `rotate(${heading}deg)`;
          arrow.style.transition = 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)';
        }
      } else {
        container.style.transform = `rotate(0deg)`;
        const arrow = container.querySelector('.user-arrow-container') as HTMLElement;
        if (arrow) {
          arrow.style.transform = `rotate(${heading || 0}deg)`;
        }
      }
    } catch (e) {
      // Shmangim crash nëse elementi nuk gjendet përkohësisht
    }
  }, [map, isNavigating, heading]);

  useEffect(() => {
    if (center && map) {
      if (isSearchActive && !isNavigating) return;

      const now = Date.now();
      const duration = isNavigating ? 2.5 : 3.0; 
      
      if (now - lastUpdateRef.current < 150 && !forceCenter) return;
      lastUpdateRef.current = now;

      try {
        if (activeRoute && !isNavigating) {
           const bounds = L.latLngBounds(activeRoute);
           if (bounds.isValid()) {
             map.fitBounds(bounds, { 
               padding: [80, 80], 
               animate: true, 
               duration: duration
             });
           }
        } else if (allRoutes && allRoutes.length > 0 && !isNavigating) {
           const bounds = L.latLngBounds(allRoutes.flatMap(r => r.coordinates));
           if (bounds.isValid()) {
             map.fitBounds(bounds, { 
               padding: [100, 100], 
               animate: true, 
               duration: duration 
             });
           }
        } else {
          map.setView(center, zoom, { animate: true, duration: duration });
        }
      } catch (e) {}
    }
  }, [center, isNavigating, zoom, forceCenter, map, allRoutes, activeRoute, isSearchActive]);

  return null;
}

interface DriveRankMapProps {
  userLocation: { lat: number; lng: number } | null;
  heading: number | null;
  route: [number, number][] | null;
  availableRoutes?: any[];
  alerts: any[];
  destination?: { lat: number; lng: number } | null;
  isNavigating: boolean;
  forceCenter: number;
  speed: number;
  zoom: number;
  isSearchActive?: boolean;
  currentRoadName?: string;
}

export default function DriveRankMap({ 
  userLocation, 
  heading, 
  route, 
  availableRoutes = [],
  alerts, 
  destination,
  isNavigating,
  forceCenter,
  speed,
  zoom,
  isSearchActive,
  currentRoadName
}: DriveRankMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const userIcon = useMemo(() => {
    if (!mounted) return null;
    return createUserArrowIcon();
  }, [mounted]);

  if (!mounted) return <div className="w-full h-full bg-[#0a0a0a]" />;

  const centerPos: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [42.6629, 21.1655];

  return (
    <div className="w-full h-full relative bg-[#0a0a0a] overflow-hidden" id="map-parent">
      <MapContainer 
        center={centerPos} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', zIndex: 1, background: '#0a0a0a' }}
        zoomControl={false}
        attributionControl={false}
        dragging={!isNavigating}
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          keepBuffer={30}
        />
        
        <MapControls 
          center={centerPos} 
          heading={heading}
          isNavigating={isNavigating}
          forceCenter={forceCenter}
          zoom={zoom}
          allRoutes={availableRoutes}
          activeRoute={route}
          isSearchActive={isSearchActive}
        />

        {userLocation && userIcon && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userIcon}
            zIndexOffset={2000}
          >
            {isNavigating && currentRoadName && (
              <Popup 
                permanent 
                direction="top" 
                className="navigation-road-popup"
                offset={[0, -20]}
              >
                <div className="bg-[#007aff] text-white text-[10px] font-black px-4 py-2 rounded-2xl whitespace-nowrap shadow-2xl border border-white/20 uppercase tracking-tight">
                  {currentRoadName}
                </div>
              </Popup>
            )}
          </Marker>
        )}

        {!isNavigating && availableRoutes.map((r, idx) => {
          if (!r.coordinates || JSON.stringify(r.coordinates) === JSON.stringify(route)) return null;
          return (
            <Polyline 
              key={`alt-${idx}`}
              positions={r.coordinates} 
              pathOptions={{ color: '#007aff', weight: 8, opacity: 0.15, lineJoin: 'round' }} 
            />
          );
        })}

        {route && route.length > 0 && (
          <>
            <Polyline 
              positions={route} 
              pathOptions={{ color: '#ffffff', weight: 12, opacity: 0.1, lineJoin: 'round' }} 
            />
            <Polyline 
              positions={route} 
              pathOptions={{ 
                color: '#007aff', 
                weight: 8, 
                opacity: 1, 
                lineJoin: 'round'
              }} 
            />
          </>
        )}

        {destination && (
          <Marker 
            position={[destination.lat, destination.lng]} 
            icon={L.divIcon({
              className: 'dest-icon',
              html: `<div class="w-12 h-12 bg-red-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_10px_30px_rgba(220,38,38,0.4)] border-4 border-white text-xl animate-pulse-glow">🏁</div>`,
              iconSize: [48, 48],
              iconAnchor: [24, 48],
            })}
          />
        )}

        {alerts && alerts.map((alert) => (
          <Marker 
            key={alert.id} 
            position={[alert.lat, alert.lng]} 
            icon={L.divIcon({
              className: 'radar-marker',
              html: `<div class="w-8 h-8 bg-zinc-950 border-2 border-red-500 rounded-xl flex items-center justify-center text-sm shadow-2xl">${alert.type === 'Radar' ? '🚨' : alert.type === 'Polici' ? '🚓' : '🚗'}</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          />
        ))}
      </MapContainer>
    </div>
  );
}