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
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  User,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { getSettings, updateSettings } from '@/src/database/settings';
import { useAuthStore } from '@/src/store/authStore';
import { checkConnection } from '@/src/api/client';
import { Settings as SettingsType } from '@/src/types';

// Helpers responsifs
const scaleSize = (size: number, width: number) => {
  const baseWidth = 375;
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { user, logout } = useAuthStore();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallScreen = screenWidth < 360;
  const horizontalPadding = isSmallScreen ? 12 : 16;

  // ✅ Extraction pour éviter le faux positif du linter sur 'dark'
  const isDarkMode = colorScheme === 'dark';

  const [settings, setSettings] = useState<SettingsType>({
    nom_etablissement: 'DESKA HôTEL',
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

  // Tailles dynamiques
  const avatarSize = scaleSize(48, screenWidth);
  const iconBoxSize = scaleSize(36, screenWidth);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(24) }]}>Paramètres</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, {
          backgroundColor: theme.card,
          borderColor: theme.border,
          marginHorizontal: horizontalPadding,
          padding: scaleSize(14, screenWidth),
        }]}>
          <View style={[styles.avatar, {
            backgroundColor: theme.primary,
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          }]}>
            <User size={scaleSize(24, screenWidth)} color={theme.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text, fontSize: scaleFont(15) }]} numberOfLines={1}>
              {user?.nom || 'Utilisateur'}
            </Text>
            <Text style={[styles.profileRole, { color: theme.textSecondary, fontSize: scaleFont(12) }]}>
              {user?.role === 'admin' ? 'Administrateur' : 'Caissier'}
            </Text>
          </View>
          <View style={styles.onlineStatus}>
            {isOnline ? (
              <View style={[styles.onlineBadge, { backgroundColor: theme.success + '15' }]}>
                <Wifi size={scaleSize(12, screenWidth)} color={theme.success} />
                <Text style={[styles.onlineText, { color: theme.success, fontSize: scaleFont(10) }]}>En ligne</Text>
              </View>
            ) : (
              <View style={[styles.onlineBadge, { backgroundColor: theme.warning + '15' }]}>
                <WifiOff size={scaleSize(12, screenWidth)} color={theme.warning} />
                <Text style={[styles.onlineText, { color: theme.warning, fontSize: scaleFont(10) }]}>Hors ligne</Text>
              </View>
            )}
          </View>
        </View>

        {/* Business Settings */}
        <View style={[styles.section, {
          backgroundColor: theme.card,
          borderColor: theme.border,
          marginHorizontal: horizontalPadding,
          padding: scaleSize(14, screenWidth),
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaleFont(14) }]}>
            Informations de l'établissement
          </Text>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { width: iconBoxSize }]}>
              <Store size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>Nom</Text>
              <TextInput
                style={[styles.input, { color: theme.text, fontSize: scaleFont(15) }]}
                value={settings.nom_etablissement}
                onChangeText={(text) => setSettings({ ...settings, nom_etablissement: text })}
                placeholder="Nom de l'établissement"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>

          <View style={[styles.inputDivider, { backgroundColor: theme.border, marginLeft: iconBoxSize + 8 }]} />

          {/* Adresse */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { width: iconBoxSize }]}>
              <MapPin size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>Adresse</Text>
              <TextInput
                style={[styles.input, { color: theme.text, fontSize: scaleFont(15) }]}
                value={settings.adresse}
                onChangeText={(text) => setSettings({ ...settings, adresse: text })}
                placeholder="Adresse"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>

          <View style={[styles.inputDivider, { backgroundColor: theme.border, marginLeft: iconBoxSize + 8 }]} />

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { width: iconBoxSize }]}>
              <Phone size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>Téléphone</Text>
              <TextInput
                style={[styles.input, { color: theme.text, fontSize: scaleFont(15) }]}
                value={settings.telephone}
                onChangeText={(text) => setSettings({ ...settings, telephone: text })}
                placeholder="Numéro de téléphone"
                placeholderTextColor={theme.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={[styles.inputDivider, { backgroundColor: theme.border, marginLeft: iconBoxSize + 8 }]} />

          {/* Email */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { width: iconBoxSize }]}>
              <Mail size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>Email</Text>
              <TextInput
                style={[styles.input, { color: theme.text, fontSize: scaleFont(15) }]}
                value={settings.email}
                onChangeText={(text) => setSettings({ ...settings, email: text })}
                placeholder="Email"
                placeholderTextColor={theme.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={[styles.inputDivider, { backgroundColor: theme.border, marginLeft: iconBoxSize + 8 }]} />

          {/* N° Fiscal */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { width: iconBoxSize }]}>
              <FileText size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: scaleFont(11) }]}>N° Fiscal</Text>
              <TextInput
                style={[styles.input, { color: theme.text, fontSize: scaleFont(15) }]}
                value={settings.numero_fiscal}
                onChangeText={(text) => setSettings({ ...settings, numero_fiscal: text })}
                placeholder="Numéro fiscal"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={[styles.section, {
          backgroundColor: theme.card,
          borderColor: theme.border,
          marginHorizontal: horizontalPadding,
          padding: scaleSize(14, screenWidth),
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: scaleFont(14) }]}>Apparence</Text>
          <View style={styles.themeRow}>
            <View style={styles.themeLeft}>
              <View style={[styles.themeIcon, {
                backgroundColor: theme.primary + '15',
                width: iconBoxSize,
                height: iconBoxSize,
                borderRadius: scaleSize(10, screenWidth),
              }]}>
                {isDarkMode ? (
                  <Moon size={scaleSize(18, screenWidth)} color={theme.primary} />
                ) : (
                  <Sun size={scaleSize(18, screenWidth)} color={theme.primary} />
                )}
              </View>
              <Text style={[styles.themeLabel, { color: theme.text, fontSize: scaleFont(14) }]}>
                Mode {isDarkMode ? 'sombre' : 'clair'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={() => {}}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.white}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, {
            backgroundColor: saved ? theme.success : theme.primary,
            marginHorizontal: horizontalPadding,
            height: scaleSize(52, screenWidth),
          }]}
          onPress={handleSave}
          activeOpacity={0.8}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Save size={scaleSize(20, screenWidth)} color={theme.white} />
          <Text style={[styles.saveButtonText, { color: theme.white, fontSize: scaleFont(16) }]}>
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, {
            backgroundColor: theme.error + '10',
            borderColor: theme.error + '30',
            marginHorizontal: horizontalPadding,
            height: scaleSize(52, screenWidth),
          }]}
          onPress={handleLogout}
          activeOpacity={0.8}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <LogOut size={scaleSize(20, screenWidth)} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error, fontSize: scaleFont(16) }]}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + scaleSize(32, screenWidth) }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
  },
  headerTitle: {
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
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
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  inputIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  inputLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  input: {
    fontWeight: '500',
    padding: 0,
  },
  inputDivider: {
    height: StyleSheet.hairlineWidth,
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
    flex: 1,
  },
  themeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  saveButtonText: {
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  logoutText: {
    fontWeight: '700',
  },
});