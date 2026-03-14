
"use client"

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [points, map]);
  return null;
}

interface RouteMapProps {
  points: [number, number][];
}

export default function RouteMap({ points }: RouteMapProps) {
  if (points.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-white/5 italic text-[10px] text-muted-foreground uppercase tracking-widest">
        Nuk ka të dhëna të mjaftueshme për hartën
      </div>
    );
  }

  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  return (
    <MapContainer 
      center={points[0]} 
      zoom={15} 
      style={{ height: '100%', width: '100%', zIndex: 1, borderRadius: '1.5rem' }}
      zoomControl={false}
      attributionControl={false}
      dragging={true}
      scrollWheelZoom={false}
      doubleClickZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Glow Effect Line (Subtle background glow) */}
      <Polyline 
        positions={points} 
        pathOptions={{ 
          color: '#06b6d4', 
          weight: 8, 
          opacity: 0.2,
          lineJoin: 'round',
        }} 
      />
      
      {/* Main Neon Trail (Solid Line) */}
      <Polyline 
        positions={points} 
        pathOptions={{ 
          color: '#4de0f4', 
          weight: 3, 
          opacity: 1,
          lineJoin: 'round',
        }} 
      />

      {/* Start Point Marker */}
      <CircleMarker 
        center={startPoint} 
        radius={4} 
        pathOptions={{ 
          color: '#ffffff', 
          fillColor: '#22c55e', 
          fillOpacity: 1, 
          weight: 2 
        }} 
      />

      {/* End Point Marker */}
      <CircleMarker 
        center={endPoint} 
        radius={6} 
        pathOptions={{ 
          color: '#ffffff', 
          fillColor: '#ef4444', 
          fillOpacity: 1, 
          weight: 2,
          className: 'animate-pulse'
        }} 
      />

      <FitBounds points={points} />
    </MapContainer>
  );
}
