// Notifications.tsx - Updated with modals for all notification types
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReportedIncidentModal from './ReportedIncidentModal';
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../config";
import { IncidentReportModal, ActivityLogModal, CommunityAlertModal } from './IncidentReportModal';

type NotificationsRouteProp = RouteProp<RootStackParamList, "Notifications"> & {
  params: {
    username: string;
    incidentNotifications?: IncidentReport[];
  };
};
type NotificationsNavigationProp = NativeStackNavigationProp<RootStackParamList, "Notifications">;

interface LogEntry {
  ID: number;
  USER: string;
  TIME: string;
  ACTION: string;
  TIME_IN?: string;
  TIME_OUT?: string;
  LOCATION?: string;
}

interface IncidentReport {
  id: number;
  type: string;
  reported_by: string;
  location: string;
  status: string;
  assigned: string;
  created_at: string;
  resolved_by?: string;
  resolved_at?: string;
}

type NotificationType = 'log' | 'patrol' | 'resident' | 'assigned' | 'reported';

const Notifications: React.FC = () => {
  // State Consolidation
  const [notifications, setNotifications] = useState<{
    logs: LogEntry[];
    patrolLogs: LogEntry[];
    residentLogs: LogEntry[];
    assignedIncidents: IncidentReport[];
    reportedIncidents: IncidentReport[];
  }>({
    logs: [],
    patrolLogs: [],
    residentLogs: [],
    assignedIncidents: [],
    reportedIncidents: [],
  });

  const [viewedIds, setViewedIds] = useState<Record<NotificationType, number[]>>({
    log: [],
    patrol: [],
    resident: [],
    assigned: [],
    reported: [],
  });

  const [deletedIds, setDeletedIds] = useState<Record<NotificationType, number[]>>({
    log: [],
    patrol: [],
    resident: [],
    assigned: [],
    reported: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<NotificationsNavigationProp>();
  const route = useRoute<NotificationsRouteProp>();
  const { username, incidentNotifications = [] } = route.params;
  const [userRole, setUserRole] = useState<string>('');

  // Modal states
  const [isAssignedModalVisible, setIsAssignedModalVisible] = useState(false);
  const [selectedAssignedIncident, setSelectedAssignedIncident] = useState<IncidentReport | null>(null);
  
  const [isReportedModalVisible, setIsReportedModalVisible] = useState(false);
  const [selectedReportedIncident, setSelectedReportedIncident] = useState<IncidentReport | null>(null);
  
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [selectedActivityLog, setSelectedActivityLog] = useState<LogEntry | null>(null);
  
  const [isIncidentReportModalVisible, setIsIncidentReportModalVisible] = useState(false);
  const [selectedIncidentReport, setSelectedIncidentReport] = useState<LogEntry | null>(null);
  
  const [isCommunityAlertModalVisible, setIsCommunityAlertModalVisible] = useState(false);
  const [selectedCommunityAlert, setSelectedCommunityAlert] = useState<LogEntry | null>(null);

  // Helper function to categorize incidents
  const categorizeIncidents = (incidents: IncidentReport[], currentViewedIds: number[]) => {
    const unresolved = incidents.filter(incident => incident.status !== 'Resolved');
    const resolved = incidents.filter(incident => incident.status === 'Resolved');
    
    const newIncidents = unresolved.filter(incident => 
      !currentViewedIds.includes(incident.id) && 
      incident.resolved_by !== username
    );
    
    const viewedUnresolved = unresolved.filter(incident => 
      currentViewedIds.includes(incident.id) || 
      incident.resolved_by === username
    );
    
    return { newIncidents, viewedUnresolved, resolved };
  };

  // Categorize assigned incidents
  const assignedCategorized = categorizeIncidents(notifications.assignedIncidents, viewedIds.assigned);
  
  // Categorize reported incidents
  const reportedCategorized = categorizeIncidents(notifications.reportedIncidents, viewedIds.reported);

  // Separate resident logs into new and viewed
  const newResidentLogs = notifications.residentLogs.filter(log => !viewedIds.resident.includes(log.ID) && !deletedIds.resident.includes(log.ID));
  const viewedResidentLogsList = notifications.residentLogs.filter(log => viewedIds.resident.includes(log.ID) && !deletedIds.resident.includes(log.ID));

  const loadUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      if (role) {
        setUserRole(role);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  const loadStateFromStorage = useCallback(async (stateType: 'viewed' | 'deleted') => {
    try {
      const keys: [NotificationType, string][] = [
        ['log', `deleted_notifications_${username}`],
        ['patrol', `deleted_patrol_logs_${username}`],
        ['resident', `deleted_resident_logs_${username}`],
        ['assigned', `deleted_assigned_incidents_${username}`],
        ['reported', `deleted_reported_incidents_${username}`],
      ];
      const storageKeys = keys.map(k => stateType === 'viewed' ? `viewed_${k[1].split('_').slice(1).join('_')}` : k[1]);
      const values = await AsyncStorage.multiGet(storageKeys);

      const newState: Record<NotificationType, number[]> = { log: [], patrol: [], resident: [], assigned: [], reported: [] };
      values.forEach(([key, value], index) => {
        if (value) {
          const type = keys[index][0];
          newState[type] = JSON.parse(value);
        }
      });

      if (stateType === 'deleted') {
        setDeletedIds(newState);
      } else {
        setViewedIds(newState);
      }
    } catch (error) {
      console.error(`Error loading ${stateType} state:`, error);
    }
  }, [username]);

  const updateStoredIds = useCallback(async (id: number, type: NotificationType, stateType: 'viewed' | 'deleted') => {
    const stateToUpdate = stateType === 'viewed' ? viewedIds : deletedIds;
    const setStateToUpdate = stateType === 'viewed' ? setViewedIds : setDeletedIds;

    if (!stateToUpdate[type].includes(id)) {
      const newIds = { ...stateToUpdate, [type]: [...stateToUpdate[type], id] };
      setStateToUpdate(newIds);
      const storageKey = stateType === 'viewed' ? `viewed_${type}_logs_${username}` : `deleted_${type}_logs_${username}`;
      await AsyncStorage.setItem(storageKey.replace('_logs_', `_${type === 'assigned' || type === 'reported' ? 'incidents' : 'logs'}_`), JSON.stringify(newIds[type]));
    }
  }, [viewedIds, deletedIds, username]);

  const deleteNotification = (id: number, type: NotificationType) => {
    Alert.alert("Delete Notification", "Are you sure you want to permanently hide this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => updateStoredIds(id, type, 'deleted'),
      },
    ]);
  };

  // Fetch user logs from API
  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/logs/${username}`);
      setNotifications(prev => ({
        ...prev,
        logs: response.data || []
      }));
    } catch (error) {
      console.error("Error fetching logs:", error);
      Alert.alert("Error", "Failed to load notifications");
    }
  };

  // Fetch patrol logs from API
  const fetchPatrolLogs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/logs_patrol/${username}`);
      setNotifications(prev => ({
        ...prev,
        patrolLogs: response.data || []
      }));
    } catch (error) {
      console.error("Error fetching patrol logs:", error);
    }
  };

  // Fetch resident logs from API
  const fetchResidentLogs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/logs_resident/${username}`);
      setNotifications(prev => ({ ...prev, residentLogs: response.data || [] }));
    } catch (error) {
      console.error("Error fetching resident logs:", error);
    }
  };

  // Fetch assigned incidents
  const fetchAssignedIncidents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/incidents/assigned/${username}`);
      const fetchedIncidents = response.data || [];
      setNotifications(prev => ({
        ...prev,
        assignedIncidents: fetchedIncidents
      }));
      
      const resolvedByCurrentUser = fetchedIncidents
        .filter((incident: IncidentReport) => incident.resolved_by === username)
        .map((incident: IncidentReport) => incident.id);
      
      if (resolvedByCurrentUser.length > 0) {
        const currentViewed = await AsyncStorage.getItem(`viewed_assigned_incidents_${username}`);
        const existingViewed = currentViewed ? JSON.parse(currentViewed) : [];
        const newViewed = [...new Set([...existingViewed, ...resolvedByCurrentUser])];
        setViewedIds(prev => ({ ...prev, assigned: newViewed }));
        await AsyncStorage.setItem(`viewed_assigned_incidents_${username}`, JSON.stringify(newViewed));
      }
    } catch (error) {
      console.error("Error fetching assigned incidents:", error);
    }
  };

  // Fetch reported incidents
  const fetchReportedIncidents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/incidents/reported/${username}`);
      const fetchedIncidents = response.data || [];
      setNotifications(prev => ({
        ...prev,
        reportedIncidents: fetchedIncidents
      }));
    } catch (error) {
      console.error("Error fetching reported incidents:", error);
    }
  };

  // Load data on component mount
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadStateFromStorage('viewed'),
      loadStateFromStorage('deleted'),
      loadUserRole(),
      fetchLogs(),
      fetchPatrolLogs(),
      fetchResidentLogs(),
      fetchAssignedIncidents(),
      fetchReportedIncidents(),
    ]);
    
    if (incidentNotifications.length > 0) {
      setNotifications(prev => ({ ...prev, assignedIncidents: incidentNotifications }));
    }

    setLoading(false);
  }, [username, loadStateFromStorage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    await fetchPatrolLogs();
    await fetchResidentLogs();
    await fetchAssignedIncidents();
    await fetchReportedIncidents();
    setRefreshing(false);
  }, [username]);

  // Mark all notifications as viewed
  const markAllAsViewed = async () => {
    const newViewedIds: Record<NotificationType, number[]> = {
      log: notifications.logs.map(log => log.ID),
      assigned: notifications.assignedIncidents.map(incident => incident.id),
      reported: notifications.reportedIncidents.map(incident => incident.id),
      patrol: notifications.patrolLogs.map(log => log.ID),
      resident: notifications.residentLogs.map(log => log.ID),
    };
    setViewedIds(newViewedIds);

    await Promise.all([
      AsyncStorage.setItem(`viewed_notifications_${username}`, JSON.stringify(newViewedIds.log)),
      AsyncStorage.setItem(`viewed_assigned_incidents_${username}`, JSON.stringify(newViewedIds.assigned)),
      AsyncStorage.setItem(`viewed_reported_incidents_${username}`, JSON.stringify(newViewedIds.reported)),
      AsyncStorage.setItem(`viewed_patrol_logs_${username}`, JSON.stringify(newViewedIds.patrol)),
      AsyncStorage.setItem(`viewed_resident_logs_${username}`, JSON.stringify(newViewedIds.resident)),
    ]);

    try {
      const { logs, assignedIncidents, patrolLogs, residentLogs } = notifications;
      const getMaxId = (items: { ID?: number; id?: number }[]) =>
        items.length > 0 ? Math.max(...items.map(item => item.ID || item.id || 0)) : null;

      const latestLogId = getMaxId(logs);
      const latestIncidentId = getMaxId(assignedIncidents);
      const latestPatrolLogId = getMaxId(patrolLogs);
      const latestResidentLogId = getMaxId(residentLogs);

      if (latestLogId) await AsyncStorage.setItem(`lastLogId_${username}`, latestLogId.toString());
      if (latestIncidentId) await AsyncStorage.setItem(`lastIncidentId_${username}`, latestIncidentId.toString());
      if (latestPatrolLogId) await AsyncStorage.setItem(`lastPatrolLogId_${username}`, latestPatrolLogId.toString());
      if (latestResidentLogId) await AsyncStorage.setItem(`lastResidentLogId_${username}`, latestResidentLogId.toString());
      
      await AsyncStorage.setItem(`unreadIncidentIds_${username}`, JSON.stringify([]));
    } catch (error) {
      console.error("Error syncing with NavBar state from Notifications:", error);
    }
  };

  // Clear all viewed
  const clearAllViewed = async () => {
    Alert.alert(
      "Reset Notifications",
      "Are you sure you want to mark all notifications as new? This will reset your viewed history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            const emptyIds = { log: [], patrol: [], resident: [], assigned: [], reported: [] };
            setViewedIds(emptyIds);
            setDeletedIds(emptyIds);

            const keysToRemove = [
              `lastLogId_${username}`, `lastIncidentId_${username}`, `lastPatrolLogId_${username}`, `lastResidentLogId_${username}`, `unreadIncidentIds_${username}`,
              `viewed_notifications_${username}`, `viewed_patrol_logs_${username}`, `viewed_resident_logs_${username}`, `viewed_assigned_incidents_${username}`, `viewed_reported_incidents_${username}`,
              `deleted_notifications_${username}`, `deleted_patrol_logs_${username}`, `deleted_resident_logs_${username}`, `deleted_assigned_incidents_${username}`, `deleted_reported_incidents_${username}`
            ];
            await AsyncStorage.multiRemove(keysToRemove);
          },
        },
      ]
    );
  };

  // Function to resolve incident (for assigned incidents only)
  const resolveIncident = async (incidentId: number) => {
    try {
      await axios.put(`${BASE_URL}/api/incidents/${incidentId}/resolve`, {
        resolved_by: username
      });
      
      setNotifications(prev => ({
        ...prev,
        assignedIncidents: prev.assignedIncidents.map(incident =>
          incident.id === incidentId 
            ? { ...incident, status: 'Resolved', resolved_by: username }
            : incident
        )
      }));
      await updateStoredIds(incidentId, 'assigned', 'viewed');
      
      Alert.alert("Success", "Incident marked as resolved");
    } catch (error) {
      console.error("Error resolving incident:", error);
      Alert.alert("Error", "Failed to resolve incident");
    }
  };

  // Function to resolve a patrol log incident with proof (photo or video)
  const resolvePatrolLog = async (logId: number, mediaUri: string) => {
    if (!username) {
      Alert.alert("Error", "Username not found. Cannot resolve incident.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('logId', logId.toString());
      formData.append('resolved_by', username);

      // Prepare media for upload
      const filename = mediaUri.split('/').pop()!;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : '';
      const isVideo = ['mp4', 'mov', 'm4v', 'webm', '3gp', 'mkv', 'avi'].includes(ext);
      const type = ext ? `${isVideo ? 'video' : 'image'}/${ext}` : (isVideo ? 'video/*' : 'image/*');

      // The 'any' type is used here because the standard FormData type definition
      // in TypeScript doesn't perfectly match React Native's structure for file uploads.
      formData.append('resolutionMedia', {
        uri: mediaUri,
        name: filename,
        type,
      } as any);

      // API call to a new endpoint for resolving patrol logs
      const response = await axios.post(`${BASE_URL}/api/patrol-logs/resolve`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Alert.alert('Success', 'Incident has been resolved and proof has been uploaded.');
        await updateStoredIds(logId, 'patrol', 'viewed'); // Mark as viewed locally
      }
    } catch (error) {
      console.error("Error resolving patrol log:", error);
      Alert.alert("Error", "Failed to submit resolution. Please check your connection and try again.");
      throw error; // Re-throw to prevent modal from closing on failure
    }
  };

  // Show incident details in a modal
  const showAssignedIncidentDetails = (incident: IncidentReport) => {
    setSelectedAssignedIncident(incident);
    setIsAssignedModalVisible(true);
    // updateStoredIds(incident.id, 'assigned', 'viewed'); // Removed to prevent auto-marking as read
  };

  const resolveReportedIncident = async (incidentId: number) => {
    try {
      await axios.put(`${BASE_URL}/api/incidents/${incidentId}/resolve`, {
        resolved_by: username
      });
      
      setNotifications(prev => ({
        ...prev,
        reportedIncidents: prev.reportedIncidents.map(incident =>
          incident.id === incidentId 
            ? { ...incident, status: 'Resolved', resolved_by: username }
            : incident
        )
      }));
      
      await updateStoredIds(incidentId, 'reported', 'viewed');
      
      Alert.alert("Success", "Incident marked as resolved");
    } catch (error) {
      console.error("Error resolving incident:", error);
      Alert.alert("Error", "Failed to resolve incident");
    }
  };

  const resolveReportedIncidentAsAdmin = async (incidentId: number) => {
    try {
      await axios.put(`${BASE_URL}/api/incidents/${incidentId}/resolve`, {
        resolved_by: 'Admin'
      });
      
      setNotifications(prev => ({
        ...prev,
        reportedIncidents: prev.reportedIncidents.map(incident =>
          incident.id === incidentId 
            ? { ...incident, status: 'Resolved', resolved_by: 'Admin' }
            : incident
        )
      }));
      
      await updateStoredIds(incidentId, 'reported', 'viewed');
      
      Alert.alert("Success", "Incident marked as resolved by Admin");
    } catch (error) {
      console.error("Error resolving incident as admin:", error);
      Alert.alert("Error", "Failed to resolve incident");
    }
  };

  const showReportedIncidentDetails = (incident: IncidentReport) => {
    setSelectedReportedIncident(incident);
    setIsReportedModalVisible(true);
    updateStoredIds(incident.id, 'reported', 'viewed');
  };

  // Show activity log modal
  const showActivityLogDetails = (log: LogEntry) => {
    setSelectedActivityLog(log);
    setIsActivityModalVisible(true);
    updateStoredIds(log.ID, 'log', 'viewed');
  };

  // Show incident report modal
  const showIncidentReportDetails = (log: LogEntry) => {
    setSelectedIncidentReport(log);
    setIsIncidentReportModalVisible(true);
    // updateStoredIds(log.ID, 'patrol', 'viewed'); // Removed to prevent auto-marking as read
  };

  // Show community alert modal
  const showCommunityAlertDetails = (log: LogEntry) => {
    setSelectedCommunityAlert(log);
    setIsCommunityAlertModalVisible(true);
    updateStoredIds(log.ID, 'resident', 'viewed');
  };

  // Render assigned incident item
  const renderAssignedIncidentItem = (incident: IncidentReport, isNew: boolean) => {
    const date = new Date(incident.created_at).toLocaleDateString();
    const time = new Date(incident.created_at).toLocaleTimeString();
    const isResolved = incident.status === 'Resolved';
    const resolvedByCurrentUser = incident.resolved_by === username;
    const isUnresolvedButViewed = !isResolved && !isNew;
    
    return (
      <TouchableOpacity
        key={`assigned_${incident.id}`}
        style={[ 
          styles.notificationItem,
          isNew ? styles.newNotification : styles.viewedNotification,
          resolvedByCurrentUser && styles.resolvedByMeNotification,
          isUnresolvedButViewed && styles.unresolvedViewedNotification
        ]}
        onPress={() => showAssignedIncidentDetails(incident)}
      >
        <View style={styles.notificationHeader}> 
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={isResolved ? "checkmark-circle" : (isNew ? "alert-circle" : "alert-circle-outline")}
              size={20} 
              color={isResolved ? "#4CAF50" : (isNew ? "#FF5722" : (isUnresolvedButViewed ? "#FF9800" : "#666"))} 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[ 
              styles.notificationTitle, 
              isNew && styles.newIncidentTitle,
              isUnresolvedButViewed && styles.unresolvedViewedTitle
            ]}>
              🚨 Assigned: {incident.type}
            </Text>
            <Text style={styles.notificationDate}>
              {date} at {time}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-sharp" size={14} color="#FF9800" style={{ marginRight: 4 }} />
              <Text style={styles.notificationLocation}>{incident.location}</Text>
            </View>
            <Text style={[ 
              styles.notificationLocation,
              isResolved && { color: "#4CAF50", fontWeight: "bold" },
              isUnresolvedButViewed && { color: "#FF9800", fontWeight: "bold" }
            ]}>
              Status: {incident.status}
            </Text>
            <Text style={styles.incidentReporter}>
              Reported by: {incident.reported_by}
            </Text>
            {resolvedByCurrentUser && (
              <Text style={styles.resolvedByMeText}>
                ✓ Resolved by you
              </Text>
            )}
            {isUnresolvedButViewed && (
              <Text style={styles.unresolvedViewedText}>
                ⚠️ Needs attention
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(incident.id, 'assigned')}> 
            <Ionicons
              name="trash-bin-outline"
              size={20}
              color="#e74c3c"
            />
          </TouchableOpacity>
          {isNew && <View style={styles.newIncidentBadge} />}
          {isUnresolvedButViewed && <View style={styles.unresolvedViewedBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Render reported incident item
  const renderReportedIncidentItem = (incident: IncidentReport, isNew: boolean) => {
    const date = new Date(incident.created_at).toLocaleDateString();
    const time = new Date(incident.created_at).toLocaleTimeString();
    const isResolved = incident.status === 'Resolved';
    const isUnresolvedButViewed = !isResolved && !isNew;
    
    return (
      <TouchableOpacity
        key={`reported_${incident.id}`}
        style={[ 
          styles.notificationItem,
          isNew ? styles.newReportedNotification : styles.viewedNotification,
          isUnresolvedButViewed && styles.unresolvedViewedNotification
        ]}
        onPress={() => showReportedIncidentDetails(incident)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={isResolved ? "checkmark-circle" : (isNew ? "document-text" : "document-text-outline")}
              size={20} 
              color={isResolved ? "#4CAF50" : (isNew ? "#2196F3" : (isUnresolvedButViewed ? "#FF9800" : "#666"))} 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[ 
              styles.notificationTitle, 
              isNew && styles.newReportedTitle,
              isUnresolvedButViewed && styles.unresolvedViewedTitle
            ]}>
              📋 Your Report: {incident.type}
            </Text>
            <Text style={styles.notificationDate}>
              {date} at {time}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-sharp" size={14} color="#2196F3" style={{ marginRight: 4 }} />
              <Text style={styles.notificationLocation}>{incident.location}</Text>
            </View>
            <Text style={[ 
              styles.notificationLocation,
              isResolved && { color: "#4CAF50", fontWeight: "bold" },
              isUnresolvedButViewed && { color: "#FF9800", fontWeight: "bold" }
            ]}>
              Status: {incident.status === 'Resolved' && incident.resolved_by === 'Admin' 
                ? 'Marked as Resolved by Admin' 
                : incident.status}
            </Text>
            {incident.assigned && (
              <Text style={styles.incidentReporter}>
                Assigned to: {incident.assigned}
              </Text>
            )}
            {!incident.assigned && !(incident.status === 'Resolved' && incident.resolved_by === 'Admin') && (
              <Text style={[styles.incidentReporter, { color: "#FF9800" }]}>
                Not yet assigned
              </Text>
            )}
            {isUnresolvedButViewed && (
              <Text style={styles.unresolvedViewedText}>
                ⏳ Awaiting response
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(incident.id, 'reported')}> 
            <Ionicons
              name="trash-bin-outline"
              size={20}
              color="#e74c3c"
            />
          </TouchableOpacity>
          {isNew && <View style={styles.newReportedBadge} />}
          {isUnresolvedButViewed && <View style={styles.unresolvedViewedBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Render resident log item
  const renderResidentLogItem = (log: LogEntry, isNew: boolean) => {
    const date = new Date(log.TIME).toLocaleDateString();
    const time = new Date(log.TIME).toLocaleTimeString();

    return (
      <TouchableOpacity
        key={`resident_${log.ID}`}
        style={[
          styles.notificationItem,
          isNew ? styles.newCommunityAlertNotification : styles.viewedNotification
        ]}
        onPress={() => showCommunityAlertDetails(log)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons
              name={isNew ? "warning" : "warning-outline"}
              size={20}
              color={isNew ? "#FFC107" : "#666"}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newCommunityAlertTitle]}>
              📢 Community Alert
            </Text>
            <Text style={styles.notificationDate}>
              {date} at {time}
            </Text>
            <Text style={styles.notificationLocation}>
              {log.ACTION}
            </Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(log.ID, 'resident')}> 
            <Ionicons
              name="trash-bin-outline"
              size={20}
              color="#e74c3c"
            />
          </TouchableOpacity>
          {isNew && <View style={styles.newCommunityAlertBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Separate logs into new and viewed
  const newNotifications = notifications.logs.filter(log => !viewedIds.log.includes(log.ID) && !deletedIds.log.includes(log.ID));
  const viewedNotificationsList = notifications.logs.filter(log => viewedIds.log.includes(log.ID) && !deletedIds.log.includes(log.ID));

  // Separate patrol logs into new and viewed
  const newPatrolLogs = notifications.patrolLogs.filter(log => !viewedIds.patrol.includes(log.ID) && !deletedIds.patrol.includes(log.ID));
  const viewedPatrolLogsList = notifications.patrolLogs.filter(log => viewedIds.patrol.includes(log.ID) && !deletedIds.patrol.includes(log.ID));

  // Render notification item
  const renderNotificationItem = (log: LogEntry, isNew: boolean) => {
    const date = new Date(log.TIME).toLocaleDateString();
    const time = new Date(log.TIME).toLocaleTimeString();
    
    return (
      <TouchableOpacity
        key={log.ID}
        style={[ 
          styles.notificationItem,
          isNew ? styles.newNotification : styles.viewedNotification
        ]}
        onPress={() => showActivityLogDetails(log)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons 
              name={isNew ? "notifications" : "notifications-outline"} 
              size={20} 
              color={isNew ? "#4CAF50" : "#666"} 
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newNotificationTitle]}>
              {log.ACTION}
            </Text>
            <Text style={styles.notificationDate}>
              {date} at {time}
            </Text>
            {log.LOCATION && (
              <Text style={styles.notificationLocation}>
                📍 {log.LOCATION}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(log.ID, 'log')}> 
            <Ionicons
              name="trash-bin-outline"
              size={20}
              color="#e74c3c"
            />
          </TouchableOpacity>
          {isNew && <View style={styles.newBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  // Render patrol log item
  const renderPatrolLogItem = (log: LogEntry, isNew: boolean) => {
    const date = new Date(log.TIME).toLocaleDateString();
    const time = new Date(log.TIME).toLocaleTimeString();

    return (
      <TouchableOpacity
        key={`patrol_${log.ID}`}
        style={[ 
          styles.notificationItem,
          isNew ? styles.newIncidentReportNotification : styles.viewedNotification
        ]}
        onPress={() => showIncidentReportDetails(log)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Ionicons
              name={isNew ? "alert-circle" : "alert-circle-outline"}
              size={20}
              color={isNew ? "#FF5722" : "#666"}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newIncidentReportTitle]}>
              🚨 {log.ACTION || 'Incident Report'}
            </Text>
            <Text style={styles.notificationDate}>
              {date} at {time}
            </Text>
            {log.LOCATION && (
              <Text style={styles.notificationLocation}>
                📍 {log.LOCATION}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(log.ID, 'patrol')}> 
            <Ionicons
              name="trash-bin-outline"
              size={20}
              color="#e74c3c"
            />
          </TouchableOpacity>
          {isNew && <View style={styles.newIncidentReportBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  // Calculate totals
  const totalNew = newNotifications.length +
    assignedCategorized.newIncidents.length +
    reportedCategorized.newIncidents.length +
    newPatrolLogs.length +
    newResidentLogs.length;  
  
  const totalViewed = viewedNotificationsList.length +
    assignedCategorized.viewedUnresolved.length +
    assignedCategorized.resolved.length +
    reportedCategorized.viewedUnresolved.length +
    reportedCategorized.resolved.length +    
    viewedPatrolLogsList.length +
    viewedResidentLogsList.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsViewed}>
          <Ionicons name="checkmark-done" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* All Modals */}
     
      <ReportedIncidentModal
        isVisible={isReportedModalVisible}
        incident={selectedReportedIncident}
        userRole={userRole}
        username={username}
        onClose={() => setIsReportedModalVisible(false)}
        onResolve={() => selectedReportedIncident && resolveReportedIncident(selectedReportedIncident.id).then(() => setIsReportedModalVisible(false))}
        onResolveAsAdmin={() => selectedReportedIncident && resolveReportedIncidentAsAdmin(selectedReportedIncident.id).then(() => setIsReportedModalVisible(false))}
      />

    {/* All Modals */}

{/* Incident Report Modal for Tanods (Patrol Logs) */}
<IncidentReportModal
  isVisible={isIncidentReportModalVisible}
  log={selectedIncidentReport}
  onClose={() => setIsIncidentReportModalVisible(false)}
  onMarkAsRead={() => selectedIncidentReport && updateStoredIds(selectedIncidentReport.ID, 'patrol', 'viewed')}
  onResolve={resolvePatrolLog}
/>

{/* Activity Log Modal */}
<ActivityLogModal
  isVisible={isActivityModalVisible}
  log={selectedActivityLog}
  onClose={() => setIsActivityModalVisible(false)}
  onMarkAsRead={() => selectedActivityLog && updateStoredIds(selectedActivityLog.ID, 'log', 'viewed')}
/>

{/* Community Alert Modal for Residents */}
<CommunityAlertModal
  isVisible={isCommunityAlertModalVisible}
  log={selectedCommunityAlert}
  onClose={() => setIsCommunityAlertModalVisible(false)}
  onMarkAsRead={() => selectedCommunityAlert && updateStoredIds(selectedCommunityAlert.ID, 'resident', 'viewed')}
/>

{/* Reported Incident Modal (existing) */}
<ReportedIncidentModal
  isVisible={isReportedModalVisible}
  incident={selectedReportedIncident}
  userRole={userRole}
  username={username}
  onClose={() => setIsReportedModalVisible(false)}
  onResolve={() => selectedReportedIncident && resolveReportedIncident(selectedReportedIncident.id).then(() => setIsReportedModalVisible(false))}
  onResolveAsAdmin={() => selectedReportedIncident && resolveReportedIncidentAsAdmin(selectedReportedIncident.id).then(() => setIsReportedModalVisible(false))}
/>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={markAllAsViewed}>
            <Ionicons name="checkmark-done-outline" size={16} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={clearAllViewed}>
            <Ionicons name="refresh-outline" size={16} color="#FF9800" />
            <Text style={styles.actionButtonText}>Reset All</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {totalNew} new • {totalViewed} viewed
          </Text>
        </View>

        {totalNew === 0 && totalViewed === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              Your activity logs and incident updates will appear here
            </Text>
          </View>
        ) : (
          <>
            {/* New Community Alerts for Residents */}
            {newResidentLogs.length > 0 && userRole === 'Resident' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📢 Community Alerts ({newResidentLogs.length})
                </Text>
                {newResidentLogs.map(log => renderResidentLogItem(log, true))}
              </View>
            )}

            {/* New Incident Reports for Tanods */}
            {newPatrolLogs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🚨 New Incident Reports ({newPatrolLogs.length})
                </Text>
                {newPatrolLogs.map(log => renderPatrolLogItem(log, true))}
              </View>
            )}

            {/* New Assigned Incidents */}
            {assignedCategorized.newIncidents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🚨 New Incident Assignments ({assignedCategorized.newIncidents.length})
                </Text>
                {assignedCategorized.newIncidents.map(incident => renderAssignedIncidentItem(incident, true))}
              </View>
            )}

            {/* New Reported Incidents Updates */}
            {reportedCategorized.newIncidents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📋 New Updates on Your Reports ({reportedCategorized.newIncidents.length})
                </Text>
                {reportedCategorized.newIncidents.map(incident => renderReportedIncidentItem(incident, true))}
              </View>
            )}

            {/* New Activity Notifications */}
            {newNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🔔 New Activity ({newNotifications.length})
                </Text>
                {newNotifications.map(log => renderNotificationItem(log, true))}
              </View>
            )}

            {/* Earlier Section */}
            {totalViewed > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Earlier ({totalViewed})
                </Text>
                {/* Viewed community alerts */}
                {viewedResidentLogsList.map(log => renderResidentLogItem(log, false))}

                {/* Viewed patrol logs */}
                {viewedPatrolLogsList.map(log => renderPatrolLogItem(log, false))}

                {/* Viewed unresolved assigned incidents (priority) */}
                {assignedCategorized.viewedUnresolved.map(incident => renderAssignedIncidentItem(incident, false))}
                
                {/* Viewed unresolved reported incidents */}
                {reportedCategorized.viewedUnresolved.map(incident => renderReportedIncidentItem(incident, false))}
                
                {/* Viewed activity notifications */}
                {viewedNotificationsList.map(log => renderNotificationItem(log, false))}
                
                {/* Resolved assigned incidents */}
                {assignedCategorized.resolved.map(incident => renderAssignedIncidentItem(incident, false))}
                
                {/* Resolved reported incidents */}
                {reportedCategorized.resolved.map(incident => renderReportedIncidentItem(incident, false))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#555",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  scrollContainer: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  actionButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  summary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#e0e0e0",
  },
  notificationItem: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  newNotification: {
    backgroundColor: "#f8fff8",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  deleteButton: {
    marginLeft: 10,
    padding: 5,
    justifyContent: 'center',
  },
  viewedNotification: {
    backgroundColor: "#fff",
  },
  resolvedByMeNotification: {
    backgroundColor: "#f0f8ff",
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  newNotificationTitle: {
    fontWeight: "bold",
    color: "#2E7D32",
  },
  notificationDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  notificationLocation: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
  newBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#999",
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 5,
    textAlign: "center",
  },
  newIncidentTitle: {
    fontWeight: "bold",
    color: "#D32F2F",
  },
  incidentReporter: {
    fontSize: 13,
    color: "#777",
    fontStyle: "italic",
    marginTop: 2,
  },
  newIncidentBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5722",
    marginTop: 5,
  },
  resolvedByMeText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "bold",
    marginTop: 4,
  },
  unresolvedViewedNotification: {
    backgroundColor: "#fff8e1",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  unresolvedViewedTitle: {
    fontWeight: "bold",
    color: "#E65100",
  },
  unresolvedViewedText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "bold",
    marginTop: 4,
  },
  unresolvedViewedBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF9800",
    marginTop: 5,
  },
  newReportedNotification: {
    backgroundColor: "#f0f8ff",
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  newReportedTitle: {
    fontWeight: "bold",
    color: "#1565C0",
  },
  newReportedBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
    marginTop: 5,
  },
  newIncidentReportNotification: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#D32F2F",
  },
  newIncidentReportTitle: {
    fontWeight: "bold",
    color: "#C62828",
  },
  newIncidentReportBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D32F2F",
    marginTop: 5,
  },
  newCommunityAlertNotification: {
    backgroundColor: "#fffbe6",
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  newCommunityAlertTitle: {
    fontWeight: "bold",
    color: "#FFA000",
  },
  newCommunityAlertBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFC107",
    marginTop: 5,
  },
});

export default Notifications;