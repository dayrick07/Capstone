import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function UserPageScreen({ navigation, route }) {
  const userDataFromRoute = route.params?.userData;

  if (!userDataFromRoute) {
    navigation.replace("LoginScreen");
    return null;
  }
// At the top, before your component
const SERVER_URL = "http://192.168.0.111:3000"; // replace with your PC's local IP

  const [userData, setUserData] = useState(userDataFromRoute);
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleSaveChanges = async () => {
    if (!userData.Name || !userData.mobile || !userData.address) {
      Alert.alert("Missing Fields", "Please fill in all required fields before saving.");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${SERVER_URL}/users/update/${userData.Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const result = await response.json();

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
        <Text style={styles.header}>User Information</Text>
        <View style={styles.infoBox}>
          {editMode ? (
            <>
              <Text style={styles.label}>Full Name:</Text>
              <TextInput
                style={styles.input}
                value={userData.Name}
                onChangeText={(text) => setUserData({ ...userData, Name: text })}
              />

              <Text style={styles.label}>Email:</Text>
              <TextInput style={styles.input} value={userData.Email} editable={false} />

              <Text style={styles.label}>Address:</Text>
              <TextInput
                style={styles.input}
                value={userData.address}
                onChangeText={(text) => setUserData({ ...userData, address: text })}
              />

              <Text style={styles.label}>Phone Number:</Text>
              <TextInput
                style={styles.input}
                value={userData.mobile}
                onChangeText={(text) => setUserData({ ...userData, mobile: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Gender:</Text>
              <TextInput
                style={styles.input}
                value={userData.gender}
                onChangeText={(text) => setUserData({ ...userData, gender: text })}
              />

              <Text style={styles.label}>Language:</Text>
              <TextInput
                style={styles.input}
                value={userData.language}
                onChangeText={(text) => setUserData({ ...userData, language: text })}
              />

              <Text style={styles.label}>Birthdate (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.input}
                value={userData.birthdate}
                onChangeText={(text) => setUserData({ ...userData, birthdate: text })}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{userData.Name}</Text>

              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{userData.Email}</Text>

              <Text style={styles.label}>Phone Number:</Text>
              <Text style={styles.value}>{userData.mobile}</Text>

              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{userData.address}</Text>

              <Text style={styles.label}>Gender:</Text>
              <Text style={styles.value}>{userData.gender}</Text>

              <Text style={styles.label}>Language:</Text>
              <Text style={styles.value}>{userData.language}</Text>

              <Text style={styles.label}>Birthdate:</Text>
              <Text style={styles.value}>{userData.birthdate}</Text>
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

        {/* Logout Button */}
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
