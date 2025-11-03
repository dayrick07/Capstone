import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SERVER_URL } from "../config";

export default function RescuerSignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("Police");
  const [gender, setGender] = useState("Male");
  const [mobile, setMobile] = useState("");
  const [language, setLanguage] = useState("");
  const [birthdate, setBirthdate] = useState(new Date());
  const [address, setAddress] = useState("");
  const [stationLocation, setStationLocation] = useState(""); // station name
  const [marker, setMarker] = useState({ latitude: 15.0330, longitude: 120.6849 }); // default center
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const showDatePickerModal = () => setShowDatePicker(true);
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setBirthdate(selectedDate);
  };

  const handleMapPress = (e) => {
    setMarker(e.nativeEvent.coordinate);
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !mobile || !address || !stationLocation) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${SERVER_URL}/rescuers/signup`, {
        name,
        email,
        password,
        type,
        gender,
        mobile,
        language,
        birthdate: birthdate.toISOString().split("T")[0],
        address,
        stationLocation,
        latitude: marker.latitude,
        longitude: marker.longitude,
        contact: mobile
      });

      if (response.data.success) {
        Alert.alert("Signup Success", response.data.message);
        navigation.goBack();
      } else {
        Alert.alert("Signup Failed", response.data.message);
      }
    } catch (error) {
      console.error("Signup Error:", error.message);
      Alert.alert("Signup Failed", "Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#ee7d7dff", "#8B0000"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Rescuer Registration</Text>

        <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <View style={styles.pickerContainer}>
          <Picker selectedValue={type} onValueChange={setType}>
            <Picker.Item label="Police" value="Police" />
            <Picker.Item label="Fire Station" value="Fire Station" />
            <Picker.Item label="Ambulance" value="Ambulance" />
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker selectedValue={gender} onValueChange={setGender}>
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
          </Picker>
        </View>

        <TextInput style={styles.input} placeholder="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Language" value={language} onChangeText={setLanguage} />

        <TouchableOpacity style={styles.datePickerButton} onPress={showDatePickerModal}>
          <Text style={styles.datePickerText}>{birthdate.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={birthdate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />
        )}

        <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
        <TextInput style={styles.input} placeholder="Station Name" value={stationLocation} onChangeText={setStationLocation} />

        <Text style={styles.mapLabel}>Pick Station Location on Map:</Text>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 15.0330,
            longitude: 120.6849,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={handleMapPress}
        >
          <Marker coordinate={marker} title="Station Location" />
        </MapView>

        <TouchableOpacity style={styles.registerButton} onPress={handleSignup}>
          <Text style={styles.registerText}>{loading ? "Signing up..." : "Sign Up"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  header: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 10 },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 10, marginBottom: 10 },
  datePickerButton: { backgroundColor: "#fff", borderRadius: 10, padding: 15, marginBottom: 10 },
  datePickerText: { color: "#000" },
  mapLabel: { fontSize: 16, marginBottom: 5, marginTop: 10, color: "#fff" },
  map: { width: "100%", height: 200, marginBottom: 10 },
  registerButton: { backgroundColor: "#fff", paddingVertical: 15, borderRadius: 10, marginTop: 10 },
  registerText: { textAlign: "center", fontWeight: "bold", fontSize: 24, color: "#000" },
});
