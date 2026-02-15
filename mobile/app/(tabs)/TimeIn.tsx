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
          toValue: 1.1,
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
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/user-time-status/${username}`);
      const data = await response.json();

      if (response.ok) {
        setUserStatus(data);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch user status");
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Original time-record call (kept for compatibility)
  const handleTimeRecord = async (
    action: "TIME-IN" | "TIME-OUT",
    extra?: { photo?: string; video?: string }
  ) => {
    if (submitting) return;

    // Validation checks
    if (action === "TIME-IN" && userStatus?.hasTimeInToday) {
      Alert.alert("Already On Duty", "You are already on duty today. Please time out first if you need to leave.");
      return;
    }

    if (action === "TIME-OUT" && !userStatus?.hasTimeInToday) {
      Alert.alert("Not On Duty", "You need to time in first before you can end your shift.");
      return;
    }

    if (action === "TIME-OUT" && userStatus?.hasTimeOutToday) {
      Alert.alert("Shift Ended", "Your shift has already ended for today.");
      return;
    }

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
      Alert.alert("Error", "Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: Request camera permission (expo-image-picker)
  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  };

  // NEW: Launch camera to capture photo
  const openCamera = async (): Promise<string | null> => {
    try {
      if (Platform.OS !== "web") {
        const granted = await requestCameraPermission();
        if (!granted) {
          Alert.alert("Permission Needed", "Camera access is required to take a picture.");
          return null;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });

      // expo-image-picker v14+ returns result.assets
      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri ?? null;

      if (!uri || (result as any).cancelled === true) {
        return null;
      }
      return uri;
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Could not open camera.");
      return null;
    }
  };

  // NEW: Launch camera to capture short video
  const openVideoCamera = async (): Promise<string | null> => {
    try {
      if (Platform.OS !== "web") {
        const granted = await requestCameraPermission();
        if (!granted) {
          Alert.alert("Permission Needed", "Camera access is required to record a video.");
          return null;
        }
      }

      // NOTE: Some Android devices/ROMs + Expo Go can fail with
      // "Failed to extract metadata from video file" even though the file is created.
      // Keep options minimal and iOS-specific options gated.
      const pickerOptions: any = {
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        videoMaxDuration: 30,
      };

      if (Platform.OS === "ios") {
        pickerOptions.videoQuality = ImagePicker.UIImagePickerControllerQualityType.Medium;
      }

      const result = await ImagePicker.launchCameraAsync(pickerOptions);

      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri ?? null;
      if (!uri || (result as any).cancelled === true || (result as any).canceled === true) {
        return null;
      }

      return uri;
    } catch (error) {
      const message = String((error as any)?.message ?? error);

      // Recovery: expo-image-picker may throw after recording if metadata extraction fails.
      // The recorded file URI is often embedded in the error message; we can still upload it.
      const uriMatch = message.match(/(file:\/\/\/[^\s'\"]+\.(mp4|mov|m4v|webm))/i);
      if (uriMatch?.[1]) {
        console.warn("Video picker metadata failed; using captured file anyway:", uriMatch[1]);
        return uriMatch[1];
      }

      console.warn("Video camera error:", message);
      Alert.alert("Error", "Could not record video.");
      return null;
    }
  };

  // NEW: Upload photo to server - returns filename or null
  const uploadPhoto = async (uri: string, action: "TIME-IN" | "TIME-OUT") => {
    try {
      const formData = new FormData();
      // For React Native, the name/type must be provided
      const filename = uri.split("/").pop() || `${username}_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";

      // @ts-ignore - FormData append with file object
      formData.append("photo", {
        uri,
        name: filename,
        type: mimeType,
      });
      formData.append("username", username);
      formData.append("action", action);

      const resp = await fetch(`${BASE_URL}/api/upload-time-photo`, {
        method: "POST",
        // Important: do NOT set Content-Type; let fetch set the multipart boundary
        body: formData,
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        return data.filename || data.file || filename;
      } else {
        console.error("Upload failed response:", data);
        Alert.alert("Upload Failed", data.message || "Could not upload picture.");
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Error", "Failed to upload picture. Check your connection.");
      return null;
    }
  };

  // NEW: Upload photo OR video to server - returns filename or null
  const uploadMedia = async (
    uri: string,
    action: "TIME-IN" | "TIME-OUT",
    kind: "photo" | "video" = "photo"
  ) => {
    try {
      const formData = new FormData();

      const videoExts = ["mp4", "mov", "m4v", "webm"];

      let filename = uri.split("/").pop() || `${username}_${Date.now()}`;
      const match = /\.(\w+)$/.exec(filename);
      let ext = (match ? match[1] : "").toLowerCase();

      const isVideo = kind === "video" || videoExts.includes(ext);
      if (isVideo && !videoExts.includes(ext)) {
        filename = `${filename}.mp4`;
        ext = "mp4";
      }
      if (!isVideo && !ext) {
        filename = `${filename}.jpg`;
        ext = "jpg";
      }

      const mimeType = isVideo
        ? ext === "mov"
          ? "video/quicktime"
          : ext === "webm"
            ? "video/webm"
            : "video/mp4"
        : ext === "png"
          ? "image/png"
          : "image/jpeg";

      // @ts-ignore - FormData append with file object
      formData.append("media", {
        uri,
        name: filename,
        type: mimeType,
      });
      formData.append("username", username);
      formData.append("action", action);

      const resp = await fetch(`${BASE_URL}/api/upload-time-media`, {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        return data.filename || data.file || filename;
      }

      console.error("Upload media failed response:", data);
      Alert.alert("Upload Failed", data.message || "Could not upload media.");
      return null;
    } catch (error) {
      console.error("Upload media error:", error);
      Alert.alert("Upload Error", "Failed to upload media. Check your connection.");
      return null;
    }
  };

  // NEW: Flow — user taps START SHIFT -> show confirm -> on Confirm open camera -> upload -> record
  const handleTimeInPress = async () => {
    if (submitting) return;
    if (userStatus?.hasTimeInToday) {
      Alert.alert("Already On Duty", "You are already on duty today. Please time out first if you need to leave.");
      return;
    }
    const currentTimeFormatted = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    Alert.alert(
      "Confirm TIME-IN",
      `Are you sure you want to start your shift?\n\nTime: ${currentTimeFormatted}\nStatus will change to: ON DUTY`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: async () => {
            Alert.alert(
              "Attach Evidence",
              "Choose what to attach for your attendance.",
              [
                {
                  text: "Video (recommended)",
                  onPress: async () => {
                    const uri = await openVideoCamera();
                    if (!uri) {
                      Alert.alert("Cancelled", "You must record a video before timing in.");
                      return;
                    }

                    setSubmitting(true);
                    const uploadedFilename = await uploadMedia(uri, "TIME-IN", "video");
                    if (!uploadedFilename) {
                      setSubmitting(false);
                      return;
                    }

                    await handleTimeRecord("TIME-IN", { video: uploadedFilename });
                    setSubmitting(false);
                  },
                },
                {
                  text: "Photo",
                  onPress: async () => {
                    const uri = await openCamera();
                    if (!uri) {
                      Alert.alert("Cancelled", "You must take a picture before timing in.");
                      return;
                    }

                    setSubmitting(true);
                    const uploadedFilename = await uploadPhoto(uri, "TIME-IN");
                    if (!uploadedFilename) {
                      setSubmitting(false);
                      return;
                    }

                    await handleTimeRecord("TIME-IN", { photo: uploadedFilename });
                    setSubmitting(false);
                  },
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          },
        },
      ]
    );
  };

  // NEW: Flow for TIME-OUT (same as TIME-IN but with TIME-OUT checks)
  const handleTimeOutPress = async () => {
    if (submitting) return;
    if (!userStatus?.hasTimeInToday) {
      Alert.alert("Not On Duty", "You need to time in first before you can end your shift.");
      return;
    }
    if (userStatus?.hasTimeOutToday) {
      Alert.alert("Shift Ended", "Your shift has already ended for today.");
      return;
    }

    const currentTimeFormatted = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    Alert.alert(
      "Confirm TIME-OUT",
      `Are you sure you want to end your shift?\n\nTime: ${currentTimeFormatted}\nStatus will change to: OFF DUTY`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: async () => {
            Alert.alert(
              "Attach Evidence",
              "Choose what to attach for your attendance.",
              [
                {
                  text: "Video (recommended)",
                  onPress: async () => {
                    const uri = await openVideoCamera();
                    if (!uri) {
                      Alert.alert("Cancelled", "You must record a video before timing out.");
                      return;
                    }

                    setSubmitting(true);
                    const uploadedFilename = await uploadMedia(uri, "TIME-OUT", "video");
                    if (!uploadedFilename) {
                      setSubmitting(false);
                      return;
                    }

                    await handleTimeRecord("TIME-OUT", { video: uploadedFilename });
                    setSubmitting(false);
                  },
                },
                {
                  text: "Photo",
                  onPress: async () => {
                    const uri = await openCamera();
                    if (!uri) {
                      Alert.alert("Cancelled", "You must take a picture before timing out.");
                      return;
                    }

                    setSubmitting(true);
                    const uploadedFilename = await uploadPhoto(uri, "TIME-OUT");
                    if (!uploadedFilename) {
                      setSubmitting(false);
                      return;
                    }

                    await handleTimeRecord("TIME-OUT", { photo: uploadedFilename });
                    setSubmitting(false);
                  },
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          },
        },
      ]
    );
  };

  // Format helpers
  const formatScheduleTime = (scheduleString: string | null) => {
    if (!scheduleString || scheduleString === "No schedule assigned") {
      return "No schedule assigned";
    }
    return scheduleString;
  };

  const formatLogTime = (timeString: string) => {
    if (!timeString) return "N/A";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid time";
    }
  };

  const openEvidence = async (filename: string) => {
    const url = `${BASE_URL}/uploads/${encodeURIComponent(filename)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Cannot Open", "Unable to open the evidence link on this device.");
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error("Open evidence error:", error);
      Alert.alert("Error", "Failed to open evidence.");
    }
  };

  const getStatusInfo = () => {
    const hasTimeIn = userStatus?.hasTimeInToday;
    const hasTimeOut = userStatus?.hasTimeOutToday;

    if (hasTimeIn && !hasTimeOut) {
      return {
        text: "ON DUTY",
        color: "#28a745",
        bgColor: "#d4edda",
        icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
      };
    } else if (hasTimeOut) {
      return {
        text: "SHIFT ENDED",
        color: "#6c757d",
        bgColor: "#f8f9fa",
        icon: "shield-outline" as keyof typeof Ionicons.glyphMap,
      };
    } else {
      return {
        text: "OFF DUTY",
        color: "#dc3545",
        bgColor: "#f8d7da",
        icon: "shield-outline" as keyof typeof Ionicons.glyphMap,
      };
    }
  };

  // Server flags:
  // - hasTimeInToday => currently ON DUTY (open shift)
  // - hasTimeOutToday => latest shift ended
  const isOnDuty = !!userStatus?.hasTimeInToday;
  const isShiftEnded = !!userStatus?.hasTimeOutToday && !isOnDuty;
  const hasValidSchedule = !!userStatus?.hasValidTime;

  // Allow multiple shifts per day: user can TIME-IN again if not currently on duty and schedule is valid.
  const canTimeIn = !isOnDuty && hasValidSchedule;
  const canTimeOut = isOnDuty;
  const statusInfo = getStatusInfo();

  const timeInUi = (() => {
    if (submitting) {
      return { icon: "enter-outline" as const, title: "START SHIFT", sub: "Submitting..." };
    }
    if (isOnDuty) {
      return { icon: "checkmark-circle" as const, title: "ALREADY ON DUTY", sub: "Shift has started" };
    }
    if (isShiftEnded) {
      return { icon: "checkmark-circle" as const, title: "SHIFT ENDED", sub: "Duty completed" };
    }
    if (!hasValidSchedule) {
      return { icon: "close-circle" as const, title: "NOT SCHEDULED", sub: "No valid schedule today" };
    }
    return { icon: "enter-outline" as const, title: "START SHIFT", sub: "Tap to begin your duty" };
  })();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tanod Attendance</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
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
        {/* Date and Time Display */}
        <View style={styles.dateTimeCard}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>

        {/* Status Card */}
        <Animated.View
          style={[
            styles.statusCard,
            { backgroundColor: statusInfo.bgColor },
            userStatus?.hasTimeInToday &&
              !userStatus?.hasTimeOutToday && {
                transform: [{ scale: pulseAnim }],
              },
          ]}
        >
          <View style={styles.statusHeader}>
            <Ionicons name={statusInfo.icon} size={28} color={statusInfo.color} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
            </View>
          </View>

          {userStatus?.schedule?.scheduledTime && (
            <View style={styles.scheduleInfo}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.scheduleText}>Scheduled: {formatScheduleTime(userStatus.schedule.scheduledTime)}</Text>
            </View>
          )}
        </Animated.View>

        {/* Today's Records */}
        {(userStatus?.logs?.timeIn || userStatus?.logs?.timeOut) && (
          <View style={styles.recordsCard}>
            <Text style={styles.recordsTitle}>Today's Records</Text>

            {userStatus?.logs.timeIn && (
              <View style={styles.recordItem}>
                <View style={styles.recordIcon}>
                  <Ionicons name="enter-outline" size={20} color="#28a745" />
                </View>
                <View style={styles.recordDetails}>
                  <Text style={styles.recordAction}>TIME IN</Text>
                  <Text style={styles.recordTime}>{formatLogTime(userStatus.logs.timeIn.time)}</Text>
                  {(userStatus.logs.timeIn.video || userStatus.logs.timeIn.photo) && (
                    <View style={styles.evidenceRow}>
                      {userStatus.logs.timeIn.video && (
                        <TouchableOpacity
                          style={styles.evidencePill}
                          onPress={() => openEvidence(userStatus.logs.timeIn!.video!)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="play-circle-outline" size={16} color="#0f172a" />
                          <Text style={styles.evidenceText}>Play Video</Text>
                        </TouchableOpacity>
                      )}
                      {userStatus.logs.timeIn.photo && (
                        <TouchableOpacity
                          style={styles.evidencePill}
                          onPress={() => openEvidence(userStatus.logs.timeIn!.photo!)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="image-outline" size={16} color="#0f172a" />
                          <Text style={styles.evidenceText}>View Photo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              </View>
            )}

            {userStatus?.logs.timeOut && (
              <View style={styles.recordItem}>
                <View style={styles.recordIcon}>
                  <Ionicons name="exit-outline" size={20} color="#dc3545" />
                </View>
                <View style={styles.recordDetails}>
                  <Text style={styles.recordAction}>TIME OUT</Text>
                  <Text style={styles.recordTime}>{formatLogTime(userStatus.logs.timeOut.time)}</Text>
                  {(userStatus.logs.timeOut.video || userStatus.logs.timeOut.photo) && (
                    <View style={styles.evidenceRow}>
                      {userStatus.logs.timeOut.video && (
                        <TouchableOpacity
                          style={styles.evidencePill}
                          onPress={() => openEvidence(userStatus.logs.timeOut!.video!)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="play-circle-outline" size={16} color="#0f172a" />
                          <Text style={styles.evidenceText}>Play Video</Text>
                        </TouchableOpacity>
                      )}
                      {userStatus.logs.timeOut.photo && (
                        <TouchableOpacity
                          style={styles.evidencePill}
                          onPress={() => openEvidence(userStatus.logs.timeOut!.photo!)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="image-outline" size={16} color="#0f172a" />
                          <Text style={styles.evidenceText}>View Photo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#dc3545" />
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Time In Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.timeInButton, !canTimeIn && styles.actionButtonDisabled]}
            onPress={handleTimeInPress}
            disabled={!canTimeIn || submitting}
          >
            <View style={styles.actionButtonContent}>
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={canTimeIn ? "enter-outline" : timeInUi.icon}
                    size={24}
                    color={canTimeIn ? "#fff" : "#6c757d"}
                  />
                  <Text style={[styles.actionButtonText, !canTimeIn && styles.actionButtonTextDisabled]}>{timeInUi.title}</Text>
                  <Text style={[styles.actionButtonSubtext, !canTimeIn && styles.actionButtonTextDisabled]}>{timeInUi.sub}</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Time Out Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.timeOutButton, !canTimeOut && styles.actionButtonDisabled]}
            onPress={handleTimeOutPress}
            disabled={!canTimeOut || submitting}
          >
            <View style={styles.actionButtonContent}>
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={canTimeOut ? "exit-outline" : userStatus?.hasTimeOutToday ? "checkmark-circle" : "close-circle"}
                    size={24}
                    color={canTimeOut ? "#fff" : userStatus?.hasTimeOutToday ? "#28a745" : "#dc3545"}
                  />
                  <Text style={[styles.actionButtonText, !canTimeOut && styles.actionButtonTextDisabled]}>
                    {canTimeOut ? "END SHIFT" : userStatus?.hasTimeOutToday ? "SHIFT ENDED" : "NOT AVAILABLE"}
                  </Text>
                  <Text style={[styles.actionButtonSubtext, !canTimeOut && styles.actionButtonTextDisabled]}>
                    {canTimeOut ? "Tap to end your duty" : userStatus?.hasTimeOutToday ? "Duty completed" : "Time in first"}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="information-circle" size={16} color="#007bff" />
            <Text style={styles.instructionText}>Tap "START SHIFT" when you begin your duty</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="information-circle" size={16} color="#007bff" />
            <Text style={styles.instructionText}>Tap "END SHIFT" when your duty is complete</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="information-circle" size={16} color="#007bff" />
            <Text style={styles.instructionText}>A short selfie video (recommended) or selfie photo is required for TIME IN and TIME OUT</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: "#2c3e50",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 5,
  },
  headerPlaceholder: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dateTimeCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  timeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  statusCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  scheduleText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  recordsCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  recordItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  recordDetails: {
    flex: 1,
  },
  recordAction: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  recordTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  evidenceRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    flexWrap: "wrap",
  },
  evidencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  actionSection: {
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  timeInButton: {
    backgroundColor: "#28a745",
  },
  timeOutButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonDisabled: {
    backgroundColor: "#e9ecef",
    shadowOpacity: 0,
    elevation: 1,
  },
  actionButtonContent: {
    padding: 20,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  actionButtonSubtext: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  actionButtonTextDisabled: {
    color: "#6c757d",
  },
  instructionsCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
});

export default TanodAttendance;
