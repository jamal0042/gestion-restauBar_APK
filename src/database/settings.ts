import { getDatabase } from './connection';
import { Settings } from '../types';

export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  (rows as any[]).forEach(r => {
    settings[r.key] = r.value;
  });
  return {
    nom_etablissement: settings.nom_etablissement || 'Mon Restaurant',
    adresse: settings.adresse || 'Av Bungishabaku,num 27',
    telephone: settings.telephone || '+243 825 574 859 , +243 970 186 504 ',
    email: settings.email || '',
    numero_fiscal: settings.numero_fiscal || 'RCCM/22-A-132010318',
    //num_impot: settings.num_impot || 'A!1703369G',
    //IN : settings.IN || 'IN 07-G4701-N12731k',
    theme: (settings.theme as 'light' | 'dark') || 'light',
  };
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  const db = await getDatabase();
  for (const [key, value] of Object.entries(settings)) {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      key, value, value
    );
  }
}
