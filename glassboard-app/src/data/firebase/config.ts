import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'replace-me',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'replace-me',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'replace-me',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'replace-me',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'replace-me',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'replace-me',
};

export const hasFirebaseConfig = () =>
  Object.values(firebaseConfig).every((value) => typeof value === 'string' && value.trim().length > 0 && value !== 'replace-me');

export const initializeFirebase = (): FirebaseApp => {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};

export const getFirebaseAuth = (): Auth => getAuth(initializeFirebase());

export const getFirebaseDb = (): Firestore => getFirestore(initializeFirebase());
