'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
<<<<<<< HEAD
=======
  FirestoreError,
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
<<<<<<< HEAD
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
=======
  setDoc(docRef, data, options).catch((err: FirestoreError) => {
    if (err.code === 'permission-denied') {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: options && 'merge' in options ? 'update' : 'create',
          requestResourceData: data,
        })
      )
    } else {
      console.warn("Firestore write failed (connection issue):", err.message);
    }
  })
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
<<<<<<< HEAD
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
=======
    .catch((err: FirestoreError) => {
      if (err.code === 'permission-denied') {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: data,
          })
        )
      } else {
        console.warn("Firestore add failed (connection issue):", err.message);
      }
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
<<<<<<< HEAD
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
=======
    .catch((err: FirestoreError) => {
      if (err.code === 'permission-denied') {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
          })
        )
      } else {
        console.warn("Firestore update failed (connection issue):", err.message);
      }
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
<<<<<<< HEAD
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
=======
    .catch((err: FirestoreError) => {
      if (err.code === 'permission-denied') {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          })
        )
      } else {
        console.warn("Firestore delete failed (connection issue):", err.message);
      }
>>>>>>> 93e76c937e556404d8b9e57cec4c82eed870418d
    });
}