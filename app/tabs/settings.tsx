import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Save,
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  Moon,
  Sun,
  ChevronRight,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { getSettings, updateSettings } from '@/src/database/settings';
import { useAuthStore } from '@/src/store/authStore';
import { checkConnection } from '@/src/api/client';
import { Settings as SettingsType } from '@/src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { user, logout } = useAuthStore();

  const [settings, setSettings] = useState<SettingsType>({
    nom_etablissement: 'Mon Restaurant',
    adresse: '',
    telephone: '',
    email: '',
    numero_fiscal: '',
    theme: 'light',
  });
  const [isOnline, setIsOnline] = useState(true);
  const [saved, setSaved] = useState(false);

  const loadSettings = useCallback(async () => {
    const data = await getSettings();
    setSettings(data);
  }, []);

  useEffect(() => {
    loadSettings();
    checkConnection().then(setIsOnline);
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        nom_etablissement: settings.nom_etablissement,
        adresse: settings.adresse,
        telephone: settings.telephone,
        email: settings.email,
        numero_fiscal: settings.numero_fiscal,
        theme: settings.theme,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Paramètres</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <User size={28} color={theme.white} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.text }]}>{user?.nom || 'Utilisateur'}</Text>
          <Text style={[styles.profileRole, { color: theme.textSecondary }]}>
            {user?.role === 'admin' ? 'Administrateur' : 'Caissier'}
          </Text>
        </View>
        <View style={styles.onlineStatus}>
          {isOnline ? (
            <View style={[styles.onlineBadge, { backgroundColor: theme.success + '15' }]}>
              <Wifi size={14} color={theme.success} />
              <Text style={[styles.onlineText, { color: theme.success }]}>En ligne</Text>
            </View>
          ) : (
            <View style={[styles.onlineBadge, { backgroundColor: theme.warning + '15' }]}>
              <WifiOff size={14} color={theme.warning} />
              <Text style={[styles.onlineText, { color: theme.warning }]}>Hors ligne</Text>
            </View>
          )}
        </View>
      </View>

      {/* Business Settings */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Informations de l'établissement</Text>

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Store size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nom</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={settings.nom_etablissement}
              onChangeText={(text) => setSettings({ ...settings, nom_etablissement: text })}
              placeholder="Nom de l'établissement"
              placeholderTextColor={theme.placeholder}
            />
          </View>
        </View>

        <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <MapPin size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Adresse</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={settings.adresse}
              onChangeText={(text) => setSettings({ ...settings, adresse: text })}
              placeholder="Adresse"
              placeholderTextColor={theme.placeholder}
            />
          </View>
        </View>

        <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Phone size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Téléphone</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={settings.telephone}
              onChangeText={(text) => setSettings({ ...settings, telephone: text })}
              placeholder="Numéro de téléphone"
              placeholderTextColor={theme.placeholder}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Mail size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={settings.email}
              onChangeText={(text) => setSettings({ ...settings, email: text })}
              placeholder="Email"
              placeholderTextColor={theme.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <FileText size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>N° Fiscal</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={settings.numero_fiscal}
              onChangeText={(text) => setSettings({ ...settings, numero_fiscal: text })}
              placeholder="Numéro fiscal"
              placeholderTextColor={theme.placeholder}
            />
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Apparence</Text>
        <View style={styles.themeRow}>
          <View style={styles.themeLeft}>
            <View style={[styles.themeIcon, { backgroundColor: theme.primary + '15' }]}>
              {colorScheme === 'dark' ? (
                <Moon size={18} color={theme.primary} />
              ) : (
                <Sun size={18} color={theme.primary} />
              )}
            </View>
            <Text style={[styles.themeLabel, { color: theme.text }]}>
              Mode {colorScheme === 'dark' ? 'sombre' : 'clair'}
            </Text>
          </View>
          <Switch
            value={colorScheme === 'dark'}
            onValueChange={() => {}}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={theme.white}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: saved ? theme.success : theme.primary }]}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Save size={20} color={theme.white} />
        <Text style={[styles.saveButtonText, { color: theme.white }]}>
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.error + '10', borderColor: theme.error + '30' }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut size={20} color={theme.error} />
        <Text style={[styles.logoutText, { color: theme.error }]}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 13,
  },
  onlineStatus: {
    alignItems: 'flex-end',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  inputIcon: {
    width: 36,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  inputDivider: {
    height: 1,
    marginLeft: 44,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 32,
  },
});
