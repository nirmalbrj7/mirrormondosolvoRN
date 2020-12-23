import React, { Component } from 'react';
import { connect } from 'react-redux';
import { clone } from 'lodash';
import PropTypes from 'prop-types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {Text, Alert,View} from 'react-native';
import FormioComponentsList from '../formioForm/formComponents/FormioComponentsList';
import '../formioForm/formComponents/FormComponents';

import theme from '../formioForm/defaultTheme';
import colors from '../formioForm/defaultTheme/colors';
//import Myglobal from '../../../components/Form/global';
import {checkCondition,evaluate} from '../formio/utils/utils';
import StoreActionsSubmission from '../../../store/actions/submission';


class FormWizardPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.selectCard=props.cardSelected;
    // data object is used to store user inputs. It's component of submission object
    if (props.currentPageSubmissionData) {
      this.data = clone(props.currentPageSubmissionData);
    } else {
      this.data = {};
    }
   // this.data={"number":"99","number1":"1234","radio1":"sssss"};

    // Form components that are currently rendered on the screen
    this.inputs = {};

    this.state = {
      // Passed to submit buttons on the form. Set to true when form is submitting
      isSubmitting: false,
      isValid: true,
      isPristine: true,
    };
    this.dummy = this.dummy.bind(this);
    this.checkCalculative = this.checkCalculative.bind(this);
  }


  componentDidMount() {
    const { receiverOfCallbackForDataRetrieval } = this.props;

    receiverOfCallbackForDataRetrieval(this.getData);
  }

  setInputsPristine(name, isPristine) {
    this.inputs[name].setState({
      isPristine,
    });
    if (typeof this.inputs[name].setPristine === 'function') {
      this.inputs[name].setPristine(isPristine);
    }
  }

  getData = () => {
    const { isValid } = this.state;
    if (!isValid) {
      Object.keys(this.inputs).forEach((name) => {
        this.setInputsPristine(name, false);
      });
      throw Error('Validation error');
    }
    return this.data;
  };
  dummy = (component, row = {}) => {
    const show = checkCondition(component, row, this.data);
    // this.data[component.key]='sssssssss' ;
    if (!show) {

      this.clearHiddenData(component);
    }
    console.log("SHOW"+JSON.stringify(show));
    this.rerender = true;
    return show;

  };

 /* dummy = (component, row = {}) => {
    console.log("COMPIONNET STATE" + JSON.stringify(component));
    if (component.hasOwnProperty("calculateValue")) {

      var component = component;
      var rowData = this.data;
      var key = component.key;

      var calculateValue = component.calculateValue;

      const show2 = evaluate(
        calculateValue,
        {
          value: undefined,
          data: rowData,
          row: rowData,
          util: this,
          component
        },
        "value"
      );
      if (show2 != undefined) {
        this.data[component.key] = show2;
        // component.state.value.item='999';
      }
      //  this.data[component.key]=show2;
      //console.log("CCC"+JSON.stringify(ccc));
      //console.log("ddd"+JSON.stringify(show2));
      // console.log("www"+JSON.stringify(show));
      const show = checkCondition(component, row, this.data);
      // this.data[component.key]='sssssssss' ;
      if (!show) {

        this.clearHiddenData(component);
      }
      this.rerender = true;
      return show;
    }
    else {
      const show = checkCondition(component, row, this.data);
      if (!show) {
        // Recursively delete data for all components under this component.
        this.clearHiddenData(component);
      }
      this.rerender = true;
      return show;

    }











  };*/
 /* dummy=(component, row = {}) =>{
    const show = checkCondition(component, row, this.data);
    if (!show) {
      // Recursively delete data for all components under this component.
      this.clearHiddenData(component);
    }
    this.rerender = true;
    return show;
  };*/
  checkCalculative=(component)=>{
  
    return true;
  }

  dummyThatSaysFalse = () => false;

  externalChange = (component, context) => {
    // TODO: make saga to save validated submission data
    console.groupCollapsed('Evoking external change');
    console.groupEnd();

    if (typeof this.props.onChange === "function" && !this.props.readOnly) {
      this.props.onChange({ data: this.data }, component, context);
    }


  };



  clearHiddenData(component) {
    if (
      !component.hasOwnProperty("clearOnHide") ||
      component.clearOnHide !== false
    ) {
      if (this.data.hasOwnProperty(component.key)) {
        delete this.data[component.key];
        this.externalChange({
          props: { component },
          state: { isPristine: true, value: null }
        });
      }
    }
    if (component.hasOwnProperty("components")) {
      component.components.forEach(component => {
        this.clearHiddenData(component);
      });
    }
    if (component.hasOwnProperty("columns")) {
      component.columns.forEach(column => {
        column.components.forEach(component => {
          this.clearHiddenData(component);
        });
      });
    }
    if (component.hasOwnProperty("rows") && Array.isArray(component.rows)) {
      component.rows.forEach(column => {
        column.forEach(component => {
          this.clearHiddenData(component);
        });
      });
    }
  }

  attachToForm = (component) => {
    this.inputs[component.props.component.key] = component;
    this.validate();
  };

  detachFromForm = (component) => {
    let sendChange = false;
    // Don't detach when the whole form is unmounting.
    if (this.unmounting) {
      return;
    }
    delete this.inputs[component.props.component.key];
    if (!component.props.component.hasOwnProperty('clearOnHide') || component.props.component.clearOnHide !== false) {
      if (this.data && this.data.hasOwnProperty(component.props.component.key)) {
        delete this.data[component.props.component.key];
        sendChange = true;
      }
    }
    this.validate(() => {
      if (sendChange) {
        this.externalChange(component);
      }
    });
  };

  validate = (next) => {
    let allIsValid = true;
    const { inputs } = this;
    Object.keys(inputs).forEach((name) => {
      if (inputs[name].state.value && !inputs[name].state.value.isValid) {
        allIsValid = false;
      }
    });

    this.setState({
      isValid: allIsValid,
    }, next);

    return allIsValid;
  };
  onChange = (component, context = {}) => {
    const { isPristine } = this.state;

    /* console.groupCollapsed('OnChange');
    console.log(component.props.component.key);
    console.log(component.state.value.item);
    console.log(context);
    console.groupEnd(); */

    // DataGrids and containers are different.
    if (context.hasOwnProperty('datagrid')) {
      // this.data[context.datagrid.props.component.key] = context.datagrid.state.value;
    } else if (context.hasOwnProperty('container')) {
      // this.data[context.container.props.component.key] = context.container.state.value;
    } else if (component.state.value === null) {
      delete this.data[component.props.component.key];
    } else {
      this.data[component.props.component.key] = component.state.value.item;
    }
    this.validate(() => {
      this.externalChange(component, context);
    });
    // If a field is no longer pristine, the form is no longer pristine.
    if (!component.state.isPristine && isPristine) {
      this.setState({
        isPristine: false,
      });
    }

    this.rerender = true;

   
  };


  onChange2 = (component, context = {}) => {
    const { isPristine } = this.state;

  
    const  cardId  = this.props.cardSelected.datagridreducer;

    const currentComponent=component.props.component;
  
    if(currentComponent.hasOwnProperty('datagridItem')){
   // var cardNo=getCardNumber();

     // console.log(JSON.stringify('CARDNO==='+JSON.stringify(cardNo)));
      const datagridId=currentComponent.datagridId;
      const datagridItem=currentComponent.datagridItem;
      const currentkey=component.props.component.key;
      const parentkey=currentComponent.datagridItem

      const currentArray=this.data[parentkey];
     // console.log('cuee'+JSON.stringify(currentkey));
     // console.log('cuee'+JSON.stringify(currentArray));
      //console.log('CARDID'+JSON.stringify(cardId));
      if(currentArray && currentArray.length>0){
        currentArray.map((val, index) => {
          var newindex=0;
          if(cardId==val.id){

  
          currentArray[index][currentkey]=component.state.value.item;
          this.data[parentkey]=currentArray;
        }
  
  
         /* var newindex=0;
        //currentArray.map((val,index)=>{
          console.log('datagridId'+datagridId);
          console.log('id'+val.id);
          if(datagridId==val.id){
            console.log('index'+index);
            console.log('matchs');
            console.log(val);
            console.log(val[currentkey]);
            currentArray[newindex][currentkey]=component.state.value.item;
  //val.number==component.state.value.item
          }
          newindex++;*/
        })
      }

      //console.log('currentArray'+JSON.stringify(currentArray));
      //console.log('this.data[parentkey]'+JSON.stringify(this.data[parentkey]));
      
    }else{
    // DataGrids and containers are different.
    if (context.hasOwnProperty('datagrid')) {
      //console.log('DATAGRID CONTEXT');
      // this.data[context.datagrid.props.component.key] = context.datagrid.state.value;
    } else if (context.hasOwnProperty('container')) {
      // this.data[context.container.props.component.key] = context.container.state.value;
    } else if (component.state.value === null) {
      delete this.data[component.props.component.key];
    } else {
      this.data[component.props.component.key] = component.state.value.item;
      console.log('dddd'+JSON.stringify(this.data) );
    }
    }

    this.validate(() => {
      this.externalChange(component, context);
    });
    // If a field is no longer pristine, the form is no longer pristine.
    if (!component.state.isPristine && isPristine) {
      this.setState({
        isPristine: false,
      });
    }
    
  // this.data['number1']='123';
  //  this.data['radio1']='sssss';
    this.props.updateSubmissionDataAllPagesLocally('__root',this.data);
this.validate();
    this.rerender=true;
  };

   checkConditional(component, row = {}) {
     alert("CHECKING COND");
     console.log("CHECKING CONDITIONAL");
    const show = checkCondition(component, row, this.data);

    // If element is hidden, remove any values already on the form
    // (this can happen when data is loaded into the form
    // and the field is initially hidden)
    if (!show) {
      // Recursively delete data for all components under this component.
      this.clearHiddenData(component);
    }

    return show;
  } 

  render() {
    const {
      cardSelected,
      currentPageComponents, currentPageSubmissionData, options, onElementRender,
    } = this.props;
    const { isSubmitting, isValid, isPristine } = this.state;
    //console.log('currentPageComponents'+JSON.stringify(currentPageComponents));

    var staticCurrent=[
      {
    "label": "Text Field",
    "labelPosition": "top",
    "placeholder": "",
    "description": "",
    "tooltip": "",
    "prefix": "",
    "suffix": "",
    "widget": {
      "type": "input"
    },
    "inputMask": "",
    "allowMultipleMasks": false,
    "customClass": "",
    "tabindex": "",
    "hidden": false,
    "hideLabel": false,
    "showWordCount": false,
    "showCharCount": false,
    "mask": false,
    "autofocus": false,
    "spellcheck": true,
    "disabled": false,
    "tableView": true,
    "modalEdit": false,
    "multiple": false,
    "persistent": true,
    "inputFormat": "plain",
    "protected": false,
    "dbIndex": false,
    "case": "",
    "encrypted": false,
    "redrawOn": "",
    "clearOnHide": true,
    "customDefaultValue": "",
    "calculateValue": "",
    "calculateServer": false,
    "allowCalculateOverride": false,
    "validateOn": "change",
    "validate": {
      "required": false,
      "pattern": "",
      "customMessage": "",
      "custom": "",
      "customPrivate": false,
      "json": "",
      "minLength": "",
      "maxLength": "",
      "strictDateValidation": false,
      "multiple": false,
      "unique": false
    },
    "unique": false,
    "errorLabel": "",
    "key": "textField",
    "tags": [],
    "properties": [],
    "conditional": {
      "show": null,
      "when": null,
      "eq": "",
      "json": ""
    },
    "customConditional": "",
    "logic": [],
    "attributes": [],
    "overlay": {
      "style": "",
      "page": "",
      "left": "",
      "top": "",
      "width": "",
      "height": ""
    },
    "type": "textfield",
    "input": true,
    "refreshOn": "",
    "inputType": "text",
    "id": "ex8sfjs9",
    "defaultValue": null
  },
      {
    "label": "Text Field2",
    "labelPosition": "top",
    "placeholder": "",
    "description": "",
    "tooltip": "",
    "prefix": "",
    "suffix": "",
    "widget": {
      "type": "input"
    },
    "inputMask": "",
    "allowMultipleMasks": false,
    "customClass": "",
    "tabindex": "",
    "hidden": false,
    "hideLabel": false,
    "showWordCount": false,
    "showCharCount": false,
    "mask": false,
    "autofocus": false,
    "spellcheck": true,
    "disabled": false,
    "tableView": true,
    "modalEdit": false,
    "multiple": false,
    "persistent": true,
    "inputFormat": "plain",
    "protected": false,
    "dbIndex": false,
    "case": "",
    "encrypted": false,
    "redrawOn": "",
    "clearOnHide": true,
    "customDefaultValue": "",
    "calculateValue": "",
    "calculateServer": false,
    "allowCalculateOverride": false,
    "validateOn": "change",
    "validate": {
      "required": false,
      "pattern": "",
      "customMessage": "",
      "custom": "",
      "customPrivate": false,
      "json": "",
      "minLength": "",
      "maxLength": "",
      "strictDateValidation": false,
      "multiple": false,
      "unique": false
    },
    "unique": false,
    "errorLabel": "",
    "key": "textField2",
    "tags": [],
    "properties": [],
    "conditional": {
      "show": null,
      "when": null,
      "eq": "",
      "json": ""
    },
    "customConditional": "",
    "logic": [],
    "attributes": [],
    "overlay": {
      "style": "",
      "page": "",
      "left": "",
      "top": "",
      "width": "",
      "height": ""
    },
    "type": "textfield",
    "input": true,
    "refreshOn": "",
    "inputType": "text",
    "id": "ekh6v4j",
    "defaultValue": ""
  },
      {
    "label": "Text Field",
    "labelPosition": "top",
    "placeholder": "",
    "description": "",
    "tooltip": "",
    "prefix": "",
    "suffix": "",
    "widget": {
      "type": "input"
    },
    "inputMask": "",
    "allowMultipleMasks": false,
    "customClass": "",
    "tabindex": "",
    "hidden": false,
    "hideLabel": false,
    "showWordCount": false,
    "showCharCount": false,
    "mask": false,
    "autofocus": false,
    "spellcheck": true,
    "disabled": false,
    "tableView": true,
    "modalEdit": false,
    "multiple": false,
    "persistent": true,
    "inputFormat": "plain",
    "protected": false,
    "dbIndex": false,
    "case": "",
    "encrypted": false,
    "redrawOn": "",
    "clearOnHide": true,
    "customDefaultValue": "",
    "calculateValue": "value=data.textField2+data.textField",
    "calculateServer": false,
    "allowCalculateOverride": false,
    "validateOn": "change",
    "validate": {
      "required": false,
      "pattern": "",
      "customMessage": "",
      "custom": "",
      "customPrivate": false,
      "json": "",
      "minLength": "",
      "maxLength": "",
      "strictDateValidation": false,
      "multiple": false,
      "unique": false
    },
    "unique": false,
    "errorLabel": "",
    "key": "textField1",
    "tags": [],
    "properties": [],
    "conditional": {
      "show": true,
      "when": "textField",
      "eq": "5",
      "json": ""
    },
    "customConditional": "",
    "logic": [],
    "attributes": [],
    "overlay": {
      "style": "",
      "page": "",
      "left": "",
      "top": "",
      "width": "",
      "height": ""
    },
    "type": "textfield",
    "input": true,
    "refreshOn": "",
    "inputType": "text",
    "id": "eom7dpf",
    "defaultValue": ""
  }];
  const staticData2=[
    {
    "title": "Informasi Umum",
    "label": "General Info",
    "type": "panel",
    "key": "Info",
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false,
    "components": [{
        "label": "Titik GPS",
        "spellcheck": true,
        "tableView": true,
        "calculateServer": false,
        "key": "geoLocation",
        "type": "geolocation",
        "input": true,
        "widget": null,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "id": "eucygy"
    }, {
        "label": "Nama Surveyor",
        "spellcheck": true,
        "tableView": true,
        "calculateServer": false,
        "key": "namaSurveyor",
        "type": "textfield",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": {
            "type": "input"
        },
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false,
            "minLength": "",
            "maxLength": "",
            "pattern": ""
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "mask": false,
        "inputType": "text",
        "inputFormat": "plain",
        "inputMask": "",
        "id": "eaviem"
    }, {
        "label": "Tanggal \/ Waktu",
        "format": "dd-MM-yyy hh:mm a",
        "tableView": false,
        "enableMinDateInput": false,
        "datePicker": {
            "disableWeekends": false,
            "disableWeekdays": false,
            "showWeeks": true,
            "startingDay": 0,
            "initDate": "",
            "minMode": "day",
            "maxMode": "year",
            "yearRows": 4,
            "yearColumns": 5,
            "minDate": null,
            "maxDate": null
        },
        "enableMaxDateInput": false,
        "calculateServer": false,
        "key": "tanggalWaktu",
        "type": "datetime",
        "input": true,
        "suffix": [],
        "widget": {
            "type": "calendar",
            "displayInTimezone": "viewer",
            "language": "en",
            "useLocaleSettings": false,
            "allowInput": true,
            "mode": "single",
            "enableTime": true,
            "noCalendar": false,
            "format": "dd-MM-yyy hh:mm a",
            "hourIncrement": 1,
            "minuteIncrement": 1,
            "time_24hr": false,
            "minDate": null,
            "disableWeekends": false,
            "disableWeekdays": false,
            "maxDate": null
        },
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "multiple": false,
        "defaultValue": "",
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "useLocaleSettings": false,
        "allowInput": true,
        "enableDate": true,
        "enableTime": true,
        "defaultDate": "",
        "displayInTimezone": "viewer",
        "timezone": "",
        "datepickerMode": "day",
        "timePicker": {
            "hourStep": 1,
            "minuteStep": 1,
            "showMeridian": true,
            "readonlyInput": false,
            "mousewheel": true,
            "arrowkeys": true
        },
        "customOptions": [],
        "id": "eikeouh"
    }, {
        "label": "Cityprices",
        "widget": "choicesjs",
        "tableView": true,
        "dataSrc": "resource",
        "defaultValue": "{\"cityUnitPrices\":\"Banyuwangi\",\"bataMerahPcs_price\":750,\"batuKaliM3_price\":69767,\"bautJLPcs_price\":25000,\"besiPolos8MmX12MPcs_price\":53000,\"besiUlir10MmX12MPcs_price\":80000,\"kawatAnyam1MmX1InSpaciX12MX30MBal_price\":18000,\"kawatBetonKg_price\":20000,\"kayuKelasIi57CmX4MPcs_price\":40000,\"kayuKelasIi612CmX4MPcs_price\":83000,\"kepalaTukangOh_price\":125000,\"kerikilM3_price\":116279,\"lemKayuKg_price\":150000,\"mandorOh_price\":25000,\"minyakBekistingLtr_price\":30000,\"paku57CmKg_price\":30000,\"pakuPayungKg_price\":30000,\"papan325CmPcs_price\":90000,\"pasirM3_price\":63953,\"pekerjaOh_price\":80000,\"semenSak_price\":55000,\"sengBjlsPcs_price\":95000,\"tripleks9MmPcs_price\":125000,\"tukangOh_price\":100000,\"id\":\"5f10a7b59106b27f62234972\"}",
        "data": {
            "values": [{
                "label": "",
                "value": ""
            }],
            "resource": "VYd98vAkEZ99ODld68ay",
            "json": "",
            "url": "",
            "custom": ""
        },
        "dataType": 0,
        "template": "<span>{{ item.cityUnitPrices }}<\/span>",
        "selectThreshold": 0.3,
        "calculateServer": false,
        "key": "cityprices",
        "type": "select",
        "indexeddb": {
            "filter": []
        },
        "selectFields": "cityUnitPrices,bataMerahPcs_price,batuKaliM3_price,bautJLPcs_price,besiPolos8MmX12MPcs_price,besiUlir10MmX12MPcs_price,kawatAnyam1MmX1InSpaciX12MX30MBal_price,kawatBetonKg_price,kayuKelasIi57CmX4MPcs_price,kayuKelasIi612CmX4MPcs_price,kepalaTukangOh_price,kerikilM3_price,lemKayuKg_price,mandorOh_price,minyakBekistingLtr_price,paku57CmKg_price,pakuPayungKg_price,papan325CmPcs_price,pasirM3_price,pekerjaOh_price,semenSak_price,sengBjlsPcs_price,tripleks9MmPcs_price,tukangOh_price",
        "input": true,
        "addResource": false,
        "reference": false,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "clearOnRefresh": false,
        "limit": 100,
        "valueProperty": "",
        "lazyLoad": true,
        "filter": "",
        "searchEnabled": true,
        "searchField": "",
        "minSearch": 0,
        "readOnlyValue": false,
        "authenticate": false,
        "searchThreshold": 0.3,
        "uniqueOptions": false,
        "fuseOptions": {
            "include": "score",
            "threshold": 0.3
        },
        "customOptions": [],
        "id": "efv7tyi"
    }, {
        "label": "Nama Pemilik Rumah",
        "spellcheck": true,
        "tableView": true,
        "calculateServer": false,
        "key": "namaPemilikRumah",
        "type": "textfield",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": {
            "type": "input"
        },
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false,
            "minLength": "",
            "maxLength": "",
            "pattern": ""
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "mask": false,
        "inputType": "text",
        "inputFormat": "plain",
        "inputMask": "",
        "id": "eoouy2w"
    }, {
        "label": "Alamat Rumah",
        "tableView": false,
        "calculateServer": false,
        "provider": "google",
        "key": "alamatRumah",
        "type": "address",
        "input": true,
        "components": [{
            "label": "Address 1",
            "tableView": false,
            "key": "address3",
            "type": "textfield",
            "input": true,
            "customConditional": "show = _.get(instance, 'parent.manualMode', false);",
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "minLength": "",
                "maxLength": "",
                "pattern": ""
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "mask": false,
            "inputType": "text",
            "inputFormat": "plain",
            "inputMask": "",
            "spellcheck": true,
            "id": "ew0j643"
        }, {
            "label": "Address 2",
            "tableView": false,
            "key": "address4",
            "type": "textfield",
            "input": true,
            "customConditional": "show = _.get(instance, 'parent.manualMode', false);",
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "minLength": "",
                "maxLength": "",
                "pattern": ""
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "mask": false,
            "inputType": "text",
            "inputFormat": "plain",
            "inputMask": "",
            "spellcheck": true,
            "id": "e8rcy4"
        }, {
            "label": "City",
            "tableView": false,
            "key": "city2",
            "type": "textfield",
            "input": true,
            "customConditional": "show = _.get(instance, 'parent.manualMode', false);",
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "minLength": "",
                "maxLength": "",
                "pattern": ""
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "mask": false,
            "inputType": "text",
            "inputFormat": "plain",
            "inputMask": "",
            "spellcheck": true,
            "id": "ezzie6"
        }, {
            "label": "State",
            "tableView": false,
            "key": "state1",
            "type": "textfield",
            "input": true,
            "customConditional": "show = _.get(instance, 'parent.manualMode', false);",
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "minLength": "",
                "maxLength": "",
                "pattern": ""
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "mask": false,
            "inputType": "text",
            "inputFormat": "plain",
            "inputMask": "",
            "spellcheck": true,
            "id": "er7z14q"
        }, {
            "label": "Country",
            "tableView": false,
            "key": "country1",
            "type": "textfield",
            "input": true,
            "customConditional": "show = _.get(instance, 'parent.manualMode', false);",
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "minLength": "",
                "maxLength": "",
                "pattern": ""
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "mask": false,
            "inputType": "text",
            "inputFormat": "plain",
            "inputMask": "",
            "spellcheck": true,
            "id": "ey2ra3"
        }, {
            "label": "Zip Code",
            "tableView": false,
            "key": "zip1",
            "type": "textfield",
            "input": true,
            "customConditional": "show = _.get(instance, 'parent.manualMode', false);",
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "minLength": "",
                "maxLength": "",
                "pattern": ""
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "mask": false,
            "inputType": "text",
            "inputFormat": "plain",
            "inputMask": "",
            "spellcheck": true,
            "id": "esena6m"
        }],
        "providerOptions": {
            "params": {
                "key": "Lokasirumah",
                "region": ""
            }
        },
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": true,
        "switchToManualModeLabel": "Can't find address? Switch to manual mode.",
        "manualModeViewString": "",
        "disableClearIcon": false,
        "enableManualMode": false,
        "id": "ezkxv2m"
    }],
    "placeholder": "",
    "prefix": "",
    "customClass": "",
    "suffix": "",
    "multiple": false,
    "defaultValue": null,
    "protected": false,
    "unique": false,
    "persistent": false,
    "hidden": false,
    "clearOnHide": false,
    "refreshOn": "",
    "redrawOn": "",
    "modalEdit": false,
    "labelPosition": "top",
    "description": "",
    "errorLabel": "",
    "tooltip": "",
    "hideLabel": false,
    "tabindex": "",
    "disabled": false,
    "autofocus": false,
    "dbIndex": false,
    "customDefaultValue": "",
    "calculateValue": "",
    "calculateServer": false,
    "widget": null,
    "attributes": [],
    "validateOn": "change",
    "validate": {
        "required": false,
        "custom": "",
        "customPrivate": false,
        "strictDateValidation": false,
        "multiple": false,
        "unique": false
    },
    "conditional": {
        "show": null,
        "when": null,
        "eq": ""
    },
    "overlay": {
        "style": "",
        "left": "",
        "top": "",
        "width": "",
        "height": ""
    },
    "allowCalculateOverride": false,
    "encrypted": false,
    "showCharCount": false,
    "showWordCount": false,
    "properties": [],
    "allowMultipleMasks": false,
    "tree": false,
    "theme": "default",
    "breadcrumb": "default",
    "id": "eboi0r2"
}, {
    "title": "QA: Penilaian Kondisi Dinding dan Atap",
    "label": "QA: Penilaian Kondisi Dinding dan Atap",
    "type": "panel",
    "key": "QA",
    "components": [{
        "label": "QA1: Keretakan luas di dinding dengan lebar kurang dari 5mm",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QA1",
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "e04y8u8"
    }, {
        "title": "Aksi QA1 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqa1",
        "conditional": {
            "show": true,
            "when": "QA1",
            "eq": "true"
        },
        "type": "panel",
        "label": "QA1 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi A1",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi A1: Untuk retak dengan lebar kurang dari 5mm, isi dengan mortar lalu diplester.",
            "refreshOnChange": false,
            "tableView": false,
            "key": "A1",
            "conditional": {
                "show": true,
                "when": "QA1",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": false,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "tag": "p",
            "id": "ejpapb9"
        }, {
            "label": "A1 Panjang retak pada dinding, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a1_input",
            "conditional": {
                "show": true,
                "when": "QA1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "eigr8ng"
        }, {
            "label": "A1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"A1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.01,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.02,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.028,\"pekerjaOh\":0.26,\"semenSak\":0.233,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.1,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ea7889106b21fc752d852\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "eh7zwfn"
        }, {
            "label": "A1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.a1UnitQuantities);\r\n\r\ntotal_a1_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a1_input);\r\ntotal_a1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a1_input;\r\ntotal_a1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a1_input;\r\ntotal_a1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a1_input;\r\ntotal_a1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a1_input;\r\ntotal_a1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a1_input;\r\ntotal_a1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a1_input;\r\ntotal_a1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a1_input;\r\ntotal_a1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a1_input;\r\ntotal_a1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a1_input;\r\ntotal_a1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a1_input;\r\ntotal_a1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a1_input;\r\ntotal_a1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a1_input;\r\ntotal_a1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a1_input;\r\ntotal_a1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a1_input;\r\ntotal_a1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a1_input;\r\ntotal_a1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a1_input;\r\ntotal_a1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a1_input;\r\ntotal_a1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a1_input;\r\ntotal_a1_semenSak_price = v1.semenSak_price * v2.semenSak * data.a1_input;\r\ntotal_a1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a1_input;\r\ntotal_a1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a1_input;\r\ntotal_a1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a1_input;\r\ntotal_a1_price = total_a1_bataMerahPcs_price + total_a1_batuKaliM3_price + total_a1_bautJLPcs_price + total_a1_besiPolos8MmX12MPcs_price + total_a1_besiUlir10MmX12MPcs_price + total_a1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a1_kawatBetonKg_price + total_a1_kayuKelasIi57CmX4MPcs_price + total_a1_kayuKelasIi612CmX4MPcs_price + total_a1_kepalaTukangOh_price + total_a1_kerikilM3_price + total_a1_lemKayuKg_price + total_a1_mandorOh_price + total_a1_minyakBekistingLtr_price + total_a1_paku57CmKg_price + total_a1_pakuPayungKg_price + total_a1_papan325CmPcs_price + total_a1_pasirM3_price + total_a1_pekerjaOh_price + total_a1_semenSak_price + total_a1_sengBjlsPcs_price + total_a1_tripleks9MmPcs_price + total_a1_tukangOh_price; \r\n\r\nif (isNaN(total_a1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "a1TotalPrice",
            "conditional": {
                "show": true,
                "when": "QA1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "emdydli"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "eb5f6n"
    }, {
        "label": "QA2: Keretakan luas di dinding dengan lebar lebih dari 5mm",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QA2",
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "e021y4"
    }, {
        "title": "Opsi Aksi QA2 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "OpsiAksiqa2",
        "conditional": {
            "show": true,
            "when": "QA2",
            "eq": "true"
        },
        "type": "panel",
        "label": "QA2 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi A2, Opsi 1: Bongkar dan ganti dinding bata yang memiliki retak lebar atau yang kualitasnya sudah menurun.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "A2_O1",
            "conditional": {
                "show": true,
                "when": "QA2",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "right",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "inputType": "checkbox",
            "dataGridLabel": true,
            "value": "",
            "name": "",
            "id": "eg3xoqh"
        }, {
            "label": "A2 O1 Panjang dinding yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "a2O1_input",
            "conditional": {
                "show": true,
                "when": "A2_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "er0k6z"
        }, {
            "label": "A2_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"A2_O1\",\"bataMerahPcs\":210,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":16.071,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.13,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.32,\"minyakBekistingLtr\":0,\"paku57CmKg\":3.6,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.6,\"pekerjaOh\":3.05,\"semenSak\":5.389,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":1.29,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ea8be9106b221256203d2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a2O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "esjs1q7"
        }, {
            "label": "A2 O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.a2O1UnitQuantities);\r\ntotal_a2O1_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a2O1_input);\r\ntotal_a2O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a2O1_input;\r\ntotal_a2O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a2O1_input;\r\ntotal_a2O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a2O1_input;\r\ntotal_a2O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a2O1_input;\r\ntotal_a2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a2O1_input;\r\ntotal_a2O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a2O1_input;\r\ntotal_a2O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a2O1_input;\r\ntotal_a2O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a2O1_input;\r\ntotal_a2O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a2O1_input;\r\ntotal_a2O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a2O1_input;\r\ntotal_a2O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a2O1_input;\r\ntotal_a2O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a2O1_input;\r\ntotal_a2O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a2O1_input;\r\ntotal_a2O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a2O1_input;\r\ntotal_a2O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a2O1_input;\r\ntotal_a2O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a2O1_input;\r\ntotal_a2O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a2O1_input;\r\ntotal_a2O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a2O1_input;\r\ntotal_a2O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.a2O1_input;\r\ntotal_a2O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a2O1_input;\r\ntotal_a2O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a2O1_input;\r\ntotal_a2O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a2O1_input;\r\ntotal_a2O1_price = total_a2O1_bataMerahPcs_price + total_a2O1_batuKaliM3_price + total_a2O1_bautJLPcs_price + total_a2O1_besiPolos8MmX12MPcs_price + total_a2O1_besiUlir10MmX12MPcs_price + total_a2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a2O1_kawatBetonKg_price + total_a2O1_kayuKelasIi57CmX4MPcs_price + total_a2O1_kayuKelasIi612CmX4MPcs_price + total_a2O1_kepalaTukangOh_price + total_a2O1_kerikilM3_price + total_a2O1_lemKayuKg_price + total_a2O1_mandorOh_price + total_a2O1_minyakBekistingLtr_price + total_a2O1_paku57CmKg_price + total_a2O1_pakuPayungKg_price + total_a2O1_papan325CmPcs_price + total_a2O1_pasirM3_price + total_a2O1_pekerjaOh_price + total_a2O1_semenSak_price + total_a2O1_sengBjlsPcs_price + total_a2O1_tripleks9MmPcs_price + total_a2O1_tukangOh_price; \r\n\r\nif (isNaN(total_a2O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a2O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "a2O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "A2_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "eswpdai"
        }, {
            "label": "Aksi A2, Opsi 2: Untuk retak dengan lebar 5mm atau lebih, isi dengan mortar lalu pasang kawat anyam kemudian diplester.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "A2_O2",
            "conditional": {
                "show": true,
                "when": "QA2",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "right",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "inputType": "checkbox",
            "dataGridLabel": true,
            "value": "",
            "name": "",
            "id": "eykaka"
        }, {
            "label": "A2 O2 Panjang retak pada dinding, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a2O2_input",
            "conditional": {
                "show": true,
                "when": "A2_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "e3sz5cn"
        }, {
            "label": "A2_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"A2_O2\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0.137,\"kawatBetonKg\":0.125,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.01,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.02,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":0.002,\"papan325CmPcs\":0,\"pasirM3\":0.104,\"pekerjaOh\":0.26,\"semenSak\":0.875,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.1,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ea9399106b221922bea52\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a2O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "e5zrgj"
        }, {
            "label": "A2 O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.a2O2UnitQuantities);\r\ntotal_a2O2_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a2O2_input);\r\ntotal_a2O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a2O2_input;\r\ntotal_a2O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a2O2_input;\r\ntotal_a2O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a2O2_input;\r\ntotal_a2O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a2O2_input;\r\ntotal_a2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a2O2_input;\r\ntotal_a2O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a2O2_input;\r\ntotal_a2O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a2O2_input;\r\ntotal_a2O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a2O2_input;\r\ntotal_a2O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a2O2_input;\r\ntotal_a2O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a2O2_input;\r\ntotal_a2O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a2O2_input;\r\ntotal_a2O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a2O2_input;\r\ntotal_a2O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a2O2_input;\r\ntotal_a2O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a2O2_input;\r\ntotal_a2O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a2O2_input;\r\ntotal_a2O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a2O2_input;\r\ntotal_a2O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a2O2_input;\r\ntotal_a2O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a2O2_input;\r\ntotal_a2O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.a2O2_input;\r\ntotal_a2O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a2O2_input;\r\ntotal_a2O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a2O2_input;\r\ntotal_a2O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a2O2_input;\r\ntotal_a2O2_price = total_a2O2_bataMerahPcs_price + total_a2O2_batuKaliM3_price + total_a2O2_bautJLPcs_price + total_a2O2_besiPolos8MmX12MPcs_price + total_a2O2_besiUlir10MmX12MPcs_price + total_a2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a2O2_kawatBetonKg_price + total_a2O2_kayuKelasIi57CmX4MPcs_price + total_a2O2_kayuKelasIi612CmX4MPcs_price + total_a2O2_kepalaTukangOh_price + total_a2O2_kerikilM3_price + total_a2O2_lemKayuKg_price + total_a2O2_mandorOh_price + total_a2O2_minyakBekistingLtr_price + total_a2O2_paku57CmKg_price + total_a2O2_pakuPayungKg_price + total_a2O2_papan325CmPcs_price + total_a2O2_pasirM3_price + total_a2O2_pekerjaOh_price + total_a2O2_semenSak_price + total_a2O2_sengBjlsPcs_price + total_a2O2_tripleks9MmPcs_price + total_a2O2_tukangOh_price; \r\n\r\nif (isNaN(total_a2O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a2O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "a2O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "A2_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "e9olffn"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "em7uu8m"
    }, {
        "label": "QA3: Pasangan bata dan plester keropos saat digaruk menggunakan pena",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QA3",
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "erq67r"
    }, {
        "title": "Aksi QA3 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqa3",
        "conditional": {
            "show": true,
            "when": "QA3",
            "eq": "true"
        },
        "type": "panel",
        "label": "QA3 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi A3",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi A3: Bongkar dan ganti dinding bata yang memiliki retak lebar atau yang kualitasnya sudah menurun.",
            "refreshOnChange": false,
            "tableView": false,
            "key": "A3",
            "conditional": {
                "show": true,
                "when": "QA3",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": false,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "tag": "p",
            "id": "esf02bh"
        }, {
            "label": "A3 Panjang dinding yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a3_input",
            "conditional": {
                "show": true,
                "when": "QA3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "emau6r"
        }, {
            "label": "A3 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"A3\",\"bataMerahPcs\":210,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":16.071,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.13,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.32,\"minyakBekistingLtr\":0,\"paku57CmKg\":3.6,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.6,\"pekerjaOh\":3.05,\"semenSak\":5.389,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":1.29,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ea9cc9106b222814e7762\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a3UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "esl5ew"
        }, {
            "label": "A3 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.a3UnitQuantities);\r\n\r\ntotal_a3_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a3_input);\r\ntotal_a3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a3_input;\r\ntotal_a3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a3_input;\r\ntotal_a3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a3_input;\r\ntotal_a3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a3_input;\r\ntotal_a3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a3_input;\r\ntotal_a3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a3_input;\r\ntotal_a3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a3_input;\r\ntotal_a3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a3_input;\r\ntotal_a3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a3_input;\r\ntotal_a3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a3_input;\r\ntotal_a3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a3_input;\r\ntotal_a3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a3_input;\r\ntotal_a3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a3_input;\r\ntotal_a3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a3_input;\r\ntotal_a3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a3_input;\r\ntotal_a3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a3_input;\r\ntotal_a3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a3_input;\r\ntotal_a3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a3_input;\r\ntotal_a3_semenSak_price = v1.semenSak_price * v2.semenSak * data.a3_input;\r\ntotal_a3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a3_input;\r\ntotal_a3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a3_input;\r\ntotal_a3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a3_input;\r\ntotal_a3_price = total_a3_bataMerahPcs_price + total_a3_batuKaliM3_price + total_a3_bautJLPcs_price + total_a3_besiPolos8MmX12MPcs_price + total_a3_besiUlir10MmX12MPcs_price + total_a3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a3_kawatBetonKg_price + total_a3_kayuKelasIi57CmX4MPcs_price + total_a3_kayuKelasIi612CmX4MPcs_price + total_a3_kepalaTukangOh_price + total_a3_kerikilM3_price + total_a3_lemKayuKg_price + total_a3_mandorOh_price + total_a3_minyakBekistingLtr_price + total_a3_paku57CmKg_price + total_a3_pakuPayungKg_price + total_a3_papan325CmPcs_price + total_a3_pasirM3_price + total_a3_pekerjaOh_price + total_a3_semenSak_price + total_a3_sengBjlsPcs_price + total_a3_tripleks9MmPcs_price + total_a3_tukangOh_price;\r\n\r\nif (isNaN(total_a3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a3_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "a3TotalPrice",
            "conditional": {
                "show": true,
                "when": "QA3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "evcxr2"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "eza9hdh"
    }, {
        "label": "QA4: Beton keropos saat digaruk menggunakan pena",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QA4",
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "e9ljpq"
    }, {
        "title": "Aksi QA4 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqa4",
        "conditional": {
            "show": true,
            "when": "QA4",
            "eq": "true"
        },
        "type": "panel",
        "label": "QA4 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi A4",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi A4: Bongkar dan ganti elemen struktur beton bertulang seperti ring balok dan tiang yang memiliki retak lebar atau panjang atau elemen beton yang rusak",
            "refreshOnChange": false,
            "tableView": false,
            "key": "A4",
            "conditional": {
                "show": true,
                "when": "QA4",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": false,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "tag": "p",
            "id": "e51vrwe"
        }, {
            "label": "A4 Panjang beton yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "a4_input",
            "conditional": {
                "show": true,
                "when": "QA4",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "ejt45t"
        }, {
            "label": "A4 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"A4\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":3.518,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.08,\"kerikilM3\":0.043,\"lemKayuKg\":0,\"mandorOh\":0.09,\"minyakBekistingLtr\":0.35,\"paku57CmKg\":0.926,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.039,\"pekerjaOh\":1.72,\"semenSak\":0.66,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.224,\"tukangOh\":0.84,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eaa419106b222d53cbfe2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a4UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "elok2b7"
        }, {
            "label": "A4 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.a4UnitQuantities);\r\ntotal_a4_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a4_input);\r\ntotal_a4_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a4_input;\r\ntotal_a4_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a4_input;\r\ntotal_a4_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a4_input;\r\ntotal_a4_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a4_input;\r\ntotal_a4_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a4_input;\r\ntotal_a4_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a4_input;\r\ntotal_a4_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a4_input;\r\ntotal_a4_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a4_input;\r\ntotal_a4_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a4_input;\r\ntotal_a4_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a4_input;\r\ntotal_a4_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a4_input;\r\ntotal_a4_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a4_input;\r\ntotal_a4_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a4_input;\r\ntotal_a4_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a4_input;\r\ntotal_a4_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a4_input;\r\ntotal_a4_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a4_input;\r\ntotal_a4_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a4_input;\r\ntotal_a4_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a4_input;\r\ntotal_a4_semenSak_price = v1.semenSak_price * v2.semenSak * data.a4_input;\r\ntotal_a4_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a4_input;\r\ntotal_a4_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a4_input;\r\ntotal_a4_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a4_input;\r\ntotal_a4_price = total_a4_bataMerahPcs_price + total_a4_batuKaliM3_price + total_a4_bautJLPcs_price + total_a4_besiPolos8MmX12MPcs_price + total_a4_besiUlir10MmX12MPcs_price + total_a4_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a4_kawatBetonKg_price + total_a4_kayuKelasIi57CmX4MPcs_price + total_a4_kayuKelasIi612CmX4MPcs_price + total_a4_kepalaTukangOh_price + total_a4_kerikilM3_price + total_a4_lemKayuKg_price + total_a4_mandorOh_price + total_a4_minyakBekistingLtr_price + total_a4_paku57CmKg_price + total_a4_pakuPayungKg_price + total_a4_papan325CmPcs_price + total_a4_pasirM3_price + total_a4_pekerjaOh_price + total_a4_semenSak_price + total_a4_sengBjlsPcs_price + total_a4_tripleks9MmPcs_price + total_a4_tukangOh_price;\r\n\r\nif (isNaN(total_a4_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a4_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "a4TotalPrice",
            "conditional": {
                "show": true,
                "when": "QA4",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "ep9n0uc"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "eey9pxb"
    }, {
        "label": "QA5: Tulangan besi yang ada di beton terlihat dari luar",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QA5",
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "e6vo61c"
    }, {
        "title": "Aksi QA5 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqa5",
        "conditional": {
            "show": true,
            "when": "QA5",
            "eq": "true"
        },
        "type": "panel",
        "label": "QA5 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi A5",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi A5: Bongkar dan ganti elemen struktur beton bertulang seperti ring balok dan tiang yang memiliki retak lebar atau panjang atau elemen beton bertulang dengan pembesian yang terlihat dan berkarat.",
            "refreshOnChange": false,
            "tableView": false,
            "key": "A5",
            "conditional": {
                "show": true,
                "when": "QA5",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": false,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "tag": "p",
            "id": "e4jc9vu"
        }, {
            "label": "A5 Panjang beton yang retak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "a5_input",
            "conditional": {
                "show": true,
                "when": "QA5",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "exeifc"
        }, {
            "label": "A5 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"A5\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":3.518,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.08,\"kerikilM3\":0.043,\"lemKayuKg\":0,\"mandorOh\":0.09,\"minyakBekistingLtr\":0.35,\"paku57CmKg\":0.926,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.039,\"pekerjaOh\":1.72,\"semenSak\":0.66,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.224,\"tukangOh\":0.84,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eaaca9106b223a60ad522\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a5UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "eqj0m5"
        }, {
            "label": "A5 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.a5UnitQuantities);\r\ntotal_a5_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a5_input);\r\ntotal_a5_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a5_input;\r\ntotal_a5_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a5_input;\r\ntotal_a5_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a5_input;\r\ntotal_a5_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a5_input;\r\ntotal_a5_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a5_input;\r\ntotal_a5_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a5_input;\r\ntotal_a5_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a5_input;\r\ntotal_a5_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a5_input;\r\ntotal_a5_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a5_input;\r\ntotal_a5_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a5_input;\r\ntotal_a5_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a5_input;\r\ntotal_a5_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a5_input;\r\ntotal_a5_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a5_input;\r\ntotal_a5_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a5_input;\r\ntotal_a5_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a5_input;\r\ntotal_a5_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a5_input;\r\ntotal_a5_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a5_input;\r\ntotal_a5_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a5_input;\r\ntotal_a5_semenSak_price = v1.semenSak_price * v2.semenSak * data.a5_input;\r\ntotal_a5_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a5_input;\r\ntotal_a5_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a5_input;\r\ntotal_a5_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a5_input;\r\ntotal_a5_price = total_a5_bataMerahPcs_price + total_a5_batuKaliM3_price + total_a5_bautJLPcs_price + total_a5_besiPolos8MmX12MPcs_price + total_a5_besiUlir10MmX12MPcs_price + total_a5_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a5_kawatBetonKg_price + total_a5_kayuKelasIi57CmX4MPcs_price + total_a5_kayuKelasIi612CmX4MPcs_price + total_a5_kepalaTukangOh_price + total_a5_kerikilM3_price + total_a5_lemKayuKg_price + total_a5_mandorOh_price + total_a5_minyakBekistingLtr_price + total_a5_paku57CmKg_price + total_a5_pakuPayungKg_price + total_a5_papan325CmPcs_price + total_a5_pasirM3_price + total_a5_pekerjaOh_price + total_a5_semenSak_price + total_a5_sengBjlsPcs_price + total_a5_tripleks9MmPcs_price + total_a5_tukangOh_price;\r\n\r\nif (isNaN(total_a5_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a5_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "a5TotalPrice",
            "conditional": {
                "show": true,
                "when": "QA5",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "elxj4do"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "eud5lba"
    }, {
        "label": "QA6: Kayu rusak atau busuk",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QA6",
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "eui9c5j"
    }, {
        "title": "Opsi Aksi QA6 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "OpsiAksiqa6",
        "conditional": {
            "show": true,
            "when": "QA6",
            "eq": "true"
        },
        "type": "panel",
        "label": "QA6 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi A6, kasus 1: Bongkar dan ganti kayu yang lapuk, bengkok, dimakan rayap dan rusak yang parah (perlu perancah)",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "A6_K1",
            "conditional": {
                "show": true,
                "when": "QA6",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "right",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "inputType": "checkbox",
            "dataGridLabel": true,
            "value": "",
            "name": "",
            "id": "eckgsw"
        }, {
            "label": "A6 K1 Panjang kayu yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "a6C1_input",
            "conditional": {
                "show": true,
                "when": "A6_K1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "es7h57"
        }, {
            "label": "A6_C1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"A6_C1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi612CmX4MPcs\":0.25,\"kepalaTukangOh\":0.011,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.006,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.244,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0,\"pekerjaOh\":0.481,\"semenSak\":0,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.233,\"kayuKelasIi57CmX4MPcs\":1.071,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eab0d9106b223d64dca62\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a6C1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "ex2gb9"
        }, {
            "label": "A6_C1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.a6C1UnitQuantities);\r\ntotal_a6C1_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a6C1_input);\r\ntotal_a6C1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a6C1_input;\r\ntotal_a6C1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a6C1_input;\r\ntotal_a6C1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a6C1_input;\r\ntotal_a6C1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a6C1_input;\r\ntotal_a6C1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a6C1_input;\r\ntotal_a6C1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a6C1_input;\r\ntotal_a6C1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a6C1_input;\r\ntotal_a6C1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a6C1_input;\r\ntotal_a6C1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a6C1_input;\r\ntotal_a6C1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a6C1_input;\r\ntotal_a6C1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a6C1_input;\r\ntotal_a6C1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a6C1_input;\r\ntotal_a6C1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a6C1_input;\r\ntotal_a6C1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a6C1_input;\r\ntotal_a6C1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a6C1_input;\r\ntotal_a6C1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a6C1_input;\r\ntotal_a6C1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a6C1_input;\r\ntotal_a6C1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a6C1_input;\r\ntotal_a6C1_semenSak_price = v1.semenSak_price * v2.semenSak * data.a6C1_input;\r\ntotal_a6C1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a6C1_input;\r\ntotal_a6C1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a6C1_input;\r\ntotal_a6C1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a6C1_input;\r\ntotal_a6C1_price = total_a6C1_bataMerahPcs_price + total_a6C1_batuKaliM3_price + total_a6C1_bautJLPcs_price + total_a6C1_besiPolos8MmX12MPcs_price + total_a6C1_besiUlir10MmX12MPcs_price + total_a6C1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a6C1_kawatBetonKg_price + total_a6C1_kayuKelasIi57CmX4MPcs_price + total_a6C1_kayuKelasIi612CmX4MPcs_price + total_a6C1_kepalaTukangOh_price + total_a6C1_kerikilM3_price + total_a6C1_lemKayuKg_price + total_a6C1_mandorOh_price + total_a6C1_minyakBekistingLtr_price + total_a6C1_paku57CmKg_price + total_a6C1_pakuPayungKg_price + total_a6C1_papan325CmPcs_price + total_a6C1_pasirM3_price + total_a6C1_pekerjaOh_price + total_a6C1_semenSak_price + total_a6C1_sengBjlsPcs_price + total_a6C1_tripleks9MmPcs_price + total_a6C1_tukangOh_price;\r\n\r\nif (isNaN(total_a6C1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a6C1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "a6C1TotalPrice",
            "conditional": {
                "show": true,
                "when": "A6_K1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "e8ff8wa"
        }, {
            "label": "Aksi A6, kasus 2: Bongkar dan ganti kayu yang lapuk, bengkok, dimakan rayap dan rusak yang parah (tidak perlu perancah)",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "A6_K2",
            "conditional": {
                "show": true,
                "when": "QA6",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "right",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "inputType": "checkbox",
            "dataGridLabel": true,
            "value": "",
            "name": "",
            "id": "eb443xc"
        }, {
            "label": "A6 K2 Panjang kayu yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "a6C2_input",
            "conditional": {
                "show": true,
                "when": "A6_K2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "e823vdv"
        }, {
            "label": "A6_C2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"A6_C2\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0.25,\"kepalaTukangOh\":0.009,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.009,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.004,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0,\"pekerjaOh\":0.1,\"semenSak\":0,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.05,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eac4c9106b225213b8bc2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "a6C2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "conditional": {
                "show": null,
                "when": null,
                "eq": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "eveq8bc"
        }, {
            "label": "A6_C2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.a6C2UnitQuantities);\r\ntotal_a6C2_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a6C2_input);\r\ntotal_a6C2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a6C2_input;\r\ntotal_a6C2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a6C2_input;\r\ntotal_a6C2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a6C2_input;\r\ntotal_a6C2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a6C2_input;\r\ntotal_a6C2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a6C2_input;\r\ntotal_a6C2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a6C2_input;\r\ntotal_a6C2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a6C2_input;\r\ntotal_a6C2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a6C2_input;\r\ntotal_a6C2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a6C2_input;\r\ntotal_a6C2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a6C2_input;\r\ntotal_a6C2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a6C2_input;\r\ntotal_a6C2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a6C2_input;\r\ntotal_a6C2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a6C2_input;\r\ntotal_a6C2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a6C2_input;\r\ntotal_a6C2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a6C2_input;\r\ntotal_a6C2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a6C2_input;\r\ntotal_a6C2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a6C2_input;\r\ntotal_a6C2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a6C2_input;\r\ntotal_a6C2_semenSak_price = v1.semenSak_price * v2.semenSak * data.a6C2_input;\r\ntotal_a6C2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a6C2_input;\r\ntotal_a6C2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a6C2_input;\r\ntotal_a6C2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a6C2_input;\r\ntotal_a6C2_price = total_a6C2_bataMerahPcs_price + total_a6C2_batuKaliM3_price + total_a6C2_bautJLPcs_price + total_a6C2_besiPolos8MmX12MPcs_price + total_a6C2_besiUlir10MmX12MPcs_price + total_a6C2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a6C2_kawatBetonKg_price + total_a6C2_kayuKelasIi57CmX4MPcs_price + total_a6C2_kayuKelasIi612CmX4MPcs_price + total_a6C2_kepalaTukangOh_price + total_a6C2_kerikilM3_price + total_a6C2_lemKayuKg_price + total_a6C2_mandorOh_price + total_a6C2_minyakBekistingLtr_price + total_a6C2_paku57CmKg_price + total_a6C2_pakuPayungKg_price + total_a6C2_papan325CmPcs_price + total_a6C2_pasirM3_price + total_a6C2_pekerjaOh_price + total_a6C2_semenSak_price + total_a6C2_sengBjlsPcs_price + total_a6C2_tripleks9MmPcs_price + total_a6C2_tukangOh_price;\r\n\r\nif (isNaN(total_a6C2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a6C2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "a6C2TotalPrice",
            "conditional": {
                "show": true,
                "when": "A6_K2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "ec27u18"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "eefrzjm"
    }],
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false,
    "placeholder": "",
    "prefix": "",
    "customClass": "",
    "suffix": "",
    "multiple": false,
    "defaultValue": null,
    "protected": false,
    "unique": false,
    "persistent": false,
    "hidden": false,
    "clearOnHide": false,
    "refreshOn": "",
    "redrawOn": "",
    "modalEdit": false,
    "labelPosition": "top",
    "description": "",
    "errorLabel": "",
    "tooltip": "",
    "hideLabel": false,
    "tabindex": "",
    "disabled": false,
    "autofocus": false,
    "dbIndex": false,
    "customDefaultValue": "",
    "calculateValue": "",
    "calculateServer": false,
    "widget": null,
    "attributes": [],
    "validateOn": "change",
    "validate": {
        "required": false,
        "custom": "",
        "customPrivate": false,
        "strictDateValidation": false,
        "multiple": false,
        "unique": false
    },
    "conditional": {
        "show": null,
        "when": null,
        "eq": ""
    },
    "overlay": {
        "style": "",
        "left": "",
        "top": "",
        "width": "",
        "height": ""
    },
    "allowCalculateOverride": false,
    "encrypted": false,
    "showCharCount": false,
    "showWordCount": false,
    "properties": [],
    "allowMultipleMasks": false,
    "tree": false,
    "theme": "default",
    "breadcrumb": "default",
    "id": "ezmg4nf"
}, {
    "title": "QB: Tiang Beton",
    "label": "QB: Tiang Beton",
    "type": "panel",
    "key": "QB",
    "components": [{
        "label": "QB1: Tidak ada tiang beton di sudut dinding",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QB1",
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "ekj127a"
    }, {
        "title": "Aksi QB1",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqb1",
        "conditional": {
            "show": true,
            "when": "QB1",
            "eq": "true"
        },
        "type": "panel",
        "label": "QB1 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi B1",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi B1: Pasang tiang beton bertulang pada sudut dinding.",
            "refreshOnChange": false,
            "tableView": false,
            "key": "B1",
            "conditional": {
                "show": true,
                "when": "QB1",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": false,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "tag": "p",
            "id": "eq0uugu"
        }, {
            "label": "B1 Jumlah tiang, bh:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "b1_input",
            "conditional": {
                "show": true,
                "when": "QB1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "em20wj6"
        }, {
            "label": "B1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"B1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.202,\"kayuKelasIi57CmX4MPcs\":2.235,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.067,\"kerikilM3\":0.05,\"lemKayuKg\":0,\"mandorOh\":0.139,\"minyakBekistingLtr\":0.212,\"paku57CmKg\":0.427,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.046,\"pekerjaOh\":1.972,\"semenSak\":0.772,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.665,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":1.267,\"id\":\"5f0e89be9106b204b1763fb2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "b1UnitQuantities",
            "conditional": {
                "show": 0,
                "when": 0,
                "eq": ""
            },
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "e7opw6l"
        }, {
            "label": "B1 total price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "redrawOn": 0,
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.b1UnitQuantities);\r\ntotal_b1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.b1_input;\r\ntotal_b1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.b1_input;\r\ntotal_b1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.b1_input;\r\ntotal_b1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.b1_input;\r\ntotal_b1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.b1_input;\r\ntotal_b1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.b1_input;\r\ntotal_b1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.b1_input;\r\ntotal_b1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.b1_input;\r\ntotal_b1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.b1_input;\r\ntotal_b1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.b1_input;\r\ntotal_b1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.b1_input;\r\ntotal_b1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.b1_input;\r\ntotal_b1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.b1_input;\r\ntotal_b1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.b1_input;\r\ntotal_b1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.b1_input;\r\ntotal_b1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.b1_input;\r\ntotal_b1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.b1_input;\r\ntotal_b1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.b1_input;\r\ntotal_b1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.b1_input;\r\ntotal_b1_semenSak_price = v1.semenSak_price * v2.semenSak * data.b1_input;\r\ntotal_b1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.b1_input;\r\ntotal_b1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.b1_input;\r\ntotal_b1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.b1_input;\r\ntotal_b1_price = total_b1_bataMerahPcs_price + total_b1_batuKaliM3_price + total_b1_bautJLPcs_price + total_b1_besiPolos8MmX12MPcs_price + total_b1_besiUlir10MmX12MPcs_price + total_b1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_b1_kawatBetonKg_price + total_b1_kayuKelasIi57CmX4MPcs_price + total_b1_kayuKelasIi612CmX4MPcs_price + total_b1_kepalaTukangOh_price + total_b1_kerikilM3_price + total_b1_lemKayuKg_price + total_b1_mandorOh_price + total_b1_minyakBekistingLtr_price + total_b1_paku57CmKg_price + total_b1_pakuPayungKg_price + total_b1_papan325CmPcs_price + total_b1_pasirM3_price + total_b1_pekerjaOh_price + total_b1_semenSak_price + total_b1_sengBjlsPcs_price + total_b1_tripleks9MmPcs_price + total_b1_tukangOh_price;\r\n\r\nif (isNaN(total_b1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_b1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "validate": {
                "min": 0,
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "max": "",
                "step": "any",
                "integer": ""
            },
            "key": "b1TotalPrice",
            "conditional": {
                "show": true,
                "when": "QB1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "e7g9ivh"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "e4vdtub"
    }, {
        "label": "QB2: Tidak ada tiang beton pada di pertemuan dinding",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QB2",
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "conditional": {
            "show": null,
            "when": null,
            "eq": ""
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "eac1d3"
    }, {
        "title": "Aksi QB2 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqb2",
        "conditional": {
            "show": true,
            "when": "QB2",
            "eq": "true"
        },
        "type": "panel",
        "label": "QB2 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi B2",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi B2: Pasang tiang beton bertulang pada pertemuan dinding.",
            "refreshOnChange": false,
            "tableView": false,
            "key": "B2",
            "conditional": {
                "show": true,
                "when": "QB2",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": false,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "tag": "p",
            "id": "exmfxz8"
        }, {
            "label": "B2 Jumlah tiang, bh:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "b2_input",
            "conditional": {
                "show": true,
                "when": "QB2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "excv57h"
        }, {
            "label": "B2 Unity Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "disabled": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"B2\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.202,\"kayuKelasIi57CmX4MPcs\":1.777,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.056,\"kerikilM3\":0.05,\"lemKayuKg\":0,\"mandorOh\":0.115,\"minyakBekistingLtr\":0.122,\"paku57CmKg\":0.234,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.046,\"pekerjaOh\":1.736,\"semenSak\":0.772,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.078,\"tukangOh\":0.558,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":1.267,\"id\":\"5f0ead6a9106b226f70caf62\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "b2UnitQuantities",
            "conditional": {
                "show": 0,
                "when": 0,
                "eq": ""
            },
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "efvcv49"
        }, {
            "label": "B2 total price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.b2UnitQuantities);\r\n\r\ntotal_b2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.b2_input;\r\ntotal_b2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.b2_input;\r\ntotal_b2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.b2_input;\r\ntotal_b2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.b2_input;\r\ntotal_b2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.b2_input;\r\ntotal_b2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.b2_input;\r\ntotal_b2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.b2_input;\r\ntotal_b2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.b2_input;\r\ntotal_b2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.b2_input;\r\ntotal_b2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.b2_input;\r\ntotal_b2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.b2_input;\r\ntotal_b2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.b2_input;\r\ntotal_b2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.b2_input;\r\ntotal_b2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.b2_input;\r\ntotal_b2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.b2_input;\r\ntotal_b2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.b2_input;\r\ntotal_b2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.b2_input;\r\ntotal_b2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.b2_input;\r\ntotal_b2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.b2_input;\r\ntotal_b2_semenSak_price = v1.semenSak_price * v2.semenSak * data.b2_input;\r\ntotal_b2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.b2_input;\r\ntotal_b2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.b2_input;\r\ntotal_b2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.b2_input;\r\ntotal_b2_price = total_b2_bataMerahPcs_price + total_b2_batuKaliM3_price + total_b2_bautJLPcs_price + total_b2_besiPolos8MmX12MPcs_price + total_b2_besiUlir10MmX12MPcs_price + total_b2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_b2_kawatBetonKg_price + total_b2_kayuKelasIi57CmX4MPcs_price + total_b2_kayuKelasIi612CmX4MPcs_price + total_b2_kepalaTukangOh_price + total_b2_kerikilM3_price + total_b2_lemKayuKg_price + total_b2_mandorOh_price + total_b2_minyakBekistingLtr_price + total_b2_paku57CmKg_price + total_b2_pakuPayungKg_price + total_b2_papan325CmPcs_price + total_b2_pasirM3_price + total_b2_pekerjaOh_price + total_b2_semenSak_price + total_b2_sengBjlsPcs_price + total_b2_tripleks9MmPcs_price + total_b2_tukangOh_price;\r\n\r\nif (isNaN(total_b2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_b2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "validate": {
                "min": 0,
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "max": "",
                "step": "any",
                "integer": ""
            },
            "key": "b2TotalPrice",
            "conditional": {
                "show": true,
                "when": "QB2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "eru1zc"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "exr96lwh"
    }, {
        "label": "QB3: Tidak ada tiang beton pada di ujung dinding.",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QB3",
        "conditional": {
            "show": 0,
            "when": null,
            "eq": ""
        },
        "type": "checkbox",
        "input": true,
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "right",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "inputType": "checkbox",
        "dataGridLabel": true,
        "value": "",
        "name": "",
        "id": "eof601h"
    }, {
        "title": "Aksi QB3 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqb3",
        "conditional": {
            "show": true,
            "when": "QB3",
            "eq": "true"
        },
        "type": "panel",
        "label": "QB3 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi B3",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi B3: Pasang tiang beton bertulang pada ujung dinding.",
            "refreshOnChange": false,
            "tableView": false,
            "key": "B3",
            "conditional": {
                "show": true,
                "when": "QB3",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": null,
            "protected": false,
            "unique": false,
            "persistent": false,
            "hidden": false,
            "clearOnHide": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "calculateServer": false,
            "widget": null,
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "tag": "p",
            "id": "ex6gq19"
        }, {
            "label": "B3 Jumlah tiang, bh:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "b3_input",
            "conditional": {
                "show": true,
                "when": "QB3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "disabled": false,
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "min": "",
                "max": "",
                "step": "any",
                "integer": ""
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "euaba8l"
        }, {
            "label": "B3 Unity Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "disabled": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"B3\",\"bataMerahPcs\":0,\"batuKaliM3\":0.227,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.202,\"kayuKelasIi57CmX4MPcs\":1.374,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.058,\"kerikilM3\":0.039,\"lemKayuKg\":0,\"mandorOh\":0.102,\"minyakBekistingLtr\":0.27,\"paku57CmKg\":0.581,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.127,\"pekerjaOh\":1.384,\"semenSak\":1.548,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":1.73,\"tukangOh\":0.575,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":1.267,\"id\":\"5f0eade39106b227a201ce02\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS",
                "json": "",
                "url": "",
                "custom": ""
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "B3UnitQuantities",
            "conditional": {
                "show": 0,
                "when": 0,
                "eq": ""
            },
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "calculateValue": "",
            "attributes": [],
            "validateOn": "change",
            "validate": {
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false
            },
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "clearOnRefresh": false,
            "limit": 100,
            "valueProperty": "",
            "lazyLoad": true,
            "filter": "",
            "searchEnabled": true,
            "searchField": "",
            "minSearch": 0,
            "readOnlyValue": false,
            "authenticate": false,
            "template": "<span>{{ item.label }}<\/span>",
            "searchThreshold": 0.3,
            "uniqueOptions": false,
            "fuseOptions": {
                "include": "score",
                "threshold": 0.3
            },
            "customOptions": [],
            "id": "ewi279o"
        }, {
            "label": "B3 total price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.B3UnitQuantities);\r\n\r\ntotal_b3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.b3_input;\r\ntotal_b3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.b3_input;\r\ntotal_b3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.b3_input;\r\ntotal_b3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.b3_input;\r\ntotal_b3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.b3_input;\r\ntotal_b3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.b3_input;\r\ntotal_b3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.b3_input;\r\ntotal_b3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.b3_input;\r\ntotal_b3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.b3_input;\r\ntotal_b3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.b3_input;\r\ntotal_b3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.b3_input;\r\ntotal_b3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.b3_input;\r\ntotal_b3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.b3_input;\r\ntotal_b3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.b3_input;\r\ntotal_b3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.b3_input;\r\ntotal_b3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.b3_input;\r\ntotal_b3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.b3_input;\r\ntotal_b3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.b3_input;\r\ntotal_b3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.b3_input;\r\ntotal_b3_semenSak_price = v1.semenSak_price * v2.semenSak * data.b3_input;\r\ntotal_b3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.b3_input;\r\ntotal_b3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.b3_input;\r\ntotal_b3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.b3_input;\r\ntotal_b3_price = total_b3_bataMerahPcs_price + total_b3_batuKaliM3_price + total_b3_bautJLPcs_price + total_b3_besiPolos8MmX12MPcs_price + total_b3_besiUlir10MmX12MPcs_price + total_b3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_b3_kawatBetonKg_price + total_b3_kayuKelasIi57CmX4MPcs_price + total_b3_kayuKelasIi612CmX4MPcs_price + total_b3_kepalaTukangOh_price + total_b3_kerikilM3_price + total_b3_lemKayuKg_price + total_b3_mandorOh_price + total_b3_minyakBekistingLtr_price + total_b3_paku57CmKg_price + total_b3_pakuPayungKg_price + total_b3_papan325CmPcs_price + total_b3_pasirM3_price + total_b3_pekerjaOh_price + total_b3_semenSak_price + total_b3_sengBjlsPcs_price + total_b3_tripleks9MmPcs_price + total_b3_tukangOh_price;\r\n\r\nif (isNaN(total_b3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_b3_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "validate": {
                "min": 0,
                "required": false,
                "custom": "",
                "customPrivate": false,
                "strictDateValidation": false,
                "multiple": false,
                "unique": false,
                "max": "",
                "step": "any",
                "integer": ""
            },
            "key": "b3TotalPrice",
            "conditional": {
                "show": true,
                "when": "QB3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0,
            "placeholder": "",
            "prefix": "",
            "customClass": "",
            "suffix": "",
            "multiple": false,
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "refreshOn": "",
            "redrawOn": "",
            "modalEdit": false,
            "labelPosition": "top",
            "description": "",
            "errorLabel": "",
            "tooltip": "",
            "hideLabel": false,
            "tabindex": "",
            "autofocus": false,
            "dbIndex": false,
            "customDefaultValue": "",
            "widget": {
                "type": "input"
            },
            "attributes": [],
            "validateOn": "change",
            "overlay": {
                "style": "",
                "left": "",
                "top": "",
                "width": "",
                "height": ""
            },
            "allowCalculateOverride": false,
            "encrypted": false,
            "showCharCount": false,
            "showWordCount": false,
            "properties": [],
            "allowMultipleMasks": false,
            "id": "epg0t"
        }],
        "placeholder": "",
        "prefix": "",
        "customClass": "",
        "suffix": "",
        "multiple": false,
        "defaultValue": null,
        "protected": false,
        "unique": false,
        "persistent": false,
        "hidden": false,
        "clearOnHide": false,
        "refreshOn": "",
        "redrawOn": "",
        "modalEdit": false,
        "labelPosition": "top",
        "description": "",
        "errorLabel": "",
        "tooltip": "",
        "hideLabel": false,
        "tabindex": "",
        "disabled": false,
        "autofocus": false,
        "dbIndex": false,
        "customDefaultValue": "",
        "calculateValue": "",
        "calculateServer": false,
        "widget": null,
        "attributes": [],
        "validateOn": "change",
        "validate": {
            "required": false,
            "custom": "",
            "customPrivate": false,
            "strictDateValidation": false,
            "multiple": false,
            "unique": false
        },
        "overlay": {
            "style": "",
            "left": "",
            "top": "",
            "width": "",
            "height": ""
        },
        "allowCalculateOverride": false,
        "encrypted": false,
        "showCharCount": false,
        "showWordCount": false,
        "properties": [],
        "allowMultipleMasks": false,
        "tree": false,
        "theme": "default",
        "breadcrumb": "default",
        "id": "e4tivhf"
    }],
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false,
    "placeholder": "",
    "prefix": "",
    "customClass": "",
    "suffix": "",
    "multiple": false,
    "defaultValue": null,
    "protected": false,
    "unique": false,
    "persistent": false,
    "hidden": false,
    "clearOnHide": false,
    "refreshOn": "",
    "redrawOn": "",
    "modalEdit": false,
    "labelPosition": "top",
    "description": "",
    "errorLabel": "",
    "tooltip": "",
    "hideLabel": false,
    "tabindex": "",
    "disabled": false,
    "autofocus": false,
    "dbIndex": false,
    "customDefaultValue": "",
    "calculateValue": "",
    "calculateServer": false,
    "widget": null,
    "attributes": [],
    "validateOn": "change",
    "validate": {
        "required": false,
        "custom": "",
        "customPrivate": false,
        "strictDateValidation": false,
        "multiple": false,
        "unique": false
    },
    "conditional": {
        "show": null,
        "when": null,
        "eq": ""
    },
    "overlay": {
        "style": "",
        "left": "",
        "top": "",
        "width": "",
        "height": ""
    },
    "allowCalculateOverride": false,
    "encrypted": false,
    "showCharCount": false,
    "showWordCount": false,
    "properties": [],
    "allowMultipleMasks": false,
    "tree": false,
    "theme": "default",
    "breadcrumb": "default",
    "id": "ehg1rgn"
}, {
    "title": "QC: Lubang Dinding (Pintu & Jendela)",
    "label": "QC: Luban Dinding (Pintu & Jendela)",
    "type": "panel",
    "key": "QC",
    "components": [{
        "label": "QC1 Sisi depan bangunan, panjang dinding solidnya kurang dari 1.5m",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QC1",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Opsi Aksi QC1",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "opsiAksiQc1",
        "conditional": {
            "show": true,
            "when": "QC1",
            "eq": "true"
        },
        "type": "panel",
        "label": "Panel",
        "input": false,
        "components": [{
            "label": "Aksi C1, Opsi 1: Kurangi ukuran lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "calculateServer": false,
            "key": "C1_O1",
            "type": "checkbox",
            "input": true,
            "defaultValue": false
        }, {
            "label": "C1 O1 Luas lubang yang dikurangi, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c1O1_input",
            "conditional": {
                "show": true,
                "when": "C1_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }, {
            "label": "C1_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C1_O1\",\"bataMerahPcs\":70,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.17,\"kayuKelasIi57CmX4MPcs\":1.547,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.1,\"kerikilM3\":0.033,\"lemKayuKg\":0,\"mandorOh\":0.12,\"minyakBekistingLtr\":0.314,\"paku57CmKg\":0.636,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.116,\"pekerjaOh\":2.1,\"semenSak\":1.25,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.201,\"tukangOh\":1.73,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":0.95,\"id\":\"5f0eae3d9106b227f67ce362\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c1O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C1_O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c1O1UnitQuantities);\r\ntotal_c1O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c1O1_input;\r\ntotal_c1O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c1O1_input;\r\ntotal_c1O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c1O1_input;\r\ntotal_c1O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c1O1_input;\r\ntotal_c1O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c1O1_input;\r\ntotal_c1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c1O1_input;\r\ntotal_c1O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c1O1_input;\r\ntotal_c1O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c1O1_input;\r\ntotal_c1O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c1O1_input;\r\ntotal_c1O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c1O1_input;\r\ntotal_c1O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c1O1_input;\r\ntotal_c1O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c1O1_input;\r\ntotal_c1O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c1O1_input;\r\ntotal_c1O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c1O1_input;\r\ntotal_c1O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c1O1_input;\r\ntotal_c1O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c1O1_input;\r\ntotal_c1O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c1O1_input;\r\ntotal_c1O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c1O1_input;\r\ntotal_c1O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c1O1_input;\r\ntotal_c1O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c1O1_input;\r\ntotal_c1O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c1O1_input;\r\ntotal_c1O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c1O1_input;\r\ntotal_c1O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c1O1_input;\r\ntotal_c1O1_price = total_c1O1_bataMerahPcs_price + total_c1O1_batuKaliM3_price + total_c1O1_bautJLPcs_price + total_c1O1_besiPolos8MmX12MPcs_price + total_c1O1_besiUlir10MmX12MPcs_price + total_c1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c1O1_kawatBetonKg_price + total_c1O1_kayuKelasIi57CmX4MPcs_price + total_c1O1_kayuKelasIi612CmX4MPcs_price + total_c1O1_kepalaTukangOh_price + total_c1O1_kerikilM3_price + total_c1O1_lemKayuKg_price + total_c1O1_mandorOh_price + total_c1O1_minyakBekistingLtr_price + total_c1O1_paku57CmKg_price + total_c1O1_pakuPayungKg_price + total_c1O1_papan325CmPcs_price + total_c1O1_pasirM3_price + total_c1O1_pekerjaOh_price + total_c1O1_semenSak_price + total_c1O1_sengBjlsPcs_price + total_c1O1_tripleks9MmPcs_price + total_c1O1_tukangOh_price;\r\n\r\nif (isNaN(total_c1O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c1O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c1O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "C1_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C1, Opsi 2: Geser lubang dinding ke sebelah tiang, hal ini membuat dinding menjadi lebih kokoh",
            "shortcut": 0,
            "tableView": false,
            "calculateServer": false,
            "key": "C1_O2",
            "type": "checkbox",
            "input": true,
            "defaultValue": false
        }, {
            "label": "C1 O2 Luas lubang yang dikurangi, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c1O2_input",
            "conditional": {
                "show": true,
                "when": "C1_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }, {
            "label": "C1_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C1_O2\",\"bataMerahPcs\":70,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.01,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.02,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.086,\"pekerjaOh\":0.3,\"semenSak\":0.748,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.87,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eae749106b228297959d2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c1O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C1 O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c1O2UnitQuantities);\r\ntotal_c1O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c1O2_input;\r\ntotal_c1O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c1O2_input;\r\ntotal_c1O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c1O2_input;\r\ntotal_c1O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c1O2_input;\r\ntotal_c1O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c1O2_input;\r\ntotal_c1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c1O2_input;\r\ntotal_c1O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c1O2_input;\r\ntotal_c1O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c1O2_input;\r\ntotal_c1O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c1O2_input;\r\ntotal_c1O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c1O2_input;\r\ntotal_c1O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c1O2_input;\r\ntotal_c1O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c1O2_input;\r\ntotal_c1O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c1O2_input;\r\ntotal_c1O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c1O2_input;\r\ntotal_c1O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c1O2_input;\r\ntotal_c1O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c1O2_input;\r\ntotal_c1O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c1O2_input;\r\ntotal_c1O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c1O2_input;\r\ntotal_c1O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c1O2_input;\r\ntotal_c1O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c1O2_input;\r\ntotal_c1O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c1O2_input;\r\ntotal_c1O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c1O2_input;\r\ntotal_c1O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c1O2_input;\r\ntotal_c1O2_price = total_c1O2_bataMerahPcs_price + total_c1O2_batuKaliM3_price + total_c1O2_bautJLPcs_price + total_c1O2_besiPolos8MmX12MPcs_price + total_c1O2_besiUlir10MmX12MPcs_price + total_c1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c1O2_kawatBetonKg_price + total_c1O2_kayuKelasIi57CmX4MPcs_price + total_c1O2_kayuKelasIi612CmX4MPcs_price + total_c1O2_kepalaTukangOh_price + total_c1O2_kerikilM3_price + total_c1O2_lemKayuKg_price + total_c1O2_mandorOh_price + total_c1O2_minyakBekistingLtr_price + total_c1O2_paku57CmKg_price + total_c1O2_pakuPayungKg_price + total_c1O2_papan325CmPcs_price + total_c1O2_pasirM3_price + total_c1O2_pekerjaOh_price + total_c1O2_semenSak_price + total_c1O2_sengBjlsPcs_price + total_c1O2_tripleks9MmPcs_price + total_c1O2_tukangOh_price;\r\n\r\nif (isNaN(total_c1O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c1O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c1O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "C1_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C1, Opsi 3: pasang kawat anyam, lalu plester dinding di antara lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C1_O3",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C1 O3 Panjang dinding antara lubang, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c1O3_input",
            "conditional": {
                "show": true,
                "when": "C1_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }, {
            "label": "C1_O3 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C1_O3\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0.197,\"kawatBetonKg\":0.18,\"kayuKelasIi57CmX4MPcs\":0.471,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.105,\"kerikilM3\":0.014,\"lemKayuKg\":0,\"mandorOh\":0.116,\"minyakBekistingLtr\":0.12,\"paku57CmKg\":0.15,\"pakuPayungKg\":0.336,\"papan325CmPcs\":0,\"pasirM3\":0.151,\"pekerjaOh\":2.139,\"semenSak\":1.382,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.077,\"tukangOh\":1.156,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0.167,\"id\":\"5f0eaf049106b228f42c4d02\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c1O3UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C1 O3 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c1O3UnitQuantities);\r\ntotal_c1O3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c1O3_input;\r\ntotal_c1O3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c1O3_input;\r\ntotal_c1O3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c1O3_input;\r\ntotal_c1O3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c1O3_input;\r\ntotal_c1O3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c1O3_input;\r\ntotal_c1O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c1O3_input;\r\ntotal_c1O3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c1O3_input;\r\ntotal_c1O3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c1O3_input;\r\ntotal_c1O3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c1O3_input;\r\ntotal_c1O3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c1O3_input;\r\ntotal_c1O3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c1O3_input;\r\ntotal_c1O3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c1O3_input;\r\ntotal_c1O3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c1O3_input;\r\ntotal_c1O3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c1O3_input;\r\ntotal_c1O3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c1O3_input;\r\ntotal_c1O3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c1O3_input;\r\ntotal_c1O3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c1O3_input;\r\ntotal_c1O3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c1O3_input;\r\ntotal_c1O3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c1O3_input;\r\ntotal_c1O3_semenSak_price = v1.semenSak_price * v2.semenSak * data.c1O3_input;\r\ntotal_c1O3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c1O3_input;\r\ntotal_c1O3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c1O3_input;\r\ntotal_c1O3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c1O3_input;\r\ntotal_c1O3_price = total_c1O3_bataMerahPcs_price + total_c1O3_batuKaliM3_price + total_c1O3_bautJLPcs_price + total_c1O3_besiPolos8MmX12MPcs_price + total_c1O3_besiUlir10MmX12MPcs_price + total_c1O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c1O3_kawatBetonKg_price + total_c1O3_kayuKelasIi57CmX4MPcs_price + total_c1O3_kayuKelasIi612CmX4MPcs_price + total_c1O3_kepalaTukangOh_price + total_c1O3_kerikilM3_price + total_c1O3_lemKayuKg_price + total_c1O3_mandorOh_price + total_c1O3_minyakBekistingLtr_price + total_c1O3_paku57CmKg_price + total_c1O3_pakuPayungKg_price + total_c1O3_papan325CmPcs_price + total_c1O3_pasirM3_price + total_c1O3_pekerjaOh_price + total_c1O3_semenSak_price + total_c1O3_sengBjlsPcs_price + total_c1O3_tripleks9MmPcs_price + total_c1O3_tukangOh_price;\r\n\r\nif (isNaN(total_c1O3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c1O3_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c1O3TotalPrice",
            "conditional": {
                "show": true,
                "when": "C1_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QC2: Sisi belakang bangunan, panjang dinding solidnya kurang dari 1.5m",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QC2",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Opsi Aksi QC2",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "opsiAksiQc2",
        "conditional": {
            "show": true,
            "when": "QC2",
            "eq": "true"
        },
        "type": "panel",
        "label": "Opsi Aksi QC2",
        "input": false,
        "components": [{
            "label": "Aksi C2, Opsi 1: Kurangi ukuran lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C2_O1",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C2 O1 Luas lubang yang dikurangi, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c2O1_input",
            "conditional": {
                "show": true,
                "when": "C2_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }, {
            "label": "C2_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C2_O1\",\"bataMerahPcs\":70,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.17,\"kayuKelasIi57CmX4MPcs\":1.547,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.1,\"kerikilM3\":0.033,\"lemKayuKg\":0,\"mandorOh\":0.12,\"minyakBekistingLtr\":0.314,\"paku57CmKg\":0.636,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.116,\"pekerjaOh\":2.1,\"semenSak\":1.25,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.201,\"tukangOh\":1.73,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":0.95,\"id\":\"5f0eaf749106b2294f3ef8e2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c2O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C2 O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c2O1UnitQuantities);\r\ntotal_c2O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c2O1_input;\r\ntotal_c2O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c2O1_input;\r\ntotal_c2O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c2O1_input;\r\ntotal_c2O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c2O1_input;\r\ntotal_c2O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c2O1_input;\r\ntotal_c2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c2O1_input;\r\ntotal_c2O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c2O1_input;\r\ntotal_c2O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c2O1_input;\r\ntotal_c2O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c2O1_input;\r\ntotal_c2O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c2O1_input;\r\ntotal_c2O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c2O1_input;\r\ntotal_c2O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c2O1_input;\r\ntotal_c2O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c2O1_input;\r\ntotal_c2O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c2O1_input;\r\ntotal_c2O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c2O1_input;\r\ntotal_c2O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c2O1_input;\r\ntotal_c2O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c2O1_input;\r\ntotal_c2O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c2O1_input;\r\ntotal_c2O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c2O1_input;\r\ntotal_c2O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c2O1_input;\r\ntotal_c2O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c2O1_input;\r\ntotal_c2O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c2O1_input;\r\ntotal_c2O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c2O1_input;\r\ntotal_c2O1_price = total_c2O1_bataMerahPcs_price + total_c2O1_batuKaliM3_price + total_c2O1_bautJLPcs_price + total_c2O1_besiPolos8MmX12MPcs_price + total_c2O1_besiUlir10MmX12MPcs_price + total_c2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c2O1_kawatBetonKg_price + total_c2O1_kayuKelasIi57CmX4MPcs_price + total_c2O1_kayuKelasIi612CmX4MPcs_price + total_c2O1_kepalaTukangOh_price + total_c2O1_kerikilM3_price + total_c2O1_lemKayuKg_price + total_c2O1_mandorOh_price + total_c2O1_minyakBekistingLtr_price + total_c2O1_paku57CmKg_price + total_c2O1_pakuPayungKg_price + total_c2O1_papan325CmPcs_price + total_c2O1_pasirM3_price + total_c2O1_pekerjaOh_price + total_c2O1_semenSak_price + total_c2O1_sengBjlsPcs_price + total_c2O1_tripleks9MmPcs_price + total_c2O1_tukangOh_price;\r\n\r\nif (isNaN(total_c2O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c2O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c2O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "C2_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C2, Opsi 2: Geser lubang dinding ke sebelah tiang, hal ini membuat dinding menjadi lebih kokoh",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C2_O2",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C2 O2 Luas lubang yang dikurangi, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "c2O2_input",
            "conditional": {
                "show": true,
                "when": "C2_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C2_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C2_O2\",\"bataMerahPcs\":70,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.02,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.086,\"pekerjaOh\":0.3,\"semenSak\":0.748,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.87,\"kepalaTukangOh\":0.01,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eafec9106b229ce1f2052\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c2O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C2 O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c2O2UnitQuantities);\r\ntotal_c2O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c2O2_input;\r\ntotal_c2O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c2O2_input;\r\ntotal_c2O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c2O2_input;\r\ntotal_c2O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c2O2_input;\r\ntotal_c2O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c2O2_input;\r\ntotal_c2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c2O2_input;\r\ntotal_c2O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c2O2_input;\r\ntotal_c2O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c2O2_input;\r\ntotal_c2O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c2O2_input;\r\ntotal_c2O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c2O2_input;\r\ntotal_c2O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c2O2_input;\r\ntotal_c2O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c2O2_input;\r\ntotal_c2O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c2O2_input;\r\ntotal_c2O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c2O2_input;\r\ntotal_c2O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c2O2_input;\r\ntotal_c2O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c2O2_input;\r\ntotal_c2O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c2O2_input;\r\ntotal_c2O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c2O2_input;\r\ntotal_c2O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c2O2_input;\r\ntotal_c2O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c2O2_input;\r\ntotal_c2O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c2O2_input;\r\ntotal_c2O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c2O2_input;\r\ntotal_c2O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c2O2_input;\r\ntotal_c2O2_price = total_c2O2_bataMerahPcs_price + total_c2O2_batuKaliM3_price + total_c2O2_bautJLPcs_price + total_c2O2_besiPolos8MmX12MPcs_price + total_c2O2_besiUlir10MmX12MPcs_price + total_c2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c2O2_kawatBetonKg_price + total_c2O2_kayuKelasIi57CmX4MPcs_price + total_c2O2_kayuKelasIi612CmX4MPcs_price + total_c2O2_kepalaTukangOh_price + total_c2O2_kerikilM3_price + total_c2O2_lemKayuKg_price + total_c2O2_mandorOh_price + total_c2O2_minyakBekistingLtr_price + total_c2O2_paku57CmKg_price + total_c2O2_pakuPayungKg_price + total_c2O2_papan325CmPcs_price + total_c2O2_pasirM3_price + total_c2O2_pekerjaOh_price + total_c2O2_semenSak_price + total_c2O2_sengBjlsPcs_price + total_c2O2_tripleks9MmPcs_price + total_c2O2_tukangOh_price;\r\n\r\nif (isNaN(total_c2O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c2O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c2O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "C2_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C2, Opsi 3: Pasang kawat anyam, lalu plester dinding di antara lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C2_O3",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C2 O3 Panjang dinding antara lubang, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c2O3_input",
            "conditional": {
                "show": true,
                "when": "C2_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C2_O3 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C2_O3\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0.197,\"kawatBetonKg\":0.18,\"kayuKelasIi57CmX4MPcs\":0.471,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.105,\"kerikilM3\":0.014,\"lemKayuKg\":0,\"mandorOh\":0.116,\"minyakBekistingLtr\":0.12,\"paku57CmKg\":0.15,\"pakuPayungKg\":0.336,\"papan325CmPcs\":0,\"pasirM3\":0.151,\"pekerjaOh\":2.139,\"semenSak\":1.382,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.077,\"tukangOh\":1.156,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0.167,\"id\":\"5f0eb0319106b229f8210f32\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c2O3UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C2 O3 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c2O3UnitQuantities);\r\ntotal_c2O3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c2O3_input;\r\ntotal_c2O3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c2O3_input;\r\ntotal_c2O3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c2O3_input;\r\ntotal_c2O3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c2O3_input;\r\ntotal_c2O3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c2O3_input;\r\ntotal_c2O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c2O3_input;\r\ntotal_c2O3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c2O3_input;\r\ntotal_c2O3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c2O3_input;\r\ntotal_c2O3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c2O3_input;\r\ntotal_c2O3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c2O3_input;\r\ntotal_c2O3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c2O3_input;\r\ntotal_c2O3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c2O3_input;\r\ntotal_c2O3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c2O3_input;\r\ntotal_c2O3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c2O3_input;\r\ntotal_c2O3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c2O3_input;\r\ntotal_c2O3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c2O3_input;\r\ntotal_c2O3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c2O3_input;\r\ntotal_c2O3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c2O3_input;\r\ntotal_c2O3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c2O3_input;\r\ntotal_c2O3_semenSak_price = v1.semenSak_price * v2.semenSak * data.c2O3_input;\r\ntotal_c2O3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c2O3_input;\r\ntotal_c2O3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c2O3_input;\r\ntotal_c2O3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c2O3_input;\r\ntotal_c2O3_price = total_c2O3_bataMerahPcs_price + total_c2O3_batuKaliM3_price + total_c2O3_bautJLPcs_price + total_c2O3_besiPolos8MmX12MPcs_price + total_c2O3_besiUlir10MmX12MPcs_price + total_c2O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c2O3_kawatBetonKg_price + total_c2O3_kayuKelasIi57CmX4MPcs_price + total_c2O3_kayuKelasIi612CmX4MPcs_price + total_c2O3_kepalaTukangOh_price + total_c2O3_kerikilM3_price + total_c2O3_lemKayuKg_price + total_c2O3_mandorOh_price + total_c2O3_minyakBekistingLtr_price + total_c2O3_paku57CmKg_price + total_c2O3_pakuPayungKg_price + total_c2O3_papan325CmPcs_price + total_c2O3_pasirM3_price + total_c2O3_pekerjaOh_price + total_c2O3_semenSak_price + total_c2O3_sengBjlsPcs_price + total_c2O3_tripleks9MmPcs_price + total_c2O3_tukangOh_price;\r\n\r\nif (isNaN(total_c2O3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c2O3_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c2O3TotalPrice",
            "conditional": {
                "show": true,
                "when": "C2_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QC3: Sisi kiri bangunan, panjang dinding solidnya kurang dari 1.5m",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QC4",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Opsi Aksi QC3",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "opsiAksiQc3",
        "conditional": {
            "show": true,
            "when": "QC4",
            "eq": "true"
        },
        "type": "panel",
        "label": "Opsi Aksi QC2",
        "input": false,
        "components": [{
            "label": "Aksi C3, Opsi 1: Kurangi ukuran lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C3_O1",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C3 O1 Luas lubang yang dikurangi, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c3O1_input",
            "conditional": {
                "show": true,
                "when": "C3_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }, {
            "label": "C3_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C3_O1\",\"bataMerahPcs\":70,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.17,\"kayuKelasIi57CmX4MPcs\":1.547,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.1,\"kerikilM3\":0.033,\"lemKayuKg\":0,\"mandorOh\":0.12,\"minyakBekistingLtr\":0.314,\"paku57CmKg\":0.636,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.116,\"pekerjaOh\":2.1,\"semenSak\":1.25,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.201,\"tukangOh\":1.73,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":0.95,\"id\":\"5f0eb07d9106b22ab63d4f52\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c3O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C3 O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c3O1UnitQuantities);\r\ntotal_c3O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c3O1_input;\r\ntotal_c3O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c3O1_input;\r\ntotal_c3O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c3O1_input;\r\ntotal_c3O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c3O1_input;\r\ntotal_c3O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c3O1_input;\r\ntotal_c3O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c3O1_input;\r\ntotal_c3O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c3O1_input;\r\ntotal_c3O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c3O1_input;\r\ntotal_c3O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c3O1_input;\r\ntotal_c3O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c3O1_input;\r\ntotal_c3O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c3O1_input;\r\ntotal_c3O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c3O1_input;\r\ntotal_c3O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c3O1_input;\r\ntotal_c3O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c3O1_input;\r\ntotal_c3O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c3O1_input;\r\ntotal_c3O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c3O1_input;\r\ntotal_c3O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c3O1_input;\r\ntotal_c3O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c3O1_input;\r\ntotal_c3O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c3O1_input;\r\ntotal_c3O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c3O1_input;\r\ntotal_c3O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c3O1_input;\r\ntotal_c3O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c3O1_input;\r\ntotal_c3O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c3O1_input;\r\ntotal_c3O1_price = total_c3O1_bataMerahPcs_price + total_c3O1_batuKaliM3_price + total_c3O1_bautJLPcs_price + total_c3O1_besiPolos8MmX12MPcs_price + total_c3O1_besiUlir10MmX12MPcs_price + total_c3O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c3O1_kawatBetonKg_price + total_c3O1_kayuKelasIi57CmX4MPcs_price + total_c3O1_kayuKelasIi612CmX4MPcs_price + total_c3O1_kepalaTukangOh_price + total_c3O1_kerikilM3_price + total_c3O1_lemKayuKg_price + total_c3O1_mandorOh_price + total_c3O1_minyakBekistingLtr_price + total_c3O1_paku57CmKg_price + total_c3O1_pakuPayungKg_price + total_c3O1_papan325CmPcs_price + total_c3O1_pasirM3_price + total_c3O1_pekerjaOh_price + total_c3O1_semenSak_price + total_c3O1_sengBjlsPcs_price + total_c3O1_tripleks9MmPcs_price + total_c3O1_tukangOh_price;\r\n\r\nif (isNaN(total_c3O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c3O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c3O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "C3_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C3, Opsi 2: Geser lubang dinding ke sebelah tiang, hal ini membuat dinding menjadi lebih kokoh",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C3_O2",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C3 O2 Luas lubang yang dikurangi, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "c3O2_input",
            "conditional": {
                "show": true,
                "when": "C3_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C3_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C3_O2\",\"bataMerahPcs\":70,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.01,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.02,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.086,\"pekerjaOh\":0.3,\"semenSak\":0.748,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.87,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eb0bc9106b22ae441f7d2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c3O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C3 O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c3O2UnitQuantities);\r\ntotal_c3O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c3O2_input;\r\ntotal_c3O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c3O2_input;\r\ntotal_c3O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c3O2_input;\r\ntotal_c3O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c3O2_input;\r\ntotal_c3O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c3O2_input;\r\ntotal_c3O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c3O2_input;\r\ntotal_c3O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c3O2_input;\r\ntotal_c3O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c3O2_input;\r\ntotal_c3O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c3O2_input;\r\ntotal_c3O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c3O2_input;\r\ntotal_c3O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c3O2_input;\r\ntotal_c3O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c3O2_input;\r\ntotal_c3O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c3O2_input;\r\ntotal_c3O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c3O2_input;\r\ntotal_c3O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c3O2_input;\r\ntotal_c3O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c3O2_input;\r\ntotal_c3O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c3O2_input;\r\ntotal_c3O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c3O2_input;\r\ntotal_c3O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c3O2_input;\r\ntotal_c3O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c3O2_input;\r\ntotal_c3O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c3O2_input;\r\ntotal_c3O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c3O2_input;\r\ntotal_c3O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c3O2_input;\r\ntotal_c3O2_price = total_c3O2_bataMerahPcs_price + total_c3O2_batuKaliM3_price + total_c3O2_bautJLPcs_price + total_c3O2_besiPolos8MmX12MPcs_price + total_c3O2_besiUlir10MmX12MPcs_price + total_c3O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c3O2_kawatBetonKg_price + total_c3O2_kayuKelasIi57CmX4MPcs_price + total_c3O2_kayuKelasIi612CmX4MPcs_price + total_c3O2_kepalaTukangOh_price + total_c3O2_kerikilM3_price + total_c3O2_lemKayuKg_price + total_c3O2_mandorOh_price + total_c3O2_minyakBekistingLtr_price + total_c3O2_paku57CmKg_price + total_c3O2_pakuPayungKg_price + total_c3O2_papan325CmPcs_price + total_c3O2_pasirM3_price + total_c3O2_pekerjaOh_price + total_c3O2_semenSak_price + total_c3O2_sengBjlsPcs_price + total_c3O2_tripleks9MmPcs_price + total_c3O2_tukangOh_price;\r\n\r\nif (isNaN(total_c3O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c3O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c3O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "C3_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C3, Opsi 3: Pasang kawat anyam, lalu plester dinding di antara lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C3_O3",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C3 O3 Panjang dinding antara lubang, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c3O3_input",
            "conditional": {
                "show": true,
                "when": "C3_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C3_O3 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C3_O3\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0.197,\"kawatBetonKg\":0.18,\"kayuKelasIi57CmX4MPcs\":0.471,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.105,\"kerikilM3\":0.014,\"lemKayuKg\":0,\"mandorOh\":0.116,\"minyakBekistingLtr\":0.12,\"paku57CmKg\":0.15,\"pakuPayungKg\":0.336,\"papan325CmPcs\":0,\"pasirM3\":0.151,\"pekerjaOh\":2.139,\"semenSak\":1.382,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.077,\"tukangOh\":1.156,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0.167,\"id\":\"5f0eb1de9106b22c2c53bb12\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c3O3UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C3 O3 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c3O3UnitQuantities);\r\ntotal_c3O3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c3O3_input;\r\ntotal_c3O3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c3O3_input;\r\ntotal_c3O3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c3O3_input;\r\ntotal_c3O3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c3O3_input;\r\ntotal_c3O3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c3O3_input;\r\ntotal_c3O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c3O3_input;\r\ntotal_c3O3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c3O3_input;\r\ntotal_c3O3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c3O3_input;\r\ntotal_c3O3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c3O3_input;\r\ntotal_c3O3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c3O3_input;\r\ntotal_c3O3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c3O3_input;\r\ntotal_c3O3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c3O3_input;\r\ntotal_c3O3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c3O3_input;\r\ntotal_c3O3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c3O3_input;\r\ntotal_c3O3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c3O3_input;\r\ntotal_c3O3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c3O3_input;\r\ntotal_c3O3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c3O3_input;\r\ntotal_c3O3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c3O3_input;\r\ntotal_c3O3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c3O3_input;\r\ntotal_c3O3_semenSak_price = v1.semenSak_price * v2.semenSak * data.c3O3_input;\r\ntotal_c3O3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c3O3_input;\r\ntotal_c3O3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c3O3_input;\r\ntotal_c3O3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c3O3_input;\r\ntotal_c3O3_price = total_c3O3_bataMerahPcs_price + total_c3O3_batuKaliM3_price + total_c3O3_bautJLPcs_price + total_c3O3_besiPolos8MmX12MPcs_price + total_c3O3_besiUlir10MmX12MPcs_price + total_c3O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c3O3_kawatBetonKg_price + total_c3O3_kayuKelasIi57CmX4MPcs_price + total_c3O3_kayuKelasIi612CmX4MPcs_price + total_c3O3_kepalaTukangOh_price + total_c3O3_kerikilM3_price + total_c3O3_lemKayuKg_price + total_c3O3_mandorOh_price + total_c3O3_minyakBekistingLtr_price + total_c3O3_paku57CmKg_price + total_c3O3_pakuPayungKg_price + total_c3O3_papan325CmPcs_price + total_c3O3_pasirM3_price + total_c3O3_pekerjaOh_price + total_c3O3_semenSak_price + total_c3O3_sengBjlsPcs_price + total_c3O3_tripleks9MmPcs_price + total_c3O3_tukangOh_price;\r\n\r\nif (isNaN(total_c3O3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c3O3_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c3O3TotalPrice",
            "conditional": {
                "show": true,
                "when": "C3_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QC4: Sisi kanan bangunan, panjang dinding solidnya kurang dari 1.5m",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QC3",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Opsi Aksi QC4",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "opsiAksiQc4",
        "conditional": {
            "show": true,
            "when": "QC3",
            "eq": "true"
        },
        "type": "panel",
        "label": "Opsi Aksi QC2",
        "input": false,
        "components": [{
            "label": "Aksi C4, Opsi 1: Kurangi ukuran lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C4_O1",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C4 O1 Luas lubang yang dikurangi, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c4O1_input",
            "conditional": {
                "show": true,
                "when": "C4_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C4_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C4_O1\",\"bataMerahPcs\":70,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.17,\"kayuKelasIi57CmX4MPcs\":1.547,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.1,\"kerikilM3\":0.033,\"lemKayuKg\":0,\"mandorOh\":0.12,\"minyakBekistingLtr\":0.314,\"paku57CmKg\":0.636,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.116,\"pekerjaOh\":2.1,\"semenSak\":1.25,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.201,\"tukangOh\":1.73,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":0.95,\"id\":\"5f0eb2499106b22ccf0284b2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c4O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C4 O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c4O1UnitQuantities);\r\ntotal_c4O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c4O1_input;\r\ntotal_c4O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c4O1_input;\r\ntotal_c4O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c4O1_input;\r\ntotal_c4O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c4O1_input;\r\ntotal_c4O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c4O1_input;\r\ntotal_c4O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c4O1_input;\r\ntotal_c4O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c4O1_input;\r\ntotal_c4O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c4O1_input;\r\ntotal_c4O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c4O1_input;\r\ntotal_c4O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c4O1_input;\r\ntotal_c4O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c4O1_input;\r\ntotal_c4O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c4O1_input;\r\ntotal_c4O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c4O1_input;\r\ntotal_c4O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c4O1_input;\r\ntotal_c4O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c4O1_input;\r\ntotal_c4O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c4O1_input;\r\ntotal_c4O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c4O1_input;\r\ntotal_c4O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c4O1_input;\r\ntotal_c4O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c4O1_input;\r\ntotal_c4O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c4O1_input;\r\ntotal_c4O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c4O1_input;\r\ntotal_c4O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c4O1_input;\r\ntotal_c4O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c4O1_input;\r\ntotal_c4O1_price = total_c4O1_bataMerahPcs_price + total_c4O1_batuKaliM3_price + total_c4O1_bautJLPcs_price + total_c4O1_besiPolos8MmX12MPcs_price + total_c4O1_besiUlir10MmX12MPcs_price + total_c4O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c4O1_kawatBetonKg_price + total_c4O1_kayuKelasIi57CmX4MPcs_price + total_c4O1_kayuKelasIi612CmX4MPcs_price + total_c4O1_kepalaTukangOh_price + total_c4O1_kerikilM3_price + total_c4O1_lemKayuKg_price + total_c4O1_mandorOh_price + total_c4O1_minyakBekistingLtr_price + total_c4O1_paku57CmKg_price + total_c4O1_pakuPayungKg_price + total_c4O1_papan325CmPcs_price + total_c4O1_pasirM3_price + total_c4O1_pekerjaOh_price + total_c4O1_semenSak_price + total_c4O1_sengBjlsPcs_price + total_c4O1_tripleks9MmPcs_price + total_c4O1_tukangOh_price;\r\n\r\nif (isNaN(total_c4O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c4O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c4O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "C4_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C4, Opsi 2: Geser lubang dinding ke sebelah tiang, hal ini membuat dinding menjadi lebih kokoh",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C4_O2",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C4 O2 Luas lubang yang dikurangi, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c4O2_input",
            "conditional": {
                "show": true,
                "when": "C4_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C4_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C4_O2\",\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.01,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.02,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.086,\"pekerjaOh\":0.3,\"semenSak\":0.748,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.87,\"bataMerahPcs\":70,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eb5c49106b2302b2721f2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c4O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C4 O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c4O2UnitQuantities);\r\ntotal_c4O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c4O2_input;\r\ntotal_c4O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c4O2_input;\r\ntotal_c4O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c4O2_input;\r\ntotal_c4O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c4O2_input;\r\ntotal_c4O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c4O2_input;\r\ntotal_c4O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c4O2_input;\r\ntotal_c4O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c4O2_input;\r\ntotal_c4O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c4O2_input;\r\ntotal_c4O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c4O2_input;\r\ntotal_c4O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c4O2_input;\r\ntotal_c4O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c4O2_input;\r\ntotal_c4O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c4O2_input;\r\ntotal_c4O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c4O2_input;\r\ntotal_c4O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c4O2_input;\r\ntotal_c4O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c4O2_input;\r\ntotal_c4O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c4O2_input;\r\ntotal_c4O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c4O2_input;\r\ntotal_c4O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c4O2_input;\r\ntotal_c4O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c4O2_input;\r\ntotal_c4O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c4O2_input;\r\ntotal_c4O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c4O2_input;\r\ntotal_c4O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c4O2_input;\r\ntotal_c4O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c4O2_input;\r\ntotal_c4O2_price = total_c4O2_bataMerahPcs_price + total_c4O2_batuKaliM3_price + total_c4O2_bautJLPcs_price + total_c4O2_besiPolos8MmX12MPcs_price + total_c4O2_besiUlir10MmX12MPcs_price + total_c4O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c4O2_kawatBetonKg_price + total_c4O2_kayuKelasIi57CmX4MPcs_price + total_c4O2_kayuKelasIi612CmX4MPcs_price + total_c4O2_kepalaTukangOh_price + total_c4O2_kerikilM3_price + total_c4O2_lemKayuKg_price + total_c4O2_mandorOh_price + total_c4O2_minyakBekistingLtr_price + total_c4O2_paku57CmKg_price + total_c4O2_pakuPayungKg_price + total_c4O2_papan325CmPcs_price + total_c4O2_pasirM3_price + total_c4O2_pekerjaOh_price + total_c4O2_semenSak_price + total_c4O2_sengBjlsPcs_price + total_c4O2_tripleks9MmPcs_price + total_c4O2_tukangOh_price;\r\n\r\nif (isNaN(total_c4O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c4O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c4O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "C4_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C4, Opsi 3: Pasang kawat anyam, lalu plester dinding di antara lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C4_O3",
            "type": "checkbox",
            "input": true
        }, {
            "label": "C4 O3 Panjang dinding antara lubang, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c4O3_input",
            "conditional": {
                "show": true,
                "when": "C4_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C4_O3 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C4_O3\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0.197,\"kawatBetonKg\":0.18,\"kayuKelasIi57CmX4MPcs\":0.471,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.105,\"kerikilM3\":0.014,\"lemKayuKg\":0,\"mandorOh\":0.116,\"minyakBekistingLtr\":0.12,\"paku57CmKg\":0.15,\"pakuPayungKg\":0.336,\"papan325CmPcs\":0,\"pasirM3\":0.151,\"pekerjaOh\":2.139,\"semenSak\":1.382,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.077,\"tukangOh\":1.156,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0.167,\"id\":\"5f0eb7d99106b231b93315a2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c4O3UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C4 O3 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c4O3UnitQuantities);\r\ntotal_c4O3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c4O3_input;\r\ntotal_c4O3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c4O3_input;\r\ntotal_c4O3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c4O3_input;\r\ntotal_c4O3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c4O3_input;\r\ntotal_c4O3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c4O3_input;\r\ntotal_c4O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c4O3_input;\r\ntotal_c4O3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c4O3_input;\r\ntotal_c4O3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c4O3_input;\r\ntotal_c4O3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c4O3_input;\r\ntotal_c4O3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c4O3_input;\r\ntotal_c4O3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c4O3_input;\r\ntotal_c4O3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c4O3_input;\r\ntotal_c4O3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c4O3_input;\r\ntotal_c4O3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c4O3_input;\r\ntotal_c4O3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c4O3_input;\r\ntotal_c4O3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c4O3_input;\r\ntotal_c4O3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c4O3_input;\r\ntotal_c4O3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c4O3_input;\r\ntotal_c4O3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c4O3_input;\r\ntotal_c4O3_semenSak_price = v1.semenSak_price * v2.semenSak * data.c4O3_input;\r\ntotal_c4O3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c4O3_input;\r\ntotal_c4O3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c4O3_input;\r\ntotal_c4O3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c4O3_input;\r\ntotal_c4O3_price = total_c4O3_bataMerahPcs_price + total_c4O3_batuKaliM3_price + total_c4O3_bautJLPcs_price + total_c4O3_besiPolos8MmX12MPcs_price + total_c4O3_besiUlir10MmX12MPcs_price + total_c4O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c4O3_kawatBetonKg_price + total_c4O3_kayuKelasIi57CmX4MPcs_price + total_c4O3_kayuKelasIi612CmX4MPcs_price + total_c4O3_kepalaTukangOh_price + total_c4O3_kerikilM3_price + total_c4O3_lemKayuKg_price + total_c4O3_mandorOh_price + total_c4O3_minyakBekistingLtr_price + total_c4O3_paku57CmKg_price + total_c4O3_pakuPayungKg_price + total_c4O3_papan325CmPcs_price + total_c4O3_pasirM3_price + total_c4O3_pekerjaOh_price + total_c4O3_semenSak_price + total_c4O3_sengBjlsPcs_price + total_c4O3_tripleks9MmPcs_price + total_c4O3_tukangOh_price;\r\n\r\nif (isNaN(total_c4O3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c4O3_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c4O3TotalPrice",
            "conditional": {
                "show": true,
                "when": "C4_O3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QC5: Jendela tidak memiliki balok pinggang",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QC5",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Opsi Aksi QC5",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "opsiAksiQc5",
        "conditional": {
            "show": true,
            "when": "QC5",
            "eq": "true"
        },
        "type": "panel",
        "label": "Opsi Aksi QC4",
        "input": false,
        "components": [{
            "label": "Aksi C5, Opsi 1: Tambahkan balok pinggang",
            "shortcut": 0,
            "tableView": false,
            "calculateServer": false,
            "key": "C5_O1",
            "conditional": {
                "show": true,
                "when": "QC5",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true,
            "defaultValue": false
        }, {
            "label": "C5 O1 Panjang lubang, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c5O1_input",
            "conditional": {
                "show": true,
                "when": "C5_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C5_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C5_01\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.099,\"kayuKelasIi57CmX4MPcs\":0.44,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.014,\"kerikilM3\":0.055,\"lemKayuKg\":0,\"mandorOh\":0.055,\"minyakBekistingLtr\":0.112,\"paku57CmKg\":0.14,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.05,\"pekerjaOh\":1.445,\"semenSak\":0.845,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.072,\"tukangOh\":0.14,\"besiPolos8MmX12MPcs\":0.733,\"besiUlir10MmX12MPcs\":0.5,\"id\":\"5f0eb8649106b23248153b22\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c5O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C5 O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c5O1UnitQuantities);\r\ntotal_c5O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c5O1_input;\r\ntotal_c5O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c5O1_input;\r\ntotal_c5O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c5O1_input;\r\ntotal_c5O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c5O1_input;\r\ntotal_c5O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c5O1_input;\r\ntotal_c5O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c5O1_input;\r\ntotal_c5O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c5O1_input;\r\ntotal_c5O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c5O1_input;\r\ntotal_c5O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c5O1_input;\r\ntotal_c5O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c5O1_input;\r\ntotal_c5O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c5O1_input;\r\ntotal_c5O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c5O1_input;\r\ntotal_c5O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c5O1_input;\r\ntotal_c5O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c5O1_input;\r\ntotal_c5O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c5O1_input;\r\ntotal_c5O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c5O1_input;\r\ntotal_c5O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c5O1_input;\r\ntotal_c5O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c5O1_input;\r\ntotal_c5O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c5O1_input;\r\ntotal_c5O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c5O1_input;\r\ntotal_c5O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c5O1_input;\r\ntotal_c5O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c5O1_input;\r\ntotal_c5O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c5O1_input;\r\ntotal_c5O1_price = total_c5O1_bataMerahPcs_price + total_c5O1_batuKaliM3_price + total_c5O1_bautJLPcs_price + total_c5O1_besiPolos8MmX12MPcs_price + total_c5O1_besiUlir10MmX12MPcs_price + total_c5O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c5O1_kawatBetonKg_price + total_c5O1_kayuKelasIi57CmX4MPcs_price + total_c5O1_kayuKelasIi612CmX4MPcs_price + total_c5O1_kepalaTukangOh_price + total_c5O1_kerikilM3_price + total_c5O1_lemKayuKg_price + total_c5O1_mandorOh_price + total_c5O1_minyakBekistingLtr_price + total_c5O1_paku57CmKg_price + total_c5O1_pakuPayungKg_price + total_c5O1_papan325CmPcs_price + total_c5O1_pasirM3_price + total_c5O1_pekerjaOh_price + total_c5O1_semenSak_price + total_c5O1_sengBjlsPcs_price + total_c5O1_tripleks9MmPcs_price + total_c5O1_tukangOh_price;\r\n\r\nif (isNaN(total_c5O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c5O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c5O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "C5_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C5, Opsi 2: Teruskan bukaan ke ring balok",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C5_O2",
            "conditional": {
                "show": true,
                "when": "QC5",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true
        }, {
            "label": "C5 O2 Luas dinding pasangan bata diatas lubang, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c5O2_input",
            "conditional": {
                "show": true,
                "when": "C5_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C5_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C5_O2\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":2.083,\"kepalaTukangOh\":0.2,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.343,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.15,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0,\"pekerjaOh\":1.537,\"semenSak\":0,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":2,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eb8c29106b23291505742\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c5O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C5 O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c5O2UnitQuantities);\r\ntotal_c5O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c5O2_input;\r\ntotal_c5O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c5O2_input;\r\ntotal_c5O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c5O2_input;\r\ntotal_c5O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c5O2_input;\r\ntotal_c5O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c5O2_input;\r\ntotal_c5O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c5O2_input;\r\ntotal_c5O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c5O2_input;\r\ntotal_c5O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c5O2_input;\r\ntotal_c5O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c5O2_input;\r\ntotal_c5O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c5O2_input;\r\ntotal_c5O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c5O2_input;\r\ntotal_c5O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c5O2_input;\r\ntotal_c5O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c5O2_input;\r\ntotal_c5O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c5O2_input;\r\ntotal_c5O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c5O2_input;\r\ntotal_c5O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c5O2_input;\r\ntotal_c5O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c5O2_input;\r\ntotal_c5O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c5O2_input;\r\ntotal_c5O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c5O2_input;\r\ntotal_c5O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c5O2_input;\r\ntotal_c5O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c5O2_input;\r\ntotal_c5O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c5O2_input;\r\ntotal_c5O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c5O2_input;\r\ntotal_c5O2_price = total_c5O2_bataMerahPcs_price + total_c5O2_batuKaliM3_price + total_c5O2_bautJLPcs_price + total_c5O2_besiPolos8MmX12MPcs_price + total_c5O2_besiUlir10MmX12MPcs_price + total_c5O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c5O2_kawatBetonKg_price + total_c5O2_kayuKelasIi57CmX4MPcs_price + total_c5O2_kayuKelasIi612CmX4MPcs_price + total_c5O2_kepalaTukangOh_price + total_c5O2_kerikilM3_price + total_c5O2_lemKayuKg_price + total_c5O2_mandorOh_price + total_c5O2_minyakBekistingLtr_price + total_c5O2_paku57CmKg_price + total_c5O2_pakuPayungKg_price + total_c5O2_papan325CmPcs_price + total_c5O2_pasirM3_price + total_c5O2_pekerjaOh_price + total_c5O2_semenSak_price + total_c5O2_sengBjlsPcs_price + total_c5O2_tripleks9MmPcs_price + total_c5O2_tukangOh_price;\r\n\r\nif (isNaN(total_c5O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c5O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c5O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "C5_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QC6: Jendela tidak memiliki bingkai beton",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QC6",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Aksi QC6",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "AksiQc6",
        "conditional": {
            "show": true,
            "when": "QC6",
            "eq": "true"
        },
        "type": "panel",
        "label": "Opsi Aksi QC7",
        "input": false,
        "components": [{
            "label": "Aksi C6",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi C6: Tambahkan tiang untuk mengikat lubang pintu\/ jendela dengan dinding",
            "refreshOnChange": false,
            "tableView": false,
            "key": "C6",
            "conditional": {
                "show": true,
                "when": "QC6",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "C6 Jumlah tiang, bh:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c6_input",
            "conditional": {
                "show": true,
                "when": "QC6",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C6 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C6\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.17,\"kayuKelasIi57CmX4MPcs\":1.547,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.044,\"kerikilM3\":0.033,\"lemKayuKg\":0,\"mandorOh\":0.098,\"minyakBekistingLtr\":0.314,\"paku57CmKg\":0.636,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.03,\"pekerjaOh\":1.502,\"semenSak\":0.502,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.201,\"tukangOh\":0.442,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":0.95,\"id\":\"5f0eb9419106b23326545942\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c6UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C6 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c6UnitQuantities);\r\ntotal_c6_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c6_input;\r\ntotal_c6_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c6_input;\r\ntotal_c6_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c6_input;\r\ntotal_c6_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c6_input;\r\ntotal_c6_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c6_input;\r\ntotal_c6_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c6_input;\r\ntotal_c6_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c6_input;\r\ntotal_c6_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c6_input;\r\ntotal_c6_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c6_input;\r\ntotal_c6_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c6_input;\r\ntotal_c6_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c6_input;\r\ntotal_c6_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c6_input;\r\ntotal_c6_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c6_input;\r\ntotal_c6_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c6_input;\r\ntotal_c6_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c6_input;\r\ntotal_c6_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c6_input;\r\ntotal_c6_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c6_input;\r\ntotal_c6_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c6_input;\r\ntotal_c6_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c6_input;\r\ntotal_c6_semenSak_price = v1.semenSak_price * v2.semenSak * data.c6_input;\r\ntotal_c6_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c6_input;\r\ntotal_c6_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c6_input;\r\ntotal_c6_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c6_input;\r\ntotal_c6_price = total_c6_bataMerahPcs_price + total_c6_batuKaliM3_price + total_c6_bautJLPcs_price + total_c6_besiPolos8MmX12MPcs_price + total_c6_besiUlir10MmX12MPcs_price + total_c6_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c6_kawatBetonKg_price + total_c6_kayuKelasIi57CmX4MPcs_price + total_c6_kayuKelasIi612CmX4MPcs_price + total_c6_kepalaTukangOh_price + total_c6_kerikilM3_price + total_c6_lemKayuKg_price + total_c6_mandorOh_price + total_c6_minyakBekistingLtr_price + total_c6_paku57CmKg_price + total_c6_pakuPayungKg_price + total_c6_papan325CmPcs_price + total_c6_pasirM3_price + total_c6_pekerjaOh_price + total_c6_semenSak_price + total_c6_sengBjlsPcs_price + total_c6_tripleks9MmPcs_price + total_c6_tukangOh_price;\r\n\r\nif (isNaN(total_c6_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c6_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c6TotalPrice",
            "conditional": {
                "show": true,
                "when": "QC6",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QC7: Pintu tidak memiliki balok pinggang",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QC7",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Opsi Aksi QC7",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "opsiAksiQc7",
        "conditional": {
            "show": true,
            "when": "QC7",
            "eq": "true"
        },
        "type": "panel",
        "label": "Opsi Aksi QC5",
        "input": false,
        "components": [{
            "label": "Aksi C7, Opsi 1: Tambahkan balok pinggang",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C7_O1",
            "conditional": {
                "show": 0,
                "when": 0
            },
            "type": "checkbox",
            "input": true
        }, {
            "label": "C7 O1 Panjang lubang, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c7O1_input",
            "conditional": {
                "show": true,
                "when": "C7_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C7 O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C7_O1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.099,\"kayuKelasIi57CmX4MPcs\":0.44,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.014,\"kerikilM3\":0.055,\"mandorOh\":0.055,\"minyakBekistingLtr\":0.112,\"paku57CmKg\":0.14,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.05,\"pekerjaOh\":1.445,\"semenSak\":0.845,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.072,\"tukangOh\":0.14,\"lemKayuKg\":0,\"besiPolos8MmX12MPcs\":0.733,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eb9e89106b233e255f6d2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c7O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C7 O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c7O1UnitQuantities);\r\ntotal_c7O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c7O1_input;\r\ntotal_c7O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c7O1_input;\r\ntotal_c7O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c7O1_input;\r\ntotal_c7O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c7O1_input;\r\ntotal_c7O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c7O1_input;\r\ntotal_c7O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c7O1_input;\r\ntotal_c7O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c7O1_input;\r\ntotal_c7O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c7O1_input;\r\ntotal_c7O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c7O1_input;\r\ntotal_c7O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c7O1_input;\r\ntotal_c7O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c7O1_input;\r\ntotal_c7O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c7O1_input;\r\ntotal_c7O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c7O1_input;\r\ntotal_c7O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c7O1_input;\r\ntotal_c7O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c7O1_input;\r\ntotal_c7O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c7O1_input;\r\ntotal_c7O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c7O1_input;\r\ntotal_c7O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c7O1_input;\r\ntotal_c7O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c7O1_input;\r\ntotal_c7O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c7O1_input;\r\ntotal_c7O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c7O1_input;\r\ntotal_c7O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c7O1_input;\r\ntotal_c7O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c7O1_input;\r\ntotal_c7O1_price = total_c7O1_bataMerahPcs_price + total_c7O1_batuKaliM3_price + total_c7O1_bautJLPcs_price + total_c7O1_besiPolos8MmX12MPcs_price + total_c7O1_besiUlir10MmX12MPcs_price + total_c7O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c7O1_kawatBetonKg_price + total_c7O1_kayuKelasIi57CmX4MPcs_price + total_c7O1_kayuKelasIi612CmX4MPcs_price + total_c7O1_kepalaTukangOh_price + total_c7O1_kerikilM3_price + total_c7O1_lemKayuKg_price + total_c7O1_mandorOh_price + total_c7O1_minyakBekistingLtr_price + total_c7O1_paku57CmKg_price + total_c7O1_pakuPayungKg_price + total_c7O1_papan325CmPcs_price + total_c7O1_pasirM3_price + total_c7O1_pekerjaOh_price + total_c7O1_semenSak_price + total_c7O1_sengBjlsPcs_price + total_c7O1_tripleks9MmPcs_price + total_c7O1_tukangOh_price;\r\n\r\nif (isNaN(total_c7O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c7O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c7O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "C7_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi C7, Opsi 2: Teruskan bukaan ke ring balok",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "C7_O2",
            "conditional": {
                "show": 0,
                "when": 0
            },
            "type": "checkbox",
            "input": true
        }, {
            "label": "C7 O2 Luas dinding pasangan bata diatas lubang, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c7O2_input",
            "conditional": {
                "show": true,
                "when": "C7_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C7 O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C7_O2\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":2.083,\"kepalaTukangOh\":0.2,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.343,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.15,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0,\"pekerjaOh\":1.537,\"semenSak\":0,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":2,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0eba799106b234b23fe3d2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c7O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C7 O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c7O2UnitQuantities);\r\ntotal_c7O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c7O2_input;\r\ntotal_c7O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c7O2_input;\r\ntotal_c7O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c7O2_input;\r\ntotal_c7O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c7O2_input;\r\ntotal_c7O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c7O2_input;\r\ntotal_c7O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c7O2_input;\r\ntotal_c7O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c7O2_input;\r\ntotal_c7O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c7O2_input;\r\ntotal_c7O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c7O2_input;\r\ntotal_c7O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c7O2_input;\r\ntotal_c7O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c7O2_input;\r\ntotal_c7O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c7O2_input;\r\ntotal_c7O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c7O2_input;\r\ntotal_c7O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c7O2_input;\r\ntotal_c7O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c7O2_input;\r\ntotal_c7O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c7O2_input;\r\ntotal_c7O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c7O2_input;\r\ntotal_c7O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c7O2_input;\r\ntotal_c7O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c7O2_input;\r\ntotal_c7O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c7O2_input;\r\ntotal_c7O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c7O2_input;\r\ntotal_c7O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c7O2_input;\r\ntotal_c7O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c7O2_input;\r\ntotal_c7O2_price = total_c7O2_bataMerahPcs_price + total_c7O2_batuKaliM3_price + total_c7O2_bautJLPcs_price + total_c7O2_besiPolos8MmX12MPcs_price + total_c7O2_besiUlir10MmX12MPcs_price + total_c7O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c7O2_kawatBetonKg_price + total_c7O2_kayuKelasIi57CmX4MPcs_price + total_c7O2_kayuKelasIi612CmX4MPcs_price + total_c7O2_kepalaTukangOh_price + total_c7O2_kerikilM3_price + total_c7O2_lemKayuKg_price + total_c7O2_mandorOh_price + total_c7O2_minyakBekistingLtr_price + total_c7O2_paku57CmKg_price + total_c7O2_pakuPayungKg_price + total_c7O2_papan325CmPcs_price + total_c7O2_pasirM3_price + total_c7O2_pekerjaOh_price + total_c7O2_semenSak_price + total_c7O2_sengBjlsPcs_price + total_c7O2_tripleks9MmPcs_price + total_c7O2_tukangOh_price;\r\n\r\nif (isNaN(total_c7O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c7O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c7O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "C7_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }]
    }, {
        "label": "QC8: Pintu tidak memilik bingkai beton",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QC8",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Aksi QC8",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "AksiQc7",
        "conditional": {
            "show": true,
            "when": "QC8",
            "eq": "true"
        },
        "type": "panel",
        "label": "Aksi QC6",
        "input": false,
        "components": [{
            "label": "Aksi C8",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi C8: Tambahkan tiang untuk mengikat lubang pintu\/ jendela dengan dinding",
            "refreshOnChange": false,
            "tableView": false,
            "key": "C8",
            "conditional": {
                "show": true,
                "when": "QC8",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "C8 Jumlah tiang, bh:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c8_input",
            "conditional": {
                "show": true,
                "when": "QC8",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "C8 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"C8\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.17,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.044,\"kerikilM3\":0.033,\"lemKayuKg\":0,\"mandorOh\":0.098,\"minyakBekistingLtr\":0.314,\"paku57CmKg\":0.636,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.03,\"pekerjaOh\":1.502,\"semenSak\":0.502,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.201,\"tukangOh\":0.442,\"kayuKelasIi57CmX4MPcs\":1.547,\"besiPolos8MmX12MPcs\":1.1,\"besiUlir10MmX12MPcs\":0.95,\"id\":\"5f0ebb209106b235892b5ad2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "c8UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "C8 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c8UnitQuantities);\r\ntotal_c8_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c8_input;\r\ntotal_c8_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c8_input;\r\ntotal_c8_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c8_input;\r\ntotal_c8_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c8_input;\r\ntotal_c8_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c8_input;\r\ntotal_c8_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c8_input;\r\ntotal_c8_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c8_input;\r\ntotal_c8_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c8_input;\r\ntotal_c8_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c8_input;\r\ntotal_c8_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c8_input;\r\ntotal_c8_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c8_input;\r\ntotal_c8_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c8_input;\r\ntotal_c8_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c8_input;\r\ntotal_c8_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c8_input;\r\ntotal_c8_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c8_input;\r\ntotal_c8_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c8_input;\r\ntotal_c8_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c8_input;\r\ntotal_c8_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c8_input;\r\ntotal_c8_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c8_input;\r\ntotal_c8_semenSak_price = v1.semenSak_price * v2.semenSak * data.c8_input;\r\ntotal_c8_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c8_input;\r\ntotal_c8_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c8_input;\r\ntotal_c8_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c8_input;\r\ntotal_c8_price = total_c8_bataMerahPcs_price + total_c8_batuKaliM3_price + total_c8_bautJLPcs_price + total_c8_besiPolos8MmX12MPcs_price + total_c8_besiUlir10MmX12MPcs_price + total_c8_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c8_kawatBetonKg_price + total_c8_kayuKelasIi57CmX4MPcs_price + total_c8_kayuKelasIi612CmX4MPcs_price + total_c8_kepalaTukangOh_price + total_c8_kerikilM3_price + total_c8_lemKayuKg_price + total_c8_mandorOh_price + total_c8_minyakBekistingLtr_price + total_c8_paku57CmKg_price + total_c8_pakuPayungKg_price + total_c8_papan325CmPcs_price + total_c8_pasirM3_price + total_c8_pekerjaOh_price + total_c8_semenSak_price + total_c8_sengBjlsPcs_price + total_c8_tripleks9MmPcs_price + total_c8_tukangOh_price;\r\n\r\nif (isNaN(total_c8_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c8_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "c8TotalPrice",
            "conditional": {
                "show": true,
                "when": "QC8",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }],
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false
}, {
    "title": "QD: Gabel (Sopi-Sopi)",
    "label": "Page 5",
    "type": "panel",
    "key": "QD",
    "components": [{
        "label": "QD1: Gabel (sopi-sopi)  pasangan bata dengan tinggi lebih dari 0.6m tanpa ring balok yang miring",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QD1",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Aksi QD1",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "opsiQd1",
        "conditional": {
            "show": true,
            "when": "QD1",
            "eq": "true"
        },
        "type": "panel",
        "label": "Opsi QD1",
        "input": false,
        "components": [{
            "label": "Aksi D1",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi D1: Bongkar dinding yang terbuat dari pasangan bata dan ganti dengan dinding rangka kayu",
            "refreshOnChange": false,
            "tableView": false,
            "key": "D1",
            "conditional": {
                "show": true,
                "when": "QD1",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "D1 Panjang gable pada bangunan, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "d1_input",
            "conditional": {
                "show": true,
                "when": "QD1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "D1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"D1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":2.5,\"kepalaTukangOh\":0.25,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.13,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.116,\"pakuPayungKg\":0,\"papan325CmPcs\":5.707,\"pasirM3\":0,\"pekerjaOh\":1,\"semenSak\":0,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":2.45,\"bautJLPcs\":1,\"kayuKelasIi612CmX4MPcs\":3.231,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ebbbb9106b236444271a2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "d1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "D1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.d1UnitQuantities);\r\ntotal_d1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.d1_input;\r\ntotal_d1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.d1_input;\r\ntotal_d1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.d1_input;\r\ntotal_d1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.d1_input;\r\ntotal_d1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.d1_input;\r\ntotal_d1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.d1_input;\r\ntotal_d1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.d1_input;\r\ntotal_d1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.d1_input;\r\ntotal_d1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.d1_input;\r\ntotal_d1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.d1_input;\r\ntotal_d1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.d1_input;\r\ntotal_d1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.d1_input;\r\ntotal_d1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.d1_input;\r\ntotal_d1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.d1_input;\r\ntotal_d1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.d1_input;\r\ntotal_d1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.d1_input;\r\ntotal_d1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.d1_input;\r\ntotal_d1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.d1_input;\r\ntotal_d1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.d1_input;\r\ntotal_d1_semenSak_price = v1.semenSak_price * v2.semenSak * data.d1_input;\r\ntotal_d1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.d1_input;\r\ntotal_d1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.d1_input;\r\ntotal_d1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.d1_input;\r\ntotal_d1_price = total_d1_bataMerahPcs_price + total_d1_batuKaliM3_price + total_d1_bautJLPcs_price + total_d1_besiPolos8MmX12MPcs_price + total_d1_besiUlir10MmX12MPcs_price + total_d1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_d1_kawatBetonKg_price + total_d1_kayuKelasIi57CmX4MPcs_price + total_d1_kayuKelasIi612CmX4MPcs_price + total_d1_kepalaTukangOh_price + total_d1_kerikilM3_price + total_d1_lemKayuKg_price + total_d1_mandorOh_price + total_d1_minyakBekistingLtr_price + total_d1_paku57CmKg_price + total_d1_pakuPayungKg_price + total_d1_papan325CmPcs_price + total_d1_pasirM3_price + total_d1_pekerjaOh_price + total_d1_semenSak_price + total_d1_sengBjlsPcs_price + total_d1_tripleks9MmPcs_price + total_d1_tukangOh_price;\r\n\r\nif (isNaN(total_d1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_d1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "d1TotalPrice",
            "conditional": {
                "show": true,
                "when": "QD1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QD2: Gabel (sopi-sopi)  pasangan bata dengan tinggi kurang dari 0.6m tanpa ring balok yang miring",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QD2",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Opsi aksi QD2 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "qd2opsi",
        "conditional": {
            "show": true,
            "when": "QD2",
            "eq": "true"
        },
        "type": "panel",
        "label": "Opsi aksi QD2 ",
        "input": false,
        "components": [{
            "label": "Aksi D2, Opsi 1: Jika tinggi gabel (sopi-sopi) kurang dari 0.6m, pasang ring balok diatasnya dan tiang beton dari ring balok ke nok atap.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "D2_O1",
            "conditional": {
                "show": 0,
                "when": 0
            },
            "type": "checkbox",
            "input": true
        }, {
            "label": "D2 O1 Panjang Gable, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "d2O1_input",
            "conditional": {
                "show": true,
                "when": "D2_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "D2_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"D2_O1\",\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.594,\"kayuKelasIi57CmX4MPcs\":10.98,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.09,\"kerikilM3\":0.151,\"lemKayuKg\":0,\"mandorOh\":0.15,\"minyakBekistingLtr\":0.704,\"paku57CmKg\":0.88,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.138,\"pekerjaOh\":1.57,\"semenSak\":2.323,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.451,\"tukangOh\":0.78,\"bataMerahPcs\":0,\"besiPolos8MmX12MPcs\":3.846,\"besiUlir10MmX12MPcs\":3.333,\"id\":\"5f0ebcd99106b237a8491f92\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "d2O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "D2_O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.d2O1UnitQuantities);\r\ntotal_d2O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.d2O1_input;\r\ntotal_d2O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.d2O1_input;\r\ntotal_d2O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.d2O1_input;\r\ntotal_d2O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.d2O1_input;\r\ntotal_d2O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.d2O1_input;\r\ntotal_d2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.d2O1_input;\r\ntotal_d2O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.d2O1_input;\r\ntotal_d2O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.d2O1_input;\r\ntotal_d2O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.d2O1_input;\r\ntotal_d2O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.d2O1_input;\r\ntotal_d2O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.d2O1_input;\r\ntotal_d2O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.d2O1_input;\r\ntotal_d2O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.d2O1_input;\r\ntotal_d2O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.d2O1_input;\r\ntotal_d2O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.d2O1_input;\r\ntotal_d2O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.d2O1_input;\r\ntotal_d2O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.d2O1_input;\r\ntotal_d2O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.d2O1_input;\r\ntotal_d2O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.d2O1_input;\r\ntotal_d2O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.d2O1_input;\r\ntotal_d2O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.d2O1_input;\r\ntotal_d2O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.d2O1_input;\r\ntotal_d2O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.d2O1_input;\r\ntotal_d2O1_price = total_d2O1_bataMerahPcs_price + total_d2O1_batuKaliM3_price + total_d2O1_bautJLPcs_price + total_d2O1_besiPolos8MmX12MPcs_price + total_d2O1_besiUlir10MmX12MPcs_price + total_d2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_d2O1_kawatBetonKg_price + total_d2O1_kayuKelasIi57CmX4MPcs_price + total_d2O1_kayuKelasIi612CmX4MPcs_price + total_d2O1_kepalaTukangOh_price + total_d2O1_kerikilM3_price + total_d2O1_lemKayuKg_price + total_d2O1_mandorOh_price + total_d2O1_minyakBekistingLtr_price + total_d2O1_paku57CmKg_price + total_d2O1_pakuPayungKg_price + total_d2O1_papan325CmPcs_price + total_d2O1_pasirM3_price + total_d2O1_pekerjaOh_price + total_d2O1_semenSak_price + total_d2O1_sengBjlsPcs_price + total_d2O1_tripleks9MmPcs_price + total_d2O1_tukangOh_price;\r\n\r\nif (isNaN(total_d2O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_d2O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "d2O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "D2_O1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi D2, Opsi 2: Bongkar dinding yang terbuat dari pasangan bata dan ganti dengan dinding rangka kayu.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "D2_O2",
            "conditional": {
                "show": 0,
                "when": 0
            },
            "type": "checkbox",
            "input": true
        }, {
            "label": "D2 O2 Panjang gable pada bangunan, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "d2O2_input",
            "conditional": {
                "show": true,
                "when": "D2_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "D2_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"D2_O2\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":1,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":2.5,\"kayuKelasIi612CmX4MPcs\":3.231,\"kepalaTukangOh\":0.25,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.13,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.116,\"pakuPayungKg\":0,\"papan325CmPcs\":5.707,\"pasirM3\":0,\"pekerjaOh\":1,\"semenSak\":0,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":2.45,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ebd609106b2382336a3d2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "d2O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "D2_O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.d2O2UnitQuantities);\r\ntotal_d2O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.d2O2_input;\r\ntotal_d2O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.d2O2_input;\r\ntotal_d2O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.d2O2_input;\r\ntotal_d2O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.d2O2_input;\r\ntotal_d2O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.d2O2_input;\r\ntotal_d2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.d2O2_input;\r\ntotal_d2O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.d2O2_input;\r\ntotal_d2O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.d2O2_input;\r\ntotal_d2O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.d2O2_input;\r\ntotal_d2O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.d2O2_input;\r\ntotal_d2O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.d2O2_input;\r\ntotal_d2O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.d2O2_input;\r\ntotal_d2O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.d2O2_input;\r\ntotal_d2O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.d2O2_input;\r\ntotal_d2O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.d2O2_input;\r\ntotal_d2O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.d2O2_input;\r\ntotal_d2O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.d2O2_input;\r\ntotal_d2O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.d2O2_input;\r\ntotal_d2O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.d2O2_input;\r\ntotal_d2O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.d2O2_input;\r\ntotal_d2O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.d2O2_input;\r\ntotal_d2O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.d2O2_input;\r\ntotal_d2O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.d2O2_input;\r\ntotal_d2O2_price = total_d2O2_bataMerahPcs_price + total_d2O2_batuKaliM3_price + total_d2O2_bautJLPcs_price + total_d2O2_besiPolos8MmX12MPcs_price + total_d2O2_besiUlir10MmX12MPcs_price + total_d2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_d2O2_kawatBetonKg_price + total_d2O2_kayuKelasIi57CmX4MPcs_price + total_d2O2_kayuKelasIi612CmX4MPcs_price + total_d2O2_kepalaTukangOh_price + total_d2O2_kerikilM3_price + total_d2O2_lemKayuKg_price + total_d2O2_mandorOh_price + total_d2O2_minyakBekistingLtr_price + total_d2O2_paku57CmKg_price + total_d2O2_pakuPayungKg_price + total_d2O2_papan325CmPcs_price + total_d2O2_pasirM3_price + total_d2O2_pekerjaOh_price + total_d2O2_semenSak_price + total_d2O2_sengBjlsPcs_price + total_d2O2_tripleks9MmPcs_price + total_d2O2_tukangOh_price;\r\n\r\nif (isNaN(total_d2O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_d2O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "d2O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "D2_O2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }],
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false
}, {
    "title": "QE: Plaster",
    "label": "QE: Plaster",
    "type": "panel",
    "key": "QE",
    "components": [{
        "label": "QE1: Dinding tidak diplester",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "clearOnHide": false,
        "calculateServer": false,
        "key": "QE1",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Aksi QE1 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqe1",
        "conditional": {
            "show": true,
            "when": "QE1",
            "eq": "true"
        },
        "type": "panel",
        "label": "QE1 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi E1",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi E1: Gunakan mortar (adukan) semen-pasir untuk melapisi dinding pasangan bata yang belum diplester.",
            "refreshOnChange": false,
            "tableView": false,
            "key": "E1",
            "conditional": {
                "show": true,
                "when": "QE1",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "E1 Panjang dinding yang diplaster, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "e1_input",
            "conditional": {
                "show": true,
                "when": "QE1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "E1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"E1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.015,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.023,\"pekerjaOh\":0.3,\"semenSak\":0.194,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.15,\"kepalaTukangOh\":0.015,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ebe899106b239316d4202\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "e1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "E1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.e1UnitQuantities);\r\ntotal_e1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.e1_input;\r\ntotal_e1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.e1_input;\r\ntotal_e1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.e1_input;\r\ntotal_e1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.e1_input;\r\ntotal_e1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.e1_input;\r\ntotal_e1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.e1_input;\r\ntotal_e1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.e1_input;\r\ntotal_e1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.e1_input;\r\ntotal_e1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.e1_input;\r\ntotal_e1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.e1_input;\r\ntotal_e1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.e1_input;\r\ntotal_e1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.e1_input;\r\ntotal_e1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.e1_input;\r\ntotal_e1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.e1_input;\r\ntotal_e1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.e1_input;\r\ntotal_e1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.e1_input;\r\ntotal_e1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.e1_input;\r\ntotal_e1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.e1_input;\r\ntotal_e1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.e1_input;\r\ntotal_e1_semenSak_price = v1.semenSak_price * v2.semenSak * data.e1_input;\r\ntotal_e1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.e1_input;\r\ntotal_e1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.e1_input;\r\ntotal_e1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.e1_input;\r\ntotal_e1_price = total_e1_bataMerahPcs_price + total_e1_batuKaliM3_price + total_e1_bautJLPcs_price + total_e1_besiPolos8MmX12MPcs_price + total_e1_besiUlir10MmX12MPcs_price + total_e1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_e1_kawatBetonKg_price + total_e1_kayuKelasIi57CmX4MPcs_price + total_e1_kayuKelasIi612CmX4MPcs_price + total_e1_kepalaTukangOh_price + total_e1_kerikilM3_price + total_e1_lemKayuKg_price + total_e1_mandorOh_price + total_e1_minyakBekistingLtr_price + total_e1_paku57CmKg_price + total_e1_pakuPayungKg_price + total_e1_papan325CmPcs_price + total_e1_pasirM3_price + total_e1_pekerjaOh_price + total_e1_semenSak_price + total_e1_sengBjlsPcs_price + total_e1_tripleks9MmPcs_price + total_e1_tukangOh_price;\r\n\r\nif (isNaN(total_e1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_e1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "e1TotalPrice",
            "conditional": {
                "show": true,
                "when": "QE1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }],
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false
}, {
    "title": "QF: Ring Balok Beton",
    "label": "Page 7",
    "type": "panel",
    "key": "QF",
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false,
    "components": [{
        "label": "QF1: Tidak ada ring balok di atas dinding",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QF1",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Aksi QF1 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "Aksiqf1",
        "conditional": {
            "show": true,
            "when": "QF1",
            "eq": "true"
        },
        "type": "panel",
        "label": "QF1 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi F1",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi F1: Pasang ring balok tanpa terputus di atas semua dinding bata. Topang atap saat memasang ring balok. Pastikan struktur atap terikat dengan ring balok menggunakan plat pengikat",
            "refreshOnChange": false,
            "tableView": false,
            "key": "F1",
            "conditional": {
                "show": true,
                "when": "QF1",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "F1 Panjang ring balok beton, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "f1_input",
            "conditional": {
                "show": true,
                "when": "QF1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "F1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"F1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.063,\"kayuKelasIi57CmX4MPcs\":1.11,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.009,\"kerikilM3\":0.017,\"lemKayuKg\":0,\"mandorOh\":0.017,\"minyakBekistingLtr\":0.08,\"paku57CmKg\":0.343,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.016,\"pekerjaOh\":0.324,\"semenSak\":0.264,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.051,\"tukangOh\":0.085,\"besiPolos8MmX12MPcs\":0.433,\"besiUlir10MmX12MPcs\":0.333,\"id\":\"5f0ec0cc9106b23ae263ae12\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "f1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "F1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.f1UnitQuantities);\r\ntotal_f1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.f1_input;\r\ntotal_f1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.f1_input;\r\ntotal_f1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.f1_input;\r\ntotal_f1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.f1_input;\r\ntotal_f1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.f1_input;\r\ntotal_f1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.f1_input;\r\ntotal_f1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.f1_input;\r\ntotal_f1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.f1_input;\r\ntotal_f1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.f1_input;\r\ntotal_f1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.f1_input;\r\ntotal_f1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.f1_input;\r\ntotal_f1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.f1_input;\r\ntotal_f1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.f1_input;\r\ntotal_f1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.f1_input;\r\ntotal_f1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.f1_input;\r\ntotal_f1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.f1_input;\r\ntotal_f1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.f1_input;\r\ntotal_f1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.f1_input;\r\ntotal_f1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.f1_input;\r\ntotal_f1_semenSak_price = v1.semenSak_price * v2.semenSak * data.f1_input;\r\ntotal_f1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.f1_input;\r\ntotal_f1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.f1_input;\r\ntotal_f1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.f1_input;\r\ntotal_f1_price = total_f1_bataMerahPcs_price + total_f1_batuKaliM3_price + total_f1_bautJLPcs_price + total_f1_besiPolos8MmX12MPcs_price + total_f1_besiUlir10MmX12MPcs_price + total_f1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_f1_kawatBetonKg_price + total_f1_kayuKelasIi57CmX4MPcs_price + total_f1_kayuKelasIi612CmX4MPcs_price + total_f1_kepalaTukangOh_price + total_f1_kerikilM3_price + total_f1_lemKayuKg_price + total_f1_mandorOh_price + total_f1_minyakBekistingLtr_price + total_f1_paku57CmKg_price + total_f1_pakuPayungKg_price + total_f1_papan325CmPcs_price + total_f1_pasirM3_price + total_f1_pekerjaOh_price + total_f1_semenSak_price + total_f1_sengBjlsPcs_price + total_f1_tripleks9MmPcs_price + total_f1_tukangOh_price;\r\n\r\nif (isNaN(total_f1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_f1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "f1TotalPrice",
            "conditional": {
                "show": true,
                "when": "QF1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }]
}, {
    "title": "QG: Dinding pengkaku",
    "label": "Page 8",
    "type": "panel",
    "key": "QG",
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false,
    "components": [{
        "label": "QG1: Dinding lebih panjang dari 3.5m",
        "shortcut": 0,
        "tableView": false,
        "calculateServer": false,
        "key": "QG1",
        "type": "checkbox",
        "input": true,
        "defaultValue": false
    }, {
        "title": "Opsi Aksi QG1 ",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "OpsiAksiqg1",
        "conditional": {
            "show": true,
            "when": "QG1",
            "eq": "true"
        },
        "type": "panel",
        "label": "QG1 Pilihan Aksi",
        "input": false,
        "components": [{
            "label": "Aksi G1, Opsi 1: Tambah dinding sebagai pengkaku (panjang 1.5m).",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "aksiG1Kasus1TambahDindingSebagaiPengkakuPanjang15M",
            "conditional": {
                "show": true,
                "when": "QG1",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true
        }, {
            "label": "G1 O1 Jumlah dinding, unit:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "g1O1_input",
            "conditional": {
                "show": true,
                "when": "aksiG1Kasus1TambahDindingSebagaiPengkakuPanjang15M",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }, {
            "label": "G1_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "data": {
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "g1O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "defaultValue": "{\"retrofitAction\":\"G1_O1\",\"bataMerahPcs\":315,\"batuKaliM3\":0.567,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.444,\"kayuKelasIi57CmX4MPcs\":2.965,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.3,\"kerikilM3\":0.095,\"lemKayuKg\":0,\"mandorOh\":0.41,\"minyakBekistingLtr\":0.675,\"paku57CmKg\":1.087,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.703,\"pekerjaOh\":7.53,\"semenSak\":1.218,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.432,\"tukangOh\":2.52,\"besiPolos8MmX12MPcs\":2.4,\"besiUlir10MmX12MPcs\":2.8,\"id\":\"5f0ec1569106b23b817256c2\"}",
            "addResource": false,
            "reference": false
        }, {
            "label": "G1_O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.g1O1UnitQuantities);\r\ntotal_g1O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.g1O1_input;\r\ntotal_g1O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.g1O1_input;\r\ntotal_g1O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.g1O1_input;\r\ntotal_g1O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.g1O1_input;\r\ntotal_g1O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.g1O1_input;\r\ntotal_g1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.g1O1_input;\r\ntotal_g1O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.g1O1_input;\r\ntotal_g1O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.g1O1_input;\r\ntotal_g1O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.g1O1_input;\r\ntotal_g1O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.g1O1_input;\r\ntotal_g1O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.g1O1_input;\r\ntotal_g1O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.g1O1_input;\r\ntotal_g1O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.g1O1_input;\r\ntotal_g1O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.g1O1_input;\r\ntotal_g1O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.g1O1_input;\r\ntotal_g1O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.g1O1_input;\r\ntotal_g1O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.g1O1_input;\r\ntotal_g1O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.g1O1_input;\r\ntotal_g1O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.g1O1_input;\r\ntotal_g1O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.g1O1_input;\r\ntotal_g1O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.g1O1_input;\r\ntotal_g1O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.g1O1_input;\r\ntotal_g1O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.g1O1_input;\r\ntotal_g1O1_price = total_g1O1_bataMerahPcs_price + total_g1O1_batuKaliM3_price + total_g1O1_bautJLPcs_price + total_g1O1_besiPolos8MmX12MPcs_price + total_g1O1_besiUlir10MmX12MPcs_price + total_g1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_g1O1_kawatBetonKg_price + total_g1O1_kayuKelasIi57CmX4MPcs_price + total_g1O1_kayuKelasIi612CmX4MPcs_price + total_g1O1_kepalaTukangOh_price + total_g1O1_kerikilM3_price + total_g1O1_lemKayuKg_price + total_g1O1_mandorOh_price + total_g1O1_minyakBekistingLtr_price + total_g1O1_paku57CmKg_price + total_g1O1_pakuPayungKg_price + total_g1O1_papan325CmPcs_price + total_g1O1_pasirM3_price + total_g1O1_pekerjaOh_price + total_g1O1_semenSak_price + total_g1O1_sengBjlsPcs_price + total_g1O1_tripleks9MmPcs_price + total_g1O1_tukangOh_price;\r\n\r\nif (isNaN(total_g1O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_g1O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "g1O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "aksiG1Kasus1TambahDindingSebagaiPengkakuPanjang15M",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi G1, Kasus 2: Ganti dinding kayu dengan dinding pasangan bata.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "aksiG2Kasus2GantiDindingKayuDenganDindingPasanganBata",
            "conditional": {
                "show": true,
                "when": "QG1",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true
        }, {
            "label": "G1 O2 Jumlah dinding, unit:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "g1O2_input",
            "conditional": {
                "show": true,
                "when": "aksiG2Kasus2GantiDindingKayuDenganDindingPasanganBata",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "G1_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "data": {
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "g1O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "defaultValue": "{\"retrofitAction\":\"G1_O2\",\"bataMerahPcs\":420,\"batuKaliM3\":0.756,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.507,\"kayuKelasIi57CmX4MPcs\":3.36,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.41,\"kerikilM3\":0.121,\"lemKayuKg\":0,\"mandorOh\":0.57,\"minyakBekistingLtr\":0.71,\"paku57CmKg\":1.275,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.932,\"pekerjaOh\":10.01,\"semenSak\":9.531,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.454,\"tukangOh\":3.55,\"besiPolos8MmX12MPcs\":2.833,\"besiUlir10MmX12MPcs\":3.133,\"id\":\"5f0ec1f09106b23be4180fe2\"}",
            "addResource": false,
            "reference": false
        }, {
            "label": "G1_O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.g1O2UnitQuantities);\r\ntotal_g1O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.g1O2_input;\r\ntotal_g1O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.g1O2_input;\r\ntotal_g1O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.g1O2_input;\r\ntotal_g1O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.g1O2_input;\r\ntotal_g1O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.g1O2_input;\r\ntotal_g1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.g1O2_input;\r\ntotal_g1O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.g1O2_input;\r\ntotal_g1O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.g1O2_input;\r\ntotal_g1O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.g1O2_input;\r\ntotal_g1O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.g1O2_input;\r\ntotal_g1O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.g1O2_input;\r\ntotal_g1O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.g1O2_input;\r\ntotal_g1O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.g1O2_input;\r\ntotal_g1O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.g1O2_input;\r\ntotal_g1O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.g1O2_input;\r\ntotal_g1O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.g1O2_input;\r\ntotal_g1O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.g1O2_input;\r\ntotal_g1O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.g1O2_input;\r\ntotal_g1O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.g1O2_input;\r\ntotal_g1O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.g1O2_input;\r\ntotal_g1O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.g1O2_input;\r\ntotal_g1O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.g1O2_input;\r\ntotal_g1O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.g1O2_input;\r\ntotal_g1O2_price = total_g1O2_bataMerahPcs_price + total_g1O2_batuKaliM3_price + total_g1O2_bautJLPcs_price + total_g1O2_besiPolos8MmX12MPcs_price + total_g1O2_besiUlir10MmX12MPcs_price + total_g1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_g1O2_kawatBetonKg_price + total_g1O2_kayuKelasIi57CmX4MPcs_price + total_g1O2_kayuKelasIi612CmX4MPcs_price + total_g1O2_kepalaTukangOh_price + total_g1O2_kerikilM3_price + total_g1O2_lemKayuKg_price + total_g1O2_mandorOh_price + total_g1O2_minyakBekistingLtr_price + total_g1O2_paku57CmKg_price + total_g1O2_pakuPayungKg_price + total_g1O2_papan325CmPcs_price + total_g1O2_pasirM3_price + total_g1O2_pekerjaOh_price + total_g1O2_semenSak_price + total_g1O2_sengBjlsPcs_price + total_g1O2_tripleks9MmPcs_price + total_g1O2_tukangOh_price;\r\n\r\nif (isNaN(total_g1O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_g1O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "g1O2TotalPrice",
            "conditional": {
                "show": true,
                "when": "aksiG2Kasus2GantiDindingKayuDenganDindingPasanganBata",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }]
}, {
    "title": "QH: Atap",
    "label": "QH",
    "type": "panel",
    "key": "QH",
    "components": [{
        "label": "QH1: Atap menggunakan genteng yang berat",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QH1",
        "type": "checkbox",
        "input": true
    }, {
        "title": "QH1 Pilihan Aksi",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "qh1PilihanAksi",
        "conditional": {
            "show": true,
            "when": "QH1",
            "eq": "true"
        },
        "type": "panel",
        "label": "Panel",
        "input": false,
        "components": [{
            "label": "Aksi H1, Opsi1: Ganti genteng yang berat dengan penutup atap yang berbahan  ringan seperti seng.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "calculateServer": false,
            "key": "aksiH1Opsi1GantiGentengYangBeratDenganPenutupAtapYangBerbahanRinganSepertiSeng",
            "conditional": {
                "show": true,
                "when": "QH1",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true
        }, {
            "label": "H1 O1 Luas atap, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "h1O1_input",
            "conditional": {
                "show": true,
                "when": "aksiH1Opsi1GantiGentengYangBeratDenganPenutupAtapYangBerbahanRinganSepertiSeng",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "H1_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"H1_O1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.014,\"kerikilM3\":0,\"lemKayuKg\":0,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":0.12,\"papan325CmPcs\":0,\"pasirM3\":0,\"pekerjaOh\":0.26,\"semenSak\":0,\"sengBjlsPcs\":0.556,\"tripleks9MmPcs\":0,\"tukangOh\":0.135,\"mandorOh\":0.014,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ec2519106b23c29535e72\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "h1O1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "H1_O1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.h1O1UnitQuantities);\r\ntotal_h1O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.h1O1_input;\r\ntotal_h1O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.h1O1_input;\r\ntotal_h1O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.h1O1_input;\r\ntotal_h1O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.h1O1_input;\r\ntotal_h1O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.h1O1_input;\r\ntotal_h1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.h1O1_input;\r\ntotal_h1O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.h1O1_input;\r\ntotal_h1O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.h1O1_input;\r\ntotal_h1O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.h1O1_input;\r\ntotal_h1O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.h1O1_input;\r\ntotal_h1O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.h1O1_input;\r\ntotal_h1O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.h1O1_input;\r\ntotal_h1O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.h1O1_input;\r\ntotal_h1O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.h1O1_input;\r\ntotal_h1O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.h1O1_input;\r\ntotal_h1O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.h1O1_input;\r\ntotal_h1O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.h1O1_input;\r\ntotal_h1O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.h1O1_input;\r\ntotal_h1O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.h1O1_input;\r\ntotal_h1O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.h1O1_input;\r\ntotal_h1O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.h1O1_input;\r\ntotal_h1O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.h1O1_input;\r\ntotal_h1O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.h1O1_input;\r\ntotal_h1O1_price = total_h1O1_bataMerahPcs_price + total_h1O1_batuKaliM3_price + total_h1O1_bautJLPcs_price + total_h1O1_besiPolos8MmX12MPcs_price + total_h1O1_besiUlir10MmX12MPcs_price + total_h1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_h1O1_kawatBetonKg_price + total_h1O1_kayuKelasIi57CmX4MPcs_price + total_h1O1_kayuKelasIi612CmX4MPcs_price + total_h1O1_kepalaTukangOh_price + total_h1O1_kerikilM3_price + total_h1O1_lemKayuKg_price + total_h1O1_mandorOh_price + total_h1O1_minyakBekistingLtr_price + total_h1O1_paku57CmKg_price + total_h1O1_pakuPayungKg_price + total_h1O1_papan325CmPcs_price + total_h1O1_pasirM3_price + total_h1O1_pekerjaOh_price + total_h1O1_semenSak_price + total_h1O1_sengBjlsPcs_price + total_h1O1_tripleks9MmPcs_price + total_h1O1_tukangOh_price;\r\n\r\nif (isNaN(total_h1O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_h1O1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "h1O1TotalPrice",
            "conditional": {
                "show": true,
                "when": "aksiH1Opsi1GantiGentengYangBeratDenganPenutupAtapYangBerbahanRinganSepertiSeng",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "Aksi H1, Opsi 2: Jika tetap memakai genteng, Ikatkan genteng ke reng bisa dengan menggunakan kawat dan paku. Pastikan terdapat tiang beton bertulang yang terhubung dari pondasi ke kayu nok dan juga terhubung dengan baik ke ring balok diatas pasangan dinding bata.",
            "shortcut": 0,
            "tableView": false,
            "calculateServer": false,
            "key": "aksiH1Opsi2JikaTetapMemakaiGentengIkatkanGentengKeRengBisaDenganMenggunakanKawatDanPakuPastikanTerdapatTiangBetonBertulangYangTerhubungDariPondasiKeKayuNokDanJugaTerhubungDenganBaikKeRingBalokDiatasPasanganDindingBata",
            "conditional": {
                "show": true,
                "when": "QH1",
                "eq": "true"
            },
            "type": "checkbox",
            "input": true,
            "defaultValue": false
        }, {
            "label": "H1 O2 Luas atap, m2:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "h1O2_input",
            "conditional": {
                "show": true,
                "when": "aksiH1Opsi2JikaTetapMemakaiGentengIkatkanGentengKeRengBisaDenganMenggunakanKawatDanPakuPastikanTerdapatTiangBetonBertulangYangTerhubungDariPondasiKeKayuNokDanJugaTerhubungDenganBaikKeRingBalokDiatasPasanganDindingBata",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "H1_O2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"H1_O2\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.091,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0.014,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.014,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.2,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0,\"pekerjaOh\":0.27,\"semenSak\":0,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0.135,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ec2a59106b23ca4235f12\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "h1O2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "H1_O2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.h1O2UnitQuantities);\r\ntotal_h1O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.h1O2_input;\r\ntotal_h1O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.h1O2_input;\r\ntotal_h1O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.h1O2_input;\r\ntotal_h1O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.h1O2_input;\r\ntotal_h1O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.h1O2_input;\r\ntotal_h1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.h1O2_input;\r\ntotal_h1O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.h1O2_input;\r\ntotal_h1O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.h1O2_input;\r\ntotal_h1O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.h1O2_input;\r\ntotal_h1O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.h1O2_input;\r\ntotal_h1O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.h1O2_input;\r\ntotal_h1O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.h1O2_input;\r\ntotal_h1O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.h1O2_input;\r\ntotal_h1O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.h1O2_input;\r\ntotal_h1O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.h1O2_input;\r\ntotal_h1O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.h1O2_input;\r\ntotal_h1O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.h1O2_input;\r\ntotal_h1O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.h1O2_input;\r\ntotal_h1O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.h1O2_input;\r\ntotal_h1O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.h1O2_input;\r\ntotal_h1O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.h1O2_input;\r\ntotal_h1O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.h1O2_input;\r\ntotal_h1O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.h1O2_input;\r\ntotal_h1O2_price = total_h1O2_bataMerahPcs_price + total_h1O2_batuKaliM3_price + total_h1O2_bautJLPcs_price + total_h1O2_besiPolos8MmX12MPcs_price + total_h1O2_besiUlir10MmX12MPcs_price + total_h1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_h1O2_kawatBetonKg_price + total_h1O2_kayuKelasIi57CmX4MPcs_price + total_h1O2_kayuKelasIi612CmX4MPcs_price + total_h1O2_kepalaTukangOh_price + total_h1O2_kerikilM3_price + total_h1O2_lemKayuKg_price + total_h1O2_mandorOh_price + total_h1O2_minyakBekistingLtr_price + total_h1O2_paku57CmKg_price + total_h1O2_pakuPayungKg_price + total_h1O2_papan325CmPcs_price + total_h1O2_pasirM3_price + total_h1O2_pekerjaOh_price + total_h1O2_semenSak_price + total_h1O2_sengBjlsPcs_price + total_h1O2_tripleks9MmPcs_price + total_h1O2_tukangOh_price;\r\n\r\nif (isNaN(total_h1O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_h1O2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "h1O1TotalPrice1",
            "conditional": {
                "show": true,
                "when": "aksiH1Opsi2JikaTetapMemakaiGentengIkatkanGentengKeRengBisaDenganMenggunakanKawatDanPakuPastikanTerdapatTiangBetonBertulangYangTerhubungDariPondasiKeKayuNokDanJugaTerhubungDenganBaikKeRingBalokDiatasPasanganDindingBata",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QH2: Tidak ada ikatan antara struktur atap dengan ring balok",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QH2",
        "type": "checkbox",
        "input": true
    }, {
        "title": "QH2 Pilihan Aksi",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "qh2PilihanAksi",
        "conditional": {
            "show": true,
            "when": "QH2",
            "eq": "true"
        },
        "type": "panel",
        "label": "Panel",
        "input": false,
        "components": [{
            "label": "Aksi H2",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi H2: Hubungkan kuda-kuda ke ring balok beton bertulang di bawah menggunakan plat strip tebal 1mm, lebar 5.5cm yang tertanam ke dalam beton.",
            "refreshOnChange": false,
            "tableView": false,
            "key": "aksiH2",
            "conditional": {
                "show": true,
                "when": "QH2",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "H2 Jumlah kuda-kuda, bh:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "h2_input",
            "conditional": {
                "show": true,
                "when": "QH2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "H2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"H2\",\"batuKaliM3\":0,\"bautJLPcs\":2,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0.251,\"kayuKelasIi612CmX4MPcs\":0,\"kepalaTukangOh\":0,\"kerikilM3\":0.007,\"lemKayuKg\":0,\"mandorOh\":0.01,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0.006,\"pekerjaOh\":0.109,\"semenSak\":0.106,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.041,\"tukangOh\":0,\"bataMerahPcs\":0,\"paku57CmKg\":0.08,\"minyakBekistingLtr\":0.064,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ec3629106b23d26119de2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "h2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "H2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.h2UnitQuantities);\r\ntotal_h2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.h2_input;\r\ntotal_h2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.h2_input;\r\ntotal_h2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.h2_input;\r\ntotal_h2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.h2_input;\r\ntotal_h2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.h2_input;\r\ntotal_h2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.h2_input;\r\ntotal_h2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.h2_input;\r\ntotal_h2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.h2_input;\r\ntotal_h2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.h2_input;\r\ntotal_h2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.h2_input;\r\ntotal_h2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.h2_input;\r\ntotal_h2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.h2_input;\r\ntotal_h2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.h2_input;\r\ntotal_h2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.h2_input;\r\ntotal_h2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.h2_input;\r\ntotal_h2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.h2_input;\r\ntotal_h2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.h2_input;\r\ntotal_h2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.h2_input;\r\ntotal_h2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.h2_input;\r\ntotal_h2_semenSak_price = v1.semenSak_price * v2.semenSak * data.h2_input;\r\ntotal_h2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.h2_input;\r\ntotal_h2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.h2_input;\r\ntotal_h2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.h2_input;\r\ntotal_h2_price = total_h2_bataMerahPcs_price + total_h2_batuKaliM3_price + total_h2_bautJLPcs_price + total_h2_besiPolos8MmX12MPcs_price + total_h2_besiUlir10MmX12MPcs_price + total_h2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_h2_kawatBetonKg_price + total_h2_kayuKelasIi57CmX4MPcs_price + total_h2_kayuKelasIi612CmX4MPcs_price + total_h2_kepalaTukangOh_price + total_h2_kerikilM3_price + total_h2_lemKayuKg_price + total_h2_mandorOh_price + total_h2_minyakBekistingLtr_price + total_h2_paku57CmKg_price + total_h2_pakuPayungKg_price + total_h2_papan325CmPcs_price + total_h2_pasirM3_price + total_h2_pekerjaOh_price + total_h2_semenSak_price + total_h2_sengBjlsPcs_price + total_h2_tripleks9MmPcs_price + total_h2_tukangOh_price;\r\n\r\nif (isNaN(total_h2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_h2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "h1O1TotalPrice2",
            "conditional": {
                "show": true,
                "when": "QH2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QH3: Tidak ada ikatan angin",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QH3",
        "type": "checkbox",
        "input": true
    }, {
        "title": "QH3 Pilihan Aksi",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "qh3PilihanAksi",
        "conditional": {
            "show": true,
            "when": "QH3",
            "eq": "true"
        },
        "type": "panel",
        "label": "Panel",
        "input": false,
        "components": [{
            "label": "Aksi H3",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi H3: Pasang ikatan angin di antara kuda-kuda atap",
            "refreshOnChange": false,
            "tableView": false,
            "key": "aksiH3",
            "conditional": {
                "show": true,
                "when": "QH3",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "H3 Jumlah ikatan angin, set:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "h3_input",
            "conditional": {
                "show": true,
                "when": "QH3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "H3 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "data": {
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "h3UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "defaultValue": "{\"retrofitAction\":\"H3\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":1.677,\"kepalaTukangOh\":0,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.869,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.06,\"pakuPayungKg\":0,\"papan325CmPcs\":0,\"pasirM3\":0,\"pekerjaOh\":0.29,\"semenSak\":0.087,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":0,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ec39d9106b23d5228dd62\"}",
            "addResource": false,
            "reference": false
        }, {
            "label": "H3 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.h3UnitQuantities);\r\ntotal_h3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.h3_input;\r\ntotal_h3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.h3_input;\r\ntotal_h3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.h3_input;\r\ntotal_h3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.h3_input;\r\ntotal_h3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.h3_input;\r\ntotal_h3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.h3_input;\r\ntotal_h3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.h3_input;\r\ntotal_h3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.h3_input;\r\ntotal_h3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.h3_input;\r\ntotal_h3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.h3_input;\r\ntotal_h3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.h3_input;\r\ntotal_h3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.h3_input;\r\ntotal_h3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.h3_input;\r\ntotal_h3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.h3_input;\r\ntotal_h3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.h3_input;\r\ntotal_h3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.h3_input;\r\ntotal_h3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.h3_input;\r\ntotal_h3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.h3_input;\r\ntotal_h3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.h3_input;\r\ntotal_h3_semenSak_price = v1.semenSak_price * v2.semenSak * data.h3_input;\r\ntotal_h3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.h3_input;\r\ntotal_h3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.h3_input;\r\ntotal_h3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.h3_input;\r\ntotal_h3_price = total_h3_bataMerahPcs_price + total_h3_batuKaliM3_price + total_h3_bautJLPcs_price + total_h3_besiPolos8MmX12MPcs_price + total_h3_besiUlir10MmX12MPcs_price + total_h3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_h3_kawatBetonKg_price + total_h3_kayuKelasIi57CmX4MPcs_price + total_h3_kayuKelasIi612CmX4MPcs_price + total_h3_kepalaTukangOh_price + total_h3_kerikilM3_price + total_h3_lemKayuKg_price + total_h3_mandorOh_price + total_h3_minyakBekistingLtr_price + total_h3_paku57CmKg_price + total_h3_pakuPayungKg_price + total_h3_papan325CmPcs_price + total_h3_pasirM3_price + total_h3_pekerjaOh_price + total_h3_semenSak_price + total_h3_sengBjlsPcs_price + total_h3_tripleks9MmPcs_price + total_h3_tukangOh_price;\r\n\r\nif (isNaN(total_h3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_h3_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "h3TotalPrice",
            "conditional": {
                "show": true,
                "when": "QH3",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }]
    }],
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false
}, {
    "title": "QI: Beranda",
    "label": "QI: BERANDA",
    "type": "panel",
    "key": "QI",
    "components": [{
        "label": "QI1: Atap beranda terbuat dari bahan genteng yang berat",
        "shortcut": 0,
        "tableView": false,
        "calculateServer": false,
        "key": "QI1",
        "type": "checkbox",
        "input": true,
        "defaultValue": false
    }, {
        "title": "Aksi QI1",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "AksiQI1",
        "conditional": {
            "show": true,
            "when": "QI1",
            "eq": "true"
        },
        "type": "panel",
        "label": "Aksi QI1",
        "input": false,
        "components": [{
            "label": "Aksi I1",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi I1: Ganti gabel (sopi-sopi) dinding bata yang berat dengan bahan yang ringan",
            "refreshOnChange": false,
            "tableView": false,
            "key": "I1",
            "conditional": {
                "show": true,
                "when": "QI1",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "I1 Jumlah gabel (sopi-sopi) beranda, bh:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateServer": false,
            "key": "i1_input",
            "conditional": {
                "show": true,
                "when": "QI1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }, {
            "label": "I1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": "{\"retrofitAction\":\"I1\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":3,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":2.35,\"kepalaTukangOh\":0.15,\"lemKayuKg\":0.068,\"mandorOh\":0.2,\"minyakBekistingLtr\":0,\"paku57CmKg\":0.085,\"pakuPayungKg\":0,\"papan325CmPcs\":1.63,\"pasirM3\":0.009,\"pekerjaOh\":0.88,\"semenSak\":0.158,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0,\"tukangOh\":1.52,\"kerikilM3\":0.01,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ec4149106b23e0225e5a2\"}",
            "data": {
                "values": [{
                    "label": "",
                    "value": ""
                }],
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "i1UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
        }, {
            "label": "I1 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.i1UnitQuantities);\r\ntotal_i1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.i1_input;\r\ntotal_i1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.i1_input;\r\ntotal_i1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.i1_input;\r\ntotal_i1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.i1_input;\r\ntotal_i1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.i1_input;\r\ntotal_i1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.i1_input;\r\ntotal_i1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.i1_input;\r\ntotal_i1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.i1_input;\r\ntotal_i1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.i1_input;\r\ntotal_i1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.i1_input;\r\ntotal_i1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.i1_input;\r\ntotal_i1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.i1_input;\r\ntotal_i1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.i1_input;\r\ntotal_i1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.i1_input;\r\ntotal_i1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.i1_input;\r\ntotal_i1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.i1_input;\r\ntotal_i1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.i1_input;\r\ntotal_i1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.i1_input;\r\ntotal_i1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.i1_input;\r\ntotal_i1_semenSak_price = v1.semenSak_price * v2.semenSak * data.i1_input;\r\ntotal_i1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.i1_input;\r\ntotal_i1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.i1_input;\r\ntotal_i1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.i1_input;\r\ntotal_i1_price = total_i1_bataMerahPcs_price + total_i1_batuKaliM3_price + total_i1_bautJLPcs_price + total_i1_besiPolos8MmX12MPcs_price + total_i1_besiUlir10MmX12MPcs_price + total_i1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_i1_kawatBetonKg_price + total_i1_kayuKelasIi57CmX4MPcs_price + total_i1_kayuKelasIi612CmX4MPcs_price + total_i1_kepalaTukangOh_price + total_i1_kerikilM3_price + total_i1_lemKayuKg_price + total_i1_mandorOh_price + total_i1_minyakBekistingLtr_price + total_i1_paku57CmKg_price + total_i1_pakuPayungKg_price + total_i1_papan325CmPcs_price + total_i1_pasirM3_price + total_i1_pekerjaOh_price + total_i1_semenSak_price + total_i1_sengBjlsPcs_price + total_i1_tripleks9MmPcs_price + total_i1_tukangOh_price;\r\n\r\nif (isNaN(total_i1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_i1_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "i1TotalPrice",
            "conditional": {
                "show": true,
                "when": "QI1",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QI2: Ring balok di beranda posisinya lebih tinggi dari 3m",
        "shortcut": 0,
        "tableView": false,
        "defaultValue": false,
        "calculateServer": false,
        "key": "QI2",
        "type": "checkbox",
        "input": true
    }, {
        "title": "Aksi QI2",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "AksiQI2",
        "conditional": {
            "show": true,
            "when": "QI2",
            "eq": "true"
        },
        "type": "panel",
        "label": "Aksi QI2",
        "input": false,
        "components": [{
            "label": "Aksi I2",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi I2: Ganti genteng atap yang berat dengan material ringan (atap seng)",
            "refreshOnChange": false,
            "tableView": false,
            "key": "I2",
            "conditional": {
                "show": true,
                "when": "QI2",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "I2 Lebar beranda, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "i2_input",
            "conditional": {
                "show": true,
                "when": "QI2",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }, {
            "label": "I2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "data": {
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "i2UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "defaultValue": "{\"retrofitAction\":\"I2\",\"bataMerahPcs\":0,\"batuKaliM3\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0,\"kayuKelasIi57CmX4MPcs\":0,\"kayuKelasIi612CmX4MPcs\":0,\"kerikilM3\":0,\"lemKayuKg\":0,\"mandorOh\":0.2,\"minyakBekistingLtr\":0,\"paku57CmKg\":0,\"pakuPayungKg\":1.61,\"papan325CmPcs\":0,\"pasirM3\":0,\"pekerjaOh\":0.8,\"semenSak\":0,\"sengBjlsPcs\":7.454,\"tripleks9MmPcs\":0,\"tukangOh\":0.31,\"kepalaTukangOh\":0.03,\"besiPolos8MmX12MPcs\":0,\"besiUlir10MmX12MPcs\":0,\"id\":\"5f0ec46f9106b23e4444c922\"}",
            "addResource": false,
            "reference": false
        }, {
            "label": "I2 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.i2UnitQuantities);\r\ntotal_i2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.i2_input;\r\ntotal_i2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.i2_input;\r\ntotal_i2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.i2_input;\r\ntotal_i2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.i2_input;\r\ntotal_i2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.i2_input;\r\ntotal_i2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.i2_input;\r\ntotal_i2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.i2_input;\r\ntotal_i2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.i2_input;\r\ntotal_i2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.i2_input;\r\ntotal_i2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.i2_input;\r\ntotal_i2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.i2_input;\r\ntotal_i2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.i2_input;\r\ntotal_i2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.i2_input;\r\ntotal_i2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.i2_input;\r\ntotal_i2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.i2_input;\r\ntotal_i2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.i2_input;\r\ntotal_i2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.i2_input;\r\ntotal_i2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.i2_input;\r\ntotal_i2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.i2_input;\r\ntotal_i2_semenSak_price = v1.semenSak_price * v2.semenSak * data.i2_input;\r\ntotal_i2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.i2_input;\r\ntotal_i2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.i2_input;\r\ntotal_i2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.i2_input;\r\ntotal_i2_price = total_i2_bataMerahPcs_price + total_i2_batuKaliM3_price + total_i2_bautJLPcs_price + total_i2_besiPolos8MmX12MPcs_price + total_i2_besiUlir10MmX12MPcs_price + total_i2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_i2_kawatBetonKg_price + total_i2_kayuKelasIi57CmX4MPcs_price + total_i2_kayuKelasIi612CmX4MPcs_price + total_i2_kepalaTukangOh_price + total_i2_kerikilM3_price + total_i2_lemKayuKg_price + total_i2_mandorOh_price + total_i2_minyakBekistingLtr_price + total_i2_paku57CmKg_price + total_i2_pakuPayungKg_price + total_i2_papan325CmPcs_price + total_i2_pasirM3_price + total_i2_pekerjaOh_price + total_i2_semenSak_price + total_i2_sengBjlsPcs_price + total_i2_tripleks9MmPcs_price + total_i2_tukangOh_price;\r\n\r\nif (isNaN(total_i2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_i2_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "i2TotalPrice",
            "conditional": {
                "show": true,
                "when": "QI2",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }, {
        "label": "QI3: Jarak antara beranda dengan bagian depan rumah lebih dari 2m",
        "shortcut": 0,
        "tableView": false,
        "calculateServer": false,
        "key": "QI3",
        "type": "checkbox",
        "input": true,
        "defaultValue": false
    }, {
        "title": "Aksi QI3",
        "breadcrumbClickable": true,
        "buttonSettings": {
            "previous": true,
            "cancel": true,
            "next": true
        },
        "collapsible": false,
        "tableView": false,
        "key": "AksiQI3",
        "conditional": {
            "show": true,
            "when": "QI3",
            "eq": "true"
        },
        "type": "panel",
        "label": "Aksi QI2",
        "input": false,
        "components": [{
            "label": "Aksi I3",
            "attrs": [{
                "attr": "",
                "value": ""
            }],
            "content": "Aksi I3: Jika beranda terlalu tinggi atau terlalu jauh dari bangunan utama, bongkar dan bangun baru sesuai dengan buku panduan",
            "refreshOnChange": false,
            "tableView": false,
            "key": "I3",
            "conditional": {
                "show": true,
                "when": "QI3",
                "eq": "true"
            },
            "type": "htmlelement",
            "input": false
        }, {
            "label": "I3 Jumlah beranda, unit:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "calculateServer": false,
            "key": "i3_input",
            "conditional": {
                "show": true,
                "when": "QI3",
                "eq": "true"
            },
            "type": "number",
            "input": true
        }, {
            "label": "I3 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "data": {
                "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "calculateServer": false,
            "key": "i3UnitQuantities",
            "type": "select",
            "indexeddb": {
                "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "defaultValue": "{\"retrofitAction\":\"I3\",\"bataMerahPcs\":0,\"bautJLPcs\":0,\"kawatAnyam1MmX1InSpaciX12MX30MBal\":0,\"kawatBetonKg\":0.807,\"kayuKelasIi57CmX4MPcs\":14.609,\"kayuKelasIi612CmX4MPcs\":3,\"kepalaTukangOh\":0.95,\"kerikilM3\":0.194,\"lemKayuKg\":0.086,\"mandorOh\":0.73,\"minyakBekistingLtr\":1.38,\"paku57CmKg\":4.569,\"pakuPayungKg\":0,\"papan325CmPcs\":0.652,\"pasirM3\":0.36,\"pekerjaOh\":11.3,\"semenSak\":4.892,\"sengBjlsPcs\":0,\"tripleks9MmPcs\":0.883,\"tukangOh\":9.52,\"batuKaliM3\":0.454,\"besiPolos8MmX12MPcs\":4.8,\"besiUlir10MmX12MPcs\":4.8,\"id\":\"5f0ec5c49106b23f795d3642\"}",
            "addResource": false,
            "reference": false
        }, {
            "label": "I3 Total Price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.i3UnitQuantities);\r\ntotal_i3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.i3_input;\r\ntotal_i3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.i3_input;\r\ntotal_i3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.i3_input;\r\ntotal_i3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.i3_input;\r\ntotal_i3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.i3_input;\r\ntotal_i3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.i3_input;\r\ntotal_i3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.i3_input;\r\ntotal_i3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.i3_input;\r\ntotal_i3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.i3_input;\r\ntotal_i3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.i3_input;\r\ntotal_i3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.i3_input;\r\ntotal_i3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.i3_input;\r\ntotal_i3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.i3_input;\r\ntotal_i3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.i3_input;\r\ntotal_i3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.i3_input;\r\ntotal_i3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.i3_input;\r\ntotal_i3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.i3_input;\r\ntotal_i3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.i3_input;\r\ntotal_i3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.i3_input;\r\ntotal_i3_semenSak_price = v1.semenSak_price * v2.semenSak * data.i3_input;\r\ntotal_i3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.i3_input;\r\ntotal_i3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.i3_input;\r\ntotal_i3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.i3_input;\r\ntotal_i3_price = total_i3_bataMerahPcs_price + total_i3_batuKaliM3_price + total_i3_bautJLPcs_price + total_i3_besiPolos8MmX12MPcs_price + total_i3_besiUlir10MmX12MPcs_price + total_i3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_i3_kawatBetonKg_price + total_i3_kayuKelasIi57CmX4MPcs_price + total_i3_kayuKelasIi612CmX4MPcs_price + total_i3_kepalaTukangOh_price + total_i3_kerikilM3_price + total_i3_lemKayuKg_price + total_i3_mandorOh_price + total_i3_minyakBekistingLtr_price + total_i3_paku57CmKg_price + total_i3_pakuPayungKg_price + total_i3_papan325CmPcs_price + total_i3_pasirM3_price + total_i3_pekerjaOh_price + total_i3_semenSak_price + total_i3_sengBjlsPcs_price + total_i3_tripleks9MmPcs_price + total_i3_tukangOh_price;\r\n\r\nif (isNaN(total_i3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_i3_price;\r\n  }\r\ninstance.setValue(value);",
            "calculateServer": false,
            "key": "i3TotalPrice",
            "conditional": {
                "show": true,
                "when": "QI3",
                "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
        }]
    }],
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false
}, {
    "title": "Wrap Up Page",
    "label": "Page 11",
    "type": "panel",
    "key": "page11",
    "components": [{
        "label": "Total bata merah (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalBataMerahPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total baut J\/L (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalBautJLPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total batu kali (m3)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalBatuKaliM3",
        "type": "number",
        "input": true
    }, {
        "label": "Total besi polos 8mm x 12m (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalBesiPolos8MmX12MPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total besi ulir 10mm x 12m (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalBesiUlir10MmX12MPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total kawat anyam 1mm x 1in spaci x 1.2m x 30m (bal)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalKawatAnyam1MmX1InSpaciX12MX30MBal",
        "type": "number",
        "input": true
    }, {
        "label": "Total kawat benton (kg)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalKawatBentonKg",
        "type": "number",
        "input": true
    }, {
        "label": "Total kayu kelas II 5\/7cm x 4m (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalKayuKelasIi57CmX4MPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total kayu kelas II 6\/12cm x 4m (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalKayuKelasIi612CmX4MPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total kepala tukang (OH)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalKepalaTukangOh",
        "type": "number",
        "input": true
    }, {
        "label": "Total kerikil (m3)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalKerikilM3",
        "type": "number",
        "input": true
    }, {
        "label": "Total lem kayu (kg)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalLemKayuKg",
        "type": "number",
        "input": true
    }, {
        "label": "Total mandor (OH)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalMandorOh",
        "type": "number",
        "input": true
    }, {
        "label": "Total minyak bekisting (ltr)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalMinyakBekistingLtr",
        "type": "number",
        "input": true
    }, {
        "label": "Total paku 5-7cm (kg)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalPaku57CmKg",
        "type": "number",
        "input": true
    }, {
        "label": "Total paku payung (kg)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalPakuPayungKg",
        "type": "number",
        "input": true
    }, {
        "label": "Total papan 3\/25cm (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalPapan325CmPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total pasir (m3)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalPasirM3",
        "type": "number",
        "input": true
    }, {
        "label": "Total pekerja (OH)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalPekerjaOh",
        "type": "number",
        "input": true
    }, {
        "label": "Total semen (sak)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalSemenSak",
        "type": "number",
        "input": true
    }, {
        "label": "Total seng BJLS (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalSengBjlsPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total Tripleks 9mm (pcs)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalTripleks9MmPcs",
        "type": "number",
        "input": true
    }, {
        "label": "Total tukang (OH)",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateServer": false,
        "key": "totalTukangOh",
        "type": "number",
        "input": true
    }],
    "input": false,
    "tableView": false,
    "breadcrumbClickable": true,
    "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
    },
    "collapsible": false
}, {
    "title": "Page 12",
    "label": "Page 12",
    "type": "panel",
    "key": "page12",
    "components": [{
        "label": "final text",
        "editor": 0,
        "autoExpand": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,

             "calculateServer": false,
        "key": "finalText",
        "type": "textarea",
        "rows": 30,
        "input": true
    }],
    "input": false,
    "tableView": false
}];
    return (
      <KeyboardAwareScrollView>
<Text>this.data{JSON.stringify(this.data)}</Text>
    <FormioComponentsList
          components={currentPageComponents}
          //components={staticData2}
         // values={currentPageSubmissionData} // Data filled by user
          //data={currentPageSubmissionData}
          values={this.data} // Data filled by user
          data={this.data}
          options={options} // Used in Value component, there's something about initial values (Value.js:36)

          attachToForm={this.attachToForm} // Register newly rendered input in inputs[]
          detachFromForm={this.detachFromForm} // Unregister input
          isSubmitting={isSubmitting} // Needed to deactivate submit button when it pressed and request is sent
          isFormValid={isValid}

          // Evoked when element renders. It's possible to modify element and return it back
          onElementRender={onElementRender}
          onChange={this.onChange} // Evoked when user modifies some data in form

          theme={theme}
          colors={{ ...colors }}

          formio={this.formio} // Didn't find any usages of this

          // This section is used for handling actions of different buttons
          onSubmit={this.onSubmit}
          onSave={this.onSave}
          onEvent={this.onEvent}
          resetForm={this.resetForm}

          showAlert={this.showAlert}
  
          // Takes a function that gets component, checks whether it's disabled and returns bool
          isDisabled={this.dummyThatSaysFalse}
          checkCalculative={this.checkCalculative}
          checkConditional={this.dummy} // Something for hidden components and data removal
          formPristine={isPristine}
        />


      
      </KeyboardAwareScrollView>
    );
  }
}

FormWizardPage.propTypes = {
  theme: PropTypes.shape({}),
  colors: PropTypes.shape({}),
  options: PropTypes.shape({
    showAlerts: PropTypes.bool,
  }),
  receiverOfCallbackForDataRetrieval: PropTypes.func.isRequired,
  currentPageComponents: PropTypes.array.isRequired,
  currentPageSubmissionData: PropTypes.shape({}),
  onElementRender: PropTypes.func,
};

FormWizardPage.defaultProps = {
  theme,
  colors,
  options: {
    showAlerts: true,
  },
  currentPageSubmissionData: null,
  onElementRender: () => {},
};

const mapStateToProps = (state) => {
    console.log(JSON.stringify("SIMPLE"+JSON.stringify(state.form)));
    let currentPage = null;
    let currentPageComponents = null;
    let currentPageSubmissionData = null;
    const checkform = state.form && state.form.form && state.form.form.display;

    if (state.form.form) {
      if (checkform === 'wizard') {
      currentPage = state.form.form.components[state.wizard.currentPage];
        currentPageComponents = state.form.form.components[state.wizard.currentPage].components;
  
        if (state.submission.rawSubmission) {
          currentPageSubmissionData = state.submission.rawSubmission.data[currentPage.key];
        }


      } else {
  
        currentPageComponents = state.form.form.components;
        currentPageSubmissionData = state.submission.rawSubmission.data.root;


       /* if (state.submission.rawSubmission) {
          currentPageSubmissionData = state.submission.rawSubmission.data[currentPage.key];
        }*/
      }
    }
  
    return {
      currentPageComponents,
      currentPageSubmissionData,
    };
  };
  


const ConnectedFormWizardPage = connect(

  mapStateToProps,
  {
   
    updateSubmissionDataAllPagesLocally: StoreActionsSubmission.updateSubmissionDataForPageLocally,

  },
  )(FormWizardPage);

export default ConnectedFormWizardPage;
