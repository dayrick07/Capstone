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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location"; // ✅ Added for GPS
import axios from "axios";

// Hotline numbers
const POLICE_NUMBER = "tel:911";
const HOSPITAL_NUMBER = "tel:912";
const FIRESTATION_NUMBER = "tel:913";

// Icons
const icons = {
  police: require("../assets/police.png"),
  hospital: require("../assets/hospital.png"),
  firestation: require("../assets/firestation.png"),
  shortcuts: require("../assets/shortcuts.png"),
  setup: require("../assets/setup.png"),
  nearby: require("../assets/nearby.png"),
  album: require("../assets/album.png"),
  contacts: require("../assets/contacts.png"), // ✅ NEW ICON for emergency contacts
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
      // ✅ 1. Ask for location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to report incidents.");
        return;
      }

      // ✅ 2. Get exact coordinates
      const { coords } = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = coords;

      // ✅ 3. Convert to readable address
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const locationText = `${address.name || ""}, ${address.city || ""}, ${address.region || ""}`;

      // ✅ 4. Send to backend
      const response = await axios.post(`${SERVER_URL}/incidents`, {
        Type: service,
        Location: locationText,
        Latitude: latitude,
        Longitude: longitude,
        Status: "Pending",
      });

      if (response.status === 200) {
        Alert.alert("✅ Success", "Incident reported!");
      }
    } catch (err) {
      console.error("❌ Error reporting incident:", err.response?.data || err.message);
      Alert.alert(
        "Error",
        "Failed to report incident. Make sure your server is running and reachable."
      );
    }
  };

  // --------------------------- EMERGENCY CALL ---------------------------
  const handleEmergencyCall = (service, number) => {
    Alert.alert(
      `${service} Assistance`,
      `Do you really need help from ${service}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            await reportIncident(service);
            const supported = await Linking.canOpenURL(number);
            if (supported) await Linking.openURL(number);
            else Alert.alert("Error", "Cannot open dialer.");
          },
        },
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
      `Would you like to send this ${file.type === "video" ? "video" : "image"}?`,
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

  const themeStyles = {
    container: { backgroundColor: isDarkMode ? "#121212" : "#fff" },
    card: { backgroundColor: isDarkMode ? "#1E1E1E" : "#f8f8f8" },
    text: { color: isDarkMode ? "#fff" : "#333" },
    menuContainer: { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
    menuText: { color: isDarkMode ? "#fff" : "#333" },
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#A83232" }]}>
      <View style={[styles.container, themeStyles.container]}>
        {/* Header */}
        <View style={styles.header}>
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
              onPress={() => navigation.navigate("UserPageScreen", { userData: loggedInUser })}
            >
              <Icon name="account-circle" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Buttons */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => handleEmergencyCall("Police", POLICE_NUMBER)}
          >
            <Image source={icons.police} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Police</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => handleEmergencyCall("Ambulance", HOSPITAL_NUMBER)}
          >
            <Image source={icons.hospital} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => handleEmergencyCall("Fire Station", FIRESTATION_NUMBER)}
          >
            <Image source={icons.firestation} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Fire Station</Text>
          </TouchableOpacity>

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

          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() =>
              Alert.alert("Select Rescuer Type", "Who do you need?", [
                { text: "Police", onPress: () => navigation.navigate("NearbyRescuerScreen", { type: "Police" }) },
                { text: "Fire Station", onPress: () => navigation.navigate("NearbyRescuerScreen", { type: "Fire Station" }) },
                { text: "Ambulance", onPress: () => navigation.navigate("NearbyRescuerScreen", { type: "Ambulance" }) },
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

          {/* ✅ NEW BUTTON: Emergency Contact List */}
          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => navigation.navigate("ContactListScreen", { userData: loggedInUser })}
          >
            <Image source={icons.contacts} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Emergency Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Menu */}
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
            <View style={[styles.menuContainer, themeStyles.menuContainer]}>
              {["CPRScreen", "WoundCareScreen", "SkinBurnScreen", "TutorialScreen"].map((screen, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate(screen);
                  }}
                >
                  <Text style={[styles.menuText, themeStyles.menuText]}>
                    {screen.replace("Screen", "").replace(/([A-Z])/g, " $1").trim()}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.menuFooter}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => navigation.navigate("SettingsScreen")}
                >
                  <Text style={[styles.menuText, themeStyles.menuText]}>⚙️ Settings</Text>
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
                      {screen.replace("Screen", "").replace(/([A-Z])/g, " $1").trim()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: StatusBar.currentHeight },
  container: { flex: 1, padding: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "30%", height: 100, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 15 },
  icon: { width: 40, height: 40, marginBottom: 5, resizeMode: "contain" },
  label: { fontSize: 12, fontWeight: "bold", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-start" },
  menuContainer: { width: "70%", padding: 20, height: "100%" },
  menuItem: { paddingVertical: 12 },
  menuText: { fontSize: 16 },
  menuFooter: { marginTop: 20 },
  menuButton: { paddingVertical: 10 },
});
