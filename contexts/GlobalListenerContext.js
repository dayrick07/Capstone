// GlobalListenerContext.js
import React, { createContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SERVER_URL } from "../config";

export const GlobalListenerContext = createContext();

export const GlobalListenerProvider = ({ children, userData }) => {
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [volumeEnabled, setVolumeEnabled] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);

  // Volume buttons + third-button combo
  const [volumeUpPressed, setVolumeUpPressed] = useState(false);
  const [volumeDownPressed, setVolumeDownPressed] = useState(false);
  const [thirdButtonPressed, setThirdButtonPressed] = useState(false);

  // Modal / bottom-sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetTriggerSource, setSheetTriggerSource] = useState(null);

  // animation
  const translateY = useRef(new Animated.Value(300)).current; // start off-screen

  const SHAKE_FORCE = 4;

  // Load saved settings
  useEffect(() => {
    (async () => {
      try {
        const shake = await AsyncStorage.getItem("shakeEnabled");
        const volume = await AsyncStorage.getItem("volumeEnabled");
        if (shake !== null) setShakeEnabled(shake === "true");
        if (volume !== null) setVolumeEnabled(volume === "true");
      } catch (err) {
        console.warn("Failed to load settings", err);
      }
    })();
  }, []);

  // ---- SHAKE DETECTION ----
  const startAccelerometer = () => {
    Accelerometer.setUpdateInterval(200);
    return Accelerometer.addListener((data) => {
      const totalForce =
        Math.abs(data.x) + Math.abs(data.y) + Math.abs(data.z);

      if (totalForce > SHAKE_FORCE) {
        setShakeCount((prev) => prev + 1);
      }
    });
  };

  useEffect(() => {
    if (!shakeEnabled) return;
    const subscription = startAccelerometer();
    return () => subscription?.remove();
  }, [shakeEnabled]);

  useEffect(() => {
    if (!shakeEnabled || cooldown) return;
    if (shakeCount >= 3) {
      setShakeCount(0);
      openServiceSheet("Shake detected");
    }
  }, [shakeCount, shakeEnabled, cooldown]);

  // ---- SERVICE SHEET (Bottom Sheet) ----
  const openServiceSheet = (triggerSource) => {
    // Prevent opening multiple times while cooling down
    if (cooldown) return;
    setSheetTriggerSource(triggerSource);
    setSheetVisible(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeServiceSheet = (cb) => {
    Animated.timing(translateY, {
      toValue: 300,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setSheetTriggerSource(null);
      if (typeof cb === "function") cb();
    });
  };

  // ---- SEND INCIDENT ----
  const sendIncident = async (serviceType) => {
    // start cooldown to avoid repeated triggers
    setCooldown(true);
    setTimeout(() => setCooldown(false), 4000);

    closeServiceSheet(); // hide sheet immediately for better UX

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Location Required", "Enable location to send SOS");
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;

      // readable-ish location; you can change to reverseGeocodeAsync for nicer address
      const locationName = `LAT:${latitude.toFixed(6)}, LNG:${longitude.toFixed(6)}`;

      await axios.post(`${SERVER_URL}/incidents`, {
        Type: serviceType,
        Location: locationName,
        Latitude: latitude,
        Longitude: longitude,
        Status: "Pending",
        UserId: userData?.Id || null,
        UserMobile: userData?.mobile || null, // correct field name based on your DB
      });

      Alert.alert("🚨 SOS Sent!", `${serviceType} has been notified.`);
    } catch (error) {
      console.error("❌ Send Incident Error:", error.response?.data || error.message);

      Alert.alert("Error", "Failed to send incident. Please try again or use direct call.");
    }
  };

  // ---- SAVE SETTINGS ----
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem("shakeEnabled", shakeEnabled.toString());
      await AsyncStorage.setItem("volumeEnabled", volumeEnabled.toString());
      Alert.alert("Saved", "Settings updated!");
    } catch (err) {
      console.warn("Failed to save settings", err);
    }
  };

  // ---- BUTTON HANDLERS ----
  const handleVolumeUp = (pressed) => {
    setVolumeUpPressed(pressed);
    checkThreeButtonTrigger(pressed, volumeDownPressed, thirdButtonPressed);
  };

  const handleVolumeDown = (pressed) => {
    setVolumeDownPressed(pressed);
    checkThreeButtonTrigger(volumeUpPressed, pressed, thirdButtonPressed);
  };

  const handleThirdButton = (pressed) => {
    setThirdButtonPressed(pressed);
    checkThreeButtonTrigger(volumeUpPressed, volumeDownPressed, pressed);
  };

  const checkThreeButtonTrigger = (up, down, third) => {
    if (up && down && third && !cooldown) {
      openServiceSheet("Three-button emergency");
      // reset the pressed states to prevent repeat
      setVolumeUpPressed(false);
      setVolumeDownPressed(false);
      setThirdButtonPressed(false);
    }
  };

  // ---- Render provider with the sheet modal included ----
  return (
    <GlobalListenerContext.Provider
      value={{
        shakeEnabled,
        setShakeEnabled,
        volumeEnabled,
        setVolumeEnabled,
        saveSettings,
        handleVolumeUp,
        handleVolumeDown,
        handleThirdButton,
      }}
    >
      {children}

      {/* Bottom-sheet modal (red + glass look) */}
      <Modal
        visible={sheetVisible}
        animationType="none"
        transparent
        onRequestClose={() => closeServiceSheet()}
      >
        {/* dimmed backdrop */}
        <Pressable style={styles.backdrop} onPress={() => closeServiceSheet()} />

        {/* animated sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }] },
          ]}
        >
          {/* glass effect panel */}
          <View style={styles.glassPanel}>
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>Which service do you need?</Text>
            {sheetTriggerSource ? (
              <Text style={styles.sheetSubtitle}>Triggered by {sheetTriggerSource}</Text>
            ) : null}

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.serviceButton, styles.policeButton]}
                onPress={() => sendIncident("Police")}
              >
                <Text style={styles.serviceText}>🚓 Police</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceButton, styles.ambulanceButton]}
                onPress={() => sendIncident("Ambulance")}
              >
                <Text style={styles.serviceText}>🚑 Ambulance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceButton, styles.fireButton]}
                onPress={() => sendIncident("Fire Station")}
              >
                <Text style={styles.serviceText}>🚒 Fire Station</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={() => closeServiceSheet()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </GlobalListenerContext.Provider>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // give the sheet some height; translateY anim moves it
    height: 320,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  glassPanel: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    // glass look: semi-transparent light with subtle blur-like feel
    backgroundColor: "rgba(255,255,255,0.06)", // subtle tint for dark glass
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    // inner shadow feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
    justifyContent: "flex-start",
  },
  handle: {
    width: 60,
    height: 6,
    borderRadius: 3,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 14,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  serviceButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    // glass inner
    borderWidth: 0.6,
    borderColor: "rgba(255,255,255,0.08)",
  },
  policeButton: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  ambulanceButton: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  fireButton: {
    // red glass accent
    backgroundColor: "rgba(200,18,38,0.18)",
    borderColor: "rgba(200,18,38,0.28)",
  },
  serviceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 18,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 0.6,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
