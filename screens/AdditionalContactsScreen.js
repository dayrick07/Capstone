// screens/AdditionalContactsScreen.js
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as Contacts from "expo-contacts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";

export default function AdditionalContactsScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [savedContacts, setSavedContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: "#A83232",
    card: isDarkMode ? "#1E1E1E" : "#F8F8F8",
    button: "#A83232",
  };

  useEffect(() => {
    const loadContacts = async () => {
      const data = await AsyncStorage.getItem("emergencyContacts");
      if (data) setSavedContacts(JSON.parse(data));
    };
    const unsubscribe = navigation.addListener("focus", loadContacts);
    return unsubscribe;
  }, [navigation]);

  const saveContacts = async (contacts) => {
    setSavedContacts(contacts);
    await AsyncStorage.setItem("emergencyContacts", JSON.stringify(contacts));
  };

  const addFromDevice = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Access to contacts is required.");
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    if (data.length > 0) {
      const contact = data[0]; // for simplicity, pick first contact
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const newEntry = {
          name: contact.name,
          phone: contact.phoneNumbers[0].number,
        };
        const updated = [...savedContacts, newEntry];
        await saveContacts(updated);
        Alert.alert("Success", "Contact added from phone list.");
      }
    }
  };

  const createManualContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    const updated = [...savedContacts, newContact];
    await saveContacts(updated);
    setNewContact({ name: "", phone: "" });
    Alert.alert("Success", "Contact saved successfully!");
  };

  const removeContact = async (index) => {
    const updated = savedContacts.filter((_, i) => i !== index);
    await saveContacts(updated);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Additional Contacts</Text>
        <View style={{ width: 24 }} /> {/* placeholder for alignment */}
      </View>

      {/* List */}
      <FlatList
        data={savedContacts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View>
              <Text style={[styles.contactName, { color: theme.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.contactPhone, { color: theme.text }]}>
                {item.phone}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeContact(index)}>
              <Ionicons name="trash-outline" size={22} color={theme.header} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={[styles.emptyText, { color: theme.text }]}
          >
            No additional contacts yet.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 150 }}
      />

      {/* Manual Add Form */}
      <ScrollView
        style={[styles.form, { backgroundColor: theme.card }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.formTitle, { color: theme.header }]}>
          Create New Contact
        </Text>
        <TextInput
          placeholder="Contact Name"
          placeholderTextColor="#888"
          value={newContact.name}
          onChangeText={(text) => setNewContact({ ...newContact, name: text })}
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? "#2C2C2C" : "#FFF",
              color: theme.text,
            },
          ]}
        />
        <TextInput
          placeholder="Phone Number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={newContact.phone}
          onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? "#2C2C2C" : "#FFF",
              color: theme.text,
            },
          ]}
        />
      </ScrollView>

      {/* Fixed Buttons */}
      <View style={[styles.footerButtons, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.button }]}
          onPress={createManualContact}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Save Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.button }]}
          onPress={addFromDevice}
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Add from Contacts</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    elevation: 3,
  },
  contactName: { fontSize: 16, fontWeight: "bold" },
  contactPhone: { fontSize: 14, opacity: 0.8 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    opacity: 0.7,
  },
  form: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  footerButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-evenly",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
  },
});
