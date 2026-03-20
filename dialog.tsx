
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
    }, 1500);

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
    </div>
  );
}
