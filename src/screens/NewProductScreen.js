import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Toast from "react-native-toast-message";

const NewProductScreen = ({ navigation }) => {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prezzo, setPrezzo] = useState("");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveProduct = async () => {
    if (!nome || !categoria || !prezzo || !stock) {
      Toast.show({ type: "error", text1: "Errore", text2: "Compila tutti i campi!" });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "prodotti"), {
        nome,
        categoria,
        prezzo: parseFloat(prezzo),
        stock: parseInt(stock),
      });

      Toast.show({ type: "success", text1: "Prodotto Aggiunto!", text2: `${nome} salvato con successo.` });
      navigation.goBack();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      Toast.show({ type: "error", text1: "Errore", text2: "Impossibile salvare il prodotto." });
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>➕ Aggiungi Prodotto</Text>

      <TextInput style={styles.input} placeholder="Nome Prodotto" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="Categoria" value={categoria} onChangeText={setCategoria} />
      <TextInput style={styles.input} placeholder="Prezzo (€)" value={prezzo} onChangeText={setPrezzo} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Stock Disponibile" value={stock} onChangeText={setStock} keyboardType="numeric" />

      {loading ? <ActivityIndicator size="large" color="#007AFF" /> : null}

      <TouchableOpacity style={styles.bottone} onPress={handleSaveProduct}>
        <Text style={styles.testoBottone}>💾 Salva Prodotto</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NewProductScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 10, fontSize: 16 },
  bottone: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  testoBottone: { color: "white", fontSize: 18, fontWeight: "bold" },
});
