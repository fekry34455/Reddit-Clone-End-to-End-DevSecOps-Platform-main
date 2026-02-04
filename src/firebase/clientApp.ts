import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGvBTBHyVqECcLZtfLzZaWQ8Fgj35rJ34",
  authDomain: "reddit-clone-r-6d856.firebaseapp.com",
  projectId: "reddit-clone-r-6d856",
  storageBucket: "reddit-clone-r-6d856.firebasestorage.app",
  messagingSenderId: "152864339766",
  appId: "1:152864339766:web:12d36601d1f8112d06e597",
  measurementId: "G-5JSWPBCNES",
};
// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
