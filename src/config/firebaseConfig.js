import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxqaFeX7D5HIAtWu9RADrTTP8WKt5eyGo",
  authDomain: "gestionale-ordini-1913d.firebaseapp.com",
  projectId: "gestionale-ordini-1913d",
  storageBucket: "gestionale-ordini-1913d.firebasestorage.app",
  messagingSenderId: "722347011760",
  appId: "1:722347011760:android:eae2bedf4038a7e63e9575"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
