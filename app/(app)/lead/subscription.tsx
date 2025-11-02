// // app/(app)/lead/subscription.tsx
// // Cross-platform solution: WebView for native, inline script for web

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   Dimensions,
//   TextInput,
//   Modal,
//   Platform,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { router } from 'expo-router';
// import { subscriptionAPI, SubscriptionPlan } from '../../../services/leads';
// import { Ionicons } from '@expo/vector-icons';

// // Conditional import for WebView (only on native)
// let WebView: any = null;
// if (Platform.OS !== 'web') {
//   WebView = require('react-native-webview').WebView;
// }

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const STANDARD_WIDTH = 390;
// const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// // Declare Razorpay type for web
// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// export default function SubscriptionScreen() {
//   const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedTier, setSelectedTier] = useState<string | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);
  
//   // WebView state (for native)
//   const [showWebView, setShowWebView] = useState(false);
//   const [paymentHtml, setPaymentHtml] = useState('');
//   const [currentOrderId, setCurrentOrderId] = useState('');
//   const [paymentType, setPaymentType] = useState<'subscription' | 'payg'>('subscription');
  
//   // Pay-as-you-go state
//   const [showPayAsYouGo, setShowPayAsYouGo] = useState(false);
//   const [leadsCount, setLeadsCount] = useState('10');

//   const webViewRef = useRef<any>(null);
//   const razorpayScriptLoaded = useRef(false);

//   useEffect(() => {
//     fetchPlans();
    
//     // Load Razorpay script for web platform
//     if (Platform.OS === 'web' && !razorpayScriptLoaded.current) {
//       loadRazorpayScript();
//     }
//   }, []);

//   const loadRazorpayScript = () => {
//     return new Promise((resolve, reject) => {
//       if (typeof window !== 'undefined' && window.Razorpay) {
//         razorpayScriptLoaded.current = true;
//         resolve(true);
//         return;
//       }

//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.async = true;
//       script.onload = () => {
//         razorpayScriptLoaded.current = true;
//         resolve(true);
//       };
//       script.onerror = () => {
//         reject(new Error('Failed to load Razorpay SDK'));
//       };
//       document.body.appendChild(script);
//     });
//   };

//   const fetchPlans = async () => {
//     try {
//       setIsLoading(true);
//       const response = await subscriptionAPI.getPlans();
//       if (response.status === 'success') {
//         setPlans(response.data);
//       }
//     } catch (error: any) {
//       Alert.alert('Error', error.message || 'Failed to load plans');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatPrice = (price: number) => {
//     return `₹${(price / 100).toLocaleString('en-IN')}`;
//   };

//   // Web-specific: Open Razorpay directly
//   const openRazorpayWeb = async (
//     orderId: string,
//     amount: number,
//     currency: string,
//     razorpayKeyId: string,
//     description: string,
//     type: 'subscription' | 'payg'
//   ) => {
//     try {
//       await loadRazorpayScript();
      
//       const options = {
//         key: razorpayKeyId,
//         amount: amount,
//         currency: currency,
//         name: 'Your Company',
//         description: description,
//         order_id: orderId,
//         handler: async function (response: any) {
//           setIsProcessing(true);
//           try {
//             if (type === 'subscription') {
//               await subscriptionAPI.verifySubscriptionPayment({
//                 razorpayOrderId: response.razorpay_order_id,
//                 razorpayPaymentId: response.razorpay_payment_id,
//                 razorpaySignature: response.razorpay_signature,
//               });
//               Alert.alert('Success', 'Subscription activated successfully!');
//             } else {
//               const verifyResponse = await subscriptionAPI.verifyPayAsYouGoPayment({
//                 razorpayOrderId: response.razorpay_order_id,
//                 razorpayPaymentId: response.razorpay_payment_id,
//                 razorpaySignature: response.razorpay_signature,
//               });
//               Alert.alert(
//                 'Success',
//                 `${verifyResponse.data.leadQuota - verifyResponse.data.consumedLeads} leads added!`
//               );
//             }
//             router.back();
//           } catch (error: any) {
//             Alert.alert('Error', 'Payment verification failed: ' + error.message);
//           } finally {
//             setIsProcessing(false);
//           }
//         },
//         modal: {
//           ondismiss: function() {
//             setIsProcessing(false);
//             Alert.alert('Cancelled', 'Payment was cancelled');
//           }
//         },
//         theme: {
//           color: '#8b5cf6'
//         }
//       };

//       const rzp = new window.Razorpay(options);
      
//       rzp.on('payment.failed', function (response: any) {
//         setIsProcessing(false);
//         Alert.alert('Payment Failed', response.error.description);
//       });

//       rzp.open();
//     } catch (error: any) {
//       setIsProcessing(false);
//       Alert.alert('Error', 'Failed to initialize payment: ' + error.message);
//     }
//   };

//   // Native-specific: Generate HTML for WebView
//   const generatePaymentHtml = (
//     orderId: string,
//     amount: number,
//     currency: string,
//     razorpayKeyId: string,
//     description: string,
//     type: 'subscription' | 'payg'
//   ) => {
//     return `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
//   <style>
//     * {
//       margin: 0;
//       padding: 0;
//       box-sizing: border-box;
//     }
//     body {
//       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//       background: #000;
//       color: #fff;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       min-height: 100vh;
//       padding: 20px;
//     }
//     .container {
//       text-align: center;
//       max-width: 400px;
//       width: 100%;
//     }
//     .loader {
//       border: 4px solid #333;
//       border-top: 4px solid #8b5cf6;
//       border-radius: 50%;
//       width: 50px;
//       height: 50px;
//       animation: spin 1s linear infinite;
//       margin: 0 auto 20px;
//     }
//     @keyframes spin {
//       0% { transform: rotate(0deg); }
//       100% { transform: rotate(360deg); }
//     }
//     h2 {
//       color: #8b5cf6;
//       margin-bottom: 10px;
//     }
//     .amount {
//       font-size: 32px;
//       font-weight: bold;
//       color: #fff;
//       margin: 20px 0;
//     }
//     .info {
//       color: #888;
//       font-size: 14px;
//       margin-bottom: 10px;
//     }
//     .error {
//       background: #ef4444;
//       color: white;
//       padding: 15px;
//       border-radius: 8px;
//       margin-top: 20px;
//       display: none;
//     }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="loader"></div>
//     <h2>${description}</h2>
//     <div class="amount">₹${(amount / 100).toLocaleString('en-IN')}</div>
//     <p class="info">Opening Razorpay checkout...</p>
//     <p class="info" style="font-size: 12px; margin-top: 20px;">Order ID: ${orderId}</p>
//     <div id="error" class="error"></div>
//   </div>
//   <script>
//     function showError(message) {
//       const errorDiv = document.getElementById('error');
//       errorDiv.textContent = message;
//       errorDiv.style.display = 'block';
      
//       window.ReactNativeWebView.postMessage(JSON.stringify({
//         type: 'ERROR',
//         message: message
//       }));
//     }

//     function openRazorpay() {
//       try {
//         const options = {
//           key: '${razorpayKeyId}',
//           amount: ${amount},
//           currency: '${currency}',
//           name: 'Your Company',
//           description: '${description}',
//           order_id: '${orderId}',
//           handler: function (response) {
//             window.ReactNativeWebView.postMessage(JSON.stringify({
//               type: 'SUCCESS',
//               orderId: response.razorpay_order_id,
//               paymentId: response.razorpay_payment_id,
//               signature: response.razorpay_signature,
//               paymentType: '${type}'
//             }));
//           },
//           modal: {
//             ondismiss: function() {
//               window.ReactNativeWebView.postMessage(JSON.stringify({
//                 type: 'CANCEL'
//               }));
//             }
//           },
//           theme: {
//             color: '#8b5cf6'
//           }
//         };

//         const rzp = new Razorpay(options);
        
//         rzp.on('payment.failed', function (response) {
//           showError('Payment failed: ' + response.error.description);
//         });

//         rzp.open();
//       } catch (error) {
//         showError('Failed to initialize payment: ' + error.message);
//       }
//     }

//     if (typeof Razorpay !== 'undefined') {
//       setTimeout(() => openRazorpay(), 500);
//     } else {
//       showError('Razorpay SDK failed to load. Please check your internet connection.');
//     }
//   </script>
// </body>
// </html>
//     `;
//   };

//   // Handle messages from WebView (native only)
//   const handleWebViewMessage = async (event: any) => {
//     try {
//       const data = JSON.parse(event.nativeEvent.data);
      
//       switch (data.type) {
//         case 'SUCCESS':
//           setShowWebView(false);
//           setIsProcessing(true);
          
//           try {
//             if (data.paymentType === 'subscription') {
//               await subscriptionAPI.verifySubscriptionPayment({
//                 razorpayOrderId: data.orderId,
//                 razorpayPaymentId: data.paymentId,
//                 razorpaySignature: data.signature,
//               });
//               Alert.alert('Success', 'Subscription activated successfully!');
//             } else {
//               const response = await subscriptionAPI.verifyPayAsYouGoPayment({
//                 razorpayOrderId: data.orderId,
//                 razorpayPaymentId: data.paymentId,
//                 razorpaySignature: data.signature,
//               });
//               Alert.alert(
//                 'Success',
//                 `${response.data.leadQuota - response.data.consumedLeads} leads added!`
//               );
//             }
//             router.back();
//           } catch (error: any) {
//             Alert.alert('Error', 'Payment verification failed. Order ID: ' + data.orderId);
//           } finally {
//             setIsProcessing(false);
//           }
//           break;
          
//         case 'CANCEL':
//           setShowWebView(false);
//           setIsProcessing(false);
//           Alert.alert('Cancelled', 'Payment was cancelled');
//           break;
          
//         case 'ERROR':
//           setShowWebView(false);
//           setIsProcessing(false);
//           Alert.alert('Error', data.message);
//           break;
//       }
//     } catch (error) {
//       console.error('Error handling WebView message:', error);
//     }
//   };

//   const handleSubscribe = async (tier: string) => {
//     if (tier === 'FREEMIUM') {
//       Alert.alert('Info', 'You are already on the Freemium plan');
//       return;
//     }

//     setSelectedTier(tier);
//     setIsProcessing(true);

//     try {
//       const orderResponse = await subscriptionAPI.createSubscriptionOrder(tier);
      
//       if (orderResponse.status === 'success') {
//         const { orderId, amount, currency, razorpayKeyId, planDetails } = orderResponse.data;
        
//         setCurrentOrderId(orderId);
//         setPaymentType('subscription');
        
//         if (Platform.OS === 'web') {
//           // Web: Open Razorpay directly
//           await openRazorpayWeb(
//             orderId,
//             amount,
//             currency,
//             razorpayKeyId,
//             `${planDetails.tier} Subscription`,
//             'subscription'
//           );
//         } else {
//           // Native: Use WebView
//           const html = generatePaymentHtml(
//             orderId,
//             amount,
//             currency,
//             razorpayKeyId,
//             `${planDetails.tier} Subscription`,
//             'subscription'
//           );
//           setPaymentHtml(html);
//           setShowWebView(true);
//           setIsProcessing(false);
//         }
//       }
//     } catch (error: any) {
//       Alert.alert('Error', error.message || 'Failed to create order');
//       setIsProcessing(false);
//       setSelectedTier(null);
//     }
//   };

//   const handlePayAsYouGo = async () => {
//     const count = parseInt(leadsCount);
//     if (isNaN(count) || count < 1) {
//       Alert.alert('Invalid Input', 'Please enter a valid number of leads');
//       return;
//     }

//     setIsProcessing(true);

//     try {
//       const orderResponse = await subscriptionAPI.createPayAsYouGoOrder(count);
      
//       if (orderResponse.status === 'success') {
//         const { orderId, amount, currency, razorpayKeyId, leadsCount: purchasedLeads } = orderResponse.data;
        
//         setCurrentOrderId(orderId);
//         setPaymentType('payg');
        
//         if (Platform.OS === 'web') {
//           // Web: Open Razorpay directly
//           await openRazorpayWeb(
//             orderId,
//             amount,
//             currency,
//             razorpayKeyId,
//             `Purchase ${purchasedLeads} Leads`,
//             'payg'
//           );
//         } else {
//           // Native: Use WebView
//           const html = generatePaymentHtml(
//             orderId,
//             amount,
//             currency,
//             razorpayKeyId,
//             `Purchase ${purchasedLeads} Leads`,
//             'payg'
//           );
//           setPaymentHtml(html);
//           setShowWebView(true);
//           setIsProcessing(false);
//         }
//       }
//     } catch (error: any) {
//       Alert.alert('Error', error.message || 'Failed to create order');
//       setIsProcessing(false);
//     }
//   };

//   const renderPlanCard = (tier: string, plan: SubscriptionPlan) => {
//     const isSelected = selectedTier === tier;
//     const isFree = tier === 'FREEMIUM';
    
//     return (
//       <View key={tier} style={[styles.planCard, isSelected && styles.planCardSelected]}>
//         <View style={styles.planHeader}>
//           <Text style={styles.planTier}>{tier}</Text>
//           {plan.hasVerifiedBadge && (
//             <Ionicons name="checkmark-circle" size={20} color="#10b981" />
//           )}
//         </View>
        
//         <Text style={styles.planPrice}>
//           {isFree ? 'Free' : formatPrice(plan.price)}
//           {!isFree && <Text style={styles.planPriceUnit}>/month</Text>}
//         </Text>

//         <View style={styles.planFeatures}>
//           <View style={styles.featureRow}>
//             <Ionicons name="business-outline" size={16} color="#8b5cf6" />
//             <Text style={styles.featureText}>{plan.leadQuota} Leads</Text>
//           </View>
//           <View style={styles.featureRow}>
//             <Ionicons name="create-outline" size={16} color="#8b5cf6" />
//             <Text style={styles.featureText}>{plan.postingQuota} Posts</Text>
//           </View>
//           {plan.hasVerifiedBadge && (
//             <View style={styles.featureRow}>
//               <Ionicons name="shield-checkmark-outline" size={16} color="#10b981" />
//               <Text style={styles.featureText}>Verified Badge</Text>
//             </View>
//           )}
//           {plan.hasVerifiedLeadAccess && (
//             <View style={styles.featureRow}>
//               <Ionicons name="star-outline" size={16} color="#f59e0b" />
//               <Text style={styles.featureText}>Verified Lead Access</Text>
//             </View>
//           )}
//         </View>

//         <TouchableOpacity
//           style={[
//             styles.subscribeButton,
//             isFree && styles.subscribeButtonDisabled,
//             isProcessing && isSelected && styles.subscribeButtonProcessing,
//           ]}
//           onPress={() => handleSubscribe(tier)}
//           disabled={isFree || isProcessing}
//         >
//           {isProcessing && isSelected ? (
//             <ActivityIndicator color="#fff" size="small" />
//           ) : (
//             <Text style={styles.subscribeButtonText}>
//               {isFree ? 'Current Plan' : 'Subscribe'}
//             </Text>
//           )}
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#8b5cf6" />
//         <Text style={styles.loadingText}>Loading plans...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Grow your business</Text>
//       </View>

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.plansContainer}>
//           {Object.entries(plans).map(([tier, plan]) => renderPlanCard(tier, plan))}
//         </View>

//         <View style={styles.payAsYouGoSection}>
//           <TouchableOpacity
//             style={styles.payAsYouGoHeader}
//             onPress={() => setShowPayAsYouGo(!showPayAsYouGo)}
//           >
//             <View style={styles.payAsYouGoTitleRow}>
//               <Ionicons name="flash-outline" size={24} color="#f59e0b" />
//               <Text style={styles.payAsYouGoTitle}>Pay as You Go</Text>
//             </View>
//             <Ionicons
//               name={showPayAsYouGo ? 'chevron-up' : 'chevron-down'}
//               size={24}
//               color="#888"
//             />
//           </TouchableOpacity>

//           {showPayAsYouGo && (
//             <View style={styles.payAsYouGoContent}>
//               <Text style={styles.payAsYouGoDesc}>
//                 Buy leads as needed at ₹49 per lead
//               </Text>
              
//               <View style={styles.inputContainer}>
//                 <Text style={styles.inputLabel}>Number of leads</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={leadsCount}
//                   onChangeText={setLeadsCount}
//                   keyboardType="number-pad"
//                   placeholder="10"
//                   placeholderTextColor="#555"
//                 />
//                 <Text style={styles.inputHelp}>
//                   Total: ₹{(parseInt(leadsCount) || 0) * 49}
//                 </Text>
//               </View>

//               <TouchableOpacity
//                 style={[styles.payAsYouGoButton, isProcessing && styles.payAsYouGoButtonDisabled]}
//                 onPress={handlePayAsYouGo}
//                 disabled={isProcessing}
//               >
//                 {isProcessing ? (
//                   <ActivityIndicator color="#fff" size="small" />
//                 ) : (
//                   <>
//                     <Ionicons name="card-outline" size={20} color="#fff" />
//                     <Text style={styles.payAsYouGoButtonText}>Buy Now</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       </ScrollView>

//       {/* Payment WebView Modal (Native only) */}
//       {Platform.OS !== 'web' && WebView && (
//         <Modal
//           visible={showWebView}
//           animationType="slide"
//           onRequestClose={() => {
//             setShowWebView(false);
//             setIsProcessing(false);
//           }}
//         >
//           <SafeAreaView style={styles.webViewContainer}>
//             <View style={styles.webViewHeader}>
//               <Text style={styles.webViewTitle}>Complete Payment</Text>
//               <TouchableOpacity
//                 onPress={() => {
//                   setShowWebView(false);
//                   setIsProcessing(false);
//                 }}
//                 style={styles.closeButton}
//               >
//                 <Ionicons name="close" size={24} color="#fff" />
//               </TouchableOpacity>
//             </View>
//             <WebView
//               ref={webViewRef}
//               source={{ html: paymentHtml }}
//               onMessage={handleWebViewMessage}
//               javaScriptEnabled={true}
//               domStorageEnabled={true}
//               startInLoadingState={true}
//               renderLoading={() => (
//                 <View style={styles.webViewLoading}>
//                   <ActivityIndicator size="large" color="#8b5cf6" />
//                 </View>
//               )}
//             />
//           </SafeAreaView>
//         </Modal>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#888',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: sizeScale(16),
//     paddingVertical: sizeScale(16),
//     borderBottomWidth: 0.5,
//     borderBottomColor: '#333',
//   },
//   backButton: {
//     marginRight: sizeScale(12),
//     padding: sizeScale(4),
//   },
//   headerTitle: {
//     fontSize: sizeScale(24),
//     fontWeight: '700',
//     color: '#fff',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: sizeScale(16),
//   },
//   plansContainer: {
//     gap: sizeScale(16),
//   },
//   planCard: {
//     backgroundColor: '#111',
//     borderRadius: sizeScale(16),
//     padding: sizeScale(20),
//     borderWidth: 2,
//     borderColor: '#222',
//   },
//   planCardSelected: {
//     borderColor: '#8b5cf6',
//   },
//   planHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: sizeScale(12),
//   },
//   planTier: {
//     fontSize: sizeScale(18),
//     fontWeight: '700',
//     color: '#fff',
//     textTransform: 'uppercase',
//   },
//   planPrice: {
//     fontSize: sizeScale(32),
//     fontWeight: '800',
//     color: '#8b5cf6',
//     marginBottom: sizeScale(20),
//   },
//   planPriceUnit: {
//     fontSize: sizeScale(16),
//     color: '#888',
//   },
//   planFeatures: {
//     gap: sizeScale(12),
//     marginBottom: sizeScale(20),
//   },
//   featureRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: sizeScale(8),
//   },
//   featureText: {
//     fontSize: sizeScale(14),
//     color: '#ccc',
//   },
//   subscribeButton: {
//     backgroundColor: '#8b5cf6',
//     paddingVertical: sizeScale(14),
//     borderRadius: sizeScale(12),
//     alignItems: 'center',
//   },
//   subscribeButtonDisabled: {
//     backgroundColor: '#333',
//   },
//   subscribeButtonProcessing: {
//     backgroundColor: '#7c3aed',
//   },
//   subscribeButtonText: {
//     fontSize: sizeScale(16),
//     fontWeight: '600',
//     color: '#fff',
//   },
//   payAsYouGoSection: {
//     marginTop: sizeScale(24),
//     backgroundColor: '#111',
//     borderRadius: sizeScale(16),
//     borderWidth: 2,
//     borderColor: '#f59e0b',
//     overflow: 'hidden',
//   },
//   payAsYouGoHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: sizeScale(20),
//   },
//   payAsYouGoTitleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: sizeScale(8),
//   },
//   payAsYouGoTitle: {
//     fontSize: sizeScale(18),
//     fontWeight: '700',
//     color: '#fff',
//   },
//   payAsYouGoContent: {
//     padding: sizeScale(20),
//     paddingTop: 0,
//   },
//   payAsYouGoDesc: {
//     fontSize: sizeScale(14),
//     color: '#888',
//     marginBottom: sizeScale(20),
//   },
//   inputContainer: {
//     marginBottom: sizeScale(20),
//   },
//   inputLabel: {
//     fontSize: sizeScale(14),
//     color: '#ccc',
//     marginBottom: sizeScale(8),
//   },
//   input: {
//     backgroundColor: '#1a1a1a',
//     borderWidth: 1,
//     borderColor: '#333',
//     borderRadius: sizeScale(12),
//     paddingHorizontal: sizeScale(16),
//     paddingVertical: sizeScale(14),
//     fontSize: sizeScale(16),
//     color: '#fff',
//   },
//   inputHelp: {
//     fontSize: sizeScale(12),
//     color: '#f59e0b',
//     marginTop: sizeScale(6),
//   },
//   payAsYouGoButton: {
//     backgroundColor: '#f59e0b',
//     paddingVertical: sizeScale(14),
//     borderRadius: sizeScale(12),
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: sizeScale(8),
//   },
//   payAsYouGoButtonDisabled: {
//     backgroundColor: '#92400e',
//   },
//   payAsYouGoButtonText: {
//     fontSize: sizeScale(16),
//     fontWeight: '600',
//     color: '#fff',
//   },
//   webViewContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   webViewHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#333',
//   },
//   webViewTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#fff',
//   },
//   closeButton: {
//     padding: 8,
//   },
//   webViewLoading: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#000',
//   },
// });

// app/(app)/lead/subscription.tsx
// Cross-platform solution: WebView for native, inline script for web

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { subscriptionAPI, SubscriptionPlan, CurrentSubscription } from '../../../services/leads';
import { Ionicons } from '@expo/vector-icons';

// Conditional import for WebView (only on native)
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 390;
const sizeScale = (size: number) => (SCREEN_WIDTH / STANDARD_WIDTH) * size;

// Declare Razorpay type for web
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionScreen() {
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // WebView state (for native)
  const [showWebView, setShowWebView] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [paymentType, setPaymentType] = useState<'subscription' | 'payg'>('subscription');
  
  // Pay-as-you-go state
  const [showPayAsYouGo, setShowPayAsYouGo] = useState(false);
  const [leadsCount, setLeadsCount] = useState('10');

  const webViewRef = useRef<any>(null);
  const razorpayScriptLoaded = useRef(false);

  useEffect(() => {
    fetchData();
    
    // Load Razorpay script for web platform
    if (Platform.OS === 'web' && !razorpayScriptLoaded.current) {
      loadRazorpayScript();
    }
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        razorpayScriptLoaded.current = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        razorpayScriptLoaded.current = true;
        resolve(true);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay SDK'));
      };
      document.body.appendChild(script);
    });
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [plansResponse, subscriptionResponse] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getCurrentSubscription(),
      ]);
      
      if (plansResponse.status === 'success') {
        setPlans(plansResponse.data);
      }
      
      if (subscriptionResponse.status === 'success') {
        setCurrentSubscription(subscriptionResponse.data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${(price / 100).toLocaleString('en-IN')}`;
  };

  const formatExpiryDate = (endDate: string | null) => {
    if (!endDate) {
      return { text: 'Unlimited', isUnlimited: true };
    }
    
    const expiry = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { text: 'Expired', isUnlimited: false };
    } else if (daysLeft === 0) {
      return { text: 'Expires today', isUnlimited: false };
    } else if (daysLeft === 1) {
      return { text: 'Expires tomorrow', isUnlimited: false };
    } else if (daysLeft <= 7) {
      return { text: `${daysLeft} days left`, isUnlimited: false };
    } else {
      return { text: expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), isUnlimited: false };
    }
  };

  // Web-specific: Open Razorpay directly
  const openRazorpayWeb = async (
    orderId: string,
    amount: number,
    currency: string,
    razorpayKeyId: string,
    description: string,
    type: 'subscription' | 'payg'
  ) => {
    try {
      await loadRazorpayScript();
      
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        name: 'Your Company',
        description: description,
        order_id: orderId,
        handler: async function (response: any) {
          setIsProcessing(true);
          try {
            if (type === 'subscription') {
              await subscriptionAPI.verifySubscriptionPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              Alert.alert('Success', 'Subscription activated successfully!');
            } else {
              const verifyResponse = await subscriptionAPI.verifyPayAsYouGoPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              Alert.alert(
                'Success',
                `${verifyResponse.data.leadQuota - verifyResponse.data.consumedLeads} leads added!`
              );
            }
            router.back();
          } catch (error: any) {
            Alert.alert('Error', 'Payment verification failed: ' + error.message);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            Alert.alert('Cancelled', 'Payment was cancelled');
          }
        },
        theme: {
          color: '#8b5cf6'
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        setIsProcessing(false);
        Alert.alert('Payment Failed', response.error.description);
      });

      rzp.open();
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to initialize payment: ' + error.message);
    }
  };

  // Native-specific: Generate HTML for WebView
  const generatePaymentHtml = (
    orderId: string,
    amount: number,
    currency: string,
    razorpayKeyId: string,
    description: string,
    type: 'subscription' | 'payg'
  ) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    .loader {
      border: 4px solid #333;
      border-top: 4px solid #8b5cf6;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h2 {
      color: #8b5cf6;
      margin-bottom: 10px;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #fff;
      margin: 20px 0;
    }
    .info {
      color: #888;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .error {
      background: #ef4444;
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="loader"></div>
    <h2>${description}</h2>
    <div class="amount">₹${(amount / 100).toLocaleString('en-IN')}</div>
    <p class="info">Opening Razorpay checkout...</p>
    <p class="info" style="font-size: 12px; margin-top: 20px;">Order ID: ${orderId}</p>
    <div id="error" class="error"></div>
  </div>
  <script>
    function showError(message) {
      const errorDiv = document.getElementById('error');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'ERROR',
        message: message
      }));
    }

    function openRazorpay() {
      try {
        const options = {
          key: '${razorpayKeyId}',
          amount: ${amount},
          currency: '${currency}',
          name: 'Your Company',
          description: '${description}',
          order_id: '${orderId}',
          handler: function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SUCCESS',
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              paymentType: '${type}'
            }));
          },
          modal: {
            ondismiss: function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CANCEL'
              }));
            }
          },
          theme: {
            color: '#8b5cf6'
          }
        };

        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function (response) {
          showError('Payment failed: ' + response.error.description);
        });

        rzp.open();
      } catch (error) {
        showError('Failed to initialize payment: ' + error.message);
      }
    }

    if (typeof Razorpay !== 'undefined') {
      setTimeout(() => openRazorpay(), 500);
    } else {
      showError('Razorpay SDK failed to load. Please check your internet connection.');
    }
  </script>
</body>
</html>
    `;
  };

  // Handle messages from WebView (native only)
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'SUCCESS':
          setShowWebView(false);
          setIsProcessing(true);
          
          try {
            if (data.paymentType === 'subscription') {
              await subscriptionAPI.verifySubscriptionPayment({
                razorpayOrderId: data.orderId,
                razorpayPaymentId: data.paymentId,
                razorpaySignature: data.signature,
              });
              Alert.alert('Success', 'Subscription activated successfully!');
            } else {
              const response = await subscriptionAPI.verifyPayAsYouGoPayment({
                razorpayOrderId: data.orderId,
                razorpayPaymentId: data.paymentId,
                razorpaySignature: data.signature,
              });
              Alert.alert(
                'Success',
                `${response.data.leadQuota - response.data.consumedLeads} leads added!`
              );
            }
            router.back();
          } catch (error: any) {
            Alert.alert('Error', 'Payment verification failed. Order ID: ' + data.orderId);
          } finally {
            setIsProcessing(false);
          }
          break;
          
        case 'CANCEL':
          setShowWebView(false);
          setIsProcessing(false);
          Alert.alert('Cancelled', 'Payment was cancelled');
          break;
          
        case 'ERROR':
          setShowWebView(false);
          setIsProcessing(false);
          Alert.alert('Error', data.message);
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleSubscribe = async (tier: string) => {
    if (tier === currentSubscription?.tier) {
      Alert.alert('Info', `You are already on the ${tier} plan`);
      return;
    }

    setSelectedTier(tier);
    setIsProcessing(true);

    try {
      const orderResponse = await subscriptionAPI.createSubscriptionOrder(tier);
      
      if (orderResponse.status === 'success') {
        const { orderId, amount, currency, razorpayKeyId, planDetails } = orderResponse.data;
        
        setCurrentOrderId(orderId);
        setPaymentType('subscription');
        
        if (Platform.OS === 'web') {
          await openRazorpayWeb(
            orderId,
            amount,
            currency,
            razorpayKeyId,
            `${planDetails.tier} Subscription`,
            'subscription'
          );
        } else {
          const html = generatePaymentHtml(
            orderId,
            amount,
            currency,
            razorpayKeyId,
            `${planDetails.tier} Subscription`,
            'subscription'
          );
          setPaymentHtml(html);
          setShowWebView(true);
          setIsProcessing(false);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create order');
      setIsProcessing(false);
      setSelectedTier(null);
    }
  };

  const handlePayAsYouGo = async () => {
    const count = parseInt(leadsCount);
    if (isNaN(count) || count < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid number of leads');
      return;
    }

    setIsProcessing(true);

    try {
      const orderResponse = await subscriptionAPI.createPayAsYouGoOrder(count);
      
      if (orderResponse.status === 'success') {
        const { orderId, amount, currency, razorpayKeyId, leadsCount: purchasedLeads } = orderResponse.data;
        
        setCurrentOrderId(orderId);
        setPaymentType('payg');
        
        if (Platform.OS === 'web') {
          await openRazorpayWeb(
            orderId,
            amount,
            currency,
            razorpayKeyId,
            `Purchase ${purchasedLeads} Leads`,
            'payg'
          );
        } else {
          const html = generatePaymentHtml(
            orderId,
            amount,
            currency,
            razorpayKeyId,
            `Purchase ${purchasedLeads} Leads`,
            'payg'
          );
          setPaymentHtml(html);
          setShowWebView(true);
          setIsProcessing(false);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create order');
      setIsProcessing(false);
    }
  };

  const renderPlanCard = (tier: string, plan: SubscriptionPlan) => {
    const isCurrentPlan = currentSubscription?.tier === tier;
    const isSelected = selectedTier === tier;
    
    return (
      <View key={tier} style={[
        styles.planCard,
        isSelected && styles.planCardSelected,
        isCurrentPlan && styles.planCardCurrent
      ]}>
        {isCurrentPlan && (
          <View style={styles.currentPlanBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.currentPlanText}>Current Plan</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={styles.planTier}>{tier}</Text>
          {plan.hasVerifiedBadge && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            </View>
          )}
        </View>
        
        <Text style={styles.planPrice}>
          {tier === 'FREEMIUM' ? 'Free' : formatPrice(plan.price)}
          {tier !== 'FREEMIUM' && <Text style={styles.planPriceUnit}>/month</Text>}
        </Text>

        <View style={styles.planFeatures}>
          <View style={styles.featureRow}>
            <Ionicons name="business" size={18} color="#8b5cf6" />
            <Text style={styles.featureText}>{plan.leadQuota} Leads</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="create" size={18} color="#8b5cf6" />
            <Text style={styles.featureText}>{plan.postingQuota} Posts</Text>
          </View>
          {plan.hasVerifiedBadge && (
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark" size={18} color="#10b981" />
              <Text style={styles.featureText}>Verified Badge</Text>
            </View>
          )}
          {plan.hasVerifiedLeadAccess && (
            <View style={styles.featureRow}>
              <Ionicons name="star" size={18} color="#f59e0b" />
              <Text style={styles.featureText}>Verified Lead Access</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            isCurrentPlan && styles.subscribeButtonDisabled,
            isProcessing && isSelected && styles.subscribeButtonProcessing,
          ]}
          onPress={() => handleSubscribe(tier)}
          disabled={isCurrentPlan || isProcessing}
        >
          {isProcessing && isSelected ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.subscribeButtonText}>
              {isCurrentPlan ? 'Active' : 'Subscribe'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  const expiryInfo = formatExpiryDate(currentSubscription?.endDate || null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Subscription Info */}
        {currentSubscription && (
          <View style={styles.currentSubContainer}>
            <View style={styles.currentSubHeader}>
              <View style={styles.currentSubTitleRow}>
                <Ionicons name="information-circle" size={24} color="#8b5cf6" />
                <Text style={styles.currentSubTitle}>Your Subscription</Text>
              </View>
            </View>
            
            <View style={styles.currentSubDetails}>
              <View style={styles.currentSubRow}>
                <Text style={styles.currentSubLabel}>Plan</Text>
                <Text style={styles.currentSubValue}>{currentSubscription.tier}</Text>
              </View>
              
              <View style={styles.currentSubRow}>
                <Text style={styles.currentSubLabel}>Available Leads</Text>
                <Text style={styles.currentSubValue}>
                  {currentSubscription.leadQuota - currentSubscription.consumedLeads} / {currentSubscription.leadQuota}
                </Text>
              </View>
              
              <View style={styles.currentSubRow}>
                <Text style={styles.currentSubLabel}>Posts Used</Text>
                <Text style={styles.currentSubValue}>
                  {currentSubscription.postedLeads} / {currentSubscription.postingQuota}
                </Text>
              </View>
              
              <View style={styles.currentSubRow}>
                <Text style={styles.currentSubLabel}>Valid Until</Text>
                <View style={styles.expiryContainer}>
                  {expiryInfo.isUnlimited ? (
                    <>
                      <Ionicons name="infinite" size={20} color="#10b981" />
                      <Text style={[styles.currentSubValue, styles.unlimitedText]}>
                        {expiryInfo.text}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="calendar" size={18} color="#f59e0b" />
                      <Text style={[styles.currentSubValue, styles.expiryText]}>
                        {expiryInfo.text}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Available Plans */}
        <View style={styles.plansContainer}>
          {Object.entries(plans).map(([tier, plan]) => renderPlanCard(tier, plan))}
        </View>

        {/* Pay as You Go */}
        <View style={styles.payAsYouGoSection}>
          <TouchableOpacity
            style={styles.payAsYouGoHeader}
            onPress={() => setShowPayAsYouGo(!showPayAsYouGo)}
          >
            <View style={styles.payAsYouGoTitleRow}>
              <Ionicons name="flash" size={24} color="#f59e0b" />
              <Text style={styles.payAsYouGoTitle}>Pay as You Go</Text>
            </View>
            <Ionicons
              name={showPayAsYouGo ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#888"
            />
          </TouchableOpacity>

          {showPayAsYouGo && (
            <View style={styles.payAsYouGoContent}>
              <Text style={styles.payAsYouGoDesc}>
                Buy leads as needed at ₹49 per lead
              </Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Number of leads</Text>
                <TextInput
                  style={styles.input}
                  value={leadsCount}
                  onChangeText={setLeadsCount}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor="#555"
                />
                <Text style={styles.inputHelp}>
                  Total: ₹{(parseInt(leadsCount) || 0) * 49}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.payAsYouGoButton, isProcessing && styles.payAsYouGoButtonDisabled]}
                onPress={handlePayAsYouGo}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="card" size={20} color="#fff" />
                    <Text style={styles.payAsYouGoButtonText}>Buy Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment WebView Modal (Native only) */}
      {Platform.OS !== 'web' && WebView && (
        <Modal
          visible={showWebView}
          animationType="slide"
          onRequestClose={() => {
            setShowWebView(false);
            setIsProcessing(false);
          }}
        >
          <SafeAreaView style={styles.webViewContainer}>
            <View style={styles.webViewHeader}>
              <Text style={styles.webViewTitle}>Complete Payment</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowWebView(false);
                  setIsProcessing(false);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <WebView
              ref={webViewRef}
              source={{ html: paymentHtml }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizeScale(20),
    paddingVertical: sizeScale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: sizeScale(12),
    padding: sizeScale(4),
  },
  headerTitle: {
    fontSize: sizeScale(24),
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: sizeScale(20),
    paddingBottom: sizeScale(120),
  },
  currentSubContainer: {
    backgroundColor: '#111',
    borderRadius: sizeScale(16),
    marginBottom: sizeScale(24),
    borderWidth: 1,
    borderColor: '#8b5cf6',
    overflow: 'hidden',
  },
  currentSubHeader: {
    padding: sizeScale(20),
    paddingBottom: sizeScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  currentSubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(10),
  },
  currentSubTitle: {
    fontSize: sizeScale(18),
    fontWeight: '700',
    color: '#fff',
  },
  currentSubDetails: {
    padding: sizeScale(20),
    gap: sizeScale(16),
  },
  currentSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentSubLabel: {
    fontSize: sizeScale(14),
    color: '#888',
  },
  currentSubValue: {
    fontSize: sizeScale(15),
    fontWeight: '600',
    color: '#fff',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
  },
  unlimitedText: {
    color: '#10b981',
  },
  expiryText: {
    color: '#f59e0b',
  },
  plansContainer: {
    gap: sizeScale(16),
    marginBottom: sizeScale(24),
  },
  planCard: {
    backgroundColor: '#111',
    borderRadius: sizeScale(16),
    padding: sizeScale(24),
    borderWidth: 2,
    borderColor: '#222',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#8b5cf6',
  },
  planCardCurrent: {
    borderColor: '#10b981',
    backgroundColor: '#0d1f17',
  },
  currentPlanBadge: {
    position: 'absolute',
    top: sizeScale(12),
    right: sizeScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(6),
    backgroundColor: '#065f46',
    paddingHorizontal: sizeScale(10),
    paddingVertical: sizeScale(6),
    borderRadius: sizeScale(12),
  },
  currentPlanText: {
    fontSize: sizeScale(12),
    fontWeight: '600',
    color: '#10b981',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizeScale(16),
  },
  planTier: {
    fontSize: sizeScale(20),
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    backgroundColor: '#065f46',
    padding: sizeScale(6),
    borderRadius: sizeScale(20),
  },
  planPrice: {
    fontSize: sizeScale(36),
    fontWeight: '800',
    color: '#8b5cf6',
    marginBottom: sizeScale(24),
  },
  planPriceUnit: {
    fontSize: sizeScale(16),
    color: '#888',
    fontWeight: '500',
  },
  planFeatures: {
    gap: sizeScale(14),
    marginBottom: sizeScale(24),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(10),
  },
  featureText: {
    fontSize: sizeScale(15),
    color: '#ccc',
    fontWeight: '500',
  },
  subscribeButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: sizeScale(16),
    borderRadius: sizeScale(12),
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    backgroundColor: '#333',
  },
  subscribeButtonProcessing: {
    backgroundColor: '#7c3aed',
  },
  subscribeButtonText: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  payAsYouGoSection: {
    backgroundColor: '#111',
    borderRadius: sizeScale(16),
    borderWidth: 2,
    borderColor: '#f59e0b',
    overflow: 'hidden',
  },
  payAsYouGoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: sizeScale(20),
  },
  payAsYouGoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeScale(10),
  },
  payAsYouGoTitle: {
    fontSize: sizeScale(18),
    fontWeight: '700',
    color: '#fff',
  },
  payAsYouGoContent: {
    padding: sizeScale(20),
    paddingTop: 0,
  },
  payAsYouGoDesc: {
    fontSize: sizeScale(14),
    color: '#888',
    marginBottom: sizeScale(20),
  },
  inputContainer: {
    marginBottom: sizeScale(20),
  },
  inputLabel: {
    fontSize: sizeScale(14),
    color: '#ccc',
    marginBottom: sizeScale(10),
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: sizeScale(12),
    paddingHorizontal: sizeScale(16),
    paddingVertical: sizeScale(16),
    fontSize: sizeScale(16),
    color: '#fff',
  },
  inputHelp: {
    fontSize: sizeScale(13),
    color: '#f59e0b',
    marginTop: sizeScale(8),
    fontWeight: '600',
  },
  payAsYouGoButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: sizeScale(16),
    borderRadius: sizeScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeScale(8),
  },
  payAsYouGoButtonDisabled: {
    backgroundColor: '#92400e',
  },
  payAsYouGoButtonText: {
    fontSize: sizeScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});