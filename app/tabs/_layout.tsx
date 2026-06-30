import { Tabs } from 'expo-router';
import { useColorScheme, Platform, PixelRatio, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  Receipt,
} from 'lucide-react-native';

const scaleSize = (size: number, width: number) => {
  const baseWidth = 375;
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function TabsLayout() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === 'dark';
  const isAdmin = user?.role === 'admin';
  const isSmallScreen = screenWidth < 360;

  const colors = {
    tabBarBg: isDark ? '#212121' : '#FFFFFF',
    borderTop: isDark ? '#424242' : '#E0E0E0',
    activeTint: '#C2185B',
    inactiveTint: isDark ? '#9E9E9E' : '#757575',
  };

  // ✅ Hauteur FIXE calculée une seule fois pour éviter le saut
  const tabBarBaseHeight = Platform.OS === 'ios'
    ? scaleSize(88, screenWidth)
    : scaleSize(isSmallScreen ? 64 : 72, screenWidth);

  const safeBottom = Platform.OS === 'ios'
    ? Math.max(insets.bottom, scaleSize(28, screenWidth))
    : Math.max(insets.bottom, scaleSize(12, screenWidth));

  const totalTabBarHeight = tabBarBaseHeight + safeBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.borderTop,
          borderTopWidth: 1,
          // ✅ Hauteur TOTALE fixe pour éviter le recalcul quand un onglet se cache
          height: totalTabBarHeight,
          paddingTop: scaleSize(10, screenWidth),
          paddingBottom: safeBottom,
        },
        tabBarActiveTintColor: colors.activeTint,
        tabBarInactiveTintColor: colors.inactiveTint,
        tabBarLabelStyle: {
          fontSize: scaleFont(isSmallScreen ? 10 : 12),
          fontWeight: '500',
          marginTop: scaleSize(4, screenWidth),
        },
        tabBarIconStyle: {
          marginTop: scaleSize(2, screenWidth),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Ventes',
          tabBarIcon: ({ color, size }) =>
            isAdmin
              ? <LayoutDashboard size={scaleSize(size, screenWidth)} color={color} />
              : <Receipt size={scaleSize(size, screenWidth)} color={color} />,
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          tabBarIcon: ({ color, size }) => (
            <Package size={scaleSize(size, screenWidth)} color={color} />
          ),
        }}
      />

      {/* ✅ CORRECTION : tabBarItemStyle au lieu de tabBarStyle pour masquer */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Utilisateurs',
          tabBarIcon: ({ color, size }) => (
            <Users size={scaleSize(size, screenWidth)} color={color} />
          ),
          tabBarItemStyle: { display: isAdmin ? 'flex' : 'none' },
          href: isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={scaleSize(size, screenWidth)} color={color} />
          ),
          tabBarItemStyle: { display: isAdmin ? 'flex' : 'none' },
          href: isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={scaleSize(size, screenWidth)} color={color} />
          ),
          tabBarItemStyle: { display: !isAdmin ? 'flex' : 'none' },
          href: !isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => (
            <Settings size={scaleSize(size, screenWidth)} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}