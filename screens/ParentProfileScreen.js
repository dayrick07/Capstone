import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { ThemeContext } from "../ThemeContext";

export default function ParentProfileScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => navigation.navigate("ParentalSetupScreen") },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "dark" ? "#121212" : "#fff" },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme === "dark" ? "#fff" : "#A83232" },
        ]}
      >
        👤 Parent Profile
      </Text>

      <Text style={[styles.info, { color: theme === "dark" ? "#fff" : "#333" }]}>
        Name: John Dayrick Panlilio{"\n"}
        Email: parent@example.com{"\n"}
        Role: Parent
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme === "dark" ? "#BB86FC" : "#A83232" },
        ]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  info: { fontSize: 18, textAlign: "center", marginBottom: 40 },
  button: { padding: 12, borderRadius: 10, width: "70%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
