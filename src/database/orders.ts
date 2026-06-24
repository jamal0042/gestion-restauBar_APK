import { getDatabase } from './connection';
import { Order, OrderItem } from '../types';

export async function getOrders(): Promise<Order[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM orders ORDER BY date DESC');
  return (rows as any[]).map(r => ({
    id: r.id,
    user_id: r.user_id,
    total: r.total,
    status: r.status,
    sync_status: r.sync_status,
    date: r.date,
    payment_method: r.payment_method,
    customer_name: r.customer_name,
  }));
}

export async function getOrdersByDate(date: string): Promise<Order[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    "SELECT * FROM orders WHERE date LIKE ? ORDER BY date DESC",
    `${date}%`
  );
  return (rows as any[]).map(r => ({
    id: r.id,
    user_id: r.user_id,
    total: r.total,
    status: r.status,
    sync_status: r.sync_status,
    date: r.date,
    payment_method: r.payment_method,
    customer_name: r.customer_name,
  }));
}

export async function getPendingOrders(): Promise<Order[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT * FROM orders WHERE sync_status = 'pending' ORDER BY date DESC");
  return (rows as any[]).map(r => ({
    id: r.id,
    user_id: r.user_id,
    total: r.total,
    status: r.status,
    sync_status: r.sync_status,
    date: r.date,
    payment_method: r.payment_method,
    customer_name: r.customer_name,
  }));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM orders WHERE id = ?', id);
  if (!row) return null;
  const r = row as any;
  return {
    id: r.id,
    user_id: r.user_id,
    total: r.total,
    status: r.status,
    sync_status: r.sync_status,
    date: r.date,
    payment_method: r.payment_method,
    customer_name: r.customer_name,
  };
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    `SELECT oi.*, p.nom FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
    orderId
  );
  return (rows as any[]).map(r => ({
    id: r.id,
    order_id: r.order_id,
    product_id: r.product_id,
    quantite: r.quantite,
    prix: r.prix,
    nom: r.nom,
  }));
}

export async function createOrder(order: Order, items: OrderItem[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO orders (id, user_id, total, status, sync_status, date, payment_method, customer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      order.id, order.user_id, order.total, order.status, 'pending', order.date, order.payment_method || '', order.customer_name || ''
    );
    for (const item of items) {
      await db.runAsync(
        'INSERT INTO order_items (id, order_id, product_id, quantite, prix) VALUES (?, ?, ?, ?, ?)',
        item.id || `${order.id}-${item.product_id}`, order.id, item.product_id, item.quantite, item.prix
      );
      // Update stock
      const prod = await db.getFirstAsync('SELECT stock FROM products WHERE id = ?', item.product_id);
      if (prod) {
        const newStock = (prod as any).stock - item.quantite;
        await db.runAsync(
          'UPDATE products SET stock = ?, updated_at = ?, sync_status = ? WHERE id = ?',
          newStock, new Date().toISOString(), 'pending', item.product_id
        );
      }
    }
  });
}

export async function updateOrderSyncStatus(id: string, syncStatus: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE orders SET sync_status = ? WHERE id = ?', syncStatus, id);
}

export async function deleteOrder(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM order_items WHERE order_id = ?', id);
    await db.runAsync('DELETE FROM orders WHERE id = ?', id);
  });
}

export async function getDailySales(date: string): Promise<{ total: number; count: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT SUM(total) as total, COUNT(*) as count FROM orders WHERE date LIKE ? AND status = 'completed'",
    `${date}%`
  );
  if (!row) return { total: 0, count: 0 };
  const r = row as any;
  return { total: r.total || 0, count: r.count || 0 };
}

export async function getTopProducts(date: string, limit: number = 5): Promise<{ nom: string; quantite: number; total: number }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    `SELECT p.nom, SUM(oi.quantite) as quantite, SUM(oi.prix * oi.quantite) as total
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.date LIKE ? AND o.status = 'completed'
     GROUP BY p.id
     ORDER BY quantite DESC
     LIMIT ?`,
    `${date}%`, limit
  );
  return (rows as any[]).map(r => ({
    nom: r.nom,
    quantite: r.quantite || 0,
    total: r.total || 0,
  }));
}
