// app/(app)/dashboard/notifications.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

interface PollOption {
  id: string;
  text: string;
  votes: number;
  isPreferred?: boolean;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVoted: boolean;
}

const INITIAL_POLLS: Poll[] = [
  {
    id: '1',
    question: 'What feature would you like to see first?',
    options: [
      { id: '1a', text: 'Push Notifications', votes: 847, isPreferred: true },
      { id: '1b', text: 'Video Calls', votes: 523 },
      { id: '1c', text: 'Advanced Filters', votes: 389 },
      { id: '1d', text: 'Dark Mode Themes', votes: 612 },
    ],
    totalVotes: 2371,
    userVoted: false,
  },
  {
    id: '2',
    question: 'How often do you use the app?',
    options: [
      { id: '2a', text: 'Daily', votes: 1203, isPreferred: true },
      { id: '2b', text: 'Few times a week', votes: 876 },
      { id: '2c', text: 'Weekly', votes: 421 },
      { id: '2d', text: 'Rarely', votes: 234 },
    ],
    totalVotes: 2734,
    userVoted: false,
  },
  {
    id: '3',
    question: 'What type of content do you prefer?',
    options: [
      { id: '3a', text: 'Business Insights', votes: 1089, isPreferred: true },
      { id: '3b', text: 'Product Updates', votes: 678 },
      { id: '3c', text: 'Industry News', votes: 845 },
      { id: '3d', text: 'Success Stories', votes: 456 },
    ],
    totalVotes: 3068,
    userVoted: false,
  },
  {
    id: '4',
    question: 'Rate your experience so far',
    options: [
      { id: '4a', text: '⭐⭐⭐⭐⭐ Excellent', votes: 1456, isPreferred: true },
      { id: '4b', text: '⭐⭐⭐⭐ Good', votes: 892 },
      { id: '4c', text: '⭐⭐⭐ Average', votes: 334 },
      { id: '4d', text: '⭐⭐ Needs Work', votes: 127 },
    ],
    totalVotes: 2809,
    userVoted: false,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);

  const handleVote = (pollId: string, optionId: string) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) => {
        if (poll.id === pollId && !poll.userVoted) {
          return {
            ...poll,
            userVoted: true,
            totalVotes: poll.totalVotes + 1,
            options: poll.options.map((opt) =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
          };
        }
        return poll;
      })
    );
  };

  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const handleBack = () => {
    // Navigate to dashboard instead of using router.back()
    router.push('/(app)/dashboard');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={sizeScale(24)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Coming Soon Banner */}
        <LinearGradient
          colors={['#8b5cf6', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <Ionicons name="rocket" size={sizeScale(32)} color="#fff" />
          <Text style={styles.bannerTitle}>We're Working On It! 🚀</Text>
          <Text style={styles.bannerSubtitle}>
            Push notifications are coming soon. Help us prioritize by voting below!
          </Text>
        </LinearGradient>

        {/* Polls Section */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Help Us Improve</Text>
          <Text style={styles.sectionSubtitle}>
            Your vote matters! Share your preferences:
          </Text>

          {polls.map((poll) => (
            <View key={poll.id} style={styles.pollCard}>
              <Text style={styles.pollQuestion}>{poll.question}</Text>
              <Text style={styles.pollVotes}>{poll.totalVotes} votes</Text>

              <View style={styles.optionsContainer}>
                {poll.options.map((option) => {
                  const percentage = getPercentage(option.votes, poll.totalVotes);
                  const isWinning = option.isPreferred;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        poll.userVoted && styles.optionButtonVoted,
                      ]}
                      onPress={() => handleVote(poll.id, option.id)}
                      disabled={poll.userVoted}
                      activeOpacity={0.7}
                    >
                      {/* Background Bar */}
                      <View
                        style={[
                          styles.optionBar,
                          {
                            width: `${percentage}%`,
                            backgroundColor: isWinning
                              ? 'rgba(139, 92, 246, 0.3)'
                              : 'rgba(255, 255, 255, 0.1)',
                          },
                        ]}
                      />

                      {/* Content */}
                      <View style={styles.optionContent}>
                        <Text style={styles.optionText}>{option.text}</Text>
                        {poll.userVoted && (
                          <Text style={styles.optionPercentage}>
                            {percentage}%
                          </Text>
                        )}
                      </View>

                      {/* Winner Badge */}
                      {isWinning && poll.userVoted && (
                        <View style={styles.winnerBadge}>
                          <Ionicons
                            name="trophy"
                            size={sizeScale(12)}
                            color="#fbbf24"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {!poll.userVoted && (
                <Text style={styles.pollHint}>Tap an option to vote</Text>
              )}
            </View>
          ))}

          {/* Thank You Message */}
          <View style={styles.thankYouCard}>
            <Ionicons name="heart" size={sizeScale(40)} color="#f43f5e" />
            <Text style={styles.thankYouTitle}>Thank You!</Text>
            <Text style={styles.thankYouText}>
              Your feedback helps us build features you actually want. Stay tuned
              for updates!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    padding: sizeScale(4),
  },
  headerTitle: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: sizeScale(32),
  },
  banner: {
    marginHorizontal: sizeScale(16),
    marginTop: sizeScale(16),
    padding: sizeScale(24),
    borderRadius: sizeScale(16),
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: sizeScale(24),
    fontWeight: '700',
    color: '#fff',
    marginTop: sizeScale(12),
    marginBottom: sizeScale(8),
  },
  bannerSubtitle: {
    fontSize: sizeScale(14),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: sizeScale(20),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: sizeScale(16),
    paddingBottom: sizeScale(100),
  },
  sectionTitle: {
    fontSize: sizeScale(22),
    fontWeight: '700',
    color: '#fff',
    marginBottom: sizeScale(4),
  },
  sectionSubtitle: {
    fontSize: sizeScale(14),
    color: '#888',
    marginBottom: sizeScale(20),
  },
  pollCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(12),
    padding: sizeScale(16),
    marginBottom: sizeScale(16),
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  pollQuestion: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
    marginBottom: sizeScale(4),
  },
  pollVotes: {
    fontSize: sizeScale(12),
    color: '#666',
    marginBottom: sizeScale(16),
  },
  optionsContainer: {
    gap: sizeScale(10),
  },
  optionButton: {
    position: 'relative',
    backgroundColor: '#0d0d0d',
    borderRadius: sizeScale(8),
    padding: sizeScale(12),
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  optionButtonVoted: {
    borderColor: '#3a3a3a',
  },
  optionBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: sizeScale(8),
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  optionText: {
    fontSize: sizeScale(14),
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  optionPercentage: {
    fontSize: sizeScale(14),
    fontWeight: '700',
    color: '#8b5cf6',
    marginLeft: sizeScale(12),
  },
  winnerBadge: {
    position: 'absolute',
    top: sizeScale(8),
    right: sizeScale(8),
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: sizeScale(12),
    padding: sizeScale(4),
  },
  pollHint: {
    fontSize: sizeScale(12),
    color: '#666',
    marginTop: sizeScale(12),
    fontStyle: 'italic',
  },
  thankYouCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: sizeScale(12),
    padding: sizeScale(32),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: sizeScale(8),
  },
  thankYouTitle: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#fff',
    marginTop: sizeScale(12),
    marginBottom: sizeScale(8),
  },
  thankYouText: {
    fontSize: sizeScale(14),
    color: '#888',
    textAlign: 'center',
    lineHeight: sizeScale(20),
  },
});