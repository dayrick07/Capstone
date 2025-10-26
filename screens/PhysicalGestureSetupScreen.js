import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Accelerometer } from "expo-sensors";
import Svg, { Circle } from "react-native-svg";

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

const PhysicalGestureSetupScreen = () => {
  const [selectedGesture, setSelectedGesture] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [savedGestures, setSavedGestures] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [progress, setProgress] = useState(0);

  const countdownRef = useRef(null);

  useEffect(() => {
    const loadGestures = async () => {
      const saved = JSON.parse(await AsyncStorage.getItem("gestures")) || [];
      setSavedGestures(saved);
    };
    loadGestures();
  }, []);

  const saveGesture = async () => {
    if (!selectedGesture || !selectedAction) {
      alert("Select both gesture and action!");
      return;
    }
    const newEntry = { gesture: selectedGesture, action: selectedAction };
    const updatedGestures = [...savedGestures, newEntry];
    await AsyncStorage.setItem("gestures", JSON.stringify(updatedGestures));
    setSavedGestures(updatedGestures);
    alert("Gesture saved!");
    setSelectedGesture(null);
    setSelectedAction(null);
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
          if (number) {
            Linking.openURL(number);
          }
          return 0;
        }
        if (secondsPassed % 1 < 0.1) return prev - 1;
        return prev;
      });
    }, 100);
  };

  const handleAccelerometerData = (data) => {
    const { x, y, z } = data;
    let detectedGesture = null;

    if (Math.abs(x) > 1.5 || Math.abs(y) > 1.5 || Math.abs(z) > 1.5) detectedGesture = "Shake";
    else if (y < -0.7) detectedGesture = "Swipe Up";
    else if (y > 0.7) detectedGesture = "Swipe Down";
    else if (x < -0.7) detectedGesture = "Swipe Left";
    else if (x > 0.7) detectedGesture = "Swipe Right";

    if (detectedGesture) {
      const entry = savedGestures.find((e) => e.gesture === detectedGesture);
      if (entry && countdown === 0) {
        startCountdown(entry);
      }
    }
  };

  useEffect(() => {
    const subscription = Accelerometer.addListener(handleAccelerometerData);
    Accelerometer.setUpdateInterval(300);
    return () => subscription && subscription.remove();
  }, [savedGestures, countdown]);

  const renderSavedItem = ({ item }) => (
    <View style={styles.savedItem}>
      <Text style={styles.savedText}>
        {item.gesture} → {item.action}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Gesture</Text>
      <View style={styles.optionsContainer}>
        {gestures.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.optionButton, selectedGesture === g && styles.selectedOption]}
            onPress={() => setSelectedGesture(g)}
          >
            <Text style={styles.optionText}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.title}>Assign an Action</Text>
      <View style={styles.optionsContainer}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.optionButton, selectedAction === a && styles.selectedOption]}
            onPress={() => setSelectedAction(a)}
          >
            <Text style={styles.optionText}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveGesture}>
        <Text style={styles.saveText}>Save Gesture</Text>
      </TouchableOpacity>

      {countdown > 0 && (
        <View style={styles.countdownContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <Circle
              stroke="#e6e6e6"
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
            />
            <Circle
              stroke="#A83232"
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      <Text style={styles.title}>Saved Gestures</Text>
      <FlatList
        data={savedGestures}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderSavedItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  optionsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  optionButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    margin: 5,
    borderRadius: 10,
  },
  selectedOption: { backgroundColor: "#A83232" },
  optionText: { color: "#000" },
  saveButton: {
    backgroundColor: "#A83232",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  saveText: { color: "#fff", fontWeight: "bold" },
  savedItem: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
  },
  savedText: { color: "#000", fontWeight: "bold" },
  countdownContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignSelf: "center",
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  countdownText: {
    position: "absolute",
    fontSize: 22,
    fontWeight: "bold",
    color: "#A83232",
  },
});

export default PhysicalGestureSetupScreen;
