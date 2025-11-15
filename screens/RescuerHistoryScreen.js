// RescuerHistoryScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
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

export default function RescuerHistoryScreen({ route, navigation }) {
  // Get rescuerId and name passed from RescuerHomeScreen
  const { rescuerId, rescuerName } = route.params;

  const [historyIncidents, setHistoryIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Set the screen title dynamically
  useEffect(() => {
    navigation.setOptions({
      title: `${rescuerName || 'Rescuer'}'s Past Dispatches`,
    });
  }, [navigation, rescuerName]);


  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: Using the correct backend route: /rescuers/:id/history
      const response = await axios.get(
        `${SERVER_URL}/rescuers/${rescuerId}/history` 
      );

      if (response.data.success) {
        // Data is already sorted on the server by UpdatedAt DESC
        setHistoryIncidents(response.data.incidents);
      } else {
        Alert.alert("Error", response.data.message || "Failed to fetch history.");
        setHistoryIncidents([]); // Clear list on error
      }
    } catch (err) {
      console.error("❌ Fetch History Error:", err.message);
      Alert.alert(
        "Network Error",
        "Cannot fetch past dispatches from server. Is the server running?"
      );
    } finally {
      setLoading(false);
    }
  }, [rescuerId]);

  useEffect(() => {
    // Fetch data when the component mounts and whenever the screen is focused
    const unsubscribe = navigation.addListener('focus', fetchHistory);
    return unsubscribe;
  }, [navigation, fetchHistory]);

  const renderHistoryCard = ({ item }) => {
    // Determine card color based on final status if needed
    const isDone = item.Status === 'Done';
    const borderColor = isDone ? '#28a745' : '#007bff'; // Green for Done, Blue for Resolved

    return (
      <View style={[styles.card, { borderLeftColor: borderColor }]}>
        <Text style={styles.title}>{item.Type}</Text>
        <Text>⭐ Priority: **{item.Priority || 'N/A'}**</Text>
        <Text>📍 Location: {item.Location}</Text>
        <Text style={styles.timestamp}>
          Reported: {formatTimestamp(item.CreatedAt)}
        </Text>
        <Text style={styles.timestamp}>
          **Completed:** {formatTimestamp(item.UpdatedAt)}
        </Text>
        <Text style={[styles.statusText, { color: borderColor }]}>
          Final Status: **{item.Status}**
        </Text>
        {/* If you add Resolution Notes to the Incident schema, display them here */}
        {item.ResolutionNotes && (
          <Text style={styles.notesText}>
            Notes: *{item.ResolutionNotes}*
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={historyIncidents}
          keyExtractor={(item) => item.Id.toString()}
          renderItem={renderHistoryCard}
          refreshing={loading}
          onRefresh={fetchHistory}
          ListEmptyComponent={() => (
            <Text style={styles.noHistory}>
              You have no completed dispatches in your history.
            </Text>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 15, 
    backgroundColor: "#f0f0f7" 
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  title: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 5,
    color: '#333',
  },
  timestamp: { 
    fontSize: 12, 
    color: "#666", 
    marginTop: 2,
  },
  statusText: { 
    fontSize: 14, 
    fontWeight: '700', 
    marginTop: 8, 
  },
  notesText: {
    fontSize: 14,
    color: '#007bff',
    marginTop: 5,
    fontStyle: 'italic',
  },
  noHistory: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
});