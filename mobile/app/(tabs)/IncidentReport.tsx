import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import IncidentMap, { type LatLng, type MapRegion } from "../../components/IncidentMap";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { BASE_URL } from "../../config";

const screenWidth = Dimensions.get("window").width;

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "IncidentReport"
>;

type IncidentReportRouteProp = RouteProp<RootStackParamList, "IncidentReport">;

interface LogEntry {
  ID: number;
  USER: string;
  TIME: string;
  ACTION: string;
  TIME_IN?: string;
  TIME_OUT?: string;
  LOCATION?: string;
}

interface IncidentReportData {
  id: number;
  type: string;
  reported_by: string;
  location: string;
  status: string;
  assigned: string;
  created_at: string;
}

const DEFAULT_COORDS: LatLng = {
  latitude: 14.56535797150489,
  longitude: 121.61706714218529,
};

const IncidentReport: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<IncidentReportRouteProp>();

  const username = route.params?.username ?? "unknown";
  const incidentId = route.params?.incidentId; // Add this if viewing existing incident
  const isViewMode = route.params?.isViewMode ?? false; // Add this to determine if viewing existing

  // Form states
  const [incidentType, setIncidentType] = useState("Other");
  const [otherIncidentType, setOtherIncidentType] = useState("");
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [pinLocation, setPinLocation] = useState(DEFAULT_COORDS);
  const [latInput, setLatInput] = useState(DEFAULT_COORDS.latitude.toString());
  const [longInput, setLongInput] = useState(DEFAULT_COORDS.longitude.toString());
  const [image, setImage] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [address, setAddress] = useState<string>("");
  const [incidentStatus, setIncidentStatus] = useState<string>("pending");
  const [reportedBy, setReportedBy] = useState<string>("");

  // NavBar states
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<LogEntry[]>([]);
  const [lastLogId, setLastLogId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // User data states
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Load user data and incident data if in view mode
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedUserImage, storedUserRole] = await AsyncStorage.multiGet([
          'userImage',
          'userRole'
        ]);
        
        setUserImage(storedUserImage[1]);
        setUserRole(storedUserRole[1] || "");

        // If viewing existing incident, load its data
        if (isViewMode && incidentId) {
          await loadIncidentData();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadData();
  }, []);

  // Load existing incident data
  const loadIncidentData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/incidents/${incidentId}`);
      const incident = response.data;
      
      setIncidentType(incident.type);
      setIncidentStatus(incident.status);
      setReportedBy(incident.reported_by);
      setAddress(incident.location);
      
      if (incident.latitude && incident.longitude) {
        const coords = {
          latitude: parseFloat(incident.latitude),
          longitude: parseFloat(incident.longitude),
        };
        setPinLocation(coords);
        setMapRegion({
          ...coords,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        setLatInput(coords.latitude.toString());
        setLongInput(coords.longitude.toString());
      }
      
      if (incident.image_path) {
        setImage(`${BASE_URL}/uploads/${incident.image_path}`);
      }
      
      if (incident.created_at) {
        setCurrentDateTime(new Date(incident.created_at));
      }
      
    } catch (error) {
      console.error('Error loading incident data:', error);
      Alert.alert("Error", "Failed to load incident data");
    }
  };

  // Handle marking incident as resolved
  const handleMarkAsResolved = async () => {
    if (userRole !== "Tanod") {
      Alert.alert("Access Denied", "Only Tanod personnel can mark incidents as resolved.");
      return;
    }

    Alert.alert(
      "Mark as Resolved",
      "Are you sure you want to mark this incident as resolved?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const response = await axios.put(`${BASE_URL}/api/incidents/${incidentId}/resolve`, {
                resolved_by: username,
                resolved_at: new Date().toISOString()
              });

              if (response.status === 200) {
                setIncidentStatus("resolved");
                Alert.alert(
                  "Success", 
                  "Incident has been marked as resolved.",
                  [
                    {
                      text: "OK",
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              }
            } catch (error) {
              console.error('Error resolving incident:', error);
              Alert.alert("Error", "Failed to mark incident as resolved. Please try again.");
            }
          }
        }
      ]
    );
  };

  // Fetch user logs and check for new notifications
  const fetchUserLogs = async () => {
    if (!username) return;
    
    try {
      const response = await axios.get(`${BASE_URL}/api/logs/${username}`);
      const logs = response.data;
      
      console.log('Fetched logs for user:', username, 'Count:', logs.length);
      
      if (logs && logs.length > 0) {
        const latestLog = logs[0]; // Most recent log (ordered by TIME DESC)
        
        console.log('Latest log ID:', latestLog.ID, 'Last known ID:', lastLogId);
        
        // If this is the first time loading
        if (!isInitialized) {
          setLastLogId(latestLog.ID);
          setNotifications(logs.slice(0, 5)); // Show last 5 logs
          setIsInitialized(true);
          console.log('Initialized with latest log ID:', latestLog.ID);
        } else if (latestLog.ID > (lastLogId || 0)) {
          // New log detected - show notification
          const newLogsCount = logs.filter((log: LogEntry) => log.ID > (lastLogId || 0)).length;
          setNotificationCount(prev => prev + newLogsCount);
          setLastLogId(latestLog.ID);
          setNotifications(logs.slice(0, 5)); // Update with latest logs
          
          console.log('New log detected! New logs count:', newLogsCount);
          
          // Show alert for new notification
          const notificationMessage = getLogDisplayText(latestLog);
          Alert.alert(
            "New Schedule Logged",
            notificationMessage,
            [
              { text: "View All", onPress: () => handleNotificationPress() },
              { text: "Dismiss", style: "cancel" }
            ]
          );
        }
      } else {
        console.log('No logs found for user:', username);
      }
    } catch (error) {
      console.error("Error fetching user logs:", error);
      // Don't show error alerts for network issues during background polling
    }
  };

  // Helper function to format log display text
  const getLogDisplayText = (log: LogEntry) => {
    const date = new Date(log.TIME).toLocaleDateString();
    const time = new Date(log.TIME).toLocaleTimeString();
    let action = log.ACTION || 'Activity';
    
    // Format based on TIME_IN and TIME_OUT
    if (log.TIME_IN && log.TIME_OUT) {
      const timeIn = new Date(log.TIME_IN).toLocaleTimeString();
      const timeOut = new Date(log.TIME_OUT).toLocaleTimeString();
      action = `Time In: ${timeIn}, Time Out: ${timeOut}`;
    } else if (log.TIME_IN) {
      const timeIn = new Date(log.TIME_IN).toLocaleTimeString();
      action = `Time In: ${timeIn}`;
    } else if (log.TIME_OUT) {
      const timeOut = new Date(log.TIME_OUT).toLocaleTimeString();
      action = `Time Out: ${timeOut}`;
    }
    
    return `${date} ${time}\n${action}${log.LOCATION ? `\nLocation: ${log.LOCATION}` : ''}`;
  };

  // Polling effect for notifications
  useEffect(() => {
    if (username) {
      console.log('Setting up polling for user:', username);
      fetchUserLogs(); // Initial fetch for logs
      
      const interval = setInterval(() => {
        fetchUserLogs();
      }, 15000); // Check every 15 seconds
      
      return () => {
        console.log('Cleaning up polling interval');
        clearInterval(interval);
      };
    }
  }, [username, lastLogId, isInitialized]);

  // Handle notification press to navigate to notifications page
  const handleNotificationPress = () => {
    // Reset notification count when opened
    setNotificationCount(0);
    
    // Navigate to notifications page
    navigation.navigate("Notifications", { 
      username: username ?? "",
      incidentNotifications: [], // Residents don't get incident assignments
    });
  };

  const closeMenus = () => {
    setUserMenuVisible(false);
  };

  useEffect(() => {
    if (!isViewMode) {
      setMapRegion({
        latitude: DEFAULT_COORDS.latitude,
        longitude: DEFAULT_COORDS.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      setPinLocation(DEFAULT_COORDS);
      setLatInput(DEFAULT_COORDS.latitude.toString());
      setLongInput(DEFAULT_COORDS.longitude.toString());
    }
    setLocationLoaded(true);
  }, []);

  useEffect(() => {
    if (!isViewMode) {
      const timer = setInterval(() => {
        setCurrentDateTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const results = await Location.reverseGeocodeAsync(pinLocation);
        if (results.length > 0) {
          const addr = results[0];
          const formatted = `${addr.name || ""} ${addr.street || ""}, ${addr.city || addr.subregion || ""}, ${addr.region || ""}, ${addr.postalCode || ""}`;
          setAddress(formatted.trim());
        } else {
          setAddress("Address not found");
        }
      } catch (err) {
        setAddress("Failed to get address");
      }
    };

    if (!isViewMode) {
      fetchAddress();
    }
  }, [pinLocation, isViewMode]);

  const formatDateTimeForMySQL = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  };

  const formattedDateTime = formatDateTimeForMySQL(currentDateTime);

  const handleUseCurrentLocation = async () => {
    if (isViewMode) return; // Disable in view mode
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setMapRegion(region);
      setPinLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLatInput(location.coords.latitude.toString());
      setLongInput(location.coords.longitude.toString());
    } catch (error) {
      Alert.alert("Location Error", "Unable to get current location.");
    }
  };

  const handleMapPress = (e: any) => {
    if (isViewMode) return; // Disable in view mode
    
    const newLocation = e.nativeEvent.coordinate;
    setPinLocation({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
    });
    setLatInput(newLocation.latitude.toString());
    setLongInput(newLocation.longitude.toString());
    setMapRegion({
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  const handleAttachPhoto = async () => {
    if (isViewMode) return; // Disable in view mode

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Camera permission is required to take photos.");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    if (isViewMode) return; // Disable in view mode
    setImage(null);
  };

  const handleSubmit = async () => {
    if (isViewMode) return; // Disable in view mode
    
    try {
      const formData = new FormData();

      formData.append("incidentType", incidentType === "Other" ? otherIncidentType : incidentType);
      formData.append("latitude", pinLocation.latitude.toString());
      formData.append("longitude", pinLocation.longitude.toString());
      formData.append("datetime", formattedDateTime);
      formData.append("address", address);
      formData.append("reported_by", username);

      if (image) {
        const filename = image.split("/").pop()!;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : "jpg";
        formData.append("image", {
          uri: image,
          name: filename,
          type: `image/${ext}`,
        } as any);
      }

      const response = await fetch(`${BASE_URL}/api/incidents`, {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Response is not valid JSON");
      }

      if (response.ok) {
        Alert.alert("Success", "Incident reported successfully", [
          { 
            text: "OK", 
            onPress: () => {
              // Clear form after successful submission
              setIncidentType("");
              setImage(null);
              setPinLocation(DEFAULT_COORDS);
              setMapRegion({
                latitude: DEFAULT_COORDS.latitude,
                longitude: DEFAULT_COORDS.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              });

              // Check user role and navigate accordingly
              if (userRole === "Tanod") {
                // Tanod users go back to their dashboard with full navigation
                navigation.goBack();
              }
              // Residents stay on the current page (no navigation)
              // This maintains the limited interface without back button
            }
          },
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to report incident");
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return '#27ae60';
      case 'in_progress':
        return '#f39c12';
      case 'pending':
      default:
        return '#e74c3c';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'Resolved';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  if (userRole === "Tanod" && !isViewMode) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Access Denied</Text>
          <View style={styles.headerRight}></View>
        </View>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#e74c3c" />
          <Text style={styles.accessDeniedText}>
            Tanod accounts do not have permission to report incidents.
          </Text>
          <Text style={styles.accessDeniedSubText}>
            Only residents can report new incidents.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={closeMenus}>
      <View style={styles.container}>
        {/* Updated NavBar Header to match NavBar component style */}
        <View style={styles.header}>
          
          <TouchableOpacity
    style={styles.iconButton}
    onPress={() => navigation.goBack()}
  >
    <Ionicons name="arrow-back" size={28} color="#fff" />
  </TouchableOpacity>


  <View style={styles.headerRight}></View>
          <Text style={styles.headerTitle}>
            {isViewMode ? 'Incident Details' : 'Report Incident'}
          </Text>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setUserMenuVisible(!userMenuVisible)}
            >
              {userImage ? (
                <Image 
                  source={{ uri: `${BASE_URL}/uploads/${userImage}` }}
                  style={styles.profileImage}
                  onError={() => console.log("Error loading profile image")}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={30} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {userMenuVisible && (
            <View style={styles.userMenu}>
              <TouchableOpacity
                style={styles.userMenuItem}
                onPress={() => {
                  setUserMenuVisible(false);
                  navigation.navigate("Profile", { username: username ?? "" });
                }}
              >
                <Ionicons name="person-outline" size={20} color="#333" />
                <Text style={styles.userMenuText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.userMenuItem}
                onPress={() => {
                  setUserMenuVisible(false);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                <Text style={[styles.userMenuText, { color: "#e74c3c" }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView 
    contentContainerStyle={[styles.body, { paddingBottom: 40 }]}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={true}
  scrollEnabled={true}
        >
          <Text style={styles.reportTitle}>
            {isViewMode ? 'Incident Details' : 'Report an Incident'}
          </Text>
          <Text style={styles.reportSubtitle}>
            {isViewMode 
              ? 'Review incident information and status' 
              : 'Help us respond quickly to your concern'
            }
          </Text>

          {/* Status Badge - Only show in view mode */}
          {isViewMode && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incidentStatus) }]}>
              <Text style={styles.statusText}>{getStatusText(incidentStatus)}</Text>
            </View>
          )}
          
          <Text style={styles.label}>Type of incident:</Text>
          <View style={[styles.pickerContainer, isViewMode && styles.readOnlyInput]}>
            <Picker
              selectedValue={incidentType}
              onValueChange={(itemValue) => {
                if (!isViewMode) {
                  setIncidentType(itemValue);
                }
              }}
              style={styles.picker}
              enabled={!isViewMode}
            >
              <Picker.Item label="Select Incident Type" value="" />
              <Picker.Item label="Fire" value="Fire" />
              <Picker.Item label="Accident" value="Accident" />
              <Picker.Item label="Crime" value="Crime" />
              <Picker.Item label="Emergency" value="Emergency" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          {incidentType === "Other" && !isViewMode && (
            <TextInput
              style={styles.input}
              placeholder="Specify other incident type"
              value={otherIncidentType}
              onChangeText={setOtherIncidentType}
              editable={!isViewMode}
            />
          )}
          {isViewMode && incidentType === "Other" && otherIncidentType !== "" && (
            <>
              <Text style={styles.label}>Other Incident Type:</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={otherIncidentType}
                editable={false}
              />
            </>
          )}

          <Text style={styles.label}>
            {isViewMode ? 'Reported Date & Time:' : 'Current Date & Time:'}
          </Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={formattedDateTime}
            editable={false}
          />

          <Text style={styles.label}>Location Address:</Text>
          <TextInput
            style={[styles.input, isViewMode && styles.readOnlyInput]}
            value={address}
            editable={!isViewMode}
            onChangeText={setAddress}
            placeholder="Enter address or use map/GPS"
          />

          <View style={styles.mapContainer}>
            {!locationLoaded ? (
              <ActivityIndicator size="large" color="#4a90e2" />
            ) : (
              <IncidentMap
                style={styles.map}
                region={mapRegion}
                pinLocation={pinLocation}
                onPress={isViewMode ? undefined : handleMapPress}
                scrollEnabled={isViewMode}
                zoomEnabled={true}
              />
            )}
          </View>

          {!isViewMode && (
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
            >
              <Text style={styles.currentLocationText}>Use my current location</Text>
              <Ionicons name="location-sharp" size={20} color="#4a90e2" />
            </TouchableOpacity>
          )}

          {!isViewMode && (
            <TouchableOpacity
              style={styles.attachPhotoButton}
              onPress={handleAttachPhoto}
            >
              <Feather
                name="camera"
                size={20}
                color="#4a90e2"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.attachPhotoButtonText}>ATTACH PHOTO</Text>
            </TouchableOpacity>
          )}

          {/* Mark as Resolved Button - Only visible to Tanod role in view mode */}
          {isViewMode && userRole === "Tanod" && incidentStatus !== "resolved" && (
            <TouchableOpacity 
              style={styles.resolveButton} 
              onPress={handleMarkAsResolved}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.resolveButtonText}>MARK AS RESOLVED</Text>
            </TouchableOpacity>
          )}

          {!isViewMode && (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>SUBMIT REPORT</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.inputGroup, { display: "none" }]}>
            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput style={styles.input} value={latInput} editable={false} />
          </View>

          <View style={[styles.inputGroup, { display: "none" }]}>
            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput style={styles.input} value={longInput} editable={false} />
          </View>

          {image && (
            <View style={styles.imageSection}>
              <View style={styles.imageLabelRow}>
                <Text style={styles.imageLabel}>
                  {isViewMode ? 'Incident Photo:' : 'Attached Photo:'}
                </Text>
                {!isViewMode && (
                  <TouchableOpacity onPress={handleRemovePhoto}>
                    <Text style={styles.removePhotoText}>Remove Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Image source={{ uri: image }} style={styles.imagePreview} />
            </View>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa", // Light background
  },

  // Updated header styles for a cleaner, modern look
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15, // Slightly less padding
    paddingTop: 50, // Adjust for status bar
    backgroundColor: "#34495e", // Darker, more modern header background
    paddingBottom: 12,
    borderBottomWidth: 1, // Subtle separator
    borderBottomColor: "#e1e8ed",
    zIndex: 10,
    elevation: 4, // Add a subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  headerTitle: {
    fontWeight: "700", // Bolder title
    fontSize: 20, // Slightly larger
    color: "#fff",
    flex: 1,
    textAlign: "center",
    // marginLeft: 40, // Remove fixed margin, let flex handle it
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconButton: {
    padding: 5, // Add padding for easier tapping
    borderRadius: 20, // Make it circular
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#e74c3c", // Red for notifications
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1, // Ensure badge is above icon
  },

  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },

  profileImage: {
    width: 32, // Slightly larger
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fff',
  },

  userMenu: {
    position: "absolute",
    top: 90, // Adjusted position
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8, // Slightly less padding
    shadowColor: "#000",
    shadowOpacity: 0.15, // Softer shadow
    shadowRadius: 8, // Larger shadow radius
    elevation: 15, // Adjusted elevation
    zIndex: 1000,
    minWidth: 160, // Slightly wider
    borderWidth: 0, // Remove border, rely on shadow
  },

  userMenuItem: {
    paddingVertical: 12, // More vertical padding
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    // Add a subtle hover/press effect if possible, or just good spacing
  },

  userMenuText: {
    fontWeight: "600", // Slightly less bold
    fontSize: 15,
    marginLeft: 10,
    color: "#333",
  },

  body: {
    padding: 15, // Consistent padding
    backgroundColor: "#f5f6fa",
    flexGrow: 1,
    paddingBottom: 40,
  },

  reportTitle: {
    fontSize: 26, // Larger title
    fontWeight: "800", // Extra bold
    marginBottom: 6,
    color: "#2c3e50",
    textAlign: "center",
  },

  reportSubtitle: {
    fontSize: 15, // Slightly smaller
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 25, // Reduced margin
    fontWeight: "400",
  },

  label: {
    fontSize: 15, // Consistent label size
    marginBottom: 6, // Reduced margin
    fontWeight: "600",
    color: "#34495e", // Darker label color
  },

  usernameDisplay: {
    fontSize: 16,
    color: "#34495e", // Darker text
    backgroundColor: "#fff",
    padding: 14, // Consistent padding
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e1e8ed",
    marginBottom: 18, // Consistent margin
    fontWeight: "500",
  },

  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#e1e8ed",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14, // Consistent padding
    marginBottom: 18, // Consistent margin
    fontSize: 16,
    color: "#2c3e50",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    textAlignVertical: 'center', // Center text vertically
  },

  pickerContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#e1e8ed",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 18, // Consistent margin
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    justifyContent: 'center',
    paddingHorizontal: 5, // Add horizontal padding for picker
  },
  picker: {
    height: 48, // Slightly smaller height for picker
    width: "100%",
    color: "#2c3e50",
  },

  readOnlyInput: {
    backgroundColor: "#f8f9fa",
    color: "#6c757d",
  },

  mapContainer: {
    width: "100%",
    height: 220, // Slightly smaller map
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f0fe", // Lighter blue background
    paddingVertical: 14, // Consistent padding
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 18, // Consistent margin
    borderWidth: 0, // Remove border
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  currentLocationText: {
    fontSize: 15,
    marginRight: 8, // Reduced margin
    color: "#4a90e2",
    fontWeight: "600", // Bolder text
  },

  attachPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f0fe", // Lighter blue background
    paddingVertical: 14, // Consistent padding
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 25, // Consistent margin
    borderWidth: 0, // Remove border
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  attachPhotoButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a90e2",
  },

  imageSection: {
    width: "100%",
    marginBottom: 20,
    marginTop: 10, // Reduced margin
  },

  imageLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8, // Reduced margin
    alignItems: "center",
  },

  imageLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#34495e",
  },

  removePhotoText: {
    color: "#e74c3c",
    fontSize: 13, // Slightly smaller
    fontWeight: "500",
  },

  imagePreview: {
    width: "100%",
    height: 180, // Slightly smaller image preview
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    resizeMode: 'cover', // Ensure image covers the area
  },

  submitButton: {
    backgroundColor: "#28a745", // Green for submit
    paddingVertical: 16, // Consistent padding
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 25, // Consistent margin
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  submitButtonText: {
    color: "#fff",
    fontWeight: "700", // Bolder text
    fontSize: 17, // Slightly smaller
    textAlign: "center",
  },

  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },

  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  resolveButton: {
    backgroundColor: "#28a745", // Green for resolve
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  resolveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f6fa",
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedSubText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default IncidentReport;