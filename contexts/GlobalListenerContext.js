// GlobalListenerContext.js (Expo-friendly)
import React, { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";
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

  const SHAKE_FORCE = 4; // Low sensitivity for testing

  // Load saved settings
  useEffect(() => {
    (async () => {
      const shake = await AsyncStorage.getItem("shakeEnabled");
      const volume = await AsyncStorage.getItem("volumeEnabled");
      if (shake !== null) setShakeEnabled(shake === "true");
      if (volume !== null) setVolumeEnabled(volume === "true");
    })();
  }, []);

  // -------- Shake Detection --------
  const startAccelerometer = () => {
    Accelerometer.setUpdateInterval(200);
    return Accelerometer.addListener((data) => {
      const totalForce = Math.abs(data.x) + Math.abs(data.y) + Math.abs(data.z);
      if (totalForce > SHAKE_FORCE) setShakeCount(prev => prev + 1);
    });
  };

  useEffect(() => {
    if (!shakeEnabled) return;
    const subscription = startAccelerometer();
    return () => subscription && subscription.remove();
  }, [shakeEnabled]);

  useEffect(() => {
    if (!shakeEnabled || cooldown) return;
    if (shakeCount >= 3) { // 3 shakes triggers
      setShakeCount(0);
      showConfirmation("Shake detected");
    }
  }, [shakeCount, shakeEnabled]);

  // -------- Confirmation --------
  const showConfirmation = (triggerSource) => {
    Alert.alert(
      "Send SOS Alert?",
      `Triggered by ${triggerSource}. Do you want to report this emergency?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: sendIncident },
      ],
      { cancelable: true }
    );
  };

  // -------- Send Incident --------
  const sendIncident = async () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), 4000); // 4 sec cooldown

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Location Required", "Enable location to send SOS");
      }

      const loc = await Location.getCurrentPositionAsync({});
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;
      const locationName = `LAT:${latitude}, LNG:${longitude}`;

      await axios.post(`${SERVER_URL}/incidents`, {
        Type: "Emergency Alert",
        Location: locationName,
        Latitude: latitude,
        Longitude: longitude,
        Status: "Pending",
        UserId: userData?.Id || null,
        UserMobile: userData?.Mobile || null,
      });

      Alert.alert("🚨 SOS Sent!", "Rescuers have been notified!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to send the incident.");
    }
  };

  // -------- Save Settings --------
  const saveSettings = async () => {
    await AsyncStorage.setItem("shakeEnabled", shakeEnabled.toString());
    await AsyncStorage.setItem("volumeEnabled", volumeEnabled.toString());
    Alert.alert("Saved", "Settings updated!");
  };

  // -------- UI simulated volume buttons --------
  const setVolumeUpPressed = (pressed) => {
    if (pressed && volumeEnabled && !cooldown) {
      showConfirmation("Volume Up Pressed");
    }
  };
  const setVolumeDownPressed = (pressed) => {
    if (pressed && volumeEnabled && !cooldown) {
      showConfirmation("Volume Down Pressed");
    }
  };

  return (
    <GlobalListenerContext.Provider
      value={{
        shakeEnabled,
        setShakeEnabled,
        volumeEnabled,
        setVolumeEnabled,
        saveSettings,
        setVolumeUpPressed,
        setVolumeDownPressed,
      }}
    >
      {children}
    </GlobalListenerContext.Provider>
  );
};
