import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const ProductsScreen = ({ navigation }) => {
  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "prodotti"));
      setProdotti(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>📦 Lista Prodotti</Text>

      <FlatList
        data={prodotti}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.prodottoItem}>
            <Text>{item.nome} - €{item.prezzo.toFixed(2)}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.bottone} onPress={() => navigation.navigate("NewProduct")}>
        <Text style={styles.testoBottone}>➕ Aggiungi Prodotto</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProductsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  prodottoItem: { backgroundColor: "#fff", padding: 10, borderRadius: 5, marginBottom: 5 },
  bottone: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  testoBottone: { color: "white", fontSize: 18, fontWeight: "bold" },
});
