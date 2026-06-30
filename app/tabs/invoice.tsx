import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Printer, Share2, ArrowLeft } from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { useCartStore } from '@/src/store/cartStore';
import { useAuthStore } from '@/src/store/authStore';
import { createOrder } from '@/src/database/orders';
import { getSettings } from '@/src/database/settings';
import { Order, OrderItem } from '@/src/types';

export default function InvoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    nom_etablissement: 'Mon Restaurant',
    adresse: '',
    telephone: '',
    email: '',
    numero_fiscal: '',
  });

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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Traitement en cours...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/tabs') as any} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Reçu</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.receipt, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Logo & Header */}
        <View style={styles.receiptHeader}>
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>{settings.nom_etablissement.charAt(0)}</Text>
          </View>
          <Text style={[styles.receiptTitle, { color: theme.text }]}>
            {settings.nom_etablissement}
          </Text>
          {settings.adresse ? (
            <Text style={[styles.receiptInfo, { color: theme.textSecondary }]}>
              {settings.adresse}
            </Text>
          ) : null}
          {settings.telephone ? (
            <Text style={[styles.receiptInfo, { color: theme.textSecondary }]}>
              Tel: {settings.telephone}
            </Text>
          ) : null}
          {settings.numero_fiscal ? (
            <Text style={[styles.receiptInfo, { color: theme.textSecondary }]}>
              N° Fiscal: {settings.numero_fiscal}
            </Text>
          ) : null}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { borderColor: theme.border }]}>
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
            {''.repeat(20)}
          </Text>
        </View>

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={[styles.orderInfoText, { color: theme.textSecondary }]}>
            Commande: {orderId}
          </Text>
          <Text style={[styles.orderInfoText, { color: theme.textSecondary }]}>
            Date: {new Date().toLocaleString('fr-FR')}
          </Text>
          <Text style={[styles.orderInfoText, { color: theme.textSecondary }]}>
            Caissier: {user?.nom || 'N/A'}
          </Text>
          <Text style={[styles.orderInfoText, { color: theme.textSecondary }]}>
            Paiement: {methodLabels[method]}
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { borderColor: theme.border }]}>
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
            {'*'.repeat(20)}
          </Text>
        </View>

        {/* Items */}
        {items.length === 0 && total > 0 ? (
          <View style={styles.itemsSection}>
            <Text style={[styles.emptyItems, { color: theme.textSecondary }]}>
              Vente enregistrée
            </Text>
          </View>
        ) : (
          <View style={styles.itemsSection}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={[styles.itemQty, { color: theme.textSecondary }]}>
                    {item.quantite}x
                  </Text>
                  <Text style={[styles.itemName, { color: theme.text }]}>
                    {item.product.nom}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, { color: theme.text }]}>
                  {formatCurrency(item.product.prix * item.quantite)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { borderColor: theme.border }]}>
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
            {'*'.repeat(20)}
          </Text>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.receiptFooter}>
          <Text style={[styles.thanksText, { color: theme.textSecondary }]}>
            Merci de votre visite!
          </Text>
          <View style={[styles.qrPlaceholder, { backgroundColor: theme.surface }]}>
            <Text style={[styles.qrText, { color: theme.textSecondary }]}>QR Code</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => router.replace('/tabs') as any}
          activeOpacity={0.8}
        >
          <CheckCircle size={20} color={theme.white} />
          <Text style={[styles.actionButtonText, { color: theme.white }]}>
            Nouvelle vente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Printer size={20} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text }]}>
            Imprimer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Share2 size={20} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text }]}>
            Partager
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  receipt: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  receiptHeader: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  receiptInfo: {
    fontSize: 12,
    marginBottom: 2,
  },
  divider: {
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dividerText: {
    fontSize: 12,
    letterSpacing: 2,
  },
  orderInfo: {
    paddingVertical: 12,
  },
  orderInfoText: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemsSection: {
    paddingVertical: 12,
  },
  emptyItems: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQty: {
    fontSize: 13,
    width: 28,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  thanksText: {
    fontSize: 14,
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: 11,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});
