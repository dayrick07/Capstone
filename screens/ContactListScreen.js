import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  Platform,
  Linking
} from "react-native";
import { ThemeContext } from "../ThemeContext";
import axios from "axios";

const SERVER_URL = "http://192.168.0.111:3000";

export default function ContactListScreen({ route, navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { userData } = route.params;
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: "#A83232",
    card: isDarkMode ? "#1E1E1E" : "#F8F8F8",
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/contacts/${userData.Id}`);
      if (res.data.success) setContacts(res.data.contacts);
    } catch (err) {
      console.error("❌ Fetch contacts error:", err.message);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const openModalForNew = () => {
    setCurrentContact(null);
    setName("");
    setPhone("");
    setRelationship("");
    setModalVisible(true);
  };

  const openModalForEdit = (contact) => {
    setCurrentContact(contact);
    setName(contact.Name);
    setPhone(contact.Phone);
    setRelationship(contact.Relationship || "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing Info", "Please enter both name and phone number.");
      return;
    }

    try {
      if (currentContact) {
        const res = await axios.put(`${SERVER_URL}/contacts/${currentContact.Id}`, {
          Name: name.trim(),
          Phone: phone.trim(),
          Relationship: relationship.trim(),
          UserId: userData.Id,
        });
        if (res.data.success) Alert.alert("Success", "Contact updated successfully!");
      } else {
        const res = await axios.post(`${SERVER_URL}/contacts`, {
          Name: name.trim(),
          Phone: phone.trim(),
          Relationship: relationship.trim(),
          UserId: userData.Id,
        });
        if (res.data.success) Alert.alert("Success", "Contact added successfully!");
      }
      fetchContacts();
      setModalVisible(false);
    } catch (err) {
      console.error("❌ Save contact error:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to save contact.");
    }
  };

  const handleDelete = (contactId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/contacts/${contactId}`);
            fetchContacts();
          } catch (err) {
            console.error("❌ Delete contact error:", err.message);
            Alert.alert("Error", "Failed to delete contact.");
          }
        },
      },
    ]);
  };

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.contactCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.name, { color: theme.text }]}>{item.Name}</Text>
      {item.Relationship ? (
        <Text style={[styles.relationship, { color: theme.text }]}>{item.Relationship}</Text>
      ) : null}
      <Text style={[styles.number, { color: theme.text }]}>{item.Phone}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
          onPress={() => handleCall(item.Phone)}
        >
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#FFA500" }]}
          onPress={() => openModalForEdit(item)}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#A83232" }]}
          onPress={() => handleDelete(item.Id)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <Text style={styles.headerText}>Emergency Contacts</Text>
      </View>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity onPress={openModalForNew} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Contact</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.Id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {currentContact ? "Edit Contact" : "Add New Contact"}
            </Text>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.text }]}
              placeholder="Enter Name"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.text }]}
              placeholder="Relationship (optional)"
              placeholderTextColor="#888"
              value={relationship}
              onChangeText={setRelationship}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.text }]}
              placeholder="Enter Phone Number"
              placeholderTextColor="#888"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 16, justifyContent: "center", alignItems: "center" },
  headerText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  addButtonContainer: { marginTop: 10, alignItems: "center" },
  addButton: { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, elevation: 3 },
  addButtonText: { color: "#A83232", fontWeight: "bold", fontSize: 16 },
  contactCard: { margin: 8, borderRadius: 10, padding: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: "bold" },
  relationship: { fontSize: 14, marginTop: 2 },
  number: { fontSize: 14, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: Platform.OS === "ios" ? 30 : 10 },
  saveBtn: { backgroundColor: "#A83232", padding: 10, borderRadius: 8, width: "45%" },
  cancelBtn: { backgroundColor: "#888", padding: 10, borderRadius: 8, width: "45%" },
  saveText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  cancelText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  actionBtn: { flex: 1, marginHorizontal: 4, padding: 8, borderRadius: 8, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "bold" },
});
