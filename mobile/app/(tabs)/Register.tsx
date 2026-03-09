import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../config";

type RootStackParamList = {
  Login: undefined;
  Home: { username: string };
  Register: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Register: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("Resident");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required to get your current address.");
        setLocationLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const results = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (results.length > 0) {
        const addr = results[0];
        const formatted = `${addr.name || ""} ${addr.street || ""}, ${addr.city || addr.subregion || ""}, ${addr.region || ""}, ${addr.postalCode || ""}`;
        setAddress(formatted.trim());
      } else {
        Alert.alert("Error", "Unable to determine address from current location");
      }
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Location Error", "Unable to get current location. Please try again or enter address manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address");
      return;
    }
    setVerificationLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/pre-register-send-code`, { email });
      if (response.data.success) {
        Alert.alert("Success", "Verification code sent to your email.");
        setVerificationSent(true);
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert("Error", response.data.message || "Failed to send code.");
      }
    } catch (error: any) {
      console.error("Email verification error:", error);
      if (error.response) {
        const serverMessage = error.response.data?.message || "Invalid email request.";
        Alert.alert("Verification Error", serverMessage);
      } else {
        Alert.alert("Error", "Could not reach the server. Check your BASE_URL.");
      }
    } finally {
      setVerificationLoading(false);
    }
  };


  const handleVerifyCode = async () => {
    if (!emailVerificationCode) {
      Alert.alert("Missing Code", "Please enter the verification code.");
      return;
    }
    setVerificationLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/pre-register-verify-code`, {
        email,
        code: emailVerificationCode,
      });
      if (response.data.success) {
        Alert.alert("Success", "Email verified successfully!");
        setEmailVerified(true);
      } else {
        Alert.alert("Error", response.data.message || "Invalid verification code.");
      }
    } catch (error) {
      console.error("Email verification error:", error);
      Alert.alert("Error", "Could not verify code. Please try again.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate all required fields
    if (!username || !password || !name || !email || !address) {
      Alert.alert("Missing fields", "Please fill all required fields");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address");
      return;
    }

    if (!emailVerified) {
      Alert.alert("Email Not Verified", "Please verify your email address before registering.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/register`, {
        username,
        password,
        role,
        name,
        email,
        address,
        emailVerified: true, // Add this field to match web registration
        clientType: "mobile", // Specify client type for the backend
      });

      if (response.data.success) {
        Alert.alert("Success", "Account created successfully. Please wait for admin approval");
        navigation.replace("Login");
      } else {
        Alert.alert("Error", response.data.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration Error:", error);
      if (error.response) {
        const serverMessage = error.response.data?.message || error.response.data?.error;
        if (error.response.status === 409) {
          Alert.alert("Error", "Username already exists.");
        } else if (error.response.status === 403) {
          Alert.alert(
            "Registration Forbidden",
            serverMessage || "You are not permitted to register at this time."
          );
        } else {
          Alert.alert("Error", serverMessage || "Something went wrong. Please try again later.");
        }
      } else {
        Alert.alert("Connection Error", "Could not reach the server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.box}>
          <View style={styles.headerSection}>
            <Image
              source={require('./logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>PatrolNet</Text>
            <Text style={styles.appSubtitle}>Emergency Response System</Text>
            <Text style={styles.welcomeText}>Mobile Access - Tanod & Residents</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.inputBox}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your complete legal name"
                  placeholderTextColor="#ffffffff"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OFFICER ID / USERNAME</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🆔</Text>
                <TextInput
                  style={styles.inputBox}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose unique identifier"
                  placeholderTextColor="#ffffffff"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SECURE PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.inputBox}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create strong password"
                  placeholderTextColor="#ffffffff"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONTACT EMAIL</Text>
              <View style={styles.emailInputContainer}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="official.email@domain.com"
                    placeholderTextColor="#ffffffff"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!emailVerified}
                  />
                  {emailVerified && (
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  )}
                </View>
                {!emailVerified && (
                  <TouchableOpacity
                    style={[styles.verifyButton, (verificationLoading || resendCooldown > 0) && styles.verifyButtonDisabled]}
                    onPress={handleSendVerificationCode}
                    disabled={verificationLoading || resendCooldown > 0}
                  >
                    {verificationLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.verifyButtonText}>
                        {verificationSent
                          ? resendCooldown > 0
                            ? `Resend (${resendCooldown})`
                            : "Resend"
                          : "Send Code"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {verificationSent && !emailVerified && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
                <View style={styles.emailInputContainer}>
                  <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputIcon}>🔑</Text>
                    <TextInput
                      style={styles.inputBox}
                      value={emailVerificationCode}
                      onChangeText={setEmailVerificationCode}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="#ffffffff"
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.verifyButton, verificationLoading && styles.verifyButtonDisabled]}
                    onPress={handleVerifyCode}
                    disabled={verificationLoading}
                  >
                    {verificationLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.verifyButtonText}>Verify</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SERVICE AREA / ADDRESS</Text>
              <View style={styles.addressInputContainer}>
                <View style={styles.addressWrapper}>
                  <Text style={styles.inputIcon}>📍</Text>
                  <TextInput
                    style={styles.addressInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter service area or use GPS location"
                    placeholderTextColor="#ffffffff"
                    multiline={true}
                    numberOfLines={2}
                  />
                </View>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleUseCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.locationIcon}>🎯</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ACCOUNT TYPE</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerIcon}>👮‍♂️</Text>
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="🏠 Community Resident" value="Resident" />
                  <Picker.Item label="🚔 Barangay Tanod Officer" value="Tanod" />
                </Picker>
              </View>
              <Text style={styles.roleDescription}>
                {role === 'Resident'
                  ? 'Report incidents and receive safety alerts'
                  : 'Respond to emergencies and manage reports'
                }
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.loadingText}>CREATING ACCOUNT...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.registerButtonText}>CREATE ACCOUNT</Text>
                  <Text style={styles.buttonArrow}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityIcon}>🛡️</Text>
              <Text style={styles.securityText}>
                Your information is encrypted and verified for security
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Already have credentials?</Text>
              <TouchableOpacity
                onPress={() => navigation.replace("Login")}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← RETURN TO LOGIN</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms Notice */}
          <View style={styles.termsNotice}>
            <Text style={styles.termsText}>
              By creating an account, you agree to PatrolNet's security protocols and community safety guidelines
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  box: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  logoInner: {
    width: 80,
    height: 80,
    backgroundColor: "#DC2626",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FEF2F2",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  logoAccent: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 4,
  },
  logoGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    top: 0,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 18,
    color: "#E2E8F0",
    fontWeight: "600",
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "400",
  },
  formContainer: {
    width: "100%",
    marginBottom: 24,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    color: "#DC2626",
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    color: "#ffffffff",
  },
  inputBox: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    paddingVertical: 12,
  },
  addressInputContainer: {
    width: "100%",
  },
  addressWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlignVertical: "top",
    marginLeft: 10,
  },
  emailInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifyButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  locationButton: {
    width: 50,
    height: 40,
    backgroundColor: "#DC2626",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  locationIcon: {
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    minHeight: 50,
  },
  pickerIcon: {
    fontSize: 16,
    marginRight: 10,
    color: "#ffffffff",
  },
  picker: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  roleDescription: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
    marginTop: 4,
    paddingLeft: 4,
  },
  registerButton: {
    width: "100%",
    height: 54,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.8,
    marginRight: 8,
  },
  buttonArrow: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 16,
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#22C55E",
    lineHeight: 16,
  },
  footerSection: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: "#ffffffff",
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
  termsNotice: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  termsText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50, // Makes it circular if your logo is square
    marginBottom: 24,
    backgroundColor: "#3B82F6", // Optional fallback
  },
});

export default Register;