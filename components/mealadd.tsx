import React, { useState, useRef, useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
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
import {UserContextType, ImgDimensionType, MealDataType} from '../lib/types';
import { maxImageWidth } from '../lib/utils';

interface PropsType {
    shopId: string;
    shopName: string;
    updateMealMenu: (meal: MealDataType) => void;
    closeModal: () => void;
}

export default function MealAdd({shopId, shopName, updateMealMenu, closeModal}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [mealName, setMealName] = useState('');
    const mealNameEl = useRef(null);
    const [mealDescr, setMealDescr] = useState('');
    const mealDescrEl = useRef(null);
    const [mealPrice, setMealPrice] = useState('');
    const mealPriceEl = useRef(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [imgDimension, setImgDimension] = useState<ImgDimensionType | null>(null);
    const [displayWidth, setDisplayWidth] = useState(0);
    const inputImageRef = useRef(null);
    const [mealnameerr, setMealNameErr] = useState('');
    const [mealdescrerr, setMealDescrErr] = useState('');
    const [mealpriceerr, setMealPriceErr] = useState('');
    const [selectedimgerr, setSelectImgErr] = useState('');
    const [inPost, setInPost] = useState(false);

    const onLayout=(event: any)=> {
        const {x, y, height, width} = event.nativeEvent.layout;
        setDisplayWidth(width);
    }
    
    function handleMealPriceInput(text: string){
        const value = text.replace(/<\/?[^>]*>/g, "");
        if (isNaN(Number(value))){
           return;
        }
        setMealPrice(value);
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
    
        if (!result.cancelled) {
          setSelectedImage(result.uri);
          setImgDimension({width: result.width, height: result.height});
          let imgSizeRemark = `width: ${result.width}, height: ${result.height}.`;
          if (result.width > maxImageWidth){
             imgSizeRemark += ` The app will not accept images with a width larger than ${maxImageWidth}px, please resize the image before uploading.`;
          }
          setSelectImgErr(imgSizeRemark);
        }
    };
    
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
  
        formData.append('shopid', shopId);
        formData.append('mealname', mealName);
        formData.append('mealdescr', mealDescr);
        formData.append('unitprice', mealPrice);
  
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}`, 'content-type': 'multipart/form-data' };
        setInPost(true);
        try {
           // Send request to our api route
           const { data } = await axios.post(`${DOMAIN_URL}/api/addmeal`, formData, { headers: headers });
           setInPost(false);
           if (data.no_authorization){
              setMealNameErr("No authorization to upload data.");
              (mealNameEl.current as any).focus();
              return;
           }
           updateMealMenu(data);
           closeModal();
        }catch(err){
           setInPost(false);
           setMealNameErr('Failed to upload data to database!');
        }
    
    }
  
    function resetForm(){
        setMealName('');
        setMealNameErr('');
        setMealDescr('');
        setMealDescrErr('');
        setMealPrice('');
        setMealPriceErr('');
        
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
                    <Text style={styles.headingText}>{`Add Meal To ${shopName}`}</Text>
                </View>       
                <View style={[styles.itemRight, styles.listItem]} onLayout={onLayout}>
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
                <View style={styles.listItem}>
                    <Button
                        mode='contained'
                        icon='image'
                        onPress={() => pickImage()}
                        style={{backgroundColor: 'green'}}
                        >Upload Meal Profile
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
                        >Add Meal
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
