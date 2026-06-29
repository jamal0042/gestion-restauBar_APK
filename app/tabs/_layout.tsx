import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
// Importation des bonnes icônes (Vérifie que Receipt et History sont bien importés)
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
        // REND LE MENU COMPACT : Met l'icône à gauche et le texte à côté pour éviter les "Dashb..."
        tabBarLabelPosition: 'beside-icon', 
        tabBarStyle: {
          backgroundColor: isDark ? '#212121' : '#FFFFFF',
          borderTopColor: isDark ? '#424242' : '#E0E0E0',
          borderTopWidth: 1,
          height: 54 + insets.bottom, // Un peu plus compact pour le mode "côte à côte"
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
      {/* 1. DASHBOARD / VENTES (index) */}
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

      {/* 3. UTILISATEURS (Visible UNIQUEMENT pour Admin) */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Staff', // "Staff" est plus court qu "Utilisateurs", ça aide l'écran !
          href: isAdmin ? '/users' : null, // Masque complètement l'onglet si pas admin
          tabBarIcon: ({ color, size }) => <Users size={size - 2} color={color} />,
        }}
      />

      {/* 4. RAPPORTS (Visible UNIQUEMENT pour Admin) */}
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          href: isAdmin ? '/reports' : null, // Masque si pas admin
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 2} color={color} />,
        }}
      />

      {/* 5. HISTORIQUE (Visible UNIQUEMENT pour les non-admins) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          href: !isAdmin ? '/history' : null, // Masque si admin (évite le doublon sur ton écran)
          tabBarIcon: ({ color, size }) => <History size={size - 2} color={color} />, 
        }}
      />

      {/* 6. INVOICE (Si c'est un fichier physique existant dans ton dossier app, on le cache ici) */}
      <Tabs.Screen
        name="invoice"
        options={{
          href: null, // Masque complètement du menu du bas car doublon avec l'index/ventes
        }}
      />

      {/* 7. PARAMÈTRES */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config', // Plus court que "Paramètres"
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}