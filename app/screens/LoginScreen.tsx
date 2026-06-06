import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { signIn } from '../../database/auth';

interface LoginScreenProps {
  onLogin: () => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLogin, onNavigateToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter your email');
      } else {
        Alert.alert('Error', 'Please enter your email');
      }
      return;
    }

    if (!password) {
      if (Platform.OS === 'web') {
        window.alert('Please enter your password');
      } else {
        Alert.alert('Error', 'Please enter your password');
      }
      return;
    }

    setLoading(true);

    try {
      console.log('[Login] Attempting to sign in...');
      const result = await signIn(email.toLowerCase().trim(), password);

      if (result.success) {
        console.log('[Login] Sign in successful');
        onLogin();
      } else {
        console.error('[Login] Sign in failed:', result.error?.message);
        if (Platform.OS === 'web') {
          window.alert(`Login Failed: ${result.error?.message || 'Invalid email or password'}`);
        } else {
          Alert.alert('Login Failed', result.error?.message || 'Invalid email or password');
        }
      }
    } catch (error: any) {
      console.error('[Login] Unexpected error:', error);
      if (Platform.OS === 'web') {
        window.alert(`Error: ${error.message || 'An unexpected error occurred'}`);
      } else {
        Alert.alert('Error', error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showLoginForm) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.formHeader}>
              <Text style={styles.logo}>📍</Text>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to Local Link</Text>
            </View>

            {/* Login Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Stanford Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your.name@stanford.edu"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToOptionsButton}
                onPress={() => setShowLoginForm(false)}
                disabled={loading}
              >
                <Text style={styles.backToOptionsText}>Back to options</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={onNavigateToRegister}
                disabled={loading}
              >
                <Text style={styles.registerText}>
                  Don't have an account?{' '}
                  <Text style={styles.registerTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>📍</Text>
          </View>
          <Text style={styles.title}>Local Link</Text>
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
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowLoginForm(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Sign In with Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButtonMain}
          onPress={onNavigateToRegister}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonMainText}>Create New Account</Text>
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
  registerButtonMain: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#8C1515',
  },
  registerButtonMainText: {
    color: '#8C1515',
    fontSize: 17,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
  },
  // Login form styles
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  loginButton: {
    backgroundColor: '#8C1515',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#8C1515',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToOptionsButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToOptionsText: {
    fontSize: 14,
    color: '#8C1515',
    fontWeight: '600',
  },
  registerButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#666666',
  },
  registerTextBold: {
    color: '#8C1515',
    fontWeight: 'bold',
  },
});
