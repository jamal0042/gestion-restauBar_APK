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
          // Le height s'adapte automatiquement : base de 60px + la zone sécurisée du bas de l'appareil
          height: 60 + insets.bottom, 
          paddingTop: 8,
          // Si l'appareil n'a pas de zone sécurisée en bas (ex: vieux Android), on met 8px par défaut
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8, 
        },
        tabBarActiveTintColor: '#C2185B',
        tabBarInactiveTintColor: isDark ? '#9E9E9E' : '#757575',
        tabBarLabelStyle: {
          fontSize: 11, // Légèrement réduit pour éviter que le texte ne se cache sur les petits écrans
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Ventes',
          tabBarIcon: ({ color, size }) => (
            isAdmin ? <LayoutDashboard size={size} color={color} /> : <Receipt size={size} color={color} />
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
      {isAdmin && (
        <Tabs.Screen
          name="users"
          options={{
            title: 'Utilisateurs',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
      )}
      {isAdmin && (
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Rapports',
            tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          }}
        />
      )}
      {!isAdmin && (
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historique',
            tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
          }}
        />
      )}
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