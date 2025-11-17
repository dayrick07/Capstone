import React, { useState } from "react"; 
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    Platform,
    Image
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
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
    const [stationLocation, setStationLocation] = useState("");
    const [marker, setMarker] = useState({ latitude: 15.0330, longitude: 120.6849 });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- OTP States ---
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isMobileVerified, setIsMobileVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // --- ID Upload State ---
    const [validIdPath, setValidIdPath] = useState(null);

    const showDatePickerModal = () => setShowDatePicker(true);
    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) setBirthdate(selectedDate);
    };

    const handleMapPress = (e) => setMarker(e.nativeEvent.coordinate);

    // ----------------- OTP Logic -----------------
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
        setValidIdPath(result.assets[0]);
      }
    }
    // ---------------------------------------------

    const handleSignup = async () => {
      if (!name || !email || !password || !address || !stationLocation) {
        return Alert.alert("Missing Fields", "Please fill in all required fields.");
      }
      if (!isMobileVerified) {
        return Alert.alert("Verification Required", "Please verify your mobile number before registering.");
      }
      if (!validIdPath) {
        return Alert.alert("ID Required", "Please upload a valid ID before signing up.");
      }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("type", type);
        formData.append("gender", gender);
        formData.append("mobile", mobile);
        formData.append("language", language);
        formData.append("birthdate", birthdate.toISOString().split("T")[0]);
        formData.append("address", address);
        formData.append("stationLocation", stationLocation);
        formData.append("latitude", marker.latitude.toString());
        formData.append("longitude", marker.longitude.toString());
        formData.append("contact", mobile);

        const fileExt = validIdPath.uri.split('.').pop();
        const mimeType = fileExt === "png" ? "image/png" : "image/jpeg";

        formData.append("validIdPath", {
          uri: validIdPath.uri,
          name: `${name.replace(/\s+/g, "_")}_ID.${fileExt}`,
          type: mimeType,
        });

        const response = await axios.post(`${SERVER_URL}/rescuers/signup`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        if (response.data.success) {
          Alert.alert("Signup Success", response.data.message);
          navigation.goBack();
        } else {
          Alert.alert("Signup Failed", response.data.message);
        }
      } catch (error) {
        console.error("Signup Error:", error.message, error.response?.data);
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

                {/* --- Mobile + OTP --- */}
                <View style={styles.mobileContainer}>
                    <TextInput 
                        style={[styles.input, styles.mobileInput]} 
                        placeholder="Mobile (09xxxxxxxxx)" 
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

                <TextInput style={styles.input} placeholder="Language" value={language} onChangeText={setLanguage} />

                <TouchableOpacity style={styles.datePickerButton} onPress={showDatePickerModal}>
                    <Text style={styles.datePickerText}>Birthdate: {birthdate.toDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && <DateTimePicker value={birthdate} mode="date" display="default" maximumDate={new Date()} onChange={onDateChange} />}

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

                {/* --- Upload ID Button --- */}
                <TouchableOpacity style={styles.idButton} onPress={pickValidId}>
                    <Text style={styles.idButtonText}>{validIdPath ? "ID Selected ✅" : "Upload Valid ID"}</Text>
                </TouchableOpacity>
                {validIdPath && <Image source={{ uri: validIdPath.uri }} style={styles.previewImage} />}

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
    mapLabel: { fontSize: 16, marginBottom: 5, marginTop: 10, color: "#fff" },
    map: { width: "100%", height: 200, marginBottom: 15, borderRadius: 15 },
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
    mobileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    mobileInput: { flex: 1, marginBottom: 0, marginRight: 8 },
    otpButton: { backgroundColor: '#f6c770', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
    otpText: { fontWeight: "bold", color: "#000", fontSize: 14 },
    verifiedText: { backgroundColor: 'rgba(0,255,0,0.2)', padding: 12, borderRadius: 15, color: "#fff", fontWeight: "bold", fontSize: 14, textAlign: "center" },
    otpVerifyContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    otpInput: { flex: 1, marginBottom: 0, marginRight: 8, padding: 12 },
    verifyButton: { backgroundColor: '#70f6c7', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
    verifyText: { fontWeight: "bold", color: "#000", fontSize: 14 },

    // ID upload button
    idButton: {
        backgroundColor: "#3498db",
        paddingVertical: 14,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3
    },
    idButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
    previewImage: { width: "100%", height: 200, borderRadius: 15, marginBottom: 15 }
});
