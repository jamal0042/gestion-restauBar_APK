import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
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

export default function HistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Animation pour l'icône de refresh
  const spinValue = new Animated.Value(0);
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
      // Tri par date décroissante (plus récentes en premier)
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
  }, [loading, refreshing]);

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

  // Mappings au lieu de switch pour plus de lisibilité
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

  // Filtrage et recherche optimisés avec useMemo
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

  // Statistiques du jour
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
    
    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/tabs/invoice', params: { orderId: item.id } })}
      >
        <View style={styles.orderHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.primary + '15' }]}>
            <Receipt size={20} color={theme.primary} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderId, { color: theme.text }]}>{item.id}</Text>
            <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={[styles.orderTotal, { color: theme.primary }]}>
              {formatCurrency(item.total)}
            </Text>
            <ChevronRight size={18} color={theme.textSecondary} />
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        
        <View style={styles.orderFooter}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          <Text style={[styles.paymentMethod, { color: theme.textSecondary }]}>
            {getPayment(item.payment_method)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (initialLoad) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Chargement de l'historique...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Historique</Text>
        <TouchableOpacity 
          onPress={() => loadOrders(true)} 
          style={[styles.refreshBtn, { backgroundColor: theme.card }]}
          disabled={refreshing}
        >
          <Animated.View style={{ transform: [{ rotate: spinAnimation }] }}>
            <RefreshCw size={20} color={theme.primary} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Statistiques du jour */}
      <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: theme.primary + '15' }]}>
              <TrendingUp size={18} color={theme.primary} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aujourd'hui</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.count} vente{stats.count > 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.statsSeparator, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: theme.success + '15' }]}>
              <Receipt size={18} color={theme.success} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
            <Text style={[styles.statValue, { color: theme.primary }]} numberOfLines={1}>
              {formatCurrency(stats.total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Rechercher une commande..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.card,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#FFFFFF' : theme.text },
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
                    { color: isActive ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.ordersList,
          filteredOrders.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Receipt size={40} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery || activeFilter !== 'all' ? 'Aucun résultat' : 'Aucune vente'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
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
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsSeparator: {
    width: 1,
    height: 50,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
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
    fontSize: 11,
    fontWeight: '700',
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  emptyList: {
    flexGrow: 1,
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
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
    fontSize: 12,
    fontWeight: '600',
  },
  paymentMethod: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});