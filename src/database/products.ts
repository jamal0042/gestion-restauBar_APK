import { getDatabase } from './connection';
import { Product } from '../types';

export async function getProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM products ORDER BY categorie, nom');
  return (rows as any[]).map(r => ({
    id: r.id,
    nom: r.nom,
    categorie: r.categorie,
    prix: r.prix,
    stock: r.stock,
    image: r.image,
    disponible: r.disponible === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function getProductsByCategory(categorie: string): Promise<Product[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM products WHERE categorie = ? ORDER BY nom', categorie);
  return (rows as any[]).map(r => ({
    id: r.id,
    nom: r.nom,
    categorie: r.categorie,
    prix: r.prix,
    stock: r.stock,
    image: r.image,
    disponible: r.disponible === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM products WHERE id = ?', id);
  if (!row) return null;
  const r = row as any;
  return {
    id: r.id,
    nom: r.nom,
    categorie: r.categorie,
    prix: r.prix,
    stock: r.stock,
    image: r.image,
    disponible: r.disponible === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function createProduct(product: Product): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO products (id, nom, categorie, prix, stock, image, disponible, created_at, updated_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    product.id, product.nom, product.categorie, product.prix, product.stock, product.image || '', product.disponible ? 1 : 0, product.created_at || new Date().toISOString(), product.updated_at || new Date().toISOString(), 'pending'
  );
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const db = await getDatabase();
  if (data.nom) await db.runAsync('UPDATE products SET nom = ?, updated_at = ? WHERE id = ?', data.nom, new Date().toISOString(), id);
  if (data.categorie) await db.runAsync('UPDATE products SET categorie = ?, updated_at = ? WHERE id = ?', data.categorie, new Date().toISOString(), id);
  if (data.prix !== undefined) await db.runAsync('UPDATE products SET prix = ?, updated_at = ? WHERE id = ?', data.prix, new Date().toISOString(), id);
  if (data.stock !== undefined) await db.runAsync('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?', data.stock, new Date().toISOString(), id);
  if (data.image !== undefined) await db.runAsync('UPDATE products SET image = ?, updated_at = ? WHERE id = ?', data.image, new Date().toISOString(), id);
  if (data.disponible !== undefined) await db.runAsync('UPDATE products SET disponible = ?, updated_at = ? WHERE id = ?', data.disponible ? 1 : 0, new Date().toISOString(), id);
  await db.runAsync('UPDATE products SET sync_status = ? WHERE id = ?', 'pending', id);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM products WHERE id = ?', id);
}

export async function updateStock(id: string, newStock: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE products SET stock = ?, updated_at = ?, sync_status = ? WHERE id = ?',
    newStock, new Date().toISOString(), 'pending', id
  );
}

export async function getLowStockProducts(threshold: number = 10): Promise<Product[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM products WHERE stock <= ? AND disponible = 1 ORDER BY stock ASC', threshold);
  return (rows as any[]).map(r => ({
    id: r.id,
    nom: r.nom,
    categorie: r.categorie,
    prix: r.prix,
    stock: r.stock,
    image: r.image,
    disponible: r.disponible === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}
