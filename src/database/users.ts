import { getDatabase } from './connection';
import { User } from '../types';

export async function getUsers(): Promise<User[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM users ORDER BY created_at DESC');
  return (rows as any[]).map(r => ({
    id: r.id,
    nom: r.nom,
    email: r.email,
    role: r.role,
    created_at: r.created_at,
  }));
}

export async function getUserByEmail(email: string, password: string): Promise<User | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM users WHERE email = ? AND password = ?', email, password);
  if (!row) return null;
  const r = row as any;
  return {
    id: r.id,
    nom: r.nom,
    email: r.email,
    role: r.role,
    created_at: r.created_at,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', id);
  if (!row) return null;
  const r = row as any;
  return {
    id: r.id,
    nom: r.nom,
    email: r.email,
    role: r.role,
    created_at: r.created_at,
  };
}

export async function createUser(user: User): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO users (id, nom, email, password, role, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    user.id, user.nom, user.email, user.password || '', user.role, user.created_at, 'pending'
  );
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  const db = await getDatabase();
  if (data.nom) await db.runAsync('UPDATE users SET nom = ? WHERE id = ?', data.nom, id);
  if (data.email) await db.runAsync('UPDATE users SET email = ? WHERE id = ?', data.email, id);
  if (data.password) await db.runAsync('UPDATE users SET password = ? WHERE id = ?', data.password, id);
  if (data.role) await db.runAsync('UPDATE users SET role = ? WHERE id = ?', data.role, id);
  await db.runAsync('UPDATE users SET sync_status = ? WHERE id = ?', 'pending', id);
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM users WHERE id = ?', id);
}
