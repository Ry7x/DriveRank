'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

/**
 * Inicializon Firebase SDK duke përdorur gjithmonë objektin e konfigurimit.
 * Kjo garanton funksionimin në Vercel duke shmangur gabimin 'app/no-options'.
 */
export function initializeFirebase() {
  const apps = getApps();
  let firebaseApp: FirebaseApp;

  if (apps.length > 0) {
    firebaseApp = getApp();
  } else {
    // Gjithmonë kalohet objekti i konfigurimit për siguri maksimale në mjedise si Vercel
    firebaseApp = initializeApp(firebaseConfig);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getCachedFirestore(firebaseApp)
  };
}

/**
 * Firestore with an IndexedDB cache: listeners render cached data instantly and,
 * when re-subscribing (e.g. switching between ranking tabs), only changed documents
 * are downloaded instead of the whole result set.
 * Falls back to the default in-memory cache on the server, when IndexedDB is
 * unavailable, or when Firestore was already initialised (hot reload).
 */
function getCachedFirestore(app: FirebaseApp): Firestore {
  if (typeof window === 'undefined') return getFirestore(app);
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(app);
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
