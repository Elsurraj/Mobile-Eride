import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import SvgLogo from '../SvgLogo';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', style }) => {
  const logoSizes = {
    small: 50,
    medium: 100,
    large: 150,
  };

  const textSizes = {
    small: Typography.fontSize.lg,
    medium: Typography.fontSize['2xl'],
    large: Typography.fontSize['3xl'],
  };

  const logoSize = logoSizes[size];
  const textSize = textSizes[size];

  return (
    <View style={[styles.container, style]}>
      <SvgLogo size={logoSize} />
      <Text style={[styles.logoText, { fontSize: textSize }]}>E-Ride</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoText: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
    textAlign: 'center',
  },
});

export default Logo;
