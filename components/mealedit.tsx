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
import {UserContextType, MealDataType} from '../lib/types';

interface PropsType {
    shopId: string;
    mealData: MealDataType;
    updateMenuOnMealEdit: (meal: MealDataType) => void;
    closeModal: () => void;
}

export default function MealEdit({shopId, mealData, updateMenuOnMealEdit, closeModal}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [mealName, setMealName] = useState(mealData.mealname);
    const mealNameEl = useRef(null);
    const [mealDescr, setMealDescr] = useState(mealData.mealdescr);
    const mealDescrEl = useRef(null);
    const [mealPrice, setMealPrice] = useState(mealData.unitprice+'');
    const mealPriceEl = useRef(null);
    const [mealnameerr, setMealNameErr] = useState('');
    const [mealdescrerr, setMealDescrErr] = useState('');
    const [mealpriceerr, setMealPriceErr] = useState('');
    const [inPost, setInPost] = useState(false);

    function handleMealPriceInput(text: string){
        const value = text.replace(/<\/?[^>]*>/g, "");
        if (isNaN(Number(value))){
           return;
        }
        setMealPrice(value);
    }
    
    function resetErrMsg(){
        setMealNameErr('');
        setMealDescrErr('');
        setMealPriceErr('');
    }
      
    async function submitFormData() {
        resetErrMsg();
        //Check if Name of Meal is filled
        if (!mealName.trim()){
            setMealName(prevState => prevState.trim())
            setMealNameErr("Please type your name of meal, this field is required!");
            (mealNameEl.current as any).focus();
            return;
        }
        //Check if Meal Description is filled
        if (!mealDescr.trim()){
            setMealDescr(prevState => prevState.trim())
            setMealDescrErr("Please type your meal description, this field is required!");
            (mealDescrEl.current as any).focus();
            return;
        }
        //Check if Meal Price is filled
        if (!mealPrice || !Number(mealPrice)){
            setMealPriceErr("Please type your meal price, this field is required!");
            (mealPriceEl.current as any).focus();
            return;
        }
 
        const updateObj = {mealname: mealName, mealdescr: mealDescr, unitprice: Number(mealPrice)};
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        setInPost(true);
        try {
            // Send request to our api route
            const { data } = await axios.post(`${DOMAIN_URL}/api/editmeal`, {shopId, id: mealData.id, ...updateObj}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setMealNameErr("No authorization to upload data.");
                return;
            }
            updateMenuOnMealEdit({...mealData, ...updateObj})
            closeModal();
        }catch(err){
            setInPost(false);
            setMealNameErr('Failed to upload data to database!');
        }
    }
  
    function resetForm(){
        setMealName(mealData.mealname);
        setMealNameErr('');
        setMealDescr(mealData.mealdescr);
        setMealDescrErr('');
        setMealPrice(mealData.unitprice+'');
        setMealPriceErr('');
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
                    <Text style={styles.headingText}>Edit Meal As Below</Text>
                </View>       
                <View style={[styles.itemRight, styles.listItem]}>
                    <Button mode="outlined" onPress={() => closeModal()}>Close</Button>
                </View> 
                <View>
                    <TextInput
                        mode='outlined'
                        label='Name of Meal'
                        placeholder='Name of Meal'
                        value={mealName}
                        onChangeText={text => setMealName(text.replace(/<\/?[^>]*>/g, ""))}
                        ref={mealNameEl}
                    />
                    <Text style={{color: 'red'}}>{mealnameerr}</Text>
                </View>
                <View>
                    <TextInput
                        mode='outlined'
                        label='Meal Description'
                        placeholder='Meal Description'
                        multiline={true}
                        value={mealDescr}
                        onChangeText={text => setMealDescr(text.replace(/<\/?[^>]*>/g, ""))}
                        ref={mealDescrEl}
                    />
                    <Text style={{color: 'red'}}>{mealdescrerr}</Text>
                </View>
                <View>
                    <TextInput
                        mode='outlined'
                        label='Meal Price'
                        placeholder='Meal Price'
                        value={mealPrice}
                        onChangeText={text => handleMealPriceInput(text)}
                        ref={mealPriceEl}
                    />
                    <Text style={{color: 'red'}}>{mealpriceerr}</Text>
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
