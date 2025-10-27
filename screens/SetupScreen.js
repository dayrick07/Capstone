import React, { useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext"; // adjust path

const SetupScreen = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: "#A83232",
    buttonBackground: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    buttonText: isDarkMode ? "#FFFFFF" : "#A83232",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* 🔘 Toggle Theme Button */}
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: theme.header }]}>Choose Setup Type</Text>

      {/* Setup Options */}
      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: theme.buttonBackground }]}
        onPress={() => navigation.navigate("VoiceSetupScreen")}
      >
        <Text style={[styles.optionText, { color: theme.buttonText }]}>🎙 Voice Setup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: theme.buttonBackground }]}
        onPress={() => navigation.navigate("PhysicalGestureSetupScreen")}
      >
        <Text style={[styles.optionText, { color: theme.buttonText }]}>✋ Physical Gesture Setup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: theme.buttonBackground }]}
        onPress={() => navigation.navigate("ParentalSetupScreen")}
      >
        <Text style={[styles.optionText, { color: theme.buttonText }]}>👨‍👩‍👧 Parental Setup</Text>
      </TouchableOpacity>

      {/* Home Button */}
      <View style={styles.homeContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("DashboardScreen")}>
          <Ionicons name="home-outline" size={32} color={theme.header} />
          <Text style={[styles.homeText, { color: theme.text }]}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#fff", marginLeft: 5, fontSize: 16, fontWeight: "500" },
  themeToggle: { padding: 5 },
  title: { fontSize: 24, fontWeight: "bold", marginVertical: 30 },
  optionButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
    elevation: 4,
  },
  optionText: { fontSize: 16, fontWeight: "bold" },
  homeContainer: { position: "absolute", bottom: 40, alignItems: "center" },
  homeText: { fontSize: 14, marginTop: 5 },
});

export default SetupScreen;
