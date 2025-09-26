import React from 'react';
import { View } from 'react-native';
import RoleDashboard from '@/components/RoleDashboard';
import BottomNav from '@/components/BottomNav';

export default function DashboardHome() {
  return (
    <View style={{ flex: 1 }}>
      <RoleDashboard />
      <BottomNav />
    </View>
  );
}
