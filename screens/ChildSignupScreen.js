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

    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isMobileVerified, setIsMobileVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    const showDatePickerModal = () => setShowDatePicker(true);
    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) setBirthdate(selectedDate);
    };

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
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>Create Child Account</Text>

                <TextInput style={styles.input} placeholder="Child Name" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />

                <View style={styles.mobileContainer}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Mobile (09xxxxxxxxx)"
                        value={mobile}
                        onChangeText={text => { setMobile(text); setIsMobileVerified(false); setIsOtpSent(false); }}
                        keyboardType="phone-pad"
                        editable={!isMobileVerified}
                    />
                    {!isMobileVerified ? (
                        <TouchableOpacity style={styles.otpButton} onPress={handleSendOtp} disabled={otpLoading || (isOtpSent && otpLoading)}>
                            <Text style={styles.otpText}>{isOtpSent ? "Resend OTP" : "Send OTP"}</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.verifiedText}>✅ Verified</Text>
                    )}
                </View>

                {isOtpSent && !isMobileVerified && (
                    <View style={styles.mobileContainer}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Enter OTP"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                        <TouchableOpacity style={styles.otpButton} onPress={handleVerifyOtp} disabled={otpLoading}>
                            <Text style={styles.otpText}>{otpLoading ? "Verifying..." : "Verify"}</Text>
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

                <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

                <TouchableOpacity style={styles.registerButton} onPress={handleSignup}>
                    <Text style={styles.registerText}>Create Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20 },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 20 },
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
    pickerContainer: {
        backgroundColor: "#fff",
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
    },
    datePickerButton: {
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
    registerButton: {
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
    mobileContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
    otpButton: {
        backgroundColor: "#f6c770",
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3
    },
    otpText: { fontWeight: "bold", color: "#000", fontSize: 14 },
    verifiedText: { color: "#fff", fontWeight: "bold", marginLeft: 10, fontSize: 14 }
});
