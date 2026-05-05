import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export type Theme = "default" | "christmas" | "fall" | "summer";

export const saveTheme = async (uid: string, theme: Theme) => {
  await setDoc(doc(db, "preferences", uid), { theme }, { merge: true });
};

export const loadTheme = async (uid: string): Promise<Theme> => {
  const snap = await getDoc(doc(db, "preferences", uid));
  return (snap.exists() ? snap.data().theme : "default") as Theme;
};