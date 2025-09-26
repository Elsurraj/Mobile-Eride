import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgGradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    title: "Fast & Safe Rides",
    description: "Get to your destination quickly and safely with our trusted ride-sharing service. Real-time tracking and verified drivers ensure your peace of mind.",
    icon: "time",
    bgGradient: ['#2d1d0c', '#3d2d1c']
  },
  {
    title: "Trusted Drivers",
    description: "All our drivers are carefully screened and verified. Background checks, license verification, and customer ratings ensure you're in safe hands.",
    icon: "shield-checkmark",
    bgGradient: ['#1a1a1a', '#2d1d0c']
  },
  {
    title: "Affordable Pricing",
    description: "Enjoy competitive rates with transparent pricing. No hidden fees, upfront pricing, and multiple payment options make E-Ride budget-friendly.",
    icon: "card",
    bgGradient: ['#2d1d0c', '#1a1a1a']
  }
];

interface OnboardingScreensProps {
  onComplete: () => void;
}

const OnboardingScreens: React.FC<OnboardingScreensProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index });
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <LinearGradient
        colors={item.bgGradient}
        style={styles.slide}
      >
        <View style={styles.slideContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={item.icon} 
              size={80} 
              color={Colors.light.brand.secondary} 
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Slide Indicators */}
          <View style={styles.indicatorContainer}>
            {slides.map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.indicator,
                  i === index && styles.activeIndicator,
                ]}
                onPress={() => goToSlide(i)}
                activeOpacity={0.7}
              />
            ))}
          </View>

          {/* Navigation */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={prevSlide}
              disabled={currentIndex === 0}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={currentIndex === 0 ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF'} 
              />
            </TouchableOpacity>

            <Text style={styles.slideCounter}>
              {currentIndex + 1} of {slides.length}
            </Text>

            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={nextSlide}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={currentIndex === slides.length - 1 ? "checkmark" : "chevron-forward"} 
                size={24} 
                color={Colors.light.brand.secondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={nextSlide}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {currentIndex === slides.length - 1 ? "Get Started" : "Continue"}
              </Text>
            </TouchableOpacity>

            {currentIndex < slides.length - 1 && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={onComplete}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    slide: {
      width: width,
      height: height,
      justifyContent: 'center',
      alignItems: 'center',
    },
    slideContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
      maxWidth: 400,
    },
    iconContainer: {
      marginBottom: Spacing['3xl'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: Typography.fontSize['3xl'],
      fontWeight: Typography.fontWeight.bold,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: Spacing['2xl'],
    },
    description: {
      fontSize: Typography.fontSize.lg,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      lineHeight: Typography.fontSize.lg * 1.6,
      marginBottom: Spacing['3xl'],
      paddingHorizontal: Spacing.md,
    },
    indicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
      gap: Spacing.sm,
    },
    indicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    activeIndicator: {
      backgroundColor: Colors.light.brand.secondary,
    },
    navigationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: Spacing['2xl'],
    },
    navButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    prevButton: {},
    nextButton: {
      backgroundColor: Colors.light.brand.secondary,
    },
    slideCounter: {
      fontSize: Typography.fontSize.sm,
      color: 'rgba(255, 255, 255, 0.6)',
    },
    actionContainer: {
      width: '100%',
      alignItems: 'center',
      gap: Spacing.md,
    },
    primaryButton: {
      backgroundColor: Colors.light.brand.secondary,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: BorderRadius.xl,
      width: '100%',
      alignItems: 'center',
      ...{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    },
    primaryButtonText: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: Colors.light.brand.primary,
    },
    skipButton: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    skipButtonText: {
      fontSize: Typography.fontSize.base,
      color: 'rgba(255, 255, 255, 0.6)',
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
      />
    </View>
  );
};

export default OnboardingScreens;
