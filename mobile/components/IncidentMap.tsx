import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Props = {
  style?: StyleProp<ViewStyle>;
  region: MapRegion;
  pinLocation: LatLng;
  onPress?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
};

export default function IncidentMap({
  style,
  region,
  pinLocation,
  scrollEnabled = true,
  zoomEnabled = true,
}: Props) {
  const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html, iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    width="100%"
    height="100%"
    frameborder="0"
    style="border:0"
    referrerpolicy="no-referrer-when-downgrade"
    src="https://www.google.com/maps?q=${pinLocation.latitude},${pinLocation.longitude}&z=${zoom}&output=embed"
    allowfullscreen
  ></iframe>
</body>
</html>`;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={scrollEnabled}
        scalesPageToFit={false}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});
