import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { FIREBASE_CONFIG } from './runtime';

export const firebaseApp = initializeApp(FIREBASE_CONFIG as any);
export const auth = getAuth(firebaseApp);
