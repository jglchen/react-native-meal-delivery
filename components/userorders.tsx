import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import db from '../lib/firestore';
import { View, Text, Alert } from 'react-native';
import { Button, Divider, ProgressBar, ActivityIndicator, Colors } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext, OrdersContext } from '../components/Context';
import Modal from './modal';
import OrderDetail from './orderdetail';
import { DOMAIN_URL } from '../lib/constants';
import { PUBLIC_CODE } from '@env';
import { UserContextType, OrdersContextType, MealOrderType, OrderShopsElm } from '../lib/types';
import { currOrderStatus, timeDiffPlacedToLast, timeDiffPlacedToCurrent, timeDiffLastToCurrent } from '../lib/utils';

interface OrderListenType {
    shopId: string;
    id: string;
    userId: string;
    orderstatus: number;
    statushistory: string[];
}

export default function UserOrders(){
    const userContext: UserContextType = useContext(UserContext);
    const ordersContext: OrdersContextType = useContext(OrdersContext);
    const [mealOrder, setMealOrder] = useState<MealOrderType | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [inPost, setInPost] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
           setCurrentTime(new Date());  
        }, 1000);
 
        return () => {
          clearInterval(timer);
        }
    },[]);
 
    useEffect(() => {
        if (userContext.isLoggedIn && userContext.user.id && ordersContext.orderlist.length > 0) {
           const q = query(collection(db, "mealdelivery", userContext.user.id, "orderrecent"), where("publiccode", "==", PUBLIC_CODE));
           
           const unsubscribe = onSnapshot(q, async (querySnapshot) => {
             const orderRecents: OrderListenType[] = [];
             querySnapshot.forEach((doc) => {
                orderRecents.push(doc.data() as OrderListenType);
             });
             
             for (let elm of orderRecents){
                 const orderList = ordersContext.orderlist.slice();
                 const idx = orderList.findIndex(item => item.id === elm.id && item.shopId === elm.shopId);
                 if (idx === -1) {
                    return;
                 } 
                 orderList[idx] = {...orderList[idx], ...elm};
 
                 ordersContext.update(orderList);
                 const mealOrders = {logintime: Math.round(new Date().getTime() / 1000), userId: userContext.user.id, orderList: orderList}
                 await AsyncStorage.setItem('currorders', JSON.stringify(mealOrders));
            }
           });
           return () => {
             unsubscribe();
           }
        }
    },[userContext, ordersContext]);

    function removeOrder(order: MealOrderType){
      Alert.alert(
         "Cancel the Order",
         `Are you sure to cancel this order to ${order.shopName}?`,
         [
           {
             text: "Cancel",
             onPress: () => console.log("Cancel"),
             style: "cancel"
           },
           { text: "OK", onPress: () => updateOrder(order) }
         ]
     );
    }

    async function updateOrder(order: MealOrderType){
      const statustobe = order.orderstatus + 1;
      if (statustobe !== 1 && statustobe !== 5){
         return;
      }

      const updateObj = {shopId: order.shopId, id: order.id, statustobe, statushistory: order.statushistory};
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      setInPost(true);
      try {
          const {data} = await axios.put(`${DOMAIN_URL}/api/updateuserorder`, updateObj, { headers: headers });
          setInPost(false);
          if (data.no_authorization){
              return;
          }
          
          const {shopId, id, orderstatus, statushistory} = data;
          //Update ordersContext
          const orderList = ordersContext.orderlist.slice();
          const idx = orderList.findIndex(item => item.id === id && item.shopId === shopId);
          if (idx > -1){
             orderList[idx] = {...orderList[idx], orderstatus, statushistory};
          }
          ordersContext.update(orderList);

         //Update store currorders
          const mealOrders = {logintime: Math.round(new Date().getTime() / 1000), userId: userContext.user.id, orderList: orderList}
          await AsyncStorage.setItem('currorders', JSON.stringify(mealOrders));

          //Update store myordershops 
          if (orderstatus === 1){
             const myOrderShops = JSON.parse((await AsyncStorage.getItem('myordershops'))!);
             const currTime = Math.round(new Date().getTime() / 1000);
             if (myOrderShops && myOrderShops.userId === userContext.user.id && currTime < (myOrderShops.logintime + 60 * 10)){
                const shopList = myOrderShops.shopList;
                const idx = shopList.findIndex((item: OrderShopsElm) => item.id === shopId);
                if (idx > -1){
                   const cancel = shopList[idx].cancel;
                   shopList[idx] = {...shopList[idx], cancel: cancel + 1};
                }
                await AsyncStorage.setItem('myordershops', JSON.stringify({ userId: userContext.user.id, logintime: Math.round(new Date().getTime() / 1000), shopList}));
             }else{
                await AsyncStorage.removeItem('myordershops');
             }  
          }
      }catch(e){
          setInPost(false);
      }
    }

    function closeModal(){
      setShowModal(false);
    }

    return ((userContext && ordersContext) &&
      <>
      {ordersContext.orderlist.length > 0 &&
      <View style={styles.listItem}>
         <Text>My Personal Orders:</Text>
         <Divider />
      </View>    
      }
      {ordersContext.orderlist.map((item: MealOrderType) =>
      <View key={item.id} style={styles.listItem}>
         <View style={{marginBottom: 5}}>
            <Text style={{fontWeight: 'bold'}}>Restaurant: {item.shopName}</Text>
         </View>
         <View style={[styles.itemSpaceBetween,{marginBottom: 5}]}>
            <Button mode='outlined' onPress={() => {setMealOrder(item); setShowModal(true);}}>Order Details</Button>   
            {item.orderstatus === 0 &&
               <Button mode='contained' onPress={() => removeOrder(item)}>Cancel</Button>
            }
            {item.orderstatus === 4 &&
               <Button mode='contained' onPress={() => updateOrder(item)}>Confirm Receipt</Button>   
            }
         </View>
         <View style={{marginBottom: 5}}>
            <ProgressBar progress={item.orderstatus/5} color='green' style={{height: 10}} />
         </View>
         {(item.orderstatus === 1 || item.orderstatus === 5) &&
         <>
         <View style={{marginBottom: 5}}>
            <Text>Placed@{(new Date(item.created!)).toLocaleTimeString('en-US')}   Elapsed: {timeDiffPlacedToLast(item)}</Text>
         </View>
         {item.orderstatus === 1 &&
         <View style={{marginBottom: 5}}>
            <Text style={{color: 'red'}}>{currOrderStatus(item)}</Text>
         </View>
         }
         {item.orderstatus !== 1 &&
         <View style={{marginBottom: 5}}>
            <Text>{currOrderStatus(item)}</Text>
         </View>
         }
         </>
         }
         {(item.orderstatus !== 1 && item.orderstatus !== 5) &&
         <>
         <View style={{marginBottom: 5}}>
            <Text>Placed@{(new Date(item.created!)).toLocaleTimeString('en-US')}   Elapsed: {timeDiffPlacedToCurrent(item, currentTime)}</Text>
         </View>
         {item.orderstatus !== 0 &&
         <View style={{marginBottom: 5}}>
            <Text>{currOrderStatus(item)}   Elapsed: {timeDiffLastToCurrent(item, currentTime)}</Text>
         </View>
         }
         </>
         }
         <Divider />
      </View>
      )} 
      <Modal
         isVisible={showModal}
         >
         <OrderDetail
            userCategory="user"
            mealOrder={mealOrder!}
            closeModal={closeModal}
            />
      </Modal>
      {inPost &&
         <View style={styles.loading}>
            <ActivityIndicator size="large" animating={true} color={Colors.white} />
         </View>
      }
      </>
    );
}
