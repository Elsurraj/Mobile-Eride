import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onPress,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  size = 'medium',
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getButtonStyles = () => {
    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: BorderRadius.md,
      ...Shadows.sm,
    };

    const sizeStyles = {
      small: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
      },
      medium: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
      },
      large: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.brand.secondary,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.brand.secondary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.textLight;
    }
    
    switch (variant) {
      case 'primary':
        return colors.brand.primary;
      case 'secondary':
        return colors.brand.secondary;
      case 'ghost':
        return colors.text;
      default:
        return colors.brand.primary;
    }
  };

  const getIconColor = () => {
    return getTextColor();
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return Typography.fontSize.sm;
      case 'medium':
        return Typography.fontSize.base;
      case 'large':
        return Typography.fontSize.lg;
      default:
        return Typography.fontSize.base;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const styles = StyleSheet.create({
    button: getButtonStyles(),
    text: {
      fontSize: getFontSize(),
      fontWeight: Typography.fontWeight.semibold,
      color: getTextColor(),
      marginLeft: Spacing.sm,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getIconColor()}
      />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

export default ActionButton;
