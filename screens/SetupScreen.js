import React, { useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView, 
  Platform, 
  StatusBar, 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";

const SetupScreen = ({ navigation, route }) => {
  // Ensure route.params exists before destructuring
  const { userData } = route.params || {}; 
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const primaryColor = "#A83232";

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: primaryColor,
    buttonBackground: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    buttonText: isDarkMode ? primaryColor : primaryColor, // Use primary color for button text in light mode
    buttonBorder: isDarkMode ? "#333333" : "#E0E0E0",
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* 🔘 Toggle Theme Button */}
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {/* Title */}
        <Text style={[styles.title, { color: theme.header }]}>Choose Setup Type</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
            Select a method to set up security for a new child device.
        </Text>

        {/* Setup Option: Voice Setup */}
        <TouchableOpacity
          style={[
            styles.optionButton, 
            { 
              backgroundColor: theme.buttonBackground,
              borderColor: theme.buttonBorder,
            }
          ]}
          onPress={() => navigation.navigate("VoiceSetupScreen", { parentId: userData?.Id })}
        >
          <Ionicons name="mic-outline" size={28} color={theme.buttonText} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: theme.buttonText }]}>
            Voice Setup
          </Text>
        </TouchableOpacity>

        {/* Setup Option: Physical Gesture Setup */}
        <TouchableOpacity
          style={[
            styles.optionButton, 
            { 
              backgroundColor: theme.buttonBackground,
              borderColor: theme.buttonBorder,
            }
          ]}
          onPress={() => navigation.navigate("PhysicalGestureSetupScreen", { userData })}
        >
          <Ionicons name="hand-right-outline" size={28} color={theme.buttonText} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: theme.buttonText }]}>
            Physical Gesture Setup
          </Text>
        </TouchableOpacity>

        {/* Setup Option: Create Child Account (Restored) */}
        <TouchableOpacity
          style={[
            styles.optionButton, 
            { 
              backgroundColor: theme.buttonBackground,
              borderColor: theme.buttonBorder,
              marginBottom: 50, 
            }
          ]}
          onPress={() => navigation.navigate("ChildSignupScreen", { parentId: userData?.Id })}
        >
          <Ionicons name="person-add-outline" size={28} color={theme.buttonText} style={styles.optionIcon} />
          <Text style={[styles.optionText, { color: theme.buttonText }]}>
            Create Child Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Home Button (Fixed positioning) */}
      <View style={styles.homeContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("DashboardScreen")}>
          <Ionicons name="home-outline" size={32} color={theme.header} />
          <Text style={[styles.homeText, { color: theme.text }]}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, 
  },
  content: {
    flex: 1, 
    alignItems: "center", 
    paddingHorizontal: 20
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#fff", marginLeft: 5, fontSize: 16, fontWeight: "500" },
  themeToggle: { padding: 5 },

  // Titles
  title: { fontSize: 26, fontWeight: "bold", marginTop: 20, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 40, color: '#555' }, 

  // Option Buttons
  optionButton: {
    flexDirection: 'row',
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginVertical: 10,
    width: "100%",
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionIcon: {
      marginRight: 15,
  },
  optionText: { 
    fontSize: 17, 
    fontWeight: "600",
    flex: 1, 
  },

  // Home Button
  homeContainer: { 
    position: "absolute", 
    bottom: 40, 
    alignSelf: 'center',
    alignItems: "center" 
  },
  homeText: { fontSize: 14, marginTop: 5 },
});

export default SetupScreen;