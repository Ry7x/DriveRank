/**
 * One-time backfill: copy recent `public_runs` into the slim `run_summaries`
 * collection the leaderboards now read from.
 *
 * Usage (needs a service-account key for the Firebase project):
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/backfill-run-summaries.mjs [days=5]
 *
 * Safe to re-run: summaries are written with the same id as the public run.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Keep in sync with SUMMARY_FIELDS in src/lib/runs.ts
const SUMMARY_FIELDS = [
  "userId", "username", "community", "profileIcon", "isAdmin", "city",
  "carBrand", "carModel", "runType", "dragTime", "peakSpeedKmH", "createdAt",
];

const days = Number(process.argv[2] ?? 5);
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

initializeApp({ credential: applicationDefault(), projectId: "studio-4837121314-abebd" });
const db = getFirestore();

const snap = await db.collection("public_runs").where("createdAt", ">=", since).get();
console.log(`Found ${snap.size} public runs since ${since}`);

const writer = db.bulkWriter();
for (const docSnap of snap.docs) {
  const run = docSnap.data();
  const summary = Object.fromEntries(SUMMARY_FIELDS.map((k) => [k, run[k] ?? null]));
  writer.set(db.collection("run_summaries").doc(docSnap.id), summary);
}
await writer.close();
console.log(`Wrote ${snap.size} run summaries.`);
