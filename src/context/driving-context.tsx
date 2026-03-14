
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface TelemetryPoint {
  time: number;
  speed: number;
  distance: number;
}

export type RunMode = 'free' | '0-100' | '100-200' | '1/4mile';

interface DrivingContextType {
  speed: number;
  isDriving: boolean;
  peakSpeed: number;
  tripTime: number;
  tripDistance: number;
  hasGps: boolean;
  currentCoords: { lat: number; lng: number } | null;
  routePoints: [number, number][];
  telemetry: TelemetryPoint[];
  startTime: Date | null;
  runMode: RunMode;
  dragTime: number | null;
  isDragFinished: boolean;
  isDragActive: boolean;
  isWakeLockActive: boolean;
  setRunMode: (mode: RunMode) => void;
  startTrip: () => void;
  stopTrip: () => void;
  resetTrip: () => void;
}

const DrivingContext = createContext<DrivingContextType | undefined>(undefined);

export function DrivingProvider({ children }: { children: React.ReactNode }) {
  // UI State
  const [speed, setSpeed] = useState(0);
  const [isDriving, setIsDriving] = useState(false);
  const [peakSpeed, setPeakSpeed] = useState(0);
  const [tripTime, setTripTime] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);
  const [hasGps, setHasGps] = useState(true); // Default true until denied
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [runMode, setRunMode] = useState<RunMode>('free');
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [isDragFinished, setIsDragFinished] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  // Precision Engine Refs
  const isDrivingRef = useRef(false);
  const runModeRef = useRef<RunMode>('free');
  const totalDistanceRef = useRef(0);
  const peakSpeedRef = useRef(0);
  const dragStartTimeRef = useRef<number | null>(null);
  const dragStartDistanceRef = useRef<number>(0);
  const isDragActiveRef = useRef(false);
  const isDragFinishedRef = useRef(false);
  const lastPosRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const wakeLockRef = useRef<any>(null);
  const telemetryRef = useRef<TelemetryPoint[]>([]);

  const LAUNCH_THRESHOLD = 2.0; // km/h to trigger start
  const QUARTER_MILE_METERS = 402.336;

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsWakeLockActive(true);
      } catch (err) {
        console.warn('Wake Lock request failed');
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (e) {}
      wakeLockRef.current = null;
      setIsWakeLockActive(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let watchId: number;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setHasGps(true);
          const { latitude, longitude, speed: mps } = position.coords;
          const timestamp = position.timestamp;
          
          const kmh = mps !== null && mps >= 0 ? Math.round(mps * 3.6) : 0;
          
          // Safety spike filter
          if (kmh > 450) return;

          setSpeed(kmh);
          setCurrentCoords({ lat: latitude, lng: longitude });

          if (isDrivingRef.current) {
            let movedDist = 0;
            if (lastPosRef.current) {
              movedDist = calculateDistance(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
              // Filter drift
              if (movedDist > 0.1 || kmh > 1) {
                totalDistanceRef.current += movedDist;
                setTripDistance(totalDistanceRef.current);
              }
            }

            if (kmh > peakSpeedRef.current) {
              peakSpeedRef.current = kmh;
              setPeakSpeed(kmh);
            }

            // --- DRAG PRECISION LOGIC ---
            const mode = runModeRef.current;
            if (mode !== 'free' && !isDragFinishedRef.current) {
              
              // 1. Launch Detection
              if (!isDragActiveRef.current) {
                let launchTriggered = false;
                if ((mode === '0-100' || mode === '1/4mile') && kmh >= LAUNCH_THRESHOLD) {
                  launchTriggered = true;
                } else if (mode === '100-200' && kmh >= 100) {
                  launchTriggered = true;
                }

                if (launchTriggered) {
                  dragStartTimeRef.current = performance.now();
                  dragStartDistanceRef.current = totalDistanceRef.current;
                  isDragActiveRef.current = true;
                  setIsDragActive(true);
                  telemetryRef.current = [];
                }
              }

              // 2. Continuous Telemetry
              if (isDragActiveRef.current && dragStartTimeRef.current !== null) {
                const elapsed = (performance.now() - dragStartTimeRef.current) / 1000;
                const currentDragDist = totalDistanceRef.current - dragStartDistanceRef.current;
                
                telemetryRef.current.push({ time: elapsed, speed: kmh, distance: currentDragDist });

                // 3. Finish Detection
                let finished = false;
                if (mode === '0-100' && kmh >= 100) finished = true;
                else if (mode === '100-200' && kmh >= 200) finished = true;
                else if (mode === '1/4mile' && currentDragDist >= QUARTER_MILE_METERS) finished = true;

                if (finished) {
                  setDragTime(elapsed);
                  isDragFinishedRef.current = true;
                  setIsDragFinished(true);
                  isDragActiveRef.current = false;
                  setIsDragActive(false);
                  setTelemetry([...telemetryRef.current]);
                }
              }
            }

            // Map Route update
            setRoutePoints(prev => {
              if (prev.length > 0) {
                const last = prev[prev.length - 1];
                const d = calculateDistance(last[0], last[1], latitude, longitude);
                if (d < 5) return prev;
              }
              return [...prev, [latitude, longitude]];
            });
          }

          lastPosRef.current = { lat: latitude, lng: longitude, timestamp };
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setHasGps(false);
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, []);

  // Visual Timer for Trip (only for display)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDriving) {
      interval = setInterval(() => setTripTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isDriving]);

  const handleSetRunMode = (mode: RunMode) => {
    setRunMode(mode);
    runModeRef.current = mode;
    resetTrip();
  };

  const startTrip = () => {
    resetTrip();
    isDrivingRef.current = true;
    setIsDriving(true);
    setStartTime(new Date());
    requestWakeLock();
  };

  const stopTrip = () => {
    isDrivingRef.current = false;
    setIsDriving(false);
    isDragActiveRef.current = false;
    setIsDragActive(false);
    releaseWakeLock();
  };

  const resetTrip = () => {
    setTripTime(0);
    setTripDistance(0);
    setPeakSpeed(0);
    setRoutePoints([]);
    setTelemetry([]);
    setDragTime(null);
    setIsDragFinished(false);
    setIsDragActive(false);
    
    totalDistanceRef.current = 0;
    peakSpeedRef.current = 0;
    isDragFinishedRef.current = false;
    isDragActiveRef.current = false;
    dragStartTimeRef.current = null;
    telemetryRef.current = [];
    setStartTime(null);
  };

  return (
    <DrivingContext.Provider value={{
      speed, isDriving, peakSpeed, tripTime, tripDistance, hasGps, 
      currentCoords, routePoints, telemetry, startTime, 
      runMode, dragTime, isDragFinished, isDragActive, isWakeLockActive,
      setRunMode: handleSetRunMode, startTrip, stopTrip, resetTrip
    }}>
      {children}
    </DrivingContext.Provider>
  );
}

export const useDriving = () => {
  const context = useContext(DrivingContext);
  if (!context) throw new Error('useDriving must be used within a DrivingProvider');
  return context;
};
