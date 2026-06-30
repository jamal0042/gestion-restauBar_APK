import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Receipt,
} from 'lucide-react-native';

// Constantes de configuration
const TAB_BAR_CONFIG = {
  ios: { height: 88, paddingBottom: 28 },
  android: { height: 72, paddingBottom: 12 },
};

const COLORS = {
  light: {
    background: '#FFFFFF',
    border: '#E0E0E0',
    active: '#C2185B',
    inactive: '#757575',
  },
  dark: {
    background: '#2e2e2e',
    border: '#424242',
    active: '#C2185B',
    inactive: '#9E9E9E',
  },
};

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isAdmin = user?.role === 'admin';
  const currentColors = isDark ? COLORS.dark : COLORS.light;
  const platformConfig = Platform.OS === 'ios' ? TAB_BAR_CONFIG.ios : TAB_BAR_CONFIG.android;

  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: currentColors.background,
      borderTopColor: currentColors.border,
      borderTopWidth: 1,
      height: platformConfig.height,
      paddingTop: 12,
      paddingBottom: platformConfig.paddingBottom,
    },
    tabBarActiveTintColor: currentColors.active,
    tabBarInactiveTintColor: currentColors.inactive,
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
      marginTop: 4,
    },
  };

  const adminTabs = [
    {
      name: 'index' as const,
      title: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'users' as const,
      title: 'Utilisateurs',
      icon: Users,
    },
    {
      name: 'reports' as const,
      title: 'Rapports',
      icon: BarChart3,
    },
  ];

  const cashierTabs = [
    {
      name: 'index' as const,
      title: 'Ventes',
      icon: Receipt,
    },
    {
      name: 'history' as const,
      title: 'Historique',
      icon: BarChart3,
    },
  ];

  const commonTabs = [
    {
      name: 'products' as const,
      title: 'Produits',
      icon: Package,
    },
    {
      name: 'settings' as const,
      title: 'Paramètres',
      icon: Settings,
    },
  ];

  const tabs = [
    ...(isAdmin ? adminTabs : cashierTabs),
    ...commonTabs,
  ];

  return (
    <Tabs screenOptions={screenOptions}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <tab.icon size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}