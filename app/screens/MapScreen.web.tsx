import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

/**
 * Web-compatible MapScreen stub
 *
 * This is a temporary placeholder for Phase 1.
 * The full map functionality with web map libraries (Mapbox GL JS or Google Maps)
 * will be implemented in Phase 2.
 *
 * For now, users on web can use the Discover tab to browse events.
 */
export default function MapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>🗺️</Text>
          <Text style={styles.title}>Map View</Text>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            The interactive map is currently available on mobile devices only.
          </Text>
          <Text style={styles.submessage}>
            We're working on bringing the full map experience to the web version soon!
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>In the meantime:</Text>
          <View style={styles.infoItem}>
            <Text style={styles.bullet}>🧭</Text>
            <Text style={styles.infoText}>
              Use the <Text style={styles.bold}>Discover</Text> tab to browse events
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.bullet}>👥</Text>
            <Text style={styles.infoText}>
              Check the <Text style={styles.bold}>Friends</Text> tab to see your friends
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.bullet}>⚙️</Text>
            <Text style={styles.infoText}>
              Update your profile and privacy settings
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For the full experience, download our mobile app or open on a mobile device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8C1515',
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: '#F5F5F5',
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
    maxWidth: 500,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  submessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#8C1515',
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
