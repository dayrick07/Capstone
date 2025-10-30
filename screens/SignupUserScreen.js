import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SERVER_URL } from "../config";

export default function SignupUserScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [language, setLanguage] = useState("");
  const [birthdate, setBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !address || !email || !password || !gender || !language || !birthdate) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${SERVER_URL}/users/signup`, {
        name: fullName,
        email,
        password,
        type: "user",
        gender,
        mobile,
        language,
        birthdate: birthdate.toISOString().split("T")[0],
        address
      });

      if (response.data.success) {
        Alert.alert("Success", response.data.message);
        navigation.replace("LoginScreen");
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const showDatePickerModal = () => setShowDatePicker(true);
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setBirthdate(selectedDate);
  };

  return (
    <LinearGradient colors={["#ee7d7dff", "#8B0000"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 }}>Registration</Text>
        <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
        <TextInput style={styles.input} placeholder="Mobile" value={mobile} onChangeText={setMobile} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
        <View style={styles.pickerContainer}>
          <Picker selectedValue={gender} onValueChange={setGender}>
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={language} onValueChange={setLanguage}>
            <Picker.Item label="Select Language" value="" />
            <Picker.Item label="Tagalog" value="Tagalog" />
            <Picker.Item label="Kapampangan" value="Kapampangan" />
            <Picker.Item label="English" value="English" />
          </Picker>
        </View>
        <TouchableOpacity style={styles.datePickerButton} onPress={showDatePickerModal}>
          <Text style={styles.datePickerText}>{birthdate.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && <DateTimePicker value={birthdate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />}
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerText}>{loading ? "Registering..." : "Register"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 10 },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 10, marginBottom: 10 },
  datePickerButton: { backgroundColor: "#fff", borderRadius: 10, padding: 15, marginBottom: 10 },
  datePickerText: { color: "#000" },
  registerButton: { backgroundColor: "#fff", paddingVertical: 15, borderRadius: 10, marginTop: 10 },
  registerText: { textAlign: "center", fontWeight: "bold", fontSize: 24, color: "#000" },
});
