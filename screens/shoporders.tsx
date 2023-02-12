import React, {useState, useEffect, useContext} from 'react';
import { SafeAreaView, 
         View, 
         Text
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ActivityIndicator, Colors  } from 'react-native-paper';
import SelectDropdown from "react-native-select-dropdown";
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import OrderManage from '../components/ordermanage';
import {UserContextType, ShopBrief} from '../lib/types';

interface PropsType {
  navigation: any
}

export default function ShopOrders({ navigation }: PropsType) {
    const userContext: UserContextType = useContext(UserContext);
    const [shopArr, setShopArr] = useState<ShopBrief[]>([]);
    const [shopId, setShopId] = useState('');
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

    function initInPost(){
        setInPost(true);
    }
    
    function stopInPost(){
        setInPost(false);
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
                {shopId && 
                <OrderManage 
                  shopId={shopId} 
                  initInPost={initInPost}
                  stopInPost={stopInPost}
                  />
                }
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