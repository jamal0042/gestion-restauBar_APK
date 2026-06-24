import { SQLiteDatabase } from 'expo-sqlite';

export async function initDatabase(db: SQLiteDatabase) {
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON');

  // Users table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
      created_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'synced'
    )
  `);

  // Products table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      categorie TEXT NOT NULL CHECK(categorie IN ('Plats', 'Boissons', 'Cocktails', 'Desserts')),
      prix REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      disponible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'synced'
    )
  `);

  // Orders table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'cancelled')),
      sync_status TEXT NOT NULL DEFAULT 'pending',
      date TEXT NOT NULL,
      payment_method TEXT,
      customer_name TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Order items table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantite INTEGER NOT NULL,
      prix REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Stock movements table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('in', 'out')),
      quantite INTEGER NOT NULL,
      reason TEXT,
      date TEXT NOT NULL,
      user_id TEXT,
      sync_status TEXT DEFAULT 'synced',
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Settings table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Insert default settings
  const defaults = [
    { key: 'nom_etablissement', value: 'Mon Restaurant' },
    { key: 'adresse', value: '' },
    { key: 'telephone', value: '' },
    { key: 'email', value: '' },
    { key: 'numero_fiscal', value: '' },
    { key: 'theme', value: 'light' },
  ];

  for (const d of defaults) {
    await db.runAsync(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      d.key, d.value
    );
  }

  // Insert default admin user
  await db.runAsync(
    `INSERT OR IGNORE INTO users (id, nom, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    'admin-1', 'Administrateur', 'admin@deska.com', 'admin123', 'admin', new Date().toISOString()
  );

  // Insert default cashier
  await db.runAsync(
    `INSERT OR IGNORE INTO users (id, nom, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    'cashier-1', 'Caissier', 'cashier@deska.com', 'cashier123', 'cashier', new Date().toISOString()
  );

  // Insert sample products
  const sampleProducts = [
    { id: 'p-1', nom: 'Poulet Rôti', categorie: 'Plats', prix: 12000, stock: 50, disponible: 1 },
    { id: 'p-2', nom: 'Burger Deluxe', categorie: 'Plats', prix: 8500, stock: 30, disponible: 1 },
    { id: 'p-3', nom: 'Coca-Cola', categorie: 'Boissons', prix: 1500, stock: 100, disponible: 1 },
    { id: 'p-4', nom: 'Eau Minérale', categorie: 'Boissons', prix: 800, stock: 200, disponible: 1 },
    { id: 'p-5', nom: 'Mojito', categorie: 'Cocktails', prix: 5000, stock: 20, disponible: 1 },
    { id: 'p-6', nom: 'Piña Colada', categorie: 'Cocktails', prix: 6000, stock: 15, disponible: 1 },
    { id: 'p-7', nom: 'Tiramisu', categorie: 'Desserts', prix: 4000, stock: 25, disponible: 1 },
    { id: 'p-8', nom: 'Crème Brûlée', categorie: 'Desserts', prix: 4500, stock: 20, disponible: 1 },
  ];

  for (const p of sampleProducts) {
    await db.runAsync(
      `INSERT OR IGNORE INTO products (id, nom, categorie, prix, stock, disponible, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      p.id, p.nom, p.categorie, p.prix, p.stock, p.disponible, new Date().toISOString()
    );
  }

  console.log('Database initialized successfully');
}
