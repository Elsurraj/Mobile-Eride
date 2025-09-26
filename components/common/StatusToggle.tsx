import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface StatusToggleProps {
  isOnline: boolean;
  onToggle: (newStatus: boolean) => void;
  onlineLabel?: string;
  offlineLabel?: string;
}

const StatusToggle: React.FC<StatusToggleProps> = ({
  isOnline,
  onToggle,
  onlineLabel = 'Online',
  offlineLabel = 'Offline',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
    },
    leftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: Spacing.md,
      backgroundColor: isOnline ? colors.success : colors.textLight,
    },
    textContainer: {
      flex: 1,
    },
    statusLabel: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text,
      marginBottom: Spacing.xs / 2,
    },
    statusDescription: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
    },
    switchContainer: {
      marginLeft: Spacing.md,
    },
  });

  const currentLabel = isOnline ? onlineLabel : offlineLabel;
  const statusText = isOnline 
    ? 'You are receiving requests' 
    : 'You are not receiving requests';

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.statusIndicator} />
        
        <View style={styles.textContainer}>
          <Text style={styles.statusLabel}>{currentLabel}</Text>
          <Text style={styles.statusDescription}>{statusText}</Text>
        </View>
      </View>
      
      <View style={styles.switchContainer}>
        <Switch
          value={isOnline}
          onValueChange={onToggle}
          trackColor={{
            false: colors.border,
            true: colors.success,
          }}
          thumbColor={isOnline ? colors.background : colors.textLight}
          ios_backgroundColor={colors.border}
        />
      </View>
    </View>
  );
};

export default StatusToggle;
