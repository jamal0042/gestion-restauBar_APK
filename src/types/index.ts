export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  nom: string;
  email: string;
  password?: string;
  role: UserRole;
  created_at: string;
}

export type ProductCategory = 'Plats' | 'Boissons' | 'Cocktails' | 'Desserts';

export interface Product {
  id: string;
  nom: string;
  categorie: ProductCategory;
  prix: number;
  stock: number;
  image?: string;
  disponible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  quantite: number;
  prix: number;
  nom?: string;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  sync_status: SyncStatus;
  date: string;
  items?: OrderItem[];
  payment_method?: string;
  customer_name?: string;
}

export interface Settings {
  nom_etablissement: string;
  logo?: string;
  adresse: string;
  telephone: string;
  email: string;
  numero_fiscal: string;
  theme: 'light' | 'dark';
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_money';

export interface CartItem {
  product: Product;
  quantite: number;
}

export interface DailyReport {
  date: string;
  total_sales: number;
  total_orders: number;
  total_items: number;
  profit: number;
}

export interface StockMovement {
  id?: string;
  product_id: string;
  type: 'in' | 'out';
  quantite: number;
  reason?: string;
  date: string;
  user_id?: string;
}
