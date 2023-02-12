import React, {useState, useRef, useEffect, useContext} from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform,
         View, 
         Text,
         ScrollView
} from 'react-native';
import { DataTable, Button, Divider, ProgressBar } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import Modal from '../components/modal';
import OrderDetail from '../components/orderdetail';
import DisplayImage from '../components/displayimage';
import { DOMAIN_URL } from '../lib/constants';
import { UserContextType, ShopDataType, OrderShopsElm, MealOrderType } from '../lib/types';
import { currOrderStatusLong, pageSizeOrders } from '../lib/utils';

interface PropsType {
  route: any;
  navigation: any
}

export default function UserOrderRecords({ route, navigation }: PropsType) {
    const { shopId, shopListData } = route.params;
    const userContext: UserContextType = useContext(UserContext);
    const [shopID, setShopID] = useState(`${shopId ? shopId: ''}`);
    const [orderShops, setOrderShops] = useState<OrderShopsElm[]>([]);
    const [orderByStr, setOrderByStr] = useState('count');
    const [userOrders, setUserOrders] = useState< MealOrderType[]>([]);
    const [orderCount, setOrderCount] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);
    const [mealOrder, setMealOrder] = useState<MealOrderType | null>(null);
    const [showModal, setShowModal] = useState(false);
    const homeEl = useRef(null);
 
    useEffect(() => {
        let appTitle = 'My Purchase Orders Summary'; 
        if (shopID){
           if (getShopName(shopID)){
              appTitle = `Purchase Records at ${getShopName(shopID)}`;
           }else{
              appTitle = 'My Purchase Orders Records'; 
           }
        }
        navigation.setOptions({ title: appTitle });
    },[shopID])
    
    useEffect(() => {
        async function fetchOrdersShops(){
           const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
           try {
              const { data } = await axios.get(`${DOMAIN_URL}/api/getuserordershops`, { headers: headers });
              const shopList = data.map((item: OrderShopsElm) => {
                const elm = shopListData.find((itm: ShopDataType) => itm.id === item.id);
                if (!elm){
                   return item;
                }
                return {...item, shopname: elm.shopname, profileimage: elm.profileimage};
              });
              const myOrderShops = { userId: userContext.user.id, logintime: Math.round(new Date().getTime() / 1000), shopList};
              await AsyncStorage.setItem('myordershops', JSON.stringify(myOrderShops));
              if (orderByStr === 'cancel'){
                 setOrderShops(shopList.sort((a: OrderShopsElm, b: OrderShopsElm) => {
                    if (a.cancel > b.cancel){
                       return -1;
                    }else if (a.cancel < b.cancel){
                        return 1;
                    }else{
                        if (a.count > b.count){
                            return 1;
                        }else if (a.count < b.count){
                            return -1;
                        }else{
                            return 0;
                        }
                    }
                 }));
              }else{
                 setOrderShops(shopList.sort((a: OrderShopsElm, b: OrderShopsElm) => {
                    if (a.count > b.count){
                       return -1;
                    }else if (a.count < b.count){
                        return 1;
                    }else{
                        if (a.cancel > b.cancel){
                            return 1;
                        }else if (a.cancel < b.cancel){
                            return -1;
                        }else{
                            return 0;
                        }
                    }
                 }));
              }
          }catch(e){
              //-----
           }
        }
        
        async function fetchData(){
           const myOrderShops = JSON.parse((await AsyncStorage.getItem('myordershops'))!);
           const currTime = Math.round(new Date().getTime() / 1000);
           if (myOrderShops && myOrderShops.userId === userContext.user.id && currTime < (myOrderShops.logintime + 60 * 10)){
              const shopList = myOrderShops.shopList;
              if (orderByStr === 'cancel'){
                shopList.sort((a: OrderShopsElm, b: OrderShopsElm) => {
                    if (a.cancel > b.cancel){
                        return -1;
                     }else if (a.cancel < b.cancel){
                         return 1;
                     }else{
                         if (a.count > b.count){
                             return 1;
                         }else if (a.count < b.count){
                             return -1;
                         }else{
                             return 0;
                         }
                     }
                });
              }else{
                shopList.sort((a: OrderShopsElm, b: OrderShopsElm) => {
                    if (a.count > b.count){
                       return -1;
                    }else if (a.count < b.count){
                        return 1;
                    }else{
                        if (a.cancel > b.cancel){
                            return 1;
                        }else if (a.cancel < b.cancel){
                            return -1;
                        }else{
                            return 0;
                        }
                    }
                });
              }
              setOrderShops(shopList);
              return;
           }
           fetchOrdersShops();
        }
        
        if (userContext && userContext.user.id){
            fetchData();
        }
  
    },[userContext, orderByStr]);

    useEffect(() => {
        if (userContext && userContext.user.id && shopID){
           setPageIndex(0);
           retrieveUserOrders(shopID, 0);
  
           const elm = orderShops.find(item => item.id === shopID);
           if (elm){
              setOrderCount(elm.count);
           }else{
              setOrderCount(0);           
           }
        }
    },[userContext, shopID]);
  
    async function fetchUserOrders(shopid: string, pIndex: number){
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        try {
           const { data } = await axios.get(`${DOMAIN_URL}/api/getuserorderrecords`, { params: { shopId: shopid, page: pIndex }, headers: headers });
           setUserOrders(data);
           const myOrderRecords = { userId: userContext.user.id, logintime: Math.round(new Date().getTime() / 1000), orderList: data};
           await AsyncStorage.setItem(`myorder_${shopid}_${pIndex}`, JSON.stringify(myOrderRecords));
        }catch(err){
           //----
        }
    }
  
    async function retrieveUserOrders(shopid: string, pIndex: number){
        const orderRecords = JSON.parse((await AsyncStorage.getItem(`myorder_${shopid}_${pIndex}`))!);
        const currTime = Math.round(new Date().getTime() / 1000);
        if (orderRecords && orderRecords.userId === userContext.user.id && currTime < (orderRecords.logintime + 60 * 10)){
           setUserOrders(orderRecords.orderList);
           return;
        }
  
        fetchUserOrders(shopid, pIndex);
    }
    
    function getShopName(id: string){
        const elm =  shopListData.find((item: ShopDataType) => item.id === id);
        if (! elm){
           return '';
        }
        return elm.shopname || '';
    }

    function closeModal(){
        setShowModal(false);
    }
    
    return (userContext &&
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView  
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    {shopID &&
                    <View style={[styles.listItem, styles.itemRight]}>
                        <Button mode="outlined" onPress={() => setShopID('')}>Back To Summary</Button>
                    </View>
                    }
                    {shopID &&
                    <>
                    {userOrders.length >0 &&
                    <Divider />
                    }
                    {userOrders.map((item: MealOrderType) =>
                    <View key={item.id} style={styles.listItem}>
                        <View style={{marginBottom: 5}}>
                            <Text style={{fontWeight: 'bold'}}>Restaurant: {getShopName(shopID)}</Text>
                        </View>
                        <View style={{marginBottom: 5}}>
                            <Text>Placed@{(new Date(item.created!)).toLocaleString()}</Text>
                        </View>
                        <View style={{marginBottom: 5}}>
                            {item.orderstatus === 1 &&
                                <Text style={{color: 'red'}}>{currOrderStatusLong(item)}</Text>
                            }
                            {item.orderstatus !== 1 &&
                                <Text>{currOrderStatusLong(item)}</Text>
                            }
                        </View>
                        <View style={{marginBottom: 5}}>
                            <ProgressBar progress={item.orderstatus/5} color='green' style={{height: 10}} />
                        </View>
                        <Button mode='outlined' onPress={() => {setMealOrder({...item, shopName: getShopName(shopID)}); setShowModal(true);}}>${(item.sum + item.tax).toFixed(2)} Order Details</Button>
                    </View>
                    )}
                    <View style={[styles.listItem, styles.itemLeft]}>
                    {pageIndex > 0 &&                   
                        <Button style={{marginRight: 10}} mode='outlined' onPress={() => {const pIndex = pageIndex - 1; setPageIndex(pIndex); retrieveUserOrders(shopID, pIndex);}}>&larr;  Previous</Button>
                    }
                    {orderCount > pageSizeOrders*(pageIndex+1) &&
                        <Button mode='outlined' onPress={() => {const pIndex = pageIndex + 1; setPageIndex(pIndex); retrieveUserOrders(shopID, pIndex);}}>Next  &rarr;</Button>
                    }
                    </View>
                    </>
                    }
                    {!shopID && 
                    <DataTable style={{paddingHorizontal: 0}}>                    
                        <DataTable.Header>
                            <DataTable.Title>Restaurants</DataTable.Title>
                            {orderShops.length === 0 &&
                            <>
                            <DataTable.Title numeric>Orders</DataTable.Title>
                            <DataTable.Title numeric>Cancels</DataTable.Title>
                            </>
                            }
                            {(orderShops.length > 0 && orderByStr === 'count') &&
                            <>
                            <DataTable.Title 
                                sortDirection='descending'
                                numeric>
                                Orders
                            </DataTable.Title>
                            <DataTable.Title 
                                onPress={() => setOrderByStr('cancel')}
                                numeric>
                                Cancels
                            </DataTable.Title>
                            </>
                            }          
                            {(orderShops.length > 0 && orderByStr === 'cancel') &&
                            <>
                            <DataTable.Title 
                               onPress={() => setOrderByStr('count')}
                                numeric>
                                Orders
                            </DataTable.Title>
                            <DataTable.Title 
                                sortDirection='descending'
                                numeric>
                                Cancels
                            </DataTable.Title>
                            </>
                            } 
                        </DataTable.Header>
                        {orderShops.map((item) =>
                        <DataTable.Row key={item.id} onPress={() => setShopID(item.id)}>
                            <DataTable.Cell>
                                <View style={styles.itemLeft}>
                                    <DisplayImage filename={item.profileimage!} style={{width: 40, height: 40}} />
                                    <Text style={{marginLeft: 5}}>{item.shopname}</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell numeric>{item.count}</DataTable.Cell>
                            <DataTable.Cell numeric>{item.cancel}</DataTable.Cell>
                        </DataTable.Row>   
                        )}
                    </DataTable>
                    } 
                   <Modal
                    isVisible={showModal}
                    >
                    <OrderDetail 
                        userCategory="user"
                        mealOrder={mealOrder!}
                        closeModal={closeModal}
                      />
                    </Modal>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
