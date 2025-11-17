import React, { useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    Platform 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { SERVER_URL } from "../config";
import * as ImagePicker from "expo-image-picker";

export default function SignupUserScreen({ navigation }) {
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("");
    const [language, setLanguage] = useState("");
    const [birthdate, setBirthdate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [registeredUserId, setRegisteredUserId] = useState(null);

    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isMobileVerified, setIsMobileVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    const [validId, setValidId] = useState(null); // ✅ Valid ID

    const showDatePickerModal = () => setShowDatePicker(true);
    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) setBirthdate(selectedDate);
    };

    // ----------------- OTP -----------------
    const handleSendOtp = async () => {
        if (!mobile || mobile.length < 10) {
            Alert.alert("Invalid Mobile", "Please enter a valid mobile number.");
            return;
        }
        setOtpLoading(true);
        try {
            const response = await axios.post(`${SERVER_URL}/otp/send`, { mobile });
            if (response.data.success) {
                setIsOtpSent(true);
                Alert.alert("Success", "OTP sent! Check your phone.");
            } else {
                Alert.alert("Error", response.data.message);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to send OTP. Server or service error.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!mobile || !otp || otp.length !== 6) {
            Alert.alert("Invalid OTP", "Please enter the 6-digit OTP.");
            return;
        }
        setOtpLoading(true);
        try {
            const response = await axios.post(`${SERVER_URL}/otp/verify`, { mobile, otp });
            if (response.data.success) {
                setIsMobileVerified(true);
                Alert.alert("Success", "Mobile number verified successfully!");
            } else {
                Alert.alert("Verification Failed", response.data.message);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to verify OTP. Server or service error.");
        } finally {
            setOtpLoading(false);
        }
    };

    // ----------------- Valid ID Picker -----------------
   const pickValidId = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'We need access to your media library to pick an ID.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    setValidId(result.assets[0]); // setValidId is your state setter
  }
}


    // ----------------- Registration -----------------
const handleRegister = async () => {
  if (!fullName || !email || !password || !validId) return Alert.alert("Fill all fields and select ID");

  const formData = new FormData();
  formData.append('name', fullName);
  formData.append('email', email);
  formData.append('password', password);
  formData.append('type', 'user');
  formData.append('gender', gender);
  formData.append('mobile', mobile);
  formData.append('language', language);
  formData.append('birthdate', birthdate.toISOString().split('T')[0]);
  formData.append('address', address);
  formData.append('validId', { uri: validId.uri, type: 'image/jpeg', name: 'valid_id.jpg' });

  const response = await axios.post(`${SERVER_URL}/users/signup`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  if (response.data.success) Alert.alert("Success", response.data.message);
};
    return (
        <LinearGradient colors={["#ee7d7dff", "#8B0000"]} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>User Registration</Text>

                <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
                <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />

                {/* Mobile + OTP */}
                <View style={styles.mobileContainer}>
                    <TextInput 
                        style={[styles.input, styles.mobileInput]}
                        placeholder="Mobile (09xxxxxxxxx)"
                        value={mobile}
                        onChangeText={text => { setMobile(text); setIsMobileVerified(false); }}
                        keyboardType="phone-pad"
                        editable={!isMobileVerified}
                    />
                    {!isMobileVerified ? (
                        <TouchableOpacity style={styles.otpButton} onPress={handleSendOtp} disabled={otpLoading || isOtpSent}>
                            <Text style={styles.otpText}>{isOtpSent ? "Resend OTP" : "Send OTP"}</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.verifiedText}>✅ Verified</Text>
                    )}
                </View>

                {isOtpSent && !isMobileVerified && (
                    <View style={styles.otpVerifyContainer}>
                        <TextInput
                            style={[styles.input, styles.otpInput]}
                            placeholder="Enter OTP"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                        <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOtp} disabled={otpLoading}>
                            <Text style={styles.otpText}>Verify</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />

                <View style={styles.picker}>
                    <Picker selectedValue={gender} onValueChange={setGender}>
                        <Picker.Item label="Select Gender" value="" />
                        <Picker.Item label="Male" value="Male" />
                        <Picker.Item label="Female" value="Female" />
                        <Picker.Item label="Other" value="Other" />
                    </Picker>
                </View>

                <View style={styles.picker}>
                    <Picker selectedValue={language} onValueChange={setLanguage}>
                        <Picker.Item label="Select Language" value="" />
                        <Picker.Item label="Tagalog" value="Tagalog" />
                        <Picker.Item label="Kapampangan" value="Kapampangan" />
                        <Picker.Item label="English" value="English" />
                    </Picker>
                </View>

                {/* Date Picker */}
                <TouchableOpacity style={styles.datePickerBtn} onPress={showDatePickerModal}>
                    <Text style={styles.datePickerText}>Birthdate: {birthdate.toDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && <DateTimePicker value={birthdate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />}

                {/* Valid ID Upload */}
                <View style={{ marginBottom: 15 }}>
                    <Text style={{ color: '#fff', marginBottom: 8, fontWeight: 'bold' }}>Upload Valid ID</Text>
                    <TouchableOpacity 
                        style={[styles.input, { justifyContent: 'center', alignItems: 'center' }]} 
                        onPress={pickValidId}
                    >
                        <Text style={{ color: validId ? '#000' : '#888' }}>
                            {validId ? 'ID Selected ✅' : 'Tap to select ID'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

                <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading || !isMobileVerified}>
                    <Text style={styles.registerText}>{loading ? "Registering..." : "Register"}</Text>
                </TouchableOpacity>

                {registeredUserId && (
                    <Text style={styles.successMsg}>
                        Registration Complete! Your User ID: {registeredUserId}
                    </Text>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 25 },

    input: {
        backgroundColor: "#fff",
        borderRadius: 15,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginBottom: 15,
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
    },

    picker: {
        backgroundColor: "#fff",
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
    },

    datePickerBtn: {
        backgroundColor: "#fff",
        borderRadius: 15,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
    },
    datePickerText: { color: "#000", fontSize: 16 },

    registerBtn: {
        backgroundColor: "#fff",
        paddingVertical: 16,
        borderRadius: 20,
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5
    },
    registerText: { textAlign: "center", fontWeight: "bold", fontSize: 20, color: "#000" },
    successMsg: { marginTop: 20, textAlign: "center", color: "#fff", fontWeight: "bold" },

    mobileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    mobileInput: { flex: 1, marginBottom: 0, marginRight: 8 },
    otpButton: { backgroundColor: '#f6c770', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
    otpText: { fontWeight: "bold", color: "#000", fontSize: 14 },
    verifiedText: { backgroundColor: 'rgba(0,255,0,0.2)', padding: 12, borderRadius: 15, color: "#fff", fontWeight: "bold", fontSize: 14, textAlign: "center" },
    otpVerifyContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    otpInput: { flex: 1, marginBottom: 0, marginRight: 8 },
    verifyButton: { backgroundColor: '#70f6c7', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 }
});
