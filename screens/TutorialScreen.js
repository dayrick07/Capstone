import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemeContext } from "../ThemeContext";

export default function TutorialScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);

  const theme = {
    background: isDarkMode ? "#121212" : "#fff",
    text: isDarkMode ? "#fff" : "#333",
    primary: isDarkMode ? "#A83232" : "#A83232",
    secondaryText: isDarkMode ? "#ccc" : "#333",
  };
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Emergency Response Tutorial</Text>
      <Text style={[styles.text, { color: theme.secondaryText }]}>
        👣 Step 1: Stay calm and assess the situation before taking action.{"\n\n"}
        📞 Step 2: Call emergency services immediately if someone is injured or in danger.{"\n\n"}
        🚨 Step 3: Provide first aid while waiting for help.{"\n\n"}
        💬 Step 4: Communicate clearly with rescuers or authorities once they arrive.{"\n\n"}
        🧠 Step 5: Always remember — safety comes first. Do not put yourself in harm’s way.
      </Text>

      <TouchableOpacity
        style={[styles.backButton, {backgroundColor: theme.primary}]}
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
