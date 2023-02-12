import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView, 
         View, 
         Text
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, TextInput, ActivityIndicator, Colors } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, ShopDataType} from '../lib/types';

interface PropsType {
    shopData: ShopDataType;
    updateShopData: (shop: ShopDataType) => void;
    closeModal: () => void;
}

export default function ShopEdit({shopData, updateShopData, closeModal}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [shopName, setShopName] = useState(shopData.shopname);
    const shopNameEl = useRef(null);
    const [foodSupply, setFoodSupply] = useState(shopData.foodsupply);
    const foodSupplyEl = useRef(null);
    const [shopnameerr, setShopNameErr] = useState('');
    const [foodsupplyerr, setFoodSupplyErr] = useState('');
    const [inPost, setInPost] = useState(false);

    function resetErrMsg(){
        setShopNameErr('');
        setFoodSupplyErr('');
    }
      
    async function submitFormData() {
        resetErrMsg();
        //Check if Name of Restaurant is filled
        if (!shopName.trim()){
          setShopName(prevState => prevState.trim())
          setShopNameErr("Please type your name of restaurant, this field is required!");
          (shopNameEl.current as any).focus();
          return;
        }
        //Check if Food Supply Description is filled
        if (!foodSupply.trim()){
          setFoodSupply(prevState => prevState.trim())
          setFoodSupplyErr("Please type your food supply description, this field is required!");
          (foodSupplyEl.current as any).focus();
          return;
        }
 
        const updateObj = {shopname: shopName, foodsupply: foodSupply};
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        setInPost(true);
        try {
            // Send request to our api route
            const { data } = await axios.post(`${DOMAIN_URL}/api/editshop`, {shopId: shopData.id,  ...updateObj}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
               setShopNameErr("No authorization to upload data.");
               return;
            }
            updateShopData({...shopData, ...updateObj})
            closeModal();
        }catch(err){
            setInPost(false);
            setShopNameErr('Failed to upload data to database!');
        }
    }

    function resetForm(){
        setShopName(shopData.shopname);
        setShopNameErr('');
        setFoodSupply(shopData.foodsupply);
        setFoodSupplyErr('');
    }

    return (userContext &&
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                resetScrollToCoords={{ x: 0, y: 0 }}
                keyboardShouldPersistTaps='handled'
                scrollEnabled={true}
                style={{paddingHorizontal: 5}}
                >
                <View style={[styles.itemCenter, styles.listItem]}>
                    <Text style={styles.headingText}>{`Edit ${shopData.shopname} Fundamental Data`}</Text>
                </View>       
                <View style={[styles.itemRight, styles.listItem]}>
                    <Button mode="outlined" onPress={() => closeModal()}>Close</Button>
                </View> 
                <View>
                    <TextInput
                        mode='outlined'
                        label='Name of Restaurant'
                        placeholder='Name of Restaurant'
                        value={shopName}
                        onChangeText={text => setShopName(text.replace(/<\/?[^>]*>/g, ""))}
                        ref={shopNameEl}
                    />
                    <Text style={{color: 'red'}}>{shopnameerr}</Text>
                </View>
                <View>
                    <TextInput
                        mode='outlined'
                        label='Food Supply'
                        placeholder='Food Supply'
                        multiline={true}
                        value={foodSupply}
                        onChangeText={text => setFoodSupply(text.replace(/<\/?[^>]*>/g, ""))}
                        ref={foodSupplyEl}
                    />
                    <Text style={{color: 'red'}}>{foodsupplyerr}</Text>
                </View>
                <View style={[styles.listItem, styles.itemLeft]}>
                    <Button
                        mode='contained'
                        onPress={() => submitFormData()}
                        >Go Update
                    </Button>
                    <Button
                        mode='contained'
                        onPress={() => resetForm()}
                        style={{marginLeft: 10}}
                        >Reset
                    </Button>
                </View>
            </KeyboardAwareScrollView>
            {inPost &&
                <View style={styles.loading}>
                    <ActivityIndicator size="large" animating={true} color={Colors.white} />
                </View>
            }
        </SafeAreaView>
    );

}    