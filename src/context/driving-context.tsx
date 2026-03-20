<<<<<<< HEAD

'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
=======
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
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d

interface TelemetryPoint {
  time: number;
  speed: number;
  distance: number;
}

<<<<<<< HEAD
export type RunMode = 'free' | '0-100' | '100-200' | '1/4mile';

interface DrivingContextType {
  speed: number;
=======
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
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
  isDriving: boolean;
  peakSpeed: number;
  tripTime: number;
  tripDistance: number;
  hasGps: boolean;
<<<<<<< HEAD
  currentCoords: { lat: number; lng: number } | null;
=======
  gpsAccuracy: number | null;
  currentCoords: { lat: number; lng: number } | null;
  heading: number | null;
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
  routePoints: [number, number][];
  telemetry: TelemetryPoint[];
  startTime: Date | null;
  runMode: RunMode;
  dragTime: number | null;
  isDragFinished: boolean;
  isDragActive: boolean;
  isWakeLockActive: boolean;
<<<<<<< HEAD
  setRunMode: (mode: RunMode) => void;
  startTrip: () => void;
  stopTrip: () => void;
  resetTrip: () => void;
=======
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
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
}

const DrivingContext = createContext<DrivingContextType | undefined>(undefined);

<<<<<<< HEAD
export function DrivingProvider({ children }: { children: React.ReactNode }) {
  // UI State
  const [speed, setSpeed] = useState(0);
  const [isDriving, setIsDriving] = useState(false);
  const [peakSpeed, setPeakSpeed] = useState(0);
  const [tripTime, setTripTime] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);
  const [hasGps, setHasGps] = useState(true); // Default true until denied
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
=======
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
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [runMode, setRunMode] = useState<RunMode>('free');
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [isDragFinished, setIsDragFinished] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
<<<<<<< HEAD
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  // Precision Engine Refs
=======
  const [isWaitingForLaunch, setIsWaitingForLaunch] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isJumpStart, setIsJumpStart] = useState(false);
  const [lastRunSummary, setLastRunSummary] = useState<RunSummaryData | null>(null);

>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
  const isDrivingRef = useRef(false);
  const runModeRef = useRef<RunMode>('free');
  const totalDistanceRef = useRef(0);
  const peakSpeedRef = useRef(0);
<<<<<<< HEAD
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
=======
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
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsWakeLockActive(true);
      } catch (err) {
<<<<<<< HEAD
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
=======
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

>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    let watchId: number;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
<<<<<<< HEAD
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
=======
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
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
                setTripDistance(totalDistanceRef.current);
              }
            }

<<<<<<< HEAD
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
=======
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
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
  };

  return (
    <DrivingContext.Provider value={{
<<<<<<< HEAD
      speed, isDriving, peakSpeed, tripTime, tripDistance, hasGps, 
      currentCoords, routePoints, telemetry, startTime, 
      runMode, dragTime, isDragFinished, isDragActive, isWakeLockActive,
      setRunMode: handleSetRunMode, startTrip, stopTrip, resetTrip
=======
      speed, rawSpeed, acceleration, isDriving, peakSpeed, tripTime, tripDistance, hasGps, gpsAccuracy,
      currentCoords, heading, routePoints, telemetry, startTime,
      runMode, setRunMode, dragTime, isDragFinished, isDragActive, isWaitingForLaunch,
      isWakeLockActive, countdown, isJumpStart, lastRunSummary, setLastRunSummary,
      startTrip, startDragCountdown, stopTrip, resetTrip, requestWakeLock
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    }}>
      {children}
    </DrivingContext.Provider>
  );
}

export const useDriving = () => {
  const context = useContext(DrivingContext);
<<<<<<< HEAD
  if (!context) throw new Error('useDriving must be used within a DrivingProvider');
=======
  if (context === undefined) throw new Error('useDriving must be used within a DrivingProvider');
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
  return context;
};
