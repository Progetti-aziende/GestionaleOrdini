import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const ClientsScreen = ({ navigation }) => {
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, "clienti"));
      setClienti(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchClients();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>👥 Lista Clienti</Text>

      <FlatList
        data={clienti}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.clienteItem}>
            <Text>{item.nome} - {item.p_iva}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.bottone} onPress={() => navigation.navigate("NewClient")}>
        <Text style={styles.testoBottone}>➕ Aggiungi Cliente</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ClientsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  titolo: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  clienteItem: { backgroundColor: "#fff", padding: 10, borderRadius: 5, marginBottom: 5 },
  bottone: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  testoBottone: { color: "white", fontSize: 18, fontWeight: "bold" },
});
