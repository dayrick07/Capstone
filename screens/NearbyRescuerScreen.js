import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet, Alert, Linking, FlatList, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";
import { ThemeContext } from "../ThemeContext";
import rescuersData from "../data/rescuers.json";

// Haversine formula
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

const NearbyRescuerScreen = ({ route }) => {
  const { type } = route.params;
  const { isDarkMode } = useContext(ThemeContext);

  const [location, setLocation] = useState(null);
  const [rescuerList, setRescuerList] = useState([]);
  const [nearestId, setNearestId] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const listWithDistance = rescuersData
        .filter((r) => r.type === type)
        .map((r) => ({
          ...r,
          distance: getDistanceInKm(
            loc.coords.latitude,
            loc.coords.longitude,
            r.latitude,
            r.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance);

      if (listWithDistance.length > 0) setNearestId(listWithDistance[0].id);

      setRescuerList(listWithDistance);
    })();
  }, []);

  const themeColors = {
    backgroundColor: isDarkMode ? "#121212" : "#fff",
    textColor: isDarkMode ? "#fff" : "#000",
  };

  if (!location) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.backgroundColor }]}>
        <Text style={{ color: themeColors.textColor }}>Loading map...</Text>
      </View>
    );
  }

  const handleMarkerPress = (rescuer) => {
    Alert.alert(
      rescuer.name,
      `Distance: ${rescuer.distance.toFixed(2)} km\nContact: ${rescuer.phone}`,
      [
        { text: "Call", onPress: () => Linking.openURL(`tel:${rescuer.phone}`) },
        {
          text: "Get Directions",
          onPress: () =>
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${rescuer.latitude},${rescuer.longitude}`
            ),
        },
        { text: "Close" },
      ]
    );
  };

  const centerMapOnRescuer = (rescuer) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: rescuer.latitude,
          longitude: rescuer.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500
      );
    }
  };

  const addContact = async (rescuer) => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Cannot access contacts.");
      return;
    }

    const contact = {
      [Contacts.Fields.FirstName]: rescuer.name,
      [Contacts.Fields.PhoneNumbers]: [{ number: rescuer.phone, label: "mobile" }],
    };

    try {
      await Contacts.addContactAsync(contact);
      Alert.alert("Success", `${rescuer.name} added to contacts`);
    } catch (error) {
      Alert.alert("Error", "Failed to add contact");
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
        {rescuerList.map((rescuer) => (
          <Marker
            key={rescuer.id}
            coordinate={{ latitude: rescuer.latitude, longitude: rescuer.longitude }}
            title={rescuer.name}
            pinColor={
              rescuer.id === nearestId
                ? "gold"
                : type === "Police"
                ? "blue"
                : type === "Fire Station"
                ? "red"
                : "green"
            }
          >
            <Callout onPress={() => handleMarkerPress(rescuer)}>
              <View>
                <Text style={{ fontWeight: "bold" }}>{rescuer.name}</Text>
                <Text>Distance: {rescuer.distance.toFixed(2)} km</Text>
                {rescuer.id === nearestId && <Text>Nearest!</Text>}
                <Text>Tap for options</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Scrollable list below map */}
      <FlatList
        data={rescuerList}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              item.id === nearestId && { borderColor: "gold", borderWidth: 2 },
            ]}
          >
            <TouchableOpacity onPress={() => centerMapOnRescuer(item)}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.info}>Distance: {item.distance.toFixed(2)} km</Text>
              <Text style={styles.info}>Phone: {item.phone}</Text>
            </TouchableOpacity>
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#32A852" }]}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              >
                <Text style={styles.buttonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#3282A8" }]}
                onPress={() => addContact(item)}
              >
                <Text style={styles.buttonText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
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
  buttons: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default NearbyRescuerScreen;
