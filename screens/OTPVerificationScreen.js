import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function OTPVerificationScreen({ route, navigation }) {
  const { email, userData } = route.params;
  const [otp, setOtp] = useState("");

  const handleVerifyOTP = async () => {
    if (!otp) return Alert.alert("Error", "Please enter OTP");

    try {
      const res = await axios.post(`${SERVER_URL}/users/verify-otp`, { email, otp });
      if (res.data.success) {
        // Register user
        const registerRes = await axios.post(`${SERVER_URL}/users/signup`, userData);
        if (registerRes.data.success) {
          Alert.alert("Success", "Registration complete!");
          navigation.replace("LoginScreen");
        } else {
          Alert.alert("Error", registerRes.data.message || "Signup failed");
        }
      } else {
        Alert.alert("Error", "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enter the OTP sent to {email}</Text>
      <TextInput style={styles.input} placeholder="OTP" keyboardType="numeric" value={otp} onChangeText={setOtp} />
      <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
        <Text style={styles.buttonText}>Verify OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  text: { fontSize: 18, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginBottom: 20 },
  button: { backgroundColor: "#ff1a1a", padding: 15, borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
