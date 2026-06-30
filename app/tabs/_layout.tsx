import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Receipt,
  FileText,
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

  // Barre remontée : paddingBottom minimal pour être flexible
  const tabBarPaddingBottom = Platform.select({
    ios: Math.max(insets.bottom, 8),
    android: 4,
    default: 4,
  });

  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: currentColors.background,
      borderTopColor: currentColors.border,
      borderTopWidth: 1,
      height: Platform.OS === 'ios' ? 80 : 64,
      paddingTop: 8,
      paddingBottom: tabBarPaddingBottom,
    },
    tabBarActiveTintColor: currentColors.active,
    tabBarInactiveTintColor: currentColors.inactive,
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '500' as const,
      marginTop: 2,
    },
  };

  const tabs = [
    // Onglet principal : Dashboard (admin) ou Ventes (caissier)
    {
      name: 'index',
      title: isAdmin ? 'Dashboard' : 'Ventes',
      icon: isAdmin ? LayoutDashboard : Receipt,
    },
    // Produits (pour tous)
    {
      name: 'products',
      title: 'Produits',
      icon: Package,
    },
    // Utilisateurs (admin uniquement)
    ...(isAdmin
      ? [
          {
            name: 'users',
            title: 'Utilisateurs',
            icon: Users, // icône personne, pas de triangle
          },
          {
            name: 'reports',
            title: 'Rapports',
            icon: BarChart3, // icône graphique, pas de triangle
          },
        ]
      : [
          // Historique (caissier uniquement)
          {
            name: 'history',
            title: 'Historique',
            icon: TrendingUp, // icône tendance, pas de triangle
          },
        ]),
    // Paramètres (pour tous)
    {
      name: 'settings',
      title: 'Paramètres',
      icon: Settings,
    },
  ];

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