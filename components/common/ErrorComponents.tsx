import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  showRetry = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.error + '10',
      borderColor: colors.error + '30',
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginVertical: Spacing.sm,
    },
    messageText: {
      fontSize: Typography.fontSize.base,
      color: colors.error,
      textAlign: 'center',
      marginBottom: showRetry && onRetry ? Spacing.md : 0,
    },
    retryButton: {
      backgroundColor: colors.error,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.sm,
      alignSelf: 'center',
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.messageText}>{message}</Text>
      {showRetry && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['2xl'],
    },
    message: {
      fontSize: Typography.fontSize.base,
      color: colors.textSecondary,
      marginTop: Spacing.lg,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={colors.brand.secondary}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['3xl'],
      paddingHorizontal: Spacing.xl,
    },
    iconContainer: {
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: Typography.fontSize.base,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: actionLabel && onAction ? Spacing.xl : 0,
      lineHeight: Typography.fontSize.base * 1.5,
    },
    actionButton: {
      backgroundColor: colors.brand.secondary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      ...Shadows.sm,
    },
    actionButtonText: {
      color: colors.brand.primary,
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.semibold,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={colors.textLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface NetworkErrorProps {
  onRetry: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Connection Error"
      message="Please check your internet connection and try again."
      actionLabel="Try Again"
      onAction={onRetry}
    />
  );
};

interface InlineLoadingProps {
  message?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = 'Loading...',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
    },
    message: {
      fontSize: Typography.fontSize.base,
      color: colors.textSecondary,
      marginLeft: Spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.brand.secondary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};
