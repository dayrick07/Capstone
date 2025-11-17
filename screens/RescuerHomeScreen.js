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
    SafeAreaView, // Added for better screen layout
} from "react-native";
import axios from "axios";
import { SERVER_URL } from "../config";

// Utility function to format the timestamp
const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
        const date = new Date(timestamp);
        // Use a more compact, high-contrast date format
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + 
               date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

// Color map for status/priority - Updated for dark theme contrast
const STATUS_FALLBACK_COLORS = {
    // Priority Colors (Used for Highlighting Cards)
    'Critical': '#FF4D6D', // Sharp Red/Pink for high urgency
    'High': '#FFC300',     // Amber for immediate attention
    'Medium': '#4CC9F0',   // Electric Blue for standard response
    'Low': '#8D99AE',      // Muted Grey for lower urgency

    // Status Colors (Used for text and assignments)
    'Pending': '#FFC300',  // Amber
    'Accepted': '#70E000', // Bright Green
    'Resolved': '#3A3A5A', // Darker background color for resolved text
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
        return <View style={styles.loadingContainer}><Text style={styles.textBase}>Error loading user ID.</Text></View>;
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

        // Determine border color based on Priority or Status
        let borderColor = STATUS_FALLBACK_COLORS.Low; // Default
        let priorityText = item.Priority || 'N/A';

        if (isResolved) {
            // Resolved cards use a dedicated color/style
            borderColor = STATUS_FALLBACK_COLORS.Resolved;
        } else if (item.Priority) {
            borderColor = STATUS_FALLBACK_COLORS[item.Priority] || STATUS_FALLBACK_COLORS.High;
        }
        
        // Overrides for self-assigned incidents for immediate visibility
        if (isAcceptedByMe) {
             borderColor = STATUS_FALLBACK_COLORS.Accepted;
        }


        const cardStyle = [
            styles.card,
            { borderLeftColor: borderColor, borderLeftWidth: isResolved ? 5 : 8, opacity: isResolved ? 0.7 : 1 },
        ];
        
        const statusColor = isResolved 
            ? STATUS_FALLBACK_COLORS.Resolved 
            : (isAssignedToMe ? STATUS_FALLBACK_COLORS.Accepted : STATUS_FALLBACK_COLORS.Critical);


        return (
            <View style={cardStyle}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.Type}</Text>
                    <Text style={[styles.priorityBadge, { backgroundColor: borderColor }]}>
                        {priorityText}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.textBase}>📍 Location: **{item.Location}**</Text>
                    <Text style={styles.timestamp}>
                        {formatTimestamp(item.CreatedAt)}
                    </Text>
                </View>

                {item.SenderContact && (
                    <Text style={styles.textBase}>📞 Sender: **{item.SenderContact}**</Text>
                )}
                
                <Text style={[styles.statusText, {color: statusColor}]}>
                    Status: **{item.Status}** {assignedRescuerId ? ` (Assigned ID: ${assignedRescuerId})` : ''}
                </Text>

                <View style={styles.topActions}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonMap]}
                        onPress={() => handleViewOnMap(item)}
                    >
                        <Text style={styles.buttonText}>🗺️ Map</Text>
                    </TouchableOpacity>

                    {item.SenderContact && (
                        <TouchableOpacity
                            style={[styles.button, styles.buttonCall]}
                            onPress={() => handleCall(item.SenderContact)}
                        >
                            <Text style={styles.buttonText}>📞 Call</Text>
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
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>SF-PAMPANGA 🚨 INCIDENTS</Text>

            {/* Rescuer Status Toggle */}
            <TouchableOpacity
                style={[styles.statusToggle, isRescuerActive ? styles.statusActive : styles.statusOffline]}
                onPress={toggleRescuerStatus}
                disabled={statusChanging}
            >
                {statusChanging ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.statusToggleText}>
                        STATUS: **{isRescuerActive ? 'ACTIVE' : 'OFFLINE'}**
                    </Text>
                )}
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.filtersWrapper} horizontal={false}>
                {/* SORT TOGGLE BUTTON */}
                <TouchableOpacity
                    style={styles.sortToggle}
                    onPress={toggleSortOrder}
                >
                    <Text style={styles.sortToggleText}>
                        {sortOrder === 'descending' ? '⬇️ SORT: Newest First' : '⬆️ SORT: Oldest First'}
                    </Text>
                </TouchableOpacity>
                {/* --------------------------- */}
                
                {/* Filter by Type */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Filter by Service:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                        {INCIDENT_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.filterButton,
                                    selectedTypes.includes(type) ? styles.filterButtonActive : styles.filterButtonInactive
                                ]}
                                onPress={() => handleTypeSelect(type)}
                            >
                                <Text style={styles.filterButtonText}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                
            </ScrollView>

            <FlatList
                data={incidents}
                keyExtractor={(item) => (item.Id || item.id).toString()}
                refreshing={loading}
                onRefresh={fetchIncidents}
                renderItem={renderIncidentCard}
                contentContainerStyle={styles.flatListContent}
                ListEmptyComponent={() => (
                    !loading && <Text style={styles.noIncidents}>No incidents matching your filters.</Text>
                )}
            />

            {/* Floating Action Button (FAB) for Profile */}
            <TouchableOpacity
                style={styles.profileFab}
                onPress={() =>
                    navigation.navigate("RescuerPageScreen", {
                        rescuerData: rescuerData,
                    })
                }
            >
                <Text style={styles.profileFabText}>👤</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // --- BASE STYLES ---
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E', // Dark, high-tech background
    },
    textBase: {
        color: '#E0E0E0', // Light text color
        fontSize: 14,
        marginBottom: 3,
    },
    header: {
        fontSize: 26,
        fontWeight: '900',
        textAlign: 'center',
        marginVertical: 15,
        color: '#FFFFFF', // White header
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 5,
    },

    // --- STATUS TOGGLE ---
    statusToggle: {
        padding: 12,
        marginHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
        // Added shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    statusActive: {
        backgroundColor: '#70E000', // Bright Green
    },
    statusOffline: {
        backgroundColor: '#DC3545', // Sharp Red
    },
    statusToggleText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // --- SORT & FILTER ---
    sortToggle: { 
        padding: 10,
        marginHorizontal: 0,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#3A3A5A', // Muted dark blue
    },
    sortToggleText: { 
        color: '#4CC9F0', // Electric blue for emphasis
        fontWeight: 'bold',
    },
    filtersWrapper: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    filterContainer: {
        marginBottom: 15,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#FFD166', // Accent color for labels
    },
    scrollContainer: {
        flexDirection: 'row',
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 2,
    },
    filterButtonActive: {
        borderColor: '#70E000', // Active Green border
        backgroundColor: 'rgba(112, 224, 0, 0.2)', // Light green translucent background
    },
    filterButtonInactive: {
        borderColor: '#555577', // Muted border
        backgroundColor: '#2A2A4A',
    },
    filterButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },

    // --- CARD STYLES ---
    flatListContent: {
        paddingBottom: 100, // Space for FAB
    },
    card: {
        backgroundColor: '#2A2A4A', // Dark card background
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 15,
        borderRadius: 12,
        borderLeftWidth: 8, // Width controlled inline
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF', // White title
    },
    priorityBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 15,
        color: '#1A1A2E', // Dark text on bright badge
        fontWeight: 'bold',
        fontSize: 12,
        overflow: 'hidden', // Ensures border radius works on text
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    timestamp: {
        fontSize: 12,
        color: '#FFD166', // Amber time color
        fontWeight: '500',
    },
    statusText: {
        fontWeight: '900',
        marginTop: 8,
        fontSize: 15,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#3A3A5A',
    },
    
    // --- ACTION BUTTONS ---
    topActions: {
        flexDirection: 'row',
        marginTop: 15,
        marginBottom: 5,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    buttonMap: {
        backgroundColor: '#4CC9F0', // Electric Blue
        marginRight: 10,
    },
    buttonCall: {
        backgroundColor: '#FF4D6D', // Sharp Red/Pink
    },
    buttonAction: {
        flex: 1,
        marginRight: 10,
    },
    buttonAccept: {
        backgroundColor: '#70E000', // Bright Green
    },
    buttonResolved: {
        backgroundColor: '#3A3A5A', // Dark Muted (as it's a final action)
    },
    buttonText: {
        color: '#1A1A2E', // Dark text on bright buttons
        fontWeight: 'bold',
        fontSize: 14,
    },
    assignedNote: {
        color: '#FFD166',
        marginTop: 10,
        fontStyle: 'italic',
        fontSize: 12,
        textAlign: 'center',
        padding: 5,
        backgroundColor: '#3A3A5A',
        borderRadius: 4,
    },
    noIncidents: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#8D99AE',
    },
    
    // --- FLOATING ACTION BUTTON (FAB) ---
    profileFab: {
        position: 'absolute',
        bottom: 30, 
        right: 20,
        backgroundColor: '#FFD166', // Bright yellow FAB
        width: 55,
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD166',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 15,
    },
    profileFabText: {
        fontSize: 28, // Large emoji icon
        lineHeight: 30,
        color: '#1A1A2E',
    },
});