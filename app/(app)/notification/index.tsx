// // app/(app)/notification/index.tsx
// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   RefreshControl,
//   Alert,
//   Animated,
//   Platform,
//   StatusBar,
//   useWindowDimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Added for responsiveness
// import { useNotifications } from '../../../context/NotificationContext';
// import { NotificationData } from '../../../services/notificationService';

// // Removed static Dimensions.get to use useWindowDimensions hook inside component

// interface SwipeableNotificationProps {
//   item: NotificationData;
//   onDelete: (id: string) => void;
//   onPress: (item: NotificationData) => void;
//   screenWidth: number;
// }

// const SwipeableNotification = ({ item, onDelete, onPress, screenWidth }: SwipeableNotificationProps) => {
//   const translateX = new Animated.Value(0);
//   const [isSwiping, setIsSwiping] = useState(false);
//   const SWIPE_THRESHOLD = screenWidth * 0.3;

//   // Note: For complex gestures, PanResponder is usually required. 
//   // However, keeping your existing logic structure for simplicity.
//   // If you are using a specific library for swiping previously, ensure it is hooked up here.
//   // Assuming the previous logic was triggered via a library or simplified here for the example. 
//   // Since the original code didn't include the PanResponder/Gesture logic block fully, 
//   // I will assume standard touch handling or that you inject the gesture handler here.

//   const getNotificationIcon = (type: string) => {
//     switch (type) {
//       case 'NEW_LEAD': return 'megaphone';
//       case 'LEAD_CONSUMED': return 'checkmark-circle';
//       case 'ADMIN_BROADCAST': return 'notifications';
//       default: return 'information-circle';
//     }
//   };

//   const formatTime = (dateString: string) => {
//     try {
//       const date = new Date(dateString);
//       const now = new Date();
//       const diffInMs = now.getTime() - date.getTime();
//       const diffInMins = Math.floor(diffInMs / 60000);
//       const diffInHours = Math.floor(diffInMs / 3600000);
//       const diffInDays = Math.floor(diffInMs / 86400000);

//       if (diffInMins < 1) return 'Just now';
//       if (diffInMins < 60) return `${diffInMins}m ago`;
//       if (diffInHours < 24) return `${diffInHours}h ago`;
//       if (diffInDays < 7) return `${diffInDays}d ago`;
//       return date.toLocaleDateString();
//     } catch (error) {
//       return 'Recently';
//     }
//   };

//   return (
//     <View style={styles.swipeContainer}>
//       {/* Delete Background */}
//       <View style={styles.deleteBackground}>
//         <Ionicons name="trash" size={24} color="#FFF" />
//         <Text style={styles.deleteText}>Delete</Text>
//       </View>

//       {/* Notification Card */}
//       <Animated.View
//         style={[
//           styles.notificationCard,
//           !item.isRead && styles.unreadNotification,
//           { transform: [{ translateX }] },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.notificationContent}
//           onPress={() => onPress(item)}
//           activeOpacity={0.7}
//           disabled={isSwiping}
//         >
//           <View style={[
//             styles.iconContainer,
//             !item.isRead && styles.unreadIconContainer
//           ]}>
//             <Ionicons
//               name={getNotificationIcon(item.type) as any}
//               size={24}
//               color={!item.isRead ? '#01BE8B' : '#8FA8CC'}
//             />
//           </View>

//           <View style={styles.textContainer}>
//             <Text style={[styles.title, !item.isRead && styles.unreadText]}>
//               {item.title}
//             </Text>
//             <Text style={styles.body} numberOfLines={2}>
//               {item.body}
//             </Text>
//             <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
//           </View>

//           <TouchableOpacity
//             style={styles.deleteButton}
//             onPress={(e) => {
//               e.stopPropagation();
//               onDelete(item.id);
//             }}
//             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//           >
//             <Ionicons name="close" size={20} color="#8FA8CC" />
//           </TouchableOpacity>
//         </TouchableOpacity>

//         {!item.isRead && <View style={styles.unreadDot} />}
//       </Animated.View>
//     </View>
//   );
// };

// export default function NotificationsScreen() {
//   const insets = useSafeAreaInsets(); // Hook for safe area values
//   const { width } = useWindowDimensions(); // Hook for dynamic screen width
  
//   const {
//     notifications,
//     unreadCount,
//     refreshNotifications,
//     markAsRead,
//     markAllAsRead,
//     deleteNotification,
//     deleteAllNotifications,
//   } = useNotifications();

//   const [refreshing, setRefreshing] = useState(false);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     try {
//       await refreshNotifications();
//     } catch (error) {
//       console.error('Failed to refresh notifications:', error);
//       Alert.alert('Error', 'Failed to refresh notifications. Please try again.');
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const handleNotificationPress = async (notification: NotificationData) => {
//     try {
//       // Only mark as read, no routing
//       if (!notification.isRead) {
//         await markAsRead([notification.id]);
//       }
//     } catch (error) {
//       console.error('Failed to mark notification as read:', error);
//     }
//   };

//   const handleDeleteNotification = async (notificationId: string) => {
//     try {
//       await deleteNotification(notificationId);
//     } catch (error) {
//       console.error('Failed to delete notification:', error);
//       Alert.alert('Error', 'Failed to delete notification. Please try again.');
//     }
//   };

//   const handleDeleteAll = () => {
//     if (notifications.length === 0) return;

//     Alert.alert(
//       'Delete All Notifications',
//       'Are you sure you want to delete all notifications? This action cannot be undone.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Delete All',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteAllNotifications();
//             } catch (error) {
//               console.error('Failed to delete all notifications:', error);
//               Alert.alert('Error', 'Failed to delete notifications. Please try again.');
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleMarkAllRead = async () => {
//     if (unreadCount === 0) return;

//     try {
//       await markAllAsRead();
//     } catch (error) {
//       console.error('Failed to mark all as read:', error);
//       Alert.alert('Error', 'Failed to mark notifications as read. Please try again.');
//     }
//   };

//   const renderNotification = ({ item }: { item: NotificationData }) => (
//     <SwipeableNotification
//       item={item}
//       onDelete={handleDeleteNotification}
//       onPress={handleNotificationPress}
//       screenWidth={width}
//     />
//   );

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#121924" />
      
//       {/* Header with dynamic Safe Area Padding */}
//       <View style={[
//         styles.header, 
//         { 
//           paddingTop: insets.top + 10, // Dynamic top padding 
//           height: 60 + insets.top // Ensure header has height for content
//         }
//       ]}>
//         <View style={styles.headerLeft}>
//           <Text style={styles.headerTitle}>Notifications</Text>
//           {unreadCount > 0 && (
//             <View style={styles.badge}>
//               <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Action Buttons */}
//       {notifications.length > 0 && (
//         <View style={styles.actionBar}>
//           {unreadCount > 0 && (
//             <TouchableOpacity
//               style={styles.actionButton}
//               onPress={handleMarkAllRead}
//               activeOpacity={0.7}
//             >
//               <Ionicons name="checkmark-done" size={18} color="#01BE8B" />
//               <Text style={styles.actionButtonText}>Mark all read</Text>
//             </TouchableOpacity>
//           )}

//           <TouchableOpacity
//             style={[styles.actionButton, styles.deleteAllButton]}
//             onPress={handleDeleteAll}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="trash-outline" size={18} color="#FF3B30" />
//             <Text style={[styles.actionButtonText, styles.deleteAllText]}>
//               Clear all
//             </Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Notifications List */}
//       <FlatList
//         data={notifications}
//         renderItem={renderNotification}
//         keyExtractor={(item) => item.id}
//         // Dynamic bottom padding to avoid home indicator
//         contentContainerStyle={[
//           styles.listContainer, 
//           { paddingBottom: insets.bottom + 20 }
//         ]}
//         refreshControl={
//           <RefreshControl 
//             refreshing={refreshing} 
//             onRefresh={onRefresh}
//             tintColor="#01BE8B"
//             colors={['#01BE8B']}
//             progressViewOffset={insets.top} // Ensures spinner is visible on Android
//           />
//         }
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <View style={styles.emptyIconCircle}>
//               <Ionicons name="notifications-off-outline" size={48} color="#8FA8CC" />
//             </View>
//             <Text style={styles.emptyText}>No notifications yet</Text>
//             <Text style={styles.emptySubtext}>
//               You'll be notified when there are new leads or important updates
//             </Text>
//           </View>
//         }
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000000',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     backgroundColor: '#121924',
//     borderBottomWidth: 1,
//     borderBottomColor: '#1c283c',
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#FFFFFF',
//   },
//   badge: {
//     backgroundColor: '#FF3B30',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     minWidth: 24,
//     alignItems: 'center',
//   },
//   badgeText: {
//     color: '#FFF',
//     fontSize: 12,
//     fontWeight: '700',
//   },
//   actionBar: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     padding: 12,
//     backgroundColor: '#121924',
//     borderBottomWidth: 1,
//     borderBottomColor: '#1c283c',
//     gap: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//     backgroundColor: 'rgba(1, 190, 139, 0.1)',
//     borderWidth: 1,
//     borderColor: 'rgba(1, 190, 139, 0.2)',
//   },
//   deleteAllButton: {
//     backgroundColor: 'rgba(255, 59, 48, 0.1)',
//     borderColor: 'rgba(255, 59, 48, 0.2)',
//   },
//   actionButtonText: {
//     fontSize: 14,
//     color: '#01BE8B',
//     fontWeight: '600',
//   },
//   deleteAllText: {
//     color: '#FF3B30',
//   },
//   listContainer: {
//     flexGrow: 1,
//     padding: 16,
//   },
//   swipeContainer: {
//     marginBottom: 12,
//     position: 'relative',
//   },
//   deleteBackground: {
//     position: 'absolute',
//     right: 0,
//     top: 0,
//     bottom: 0,
//     width: 100,
//     backgroundColor: '#FF3B30',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 12,
//     gap: 4,
//   },
//   deleteText: {
//     color: '#FFF',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   notificationCard: {
//     backgroundColor: '#121924',
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: '#1c283c',
//   },
//   unreadNotification: {
//     borderLeftWidth: 3,
//     borderLeftColor: '#01BE8B',
//     backgroundColor: 'rgba(1, 190, 139, 0.05)',
//   },
//   notificationContent: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//   },
//   iconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: 'rgba(143, 168, 204, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(143, 168, 204, 0.2)',
//   },
//   unreadIconContainer: {
//     backgroundColor: 'rgba(1, 190, 139, 0.1)',
//     borderColor: 'rgba(1, 190, 139, 0.3)',
//   },
//   textContainer: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: 6,
//     lineHeight: 22,
//   },
//   unreadText: {
//     fontWeight: '700',
//     color: '#01BE8B',
//   },
//   body: {
//     fontSize: 14,
//     color: '#8FA8CC',
//     marginBottom: 8,
//     lineHeight: 20,
//   },
//   time: {
//     fontSize: 12,
//     color: '#61738D',
//   },
//   deleteButton: {
//     padding: 4,
//     marginLeft: 8,
//   },
//   unreadDot: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: '#01BE8B',
//     borderWidth: 2,
//     borderColor: '#121924',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 100,
//   },
//   emptyIconCircle: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: 'rgba(143, 168, 204, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     borderWidth: 2,
//     borderColor: 'rgba(143, 168, 204, 0.2)',
//   },
//   emptyText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#FFFFFF',
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#8FA8CC',
//     textAlign: 'center',
//     paddingHorizontal: 32,
//     lineHeight: 20,
//   },
// });


// app/(app)/notification/index.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  PanResponder,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../../context/NotificationContext';
import { NotificationData } from '../../../services/notificationService';

interface SwipeableNotificationProps {
  item: NotificationData;
  onDelete: (id: string) => void;
  onPress: (item: NotificationData) => void;
  screenWidth: number;
}

const SwipeableNotification = ({ item, onDelete, onPress, screenWidth }: SwipeableNotificationProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwiping, setIsSwiping] = useState(false);
  const SWIPE_THRESHOLD = screenWidth * 0.4; // 40% of screen width to trigger delete

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative values)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsSwiping(false);
        
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe threshold reached - delete
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onDelete(item.id);
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Reset on gesture cancel
        setIsSwiping(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }).start();
      },
    })
  ).current;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_LEAD': return 'megaphone';
      case 'LEAD_CONSUMED': return 'checkmark-circle';
      case 'ADMIN_BROADCAST': return 'notifications';
      default: return 'information-circle';
    }
  };

  const formatTime = (dateString: string) => {
    try {
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
    } catch (error) {
      return 'Recently';
    }
  };

  const deleteOpacity = translateX.interpolate({
    inputRange: [-screenWidth * 0.5, -50, 0],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const deleteScale = translateX.interpolate({
    inputRange: [-screenWidth * 0.5, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Background */}
      <Animated.View 
        style={[
          styles.deleteBackground,
          {
            opacity: deleteOpacity,
            transform: [{ scale: deleteScale }],
          }
        ]}
      >
        <Ionicons name="trash" size={28} color="#FFF" />
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>

      {/* Notification Card */}
      <Animated.View
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadNotification,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.notificationContent}
          onPress={() => !isSwiping && onPress(item)}
          activeOpacity={0.7}
          disabled={isSwiping}
        >
          <View style={[
            styles.iconContainer,
            !item.isRead && styles.unreadIconContainer
          ]}>
            <Ionicons
              name={getNotificationIcon(item.type) as any}
              size={24}
              color={!item.isRead ? '#01BE8B' : '#8FA8CC'}
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
            style={styles.closeButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color="#8FA8CC" />
          </TouchableOpacity>
        </TouchableOpacity>

        {!item.isRead && <View style={styles.unreadDot} />}
      </Animated.View>
    </View>
  );
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  
  const {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      Alert.alert('Error', 'Failed to refresh notifications. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    try {
      if (!notification.isRead) {
        await markAsRead([notification.id]);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      Alert.alert('Error', 'Failed to delete notification. Please try again.');
    }
  };

  const handleDeleteAll = () => {
    if (notifications.length === 0) return;

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
              await deleteAllNotifications();
            } catch (error) {
              console.error('Failed to delete all notifications:', error);
              Alert.alert('Error', 'Failed to delete notifications. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read. Please try again.');
    }
  };

  const renderNotification = ({ item }: { item: NotificationData }) => (
    <SwipeableNotification
      item={item}
      onDelete={handleDeleteNotification}
      onPress={handleNotificationPress}
      screenWidth={width}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121924" />
      
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          paddingTop: insets.top + 10,
          height: 60 + insets.top
        }
      ]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={18} color="#01BE8B" />
              <Text style={styles.actionButtonText}>Mark all read</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteAllButton]}
            onPress={handleDeleteAll}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={18} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.deleteAllText]}>
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer, 
          { paddingBottom: insets.bottom + 20 }
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#01BE8B"
            colors={['#01BE8B']}
            progressViewOffset={insets.top}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={48} color="#8FA8CC" />
            </View>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll be notified when there are new leads or important updates
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#121924',
    borderBottomWidth: 1,
    borderBottomColor: '#1c283c',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: '#121924',
    borderBottomWidth: 1,
    borderBottomColor: '#1c283c',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(1, 190, 139, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(1, 190, 139, 0.2)',
  },
  deleteAllButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#01BE8B',
    fontWeight: '600',
  },
  deleteAllText: {
    color: '#FF3B30',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  swipeContainer: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: '#121924',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1c283c',
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#01BE8B',
    backgroundColor: 'rgba(1, 190, 139, 0.05)',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(143, 168, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(143, 168, 204, 0.2)',
  },
  unreadIconContainer: {
    backgroundColor: 'rgba(1, 190, 139, 0.1)',
    borderColor: 'rgba(1, 190, 139, 0.3)',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 22,
  },
  unreadText: {
    fontWeight: '700',
    color: '#01BE8B',
  },
  body: {
    fontSize: 14,
    color: '#8FA8CC',
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#61738D',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#01BE8B',
    borderWidth: 2,
    borderColor: '#121924',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(143, 168, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(143, 168, 204, 0.2)',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8FA8CC',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});