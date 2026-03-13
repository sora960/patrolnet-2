import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export type LatLng = {
  latitude: number;
  longitude: number;
};

// We redefine Region since we removed react-native-maps
export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// We redefine MapPressEvent to fake the event for WebView
export type MapPressEvent = {
  nativeEvent: {
    coordinate: LatLng;
  };
};

type Props = {
  style?: StyleProp<ViewStyle>;
  region: MapRegion;
  pinLocation: LatLng;
  onPress?: (event: MapPressEvent) => void;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
};

export default function IncidentMap({
  style,
  region,
  pinLocation,
  onPress,
  scrollEnabled = true,
  zoomEnabled = true,
}: Props) {
  // We use Leaflet OpenStreetMap as a free, lightweight alternative to Google Maps that runs inside a WebView
  // without needing native API Keys or native module linking.
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <style>
          body { padding: 0; margin: 0; }
          html, body, #map { height: 100%; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const lat = ${pinLocation.latitude};
          const lng = ${pinLocation.longitude};
          
          const map = L.map('map', {
            zoomControl: false,
            dragging: ${scrollEnabled},
            scrollWheelZoom: ${zoomEnabled},
            doubleClickZoom: ${zoomEnabled},
            touchZoom: ${zoomEnabled}
          }).setView([lat, lng], 15);

          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap'
          }).addTo(map);

          let marker = L.marker([lat, lng]).addTo(map);

          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }));
            
            // Move marker to new position if clicked
            marker.setLatLng(e.latlng);
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: mapHtml }}
        style={styles.webview}
        scrollEnabled={false} // The map inside the webview handles its own scrolling
        onMessage={(event) => {
          if (onPress) {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              onPress({
                nativeEvent: {
                  coordinate: {
                    latitude: data.latitude,
                    longitude: data.longitude,
                  }
                }
              });
            } catch (error) {
              console.error("Error parsing map click data:", error);
            }
          }
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  }
});
