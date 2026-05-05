import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>📍</Text>
          </View>
          <Text style={styles.title}>Cardinal Connect</Text>
          <Text style={styles.subtitle}>Meet, connect, explore campus together</Text>
        </View>

        <View style={styles.featuresSection}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>👥</Text>
            </View>
            <Text style={styles.featureText}>Find friends nearby</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📅</Text>
            </View>
            <Text style={styles.featureText}>Discover campus events</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📍</Text>
            </View>
            <Text style={styles.featureText}>Make spontaneous connections</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.button} onPress={onLogin} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Sign in with Stanford SSO</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Secure login for Stanford students only</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBox: {
    width: 112,
    height: 112,
    backgroundColor: '#8C1515',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 56,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
    textAlign: 'center',
  },
  featuresSection: {
    gap: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F4E8E9',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconText: {
    fontSize: 22,
  },
  featureText: {
    fontSize: 17,
    color: '#000000',
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  button: {
    backgroundColor: '#8C1515',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
  },
});
