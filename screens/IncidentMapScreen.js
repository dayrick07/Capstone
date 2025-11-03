import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function IncidentMapScreen({ route }) {
  const { incident } = route.params;

  // Check if the incident has valid coordinates
  if (!incident.Latitude || !incident.Longitude) {
    Alert.alert("No location data", "This incident has no valid coordinates.");
    return (
      <View style={styles.center}>
        <Text style={styles.noData}>⚠️ No location data available for this incident.</Text>
      </View>
    );
  }

  // Convert to numbers (in case they are strings)
  const latitude = parseFloat(incident.Latitude);
  const longitude = parseFloat(incident.Longitude);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={incident.Type}
          description={incident.Location}
          pinColor="red"
        />
      </MapView>

      {/* Incident Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.title}>{incident.Type}</Text>
        <Text style={styles.text}>📍 {incident.Location}</Text>
        <Text style={styles.text}>🕒 Status: {incident.Status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  noData: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  infoBox: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#A83232",
    marginBottom: 5,
  },
  text: { fontSize: 14, color: "#333" },
});
