import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// Import reanimated setup
import '../reanimated-setup';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { enhancedTokenManager } from '@/utils/enhancedTokenManager';
import SplashScreen from '@/components/SplashScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Handle API errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if ([401, 403].includes(status)) {
            enhancedTokenManager.clearAllData();
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: async (error) => {
        // Handle API errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if ([401, 403].includes(status)) {
            await enhancedTokenManager.clearAllData();
          }
        }
      },
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(dashboard)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
