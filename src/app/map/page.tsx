"use client"

import { useState, useEffect, useMemo, use } from "react";
import dynamic from "next/dynamic";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Navigation, Loader2, MapPin, Play, Target, X, 
  Zap, Landmark, Mountain, Flag, Building2, Utensils, 
  Coffee, Fuel, Hotel, Timer, ChevronUp, ChevronDown, 
  StopCircle as StopIcon, Radio, Layers
} from "lucide-react";
import { useFirestore, useMemoFirebase, addDocumentNonBlocking, useUser, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useDriving } from "@/context/driving-context";
import { calculateRoutes } from "@/services/navigation/routeService";
import { searchLocations, SearchResult } from "@/services/navigation/geocodingService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, addSeconds } from "date-fns";
import { ManeuverIcon } from "@/components/navigation/maneuver-icon";

const DriveRankMap = dynamic(() => import("@/components/map/DriveRankMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-accent" />
    </div>
  )
});

type ReportType = 'Radar' | 'Polici' | 'Kontrollë';

export default function NavigationPage({ params }: { params: Promise<any> }) {
  use(params);
  
  const { 
    speed, currentCoords, heading,
    destination, routeData, availableRoutes, isNavigating,
    currentStep, currentRoadName, distanceToNextStep, remainingDuration, remainingDistance,
    setDestination, setRouteData, setAvailableRoutes, setIsNavigating, clearNavigation
  } = useDriving();
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [forceCenter, setForceCenter] = useState(0);
  const [isReporting, setIsReporting] = useState<ReportType | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, "users", user.uid);
  }, [user?.uid, db]);
  const { data: profile } = useDoc(profileRef);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchLocations(searchQuery);
          setSearchResults(results);
        } catch (e) { 
          console.error("Kërkimi dështoi:", e); 
        } finally { 
          setIsSearching(false); 
        }
      } else { 
        setSearchResults([]); 
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectDestination = async (result: SearchResult) => {
    setDestination(result);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);
    
    if (!currentCoords) {
      toast({ variant: "destructive", title: "LOKACIONI GABIM", description: "Ju lutem aktivizoni GPS-in." });
      return;
    }

    try {
      setIsSearching(true);
      const routes = await calculateRoutes(currentCoords, { lat: result.lat, lng: result.lng });
      if (routes && routes.length > 0) {
        setAvailableRoutes(routes);
        setRouteData(routes[0]);
      } else {
        toast({ variant: "destructive", title: "RRETHI GABIM", description: "Nuk u gjet asnjë rrugë për këtë lokacion." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "SISTEMI GABIM", description: "Dështoi llogaritja e rrugës." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickReport = async (type: ReportType) => {
    if (!db || !currentCoords || !user?.uid) {
      toast({ variant: "destructive", title: "GPS GABIM", description: "Lokacioni juaj nuk është i disponueshëm." });
      return;
    }
    setIsReporting(type);
    
    const reportsCol = collection(db, "radar_reports");
    addDocumentNonBlocking(reportsCol, {
      type,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      location: "Raport i Shpejtë",
      city: profile?.city || "Kosovë",
      createdAt: new Date().toISOString(),
      userId: user?.uid
    });
    
    setTimeout(() => {
      setIsReporting(null);
      toast({ title: "U RAPORTUA!", description: `${type} u shënua me sukses.` });
    }, 500);
  };

  const handleStartNav = () => {
    if (!routeData) return;
    setIsNavigating(true);
    setIsInfoExpanded(true);
  };

  const getIconForCategory = (category?: string) => {
    switch (category) {
      case 'city': return <Building2 className="w-5 h-5 text-red-500" />;
      case 'village': return <Flag className="w-5 h-5 text-blue-400" />;
      case 'fuel': return <Fuel className="w-5 h-5 text-blue-500" />;
      case 'food': return <Utensils className="w-5 h-5 text-orange-400" />;
      case 'hotel': return <Hotel className="w-5 h-5 text-purple-400" />;
      case 'mountain': return <Mountain className="w-5 h-5 text-green-500" />;
      case 'landmark': return <Landmark className="w-5 h-5 text-yellow-500" />;
      default: return <MapPin className="w-5 h-5 text-accent" />;
    }
  };

  const arrivalTime = useMemo(() => {
    if (!isNavigating || !remainingDuration) return null;
    return addSeconds(new Date(), remainingDuration);
  }, [isNavigating, remainingDuration]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-[#050505] relative overflow-hidden selection:bg-accent/30 font-light">
      <div className="absolute inset-0 z-0">
        <DriveRankMap 
          userLocation={currentCoords} 
          heading={heading}
          route={routeData?.coordinates || null} 
          availableRoutes={availableRoutes}
          alerts={[]}
          destination={destination}
          isNavigating={isNavigating}
          forceCenter={forceCenter}
          speed={speed}
          zoom={17}
          isSearchActive={isSearchFocused}
          currentRoadName={currentRoadName}
        />
      </div>

      <div className="absolute top-10 left-4 right-4 z-50 flex flex-col gap-3">
        {!isNavigating ? (
          <div className="relative apple-slide-up">
            <Card className="glass-card p-3 px-5 rounded-[2rem] border-white/10 shadow-2xl flex items-center gap-4 bg-zinc-950/90 backdrop-blur-3xl h-16">
              <Search className="w-6 h-6 text-accent shrink-0" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 300)}
                placeholder="Ku do të shkosh?"
                className="bg-transparent border-none h-full p-0 text-white placeholder:text-zinc-600 focus-visible:ring-0 font-bold text-lg" 
              />
              {isSearching && <Loader2 className="w-5 h-5 animate-spin text-accent" />}
              {(searchQuery || destination) && (
                <button onClick={() => { clearNavigation(); setSearchQuery(""); }} className="text-zinc-500 hover:text-white p-2">
                  <X className="w-6 h-6" />
                </button>
              )}
            </Card>

            {searchResults.length > 0 && isSearchFocused && (
              <Card className="mt-3 glass-card border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[450px] overflow-y-auto no-scrollbar bg-zinc-950/95 relative z-[60] apple-scale-in p-2">
                {searchResults.map((result, idx) => (
                  <button 
                    key={idx}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectDestination(result)}
                    className="w-full p-5 flex items-center gap-5 hover:bg-white/5 rounded-[2rem] text-left transition-all group"
                  >
                    <div className="shrink-0 w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      {getIconForCategory(result.category)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-base font-bold text-white truncate uppercase tracking-tight">{result.name}</span>
                      <span className="text-[10px] text-zinc-500 truncate mt-1 uppercase tracking-widest font-bold">{result.displayName}</span>
                    </div>
                  </button>
                ))}
              </Card>
            )}
          </div>
        ) : (
          <Card className="bg-[#1c2a3d]/95 backdrop-blur-3xl p-6 rounded-[2.5rem] border-white/10 shadow-2xl apple-scale-in border-b-4 border-blue-500/30">
             <div className="flex items-center gap-6">
               <div className="w-14 h-14 bg-blue-500/20 rounded-[1.8rem] flex items-center justify-center shrink-0 border-2 border-blue-500/20 shadow-lg">
                 <ManeuverIcon 
                    type={currentStep?.type} 
                    modifier={currentStep?.modifier} 
                    className="w-8 h-8 text-blue-400" 
                  />
               </div>
               <div className="flex-1 min-w-0">
                 <h2 className="text-lg font-bold text-white leading-tight uppercase tracking-tight">
                   {currentStep?.instruction || "Vazhdoni drejt"}
                 </h2>
                 <div className="flex items-center gap-3 mt-1.5">
                   <Badge className="bg-blue-500 text-white font-bold text-[10px] rounded-lg">
                    {distanceToNextStep >= 1000 ? `${(distanceToNextStep / 1000).toFixed(1)} km` : `${distanceToNextStep} m`}
                   </Badge>
                   <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate">
                     {currentRoadName}
                   </span>
                 </div>
               </div>
               <button 
                 onClick={() => clearNavigation()}
                 className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
          </Card>
        )}
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
         <button onClick={() => handleQuickReport('Radar')} className="w-14 h-14 rounded-[1.8rem] bg-red-600 text-white shadow-2xl flex items-center justify-center active:scale-90 transition-all border-b-4 border-red-800">
           <Radio className="w-7 h-7" />
         </button>
         <button onClick={() => setForceCenter(prev => prev + 1)} className="w-14 h-14 rounded-[1.8rem] bg-zinc-900 border-2 border-white/10 text-white shadow-2xl flex items-center justify-center active:scale-90 transition-all">
            <Target className="w-7 h-7 text-accent" />
          </button>
          <button className="w-14 h-14 rounded-[1.8rem] bg-zinc-900 border-2 border-white/10 text-white shadow-2xl flex items-center justify-center active:scale-90 transition-all">
            <Layers className="w-7 h-7 text-white/40" />
          </button>
      </div>

      <div className="absolute bottom-28 left-4 right-4 z-40">
        {routeData && !isNavigating ? (
          <div className="space-y-4 apple-slide-up">
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {availableRoutes.map((route, idx) => (
                <Card 
                  key={idx}
                  onClick={() => setRouteData(route)}
                  className={cn(
                    "flex-shrink-0 p-6 rounded-[2.5rem] border-[3px] transition-all cursor-pointer min-w-[200px] bg-zinc-950/98 backdrop-blur-3xl shadow-2xl",
                    routeData === route ? "border-accent" : "border-white/5 opacity-50"
                  )}
                >
                  <div className="flex flex-col">
                    <Badge className={cn("text-[9px] font-bold mb-4 w-fit uppercase tracking-[0.2em]", idx === 0 ? "bg-red-600" : "bg-zinc-800")}>
                      {idx === 0 ? "MË E SHPEJTA" : "ALTERNATIVE"}
                    </Badge>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white tracking-tighter">
                        {Math.round(route.duration / 60)}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">MIN</span>
                    </div>
                    <span className="text-xs font-bold text-accent mt-1.5 uppercase tracking-widest">
                      {(route.distance / 1000).toFixed(1)} KM
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => clearNavigation()} className="flex-1 h-18 rounded-[2rem] border-2 border-white/10 bg-black/40 text-white font-bold uppercase text-[11px] tracking-widest hover:bg-white/5 transition-all active:scale-95">
                ANULO
              </button>
              <Button onClick={handleStartNav} className="flex-[2.5] h-18 bg-accent text-background font-bold uppercase text-sm tracking-[0.2em] rounded-[2rem] shadow-[0_15px_40px_rgba(77,224,244,0.4)] active:scale-95 transition-all border-b-4 border-accent/70">
                NISU TANI <Play className="w-5 h-5 ml-2 fill-current" />
              </Button>
            </div>
          </div>
        ) : isNavigating && routeData ? (
          <Card 
            className={cn(
              "glass-card bg-zinc-950/95 backdrop-blur-3xl rounded-[3rem] border-white/10 shadow-[0_-25px_60px_rgba(0,0,0,0.6)] apple-slide-up transition-all duration-500 ease-in-out overflow-hidden flex flex-col",
              isInfoExpanded ? "p-8" : "p-4 h-20"
            )}
          >
            <button 
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
              className="w-full flex flex-col items-center gap-2 mb-3 active:opacity-50 transition-opacity"
            >
              <div className="w-14 h-1.5 bg-white/10 rounded-full" />
              {!isInfoExpanded && (
                <div className="flex items-center gap-6 text-white font-bold text-sm uppercase tracking-[0.2em]">
                   <span>{arrivalTime ? format(arrivalTime, "HH:mm") : "--:--"}</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                   <span>{(remainingDistance / 1000).toFixed(1)} KM</span>
                </div>
              )}
            </button>

            <div className={cn(
              "transition-all duration-500 ease-in-out flex flex-col",
              isInfoExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none h-0"
            )}>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col">
                   <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-bold text-white tracking-tighter">{arrivalTime ? format(arrivalTime, "HH:mm") : "--:--"}</span>
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ARRITJA</span>
                   </div>
                   <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] mt-2">{destination?.name}</p>
                 </div>
                 
                 <div className="flex gap-8">
                   <div className="flex flex-col items-center">
                     <div className="flex items-baseline gap-1.5">
                       <span className="text-2xl font-bold text-white">{Math.round(remainingDuration / 60)}</span>
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">min</span>
                     </div>
                     <Timer className="w-5 h-5 text-accent mt-2" />
                   </div>
                   <div className="flex flex-col items-center">
                     <div className="flex items-baseline gap-1.5">
                       <span className="text-2xl font-bold text-white">{(remainingDistance / 1000).toFixed(1)}</span>
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">km</span>
                     </div>
                     <Navigation className="w-5 h-5 text-accent mt-2" />
                   </div>
                 </div>
              </div>
              
              <Button 
                onClick={() => clearNavigation()} 
                className="w-full h-16 rounded-[1.8rem] bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold uppercase text-xs tracking-[0.2em] transition-all active:scale-95 border-2 border-red-600/20"
              >
                NDALO RRUGËTIMIN <StopIcon className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}
