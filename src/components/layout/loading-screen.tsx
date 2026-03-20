
'use client';

import { useState, useEffect } from 'react';
import { Gauge, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setLoading(false), 500); 
<<<<<<< HEAD
    }, 2200);
=======
    }, 1500);
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d

    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !loading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-500 px-6",
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
<<<<<<< HEAD
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,224,244,0.12)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="relative flex flex-col items-center gap-8 w-full max-w-xs">
        <div className="relative">
          <div className="absolute inset-[-30px] rounded-full bg-accent/20 blur-3xl animate-pulse" />
          <div className="absolute inset-[-15px] rounded-full bg-red-600/15 blur-2xl animate-pulse delay-75" />
          
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-zinc-950 border-2 border-white/5 rounded-[2.5rem] flex items-center justify-center z-10 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/15 to-red-600/15" />
            <Gauge className="w-12 h-12 sm:w-14 sm:h-14 text-accent drop-shadow-[0_0_15px_rgba(77,224,244,0.5)]" />
            <div className="absolute inset-0 w-full h-1 bg-accent/20 animate-scan opacity-40" />
          </div>

          <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-xl border-4 border-black z-20 shadow-xl italic tracking-tighter">
             #1
          </div>
        </div>
        
        <div className="text-center space-y-4 z-10 w-full">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic leading-none text-white">
              DriveRank<span className="text-red-600"> Kosova</span>
            </h1>
            <p className="text-[10px] font-black text-red-600 tracking-[0.2em] uppercase">Champion Edition #1</p>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-accent via-red-600 to-accent w-full animate-loading-progress" />
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
              Initializing Telemetry
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-30">
        <Loader2 className="w-4 h-4 animate-spin text-accent" />
        <span className="text-[7px] font-black uppercase tracking-[0.3em]">SECURE_SERVER_SYNC</span>
      </div>
=======
      <div className="relative flex flex-col items-center gap-6 w-full max-w-xs text-center">
        <div className="w-20 h-20 bg-zinc-950 border border-white/5 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
          <Gauge className="w-10 h-10 text-accent" />
          <div className="absolute inset-0 w-full h-1 bg-accent/20 animate-scan" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tighter uppercase text-white">
            DriveRank<span className="text-red-600"> Kosova</span>
          </h1>
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-accent w-full animate-loading-progress" />
          </div>
          <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
            LIDHJA ME SATELITIN...
          </p>
        </div>
      </div>
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    </div>
  );
}
