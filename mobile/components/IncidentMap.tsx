import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import MapView, { Marker, type MapPressEvent, type Region } from 'react-native-maps';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type MapRegion = Region;

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
  return (
    <MapView
      style={style}
      region={region}
      onPress={onPress}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
    >
      <Marker coordinate={pinLocation} />
    </MapView>
  );
}
