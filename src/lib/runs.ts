import { collection, doc, type Firestore } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

/**
 * `public_runs` docs carry the full telemetry + GPS path (often 10s of KB each).
 * Rankings only need a handful of fields, so every run also gets a slim copy in
 * `run_summaries`, keyed by the same id. Leaderboards and rank lookups read only
 * the summaries.
 */
export const RUN_SUMMARIES = "run_summaries";

/** Fields copied into `run_summaries`. Keep in sync with firestore.rules. */
export const SUMMARY_FIELDS = [
  "userId", "username", "community", "profileIcon", "isAdmin", "city",
  "carBrand", "carModel", "runType", "dragTime", "peakSpeedKmH", "createdAt",
] as const;

/** Profile fields that are denormalised onto run documents. */
export const PROFILE_SYNC_FIELDS = ["username", "community", "profileIcon", "carBrand", "carModel"] as const;

export function toRunSummary(run: Record<string, any>) {
  const summary: Record<string, any> = {};
  for (const key of SUMMARY_FIELDS) summary[key] = run[key] ?? null;
  return summary;
}

/** Writes a run to the public ranking, the slim summary, and the owner's history. */
export function saveRun(db: Firestore, userId: string, runData: Record<string, any>) {
  const publicRef = doc(collection(db, "public_runs"));
  setDocumentNonBlocking(publicRef, runData, {});
  setDocumentNonBlocking(doc(db, RUN_SUMMARIES, publicRef.id), toRunSummary(runData), {});
  setDocumentNonBlocking(doc(db, "users", userId, "runs", publicRef.id), runData, {});
  return publicRef.id;
}
