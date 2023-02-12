import React, { useState, useContext, Fragment } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import useSWR from 'swr';
import { View, Text, Alert } from 'react-native';
import { DataTable, Button, TextInput, Divider, ActivityIndicator, Colors } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import Modal from './modal';
import UserDetail from './userdetail';
import DisplayImage from './displayimage';
import { DOMAIN_URL } from '../lib/constants';
import { UserContextType, ShopRecord } from '../lib/types';
import { pageSizeShops } from '../lib/utils';

export default function ShopsSetOnBoard(){
    const userContext: UserContextType = useContext(UserContext);
    const fetcher = async (url: string) => { 
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        return axios.get(url, { headers: headers }).then(res => res.data)
    };
    const [pageIndex, setPageIndex] = useState(0);
    const [reviewIndex, setReviewIndex] = useState(-1);
    const [shopOnboardErr, setShopOnboardErr] = useState('');
    const [ownerId, setOwnerId] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [inPost, setInPost] = useState(false);
    const { data: shopsData, mutate: shopsMutate } = useSWR(`${DOMAIN_URL}/api/getpotentialshops?page=${pageIndex}`, fetcher);

    function confirmShopOnboard(item: ShopRecord){
        Alert.alert(
            "Set Restaurant On Board",
            `Do you want to set ${item.shopname} onboard?`,
            [
              {
                text: "Cancel",
                onPress: () => console.log("Cancel"),
                style: "cancel"
              },
              { text: "OK", onPress: () => setShopOnboard(item) }
            ]
        );

    }

    async function setShopOnboard(item: ShopRecord){
        setShopOnboardErr('');
        setInPost(true);
        try {
            const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
            const {data} = await axios.put(`${DOMAIN_URL}/api/setshoponboard`, item, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setShopOnboardErr("No authorization to update");
                return;
            }
            setReviewIndex(-1);
            const shopsArr = shopsData.slice().filter((itm: ShopRecord) => itm.id !== item.id);
            shopsMutate(shopsArr);
        }catch(e){
            setInPost(false);
            setShopOnboardErr("Failed to set this restaurant onboard.");
        }
    }
    
    function closeModal(){
        setShowModal(false);
    }
 
    return (userContext &&
        <View>
            {!shopsData &&
            <View>
                <Text style={[styles.headingText,{fontWeight: 'bold'}]}>Please wait. Data is loading....</Text>
            </View>           
            }
            {shopsData &&
            <>
            <DataTable>
                <DataTable.Header>
                    <DataTable.Title>Restaurant</DataTable.Title>
                    <DataTable.Title>Food Supply</DataTable.Title>
                    <DataTable.Title numeric>Action</DataTable.Title>
                </DataTable.Header>
                {shopsData.map((item: ShopRecord, idx: number) => 
                <Fragment key={item.id}>
                <DataTable.Row>
                    <DataTable.Cell>{item.shopname}</DataTable.Cell>
                    <DataTable.Cell>
                        <TextInput
                            mode='flat'
                            disabled={true}
                            multiline={true}
                            value={item.foodsupply}
                            dense={true}
                            />
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                    {reviewIndex !== idx &&
                        <Button 
                            mode='contained'
                            onPress={() => {setShopOnboardErr('');setReviewIndex(idx);}}
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
                    <View style={styles.itemLeft}>
                        <DisplayImage
                            filename={item.profileimage}
                            style={{width: 100, height: 100}}
                            />
                        <View style={{marginLeft: 10}}>
                            <View>
                                <Text>Name: {item.shopname}</Text>
                            </View>
                            <View style={styles.itemLeft}>
                                <Text>Owner: </Text>
                                <Button mode='text' uppercase={false} onPress={() => {setOwnerId(item.owner.id); setShowModal(true); return false;}}>{item.owner.name}</Button>
                            </View>
                            <View>
                                <Text>Food Supply:</Text>
                                <TextInput
                                    mode='flat'
                                    disabled={true}
                                    multiline={true}
                                    value={item.foodsupply}
                                    dense={true}
                                    />
                            </View>
                            <View>
                                <Button mode='contained' onPress={() => confirmShopOnboard(item)}>
                                    Set This Restaurant Onboard
                                </Button>                               
                            </View>
                        </View> 
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
            {pageSizeShops === shopsData.length &&
                <Button mode='outlined' onPress={() => setPageIndex(pageIndex + 1)}>Next  &rarr;</Button>
            }
            </View>
            </>
            }
            <Modal
                isVisible={showModal}
                >
                <UserDetail userId={ownerId} closeModal={closeModal} />
            </Modal>
            {inPost &&
                <View style={styles.loading}>
                    <ActivityIndicator size="large" animating={true} color={Colors.white} />
                </View>
            }
        </View>
    );
}    
