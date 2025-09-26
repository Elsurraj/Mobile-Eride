import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface Location {
  address: string;
  label?: string;
}

interface RequestCardProps {
  id: string;
  type: 'ride' | 'delivery';
  pickup: Location;
  dropoff: Location;
  customerName: string;
  estimatedTime: string;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({
  id,
  type,
  pickup,
  dropoff,
  customerName,
  estimatedTime,
  onAccept,
  onDecline,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.brand.secondary,
      ...Shadows.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    customerName: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text,
    },
    badge: {
      backgroundColor: colors.brand.secondary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      borderRadius: BorderRadius.sm,
    },
    badgeText: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.bold,
      color: colors.brand.primary,
      textTransform: 'uppercase',
    },
    routeContainer: {
      marginBottom: Spacing.lg,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    locationIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    pickupIcon: {
      backgroundColor: '#10B981' + '20',
    },
    dropoffIcon: {
      backgroundColor: '#EF4444' + '20',
    },
    locationText: {
      flex: 1,
    },
    locationAddress: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
      marginBottom: Spacing.xs / 2,
    },
    locationLabel: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    estimatedTime: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
    },
    estimatedTimeText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      ...Shadows.sm,
    },
    acceptButton: {
      backgroundColor: colors.success,
    },
    declineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.error,
    },
    buttonText: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
      marginLeft: Spacing.sm,
    },
    acceptButtonText: {
      color: '#FFFFFF',
    },
    declineButtonText: {
      color: colors.error,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.customerName}>{customerName}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{type}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeContainer}>
        {/* Pickup */}
        <View style={styles.locationRow}>
          <View style={[styles.locationIcon, styles.pickupIcon]}>
            <Ionicons name="location" size={16} color="#10B981" />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationAddress}>{pickup.address}</Text>
            {pickup.label && (
              <Text style={styles.locationLabel}>{pickup.label}</Text>
            )}
          </View>
        </View>

        {/* Dropoff */}
        <View style={styles.locationRow}>
          <View style={[styles.locationIcon, styles.dropoffIcon]}>
            <Ionicons name="location" size={16} color="#EF4444" />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationAddress}>{dropoff.address}</Text>
            {dropoff.label && (
              <Text style={styles.locationLabel}>{dropoff.label}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Estimated Time */}
      <View style={styles.estimatedTime}>
        <Ionicons name="time" size={16} color={colors.brand.secondary} />
        <Text style={styles.estimatedTimeText}>
          Estimated pickup in {estimatedTime}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => onAccept(id)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={[styles.buttonText, styles.acceptButtonText]}>
            Accept
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={() => onDecline(id)}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={20} color={colors.error} />
          <Text style={[styles.buttonText, styles.declineButtonText]}>
            Decline
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RequestCard;
