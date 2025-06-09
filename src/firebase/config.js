import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration (from Firebase Console > Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "smartx-my.firebaseapp.com",
  projectId: "smartx-my", // Match your Firebase console
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "1:..."
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);