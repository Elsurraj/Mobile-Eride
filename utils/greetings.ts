// Time-based greeting utilities
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'Good Evening';
  } else {
    return 'Good Night';
  }
};

// Get emoji based on time of day
export const getTimeEmoji = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return '👋'; // Morning wave
  } else if (hour >= 12 && hour < 17) {
    return '☀️'; // Afternoon sun
  } else if (hour >= 17 && hour < 21) {
    return '🚀'; // Evening rocket
  } else {
    return '🌙'; // Night moon
  }
};

// Role-specific greeting messages
export const getRoleSpecificGreeting = (role?: string, name?: string): string => {
  const timeGreeting = getTimeBasedGreeting();
  const emoji = getTimeEmoji();
  const firstName = name?.split(' ')[0] || 'User';
  
  switch (role) {
    case 'driver':
      return `${timeGreeting}, ${firstName}! 🚗`;
    case 'courier':
      return `${timeGreeting}, ${firstName}! 📦`;
    case 'rider':
      return `${timeGreeting}, ${firstName}! ${emoji}`;
    case 'admin':
      return `${timeGreeting}, ${firstName}! 👑`;
    default:
      return `${timeGreeting}, ${firstName}! ${emoji}`;
  }
};

// Get role-specific welcome messages
export const getRoleWelcomeMessage = (role?: string): string => {
  switch (role) {
    case 'driver':
      return 'Ready to hit the road?';
    case 'courier':
      return 'Ready for deliveries?';
    case 'rider':
      return 'Where would you like to go today?';
    case 'admin':
      return 'Manage your E-Ride platform';
    default:
      return 'Welcome to E-Ride!';
  }
};

// Get status messages for drivers/couriers
export const getStatusMessage = (isOnline: boolean, role?: string): string => {
  if (!isOnline) {
    return role === 'driver' ? 'You are offline' : 'You are unavailable';
  }
  
  return role === 'driver' ? 'You are online and ready for rides' : 'You are available for deliveries';
};

// Format time duration (e.g., "5 mins", "1 hour 30 mins")
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

// Get user initials for avatar
export const getUserInitials = (name?: string): string => {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
