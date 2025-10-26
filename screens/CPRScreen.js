import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemeContext } from "../ThemeContext";

export default function CPRScreen({ navigation }) {
   const { isDarkMode } = useContext(ThemeContext);
  
    const theme = {
      background: isDarkMode ? "#121212" : "#fff",
      text: isDarkMode ? "#fff" : "#333",
      primary: isDarkMode ? "#A83232" : "#A83232", // button color remains same
      secondaryText: isDarkMode ? "#ccc" : "#333",
    }
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>How to Perform CPR</Text>
      <Text style={[styles.text, { color: theme.secondaryText }]}>
        🫀 Step 1: Check the scene for safety.{"\n\n"}
        🫀 Step 2: Check if the person is responsive and breathing.{"\n\n"}
        🫀 Step 3: Call emergency services or ask someone nearby to do it.{"\n\n"}
        🫀 Step 4: Start chest compressions — place your hands on the center of the chest and push hard and fast at 100–120 beats per minute.{"\n\n"}
        🫀 Step 5: If trained, give 2 rescue breaths after every 30 compressions.{"\n\n"}
        🫀 Step 6: Continue CPR until medical help arrives or the person regains consciousness.
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
