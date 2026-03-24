import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const result = params.data ? JSON.parse(params.data as string) : null;
  const type = params.type as string;

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No result data available</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'alert-circle';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analysis Result</Text>
        </View>

        {/* Risk Level Card */}
        <View
          style={[
            styles.riskCard,
            { borderColor: getRiskColor(result.risk_level) },
          ]}
        >
          <View
            style={[
              styles.riskIconContainer,
              { backgroundColor: `${getRiskColor(result.risk_level)}20` },
            ]}
          >
            <Ionicons
              name={getRiskIcon(result.risk_level)}
              size={48}
              color={getRiskColor(result.risk_level)}
            />
          </View>
          <Text
            style={[styles.riskLevel, { color: getRiskColor(result.risk_level) }]}
          >
            {result.risk_level} RISK
          </Text>
          <Text style={styles.riskScore}>Risk Score: {result.risk_score}/100</Text>
        </View>

        {/* Content Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={type === 'message' ? 'document-text' : 'musical-notes'}
              size={20}
              color="#00d4ff"
            />
            <Text style={styles.cardTitle}>
              {type === 'message' ? 'Message Content' : 'Audio Analysis'}
            </Text>
          </View>
          <Text style={styles.cardContent}>{result.content}</Text>
        </View>

        {/* Explanation Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#00d4ff" />
            <Text style={styles.cardTitle}>Explanation</Text>
          </View>
          <Text style={styles.cardContent}>{result.explanation}</Text>
        </View>

        {/* Detected Patterns */}
        {result.detected_patterns && result.detected_patterns.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="scan" size={20} color="#00d4ff" />
              <Text style={styles.cardTitle}>Detected Patterns</Text>
            </View>
            <View style={styles.patternsList}>
              {result.detected_patterns.map((pattern: string, index: number) => (
                <View key={index} style={styles.patternItem}>
                  <Ionicons name="chevron-forward" size={16} color="#ffa502" />
                  <Text style={styles.patternText}>{pattern}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Analysis */}
        {result.ai_analysis && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={20} color="#00d4ff" />
              <Text style={styles.cardTitle}>AI Analysis</Text>
            </View>
            <Text style={styles.cardContent}>{result.ai_analysis}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/')}
          >
            <Ionicons name="home" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/history')}
          >
            <Ionicons name="time" size={20} color="#00d4ff" />
            <Text style={styles.secondaryButtonText}>View History</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  riskCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  riskIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  riskLevel: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  riskScore: {
    fontSize: 16,
    color: '#8b93b0',
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#8b93b0',
    lineHeight: 22,
  },
  patternsList: {
    marginTop: 4,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternText: {
    fontSize: 14,
    color: '#8b93b0',
    marginLeft: 8,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#8b93b0',
    marginBottom: 20,
  },
  homeButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
