// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getStorage} from "firebase/storage"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "coursei-962ab.firebaseapp.com",
  projectId: "coursei-962ab",
  storageBucket: "coursei-962ab.firebasestorage.app",
  messagingSenderId: "830047916792",
  appId: "1:830047916792:web:22d1bbad04a13203d7210d",
  measurementId: "G-WL319ZRT23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage=getStorage(app)