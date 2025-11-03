import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";

const SERVER_URL = "http://192.168.0.111:3000"; // your backend local IP

export default function RescuerHomeScreen({ navigation, route }) {
  const rescuerData = route.params?.rescuerData; // Get logged-in rescuer

  if (!rescuerData) {
    Alert.alert("Error", "No rescuer data found. Returning to login.");
    navigation.replace("LoginScreen");
    return null;
  }

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${SERVER_URL}/incidents`);
      if (response.data.success) {
        const activeIncidents = response.data.incidents.filter(
          (i) => i.Status !== "Done"
        );
        setIncidents(activeIncidents);
      }
    } catch (err) {
      console.error("❌ Fetch Incidents Error:", err.message);
      Alert.alert("Error", "Cannot fetch incidents from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleViewOnMap = (incident) => {
    if (!incident.Latitude || !incident.Longitude) {
      Alert.alert("No Location Data", "This incident has no valid coordinates.");
      return;
    }
    navigation.navigate("IncidentMapScreen", { incident });
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await axios.put(`${SERVER_URL}/incidents/${id}/status`, {
        status,
      });
      if (response.data.success) {
        Alert.alert("Updated", `Incident marked as ${status}`);
        fetchIncidents();
      }
    } catch (err) {
      console.error("❌ Update Status Error:", err.message);
      Alert.alert("Error", "Failed to update incident status.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚨 Active Incidents</Text>
      <FlatList
        data={incidents}
        keyExtractor={(item) => item.Id.toString()}
        refreshing={loading}
        onRefresh={fetchIncidents}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.Type}</Text>
            <Text>📍 {item.Location}</Text>
            <Text>Status: {item.Status}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#007bff" }]}
                onPress={() => handleViewOnMap(item)}
              >
                <Text style={styles.buttonText}>View on Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#A83232" }]}
                onPress={() =>
                  Alert.alert("Confirm", "Mark this incident as done?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Yes", onPress: () => updateStatus(item.Id, "Done") },
                  ])
                }
              >
                <Text style={styles.buttonText}>Mark Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.profileButton}
        onPress={() =>
          navigation.navigate("RescuerPageScreen", {
            rescuerData: rescuerData,
          })
        }
      >
        <Text style={styles.profileText}>👤 View Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#8B0000",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  profileButton: {
    backgroundColor: "#8B0000",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  profileText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
