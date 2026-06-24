import { getDatabase } from './connection';
import { StockMovement } from '../types';

export async function getStockMovements(): Promise<StockMovement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM stock_movements ORDER BY date DESC');
  return (rows as any[]).map(r => ({
    id: r.id,
    product_id: r.product_id,
    type: r.type,
    quantite: r.quantite,
    reason: r.reason,
    date: r.date,
    user_id: r.user_id,
  }));
}

export async function getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY date DESC', productId);
  return (rows as any[]).map(r => ({
    id: r.id,
    product_id: r.product_id,
    type: r.type,
    quantite: r.quantite,
    reason: r.reason,
    date: r.date,
    user_id: r.user_id,
  }));
}

export async function createStockMovement(movement: StockMovement): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO stock_movements (id, product_id, type, quantite, reason, date, user_id, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      movement.id || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      movement.product_id,
      movement.type,
      movement.quantite,
      movement.reason || '',
      movement.date,
      movement.user_id || '',
      'pending'
    );
    // Update product stock
    const product = await db.getFirstAsync('SELECT stock FROM products WHERE id = ?', movement.product_id);
    if (product) {
      const currentStock = (product as any).stock;
      const newStock = movement.type === 'in'
        ? currentStock + movement.quantite
        : currentStock - movement.quantite;
      await db.runAsync(
        'UPDATE products SET stock = ?, updated_at = ?, sync_status = ? WHERE id = ?',
        newStock,
        new Date().toISOString(),
        'pending',
        movement.product_id
      );
    }
  });
}
