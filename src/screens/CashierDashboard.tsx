import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// ✅ Constantes extraites pour éviter les faux positifs du linter
const CATEGORIES = ['all', 'Plats', 'Boissons', 'Cocktails', 'Desserts'] as const;

const PAYMENT_METHODS = [
  { method: 'cash', label: 'Espèces', icon: Banknote, colorKey: 'success' },
  { method: 'card', label: 'Carte', icon: CreditCard, colorKey: 'primary' },
  { method: 'mobile_money', label: 'Mobile Money', icon: Smartphone, colorKey: 'warning' },
] as const;

// Helpers responsifs
const scaleSize = (size: number, width: number) => {
  const baseWidth = 375;
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function CashierDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { items, addItem, removeItem, updateQuantity, getTotal } = useCartStore();

  const isSmallScreen = screenWidth < 360;
  const horizontalPadding = isSmallScreen ? 12 : 16;

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Calcul dynamique de la largeur des cartes produit (2 colonnes)
  const productCardWidth = (screenWidth - (horizontalPadding * 2) - 12) / 2;
  const modalMaxHeight = screenHeight < 600 ? '92%' : '85%';

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
    const imgHeight = scaleSize(isSmallScreen ? 64 : 80, screenWidth);

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            width: productCardWidth,
            padding: scaleSize(10, screenWidth),
          },
        ]}
        onPress={() => addItem(item)}
        activeOpacity={0.8}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <View style={[styles.productImagePlaceholder, { height: imgHeight, borderRadius: scaleSize(8, screenWidth) }]}>
          <Text style={[styles.productImageText, { fontSize: scaleFont(24) }]}>
            {item.nom.charAt(0)}
          </Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.text, fontSize: scaleFont(13) }]} numberOfLines={1}>
            {item.nom}
          </Text>
          <Text style={[styles.productCategory, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
            {item.categorie}
          </Text>
          <Text style={[styles.productPrice, { color: theme.primary, fontSize: scaleFont(14) }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(item.prix)}
          </Text>
        </View>
        {inCart > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.badgeText, { color: theme.white, fontSize: scaleFont(11) }]}>
              {inCart}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const btnSize = scaleSize(32, screenWidth);
    return (
      <View style={[styles.cartItem, { borderBottomColor: theme.border }]}>
        <View style={styles.cartItemInfo}>
          <Text style={[styles.cartItemName, { color: theme.text, fontSize: scaleFont(14) }]} numberOfLines={1}>
            {item.product.nom}
          </Text>
          <Text style={[styles.cartItemPrice, { color: theme.textSecondary, fontSize: scaleFont(12) }]}>
            {formatCurrency(item.product.prix)} x {item.quantite}
          </Text>
        </View>
        <View style={styles.cartItemActions}>
          <TouchableOpacity
            style={[styles.qtyButton, { backgroundColor: theme.surface, borderColor: theme.border, width: btnSize, height: btnSize }]}
            onPress={() => updateQuantity(item.product.id, item.quantite - 1)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Minus size={scaleSize(14, screenWidth)} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.qtyText, { color: theme.text, fontSize: scaleFont(14), minWidth: scaleSize(24, screenWidth) }]}>
            {item.quantite}
          </Text>
          <TouchableOpacity
            style={[styles.qtyButton, { backgroundColor: theme.surface, borderColor: theme.border, width: btnSize, height: btnSize }]}
            onPress={() => updateQuantity(item.product.id, item.quantite + 1)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Plus size={scaleSize(14, screenWidth)} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.error + '15', width: btnSize, height: btnSize }]}
            onPress={() => removeItem(item.product.id)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Trash2 size={scaleSize(14, screenWidth)} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(22) }]}>Nouvelle vente</Text>
        <TouchableOpacity
          style={[styles.cartButton, {
            backgroundColor: theme.primary,
            width: scaleSize(46, screenWidth),
            height: scaleSize(46, screenWidth),
            borderRadius: scaleSize(12, screenWidth),
          }]}
          onPress={() => setShowCart(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ShoppingCart size={scaleSize(20, screenWidth)} color={theme.white} />
          {items.length > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: theme.white }]}>
              <Text style={[styles.cartBadgeText, { color: theme.primary, fontSize: scaleFont(10) }]}>
                {items.reduce((s, i) => s + i.quantite, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, {
        backgroundColor: theme.input,
        borderColor: theme.border,
        marginHorizontal: horizontalPadding,
        height: scaleSize(44, screenWidth),
      }]}>
        <Search size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text, fontSize: scaleFont(14) }]}
          placeholder="Rechercher un produit..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            const displayLabel = item === 'all' ? 'Tous' : item;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surface,
                    borderColor: isActive ? theme.primary : theme.border,
                    paddingHorizontal: isSmallScreen ? 12 : 16,
                    paddingVertical: scaleSize(8, screenWidth),
                  },
                ]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.8}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: isActive ? theme.white : theme.textSecondary, fontSize: scaleFont(12) },
                  ]}
                >
                  {displayLabel}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={[styles.categoriesList, { paddingHorizontal: horizontalPadding }]}
        />
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[styles.productsList, { paddingHorizontal: horizontalPadding }]}
        columnWrapperStyle={styles.productRow}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { paddingVertical: screenHeight * 0.15 }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: scaleFont(15) }]}>
              Aucun produit trouvé
            </Text>
          </View>
        }
      />

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" transparent onRequestClose={() => setShowCart(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowCart(false)} />
          <View style={[styles.cartPanel, {
            backgroundColor: theme.background,
            maxHeight: modalMaxHeight,
            borderTopLeftRadius: isSmallScreen ? 16 : 24,
            borderTopRightRadius: isSmallScreen ? 16 : 24,
            padding: isSmallScreen ? 16 : 20,
          }]}>
            <View style={styles.cartHeader}>
              <Text style={[styles.cartTitle, { color: theme.text, fontSize: scaleFont(18) }]}>Panier</Text>
              <TouchableOpacity onPress={() => setShowCart(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={scaleSize(24, screenWidth)} color={theme.text} />
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyCart}>
                <ShoppingCart size={scaleSize(48, screenWidth)} color={theme.textSecondary} />
                <Text style={[styles.emptyCartText, { color: theme.textSecondary, fontSize: scaleFont(15) }]}>
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
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                />
                <View style={[styles.cartFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.text, fontSize: scaleFont(17) }]}>Total</Text>
                    <Text style={[styles.totalValue, { color: theme.primary, fontSize: scaleFont(22) }]} numberOfLines={1} adjustsFontSizeToFit>
                      {formatCurrency(getTotal())}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.paymentButton, { backgroundColor: theme.primary, height: scaleSize(52, screenWidth) }]}
                    onPress={() => {
                      setShowCart(false);
                      setShowPayment(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.paymentButtonText, { color: theme.white, fontSize: scaleFont(16) }]}>
                      Payer
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPayment} animationType="fade" transparent onRequestClose={() => setShowPayment(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowPayment(false)} />
          <View style={[styles.paymentPanel, {
            backgroundColor: theme.background,
            borderTopLeftRadius: isSmallScreen ? 16 : 24,
            borderTopRightRadius: isSmallScreen ? 16 : 24,
            padding: isSmallScreen ? 16 : 20,
          }]}>
            <View style={styles.cartHeader}>
              <Text style={[styles.cartTitle, { color: theme.text, fontSize: scaleFont(18) }]}>Paiement</Text>
              <TouchableOpacity onPress={() => setShowPayment(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={scaleSize(24, screenWidth)} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentTotal}>
              <Text style={[styles.paymentTotalLabel, { color: theme.textSecondary, fontSize: scaleFont(15) }]}>
                Total à payer
              </Text>
              <Text style={[styles.paymentTotalValue, { color: theme.primary, fontSize: scaleFont(28) }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(getTotal())}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.paymentMethods, { gap: isSmallScreen ? 10 : 12 }]}>
                {PAYMENT_METHODS.map((pm) => {
                  const IconComponent = pm.icon;
                  const iconColor = theme[pm.colorKey];
                  return (
                    <TouchableOpacity
                      key={pm.method}
                      style={[styles.paymentMethod, {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        padding: scaleSize(14, screenWidth),
                        gap: scaleSize(14, screenWidth),
                      }]}
                      onPress={() => {
                        setShowPayment(false);
                        router.push({
                          pathname: '/tabs/invoice',
                          params: { method: pm.method, total: getTotal() },
                        } as any);
                      }}
                      activeOpacity={0.8}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <IconComponent size={scaleSize(26, screenWidth)} color={iconColor} />
                      <Text style={[styles.paymentMethodText, { color: theme.text, fontSize: scaleFont(15) }]}>
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontWeight: '700',
  },
  cartButton: {
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    gap: 8,
  },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontWeight: '600',
  },
  productsList: {
    paddingBottom: 20,
  },
  productRow: {
    gap: 12,
  },
  productCard: {
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  productImagePlaceholder: {
    width: '100%',
    backgroundColor: '#C2185B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productImageText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  productCategory: {
    marginBottom: 4,
  },
  productPrice: {
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
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {},
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cartPanel: {
    paddingBottom: 20,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: {
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartItemName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  cartItemPrice: {},
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyButton: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  removeButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontWeight: '600',
  },
  totalValue: {
    fontWeight: '700',
  },
  paymentButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonText: {
    fontWeight: '700',
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartText: {
    marginTop: 12,
  },
  paymentPanel: {
    paddingBottom: 20,
  },
  paymentTotal: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentTotalLabel: {
    marginBottom: 8,
  },
  paymentTotalValue: {
    fontWeight: '700',
  },
  paymentMethods: {},
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentMethodText: {
    fontWeight: '600',
  },
});