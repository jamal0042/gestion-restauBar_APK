import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  Shield,
  User,
} from 'lucide-react-native';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import { getUsers, createUser, updateUser, deleteUser } from '@/src/database/users';
import { User as UserType, UserRole } from '@/src/types';

// Helpers responsifs
const scaleSize = (size: number, width: number) => {
  const baseWidth = 375;
  return PixelRatio.roundToNearestPixel((width / baseWidth) * size);
};

const scaleFont = (size: number) => {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
};

export default function UsersScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cashier');

  const isSmallScreen = screenWidth < 360;
  const modalMaxHeight = screenHeight < 600 ? '92%' : '85%';

  const loadUsers = useCallback(async () => {
    const all = await getUsers();
    setUsers(all);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    let filtered = [...users];
    if (searchQuery.trim()) {
      filtered = filtered.filter(u =>
        u.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim() || (!editingUser && !formPassword.trim())) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingUser) {
        const updates: Partial<UserType> = {
          nom: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
        };
        if (formPassword.trim()) {
          updates.password = formPassword.trim();
        }
        await updateUser(editingUser.id, updates);
      } else {
        const newUser: UserType = {
          id: `user-${Date.now()}`,
          nom: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          role: formRole,
          created_at: new Date().toISOString(),
        };
        await createUser(newUser);
      }
      await loadUsers();
      closeForm();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'utilisateur');
    }
  };

  const handleDelete = (user: UserType) => {
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      Alert.alert('Erreur', 'Impossible de supprimer le dernier administrateur');
      return;
    }
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer ${user.nom} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteUser(user.id);
            await loadUsers();
          },
        },
      ]
    );
  };

  const openForm = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setFormName(user.nom);
      setFormEmail(user.email);
      setFormPassword('');
      setFormRole(user.role);
    } else {
      setEditingUser(null);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('cashier');
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const renderUser = ({ item }: { item: UserType }) => {
    const isAdmin = item.role === 'admin';
    const roleColor = isAdmin ? theme.primary : theme.success;
    const avatarSize = scaleSize(48, screenWidth);
    const btnSize = scaleSize(40, screenWidth);

    return (
      <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.userAvatar, { 
          width: avatarSize, 
          height: avatarSize, 
          borderRadius: avatarSize / 2,
        }]}>
          <User size={scaleSize(22, screenWidth)} color={theme.white} />
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.text, fontSize: scaleFont(15) }]} numberOfLines={1}>
            {item.nom}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary, fontSize: scaleFont(12) }]} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '15' }]}>
            <Shield size={scaleSize(11, screenWidth)} color={roleColor} />
            <Text style={[styles.roleText, { color: roleColor, fontSize: scaleFont(11) }]}>
              {isAdmin ? 'Admin' : 'Caissier'}
            </Text>
          </View>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.success + '15', width: btnSize, height: btnSize }]}
            onPress={() => openForm(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Edit3 size={scaleSize(16, screenWidth)} color={theme.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.error + '15', width: btnSize, height: btnSize }]}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={scaleSize(16, screenWidth)} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: isSmallScreen ? 12 : 16 }]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(22) }]}>Utilisateurs</Text>
        <TouchableOpacity
          style={[styles.addButton, { 
            backgroundColor: theme.primary, 
            width: scaleSize(44, screenWidth), 
            height: scaleSize(44, screenWidth),
          }]}
          onPress={() => openForm()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={scaleSize(20, screenWidth)} color={theme.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { 
        backgroundColor: theme.input, 
        borderColor: theme.border,
        marginHorizontal: isSmallScreen ? 12 : 16,
        height: scaleSize(44, screenWidth),
      }]}>
        <Search size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text, fontSize: scaleFont(15) }]}
          placeholder="Rechercher..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={scaleSize(18, screenWidth)} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.usersList, { paddingHorizontal: isSmallScreen ? 12 : 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { paddingVertical: screenHeight * 0.15 }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <User size={scaleSize(36, screenWidth)} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: scaleFont(15) }]}>
              Aucun utilisateur trouvé
            </Text>
          </View>
        }
      />

      {/* User Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={closeForm}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 10 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <View style={[styles.modalPanel, { 
                backgroundColor: theme.background,
                maxHeight: modalMaxHeight,
                borderTopLeftRadius: isSmallScreen ? 16 : 24,
                borderTopRightRadius: isSmallScreen ? 16 : 24,
                padding: isSmallScreen ? 16 : 20,
              }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text, fontSize: scaleFont(18), flex: 1 }]} numberOfLines={1}>
                    {editingUser ? 'Modifier' : 'Nouvel utilisateur'}
                  </Text>
                  <TouchableOpacity onPress={closeForm} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={scaleSize(24, screenWidth)} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  contentContainerStyle={styles.scrollForm}
                >
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Nom *</Text>
                    <TextInput
                      style={[styles.formInput, { 
                        backgroundColor: theme.input, 
                        color: theme.text, 
                        borderColor: theme.border,
                        fontSize: scaleFont(16),
                        height: scaleSize(48, screenWidth),
                      }]}
                      placeholder="Nom complet"
                      placeholderTextColor={theme.placeholder}
                      value={formName}
                      onChangeText={setFormName}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Email *</Text>
                    <TextInput
                      style={[styles.formInput, { 
                        backgroundColor: theme.input, 
                        color: theme.text, 
                        borderColor: theme.border,
                        fontSize: scaleFont(16),
                        height: scaleSize(48, screenWidth),
                      }]}
                      placeholder="email@exemple.com"
                      placeholderTextColor={theme.placeholder}
                      value={formEmail}
                      onChangeText={setFormEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>
                      {editingUser ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe *'}
                    </Text>
                    <TextInput
                      style={[styles.formInput, { 
                        backgroundColor: theme.input, 
                        color: theme.text, 
                        borderColor: theme.border,
                        fontSize: scaleFont(16),
                        height: scaleSize(48, screenWidth),
                      }]}
                      placeholder="••••••••"
                      placeholderTextColor={theme.placeholder}
                      value={formPassword}
                      onChangeText={setFormPassword}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text, fontSize: scaleFont(14) }]}>Rôle</Text>
                    <View style={[styles.roleSelector, { gap: isSmallScreen ? 8 : 12 }]}>
                      <TouchableOpacity
                        style={[
                          styles.roleOption,
                          {
                            backgroundColor: formRole === 'admin' ? theme.primary : theme.input,
                            borderColor: formRole === 'admin' ? theme.primary : theme.border,
                            paddingVertical: scaleSize(12, screenWidth),
                          },
                        ]}
                        onPress={() => setFormRole('admin')}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Shield size={scaleSize(16, screenWidth)} color={formRole === 'admin' ? theme.white : theme.text} />
                        <Text style={{ 
                          color: formRole === 'admin' ? theme.white : theme.text, 
                          fontWeight: '600', 
                          marginLeft: 6,
                          fontSize: scaleFont(13),
                        }}>
                          Admin
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.roleOption,
                          {
                            backgroundColor: formRole === 'cashier' ? theme.success : theme.input,
                            borderColor: formRole === 'cashier' ? theme.success : theme.border,
                            paddingVertical: scaleSize(12, screenWidth),
                          },
                        ]}
                        onPress={() => setFormRole('cashier')}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <User size={scaleSize(16, screenWidth)} color={formRole === 'cashier' ? theme.white : theme.text} />
                        <Text style={{ 
                          color: formRole === 'cashier' ? theme.white : theme.text, 
                          fontWeight: '600', 
                          marginLeft: 6,
                          fontSize: scaleFont(13),
                        }}>
                          Caissier
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, { 
                      backgroundColor: theme.primary,
                      height: scaleSize(52, screenWidth),
                      marginTop: isSmallScreen ? 4 : 8,
                    }]}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Save size={scaleSize(20, screenWidth)} color={theme.white} />
                    <Text style={[styles.saveButtonText, { color: theme.white, fontSize: scaleFont(16) }]}>Sauvegarder</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: '700',
  },
  addButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  usersList: {
    gap: 10,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    backgroundColor: '#C2185B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
    minWidth: 0, // Permet le truncation du texte
  },
  userName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  roleText: {
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalPanel: {
    paddingBottom: 20,
  },
  scrollForm: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  roleSelector: {
    flexDirection: 'row',
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  saveButtonText: {
    fontWeight: '700',
  },
});