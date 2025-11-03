import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";
import axios from "axios";

const SERVER_URL = "http://192.168.0.111:3000";

export default function CreateContactScreen({ route, navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { user } = route.params; // Logged-in user
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: "#A83232",
    inputBg: isDarkMode ? "#1E1E1E" : "#F8F8F8",
  };

  const saveContact = async () => {
    if (!name || !phone) {
      Alert.alert("Missing Info", "Please enter Name and Phone.");
      return;
    }

    const newContact = {
      name: name,
      relationship: relationship,
      phone: phone,
      userId: user.Id, // assign to logged-in user
    };

    try {
      const res = await axios.post(`${SERVER_URL}/contacts`, newContact);
      if (res.data.success) {
        Alert.alert("Saved", "Contact has been added successfully!");
        navigation.goBack(); // parent screen will fetch contacts again
      }
    } catch (err) {
      console.error("❌ Save contact error:", err.message);
      Alert.alert("Error", "Failed to save contact to backend.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.topBar, { backgroundColor: theme.header }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Contact</Text>
          </View>

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
          </View>
        </ScrollView>

        <View style={[styles.bottomButtonContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.header }]}
            onPress={saveContact}
          >
            <Text style={styles.saveText}>Save Contact</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 15 },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#fff", marginLeft: 5, fontSize: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  form: { padding: 20 },
  input: { borderRadius: 10, padding: 12, marginVertical: 8, fontSize: 16 },
  bottomButtonContainer: { paddingHorizontal: 20, paddingBottom: Platform.OS === "ios" ? 30 : 15 },
  saveButton: { borderRadius: 10, alignItems: "center", padding: 15 },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
