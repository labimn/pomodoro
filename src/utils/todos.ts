import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export const loadTodos = async (uid: string): Promise<Todo[]> => {
  const ref = doc(db, "todos", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data().items || [];
  return [];
};

export const saveTodos = async (uid: string, todos: Todo[]) => {
  const ref = doc(db, "todos", uid);
  await setDoc(ref, { items: todos });
};