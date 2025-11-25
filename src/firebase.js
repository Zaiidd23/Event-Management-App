import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNqvX7DISzQte4HfsMQZDnBSBnxiA17mI",
  authDomain: "acadia-event-manager-5d042.firebaseapp.com",
  projectId: "acadia-event-manager-5d042",
  storageBucket: "acadia-event-manager-5d042.appspot.com", // ✅ fixed line
  messagingSenderId: "953656972343",
  appId: "1:953656972343:web:4adf18b2ec392ac97cdbb2",
  measurementId: "G-VEEP1YT7PL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

