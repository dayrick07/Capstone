import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Alert 
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const emergencyOptions = ["Call Police", "Call Ambulance", "Call Firefighters"];

const VoiceSetupScreen = ({ navigation }) => {
  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [recordingsList, setRecordingsList] = useState([]);
  const [recordTimer, setRecordTimer] = useState(0);
  const [playbackTimer, setPlaybackTimer] = useState(0);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
  const playbackRef = useRef(null);
  const playbackInterval = useRef(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    let timer;
    if (recording) timer = setInterval(() => setRecordTimer(prev => prev + 1), 1000);
    else setRecordTimer(0);
    return () => clearInterval(timer);
  }, [recording]);

  const loadRecordings = async () => {
    try {
      const saved = JSON.parse(await AsyncStorage.getItem("voiceCommands") || "[]");
      setRecordingsList(saved.reverse());
    } catch (error) {
      console.log("Error loading recordings:", error);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      Alert.alert("Recording started", "Speak your command now!");
    } catch (error) {
      console.log(error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri);
    setRecording(null);
    Alert.alert("Recording stopped", "Voice command recorded!");
  };

  const saveRecording = async () => {
    if (!recordedUri) {
      Alert.alert("No recording", "Please record a voice command first.");
      return;
    }

    Alert.alert(
      "Select Emergency Type",
      "Choose the emergency type for this recording:",
      emergencyOptions.map(option => ({
        text: option,
        onPress: async () => {
          try {
            const saved = JSON.parse(await AsyncStorage.getItem("voiceCommands") || "[]");
            saved.push({ uri: recordedUri, emergencyType: option, createdAt: new Date().toISOString() });
            await AsyncStorage.setItem("voiceCommands", JSON.stringify(saved));
            setRecordedUri(null);
            loadRecordings();
            Alert.alert("Saved", "Voice command saved successfully!");
          } catch (error) {
            console.log(error);
          }
        }
      }))
    );
  };

  const playRecording = async (uri, index) => {
    try {
      if (playbackRef.current) {
        await playbackRef.current.stopAsync();
        await playbackRef.current.unloadAsync();
        clearInterval(playbackInterval.current);
      }
      const { sound } = await Audio.Sound.createAsync({ uri });
      playbackRef.current = sound;
      setCurrentPlayingIndex(index);
      setPlaybackTimer(0);
      await sound.playAsync();
      playbackInterval.current = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.positionMillis != null) {
          setPlaybackTimer(Math.floor(status.positionMillis / 1000));
        }
        if (status.didJustFinish) {
          clearInterval(playbackInterval.current);
          setCurrentPlayingIndex(null);
          setPlaybackTimer(0);
        }
      }, 500);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteRecording = async (index) => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const saved = JSON.parse(await AsyncStorage.getItem("voiceCommands") || "[]");
            saved.splice(index, 1);
            await AsyncStorage.setItem("voiceCommands", JSON.stringify(saved));
            loadRecordings();
          } catch (err) {
            console.log(err);
          }
        }}
      ]
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.recordItem}>
      <Text style={styles.recordLabel}>
        {item.emergencyType} - {new Date(item.createdAt).toLocaleString()}
        {currentPlayingIndex === index ? ` (${playbackTimer}s)` : ""}
      </Text>
      <View style={styles.recordActions}>
        <TouchableOpacity style={styles.playButton} onPress={() => playRecording(item.uri, index)}>
          <Text style={styles.playText}>{currentPlayingIndex === index ? "Playing" : "Play"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRecording(index)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Setup</Text>

      <TouchableOpacity style={styles.recordButton} onPress={recording ? stopRecording : startRecording}>
        <Text style={styles.recordText}>
          {recording ? `Stop Recording (${recordTimer}s)` : "Record Voice Command"}
        </Text>
      </TouchableOpacity>

      {recordedUri && (
        <TouchableOpacity style={styles.saveButton} onPress={saveRecording}>
          <Text style={styles.saveText}>Save Recording</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.listTitle}>Saved Recordings</Text>
      <FlatList
        data={recordingsList}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        style={styles.list}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>⬅ Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VoiceSetupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#A83232", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 },
  recordButton: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 10, alignItems: "center" },
  recordText: { color: "#A83232", fontWeight: "bold", textAlign: "center" },
  saveButton: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 20, alignItems: "center" },
  saveText: { color: "#A83232", fontWeight: "bold", textAlign: "center" },
  listTitle: { color: "#fff", fontSize: 18, marginBottom: 10, textAlign: "center" },
  list: { maxHeight: 300, marginBottom: 20 },
  recordItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 10, borderRadius: 10, marginBottom: 5 },
  recordLabel: { color: "#A83232", fontWeight: "bold", flex: 1 },
  recordActions: { flexDirection: "row" },
  playButton: { backgroundColor: "#A83232", padding: 5, borderRadius: 5, marginRight: 5 },
  playText: { color: "#fff" },
  deleteButton: { backgroundColor: "red", padding: 5, borderRadius: 5 },
  deleteText: { color: "#fff" },
  backButton: { alignItems: "center", marginTop: 10 },
  backText: { color: "#fff", fontSize: 16 }
});
