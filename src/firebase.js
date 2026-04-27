// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnCnsSssInqBFOAtXtzlEU7Toh_7E1V1A",
  authDomain: "morchis-menu.firebaseapp.com",
  projectId: "morchis-menu",
  storageBucket: "morchis-menu.firebasestorage.app",
  messagingSenderId: "7818897471",
  appId: "1:7818897471:web:8624879b5afe04c9eef08a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);