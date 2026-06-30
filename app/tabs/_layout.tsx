import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  Receipt,
  TrendingUp,
} from 'lucide-react-native';

const COLORS = {
  light: { background: '#FFFFFF', border: '#E0E0E0', active: '#C2185B', inactive: '#757575' },
  dark: { background: '#2e2e2e', border: '#424242', active: '#C2185B', inactive: '#9E9E9E' },
};

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isAdmin = user?.role === 'admin';
  const currentColors = isDark ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  // Barre remontée au maximum
  const tabBarPaddingBottom = Platform.select({
    ios: Math.max(insets.bottom - 10, 2),
    android: 2,
    default: 2,
  });

  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: currentColors.background,
      borderTopColor: currentColors.border,
      borderTopWidth: 1,
      height: Platform.OS === 'ios' ? 72 : 56,
      paddingTop: 6,
      paddingBottom: tabBarPaddingBottom,
    },
    tabBarActiveTintColor: currentColors.active,
    tabBarInactiveTintColor: currentColors.inactive,
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '500' as const,
      marginTop: 1,
    },
    tabBarIconStyle: {
      marginTop: 0,
    },
  };

  // Admin : tous les menus
  const adminTabs = [
    { name: 'index', title: 'Dashboard', icon: LayoutDashboard },
    { name: 'products', title: 'Produits', icon: Package },
    { name: 'users', title: 'Utilisateurs', icon: Users },
    { name: 'reports', title: 'Rapports', icon: BarChart3 },
    { name: 'settings', title: 'Paramètres', icon: Settings },
  ];

  // Caissier : menus limités
  const cashierTabs = [
    { name: 'index', title: 'Ventes', icon: Receipt },
    { name: 'products', title: 'Produits', icon: Package },
    { name: 'history', title: 'Historique', icon: TrendingUp },
    { name: 'settings', title: 'Paramètres', icon: Settings },
  ];

  const tabs = isAdmin ? adminTabs : cashierTabs;

  return (
    <Tabs screenOptions={screenOptions}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => <tab.icon size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}