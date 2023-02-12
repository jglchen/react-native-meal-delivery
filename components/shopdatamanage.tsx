import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import useSWR from 'swr';
import { View } from 'react-native';
import { UserContext } from '../components/Context';
import MealManage from './mealmanage';
import ShopOrderRecords from './shoporderrecords';
import BlockedUsers from './blockedusers';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, MealDataType, ShopClientsElm} from '../lib/types';
import { pageSizeClients } from '../lib/utils';

interface PropsType {
    shopId: string;
    manageContent: string;
    updateBlockUsers: (users: string[]) => void;
    initInPost: () => void;
    stopInPost: () => void;
}

export default function ShopDataManage({shopId, manageContent, updateBlockUsers, initInPost, stopInPost}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const fetcher = async (url: string) => { 
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        return axios.get(url, { headers: headers }).then(res => res.data)
    };
    const [clients, setClients] = useState<ShopClientsElm[]>([]);
    const [blockedClients, setBlockedClients] = useState<ShopClientsElm[]>([]);
    const [orderByStr, setOrderByStr] = useState('count');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageIndexClients, setPageIndexClients] = useState(0);
    const { data: shopData, mutate: shopMutate } = useSWR(`${DOMAIN_URL}/api/getshopdetail/${shopId}`, fetcher);
    const { data: mealMenu, mutate: menuMutate } = useSWR(`${DOMAIN_URL}/api/getmealmenu/${shopId}?page=${pageIndex}`, fetcher);

    useEffect(() => {
        if (shopData){
            const blockusers = shopData.blockusers || [];
            updateBlockUsers(blockusers);
            fetchClients(orderByStr, pageIndexClients, blockusers);         
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[userContext, shopData]);

    async function fetchClients(odrBy: string, pIndex: number, blockusers?: string[]){
        if (pIndex === 0 && clients.length > 0 && clients.length < pageSizeClients){
            setClients(prevState => {
                const currState = prevState.slice();
                if (odrBy === 'cancel'){
                    currState.sort((a: ShopClientsElm, b: ShopClientsElm) => {
                        if (a.cancel > b.cancel){
                            return -1;
                         }else if (a.cancel < b.cancel){
                             return 1;
                         }else{
                             if (a.count > b.count){
                                 return 1;
                             }else if (a.count < b.count){
                                 return -1;
                             }else{
                                 return 0;
                             }
                         }
                    });
                }else{
                    currState.sort((a: ShopClientsElm, b: ShopClientsElm) => {
                        if (a.count > b.count){
                           return -1;
                        }else if (a.count < b.count){
                            return 1;
                        }else{
                            if (a.cancel > b.cancel){
                                return 1;
                            }else if (a.cancel < b.cancel){
                                return -1;
                            }else{
                                return 0;
                            }
                        }
                    });
                }
                return currState;
            });
            return;
        }
        
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        try {
            const { data } = await axios.get(`${DOMAIN_URL}/api/getshopclients`, { params: { shopId, orderByStr: odrBy, page: pIndex }, headers: headers });
            setClients(data);
            if (typeof blockusers === 'undefined'){
               return;
            }
            let blockClients: ShopClientsElm[] = [];
            for (let elm of data){
                if (blockusers.includes(elm.id)){
                    blockClients.push(elm);
                }
            }
            const blockusersReg = blockusers.filter(item => {
               const elm = blockClients.find(itm => itm.id === item);
               return !elm;
            });
            setBlockedClients(blockClients);
            if (blockusersReg.length === 0){
               return;
            }
            
            const { data: clientsData } = await axios.get(`${DOMAIN_URL}/api/getshopclientsbyids`, { params: { shopId: shopData.id, clientIdStr: blockusersReg.join()}, headers: headers });
            blockClients = blockClients.concat(clientsData);
            setBlockedClients(blockClients);
        }catch(e){
            //----
        }
    }

    function updateMenu(menu?: MealDataType[]){
        if (typeof menu === 'undefined'){
           menuMutate();
        }
        menuMutate(menu);
    }
 
    function updatePage(pIndex: number){
        setPageIndex(pIndex); 
    }
 
    function updateOrderStr(str: string){
        setOrderByStr(str);
    }
 
    function updatePageClients(pIndex: number){
        setPageIndexClients(pIndex);
    }
 
    function updateBlockedClients(blockClients: ShopClientsElm[]){
        setBlockedClients(blockClients);
    }
 
    function increaseBlockedClients(userElm: ShopClientsElm){
        const blockClients = blockedClients.slice();
        blockClients.push(userElm);
        setBlockedClients(blockClients);
    }    
 
    function removeBlockedClients(userElm: ShopClientsElm){
        const blockClients = blockedClients.slice().filter(item => item.id !== userElm.id);
        setBlockedClients(blockClients);
    }    

    return (userContext &&
        <View style={{marginTop: 5}}>
            {(shopData && manageContent === 'meal') &&
                <MealManage 
                    shopData={shopData} 
                    shopMutate={shopMutate}
                    mealMenu={mealMenu}
                    updateMenu={updateMenu}
                    pageIndex={pageIndex}
                    updatePage={updatePage}
                    initInPost={initInPost}
                    stopInPost={stopInPost}
                    />
            }
            {(shopId && manageContent === 'order') &&
              <ShopOrderRecords 
                  shopData={shopData} 
                  shopMutate={shopMutate}
                  clients={clients}
                  fetchClients={fetchClients}
                  orderByStr={orderByStr}
                  updateOrderStr={updateOrderStr}
                  pageIndexClients={pageIndexClients}
                  updatePageClients={updatePageClients}
                  increaseBlockedClients={increaseBlockedClients}
                  removeBlockedClients={removeBlockedClients}
                  initInPost={initInPost}
                  stopInPost={stopInPost}
                  />
            }
            {(shopId && manageContent === 'blockusers') &&
              <BlockedUsers 
                  shopData={shopData} 
                  shopMutate={shopMutate}
                  blockClients={blockedClients}
                  updateBlockedClients={updateBlockedClients}
                  initInPost={initInPost}
                  stopInPost={stopInPost}
                  />
            }
        </View>
    );
}    