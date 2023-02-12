import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { View, Text, Alert } from 'react-native';
import { DataTable, Button, Divider, ProgressBar } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import Modal from './modal';
import OrderDetail from './orderdetail';
import { DOMAIN_URL } from '../lib/constants';
import { UserContextType, ShopDataType, ShopClientsElm, MealOrderType } from '../lib/types';
import { currOrderStatusLong, pageSizeOrders, pageSizeClients } from '../lib/utils';

interface PropsType {
    shopData: ShopDataType;
    shopMutate: (shop: ShopDataType) => void;
    clients: ShopClientsElm[];
    fetchClients: (odrBy: string, pIndex: number) => void;
    orderByStr: string;
    updateOrderStr: (str: string) => void;
    pageIndexClients: number;
    updatePageClients: (pIndex: number) => void;
    increaseBlockedClients: (userElm: ShopClientsElm) => void;
    removeBlockedClients: (userElm: ShopClientsElm) => void; 
    initInPost: () => void;
    stopInPost: () => void;
}

export default function ShopOrderRecords({shopData, shopMutate, clients, fetchClients, orderByStr, updateOrderStr, pageIndexClients, updatePageClients, increaseBlockedClients, removeBlockedClients, initInPost, stopInPost}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [userElm, setUserElm] = useState<ShopClientsElm | null>(null);
    const [clientOrders, setClientOrders] = useState< MealOrderType[]>([]);
    const [pageIndexOrders, setPageIndexOrders] = useState(0);
    const [blockusers, setBlockusers] = useState<string[]>([]);
    const [mealOrder, setMealOrder] = useState<MealOrderType | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (shopData){
            const blockUsers = shopData.blockusers || [];
            setBlockusers(blockUsers);  
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[userContext, shopData]);
      
    async function fetchClientOrders(userId: string, pIndex: number){
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        try {
            const { data } = await axios.get(`${DOMAIN_URL}/api/getclientorderrecords`, { params: { shopId: shopData.id, userId, page: pIndex }, headers: headers });
            setClientOrders(data);
        }catch(e){
             //----
        }
    }
  
    useEffect(() => {
        if (userContext && userContext.user.id && userElm){
            setPageIndexOrders(0);
            fetchClientOrders(userElm.id, 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[userContext, userElm]);

    function closeModal(){
        setShowModal(false);
    }
    
    function confirmBlockShopUser(userElm: ShopClientsElm){
        Alert.alert(
            "Block Restaurant Client",
            `Do you want to block ${userElm.userName}?`,
            [
              {
                text: "Cancel",
                onPress: () => console.log("Cancel"),
                style: "cancel"
              },
              { text: "OK", onPress: () => blockShopUser(userElm) }
            ]
        );
    }

    async function blockShopUser(userElm: ShopClientsElm){
        initInPost();
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        try {
            // Send request to our api route
            const { data } = await axios.put(`${DOMAIN_URL}/api/blockshopuser`, {shopId: shopData.id, userId: userElm.id}, { headers: headers });
            stopInPost();
            if (!data.shop_blockusers){
                return;
            }
            const blockUsers = blockusers.slice();
            blockUsers.push(userElm.id);
            setBlockusers(blockUsers);
            const shopDataObj = {...shopData, blockusers: blockUsers};
            shopMutate(shopDataObj);
            increaseBlockedClients(userElm);
        }catch(err){
            stopInPost();      
        }
    }
     
    async function unblockShopUser(userElm: ShopClientsElm){
        initInPost();
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        try {
            // Send request to our api route
            const { data } = await axios.put(`${DOMAIN_URL}/api/unblockshopuser`, {shopId: shopData.id, userId: userElm.id}, { headers: headers });
            stopInPost();
            if (!data.shop_unblockusers){
                return;
            }
            const blockUsers = blockusers.slice().filter(item => item !== userElm.id);
            setBlockusers(blockUsers);
            const shopDataObj = {...shopData, blockusers: blockUsers};
            shopMutate(shopDataObj);
            removeBlockedClients(userElm);
        }catch(err){
            stopInPost();      
        }
    }
    
    return (userContext &&
        <View>
            {userElm &&
            <>
            <View style={[styles.listItem, styles.itemCenter]}>
                <Text style={styles.headingText}>{`${userElm.userName}'s Purchase Records`}</Text>
            </View>
            <View style={[styles.listItem, styles.itemSpaceBetween]}>
                <Button
                    mode='outlined'
                    onPress={() => setUserElm(null)}
                    >
                    To Client List
                </Button>
                {blockusers.includes(userElm.id) &&
                <Button
                    mode='contained'
                    style={{backgroundColor: 'green'}}
                    onPress={() => unblockShopUser(userElm)}
                    >
                    Unblock This Client
                </Button>
                }
                {!blockusers.includes(userElm.id) &&
                <Button
                    mode='contained'
                    style={{backgroundColor: 'green'}}
                    onPress={() => blockShopUser(userElm)}
                    >
                    Block This Client
                </Button>
                }
            </View>
            {clientOrders.length >0 &&
            <Divider />
            }
            {clientOrders.map((item: MealOrderType) => 
            <View key={item.id} style={styles.listItem}>
                <View style={{marginBottom: 5}}>
                    <Text style={{fontWeight: 'bold'}}>Client: {userElm.userName}</Text>
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
                <Button mode='outlined' onPress={() => {setMealOrder(item); setShowModal(true);}}>${(item.sum + item.tax).toFixed(2)} Order Details</Button>
            </View>
            )}
            <View style={styles.itemLeft}>
            {pageIndexOrders > 0 &&                   
                <Button style={{marginRight: 10}} mode='outlined' onPress={() => {const pIndex = pageIndexOrders - 1; setPageIndexOrders(pIndex); fetchClientOrders(userElm.id, pIndex);}}>&larr;  Previous</Button>
            }
            {userElm.count > pageSizeOrders*(pageIndexOrders+1) &&
                <Button mode='outlined' onPress={() => {const pIndex = pageIndexOrders + 1; setPageIndexOrders(pIndex); fetchClientOrders(userElm.id, pIndex);}}>Next  &rarr;</Button>
            }
            </View>
            </>
            }
            {!userElm &&
            <>
            <View style={[styles.listItem, styles.itemCenter]}>
                <Text style={styles.headingText}>Restaurant Client List</Text>
            </View>
            <DataTable style={{paddingHorizontal: 0}}>                    
                <DataTable.Header>
                    <DataTable.Title>Clients</DataTable.Title>
                    {clients.length === 0 &&
                    <>
                    <DataTable.Title numeric>Orders</DataTable.Title>
                    <DataTable.Title numeric>Cancels</DataTable.Title>
                    </>
                    }
                    {(clients.length > 0 && orderByStr === 'count') &&
                    <>
                    <DataTable.Title 
                        sortDirection='descending'
                        numeric>
                         Orders
                    </DataTable.Title>
                    <DataTable.Title 
                        onPress={() => {updateOrderStr('cancel'); fetchClients('cancel', pageIndexClients);}}
                        numeric>
                        Cancels
                    </DataTable.Title>
                    </>
                    }          
                    {(clients.length > 0 && orderByStr === 'cancel') &&
                    <>
                    <DataTable.Title 
                        onPress={() => {updateOrderStr('count'); fetchClients('count', pageIndexClients);}}
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
                {clients.map((item) =>
                <DataTable.Row key={item.id} onPress={() => setUserElm(item)}>
                    <DataTable.Cell>
                        <View style={styles.itemLeft}>
                            <Text>{item.userName}</Text>
                        </View>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>{item.count}</DataTable.Cell>
                    <DataTable.Cell numeric>{item.cancel}</DataTable.Cell>
                </DataTable.Row>   
                )}
            </DataTable>
            <View style={styles.itemLeft}>
            {pageIndexClients > 0 &&                 
                <Button mode='outlined' style={{marginRight: 10}} onPress={() => {const pIndex = pageIndexClients - 1; updatePageClients(pIndex); fetchClients(orderByStr, pIndex);}}>&larr;  Previous</Button>  
            }    
            {clients.length === pageSizeClients &&
                <Button mode='outlined' onPress={() => {const pIndex = pageIndexClients + 1; updatePageClients(pIndex); fetchClients(orderByStr, pIndex);}}>Next  &rarr;</Button>  
            }
            </View>            
            </>
            }
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
    );
}   