import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState("User"); // User or Rescuer
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const endpoint = role === "User" ? "/users/login" : "/rescuers/login";
      const response = await axios.post(`${SERVER_URL}${endpoint}`, { email, password });

      if (response.data.success) {
        const user = response.data.user || response.data.rescuer;
        Alert.alert("Login Successful", `Welcome ${user.Name}`);
        if (role === "User") {
          navigation.replace("DashboardScreen", { userData: user });
        } else {
          navigation.replace("RescuerHomeScreen", { rescuerData:  response.data.rescuer });
        }
      } else {
        Alert.alert("Error", response.data.message || "Login failed");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Unable to connect to server. Make sure your Node.js API is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#ee7d7dff", "#ff1a1a"]} style={styles.container}>
      <Image source={require("../assets/logo.png")} style={styles.logo} />
      <Text style={styles.locationText}>Only in San Fernando, Pampanga.</Text>

      {/* Role Selection */}
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: role === "User" ? "#fff" : "rgba(255,255,255,0.3)",
            borderRadius: 10,
            marginRight: 5,
            alignItems: "center",
          }}
          onPress={() => setRole("User")}
        >
          <Text style={{ fontWeight: "bold", color: role === "User" ? "#ff1a1a" : "#fff" }}>User Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: role === "Rescuer" ? "#fff" : "rgba(255,255,255,0.3)",
            borderRadius: 10,
            marginLeft: 5,
            alignItems: "center",
          }}
          onPress={() => setRole("Rescuer")}
        >
          <Text style={{ fontWeight: "bold", color: role === "Rescuer" ? "#ff1a1a" : "#fff" }}>Rescuer Login</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#fff"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#fff"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.loginbutton} onPress={handleLogin}>
        {loading ? <ActivityIndicator size="large" color="#ff1a1a" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <View style={styles.bottomButtons}>
        {role === "User" ? (
          <TouchableOpacity onPress={() => navigation.navigate("SignupUserScreen")}>
            <Text style={styles.signupButtonText}>Bago ka dito? Sign up muna!</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate("RescuerSignupScreen")}>
            <Text style={styles.signupButtonText}>Bago ka dito? Sign up as Rescuer!</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: 120, height: 120, marginBottom: 10 },
  locationText: { fontSize: 13, color: '#fff', marginBottom: 40 },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#fff',
    marginBottom: 15,
  },
  loginbutton: {
    width: '100%',
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  buttonText: { fontSize: 22, fontWeight: 'bold', color: '#ff1a1a' },
  bottomButtons: { marginTop: 20 },
  signupButtonText: { color: '#fff', fontSize: 16 },
});
