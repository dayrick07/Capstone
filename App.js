// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LoginScreen from "./screens/LoginScreen";
import SignupUserScreen from "./screens/SignupUserScreen";
import SignupRescuerScreen from "./screens/SignupRescuerScreen";
import DashboardScreen from "./screens/DashboardScreen";
import UserPageScreen from "./screens/UserPageScreen";
import SetupScreen from "./screens/SetupScreen";
import RecordVideoScreen from "./screens/RecordVideoScreen";
import AlbumScreen from "./screens/AlbumScreen";
import VoiceSetupScreen from "./screens/VoiceSetupScreen";
import PhysicalGestureSetupScreen from "./screens/PhysicalGestureSetupScreen";
import ParentalSetupScreen from "./screens/ParentalSetupScreen";
import CPRScreen from "./screens/CPRScreen";
import WoundCareScreen from "./screens/WoundCareScreen";
import SkinBurnScreen from "./screens/SkinBurnScreen";
import TutorialScreen from "./screens/TutorialScreen";
import ReachOutScreen from "./screens/ReachOutScreen";
import FeedbackScreen from "./screens/FeedbackScreen";
import SettingsScreen from "./screens/SettingsScreen";
import ParentPageScreen from "./screens/ParentPageScreen";
import CreatePinScreen from "./screens/CreatePinScreen";
import AdditionalContactsScreen from "./screens/AdditionalContactsScreen";
import MyChildrenScreen from "./screens/MyChildrenScreen";
import ParentProfileScreen from "./screens/ParentProfileScreen";
import AddChildScreen from "./screens/AddChildScreen";
import ContactListScreen from "./screens/ContactListScreen";
import CreateContactScreen from "./screens/CreateContactScreen";
import NearbyRescuerScreen from "./screens/NearbyRescuerScreen";


// Context & Global Listener
import { ThemeProvider } from "./ThemeContext";
import GlobalListener from "./GlobalListener";

// Stack Navigator
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <GlobalListener />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Authentication Screens */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignupUser" component={SignupUserScreen} />
          <Stack.Screen name="SignupRescuer" component={SignupRescuerScreen} />

          {/* Main Screens */}
          <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
          <Stack.Screen name="UserPageScreen" component={UserPageScreen} />
          <Stack.Screen name="Setup" component={SetupScreen} />

          {/* Setup Options */}
          <Stack.Screen name="VoiceSetupScreen" component={VoiceSetupScreen} />
          <Stack.Screen name="PhysicalGestureSetupScreen" component={PhysicalGestureSetupScreen} />
          <Stack.Screen name="ParentalSetupScreen" component={ParentalSetupScreen}/>
          <Stack.Screen name="NearbyRescuerScreen" component={NearbyRescuerScreen} />


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

          {/* Parent feature*/}
          <Stack.Screen name="CreatePinScreen" component={CreatePinScreen} />
          <Stack.Screen name="ParentPageScreen" component={ParentPageScreen} />
          <Stack.Screen name="MyChildrenScreen" component={MyChildrenScreen} />
          <Stack.Screen name="AdditionalContactsScreen" component={AdditionalContactsScreen} />
          <Stack.Screen name="ParentProfileScreen" component={ParentProfileScreen} />
          <Stack.Screen name="AddChildScreen" component={AddChildScreen} />
          <Stack.Screen name="ContactListScreen" component={ContactListScreen} />
          <Stack.Screen name="CreateContactScreen" component={CreateContactScreen} />


        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
