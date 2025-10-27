// screens/MyChildrenScreen.js
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../ThemeContext";

export default function MyChildrenScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: "#A83232",
    card: isDarkMode ? "#1E1E1E" : "#F8F8F8",
    buttonBackground: isDarkMode ? "#BB86FC" : "#A83232",
    buttonText: "#FFFFFF",
  };

  const [children, setChildren] = useState([]);

  useEffect(() => {
    const loadChildren = async () => {
      const saved = await AsyncStorage.getItem("childrenList");
      if (saved) setChildren(JSON.parse(saved));
    };
    const unsubscribe = navigation.addListener("focus", loadChildren);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Children</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddChildScreen")}>
          <Ionicons name="add-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {children.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.placeholder, { color: theme.text }]}>
            👧 No children added yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={[styles.childCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.childName, { color: theme.text }]}>👶 {item.name}</Text>
              <Text style={[styles.childInfo, { color: theme.text }]}>
                Relationship: {item.relationship}{"\n"}
                Contact: {item.contact}{"\n"}
                Safe Password: {item.safePassword}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Add Child Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.buttonBackground }]}
        onPress={() => navigation.navigate("AddChildScreen")}
      >
        <Text style={[styles.buttonText, { color: theme.buttonText }]}>Add Child</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#fff", marginLeft: 5, fontSize: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholder: { fontSize: 16 },
  childCard: {
    margin: 10,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
  },
  childName: { fontSize: 18, fontWeight: "bold" },
  childInfo: { fontSize: 14, marginTop: 6 },
  button: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 3,
  },
  buttonText: { fontSize: 16, fontWeight: "bold" },
});
