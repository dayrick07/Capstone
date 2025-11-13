import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";
import { SERVER_URL } from "../config"; 

// Initial region for the map (defaulting to a city like San Fernando, Pampanga)
const INITIAL_REGION = {
    latitude: 15.021, 
    longitude: 120.697, 
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

export default function ParentChildLocationScreen({ route, navigation }) {
    // childId and childName passed from the Parent Dashboard
    const { childId, childName } = route.params; 
    const { isDarkMode } = useContext(ThemeContext);

    // State to hold the child's last known location
    const [childLocation, setChildLocation] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [mapRegion, setMapRegion] = useState(INITIAL_REGION);

    // Dynamic styles based on theme
    const primaryColor = "#A83232";
    const themeStyles = {
        container: {
            backgroundColor: isDarkMode ? "#0E0E0E" : "#F4F4F9",
        },
        text: { color: isDarkMode ? "#E0E0E0" : "#333333" },
    };

    // ---------------- FETCH LOCATION FROM SERVER ----------------
    const fetchChildLocation = useCallback(async () => {
        setIsLoading(true);
        try {
            // New backend route to fetch a child's latest location by ID
            const response = await axios.get(`${SERVER_URL}/child/location/${childId}`);

            if (response.data.success && response.data.location) {
                const { CurrentLatitude, CurrentLongitude } = response.data.location;
                
                if (CurrentLatitude && CurrentLongitude) {
                    const newLocation = { 
                        latitude: CurrentLatitude, 
                        longitude: CurrentLongitude 
                    };

                    setChildLocation(newLocation);
                    // Update map view to center on the child's location
                    setMapRegion({
                        ...newLocation,
                        latitudeDelta: 0.01, // Zoomed in view
                        longitudeDelta: 0.01,
                    });
                } else {
                    setChildLocation(null);
                    Alert.alert("No Location Data", `${childName} has not reported their location yet.`);
                }
            } else {
                Alert.alert("Error", response.data.message || "Failed to fetch location data.");
            }
        } catch (err) {
            console.error("❌ Error fetching child location:", err.message);
            Alert.alert("Network Error", "Could not connect to the server to fetch location.");
        } finally {
            setIsLoading(false);
        }
    }, [childId, childName]);

    useEffect(() => {
        // Fetch location immediately on mount
        fetchChildLocation();

        // Set up a refresh interval (e.g., every 30 seconds)
        const interval = setInterval(fetchChildLocation, 30000); 

        // Cleanup function
        return () => clearInterval(interval);
    }, [fetchChildLocation]);

    return (
        <SafeAreaView style={[styles.safeArea, themeStyles.container]}>
            <View style={[styles.header, { backgroundColor: primaryColor }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Locating: {childName}</Text>
                <TouchableOpacity onPress={fetchChildLocation} style={styles.refreshButton}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Ionicons name="refresh" size={24} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
                {isLoading && !childLocation ? (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={primaryColor} />
                        <Text style={[themeStyles.text, { marginTop: 10 }]}>Loading location...</Text>
                    </View>
                ) : (
                    <MapView
                        style={styles.map}
                        provider={MapView.PROVIDER_GOOGLE}
                        initialRegion={INITIAL_REGION}
                        region={mapRegion}
                        // Remove onRegionChange to prevent map jitter during fetch
                    >
                        {/* The Marker shows the child's last known location */}
                        {childLocation && (
                            <Marker
                                coordinate={childLocation}
                                title={`${childName}'s Last Location`}
                                description={`Reported at: ${new Date().toLocaleTimeString()}`}
                                pinColor={primaryColor} // Custom pin color
                            />
                        )}
                    </MapView>
                )}
            </View>

            {/* Status Footer */}
            <View style={[styles.footer, themeStyles.container]}>
                <Text style={[themeStyles.text, styles.footerText]}>
                    Status: {childLocation ? `Active Tracking` : `Location Not Found`}
                </Text>
                <Text style={[themeStyles.text, styles.footerTime]}>
                    Last Update: {childLocation ? new Date().toLocaleTimeString() : 'N/A'}
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
    },
    refreshButton: {
        padding: 5,
    },
    mapContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        ...StyleSheet.absoluteFillObject,
        zIndex: 10, // Ensure it's above the map
    },
    footer: {
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    footerTime: {
        fontSize: 12,
        opacity: 0.8,
    },
});