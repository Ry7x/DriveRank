
"use client"

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Share2, MapPin, Loader2, UserCircle, Car, Gauge, Cpu, Zap, ChevronLeft, Trash2, Palette, LogOut, X, ShieldCheck, Crown, Users } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useCollection, deleteDocumentNonBlocking, useAuth } from "@/firebase";
import { doc, collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { RenderCarIcon, CarIconType, CarIconConfig } from "@/components/icons/car-icons";

export default function ProfileViewPage({ 
  params
}: { 
  params: Promise<{ userId: string }>
}) {
  const { userId: targetUserId } = use(params);
  const router = useRouter();
  const { user: currentUser } = useUser();
  const auth = useAuth();
  const isOwnProfile = currentUser?.uid === targetUserId;
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    city: "",
    community: "",
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
    if (!runs) return { totalRuns: 0, totalKm: "0.00", peak: 0, best0to60: "--", best0to100: "--", best100to200: "--" };
    
    const totalDistance = runs.reduce((acc, run) => acc + (run.distanceMeters || 0), 0);
    const peakSpeed = runs.reduce((max, run) => Math.max(max, run.peakSpeedKmH || 0), 0);
    
    const getBest = (type: string) => {
      const filtered = runs.filter(r => r.runType === type && r.dragTime);
      return filtered.length > 0 ? Math.min(...filtered.map(r => r.dragTime)).toFixed(2) + "s" : "--";
    };

    return {
      totalRuns: runs.length,
      totalKm: (totalDistance / 1000).toFixed(2),
      peak: peakSpeed,
      best0to60: getBest("0-60"),
      best0to100: getBest("0-100"),
      best100to200: getBest("100-200")
    };
  }, [runs]);

  useEffect(() => {
    if (profile && isOwnProfile) {
      setFormData({
        username: profile.username || "",
        city: profile.city || "",
        community: profile.community || "",
        carBrand: profile.carBrand || "",
        carModel: profile.carModel || "",
        carColor: profile.carColor || "",
        horsepower: profile.horsepower || 0,
        modifications: profile.modifications || "",
        profileIcon: (profile.profileIcon as CarIconType) || "speedometer",
      });
    }
  }, [profile, isOwnProfile]);

  const handleSaveProfile = async () => {
    if (!profileRef || !isOwnProfile || !db) return;
    
    // 1. Update Profile Document
    updateDocumentNonBlocking(profileRef, {
      ...formData,
      horsepower: Number(formData.horsepower),
      updatedAt: new Date().toISOString(),
    });

    // 2. Sync changes with all Ranking (public_runs) and Personal History
    try {
      // Update Public Ranking Documents
      const publicRunsQ = query(collection(db, "public_runs"), where("userId", "==", targetUserId));
      const publicSnapshot = await getDocs(publicRunsQ);
      
      publicSnapshot.forEach((docSnap) => {
        updateDocumentNonBlocking(docSnap.ref, {
          username: formData.username,
          community: formData.community,
          profileIcon: formData.profileIcon,
          carBrand: formData.carBrand,
          carModel: formData.carModel
        });
      });

      // Update User Subcollection History for Consistency
      const personalRunsQ = query(collection(db, "users", targetUserId, "runs"));
      const personalSnapshot = await getDocs(personalRunsQ);
      
      personalSnapshot.forEach((docSnap) => {
        updateDocumentNonBlocking(docSnap.ref, {
          username: formData.username,
          community: formData.community,
          profileIcon: formData.profileIcon,
          carBrand: formData.carBrand,
          carModel: formData.carModel
        });
      });
    } catch (e) {
      console.error("Sync failed:", e);
    }

    toast({ title: "PROFILI U PËRDITËSUA" });
    setIsEditDialogOpen(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (isProfileLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-accent animate-spin" /></div>;

  if (!profile) return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center p-10 text-center apple-slide-up">
      <UserCircle className="w-16 h-16 text-muted-foreground mb-6 opacity-20" />
      <h1 className="text-2xl font-bold uppercase">NUK U GJET</h1>
      <Button onClick={() => router.back()} variant="ghost" className="mt-6 text-accent uppercase font-bold">KTHEHU MBRAPA</Button>
    </div>
  );

  const isAdmin = profile.isAdmin === true;
  
  const getDynamicBg = (icon?: string) => {
    if (isAdmin) return "from-purple-600/20";
    switch (icon) {
      case 'turbo': return "from-cyan-500/20";
      case 'crown': return "from-yellow-500/20";
      case 'lightning': return "from-blue-500/20";
      case 'shield': return "from-zinc-500/20";
      case 'flame': return "from-red-500/20";
      default: return "from-white/10";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground pb-24 safe-top overflow-x-hidden no-scrollbar relative">
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b to-transparent pointer-events-none z-0 transition-colors duration-1000",
        getDynamicBg(profile?.profileIcon)
      )} />

      <div className="p-6 flex justify-between items-center z-20 w-full max-w-lg mx-auto apple-slide-up relative">
        <div className="flex items-center gap-2">
           <Button onClick={() => router.back()} size="icon" variant="ghost" className="rounded-2xl h-12 w-12"><ChevronLeft className="w-7 h-7" /></Button>
           <h1 className="text-2xl font-bold uppercase leading-none">PROFILI</h1>
        </div>
        <div className="flex gap-3">
          {isOwnProfile && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline" className="rounded-2xl glass border-white/10 w-12 h-12">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 text-foreground w-[92vw] max-w-[400px] rounded-[2.5rem] p-6 apple-scale-in">
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle className="text-xl font-bold uppercase leading-none">PËRDITËSO PROFILIN</DialogTitle>
                  <button onClick={() => setIsEditDialogOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><X className="w-5 h-5 text-white/40" /></button>
                </DialogHeader>
                <div className="grid gap-4 py-4 overflow-y-auto no-scrollbar max-h-[65vh]">
                  
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">ZGJIDH IKONËN</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.keys(CarIconConfig) as CarIconType[]).map((iconKey) => {
                        const iconData = CarIconConfig[iconKey];
                        const isSelected = formData.profileIcon === iconKey;
                        return (
                          <button
                            key={iconKey}
                            onClick={() => setFormData({ ...formData, profileIcon: iconKey })}
                            className={cn(
                              "h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-300",
                              isSelected 
                                ? "bg-accent/10 border-accent shadow-lg shadow-accent/20" 
                                : "bg-white/5 border-white/5 hover:bg-white/10"
                            )}
                          >
                            <RenderCarIcon type={iconKey} className={cn("w-6 h-6", isSelected ? iconData.color : "text-white/20")} />
                            <span className={cn("text-[7px] font-black uppercase tracking-widest", isSelected ? "text-accent" : "text-white/20")}>
                              {iconData.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-1.5 mt-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">EMRI I PËRDORUESIT</Label>
                    <Input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-12 font-bold uppercase text-sm" />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">KOMUNITETI</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Shkruaj emrin e komunitetit" 
                        value={formData.community} 
                        onChange={(e) => setFormData({...formData, community: e.target.value})} 
                        className="bg-white/5 border-white/10 rounded-2xl h-12 font-bold uppercase text-sm pl-10" 
                      />
                      <Users className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">MARKA</Label>
                      <Input value={formData.carBrand} onChange={(e) => setFormData({...formData, carBrand: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-12 font-bold uppercase text-sm" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">MODELI</Label>
                      <Input value={formData.carModel} onChange={(e) => setFormData({...formData, carModel: e.target.value})} className="bg-white/5 border-white/10 rounded-2xl h-12 font-bold uppercase text-sm" />
                    </div>
                  </div>
                  <div className="grid gap-1.5 pt-4">
                    <Button variant="outline" onClick={handleSignOut} className="w-full h-14 border-white/10 bg-white/5 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest">
                      <LogOut className="w-4 h-4 mr-2 text-accent" /> DALJA NGA LLOGARIA
                    </Button>
                  </div>
                </div>
                <DialogFooter className="pt-2"><Button onClick={handleSaveProfile} className="w-full bg-accent text-background font-bold uppercase rounded-[1.8rem] h-14 shadow-xl">RUAJ NDRYSHIMET</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button size="icon" variant="outline" className="rounded-2xl glass border-white/10 w-12 h-12"><Share2 className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="px-6 py-4 relative z-10 flex flex-col items-center text-center apple-slide-up stagger-1 w-full max-lg mx-auto">
        <div className="relative w-32 h-32 mb-6">
          <div className={cn(
            "absolute inset-0 rounded-[2.5rem] blur-3xl opacity-50 animate-pulse-glow",
            isAdmin ? "bg-purple-600" : CarIconConfig[profile?.profileIcon as CarIconType]?.color.replace('text', 'bg') || 'bg-accent'
          )} />
          <div className={cn(
            "relative w-full h-full rounded-[2.5rem] bg-zinc-950 border-4 shadow-2xl flex items-center justify-center overflow-hidden apple-scale-in",
            isAdmin ? "border-purple-500/50 shadow-purple-500/30" : "border-white/5"
          )}>
            <RenderCarIcon type={profile?.profileIcon} className={cn("w-16 h-16 drop-shadow-[0_0_15px_rgba(77,224,244,0.6)]", isAdmin && "text-purple-400")} />
          </div>
          {isAdmin && (
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-xl shadow-xl border-2 border-black z-20 apple-scale-in stagger-2">
              <ShieldCheck className="w-5 h-5 fill-current" />
            </div>
          )}
        </div>

        <div className="space-y-3 apple-slide-up stagger-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className={cn("text-3xl font-bold uppercase leading-none", isAdmin && "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-500")}>{profile?.username}</h1>
            {isAdmin && <ShieldCheck className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />}
          </div>
          
          <div className="flex flex-col items-center gap-2">
            {isAdmin ? (
              <Badge className="bg-gradient-to-r from-purple-600 to-yellow-600 text-white font-black px-6 py-1.5 rounded-full text-[10px] shadow-xl animate-pulse-glow">
                SYSTEM ADMINISTRATOR
              </Badge>
            ) : (
              <div className="flex flex-col gap-2.5 items-center">
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent font-bold px-5 py-1 rounded-full text-[10px] apple-scale-in">
                    {profile?.isPremium ? 'PREMIUM MEMBER' : 'SHOFER KOSOVAR'}
                  </Badge>
                </div>
                {profile?.community && (
                  <Badge className="bg-blue-500/10 border border-blue-500/20 px-6 py-2 rounded-2xl flex items-center gap-2 shadow-2xl apple-scale-in">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-black uppercase animate-text-blue-grey">{profile.community}</span>
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase bg-white/5 px-5 py-1.5 rounded-full border border-white/5 apple-scale-in stagger-3">
              <MapPin className={cn("w-3.5 h-3.5", isAdmin ? "text-purple-500" : "text-accent")} />
              {profile?.city}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 w-full mt-8 apple-slide-up stagger-4">
          {[
            { label: "KM TOTAL", val: stats.totalKm },
            { label: "GARA", val: stats.totalRuns.toString() },
            { label: "PEAK SPEED", val: `${stats.peak}`, accent: true }
          ].map((stat, i) => (
            <div key={i} className={cn(
              "flex-1 glass rounded-3xl p-4 border-white/5 flex flex-col items-center",
              isAdmin && stat.accent && "border-purple-500/30"
            )}>
              <p className="text-[8px] font-light text-muted-foreground uppercase mb-1.5">{stat.label}</p>
              <p className={cn("text-lg font-bold text-white", stat.accent && (isAdmin ? "text-purple-400" : "text-accent"))}>{stat.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-8 space-y-6 apple-slide-up stagger-5 w-full max-w-lg mx-auto relative z-10">
        <h2 className="text-[10px] font-bold uppercase text-muted-foreground px-1">SPECIFIKAT E MJETIT</h2>
        <Card className={cn(
          "glass p-6 rounded-[2.5rem] space-y-6 shadow-2xl",
          isAdmin ? "border-purple-500/30" : "border-accent/20"
        )}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className={cn("w-1.5 h-10 rounded-full apple-scale-in", isAdmin ? "bg-purple-500" : "bg-accent")} />
              <div>
                <h3 className="text-2xl font-bold text-white uppercase leading-none mb-1">{profile?.carBrand}</h3>
                <p className={cn("text-base font-bold uppercase leading-none", isAdmin ? "text-purple-400" : "text-accent/80")}>{profile?.carModel}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={cn("bg-white/5 border-white/10 font-bold text-[9px] px-3 py-1 rounded-xl", isAdmin ? "text-purple-400" : "text-accent")}><Cpu className="w-3.5 h-3.5 mr-1.5" />{profile?.horsepower} HP</Badge>
              <Badge className={cn("bg-white/5 border-white/10 font-bold text-[9px] px-3 py-1 rounded-xl", isAdmin ? "text-purple-400" : "text-accent")}><Palette className="w-3.5 h-3.5 mr-1.5" />{profile?.carColor}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-6 border-t border-white/10">
            {[ 
              { label: "0-60", val: stats.best0to60, icon: Zap },
              { label: "0-100", val: stats.best0to100, icon: Zap }, 
              { label: "100-200", val: stats.best100to200, icon: Gauge }, 
              { label: "TOP SPEED", val: `${stats.peak}`, icon: Car } 
            ].map((stat, i) => (
              <div key={i} className="text-center apple-scale-in">
                <p className="text-[6px] font-light text-muted-foreground uppercase mb-2 flex items-center justify-center gap-1">
                  <stat.icon className={cn("w-2.5 h-2.5 shrink-0", isAdmin && "text-purple-500")} />{stat.label}
                </p>
                <span className="text-xs font-bold text-white block truncate">{stat.val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
