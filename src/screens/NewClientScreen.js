import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Toast from "react-native-toast-message";

const NewClientScreen = ({ navigation }) => {
  const [nome, setNome] = useState("");
  const [pIva, setPIva] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveClient = async () => {
    if (!nome || !pIva || !email || !telefono || !indirizzo) {
      Toast.show({ type: "error", text1: "Errore", text2: "Compila tutti i campi!" });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "clienti"), { nome, pIva, email, telefono, indirizzo });
      Toast.show({ type: "success", text1: "Cliente Aggiunto!", text2: `${nome} salvato con successo.` });
      navigation.goBack();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      Toast.show({ type: "error", text1: "Errore", text2: "Impossibile salvare il cliente." });
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>➕ Aggiungi Cliente</Text>

      <TextInput style={styles.input} placeholder="Nome Azienda" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="Partita IVA" value={pIva} onChangeText={setPIva} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Telefono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Indirizzo" value={indirizzo} onChangeText={setIndirizzo} />

      {loading ? <ActivityIndicator size="large" color="#007AFF" /> : null}

      <TouchableOpacity style={styles.bottone} onPress={handleSaveClient}>
        <Text style={styles.testoBottone}>💾 Salva Cliente</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NewClientScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10, fontSize: 16 },
  bottone: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  testoBottone: { color: "white", fontSize: 18, fontWeight: "bold" },
});
