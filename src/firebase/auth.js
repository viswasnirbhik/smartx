import { auth } from "./config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export const login = async (email, password) => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  await signOut(auth);
};