import React from "react";
import { StyleSheet, View } from "react-native";
import RNModal from "react-native-modal";

type ModalProps = {
  isVisible: boolean;
  children: React.ReactNode;
  [x: string]: any;
};

const Modal = ({
  isVisible = false,
  children,
  ...props
}: ModalProps) => {
  return (
    <RNModal
      isVisible={isVisible}
      animationInTiming={1000}
      animationOutTiming={1000}
      backdropTransitionInTiming={800}
      backdropTransitionOutTiming={800}
      {...props}>
      <View style={styles.container}>
        {children}
      </View>  
    </RNModal>
  );
};

const styles = StyleSheet.create({
    container: {
      backgroundColor: "#ffffff",
      borderRadius: 25,
      borderWidth: 1,
      borderColor: "#000",
      borderStyle: "solid",
      flex: 1,
    },
});
  
export default Modal;