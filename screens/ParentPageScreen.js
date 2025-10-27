import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";

export default function ParentPageScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);

  const openProfile = () => navigation.navigate("ParentProfileScreen");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "dark" ? "#121212" : "#fff" },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: theme === "dark" ? "#fff" : "#A83232" },
          ]}
        >
          👨‍👩‍👧 Parent Dashboard
        </Text>
        <TouchableOpacity onPress={openProfile}>
          <Ionicons
            name="person-circle-outline"
            size={40}
            color={theme === "dark" ? "#BB86FC" : "#A83232"}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme === "dark" ? "#BB86FC" : "#A83232" },
        ]}
        onPress={() => navigation.navigate("MyChildrenScreen")}
      >
        <Text style={styles.buttonText}>My Children</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme === "dark" ? "#BB86FC" : "#A83232" },
        ]}
        onPress={() => navigation.navigate("AdditionalContactsScreen")}
      >
        <Text style={styles.buttonText}>Additional Contacts</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
