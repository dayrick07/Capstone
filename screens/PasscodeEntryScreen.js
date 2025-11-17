import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { ThemeContext } from "../ThemeContext"; // Adjust path as necessary
import { getParentalPasscode } from "./ParentalSetupScreen"; // Import the getter function

const PasscodeEntryScreen = ({ navigation, route }) => {
    // 'targetScreen' is passed from the screen that called navigation.navigate()
    const { targetScreen } = route.params || {}; 
    const { isDarkMode } = useContext(ThemeContext);
    const [passcode, setPasscode] = useState("");
    
    const correctPasscode = getParentalPasscode();

    const theme = {
        background: isDarkMode ? "#121212" : "#FFFFFF",
        text: isDarkMode ? "#FFFFFF" : "#000000",
        header: "#A83232",
        inputBackground: isDarkMode ? "#1E1E1E" : "#F9F9F9",
        buttonBackground: "#A83232",
        buttonText: "#FFFFFF",
    };

    const handlePasscodeSubmit = () => {
        if (passcode === correctPasscode) {
            Alert.alert("Access Granted", `Navigating to ${targetScreen}.`, [
                {
                    text: "OK",
                    // 💡 SUCCESS: Navigate to the target screen received from the props
                    onPress: () => navigation.navigate(targetScreen), 
                },
            ]);
        } else {
            Alert.alert("Access Denied", "Incorrect passcode. Please try again.");
            setPasscode("");
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.title, { color: theme.header }]}>🔒 Enter Passcode</Text>
            <Text style={[styles.subtitle, { color: theme.text }]}>
                A parental passcode is required to access the protected screen.
            </Text>

            <TextInput
                style={[
                    styles.input,
                    { backgroundColor: theme.inputBackground, color: theme.text },
                ]}
                placeholder="****"
                placeholderTextColor={isDarkMode ? "#888" : "#666"}
                keyboardType="numeric"
                secureTextEntry={true}
                value={passcode}
                onChangeText={setPasscode}
                maxLength={6}
                onSubmitEditing={handlePasscodeSubmit}
            />

            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.buttonBackground }]}
                onPress={handlePasscodeSubmit}
                disabled={passcode.length < 4}
            >
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                    Unlock Access
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", padding: 20 },
    backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    title: { fontSize: 24, fontWeight: "bold", marginTop: 80, marginBottom: 10 },
    subtitle: { fontSize: 16, marginBottom: 40, textAlign: 'center' },
    input: {
        width: "80%",
        padding: 15,
        borderRadius: 8,
        marginVertical: 10,
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        marginTop: 20,
        width: "80%",
        alignItems: "center",
        elevation: 4,
    },
    buttonText: { fontSize: 18, fontWeight: "bold" },
});

export default PasscodeEntryScreen;