import { doc, getDoc, setDoc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getStats = async (uid: string) => {
  const ref = doc(db, "stats", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as { sessions: number; minutes: number; tasks: number };
  return { sessions: 0, minutes: 0, tasks: 0 };
};

export const recordSession = async (uid: string, secondsElapsed: number) => {
  const ref = doc(db, "stats", uid);
  const minutesElapsed = Math.round(secondsElapsed / 60);
  await setDoc(ref, {
    sessions: increment(1),
    minutes: increment(minutesElapsed),
    tasks: increment(0),
  }, { merge: true });
};

export const recordTaskChecked = async (uid: string) => {
  const ref = doc(db, "stats", uid);
  await setDoc(ref, { tasks: increment(1), sessions: increment(0), minutes: increment(0) }, { merge: true });
};

export const recordTaskUnchecked = async (uid: string) => {
  const ref = doc(db, "stats", uid);
  await updateDoc(ref, { tasks: increment(-1) });
};