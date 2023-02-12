import React, {useState, useEffect} from 'react';
import { Image } from 'react-native';
import axios from 'axios';
import {Buffer} from 'buffer';
import ext2mime from 'ext2mime';
import { getImageById, replaceIntoImage } from '../lib/sql';
import { DOMAIN_URL } from '../lib/constants';

interface PropsType {
    filename: string;
    style: {
      width: number;
      height: number;
    }
}

export default function DisplayImage(props: PropsType) {
    const {filename, style} = props;
    const [base64, setBase64] = useState('');
    const [mimetype, setMimetype] = useState('');
    
    useEffect(() => {
        async function fetchImageBase64(filename: string){
            const { rows: { _array } } = await getImageById(filename);
            if ( _array.length > 0){
                setBase64(_array[0].base64);
                setMimetype(_array[0].mimetype);
                return;
            }

            try {
                const url = `${DOMAIN_URL}/images/${filename}`;
                const {data} = await axios.get(url, {responseType: 'arraybuffer'});
                const base64String = Buffer.from(data, 'binary').toString('base64');
                const mimeType = ext2mime(filename.substring(filename.lastIndexOf('.')));
                setBase64(base64String);
                setMimetype(mimeType);
                replaceIntoImage(filename, mimeType, base64String);
            }catch(err){
                const url = `${DOMAIN_URL}/api/getimagedata/${filename}`;
                const {data} = await axios.get(url);
                if (data.no_data){
                    return;
                }
                setBase64(data.base64);
                setMimetype(data.mimetype);
                replaceIntoImage(filename, data.mimetype, data.base64);
            }
        }
        fetchImageBase64(filename || 'meal-icon.png');

    },[filename]);

    if (!base64 || !mimetype){
        return (<></>);
    }
    
    return (
         <Image 
           style={style}
           source={{uri: `data:${mimetype};base64,${base64}`}}
           resizeMode='cover'
         />
    );
}
