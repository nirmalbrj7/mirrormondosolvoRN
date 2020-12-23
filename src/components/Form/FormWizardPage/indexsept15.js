import React from 'react';
import { connect } from 'react-redux';
import { clone } from 'lodash';
import PropTypes from 'prop-types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text,View } from 'react-native';
import FormioComponentsList from '../formioForm/formComponents/FormioComponentsList';
import '../formioForm/formComponents/FormComponents';
import theme from '../formioForm/defaultTheme';
import colors from '../formioForm/defaultTheme/colors';
import { checkCondition, evaluate, checkCalculated } from '../formio/utils/utils';
import StoreActionsSubmission from '../../../store/actions/submission';



class FormWizardPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.selectCard = props.cardSelected;
    // data object is used to store user inputs. It's component of submission object
    if (props.currentPageSubmissionData) {
      this.data = clone(props.currentPageSubmissionData);
    } else {
      this.data = {};
    }
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
       }
       const show = checkCondition(component, row, this.data);
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
   };


  checkCalculative = (component) => {
    if (component.hasOwnProperty("calculateValue")) {

      var component = component;
      var rowData = this.data;
      var key = component.key;

      var calculateValue = component.calculateValue;
      const show = evaluate(
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
      if(key){
        alert("show"+show);
        console.log("this.data"+JSON.stringify(this.data));
        console.log("calculateValue"+JSON.stringify(calculateValue));
        console.log("rowData"+JSON.stringify(rowData));
        console.log("show"+JSON.stringify(show));
      }
      this.data[key] = show;
      this.data[key] = show;
      this.rerender = true;
      return this.data;   
    }
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

 findPath=(a, obj)=> {
    function iter(o, p) {
        return Object.keys(o).some(function (k) {
            result = p.concat(Array.isArray(o) ? +k : k);
            return o[k] === a || o[k] && typeof o[k] === 'object' && iter(o[k], result);
        });
    }
    var result;
    return iter(obj, []) && result || undefined;
}


  onChange = (component, context = {}) => {
    console.log("this.data"+JSON.stringify(this.data));
    const { isPristine } = this.state;
    const cardId = this.props.cardSelected.datagridreducer;
    const currentComponent = component.props.component;
    if (component.hasOwnProperty("calculateValue")) {
      var component = component;
      var rowData = this.data;
      var key = component.key;
      console.log("b"+JSON.stringify(key));
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

      if(key=='a1TotalPrice'){
        console.log("111this.data"+JSON.stringify(this.data));
        console.log("calculateValue"+JSON.stringify(calculateValue));
        console.log("rowData"+JSON.stringify(rowData));
        console.log("show"+JSON.stringify(show));
      }

      if (show2 != undefined) {
        this.data[component.key] = show2;

      }
    }
    if (currentComponent.hasOwnProperty('datagridItem')) {
      const datagridId = currentComponent.datagridId;
      const datagridItem = currentComponent.datagridItem;
      const currentkey = component.props.component.key;
      const parentkey = currentComponent.datagridItem;
      var currentArray = this.data[parentkey];
      const datagridSchema=this.props.datagridSchema;
      datagridSchema.map((val,index)=>{
        if(val.key==parentkey){
          if(val.parent_key.length==0){
            if ( this.data[parentkey] &&  this.data[parentkey].length > 0) {
              this.data[parentkey].map((val, index) => {
                var newindex = 0;
                if (cardId == val.id) {      
                  this.data[parentkey][index][currentkey] = component.state.value.item;
                }
              })
            }
          }

          else if(val.parent_key.length==1){
            var grandParent=val.parent_key[0];
              var mainDatagrid=this.data[grandParent][0][parentkey];
              this.data[grandParent].map((val, index) => {
                if(val[parentkey]){
                  this.data[grandParent][index][parentkey].map((val2, index2) => {
                    if(val2.id==cardId){
                      this.data[grandParent][index][parentkey][index2][currentkey] = component.state.value.item;
                    }
                  });
                }
              });
            }         
        }
      })
    } else {
      // DataGrids and containers are different.
      if (context.hasOwnProperty('datagrid')) {
        //console.log('DATAGRID CONTEXT');
        // this.data[context.datagrid.props.component.key] = context.datagrid.state.value;
      } else if (context.hasOwnProperty('container')) {
        // this.data[context.container.props.component.key] = context.container.state.value;
      } else if (component.state.value === null) {
        alert(component.props.component.key);
        delete this.data[component.props.component.key];
      } else {    
        this.data[component.props.component.key] = component.state.value.item;
      }
      // context.container.state.value
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
    //alert(this.props.checkform);
    if(this.props.checkform=='wizard'){
      if(this.props.currentPage.key){
        this.props.updateSubmissionDataAllPagesLocally(this.props.currentPage.key, this.data);
      }   
    }

    this.props.updateSubmissionDataAllPagesLocally('__root', this.data);
    this.validate();
    this.rerender = true;
  };



  render() {
    const {
      currentPageComponents, currentPageSubmissionData, options, onElementRender,
    } = this.props;
    const { isSubmitting, isValid, isPristine } = this.state;
    const staticdata=  [
      {
        "label": "Num3",
        "tableView": true,
        "calculateValue": "value=data.num1 +data.num2;",
        "key": "num3",
        "conditional": {
          "show": true,
          "when": "num1",
          "eq": "5"
        },
        "type": "textfield",
        "input": true
      }, {
        "label": "Num2",
        "tableView": true,
        "key": "num2",
        "type": "textfield",
        "input": true
      }, {
        "label": "Num1",
        "tableView": true,
        "key": "num1",
        "type": "textfield",
        "input": true
      },
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
        "key": "geoLocation",
        "type": "geolocation",
        "input": true
      }, {
        "label": "Nama Surveyor",
        "tableView": true,
        "key": "namaSurveyor",
        "type": "textfield",
        "input": true
      }, {
        "label": "Tanggal \/ Waktu",
        "format": "dd-MM-yyy hh:mm a",
        "tableView": false,
        "enableMinDateInput": false,
        "datePicker": {
          "disableWeekends": false,
          "disableWeekdays": false
        },
        "enableMaxDateInput": false,
        "key": "tanggalWaktu",
        "type": "datetime",
        "input": true,
        "suffix": "<i ref=\"icon\" class=\"fa fa-calendar\" style=\"\"><\/i>",
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
        }
      }, {
        "label": "Cityprices",
        "widget": "choicesjs",
        "tableView": true,
        "dataSrc": "resource",
        "data": {
          "values": [{
            "label": "",
            "value": ""
          }],
          "resource": "VYd98vAkEZ99ODld68ay"
        },
        "dataType": 0,
        "template": "<span>{{ item.cityUnitPrices }}<\/span>",
        "selectThreshold": 0.3,
        "clearOnHide": false,
        "key": "cityprices",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "selectFields": "cityUnitPrices,bataMerahPcs_price,batuKaliM3_price,bautJLPcs_price,besiPolos8MmX12MPcs_price,besiUlir10MmX12MPcs_price,kawatAnyam1MmX1InSpaciX12MX30MBal_price,kawatBetonKg_price,kayuKelasIi57CmX4MPcs_price,kayuKelasIi612CmX4MPcs_price,kepalaTukangOh_price,kerikilM3_price,lemKayuKg_price,mandorOh_price,minyakBekistingLtr_price,paku57CmKg_price,pakuPayungKg_price,papan325CmPcs_price,pasirM3_price,pekerjaOh_price,semenSak_price,sengBjlsPcs_price,tripleks9MmPcs_price,tukangOh_price",
        "input": true,
        "addResource": false,
        "reference": false
      }, {
        "label": "Nama Pemilik Rumah",
        "tableView": true,
        "key": "namaPemilikRumah",
        "type": "textfield",
        "input": true
      }, {
        "label": "Alamat Rumah",
        "tableView": false,
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
          "customConditional": "show = _.get(instance, 'parent.manualMode', false);"
        }, {
          "label": "Address 2",
          "tableView": false,
          "key": "address4",
          "type": "textfield",
          "input": true,
          "customConditional": "show = _.get(instance, 'parent.manualMode', false);"
        }, {
          "label": "City",
          "tableView": false,
          "key": "city2",
          "type": "textfield",
          "input": true,
          "customConditional": "show = _.get(instance, 'parent.manualMode', false);"
        }, {
          "label": "State",
          "tableView": false,
          "key": "state1",
          "type": "textfield",
          "input": true,
          "customConditional": "show = _.get(instance, 'parent.manualMode', false);"
        }, {
          "label": "Country",
          "tableView": false,
          "key": "country1",
          "type": "textfield",
          "input": true,
          "customConditional": "show = _.get(instance, 'parent.manualMode', false);"
        }, {
          "label": "Zip Code",
          "tableView": false,
          "key": "zip1",
          "type": "textfield",
          "input": true,
          "customConditional": "show = _.get(instance, 'parent.manualMode', false);"
        }],
        "providerOptions": {
          "params": {
            "key": "Lokasirumah",
            "region": ""
          }
        }
      }]
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
        "key": "QA1",
        "type": "checkbox",
        "input": true
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
          "input": false
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
          "key": "a1_input",
          "conditional": {
            "show": true,
            "when": "QA1",
            "eq": "true"
          },
          "type": "number",
          "input": true
        },
        
     
        
        {
          "label": "A1 Unit Quantities",
          "widget": "choicesjs",
          "hidden": true,
          "tableView": true,
          "dataSrc": "resource",
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
          "key": "a1UnitQuantities",
          "type": "select",
          "indexeddb": {
            "filter": []
          },
          "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
          "input": true,
          "addResource": false,
          "reference": false
        }
        , {
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
         // "calculateValue": "let v1 = data; \r\nlet v2 = data; \r\n\r\ntotal_a1_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a1_input); \r\ntotal_a1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a1_input; \r\ntotal_a1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a1_input; \r\ntotal_a1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a1_input; \r\ntotal_a1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a1_input; \r\ntotal_a1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a1_input; \r\ntotal_a1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a1_input; \r\ntotal_a1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a1_input; \r\ntotal_a1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a1_input; \r\ntotal_a1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a1_input; \r\ntotal_a1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a1_input; \r\ntotal_a1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a1_input; \r\ntotal_a1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a1_input; \r\ntotal_a1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a1_input; \r\ntotal_a1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a1_input; \r\ntotal_a1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a1_input; \r\ntotal_a1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a1_input; \r\ntotal_a1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a1_input; \r\ntotal_a1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a1_input; \r\ntotal_a1_semenSak_price = v1.semenSak_price * v2.semenSak * data.a1_input; \r\ntotal_a1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a1_input; \r\ntotal_a1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a1_input; \r\ntotal_a1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a1_input; \r\ntotal_a1_price = total_a1_bataMerahPcs_price + total_a1_batuKaliM3_price + total_a1_bautJLPcs_price + total_a1_besiPolos8MmX12MPcs_price + total_a1_besiUlir10MmX12MPcs_price + total_a1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a1_kawatBetonKg_price + total_a1_kayuKelasIi57CmX4MPcs_price + total_a1_kayuKelasIi612CmX4MPcs_price + total_a1_kepalaTukangOh_price + total_a1_kerikilM3_price + total_a1_lemKayuKg_price + total_a1_mandorOh_price + total_a1_minyakBekistingLtr_price + total_a1_paku57CmKg_price + total_a1_pakuPayungKg_price + total_a1_papan325CmPcs_price + total_a1_pasirM3_price + total_a1_pekerjaOh_price + total_a1_semenSak_price + total_a1_sengBjlsPcs_price + total_a1_tripleks9MmPcs_price + total_a1_tukangOh_price; \r\n\r\nif(isNaN(total_a1_price)) { \r\n  value = 0; \r\n } else { \r\n    value = total_a1_price; \r\n }",
         "calculateValue": "var s = data.bataMerahPcs_price\r\nvar abc = +s\r\nvar def= abc+10\r\nvalue=abc",  
   //    "calculateValue":"value=Number(data.bataMerahPcs_price) * Number(data.bataMerahPcs)",
         "key": "a1TotalPrice",
          "conditional": {
            "show": true,
            "when": "QA1",
            "eq": "true"
          },
          "type": "number",
          "input": true
        }
      
      ]
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
    }];
    return (
      <View style={{backgroundColor:'#f1f2f3'}}>
      <KeyboardAwareScrollView>
          <Text>this.data{JSON.stringify(this.data)}</Text>        
    <Text>this.state{JSON.stringify(currentPageSubmissionData)}</Text>
    <Text>this.state{JSON.stringify(this.props.sub)}</Text>
           

         
  
        <FormioComponentsList
         components={currentPageComponents}        
         values={currentPageSubmissionData}
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
          formio={this.formio} // Didn't find any usages of thi
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
      </View>
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
  onElementRender: () => { },
};

const mapStateToProps = (state) => {
  let currentPage = null;
  let currentPageComponents = null;
  let currentPageSubmissionData = null;
  let cardSelected = state;
  let datagridSchema=state.form.datagrid;
let allsubmission=state.submission;
//console.log("sttate"+JSON.stringify(state));
  const checkform = state.form && state.form.form && state.form.form.display;


  if (state.form) {
    if (checkform === 'wizard') {
      currentPage = state.form.form.components[state.wizard.currentPage];
      var pageNo = state.wizard.currentPage;
      var mycomponents = state.form.form.components;
      var mycurrentPageComponents = null;
      currentPageComponents = state.form.form.components[state.wizard.currentPage].components;
  

      if (state.submission.rawSubmission) {
        console.log("************************************************");
        console.log("************************************************");
        console.log("************************************************");
       currentPageSubmissionData = state.submission.rawSubmission.data[currentPage.key];
        //this.data=currentPageSubmissionData;
console.log("currentsubmiss"+JSON.stringify(currentPageSubmissionData));
        console.log("************************************************");
        console.log("************************************************");
        console.log("************************************************");

      }
    }
    else {
      currentPageComponents = state.form.form.components;
  currentPageSubmissionData = state.submission.rawSubmission.data.__root;
    
      //console.log(JSON.stringify("SIMPLE"+JSON.stringify(state.form)));
      //alert(JSON.stringify("SIMPLE"+JSON.stringify(state.form)));
     // currentPageSubmissionData = state.submission.rawSubmission.data.__root;
   
      //alert('data'+JSON.stringify(state.submission.rawSubmission.data.__root));
    }
  }
  /* if (state.form.form) {
     if (state.form.form.display === 'form') {
       currentPageComponents = state.form.form.components;
       console.log(JSON.stringify("SIMPLE"+JSON.stringify(state.form)));
       //alert(JSON.stringify("SIMPLE"+JSON.stringify(state.form)));
       currentPageSubmissionData = state.submission.rawSubmission.data.root;
     } else {
      
     }
   }*/

  return {
    currentPageComponents,
    currentPageSubmissionData,
    cardSelected,
    datagridSchema,
    allsubmission,
    sub:state.submission,
    resource:state.resourcereducer,
    currentPage,
    checkform
  };
};


const ConnectedFormWizardPage = connect(

  mapStateToProps,
  {

    updateSubmissionDataAllPagesLocally: StoreActionsSubmission.updateSubmissionDataForPageLocally,

  },
)(FormWizardPage);

export default ConnectedFormWizardPage;
