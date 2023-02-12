import { SafeAreaView, 
         KeyboardAvoidingView, 
         Platform,
         View,
         Text,
         ScrollView
} from 'react-native';
import { styles } from '../styles/css';

interface PropsType {
    navigation: any
}
  
export default function AboutApp({ navigation }: PropsType) {

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView  
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}>
                <ScrollView style={styles.scrollView}>
                    <View style={styles.listItem}>
                        <Text style={styles.descrText}>
                        This is a semi-commercial meal-delivery app for demonstrations. Everybody can sign up as a regular consumer in this app.
                        If regular consumers want to list their restaurants in the app for delivery, any user can express their intent in the app.
                        The app administrator has the authority to approve the application. If the application is approved, the applicant will become a restaurant owner.
                        Restaurant owners can play dual roles as restaurant owners and as regular consumers. Restaurant owners can place orders as regular users to any restaurant except for the one they manage.
                        </Text>
                    </View>
                    <View style={styles.listItem}>
                        <Text style={styles.descrText}>
                        The key functionalities of this app are summarized as bolow:
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Everybody can sign up as a regular consumer in this app.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Registered consumers can apply as restaurant owners to list their restaurants in the app for delivery. The applications need approval by the app administrator.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Restaurant owners can play dual roles as restaurant owners and as regular consumers. Restaurant owners can place orders as regular users to any restaurant except for the one they manage.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Restaurant owners have the authority to list their restaurants in the app, which still need the app administrator’s approval to be officially on board.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Restaurant owners have the authority to add any meals to the restaurants they manage.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Restaurant owners can block users. The blocked users will not be able to follow the restaurants and place orders.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        An order should be placed for a single restaurant only.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Once a delivery order is placed, both the placing user and the restaurant owner can instantaneously follow the delivery status. The placing users can cancel the orders if the restaurant owner does not start processing.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Regular users can track down all their purchase order records.
                        </Text>
                    </View>
                    <View style={[{flexDirection: 'row'}, styles.listItem]}>
                        <Text style={styles.descrText}>{'\u2022'}</Text>
                        <Text style={[{flex: 1, paddingLeft: 5}, styles.descrText]}>
                        Restaurant owners can examine all the clients, which have placed orders at their restaurants, and their purchase order records.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

}    
