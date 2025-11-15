import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemeContext } from "../ThemeContext";

export default function WoundCareScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);

  const theme = {
    background: isDarkMode ? "#121212" : "#fff",
    text: isDarkMode ? "#fff" : "#333",
    primary: isDarkMode ? "#A83232" : "#A83232",
    secondaryText: isDarkMode ? "#ccc" : "#333",
  }
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Wound Care Steps</Text>
      <Text style={[styles.text, { color: theme.secondaryText }]}>
        🩹 Step 1: Wash your hands before touching the wound.{"\n\n"}
        🩹 Step 2: Stop any bleeding by applying gentle pressure with a clean cloth.{"\n\n"}
        🩹 Step 3: Clean the wound with mild soap and water — avoid alcohol or hydrogen peroxide.{"\n\n"}
        🩹 Step 4: Apply an antibiotic ointment to prevent infection.{"\n\n"}
        🩹 Step 5: Cover with a sterile bandage or dressing.{"\n\n"}
        🩹 Step 6: Change the dressing daily or whenever it becomes wet or dirty.{"\n\n"}
        🩹 Step 7: Seek medical help if the wound is deep, won’t stop bleeding, or shows signs of infection.
      </Text>

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#A83232",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: "#333",
    lineHeight: 26,
    textAlign: "justify",
  },
  backButton: {
    marginTop: 30,
    backgroundColor: "#A83232",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
