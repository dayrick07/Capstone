// ShakeGestureScreen.js (UI-only, no volume button UI)
import React, { useContext } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity } from "react-native";
import { GlobalListenerContext } from "../contexts/GlobalListenerContext";

export default function ShakeGestureScreen() {
  const {
    shakeEnabled,
    setShakeEnabled,
    volumeEnabled,
    setVolumeEnabled,
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
});
