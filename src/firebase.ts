import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDs5blACfmlwuFmiiF5QjqQW-6d33I4hU0",
  authDomain: "ogrencivelibaki.firebaseapp.com",
  projectId: "ogrencivelibaki",
  storageBucket: "ogrencivelibaki.firebasestorage.app",
  messagingSenderId: "466518686663",
  appId: "1:466518686663:web:a2d3c7f95b4e86710677e2",
  measurementId: "G-XX6TJVT61R"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
