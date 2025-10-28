import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  FlatList,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { ThemeContext } from "../ThemeContext";
import { SERVER_URL } from "../config";

// Haversine formula to calculate distance
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const NearbyRescuerScreen = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [location, setLocation] = useState(null);
  const [stations, setStations] = useState([]);
  const [nearestId, setNearestId] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      // Fetch stations safely
      try {
        const response = await fetch(`${SERVER_URL}/stations`);
        const text = await response.text();
        console.log("Raw backend response:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.error("❌ JSON Parse Error:", jsonErr);
          Alert.alert(
            "Error",
            "Invalid response from server. Please check backend."
          );
          return;
        }

        if (data.success && data.stations.length > 0) {
          const listWithDistance = data.stations
            .map((s) => ({
              ...s,
              distance: getDistanceInKm(
                loc.coords.latitude,
                loc.coords.longitude,
                s.Latitude,
                s.Longitude
              ),
            }))
            .sort((a, b) => a.distance - b.distance);

          setStations(listWithDistance);
          setNearestId(listWithDistance[0].Id); // highlight nearest station
        } else {
          console.log("No stations found or success=false");
        }
      } catch (err) {
        console.error("❌ Fetch Stations Error:", err);
        Alert.alert(
          "Error",
          "Failed to fetch stations. Check server or network."
        );
      }
    })();
  }, []);

  const themeColors = {
    backgroundColor: isDarkMode ? "#121212" : "#fff",
    textColor: isDarkMode ? "#fff" : "#000",
  };

  if (!location) {
    return (
      <View
        style={[styles.center, { backgroundColor: themeColors.backgroundColor }]}
      >
        <Text style={{ color: themeColors.textColor }}>Loading map...</Text>
      </View>
    );
  }

  const centerMapOnStation = (station) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: station.Latitude,
          longitude: station.Longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.backgroundColor }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
      >
        {/* Active user */}
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="You are here"
          pinColor="purple"
        />

        {/* Stations */}
        {stations.map((station) => (
          <Marker
            key={station.Id}
            coordinate={{ latitude: station.Latitude, longitude: station.Longitude }}
            title={station.Name}
            pinColor={station.Id === nearestId ? "gold" : station.Type === "Police" ? "blue" : "red"}
          >
            <Callout>
              <View>
                <Text style={{ fontWeight: "bold" }}>{station.Name}</Text>
                <Text>Distance: {station.distance.toFixed(2)} km</Text>
                {station.Id === nearestId && <Text>Nearest!</Text>}
                <Text>Contact: {station.Contact}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Scrollable list */}
      <FlatList
        data={stations}
        keyExtractor={(item) => item.Id.toString()}
        style={styles.list}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              item.Id === nearestId && { borderColor: "gold", borderWidth: 2 },
            ]}
          >
            <TouchableOpacity onPress={() => centerMapOnStation(item)}>
              <Text style={styles.name}>{item.Name}</Text>
              <Text style={styles.info}>Distance: {item.distance.toFixed(2)} km</Text>
              <Text style={styles.info}>Contact: {item.Contact}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#32A852" }]}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${item.Latitude},${item.Longitude}`
                )
              }
            >
              <Text style={styles.buttonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { maxHeight: 240 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  name: { fontWeight: "bold", fontSize: 16 },
  info: { fontSize: 14, color: "#555" },
  button: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default NearbyRescuerScreen;
