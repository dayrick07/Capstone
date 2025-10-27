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
  album: require("../assets/album.png"), // now used for Record Video
};

const DashboardScreen = ({ navigation }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // 🔔 Emergency call confirmation
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

  // ✅ Choose between recording new video or picking from gallery
  const handleRecordVideoChoice = () => {
    Alert.alert("Record or Select", "Choose an option:", [
      { text: "Cancel", style: "cancel" },
      { text: "Record New Video", onPress: recordVideo },
      { text: "Choose from Gallery", onPress: pickMedia },
    ]);
  };

  // ✅ Record new video
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
      const video = result.assets[0];
      askToSend(video);
    }
  };

  // ✅ Pick image or video from gallery
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
      const file = result.assets[0];
      askToSend(file);
    }
  };

  // ✅ Ask to send to rescuer
  const askToSend = (file) => {
    Alert.alert(
      "Send to Rescuer?",
      `Would you like to send this ${file.type === "video" ? "video" : "image"} to the rescuer?`,
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

  // ✅ Theme styles
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
              onPress={() => navigation.navigate("UserPageScreen")}
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
            onPress={() => handleEmergencyCall("Hospital", HOSPITAL_NUMBER)}
          >
            <Image source={icons.hospital} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Hospital</Text>
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
      {
        text: "Police",
        onPress: () => navigation.navigate("NearbyRescuerScreen", { type: "Police" }),
      },
      {
        text: "Fire Station",
        onPress: () => navigation.navigate("NearbyRescuerScreen", { type: "Fire Station" }),
      },
      {
        text: "Hospital",
        onPress: () => navigation.navigate("NearbyRescuerScreen", { type: "Hospital" }),
      },
      { text: "Cancel", style: "cancel" },
    ])
  }
>
  <Image source={icons.nearby} style={styles.icon} />
  <Text style={[styles.label, themeStyles.text]}>Nearby Rescuer</Text>
</TouchableOpacity>




          {/* ✅ Only one Record Video button now */}
          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={handleRecordVideoChoice}
          >
            <Image source={icons.album} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Record Video</Text>
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
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("CPRScreen");
                }}
              >
                <Text style={[styles.menuText, themeStyles.menuText]}>
                  How to CPR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("WoundCareScreen");
                }}
              >
                <Text style={[styles.menuText, themeStyles.menuText]}>
                  Wound Care
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("SkinBurnScreen");
                }}
              >
                <Text style={[styles.menuText, themeStyles.menuText]}>
                  Skin Burn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("TutorialScreen");
                }}
              >
                <Text style={[styles.menuText, themeStyles.menuText]}>
                  Tutorial
                </Text>
              </TouchableOpacity>

              <View style={styles.menuFooter}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => navigation.navigate("SettingsScreen")}
                >
                  <Text style={[styles.menuText, themeStyles.menuText]}>
                    ⚙️ Settings
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("ReachOutScreen");
                  }}
                >
                  <Text style={[styles.menuText, themeStyles.menuText]}>
                    Reach Out
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("FeedbackScreen");
                  }}
                >
                  <Text style={[styles.menuText, themeStyles.menuText]}>
                    Feedback
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#A83232" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#A83232",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerRight: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: 20,
  },
  card: {
    width: "40%",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
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
  label: { fontSize: 15, fontWeight: "bold", textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
  },
  menuContainer: { paddingVertical: 20, paddingHorizontal: 15 },
  menuItem: { paddingVertical: 12 },
  menuText: { fontSize: 18 },
  menuFooter: { borderTopWidth: 1, borderTopColor: "#ccc", marginTop: 20 },
});

export default DashboardScreen;
