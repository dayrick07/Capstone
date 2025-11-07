import React, { useState, useContext } from "react";
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
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import axios from "axios";

// Hotline numbers: CONSOLIDATED TO ONLY 911
const UNIFIED_EMERGENCY_NUMBER = "tel:911"; // 🚨 Use 911 for all services

// Icons (remain the same for visual classification)
const icons = {
  police: require("../assets/police.png"),
  hospital: require("../assets/hospital.png"),
  firestation: require("../assets/firestation.png"),
  shortcuts: require("../assets/shortcuts.png"),
  setup: require("../assets/setup.png"),
  nearby: require("../assets/nearby.png"),
  album: require("../assets/album.png"),
  contacts: require("../assets/contacts.png"),
};

// Set server URL
const SERVER_URL = "http://192.168.0.111:3000"; // ⚙️ your backend IP

export default function DashboardScreen({ navigation, route }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const loggedInUser = route.params?.userData;

  if (!loggedInUser) {
    navigation.replace("LoginScreen");
    return null;
  }

  // --------------------------- REPORT INCIDENT ---------------------------
  const reportIncident = async (service) => {
    try {
      // 1️⃣ Ask for location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required to report incidents."
        );
        return;
      }

      // 2️⃣ Get coordinates
      const { coords } = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = coords;

      // 3️⃣ Convert to readable address
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const locationText = `${address.name || ""}, ${address.city || ""}, ${
        address.region || ""
      }`;

      // 4️⃣ Send to backend with UserId only
      const response = await axios.post(`${SERVER_URL}/incidents`, {
        Type: service,
        Location: locationText,
        Latitude: latitude,
        Longitude: longitude,
        Status: "Pending",
        UserId: loggedInUser.Id, // required
      });

      if (response.data.success) {
        Alert.alert("✅ Success", "Incident reported!");
      }
    } catch (err) {
      console.error(
        "❌ Error reporting incident:",
        err.response?.data || err.message
      );
      Alert.alert(
        "Error",
        "Failed to report incident. Make sure your server is running and reachable."
      );
    }
  };

  // --------------------------- EMERGENCY CALL (NOW USES 911) ---------------------------
  const handleEmergencyCall = (service) => {
    // Note: 'number' parameter is no longer needed as it's hardcoded to 911
    Alert.alert(
      `${service} Assistance (Calling 911)`,
      `Do you need help from ${service}? This will dial the emergency number.`, // Simplified message
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Call Now",
          onPress: async () => {
            // Report incident first
            await reportIncident(service);
            
            // Initiate 911 call
            const supported = await Linking.canOpenURL(UNIFIED_EMERGENCY_NUMBER);
            if (supported) await Linking.openURL(UNIFIED_EMERGENCY_NUMBER);
            else Alert.alert("Error", "Cannot open dialer.");
          },
        },
      ]
    );
  };

  // ✅ NEW: Unified Emergency Report for the Big Button
  const handleBigEmergencyButton = () => {
      Alert.alert(
          "🚨 Emergency Report (Dialing 911)",
          "Select the service needed. We will notify the system and dial 911.",
          [
              { text: "Cancel", style: "cancel" },
              // Each button now calls handleEmergencyCall with the service type
              { text: "Police", onPress: () => handleEmergencyCall("Police") },
              { text: "Fire Station", onPress: () => handleEmergencyCall("Fire Station") },
              { text: "Ambulance", onPress: () => handleEmergencyCall("Ambulance") },
          ]
      );
  };


  // --------------------------- RECORD / PICK MEDIA ---------------------------
  const handleRecordVideoChoice = () => {
    Alert.alert("Record or Select", "Choose an option:", [
      { text: "Cancel", style: "cancel" },
      { text: "Record New Video", onPress: recordVideo },
      { text: "Choose from Gallery", onPress: pickMedia },
    ]);
  };

  const recordVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Camera access is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      askToSend(result.assets[0]);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Media access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      askToSend(result.assets[0]);
    }
  };

  const askToSend = (file) => {
    Alert.alert(
      "Send to Rescuer?",
      `Would you like to send this ${
        file.type === "video" ? "video" : "image"
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => {
            console.log("Sending file:", file.uri);
            Alert.alert("Success", "Media sent to rescuer!");
          },
        },
      ]
    );
  };

  // Improved Theme Styles
  const primaryColor = "#A83232"; // The existing red color
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
    headerText: { color: "#fff" },
    bigButton: {
      backgroundColor: primaryColor,
      shadowColor: primaryColor,
      shadowOpacity: 0.4,
    },
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: primaryColor }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          themeStyles.container,
          { paddingTop: 0 },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Safe Ka Fernandino!</Text>

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
                navigation.navigate("UserPageScreen", { userData: loggedInUser })
              }
            >
              <Icon name="account-circle" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Primary Emergency Button --- */}
        <View style={styles.primaryButtonContainer}>
          <TouchableOpacity
            style={[styles.bigButton, themeStyles.bigButton]}
            onPress={handleBigEmergencyButton}
          >
            <Ionicons name="warning-outline" size={60} color="#fff" />
            <Text style={styles.bigButtonText}>EMERGENCY</Text>
            {/* Removed (911) */}
            <Text style={styles.bigButtonSubtitle}>TAP for immediate assistance</Text> 
          </TouchableOpacity>
        </View>
        {/* --- End Primary Emergency Button --- */}

        {/* Dashboard Buttons Grid */}
        <View style={styles.grid}>
          {/* Group 1: Emergency Hotlines */}
          <TouchableOpacity
            style={[styles.card, styles.emergencyCard, themeStyles.card]}
            onPress={() => handleEmergencyCall("Police")} 
          >
            <Image source={icons.police} style={styles.largeIcon} />
            {/* Removed (911) */}
            <Text style={[styles.largeLabel, themeStyles.text]}>Police</Text> 
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.emergencyCard, themeStyles.card]}
            onPress={() => handleEmergencyCall("Ambulance")} 
          >
            <Image source={icons.hospital} style={styles.largeIcon} />
            {/* Removed (911) */}
            <Text style={[styles.largeLabel, themeStyles.text]}>Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.emergencyCard, themeStyles.card]}
            onPress={() => handleEmergencyCall("Fire Station")} 
          >
            <Image source={icons.firestation} style={styles.largeIcon} />
            {/* Removed (911) */}
            <Text style={[styles.largeLabel, themeStyles.text]}>Fire Station</Text>
          </TouchableOpacity>

          {/* Group 2: Quick Actions / Features */}
          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => navigation.navigate("ContactListScreen", { userData: loggedInUser })}
          >
            <Image source={icons.contacts} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Emergency Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() =>
              Alert.alert("Select Rescuer Type", "Who do you need?", [
                {
                  text: "Police",
                  onPress: () =>
                    navigation.navigate("NearbyRescuerScreen", { type: "Police" }),
                },
                {
                  text: "Fire Station",
                  onPress: () =>
                    navigation.navigate("NearbyRescuerScreen", {
                      type: "Fire Station",
                    }),
                },
                {
                  text: "Ambulance",
                  onPress: () =>
                    navigation.navigate("NearbyRescuerScreen", {
                      type: "Ambulance",
                    }),
                },
                { text: "Cancel", style: "cancel" },
              ])
            }
          >
            <Image source={icons.nearby} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Nearby Rescuer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={handleRecordVideoChoice}
          >
            <Image source={icons.album} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Record Video</Text>
          </TouchableOpacity>

          {/* Group 3: Settings / Misc */}
          <TouchableOpacity style={[styles.card, themeStyles.card]}>
            <Image source={icons.shortcuts} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Shortcuts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => navigation.navigate("Setup")}
          >
            <Image source={icons.setup} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Set-Up</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Menu (Unchanged) */}
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
              <Text style={[styles.menuTitle, themeStyles.menuText]}>First Aid Guides</Text>
              {["CPRScreen", "WoundCareScreen", "SkinBurnScreen", "TutorialScreen"].map(
                (screen, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate(screen);
                    }}
                  >
                    <Text style={[styles.menuText, themeStyles.menuText]}>
                      {screen
                        .replace("Screen", "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </Text>
                  </TouchableOpacity>
                )
              )}

              <View style={styles.menuFooter}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate("SettingsScreen");
                  }}
                >
                  <Text style={[styles.menuText, themeStyles.menuText]}>
                    ⚙️ **Settings**
                  </Text>
                </TouchableOpacity>

                {["ReachOutScreen", "FeedbackScreen"].map((screen, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate(screen);
                    }}
                  >
                    <Text style={[styles.menuText, themeStyles.menuText]}>
                      {screen
                        .replace("Screen", "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {/* Logout Button */}
                <TouchableOpacity
                  style={[styles.menuItem, { marginTop: 20 }]}
                  onPress={() => {
                      setMenuVisible(false);
                      navigation.replace("LoginScreen");
                  }}
                >
                  <Text style={[styles.menuText, { color: 'red' }]}>
                    ➡️ **Log Out**
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  scrollContent: { paddingBottom: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center" },

  // --- Primary Button Styles ---
  primaryButtonContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  bigButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  bigButtonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },
  bigButtonSubtitle: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  // --- End Primary Button Styles ---

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 5,
  },
  card: {
    width: "45%",
    height: 120,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
  },
  emergencyCard: {
    width: "30%",
    height: 100,
    borderRadius: 10,
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 5,
    resizeMode: "contain",
  },
  largeIcon: {
    width: 50,
    height: 50,
    marginBottom: 5,
    resizeMode: "contain",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  largeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  
  // --- Menu Styles (Improved) ---
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-start",
  },
  menuContainer: { 
    width: "75%",
    padding: 20, 
    height: "100%", 
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 50,
  },
  menuTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
      paddingBottom: 5,
  },
  menuItem: { 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
  },
  menuText: { fontSize: 16 },
  menuFooter: { marginTop: 30 },
  menuButton: { paddingVertical: 14 },
  // --- End Menu Styles ---
});