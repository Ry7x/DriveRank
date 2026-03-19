
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 15% 4%;
    --foreground: 0 0% 98%;
    --card: 210 15% 8%;
    --card-foreground: 0 0% 98%;
    --popover: 210 15% 6%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 72% 51%;
    --primary-foreground: 0 0% 98%;
    --secondary: 187 88% 63%;
    --secondary-foreground: 210 15% 10%;
    --muted: 210 15% 12%;
    --muted-foreground: 210 10% 65%;
    --accent: 187 88% 63%;
    --accent-foreground: 210 15% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 210 15% 12%;
    --input: 210 15% 12%;
    --ring: 0 72% 51%;
    --radius: 1.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
    -webkit-tap-highlight-color: transparent;
  }
  html, body {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: black;
    @apply antialiased text-foreground;
    font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
}

@layer utilities {
  .glass {
    @apply bg-card/70 backdrop-blur-3xl border border-white/5 shadow-2xl;
  }
  .glass-card {
    @apply bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-2xl;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .safe-bottom {
    padding-bottom: calc(env(safe-area-inset-bottom) + 6.5rem);
  }
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
  .app-container {
    @apply w-full h-full relative flex flex-col bg-background overflow-hidden;
    min-height: 100dvh;
    max-height: 100dvh;
  }
  
  .apple-slide-up {
    animation: apple-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .apple-scale-in {
    animation: apple-scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.1s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.2s; }
  .stagger-5 { animation-delay: 0.25s; }

  @keyframes apple-slide-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes apple-scale-in {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  .leaflet-container {
    background: #0a0a0a !important;
  }

  .transition-smooth {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes text-gradient-move {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .animate-text-red-purple {
    background: linear-gradient(90deg, #ef4444, #a855f7, #ef4444);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: text-gradient-move 3s linear infinite;
    filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.5));
  }

  .animate-text-yellow-cyan {
    background: linear-gradient(90deg, #eab308, #4de0f4, #eab308);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: text-gradient-move 3s linear infinite;
    filter: drop-shadow(0 0 5px rgba(234, 179, 8, 0.5));
  }

  .animate-text-blue-grey {
    background: linear-gradient(90deg, #3b82f6, #9ca3af, #3b82f6);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: text-gradient-move 3s linear infinite;
    filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.3));
  }

  @keyframes pulse-red {
    0%, 100% {
      box-shadow: 0 0 25px rgba(220, 38, 38, 0.5);
      transform: scale(1.1);
    }
    50% {
      box-shadow: 0 0 45px rgba(220, 38, 38, 0.8), 0 0 15px rgba(220, 38, 38, 0.4);
      transform: scale(1.18);
    }
  }

  .animate-pulse-red {
    animation: pulse-red 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
  }
}

@keyframes scan {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 0.4; }
  100% { transform: translateY(100%); opacity: 0; }
}

.animate-scan {
  animation: scan 12s linear infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.002); }
}

@keyframes loading-progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-loading-progress {
  animation: loading-progress 4s linear infinite;
}

@keyframes draw-route {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.animate-draw-route {
  animation: draw-route 4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
