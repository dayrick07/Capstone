// MyChildrenScreen.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { ThemeContext } from "../ThemeContext";

// NOTE: Use your actual SERVER_URL
const SERVER_URL = "http://192.168.0.111:3000"; 

// --- Placeholder for Parent/User Context ---
const ParentContext = React.createContext({
    parentData: { Id: 1 }, // Replace with how you retrieve the logged-in Parent's ID
});

// Component to render each child item
const ChildCard = ({ child, theme, onEdit }) => (
    <View style={[styles.card, { 
        backgroundColor: theme === 'dark' ? '#1f1f1f' : '#fff',
        borderColor: theme === 'dark' ? '#BB86FC' : '#A83232',
    }]}>
        <View style={styles.cardInfo}>
            <Text style={[styles.childName, { color: theme === 'dark' ? '#BB86FC' : '#A83232' }]}>
                {child.Name} ({child.Age || 'Age N/A'})
            </Text>
            <Text style={[styles.detailText, { color: theme === 'dark' ? '#ddd' : '#555' }]}>
                🏫 School: {child.School || 'Not specified'}
            </Text>
            {child.Allergies && (
                <Text style={[styles.detailText, styles.warningText]}>
                    ⚠️ Allergies: {child.Allergies}
                </Text>
            )}
            {child.SpecialNeeds && (
                <Text style={[styles.detailText, styles.warningText]}>
                    ♿ Special Needs: {child.SpecialNeeds}
                </Text>
            )}
        </View>
        <TouchableOpacity onPress={() => onEdit(child)} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={theme === 'dark' ? '#fff' : '#A83232'} />
        </TouchableOpacity>
    </View>
);


export default function MyChildrenScreen({ navigation }) {
    const { theme } = useContext(ThemeContext);
    const parentContext = useContext(ParentContext);
    
    // NOTE: This MUST be the actual logged-in parent's Id
    const userId = parentContext.parentData.Id; 

    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchChildren = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${SERVER_URL}/children/${userId}`);

            if (response.data.success) {
                setChildren(response.data.children);
            } else {
                Alert.alert("Error", response.data.message || "Failed to load children.");
                setChildren([]);
            }
        } catch (error) {
            console.error("❌ Fetch Children Error:", error.message);
            Alert.alert("Network Error", "Could not connect to the server to fetch children.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        // Refetch data every time the screen comes into focus 
        // (after adding/editing a child)
        const unsubscribe = navigation.addListener('focus', fetchChildren);
        return unsubscribe;
    }, [navigation, fetchChildren]);

    const handleEditChild = (child) => {
        // Navigate to a dedicated screen to edit the child's details
        navigation.navigate("EditChildScreen", { childData: child, userId });
    };

    const handleAddChild = () => {
        // Navigate to a screen to add a new child
        navigation.navigate("AddChildScreen", { userId });
    };


    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#121212' : '#f0f0f7' }]}>
            <Text style={[styles.headerText, { color: theme === 'dark' ? '#fff' : '#333' }]}>
                My Registered Children
            </Text>
            
            <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme === 'dark' ? '#BB86FC' : '#A83232' }]} 
                onPress={handleAddChild}
            >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}> Add New Child</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color={theme === 'dark' ? '#BB86FC' : '#A83232'} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={children}
                    keyExtractor={(item) => item.Id.toString()}
                    renderItem={({ item }) => <ChildCard child={item} theme={theme} onEdit={handleEditChild} />}
                    refreshing={loading}
                    onRefresh={fetchChildren}
                    ListEmptyComponent={() => (
                        <Text style={[styles.emptyText, { color: theme === 'dark' ? '#888' : '#555' }]}>
                            You have no children registered. Tap "Add New Child" above.
                        </Text>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 15, 
    },
    headerText: {
        fontSize: 22, 
        fontWeight: 'bold', 
        marginBottom: 10,
    },
    addButton: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 3,
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderLeftWidth: 5,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 1,
    },
    cardInfo: {
        flex: 1,
    },
    childName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    detailText: {
        fontSize: 14,
        marginTop: 2,
    },
    warningText: {
        fontWeight: '600',
        color: '#ffc107', // Yellow for warnings
    },
    editButton: {
        marginLeft: 10,
        padding: 5,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    }
});