import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowRight,
} from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { getDailySales, getTopProducts, getLowStockProducts } from '@/src/database';
import { getToday } from '@/src/utils/date';

// Helpers responsifs
const scaleSize = (size: number, width: number) => {
  const baseWidth = 375;
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function AdminDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallScreen = screenWidth < 360;
  const horizontalPadding = isSmallScreen ? 12 : 16;

  const [todaySales, setTodaySales] = useState({ total: 0, count: 0 });
  const [topProducts, setTopProducts] = useState<{ nom: string; quantite: number; total: number }[]>([]);
  const [lowStock, setLowStock] = useState<{ id: string; nom: string; stock: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const today = getToday();
    const sales = await getDailySales(today);
    setTodaySales(sales);
    const top = await getTopProducts(today, 5);
    setTopProducts(top);
    const low = await getLowStockProducts(10);
    setLowStock(low.map(p => ({ id: p.id, nom: p.nom, stock: p.stock })));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: 'CA du jour',
      value: formatCurrency(todaySales.total),
      icon: DollarSign,
      color: '#C2185B',
      route: '/tabs/reports',
    },
    {
      title: 'Ventes auj.',
      value: todaySales.count.toString(),
      icon: ShoppingBag,
      color: '#D32F2F',
      route: '/tabs/reports',
    },
    {
      title: 'Produits',
      value: 'Top 5',
      icon: TrendingUp,
      color: '#388E3C',
      route: '/tabs/products',
    },
    {
      title: 'Stock faible',
      value: lowStock.length.toString(),
      icon: AlertTriangle,
      color: '#F57C00',
      route: '/tabs/products',
    },
  ];

  // Calcul dynamique de la largeur des cartes stats (2 par ligne)
  const statCardWidth = (screenWidth - (horizontalPadding * 2) - 12) / 2;
  const iconBoxSize = scaleSize(40, screenWidth);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(24) }]}>
          Tableau de bord
        </Text>
        <Text style={[styles.headerDate, { color: theme.textSecondary, fontSize: scaleFont(13) }]}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={[styles.statsGrid, { paddingHorizontal: horizontalPadding }]}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                width: statCardWidth,
                padding: scaleSize(14, screenWidth),
              },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push(stat.route as any)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <View style={[styles.iconWrapper, {
              backgroundColor: stat.color + '15',
              width: iconBoxSize,
              height: iconBoxSize,
              borderRadius: scaleSize(10, screenWidth),
            }]}>
              <stat.icon size={scaleSize(22, screenWidth)} color={stat.color} />
            </View>
            <Text
              style={[styles.statValue, { color: theme.text, fontSize: scaleFont(16) }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stat.value}
            </Text>
            <Text style={[styles.statTitle, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
              {stat.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top Products Section */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderColor: theme.border,
        marginHorizontal: horizontalPadding,
        padding: scaleSize(14, screenWidth),
      }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaleFont(15) }]}>
            Produits les plus vendus
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/tabs/products' as any)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowRight size={scaleSize(20, screenWidth)} color={theme.primary} />
          </TouchableOpacity>
        </View>
        {topProducts.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: scaleFont(13) }]}>
            Aucune vente aujourd'hui
          </Text>
        ) : (
          topProducts.map((product, index) => (
            <View key={index} style={[styles.productRow, { borderBottomColor: theme.border }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.productRank, { color: theme.primary, fontSize: scaleFont(13), width: scaleSize(26, screenWidth) }]}>
                  #{index + 1}
                </Text>
                <Text style={[styles.productName, { color: theme.text, fontSize: scaleFont(13) }]} numberOfLines={1}>
                  {product.nom}
                </Text>
              </View>
              <View style={styles.productStats}>
                <Text style={[styles.productQty, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
                  {product.quantite} vendu(s)
                </Text>
                <Text style={[styles.productTotal, { color: theme.primary, fontSize: scaleFont(13) }]}>
                  {formatCurrency(product.total)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Low Stock Section */}
      {lowStock.length > 0 && (
        <View style={[styles.section, {
          backgroundColor: theme.card,
          borderColor: theme.border,
          marginHorizontal: horizontalPadding,
          padding: scaleSize(14, screenWidth),
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.error, fontSize: scaleFont(15) }]}>
              Stock faible
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/tabs/products' as any)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowRight size={scaleSize(20, screenWidth)} color={theme.error} />
            </TouchableOpacity>
          </View>
          {lowStock.map((product, index) => (
            <View key={index} style={[styles.stockRow, { borderBottomColor: theme.border }]}>
              <View style={styles.stockInfo}>
                <AlertTriangle size={scaleSize(16, screenWidth)} color={theme.warning} />
                <Text style={[styles.stockName, { color: theme.text, fontSize: scaleFont(13) }]} numberOfLines={1}>
                  {product.nom}
                </Text>
              </View>
              <Text style={[styles.stockValue, { color: theme.error, fontSize: scaleFont(13) }]}>
                {product.stock} restant(s)
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions Section */}
      <View style={[styles.section, {
        backgroundColor: theme.card,
        borderColor: theme.border,
        marginHorizontal: horizontalPadding,
        padding: scaleSize(14, screenWidth),
      }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaleFont(15) }]}>
            Accès rapide
          </Text>
        </View>
        <View style={[styles.quickActions, { gap: isSmallScreen ? 8 : 12 }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary, padding: scaleSize(14, screenWidth) }]}
            onPress={() => router.push('/tabs/products' as any)}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Package size={scaleSize(22, screenWidth)} color={theme.white} />
            <Text style={[styles.actionText, { color: theme.white, fontSize: scaleFont(12) }]}>Produits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary, padding: scaleSize(14, screenWidth) }]}
            onPress={() => router.push('/tabs/users' as any)}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <ShoppingBag size={scaleSize(22, screenWidth)} color={theme.white} />
            <Text style={[styles.actionText, { color: theme.white, fontSize: scaleFont(12) }]}>Utilisateurs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary, padding: scaleSize(14, screenWidth) }]}
            onPress={() => router.push('/tabs/reports' as any)}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <TrendingUp size={scaleSize(22, screenWidth)} color={theme.white} />
            <Text style={[styles.actionText, { color: theme.white, fontSize: scaleFont(12) }]}>Rapports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: insets.bottom + scaleSize(32, screenWidth) }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerDate: {
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontWeight: '500',
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  productRank: {
    fontWeight: '700',
    flexShrink: 0,
  },
  productName: {
    fontWeight: '500',
    flexShrink: 1,
  },
  productStats: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  productQty: {
    marginBottom: 2,
  },
  productTotal: {
    fontWeight: '700',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  stockName: {
    fontWeight: '500',
    flexShrink: 1,
  },
  stockValue: {
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
  },
  quickActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontWeight: '600',
  },
});