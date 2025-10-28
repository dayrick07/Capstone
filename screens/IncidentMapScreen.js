import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function IncidentMapScreen({ route }) {
  const { incident } = route.params;

  // Use correct case for Latitude/Longitude
  const latitude = incident.Latitude;
  const longitude = incident.Longitude;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude: latitude, longitude: longitude }}
          title={incident.Type}
          description={incident.Location}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
