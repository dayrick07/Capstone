import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../ThemeContext";

export default function CreatePinScreen({ navigation }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const { theme } = useContext(ThemeContext);

  const handleCreatePin = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      Alert.alert("Error", "PIN must be 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert("Error", "PINs do not match.");
      return;
    }

    await AsyncStorage.setItem("parentPin", pin);
    Alert.alert("Success", "PIN created successfully!");
    navigation.navigate("ParentalSetupScreen");
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
        🔒 Create New PIN
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme === "dark" ? "#BB86FC" : "#A83232",
            color: theme === "dark" ? "#fff" : "#000",
          },
        ]}
        placeholder="Enter 4-digit PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />

      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme === "dark" ? "#BB86FC" : "#A83232",
            color: theme === "dark" ? "#fff" : "#000",
          },
        ]}
        placeholder="Confirm PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
        value={confirmPin}
        onChangeText={setConfirmPin}
      />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme === "dark" ? "#BB86FC" : "#A83232" },
        ]}
        onPress={handleCreatePin}
      >
        <Text style={styles.buttonText}>Save PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 30 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    width: "70%",
    padding: 10,
    textAlign: "center",
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 10,
    width: "70%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
