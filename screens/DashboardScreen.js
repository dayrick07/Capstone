import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { StatusBar, Platform } from "react-native";



// Hotline numbers (replace with your local ones later)
const POLICE_NUMBER = "tel:911";
const HOSPITAL_NUMBER = "tel:912";
const FIRESTATION_NUMBER = "tel:913";

// Import icons (supports .png and .jpg)
const icons = {
  police: require("../assets/police.png"),
  hospital: require("../assets/hospital.png"),
  firestation: require("../assets/firestation.png"),
  shortcuts: require("../assets/shortcuts.png"),
  setup: require("../assets/setup.png"),
  nearby: require("../assets/nearby.png"),
  record: require("../assets/record.png"),
};

const DashboardScreen = ({ navigation }) => {
  // Confirm + Call function
  const handleEmergencyCall = (service, number) => {
    Alert.alert(
      `${service} Assistance`,
      `Do you really need help from ${service}?`,
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => Linking.openURL(number) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          {/* Left Menu Button */}
          <TouchableOpacity>
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.headerTitle}>Safe Ka Fernandino!</Text>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("UserPageScreen")}
          >
            <Icon name="account-circle" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Dashboard Buttons */}
        <View style={styles.grid}>
          {/* Police */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleEmergencyCall("Police", POLICE_NUMBER)}
          >
            <Image source={icons.police} style={styles.icon} />
            <Text style={styles.label}>Police</Text>
          </TouchableOpacity>

          {/* Hospital */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleEmergencyCall("Hospital", HOSPITAL_NUMBER)}
          >
            <Image source={icons.hospital} style={styles.icon} />
            <Text style={styles.label}>Hospital</Text>
          </TouchableOpacity>

          {/* Fire Station */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleEmergencyCall("Fire Station", FIRESTATION_NUMBER)}
          >
            <Image source={icons.firestation} style={styles.icon} />
            <Text style={styles.label}>Fire Station</Text>
          </TouchableOpacity>

          {/* Shortcuts */}
          <TouchableOpacity style={styles.card}>
            <Image source={icons.shortcuts} style={styles.icon} />
            <Text style={styles.label}>Shortcuts</Text>
          </TouchableOpacity>

          {/* Set-Up */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Setup")}
          >
            <Image source={icons.setup} style={styles.icon} />
            <Text style={styles.label}>Set-Up</Text>
          </TouchableOpacity>

          {/* Nearby Rescuer */}
          <TouchableOpacity style={styles.card}>
            <Image source={icons.nearby} style={styles.icon} />
            <Text style={styles.label}>Nearby Rescuer</Text>
          </TouchableOpacity>

          {/* Record Video */}
          <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate("RecordVideoScreen")}
          >
            <Image source={icons.record} style={styles.icon} />
            <Text style={styles.label}>Record Video</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// BASIC + CLEAN styling
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#A83232", // match header background
  },
  container: {
    flex: 1,
    backgroundColor: "#fff", // clean white background
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#A83232", // red theme
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flexShrink: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: 20,
  },
  card: {
    width: "40%",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    alignItems: "center",
    elevation: 3, // subtle shadow for Android
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  icon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    flexShrink: 1, // text won't cut off
  },
});

export default DashboardScreen;
