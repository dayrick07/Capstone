import React, { useEffect, useRef } from "react";
import { Vibration, Linking } from "react-native"; 
import { Accelerometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Configuration Constants ---
const SAMPLE_INTERVAL = 100; // 100ms update interval for responsiveness
const COUNTDOWN_DURATION = 3000; // 3 seconds before calling
const DOUBLE_SHAKE_WINDOW = 500; // Time window (ms) to detect a second shake

// Detection Thresholds (based on PhysicalGestureSetupScreen.js)
const SHAKE_THRESHOLD = 2.5; 
const SWIPE_THRESHOLD = 0.8;

// Action Names used in PhysicalGestureSetupScreen
const emergencyNumbers = {
  "Call Police (911)": "tel:911",
  "Call Ambulance (912)": "tel:912",
  "Call Firefighters (913)": "tel:913",
};

// --- Core Utility Functions ---

// Determines the detected gesture based on accelerometer data
const detectGesture = ({ x, y, z }) => {
  const magnitude = Math.sqrt(x * x + y * y + z * z);

  // Return "Shake" if the force exceeds the threshold
  if (magnitude > SHAKE_THRESHOLD) return "Shake";
  
  // Swipe detection remains the same
  if (y < -SWIPE_THRESHOLD) return "Swipe Up";
  if (y > SWIPE_THRESHOLD) return "Swipe Down";
  if (x < -SWIPE_THRESHOLD) return "Swipe Left";
  if (x > -SWIPE_THRESHOLD) return "Swipe Right";
  
  return null;
};

// Loads saved gestures from the correct storage key
const loadGestures = async () => {
    try {
        const saved = await AsyncStorage.getItem("gestures"); 
        return JSON.parse(saved) || [];
    } catch (e) {
        console.error("Failed to load global gestures:", e);
        return [];
    }
};


const GlobalListener = () => {
  // Refs to manage state globally without triggering unnecessary re-renders in the main app
  const savedGesturesRef = useRef([]);
  const countdownTimerRef = useRef(null);
  const isCountdownActiveRef = useRef(false);
  const lastDetectedGestureRef = useRef(null); 
  
  // --- New Refs for Double Shake Logic ---
  const lastGestureTimeRef = useRef(0); // General debounce for non-shake gestures
  const firstShakeTimeRef = useRef(0);  // Tracks the time of the first shake
  const isWaitingForSecondShakeRef = useRef(false); // Flag for the 500ms window
  
  // Initial load of gestures when the listener starts
  useEffect(() => {
    loadGestures().then(gestures => {
        savedGesturesRef.current = gestures;
    });
  }, []);

  // Function to clear any active emergency countdown
  const clearCountdown = () => {
    if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
    }
    isCountdownActiveRef.current = false;
    lastDetectedGestureRef.current = null;
    console.log("[GLOBAL] Countdown reset.");
    // Also reset shake tracking
    firstShakeTimeRef.current = 0;
    isWaitingForSecondShakeRef.current = false;
  };

  // Function to handle the actual gesture trigger (start countdown)
  const handleGesture = (detectedGesture) => {
    // 1. Find the matching action
    const matched = savedGesturesRef.current.find((g) => g.gesture === detectedGesture);
    if (!matched) return; 

    const actionNumber = emergencyNumbers[matched.action];
    if (!actionNumber) return; 

    // 2. Prevent starting a new countdown if one is already active
    if (isCountdownActiveRef.current) return;
    
    // 3. Start the 3-second countdown
    isCountdownActiveRef.current = true;
    lastDetectedGestureRef.current = detectedGesture;
    Vibration.vibrate([0, 200, 100, 200]); // Short warning vibration sequence

    console.log(`[GLOBAL] Gesture '${detectedGesture}' detected. Calling '${matched.action}' in ${COUNTDOWN_DURATION / 1000} seconds.`);
    
    countdownTimerRef.current = setTimeout(() => {
        if (!isCountdownActiveRef.current) return; // Check if it was cancelled
        
        console.log(`[GLOBAL] Countdown finished. Executing action: ${matched.action}`);
        Linking.openURL(actionNumber);
        
        // Reset state after action is taken
        clearCountdown();

    }, COUNTDOWN_DURATION);
  };
  
  // --- Accelerometer Listener Setup ---
  useEffect(() => {
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL);
    
    // Timer ref to clear the first shake window 
    let firstShakeTimer = null;

    const subscription = Accelerometer.addListener((data) => {
      const detected = detectGesture(data);
      const now = Date.now();
      
      // CANCELLATION LOGIC (Subsequent Shake cancels any active countdown)
      if (detected === "Shake" && isCountdownActiveRef.current) {
          // Add debounce to avoid cancelling too easily
          if (now - lastGestureTimeRef.current > 500) { 
              console.log("[GLOBAL] Subsequent Shake detected. Cancelling active action.");
              Vibration.vibrate(500); // Longer confirmation Vibrate
              clearCountdown();
              lastGestureTimeRef.current = now; // Reset debounce for new detection
              return; // Stop processing further
          }
      }
      
      // ---------------------------------------------
      // 1. DOUBLE SHAKE DETECTION LOGIC (Replaces single Shake trigger)
      // ---------------------------------------------
      if (detected === "Shake") {
          
          if (isWaitingForSecondShakeRef.current) {
              // SECOND SHAKE DETECTED within the window!
              
              // 1. Clear the timeout that was waiting for the second shake
              clearTimeout(firstShakeTimer);
              firstShakeTimer = null;
              
              // 2. Reset the tracking refs
              isWaitingForSecondShakeRef.current = false;
              firstShakeTimeRef.current = 0;
              lastGestureTimeRef.current = now; // Apply general debounce
              
              // 3. Trigger the action for the DOUBLE SHAKE
              handleGesture("Shake"); // We use the existing "Shake" action name
              console.log("[GLOBAL] DOUBLE SHAKE Detected.");
              
          } else if (firstShakeTimeRef.current === 0) {
              // FIRST SHAKE DETECTED
              
              isWaitingForSecondShakeRef.current = true;
              firstShakeTimeRef.current = now;
              console.log("[GLOBAL] First shake registered. Waiting for second...");

              // Set a timeout to reset the state if the second shake doesn't occur
              firstShakeTimer = setTimeout(() => {
                  if (isWaitingForSecondShakeRef.current) {
                      console.log("[GLOBAL] Double shake window expired.");
                      isWaitingForSecondShakeRef.current = false;
                      firstShakeTimeRef.current = 0;
                  }
              }, DOUBLE_SHAKE_WINDOW);
          }
          
      } 
      // ---------------------------------------------
      // 2. SINGLE SWIPE DETECTION LOGIC (Standard Debouncing)
      // ---------------------------------------------
      else if (detected && now - lastGestureTimeRef.current > 1000 && !isCountdownActiveRef.current) {
          // If a non-shake gesture (Swipe) is detected, clear any pending shake state
          if (isWaitingForSecondShakeRef.current) {
             clearTimeout(firstShakeTimer);
             firstShakeTimer = null;
             isWaitingForSecondShakeRef.current = false;
             firstShakeTimeRef.current = 0;
          }
          
          lastGestureTimeRef.current = now;
          handleGesture(detected);
      }
    });

    // Cleanup: stop listening and clear timer when component unmounts
    return () => {
      subscription.remove();
      clearCountdown();
      if (firstShakeTimer) clearTimeout(firstShakeTimer);
    };
  }, []); 

  // This component doesn't render anything, it just manages the listener.
  return null;
};

export default GlobalListener;