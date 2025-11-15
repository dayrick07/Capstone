import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SERVER_URL } from "../config";

export default function RescuerPageScreen({ navigation, route }) {
  const rescuerFromRoute = route.params?.rescuerData;

  if (!rescuerFromRoute) {
    navigation.replace("LoginScreen");
    return null;
  }

  const [rescuerData, setRescuerData] = useState(rescuerFromRoute);
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleSaveChanges = async () => {
    if (!rescuerData.Id) {
      Alert.alert("Error", "Rescuer ID is missing. Cannot update profile.");
      return;
    }

    if (!rescuerData.Name || !rescuerData.Mobile || !rescuerData.Type || !rescuerData.StationLocation) {
      Alert.alert("Missing Fields", "Please fill in all required fields before saving.");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${SERVER_URL}/rescuers/update/${rescuerData.Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rescuerData),
      });

      const text = await response.text(); // read as text first
      let result;
      try {
        result = JSON.parse(text); // parse JSON safely
      } catch (e) {
        console.log("Server returned non-JSON:", text);
        Alert.alert("Update Failed", "Server returned invalid response.");
        return;
      }

      if (result.success) {
        Alert.alert("Profile Updated", "Your changes have been saved successfully!");
        setEditMode(false);
      } else {
        Alert.alert("Update Failed", result.message || "Error updating profile");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Update Failed", "Cannot connect to server.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: () => navigation.replace("LoginScreen"),
      },
    ]);
  };

  return (
    <LinearGradient colors={["#ee7d7dff", "#8B0000"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.header}>Rescuer Profile</Text>
        <View style={styles.infoBox}>
          {editMode ? (
            <>
              <Text style={styles.label}>Full Name:</Text>
              <TextInput
                style={styles.input}
                value={rescuerData.Name}
                onChangeText={(text) => setRescuerData({ ...rescuerData, Name: text })}
              />

              <Text style={styles.label}>Email:</Text>
              <TextInput style={styles.input} value={rescuerData.Email} editable={false} />

              <Text style={styles.label}>Mobile:</Text>
              <TextInput
                style={styles.input}
                value={rescuerData.Mobile}
                onChangeText={(text) => setRescuerData({ ...rescuerData, Mobile: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Type:</Text>
              <TextInput
                style={styles.input}
                value={rescuerData.Type}
                onChangeText={(text) => setRescuerData({ ...rescuerData, Type: text })}
              />

              <Text style={styles.label}>Station Location:</Text>
              <TextInput
                style={styles.input}
                value={rescuerData.StationLocation}
                onChangeText={(text) => setRescuerData({ ...rescuerData, StationLocation: text })}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{rescuerData.Name}</Text>

              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{rescuerData.Email}</Text>

              <Text style={styles.label}>Mobile:</Text>
              <Text style={styles.value}>{rescuerData.Mobile}</Text>

              <Text style={styles.label}>Type:</Text>
              <Text style={styles.value}>{rescuerData.Type}</Text>

              <Text style={styles.label}>Station Location:</Text>
              <Text style={styles.value}>{rescuerData.StationLocation}</Text>
            </>
          )}
        </View>

        {editMode ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={updating}>
            <Text style={styles.saveText}>{updating ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 },
  infoBox: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 15, padding: 20, marginBottom: 30 },
  label: { fontSize: 16, fontWeight: "bold", color: "#8B0000" },
  value: { fontSize: 16, marginBottom: 10, color: "#000" },
  input: { backgroundColor: "#fff", borderColor: "#8B0000", borderWidth: 1, borderRadius: 10, padding: 8, marginBottom: 10 },
  editButton: { backgroundColor: "#fff", paddingVertical: 15, borderRadius: 10, marginBottom: 10 },
  editText: { textAlign: "center", fontWeight: "bold", fontSize: 18, color: "#8B0000" },
  saveButton: { backgroundColor: "#32CD32", paddingVertical: 15, borderRadius: 10, marginBottom: 10 },
  saveText: { textAlign: "center", fontWeight: "bold", fontSize: 18, color: "#fff" },
  logoutButton: { backgroundColor: "#FF4500", paddingVertical: 15, borderRadius: 10, marginTop: 10 },
  logoutText: { textAlign: "center", fontWeight: "bold", fontSize: 18, color: "#fff" },
});
