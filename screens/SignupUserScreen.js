import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SignupUserScreen({ navigation }) {
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('');

  return (
    <LinearGradient colors={['#ee7d7dff', '#8B0000']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-circle" size={40} color="black" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.header}>Registration</Text>
        <Text style={styles.subheader}>(Only for San Fernando, Pampanga Citizens)</Text>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="Enter full name" placeholderTextColor="#777" />

        {/* Address */}
        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} placeholder="Enter address" placeholderTextColor="#777" />

        {/* Mobile Number & OTP */}
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 2 }]} placeholder="Enter number" keyboardType="phone-pad" placeholderTextColor="#777" />
          <TouchableOpacity style={styles.otpButton}>
            <Text style={styles.otpText}>Send</Text>
          </TouchableOpacity>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="OTP" placeholderTextColor="#777" />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="Enter email" placeholderTextColor="#777" keyboardType="email-address" />

        {/* Gender */}
        <Text style={styles.label}>Gender:</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.radio} onPress={() => setGender('Male')}>
            <Ionicons name={gender === 'Male' ? 'radio-button-on' : 'radio-button-off'} size={20} color="black" />
            <Text style={styles.radioText}> Male</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radio} onPress={() => setGender('Female')}>
            <Ionicons name={gender === 'Female' ? 'radio-button-on' : 'radio-button-off'} size={20} color="black" />
            <Text style={styles.radioText}> Female</Text>
          </TouchableOpacity>
        </View>

        {/* Birthdate */}
        <Text style={styles.label}>Birthdate</Text>
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="MM/DD/YYYY" placeholderTextColor="#777" />
          <Ionicons name="calendar" size={30} color="black" style={{ marginLeft: 10 }} />
        </View>

        {/* Language */}
        <View style={styles.row}>
          {['English', 'Tagalog', 'Kapampangan'].map((lang) => (
            <TouchableOpacity key={lang} style={styles.radio} onPress={() => setLanguage(lang)}>
              <Ionicons name={language === lang ? 'radio-button-on' : 'radio-button-off'} size={20} color="black" />
              <Text style={styles.radioText}> {lang}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#777" secureTextEntry />

        {/* Upload ID */}
        <Text style={styles.label}>Upload 1 Government ID</Text>
        <View style={styles.row}>
          <Image source={require('../assets/sample_id.png')} style={styles.idImage} />
          <TouchableOpacity style={styles.uploadBox}>
            <Ionicons name="add" size={40} color="black" />
          </TouchableOpacity>
        </View>

        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerText}>Register!</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  backButton: { marginBottom: 10 },
  header: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  subheader: { 
    fontSize: 14, 
    color: '#fff', 
    textAlign: 'center', 
    marginBottom: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  label: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 10, 
    marginTop: 5 
  },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  otpButton: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 10, 
    justifyContent: 'center', 
    borderRadius: 10, 
    marginHorizontal: 5 
  },
  otpText: { 
    color: '#000', 
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1
  },
  radio: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  radioText: { 
    color: '#fff', 
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  idImage: { width: 80, height: 50, borderRadius: 5, marginRight: 10 },
  uploadBox: { 
    backgroundColor: '#fff', 
    width: 50, 
    height: 50, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  registerButton: { 
    backgroundColor: '#fff', 
    paddingVertical: 15, 
    borderRadius: 10, 
    marginTop: 20 
  },
  registerText: { 
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 29, 
    color: '#000',
  },
});
