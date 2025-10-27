import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Accelerometer } from "expo-sensors";
import Svg, { Circle } from "react-native-svg";
import { ThemeContext } from "../ThemeContext"; // ✅ Make sure this path is correct

const gestures = ["Swipe Up", "Swipe Down", "Swipe Left", "Swipe Right", "Shake"];
const actions = ["Call Police", "Call Ambulance", "Call Firefighters"];
const numbers = {
  "Call Police": "tel:911",
  "Call Ambulance": "tel:912",
  "Call Firefighters": "tel:913",
};

const CIRCLE_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PhysicalGestureSetupScreen = ({ navigation }) => {
  const [selectedGesture, setSelectedGesture] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [savedGestures, setSavedGestures] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [progress, setProgress] = useState(0);
  const countdownRef = useRef(null);

  const { isDarkMode } = useContext(ThemeContext); // ✅ Same as VoiceSetupScreen

  useEffect(() => {
    const loadGestures = async () => {
      const saved = JSON.parse(await AsyncStorage.getItem("gestures")) || [];
      setSavedGestures(saved);
    };
    loadGestures();
  }, []);

  const saveGesture = async () => {
    if (!selectedGesture || !selectedAction) {
      Alert.alert("Missing Info", "Please select both a gesture and an action.");
      return;
    }

    const newEntry = { gesture: selectedGesture, action: selectedAction };
    const updated = [...savedGestures, newEntry];
    await AsyncStorage.setItem("gestures", JSON.stringify(updated));
    setSavedGestures(updated);
    setSelectedGesture(null);
    setSelectedAction(null);
    Alert.alert("Saved", "Gesture successfully saved!");
  };

  const startCountdown = (entry) => {
    setCountdown(3);
    setProgress(0);
    let secondsPassed = 0;

    countdownRef.current = setInterval(() => {
      secondsPassed += 0.1;
      setProgress(secondsPassed / 3);
      setCountdown((prev) => {
        if (prev <= 0.1) {
          clearInterval(countdownRef.current);
          const number = numbers[entry.action];
          if (number) Linking.openURL(number);
          return 0;
        }
        if (secondsPassed % 1 < 0.1) return prev - 1;
        return prev;
      });
    }, 100);
  };

  const handleAccelerometerData = (data) => {
    const { x, y, z } = data;
    let detected = null;

    if (Math.abs(x) > 1.5 || Math.abs(y) > 1.5 || Math.abs(z) > 1.5)
      detected = "Shake";
    else if (y < -0.7) detected = "Swipe Up";
    else if (y > 0.7) detected = "Swipe Down";
    else if (x < -0.7) detected = "Swipe Left";
    else if (x > 0.7) detected = "Swipe Right";

    if (detected) {
      const match = savedGestures.find((e) => e.gesture === detected);
      if (match && countdown === 0) startCountdown(match);
    }
  };

  useEffect(() => {
    const subscription = Accelerometer.addListener(handleAccelerometerData);
    Accelerometer.setUpdateInterval(300);
    return () => subscription && subscription.remove();
  }, [savedGestures, countdown]);

  const renderSaved = ({ item }) => (
    <View
      style={[
        styles.savedItem,
        { backgroundColor: isDarkMode ? "#2C2C2C" : "#fff" },
      ]}
    >
      <Text
        style={[
          styles.savedText,
          { color: isDarkMode ? "#fff" : "#A83232" },
        ]}
      >
        {item.gesture} → {item.action}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#fff" },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: isDarkMode ? "#fff" : "#A83232" },
        ]}
      >
        Physical Gesture Setup
      </Text>

      <Text style={[styles.sectionTitle, { color: isDarkMode ? "#fff" : "#A83232" }]}>
        Select a Gesture
      </Text>
      <View style={styles.optionsRow}>
        {gestures.map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              styles.optionButton,
              {
                backgroundColor:
                  selectedGesture === g
                    ? isDarkMode
                      ? "#555"
                      : "#ffb3b3"
                    : isDarkMode
                    ? "#333"
                    : "#f0f0f0",
              },
            ]}
            onPress={() => setSelectedGesture(g)}
          >
            <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: isDarkMode ? "#fff" : "#A83232" }]}>
        Assign an Action
      </Text>
      <View style={styles.optionsRow}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a}
            style={[
              styles.optionButton,
              {
                backgroundColor:
                  selectedAction === a
                    ? isDarkMode
                      ? "#555"
                      : "#ffb3b3"
                    : isDarkMode
                    ? "#333"
                    : "#f0f0f0",
              },
            ]}
            onPress={() => setSelectedAction(a)}
          >
            <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: isDarkMode ? "#333" : "#A83232" },
        ]}
        onPress={saveGesture}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Save Gesture</Text>
      </TouchableOpacity>

      {countdown > 0 && (
        <View style={styles.countdownContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <Circle
              stroke={isDarkMode ? "#444" : "#ccc"}
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
            />
            <Circle
              stroke={isDarkMode ? "#ff5c5c" : "#A83232"}
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              strokeLinecap="round"
            />
          </Svg>
          <Text
            style={{
              position: "absolute",
              fontSize: 22,
              fontWeight: "bold",
              color: isDarkMode ? "#ff5c5c" : "#A83232",
            }}
          >
            {countdown}
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: isDarkMode ? "#fff" : "#A83232" }]}>
        Saved Gestures
      </Text>
      <FlatList
        data={savedGestures}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderSaved}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={{ color: isDarkMode ? "#fff" : "#A83232", fontSize: 16 }}>⬅ Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PhysicalGestureSetupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  optionButton: {
    padding: 12,
    borderRadius: 10,
    margin: 5,
    minWidth: "40%",
    alignItems: "center",
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  savedItem: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
  },
  savedText: { fontWeight: "bold" },
  countdownContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignSelf: "center",
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: { alignItems: "center", marginTop: 10 },
});
