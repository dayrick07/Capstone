// screens/CreateContactScreen.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";

export default function CreateContactScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [safePassword, setSafePassword] = useState("");

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: "#A83232",
    inputBg: isDarkMode ? "#1E1E1E" : "#F8F8F8",
  };

  const saveContact = async () => {
    if (!name || !relationship || !phone) {
      Alert.alert("Missing Info", "Please fill out all required fields.");
      return;
    }

    const newContact = { name, relationship, phone, safePassword };
    const existing = JSON.parse(await AsyncStorage.getItem("emergencyContacts")) || [];
    existing.push(newContact);
    await AsyncStorage.setItem("emergencyContacts", JSON.stringify(existing));

    Alert.alert("Saved", "Contact has been added successfully!");
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Contact</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
          placeholder="Child/Contact Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
          placeholder="Relationship to Child"
          placeholderTextColor="#888"
          value={relationship}
          onChangeText={setRelationship}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
          placeholder="Alternate Contact Number"
          placeholderTextColor="#888"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
          placeholder="Safe Password (optional)"
          placeholderTextColor="#888"
          secureTextEntry
          value={safePassword}
          onChangeText={setSafePassword}
        />

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.header }]} onPress={saveContact}>
          <Text style={styles.saveText}>Save Contact</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#fff", marginLeft: 5, fontSize: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  form: { padding: 20 },
  input: {
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  saveButton: {
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
    padding: 15,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
