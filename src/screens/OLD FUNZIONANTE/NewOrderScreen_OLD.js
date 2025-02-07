import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker"; // ✅ Import corretto



const NewOrderScreen = ({ navigation }) => {
  const [clienti, setClienti] = useState([]);
  const [prodotti, setProdotti] = useState([]);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [prodottiSelezionati, setProdottiSelezionati] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientiSnap = await getDocs(collection(db, "clienti"));
        const prodottiSnap = await getDocs(collection(db, "prodotti"));

        setClienti(clientiSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setProdotti(prodottiSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Errore nel caricamento:", error);
        Toast.show({ type: "error", text1: "Errore", text2: "Impossibile caricare i dati." });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleProduct = (id) => {
    setProdottiSelezionati((prev) => ({
      ...prev,
      [id]: prev[id] ? prev[id] + 1 : 1, // Aggiunge 1 alla quantità o la imposta a 1
    }));
  };

  const handleSubmitOrder = async () => {
    if (!clienteSelezionato || Object.keys(prodottiSelezionati).length === 0) {
      Toast.show({ type: "error", text1: "Errore", text2: "Seleziona un cliente e almeno un prodotto." });
      return;
    }

    const prodottiOrdinati = prodotti
      .filter((p) => prodottiSelezionati[p.id])
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        quantita: prodottiSelezionati[p.id],
        prezzo_unitario: p.prezzo,
      }));

    const totale = prodottiOrdinati.reduce((sum, p) => sum + p.prezzo_unitario * p.quantita, 0);

    try {
      await addDoc(collection(db, "ordini"), {
        cliente_id: clienteSelezionato.id,
        cliente_nome: clienteSelezionato.nome,
        prodotti: prodottiOrdinati,
        totale: totale.toFixed(2),
        stato: "In attesa",
      });

      Toast.show({ type: "success", text1: "✅ Ordine creato!", text2: "L'ordine è stato aggiunto con successo." });
      navigation.goBack();
    } catch (error) {
      console.error("Errore nella creazione dell'ordine:", error);
      Toast.show({ type: "error", text1: "Errore", text2: "Impossibile salvare l'ordine." });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Caricamento dati...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>🆕 Crea Nuovo Ordine</Text>

      <Text style={styles.label}>👤 Seleziona Cliente:</Text>
      <Picker selectedValue={clienteSelezionato} onValueChange={(val) => setClienteSelezionato(val)} style={styles.picker}>
        <Picker.Item label="-- Scegli un Cliente --" value={null} />
        {clienti.map((cliente) => (
          <Picker.Item key={cliente.id} label={cliente.nome} value={cliente} />
        ))}
      </Picker>

      <Text style={styles.label}>📦 Seleziona Prodotti:</Text>
      <FlatList
        data={prodotti}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.prodottoItem} onPress={() => handleToggleProduct(item.id)}>
            <Text>{item.nome} - €{item.prezzo.toFixed(2)}</Text>
            <Text>Quantità: {prodottiSelezionati[item.id] || 0}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.bottone} onPress={handleSubmitOrder}>
        <Text style={styles.testoBottone}>✅ Conferma Ordine</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bottoneIndietro} onPress={() => navigation.goBack()}>
        <Text style={styles.testoBottone}>⬅️ Torna Indietro</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NewOrderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  picker: { height: 50, backgroundColor: "#fff", borderRadius: 5, marginBottom: 10 },
  prodottoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  bottone: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  bottoneIndietro: { backgroundColor: "#34C759", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  testoBottone: { color: "white", fontSize: 18, fontWeight: "bold" },
});
