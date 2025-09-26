import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Text as SvgText,
  Path,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from 'react-native-svg';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', style }) => {
  const dimensions = {
    small: { width: 80, height: 40 },
    medium: { width: 240, height: 100 },
    large: { width: 360, height: 150 },
  };

  const { width, height } = dimensions[size];
  const scale = size === 'small' ? 0.5 : size === 'large' ? 1.5 : 1;

  // For small size, show simplified logo
  if (size === 'small') {
    return (
      <View style={style}>
        <Svg width={width} height={height} viewBox="0 0 80 40">
          <Defs>
            <RadialGradient id="bgGradientSmall" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fcd424" stopOpacity={1} />
              <Stop offset="100%" stopColor="#f1c40f" stopOpacity={1} />
            </RadialGradient>
          </Defs>
          
          {/* Background circle */}
          <Circle
            cx="20"
            cy="20"
            r="16"
            fill="url(#bgGradientSmall)"
            stroke="#2d1d0c"
            strokeWidth="2"
          />
          
          {/* E letter */}
          <SvgText
            x="20"
            y="26"
            fontSize="16"
            fontWeight="900"
            fill="#2d1d0c"
            textAnchor="middle"
            fontFamily="Montserrat"
          >
            E
          </SvgText>
          
          {/* "RIDE" text */}
          <SvgText
            x="45"
            y="26"
            fontSize="16"
            fontWeight="bold"
            fill="#fcd424"
            fontFamily="Montserrat"
          >
            RIDE
          </SvgText>
        </Svg>
      </View>
    );
  }

  return (
    <View style={style}>
      <Svg width={width} height={height} viewBox="0 0 240 100">
        <Defs>
          <RadialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fcd424" stopOpacity={1} />
            <Stop offset="100%" stopColor="#f1c40f" stopOpacity={1} />
          </RadialGradient>
          <LinearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#2d1d0c" stopOpacity={1} />
            <Stop offset="100%" stopColor="#1a1a1a" stopOpacity={1} />
          </LinearGradient>
        </Defs>
        
        {/* Background circle with shadow */}
        <Circle
          cx="45"
          cy="50"
          r="40"
          fill="url(#bgGradient)"
          stroke="#2d1d0c"
          strokeWidth="3"
        />
        
        {/* E letter */}
        <SvgText
          x="45"
          y="62"
          fontSize="36"
          fontWeight="900"
          fill="url(#textGradient)"
          textAnchor="middle"
          fontFamily="Montserrat"
        >
          E
        </SvgText>
        
        {/* "RIDE" text */}
        <SvgText
          x="110"
          y="38"
          fontSize="28"
          fontWeight="bold"
          fill="#fcd424"
          fontFamily="Montserrat"
        >
          RIDE
        </SvgText>
        
        {/* Tagline */}
        <SvgText
          x="110"
          y="58"
          fontSize="14"
          fill="#2d1d0c"
          fontWeight="500"
          fontFamily="Montserrat"
        >
          Fast & Safe Rides
        </SvgText>
        
        {/* Modern car silhouette */}
        <G transform="translate(20, 70)">
          {/* Car body */}
          <Path
            d="M5 8 Q5 6 7 6 L35 6 Q40 6 42 8 L45 12 Q45 14 43 14 L7 14 Q5 14 5 12 Z"
            fill="#2d1d0c"
          />
          {/* Car windows */}
          <Path
            d="M10 6 Q12 4 15 4 L30 4 Q33 4 35 6 L32 6 L18 6 Z"
            fill="#4a4a4a"
          />
          {/* Wheels */}
          <Circle cx="12" cy="16" r="4" fill="#2d1d0c" stroke="#fcd424" strokeWidth="2" />
          <Circle cx="38" cy="16" r="4" fill="#2d1d0c" stroke="#fcd424" strokeWidth="2" />
          {/* Wheel centers */}
          <Circle cx="12" cy="16" r="1.5" fill="#fcd424" />
          <Circle cx="38" cy="16" r="1.5" fill="#fcd424" />
        </G>
      </Svg>
    </View>
  );
};

export default Logo;
