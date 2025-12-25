// app/(app)/notification/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../../context/NotificationContext';
import { NotificationData } from '../../../services/notificationService';

// Debug Logger
class DebugLogger {
  private static logs: { type: 'log' | 'error' | 'warn' | 'info'; message: string; timestamp: Date }[] = [];
  private static listeners: ((logs: typeof DebugLogger.logs) => void)[] = [];

  static addLog(type: 'log' | 'error' | 'warn' | 'info', ...args: any[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    this.logs.push({ type, message, timestamp: new Date() });
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }
    
    this.notifyListeners();
  }

  static getLogs() {
    return this.logs;
  }

  static clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  static subscribe(listener: (logs: typeof DebugLogger.logs) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }
}

// Override console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

console.log = (...args: any[]) => {
  originalConsole.log(...args);
  DebugLogger.addLog('log', ...args);
};

console.error = (...args: any[]) => {
  originalConsole.error(...args);
  DebugLogger.addLog('error', ...args);
};

console.warn = (...args: any[]) => {
  originalConsole.warn(...args);
  DebugLogger.addLog('warn', ...args);
};

console.info = (...args: any[]) => {
  originalConsole.info(...args);
  DebugLogger.addLog('info', ...args);
};

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState(DebugLogger.getLogs());
  const [errorCount, setErrorCount] = useState(0);

  // Subscribe to debug logs
  useEffect(() => {
    console.log('NotificationsScreen mounted');
    console.log('Initial notifications count:', notifications.length);
    console.log('Initial unread count:', unreadCount);

    const unsubscribe = DebugLogger.subscribe((logs) => {
      setDebugLogs(logs);
      setErrorCount(logs.filter(log => log.type === 'error').length);
    });

    return () => {
      console.log('NotificationsScreen unmounted');
      unsubscribe();
    };
  }, []);

  // Log notifications changes
  useEffect(() => {
    console.log('Notifications updated:', {
      count: notifications.length,
      unread: unreadCount,
      isLoading,
    });
  }, [notifications, unreadCount, isLoading]);

  const onRefresh = async () => {
    console.log('Refreshing notifications...');
    setRefreshing(true);
    try {
      await refreshNotifications();
      console.log('Notifications refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    console.log('Notification pressed:', notification.id, notification.type);
    
    // Mark as read
    if (!notification.isRead) {
      try {
        await markAsRead([notification.id]);
        console.log('Notification marked as read:', notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate based on type
    try {
      if (notification.type === 'NEW_LEAD' && notification.leadId) {
        console.log('Navigating to lead:', notification.leadId);
        router.push(`/(app)/leads/${notification.leadId}`);
      } else if (notification.type === 'LEAD_CONSUMED') {
        console.log('Navigating to my leads');
        router.push('/(app)/dashboard/my-leads');
      } else if (notification.data?.screen) {
        console.log('Navigating to screen:', notification.data.screen);
        router.push(notification.data.screen);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting notification:', notificationId);
              await deleteNotification(notificationId);
              console.log('Notification deleted successfully');
            } catch (error) {
              console.error('Failed to delete notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting all notifications...');
              await deleteAllNotifications();
              console.log('All notifications deleted successfully');
            } catch (error) {
              console.error('Failed to delete all notifications:', error);
              Alert.alert('Error', 'Failed to delete notifications');
            }
          },
        },
      ]
    );
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      console.log('Marking all as read...');
      await markAllAsRead();
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_LEAD':
        return 'megaphone-outline';
      case 'LEAD_CONSUMED':
        return 'checkmark-circle-outline';
      case 'ADMIN_BROADCAST':
        return 'notifications-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: NotificationData }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(item.type) as any}
            size={24}
            color={!item.isRead ? '#007AFF' : '#666'}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Debug Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
        
        {/* Debug Button */}
        <TouchableOpacity
          style={[styles.debugButton, errorCount > 0 && styles.debugButtonError]}
          onPress={() => setDebugModalVisible(true)}
        >
          <Ionicons 
            name="bug-outline" 
            size={20} 
            color={errorCount > 0 ? '#FFF' : '#007AFF'} 
          />
          {errorCount > 0 && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>{errorCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllRead}
            >
              <Ionicons name="checkmark-done" size={18} color="#007AFF" />
              <Text style={styles.actionButtonText}>Mark all read</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteAllButton]}
            onPress={handleDeleteAll}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.deleteAllText]}>
              Delete all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll be notified when there are new leads or updates
            </Text>
          </View>
        }
      />

      {/* Debug Console Modal */}
      <Modal
        visible={debugModalVisible}
        animationType="slide"
        onRequestClose={() => setDebugModalVisible(false)}
      >
        <View style={styles.debugModal}>
          {/* Debug Header */}
          <View style={styles.debugHeader}>
            <Text style={styles.debugHeaderTitle}>Debug Console</Text>
            <View style={styles.debugHeaderActions}>
              <TouchableOpacity
                style={styles.debugHeaderButton}
                onPress={() => {
                  DebugLogger.clearLogs();
                  console.log('Debug logs cleared');
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#FFF" />
                <Text style={styles.debugHeaderButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.debugHeaderButton}
                onPress={() => setDebugModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Debug Stats */}
          <View style={styles.debugStats}>
            <View style={styles.debugStat}>
              <Text style={styles.debugStatLabel}>Total Logs</Text>
              <Text style={styles.debugStatValue}>{debugLogs.length}</Text>
            </View>
            <View style={styles.debugStat}>
              <Text style={styles.debugStatLabel}>Errors</Text>
              <Text style={[styles.debugStatValue, styles.debugStatError]}>
                {errorCount}
              </Text>
            </View>
            <View style={styles.debugStat}>
              <Text style={styles.debugStatLabel}>Warnings</Text>
              <Text style={[styles.debugStatValue, styles.debugStatWarning]}>
                {debugLogs.filter(log => log.type === 'warn').length}
              </Text>
            </View>
          </View>

          {/* Debug Logs List */}
          <ScrollView style={styles.debugLogsList}>
            {debugLogs.length === 0 ? (
              <View style={styles.debugEmpty}>
                <Ionicons name="code-slash-outline" size={48} color="#666" />
                <Text style={styles.debugEmptyText}>No logs yet</Text>
              </View>
            ) : (
              debugLogs.map((log, index) => (
                <View key={index} style={styles.debugLogItem}>
                  <View style={styles.debugLogHeader}>
                    <View style={[
                      styles.debugLogType,
                      log.type === 'error' && styles.debugLogTypeError,
                      log.type === 'warn' && styles.debugLogTypeWarn,
                      log.type === 'info' && styles.debugLogTypeInfo,
                    ]}>
                      <Text style={styles.debugLogTypeText}>
                        {log.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.debugLogTime}>
                      {log.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.debugLogMessage}>{log.message}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  debugButtonError: {
    backgroundColor: '#FF3B30',
  },
  errorBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  errorBadgeText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  deleteAllButton: {
    backgroundColor: '#FFE5E5',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteAllText: {
    color: '#FF3B30',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  
  // Debug Modal Styles
  debugModal: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  debugHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  debugHeaderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  debugHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#3D3D3D',
  },
  debugHeaderButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugStats: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  debugStat: {
    flex: 1,
    alignItems: 'center',
  },
  debugStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  debugStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  debugStatError: {
    color: '#FF6B6B',
  },
  debugStatWarning: {
    color: '#FFA500',
  },
  debugLogsList: {
    flex: 1,
  },
  debugEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  debugEmptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  debugLogItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  debugLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  debugLogType: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  debugLogTypeError: {
    backgroundColor: '#FF6B6B',
  },
  debugLogTypeWarn: {
    backgroundColor: '#FFA500',
  },
  debugLogTypeInfo: {
    backgroundColor: '#4ECDC4',
  },
  debugLogTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  debugLogTime: {
    fontSize: 11,
    color: '#999',
  },
  debugLogMessage: {
    fontSize: 13,
    color: '#FFF',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});