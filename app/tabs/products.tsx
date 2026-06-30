import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Package,
  Save,
} from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { getProducts, createProduct, updateProduct, deleteProduct, updateStock } from '@/src/database/products';
import { Product, ProductCategory } from '@/src/types';

const FORM_CATEGORIES: ProductCategory[] = ['Plats', 'Boissons', 'Cocktails', 'Desserts'];

// Helper pour les tailles responsives
const scaleSize = (size: number, width: number) => {
  const baseWidth = 375; // iPhone 12/13/14 base
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function ProductsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState('');
  const [stockType, setStockType] = useState<'in' | 'out'>('in');

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Plats');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);

  const categories = ['all', 'Plats', 'Boissons', 'Cocktails', 'Desserts'];

  const loadProducts = useCallback(async () => {
    const all = await getProducts();
    setProducts(all);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    let filtered = [...products];
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

  const handleSave = async () => {
    if (!formName.trim() || !formPrice.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          nom: formName.trim(),
          categorie: formCategory,
          prix: parseFloat(formPrice),
          stock: parseInt(formStock) || 0,
          disponible: formAvailable,
        });
      } else {
        const newProduct: Product = {
          id: `prod-${Date.now()}`,
          nom: formName.trim(),
          categorie: formCategory,
          prix: parseFloat(formPrice),
          stock: parseInt(formStock) || 0,
          disponible: formAvailable,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await createProduct(newProduct);
      }
      await loadProducts();
      closeForm();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le produit');
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer ${product.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
            await loadProducts();
          },
        },
      ]
    );
  };

  const handleStockUpdate = async () => {
    if (!stockProduct || !stockQty) return;
    const qty = parseInt(stockQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erreur', 'Quantité invalide');
      return;
    }

    const newStock = stockType === 'in'
      ? stockProduct.stock + qty
      : stockProduct.stock - qty;

    if (newStock < 0) {
      Alert.alert('Erreur', 'Stock insuffisant');
      return;
    }

    await updateStock(stockProduct.id, newStock);
    await loadProducts();
    setShowStockModal(false);
    setStockQty('');
  };

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormName(product.nom);
      setFormCategory(product.categorie);
      setFormPrice(product.prix.toString());
      setFormStock(product.stock.toString());
      setFormAvailable(product.disponible);
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormCategory('Plats');
      setFormPrice('');
      setFormStock('');
      setFormAvailable(true);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.productImagePlaceholder, { width: scaleSize(56, screenWidth), height: scaleSize(56, screenWidth) }]}>
        <Text style={[styles.productImageText, { fontSize: scaleFont(20) }]}>{item.nom.charAt(0)}</Text>
      </View>
      <View style={styles.productDetails}>
        <Text style={[styles.productName, { color: theme.text, fontSize: scaleFont(15) }]} numberOfLines={1}>
          {item.nom}
        </Text>
        <Text style={[styles.productCategory, { color: theme.textSecondary, fontSize: scaleFont(12) }]}>
          {item.categorie}
        </Text>
        <Text style={[styles.productPrice, { color: theme.primary, fontSize: scaleFont(14) }]}>
          {formatCurrency(item.prix)}
        </Text>
        <View style={styles.stockRow}>
          <Text style={[styles.stockText, { color: item.stock <= 10 ? theme.error : theme.textSecondary, fontSize: scaleFont(12) }]}>
            Stock: {item.stock}
          </Text>
          {!item.disponible && (
            <Text style={[styles.unavailableBadge, { color: theme.error, fontSize: scaleFont(11) }]}>
              Indisponible
            </Text>
          )}
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary + '15', width: scaleSize(40, screenWidth), height: scaleSize(40, screenWidth) }]}
          onPress={() => {
            setStockProduct(item);
            setStockType('in');
            setShowStockModal(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Package size={scaleSize(18, screenWidth)} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.success + '15', width: scaleSize(40, screenWidth), height: scaleSize(40, screenWidth) }]}
          onPress={() => openForm(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Edit3 size={scaleSize(18, screenWidth)} color={theme.success} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.error + '15', width: scaleSize(40, screenWidth), height: scaleSize(40, screenWidth) }]}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={scaleSize(18, screenWidth)} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Calcul de la hauteur max du modal selon l'écran
  const modalMaxHeight = screenHeight < 600 ? '90%' : '80%';
  const isSmallScreen = screenWidth < 360;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: isSmallScreen ? 12 : 16, paddingTop: isSmallScreen ? 16 : 24 }]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(22) }]}>Produits</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary, width: scaleSize(44, screenWidth), height: scaleSize(44, screenWidth) }]}
          onPress={() => openForm()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={scaleSize(20, screenWidth)} color={theme.white} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.input, borderColor: theme.border, marginHorizontal: isSmallScreen ? 12 : 16, height: scaleSize(44, screenWidth) }]}>
        <Search size={scaleSize(20, screenWidth)} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text, fontSize: scaleFont(15) }]}
          placeholder="Rechercher..."
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
                  paddingHorizontal: isSmallScreen ? 12 : 16,
                  paddingVertical: scaleSize(8, screenWidth),
                  marginRight: 8,
                },
              ]}
              onPress={() => setSelectedCategory(item)}
              activeOpacity={0.8}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.categoryText,
                  { 
                    color: selectedCategory === item ? theme.white : theme.textSecondary,
                    fontSize: scaleFont(13),
                  },
                ]}
              >
                {item === 'all' ? 'Tous' : item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={[styles.categoriesList, { paddingHorizontal: isSmallScreen ? 12 : 16 }]}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.productsList, { paddingHorizontal: isSmallScreen ? 12 : 16 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { paddingVertical: screenHeight * 0.15 }]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: scaleFont(16) }]}>
              Aucun produit trouvé
            </Text>
          </View>
        }
      />

      {/* Product Form Modal */}
      <Modal 
        visible={showForm} 
        animationType="slide" 
        transparent
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 10 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <View style={[styles.modalPanel, { 
                backgroundColor: theme.background,
                maxHeight: modalMaxHeight,
                borderTopLeftRadius: isSmallScreen ? 16 : 24,
                borderTopRightRadius: isSmallScreen ? 16 : 24,
                padding: isSmallScreen ? 16 : 20,
              }]}>
                
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text, fontSize: scaleFont(18), flex: 1 }]} numberOfLines={1}>
                    {editingProduct ? 'Modifier' : 'Nouveau produit'}
                  </Text>
                  <TouchableOpacity onPress={closeForm} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={scaleSize(24, screenWidth)} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  contentContainerStyle={styles.scrollForm}
                >
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Nom *</Text>
                    <TextInput
                      style={[styles.formInput, { 
                        backgroundColor: theme.input, 
                        color: theme.text, 
                        borderColor: theme.border,
                        fontSize: scaleFont(16),
                        height: scaleSize(48, screenWidth),
                      }]}
                      placeholder="Nom du produit"
                      placeholderTextColor={theme.placeholder}
                      value={formName}
                      onChangeText={setFormName}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Catégorie</Text>
                    <View style={[styles.categorySelector, { gap: isSmallScreen ? 6 : 8 }]}>
                      {FORM_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryOption,
                            {
                              backgroundColor: formCategory === cat ? theme.primary : theme.input,
                              borderColor: formCategory === cat ? theme.primary : theme.border,
                              paddingHorizontal: isSmallScreen ? 12 : 16,
                              paddingVertical: scaleSize(10, screenWidth),
                              borderRadius: 8,
                              borderWidth: 1,
                            },
                          ]}
                          onPress={() => setFormCategory(cat)}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
                          <Text style={{ 
                            color: formCategory === cat ? theme.white : theme.text, 
                            fontSize: scaleFont(13),
                            fontWeight: '500'
                          }}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: isSmallScreen ? 8 : 12 }]}>
                      <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Prix *</Text>
                      <TextInput
                        style={[styles.formInput, { 
                          backgroundColor: theme.input, 
                          color: theme.text, 
                          borderColor: theme.border,
                          fontSize: scaleFont(16),
                          height: scaleSize(48, screenWidth),
                        }]}
                        placeholder="0"
                        placeholderTextColor={theme.placeholder}
                        value={formPrice}
                        onChangeText={setFormPrice}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Stock</Text>
                      <TextInput
                        style={[styles.formInput, { 
                          backgroundColor: theme.input, 
                          color: theme.text, 
                          borderColor: theme.border,
                          fontSize: scaleFont(16),
                          height: scaleSize(48, screenWidth),
                        }]}
                        placeholder="0"
                        placeholderTextColor={theme.placeholder}
                        value={formStock}
                        onChangeText={setFormStock}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setFormAvailable(!formAvailable)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, { 
                        borderColor: theme.border, 
                        backgroundColor: formAvailable ? theme.primary : theme.input,
                        width: scaleSize(24, screenWidth),
                        height: scaleSize(24, screenWidth),
                      }]}>
                        {formAvailable && <Text style={{ color: theme.white, fontSize: scaleFont(14), fontWeight: '700' }}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: theme.text, fontSize: scaleFont(14), marginLeft: 10 }]}>
                        Disponible
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, { 
                      backgroundColor: theme.primary,
                      height: scaleSize(52, screenWidth),
                      marginTop: isSmallScreen ? 4 : 8,
                    }]}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Save size={scaleSize(20, screenWidth)} color={theme.white} />
                    <Text style={[styles.saveButtonText, { color: theme.white, fontSize: scaleFont(16) }]}>Sauvegarder</Text>
                  </TouchableOpacity>
                </ScrollView>

              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Stock Modal */}
      <Modal 
        visible={showStockModal} 
        animationType="slide" 
        transparent
        onRequestClose={() => setShowStockModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 10 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <View style={[styles.modalPanel, { 
                backgroundColor: theme.background,
                maxHeight: modalMaxHeight,
                borderTopLeftRadius: isSmallScreen ? 16 : 24,
                borderTopRightRadius: isSmallScreen ? 16 : 24,
                padding: isSmallScreen ? 16 : 20,
              }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text, fontSize: scaleFont(16), flex: 1 }]} numberOfLines={1}>
                    Stock: {stockProduct?.nom}
                  </Text>
                  <TouchableOpacity onPress={() => setShowStockModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={scaleSize(24, screenWidth)} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  contentContainerStyle={styles.scrollForm}
                >
                  <View style={styles.stockCurrent}>
                    <Text style={[styles.stockCurrentLabel, { color: theme.textSecondary, fontSize: scaleFont(14) }]}>
                      Stock actuel
                    </Text>
                    <Text style={[styles.stockCurrentValue, { color: theme.text, fontSize: scaleFont(28) }]}>
                      {stockProduct?.stock || 0}
                    </Text>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Type</Text>
                    <View style={[styles.typeSelector, { gap: isSmallScreen ? 8 : 12 }]}>
                      <TouchableOpacity
                        style={[
                          styles.typeOption,
                          {
                            backgroundColor: stockType === 'in' ? theme.success : theme.input,
                            borderColor: stockType === 'in' ? theme.success : theme.border,
                            paddingVertical: scaleSize(12, screenWidth),
                          },
                        ]}
                        onPress={() => setStockType('in')}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Text style={{ 
                          color: stockType === 'in' ? theme.white : theme.text, 
                          fontWeight: '600',
                          fontSize: scaleFont(14),
                        }}>
                          Entrée
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeOption,
                          {
                            backgroundColor: stockType === 'out' ? theme.error : theme.input,
                            borderColor: stockType === 'out' ? theme.error : theme.border,
                            paddingVertical: scaleSize(12, screenWidth),
                          },
                        ]}
                        onPress={() => setStockType('out')}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Text style={{ 
                          color: stockType === 'out' ? theme.white : theme.text, 
                          fontWeight: '600',
                          fontSize: scaleFont(14),
                        }}>
                          Sortie
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Quantité</Text>
                    <TextInput
                      style={[styles.formInput, { 
                        backgroundColor: theme.input, 
                        color: theme.text, 
                        borderColor: theme.border,
                        fontSize: scaleFont(16),
                        height: scaleSize(48, screenWidth),
                      }]}
                      placeholder="0"
                      placeholderTextColor={theme.placeholder}
                      value={stockQty}
                      onChangeText={setStockQty}
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, { 
                      backgroundColor: stockType === 'in' ? theme.success : theme.error,
                      height: scaleSize(52, screenWidth),
                    }]}
                    onPress={handleStockUpdate}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.saveButtonText, { color: theme.white, fontSize: scaleFont(16) }]}>Valider</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  addButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 15,
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
    gap: 12,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  productImagePlaceholder: {
    borderRadius: 10,
    backgroundColor: '#C2185B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productDetails: {
    flex: 1,
    minWidth: 0, // Permet le text truncation
  },
  productName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 2,
  },
  productPrice: {
    fontWeight: '700',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  stockText: {
    fontSize: 12,
  },
  unavailableBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalPanel: {
    paddingBottom: 20,
  },
  scrollForm: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  saveButtonText: {
    fontWeight: '700',
  },
  stockCurrent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stockCurrentLabel: {
    fontSize: 14,
  },
  stockCurrentValue: {
    fontWeight: '700',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  typeOption: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
});