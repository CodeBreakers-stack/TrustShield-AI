import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total_scans: 0,
    high_risk: 0,
    medium_risk: 0,
    low_risk: 0,
  });
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadStats();
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={40} color="#00d4ff" />
          </View>
          <Text style={styles.title}>TrustShield AI</Text>
          <Text style={styles.subtitle}>
            Real-Time Scam & Deepfake Detection
          </Text>
        </View>

        {/* Stats Card */}
        <Animated.View
          style={[
            styles.statsCard,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.statsTitle}>Protection Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_scans}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={[styles.statNumber, { color: '#ff4757' }]}>
                {stats.high_risk}
              </Text>
              <Text style={styles.statLabel}>High Risk</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ffa502' }]}>
                {stats.medium_risk}
              </Text>
              <Text style={styles.statLabel}>Medium</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={[styles.statNumber, { color: '#2ed573' }]}>
                {stats.low_risk}
              </Text>
              <Text style={styles.statLabel}>Low Risk</Text>
            </View>
          </View>
        </Animated.View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Choose Detection Type</Text>

          {/* Message Detection Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton]}
            onPress={() => router.push('/message-detection')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="mail" size={32} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Check Message</Text>
              <Text style={styles.actionDescription}>
                Detect scams in SMS, emails, and messages
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Voice Detection Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.voiceButton]}
            onPress={() => router.push('/voice-detection')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="mic" size={32} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Analyze Voice</Text>
              <Text style={styles.actionDescription}>
                Detect voice cloning and deepfakes
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          {/* History Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.historyButton]}
            onPress={() => router.push('/history')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="time" size={32} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Detection History</Text>
              <Text style={styles.actionDescription}>
                View past scans and results
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#00d4ff" />
            <Text style={styles.infoText}>
              TrustShield uses AI-powered detection to protect you from scams and
              fraud attempts.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b93b0',
    textAlign: 'center',
  },
  statsCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b93b0',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  messageButton: {
    backgroundColor: '#667eea',
  },
  voiceButton: {
    backgroundColor: '#f093fb',
  },
  historyButton: {
    backgroundColor: '#4facfe',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#8b93b0',
    marginLeft: 12,
    lineHeight: 20,
  },
});
