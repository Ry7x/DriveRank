'use client';

import React from 'react';
import { 
  ArrowUp, ArrowUpRight, ArrowUpLeft, ArrowRight, ArrowLeft, 
  CornerUpRight, CornerUpLeft, RefreshCcw, Navigation, Flag, 
  Undo2, Merge, Split, LogOut 
} from 'lucide-react';

interface ManeuverIconProps {
  type?: string;
  modifier?: string;
  className?: string;
}

/**
 * Shfaq ikonën e duhur bazuar në llojin e manovrës së navigimit nga OSRM.
 */
export function ManeuverIcon({ type, modifier, className }: ManeuverIconProps) {
  if (!type) return <Navigation className={className} />;

  // Manovrat kryesore: Kthesat, Rampat, etj.
  if (type === 'turn' || type === 'on ramp' || type === 'off ramp' || type === 'ramp' || type === 'fork') {
    switch (modifier) {
      case 'right': return <ArrowRight className={className} />;
      case 'left': return <ArrowLeft className={className} />;
      case 'slight right': return <ArrowUpRight className={className} />;
      case 'slight left': return <ArrowUpLeft className={className} />;
      case 'sharp right': return <CornerUpRight className={className} />;
      case 'sharp left': return <CornerUpLeft className={className} />;
      case 'uturn': return <Undo2 className={className} />;
      case 'straight': return <ArrowUp className={className} />;
    }
  }

  // Rrethrrotullimet
  if (type.includes('roundabout') || type === 'rotary') {
    return <RefreshCcw className={className} />;
  }

  // Raste të tjera specifike
  if (type === 'merge') return <Merge className={className} />;
  if (type === 'fork') return <Split className={className} />;
  if (type === 'exit roundabout') return <LogOut className={className} />;
  if (type === 'arrive') return <Flag className={className} />;
  if (type === 'depart') return <Navigation className={className} />;

  // Default icon
  return <ArrowUp className={className} />;
}
