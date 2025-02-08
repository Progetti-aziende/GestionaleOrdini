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
import { addDoc } from "firebase/firestore";


const ClientsScreen = () => {
  const [clients, setClients] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    surname: "",
    businessName: "",
    companyName: "",
    vatNumber: "",
    email: "",
    phone: "",
    address: "",
  });
  const [expandedAll, setExpandedAll] = useState(false);
  const [expandedClients, setExpandedClients] = useState({});
// Funzione per espandere/ridurre tutti i clienti
  const toggleExpandAll = () => {
    setExpandedAll(!expandedAll);
    setExpandedClients((prevState) => {
      const newState = {};
      clients.forEach((client) => {
        newState[client.id] = !expandedAll;
      });
      return newState;
    });
  };
  const [searchText, setSearchText] = useState("");



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

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.surname || !newClient.businessName) return;
  
    try {
      const clientRef = collection(db, "clients");
      const docRef = await addDoc(clientRef, newClient);
  
      setClients([...clients, { id: docRef.id, ...newClient }]);
      setAddModalVisible(false);
      setNewClient({
        name: "",
        surname: "",
        businessName: "",
        companyName: "",
        vatNumber: "",
        email: "",
        phone: "",
        address: ""
      });
    } catch (error) {
      console.error("Errore durante l'aggiunta:", error);
    }
  };
  
  

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>📋 Clienti</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.searchInput} placeholder="🔍 Cerca cliente, attività, ecc..." value={searchText} onChangeText={(text) => setSearchText(text)}/>


      {/* Bottone Espandi/Riduci Tutti (Minimal, posizionato sotto il titolo) */}
      <TouchableOpacity style={styles.expandAllButton} onPress={toggleExpandAll}>
        <Text style={styles.expandAllText}>
          {expandedAll ? "🔽" : "🔼"}
        </Text>
      </TouchableOpacity>


      <FlatList
        data={clients.filter(client =>
          `${client.name} ${client.surname} ${client.businessName} ${client.email} ${client.address} ${client.phone}`
            .toLowerCase()
            .includes(searchText.toLowerCase())
        )}      
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.clientCard}>
            {/* Nome e Cognome sempre visibili */}
            <Text style={styles.clientName}>{item.name} {item.surname}</Text>
            <Text style={styles.clientInfo}>🏢 {item.businessName}</Text>

            {/* Bottone Espandi/Riduci in alto a destra */}
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() =>
                setExpandedClients((prevState) => ({
                  ...prevState,
                  [item.id]: !prevState[item.id],
                }))
              }
            >
              <Text style={styles.buttonText}>
                {expandedClients[item.id] ? "➖" : "➕"}
              </Text>
            </TouchableOpacity>

            {/* Mostra altre informazioni solo se il cliente è espanso */}
            {expandedClients[item.id] && (
              <>
                <Text style={styles.clientInfo}>📜 {item.companyName}</Text>
                <Text style={styles.clientInfo}>💼 P.IVA: {item.vatNumber}</Text>
                <Text style={styles.clientInfo}>📧 {item.email}</Text>
                <Text style={styles.clientInfo}>📞 {item.phone}</Text>
                <Text style={styles.clientInfo}>📍 {item.address}</Text>
              </>
            )}

            {/* Bottoni: Modifica ed Elimina */}
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
            <TextInput style={styles.input} placeholder="Indirizzo" value={selectedClient?.address} 
              onChangeText={(text) => setSelectedClient({ ...selectedClient, address: text })} 
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

      {/* Modale Aggiungi Cliente */}
      <Modal visible={addModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>➕ Aggiungi Cliente</Text>

            <TextInput style={styles.input} placeholder="Nome" value={newClient.name}
              onChangeText={(text) => setNewClient({ ...newClient, name: text })}
            />
            <TextInput style={styles.input} placeholder="Cognome" value={newClient.surname}
              onChangeText={(text) => setNewClient({ ...newClient, surname: text })}
            />
            <TextInput style={styles.input} placeholder="Nome Attività" value={newClient.businessName}
              onChangeText={(text) => setNewClient({ ...newClient, businessName: text })}
            />
            <TextInput style={styles.input} placeholder="Ragione Sociale" value={newClient.companyName}
              onChangeText={(text) => setNewClient({ ...newClient, companyName: text })}
            />
            <TextInput style={styles.input} placeholder="P.IVA" value={newClient.vatNumber}
              onChangeText={(text) => setNewClient({ ...newClient, vatNumber: text })}
            />
            <TextInput style={styles.input} placeholder="Email" value={newClient.email}
              onChangeText={(text) => setNewClient({ ...newClient, email: text })}
            />
            <TextInput style={styles.input} placeholder="Telefono" value={newClient.phone}
              onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
            />
            <TextInput style={styles.input} placeholder="Indirizzo" value={newClient.address} 
              onChangeText={(text) => setNewClient({ ...newClient, address: text })}
            />


            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddClient}>
                <Text style={styles.buttonText}>💾 Salva</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)}>
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
    padding: 15, // Ridotto leggermente il padding generale
    backgroundColor: "#f4f4f4" 
  },
  title: { 
    fontSize: 24, // Ridotto da 26 a 22
    fontWeight: "bold", 
    marginBottom: 12, // Spazio più compatto
    textAlign: "center", 
    color: "#333" 
  },

  // Card Cliente
  clientCard: { 
    backgroundColor: "#ffffff", 
    padding: 12, // Ridotto il padding interno
    marginVertical: 6, // Meno spazio tra i box
    borderRadius: 8, // Raggi più piccoli per un design più compatto
    elevation: 2, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3 
  },
  clientName: { 
    fontSize: 18, // Ridotto da 22 a 18
    fontWeight: "bold", 
    color: "#2c3e50", 
    marginBottom: 4 
  },
  clientInfo: { 
    fontSize: 12, // Ridotto da 14 a 12
    color: "#555", 
    marginBottom: 2 
  },
  // Bottoni Modifica ed Elimina
  buttonContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 8 // Ridotto spazio sopra i bottoni
  },
  editButton: { 
    backgroundColor: "#3498db", 
    paddingVertical: 10, // Ridotto il padding verticale
    paddingHorizontal: 14, // Ridotto il padding orizzontale
    borderRadius: 6, // Angoli meno arrotondati
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 4 
  },
  deleteButton: { 
    backgroundColor: "#e74c3c", 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    borderRadius: 6, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 4 
  },
  buttonText: { 
    fontSize: 14, // Ridotto da 16 a 14
    fontWeight: "600", 
    color: "#fff" 
  },

  // Input campi Modifica Cliente
  input: { 
    width: "100%", 
    padding: 10, // Ridotto il padding
    borderWidth: 1.2, // Ridotto il bordo
    borderColor: "#ccc", 
    borderRadius: 8, // Meno arrotondati
    marginBottom: 8, // Meno spazio tra i campi
    fontSize: 14, // Ridotto da 16 a 14
    backgroundColor: "#fff" 
  },

  // Stili Modali (Popup)
  modalOverlay: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0, 0, 0, 0.4)" // Ridotta opacità per un effetto meno pesante
  },
  modalContainer: { 
    width: "90%", 
    padding: 20, // Ridotto il padding interno
    backgroundColor: "#fff", 
    borderRadius: 10, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 4 
  },
  modalTitle: { 
    fontSize: 18, // Ridotto da 20 a 18
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 12, // Meno spazio sotto il titolo
    color: "#333" 
  },

  // Bottoni Modale
  modalButtons: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 12 
  },
  saveButton: { 
    backgroundColor: "#2ecc71", 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    borderRadius: 6, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 4 
  },
  cancelButton: { 
    backgroundColor: "#e74c3c", 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    borderRadius: 6, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 4 
  },
  deleteConfirmButton: { 
    backgroundColor: "#e74c3c", 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    borderRadius: 6, 
    flex: 1, 
    alignItems: "center", 
    marginHorizontal: 4 
  },
  // Bottone Aggiungi Cliente
  addButton: { 
    backgroundColor: "#2ecc71", 
    width: 40, 
    height: 40, 
    borderRadius: 18, 
    justifyContent: "center", 
    alignItems: "center", 
    position: "absolute",  // Posizionamento assoluto per mantenerlo allineato
    right: 10,  // Allineato a destra
    top: -5,  // Piccola regolazione per l'altezza rispetto a "Clienti"
    elevation: 3, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 3 
  },
  addButtonText: { 
    fontSize: 20, // Ridotto da 24 a 20
    fontWeight: "bold", 
    color: "#fff" 
  },

  // Bottone Espandi Cliente
  expandButton: {
    position: "absolute", 
    top: 8, // Avvicinato alla parte superiore
    right: 8, // Avvicinato al bordo destro
    backgroundColor: "transparent",
  },

  // Bottone Espandi/Riduci Tutti
  expandAllButton: {
    alignSelf: "flex-start", 
    marginLeft: 8, // Avvicinato al bordo sinistro
    marginBottom: 12, // Distanza dalla lista clienti
  },
  expandAllText: {
    fontSize: 14, // Ridotto da 16 a 14
    fontWeight: "bold",
    color: "#2c3e50",
    textDecorationLine: "underline",
  },
  searchInput: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  clientInfo: { 
    fontSize: 12, 
    color: "#555", 
    marginBottom: 2 
  },  
});
