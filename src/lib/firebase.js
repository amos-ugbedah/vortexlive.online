import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDeJ6kzzgbq-s_n-501SLJwUfdmvxBOaVc",
  authDomain: "votexlive-3a8cb.firebaseapp.com",
  projectId: "votexlive-3a8cb",
  storageBucket: "votexlive-3a8cb.appspot.com",
  messagingSenderId: "245598203368",
  appId: "1:245598203368:web:7c80b3b2391affb5e3885d",
};

const app = initializeApp(firebaseConfig);

// Export only what you use
export const db = getFirestore(app);
export const storage = getStorage(app);
