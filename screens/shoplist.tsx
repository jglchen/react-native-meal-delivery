import React, {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform,
         View, 
         Text,
         FlatList,
         ListRenderItem,
         useWindowDimensions,
         TouchableHighlight
} from 'react-native';
import { Button } from 'react-native-paper';
import { getShopList, getBlockUsers, getUpdateTime, deleteShopList, deleteBlockUsers, insertShopList, insertBlockUsers, updateUpdateFreq } from '../lib/sql';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import UserOrders from '../components/userorders';
import DisplayImage from '../components/displayimage';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, ShopDataType} from '../lib/types';

interface PropsType {
  navigation: any
}

interface ItemProps {
  id: string;
  profileimage: string;
  shopname: string;
  foodsupply: string;
  blockusers?: string[];
  owner: string;
}

export default function ShopList({ navigation }: PropsType) {
    const userContext: UserContextType = useContext(UserContext);
    const window = useWindowDimensions();
    const [shopListData, setShopListData] = useState<ShopDataType[]>([]);
    const [reload, setReload] = useState(false);
    const [selfShops, setSelfShops] = useState<string[]>([]);
    const [blockingShops, setBlockingShops] = useState<string[]>([]);

    useEffect(() => {
      async function fetchSQLiteDB(){
        const { rows: { _array } } = await getShopList();
        if ( _array.length === 0){
          setReload(true);
          return;
        }
        const temp = _array.slice();
        for (let i = 0; i < temp.length; i++){
          const { rows: { _array } } = await getBlockUsers(temp[i].id);
          if (_array.length > 0){
            const blockusers = [];
            for (let elm of _array){
              blockusers.push(elm.userid);
            }
            temp[i] = {...temp[i], blockusers};
          }
        }
        setShopListData(temp);

        let updatetime = 0;
        const results = await getUpdateTime('shoplist');
        if (results.rows.length > 0){
          updatetime = results.rows._array[0].updatetime;
        }
        const currTime = Math.round(new Date().getTime() / 1000);
        if (currTime > updatetime + 60 * 60 * 3){
          setReload(true);
        }
      }
      fetchSQLiteDB();
    },[]);

    useEffect(() => {
      async function fetchShopList(){
        const {data} = await axios.get(`${DOMAIN_URL}/api/getshoplist`);
        if (shopListData.length === 0){
           setShopListData(data);
        }
        await deleteShopList();
        await deleteBlockUsers();

        for (let elm of data){
          await insertShopList(elm.id, elm.shopname, elm.foodsupply, elm.profileimage, elm.owner, elm.onboard ? 1: 0, elm.created);
          if (elm.blockusers){
            for (let itm of elm.blockusers){
              await insertBlockUsers(elm.id, itm);
            }
          }
        }
        
        const currTime = Math.round(new Date().getTime() / 1000);
        await updateUpdateFreq('shoplist', currTime);
      }   
      
      if (reload){
        fetchShopList();
      }
    },[reload]);

    useEffect(() => {
      if (userContext) {
         if (userContext.user){
           if (userContext.user.shopid && userContext.user.shopid.length > 0){
             const shopList = [];
             for (let elm of userContext.user.shopid){
               if (elm.onboard){
                 shopList.push(elm.id);
               }
             }
             setSelfShops(shopList);
           }
           const blockShops = [];
           for (let elm of shopListData){
             if (elm.blockusers && elm.blockusers.includes(userContext.user.id as string)){
                blockShops.push(elm.id);
             }
           }
           setBlockingShops(blockShops); 
         }
      }
    },[userContext, shopListData]);


    const Item = ({ id, profileimage, shopname, foodsupply, blockusers, owner }: ItemProps) => (
      <TouchableHighlight onPress={() => navigation.navigate('MealMenu',{id, profileimage, shopname, foodsupply, blockusers, owner, shopListData})}>
        <View style={styles.listItem} key={id}>
          <DisplayImage
            filename={profileimage}
            style={{width: window.width - 10, height: (window.width - 10)*0.5}}
            />
          <View>
            <Text style={styles.shopNameText}>{shopname}</Text>
          </View>
          <View>
          {foodsupply.replace(/(?:\r\n|\r|\n)/g, '<br />').split('<br />').map((itm: string, index:number) =>{
            if (!itm.trim()){
              return(
                <Text key={index}>
                </Text>
              )
            }
            return (
              <Text style={styles.descrText} key={index}>
              {itm.trim()}{'\n'}
              </Text>
            )
          })}
          </View>
        </View>
      </TouchableHighlight>
    );

    const renderItem: ListRenderItem<ItemProps> = ({item}) => {
      return (
        <Item
          id={item.id}
          profileimage={item.profileimage}
          shopname={item.shopname}
          foodsupply={item.foodsupply} 
          blockusers={item.blockusers}
          owner={item.owner} />
      );
    };

    if (!userContext || !userContext.isLoggedIn || shopListData.length === 0){
       return (
        <View></View>
       );
    }
    
    
    return (userContext &&
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView  
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}>
              {(userContext.isLoggedIn && shopListData.length > 0) &&
              <>
              <View style={styles.scrollView}>
                <UserOrders />
              </View>
              <View style={styles.itemLeft}>
                <Button mode="outlined" style={{marginLeft: 5}} onPress={() => navigation.navigate('UserOrderRecords',{shopId: undefined, shopListData})}>My Purchase Order Records</Button>
              </View>
              <FlatList 
                style={styles.scrollView}
                data={shopListData.filter(item => !selfShops.includes(item.id) && !blockingShops.includes(item.id))} 
                renderItem={renderItem}
                keyExtractor={item => item.id}
                />  
              </>
              }
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
