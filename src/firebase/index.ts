'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
    // Gjithmonë kalohet objekti i konfigurimit për siguri maksimale
    firebaseApp = initializeApp(firebaseConfig);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
