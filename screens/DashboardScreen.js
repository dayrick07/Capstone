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
import { ThemeContext } from "../ThemeContext"; // ✅ Import context

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
  record: require("../assets/record.png"),
};

const DashboardScreen = ({ navigation }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { isDarkMode } = useContext(ThemeContext); // ✅ Get dark mode state

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

  // ✅ Themed styles
  const themeStyles = {
    container: {
      backgroundColor: isDarkMode ? "#121212" : "#fff",
    },
    card: {
      backgroundColor: isDarkMode ? "#1E1E1E" : "#f8f8f8",
    },
    text: {
      color: isDarkMode ? "#fff" : "#333",
    },
    menuContainer: {
      backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
    },
    menuText: {
      color: isDarkMode ? "#fff" : "#333",
    },
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: "#A83232" }]}
    >
      <View style={[styles.container, themeStyles.container]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Safe Ka Fernandino!</Text>

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
            style={[styles.card, themeStyles.card]}
            onPress={() => handleEmergencyCall("Police", POLICE_NUMBER)}
          >
            <Image source={icons.police} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Police</Text>
          </TouchableOpacity>

          {/* Hospital */}
          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => handleEmergencyCall("Hospital", HOSPITAL_NUMBER)}
          >
            <Image source={icons.hospital} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Hospital</Text>
          </TouchableOpacity>

          {/* Fire Station */}
          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() =>
              handleEmergencyCall("Fire Station", FIRESTATION_NUMBER)
            }
          >
            <Image source={icons.firestation} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Fire Station</Text>
          </TouchableOpacity>

          {/* Shortcuts */}
          <TouchableOpacity style={[styles.card, themeStyles.card]}>
            <Image source={icons.shortcuts} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Shortcuts</Text>
          </TouchableOpacity>

          {/* Set-Up */}
          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => navigation.navigate("Setup")}
          >
            <Image source={icons.setup} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Set-Up</Text>
          </TouchableOpacity>

          {/* Nearby Rescuer */}
          <TouchableOpacity style={[styles.card, themeStyles.card]}>
            <Image source={icons.nearby} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Nearby Rescuer</Text>
          </TouchableOpacity>

          {/* Record Video */}
          <TouchableOpacity
            style={[styles.card, themeStyles.card]}
            onPress={() => navigation.navigate("RecordVideoScreen")}
          >
            <Image source={icons.record} style={styles.icon} />
            <Text style={[styles.label, themeStyles.text]}>Record Video</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Menu Modal */}
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

              {/* Footer options */}
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

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#A83232",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#A83232",
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
  label: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
  },
  menuContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 18,
  },
  menuFooter: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    marginTop: 20,
  },
});

export default DashboardScreen;
