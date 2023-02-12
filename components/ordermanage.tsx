import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import db from '../lib/firestore';
import { View, 
         Text,
} from 'react-native';
import { Button, ProgressBar, Divider } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import Modal from './modal';
import OrderDetail from './orderdetail';
import { DOMAIN_URL } from '../lib/constants';
import { PUBLIC_CODE } from '@env';
import {UserContextType, MealOrderType} from '../lib/types';
import { currOrderStatus, timeDiffPlacedToLast, timeDiffPlacedToCurrent, timeDiffLastToCurrent } from '../lib/utils';

interface PropsType {
    shopId: string;
    initInPost: () => void;
    stopInPost: () => void;
}

export default function OrderManage({shopId, initInPost, stopInPost}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [mealOrders, setMealOrders] = useState< MealOrderType[]>([]);
    const [mealOrder, setMealOrder] = useState<MealOrderType | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
           setCurrentTime(new Date());  
        }, 1000);
  
        return () => {
          clearInterval(timer);
        }
    },[]);
      
    useEffect(() => {
        async function fetchData() {
            const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
            const { data } = await axios.get(`${DOMAIN_URL}/api/getshoporders`, { params: { shopId }, headers: headers });
            setMealOrders(data);
        }
 
        if (userContext && userContext.user.usertype === 2){
           fetchData();
        }
    },[userContext, shopId]);
     
    useEffect(() => {
        if (userContext && userContext.user.usertype === 2 && shopId){
           const q = query(collection(db, "restaurants", shopId, "orderrecent"), where("publiccode", "==", PUBLIC_CODE));
           const unsubscribe = onSnapshot(q, (querySnapshot) => {
              const orderRecents: MealOrderType[] = [];
              querySnapshot.forEach((doc) => {
                orderRecents.push(doc.data() as MealOrderType);
              });
  
              for (let elm of orderRecents){
                setMealOrders((prevState: MealOrderType[]) => {
                  let currState = prevState.slice();
                  const idx = currState.findIndex(item => item.id === elm.id);
                  if (idx > -1){
                     currState[idx] = {...currState[idx], ...elm};
                  }else{
                     if (elm.orderstatus !== 1 && elm.orderstatus !== 5){
                       currState = [elm, ...currState];
                     }
                  }
                  return currState;
                });
              }
  
           });
           return () => {
            unsubscribe();
           }
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[userContext, shopId]);
      
    async function updateOrder(order: MealOrderType){
        let statustobe = 0;
        if (order.orderstatus === 0){
           statustobe = 2;
        }else{
          statustobe = order.orderstatus + 1;
        }
        if (statustobe !== 2 && statustobe !== 3 && statustobe !== 4){
           return;
        }
        const updateObj = {shopId: shopId, id: order.id, userId: order.userId, statustobe, statushistory: order.statushistory};
  
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        initInPost();
  
        try {
            const {data} = await axios.put(`${DOMAIN_URL}/api/updateshoporder`, updateObj, { headers: headers });
            stopInPost();
            if (data.no_authorization){
                return;
            }
            const orderList = mealOrders.slice();
            const idx = orderList.findIndex(item => item.id === data.id && shopId === data.shopId);
            if (idx > -1){
               orderList[idx] = {...orderList[idx], orderstatus: data.orderstatus, statushistory: data.statushistory};
            }
            setMealOrders(orderList);
        }catch(e){
            stopInPost();
        }
    }
      
    function closeModal(){
        setShowModal(false);
    }
    
    return (userContext &&
        <View style={{marginTop: 10}}>
            {mealOrders.length === 0 &&
            <View>
                <Text style={styles.headingText}>Currently No Orders To Be Handled</Text>
            </View>
            }
            {mealOrders.length > 0 &&
            <View>
                <Divider />
            </View>
            }
            {mealOrders.map((item: MealOrderType) =>
            <View key={item.id} style={styles.listItem}>
              <View style={{marginBottom: 5}}>
                <Text style={{fontWeight: 'bold'}}>Customer: {item.userName}</Text>
              </View>
              <View style={[styles.itemSpaceBetween,{marginBottom: 5}]}>
                <Button mode='outlined' onPress={() => {setMealOrder(item); setShowModal(true);}}>Order Details</Button>   
                {item.orderstatus === 0 &&
                  <Button mode='contained' onPress={() => updateOrder(item)}>Start Processing</Button>   
                }
                {item.orderstatus === 2 &&
                  <Button mode='contained' onPress={() => updateOrder(item)}>Make In Route</Button>   
                }
                {item.orderstatus === 3 &&
                  <Button mode='contained' onPress={() => updateOrder(item)}>Meal Delivered</Button>   
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
                userCategory="owner"
                mealOrder={mealOrder!}
                closeModal={closeModal}
                />
            </Modal>
        </View>
    )

}    
