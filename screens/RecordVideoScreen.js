import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { Video } from "expo-av";

export default function RecordVideoScreen({ navigation }) {
  const cameraRef = useRef(null);

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);

  // Request permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // CAMERA permission
        let cameraStatus = await Camera.getCameraPermissionsAsync();
        if (!cameraStatus.granted) {
          cameraStatus = await Camera.requestCameraPermissionsAsync();
        }

        // MEDIA LIBRARY permission
        let mediaStatus = await MediaLibrary.getPermissionsAsync();
        if (!mediaStatus.granted) {
          mediaStatus = await MediaLibrary.requestPermissionsAsync();
        }

        setHasCameraPermission(cameraStatus.granted);
        setHasMediaPermission(mediaStatus.granted);

        if (!cameraStatus.granted) {
          Alert.alert(
            "Camera Permission",
            "Camera permission is required to record video."
          );
        }
        if (!mediaStatus.granted) {
          Alert.alert(
            "Media Library Permission",
            "Media Library permission is required to save videos."
          );
        }
      } catch (err) {
        console.log("Permission Error:", err);
        Alert.alert("Error", "Failed to get permissions.");
      } finally {
        setIsLoading(false);
      }
    };

    requestPermissions();
  }, []);

  // Loading indicator
  if (isLoading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  if (!hasCameraPermission)
    return (
      <View style={styles.centered}>
        <Text>No access to camera. Please allow permissions.</Text>
      </View>
    );

  // Start/Stop recording
  const handleRecord = async () => {
    if (!cameraRef.current) return;

    if (!isRecording) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          quality: Camera.Constants.VideoQuality["480p"],
          maxDuration: 60,
        });
        setRecordedVideo(video.uri);
      } catch (err) {
        console.log("Recording Error:", err);
        Alert.alert("Error", "Failed to record video.");
      } finally {
        setIsRecording(false);
      }
    } else {
      cameraRef.current.stopRecording();
    }
  };

  // Save video
  const handleSave = async () => {
    if (!recordedVideo) return;

    if (!hasMediaPermission) {
      Alert.alert("Permission Denied", "Cannot save video without permission.");
      return;
    }

    try {
      await MediaLibrary.createAssetAsync(recordedVideo);
      Alert.alert("Saved", "Video saved to gallery.");
      setRecordedVideo(null);
    } catch (err) {
      console.log("Save Error:", err);
      Alert.alert("Error", "Failed to save video.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {recordedVideo ? (
        <View style={styles.previewContainer}>
          <Video
            source={{ uri: recordedVideo }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            shouldPlay
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setRecordedVideo(null)}
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Album")}
            >
              <Text style={styles.buttonText}>Album</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Camera
          style={styles.camera}
          ref={cameraRef}
          type={Camera.Constants.Type.back}
        >
          <View style={styles.recordButtonContainer}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recording]}
              onPress={handleRecord}
            />
          </View>
        </Camera>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  recordButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "red",
  },
  recording: { backgroundColor: "darkred" },
  previewContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  video: { width: "100%", height: "70%" },
  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-around",
    width: "90%",
  },
  button: {
    padding: 15,
    backgroundColor: "#A83232",
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
