import React, {useState, useRef, useContext} from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, 
         Platform,
         View, 
         Text,
         Image
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, TextInput, ActivityIndicator, Colors } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import ext2mime from 'ext2mime';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, ImgDimensionType } from '../lib/types';
import { maxImageWidth } from '../lib/utils';

interface PropsType {
    closeModal: () => void;
}

function ShopAdd({closeModal}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [shopName, setShopName] = useState('');
    const shopNameEl = useRef(null);
    const [foodSupply, setFoodSupply] = useState('');
    const foodSupplyEl = useRef(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [imgDimension, setImgDimension] = useState<ImgDimensionType | null>(null);
    const [displayWidth, setDisplayWidth] = useState(0);
    const inputImageRef = useRef(null);
    const [shopnameerr, setShopNameErr] = useState('');
    const [foodsupplyerr, setFoodSupplyErr] = useState('');
    const [selectedimgerr, setSelectImgErr] = useState('');
    const [imgWidth, setImgWidth] = useState(0);
    const [inPost, setInPost] = useState(false);

    const onLayout=(event: any)=> {
        const {x, y, height, width} = event.nativeEvent.layout;
        setDisplayWidth(width);
    }

    function resetImageErrMsg(){
        setSelectedImage('');
        setImgDimension(null);
        setSelectImgErr('');
    }

    const pickImage = async () => {
        resetImageErrMsg();
        
        // No permissions request is necessary for launching the image library
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
          allowsEditing:true
        });
    
        if (!result.canceled && result.assets) {
          setSelectedImage(result.assets[0].uri);
          setImgDimension({width: result.assets[0].width, height: result.assets[0].height});
          let imgSizeRemark = `width: ${result.assets[0].width}, height: ${result.assets[0].height}.`;
          if (result.assets[0].width > maxImageWidth){
             imgSizeRemark += ` The app will not accept images with a width larger than ${maxImageWidth}px, please resize the image before uploading.`;
          }
          setSelectImgErr(imgSizeRemark);
        }
        /*
        if (!result.cancelled) {
            setSelectedImage(result.uri);
            setImgDimension({width: result.width, height: result.height});
            let imgSizeRemark = `width: ${result.width}, height: ${result.height}.`;
            if (result.width > maxImageWidth){
               imgSizeRemark += ` The app will not accept images with a width larger than ${maxImageWidth}px, please resize the image before uploading.`;
            }
            setSelectImgErr(imgSizeRemark);
        }*/
      };
 
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
        //Check if width of image to be uploaded is larger than maxImageWidth
        if (imgDimension?.width as number >  maxImageWidth){
            return;
        }
  
        const formData = new FormData();
  
        // Add images to FormData
        if (selectedImage) {
            const filename = selectedImage.split('/').pop();
            const mimeType = ext2mime(filename!.substring(filename!.lastIndexOf('.')));
            const localUri = Platform.OS === 'ios' ? selectedImage.replace('file://', '') : selectedImage;
            formData.append('file', JSON.parse(JSON.stringify({ uri: localUri, name: filename, type: mimeType})));
        }
         
        formData.append('shopname', shopName);
        formData.append('foodsupply', foodSupply);
  
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}`, 'content-type': 'multipart/form-data' };
        setInPost(true);
        try {
           
            // Send request to our api route
            const { data } = await axios.post(`${DOMAIN_URL}/api/addshop`, formData, { headers: headers });
            setInPost(false);
            if (data.no_authorization){
                setShopNameErr("No authorization to upload data.");
                (shopNameEl.current as any).focus();
                return;
            }
            //Further process on data returned-----//
            let {shopid} = userContext.user;
            shopid = shopid || [];
            shopid.push({id: data.id, shopname: data.shopname, onboard: false});
            const user = {...userContext.user, shopid};
            userContext.user = user;
            await AsyncStorage.setItem('user', JSON.stringify(user));
            closeModal();
         }catch(err){
           setInPost(false);
           setShopNameErr('Failed to upload data to database!');
         }
    }
  
    function resetForm(){
        setShopName('');
        setShopNameErr('');
        setFoodSupply('');
        setFoodSupplyErr('');
        
        setSelectedImage('');
        setImgDimension(null);
        setSelectImgErr('');
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAwareScrollView
                resetScrollToCoords={{ x: 0, y: 0 }}
                keyboardShouldPersistTaps='handled'
                scrollEnabled={true}
                style={{paddingHorizontal: 5}}
                >
                <View style={[styles.itemCenter, styles.listItem]}>
                    <Text style={styles.headingText}> Add My Restaurant</Text>
                </View>       
                <View style={[styles.itemRight, styles.listItem]} onLayout={onLayout}>
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
                <View style={styles.listItem}>
                    <Button
                        mode='contained'
                        icon='image'
                        onPress={() => pickImage()}
                        style={{backgroundColor: 'green'}}
                        >Upload Restaurant Profile
                    </Button>
                </View>
                {(selectedImage && imgDimension) &&
                <View style={styles.listItem}>
                    <Image source={{uri: selectedImage}} style={{width: displayWidth, height: Math.round((imgDimension.height/imgDimension.width) * displayWidth)}} />
                    <View>
                        <Text style={{color:'red'}}>{selectedimgerr}</Text>
                    </View> 
                </View>
                }
                <View style={[styles.listItem, styles.itemLeft]}>
                    <Button
                        mode='contained'
                        onPress={() => submitFormData()}
                        >Add Restaurant
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

export default ShopAdd;

