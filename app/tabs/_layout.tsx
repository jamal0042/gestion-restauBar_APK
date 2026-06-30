import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';

import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  Receipt,
  TrendingUp,
} from 'lucide-react-native';


const COLORS = {
  light: {
    background: '#FFFFFF',
    border: '#E0E0E0',
    active: '#C2185B',
    inactive: '#757575',
  },

  dark: {
    background: '#2e2e2e',
    border: '#424242',
    active: '#C2185B',
    inactive: '#9E9E9E',
  },
};


export default function TabsLayout() {

  const { user } = useAuthStore();

  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  const isAdmin = user?.role === 'admin';

  const colors = isDark ? COLORS.dark : COLORS.light;

  const insets = useSafeAreaInsets();



  const screenOptions = {

    headerShown: false,


    // 🔥 Menu en haut
    tabBarPosition: 'top',


    tabBarStyle: {

      backgroundColor: colors.background,

      borderBottomColor: colors.border,

      borderBottomWidth: 1,


      // Adaptation téléphone
      height:
        Platform.OS === 'ios'
          ? 70 + insets.top
          : 65,


      paddingTop:
        Platform.OS === 'ios'
          ? insets.top
          : 5,


      paddingBottom: 5,

    },


    tabBarActiveTintColor: colors.active,

    tabBarInactiveTintColor: colors.inactive,


    tabBarLabelStyle: {

      fontSize: 11,

      fontWeight: '600' as const,

    },


    tabBarIconStyle: {

      marginBottom: 2,

    },

  };



  // ADMIN

  const adminTabs = [

    {
      name:'index',
      title:'Dashboard',
      icon:LayoutDashboard
    },

    {
      name:'products',
      title:'Produits',
      icon:Package
    },

    {
      name:'users',
      title:'Utilisateurs',
      icon:Users
    },

    {
      name:'reports',
      title:'Rapports',
      icon:BarChart3
    },

    {
      name:'settings',
      title:'Paramètres',
      icon:Settings
    },

  ];




  // CAISSIER

  const cashierTabs = [

    {
      name:'index',
      title:'Ventes',
      icon:Receipt
    },

    {
      name:'products',
      title:'Produits',
      icon:Package
    },

    {
      name:'history',
      title:'Historique',
      icon:TrendingUp
    },

    {
      name:'settings',
      title:'Paramètres',
      icon:Settings
    },

  ];



  const tabs = isAdmin ? adminTabs : cashierTabs;



  return (

    <Tabs screenOptions={screenOptions}>


      {tabs.map((tab)=>(


        <Tabs.Screen

          key={tab.name}

          name={tab.name}


          options={{

            title:tab.title,


            tabBarIcon:({color,size})=>(

              <tab.icon

                color={color}

                size={size}

              />

            ),

          }}

        />


      ))}


    </Tabs>

  );

}