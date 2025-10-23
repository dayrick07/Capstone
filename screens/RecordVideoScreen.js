import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { Camera } from "expo-camera";
console.log("Camera:", Camera);
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

const RecordVideoScreen = ({ navigation }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);

  const cameraRef = useRef(null);

  // 🔹 Safe fallback for Camera type
  const [cameraType, setCameraType] = useState(
    Camera?.Constants?.Type?.back || 1
  );

  // Request permissions
  useEffect(() => {
    (async () => {
      try {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(cameraStatus === "granted");

        const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
        setHasAudioPermission(audioStatus === "granted");
      } catch (error) {
        console.log("Permission error:", error);
      }
    })();
  }, []);

  // Save media to AsyncStorage
  const saveMedia = async (key, uri) => {
    try {
      await AsyncStorage.setItem(key, uri);
      console.log(`${key} saved: ${uri}`);
    } catch (error) {
      console.log("Error saving media:", error);
    }
  };

  // Take photo
  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
        saveMedia("photo", photo.uri);
      } catch (error) {
        console.log("Error taking photo:", error);
      }
    }
  };

  // Record video
  const recordVideo = async () => {
    if (cameraRef.current) {
      try {
        if (!isRecording) {
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync();
          setVideoUri(video.uri);
          saveMedia("video", video.uri);
          setIsRecording(false);
        } else {
          cameraRef.current.stopRecording();
        }
      } catch (error) {
        console.log("Error recording video:", error);
        setIsRecording(false);
      }
    }
  };

  // Permissions handling
  if (hasCameraPermission === null || hasAudioPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (!hasCameraPermission || !hasAudioPermission) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No access to camera or microphone</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera style={styles.camera} type={cameraType} ref={cameraRef}>
        <View style={styles.buttonsContainer}>
          {/* Photo Button */}
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Icon name="photo-camera" size={40} color="#fff" />
            <Text style={styles.buttonText}>Photo</Text>
          </TouchableOpacity>

          {/* Video Button */}
          <TouchableOpacity style={styles.button} onPress={recordVideo}>
            <Icon
              name="videocam"
              size={40}
              color={isRecording ? "red" : "#fff"}
            />
            <Text style={styles.buttonText}>
              {isRecording ? "Stop" : "Video"}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>

      {/* Preview */}
      <View style={styles.previewContainer}>
        {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
        {videoUri && (
          <Text style={styles.previewText}>Video saved: {videoUri}</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default RecordVideoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 30,
    width: "100%",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#A83232",
    padding: 10,
    borderRadius: 50,
  },
  buttonText: { color: "#fff", marginTop: 5 },
  previewContainer: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  preview: { width: 80, height: 80, borderRadius: 10, marginBottom: 5 },
  previewText: { color: "#fff", fontSize: 12 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
