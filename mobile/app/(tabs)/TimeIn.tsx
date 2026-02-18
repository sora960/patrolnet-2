// TimeIn.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Platform,
  Linking,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { RootStackParamList } from "./app";
import { BASE_URL } from "../../config";

type TimeInRouteProp = RouteProp<RootStackParamList, "TimeIn">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "TimeIn">;

interface UserTimeStatus {
  success?: boolean;
  schedule:
    | {
        id: number;
        user: string;
        status: string;
        location?: string | null;
        scheduledTime: string | null;
      }
    | null;
  logs:
    | {
        timeIn:
          | {
              time: string;
              action: string;
              location?: string;
              photo?: string | null;
              video?: string | null;
            }
          | null;
        timeOut:
          | {
              time: string;
              action: string;
              location?: string;
              photo?: string | null;
              video?: string | null;
            }
          | null;
      }
    | null;
  currentTime: string;
  hasTimeInToday: boolean;
  hasValidTime: boolean;
  hasTimeOutToday: boolean;
  mostRecentLogTime?: string | null;
  calculatedStatus?: string;
}

const TanodAttendance: React.FC = () => {
  const route = useRoute<TimeInRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const username = route.params?.username || "";

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [userStatus, setUserStatus] = useState<UserTimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for active status
  useEffect(() => {
    const startPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => startPulse());
    };

    if (userStatus?.hasTimeInToday && !userStatus?.hasTimeOutToday) {
      startPulse();
    }
  }, [userStatus, pulseAnim]);

  // Update current time and date
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateString = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setCurrentTime(timeString);
      setCurrentDate(dateString);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user's log status
  useEffect(() => {
    fetchUserTimeStatus();
  }, [username]);

  const fetchUserTimeStatus = async () => {
    try {
      // Don't set loading true on refresh to avoid flickering
      if (!userStatus) setLoading(true);
      
      const response = await fetch(`${BASE_URL}/api/user-time-status/${username}`);
      const data = await response.json();

      if (response.ok) {
        setUserStatus(data);
      } else {
        console.warn("Failed to fetch user status:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
      // Don't alert here to avoid spamming network errors
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRecord = async (
    action: "TIME-IN" | "TIME-OUT",
    extra?: { photo?: string; video?: string }
  ) => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const bodyPayload: any = {
        user: username,
        action,
      };
      if (extra?.photo) bodyPayload.photo = extra.photo;
      if (extra?.video) bodyPayload.video = extra.video;

      const response = await fetch(`${BASE_URL}/api/time-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (response.ok) {
        const successMessage =
          action === "TIME-IN"
            ? `Welcome to your shift! You are now ON DUTY as of ${new Date(data.time).toLocaleTimeString()}`
            : `Shift ended successfully. You are now OFF DUTY as of ${new Date(data.time).toLocaleTimeString()}`;

        Alert.alert("Success", successMessage, [{ text: "OK", onPress: () => fetchUserTimeStatus() }]);
      } else {
        Alert.alert("Error", data.message || `Failed to record ${action}`);
      }
    } catch (error) {
      console.error("Error recording time:", error);
      Alert.alert("Network Error", "Failed to connect to server. Please check your WiFi connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  };

  const openCamera = async (): Promise<string | null> => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert("Permission Needed", "Camera access is required to take a picture.");
      return null;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });

      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri ?? null;
      if (!uri || (result as any).canceled) return null;
      return uri;
    } catch (error) {
      Alert.alert("Camera Error", "Could not open camera.");
      return null;
    }
  };

  const openVideoCamera = async (): Promise<string | null> => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert("Permission Needed", "Camera access is required.");
      return null;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        videoMaxDuration: 30,
        quality: Platform.OS === "ios" ? ImagePicker.UIImagePickerControllerQualityType.Medium : undefined,
      });

      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri ?? null;
      if (!uri || (result as any).canceled) return null;
      return uri;
    } catch (error) {
      // Fix for some Android devices failing metadata extraction
      const message = String((error as any)?.message ?? error);
      const uriMatch = message.match(/(file:\/\/\/[^\s'\"]+\.(mp4|mov|m4v|webm))/i);
      if (uriMatch?.[1]) return uriMatch[1];
      
      Alert.alert("Camera Error", "Could not record video.");
      return null;
    }
  };

  const uploadMedia = async (uri: string, action: "TIME-IN" | "TIME-OUT") => {
    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() || `${username}_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = (match ? match[1] : "jpg").toLowerCase();
      
      const isVideo = ["mp4", "mov", "m4v", "webm"].includes(ext);
      const mimeType = isVideo ? `video/${ext === 'mov' ? 'quicktime' : ext}` : `image/${ext === 'png' ? 'png' : 'jpeg'}`;

      // @ts-ignore
      formData.append(isVideo ? "media" : "photo", {
        uri,
        name: filename,
        type: mimeType,
      });
      formData.append("username", username);
      formData.append("action", action);

      const endpoint = isVideo ? "upload-time-media" : "upload-time-photo";
      const resp = await fetch(`${BASE_URL}/api/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        return data.filename || data.file || filename;
      }
      throw new Error(data.message || "Upload failed");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", "Could not upload evidence. Please try again.");
      return null;
    }
  };

  const handleActionPress = async (action: "TIME-IN" | "TIME-OUT") => {
    if (submitting) return;

    const actionText = action === "TIME-IN" ? "START SHIFT" : "END SHIFT";
    const statusText = action === "TIME-IN" ? "ON DUTY" : "OFF DUTY";

    Alert.alert(
      `Confirm ${actionText}`,
      `Are you sure you want to ${actionText.toLowerCase()}?\nStatus will change to: ${statusText}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => showEvidenceOptions(action),
        },
      ]
    );
  };

  const showEvidenceOptions = (action: "TIME-IN" | "TIME-OUT") => {
    Alert.alert(
      "Attach Evidence",
      "Evidence is required for accountability.",
      [
        {
          text: "Video (Recommended)",
          onPress: async () => {
            const uri = await openVideoCamera();
            if (uri) processSubmission(uri, action, true);
          },
        },
        {
          text: "Photo",
          onPress: async () => {
            const uri = await openCamera();
            if (uri) processSubmission(uri, action, false);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const processSubmission = async (uri: string, action: "TIME-IN" | "TIME-OUT", isVideo: boolean) => {
    setSubmitting(true);
    const filename = await uploadMedia(uri, action);
    
    if (filename) {
      await handleTimeRecord(action, isVideo ? { video: filename } : { photo: filename });
    }
    setSubmitting(false);
  };

  const openEvidence = async (filename: string) => {
    const url = `${BASE_URL}/uploads/${encodeURIComponent(filename)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert("Error", "Cannot open this file.");
  };

  const formatScheduleTime = (scheduleString: string | null) => {
    return scheduleString && scheduleString !== "No schedule assigned" 
      ? scheduleString 
      : "No schedule assigned";
  };

  const formatLogTime = (timeString: string) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // --- Logic & Display ---
  const isOnDuty = !!userStatus?.hasTimeInToday;
  const isShiftEnded = !!userStatus?.hasTimeOutToday && !isOnDuty;
  const hasValidSchedule = !!userStatus?.hasValidTime;

  // DEMO MODE: We allow Time In even if schedule is invalid, just warn the user.
  // This prevents the "Cant Shift" issue during defense if you are late.
  const canTimeIn = !isOnDuty; // Removed `&& hasValidSchedule` constraint
  const canTimeOut = isOnDuty;

  let statusColor = "#dc3545"; // Red (Off Duty)
  let statusBg = "#f8d7da";
  let statusText = "OFF DUTY";
  let statusIcon: keyof typeof Ionicons.glyphMap = "shield-outline";

  if (isOnDuty) {
    statusColor = "#28a745"; // Green
    statusBg = "#d4edda";
    statusText = "ON DUTY";
    statusIcon = "shield-checkmark";
  } else if (isShiftEnded) {
    statusColor = "#6c757d"; // Grey
    statusBg = "#f8f9fa";
    statusText = "SHIFT ENDED";
  }

  // Safe Accessors for Logs (Fixes 'possibly null' TS error)
  const timeInLog = userStatus?.logs?.timeIn;
  const timeOutLog = userStatus?.logs?.timeOut;

  if (loading && !userStatus) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Connecting to PatrolNet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tanod Attendance</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchUserTimeStatus}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Time */}
        <View style={styles.dateTimeCard}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>

        {/* Status Card */}
        <Animated.View
          style={[
            styles.statusCard,
            { backgroundColor: statusBg },
            isOnDuty && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.statusHeader}>
            <Ionicons name={statusIcon} size={28} color={statusColor} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.scheduleInfo}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.scheduleText}>
              {formatScheduleTime(userStatus?.schedule?.scheduledTime ?? null)}
            </Text>
          </View>

          {/* Warning if off-schedule but allowed for demo */}
          {!hasValidSchedule && !isOnDuty && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#856404" />
              <Text style={styles.warningText}>
                Note: You are currently outside your assigned schedule.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Logs */}
        {(timeInLog || timeOutLog) && (
          <View style={styles.recordsCard}>
            <Text style={styles.recordsTitle}>Today's Logs</Text>

            {/* Time In Log */}
            {timeInLog && (
              <View style={styles.recordItem}>
                <View style={[styles.recordIcon, { backgroundColor: "#d4edda" }]}>
                  <Ionicons name="enter" size={20} color="#155724" />
                </View>
                <View style={styles.recordDetails}>
                  <Text style={styles.recordAction}>TIME IN</Text>
                  <Text style={styles.recordTime}>{formatLogTime(timeInLog.time)}</Text>
                  
                  <View style={styles.evidenceRow}>
                    {timeInLog.video && (
                      <TouchableOpacity style={styles.evidencePill} onPress={() => openEvidence(timeInLog.video!)}>
                        <Ionicons name="videocam" size={14} color="#0056b3" />
                        <Text style={styles.evidenceText}>Video</Text>
                      </TouchableOpacity>
                    )}
                    {timeInLog.photo && (
                      <TouchableOpacity style={styles.evidencePill} onPress={() => openEvidence(timeInLog.photo!)}>
                        <Ionicons name="image" size={14} color="#0056b3" />
                        <Text style={styles.evidenceText}>Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Time Out Log */}
            {timeOutLog && (
              <View style={[styles.recordItem, { borderBottomWidth: 0 }]}>
                <View style={[styles.recordIcon, { backgroundColor: "#f8d7da" }]}>
                  <Ionicons name="exit" size={20} color="#721c24" />
                </View>
                <View style={styles.recordDetails}>
                  <Text style={styles.recordAction}>TIME OUT</Text>
                  <Text style={styles.recordTime}>{formatLogTime(timeOutLog.time)}</Text>
                  
                  <View style={styles.evidenceRow}>
                    {timeOutLog.video && (
                      <TouchableOpacity style={styles.evidencePill} onPress={() => openEvidence(timeOutLog.video!)}>
                        <Ionicons name="videocam" size={14} color="#0056b3" />
                        <Text style={styles.evidenceText}>Video</Text>
                      </TouchableOpacity>
                    )}
                    {timeOutLog.photo && (
                      <TouchableOpacity style={styles.evidencePill} onPress={() => openEvidence(timeOutLog.photo!)}>
                        <Ionicons name="image" size={14} color="#0056b3" />
                        <Text style={styles.evidenceText}>Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.timeInButton, !canTimeIn && styles.actionButtonDisabled]}
            onPress={() => handleActionPress("TIME-IN")}
            disabled={!canTimeIn || submitting}
          >
            {submitting && !isOnDuty ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="enter-outline" size={24} color={!canTimeIn ? "#6c757d" : "#fff"} />
                <Text style={[styles.actionButtonText, !canTimeIn && styles.textDisabled]}>
                  {isOnDuty ? "ALREADY ON DUTY" : "START SHIFT"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.timeOutButton, !canTimeOut && styles.actionButtonDisabled]}
            onPress={() => handleActionPress("TIME-OUT")}
            disabled={!canTimeOut || submitting}
          >
            {submitting && isOnDuty ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="exit-outline" size={24} color={!canTimeOut ? "#6c757d" : "#fff"} />
                <Text style={[styles.actionButtonText, !canTimeOut && styles.textDisabled]}>
                  {isShiftEnded ? "SHIFT COMPLETED" : "END SHIFT"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: "#2c3e50",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  backButton: { padding: 5 },
  refreshButton: { padding: 5 },
  headerPlaceholder: { width: 34 },
  loadingText: { marginTop: 10, color: "#666" },
  content: { flex: 1, padding: 20 },
  
  dateTimeCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 15, marginBottom: 15,
    alignItems: "center", elevation: 2, shadowOpacity: 0.1, shadowRadius: 4,
  },
  dateText: { fontSize: 16, color: "#666" },
  timeText: { fontSize: 32, fontWeight: "bold", color: "#2c3e50" },

  statusCard: {
    borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2,
  },
  statusHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  statusTextContainer: { marginLeft: 15 },
  statusLabel: { fontSize: 12, color: "#666", textTransform: "uppercase" },
  statusText: { fontSize: 22, fontWeight: "bold" },
  scheduleInfo: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  scheduleText: { marginLeft: 8, fontSize: 14, color: "#555" },
  warningBox: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff3cd', padding: 8, borderRadius: 6
  },
  warningText: { marginLeft: 6, color: '#856404', fontSize: 12, flex: 1 },

  recordsCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2,
  },
  recordsTitle: { fontSize: 16, fontWeight: "bold", color: "#2c3e50", marginBottom: 15 },
  recordItem: {
    flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee",
  },
  recordIcon: {
    width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 15,
  },
  recordDetails: { flex: 1 },
  recordAction: { fontSize: 16, fontWeight: "bold", color: "#333" },
  recordTime: { fontSize: 14, color: "#666", marginTop: 2 },
  evidenceRow: { flexDirection: "row", marginTop: 8, gap: 8 },
  evidencePill: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#e9ecef",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4
  },
  evidenceText: { fontSize: 12, color: "#0056b3", fontWeight: "600" },

  actionSection: { marginBottom: 30 },
  actionButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 18, borderRadius: 12, marginBottom: 15, elevation: 3,
  },
  timeInButton: { backgroundColor: "#28a745" },
  timeOutButton: { backgroundColor: "#dc3545" },
  actionButtonDisabled: { backgroundColor: "#e9ecef", elevation: 0 },
  actionButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 10 },
  textDisabled: { color: "#adb5bd" },
});

export default TanodAttendance;