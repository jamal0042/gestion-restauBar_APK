import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  PixelRatio,
  Image, // ✅ Ajout de l'import Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Printer, Share2, ArrowLeft } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { useCartStore } from '@/src/store/cartStore';
import { useAuthStore } from '@/src/store/authStore';
import { createOrder } from '@/src/database/orders';
import { getSettings } from '@/src/database/settings';
import { Order, OrderItem } from '@/src/types';

// ✅ Import de ton icône - ADAPTE LE CHEMIN selon ton projet
const appIcon = require('@/assets/images/icon.png');

// Helpers responsifs
const scaleSize = (size: number, width: number) => {
  const baseWidth = 375;
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function InvoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const isSmallScreen = screenWidth < 360;
  const horizontalPadding = isSmallScreen ? 12 : 16;

  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    nom_etablissement: 'Mon Restaurant',
    adresse: '',
    telephone: '',
    email: '',
    numero_fiscal: '',
  });

  // ✅ useRef pour stocker les items - persiste entre les rendus
  const savedItemsRef = useRef<any[]>([]);

  const method = (params.method as string) || 'cash';
  const total = Number(params.total) || getTotal();

  const methodLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile_money: 'Mobile Money',
  };

  useEffect(() => {
    const processOrder = async () => {
      try {
        const [settingsData] = await Promise.all([getSettings()]);
        setSettings(settingsData);

        if (items.length === 0 && total === 0) {
          setLoading(false);
          return;
        }

        // ✅ Sauvegarder les items dans le ref AVANT de vider le panier
        savedItemsRef.current = [...items];

        const newOrderId = `ORD-${Date.now()}`;
        const order: Order = {
          id: newOrderId,
          user_id: user?.id || 'unknown',
          total: getTotal(),
          status: 'completed',
          sync_status: 'pending',
          date: new Date().toISOString(),
          payment_method: method,
          customer_name: '',
        };

        const orderItems: OrderItem[] = items.map((item) => ({
          id: `${newOrderId}-${item.product.id}`,
          order_id: newOrderId,
          product_id: item.product.id,
          quantite: item.quantite,
          prix: item.product.prix,
        }));

        await createOrder(order, orderItems);
        setOrderId(newOrderId);
        clearCart();
      } catch (err) {
        console.error('Order creation error:', err);
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ✅ Utiliser savedItemsRef.current pour le QR code
  const qrData = JSON.stringify({
    orderId,
    establishment: settings.nom_etablissement,
    date: new Date().toISOString(),
    total,
    method: methodLabels[method],
    cashier: user?.nom || 'N/A',
    items: savedItemsRef.current.length > 0 ? savedItemsRef.current.map(i => ({
      name: i.product.nom,
      qty: i.quantite,
      price: i.product.prix * i.quantite
    })) : []
  });

  const handleNewSale = () => {
    router.replace('/tabs');
  };

  // Taille dynamique du QR code et du logo selon l'écran
  const qrSize = scaleSize(isSmallScreen ? 100 : 120, screenWidth);
  const logoSize = scaleSize(56, screenWidth);

  if (loading) {
    return (
      <View style={[styles.container, { 
        backgroundColor: theme.background, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingTop: insets.top,
      }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, fontSize: scaleFont(15) }]}>
          Traitement en cours...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <TouchableOpacity 
          onPress={() => router.replace('/tabs') as any} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={scaleSize(24, screenWidth)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(20) }]}>Reçu</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Receipt Card */}
      <View style={[styles.receipt, { 
        backgroundColor: theme.card, 
        borderColor: theme.border,
        marginHorizontal: horizontalPadding,
        padding: scaleSize(isSmallScreen ? 16 : 20, screenWidth),
      }]}>
        {/* Logo & Header */}
        <View style={styles.receiptHeader}>
          {/* ✅ REMPLACEMENT : Image au lieu de la lettre */}
          <Image
            source={appIcon}
            style={[styles.logoImage, {
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize / 2,
            }]}
            resizeMode="cover"
          />
          <Text style={[styles.receiptTitle, { color: theme.text, fontSize: scaleFont(17) }]} numberOfLines={2}>
            {settings.nom_etablissement}
          </Text>
          {settings.adresse ? (
            <Text style={[styles.receiptInfo, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
              {settings.adresse}
            </Text>
          ) : null}
          {settings.telephone ? (
            <Text style={[styles.receiptInfo, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
              Tel: {settings.telephone}
            </Text>
          ) : null}
          {settings.numero_fiscal ? (
            <Text style={[styles.receiptInfo, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
              N° Fiscal: {settings.numero_fiscal}
            </Text>
          ) : null}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { borderColor: theme.border }]} />

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={[styles.orderInfoText, { color: theme.textSecondary, fontSize: scaleFont(11) }]} numberOfLines={1}>
            Commande: {orderId}
          </Text>
          <Text style={[styles.orderInfoText, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
            Date: {new Date().toLocaleString('fr-FR')}
          </Text>
          <Text style={[styles.orderInfoText, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
            Caissier: {user?.nom || 'N/A'}
          </Text>
          <Text style={[styles.orderInfoText, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>
            Paiement: {methodLabels[method]}
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { borderColor: theme.border }]} />

        {/* ✅ Items : Utiliser savedItemsRef.current */}
        <View style={styles.itemsSection}>
          {savedItemsRef.current.length === 0 && total > 0 ? (
            <Text style={[styles.emptyItems, { color: theme.textSecondary, fontSize: scaleFont(13) }]}>
              Vente enregistrée
            </Text>
          ) : (
            savedItemsRef.current.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={[styles.itemQty, { color: theme.textSecondary, fontSize: scaleFont(12) }]}>
                    {item.quantite}x
                  </Text>
                  <Text style={[styles.itemName, { color: theme.text, fontSize: scaleFont(13) }]} numberOfLines={1}>
                    {item.product.nom}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, { color: theme.text, fontSize: scaleFont(13) }]} numberOfLines={1}>
                  {formatCurrency(item.product.prix * item.quantite)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { borderColor: theme.border }]} />

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary, fontSize: scaleFont(15) }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.primary, fontSize: scaleFont(20) }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {/* Footer avec QR Code */}
        <View style={styles.receiptFooter}>
          <Text style={[styles.thanksText, { color: theme.textSecondary, fontSize: scaleFont(13) }]}>
            Merci de votre visite !
          </Text>

          {/* QR Code réel */}
          <View style={[styles.qrContainer, { backgroundColor: theme.surface, padding: scaleSize(14, screenWidth) }]}>
            <QRCode
              value={qrData}
              size={qrSize}
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
              backgroundColor="transparent"
            />
          </View>

          <Text style={[styles.qrLabel, { color: theme.textSecondary, fontSize: scaleFont(10) }]}>
            Scannez pour voir les détails
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingHorizontal: horizontalPadding, gap: isSmallScreen ? 10 : 12 }]}>
        <TouchableOpacity
          style={[styles.actionButton, { 
            backgroundColor: theme.primary,
            height: scaleSize(48, screenWidth),
          }]}
          onPress={handleNewSale}
          activeOpacity={0.8}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <CheckCircle size={scaleSize(20, screenWidth)} color={theme.white} />
          <Text style={[styles.actionButtonText, { color: theme.white, fontSize: scaleFont(15) }]}>
            Nouvelle vente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { 
            backgroundColor: theme.card, 
            borderColor: theme.border,
            height: scaleSize(48, screenWidth),
          }]}
          activeOpacity={0.8}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Printer size={scaleSize(20, screenWidth)} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text, fontSize: scaleFont(15) }]}>
            Imprimer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { 
            backgroundColor: theme.card, 
            borderColor: theme.border,
            height: scaleSize(48, screenWidth),
          }]}
          activeOpacity={0.8}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Share2 size={scaleSize(20, screenWidth)} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text, fontSize: scaleFont(15) }]}>
            Partager
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  receipt: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  receiptHeader: {
    alignItems: 'center',
  },
  // ✅ NOUVEAU STYLE pour l'image du logo
  logoImage: {
    marginBottom: 12,
  },
  receiptTitle: {
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  receiptInfo: {
    marginBottom: 2,
    textAlign: 'center',
  },
  divider: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  orderInfo: {
    paddingVertical: 12,
  },
  orderInfoText: {
    marginBottom: 3,
  },
  itemsSection: {
    paddingVertical: 12,
  },
  emptyItems: {
    textAlign: 'center',
    paddingVertical: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  itemQty: {
    width: 28,
    flexShrink: 0,
  },
  itemName: {
    fontWeight: '500',
    flexShrink: 1,
  },
  itemTotal: {
    fontWeight: '600',
    flexShrink: 0,
  },
  totalSection: {
    paddingVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontWeight: '600',
  },
  totalValue: {
    fontWeight: '700',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  thanksText: {
    marginBottom: 16,
  },
  qrContainer: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qrLabel: {
    fontStyle: 'italic',
  },
  actions: {
    paddingBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontWeight: '600',
  },
});