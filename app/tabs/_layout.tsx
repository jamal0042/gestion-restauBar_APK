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
  Receipt 
} from 'lucide-react-native';

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); 
  const isDark = colorScheme === 'dark';
  const isAdmin = user?.role === 'admin';

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
          height: 70 + insets.bottom, 
          paddingTop: 8,
          paddingBottom: insets.bottom, 
        },
        tabBarActiveTintColor: colors.activeTint,
        tabBarInactiveTintColor: colors.inactiveTint,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        // ✅ CORRECTION : Remplacement par tabBarPressColor pour l'effet ripple sur Android
        // (Supprime cette ligne si tu n'en as pas besoin)
        tabBarPressColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
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

      {/* Onglets conditionnels cachés via display: 'none' pour éviter les bugs de routing */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          tabBarStyle: { display: isAdmin ? 'flex' : 'none' }, 
          href: isAdmin ? undefined : null, 
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