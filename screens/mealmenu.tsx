import React, {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import { SafeAreaView, 
         View, 
         Text,
         useWindowDimensions
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button } from 'react-native-paper';
import NumericInput from 'react-native-numeric-input';
import { getUpdateTime, updateUpdateFreq, getMealList, deleteMealListByShopId, insertMealList } from '../lib/sql';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import UserOrders from '../components/userorders';
import Modal from '../components/modal';
import MealOrder from '../components/mealorder';
import DisplayImage from '../components/displayimage';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, MealDataType, MealOrderDataType, MealOrderElm} from '../lib/types';

interface PropsType {
  route: any;  
  navigation: any
}

export default function MealMenu({ route, navigation }: PropsType) {
    const {id, profileimage, shopname, foodsupply, blockusers, owner, shopListData} = route.params;
    const foodsupplyArr = foodsupply.replace(/(?:\r\n|\r|\n)/g, '<br />').split('<br />');
    const userContext: UserContextType = useContext(UserContext);
    const window = useWindowDimensions();
    const [mealList, setMealList] = useState<MealOrderDataType[]>([]);
    const [reload, setReload] = useState(false);
    const [blockedUser, setBlockedUser] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        async function fetchSQLiteDB(){
          const { rows: { _array } } = await getMealList(id);
          if ( _array.length === 0){
            setReload(true);
            return;
          }
          setMealList(_array);
          
          let updatetime = 0;
          const results = await getUpdateTime(`meallist_${id}`);
          if (results.rows.length > 0){
            updatetime = results.rows._array[0].updatetime;
          }
          const currTime = Math.round(new Date().getTime() / 1000);
          if (currTime > updatetime + 60 * 60 * 6){
            setReload(true);
          }

        }
        fetchSQLiteDB();
    },[]);
      
    useEffect(() => {
      async function fetchMealList(){
        const {data} = await axios.get(`${DOMAIN_URL}/api/getmealmenulist/${id}`);
        const temp = data.map((item: MealDataType) => 
          ({...item, shopid: id}));
        setMealList(temp);
        await deleteMealListByShopId(id);

        for (let elm of data){
          await insertMealList(id, elm.id, elm.mealname, elm.mealdescr, elm.unitprice, elm.profileimage, elm.created);
        }
        const currTime = Math.round(new Date().getTime() / 1000);
        await updateUpdateFreq(`meallist_${id}`, currTime);
      }   
      
      if (reload){
        fetchMealList();
      }
    },[reload]);
 
    useEffect(() => {
      if (blockusers && blockusers.includes(userContext.user.id as string)){
         setBlockedUser(true);
      }
    },[userContext]);

    function getMealArr(meallist:MealOrderDataType[]): MealOrderElm[]{
       const mealarr = meallist.map((item: any) =>  {
          if (item.quantity){
            return ({id: item.id, mealname: item.mealname, unitprice: item.unitprice, quantity: item.quantity});
          }
          return ({id: item.id, mealname: item.mealname, unitprice: item.unitprice});
       });
       return mealarr;
    }
    
    function iniOrderStatus(idx: number){
      const mealArray =  mealList.slice();
      mealArray[idx] = {...mealArray[idx], quantity: 1};    
      setMealList(mealArray);
    }

    function changeOrderQty(value: number, idx: number){
      const mealArray =  mealList.slice();
      if (value > 0){
         mealArray[idx] = {...mealArray[idx], quantity: value};
      }else{
        delete mealArray[idx].quantity;
      }
      setMealList(mealArray);
    }

    function updateMealOrderArr(orderList:MealOrderElm[]){
      const mealArray =  mealList.slice();
      for (let elm of orderList){
        const idx = mealArray.findIndex(item => item.id === elm.id);
        if (idx > -1) {
          mealArray[idx] = {...mealArray[idx], quantity: elm.quantity};
        }
      }
      resetOrder();
      setMealList(mealArray);
    }
    
    function resetOrder(){
      const mealArray =  mealList.map(item => {
        if (item.quantity){
           delete item.quantity;
        }
        return item;
      })
      setMealList(mealArray);
    }

    function closeModal(){
      setShowModal(false);
    }
    
    return (userContext &&
        <SafeAreaView style={styles.container}>
          <KeyboardAwareScrollView
              resetScrollToCoords={{ x: 0, y: 0 }}
              keyboardShouldPersistTaps='handled'
              scrollEnabled={true}
              style={styles.scrollView}
              >
              <View>
                <UserOrders />
                <DisplayImage
                  filename={profileimage}
                  style={{width: window.width - 10, height: (window.width - 10)*0.4}}
                  />
                <View style={styles.listItem}>
                  {foodsupplyArr.map((itm: string, index:number) =>{
                    if (!itm.trim()){
                      return (
                        <Text key={index}>
                        </Text>
                      )
                    }
                    if ((index + 1) === foodsupplyArr.length){
                      return (
                        <Text style={styles.descrText} key={index}>
                          {itm.trim()}
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
                {(mealList.find(item => item.quantity) && !blockedUser) &&
                  <View style={[styles.itemLeft, styles.listItem]}>
                    <Button mode="contained" style={{marginRight: 20}} onPress={() => setShowModal(true)}>Place Order</Button>
                    <Button mode="outlined" style={{marginRight: 20}} onPress={() => resetOrder()}>Reset</Button>
                  </View>
                }
                <View style={styles.itemLeft}>
                  <Button mode="outlined" onPress={() => navigation.navigate('UserOrderRecords',{shopId: id, shopListData})}>My Purchase Order Records</Button>
                </View>
                <View>
                  <Text>{'\n'}</Text>
                </View>
              </View>
          
              {!blockedUser &&
                <> 
                {mealList.map((item: MealOrderDataType, idx: number) => (
                <View key={item.id} style={[styles.listItem,{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}]}>
                  <View style={{width: (window.width - 10)*0.6}}>
                    <Text style={styles.mealNameText}>{item.mealname}</Text>
                    <Text style={styles.descrText}>{item.mealdescr}</Text>
                    <Text style={styles.descrText}>{`$${item.unitprice}`}</Text>
                    {item.quantity &&
                    <View style={styles.itemLeft}>
                      <View style={{marginRight: 10}}>
                        <Text style={styles.descrText}>Order Qty</Text>
                      </View>
                      <NumericInput 
                        totalHeight={40} 
                        minValue={0} 
                        value={mealList[idx].quantity} 
                        onChange={value => changeOrderQty(value, idx)} 
                        />
                    </View>  
                    }
                    {!item.quantity &&
                    <Button mode="outlined" onPress={() => iniOrderStatus(idx)}>Order This Meal</Button>
                    }
                  </View>
                        
                  <DisplayImage
                    filename={item.profileimage!}
                    style={{width: (window.width - 10)*0.35, height: (window.width - 10)*0.35}}
                    />
                </View>
                ))}
                </>
              }
         </KeyboardAwareScrollView>    
          <Modal
            isVisible={showModal}
            >
            <MealOrder 
              shopid={id}
              shopname={shopname}
              profileimage={profileimage} 
              blockusers={blockusers}
              owner={owner}
              mealArr={getMealArr(mealList)}
              updateMealOrderArr={updateMealOrderArr}
              resetOrder={resetOrder}
              closeModal={closeModal}
              />
          </Modal>
        </SafeAreaView>
    );
}    