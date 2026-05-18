import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isRealValue = (value: unknown) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  !/(replace-me|placeholder|paste_|your_|xxxx|xxx)/i.test(value.trim()) &&
  value.trim() !== '123456789' &&
  value.trim() !== '1:123:web:abc';

export const missingFirebaseConfigKeys = () =>
  Object.entries(firebaseConfig)
    .filter(([, value]) => !isRealValue(value))
    .map(([key]) => key);

export const hasFirebaseConfig = () => missingFirebaseConfigKeys().length === 0;

export const initializeFirebase = (): FirebaseApp => {
  if (!hasFirebaseConfig()) {
    throw new Error(`Firebase config is incomplete: ${missingFirebaseConfigKeys().join(', ')}`);
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};

export const getFirebaseAuth = (): Auth => getAuth(initializeFirebase());

export const getFirebaseDb = (): Firestore => getFirestore(initializeFirebase());

export const getFirebaseStorage = (): FirebaseStorage => getStorage(initializeFirebase());
