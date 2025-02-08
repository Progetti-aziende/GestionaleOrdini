import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { db } from "./src/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import AppNavigator from "./src/navigation/AppNavigator";
import { registerRootComponent } from "expo";

registerRootComponent(App);

LogBox.ignoreLogs(["AsyncStorage has been extracted from"]);

export default function App() {
  useEffect(() => {
    const testFirestore = async () => {
      try {
        console.log("🔍 Test di connessione a Firestore...");
        const querySnapshot = await getDocs(collection(db, "orders"));
        console.log("✅ Connessione Firestore OK!");
      } catch (error) {
        console.error("❌ ERRORE CONNESSIONE FIRESTORE:", error);
      }
    };

    testFirestore();
  }, []);

  return <AppNavigator />;
}
