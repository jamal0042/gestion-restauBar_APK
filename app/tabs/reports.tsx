import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { getDailySales, getTopProducts } from '@/src/database/orders';

// Helpers responsifs
const scaleSize = (size: number, width: number) => {
  const baseWidth = 375;
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallScreen = screenWidth < 360;

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

  // Taille dynamique du graphique selon l'écran
  const chartHeight = scaleSize(120, screenWidth);
  const barWidth = scaleSize(isSmallScreen ? 18 : 24, screenWidth);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isSmallScreen ? 12 : 20 }]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(24) }]}>Rapports</Text>
      </View>

      {/* Date Selector */}
      <View style={[styles.dateBar, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        marginHorizontal: isSmallScreen ? 12 : 16,
        padding: scaleSize(12, screenWidth),
      }]}>
        <TouchableOpacity 
          onPress={() => changeDate(-1)} 
          style={styles.dateArrow}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={scaleSize(22, screenWidth)} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Calendar size={scaleSize(16, screenWidth)} color={theme.primary} />
          <Text style={[styles.dateText, { color: theme.text, fontSize: scaleFont(14) }]} numberOfLines={1}>
            {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => changeDate(1)} 
          style={styles.dateArrow}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight size={scaleSize(22, screenWidth)} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Daily Stats */}
      <View style={[styles.statsGrid, { paddingHorizontal: isSmallScreen ? 12 : 16, gap: isSmallScreen ? 8 : 12 }]}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border, padding: scaleSize(14, screenWidth) }]}>
          <View style={[styles.statIcon, { 
            backgroundColor: theme.primary + '15',
            width: scaleSize(36, screenWidth),
            height: scaleSize(36, screenWidth),
            borderRadius: scaleSize(9, screenWidth),
            marginBottom: scaleSize(10, screenWidth),
          }]}>
            <DollarSign size={scaleSize(18, screenWidth)} color={theme.primary} />
          </View>
          <Text style={[styles.statValue, { color: theme.text, fontSize: scaleFont(17) }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(dailySales.total)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>CA du jour</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border, padding: scaleSize(14, screenWidth) }]}>
          <View style={[styles.statIcon, { 
            backgroundColor: theme.success + '15',
            width: scaleSize(36, screenWidth),
            height: scaleSize(36, screenWidth),
            borderRadius: scaleSize(9, screenWidth),
            marginBottom: scaleSize(10, screenWidth),
          }]}>
            <ShoppingBag size={scaleSize(18, screenWidth)} color={theme.success} />
          </View>
          <Text style={[styles.statValue, { color: theme.text, fontSize: scaleFont(17) }]}>
            {dailySales.count}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>Ventes</Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={[styles.section, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        marginHorizontal: isSmallScreen ? 12 : 16,
        padding: scaleSize(14, screenWidth),
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaleFont(15) }]}>7 derniers jours</Text>
        <View style={[styles.chartContainer, { height: chartHeight + scaleSize(40, screenWidth) }]}>
          {weekData.map((day, index) => {
            const height = (day.sales / maxSales) * chartHeight;
            const isToday = day.sales === dailySales.total && dailySales.total > 0;
            return (
              <View key={index} style={styles.chartBarWrapper}>
                <Text style={[styles.chartValue, { color: theme.text, fontSize: scaleFont(9) }]}>
                  {day.sales > 0 ? (day.sales / 1000).toFixed(0) + 'k' : '0'}
                </Text>
                <View style={[styles.chartBarContainer, { height: chartHeight }]}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: Math.max(height, scaleSize(4, screenWidth)),
                        width: barWidth,
                        backgroundColor: isToday ? theme.primary : theme.primary + '50',
                        borderRadius: scaleSize(4, screenWidth),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartDay, { color: theme.textSecondary, fontSize: scaleFont(10) }]}>{day.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Top Products */}
      <View style={[styles.section, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        marginHorizontal: isSmallScreen ? 12 : 16,
        padding: scaleSize(14, screenWidth),
      }]}>
        <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaleFont(15) }]}>Produits les plus vendus</Text>
        {topProducts.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: scaleFont(13) }]}>Aucune vente ce jour</Text>
        ) : (
          topProducts.map((product, index) => (
            <View key={index} style={[styles.productRow, { borderBottomColor: theme.border, paddingVertical: scaleSize(10, screenWidth) }]}>
              <View style={styles.productInfo}>
                <Text style={[styles.rank, { color: theme.primary, fontSize: scaleFont(13), width: scaleSize(26, screenWidth) }]}>#{index + 1}</Text>
                <Text style={[styles.productName, { color: theme.text, fontSize: scaleFont(13) }]} numberOfLines={1}>
                  {product.nom}
                </Text>
              </View>
              <View style={styles.productStats}>
                <Text style={[styles.productQty, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>{product.quantite} vendu(s)</Text>
                <Text style={[styles.productTotal, { color: theme.primary, fontSize: scaleFont(13) }]}>{formatCurrency(product.total)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingHorizontal: isSmallScreen ? 12 : 16 }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { 
            backgroundColor: theme.card, 
            borderColor: theme.border,
            height: scaleSize(48, screenWidth),
          }]}
          activeOpacity={0.8}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Download size={scaleSize(18, screenWidth)} color={theme.text} />
          <Text style={[styles.actionBtnText, { color: theme.text, fontSize: scaleFont(14) }]}>Exporter PDF</Text>
        </TouchableOpacity>
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
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    flex: 1,
    justifyContent: 'center',
  },
  dateText: {
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBar: {
    // width et borderRadius dynamiques via inline style
  },
  chartDay: {
    marginTop: 6,
  },
  chartValue: {
    marginBottom: 4,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0, // Permet le truncation
  },
  rank: {
    fontWeight: '700',
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
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
  },
  actions: {
    paddingBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontWeight: '600',
  },
});