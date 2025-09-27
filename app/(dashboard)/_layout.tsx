import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DashboardLayout() {
  const { isAuthenticated, isOtpVerified, isOnboardingComplete, user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated || !isOtpVerified) {
        router.replace('/(auth)/login');
        return;
      }

      // Check if onboarding is completed using AuthContext state
      if (!isOnboardingComplete) {
        router.replace('/(onboarding)/welcome');
      }
    };

    checkAuth();
  }, [isAuthenticated, isOtpVerified, isOnboardingComplete]);

  // Get role-specific label for rides tab
  const getRidesLabel = () => {
    switch (user?.role) {
      case 'driver':
        return 'Jobs';
      case 'courier':
        return 'Deliveries';
      case 'rider':
      default:
        return 'Rides';
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Hide default tab bar since we're using custom BottomNav
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: getRidesLabel(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons 
              name={user?.role === 'courier' ? 'cube' : 'car'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="book-ride"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="driver-selection"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="driver-enroute"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ride-tracking"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ride-completion"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ride-details"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
