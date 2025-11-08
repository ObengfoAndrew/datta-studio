// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAreBHijkdhcy-HHHP8rNQDzY3J0Nej3kA",
  authDomain: "datta-dattawallet.firebaseapp.com",
  projectId: "datta-dattawallet",
  storageBucket: "datta-dattawallet.firebasestorage.app",
  messagingSenderId: "116130275498",
  appId: "1:116130275498:web:333096f0b508bdc2b170d3"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };