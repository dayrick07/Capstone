import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
  SafeAreaView,
  Modal,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";
import * as Location from "expo-location";
import axios from "axios";
import { SERVER_URL } from "../config";

// Unified emergency number
const UNIFIED_EMERGENCY_NUMBER = "tel:911";

// Icons
const icons = {
  police: require("../assets/police.png"),
  hospital: require("../assets/hospital.png"),
  firestation: require("../assets/firestation.png"),
  locationTracker: require("../assets/nearby.png"),
};

export default function ChildDashboardScreen({ navigation, route }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const loggedInChild = route.params?.childData;

  // 🐛 FIX: Wrap the navigation check in useEffect to prevent the "Cannot update component while rendering" error.
  useEffect(() => {
    if (!loggedInChild) {
      // Use replace for a clean state transition outside of the render cycle
      navigation.replace("LoginScreen");
    }
  }, [loggedInChild, navigation]); 
  
  if (!loggedInChild) {
    // Return null while the navigation is processed
    return null;
  }
  // ------------------------------------

  // --------------------------- CHILD LOCATION TRACKING ---------------------------
  const reportChildLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required to update your parent."
        );
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = coords;

      const childId = loggedInChild.Id;
      const parentId = loggedInChild.ParentId; 

      if (!childId || !parentId) {
        Alert.alert("Error", "Missing child or parent ID. Please check your account setup.");
        return;
      }

      const response = await axios.post(`${SERVER_URL}/child/report-location`, {
        childId,
        parentId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(), // Include timestamp
      });

      if (response.data.success) {
        Alert.alert("✅ Location Shared", "Your current location has been successfully sent to your parent.");
      } else {
        Alert.alert("Error", response.data.message || "Failed to share location with parent.");
      }
    } catch (err) {
      console.error("❌ Error reporting child location:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to contact the server to share location.");
    }
  };


  // --------------------------- REPORT INCIDENT ---------------------------
  const reportIncident = async (service) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const { coords } = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = coords;

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const locationText = `${address.name || ""}, ${address.city || ""}, ${address.region || ""}`;

      const payload = {
        Type: service,
        Location: locationText,
        Latitude: latitude,
        Longitude: longitude,
        Status: "Pending",
        ChildId: loggedInChild?.Id,
        // Use ParentId for the incident record's UserId field (as intended for parent tracking)
        UserId: loggedInChild?.ParentId, 
      };

      const response = await axios.post(`${SERVER_URL}/incidents`, payload);

      if (response.data.success) {
        Alert.alert("✅ Success", "Incident reported!");
      } else {
        Alert.alert("Error", response.data.message || "Failed to report incident.");
      }
    } catch (err) {
      console.error("❌ Error reporting incident:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to report incident. Please check your network.");
    }
  };


  // --------------------------- EMERGENCY CALL ---------------------------
  const handleEmergencyCall = async (service) => {
    Alert.alert(
      `${service} Assistance (Calling 911)`,
      `Do you need help from ${service}? This will dial the emergency number.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Call Now",
          onPress: async () => {
            // Report incident first
            await reportIncident(service);

            const supported = await Linking.canOpenURL(UNIFIED_EMERGENCY_NUMBER);
            if (supported) await Linking.openURL(UNIFIED_EMERGENCY_NUMBER);
            else Alert.alert("Error", "Cannot open dialer.");
          },
        },
      ]
    );
  };

  // Big emergency button
  const handleBigEmergencyButton = () => {
    Alert.alert(
      "🚨 Emergency Report (Dialing 911)",
      "Select the service needed. We will notify the system and dial 911.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Police", onPress: () => handleEmergencyCall("Police") },
        { text: "Fire Station", onPress: () => handleEmergencyCall("Fire Station") },
        { text: "Ambulance", onPress: () => handleEmergencyCall("Ambulance") },
      ]
    );
  };


  // Theme styles
  const primaryColor = "#A83232";
  const themeStyles = {
    container: {
      backgroundColor: isDarkMode ? "#0E0E0E" : "#F4F4F9",
    },
    card: {
      backgroundColor: isDarkMode ? "#1C1C1C" : "#FFFFFF",
      shadowColor: isDarkMode ? "#000" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    text: { color: isDarkMode ? "#E0E0E0" : "#333333" },
    menuContainer: { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
    menuText: { color: isDarkMode ? "#fff" : "#333" },
    bigButton: { backgroundColor: primaryColor, shadowColor: primaryColor, shadowOpacity: 0.4 },
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: primaryColor }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, themeStyles.container]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Child Safety Dashboard</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 10 }}>
              <Ionicons
                name={isDarkMode ? "sunny-outline" : "moon-outline"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("UserPageScreen", { userData: loggedInChild })
              }
            >
              <Icon name="account-circle" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Emergency Button */}
        <View style={styles.primaryButtonContainer}>
          <TouchableOpacity
            style={[styles.bigButton, themeStyles.bigButton]}
            onPress={handleBigEmergencyButton}
          >
            <Ionicons name="warning-outline" size={60} color="#fff" />
            <Text style={styles.bigButtonText}>EMERGENCY</Text>
            <Text style={styles.bigButtonSubtitle}>TAP for immediate assistance</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Buttons (Minimalist Grid) */}
        <View style={styles.grid}>
          {/* Group 1: Emergency Hotlines */}
          <TouchableOpacity
            style={[styles.card, styles.emergencyCard, themeStyles.card]}
            onPress={() => handleEmergencyCall("Police")}
          >
            <Image source={icons.police} style={styles.largeIcon} />
            <Text style={[styles.largeLabel, themeStyles.text]}>Police</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.emergencyCard, themeStyles.card]}
            onPress={() => handleEmergencyCall("Ambulance")}
          >
            <Image source={icons.hospital} style={styles.largeIcon} />
            <Text style={[styles.largeLabel, themeStyles.text]}>Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.emergencyCard, themeStyles.card]}
            onPress={() => handleEmergencyCall("Fire Station")}
          >
            <Image source={icons.firestation} style={styles.largeIcon} />
            <Text style={[styles.largeLabel, themeStyles.text]}>Fire Station</Text>
          </TouchableOpacity>

          {/* Group 2: Key Child Safety Feature */}
          <TouchableOpacity
            style={[styles.card, styles.fullWidthCard, themeStyles.card]}
            onPress={reportChildLocation}
          >
            <Ionicons name="location-sharp" size={40} color={isDarkMode ? "#E0E0E0" : primaryColor} />
            <Text style={[styles.label, themeStyles.text, { fontWeight: 'bold', fontSize: 16 }]}>
              Send Location to Parent
            </Text>
            <Text style={[styles.label, themeStyles.text, { fontSize: 10, opacity: 0.7 }]}>
              Alerts your assigned parent of your current location.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Slide Menu (Simplified) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setMenuVisible(false)}
          >
            <View
              style={[styles.menuContainer, themeStyles.menuContainer]}
              onStartShouldSetResponder={() => true}
            >
              {/* Only Logout remains in the simplified menu */}
              <Text style={[styles.menuTitle, themeStyles.menuText]}>Menu</Text>
              
              <TouchableOpacity
                style={[styles.menuItem, { marginTop: 20 }]}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.replace("LoginScreen");
                }}
              >
                <Text style={[styles.menuText, { color: "red", fontWeight: 'bold' }]}>➡️ Log Out</Text>
              </TouchableOpacity>
              
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------------------- STYLES ---------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  scrollContent: { paddingBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  primaryButtonContainer: { alignItems: "center", marginVertical: 20 },
  bigButton: { width: 220, height: 220, borderRadius: 110, justifyContent: "center", alignItems: "center", elevation: 10 },
  bigButtonText: { color: "#fff", fontSize: 28, fontWeight: "bold", marginTop: 5 },
  bigButtonSubtitle: { color: "#fff", fontSize: 12, marginTop: 2, opacity: 0.8 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", paddingHorizontal: 5, marginVertical: 10 },
  
  // Card styles for the three emergency buttons
  card: { borderRadius: 15, justifyContent: "center", alignItems: "center", marginBottom: 15, padding: 10 },
  emergencyCard: { width: "30%", height: 100, },
  
  // Style for the full-width tracking card
  fullWidthCard: {
    width: "95%", 
    height: 120, 
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: 15,
  },
  
  icon: { width: 40, height: 40, marginBottom: 5, resizeMode: "contain" },
  largeIcon: { width: 50, height: 50, marginBottom: 5, resizeMode: "contain" },
  label: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  largeLabel: { fontSize: 14, fontWeight: "bold", textAlign: "center" },
  
  // Menu Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-start" },
  menuContainer: { width: "75%", padding: 20, height: "100%", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 50 },
  menuTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 5 },
  menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  menuText: { fontSize: 16 },
});