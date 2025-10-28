import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";

export default function RescuerPageScreen({ navigation, route }) {
  const rescuer = route.params?.rescuerData || {
    Name: "Rescuer Name",
    Email: "rescuer@example.com",
    Mobile: "09123456789",
    Type: "Police",
    StationLocation: "Brgy. Santo Rosario",
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => navigation.replace("LoginScreen"),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rescuer Profile</Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{rescuer.Name}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{rescuer.Email}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Mobile:</Text>
        <Text style={styles.value}>{rescuer.Mobile}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Type:</Text>
        <Text style={styles.value}>{rescuer.Type}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Station Location:</Text>
        <Text style={styles.value}>{rescuer.StationLocation}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#8B0000", textAlign: "center" },
  infoCard: { marginBottom: 15, padding: 15, backgroundColor: "#f2f2f2", borderRadius: 10 },
  label: { fontWeight: "bold", color: "#555" },
  value: { fontSize: 16, color: "#000", marginTop: 5 },
  logoutButton: { marginTop: 30, backgroundColor: "#8B0000", padding: 15, borderRadius: 10, alignItems: "center" },
  logoutText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
