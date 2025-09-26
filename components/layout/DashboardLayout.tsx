import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/common/Logo';

interface DashboardLayoutProps {
  title?: string;
  children: React.ReactNode;
  showHeader?: boolean;
  scrollable?: boolean;
}

const { width, height } = Dimensions.get('window');

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  children,
  showHeader = true,
  scrollable = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: '#1F2937',
      borderBottomWidth: 1,
      borderBottomColor: '#374151',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    headerLeft: {
      flex: 1,
      alignItems: 'flex-start',
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    headerTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: '#FFFFFF',
      textAlign: 'center',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.sm,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    logoutButtonText: {
      color: '#EF4444',
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      marginLeft: Spacing.xs,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 100, // Space for bottom navigation
    },
    nonScrollContent: {
      flex: 1,
      paddingBottom: 100, // Space for bottom navigation
    },
  });

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable 
    ? { 
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : { style: styles.nonScrollContent };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {showHeader && (
          <View style={styles.header}>
            {/* Logo on the left */}
            <View style={styles.headerLeft}>
              <Logo size="small" />
            </View>
            
            {/* Title in the center */}
            {title && (
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>{title}</Text>
              </View>
            )}
            
            {/* Logout button on the right */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <ContentWrapper style={styles.content} {...contentProps}>
          {children}
        </ContentWrapper>
      </View>
    </SafeAreaView>
  );
};

export default DashboardLayout;
