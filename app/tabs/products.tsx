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
} from 'react-native';
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

export default function ProductsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

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
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productImageText}>{item.nom.charAt(0)}</Text>
      </View>
      <View style={styles.productDetails}>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
          {item.nom}
        </Text>
        <Text style={[styles.productCategory, { color: theme.textSecondary }]}>
          {item.categorie}
        </Text>
        <Text style={[styles.productPrice, { color: theme.primary }]}>
          {formatCurrency(item.prix)}
        </Text>
        <View style={styles.stockRow}>
          <Text style={[styles.stockText, { color: item.stock <= 10 ? theme.error : theme.textSecondary }]}>
            Stock: {item.stock}
          </Text>
          {!item.disponible && (
            <Text style={[styles.unavailableBadge, { color: theme.error }]}>
              Indisponible
            </Text>
          )}
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary + '15' }]}
          onPress={() => {
            setStockProduct(item);
            setStockType('in');
            setShowStockModal(true);
          }}
        >
          <Package size={16} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.success + '15' }]}
          onPress={() => openForm(item)}
        >
          <Edit3 size={16} color={theme.success} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.error + '15' }]}
          onPress={() => handleDelete(item)}
        >
          <Trash2 size={16} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Produits</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => openForm()}
          activeOpacity={0.8}
        >
          <Plus size={20} color={theme.white} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
        <Search size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Rechercher..."
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

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
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

      {/* Product Form Modal */}
      <Modal 
        visible={showForm} 
        animationType="slide" 
        transparent
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalPanel, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {editingProduct ? 'Modifier' : 'Nouveau produit'}
                </Text>
                <TouchableOpacity onPress={closeForm}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollForm}
              >
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Nom *</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                    placeholder="Nom du produit"
                    placeholderTextColor={theme.placeholder}
                    value={formName}
                    onChangeText={setFormName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Catégorie</Text>
                  <View style={styles.categorySelector}>
                    {(['Plats', 'Boissons', 'Cocktails', 'Desserts'] as ProductCategory[]).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          {
                            backgroundColor: formCategory === cat ? theme.primary : theme.input,
                            borderColor: formCategory === cat ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setFormCategory(cat)}
                      >
                        <Text style={{ color: formCategory === cat ? theme.white : theme.text, fontSize: 13 }}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>Prix *</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.placeholder}
                      value={formPrice}
                      onChangeText={setFormPrice}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>Stock</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                      placeholder="0"
                      placeholderTextColor={theme.placeholder}
                      value={formStock}
                      onChangeText={setFormStock}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.checkboxRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, { borderColor: theme.border, backgroundColor: formAvailable ? theme.primary : theme.input }]}
                      onPress={() => setFormAvailable(!formAvailable)}
                    >
                      {formAvailable && <Text style={{ color: theme.white, fontSize: 12 }}>✓</Text>}
                    </TouchableOpacity>
                    <Text style={[styles.checkboxLabel, { color: theme.text }]}>Disponible</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Save size={20} color={theme.white} />
                  <Text style={[styles.saveButtonText, { color: theme.white }]}>Sauvegarder</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
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
          style={styles.keyboardAvoidContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalPanel, { backgroundColor: theme.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                  Stock: {stockProduct?.nom}
                </Text>
                <TouchableOpacity onPress={() => setShowStockModal(false)}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollForm}
              >
                <View style={styles.stockCurrent}>
                  <Text style={[styles.stockCurrentLabel, { color: theme.textSecondary }]}>
                    Stock actuel
                  </Text>
                  <Text style={[styles.stockCurrentValue, { color: theme.text }]}>
                    {stockProduct?.stock || 0}
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Type</Text>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.typeOption,
                        {
                          backgroundColor: stockType === 'in' ? theme.success : theme.input,
                          borderColor: stockType === 'in' ? theme.success : theme.border,
                        },
                      ]}
                      onPress={() => setStockType('in')}
                    >
                      <Text style={{ color: stockType === 'in' ? theme.white : theme.text, fontWeight: '600' }}>
                        Entrée
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeOption,
                        {
                          backgroundColor: stockType === 'out' ? theme.error : theme.input,
                          borderColor: stockType === 'out' ? theme.error : theme.border,
                        },
                      ]}
                      onPress={() => setStockType('out')}
                    >
                      <Text style={{ color: stockType === 'out' ? theme.white : theme.text, fontWeight: '600' }}>
                        Sortie
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Quantité</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                    placeholder="0"
                    placeholderTextColor={theme.placeholder}
                    value={stockQty}
                    onChangeText={setStockQty}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: stockType === 'in' ? theme.success : theme.error }]}
                  onPress={handleStockUpdate}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.saveButtonText, { color: theme.white }]}>Valider</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
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
    padding: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 16,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#C2185B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productImageText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
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
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  // --- Nouveaux styles et ajustements pour éviter le chevauchement clavier ---
  keyboardAvoidContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%', // Évite que le panel ne dépasse de l'écran une fois soulevé
  },
  scrollForm: {
    paddingBottom: 24, // Donne de l'espace interne de sécurité pour scroller
  },
  // -------------------------------------------------------------------------
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    height: 48,
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
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
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
    height: 52,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
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
    fontSize: 32,
    fontWeight: '700',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
});