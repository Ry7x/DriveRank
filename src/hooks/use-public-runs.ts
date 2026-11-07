"use client"

import { collection, limit, orderBy, query, where } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";

/** Live subscription to public runs created since `sinceIso` (newest first). */
export function usePublicRuns(sinceIso: string) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const runsQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user?.uid) return null;
    return query(
      collection(db, "public_runs"),
      where("createdAt", ">=", sinceIso),
      orderBy("createdAt", "desc"),
      limit(1000)
    );
  }, [db, isUserLoading, user?.uid, sinceIso]);

  const { data, isLoading, error } = useCollection<any>(runsQuery);

  return {
    runs: data,
    user,
    isUserLoading,
    // `data` is null until the first snapshot arrives; treat that as loading so the
    // empty state doesn't flash before results come in.
    isLoading: isUserLoading || isLoading || (!!runsQuery && data === null),
    error,
  };
}
