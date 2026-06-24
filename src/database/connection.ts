import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { initDatabase } from './schema';

let db: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!db) {
    db = await openDatabaseAsync('pos.db');
    await initDatabase(db);
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
