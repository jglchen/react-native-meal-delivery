import * as React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserContext, OrdersContext } from './components/Context';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './AppNavigator';
import {UserContextType, OrdersContextType, User, MealOrderType} from './lib/types';
import { DOMAIN_URL } from './lib/constants';
import { iniTableShopList, iniTableBlockUsers, iniTableUpdateFreq, iniTableImage, iniTableMealList } from './lib/sql'
import { openSQLiteDB } from './lib/sqlitedb';

const db = openSQLiteDB();

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState({});
  const [mealOrders, setMealOrders] = useState< MealOrderType[]>([]);

  const login = (user?: User) => {
    if (user && user.id){
      setLoggedIn(true);
      setUserData(user);
    }
  };
 
  const logout = () => {
    setLoggedIn(false);
    setUserData({});
  };

  const userContext: UserContextType = {
    isLoggedIn: loggedIn, 
    user: userData, 
    login: login, 
    logout: logout
  };

  const update = (orders?: MealOrderType[]) => {
    if (orders){
      setMealOrders(orders);
    }
  };

  const ordersContext: OrdersContextType = {
    orderlist: mealOrders,
    update: update
  };

  async function fetchOrdersData(user: User){
    const currOrders = JSON.parse((await AsyncStorage.getItem('currorders'))!);
    const currTime = Math.round(new Date().getTime() / 1000);
    if (currOrders && currOrders.userId === user.id && currTime < (currOrders.logintime + 60 * 10)){
      setMealOrders(currOrders.orderList);
      return;
    }
    const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
    const { data } = await axios.get(`${DOMAIN_URL}/api/getcurrentorders`, { headers: headers });
    setMealOrders(data);
    const mealOrders = {logintime: Math.round(new Date().getTime() / 1000), userId: user.id, orderList: data}
    await AsyncStorage.setItem('currorders', JSON.stringify(mealOrders));
  }
  
  useEffect(() => {
    async function fetchUserData() {
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      const { data } = await axios.get(`${DOMAIN_URL}/api/getselfdetail`, { headers: headers });
      const {token, ...others} = data;
      const userData = {...others, logintime: Math.round(new Date().getTime() / 1000)};
      setUserData(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await SecureStore.setItemAsync('token', token);
    }
    
    async function fetchData(){
       const user = await AsyncStorage.getItem('user');
       const userData = JSON.parse(user!);
       if (userData){
          setLoggedIn(true);
          setUserData(userData);

          const logintime = userData.logintime || 0;
          const currTime = Math.round(new Date().getTime() / 1000);
          if (currTime > (logintime + 60 * 60 * 24 * 7)){
             fetchUserData();
          }

          //Fetch orders data for mealOrders
          fetchOrdersData(userData);
       }
    }
    fetchData();

  },[]);

  useEffect(() => {
    async function iniDataBase(){
      await iniTableShopList(); 
      await iniTableBlockUsers();
      await iniTableUpdateFreq();
      await iniTableImage();
      await iniTableMealList();
    }
    iniDataBase();
  }, []);

  
  return (
    <UserContext.Provider value={userContext}>
      <OrdersContext.Provider value={ordersContext}>
        <AppNavigator />
      </OrdersContext.Provider>  
    </UserContext.Provider>
  );
}
