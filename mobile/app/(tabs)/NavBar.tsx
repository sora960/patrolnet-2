import { BASE_URL } from "../../config";
// components/NavBar.tsx - Fixed incident notification system
import React, { useState, useRef, useEffect } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./app";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get("window").width;

interface NavBarProps {
  username?: string;
  userImage?: string | null;
  userRole?: string;
}

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
}

const NavBar: React.FC<NavBarProps> = ({ username, userImage, userRole }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<LogEntry[]>([]);
  const [lastLogId, setLastLogId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-screenWidth * 0.5)).current;
  const [unreadLogCount, setUnreadLogCount] = useState(0);
  const [unreadResidentLogCount, setUnreadResidentLogCount] = useState(0);
  const [unreadPatrolLogCount, setUnreadPatrolLogCount] = useState(0);
  const [lastResidentLogId, setLastResidentLogId] = useState<number | null>(null);
  const [isResidentLogInitialized, setIsResidentLogInitialized] = useState(false);

  const [lastIncidentId, setLastIncidentId] = useState<number | null>(null);
  const [incidentNotifications, setIncidentNotifications] = useState<IncidentReport[]>([]);
  const [isIncidentInitialized, setIsIncidentInitialized] = useState(false);
  const [unreadIncidentIds, setUnreadIncidentIds] = useState<Set<number>>(new Set());
  const [lastPatrolLogId, setLastPatrolLogId] = useState<number | null>(null);
  const [isPatrolLogInitialized, setIsPatrolLogInitialized] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'resolved'>('all');

  // Calculate total notification count from all sources - FIXED
  useEffect(() => {
    // Count unread unresolved incidents
    const unreadUnresolvedIncidentsCount = Array.from(unreadIncidentIds).filter(incidentId => {
      const incident = incidentNotifications.find(inc => inc.id === incidentId);
      return incident && incident.status !== 'Resolved';
    }).length;
    
    // Total count from all notification sources
    const totalCount = unreadLogCount + unreadResidentLogCount + unreadPatrolLogCount + unreadUnresolvedIncidentsCount;
    setNotificationCount(totalCount);
    
    console.log('Notification count updated:', {
      unreadLogCount,
      unreadResidentLogCount,
      unreadPatrolLogCount,
      unreadUnresolvedIncidentsCount,
      totalCount
    });
  }, [unreadLogCount, unreadResidentLogCount, unreadPatrolLogCount, unreadIncidentIds, incidentNotifications]);

  // When the screen comes into focus, reload the "last seen" state from storage.
  // This ensures that if notifications were marked as read on another screen,
  // the badge count here is updated correctly.
  useFocusEffect(
    React.useCallback(() => {
      const loadSavedState = async () => {
        if (!username) return;
        
        try {
          const savedLogId = await AsyncStorage.getItem(`lastLogId_${username}`);
          const savedResidentLogId = await AsyncStorage.getItem(`lastResidentLogId_${username}`);
          const savedIncidentId = await AsyncStorage.getItem(`lastIncidentId_${username}`);
          const savedPatrolLogId = await AsyncStorage.getItem(`lastPatrolLogId_${username}`);
          const savedUnreadIds = await AsyncStorage.getItem(`unreadIncidentIds_${username}`);
          
          // Reset counts before re-evaluating
          setUnreadLogCount(0);
          setUnreadResidentLogCount(0);
          setUnreadPatrolLogCount(0);

          if (savedLogId) setLastLogId(parseInt(savedLogId));
          if (savedResidentLogId) setLastResidentLogId(parseInt(savedResidentLogId));
          if (savedIncidentId) setLastIncidentId(parseInt(savedIncidentId));
          if (savedPatrolLogId) setLastPatrolLogId(parseInt(savedPatrolLogId));
          
          if (savedUnreadIds) {
            const unreadIds: number[] = JSON.parse(savedUnreadIds);
            setUnreadIncidentIds(new Set<number>(unreadIds));
          } else {
            // If nothing is in storage, reset the set
            setUnreadIncidentIds(new Set<number>());
          }
          
          console.log('NavBar focused, reloaded saved state.');
        } catch (error) {
          console.error('Error loading saved state on focus:', error);
        }
      };
      
      loadSavedState();
    }, [username])
  );

  // Save state to AsyncStorage
  const saveState = async (logId?: number, incidentId?: number, unreadIds?: Set<number>, residentLogId?: number, patrolLogId?: number) => {
    if (!username) return;
    
    try {
      if (logId !== undefined) {
        await AsyncStorage.setItem(`lastLogId_${username}`, logId.toString());
      }
      if (incidentId !== undefined) {
        await AsyncStorage.setItem(`lastIncidentId_${username}`, incidentId.toString());
      }
      if (unreadIds !== undefined) {
        await AsyncStorage.setItem(`unreadIncidentIds_${username}`, JSON.stringify([...unreadIds]));
      }
      if (residentLogId !== undefined) {
        await AsyncStorage.setItem(`lastResidentLogId_${username}`, residentLogId.toString());
      }
      if (patrolLogId !== undefined) {
        await AsyncStorage.setItem(`lastPatrolLogId_${username}`, patrolLogId.toString());
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  // Fetch user logs and check for new notifications - FIXED counting logic
  const fetchUserLogs = async () => {
    if (!username) return;
    
    try {
      const response = await axios.get(`${BASE_URL}/api/logs/${username}`);
      const logs: LogEntry[] = response.data || [];
      
      if (logs.length > 0) {
        // Always calculate the number of logs with an ID greater than the last one seen.
        const newLogs = logs.filter(log => log.ID > (lastLogId || 0));
        setUnreadLogCount(newLogs.length);
        setNotifications(logs.slice(0, 5)); // Update with latest logs
        console.log(`User logs check: ${newLogs.length} unread. (Last seen ID: ${lastLogId})`);

        // If this is the very first fetch and no ID is stored, we just set the initial state.
        if (!isInitialized && lastLogId === null) {
          setIsInitialized(true);
        } 
        // If it is initialized and there are genuinely new logs, show an alert.
        else if (isInitialized && newLogs.length > 0) {
          console.log(`New user log detected! Alerting for: ${newLogs[0].ACTION}`);
          // const notificationMessage = getLogDisplayText(newLogs[0]);
          // Alert.alert(
          //   "New Schedule Logged",
          //   notificationMessage,
          //   [
          //     { text: "View All", onPress: () => handleNotificationPress() },
          //     { text: "Dismiss", style: "cancel" }
          //   ]
          // );
          // Mark as seen immediately to prevent re-alerting
          saveState(newLogs[0].ID, undefined, undefined, undefined, undefined);
        }
      } else {
        setUnreadLogCount(0); // No logs, so no unread.
      }
    } catch (error) {
      console.error("Error fetching user logs:", error);
      // Don't show error alerts for network issues during background polling
    }
  };

  // Fetch resident logs and check for new community alerts - FIXED counting logic
  const fetchResidentLogs = async () => {
    if (!username || userRole !== 'Resident') return;

    try {
      const response = await axios.get(`${BASE_URL}/api/logs_resident/${username}`);
      const residentLogs: LogEntry[] = response.data || [];

      if (residentLogs.length > 0) {
        // Always calculate the number of logs with an ID greater than the last one seen.
        const newLogs = residentLogs.filter(log => log.ID > (lastResidentLogId || 0));
        setUnreadResidentLogCount(newLogs.length);
        console.log(`Resident logs check: ${newLogs.length} unread. (Last seen ID: ${lastResidentLogId})`);

        // If this is the very first fetch and no ID is stored, we just set the initial state.
        if (!isResidentLogInitialized && lastResidentLogId === null) {
          setIsResidentLogInitialized(true);
        } 
        // If it is initialized and there are genuinely new logs, show an alert.
        else if (isResidentLogInitialized && newLogs.length > 0) {
          console.log(`New resident log detected! Alerting for: ${newLogs[0].ACTION}`);
          // Alert.alert(
          //   "Community Alert",
          //   newLogs[0].ACTION,
          //   [
          //     { text: "View All", onPress: () => handleNotificationPress() },
          //     { text: "Dismiss", style: "cancel" }
          //   ]
          // );
          // Mark as seen immediately to prevent re-alerting
          saveState(undefined, undefined, undefined, newLogs[0].ID, undefined);
        }
      } else {
        setUnreadResidentLogCount(0); // No logs, so no unread.
      }
    } catch (error) {
      console.error("Error fetching resident logs:", error);
    }
  };

  // Fetch patrol logs and check for new incident reports (for Tanods) - FIXED counting logic
  const fetchPatrolLogs = async () => {
    if (!username || userRole !== 'Tanod') return;

    try {
      const response = await axios.get(`${BASE_URL}/api/logs_patrol/${username}`);
      const patrolLogs: LogEntry[] = response.data || [];

      if (patrolLogs.length > 0) {
        // Always calculate the number of logs with an ID greater than the last one seen.
        const newLogs = patrolLogs.filter(log => log.ID > (lastPatrolLogId || 0));
        setUnreadPatrolLogCount(newLogs.length);
        console.log(`Patrol logs check: ${newLogs.length} unread. (Last seen ID: ${lastPatrolLogId})`);

        // If this is the very first fetch and no ID is stored, we just set the initial state.
        if (!isPatrolLogInitialized && lastPatrolLogId === null) {
          setIsPatrolLogInitialized(true);
        } 
        // If it is initialized and there are genuinely new logs, show an alert.
        else if (isInitialized && newLogs.length > 0) {
          console.log(`New patrol log detected! Alerting for: ${newLogs[0].ACTION}`);
          // Alert.alert(
          //   "New Incident Report",
          //   newLogs[0].ACTION,
          //   [
          //     { text: "View All", onPress: () => handleNotificationPress() },
          //     { text: "Dismiss", style: "cancel" }
          //   ]
          // );
          // Mark as seen immediately to prevent re-alerting
          saveState(undefined, undefined, undefined, undefined, newLogs[0].ID);
        }
      } else {
        setUnreadPatrolLogCount(0); // No logs, so no unread.
      }
    } catch (error) {
      console.error("Error fetching patrol logs:", error);
    }
  };

  // Fetch assigned incidents and check for new assignments - FIXED counting logic
  const fetchAssignedIncidents = async () => {
    if (!username) return;
    
    try {
      const response = await axios.get(`${BASE_URL}/api/incidents/assigned/${username}`);
      const incidents = response.data;
      
      console.log('Fetched assigned incidents for user:', username, 'Count:', incidents.length);
      
      if (incidents && incidents.length > 0) {
        const latestIncident = incidents[0]; // Most recent incident (ordered by created_at DESC)
        
        console.log('Latest incident ID:', latestIncident.id, 'Last known incident ID:', lastIncidentId);
        
        // If this is the first time loading and no saved state
        if (!isIncidentInitialized && lastIncidentId === null) {
          setIncidentNotifications(incidents); // Store all incidents for accurate counting
          setIsIncidentInitialized(true);
          
          // For first-time users, only mark UNRESOLVED incidents as unread
          const unresolvedIncidents = incidents.filter((incident: IncidentReport) => incident.status !== 'Resolved');
          const newUnreadIds = new Set<number>(unresolvedIncidents.map((incident: IncidentReport) => incident.id));
          setUnreadIncidentIds(newUnreadIds);
          setLastIncidentId(latestIncident.id); // Set the last incident ID on initialization
          saveState(undefined, latestIncident.id, newUnreadIds, undefined, undefined);
          
          console.log('Initialized incident notifications. Unread UNRESOLVED IDs:', [...newUnreadIds]);
        } else if (isIncidentInitialized && latestIncident.id > (lastIncidentId || 0)) {
          // New incident assignment detected
          const newIncidents = incidents.filter((incident: IncidentReport) => incident.id > (lastIncidentId || 0));
          
          // Add new incident IDs to unread set ONLY if they are unresolved
          const updatedUnreadIds = new Set(unreadIncidentIds);
          const newUnresolvedIncidents = newIncidents.filter((incident: IncidentReport) => incident.status !== 'Resolved');
          
          newUnresolvedIncidents.forEach((incident: IncidentReport) => {
            updatedUnreadIds.add(incident.id);
          });
          
          setUnreadIncidentIds(updatedUnreadIds);
          setLastIncidentId(latestIncident.id);
          setIncidentNotifications(incidents); // Update with all incidents
          saveState(undefined, latestIncident.id, updatedUnreadIds, undefined, undefined);
          
          // Only show alert for unresolved new incidents
          if (newUnresolvedIncidents.length > 0) {
            console.log('New unresolved incident assignment detected! Count:', newUnresolvedIncidents.length);
            
            // Show alert for new incident assignment
            // const incidentMessage = getIncidentDisplayText(latestIncident);
            // Alert.alert(
            //   "You've Been Assigned",
            //   incidentMessage,
            //   [
            //     { text: "View All", onPress: () => handleNotificationPress() },
            //     { text: "Dismiss", style: "cancel" }
            //   ]
            // );
          }
        } else if (isIncidentInitialized) {
          // Update notifications list even if no new incidents
          setIncidentNotifications(incidents);
          
          // Remove resolved incidents from unread set AND incidents no longer assigned
          const activeUnresolvedIncidentIds = new Set(
            incidents
              .filter((incident: IncidentReport) => incident.status !== 'Resolved')
              .map((incident: IncidentReport) => incident.id)
          );
          const updatedUnreadIds = new Set([...unreadIncidentIds].filter(id => activeUnresolvedIncidentIds.has(id)));
          
          if (updatedUnreadIds.size !== unreadIncidentIds.size) {
            setUnreadIncidentIds(updatedUnreadIds);
            saveState(undefined, undefined, updatedUnreadIds, undefined, undefined);
            console.log('Updated unread incident IDs:', [...updatedUnreadIds]);
          }
        }
      } else {
        console.log('No assigned incidents found for user:', username);
        setIncidentNotifications([]);
        // Clear unread incidents if no incidents are assigned
        if (unreadIncidentIds.size > 0) {
          const emptySet = new Set<number>();
          setUnreadIncidentIds(emptySet);
          saveState(undefined, undefined, emptySet, undefined, undefined);
        }
      }
      
    } catch (error) {
      console.error("Error fetching assigned incidents:", error);
      // Don't show error alerts for network issues during background polling
    }
  };

  // Helper function to format incident display text
  const getIncidentDisplayText = (incident: IncidentReport) => {
    return `Incident Type: ${incident.type}
Reported By: Anonymous
Location: ${incident.location}
Status: ${incident.status}`;
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

  // Function to handle incident resolution
  const handleResolveIncident = async (incidentId: number) => {
    try {
      const response = await axios.put(`${BASE_URL}/api/incidents/${incidentId}/resolve`, {
        resolved_by: username
      });

      if (response.data.success) {
        // Remove incident from unread set when resolved
        const updatedUnreadIds = new Set(unreadIncidentIds);
        updatedUnreadIds.delete(incidentId);
        setUnreadIncidentIds(updatedUnreadIds);
        saveState(undefined, undefined, updatedUnreadIds, undefined, undefined);
        
        // Update local incident notifications to mark as resolved
        setIncidentNotifications(prev => 
          prev.map(incident => 
            incident.id === incidentId 
              ? { ...incident, status: 'Resolved', resolved_by: username } 
              : incident
          )
        );
        
        Alert.alert(
          "Success",
          "Incident has been marked as resolved.",
          [{ text: "OK" }]
        );
        
        // Refresh incident notifications
        fetchAssignedIncidents();
      } else {
        Alert.alert(
          "Error",
          "Failed to resolve incident. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error resolving incident:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Function to show incident details with resolve option
  const showIncidentDetails = (incident: IncidentReport) => {
    const incidentMessage = getIncidentDisplayText(incident);
    
    // Mark this incident as read when viewed
    if (unreadIncidentIds.has(incident.id)) {
      const updatedUnreadIds = new Set(unreadIncidentIds);
      updatedUnreadIds.delete(incident.id);
      setUnreadIncidentIds(updatedUnreadIds);
      saveState(undefined, undefined, updatedUnreadIds, undefined, undefined);
    }
    
    Alert.alert(
      "Incident Details",
      incidentMessage,
      [
        {
          text: "Mark as Resolved",
          onPress: () => {
            Alert.alert(
              "Confirm Resolution",
              "Are you sure you want to mark this incident as resolved?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm", 
                  onPress: () => handleResolveIncident(incident.id),
                  style: "destructive"
                }
              ]
            );
          }
        },
        { text: "Close", style: "cancel" }
      ]
    );
  };

  // Function to mark notifications as read when visiting notifications page
  const markNotificationsAsRead = () => {
    // Reset all unread counts
    setUnreadLogCount(0);
    setUnreadResidentLogCount(0);
    setUnreadPatrolLogCount(0);
    
    // Clear unread incident IDs
    const emptySet = new Set<number>();
    setUnreadIncidentIds(emptySet);
    saveState(undefined, undefined, emptySet, undefined, undefined);
  };
  


  // Polling effect for both logs and incidents
  useEffect(() => {
    if (username) {
      console.log('Setting up polling for user:', username);
      fetchUserLogs(); // Initial fetch for logs
      fetchAssignedIncidents(); // Initial fetch for incidents      
      if (userRole === 'Resident') { 
        fetchResidentLogs(); 
      } else if (userRole === 'Tanod') {
        fetchPatrolLogs();
      }
      
      const interval = setInterval(() => {
        fetchUserLogs();
        fetchAssignedIncidents(); // Poll for incident assignments
        if (userRole === 'Resident') {
          fetchResidentLogs();
        } else if (userRole === 'Tanod') {
          fetchPatrolLogs();
        }
      }, 10000); // Check every 10 seconds
      
      return () => {
        console.log('Cleaning up polling interval');
        clearInterval(interval);
      };
    }
  }, [username, userRole, lastLogId, isInitialized, lastIncidentId, isIncidentInitialized, lastResidentLogId, isResidentLogInitialized, lastPatrolLogId, isPatrolLogInitialized]);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarVisible ? 0 : -screenWidth * 0.5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);

  // Handle notification press to navigate to notifications page
  const handleNotificationPress = () => {
    // Mark notifications as read when navigating to notifications page

    navigation.navigate("Notifications", { 
      username: username ?? "",
      incidentNotifications: incidentNotifications,
      onIncidentPress: showIncidentDetails // Pass the function to show incident details
    });
  };

  const closeMenus = () => {
    setUserMenuVisible(false);
    setSidebarVisible(false);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedIncident(null);
  };

  return (
    <>
      {sidebarVisible && (
        <TouchableWithoutFeedback onPress={() => setSidebarVisible(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Patrol Net</Text>
          {userRole === "Resident" && (
            <TouchableOpacity onPress={() => setSidebarVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 13 }} />
        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => {
            setSidebarVisible(false);
            navigation.navigate("IncidentReport", { username: username ?? "" });
          }}
        >
          <Text style={styles.sidebarItemText}>Report Incident</Text>
        </TouchableOpacity>

        {/* Only show TIME-IN button if user is not a Resident */}
        {userRole !== "Resident" && (
          <TouchableOpacity 
            style={styles.sidebarItem}
            onPress={() => {
              setSidebarVisible(false);
              navigation.navigate("TimeIn", { username: username ?? "" });
            }}
          >
            <Text style={styles.sidebarItemText}>TIME-IN</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.logoContainer} onPress={() => setSidebarVisible(true)}>
          <Image source={require('./new-icon.png')} style={styles.logo} />
          <Text style={styles.logoText}>PatrolNet</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount.toString()}
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="person-outline" size={20} color="#333" style={{ marginRight: 8 }} />
                <Text style={styles.userMenuText}>Profile</Text>
              </View>
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="log-out-outline" size={20} color="#333" style={{ marginRight: 8 }} />
                <Text style={styles.userMenuText}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
};

interface IncidentDetailsModalProps {
  isVisible: boolean;
  incident: IncidentReport | null;
  onClose: () => void;
  onResolve: () => void;
}

const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({ isVisible, incident, onClose, onResolve }) => {
  if (!incident) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Incident Details</Text>
          <Text>Type: {incident.type}</Text>
          <Text>Reported by: "Anonymous"</Text>
          <Text>Location: {incident.location}</Text>
          <Text>Status: {incident.status}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
            {incident.status !== 'Resolved' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.resolveButton]}
                onPress={onResolve}
              >
                <Text style={styles.modalButtonText}>Mark as Resolved</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: "#555",
    paddingBottom: 10,
    zIndex: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  headerTitle: { fontWeight: "bold", fontSize: 18, color: "#fff" },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    marginLeft: 10,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  backdrop: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    width: screenWidth * 0.5,
    height: "100%",
    backgroundColor: "#333",
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sidebarTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  sidebarItem: { marginBottom: 15 },
  sidebarItemText: { color: "#fff", fontSize: 16 },
  userMenu: {
    position: "absolute",
    top: 100,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 4,
  },
  userMenuItem: { paddingVertical: 5 },
  userMenuText: { fontWeight: "bold" },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
  },
  resolveButtonText: {
    color: 'white',
  },
});

export default NavBar;