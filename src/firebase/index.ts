'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Inicializon Firebase SDKs duke garantuar që konfigurimi të ofrohet gjithmonë.
 * Kjo parandalon gabimin 'app/no-options' në mjedise si Vercel.
 */
export function initializeFirebase() {
  const apps = getApps();
  let firebaseApp: FirebaseApp;

  if (apps.length > 0) {
    firebaseApp = getApp();
  } else {
    // Gjithmonë kalohet objekti i konfigurimit për siguri maksimale në mjediset e Build si Vercel
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
