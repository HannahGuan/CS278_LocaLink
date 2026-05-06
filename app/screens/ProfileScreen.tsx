import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../database/supabase';
import { getCurrentUser, signOut } from '../../database/auth';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  year?: string;
  major?: string;
  interests?: string[];
  privacy_settings?: {
    showToFriends?: boolean;
    showToMatches?: boolean;
    eventBased?: boolean;
    invisible?: boolean;
  };
}

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleToFriends, setVisibleToFriends] = useState(true);
  const [discoveryMode, setDiscoveryMode] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      // Fetch user profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile');
        return;
      }

      setProfile(data);

      // Set privacy settings from database
      if (data.privacy_settings) {
        setVisibleToFriends(data.privacy_settings.showToFriends ?? true);
        setDiscoveryMode(data.privacy_settings.showToMatches ?? true);
        setGhostMode(data.privacy_settings.invisible ?? false);
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async (
    key: string,
    value: boolean
  ) => {
    if (!profile) return;

    const newSettings = {
      ...profile.privacy_settings,
      [key]: value,
    };

    const { error } = await supabase
      .from('profiles')
      .update({ privacy_settings: newSettings })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              // Navigation will be handled by App.tsx auth state listener
            } else {
              Alert.alert('Error', result.error?.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8C1515" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false as boolean}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.userInfo}>
            {profile.year && profile.major
              ? `${profile.year} • ${profile.major}`
              : profile.year || profile.major || profile.email}
          </Text>
          {profile.bio && <Text style={styles.userBio}>{profile.bio}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INTERESTS</Text>
          <View style={styles.card}>
            {profile.interests && profile.interests.length > 0 ? (
              <>
                <View style={styles.interestsContainer}>
                  {profile.interests.map((interest) => (
                    <View key={interest} style={styles.interestTag}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity>
                  <Text style={styles.editInterestsButton}>Edit Interests</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <Text style={styles.noInterestsText}>
                  No interests added yet
                </Text>
                <TouchableOpacity>
                  <Text style={styles.editInterestsButton}>Add Interests</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VISIBILITY</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Visible to friends</Text>
                <Text style={styles.settingDescription}>
                  Friends can see your location
                </Text>
              </View>
              <Switch
                value={Boolean(visibleToFriends)}
                onValueChange={(value) => {
                  setVisibleToFriends(value);
                  updatePrivacySettings('showToFriends', value);
                }}
                trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
              />
            </View>
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Discovery mode</Text>
                <Text style={styles.settingDescription}>Appear to nearby matches</Text>
              </View>
              <Switch
                value={Boolean(discoveryMode)}
                onValueChange={(value) => {
                  setDiscoveryMode(value);
                  updatePrivacySettings('showToMatches', value);
                }}
                trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
              />
            </View>
            <View style={[styles.settingRow, styles.settingRowBorder]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Ghost mode</Text>
                <Text style={styles.settingDescription}>Browse invisibly</Text>
              </View>
              <Switch
                value={Boolean(ghostMode)}
                onValueChange={(value) => {
                  setGhostMode(value);
                  updatePrivacySettings('invisible', value);
                }}
                trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>Notification Settings</Text>
                <Text style={styles.menuDescription}>Manage your alerts</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>Privacy & Safety</Text>
                <Text style={styles.menuDescription}>Block users, report issues</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuRowCenter} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8C1515',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  settingsIcon: {
    fontSize: 24,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarPlaceholder: {
    backgroundColor: '#8C1515',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#8C1515',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 15,
    color: '#666666',
  },
  userBio: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  statsContainer: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  interestTag: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 15,
    color: '#000000',
  },
  editInterestsButton: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8C1515',
  },
  noInterestsText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666666',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 17,
    color: '#000000',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    color: '#666666',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7CC',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  menuRowCenter: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 17,
    color: '#8C1515',
  },
});
