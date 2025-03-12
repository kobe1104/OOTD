import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB3nlivG0uaKgQjDJ1esWu3rospEtS3IwA", //checked
  authDomain: "ootd-835bd.firebaseapp.com", //checked
  projectId: "ootd-835bd", //checked
  storageBucket: "ootd-835bd.appspot.com", //checked
  messagingSenderId: "1047338469815", //checked
  appId: "1:1047338469815:ios:518d423a2f39ebfd670032", //checked
};

console.log("✅ Firebase Storage:", getStorage ? "Available" : "Not Found");

// ✅ Initialize Firebase
console.log("🔍 Initializing Firebase with config:", firebaseConfig);
const app = initializeApp(firebaseConfig);

// ✅ Ensure Storage is initialized properly
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);  // ✅ Make sure this is exported
