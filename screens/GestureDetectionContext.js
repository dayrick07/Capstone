import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { Accelerometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking } from "react-native";
import { AuthContext } from './AuthContext'; // Import the AuthContext

// --- Constants ---
const COUNTDOWN_DURATION = 3000; // 3 seconds
const numbers = {
  "Call Police (911)": "tel:911",
  "Call Ambulance (912)": "tel:912",
  "Call Firefighters (913)": "tel:913",
};

// Create the Gesture Context
export const GestureDetectionContext = createContext({
    countdown: 0,
    savedGestures: [],
    reloadGestures: () => {},
    clearCountdown: () => {},
});

// --- Hook containing core global detection logic ---
const useGlobalGestureDetection = (isUserLoggedIn) => {
    const [savedGestures, setSavedGestures] = useState([]);
    const [countdown, setCountdown] = useState(0);
    const countdownIntervalRef = useRef(null);
    const startTimeRef = useRef(null);

    const clearCountdown = () => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setCountdown(0);
        startTimeRef.current = null;
    };

    const loadGestures = async () => {
        try {
            const saved = JSON.parse(await AsyncStorage.getItem("gestures")) || [];
            setSavedGestures(saved);
        } catch (e) {
            console.error("Failed to load gestures:", e);
        }
    };
    
    // Function exposed for the SetupScreen to call after saving/deleting
    const reloadGestures = () => loadGestures(); 

    const startCountdown = (entry) => {
        if (countdownIntervalRef.current) return;

        startTimeRef.current = Date.now();
        setCountdown(3);

        Alert.alert(
            "Emergency Action Detected",
            `Gesture: ${entry.gesture}.\nAction: ${entry.action}.\nCalling in 3 seconds...`,
            [{ text: "Cancel", onPress: clearCountdown, style: "cancel" }]
        );

        countdownIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = Math.max(0, COUNTDOWN_DURATION - elapsed);
            const newCountdown = Math.ceil(remaining / 1000);
            setCountdown(newCountdown);

            if (remaining <= 0) {
                clearCountdown();
                const number = numbers[entry.action];
                if (number) Linking.openURL(number);
                else Alert.alert("Error", `Could not find number for action: ${entry.action}`);
            }
        }, 1000); 
    };

    const handleAccelerometerData = (data) => {
        if (countdown > 0) return;
        
        const { x, y } = data;
        let detected = null;
        const shakeThreshold = 2.5; 
        const swipeThreshold = 0.8; 
        const magnitude = Math.sqrt(x * x + y * y + data.z * data.z);

        if (magnitude > shakeThreshold) detected = "Shake";
        else if (y < -swipeThreshold) detected = "Swipe Up";
        else if (y > swipeThreshold) detected = "Swipe Down";
        else if (x < -swipeThreshold) detected = "Swipe Left";
        else if (x > swipeThreshold) detected = "Swipe Right";

        if (detected) {
            const match = savedGestures.find((e) => e.gesture === detected);
            if (match && countdown === 0) {
                startCountdown(match);
            }
        }
    };

    // 1. Load gestures initially and periodically to catch updates from the SetupScreen
    useEffect(() => {
        loadGestures();
        // Poll every 5 seconds for updates to ensure the global listener gets new saved gestures
        const interval = setInterval(loadGestures, 5000); 
        return () => clearInterval(interval);
    }, []);

    // 2. Accelerometer Subscription effect (only runs when logged in)
    useEffect(() => {
        if (!isUserLoggedIn) {
            clearCountdown();
            // Crucial: Stop the listener when the user logs out
            Accelerometer.removeAllListeners(); 
            return;
        }
        
        let subscription;
        const setupAccelerometer = async () => {
            subscription = Accelerometer.addListener(handleAccelerometerData);
            Accelerometer.setUpdateInterval(100); 
        };

        setupAccelerometer();

        return () => {
            if (subscription) subscription.remove();
            clearCountdown();
        };
    }, [isUserLoggedIn, savedGestures, countdown]);

    return { countdown, savedGestures, reloadGestures, clearCountdown };
};

// --- Gesture Detection Provider Component ---
export const GestureDetectionProvider = ({ children }) => {
    // Consume the AuthContext to get the global login state
    const { isLoggedIn } = useContext(AuthContext); 
    
    // Run the global detection hook, passing the login status
    const { countdown, savedGestures, reloadGestures, clearCountdown } = useGlobalGestureDetection(isLoggedIn);

    return (
        <GestureDetectionContext.Provider 
            value={{ 
                countdown, 
                savedGestures, 
                reloadGestures, 
                clearCountdown,
            }}
        >
            {children}
        </GestureDetectionContext.Provider>
    );
};