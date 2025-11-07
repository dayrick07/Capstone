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
// Assuming you have installed 'react-native-vector-icons' or similar for icons
import { MaterialIcons } from "@expo/vector-icons"; 
import { ThemeContext } from "../ThemeContext"; // ✅ Make sure this path is correct

// --- Constants ---
const gestures = ["Swipe Up", "Swipe Down", "Swipe Left", "Swipe Right", "Shake"];
const actions = ["Call Police (911)", "Call Ambulance (912)", "Call Firefighters (913)"];
const numbers = {
  "Call Police (911)": "tel:911",
  "Call Ambulance (912)": "tel:912",
  "Call Firefighters (913)": "tel:913",
};

// Countdown Circle Config
const CIRCLE_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const COUNTDOWN_DURATION = 3000; // 3 seconds in ms

const PhysicalGestureSetupScreen = ({ navigation }) => {
  const [selectedGesture, setSelectedGesture] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [savedGestures, setSavedGestures] = useState([]);
  const [countdown, setCountdown] = useState(0); // Time remaining in seconds
  const [progress, setProgress] = useState(0); // Progress from 0 to 1
  const countdownIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const { isDarkMode } = useContext(ThemeContext);

  // --- Data Loading and Persistence ---
  const loadGestures = async () => {
    try {
      const saved = JSON.parse(await AsyncStorage.getItem("gestures")) || [];
      setSavedGestures(saved);
    } catch (e) {
      console.error("Failed to load gestures:", e);
    }
  };

  useEffect(() => {
    loadGestures();
  }, []);

  const saveGesture = async () => {
    if (!selectedGesture || !selectedAction) {
      Alert.alert("Missing Info", "Please select both a gesture and an action.");
      return;
    }
    
    // Prevent duplicate gesture assignments
    if (savedGestures.some(entry => entry.gesture === selectedGesture)) {
        Alert.alert("Duplicate Gesture", `${selectedGesture} is already assigned. Please delete the existing assignment first.`);
        return;
    }

    const newEntry = { 
        gesture: selectedGesture, 
        action: selectedAction,
        id: Date.now().toString() // Unique ID for key/deletion
    };
    const updated = [...savedGestures, newEntry];
    await AsyncStorage.setItem("gestures", JSON.stringify(updated));
    setSavedGestures(updated);
    setSelectedGesture(null);
    setSelectedAction(null);
    Alert.alert("Success", `Gesture ${selectedGesture} is now mapped to ${selectedAction}.`);
  };

  const deleteGesture = async (id) => {
    Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this saved gesture?",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                onPress: async () => {
                    const updated = savedGestures.filter(entry => entry.id !== id);
                    await AsyncStorage.setItem("gestures", JSON.stringify(updated));
                    setSavedGestures(updated);
                    Alert.alert("Deleted", "Gesture successfully removed.");
                }
            }
        ]
    );
  };
  
  // --- Live Detection and Countdown Logic (For this Screen's Test Feature) ---
  
  const clearCountdown = () => {
      if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
      }
      setCountdown(0);
      setProgress(0);
      startTimeRef.current = null;
  };

  const startCountdown = (entry) => {
    // Clear any previous interval first
    clearCountdown(); 

    startTimeRef.current = Date.now();
    setCountdown(3);
    setProgress(0);

    countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, COUNTDOWN_DURATION - elapsed);
        
        const newProgress = elapsed / COUNTDOWN_DURATION;
        setProgress(newProgress);
        
        // Update countdown text only on whole second changes
        const newCountdown = Math.ceil(remaining / 1000);
        setCountdown(newCountdown);

        if (remaining <= 0) {
            clearCountdown();
            
            // Trigger Action
            const number = numbers[entry.action];
            if (number) Linking.openURL(number);
            else Alert.alert("Error", `Could not find number for action: ${entry.action}`);
        }
    }, 50); // High frequency update for smooth progress bar
  };

  const handleAccelerometerData = (data) => {
    if (countdown > 0) return; // Ignore new gestures during countdown

    const { x, y, z } = data;
    let detected = null;
    
    // Normalize and detect motion
    const shakeThreshold = 2.5; // Increased threshold for Shake
    const swipeThreshold = 0.8; // Standard threshold for Swipes
    
    const magnitude = Math.sqrt(x*x + y*y + z*z);

    if (magnitude > shakeThreshold) detected = "Shake";
    else if (y < -swipeThreshold) detected = "Swipe Up";
    else if (y > swipeThreshold) detected = "Swipe Down";
    else if (x < -swipeThreshold) detected = "Swipe Left";
    else if (x > swipeThreshold) detected = "Swipe Right";

    if (detected) {
      const match = savedGestures.find((e) => e.gesture === detected);
      if (match && countdown === 0) {
        // Only start countdown if a matched gesture is detected and no countdown is active
        startCountdown(match);
      }
    }
  };

  useEffect(() => {
    // This useEffect is ONLY for testing the functionality on this screen.
    const subscription = Accelerometer.addListener(handleAccelerometerData);
    Accelerometer.setUpdateInterval(100); // 100ms update interval for responsiveness
    return () => {
      subscription && subscription.remove();
      clearCountdown(); // Clear interval if component unmounts
    }
  }, [savedGestures, countdown]); // Re-subscribe if savedGestures change

  // --- Render Functions ---

  const renderSaved = ({ item }) => (
    <View
      style={[
        styles.savedItem,
        { backgroundColor: isDarkMode ? "#2C2C2C" : "#f0f0f0" },
        { borderColor: isDarkMode ? "#ff5c5c" : "#A83232", borderWidth: 1 }
      ]}
    >
      <Text
        style={[
          styles.savedText,
          { color: isDarkMode ? "#fff" : "#333" },
        ]}
      >
        {item.gesture} → {item.action}
      </Text>
      <TouchableOpacity onPress={() => deleteGesture(item.id)} style={styles.deleteButton}>
        <MaterialIcons name="delete-forever" size={24} color={isDarkMode ? "#ff5c5c" : "#A83232"} />
      </TouchableOpacity>
    </View>
  );

  const getButtonBackgroundColor = (isDarkMode, isSelected) => {
      if (isSelected) {
          return isDarkMode ? "#555" : "#ffb3b3";
      }
      return isDarkMode ? "#333" : "#f0f0f0";
  };
  
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
          { color: isDarkMode ? "#ff5c5c" : "#A83232" },
        ]}
      >
        Physical Gesture Setup
      </Text>

      <Text style={[styles.sectionTitle, { color: isDarkMode ? "#fff" : "#A83232" }]}>
        1. Select a Gesture
      </Text>
      <View style={styles.optionsRow}>
        {gestures.map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              styles.optionButton,
              { backgroundColor: getButtonBackgroundColor(isDarkMode, selectedGesture === g) },
            ]}
            onPress={() => setSelectedGesture(g)}
          >
            <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: isDarkMode ? "#fff" : "#A83232" }]}>
        2. Assign an Action
      </Text>
      <View style={styles.optionsRow}>
        {actions.map((a) => (
          <TouchableOpacity
            key={a}
            style={[
              styles.optionButton,
              { backgroundColor: getButtonBackgroundColor(isDarkMode, selectedAction === a) },
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
          { backgroundColor: isDarkMode ? "#ff5c5c" : "#A83232" },
        ]}
        onPress={saveGesture}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>3. Save Assignment</Text>
      </TouchableOpacity>

      {/* Countdown Visualization */}
      {countdown > 0 && (
        <View style={styles.countdownWrapper}>
            <View style={styles.countdownContainer}>
                <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                    {/* Background Circle */}
                    <Circle
                        stroke={isDarkMode ? "#444" : "#ccc"}
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={RADIUS}
                        strokeWidth={STROKE_WIDTH}
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <Circle
                        stroke={isDarkMode ? "#ff5c5c" : "#A83232"}
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={RADIUS}
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={`${CIRCUMFERENCE}`}
                        strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </Svg>
                <Text
                    style={{
                        position: "absolute",
                        fontSize: 28,
                        fontWeight: "bold",
                        color: isDarkMode ? "#ff5c5c" : "#A83232",
                    }}
                >
                    {countdown}
                </Text>
            </View>
            <TouchableOpacity onPress={clearCountdown} style={styles.cancelButton}>
                <Text style={{color: isDarkMode ? '#fff' : '#000'}}>Cancel Countdown</Text>
            </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: isDarkMode ? "#fff" : "#A83232", marginTop: 20 }]}>
        Saved Gestures (Try testing them now!)
      </Text>
      <FlatList
        data={savedGestures}
        keyExtractor={(item) => item.id}
        renderItem={renderSaved}
        style={{flexGrow: 0, maxHeight: 200}}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={{ color: isDarkMode ? "#fff" : "#A83232", fontSize: 16 }}>⬅ Back to Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PhysicalGestureSetupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, marginTop: 10 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15, justifyContent: 'space-around' },
  optionButton: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
    marginHorizontal: 2,
    minWidth: "45%",
    alignItems: "center",
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
    shadowColor: '#A83232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  savedItem: {
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedText: { fontWeight: "bold", flexShrink: 1, paddingRight: 10 },
  deleteButton: { padding: 5 },
  countdownWrapper: {
      alignItems: 'center',
      marginBottom: 20,
      padding: 10,
      borderRadius: 15,
      backgroundColor: 'rgba(255, 0, 0, 0.05)', // Light red background for emphasis
  },
  countdownContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cancelButton: {
      marginTop: 5,
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(100, 100, 100, 0.2)',
  },
  backButton: { alignItems: "center", marginTop: 20 },
});