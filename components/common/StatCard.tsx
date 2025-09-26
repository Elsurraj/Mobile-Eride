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

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor?: string;
  onPress?: () => void;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  bgColor,
  onPress,
  subtitle,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: bgColor || colors.background,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadows.md,
    },
    touchable: {
      borderRadius: BorderRadius.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    title: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      color: bgColor ? '#FFFFFF' : colors.textSecondary,
      flex: 1,
    },
    iconContainer: {
      backgroundColor: bgColor ? 'rgba(255, 255, 255, 0.2)' : colors.brand.secondary + '20',
      borderRadius: BorderRadius.base,
      padding: Spacing.sm,
    },
    value: {
      fontSize: Typography.fontSize['3xl'],
      fontWeight: Typography.fontWeight.bold,
      color: bgColor ? '#FFFFFF' : colors.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: Typography.fontSize.xs,
      color: bgColor ? 'rgba(255, 255, 255, 0.8)' : colors.textLight,
    },
  });

  const CardContent = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={bgColor ? '#FFFFFF' : colors.brand.primary}
          />
        </View>
      </View>
      
      <Text style={styles.value}>{value}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

export default StatCard;
