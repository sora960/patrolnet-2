// IncidentReportModal.tsx - Updated to handle incident resolution with photo proof
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface LogEntry {
  ID: number;
  USER: string;
  TIME: string;
  ACTION: string;
  TIME_IN?: string;
  TIME_OUT?: string;
  LOCATION?: string;
}

interface IncidentReportModalProps {
  isVisible: boolean;
  log: LogEntry | null;
  onClose: () => void;
  onMarkAsRead: () => void;
  onResolve: (logId: number, mediaUri: string) => Promise<void>;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isVisible,
  log,
  onClose,
  onMarkAsRead,
  onResolve,
}) => {
  const [isResolving, setIsResolving] = useState(false);

  if (!log) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
    };
  };

  const reportDateTime = formatDateTime(log.TIME);

  const captureAndSubmit = async (mode: 'photo' | 'video') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera access is required to capture proof of resolution."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mode === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: mode !== 'video',
      aspect: mode !== 'video' ? [4, 3] : undefined,
      quality: mode !== 'video' ? 0.7 : undefined,
      videoMaxDuration: mode === 'video' ? 30 : undefined,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const mediaUri = result.assets[0].uri;
      const label = mode === 'video' ? 'recorded video' : 'captured photo';

      Alert.alert(
        "Confirm Resolution",
        `Are you sure you want to mark this incident as resolved with the ${label}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm & Submit",
            onPress: async () => {
              setIsResolving(true);
              await onResolve(log.ID, mediaUri);
              setIsResolving(false);
              onClose();
            },
          },
        ]
      );
    }
  };

  const handleResolve = async () => {
    Alert.alert(
      "Choose Proof Type",
      "Select what proof you want to submit for resolution.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => captureAndSubmit('photo') },
        { text: "Record Video", onPress: () => captureAndSubmit('video') },
      ]
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="alert-circle" size={28} color="#D32F2F" />
              </View>
              <Text style={styles.modalTitle}>Incident Report</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Incident Type/Action */}
            <View style={styles.infoSection}>
              <View style={styles.infoLabel}>
                <Ionicons name="warning" size={20} color="#FF5722" />
                <Text style={styles.labelText}>Incident Type</Text>
              </View>
              <Text style={styles.infoValue}>{log.ACTION || 'Not specified'}</Text>
            </View>

            {/* Reported By */}
            <View style={styles.infoSection}>
              <View style={styles.infoLabel}>
                <Ionicons name="person" size={20} color="#4CAF50" />
                <Text style={styles.labelText}>Reported By</Text>
              </View>
              <Text style={styles.infoValue}>{log.USER}</Text>
            </View>

            {/* Date and Time */}
            <View style={styles.infoSection}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar" size={20} color="#2196F3" />
                <Text style={styles.labelText}>Date & Time</Text>
              </View>
              <Text style={styles.infoValue}>{reportDateTime.date}</Text>
              <Text style={styles.infoSubValue}>{reportDateTime.time}</Text>
            </View>

            {/* Location */}
            {log.LOCATION && (
              <View style={styles.infoSection}>
                <View style={styles.infoLabel}>
                  <Ionicons name="location" size={20} color="#FF9800" />
                  <Text style={styles.labelText}>Location</Text>
                </View>
                <Text style={styles.infoValue}>{log.LOCATION}</Text>
              </View>
            )}

            {/* Alert Box */}
            <View style={styles.alertBox}>
              <Ionicons name="information-circle" size={22} color="#2196F3" />
              <Text style={styles.alertText}>
                This incident has been reported to your patrol logs. Please review and take appropriate action if necessary.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButtonStyle]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.closeButtonText]}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.resolveButton,
                isResolving && styles.buttonDisabled,
              ]}
              onPress={handleResolve}
              disabled={isResolving}
            >
              {isResolving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.buttonText}>
                    {isResolving ? "Submitting..." : "Mark as Resolved"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ActivityLogModal.tsx - Modal for viewing activity/schedule logs
interface ActivityLogModalProps {
  isVisible: boolean;
  log: LogEntry | null;
  onClose: () => void;
  onMarkAsRead: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isVisible,
  log,
  onClose,
  onMarkAsRead,
}) => {
  if (!log) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
    };
  };

  const logDateTime = formatDateTime(log.TIME);
  const timeInFormatted = log.TIME_IN ? formatDateTime(log.TIME_IN) : null;
  const timeOutFormatted = log.TIME_OUT ? formatDateTime(log.TIME_OUT) : null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <View style={[styles.headerIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="notifications" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.modalTitle}>Activity Log</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Activity */}
            <View style={styles.infoSection}>
              <View style={styles.infoLabel}>
                <Ionicons name="clipboard" size={20} color="#4CAF50" />
                <Text style={styles.labelText}>Activity</Text>
              </View>
              <Text style={styles.infoValue}>{log.ACTION || 'Scheduled activity'}</Text>
            </View>

            {/* Date and Time */}
            <View style={styles.infoSection}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar" size={20} color="#2196F3" />
                <Text style={styles.labelText}>Logged On</Text>
              </View>
              <Text style={styles.infoValue}>{logDateTime.date}</Text>
              <Text style={styles.infoSubValue}>{logDateTime.time}</Text>
            </View>

            {/* Time In */}
            {log.TIME_IN && timeInFormatted && (
              <View style={styles.infoSection}>
                <View style={styles.infoLabel}>
                  <Ionicons name="log-in" size={20} color="#009688" />
                  <Text style={styles.labelText}>Time In</Text>
                </View>
                <Text style={styles.infoValue}>{timeInFormatted.time}</Text>
              </View>
            )}

            {/* Time Out */}
            {log.TIME_OUT && timeOutFormatted && (
              <View style={styles.infoSection}>
                <View style={styles.infoLabel}>
                  <Ionicons name="log-out" size={20} color="#E91E63" />
                  <Text style={styles.labelText}>Time Out</Text>
                </View>
                <Text style={styles.infoValue}>{timeOutFormatted.time}</Text>
              </View>
            )}

            {/* Location */}
            {log.LOCATION && (
              <View style={styles.infoSection}>
                <View style={styles.infoLabel}>
                  <Ionicons name="location" size={20} color="#FF9800" />
                  <Text style={styles.labelText}>Location</Text>
                </View>
                <Text style={styles.infoValue}>{log.LOCATION}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.markReadButton]}
              onPress={() => {
                onMarkAsRead();
                onClose();
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Mark as Read</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButtonStyle]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.closeButtonText]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// CommunityAlertModal.tsx - Modal for residents viewing community alerts
interface CommunityAlertModalProps {
  isVisible: boolean;
  log: LogEntry | null;
  onClose: () => void;
  onMarkAsRead: () => void;
}

export const CommunityAlertModal: React.FC<CommunityAlertModalProps> = ({
  isVisible,
  log,
  onClose,
  onMarkAsRead,
}) => {
  if (!log) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
    };
  };

  const alertDateTime = formatDateTime(log.TIME);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <View style={[styles.headerIconContainer, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="warning" size={28} color="#FFC107" />
              </View>
              <Text style={styles.modalTitle}>Community Alert</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Alert Message */}
            <View style={styles.infoSection}>
              <View style={styles.infoLabel}>
                <Ionicons name="megaphone" size={20} color="#FFC107" />
                <Text style={styles.labelText}>Alert Message</Text>
              </View>
              <Text style={styles.infoValue}>{log.ACTION || 'Community announcement'}</Text>
            </View>

            {/* Date and Time */}
            <View style={styles.infoSection}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar" size={20} color="#2196F3" />
                <Text style={styles.labelText}>Posted On</Text>
              </View>
              <Text style={styles.infoValue}>{alertDateTime.date}</Text>
              <Text style={styles.infoSubValue}>{alertDateTime.time}</Text>
            </View>

            {/* Alert Box */}
            <View style={[styles.alertBox, { backgroundColor: '#FFF8E1', borderLeftColor: '#FFC107' }]}>
              <Ionicons name="information-circle" size={22} color="#F57F17" />
              <Text style={[styles.alertText, { color: '#F57F17' }]}>
                This is an important community alert. Please stay informed and take necessary precautions.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.markReadButton]}
              onPress={() => {
                onMarkAsRead();
                onClose();
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Mark as Read</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButtonStyle]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.closeButtonText]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// expo-router treats files under app/ as routes; provide a safe default export.
// The actual modals are consumed via the named exports above.
export default function IncidentReportModalRoute() {
  return null;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontWeight: '500',
  },
  infoSubValue: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  markReadButton: {
    backgroundColor: '#4CAF50',
  },
  closeButtonStyle: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButtonText: {
    color: '#333',
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
    flex: 2, // Make it larger
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },
});