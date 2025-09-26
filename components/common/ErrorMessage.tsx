import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface ErrorMessageProps {
  message: string;
  visible?: boolean;
  style?: any;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  visible = true, 
  style 
}) => {
  if (!visible || !message) return null;

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle" size={16} color={Colors.light.error} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.errorBackground,
    borderWidth: 1,
    borderColor: Colors.light.error,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.light.error,
    flex: 1,
  },
});

export default ErrorMessage;
