import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "XXXXXXXXXXXXXXXXX",
  authDomain: "timely-pomodoro.firebaseapp.com",
  projectId: "timely-pomodoro",
  storageBucket: "timely-pomodoro.firebasestorage.app",
  messagingSenderId: "907324411708",
  appId: "XXXXXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
