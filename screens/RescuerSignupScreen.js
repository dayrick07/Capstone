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
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SERVER_URL } from "../config";

export default function RescuerSignupScreen({ navigation }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [type, setType] = useState("Police");
    const [gender, setGender] = useState("Male");
    const [mobile, setMobile] = useState("");
    const [language, setLanguage] = useState("");
    const [birthdate, setBirthdate] = useState(new Date());
    const [address, setAddress] = useState("");
    const [stationLocation, setStationLocation] = useState(""); // station name
    const [marker, setMarker] = useState({ latitude: 15.0330, longitude: 120.6849 }); // default center
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- OTP States ---
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isMobileVerified, setIsMobileVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    // ------------------

    const showDatePickerModal = () => setShowDatePicker(true);
    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) setBirthdate(selectedDate);
    };

    const handleMapPress = (e) => {
        setMarker(e.nativeEvent.coordinate);
    };

    // ----------------- OTP Logic -----------------
    const handleSendOtp = async () => {
        if (!mobile || mobile.length < 10) {
            Alert.alert("Invalid Mobile", "Please enter a valid mobile number.");
            return;
        }
        setOtpLoading(true);
        try {
            // NOTE: Update the mobile field in the state with the server-side validated one if necessary
            const response = await axios.post(`${SERVER_URL}/otp/send`, { mobile }); 
            if (response.data.success) {
                setIsOtpSent(true);
                Alert.alert("Success", "OTP sent! Check your phone.");
            } else {
                Alert.alert("Error", response.data.message);
            }
        } catch (error) {
            console.error("Send OTP Error:", error.message);
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
            console.error("Verify OTP Error:", error.message);
            Alert.alert("Error", "Failed to verify OTP. Server or service error.");
        } finally {
            setOtpLoading(false);
        }
    };
    // ---------------------------------------------

    const handleSignup = async () => {
        if (!name || !email || !password || !address || !stationLocation) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
            return;
        }

        // --- NEW: Check for mobile verification ---
        if (!isMobileVerified) {
            Alert.alert("Verification Required", "Please verify your mobile number before registering.");
            return;
        }
        // ------------------------------------------

        setLoading(true);
        try {
            const response = await axios.post(`${SERVER_URL}/rescuers/signup`, {
                name,
                email,
                password,
                type,
                gender,
                mobile,
                language,
                birthdate: birthdate.toISOString().split("T")[0],
                address,
                stationLocation,
                latitude: marker.latitude,
                longitude: marker.longitude,
                contact: mobile
            });

            if (response.data.success) {
                Alert.alert("Signup Success", response.data.message);
                navigation.goBack();
            } else {
                Alert.alert("Signup Failed", response.data.message);
            }
        } catch (error) {
            console.error("Signup Error:", error.message);
            Alert.alert("Signup Failed", "Cannot connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={["#ee7d7dff", "#8B0000"]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.header}>Rescuer Registration</Text>

                <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

                <View style={styles.pickerContainer}>
                    <Picker selectedValue={type} onValueChange={setType}>
                        <Picker.Item label="Police" value="Police" />
                        <Picker.Item label="Fire Station" value="Fire Station" />
                        <Picker.Item label="Ambulance" value="Ambulance" />
                    </Picker>
                </View>

                <View style={styles.pickerContainer}>
                    <Picker selectedValue={gender} onValueChange={setGender}>
                        <Picker.Item label="Male" value="Male" />
                        <Picker.Item label="Female" value="Female" />
                    </Picker>
                </View>

                {/* --- Mobile + OTP Section --- */}
                <View style={styles.mobileContainer}>
                    <TextInput 
                        style={[styles.input, styles.mobileInput]} 
                        placeholder="Mobile (e.g., 09xxxxxxxxx)" 
                        value={mobile} 
                        onChangeText={text => { setMobile(text); setIsMobileVerified(false); setIsOtpSent(false); }} 
                        keyboardType="phone-pad" 
                        editable={!isMobileVerified}
                    />
                    {!isMobileVerified ? (
                        <TouchableOpacity style={styles.otpButton} onPress={handleSendOtp} disabled={otpLoading || (isOtpSent && otpLoading)}>
                            <Text style={styles.otpText}>{isOtpSent ? "Resend" : "Send OTP"}</Text>
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
                            <Text style={styles.verifyText}>{otpLoading ? "Verifying..." : "Verify"}</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {/* ---------------------------- */}

                <TextInput style={styles.input} placeholder="Language" value={language} onChangeText={setLanguage} />

                <TouchableOpacity style={styles.datePickerButton} onPress={showDatePickerModal}>
                    <Text style={styles.datePickerText}>Birthdate: {birthdate.toDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker value={birthdate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />
                )}

                <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
                <TextInput style={styles.input} placeholder="Station Name" value={stationLocation} onChangeText={setStationLocation} />

                <Text style={styles.mapLabel}>Pick Station Location on Map:</Text>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: 15.0330,
                        longitude: 120.6849,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    onPress={handleMapPress}
                >
                    <Marker coordinate={marker} title="Station Location" />
                </MapView>

                <TouchableOpacity style={styles.registerButton} onPress={handleSignup} disabled={loading || !isMobileVerified}>
                    <Text style={styles.registerText}>{loading ? "Signing up..." : "Sign Up"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20 },
    header: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 },
    input: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 10 },
    pickerContainer: { backgroundColor: "#fff", borderRadius: 10, marginBottom: 10 },
    datePickerButton: { backgroundColor: "#fff", borderRadius: 10, padding: 15, marginBottom: 10 },
    datePickerText: { color: "#000" },
    mapLabel: { fontSize: 16, marginBottom: 5, marginTop: 10, color: "#fff" },
    map: { width: "100%", height: 200, marginBottom: 10 },
    registerButton: { backgroundColor: "#fff", paddingVertical: 15, borderRadius: 10, marginTop: 10 },
    registerText: { textAlign: "center", fontWeight: "bold", fontSize: 24, color: "#000" },

    // --- NEW OTP Styles ---
    mobileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    mobileInput: { flex: 1, marginBottom: 0, marginRight: 8 },
    otpButton: { backgroundColor: '#f6c770', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
    otpText: { fontWeight: "bold", color: "#000", fontSize: 12 },
    verifiedText: { backgroundColor: 'rgba(0,255,0,0.2)', padding: 10, borderRadius: 10, color: "#fff", fontWeight: "bold", fontSize: 12, overflow: 'hidden' },
    otpVerifyContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    otpInput: { flex: 1, marginBottom: 0, marginRight: 8, padding: 12 },
    verifyButton: { backgroundColor: '#70f6c7', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
    verifyText: { fontWeight: "bold", color: "#000", fontSize: 12 },
    // ----------------------
});