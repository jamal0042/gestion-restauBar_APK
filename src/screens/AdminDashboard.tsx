import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  RefreshControl,
} from 'react-native';
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

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Tableau de bord</Text>
        <Text style={[styles.headerDate, { color: theme.textSecondary }]}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => router.push(stat.route as any)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: stat.color + '15' }]}>
              <stat.icon size={24} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
            <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{stat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Produits les plus vendus</Text>
          <TouchableOpacity onPress={() => router.push('/tabs/products' as any)}>
            <ArrowRight size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
        {topProducts.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucune vente aujourd'hui</Text>
        ) : (
          topProducts.map((product, index) => (
            <View key={index} style={[styles.productRow, { borderBottomColor: theme.border }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.productRank, { color: theme.primary }]}>#{index + 1}</Text>
                <Text style={[styles.productName, { color: theme.text }]}>{product.nom}</Text>
              </View>
              <View style={styles.productStats}>
                <Text style={[styles.productQty, { color: theme.textSecondary }]}>{product.quantite} vendu(s)</Text>
                <Text style={[styles.productTotal, { color: theme.primary }]}>
                  {formatCurrency(product.total)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {lowStock.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.error }]}>Stock faible</Text>
            <TouchableOpacity onPress={() => router.push('/tabs/products' as any)}>
              <ArrowRight size={20} color={theme.error} />
            </TouchableOpacity>
          </View>
          {lowStock.map((product, index) => (
            <View key={index} style={[styles.stockRow, { borderBottomColor: theme.border }]}>
              <View style={styles.stockInfo}>
                <AlertTriangle size={18} color={theme.warning} />
                <Text style={[styles.stockName, { color: theme.text }]}>{product.nom}</Text>
              </View>
              <Text style={[styles.stockValue, { color: theme.error }]}>
                {product.stock} restant(s)
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Accès rapide</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/tabs/products' as any)}
            activeOpacity={0.8}
          >
            <Package size={24} color={theme.white} />
            <Text style={[styles.actionText, { color: theme.white }]}>Produits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/tabs/users' as any)}
            activeOpacity={0.8}
          >
            <ShoppingBag size={24} color={theme.white} />
            <Text style={[styles.actionText, { color: theme.white }]}>Utilisateurs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/tabs/reports' as any)}
            activeOpacity={0.8}
          >
            <TrendingUp size={24} color={theme.white} />
            <Text style={[styles.actionText, { color: theme.white }]}>Rapports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerDate: {
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productRank: {
    fontSize: 14,
    fontWeight: '700',
    width: 28,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
  },
  productStats: {
    alignItems: 'flex-end',
  },
  productQty: {
    fontSize: 12,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockName: {
    fontSize: 14,
    fontWeight: '500',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
