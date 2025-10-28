import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function RescuerHomeScreen({ navigation, route }) {
  const rescuer = route.params?.rescuerData || { Name: "Rescuer" };
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch incidents from server
  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${SERVER_URL}/incidents`);
      if (response.data.success) {
        setIncidents(response.data.incidents);
      } else {
        Alert.alert("Error", "Failed to load incidents.");
      }
    } catch (error) {
      console.error("❌ Fetch Incidents Error:", error.message);
      Alert.alert("Error", "Cannot fetch incidents. Make sure your API is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Update incident status
  const updateStatus = async (incidentId, status) => {
    try {
      const response = await axios.put(`${SERVER_URL}/incidents/${incidentId}/status`, { status });
      if (response.data.success) {
        Alert.alert("Success", `Status updated to ${status}`);
        fetchIncidents(); // refresh list
      } else {
        Alert.alert("Error", "Failed to update status.");
      }
    } catch (error) {
      console.error("❌ Update Status Error:", error.message);
      Alert.alert("Error", "Cannot update status.");
    }
  };

  // Show options for incident
  const handleIncidentPress = (incident) => {
    Alert.alert(
      "Update Incident Status",
      `Type: ${incident.Type}\nLocation: ${incident.Location}\nCurrent Status: ${incident.Status}`,
      [
        { text: "Pending", onPress: () => updateStatus(incident.Id, "Pending") },
        { text: "Accepted", onPress: () => updateStatus(incident.Id, "Accepted") },
        { text: "Done", onPress: () => updateStatus(incident.Id, "Done") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <LinearGradient colors={["#ee7d7dff", "#8B0000"]} style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {rescuer.Name}!</Text>
      <Text style={styles.roleText}>Rescuer</Text>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Alert.alert("Info", "Scroll down to see incidents.")}
        >
          <Text style={styles.buttonText}>View Incidents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("RescuerPageScreen", { rescuerData: rescuer })}
        >
          <Text style={styles.buttonText}>Profile & Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Incident List */}
      <Text style={styles.sectionTitle}>Nearby Incidents</Text>
      {loading ? (
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>Loading incidents...</Text>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.Id.toString()}
          renderItem={({ item }) => (
            <View style={styles.incidentCard}>
              <Text style={styles.incidentType}>{item.Type}</Text>
              <Text style={styles.incidentDetails}>{item.Location}</Text>
              <Text style={styles.incidentStatus}>Status: {item.Status}</Text>

              {/* Buttons inside card */}
              <View style={styles.cardButtonContainer}>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => handleIncidentPress(item)}
                >
                  <Text style={styles.statusButtonText}>Update Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => navigation.navigate("IncidentMapScreen", { incident: item })}
                >
                  <Text style={styles.mapButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  welcomeText: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  roleText: { fontSize: 16, color: "#fff", marginBottom: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  button: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "bold", color: "#8B0000" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  incidentCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  incidentType: { fontSize: 16, fontWeight: "bold", color: "#8B0000" },
  incidentDetails: { fontSize: 14, color: "#000" },
  incidentStatus: { fontSize: 14, color: "#555", marginTop: 5 },
  cardButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    backgroundColor: "#8B0000",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 5,
  },
  statusButtonText: { color: "#fff", fontWeight: "bold" },
  mapButton: {
    flex: 1,
    backgroundColor: "#ff7d7d",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 5,
  },
  mapButtonText: { color: "#fff", fontWeight: "bold" },
});
