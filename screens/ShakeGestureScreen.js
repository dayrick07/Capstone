// ShakeGestureScreen.js (UI only)
import React, { useContext } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity } from "react-native";
import { GlobalListenerContext } from "../contexts/GlobalListenerContext";


export default function ShakeGestureScreen() {
  const {
    shakeEnabled,
    setShakeEnabled,
    volumeEnabled,
    setVolumeEnabled,
    setVolumeUpPressed,
    setVolumeDownPressed,
    saveSettings,
  } = useContext(GlobalListenerContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency SOS Setup</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Enable Shake Detection</Text>
        <Switch value={shakeEnabled} onValueChange={setShakeEnabled} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Enable Volume Button Trigger</Text>
        <Switch value={volumeEnabled} onValueChange={setVolumeEnabled} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
        <Text style={styles.saveText}>Save Settings</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 30, fontWeight: "600" }}>
        Press both volume buttons simultaneously
      </Text>
      <View style={styles.volumeRow}>
        <TouchableOpacity
          style={styles.volumeBtn}
          onPressIn={() => setVolumeUpPressed(true)}
          onPressOut={() => setVolumeUpPressed(false)}
        >
          <Text style={styles.volumeText}>Volume Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.volumeBtn}
          onPressIn={() => setVolumeDownPressed(true)}
          onPressOut={() => setVolumeDownPressed(false)}
        >
          <Text style={styles.volumeText}>Volume Down</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginTop: 10, marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  label: { fontSize: 18, fontWeight: "600" },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#0ea5e9",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  volumeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  volumeBtn: {
    backgroundColor: "#f97316",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  volumeText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
