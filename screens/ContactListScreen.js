// screens/ContactListScreen.js
import React, { useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../ThemeContext";

export default function ContactListScreen({ route, navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const { contactData } = route.params || { contactData: [] };

  const theme = {
    background: isDarkMode ? "#121212" : "#FFFFFF",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    header: "#A83232",
    card: isDarkMode ? "#1E1E1E" : "#F8F8F8",
  };

  const handleSelect = async (item) => {
    if (item.phoneNumbers && item.phoneNumbers.length > 0) {
      const number = item.phoneNumbers[0].number;
      const newContact = { name: item.name, phone: number };

      const existing = JSON.parse(await AsyncStorage.getItem("emergencyContacts")) || [];
      existing.push(newContact);
      await AsyncStorage.setItem("emergencyContacts", JSON.stringify(existing));

      Alert.alert("Added", `${item.name} added to emergency contacts.`);
      navigation.goBack();
    } else {
      Alert.alert("No Number", "This contact has no phone number.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={contactData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: theme.card }]}
            onPress={() => handleSelect(item)}
          >
            <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
            {item.phoneNumbers && (
              <Text style={[styles.number, { color: theme.text }]}>
                {item.phoneNumbers[0]?.number}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contactCard: {
    margin: 8,
    borderRadius: 10,
    padding: 12,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "bold" },
  number: { fontSize: 14, marginTop: 4 },
});
