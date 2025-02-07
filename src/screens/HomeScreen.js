import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.titolo}>📌 Gestionale Magazzino</Text>

      <TouchableOpacity style={styles.sezione} onPress={() => navigation.navigate("Clients")}>
        <Text style={styles.sezioneTesto}>👥 Clienti</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sezione} onPress={() => navigation.navigate("Products")}>
        <Text style={styles.sezioneTesto}>📦 Prodotti</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sezione} onPress={() => navigation.navigate("Orders")}>
        <Text style={styles.sezioneTesto}>🛒 Ordini</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8", alignItems: "center", justifyContent: "center" },
  titolo: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  sezione: {
    width: "80%",
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  sezioneTesto: { color: "white", fontSize: 20, fontWeight: "bold" },
});
