// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvRciJasrFPscQrFs52mg0Bmxq3LEm1qk",
  authDomain: "intima-date.firebaseapp.com",
  projectId: "intima-date",
  storageBucket: "intima-date.firebasestorage.app",
  messagingSenderId: "1059417189725",
  appId: "1:1059417189725:web:2dfbd47e2c7d6bef678cb4",
  measurementId: "G-F8PQ70C0QV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);