import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  Receipt 
} from 'lucide-react-native';

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // ✅ Pour gérer le safe area proprement
  const isDark = colorScheme === 'dark';
  const isAdmin = user?.role === 'admin';

  // Couleurs centralisées pour cohérence
  const colors = {
    tabBarBg: isDark ? '#212121' : '#FFFFFF',
    borderTop: isDark ? '#424242' : '#E0E0E0',
    activeTint: '#C2185B',
    inactiveTint: isDark ? '#9E9E9E' : '#757575',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.borderTop,
          borderTopWidth: 1,
          height: 70 + insets.bottom, // ✅ S'adapte automatiquement à la zone sécurisée
          paddingTop: 8,
          paddingBottom: insets.bottom, // ✅ Plus besoin de hardcoder iOS/Android
        },
        tabBarActiveTintColor: colors.activeTint,
        tabBarInactiveTintColor: colors.inactiveTint,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        // ✅ Animation fluide du ripple/touch feedback
        tabBarPressOpacity: 0.9,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Ventes',
          tabBarIcon: ({ color, size }) =>
            isAdmin ? (
              <LayoutDashboard size={size} color={color} />
            ) : (
              <Receipt size={size} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />

      {/* ✅ CORRECTION MAJEURE : Ne jamais conditionner Tabs.Screen dans le JSX avec expo-router */}
      {/* Utilise display: 'none' pour cacher au lieu de supprimer du DOM */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          tabBarStyle: { display: isAdmin ? 'flex' : 'none' }, // ✅ Cache proprement
          href: isAdmin ? undefined : null, // ✅ Désactive la navigation pour les non-admins
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          tabBarStyle: { display: isAdmin ? 'flex' : 'none' },
          href: isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          tabBarStyle: { display: !isAdmin ? 'flex' : 'none' },
          href: !isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}