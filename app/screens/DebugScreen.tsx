import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { supabase } from '../../database/supabase';

export default function DebugScreen({ onClose }: { onClose?: () => void }) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>🔍 Debug Information</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Variables</Text>

          <View style={styles.row}>
            <Text style={styles.label}>URL:</Text>
            <Text style={styles.value}>{url || '❌ Not loaded'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>API Key Status:</Text>
            <Text style={styles.value}>
              {key ? `✓ Loaded (${key.length} chars)` : '❌ Not loaded'}
            </Text>
          </View>

          {key && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Key Start:</Text>
                <Text style={styles.valueSmall}>{key.substring(0, 30)}...</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Key End:</Text>
                <Text style={styles.valueSmall}>...{key.substring(key.length - 30)}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Values</Text>
          <Text style={styles.info}>
            URL: https://nxbuioobdluvdhgjqtee.supabase.co{'\n'}
            Key length: 200-250 characters{'\n'}
            Key should start with: eyJhbGciOiJIUzI1NiIs...
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting</Text>
          {!url || !key ? (
            <Text style={styles.error}>
              ❌ Environment variables not loaded!{'\n\n'}
              To fix:{'\n'}
              1. Check .env file exists in project root{'\n'}
              2. Restart Expo: press 'r' or Ctrl+C and npm start{'\n'}
              3. Clear cache: npx expo start -c
            </Text>
          ) : key && key.length < 100 ? (
            <Text style={styles.warning}>
              ⚠️ API key seems incomplete!{'\n\n'}
              To fix:{'\n'}
              1. Go to Supabase Dashboard → Settings → API{'\n'}
              2. Copy the complete "anon public" key{'\n'}
              3. Update .env file{'\n'}
              4. Restart Expo
            </Text>
          ) : (
            <Text style={styles.success}>
              ✓ Configuration looks correct!{'\n\n'}
              If you still get errors:{'\n'}
              1. Check Supabase project is active{'\n'}
              2. Run SQL setup in Supabase Dashboard{'\n'}
              3. Enable Email auth provider{'\n'}
              4. Check project logs in Supabase
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supabase Client Info</Text>
          <Text style={styles.info}>
            Client initialized: {supabase ? '✓' : '❌'}{'\n'}
            Auth available: {supabase?.auth ? '✓' : '❌'}
          </Text>
        </View>

        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close Debug</Text>
          </TouchableOpacity>
        )}
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
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#8C1515',
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'monospace',
  },
  valueSmall: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'monospace',
  },
  info: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 22,
  },
  warning: {
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 22,
  },
  success: {
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#8C1515',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
