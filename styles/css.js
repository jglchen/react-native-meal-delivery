import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
       flex: 1
    },
    mainContainer: {
       flex: 1, 
       justifyContent: 'center', 
       paddingBottom: 50, 
       paddingHorizontal: 5
    }, 
    scrollView: {
      paddingTop: 10,
      paddingHorizontal: 5
    },
    viewItem: {
      paddingVertical: 5,
    },
    listItem: {
      marginBottom: 10,
    },
    itemCenter: {
      flexDirection: 'row', 
      justifyContent: 'center', 
      alignItems: 'center'
    },
    itemLeft: {
      flexDirection: 'row', 
      justifyContent: 'flex-start', 
      alignItems: 'center'
    },
    itemRight: {
      flexDirection: 'row', 
      justifyContent: 'flex-end', 
      alignItems: 'center'
    },
    itemSpaceBetween: {
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center'
    },
    itemActivity: {
      backgroundColor: 'darkgreen',
      padding: 10,
      borderRadius: 5
    },
    textActivity: {
      color: 'white',
      fontSize: 18,
      lineHeight: 24     
    },
    spaceActivity: {
      height: 50,
    },
    titleText: {
      height: 32,
      fontSize: 22,
      fontWeight: '400'   
    },
    headingText: {
      fontSize: 18,
      lineHeight: 22,
      paddingVertical: 5
    }, 
    subjectText: {
      fontSize: 22,
      lineHeight: 36
    },
    shopNameText: {
      lineHeight: 28,
      fontSize: 20,
      fontWeight: 'bold'   
    },
    mealNameText: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: 'bold' 
    },
    descrText: {
      fontSize: 18,
      lineHeight: 24
    },
    loading: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      opacity: 0.5,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center'
    },
    
    dropdownBtnStyle: {
      width: "100%",
      height: 50,
      backgroundColor: "#FFF",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#444",
    },
    dropdownBtnTxtStyle: { color: "#444", textAlign: "left" },
    dropdownDropdownStyle: { backgroundColor: "#EFEFEF" },
    dropdownRowStyle: {
      backgroundColor: "#EFEFEF",
      borderBottomColor: "#C5C5C5",
    },
    dropdownRowTxtStyle: { color: "#444", textAlign: "left" },


});
