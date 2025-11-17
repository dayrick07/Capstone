// utils/sendOfflineSMS.js
import { Linking, Alert, Platform } from "react-native";
import axios from "axios";

export const sendOfflineSMS = async (phoneNumber, message) => {
  if (Platform.OS !== "android") return;

  try {
    // Format for API: remove + if present
    const phNumber = phoneNumber.startsWith("+63")
      ? phoneNumber.slice(1)
      : phoneNumber;

    // API fallback example (replace with your provider)
    const apiToken = "YOUR_API_TOKEN";
    await axios.post(
      "https://sms.iprogtech.com/api/v1/sms_messages",
      { api_token: apiToken, phone_number: phNumber, message },
      { headers: { "Content-Type": "application/json" } }
    );
    console.log("SMS sent via API successfully");
  } catch (err) {
    console.warn("API failed, falling back to native SMS:", err.message);

    // Android native SMS
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      Linking.openURL(smsUrl);
    } else {
      Alert.alert("SMS Error", "Cannot open SMS app on this device.");
    }
  }
};
