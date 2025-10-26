import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";

export default function FeedbackScreen({ navigation }) {
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (feedback.trim() === "") {
      Alert.alert("Empty Feedback", "Please enter your feedback before submitting.");
      return;
    }
    Alert.alert("Thank You!", "Your feedback has been submitted successfully.");
    setFeedback("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>We Value Your Feedback</Text>
      <Text style={styles.text}>
        Please share your thoughts or suggestions to help us improve the Safe Ka Fernandino app.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Type your feedback here..."
        placeholderTextColor="#999"
        value={feedback}
        onChangeText={setFeedback}
        multiline
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit Feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#A83232",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: "#333",
    textAlign: "justify",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#A83232",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 20,
    backgroundColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
