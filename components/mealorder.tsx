import React, {useState, useRef, useEffect, useContext} from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, 
         View, 
         Text,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { DataTable, Button, TextInput, Switch, ActivityIndicator, Colors } from 'react-native-paper';
import NumericInput from 'react-native-numeric-input';
import { styles } from '../styles/css';
import { UserContext, OrdersContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, OrdersContextType, MealOrderElm, OrderShopsElm} from '../lib/types';
import { taxRate } from '../lib/utils';

interface PropsType {
    shopid: string;
    shopname: string;
    profileimage: string;
    blockusers?: string[];
    owner: string;
    mealArr: MealOrderElm[];
    updateMealOrderArr: (orderList:MealOrderElm[]) => void;
    resetOrder: () => void;
    closeModal: () => void;
}

export default function MealOrder({shopid, shopname, profileimage, blockusers, owner, mealArr, updateMealOrderArr, resetOrder, closeModal}: PropsType) {
    const userContext: UserContextType = useContext(UserContext);
    const ordersContext: OrdersContextType = useContext(OrdersContext);
    const [blockedUser, setBlockedUser] = useState(false);
    const [orderList, setOrderList] = useState<MealOrderElm[]>([]);
    const [address, setAddress] = useState(userContext.user.address);
    const [addressregister, setAddressRegister] = useState(false);
    const addressEl = useRef(null);
    const [sumtotal, setSumTotal] = useState(0);
    const [addresserr, setAddressErr] = useState('');
    const [ordersubmiterr, setOrderSubmitErr] = useState('');
    const [inPost, setInPost] = useState(false);

    useEffect(() => {
        let total = 0;
        const orderArr = mealArr.filter((item: MealOrderElm) => {
           if (!item.quantity){
             return false;
           }
           total += item.quantity * item.unitprice;
           return true;
        });
        setOrderList(orderArr);
        setSumTotal(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    useEffect(() => {
        if (blockusers && userContext && blockusers.includes(userContext.user.id as string)){
           setBlockedUser(true);
        }
    },[userContext]);
  
    function changeOrderQty(value: number, idx: number){
        const orderArr = orderList.slice();
        orderArr[idx] = {...orderArr[idx], quantity: value};
        setOrderList(orderArr);
        let total = 0;
        for (let elm of orderArr){
            total += (elm.quantity as number) * elm.unitprice;
        }
        setSumTotal(total);
        updateMealOrderArr(orderArr);
    }

    function resetErrMsg(){
        setAddressErr('');
        setOrderSubmitErr('');
    }
    
    async function submitOrder(){
        resetErrMsg(); 
        if (!userContext.isLoggedIn && blockedUser){
           return;
        }
        //Check if Address is filled
        if (!address?.trim()){
            setAddress(prevState => prevState?.trim()) 
            setAddressErr("Please type your delivering address, this field is required!");
            (addressEl.current as any).focus();
            return;
        }
        const dataSubmit = {
            userId: userContext.user.id,
            userName: userContext.user.name,
            shopId: shopid,
            shopName: shopname,
            owner: owner,
            orderList,
            sum: sumtotal,
            tax: Math.round((sumtotal*taxRate + Number.EPSILON) * 100) / 100,
            address,
            addressregister
        }
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        setInPost(true);
        try {
            // Send request to our api route
            const { data } = await axios.post(`${DOMAIN_URL}/api/placeorder`, dataSubmit, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
               setOrderSubmitErr("No authorization to upload data.");
               return;
            }
            if (addressregister){
               const user = {...userContext.user, address};
               await AsyncStorage.setItem('user', JSON.stringify(user));
               userContext.login(user);
            }
            
            //Update ordersContext & store currorders
            const orderData = {...data, shopName: shopname};
            const orderList = ordersContext.orderlist.slice();
            orderList.push(orderData);
            ordersContext.update(orderList);
            const mealOrders = {logintime: Math.round(new Date().getTime() / 1000), userId: userContext.user.id, orderList}
            await AsyncStorage.setItem('currorders', JSON.stringify(mealOrders));
            
            //Update store myordershops 
            const myOrderShops = JSON.parse((await AsyncStorage.getItem('myordershops'))!);
            const currTime = Math.round(new Date().getTime() / 1000);
            if (myOrderShops && myOrderShops.userId === userContext.user.id && currTime < (myOrderShops.logintime + 60 * 10)){
               const shopList = myOrderShops.shopList;
               const idx = shopList.findIndex((item: OrderShopsElm) => item.id === shopid);
               if (idx > -1){
                  const count = shopList[idx].count;
                  shopList[idx] = {...shopList[idx], count: count + 1};
               }else{
                  shopList.push({id: shopid, shopname, profileimage, count: 1, cancel: 0});
               }
               await AsyncStorage.setItem('myordershops', JSON.stringify({ userId: userContext.user.id, logintime: Math.round(new Date().getTime() / 1000), shopList}));
            }else{
               await AsyncStorage.removeItem('myordershops');
            }
            
            resetOrder();
            closeModal();
          }catch(err){
            setInPost(false);
            setOrderSubmitErr('Failed to upload data to database!');
          }
    }

    if (!userContext || blockedUser){
        return (
            <View>
            </View>
        )
    }
    
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                resetScrollToCoords={{ x: 0, y: 0 }}
                keyboardShouldPersistTaps='always'
                scrollEnabled={true}
                style={{paddingHorizontal: 5}}
                >
                <View style={[styles.itemCenter, styles.listItem]}>
                    <Text style={styles.headingText}>{`Meal Order To ${shopname}`}</Text>
                </View>       
                <View style={[styles.itemRight, styles.listItem]}>
                    <Button mode="outlined" onPress={() => closeModal()}>Close</Button>
                </View> 
                <View style={styles.listItem}>
                    <DataTable style={{paddingHorizontal: 0}}>                    
                        <DataTable.Header>
                            <DataTable.Title>Meal</DataTable.Title>
                            <DataTable.Title numeric>Unit Price</DataTable.Title>
                            <DataTable.Title numeric>Quantity</DataTable.Title>
                            <DataTable.Title numeric>Total</DataTable.Title>
                        </DataTable.Header> 
                        {orderList.length > 0 && orderList.map((item: MealOrderElm, idx: number) =>
                        <DataTable.Row key={item.id}>
                            <DataTable.Cell>
                                <View style={styles.itemLeft}>
                                    <Text>{item.mealname}</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${item.unitprice}`}</DataTable.Cell>
                            <DataTable.Cell numeric>
                                <NumericInput
                                    totalHeight={40}
                                    totalWidth={80} 
                                    minValue={1}
                                    value={item.quantity}
                                    onChange={value => changeOrderQty(value, idx)} 
                                    />
                            </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${item.unitprice*(item.quantity as number)}`}</DataTable.Cell>
                        </DataTable.Row>   
                        )}
                        <DataTable.Row>
                            <DataTable.Cell textStyle={{fontWeight: 'bold'}}>
                                <View style={styles.itemLeft}>
                                    <Text style={{fontWeight: 'bold'}}>Sum</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${sumtotal}`}</DataTable.Cell>                            
                        </DataTable.Row>   
                        <DataTable.Row>
                            <DataTable.Cell>
                                <View style={styles.itemLeft}>
                                    <Text style={{fontWeight: 'bold'}}>Tax({`${taxRate*100}%`})</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${(sumtotal*taxRate).toFixed(2)}`}</DataTable.Cell>                            
                        </DataTable.Row>  
                        <DataTable.Row>
                            <DataTable.Cell>
                                <View>
                                    <Text style={{fontWeight: 'bold'}}>Total Amount</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${(sumtotal*(1+taxRate)).toFixed(2)}`}</DataTable.Cell>                            
                        </DataTable.Row>  
                    </DataTable>
                    </View> 
                    {(orderList.length > 0 && userContext.isLoggedIn && !blockedUser) &&
                    <>
                    <View style={styles.listItem}>
                        <TextInput
                            mode='outlined'
                            label='Delivering Address'
                            placeholder='Delivering Address'
                            value={address}
                            multiline={true}
                            onChangeText={value => setAddress(value.replace(/<\/?[^>]*>/g, ""))}
                            ref={addressEl}
                            />
                    </View>   
                    {(address && address.trim() !== userContext.user.address) &&
                    <View style={styles.itemLeft}>
                        <Switch value={addressregister} onValueChange={() => setAddressRegister((prevState) => !prevState)}/>
                        <View style={{marginLeft: 10}}>
                            <Text>Use this address as your member address</Text>
                        </View>
                    </View>
                    }
                    <View>
                        <Text style={{color: 'red'}}>{addresserr}</Text>
                    </View>
                    <Button mode='contained' onPress={() => submitOrder()}>Place This Order</Button>
                    <View>
                        <Text style={{color: 'red'}}>{ordersubmiterr}</Text>
                    </View>
                    </>
                    }
            </KeyboardAwareScrollView>
            {inPost &&
                <View style={styles.loading}>
                    <ActivityIndicator size="large" animating={true} color={Colors.white} />
                </View>
            }
        </SafeAreaView>
      );
}
