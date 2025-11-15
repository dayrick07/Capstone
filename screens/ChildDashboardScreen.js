import React, { useState, useContext, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    Linking,
    SafeAreaView,
    Modal,
    Platform,
    StatusBar,
    ScrollView,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import axios from "axios";
import { SERVER_URL } from "../config";

// Unified emergency number
const UNIFIED_EMERGENCY_NUMBER = "tel:911";
const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TRACKING';

// Icons
const icons = {
    police: require("../assets/police.png"),
    hospital: require("../assets/hospital.png"),
    firestation: require("../assets/firestation.png"),
    locationTracker: require("../assets/nearby.png"),
};

// Background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error("Location Task Error:", error);
        return;
    }
    if (data) {
        const { locations } = data;
        const location = locations[0];
        // Optional: send to server automatically if desired
    }
});

export default function ChildDashboardScreen({ navigation, route }) {
    const [menuVisible, setMenuVisible] = useState(false);
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const loggedInChild = route.params?.childData;

    // Start location tracking
    const startLocationTracking = useCallback(async () => {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (fgStatus !== "granted" || bgStatus !== "granted") {
            Alert.alert("Permission Denied", "Foreground & Background location required.");
            return;
        }
        const isTaskRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (!isTaskRunning) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 60000,
                distanceInterval: 10,
                showsBackgroundLocationIndicator: true,
                deferredUpdatesDistance: 10,
                deferredUpdatesTimeout: 60000,
            });
            console.log("✅ Background Location Tracking Started.");
        }
    }, []);

    const stopLocationTracking = useCallback(async () => {
        const isTaskRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (isTaskRunning) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            console.log("🛑 Background Location Tracking Stopped.");
        }
    }, []);

    useEffect(() => {
        if (!loggedInChild) {
            navigation.replace("LoginScreen");
            return;
        }
        startLocationTracking();
        return () => stopLocationTracking();
    }, [loggedInChild]);

    if (!loggedInChild) return null;

    // -------------------- MANUAL LOCATION CHECK-IN --------------------
    const reportManualLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const { coords } = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = coords;

            const response = await axios.post(`${SERVER_URL}/child/report-location`, {
                childId: loggedInChild.Id,
                parentId: loggedInChild.ParentId,
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
            });

            if (response.data.success) {
                Alert.alert("✅ Location Shared", "Sent to your parent successfully.");
            } else {
                Alert.alert("Error", response.data.message || "Failed to share location.");
            }
        } catch (err) {
            console.error("❌ Error reporting location:", err.message);
            Alert.alert("Error", "Failed to contact server.");
        }
    };

    // -------------------- FIRE-AND-FORGET INCIDENT --------------------
    const handleEmergencyFast = async (service) => {
        Alert.alert("✅ Alert Sent", `Your ${service} request is being processed.`);

        // Background API call
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const { coords } = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = coords;

            const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
            const locationText = `${address.name || ""}, ${address.city || ""}, ${address.region || ""}`;

            const payload = {
                Type: service,
                Location: locationText,
                Latitude: latitude,
                Longitude: longitude,
                Status: "Pending",
                ChildId: loggedInChild?.Id,
                UserId: loggedInChild?.ParentId,
            };

            await axios.post(`${SERVER_URL}/incidents`, payload);
            console.log(`[Emergency] ${service} reported in background.`);
        } catch (err) {
            console.error("❌ Emergency reporting failed:", err.message);
        }

        // Open dialer
        const supported = await Linking.canOpenURL(UNIFIED_EMERGENCY_NUMBER);
        if (supported) await Linking.openURL(UNIFIED_EMERGENCY_NUMBER);
    };

    // -------------------- THEME --------------------
    const primaryColor = "#A83232";
    const themeStyles = {
        container: { backgroundColor: isDarkMode ? "#0E0E0E" : "#F4F4F9" },
        card: { backgroundColor: isDarkMode ? "#1C1C1C" : "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
        text: { color: isDarkMode ? "#E0E0E0" : "#333333" },
        menuContainer: { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
        menuText: { color: isDarkMode ? "#fff" : "#333" },
        bigButton: { backgroundColor: primaryColor, shadowColor: primaryColor, shadowOpacity: 0.4 },
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: primaryColor }]}>
            <ScrollView contentContainerStyle={[styles.scrollContent, themeStyles.container]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: primaryColor }]}>
                    <TouchableOpacity onPress={() => setMenuVisible(true)}>
                        <MaterialIcons name="menu" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Child Safety Dashboard</Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 10 }}>
                            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate("UserPageScreen", { userData: loggedInChild })}>
                            <MaterialIcons name="account-circle" size={30} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Primary Emergency Button */}
                <View style={styles.primaryButtonContainer}>
                    <TouchableOpacity
                        style={[styles.bigButton, themeStyles.bigButton]}
                        onPress={() => {
                            Alert.alert(
                                "🚨 Emergency Report",
                                "Select the service needed. We will notify the system and dial 911.",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Police", onPress: () => handleEmergencyFast("Police") },
                                    { text: "Fire Station", onPress: () => handleEmergencyFast("Fire Station") },
                                    { text: "Ambulance", onPress: () => handleEmergencyFast("Ambulance") },
                                ]
                            );
                        }}
                    >
                        <Ionicons name="warning-outline" size={60} color="#fff" />
                        <Text style={styles.bigButtonText}>EMERGENCY</Text>
                        <Text style={styles.bigButtonSubtitle}>TAP for immediate assistance</Text>
                    </TouchableOpacity>
                </View>

                {/* Dashboard Buttons */}
                <View style={styles.grid}>
                    <TouchableOpacity style={[styles.card, styles.emergencyCard, themeStyles.card]} onPress={() => handleEmergencyFast("Police")}>
                        <Image source={icons.police} style={styles.largeIcon} />
                        <Text style={[styles.largeLabel, themeStyles.text]}>Police</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.card, styles.emergencyCard, themeStyles.card]} onPress={() => handleEmergencyFast("Ambulance")}>
                        <Image source={icons.hospital} style={styles.largeIcon} />
                        <Text style={[styles.largeLabel, themeStyles.text]}>Ambulance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.card, styles.emergencyCard, themeStyles.card]} onPress={() => handleEmergencyFast("Fire Station")}>
                        <Image source={icons.firestation} style={styles.largeIcon} />
                        <Text style={[styles.largeLabel, themeStyles.text]}>Fire Station</Text>
                    </TouchableOpacity>

                    {/* Manual Check-in */}
                    <TouchableOpacity style={[styles.card, styles.fullWidthCard, themeStyles.card]} onPress={reportManualLocation}>
                        <Ionicons name="location-sharp" size={40} color={isDarkMode ? "#E0E0E0" : primaryColor} />
                        <Text style={[styles.label, themeStyles.text, { fontWeight: 'bold', fontSize: 16 }]}>Manual Location Check-in</Text>
                        <Text style={[styles.label, themeStyles.text, { fontSize: 10, opacity: 0.7 }]}>
                            Tap here to immediately send your location to your parent.
                        </Text>
                        <Text style={[styles.label, themeStyles.text, { fontSize: 10, opacity: 0.5, marginTop: 5 }]}>
                            (Automatic background tracking is active.)
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Menu */}
                <Modal animationType="slide" transparent visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setMenuVisible(false)}>
                        <View style={[styles.menuContainer, themeStyles.menuContainer]} onStartShouldSetResponder={() => true}>
                            <Text style={[styles.menuTitle, themeStyles.menuText]}>Menu</Text>
                            <TouchableOpacity
                                style={[styles.menuItem, { marginTop: 20 }]}
                                onPress={() => {
                                    setMenuVisible(false);
                                    stopLocationTracking();
                                    navigation.replace("LoginScreen");
                                }}
                            >
                                <Text style={[styles.menuText, { color: "red", fontWeight: 'bold' }]}>➡️ Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
    safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
    scrollContent: { paddingBottom: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12 },
    headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
    headerRight: { flexDirection: "row", alignItems: "center" },
    primaryButtonContainer: { alignItems: "center", marginVertical: 20 },
    bigButton: { width: 220, height: 220, borderRadius: 110, justifyContent: "center", alignItems: "center", elevation: 10 },
    bigButtonText: { color: "#fff", fontSize: 28, fontWeight: "bold", marginTop: 5 },
    bigButtonSubtitle: { color: "#fff", fontSize: 12, marginTop: 2, opacity: 0.8 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", paddingHorizontal: 5, marginVertical: 10 },
    card: { borderRadius: 15, justifyContent: "center", alignItems: "center", marginBottom: 15, padding: 10 },
    emergencyCard: { width: "30%", height: 100 },
    fullWidthCard: { width: "95%", height: 120, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 15 },
    icon: { width: 40, height: 40, marginBottom: 5, resizeMode: "contain" },
    largeIcon: { width: 50, height: 50, marginBottom: 5, resizeMode: "contain" },
    label: { fontSize: 14, fontWeight: "600", textAlign: "center" },
    largeLabel: { fontSize: 14, fontWeight: "bold", textAlign: "center" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-start" },
    menuContainer: { width: "75%", padding: 20, height: "100%", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 50 },
    menuTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 5 },
    menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
    menuText: { fontSize: 16 },
});
