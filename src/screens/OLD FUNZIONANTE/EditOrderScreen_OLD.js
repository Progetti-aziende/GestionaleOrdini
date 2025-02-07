import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // ✅ Import corretto
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Toast from "react-native-toast-message";

const EditOrderScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [ordine, setOrdine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stato, setStato] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const ordineRef = doc(db, "ordini", orderId);
        const ordineSnap = await getDoc(ordineRef);
        if (ordineSnap.exists()) {
          setOrdine({ id: ordineSnap.id, ...ordineSnap.data() });
          setStato(ordineSnap.data().stato || "In attesa");
        } else {
          Toast.show({
            type: "error",
            text1: "Errore",
            text2: "Ordine non trovato!",
          });
          navigation.goBack();
        }
      } catch (error) {
        console.error("Errore nel caricamento dell'ordine:", error);
        Toast.show({
          type: "error",
          text1: "Errore",
          text2: "Impossibile caricare l'ordine.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    try {
      const ordineRef = doc(db, "ordini", orderId);
      await updateDoc(ordineRef, { stato });
      Toast.show({
        type: "success",
        text1: "✅ Stato aggiornato!",
        text2: `L'ordine è ora "${stato}".`,
      });

      setOrdine((prev) => ({ ...prev, stato }));
    } catch (error) {
      console.error("Errore nell'aggiornamento dello stato:", error);
      Toast.show({
        type: "error",
        text1: "Errore",
        text2: "Impossibile aggiornare lo stato dell'ordine.",
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Caricamento ordine...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>📝 Modifica Ordine</Text>

      <Text style={styles.label}>👤 Cliente:</Text>
      <Text style={styles.info}>{ordine?.cliente_nome}</Text>

      <Text style={styles.label}>📦 Prodotti nell'ordine:</Text>
      <FlatList
        data={ordine?.prodotti || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.prodottoItem}>
            <Text>{item.nome} - {item.quantita}x</Text>
            <Text>💰 €{(item.prezzo_unitario * item.quantita).toFixed(2)}</Text>
          </View>
        )}
      />

      <Text style={styles.label}>📌 Stato Ordine:</Text>
      <Picker selectedValue={stato} onValueChange={(val) => setStato(val)} style={styles.picker}>
        <Picker.Item label="In attesa" value="In attesa" />
        <Picker.Item label="In lavorazione" value="In lavorazione" />
        <Picker.Item label="Spedito" value="Spedito" />
        <Picker.Item label="Consegnato" value="Consegnato" />
      </Picker>

      <TouchableOpacity style={styles.bottone} onPress={handleUpdateStatus}>
        <Text style={styles.testoBottone}>💾 Salva Modifiche</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bottoneIndietro} onPress={() => navigation.goBack()}>
        <Text style={styles.testoBottone}>⬅️ Torna Indietro</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditOrderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  info: { fontSize: 16, backgroundColor: "#fff", padding: 10, borderRadius: 5, marginBottom: 10 },
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
