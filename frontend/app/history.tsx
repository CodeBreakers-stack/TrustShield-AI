import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Detection {
  id: string;
  type: string;
  content: string;
  risk_level: string;
  risk_score: number;
  explanation: string;
  detected_patterns: string[];
  timestamp: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setDetections(data.detections || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return '#ff4757';
      case 'MEDIUM':
        return '#ffa502';
      case 'LOW':
        return '#2ed573';
      default:
        return '#8b93b0';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const viewDetails = (detection: Detection) => {
    router.push({
      pathname: '/result',
      params: {
        type: detection.type,
        data: JSON.stringify(detection),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d4ff" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="time" size={28} color="#4facfe" />
          <Text style={styles.headerTitle}>Detection History</Text>
        </View>
      </View>

      {detections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#4b5563" />
          <Text style={styles.emptyText}>No detections yet</Text>
          <Text style={styles.emptySubtext}>
            Start analyzing messages or voice samples
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.emptyButtonText}>Start Detection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00d4ff"
              colors={['#00d4ff']}
            />
          }
        >
          <Text style={styles.countText}>{detections.length} detections</Text>

          {detections.map((detection) => (
            <TouchableOpacity
              key={detection.id}
              style={styles.detectionCard}
              onPress={() => viewDetails(detection)}
              activeOpacity={0.7}
            >
              <View style={styles.detectionHeader}>
                <View style={styles.detectionTypeContainer}>
                  <Ionicons
                    name={detection.type === 'message' ? 'mail' : 'mic'}
                    size={20}
                    color={detection.type === 'message' ? '#667eea' : '#f093fb'}
                  />
                  <Text style={styles.detectionType}>
                    {detection.type === 'message' ? 'Message' : 'Voice'}
                  </Text>
                </View>
                <Text style={styles.detectionTime}>
                  {formatDate(detection.timestamp)}
                </Text>
              </View>

              <Text style={styles.detectionContent} numberOfLines={2}>
                {detection.content}
              </Text>

              <View style={styles.detectionFooter}>
                <View
                  style={[
                    styles.riskBadge,
                    { backgroundColor: `${getRiskColor(detection.risk_level)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.riskBadgeText,
                      { color: getRiskColor(detection.risk_level) },
                    ]}
                  >
                    {detection.risk_level} RISK
                  </Text>
                </View>
                <Text style={styles.riskScore}>{detection.risk_score}/100</Text>
                <Ionicons name="chevron-forward" size={20} color="#8b93b0" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8b93b0',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8b93b0',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  countText: {
    fontSize: 14,
    color: '#8b93b0',
    marginBottom: 16,
  },
  detectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detectionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detectionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  detectionTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  detectionContent: {
    fontSize: 14,
    color: '#8b93b0',
    lineHeight: 20,
    marginBottom: 12,
  },
  detectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  riskScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b93b0',
    flex: 1,
  },
});
