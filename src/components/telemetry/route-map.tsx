
'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function MapController({ 
  points, 
  userLocation, 
  heading 
}: { 
  points: [number, number][], 
  userLocation?: { lat: number, lng: number } | null,
  heading?: number | null
}) {
  const map = useMap();
  const lastCenter = useRef<string>("");

  useEffect(() => {
    if (typeof window === 'undefined' || !map) return;
    
    try {
      if (userLocation) {
        const centerStr = `${userLocation.lat.toFixed(5)},${userLocation.lng.toFixed(5)}`;
        if (centerStr !== lastCenter.current) {
          lastCenter.current = centerStr;
          map.setView([userLocation.lat, userLocation.lng], 17, { animate: true, duration: 1.0 });
        }
        
        const container = map.getContainer();
        if (container && heading !== null && heading !== undefined) {
          container.style.transform = `rotate(${-heading}deg)`;
          container.style.transition = "transform 1.0s cubic-bezier(0.16, 1, 0.3, 1)";
          
          const arrow = container.querySelector('.lead-arrow-container') as HTMLElement;
          if (arrow) {
            arrow.style.transform = `rotate(${heading}deg)`;
            arrow.style.transition = "transform 1.0s cubic-bezier(0.16, 1, 0.3, 1)";
          }
        }
      } else if (points.length >= 1) {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [15, 15], animate: true, duration: 2.0 });
        }
      }
    } catch (e) {}
  }, [points, userLocation, heading, map]);
  
  return null;
}

interface RouteMapProps {
  points: [number, number][];
  userLocation?: { lat: number, lng: number } | null;
  heading?: number | null;
}

export default function RouteMap({ points, userLocation, heading }: RouteMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState<[number, number][]>([]);
  const [currentHeading, setCurrentHeading] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && points.length > 1 && !userLocation) {
      let currentIdx = 0;
      const stepSize = Math.max(1, Math.floor(points.length / 40));
      const interval = setInterval(() => {
        if (currentIdx >= points.length) {
          clearInterval(interval);
          setAnimatedPoints(points);
          return;
        }
        
        const nextIdx = Math.min(currentIdx + stepSize, points.length - 1);
        
        if (nextIdx > currentIdx) {
          const p1 = points[currentIdx];
          const p2 = points[nextIdx];
          const dy = p2[0] - p1[0];
          const dx = Math.cos(p1[0] * Math.PI / 180) * (p2[1] - p1[1]);
          const angle = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
          setCurrentHeading(angle);
        }

        setAnimatedPoints(points.slice(0, nextIdx + 1));
        currentIdx = nextIdx + 1;
      }, 50);
      return () => clearInterval(interval);
    } else {
      setAnimatedPoints(points);
    }
  }, [isClient, points, userLocation]);

  const icons = useMemo(() => {
    if (!isClient || typeof window === 'undefined') return { start: null, finish: null, lead: null };

    return {
      start: L.divIcon({
        className: 'start-point',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <div class="absolute inset-0 bg-green-500/40 rounded-full animate-ping"></div>
            <div class="relative w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      finish: L.divIcon({
        className: 'finish-flag',
        html: `
          <div class="flex items-center justify-center w-8 h-8 bg-zinc-950 border-2 border-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110">
            <span class="text-xs">🏁</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
      lead: L.divIcon({
        className: 'lead-arrow',
        html: `
          <div class="lead-arrow-container relative w-8 h-8 flex items-center justify-center">
            <div class="absolute inset-0 bg-accent/20 rounded-full blur-md"></div>
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L34 34L20 27L6 34L20 4Z" fill="#4de0f4" stroke="white" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
    };
  }, [isClient]);

  if (!isClient) return <div className="w-full h-full bg-zinc-950 rounded-2xl" />;

  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const lastAnimatedPoint = animatedPoints[animatedPoints.length - 1];

  return (
    <div className="w-full h-full relative overflow-hidden bg-black rounded-2xl border border-white/5 shadow-inner">
      <MapContainer 
        center={userLocation ? [userLocation.lat, userLocation.lng] : (points[0] || [42.6629, 21.1655])} 
        zoom={17} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
        attributionControl={false}
        dragging={!userLocation}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        <MapController points={points} userLocation={userLocation} heading={heading || currentHeading} />

        {animatedPoints.length > 1 && (
          <>
            <Polyline 
              positions={animatedPoints} 
              pathOptions={{ color: '#06b6d4', weight: 8, opacity: 0.15, lineJoin: 'round' }} 
            />
            <Polyline 
              positions={animatedPoints} 
              pathOptions={{ color: '#4de0f4', weight: 4, opacity: 1, lineJoin: 'round' }} 
            />
          </>
        )}

        {!userLocation && startPoint && icons.start && (
          <Marker position={startPoint} icon={icons.start} zIndexOffset={100} />
        )}
        
        {!userLocation && endPoint && points.length > 1 && icons.finish && (
          <Marker position={endPoint} icon={icons.finish} zIndexOffset={200} />
        )}

        {((!userLocation && lastAnimatedPoint && animatedPoints.length < points.length) || userLocation) && icons.lead && (
          <Marker 
            position={userLocation ? [userLocation.lat, userLocation.lng] : lastAnimatedPoint} 
            icon={icons.lead} 
            zIndexOffset={150} 
          />
        )}
      </MapContainer>
      
      <div className="absolute top-2 right-2 z-[400] pointer-events-none apple-slide-up">
        <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[8px] font-black uppercase tracking-widest py-1 px-2 flex items-center gap-1 shadow-xl">
          <Zap className="w-2 h-2 text-accent" /> {userLocation ? 'LIVE TELEMETRY' : 'RECAP DATA'}
        </Badge>
      </div>
    </div>
  );
}
