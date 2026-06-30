import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Receipt,
  ChevronRight,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { getOrders } from '@/src/database/orders';
import { Order } from '@/src/types';

type FilterType = 'all' | 'completed' | 'pending' | 'cancelled';

// Helpers responsifs
const scaleSize = (size: number, width: number) => {
  const baseWidth = 375;
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function HistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallScreen = screenWidth < 360;
  const horizontalPadding = isSmallScreen ? 12 : 16;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Animation pour l'icône de refresh
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnimation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const all = await getOrders();
      const sorted = all.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Animation du refresh
  useEffect(() => {
    if (loading || refreshing) {
      const animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [loading, refreshing, spinValue]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `Il y a ${days} jours`;
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    completed: { label: 'Terminée', color: theme.success },
    pending: { label: 'En attente', color: theme.warning },
    cancelled: { label: 'Annulée', color: theme.error },
  };

  const paymentConfig: Record<string, string> = {
    cash: '💵 Espèces',
    card: '💳 Carte',
    mobile_money: '📱 Mobile',
  };

  const getStatus = (status: string) => statusConfig[status] || { label: status, color: theme.textSecondary };
  const getPayment = (method?: string) => (method && paymentConfig[method]) || '💰 Non défini';

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter = activeFilter === 'all' || order.status === activeFilter;
      const matchesSearch =
        searchQuery === '' ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.payment_method?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.date).toDateString() === today && o.status === 'completed'
    );
    return {
      count: todayOrders.length,
      total: todayOrders.reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Toutes', count: orders.length },
    { key: 'completed', label: 'Terminées', count: orders.filter(o => o.status === 'completed').length },
    { key: 'pending', label: 'En attente', count: orders.filter(o => o.status === 'pending').length },
    { key: 'cancelled', label: 'Annulées', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const renderOrder = ({ item }: { item: Order }) => {
    const status = getStatus(item.status);
    const iconSize = scaleSize(42, screenWidth);

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border, padding: scaleSize(14, screenWidth) }]}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/tabs/invoice', params: { orderId: item.id } })}
      >
        <View style={styles.orderHeader}>
          <View style={[styles.iconWrapper, { 
            backgroundColor: theme.primary + '15',
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
          }]}>
            <Receipt size={scaleSize(20, screenWidth)} color={theme.primary} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderId, { color: theme.text, fontSize: scaleFont(14) }]} numberOfLines={1}>
              {item.id}
            </Text>
            <Text style={[styles.orderDate, { color: theme.textSecondary, fontSize: scaleFont(12) }]} numberOfLines={1}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={[styles.orderTotal, { color: theme.primary, fontSize: scaleFont(15) }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(item.total)}
            </Text>
            <ChevronRight size={scaleSize(16, screenWidth)} color={theme.textSecondary} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.orderFooter}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color, fontSize: scaleFont(11) }]}>
              {status.label}
            </Text>
          </View>
          <Text style={[styles.paymentMethod, { color: theme.textSecondary, fontSize: scaleFont(11) }]} numberOfLines={1}>
            {getPayment(item.payment_method)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (initialLoad) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, fontSize: scaleFont(14) }]}>
          Chargement de l'historique...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(24) }]}>Historique</Text>
        <TouchableOpacity
          onPress={() => loadOrders(true)}
          style={[styles.refreshBtn, { 
            backgroundColor: theme.card,
            width: scaleSize(40, screenWidth),
            height: scaleSize(40, screenWidth),
            borderRadius: scaleSize(20, screenWidth),
          }]}
          disabled={refreshing}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={{ transform: [{ rotate: spinAnimation }] }}>
            <RefreshCw size={scaleSize(20, screenWidth)} color={theme.primary} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Statistiques du jour */}
      <View style={[styles.statsCard, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        marginHorizontal: horizontalPadding,
        padding: scaleSize(14, screenWidth),
      }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { 
              backgroundColor: theme.primary + '15',
              width: scaleSize(36, screenWidth),
              height: scaleSize(36, screenWidth),
              borderRadius: scaleSize(18, screenWidth),
            }]}>
              <TrendingUp size={scaleSize(16, screenWidth)} color={theme.primary} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>Aujourd'hui</Text>
            <Text style={[styles.statValue, { color: theme.text, fontSize: scaleFont(15) }]}>
              {stats.count} vente{stats.count > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={[styles.statsSeparator, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { 
              backgroundColor: theme.success + '15',
              width: scaleSize(36, screenWidth),
              height: scaleSize(36, screenWidth),
              borderRadius: scaleSize(18, screenWidth),
            }]}>
              <Receipt size={scaleSize(16, screenWidth)} color={theme.success} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>Total</Text>
            <Text style={[styles.statValue, { color: theme.primary, fontSize: scaleFont(15) }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(stats.total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchContainer, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.searchBox, { 
          backgroundColor: theme.card, 
          borderColor: theme.border,
          height: scaleSize(44, screenWidth),
        }]}>
          <Search size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text, fontSize: scaleFont(14) }]}
            placeholder="Rechercher une commande..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filtersList, { paddingHorizontal: horizontalPadding }]}
        renderItem={({ item: filter }) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.card,
                  borderColor: isActive ? theme.primary : theme.border,
                  paddingHorizontal: isSmallScreen ? 10 : 12,
                  paddingVertical: scaleSize(8, screenWidth),
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#FFFFFF' : theme.text, fontSize: scaleFont(12) },
                ]}
              >
                {filter.label}
              </Text>
              <View
                style={[
                  styles.filterCount,
                  {
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary, fontSize: scaleFont(10) },
                  ]}
                >
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Liste des commandes */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.ordersList,
          { paddingHorizontal: horizontalPadding },
          filteredOrders.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { paddingVertical: screenHeight * 0.12 }]}>
            <View style={[styles.emptyIcon, { 
              backgroundColor: theme.card, 
              borderColor: theme.border,
              width: scaleSize(72, screenWidth),
              height: scaleSize(72, screenWidth),
              borderRadius: scaleSize(36, screenWidth),
            }]}>
              <Receipt size={scaleSize(32, screenWidth)} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontSize: scaleFont(16) }]}>
              {searchQuery || activeFilter !== 'all' ? 'Aucun résultat' : 'Aucune vente'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary, fontSize: scaleFont(13) }]}>
              {searchQuery || activeFilter !== 'all'
                ? 'Essayez avec d\'autres critères'
                : 'Les ventes apparaîtront ici'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: '700',
  },
  refreshBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    marginBottom: 2,
  },
  statValue: {
    fontWeight: '700',
  },
  statsSeparator: {
    width: 1,
    height: 50,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  filtersList: {
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '600',
  },
  filterCount: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountText: {
    fontWeight: '700',
  },
  ordersList: {
    paddingBottom: 20,
    gap: 10,
  },
  emptyList: {
    flexGrow: 1,
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
  },
  orderId: {
    fontWeight: '600',
  },
  orderDate: {
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderTotal: {
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    opacity: 0.5,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontWeight: '600',
  },
  paymentMethod: {
    flexShrink: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});