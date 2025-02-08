import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const EditProductScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [nome, setNome] = useState("");
  const [prezzo, setPrezzo] = useState("");
  const [descrizione, setDescrizione] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productRef = doc(db, "prodotti", productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          setNome(productData.nome);
          setPrezzo(productData.prezzo.toString());
          setDescrizione(productData.descrizione || "");
        } else {
          Alert.alert("Errore", "Prodotto non trovato");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Errore nel recupero del prodotto:", error);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleUpdateProduct = async () => {
    try {
      const productRef = doc(db, "prodotti", productId);
      await updateDoc(productRef, {
        nome,
        prezzo: parseFloat(prezzo),
        descrizione,
      });
      Alert.alert("Successo", "Prodotto aggiornato con successo");
      navigation.goBack();
    } catch (error) {
      console.error("Errore nell'aggiornamento del prodotto:", error);
    }
  };

  const handleDeleteProduct = async () => {
    Alert.alert("Conferma", "Sei sicuro di voler eliminare questo prodotto?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          try {
            const productRef = doc(db, "prodotti", productId);
            await deleteDoc(productRef);
            Alert.alert("Eliminato", "Prodotto eliminato con successo");
            navigation.goBack();
          } catch (error) {
            console.error("Errore nella cancellazione del prodotto:", error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome Prodotto</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />

      <Text style={styles.label}>Prezzo</Text>
      <TextInput
        style={styles.input}
        value={prezzo}
        onChangeText={setPrezzo}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Descrizione</Text>
      <TextInput style={styles.input} value={descrizione} onChangeText={setDescrizione} multiline />

      <Button title="Salva Modifiche" onPress={handleUpdateProduct} />
      <Button title="Elimina Prodotto" onPress={handleDeleteProduct} color="red" />
    </View>
  );
};

export default EditProductScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
