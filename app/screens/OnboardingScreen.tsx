import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { interestOptions } from '../data/mockData';
import { supabase } from '../../database/supabase';
import { getCurrentUser } from '../../database/auth';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [introvertExtrovert, setIntrovertExtrovert] = useState(50);
  const [spontaneousPlanned, setSpontaneousPlanned] = useState(50);
  const [groupOneOnOne, setGroupOneOnOne] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    showToFriends: true,
    showToMatches: true,
    eventBased: true,
    invisible: false,
  });
  const [notifications, setNotifications] = useState({
    friendsNearby: true,
    eventAlerts: true,
    matchOpportunities: true,
  });
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const filteredInterests = interestOptions.filter((interest) =>
    interest.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Save onboarding data to database
      await saveOnboardingData();
    }
  };

  const saveOnboardingData = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'No user found. Please log in again.');
        return;
      }

      // Prepare data
      const socialStyle = {
        introvertExtrovert,
        spontaneousPlanned,
        groupOneOnOne,
      };

      // Update user profile with onboarding data
      const { error } = await supabase
        .from('profiles')
        .update({
          interests: selectedInterests,
          social_style: socialStyle,
          privacy_settings: privacySettings,
          notification_settings: notifications,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving onboarding data:', error);
        Alert.alert('Error', 'Failed to save your preferences. Please try again.');
        return;
      }

      onComplete();
    } catch (error: any) {
      console.error('Error in saveOnboardingData:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} disabled={step === 1 ? true : false}>
          {step > 1 && <Text style={styles.backButton}>←</Text>}
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                i <= step ? styles.progressBarActive : styles.progressBarInactive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles.skipButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false as boolean}>
        {step === 1 && (
          <View>
            <Text style={styles.title}>What are your interests?</Text>
            <Text style={styles.subtitle}>
              Select topics you're interested in (choose at least 3)
            </Text>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search interests..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.interestsContainer}>
              {filteredInterests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  onPress={() => toggleInterest(interest)}
                  style={[
                    styles.interestButton,
                    selectedInterests.includes(interest) && styles.interestButtonActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.interestButtonText,
                      selectedInterests.includes(interest) &&
                        styles.interestButtonTextActive,
                    ]}
                  >
                    {selectedInterests.includes(interest) && '✓ '}
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Your social style</Text>
            <Text style={styles.subtitle}>Help us understand how you like to connect</Text>

            <View style={styles.slidersContainer}>
              <View style={styles.sliderGroup}>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>Introvert</Text>
                  <Text style={styles.sliderLabel}>Extrovert</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={introvertExtrovert}
                  onValueChange={setIntrovertExtrovert}
                  minimumTrackTintColor="#8C1515"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#8C1515"
                />
              </View>

              <View style={styles.sliderGroup}>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>Planned</Text>
                  <Text style={styles.sliderLabel}>Spontaneous</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={spontaneousPlanned}
                  onValueChange={setSpontaneousPlanned}
                  minimumTrackTintColor="#8C1515"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#8C1515"
                />
              </View>

              <View style={styles.sliderGroup}>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1:1 Hangouts</Text>
                  <Text style={styles.sliderLabel}>Group Events</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={groupOneOnOne}
                  onValueChange={setGroupOneOnOne}
                  minimumTrackTintColor="#8C1515"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#8C1515"
                />
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Privacy settings</Text>
            <Text style={styles.subtitle}>
              Control who can see you and how you appear
            </Text>

            <View style={styles.settingsContainer}>
              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingTitle}>Show me to friends</Text>
                  <Switch
                    value={Boolean(privacySettings.showToFriends)}
                    onValueChange={(value) =>
                      setPrivacySettings({ ...privacySettings, showToFriends: value })
                    }
                    trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  Friends can see your location and activity
                </Text>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingTitle}>Show me to nearby matches</Text>
                  <Switch
                    value={Boolean(privacySettings.showToMatches)}
                    onValueChange={(value) =>
                      setPrivacySettings({ ...privacySettings, showToMatches: value })
                    }
                    trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  People with similar interests can discover you
                </Text>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingTitle}>Event-based visibility</Text>
                  <Switch
                    value={Boolean(privacySettings.eventBased)}
                    onValueChange={(value) =>
                      setPrivacySettings({ ...privacySettings, eventBased: value })
                    }
                    trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  Only visible when attending events
                </Text>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingTitle}>Invisible mode</Text>
                  <Switch
                    value={Boolean(privacySettings.invisible)}
                    onValueChange={(value) =>
                      setPrivacySettings({ ...privacySettings, invisible: value })
                    }
                    trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  Browse without being visible to others
                </Text>
              </View>
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.title}>Notification preferences</Text>
            <Text style={styles.subtitle}>Choose what updates you want to receive</Text>

            <View style={styles.settingsContainer}>
              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingTitle}>Friends nearby</Text>
                  <Switch
                    value={Boolean(notifications.friendsNearby)}
                    onValueChange={(value) =>
                      setNotifications({ ...notifications, friendsNearby: value })
                    }
                    trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  Get notified when friends are close
                </Text>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingTitle}>Event alerts</Text>
                  <Switch
                    value={Boolean(notifications.eventAlerts)}
                    onValueChange={(value) =>
                      setNotifications({ ...notifications, eventAlerts: value })
                    }
                    trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  Notifications for recommended events
                </Text>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingTitle}>Nearby match opportunities</Text>
                  <Switch
                    value={Boolean(notifications.matchOpportunities)}
                    onValueChange={(value) =>
                      setNotifications({ ...notifications, matchOpportunities: value })
                    }
                    trackColor={{ false: '#E0E0E0', true: '#8C1515' }}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  When someone with similar interests is nearby
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (step === 1 && selectedInterests.length < 3 || loading) && styles.continueButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={(step === 1 && selectedInterests.length < 3) || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>
              {step === 4 ? 'Get Started' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    fontSize: 28,
    color: '#8C1515',
    fontWeight: '600',
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBar: {
    height: 6,
    width: 48,
    borderRadius: 3,
  },
  progressBarActive: {
    backgroundColor: '#8C1515',
  },
  progressBarInactive: {
    backgroundColor: '#E0E0E0',
  },
  skipButton: {
    fontSize: 28,
    color: '#999999',
    width: 40,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
    marginBottom: 32,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 17,
    color: '#000000',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  interestButtonActive: {
    backgroundColor: '#8C1515',
  },
  interestButtonText: {
    fontSize: 15,
    color: '#000000',
  },
  interestButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  slidersContainer: {
    gap: 32,
  },
  sliderGroup: {
    gap: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 15,
    color: '#666666',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  settingsContainer: {
    gap: 16,
  },
  settingCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  continueButton: {
    backgroundColor: '#8C1515',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
