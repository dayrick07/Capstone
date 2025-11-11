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
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { SERVER_URL } from "../config";

export default function ChildSignupScreen({ route, navigation }) {
    const { parentId } = route.params;

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("");
    const [birthdate, setBirthdate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // OTP states
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isMobileVerified, setIsMobileVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    const showDatePickerModal = () => setShowDatePicker(true);
    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) setBirthdate(selectedDate);
    };

    // ---------------- OTP Handlers ----------------
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
            Alert.alert("Error", "Failed to send OTP. Server error.");
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
                Alert.alert("Success", "Mobile verified successfully!");
            } else {
                Alert.alert("Verification Failed", response.data.message);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to verify OTP. Server error.");
        } finally {
            setOtpLoading(false);
        }
    };

    // ---------------- Registration ----------------
    const handleSignup = async () => {
        if (!isMobileVerified) {
            Alert.alert("Verification Required", "Please verify mobile before signing up.");
            return;
        }
        if (!name || !email || !password || !gender) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
            return;
        }

        try {
            const response = await axios.post(`${SERVER_URL}/children/signup`, {
                parentId,
                name,
                email,
                password,
                gender,
                birthdate: birthdate.toISOString().split("T")[0],
                mobile
            });

            if (response.data.success) {
                Alert.alert("Success", "Child account created successfully!", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Error", response.data.message || "Failed to create account.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Server error. Please try again later.");
        }
    };

    return (
        <LinearGradient colors={["#ee7d7dff", "#8B0000"]} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.title}>Create Child Account</Text>

                <TextInput 
                    style={styles.input} 
                    placeholder="Child Name" 
                    value={name} 
                    onChangeText={setName} 
                />

                <TextInput 
                    style={styles.input} 
                    placeholder="Email" 
                    value={email} 
                    onChangeText={setEmail} 
                    keyboardType="email-address" 
                />

                {/* Mobile Input with OTP */}
                <View style={styles.mobileContainer}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Mobile (09xxxxxxxxx)"
                        value={mobile}
                        onChangeText={(text) => { setMobile(text); setIsMobileVerified(false); }}
                        keyboardType="phone-pad"
                        editable={!isMobileVerified}
                    />
                    {!isMobileVerified ? (
                        <TouchableOpacity style={styles.otpButton} onPress={handleSendOtp} disabled={otpLoading || isOtpSent}>
                            <Text style={styles.otpButtonText}>{isOtpSent ? "Resend OTP" : "Send OTP"}</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.verifiedText}>✅ Verified</Text>
                    )}
                </View>

                {isOtpSent && !isMobileVerified && (
                    <View style={styles.mobileContainer}>
                        <TextInput 
                            style={[styles.input, { flex: 1 }]} 
                            placeholder="Enter 6-digit OTP" 
                            value={otp} 
                            onChangeText={setOtp} 
                            keyboardType="numeric"
                            maxLength={6} 
                        />
                        <TouchableOpacity style={styles.otpButton} onPress={handleVerifyOtp} disabled={otpLoading}>
                            <Text style={styles.otpButtonText}>Verify</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.pickerContainer}>
                    <Picker selectedValue={gender} onValueChange={setGender}>
                        <Picker.Item label="Select Gender" value="" />
                        <Picker.Item label="Male" value="Male" />
                        <Picker.Item label="Female" value="Female" />
                        <Picker.Item label="Other" value="Other" />
                    </Picker>
                </View>

                <TouchableOpacity style={styles.datePickerButton} onPress={showDatePickerModal}>
                    <Text style={styles.datePickerText}>Birthdate: {birthdate.toDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={birthdate}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={onDateChange}
                    />
                )}

                <TextInput 
                    style={styles.input} 
                    placeholder="Password" 
                    secureTextEntry 
                    value={password} 
                    onChangeText={setPassword} 
                />

                <TouchableOpacity style={styles.registerButton} onPress={handleSignup}>
                    <Text style={styles.registerText}>Create Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 },
    input: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16 },
    pickerContainer: { backgroundColor: "#fff", borderRadius: 10, marginBottom: 15 },
    datePickerButton: { backgroundColor: "#fff", borderRadius: 10, padding: 15, marginBottom: 15 },
    datePickerText: { color: "#000" },
    registerButton: { backgroundColor: "#fff", paddingVertical: 15, borderRadius: 10, marginTop: 10 },
    registerText: { textAlign: "center", fontWeight: "bold", fontSize: 20 },
    mobileContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    otpButton: { backgroundColor: "#f6c770", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
    otpButtonText: { fontWeight: "bold", color: "#000", fontSize: 12 },
    verifiedText: { color: "white", fontWeight: "bold", marginLeft: 10 },
});
