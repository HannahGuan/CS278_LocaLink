import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapScreen from './app/MapScreen';
import FriendsScreen from './app/FriendsScreen';
import ProfileScreen from './app/ProfileScreen';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('Map');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Map':
        return <MapScreen />;
      case 'Friends':
        return <FriendsScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <MapScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Map' && styles.activeTab]}
          onPress={() => setActiveTab('Map')}
        >
          <Text style={[styles.tabText, activeTab === 'Map' && styles.activeTabText]}>
            Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Friends' && styles.activeTab]}
          onPress={() => setActiveTab('Friends')}
        >
          <Text style={[styles.tabText, activeTab === 'Friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Profile' && styles.activeTab]}
          onPress={() => setActiveTab('Profile')}
        >
          <Text style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F0',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    paddingBottom: 25,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: '#FF6347',
    marginTop: -3,
  },
  tabText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  activeTabText: {
    color: '#FF6347',
    fontWeight: '700',
  },
});
