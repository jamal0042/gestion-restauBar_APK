import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useAuthStore } from '@/src/store/authStore';
import { LayoutDashboard, Package, Users, BarChart3, Settings, Receipt } from 'lucide-react-native';

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
        tabBarPosition: 'bottom', 
        tabBarStyle: {
          backgroundColor: isDark ? '#212121' : '#FFFFFF',
          borderTopColor: isDark ? '#424242' : '#E0E0E0',
          borderTopWidth: 1,
          height: 60 + insets.bottom, 
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8, 
        },
        tabBarActiveTintColor: '#C2185B',
        tabBarInactiveTintColor: isDark ? '#9E9E9E' : '#757575',
        tabBarLabelStyle: {
          fontSize: 11, 
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      {/* 1. INDEX (Dashboard pour Admin / Ventes pour Cashier) */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Ventes',
          tabBarIcon: ({ color, size }) => (
            isAdmin ? <LayoutDashboard size={size} color={color} /> : <Receipt size={size} color={color} />
          ),
        }}
      />

      {/* 2. PRODUITS (Visible par tout le monde) */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />

      {/* 3. UTILISATEURS (Uniquement Admin) */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          // Si l'utilisateur n'est pas Admin, on supprime complètement le bouton du menu
          tabBarButton: isAdmin ? undefined : () => null,
        }}
      />

      {/* 4. RAPPORTS (Uniquement Admin) */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          tabBarButton: isAdmin ? undefined : () => null,
        }}
      />

      {/* 5. HISTORIQUE (Uniquement Cashier) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          tabBarButton: !isAdmin ? undefined : () => null,
        }}
      />

      {/* 6. INVOICE / FACTURES (Optionnel : Cache-le ici si présent dans tes fichiers) */}
      <Tabs.Screen
        name="invoice"
        options={{
          title: 'Factures',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
          tabBarButton: () => null, // Reste masqué de la barre principale si géré ailleurs
        }}
      />

      {/* 7. PARAMÈTRES (Visible par tout le monde) */}
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