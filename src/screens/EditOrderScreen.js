import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";

const EditOrderScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  
  const [clienti, setClienti] = useState([]);
  const [filteredClienti, setFilteredClienti] = useState([]);
  const [searchCliente, setSearchCliente] = useState("");

  const [prodotti, setProdotti] = useState([]);
  const [filteredProdotti, setFilteredProdotti] = useState([]);
  const [searchProdotto, setSearchProdotto] = useState("");

  const [selectedCliente, setSelectedCliente] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Carica dati dell'ordine
        const orderDoc = await getDoc(doc(db, "ordini", orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          setSelectedCliente(orderData.clienteId);
          setSelectedProducts(orderData.prodotti);
        }

        // Carica clienti
        const clientiSnapshot = await getDocs(collection(db, "clienti"));
        const clientiList = clientiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClienti(clientiList);
        setFilteredClienti(clientiList);

        // Carica prodotti
        const prodottiSnapshot = await getDocs(collection(db, "prodotti"));
        const prodottiList = prodottiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProdotti(prodottiList);
        setFilteredProdotti(prodottiList);
      } catch (error) {
        console.error("Errore nel caricamento:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleAddProduct = (product) => {
    setSelectedProducts((prev) => [
      ...prev,
      { ...product, quantity: 1 }
    ]);
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((prod) => prod.id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    setSelectedProducts((prev) =>
      prev.map((prod) => (prod.id === productId ? { ...prod, quantity: newQuantity } : prod))
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedCliente || selectedProducts.length === 0) {
      Toast.show({ type: "error", text1: "Errore", text2: "Seleziona un cliente e almeno un prodotto!" });
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "ordini", orderId), {
        clienteId: selectedCliente,
        prodotti: selectedProducts.map(prod => ({
          id: prod.id,
          nome: prod.nome,
          quantità: prod.quantity,
          prezzo: prod.prezzo,
        })),
        data: new Date().toISOString()
      });

      Toast.show({ type: "success", text1: "Modifiche Salvate!", text2: "L'ordine è stato aggiornato." });
      navigation.goBack();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      Toast.show({ type: "error", text1: "Errore", text2: "Impossibile salvare le modifiche." });
    }
    setLoading(false);
  };

  // Filtra i clienti in base al testo di ricerca
  useEffect(() => {
    setFilteredClienti(clienti.filter(cliente => cliente.nome.toLowerCase().includes(searchCliente.toLowerCase())));
  }, [searchCliente]);

  // Filtra i prodotti in base al testo di ricerca
  useEffect(() => {
    setFilteredProdotti(prodotti.filter(prodotto => prodotto.nome.toLowerCase().includes(searchProdotto.toLowerCase())));
  }, [searchProdotto]);

  if (loading) return <ActivityIndicator size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>📝 Modifica Ordine</Text>

      {/* Ricerca Cliente */}
      <TextInput
        style={styles.input}
        placeholder="🔍 Cerca Cliente..."
        value={searchCliente}
        onChangeText={setSearchCliente}
      />

      {/* Selezione Cliente */}
      <Picker selectedValue={selectedCliente} onValueChange={setSelectedCliente} style={styles.picker}>
        <Picker.Item label="-- Seleziona un Cliente --" value="" />
        {filteredClienti.map((cliente) => (
          <Picker.Item key={cliente.id} label={cliente.nome} value={cliente.id} />
        ))}
      </Picker>

      {/* Ricerca Prodotti */}
      <TextInput
        style={styles.input}
        placeholder="🔍 Cerca Prodotto..."
        value={searchProdotto}
        onChangeText={setSearchProdotto}
      />

      {/* Selezione Prodotti */}
      <FlatList
        data={filteredProdotti}
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
                <TouchableOpacity style={styles.bottoneElimina} onPress={() => handleRemoveProduct(item.id)}>
                  <Text style={styles.testoBottone}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}

      <TouchableOpacity style={styles.bottone} onPress={handleSaveChanges}>
        <Text style={styles.testoBottone}>💾 Salva Modifiche</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditOrderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#fff", padding: 10, borderRadius: 5, marginBottom: 10 },
  picker: { backgroundColor: "#fff", borderRadius: 8, marginBottom: 10 },
  prodotto: { backgroundColor: "#ddd", padding: 10, marginBottom: 5, borderRadius: 5 },
  bottone: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  testoBottone: { color: "white", fontSize: 18, fontWeight: "bold" },
});
