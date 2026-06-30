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
  ShoppingCart,
  Clock3,
} from 'lucide-react-native';



const COLORS = {

  light:{
    background:'#FFFFFF',
    border:'#E0E0E0',
    active:'#C2185B',
    inactive:'#757575'
  },

  dark:{
    background:'#2e2e2e',
    border:'#424242',
    active:'#C2185B',
    inactive:'#9E9E9E'
  }

};




export default function TabsLayout(){


const {user}=useAuthStore();


const scheme=useColorScheme();


const dark=scheme==='dark';


const colors=dark?COLORS.dark:COLORS.light;


const isAdmin=user?.role==="admin";


const insets=useSafeAreaInsets();





const options={


headerShown:false,


// force en haut
tabBarPosition:'top' as const,


tabBarStyle:{


backgroundColor:colors.background,


borderBottomColor:colors.border,


borderBottomWidth:1,


position:'absolute' as const,


top:0,


left:0,


right:0,



height:

Platform.OS==="ios"

? 70 + insets.top

: 65,



paddingTop:

Platform.OS==="ios"

? insets.top

: 8,



},



tabBarActiveTintColor:colors.active,


tabBarInactiveTintColor:colors.inactive,



tabBarLabelStyle:{


fontSize:11,


fontWeight:'600' as const


},


};







const adminTabs=[


{
name:"index",
title:"Dashboard",
icon:LayoutDashboard
},


{
name:"products",
title:"Produits",
icon:Package
},


{
name:"users",
title:"Utilisateurs",
icon:Users
},


{
name:"reports",
title:"Rapports",
icon:BarChart3
},


{
name:"settings",
title:"Paramètres",
icon:Settings
}

];






const cashierTabs=[


{
name:"index",
title:"Ventes",
icon:ShoppingCart
},


{
name:"products",
title:"Produits",
icon:Package
},


{
name:"history",
title:"Historique",
icon:Clock3
},


{
name:"settings",
title:"Paramètres",
icon:Settings
}

];





const tabs=isAdmin?adminTabs:cashierTabs;




return(


<Tabs screenOptions={options}>


{
tabs.map((tab)=>(


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


)



}}


/>



))

}



</Tabs>


)


}