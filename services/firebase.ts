import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAxTKa4CizP2XXl2hKPHq8xLk7kZt-xGXA",
  authDomain: "portionperfect-d4086.firebaseapp.com",
  projectId: "portionperfect-d4086",
  storageBucket: "portionperfect-d4086.firebasestorage.app",
  messagingSenderId: "326611948348",
  appId: "1:326611948348:web:0eb706e454ffd35967c439",
  measurementId: "G-NJGKM9SX0P"
};

const app = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

export const db = getFirestore(app);

// Initialize analytics safely, handling environments where it might not be supported
let analyticsInstance = null;
if (typeof window !== "undefined") {
  try {
    analyticsInstance = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics could not be initialized:", error);
  }
}

export const analytics = analyticsInstance;