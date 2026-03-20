
'use client';

import React from 'react';

export const CarIcons = {
  turbo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
<<<<<<< HEAD
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 12l4-4" />
      <path d="M12 12l-4 4" />
      <path d="M12 12l4 4" />
      <path d="M12 12l-4-4" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 7v2" />
      <path d="M12 15v2" />
      <path d="M7 12h2" />
      <path d="M15 12h2" />
=======
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
      <path d="M14.5 14.5l-5-5" />
      <path d="M9.5 14.5l5-5" />
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    </svg>
  ),
  speedometer: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      <path d="M12 12v.01" />
<<<<<<< HEAD
=======
      <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.2" />
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    </svg>
  ),
  crown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
<<<<<<< HEAD
=======
      <circle cx="12" cy="12" r="1" fill="currentColor" />
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    </svg>
  ),
  lightning: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2 L3 14 H12 L11 22 L21 10 H12 L13 2 Z" />
    </svg>
  ),
  shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
<<<<<<< HEAD
      <circle cx="12" cy="12" r="3" />
=======
      <path d="M12 8v8" />
      <path d="M8 12h8" />
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    </svg>
  ),
  flame: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.254 1.214-3.13C6.1 11.8 7 12 8 13.5" />
    </svg>
  ),
};

export type CarIconType = keyof typeof CarIcons;

<<<<<<< HEAD
export function RenderCarIcon({ type, className }: { type?: string; className?: string }) {
  const IconComponent = CarIcons[type as CarIconType] || CarIcons.speedometer;
  return <IconComponent className={className} />;
=======
export const CarIconConfig: Record<CarIconType, { color: string; label: string }> = {
  turbo: { color: "text-cyan-400", label: "Turbo" },
  speedometer: { color: "text-white", label: "Speed" },
  crown: { color: "text-yellow-500", label: "Elite" },
  lightning: { color: "text-blue-400", label: "Electric" },
  shield: { color: "text-zinc-400", label: "Pro" },
  flame: { color: "text-red-500", label: "Power" },
};

export function RenderCarIcon({ type, className }: { type?: string; className?: string }) {
  const iconType = (type as CarIconType) || 'speedometer';
  const IconComponent = CarIcons[iconType] || CarIcons.speedometer;
  const config = CarIconConfig[iconType] || CarIconConfig.speedometer;
  
  // If a className is provided, we use it, otherwise we fallback to the default config color
  const finalClass = className || config.color;
  
  return <IconComponent className={finalClass} />;
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
}
