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
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import axios from "axios";
// Assuming you have a file named config.js in the parent directory containing SERVER_URL
import { SERVER_URL } from "../config";

const UNIFIED_EMERGENCY_NUMBER = "tel:911";

// All required icons
const icons = {
  police: require("../assets/police.png"),
  hospital: require("../assets/hospital.png"),
  firestation: require("../assets/firestation.png"),
  album: require("../assets/album.png"),
  contacts: require("../assets/contacts.png"),
  nearby: require("../assets/nearby.png"), 
  shortcuts: require("../assets/shortcuts.png"),
  setup: require("../assets/setup.png"),
  parentPanel: require("../assets/parentPanel.png"), 
};

export default function DashboardScreen({ navigation, route }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const loggedInUser = route.params?.userData;

  // Redirect to login if user data is missing
  useEffect(() => {
    if (!loggedInUser) {
      navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
    }
  }, [loggedInUser, navigation]);

  if (!loggedInUser) return null;

  // --- THEME STYLES (Moved to top of component for use in hooks/functions) ---
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
    bigButton: { backgroundColor: primaryColor },
  };
  // --------------------------------------------------------------------------

  // --------------------------- REPORT INCIDENT ---------------------------
  const reportIncident = async (service, immediateCall = false) => {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      status = (await Location.requestForegroundPermissionsAsync()).status;
    }
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location access is required.");
      return false;
    }

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const { latitude, longitude } = coords;
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const locationText = `${address.name || ""}, ${address.city || ""}, ${address.region || ""}`;

    const response = await axios.post(`${SERVER_URL}/incidents`, {
      Type: service,
      Location: locationText,
      Latitude: latitude,
      Longitude: longitude,
      Status: immediateCall ? "Calling 911" : "Pending",
      UserId: loggedInUser.Id,
    });

    if (response.data.success) {
      Alert.alert("✅ Success", "Incident reported to system!");

      // Automatically call main admin/rescuer head
      const canCall = await Linking.canOpenURL(MAIN_ADMIN_NUMBER);
      if (canCall) await Linking.openURL(MAIN_ADMIN_NUMBER);
    }

    return response.data.success;
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Failed to report incident. Check server connectivity.");
    return false;
  }
};


  // --------------------------- EMERGENCY CALL ---------------------------
  const handleEmergencyCall = async (service) => {
    Alert.alert(
      `Call ${service} (Dialing 911)`,
      `Are you sure you want to call 911 and report a ${service} emergency? Your location will be sent to the system.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call 911",
          onPress: async () => {
            const success = await reportIncident(service, true);
            if (success) {
              const supported = await Linking.canOpenURL(UNIFIED_EMERGENCY_NUMBER);
              if (supported) await Linking.openURL(UNIFIED_EMERGENCY_NUMBER);
              else Alert.alert("Dialer Error", "Cannot open dialer.");
            }
          },
        },
      ]
    );
  };

  const handleBigEmergencyButton = () => {
    Alert.alert("🚨 EMERGENCY", "Select a service to contact 911:", [
      { text: "Cancel", style: "cancel" },
      { text: "Police", onPress: () => handleEmergencyCall("Police") },
      { text: "Fire Station", onPress: () => handleEmergencyCall("Fire Station") },
      { text: "Ambulance", onPress: () => handleEmergencyCall("Ambulance") },
    ]);
  };

  /* -------------------------------------------------------------------------- */

  // --------------------------- MEDIA HANDLERS ---------------------------
  const handleRecordVideoChoice = () => {
    Alert.alert("Record or Select", "Choose an option:", [
      { text: "Cancel", style: "cancel" },
      { text: "Record New Video", onPress: recordVideo },
      { text: "Choose from Gallery", onPress: pickMedia },
    ]);
  };

  const recordVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Permission Denied", "Camera access is required.");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) askToSend(result.assets[0]);
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Permission Denied", "Media access is required.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) askToSend(result.assets[0]);
  };

  const askToSend = (file) => {
    Alert.alert(
      "Send to Rescuer?",
      `Would you like to send this ${file.type === "video" ? "video" : "image"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => {
            Alert.alert("Success", "Media sent to rescuer!");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: primaryColor }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, themeStyles.container]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: primaryColor }]}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Safe Ka Fernandino!</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 10 }}>
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("UserPageScreen", { userData: loggedInUser })}>
              <Icon name="account-circle" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Big Emergency Button */}
        <View style={styles.primaryButtonContainer}>
          <TouchableOpacity style={[styles.bigButton, themeStyles.bigButton]} onPress={handleBigEmergencyButton}>
            <Ionicons name="warning-outline" size={60} color="#fff" />
            <Text style={styles.bigButtonText}>EMERGENCY</Text>
            <Text style={styles.bigButtonSubtitle}>TAP for immediate assistance</Text>
          </TouchableOpacity>
        </View>

        {/* Main Grid with All Buttons */}
        <View style={styles.grid}>
          {/* Row 1: Immediate Services */}
          <TouchableOpacity style={[styles.card, themeStyles.card]} onPress={() => handleEmergencyCall("Police")}>
            <Image source={icons.police} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Police</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, themeStyles.card]} onPress={() => handleEmergencyCall("Ambulance")}>
            <Image source={icons.hospital} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, themeStyles.card]} onPress={() => handleEmergencyCall("Fire Station")}>
            <Image source={icons.firestation} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Fire Station</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => navigation.navigate("ParentScreen", { userData: loggedInUser })}
          >
            <Ionicons name="person-circle-outline" size={50} color={primaryColor} />
            <Text style={[styles.label, themeStyles.text]}>Parent Screen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => navigation.navigate("ContactListScreen", { userData: loggedInUser })}
          >
            <Image source={icons.contacts} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Emergency Contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, themeStyles.card]} onPress={handleRecordVideoChoice}>
            <Image source={icons.album} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Record Video</Text>
          </TouchableOpacity>

          {/* Row 3: Utility/Setup (Re-added) */}
          <TouchableOpacity style={[styles.card, themeStyles.card]}>
            <Image source={icons.shortcuts} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Shortcuts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => navigation.navigate("Setup", { userData: loggedInUser })}
          >
            <Image source={icons.setup} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Set-Up</Text>
          </TouchableOpacity>

        </View>

        {/* --- Menu Modal (Slide from left) --- */}
        <Modal animationType="slide" transparent visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setMenuVisible(false)}
          >
            <View
              style={[styles.menuContainer, themeStyles.menuContainer]}
              onStartShouldSetResponder={() => true} // Keep modal open when touching the menu area
            >
              <Text style={[styles.menuTitle, themeStyles.menuText]}>First Aid Guides</Text>

              {/* Loop for First Aid Screens */}
              {["CPRScreen", "WoundCareScreen", "SkinBurnScreen", "TutorialScreen"].map((screen, i) => {
                const menuTitle = screen.replace("Screen", "").replace(/([A-Z])/g, " $1").trim();
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate(screen);
                    }}
                  >
                    <Text style={[styles.menuText, themeStyles.menuText]}>
                      {menuTitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Settings Button */}
              <TouchableOpacity
                style={[styles.menuItem, { marginTop: 20 }]}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("SettingsScreen");
                }}
              >
                <Text style={[styles.menuText, themeStyles.menuText, { fontWeight: 'bold' }]}>
                  <Icon name="settings" size={16} color={isDarkMode ? "#fff" : "#333"} />
                  {' Settings'}
                </Text>
              </TouchableOpacity>

              {/* Log Out Button */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.replace("LoginScreen");
                }}
              >
                <Text style={[styles.menuText, { color: primaryColor, fontWeight: 'bold' }]}>
                  <Icon name="logout" size={16} color={primaryColor} />
                  {' Log Out'}
                </Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#A83232",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
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
  primaryButtonContainer: { alignItems: "center", marginVertical: 20 },
  bigButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  bigButtonText: { color: "#fff", fontSize: 28, fontWeight: "bold", marginTop: 5 },
  bigButtonSubtitle: { color: "#fff", fontSize: 12, opacity: 0.8 },

  // Main Grid Layout
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 5,
  },
  card: {
    width: "45%", // Two columns per row
    height: 120,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
    elevation: 3, // Shadow for Android
  },
  icon: { width: 50, height: 50, marginBottom: 5, resizeMode: "contain" },
  label: { fontSize: 14, fontWeight: "600", textAlign: "center" },

  // Menu Modal Styles (Slide from left)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    flexDirection: 'row', // Align menu to the left
  },
  menuContainer: {
    width: "75%",
    padding: 20,
    height: "100%",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 50,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuText: { fontSize: 16 },
});