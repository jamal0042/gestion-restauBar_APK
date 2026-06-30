import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { LayoutDashboard, Package, Users, BarChart3, Settings, Receipt } from 'lucide-react-native';

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#212121' : '#FFFFFF',
          borderTopColor: isDark ? '#424242' : '#E0E0E0',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        },
        tabBarActiveTintColor: '#C2185B',
        tabBarInactiveTintColor: isDark ? '#9E9E9E' : '#757575',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      {/* Écran d'accueil dynamique (Dashboard ou Ventes) */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Ventes',
          tabBarIcon: ({ color, size }) => (
            isAdmin ? <LayoutDashboard size={size} color={color} /> : <Receipt size={size} color={color} />
          ),
        }}
      />

      {/* Écran Produits commun */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />

      {/* Écran Utilisateurs - Masqué si pas Admin */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          href: isAdmin ? '/users' : null, // Cache l'onglet proprement sans casser Expo Router
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />

      {/* Écran Rapports (Admin) */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          href: isAdmin ? '/reports' : null,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />

      {/* Écran Historique (User classique) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          href: !isAdmin ? '/history' : null,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />

      {/* Écran Paramètres commun */}
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