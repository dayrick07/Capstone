import React, { useState, useContext, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ThemeContext } from "../ThemeContext";
import axios from "axios";
// Assuming you have a file named config.js in the parent directory containing SERVER_URL
import { SERVER_URL } from "../config"; 

const ParentScreen = ({ navigation, route }) => {
  const { userData } = route.params || {};
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // --- STATE FOR CHILDREN LIST ---
  // Modal states are removed
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true); // Start loading immediately
  // ------------------------------------

  const primaryColor = "#A83232";
  
  const theme = {
    background: isDarkMode ? "#121212" : "#F4F4F9",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    secondaryText: isDarkMode ? "#B0B0B0" : "#555555",
    header: primaryColor,
    cardBackground: isDarkMode ? "#1C1C1C" : "#FFFFFF",
    cardBorder: isDarkMode ? "#333333" : "#E0E0E0",
  };

  // --------------------------- FETCH CHILDREN (Adapted for immediate display) ---------------------------
  
  const fetchChildrenData = async () => {
    if (!userData?.Id) return; 
    
    setChildrenLoading(true);
    try {
      const response = await axios.get(`${SERVER_URL}/children/by-parent/${userData.Id}`);
      if (response.data.success) {
        setChildren(response.data.children);
      } else {
        Alert.alert("Error", response.data.message || "Unable to load children.");
      }
    } catch (err) {
      console.error("Fetch children error:", err);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setTimeout(() => setChildrenLoading(false), 300); 
    }
  };

  useEffect(() => {
    // Fetch data immediately when the component mounts
    fetchChildrenData();
    // Setting up a basic focus listener to refresh the list when returning to the screen
    const unsubscribe = navigation.addListener('focus', () => {
        fetchChildrenData();
    });

    return unsubscribe; // Clean up the listener
  }, [userData?.Id, navigation]);


  // --------------------------- HANDLERS ---------------------------

  // Handles navigation to the location screen
  const handleLocateChild = (child) => {
    navigation.navigate("ParentChildLocationScreen", {
      childId: child.Id,
      childName: child.Name,
    });
  };

  // Navigates to Create Child Screen (Using the safe deferred navigation)
  const handleCreateChildNavigation = () => {
    setTimeout(() => {
      navigation.navigate("ChildSignupScreen", { parentId: userData?.Id });
    }, 0);
  }

  const handleManualRefresh = () => {
    fetchChildrenData();
  };

  // --------------------------- CHILD LIST RENDERER ---------------------------

  const ChildListContent = () => {
    if (childrenLoading) {
      return (
        <View style={styles.listContainer}>
          <ActivityIndicator size="large" color={primaryColor} style={{ marginVertical: 40 }} />
          <Text style={{ color: theme.secondaryText }}>Loading linked accounts...</Text>
        </View>
      );
    }

    if (children.length === 0) {
      return (
        <View style={styles.emptyListContainer}>
          <Ionicons name="people-outline" size={50} color={theme.secondaryText} style={{ marginBottom: 10 }} />
          <Text style={[styles.infoText, { color: theme.secondaryText, fontSize: 16, marginBottom: 15 }]}>
            No linked child accounts found.
          </Text>
          <TouchableOpacity
            onPress={handleManualRefresh}
            style={[styles.refreshButton, { borderColor: primaryColor }]}
          >
            <Ionicons name="refresh" size={20} color={primaryColor} />
            <Text style={[styles.refreshButtonText, { color: primaryColor }]}>Refresh List</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {children.map((child) => (
          <TouchableOpacity 
            key={child.Id} 
            style={[styles.childItem, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]} 
            onPress={() => handleLocateChild(child)}
          >
            <View style={styles.childItemIcon}>
              <Icon name="person" size={24} color={primaryColor} /> 
            </View>
            <Text style={[styles.childNameFixed, { color: theme.text, flex: 1, fontSize: 17, fontWeight: '600' }]}>
              {child.Name}
            </Text>
            <View style={styles.trackButton}>
               <Text style={{ color: primaryColor, fontWeight: 'bold', marginRight: 5 }}>TRACK</Text>
               <Ionicons name="locate" size={20} color={primaryColor} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.content}>
        
        <Text style={[styles.title, { color: theme.header }]}>Parent Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          Monitor your child's location or add new accounts below.
        </Text>
        
        {/* --- ADD CHILD BUTTON --- */}
        <TouchableOpacity
          style={[styles.addChildButton, { backgroundColor: primaryColor }]}
          onPress={handleCreateChildNavigation}
        >
          <Ionicons name="person-add-outline" size={24} color="#fff" />
          <Text style={styles.addChildButtonText}>Create New Child Account</Text>
        </TouchableOpacity>

        <Text style={[styles.listHeader, { color: theme.text }]}>
            Linked Children ({children.length})
        </Text>
        
        {/* --- CHILD LIST DISPLAY --- */}
        <ChildListContent />

        {/* --- Information Box --- */}
        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#222' : 'rgba(168,50,50,0.05)' }]}>
          <Text style={[styles.infoTitle, { color: theme.header }]}>Tracking Note</Text>
          <Text style={[styles.infoText, { color: theme.secondaryText }]}>
            * Click any child's name above to view their real-time location map.
          </Text>
          <Text style={[styles.infoText, { color: theme.secondaryText, marginTop: 10 }]}>
            * Tracking requires the child's device to have the app running.
          </Text>
        </View>
      </ScrollView>

      {/* MODAL REMOVED */}
    </SafeAreaView>
  );
};

// --------------------------- REVISED STYLES ---------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContainer: { 
    paddingBottom: 40,
    alignItems: "center" 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 15
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { color: "#fff", marginLeft: 5, fontSize: 16, fontWeight: "500" },
  themeToggle: { padding: 5 },
  
  // Titles
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginTop: 20,
    textAlign: 'center'
  },
  subtitle: { 
    fontSize: 15, 
    marginBottom: 20, 
    textAlign: 'center',
    paddingHorizontal: 10 
  },

  // Add Child Button
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
  },
  addChildButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  // List Container
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 10,
  },
  listContainer: {
    width: '100%',
  },
  childItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childItemIcon: {
    backgroundColor: 'rgba(168,50,50,0.1)',
    borderRadius: 50,
    padding: 8,
    marginRight: 15,
  },
  childNameFixed: {
    // Styling applied inline
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginLeft: 10,
  },

  // Empty List State
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E0E0E0',
    marginTop: 10,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshButtonText: {
    fontSize: 14, 
    fontWeight: '600',
    marginLeft: 5 
  },

  // Info Box
  infoBox: {
    marginTop: 30,
    width: "100%",
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#A83232',
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: { fontSize: 14, lineHeight: 22 },
});

export default ParentScreen;