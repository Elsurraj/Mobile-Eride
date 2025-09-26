import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { ridesService, CancellationReason, CancellationPenalty } from '@/services/ridesService';

interface CancellationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reasonId?: string, notes?: string) => void;
  rideId: string;
  cancelledBy: 'rider' | 'driver';
  rideFare?: number;
  rideStatus?: string;
}

export function CancellationModal({
  visible,
  onClose,
  onConfirm,
  rideId,
  cancelledBy,
  rideFare,
  rideStatus
}: CancellationModalProps) {
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [penalty, setPenalty] = useState<CancellationPenalty | null>(null);
  const [loadingPenalty, setLoadingPenalty] = useState(false);
  const [showPenalty, setShowPenalty] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCancellationReasons();
      if (cancelledBy === 'rider') {
        loadCancellationPenalty();
      }
    }
  }, [visible, cancelledBy]);

  const loadCancellationReasons = async () => {
    try {
      setLoading(true);
      const response = await ridesService.getCancellationReasons(cancelledBy);
      if (response.success && response.data) {
        setReasons(response.data);
      }
    } catch (error) {
      console.error('Failed to load cancellation reasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCancellationPenalty = async () => {
    if (!rideId) return;
    
    try {
      setLoadingPenalty(true);
      const response = await ridesService.calculateCancellationPenalty(rideId);
      if (response.success && response.data) {
        setPenalty(response.data);
        setShowPenalty(response.data.amount > 0);
      }
    } catch (error) {
      console.error('Failed to calculate penalty:', error);
    } finally {
      setLoadingPenalty(false);
    }
  };

  const handleConfirm = () => {
    if (cancelledBy === 'driver' && !selectedReason) {
      Alert.alert('Required', 'Please select a reason for cancellation.');
      return;
    }

    if (showPenalty && penalty) {
      Alert.alert(
        'Cancellation Fee',
        `You will be charged ${penalty.formatted_amount} for cancelling this ride. Do you want to continue?`,
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes, Cancel Ride',
            style: 'destructive',
            onPress: () => onConfirm(selectedReason)
          }
        ]
      );
    } else {
      onConfirm(selectedReason);
    }
  };

  const renderReasonItem = (reason: CancellationReason) => (
    <TouchableOpacity
      key={reason.id}
      style={[
        styles.reasonItem,
        selectedReason === reason.id && styles.reasonItemSelected
      ]}
      onPress={() => setSelectedReason(reason.id)}
    >
      <View style={styles.reasonContent}>
        <Text style={[
          styles.reasonText,
          selectedReason === reason.id && styles.reasonTextSelected
        ]}>
          {reason.label}
        </Text>
        {selectedReason === reason.id && (
          <MaterialIcons name="check-circle" size={20} color="#10B981" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPenaltyInfo = () => {
    if (cancelledBy !== 'rider') return null;

    if (loadingPenalty) {
      return (
        <View style={styles.penaltyContainer}>
          <ActivityIndicator size="small" color="#EF4444" />
          <Text style={styles.penaltyLoadingText}>Calculating cancellation fee...</Text>
        </View>
      );
    }

    if (penalty) {
      return (
        <View style={[styles.penaltyContainer, penalty.waived ? styles.penaltyWaived : styles.penaltyCharge]}>
          <MaterialIcons 
            name={penalty.waived ? "check-circle" : "warning"} 
            size={20} 
            color={penalty.waived ? "#10B981" : "#EF4444"} 
          />
          <View style={styles.penaltyContent}>
            <Text style={[styles.penaltyAmount, penalty.waived && styles.penaltyAmountWaived]}>
              {penalty.formatted_amount}
            </Text>
            <Text style={styles.penaltyReason}>{penalty.reason}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialIcons 
                name="cancel" 
                size={24} 
                color="#EF4444" 
                style={styles.headerIcon}
              />
              <Text style={styles.title}>
                Cancel {cancelledBy === 'rider' ? 'Ride' : 'Trip'}?
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Warning Message */}
            <Text style={styles.warningText}>
              {cancelledBy === 'rider' 
                ? 'Are you sure you want to cancel this ride?'
                : 'Please select a reason for cancelling this trip:'
              }
            </Text>

            {/* Penalty Information */}
            {renderPenaltyInfo()}

            {/* Cancellation Reasons */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading options...</Text>
              </View>
            ) : (
              <View style={styles.reasonsContainer}>
                <Text style={styles.reasonsTitle}>
                  {cancelledBy === 'rider' ? 'Reason (optional):' : 'Select a reason:'}
                </Text>
                {reasons.map(renderReasonItem)}
              </View>
            )}

            {/* Ride Info */}
            {rideFare && (
              <View style={styles.rideInfo}>
                <Text style={styles.rideInfoTitle}>Ride Details</Text>
                <View style={styles.rideInfoRow}>
                  <Text style={styles.rideInfoLabel}>Fare:</Text>
                  <Text style={styles.rideInfoValue}>₦{rideFare.toFixed(2)}</Text>
                </View>
                {rideStatus && (
                  <View style={styles.rideInfoRow}>
                    <Text style={styles.rideInfoLabel}>Status:</Text>
                    <Text style={styles.rideInfoValue}>{rideStatus}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Keep Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                (cancelledBy === 'driver' && !selectedReason) && styles.confirmButtonDisabled
              ]} 
              onPress={handleConfirm}
              disabled={cancelledBy === 'driver' && !selectedReason}
            >
              <MaterialIcons name="cancel" size={16} color="white" />
              <Text style={styles.confirmButtonText}>
                {showPenalty ? 'Pay Fee & Cancel' : 'Cancel Ride'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 22,
  },
  penaltyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  penaltyCharge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  penaltyWaived: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  penaltyContent: {
    marginLeft: 12,
    flex: 1,
  },
  penaltyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  penaltyAmountWaived: {
    color: '#10B981',
  },
  penaltyReason: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  penaltyLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  reasonItem: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  reasonItemSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  reasonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  reasonText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#10B981',
    fontWeight: '500',
  },
  rideInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  rideInfoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  rideInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rideInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  rideInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});
