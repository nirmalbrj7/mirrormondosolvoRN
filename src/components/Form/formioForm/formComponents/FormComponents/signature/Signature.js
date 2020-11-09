import React from 'react';
import { View, Image, Text, Modal,StyleSheet, Alert } from 'react-native';
import { Button, Icon } from 'react-native-elements/src/index';
import ValueComponent from '../sharedComponents/Value';
import SignatureCapture from 'react-native-signature-capture';
import DeviceInfo from 'react-native-device-info';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import styles from './styles';
const isTablet = DeviceInfo.isTablet();

export default class Signature extends ValueComponent {
  constructor(props) {
    super(props);
    this.toggleSignaturePad = this.toggleSignaturePad.bind(this);
    this.willReceiveProps = this.willReceiveProps.bind(this);
    this.saveSignature = this.saveSignature.bind(this);
    this.clearSignature = this.clearSignature.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.getElements = this.getElements.bind(this);
    this.signature = null;
  }

  componentDidMount() {
    if (!this.signature) {
      return;
    }
    if (this.state.value) {
      this.signature.fromDataURL(this.state.value);
    }
    else {
      this.signature.resetImage();
    }
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
    const multiStyles = StyleSheet.create({
      fieldWrapper: {
        flex: 1,
        padding: 15,
        backgroundColor:'#fff',
       // borderWidth:1,
       // borderColor:'#000',
        borderRadius:4,
        marginBottom:5,
        marginHorizontal:5,
        shadowColor: "#000",
shadowOffset: {
	width: 0,
	height: 2,
},
shadowOpacity: 0.25,
shadowRadius: 3.84,

elevation: 5,
      },
      //mainElement: this.elementLayout(this.props.component.labelPosition),
      /*labelWrapper: {
        flexDirection: 'row',
        marginTop:
          this.props.component.labelPosition === 'top' ||
            this.props.component.labelPosition === 'bottom'
            ? 0
            : 15,
        marginRight:
          this.props.component.labelPosition === 'left-left' ||
            this.props.component.labelPosition === 'left-right'
            ? 10
            : 0,
      },*/
      label: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
      },
      errorText: {
        alignSelf: 'flex-end',
        fontSize: 10,
        color: this.props.colors.errorColor,
        color:'red'
      },
      descriptionText: {
        fontSize: DeviceInfo.isTablet() ? 12 : 10,
        marginLeft: 20,
        marginTop: 10,
      },
      labelStyle: {
        maxWidth: DeviceInfo.isTablet() ? 580 : 210,
        color: this.props.theme.Label.color,
        fontSize: DeviceInfo.isTablet() ? this.props.theme.Label.fontSize : 12,
      },
      inputWrapper: {
        flexDirection: 'row',
      },
      suffixAndPrefix: {
        alignSelf: 'center',
      },
      requiredIcon: {
        marginHorizontal: 10,
        color: 'red',
      },
    });
    const { component } = this.props;
    const label = component.label;


    const isRequired = component.validate && component.validate.required;
    const gotLabel = !(
      component.hideLabel === true ||
      component.label === '' ||
      !component.label
    );

    const data = this.state || {};
  //  const error = !(this.state.isPristine || data.isValid);
    const error= data.isValid== false || this.state.isPristine==true?true:false
    //alert(this.state.isPristine || data.isValid );
    //const Element = this.getSingleElement(data, 0, error);
    const errorText = error ? <Text style={{marginLeft:15,fontWeight:'bold',color:'red'}}>{data.errorMessage}</Text> : null;


    const image = typeof this.state.value === 'object' ? this.state.value.item : this.state.value;
    const inputLabel = gotLabel ? (
      <View 
      style={multiStyles.label}
      >
        <Text style={{marginLeft:18}}>{component.label}</Text>
        {isRequired && gotLabel ? (
          <FontAwesomeIcon 
          style={multiStyles.requiredIcon} 
          name="asterisk" />
        ) : null}
      </View>
    ) : null;
    if (this.props.readOnly) {
      return (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: image }}
            style={styles.signature}
            resizeMode={'stretch'}
          />
        </View>
      );
    }
    return (
      <View style={{
        flex: 1,
        padding: 15,
        backgroundColor:'#fff',
       // borderWidth:1,
       // borderColor:'#000',
        borderRadius:4,
        marginBottom:5,
        marginHorizontal:5,
        shadowColor: "#000",
shadowOffset: {
	width: 0,
	height: 2,
},
shadowOpacity: 0.25,
shadowRadius: 3.84,

elevation: 5,
      }}>
      
        <View style={styles.imageWrapper}>
        </View>
        {this.state.value.item ?
          <View style={styles.imageWrapper}>
            <Image
              style={styles.signature}
              source={{ uri: this.state.value.item }}
              resizeMode={'stretch'}
            />
          </View> : this.state.value ?
            <View style={styles.imageWrapper}>
              <Image
                style={styles.signature}
                source={{ uri: this.state.value }}
                resizeMode={'stretch'}
              />
            </View>
            : null
        }
        {inputLabel}

                      
        <Button
          icon={
            <Icon
              name="edit"
              type='fontawesome'
              size={25}
              color="white"
            />
          }
          title={`Tap to ${this.state.value && this.state.value.item ? 'change' : 'sign'}`}
          buttonStyle={styles.signatureButton}
          onPress={this.toggleSignaturePad}
          backgroundColor={'transparent'}
          color={this.props.colors.primary1Color}
        >
        </Button>
        <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.showSignaturePad}
          onRequestClose={this.toggleSignaturePad}
          presentationStyle={'formSheet'}
        >
          <View style={styles.signaturePadWrapper}>
            {isTablet && <View style={styles.buttonWrapper}>
              <Button
                title={'Clear'}
                onPress={this.clearSignature}
                color={this.props.colors.primary1Color}
                backgroundColor={'transparent'}
              />
              <Button
                title={'Save Signature'}
                onPress={this.saveSignature}
                color={this.props.colors.primary1Color}
                backgroundColor={'transparent'}
              />
            </View>}
            <SignatureCapture
              style={[
                styles.signaturePad, {
                  backgroundColor: component.backgroundColor,
                }]}
              ref={(ref) => {
                this.signature = ref;
              }}
              onSaveEvent={this.onEnd}
              saveImageFileInExtStorage={false}
              showNativeButtons={!isTablet ? true : false}
              rotateClockwise={!isTablet}
              minStrokeWidth={2}
              maxStrokeWidth={8}
              viewMode={isTablet ? 'portrait' : 'portrait'}
            />
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>{component.footer}</Text>
              <Button
                title={'Cancel'}
                onPress={this.toggleSignaturePad}
                color={this.props.colors.primary1Color}
                backgroundColor={'transparent'}
              />
            </View>
          </View>
        </Modal>
           
        {errorText}
          {component.description ? (
            <Text style={multiStyles.descriptionText}>
              {component.description}
            </Text>
          ) :
            null

          }

      </View>
    );
  }
}
