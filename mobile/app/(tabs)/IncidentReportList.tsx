import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { BASE_URL } from '../../config'; // Assuming BASE_URL is defined here
import type { RootStackParamList } from "./app";

type ApiIncident = {
  id: string | number;
  incident_type?: string | null;
  location?: string | null;
  status?: string | null;
  datetime?: string | null;
  image?: string | null;
  reported_by?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

// UI model used by this table
interface Incident {
  ID: string;
  Incident: string;
  Type: string;
  ReportedBy: string;
  Location: string;
  Status: string;
}

type IncidentReportListRouteProp = RouteProp<RootStackParamList, "IncidentReportList">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "IncidentReportList">;

const IncidentReportList: React.FC = () => {
  const route = useRoute<IncidentReportListRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { username } = route.params;

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchIncidents();

    // Poll periodically so the list updates "dynamically" when new incidents are added.
    pollTimerRef.current = setInterval(() => {
      fetchIncidents(true);
    }, 10000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    };
  }, []);

  const mapApiIncidentToRow = (apiIncident: ApiIncident): Incident => {
    const id = apiIncident.id ?? '';
    return {
      ID: String(id),
      Incident: apiIncident.incident_type ?? 'Incident',
      Type: apiIncident.incident_type ?? '',
      ReportedBy: apiIncident.reported_by ?? '',
      Location: apiIncident.location ?? '',
      Status: apiIncident.status ?? '',
    };
  };

  const fetchIncidents = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const response = await axios.get<ApiIncident[]>(`${BASE_URL}/api/incidents`);
      const apiIncidents = Array.isArray(response.data) ? response.data : [];
      setIncidents(apiIncidents.map(mapApiIncidentToRow));
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Failed to load incidents. Please try again later.");
      if (!silent) {
        Alert.alert("Error", "Failed to load incidents. Please try again later.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchIncidents(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchIncidents]);

  const handleViewDetails = (incidentId: string) => {
    // Navigate to a detailed incident view, passing the incident ID
    // Assuming an 'IncidentDetail' screen exists in RootStackParamList
    // If not, you'll need to create it and add it to RootStackParamList in app.tsx
    navigation.navigate("IncidentReport", { username, incidentId: parseInt(incidentId), isViewMode: true });
  };

  const renderIncidentItem = ({ item }: { item: Incident }) => {
    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.idCell]}>{item.ID}</Text>
        <Text style={[styles.cell, styles.incidentCell]}>{item.Incident}</Text>
        <Text style={[styles.cell, styles.typeCell]}>{item.Type}</Text>
        <Text style={[styles.cell, styles.reportedByCell]}>{item.ReportedBy}</Text>
        <Text style={[styles.cell, styles.locationCell]}>{item.Location}</Text>
        <Text style={[styles.cell, styles.statusCell]}>{item.Status}</Text>
        <TouchableOpacity onPress={() => handleViewDetails(item.ID)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading incidents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchIncidents} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incident Reports for {username}</Text>
      
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.idCell]}>ID</Text>
        <Text style={[styles.headerCell, styles.incidentCell]}>Incident</Text>
        <Text style={[styles.headerCell, styles.typeCell]}>Type</Text>
        <Text style={[styles.headerCell, styles.reportedByCell]}>Reported By</Text>
        <Text style={[styles.headerCell, styles.locationCell]}>Location</Text>
        <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
        <Text style={[styles.headerCell, styles.actionsCell]}>Actions</Text>
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(item, index) => (item.ID ? item.ID.toString() : index.toString())}
        renderItem={renderIncidentItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.emptyListText}>No incident reports found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
    paddingHorizontal: 5,
    textAlign: 'center',
  },
  cell: {
    paddingHorizontal: 5,
    textAlign: 'center',
    fontSize: 12,
  },
  idCell: {
    width: '10%',
  },
  incidentCell: {
    width: '25%',
  },
  typeCell: {
    width: '15%',
  },
  reportedByCell: {
    width: '20%',
  },
  locationCell: {
    width: '15%',
  },
  statusCell: {
    width: '15%',
  },
  actionsCell: {
    width: '10%',
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginLeft: 'auto', // Push to the right
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
});

export default IncidentReportList;