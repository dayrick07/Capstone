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

    // ----------------- Registration -----------------
    const handleRegister = async () => {
        if (!isMobileVerified) {
            Alert.alert("Verification Required", "Please verify your mobile number before registering.");
            return;
        }
        if (!fullName || !address || !email || !password || !gender || !language || !birthdate) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
            return;
        }

        setLoading(true);
        const userData = {
            name: fullName,
            email: email,
            password: password,
            type: 'user',
            gender: gender,
            mobile: mobile,
            language: language,
            birthdate: birthdate.toISOString().split("T")[0],
            address: address,
        };

        try {
            const response = await axios.post(`${SERVER_URL}/users/signup`, userData);
            if (response.data.success) {
                setRegisteredUserId(response.data.userId);
                Alert.alert("Success", `${response.data.message}\nYour User ID is: ${response.data.userId}`);
                navigation.replace("LoginScreen");
            } else {
                Alert.alert("Error", response.data.message);
            }
        } catch (error) {
            console.error("Registration Error:", error.response ? error.response.data : error.message);
            Alert.alert("Error", `Unable to register. ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={["#ee7d7dff", "#8B0000"]} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
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
    title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 },
    input: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 12 },
    picker: { backgroundColor: "#fff", borderRadius: 10, marginBottom: 12 },
    datePickerBtn: { backgroundColor: "#fff", borderRadius: 10, padding: 15, marginBottom: 12 },
    datePickerText: { color: "#000" },
    registerBtn: { backgroundColor: "#fff", paddingVertical: 15, borderRadius: 10, marginTop: 10 },
    registerText: { textAlign: "center", fontWeight: "bold", fontSize: 20, color: "#000" },
    successMsg: { marginTop: 20, textAlign: "center", color: "#fff", fontWeight: "bold" },

    mobileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    mobileInput: { flex: 1, marginBottom: 0, marginRight: 8 },
    otpButton: { backgroundColor: '#f6c770', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
    otpText: { fontWeight: "bold", color: "#000" },
    verifiedText: { backgroundColor: 'rgba(0,255,0,0.2)', padding: 10, borderRadius: 10, color: "#fff", fontWeight: "bold" },
    otpVerifyContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    otpInput: { flex: 1, marginBottom: 0, marginRight: 8 },
    verifyButton: { backgroundColor: '#70f6c7', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
});
