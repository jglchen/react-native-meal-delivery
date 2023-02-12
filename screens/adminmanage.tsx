import React, {useState, useEffect} from 'react';
import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform,
         ScrollView
} from 'react-native';
import { Button } from 'react-native-paper';
import { styles } from '../styles/css';
import UsersToOwners from '../components/userstoowners';
import ShopsSetOnBoard from '../components/shopsetonboard';

interface PropsType {
    navigation: any
}
  
export default function AdminManage({ navigation }: PropsType) {
    const [pageLoad, setPageLoad] = useState('userstoowners');
    
    useEffect(() => {
        if (pageLoad === 'userstoowners'){
            navigation.setOptions({ title: 'Set Selected Users to Restaurant Owners' });
        }else if (pageLoad === 'shopsetonboard'){
            navigation.setOptions({ title: 'Set Newly Added Restaurants Onboard' });
        }
    },[pageLoad])
    
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView  
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <ScrollView horizontal={true} style={styles.listItem}>
                        {pageLoad === 'userstoowners' &&
                        <>
                        <Button 
                            mode='outlined' 
                            disabled={true}
                            >Set Users To Owners
                        </Button>
                        <Button 
                            mode='outlined'
                            style={{marginLeft: 10}}
                            onPress={() => setPageLoad('shopsetonboard')} 
                           >Set Shops On Board
                        </Button>
                        </>
                        }
                        {pageLoad === 'shopsetonboard' &&
                        <>
                        <Button 
                            mode='outlined' 
                            onPress={() => setPageLoad('userstoowners')}
                            >Set Users To Owners
                        </Button>
                        <Button 
                            mode='outlined'
                            style={{marginLeft: 10}}
                            disabled={true}
                           >Set Shops On Board
                        </Button>
                        </>
                        }
                    </ScrollView>
                    {pageLoad === 'userstoowners' &&
                        <UsersToOwners />
                    }
                    {pageLoad === 'shopsetonboard' &&
                        <ShopsSetOnBoard />
                    }
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}    