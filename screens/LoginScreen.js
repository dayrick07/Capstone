import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <LinearGradient
      colors={['#ee7d7dff', '#ff1a1a']}
      style={styles.container}
    >
      {/* App Title */}
      <Text style={styles.appTitle}>Safe ka Fernandino!</Text>
      
      {/* Logo */}
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
      />

      {/* Location under Logo */}
      <Text style={styles.locationText}>Only in San Fernando, Pampanga</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#fff"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#fff"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

     {/* Login Button */}
      <TouchableOpacity style={styles.loginbutton} onPress={() => navigation.navigate('DashboardScreen')}>
         <Text style={styles.buttonText}>Login</Text>
           </TouchableOpacity>

      {/* Bottom Signup Buttons */}
      <View style={styles.bottomButtons}>
        {/* Signup for Citizens */}
        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={() => navigation.navigate('SignupUserScreen')}
        >
          <Text style={styles.signupButtonText}>Bago ka dito? Sign up muna!</Text>
        </TouchableOpacity>

        {/* Signup for Rescuers */}
        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={() => navigation.navigate('SignupRescuerScreen')}
        >
          <Text style={styles.signupButtonText}>Sign up (For Rescuers only)</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
    resizeMode: 'contain',
  },
    locationText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  loginbutton: {
    width: '100%',
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff1a1a',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  signupButton: {
    width: '90%',
    height: 50,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
