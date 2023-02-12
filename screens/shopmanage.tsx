import React, {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, 
         ScrollView,
         View, 
         Text,
         Alert
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, ActivityIndicator, Colors } from 'react-native-paper';
import SelectDropdown from "react-native-select-dropdown";
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import Modal from '../components/modal';
import ShopAdd from '../components/shopadd';
import ShopDataManage from '../components/shopdatamanage';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, ShopBrief} from '../lib/types';

interface PropsType {
  navigation: any
}

export default function ShopManage({ navigation }: PropsType) {
  const userContext: UserContextType = useContext(UserContext);
  const [shopId, setShopId] = useState('');
  const [shopArr, setShopArr] = useState<ShopBrief[]>([]);
  const [manageContent, setmanageContent] = useState('meal');
  const [blockusers, setBlockusers] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [inPost, setInPost] = useState(false);

  useEffect(() => {
    if (userContext && userContext.user.shopid && userContext.user.shopid.length > 0) {
       const shopIdArr = userContext.user.shopid.filter(itm => itm.onboard === true);
       if (shopIdArr.length > 0){
            setShopArr(shopIdArr);
            setShopId(shopIdArr[0].id);
       }
    }
  },[userContext]);

  function updateBlockUsers(users: string[]){
    setBlockusers(users);
  }

  async function confirmDeleteShop(shop: ShopBrief){
    Alert.alert(
      "Remove Restaurant",
      `Are you sure to delete the restaurant of ${shop.shopname}?`,
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel"),
          style: "cancel"
        },
        { text: "OK", onPress: () => deleteShop(shop) }
      ]
    );
  }
  
  async function deleteShop(shop: ShopBrief){
    initInPost();
    try {
      // Send request to our api route
      const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
      const { data } = await axios.delete(`${DOMAIN_URL}/api/removeshop`, { headers: headers, data: {shopId: shop.id}});
      stopInPost();
      let {shopid} = userContext.user;
      shopid = shopid!.filter(item => item.id !== shop.id);
      const user = {...userContext.user, shopid};
      userContext.user = user;
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }catch(err){
      stopInPost();
    }
  }
  
  function initInPost(){
      setInPost(true);
  }
  
  function stopInPost(){
      setInPost(false);
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
        {userContext.user.usertype === 2 &&
          <>
          <ScrollView 
            horizontal={true} 
            style={styles.listItem} 
            showsHorizontalScrollIndicator={true}
            >
            {shopArr.length > 0 &&
            <>
            {manageContent === 'meal' &&
            <Button 
              mode='outlined' 
              disabled={true}
              style={{marginRight: 10}}
              >Manage Meals
            </Button>
            }
            {manageContent !== 'meal' &&
            <Button 
              mode='outlined' 
              onPress={() => setmanageContent('meal')}
              style={{marginRight: 10}}
              >Manage Meals
            </Button>
            }
            {manageContent === 'order' &&
            <Button 
              mode='outlined' 
              disabled={true}
              style={{marginRight: 10}}
              >Manage Orders
            </Button>
            }
            {manageContent !== 'order' &&
            <Button 
              mode='outlined'
              onPress={() => setmanageContent('order')}
              style={{marginRight: 10}}
              >Manage Orders
            </Button>
            }
            {manageContent === 'blockusers' &&
            <Button 
              mode='outlined' 
              disabled={true}
              style={{marginRight: 10}}
              >Blocked Users
            </Button>
            }
            {(manageContent !== 'blockusers' && blockusers.length > 0) &&
            <Button 
              mode='outlined'
              onPress={() => setmanageContent('blockusers')}
              style={{marginRight: 10}}
              >Blocked Users
            </Button>
            }
            </>
            }
            <Button 
              mode='outlined'
              onPress={() => setShowModal(true)}
              >Add Restaurant
            </Button>
          </ScrollView>  
          {shopArr.length > 0 &&
          <>
          <View>
            <Text style={styles.headingText}>My Restaurants</Text>
          </View>
          <SelectDropdown
            data={shopArr.map(item => item.shopname)}
            defaultValueByIndex={shopArr.findIndex(item => item.id == shopId)}
            onSelect={(selectedItem, index) => 
              setShopId(shopArr[index].id)
            }
            defaultButtonText={"Please Select"}
            buttonTextAfterSelection={(selectedItem, index) => 
              shopArr[index].shopname
            }         
            rowTextForSelection={(item, index) => 
              shopArr[index].shopname
            }        
            buttonStyle={styles.dropdownBtnStyle}
            buttonTextStyle={styles.dropdownBtnTxtStyle}
            renderDropdownIcon={() => {
              return (
                <Ionicons name="chevron-down" color={"#444"} size={18} />
              );
            }}
            dropdownIconPosition={"right"}
            dropdownStyle={styles.dropdownDropdownStyle}
            rowStyle={styles.dropdownRowStyle}
            rowTextStyle={styles.dropdownRowTxtStyle}
            />
          </>
          }
          {shopArr.length === 0 &&
          <View>
            <Text style={styles.headingText}>Currently No Restaurant Under My Management</Text>
          </View>
          }
          {(userContext.user.shopid && userContext.user.shopid.length > 0 && userContext.user.shopid.filter(itm => itm.onboard === false).length > 0) &&
          <>
          <View>
            <Text>Restaurants Awaiting Admin&apos;s Approval:</Text>
          </View>
          {userContext.user.shopid.filter(itm => itm.onboard === false).map(item => 
            <View key={item.id} style={styles.itemLeft}>
              <Text>{item.shopname}</Text>
              <Button
                mode='contained'
                style={{marginLeft: 10, backgroundColor: 'green'}}
                onPress={() => confirmDeleteShop(item)}
                >
                Delete Restaurant
              </Button>
            </View>
          )}
          </>
          }
          {shopId &&
            <ShopDataManage 
              shopId={shopId} 
              manageContent={manageContent}
              updateBlockUsers={updateBlockUsers}
              initInPost={initInPost}
              stopInPost={stopInPost}
              />
          }
          <Modal
            isVisible={showModal}
            >
            <ShopAdd 
               closeModal={closeModal}/> 
          </Modal>
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