import React, {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { View, 
         Text,
         useWindowDimensions,
         Alert
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import DisplayImage from './displayimage';
import Modal from './modal';
import MealAdd from './mealadd';
import MealEdit from './mealedit';
import ShopEdit from './shopedit';
import MealProfileUpdate from './mealprofileupdate';
import ShopProfileUpdate from './shopprofileupdate';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, ShopDataType, MealDataType, ShopBrief} from '../lib/types';
import { pageSizeMeals } from '../lib/utils';

interface PropsType {
    shopData: ShopDataType;
    shopMutate: (shop: ShopDataType) => void;
    mealMenu:  MealDataType[];
    updateMenu: (menu?: MealDataType[]) => void;
    pageIndex: number;
    updatePage: (pIndex: number) => void;
    initInPost: () => void;
    stopInPost: () => void;
}

export default function MealManage({shopData, shopMutate, mealMenu, updateMenu, pageIndex, updatePage, initInPost, stopInPost}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const window = useWindowDimensions();
    const [showModal, setShowModal] = useState(false);
    const [shopEditModal, setShopEditModal] = useState(false);
    const [shopProfileModal, setShopProfileModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showProfileEditModal, setShowProfileEditModal] = useState(false);
    const [mealForEdit, setMealForEdit] = useState<MealDataType | null>(null);

    useEffect(() => {
        if (mealMenu && mealMenu.length > 0){
          setMealForEdit(mealMenu[0]);
        }
    },[mealMenu]); 
      
    function updateShopData(shop: ShopDataType){
        shopMutate(shop);
        const user = userContext.user;
        let shopList: ShopBrief[] | undefined = user.shopid?.slice();
        shopList = shopList || [];
        const idx = shopList.findIndex((item: ShopBrief) => item.id === shop.id);
        if (idx > -1){
           shopList[idx] = {id: shop.id, shopname: shop.shopname, onboard: shop.onboard};
        }
        userContext.login({...user, shopid: shopList});
    }
    
    function confirmDeleteMeal(meal: MealDataType){
        Alert.alert(
            "Remove Meal From Menu",
            `Are you sure to delete the meal of ${meal.mealname}?`,
            [
              {
                text: "Cancel",
                onPress: () => console.log("Cancel"),
                style: "cancel"
              },
              { text: "OK", onPress: () => deleteMeal(meal) }
            ]
        );
    
    }

    async function deleteMeal(meal: MealDataType){
        initInPost();
        try {
          // Send request to our api route
          const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
          const { data } = await axios.delete(`${DOMAIN_URL}/api/removemeal`, { headers: headers, data: {shopId: shopData.id, id: meal.id}});
          stopInPost();
          const menuList = mealMenu.slice().filter((item: MealDataType) => item.id !== meal.id);
          updateMenu(menuList);
        }catch(err){
           stopInPost();
        }
    }
     
    function updateMealMenu(meal: MealDataType){
        if (pageIndex){
           updatePage(0);
           updateMenu();
           return;
        }
        let menuList = mealMenu.slice(0, pageSizeMeals - 1);
        updateMenu([meal, ...menuList]);
    }
 
    function updateMenuOnMealEdit(meal: MealDataType){
        const menuList = mealMenu.slice();
        const idx = menuList.findIndex((item: MealDataType) => item.id === meal.id);
        if (idx > -1){
           menuList[idx] = meal;
        }
        updateMenu(menuList);
    }
    
    function closeModal(){
       setShowModal(false);
    }
     
    function closeEditModal(){
       setShowEditModal(false);
    }
 
    function closeProfileEditModal(){
       setShowProfileEditModal(false);
    }
 
    function closeShopEditModal(){
       setShopEditModal(false);
    }
 
    function closeShopProfileModal(){
       setShopProfileModal(false);
    }
  
    return (userContext &&
        <View>
            {shopData &&
            <>
            <View style={styles.listItem}>
                <DisplayImage
                    filename={shopData.profileimage}
                    style={{width: window.width - 10, height: (window.width - 10)*0.4}}
                    />
                <TextInput
                    mode='flat'
                    disabled={true}
                    multiline={true}
                    value={shopData.foodsupply}
                    dense={true}
                    />
                <View style={[styles.itemSpaceBetween, styles.viewItem]}>
                    <Button 
                        mode='contained'
                        onPress={() => setShowModal(true)}
                        style={{backgroundColor: 'green'}}
                        >
                        Add Meals
                    </Button>
                    <Button 
                        mode='contained'
                        onPress={() => setShopEditModal(true)}
                        style={{backgroundColor: 'green'}}
                        >
                        Restaurant Edit
                    </Button>
                </View>
                <View style={[styles.itemSpaceBetween, styles.viewItem]}>
                    <Button 
                        mode='contained'
                        onPress={() => setShopProfileModal(true)}
                        style={{backgroundColor: 'green'}}
                        >
                        Restaurant Profile
                    </Button>
                </View>
            </View>
            </>
            }

            {(mealMenu && mealMenu.length > 0) &&
            <>
            {mealMenu.map((item: MealDataType) => 
            <View key={item.id} style={[styles.itemLeft, styles.listItem, {alignItems: 'flex-start'}]}>
                <DisplayImage
                    filename={item.profileimage!}
                    style={{width: (window.width - 10)*0.35, height: (window.width - 10)*0.35}}
                    />
                
                <View style={{marginLeft: 10}}>
                    <View style={{marginBottom: 5}}>
                        <Text style={{fontWeight: 'bold'}}>{item.mealname}</Text>
                    </View>
                    <View style={{marginBottom: 5}}>
                        <TextInput 
                        mode='flat'
                        disabled={true}
                        multiline={true}
                        value={item.mealdescr}
                        dense={true}
                        />   
                    </View>
                    <View style={{marginBottom: 5}}>
                        <Text>{`$${item.unitprice}`}</Text>
                    </View>
                    <View style={[styles.itemLeft, {marginBottom: 5}]}>
                        <Button 
                            mode='contained'
                            onPress={() => {setMealForEdit(item); setShowEditModal(true);}}
                            >
                            Edit
                        </Button>
                        <Button 
                            mode='contained'
                            onPress={() => {setMealForEdit(item); setShowProfileEditModal(true);}}
                            style={{marginLeft: 10}}
                            >
                            Profile Update
                        </Button>
                    </View>
                    <View style={[styles.itemLeft, {marginBottom: 5}]}>
                        <Button 
                            mode='contained'
                            onPress={() => confirmDeleteMeal(item)}
                            >
                            Delete
                        </Button>
                    </View>
                </View>
            </View>
            )}
            <View>
            {pageIndex > 0 && 
                <Button mode='outlined' onPress={() => updatePage(pageIndex - 1)}>&larr;  Previous</Button>
            }
            {pageSizeMeals === mealMenu.length &&
                <Button mode='outlined' onPress={() => updatePage(pageIndex + 1)}>Next  &rarr;</Button>
            }
            </View>
            </>
            }            
            {shopData &&
            <>
            <Modal
                isVisible={showModal}
                >
                <MealAdd 
                    shopId={shopData.id}
                    shopName={shopData.shopname}
                    updateMealMenu={updateMealMenu}
                    closeModal={closeModal}
                />
            </Modal>
            <Modal
                isVisible={shopEditModal}
                >
                <ShopEdit 
                    shopData={shopData}
                    updateShopData={updateShopData}
                    closeModal={closeShopEditModal}
                />
            </Modal>
            <Modal
                isVisible={shopProfileModal}
                >
                <ShopProfileUpdate 
                    shopData={shopData}
                    updateShopData={updateShopData}
                    closeModal={closeShopProfileModal}
                />
            </Modal>
            </>
            }
            {(mealMenu && mealMenu.length > 0) &&
            <>
            <Modal
                isVisible={showEditModal}
                >
                <MealEdit
                    shopId={shopData.id}
                    mealData={mealForEdit as MealDataType}
                    updateMenuOnMealEdit={updateMenuOnMealEdit}
                    closeModal={closeEditModal}
                />
            </Modal>

            <Modal
                isVisible={showProfileEditModal}
                >
                <MealProfileUpdate
                    shopId={shopData.id}
                    mealData={mealForEdit as MealDataType}
                    updateMenuOnMealEdit={updateMenuOnMealEdit}
                    closeModal={closeProfileEditModal}
                />
            </Modal>
            </>
            }
        </View>
    );
}    
