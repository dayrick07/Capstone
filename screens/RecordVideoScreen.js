import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, FlatList } from "react-native";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";

export default function RecordVideoScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");

      // Load saved videos from internal storage
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const savedVideos = files.filter(f => f.endsWith(".mp4")).map(f => FileSystem.documentDirectory + f);
      setVideos(savedVideos);
    })();
  }, []);

  if (hasPermission === null) return <Text>Loading...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  const handleRecord = async () => {
    if (!cameraRef.current) return;

    if (!isRecording) {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync();
      const fileName = `${FileSystem.documentDirectory}video_${Date.now()}.mp4`;
      await FileSystem.moveAsync({ from: video.uri, to: fileName });
      setVideos(prev => [fileName, ...prev]);
      setIsRecording(false);
    } else {
      cameraRef.current.stopRecording();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Camera ref={cameraRef} style={{ flex: 1 }} type={Camera.Constants.Type.back}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={handleRecord}>
            <Text style={{ color: "#fff" }}>{isRecording ? "Stop" : "Record"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "blue" }]}
            onPress={() => navigation.navigate("Album", { videos })}
          >
            <Text style={{ color: "#fff" }}>Album</Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    position: "absolute",
    bottom: 20,
    width: "100%",
  },
  button: {
    padding: 15,
    backgroundColor: "red",
    borderRadius: 50,
  },
});
