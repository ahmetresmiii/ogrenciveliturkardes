import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqxSvtSrKLjb-0Yq91abjXhqPy8JIbSJs",
  authDomain: "veliogrenci-cce71.firebaseapp.com",
  projectId: "veliogrenci-cce71",
  storageBucket: "veliogrenci-cce71.firebasestorage.app",
  messagingSenderId: "1092640766125",
  appId: "1:1092640766125:web:c3b7c7dc99606515946e24",
  measurementId: "G-JQ5PGHB7K9"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore veritabanını dışa aktar (Arena AI bunu kullanacak)
export const db = getFirestore(app);
