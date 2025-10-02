import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import SvgLogo from './SvgLogo';

const { width, height } = Dimensions.get('window');

interface SplashSlide {
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  gradient: string[];
}

const slides: SplashSlide[] = [
  {
    title: 'Fast & Safe Rides',
    description: 'Get to your destination quickly and safely with our trusted ride-sharing service. Real-time tracking and verified drivers ensure your peace of mind.',
    icon: 'time-outline',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop&crop=center',
    gradient: ['#1a1a1a', '#2d1d0c'],
  },
  {
    title: 'Trusted Drivers',
    description: 'All our drivers are carefully screened and verified. Background checks, license verification, and customer ratings ensure you\'re in safe hands.',
    icon: 'shield-checkmark-outline',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop&crop=center',
    gradient: ['#2d1d0c', '#1a1a1a'],
  },
  {
    title: 'Affordable Pricing',
    description: 'Enjoy competitive rates with transparent pricing. No hidden fees, upfront pricing, and multiple payment options make E-Ride budget-friendly.',
    icon: 'cash-outline',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop&crop=center',
    gradient: ['#1a1a1a', '#2d1d0c'],
  },
];

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
  showHealthStatus?: boolean;
  isBackendHealthy?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  showHealthStatus = false,
  isBackendHealthy = false,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7); // Increased from 5 to 7 seconds
  const [isManualControl, setIsManualControl] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let completionTimer: NodeJS.Timeout | null = null;
    
    if (!isManualControl) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (currentSlide < slides.length - 1) {
              setCurrentSlide(currentSlide + 1);
              return 7; // Increase to 7 seconds for next slide to allow slower loading
            } else {
              if (timer) clearInterval(timer);
              // Increase delay to ensure UI is fully ready
              completionTimer = setTimeout(() => {
                try {
                  onComplete();
                } catch (error) {
                  console.error('Error completing splash screen:', error);
                  // Fallback: try again after a longer delay
                  setTimeout(() => {
                    try {
                      onComplete();
                    } catch (retryError) {
                      console.error('Retry failed:', retryError);
                    }
                  }, 1000);
                }
              }, 300); // Increased delay
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
      if (completionTimer) {
        clearTimeout(completionTimer);
      }
    };
  }, [currentSlide, onComplete, isManualControl]);

  const nextSlide = () => {
    setIsManualControl(true);
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    setIsManualControl(true);
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setIsManualControl(true);
    setCurrentSlide(index);
  };

  const handleSkip = () => {
    setIsManualControl(true);
    onComplete();
  };

  const handleContinue = () => {
    setIsManualControl(true);
    if (currentSlide === slides.length - 1) {
      onComplete(); // "Get Started" goes to login
    } else {
      nextSlide(); // Continue to next slide
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <LinearGradient
        colors={currentSlideData.gradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Left Side - Text Content */}
          <View style={styles.textContent}>
            {/* E-Ride Logo */}
            <View style={styles.logoContainer}>
              <SvgLogo size={70} />
              <Text style={styles.logoText}>E-Ride</Text>
              
              {/* Health Status Indicator */}
              {showHealthStatus && (
                <View style={styles.healthStatusContainer}>
                  <View style={[styles.healthDot, { backgroundColor: isBackendHealthy ? '#10B981' : '#F59E0B' }]} />
                  <Text style={styles.healthStatusText}>
                    {isBackendHealthy ? 'Online' : 'Demo Mode'}
                  </Text>
                </View>
              )}
            </View>

            {/* Feature Icon */}
            <View style={styles.iconContainer}>
              <Ionicons 
                name={currentSlideData.icon as any} 
                size={60} 
                color={Colors.light.brand.secondary} 
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {currentSlideData.title}
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              {currentSlideData.description}
            </Text>

            {/* Auto Timer */}
            {!isManualControl && (
              <Text style={styles.timerText}>
                Next in {Math.ceil(timeLeft)} seconds...
              </Text>
            )}

            {/* Navigation and Controls */}
            <View style={styles.controlsContainer}>
              {/* Slide Indicators */}
              <View style={styles.indicators}>
                {slides.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentSlide ? styles.activeIndicator : styles.inactiveIndicator,
                    ]}
                    onPress={() => goToSlide(index)}
                  />
                ))}
              </View>

              {/* Navigation */}
              <View style={styles.navigation}>
                <TouchableOpacity
                  style={[styles.navButton, currentSlide === 0 && styles.navButtonDisabled]}
                  onPress={prevSlide}
                  disabled={currentSlide === 0}
                >
                  <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>

                <Text style={styles.slideCounter}>
                  {currentSlide + 1} of {slides.length}
                </Text>

                <TouchableOpacity
                  style={styles.navButton}
                  onPress={nextSlide}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color={Colors.light.brand.secondary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Manual Controls */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleContinue}
                >
                  <Text style={styles.primaryButtonText}>
                    {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Right Side - Feature Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: currentSlideData.imageUrl }}
              style={styles.featureImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    flexDirection: width > 600 ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing['5xl'],
    gap: Spacing['5xl'],
  },
  textContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 500,
    gap: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoText: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.secondary,
  },
  healthStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthStatusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
  iconContainer: {
    marginVertical: Spacing.md,
  },
  title: {
    fontSize: width > 600 ? Typography.fontSize['4xl'] : Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: 'white',
    textAlign: 'center',
    lineHeight: Typography.lineHeight.tight,
  },
  description: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 450,
  },
  timerText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
  controlsContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  indicators: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeIndicator: {
    backgroundColor: Colors.light.brand.secondary,
  },
  inactiveIndicator: {
    backgroundColor: '#6B7280',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  navButton: {
    padding: Spacing.md,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  slideCounter: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
  buttonsContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.light.brand.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.light.brand.primary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#9CA3AF',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: width > 600 ? 500 : 400,
  },
  featureImage: {
    width: width > 600 ? 400 : 320,
    height: width > 600 ? 300 : 240,
    borderRadius: BorderRadius.xl,
    // Use boxShadow for web compatibility instead of shadow* props
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.5)',
    elevation: 15,
  },
});

export default SplashScreen;
