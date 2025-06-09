import { db } from "./config";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

// Add new expense
export const addExpense = async ({ name, amount, date, userId, familyId }) => {
  await addDoc(collection(db, "expenses"), {
    name,
    amount: parseFloat(amount),
    date: new Date(date),
    userId,
    familyId,
    createdAt: serverTimestamp()
  });
};

// Fetch family expenses
export const getFamilyExpenses = async (familyId) => {
  const q = query(
    collection(db, "expenses"),
    where("familyId", "==", familyId),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};