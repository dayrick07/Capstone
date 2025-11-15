import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Vibration,
    Modal,
    ActivityIndicator,
    // Note: If persisting choice across app restarts, you'll need to install and import AsyncStorage here.
} from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors"; // Import Gyroscope for 'Tilt' example
import * as Location from "expo-location";
import axios from "axios";
import { SERVER_URL } from "../config";

// --- GESTURE CONFIGURATION CONSTANTS ---
const GESTURE_CONFIGS = {
    // Current working gesture
    shake3s: {
        name: "📱 Shake Device for 3 Seconds",
        subText: "Triggers alert after 3s of firm shaking (most reliable).",
        sensor: 'accelerometer',
        duration: 3,
        threshold: 2.0,
    },
    // Placeholder gesture to show selection logic
    tilt5s: {
        name: "📐 Tilt Device Vertically for 5 Seconds",
        subText: "Requires holding the phone vertically stable for 5s (less reliable).",
        sensor: 'gyroscope', // Placeholder sensor, though tilt is often done with Accelerometer or DeviceMotion
        duration: 5,
        threshold: 0.5, // Placeholder threshold
    }
};

export default function PhysicalGestureSetupScreen({ route, navigation }) {
    const { userData } = route.params;
    const userId = userData?.Id;

    // State for the user's currently active (saved) gesture preference
    const [activeGestureKey, setActiveGestureKey] = useState(null); 
    const [listening, setListening] = useState(false);
    
    // Shake state
    const [isShaking, setIsShaking] = useState(false);
    const [shakeStartTime, setShakeStartTime] = useState(null);
    
    // Generic alert state
    const [modalVisible, setModalVisible] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [cancelled, setCancelled] = useState(false);
    const [sending, setSending] = useState(false);
    
    const [sensorPermissionGranted, setSensorPermissionGranted] = useState(false);

    const countdownRef = useRef(null);
    const sensorSubscription = useRef(null);

    // --- 0. LOCAL STORAGE PLACEHOLDER (Replace with AsyncStorage/other storage) ---
    // In a real app, you would load and save the activeGestureKey to AsyncStorage
    const loadUserPreference = useCallback(() => {
        // Mock loading the preference (e.g., from AsyncStorage)
        // For now, we default to shake3s if nothing is set
        setActiveGestureKey(GESTURE_CONFIGS.shake3s.name); 
        setListening(true); // Start listening to the default gesture immediately
    }, []);

    const saveUserPreference = useCallback((key) => {
        // Mock saving the preference (e.g., to AsyncStorage)
        setActiveGestureKey(key);
        Alert.alert("Gesture Saved", `${key} is now your active distress gesture.`);
    }, []);

    useEffect(() => {
        loadUserPreference();
    }, [loadUserPreference]);

    // --- 1. SENSOR PERMISSION CHECK ---
    useEffect(() => {
        (async () => {
            // Check permissions for both relevant sensors
            const accStatus = await Accelerometer.requestPermissionsAsync();
            const gyrStatus = await Gyroscope.requestPermissionsAsync(); 
            
            if (accStatus.status === 'granted' && gyrStatus.status === 'granted') {
                setSensorPermissionGranted(true);
            } else {
                setSensorPermissionGranted(false);
            }
        })();
    }, []);


    // --- 2. SENSOR SUBSCRIPTION MANAGEMENT ---

    const unsubscribeSensor = useCallback(() => {
        if (sensorSubscription.current) {
            sensorSubscription.current.remove();
            sensorSubscription.current = null;
        }
    }, []);
    
    // This is the core logic that determines which sensor to listen to
    const subscribeSensor = useCallback(() => {
        if (!sensorPermissionGranted || !listening || !activeGestureKey || sensorSubscription.current) return;
        
        unsubscribeSensor(); // Ensure previous is cleared

        const config = Object.values(GESTURE_CONFIGS).find(c => c.name === activeGestureKey);
        if (!config) return;

        // Reset state for new listening session
        setIsShaking(false);
        setShakeStartTime(null);

        const listener = (data) => {
            // --- SHAKE3S LOGIC ---
            if (config.name === GESTURE_CONFIGS.shake3s.name) {
                const totalForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);

                if (totalForce > config.threshold) {
                    if (!isShaking) {
                        setIsShaking(true);
                        setShakeStartTime(Date.now());
                    } else {
                        const duration = (Date.now() - shakeStartTime) / 1000;
                        if (duration >= config.duration && !modalVisible) {
                            Vibration.vibrate(500);
                            setModalVisible(true);
                            setCountdown(5);
                            setCancelled(false);
                            startCountdown();
                            unsubscribeSensor();
                        }
                    }
                } else if (isShaking) {
                    setIsShaking(false);
                    setShakeStartTime(null);
                }
            } 
            
            // --- TILT5S LOGIC (Placeholder) ---
            else if (config.name === GESTURE_CONFIGS.tilt5s.name) {
                 // Example logic: Check if Z-axis rotational velocity is near zero for 5 seconds
                 const isVerticalStable = (Math.abs(data.z) < config.threshold);

                 if (isVerticalStable) {
                     if (!isShaking) { // Reusing isShaking state for 'isStable'
                         setIsShaking(true);
                         setShakeStartTime(Date.now());
                     } else {
                         const duration = (Date.now() - shakeStartTime) / 1000;
                         if (duration >= config.duration && !modalVisible) {
                             Vibration.vibrate(500);
                             Alert.alert("Triggered", "Tilt detected!"); // Immediate trigger for this placeholder
                             unsubscribeSensor();
                             setListening(false);
                         }
                     }
                 } else if (isShaking) {
                     setIsShaking(false);
                     setShakeStartTime(null);
                 }
            }
        };
        
        if (config.sensor === 'accelerometer') {
            sensorSubscription.current = Accelerometer.addListener(listener);
            Accelerometer.setUpdateInterval(50);
        } else if (config.sensor === 'gyroscope') {
            sensorSubscription.current = Gyroscope.addListener(listener);
            Gyroscope.setUpdateInterval(100);
        }
        
    }, [listening, activeGestureKey, sensorPermissionGranted, isShaking, shakeStartTime, modalVisible, unsubscribeSensor]);
    
    // Effect to manage sensor subscription lifetime
    useEffect(() => {
        if (listening && activeGestureKey && sensorPermissionGranted) {
            subscribeSensor();
        } else {
            unsubscribeSensor();
        }

        return () => {
            clearInterval(countdownRef.current);
            unsubscribeSensor();
        };
    }, [listening, activeGestureKey, sensorPermissionGranted, subscribeSensor, unsubscribeSensor]);


    // --- 3. COUNTDOWN & SIGNAL LOGIC (Same as before) ---

    const startCountdown = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(5); 

        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    if (!cancelled) {
                        sendDistressSignal();
                    } else {
                        setModalVisible(false);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelCountdown = () => {
        setCancelled(true);
        clearInterval(countdownRef.current);
        setModalVisible(false);
        
        if (listening) { 
            subscribeSensor(); 
        }
        Alert.alert("Cancelled", "Distress alert cancelled.");
    };

    const confirmSend = () => {
        clearInterval(countdownRef.current);
        setCancelled(false); 
        sendDistressSignal();
    };

    const sendDistressSignal = async () => {
        if (sending || !userId) {
             setModalVisible(false);
             return; 
        }

        setModalVisible(false);
        setSending(true);

        try {
            let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            if (locationStatus !== "granted") {
                Alert.alert("Permission Denied", "Location permission is required.");
                setSending(false);
                setListening(false);
                return;
            }
            
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeInterval: 1000,
            });
            const { latitude, longitude } = location.coords;

            const address = await Location.reverseGeocodeAsync({ latitude, longitude });
            const locationString = address[0] ? 
                `${address[0].street || address[0].name}, ${address[0].city || address[0].region}, ${address[0].country}` : 
                `Triggered via ${activeGestureKey}`;

            await axios.post(`${SERVER_URL}/incidents`, {
                Type: `Distress (${activeGestureKey})`,
                Location: locationString,
                Latitude: latitude,
                Longitude: longitude,
                Status: "Pending",
                UserId: userId,
            });

            Alert.alert("🚨 Alert Sent", "Rescuers have been notified!");
            Vibration.vibrate(1000);
            setListening(false); // Stop listening after successful send
        } catch (err) {
            console.error("Error sending distress:", err);
            Alert.alert("Error", "Failed to send distress signal. Check network or server status.");
        }
        setSending(false);
    };

    // --- 4. UI Handlers ---

    const handleGestureSelection = (key) => {
        if (!sensorPermissionGranted) {
             Alert.alert("Permission Denied", "Please grant necessary sensor permissions in settings to activate this feature.");
             return;
        }
        
        const gestureName = GESTURE_CONFIGS[key].name;

        Alert.alert(
            "Set Active Gesture",
            `Do you want to set "${gestureName}" as your active distress gesture?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Set Active", 
                    onPress: () => {
                        saveUserPreference(gestureName);
                        setListening(true);
                    } 
                },
            ]
        );
    };

    // --- 5. UI RENDER ---

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Physical Gesture Setup</Text>
            
            {!userId && (
                 <Text style={[styles.subText, { color: 'red', textAlign: 'center' }]}>
                     Error: User data is missing. Please log in again.
                 </Text>
            )}

            <Text style={styles.activeStatusText}>
                Active Gesture: **{activeGestureKey || 'None Selected'}**
            </Text>
            
            <View style={{ marginVertical: 20 }}>
                {Object.keys(GESTURE_CONFIGS).map((key) => {
                    const config = GESTURE_CONFIGS[key];
                    const isSelected = config.name === activeGestureKey;

                    return (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.option,
                                isSelected && styles.selectedOption,
                            ]}
                            onPress={() => handleGestureSelection(key)}
                            disabled={!sensorPermissionGranted || sending}
                        >
                            <Text style={styles.optionText}>{config.name}</Text>
                            <Text style={styles.subText}>{config.subText}</Text>
                            {isSelected && listening && (
                                <Text style={styles.activeText}>
                                    **Listening for this gesture...**
                                </Text>
                            )}
                            {isSelected && !sensorPermissionGranted && (
                                <Text style={styles.permissionRequired}>
                                    Permission required to activate.
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {listening && (
                <TouchableOpacity
                    style={styles.deactivateButton}
                    onPress={() => setListening(false)}
                    disabled={sending}
                >
                    <Text style={styles.deactivateText}>Stop Listening ({activeGestureKey})</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={sending}
            >
                <Text style={styles.backText}>← Back to Profile</Text>
            </TouchableOpacity>

            {/* Countdown Modal */}
            <Modal transparent visible={modalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>🚨 Distress Alert</Text>
                        <Text style={styles.modalMessage}>
                            Sending help in **{countdown}** seconds...
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
                            <Text style={styles.confirmText}>Send Now (Override Countdown)</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Global Loading Overlay */}
            {sending && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={{ color: "#fff", marginTop: 10, fontSize: 16 }}>Sending alert...</Text>
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
        marginVertical: 10,
        color: "#333",
    },
    activeStatusText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#007BFF',
    },
    option: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    selectedOption: {
        borderColor: "#A83232",
        borderWidth: 2,
        backgroundColor: "#ffeaea",
    },
    optionText: { fontSize: 18, fontWeight: "600", color: "#333" },
    subText: { fontSize: 14, color: "#666", marginTop: 5 },
    activeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#28A745',
        marginTop: 8,
    },
    permissionRequired: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#DC3545',
        marginTop: 8,
    },
    deactivateButton: {
        alignSelf: "center",
        backgroundColor: '#DC3545',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 15,
    },
    deactivateText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    backButton: { alignSelf: "center", marginTop: 30 },
    backText: { fontSize: 16, color: "#A83232" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 15,
        padding: 25,
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#A83232",
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#A83232",
    },
    modalMessage: {
        fontSize: 18,
        marginBottom: 25,
        textAlign: "center",
        color: "#333",
    },
    cancelButton: {
        backgroundColor: "#6C757D",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    cancelText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    confirmButton: {
        backgroundColor: "#A83232",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    confirmText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
});