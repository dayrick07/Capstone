import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SetupScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>Choose Setup Type</Text>

      {/* Setup Options */}
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate("VoiceSetupScreen")}
      >
        <Text style={styles.optionText}>Voice Setup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate("PhysicalGestureSetupScreen")}
      >
        <Text style={styles.optionText}>Physical Gesture Setup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate("ParentalSetupScreen")}
      >
        <Text style={styles.optionText}>Parental Setup</Text>
      </TouchableOpacity>

      {/* Home Button */}
      <View style={styles.homeContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("DashboardScreen")}>
          <Ionicons name="home-outline" size={32} color="#fff" />
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#A83232", alignItems: "center", paddingTop: 40 },
  topBar: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingLeft: 15 },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#fff", marginLeft: 5 },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff", marginVertical: 30 },
  optionButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  optionText: { fontSize: 16, fontWeight: "bold", color: "#000" },
  homeContainer: { position: "absolute", bottom: 30, alignItems: "center" },
  homeText: { color: "#fff", fontSize: 14, marginTop: 5 },
});

export default SetupScreen;
