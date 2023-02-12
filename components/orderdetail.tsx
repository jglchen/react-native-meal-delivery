import React, { useContext } from 'react';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform,
         View, 
         Text,
         ScrollView
} from 'react-native';
import { DataTable, Button, TextInput } from 'react-native-paper';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import {UserContextType, MealOrderElm, MealOrderType} from '../lib/types';
import { orderStatusDescr } from '../lib/utils';

interface PropsType {
    userCategory: string;
    mealOrder: MealOrderType;
    closeModal: () => void;
}

export default function OrderDetail({userCategory, mealOrder, closeModal}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    let headTitle = `Order Details To ${mealOrder.shopName}`;
    if (userCategory === 'owner'){
        headTitle = `${mealOrder.userName}'s Order Details`; 
    }
    
    return (userContext &&
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView  
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}>
                <ScrollView style={{paddingHorizontal: 5}}>
                    <View style={[styles.itemCenter, styles.listItem]}>
                        <Text style={styles.headingText}>{headTitle}</Text>
                    </View>       
                    <View style={[styles.itemRight, styles.listItem]}>
                        <Button mode="outlined" onPress={() => closeModal()}>Close</Button>
                    </View> 
                    
                    <View style={styles.listItem}>
                    <DataTable style={{paddingHorizontal: 0}}>                    
                        <DataTable.Header>
                            <DataTable.Title>Meal</DataTable.Title>
                            <DataTable.Title numeric>Unit Price</DataTable.Title>
                            <DataTable.Title numeric>Quantity</DataTable.Title>
                            <DataTable.Title numeric>Total</DataTable.Title>
                        </DataTable.Header> 
                        {mealOrder.orderList.map((item: MealOrderElm, idx: number) => 
                        <DataTable.Row key={item.id}>
                            <DataTable.Cell>
                                <View style={styles.itemLeft}>
                                    <Text>{item.mealname}</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${item.unitprice}`}</DataTable.Cell>
                            <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                            <DataTable.Cell numeric>{`$${item.unitprice*(item.quantity as number)}`}</DataTable.Cell>
                        </DataTable.Row>   
                        )}
                        <DataTable.Row>
                            <DataTable.Cell textStyle={{fontWeight: 'bold'}}>
                                <View style={styles.itemLeft}>
                                    <Text style={{fontWeight: 'bold'}}>Sum</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${mealOrder.sum}`}</DataTable.Cell>                            
                        </DataTable.Row>   
                        <DataTable.Row>
                            <DataTable.Cell>
                                <View style={styles.itemLeft}>
                                    <Text style={{fontWeight: 'bold'}}>Tax</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${mealOrder.tax}`}</DataTable.Cell>                            
                        </DataTable.Row>  
                        <DataTable.Row>
                            <DataTable.Cell>
                                <View>
                                    <Text style={{fontWeight: 'bold'}}>Total Amount</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell> </DataTable.Cell>
                            <DataTable.Cell numeric>{`$${(mealOrder.sum+mealOrder.tax).toFixed(2)}`}</DataTable.Cell>                            
                        </DataTable.Row>  
                    </DataTable>
                    </View>

                    <View style={{marginTop: 10}}>
                        <Text>Order Status:</Text>
                    </View>
                    <View style={styles.listItem}>
                    <DataTable style={{paddingHorizontal: 0}}>                    
                        <DataTable.Header>
                            <DataTable.Title>Status</DataTable.Title>
                            <DataTable.Title>Time</DataTable.Title>
                        </DataTable.Header> 
                        {mealOrder.statushistory.map((item: string, idx: number) => {
                            if (idx === 0 || (idx === 1 && mealOrder.orderstatus == 1)){
                                return (
                                    <DataTable.Row key={idx}>
                                        <DataTable.Cell>{orderStatusDescr[idx]}</DataTable.Cell>
                                        <DataTable.Cell>{(new Date(item)).toLocaleString()}</DataTable.Cell>
                                    </DataTable.Row>  
                                );
                            }
                            return (
                                <DataTable.Row key={idx}>
                                    <DataTable.Cell>{orderStatusDescr[idx+1]}</DataTable.Cell>
                                    <DataTable.Cell>{(new Date(item)).toLocaleString()}</DataTable.Cell>
                                </DataTable.Row>  
                            );
                        })} 
                    </DataTable>
                    </View>

                    {userCategory === 'owner' &&
                    <>
                    <View style={{marginTop: 10}}>
                        <Text>Delivering Address:</Text>
                    </View>
                    <View style={styles.listItem}>
                        <TextInput 
                            value={mealOrder.address}
                            disabled={true}
                            multiline={true}
                            />
                    </View>
                    </>
                    }
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}    