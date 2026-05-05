import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

// Disable react-native-screens optimization to fix boolean type error
import { enableScreens } from 'react-native-screens';
enableScreens(false);

// Auth Screens
import LoginScreen from './app/screens/LoginScreen';
import OnboardingScreen from './app/screens/OnboardingScreen';

// Main Screens
import MapScreen from './app/screens/MapScreen';
import DiscoverScreen from './app/screens/DiscoverScreen';
import ChatScreen from './app/screens/ChatScreen';
import EventsScreen from './app/screens/EventsScreen';
import ProfileScreen from './app/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8C1515',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingBottom: 25,
          paddingTop: 8,
          height: 83,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🗺️</Text>,
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🧭</Text>,
          tabBarLabel: 'Discover',
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📅</Text>,
          tabBarLabel: 'Events',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={ChatScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>💬</Text>,
          tabBarLabel: 'Messages',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
