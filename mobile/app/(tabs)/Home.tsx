// Home.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image, ScrollView } from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from 'axios';
import { BASE_URL } from '../../config';
// Import Call functionality
import { Linking } from "react-native";

import NavBar from "./NavBar";
import type { RootStackParamList } from "./app"; // ✅ Use shared type from App.tsx

type HomeRouteProp = RouteProp<RootStackParamList, "Home">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

interface UserData {
  ID: string;
  USER: string;
  NAME: string;
  EMAIL: string;
  ADDRESS: string;
  ROLE: string;
  STATUS: string;
  IMAGE?: string | null;
}

class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  state = { hasError: false as boolean, message: undefined as string | undefined };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("Home screen render error:", error);
    console.error("Component stack:", info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, { justifyContent: "center", padding: 20 }]}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
            Something went wrong rendering this screen.
          </Text>
          <Text style={{ color: "#475569" }}>{this.state.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const HomeInner: React.FC = () => {
  const route = useRoute<HomeRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const username = route.params?.username || "";
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Emergency contacts - you can make this configurable or fetch from backend
  const emergencyContacts = {
    barangay: "+639123456789", // Replace with actual barangay number

  };
  
  // Fetch user data on component mount
  useEffect(() => {
    if (username) {
      fetchUserData();
    }
  }, [username]);
  
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/user/${username}`);
      
      if (response.data) {
        setUserData(response.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);     
    } finally {
      setLoading(false);
    }
  };

  // Function to make emergency call
  const makeEmergencyCall = () => {
    const phoneNumber = emergencyContacts.barangay;
    const url = `tel:${phoneNumber}`;
    
    // Direct call without checking canOpenURL (for better compatibility)
    Linking.openURL(url).catch((err) => {
      console.error('Call Error:', err);
      // Fallback: try alternative formats
      const alternativeUrl = `telprompt:${phoneNumber}`;
      Linking.openURL(alternativeUrl).catch((fallbackErr) => {
        console.error('Fallback Call Error:', fallbackErr);
        Alert.alert("Error", "Unable to open phone dialer. Please call " + phoneNumber + " manually.");
      });
    });
  };

  // Alternative direct call function (bypasses confirmation)
  const makeDirectCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Phone calls are not supported on this device");
        }
      })
      .catch((err) => {
        console.error('Call Error:', err);
        Alert.alert("Error", "Failed to make call");
      });
  };
  
  return (
    <View style={styles.container}>
      {
        // Render as an explicit array to avoid any whitespace-only text nodes inside <View>
        [
          // Temporary hidden Text component to address BASE_URL warning
          <Text key="base_url" style={{ display: "none" }}>
            {BASE_URL}
          </Text>,
          <NavBar
            key="navbar"
            username={username}
            userImage={userData?.IMAGE}
            userRole={userData?.ROLE}
          />,
          <ScrollView
            key="scroll"
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {
              // Render children as an explicit array to avoid whitespace-only text nodes inside <ScrollView>
              [
                <View key="logo" style={styles.logoContainer}>
                  <Image
                    source={require("./new-icon.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.title}>PatrolNet</Text>
                  <Text style={styles.tagline}>Community Safety Network</Text>
                </View>,
                <View key="desc" style={styles.descriptionCard}>
                  <Text style={styles.descriptionTitle}>About PatrolNet</Text>
                  <Text style={styles.descriptionText}>
                    PatrolNet connects residents with local authorities and emergency services.
                    Report incidents quickly, access emergency contacts instantly, and help keep
                    your community safe through our secure platform.
                  </Text>

                  <View style={styles.featuresRow}>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>🚨</Text>
                      <Text style={styles.featureText}>Quick Reports</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>📞</Text>
                      <Text style={styles.featureText}>Emergency Access</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Text style={styles.featureIcon}>🔒</Text>
                      <Text style={styles.featureText}>Secure & Private</Text>
                    </View>
                  </View>
                </View>,
                userData?.ROLE === "Tanod" ? (
                  <TouchableOpacity
                    key="attendance"
                    style={styles.reportButton}
                    onPress={() => navigation.navigate("TimeIn", { username })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonIcon}>⏰</Text>
                      <View style={styles.buttonTextContainer}>
                        <Text style={styles.reportButtonText}>ATTENDANCE</Text>
                        <Text style={styles.buttonSubtext}>Manage your shifts</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key="report"
                    style={styles.reportButton}
                    onPress={() => navigation.navigate("IncidentReport", { username })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonIcon}>📋</Text>
                      <View style={styles.buttonTextContainer}>
                        <Text style={styles.reportButtonText}>REPORT INCIDENT</Text>
                        <Text style={styles.buttonSubtext}>Document safety concerns</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ),
                <TouchableOpacity
                  key="emergency"
                  style={styles.emergencyButton}
                  onPress={makeEmergencyCall}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.emergencyIcon}>🚨</Text>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.emergencyButtonText}>EMERGENCY CALL</Text>
                      <Text style={styles.emergencySubtext}>Immediate assistance</Text>
                    </View>
                  </View>
                </TouchableOpacity>,
                <View key="status" style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.offlineText}>Connected via localhost</Text>
                </View>,
              ]
            }
          </ScrollView>,
        ]
      }
    </View>

  );
};

const Home: React.FC = () => (
  <ScreenErrorBoundary>
    <HomeInner />
  </ScreenErrorBoundary>
);

const styles = StyleSheet.create({
   container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" 
  },
  body: {
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoImage: {
  width: 80,
  height: 80,
  borderRadius: 40, // Makes the image circular if it's square
  marginBottom: 12,
  backgroundColor: "#3B82F6", // Optional: fallback background
},
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: "#3B82F6",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#3B82F6",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  logoText: { 
    fontSize: 24, 
    fontWeight: "900", 
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  logoAccent: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 10,
    height: 10,
    backgroundColor: "#10B981",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  title: { 
    fontSize: 28, 
    fontWeight: "900", 
    color: "#1E293B",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  descriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    marginBottom: 16,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
  },
  featureIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },
  reportButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emergencyButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#EF4444",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  emergencyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonTextContainer: {
    flex: 1,
  },
  reportButtonText: {
    fontWeight: "700",
    color: "#1E293B",
    fontSize: 16,
    marginBottom: 2,
  },
  emergencyButtonText: {
    fontWeight: "700",
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 2,
  },
  buttonSubtext: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  emergencySubtext: {
    fontSize: 12,
    color: "#FEE2E2",
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: "#10B981",
    borderRadius: 4,
    marginRight: 8,
  },
  offlineText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
});

export default Home;