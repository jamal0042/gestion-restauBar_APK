import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/store/authStore';

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Receipt,
  Clock3,
} from 'lucide-react-native';



export default function TabsLayout() {


  const { user } = useAuthStore();


  const colorScheme = useColorScheme();


  const isDark = colorScheme === 'dark';


  const isAdmin = user?.role === 'admin';


  const insets = useSafeAreaInsets();




  return (



    <Tabs


      screenOptions={{


        headerShown:false,



        // 🔥 MENU EN HAUT
        tabBarPosition:'top' as const,



        tabBarStyle:{


          backgroundColor: isDark ? '#212121' : '#FFFFFF',


          borderBottomColor: isDark ? '#424242' : '#E0E0E0',


          borderBottomWidth:1,



          height:

          Platform.OS === 'ios'

          ? 70 + insets.top

          : 65,



          paddingTop:

          Platform.OS === 'ios'

          ? insets.top

          : 5,



          paddingBottom:5,


        },





        tabBarActiveTintColor:'#C2185B',



        tabBarInactiveTintColor:

        isDark ? '#9E9E9E' : '#757575',




        tabBarLabelStyle:{


          fontSize:11,


          fontWeight:'500',


        },


      }}



    >





      <Tabs.Screen


        name="index"


        options={{



          title:isAdmin ? 'Dashboard' : 'Ventes',




          tabBarIcon:({color,size})=>(



            isAdmin ?


            <LayoutDashboard

            size={size}

            color={color}

            />


            :


            <ShoppingCart

            size={size}

            color={color}

            />


          ),



        }}



      />








      <Tabs.Screen


        name="products"


        options={{


          title:'Produits',


          tabBarIcon:({color,size})=>(


            <Package

            size={size}

            color={color}

            />


          ),


        }}



      />







      {isAdmin && (



        <Tabs.Screen


        name="users"


        options={{


          title:'Utilisateurs',



          tabBarIcon:({color,size})=>(



            <Users

            size={size}

            color={color}

            />



          ),


        }}



        />


      )}







      {isAdmin && (



        <Tabs.Screen


        name="reports"


        options={{


          title:'Rapports',



          tabBarIcon:({color,size})=>(



            <BarChart3

            size={size}

            color={color}

            />



          ),


        }}



        />


      )}







      {!isAdmin && (



        <Tabs.Screen


        name="history"


        options={{


          title:'Historique',



          tabBarIcon:({color,size})=>(



            <Clock3

            size={size}

            color={color}

            />



          ),


        }}



        />


      )}







      <Tabs.Screen


        name="settings"


        options={{


          title:'Paramètres',



          tabBarIcon:({color,size})=>(



            <Settings

            size={size}

            color={color}

            />



          ),



        }}



      />





    </Tabs>


  );

}