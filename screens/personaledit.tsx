import React, {useState, useRef, useCallback, useContext} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import passwordValidator from 'password-validator';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform,
         View, 
         Text,
         Keyboard,
         ScrollView
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, TextInput, Divider, Switch, ActivityIndicator, Colors } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType} from '../lib/types';
import {getUserTypeDescr} from '../lib/utils';

interface PropsType {
    navigation: any
}
  
export default function PersonalEdit({ navigation }: PropsType) {
    const userContext: UserContextType = useContext(UserContext);
    const [name, setName] = useState('');
    const [nameerr, setNameErr] = useState('');
    const nameEl = useRef(null);
    const [passwd, setPasswd] = useState('');
    const [passwderr, setPasswdErr] = useState('');
    const passwdEl = useRef(null);
    const [phone, setPhone] = useState('');
    const [phoneerr, setPhoneErr] = useState('');
    const phoneEl = useRef(null);
    const [address, setAddress] = useState('');
    const [addresserr, setAddressErr] = useState('');
    const addressEl = useRef(null);
    const [tobeowner, setTobeOwner] = useState(false);
    const [tobeownererr, setTobeOwnerErr] = useState('');
    const [updateName, setUpdateName] = useState(false);
    const [updatePasswd, setUpdatePasswd] = useState(false);
    const [updatePhone, setUpdatePhone] = useState(false);
    const [updateAddress, setUpdateAddress] = useState(false);
    const [updateTobeOwner, setUpdateTobeOwner] = useState(false);
    const [inPost, setInPost] = useState(false);

    useFocusEffect(
        useCallback(() => {
          if (userContext){
            setUpdateName(false);
            setUpdatePasswd(false);
            setUpdatePhone(false);
            setUpdateAddress(false);
            setUpdateTobeOwner(false);
          }
        }, [navigation, userContext])
    );
    
    function handleNameChange(text: string){
        //Remove all the markups to prevent Cross-site Scripting attacks
        const value = text.replace(/<\/?[^>]*>/g, "");
        setName(value);
    }
    
    function updateNameInit(){
        setUpdateName(true); 
        setName(userContext.user.name as string);       
    }
 
    function updateNameReset(){
        setName(userContext.user.name as string);
        setNameErr('');    
    }
    
    async function submitNameUpdate(){
        if (name.trim() === userContext.user.name){
            return;
        }
        setNameErr('');
        //Check if Name is filled
        if (!name.trim()){
           setNameErr("Please type your name, this field is required!");
           (nameEl.current as any).focus();
           return;
        }

        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        setInPost(true);
        try {
            const {data} = await axios.put(`${DOMAIN_URL}/api/updateuser`, {name: name.trim()}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setNameErr("No authorization to update");
                (nameEl.current as any).focus();
                return;
            }
              
            const user = {...userContext.user, name: name};
            await AsyncStorage.setItem('user', JSON.stringify(user));
            userContext.login(user);
            setUpdateName(false);
        }catch(err){
            setInPost(false);
            setNameErr("Faile to update name");
        }
    }

    async function submitPasswdUpdate(){
        setPasswdErr('');
        //Check if Passwd is filled
        if (!passwd){
           setPasswdErr("Please type your password, this field is required!");
           (passwdEl.current as any).focus();
           return;
        }

        //Check the validity of password
        let schema = new passwordValidator();
        schema
        .is().min(8)                                    // Minimum length 8
        .is().max(100)                                  // Maximum length 100
        .has().uppercase()                              // Must have uppercase letters
        .has().lowercase()                              // Must have lowercase letters
        .has().digits(2)                                // Must have at least 2 digits
        .has().not().spaces();                          // Should not have spaces
        if (!schema.validate(passwd)){
            setPasswdErr("The password you typed is not enough secured, please retype a new one. The password must have both uppercase and lowercase letters as well as minimum 2 digits.");
            (passwdEl.current as any).focus();
            return;
        }

        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        setInPost(true);
        try {
            const {data} = await axios.put(`${DOMAIN_URL}/api/updateuser`, {password: passwd}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setPasswdErr("No authorization to update");
                (passwdEl.current as any).focus();
                return;
            }
            setUpdatePasswd(false);
        }catch(e){
            setInPost(false);
            setPasswdErr("Failed to update password");
        }
    }

    function updatePhoneInit(){
        setUpdatePhone(true); 
        setPhone(userContext.user.phone as string);       
    }
 
    function updatePhoneReset(){
        setPhone(userContext.user.phone as string); 
        setPhoneErr('');    
    }
    
    async function submitPhoneUpdate(){
        if (phone.trim() === userContext.user.phone){
            return;
        }
        setPhoneErr('');
 
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        setInPost(true);
        try {
            const {data} = await axios.put(`${DOMAIN_URL}/api/updateuser`, {phone: phone.trim()}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setPhoneErr("No authorization to update");
                (phoneEl.current as any).focus();
                return;
            }
              
            const user = {...userContext.user, phone: phone};
            await AsyncStorage.setItem('user', JSON.stringify(user));
            userContext.login(user);
            setUpdatePhone(false);
        }catch(err){
            setInPost(false);
            setPhoneErr("Failed to update phone");
        }
    }

    function updateAddressInit(){
        setUpdateAddress(true); 
        setAddress(userContext.user.address as string);  
    }
 
    function updateAddressReset(){
        setAddress(userContext.user.address as string); 
        setAddressErr('');  
    }
    
    async function submitAddressUpdate(){
        if (address.trim() === userContext.user.address){
            return;
        }
        setAddressErr('');
        
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        setInPost(true);
        try {
            const {data} = await axios.put(`${DOMAIN_URL}/api/updateuser`, {address: address.trim()}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setAddressErr("No authorization to update");
                (addressEl.current as any).focus();
                return;
            }
              
            const user = {...userContext.user, address: address};
            await AsyncStorage.setItem('user', JSON.stringify(user));
            userContext.login(user);
            setUpdateAddress(false);
        }catch(err){
            setInPost(false);
            setAddressErr("Failed to update address");
        }
    }

    function updateTobeOwnerInit(){
        setUpdateTobeOwner(true); 
        setTobeOwner(userContext.user.tobeowner as boolean);  
    }
 
    function updateTobeOwnerReset(){
        setTobeOwner(userContext.user.tobeowner as boolean);
        setTobeOwnerErr(''); 
    }
    
    async function submitTobeOwnerUpdate(){
        if (tobeowner === userContext.user.tobeowner){
            return;
        }
        setTobeOwnerErr('');
        
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        let objToDB;
        if (tobeowner){
            objToDB = {tobeowner: tobeowner, tobeownerAt: new Date().toISOString()};
        }else{
            objToDB = {tobeowner: tobeowner};
        }
        setInPost(true);
        try {
            const {data} = await axios.put(`${DOMAIN_URL}/api/updateuser`, objToDB, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setTobeOwnerErr("No authorization to update");
                return;
            }
              
            const user = {...userContext.user, tobeowner: tobeowner};
            await AsyncStorage.setItem('user', JSON.stringify(user));
            userContext.login(user);
            setUpdateTobeOwner(false);
        }catch(err){
            setInPost(false);
            setTobeOwnerErr("Failed to update your intend listing of your restaurant in this app");
        }
    }

    return (userContext &&
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                resetScrollToCoords={{ x: 0, y: 0 }}
                keyboardShouldPersistTaps='handled'
                scrollEnabled={true}
                style={styles.scrollView}
                >
                    <Divider />
                    <View style={styles.viewItem}>
                        {!updateName &&
                        <View style={styles.itemSpaceBetween}>
                            <View>
                                <Text>Name: {userContext.user.name}</Text>
                            </View>
                            <Button mode='contained' onPress={() => updateNameInit()}>Update</Button>
                        </View> 
                        }
                        {updateName &&
                        <>
                        <TextInput 
                            mode='outlined'
                            label='Name'
                            placeholder='Name'
                            value={name}
                            onChangeText={text => handleNameChange(text)}
                            ref={nameEl}
                            />
                        {name.trim() !== userContext.user.name &&
                        <View style={[styles.itemLeft,{marginTop: 10}]}>
                            <Button mode='contained' onPress={() => submitNameUpdate()}>Go Update</Button>
                            <Button mode='contained' style={{marginLeft: 10}} onPress={()=> updateNameReset()}>Reset</Button>
                        </View>
                        }
                        <View>
                            <Text style={{color:'red'}}>{nameerr}</Text>
                        </View>
                        </> 
                        }
                        <Divider />
                    </View>

                    <View style={styles.viewItem}>
                        {!updatePasswd &&
                        <View style={styles.itemSpaceBetween}>
                            <View>
                                <Text>Password:</Text>
                            </View>
                            <Button mode='contained' onPress={() => setUpdatePasswd(true)}>Update</Button>
                        </View> 
                        } 
                        {updatePasswd &&
                        <>
                        <TextInput 
                            mode='outlined'
                            label='Password'
                            placeholder='Password'
                            secureTextEntry={true}
                            value={passwd}
                            onChangeText={text => setPasswd(text.replace(/<\/?[^>]*>/g, "").trim())}
                            ref={passwdEl}
                            />
                        {passwd &&
                        <View style={[styles.itemLeft,{marginTop: 10}]}>
                            <Button mode='contained' onPress={() => submitPasswdUpdate()}>Go Update</Button>
                            <Button mode='contained' style={{marginLeft: 10}} onPress={()=> {setPasswd('');setPasswdErr('');}}>Reset</Button>
                        </View>
                        }
                        <View>
                            <Text style={{color:'red'}}>{passwderr}</Text>
                        </View>
                        </>
                        }
                        <Divider />
                    </View>

                    <View style={styles.viewItem}>
                        {!updatePhone &&
                        <View style={styles.itemSpaceBetween}>
                            <View>
                                <Text>Phone: {userContext.user.phone}</Text>
                            </View>
                            <Button mode='contained' onPress={() => updatePhoneInit()}>Update</Button>
                        </View> 
                        }
                        {updatePhone &&
                        <>
                        <TextInput 
                            mode='outlined'
                            label='Phone'
                            placeholder='Phone'
                            value={phone}
                            onEndEditing={Keyboard.dismiss}
                            onChangeText={text => setPhone(text.replace(/<\/?[^>]*>/g, "").trim())}
                            ref={phoneEl}
                            />
                        {phone.trim() !== userContext.user.phone &&
                        <View style={[styles.itemLeft,{marginTop: 10}]}>
                            <Button mode='contained' onPress={() => submitPhoneUpdate()}>Go Update</Button>
                            <Button mode='contained' style={{marginLeft: 10}} onPress={()=> updatePhoneReset()}>Reset</Button>
                        </View>
                        } 
                        <View>
                            <Text style={{color:'red'}}>{phoneerr}</Text>
                        </View>
                        </> 
                        }
                        <Divider />
                    </View>

                    <View style={styles.viewItem}>
                        {!updateAddress &&
                        <View style={styles.itemSpaceBetween}>
                            <View style={styles.itemLeft}>
                                <Text>Address: </Text>
                                <TextInput 
                                    mode='flat'
                                    disabled={true}
                                    multiline={true}
                                    dense={true}
                                    value={userContext.user.address}
                                    style={{paddingHorizontal: 5}}
                                    />
                            </View>
                            <Button mode='contained' onPress={() => updateAddressInit()}>Update</Button>
                        </View> 
                        }
                        {updateAddress &&
                        <>
                        <TextInput 
                            mode='outlined'
                            label='Address'
                            placeholder='Address'
                            multiline={true}
                            value={address}
                            onChangeText={text => setAddress(text.replace(/<\/?[^>]*>/g, ""))}
                            ref={addressEl}
                            />
                        {address.trim() !== userContext.user.address &&
                        <View style={[styles.itemLeft,{marginTop: 10}]}>
                            <Button mode='contained' onPress={() => submitAddressUpdate()}>Go Update</Button>
                            <Button mode='contained' style={{marginLeft: 10}} onPress={()=> updateAddressReset()}>Reset</Button>
                        </View>
                        }                        
                        <View>
                            <Text style={{color:'red'}}>{addresserr}</Text>
                        </View>
                        </>
                        }
                        <Divider />
                    </View>

                    {userContext.user.usertype as number < 2 &&
                    <View style={styles.viewItem}>
                        {!updateTobeOwner &&
                        <View style={styles.itemSpaceBetween}>
                            <View style={{maxWidth: '60%'}}>
                                <Text>Intend to list your restaurant in this app: {userContext.user.tobeowner ? 'Yes': 'No'}</Text>
                            </View>
                            <Button  style={{maxWidth: '40%'}} mode='contained' onPress={() => updateTobeOwnerInit()}>Update</Button>
                        </View> 
                        }
                        {updateTobeOwner &&
                        <>
                        <View style={styles.itemLeft}>
                            <Text>Intend to list your restaurant in this app: </Text>
                            <Switch value={tobeowner} onValueChange={() => setTobeOwner(prevState => !prevState)} />
                        </View>
                        {tobeowner !== userContext.user.tobeowner &&
                        <View style={[styles.itemLeft,{marginTop: 10}]}>
                            <Button mode='contained' onPress={() => submitTobeOwnerUpdate()}>Go Update</Button>
                            <Button mode='contained' style={{marginLeft: 10}} onPress={()=> updateTobeOwnerReset()}>Reset</Button>
                        </View>
                        } 
                        <View>
                            <Text style={{color:'red'}}>{tobeownererr}</Text>
                        </View>
                        </>
                        }
                        <Divider />
                    </View>
                    }
                    <View style={styles.viewItem}>
                        <Text>User Type: {getUserTypeDescr(userContext.user.usertype as number)}</Text>
                        <Divider />
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