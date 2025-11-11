import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LoginScreen from "./screens/LoginScreen";
import SignupUserScreen from "./screens/SignupUserScreen";
import DashboardScreen from "./screens/DashboardScreen";
import UserPageScreen from "./screens/UserPageScreen";
import SetupScreen from "./screens/SetupScreen";
import RecordVideoScreen from "./screens/RecordVideoScreen";
import AlbumScreen from "./screens/AlbumScreen";
import VoiceSetupScreen from "./screens/VoiceSetupScreen";
import PhysicalGestureSetupScreen from "./screens/PhysicalGestureSetupScreen";
import CPRScreen from "./screens/CPRScreen";
import WoundCareScreen from "./screens/WoundCareScreen";
import SkinBurnScreen from "./screens/SkinBurnScreen";
import TutorialScreen from "./screens/TutorialScreen";
import ReachOutScreen from "./screens/ReachOutScreen";
import FeedbackScreen from "./screens/FeedbackScreen";
import SettingsScreen from "./screens/SettingsScreen";




import ContactListScreen from "./screens/ContactListScreen";
import CreateContactScreen from "./screens/CreateContactScreen";
import NearbyRescuerScreen from "./screens/NearbyRescuerScreen";
import RescuerSignupScreen from "./screens/RescuerSignupScreen";
import RescuerHomeScreen from "./screens/RescuerHomeScreen";
import RescuerPageScreen from "./screens/RescuerPageScreen";
import IncidentMapScreen from "./screens/IncidentMapScreen";
import RescuerHistoryScreen from "./screens/RescuerHistoryScreen";
import ParentScreen from "./screens/ParentScreen";
import ChildSignupScreen from "./screens/ChildSignupScreen";
import ChildDashboardScreen from "./screens/ChildDashboardScreen";
import ParentChildLocationScreen from "./screens/ParentChildLocationScreen";
// Context & Global Listener
import { ThemeProvider } from "./ThemeContext";
// 💡 REQUIRED FOR GLOBAL GESTURE DETECTION
import { AuthProvider } from './screens/AuthContext'; 
import { GestureDetectionProvider } from "./screens/GestureDetectionContext"; 
import GlobalListener from "./GlobalListener"; 


// Stack Navigator
const Stack = createNativeStackNavigator();

// A wrapper component to hold the navigator and listener
const NavigationRoot = () => {
    return (
        <NavigationContainer>
            {}
            <GlobalListener /> 
            
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
                <Stack.Screen name="SignupUserScreen" component={SignupUserScreen} />
                <Stack.Screen name="RescuerSignupScreen" component={RescuerSignupScreen} />

                {/* Main Screens */}
                <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
                <Stack.Screen name="UserPageScreen" component={UserPageScreen} />
                <Stack.Screen name="Setup" component={SetupScreen} />
                <Stack.Screen name="ParentScreen" component={ParentScreen} />
                <Stack.Screen name="ChildSignupScreen" component={ChildSignupScreen} />
                <Stack.Screen name="ChildDashboardScreen" component={ChildDashboardScreen} />
                <Stack.Screen name="ParentChildLocationScreen" component={ParentChildLocationScreen} />
                {/* Setup Options */}
                <Stack.Screen name="VoiceSetupScreen" component={VoiceSetupScreen} />
                <Stack.Screen name="PhysicalGestureSetupScreen" component={PhysicalGestureSetupScreen} />
                <Stack.Screen name="NearbyRescuerScreen" component={NearbyRescuerScreen} />
                <Stack.Screen name="IncidentMapScreen" component={IncidentMapScreen} />

                {/* Tutorial & Help Screens */}
                <Stack.Screen name="CPRScreen" component={CPRScreen} />
                <Stack.Screen name="WoundCareScreen" component={WoundCareScreen} />
                <Stack.Screen name="SkinBurnScreen" component={SkinBurnScreen} />
                <Stack.Screen name="TutorialScreen" component={TutorialScreen} />
                <Stack.Screen name="ReachOutScreen" component={ReachOutScreen} />
                <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
                <Stack.Screen name="SettingsScreen" component={SettingsScreen} />

                {/* Optional / Future Screens */}
                <Stack.Screen name="RecordVideoScreen" component={RecordVideoScreen} />
                <Stack.Screen name="Album" component={AlbumScreen} />

                {/**/}
                <Stack.Screen name="ContactListScreen" component={ContactListScreen} />
                <Stack.Screen name="CreateContactScreen" component={CreateContactScreen} />
                <Stack.Screen name="RescuerHomeScreen" component={RescuerHomeScreen} />
                <Stack.Screen name="RescuerPageScreen" component={RescuerPageScreen} />
                <Stack.Screen name="RescuerHistoryScreen" component={RescuerHistoryScreen} />

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    return (
        <ThemeProvider>
            {/* 1. AuthProvider: Manages Login State (isLoggedIn) */}
            <AuthProvider> 
                {/* 2. GestureDetectionProvider: Consumes Auth state to run detector hook */}
                <GestureDetectionProvider> 
                    <NavigationRoot />
                </GestureDetectionProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}