import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform,
         View, 
         Text,
         Animated,
         ScrollView,
         Image,
         TouchableHighlight
} from 'react-native';
import { Button, Switch, ActivityIndicator, Colors } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import ext2mime from 'ext2mime';
import { styles } from '../styles/css';
import { UserContext } from '../components/Context';
import DisplayImage from './displayimage';
import { DOMAIN_URL } from '../lib/constants';
import {UserContextType, ShopDataType, ImgDimensionType} from '../lib/types';
import { maxImageWidth, pageSizeImages } from '../lib/utils';

interface PropsType {
    shopData: ShopDataType;
    updateShopData: (shop: ShopDataType) => void;
    closeModal: () => void;
}

export default function ShopProfileUpdate({shopData, updateShopData, closeModal}: PropsType){
    const userContext: UserContextType = useContext(UserContext);
    const [selectUploaded, setSelectUploaded] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [imgDimension, setImgDimension] = useState<ImgDimensionType | null>(null);
    const [displayWidth, setDisplayWidth] = useState(0);
    const [selectedimgerr, setSelectImgErr] = useState('');
    const [checkedimgerr, setCheckImgErr] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [checkedImage, setCheckedImage] = useState('');
    const [imageList, setImageList] = useState<string[]>([]);
    const [imageFetched, setImageFetched] = useState(false);
    const uploadedImageRef = useRef(null);
    const [inPost, setInPost] = useState(false);
    const scrollX = useRef(new Animated.Value(0)).current;
    const position = scrollX.interpolate({
        inputRange: [0, imageList.length > 0 ? displayWidth * (imageList.length - 1): 0],
        outputRange: [0, imageList.length > 0 ? (imageList.length - 1): 0],
        extrapolate: 'clamp' 
    });
      
    useEffect(() => {
        if (selectUploaded && imageList.length === 0 && userContext){
           fetchImageData(pageIndex);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[selectUploaded,userContext]);
    
    async function fetchImageData(pageIdx: number){
        if (pageIdx*pageSizeImages < imageList.length ){
           return;
        }
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        try {
           const { data } = await axios.get(`${DOMAIN_URL}/api/getuseruploadedimages?page=${pageIdx}`, { headers: headers });
           setImageList(prevState => prevState.concat(data));
           setImageFetched(true);
        }catch(e){
           //console.log(e);
        }
    }
    
    const onLayout=(event: any)=> {
        const {x, y, height, width} = event.nativeEvent.layout;
        setDisplayWidth(width);
    }

    async function pickImageFromDevice(){
        setSelectedImage('');
        setImgDimension(null);
        setSelectImgErr('');

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
    }

    async function submitFormData() {
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
  
        formData.append('shopid', shopData.id);
  
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}`, 'content-type': 'multipart/form-data' };
        setInPost(true);
        try {
           // Send request to our api route
           const { data } = await axios.post(`${DOMAIN_URL}/api/updateshopprofile`, formData, { headers: headers });
           setInPost(false);
           if (data.no_authorization){
              setSelectImgErr("No authorization to upload data.");
              return;
           }
           const shop = {...shopData, profileimage: data.profileimage};
           updateShopData(shop);
           closeModal();
        }catch(err){
           setInPost(false);
           setSelectImgErr('Failed to upload data to database!');
         }
    }
  
    function resetForm(){
           setSelectedImage('');
           setImgDimension(null);
           setSelectImgErr('');
    }

    async function submitCheckedImage() {
        setCheckImgErr('');
        
        //Scroll to the Selected Image
        const selectedPos = imageList.findIndex(item => item === checkedImage);
        if (selectedPos >  -1){
            (uploadedImageRef.current as any).scrollTo({x: displayWidth * selectedPos, y: 0, animated: true});
        }
        
        const headers = { authorization: `Bearer ${await SecureStore.getItemAsync('token')}` };
        const updateObj = {profileimage: checkedImage};
        setInPost(true);
        try {
           // Send request to our api route
           const { data } = await axios.post(`${DOMAIN_URL}/api/editshop`, {shopId: shopData.id, ...updateObj}, { headers: headers });
           setInPost(false);
           if (data.no_authorization){
              setCheckImgErr("No authorization to upload data.");
              return;
           }
           updateShopData({...shopData, ...updateObj})
           closeModal();
        }catch(err){
           setInPost(false);
           setCheckImgErr('Failed to upload data to database!');
        }
    }

    return (userContext &&
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView  
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}>
                <ScrollView style={{paddingHorizontal: 5}}>
                    <View style={[styles.itemCenter, styles.listItem]}>
                        <Text style={styles.headingText}>{`Profile Update for ${shopData.shopname}`}</Text>
                    </View>       
                    <View style={[styles.itemRight, styles.listItem]} onLayout={onLayout}>
                        <Button mode="outlined" onPress={() => closeModal()}>Close</Button>
                    </View>
                    <View style={[styles.itemLeft, styles.listItem]}>
                        <Switch value={selectUploaded} onValueChange={() => setSelectUploaded(prevState => !prevState)} />
                        <Button
                            mode='text'
                            uppercase={false} 
                            onPress={() => setSelectUploaded(prevState => !prevState)}
                            labelStyle={{color: 'black', fontSize: 16}}
                            style={{marginLeft: 0}}
                            >
                            Select from uploaded images
                        </Button>
                    </View>                   
                    {selectUploaded &&
                    <>
                    {imageList.length > 0 &&
                    <>
                    <View style={styles.listItem}>     
                        <Animated.ScrollView
                            horizontal={true}
                            pagingEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                { useNativeDriver: true },
                            )} 
                            scrollEventThrottle={16}
                            ref={uploadedImageRef}
                            >
                            {imageList.map((item, i) => 
                            <TouchableHighlight
                                key={i} 
                                style={{borderColor:checkedImage === item ? 'red': 'white', borderWidth: 5}}
                                onPress={() => {if(checkedImage !== item){setCheckedImage(item)}}}
                                >
                                <DisplayImage
                                    style={{ width: displayWidth - 10, height: displayWidth*0.66 - 10 }}
                                    filename={item}
                                />
                            </TouchableHighlight>
                            )}
                            </Animated.ScrollView>     
                    </View>
                    <View style={[styles.listItem, styles.itemCenter]}>
                    {imageList.map((_, i) => { 
                        const opacity = position.interpolate({
                            inputRange: [i - 1, i, i + 1],
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp' 
                        });
                        return (
                            <Animated.View 
                                key={i}
                                style={{ opacity, height: 5, width: 5, backgroundColor: '#aa6c39', margin: 2, borderRadius: 5 }}
                            />
                        );
                    })}
                    </View>
                    <View>
                        <Text style={{color: 'red'}}>{checkedimgerr}</Text>
                    </View>
                    {pageSizeImages*(pageIndex+1) === imageList.length &&
                    <View style={[styles.listItem, styles.itemLeft]}>     
                        <Button mode='outlined' onPress={() => {const pageIdx = pageIndex + 1; setPageIndex(pageIdx); fetchImageData(pageIdx);}}>Load More Images  &raquo;</Button>
                    </View>
                    }
                    {checkedImage &&
                    <View style={styles.listItem}>     
                       <Button mode='contained' onPress={() => submitCheckedImage()}>Set Selected Image As the Restaurant Profile</Button>
                    </View>
                    }
                    </> 
                    }
                    {imageList.length === 0 &&
                    <View>
                        {imageFetched &&
                        <Text style={styles.descrText}>You have no images uploaded</Text>
                        }
                        {!imageFetched &&
                         <Text style={styles.descrText}>Please wait...Data is loading.</Text>
                        }
                    </View>
                    } 
                    </>
                    }
                    {!selectUploaded &&
                    <>
                    <View style={styles.listItem}>
                        <Button
                            mode='contained'
                            icon='image'
                            style={{backgroundColor: 'green'}}
                            onPress={() => pickImageFromDevice()}
                            >Pick Profile From Device
                        </Button>
                    </View>
                    {(selectedImage && imgDimension) &&
                    <>
                    <View style={styles.listItem}>
                        <Image source={{uri: selectedImage}} style={{width: displayWidth, height: Math.round((imgDimension.height/imgDimension.width) * displayWidth)}} />
                        <View>
                            <Text style={{color:'red'}}>{selectedimgerr}</Text>
                        </View> 
                    </View>
                    <View style={[styles.listItem, styles.itemLeft]}>
                        <Button
                            mode='contained'
                            onPress={() => submitFormData()}
                            >Upload Profile
                        </Button>
                        <Button
                            mode='contained'
                            onPress={() => resetForm()}
                            style={{marginLeft: 10}}
                            >Reset
                        </Button>
                    </View>
                    </>
                    }
                    </>
                    }
                </ScrollView>
            </KeyboardAvoidingView>
            {inPost &&
                <View style={styles.loading}>
                    <ActivityIndicator size="large" animating={true} color={Colors.white} />
                </View>
            }
        </SafeAreaView>
    );

}    