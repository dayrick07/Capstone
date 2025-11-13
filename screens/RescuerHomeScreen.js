// RescuerHomeScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Linking, // 👈 NEW IMPORT for phone calls
} from "react-native";
import axios from "axios";

// NOTE: You must replace this with your actual SERVER_URL config/import
const SERVER_URL = "http://192.168.0.111:3000";

// Utility function to format the timestamp
const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
        const date = new Date(timestamp);
        return date.toLocaleString();
    } catch (e) {
        return "Invalid Date";
    }
};

// --- CONSTANTS FOR FILTERS & COLORS ---
const INCIDENT_TYPES = [ 
    "Police",
    "Fire Station",
    "Ambulance",
];

// Color map for card borders and text based on status/assignment
const STATUS_FALLBACK_COLORS = {
    'Pending': '#FFC107', 
    'Accepted': '#28A745', 
    'Critical': '#DC3545', 
    'High': '#FFC107',
    'Medium': '#007BFF', 
    'Low': '#6C757D',
};
// -----------------------------

export default function RescuerHomeScreen({ navigation, route }) {
    const rescuerData = route.params?.rescuerData; 

    const [isRescuerActive, setIsRescuerActive] = useState(rescuerData?.IsActive === true);
    const [statusChanging, setStatusChanging] = useState(false); 

    if (!rescuerData) {
        Alert.alert("Error", "No rescuer data found. Returning to login.");
        navigation.replace("LoginScreen");
        return null;
    }
    const rawId = rescuerData.Id || rescuerData.id;
    const numericRescuerId = Number(rawId);

    if (isNaN(numericRescuerId) || numericRescuerId === 0) {
        console.error("Invalid Rescuer ID detected:", rawId);
        Alert.alert("Error", "Rescuer ID is invalid. Please log in again.");
        return <View style={styles.loadingContainer}><Text>Error loading user ID.</Text></View>;
    }

    const [allIncidents, setAllIncidents] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState([]); 
    
    const applyFilters = useCallback((incidentsToFilter) => {
        let filteredList = incidentsToFilter;

        if (selectedTypes.length > 0) {
            filteredList = filteredList.filter(incident => 
                selectedTypes.includes(incident.Type)
            );
        }
        
        return filteredList;
    }, [selectedTypes]); 

    const incidents = applyFilters(allIncidents);


    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${SERVER_URL}/incidents`);
            if (response.data.success) {
                
                const activeIncidents = response.data.incidents.filter(
                    (i) => i.Status !== "Resolved" 
                );

                const sortedIncidents = activeIncidents.sort(
                    (a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt)
                );

                setAllIncidents(sortedIncidents); 
            }
        } catch (err) {
            console.error("❌ Fetch Incidents Error:", err.message);
            Alert.alert("Error", "Cannot fetch incidents from server.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchIncidents();
        });
        return unsubscribe;
    }, [navigation, fetchIncidents]);

    // --- HANDLER FOR PHONE CALL ---
    const handleCall = async (contactNumber) => {
        if (!contactNumber) {
            Alert.alert("Error", "Contact number is not available for this incident.");
            return;
        }

        const url = `tel:${contactNumber}`;
        
        // Check if the device can open the phone dialer
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", `Cannot open the dialer. Please manually call: ${contactNumber}`);
        }
    };
    // --- END HANDLER FOR PHONE CALL ---

    // --- OTHER HANDLERS (omitted for brevity) ---
    const handleTypeSelect = (type) => {
        setSelectedTypes(prevSelectedTypes => {
            if (prevSelectedTypes.includes(type)) {
                return prevSelectedTypes.filter(t => t !== type);
            } else {
                return [...prevSelectedTypes, type];
            }
        });
    };

    const handleViewOnMap = (incident) => {
        if (!incident.Latitude || !incident.Longitude) {
            Alert.alert("No Location Data", "This incident has no valid coordinates.");
            return;
        }
        navigation.navigate("IncidentMapScreen", { incident });
    };

    const updateStatus = async (incidentId, newStatus) => {
        if (isNaN(numericRescuerId) || numericRescuerId === 0) {
            Alert.alert("Error", "Cannot update status: Rescuer ID is missing or invalid.");
            return;
        }
        
        try {
            const response = await axios.put(`${SERVER_URL}/incidents/${incidentId}/status`, {
                status: newStatus,
                rescuerId: numericRescuerId 
            });

            if (response.data.success) {
                if (newStatus !== 'Resolved') { 
                    Alert.alert("Success", `Incident status changed to ${newStatus}`);
                }
                fetchIncidents(); 
            } else {
                Alert.alert("Error", "Failed to update incident status.");
            }
        } catch (err) {
            console.error("❌ Update Status Network Error:", err.message);
            Alert.alert("Error", "Failed to update incident status. Check server console for errors.");
        }
    };
    
    const toggleRescuerStatus = async () => {
        setStatusChanging(true);
        const newStatus = !isRescuerActive; 
        
        try {
            const response = await axios.put(`${SERVER_URL}/rescuers/${numericRescuerId}/status`, {
                isActive: newStatus,
            });

            if (response.data.success) {
                setIsRescuerActive(newStatus); 
                Alert.alert("Status Updated", `You are now ${newStatus ? 'Active' : 'Offline'}.`);
            } else {
                Alert.alert("Error", response.data.message || "Failed to update status.");
            }
        } catch (err) {
            console.error("❌ Rescuer Status Update Error:", err.message);
            Alert.alert("Error", "Network error while updating status.");
        } finally {
            setStatusChanging(false);
        }
    };
    // --- END OTHER HANDLERS ---


    // --- RENDER INCIDENT CARD (UPDATED) ---
    const renderIncidentCard = ({ item }) => {
        const assignedRescuerId = item.RescuerId;
        const isAssignedToMe = assignedRescuerId === numericRescuerId;
        const isPending = item.Status === 'Pending';
        const isAcceptedByMe = isAssignedToMe && item.Status === 'Accepted'; 

        let borderStyle = styles.cardPending; 

        if (item.Priority && STATUS_FALLBACK_COLORS[item.Priority]) {
            borderStyle = { borderLeftColor: STATUS_FALLBACK_COLORS[item.Priority] };
        } else if (isAssignedToMe) {
            borderStyle = styles.cardAssigned; 
        }

        const cardStyle = [
            styles.card,
            borderStyle
        ];

        return (
            <View style={cardStyle}>
                <Text style={styles.title}>{item.Type}</Text>
                <Text>⭐ Priority: **{item.Priority || 'N/A'}**</Text> 
                <Text>📍 {item.Location}</Text>
                <Text style={styles.timestamp}>
                    Reported: {formatTimestamp(item.CreatedAt)}
                </Text>
                {/* Display Sender Contact if available */}
                {item.SenderContact && (
                    <Text>📞 Sender: **{item.SenderContact}**</Text>
                )}
                <Text style={[styles.statusText, {color: isAssignedToMe ? STATUS_FALLBACK_COLORS.Accepted : '#8B0000'}]}>
                    Status: **{item.Status}** {assignedRescuerId ? ` (Assigned ID: ${assignedRescuerId})` : ''}
                </Text>
                
                {/* Map and Call Buttons in a separate row */}
                <View style={styles.topActions}> 
                    {/* View on Map Button */}
                    <TouchableOpacity
                        style={[styles.button, styles.buttonMap]} 
                        onPress={() => handleViewOnMap(item)}
                    >
                        <Text style={styles.buttonText}>🗺️ View on Map</Text>
                    </TouchableOpacity>

                    {/* CALL SENDER BUTTON (New) */}
                    {item.SenderContact && (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCall]} 
                            onPress={() => handleCall(item.SenderContact)}
                        >
                            <Text style={styles.buttonText}>📞 Call Sender</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Accept/Done buttons Row */}
                <View style={styles.actions}>
                    
                    {/* 2. Accept Button (Visible if Pending and NOT assigned) */}
                    {isPending && !assignedRescuerId && (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonAction, styles.buttonAccept]} 
                            onPress={() => updateStatus(item.Id, 'Accepted')} 
                        >
                            <Text style={styles.buttonText}>Accept Dispatch</Text>
                        </TouchableOpacity>
                    )}
                    
                    {/* 3. Mark Resolved Button (Visible if Accepted AND assigned to me) */}
                    {isAcceptedByMe && (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonAction, styles.buttonResolved]} 
                            onPress={() => 
                                Alert.alert("Confirm Resolution", "Mark this incident as Resolved?", [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Yes", onPress: () => updateStatus(item.Id, 'Resolved') }, 
                                ])
                            }
                        >
                            <Text style={styles.buttonText}>Mark Resolved</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* Helper text for assignment */}
                {isPending && assignedRescuerId && assignedRescuerId !== numericRescuerId && (
                    <Text style={styles.assignedNote}>⚠️ Already assigned to another rescuer.</Text>
                )}
            </View>
        );
    };
    // --- END RENDER INCIDENT CARD (UPDATED) ---

    return (
        <View style={styles.container}>
            <Text style={styles.header}>🚨 Active Incidents</Text>

            {/* --- ACTIVE/OFFLINE TOGGLE BUTTON --- */}
            <TouchableOpacity 
                style={[styles.statusToggle, isRescuerActive ? styles.statusActive : styles.statusOffline]} 
                onPress={toggleRescuerStatus}
                disabled={statusChanging}
            >
                {statusChanging ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.statusToggleText}>
                        Status: **{isRescuerActive ? 'Active' : 'Offline'}**
                    </Text>
                )}
            </TouchableOpacity>
            {/* --------------------------------------- */}

            <ScrollView contentContainerStyle={styles.filtersWrapper}>
                
                {/* --- INCIDENT TYPE FILTER UI SECTION --- */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Filter by Type:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                        {INCIDENT_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.filterButton,
                                    selectedTypes.includes(type) && styles.filterButtonActive
                                ]}
                                onPress={() => handleTypeSelect(type)}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    selectedTypes.includes(type) && styles.filterButtonTextActive
                                ]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                {/* ----------------------------- */}
            </ScrollView>

            <FlatList
                data={incidents}
                keyExtractor={(item) => item.Id.toString()}
                refreshing={loading}
                onRefresh={fetchIncidents}
                renderItem={renderIncidentCard}
                ListEmptyComponent={() => (
                    !loading && <Text style={styles.noIncidents}>No active incidents matching your filters.</Text>
                )}
            />

            {/* Footer Buttons */}
            <TouchableOpacity
                style={styles.historyButton}
                onPress={() =>
                    navigation.navigate("RescuerHistoryScreen", {
                        rescuerId: numericRescuerId, 
                        rescuerName: rescuerData.Name
                    })
                }
            >
                <Text style={styles.historyText}>📚 My Past Dispatches</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={styles.profileButton}
                onPress={() =>
                    navigation.navigate("RescuerPageScreen", {
                        rescuerData: rescuerData,
                    })
                }
            >
                <Text style={styles.profileText}>👤 View Profile</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: "#fff" },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#8B0000",
        textAlign: "center",
    },
    // --- STATUS TOGGLE STYLES ---
    statusToggle: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
    },
    statusActive: {
        backgroundColor: '#28A745', 
        borderColor: '#1E7E34',
    },
    statusOffline: {
        backgroundColor: '#DC3545', 
        borderColor: '#C82333',
    },
    statusToggleText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // --- END STATUS TOGGLE STYLES ---

    filtersWrapper: {
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    
    // Card styles 
    card: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderColor: "#ddd",
    },
    cardPending: { 
        borderLeftColor: STATUS_FALLBACK_COLORS['Pending'], 
    },
    cardAssigned: { 
        borderLeftColor: STATUS_FALLBACK_COLORS['Accepted'], 
        backgroundColor: "#e8f5e9",
    },
    title: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
    timestamp: { fontSize: 12, color: "#666", marginBottom: 5 },
    statusText: { fontSize: 14, fontWeight: '600', color: '#8B0000', marginTop: 5 },
    assignedNote: { fontSize: 12, color: '#dc3545', marginTop: 5, fontStyle: 'italic' },
    
    // BUTTON STYLES
    topActions: {
        flexDirection: "row",
        justifyContent: "space-between", 
        marginTop: 10,
        gap: 10,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end", 
        marginTop: 10,
        gap: 10, 
    },
    button: {
        padding: 10,
        borderRadius: 8,
        minHeight: 40,
    },
    buttonMap: { 
        backgroundColor: "#007bff",
        flex: 1, // Takes up half the row
    },
    buttonCall: { 
        backgroundColor: "#FFA500", // Orange for Call
        flex: 1, // Takes up half the row
    },
    buttonAction: {
        flex: 1,
    },
    buttonAccept: { 
        backgroundColor: "#28aa45", 
    },
    buttonResolved: { 
        backgroundColor: "#A83232", 
    },
    buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 13 },

    // --- FILTER STYLES ---
    filterContainer: {
        marginBottom: 10,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    scrollContainer: {
        flexDirection: 'row',
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    filterButtonActive: {
        backgroundColor: '#007bff', 
        borderColor: '#007bff',
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
    },
    filterButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    noIncidents: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    // --- END FILTER STYLES ---

    // FOOTER BUTTONS
    historyButton: {
        backgroundColor: "#007bff", 
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    historyText: { 
        color: "#fff", 
        fontSize: 16, 
        fontWeight: "bold" 
    },
    profileButton: {
        backgroundColor: "#8B0000",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    profileText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});