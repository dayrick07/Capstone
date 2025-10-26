import React, { useEffect, useRef } from "react";
import { Alert, Vibration, Linking } from "react-native";
import { Accelerometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Sensitivity constants
const SHAKE_THRESHOLD = 1.7;
const SAMPLE_INTERVAL = 100;

// Emergency numbers
const emergencyNumbers = {
  "Call Police": "tel:911",
  "Call Ambulance": "tel:912",
  "Call Firefighters": "tel:913",
};

// Check if the phone is shaken
const isShake = ({ x, y, z }) => {
  const totalForce = Math.sqrt(x * x + y * y + z * z);
  return totalForce > SHAKE_THRESHOLD;
};

const GlobalListener = () => {
  const lastShakeTime = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL);

    const subscription = Accelerometer.addListener(async (data) => {
      const now = Date.now();
      if (isShake(data) && now - lastShakeTime.current > 1000) {
        lastShakeTime.current = now;
        Vibration.vibrate(500);
        handleGesture("Shake");
      }
    });

    return () => subscription.remove();
  }, []);

  const handleGesture = async (gestureName) => {
    try {
      const savedGestures =
        JSON.parse(await AsyncStorage.getItem("physicalGestures")) || [];

      const matched = savedGestures.find((g) => g.gesture === gestureName);

      if (matched) {
        const number = emergencyNumbers[matched.action];
        if (number) {
          Alert.alert(
            "Emergency Detected",
            `Perform ${matched.action}?`,
            [
              { text: "No", style: "cancel" },
              { text: "Yes", onPress: () => Linking.openURL(number) },
            ]
          );
        }
      }
    } catch (error) {
      console.log("GlobalListener error:", error);
    }
  };

  return null;
};

export default GlobalListener;
