import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemeContext } from "../ThemeContext";

export default function SkinBurnScreen({ navigation }) {
   const { isDarkMode } = useContext(ThemeContext);

  const theme = {
    background: isDarkMode ? "#121212" : "#fff",
    text: isDarkMode ? "#fff" : "#333",
    primary: isDarkMode ? "#A83232" : "#A83232", // button color remains same
    secondaryText: isDarkMode ? "#ccc" : "#333",
  };
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Skin Burn First Aid</Text>
      <Text style={[styles.text, { color: theme.secondaryText }]}>
        🔥 Step 1: Remove the person from the source of the burn.{"\n\n"}
        🔥 Step 2: Cool the burned area with cool (not cold) running water for 10–20 minutes.{"\n\n"}
        🔥 Step 3: Do NOT apply ice, butter, or toothpaste.{"\n\n"}
        🔥 Step 4: Remove any jewelry or tight clothing before swelling starts.{"\n\n"}
        🔥 Step 5: Cover the burn with a clean, non-stick sterile dressing.{"\n\n"}
        🔥 Step 6: Seek medical attention for severe, large, or facial burns.
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
