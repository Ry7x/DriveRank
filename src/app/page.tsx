"use client"

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gauge, Loader2, Mail, Lock, LogIn, Car, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const KOSOVO_CITIES = [
  "Prishtinë", "Prizren", "Pejë", "Gjakovë", "Mitrovicë", "Gjilan", "Ferizaj", 
  "Vushtrri", "Podujevë", "Rahovec", "Fushë Kosovë", "Suharekë", "Kaçanik", 
  "Skënderaj", "Lipjan", "Malishevë", "Drenas", "Deçan", "Klinë", "Kamenicë", 
  "Dragash", "Istog", "Viti", "Obiliq", "Leposaviq", "Graçanicë", "Hani i Elezit", 
  "Zveçan", "Shtime", "Novobërdë", "Zubin Potok", "Junik", "Mamushë", 
  "Ranillug", "Partesh", "Kllokot"
];

export default function Home() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, mounted, router]);

  const initializeUserProfile = async (user: User, details?: any) => {
    const userDocRef = doc(db, "users", user.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          username: details?.username || user.displayName || email.split('@')[0] || 'Shofer i Ri',
          city: details?.city || 'Prishtinë',
          carBrand: details?.carBrand || 'BMW',
          carModel: details?.carModel || 'M4 Competition',
          carColor: details?.carColor || 'Zezë',
          horsepower: 0,
          modifications: 'Stock',
          profilePhotoUrl: "",
          profileIcon: "speedometer",
          coverPhotoUrl: "",
          followedUserIds: [],
          isPremium: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error("Gabim:", e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      if (isRegistering) {
        if (!username || !city || !carBrand || !carModel) {
          throw new Error("Plotësoni të gjitha fushat.");
        }
        
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await Promise.all([
          updateProfile(result.user, { displayName: username }),
          initializeUserProfile(result.user, { username, city, carBrand, carModel, carColor })
        ]);

        toast({ title: "Llogaria u krijua!" });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await initializeUserProfile(result.user);
        toast({ title: "Mirë se u ktheve!" });
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Dështoi", description: error.message });
      setLoading(false);
    }
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex flex-col min-h-screen overflow-y-auto p-6 bg-background safe-top safe-bottom no-scrollbar">
      <div className="mt-8 mb-8 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center neon-glow">
            <Gauge className="text-background w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">
            DriveRank<span className="text-accent neon-text"> Kosovë</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
          Rrjeti i parë për performancën automobilistike në Kosovë.
        </p>
      </div>

      <div className="glass border-white/5 rounded-[2rem] p-6 shadow-2xl space-y-6 mb-8">
        <div className="space-y-1">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            {isRegistering ? "Krijo Llogari" : "Hyr në Llogari"}
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            {isRegistering ? "Bëhu pjesë e elitës" : "Vazhdo ku e ke lënë"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Emri i Përdoruesit</Label>
                <div className="relative">
                  <Input 
                    type="text"
                    placeholder="p.sh. shofere_1"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl h-12 pl-10"
                    required
                  />
                  <LogIn className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Qyteti</Label>
                <Select value={city} onValueChange={setCity} required>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                    <SelectValue placeholder="Zgjidh Qytetin" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 max-h-[240px]">
                    {KOSOVO_CITIES.map(c => (
                      <SelectItem key={c} value={c} className="font-bold text-[11px] uppercase italic">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Marka</Label>
                  <div className="relative">
                    <Input placeholder="BMW" value={carBrand} onChange={(e) => setCarBrand(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12 pl-10" required />
                    <Car className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Modeli</Label>
                  <Input placeholder="M4" value={carModel} onChange={(e) => setCarModel(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Ngjyra</Label>
                <div className="relative">
                  <Input placeholder="E zezë metalike" value={carColor} onChange={(e) => setCarColor(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12 pl-10" />
                  <Palette className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
            <div className="relative">
              <Input id="email" type="email" placeholder="emri@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12 pl-10" required />
              <Mail className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Fjalëkalimi</Label>
            <div className="relative">
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-12 pl-10" required />
              <Lock className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-white/20 data-[state=checked]:bg-accent data-[state=checked]:text-background"
            />
            <Label htmlFor="remember" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer select-none">Më mbaj mend</Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/80 text-background font-black italic uppercase text-base shadow-xl neon-glow mt-2 active:scale-95 transition-transform">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? "REGJISTROHU" : "HYR TANI")}
          </Button>
        </form>

        <div className="text-center pt-2">
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">
            {isRegistering ? "Ke llogari? Hyr këtu" : "Nuk ke llogari? Regjistrohu"}
          </button>
        </div>
      </div>
    </div>
  );
}