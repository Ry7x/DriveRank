
"use client"

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Share2, MapPin, Loader2, UserCircle, Car, Gauge, Cpu, Zap, ChevronLeft, Trash2, Palette, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useCollection, deleteDocumentNonBlocking, useAuth } from "@/firebase";
import { doc, collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RenderCarIcon, CarIconType } from "@/components/icons/car-icons";

export default function ProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const targetUserId = params.userId as string;
  const { user: currentUser } = useUser();
  const auth = useAuth();
  const isOwnProfile = currentUser?.uid === targetUserId;
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    city: "",
    carBrand: "",
    carModel: "",
    carColor: "",
    horsepower: 0,
    modifications: "",
    profileIcon: "speedometer" as CarIconType,
  });

  const profileRef = useMemoFirebase(() => {
    if (!targetUserId || !db) return null;
    return doc(db, "users", targetUserId);
  }, [targetUserId, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const runsQuery = useMemoFirebase(() => {
    if (!targetUserId || !db) return null;
    return query(
      collection(db, "users", targetUserId, "runs"),
      orderBy("createdAt", "desc")
    );
  }, [targetUserId, db]);

  const { data: runs } = useCollection(runsQuery);

  const stats = useMemo(() => {
    if (!runs) return { totalRuns: 0, totalKm: "0.00", peak: 0 };
    const totalDistance = runs.reduce((acc, run) => acc + (run.distanceMeters || 0), 0);
    const peakSpeed = runs.reduce((max, run) => Math.max(max, run.peakSpeedKmH || 0), 0);
    return {
      totalRuns: runs.length,
      totalKm: (totalDistance / 1000).toFixed(2),
      peak: peakSpeed
    };
  }, [runs]);

  useEffect(() => {
    if (profile && isOwnProfile) {
      setFormData({
        username: profile.username || "",
        city: profile.city || "",
        carBrand: profile.carBrand || "",
        carModel: profile.carModel || "",
        carColor: profile.carColor || "",
        horsepower: profile.horsepower || 0,
        modifications: profile.modifications || "",
        profileIcon: (profile.profileIcon as CarIconType) || "speedometer",
      });
    }
  }, [profile, isOwnProfile]);

  const handleSaveProfile = () => {
    if (!profileRef || !isOwnProfile) return;

    const updatedData = {
      ...formData,
      horsepower: Number(formData.horsepower),
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(profileRef, updatedData);
    toast({ title: "🔥 PROFILI U PËRDITËSUA", description: "Të dhënat u ruajtën me sukses." });
    setIsEditDialogOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/");
      toast({ title: "Dole me sukses", description: "Shihemi së shpejti!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gabim", description: "Dështoi dalja nga llogaria." });
    }
  };

  const handleResetStats = async () => {
    if (!db || !targetUserId || !isOwnProfile) return;
    setIsResetting(true);
    
    try {
      const userRunsRef = collection(db, "users", targetUserId, "runs");
      const userRunsSnap = await getDocs(userRunsRef);
      userRunsSnap.forEach((d) => {
        deleteDocumentNonBlocking(doc(db, "users", targetUserId, "runs", d.id));
      });

      const publicRunsRef = collection(db, "public_runs");
      const q = query(publicRunsRef, where("userId", "==", targetUserId));
      const publicRunsSnap = await getDocs(q);
      publicRunsSnap.forEach((d) => {
        deleteDocumentNonBlocking(doc(db, "public_runs", d.id));
      });

      toast({
        title: "Statistikat u resetuan",
        description: "Të gjitha të dhënat dhe rekordet janë fshirë.",
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error resetting stats:", error);
      toast({ variant: "destructive", title: "Gabim", description: "Dështoi resetimi." });
    } finally {
      setIsResetting(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-8 text-center safe-top">
        <UserCircle className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
        <h1 className="text-xl font-black uppercase italic">Nuk u gjet 👀</h1>
        <Button onClick={() => router.back()} variant="ghost" className="mt-4 text-accent uppercase font-black italic">KTHEHU</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24 safe-top overflow-x-hidden no-scrollbar">
      <div className="p-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-1">
           <Button onClick={() => router.back()} size="icon" variant="ghost" className="rounded-xl hover:bg-white/5"><ChevronLeft className="w-6 h-6" /></Button>
           <h1 className="text-xl font-black italic uppercase tracking-tighter">🏆 PROFILI</h1>
        </div>
        <div className="flex gap-2">
          {isOwnProfile && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline" className="rounded-xl glass border-white/10 w-10 h-10">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 text-foreground w-[92%] sm:max-w-[425px] max-h-[85vh] overflow-y-auto no-scrollbar rounded-[2.5rem]">
                <DialogHeader><DialogTitle className="text-xl font-black italic uppercase tracking-tighter">Ndrysho Profilin 🔥</DialogTitle></DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Emri i Përdoruesit</Label>
                    <Input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-11" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marka</Label>
                      <Input value={formData.carBrand} onChange={(e) => setFormData({...formData, carBrand: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modeli</Label>
                      <Input value={formData.carModel} onChange={(e) => setFormData({...formData, carModel: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">HP</Label>
                      <Input type="number" value={formData.horsepower} onChange={(e) => setFormData({...formData, horsepower: parseInt(e.target.value) || 0})} className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ngjyra</Label>
                      <Input value={formData.carColor} onChange={(e) => setFormData({...formData, carColor: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modifikimet</Label>
                    <Textarea value={formData.modifications} onChange={(e) => setFormData({...formData, modifications: e.target.value})} className="bg-white/5 border-white/10 rounded-xl min-h-[80px]" />
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full h-11 border-red-500/20 bg-red-500/5 text-red-500 rounded-xl font-bold uppercase italic text-[9px]">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> RESETO STATISTIKAT
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass border-white/10 rounded-[2rem] w-[92%]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg font-black uppercase italic tracking-tighter text-white">Konfirmim 👀</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs text-muted-foreground">
                            Ky veprim do të fshijë përgjithmonë të gjitha garat tuaja.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 flex-row gap-2">
                          <AlertDialogCancel className="flex-1 rounded-xl border-white/10 text-[10px] h-11">ANULO</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleResetStats} 
                            disabled={isResetting}
                            className="flex-1 bg-red-600 text-white rounded-xl text-[10px] h-11"
                          >
                            RESETO
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button variant="outline" onClick={handleSignOut} className="w-full h-11 border-white/10 bg-white/5 text-white rounded-xl font-bold uppercase italic text-[9px]">
                      <LogOut className="w-3.5 h-3.5 mr-2 text-accent" /> DIL NGA LLOGARIA
                    </Button>
                  </div>
                </div>
                <DialogFooter className="pt-2"><Button onClick={handleSaveProfile} className="w-full bg-accent text-background font-black italic uppercase rounded-2xl h-14 shadow-xl">RUAJ NDRYSHIMET 🔥</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button size="icon" variant="outline" className="rounded-xl glass border-white/10 w-10 h-10"><Share2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="px-6 py-2 relative z-10 flex flex-col items-center text-center">
        <div className="relative w-32 h-32 mb-4">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-accent to-blue-600 animate-pulse opacity-20 blur-xl" />
          <div className="relative w-full h-full rounded-[2rem] bg-zinc-950 border-4 border-white/5 shadow-2xl flex items-center justify-center overflow-hidden">
            <RenderCarIcon type={profile?.profileIcon} className="w-16 h-16 text-accent drop-shadow-[0_0_10px_rgba(77,224,244,0.5)]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{profile?.username}</h1>
          <div className="flex flex-col items-center gap-1.5">
            <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent font-black px-4 py-0.5 rounded-full text-[9px]">
              {profile?.isPremium ? '🔥 PREMIUM' : 'SHOFER KOSOVAR'}
            </Badge>
            <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase bg-white/5 px-4 py-1 rounded-full border border-white/5">
              <MapPin className="w-3 h-3 text-accent" />
              📍 {profile?.city}
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full mt-6">
          {[
            { label: "📍 Km Total", val: stats.totalKm },
            { label: "👀 Gara", val: stats.totalRuns.toString() },
            { label: "🏆 Peak", val: `${stats.peak}`, accent: true }
          ].map((stat, i) => (
            <div key={i} className="flex-1 glass rounded-2xl p-3 border-white/5 flex flex-col items-center">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={cn("text-lg font-black italic text-white", stat.accent && "text-accent")}>{stat.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">DETAJET E MJETIT 🔥</h2>
        <Card className="glass border-accent/20 p-6 rounded-[2rem] space-y-6 shadow-2xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-accent rounded-full neon-glow" />
              <div>
                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none mb-0.5">{profile?.carBrand}</h3>
                <p className="text-base font-black italic text-accent/80 uppercase tracking-tighter leading-none">{profile?.carModel}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-white/5 border-white/10 text-accent font-black text-[8px] px-3 py-1 rounded-lg"><Cpu className="w-3 h-3 mr-1.5" />{profile?.horsepower} HP</Badge>
              <Badge className="bg-white/5 border-white/10 text-accent font-black text-[8px] px-3 py-1 rounded-lg"><Palette className="w-3 h-3 mr-1.5" />{profile?.carColor}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-white/10">
            {[ { label: "0-100", val: "--", icon: Zap }, { label: "100-200", val: "--", icon: Gauge }, { label: "TOP SPEED 🏆", val: `${stats.peak}`, icon: Car } ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                  <stat.icon className="w-2.5 h-2.5" />{stat.label}
                </p>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black italic text-white leading-none tracking-tighter">{stat.val}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="glass rounded-2xl p-5 border-white/5 space-y-3">
          <h4 className="text-[9px] font-black text-accent uppercase tracking-widest flex items-center gap-2"><Zap className="w-3 h-3" />MODIFIKIMET 🔥</h4>
          <div className="flex flex-wrap gap-1.5">
            {profile?.modifications ? profile.modifications.split(',').map((mod: string, i: number) => (
              <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-[9px] font-black italic py-1 px-3 rounded-lg uppercase">{mod.trim()}</Badge>
            )) : <p className="text-[10px] font-bold text-muted-foreground italic uppercase tracking-widest px-1">Nuk ka modifikime 👀</p>}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
