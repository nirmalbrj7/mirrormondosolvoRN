import React from "react";
import { View, StyleSheet, Text,Modal,Image } from "react-native";
import { Button,CheckBox, FormLabel,FormValidationMessage } from "react-native-elements";
import ValueComponent from "../sharedComponents/Value";
import DeviceInfo from "react-native-device-info";

import Icons from "react-native-vector-icons/FontAwesome";



import SignatureCapture from "react-native-signature-capture";
import styles from "./styles";

const isTablet = DeviceInfo.isTablet();

export default class Signature extends ValueComponent {
  constructor(props) {
    super(props);

    this.getInitialValue = this.getInitialValue.bind(this);
      this.getElements = this.getElements.bind(this);
       //this.onChangeItems = this.onChangeItems.bind(this);
  
    this.toggleSignaturePad = this.toggleSignaturePad.bind(this);
    this.willReceiveProps = this.willReceiveProps.bind(this);
    this.saveSignature = this.saveSignature.bind(this);
    this.clearSignature = this.clearSignature.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.getElements = this.getElements.bind(this);
    this.signature = null;
  }

  getInitialValue() {
    return {};
  }

  willReceiveProps(nextProps) {
    if (!this.signature) {
      return;
    }
    if (this.props.value !== nextProps.value) {
      this.signature.fromDataURL(nextProps.value);
    }
  }

  onEnd(image) {
    if (!image || !image.encoded) {
      return;
    }
    const signature = `data:image/png;base64,${image.encoded}`;
    this.setValue(signature);
    this.toggleSignaturePad();
  }

  toggleSignaturePad() {
    this.setState({
      showSignaturePad: !this.state.showSignaturePad
    });
  }

  saveSignature() {
    this.signature.saveImage();
  }

  clearSignature() {
    this.signature.resetImage();
    this.setValue(null);
  }

  
  

  
  getElements() {
    const { component } = this.props;
    const requiredInline = (
      <Text>
        {!component.label && component.validate && component.validate.required
          ? "*"
          : ""}
      </Text>
    );
    const data = this.state.value || {};
    const error = this.state.isPristine || data.isValid ? false : true;
   
    const errorText = error ? (<FormValidationMessage>{data.errorMessage}</FormValidationMessage>) : null;

    if (this.props.readOnly) {
      const image =
        typeof this.state.value === "object"
          ? this.state.value.item
          : this.state.value;
      return (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: image }}
            style={styles.signature}
            resizeMode={"stretch"}
          />
        </View>
      );
    }
    return (
      <View style={styles.signatureWrapper}>
       
        { component.validate.required?<Icons name="asterisk" size={12} color="red" />:null}
     
        {errorText}
        {this.state.value && this.state.value.item ? (
          <View style={styles.imageWrapper}>
            <Image
              style={styles.signature}
              source={{ uri: this.state.value.item }}
              resizeMode={"stretch"}
            />
          </View>
        ) : null}

        <Button
          title={`Tap to ${
            this.state.value && this.state.value.item ? "change" : "sign"
          }`}
          buttonStyle={styles.signatureButton}
          onPress={this.toggleSignaturePad}
          backgroundColor={"transparent"}
          color={this.props.colors.primary1Color}
        />

        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.showSignaturePad}
          onRequestClose={this.toggleSignaturePad}
          presentationStyle={"formSheet"}
        >
          <View style={styles.signaturePadWrapper}>
            {isTablet && (
              <View style={styles.buttonWrapper}>
                <Button
                  title={"Clear"}
                  onPress={this.clearSignature}
                  color={this.props.colors.primary1Color}
                  backgroundColor={"transparent"}
                />
                <Button
                  title={"Save Signature"}
                  onPress={this.saveSignature}
                  color={this.props.colors.primary1Color}
                  backgroundColor={"transparent"}
                />
              </View>
            )}
            <SignatureCapture
              style={[
                styles.signaturePad,
                {
                  backgroundColor: component.backgroundColor
                }
              ]}
              ref={ref => {
                this.signature = ref;
              }}
              onSaveEvent={this.onEnd}
              saveImageFileInExtStorage={false}
              showNativeButtons={!isTablet ? true : false}
              rotateClockwise={!isTablet}
              minStrokeWidth={2}
              maxStrokeWidth={8}
              //viewMode={isTablet ? 'portrait' : 'landscape'}

              viewMode="portrait"
            />
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>{component.footer}</Text>
              <Button
                title={"Cancel"}
                onPress={this.toggleSignaturePad}
                color={this.props.colors.primary1Color}
                backgroundColor={"transparent"}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }


}
