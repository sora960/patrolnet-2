// Notifications.tsx - Fixed Uploads & Network Errors
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

  const assignedCategorized = categorizeIncidents(notifications.assignedIncidents, viewedIds.assigned);
  const reportedCategorized = categorizeIncidents(notifications.reportedIncidents, viewedIds.reported);

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
      { text: "Delete", style: "destructive", onPress: () => updateStoredIds(id, type, 'deleted') },
    ]);
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/logs/${username}`);
      setNotifications(prev => ({ ...prev, logs: response.data || [] }));
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchPatrolLogs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/logs_patrol/${username}`);
      setNotifications(prev => ({ ...prev, patrolLogs: response.data || [] }));
    } catch (error) {
      console.error("Error fetching patrol logs:", error);
    }
  };

  const fetchResidentLogs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/logs_resident/${username}`);
      setNotifications(prev => ({ ...prev, residentLogs: response.data || [] }));
    } catch (error) {
      console.error("Error fetching resident logs:", error);
    }
  };

  const fetchAssignedIncidents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/incidents/assigned/${username}`);
      const fetchedIncidents = response.data || [];
      setNotifications(prev => ({ ...prev, assignedIncidents: fetchedIncidents }));
      
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

  const fetchReportedIncidents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/incidents/reported/${username}`);
      setNotifications(prev => ({ ...prev, reportedIncidents: response.data || [] }));
    } catch (error) {
      console.error("Error fetching reported incidents:", error);
    }
  };

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLogs(), fetchPatrolLogs(), fetchResidentLogs(),
      fetchAssignedIncidents(), fetchReportedIncidents()
    ]);
    setRefreshing(false);
  }, [username]);

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
  };

  const clearAllViewed = async () => {
    Alert.alert(
      "Reset Notifications",
      "Mark all as new? This resets viewed history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            const emptyIds = { log: [], patrol: [], resident: [], assigned: [], reported: [] };
            setViewedIds(emptyIds);
            setDeletedIds(emptyIds);
            const keys = [
              `viewed_notifications_${username}`, `viewed_patrol_logs_${username}`, `viewed_resident_logs_${username}`,
              `viewed_assigned_incidents_${username}`, `viewed_reported_incidents_${username}`,
              `deleted_notifications_${username}`, `deleted_patrol_logs_${username}`, `deleted_resident_logs_${username}`,
              `deleted_assigned_incidents_${username}`, `deleted_reported_incidents_${username}`
            ];
            await AsyncStorage.multiRemove(keys);
          },
        },
      ]
    );
  };

  // ✅ FIXED: Upload Function using FETCH instead of AXIOS to fix Network Error
  const resolvePatrolLog = async (logId: number, mediaUri: string) => {
    if (!username) {
      Alert.alert("Error", "Username not found. Cannot resolve incident.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('logId', logId.toString());
      formData.append('resolved_by', username);

      const filename = mediaUri.split('/').pop()!;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const isVideo = ['mp4', 'mov', 'm4v', 'webm', '3gp', 'mkv', 'avi'].includes(ext);
      const type = isVideo ? `video/${ext === 'mov' ? 'quicktime' : ext}` : `image/${ext === 'png' ? 'png' : 'jpeg'}`;

      // @ts-ignore
      formData.append('resolutionMedia', {
        uri: mediaUri,
        name: filename,
        type,
      });

      // Using FETCH is cleaner for multipart/form-data in React Native
      const response = await fetch(`${BASE_URL}/api/patrol-logs/resolve`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Note: Content-Type header must be omitted for FormData to work correctly
        },
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Incident has been resolved and proof has been uploaded.');
        await updateStoredIds(logId, 'patrol', 'viewed');
      } else {
        throw new Error(data.message || 'Failed to resolve incident');
      }
    } catch (error) {
      console.error("Error resolving patrol log:", error);
      Alert.alert("Error", "Failed to submit resolution. Please check your connection.");
    }
  };

  // Handlers for modals
  const showAssignedIncidentDetails = (incident: IncidentReport) => {
    setSelectedAssignedIncident(incident);
    setIsAssignedModalVisible(true);
  };

  const resolveReportedIncident = async (incidentId: number) => {
    try {
      await axios.put(`${BASE_URL}/api/incidents/${incidentId}/resolve`, { resolved_by: username });
      setNotifications(prev => ({
        ...prev,
        reportedIncidents: prev.reportedIncidents.map(i => i.id === incidentId ? { ...i, status: 'Resolved', resolved_by: username } : i)
      }));
      await updateStoredIds(incidentId, 'reported', 'viewed');
      Alert.alert("Success", "Incident marked as resolved");
    } catch (error) {
      Alert.alert("Error", "Failed to resolve incident");
    }
  };

  const resolveReportedIncidentAsAdmin = async (incidentId: number) => {
    try {
      await axios.put(`${BASE_URL}/api/incidents/${incidentId}/resolve`, { resolved_by: 'Admin' });
      setNotifications(prev => ({
        ...prev,
        reportedIncidents: prev.reportedIncidents.map(i => i.id === incidentId ? { ...i, status: 'Resolved', resolved_by: 'Admin' } : i)
      }));
      await updateStoredIds(incidentId, 'reported', 'viewed');
      Alert.alert("Success", "Incident resolved by Admin");
    } catch (error) {
      Alert.alert("Error", "Failed to resolve incident");
    }
  };

  const showReportedIncidentDetails = (incident: IncidentReport) => {
    setSelectedReportedIncident(incident);
    setIsReportedModalVisible(true);
    updateStoredIds(incident.id, 'reported', 'viewed');
  };

  const showActivityLogDetails = (log: LogEntry) => {
    setSelectedActivityLog(log);
    setIsActivityModalVisible(true);
    updateStoredIds(log.ID, 'log', 'viewed');
  };

  const showIncidentReportDetails = (log: LogEntry) => {
    setSelectedIncidentReport(log);
    setIsIncidentReportModalVisible(true);
  };

  const showCommunityAlertDetails = (log: LogEntry) => {
    setSelectedCommunityAlert(log);
    setIsCommunityAlertModalVisible(true);
    updateStoredIds(log.ID, 'resident', 'viewed');
  };

  // --- Render Items --- (Refactored for brevity, same logic as before)
  const renderAssignedIncidentItem = (incident: IncidentReport, isNew: boolean) => {
    const date = new Date(incident.created_at).toLocaleDateString();
    const time = new Date(incident.created_at).toLocaleTimeString();
    const isResolved = incident.status === 'Resolved';
    const isUnresolvedButViewed = !isResolved && !isNew;
    return (
      <TouchableOpacity key={`assigned_${incident.id}`} style={[styles.notificationItem, isNew ? styles.newNotification : styles.viewedNotification, isUnresolvedButViewed && styles.unresolvedViewedNotification]} onPress={() => showAssignedIncidentDetails(incident)}>
        <View style={styles.notificationHeader}>
          <Ionicons name={isResolved ? "checkmark-circle" : (isNew ? "alert-circle" : "alert-circle-outline")} size={20} color={isResolved ? "#4CAF50" : (isNew ? "#FF5722" : (isUnresolvedButViewed ? "#FF9800" : "#666"))} style={styles.notificationIcon} />
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newIncidentTitle]}>🚨 Assigned: {incident.type}</Text>
            <Text style={styles.notificationDate}>{date} at {time}</Text>
            <Text style={styles.notificationLocation}>{incident.location}</Text>
            <Text style={[styles.notificationLocation, isResolved ? { color: "#4CAF50" } : { color: "#FF9800" }]}>Status: {incident.status}</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(incident.id, 'assigned')}><Ionicons name="trash-bin-outline" size={20} color="#e74c3c" /></TouchableOpacity>
          {isNew && <View style={styles.newIncidentBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderReportedIncidentItem = (incident: IncidentReport, isNew: boolean) => {
    const date = new Date(incident.created_at).toLocaleDateString();
    const time = new Date(incident.created_at).toLocaleTimeString();
    const isResolved = incident.status === 'Resolved';
    return (
      <TouchableOpacity key={`reported_${incident.id}`} style={[styles.notificationItem, isNew ? styles.newReportedNotification : styles.viewedNotification]} onPress={() => showReportedIncidentDetails(incident)}>
        <View style={styles.notificationHeader}>
          <Ionicons name={isResolved ? "checkmark-circle" : "document-text"} size={20} color={isResolved ? "#4CAF50" : "#2196F3"} style={styles.notificationIcon} />
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newReportedTitle]}>📋 Your Report: {incident.type}</Text>
            <Text style={styles.notificationDate}>{date} at {time}</Text>
            <Text style={styles.notificationLocation}>{incident.location}</Text>
            <Text style={styles.notificationLocation}>Status: {incident.status}</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(incident.id, 'reported')}><Ionicons name="trash-bin-outline" size={20} color="#e74c3c" /></TouchableOpacity>
          {isNew && <View style={styles.newReportedBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPatrolLogItem = (log: LogEntry, isNew: boolean) => {
    const date = new Date(log.TIME).toLocaleDateString();
    const time = new Date(log.TIME).toLocaleTimeString();
    return (
      <TouchableOpacity key={`patrol_${log.ID}`} style={[styles.notificationItem, isNew ? styles.newIncidentReportNotification : styles.viewedNotification]} onPress={() => showIncidentReportDetails(log)}>
        <View style={styles.notificationHeader}>
          <Ionicons name={isNew ? "alert-circle" : "alert-circle-outline"} size={20} color={isNew ? "#FF5722" : "#666"} style={styles.notificationIcon} />
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newIncidentReportTitle]}>🚨 {log.ACTION || 'Incident Report'}</Text>
            <Text style={styles.notificationDate}>{date} at {time}</Text>
            <Text style={styles.notificationLocation}>{log.LOCATION}</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(log.ID, 'patrol')}><Ionicons name="trash-bin-outline" size={20} color="#e74c3c" /></TouchableOpacity>
          {isNew && <View style={styles.newIncidentReportBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderResidentLogItem = (log: LogEntry, isNew: boolean) => {
    const date = new Date(log.TIME).toLocaleDateString();
    const time = new Date(log.TIME).toLocaleTimeString();
    return (
      <TouchableOpacity key={`resident_${log.ID}`} style={[styles.notificationItem, isNew ? styles.newCommunityAlertNotification : styles.viewedNotification]} onPress={() => showCommunityAlertDetails(log)}>
        <View style={styles.notificationHeader}>
          <Ionicons name="warning" size={20} color={isNew ? "#FFC107" : "#666"} style={styles.notificationIcon} />
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newCommunityAlertTitle]}>📢 Community Alert</Text>
            <Text style={styles.notificationDate}>{date} at {time}</Text>
            <Text style={styles.notificationLocation}>{log.ACTION}</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(log.ID, 'resident')}><Ionicons name="trash-bin-outline" size={20} color="#e74c3c" /></TouchableOpacity>
          {isNew && <View style={styles.newCommunityAlertBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotificationItem = (log: LogEntry, isNew: boolean) => {
    const date = new Date(log.TIME).toLocaleDateString();
    const time = new Date(log.TIME).toLocaleTimeString();
    return (
      <TouchableOpacity key={log.ID} style={[styles.notificationItem, isNew ? styles.newNotification : styles.viewedNotification]} onPress={() => showActivityLogDetails(log)}>
        <View style={styles.notificationHeader}>
          <Ionicons name="notifications" size={20} color={isNew ? "#4CAF50" : "#666"} style={styles.notificationIcon} />
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, isNew && styles.newNotificationTitle]}>{log.ACTION}</Text>
            <Text style={styles.notificationDate}>{date} at {time}</Text>
            {log.LOCATION && <Text style={styles.notificationLocation}>📍 {log.LOCATION}</Text>}
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(log.ID, 'log')}><Ionicons name="trash-bin-outline" size={20} color="#e74c3c" /></TouchableOpacity>
          {isNew && <View style={styles.newBadge} />}
        </View>
      </TouchableOpacity>
    );
  };

  // New & Viewed lists
  const newNotifications = notifications.logs.filter(log => !viewedIds.log.includes(log.ID) && !deletedIds.log.includes(log.ID));
  const viewedNotificationsList = notifications.logs.filter(log => viewedIds.log.includes(log.ID) && !deletedIds.log.includes(log.ID));
  const newPatrolLogs = notifications.patrolLogs.filter(log => !viewedIds.patrol.includes(log.ID) && !deletedIds.patrol.includes(log.ID));
  const viewedPatrolLogsList = notifications.patrolLogs.filter(log => viewedIds.patrol.includes(log.ID) && !deletedIds.patrol.includes(log.ID));

  const totalNew = newNotifications.length + assignedCategorized.newIncidents.length + reportedCategorized.newIncidents.length + newPatrolLogs.length + newResidentLogs.length;
  const totalViewed = viewedNotificationsList.length + assignedCategorized.viewedUnresolved.length + assignedCategorized.resolved.length + reportedCategorized.viewedUnresolved.length + reportedCategorized.resolved.length + viewedPatrolLogsList.length + viewedResidentLogsList.length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4CAF50" /><Text style={styles.loadingText}>Loading notifications...</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsViewed}><Ionicons name="checkmark-done" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <IncidentReportModal isVisible={isIncidentReportModalVisible} log={selectedIncidentReport} onClose={() => setIsIncidentReportModalVisible(false)} onMarkAsRead={() => selectedIncidentReport && updateStoredIds(selectedIncidentReport.ID, 'patrol', 'viewed')} onResolve={resolvePatrolLog} />
      <ActivityLogModal isVisible={isActivityModalVisible} log={selectedActivityLog} onClose={() => setIsActivityModalVisible(false)} onMarkAsRead={() => selectedActivityLog && updateStoredIds(selectedActivityLog.ID, 'log', 'viewed')} />
      <CommunityAlertModal isVisible={isCommunityAlertModalVisible} log={selectedCommunityAlert} onClose={() => setIsCommunityAlertModalVisible(false)} onMarkAsRead={() => selectedCommunityAlert && updateStoredIds(selectedCommunityAlert.ID, 'resident', 'viewed')} />
      <ReportedIncidentModal isVisible={isReportedModalVisible} incident={selectedReportedIncident} userRole={userRole} username={username} onClose={() => setIsReportedModalVisible(false)} onResolve={() => selectedReportedIncident && resolveReportedIncident(selectedReportedIncident.id).then(() => setIsReportedModalVisible(false))} onResolveAsAdmin={() => selectedReportedIncident && resolveReportedIncidentAsAdmin(selectedReportedIncident.id).then(() => setIsReportedModalVisible(false))} />

      <ScrollView style={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={markAllAsViewed}><Ionicons name="checkmark-done-outline" size={16} color="#4CAF50" /><Text style={styles.actionButtonText}>Mark All Read</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={clearAllViewed}><Ionicons name="refresh-outline" size={16} color="#FF9800" /><Text style={styles.actionButtonText}>Reset All</Text></TouchableOpacity>
        </View>

        <View style={styles.summary}><Text style={styles.summaryText}>{totalNew} new • {totalViewed} viewed</Text></View>

        {totalNew === 0 && totalViewed === 0 ? (
          <View style={styles.emptyContainer}><Ionicons name="notifications-off-outline" size={64} color="#ccc" /><Text style={styles.emptyText}>No notifications yet</Text></View>
        ) : (
          <>
            {newResidentLogs.length > 0 && userRole === 'Resident' && <View style={styles.section}><Text style={styles.sectionTitle}>📢 Community Alerts ({newResidentLogs.length})</Text>{newResidentLogs.map(log => renderResidentLogItem(log, true))}</View>}
            {newPatrolLogs.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>🚨 New Incident Reports ({newPatrolLogs.length})</Text>{newPatrolLogs.map(log => renderPatrolLogItem(log, true))}</View>}
            {assignedCategorized.newIncidents.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>🚨 New Incident Assignments ({assignedCategorized.newIncidents.length})</Text>{assignedCategorized.newIncidents.map(i => renderAssignedIncidentItem(i, true))}</View>}
            {reportedCategorized.newIncidents.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>📋 New Updates ({reportedCategorized.newIncidents.length})</Text>{reportedCategorized.newIncidents.map(i => renderReportedIncidentItem(i, true))}</View>}
            {newNotifications.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>🔔 New Activity ({newNotifications.length})</Text>{newNotifications.map(log => renderNotificationItem(log, true))}</View>}

            {totalViewed > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Earlier ({totalViewed})</Text>
                {viewedResidentLogsList.map(log => renderResidentLogItem(log, false))}
                {viewedPatrolLogsList.map(log => renderPatrolLogItem(log, false))}
                {assignedCategorized.viewedUnresolved.map(i => renderAssignedIncidentItem(i, false))}
                {reportedCategorized.viewedUnresolved.map(i => renderReportedIncidentItem(i, false))}
                {viewedNotificationsList.map(log => renderNotificationItem(log, false))}
                {assignedCategorized.resolved.map(i => renderAssignedIncidentItem(i, false))}
                {reportedCategorized.resolved.map(i => renderReportedIncidentItem(i, false))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: "#555" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  scrollContainer: { flex: 1 },
  actionButtons: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "#fff", marginBottom: 10 },
  actionButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f0f0f0" },
  actionButtonText: { marginLeft: 5, fontSize: 14, fontWeight: "500", color: "#333" },
  summary: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#fff", marginBottom: 10 },
  summaryText: { fontSize: 14, color: "#666", textAlign: "center" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#e0e0e0" },
  notificationItem: { backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  newNotification: { backgroundColor: "#f8fff8", borderLeftWidth: 4, borderLeftColor: "#4CAF50" },
  deleteButton: { marginLeft: 10, padding: 5, justifyContent: 'center' },
  viewedNotification: { backgroundColor: "#fff" },
  notificationHeader: { flexDirection: "row", alignItems: "flex-start" },
  notificationIcon: { marginRight: 15, marginTop: 2 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 16, fontWeight: "500", color: "#333", marginBottom: 5 },
  newNotificationTitle: { fontWeight: "bold", color: "#2E7D32" },
  notificationDate: { fontSize: 14, color: "#666", marginBottom: 3 },
  notificationLocation: { fontSize: 14, color: "#888", fontStyle: "italic" },
  newBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4CAF50", marginTop: 5 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: "500", color: "#999", marginTop: 15 },
  newIncidentTitle: { fontWeight: "bold", color: "#D32F2F" },
  newIncidentBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF5722", marginTop: 5 },
  unresolvedViewedNotification: { backgroundColor: "#fff8e1", borderLeftWidth: 4, borderLeftColor: "#FF9800" },
  newReportedNotification: { backgroundColor: "#f0f8ff", borderLeftWidth: 4, borderLeftColor: "#2196F3" },
  newReportedTitle: { fontWeight: "bold", color: "#1565C0" },
  newReportedBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2196F3", marginTop: 5 },
  newIncidentReportNotification: { backgroundColor: "#ffebee", borderLeftWidth: 4, borderLeftColor: "#D32F2F" },
  newIncidentReportTitle: { fontWeight: "bold", color: "#C62828" },
  newIncidentReportBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D32F2F", marginTop: 5 },
  newCommunityAlertNotification: { backgroundColor: "#fffbe6", borderLeftWidth: 4, borderLeftColor: "#FFC107" },
  newCommunityAlertTitle: { fontWeight: "bold", color: "#FFA000" },
  newCommunityAlertBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFC107", marginTop: 5 },
});

export default Notifications;