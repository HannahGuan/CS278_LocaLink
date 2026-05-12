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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
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
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [editedInterests, setEditedInterests] = useState<string[]>([]);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedYear, setEditedYear] = useState('');
  const [editedMajor, setEditedMajor] = useState('');

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

  const handleEditBio = () => {
    setEditedBio(profile?.bio || '');
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ bio: editedBio.trim() })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', 'Failed to update bio');
    } else {
      setProfile({ ...profile, bio: editedBio.trim() });
      setIsEditingBio(false);
      Alert.alert('Success', 'Bio updated successfully');
    }
  };

  const handleEditInterests = () => {
    setEditedInterests(profile?.interests || []);
    setIsEditingInterests(true);
  };

  const handleEditInfo = () => {
    setEditedYear(profile?.year || '');
    setEditedMajor(profile?.major || '');
    setIsEditingInfo(true);
  };

  const handleSaveInfo = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        year: editedYear.trim(),
        major: editedMajor.trim(),
      })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating info:', error);
      Alert.alert('Error', 'Failed to update information');
    } else {
      setProfile({
        ...profile,
        year: editedYear.trim(),
        major: editedMajor.trim(),
      });
      setIsEditingInfo(false);
      Alert.alert('Success', 'Information updated successfully');
    }
  };

  const handleSaveInterests = async () => {
    if (!profile) return;

    if (editedInterests.length < 3) {
      Alert.alert('Error', 'Please select at least 3 interests');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ interests: editedInterests })
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating interests:', error);
      Alert.alert('Error', 'Failed to update interests');
    } else {
      setProfile({ ...profile, interests: editedInterests });
      setIsEditingInterests(false);
      Alert.alert('Success', 'Interests updated successfully');
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
          </View>
          <Text style={styles.userName}>{profile.name}</Text>
          <View style={styles.infoSection}>
            <Text style={styles.userInfo}>
              {profile.year && profile.major
                ? `${profile.year} • ${profile.major}`
                : profile.year || profile.major || 'No year or major added'}
            </Text>
            <TouchableOpacity onPress={handleEditInfo}>
              <Text style={styles.editInfoButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bioSection}>
            {profile.bio ? (
              <Text style={styles.userBio}>{profile.bio}</Text>
            ) : (
              <Text style={styles.noBioText}>No bio added yet</Text>
            )}
            <TouchableOpacity onPress={handleEditBio} style={styles.editBioButton}>
              <Text style={styles.editBioText}>Edit Bio</Text>
            </TouchableOpacity>
          </View>
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
                <TouchableOpacity onPress={handleEditInterests}>
                  <Text style={styles.editInterestsButton}>Edit Interests</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View>
                <Text style={styles.noInterestsText}>
                  No interests added yet
                </Text>
                <TouchableOpacity onPress={handleEditInterests}>
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
            <TouchableOpacity style={styles.menuRowCenter} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bio Edit Modal */}
      <Modal
        visible={isEditingBio}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingBio(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setIsEditingBio(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsEditingBio(false)}>
                  <Text style={styles.modalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Bio</Text>
                <TouchableOpacity onPress={handleSaveBio}>
                  <Text style={styles.modalSaveButton}>Save</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.bioInput}
                placeholder="Tell others about yourself..."
                value={editedBio}
                onChangeText={setEditedBio}
                multiline
                maxLength={200}
                textAlignVertical="top"
                autoFocus
              />
              <Text style={styles.characterCount}>
                {editedBio.length}/200 characters
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Interests Edit Modal */}
      <Modal
        visible={isEditingInterests}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingInterests(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditingInterests(false)}>
                <Text style={styles.modalCancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Interests</Text>
              <TouchableOpacity onPress={handleSaveInterests}>
                <Text style={styles.modalSaveButton}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Select at least 3 interests ({editedInterests.length} selected)
            </Text>
            <ScrollView style={styles.interestsScrollView}>
              <View style={styles.interestsGrid}>
                {require('../data/mockData').interestOptions.map((interest: string) => {
                  const isSelected = editedInterests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      style={[
                        styles.interestButton,
                        isSelected && styles.interestButtonSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setEditedInterests(editedInterests.filter((i) => i !== interest));
                        } else {
                          setEditedInterests([...editedInterests, interest]);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.interestButtonText,
                          isSelected && styles.interestButtonTextSelected,
                        ]}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Year & Major Edit Modal */}
      <Modal
        visible={isEditingInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingInfo(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setIsEditingInfo(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setIsEditingInfo(false)}>
                  <Text style={styles.modalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Information</Text>
                <TouchableOpacity onPress={handleSaveInfo}>
                  <Text style={styles.modalSaveButton}>Save</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Year</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Freshman, Sophomore, Junior, Senior"
                  value={editedYear}
                  onChangeText={setEditedYear}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Major</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Computer Science, Biology, Economics"
                  value={editedMajor}
                  onChangeText={setEditedMajor}
                  autoCapitalize="words"
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
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
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
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
  bioSection: {
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  noBioText: {
    fontSize: 15,
    color: '#999999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  editBioButton: {
    marginTop: 8,
  },
  editBioText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8C1515',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#666666',
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8C1515',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 16,
  },
  bioInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'right',
  },
  interestsScrollView: {
    maxHeight: 400,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestButtonSelected: {
    backgroundColor: '#8C1515',
    borderColor: '#8C1515',
  },
  interestButtonText: {
    fontSize: 15,
    color: '#000000',
  },
  interestButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  editInfoButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C1515',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
  },
});
