import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Switch,
} from 'react-native';
import { currentUser, leaderboardData } from '../data/mockData';

export default function ProfileScreen({ navigation }: any) {
  const [visibleToFriends, setVisibleToFriends] = useState(true);
  const [discoveryMode, setDiscoveryMode] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);

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
            <Image source={{ uri: currentUser.photo }} style={styles.avatar} />
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userInfo}>
            {currentUser.year} • {currentUser.major}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>YOUR STATS</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={styles.statNumber}>{leaderboardData.myStats.events}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={styles.statNumber}>
                  {leaderboardData.myStats.newConnections}
                </Text>
                <Text style={styles.statLabel}>New Friends</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>📈</Text>
                <Text style={styles.statNumber}>#{leaderboardData.myStats.rank}</Text>
                <Text style={styles.statLabel}>Campus Rank</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INTERESTS</Text>
          <View style={styles.card}>
            <View style={styles.interestsContainer}>
              {currentUser.interests.map((interest) => (
                <View key={interest} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity>
              <Text style={styles.editInterestsButton}>Edit Interests</Text>
            </TouchableOpacity>
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
                onValueChange={setVisibleToFriends}
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
                onValueChange={setDiscoveryMode}
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
                onValueChange={setGhostMode}
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
            <TouchableOpacity style={styles.menuRowCenter}>
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
