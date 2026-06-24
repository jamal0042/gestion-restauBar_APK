import { getDatabase } from '../database/connection';
import { checkConnection } from '../api/client';

// Service de synchronisation automatique entre SQLite local et le serveur
export class SyncService {
  private static instance: SyncService;
  private syncInterval: NodeJS.Timeout | null = null;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Démarre la synchronisation automatique
  startAutoSync(intervalMs: number = 30000) {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      this.syncAll().catch(console.error);
    }, intervalMs);
  }

  // Arrête la synchronisation automatique
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Synchronise toutes les données en attente
  async syncAll(): Promise<{ success: boolean; message: string }> {
    const isOnline = await checkConnection();
    if (!isOnline) {
      return { success: false, message: 'Pas de connexion internet' };
    }

    try {
      const db = await getDatabase();

      // Synchroniser les commandes en attente
      const pendingOrders = await db.getAllAsync(
        "SELECT * FROM orders WHERE sync_status = 'pending'"
      );

      for (const order of pendingOrders as any[]) {
        try {
          // Simuler l'envoi au serveur
          await this.sendOrderToServer(order);
          await db.runAsync(
            "UPDATE orders SET sync_status = 'synced' WHERE id = ?",
            order.id
          );
        } catch (err) {
          await db.runAsync(
            "UPDATE orders SET sync_status = 'failed' WHERE id = ?",
            order.id
          );
        }
      }

      // Synchroniser les produits modifiés
      const pendingProducts = await db.getAllAsync(
        "SELECT * FROM products WHERE sync_status = 'pending'"
      );

      for (const product of pendingProducts as any[]) {
        try {
          await this.sendProductToServer(product);
          await db.runAsync(
            "UPDATE products SET sync_status = 'synced' WHERE id = ?",
            product.id
          );
        } catch (err) {
          console.error('Product sync failed:', product.id);
        }
      }

      // Synchroniser les utilisateurs
      const pendingUsers = await db.getAllAsync(
        "SELECT * FROM users WHERE sync_status = 'pending'"
      );

      for (const user of pendingUsers as any[]) {
        try {
          await this.sendUserToServer(user);
          await db.runAsync(
            "UPDATE users SET sync_status = 'synced' WHERE id = ?",
            user.id
          );
        } catch (err) {
          console.error('User sync failed:', user.id);
        }
      }

      return {
        success: true,
        message: `Synchronisation terminée: ${pendingOrders.length} commandes, ${pendingProducts.length} produits, ${pendingUsers.length} utilisateurs`,
      };
    } catch (err) {
      return { success: false, message: 'Erreur lors de la synchronisation' };
    }
  }

  // Simuler l'envoi d'une commande au serveur
  private async sendOrderToServer(order: any): Promise<void> {
    // En production, remplacer par un vrai appel API
    console.log('Syncing order:', order.id);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Simuler l'envoi d'un produit au serveur
  private async sendProductToServer(product: any): Promise<void> {
    console.log('Syncing product:', product.id);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Simuler l'envoi d'un utilisateur au serveur
  private async sendUserToServer(user: any): Promise<void> {
    console.log('Syncing user:', user.id);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Vérifier le statut de synchronisation
  async getSyncStatus(): Promise<{
    pendingOrders: number;
    pendingProducts: number;
    pendingUsers: number;
    isOnline: boolean;
  }> {
    const isOnline = await checkConnection();
    const db = await getDatabase();

    const orders = await db.getAllAsync(
      "SELECT COUNT(*) as count FROM orders WHERE sync_status = 'pending'"
    );
    const products = await db.getAllAsync(
      "SELECT COUNT(*) as count FROM products WHERE sync_status = 'pending'"
    );
    const users = await db.getAllAsync(
      "SELECT COUNT(*) as count FROM users WHERE sync_status = 'pending'"
    );

    return {
      pendingOrders: (orders[0] as any)?.count || 0,
      pendingProducts: (products[0] as any)?.count || 0,
      pendingUsers: (users[0] as any)?.count || 0,
      isOnline,
    };
  }
}

export const syncService = SyncService.getInstance();
