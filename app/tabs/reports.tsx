import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { getDailySales, getTopProducts, getOrders } from '@/src/database/orders';
import { getToday } from '@/src/utils/date';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySales, setDailySales] = useState({ total: 0, count: 0 });
  const [topProducts, setTopProducts] = useState<{ nom: string; quantite: number; total: number }[]>([]);
  const [weekData, setWeekData] = useState<{ day: string; sales: number; orders: number }[]>([]);

  const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const loadData = useCallback(async () => {
    const dateStr = formatDateStr(selectedDate);
    const sales = await getDailySales(dateStr);
    setDailySales(sales);
    const top = await getTopProducts(dateStr, 5);
    setTopProducts(top);

    // Load last 7 days
    const week: { day: string; sales: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - i);
      const dStr = formatDateStr(d);
      const s = await getDailySales(dStr);
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      week.push({
        day: dayNames[d.getDay()],
        sales: s.total,
        orders: s.count,
      });
    }
    setWeekData(week);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const maxSales = Math.max(...weekData.map(d => d.sales), 1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Rapports</Text>
      </View>

      {/* Date Selector */}
      <View style={[styles.dateBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Calendar size={18} color={theme.primary} />
          <Text style={[styles.dateText, { color: theme.text }]}>
            {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
          <ChevronRight size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Daily Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.primary + '15' }]}>
            <DollarSign size={20} color={theme.primary} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {formatCurrency(dailySales.total)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>CA du jour</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.success + '15' }]}>
            <ShoppingBag size={20} color={theme.success} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {dailySales.count}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Ventes</Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>7 derniers jours</Text>
        <View style={styles.chartContainer}>
          {weekData.map((day, index) => {
            const height = (day.sales / maxSales) * 120;
            return (
              <View key={index} style={styles.chartBarWrapper}>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max(height, 4),
                        backgroundColor: day.sales === dailySales.total ? theme.primary : theme.primary + '50',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartDay, { color: theme.textSecondary }]}>{day.day}</Text>
                <Text style={[styles.chartValue, { color: theme.text }]}>
                  {day.sales > 0 ? (day.sales / 1000).toFixed(0) + 'k' : '0'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Top Products */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Produits les plus vendus</Text>
        {topProducts.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucune vente ce jour</Text>
        ) : (
          topProducts.map((product, index) => (
            <View key={index} style={[styles.productRow, { borderBottomColor: theme.border }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.rank, { color: theme.primary }]}>#{index + 1}</Text>
                <Text style={[styles.productName, { color: theme.text }]}>{product.nom}</Text>
              </View>
              <View style={styles.productStats}>
                <Text style={[styles.productQty, { color: theme.textSecondary }]}>{product.quantite} vendu(s)</Text>
                <Text style={[styles.productTotal, { color: theme.primary }]}>{formatCurrency(product.total)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]
            }
          activeOpacity={0.8}
        >
          <Download size={20} color={theme.text} />
          <Text style={[styles.actionBtnText, { color: theme.text }]}>Exporter PDF</Text>
        </TouchableOpacity>
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
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateArrow: {
    padding: 8,
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingBottom: 8,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    height: 120,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBar: {
    width: 24,
    borderRadius: 4,
  },
  chartDay: {
    fontSize: 11,
    marginTop: 6,
  },
  chartValue: {
    fontSize: 10,
    marginTop: 2,
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
  rank: {
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
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  actions: {
    padding: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
