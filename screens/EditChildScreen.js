// EditChildScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ScrollView 
} from 'react-native';
import axios from 'axios';
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from '../ThemeContext';

// NOTE: Use your actual SERVER_URL
const SERVER_URL = "http://192.168.0.111:3000"; 

export default function EditChildScreen({ route, navigation }) {
    const { theme } = useContext(ThemeContext);
    
    // Data passed from MyChildrenScreen
    const { childData, userId } = route.params; 
    const childId = childData.Id;

    const [name, setName] = useState(childData.Name || '');
    const [age, setAge] = useState(String(childData.Age || '') || '');
    const [school, setSchool] = useState(childData.School || '');
    const [allergies, setAllergies] = useState(childData.Allergies || '');
    const [specialNeeds, setSpecialNeeds] = useState(childData.SpecialNeeds || '');
    const [loading, setLoading] = useState(false);

    const dynamicStyle = {
        container: { backgroundColor: theme === 'dark' ? '#121212' : '#f0f0f7' },
        text: { color: theme === 'dark' ? '#fff' : '#333' },
        input: { 
            borderColor: theme === 'dark' ? '#BB86FC' : '#A83232',
            color: theme === 'dark' ? '#fff' : '#333',
            backgroundColor: theme === 'dark' ? '#1f1f1f' : '#fff',
        },
        button: { backgroundColor: theme === 'dark' ? '#BB86FC' : '#A83232' },
        deleteButton: { backgroundColor: '#dc3545' }, // Red for Delete
    };

    const handleUpdateChild = async () => {
        if (!name.trim()) {
            Alert.alert("Required Field", "Child's Name is required.");
            return;
        }

        // Basic validation for Age
        const cleanedAge = age ? parseInt(age) : null;
        if (age && (isNaN(cleanedAge) || cleanedAge <= 0)) {
            Alert.alert("Invalid Age", "Please enter a valid age.");
            return;
        }

        setLoading(true);

        try {
            const updatedData = {
                Name: name.trim(),
                Age: age.trim(), // Send as string/number based on how server handles
                School: school.trim(),
                Allergies: allergies.trim(),
                SpecialNeeds: specialNeeds.trim(),
                UserId: userId, // Pass ParentId for server-side verification
            };

            const response = await axios.put(`${SERVER_URL}/children/${childId}`, updatedData);

            if (response.data.success) {
                Alert.alert("Success", "Child details updated successfully!", [
                    { 
                        text: "OK", 
                        onPress: () => navigation.goBack() // Go back to MyChildrenScreen
                    }
                ]);
            } else {
                Alert.alert("Update Failed", response.data.message || "An unknown error occurred.");
            }
        } catch (error) {
            console.error('❌ Child Update Error:', error.response?.data || error.message);
            Alert.alert(
                "Network Error", 
                "Failed to connect to the server or data validation failed."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChild = () => {
        Alert.alert(
            "Confirm Deletion",
            `Are you sure you want to delete ${name}'s profile? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: confirmDelete }
            ]
        );
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            // NOTE: You must also create a DELETE /children/:id endpoint on your server
            const response = await axios.delete(`${SERVER_URL}/children/${childId}?userId=${userId}`); 

            if (response.data.success) {
                Alert.alert("Success", "Child deleted successfully!", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Deletion Failed", response.data.message || "Failed to delete the record.");
            }
        } catch (error) {
            console.error('❌ Child Deletion Error:', error.message);
            Alert.alert("Network Error", "Failed to connect to the server to delete.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <ScrollView style={[styles.container, dynamicStyle.container]}>
            <Text style={[styles.headerText, dynamicStyle.text]}>
                Editing: {childData.Name}
            </Text>

            {/* Name Input (Required) */}
            <Text style={[styles.label, dynamicStyle.text]}>Child's Full Name *</Text>
            <TextInput
                style={[styles.input, dynamicStyle.input]}
                value={name}
                onChangeText={setName}
                placeholder="Enter Name"
                placeholderTextColor={theme === 'dark' ? '#888' : '#999'}
            />

            {/* Age Input */}
            <Text style={[styles.label, dynamicStyle.text]}>Age</Text>
            <TextInput
                style={[styles.input, dynamicStyle.input]}
                value={age}
                onChangeText={setAge}
                placeholder="Enter Age"
                placeholderTextColor={theme === 'dark' ? '#888' : '#999'}
                keyboardType="numeric"
            />
            
            {/* School Input */}
            <Text style={[styles.label, dynamicStyle.text]}>School/Guardian Contact</Text>
            <TextInput
                style={[styles.input, dynamicStyle.input]}
                value={school}
                onChangeText={setSchool}
                placeholder="School Name or Primary Contact"
                placeholderTextColor={theme === 'dark' ? '#888' : '#999'}
            />

            {/* Allergies Input */}
            <Text style={[styles.label, dynamicStyle.text]}>Known Allergies/Medical Conditions</Text>
            <TextInput
                style={[styles.input, dynamicStyle.input, styles.textArea]}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="e.g., Peanut allergy, Asthma"
                placeholderTextColor={theme === 'dark' ? '#888' : '#999'}
                multiline
            />
            
            {/* Special Needs Input */}
            <Text style={[styles.label, dynamicStyle.text]}>Special Needs/Other Info</Text>
            <TextInput
                style={[styles.input, dynamicStyle.input, styles.textArea]}
                value={specialNeeds}
                onChangeText={setSpecialNeeds}
                placeholder="Any special accommodations or requirements"
                placeholderTextColor={theme === 'dark' ? '#888' : '#999'}
                multiline
            />

            {/* Update Button */}
            <TouchableOpacity 
                style={[styles.button, dynamicStyle.button]} 
                onPress={handleUpdateChild} 
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity 
                style={[styles.button, dynamicStyle.deleteButton]} 
                onPress={handleDeleteChild} 
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    <Ionicons name="trash-outline" size={18} color="#fff" /> Delete Child
                </Text>
            </TouchableOpacity>


            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginTop: 15,
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
});