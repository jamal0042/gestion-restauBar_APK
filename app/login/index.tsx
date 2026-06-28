import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Store, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react-native';
import { getUserByEmail } from '@/src/database';
import { useAuthStore } from '@/src/store/authStore';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { checkConnection } from '@/src/api/client';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setLoading } = useAuthStore();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkConnection().then(setIsOnline);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLocalLoading(true);
    setError('');

    try {
      const user = await getUserByEmail(email.trim(), password.trim());
      if (user) {
        setUser(user);
        setLoading(false);
        router.replace('/tabs');
      } else {
        setError('Identifiants incorrects');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Store color={theme.white} size={48} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>DeskaHÔTEL</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Gestion des ventes
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.onlineIndicator}>
            {isOnline ? (
              <View style={styles.onlineRow}>
                <Wifi size={14} color={theme.success} />
                <Text style={[styles.onlineText, { color: theme.success }]}>En ligne</Text>
              </View>
            ) : (
              <View style={styles.onlineRow}>
                <WifiOff size={14} color={theme.warning} />
                <Text style={[styles.onlineText, { color: theme.warning }]}>Hors ligne</Text>
              </View>
            )}
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: theme.error + '20' }]}>
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
              placeholder="email@exemple.com"
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Mot de passe</Text>
            <View style={[styles.passwordContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Votre mot de passe"
                placeholderTextColor={theme.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }, loading && styles.disabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <Text style={[styles.loginText, { color: theme.white }]}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.hintContainer}>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
            </Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
            </Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              concepteur logiciel: Faraja malembe 
              E-mail : malembefaraja@gmail.com,+243992720042
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#C2185B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  onlineIndicator: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  loginButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '600',
  },
  hintContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
});
