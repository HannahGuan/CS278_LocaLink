import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';

// Disable react-native-screens optimization to fix boolean type error
import { enableScreens } from 'react-native-screens';
enableScreens(false);

// Auth
import { supabase } from './database/supabase';
import { getCurrentUser } from './database/auth';

// Auth Screens
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';
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
  const [showRegister, setShowRegister] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (session?.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setHasCompletedOnboarding(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        // Here you could also check if user has completed onboarding
        // by fetching their profile from the database
      }
    } catch (error) {
      // Silently handle - no need to log expected "no user" state
      // getCurrentUser already handles error logging for real errors
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setShowRegister(false);
    // After registration, user needs to verify email, so send them back to login
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  // Show loading screen while checking auth status
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8C1515" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show register screen
  if (showRegister) {
    return (
      <>
        <RegisterScreen
          onRegister={handleRegister}
          onBackToLogin={() => setShowRegister(false)}
        />
      </>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          onNavigateToRegister={() => setShowRegister(true)}
        />
      </>
    );
  }

  // Show onboarding if authenticated but hasn't completed onboarding
  if (!hasCompletedOnboarding) {
    return (
      <>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </>
    );
  }

  // Show main app
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});
