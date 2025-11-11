import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";
import axios from "axios";
import { SERVER_URL } from "../config";

export default function PhysicalGestureSetupScreen({ route, navigation }) {
  const { userData } = route.params;
  const [selectedGesture, setSelectedGesture] = useState(null);
  const [listening, setListening] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [shakeStartTime, setShakeStartTime] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef(null);
  const [cancelled, setCancelled] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let subscription;
    if (listening && selectedGesture === "shake3s") {
      subscription = Accelerometer.addListener((data) => {
        const totalForce =
          Math.abs(data.x) + Math.abs(data.y) + Math.abs(data.z);

        // If strong shake detected
        if (totalForce > 2) {
          if (!isShaking) {
            setIsShaking(true);
            setShakeStartTime(Date.now());
          } else {
            const duration = (Date.now() - shakeStartTime) / 1000;
            if (duration >= 3 && !modalVisible) {
              Vibration.vibrate(500);
              setModalVisible(true);
              setCountdown(5);
              setCancelled(false);
              startCountdown();
            }
          }
        } else {
          // Reset if shaking stops
          setIsShaking(false);
          setShakeStartTime(null);
        }
      });

      Accelerometer.setUpdateInterval(200);
    }

    return () => subscription && subscription.remove();
  }, [listening, selectedGesture, isShaking, shakeStartTime]);

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          if (!cancelled) sendDistressSignal();
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    setCancelled(true);
    clearInterval(countdownRef.current);
    setModalVisible(false);
    Alert.alert("Cancelled", "Distress alert cancelled.");
  };

  const confirmSend = () => {
    clearInterval(countdownRef.current);
    sendDistressSignal();
  };

  const sendDistressSignal = async () => {
    setModalVisible(false);
    setSending(true);
    try {
      // Get current GPS location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        setSending(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      await axios.post(`${SERVER_URL}/incidents`, {
        Type: "Distress (Physical Gesture)",
        Location: "Triggered via Shake Gesture",
        Latitude: latitude,
        Longitude: longitude,
        Status: "Pending",
        UserId: userData.Id,
      });

      Alert.alert("🚨 Alert Sent", "Rescuers have been notified!");
      Vibration.vibrate(1000);
      setListening(false);
    } catch (err) {
      console.error("Error sending distress:", err);
      Alert.alert("Error", "Failed to send distress signal.");
    }
    setSending(false);
  };

  const handleGestureSelection = (gesture) => {
    setSelectedGesture(gesture);
    if (gesture === "shake3s") {
      Alert.alert(
        "Shake Gesture Enabled",
        "Shake your phone for about 3 seconds to trigger a distress alert."
      );
      setListening(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Physical Gesture Setup</Text>

      <TouchableOpacity
        style={[
          styles.option,
          selectedGesture === "shake3s" && styles.selectedOption,
        ]}
        onPress={() => handleGestureSelection("shake3s")}
      >
        <Text style={styles.optionText}>📱 Shake Device for 3 Seconds</Text>
        <Text style={styles.subText}>
          Triggers a distress alert with countdown and cancel option.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.option}
        onPress={() => Alert.alert("Coming Soon", "More gestures coming soon!")}
      >
        <Text style={styles.optionText}>⚙️ Other Gestures</Text>
        <Text style={styles.subText}>
          Power button or tilt motion (in future updates).
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Countdown Modal */}
      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🚨 Distress Alert</Text>
            <Text style={styles.modalMessage}>
              Sending help in {countdown} seconds...
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelCountdown}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmSend}
            >
              <Text style={styles.confirmText}>Send Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {sending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#A83232" />
          <Text style={{ color: "#fff", marginTop: 10 }}>Sending alert...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F9F9F9" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  option: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  selectedOption: {
    borderColor: "#A83232",
    borderWidth: 2,
    backgroundColor: "#ffeaea",
  },
  optionText: { fontSize: 18, fontWeight: "600" },
  subText: { fontSize: 14, color: "#666", marginTop: 5 },
  backButton: { alignSelf: "center", marginTop: 30 },
  backText: { fontSize: 16, color: "#A83232" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#A83232",
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
  },
  cancelText: { color: "#000", fontWeight: "bold" },
  confirmButton: {
    backgroundColor: "#A83232",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  confirmText: { color: "#fff", fontWeight: "bold" },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
