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
} from 'react-native';
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

export default function UsersScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cashier');

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

  const renderUser = ({ item }: { item: UserType }) => (
    <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.userAvatar}>
        <User size={24} color={theme.white} />
      </View>
      <View style={styles.userDetails}>
        <Text style={[styles.userName, { color: theme.text }]}>{item.nom}</Text>
        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{item.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? theme.primary + '15' : theme.success + '15' }]}>
          <Shield size={12} color={item.role === 'admin' ? theme.primary : theme.success} />
          <Text style={[styles.roleText, { color: item.role === 'admin' ? theme.primary : theme.success }]}>
            {item.role === 'admin' ? 'Admin' : 'Caissier'}
          </Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.success + '15' }]}
          onPress={() => openForm(item)}
        >
          <Edit3 size={16} color={theme.success} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.error + '15' }]}
          onPress={() => handleDelete(item)}
        >
          <Trash2 size={16} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Utilisateurs</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => openForm()}
          activeOpacity={0.8}
        >
          <Plus size={20} color={theme.white} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
        <Search size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Rechercher..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun utilisateur trouvé
            </Text>
          </View>
        }
      />

      {/* User Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.modalPanel, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingUser ? 'Modifier' : 'Nouvel utilisateur'}
              </Text>
              <TouchableOpacity onPress={closeForm}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Nom *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                placeholder="Nom complet"
                placeholderTextColor={theme.placeholder}
                value={formName}
                onChangeText={setFormName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Email *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                placeholder="email@exemple.com"
                placeholderTextColor={theme.placeholder}
                value={formEmail}
                onChangeText={setFormEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>
                {editingUser ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe *'}
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                placeholder="••••••••"
                placeholderTextColor={theme.placeholder}
                value={formPassword}
                onChangeText={setFormPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Rôle</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: formRole === 'admin' ? theme.primary : theme.input,
                      borderColor: formRole === 'admin' ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setFormRole('admin')}
                >
                  <Shield size={16} color={formRole === 'admin' ? theme.white : theme.text} />
                  <Text style={{ color: formRole === 'admin' ? theme.white : theme.text, fontWeight: '600', marginLeft: 6 }}>
                    Admin
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: formRole === 'cashier' ? theme.success : theme.input,
                      borderColor: formRole === 'cashier' ? theme.success : theme.border,
                    },
                  ]}
                  onPress={() => setFormRole('cashier')}
                >
                  <User size={16} color={formRole === 'cashier' ? theme.white : theme.text} />
                  <Text style={{ color: formRole === 'cashier' ? theme.white : theme.text, fontWeight: '600', marginLeft: 6 }}>
                    Caissier
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Save size={20} color={theme.white} />
              <Text style={[styles.saveButtonText, { color: theme.white }]}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  usersList: {
    padding: 16,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C2185B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
