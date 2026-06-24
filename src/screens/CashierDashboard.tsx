import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Banknote,
  X,
} from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { getProducts } from '@/src/database';
import { Product, CartItem } from '@/src/types';
import { useCartStore } from '@/src/store/cartStore';

const { width } = Dimensions.get('window');

export default function CashierDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const categories = ['all', 'Plats', 'Boissons', 'Cocktails', 'Desserts'];

  const loadProducts = useCallback(async () => {
    const all = await getProducts();
    setProducts(all);
    setFilteredProducts(all);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    let filtered = products.filter(p => p.disponible);
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categorie === selectedCategory);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const cartItem = items.find(i => i.product.id === item.id);
    const inCart = cartItem ? cartItem.quantite : 0;

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => addItem(item)}
        activeOpacity={0.8}
      >
        <View style={styles.productImagePlaceholder}>
          <Text style={styles.productImageText}>{item.nom.charAt(0)}</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
            {item.nom}
          </Text>
          <Text style={[styles.productCategory, { color: theme.textSecondary }]}>
            {item.categorie}
          </Text>
          <Text style={[styles.productPrice, { color: theme.primary }]}>
            {formatCurrency(item.prix)}
          </Text>
        </View>
        {inCart > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.badgeText, { color: theme.white }]}>{inCart}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItem, { borderBottomColor: theme.border }]}>
      <View style={styles.cartItemInfo}>
        <Text style={[styles.cartItemName, { color: theme.text }]}>{item.product.nom}</Text>
        <Text style={[styles.cartItemPrice, { color: theme.textSecondary }]}>
          {formatCurrency(item.product.prix)} x {item.quantite}
        </Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity
          style={[styles.qtyButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => updateQuantity(item.product.id, item.quantite - 1)}
        >
          <Minus size={16} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantite}</Text>
        <TouchableOpacity
          style={[styles.qtyButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => updateQuantity(item.product.id, item.quantite + 1)}
        >
          <Plus size={16} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: theme.error + '15' }]}
          onPress={() => removeItem(item.product.id)}
        >
          <Trash2 size={16} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nouvelle vente</Text>
        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowCart(true)}
        >
          <ShoppingCart size={20} color={theme.white} />
          {items.length > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: theme.white }]}>
              <Text style={[styles.cartBadgeText, { color: theme.primary }]}>
                {items.reduce((s, i) => s + i.quantite, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
        <Search size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Rechercher un produit..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === item ? theme.primary : theme.surface,
                  borderColor: selectedCategory === item ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedCategory(item)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: selectedCategory === item ? theme.white : theme.textSecondary },
                ]}
              >
                {item === 'all' ? 'Tous' : item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun produit trouvé
            </Text>
          </View>
        }
      />

      {/* Cart Modal */}
      {showCart && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.cartPanel, { backgroundColor: theme.background }]}>
            <View style={styles.cartHeader}>
              <Text style={[styles.cartTitle, { color: theme.text }]}>Panier</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyCart}>
                <ShoppingCart size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyCartText, { color: theme.textSecondary }]}>
                  Votre panier est vide
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={items}
                  renderItem={renderCartItem}
                  keyExtractor={(item) => item.product.id}
                  contentContainerStyle={styles.cartList}
                />
                <View style={[styles.cartFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                    <Text style={[styles.totalValue, { color: theme.primary }]}>
                      {formatCurrency(getTotal())}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.paymentButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      setShowCart(false);
                      setShowPayment(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.paymentButtonText, { color: theme.white }]}>
                      Payer
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.paymentPanel, { backgroundColor: theme.background }]}>
            <View style={styles.cartHeader}>
              <Text style={[styles.cartTitle, { color: theme.text }]}>Paiement</Text>
              <TouchableOpacity onPress={() => setShowPayment(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentTotal}>
              <Text style={[styles.paymentTotalLabel, { color: theme.textSecondary }]}>
                Total à payer
              </Text>
              <Text style={[styles.paymentTotalValue, { color: theme.primary }]}>
                {formatCurrency(getTotal())}
              </Text>
            </View>

            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[styles.paymentMethod, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setShowPayment(false);
                  router.push({
                    pathname: '/tabs/invoice',
                    params: { method: 'cash', total: getTotal() },
                  } as any);
                }}
                activeOpacity={0.8}
              >
                <Banknote size={28} color={theme.success} />
                <Text style={[styles.paymentMethodText, { color: theme.text }]}>Espèces</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentMethod, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setShowPayment(false);
                  router.push({
                    pathname: '/tabs/invoice',
                    params: { method: 'card', total: getTotal() },
                  } as any);
                }}
                activeOpacity={0.8}
              >
                <CreditCard size={28} color={theme.primary} />
                <Text style={[styles.paymentMethodText, { color: theme.text }]}>Carte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentMethod, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setShowPayment(false);
                  router.push({
                    pathname: '/tabs/invoice',
                    params: { method: 'mobile_money', total: getTotal() },
                  } as any);
                }}
                activeOpacity={0.8}
              >
                <Smartphone size={28} color={theme.warning} />
                <Text style={[styles.paymentMethodText, { color: theme.text }]}>Mobile Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  productsList: {
    padding: 12,
    gap: 12,
  },
  productCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    margin: 4,
    position: 'relative',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#C2185B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productImageText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  cartPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cartList: {
    paddingBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  paymentButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    fontSize: 16,
    marginTop: 12,
  },
  paymentPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  paymentTotal: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentTotalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  paymentTotalValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
