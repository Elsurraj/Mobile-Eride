import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ridesService, Ride } from '@/services/ridesService';
import { walletService } from '@/services/walletService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  serviceFee: number;
  discount: number;
  total: number;
  formattedTotal: string;
}

export default function RideCompletionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [fareBreakdown, setFareBreakdown] = useState<FareBreakdown | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  
  const { user, isBackendHealthy } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadRideDetails();
      loadWalletBalance();
    }
  }, [id]);

  const loadRideDetails = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const result = await ridesService.getRideDetails(id);
      if (result.success && result.data) {
        setRide(result.data);
        calculateFareBreakdown(result.data);
        console.log('✅ Loaded ride completion details:', result.data.id);
      } else {
        Alert.alert('Error', 'Failed to load ride details');
        router.back();
      }
    } catch (error) {
      console.error('❌ Error loading ride details:', error);
      Alert.alert('Error', 'Failed to load ride details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const result = await walletService.getBalance();
      if (result.success && result.data) {
        setWalletBalance(result.data.balance);
      } else {
        // Mock wallet balance if service is unavailable
        setWalletBalance(5000); // ₦5,000 mock balance
      }
    } catch (error) {
      console.warn('⚠️ Could not load wallet balance, using mock data');
      setWalletBalance(5000); // ₦5,000 mock balance
    }
  };

  const calculateFareBreakdown = (rideData: Ride) => {
    // Mock fare calculation based on ride type and distance
    const distance = rideData.distance || 5; // Default 5km if not available
    const duration = rideData.duration || 15; // Default 15min if not available

    let baseFare = 200; // Base fare in Naira
    let perKmRate = 80; // Per km rate
    let perMinRate = 10; // Per minute rate

    // Adjust rates based on ride type
    switch (rideData.type) {
      case 'delivery':
        baseFare = 150;
        perKmRate = 60;
        perMinRate = 8;
        break;
      // Premium rates would be higher
      default: // standard
        break;
    }

    const distanceFare = distance * perKmRate;
    const timeFare = duration * perMinRate;
    const serviceFee = Math.round((baseFare + distanceFare + timeFare) * 0.1); // 10% service fee
    const discount = 0; // No discount for now
    
    const total = baseFare + distanceFare + timeFare + serviceFee - discount;

    const breakdown: FareBreakdown = {
      baseFare,
      distanceFare,
      timeFare,
      serviceFee,
      discount,
      total,
      formattedTotal: `₦${total.toFixed(2)}`
    };

    setFareBreakdown(breakdown);
  };

  const handlePaymentConfirm = async () => {
    if (!ride || !fareBreakdown) return;

    if (walletBalance < fareBreakdown.total) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance (₦${walletBalance.toFixed(2)}) is insufficient to pay for this ride (${fareBreakdown.formattedTotal}). Please top up your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Top Up Wallet', 
            onPress: () => router.push('/(dashboard)/wallet') 
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay ${fareBreakdown.formattedTotal} for this ride?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Payment', 
          onPress: () => processPayment() 
        }
      ]
    );
  };

  const processPayment = async () => {
    if (!ride || !fareBreakdown) return;

    setIsProcessingPayment(true);
    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

      // Simulate wallet deduction
      const newBalance = walletBalance - fareBreakdown.total;
      setWalletBalance(newBalance);

      // Create transaction record (this would be done by the backend in real implementation)
      console.log('💳 Payment processed:', {
        rideId: ride.id,
        amount: fareBreakdown.total,
        newBalance: newBalance
      });

      // Simulate post-ride cleanup (reset driver status, etc.)
      await handlePostRideCleanup(ride.id);

      setPaymentCompleted(true);
      
      Alert.alert(
        'Payment Successful!',
        `Your payment of ${fareBreakdown.formattedTotal} has been processed successfully. Thank you for choosing E-Ride!`,
        [
          { 
            text: 'View Receipt', 
            onPress: () => {
              // Could navigate to receipt screen in the future
              router.replace('/(dashboard)');
            }
          },
          { 
            text: 'Back to Dashboard', 
            onPress: () => {
              // Navigate back to dashboard after payment
              router.replace('/(dashboard)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      Alert.alert('Payment Failed', 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRateRide = () => {
    // Navigate to rating screen (can be implemented later)
    Alert.alert('Rate Your Ride', 'Rating feature coming soon!');
  };

  const handlePostRideCleanup = async (rideId: string) => {
    try {
      // Complete the ride in the system
      await ridesService.completeRide(rideId);
      
      // Reset driver status to available (this would typically be done by the driver or automatically)
      // In a real implementation, the driver ID would be available from the ride data
      const mockDriverId = 'driver_001'; // In reality, this would come from the ride data
      await ridesService.resetDriverStatus(mockDriverId);
      
      console.log('✅ Post-ride cleanup completed:', {
        rideId,
        driverStatus: 'reset_to_available',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error during post-ride cleanup:', error);
      // Don't block the payment flow if cleanup fails
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#1a1a1a', '#2d1d0c']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.brand.secondary} />
            <Text style={styles.loadingText}>Loading ride details...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <LinearGradient
        colors={['#1a1a1a', '#2d1d0c']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Success Header */}
              <View style={styles.successHeader}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Ride Completed!</Text>
                <Text style={styles.successSubtitle}>
                  Thank you for choosing E-Ride. We hope you had a great experience.
                </Text>
              </View>

              {/* Trip Summary */}
              {ride && (
                <View style={styles.tripSummary}>
                  <Text style={styles.sectionTitle}>Trip Summary</Text>
                  <View style={styles.tripRoute}>
                    {/* Pickup */}
                    <View style={styles.routePoint}>
                      <View style={[styles.routeDot, styles.pickupDot]} />
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel}>Pickup</Text>
                        <Text style={styles.routeAddress}>{ride.from.address}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.routeLine} />
                    
                    {/* Dropoff */}
                    <View style={styles.routePoint}>
                      <View style={[styles.routeDot, styles.dropoffDot]} />
                      <View style={styles.routeInfo}>
                        <Text style={styles.routeLabel}>Dropoff</Text>
                        <Text style={styles.routeAddress}>{ride.to.address}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Trip Stats */}
                  <View style={styles.tripStats}>
                    {ride.distance && (
                      <View style={styles.statItem}>
                        <Ionicons name="location" size={16} color="#6B7280" />
                        <Text style={styles.statLabel}>Distance</Text>
                        <Text style={styles.statValue}>{ride.distance} km</Text>
                      </View>
                    )}
                    {ride.duration && (
                      <View style={styles.statItem}>
                        <Ionicons name="time" size={16} color="#6B7280" />
                        <Text style={styles.statLabel}>Duration</Text>
                        <Text style={styles.statValue}>{ride.duration} min</Text>
                      </View>
                    )}
                    <View style={styles.statItem}>
                      <Ionicons name="car" size={16} color="#6B7280" />
                      <Text style={styles.statLabel}>Type</Text>
                      <Text style={styles.statValue}>{ride.type}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Fare Breakdown */}
              {fareBreakdown && (
                <View style={styles.fareCard}>
                  <Text style={styles.sectionTitle}>Fare Breakdown</Text>
                  <View style={styles.fareItems}>
                    <View style={styles.fareItem}>
                      <Text style={styles.fareLabel}>Base Fare</Text>
                      <Text style={styles.fareValue}>₦{fareBreakdown.baseFare.toFixed(2)}</Text>
                    </View>
                    <View style={styles.fareItem}>
                      <Text style={styles.fareLabel}>Distance ({ride?.distance || 5} km)</Text>
                      <Text style={styles.fareValue}>₦{fareBreakdown.distanceFare.toFixed(2)}</Text>
                    </View>
                    <View style={styles.fareItem}>
                      <Text style={styles.fareLabel}>Time ({ride?.duration || 15} min)</Text>
                      <Text style={styles.fareValue}>₦{fareBreakdown.timeFare.toFixed(2)}</Text>
                    </View>
                    <View style={styles.fareItem}>
                      <Text style={styles.fareLabel}>Service Fee</Text>
                      <Text style={styles.fareValue}>₦{fareBreakdown.serviceFee.toFixed(2)}</Text>
                    </View>
                    {fareBreakdown.discount > 0 && (
                      <View style={styles.fareItem}>
                        <Text style={styles.fareLabel}>Discount</Text>
                        <Text style={[styles.fareValue, { color: '#10B981' }]}>-₦{fareBreakdown.discount.toFixed(2)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.fareSeparator} />
                  <View style={styles.fareTotal}>
                    <Text style={styles.fareTotalLabel}>Total</Text>
                    <Text style={styles.fareTotalValue}>{fareBreakdown.formattedTotal}</Text>
                  </View>
                </View>
              )}

              {/* Wallet Balance */}
              <View style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <Ionicons name="wallet" size={24} color={Colors.light.brand.secondary} />
                  <Text style={styles.walletTitle}>Wallet Balance</Text>
                </View>
                <Text style={styles.walletBalance}>₦{walletBalance.toFixed(2)}</Text>
                {fareBreakdown && walletBalance < fareBreakdown.total && (
                  <Text style={styles.insufficientBalance}>Insufficient balance for this ride</Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {!paymentCompleted ? (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.payButton,
                        (isProcessingPayment || (fareBreakdown && walletBalance < fareBreakdown.total)) && styles.buttonDisabled
                      ]}
                      onPress={handlePaymentConfirm}
                      disabled={isProcessingPayment || (fareBreakdown && walletBalance < fareBreakdown.total)}
                    >
                      {isProcessingPayment ? (
                        <>
                          <ActivityIndicator size="small" color={Colors.light.brand.primary} />
                          <Text style={styles.payButtonText}>Processing...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.payButtonText}>
                            Confirm Payment {fareBreakdown ? fareBreakdown.formattedTotal : ''}
                          </Text>
                          <Ionicons name="card" size={20} color={Colors.light.brand.primary} />
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => Alert.alert('Dispute', 'Dispute handling coming soon!')}
                    >
                      <Text style={styles.cancelButtonText}>Dispute Fare</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.rateButton} onPress={handleRateRide}>
                      <Ionicons name="star" size={20} color={Colors.light.brand.primary} />
                      <Text style={styles.rateButtonText}>Rate Your Ride</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.doneButton}
                      onPress={() => router.replace('/(dashboard)')}
                    >
                      <Text style={styles.doneButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {!isBackendHealthy && (
                <Text style={styles.demoText}>
                  🔄 Demo Mode - Simulated payment processing
                </Text>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: 'white',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
    marginBottom: Spacing.lg,
  },
  tripSummary: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tripRoute: {
    marginBottom: Spacing.lg,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  pickupDot: {
    backgroundColor: '#10B981',
  },
  dropoffDot: {
    backgroundColor: '#EF4444',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#6B7280',
    marginLeft: 5,
    marginRight: Spacing.md,
    marginBottom: Spacing.sm,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: Typography.fontSize.sm,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: 'white',
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: '#4B5563',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: '#9CA3AF',
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
  },
  fareCard: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  fareItems: {
    gap: Spacing.md,
  },
  fareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: Typography.fontSize.base,
    color: '#D1D5DB',
  },
  fareValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: 'white',
  },
  fareSeparator: {
    height: 1,
    backgroundColor: '#6B7280',
    marginVertical: Spacing.lg,
  },
  fareTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareTotalLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
  },
  fareTotalValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
  },
  walletCard: {
    backgroundColor: '#374151',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  walletTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: 'white',
  },
  walletBalance: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
  },
  insufficientBalance: {
    fontSize: Typography.fontSize.sm,
    color: '#EF4444',
    marginTop: Spacing.sm,
  },
  actionButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  payButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: BorderRadius.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: '#EF4444',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  rateButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: BorderRadius.md,
  },
  doneButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: '#D1D5DB',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  demoText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#F59E0B',
    textAlign: 'center',
  },
});
