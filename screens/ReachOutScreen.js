import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemeContext } from "../ThemeContext";

export default function ReachOutScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  
    const theme = {
      background: isDarkMode ? "#121212" : "#fff",
      text: isDarkMode ? "#fff" : "#333",
      primary: isDarkMode ? "#A83232" : "#A83232", // button color remains same
      secondaryText: isDarkMode ? "#ccc" : "#333",
    }
  const handleEmail = () => {
    Linking.openURL("mailto:support@safekafernandino.com");
  };

  const handleFacebook = () => {
    Linking.openURL("https://www.facebook.com/SafeKaFernandino");
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Reach Out to Us</Text>
      <Text style={[styles.text, { color: theme.secondaryText }]}>
        If you have questions, concerns, or feedback, please reach out through any of the channels below:
      </Text>

      <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
        <Text style={styles.contactText}>📧 Email: support@safekafernandino.com</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactButton} onPress={handleFacebook}>
        <Text style={styles.contactText}>📘 Facebook: Safe Ka Fernandino</Text>
      </TouchableOpacity>

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
    textAlign: "justify",
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
  },
  contactText: {
    fontSize: 16,
    color: "#333",
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
