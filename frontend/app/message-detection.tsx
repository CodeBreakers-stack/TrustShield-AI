import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function MessageDetectionScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleMessages = [
    'URGENT: Your bank account has been suspended. Click here to verify your identity immediately or risk permanent closure.',
    'Congratulations! You have won $1,000,000 in the lottery. Claim your prize now by providing your credit card details.',
    'Hi, are we still meeting for lunch at 2pm today?',
    'Your package will arrive tomorrow between 2-4 PM. Thanks for shopping with us!',
  ];

  const handleAnalyze = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message to analyze');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/detect-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Navigate to result screen with data
        router.push({
          pathname: '/result',
          params: {
            type: 'message',
            data: JSON.stringify(result),
          },
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to analyze message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const useSampleMessage = (sample: string) => {
    setMessage(sample);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={28} color="#667eea" />
              </View>
              <Text style={styles.headerTitle}>Message Scam Detection</Text>
              <Text style={styles.headerSubtitle}>
                Analyze text for scam patterns
              </Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Enter Message or SMS</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Paste the message you want to analyze..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={8}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{message.length} characters</Text>
          </View>

          {/* Sample Messages */}
          <View style={styles.samplesSection}>
            <Text style={styles.sampleTitle}>
              <Ionicons name="bulb-outline" size={16} color="#fbbf24" /> Try
              Sample Messages
            </Text>
            {sampleMessages.map((sample, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sampleCard}
                onPress={() => useSampleMessage(sample)}
              >
                <Text style={styles.sampleText} numberOfLines={2}>
                  {sample}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8b93b0" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Analyze Button */}
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!message.trim() || loading) && styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={!message.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
                <Text style={styles.analyzeButtonText}>Analyze Message</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#667eea" />
            <Text style={styles.infoText}>
              Our AI analyzes keywords, patterns, and context to detect scam
              attempts in your messages.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8b93b0',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'right',
  },
  samplesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 12,
  },
  sampleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sampleText: {
    flex: 1,
    fontSize: 13,
    color: '#8b93b0',
    marginRight: 8,
  },
  analyzeButton: {
    backgroundColor: '#667eea',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 20,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#4b5563',
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8b93b0',
    marginLeft: 12,
    lineHeight: 18,
  },
});
