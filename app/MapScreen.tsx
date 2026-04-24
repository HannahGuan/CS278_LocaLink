import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useUserStore } from '../store/userStore';
import { useFriendsStore } from '../store/friendsStore';
import { mockCurrentUserLocation, mockFriends } from '../data/mockData';

export default function MapScreen() {
  const { userLocation, setUserLocation } = useUserStore();
  const { friends, setFriends } = useFriendsStore();
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    // Initialize with mock data
    setUserLocation(mockCurrentUserLocation);
    setFriends(mockFriends);
  }, []);

  // Update markers when location or friends change
  useEffect(() => {
    if (webViewRef.current && userLocation) {
      const friendsData = friends.map(f => ({
        id: f.id,
        name: f.friend.name,
        lat: f.location?.latitude,
        lng: f.location?.longitude,
        color: f.friend.avatar_url,
      }));

      const updateScript = `
        if (typeof updateMarkers === 'function') {
          updateMarkers(
            ${userLocation.latitude},
            ${userLocation.longitude},
            ${JSON.stringify(friendsData)}
          );
        }
        true;
      `;

      webViewRef.current.injectJavaScript(updateScript);
    }
  }, [userLocation, friends]);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
    .floating-header {
      position: absolute;
      top: 60px;
      left: 20px;
      right: 20px;
      z-index: 1000;
      background: #FF6347;
      padding: 16px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .friend-count {
      background: white;
      width: 32px;
      height: 32px;
      border-radius: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
      color: #FF6347;
    }
    .bottom-card {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      z-index: 1000;
      background: white;
      padding: 16px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
    }
    .location-icon {
      font-size: 24px;
      margin-right: 12px;
    }
    .location-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .location-subtitle {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
    .custom-user-marker {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      background: #FF6347;
      border: 4px solid white;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .user-marker-inner {
      width: 12px;
      height: 12px;
      border-radius: 6px;
      background: white;
    }
    .custom-friend-marker {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      border: 3px solid white;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <div class="floating-header">
    <div class="title">LocaLink</div>
    <div class="friend-count" id="friendCount">0</div>
  </div>

  <div id="map"></div>

  <div class="bottom-card">
    <div class="location-icon">📍</div>
    <div>
      <div class="location-title">Your Location</div>
      <div class="location-subtitle" id="locationText">Loading...</div>
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    let map;
    let userMarker;
    let friendMarkers = [];

    // Initialize map
    map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([37.7749, -122.4194], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom icon for user
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: '<div class="user-marker-inner"></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Function to update markers
    function updateMarkers(userLat, userLng, friendsData) {
      // Update user marker
      if (userMarker) {
        userMarker.setLatLng([userLat, userLng]);
      } else {
        userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
      }

      // Center map on user
      map.setView([userLat, userLng], 13);

      // Update location text
      document.getElementById('locationText').textContent =
        'San Francisco, CA • ' + userLat.toFixed(4) + ', ' + userLng.toFixed(4);

      // Clear old friend markers
      friendMarkers.forEach(marker => map.removeLayer(marker));
      friendMarkers = [];

      // Add friend markers
      friendsData.forEach((friend, index) => {
        if (friend.lat && friend.lng) {
          const friendIcon = L.divIcon({
            className: 'custom-friend-marker',
            html: friend.name.charAt(0).toUpperCase(),
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -22]
          });

          const marker = L.marker([friend.lat, friend.lng], { icon: friendIcon })
            .addTo(map)
            .bindPopup('<b>' + friend.name + '</b><br>' + ((index + 1) * 0.5) + ' mi away');

          // Apply background color
          marker.on('add', function() {
            const iconDiv = marker.getElement();
            if (iconDiv) {
              iconDiv.style.background = friend.color || '#FF7F50';
            }
          });

          friendMarkers.push(marker);
        }
      });

      // Update friend count
      document.getElementById('friendCount').textContent = friendsData.length;
    }

    // Initialize with default values
    updateMarkers(37.7749, -122.4194, []);
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});