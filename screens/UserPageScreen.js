import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../ThemeContext"; // ✅ Import Theme Context

const { width } = Dimensions.get("window");

const UserPageScreen = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(
    "https://via.placeholder.com/150"
  );

  const { isDarkMode, toggleTheme } = useContext(ThemeContext); // ✅ Use theme context

  // Load saved profile image
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem("profileImage");
        if (savedImage) setProfileImage(savedImage);
      } catch (error) {
        console.log("Error loading profile image:", error);
      }
    };
    loadProfileImage();
  }, []);

  // Save image to AsyncStorage
  const saveProfileImage = async (uri) => {
    try {
      await AsyncStorage.setItem("profileImage", uri);
      setProfileImage(uri);
    } catch (error) {
      console.log("Error saving profile image:", error);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow access to photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      saveProfileImage(result.assets[0].uri);
    }
  };

  // Capture image
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow access to the camera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      saveProfileImage(result.assets[0].uri);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickImage },
    ]);
  };

  // ✅ Theme-based styles
  const themeStyles = {
    background: { backgroundColor: isDarkMode ? "#121212" : "#fff" },
    card: { backgroundColor: isDarkMode ? "#1E1E1E" : "#f8f8f8" },
    text: { color: isDarkMode ? "#fff" : "#333" },
    label: { color: isDarkMode ? "#ff6666" : "#A83232" },
  };

  return (
    <SafeAreaView style={[styles.container, themeStyles.background]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile</Text>

        {/* 🌙 / ☀️ Toggle Button */}
        <TouchableOpacity onPress={toggleTheme}>
          <Icon
            name={isDarkMode ? "brightness-7" : "brightness-2"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Profile Picture */}
      <View style={styles.profilePicContainer}>
        <TouchableOpacity onPress={handleChangePhoto}>
          <Image source={{ uri: profileImage }} style={styles.profilePic} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton} onPress={handleChangePhoto}>
          <Icon name="photo-camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={[styles.infoCard, themeStyles.card]}>
        <Text style={[styles.label, themeStyles.label]}>Username</Text>
        <Text style={[styles.value, themeStyles.text]}>Juan Dela Cruz</Text>

        <Text style={[styles.label, themeStyles.label]}>Email</Text>
        <Text style={[styles.value, themeStyles.text]}>juan@example.com</Text>

        <Text style={[styles.label, themeStyles.label]}>Phone</Text>
        <Text style={[styles.value, themeStyles.text]}>+63 912 345 6789</Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Parent Setup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#555" }]}
        onPress={() => navigation.navigate("LoginScreen")}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default UserPageScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#A83232",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  profilePicContainer: {
    alignItems: "center",
    marginTop: 20,
    position: "relative",
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#A83232",
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: width / 2 - 90,
    backgroundColor: "#A83232",
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  infoCard: {
    borderRadius: 10,
    margin: 20,
    padding: 15,
    elevation: 3,
  },
  label: { fontSize: 14, fontWeight: "bold", marginTop: 10 },
  value: { fontSize: 16, marginTop: 2 },
  button: {
    backgroundColor: "#A83232",
    marginHorizontal: 20,
    marginTop: 15,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
