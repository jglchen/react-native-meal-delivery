import React, { useState, useContext, Fragment } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import useSWR from 'swr';
import { View, Text, Alert } from 'react-native';
import { DataTable, Button, TextInput, Divider, ActivityIndicator, Colors } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import { UserContextType, UserData } from '../lib/types';
import { pageSizeToOwners } from '../lib/utils';

export default function UsersToOwners(){
    const userContext: UserContextType = useContext(UserContext);
    const fetcher = async (url: string) => { 
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        return axios.get(url, { headers: headers }).then(res => res.data)
    };
    const [pageIndex, setPageIndex] = useState(0);
    const [reviewIndex, setReviewIndex] = useState(-1);
    const [toOwnerErr, setToOwnerErr] = useState('');
    const [inPost, setInPost] = useState(false);
    const { data: usersData, mutate: usersMutate } = useSWR(`${DOMAIN_URL}/api/getpotentialowners?page=${pageIndex}`, fetcher);

    function confirmUserToOwner(item: UserData){
        Alert.alert(
            "Set User To Owner",
            `Do you want to set ${item.name} as restaurant owner?`,
            [
              {
                text: "Cancel",
                onPress: () => console.log("Cancel"),
                style: "cancel"
              },
              { text: "OK", onPress: () => setUserToOwner(item) }
            ]
        );
    }

    async function setUserToOwner(item: UserData){
        setToOwnerErr('');
        setInPost(true);
        try {
            const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
            const {data} = await axios.put(`${DOMAIN_URL}/api/setusertoowner`, {id: item.id}, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setToOwnerErr("No authorization to update");
                return;
            }
            setReviewIndex(-1);
            const usersArr = usersData.slice().filter((itm: UserData) => itm.id !== item.id);
            usersMutate(usersArr);
        }catch(e){
            setInPost(false);
            setToOwnerErr("Failed to set this user as restaurant owner.");
        }
    }
  
    return (userContext &&
        <View>
            {!usersData &&
            <View>
                <Text style={[styles.headingText,{fontWeight: 'bold'}]}>Please wait. Data is loading....</Text>
            </View>           
            }
            {usersData &&       
            <>
            <DataTable>
                <DataTable.Header>
                    <DataTable.Title>Name</DataTable.Title>
                    <DataTable.Title>Email</DataTable.Title>
                    <DataTable.Title numeric>Action</DataTable.Title>
                </DataTable.Header>
                {usersData.map((item: UserData, idx: number) => 
                <Fragment key={item.id}>
                <DataTable.Row>
                    <DataTable.Cell>{item.name}</DataTable.Cell>
                    <DataTable.Cell>{item.email}</DataTable.Cell>
                    <DataTable.Cell numeric>
                    {reviewIndex !== idx &&
                        <Button 
                            mode='contained'
                            onPress={() => {setToOwnerErr('');setReviewIndex(idx);}}
                            >
                            Review
                        </Button>
                    }
                    {reviewIndex === idx &&
                        <Button 
                            mode='contained'
                            disabled={true}
                            >
                            Review
                        </Button>
                    }
                    </DataTable.Cell>
                </DataTable.Row>
                {reviewIndex === idx &&
                <View>
                    <View style={styles.viewItem}>
                        <Text>Name: {item.name}</Text>
                    </View>
                    <View style={styles.viewItem}>
                        <Text>Email: {item.email}</Text>
                    </View>
                    <View style={styles.viewItem}>
                        <Text>Phone: {item.phone}</Text>
                    </View>
                    <View style={styles.viewItem}>
                        <Text>Address:</Text>
                        <TextInput
                            mode='flat'
                            disabled={true}
                            dense={true}
                            value={item.address}
                            />
                    </View>
                    <View style={styles.viewItem}>
                        <Text>Join Date: {new Date(item.created).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.itemCenter, styles.viewItem]}>
                        <Button mode='contained' onPress={() => confirmUserToOwner(item)}>
                            Set This User as Shop Owner
                        </Button>                               
                    </View>
                    <View>
                        <Text style={{color: 'red'}}>{toOwnerErr}</Text>
                    </View>
                    <Divider />
                </View>
                }
                </Fragment>
                )}
            </DataTable>
            
            <View>
            {pageIndex > 0 && 
                <Button mode='outlined' onPress={() => setPageIndex(pageIndex - 1)}>&larr;  Previous</Button>
            }
            {pageSizeToOwners === usersData.length &&
                <Button mode='outlined' onPress={() => setPageIndex(pageIndex + 1)}>Next  &rarr;</Button>
            }
            </View>
            </>
            }
            {inPost &&
                <View style={styles.loading}>
                    <ActivityIndicator size="large" animating={true} color={Colors.white} />
                </View>
            }
        </View>
    );

}    