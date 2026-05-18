import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

export interface PickedLocation {
  name: string;
  lat: number;
  lng: number;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onPick: (location: PickedLocation) => void;
  initial: PickedLocation | null;
}

const STANFORD_CENTER = { lat: 37.4275, lng: -122.1697 };

// Static HTML for the Leaflet map. A single-use marker is dropped on tap; each
// new tap moves it. The marker's lat/lng is posted back to React via
// window.ReactNativeWebView.postMessage as a JSON string.
function buildMapHtml(initial: PickedLocation | null): string {
  const center = initial ?? STANFORD_CENTER;
  const initialMarker =
    initial !== null
      ? `marker = L.marker([${initial.lat}, ${initial.lng}], { draggable: true }).addTo(map);
         marker.on('dragend', function(e) { sendCoords(e.target.getLatLng()); });`
      : '';
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: true, attributionControl: false })
            .setView([${center.lat}, ${center.lng}], 16);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

          var marker = null;
          function sendCoords(latlng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              lat: latlng.lat,
              lng: latlng.lng
            }));
          }

          ${initialMarker}

          map.on('click', function(e) {
            if (marker) {
              marker.setLatLng(e.latlng);
            } else {
              marker = L.marker(e.latlng, { draggable: true }).addTo(map);
              marker.on('dragend', function(ev) { sendCoords(ev.target.getLatLng()); });
            }
            sendCoords(e.latlng);
          });
        </script>
      </body>
    </html>
  `;
}

// Nominatim's `name` field is whatever OSM tagged the matched feature with —
// for a building it might be the building's name, but for an address-only
// hit it can be a bare house number like "450". Skip anything that's purely
// digits so the user doesn't see a random number appear in their input.
function isNumericLabel(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

interface NominatimResponse {
  name?: string;
  display_name?: string;
  address?: {
    amenity?: string;
    building?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    public_building?: string;
    university?: string;
    school?: string;
    college?: string;
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
  };
}

function pickReadableName(data: NominatimResponse): string | null {
  const fromAddress: Array<string | undefined> = [
    data.address?.amenity,
    data.address?.building,
    data.address?.shop,
    data.address?.tourism,
    data.address?.leisure,
    data.address?.public_building,
    data.address?.university,
    data.address?.college,
    data.address?.school,
    data.address?.road,
    data.address?.pedestrian,
    data.address?.neighbourhood,
    data.address?.suburb,
  ];
  for (const candidate of fromAddress) {
    if (typeof candidate === 'string' && candidate.trim().length > 0 && !isNumericLabel(candidate)) {
      return candidate.trim();
    }
  }
  if (typeof data.name === 'string' && data.name.trim().length > 0 && !isNumericLabel(data.name)) {
    return data.name.trim();
  }
  if (typeof data.display_name === 'string' && data.display_name.length > 0) {
    const parts = data.display_name.split(',').map((p) => p.trim());
    for (const part of parts) {
      if (part.length > 0 && !isNumericLabel(part)) {
        return part;
      }
    }
  }
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as NominatimResponse;
    return pickReadableName(data);
  } catch (error) {
    console.warn('Reverse geocode failed:', error);
    return null;
  }
}

export default function LocationPickerModal({
  visible,
  onClose,
  onPick,
  initial,
}: LocationPickerModalProps) {
  const [pickedLat, setPickedLat] = useState<number | null>(initial?.lat ?? null);
  const [pickedLng, setPickedLng] = useState<number | null>(initial?.lng ?? null);
  const [name, setName] = useState<string>(initial?.name ?? '');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  // Re-seed state every time the modal opens.
  useEffect(() => {
    if (visible) {
      setPickedLat(initial?.lat ?? null);
      setPickedLng(initial?.lng ?? null);
      setName(initial?.name ?? '');
      setIsGeocoding(false);
    }
  }, [visible, initial]);

  const mapHtml = useMemo(() => buildMapHtml(initial), [initial, visible]);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { lat: number; lng: number };
      setPickedLat(data.lat);
      setPickedLng(data.lng);

      // Auto-suggest a name from the reverse-geocoder, but never clobber a
      // name the user has already edited away from a previous suggestion.
      const userHasEditedName =
        name.trim().length > 0 &&
        name !== (initial?.name ?? '');
      if (userHasEditedName) return;

      setIsGeocoding(true);
      const suggested = await reverseGeocode(data.lat, data.lng);
      setIsGeocoding(false);
      if (suggested !== null) {
        setName(suggested);
      }
    } catch (error) {
      console.warn('Could not parse map message:', error);
    }
  };

  const canConfirm = pickedLat !== null && pickedLng !== null;

  const handleConfirm = () => {
    if (pickedLat === null || pickedLng === null) return;
    const finalName =
      name.trim().length > 0
        ? name.trim()
        : `${pickedLat.toFixed(4)}, ${pickedLng.toFixed(4)}`;
    onPick({ name: finalName, lat: pickedLat, lng: pickedLng });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pick a Location</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!canConfirm}
            style={[styles.doneButton, !canConfirm && styles.doneButtonDisabled]}
          >
            <Text style={styles.doneButtonText}>Use</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hintBanner}>
          <Text style={styles.hintText}>
            {canConfirm
              ? 'Drag the pin to fine-tune, or tap elsewhere to move it.'
              : 'Tap the map to drop a pin where your event will happen.'}
          </Text>
        </View>

        <View style={styles.mapWrap}>
          <WebView
            key={visible ? 'open' : 'closed'}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.map}
            javaScriptEnabled={true}
            onMessage={handleMessage}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.label}>Name this spot</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Tresidder Patio"
              placeholderTextColor="#999999"
              value={name}
              onChangeText={setName}
              maxLength={80}
            />
            {isGeocoding && (
              <ActivityIndicator color="#8C1515" style={styles.geocodeSpinner} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  cancelText: {
    fontSize: 17,
    color: '#8C1515',
    width: 64,
  },
  doneButton: {
    backgroundColor: '#8C1515',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.4,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hintBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F4E8E9',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  hintText: {
    fontSize: 13,
    color: '#8C1515',
    fontWeight: '500',
    textAlign: 'center',
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 16,
    color: '#000000',
  },
  geocodeSpinner: {
    paddingHorizontal: 4,
  },
});
