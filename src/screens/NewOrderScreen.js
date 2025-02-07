import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";

const NewOrderScreen = ({ navigation }) => {
  const [clienti, setClienti] = useState([]);
  const [prodotti, setProdotti] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientiSnapshot = await getDocs(collection(db, "clienti"));
        setClienti(clientiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const prodottiSnapshot = await getDocs(collection(db, "prodotti"));
        setProdotti(prodottiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Errore nel caricamento:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddProduct = (product) => {
    setSelectedProducts((prev) => [
      ...prev,
      { ...product, quantity: 1 } // Aggiunge il prodotto con quantità iniziale 1
    ]);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    setSelectedProducts((prev) =>
      prev.map((prod) => (prod.id === productId ? { ...prod, quantity: newQuantity } : prod))
    );
  };

  const handleSaveOrder = async () => {
    if (!selectedCliente || selectedProducts.length === 0) {
      Toast.show({ type: "error", text1: "Errore", text2: "Seleziona un cliente e almeno un prodotto!" });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "ordini"), {
        clienteId: selectedCliente,
        prodotti: selectedProducts.map(prod => ({
          id: prod.id,
          nome: prod.nome,
          quantità: prod.quantity,
          prezzo: prod.prezzo,
        })),
        data: new Date().toISOString(),
        stato: "In attesa"
      });

      Toast.show({ type: "success", text1: "Ordine Salvato!", text2: "L'ordine è stato registrato correttamente." });
      navigation.goBack();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      Toast.show({ type: "error", text1: "Errore", text2: "Impossibile salvare l'ordine." });
    }
    setLoading(false);
  };

  if (loading) return <ActivityIndicator size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>➕ Nuovo Ordine</Text>

      {/* Selezione Cliente */}
      <Text style={styles.label}>Seleziona Cliente:</Text>
      <Picker selectedValue={selectedCliente} onValueChange={setSelectedCliente} style={styles.picker}>
        <Picker.Item label="-- Seleziona un Cliente --" value="" />
        {clienti.map((cliente) => (
          <Picker.Item key={cliente.id} label={cliente.nome} value={cliente.id} />
        ))}
      </Picker>

      {/* Selezione Prodotti */}
      <Text style={styles.label}>Seleziona Prodotti:</Text>
      <FlatList
        data={prodotti}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.prodotto} onPress={() => handleAddProduct(item)}>
            <Text>{item.nome} - €{item.prezzo.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Lista Prodotti Selezionati */}
      {selectedProducts.length > 0 && (
        <>
          <Text style={styles.label}>Prodotti Selezionati:</Text>
          <FlatList
            data={selectedProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.selectedProduct}>
                <Text>{item.nome} - €{item.prezzo.toFixed(2)}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(item.quantity)}
                  onChangeText={(text) => handleUpdateQuantity(item.id, parseInt(text) || 1)}
                />
              </View>
            )}
          />
        </>
      )}

      {loading ? <ActivityIndicator size="large" color="#007AFF" /> : null}

      <TouchableOpacity style={styles.bottone} onPress={handleSaveOrder}>
        <Text style={styles.testoBottone}>💾 Salva Ordine</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NewOrderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  picker: { backgroundColor: "#fff", borderRadius: 8, marginBottom: 10 },
  prodotto: { backgroundColor: "#ddd", padding: 10, marginBottom: 5, borderRadius: 5 },
  selectedProduct: { flexDirection: "row", justifyContent: "space-between", padding: 10, backgroundColor: "#ddd", marginBottom: 5, borderRadius: 5 },
  input: { backgroundColor: "#fff", padding: 10, borderRadius: 5, width: 60, textAlign: "center" },
  bottone: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  testoBottone: { color: "white", fontSize: 18, fontWeight: "bold" },
});
