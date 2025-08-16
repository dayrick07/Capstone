import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

//Screens
import LoginScreen from './screens/LoginScreen';
import SignupUserScreen from './screens/SignupUserScreen';
import SignupRescuerScreen from './screens/SignupRescuerScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignupUserScreen" component={SignupUserScreen} />
        <Stack.Screen name="SignupRescuerScreen" component={SignupRescuerScreen} />
        <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
