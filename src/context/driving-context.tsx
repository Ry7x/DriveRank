'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

/**
 * Llogarit distancën midis dy koordinatave gjeografike duke përdorur formulën Haversine.
 */
function calculateDist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; 
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

interface TelemetryPoint {
  time: number;
  speed: number;
  distance: number;
}

export type RunMode = 'free' | '0-60' | '0-100' | '100-200' | '1/4mile' | 'ALL';

export interface AllRunStats {
  "0-60"?: number;
  "0-100"?: number;
  "100-200"?: number;
  "1/4 Mile"?: number;
}

export interface RunSummaryData {
  id: string;
  runType: string;
  time: number;
  peakSpeed: number;
  avgSpeed: number;
  consistentSpeed: number;
  distance: number;
  points: [number, number][];
  telemetry: TelemetryPoint[];
  city: string;
  createdAt: string;
  startLat?: number;
  allStats?: AllRunStats;
  brakes: number;
  turns: number;
  lowSpeedPasses: number;
  maxGForce: number;
}

interface DrivingContextType {
  speed: number; 
  rawSpeed: number;
  acceleration: number;
  isDriving: boolean;
  peakSpeed: number;
  tripTime: number;
  tripDistance: number;
  hasGps: boolean;
  gpsAccuracy: number | null;
  currentCoords: { lat: number; lng: number } | null;
  heading: number | null;
  routePoints: [number, number][];
  telemetry: TelemetryPoint[];
  startTime: Date | null;
  runMode: RunMode;
  dragTime: number | null;
  isDragFinished: boolean;
  isDragActive: boolean;
  isWakeLockActive: boolean;
  countdown: number;
  isJumpStart: boolean;
  isWaitingForLaunch: boolean;
  lastRunSummary: RunSummaryData | null;
  setRunMode: (mode: RunMode) => void;
  startTrip: () => void;
  startDragCountdown: () => void;
  stopTrip: () => void;
  resetTrip: () => void;
  requestWakeLock: () => Promise<void>;
  setLastRunSummary: (summary: RunSummaryData | null) => void;
}

const DrivingContext = createContext<DrivingContextType | undefined>(undefined);

// ALPHA-BETA CONSTANTS FOR PREDICTIVE ENGINE
const ALPHA = 0.95; 
const BETA = 0.1;   
const MIN_SPEED_THRESHOLD = 1.5; 
const GPS_CONFIDENCE_THRESHOLD = 30; 
const SPEED_BIAS_KMH = 2.0; // Përputhje me bordin e makinës

export function DrivingProvider({ children }: { children: React.ReactNode }) {
  const [canInitGps, setCanInitGps] = useState(false);
  
  const [speed, setSpeed] = useState(0);
  const [rawSpeed, setRawSpeed] = useState(0);
  const [acceleration, setAcceleration] = useState(0);
  const [isDriving, setIsDriving] = useState(false);
  const [peakSpeed, setPeakSpeed] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);
  const [tripTime, setTripTime] = useState(0);
  const [hasGps, setHasGps] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [runMode, setRunMode] = useState<RunMode>('free');
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [isDragFinished, setIsDragFinished] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isWaitingForLaunch, setIsWaitingForLaunch] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isJumpStart, setIsJumpStart] = useState(false);
  const [lastRunSummary, setLastRunSummary] = useState<RunSummaryData | null>(null);

  const isDrivingRef = useRef(false);
  const runModeRef = useRef<RunMode>('free');
  const totalDistanceRef = useRef(0);
  const peakSpeedRef = useRef(0);
  const lastPosRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const wakeLockRef = useRef<any>(null);
  const tripStartTimeRef = useRef<number | null>(null);
  const tripRoutePointsRef = useRef<[number, number][]>([]);
  const telemetryRef = useRef<TelemetryPoint[]>([]);
  const countdownRef = useRef(0);
  
  const filterVRef = useRef(0); 
  const filterARef = useRef(0); 
  const lastTimestampRef = useRef<number>(0);

  const dragTimerRef = useRef<number | null>(null);
  const dragStartDistRef = useRef<number>(0);
  const isDragActiveRef = useRef(false);
  const isWaitingForLaunchRef = useRef(false);
  const isDragFinishedRef = useRef(false);
  const split100Ref = useRef<number | null>(null);
  const split60Ref = useRef<number | null>(null);
  const split200Ref = useRef<number | null>(null);
  const split402Ref = useRef<number | null>(null);

  const brakeCountRef = useRef(0);
  const turnCountRef = useRef(0);
  const lowSpeedCountRef = useRef(0);
  const maxGForceRef = useRef(0);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uiTimerRef = useRef<number | null>(null);

  useEffect(() => {
    runModeRef.current = runMode;
  }, [runMode]);

  const requestWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsWakeLockActive(true);
      } catch (err) {
        console.warn("Wake Lock fail:", err);
        setIsWakeLockActive(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isDrivingRef.current) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [requestWakeLock]);

  useEffect(() => {
    const onboardingDone = localStorage.getItem('driverank_onboarding_completed') === 'true';
    if (onboardingDone) setCanInitGps(true);
    else {
      const handleOnboardingComplete = () => setCanInitGps(true);
      window.addEventListener('onboarding_complete', handleOnboardingComplete);
      return () => window.removeEventListener('onboarding_complete', handleOnboardingComplete);
    }
  }, []);

  useEffect(() => {
    if (!canInitGps) return;

    let watchId: number;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed: measuredMps, accuracy, heading: gpsHeading } = position.coords;
          const timestamp = position.timestamp || Date.now();
          
          setHasGps(true);
          setGpsAccuracy(accuracy);
          if (gpsHeading !== null) setHeading(gpsHeading);
          
          if (accuracy && accuracy > GPS_CONFIDENCE_THRESHOLD) return;

          let currentMps = measuredMps !== null && measuredMps >= 0 ? measuredMps : 0;
          
          if (measuredMps === null && lastPosRef.current) {
            const dt = (timestamp - lastPosRef.current.timestamp) / 1000;
            if (dt > 0.1) {
              const d = calculateDist(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
              currentMps = d / dt;
            }
          }

          if (lastTimestampRef.current > 0) {
            const dt = (timestamp - lastTimestampRef.current) / 1000;
            if (dt > 0) {
              const prevV = filterVRef.current;
              const prevA = filterARef.current;
              const vPred = prevV + prevA * dt;
              const residual = currentMps - vPred;
              filterVRef.current = vPred + ALPHA * residual;
              filterARef.current = prevA + (BETA * residual) / dt;
            }
          } else {
            filterVRef.current = currentMps;
          }

          if (filterVRef.current < MIN_SPEED_THRESHOLD / 3.6) {
            filterVRef.current = 0;
            filterARef.current = 0;
          }

          const filteredKmh = filterVRef.current * 3.6;
          const rawKmh = currentMps * 3.6;

          // DISPLAY SPEED ME OFFSET +2
          const displayKmh = filteredKmh > 1.5 ? filteredKmh + SPEED_BIAS_KMH : 0;

          if (countdownRef.current > 0 && countdownRef.current < 6 && rawKmh > 1.5) {
            setIsJumpStart(true);
            setCountdown(0);
            countdownRef.current = 0;
            if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
            setIsDriving(false);
            isDrivingRef.current = false;
            return;
          }

          if (isDrivingRef.current) {
            if (rawKmh > peakSpeedRef.current) {
              peakSpeedRef.current = rawKmh;
              setPeakSpeed(Math.round(rawKmh));
            }

            tripRoutePointsRef.current.push([latitude, longitude]);
            setRoutePoints([...tripRoutePointsRef.current]);

            if (tripStartTimeRef.current) {
              const tripDuration = (timestamp - tripStartTimeRef.current) / 1000;
              telemetryRef.current.push({ 
                time: tripDuration, 
                speed: rawKmh, 
                distance: totalDistanceRef.current 
              });
              setTelemetry([...telemetryRef.current]);
              setTripTime(tripDuration);
            }

            if (lastPosRef.current) {
              const moved = calculateDist(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
              if (moved > 0.1) { 
                totalDistanceRef.current += moved;
                setTripDistance(totalDistanceRef.current);
              }
            }

            const g = (filterARef.current / 9.81);
            if (Math.abs(g) > maxGForceRef.current) maxGForceRef.current = Math.abs(g);

            if (runModeRef.current !== 'free' && !isDragFinishedRef.current) {
              handleDragLogic(rawKmh, totalDistanceRef.current, timestamp);
            }
          }

          setSpeed(displayKmh);
          setRawSpeed(rawKmh);
          setAcceleration(filterARef.current);
          setCurrentCoords({ lat: latitude, lng: longitude });
          
          lastTimestampRef.current = timestamp;
          lastPosRef.current = { lat: latitude, lng: longitude, timestamp };
        },
        () => setHasGps(false),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [canInitGps]);

  const handleDragLogic = (measuredKmh: number, currentDist: number, currentTimeMs: number) => {
    if (isWaitingForLaunchRef.current && measuredKmh > 1.5) {
      startDragTimer();
      return;
    }

    if (!dragTimerRef.current || !isDragActiveRef.current) return;
    
    const dFromStart = currentDist - dragStartDistRef.current;

    if (runModeRef.current === '0-60' && measuredKmh >= 60) {
      finalizeRun((currentTimeMs - dragTimerRef.current) / 1000, currentDist, 60);
    } else if (runModeRef.current === '0-100' && measuredKmh >= 100) {
      finalizeRun((currentTimeMs - dragTimerRef.current) / 1000, currentDist, 100);
    } else if (runModeRef.current === '100-200' && measuredKmh >= 200 && split100Ref.current) {
      finalizeRun((currentTimeMs - split100Ref.current) / 1000, currentDist, 200);
    } else if (runModeRef.current === '1/4mile' && dFromStart >= 402.3) {
      finalizeRun((currentTimeMs - dragTimerRef.current) / 1000, currentDist);
    } else if (runModeRef.current === 'ALL') {
      if (!split60Ref.current && measuredKmh >= 60) split60Ref.current = currentTimeMs;
      if (!split100Ref.current && measuredKmh >= 100) split100Ref.current = currentTimeMs;
      if (!split200Ref.current && measuredKmh >= 200) split200Ref.current = currentTimeMs;
      if (!split402Ref.current && dFromStart >= 402.3) {
        split402Ref.current = currentTimeMs;
        finalizeRun((currentTimeMs - dragTimerRef.current) / 1000, currentDist);
      }
    }

    if ((runModeRef.current === '100-200' || runModeRef.current === 'ALL') && !split100Ref.current && measuredKmh >= 100) {
      split100Ref.current = currentTimeMs;
    }
  };

  const startDragTimer = () => {
    isWaitingForLaunchRef.current = false;
    setIsWaitingForLaunch(false);
    isDragActiveRef.current = true;
    setIsDragActive(true);
    dragTimerRef.current = Date.now();
    dragStartDistRef.current = totalDistanceRef.current;
    
    const updateUITimer = () => {
      if (isDragActiveRef.current && dragTimerRef.current) {
        const now = Date.now();
        let elapsed = (now - dragTimerRef.current) / 1000;
        if (runModeRef.current === '100-200' && split100Ref.current) {
          elapsed = (now - split100Ref.current) / 1000;
        }
        setDragTime(elapsed);
        uiTimerRef.current = requestAnimationFrame(updateUITimer);
      }
    };
    uiTimerRef.current = requestAnimationFrame(updateUITimer);
  };

  const finalizeRun = (finalTime: number, currentDist: number, forcedPeakSpeed?: number) => {
    const finalPeak = forcedPeakSpeed || peakSpeedRef.current;
    const distanceMeters = Math.round(currentDist - dragStartDistRef.current);
    const modeAtEnd = runModeRef.current;
    
    setIsDriving(false);
    isDrivingRef.current = false;
    isDragActiveRef.current = false;
    setIsDragActive(false);
    isDragFinishedRef.current = true;
    setIsDragFinished(true);
    isWaitingForLaunchRef.current = false;
    setIsWaitingForLaunch(false);

    if (uiTimerRef.current) cancelAnimationFrame(uiTimerRef.current);

    const stats: AllRunStats = {};
    if (modeAtEnd === 'ALL' && dragTimerRef.current) {
      if (split60Ref.current) stats["0-60"] = (split60Ref.current - dragTimerRef.current) / 1000;
      if (split100Ref.current) stats["0-100"] = (split100Ref.current - dragTimerRef.current) / 1000;
      if (split200Ref.current && split100Ref.current) stats["100-200"] = (split200Ref.current - split100Ref.current) / 1000;
      if (split402Ref.current) stats["1/4 Mile"] = (split402Ref.current - dragTimerRef.current) / 1000;
    }

    setLastRunSummary({
      id: Math.random().toString(36).substring(7),
      runType: modeAtEnd === 'free' ? 'Top Speed' : (modeAtEnd === '1/4mile' ? '1/4 Mile' : modeAtEnd),
      time: parseFloat(finalTime.toFixed(2)),
      peakSpeed: Math.round(finalPeak),
      avgSpeed: Math.round((distanceMeters / finalTime) * 3.6),
      consistentSpeed: Math.round(finalPeak * 0.95),
      distance: distanceMeters,
      points: [...tripRoutePointsRef.current],
      telemetry: [...telemetryRef.current],
      city: "Kosovë",
      createdAt: new Date().toISOString(),
      allStats: modeAtEnd === 'ALL' ? stats : undefined,
      brakes: brakeCountRef.current,
      turns: turnCountRef.current,
      lowSpeedPasses: lowSpeedCountRef.current,
      maxGForce: parseFloat(maxGForceRef.current.toFixed(2))
    });
  };

  const startTrip = () => {
    requestWakeLock();
    setIsDriving(true);
    isDrivingRef.current = true;
    setIsJumpStart(false);
    setStartTime(new Date());
    tripStartTimeRef.current = Date.now();
    tripRoutePointsRef.current = [];
    telemetryRef.current = [];
    setRoutePoints([]);
    setTelemetry([]);
    setPeakSpeed(0);
    peakSpeedRef.current = 0;
    totalDistanceRef.current = 0;
    setTripDistance(0);
    setLastRunSummary(null);
    setIsDragFinished(false);
    isDragFinishedRef.current = false;
    split100Ref.current = null;
    split60Ref.current = null;
    split200Ref.current = null;
    split402Ref.current = null;
    maxGForceRef.current = 0;
  };

  const startDragCountdown = () => {
    if (speed > 1.5) return;
    requestWakeLock();
    setLastRunSummary(null);
    setIsJumpStart(false);
    setIsDragFinished(false);
    isDragFinishedRef.current = false;
    setDragTime(0);
    setCountdown(0);
    countdownRef.current = 0;
    totalDistanceRef.current = 0;
    setTripDistance(0);
    peakSpeedRef.current = 0;
    setPeakSpeed(0);
    split100Ref.current = null;
    split60Ref.current = null;
    split200Ref.current = null;
    split402Ref.current = null;
    
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const next = prev + 1;
        countdownRef.current = next;
        if (next === 6) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setIsDriving(true);
          isDrivingRef.current = true;
          tripStartTimeRef.current = Date.now();
          if (runModeRef.current !== '100-200') {
            isWaitingForLaunchRef.current = true;
            setIsWaitingForLaunch(true);
          } else {
            startDragTimer();
          }
        }
        return next;
      });
    }, 800);
  };

  const stopTrip = () => {
    if (isDrivingRef.current && runModeRef.current === 'free') {
      const finalTime = tripStartTimeRef.current ? (Date.now() - tripStartTimeRef.current) / 1000 : 0;
      finalizeRun(finalTime, totalDistanceRef.current);
    }
    setIsDriving(false);
    isDrivingRef.current = false;
    setIsDragActive(false);
    isDragActiveRef.current = false;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(0);
    countdownRef.current = 0;
  };

  const resetTrip = () => {
    stopTrip();
    setTripTime(0);
    setTripDistance(0);
    setPeakSpeed(0);
    totalDistanceRef.current = 0;
    peakSpeedRef.current = 0;
    setDragTime(0);
    setLastRunSummary(null);
    setIsDragFinished(false);
    isDragFinishedRef.current = false;
  };

  return (
    <DrivingContext.Provider value={{
      speed, rawSpeed, acceleration, isDriving, peakSpeed, tripTime, tripDistance, hasGps, gpsAccuracy,
      currentCoords, heading, routePoints, telemetry, startTime,
      runMode, setRunMode, dragTime, isDragFinished, isDragActive, isWaitingForLaunch,
      isWakeLockActive, countdown, isJumpStart, lastRunSummary, setLastRunSummary,
      startTrip, startDragCountdown, stopTrip, resetTrip, requestWakeLock
    }}>
      {children}
    </DrivingContext.Provider>
  );
}

export const useDriving = () => {
  const context = useContext(DrivingContext);
  if (context === undefined) throw new Error('useDriving must be used within a DrivingProvider');
  return context;
};
