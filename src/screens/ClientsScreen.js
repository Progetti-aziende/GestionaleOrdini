import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

const ClientsScreen = () => {
  const [clients, setClients] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [expandAll, setExpandAll] = useState(false);


  useEffect(() => {
    const fetchClients = async () => {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientList);
    };

    fetchClients();
  }, []);

  const openEditModal = (client) => {
    setSelectedClient(client);
    setModalVisible(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedClient) return;

    try {
      const clientRef = doc(db, "clients", selectedClient.id);
      await updateDoc(clientRef, { ...selectedClient });

      setClients(clients.map((client) =>
        client.id === selectedClient.id ? selectedClient : client
      ));

      setModalVisible(false);
    } catch (error) {
      console.error("Errore durante la modifica:", error);
    }
  };

  const openDeleteModal = (client) => {
    setClientToDelete(client);
    setDeleteModalVisible(true);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await deleteDoc(doc(db, "clients", clientToDelete.id));
      setClients(clients.filter((client) => client.id !== clientToDelete.id));
      setDeleteModalVisible(false);
      setClientToDelete(null);
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Clienti</Text>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.clientCard}>
            <Text style={styles.clientName}>{item.name} {item.surname}</Text>
            <Text style={styles.clientInfo}>🏢 {item.businessName}</Text>
            <Text style={styles.clientInfo}>📜 {item.companyName}</Text>
            <Text style={styles.clientInfo}>💼 P.IVA: {item.vatNumber}</Text>
            <Text style={styles.clientInfo}>📧 {item.email}</Text>
            <Text style={styles.clientInfo}>📞 {item.phone}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                <Text style={styles.buttonText}>✏️ Modifica</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={() => openDeleteModal(item)}>
                <Text style={styles.buttonText}>🗑️ Elimina</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modale Modifica Cliente */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✏️ Modifica Cliente</Text>

            <TextInput style={styles.input} placeholder="Nome" value={selectedClient?.name}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, name: text })}
            />
            <TextInput style={styles.input} placeholder="Cognome" value={selectedClient?.surname}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, surname: text })}
            />
            <TextInput style={styles.input} placeholder="Nome Attività" value={selectedClient?.businessName}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, businessName: text })}
            />
            <TextInput style={styles.input} placeholder="Ragione Sociale" value={selectedClient?.companyName}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, companyName: text })}
            />
            <TextInput style={styles.input} placeholder="P.IVA" value={selectedClient?.vatNumber}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, vatNumber: text })}
            />
            <TextInput style={styles.input} placeholder="Email" value={selectedClient?.email}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, email: text })}
            />
            <TextInput style={styles.input} placeholder="Telefono" value={selectedClient?.phone}
              onChangeText={(text) => setSelectedClient({ ...selectedClient, phone: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                <Text style={styles.buttonText}>💾 Salva</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>❌ Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modale Eliminazione Cliente */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚠️ Eliminare questo cliente?</Text>
            <Text style={styles.clientInfo}>
              Sei sicuro di voler eliminare{" "}
              <Text style={{ fontWeight: "bold" }}>{clientToDelete?.name} {clientToDelete?.surname}</Text>?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleDeleteClient}>
                <Text style={styles.buttonText}>✅ Sì, Elimina</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.buttonText}>❌ Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default ClientsScreen;


const styles = StyleSheet.create({
  // Stili generali
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#f4f4f4" 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "bold", 
    marginBottom: 15, 
    textAlign: "center", 
    color: "#333" 
  },

  // Card Cliente
  clientCard: { 
    backgroundColor: "#ffffff", 
    padding: 15, 
    marginVertical: 8, 
    borderRadius: 10, 
    elevation: 3, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  clientName: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#2c3e50", 
    marginBottom: 5 
  },
  clientInfo: { 
    fontSize: 14, 
    color: "#555", 
    marginBottom: 3 
  },

  // Bottoni Modifica ed Elimina
  buttonContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 12 
  },
  editButton: { 
    backgroundColor: "#3498db", 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 8, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 5 
  },
  deleteButton: { 
    backgroundColor: "#e74c3c", 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 8, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 5 
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#fff" 
  },

  // Input campi Modifica Cliente
  input: { 
    width: "100%", 
    padding: 12, 
    borderWidth: 1.5, 
    borderColor: "#ccc", 
    borderRadius: 10, 
    marginBottom: 10, 
    fontSize: 16, 
    backgroundColor: "#fff" 
  },
  // Stili Modali (Popup)
  modalOverlay: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0, 0, 0, 0.5)" 
  },
  modalContainer: { 
    width: "90%", 
    padding: 25, 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 5 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 15, 
    color: "#333" 
  },
  // Bottoni Modale
  modalButtons: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 15 
  },
  saveButton: { 
    backgroundColor: "#2ecc71", 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 8, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 5 
  },
  cancelButton: { 
    backgroundColor: "#e74c3c", 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 8, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 5 
  },
  deleteConfirmButton: { 
    backgroundColor: "#e74c3c", 
    paddingVertical: 12, 
    paddingHorizontal: 18, 
    borderRadius: 8, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 5 
  },
  toggleAllButton: { 
    backgroundColor: "#2980b9", 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 8, 
    alignSelf: "center", 
    marginBottom: 10 
  },
  toggleAllText: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#fff" 
  },  
});