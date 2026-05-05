import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAd2v0cKUF5pamWG0KqQafESNMt9eQxRp8",
  authDomain: "timely-pomodoro.firebaseapp.com",
  projectId: "timely-pomodoro",
  storageBucket: "timely-pomodoro.firebasestorage.app",
  messagingSenderId: "907324411708",
  appId: "1:907324411708:web:ae399bde879908b71e5839"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);