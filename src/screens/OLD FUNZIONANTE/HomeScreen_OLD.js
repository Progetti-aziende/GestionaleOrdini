import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Toast from "react-native-toast-message";

const HomeScreen = ({ navigation }) => {
  const [ordini, setOrdini] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordiniSnap = await getDocs(collection(db, "ordini"));
        const ordiniList = ordiniSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrdini(ordiniList);
      } catch (error) {
        console.error("Errore nel caricamento degli ordini:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "ordini", orderId));
      setOrdini(ordini.filter((ordine) => ordine.id !== orderId));

      Toast.show({
        type: "success",
        text1: "🗑️ Ordine eliminato!",
        text2: "L'ordine è stato rimosso con successo.",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Errore",
        text2: "Impossibile eliminare l'ordine.",
      });
      console.error("Errore nella cancellazione dell'ordine:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>📋 Ordini della Settimana</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={ordini}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.ordine}>
              <Text style={styles.cliente}>{item.cliente_nome}</Text>
              <Text style={styles.totale}>
                💰 Totale: €{item.totale ? Number(item.totale).toFixed(2) : "0.00"}
              </Text>

              <View style={styles.bottoniContainer}>
                <TouchableOpacity
                  style={styles.bottoneModifica}
                  onPress={() => navigation.navigate("EditOrder", { orderId: item.id })}
                >
                  <Text style={styles.testoBottone}>✏️ Modifica</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bottoneElimina}
                  onPress={() => handleDeleteOrder(item.id)}
                >
                  <Text style={styles.testoBottone}>🗑️ Elimina</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.bottoneNuovo} onPress={() => navigation.navigate("NuovoOrdine")}>
        <Text style={styles.testoBottone}>➕ Nuovo Ordine</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  ordine: { padding: 15, backgroundColor: "white", borderRadius: 8, marginVertical: 5 },
  cliente: { fontSize: 18, fontWeight: "bold" },
  totale: { fontSize: 16, fontWeight: "bold", marginTop: 5, color: "#007AFF" },
  bottoniContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  bottoneModifica: { backgroundColor: "#007AFF", padding: 10, borderRadius: 5, flex: 1, alignItems: "center", marginRight: 5 },
  bottoneElimina: { backgroundColor: "#FF3B30", padding: 10, borderRadius: 5, flex: 1, alignItems: "center", marginLeft: 5 },
  testoBottone: { color: "white", fontSize: 16, fontWeight: "bold" },
  bottoneNuovo: { marginTop: 20, backgroundColor: "#34C759", padding: 15, borderRadius: 8, alignItems: "center" },
});
