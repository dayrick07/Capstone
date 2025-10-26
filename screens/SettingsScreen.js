import React, { useContext } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ThemeContext } from "../ThemeContext";

export default function SettingsScreen({ navigation }) {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const themeStyles = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.container, themeStyles.container]}>
      <Text style={[styles.title, themeStyles.text]}>App Settings</Text>

      <View style={styles.row}>
        <Text style={[styles.label, themeStyles.text]}>Dark Mode</Text>
        <Switch value={isDarkMode} onValueChange={toggleTheme} />
      </View>

      <TouchableOpacity
        style={[styles.backButton, themeStyles.button]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backText, themeStyles.buttonText]}>
          Back to Dashboard
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const lightTheme = {
  container: { backgroundColor: "#fff" },
  text: { color: "#222" },
  button: { backgroundColor: "#A83232" },
  buttonText: { color: "#fff" },
};

const darkTheme = {
  container: { backgroundColor: "#121212" },
  text: { color: "#fff" },
  button: { backgroundColor: "#fff" },
  buttonText: { color: "#121212" },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
  },
  backButton: {
    marginTop: 40,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
