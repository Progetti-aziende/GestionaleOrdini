import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const EditClientScreen = ({ route, navigation }) => {
  const { clientId } = route.params;
  const [nome, setNome] = useState("");
  const [piva, setPiva] = useState("");
  const [indirizzo, setIndirizzo] = useState("");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const clientRef = doc(db, "clienti", clientId);
        const clientSnap = await getDoc(clientRef);
        if (clientSnap.exists()) {
          const clientData = clientSnap.data();
          setNome(clientData.nome);
          setPiva(clientData.piva);
          setIndirizzo(clientData.indirizzo);
        } else {
          Alert.alert("Errore", "Cliente non trovato");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Errore nel recupero del cliente:", error);
      }
    };

    fetchClient();
  }, [clientId]);

  const handleUpdateClient = async () => {
    try {
      const clientRef = doc(db, "clienti", clientId);
      await updateDoc(clientRef, {
        nome,
        piva,
        indirizzo,
      });
      Alert.alert("Successo", "Cliente aggiornato con successo");
      navigation.goBack();
    } catch (error) {
      console.error("Errore nell'aggiornamento del cliente:", error);
    }
  };

  const handleDeleteClient = async () => {
    Alert.alert("Conferma", "Sei sicuro di voler eliminare questo cliente?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          try {
            const clientRef = doc(db, "clienti", clientId);
            await deleteDoc(clientRef);
            Alert.alert("Eliminato", "Cliente eliminato con successo");
            navigation.goBack();
          } catch (error) {
            console.error("Errore nella cancellazione del cliente:", error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome Cliente</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />

      <Text style={styles.label}>Partita IVA</Text>
      <TextInput style={styles.input} value={piva} onChangeText={setPiva} />

      <Text style={styles.label}>Indirizzo</Text>
      <TextInput style={styles.input} value={indirizzo} onChangeText={setIndirizzo} multiline />

      <Button title="Salva Modifiche" onPress={handleUpdateClient} />
      <Button title="Elimina Cliente" onPress={handleDeleteClient} color="red" />
    </View>
  );
};

export default EditClientScreen;
