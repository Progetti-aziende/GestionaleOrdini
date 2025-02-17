import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Animated
} from "react-native";
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc, query, orderBy, startAfter, limit } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { ActivityIndicator } from "react-native";
import { KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback } from "react-native";
import { useRef } from "react";



const ClientsScreen = () => {

  const [clients, setClients] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastVisible, setLastVisible] = useState(null); // Ultimo cliente caricato
  const [loadingMore, setLoadingMore] = useState(false); // Stato di caricamento paginato
  const [allLoaded, setAllLoaded] = useState(false); // Flag per capire se tutti i clienti sono stati caricati
  const pageSize = 10; // Numero di clienti caricati per volta
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("name"); // Campo di default per l'ordinamento
  const [sortOrder, setSortOrder] = useState("asc"); // Ordine di default (ascendente)
  const [successMessage, setSuccessMessage] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [totalClients, setTotalClients] = useState(0); // Nuovo stato per il numero totale di clienti
  const scrollY = useRef(new Animated.Value(0)).current; // Tiene traccia dello scroll
  const [isHeaderVisible, setIsHeaderVisible] = useState(true); // Controlla la visibilità della barra filtri
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],  // Dopo 100px di scroll verso il basso la barra scompare
    outputRange: [0, -120], // La barra viene traslata verso l'alto di  120px
    extrapolate: "clamp", // Impedisce che il valore esca fuori dai limiti
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0], // Da completamente visibile a completamente invisibile
    extrapolate: "clamp",
  });

  const getSortedClients = () => {
    return [...clients].sort((a, b) => {
      if (a[sortCriteria] < b[sortCriteria]) return sortAscending ? -1 : 1;
      if (a[sortCriteria] > b[sortCriteria]) return sortAscending ? 1 : -1;
      return 0;
    });
  };
  const [newClient, setNewClient] = useState({
    name: "",
    surname: "",
    businessName: "",
    companyName: "",
    vatNumber: "",
    email: "",
    phone: "",
    address: "",
    pec: "",
    sedeLegale: ""
  });
  const [expandedAll, setExpandedAll] = useState(false);
  const [expandedClients, setExpandedClients] = useState({});
  const showErrorPopup = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };
  const showSuccessPopup = (message) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);

    // La notifica scompare automaticamente dopo 2 secondi
    setTimeout(() => {
      setSuccessModalVisible(false);
    }, 2000);
  };
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
  const [filterType, setFilterType] = useState("name"); // Default: Nome
  const editNameInputRef = useRef(null); // Riferimento per il campo Nome
  const nameInputRef = useRef(null); // Riferimento per il campo Nome
  const openEditModal = (client) => {
    setSelectedClient({
      ...client,
      vatNumber: client.vatNumber ? String(client.vatNumber) : "", // Converte il numero in stringa
    });
    setModalVisible(true);
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

      // Mostra la notifica di successo
      showSuccessPopup("Cliente eliminato con successo!");

      setDeleteModalVisible(false);
      setClientToDelete(null);
    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
    }
  };
  // Funzione per validare la pec
  const isValidPEC = (pec) => {
    const pecRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Stesso formato email standard
    return pecRegex.test(pec);
  };
  // Funzione per validare l'email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  // Funzione per validare il numero di telefono
  const isValidPhone = (phone) => {
    const phoneRegex = /^[\d\s+()-]+$/; // Accetta numeri, spazi, +, -, ( e )
    return phone.length >= 7 && phone.length <= 15 && phoneRegex.test(phone);
  };
  // Funzione per validare la Partita IVA (11 numeri per l'Italia)
  const isValidVAT = (vatNumber) => {
    const vatRegex = /^\d{11}$/;
    return vatRegex.test(vatNumber);
  };

  const [errorFields, setErrorFields] = useState([]);

  // Funzione per aggiungere un nuovo cliente
  const handleAddClient = async () => {
    setErrorFields([]); // Resetta gli errori all'inizio della funzione

    const trimmedClient = {
      name: newClient.name.trim(),
      surname: newClient.surname.trim(),
      businessName: newClient.businessName.trim(),
      companyName: newClient.companyName.trim(),
      vatNumber: newClient.vatNumber.trim(),
      email: newClient.email.trim().toLowerCase(),
      phone: newClient.phone.trim(),
      address: newClient.address.trim(),
      createdAt: new Date().toISOString(),
      pec: newClient.pec.trim().toLowerCase(),
      sedeLegale: newClient.sedeLegale.trim(),
    };

    let errors = [];

    if (!trimmedClient.name) {
      errors.push("name");
      showErrorPopup("⚠️ Il nome è obbligatorio.");
    }
    if (!trimmedClient.surname) {
      errors.push("surname");
      showErrorPopup("⚠️ Il cognome è obbligatorio.");
    }
    if (!trimmedClient.businessName) {
      errors.push("businessName");
      showErrorPopup("⚠️ Il nome dell'attività è obbligatorio.");
    }
    if (!trimmedClient.email) {
      errors.push("email");
      showErrorPopup("⚠️ L'email è obbligatoria.");
    } else if (!isValidEmail(trimmedClient.email)) {
      errors.push("email");
      showErrorPopup("⚠️ L'email inserita non è valida.");
    }

    if (!trimmedClient.phone) {
      errors.push("phone");
      showErrorPopup("⚠️ Il numero di telefono è obbligatorio.");
    } else if (!isValidPhone(trimmedClient.phone)) {
      errors.push("phone");
      showErrorPopup("⚠️ Il numero di telefono deve contenere solo numeri e il simbolo +.");
    }

    if (!trimmedClient.pec) {
      errors.push("pec");
      showErrorPopup("⚠️ La PEC è obbligatoria.");
    } else if (!isValidPEC(trimmedClient.pec)) {
      errors.push("pec");
      showErrorPopup("⚠️ La PEC inserita non è valida.");
    }

    if (trimmedClient.vatNumber && !isValidVAT(trimmedClient.vatNumber)) {
      errors.push("vatNumber");
      showErrorPopup("⚠️ La Partita IVA deve contenere esattamente 11 cifre numeriche.");
    }

    if (errors.length > 0) {
      setErrorFields(errors);
      return;
    }

    try {
      const clientsRef = collection(db, "clients");
      const querySnapshot = await getDocs(clientsRef);

      const existingClient = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return (
          data.email.toLowerCase() === trimmedClient.email.toLowerCase() ||
          (trimmedClient.pec && data.pec.toLowerCase() === trimmedClient.pec.toLowerCase())
        );
      });

      if (existingClient) {
        let newErrorFields = [...errorFields];

        if (existingClient.data().email.toLowerCase() === trimmedClient.email.toLowerCase()) {
          showErrorPopup("❌ L'email inserita è già in uso da un altro cliente.");
          if (!newErrorFields.includes("email")) newErrorFields.push("email");
        } else {
          showErrorPopup("❌ La PEC inserita è già in uso da un altro cliente.");
          if (!newErrorFields.includes("pec")) newErrorFields.push("pec");
        }

        setErrorFields(newErrorFields);
        return;
      }

      // ✅ Se tutto è ok, aggiunge il cliente
      const docRef = await addDoc(clientsRef, trimmedClient);
      setClients([...clients, { id: docRef.id, ...trimmedClient }]);
      setAddModalVisible(false);
      setNewClient({
        name: "",
        surname: "",
        businessName: "",
        companyName: "",
        vatNumber: "",
        email: "",
        phone: "",
        address: "",
        pec: "",
        sedeLegale: ""
      });

      showSuccessPopup("✅ Cliente aggiunto con successo!");
    } catch (error) {
      console.error("❌ Errore durante l'aggiunta:", error);
      showErrorPopup("⚠️ Si è verificato un errore durante l'aggiunta. Riprova.");
    }
  };



  // Funzione per modificare un cliente
  const handleSaveChanges = async () => {
    setErrorFields([]); // Resetta gli errori all'inizio della funzione

    if (!selectedClient) return;

    const trimmedClient = {
      ...selectedClient,
      name: selectedClient.name.trim(),
      surname: selectedClient.surname.trim(),
      businessName: selectedClient.businessName.trim(),
      companyName: selectedClient.companyName.trim(),
      vatNumber: selectedClient.vatNumber.trim(),
      email: selectedClient.email.trim().toLowerCase(),
      phone: selectedClient.phone.trim(),
      address: selectedClient.address.trim(),
      pec: selectedClient.pec.trim().toLowerCase(),
      sedeLegale: selectedClient.sedeLegale.trim(),
    };

    let errors = [];

    if (!trimmedClient.name) {
      errors.push("name");
      showErrorPopup("⚠️ Il nome è obbligatorio.");
    }
    if (!trimmedClient.surname) {
      errors.push("surname");
      showErrorPopup("⚠️ Il cognome è obbligatorio.");
    }
    if (!trimmedClient.businessName) {
      errors.push("businessName");
      showErrorPopup("⚠️ Il nome dell'attività è obbligatorio.");
    }
    if (!trimmedClient.email) {
      errors.push("email");
      showErrorPopup("⚠️ L'email è obbligatoria.");
    } else if (!isValidEmail(trimmedClient.email)) {
      errors.push("email");
      showErrorPopup("⚠️ L'email inserita non è valida.");
    }

    if (!trimmedClient.phone) {
      errors.push("phone");
      showErrorPopup("⚠️ Il numero di telefono è obbligatorio.");
    } else if (!isValidPhone(trimmedClient.phone)) {
      errors.push("phone");
      showErrorPopup("⚠️ Il numero di telefono deve contenere solo numeri e il simbolo +.");
    }

    if (!trimmedClient.pec) {
      errors.push("pec");
      showErrorPopup("⚠️ La PEC è obbligatoria.");
    } else if (!isValidPEC(trimmedClient.pec)) {
      errors.push("pec");
      showErrorPopup("⚠️ La PEC inserita non è valida.");
    }

    if (trimmedClient.vatNumber && !isValidVAT(trimmedClient.vatNumber)) {
      errors.push("vatNumber");
      showErrorPopup("⚠️ La Partita IVA deve contenere esattamente 11 cifre numeriche.");
    }

    if (errors.length > 0) {
      setErrorFields(errors);
      return;
    }

    try {
      const clientsRef = collection(db, "clients");
      const querySnapshot = await getDocs(clientsRef);

      const existingClient = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return (
          (data.email.toLowerCase() === trimmedClient.email.toLowerCase() ||
            (trimmedClient.pec && data.pec.toLowerCase() === trimmedClient.pec.toLowerCase())) &&
          doc.id !== trimmedClient.id
        );
      });

      if (existingClient) {
        let newErrorFields = [...errorFields];

        if (existingClient.data().email.toLowerCase() === trimmedClient.email.toLowerCase()) {
          showErrorPopup("❌ L'email inserita è già in uso da un altro cliente.");
          if (!newErrorFields.includes("email")) newErrorFields.push("email");
        } else {
          showErrorPopup("❌ La PEC inserita è già in uso da un altro cliente.");
          if (!newErrorFields.includes("pec")) newErrorFields.push("pec");
        }

        setErrorFields(newErrorFields);
        return;
      }

      // ✅ Se tutto è ok, aggiorna il cliente
      const clientRef = doc(db, "clients", trimmedClient.id);
      await updateDoc(clientRef, { ...trimmedClient });

      setClients(clients.map(client => client.id === trimmedClient.id ? trimmedClient : client));
      setModalVisible(false);

      showSuccessPopup("✅ Cliente modificato con successo!");
    } catch (error) {
      console.error("❌ Errore durante la modifica:", error);
      showErrorPopup("⚠️ Si è verificato un errore durante la modifica. Riprova.");
    }
  };



  ;



  const fetchClients = async (loadMore = false) => {
    if (loadingMore || (loadMore && allLoaded)) return;

    try {
      if (!loadMore) setLoading(true);
      setLoadingMore(true);

      let queryRef = collection(db, "clients");
      let querySnapshot;

      if (loadMore && lastVisible) {
        // Se stiamo caricando più dati, continuiamo dalla posizione precedente
        querySnapshot = await getDocs(
          query(queryRef, orderBy("createdAt", "desc"), startAfter(lastVisible), limit(pageSize))
        );
      } else {
        // Primo caricamento della lista
        querySnapshot = await getDocs(query(queryRef, orderBy("createdAt", "desc"), limit(pageSize)));
      }

      // 🔹 Recupera il numero totale di clienti all'inizio
      const totalSnapshot = await getDocs(query(queryRef));
      setTotalClients(totalSnapshot.size); // Imposta il numero totale clienti

      if (!querySnapshot.empty) {
        const clientList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setClients((prevClients) => (loadMore ? [...prevClients, ...clientList] : clientList));

        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]); // Salviamo l'ultimo documento
      } else {
        setAllLoaded(true); // Se non ci sono più dati, lo segnaliamo
      }
    } catch (error) {
      console.error("Errore nel recupero clienti:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Effetto per sincronizzare espansione globale dei clienti
  useEffect(() => {
    setExpandedClients(clients.reduce((acc, client) => {
      acc[client.id] = expandedAll;
      return acc;
    }, {}));
  }, [expandedAll, clients]);

  useEffect(() => {
    if (modalVisible && editNameInputRef.current) {
      setTimeout(() => editNameInputRef.current.focus(), 100); // Ritardo per evitare bug
    }
  }, [modalVisible]);


  return (
    <View style={styles.container}>
      {/* ✅ HEADER SEMPRE VISIBILE: Titolo, Totale Clienti, Pulsante Aggiungi */}
      <View style={styles.fixedHeaderContainer}>
        <Text style={styles.title}>👥 Clienti</Text>
        <Text style={styles.clientCount}>Totale clienti: {totalClients}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setNewClient({
              name: "",
              surname: "",
              businessName: "",
              companyName: "",
              vatNumber: "",
              email: "",
              phone: "",
              address: "",
              pec: "",
              sedeLegale: ""
            });
            setAddModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ GESTIONE STATO: Loading, Nessun Cliente, o Lista Clienti */}
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loadingIndicator} />
      ) : clients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📭 Nessun cliente registrato.</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} keyboardVerticalOffset={80}>

            <Animated.View
              style={[
                styles.animatedHeader,
                { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity, marginTop: 20 },
              ]}
              pointerEvents="box-none" // ✅ Permette di cliccare elementi sottostanti
            >

              <TextInput style={styles.searchInput} placeholder="🔍 Cerca cliente, attività, ecc..." value={searchText} onChangeText={(text) => setSearchText(text)} />
              {/* Bottoni Filtro */}
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === "name" && styles.filterButtonActive]}
                  onPress={() => setFilterType("name")}
                >
                  <Text style={styles.filterText}>Nome</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === "surname" && styles.filterButtonActive]}
                  onPress={() => setFilterType("surname")}
                >
                  <Text style={styles.filterText}>Cognome</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === "businessName" && styles.filterButtonActive]}
                  onPress={() => setFilterType("businessName")}
                >
                  <Text style={styles.filterText}>Attività</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === "email" && styles.filterButtonActive]}
                  onPress={() => setFilterType("email")}
                >
                  <Text style={styles.filterText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === "address" && styles.filterButtonActive]}
                  onPress={() => setFilterType("address")}
                >
                  <Text style={styles.filterText}>Indirizzo</Text>
                </TouchableOpacity>
              </View>
              {/* Pulsanti di ordinamento */}
              <View style={styles.sortButtonsContainer}>
                <TouchableOpacity
                  style={[styles.sortButton, sortField === "name" && styles.sortButtonActive]}
                  onPress={() => setSortField("name")}
                >
                  <Text style={styles.sortButtonText}>
                    {sortField === "name" ? "✔️ Nome" : "Nome"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortButton, sortField === "businessName" && styles.sortButtonActive]}
                  onPress={() => setSortField("businessName")}
                >
                  <Text style={styles.sortButtonText}>
                    {sortField === "businessName" ? "✔️ Attività" : "Attività"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortButton, sortField === "createdAt" && styles.sortButtonActive]}
                  onPress={() => setSortField("createdAt")}
                >
                  <Text style={styles.sortButtonText}>
                    {sortField === "createdAt" ? "✔️ Data" : "Data"}
                  </Text>
                </TouchableOpacity>

                {/* Pulsante per invertire l'ordine */}
                <TouchableOpacity style={styles.orderButton} onPress={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}>
                  <Text style={styles.orderButtonText}>
                    {sortOrder === "asc" ? "🔼 Crescente" : "🔽 Decrescente"}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Bottone Espandi/Riduci Tutti */}
              <View style={styles.expandContainer}>
                <TouchableOpacity style={styles.expandAllButton} onPress={toggleExpandAll}>
                  <Text style={styles.expandAllText}>
                    {expandedAll ? "🔽 Riduci Tutti" : "🔼 Espandi Tutti"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>


            {/* FlatList */}
            <FlatList
              contentContainerStyle={{
                paddingBottom: 100, // Spazio per evitare che l'ultimo elemento venga tagliato
                paddingTop: isHeaderVisible ? 260 : 60, // Se i filtri sono visibili, aggiunge spazio sopra la lista
              }}
              style={{ flex: 1 }} // Occupa tutto lo spazio disponibile
              data={[...clients]
                .filter(client => client[filterType]?.toLowerCase().includes(searchText.toLowerCase()))
                .sort((a, b) => {
                  if (!a[sortField] || !b[sortField]) return 0;

                  if (sortField === "createdAt") {
                    // Converte le stringhe in date numeriche per confrontarle correttamente
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();

                    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
                  }

                  return sortOrder === "asc"
                    ? a[sortField].localeCompare(b[sortField])
                    : b[sortField].localeCompare(a[sortField]);
                })
              }
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.clientCard}>
                  <Text style={styles.clientName}>{item.name} {item.surname}</Text>
                  <Text style={styles.clientInfo}>🏢 {item.businessName}</Text>

                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() =>
                      setExpandedClients(prevState => ({
                        ...prevState,
                        [item.id]: !prevState[item.id],
                      }))
                    }
                  >
                    <Text style={styles.buttonText}>
                      {expandedClients[item.id] ? "➖" : "➕"}
                    </Text>
                  </TouchableOpacity>

                  {expandedClients[item.id] && (
                    <>
                      <Text style={styles.clientInfo}>📜 {item.companyName}</Text>
                      <Text style={styles.clientInfo}>💼 P.IVA: {item.vatNumber}</Text>
                      <Text style={styles.clientInfo}>📧 {item.email}</Text>
                      <Text style={styles.clientInfo}>📞 {item.phone}</Text>
                      <Text style={styles.clientInfo}>📍 {item.address}</Text>
                      <Text style={styles.clientInfo}>📨 {item.pec}</Text>
                      <Text style={styles.clientInfo}>📍 {item.sedeLegale}</Text>
                    </>
                  )}

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
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onEndReached={() => fetchClients(true)} // Carica più clienti quando si arriva in fondo
              onEndReachedThreshold={0.5} // Quando manca il 50% alla fine, carica più dati
              ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#3498db" />} // Mostra uno spinner mentre carica altri clienti
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            />
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Modale Aggiungi Cliente */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Modal visible={addModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>➕ Aggiungi Cliente</Text>

              <TextInput
                ref={nameInputRef} // Aggiunge il riferimento
                style={[styles.input, errorFields.includes("name") && styles.inputError]}
                placeholder="Nome"
                value={newClient.name}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, name: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "name"));
                }}
                autoFocus={true} // Imposta l'auto-focus
              />

              <TextInput style={[styles.input, errorFields.includes("surname") && styles.inputError]} placeholder="Cognome" value={newClient.surname}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, surname: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "surname"));
                }}
              />
              <TextInput style={[styles.input, errorFields.includes("businessName") && styles.inputError]} placeholder="Nome Attività" value={newClient.businessName}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, businessName: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "businessName"));
                }}
              />
              <TextInput style={[styles.input, errorFields.includes("companyName") && styles.inputError]} placeholder="Ragione Sociale" value={newClient.companyName}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, companyName: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "companyName"));
                }}
              />
              <TextInput style={[styles.input, errorFields.includes("vatNumber") && styles.inputError]} placeholder="P.IVA" value={newClient.vatNumber}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, vatNumber: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "vatNumber"));
                }}
              />
              <TextInput
                style={[styles.input, errorFields.includes("email") && styles.inputError]}
                placeholder="Email"
                value={newClient.email}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, email: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "email"));
                }}
                keyboardType="email-address" // Suggerisce la tastiera per le email
                autoCapitalize="none" // Evita che la prima lettera sia maiuscola
                onSubmitEditing={() => Keyboard.dismiss()} // Chiude la tastiera dopo l'inserimento
                blurOnSubmit={true} // Il campo perde il focus dopo la conferma
              />

              <TextInput
                style={[styles.input, errorFields.includes("phone") && styles.inputError]}
                placeholder="Telefono"
                value={newClient.phone}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, phone: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "phone"));
                }}
                keyboardType="phone-pad" // Suggerisce la tastiera per numeri di telefono
                onSubmitEditing={() => Keyboard.dismiss()} // Chiude la tastiera dopo l'inserimento
                blurOnSubmit={true} // Il campo perde il focus dopo la conferma
              />
              <TextInput style={[styles.input, errorFields.includes("address") && styles.inputError]} placeholder="Indirizzo" value={newClient.address}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, address: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "address"));
                }}
              />

              <TextInput
                style={[styles.input, errorFields.includes("pec") && styles.inputError]}
                placeholder="PEC"
                value={newClient.pec}
                keyboardType="email-address"
                onChangeText={(text) => {
                  setNewClient({ ...newClient, pec: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "pec"));
                }}
              />

              <TextInput
                style={[styles.input, errorFields.includes("sedeLegale") && styles.inputError]}
                placeholder="Sede Legale"
                value={newClient.sedeLegale}
                onChangeText={(text) => {
                  setNewClient({ ...newClient, sedeLegale: text });

                  // Se l'utente corregge il campo, rimuove l'errore dalla lista
                  setErrorFields((prev) => prev.filter((field) => field !== "sedeLegale"));
                }}
              />


              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddClient}>
                  <Text style={styles.buttonText}>💾 Salva</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setErrorFields([]); // Reset degli errori
                    setNewClient({  // Reset dei campi
                      name: "",
                      surname: "",
                      businessName: "",
                      companyName: "",
                      vatNumber: "",
                      email: "",
                      phone: "",
                      address: "",
                      pec: "",
                      sedeLegale: ""
                    });
                    setAddModalVisible(false); // Chiude il modale
                  }}
                >
                  <Text style={styles.buttonText}>❌ Annulla</Text>
                </TouchableOpacity>

              </View>
            </View>
          </View>
        </Modal>
      </TouchableWithoutFeedback>

      {/* Modale Modifica Cliente */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Modal visible={modalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>✏️ Modifica Cliente</Text>

              <TextInput
                ref={editNameInputRef} // Assegna il riferimento
                style={[styles.input, errorFields.includes("name") && styles.inputError]}
                placeholder="Nome"
                value={selectedClient?.name}
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, name: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "name"));
                }}
                autoFocus={true}
              />

              <TextInput style={[styles.input, errorFields.includes("surname") && styles.inputError]} placeholder="Cognome" value={selectedClient?.surname}
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, surname: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "surname"));
                }}
              />
              <TextInput style={[styles.input, errorFields.includes("businessName") && styles.inputError]} placeholder="Nome Attività" value={selectedClient?.businessName}
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, businessName: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "businessName"));
                }}
              />
              <TextInput style={[styles.input, errorFields.includes("companyName") && styles.inputError]} placeholder="Ragione Sociale" value={selectedClient?.companyName}
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, companyName: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "companyName"));
                }}
              />
              <TextInput style={[styles.input, errorFields.includes("vatNumber") && styles.inputError]} placeholder="P.IVA" value={selectedClient?.vatNumber}
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, vatNumber: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "vatNumber"));
                }}
              />
              <TextInput
                style={[styles.input, errorFields.includes("email") && styles.inputError]}
                placeholder="Email"
                value={selectedClient?.email}
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, email: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "email"));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={() => Keyboard.dismiss()}
                blurOnSubmit={true}
              />

              <TextInput
                style={[styles.input, errorFields.includes("phone") && styles.inputError]}
                placeholder="Telefono"
                value={selectedClient?.phone}
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, phone: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "phone"));
                }}
                keyboardType="phone-pad"
                onSubmitEditing={() => Keyboard.dismiss()}
                blurOnSubmit={true}
              />
              <TextInput style={styles.input} placeholder="Indirizzo" value={selectedClient?.address}
                onChangeText={(text) => setSelectedClient({ ...selectedClient, address: text })}
              />

              <TextInput
                style={[styles.input, errorFields.includes("pec") && styles.inputError]}
                placeholder="PEC"
                value={selectedClient?.pec}
                keyboardType="email-address"
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, pec: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "pec"));
                }}
              />

              <TextInput
                style={[styles.input, errorFields.includes("sedeLegale") && styles.inputError]}
                placeholder="Sede Legale"
                value={selectedClient?.sedeLegale}
                onChangeText={(text) => {
                  setSelectedClient({ ...selectedClient, sedeLegale: text });

                  // Rimuove l'errore se l'utente corregge il campo
                  setErrorFields((prev) => prev.filter((field) => field !== "sedeLegale"));
                }}
              />


              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                  <Text style={styles.buttonText}>💾 Salva</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setErrorFields([]); // Reset degli errori
                  setModalVisible(false);
                }}>
                  <Text style={styles.buttonText}>❌ Annulla</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </TouchableWithoutFeedback>

      {/* Modale Eliminazione Cliente */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
      </TouchableWithoutFeedback>

      {/* Modale per mostrare gli errori */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Modal visible={errorModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.errorModalContainer}>
              <Text style={styles.modalTitle}>⚠️ Errore</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>

              <TouchableOpacity style={styles.errorButton} onPress={() => setErrorModalVisible(false)}>
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </TouchableWithoutFeedback>

      {/* Modale per mostrare notifiche di successo */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Modal visible={successModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.successModalContainer}>
              <Text style={styles.modalTitle}>✅ Successo</Text>
              <Text style={styles.successText}>{successMessage}</Text>

              <TouchableOpacity style={styles.successButton} onPress={() => setSuccessModalVisible(false)}>
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </TouchableWithoutFeedback>

    </View>
  );
};
export default ClientsScreen;


const styles = StyleSheet.create({
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
  inputError: {
    borderColor: "#e74c3c", // ✅ Bordo rosso per i campi non validi
  },

  // Stili Modali (Popup)
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    pointerEvents: "box-none", // 👈 Questo permette di cliccare gli elementi figli
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
    position: "absolute",
    bottom: 20,      // Distante dal fondo dello schermo
    right: 20,       // Spostato a destra per facile accesso
    backgroundColor: "#2ecc71",
    width: 55,       // Leggermente più grande per miglior visibilità
    height: 55,
    borderRadius: 30, // Lo rende completamente circolare
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,    // Ombra su Android per effetto flottante
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 1000,
  },
  addButtonText: {
    fontSize: 26,   // Più grande per maggiore visibilità
    fontWeight: "bold",
    color: "#fff",
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
    backgroundColor: "#2c3e50", // Colore coerente con il pulsante di ordinamento
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 5,
    elevation: 3, // Ombra su Android
    shadowColor: "#000", // Ombra su iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  expandAllText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
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
  clientCount: {
    fontSize: 14,  // Dimensione più piccola rispetto al titolo
    color: "#555", // Colore grigio scuro per non distrarre
    textAlign: "center",
    marginBottom: 0, // Spazio prima della lista clienti
  },
  // Contenitore bottoni filtro
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  // Bottone filtro
  filterButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#ecf0f1",
    alignItems: "center",
    marginHorizontal: 2,
  },

  // Bottone attivo
  filterButtonActive: {
    backgroundColor: "#3498db",
  },

  // Testo bottone filtro
  filterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  // Modale di errore
  errorModalContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "#e74c3c", // Rosso errore
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  errorText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },

  errorButton: {
    marginTop: 15,
    backgroundColor: "#c0392b",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
  },
  loadingIndicator: {
    marginTop: 50,
    alignSelf: "center",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  toggleOrderButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#2ecc71",
  },
  toggleOrderText: {
    fontSize: 14,
    color: "#fff",
  },
  sortButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 8,
    elevation: 2,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
  },
  sortButtonActive: {
    backgroundColor: "#3498db",
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  orderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: "#2c3e50",
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  expandContainer: {
    alignItems: "center", // Centra il bottone
    marginVertical: 8, // Distanza uniforme
  },
  successModalContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "#2ecc71",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  successText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  successButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  flatListContainer: {
    flexGrow: 1,  // Assicura che la lista possa espandersi
    paddingBottom: 20, // Previene il taglio dell'ultimo elemento
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f4f4f4",
    padding: 10,
    zIndex: 10,
    elevation: 3,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  fixedHeaderContainer: {
    flexDirection: "column",  // Dispone gli elementi in colonna
    alignItems: "center",     // Centra il contenuto orizzontalmente
    justifyContent: "center", // Centra verticalmente
    paddingVertical: 10,      // Spazio sopra e sotto
    backgroundColor: "#fff",  // Sfondo bianco per evitare sovrapposizioni
    elevation: 3,             // Ombra su Android per separarlo dallo sfondo
    shadowColor: "#000",      // Ombra su iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }
});

