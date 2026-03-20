
"use client"

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

interface RadarMapProps {
  center: [number, number];
  alerts: any[];
}

export default function RadarMap({ center, alerts }: RadarMapProps) {
  const [userIcon, setUserIcon] = useState<L.Icon | null>(null);

  useEffect(() => {
    const customUserIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="w-4 h-4 bg-accent rounded-full border-2 border-white shadow-[0_0_10px_#4de0f4] animate-pulse"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    setUserIcon(customUserIcon);
  }, []);

  const createAlertIcon = (type: string) => {
    const color = type === 'Radar' ? '#ef4444' : type === 'Polici' ? '#3b82f6' : '#a1a1aa';
    const emoji = type === 'Radar' ? '🚨' : type === 'Polici' ? '🚔' : '🚗';
    return L.divIcon({
      className: 'custom-alert-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full opacity-20 animate-ping" style="background-color: ${color}"></div>
          <div class="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white/20 shadow-xl bg-zinc-900 text-sm">
            ${emoji}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <ChangeView center={center} />

      {userIcon && (
        <Marker position={center} icon={userIcon}>
          <Popup>
            <div className="text-[10px] font-black text-center uppercase">Ti je këtu 📍</div>
          </Popup>
        </Marker>
      )}

      <Circle 
        center={center} 
        radius={1500} 
        pathOptions={{ 
          color: '#06b6d4', 
          fillColor: '#06b6d4', 
          fillOpacity: 0.05,
          weight: 1,
          dashArray: '5, 10'
        }} 
      />

      {alerts.map((alert) => {
        const alertPos: [number, number] = [alert.lat, alert.lng];
        return (
          <div key={alert.id}>
            <Polyline 
              positions={[center, alertPos]} 
              pathOptions={{
                color: alert.type === 'Radar' ? '#ef4444' : '#06b6d4',
                weight: 1,
                dashArray: '4, 8',
                opacity: 0.4
              }}
            />
            
            <Marker 
              position={alertPos} 
              icon={createAlertIcon(alert.type)}
            >
              <Popup>
                <div className="text-[10px] font-black uppercase text-background">
                  <span className={alert.type === 'Radar' ? 'text-red-600' : 'text-blue-600'}>
                    {alert.type === 'Radar' ? '🚨' : alert.type === 'Polici' ? '🚔' : '🚗'} {alert.type.toUpperCase()} AKTIV
                  </span>
                  <br />
                  <span className="text-zinc-500">📍 {alert.location}</span>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </MapContainer>
  );
}
