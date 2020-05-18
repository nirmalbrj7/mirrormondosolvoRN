import React from "react";
import { View, AsyncStorage, TouchableHighlight } from "react-native";
import { TouchableOpacity, Alert } from "react-native";
import {
  Container,
  Header,
  Content,
  Text,
  Button,
  Left,
  Right,
  Body,
  Icon,
  Title,
  Subtitle,
  CardItem,
  Form,
  Item,
  Input,
  Label,
  Card
} from "native-base";
import BaseComponent from "../sharedComponents/Base";
//import AsyncStorage from "@react-native-community/async-storage";

import { FormioComponentsListDataGrid } from "../../index";

import PropTypes from "prop-types";
import { StyleSheet } from "react-native";

import styles from "./styles";
import { Button as Buttons } from "native-base";
import Icons from "react-native-vector-icons/FontAwesome";
import MultiComponent from "../sharedComponents/Multi";
export default class Panel extends MultiComponent {
  constructor(props) {
    super(props);
  
    this.state = {
      count: 0,
      data: "",
      cardObject: []
    };
    this.onChangeInput = this.onChangeInput.bind(this);
    this.triggerChange = this.triggerChange.bind(this);
  }
  
  componentDidMount() {
    const datagridMin=this.props.component.validate.min;
    const key = this.props.component.key;
    const data=this.props.data;
    if(!data[key]){
      if(key=='projectExperience2'){
        this.addCardInitial();
      }
    }
  /*  if(key=='projectExperience2'){
      this.addCardInitial();
    }*/
   
   
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
  filterValues = (components, compkey) => {
    var result = "";
    components.map(function(value, key) {
      if (value.key === compkey) {
        result = key;
      }
    });
    return result;
  };

  async componentWillReceiveProps(nextProps) {
    await this.setState({ count: nextProps.panelCount });
    this.forceUpdate();
  }
  addCardInitial = async () => {


    
    
    //locationOfProject
    //typeOfProject
    //otherProjectType
    //contractedValueOfProject
//projectDuration
//nameOfCustomer
//customerPhone



    ID = this.state.cardObject.length + 1;


  await this.setState({
    isPristine: false,
    cardObject: this.state.cardObject.concat({
      id: ID,
      items: [
        {
          locationOfProject:"",
          typeOfProject:"",
          otherProjectType:"",
          contractedValueOfProject:"",
          projectDuration:"",
          nameOfCustomer:"",
          customerPhone:""
          
        }
      ]
    })
  });
  await this.setState({
    isPristine: false,
    cardObject: this.state.cardObject.concat({
      id: ID+1,
      items: [
        {
          locationOfProject:"",
          typeOfProject:"",
          otherProjectType:"",
          contractedValueOfProject:"",
          projectDuration:"",
          nameOfCustomer:"",
          customerPhone:""
          
        }
      ]
    })
  });
  await this.setState({
    isPristine: false,
    cardObject: this.state.cardObject.concat({
      id: ID+2,
      items: [
        {
          locationOfProject:"",
          typeOfProject:"",
          otherProjectType:"",
          contractedValueOfProject:"",
          projectDuration:"",
          nameOfCustomer:"",
          customerPhone:""
          
        }
      ]
    })
  });


   
    
    this.forceUpdate(), this.onChangeInput(this.state.cardObject);

    // this.onChangeInput(this.state.cardObject);
  };
  addCard = async () => {
    //fullNameOfMember
    //isMemberPhysicallyDisabled
    //membersRelationshipToApplicant
    //membersAge
    ID = this.state.cardObject.length + 1;


  await this.setState({
    isPristine: false,
    cardObject: this.state.cardObject.concat({
      id: ID,
      items: [
        {
          fullNameOfMember: "",
          isMemberPhysicallyDisabled: "",
          membersRelationshipToApplicant: "",
          membersAge: ""
        }
      ]
    })
  });

   
    
    this.forceUpdate(), this.onChangeInput(this.state.cardObject);

    // this.onChangeInput(this.state.cardObject);
  };
  addCardContractor = async () => {
    //fullNameOfMember
    //isMemberPhysicallyDisabled
    //membersRelationshipToApplicant
    //membersAge
    ID = this.state.cardObject.length + 1;


  await this.setState({
    isPristine: false,
    cardObject: this.state.cardObject.concat({
      id: ID,
      items: [
        {
          locationOfProject:"",
          typeOfProject:"",
          otherProjectType:"",
          contractedValueOfProject:"",
          projectDuration:"",
          nameOfCustomer:"",
          customerPhone:""
        }
      ]
    })
  });

   
    
    this.forceUpdate(), this.onChangeInput(this.state.cardObject);

    // this.onChangeInput(this.state.cardObject);
  };
  removecard = async id => {
    const updatedCard = this.state.cardObject.filter(item => item.id !== id);
    this.setState({
      isPristine: false,
      cardObject: updatedCard
    });
    this.setState({
      isPristine: false
    });
    this.forceUpdate();
    this.onChangeInput(this.state.cardObject);
    alert("Record deleted successfully");
  };
  addItems(id, keyItem, content) {
    const newArray = [...this.state.cardObject];

    if(newArray && newArray.length>0)
    newArray.map((val, key) => {
     // console.log("DATAGRID"+JSON.stringify(val));
     // console.log("DATAGRID2"+JSON.stringify(id));
      if (val.id == id) {
        val.items[0][keyItem] = content;
      }
    });

    this.setState({ cardObject: newArray });
  }
  renderCard2 = () => {
    //this.props.data=>householdMemeberDetails,id=>items
    const dataArray = this.props.data;
    const key = this.props.component.key;

    if (dataArray) {
      if (dataArray[key]) {
        return dataArray[key].map((value, index) => {
          return value.items.map((value2, index2) => {
            return (
              <Card>
                <CardItem header bordered>
                  <Text style={{ color: "blue" }}>Card Id :{value.id}</Text>
                  <Right style={styles.buttonsWrapper}>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "Are you sure you want to delete this record?",
                          "Delete REcord",

                          [
                            {
                              text: "Cancel",
                              onPress: () => console.log("Cancel Pressed"),
                              style: "cancel"
                            },
                            {
                              text: "Yes",
                              onPress: e => {
                                // this._deleteForm(data.key, e)
                                this.removecard(value.id);
                              }
                            }
                          ],
                          { cancelable: false }
                        );
                      }}
                    >
                      <View style={styles.iconWrapper}>
                        <Icons
                          name="trash"
                          size={20}
                          style={{ color: "red" }}
                        />
                      </View>
                    </TouchableOpacity>
                  </Right>
                </CardItem>
                <CardItem>
                  <FormioComponentsListDataGrid
                    {...this.props}
                    components={this.props.component.components}
                    cardNo={value.id.toString()}
                    parentKey={this.props.component.key.toString()}
                    valueJson={value2}
                  />

                  {/**
                              <Form>
      
                  <Item stackedLabel>
                    <Label>Fisrt Name</Label>
                    <Input
                      value={data.items[0].firstname}
                      onChangeText={text => {
                        this.addItems(data.id, "firstname", text);
                      }}
                    />
                  </Item>
                  <Item stackedLabel last>
                    <Label>Second Name</Label>
                    <Input
                      value={data.items[0].secondname}
                      onChangeText={text => {
                        this.addItems(data.id, "secondname", text);
                      }}
                    />
                  </Item>
                </Form>
                  
                   */}
                </CardItem>
              </Card>
            );
          });
        });
      } else {
       // console.log("no dataarrray item");
      }
    } else {
     // console.log("no data array");
    }
  };
  renderCard = () => {
    return this.state.cardObject.map(data => {
      return (
        <Card>
          <CardItem header bordered>
            <Text style={{ color: "blue" }}>Card Id :{data.id}</Text>
            <Right style={styles.buttonsWrapper}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Are you sure",
                    "Delete data",

                    [
                      {
                        text: "Cancel",
                        onPress: () => console.log("Cancel Pressed"),
                        style: "cancel"
                      },
                      {
                        text: "Yes",
                        onPress: e => {
                          // this._deleteForm(data.key, e)
                          this.removecard(data.id);
                        }
                      }
                    ],
                    { cancelable: false }
                  );
                }}
              >
                <View style={styles.iconWrapper}>
                  <Icons name="trash" size={20} style={{ color: "red" }} />
                </View>
              </TouchableOpacity>
            </Right>
          </CardItem>
          <CardItem>
            <FormioComponentsListDataGrid
              {...this.props}
              components={this.props.component.components}
              cardNo={data.id.toString()}
              parentKey={this.props.component.key.toString()}
            />
            {/**
                          <Form>
  
              <Item stackedLabel>
                <Label>Fisrt Name</Label>
                <Input
                  value={data.items[0].firstname}
                  onChangeText={text => {
                    this.addItems(data.id, "firstname", text);
                  }}
                />
              </Item>
              <Item stackedLabel last>
                <Label>Second Name</Label>
                <Input
                  value={data.items[0].secondname}
                  onChangeText={text => {
                    this.addItems(data.id, "secondname", text);
                  }}
                />
              </Item>
            </Form>
              
               */}
          </CardItem>
        </Card>
      );
    });
  };
  renderContent = () => {
    const title =
      this.props.component.title && !this.props.component.hideLabel
        ? this.props.component.title
        : undefined;
    const titleStyle = {
      ...StyleSheet.flatten(styles.title),
      color: this.props.colors.secondaryTextColor,
      fontWeight: "bold",
      textAlign: "center",
      fontSize: 20
    };
    const key = this.props.component.key;

    return (
      <View style={{ backgroundColor: "gray" }}>
        <View style={styles.componentsWrapper}>
          <Text>{title}</Text>
          <FormioComponentsListDataGrid
            {...this.props}
            components={this.props.component.components}
            //   cardNo="500"
          />
        </View>
      </View>
    );
  };

  render() {
    var dataArray = this.state.value;
    const key = this.props.component.key;
    // var dataItem=dataArray.items;
    // return <View style={styles.content}>{this.renderContent()}</View>;
    return (
      <View>
      {
        key=='projectExperience2'?
        <Button success iconLeft onPress={() => this.addCardContractor()}>
          <Icons
            name="plus"
            style={{ alignSelf: "center", color: "#fff" }}
            size={30}
          />
          <Text style={{ color: "#fff", textAlign: "center" }}>
           {this.props.component.label}
          </Text>
        </Button>
        :
        <Button success iconLeft onPress={() => this.addCard()}>
          <Icons
            name="plus"
            style={{ alignSelf: "center", color: "#fff" }}
            size={30}
          />
          <Text style={{ color: "#fff", textAlign: "center" }}>
           {this.props.component.label}
          </Text>
        </Button>
      }


        {this.renderCard2()}
      
      </View>
    );
  }
}

Panel.propTypes = {
  count: PropTypes.string,
  panelData: PropTypes.string
};
