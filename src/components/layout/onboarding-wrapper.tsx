
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Gauge, Zap, Radio, Trophy, ChevronRight, X, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const ONBOARDING_KEY = 'driverank_onboarding_completed';

const SCREENS = [
  {
    title: "DriveRank – Performance & Radar",
    description: "Aplikacioni suprem për shoferët në Kosovë.",
    icon: Gauge,
    iconColor: "text-accent",
    items: [
      "Mat shpejtësinë me precizion satelitor",
      "Track Drag (0–100, 100–200)",
      "Radar & Polic alerts live nga komuniteti"
    ]
  },
  {
    title: "Modi Drag",
    description: "Mat performancën tënde reale.",
    icon: Zap,
    iconColor: "text-yellow-500",
    items: [
      "Fillon automatikasht vetëm nga 0 km/h",
      "Mat kohën për 0-60, 0-100 & 1/4 Mile",
      "Telemetri profesionale për çdo run"
    ]
  },
  {
    title: "Radarët Live",
    description: "Siguri dhe bashkëpunim në rrugë.",
    icon: Radio,
    iconColor: "text-red-500",
    items: [
      "Raporto Radarë dhe Polici me një klik",
      "Njoftime live kur i afrohesh zonës",
      "Rrezja e mbulimit: 2km rreth teje"
    ]
  },
  {
    title: "Renditja (Leaderboard)",
    description: "Bëhu pjesë e elitës së shoferëve.",
    icon: Trophy,
    iconColor: "text-accent",
    items: [
      "Krahasohu me shoferët e qytetit tënd",
      "Renditja kombëtare në mbarë Kosovën",
      "Shiko vendin tënd (p.sh. #1 Prizren sot)"
    ],
    hook: "Shiko sa shpejt je krahasuar me të tjerët në qytetin tënd!"
  }
];

export function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const profileRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, "users", user.uid);
  }, [user?.uid, db]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const localCompleted = localStorage.getItem(ONBOARDING_KEY) === 'true';
      
      if (user && profile) {
        setShowOnboarding(!profile.onboardingCompleted);
      } else if (!user && !isUserLoading) {
        setShowOnboarding(!localCompleted);
      }
    };

    if (!isUserLoading && !isProfileLoading) {
      checkStatus();
    }
  }, [user, profile, isUserLoading, isProfileLoading]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const handleFinish = async () => {
    setIsRequestingPermission(true);
    
    // Kërkojmë lejen e GPS përpara se të përfundojmë onboarding
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true, 
            timeout: 8000,
            maximumAge: 0
          });
        });
      } catch (e) {
        console.warn("GPS Permission denied or timeout during onboarding", e);
      }
    }

    localStorage.setItem(ONBOARDING_KEY, 'true');
    
    if (profileRef) {
      updateDocumentNonBlocking(profileRef, {
        onboardingCompleted: true,
        updatedAt: new Date().toISOString()
      });
    }
    
    setShowOnboarding(false);
    setIsRequestingPermission(false);
    window.dispatchEvent(new Event('onboarding_complete'));
  };

  if (showOnboarding === null) return null;
  if (!showOnboarding) return <>{children}</>;

  const isLastScreen = selectedIndex === SCREENS.length - 1;

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col">
      <div className="absolute top-12 right-6 z-[10001]">
        <button 
          onClick={handleFinish}
          disabled={isRequestingPermission}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors disabled:opacity-50"
        >
          Anashkalo <X className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {SCREENS.map((screen, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 h-full flex flex-col items-center justify-center px-8 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,224,244,0.05)_0%,transparent_70%)] pointer-events-none" />
              
              <div className={cn(
                "w-24 h-24 rounded-[2.5rem] bg-zinc-950 border border-white/5 flex items-center justify-center shadow-2xl mb-10 apple-scale-in",
                index === selectedIndex ? "opacity-100" : "opacity-0"
              )}>
                <screen.icon className={cn("w-12 h-12", screen.iconColor)} />
              </div>

              <div className="space-y-6 text-center max-w-sm">
                <div className="space-y-2 apple-slide-up">
                  <h1 className="text-2xl font-black tracking-tighter uppercase leading-tight text-white">
                    {screen.title}
                  </h1>
                  <p className="text-xs font-bold text-accent uppercase tracking-widest opacity-60">
                    {screen.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4 apple-slide-up stagger-1">
                  {screen.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-left transition-all">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <p className="text-xs font-medium text-white/80 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>

                {screen.hook && (
                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] pt-4 animate-pulse-glow">
                    {screen.hook}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-10 flex flex-col items-center gap-8 relative z-[10001]">
        <div className="flex gap-2.5">
          {SCREENS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-700",
                i === selectedIndex ? "w-8 bg-accent shadow-[0_0_10px_#4de0f4]" : "w-1.5 bg-white/10"
              )} 
            />
          ))}
        </div>

        <Button 
          onClick={isLastScreen ? handleFinish : () => emblaApi?.scrollNext()}
          disabled={isRequestingPermission}
          className={cn(
            "w-full h-16 rounded-[2rem] font-black text-sm uppercase tracking-[0.25em] transition-all border-b-4 shadow-2xl active:scale-95",
            isLastScreen 
              ? "bg-accent text-background border-accent/70 shadow-accent/20" 
              : "bg-white/10 text-white border-white/10 hover:bg-white/20"
          )}
        >
          {isRequestingPermission ? (
            <div className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> LEJO GPS...</div>
          ) : isLastScreen ? (
            <div className="flex items-center gap-2">FILLO TANI <ChevronRight className="w-5 h-5" /></div>
          ) : "Vazhdo"}
        </Button>
        
        {isLastScreen && !isRequestingPermission && (
          <div className="flex items-center gap-2 opacity-40">
            <MapPin className="w-3 h-3 text-accent" />
            <p className="text-[8px] font-bold uppercase tracking-widest text-white">Sistemi do kërkojë qasjen në GPS</p>
          </div>
        )}
      </div>
    </div>
  );
}
