import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ParentalSetupScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Parental Setup Coming Soon 👨‍👩‍👧</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#A83232", alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontSize: 18 },
});

export default ParentalSetupScreen;
