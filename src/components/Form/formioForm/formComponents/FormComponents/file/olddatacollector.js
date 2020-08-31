import React from "react";
import MultiComponent from "../sharedComponents/Multi";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  PixelRatio,ToastAndroid
} from "react-native";
import {Text as TextNB ,Button as ButtonNB}  from "native-base";
import DeviceInfo from "react-native-device-info";
import { TextMask } from "react-text-mask-hoc/ReactNative";
import { clone } from "lodash";
import { FormInput, Button, Icon,Badge,Avatar } from "react-native-elements";
import PropTypes from "prop-types";

import ImagePicker from "react-native-image-picker";
import Icons from "react-native-vector-icons/FontAwesome";
import Icons5 from "react-native-vector-icons/FontAwesome5";
import { evaluate } from "../../../formio/utils/utils";
import ImagePicker2 from "react-native-image-crop-picker";

import DocumentPicker from "react-native-document-picker";

export default class File extends MultiComponent {
  constructor(props) {
    super(props);

    state = {
      avatarSource: null,

      image: null,
      images: null,
      ImageSourceviewarray: [],
      itemcount:null
    };

    this.timeout = null;

    this.customState = this.customState.bind(this);
    this.triggerChange = this.triggerChange.bind(this);
    this.onChangeInput = this.onChangeInput.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.getInputMask = this.getInputMask.bind(this);
    this.getSingleElement = this.getSingleElement.bind(this);

    this.selectPhotoTapped = this.selectPhotoTapped.bind(this);

    this.selectImageSingle = this.selectImageSingle.bind(this);
    this.selectImageMultiple = this.selectImageMultiple.bind(this);
    this.selectFileSingle = this.selectFileSingle.bind(this);
    this.selectFileMultiple = this.selectFileMultiple.bind(this);

    this.deleteImageSingle = this.deleteImageSingle.bind(this);
    this.deleteImageSingle2 = this.deleteImageSingle2.bind(this);
  }
  deleteImageSingle2(item, index) {
    console.log("=======================");
    console.log("item" + JSON.stringify(item));
    //  console.log("name"+JSON.stringify(name));
    const selectedItems =
      this.state.value && this.state.value.item ? this.state.value.item : [];
    // console.log("selectedItems"+JSON.stringify(selectedItems));
    const isSelected = Object.keys(selectedItems).find(i => i === item);
    if (isSelected && selectedItems[isSelected] === true) {
      //selectedItems[1] = '';
      delete selectedItems[item];
    } else {
      //selectedItems[1] = '';
      delete selectedItems[item];
    }
    this.setValue(selectedItems);
  }
  deleteImageSingle(item) {
    console.log(JSON.stringify("aaa" + this.items));
    this.items = [];
    this.state.value.item = [];
    this.setValue("");
    //const selectedItems = '';
    //const selectedItems = this.state.value && this.state.value.item ? this.state.value.item : [];

    // Object.keys(selectedItems).find((i) => i === item.value);
    //delete selectedItems[0];
    // this.setValue(selectedItems);

    //const aa;

    // console.log("selectedItems"+JSON.stringify(selectedItems));
    /* const isSelected = Object.keys(selectedItems).find((i) => i === item.value);
     if (isSelected && selectedItems[isSelected] === true) {
       //selectedItems[1] = '';
       delete selectedItems[item.value];
     }
     else {
       //selectedItems[1] = '';
       delete selectedItems[item.value];
     }*/
    //this.setValue(aa);
  }
  selectImageSingle() {
    ImagePicker2.openPicker({
      width: 300,
      height: 400,
      cropping: false
      //includeBase64: true
    })
      .then(image => {
        /*   this.onChangeInput({
          uri: `data:${image.mime};base64,` + image.data,
    
          width: image.width,
          height: image.height
        });
        this.setState({
          image: {
            uri: `data:${image.mime};base64,` + image.data,
            width: image.width,
            height: image.height
          },
          images: null
        });*/
        this.onChangeInput(image);
        this.setState({
          itemcount:1
        })
        ToastAndroid.showWithGravity(
          '1 image uploaded',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      })
      .catch(e => alert(e));
  }

  selectImageMultiple() {
    ImagePicker2.openPicker({
      multiple: true,
      waitAnimationEnd: false,
      includeExif: true,
      forceJpg: false,
      maxFiles: 3
    })
      .then(images => {
        console.log("IMAGE" + JSON.stringify(images));
        this.onChangeInput(images);
        this.setState({
          itemcount:images.length
        })
        ToastAndroid.showWithGravity(
          images.length+ 'images uploaded',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
        /*  this.setState({
        image: null,
        images: images.map(i => {
          console.log('received image', i);
          return {uri: i.path, width: i.width, height: i.height, mime: i.mime};
        })
      });*/
      })
      .catch(e => alert(e));
  }
  /* selectImageMultiple(){
    ImagePicker2.openPicker({
      multiple: true,
      includeBase64: true
    }).then(images => {
      console.log(images);
      this.onChangeInput({uri: `data:${images.mime};base64,`+ images.data, width: images.width, height: images.height});
    // this.onChangeInput(images[0]);
     
    });
  }*/

  async selectFileSingle() {
    // Pick a single file
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf]
      });
      console.log("RES" + JSON.stringify(res));
      //  this.onChangeInput("DDDDD");
      this.onChangeInput(res);
      this.setState({
        itemcount:1
      })
      ToastAndroid.showWithGravity(
         '1 file uploaded',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
      /*console.log(
    res.uri,
    res.type, // mime type
    res.name,
    res.size
  );*/
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  }
  async selectFileMultiple() {
    // Pick multiple files
    try {
      const results = await DocumentPicker.pickMultiple({
        type: [DocumentPicker.types.pdf]
      });
      this.onChangeInput(results);
      const imgArray = [];
      for (const res of results) {
        console.log("RRR0" + JSON.stringify(res));
        imgArray.push(res);
        console.log(
          res.uri,
          res.type, // mime type
          res.name,
          res.size
        );
      }
      console.log("RRR111" + JSON.stringify(imgArray));
      this.setState({
        itemcount:imgArray.length
      })
      ToastAndroid.showWithGravity(
        imgArray.length+ 'files uploaded',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
      // this.onChangeInput({data:"fgddfg" });
      //  this.onChangeInput(imgArray)
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  }
  customState(state) {
    state.hasChanges = false;
    return state;
  }

  triggerChange() {
    if (typeof this.props.onChange === "function" && this.state.hasChanges) {
      this.props.onChange(this);
      this.setState(
        {
          hasChanges: false
        },
        () => this.props.onChange(this)
      );
    }
  }
  selectPhotoTapped() {
    const options = {
      quality: 1.0,
      maxWidth: 500,
      maxHeight: 500,
      storageOptions: {
        skipBackup: true
      }
    };

    ImagePicker.showImagePicker(options, response => {
      console.log("Response = ", response);

      if (response.didCancel) {
        console.log("User cancelled photo picker");
      } else if (response.error) {
        console.log("ImagePicker Error: ", response.error);
      } else if (response.customButton) {
        console.log("User tapped custom button: ", response.customButton);
      } else {
        let source = { uri: response.uri };

        // You can also display the image using data:
        // let source = { uri: 'data:image/jpeg;base64,' + response.data };

        this.setState({
          avatarSource: source
        });

        this.onChangeInput(source);
      }
    });
  }
  renderImage(image) {
    return (
      <Image
        style={{
          width: 200,
          height: 70,
          resizeMode: "contain",
          borderRadius: 10,
          borderColor: "gray"
        }}
        source={image}
      />
    );
  }

  renderAsset(image) {
    return this.renderImage(image);
  }

  /*
componentDidMount(){

  
  if(this.props.component.hasOwnProperty('calculateValue')){
console.log("KEY==="+JSON.stringify(this.props.component.key));
console.log("value==="+JSON.stringify(this.props.component.calculateValue));
    component={"autofocus":false,"input":true,"tableView":true,"inputType":"text","inputMask":"","label":"Text","key":"text2","placeholder":"","prefix":"","suffix":"","multiple":false,"defaultValue":"","protected":false,"unique":false,"persistent":true,"hidden":false,"clearOnHide":true,"spellcheck":true,"validate":{"required":false,"minLength":"","maxLength":"","pattern":"","custom":"","customPrivate":false},"conditional":{"show":"","when":null,"eq":""},"type":"textfield","labelPosition":"top","inputFormat":"plain","tags":[],"properties":{},"calculateValue":"value=data['text']"};
    calculateValue="value=data['text']";
  
  
  rowData={"text2":"99g","text":"icomponentdidmount"};
  key='text2"';
const show=   evaluate(calculateValue, {
    value: undefined,
    data: rowData,
    row: rowData,
    util: this,
    component
  }, 'value');
    this.setState({
      isPristine: true,
      hasChanges: true,
      value: show,
    });
   }
}*/
  onChangeInput(value) {
    // alert(JSON.stringify(this.state.value));
    // Allow components to respond to onChange
    if (typeof this.onChangeCustom === "function") {
      value = this.onChangeCustom(value);
    }

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.triggerChange();
    }, 500);

    let newValue;
    if (Array.isArray(this.state.value)) {
      // Clone so we keep state immutable.
      newValue = clone(this.state.value);
    } else {
      newValue = value;
    }
    const validatedValue = this.validate(newValue);
    /*
 if(this.props.component.hasOwnProperty('calculateValue')){
  component={"autofocus":false,"input":true,"tableView":true,"inputType":"text","inputMask":"","label":"Text","key":"text2","placeholder":"","prefix":"","suffix":"","multiple":false,"defaultValue":"","protected":false,"unique":false,"persistent":true,"hidden":false,"clearOnHide":true,"spellcheck":true,"validate":{"required":false,"minLength":"","maxLength":"","pattern":"","custom":"","customPrivate":false},"conditional":{"show":"","when":null,"eq":""},"type":"textfield","labelPosition":"top","inputFormat":"plain","tags":[],"properties":{},"calculateValue":"value=data['text']"};
  calculateValue="value=data['text']";


rowData={"text2":"99g","text":"ionchange"};
key='text2"';
const show=   evaluate(calculateValue, {
  value: undefined,
  data: rowData,
  row: rowData,
  util: this,
  component
}, 'value');

 



  this.setState({
    isPristine: false,
    hasChanges: true,
    value: show,
  });
 }
 else{
  this.setState({
    isPristine: false,
    hasChanges: true,
    value: validatedValue,
  });
 }*/

    this.setState({
      isPristine: false,
      hasChanges: true,
      value: validatedValue
    });
  }

  onBlur() {
    this.triggerChange();
  }
  /**
   * Returns an input mask that is compatible with the input mask library.
   * @param {string} mask - The Form.io input mask.
   * @returns {Array} - The input mask for the mask library.
   */
  getInputMask(mask) {
    if (typeof this.customMask === "function") {
      return this.customMask();
    }
    if (!mask) {
      return false;
    }
    if (mask instanceof Array) {
      return mask;
    }
    let maskArray = [];
    for (let i = 0; i < mask.length; i++) {
      switch (mask[i]) {
        case "9":
          maskArray.push(/\d/);
          break;
        case "a":
        case "A":
          maskArray.push(/[a-zA-Z]/);
          break;
        case "*":
          maskArray.push(/[a-zA-Z0-9]/);
          break;
        default:
          maskArray.push(mask[i]);
          break;
      }
    }
    return maskArray;
  }

  getSingleElement(value, index, error) {
    const _this = this;
    const themeStyle = this.props.theme.Input;
    const style = StyleSheet.create({
      container: {
        borderColor: error
          ? themeStyle.borderColorOnError
          : themeStyle.borderColor
      },
      input: {
        flex: 1,
        marginTop: 20,
        paddingTop: 5,
        marginHorizontal: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        fontSize: 16,
        lineHeight: 10,
        paddingBottom: 2,
        borderRadius: 4,

        borderWidth: 1,
        borderColor: "#9e9e9e",
        maxWidth: "90%",

        color: themeStyle.color,
        fontSize: themeStyle.fontSize,
        //  lineHeight: themeStyle.lineHeight,
        flex: 1
        //    maxWidth: DeviceInfo.isTablet() ? 580 : 210,
      }
    });

    index = index || 0;
    const item = typeof value === "string" ? value : value.item;
    const { component, name, readOnly } = this.props;
    const mask = component.inputMask || "";
    const properties = {
      type: component.inputType !== "number" ? component.inputType : "text",
      key: index,
      id: component.key,
      "data-index": index,
      name: name,
      shake: true,
      defaultValue: item,
      value: item,
      editable: !readOnly,
      placeholder: component.placeholder,
      placeholderTextColor: this.props.theme.Input.placeholderTextColor,
      onChangeText: this.onChangeInput,
      onBlur: this.onBlur,
      ref: input => (this.element = input)
    };

    if (mask || component.type === "currency" || component.type === "number") {
      properties.inputMode = "number";
      properties.mask = this.getInputMask(mask);
      properties.placeholderChar = "_";
      properties.guide = true;

      return (
        <TextMask style={style.input} Component={FormInput} {...properties} />
      );
    } else {
      if (component.image == true) {
        if (component.multiple == true) {
          return (

            <View style={styles.container}>
              

              <Text>Image with multiple</Text>
              <View>
  

          </View>
              <TouchableOpacity onPress={this.selectImageMultiple.bind(this)}>
              {
                    this.state.itemcount!=null?
                    
                    <ButtonNB rounded danger small style={{position:'absolute',top:5,left:70,borderRadius:100}}>
                    <TextNB style={{fontSize:10}}>{this.state.itemcount}</TextNB>
                  </ButtonNB>:
                  null
                  }
                <View
                  style={[
                    styles.avatar,
                    styles.avatarContainer,
                    { marginBottom: 20 }
                  ]}
                >
                  {/*
                  _this.state.avatarSource == null ? (
                  <Text>Select a Photo</Text>
                ) : (
                  <View>
                  
                    <Image style={styles.avatar} source={_this.state.avatarSource} />
                    </View>
                
                )
              */}

                  <Icons5
                    style={styles.icon}
                    color="black"
                    name="images"
                    size={30}
                  />

                </View>

              </TouchableOpacity>



              {item == "" || item == null ? (
                <Text />
              ) : (
                null
                /*<View style={styles.titlePanel}>
                  {
                    <Text style={styles.textPanel}>{item.filter(item1 => item1.path).length} images uploaded</Text>
           
              
                  }

                  
                  {
                   
                    
                    item.map(data => {
                    return (
                      <View style={{ flex: 1, alignSelf: "center" }}>
                       
                        <Image
                          style={styles.avatar}
       

                          source={{ uri: data.path }}
                        />
                        <Button
                          onPress={this.deleteImageSingle2.bind(item, index)}
                          title="Remove"
                          color="#841584"
                          accessibilityLabel="Remove Image"
                        />
                        <Text>fdfg{data.length}</Text>
                      </View>
                    );
                  })
                  
                  
                  }
                </View>*/
              )}
            </View>
          );
        } else if (component.multiple == false) {
          return (
            <View style={styles.container}>
              <Text>Image with single</Text>
              <TouchableOpacity onPress={this.selectImageSingle.bind(this)}>
                <View
                  style={[
                    styles.avatar,
                    styles.avatarContainer,
                    { marginBottom: 20 }
                  ]}
                >
                  {
                    this.state.itemcount!=null?
                    
                    <ButtonNB rounded danger small style={{position:'absolute',top:5,left:70,borderRadius:100}}>
                    <TextNB style={{fontSize:10}}>{this.state.itemcount}</TextNB>
                  </ButtonNB>:
                  null
                  }
                  <Icons5
                    style={styles.icon}
                    color="black"
                    name="image"
                    size={30}
                  />
                </View>
              </TouchableOpacity>

              {item == "" || item == null ? (
                <Text />
              ) : (
                <Image
                style={styles.avatar}


                source={{ uri: item.path }}
              />
              )}
            </View>
          );
        } else {
          return (
            <View style={styles.container}>
              <TouchableOpacity onPress={this.selectImageSingle.bind(this)}>
                <Text>file with no</Text>
                <View
                  style={[
                    styles.avatar,
                    styles.avatarContainer,
                    { marginBottom: 20 }
                  ]}
                >
                                    {
                    this.state.itemcount!=null?
                    
                    <ButtonNB rounded danger small style={{position:'absolute',top:5,left:70,borderRadius:100}}>
                    <TextNB style={{fontSize:10}}>{this.state.itemcount}</TextNB>
                  </ButtonNB>:
                  null
                  }
                  {/*
                  _this.state.avatarSource == null ? (
                  <Text>Select a Photo</Text>
                ) : (
                  <View>
                  
                    <Image style={styles.avatar} source={_this.state.avatarSource} />
                    </View>
                
                )
              */}

                  {item == "" || item == null ? (
                    <Icons
                      style={styles.icon}
                      color="red"
                      name="file"
                      size={30}
                    />
                  ) : (
                    <View />
                  )}
                </View>
              </TouchableOpacity>

              {item == "" || item == null ? (
                <Text />
              ) : (
                item.map(data => {
                  return (
                    <View>
                      <Text>{data.name}</Text>
                    </View>
                  );
                })
              )}
            </View>
          );
        }
      } else if (component.image == false) {
        if (component.multiple == true) {
          return (
            <View style={styles.container}>
              <TouchableOpacity onPress={this.selectFileMultiple.bind(this)}>
                <Text>file with multiple</Text>

                <View
                  style={[
                    styles.avatar,
                    styles.avatarContainer,
                    { marginBottom: 20 }
                  ]}
                >
                                    {
                    this.state.itemcount!=null?
                    
                    <ButtonNB rounded danger small style={{position:'absolute',top:5,left:70,borderRadius:100}}>
                    <TextNB style={{fontSize:10}}>{this.state.itemcount}</TextNB>
                  </ButtonNB>:
                  null
                  }
                  <Icons5
                    style={styles.icon}
                    color="red"
                    name="copy"
                    size={30}
                  />

                  <View />
                </View>
              </TouchableOpacity>
              {item == "" || item == null ? (
                <Text />
              ) : 
              
              /*(
                item.map((data, index) => {
                  return (
                    <View style={styles.titlePanel}>
                                         <Text style={{ color: "blue" }}>{data.name}</Text>
                      <TouchableOpacity
                        onPress={this.deleteImageSingle2.bind(item, index)}
                      >
                        <Icons
                          name="close"
                          size={16}
                          color="#fff"
                          style={styles.panelIcon}
                        />
                      </TouchableOpacity>
                   
                       <Text style={{ color: "blue" }}>{item.filter(item1 => item1.path).length} files uploaded</Text>

                    </View>
                  );
                })
              )*/
           (
          null
           )
              
              
              }
              
            </View>
          );
        } else if (component.multiple == false) {
          return (
            <View style={styles.container}>
              <TouchableOpacity onPress={this.selectFileSingle.bind(this)}>
                <Text>file with single</Text>
                <View
                  style={[
                    styles.avatar,
                    styles.avatarContainer,
                    { marginBottom: 20 }
                  ]}
                >
                                    {
                    this.state.itemcount!=null?
                    
                    <ButtonNB rounded danger small style={{position:'absolute',top:5,left:70,borderRadius:100}}>
                    <TextNB style={{fontSize:10}}>{this.state.itemcount}</TextNB>
                  </ButtonNB>:
                  null
                  }
                  {/*
                          _this.state.avatarSource == null ? (
                          <Text>Select a Photo</Text>
                        ) : (
                          <View>
                          
                            <Image style={styles.avatar} source={_this.state.avatarSource} />
                            </View>
                        
                        )
                      */}

                  <Icons5
                    style={styles.icon}
                    color="red"
                    name="file"
                    size={30}
                  />
                </View>
              </TouchableOpacity>

              {item == "" || item == null ? (
                <Text />
              ) : (
<View style={styles.titlePanel}>
  <Text style={{color:'blue'}}>One file uploaded</Text>
</View>
               


              )}
            </View>
          );
        } else {
          return (
            <View style={styles.container}>
              <TouchableOpacity onPress={this.selectFileSingle.bind(this)}>
                <Text>file with no</Text>
                <View
                  style={[
                    styles.avatar,
                    styles.avatarContainer,
                    { marginBottom: 20 }
                  ]}
                >
                                    {
                    this.state.itemcount!=null?
                    
                    <ButtonNB rounded danger small style={{position:'absolute',top:5,left:70,borderRadius:100}}>
                    <TextNB style={{fontSize:10}}>{this.state.itemcount}</TextNB>
                  </ButtonNB>:
                  null
                  }
                  {item == "" || item == null ? (
                    <Icons
                      style={styles.icon}
                      color="red"
                      name="file"
                      size={30}
                    />
                  ) : (
                    <View>
                      {
                        /**
                         * 
                         * <Image style={styles.avatar} source={item} />
                         */
                      }
                      
                      
                    </View>
                  )}
                  {
                    /**
                     * 
                     *  <Text>{item.name}</Text>
                     */
                  }
   
                  
                </View>
              </TouchableOpacity>
            </View>
          );
        }
      } else {
        return <Text />;
      }
    }
  }
}

File.propTypes = {
  component: PropTypes.any,
  name: PropTypes.string,
  theme: PropTypes.object,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func
};
const styles = StyleSheet.create({
  avatarContainer: {
    backgroundColor: "#F8F9FC",

    borderColor: "#bdbdbd",
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center"
  },
  avatar: {
    borderRadius: 4,
    width: 100,
    height: 100
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  avatarContainer: {
    alignItems: "center",
    borderColor: "#9B9B9B",
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center"
  },
  avatar: {
    borderRadius: 75,
    width: 120,
    height: 120
  },

  icon: {
    alignItems: "center",
    justifyContent: "center"
  },

  titlePanel: {
    width: "90%",
    borderColor: "blue",
    borderRadius: 5,
    paddingVertical: 5,
    marginVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "gray",

    flex: 1,
    flexDirection: "row"
  },
  panelIcon: {
    //paddingHorizontal:10,

    justifyContent: "center",
    alignContent: "center"
    //,zIndex:9999,position:'absolute',right:5
  }
});
