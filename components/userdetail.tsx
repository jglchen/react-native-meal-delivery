import React, { useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import useSWR from 'swr';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform,
         View, 
         Text,
         ScrollView
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import { UserContextType } from '../lib/types';
import {  getUserTypeDescr } from '../lib/utils';

interface PropsType {
    userId: string;
    closeModal: () => void;
}

export default function UserDetail({userId, closeModal}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const fetcher = async (url: string) => { 
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        return axios.get(url, { headers: headers }).then(res => res.data)
    };
    const { data: userData, mutate: userMutate } = useSWR(`${DOMAIN_URL}/api/getuserdetail/${userId}`, fetcher);

    return (userContext &&
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView  
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}>
                <ScrollView style={{paddingHorizontal: 5}}>
                    <View style={[styles.itemCenter, styles.listItem]}>
                        <Text style={styles.headingText}>User Profile Detail</Text>
                    </View>       
                    <View style={[styles.itemRight, styles.listItem]}>
                        <Button mode="outlined" onPress={() => closeModal()}>Close</Button>
                    </View> 
                    {!userData &&
                    <View>
                        <Text style={[styles.headingText,{fontWeight: 'bold'}]}>Please wait. Data is loading....</Text>
                    </View>           
                    }
                    {userData &&
                    <>
                    <View style={styles.listItem}>
                        <Text>Name: {userData.name}</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text>Email: {userData.email}</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text>Phone: {userData.phone}</Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text>Address: </Text>
                        {userData.address &&
                        <TextInput
                            mode='flat'
                            disabled={true}
                            multiline={true}
                            value={userData.address}
                            dense={true}
                            />
                       }
                    </View>
                    <View style={styles.listItem}>
                        <Text>User Type: {getUserTypeDescr(userData.usertype)}</Text>
                    </View>
                    
                    <View style={styles.listItem}>
                        <Text>Join Date: {new Date(userData.created).toLocaleString()}</Text>
                    </View>
                    </>
                    }
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );


}    