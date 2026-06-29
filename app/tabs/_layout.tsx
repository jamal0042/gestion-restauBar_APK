import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { LayoutDashboard, Package, Users, BarChart3, Settings, Receipt, History } from 'lucide-react-native';

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Aligne l'icône à gauche et le texte à côté pour gagner un espace fou sur l'écran
        tabBarLabelPosition: 'beside-icon', 
        tabBarStyle: {
          backgroundColor: isDark ? '#212121' : '#FFFFFF',
          borderTopColor: isDark ? '#424242' : '#E0E0E0',
          borderTopWidth: 1,
          // Hauteur fluide et parfaitement adaptée aux encoches/barres de navigation
          height: 54 + insets.bottom, 
          paddingTop: 4,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 4,
        },
        tabBarActiveTintColor: '#C2185B',
        tabBarInactiveTintColor: isDark ? '#9E9E9E' : '#757575',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. DASHBOARD / VENTES */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Ventes',
          tabBarIcon: ({ color, size }) => (
            isAdmin ? <LayoutDashboard size={size - 2} color={color} /> : <Receipt size={size - 2} color={color} />
          ),
        }}
      />

      {/* 2. PRODUITS */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => <Package size={size - 2} color={color} />,
        }}
      />

      {/* 3. UTILISATEURS (Masqué si pas Admin + Typage corrigé) */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Staff', 
          href: (isAdmin ? '/tabs/users' : null) as any, 
          tabBarIcon: ({ color, size }) => <Users size={size - 2} color={color} />,
        }}
      />

      {/* 4. RAPPORTS (Masqué si pas Admin + Typage corrigé) */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          href: (isAdmin ? '/tabs/reports' : null) as any,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 2} color={color} />,
        }}
      />

      {/* 5. HISTORIQUE (Masqué pour l'Admin + Typage corrigé) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          href: (!isAdmin ? '/tabs/history' : null) as any, 
          tabBarIcon: ({ color, size }) => <History size={size - 2} color={color} />, 
        }}
      />

      {/* 6. INVOICE (Fichier physique existant caché du menu pour éviter le triangle bonus) */}
      <Tabs.Screen
        name="invoice"
        options={{
          href: null as any, 
        }}
      />

      {/* 7. PARAMÈTRES */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config', 
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}