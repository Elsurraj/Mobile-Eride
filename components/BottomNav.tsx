import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Get role-based navigation label
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

  const navItems: NavItem[] = [
    { label: 'Home', icon: 'home-outline', path: '/(dashboard)' },
    { label: getRidesLabel(), icon: 'map-outline', path: '/(dashboard)/rides' },
    { label: 'Wallet', icon: 'card-outline', path: '/(dashboard)/wallet' },
    { label: 'Profile', icon: 'person-outline', path: '/(dashboard)/profile' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.navContainer}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path);
          
          return (
            <TouchableOpacity
              key={item.path}
              style={[
                styles.navItem,
                isActive && styles.activeNavItem,
              ]}
              onPress={() => handleNavigation(item.path)}
              activeOpacity={0.7}
            >
              {/* Active indicator */}
              {isActive && <View style={styles.activeIndicator} />}
              
              <Ionicons
                name={isActive ? item.icon.replace('-outline', '') as any : item.icon as any}
                size={isActive ? 26 : 24}
                color={isActive ? '#F59E0B' : '#9CA3AF'}
                style={styles.navIcon}
              />
              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.activeNavLabel,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 60,
    position: 'relative',
  },
  activeNavItem: {
    backgroundColor: '#374151',
  },
  activeIndicator: {
    position: 'absolute',
    top: -1,
    width: 30,
    height: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
  },
  navIcon: {
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  activeNavLabel: {
    color: '#F59E0B',
    fontWeight: '600',
  },
});

export default BottomNav;
