import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import crucial pour la flexibilité
import { useAuthStore } from '@/src/store/authStore';
import { LayoutDashboard, Package, Users, BarChart3, Settings, Receipt } from 'lucide-react-native';

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets(); // Récupère les zones sécurisées de l'écran (notch, home indicator)

  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'bottom', // Force la position en bas
        tabBarStyle: {
          backgroundColor: isDark ? '#212121' : '#FFFFFF',
          borderTopColor: isDark ? '#424242' : '#E0E0E0',
          borderTopWidth: 1,
          
          // --- CONFIGURATION DYNAMIQUE ET FLEXIBLE ---
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
      {/* 1. Onglet Principal (Dashboard ou Ventes) - Toujours visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Ventes',
          tabBarIcon: ({ color, size }) => (
            isAdmin ? <LayoutDashboard size={size} color={color} /> : <Receipt size={size} color={color} />
          ),
        }}
      />

      {/* 2. Produits - Toujours visible pour Admin et Cashier */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />

      {/* 3. Utilisateurs - Visible SEULEMENT pour l'Admin, masqué sans crash pour le Cashier */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          href: isAdmin ? '/users' : null, // Si pas admin, l'onglet disparaît complètement sans chercher le fichier
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />

      {/* 4. Rapports - Visible SEULEMENT pour l'Admin */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          href: isAdmin ? '/reports' : null, // Masqué proprement si c'est le cashier
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />

      {/* 5. Historique - Visible SEULEMENT pour le Cashier */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          href: !isAdmin ? '/history' : null, // Masqué proprement si c'est l'admin
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />

      {/* 6. Paramètres - Toujours visible */}
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