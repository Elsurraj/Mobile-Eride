import React from 'react';
import { ViewStyle, View, Text } from 'react-native';
import { SvgProps } from 'react-native-svg';
import ErideLogo from '../assets/eride-logo.svg';
import { Colors, Typography } from '@/constants/theme';

interface SvgLogoProps extends SvgProps {
  size?: number;
  style?: ViewStyle;
}

const SvgLogo: React.FC<SvgLogoProps> = ({ 
  size = 70, 
  style,
  ...props 
}) => {
  // Your SVG has dimensions 481x495, so we maintain aspect ratio
  const aspectRatio = 481 / 495; // ~0.973
  const width = size;
  const height = size / aspectRatio;
  
  return (
    <ErideLogo 
      width={width} 
      height={height} 
      style={[
        { 
          // Ensure visibility
          overflow: 'visible'
        },
        style
      ]}
      viewBox="0 0 481 495"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    />
  );
};

export default SvgLogo;
