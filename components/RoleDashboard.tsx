import React from 'react';
import { View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import RiderDashboard from './dashboards/RiderDashboard';
import DriverDashboard from './dashboards/DriverDashboard';
import CourierDashboard from './dashboards/CourierDashboard';

const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Determine which dashboard to show based on user role
  const renderDashboard = () => {
    switch (user?.role) {
      case 'driver':
        return <DriverDashboard />;
      case 'courier':
        return <CourierDashboard />;
      case 'rider':
      default:
        return <RiderDashboard />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderDashboard()}
    </View>
  );
};

export default RoleDashboard;
