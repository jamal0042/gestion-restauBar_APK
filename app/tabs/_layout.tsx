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
      {/* 1. L'index (Premier onglet) : Reste fixe mais adapte son contenu visuel selon le rôle */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Vente',
          tabBarIcon: ({ color, size }) => (
            isAdmin ? <LayoutDashboard size={size} color={color} /> : <Receipt size={size} color={color} />
          ),
        }}
      />

      {/* 2. Produits : Accessible par tout le monde (Admin et Caissier) */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />

      {/* 3. Utilisateurs : Masqué pour le caissier via href: null */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          href: isAdmin ? '/users' : null, // C'est ici que la magie opère
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />

      {/* 4. Rapports : Uniquement pour l'Admin */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          href: isAdmin ? '/reports' : null,
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />

      {/* 5. Historique : Uniquement pour le Caissier (Masqué pour l'Admin) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          href: !isAdmin ? '/history' : null,
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />, // Utilisation de l'icône History pour plus de clarté
        }}
      />

      {/* 6. Paramètres : Accessible par tout le monde */}
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