
"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";

export default function MyProfileRedirect() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace(`/profile/${user.uid}`);
    } else if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center">
      <Loader2 className="w-10 h-10 text-accent animate-spin" />
    </div>
  );
}
