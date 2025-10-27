// screens/AddChildScreen.js
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";

export default function AddChildScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: "#A83232",
    inputBackground: isDarkMode ? "#1E1E1E" : "#F8F8F8",
    border: isDarkMode ? "#BB86FC" : "#A83232",
    buttonBackground: isDarkMode ? "#BB86FC" : "#A83232",
    buttonText: "#FFFFFF",
  };

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contact, setContact] = useState("");
  const [safePassword, setSafePassword] = useState("");
  const [age, setAge] = useState("");

  const handleSave = async () => {
    if (!name || !relationship || !contact || !safePassword) {
      Alert.alert("Incomplete", "Please fill in all required fields.");
      return;
    }

    const newChild = { name, relationship, contact, safePassword, age };
    const existing = await AsyncStorage.getItem("childrenList");
    const list = existing ? JSON.parse(existing) : [];
    list.push(newChild);

    await AsyncStorage.setItem("childrenList", JSON.stringify(list));
    Alert.alert("Saved", "Child information successfully saved!");
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Child</Text>
        <View style={{ width: 24 }} /> {/* placeholder for symmetry */}
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Fill up the form below</Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Child's Full Name"
          placeholderTextColor={isDarkMode ? "#888" : "#999"}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Relationship (Father, Mother, etc.)"
          placeholderTextColor={isDarkMode ? "#888" : "#999"}
          value={relationship}
          onChangeText={setRelationship}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Alternate Contact Number"
          placeholderTextColor={isDarkMode ? "#888" : "#999"}
          keyboardType="phone-pad"
          value={contact}
          onChangeText={setContact}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Safe Password (for security)"
          placeholderTextColor={isDarkMode ? "#888" : "#999"}
          secureTextEntry
          value={safePassword}
          onChangeText={setSafePassword}
        />

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
          placeholder="Child's Age (optional)"
          placeholderTextColor={isDarkMode ? "#888" : "#999"}
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.buttonBackground }]}
          onPress={handleSave}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: theme.header }]}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#fff", marginLeft: 5, fontSize: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  scroll: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginVertical: 8,
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },
  buttonText: { fontSize: 16, fontWeight: "bold" },
  cancelButton: { marginTop: 15, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "bold" },
});
