import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { lightTheme, darkTheme } from '@/src/utils/theme';
import AdminDashboard from '@/src/screens/AdminDashboard';
import CashierDashboard from '@/src/screens/CashierDashboard';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <View style={styles.container}>
      {isAdmin ? <AdminDashboard /> : <CashierDashboard />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
