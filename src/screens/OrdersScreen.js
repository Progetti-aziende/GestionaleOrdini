import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Toast from "react-native-toast-message";

const OrdersScreen = ({ navigation }) => {
  const [ordini, setOrdini] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ordini"));
        const ordersList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrdini(ordersList);
      } catch (error) {
        console.error("Errore nel caricamento ordini:", error);
        Toast.show({ type: "error", text1: "Errore", text2: "Impossibile caricare gli ordini." });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDeleteOrder = async (orderId) => {
    Alert.alert("Elimina Ordine", "Sei sicuro di voler eliminare questo ordine?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "ordini", orderId));
            setOrdini(ordini.filter((order) => order.id !== orderId));
            Toast.show({ type: "success", text1: "Ordine Eliminato", text2: "L'ordine è stato rimosso correttamente." });
          } catch (error) {
            console.error("Errore nell'eliminazione:", error);
            Toast.show({ type: "error", text1: "Errore", text2: "Impossibile eliminare l'ordine." });
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>🛒 Ordini</Text>

      {ordini.length === 0 ? (
        <Text style={styles.noOrders}>Nessun ordine disponibile</Text>
      ) : (
        <FlatList
          data={ordini}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.ordine}>
              <Text style={styles.cliente}>📌 Cliente: {item.clienteId}</Text>
              <Text>📅 Data: {new Date(item.data).toLocaleDateString()}</Text>
              <Text>📦 Prodotti: {item.prodotti.length}</Text>
              <Text>📌 Stato: {item.stato}</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.bottoneModifica} onPress={() => navigation.navigate("EditOrder", { orderId: item.id })}>
                  <Text style={styles.testoBottone}>✏ Modifica</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottoneElimina} onPress={() => handleDeleteOrder(item.id)}>
                  <Text style={styles.testoBottone}>🗑 Elimina</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.bottoneAggiungi} onPress={() => navigation.navigate("NewOrder")}>
        <Text style={styles.testoBottone}>➕ Nuovo Ordine</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  noOrders: { fontSize: 16, textAlign: "center", color: "gray", marginTop: 20 },
  ordine: { padding: 15, backgroundColor: "#fff", borderRadius: 8, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cliente: { fontSize: 18, fontWeight: "bold" },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  bottoneModifica: { backgroundColor: "#007AFF", padding: 10, borderRadius: 8, flex: 1, marginRight: 5, alignItems: "center" },
  bottoneElimina: { backgroundColor: "#FF3B30", padding: 10, borderRadius: 8, flex: 1, marginLeft: 5, alignItems: "center" },
  bottoneAggiungi: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  testoBottone: { color: "white", fontSize: 16, fontWeight: "bold" },
});
