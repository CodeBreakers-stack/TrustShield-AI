import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function VoiceDetectionScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    requestPermissions();
    return () => {
      if (recording) {
        stopRecording();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to use voice analysis.'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      pulseAnim.stopAnimation();
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecording(null);

      if (uri) {
        await analyzeRecording(uri, recordingDuration);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const analyzeRecording = async (uri: string, duration: number) => {
    setLoading(true);

    try {
      // Read the audio file and convert to base64
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/analyze-voice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_base64: audioBase64,
            duration: duration,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Navigate to result screen
        router.push({
          pathname: '/result',
          params: {
            type: 'voice',
            data: JSON.stringify(result),
          },
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to analyze audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="mic" size={28} color="#f093fb" />
            </View>
            <Text style={styles.headerTitle}>Voice Analysis</Text>
            <Text style={styles.headerSubtitle}>
              Detect voice cloning & deepfakes
            </Text>
          </View>
        </View>

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          {isRecording ? (
            <View style={styles.recordingActive}>
              <Animated.View
                style={[
                  styles.recordingButton,
                  styles.recordingButtonActive,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Ionicons name="square" size={40} color="#fff" />
              </Animated.View>
              <Text style={styles.recordingDuration}>
                {formatDuration(recordingDuration)}
              </Text>
              <Text style={styles.recordingText}>Recording in progress...</Text>
            </View>
          ) : (
            <View style={styles.recordingInactive}>
              <TouchableOpacity
                style={styles.recordingButton}
                onPress={startRecording}
                disabled={loading}
              >
                <Ionicons name="mic" size={48} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.tapToRecord}>Tap to start recording</Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f093fb" />
              <Text style={styles.loadingText}>Analyzing audio...</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {isRecording && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
          >
            <Ionicons name="stop-circle" size={24} color="#fff" />
            <Text style={styles.stopButtonText}>Stop & Analyze</Text>
          </TouchableOpacity>
        )}

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>How it works</Text>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="recording" size={20} color="#f093fb" />
            </View>
            <Text style={styles.instructionText}>
              Record a voice sample (at least 3 seconds)
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="analytics" size={20} color="#f093fb" />
            </View>
            <Text style={styles.instructionText}>
              AI analyzes pitch, frequency, and patterns
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#f093fb" />
            </View>
            <Text style={styles.instructionText}>
              Get instant risk assessment and explanation
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#f093fb" />
          <Text style={styles.infoText}>
            Voice analysis detects synthetic speech patterns, unnatural pitch
            variations, and audio manipulation indicators.
          </Text>
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
    backgroundColor: 'rgba(240, 147, 251, 0.15)',
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
  recordingSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  recordingActive: {
    alignItems: 'center',
  },
  recordingInactive: {
    alignItems: 'center',
  },
  recordingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f093fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  recordingButtonActive: {
    backgroundColor: '#ff4757',
  },
  recordingDuration: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#8b93b0',
  },
  tapToRecord: {
    fontSize: 16,
    color: '#8b93b0',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8b93b0',
    marginTop: 12,
  },
  stopButton: {
    backgroundColor: '#ff4757',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(240, 147, 251, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#8b93b0',
    lineHeight: 20,
  },
  infoBox: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(240, 147, 251, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8b93b0',
    marginLeft: 12,
    lineHeight: 18,
  },
});
