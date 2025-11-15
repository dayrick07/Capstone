// RescuerHomeScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text, 
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert, // <-- Used for confirmation dialogs
    ActivityIndicator,
    ScrollView,
    Linking,
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

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
    'Resolved': '#343A40', // Color for resolved incidents
    'Critical': '#DC3545',
    'High': '#FFC107',
    'Medium': '#007BFF',
    'Low': '#6C757D',
};

// Barangays of San Fernando, Pampanga 
const BARANGAYS = [
    "Bulaon", "Calulut", "Del Pilar", "Del Rosario", "Dolores", "Guagua", "Lara",
    "Magliman", "Malpitic", "Maimpis", "Santo Rosario", "San Isidro", "San Jose",
    "San Nicolas", "Sindalan", "Sta Lucia", "Sta Teresita", "San Juan", "San Agustin"
];

export default function RescuerHomeScreen({ navigation, route }) {
    const rescuerData = route.params?.rescuerData;

    const [isRescuerActive, setIsRescuerActive] = useState(rescuerData?.IsActive === true);
    const [statusChanging, setStatusChanging] = useState(false);
    const [sortOrder, setSortOrder] = useState('descending'); // 'descending' (Newest) or 'ascending' (Oldest)

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

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'descending' ? 'ascending' : 'descending');
    };

    const applyFilters = (incidentsToFilter) => {
        let filteredList = incidentsToFilter;

        // 1. Filter by Type
        if (selectedTypes.length > 0) {
            filteredList = filteredList.filter(incident =>
                selectedTypes.includes(incident.Type)
            );
        }
        
        // 2. Apply sorting logic 
        return filteredList.sort((a, b) => {
            const dateA = new Date(a.CreatedAt);
            const dateB = new Date(b.CreatedAt);

            if (sortOrder === 'descending') {
                return dateB - dateA; // Newest first
            } else {
                return dateA - dateB; // Oldest first
            }
        });

    }; 

    const incidents = applyFilters(allIncidents);


    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${SERVER_URL}/incidents`);
            if (response.data.success) {
                
                // CRITICAL CHANGE: Set ALL incidents, including Resolved ones
                setAllIncidents(response.data.incidents);
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

        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", `Cannot open the dialer. Please manually call: ${contactNumber}`);
        }
    };

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

    const renderIncidentCard = ({ item }) => {
        const assignedRescuerId = item.RescuerId;
        const isAssignedToMe = assignedRescuerId === numericRescuerId;
        const isPending = item.Status === 'Pending';
        const isResolved = item.Status === 'Resolved';
        const isAcceptedByMe = isAssignedToMe && item.Status === 'Accepted';

        let borderStyle = styles.cardPending;

        if (isResolved) {
            borderStyle = styles.cardResolved;
        } else if (item.Priority && STATUS_FALLBACK_COLORS[item.Priority]) {
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
                {item.SenderContact && (
                    <Text>📞 Sender: **{item.SenderContact}**</Text>
                )}
                <Text style={[styles.statusText, {color: isResolved ? STATUS_FALLBACK_COLORS.Resolved : (isAssignedToMe ? STATUS_FALLBACK_COLORS.Accepted : '#8B0000')}]}>
                    Status: **{item.Status}** {assignedRescuerId ? ` (Assigned ID: ${assignedRescuerId})` : ''}
                </Text>

                <View style={styles.topActions}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonMap]}
                        onPress={() => handleViewOnMap(item)}
                    >
                        <Text style={styles.buttonText}>🗺️ View on Map</Text>
                    </TouchableOpacity>

                    {item.SenderContact && (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCall]}
                            onPress={() => handleCall(item.SenderContact)}
                        >
                            <Text style={styles.buttonText}>📞 Call Sender</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Hide action buttons for resolved incidents */}
                {!isResolved && (
                    <View style={styles.actions}>
                        {isPending && !assignedRescuerId && (
                            <TouchableOpacity
                                style={[styles.button, styles.buttonAction, styles.buttonAccept]}
                                onPress={() =>
                                    // CONFIRMATION FOR ACCEPT
                                    Alert.alert("Confirm Acceptance", "Do you want to accept this dispatch?", [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Accept", onPress: () => updateStatus(item.Id, 'Accepted') },
                                    ])
                                }
                            >
                                <Text style={styles.buttonText}>Accept Dispatch</Text>
                            </TouchableOpacity>
                        )}

                        {isAcceptedByMe && (
                            <TouchableOpacity
                                style={[styles.button, styles.buttonAction, styles.buttonResolved]}
                                onPress={() =>
                                    // CONFIRMATION FOR RESOLVED
                                    Alert.alert("Confirm Resolution", "Mark this incident as Resolved? This action cannot be undone.", [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Mark Resolved", onPress: () => updateStatus(item.Id, 'Resolved') },
                                    ])
                                }
                            >
                                <Text style={styles.buttonText}>Mark Resolved</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {isPending && assignedRescuerId && assignedRescuerId !== numericRescuerId && (
                    <Text style={styles.assignedNote}>⚠️ Already assigned to another rescuer.</Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>🚨 All Incidents (Active & Resolved)</Text>

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

            {/* --- SORT TOGGLE BUTTON --- */}
            <TouchableOpacity
                style={styles.sortToggle}
                onPress={toggleSortOrder}
            >
                <Text style={styles.sortToggleText}>
                    Sort Order: **{sortOrder === 'descending' ? '⬇️ Newest First' : '⬆️ Oldest First'}**
                </Text>
            </TouchableOpacity>
            {/* --------------------------- */}


            <ScrollView contentContainerStyle={styles.filtersWrapper}>

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
                
            </ScrollView>

            <FlatList
                data={incidents}
                keyExtractor={(item) => item.Id.toString()}
                refreshing={loading}
                onRefresh={fetchIncidents}
                renderItem={renderIncidentCard}
                ListEmptyComponent={() => (
                    !loading && <Text style={styles.noIncidents}>No incidents matching your filters.</Text>
                )}
            />

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
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingTop: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 10,
        color: '#333',
    },
    statusToggle: {
        padding: 10,
        marginHorizontal: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 8,
    },
    statusActive: {
        backgroundColor: '#28A745',
    },
    statusOffline: {
        backgroundColor: '#DC3545',
    },
    statusToggleText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sortToggle: { 
        padding: 8,
        marginHorizontal: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#007BFF', 
    },
    sortToggleText: { 
        color: '#fff',
        fontWeight: 'bold',
    },
    filtersWrapper: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    filterContainer: {
        marginBottom: 10,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#555',
    },
    scrollContainer: {
        flexDirection: 'row',
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#007BFF',
        marginRight: 10,
        backgroundColor: '#fff',
    },
    filterButtonActive: {
        backgroundColor: '#007BFF',
    },
    filterButtonText: {
        color: '#007BFF',
        fontSize: 14,
    },
    filterButtonTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 15,
        borderRadius: 8,
        borderLeftWidth: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    cardPending: {
        borderLeftColor: '#FFC107',
    },
    cardAssigned: {
        borderLeftColor: '#28A745',
    },
    cardResolved: {
        borderLeftColor: '#343A40', // Dark grey for resolved
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        marginBottom: 8,
    },
    statusText: {
        fontWeight: 'bold',
        marginTop: 5,
        fontSize: 14,
    },
    topActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 10,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 10,
        flex: 1,
    },
    buttonMap: {
        backgroundColor: '#007BFF',
    },
    buttonCall: {
        backgroundColor: '#6C757D',
    },
    buttonAction: {
        flex: 1,
        marginRight: 10,
    },
    buttonAccept: {
        backgroundColor: '#28A745',
    },
    buttonResolved: {
        backgroundColor: '#DC3545',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    assignedNote: {
        color: '#DC3545',
        marginTop: 10,
        fontStyle: 'italic',
        fontSize: 12,
    },
    noIncidents: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    profileButton: {
        position: 'absolute',
        bottom: 10, 
        right: 15,
        backgroundColor: '#6C757D',
        padding: 12,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    profileText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});