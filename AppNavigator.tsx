import * as React from 'react';
import { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
//import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';
import { UserContext } from './components/Context';
import ShopList from './screens/shoplist';
import MealMenu from './screens/mealmenu';
import ShopOrders from './screens/shoporders';
import ShopManage from './screens/shopmanage';
import AdminManage from './screens/adminmanage';
import PersonalEdit from './screens/personaledit';
import LoginScreen from './screens/login';
import UserJoin from './screens/useradd';
import ForgotPasswd from './screens/forgotpasswd';
import AboutApp from './screens/aboutapp';
import LogoutScreen from './screens/logout';
import UserOrderRecords from './screens/userorderrecords';
import {UserContextType} from './lib/types';

export default function AppNavigator() {
  const userContext: UserContextType = useContext(UserContext);

  const Stack = createStackNavigator();
  const Tab = createBottomTabNavigator();

  function LoginStack() {
    return (
      <Stack.Navigator>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Welcome to Happy Eats!' }}
          />
        <Stack.Screen 
          name="UserJoin" 
          component={UserJoin} 
          options={{ title: 'Welcome to Happy Eats!' }}
          />
        <Stack.Screen 
          name="ForgotPasswd" 
          component={ForgotPasswd} 
          options={{ title: 'Welcome to Happy Eats!' }}
          />
      </Stack.Navigator>
    ); 
  }
  
  function OrderStack() {
    return (
      <Stack.Navigator>
        <Stack.Screen 
          name="ShopList" 
          component={ShopList} 
          options={{ title: 'Welcome to Happy Eats!' }}
          />
        <Stack.Screen 
          name="MealMenu" 
          component={MealMenu} 
          options={({ route }) => ({ title: (route.params as any).shopname })}
          />
      </Stack.Navigator>
    ); 
  }
  
  function LoginedStack() {
    return (
      <Tab.Navigator  
        screenOptions={{
          tabBarInactiveTintColor: 'gray',
        }}>
        
        {userContext.user.usertype === 2 &&
        <>
        <Tab.Screen
          name="ShopOrders"
          component={ShopOrders}
          options={{ headerTitle: 'Restaurant Orders', tabBarLabel: 'Shop Orders',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'apps' : 'apps-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }} />

        <Tab.Screen
          name="ShopAdmin"
          component={ShopManage}
          options={{ headerTitle: 'Manage My Restaurants', tabBarLabel: 'Shop Admin',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'desktop' : 'desktop-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }} />
        </>
        }
        
        <Tab.Screen
          name="Ordering"
          component={OrderStack}
          options={{ headerShown: false, tabBarLabel: 'Order Meals',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'ios-fast-food' : 'ios-fast-food-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }} />
  
        {userContext.user.usertype === 3 &&
        <Tab.Screen
          name="AdminManage"
          component={AdminManage}
          options={{ tabBarLabel: 'Shop Admin',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'business' : 'business-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }} />
        }

        <Tab.Screen 
          name="PersonalEdit" 
          component={PersonalEdit} 
          options={{ headerTitle: 'Update My Personal Data', tabBarLabel: 'My Info',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'person-circle' : 'person-circle-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }} />
        
        <Tab.Screen 
          name="About App" 
          component={AboutApp} 
          options={{ headerTitle: 'About This App', tabBarLabel: 'About',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'information-circle' : 'information-circle-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }} />

        <Tab.Screen 
          name="Logout" 
          component={LogoutScreen} 
          options={{ headerTitle: 'Logout', tabBarLabel: 'Logout',
          tabBarIcon: ({ focused, color, size }) => {
            const iconName = focused ? 'log-out' : 'log-out-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        }} />
      
      </Tab.Navigator>
    );
  }
  
  return (userContext &&
    <NavigationContainer>
      <Stack.Navigator>
      {!userContext.isLoggedIn &&
        <Stack.Group>
          <Stack.Screen 
             name="Login" 
             component={LoginScreen} 
             options={{ title: 'Welcome to Happy Eats!' }}
             />
          <Stack.Screen 
             name="UserJoin" 
             component={UserJoin} 
             options={{ title: 'Welcome to Happy Eats!' }}
             />
          <Stack.Screen 
             name="ForgotPasswd" 
             component={ForgotPasswd} 
             options={{ title: 'Welcome to Happy Eats!' }}
             />
        </Stack.Group> 
      }
      {userContext.isLoggedIn &&
        <>
        <Stack.Group>
          <Stack.Screen
            name="LoginedStack"
            component={LoginedStack}
            options={{ headerShown: false, title: 'Welcome to Happy Eats!' }}
          />
        </Stack.Group> 
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen
            name="UserOrderRecords"
            component={UserOrderRecords}
            options={{ title: `My Purchase Order Records` }}
          />
        </Stack.Group>
        </>
      }
      </Stack.Navigator>
    </NavigationContainer>
  );
}
