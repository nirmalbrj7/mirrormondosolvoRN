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
     // var show2= checkCalculated(component, this.data, rowData); 



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
      
    //  var show= checkCalculated(component, this.data, rowData); 

      
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

     // var show2= checkCalculated(component, this.data, rowData); 

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
      currentPageComponents, currentPageSubmissionData, options, onElementRender,formId
    } = this.props;
    const { isSubmitting, isValid, isPristine } = this.state;
    const staticdata=  [
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
          "label": "Tanggal",
          "hideInputLabels": false,
          "inputsLabelPosition": "top",
          "useLocaleSettings": false,
          "tableView": false,
          "fields": {
            "day": {
              "hide": false
            },
            "month": {
              "hide": false
            },
            "year": {
              "hide": false
            }
          },
          "defaultValue": "00\/00\/0000",
          "key": "day",
          "type": "day",
          "input": true
        }, {
          "label": "Nama Surveyor",
          "tableView": true,
          "key": "namaSurveyor",
          "type": "textfield",
          "input": true
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
          }, {
            "label": "A1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": {
              "date": "07\/17\/2020",
              "retrofitAction": "A1",
              "bataMerahPcs": 0,
              "batuKaliM3": 0,
              "bautJLPcs": 0,
              "besiPolos8MmX12M": 0,
              "besiUlir10MmX12M": 0,
              "kawatAnyam1MmX1InSpaciX12MX30MBal": 0,
              "kawatBetonKg": 0,
              "kayuKelasIi57CmX4MPcs": 0,
              "kayuKelasIi612CmX4MPcs": 0,
              "kepalaTukangOh": 0.01,
              "kerikilM3": 0,
              "lemKayuKg": 0,
              "mandorOh": 0.02,
              "minyakBekistingLtr": 0,
              "multipleks9MmPcs": 0,
              "paku57CmKg": 0,
              "pakuPayungKg": 0,
              "papan325CmPcs": 0,
              "pasirM3": 0.028,
              "pekerjaOh": 0.26,
              "semenSak": 0.233,
              "sengBjlsPcs": 0,
              "tripleks9MmPcs": 0,
              "tukangOh": 0.1,
              "draftButton": false,
              "stage_dhrp": "ARC - Trials",
              "state": "submitted",
              "created_at": "2020-07-15 06:51:52",
              "updated_at": "2020-08-11 08:16:25",
              "user_id": 9,
              "status": "New",
              "besiPolos8MmX12MPcs": 0,
              "besiUlir10MmX12MPcs": 0,
              "id": "5f0ea7889106b21fc752d852"
            },
            "data": {
              "values": [{
                "label": "",
                "value": ""
              }],
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "template": "<span>{{ item.retrofitAction }}<\/span>",
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
            "redrawOn": "a1_input",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\nlet v2 = data;\n\ntotal_a1_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a1_input);\ntotal_a1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a1_input;\ntotal_a1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a1_input;\ntotal_a1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a1_input;\ntotal_a1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a1_input;\ntotal_a1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a1_input;\ntotal_a1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a1_input;\ntotal_a1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a1_input;\ntotal_a1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a1_input;\ntotal_a1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a1_input;\ntotal_a1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a1_input;\ntotal_a1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a1_input;\ntotal_a1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a1_input;\ntotal_a1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a1_input;\ntotal_a1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a1_input;\ntotal_a1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a1_input;\ntotal_a1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a1_input;\ntotal_a1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a1_input;\ntotal_a1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a1_input;\ntotal_a1_semenSak_price = v1.semenSak_price * v2.semenSak * data.a1_input;\ntotal_a1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a1_input;\ntotal_a1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a1_input;\ntotal_a1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a1_input;\ntotal_a1_price = total_a1_bataMerahPcs_price + total_a1_batuKaliM3_price + total_a1_bautJLPcs_price + total_a1_besiPolos8MmX12MPcs_price + total_a1_besiUlir10MmX12MPcs_price + total_a1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a1_kawatBetonKg_price + total_a1_kayuKelasIi57CmX4MPcs_price + total_a1_kayuKelasIi612CmX4MPcs_price + total_a1_kepalaTukangOh_price + total_a1_kerikilM3_price + total_a1_lemKayuKg_price + total_a1_mandorOh_price + total_a1_minyakBekistingLtr_price + total_a1_paku57CmKg_price + total_a1_pakuPayungKg_price + total_a1_papan325CmPcs_price + total_a1_pasirM3_price + total_a1_pekerjaOh_price + total_a1_semenSak_price + total_a1_sengBjlsPcs_price + total_a1_tripleks9MmPcs_price + total_a1_tukangOh_price; \n\nif (isNaN(total_a1_price)) {\n  value = 0;\n  } else {\n    value = total_a1_price;\n  }",
            "key": "a1TotalPrice",
            "conditional": {
              "show": true,
              "when": "QA1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QA2: Keretakan luas di dinding dengan lebar lebih dari 5mm",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
          "key": "QA2",
          "type": "checkbox",
          "input": true
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
            "key": "A2_O1",
            "conditional": {
              "show": true,
              "when": "QA2",
              "eq": "true"
            },
            "type": "checkbox",
            "input": true
          }, {
            "label": "A2 O1 Panjang dinding yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "key": "a2O1_input",
            "conditional": {
              "show": true,
              "when": "A2_O1",
              "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
          }, {
            "label": "A2_O1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": {
              "date": "07\/17\/2020",
              "retrofitAction": "A2_O1",
              "bataMerahPcs": 210,
              "batuKaliM3": 0,
              "bautJLPcs": 0,
              "besiPolos8MmX12M": 0,
              "besiUlir10MmX12M": 0,
              "kawatAnyam1MmX1InSpaciX12MX30MBal": 0,
              "kawatBetonKg": 0,
              "kayuKelasIi57CmX4MPcs": 16.071,
              "kayuKelasIi612CmX4MPcs": 0,
              "kepalaTukangOh": 0.13,
              "kerikilM3": 0,
              "lemKayuKg": 0,
              "mandorOh": 0.32,
              "minyakBekistingLtr": 0,
              "multipleks9MmPcs": 0,
              "paku57CmKg": 3.6,
              "pakuPayungKg": 0,
              "papan325CmPcs": 0,
              "pasirM3": 0.6,
              "pekerjaOh": 3.05,
              "semenSak": 5.389,
              "sengBjlsPcs": 0,
              "tripleks9MmPcs": 0,
              "tukangOh": 1.29,
              "draftButton": false,
              "stage_dhrp": "ARC - Trials",
              "state": "submitted",
              "created_at": "2020-07-15 06:57:02",
              "updated_at": "2020-08-11 08:16:37",
              "user_id": 9,
              "status": "New",
              "besiPolos8MmX12MPcs": 0,
              "besiUlir10MmX12MPcs": 0,
              "id": "5f0ea8be9106b221256203d2"
            },
            "data": {
              "values": [{
                "label": "",
                "value": ""
              }],
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "template": "<span>{{ item.retrofitAction }}<\/span>",
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "a2O1UnitQuantities",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
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
            "redrawOn": "a2O1_input",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_a2O1_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a2O1_input);\r\ntotal_a2O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a2O1_input;\r\ntotal_a2O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a2O1_input;\r\ntotal_a2O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a2O1_input;\r\ntotal_a2O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a2O1_input;\r\ntotal_a2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a2O1_input;\r\ntotal_a2O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a2O1_input;\r\ntotal_a2O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a2O1_input;\r\ntotal_a2O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a2O1_input;\r\ntotal_a2O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a2O1_input;\r\ntotal_a2O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a2O1_input;\r\ntotal_a2O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a2O1_input;\r\ntotal_a2O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a2O1_input;\r\ntotal_a2O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a2O1_input;\r\ntotal_a2O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a2O1_input;\r\ntotal_a2O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a2O1_input;\r\ntotal_a2O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a2O1_input;\r\ntotal_a2O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a2O1_input;\r\ntotal_a2O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a2O1_input;\r\ntotal_a2O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.a2O1_input;\r\ntotal_a2O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a2O1_input;\r\ntotal_a2O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a2O1_input;\r\ntotal_a2O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a2O1_input;\r\ntotal_a2O1_price = total_a2O1_bataMerahPcs_price + total_a2O1_batuKaliM3_price + total_a2O1_bautJLPcs_price + total_a2O1_besiPolos8MmX12MPcs_price + total_a2O1_besiUlir10MmX12MPcs_price + total_a2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a2O1_kawatBetonKg_price + total_a2O1_kayuKelasIi57CmX4MPcs_price + total_a2O1_kayuKelasIi612CmX4MPcs_price + total_a2O1_kepalaTukangOh_price + total_a2O1_kerikilM3_price + total_a2O1_lemKayuKg_price + total_a2O1_mandorOh_price + total_a2O1_minyakBekistingLtr_price + total_a2O1_paku57CmKg_price + total_a2O1_pakuPayungKg_price + total_a2O1_papan325CmPcs_price + total_a2O1_pasirM3_price + total_a2O1_pekerjaOh_price + total_a2O1_semenSak_price + total_a2O1_sengBjlsPcs_price + total_a2O1_tripleks9MmPcs_price + total_a2O1_tukangOh_price; \r\n\r\nif (isNaN(total_a2O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a2O1_price;\r\n  }",
            "key": "a2O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "A2_O1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi A2, Opsi 2: Untuk retak dengan lebar 5mm atau lebih, isi dengan mortar lalu pasang kawat anyam kemudian diplester.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "key": "A2_O2",
            "conditional": {
              "show": true,
              "when": "QA2",
              "eq": "true"
            },
            "type": "checkbox",
            "input": true
          }, {
            "label": "A2 O2 Panjang retak pada dinding, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "key": "a2O2_input",
            "conditional": {
              "show": true,
              "when": "A2_O2",
              "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
          }, {
            "label": "A2_O2 Unit Quantities",
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
            "template": "<span>{{ item.retrofitAction }}<\/span>",
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "a2O2UnitQuantities",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
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
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_a2O2_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a2O2_input);\r\ntotal_a2O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a2O2_input;\r\ntotal_a2O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a2O2_input;\r\ntotal_a2O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a2O2_input;\r\ntotal_a2O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a2O2_input;\r\ntotal_a2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a2O2_input;\r\ntotal_a2O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a2O2_input;\r\ntotal_a2O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a2O2_input;\r\ntotal_a2O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a2O2_input;\r\ntotal_a2O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a2O2_input;\r\ntotal_a2O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a2O2_input;\r\ntotal_a2O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a2O2_input;\r\ntotal_a2O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a2O2_input;\r\ntotal_a2O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a2O2_input;\r\ntotal_a2O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a2O2_input;\r\ntotal_a2O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a2O2_input;\r\ntotal_a2O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a2O2_input;\r\ntotal_a2O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a2O2_input;\r\ntotal_a2O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a2O2_input;\r\ntotal_a2O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.a2O2_input;\r\ntotal_a2O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a2O2_input;\r\ntotal_a2O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a2O2_input;\r\ntotal_a2O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a2O2_input;\r\ntotal_a2O2_price = total_a2O2_bataMerahPcs_price + total_a2O2_batuKaliM3_price + total_a2O2_bautJLPcs_price + total_a2O2_besiPolos8MmX12MPcs_price + total_a2O2_besiUlir10MmX12MPcs_price + total_a2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a2O2_kawatBetonKg_price + total_a2O2_kayuKelasIi57CmX4MPcs_price + total_a2O2_kayuKelasIi612CmX4MPcs_price + total_a2O2_kepalaTukangOh_price + total_a2O2_kerikilM3_price + total_a2O2_lemKayuKg_price + total_a2O2_mandorOh_price + total_a2O2_minyakBekistingLtr_price + total_a2O2_paku57CmKg_price + total_a2O2_pakuPayungKg_price + total_a2O2_papan325CmPcs_price + total_a2O2_pasirM3_price + total_a2O2_pekerjaOh_price + total_a2O2_semenSak_price + total_a2O2_sengBjlsPcs_price + total_a2O2_tripleks9MmPcs_price + total_a2O2_tukangOh_price; \r\n\r\nif (isNaN(total_a2O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a2O2_price;\r\n  }",
            "key": "a2O2TotalPrice",
            "conditional": {
              "show": true,
              "when": "A2_O2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QA3: Pasangan bata dan plester keropos saat digaruk menggunakan pena",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
          "key": "QA3",
          "type": "checkbox",
          "input": true
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
            "input": false
          }, {
            "label": "A3 Panjang dinding yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "key": "a3_input",
            "conditional": {
              "show": true,
              "when": "QA3",
              "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
          }, {
            "label": "A3 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": {
              "date": "07\/17\/2020",
              "retrofitAction": "A3",
              "bataMerahPcs": 210,
              "batuKaliM3": 0,
              "bautJLPcs": 0,
              "besiPolos8MmX12M": 0,
              "besiUlir10MmX12M": 0,
              "kawatAnyam1MmX1InSpaciX12MX30MBal": 0,
              "kawatBetonKg": 0,
              "kayuKelasIi57CmX4MPcs": 16.071,
              "kayuKelasIi612CmX4MPcs": 0,
              "kepalaTukangOh": 0.13,
              "kerikilM3": 0,
              "lemKayuKg": 0,
              "mandorOh": 0.32,
              "minyakBekistingLtr": 0,
              "multipleks9MmPcs": 0,
              "paku57CmKg": 3.6,
              "pakuPayungKg": 0,
              "papan325CmPcs": 0,
              "pasirM3": 0.6,
              "pekerjaOh": 3.05,
              "semenSak": 5.389,
              "sengBjlsPcs": 0,
              "tripleks9MmPcs": 0,
              "tukangOh": 1.29,
              "draftButton": false,
              "stage_dhrp": "ARC - Trials",
              "state": "submitted",
              "created_at": "2020-07-15 07:01:32",
              "updated_at": "2020-08-11 08:17:10",
              "user_id": 9,
              "status": "New",
              "besiPolos8MmX12MPcs": 0,
              "besiUlir10MmX12MPcs": 0,
              "id": "5f0ea9cc9106b222814e7762"
            },
            "data": {
              "values": [{
                "label": "",
                "value": ""
              }],
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "template": "<span>{{ item.retrofitAction }}<\/span>",
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "a3UnitQuantities",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
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
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\n\r\ntotal_a3_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a3_input);\r\ntotal_a3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a3_input;\r\ntotal_a3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a3_input;\r\ntotal_a3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a3_input;\r\ntotal_a3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a3_input;\r\ntotal_a3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a3_input;\r\ntotal_a3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a3_input;\r\ntotal_a3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a3_input;\r\ntotal_a3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a3_input;\r\ntotal_a3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a3_input;\r\ntotal_a3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a3_input;\r\ntotal_a3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a3_input;\r\ntotal_a3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a3_input;\r\ntotal_a3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a3_input;\r\ntotal_a3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a3_input;\r\ntotal_a3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a3_input;\r\ntotal_a3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a3_input;\r\ntotal_a3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a3_input;\r\ntotal_a3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a3_input;\r\ntotal_a3_semenSak_price = v1.semenSak_price * v2.semenSak * data.a3_input;\r\ntotal_a3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a3_input;\r\ntotal_a3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a3_input;\r\ntotal_a3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a3_input;\r\ntotal_a3_price = total_a3_bataMerahPcs_price + total_a3_batuKaliM3_price + total_a3_bautJLPcs_price + total_a3_besiPolos8MmX12MPcs_price + total_a3_besiUlir10MmX12MPcs_price + total_a3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a3_kawatBetonKg_price + total_a3_kayuKelasIi57CmX4MPcs_price + total_a3_kayuKelasIi612CmX4MPcs_price + total_a3_kepalaTukangOh_price + total_a3_kerikilM3_price + total_a3_lemKayuKg_price + total_a3_mandorOh_price + total_a3_minyakBekistingLtr_price + total_a3_paku57CmKg_price + total_a3_pakuPayungKg_price + total_a3_papan325CmPcs_price + total_a3_pasirM3_price + total_a3_pekerjaOh_price + total_a3_semenSak_price + total_a3_sengBjlsPcs_price + total_a3_tripleks9MmPcs_price + total_a3_tukangOh_price;\r\n\r\nif (isNaN(total_a3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a3_price;\r\n  }",
            "key": "a3TotalPrice",
            "conditional": {
              "show": true,
              "when": "QA3",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QA4: Beton keropos saat digaruk menggunakan pena",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
          "key": "QA4",
          "type": "checkbox",
          "input": true
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
            "input": false
          }, {
            "label": "A4 Panjang beton yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "key": "a4_input",
            "conditional": {
              "show": true,
              "when": "QA4",
              "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
          }, {
            "label": "A4 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": {
              "date": "07\/17\/2020",
              "retrofitAction": "A4",
              "bataMerahPcs": 0,
              "batuKaliM3": 0,
              "bautJLPcs": 0,
              "besiPolos8MmX12M": 0,
              "besiUlir10MmX12M": 0,
              "kawatAnyam1MmX1InSpaciX12MX30MBal": 0,
              "kawatBetonKg": 0,
              "kayuKelasIi57CmX4MPcs": 3.518,
              "kayuKelasIi612CmX4MPcs": 0,
              "kepalaTukangOh": 0.08,
              "kerikilM3": 0.043,
              "lemKayuKg": 0,
              "mandorOh": 0.09,
              "minyakBekistingLtr": 0.35,
              "multipleks9MmPcs": 0,
              "paku57CmKg": 0.926,
              "pakuPayungKg": 0,
              "papan325CmPcs": 0,
              "pasirM3": 0.039,
              "pekerjaOh": 1.72,
              "semenSak": 0.66,
              "sengBjlsPcs": 0,
              "tripleks9MmPcs": 0.224,
              "tukangOh": 0.84,
              "draftButton": false,
              "stage_dhrp": "ARC - Trials",
              "state": "submitted",
              "created_at": "2020-07-15 07:03:29",
              "updated_at": "2020-07-17 17:07:16",
              "user_id": 9,
              "status": "New",
              "besiPolos8MmX12MPcs": 0,
              "besiUlir10MmX12MPcs": 0,
              "id": "5f0eaa419106b222d53cbfe2"
            },
            "data": {
              "values": [{
                "label": "",
                "value": ""
              }],
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "template": "<span>{{ item.retrofitAction }}<\/span>",
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "a4UnitQuantities",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
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
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_a4_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a4_input);\r\ntotal_a4_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a4_input;\r\ntotal_a4_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a4_input;\r\ntotal_a4_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a4_input;\r\ntotal_a4_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a4_input;\r\ntotal_a4_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a4_input;\r\ntotal_a4_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a4_input;\r\ntotal_a4_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a4_input;\r\ntotal_a4_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a4_input;\r\ntotal_a4_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a4_input;\r\ntotal_a4_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a4_input;\r\ntotal_a4_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a4_input;\r\ntotal_a4_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a4_input;\r\ntotal_a4_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a4_input;\r\ntotal_a4_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a4_input;\r\ntotal_a4_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a4_input;\r\ntotal_a4_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a4_input;\r\ntotal_a4_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a4_input;\r\ntotal_a4_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a4_input;\r\ntotal_a4_semenSak_price = v1.semenSak_price * v2.semenSak * data.a4_input;\r\ntotal_a4_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a4_input;\r\ntotal_a4_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a4_input;\r\ntotal_a4_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a4_input;\r\ntotal_a4_price = total_a4_bataMerahPcs_price + total_a4_batuKaliM3_price + total_a4_bautJLPcs_price + total_a4_besiPolos8MmX12MPcs_price + total_a4_besiUlir10MmX12MPcs_price + total_a4_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a4_kawatBetonKg_price + total_a4_kayuKelasIi57CmX4MPcs_price + total_a4_kayuKelasIi612CmX4MPcs_price + total_a4_kepalaTukangOh_price + total_a4_kerikilM3_price + total_a4_lemKayuKg_price + total_a4_mandorOh_price + total_a4_minyakBekistingLtr_price + total_a4_paku57CmKg_price + total_a4_pakuPayungKg_price + total_a4_papan325CmPcs_price + total_a4_pasirM3_price + total_a4_pekerjaOh_price + total_a4_semenSak_price + total_a4_sengBjlsPcs_price + total_a4_tripleks9MmPcs_price + total_a4_tukangOh_price;\r\n\r\nif (isNaN(total_a4_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a4_price;\r\n  }",
            "key": "a4TotalPrice",
            "conditional": {
              "show": true,
              "when": "QA4",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QA5: Tulangan besi yang ada di beton terlihat dari luar",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
          "key": "QA5",
          "type": "checkbox",
          "input": true
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
            "input": false
          }, {
            "label": "A5 Panjang beton yang retak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "key": "a5_input",
            "conditional": {
              "show": true,
              "when": "QA5",
              "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
          }, {
            "label": "A5 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": {
              "date": "07\/17\/2020",
              "retrofitAction": "A5",
              "bataMerahPcs": 0,
              "batuKaliM3": 0,
              "bautJLPcs": 0,
              "besiPolos8MmX12M": 0,
              "besiUlir10MmX12M": 0,
              "kawatAnyam1MmX1InSpaciX12MX30MBal": 0,
              "kawatBetonKg": 0,
              "kayuKelasIi57CmX4MPcs": 3.518,
              "kayuKelasIi612CmX4MPcs": 0,
              "kepalaTukangOh": 0.08,
              "kerikilM3": 0.043,
              "lemKayuKg": 0,
              "mandorOh": 0.09,
              "minyakBekistingLtr": 0.35,
              "multipleks9MmPcs": 0,
              "paku57CmKg": 0.926,
              "pakuPayungKg": 0,
              "papan325CmPcs": 0,
              "pasirM3": 0.039,
              "pekerjaOh": 1.72,
              "semenSak": 0.66,
              "sengBjlsPcs": 0,
              "tripleks9MmPcs": 0.224,
              "tukangOh": 0.84,
              "draftButton": false,
              "stage_dhrp": "ARC - Trials",
              "state": "submitted",
              "created_at": "2020-07-15 07:05:46",
              "updated_at": "2020-07-17 17:07:43",
              "user_id": 9,
              "status": "New",
              "besiPolos8MmX12MPcs": 0,
              "besiUlir10MmX12MPcs": 0,
              "id": "5f0eaaca9106b223a60ad522"
            },
            "data": {
              "values": [{
                "label": "",
                "value": ""
              }],
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "template": "<span>{{ item.retrofitAction }}<\/span>",
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "a5UnitQuantities",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
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
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_a5_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a5_input);\r\ntotal_a5_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a5_input;\r\ntotal_a5_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a5_input;\r\ntotal_a5_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a5_input;\r\ntotal_a5_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a5_input;\r\ntotal_a5_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a5_input;\r\ntotal_a5_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a5_input;\r\ntotal_a5_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a5_input;\r\ntotal_a5_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a5_input;\r\ntotal_a5_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a5_input;\r\ntotal_a5_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a5_input;\r\ntotal_a5_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a5_input;\r\ntotal_a5_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a5_input;\r\ntotal_a5_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a5_input;\r\ntotal_a5_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a5_input;\r\ntotal_a5_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a5_input;\r\ntotal_a5_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a5_input;\r\ntotal_a5_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a5_input;\r\ntotal_a5_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a5_input;\r\ntotal_a5_semenSak_price = v1.semenSak_price * v2.semenSak * data.a5_input;\r\ntotal_a5_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a5_input;\r\ntotal_a5_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a5_input;\r\ntotal_a5_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a5_input;\r\ntotal_a5_price = total_a5_bataMerahPcs_price + total_a5_batuKaliM3_price + total_a5_bautJLPcs_price + total_a5_besiPolos8MmX12MPcs_price + total_a5_besiUlir10MmX12MPcs_price + total_a5_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a5_kawatBetonKg_price + total_a5_kayuKelasIi57CmX4MPcs_price + total_a5_kayuKelasIi612CmX4MPcs_price + total_a5_kepalaTukangOh_price + total_a5_kerikilM3_price + total_a5_lemKayuKg_price + total_a5_mandorOh_price + total_a5_minyakBekistingLtr_price + total_a5_paku57CmKg_price + total_a5_pakuPayungKg_price + total_a5_papan325CmPcs_price + total_a5_pasirM3_price + total_a5_pekerjaOh_price + total_a5_semenSak_price + total_a5_sengBjlsPcs_price + total_a5_tripleks9MmPcs_price + total_a5_tukangOh_price;\r\n\r\nif (isNaN(total_a5_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a5_price;\r\n  }",
            "key": "a5TotalPrice",
            "conditional": {
              "show": true,
              "when": "QA5",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QA6: Kayu rusak atau busuk",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
          "key": "QA6",
          "type": "checkbox",
          "input": true
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
            "key": "A6_K1",
            "conditional": {
              "show": true,
              "when": "QA6",
              "eq": "true"
            },
            "type": "checkbox",
            "input": true
          }, {
            "label": "A6 K1 Panjang kayu yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "key": "a6C1_input",
            "conditional": {
              "show": true,
              "when": "A6_K1",
              "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
          }, {
            "label": "A6_C1 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": {
              "date": "07\/15\/2020",
              "retrofitAction": "A6_C1",
              "bataMerahPcs": 0,
              "batuKaliM3": 0,
              "bautJLPcs": 0,
              "besiPolos8MmX12M": 0,
              "besiUlir10MmX12M": 0,
              "kawatAnyam1MmX1InSpaciX12MX30MBal": 0,
              "kawatBetonKg": 0,
              "kayuKelasIi612CmX4MPcs": 0.25,
              "kepalaTukangOh": 0.011,
              "kerikilM3": 0,
              "lemKayuKg": 0,
              "mandorOh": 0.006,
              "minyakBekistingLtr": 0,
              "multipleks9MmPcs": 0,
              "paku57CmKg": 0.244,
              "pakuPayungKg": 0,
              "papan325CmPcs": 0,
              "pasirM3": 0,
              "pekerjaOh": 0.481,
              "semenSak": 0,
              "sengBjlsPcs": 0,
              "tripleks9MmPcs": 0,
              "tukangOh": 0.233,
              "draftButton": false,
              "stage_dhrp": "ARC - Trials",
              "kayuKelasIi57CmX4MPcs": 1.071,
              "state": "submitted",
              "created_at": "2020-07-15 07:06:53",
              "updated_at": "2020-07-17 17:08:14",
              "user_id": 9,
              "status": "New",
              "besiPolos8MmX12MPcs": 0,
              "besiUlir10MmX12MPcs": 0,
              "id": "5f0eab0d9106b223d64dca62"
            },
            "data": {
              "values": [{
                "label": "",
                "value": ""
              }],
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "template": "<span>{{ item.retrofitAction }}<\/span>",
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "a6C1UnitQuantities",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
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
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_a6C1_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a6C1_input);\r\ntotal_a6C1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a6C1_input;\r\ntotal_a6C1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a6C1_input;\r\ntotal_a6C1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a6C1_input;\r\ntotal_a6C1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a6C1_input;\r\ntotal_a6C1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a6C1_input;\r\ntotal_a6C1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a6C1_input;\r\ntotal_a6C1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a6C1_input;\r\ntotal_a6C1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a6C1_input;\r\ntotal_a6C1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a6C1_input;\r\ntotal_a6C1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a6C1_input;\r\ntotal_a6C1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a6C1_input;\r\ntotal_a6C1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a6C1_input;\r\ntotal_a6C1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a6C1_input;\r\ntotal_a6C1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a6C1_input;\r\ntotal_a6C1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a6C1_input;\r\ntotal_a6C1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a6C1_input;\r\ntotal_a6C1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a6C1_input;\r\ntotal_a6C1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a6C1_input;\r\ntotal_a6C1_semenSak_price = v1.semenSak_price * v2.semenSak * data.a6C1_input;\r\ntotal_a6C1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a6C1_input;\r\ntotal_a6C1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a6C1_input;\r\ntotal_a6C1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a6C1_input;\r\ntotal_a6C1_price = total_a6C1_bataMerahPcs_price + total_a6C1_batuKaliM3_price + total_a6C1_bautJLPcs_price + total_a6C1_besiPolos8MmX12MPcs_price + total_a6C1_besiUlir10MmX12MPcs_price + total_a6C1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a6C1_kawatBetonKg_price + total_a6C1_kayuKelasIi57CmX4MPcs_price + total_a6C1_kayuKelasIi612CmX4MPcs_price + total_a6C1_kepalaTukangOh_price + total_a6C1_kerikilM3_price + total_a6C1_lemKayuKg_price + total_a6C1_mandorOh_price + total_a6C1_minyakBekistingLtr_price + total_a6C1_paku57CmKg_price + total_a6C1_pakuPayungKg_price + total_a6C1_papan325CmPcs_price + total_a6C1_pasirM3_price + total_a6C1_pekerjaOh_price + total_a6C1_semenSak_price + total_a6C1_sengBjlsPcs_price + total_a6C1_tripleks9MmPcs_price + total_a6C1_tukangOh_price;\r\n\r\nif (isNaN(total_a6C1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a6C1_price;\r\n  }",
            "key": "a6C1TotalPrice",
            "conditional": {
              "show": true,
              "when": "A6_K1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi A6, kasus 2: Bongkar dan ganti kayu yang lapuk, bengkok, dimakan rayap dan rusak yang parah (tidak perlu perancah)",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "key": "A6_K2",
            "conditional": {
              "show": true,
              "when": "QA6",
              "eq": "true"
            },
            "type": "checkbox",
            "input": true
          }, {
            "label": "A6 K2 Panjang kayu yang rusak, m:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "key": "a6C2_input",
            "conditional": {
              "show": true,
              "when": "A6_K2",
              "eq": "true"
            },
            "type": "number",
            "input": true,
            "defaultValue": 0
          }, {
            "label": "A6_C2 Unit Quantities",
            "widget": "choicesjs",
            "hidden": true,
            "tableView": true,
            "dataSrc": "resource",
            "defaultValue": {
              "date": "07\/15\/2020",
              "retrofitAction": "A6_C2",
              "bataMerahPcs": 0,
              "batuKaliM3": 0,
              "bautJLPcs": 0,
              "besiPolos8MmX12M": 0,
              "besiUlir10MmX12M": 0,
              "kawatAnyam1MmX1InSpaciX12MX30MBal": 0,
              "kawatBetonKg": 0,
              "kayuKelasIi57CmX4MPcs": 0,
              "kayuKelasIi612CmX4MPcs": 0.25,
              "kepalaTukangOh": 0.009,
              "kerikilM3": 0,
              "lemKayuKg": 0,
              "mandorOh": 0.009,
              "minyakBekistingLtr": 0,
              "multipleks9MmPcs": 0,
              "paku57CmKg": 0.004,
              "pakuPayungKg": 0,
              "papan325CmPcs": 0,
              "pasirM3": 0,
              "pekerjaOh": 0.1,
              "semenSak": 0,
              "sengBjlsPcs": 0,
              "tripleks9MmPcs": 0,
              "tukangOh": 0.05,
              "draftButton": false,
              "stage_dhrp": "ARC - Trials",
              "state": "submitted",
              "created_at": "2020-07-15 07:12:12",
              "updated_at": "2020-07-17 17:08:25",
              "user_id": 9,
              "status": "New",
              "besiPolos8MmX12MPcs": 0,
              "besiUlir10MmX12MPcs": 0,
              "id": "5f0eac4c9106b225213b8bc2"
            },
            "data": {
              "values": [{
                "label": "",
                "value": ""
              }],
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "template": "<span>{{ item.retrofitAction }}<\/span>",
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "a6C2UnitQuantities",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
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
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_a6C2_bataMerahPcs_price = Number(v1.bataMerahPcs_price) * Number(v2.bataMerahPcs) * Number(data.a6C2_input);\r\ntotal_a6C2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.a6C2_input;\r\ntotal_a6C2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.a6C2_input;\r\ntotal_a6C2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.a6C2_input;\r\ntotal_a6C2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.a6C2_input;\r\ntotal_a6C2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.a6C2_input;\r\ntotal_a6C2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.a6C2_input;\r\ntotal_a6C2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.a6C2_input;\r\ntotal_a6C2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.a6C2_input;\r\ntotal_a6C2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.a6C2_input;\r\ntotal_a6C2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.a6C2_input;\r\ntotal_a6C2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.a6C2_input;\r\ntotal_a6C2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.a6C2_input;\r\ntotal_a6C2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.a6C2_input;\r\ntotal_a6C2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.a6C2_input;\r\ntotal_a6C2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.a6C2_input;\r\ntotal_a6C2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.a6C2_input;\r\ntotal_a6C2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.a6C2_input;\r\ntotal_a6C2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.a6C2_input;\r\ntotal_a6C2_semenSak_price = v1.semenSak_price * v2.semenSak * data.a6C2_input;\r\ntotal_a6C2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.a6C2_input;\r\ntotal_a6C2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.a6C2_input;\r\ntotal_a6C2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.a6C2_input;\r\ntotal_a6C2_price = total_a6C2_bataMerahPcs_price + total_a6C2_batuKaliM3_price + total_a6C2_bautJLPcs_price + total_a6C2_besiPolos8MmX12MPcs_price + total_a6C2_besiUlir10MmX12MPcs_price + total_a6C2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_a6C2_kawatBetonKg_price + total_a6C2_kayuKelasIi57CmX4MPcs_price + total_a6C2_kayuKelasIi612CmX4MPcs_price + total_a6C2_kepalaTukangOh_price + total_a6C2_kerikilM3_price + total_a6C2_lemKayuKg_price + total_a6C2_mandorOh_price + total_a6C2_minyakBekistingLtr_price + total_a6C2_paku57CmKg_price + total_a6C2_pakuPayungKg_price + total_a6C2_papan325CmPcs_price + total_a6C2_pasirM3_price + total_a6C2_pekerjaOh_price + total_a6C2_semenSak_price + total_a6C2_sengBjlsPcs_price + total_a6C2_tripleks9MmPcs_price + total_a6C2_tukangOh_price;\r\n\r\nif (isNaN(total_a6C2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_a6C2_price;\r\n  }",
            "key": "a6C2TotalPrice",
            "conditional": {
              "show": true,
              "when": "A6_K2",
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
        "title": "QB: Tiang Beton",
        "label": "QB: Tiang Beton",
        "type": "panel",
        "key": "QB",
        "components": [{
          "label": "QB1: Tidak ada tiang beton di sudut dinding",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
          "key": "QB1",
          "type": "checkbox",
          "input": true
        }, {
          "html": "<figure class=\"image\"><img src=\"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYMAAAE\/CAIAAAArDjhLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAGhISURBVHhe7Z0HYBTV2oZnZndTSSih945UkQ4WQJogNhCpgooK9i6giA0VlYu9IBb4r6hYsQtewEpRBOklAUInlCSkJ7s78z8zZ1nWUASFhCTfe7njmdPmzGa+Z99vtumWZWmiIi7+iMgwjMD+0aT+0Lquq92gjlV\/VJma6Td1N90N7dHHHn5h8qS4Uh5qdVP3atQxnean0aKHpeumZc+qGyYbzW8P19xUWy6f7rf4j6W5dc1ncBH6wy2dVp89A92ZybQo2aOZQ3dRsEfbC\/VbBoNNQwv3M6uZZ2gujSUxyu\/XLbfm2nsw++t5C87tdK7d\/7gyTZMTP8Fzdx7jozzIVJ7gDKLjSEhUTHSseAjW\/22HE5FlmfzfJo3mfmDcw5XSFtwxqEFGZjZUcXv3GpYf4PgMt2HCD483rCyXl6b5Dctt6oZhZhv+VL\/uMphA88IZnyvG8oRbJljxu\/02o0wtMywvnTHQCUgwj98V4XXHGhb\/89kg1DzhvlTLygZCHr\/b5\/KamkvX3L6wWEiHykRG3vj04kvveq1v9wucClun5NxPCluik5WQqPjo2muvXblyZWBH08LCwmbOnFm3bt3AvqatX79+6NChoeFXv379WbNmqbJSampqt27dKNBHXRvM8NFHHzmNAaVnpl7Ytee2bdvLWNm1ykUdNP214iL\/O6Z+uCdH8+VxZC1SX7tZu3VKfJ5lYWd8up5jab2bx068sabfzNH9XriiRZWaOTd1yuxtpR3G4KtyNH3oBZXvGlJey8hy7JFHiw7\/7H\/pEz\/ZFslRdc2wrAz6dKh8z7XlWYRmeXxh2e6I2HnzMsd9tCXSOTG3YazYk3btqDsnT3pCrVbpgw8+ePbZZwM7jp5++unu3bsHdhzdfvvtv\/76a\/DE0ZQpUzp37kxB1dB07733LliwwGkMPESTJk3q0aOHqhH9YwmJio9atmy5YsWKwI6jVatWNWvWLLCjaUuXLm3btm1gx1G9evUSEhICO5r26aeffvzxx++\/\/35g35HH47nhhhtUWedi0bX9B5NnzfxA1ShVKROZ8OZ5UeHZps+P2TGijF9Xe867d36g2dElrap+MbF5npmu+e1sLSwmetL0PeP+b3Wg2dH1FzWZNqZB3sEDuu6zfVbpyOdm7rv7zb+c1IiujaZPaGimJvvwZro\/PCbi9Y+Tb3r1z0Czo3p16\/bq1QtUBPY1bfHixcuWLQvsODr\/\/PObN29OgRCA2mPHjr3uuuu+\/fZb1ar0ySef9OvXL7DjqE+fPvn6gPshQ4YEdkT\/VMe7syAqWvL57Nssofrbpxmv1xsoOfr666\/T09MDOyGqUKFCpUqV2JarFFejWtWKpSsEGoKCP0Q97sawMyaIZSdSf5XhpZPmMl0uM5x8zb63ZOZfnuFAygaefdfI1Ayf5dw7CpXPHuXcQdL8Lj8Fn0\/\/y1kgd7SnVt26FSpUZM2odu3aERERgbZDio6Opp7WmjVrbt68GSK7XM79qBCRkQVKhx7MIx\/k0D6ifyzxRMVE\/B0ffvjhjRs3BvYdL\/PUU09Vr149sK9piYmJPPMHdhwRhCQpwWTt7rvvvuCCC0hkcnJygklKlSpVnnvuOcMwnJCzwiPCtiZuHzvmweV\/\/BZnZDWqXibd760V6544skKEy+czw1yWVw9zbdzpnvTfrZm6W9dI0MxsXT+vfuQd\/cq4fDmW6fEblivK9c0vuW8tSIsEYBaMIjuzrjin9JCL43w5B+07UXiiKH3uktzX\/3cwyrJvfrssI1uzepxdduQlpfWsdGrgnSvC\/dMf2kvf7YvQTVPXogzXgg17+g2\/efJTT+Tk5DILpwCGOCnknGVAN954IwaHM6UVG1ixYsXVq1cvWrQo0Ozovvvua926tSrzaPCYkK\/99ttvqkbpzjvv7NChQ2BH9E8lJCoOUn\/EIFBCpeInsHMMBfvcfPPNV111VZcuXbKzs1UTAkBpaWlOkW5mHqmMrlWuXPG+u+9vpP16\/aBaWkYmSPBn7rdBpesuC2K5dJfHHRVpv6iFf7HvAmFuvHnZ6QZH0zy65tP9mh4ZbUREaSYlzIhLs3yaNysvJ1tz+Vx++4U1A6hFhOsRpTU8FjOYYbZX8mXkZuW4dbyJQYJm+C2PJ0yLKIvpsvuUKnX7xOXnDX22T+8L0lmYWrdlRUZG5rNFWVlZubm5nHhMTAwkqly58iWXXBJoO5qO8yCL\/r0kOysOIjyOFSEnEjnBPhT8fn9KSkpqiA5hCPG8Zbg1v2WZOXmYiTxfTpqWvttM3wuG7Bfu+ee4G8JW8+ea6clm2l5\/WpKZvs9M2+fPPuhcbWycl7lcUC3Tn7bHn7HXn852l5mR5M\/NBHb2K2V2guYzDfrk2q0cghnoQzk7g6E0AwYDhhqa359tZtLEUfZqabt93pxcbx5ezD6KI86L5QbO55Dy8vKCJ34ivKbD3\/YR\/WMJiUQnJWJRRbiKSbYuEyAEdtV\/VLziXmjC2him\/XK8XbCr7RtK9gw2suyt7X3srf02IsqMpZ0JAhPaxLHfeKT+2W81OjSP3cGZCq9i19vD7VfqbEI5\/wIziIqEhESiYiYBUJGUkEgkEhW+hEQikajwJSQSFTPZt59ERU5CIlExk9wnKpISEolEosKXkEhUzCTZWZGUkEhUzCTZWZGUkEgkEhW+hEQikajwJSQSFTPJfaIiKSGRqJhJ7hMVSQmJRCJR4UtIJCpmkuysSEpIJCpmkuysSEpIJBKJCl9CIpFIVPgSEomKmeQ+UZGUkEhUzCT3iYqkhEQikajwJSQSFTNJdlYkJSQSFTNJdlYkJSQSiUSFLyGRSCQqfAmJRMVMcp+oSEpIJCpmkvtERVJCIpFIVPgSEomKmSQ7K5ISEomKmSQ7K5ISEolEosKXkEgkEhW+hESiYia5T1QkJSQSFTPJfaIiKSGRSCQqfAmJRMVMkp0VSQmJRMVMkp0VSQmJRCJR4UtIJBKJCl9CIlExk9wnKpISEomKmeQ+UZGUkEgkEhW+hESiYibJzoqkhESiYibJzoqkhEQikajwJSQSFTNJdlYkJSQSiUSFLyGRqJhJ7hMVSQmJRCJR4UtIJCpmkvtERVJCIlExk2RnRVJCIpFIVPgSEomKmSQ7K5ISEomKmSQ7K5ISEolEosKXkEgkEhW+hESiYia5T1QkJSQSFTPJfaIiKSGRSCQqfAmJRMVMkp0VSQmJRMVMkp0VSQmJRCJR4UtIJBKJCl9CIlExk9wnKpISEomKmeQ+UZGUkEgkEhW+hESiYibJzoqkhESiYibJzoqkhEQi0SnTpk2bfv3118DOv9ZPP\/2UmJgY2Dltys3N9Xq9gZ1\/Lcv6h55USCQS\/VsRfioCx40b161bt+zsbMo5OTnvvvvu4sWLnS4nrfT09M6dOz\/yyCNqFyS98cYbKSkpavdUCQa1bt16xIgRlINnceIKHWI6UuV\/ICGRqJipMO8T5eXl+f1+FZyYo6uvvnr06NGq6cSlhis3xGxOnTZx4sRRo0a98847avdUaY2j5OTkwP5JStftXHjVqlXr1683HKn6fyAhkaiYqXDuExGTWCECMioqStXUrVu3S5cuF154odo9Wa1du5ZtMLY7duyIRWrevLnaPVXKzMxkW6NGDbX7D8SJX3rppb1798YDql1Vf7ISEolE\/1zKv6jwI3WKj48PDw93WrQ6deosWLBgypQpdgJzKIUJLedTsEnNlpaWxjYuLs5u07SRI0f+8MMPPXr0CHY7jlQfFNh3FKg62thy5cqx5bjq0Ci0myrnqwndBb44uM2bNwf2j3as0PJRJSQSFTP9zRV\/ahUMXVSqVCnTNBs0aBARERGoChGcSkhIUNG+fft2MppAwyGppsCOpkVGRrLt1asX23xhTDemOnDggNpdvXr1pk2bVFlJTYUC+47Ubr5Kn8\/HtkyZMmy9Xi8kdar\/0u3IgcHyxo0bSUjV+e7bt49ET5ksteAjhxyHR0IiUTHT4au\/APTSSy\/17Nmzffv2pCczZsygpnXr1iqlIr0aOHAgsU0QogEDBrRo0WL37t0MadasGeUrr7wy9EUrPMX1119PCkYidsstt5DoUVm6dGnV+sILL9x6662EPVPBHYbfeOONycnJ\/fr1I2VjwpkzZ6qeSjBiwoQJlzh6\/PHHg3eCjoQa26ysrGeeeYaVN2rUqFu3bp988olqDeq3337jXDp06NCpUyfWlpSUxMAXX3yR\/q1atWI97A4aNIhlXHDBBczGI0DNypUrhw4dyukwitXu2LFDHe6oEhKJRP9Q11xzze233\/79998TqN999x1lKoPZ2Z49ez788MMff\/xR7WIWsrOzSbLoRpmMhoD\/6quvVCvAImLfeuutn376afHixa+++uoTTzxBvbpjTQB\/\/vnnr7zyinrt7ODBg0zFQcHfZ599hhfLycm5+eabg6+sATuwAoCYH4GkNm3a0P9YIPjPf\/4zZswYbBruZv78+SDyzTffDLRp2rRp01gb5wIc161bx9r69u3LKaSnp2PcqGE9AG7\/\/v2clMvlUkeBjG3btn3vvfcgMgOZ5KKLLlIp51ElJBKJTk7KVsyZMwcTRHSRHOERli9fjkEItiKVPYWFhaldfAHbb7\/9lm5EpvIdc+fOdRq1Rx99dO\/evVOmTGEqFAoCRNIHZYhwFeSgB2RgMYDL6NGjsSQ4DoJ869attAIyYJeRkYF5mTRp0tNPP92lS5ctW7bAMlrVDPkEyMaOHYtfS0xMXLhwYaVKlcaPHw9faCLhYnKIA0q2bdtGVlixYkUYxHk9+OCD9GfUWWedRU8eEI7y888\/05kCmKYSJjIKu1e7dm1GBTF9pIREomKmY96JOFUimMENjiM2NpZn\/qZNmxKcLVu2\/O9\/\/0uruvOC8r3FkXSJbXR0NESoX79+5cqV2V26dClbwhvvMGrUqLvuuoupENaJsj3MEQaEeHa73WqXHA1RADGvvfYa\/dUtZyjAduLEiWxB28svv4zTuf\/++7t3706N4kW+7EwlknfeeedTTz3FkpgK+8MoaIgJool6to888giZI+cL7Pbt21etWjWPx0O9s9iK1FOGX5QVa5599lkeh3HjxpFRkmAC2e3bt1epUkVIJCo5OuadiFMrkg7ooxCgwrtOnTrBMiJbYRv0IKCEbf\/+\/ZV1ys3NZavggrthlDJNFNQMdevWZauEJ1Jpmmryer3UMPMDDzzgtB\/GH5o3b16LFi3IyCir\/vgjtl27dmWbzxOp9eeD1GWXXcaWtIvtggULQAwYclpsoxfsFiyoSRQclchYy5YtS8KodpOTk4NvjDqWhEQi0UmL2D7y\/cQKLvkCVXkHpBBwww03qF3FDlWpYl6BLKisrKxAyRH9cSLKfSjVq1dPmR2kFhMVFUUeRKqFTWOXBaj5lVc66kc64uLiyLPUW4GQWrN62Y7ZgAsOqFmzZurFNcQaoGfo4lH58uVDd1NTUxnVsGFDLJKqwW0xWyguj5SQSFTMFADBaRVZBgGZ7y3F+VIPFZnB+MQU0J8MJbirCgjTwTZ4v1mJ0A2UDk2S73AdOnQITh7EorI\/wXqUnp6+atUq4HLUzIjUqVSpUvlm3rNnD1uoRL3L5VKVSk2aNAErofYH5WOoGhUkMqpdu3bNmjWDvDuqhESiYqbDQXj6hI\/AJvz555\/qMxkq8tVb+\/JFdTBos7OzsQnBoMXRQAFlE9RbnNVtJqZSs6nbz0EBPgChQKPUpk0btirglfvARjVu3BgKqLcFMQ+EGjx4cFpaGvma4l0oIBAnwoLVzengoadMmcL24osv5qAskrwy1AAGuyE1G4mY2lXCuDFq9+7docAKHXVUCYlEJyFLs\/y6upbty8qyw57nTLaF\/I+V8B\/L2bN002DfOl3Xtgq\/m2++mTSkX79+v\/zyS3Jy8vTp0\/v27Ut98MUypdCUhFAMhjRpDgACLuCjefPmZ5999scff3zPPffs2LGDyL\/uuusmT56shrDliHgoPEWok1LZlurQo0cPtgCFZJDy77\/\/PmjQoOeff\/6KK674+uuvYU3VqlXzuRsl1oP5Aj2TJk1KSEhYvHjxLbfc8u677\/bs2VPdt2rVqhVce+uttzhH9OKLL27fvn3NmjWARs2A1Emph0VtW7duTbdXX31VjZo2bdr69eshdVJSkj3gaBISiU5Chgp2+2KzN6ZOYNhh70S+\/S9YVoXQelUINgULwaZgIdgULOTbDe0W2NrL8BuaqZIzcKTph5\/GT7mIt9GjR\/fu3Xv58uXnn39++fLlr732WkKOaIcCKjLV3ZPgHRYMwrp164hPtYvACrsrV66MiIiYOnVqXFwcRABPtWrVeuedd9RAYMcWlIAYHIq666R4pG6BKyn8zZ8\/n+2MGTOaNm06a9asu+6664svvoBouKGgPclnTIAXh2Dl48aNa9CgQceOHcEHw1966SXV4aGHHiKtu\/HGGzkddMcdd5DoYbLgJq1qNnVSoZR88MEHY2JiWIAapd4HAHPVOwmOKiGR6CSkW7rb5LnVxHew57K5pOGS+Gc6\/4JlVQitV4VgU7AQbAoWgk3BQr7d0G5qa1mGT\/cAJehoWC6\/7jL\/EnGnTOo5H2ElsBtYoa5duwKjYcOGkaxhGS677DLik27E9ldffYVRUkPwGvgU9eK9Urdu3dq3b0\/804HCkiVL8EQXXHBB586dH3\/88RUrVtxwww1kW7QS1d9\/\/\/1PP\/1Urlw5duvXrz9gwIDQ7IyEiHSvS5culMnU5s2b98orr7CSL7\/8kjlBwFFvVzMW3j388MPvvffe2LFjOS4zQENWQiKpZoZNP\/74I9aPc0S4m0WLFmGUgFdwElK\/Sy+9lMRTDWHbsmVLVssi1Si4BqDbtWsXHHWk7IcsUBSVeBEtXHNcZ8e6uWiS+JgeXfPHVij7wB3jmllzr+9fwZ9J59MT9ycs3fLYL2vrWa7osFv\/s7Pt0Of7XdorI+MgcRHocWwR54Qi+YtKr\/5WhAzKdz8oVCqmgu7jyF2FKkwEgMAs5OtwfKnhwbIqUIO1AStHToVhgVyc2pGf4TiOQmdWhVCRctIBg5bvcMFR6MiBWEWEswvs\/1XiiUQnLoLA72Q9BuTJ8+XmuMK1yHIuTxmjsP\/pYdFWeJQZVlqLqJBne6QsrvzAqk+1iLHjYAjRITQOj9xVW2JSvV7utOeP22MptKcaiCgH00C1GxRpFKnZFVdcEdg\/MalpUWD\/rwrmifn6qF2lQFWIeNCOhSEknkh0WH\/ricjOXJZ9e6hU+bJPP\/7s4nmftqlT1uvLoyXQo5BEtmgSCCRNLvdPa\/bd88R\/LjzvvPQs+3Phf6uT9URnrIhlTMeyZctAzznnnAMs5s6de80112RnZ8fHxwffQHBmSkgkOqy\/I5F9d9jQfPYVYxhZGbn79+62fbrh3C4qVNmvl5lulucyve6o8PJVq0TpHr92+B7qcVRsSIQWL17csWNHCvXq1WOrvi3khRdeUJ\/OPZMlJBId1oncJ7ItuGVolt\/jcrvCTMtyadYxLXeBybAM3XKZhh8gAaVcb5ZmuuxX0E7DfaIzWWlpaXBn69ats2bNKleu3MCBA7t27dq7d+9A8xksIZHosP6WRJaGAXLrmt\/Sfabu1iyi3bQDnotI+SJ1NVEOXlbB+qBx+md9UHA3tJtTyRr8OovxsWOYEaYrl\/8G+vydihOJglIflz\/OJ07PNMkda9FJyWW\/as9\/sUI2A2xDZL+nB59k525OQZVVIbReFYJNwUKwKVgINgUL+XZDuzlb2w3ZRPRgjkzD6zUs0zjep5yKvcBrEcIQEhKJTkKwhwjPc\/ltA2JpLivH0PMsjHVh\/2NpHhO\/plk6JPKRp+nmX97rXNJErlO00h3+jEVpuaLTqr\/NzlyW5bPfyKy7\/FZURJQR4caJEP9IXUYqbbLB4BRQsD54nf2zPii4G9pNVVq65jb9pubx26+w+70HM3w+y+8KdjyeCj47CwbdUV\/tLpkSEokO6+9IZEEizYogQYuM1Bct\/G3BooVhuu52XjpTl1GQFMEIC9YHr7N\/1gcFd0O7qUqfHdNe3XJrlukLc\/fvd2mNalXy8kJHH1OFQqIgg7Zu3cpu7dq11W6JlZBIdFh\/SyLyIJc\/3DS8ZSqWve\/mu\/et\/vzyzlWzs\/7yHRGFIt0y\/IbltqzI8LDnZ8ff9Njrl19ycebBw59cP44K6471qlWr3nrrrXffffeBBx64++67A7UlVUIi0WGdwKv49puHTN2MrVD+gVvHtPb8fM2Qilp6luNLClX4MoOtqZWKvuPJDa0HPt3vsj7pGWmOZ\/obnW4ShTogpV9++eXtt99+\/\/331eP8wQcfDBw4UDWVWMkda9FJyHkPIzByefw2fHJ8Xi0zz5\/lLfR\/vuw8X6bXn+nVsnLy\/Kamc2Hbr+gH1l14Cn2mN03zm2++gXfnn3\/+O++8ozBUtmxZ9b2uJVxCItG\/1KEX1Av1n2PK1L8zS7ghlJ2djfHp1KnTxRdf\/PXXXwfrKbhcrqL1cvtpkpBIVMx0ZsEoLS3tpZdeatmy5eDBg5csWUKNYhBeSdkl5wPqp+vDukVIQiKR6HRpzJgxTZo0uf3229VPDCkFGaTUqlWr0O\/JL7ESEomKmQr\/3lBQHo9n586dFAzn15lVZT6pb54O7JRgCYlExUxnSnaG8Zk4ceKXX35ZunTp4+Rf6reJREIikei0SJmgvn37fvfdd23btg3NyEKV74cxSqyERCLR6VWHDh3mzp0LkhSb8qVpBfx2yjNWQiJRMdMZdJ9ICTekvrhe2aJ85igiIiJQKtkSEomKmc6U+0RBYYI2b9586aWX1q9ff\/LkyeoboIM66q9ulEAJiUSiUy+MjxLl3bt3d+3aNTMz86uvvrrnnntmz55dq1Yt1a1OnTqNGjVS5RIuIZGomOlMyc7AEG4oNTW1T58+u3btmjt3LtChkt0FCxacc8459KlevXq5cuVUZ2dQyZWQSFTMdEZkZzDIMIz9+\/f37t37zz\/\/\/Oabb9q3b69wwxYr9Msvv1x++eWhv+lcwiUkEolOpYLuZt26dZ07d168ePGHH37Yo0cP6sETUq1RUVGzZs16+eWXVf9gfYmVkEgkOvWKj4\/v2rXr2rVr33zzzQEDBlATZE2wEBYW1qtXL2GQkpBIVMxUmDdclPHZuXMniElPT\/\/4449HjhxJpWmaQa8kOqqERKJipsK0GGBo\/vz5HTp02LVrF4X+\/fsH61VBdCwJiUSiU6Z58+Z169btwIEDX3\/9dfv27VUlGFJSu6KjSkgkKmYqtCTomWee6d69e5MmTVasWAGPArWiE5OQSFTMVAjWwzTNRx99dMyYMa1atZo7d26DBg3krtDJSkgkKiTZv2TPP83+aSD7G2C5FF3sUeKyNHX7x2YNy2cR5rrm\/Lais6Gn859CFJQJBU1aWtoll1zyyCOPXH311YsXL65WrRqVkoudrIREokKSTjT7fYblN3ya7tU1E\/zohLBNHJMml+nRrHBNc6ufoDaoplkz3T6PXSpUBUm0fPnys88++5tvvnniiSemT5+e7zNlohOXkEhUOMLZgBefYZsgl99t6abpyvYbXhwQXohdn+7244x0n8syqTDYaG6vy2sZx\/\/IaEE4JsOwA2fq1Klt27ZNTU2dOXPmAw88oCpF\/0zy2IkKS1x7epjf8vjCYJHXMEwrLAwyWW63roeDI3eGoee6\/ZrP0PiP\/dOKptuy6BLI046h026XyLxycnJGjhw5evToJk2aLFy4cMiQIdSHpmyik5WQSFQ4sn\/AUfe6LAyPz+fOM\/xuj9\/AA7lKRemusnmuqppWzVUqVg936X63qYXn2b+1lhvu1+2f4i8oOXeEAgpUadrcuXPPOeect99+e\/jw4UuWLGncuLGql3tD\/0ZCIlHhiMi2LJsq+B3TCvf4fXopb4oW8+qXB3qOXX7+nUsuvHvxU+\/u3Jka4ynlivTl6ZrL5\/JZmt\/\/N3esT7ExUQxSlNm6deuoUaN69eqVlJT05ptvzpgxIzIy0ukl+rcSEokKS7phuXX7F2W1MJ\/mijZX7Cpz8bjlt7z4+\/9W7fw9fvdP8XsemL7qwnt++X6FaZQKJ01zMi\/dsl9WO45OpTEBQOpnOWDQuHHjGjVq9MYbb1xxxRXLli0jO6NDPrsk+scSEokKR869Hntj35B25x7wlr36kd8Xrd0baLaBYhNn4570wQ\/\/tnmnywi3fwKbjM5+pd82Pn7TMP12yX7FzfnleftX+5nTb5j2K26O61JznYgUUI7EyqJFi0aPHl23bt1Jkya1bt16zpw5n376ae3atQPNolMkIZGocKQ7d4g0y2Npbq1Uqc\/\/l7Jq6\/5Amy2bNU7BOJCV\/fKXe6yoaOgEiOw3GVkezQpz+V0u+wU1w8dG81Lw2zmU123Zb0ECUielsLAwtioL8\/v9S5cu\/c9\/\/tO8efNOnTpNnTq1T58+33\/\/\/a+\/\/tqzZ0+ne0D0V0NE\/1JCIlHhSHkW+y1CoCUv+v1vEwMNR5H+8YLtB5K9epjmMl0uzW\/pPl2HU1gqw7DfbWQZpgsSWYafK1q3XPgj2yodkakpcChFRkZGR0eXchQbG5uamrp3797\/+7\/\/u\/fee2vVqtW2bVsKBw8efOihh9asWfPll1927949MIvoNEhIJCos6QbplG4ahpaambczPTtQnV82sNIyslPSNS26klaqvBFd0RMV7SoV5orRXTGWu5QeFh3mKhXlKWWERbu0UhEujxETERMbHVv6CCnuoKioqPXr1y9btuyHH3644447pk2bNmzYsEqVKo0YMQIrBKTGjh2LCUpISHjssceaNGlir+OQ1LJEp1Y8ncgjKwrolltu6devX6tWrXJycgJVRxEXjFE2rux9d45pqs0f3b+iLwOInHyGgpdxPJHbo21Liehy55It+zOdyf8q+33V2CarQfVyNSvEaqY\/3GW2bGA0qls50q2RpDlJGUbItF+H011RkWHPfbrxrC7Xd2rXMisnQy0MB8R1npKSQnq1a9cudjMyMsCQOoJSmzZt6tatO2TIkNq1a5999tmBWlFBSUgkOqwCJZFmk8N+\/d7IzdbLd7hp0cqd+515\/vrDzTaJNI\/hal0nZvXmNL+pu+1a+33W2do\/\/32eDh06qO+3b9++PeUvvvjiwgsvvOCCCwLNogKXkEh0WAVLIsPS\/bqpuSyXFhsx8unN73y\/yZnnrxek45wuaFLtu8kdk1NzsknmLPI5K9tnrt2yb+M2XI\/9epn9QhzGR\/d7wsI\/\/WF7zVa9mjc5Kyf38Fm0aNGicePGuCHKbCtXrhwTE2Oaps\/ni46OnjFjRlxcXN++fQkHJJ\/bKHgJiUSHVbAksi8+sOIzXJ5Ia1l8+Hm3z8s2TcNOxUyO4bI\/kc\/Vaf\/vo7Edr+wRo+WkOQfyBF5WC3NrbschIfWZWN2nxUTf\/fiG86977YpLu+fl5TlttigjrnYFI6\/XC4ZUE0h67733qlatKj8MXYgS9osKRxZ2yH7HkO43cv1ZZquztDsH2DeGTRtDBi1+w20\/S1rakHNrXtallD8j08zTvV7D67V8Xs3+l+nzHczxHcy2\/6Vl+dKy\/al5WmpWdp4vPT0tIz3tQIjS09Nzc3OBEVsUxJDoDJGQSFQ4cu40229GxKL4da+VnfHk9XXeurttwyplbOOD6THzqpeNfnx4y7ceaOI2c6nx2feIsEyBGQ6JCYL\/REVVQiJR4Ui3TE2334LoMt26FWH6dC0j+bpeZf54ucOn4zu8dNd57959\/u+vdho\/rGKEP8uXmwe47Jf8Na+lk3Md55aC8KhISkgkKhzpzifOLM0Dkpx3ReteXfdlp5fypF7ROeLWvqWGXhRRuVSOLzvDa4Eh3aeHeXwe53sdcUbH\/+iZqOhJSCQqLLnsO9aa137Ny8i1P2Lh8vlcZp7l9mV4zbRMX3aaz++1NNMPoXS3\/QlY3eczyOjCj2eJjtsmOmMlJBIVjkzd8IMVLc+vGT4tymW5w31GmDfcsF9Fz\/MbXsv+fmvD7fe4TJf9nY2aF1QBJt3I1uyPehxLkp0VSQmJRIUj+z6RLfWhefv1MguI6KaTtRmG\/dkxl2a5TPvekP1VaTa2LPsjr47rEdwUNwmJRIUjWOK8Cma\/cxHWWLofCNkcglH2P+TH+1h2jf1t+k5PRSC5SVQMJSQSFTM5EBMVNQmJRMVMkrgVSQmJRCJR4UtIJCpmkuysSEpIJCpmkuysSEpIJBKJCl9CIlExk2RnRVJCIpFIVPgSEomKmeQ+UZGUkEgkEhW+hESiYia5T1QkJSQSFTNJdlYkZX8HA\/\/x+\/0+R\/L9viKRqOBl6LoOfQYMGNDI0fLlywMtIlGRlGRnRVKB7GzTpk2bHWVmZqoakahoSrKzIqkAiSIiIlTB5ZIvfxGJRAWtAImCv7+ofpdOJBKJClLy2pmomEnuExVJBUh08OBBVfD5fKogEhVNiakvkrJJREY2dOjQ4cOHjxgxokqVKqpBJBKJCkyB9xNNmDBhxowZ06dPb9CgQfCekUhUBCVXb5HU4TvWpmmqraoRiYqmJDsrkgqQiATNMAKZGlKVIpFIVDCy32MdRE9oWSQSiQpMAU8kEhUXyX2iIikhkaiYSUx9kZRNItM0hw4d2tLRihUrVINIJBIVmAKeCAAppaWlqRqRqGhKsrMiqQCJoqKiVEE+ASsq4pLsrEhK7hOJRKLCV4BEwRfv5Q3WIpGo4GWTCPqkp6erfb\/frwoiUdGUPJUWSdkkwhANGzbsmmuuGTlyZLVq1VSDSFQ0JfeJiqRsEhmG8cADD7zzzjtvvvlmvXr1VINIJBIVmOSOtaiYSbKzIikhkaiYSbKzIqnAHWu1IxKJRIUi48gvJBIwiUSiApb9rSD8Z\/369b85Sk9Ply8GERVlyfNokZRNIkzQ8OHD2ztaIZ+AFRVtyfNokVTgjnUwRxNDJBIVUan7KmyDUvVFQgESqa+ODS2ISqByc3OL\/pvsS252puiDmVCJDgo0FAXZK8YQdejQ4ffff2d\/2LBhNWvWlM98lEBxJSQkJIwfP54LIC8vL1B7FHF9G2Xjyt5355im2vzR\/Sv6MrLPjJyI+DNdMRE3\/Wdzx6H\/6Xdp9\/SMzEDLcRUTE\/Pee+9VrVq1b9++gaqiKYUehSFVQ1kVznzlJ9G777573nnnZWRkqGZRCZG6dqOjoyMjI4PX8TEkJDqmeOhCgz8tLS0sLCwiIiKwf\/rl8\/mGDh1atmzZ119\/PVD1L5TvdE6rAiRq1qzZunXr2J89e3avXr2CH4gVlShxMZyAHRYSHUUbNmyoV6+ey+UKhi4PZuvWrVNTU3\/88ccaNWoUTFRnZWXxdHLRRRd9++23gaqTFOtku337dh4Q9W1lBQMj+5cXOdKrr77asmXLp556qnHjxmAIsopKoIpFVn58Q3daRCbRtGnTL774IhRDCEOUmJiYk5OjalTTaRULwNWGh4cH9k9SLJIZdu\/e3aJFC5hAGQXaTrPs+9McrEuXLtWrV7\/00ksrVarEFanaRKIjxKVKRNlB5VyhhRD2xxDLUTGjtoFFFoy2bNkCxH\/66afAviPC6vPPP8crNWjQQO2q+tMqr9d75HuVT1xqkaDz4MGD69evV5UFo8A7GxHnQForGBKF6sj4sfDRuo8G9TSm6Vz3lAv5n8s0NMvwG7pm6YZlb3R7YQUEoypVqrCNjY1Vu4jHDfG8rjCkao5qi1QlNkRZJ0SGFWpO6XDUgRDnyKa8vDxCmGMF9o+mo84WOlW5cuXYht7eUq0osH9Iqobtvn37gJeqROpGszPClqo8vuQ1e9HfCKvPRRlQWGxkWHR0WHSEJ8ztMqIi3FpMmLuUy\/4X4\/wLllUhtF4Vgk3BQrApWAg2BQv5dkO7OQU9xnLH6GExhhbrCQvTdU+4OzwmIiIysOxDOrVvUiHm77rrrqFDh7799tvsfvzxx0McKXMETUhw\/vzzT6evLQCxbt26e++9lz7Dhw+fN2+eqkxJSWnZsuU111zD7nPPPdemTZuOHTsuWbKEXRXG9MnNzV20aNF99913yy23\/PHHH1Qe9VwUg8gKf\/vtNxaGRo0alc\/d0Gfv3r1jx45lGXR48cUXs7Oz1cDHHnuMmuuuu47ynDlzKNPnzTffVK1scX+sn8U\/9dRTmZmZwfrbbrutXbt2lD\/99FMSrFatWs2YMUO1niCJDnP6oosueuSRR0D4cV\/BFZUgcSXxRJ2amkrBvk6c68pvmG6\/Oy624pMTH87dNb93uwp5OV77QlJDnC1lVUDBelUZbDpWH6Uj+6DQsUqHh1iWiRkyfDDytS8T+934VI8Lu2Zl2T9UEwxmCmXLlgWs+WLjH9+xJoBr1qy5f\/9+yoGHyNFbb71FMIOSDh069OzZk5BW9bNnzx4wYEBo2kE8Q4QdO3bUqlXrnHPOufrqq++8807VVL169Y0bN0JPZl69evWIESOWLVummtA4R6ycg9IhUKtpBw4caNiwIYXk5GRVg+gGJVmJ2t21a1fXrl2ZXO2i3r17f\/TRR5GRkU2aNCGdpCb0dK666qpZs2ZR4EQoB3\/+h0m+\/PLL6Ohoyv369aN16tSpnIJqRWvWrGHCfCs8lg4f7+KLL37yySd5RDCHJzJSVOzFFczlxZNqeno6z09ul0szLdPFhWW4\/EaeCYDOULlhlGH4LdNwuSwniyGkibRp06b16tUr309p\/ZvXzrY7IlBxFjgInsuprFy5cqlSpf73v\/\/16NHj3HPP\/eWXX6hcsGABT\/YYpRdeeIE1YHBwFjiOmTNn8ti2aNEiMTER48OQSZMmTZkyhfoff\/zxggsuYP7zzjtv27Zt7du3P\/\/88wHZO++8Qyr00ksv3Xrrrc4qDossqVmzZlgejMn48eMJZ2Bx\/\/334zAAGQ8C9GRJy5cvJ9gHDhxIpONxMDIrV65s3rw5A+EUu48\/\/jgH5UDMqU5n586drVu3TkpKuv766wE6Xu\/7779\/\/fXXuTzow7m8\/\/77rC0uLu7DDz9kfqYdM2YM53KCJHKTbWLzEhISeOoDvaSIWLt\/c9NLVGzEBURs8DQ7aNAgUgaeuqOiSrvcWnpaSlz5uFyfNzfHl52Z7fP769SuTWyEh4fRn6e2yKjIpD1JFSpUiIqKBFs7d+3kAt2btDcqKqpcubJcrzz7ZWdlm6a\/TNmyOdk5Ho87KzubVIojbt6ypXKlSqXLlCFovXlet8fNVHQoXbo0EctRKlSsCFzCwsKzsrNchpGbm5eRkVGxYvlNmxJqVa8T5o7QwrwZ6VkuerhchHGVKlWY9ueffyZyWF7g3E6Rajgi+CERLKtfv36g4dAPdimHwsqJWLZYjyuvvJIaQpotZoQtxtPr9bK2SpUqQQHCHuhAItgBiR544AEwBE2efvppOiMewJdfflmFd744x\/HhJLBXnKzb7aaG\/BHXBneYGfB99tlnYIJkCktFKw8L9KEAptlWdFSnTh1IxFFCT4cjsmYFF3aZk9Uq9+fxeFgD\/dnC9AsvvLBx48aQCCzSM3R5x5EbDMGdwYMHL126dOHChZ9\/\/jkTyfuJRErqZgRPnpdffnnCpk11atfdu3OH4bL8bk9kZKm8tPSDKclxVaqULVMmKWnv+g3rO3XsmJWV7bwRxFuxYiXdsG9JeNzuqlWrcV1GRUeZfpOLnijdsXNHVGRkhUoVU5NT9+7bC6qg245t2wFf\/foNeOrevHlz7Tq1qc7LzVPL4OpnLPNUq1bNIk\/0+bnKuXpjYkqlpaXsSUsOxwzl+MpWrpienVm1WvWD+w8wUBkiMEFwqnlOuVS8QBO1q6SyjVatWrH9448\/4uPjMSMKQ4izY6vuUu92RGHy5MlgiAKmg61KfEisQMPEiRMpK+6oF+lJYtjmEzZCEQQMqQXQn8wOEpErsQvd6MPuqlWrmBP\/QiWFunXr2uMdpaSksIU7TKVwxjpJLVnb3Xff7XTR+Lt069Zt\/vz54BUS0ZNKXKHKAalhe1I\/nuj8YZwF2wV0KFkrIbLs83aeWwIvTvOPXTBuPw5Oa0kWl4f9EOBKMrOy0tIOrtuwIpWoM8J379i1ce367Ly8qLKluXA3xm\/MycmuWLHCipUr9iTtTklNxihlZmX88vPPXm9eTm7OunVrTMuPQ0ncumX5n8s3xm\/gCk7PSP\/lp5+9vjzG7t69a9HChckpyeXLlz\/Igdavq1ipQkZGenz8xuSUA7t279y9Z\/fmLZuyc7LcHteatWt+\/fVXv+njELl5OVsSt+zdnVwuuszepN3b9u4xLS0z+cC2zYmZmZkkYkQUbi74atQJPkWflFTMH1VlypRhq7wYQGerOmMo2ColJydD3urVqwfTQ3WzBmTAcSjQuXNnYlthCPICEQrq11LznQ6t1PDYUg42Kf4q17NkyZKaNWvec8895INgiITxt99+e\/DBBxWy1drUQNYcfNB4DNevXw+J1MtqiD54XkaBKg5Hcsdqg9mieu0s39qOL4dELN4IjNENws8kLIv9P90yNN3HqVuaix373DWX\/Zq05eYhoIvhsKiEPBpH\/uOysF+wd4hsaIbPa3rCDI87PDwqcuv2bWVKl3a7dVeYe9PmLRmZGXSC2nHly4eFh6eSpkVEZOdkZ2RmYnnKxcWlpKbqLhdbn99XKiamdJnSumHEJ8QzKqZ0bFp6emRUVHJKyh\/LltGanJri9XkrVKpAef+BAzl5ufv27+dfTl5O7Tp1qKFndEx002ZNvaRvPh\/T+i0zpmxM+sH06tVrV65UBfb5LT0rk3DI2LJlC3FCxqFi47TqqIGnbnQoFoTSJyYmJlA6pMqVKytsIYUS6ENeRkEZEyXyU1IqBaZAVYiOavrUwhRWdu7cmZCQ8MYbb5D3zZ0799tvv23btq3Ty+6meqo1qxpVCEodVG1JA7GBGB8e27Vr13JGZIVOr8MznLicdbv8gVc+OIZmUCZKi\/0\/EMPZukyTVMOwgUT8cf5uTfdaht+vu2j0+HXDzD+wZPzDV8PjXF2zLyndHZ6avN+leVy6hwD3+32wo0rVqlynsTExxI9yH+vWreNy5KmSQOL5UxkBnktjY2NLO2KXjINo4fm5adOmXOg84QOLTZs2kXBxHVPmIibwMjMyExMT6VwquhSpClEaVy6OzIKZGRvmCSOi1q9bR45DXlA+rjx\/PVMzcRb79iV58\/JKlylH2NOTpIOxTBsk0VED+F9KRSwPgtpVUpUq\/lXipl78UvUkjGxV\/qKWFCQCwrCw5aFo0qQJBbwkWzVw6tSpnGbDhg3V43mkmA17ospqyLRp09iqNz2pbJGM78cff+zRowdlxIPDrsIf4vFHoQ8URpUMEfRwaHaZlj83qVmHDh34a3KObOkfnEHllSclm0SQx7CvPCWWbl+Fxf6fk3mFkYWZus+mErbXsIlMjYvo0zWvy+d1qW75x5aAfzhBrgqSATvhj4gyqlapFFOqdGZWdlxcOfIIggRDzjMh1yhl9Z4jrj8uSsKAIFF3QKBSo0aNKNCTLc\/kXLIE5Jo1a5QpgGL169eHNcQk7CAkCNr09HQmrFGjBrtbt25lKqhEJYI7dKMA6SiQoTAnQ9avW5+TncPk9erVI9khrSMqgODy5cuJGforEqnIPOVSQXvgwAG1q6QqOTTbWrVq8bDMmjVL3cRF6u1C3333HVu1KvVAKan73KyfE2zWrNmcOXPuv\/\/+\/\/73v+PGjZswYQJNjRs3ViwL5YUS9ZB90aJFPBPwILz88stPP\/00D+aAAQNoVQngL7\/8gtuiA+IoV111VZcuXRYvXuxMYJOI1Yb6Gv6y6vX7e++9F1O2e\/fuO++8k90RI0bwmPP4h3ZGVDIJniv4BPC3wgjYZ9Kmffs\/fvuNwnf\/m9urW4\/0zNNuZQtfZGfwBgekuQ3LyM7K9Hl9BJ\/X8NoR6HdHxsSEGSAKSAVGlChxWcRGl5r9+TdXXH7xiy+9MHjIoA1rN1WtViUsjExB379\/v7pNwHXJlkufQIIOXPo0wReii2vRvksdFUWBp1OFJy5f+hMt0IfLNz4+nidbMERI0Apo6E9rSkoKiFG3NrjumZZg5rLmEHSgG\/MwITHAs7TaJXiYh1aIQAFE0sQhiCJs0fTp02+66aYPPvjgkksuYc3qHJX+zav4SniWmjVrXnnllR999FGgynn3zUUXXfTkk0+qV6luvfXWV155JS4ubtiwYbiJVatWUVmuXLkNGzbAWQwRbkW9ZREBhY4dOzZv3hzc418URJQuvfTSX3\/9tWfPnqw5UBUiTpkTSU1Npaxue\/NIcpSffvoJE8oufwis0MKFC3mI6ED4K4D279+fh4jHij8cThOgs1SMp7o7jjjHNm3a7N27l1RX\/R3xa7\/\/\/jsPOH9lHmH+rDwHqCcYrgHYx4PP3y54a+n4cs\/84N28LK1GzYbr1yTUr1f71x8Wbly3hZgMtBdn2W5IJxv1G7CoS9fzalap4IVLWpjb8oW7jf\/N+X7rtl32DbQSSiIrPCp6xVL7+Sk6JioiulTpMlF7k3aXLRfHtcVFDDvIetiSAXFBAw54xDUKWeDFrl27uFjJy7i4IQU1bNlNSrJf3ed5GFqRkTEcLnBB44y4mmkix+HKJk7oDFwIBg6HGEJPDsT8EIo+zMwRCTyMWIMGDZiKOIFNRBFb4MUM9CQUMSBBM3I6RLgSkCqTCooM66GHHgJ8aveFF15ghZggCmBr4sSJxO2UKVM4Qc69ffv2YItunCAsgAKUFUoA3Pfff88oHroLLrgAV8LJ8mDakx4h\/grdu3fnEVi6dCn9mapbt24sQ2EIsU5me+aZZ2bPno1fowP+67rrrsPdMFb5Ev40LIBkmacQNQpBFhY\/duxYnA7nO2TIEE6B2WjirzN8+HBOJGjTWDnDMcL8BVUNB7JnObb0iuGup0a2jCxjGD6\/4Q7LSk\/P9XoP3b8uznJZep7LhzOKiHT\/39zNQ+94feCgqw6mpfp1t0cj3Yi8om+vNtX3NK8UhlUKjClJIu83XbrfjBgzbeVzb7x92eWX5ub4Nm9OwJtwBRNUgIBnPK5FrlHCnidAnpCpZwti1CvuXJHqEgQHXKZckerSBCsMpxtwYSzz4AjgCDGAS2JL5kV\/uEbPs846izK44ameZI1nXSKZAzEVz8Mcl3omoQNNIIyIIlB5qicg6YZYJE\/4eBM8EcYHRDqnGNC\/90SIqON0jnrvhrNGLJUytg7j06FDB+U1QCTGR8UzCu2JLWJCEuF8Mcx54Uouu+yyTz\/9NFB1SIw9VsAftYkHjYcLqV36qAI9+Svw52MBalfVK5Fc84ipz9OpIaEdgjUqHz+J91g3q1V61YxOmi9T83lI7zQrj2lsF8CEamv3crZIVaqC0r\/sg4JNof3RSfU5zliUrxtlCmRnLlPzh2mxrideXFm5y+NXDe2fnpbFyds5WXjUyAH9nhnoatLQr3kP5cD55kFqKlVQCvZBwabQ\/ug4ff7NWKXgbmi34Fil4\/cJtrp1MzeqSv9vxj318vCr+qfn5GKUcBtQhudMwEH0EkUkGmeffTaVOBH4QiDxXKqeTok30gFsDp6ILQgDMSqW1MVKHAIOanBDRClRAVZUHgdiQBLRou7yEBjU0A2O4CYoMAmUATpgjmVQyZPznj17duzYgR8BTPCLmZmBVf38888333zz6SNRPoWGaGiEq8KxFAza40TvO++8g4XBIt1+++2BqkMKPWio8tUfObnqEKrjdA4qdJTqc6yaY80QKr1JzTJrpp6j5Wb7rTCC0zJyLd2yX89mBoarmYPzqEpVUPqXfVCwKbQ\/Oqk+xxmL8nWjbBfIznSXabliIh56fWOtno8PHHxlhnN\/0QBGEeHXXzngocu8bRqYPjtlc5RvHhSYKuRwwT4o2BTaHx2nz78ZqxTcDe0WHKt0\/D6HWt0uMz03su7V8x+eMu3yi3t7vbn7kw9Ur1Yd4uBHQAzXGVENICjj\/+FFYmIiYGrcuDGVYIIghwXQgef28uXLU6YnkAIZEISMiSEkdwkJCdgcpqIbozg0HOEo8IgZOAqVlCGUmpBdWtUySFhwYXAKhDEDeGJanszBE\/PQgSY4CIMKkkTHF2eEiE8VopwIj8mR4ar64ApJSJWHgt0kcdu3b6cy9A53MZDetEaZFW+0M71ZnLf90Q\/7vSS6cze3+AviYu5dMVHjX99Yu+djAwcPyEi372UCKFe4xybR5d429S1fXjCCS5R0SJSWG9Fg+IIxT77U\/\/JLLcuPD8INEeRkZKCB+FFBha8h\/p999llShnwvZp9yEZwcMbCjaWQ6IIZsBVOGG4JxrAQUJiUlwSAMUZUqVSh\/8cUXKjs7HXesT1asX3EHhj711FP169cfPny4asqnhQsXnnvuueSntWvXZhdnx8PLiTz55JOqQ7ERJCq7cmorQ\/dpGv8sM0+HRoc+WV3MJSQ6rgIkOuvan0aNmTj6+mvJrnbs2El6xXM4+Q7GhFAnqrEhWKGBAwdu27YNh0LMKAtDNzK1smXLwi9cCdhST\/5kUtTs3LmTHAp8kJGRhRGZyi4xFZkXdGAGfBOdmUQNpNvGjRvnz59PoUePHhyFaT\/55BNan3nmmd69e7MqhmB5ACU+iwlZYeXKlakhhm+77bYzhERKy5cvv+OOO1jYK6+8AkwDtX8VjxJ9OEe1iw+64YYb7rrrLnUvqThJb1aj7KrXW2\/fa6R4IzTdX6uMt5Qn23Lez1bsJSQ6rnSX28zIiag7bP6Dz742+vrrNm2KxxDhm9Uda+IfKwRKYNM111yzdOnS6dOn84z99ddfY5p69uxJ5EMKnv\/Jp0jNIA6dIQUZGc4F0IAJAEQ9aRcAYmy9evVWrlxJvAEgJoEs6j43nVnQ1q1bmZPs7\/7778f+zJ07t3PnziR0M2fOhFCPPPLIrbfeyqhNmza1b99e3SFiwXCHuIVB48ePL1wSBa0QD8Kjjz769NNP8xiy+8Ybb8AXp8tfFOyPp6NMAayrNK34ydDdeq4ePXrSr+1v+rbT6LnLEvNcUcF3OYpKtJQzNnQ9OTk5ac8ewiY3z75DrBIfKEOcdOrUCQqAoSeeeIJut9xyyzfffLNo0SIijeiCINAHBxQfH79u3TrK9CGoYAr0oUwlXEtNTWVatuvXr8dSgSoqacVkMfOWLVuYAQCNGjXqxx9\/HDFixNSpU19++WWOO23atOeffx5\/xEroSZRCIqaiP5PExsZyXGrUvW37jP6a2RWMOKKSwsq8efN40CZOnKgwdByp\/gjW4+xQccUQMsItztaX4vfm+L2Zfq\/mczl+qGS6AFF+cR3wr2KFCrGlY0l29u\/bj0nBPhAkwIgOmzdvxpsQKnXr1r3vvvuoCcbPZ5999uqrr+I4VCpBIAEXv98Pg7BIu3btwhmpl5DJQZgNXmCyyMKoXLZsmXovErzjcNTce++9AA4ArV69GjZxFCVAA5KAERQDcCCsbdu2pGMcKCwsjINii1izekEaHNgrK3AFlzpu3Lg+ffqoX\/RSlaqDyDA1576Q\/ZqrfbmYLvu9fqpNJEJEb3JKClENKezX17Pt17MABEkQ7oMMSL3Rds+ePQS\/GhIMsIULF5JzgbAyZcpgUuhDAXcDcbBLWJ7s7GwwwS4GgbxP3ehhTghCB6DDQRk1cuTIxYsX4yN69+4d\/FACUgdS76BLSEjACql3\/TEnK8QHMRzM7d69uxBjXh0aK9StW7dJkyZxdtQgxyfZZGTZTscSLecD5zDI9kEQSbyQKL+Io5o1amRlZmY7N4D3H9h\/4MCBfc7HOFD16tWBCxDJl2soH0SqBYYAAcTZsWPH2WefDcWgA+YF1jBJrVq1GMs8zIyRIUEjAYFBBCp4Ui\/GX3nllQsWLLjfEUFLkzoEYixbDg3mgBFBrnBWoUIFoMkusONwHDQ4KnT46ZOiDKLMeeEWu3fvvnz58tBWVUawMlAqwTIgs02iQ38dF8mana+JRAERul6fb+fOXfHx8bgM0AM1MB1EOKEOOwh+3BD1gQEhkQaJwAR5Fv3r1atXtmxZdqtUqcLA\/fv3t2zZUjkX6MMMJGvUb9++nfkZkpSURKZ2ww03rFy5Ejdx5513Qi66NWvWTB0FKaw0b96cozMWBjEVHk19IREz46eYlm4sXg0JRcDpFseaNWtWq1atJk+eHKj6q9T6SVTVbkmW4WDHzEq37+fxJ8rh76R8kkjkiKshMyPdssxKlSolJibOnTsXv+NyuYAIvABDWJj09PR27dpdfvnldn8n1Nk2atTooosuIsygz7p165YuXQod6IxLglCKFHAHm7N582aIRj0+iJmZk0OQZF111VW\/\/PLLFVdc8eCDD8Ij\/FHDhg1HjRoFoZhfCdB06dLl119\/BXbAiFFMgmubP38++RpuSDkRuGmfTEEJxCCc4Pvvv08aq2pU05HixAOlEizDbxoezTtmaNOnRrZ4dmTTxpX9Zi42W2yRKCDTtDIzs8qVi6tWtRrxXKdOHXIrMg51XwYPAo9AALiZNm3aTTfd1KBBA3IuIPLYY49BCqCDZyFXAi4Qh4DEp1CuWbMm7CAIyaTIwiAUDKpatSpJFh3YPv\/88+vXr8cT4YZI35iHg5KFDRo0iAN17NiRA\/Xp04cOr732mrqHDYMYiPnCNyHlxVgzNMQuqdM5DhFOrTh3Djp79uzp06ezeHZVfegCVCVQVrslWYZp6S4tb1Dv8mOHVLh3cOXacXn+4MesRCI7cuzPYVeqVHH16tXwIi4uDvqADAgCOzZu3EgahT+iJ5h45plnPvzwwy+\/\/PL2228\/++yzGUjnFStW4E0YCIDIvNTd6G3btrE955xzGA56GA5EmOHgwYMYH0zQRx99dP75548fP56BMAVhhZKTk+nfq1evb7755quvvpo0adKnn36KA6pfvz7xjCHCZzEPhogl1a1bV92WYqmw0jmbQPAXgILEGTFixB9\/\/PHwww+DY1WTT8G1lWSRidkf8NDSM33pOd4Mr\/0ZxxLxSQ\/RiYr4Bzc7duyIio4ivKEPaRqJEg4Fpqg7QYQ3fgQWgBIgxSj18vnatWvVC2SMwqrgg7BRAKhs2bJMSwTCnSpVquzevZsaqIGFadGixcSJE9WPRhC9TF69enWOSMqGM2JacMZAhnDEK6+8EmtGBtSjRw8qMzMzleECPcpowMECM0HHEg8OKeQjjzyycOHCzp07H4lC8UTI\/vle+z41j5f9GQ\/LZf9+naRmosMiTvymWbVqNTgCRIhtsEJ4wwgcCgYEt4IZoUz99u3bgRHosUc5bx3CmJAoYVvoQxMzwBSQQR\/cjXo7Iu6JyiVLloCnRx99lLwMDJFzcUSQt3PnTvJBUMhBGbhp0yaMT2Ji4rBhw9SbG7FO6lYLKylTpgyEUjRMT09nOIdW96qcsym47Cwojqjo06RJE5aEfWvTpo1qEgXlfE2z\/e0PbtsZ6bC5gLyrqKjIMq3oqKj0jPTcvLzIqEgosHz5cpKsOnXqEPmYGmBEsGFYFJhADJaEJgiCQwEB8EVlZHQuX748c8IgelJu3rw5pgk7wy4Eeeedd5588skLL7zwoYceAmoEMI6JYzEDW2ZgIN1wT8899xwW44033oBHtAIypuW4uKoNGzawCwQhIzTEIqkvV3POpuCys6A4ojro\/fffv2zZMji7ePFiTjC4JBFyXsUHQGEetzvM7ba\/osh+W5FIdEiGrpM6Ec\/RztdUUyAjI9TXrVsHgEAMZodIAyU4EQQpQAAAggs1nK8QJacjlQM3xB7D\/\/zzTyakVTkpBkIxwLFmzZoHH3ywS5cupGZAh0kgFx0ADaNI0DAUpHgNGza85ZZbvv\/++ylTpoAhLA\/zK6ej7BK7DMElYYg4esWKFRmozgUVvCdCrH\/FihXPPvvsgAEDLr74Yk7tscce++WXX\/r06UMrVlF1K8kywkzN1M0d6Z6NyaUTD5Ty5nrsVE0kcqSiFo7s27cfr+HNsz+FTw2MAA0kVupFMUik6gkq+LJv3z7MC322bNlCK8MhC3kTEUiHVq1aYWoAFsMZBa3og3t69dVXSccIVzozA0ChFXAAo1Tni5lpZZJx48Z99tlnEyZMuOOOO3bv3g1ugA4z0IFDw0q4Bok4KABiSyUGLQggZU8KUhwaIF5xxRX4u2eeeYYatQYeh6+\/\/vqjjz5q164di3T6llwZpkvL0aJHPbmk7ai57Ub\/74+tPvkErEjJUsGr6xmZmZUqVgwPD4MgVBBRWCG8xv79+2EBpoZKkjKgAETIj4BUXFxcfHw8PghztHfvXvoDBZrKlSsHgJRbgRSgCtDs2LGDphdffBHE1KpVi4HMnJmZCeY4CjaH49INtN18883Tpk0bPHjwiBEjmIQZmIcOCjQAi6lYD\/2xXaR+jRs3pgYFQ70gPVGQemPHjuVMMXHq5fzQNVx55ZVvvvkmjA7sl1TZzyRuUzuYkZuWnb0vOzfbH37oV4ZEJV26ZV8HlmU2PussT5inSZOmhDrEQVgbbMv69esJe+VHsCH4EbhAK6yBDjznn3feefga8in1gQZ6giocCmggIHE9GCKIs3HjRijTrFkz9WalatWqnXvuubCJIRyievXqBDDZ3Ouvvz5jxoxrr732hRdegHHAhdmYhwk5NJ2bNm3apEkTFdVMSAecF\/Ow1IJ\/92AQQ7Nnz8bo3XrrrYMGDQpW5lNB8vHMlMEjoGuW2xV46d7gf\/IyvuivSkxMhCwEf3xC\/P59+yhjcIALrCHsiXO2Bw4cwIaQGW3atEllTCBp165d0AdM0EolcQiqmA1eqIQLvoAtGISH2rx5M33AE\/Ool7qYlqxNvfL1xBNPTJ06tW\/fvo8++ihWiPmZql69eswZ\/EwsYAKIsIwVJiQksMjt27czCYBjWtWnIAVf8Iy33HILJnHSpEnUHItEIrij+TXDqwdJJH5I9BfxVBURiezvTryw64U1atbEaKh3G+KMSJqoJ+SwHrAJ6CgescWSkCXRZ9WqVaCnZs2a1MAaOgM1PAsp2LZt20jBEE2QRd14Yn46ABH6YI7wTTfccMPzzz\/ftWtXUjOgBobUENADYtTPHLFUVgl9SO6YoXXr1tgxzBdHYbaCNx0ckZPt2bMnD9E333zDYlhkwS+jqMjQdOyQ+iVmW\/Z\/dXmPtegvIuzTDh7ExWzeshleAAJYA3pgEKlTmTJlVB6EsCQQChsCEXAu5G50xtGQgjEQalStWrV8+fL0hy\/swo4tW7ZAHEKUsertQuCJyZXbAm3jx4\/\/7LPPOnXqBIY4IvMDILRu3TpaiXDlv1gnWwa2bNlSmSnmZHkYLg6k0jd0ul1J6PxDhgxZvXr1Rx99hHlkl\/UoqVZRqAxL9\/sN+6dj1H6ekau5+JvJgyU6JN1+RSw7J5sYA0AgBiTt3buXICeosBs85xPn9FG3h\/BBoIet2oUmJEcMVPenYRCdmQS\/QJluygrBLPWdIXAK8IEkOuCkXnnllTfffBO4vPvuuwCLZAfRhyGAb8WKFQxUbx1gpRCHUfCIQ4AnXBWV1HC4gol\/HqIgiSZMmPDdd9+NHj2ajDK0XnRUGX5T85je8cMaTr2p5bRbmjSu4jdzxROJbFn2PUT7E7DpaWnQhGCOjIh0GS54QSu52Pr169euXUs9Ag2VKlUi\/uEFIKBGGSL4gotB6lV85ZVImsAEQ5SrIpUDZCAGKtEHv8PYRo0a4SaeeeaZ7t27T506FfcEnjZs2ABuGMUaqlSpwlgmJP8CaiyJMt1oZRI6sItF4igsCWY553Ta7w1zdLavv\/76448\/3qtXrxdeeEHVi44vwzR1j2Ve0rnCjf0qXH95lVqlTTNPSCQ6LCK3XLlyRLuTfnkMl0Fs8wyPLQIftWrVwsJAECIQEf+4JIQJqlChQlxcHJ4ITOBTABA9qQdhBw4cwOYAIAYiuMP8SUlJIAxmkbjRDR5Vq1btmmuuee655zBBGDEOh8EBQNCEGTgKfFT0YUksVX0qjfk5FmVamVylh0idzumQsjxIYQ563nTTTe3bt\/\/44485NWqoV02iY8lw2Y+f5s3JycvK9mX47N9dlO8nEjlSr+JjjHKcF8tSUlMStyYS6kQ1cUXq1KZNm+joaIKNiwjWQBygAEEwLwwnNcObUIAacEThZtu2bV0cOUewPxpGHwAEX+igbu4wPxkfw7FFRDVmSn2Mtlu3bn369MFMsYaNGzdCK3pCLoawPGYDOtRjlBjLYsATK2Hajh07durUSR2RparCKZdiDVZozJgxcPbLL7\/Evp2+wxUz2d\/WqGs+j2m5LJ8DIRcsCjSKRISuZhHSdWrXiQiP8Ljtn5wnwPA+2A3qMSDgAx5RCS+wLXXr1oURtJKCLVq0iLK6qYyfoifEiY+Px2TRCoYwTUwCqmAKVohWem7atIlkCktFGaME3erXr083kkGOzijqCXWmxXBBJTU5IODo9erVg0TKAXHo2rVrQ0bmV+eCFC9OrZgTQb077rhjwoQJV1xxxdy5c1m\/YOjEZZCJWVaYaUWYOljKC\/f7XX6xkaK\/KDIiAq+xNymJOCfkIiIiIIJ6oapmzZoQQaVj6h42xkflRMQhpgZwQBPyLGwR6RjAwu+AoUqVKqlb3QhbBGgwMsrLwKl27dpxXLqBodWrV69ZswZnlOD8mCJUcjs\/3wj46IzUS28I+6PWxlFYEsOpJItEHEWdy2kS6MF2vfjii9ddd92nn34KhlQ9C1AF0fHleCLLZ0S7PbjcMobu5jnQHWgUiZDzsSmesGJKxRDzoGH37t3qtjSUwXFAIqBDH0BABFKJUaISbEEECsxBKz6FVgjSvHlz+lADcQAHpgayMJYm6nE31FMDSpo2bQpW4BSHo0Pr1q3poDIy9TWMtIIwmlQ+yFRMy8KwWgxnqaykQYMGVatWhXHOyZwCcbIosKNp2DdMUK9evQDfW44CDYKhk5Hh0nRTd339U8orn+x\/69OU7QddhkfuWIsOS0VdxYqVMjIzCO\/t27dXdr4FjTAj8hWSKMACTAr5F60whUSJSvqAKohAGV7gg7An5EqghMRKvfuRGuwV\/TkQLon+GB+AwpaZOWLDhg3pjy1ilwmpT3Heil2+fHnmBDEV7c\/EhTME26U8F6xkQioZzmIYrs7llIg1IBYzZ86cq666ijxx9uzZt91224YNGzBEdAjllOgEZbh1Pc9wPzxjxa0vL7v+5dXrdniMcPFEor8IOhDnJGJ5ufbvZ+BKCDbwwTYmJgbPAg6UnSE1I0phB6YmPj6eSiKWGcBNmvPFIJRhFmiAZZThGrYIKil2YKPAE6NgCpBiWmaDLGrLLiyDLAzZtGkTq+LQgIljUbbxoOsYE5bE2sjmOMTy5ctvvvnmMWPGQA0Ox+LB078kBYnqpEmT1O8FfPTRR9dee+3atWvJyyAjM6vJ\/+UhSqAMU7MM04iMUL9yqxsui0fRKYtEARH8BHlOdk54RDjhTdjjcagnRQIQQAoWQJAqVapgT9hV6RtWCGTABZWjgQAQQ7gyUN20JnWiiaBt1qwZwIJiQIqxzAmq1Oc5KAAdFtC+fXtaIRRTYb5IuOAXh2NhzMAuWwDEtHRmy3pGjRoFht57771nn31WkYjCypUrmfNYpKBeKbAfokWLFjH8\/PPPh0Hjxo3juI8++ig+6O23327cuLHqY7PwkFSN6ARlWLrlPGbqgbMM++Ov8iCKDgvo4DugAJZny5Ytq1atUp4ICjRo0ACzQytNQAfLA5IgDn6EUQQ89SAGZGzdupVu1DAWlNSqVYtKeFGjRg2CFiNDjXrzJLQ666yzoAmHpvzHH38Q53gl8MfwChUqqHQM9LCkH3\/8kZ5MSCX94Row4og0DR069MMPP2RJoVD46aefBg4cSArJagNVDj5Ct0qUGUtK+O677w4ZMoQz7dSp0\/33308NJmj+\/Pnr1q2bMGEC7s+eQvSv5XDH\/vbqwF\/L\/qUP+VYQUYgIy52Hfhqwbt266j3TeBPggvFp0aIF9QT\/gQMHoA9QAA2QBRip20AkUNWqVQMlAAUMMVC9kkWcAxr1ohhGCQOFJ6KVHBBMQDrggv9q3bo1E1KmP\/ACNByO4\/7888\/nnHMOIINQCQkJEJB10pqYaL\/jCWICKXoqpgTFLnaMTEqtE3IhypwRB+UUsGmzZs167LHH+vbtC+wwa1dfffVnn31GhwceeODXX3\/dvHkzJqhr164ckUViAI9qoEQnK\/WN+m7z0Eucfst+lcTGk0jkyO\/z165Vq2pV+53NKocigSIC2c3IyFi7di2RD26ADskaZgRqQBZaU1JS1H1rdY8ZfAAaYIRRIuZpCnNEf4KZbtgfmpgZ4nAU0JCWloZ\/oYb+9AFMsIbUjMOBIWYDFqyQORlOAbhUdz6R+9\/\/\/pf1UJMPE2oX1kAcVr5kyRLgct9997366qv33nsv2SXDBw0a9PDDDy9btozdiRMnktyxBtb2xBNPYIuYnEmUmCof6UT\/WPbfz9R9sTpGyBWmGWGWT3O+nFwkUjLs7zq39h84EB4ZQXKEiSDsYQ1mhGhv0qQJ0YioxNeQNyn6YBloBUA4IPI1ohoSUaYAfahhnhjnU7LqPdNwBzcEiRSMCH7oQ5\/atWsrH8Sh6U9CV7lyZVK59evXY084BIZLvdjvLNX+JjaOQquzdlsKGUGxVEjXo0cPsMK2d+\/ekydPxmHB0O7du1933XVz5sxZsGCBykMffPDBwYMHl\/7r75Sp8w1VoEH0L2T4LMujZ716\/7mLXu6z8NU+Leq5\/Hkl\/St1RaEikgm28PCIlNSUjRs3ggmoQcDjj8i5sCGwA1cCgyDFwoULIQ5ESEpKYhdBECwMHgQAYWpoJWuDL5gLUEKH+vXrwxqCn0QPv0NPIh\/SQRwOBDXUfR9SOcdC2T8BQp9KlSpBLvwUWRhNHEIRh3qOno8++UQrK7npppuuv\/563NCff\/756KOPvvTSS998881bb73Vs2fPLl26gMhAb1GByMAA6Zq\/XvWstnUPtq6VUiY8UyyRSMmyPwlkSyVfMCja+VQHxoRgbtmyZTDmQRUwwg1BEDpAEHriKXBJ2CIcCs5FgQly0VNlWyAJYKmbyhAEH9S2bVswtGnTJjBE8qVekgdGEAcGsUsl2GJ+JoyNjWW2Gs73zypjQjZHf1qPwxG14BdffBEGvfLKK8OHD2\/evDkmS7kqWkPljBAVhEivdUvjOsv1en1+r9fyy2c9RH8RQY4rwYaUKV2mStUqcAQoUAkvtm7dqu7RELS7HUEQQppdeAQsKO\/fvx9YQJCsrCwAwUCGk7sxs0IbPmvDhg3YK1qpx23RgVH4I0CGA2J4gwYNOAricGp+WAZ3YB\/cqV69epAj1Ksc0Fl7IJNS5aAwRIieahIWpu5V0aT6B6X6iwpABk949sdeTd3U3H6dZxIPf45Ao6hkS30U2jTt28mVK1cKCw8jt8LgYF5IiAh4KEAAQweCFqMEegAQaRcCJfAL\/9KoUSNyMQZu376d3eTkZFwS0KGVIUochSYYhLvBIuGP6NCkSZM6ders2rUrMTER+4Mvoyc5IGXFrKpVq8IghjCzQhs1LAAMjRo1iv72KRyNJsOGDbPfpSm\/Rn8mCQpZ9uc9TMNl+UjVuPbklxdFQXE9eDxuzA7gILaxMKRUWAkinLCHRNgibAWowvVgXkh57rvvvgcffPD9999nCJyiJ+5JZWe4DyrxL3QGZwykA+Bo0aIFTVghTBBHoR7RjUpMFgdlAeoWEgXA9+effz777LP33HPP448\/rt4GqVarJp83b17nzp1Ju6jBdqmmoMDcTTfdBL8C+6IzQ3gi0\/4akJgId0yYO0Z3ue2rJ9AoEjnhTS5TKrqUZdpvnwEc5cuXj3LedU0rPKIAPkDG\/fff\/8ADD3z88ccvvPDCk08+OWXKFDwL\/gXoYG3ogGFhBlhQ2vnafKgBXHBDXHJADcBBNJoU5siYaN2xYwcDqQFSEAdblJCQAIPeeOON1157DR4NGTLkhx9+gGIsRvkgjgJoACLrYTf0eu7WrdtXX33FKeC\/AlWiM0OGoRuWP\/y7xWnTv816f07GroMet9v+c4pESlAAQOBrDiQfSEm23xbELlCAHTgUwIFLAje\/\/fZbvm9Kfe+992bOnImXIfKV04E+ICYjw\/4kLXkWW+bZt28fBVBSt25dRmF52JL6QSimhSMgiQIMAn8ca\/LkycDIOYK9NtLA559\/HrJQVvldw4YNGQvyxo4dO2fOnNtuu+2qq65q3749\/W+\/\/fbWrVuzADqrGURniAyPnZKFjX995bWTfxvy7J9rt4W7PPIea9FhEdJ5Xm\/lKpXLx9mvi8EIzAsBr4I\/PT2dwAYxUCkwIERLly6FIHXq1AFYAGW788NBoAdt2bIF6Kg7PpgjykxIqgVrME0YMfCkDBcIA2cQh0P\/\/vvva9euDcx+SBs3bsR2USCPS0pKAmqsilGrVq3ClI0fP\/6tt97q378\/HTgEkBIMnYFyvilNN6IjI50b1br93UT2jUr5U4kOv4ofER6OhcGexMTE1K5dmy2YUPeVN2\/e7HSxg5wtQR4a5+pVdrhDfletWjV4hDlq1qwZpKAJ0EANZqOVPlRShkGIBBBCgTwoxqEBCjUNGjTgcPQMzB6SeWHTKDOEqdavXw\/+KKg73LSqW04UQjM10RklAwz5Xc6tIs1yOf8oBBpFIlt6ckrKhvUbUlJTLM1KSUkBQ5ggvBJG5qyzzgIQWCQin66Eemi016xZE7cCBegAQaAPwGJgGedTaWAIiwSAwBPUgBfkgJSVIBqjgBFDsF14LjpceOGFjRo1YmaFPEQZp0Y3UAXImA2QYYjULacVK1awAMrkks6KBEZnqOzfgNU1H08b7OCPfLYxkj+VyBYXgroUoAzWJswTdjD1YGXni9CACCGNVYEyXbt2hTIw5bzzznO6B0Rr37594QJlAAEpdu7cCTsACn6K\/upOEFQi+SKxAkaIzgBo5cqV6oV5wMfhQAwdKEOoG2+8kXqHeLYoX3PNNczQsWNHyEh2hueiJ4leZGQkRozjQiLQSU+k4CU604Sp1XXLrT7fwV\/V\/lYQjJHYItEh2eyw7yLb3\/5DGbsRGxsLJoARZRDTvHnzKlWqTJ48ecKECSNHjsQi1a9ff8iQIZ988gmuBByQYcEyhtCZngzPdT5nD0dI0Eig6MbMUIlKChyoriPqKzjfSw9KMD7AhYNef\/31L7\/8cocOHZo2bdq2bdtJkyYtXboU49OnTx\/o1qJFCw4E\/tjipCDRunXrli1bxlSB8xGdkdJb1Cnz+ysde94678fNeTxrzJ3UtUsr05d1Gn8c6owRT448pVrumMjxr22s3fPxQYOvTMs4qFsuF4COcF834MoJl\/na1Dd9eSWTy7rbZWXmRNYdMW\/iC9N7dLswI+tgdFQ0uRUOBROEy8CnsIvHWb9+\/eWXXw4srr76algAaMjLlNNRlgcQkB9BIsYyNeYFpgAdKEOZLeAgC4M4uJ5U50P25IBM27hxY5wUyRfQYR4OV6tWLcZSQ7fExMSff\/55yZIlY8aMGTt2LGaKGdasWYMd49BqOLjEIs2bN+\/hhx\/+4IMPsGnUqDNUYknvvfceR6QpUCUqcOlNapde\/XL7NVu9e3MiXLq3SXWrXESWVQLe3Qhd3Kbmc2meUpEPvr6hdo\/Hhwzqn5qZ5jI9bvLUyPBrr+r\/yCX+1vX9Pm9JJJGlax5dz8wJr3PN\/KdemD5s6JAVa1ZYfj+4Id8htol5UjN4xC7O5Ysvvhg3bhzBHxhfUIJ0Q4cOHTRoEChhF7qpG96bN28uW7YsLol0kj7Tpk27\/fbbhURnrPSzq5f58\/UOWngGZc0yrRzD8tlfKBtoL77y2XfqDV3TXdGeCa\/HV79o4pDB\/XNSckzda7n8WniZGwZc8cilua3qW\/6SYBCPlGW4DP9Bb1i9a356+JlXhg2+MnHzrvLlyx1I3o8r2bVrFzkUAY\/9gU3YFpIsjBKp0G7n24t27NiBK4FTcAELExUVhYXBGeFi6EnwMxz7gw8iKcPs4JhI3GAEu4h6jJLyX\/v372dmwHfWWWfhv6gEN9QwvE2bNqR+pIfx8fFMm5SUxJax+CzWhqvauHEjNVgkGDR69OhZs2ZdfPHFQqIzUPo5teKWzbxAyzuomW7nNVvne6xLwk09+4Muhn2+paImPr+ycpeHBg4elJmWYRp5pG1uT+yNA\/o9OdRo3EjTcktkdoYpcvvzvKVq9vv2vscn9+\/X2\/K609LTq1evtnfvXpWXbdq0iSCPjY1NSEjAFikYsUtsg4nly5dTUDeh6U8N9IEOQGfr1q3qq87wLPSPjIzcsGEDnMK\/MC3GCioxFoqBOagH3ZihRo0aFBo0aAD+QA9ABHAMBEzMSQcmh2LJyckAi+NmZGSwVLXChx56aOrUqfDokksu4aDqFJWERGeC9AhNmzy6lZGXG106Ni072\/T7Dc0sGSjiHHVT90dFRE7\/bu2Ie54bMmx4aloKtYZuRYZHX9Kta6taWY2rhHlLZHamHgefK3b8W0teeWPGlQP7JW5ODHc+k0EkE7dxcXEAJT09vX79+kQ+8QxEqMGMYIW2bNlSqVIl+uBl9jjfG41LYlosTKbzxfi1a9eGX+p91aCEGrwMOFPfBAKJwBCzkVgxvJrzHSAkg8xGYgjRmjZtqr4bH\/sDyJgfSIEhjsiWFSrPpTAHucDQxIkThURnrPR77rk7L9Ov6dbHn358frsLysTF+k1\/SSCR\/RK1fctad5m6FeG65rqhzRqdlZ3ns1891PPcYRFvvzV99doNHpMugSElTeFhEVsSNnz3w\/cz\/m\/G+ed13bVje936dXA9+BQSHLfbTQESEe2USaYIeJWI4ZWI9oYNG0IBjAlQwO\/AKcULuKPeTARrAkdyYAQ44BfzqA\/KU6CGerhGAQDRjSNSD30AItABanBEoQcacqA1a9aQxOGDOBxooz8FVjtnzpw777xTsrMzVvaLF6rUr\/8VLz0\/tVqNill5ma4S8DOwWD+\/\/Yu3ltu+W2RwdeblZViGi5zE0nx+wywdU97t9miGt2S+v8rS\/RGeqM+\/+fryi\/vO+O87\/foNSoxP0N1WZKSdBAEdXAzIIP6TkpIUlciPuJygD7gBQPgaBSCsDR0IdWiibgwhEMZYHFCnTp04HEz5+eefGcJwXBX2h8kTExOhFekYh6AzZYU8tkyl3uJImgaAOIp6MY5Urnv37iyA\/qwHDwW2+OMuWrQIEskd6zNWuuX3W4a5eNHvt912+9BhQy+5pG\/pmNL8zQPtxVfwxQS4gEbzapYbb2TpDnSsMNp0zW\/fL7Pf7Gl\/hVNgTEkSV0Zs6bJffPHd4CH9X31t6sBBVyVu2hhdKlbX7S8AIV0CFhgT4p8Eii1kYYvZ2et8bxEz4J4ARK1atZKTk2EHHAEoGCVQAjuwP0wCJvA79AdkX3\/9dc+ePSmAJyopQBMKUA92lCtXDtBguGCNslQcHdCAMJrgFzVgjmXQh2nVcJUtovfff1+9dibZ2Zkpw35vo2lcf\/31f\/yx9O677lq1clVUdJR9H7e4\/7N\/6C2AHvvL4XQeBdOlW3giP2U7c7MZhDd07mqXvH+Wrr67yv46MV0z3YZeuUp1r9d+6apixYogANcDESpUqED80wdeKMTgR4AU6AEQ4ACUIKBADf3ZsotbqVOnDgigP50hET4L77N8+fLt27eruz8kZYopNFGgEifFUTgihR9++AHKME+lSpUgFJhjGQALgSTABP7ULw6BIcVE54IXnaEizGzxl1YFrpJgviYSKRHYUVF2pgNloAkMghdkUhCBVkiBT8EZxcXF4XoQZbwJfGEIrZQBCigBTEAB+jADGMJbMUnt2rW5\/BjFLtQg7YIatOJc9uzZwxZU0cQorkxmo5VC165d1U+hsZLffvttw4YNmzZtYj1YMLYchSNilzgQItGDa+pcRGemAiTiWUUVRKIjxfMTAb969WrinMBWqRmCUEABmhDnwGLjxo34oHPOOQcA4VaUf9m2bRv5GvXwiMustPP1IFikzZs3kxCRYSUkJKxZs4Y5W7RogS2iJ5Vsd+7cuWTJEvowG\/PDJqbC6cAmWIP34YhYocaNG3fr1o2BrA1O0XnlypV\/\/vknh2bCs88+m2Pt379fGTckT7RnpoREor8X0YuIfzAER2AQrmft2rWUIQJMgQigh1ZAQOTjX7A2oAcPhW3BRuFuoAk+Be8DTcAEPSEOJojZgA5ZGwcCJeRWWCdqaGrZsiXzk3+RytGNGnhEYcuWLWCIJXEscjTKMJGeLIMazFf9+vXpQ5mjwD7Wg2tT5yI6M2WTSF1nal8kOlLQpG7duueeey7WAy7AC8KbMsgg1KtXr04rKGnbti1EoAOOhgLUqFixYtOmTTEmoIRJ6F+5cmVaMVnwgvSNzniodu3a0R9UATj1pAiPGNWmTRsSK2amkrGQCIRRYNRZZ51Vr149ajBNjOJYjGJymtiCMGDEUVROR2esk3Mq8qR7hsp+FZ9nEv5yeG\/2Z8+e3b17d55eVLOoJAtYfPHFF0OGDGnfvj1hjwMitqlXd2q4SCjQB+sBLLAq4EnlRzCFJgr79u2jEnNENxDAlQZilGMipyNrox4zpeakP9MyG1tll6jEiGF5ODSsYQb8FKBhIK2qv7qzSROGiwIrIX1jWgaSlGVmZsI41kACuG7dOnnt7IyVTSK0dOnSm2++ecSIEX369OE5hysm0C4qwSKev\/zyy8GDBwf2i77k\/URnrA6\/s5E\/w6RJk2qE\/KKmqIQL08HFUJzusIAbLBhWK7DvSEh0JugwiS666KJHHnmE5B+DrWpEInIf0pzATtGXetku3xOtkOhMkJBIVNIlJDoTZN\/zCxQdSV4mEokKXoH3EyG38yFG9UpEoEokEokKRAYmCPQsXbo0KSlp\/vz5Bw4c8Mj74kUiUcEq8M7GkSNHAqM77rhj5cqVkfavMIpEIlHByTZEpmm2b98eErGPLeratWvwQzoiUfEW1z9PvTNnzoyNjb3kkksCtaICV4BEHTp0+P3339k\/77zzKleuLC+fiUqOPB5PQkLC008\/3atXr0CVqMCVn0SPPfZYgwYN5BU0UcmR+kxJt27dSsuvMxaebBL5\/f527dotW7aM\/eXLl7ds2VK1iUQiUcEo8Cp+lPNL5zwzZGdnqxqRSCQqMOnqMzjx8fEZGRkkZQ0bNlSfjRaJRKICU4BEcmNIJBIVouz7RIGiSCQSFZIOf9pDJBKJCktCIpFIVPgKfNpD7ShJviYSiQpYgXc2Pv\/88wkJCbqu33PPPXXr1g00ikQiUYEo8M7Gpk2bbtiwgf0ffvihc+fOqk0kEokKRoH7RMH3ubudn50SiUSigpRNIvUVRWpf3lgkEokKXvLamUgkKnwFSJSbm6sK6i3XIpFIVJAKkKhGjRrVHBWnn5QRiURFRfYdIpSXl4cbogCJ1C8Oi0QiUYFJPgErEokKX\/k\/AcuuUEkkEhWw8pNIJBKJCl7yKr5IJCp8CYlEIlHhK\/Da2WuvvbZ9+3Zd10eNGlWrVq1Ao0gkEhWIbBKZptm4ceONGzeyv2DBgi5duqg2kUgkKhjZ2RkwKlOmjNqXH8UXiUQFL5tEoS\/by0v4IpGo4BW4Y40tUgWRSCQqeMlrZyKRqPAlJBKJRIUveY+1SCQqfIknEolEhS8hkUgkKnwJiUQiUeFLSCQSiQpfQiKRSFT4EhKJRKLCl5BIJBIVvoREIpGosKVp\/w9qXtaOXlvmaAAAAABJRU5ErkJggg==\"><\/figure>",
          "label": "Content",
          "refreshOnChange": false,
          "tableView": false,
          "key": "content5",
          "conditional": {
            "show": true,
            "when": "QB1",
            "eq": "true"
          },
          "type": "content",
          "input": false
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
            "input": false
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
            "key": "b1_input",
            "conditional": {
              "show": true,
              "when": "QB1",
              "eq": "true"
            },
            "type": "number",
            "input": true
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
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "b1UnitQuantities",
            "conditional": {
              "show": 0,
              "when": 0
            },
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
          }, {
            "label": "B1 total price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "redrawOn": 0,
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 =data;\r\ntotal_b1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.b1_input;\r\ntotal_b1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.b1_input;\r\ntotal_b1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.b1_input;\r\ntotal_b1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.b1_input;\r\ntotal_b1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.b1_input;\r\ntotal_b1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.b1_input;\r\ntotal_b1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.b1_input;\r\ntotal_b1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.b1_input;\r\ntotal_b1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.b1_input;\r\ntotal_b1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.b1_input;\r\ntotal_b1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.b1_input;\r\ntotal_b1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.b1_input;\r\ntotal_b1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.b1_input;\r\ntotal_b1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.b1_input;\r\ntotal_b1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.b1_input;\r\ntotal_b1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.b1_input;\r\ntotal_b1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.b1_input;\r\ntotal_b1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.b1_input;\r\ntotal_b1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.b1_input;\r\ntotal_b1_semenSak_price = v1.semenSak_price * v2.semenSak * data.b1_input;\r\ntotal_b1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.b1_input;\r\ntotal_b1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.b1_input;\r\ntotal_b1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.b1_input;\r\ntotal_b1_price = total_b1_bataMerahPcs_price + total_b1_batuKaliM3_price + total_b1_bautJLPcs_price + total_b1_besiPolos8MmX12MPcs_price + total_b1_besiUlir10MmX12MPcs_price + total_b1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_b1_kawatBetonKg_price + total_b1_kayuKelasIi57CmX4MPcs_price + total_b1_kayuKelasIi612CmX4MPcs_price + total_b1_kepalaTukangOh_price + total_b1_kerikilM3_price + total_b1_lemKayuKg_price + total_b1_mandorOh_price + total_b1_minyakBekistingLtr_price + total_b1_paku57CmKg_price + total_b1_pakuPayungKg_price + total_b1_papan325CmPcs_price + total_b1_pasirM3_price + total_b1_pekerjaOh_price + total_b1_semenSak_price + total_b1_sengBjlsPcs_price + total_b1_tripleks9MmPcs_price + total_b1_tukangOh_price;\r\n\r\nif (isNaN(total_b1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_b1_price;\r\n  }",
            "validate": {
              "min": 0
            },
            "key": "b1TotalPrice",
            "conditional": {
              "show": true,
              "when": "QB1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QB2: Tidak ada tiang beton pada di pertemuan dinding",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
          "key": "QB2",
          "type": "checkbox",
          "input": true
        }, {
          "html": "<figure class=\"image\"><img src=\"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAAdUAAAFXCAIAAAB7o0NzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAH4KSURBVHhe7Z0HYBTV3kdnZlt6QoAk9N5RikgRxY5d8amIAlYUO+izYQEr9oLPrjzsoFj5sAPiQ5QiSu8dQkIKJKRnd2e+M3OXNdJDW0z+5+WNd+7cuTO7zJ75TdlZ3bIsTahyhP9ZdV1Xhd2hWu7cjPodKneugYqV4XJ6enqn9u2ivaaHMdM0NcOk4KyRzlBncZbBFMtQc+pa0GlgMNWyN0mDIdMMRjVT02hr2XNaWtCgWtdNVpombks3XXYzM2DPblG0XwqTNL2cZTKrplNlL1bX3E4DU7eKg8G0Bk3\/+HMOPbNuTDZYhb3BaqnCzm9CRVSzPbcRBIX4tyoTFuIe2Jc2e2CXs29Mz77t0pM+fewYw19gIsCSUjNQGjS8muXRjFIj6HZ7XWaULV9Eq1nBoOE2zYBVXGwhSVuftp\/dpt+I9uquKGxr2m0xpx4sLzEDflP3aXqZO6gHEa3L8ETFaVrQkSsLdwWsgFVaFNTcLrxs21W3u\/LFG246DxiGtnGz77Y3Mz6dNI2ys\/58BBxL7w31YRG3CgcL8W+VRZnxu++++\/zzzz0ej6okjCYnJ48YMcLr9aoaKC4upqawsNBASA6BQOCyyy476aST1Kjihx9++Oyzz9xutxqlqzp16gwfPlyNhrnjjjs2bc6ePeX\/Lu6SWGoFijRr0Mn1u3fwaNjV8gQ921ye5Bl\/5L3zyyav7VndsKwSS29eM\/qOvo11rVgzPaZRTiDVPbGvf7V+7triGMMq1w2XpvmDgRt7NziqrREsd7lQrRXQorxL1\/pf\/L\/0KE0n7rqsYJmptagfPfSixnpZQDP9djzG0Ibv9c\/Wzc0sMNy6R9OLi9zfLi6ZNO2X1s1ahlbaYd26dU888YTLxaLsdw9q1qz52GOPqalhaENL1Qx4r3r37n3RRRepUcWsWbNGjx4dfq+AMm8yb35oXBDEv1UY\/IhP8eOjjz4aqnKIj4\/PzMyMiYkJjWtaTk5OamqqfZ6gAs8+++y\/\/\/1vVUbQzz\/\/\/EcffbRkyRJVo8CfN9xwQ8U8WFBQ8P7774dGtvPGTV2uvzimvKDUZXqCrnJvbNJr4zbd9Nai0GSH1qnJv799ks\/YhFSxn2Fprpj6p90+e\/Ki9aqB4oM7O\/c\/M6G02O+xT0Fo7piY76YXnfXwb6HJDp2apPz6RndPyRa2bRP76gHdl9rrxlnT12SEWjiceurJrVu2sdQJEUe4K1eu\/PHHH9XUMFdddVX4vapfv\/4999zTpk2b5cuXqxrFjTfe+Oqrr4ZGHJDvoEGDQiPbWbNmTePGjUMjgrCPh13CP47wbnXn\/Ss1O1fuIF+oWJOdnT1p0qSoqKjQ+HbIgLVq1cLdtR3q1au3y3xn6kGSr6URBnVX0KvpAUu3LVsRXbNcpuEK2CeHDcvlUmu403rquklAdtOfZtlnNiw\/sTg0bTtu0\/IG6YT1Z89gubQyi8Rsn0f+GwkJyY0aN6ldO612bXv9mzRpkpCQEJpWAV5g3bp1U1JSeGlYlaOEnc8\/VHyv1Hu78zsMu6wUqjOSf6ss\/Mtiii+++OLjjz8OVTlwTE2Y9fl8oXEntA4dOrSoqCg07kDuO+OMM5RrVq1aNWrUqI4dO06YMEFNBfpPS0t74YUXOLJWAvJ6vRkZGaTm7JycFfN+P6F9PS0YKNWsm89JPrljjH0G2ArQoRWjT55d8NZ3RR7neplluco1q21t7wNXNHKbeabm0ZCs7td8Sc+Py\/x1TbFPN71Oki3VjLsuSOraOkorCyBfuvN4A\/NX6Y99kkuvHrZkSy\/Ttc51o+\/tX18L5jMa1LG+P+CtOfKD9AUbi33oWNcLyrQZK3I\/Gv\/pySefXFrqZ39AS\/Yu06dPf+aZZ9SrU9SoUePpp5\/GvMFgsLS09JJLLvnwww9ffPFFknKohcM555wzcODA0IjzzkybNm2HROzxeHjbEX1oXBDEv1UY9S+7c1jbAaXp0MhuwL\/Dhw9\/+eWXORKvmPUob9u2LTTidIWLa9WqvWDh4odvuvTzkd20wFa7vnSr319m6Bzr64bpMZEg9o\/yheKp5daMgGaWlBYVu+zQam+VumVYluGJ9mnueKcZ+rVX0l+WZZUHDc1t3xdBM9M03PFGVJJm+O37K0jEZO1gaVlhiemyPKaJow2TmOzzxEVrutvuxK1l5uqDXsx845Ov3FrQtC\/hBdUHgf1HbGysvQLb4QWyc2JI0i8rK2OfNG7cOLJwaPKu2Me3XRBAzj9UWVDAvlhgH9tASUlJ3t+pKF+gDTkxLz9vW0GR6S8PFGRoBRnBggzL77e3NPukrm4atjeD\/hKzINfclhssyDILNwW3bQ4UFbg0ExeyNnjV6c00S4vMwkyTTgo3Bwsy+dPKaePCcqFmutsMltCDWZAVLMwyabMtm64M3XTbHkT39hau6+XBoq12m4LN2rbNZQVbAlBebudvPchaqZX3+\/2hF7YdXuC+7J8qYr9TIl9h3xD\/CocE5GeL1rnBFsFhStTEn0VAJGvaU13OJNWAFGznY2dW1dLGvnE41CD0hzFD0yo2s88Kh7tik7bb2NfV\/mrEEnVTD021CN1OZWhiqBtBONyIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwVBECKD+FcQDjmWZYVKh4zDsIiDwj9lPQ8P4l9BOOQgHdi0aVNubq4qQ3iSKuwHdFhSUqJ603U9VLt9caGRg0RBQUGotF+wPqZphkaE7Yh\/BeGQYxhGeXl5p06dBg0ahCgV8+bNy8zMpBBqVEkyMjJat249bNgw1VsgEJgzZ05OTo7S3H53u0uWLFnCyo8fPz40vl\/wJjA8uCv2T0f8KwiHA5fLtW3btqKiIjU6c+bMjh07nnTSSXhT1VSWyZMnk0mxsBodM2ZMly5dLrjgAqW5g8tbb721atWq9evXh8Yrj9IuHi8tLVU1Aoh\/BeFwsGbNGr\/fHxUVpUaxZHx8fOPGjdVo+IxBeKhwJu4aemPo8\/nUqNvtTkhISEtLYy4lO9VDGNVs\/yC8M6xduzbDSvWmWqoheb9r1673339\/uEYQ\/wrC4WDRokXBYBBLqtFjjz0WI3\/99dfkYmSEMSFsq4qju0Pl3Dp16jCk5dVXX7169erx48dTVjPSg93OKYTL+4eaPSkpSZUr1Rsro9rn5uYWFhb+9NNPlCvVQxVG\/CsIhwN1WlaZUVGzZk3kGxpxcMxmo0b35UxCt27dGKpu6ZBZwrNDxd4OHOXfyhJeAVaP4f51UlUR\/wrCoWLixImjHSZMmKBqUlNTVWHLli3\/\/e9\/c3JyKGOojz766Jhjjvntt98YHTlyZOfOnfv06ZOXl+e0\/YtPP\/1Udfjtt9+qMw+1atViSA+ZmZljxowpLi62javr\/\/nPf4477rjNmzcHAoEHHniAzq+55pr8\/Hynm7\/4888\/VYczZswIVe0K5ffo6OgpU6bccccdZ5999ttvv52dna2mVoSXoDoEGrAmZWVld95550UXXTRu3DgaZGVl3XTTTazPc889p05rKKZNm6bmevfddw\/wXot\/EHs5xhEE4MB2+PDhTz\/9NHltr3cR+aKiFi1e8ewdA8YPb+EJ5AXsnbzBPLp2RGxpbpe2Ntd3w5sFb4z7PNrrC5p++\/B4b6tGrsQjV111FRJJSUkJ1e6e0tLSSy+9NKxdOProo+fPn\/\/xxx\/37duX0SeffHLYsGGPP\/74fffdx+i1116Ljj\/55JP\/\/e9\/L7\/8sjOHdtZZZ3355Zcej4cVxKR0+PPPP6tJ0LVr11mzZk2dOvXEE09klH6eeOIJerjkkksYpZKu3nvvPZQdXo2hQ4c+\/\/zz9EaZf9PrrrsOn6pJcOuttz766KMJCQmqQUWGDBmC0OmTxYWqNK1jx44\/\/PBD7dq11RkG9ij33nvvW2+9FZqsaQ0aNGA\/wTAxMVHV2O\/0duGwLbH7UXH45ptvfvXVV1U9tGzZUu2QQuNVF8m\/gnDwQShYD0ORST\/44IPTTjsN+VIfNlFJSQnDwsJCNdqpUyeG999\/P\/I95ZRT3nnnHZLypEmTSIg4i+HAgQORL8GT3ujzqKOOQr7MEtYZuweGpGA1qg72Sb6sBkYmV7Jodh7qqt3GjRt79eqFfLFtjx49SMoxMTEY9sEHH9xZvsDuhwUh3\/bt22PYDz\/88F\/\/+tfcuXP79+\/P\/ljNwi6ESeyc6IeV7Nat24YNG2bPns0i2BNQQ+ylZYsWLSgDgVe9G8gd+datW\/eFF16gnv3K8uXLf\/31V2fJVRzxryAcZNAHAu3ZsycH40RmJPXjjz+ec845TArfbabO\/JJt1ai6LrdixYouXbqQea+88srevXvjShxHPamWHgYPHvz111\/TG32iJ0TGpB10iR9VQdWvX7++T58+zH7NNdccf\/zxeXl5yr8czaSnp1988cXsFehq+vTp6uTA7lAHPRgWnw4aNOjyyy\/\/7LPPzj\/\/fNZKiZIVY7Vx6E8\/\/XTLLbewks2bN6de7QZOOOEEakaNGoVwk5OTKQPeZyU\/\/\/zzl156qUmTJjNmzCCeU08DZuFwgWGVR\/wrCAeZ999\/H2E99NBD4bvNAHmFSg7KaG3atFGjS5YsYUjM\/O9\/\/xsfH68qYe3atQw5imf46KOPMlSBNy4uDtlRCBtc1Sspg4rD+A67qRpkV1pamp+fX1BQ8O677zI7w0aNGqmp6sZkFcN3Rq3tfffdV\/EVIWKGH3\/8McO3336bIYZt27atPU3TiouLGTZr1kyNAmvI7GoHEOa1115jSO5u0KCBqlEz7vdt0f8sxL+CcJDZvHkzw86dO6tRRfhEgUIZLdxGzUKiPOqoo1SNaq8usmFhArIqhwOvMlT4DoqsrCxVUKjZ+\/XrF\/aaAgOSdln6RRddFBMTQ41q+f333zPcnfWU5dU5kzBdu3ZlrVg36knBKSkpKuOrDumKuerVq+e0tWE0Ojq64jU3VmPjxo1k5PPOOy9UtVOir9qIfwXhIKNOJuzgESXcHQi3CQaDDC+99FI1Gkbpdc2aNchrB4OrecM6U\/7doc25554bKm2HDhcuXEgBFaoaRV5eHul7d5e8vF5vqFQBda8FK0Z2ZulE8orpGJikFB+GpdNYvVighy1bttSvX1\/dxaHY4SVUbcS\/gnCQUYfYq1evVqOKHXyn7InydjkaRp0WaN26NZ5VWg\/rSTkx7LLY2FiGYaGje8rqXKpCzc5aqXOy4RlptmTJkm+\/\/TY+Pr5ly5aqcgdU56qHMGReXikpmKnIV53xALUOqLa0tHTFihWqUsELLHRQo\/g6ISEhPz8\/vDLQsWNHhmrHU+VdLP4VhIPMCSecwHDEiBFqFAoKCj788EMKREJVowjf4atEUzFmqhrlss6dO2OooUOHhmtWrVq1bNkyCmHU6eAw2LBGjRrIMTS+PYBzvH\/WWWdR+Prrr3NzcylkZGRcf\/31tGfpuzv\/QFcMFy1apEZhw4YNDz\/8MAUiNruWLl26bNq0afbs2WoqoHKWuHjxYsphjWJVXnL4NmSEnpSUtHbt2mnTpqkaUGeQ1S3A4l9BECrHJZdc0q1bNwR30kknTZw48ZNPPjn22GPHjh3LJHWdDZQN161bp0aVaFSEVOVTTjmFobr+NnjwYOT49ttvX3jhhT\/\/\/POrr75Kz+np6UwKn9ZQ4TQ8StIkO2NJNQrKoeTotLQ0pLl06VLWilVFnQsXLmSFw7F0Z7Zs2cLwiiuuGDBgAC+EXQsrQLYdNmyYuuPi9NNPZ7Vvu+22H374YerUqc8+++zrr79O\/eTJk+35t4N\/iczbtm0LjWvamWeeyfCGG274\/vvveWnPPPPMXXfdRc1XX33FkFdRtRUs\/hWEgwx5EEkRWhHKeeedd+mll5JVe\/bsyaRJkyaF2\/h8vnBoDXszjLqTQX3hgvJHH32Umpr65ZdfIr6bb76ZGKvunQg\/TgxB06E6bAc6xOYqIyuFqYtjyvio\/MQTT1yzZs2nn35Kbn3xxRdxsXqUMFN3Rl36Q+ik+Msvv\/yRRx5ZvXo10hw5cqRqMGTIEHYYM2fOPOOMM04++WQcqr528e6779K\/yuyQk5MTGxurnlmhQNnsAFhPRMxLu\/vuu5OTk6OiolhQ+F7mKox8\/03YO\/L9N4IYOtv3778BZnznnXdIqXTfoUOHf\/3rX88\/\/3yvXr0wHR86wiZH4vXq1VMR748\/\/vj222+RUUJCAqPMQvIlnN5zzz0XX3yx6pCaDz74QF1ww57du3cnCGNDdY8BvXHMjtCVgsmhc+bMQYvhK2DLly8nwKJaZmQ0GAx+8cUXCxYs6N27d48ePZo2bYoccSUroNpXZPPmzTRmod999506Z0JePvvss9VUBSv25ptvqsuArVu3vuiii8j+bDPsMxCuelE33XQT60M6VrMoiouLx4wZw4y0wdr9+vXjTeat4wAiKSlJzRhqWuUQ\/wp7R\/y7H\/7dHeoTF3bKzqP26jhD3uqKB+DhNpVCdbVDWfWsKiE3N7dWrVoXXHABkmV0\/xa0B\/b7JVRc+SqJnH8QhEMC7tgdoRYVUPVoURVUTViROIjR8NRwQaHa7ICaRMvQuEPYZRXlCyRNho0aNdqd7FRXDEPju0E1Uy0VqjI8VRX2gDOTzQ7lqor4Vzj48Inhg+zSCC+WrumGFeRAi\/xrRPrPzuC6aei2lewRPWjpxl7D7\/6hXMZQEa7BfaqgcCaGRpm0w1QFDlKTKDNVtVGoBjujJu3QRrksOzv7\/fffX7NmDYWcnBzkq54BpE50VGwfhkq19D2jmu2weqHSPvcAFNSqqq6cKVUT8a9w0LH49Lg03RUTq8V63dFRepTP44t1RccYUdGR\/XNFRdtXvrwxbj7dppt9g0paar0POhXdocq7swn1FSdVHN2hrAphdq4J48y3i6nI94orrmjatGlKSkrt2rXPPffc9PT0ESNGqNvm9sAelnVwUWsOofGqi5z\/FfZO5c7\/+nwr16y95KxTOzWKs1z2NxE8QTYyI2hEfkuz07iuFRXqOVby15MmeXWz3HQ5n\/K9rBtB7GCd\/40gfNiRGrYdOXJk+NYIt9t95ZVXXn755Yzyj7svKVU4WIh\/hb1TKf9yxFjuDyxdurSoqMTS3KadZtjGnLnwX0Rxlm95LSO+dmLL5o3dphnU1Bci9vaiqop\/YXeGDaugOgTPIwTxr7B3KuVf4APsi41m43KblmG6g3yeDX\/E5bsdXoO7TC8vLSkyTGP7SlWL\/CscaYh\/hb1Taf9aJF7UhtxMHQM7\/3EdKVuafVHQ5H+2c0mCloaC97Zq4l\/hUCDneoSDD7HSMgKGFjB1PUjI1NS5XwPxRfqPDV4PutRTDlgpR8FHyH5BqH6If4WDD5qzrWt\/5QLp+TXN7zZd9qGWfePXLv4q1qsyw\/BfxdF9Ke\/uT2NIM0s3LNMT1F1BN3sHyyi3w\/oRRsWj0vz8\/ED1eBh5NUT8Kxx8OKA33Ibh0jy64dWiDJfXcmuGixp3BP90hm4X\/6WsecjkWNv+Zh67CLXaEQftKvOqK2Br164dOXJk165dw49JE6oY4l\/hUBD0B8qKywLFfn9ZWaC0NFjkL6VcUuYvLt\/FX8V6VWYY\/qs4ui\/lvf0FykqDfhPvBnTTrVveI8e\/aFeZd+HChbfddlunTp3uv\/\/+zMxM9fgboeoh19+EvVOp629en3dTevo1Awe67JsL2MHbV+GcKUeI5owyM5iaVv+dd97RdcvvrJpzLW5PHLbrb9OmTRs1atS3336rfgYNzj\/\/\/C+\/\/FJ5WahiiH+FvVMp\/\/qifIsWrXxg8EVv3dPSW7YtqHmJw5rm2vtNBocFt8tck+cb\/v6W9ydMjvJZlunXTNdeE\/BB969zpuGvW3F5Vz\/99NO33nor\/IDKMARhjBwaEaoW4l9h71Tev6ufv6v\/Fw831wJb7QcsaAEtGKXpWPgI2Njc1qbcmOte2fba2K+jfYFyLaCHvgK3Jw5d\/s3Pz3\/vvfc++OCDWbNmqRqibsVP5fXXX\/\/GG2+ERoSqhZz\/FQ42qEO3v3Fc7tfNgFnu1wLlhj8Y9AesAOVd\/gV2KjMM\/1Uc3Zfy7v6cNppfL\/e77H2IHrC\/jWx6KKkVP5wEAoFFixaxS+vcuTMJV8kXy+8gX2jevHmoJFQ5xL\/CwcY+U2kbxLabZbhM3bDcHGjZJ1mPgD\/7kE8LmhpDP+tk10Xi\/rOtW7f27dv3nnvu4diCUXV6l2OLnY9H1Q8RCVUS8a9wKLCfGm7Zl910595bS1nOtt8u\/ypOUmWG4b+Ko\/tS3t2f08ZeE82krOawbxx21vgwU7t27QkTJqjf+t0zcuWtCiP+FYQIwO6pWbNmU6dOvfLKK9Xo7jwbvkYnVD3kn1YQIkZiYuI777zzyCOPUN75zAO0adMGTYdGhCqH+FcQIkDFtPvggw+OGzcu\/EOZFUlNTY2Pjw+NCFUO8a8gRBIVe5OTkwP2zRk7UlJSEioJVRHxryBEEoLwTz\/91Lt375SUlF9\/\/fWiiy4KTXBo2rRpqCRURcS\/ghABiL0q+f7xxx\/nn39+bGzsuHHjevTo8eGHHw4ZMkS1AbzMULUUqh7iX0GIDCTfZcuWnX766UVFRZ9++mnPnj2p9Pl8L7744nPPPadOB8vNZ1Ub8a8gRADEumnTpjPOOCMvL+\/zzz8\/88wzqQyH4jvuuOO7775LSEjY5Ulhocog\/hWECLBx48bTTjsNBX\/zzTd9+vRR5lVpVyn4hBNOmDlzJunYaS5UTcS\/gnC4+eWXX4477rglS5YQconA1GBeJd9wAVq3bt2wYUNVqWqEKob4VxAOKzNmzDj11FM3bNjw1VdfybMdqjniX0E4fEyZMuXMM890u93jxo07\/\/zz1akGodoi\/hWEQ4VzUvcvw77xxhskX5\/P98svv1x66aXUyImFao74VxAOFWH5Unj++edvuOGGtLS077\/\/vlOnTqpeqOaIfwXhkIBznWtpummaV1999b\/\/\/W\/C7x9\/\/NGxY8eKoViozoh\/BeGQoOS7YcOGXr16vfvuuxdffPEXX3xRp06d0GRBEP8KwkEnHG9\/\/PHHE044Yfr06Q8++OD48ePDTzLDy6ogVHPEv4JwkFF6ffnll3v37r1x40Zi7x6e8CtUZ8S\/wj8F+\/fbGIbGjmCys7OvuuqqW2+9tX379jNnzuzTpw+V6nSwaiAICvGvcERh2D\/RppuGqblMzdSsoP0DmZbba7jjolxx8e6YKLdBhaVZhmb\/rCc+Rmymbtm\/NRfq4zASjrQVzzkcf\/zx77777nXXXTd58uRjjjlGTRX5Cjsj\/hWOKBAVSkXAtnb587ktT0LC6s2uTyYHP5gSnPirWRBIcCV6XEZ5QLeCmuY2DUfBLt3+ceMIoMyLXjdu3HjHHXf07t17xYoVbzqkpKSoNiJfYZeIf4UjCNxr2b+d7DJ1zW+YPp93a0nNO1\/aeNztMy994ueBIyed99DUE+6c8873ph5bw3D5sZ+dhTW3E36JwIcbxApFRUUvvfRS+\/btX3jhBcLv\/PnzCb+hFoKwe8S\/wpEFedalmW7T8hjegrKk\/o\/Pe+6LhZvzSmzBOlvrvNXZVz817eUv870x8V4z6HdbyFrXygnNTgeHlczMzJdffrlt27ZDhgyJiYkh806bNg0Rh09HCMIeEP8KRxCWZgUNv4VO9YARE\/PAayu+\/XO9ZuhspoalayYF7Gwfy9\/+8qypM0r1GJ9leYihxGDVwyFCncCFxMRENYpnr7\/++ubNm996660lJSWPPPLIwoULw7GXlqogCHtA\/CscUehB3Vaw4XUtXRsYPWWVXYWVbZuhZVuypubCyAEt+MJXG0wryWviXsOyvLa1Dx5KoIZhREVFxcbGpqamEm9dLtfEiROHDRvWsmXLXr16vfXWW02aNHnnnXcWL1784IMPJicnS+wVKoX4Vzii0F2W4Qlqmi\/+q+mZReVluqHrWM0yyL4Y0XRufbDPEmv6D79vXJNZoCXqHi3g0iwmG5jYvgznXMPby18IJ9SGQK+oNt6BnFuzZk0q165dO3369Hvuueeaa675+eefL7744ieffDI\/P\/\/2229n9I8\/\/rjyyitr1aoV6k4QKoP4VziCwIv40zANzeXenK9Cr0uFX+c6m52AdY2ITAa2ys3Ajwu0zFyXEeUzvPGGO8HwJBi+OFdcjCshxp0Qa\/\/F7\/inJcRExyV43K6k5KT4pITY6OhYr5eQGx0dHQwGZ8+ejVV\/+umnO++88\/LLLz\/77LM7d+7M8JlnnpkwYQIR+IEHHvjuu+\/S09Off\/55IrDH47HXezv4OlQShH3AzhahoiDshtWrVw8fPvzpp58mIZrmXi5z+aKiFi1e8ewdA8YPb+EJ5AXsnbzh3J279y2NFoadcQ2jRvId\/1n7wmcLXIYRpMa+yUy3r7DZMdfEyJjOctYkxas1aFTTbd81wexWjVirdZPk5g1SakR7NdXClrrzP2cJhmFlF3jem7T22tuGpm\/c9MfcuZszNtnLNYytW7eSdp1mIVJSUrp3756amnruuecmJyc\/9thjX331lc\/nC00WhAND\/CvsncPmX9uPGgvwuOMTnhqz7t4PFtpnFSzka1vY8a9u2P3YN6h5deuKMzqYZSWT5qzLLjVd9mlge4M2A2axGQyGOtwTHP15oqNxOfKGdu3adevWjfq4uLgzzzyTYY0aNerXr89LRvcFBQX9+vUbO3YsOlazC8IBIv4V9s5h8y\/RV7dvADZcXvfydFeHm38p9ZfhPufCm32fmd2NPbCw8fldGn416mStJKtwa2mJ6UK+mm4ELauoXNuQXbRsbbAk6LYb\/w3LbWjZRfq4\/6X\/e9h9XY7pEhsbb9gn4ewPQkJCQlJSkt3IskpLS3mlwWDQ7\/dTQzouKyu76qqrxo0bF\/5WhSAcIOJfYe8cxvMP9vffDNPl0oJ6YsKNT615\/ftlyM9l2aeE\/fbVOXubDVpB+vzx0e6ndPWWl5W43SRfl0YT284MLc1jaD4PMXmnZer2meUtruteyB4z8XvdKtfKWKAZdM7bKuGqdjsg\/hUOBXL9TTiCYHMkxpq6UW5oVvG2p25sdXqHBngxaGkB5xKcpQWRLy2fv+7YU3ok+kuLNctllBrBcqPMdJWbViAYCJjlwdKyQH65P7\/Yv21bxb9gfr6Wt7V42xbT7y\/IK0CpZf5gmT9AyIXdyVcQDhHiX+FIwj754LZv6CUIl2sJvqIPHjz6lrNbxEdHWZaJfE3NalU3efRtXYZcWtMq3GafTrB0v+5DzW7Lbz+ZR\/NYls++R5jIbNGPq+KfvcEbyNxDGLefMMHSdJO\/0NIF4fAi\/hWOIOx7z2z5BgzTvgktUFKaEr3tP3e2+N9zx713z7Ef3Xvsx\/ceO\/WFntdckBQs2mra9zLYJyRMI2g\/r8c+12CfTLAtDo5YnVuFK\/zp1DOLy2+fUrY9r2uSeYWIIf4VjihsndoX4dSlNhTsN4Pb8jo28Q\/sHXvZ6bF9T4tNi80NFBQTbVV0paELtdpnfom3QI1zoc6ucf67A\/Ydxcq5dlqmjX1LhSBEAtnyhCMdS9MDZWagwG\/\/FfoDgd2IVRD+aYh\/BUEQIoP4VxAEITKIfwVBECKD+FcQBCEyiH8FQRAig\/hXEAQhMoh\/BUEQIoP4VxAEITKIfwUhAljbCY1HgsguXQDxryBEAPuhxg6h8cNIMBgcM2bMt99+G5GlCxUR\/wpCBCgrKxs+fPijjz661+cpH3Q2b958zTXXfPLJJ6FxIXKIfwXh0PLBBx888cQToZHtbNy4EfmiYGwYqjpcKOMnJCSo0f2mvLx8xIgRU6dODY0LlUf8KwiHlpdeeum+++77448\/QuMODRo0ePrpp4cNG1a7du1Q1SEmfLr5YJ12+P777x955JEXX3wxNC5UHvGvIBxa1G\/KZWVlqVGF1+u96667Ro4c6Xbv\/CN1hwTnbLNt3pKSElVzgJB\/GR4sm1dPxL+CcEgoLS2dNm0asvN4PIxiq+nTp69YsUJNDbMvNyHk5+f\/+OOPmZmZlOmW8g5peh9Ry1LeVGvl9\/tnz55d2R9eys7OXrBgQYsWLSi7XK709PQpU6bso9ZnzZq1cOFCVabAa2Ed1Gg1RPwrCIeERx99tFevXm3btv31118Nwxg0aNDxxx\/P6Pjx45mKUs8999wJEyao\/KjMOHny5NNPP502bdq0Oeecc5jR7kjTXn311d69e\/\/yyy\/r16\/v0qUL5WOPPfajjz6yTyg40Gbz5s1PPfUU9ccccwwN8BqV4akVUUssKir6z3\/+07p1665du7K4Bx54QAnUdKCQl5d36623tmvXjvVp3779ddddV1BQQP2WLVtOOumko48+um\/fvnTFOjP7qaeeevLJJwcCARrA3LlzmdqpU6fOnTsPHTpUVQLz9uzZ88wzz9y6dStLpBNW9ZRTTuHdYOrOq1rlEf8KwiGhYcOGDRo0QIuIDLOQ8hhNS0vzer1MzcnJ+frrr3\/66SfKTEVkn3\/++WmnnTZp0iRmYeo333yDmH777TcaqHMUBNWzzz570aJFjRo1QpHXX389PTMjkKzR7r333vv7778TjZEvXrv\/\/vvVVObdATocPXr0bbfdlpGRwVqRyh9\/\/HE6ZBK7CkC1F1544csvv7xmzZqsrKzly5e\/\/fbbN954Iw1Y27i4uHr16i1btowy1o6NjeXF8tLUsubNm4eO2c1g4T\/\/\/HPUqFF33323civRm87LysquvfZalsiMSUlJ7FfonKnVEPGvIBwSBg8evNKhY8eO2OeDDz5YtWrV6tWrL7jgAqYSABnGxMQwRFtE3f79+6Pmt956a9OmTevWrSOZEicxHQ3Ukf7TTz+NfJ999lnEh4gJsGiaekbPP\/\/89PR04va7777Lgsiq1NPVLk8ssDLA\/oBkqtYQS9avX58Z1f4Ann\/++alTp1500UVr165lKZmZmUTgTz\/9lNWuWbPmzJkz8TL7hqioKHYSpHIM\/uWXX7pcLnYJrAw599JLL\/3ss8\/ef\/99vPzMM8\/wwumWV8osdPjFF1+cccYZCxcu5AiA+lmzZjmLrXaIfwXhUIFP69atS8Ck7PP5PA5q0owZMxgSBhni2QcffLC0tBRPDRo0iJaESgSXkJDQvHlzGoSv3WHMf\/\/73zRo1aoVo0qXzz33HL7r16\/f5MmTr7jiCjz+0EMPUa\/cXRGVT6nHy5dffvkLL7zA6rGS7CFeeeUVJpFVGSJZ3E3KRrgpKSmYfeTIkUuXLq1Tp47aYQAvpHv37sgU4VJWoR5I8ei4U6dOY8eO\/de\/\/jVgwAAVqz\/++GPVAPUzrFGjxptvvskiiO2Mqvdhl1G9amOot+PDDz\/kHx6+\/fZbNUEQhANEfbhSU1MZ7hBFMSZDZZyMjIwpU6ZwJH711Vc7E+3LYuokrLo2xeE\/Q4InmrYnO1\/fYKj6\/+qrrzAyudjtdqsadaL2nHPOIZBS2AF1NgOZqlHFueee26RJE6I0ZRaHc++6667y8vJHHnmkZcuWKB7jjx49mgWp9sA64M1t27apVVXMnj2b4d13381LUytz3nnnMdywYYM9efs633\/\/\/Q0bNqSgLgaqyn8c7P+UNtnZhKoqSSj\/\/vjjj7y5oM43CYJw4Ci9cmivRneHUvNpp50WHx+vasJJUBXUyYqBAwcmJyc71SHQH+7Lzc095ZRT6tWrF7aY+k4E2VaN7oBqtsNdB3QVHR2tciiRliFRDPOOGDGCeoa\/\/PILS3Ha\/gV+z8nJKSwsVKP0TAan0K1bN1UDzZo1YxjeExD2ycsXXXSRGlWEX+8\/iz\/++ENpU13t3A9C\/g0fVnBAoQqCIBwUONYOlXZCqVDZh\/jp1NkkJiY2b96cbFixQceOHZ2JfwN3g7rFOGyx33\/\/naGKlvsIOs7Pz1d7AsIvw6+\/\/pocPXLkyMWLFz\/00ENqETuAVdk3qLgNrK1ah4pDdducWhlqWBA7BvYWjCqoVMv9xxE+Ggj7s7IY6j0SBOEQUatWLYY7KEaJVaGO39WVKAUxqEuXLqWlpeHzxaDu7lIzqlnokwY05qhf1fBxXrZs2WeffUZZSaHigiqyQ9L65JNP0C4Lpdy0aVOGF1544aZNm4YNG5aSkuI0sb3MSrKg8F6BvIxY1ckQYPSkk06isGTJElUD\/\/d\/\/8ewQ4cODGnMOh9\/\/PHh10VXrOf06dO3bdumaqoVofwrCMIhQh16I1M1qlBH+gqiZZ06ddasWfPzzz+rGkzHsS2mW7RokaoB1Y8KTGlpaQyVkY899tiVK1fecMMNK1asQHannXYamZTG6nTBLgMWU6dOnfrnn3\/SAzDXPffcwyoxZGrr1q0J4MTe8A3IMGfOnAscyLOqz7DZKy5CLfSRRx5Zv349DVjKc889FxcXd+mll1KvUrA6zaJ2GKqT7Ozsffz6RhUjtBGEd87qTREE4WCxyy8XKGep5FijRo1rr70WN51zzjmkTiAtYl5mGTduHA2Uu4uKihiqfs444wyG6mr5E088oW5ca9my5fnnn89HmB4Y7u7JEkyik1mzZnXu3Llr167oW92+dtNNNx111FFMQu6PPfYYORqZ9uzZs0+fPiRWojEK7tevX3Jycvi1VHSogsZnnnnmjBkz6Kpbt24nn3xyVlbWk08+qQ4CYmNjGS5fvpxZ1B4oOjqaSeHRfxZhW+73+ZPQa\/b5fByPMAzfRyIIwgGixKSGO9wNdskll1x55ZWIT43ed999gwcPRsFfOnDI\/9RTT\/F5\/OGHH5iKyzhIV\/eiKSqecESRX3zxRe\/evd1ud6dOnb755ht0yUJVOt4Z1oSES5LF10TguXPnMjp69OiXXnop1ELTbrnlltdee43dABH4q6++mj59Ov5944033n\/\/fUQRDryE1latWqkwrl4m68w+4\/TTTy8oKJg9ezY+IQvffPPNTnP7rrWEhARWPtwD\/mVtWdWKIfqfAi+H1ws7nMzZd3QUzivngKWwsJB3kOMOCE0UBIfVq1cPHz786aef5rg1vM\/fHWyMixavePaOAeOHt\/AE8nCAoRnMo2t\/paQI4nZpa3N9N7xZ8Ma4z6O9vqDpt68Z7W3VSGdk1auuugq5hM+H7hWlpLy8vO+++w7fVZRmRWim7EMIRcEsq06dOpiLg3eC1amnnsp7vmnTpvr166sOwe\/3Y0w0V1HKGzZsSE1NZcYrrrgCUa5YsaLi1IoQyfmY85FXd1bUrFlTrVt4TRS85M2bN6uaunXrqhMgYWj8008\/Ed6Rvlqx8LysXkZGhjo9rW7\/CK85L0R97U1VMsuCBQvYDfTv358XXnHpRz7hN5Bd2h6usu6BkH9DY4KwK8S\/++HfsHHCny+lm3C54ijs8DEMT+UNV8fmFWfZoXFFyJJYmFkWL15cu3bt8Cx7RjVjqMoMGd1hxnB9eFSVVT2ER3eYsaJkdpgFwjVqRjVaTbB3OBXfC0EQDgphjyizgBpVOJ75C2pCjbajahgq+Sp2aLzLfeEbb7yxZcuWE088ca\/yZaoahpuFh4rwVEW4wZ6hTWiG7TidhaABNarlDoQb\/INQLzA0Unnsf9p\/3GsWhH8ESigVCU1wqDiqpoYJVxJmx4wZo67ghSepAqBmDoEvvPDCG2+88TmHO+6445ZbbqHNbbfdZnexe9kBPaihKijUKOwwqlCVivComgRqFELjFQhNcAhVbadipSr\/gzjA1f7nXXMUhCqP+lQvWrTohBNOuPbaa\/dweb2oqGjKlCmvv\/76nQ4vvPACsZfRXr16KfMeiB2EQ434VxCOREaMGNGtW7cZM2bUqlVLPbFhZzBsamoqbSZMmPB\/DhTmzZs3ePDgcANlYeHIJPT8HY5ichyKi4vVBEEQDg\/qMxgWJT4l9j7yyCPqht9AILDDdzfCqGzbpk2b884771wHCuEH6zDV+KfdUfDPoqSkJDs7u+ITMCpLKP8+\/PDDrR3efPNNVSMIwmEgrF1EWVZW9uCDDyLfX375RdUw9Pv9SsTCkcaHH37Izg9tPvroo6GqShLaPebl5eU6hB+lIQjC4UF9BnFuz549H3vsMfVlhPBtD+LfIxb+XZQ21QXS\/SD0bxx+HMYOt1gLgnBIQbV8jO+8805i75w5c1QNQ3P7Y27Ev0csYVvu7gT9XpHrb4IQSSZNmtStW7fnnnsuNL7TRTNEXD2fDVYdEP8KQmTYsmXL5Zdffvrppy9atEhl3t0h\/q2qhPwbvn4n9z8IwuGBkNukSRP1bWbKe1Cw+PfIJPzMzAO6\/4F\/+3PPPfc2hxNPPFFNEAThkFKzZs3HH3983rx5N910E6MVzznswH4\/3lA4pHTv3l1pE3+GqipJ6P7fvn37jnLgaGgP24EgCAeXtLS0V155ZerUqXyYGSUF7xyE9xCNhQhywgknKG1efPHFoapKEvIvwzDyjy0Ihw0+cQw57pw+ffozzzyjPoNqknCEw7+U6RAarzxG+BsyFYeCIBw2lHD5JM6aNSs2Nlb9YLtw5IMtD\/AbhqHrbyJfQYgIfOiUfz\/++OPx48ffdNNNEyZMmDRp0mmnnaYaCEc4B8G\/giBEBORLhsrOzr7iiitatGjxwAMPUHnqqaf++OOP77\/\/vvrxCLn+VlUR\/wpCJCE9oddrrrmmvLx81KhRCQkJGFkl4gEDBvz+++8DBw6Ub6VWVUL+\/eGHH55y+O2331SNIAiHFCVZeO+99yZOnHjrrbeeddZZqiZ8SJuamsrUyy67TI0KRxR\/\/PGH0iYHK6GqShK6\/4EjnXsdvvnmGzVBEIRDR1i+JB7M27Vr14cffljV73w+cXc\/3ClElilTpihtfvjhh6GqShLKv\/Hx8aqgfqZfECqSnJxsGKFddXUGM0ZHR4dGDgy6gkAgcMUVV5SUlIwdO1b9gC6VqoFw5JOQkKAKcXFxqlBZQr9\/fNNNN7322msUTj311OOPP54PW2i6IGhaTk7OokWLPvroIxS817sdq+rvH5eXl1944YVPPPFE7dq1D+SWTwUdxsbGPvnkk\/\/973+vu+66oUOH7u4h68KRidvtHjduHNsD5Ztvvvnll19W9ZViR\/927979uOOOk01BqAiyOOqoo\/r06RMMBveagquqf3nhjz76aHZ2Nh+8\/T4UsBdlWS6Xy+v1fvfddxkZGXziOnToUFBQcOBOFw4nUVFR06ZNW716Nf+gB+rfwYMHq1++eOihh0aMGMGuXk0WBIXf78\/Pz2dTCY3vnirpXwXSDAR4QQd0loB51ZMfhg8fzl7thx9+8Pl8fOIOpE\/h8FOjRo3+\/fuPHz+e8o033vjqq6+q+koR8u9tt932yiuvsGO\/++67hw0btt+PcxeECv5t7sW\/lmH71zbckePfqMFvbntzu3\/ZM2jWPrlPKfIARVm7dm2y0pAhQ1JSUr755ptWrVoVFRWRocS\/\/yzw74ABA7788kuOjfDvCy+8EJpQGULfvdm6deuFF144dOjQTp06kavlUEjYb3y+qEVLVjz774HjhzfzBHLMYLRhGUFXAP1GXDBs625vYG127A1vbnvtk89j3V4ziHr9pn6YbrBFvmPGjLn++usTEhK++uqrHj165Obminn\/iSQmJl5++eWXXXbZcccdFxcXpy6fVpbQdTZmjomJadCgAQX5so1wQOiay7LclhbQPQHDhXtNV3HQxWE+h1pWZP8sYrhpGJbmsTSXqVPjN4zgoZcvKYeUlJaW9tlnnyFfr9f74Ycf8rndsmWLyPcfTf369ZU2Q+OV5K\/7HMi8ZWVl6rf\/QlWCsF+Yuh7QLZcVcAfdmuW2fygr6NY1gw3rrz8nDu929JD9kYCDun0+2tJYJc1tmca+nXzYb5Av4YbA+8orr\/Tr1y8pKWncuHG9e\/fOyckJtRD+seDMUGm\/kPvMhP0Bp7hcrtjYWMzCMIwzGhMVHeNye3zxMXqc150Q7UqMc8fFu+Ni\/vYXX7Ec+7fRin+qfuepe66hrP7C5e2TtHhvbILX4zZY02h7jT1xsVH2Sjuvg\/UnnKqTcgcF3qWaNWtu3rz5pptuuvXWWxs2bPj999+feeaZctpBgND5X2CbGD58eOvWrQ\/Q6EJ1AK3k5+enp6eHxiuAv9auT3\/0nlv69Ej2meUBXeOo3z4FrCbr9v921hsqsuzTs7R2JlZoZmvKmcZ\/KszrNFYXzpybutBZaFa7Wk3d3sgehmrcurm5WJu5yvPMf952uU3dZL3+dmsGx5JpaWkHfgnE7XaTeQsLC8ePH\/\/ggw+Sds8777wnn3yySZMmeXl5oUbCPxZ1\/ve222475ZRTQlWV5y\/\/nn322Q899FCrVq3kJ+CEvaIOoq+55prQeBWCF\/Wf\/\/xnv28BYjfg8\/mI0tnZ2Z9\/\/vmbb765cOHCOnXq3HXXXVdddRX7LYwsybcKoPx7xx139OrVK1RVeUL+JfOee+659957b\/v27akJS1kQdknYv2x8LVu2zMrKUt8pwCyBQCA6Oqq0uKywqNjj9cbExjApb2tOQkISM\/r9\/vi4+HXr19WokRwXF4eI2N\/TwHC5ysvL8\/Py0+qklZSUxERHb9iwoW7derqhl5eVG4ZOs6hom\/SN6V6fNyE+3uvzFRdRGZW1Ocvn86I8t9tDzKSz2Ng4Uq\/H7TFc9vfWysrL3S5XdHTMmjVr6DM2npWKnj\/vzxo1auPLpKQEM2iyzfMpwJiXXXbZ66+\/Xln\/8sJ5+awDnaxcufL\/\/u\/\/Ro8ezUuIioq6\/fbbr7\/++rp169Inb05oBuEfjvLvddddd+KJJ3o8Hna6oQmVIeRfzPvCCy\/weWBbwehy\/6+wZ\/Dv2LFjr7322s8+++xf\/\/rXunXrkpOTg8EgukFAfn+5y+Vevnx5nTp169WrZ2lWxqZ007Q4Hi8qKkJVWVnZrVq1pFBQUMB2zEaYnp6OhSlTiX9r1KixZcsWts+tW7euWbP66KM7pKbavxNcWloaDJobN24MBPw1a9akJi0tDfsnJdVAbWVlpYhww\/r1jRs3Nk2TxdHntm3b+Hh4vb5t2\/K3bNnapk3rjMzMd94ZM27c2PIyP5v\/Kaec3K9fP3YkbPZNmjQ544wz3n777X35yWFW1TAMdglut5vXvnbt2p9++mnixIk\/\/PADU1m9AQMGDBo0qEWLFmRe+U5TFYNNdODAgZMnT2a\/e\/XVV6svIleW0PW33Nxctg+2eDZBtipVKQh7QG0nmCUvL4\/NhsNtNiHKbEtr165DRninuLjo11+n\/\/nHH3FxCUiKJIqgp0+fvnTpErLhzJkz0RyaRt\/MSzRev379kiVL6IR6RtetW5uRsQl7omDaMOmrr776888\/MjMzNm7cgGFLS0uYhQZbtrDQNXS1dcuWRo0asT6IHncDZqTDlStXsMPIzs7iA9Oje\/f7ht03f96CpUuXLlu29LXXXjvppJNIHurb1Xve\/hEuTo+Pj+fjR9plHWbMmPH888+zEzrqqKNuu+025Etvr7766uzZs5988kl2P3ysRL5VFTawzZs3O1lhfwj5ly1YFfiQqIIg7AtYMsaB0AoYDf8SPAnIbJd4hy2KVFtSUowQi4tLEFz9+vXbtm3LvFisVq1a5NbMzExSJM6lhvaUsSohl2O6zp07ozBUziZeXFxMSm3YsCHxtl279jRG2lQyO\/bH7DiRWVasWIFwlUn5eJCsqaH+tNNOY8WuuOIKVM7SVXoFCjR+8cUX33vvvfCDAMOoQ0tWiYCvEjcrPGXKlNGjR19yySXHH3987969H3jggR9\/\/JH+ES7anTBhwlVXXUVXrAZHA3SuuhKqKmF\/Vha5\/0w4IAiA6IwUjNpwMcfvdevWjYuLU+eCmYqIs7KyMjIysDOjyIg2KSkphM3S0tI1a9aQIps3b059QUEB2zF6ZV6Uh79q166NzTEvk5gF8dGVyqeojUraUI8WWSIqR\/fEauYCFoeUlYhbtmzJPqB169ZE3U2bNqke1MqDKsNTTz3FPoB9CatEe4RLnyyFPcHChQvVExuQLDn3ggsuuOWWW4i6vPDBgwe\/8sor8+fP\/\/zzz8m\/vBb2NCyXd4NFQ3hxgrADOz7UVbYVoVIQDFNTUzEgGROfoj8sSZkgjMKoJwBiScqILOw75Ijm6tSpgyixLVbFWcqwRMvVq1eTeZEprkTQtMnPz+eon3i7ZMkSlkInLBSDoz\/1QDLAd2RPusXFLItgy7oxC+1ZBA1WrVr19ddfs3S1zYe3\/HCBHM2CMD79vPDCC2RYIOF26NDhhBNOePTRRxE0U1mfoUOHvvzyy3McCM5XX301K6y0y0vb4TMlVFUO3Jah62+DBg3ieIrCXXfdxTEUR23O1GoKH29EEBpx4I3e70OMKgmp9qOPPuJY\/qGHHrrpppuwpLp6NnPmTFSF+xgFFMm2xDaGLqmkjBnJtryZa9euxYydO3fm3cbahOLi4mLkFRUVRYH26IwZGWVG7KmO5amkTD9IFvkyiRlZEGVq6Ioa5qIHFkTLRo0aUUn6Rpo\/\/\/xzv379Qi9gNxgGmf1v9uzatSs7Bjj33HPp8JhjjiHp8xIoszK8QKjawuW1sW8L3Ze9HV4+b3VopFrCrv3yyy\/\/+OOPKV9\/\/fVvvPGGqq8Uek5Obkl58NNPP3344YePPrrDRf\/612mnn8bHIDS92qG7DT021hsXY9\/AxBZnqS8CmGZefn5JmTwZw\/k6g64lJiR+\/tmn99x1xzNPPz1g4EAESsjFSjTAR86dD3XQJfr77bffOCTnQH7dunV169Ylk2IrzDt37lxEhtfUuQIcimqZnUl4TTmaINyyZcvNmzdTjwJI07GxsUzlYJ8y5t3m3NvAJHSAZ9evX89q0D99skqtWrXCuW3btqW3tLS033\/\/fQ8\/6m6\/Lue\/des37NGz5yknn8I+gD5ZAfoMqtMUttlLTJMxddZCxR\/m2z53lUG9IGcY4wvdlxKaRLWuFxUXFRaV+IPUqretqr0BeyUxMWnwDYPLSkvZtI4\/4YRLLrqYqFCzRnJo8r6h101LbZYWnxAbm52bk1yztukP8MZahv1EVFs929\/Typb3kfAsFBSMVqq8j+y1K1Vw666txaXNO3V++5X3g4ESv2Zauun1RaVv2NS3z3k14gyPHXUMe5tjrl29WDqhq\/0u7zvMFW5\/IOUdYNIO0PKvSt3ifwFd8+h6eVlg9vL177837pxzz+JdWrVqNZETW6HRefPmoVG0S0bYsmULikS7HLlTSRkXb9y4kUk4l1HkuGrVqvLycuwcCARIVQzJ1xRQrdfrpUOmItn8\/HzqmZceSLvLli1r164d2VbNq5yIGpiRIdZGoF9\/\/fXRRx9NJ8h62rRp559\/vnodf4fmusuyAroV5fZ0admgZmpyaXEZO11ePXsRdMu7pfJf6N2wx9WsTiE8up2Kb9oBlvcMLcNtDqSssMeo5BDQsDymZhlWueYqKjQ\/+nJCvXr1eCvsNroeExtz5+1Dfv15UlJclGEGNFMPOutsz87\/nZWnZ2oUFcv7yM6zVFzVimu+u\/I+si9dhct\/VfJiDb2woCgtLSUmJqa4tKSksGTV5rwNGVnO5H1Fb5ES+8dbPbXyMsPjKjcDhhnULPffvo9ZjbB8Ma5vfsl6a1at\/477UjPLNL\/lIhFH+eavWPPYTRd+8UBzI+i3vwxgb2rV8S0y7bjD7ifo1vQis17n6z697cFnr716YF7+FvS3adMmIi35lzxLgQ8qeys8i2EpoEVcSYAF1EkNDiUgBwIBYmxmZib16Li4uJj0ykddyZpgi7tpSaZG7lu3bs3Ozsa2KHXy5MmnnHIKy6U3lkIiZgdAfWFhIUukhk6wf\/369YneTZs2ZQeAf1euXBl6Mdsx+J\/9oXKZlr9VWtIvL58To68POjJ3plcvnO9xs4FjYMOlBcs9voseXfXIq+Nbt2gS9m9UdOzN1199QZPl5x2fYhVppqtcs1z2QWJ1OSHBhmGfpfK4owLsnK2Ay\/Dr7oTOg6YtyyoMNdk39KMaJM9\/\/VjN2maaLoMdvsEhhftQPxHqyIQ31IjTvp2W9fr0Fm9+9L5llpocXlnuKK9vwcplTw3p9\/UDjTg+NrGQ\/Uyv6gg51zDd9jvlChT667W7cuItI54a2P\/SRYsW8bHs2LEj4ZRPKfLFqrSnbMelmBg0mpOT0759e9SMGREl3sSSDJlEEEbHxFga418MzixolN448kXNJ5xwAtpFx0gWWaNy7Lx06dLjjz+eqQRktVxyMf6l27y8PDpJSUlB3KRmrM1yCctPPvnkfffdp15LGF1zaYZpmVbDJs1a14z6+J7GSVFbq\/QZ3T3DZ99iR4uE3UEv78y5I9cPe\/HzNs0bVfTvLTcP6t987lk90rQyLeAqcQWjTRxk55LqoA47WThh2OBo2NKD9pP9vNFtrvtzybrcUJN9Q2\/bKGnRKz3MwLYgQY\/sa2gB0kB13fg8Ue7vf9302owmb344zgwGLbNc0wNR3ugly1c\/hn\/vb+LXS0kG1XHv5OBscW77k+kp2uKv12Hg94PvfeSOITcvXLiQ8NutWzccig2xKof\/6A\/Poksc6vf7Zzmkp6eTeZVwGaJpCkDnqJOhOvlLDZ9zJEt59erVzZs3V3YmC9Mh9WlpafRJDctNTk4mOzMLbVAz0DO6ZzXwNevDivXs2ZN64nD\/\/v1\/\/\/1359X8jeTkWm+++eH4Vx996VpvSnyJ3zxMT2Q\/0rAvX+qmZbkNvdw0DLcVdeHj6+5+ifzbuKJ\/h954Tb9mC888oU5JGZ8RvzfoDuqmnYKrgX\/5FPA+sYOyH7OqswHzLrk1d1Tbm35fvL5ydy7o7RskLni9uxkoDmrYN+i2XAH75F41\/Za6Oyrq218zX52VOvqDTzR\/MGjyHmten3fxstVPDO078YHGGJm3yTn5UB0lbD\/CXDNcpu52lWwLpHW6atKgux+65NILo6JiiJx4dv369cTbrKwsPqtt27YllrZo0WLDhg133333pEmTQr0cdsjjQ4YMUb8xjK9vuOGGOXPmhKY5pKbUvuGmm\/r1v+72K84fPTSxTkxZMFhNd7LEOdPeuNnR6gF2tbrrgsc33jdqfJvmf\/Pv7TcOurjFvHN61gqUcCSuuzkq0swgcbAaYNrvkEu3T8ThSTYUjx37Pd6jrp+zaEPlnmynt2tYY8Gr3fToEtxDx1pZkb+Eo+5quvG5o93fTM96ZVbdMR+M1fzlbFkcDfi8McuWrRo5pO+E4Y30YCk7efswy1ZwtYMX7rxyw2OUbw3W6jjwh3ueeH7gVQM2bswoLipq0qQJqTMmJoaYSeokyZJVGzZseO211\/70008MyaFff\/01uZg8e9RRRzGVOFyvXj20SF5u3749ednj8ZBeqU9NTc3Pz4+Pjycjlzg31RJm165dS8tevXoFnV9pUWc5CLaFhfZ5N2ZBrPfcc0\/t2rWHDRu2YsWKuLi4xo0bP\/7442j36quvvvPOO0nf7CSmTZv23Xff0Se0advqssv6xsbEFhSZd13d972701Jji80g+bc6\/hODczHN0J2LaobuOe\/xDfeN+qTN3\/PvkBuvvbT5n2f3aGCVlgdcpmH6TKOcSKh6qNLozhX4oGUFPb44zRtjyyBYbPnN9oN\/X7Shko9tOqpB0vzR3b+fsXXaatOruXq1s3q189ghrzrmO90dbXzzW8arM5r8933ybyCo+dmyYtwxi5eveXzoJRMfaGRa5c4VUD6Z1dO\/djKy3yiO5YO12\/efMPjeR+7895C1a9YmJycXFxeH5ev3+0nEePaxxx4bNWrU008\/3aBBgwcffHDVqlXR0dE9evR48803mzZtyigz0hhZY15EjDGxLarFwgia6LpkyRIyNR97t9vt9XqXLVt2zDHH4FP6r1+\/PoIuLy9XV\/wWL17cv39\/Rhn+73\/\/mz17Nmru2rVr9+7dP\/74461bt06dOrVu3bp0RT2L4xUx3Ja\/rbC4NMrn2ZSRNWzQ5R\/f3zgltijw97uAqw8kXhKwK+gyNNMyiMHeCx5bT\/7d4fzDkBsHXdp87tk965SX+dE0Bva7AoZ9fbbKY79Y01Vi+qLmLLYmz\/WXGtpxzY2zeiS1vfK3xZXMv4b9mYr2jZ+S8fg7s0e8M2PSrCzDG2V\/yqrjHwO2ODdbHmOW\/aO99nttcdDt7Nn5c74vqD6Z4bmq0Z9zdk9d5OYowHRxdOpy5W\/Nw7zLly9HfJiUCBwbG8unlJyL3YiZ5OJWrVoNHDhw5cqVvH80njx58nnnnbdu3Trak2dJrygbpaJIZsHgmZmZZGEMi3wJyOrWiDVr1lDfpk0bFkHOpfHGjRvpk\/ao4ffff7\/yyitzc3MJuePGjfvtt99Ix6zSL7\/88uGHH55\/\/vks5csvv6Qr0zSZRX1Jj07SN20qKizgn7U84E9ISrRC5v3bC68+f3a6M11s8KbzD63zWQhN+hv2OJ8JPhf2hSiiMsomFYY6qdJ\/WtBgE3F7vL7\/zdv6wHuzHntn1mc\/bdKi3c7LrxyGfQO1bnhj7Esf4Imyb6GvdDdVBmdjcgTLZsff30KQ7eBqj\/0O8R97gLKsGslJNZKTfc73wZKSktAomTcYDKK57OzsSZMmrV279oILLnjvvfewoeqB7ImdyaojRowgFBOHESKibNiwYe3atREilcg3IyOD3mrVqvXrr7\/iWRaRlpamwjIxuUuXLsceeyxzkZERPY2HDh3KPmDixIkYGbOzCFBLZKq6d3jmzJn0j9bV\/cXMGBsbV68uHdeOiYpOTEwsKy0J7WWq8YdAvfbQ52BvOG8TAcUZqR7Y5x8st2bqbm\/omb9R0R71bS01uu+oLFPutsK\/DhPUquvFN6EyqA8cQ53sSbSsU6eOyqE4ce7cudhNPbSMmnbt2pFtnfY29iGEA25V96XhX4Its+BiNJ2VlcUkdQvavHnz2rZti3axuTrni5rpIT4+Hs8yy1FHHYVtr7vuugULFgwfPrxDhw50pfoPLwjS09NJ0KR13M1CGYJTv9EXFUUGz8vPi4qKtuVrU510IlQS+4jY\/k+ZsV2V+33fs\/1b3GSZcnfIv\/ad6Ka70hoXqh\/2eRhdc7tc2BPJokW89vvvv2NJAiwN1O1fFIqKipw57FOHqqCwv9cbDNarV48ytsW8dEIbwqk6I0ElsRez16hRw+v1YknCLy5mRmIsRmYS0fiKK65YutR+jO\/dd9+NfMNBu+LiyL+sJL3RT5z9uxv2d0PQMVm4qLAQFzuPfdhu7AriFoQdYMvX7VPjbrsYqrKDSKhcGeyvctnCDYYM7pxgl41P2Bv2Ead9gIrIEhISmjlfNUZtTZs23bZtGwLFa+okAG0xac+ePZ2ZQpuWKrRp00ZFWsyICtG38qM6I0wNzbp06YJq169fn5iYmJaWRlhmFszLIk466aQ\/\/\/zzkksuISPff\/\/9AwYMQKOsjBK6WkRYwUwl\/1LZsGFDCqxS69atGW3SpCmJPTUtjaWzwiUlJYa+32lGqBaYRsDQS9jC\/LZ2nZr93WEbavuMc3ndbo\/P445Hvnr1vPlBqDRut2trXt7GjRuKi4oQH+bFX8XFxfiU6Fq3bt1y53cfkOagQYNatWql5lJm7Nev35lnnrlp06b09HRaolfDMDAvEZhREi6WzMrKWrt2LWakQ1qSW1kKsZoaBL1ixYohQ4YsX778gQceGDx48Pz589XpBSrPOusstSC1rIsvvphu2SUQn5ctW0Zhy5YtrGq0\/VSKHJbL1PKysgYNG\/qiorZ\/lvbzEyVUeez7H+zw4Y1yGfZ1D3KDfSuNqaZWCiNA3C0uvuuy2n++ctK8\/5wwqHft8uJqf\/7X3vvwf9kJ7R5nv40Kiau4EoUhX4bqQhkRFQitNKAZpkO+H3zwAVm1QYMGbdu2Ja4OGzYMV9I4NjY2IyODoEoPNA44Ny0kJyfTW2pqqmrQqFEjdfKBGuzJjITiq6++msXdeOONd955J9EV75OL8\/Pz0f1TTz11++23N2vWjGU9+eST9DBixAhWCYNTpmd0j8FZELPkOpk6Kjp6Ha53ubZfdpJ\/fWF36H49Jlhc3r9X7JxXu\/\/56vF3XlpXKyjbj23GubkqGExLCravH2jVwExONDXn0SOCsEu275eQlIVeMVpion22gYjKQT1H99RgZEIBoVI97CYlJUXd1fDKK69MnTr1q6++QsS1a9dmdtSMTGs4z8rBvzVr1sS81JNPES6upE8SK1ZNS0tDlyRitI6Ub7nllrlz5\/bp02fUqFE0SEpKatOmDQ0wKXrF5vfee+\/3338\/YcKEpk2bvvvuu507dybtMpVFsHqsm3q4Wv369TnyY\/agGSRxs9r21i\/uFXaPpWtuK2CZweQEs10DzGnWScCiHDdV3r8e+3Y\/3QzoQX9ZwO83g3QdmlZ9sd8B2y9qTKhI6H2xtzX75t+cnOzMzAw7P0ZFobYWLVog09zcXLLq0UcfXadOHbutZWFMHI0fUR7iow3zpqen05IarEd6RX9MwozUxMTEMES1ixcvJqIySgTGqjTDpPfcc8\/s2bMvvPBCUi01OJRFMzvZGfuTkWmJ0Mm\/U6ZM6du3b48ePd577z3WhPVk0oIFC\/A7mmYWr9eXVifV7y+nfWpqGg3sFykIu0e3gvZJWj1o+jm4s7RSvxZglCmVNoahW4ZlRbFVOl9q5nDRZWryQw\/C3rC\/JWWLtbi4xPldSvv3hzZu3Lhp0yYcSqolvWJbxEpbVIvpEhISsC3OxXSMEnITExPbtWtHG1ItCZRYCjiURJzh\/F4co6RXMjWdIE0kToi+\/fbbv\/vuu\/79+48ZM0alY2YhO9MzLqalyrYsfezYsTfccAOLeOONN1icisZ0y7Jat27NHmL16tXMUuj8jgaWLyjYxqrar04Qdo9pWPaDyuwnJLv9LsNvPxBlP4+YDD\/i1U13wL4RzTSCumVa9vU3QdgbbISmFRXl27YtH5+ST\/GpUiEJtFWrVuqWLxqiXezGpOTk5MaNG6tvAKsnOdCGKMqMpGNsiHlpg3zxIHIn9qprbupcAWIdNmwYVr3kkksef\/zxrVu34lDUj1vV2WdiNcpmlJX56aefLr\/8ctz96aefNmnSxD6xYLKp22eZGTIvCyKe+3zevK15um60btU6NjaWlVQvThB2h2WftiX6OucbLHbYLueZRfuDYd8HaQR0+\/vebq\/hc6H10CRB2D3qJgHDfrYvziKHYjdsiIiRL1PwKVmVesr4lHoKtCSE4laGKSkp6p4HdIxYyaHMWLt2bXXXGgKlAWqePXs2o7RE3C+88MLo0aOvvfbahx9+mFlIuBgTZSNxQKYolcb169fH0TfeeCM1n3\/+Od3SmOyM0FlJlk4blcdZOmuCtemf5dKASfbrEoTdohum29S8Qd3l1k2PEfAgz\/09akLk9vXebQFPdokvpyCqIOhy2z+2Igh7B5\/FxcUnJCSqsw3Ybf78+Rs2bEDEeJnIyZE+zTp06EBKJQLPmjVLfdstKysLF1Mg3lIgjWJJzJiZmYl2kS9+RL500qJFC6xKgh41atSYMWPOOeeckSNHokukSZ+FhYVr1qypVasWC6IT7InBv\/jii9tvv51u33zzzU6dOrHQ3377jQTN+mBb5mURGJn1wdobnSdIbNi4ISU1Jdr5bTr10gRhN5imETRMzaWXFAaMnJLozSVRRaXR+3fNlgCg6XFxT47d3Hbwb+1u\/PWtb3ON2Arf66ie2G8l\/5f90J6xL\/iaweCWLbmrVq3ClSr8IriSkhIlO6RMO+fUagFW7dKlC8IldWJAJtWrVw97zpw5k6BKUsaziBuHbtu2be3ateRTauLj41E2fV5wwQVPPPHESy+9xCgdIuv169cTftu0aUPndIuFce5rr712ww03sCYkZbw\/adKktm3b9ujRg\/boXp0PobzCAYk3bdq0Xbv2W3K3sCDnRQnCnsCMJFaPVe6O8b4\/tbj94JntB\/\/21LhNelz09jsXK4Hzy1cuI2dbICevOCuvuKAQscslCGG3hPZLzv+dYyf7l4ljY2NRG8496qijkCblBQsWFBcXp6en044C7svLyyMmq0tk5FmGGc5PZ+JWBIqyaUMCXbp0KTUEW7Iw4RQX0y2uxOzXXnstDeiBBaNa2lBGxzRA3+wAfvzxx1tuuQXvP\/bYYyeffDKZd+HCheq+CxVskSyLpk9WGOnjcUwdGxfXqHHjefPm0V7OPwh7xvnap9s03JruKSo2N+cV5Wwtyiosd+6Ir\/TGY9hCD5rR2zc7+5qe\/dzl6o39UeX\/ld6bVQcqvi84Da81a9bsuOOOQ3\/IC\/OiRVzZsGFDzIiaaVa\/fn3yKeqkAcOtW7du2bKFMt4kvXbv3p02lGmPGYmrWBUtUoORk5KSmLd9+\/bMxVTs6XN+W5Plsiwao1T6rFmz5vTp04cOHUpX999\/f9++fWnAjLSkB+SOlOkQp9Oeyq5du7Zo0cIJ467c3BzNMmvXrm2\/JEHYGwjYuUk84DVCl908hvoJ10obw\/nBEJff77I\/J2DaD3+o7voV9hH22mYwuGlTBjETOaI8IqQKrRgWozVv3pxmuI9JyBQRY+RatWqRPZUWCchMZRS9ZmVlJSQk0IA4TEt1xjY\/P3\/ZsmU4nYTLaFpamuqKNkCwxfXUz549e8CAAXTy4osvDhkyhKDtcrkMw+jUqRMhl\/5xNAtC+uwnqFm\/fv2SJUuwfH5+Xt7WrfnbtjEVoTOLemmCsDt0O3e42Prtn7xzsK+i7VdcY2tzaZrPGTrjpuE8y0cQ9g7bYcC+qVbPyclFeXgQu7Vs2RJXkjERKNAM682ZMwe74UdMij2pJ4rSODk5ORAIMC9tGjduTLalgIUxY0pKCvNiWJWdS0tLV6xYwZAGtKeySZMmTCUR4+iBAwdSOWbMmFtvvZUaZqd\/TK1iL7sEZM2M9M+iKcDKlStZJRbBOjRp1JhZ6JN1s1+YIOweUz0g2j5NENpbu2z37o822d2zwfmD5aHNTrd\/TMQ5VSYIe8Le2thXEzKxWFJSImpDdtgNn5I90RlZ1ev8pHFOTg5TcSXH\/jVr1kSFNFBynDdvHoFXwbzUk47z8vJQKrJGiFgYP9JYCRf\/KkfTCbPTIUK\/+OKLN23aNHbs2DPOOINUGxsbSz3pmw7JswRtdgasD2uibnjAyKxSgwYNWHPMXlJaWlZenpiQSBvdfiCVuo4iHwJhl+iWfdksQKwIBEMbid\/PqCpWDsM+AxEMtm0QfUzLWt1aJjZPMayAPP9M2Cd0w8jIzEhMTGzWzP6WWklJCakTRRYXF+O+jIwMNEczbEiuXL16tfqCAzKlgPiIyeo569hz1qxZTFLhlA6XLl3KjDRAr0iTIVOVTFkKLsbm9evXX758+VVXXbVgwYJHH3305JNPzs7Opgf0DTTD0bZSt\/9qPR1SwMtMQuUdOnRA5Rs2bCwsKCguKWatsrNziouKt18KEYRdYhkc9ekm+bdxTb1Hq6RjW9Ro3cBLiA1NrwxG0DS0orLBfVKnPNWFv4tPSQmUVPs9v\/0J5P\/yQdw9zjFS0DRr1aodFxvH\/p9QmZCQ0LRpU2yL5sihixcvVm2hWbNmrVu35pAfjWI9si3aZRYCL65s06YN+ka7TMWhP\/\/8M55t1aoVTkTQKBWQKQ5FwUrc6rTvjBkzkO8bb7xxww03YFWmLlq0aP369awD5iU7Y1vUz3KZhdVgobibzpXZycVNmjRu0KCh2+3Jzc39\/ffZfsfy2zcAQdgllql7giWlfXok\/PhklylPHzv4gjpWUdn+PH\/HuQCne4zyeE9+jKvEowcN5+KeIOyS0H7JueDAoTpRlwi8daudN0m+WAwhorm0tLSOHTvWrVuXtgRhJIhJ0WJ6evrmzZtxKDWkYCyJVQmzCJp6RnHiUUcdRQ8IF0UyRJfJycn04\/f716xZg1WZ8bfffvvhhx8uuOCCr7\/++swzz9yyZUtWVhYGP\/roo5s3b46aWRPWh7lQLX2SxJG7qmEqiZvl0oZFL126jP1BSmqKfZ9GbCw7FZGvsAd0y\/AEDb9uufVArFEc5y70aSr8Vt6\/fIY00+3yey2\/FrD8QcutftyoWmO\/Afy\/2r8Pu6LC+8KRvYbayJjUYUDsiSvV147VQ3OQMkPMS84l2BKQUWTNmjWZhZrly5cTNkFNohkz4mU8SCW2RZcsg\/BL40aNGjGV9IrxaY+Fe\/bsiZ3bt2+PzSl4vV5WgH7KnN8ZoodgMLhx40b6Qd\/0gHbVWWZiNTXMQv90WL9+3ZTa9qLxPm0s\/CtXQITdY+mGrpkGx3+WOxj0BIKG\/eAyZ4ozrAT417SMoH0fp+YxNY\/Btif+FfaKYyjkWFZaGvAHUlNTESLiQ38Y+ZdffiG6EjmRGs2QMpOQJhKkGRJkKsEzMzOTxoibZtSokwa0UaduEShpl1TLjLRkiCtVexSs7rLAsyyFUWI1kXnZsmUsiAZkWxSP6JlFnT5WN64RnJlEt8xINmdZgWAw1XmycGZGJstiXjztvEJB2DVs+ghTs1yWbv\/oflA3gs5phP1A\/f5mwHKVGlq5xzL5QIWmCMLewGheTBYVtX79eryGQFesWIHsAJehvLy8PNUMS9arVw\/zknkDzjPGMF27du3mz5+P+5AphkWUJFbkS55t3LgxQZisumrVqq5du5KIcT2z0JipaBo7o13MjmFZNC7Gv8idAMu8tCEOsyDiNsqmK9owin8J5vRGVwsWLGC3sRVZOzdFrFm7lm4TExPs\/Lu\/t3MK1QFdC6rfyzSsMo9V7NJKtf1+\/pmhGXrAZUTH6Ym19MSaRkzUfv2OkVAdQaz4zjSDuA8\/IkS0S3Q9++yzsS0FptKMAobdunUr+sOba9euRYjkU2bB0R06dECOderUQX8oGDPSbUZGBmI99dRTe\/ToUVpaipdpSQGDo9RatWohYgyLtemW0M3s9EmkRf1quXTOXLTfvHkzDdhNUMPKqNMU+LpTp050opZVt169jh07sG58uOzff7PTvZwCFvYAydXv8kXjTHd8bZc3QR0RVhYnN0d5v59R9vC7OY+8mzN1frHLK89\/EPaG4zJdN0iLGRmZJSWlhN+lS5c2adIEnWVnZ+M+ju4RHM2QoH1c73IxqVWrVthTRVEkiCjV89LWrVuHFsmzjRo1Qsfokk6QI07Mzc1duXIlZieu0gzQLt0yI7PjVlI2VqUBBZbLXCiYMkvBziyFpdOAWVgfdhK0UYGd9aFBalratvxtPq+PuYLBgHhX2Bu627Tw5G\/L\/I+8mzvi3dwfZ5bqUe79ef6OfSIj1vvJ1HUPvTtjxDszJ8\/OMqK9+9FRlcJxi\/qPsAOhN8XZ22O69Rs2MExOroEusWFRURHH\/qpMPUqlGXpV5weYij3xb82aNefMmaPOOWBVtMgkLLlmzRoqSb7kWYROmF21ahWmxsu4Ehc3a9ashvO4XjpnQXRL\/+pHN2iWk5ODvjEsbVg0yReP0wkiZkHMQuPFixenp6er73QwF5m6rKxsa97WzM32oy9Zbfslyr+8sCcswwrqvqif5m0d8e6sR96d8enUdVq0LzSxMjgPkAhq0d7QzB4fheotX2GP6Ooux+2GatCgAS7DsJgLS+I+aihgUkKruv+B7EnMRJrOueIoKomuKBhX4lPiLa7s1KkTUxs3bkw4ZSqqJZ\/ix6ZNm6JjGjMVhzIv9Zha1\/W6deuqeTEv1qZn5qINDTZu3Eiluu0B3aNgyvSAoOmKhbIyaLe2TYphuFq1bMVc+JqyOvsgCLuDT0DAvvtBj3LiBXhiPM5p20rvtw0XvRmBgCv0syuGFqCj6r79OdlO9kN7wnlvDJf95ePCwgI8SFDFgEcddRQCJepSwHEYjWYqvf7yyy8USKY0I7rWr1+fBGo6z6X8888\/MSYpFUXSgBzKJLyJWxHrihUr0CiyJhGrKE1eRu4Yk\/aLFi1iQUcffTSzYFM8i2HVqQ+VxEm4LVq0YEb6V8lanSNmlQjjqfZj16PKykqbN29eJ62OffFNEPaI8\/wzw\/7d4u0\/1WZ\/GuzbxiptDDRukKbD3jZthVfa4kK1BcG53O569eq1a9cOD6oTu6iNpImCkSZtMLK6h0GdASClIkrUyShyRLg9e\/ZU+RRfI1z8SD0CpXMiMJmXHlAqsiZHsyykr6RMCm7fvn3Dhg3pivbp6ek0IESzJhiWZTEpISFB\/c4my2XdWAoupoCUW7VqRecIPRAw169bHwgG1DU6Qdgz9ikq\/LtduC5rP7VpmMxpufRg6J5HUydRyyYo7A3HU5YZrFu3Tq2atbDb+vXr8eOGDRtIshgNzVGj8q\/b7caGOHH58uVKu1u2bCEyU0kgBaSJE6mkJQ2YPSsri3jbtGlTgi0CpYwoaYC4WVZqamqPHj1I2cyFdumKZaFOki\/zsg4YnJVhZwCsALPQLTUomJ6RL83YQ9ir5\/wSaFFxIVl+W779CE371VU6xwjVCMu++cG+cGZuf2zkfjvTTtGaO1DuPIgPzJIy0a+wD9ingQ2Xu7CwKD8\/H6+Rdj0eD0G1bt26yI7I2aBBAw72abp48WJGmUQbpOn12jcNY0a0CPgXq5KCkW90dDRuJQvXcp7Lg1vRLt5EwSr8MiT2Yk9cjJRpySyEZWqYBXsylZWhkphMdkbxVCJx1My8LEJlcxJ0Wloa6ZhKFF6\/Xj1Wr6S0xK3O6OkcTIqDhV1D+LX9q7v9ZaHHppeV7qc2Dfu0RUnphcc3uOOyY++7rNOpHWua5eVyAVjYC2x+lhZ0vuBgf2fBssi2eXl5Sn9IE9NRwzTaKiMDk\/7880+CKtqlgWqMvnEiokSj9IPE161bl56ezrwUli5dqs4JEHURNyon3mJP+rQXnJBAhqUQ7\/xMHG1ooE7vUq8UT4ek41WrVrFEanAximfRrC2VK5zvQJf7\/XFx8dvy84nlTOLlyQdA2B26ZgUNwywNnNQ2fli\/Y\/59WZfzj6+rldq3WlYWQ7cMrcg65\/jY525Iffz6lBO7xAVKzeq+67c\/fPxfPoN7wt5IQt9xCKirapiLY3k0Sq5s27YtmkOFtMKSrVu3Js+iPCqZBQ8mOWzatAmfIlYcWr9+fRoQbNFr48aNkWmHDh2IzOr7bHRL2lUpm2WRmpGsupNMCR3pE2kbNWqEmsnd1GDzFi1aoF2WGBsby5qQdhmydFC5m8ZRUdEBfyAtLbVxk6axMbE0ti+lyL++sDssLcCWX+7v1i565PV1n70+7ZyecVaJX90ZVCnsHK253IHSouDWHGtrfmlZia47360ThF1h7bSNGbqOK1Ee5uratSu2zc7O3rp1K0MkSAPMiFiVZ7EwDYirmZmZ1KNL9Ep9bm4ulURR5IsZN27ciGfnzZtHPT0wxLksAtEzu7o6R3t16oOl16pVC0dPnTpV1eBZPI5zJ06cOGfOHOZV5x\/onJ7ZT7BEumIR6BsFu13ugm3b\/AF\/ecCvnj6p9i+CsEsMzeSoLOg3zfzNZl52sKTUuSKyH\/7VTEsP2NfvLA67DJfpotvQxGqL\/dHj\/\/IJ3AWh90XdJ2BZiMx0fpyCKIoWibH24bxzKwJ6RYu08vl8qBB70ozMuw3T+f00Y16iK7NkZWWhSPIsldiwqKgox3lwO2GZiKp8Sg0d0jMqZy4CLFm7efPmJGg0qhaRkpLCOqxatQpHE8CbNGmiOiQCk8SZi1EyMv4FWs6fP5910HT757vYYaxft47+1ekOyb\/C7jB1y7DsX8o0dS2AMnXdpS7bVt4Yhv0ASgwctIK62294dPuKnmx5wt6wnJ8c1PVVK1dalqkO9kmXOHH58uUEYczbtGlTMq\/T1j6rixO\/++67m2+++YMPPiCE4kpsiEZpjAoZol2GCxcuRLvHHHPMunXrCKdUEn7VGd65c+ciYkSJT6lftmwZRmahCJ20q1IwzVA268AiRowY8c033zALk1TsZT3pDZAsuqdb29crV21MT6dZy5Yto6OiZK8r7Bl7w7cfwYN0Dd2M1k3ffn9lx7n+ppua2\/K6Ta8r6DIC9vfhBGHfSKuTxoH\/0qVL8RfREq\/l5+dTTyBFpuiVMp5Fl3fcccegQYPGjh374IMP9uvX77fffsPI69evZ2qrVq2IxliVdFyzZk06Ie0y3Lx5M9GYzleuXIkrGzVqRLekWpbIVAq079y5M0OWRezFsOr+ig8\/\/LBXr14jR47E9SeeeOIXX3zRrFkz1pDZcTqORuJ0W69ePfYNKNhO0F6fPxDgT9KHsGdQpqV5MK7LKPe4\/C6PX3Pv59d2DDrRdU9B0LO5yJtTGFUYsO9pD00UhN2hh36l1e32bNhgn6slYyK4qKio9u3bk21Jl5SJwLRBiy+\/\/PJbb72FJdXWlZ2dfe211xJ1aUmARZ1MogdmQaYYmQyLkekQXTZv3rxBgwYYk0nUpKeno3gUXKNGjQwHemBSly5d6ATDzp8\/f9SoUZTt9dO0vLy8YcOGTZgwITY2FtUSlgudpw+zJsRnhnXq1GnYoEFUdPS2\/HzasAg1oyDsEvuUgeZ1W3pJwMgu9WwujinwR+3fWQPDbZlarO+pDzLaD57R7sbfRn+b7YqxnxQlCHuC3Mh2qNv3EmRlbcazpFfUxqE9cmQi9QwRHG1R5KRJkygo+TLEsPiULExWpYw0\/\/zzT7RI5caNG1evXo2gN2zYkJqaitlxJYYltOJx+qQS+dIYqESpLJTGeJnOaf\/111+rpYRhdMqUKawSmsbaGJk+27Rpg\/GLnZ8KZbnU0CErQ2NB2BOWZWhlrhjPhz8Vdhg8s\/3g354cl6HHR4W\/DrfvGAHCtMvILgzm5BVl5RXlFQXtTFzNcSyh\/iPsGttqdgb2ejwdO3ZEo2kO6vYGLKnCJjKlLcrbsmWLmk9h29sBz+JWIifuYxSxknxrOb9XlJiYiB\/ROl2hTqBD1EmNOsnQokULxF3PgeDMvMzFLHSoOq8IcRg1o1eGpGmgzIoxl9fni4uPd7tdtVNSzO2pWRB2h2k\/tdc+\/ZBXGszYWoQ5txSUa\/t125jz\/F8zGH7kr8d+FAR\/lRa5UE2ouF8yLR2BEnKzsrJwnwqkOTk5aBELFxQUNNz+K3AYU81SEZIsINZGjRode+yx6JvecCL+xZLMy4x4c9OmTfh68+bN9I92UTDLIrTOmTOH3KrupkCjtGReVoAOQwuoABIP2xndMxdDGrOqbpc7MzOzbl37sRLbCrYZbpfseYU9oFvOHTOG7nb0CR4X2ZdypbcbwyBKW+7w5bug7d7wl5qrK\/a7wf+3vylCBSq8L\/Z\/SY6bN2dhMaxHMkWIOI568nFcXFyvXr2Q6eTJk\/v06WPPsH07o4BJu3TpQhuci\/5UyKUf9IpqCafl5eUYfM2aNXXr1k1OTk5yfkSObumQILxu3TqESxuSNZW5ubmrV69GqewJunXrphahzjxQoLdOnTrh3JTQE37tJ0JQoB96KC+3Tx8XlxTXTE5OTEwKhvQt\/\/rCLmCTMuyfyLQlGdat\/dgye2Or9DZj2LexGVrgL+Xu12MsheqGs7dnk0OaTRo3Ju1iXozWuHFjcivhFJ9ucB7NfsYZZ0ybNq158+b9+vVz5rNBiM899xxtaKnO8DIvGTYxMZHMW6dOHSyMTMnFTZs2JecySlKmvR1XnV+Pb9myJZ6NiopS9XTCIgjImPqkk066\/fbbWRY9sCwKw4cPX7x4Mba99NJL6QoaNGiAghE9EZjFMTtTEXqBfQqYDwOfAPkQCHvA0EwjdA065N1KyxeccxboPBCaOWD\/rHK1z7\/CXrFP\/9r\/xVk5ubl\/\/vln7dq18\/PziagIdN68eYgVOSJWbIht\/\/3vf+O+UaNGnX766VdcccV\/\/\/vfyy67DLeicJphbQqIFf8Sh9VZCNRJ\/l27dm337t3JpzRAvkiT4MwsNGbRqBNrE4EznF\/HYGfAVDL1\/fff\/\/rrr19wwQUXXnjh6NGjmTp+\/PjevXtTwN20mTt37qpVq9LS0gjFHq8nMzNj+bJlLM6wn62ijiUFYRewZZh28PCzkQTDj43c36sGeruGiQvfP2HYC8tenbTBZWkPXtr49svrBQpLquf+3x3t\/nZ61msz67794SdWoNwK2l\/p9vp8i5eveWJI3\/97sJEWLAs6RxrVFudL7qbHpecHarbv\/83Dr\/73lBNPWLp0Kf4lBW\/cuJEC6uRIHx3jX1z5448\/3nrrreiyXbt25FPiKmETk7qcR\/rSmAI9U2bDppyZmVm\/fn3mpRlOrOc8nAy3MkpjEmtubi7LYhacyxD\/omMcTZmWyvt4GV+zDunp6Ui8bdu248aNmzFjxllnncVcq1evJvOyMrS3zGB+YWFcbJxmeO66uu+YIalp8cUB\/umrL7yrHAfzr2Hqhvv8x9LvGzW+dYtG6sImtVHRsUNvHNS32byzT0gNlASoM+3H4VYXZ9gfAaPME5X4+pe59723BPfe2rvBY3e0aNdv+qIN9g9+7zt620Y1Fr3WJa\/IX1Dmclv+mKhgrAep7+IKRnVA\/LtX\/vKvP7n9gG\/ve+G1k3sdz4E8lmRqYWEhn9JWrVrhUKIlLibSIkfE9+KLLxKTmUr8xHroj\/YUnF416lUNPdSsWRPDqnPK2BaZ+v1+vEwb1BnjPPYXyTIvBXqjGYtgiJ3VGWQUTw3tmYs4PGDAgL59+9J5VlZWp06dyObr16+vW7cu4mb1Av7yxBpJhu5Zn77p3kGXjb2nUWpsYQCj7NcRZZVA\/LtneL2mYblL\/Fqe381Wkuw2Y+ONdtf9sXjD1lCTfUNv2zBx0audNKtMM9yaHkC8gaBHs39XozpufO5o17fTc1+ZVXfMB2ODQfxLLrO8Ud4ly9aMHNJ34oMNLNNvsgVW9+NT3e2ybP8O\/G7Ys6\/+q8+5K1euqlGjBmbEucuWLevZsydyJOFiQ+CQv2nTpjk5OSrD0hK9knZxKPa0j\/oNgzL1qBZF1qlThwbq7DBKJdgSV9EojVXOzc7ORtaMsgj6oU8ar1mzBu8Te1lQamoqSZx1YJUY7d69O93SDOGyoAYNGjCVHpiakJCYk52lu4wayUlbC0ruueLS0UNqpsWXBOwr0fa1kOoHL9yw8ItzmK25tPMe23T\/qE938O9tN+HfuecenxIsMTXLCBr4SNm3yn80dJepB1xBU3P5eLEcgRlB+xSuEdXu+jmV9m+HxrXmju2hlRXb3zp2WZrpfCO52u75o92\/\/ZQ98n9J77w7rsyyjICh6+WeKN+SJRufvrPvV8801oIBzeT4YH\/P9\/zT0Q1bSpZLc\/m1YK36fb64\/6lXL+17YY7zRAVsiDFRZJMmTebPn0\/2JBSjPDzYsGFDfIdGESUWZnTOnDlpaWk0IK7SErAq3sSJ06ZNw5gsDfkizeTkZIZMJU1j2xLnhzDIyIgbKTOKuPE+OsatzEuf6lockwi5rNW6deuwNvPSFS3VCRAVpVesWMFctWql6C5r4eJV7468f+ywut6EQq3ann9AuphUN+17oYgfLs+F967+97Pj2rbcIf9eO+io5cefnKqVBu3n0LiwsPpcVMv3jTfNSDx64NT5a+3H9e07ulfTrj2jvt8srxETV1xaEjTN0G071RKPy7VkfX5Z8tFffjGhnEPjYJBdnc8Xs3bl+j5n9Dy7W6LLNF2WK1hdA7BuIWAOjhgGLHfcu5PWvPLaWwMG9F+yYkVsTAy+Q4Lx8fEIl8\/qggULSLKID+thXmRHJQkXXW7YsEE984FZqFRnEvLz86mpVasWU3HoqlWrGjVqRHvs2axZM6xNtkXuiBjL05IFbd26lUXg0ISEBGakE2oyMjLYAVDG12zL6vt42JYeSOIsF9dTT7NE51eQXV6vz+2Oi\/Hl5hVdceH5nRoFNH8eL7R6fgrYsA3HocSwgB3G3N\/Ozvv0x2nNmzZmp6Xeydi4uKsGXL5t5c\/tGyUUB\/y8UfzZmbk6vWW8FWyEvCdsafZvaGq+1ydtDFZSDPq7742xb0U3XM8+\/eRFF56TmtagnNBnhc5+hd\/Pypb3kfAsFBSMVqq8j+y1K6egcxjldWttmjU+4bjjCLqm\/Q0Dy63rZSXFEyd+n5NXzm6OTGBHQGeWnalYvx\/lfYe5wu0PpLwDTNoBWoYr7QflGRx5eeKjY37\/7ZdxH7\/\/\/nvvnHnm2Rs2biS64jX8iO+QIJsmjmMbVZWEX3IolYTQhQsXYtUOHTpgUiYpk2ZmZtLe5\/MhRDyLo9my169fTxt1u9jRRx9N4F20aBFqppIYi5RpT0tmpB98SubFwniW3QCVBFtWALlTQPSzZ88mNbdo0YJJtMQjLJfOo2LiS4sKXIZf90V369IzNbXe1YOuKykus48D1auu+A7s6i3amd3Nsh\/lPUPLcJsDKSucGvuYT9f9puW1NCKtv2aS79xzzo2OjuGdVM08bs9vs39duHBpMGD\/fBn7KpfFgXPAtNx8iOgE6FkVoGJ5H9l5loqr6qxniN2V95F96SpcphCGN+TV117p3bt323Zt7Z+C08zERN+V\/QeGJu8b9idElS6+qO9LLz9bt07D4uIywz6acI5Ctq9CZcv7SHgWCgpGK1XeR\/apW\/7vfK8lWFa6pbiEQzC3yV7dIO3qLj0pIZEW\/M\/k0CzU2J5rB+iNPve7vO8wV7j9gZR3gEk7QMtwpTMXx6dGdJT3i3Gf\/euyi997573LLuu3dsO64qJici7mxW6ojSGZNDc3d\/PmzRzvt2zZEuVhSYz566+\/ouOmTZtu2bKFNIpkkWlaWhqWxNFZWVkoFQVj20DA\/mUNKpkrJycHlSNlelPnjgm5zIuvVbJmoUg2JSWFuZiFBpid1WUWfI2RFy9ejHzr16+vfJ3u\/MSR1+spKCiO8vry8rfGJsV3O6brvy64+L\/vvlVaVsKLVi98h3dg57doZ3Y3y36U9wwtw20OpKywxywXCzf0cs302ddHDbZ317b8vKAZenaS3cSyEmLi3VE+0yg3OCDUXPYTadSU7SsfLuxQ3kd2nqXiqlZc892V95F96SpcphBC16J80X0v7fv444+3aN4iVFl5dDZl3tUff5h0y223nnzaqRec06d7t66lZfbPFlQ\/eHftvGtoZsB+uGfQsE9p8Z6zLYQ2L+ePXFfJf+QqBa\/dSkqqMW7suGuuvfrVV1\/t06cP0sRlGJAYizoxL\/qjHAgEKFNP4MW5CBQnYlt8yhDDEleRJpOoX7BgQfPmzZkdV65atYq5kpKSaLB27VoyLypHwWRe3IpwmZ25SGSUMSz+pQe8QPpWRqYffMH+QJ1tIJ6rGL7BeSSxCtp0ToPs3Nyk+LgGjZoUFRce3a7dWWef9\/Zbb9D\/3z\/+1Qb8q+um4Ue8lEwjsJsvxPIZsX8G2ODjYZJS+C+fCvUxqRYkJSUOGDCQIyq2yc6dO55+em\/7PLjzhYp9x3COKPT3P3hv+bJlb7zy6o\/fT7Q3XN7T6viHWRgE\/Ib9+6aG5bG3PLKvyaZlm9kddGNk3TJ2mrG6\/PF5DBp+y749hjfF\/rD5oqMCwQCZtKioiISL5kigSG3jxo3Yk3oku3LlShSJjtEln1l1RxoqZEtjrnj72Tdu9EoyZRIplVTboEEDpqJvdcuaOn1My5kzZ6JOMrWSLDNSoCW9saxp06bhTeZF+miahSJfGhCuVXZjP8Eofmcqk\/Ly8lB2clJyvToNV6xcgcZ1\/rUN54QmEtrp5VeLP\/v8b7knyDGw2z7yI4ZwkGy\/eTvgcpv2AaJzn4R9EI18\/9ZPVf8zNMNtuN5666177733gw8\/4g0IVlK+YNh3r2laTIJ9pAZRMVGWFuDtrpZ\/bEgcSdk4kiX2BkxXuck7TY0e4FjM0svVb438fcbq8kfOYSfEu8RHzTlO1UoKixITEnjnUBtu\/d\/\/\/kfUxbMcV6FL0gG0adMGt9atW5f2NMPOiC8QCKBC6qlE1hiTuSjQFSBTzEgntWvXJl80bNgQXVLDIgiwhGu6Xb58OU5XkgWW26RJE5IyZVIwRqY9NfTAJNiyZQs7A5YCjRs3pkxvmzZtWrZySX7R1vLSEldQsx+94+xYKr7qavYXZD9r6kbA5Q+6grrp9QRdjmB3gKNDcrLP5BDaKHcSyg79VP0\/+yytQ3xcvPPfSsd\/1GILh32YGmcLt\/dk1RT288Q6+6iK94Myb4Vh322mjGvfC6xZhAL7ra+e8D6o124fcNpfVdc2ZWQUFRWvXbsWk5JG8RqmQ6bNmzfPycmhTJ7FuSgPG+JEwI9EV5IsORcnUoOaSbV16tQhPnfo0CHO+W1jDOv3+5mUnZ1NsqYl5c6dOxNm58yZQ7cU6KpGjRoIXd1HQXxmFqRMD4iVPpctW0Y6Zk1QOU6nZu7cuawPNawt87KePbr2CAaCxxzTxRvjKzcDLvuCK\/lmZ+NUH9jUbb26gxwNBEm4u3KCnXuDrnJ3kMNEr3NbYnXHVdmzD7Z\/BeEAaNmyJSmydevWGDMQCLRv3x7f4bgpU6YQQtVJg+TkZOSLEGmDbanh8P+4445DtQja6\/UyVF+1oEMK9EOBboEyHTLKkB4YMi8zslyUSjRWBk9yvnxMY0SMWPEyLdkN\/P777ytXrmQFiMz0xiJ69+6NxylTidaRMpMCgeB33303f\/58e9H24XR1lq9w+BD\/CgcEhiW0coxPGiWHEkLJnl27du3WrRuKJI2SWGlAmO3RoweyQ3w0wKFMQpFt2rRhlFiq7h5TMZauaIlVU5zf6CRZ41msSlbFjDSoV68eDiV0s\/RatWoRZnEoS2natGnbtm2ZC8WrS3nsD44++mj2BKpDFYGZpWHDhuqk8OrVq8nm6Ju1PeaYY+jHrHChXxAOKaFd\/cCBAz\/44AMKQ4YMefLJJ\/kgOVMFYdcgrI8\/\/vjqq6++6KKLevXqxQaD10iyFIiQ6BXZUYPOcBmNcRwmpZ5Kwum2bduowbZIUHXIXKWlpfg0L89+ggltmEpjaqhH35mZmQzpLZxw8W\/jxo1ZKP6lDdplSM9MwumJiYkInaksl0yt8i+rRw2RGaczZLdBG4TOkPVhcaNGjeIVvfHGGyhbrZgg7JIaNWpcccUV48ePp3zllVe+8847qr5SqPvP9IkTJ95+++18kPr06dOzZ0+2yNB0QdgVbHzvvffe4MGDQ+NViMsuu2z06NFqNyAIu4NUQWzliKpJkybHHnvsOeecE5pQGUL+pXT++ec\/9dRTBAoyghx\/CXuGFEn8nD59ujp+2mGDCZ8\/Ddfv4YwqbZi6y01O1e9yXtU+3CA8e8WaXc4I4XlVuWJjCs2bN+\/atavf+RUPQdgdCQkJ\/fv3f\/DBB4855phQVeX5y79nnnnm8OHDW7VqVV5erqYJwu7AVig4Pj5+z44DZTdV3oGw8sJtdmgcbqBGw6j6MOEedph9D1TsueK8DDn4Kyoq2sd+hGoL\/h0wYMCtt956yimnhKoqj73BqZLyb+vWreXkgyAIwp5JTEy8\/PLLb7vttgPxr9z\/IAiCEBn+8q9hGG63m2FoXBAEQdgjODNU2i\/sO9L5T1lZmd\/vLygoKC0tlTNfgiAI+wLOVLcwhsYrif2cQP4zYsSI\/\/3vf3379n377bfj49V3mQVBEIRdYxiGx+MZOHBg8+bNH3rooVBtJQldf7v++uvfeustCvfcc8+jjz4qNz8KgiDsgRo1avTv3\/+TTz6hPHjw4Ndff13VV4rQ\/Wc33XTTa6+9xvgdd9xx9913y5d\/BEEQ9gD+HTRo0IQJEyjffPPNL7\/8sqqvFKH8G\/Zvw4YN69WrF9z+QyOCIAjCzhiGsX79+k2bNlE+aP594IEHhg4d6kwSBEEQdsuYMWPuuusuCgfq3\/D538cff\/y+++5zJgmCIAi75ZVXXrnlllso3HDDDSq\/VpbQ3b7x8fE1atRISkqKdp61KgiCIOwZr9ertLnf94zZ19\/4T7HzY1kUYpwfLnQmCYIgCLsFZxYVFVGIioqKjY1VlZXir+fvCIIgCIcT+\/sX6hSwIAiCUCmQ54H4U+QrCIIQGeRpO4IgCJFB\/CsIghAZQucfJk+e\/Pvvv1M46aSTunXr5kwSBEEQdsvcuXO\/\/\/57Cl27dj355JNVZaUIPX\/yvffeu9fh\/\/7v\/9QEQRAEYQ8QW5U28WeoqpKE\/Bu+eS0mJkYVBEEQhD3g8\/lUYf9u\/gVDfvBCEAQhIoh8BUEQIoP4VxAEITKE\/FtQUKAKxcXFqiAIgiDsgZKSElUoLCxUhcoSuv9s4sSJs2fPpnDqqaf26tXLmSQIgiDslpkzZ37zzTcUunbtes4556jKShF6\/pk8gkcQBOEwE7r\/DAtTUEM1QRAEQdgDB+7M0PmHil1IFhYEQdhHkOd+O1OefyYIghAZ5P4zQRCEyBDKv8Fg0O\/3k6LdbrfL5VLTBEEQhN1hmibaRKEej2f\/tBm6\/vb444+3a9euffv2o0ePVhMEQRCEPTB27FiciTlHjhwZqqokofMP69atW7169cqVKzMzM1WNIAiCsAeys7NxJubcsGFDqKqS2L\/\/xn\/CD\/IhSKuCIAiCsAfcbrcqeL1eVagsO15\/k9shBEEQDg9y\/4MgCEJkEP8KgiBEBvGvIAhCZJDvvwmCIEQGyb+CIAiRQfwrCIIQGcS\/giAIkUH8KwiCEBnEv4IgCJFB\/CsIghAZxL+CIAiRQfwrCIIQGcS\/giAIkUH8KwiCEBnEv4IgCJFB\/CsIghAZxL+CIAiRQfwrCIIQGcS\/giAIkUH8KwiCEBnEv4IgCJFB\/CsIghAJNO3\/AUJPZuzBjpeDAAAAAElFTkSuQmCC\"><\/figure>",
          "label": "Content",
          "refreshOnChange": false,
          "tableView": false,
          "key": "content6",
          "conditional": {
            "show": true,
            "when": "QB2",
            "eq": "true"
          },
          "type": "content",
          "input": false
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
            "input": false
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
            "key": "b2_input",
            "conditional": {
              "show": true,
              "when": "QB2",
              "eq": "true"
            },
            "type": "number",
            "input": true
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
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "b2UnitQuantities",
            "conditional": {
              "show": 0,
              "when": 0
            },
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
          }, {
            "label": "B2 total price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\n\r\ntotal_b2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.b2_input;\r\ntotal_b2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.b2_input;\r\ntotal_b2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.b2_input;\r\ntotal_b2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.b2_input;\r\ntotal_b2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.b2_input;\r\ntotal_b2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.b2_input;\r\ntotal_b2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.b2_input;\r\ntotal_b2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.b2_input;\r\ntotal_b2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.b2_input;\r\ntotal_b2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.b2_input;\r\ntotal_b2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.b2_input;\r\ntotal_b2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.b2_input;\r\ntotal_b2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.b2_input;\r\ntotal_b2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.b2_input;\r\ntotal_b2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.b2_input;\r\ntotal_b2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.b2_input;\r\ntotal_b2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.b2_input;\r\ntotal_b2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.b2_input;\r\ntotal_b2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.b2_input;\r\ntotal_b2_semenSak_price = v1.semenSak_price * v2.semenSak * data.b2_input;\r\ntotal_b2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.b2_input;\r\ntotal_b2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.b2_input;\r\ntotal_b2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.b2_input;\r\ntotal_b2_price = total_b2_bataMerahPcs_price + total_b2_batuKaliM3_price + total_b2_bautJLPcs_price + total_b2_besiPolos8MmX12MPcs_price + total_b2_besiUlir10MmX12MPcs_price + total_b2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_b2_kawatBetonKg_price + total_b2_kayuKelasIi57CmX4MPcs_price + total_b2_kayuKelasIi612CmX4MPcs_price + total_b2_kepalaTukangOh_price + total_b2_kerikilM3_price + total_b2_lemKayuKg_price + total_b2_mandorOh_price + total_b2_minyakBekistingLtr_price + total_b2_paku57CmKg_price + total_b2_pakuPayungKg_price + total_b2_papan325CmPcs_price + total_b2_pasirM3_price + total_b2_pekerjaOh_price + total_b2_semenSak_price + total_b2_sengBjlsPcs_price + total_b2_tripleks9MmPcs_price + total_b2_tukangOh_price;\r\n\r\nif (isNaN(total_b2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_b2_price;\r\n  }",
            "validate": {
              "min": 0
            },
            "key": "b2TotalPrice",
            "conditional": {
              "show": true,
              "when": "QB2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QB3: Tidak ada tiang beton pada di ujung dinding.",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
          "key": "QB3",
          "conditional": {
            "show": 0
          },
          "type": "checkbox",
          "input": true
        }, {
          "html": "<figure class=\"image\"><img src=\"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAARsAAAFUCAIAAACbQQ\/PAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAG1jSURBVHhe7Z0HgBRF2oZ38myYsDmwu0QRFEmKoBgwgGcAvDsJZgVU9MyCilkxnOHMWRRPMGDOOYERswTJaXOYPLuTw\/9U97CsoJy\/jivs1uteX3d1dXX18L31fl91dZUmmUxm\/NWIZ2S8NueKbNenGkN2KmknQTjoM+56wuh\/npE6lujy2CEYFc3IWPLUOXtaPs7QW1JJOwsCrq8Npw0bd1HqUKLLQ5v6\/78UmoyMWFKXEdXF2\/3FItoMvSHDbPrffxl6Mre\/dts\/UZr2t5WmNfym0jR6kdlktFhyUo8hIYExP\/f88z6vT6v9VWqpIjZ+\/Li8vDw1ZTt4\/Y03mhobtTpd6nhbJDMSifjBhxxSVlaqEVQSEBq1YMaIrIXxdhql0Ws++N63qTGo1W2P9ol4Yp9+1v49M5PR7YmtRq\/9coX\/p02t\/7O0gT1y9uqf\/T9KM2iWrQt+vdoXjwVrTPv3GjwmdeLnSMTjvXr13nfkvqnn3AyDwZDa24xNmzZ98MEHWu2v\/26UloiXlpYefvjhqWOJHRKarBxLoMWfOvp1fPX118P22it18Ovo3afv+nVrUge\/jhNOPGnffUaEIxH1MBTVVAbeO26v5ngsZWqYoDZbv\/+FKz5d0piRsT07Iwq78ZS+s04ui\/tiqYRfgs5qOOn6dfM+qPqfpZ12RI+HL+4R9263NJv+6odrr3uKJ6XCNAi\/ip69es+ccVHbk4JIOGy12aaf8bPQ66mnnj7++ONSB7+O\/v13\/+mnZakDiR0Smk8\/+ywQCGg1\/0Ojhg\/f22L530HO1998s2DBgj59+hQVFsbjiVRqOyQzkolEYo8BA0pKSqJRYYsajSaYMG94feZBhd\/EtVt6JjRazQ\/rg43uqFa3VRP\/M8Tjyd0qzJXFxmR8u6qi06ysCm9sCuv+V2m9Skx9K0zJ2PYVT7OxPrKqJpSMB5Yn9u+51z+T0UDqXDvEE7HiouKBAweqTwrEw4ZCL7\/08vnnn6emqGhqbv7xhx\/+p0bhJuy5556pY4kdEunvmXj2ueeGDh3avXtlLPZrzbwmGAhEolGNYtsYWShhXv\/ajFEFP2MU5NOZCaU07GwPFBJOxKJJtbRfRTKpM2kzDNr\/XVokEY8kNzukvwLqZtRkGLUZQc\/i+AmDxs1IhoOpU+2AW8tj0mC11U08bCj8+uuvn3Xmmakkic6F9PdMYEB+v5\/Y7Nf\/vLTZwsYwbuXvl1mtyYiHE\/HWeDyw3T8yxP4XnYBGA09+U2lEUP+7tAyyJVrj4UCiNRDyeYPbPKP483q9tB3tn1T5+6WHlegsSD+jJCS6MiSjJCTSCckoCYl0QjJKQiKdkIySkEgnJKMkJNIJySgJiXRCMkpCIp2QjJKQSCckoyQk0gnJKAmJdEIySkIinZCMkpBIJySjJCTSCckoCYl0QjJKQiKdkIySkEgnJKMkJNIJySgJiXRCMkpCIp2QjJKQSCckoyQk0gnJKAmJdEIySkIinZCMkpBIJySjJCTSCckoCYl0QjJKQiKdkIySkEgnJKMkJNIJySgJiXRCMkpCIp2QjJKQSCckoyQk0gnJKAmJdEIySkIinZCMkpBIJySjJCTSCckoCYl0QjJKQiKdkIySkEgnJKMkJNIJySgJiXRCMkpCIp2QjJKQSCckoyQk0gnJKAmJdEIySkIinZCMkpBIJySjJCTSCckoCYl0QjJKQiKdkIySkEgnJKMkJNIJySgJiXRCMkpCIp2QjJKQSCckoyQk0gnJKAmJdEIySkIinZCMkpBIJySjJCTSCckoCYl0QjJKQiKdkIySkEgnJKMkJNIJySgJiXRCMkpCIp2QjJKQSCckoyQk0gnJKAmJdEIySkIinZCMkpBIJySjJCTSCckoCYl0QjKqM+DNt9664oorW1tbU8dpxcuvvHLVVVcHg8HUcQfC4XTOefRRp9OZOt4ZIBnVGQCdbrjh+iVLlqiHoVDoutmzb7nl1mg0qqb8EVx66WWzZ1+3ctUq9bDZ4Zg5c+YTT8xTD\/9U8FynTZu2aNEnqeOdAZJROz3i8XiLv4UdrU6nprz33vtXX3XVJZdcvHjxYjXldwNyBgJC+rTalKk89OBDt91228knn9TQ2KCm\/HlQ24i8vFz18I9jwbPPLljwbOrgz4Fk1E6PQCDQovh7OTk5asqgQQP33nv4\/gcc2LdvXzXldwNPsrU1oNXpc7Kz1ZRDRx\/av\/9uxx1\/Qq49bYb+a9ApbYTBYFAP\/yAaGxsnTzp28uRJVVVVqaQ\/AZJROz2CQkYCRlNmG6MqKysXL\/5y0cKPi4qK1JTfDcKnQDCQnZUN1JQRw4cv\/2n5k\/PnmUwmNeXPg0ajYWswGtXDP4hkMmmz29nZtEkySuLXEYtGsXss3rKZUduiNRDYsGFD6uD\/AyKxUDCUY6HsLYULM28Hp9NZV1efOvgT0OZw\/kGUlJSo7YLNZlVT\/gxIRu182FRVdc+995577nkXXHDhiy++FIlEY7GY1WptkxGv1\/vggw+uWbNGPQQnn3xKv379lixZyv4jj8zZb7\/9Bw8ectnll3OhmqENEO\/Ou+4655xzL7zwwtdee13JkKDwrKwsNcPGTZseeOBBh8OhHkLmA0cdPHDgoJaWFkTg+htuGDZs7732GnbvffepGdqjudnx6muv3X3PPXfddfebb76ZSv0f0GRnZS1e\/NXZZ58zdty4E0486cmnnkqd+TmIJ1999dVZsy6j8nfeedfatWvV9PqGhn\/8859HHHHUiSedjAurNxhnzbr8qLHjRo8efffd96h5VPhbWp5++ukZM2by2z4yZw4Xpk78f6DhV0jtpgmP\/\/e\/gwYNqqyo2PZf6xeBsgcTpg2vzxxV8E1cm7KJnQI01dGQ97P4xAGHX5QM+1Kp2wUPS6z\/+htvnHXmmamk\/ycefOjhmTNntvi33G7v4ft8\/923uw8YwFZNuffe+8455+wJEyc9u+AZNWXonsO+\/+6befPmL1u+\/OZ\/36QmghtvumnWpZemDjIy7rrrnssum6V2RagYPmLfr79evPfeI774\/FM15bTTz5jzyMOzZ19\/xRWXc+hyuXr32cXjdn300Ud33nX3Ky+\/pGYDr7zy6rhxY9V9zOyaa669\/4H7Hc3NagoYc9hhs6+7bu+9904db4MDRx30yaJF++2\/\/yeLFqaSFPzt8COee3ZBe9n85ptvz5h+xnffpn4BYDZn0mRccfllH3z44ehDD1UTtTqCMkM4FFAPy7pV1NakPECaj\/POP3\/D+nXqIcjLz7\/9P7effPJJqePfBqlROxOeeWbBmdPPgE6HHDJ6xsyLzzn3vF69+3y1+ItoNJKfn5fKhEb5vGwTiYR6CHJzRfww+\/oboJPVZocPp512OilPPfl0W7a5cx8\/\/\/xzodOYw\/428+KL\/3X2OZXdeyz+8vNEPN6+cPWtVyQaUQ8zMzNtNrtOb5h22hnQqWev3rfe9p\/DjziKU+172I87\/oTrrrsWOuUXFO01bPjgwUMNRvO777xz1NjxKGoq0zagAUomE9ApNy\/\/vPMveIjW5OJLqP\/bb705\/cyzUpkUOh1yyKHQqays\/NJZl913\/\/0HHXxoKBS87777I5HI\/vvt99DDD1900YyTTzkVscVJPuLIo6648qpLL7107mNz1BJeePFFyA+d+u+2+\/U33HjPPfcOHDTY5XQ+9PAjaobfDsmonQY+nw83j505cx59\/\/13b73l5rvvuvPrrxbvs8++JObkWJRcAoGAeBuL9aiHQA3xV69akWOxvv\/+e8jL7OtnG4ymqqoqh0O8PyUWumjGDI1GO3\/+k++8\/dYtN9987z13U\/jQPffirMWypXA0lq3NalMPKZk4Jx6Lrlu7epdd+n76yaIZF114ycUzOLV23TrVA8JLfOZp4apdeeVVy5b++PVXX37\/\/bfz5z1BCo7MdnwZ9XIIAFvuvOP2008\/7Zab\/031srNznpw\/T303gNuJK+jzeYYNG\/7VV1\/edOMN6P8\/\/vF3To068ECTgtNPO+222259fO5jFRXl8Xj0kksunn3dtTfddNOYMWPIVlNTM+XUqez845\/H8MiXXzbr7LP\/NXLkSFJGH3oI2\/8XJKN2GrzzzrsNDXUEAFOnTkkliXc1eedfcAE7bXEOUFt9my1l9ICmWt35z223DdtLkMRoNFqtNiIHv+JAvv76G26X85gJE44\/\/jglo0BRURHeIzvZWVu8cbVwuyJ6ICogCtdqdXPnPlZWVsY+qsWWJgBKQJg77ryLw0suuRSZKikpYR8UFxez5dCu9L\/9ItSG4LZbb+3Ro7uaAkaMGHHqqeIXePGll9k+\/\/wLq1b+ZM\/Ne+75Z7t166ZkyVi9ejXbouJC9bANer2ebXM7zxPcd\/8DELJv336wtC0WXb9uPdvizbX97ZCM2mnw9ddfsz3yyCPUwzaoPW\/qqxsVmDLb9hrl9\/vZ9t9twLRpojEG0UgkFo9h8arXt\/irr9geddSRysktUG26feF+5W1ym0YFcBNbRVgydtw4tV0H4bDQsUQijnytXr1mzeqVVlvujBkXqWdVLF++nG3v3r3aF74V1DdRlKMetuHQQw9mu3qVoM3b77zDduLEid0rK8U5Baq4tW9lVKg9\/uFQWD1U8cEHH7I986zpZrNZTQGbS8hUD387JKN2GjQ2NbEtKd661VQpkUxs6WEKh4XFtL0Y5dDnE4w66aQT23qiUS1Am60atKNZ9N21CUgb1MITyS0hWUQpXG3sASWrkdW0qSmugkBQMEqnE3k2btrItm\/fvgUFBeLcZqxYuZJtnz591MNfBEKa2vs5shQlUYW3SflZ9hw6VJzYDLuiz9tyNcUo5RFUoLBqv+WQwYPVFBVWpYddp\/1Vtv8aJKN2GqhGrA6PaA81PaTIggpVWGCZshV9CapGjRgxXE1RocnQQBiVMzq9MJ3Wll8u\/GeNulJ4G319fl8kHMzMyhkyZItFqvdXS0YM21La46OPPma7LYfbQ20UotsEWqsUdSoqFu+v1YdNbqmRQEGhYK9agfZQVWir30ptZbbq8y4sFB6jqlT\/L0hG7TTYrX9\/tvPnP6ketoFYiG37seGqIcbjKWeJJjkUCmE5he1UIlNBIh5tVtSpX79+bJ+Yt\/X4V5WKgWCquxmkPLHNhav3zc3Nbe9kqv3aLpcrEAz26NmTfQKb9tHLNddcu3yZGLO3nSAKqBrVFtuoCIcjDz74IDuHHCK6DVTpW7kyNZBXhfo427535pHZhhQJVUGTofZk4pyqKSr69t2FbV1dnXr42yEZtdPg738\/2mgyv\/P2mxdeeJHqaIFXXnn1slmXsdO+D9poEIbYXlhoazVaXXsnymazFeTns7N+vQjBJ06coNXpX37pxVmXXd5Gzueee\/7aa65lx+NpV7hRMGqL46S04pSs3+xkgsKCwsysbJ\/Xs2b1mj0GDOi9S1+vx33CiSd9\/sUXP\/744wUXXHTttddYrIJLdvuW7pNtoerPXXfdvWLFCgSHp1ixYuXf\/\/735cuW7tpvN7VDb+S+oqtzwYIFmzZtEtcodXvttdfZ+eyzz1XPsA2qF9deo8BeSlfNQw8+1KK0TcDpdH74oQiuPlC2\/y9IRu006NWr1003iZezd9xx+6DBQ48aO26fffc7+ujx9fW1JNbW1qn92iCuhPJtRk+ADpAjp8ulpgDa5tKyUnbWK6OT+vfrd91117Hz75tuHDxk6Nhx44eP2BeaNTU1klhTU9PWx03gwbbtMEfpWPd4PC2KmqkoRA2FdCShKz7Vf267lcR333kb6x88eOidd94+esxhaheL2iv4a1AV8r577xk4aMiAPQYNHDSYur311ps2e+78eU9kKYIzadLE4pKy+rrakSP3nz79rOlnnkVmLuHUurWr33r7bVHQZrQqL6\/jsZ91dUyffgYh33fffcMjn332OVOmTuNer736KqcWLVq0cWOKqL8RklE7Ey684Py7776nsLAIW3nj9de+\/OIzkzlz6rTTKrv3RLXarHzcuLHDhg077G+HqYf4YBaLcMN0Px8gV6L0X7s2f893+WWzbr3tP\/n5BatXrXz9tVe\/WvwFOnPa6WeUlHYLBAJthU+YcMzwESPaBjoUK4Nx\/S3+9qESBFapoirn+HHjXnrpZdhgMJp1Ot3BBx\/y5Px5sagoMCd76+649ujevbvFat135P7QcsVPy5YtXRKLRkePHrNo4cd77bWnmgfqvvTSC7vtvnttbfVDDz3w0IMPrF696vTTp5940smcnTdvvppNhfqmrrL7ll5BgIo+88wz5eUVPy1fet9998597FG\/33fRRTPGHPa3SDj0m0dLpSBHIf1+YEEdPwoJEPl89tmnTU3N8ATm9OnTZ9269cRKu+22WyrHNvjiyy+rqqomHHNMW18fWLTok4cefmjGjBntu7kaGxs\/++wzh8NptVr2Hj68V8+ehEA4XP367ZrKsQ3eePNNvU5\/2GHibWkb5j\/55Hvvvouoqm+oVCBZ2Fvv3r3Z3333gT\/9tHTZsmW77767enZb8Fuhq93Kyrhw46ZNBG+VlZW\/+IkK3t0nn366bt26TLN55MiR6DmJt99++5577nXggQeoeQB5Pvrww4suumir2AxA\/k8\/+6y2pobQ7oADDigpKaEduevuuydNnKiW9hshGfX78VcxqhMAN7J3n12ysrI3rF+7\/c6JnQ7S65P4C\/DAAw\/hUA0ePKiT0QlIRkn8uSDAe\/75Fz748EPcTo\/HU1Vdfdtt\/\/n3zf\/m1JQpp6p5OhMkoyT+XLzz7rsTJhxz6CGH9Nll1169d+nTp+\/MmTMS8djESceecNyWMYSdBjsEo5IZmlgkkBH1aqK+nesvI+KNRUMZGtkw\/SpGjhw5bdppu+8+IC8vT6fVFhUVHXzIIfc\/8OCCZ57SpOnj3B0Kf33PBNF6UqNfuui57Mi6DG16ZhToMMSjoUTh8AF7HxaLbBmysB105Z4J9SNfg95gztwyILXzYQdglEBSZ8yOJvVCrnYyaAwZkXgUOm15G7MdyL6+To8dhFFdBZJRnR4yAJCQSCckoyQk0gnJqK4Ov7\/l0UcfW79+Q+pY4o9hR2GU3mAwGM16o2nn+hNDP\/X6rT5321mwfv36a665ZsAA8ak8AV4qVeKPYYfomdBoNY5mRzgUJHJPJe0k4NfLsVhy7bnbfi76i9hBeiY+++yzRx6Z88KLL6rz\/nXv0WvliuXtZ1mQ+N346xmFkUUyTN89O3OQ+euEdntj+3c0wP5IyLcme9Lwo2fEQ1u+ydsO\/lpGhULhF196cc4jcz76SHxIp9EKzyASDg4bPuKrL79Q80j8QewQjAokTFVvXHRA0TcZO9XYc5AMeT6OTN798JnJ8A7NqJqamvnz5899\/L+rV4n5UvQG05YpXMLBo4\/+x0svvaAeSvxB7BBxFI19IqnNiGvjO9VfIq6NxHVJUf0dN476+uuvzzhj+sCBg2fNmgWdCPyMpsz2X0mBbuWpae4k\/jhkX1+nxTvvvDNyv\/2GD9\/n4Ycfcns8EIk\/RDJ1uh3Ky8tTexJ\/GJJRnRZ5eXk+ry+ZjOPj\/drEd6rPj4uuHkr8cUhGdVoMGzbs+++\/O\/+CC2LRcOTns\/9sBen1pRGSUZ0Zer3+jttvf\/rpZ3JzcyPhXxgdn0gkiKzUKVwk0gLJqM6PyZMnffHFF4ceOjquTHSeSlVAit1uV+dPlUgLJKO6BHbdte\/V11wTj8WikdDPJoVMJgoLCzrfZA9\/ISSjugR++umnf\/zj7\/bc3NnX31BQUNDeAywpKdmqM13ij0D+lJ0fa9euHT16THNT03PPPnvF5ZctWvTx8OEjIJU6cqptzSWJtEAyqpNj06ZNRFB1dbUvvfTyocqKff379Vu0aOHZZ58Ti4ppnCsq5MuodEIyqjNj\/fr1Bx44atOmjc88s+Doo8enUpWJ\/++55+4n5s03mcy5uVvW2JX445CM6rRYtWrVgaMOgk5PPf3MpEkTU6ntcOIJx3\/yyaKDDhqVOpZIBySjOie+\/+GH\/Q84oKa66tnnnj928qRU6jYYNmzYVqsDSvxBSEZ1Qny8cOH+++\/vcDhee\/31Ccf8M5Uq0SGQjOpseP75Fw4aNUqTofnoo4+OOnLrlaol\/mxIRnUq3HXX3RMmHNOtvOLTzz498IAtq7xIdBgkozoPzr\/gwvPPP2\/I0D2\/+PyzQQMHplIlOhaSUZ0BbrfnqLHj7rrzjvHjj1608OMK+XXGXwfJqJ0eS5Ys3Weffd54\/bULL7ro5ZdfUtdpl\/irIBm1c+OZZxbstddeq1atnDPn0f\/cdlsqVeKvg2TUzopEIjFj5sXHHju5qLjo088+mzp1SuqExF8KyaidEuvWrT9w1Kj\/3Hbr4Ycf8e03347cd9\/UCYm\/GpJROx8WPPvsoEGDPv3kk2uuvfbNN98oLi5KnZDYASAZtTPB39IyffqZkydNslgs77zz7tVXXZU6IbHDQDJqp8HChQuHDt3zoYcePOaYCT\/++MOYMaNTJyR2JHR+Rum0GTqTVpep1Rm12p1sWvUUPB7PhRdeNGrUqI0bNjz00MPPPfdsUZH09HZQdF5GJRUuWfSReMbydcEvlrSsqQ5ptFpdjk7wasedBPZniMfjc+Y8umu\/\/nfccfvoMWOWLVt2+umnpc5J7JDopIyCTiZNXKP9z1N1g89bNuSCpftevHzguUtHzPjpybedGrNOp9fs4KQKBkNz5z6++4A9TjttmkGv\/+8TT7z7zju77to3dVpiR0VnZBR0Mmpagskjrl49Y866FZsCiWSGXqeJxJKLV3pPuHXlmXdvytBrNbpU9h0N69atmz37+j59dpky5dSmpqabb75l5coVJ514Yuq0xI6NTsgoMbO3QXv6PRvf\/bZZzE9s0uHnEUJBKqNJrzfoH3y9+t8L6rTZ+h1KphobG+fNn3\/4EUf26dPnqquuzMrKvOvuu9evW3fxxTPlwKKdCJ2QUdpM3aJvfU9\/1KQ3GLbtiYBaGq3+hufqaqvDSFkqtaOg1WqNRmPb2mexWGzp0qX33nvfYYf9raysHCF69913\/3nMhDfeeBNdOvecc+x2m5pTYmdBZ\/T69JrnP3dnZCR+rWvPYNC2tITf+8GbYdHrtBnkSjOxKBDaasWCZ5AHhbHn2vPy8+12u1anw5FbuWLl\/Q88cOyxx\/Xs2XvgwIHnnHP2xwsXHnHE4XPnzq2tqX7+uWfZ1+l2VK9UYrvYIVZkCyZMG16fOargm\/gfXpENl09r0o25bNV73zrx8VKp2yASjp1+RLd\/n1GRFU+aTFpImKHjSkEGAX4SfhaxVQ7UX2jb34nMIc\/ixIlDxs\/IiETEQjKkJMWIu2gsGgqFW1pa3G437lx1VdX6DRtWrVy1YsXKtWvXxmLqrK6awUOGHDRq1MGHHLzPiBH5+flKosTOjc7JqNGzVr7\/nWs7jAKRcNxg1OVbDQVWfaFVn2cxFFh09hx9brbOmq3LMemtmRlmo86g15r0GoNeYzJsIRV3icYzItGMQKDl+8jI4gFH+lwNLS2tHrfb5XI1OxzNzc0QCTnyelDLzdDoevbs0bdv36ysrOlnnD5gwB5lZaWpUxKdBZ2NUUBn0f\/r9g33v15rFCT4ZUQiiTFDc+1WfU1TuNkXdbXEfYFYNJzIyIgrvOFPkZuUZqnbbUEGdC2aOtoMrc6Ag1dQkF9SUlJRUdGjR\/cePXpUVlZ2KysrKi4yGAyvvPLaySfJvrvOic7IqCzdR1\/5Dr58ud5ALPMLZIjGEpkmXdWcIfnlxoxAIiOaCITFX0tI\/PmD7Md8wWQwnAhFYq3hjFA0GYsnI7GfrQYveg51WoMmVG8Y1nvYuEyj1mq1ZGdnWa02C5GTJScrM4sgymA08ID4gTEcwWg0Fo8HAq2vv\/4XrxUv8eehEzJKdfyOuX7NC580Gkxbd+clEklM+9oTel41pTzhjyE\/Ivwhk7is3VakKDtt2Kog9WcLeb6JnTho7IXxUCiRhDiJRDz1H+C33ern5WH\/wrXiJToAnbCvLyl8t8Sc83oesEd+NBwhXopj7MkkW\/bRilPGdLvy+LJEawxjx+ATiYx4PCMeS8YjyXg4EQ8m4oF4vDUeb4nH\/bEtf76f\/\/ljEDLsj\/taAm5P0Ov1+n3+1pbWYDAYCUdoTVRGpeok0WXQCRmFmMANe47u3et3ve6kXr3KMjHsWCSp1WgG9c555Py+cy\/qqREMS2WXkEgjOiOjAKQKJUy6jCtP6bb07j2++c+Aj2\/a\/Yc7Bnx3x+7TxhYlUa1ocmsvTkIiHeikjAKQKp7EN8sya4b0yzpwz5zdemdqNcl4SyyBLybpJPHnoPMyajMEr0JKdESM9LPuOgmJ9KPzM0pCoiMhGSUhkU5IRklIpBOSURIS6YRklIREOiEZJSGRTkhGSUikE5JREhLphGSUhEQ6IRklIZFOSEZJSKQTklESEumEZJSERDohGSUhkU5IRklIpBOSURJ\/Oj788MPH5s7tIrNuSEZ1Tjz62GPTp0+vqalJHf918Hg848b\/ffr0swKBQCqpU0MyaifGK6+8cvsddyQSW3+Z7HA4pk2d+tBDD913\/wOppL8O9Q0NrS2+3r17Z2ZmppL+MHjA66+\/funSpanjHQmSUTsropHImWf966ILL\/ziiy9TSZtht9vP+tfZQ4YMPXr8+FTSXweNMuehXq\/TatNmbE8\/s+DKK6+cddnlqeMdCZJROyu0Op3VamVnw8YNakob9Hr9fffe89133w4fvncq6a+DOkeOwfCrM2b\/DuiVhUtqa2vVwx0KklE7K3Q6nc0qVpeypGm9ttVr1jQ1NaUOlCWAU3s7HkpLxQoMJpNJPfx\/IRQKLV26LHWgIL1PKhm1k8Hv90+cNHm\/\/ff\/5zETNlVV6fXGW265bfSYw\/bdd9+LLpqpzoyNiTz00MOvvvqqekl7vPnmWzNnzpwyZepll13+ySefpFIzMlatWj1g9wFjxx3Nfk1NzamnTtltt9332mvY8y+8qGZoj+XLlz\/62GM33HDjzTff8t5776dSt4tMs7m1tfWBBx4YP\/7oQw45dOq0aR9\/vDB17udYs2YtJZ86Zeppp59+yy23\/vTTitSJjIxnnlkwYp8RR40dd\/vtd\/DgmzZVjR03fr\/9Dzh09Ogvv1ycyqTgxRdfPPfc806dMuXGm25qbGxMpSq4\/PIrBg7c4\/kXXmD\/ySef2nfkyH79+59wwokOp1PN8AfRCec97zDgz0RD3s\/iEwccflEy7Eulbhd\/fN7z1atX77rrrqkD2mlzVji0uQ9No\/O4nTabbcmSpYMGDbTn5tdUb8rOTv2kGzZunDpl6kcffageqpgwcdJjj87Jycn5\/IvPR+47sryi+9NPP3ncccdXV21SM2h1+uXLlvbr1089bGhoPPe8c1944cVEfMs\/7vHHH4+Z9u+fyrMVVq1atfvuexSXFNts9hU\/\/Uwcrrn2uquvujJ1oOCJefOnTz8j2K5XUCc82PvOOON09mlKnnt2gZquPHiY1kM9vG727CuvuIIdh8MxadLkDz\/8QE0H3Xv0\/OD993r37q0e8sjPP\/cst0bbL7roQjURHH\/CifPnPZE6+AOQjPr9+EsYlUgmX3\/t9R9++N7pdL\/08kt1tbWjDjro4IMPzkgm9thjj7Fjx5Lniy++QLJKy8pXr1qhruFbU1O7\/wEHbNyw3mrLPf300\/bYY8CihZ88+ugjnMLi+\/btu3Tp0kGDh2D0RqOxqbH+0NFjJk+adO999\/\/w\/bc33njTrFmXkrOpuXnUgaNWrPiJ\/V367lpeXu7xePCgYtHw\/gccuGjhx6RvC8ofOGhIJBxkHz2ZNHEinH\/\/\/Q+eeOJxUhYseHbixAlKxoyFCxeNGnUgOxj3YWPGRKJRHmT+vHk6vWHjhnWFhYWbNm16+eWX6xsali1b\/vbbb9vt9mnTpuXl5mo0GaeccgoZEOdDRx\/28UcfaLT6I488ggxvv\/2Oo7lxzGGHv\/P2m+pdTjv9jDmPPNyjZ2\/KNBpNl19xhVarverKKyxW+\/p1a\/74unjbW7NMYgeEVqMZN24sf+xv2LgBMTnh+ONPOeVk9ayKYCjEFnVqW\/B3+plnQafK7j3efOP13XffnRTabBiFre+yyy4cQnWtVufxeDOSMfxJWnES3R43jFq5apUoIiPjggsuhE65ufn333\/v0UcfrRZ+3XWzr776qu2EIjTYnM3Kyr7hhhvOP\/88NfHEE0\/YpW8fVOWqq64++ujx0DiRSFw0Yyanrrzyquuuu1bNts+I4W+\/9VZtbQ3UhTDdu3c\/7zxRwuLFi994\/TVS\/n3TjWpOFfPmz4dOBoPxmWee+cc\/\/k7K999\/D9vffedtdBtnjxSelC104nlfefWVvx12GIcPP\/JI9aaN4I8zSsZROzHUtXrxc9TDNni9XrZWq0WvFy3mN99888brr+K\/\/ffxx1U6gRVKfJKfn6daWDgcTsTjmoxEaVk3mnAlS0Z+njAvrJnt2rVrFyxYAO\/++9\/HJ0+e3MZVs\/KWCVtXD7eFVqONxyL9d9utjU4qLps1q2evPqtWrfjhxx85\/Orrr7\/95qs+u\/RV6bRhw8Zzzj13wB4DodPRf\/9Hz549lYtSQL7YBoPBQFBIXxsefXQuW4JAlU5gyJAhY8aMgdefff65msKTqjuXXHqpSidQoBDJ6\/1Njsb2IRm1E8NkEmaNG6ketsGnWEZOjkU9xMViu+++I1WfKgWlV9tsTr119fl8yWQ8mUycf\/75OEtqoqp1cWVu60WLPonHosP2Hj527FHKyRSWL1\/Otl+\/LaHdVlBZvW3vOb7WPiNGsLN2zVq2nysWP\/2MM2pr6wSXBuxx7z33ZCST\/\/rX2U\/On6cW0gaz0ssXiUTj7SILp9O5fJmI00444Xg1RcUApRGprq5SD9UGorCo+OKZM9QU5DESESsjb\/uu\/HdAMmonhtksDCu0udFtg2ofbVbYoHR2DRo4UD1UYbeJnve2t64ut1gvOMdiPe7YyWoKQAPYGpRyNm7ayHbw4J8VAlatWs22T58+6uG2MBj0GZpfXvc+M0vwORIVta2uqmb72uuv77b7ALgUDodOOeXU73\/4\/t5778nKyhK52wEvkS2PGVXESoXL5fL5\/UZT5laCmaX0zbRF9Sqj\/n700W0NRywWD4lODvEaWk35I5CM2omhul7batRWK4\/oFNrg1KmHKghC2LYletzCzvr02aW8vFxNAapDGFO69WJRsd2qG4vAY9nSJewUFRWpKdsC1xS0N\/02LF8uOjlKS0rYqhkWfvxRKBQ844zpS5YumTv3sa1agTaYTCaNRpSpun8qkEEaiGQyqdR6C2Aa24IC8bwANWY7QpHHNqSeNJaGF1OSUTsx1JFyNOfqYRuMBtGEt\/UWlCor0v+0YsuLHbDLLn0xo9q6OvWwNdDKtrCwQD1UoY7JaGoUr3179OjBdvHin732mT79zNbWlgyN1qbk\/EVg6DAqIZYY+hneeuvtxV9+kZubP2zYMA7LyrqxHbnf\/jXVVQ8++MBu\/fsruQTq6xueeWZBe04qCxwbBaPCQt9UFJeUlJaWRCMhNTBrAzdiO2yvvdjymwSD4ucqLt7SBKCi6juGhoYGNeWPQDJqJ4YqPsprmZ9BdYraQvCR+45k+\/nnn735ZqoHmYZ8\/vx5MGHlyhWrVwu3TVl4mAt\/NgqhrLSMbXVNDUUdccQRRpN5yY8\/nHrq1M+\/+OKDDz4cc9jf3nnnbYvVrtcbVO79IrgXBNiwYf29995XXV0DDVAJGHL8CScoYdt5eXl5ZDtq7JFsV69a9eGHH7Z\/o\/PDDz+OHTv22GMnf\/XV16kkxVmlOVDWCt\/CqEyzefTo0excesmstevWsdPa2vqvs89ZtvTHvrv2HzlyHyUXEIWrP5EKilIJtmbNGjXlj0AyaieGv6WF7bY912p0hD2phyNGDD909BiM7+\/\/+OcxEyaeOmXqoMFDL7nkkmQiHgmH5s9\/kjw2Jaxqbm5WrkihvLwbrHM0N1dVV7M\/e\/ZsEh9\/\/LGR++576KGHvPfuO2efc6768ld96\/WLwCkl4PG4XeecczYx0u4DBvbfbQAMcbucY8eNn3XZLDXbwD32uPyKK5ubmyZPnjx4yNCTTj7l5FNO3Xv4iCFDBn\/77TdD99yrfedHIBCATGJx5Z+7oZfNutRuz\/vpp2XDh+8z6qBDBg\/Z8\/777iX9tltvURsL1FKtamO78VagoqKC7foNW4+Q\/B2QjNqJoUZBPX7eswyg0CGHHnrSiSeoh7TB85544ogjj4I\/Lzz\/3ONzH1u65Ifjjj\/hqquu5uyTTz3NtkdP4dSp7XcblOFz2mg0HFQ6qS+eOePBhx7ebbfdM7OybXb7Oeece8vN\/8ZTwvnczpcayFdlZeUeAwdh5a0tLWtWr6yrrcbHu+LKK1968QW120PF9bOvu\/vue7v36IkSznviv0\/89\/Gvv1pcXlF5yaWzPvzg\/fZvimgyEvEoN1WjwTb06tXr1dde6d6jh8vZvPDjD9euWZWVlX3f\/Q+0758sUcI208\/VuFJhlBpx\/UHIMRO\/H\/hJHT9moj3WrFn78ssvT5ly6m98L7lk6dKVK1bwLz5kyJC+ffuSsmDBs7hk48ePSyQSr7722q59+\/ZvF8CAW2+9ze12X331VW3DUslZU1uTaRbWXF9fj8WXl1fAk\/Z+1FbweDwEKgRUq1atcjqdRpNx1767Wiypzv2tgP58++13NTXV\/FqVlRVUddu+Purw2GNzi4qK1DfdW4HbvfLKK5uqqvLz8g477G99+qTGH6lYv349nuRRRx3ZvsLr1q2\/5Zabjz322FGjRqWSfi8ko34\/\/nJG\/eV49dXXYOMBB4xauPCjVFKXh\/T6JH4\/7r7nHrb77NMW9EtIRkmI\/rQfNm1KDSn4NWzatGnu3LkffPDBunXrGhsbf\/jxx5NPOfWD99\/TaHUnnZQK2CSAZFSXRigUvuaaa4YPH7527f\/oOL7nnnunTJly6KGH9um7a4+evYcMHvzEf8Xg8dtuu2233XZT80gAyaiui7feegsuXXvttZFIRKcMut0Opk2besIJJwwaNLiyorKwsGC33Qcce9xx77773oUXnJ\/KIaFAMqoroqamFp\/tiCOOWLLkR4NRDGUKtxt88Ivo16\/fvHnzfvjh+zWrV65ZvWr5sqVPPfnk6NGHpk5LbIZkVJfD\/Q88MHTPPfHZdHqT0ZR6j6QOrv0tMBqNv2+Chy4CyaguhK+++mrUqIP+ddZZzU1NcEmnE\/\/6GvX7qMjWQ5kkfh8ko7oEvD7fzJkzR47cb+HCj3HzjMqHVe3x2zVKYvuQjOr8eP755\/fac6\/bbrstkcxAmlRR2gqSUemCZFRnxpKlSw8dPWbChAlr166BS1t9CdseklHpgmRUZ4aYiWHzCPTtDzdr\/6GRxB+BZFRnxvC99\/78889eeeXVYXvvHY2E1Cm+fhFhqVFpgmRU58e4cWMXf\/nlnDmP9umzy6+RKiL7+tIEyaguAY1GM3XqlCVLfpw+\/UxIxV\/7j8xB2we\/En8QklFdCJmZmct\/+slqs592+hnsw6u273\/\/55gJid8IyaguhCuuvOqTRQtnz5798EMPfv3V4uOOPz4ei6p+YERqVJogGdVVsPirr264fvZ++x9w7jlnc7jbbv2fnD\/\/k08WjVHmVXWm44NwCSAZ1SUQDAZPOvEko9E897FHU0kK9ttvv3fefnvevPntZ\/OS+COQjOoSOOfc81avXnXvfff+4uSvJ5xw\/MUXi1n8Jf44JKM6P+bNf\/LROY9MmDjptGlTU0kSfxokozo5li1bPnXq1J49e7etuCHxp0IyqjPD6\/X945\/\/jEWjzz23YDvTvkqkEZJRnRnHHXf8mtWrHn3ssT333DOVJPEnQzKq0+Lsc859883XZ8y4+NSfr4Ao8adCMqpz4sab\/n3fvff845\/H3HrrzakkiQ6BZFQnxH33P3D5ZbP22++Ap56cn0qS6Ch0BKOSyaROp7PabBar1cJ\/YpuCemi12sSM8pqkVpOxc\/1pMpImk9Fqy1SeJYXND8Vj2QxGY9rnwd4+5sx59Ox\/nTVo0OBXX31ZTrHS8eiIec\/1er3T5fzoo4+1CqLRqF6nj8djGo0GpsXi8XDckNf43N\/7rY\/FDBqNNpFMkA1zjSfiWo02mSH+02hFVTUZGTo91yYSibj4upu6Y9lipYaE+NZbo+EEh+pDiTnokhnciHRRj2SGVqclA7tcm0wkNFqtUnZSp9VRjljUNZUzqRWLiLXlTIp7cTfSuUarFcv+USWNJh5vfXLN3qbeY+NhHw9FulY8lD4Wi4rF17WaIUOH9uzZM7r56yMu+VPnPX\/gwYfOOnN6\/\/67ffTRh8XFxalUiQ5ERzAqOyf7\/fc++PSzz\/rt2hd2GYziv+bm5oLCwlZlBSTSfM0by4rMlixLOBQ2moyNDQ16g8Gem4vd+\/2+vLx8j8eNyRpMRpfTRYaCggJyGgwGt9sdDoXyCwr1ep3H7bbl2gOtAchgNptbWlpgb0lJCVtMORwOu1zOgoJCk9nk8\/rMmWayRULhzKws8a1rIFBSWiJWcU4m4\/F4c1NTfkEBeVr8LZRMZaiq2ZzJJW63q7CoiFtTrE6vW73JZy8s57mgK5UpLCzgErJlZWV9++23PXv1mjLlVK9HLN4O\/lRG\/fvmW2ZdeskeAwe9+847JSWSTn8NOoRR2VkffPhRXW3d+HFjuZnT4VCa+bjFkhMMhuBGU2NjIkOXbbV7vV7afr0BAzZkZWW7XS5MkPbearNj0OT0eD2tra35+VitX8iUVptpzjSaTLAlFAxixzk5lBnMzcuNhCPcKDc\/LxpBISIIUVZmFiUjcW6nC+vnJmigsj6XBv7Y7LZEIgk5UShzZib5KNbR3Gw0GsgAYVA80psaG0yQ1ZzZ0kIFEmYOjNrsLDMNBHmgYo4lJxQM5eXnwatPP\/00kUwee+yxfmXtV\/AnMQpun3fe+Q88cP++I0e+8sorBb9t8RuJPwMd1DMBhVpbWxxOR0NDg8fjMWWasTyPxws9vD5fOBLWahJBv0uXiOTnZumSEXdzncdR53M1ZJu1udbMUIsrHvH7PU3JaMCojUeDXnasOUZrlsHZWN3qbW6q3WA2ZuTZs+LRlljY53HUJ6KtOk0kIxYkc5ZJU5Rn8TjrW33O+k1rdRmRXIvZqIuHWzx+d2Mi2qJJhLSJcCTgMRuTRQVWv6uRMuur1pJuyTaYDclQq4uUaMiXjAWpAPUxaGLFBTYKdzqa6mprYTiChi4hR+KhvD54LNw+4Uamuc3aCl9\/\/c2IEftApwkTJ73\/3nuSTn8tOq6vr6Wl1WKxZmdn5xcWoAkEJCTSeDvRAdxAg4EGHjnBl\/N5vcgXQlBcUkJOjBIhDQaCTodT9abIibygQnhZBN9Go7FbebnX7caIyRwOR7weIWXcjsCGa5EvaCyuzcwsKSsjXoIAaE40FnW73H6vz2q1chZ\/j5w4hDT52Tk5hcXFUAKGULdYNOb3+10Oh1gdTJNBpIfU4Cm2tLZabaIjwp5rdzQ1U2YiHg+0tvJQQtPMwrFUH\/\/PQH19\/fnnX7D33sO+++7bW2+97dkFz2xnrUGJjkEHMQpDz8rKxHVyOh0YNHERkRLmm5efL9wwt4cwBsNVugUyMFCDwYjLRwaCGVwvXL4c+GGzuJxOqIKZ4ozFolGbzUYURLyEu0hRmDIMwY4LCguIqeBAJCzCpGgsZrFacPA4pDSK0ui0IlTT6wsLC7mWUA1fMTM7KxqNwSUyQCp8UWQHNNTXUyuivkg0CtuJ03D2YA5MtlmtPBpl4jsT9TXUN5CHHYPR6HK71eViFZlKM6qrq6+48sqevXrfddedhx46+scff5wx46LUOYm\/FB2nUbFYHDfPaBS9AhgxZCjtJpYiz8nJzsrOor1HYVAwoT\/xOCKDvWKR8AoTL6+owCq51mqzYaPIA40xvhRKhYZgslyCmiF1iBUXajRadQVyrF8NgRLxBMQT7qVOK8K2eByxQprgOlTUanUQFdnkWorivhAM3UR2iNAKi4rIQ3pubi5xE7yF0hAVAQxHIkgc8RUVhsD2vNzS0tJkIsGDZGdlIY\/cPb0+32effT512rTK7j1uuP76\/v37vfDii++99+7AgQNTpyX+anQQo4THlZWJRRqQhaIijNLj9ba2tGKI9XX1WDa6hE1rtKI5xyLzCwt1el1RcXEoFMa1gwycJVxBx6AK\/l4kEsW44WFRcRGEKSiAFdrmZgdqFgwGGurrBBMKC0mEHpi3z+fLz88XnLRaoSgOJDkps6mhkW1hUSGmT6SXlZ2NI2q322Gsooo2VJG7U2F2IG1efp5QRX8L3EMki4qKKiorUbLSsjJNhiYWiVAI96KqPBH6Bqk06aDUihUr\/n3zLQMHDd5vv5GPPfroqFGjXnrp5e+\/++4ff\/97KofEjoEOYhRGhW1hYRCJ5h\/NwSIxd6IgbBHZQTS69+zR1NiEt4ZuEBy1+FsxzW7l3dTGHjvOzcuFliT26NkTE2+oq0skkkaTicubmxx4ZQAiWa02k8lcVFLsdDgo3GDQV22qwtXEE9PptM2NTbh1FEvABtOMJmNZWZmj2QGpsrNzqjZupDR4qzfo4Q\/VgzCkQEJ0jH0kkacoLi2GYCjZ88+\/cOFFF5108in83f\/gAytWriwoKISNJaWlxFoopEarvE\/7XeBZFi9ePHv29UP33Gu33XabdekljY2NF1xw4bfffffRhx8cffT4VD6JHQkdwqhkhlarwc6qq6oQCjgjGJKZCaMIOQjxOQyJCMeBJwZDIAYcsNlt0AZrzsrJwa8jZyyKKvAXJW7BDUNPoEFzYyNnIQCeZHZONnoleGI0QphYPI7TSJyGrNns9kgkDB\/QSSIo\/DRcRFjKHwxPJOI+jxe\/jgBMrGEuQiMHIVxDQ4PJLPo+dDpRCHJHVRG3eCxOsdOmTbv44pkLnnnmu+++\/fyzT+c+9tjkyZNnXX45F9JAUFtkFulL\/Qi\/DfwaBEWPPDJn8rHHVVR2HzFixFVXXVlbWztl6rQ33nhz44YNt9\/+n6FDhqRyS+x46CCNIkRBf4RK6HUwAVYQNWGaLX6\/IkcteIPYLkoCzZxOpxaZghYmE2zBtaO1djQ1IRRcodNq1aE9nOJCfDa4h6OI8uDLcXltTQ05Q8EgebBonVZHuBWLRR1NDniIuwg3mpuaYVR9bS2CgwcJQ\/SKLhHsoS2wFOJRQ3IidAaDsbGhXvmpNKFgSOn390yZehqmr6xzkdn2p9ObHn\/ssUsuuZQKQD\/o3b5TAp8WgvGY3DSVRCgYj2\/YsOHNN9+aff0NRx01FhYNHjz49NNPg6g9e\/a88sqrFn3yyaaNGx6d88gRRxyembn1mhoSOxo6hFEaYTcISHFJSTQSxc44jCcS9rw8nCJkp6y8W25eHqwzZ5qxYEy8W3l5FHYpXQ4092rwA51KSkpQALwySIVxu11ucioDl+AUG9ETQJzmcXsonDCMAsVbXZ2urq6+sLgQRULkUExyJhNJMhA1IUpULCsrS7zVNRpra2rRQ4vVEolG4WcymQEb8R6VTg5dWXlZaWnpnEcfW7liORSC1alnVIBXqTeYXnjh+ffff3+PPfagZOqDDhJ9EZtBpWAoiPwSFD3xxLyZMy8ec9jfKrv36NWr15FHHnHVlVd8+OFHu+6666WzLnv1tdfq6moXf\/nFddddu\/9++7VnoMQOjg4aM\/HRxwtXrVx1+OF\/gwbEFTT\/+FIwBwvGysmJpKBIolcg1w7HwqEQjhksgVdGgwFhycnJFt0b2dloHQEVQQ5b6o\/KZWVnhYJhFAAC4BRmW3IUeclHrBCl5uYmm1WMWKVw1IEbsQ9NIQPylcxI5OcX1NUKFhEawVsqhnjCWYSRnFQSVUTrcF6J0FBVl8s1cdJxeJ6cVR9wK0TCwQMPHHXPPXe\/8PwLXr9v990HrFq5csNGgaqqquamxlS+jAyrLbffrn2HDh2611577rHHwF137Wuz2VLnJHZOdByjfvju+2OO+SeUqK+v0+sNwUAQ0XA2O\/AD7fZczBdTdrvdtOVCYew2e17uujVrSQwEgiWlJbiCMArXDiagPG6nCyoSdRBr9ezdu6mxkQfhkBiMlEAwqPY6wBnIiS7hQULFHj17hCPhFp8fOUOUKBDdI6faF5+IxVoDrZCqob6hvKIchsIxbodDiEpApEyzuU\/fXd579z3iJb3RjISqD7gNKExR11i7iVo12pKS0u6Vld27V+JYnnLyKX369K6oqBCvjCU6ETpuXB\/N88EHHUSTT1yEIGDENPOIBn4ROoMTiHnihiE+eIkvvPgSoQUZYALMwZvCPsNhIRcoUSgUzMrKRpRgC5xRh7HyINAVbSEnGgVb1HdH6i3C4RB2jgzCukg4TE7iN1xP0dcRjxOfQEMEk2AqEk5dG0FrAiozTfiIhFhciJgU5Oc\/Nncut93K5WuD+pPus88Is8lEWzBu3DiisuKiIjxbq9WCc\/rSSy+ffNKJamaJToYOYtT7H3xIGz982DAslbCehtlNk5+Vyc0xetHzZjDAMb\/fb7HkXH3NdQueeVpcqdFhnoiHUgxos2B21EQ1hTxqQMiO+jjt09XEthQNcpGR5PLfm1OjQzm387tBxbKysoUffbhy1Sp\/S8uxkyejhPwaYkhUIhkMBv+8rzkk\/nJ0SM8Exii67IJanfg4SnRth8M6nQ6dQbKKS0rIAMHQGavVWl1d88KLL2p1BoPRDJ3Qh7aeNLF6rBgNiCm3cYx91bJJaTN90D5d3WlLIY6Lb94Hbekip7pGrfInbkdVN+9n6g0m1JAdVQa31xIlE0OHDoF1mzZualWGX7S2tvLI8dh2r5LoFOjQnokjjjicRHy50rIyvC9OwStYRAqqBXlwCFesXDVp0iRsl5QRw\/f+7PMvYJ3S55YkLtl\/\/\/0P2H9\/rBPHTPTj6fXVm6pzrOKrqoKCfPWOlAwRuAQ7RgZx7eAA0kdOvUF8cMEduS+hFCQX75r0eqVHJJfyH354jsfj1um2fomUiMfzCwrw2davX6\/VcrVO7eHY1vGjDol49Lnnnhu+994fffwxLuXkyZP8Pr96lvxUT2pUJ0bHMerHH36YMGECTMCkMOvyioq62lpHsyMvPxfvCltvaWktLCxctmzZP4+ZgE0TwOTl5VVXV2O+ajkUmJ+X+\/LLLxHftwZac3PzKMrv9+XnFxDhwJ\/SbmXEWg11dWRW3ghHCbqItSxWKyFSQ0NDYWERFYA\/hDRms3mTMkKioLCQ8Ayf7qyz\/vXGm29BGMIwYjM4qd4X8CtRDaKsUCgcjYRHjRql1xvef\/9dtBRWpzKp65olE1OmTp1x4YVc8u1330eikWOPnSwZ1XXQcV4flgpJvF4v8RLWuX7tWiKo3Fw7HIgnkBFjfn4+HEB\/lMxanKWqqqo2OgFst7m56brZ1yMvOFN1dXUulxMJgnUerzcai65csXLNqlWhcDgai61fty4YCkE8ChfUdTgjkWhzc3NjQyO+V3VV1ZIlS\/wt\/ngiXl9XR7RzyilTXn31VZgcjYR27bdrWVkplUndWKk\/rQB0Ygd+Wa22O+\/4z4knnqT0ZIgFztQ\/q8Vy7rnnXjxzJo9JHXR6HYxVLpHoKuggRgEMiwAdqjgdDvQBlRDflhuNiAnOntPppPHGAYtGUTZhguRv3\/ynoNF+++23GzZsIEqJx2JmcybRl1arQXa4MDc3F8Gh8KzsLHNmJmX6PF7OQioSEatYLBoMBchss9sLCgosFiv6Rlw1ceLE999\/jxgJVgwcNPi8c8\/x+\/3UIHVTBdQHqPuwl7rd9p9b5z4254zTTz\/66KPHjRt3ww03vP3O21dccQWCabXZcAuVunXcLyyxI6CD\/r1xgeAABolR5lgsSATmTquPcbscjsLiIqKmQKDVZrPp9Wr\/3q8CiSOqoTQ4g6CxjYQj0NLjdldt2oRTFwgEXA4nOUtLS3EUKcxut0PmrOxs8iMviM+G9evZx9wRqHPOPW\/p0qUqnXbp23f+vCd22WUXv7+ljT\/bgtAuOycHl3XPPfe6+JKLb7n55jvvuOOQgw82ChVt9vp8RIZwm6pSiOyM6FLoIEZh6MlkAiNjx2Q2l5WVYW3QDIs3Go3JRJJtrj23proaQ1e7qcmJy6Rc3Q7JxK59d92l7y4N9fUej6fF77fn2jMzs+LxWHFJCbqHrUM25E58XxgJc0e8x6bGRhiFTKmvkvMLC0mHw5w6Y\/r0b77+WqXTgD32uPeee\/Azi4uL++\/W\/2fvZ38Oal5bU0Pk5vP60FW32x2JRilQFbJYVIxzh67KU0s+dS10CKPE2HMt0tTc1Iy8NDbUK+9MkyQWFReTjljBDaPJmF+QD0\/EED3lo72iokIMHasUZSST7BsMhpNPOgFDzS8swIsTw+1a8K2QOh+H2TnZ0UhUdMrZbOZMs8ftgcY4eJSGTEFaHM5oVMzoUl5Rjus4deq05cuXG1Q6DdhjwYIFIpaLxcrLy4+dNJGbRsJiXDz334obZpNJDFHPSJaWlTbU1eNVNjQ0oIFcqzfoi4qLOBuLxyA2FRbPL9Fl0CGMUqbUE5\/u+VvEOFe9eJ+Dg6e+qMHs1GHaTofToDfm5eXR0mPBWo3mhutnHzjqoFgkhMUrHQb97rnnniFDh9bU1AhSFRSgSPV19eygS1pldr7MLPERO0EOTqDSLe4nSEO79DodAoirhqARbtXW1F5w4YVLlvyIOkXDweEjRjz00IMGPE69mPBoxU8rCI1mz56dm2vnvtFIEMUzGA1tpPK3tNAo4EBCpLAyRJ3yUdS8\/Dyvxwu3AW1EZlbmVsGYRKdHB2kUDNFotOUV3TA1vD4OEQrhJtHeZ2YSBaEqpd26YdDqpxykY6k9e\/SYP++\/Dz344N133\/3oo48+Pnfu+PHjVWXIyclG8bxeb0lZKToQi8VxIyEt9MW7E6KUmwsNCooK0T0UrKmpGbGCxtCGqyZMnPjTcjF4HK6OHjNm3hNPdO\/eHZEJBoKN9fVZ2VQta+LEia+++uoDDzxw\/\/33H3zQqPZdf0gQlYSW7Hcr7xYMBuBqNBJxOV1WqxXJojLIHQRFk9VLJLoIOkijkBTa+FAoTPstfLyWFovVikYJMij9yzCtvq7W7\/dj9Op8sXhQrYGAy+XG4g8\/\/PDRo0fjtqFm4XDE5XLV19YhCIl4gmwkxmMx5YtD8VkUjEK7dFod20BrYOP6DYiS6PGLxzm1atWqSZMmr12zRqXTqFEHPfzQgxQCkzdu2AAf0De0iDIbGxtz7XY47HS5Xn31lbiYtjYlONQW1c3KFqFgOBQOBcMIVDAUUmMz6smt0UycUW4qnl+iy6CDeiZ0Oi3Nv9fjKSwqwhYxzWZl2jC8PlrxiDIGgpjK5XTAigyNGCFhNpvUl1EYekCZZEK1Wqy\/oKAwEAxweY4lx9HUhB1zFcW6XS6NVosdEz5h2VgzGWAIGlVQWMjhkiVLzr\/wourqKjV2OuSQQ2+88XrYTiiGh5alqBzVoBzCrdLSUvTzhhtvvPKKK\/ihuJywSn0cCAPfioqKoRa3KyoppjKEfwgvO7QLPE4oGNIbDMrwCxlHdSF0EKNwhGi5iT1QEjH0OytL9dbQBDhABnhSU1Xdq1dvZIdDWvVoNIaxYuYlimWrQOK4asO6dd3KxUwVTchIXl5Lix\/+wBzoisThOlqsNriKIlVtqoJsRUVFPq+vvr5+ytRpVZs2GoxmYqdx48bffdedhYWF0CAzKwvRI+7qVlFeVSUugZ86rfaqq66679579QZTLCYIttewYfGY8P24dc\/evQiiqCe08fu8cAz2lpaV0QoIoVO+qqRARBl3V\/wEEl0DHfWPnUzipKE82dnZuENYKxYvOp1BWEx5ifXDh+bmZvHZhdKqY5qQR6vR4sg5HI6I+I4+0trSmsxIwjHIhpIQfRnNJjgJRSkcZXCIEiLxaJSrQElJCVxFHletXnXG9Ol1tTWCTpHQ2LFjr7\/+OjL4fP5wOIyqIE1oZ2NDAzeFZga94eZbbn3qqacEnaLh\/IKCx+c+2r9fv3hcDK2Cb46mZvZJV5TQgjRpdWJ8oMftVkd+oHsZCfFN8fZfr0l0MnRc84nFY4KYmtVijcfiOEWFRcITo42HZgiF+JTDZoUkaqNOfmIttq0BMd6PHazWYrX4veIrWiiUl5dvs9ujUC0cNSnAq7Ta7QaDHkm0WCwEV02NTajWuvXrzjzrrIb6epVOx0yYcMMN1+v1BjSECmRbcnBD4RLMFB0kpaVGg2HWZZeJ3j+jGToVFhbdc\/fde+45lOCq7VlgUX5+AU0DdyGUQpdoGqKxGO1CTFEndDUYCsI9yacuhQ5iFIaF34Xbpjfomx3N6AYSBKlIKSgogBT5+fmImLPZwSn1EvgjeqLDYeSCcAXpICeJWdlZpWWlHo\/H6\/O4HA6FeBbxtrelxaQMNYKQubm5GDSFlFeWk47\/VlFewSF0+ucxx1x91VXkIT3VJZidAxPw9yBnSHx7ETzzX\/966aWX9Ar94O3999+\/7777hkMRGK5UTa2bBxVyu9yqi4g2opE4gVQYbqfeZZtMnFIUV6KroOM0CoGCQqIvzoTlmyu7d6d1dzmdRFbibCJBUGSz2ziFaZICtaAfh+WVldCmxe\/H91OUKgOPC4KVlJRiuJg1RoxqkLOkVEzAQgqCw+2wZjgJc4h\/nn76qYqKyhNPOun6666j\/CxlZrLW1pbG+vqoMkOL39dCIXhx199w4+uvvSbUKRIiHnvq6SfHHDa6XozKdXi9HuVRxMuAHGWmW+IlQUEeSkR5WRXdu1MZwXaPyCkjqC6Ijvon12gwO3wq9pQxeJ7mxkZVqWAUbXl2TrbNJpZ+Ir5CAbjCaDRAGEyzuakJMyUnJcSiMbLlWC1QC7N1NIu+Qfbz8vMha3NTM64jHlcimSRAsuflCTtX5gmEgY8+OueyWbPEJ1KxOOLmcbm1YuaWDAiQm5ebm2eneqeccuqCZ55WncNu5eXznvhv7169161dJ1RJI7ooNz+NkDiPx90aCFhtVjSQa4nrHE1Nwo\/Vi4cy6PXZ2WJSGvUSiS6CjmAUVoslms2ZmBeMwdrQB2ggOuUsYoJ\/mIC\/FxXvcERYotn8AsftdBYUCk8Pk4UY+HIQrKmpCRUi4k\/EEziKZONC5CvHYjUr09nBz7y8PNy\/xoZ68pMTARQ9H4VijEVDfYNWp7Pl5qqJlIlGIWWN9Q2nTpmycOHHBmOmSqeHH3xwjz32oEAUyWg04luajKlFOGE79eeJqDy+IjSmSoXFRTAZ6mZnQ3lLc3MzXOUubTyU6AroCEapBoUJ4rkJAUkkxLTJ8bjdnhsKh9kpKi4iQzgSQSmSSZFTXKXRYKDVVdVwQ5m5ksg\/nFcgvhQMh8KYMlQhBeGKxqJms6mhrg7ZgSE4dYFAgJhHLV\/t+QiKtWkC2D1uIa5mQ129WgKphGcQ4PwLLly0cKEYlBQJ7rJL3zkPP9y7T2\/Erba2VhW6YCDYJjjUGVHi7gnlbbXRZKRyVRs3cQrHlagvJqanLTQajNxCfRyJLoIO8vowQcyutKzMZBTDYbOys2ALZFAly2A05FgsWCeOk8Ggh0zKJWJ4q3DqMjJwBSPRKEzQ6fQwgbDH5XLBTMSBMklBoBSXUswDg3YpK03FIQ9M8Ht96J7P64OuuYofSLCEPMIH1Eml2Vlnn\/Pll1+ooyh69Oj52GOPDho8OBqNwQrxTWGEm0d9Ph9UEQ+jvOHlKnGo0YiHMpnJCdV5TIgHSz1uNySHzMooJKlRXQgdxCgEB5cJQ4QJTocDWUgmEqTac+3l5aKTDTMsr6yAJA0NDcmEGAtHBjITdInRcYkE4lNUXJypTDqLS4ZrR3xlg0XJpNfra6yvN2dm2ux27Bna2O22wqKipsZG3EJEA0cRcycDNGhsFKFOUVGR3+crFgVmzbj4ko8\/+lClU58+u8yd+1i\/\/v2phvJqK1xcUoK05lhyrFYrFFUfh8KgYjgcwr0Un0sSlbk9VA\/i4R\/C7fKKCu6CfOn1cux510KHMEr5miMWi9bUVJd16xYJR3CfcvPz4IxWq3O73RhiIpHEFYQMNptd1Si2IdEVEbXn2VXHCf3x+1uIgnDGTCIuKsKy2UeixCDX1lb0B1WCt1zrdomx582NTShJSWkJjh8MRHYI4XxeLwEbVFm\/fv055533ySLh7EGnQYMGP\/nkvH79+lVt2si9SkpLyUlQh\/4EWgPcse19FBWGsegi92qory8r74bUETLl5+fjo0IqHgoFpjY6XQe1WRI7CDrk31shiM\/nLyoqptWnpYdRjmaH8JGCQTxArVasgFhWVkaK1+NRO51hkRiLoNUgNRwqH0dkEZYQ+heXluA9Ol1O8ao3O5v0aES8LKqvq8OsyUkeMcmRVksAhkYhIE6nkwLzC\/Nb\/C0wpKmhkXutXbv2q8VfarQ66DR8+IiXX3nJoDdsWL+e6hUWF+Hm4R86HA6IBHNIpJLiSZTviGkXnM0OnEmYiadntVkRK7fbJRa5UVaswkHluWUQ1dXQQS0o5ouRmczC8cPIIJLVaqEtxzRjkSjeGkSBOZyCYBlJMfY8Ho9hka0trQRJGmVdHEwWN49LvB4v5m5TRq\/jj6FjKpFgIPcSkhIImOGZ8hl8U2MTxOBaDlFLpJKzBHWcOvLII2+95VacTNTpgQfuR5eMyve\/OIhajZhakDw6mKHXQ0vYocyBIUB6dk5WPBFHgvA\/I6KLIsGjZWfnKF\/ri\/lo0VueWgimRFdCBzEKu1S6sxuIRrR6XSIRdzqcfr8ywlWMNPUHWlphQm1tDVKjdvcZjEYR2ScTLqcTEYBC0KBVBP2ewsJCghzOFhQW1NXUQj8R4SjjGHAU8fcMBn00Kta9tlgtYtygz1fZvXtzYyNconxcUAokyKnatOnIo46YO3fuv\/99EzEVLiX36tGzp9vlEoy12chJgV6vlzJj0Ri+ovo4VLumurqye49oLCbCObsdXzQei\/FQEDsQCBoMYuECyIlaqpdIdBF0EKMSxEkZGagGvhPWTLyDFebm5tLAY7Jssd2GhobKyu5wT32BQ6sPQ4iLyFlQkC9G68UTqIbVZtm0aVO38nKCqIb6BhiCV4mJcyEBVWFxsd6Au6fze30FBQW11TVWmw0G1tTUkB+1QTQScdENSEBFaNTaGhg+fG9ip\/Xr1qF+xE61tbUUhdOIRiFo2TnZRUVFnILhbS4c5ZRXVkI\/Ko8W8lDsoIF5+XncDu0NhcS0MHASNZMjJ7oUOugfG1vEgrE8jBVTo+XGKJEsxIrmXHwrpdVaLZbW1lbiHNVsCa7IjM+FgYo12CNRKIF0QMhcZQIWQqNMsxlnMhwKY\/HcIjsnx+VwtPhFF4Wawa5MMoHmJBMJfD\/8OvLHxOhYS6sY9OCBzIhebU0N\/EblSBG9DsVF1ATWxWM4q+IrRqIpKowrqFQtg\/qLbhKfr6i4GA1UhYii2NIu8LRGo4GbBloDPKzomZHoMuio5lOZp4XQiIAHx48tBldYVISxhUJidBL2HYmKF7VELKmeiYTSM6HROB2O\/EI0SizAQQrCAe9MRiMShyIJzVFGP8AimIliWCxi7Tb0h0uItwxGA+pR2q0MPhP5UA1COLfLSfn5+WIhULxHroJLer2OQsrKyjhFTZE+qopOUjFkSg2r1KfhjjQEJWWlsJ1iOeQROAvhi0tKxKu2gJiaghJoEiSfuhQ6iFFIkM\/rw+tDnIiaaPX1egPcIL20W2ryCfwrr8eLgaqXEJlgo2gF7hb2rS40qExBkSTo97e0+LxeR3MTUqbIlPiWFvJg3OFIGH8Pg+YuuGGhoJhExSXmlI1YrTbITFykjujDN0PE7HbxeWJeXm4sEoWKRF8i3LLZED0ISQ1hNUKEBKFyStVIEF8fe93Q0APJdXodlSFygz9sqWJZeRlPF4\/HuVxKVJdCRzFKmTcCTwleoVQEGDTwmCkIBsTQWPQEf090hQv\/Tbz8FV8YhuGAVXw1KBaTF0yg1TcaTcFgAN8RicsvKKRACOn1+rItOcXFJRg3dgwrEsmESkX+8OjKysvxwSAebiF6BuUsFgsco0w4ptfpCPQi0QgVK68ox40Mh4KQEAnKzcuFc+QMBISbpzwNXBND3SsqK2Eb1MJvJJV4TziBoTCZSeQUVRURoaRUV0JHeX3KSCJcIwiTV1DQJIaTK0vEB0NOp4vmH6eNQAVuYPcQDKPFrSouLVFyhjF6Yf0eTzwuPiXU6sTgVwp0NjdTIBfi1Hnd4sMNlUJQt7WlFSaI8eJaMTs0riOWjXeHVwa30RayEVzhSfq9YmEONWbzo2ZOVzQWJXwqKCzAReQQinK7oDJxhfos1Fy0Dj6f39\/CXXKys6FTU2MTrYBaVZfTiTMpIjE5F1IXQ8dpFOaFdbvdLoSisLCQdh0Rys21m4wmzN3v9ZIHDwsTbBt7Di3IiUMF07Jzcmw2O5YqOg8iETQtkYjj\/qlr5BCV4eBBFSiBA4l7xlUu0TcgZpvAZYQz0AlyQtGs7CwSXS4nnie0wYGkWDxDiM3drTYrbiRRU2Njk1EMOMzhLMTMzc1T+x6AOgidQsiMn+l0OiEhuud2uSkBoUMGHeKrZB9Vkn19XQod94+NWXu9bhwh9KNZWTAKCcI3M4neCLtwlSIRiwUDjScVNwl9CLYGmpoa4YzoLRB9GxooxCkIxuXwFHuFOZyCjY1iQGCCWAvJSpHNaAwGxPsu3D9ICLu4kMTmxib28dCI3HAmc5UPfomdCK4yzWbxJa8yhNdsNjmaobovr0B8fs+9lOcQoIZoI6yjWJ\/PC4fJRrtATFVcXIxMwj31dRZ3Vx9HoouggxiF24REFBYWYd5FxUWwC3eLP6IgmID+EC9hxpBK0QHlfVQikZefjzXis\/lbxNSw9fUNsAUCEFYR1VAU5CwpK4NyeQp\/cMOQGvzJxoZGgjQx1ate36qIj9\/nR7gQH5xGm91GmVyLIye+tmptRd+4nOrAPVQO\/lisKFUOtOQsjih187jdnFIfB2Yiuyge+QsKCimfoI7DAOWK6vob6uuhK84sjJWE6lLoKK9POH6iKxn3rMXnV6aP1QtNyMwsr6iIRsSHFT169iJSIhpRv4onHiIWKi4txbnCKGEdHlpmViaeVY9ePaPRWH1dnZhWWS+WG4SWWH9+QT5mTbSGX0e81NzUJGYmy8qsqapGV4xiKet4Q30Dho6UQaccMWlzZrfycjFSqbCQC6urq8mDbMKCxsZGKlxWXk6wl5NjgTawUX0cE0KnUJFE5NHR3AzHeBCugplIVreKcrhEk0EJsmeiS6FDGJXM0OqE\/1NdVYWhoyTJRBwRwBbZ0vAnEkncJ9r1ktISzFG9CL4RMiFHyBeMxJoRH7GQezLRUFePzoh+79xc9hEKWIfcwTph0CYTRMPcuYpghrsXFgm2wE8ALSEDd8FvNBgNsAsRg\/AeEeCFS4qLuRE3hfnFJcUwzWQyEkpRH6qB\/Kh1SyTFTNHwFkLWVFfDT2It5XHE5\/rUC1XFS6R8CK9eItFF0FEapdE4mx1Z2dkYHO5QJBpt9bcoH\/uJj2qJYTA+Ag8x7icWVXsmEkonATterzcaFt+9Qz+8L4IT9c0vLiKGi7gJDsShqAVnj6BFfJ9LSkx0uGPxCA4CEg6FEEC8O6SpoKCgsb6BElA2RA\/3kssz8UrFHMshCnS53CJnIFhQmN\/c1IzEOJqbeAbx0lYByiNmBYzFcRrhKveC4dAVNaOBYAf3UgnMOi5MldhB0CH\/5JqMWCyuuG2FNP8ajVYZdapBYjBNzL2sW5nNZsdhQ2FEB4AGG1b+J95KRbUajYh+xPAFb1FxSX5+fkJMjK6NJxJut4s4ijsklcWmiJpAUUkJioGhFxUXq6+nzObMhoYG\/DqzSfT7caE65rW4uASaZSouIlEZt4YJOJPQQwxBjEbVPg8KLynrBkPgsPI8glHUqKmxkdsRnkUj4qG4EZk5FH0qgUB5eTmP03aJRBdBBzWiWq1YwKahrg5\/CbNDKCAVzT9ihDJ43B7Fa8qoq63NyxNfIioqlWHQG7BjBMTZ3Ix942UhNWIiS4OxetMm3LD8\/AIUKdDaqtFqYSY2DesQPvQGZ4\/SdFpdfV19MiNRUVmJI8cfObFyyMNVHrcb90\/kqa2FwOqMtt179CDSczoc5KRAMkMPBBbKKUGRgN\/nw3Xs0bMnlKMCSpyUJJwjs\/o1FxXweb08YNslEl0EHeeWhEJiJQ5iDHVED5IiOhIiEYIloiAsO5kU7GJHoxULhxKBtLaKhQkjkXBxaSmBFj4eJpubK4bJ4iJSGpYND4mo0DHkgrPIIFYOBxAfNIqbcke9XvQKcl+8QfxA2EoeXFA0BG673W5kDa7abFaCPTw3aIxY4ePBKJ1Wa8YjzMmiTKGfCqCQ2s+hdJ2b7Lk8VIQAjlYDlxJuQyetTlcoejWFcKlXSXQFdBCjMDXcIdwt0S1BE242l5SVokvZ2Vlww+VyYa9A6T9oQaOwQuwVdcrNy+vXr38kFOJU7969W1vESAURqOTkkJ+wy56bi7aInkRlKSeIAUmKSsSUD06nIxAQKwwA5KiktFR8yUvUFBPzTEAniioqKiSFMAkaQGkI3OxoLi0rg+fQDl+zsnt3SEJIVtatGw2B+jjQEpeVMKygoBCiUiseEAZSLNoFG23KRGhetzsu5syQjOpC6AhGQSE0AWMVk7lmifEKpNTV1uEaYdwOhwNLpcknMmlp8dPSE5OQX6vVFRUWfvnFF2ecccZJJ59y1ln\/euSRR7JzhHZgssgRrMOCIR7cwMSNylfAOIecdTqckI1YiNvhcMI99Iqa6HRaboqqCHP3eIjN3G4PikdOakU5fr+\/mJyajKzMTIPJdO+9904+9tgJEybeeMONy5ctJ35Tn4ibQrm8fDGzUiIhvjsmVEPB6utFpwhnxay3RiMyiJCqLwMkugg6glE00VqNloYc7wtrYx8Z0et0auBO2x+PxfzKGhlwSa9LzS6GsT7\/wovHHnf8iy+++PXXX33wwftXX331tdddh0OF7SqdExlQBbKKsXtaXUSZ\/iUzK5MASelXz\/V43ChWJCJ6LJAgpetCfMiEnrCPL8fdoZ86ZIkqia4RgwGV02RoAsHg8cefcN999y38+OMvv\/ziqaefmnTscStWrNTpUt\/kGo0GZQqnoMHIQyU0WvHal8sB5ZR1K6OGPi9OqYB6iURXQAd5fRqtBkuNxaKYndvtwkGi\/cYcoY34WkKrLSgSi7cTLOn0IogioEcuMGj4YDRlqn96g+n555775NPPKioqwuGIAVs2GFpaWjPE97\/18BMika76ZoQxsKWwUEQyHOZYcgjDtFotOgajIBwyiK1zI0DwhtyRwincy0Q8fvsdd3z91WKD0dx2d\/Rn6bLlOr1efRwxLt5mw8WkjWj1+yEPGqv21OPTciOdTm+1iXduFCt+AomugY7rmaDVV4aYZ+bliwXhCwoLSWxsaGxuasb+MGKXy4m9JhPCADFELNVgNMEZ9XKgvt557vnnq6ur2YdC5EEAyFNSUuJXlm8DmHdDfT22DuU8Xm8kKobV4nrG4jGcy0LFUYQ5iBhqVltTQ1Sm+nuQQW8QwwCrqqref\/8D6NZeXsgD1H3RRaHRkFV8JSkmbc+x2e0+n7ewqJhT+LHwViizTifp1NXQURolPhYyYO4up1Pd2bBufWtLS35BPi5fOBSm2bfZ7Nh6OBLWKmbMJe0NejO0tbV1GCmRFxKn1WktNmuLz4cXhyA0NzZB0czMLCSIG8E6fEukQ+leF+9nYRd8IyfXbtq4EW8Ql0\/NCdCcQECsoktw1doagA+pe24DmKm8QY6bTYiYGDtvNkN+4\/p166BlXl4ejA2GgrQOaryXukyiC6DjNIogx+fzYcROhxiwA5dKy0o5xPpRD4\/LLcIY5RvB5ObOsV9q4JNWiyURixERYbUYMQEYTiPkhAwIBWWaFeRYLERH8Ed9mZt6tRWLEvxwL1SluLSE\/CajkS36RmYsXx2ukZWdRX7KV+74C8Cng4HkJQ\/ihrQ6lBdWBQUFpaUlnMzNy+NBiOJwKVPXSHQNdBCjaK3RJQiD9UOh+rp65XVq2Ov14iBhiDk52a2tLciIwSCW2VS5hPK0J5WymzziyMOzsrJxzwiTIAixE9EPvlwwEKitqcXpQiXU7wvLysuROvw97JuzuHlUg33Ep6aqCmEkp8vtIngrr6iAIXAAnuMoDho4cPToQ5KJLZ9vAFxF6qPuh8Mhm81GCQRONApwyWK1VldV4biGxCKowu3MK8jnkaGo9Pu6FDqIUQkR88dz83IxX2y3vKI8S\/nACRNXu5tp5ouKimuqqltaxFxI5LZYcg4\/\/DB0o41UsWh45Mj9pk2ZotPrmpua8NYgJCw1iA8xWpSP5PMweqNJdCHm5FgCLS02O45coL6uDiWhIKQJNYIMxSUlySQSZwgHxWvflhY\/lOBawqoWvw+qX3bZrMru3dE09dbUx2azdu9eSVWVBLFoCAEYl+DjQU2TyVRRWWE0imnSUGOaBrgkWgTl3YFyiUSXQPp7oh7\/738HDRpUWVEhwncF2dlZH328sK6ufr9992nFwAOBsrIyOEATrnYYUAcO8\/PzafJfe+XVc887T28w4S\/16N69uqYGuxShiLDNZGVlhdrNQJiF7EAe9qPK4FqVSHrYphf9AVg2EgTbiKWCrQG9Xoc0iclUYjFzppkyqRhnRU6dyEmxqI2IzURXvOj2cDrFogcckVNlOLRxOJwQe8xhf7vnrjt9YmWQ0k0bNqqUrqysFEsf2O3cJBoJE84t\/HihzqCfNGkirqnyS4jgkHu9\/sYbZ515ppoi0cnQQYxauOiTH777\/vDD\/5ZtyXE5nHZ7rkarwc3DlcKUsWMsHpO32mxOp3PCxMk11ZuMYnb\/iMFoaB\/Zw5mMZNvMDdi6qgBqBnWn\/eO0HbbPsNWOim1zZmhhg9JXrgJSIT4QNRYNXX3NNaeecgpNA0SKhMVK8m6Xi3iMVoB4TO1hRxKX\/\/RTLJGYNHGCZFTXQYd4fUlhjnCDcAX7E+PfkmLFAIvFyjkioqKiIjhWUFQEzZKJ+FVXXsFhJBwkeIlGQuy0\/bWjE0hspgHbtp32aDtsn2GrHRVt+1vSE0JpttwaaUrEI9Bp7Njxp02bBp1qqqtpBsQniaGQMv4jhhdKnMbDQkV1PDuaqJYm0UXQQRr14Ucfr1m95uijx+MXcUeiEZyocEgsEyoie70+EAzij9GEQ6rs7Jy1a9d++eWXZCakMZnUifnzuZDgx+N2Z2dn+1tarBYratDi91MCMhZWpnMhTiNMEo6bTsRaFtHjJyYeM5vM6IlWdMyLNQqUB09Qshh7rtM5mpu4KbEWVTWbMwPBAAEedVF0SXDYYDBmZmVSfnFR0ZjRo\/FdqXQ8KmbJxBUMtLZyP4oV34CIfkixrmFubu4bb7yhNxiOP\/74zdOSSY3q\/OggRn28cNH33303fvx4XKOmxgZuGmgN5OXn06hnZWaqA4KIQDas39CtvBucwcp36dtXfBmhEctzFBUX401xlT03NxgM5OcXVFdXwxYKdzmdPXqJuf+x\/Ra\/CMYi0Sgmnl9YEAmFLVYrpVET7ltbXV1eWRGLxoKhIGYNc7BvCFlYVBiNxiAM4Var+Mi3sKa6qriklDoos1aI5Tmyc8SMSOgPdcBZ1en0tbU1ld171NfWms3mQmWAbDyRCIdCeIAeZfLn\/Ly8Tz79lJjq2GOPlYzqOuigvj5EKUtZ\/Qm7jITFbHjdRNd2BizCCcTi8QZra2p69e7l83kjkShN\/vr169XJ+rJyciAeEpRIJuvq6lwu9w\/ff2\/ORHP869eJVdzhYWNjk9\/fAjNDyqSWKENtTa3H61m6ZCkXEhAtX7Zco9PV1NTU1de73R50EeN2u90Go7Gurh4OrPxphdfnM2dlLlu6lEamoaGhtrbW6XIhg+Rpbm42mIzEeF6vx+1y47L26t2nvq4O1UIPKSeqfL2PBwixeShoJioMx8RgRTU2k+gS6AhGCRFMZiAv\/B9mh79EfI904IZhcPhaKENWdjZCpFAokqesAI8sGE3i\/ZU6TjwWi7e2tARxt3T6krJSfDmvx0uZ2DTAD1Sbf6dDLPRGkBMKBrmkpLSEw6aGxhxLTpZYmSoDnxCdIdHR3AyTgyAQiIQj3B0XtKG+gYgox2JJiu5ysSQprEB\/kFDyiAoEQ9zUarM11tfzFOyrOWkCqIDL4VS71BE3KkBVqZucXaxLoSMYJZpo8WG8mHEfo8\/JycHmorEYHhqxE2SgRcdq0RYcOaFaSkCPB4WUJcRKZ2FcuHgsiiuFrbvdLkezIzMz05ZrR\/diMUKniHgrJUbNihlesWydstJMKCTmSIKT5KRk\/D18MOgkwjBlxUSzWYyptdnssXisob5eeJV2O5yHb+RkQwBGmcRa1Jn6QyRKpkxoaLNzBxv3Il8oHBZhYTgMeXioaDQiPmc0mfwtfjJIhepS6CCvj+acZttkNNGWEx1hu3qdmBUMyyOCxyjF+9n8fMIhaOByuRRXS3zvxCmDQUxkiUdny83FPjFrPEbo1+pvUbULc3c6HVg5NBPKoNdbbFZoQCGV3btHQiG\/V3ykiHCJ+Yz8fq7FacTPTCQzKC0zOxMtquxemYjFOUUJMAEGIkcelxu2Q3+qwV24HF5xd5jsclLVEP4ezORyZbyvIA+JpCiCLD5J5sF5WPVHkOgK6CBGAewyIv4nltYk1q\/s0QMzRZrQHHyrWDRK6KIMtyvFIjFroil2sMiKygosFS8RgqFyoKmxwWDQFxYX5yozFlEqrKPM4uJigi6\/z1dfW08iV0FOdvIK8otLSqAQ+1i3yWi0WqxFJcWtfn9dTQ3uHETFtYSTeXl5RSUl8Sh6pgyEhcdZmWXdymAj1YNpPAicJ6Cy2m2lZaL3AoXkwWga8PB4KB4Q349wkYcSQ5DUh5foMuggRmGymJ1wqGIxW66YiKu2phpbxJHDATMajHAJjYJIBEjICNIB+fDBsPK62rpAMCg6MBRCkmiz2ykSgUJDcLcUf0xM74zRQzzUTa\/XcTY3Lw8HD1p6XB7UD7cQAqAbhGdYfFNDE4IJDThFTqIsNAjN8XrcVNeofEgCnTxuD8EVj4BYuV1u3E5oBvH8XvFNFJ4easat8QBbfP662lpcS5PZRMRF2dyaOqtur0QXQUdpFDaqLCYdjoShAeSBRRhcdk621SrGSTQr07IS8+A6WaxWyIZMiA7r3FxiJKwZ7uFKEdU0Njb4fX64gYbY83KVgCeOLJAHx4xsZIVyJNbX16kd8fFEXI2voCT8iccT9rw8g1EPu4iGSK+vq3M7XdyaMrk7HinUFR5gKERVoRY5c3LEN\/bopNPhEPFYRpJ74WfyTNDe6\/XkFxSoOdE1KkDlScTlk4FUl0JHMUr5YBYJUr+D2LhhA1EKxhcIiFdDOGAYcXjzl0WQIRwiyhcf+VVt3IiIWawWUmj4EZOc7Bz8LsiDFpGIQEE\/nK6G+kbMHa1DJSAehRcUFIYjERFWKeuRKksPihXjka+aqipUiHq1KOvDFylrJUJ7SBtoDZAeULof2VJV9TW0mJ4lHi8pLaWG3BL+wCVyUiY1SSaSG9avFzVRJvQkkciQuFGv08swqkuhgxgFSfR6Q0lZKa04VotiYKZYJBxTO8Rxz\/DBUCqMkrSy8jIUgFiFzAa9gWApHo+Jz6sMekIbs8nscDiQEZ\/XW1xSbMkRc4aJ1QCUlW\/QBJw85A5CQjyuIlEdcp6H4BgNBYWFyKOIqZJJRAy6UyvcuYBY2wD+im7AgqJCEgsKC6AolYdFlEAcCLXIyTGaRj1JLy0rIycRHZ4qrYbQYbEKlljoQMy\/uXmyF4kugo6Lo8yZZjE3mNfb1NRky81FikjExLFIjBsNKS4pgVp+n6+4uDiVs6HRYrPCPQw3ryBfrO4uRn87aP6V\/j0XQoG5e30e1AlbJ07DyvPyC+AhJZOIuOE3ut0efDZYhyOHf4gqFhQUiI95rVZEr6ioGCajLdyC0Age4vixg3+I1nFTAqQci1i9qlu3bpRAZaiA6GeJRIqKisSLMbfH2ezAP6Q5gLHcsaRbGRXjcuI09YWcRBdBhzAqKXrPQ0ExHSz8EV5dLIbJq2+o3G53RLzJycATs9gsNPaxeKy2pqa4tAQiqt8Ukg0Dxh\/D0GEOZ9kWFReyrd5URSSWlS1WW0OjIAYywx1dTrG6u6PZgQ+GjpnNYuoVnM\/8gnwUT3lxVACNYbWjuVknVi0QIyFw\/1BLR7MYqwFtyMmtSfTCNJMYOZFMimEQ9bV1kBlRgjOOpuaybmVwicdC08QajVqtx+UJBMRq8\/i4qR9BomugQ\/69NcLrw8K69+iBgUIA0rxut1GZlQXC4Fmx7d6zB5YtvKlAsKKyQqvRoioGg+iXM5mMmLLVhg1bc7KzK7pXYvdejxdPDBcOqYFClOBsFpPAaJRJku12saghBCYDzhzeXaY5k0NCLwjmcbkRGfxDs9ksOvqyMktKSktKSvAP3S43Dmq5GFEehEtwGNfUqIzzIMzLyspG3yp7iE8PqRhE6tGzJxqLJLL1ebyoqHhTnCteAGu0oi+EdkH5FSS6BDpipCzE+O777+fNm9end+\/W1oDa\/aXT6\/Gv8PHYiu6EaJTwgxgJX4tgCacO04d+aIhOp1M6IcSEe9h0VMz0Ij4QxMHDoCESNxKGm5GBKKmjgSgWDcGxjITFRP6k4Jjl5om3rigMW8qEIeT3eDx4a\/wEuHDcjhSn0sEIGaiAmpPLqZjL4bDYbEZlmj4xBZLZ1NzULHoXzWbqo96FMqEofiCxH57nunXr9ttvv6PHjyc2I4OaB59TjpTtxOgIRgEsqaW1FWsWGkKTLca6iTtziPjwn8ihTG2HqZOeVGZNIYWtmlM5LyZ7UHZETqUo0d\/NAyiFklPNLopFQ5RrRBIlQaB4It5WjvLQolhuJyb006T+A+hkPJHg3M9zJtV05SbiBCl6nU752l\/JKS5Vqypmw2ULn9E66+ZF3FSQUTKqc6ODGIUpdc2IQhCu3S8sGdXp0VFWrgz37oJIe4MlsYND9kRJSKQTklESEunEnxJH7bffft27V8ai7eIoCQUarYijnnlmwfQzzkglSXQupJ9RDz\/yyA\/ff5+Xl5+Q6yb9EkKhoM1qv\/rqq1LHEp0L6WeUhERXhoyjJCTSCckoCYl0QjJKQiKdkIySkEgnJKMkJNIJySgJiXRCMkpCIp2QjJKQSCckoyQk0gnJKAmJdEIySkIinZCMkpBIJySjJCTSCckoCYl0QjJKQiKdkIySkEgnJKMkJNIJySgJiXRCMkpCIp2QjJKQSCckoyQk0gnJKAmJdEIySkIinZCMkpBIJySjJCTSCckoCYl0QjJKQiJ9yMj4Px6j2VLxDyPEAAAAAElFTkSuQmCC\"><\/figure>",
          "label": "Content",
          "refreshOnChange": false,
          "tableView": false,
          "key": "content7",
          "conditional": {
            "show": true,
            "when": "QB3",
            "eq": "true"
          },
          "type": "content",
          "input": false
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
            "input": false
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
            "key": "b3_input",
            "conditional": {
              "show": true,
              "when": "QB3",
              "eq": "true"
            },
            "type": "number",
            "input": true
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
              "resource": "YN48hpRcUUVYl8XAKyBS"
            },
            "dataType": 0,
            "selectThreshold": 0.3,
            "clearOnHide": false,
            "key": "B3UnitQuantities",
            "conditional": {
              "show": 0,
              "when": 0
            },
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "selectFields": "retrofitAction,bataMerahPcs,batuKaliM3,bautJLPcs,besiPolos8MmX12MPcs,besiUlir10MmX12MPcs,kawatAnyam1MmX1InSpaciX12MX30MBal,kawatBetonKg,kayuKelasIi57CmX4MPcs,kayuKelasIi612CmX4MPcs,kepalaTukangOh,kerikilM3,lemKayuKg,mandorOh,minyakBekistingLtr,paku57CmKg,pakuPayungKg,papan325CmPcs,pasirM3,pekerjaOh,semenSak,sengBjlsPcs,tripleks9MmPcs,tukangOh",
            "input": true,
            "addResource": false,
            "reference": false
          }, {
            "label": "B3 total price",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = cityprices;\r\nlet v2 = data;\r\n\r\ntotal_b3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.b3_input;\r\ntotal_b3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.b3_input;\r\ntotal_b3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.b3_input;\r\ntotal_b3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.b3_input;\r\ntotal_b3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.b3_input;\r\ntotal_b3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.b3_input;\r\ntotal_b3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.b3_input;\r\ntotal_b3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.b3_input;\r\ntotal_b3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.b3_input;\r\ntotal_b3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.b3_input;\r\ntotal_b3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.b3_input;\r\ntotal_b3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.b3_input;\r\ntotal_b3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.b3_input;\r\ntotal_b3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.b3_input;\r\ntotal_b3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.b3_input;\r\ntotal_b3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.b3_input;\r\ntotal_b3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.b3_input;\r\ntotal_b3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.b3_input;\r\ntotal_b3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.b3_input;\r\ntotal_b3_semenSak_price = v1.semenSak_price * v2.semenSak * data.b3_input;\r\ntotal_b3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.b3_input;\r\ntotal_b3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.b3_input;\r\ntotal_b3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.b3_input;\r\ntotal_b3_price = total_b3_bataMerahPcs_price + total_b3_batuKaliM3_price + total_b3_bautJLPcs_price + total_b3_besiPolos8MmX12MPcs_price + total_b3_besiUlir10MmX12MPcs_price + total_b3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_b3_kawatBetonKg_price + total_b3_kayuKelasIi57CmX4MPcs_price + total_b3_kayuKelasIi612CmX4MPcs_price + total_b3_kepalaTukangOh_price + total_b3_kerikilM3_price + total_b3_lemKayuKg_price + total_b3_mandorOh_price + total_b3_minyakBekistingLtr_price + total_b3_paku57CmKg_price + total_b3_pakuPayungKg_price + total_b3_papan325CmPcs_price + total_b3_pasirM3_price + total_b3_pekerjaOh_price + total_b3_semenSak_price + total_b3_sengBjlsPcs_price + total_b3_tripleks9MmPcs_price + total_b3_tukangOh_price;\r\n\r\nif (isNaN(total_b3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_b3_price;\r\n  }",
            "validate": {
              "min": 0
            },
            "key": "b3TotalPrice",
            "conditional": {
              "show": true,
              "when": "QB3",
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
        "title": "QC: Lubang Dinding (Pintu & Jendela)",
        "label": "QC: Luban Dinding (Pintu & Jendela)",
        "type": "panel",
        "key": "QC",
        "components": [{
          "label": "QC1 Sisi depan bangunan, panjang dinding solidnya kurang dari 1.5m",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c1O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c1O1_input;\r\ntotal_c1O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c1O1_input;\r\ntotal_c1O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c1O1_input;\r\ntotal_c1O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c1O1_input;\r\ntotal_c1O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c1O1_input;\r\ntotal_c1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c1O1_input;\r\ntotal_c1O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c1O1_input;\r\ntotal_c1O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c1O1_input;\r\ntotal_c1O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c1O1_input;\r\ntotal_c1O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c1O1_input;\r\ntotal_c1O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c1O1_input;\r\ntotal_c1O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c1O1_input;\r\ntotal_c1O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c1O1_input;\r\ntotal_c1O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c1O1_input;\r\ntotal_c1O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c1O1_input;\r\ntotal_c1O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c1O1_input;\r\ntotal_c1O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c1O1_input;\r\ntotal_c1O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c1O1_input;\r\ntotal_c1O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c1O1_input;\r\ntotal_c1O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c1O1_input;\r\ntotal_c1O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c1O1_input;\r\ntotal_c1O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c1O1_input;\r\ntotal_c1O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c1O1_input;\r\ntotal_c1O1_price = total_c1O1_bataMerahPcs_price + total_c1O1_batuKaliM3_price + total_c1O1_bautJLPcs_price + total_c1O1_besiPolos8MmX12MPcs_price + total_c1O1_besiUlir10MmX12MPcs_price + total_c1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c1O1_kawatBetonKg_price + total_c1O1_kayuKelasIi57CmX4MPcs_price + total_c1O1_kayuKelasIi612CmX4MPcs_price + total_c1O1_kepalaTukangOh_price + total_c1O1_kerikilM3_price + total_c1O1_lemKayuKg_price + total_c1O1_mandorOh_price + total_c1O1_minyakBekistingLtr_price + total_c1O1_paku57CmKg_price + total_c1O1_pakuPayungKg_price + total_c1O1_papan325CmPcs_price + total_c1O1_pasirM3_price + total_c1O1_pekerjaOh_price + total_c1O1_semenSak_price + total_c1O1_sengBjlsPcs_price + total_c1O1_tripleks9MmPcs_price + total_c1O1_tukangOh_price;\r\n\r\nif (isNaN(total_c1O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c1O1_price;\r\n  }",
            "key": "c1O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "C1_O1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C1, Opsi 2: Geser lubang dinding ke sebelah tiang, hal ini membuat dinding menjadi lebih kokoh",
            "shortcut": 0,
            "tableView": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c1O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c1O2_input;\r\ntotal_c1O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c1O2_input;\r\ntotal_c1O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c1O2_input;\r\ntotal_c1O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c1O2_input;\r\ntotal_c1O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c1O2_input;\r\ntotal_c1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c1O2_input;\r\ntotal_c1O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c1O2_input;\r\ntotal_c1O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c1O2_input;\r\ntotal_c1O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c1O2_input;\r\ntotal_c1O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c1O2_input;\r\ntotal_c1O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c1O2_input;\r\ntotal_c1O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c1O2_input;\r\ntotal_c1O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c1O2_input;\r\ntotal_c1O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c1O2_input;\r\ntotal_c1O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c1O2_input;\r\ntotal_c1O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c1O2_input;\r\ntotal_c1O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c1O2_input;\r\ntotal_c1O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c1O2_input;\r\ntotal_c1O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c1O2_input;\r\ntotal_c1O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c1O2_input;\r\ntotal_c1O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c1O2_input;\r\ntotal_c1O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c1O2_input;\r\ntotal_c1O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c1O2_input;\r\ntotal_c1O2_price = total_c1O2_bataMerahPcs_price + total_c1O2_batuKaliM3_price + total_c1O2_bautJLPcs_price + total_c1O2_besiPolos8MmX12MPcs_price + total_c1O2_besiUlir10MmX12MPcs_price + total_c1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c1O2_kawatBetonKg_price + total_c1O2_kayuKelasIi57CmX4MPcs_price + total_c1O2_kayuKelasIi612CmX4MPcs_price + total_c1O2_kepalaTukangOh_price + total_c1O2_kerikilM3_price + total_c1O2_lemKayuKg_price + total_c1O2_mandorOh_price + total_c1O2_minyakBekistingLtr_price + total_c1O2_paku57CmKg_price + total_c1O2_pakuPayungKg_price + total_c1O2_papan325CmPcs_price + total_c1O2_pasirM3_price + total_c1O2_pekerjaOh_price + total_c1O2_semenSak_price + total_c1O2_sengBjlsPcs_price + total_c1O2_tripleks9MmPcs_price + total_c1O2_tukangOh_price;\r\n\r\nif (isNaN(total_c1O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c1O2_price;\r\n  }",
            "key": "c1O2TotalPrice",
            "conditional": {
              "show": true,
              "when": "C1_O2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C1, Opsi 3: pasang kawat anyam, lalu plester dinding di antara lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = cityprices;\r\nlet v2 = data;\r\ntotal_c1O3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c1O3_input;\r\ntotal_c1O3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c1O3_input;\r\ntotal_c1O3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c1O3_input;\r\ntotal_c1O3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c1O3_input;\r\ntotal_c1O3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c1O3_input;\r\ntotal_c1O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c1O3_input;\r\ntotal_c1O3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c1O3_input;\r\ntotal_c1O3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c1O3_input;\r\ntotal_c1O3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c1O3_input;\r\ntotal_c1O3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c1O3_input;\r\ntotal_c1O3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c1O3_input;\r\ntotal_c1O3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c1O3_input;\r\ntotal_c1O3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c1O3_input;\r\ntotal_c1O3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c1O3_input;\r\ntotal_c1O3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c1O3_input;\r\ntotal_c1O3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c1O3_input;\r\ntotal_c1O3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c1O3_input;\r\ntotal_c1O3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c1O3_input;\r\ntotal_c1O3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c1O3_input;\r\ntotal_c1O3_semenSak_price = v1.semenSak_price * v2.semenSak * data.c1O3_input;\r\ntotal_c1O3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c1O3_input;\r\ntotal_c1O3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c1O3_input;\r\ntotal_c1O3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c1O3_input;\r\ntotal_c1O3_price = total_c1O3_bataMerahPcs_price + total_c1O3_batuKaliM3_price + total_c1O3_bautJLPcs_price + total_c1O3_besiPolos8MmX12MPcs_price + total_c1O3_besiUlir10MmX12MPcs_price + total_c1O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c1O3_kawatBetonKg_price + total_c1O3_kayuKelasIi57CmX4MPcs_price + total_c1O3_kayuKelasIi612CmX4MPcs_price + total_c1O3_kepalaTukangOh_price + total_c1O3_kerikilM3_price + total_c1O3_lemKayuKg_price + total_c1O3_mandorOh_price + total_c1O3_minyakBekistingLtr_price + total_c1O3_paku57CmKg_price + total_c1O3_pakuPayungKg_price + total_c1O3_papan325CmPcs_price + total_c1O3_pasirM3_price + total_c1O3_pekerjaOh_price + total_c1O3_semenSak_price + total_c1O3_sengBjlsPcs_price + total_c1O3_tripleks9MmPcs_price + total_c1O3_tukangOh_price;\r\n\r\nif (isNaN(total_c1O3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c1O3_price;\r\n  }",
            "key": "c1O3TotalPrice",
            "conditional": {
              "show": true,
              "when": "C1_O3",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QC2: Sisi belakang bangunan, panjang dinding solidnya kurang dari 1.5m",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c2O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c2O1_input;\r\ntotal_c2O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c2O1_input;\r\ntotal_c2O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c2O1_input;\r\ntotal_c2O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c2O1_input;\r\ntotal_c2O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c2O1_input;\r\ntotal_c2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c2O1_input;\r\ntotal_c2O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c2O1_input;\r\ntotal_c2O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c2O1_input;\r\ntotal_c2O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c2O1_input;\r\ntotal_c2O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c2O1_input;\r\ntotal_c2O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c2O1_input;\r\ntotal_c2O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c2O1_input;\r\ntotal_c2O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c2O1_input;\r\ntotal_c2O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c2O1_input;\r\ntotal_c2O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c2O1_input;\r\ntotal_c2O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c2O1_input;\r\ntotal_c2O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c2O1_input;\r\ntotal_c2O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c2O1_input;\r\ntotal_c2O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c2O1_input;\r\ntotal_c2O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c2O1_input;\r\ntotal_c2O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c2O1_input;\r\ntotal_c2O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c2O1_input;\r\ntotal_c2O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c2O1_input;\r\ntotal_c2O1_price = total_c2O1_bataMerahPcs_price + total_c2O1_batuKaliM3_price + total_c2O1_bautJLPcs_price + total_c2O1_besiPolos8MmX12MPcs_price + total_c2O1_besiUlir10MmX12MPcs_price + total_c2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c2O1_kawatBetonKg_price + total_c2O1_kayuKelasIi57CmX4MPcs_price + total_c2O1_kayuKelasIi612CmX4MPcs_price + total_c2O1_kepalaTukangOh_price + total_c2O1_kerikilM3_price + total_c2O1_lemKayuKg_price + total_c2O1_mandorOh_price + total_c2O1_minyakBekistingLtr_price + total_c2O1_paku57CmKg_price + total_c2O1_pakuPayungKg_price + total_c2O1_papan325CmPcs_price + total_c2O1_pasirM3_price + total_c2O1_pekerjaOh_price + total_c2O1_semenSak_price + total_c2O1_sengBjlsPcs_price + total_c2O1_tripleks9MmPcs_price + total_c2O1_tukangOh_price;\r\n\r\nif (isNaN(total_c2O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c2O1_price;\r\n  }",
            "key": "c2O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "C2_O1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C2, Opsi 2: Geser lubang dinding ke sebelah tiang, hal ini membuat dinding menjadi lebih kokoh",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c2O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c2O2_input;\r\ntotal_c2O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c2O2_input;\r\ntotal_c2O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c2O2_input;\r\ntotal_c2O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c2O2_input;\r\ntotal_c2O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c2O2_input;\r\ntotal_c2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c2O2_input;\r\ntotal_c2O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c2O2_input;\r\ntotal_c2O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c2O2_input;\r\ntotal_c2O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c2O2_input;\r\ntotal_c2O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c2O2_input;\r\ntotal_c2O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c2O2_input;\r\ntotal_c2O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c2O2_input;\r\ntotal_c2O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c2O2_input;\r\ntotal_c2O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c2O2_input;\r\ntotal_c2O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c2O2_input;\r\ntotal_c2O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c2O2_input;\r\ntotal_c2O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c2O2_input;\r\ntotal_c2O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c2O2_input;\r\ntotal_c2O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c2O2_input;\r\ntotal_c2O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c2O2_input;\r\ntotal_c2O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c2O2_input;\r\ntotal_c2O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c2O2_input;\r\ntotal_c2O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c2O2_input;\r\ntotal_c2O2_price = total_c2O2_bataMerahPcs_price + total_c2O2_batuKaliM3_price + total_c2O2_bautJLPcs_price + total_c2O2_besiPolos8MmX12MPcs_price + total_c2O2_besiUlir10MmX12MPcs_price + total_c2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c2O2_kawatBetonKg_price + total_c2O2_kayuKelasIi57CmX4MPcs_price + total_c2O2_kayuKelasIi612CmX4MPcs_price + total_c2O2_kepalaTukangOh_price + total_c2O2_kerikilM3_price + total_c2O2_lemKayuKg_price + total_c2O2_mandorOh_price + total_c2O2_minyakBekistingLtr_price + total_c2O2_paku57CmKg_price + total_c2O2_pakuPayungKg_price + total_c2O2_papan325CmPcs_price + total_c2O2_pasirM3_price + total_c2O2_pekerjaOh_price + total_c2O2_semenSak_price + total_c2O2_sengBjlsPcs_price + total_c2O2_tripleks9MmPcs_price + total_c2O2_tukangOh_price;\r\n\r\nif (isNaN(total_c2O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c2O2_price;\r\n  }",
            "key": "c2O2TotalPrice",
            "conditional": {
              "show": true,
              "when": "C2_O2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C2, Opsi 3: Pasang kawat anyam, lalu plester dinding di antara lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c2O3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c2O3_input;\r\ntotal_c2O3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c2O3_input;\r\ntotal_c2O3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c2O3_input;\r\ntotal_c2O3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c2O3_input;\r\ntotal_c2O3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c2O3_input;\r\ntotal_c2O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c2O3_input;\r\ntotal_c2O3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c2O3_input;\r\ntotal_c2O3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c2O3_input;\r\ntotal_c2O3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c2O3_input;\r\ntotal_c2O3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c2O3_input;\r\ntotal_c2O3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c2O3_input;\r\ntotal_c2O3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c2O3_input;\r\ntotal_c2O3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c2O3_input;\r\ntotal_c2O3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c2O3_input;\r\ntotal_c2O3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c2O3_input;\r\ntotal_c2O3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c2O3_input;\r\ntotal_c2O3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c2O3_input;\r\ntotal_c2O3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c2O3_input;\r\ntotal_c2O3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c2O3_input;\r\ntotal_c2O3_semenSak_price = v1.semenSak_price * v2.semenSak * data.c2O3_input;\r\ntotal_c2O3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c2O3_input;\r\ntotal_c2O3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c2O3_input;\r\ntotal_c2O3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c2O3_input;\r\ntotal_c2O3_price = total_c2O3_bataMerahPcs_price + total_c2O3_batuKaliM3_price + total_c2O3_bautJLPcs_price + total_c2O3_besiPolos8MmX12MPcs_price + total_c2O3_besiUlir10MmX12MPcs_price + total_c2O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c2O3_kawatBetonKg_price + total_c2O3_kayuKelasIi57CmX4MPcs_price + total_c2O3_kayuKelasIi612CmX4MPcs_price + total_c2O3_kepalaTukangOh_price + total_c2O3_kerikilM3_price + total_c2O3_lemKayuKg_price + total_c2O3_mandorOh_price + total_c2O3_minyakBekistingLtr_price + total_c2O3_paku57CmKg_price + total_c2O3_pakuPayungKg_price + total_c2O3_papan325CmPcs_price + total_c2O3_pasirM3_price + total_c2O3_pekerjaOh_price + total_c2O3_semenSak_price + total_c2O3_sengBjlsPcs_price + total_c2O3_tripleks9MmPcs_price + total_c2O3_tukangOh_price;\r\n\r\nif (isNaN(total_c2O3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c2O3_price;\r\n  }\r\ninstance.setValue(value);",
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c3O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c3O1_input;\r\ntotal_c3O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c3O1_input;\r\ntotal_c3O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c3O1_input;\r\ntotal_c3O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c3O1_input;\r\ntotal_c3O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c3O1_input;\r\ntotal_c3O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c3O1_input;\r\ntotal_c3O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c3O1_input;\r\ntotal_c3O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c3O1_input;\r\ntotal_c3O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c3O1_input;\r\ntotal_c3O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c3O1_input;\r\ntotal_c3O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c3O1_input;\r\ntotal_c3O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c3O1_input;\r\ntotal_c3O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c3O1_input;\r\ntotal_c3O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c3O1_input;\r\ntotal_c3O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c3O1_input;\r\ntotal_c3O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c3O1_input;\r\ntotal_c3O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c3O1_input;\r\ntotal_c3O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c3O1_input;\r\ntotal_c3O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c3O1_input;\r\ntotal_c3O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c3O1_input;\r\ntotal_c3O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c3O1_input;\r\ntotal_c3O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c3O1_input;\r\ntotal_c3O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c3O1_input;\r\ntotal_c3O1_price = total_c3O1_bataMerahPcs_price + total_c3O1_batuKaliM3_price + total_c3O1_bautJLPcs_price + total_c3O1_besiPolos8MmX12MPcs_price + total_c3O1_besiUlir10MmX12MPcs_price + total_c3O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c3O1_kawatBetonKg_price + total_c3O1_kayuKelasIi57CmX4MPcs_price + total_c3O1_kayuKelasIi612CmX4MPcs_price + total_c3O1_kepalaTukangOh_price + total_c3O1_kerikilM3_price + total_c3O1_lemKayuKg_price + total_c3O1_mandorOh_price + total_c3O1_minyakBekistingLtr_price + total_c3O1_paku57CmKg_price + total_c3O1_pakuPayungKg_price + total_c3O1_papan325CmPcs_price + total_c3O1_pasirM3_price + total_c3O1_pekerjaOh_price + total_c3O1_semenSak_price + total_c3O1_sengBjlsPcs_price + total_c3O1_tripleks9MmPcs_price + total_c3O1_tukangOh_price;\r\n\r\nif (isNaN(total_c3O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c3O1_price;\r\n  }",
            "key": "c3O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "C3_O1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C3, Opsi 2: Geser lubang dinding ke sebelah tiang, hal ini membuat dinding menjadi lebih kokoh",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c3O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c3O2_input;\r\ntotal_c3O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c3O2_input;\r\ntotal_c3O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c3O2_input;\r\ntotal_c3O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c3O2_input;\r\ntotal_c3O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c3O2_input;\r\ntotal_c3O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c3O2_input;\r\ntotal_c3O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c3O2_input;\r\ntotal_c3O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c3O2_input;\r\ntotal_c3O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c3O2_input;\r\ntotal_c3O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c3O2_input;\r\ntotal_c3O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c3O2_input;\r\ntotal_c3O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c3O2_input;\r\ntotal_c3O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c3O2_input;\r\ntotal_c3O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c3O2_input;\r\ntotal_c3O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c3O2_input;\r\ntotal_c3O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c3O2_input;\r\ntotal_c3O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c3O2_input;\r\ntotal_c3O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c3O2_input;\r\ntotal_c3O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c3O2_input;\r\ntotal_c3O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c3O2_input;\r\ntotal_c3O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c3O2_input;\r\ntotal_c3O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c3O2_input;\r\ntotal_c3O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c3O2_input;\r\ntotal_c3O2_price = total_c3O2_bataMerahPcs_price + total_c3O2_batuKaliM3_price + total_c3O2_bautJLPcs_price + total_c3O2_besiPolos8MmX12MPcs_price + total_c3O2_besiUlir10MmX12MPcs_price + total_c3O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c3O2_kawatBetonKg_price + total_c3O2_kayuKelasIi57CmX4MPcs_price + total_c3O2_kayuKelasIi612CmX4MPcs_price + total_c3O2_kepalaTukangOh_price + total_c3O2_kerikilM3_price + total_c3O2_lemKayuKg_price + total_c3O2_mandorOh_price + total_c3O2_minyakBekistingLtr_price + total_c3O2_paku57CmKg_price + total_c3O2_pakuPayungKg_price + total_c3O2_papan325CmPcs_price + total_c3O2_pasirM3_price + total_c3O2_pekerjaOh_price + total_c3O2_semenSak_price + total_c3O2_sengBjlsPcs_price + total_c3O2_tripleks9MmPcs_price + total_c3O2_tukangOh_price;\r\n\r\nif (isNaN(total_c3O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c3O2_price;\r\n  }",
            "key": "c3O2TotalPrice",
            "conditional": {
              "show": true,
              "when": "C3_O2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C3, Opsi 3: Pasang kawat anyam, lalu plester dinding di antara lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c3O3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c3O3_input;\r\ntotal_c3O3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c3O3_input;\r\ntotal_c3O3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c3O3_input;\r\ntotal_c3O3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c3O3_input;\r\ntotal_c3O3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c3O3_input;\r\ntotal_c3O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c3O3_input;\r\ntotal_c3O3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c3O3_input;\r\ntotal_c3O3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c3O3_input;\r\ntotal_c3O3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c3O3_input;\r\ntotal_c3O3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c3O3_input;\r\ntotal_c3O3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c3O3_input;\r\ntotal_c3O3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c3O3_input;\r\ntotal_c3O3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c3O3_input;\r\ntotal_c3O3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c3O3_input;\r\ntotal_c3O3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c3O3_input;\r\ntotal_c3O3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c3O3_input;\r\ntotal_c3O3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c3O3_input;\r\ntotal_c3O3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c3O3_input;\r\ntotal_c3O3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c3O3_input;\r\ntotal_c3O3_semenSak_price = v1.semenSak_price * v2.semenSak * data.c3O3_input;\r\ntotal_c3O3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c3O3_input;\r\ntotal_c3O3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c3O3_input;\r\ntotal_c3O3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c3O3_input;\r\ntotal_c3O3_price = total_c3O3_bataMerahPcs_price + total_c3O3_batuKaliM3_price + total_c3O3_bautJLPcs_price + total_c3O3_besiPolos8MmX12MPcs_price + total_c3O3_besiUlir10MmX12MPcs_price + total_c3O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c3O3_kawatBetonKg_price + total_c3O3_kayuKelasIi57CmX4MPcs_price + total_c3O3_kayuKelasIi612CmX4MPcs_price + total_c3O3_kepalaTukangOh_price + total_c3O3_kerikilM3_price + total_c3O3_lemKayuKg_price + total_c3O3_mandorOh_price + total_c3O3_minyakBekistingLtr_price + total_c3O3_paku57CmKg_price + total_c3O3_pakuPayungKg_price + total_c3O3_papan325CmPcs_price + total_c3O3_pasirM3_price + total_c3O3_pekerjaOh_price + total_c3O3_semenSak_price + total_c3O3_sengBjlsPcs_price + total_c3O3_tripleks9MmPcs_price + total_c3O3_tukangOh_price;\r\n\r\nif (isNaN(total_c3O3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c3O3_price;\r\n  }",
            "key": "c3O3TotalPrice",
            "conditional": {
              "show": true,
              "when": "C3_O3",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QC4: Sisi kanan bangunan, panjang dinding solidnya kurang dari 1.5m",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c4O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c4O1_input;\r\ntotal_c4O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c4O1_input;\r\ntotal_c4O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c4O1_input;\r\ntotal_c4O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c4O1_input;\r\ntotal_c4O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c4O1_input;\r\ntotal_c4O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c4O1_input;\r\ntotal_c4O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c4O1_input;\r\ntotal_c4O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c4O1_input;\r\ntotal_c4O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c4O1_input;\r\ntotal_c4O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c4O1_input;\r\ntotal_c4O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c4O1_input;\r\ntotal_c4O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c4O1_input;\r\ntotal_c4O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c4O1_input;\r\ntotal_c4O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c4O1_input;\r\ntotal_c4O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c4O1_input;\r\ntotal_c4O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c4O1_input;\r\ntotal_c4O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c4O1_input;\r\ntotal_c4O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c4O1_input;\r\ntotal_c4O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c4O1_input;\r\ntotal_c4O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c4O1_input;\r\ntotal_c4O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c4O1_input;\r\ntotal_c4O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c4O1_input;\r\ntotal_c4O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c4O1_input;\r\ntotal_c4O1_price = total_c4O1_bataMerahPcs_price + total_c4O1_batuKaliM3_price + total_c4O1_bautJLPcs_price + total_c4O1_besiPolos8MmX12MPcs_price + total_c4O1_besiUlir10MmX12MPcs_price + total_c4O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c4O1_kawatBetonKg_price + total_c4O1_kayuKelasIi57CmX4MPcs_price + total_c4O1_kayuKelasIi612CmX4MPcs_price + total_c4O1_kepalaTukangOh_price + total_c4O1_kerikilM3_price + total_c4O1_lemKayuKg_price + total_c4O1_mandorOh_price + total_c4O1_minyakBekistingLtr_price + total_c4O1_paku57CmKg_price + total_c4O1_pakuPayungKg_price + total_c4O1_papan325CmPcs_price + total_c4O1_pasirM3_price + total_c4O1_pekerjaOh_price + total_c4O1_semenSak_price + total_c4O1_sengBjlsPcs_price + total_c4O1_tripleks9MmPcs_price + total_c4O1_tukangOh_price;\r\n\r\nif (isNaN(total_c4O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c4O1_price;\r\n  }",
            "key": "c4O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "C4_O3",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C4, Opsi 2: Geser lubang dinding ke sebelah tiang, hal ini membuat dinding menjadi lebih kokoh",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c4O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c4O2_input;\r\ntotal_c4O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c4O2_input;\r\ntotal_c4O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c4O2_input;\r\ntotal_c4O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c4O2_input;\r\ntotal_c4O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c4O2_input;\r\ntotal_c4O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c4O2_input;\r\ntotal_c4O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c4O2_input;\r\ntotal_c4O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c4O2_input;\r\ntotal_c4O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c4O2_input;\r\ntotal_c4O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c4O2_input;\r\ntotal_c4O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c4O2_input;\r\ntotal_c4O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c4O2_input;\r\ntotal_c4O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c4O2_input;\r\ntotal_c4O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c4O2_input;\r\ntotal_c4O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c4O2_input;\r\ntotal_c4O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c4O2_input;\r\ntotal_c4O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c4O2_input;\r\ntotal_c4O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c4O2_input;\r\ntotal_c4O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c4O2_input;\r\ntotal_c4O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c4O2_input;\r\ntotal_c4O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c4O2_input;\r\ntotal_c4O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c4O2_input;\r\ntotal_c4O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c4O2_input;\r\ntotal_c4O2_price = total_c4O2_bataMerahPcs_price + total_c4O2_batuKaliM3_price + total_c4O2_bautJLPcs_price + total_c4O2_besiPolos8MmX12MPcs_price + total_c4O2_besiUlir10MmX12MPcs_price + total_c4O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c4O2_kawatBetonKg_price + total_c4O2_kayuKelasIi57CmX4MPcs_price + total_c4O2_kayuKelasIi612CmX4MPcs_price + total_c4O2_kepalaTukangOh_price + total_c4O2_kerikilM3_price + total_c4O2_lemKayuKg_price + total_c4O2_mandorOh_price + total_c4O2_minyakBekistingLtr_price + total_c4O2_paku57CmKg_price + total_c4O2_pakuPayungKg_price + total_c4O2_papan325CmPcs_price + total_c4O2_pasirM3_price + total_c4O2_pekerjaOh_price + total_c4O2_semenSak_price + total_c4O2_sengBjlsPcs_price + total_c4O2_tripleks9MmPcs_price + total_c4O2_tukangOh_price;\r\n\r\nif (isNaN(total_c4O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c4O2_price;\r\n  }",
            "key": "c4O2TotalPrice",
            "conditional": {
              "show": true,
              "when": "C4_O2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C4, Opsi 3: Pasang kawat anyam, lalu plester dinding di antara lubang dinding",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = Sdata;\r\nlet v2 = data;\r\ntotal_c4O3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c4O3_input;\r\ntotal_c4O3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c4O3_input;\r\ntotal_c4O3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c4O3_input;\r\ntotal_c4O3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c4O3_input;\r\ntotal_c4O3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c4O3_input;\r\ntotal_c4O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c4O3_input;\r\ntotal_c4O3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c4O3_input;\r\ntotal_c4O3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c4O3_input;\r\ntotal_c4O3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c4O3_input;\r\ntotal_c4O3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c4O3_input;\r\ntotal_c4O3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c4O3_input;\r\ntotal_c4O3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c4O3_input;\r\ntotal_c4O3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c4O3_input;\r\ntotal_c4O3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c4O3_input;\r\ntotal_c4O3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c4O3_input;\r\ntotal_c4O3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c4O3_input;\r\ntotal_c4O3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c4O3_input;\r\ntotal_c4O3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c4O3_input;\r\ntotal_c4O3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c4O3_input;\r\ntotal_c4O3_semenSak_price = v1.semenSak_price * v2.semenSak * data.c4O3_input;\r\ntotal_c4O3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c4O3_input;\r\ntotal_c4O3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c4O3_input;\r\ntotal_c4O3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c4O3_input;\r\ntotal_c4O3_price = total_c4O3_bataMerahPcs_price + total_c4O3_batuKaliM3_price + total_c4O3_bautJLPcs_price + total_c4O3_besiPolos8MmX12MPcs_price + total_c4O3_besiUlir10MmX12MPcs_price + total_c4O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c4O3_kawatBetonKg_price + total_c4O3_kayuKelasIi57CmX4MPcs_price + total_c4O3_kayuKelasIi612CmX4MPcs_price + total_c4O3_kepalaTukangOh_price + total_c4O3_kerikilM3_price + total_c4O3_lemKayuKg_price + total_c4O3_mandorOh_price + total_c4O3_minyakBekistingLtr_price + total_c4O3_paku57CmKg_price + total_c4O3_pakuPayungKg_price + total_c4O3_papan325CmPcs_price + total_c4O3_pasirM3_price + total_c4O3_pekerjaOh_price + total_c4O3_semenSak_price + total_c4O3_sengBjlsPcs_price + total_c4O3_tripleks9MmPcs_price + total_c4O3_tukangOh_price;\r\n\r\nif (isNaN(total_c4O3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c4O3_price;\r\n  }",
            "key": "c4O3TotalPrice",
            "conditional": {
              "show": true,
              "when": "C4_O3",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QC5: Jendela tidak memiliki balok pinggang",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c5O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c5O1_input;\r\ntotal_c5O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c5O1_input;\r\ntotal_c5O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c5O1_input;\r\ntotal_c5O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c5O1_input;\r\ntotal_c5O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c5O1_input;\r\ntotal_c5O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c5O1_input;\r\ntotal_c5O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c5O1_input;\r\ntotal_c5O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c5O1_input;\r\ntotal_c5O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c5O1_input;\r\ntotal_c5O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c5O1_input;\r\ntotal_c5O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c5O1_input;\r\ntotal_c5O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c5O1_input;\r\ntotal_c5O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c5O1_input;\r\ntotal_c5O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c5O1_input;\r\ntotal_c5O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c5O1_input;\r\ntotal_c5O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c5O1_input;\r\ntotal_c5O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c5O1_input;\r\ntotal_c5O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c5O1_input;\r\ntotal_c5O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c5O1_input;\r\ntotal_c5O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c5O1_input;\r\ntotal_c5O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c5O1_input;\r\ntotal_c5O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c5O1_input;\r\ntotal_c5O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c5O1_input;\r\ntotal_c5O1_price = total_c5O1_bataMerahPcs_price + total_c5O1_batuKaliM3_price + total_c5O1_bautJLPcs_price + total_c5O1_besiPolos8MmX12MPcs_price + total_c5O1_besiUlir10MmX12MPcs_price + total_c5O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c5O1_kawatBetonKg_price + total_c5O1_kayuKelasIi57CmX4MPcs_price + total_c5O1_kayuKelasIi612CmX4MPcs_price + total_c5O1_kepalaTukangOh_price + total_c5O1_kerikilM3_price + total_c5O1_lemKayuKg_price + total_c5O1_mandorOh_price + total_c5O1_minyakBekistingLtr_price + total_c5O1_paku57CmKg_price + total_c5O1_pakuPayungKg_price + total_c5O1_papan325CmPcs_price + total_c5O1_pasirM3_price + total_c5O1_pekerjaOh_price + total_c5O1_semenSak_price + total_c5O1_sengBjlsPcs_price + total_c5O1_tripleks9MmPcs_price + total_c5O1_tukangOh_price;\r\n\r\nif (isNaN(total_c5O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c5O1_price;\r\n  }",
            "key": "c5O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "C5_O1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi C5, Opsi 2: Teruskan bukaan ke ring balok",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 =data;\r\ntotal_c5O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c5O2_input;\r\ntotal_c5O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c5O2_input;\r\ntotal_c5O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c5O2_input;\r\ntotal_c5O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c5O2_input;\r\ntotal_c5O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c5O2_input;\r\ntotal_c5O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c5O2_input;\r\ntotal_c5O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c5O2_input;\r\ntotal_c5O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c5O2_input;\r\ntotal_c5O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c5O2_input;\r\ntotal_c5O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c5O2_input;\r\ntotal_c5O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c5O2_input;\r\ntotal_c5O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c5O2_input;\r\ntotal_c5O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c5O2_input;\r\ntotal_c5O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c5O2_input;\r\ntotal_c5O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c5O2_input;\r\ntotal_c5O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c5O2_input;\r\ntotal_c5O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c5O2_input;\r\ntotal_c5O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c5O2_input;\r\ntotal_c5O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c5O2_input;\r\ntotal_c5O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c5O2_input;\r\ntotal_c5O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c5O2_input;\r\ntotal_c5O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c5O2_input;\r\ntotal_c5O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c5O2_input;\r\ntotal_c5O2_price = total_c5O2_bataMerahPcs_price + total_c5O2_batuKaliM3_price + total_c5O2_bautJLPcs_price + total_c5O2_besiPolos8MmX12MPcs_price + total_c5O2_besiUlir10MmX12MPcs_price + total_c5O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c5O2_kawatBetonKg_price + total_c5O2_kayuKelasIi57CmX4MPcs_price + total_c5O2_kayuKelasIi612CmX4MPcs_price + total_c5O2_kepalaTukangOh_price + total_c5O2_kerikilM3_price + total_c5O2_lemKayuKg_price + total_c5O2_mandorOh_price + total_c5O2_minyakBekistingLtr_price + total_c5O2_paku57CmKg_price + total_c5O2_pakuPayungKg_price + total_c5O2_papan325CmPcs_price + total_c5O2_pasirM3_price + total_c5O2_pekerjaOh_price + total_c5O2_semenSak_price + total_c5O2_sengBjlsPcs_price + total_c5O2_tripleks9MmPcs_price + total_c5O2_tukangOh_price;\r\n\r\nif (isNaN(total_c5O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c5O2_price;\r\n  }",
            "key": "c5O2TotalPrice",
            "conditional": {
              "show": true,
              "when": "C5_O2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QC6: Jendela tidak memiliki bingkai beton",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c6_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c6_input;\r\ntotal_c6_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c6_input;\r\ntotal_c6_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c6_input;\r\ntotal_c6_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c6_input;\r\ntotal_c6_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c6_input;\r\ntotal_c6_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c6_input;\r\ntotal_c6_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c6_input;\r\ntotal_c6_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c6_input;\r\ntotal_c6_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c6_input;\r\ntotal_c6_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c6_input;\r\ntotal_c6_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c6_input;\r\ntotal_c6_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c6_input;\r\ntotal_c6_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c6_input;\r\ntotal_c6_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c6_input;\r\ntotal_c6_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c6_input;\r\ntotal_c6_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c6_input;\r\ntotal_c6_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c6_input;\r\ntotal_c6_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c6_input;\r\ntotal_c6_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c6_input;\r\ntotal_c6_semenSak_price = v1.semenSak_price * v2.semenSak * data.c6_input;\r\ntotal_c6_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c6_input;\r\ntotal_c6_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c6_input;\r\ntotal_c6_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c6_input;\r\ntotal_c6_price = total_c6_bataMerahPcs_price + total_c6_batuKaliM3_price + total_c6_bautJLPcs_price + total_c6_besiPolos8MmX12MPcs_price + total_c6_besiUlir10MmX12MPcs_price + total_c6_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c6_kawatBetonKg_price + total_c6_kayuKelasIi57CmX4MPcs_price + total_c6_kayuKelasIi612CmX4MPcs_price + total_c6_kepalaTukangOh_price + total_c6_kerikilM3_price + total_c6_lemKayuKg_price + total_c6_mandorOh_price + total_c6_minyakBekistingLtr_price + total_c6_paku57CmKg_price + total_c6_pakuPayungKg_price + total_c6_papan325CmPcs_price + total_c6_pasirM3_price + total_c6_pekerjaOh_price + total_c6_semenSak_price + total_c6_sengBjlsPcs_price + total_c6_tripleks9MmPcs_price + total_c6_tukangOh_price;\r\n\r\nif (isNaN(total_c6_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c6_price;\r\n  }",
            "key": "c6TotalPrice",
            "conditional": {
              "show": true,
              "when": "QC6",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QC7: Pintu tidak memiliki balok pinggang",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_c7O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c7O1_input;\r\ntotal_c7O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c7O1_input;\r\ntotal_c7O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c7O1_input;\r\ntotal_c7O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c7O1_input;\r\ntotal_c7O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c7O1_input;\r\ntotal_c7O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c7O1_input;\r\ntotal_c7O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c7O1_input;\r\ntotal_c7O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c7O1_input;\r\ntotal_c7O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c7O1_input;\r\ntotal_c7O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c7O1_input;\r\ntotal_c7O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c7O1_input;\r\ntotal_c7O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c7O1_input;\r\ntotal_c7O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c7O1_input;\r\ntotal_c7O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c7O1_input;\r\ntotal_c7O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c7O1_input;\r\ntotal_c7O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c7O1_input;\r\ntotal_c7O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c7O1_input;\r\ntotal_c7O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c7O1_input;\r\ntotal_c7O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c7O1_input;\r\ntotal_c7O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.c7O1_input;\r\ntotal_c7O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c7O1_input;\r\ntotal_c7O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c7O1_input;\r\ntotal_c7O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c7O1_input;\r\ntotal_c7O1_price = total_c7O1_bataMerahPcs_price + total_c7O1_batuKaliM3_price + total_c7O1_bautJLPcs_price + total_c7O1_besiPolos8MmX12MPcs_price + total_c7O1_besiUlir10MmX12MPcs_price + total_c7O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c7O1_kawatBetonKg_price + total_c7O1_kayuKelasIi57CmX4MPcs_price + total_c7O1_kayuKelasIi612CmX4MPcs_price + total_c7O1_kepalaTukangOh_price + total_c7O1_kerikilM3_price + total_c7O1_lemKayuKg_price + total_c7O1_mandorOh_price + total_c7O1_minyakBekistingLtr_price + total_c7O1_paku57CmKg_price + total_c7O1_pakuPayungKg_price + total_c7O1_papan325CmPcs_price + total_c7O1_pasirM3_price + total_c7O1_pekerjaOh_price + total_c7O1_semenSak_price + total_c7O1_sengBjlsPcs_price + total_c7O1_tripleks9MmPcs_price + total_c7O1_tukangOh_price;\r\n\r\nif (isNaN(total_c7O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c7O1_price;\r\n  }\r\ninstance.setValue(value);",
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
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.c7O2UnitQuantities);\r\ntotal_c7O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c7O2_input;\r\ntotal_c7O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c7O2_input;\r\ntotal_c7O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c7O2_input;\r\ntotal_c7O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c7O2_input;\r\ntotal_c7O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c7O2_input;\r\ntotal_c7O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c7O2_input;\r\ntotal_c7O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c7O2_input;\r\ntotal_c7O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c7O2_input;\r\ntotal_c7O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c7O2_input;\r\ntotal_c7O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c7O2_input;\r\ntotal_c7O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c7O2_input;\r\ntotal_c7O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c7O2_input;\r\ntotal_c7O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c7O2_input;\r\ntotal_c7O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c7O2_input;\r\ntotal_c7O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c7O2_input;\r\ntotal_c7O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c7O2_input;\r\ntotal_c7O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c7O2_input;\r\ntotal_c7O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c7O2_input;\r\ntotal_c7O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c7O2_input;\r\ntotal_c7O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.c7O2_input;\r\ntotal_c7O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c7O2_input;\r\ntotal_c7O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c7O2_input;\r\ntotal_c7O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c7O2_input;\r\ntotal_c7O2_price = total_c7O2_bataMerahPcs_price + total_c7O2_batuKaliM3_price + total_c7O2_bautJLPcs_price + total_c7O2_besiPolos8MmX12MPcs_price + total_c7O2_besiUlir10MmX12MPcs_price + total_c7O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c7O2_kawatBetonKg_price + total_c7O2_kayuKelasIi57CmX4MPcs_price + total_c7O2_kayuKelasIi612CmX4MPcs_price + total_c7O2_kepalaTukangOh_price + total_c7O2_kerikilM3_price + total_c7O2_lemKayuKg_price + total_c7O2_mandorOh_price + total_c7O2_minyakBekistingLtr_price + total_c7O2_paku57CmKg_price + total_c7O2_pakuPayungKg_price + total_c7O2_papan325CmPcs_price + total_c7O2_pasirM3_price + total_c7O2_pekerjaOh_price + total_c7O2_semenSak_price + total_c7O2_sengBjlsPcs_price + total_c7O2_tripleks9MmPcs_price + total_c7O2_tukangOh_price;\r\n\r\nif (isNaN(total_c7O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c7O2_price;\r\n  }",
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = cityprices;\r\nlet v2 = data.c8UnitQuantities;\r\ntotal_c8_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.c8_input;\r\ntotal_c8_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.c8_input;\r\ntotal_c8_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.c8_input;\r\ntotal_c8_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.c8_input;\r\ntotal_c8_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.c8_input;\r\ntotal_c8_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.c8_input;\r\ntotal_c8_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.c8_input;\r\ntotal_c8_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.c8_input;\r\ntotal_c8_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.c8_input;\r\ntotal_c8_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.c8_input;\r\ntotal_c8_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.c8_input;\r\ntotal_c8_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.c8_input;\r\ntotal_c8_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.c8_input;\r\ntotal_c8_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.c8_input;\r\ntotal_c8_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.c8_input;\r\ntotal_c8_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.c8_input;\r\ntotal_c8_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.c8_input;\r\ntotal_c8_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.c8_input;\r\ntotal_c8_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.c8_input;\r\ntotal_c8_semenSak_price = v1.semenSak_price * v2.semenSak * data.c8_input;\r\ntotal_c8_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.c8_input;\r\ntotal_c8_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.c8_input;\r\ntotal_c8_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.c8_input;\r\ntotal_c8_price = total_c8_bataMerahPcs_price + total_c8_batuKaliM3_price + total_c8_bautJLPcs_price + total_c8_besiPolos8MmX12MPcs_price + total_c8_besiUlir10MmX12MPcs_price + total_c8_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_c8_kawatBetonKg_price + total_c8_kayuKelasIi57CmX4MPcs_price + total_c8_kayuKelasIi612CmX4MPcs_price + total_c8_kepalaTukangOh_price + total_c8_kerikilM3_price + total_c8_lemKayuKg_price + total_c8_mandorOh_price + total_c8_minyakBekistingLtr_price + total_c8_paku57CmKg_price + total_c8_pakuPayungKg_price + total_c8_papan325CmPcs_price + total_c8_pasirM3_price + total_c8_pekerjaOh_price + total_c8_semenSak_price + total_c8_sengBjlsPcs_price + total_c8_tripleks9MmPcs_price + total_c8_tukangOh_price;\r\n\r\nif (isNaN(total_c8_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_c8_price;\r\n  }",
            "key": "c8TotalPrice",
            "conditional": {
              "show": true,
              "when": "QC8",
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
        "title": "QD: Gabel (Sopi-Sopi)",
        "label": "Page 5",
        "type": "panel",
        "key": "QD",
        "components": [{
          "label": "QD1: Gabel (sopi-sopi)  pasangan bata dengan tinggi lebih dari 0.6m tanpa ring balok yang miring",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data.cityprices;\r\nlet v2 = data;\r\ntotal_d1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.d1_input;\r\ntotal_d1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.d1_input;\r\ntotal_d1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.d1_input;\r\ntotal_d1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.d1_input;\r\ntotal_d1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.d1_input;\r\ntotal_d1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.d1_input;\r\ntotal_d1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.d1_input;\r\ntotal_d1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.d1_input;\r\ntotal_d1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.d1_input;\r\ntotal_d1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.d1_input;\r\ntotal_d1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.d1_input;\r\ntotal_d1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.d1_input;\r\ntotal_d1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.d1_input;\r\ntotal_d1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.d1_input;\r\ntotal_d1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.d1_input;\r\ntotal_d1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.d1_input;\r\ntotal_d1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.d1_input;\r\ntotal_d1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.d1_input;\r\ntotal_d1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.d1_input;\r\ntotal_d1_semenSak_price = v1.semenSak_price * v2.semenSak * data.d1_input;\r\ntotal_d1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.d1_input;\r\ntotal_d1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.d1_input;\r\ntotal_d1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.d1_input;\r\ntotal_d1_price = total_d1_bataMerahPcs_price + total_d1_batuKaliM3_price + total_d1_bautJLPcs_price + total_d1_besiPolos8MmX12MPcs_price + total_d1_besiUlir10MmX12MPcs_price + total_d1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_d1_kawatBetonKg_price + total_d1_kayuKelasIi57CmX4MPcs_price + total_d1_kayuKelasIi612CmX4MPcs_price + total_d1_kepalaTukangOh_price + total_d1_kerikilM3_price + total_d1_lemKayuKg_price + total_d1_mandorOh_price + total_d1_minyakBekistingLtr_price + total_d1_paku57CmKg_price + total_d1_pakuPayungKg_price + total_d1_papan325CmPcs_price + total_d1_pasirM3_price + total_d1_pekerjaOh_price + total_d1_semenSak_price + total_d1_sengBjlsPcs_price + total_d1_tripleks9MmPcs_price + total_d1_tukangOh_price;\r\n\r\nif (isNaN(total_d1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_d1_price;\r\n  }",
            "key": "d1TotalPrice",
            "conditional": {
              "show": true,
              "when": "QD1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QD2: Gabel (sopi-sopi)  pasangan bata dengan tinggi kurang dari 0.6m tanpa ring balok yang miring",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_d2O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.d2O1_input;\r\ntotal_d2O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.d2O1_input;\r\ntotal_d2O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.d2O1_input;\r\ntotal_d2O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.d2O1_input;\r\ntotal_d2O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.d2O1_input;\r\ntotal_d2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.d2O1_input;\r\ntotal_d2O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.d2O1_input;\r\ntotal_d2O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.d2O1_input;\r\ntotal_d2O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.d2O1_input;\r\ntotal_d2O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.d2O1_input;\r\ntotal_d2O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.d2O1_input;\r\ntotal_d2O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.d2O1_input;\r\ntotal_d2O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.d2O1_input;\r\ntotal_d2O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.d2O1_input;\r\ntotal_d2O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.d2O1_input;\r\ntotal_d2O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.d2O1_input;\r\ntotal_d2O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.d2O1_input;\r\ntotal_d2O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.d2O1_input;\r\ntotal_d2O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.d2O1_input;\r\ntotal_d2O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.d2O1_input;\r\ntotal_d2O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.d2O1_input;\r\ntotal_d2O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.d2O1_input;\r\ntotal_d2O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.d2O1_input;\r\ntotal_d2O1_price = total_d2O1_bataMerahPcs_price + total_d2O1_batuKaliM3_price + total_d2O1_bautJLPcs_price + total_d2O1_besiPolos8MmX12MPcs_price + total_d2O1_besiUlir10MmX12MPcs_price + total_d2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_d2O1_kawatBetonKg_price + total_d2O1_kayuKelasIi57CmX4MPcs_price + total_d2O1_kayuKelasIi612CmX4MPcs_price + total_d2O1_kepalaTukangOh_price + total_d2O1_kerikilM3_price + total_d2O1_lemKayuKg_price + total_d2O1_mandorOh_price + total_d2O1_minyakBekistingLtr_price + total_d2O1_paku57CmKg_price + total_d2O1_pakuPayungKg_price + total_d2O1_papan325CmPcs_price + total_d2O1_pasirM3_price + total_d2O1_pekerjaOh_price + total_d2O1_semenSak_price + total_d2O1_sengBjlsPcs_price + total_d2O1_tripleks9MmPcs_price + total_d2O1_tukangOh_price;\r\n\r\nif (isNaN(total_d2O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_d2O1_price;\r\n  }",
            "key": "d2O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "D2_O1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi D2, Opsi 2: Bongkar dinding yang terbuat dari pasangan bata dan ganti dengan dinding rangka kayu.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.d2O2UnitQuantities);\r\ntotal_d2O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.d2O2_input;\r\ntotal_d2O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.d2O2_input;\r\ntotal_d2O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.d2O2_input;\r\ntotal_d2O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.d2O2_input;\r\ntotal_d2O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.d2O2_input;\r\ntotal_d2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.d2O2_input;\r\ntotal_d2O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.d2O2_input;\r\ntotal_d2O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.d2O2_input;\r\ntotal_d2O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.d2O2_input;\r\ntotal_d2O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.d2O2_input;\r\ntotal_d2O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.d2O2_input;\r\ntotal_d2O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.d2O2_input;\r\ntotal_d2O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.d2O2_input;\r\ntotal_d2O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.d2O2_input;\r\ntotal_d2O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.d2O2_input;\r\ntotal_d2O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.d2O2_input;\r\ntotal_d2O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.d2O2_input;\r\ntotal_d2O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.d2O2_input;\r\ntotal_d2O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.d2O2_input;\r\ntotal_d2O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.d2O2_input;\r\ntotal_d2O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.d2O2_input;\r\ntotal_d2O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.d2O2_input;\r\ntotal_d2O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.d2O2_input;\r\ntotal_d2O2_price = total_d2O2_bataMerahPcs_price + total_d2O2_batuKaliM3_price + total_d2O2_bautJLPcs_price + total_d2O2_besiPolos8MmX12MPcs_price + total_d2O2_besiUlir10MmX12MPcs_price + total_d2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_d2O2_kawatBetonKg_price + total_d2O2_kayuKelasIi57CmX4MPcs_price + total_d2O2_kayuKelasIi612CmX4MPcs_price + total_d2O2_kepalaTukangOh_price + total_d2O2_kerikilM3_price + total_d2O2_lemKayuKg_price + total_d2O2_mandorOh_price + total_d2O2_minyakBekistingLtr_price + total_d2O2_paku57CmKg_price + total_d2O2_pakuPayungKg_price + total_d2O2_papan325CmPcs_price + total_d2O2_pasirM3_price + total_d2O2_pekerjaOh_price + total_d2O2_semenSak_price + total_d2O2_sengBjlsPcs_price + total_d2O2_tripleks9MmPcs_price + total_d2O2_tukangOh_price;\r\n\r\nif (isNaN(total_d2O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_d2O2_price;\r\n  }",
            "key": "d2O2TotalPrice",
            "conditional": {
              "show": true,
              "when": "D2_O2",
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_e1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.e1_input;\r\ntotal_e1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.e1_input;\r\ntotal_e1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.e1_input;\r\ntotal_e1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.e1_input;\r\ntotal_e1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.e1_input;\r\ntotal_e1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.e1_input;\r\ntotal_e1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.e1_input;\r\ntotal_e1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.e1_input;\r\ntotal_e1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.e1_input;\r\ntotal_e1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.e1_input;\r\ntotal_e1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.e1_input;\r\ntotal_e1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.e1_input;\r\ntotal_e1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.e1_input;\r\ntotal_e1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.e1_input;\r\ntotal_e1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.e1_input;\r\ntotal_e1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.e1_input;\r\ntotal_e1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.e1_input;\r\ntotal_e1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.e1_input;\r\ntotal_e1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.e1_input;\r\ntotal_e1_semenSak_price = v1.semenSak_price * v2.semenSak * data.e1_input;\r\ntotal_e1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.e1_input;\r\ntotal_e1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.e1_input;\r\ntotal_e1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.e1_input;\r\ntotal_e1_price = total_e1_bataMerahPcs_price + total_e1_batuKaliM3_price + total_e1_bautJLPcs_price + total_e1_besiPolos8MmX12MPcs_price + total_e1_besiUlir10MmX12MPcs_price + total_e1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_e1_kawatBetonKg_price + total_e1_kayuKelasIi57CmX4MPcs_price + total_e1_kayuKelasIi612CmX4MPcs_price + total_e1_kepalaTukangOh_price + total_e1_kerikilM3_price + total_e1_lemKayuKg_price + total_e1_mandorOh_price + total_e1_minyakBekistingLtr_price + total_e1_paku57CmKg_price + total_e1_pakuPayungKg_price + total_e1_papan325CmPcs_price + total_e1_pasirM3_price + total_e1_pekerjaOh_price + total_e1_semenSak_price + total_e1_sengBjlsPcs_price + total_e1_tripleks9MmPcs_price + total_e1_tukangOh_price;\r\n\r\nif (isNaN(total_e1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_e1_price;\r\n  }",
            "key": "e1TotalPrice",
            "conditional": {
              "show": true,
              "when": "QE1",
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = JSON.parse(data.cityprices);\r\nlet v2 = JSON.parse(data.f1UnitQuantities);\r\ntotal_f1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.f1_input;\r\ntotal_f1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.f1_input;\r\ntotal_f1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.f1_input;\r\ntotal_f1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.f1_input;\r\ntotal_f1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.f1_input;\r\ntotal_f1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.f1_input;\r\ntotal_f1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.f1_input;\r\ntotal_f1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.f1_input;\r\ntotal_f1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.f1_input;\r\ntotal_f1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.f1_input;\r\ntotal_f1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.f1_input;\r\ntotal_f1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.f1_input;\r\ntotal_f1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.f1_input;\r\ntotal_f1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.f1_input;\r\ntotal_f1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.f1_input;\r\ntotal_f1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.f1_input;\r\ntotal_f1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.f1_input;\r\ntotal_f1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.f1_input;\r\ntotal_f1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.f1_input;\r\ntotal_f1_semenSak_price = v1.semenSak_price * v2.semenSak * data.f1_input;\r\ntotal_f1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.f1_input;\r\ntotal_f1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.f1_input;\r\ntotal_f1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.f1_input;\r\ntotal_f1_price = total_f1_bataMerahPcs_price + total_f1_batuKaliM3_price + total_f1_bautJLPcs_price + total_f1_besiPolos8MmX12MPcs_price + total_f1_besiUlir10MmX12MPcs_price + total_f1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_f1_kawatBetonKg_price + total_f1_kayuKelasIi57CmX4MPcs_price + total_f1_kayuKelasIi612CmX4MPcs_price + total_f1_kepalaTukangOh_price + total_f1_kerikilM3_price + total_f1_lemKayuKg_price + total_f1_mandorOh_price + total_f1_minyakBekistingLtr_price + total_f1_paku57CmKg_price + total_f1_pakuPayungKg_price + total_f1_papan325CmPcs_price + total_f1_pasirM3_price + total_f1_pekerjaOh_price + total_f1_semenSak_price + total_f1_sengBjlsPcs_price + total_f1_tripleks9MmPcs_price + total_f1_tukangOh_price;\r\n\r\nif (isNaN(total_f1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_f1_price;\r\n  }",
            "key": "f1TotalPrice",
            "conditional": {
              "show": true,
              "when": "QF1",
              "eq": "true"
            },
            "type": "number",
            "input": true
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
            "key": "aksiG1Kasus1TambahDindingSebagaiPengkakuPanjang15M",
            "conditional": {
              "show": true,
              "when": "QG1",
              "eq": "true"
            },
            "type": "checkbox",
            "input": true
          }, {
            "html": "<figure class=\"image\"><img src=\"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAArIAAAEACAIAAADA8QI0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAP+lSURBVHhe7J0FYBXHFoZvhODu7q7Fi7u7W3F3h0LR4u5e3AvFobgUd5fiLsUlAWLv2z3LvO29SbgJCSQ0f+nN7uzs7OzMkf\/Mzs46eHt7W0IRisADEgUcdEjKnTt3YsWKFSFCBEmXXzkUdECu3S1eDhbvMAi4o5ORyP9eXg5ejh7O3g4WDydvJ4uDoxz6HLwt3g5eDhSgbVgc\/nUa13KweFksDl\/jxkIRiuAE1NnYQgHs0O6HDx9++PDBy8vr6tWr+\/btCxs2rKOj4+XLl9evX\/\/mzZsuXbqMGzfOyBqKb4RQWhCKoAJKPmPGjOXLl588eTJlypSofYYMGb4OJwDeXvhvT28nZ\/z3+5vX3167GS5m7AjZs3paLM7e7rABXLmDxVFz9HZVx8tLowNOZHe0UIaT29\/X3968HiFu\/IjZMusq5K5ZRW9n+0oLRShCPMR3+Eudcfk9e\/b09PQMHz589uzZ3d3djx49ahzT0b9\/\/0GDBhk7ofhGCKUFoQh83LhxY8mSJePHj3\/x4oWRZLGsWLGiVq1aX40WeGhDBdoowbUJU71mzQh3\/\/6HqNHdK1dKPWhgmBhRLV6e3o5OeHpIA7G\/cY7vECWRfGjMteEjHeYvD\/PoH8\/okd1rVUs1oI9TpIjwELgGrCEUofhPgQDg48ePFy9ePH78+IcPH65du3bkyJHBgwdXrVrVyPEJf\/\/995UrV2LHjh01atT06dNPmTJlwYIFTZo0yZs3L0cnT5788OHDDRs2hAkTRvKH4psglBaEwl747dEfPXp09+5dfD8W4cGDB3Hjxi1ZsmT16tXjxYs3c+ZMgoDo0aPPnTu3SpUqX4cZeFs8Ce5vzZ7\/vuvAeGG9LeHCwATevn7tVb5skpnTHKNH8tYeB+ie3q7KQCHIqfn8a7+O8hg7LlbYMA5hIjm5v3\/5+q1XmybJRg5zDOMsF5UTQhGK4AwrNQyYVj579gwdP3\/+fKpUqZ4\/fx4hQoRixYo5Ojrmzp27VKlS0aJFI48fJd++fTtmzJiRIkUy9i2WqVOnHj58GEMBM\/g6hiIUtgilBaGwCyInVlr64sULSMDWrVuJD3bv3u3k5JQ0adKGDRtWqlQpTZo0RiaLpVq1amvWrGEjZ86cBw4ccHFx+ToK\/+HJP3dKV4h+74FnBBdHbwcXD2cvR693r194Va2SeNoES8SI3l7ejlTDjop4a1MHyOh4Z+yED0OHxQgf0dHRiURPi5O3t8dLD694G9ZHyZXVy+LpGEoLQhES4KNG+4bXr1+3atWK31GjRmXMmNFItVjc3d2XLVtG6F+wYMFw4cJBC4wDJpiVfceOHTN0xIoVS1JsMWbMmEOHDk2ePDl+\/PjshjKDr49QWhAK\/2H\/\/v379u1bsWIF2wkSJMiaNWuBAgWwDuHDh0+WLFm6dOkkm+DEiRPdu3f38PAYOnTovXv3OnbsmD59+m3btpHZyBGUcL1642nJEhE\/enk5OzlYvBy8XTwdHBy9Pd68feFct37icWO8w7kg\/faP+t+ZNudD\/76xw7h4ObugOo7aFERnT0ePD2\/fRF60OEr5UvqIgpE5FKEItjBzAtQTXL58+dSpU66urokSJSpXrpzVMP6HDx+2bNkC7y9WrFjEiBGNVP\/g+PHjGIF169blyZNn8+bN0aNHNw6Y4OXl5eioqSO0ABOBbQnlBN8EobQgFJ\/B\/fv3379\/f\/36dWED165dQ3WzZ89erVq1Bg0aJE6c2Mj3CSo4WLBgwcyZM1u3bt2wYUM5dOPGjcKFC6dIkWL9+vVEGJIYdHh77fa9UqXjvP\/obHH54OTl7ejtRDDv6GXx8n795qNjy5+SDhvkHcbZQXPm1FsfNtDfMwCGNTK5+XuLlrzo2S8Rh52dPJy0gYYwsAwHL4u316v3blFWLIpRolgoKwhFCAJ6XaFCBRy2s7Mzzh6vXLVq1Tp16uC5YQBGJt+BpouyA9mQX+OwngGeQSAxZcqU06dPEz+0bdu2YMGCxmEbkJ9fVcK7d+\/u3LlDICG7\/wnoFkT70VrCxppYWacgQygt+A9B9bWtAluB6AG7sHz58smTJ1+5ciV16tRYENgAJiN27Njly5ePEyeOkfXfxcqGFH7v3r0oOiRRcPv27TRp0qRMmXLlypWZMmUyi58f9QkAvCwWz7dvL1etF+fY8XARI3k4WDwdHbT43tHdwdvBydPp6ftXEdu2SfDrAG9U0NvTwdsZ3kC7eFgcHcmlsQSpnVavxyvXvOjYNTrEAgvq5eABHXBwdIQaWLwcPrg+iBUzxebV4ZKnJnvojMNQBDXMWgN8VByVB38MHV+9ejU6271790SJEkk6GTw9PeHur169QklLly4dL168L5nr939t+QTMyM8\/\/\/zXX39VrlyZ2CBhwoTGgc+Boijn+fPnP\/74Y6lSpbBCkshv4FqJYAe90zyxLlgS3Qh5a8Oc3LQRvHg5eHlZHIL6fadQWvDfguibsaPj1q1bp06dIv3Dhw\/79u07d+4ccUPatGn79+\/\/5MmTs2fPJk+ePGvWrGHDhrU60VyU2t62bRvGJXPmzGxLiu0VJ06ciHmKHz\/+li1bMmbMSAbJY5XtC\/HRYnGxWP7Zue9Z4+ZxPrx1dInsaXH0ciTA195RcPZycfB6\/\/SjW4SeXeP36gkvQA+4vqZ8OiH3dvB0sDi6Wxwxk\/9s2PpP206xP7x3DOtCRpTVw1FTXE9HS7iPb59+9Aw3ZnySxnVhFNp8w0C9i1CEwhaiL8aODhzwmzdvIkeODGs1knSQs3r16o8ePUqVKlWTJk2I15Xj1yQ+8LysuUqwEIKKJEmSsE2trAIDe6Dqdv36deqfN2\/eGTNmSDqQBw3fJbR3o3SHrLWmborMwwZs4rD13aA1MqG04D8E+hphe\/v27bFjxw4cOLBq1SrsBZTc3d2do8Tu2bJlS5cuXaFChVKnTh03blxbk2ElLeYMHz9+bN269eXLl\/H6uXLlUjnNeaQCbNy+fXvEiBFLliyBiHBRyWx7uS+Fp7fFyeHRmnUv23eI7eFocQnn5eAurNvBK5yzl7en14cn3u7R+\/aJ27GNrpDUQ6MGej28LPrkwWe7dz1q1jbWO1fHcC5hPJzIAHv3dPRiy8nT45\/3ri4DfknaqYNWqDencIOhUw5DEYQQJULR\/vzzT5QONg+zv3btWrFixdq0aWM1jEdOMsDpjSQTOCoZ2OZXbX8Jjh49ivpfuHBh2bJl6dOnV2Xql9K27b+EOvfdu3elSpXivpYuXfp15iR9O3h7WohdNEKg2R5ogSR\/ajP+6hbq\/ylBhFBa8D1AOlG0SKmTFSQPdqRTp0579+6NGDFiuXLliC3QtzJlyrAbM2ZMe2i4j+U\/fvy4ffv2UaNGnT59unkc0lwxq13imwoVKmzfvn3t2rUVK1ZUR4GP9fcvcNGOXnpob3G8v2Tlu66dYzmEt4Rx8eA62gMDruXAQS8P9xfe7tGGDIrVoom3xQul0x40OGgvGhJ2vTh85FGj5rGfPfeOGM7JE3V18nTkqIeDxcvFw+vlWzf3n3ul\/Lmrdj1vSIFGKEIfIoTCX\/is2BNwX7p0KXbs2MmTJ1faV6VKlT179oQLF65y5cpp06Zll6MBVhxVrJ0wKzLw9PRcuXLllClTDh48mD9\/fphBjhw5rMq0OsVOSCH8tm3blmCGW5a3Ga0K\/06gjTdyV9raq0aKbscwS45EI\/xPA0pqECOUFnwP8FHliCHOnDmzcOFCJyenYcOGpUqVimwA9o01+ZKHiGa8f\/9+3bp1kydPbtmypZpa+FlQDWoLR2natOmSJUtWr15drVo1qR5HA2WQkJIcLO5eWuyuFXdn5uz3fQfEDRPGyzmsuwMe\/6OTxUObH+Dt5PDxwzMnz5gjx8RoUFe7vJcXlXN0cHh15vT9Bs3j3n3qFMnFw8HD2dsZpdWGIBy9LN4Ob168d+jYItnQgZziqS2x7Glx0MYSvo7ehiIkQsQbWKmqOR2lOHz48PPnz7ds2XL79m0C\/YQJE0aPHr169eo\/\/PADOeXcFy9eEDqjyFZFfQVIbeW67u7us2fPxsiwUUxH2bJlJU+gV6xdu3Znz56VSRKUD76zpwnckUWLSxzcLO4H7v39zuNjttgJk0bkZvXJBtgq\/ZmC9mucEVQIpQXfFT58+HDy5EnMytKlS48fP26kWixjx47t2lULaulus7pa7QYAW7duXbVqVc+ePVOnTm0k2QGROrl0t27dxo0bt23btpIlS5rTvxia89b+okja6gSWGxMneg0cGi9smI\/OkT0dPR0snpAGbfqht5f3R7fnYcPGnjA5WrXy3hYPB4vzm0tX7vzUMM71Oy4Rons4klMbeUBdtHEEb8vrlx7ezeunGDfE28FR4\/MkOXg6hq58HAq7gaq6urriTSPqUJJ\/7ty5XLlyEXNHjhy5cOHCGTNmZFde5\/Py8lKqoTYCVWX8ASozd+7c0aNHJ0qUqHv37sIGBFQJUKVArxUUZNq0aVOmTKF9vtWNByG4IQfL32\/vd9g1c8+9sx8dvZKEi9krZ622mcrq66Y4areqtSy5gvauQ2nB9wBUdNGiRTt37iRwf\/36NaqCHalZs2bcuHGLFi2aMmXKWLFiEVgYuf+NL9ErUX5jx2bXbyitpvJ58uS5cOHCxYsXkyVL5q9C\/IQWvxNNOHh7aAMHMACL5drwsZZRI2KFj+KuzczycPRy5mJE+04WB4\/37k+jhEswbVzU0mXf3bxzu36zaJcvhIsU3ovWdQjj4OXk7eDl6O3t4uX+6rWba926qacMd3QJp3F3bdYwOqvdj0YbAqXuofgecejQIYJdBP7u3bvXr19HJSHTv\/zyi6LUCP\/79++fPn3q43u\/xpZPCCSVsRfLli0bMGDAP\/\/8M2jQoI4dO0qiVQ0Dt0rKLBDwLF++fP369ZIeYqG3lR63aG9C0VravuWC66MaW4ZcfnHZEjG8Zr0+eji5Oi0u2aNOyoLatAPDxIDAbFtbhNKCYA0\/NO3SpUtEG9mzZyfR09MTRX38+HGECBGIPEqUKBEjRgzfeIC\/gAlzdNSm4sml\/\/rrryVLlnTo0MG80tmX49GjR1mzZo0TJ86BAweiRIkil5N7N9+yf6EpkfGX\/7WC2Lra7xeXibOiRo7q7qSNE1i8nfSBSA9PhzAf3N+6xooV45cBzxctCH\/weLgoEZw83Snio4OLozZU4BHGy9v15evX1SunmjHJ2Wb206fLheK\/Dg8Pj4cPH+Lg8fdKd8CsWbOGDx+eLVu2QoUKyTAA2uri4iJHgwN8VLqbN2\/euHFj5cqVHz58YPf+\/fvcXevWrWvUqBEvXjzJ8zVBNTBKJ06cIJwQQ\/ElVuIbQf\/0mrcWq3g4eOpPH52uuz2tsWXo6ReXLBHDaRObtRDD2\/vjx1xh0+2sMSySM0EIDls3MkF8u6G0IFjDVkvx\/TDlOXPmHD16FOOyd+9eEoNOMVTJZ8+eJTLAIlSuXLlly5bQjsC6olziyJEj27dvJ\/JQrzPBSEgPrKsoeHp7Xu\/6c4RZcyLEiOmuz+Lxsji4eLlrbwlbwnp6url5uIdxcg7j4qJRBi8LldCV0eLk4O7+\/OXzMuVT\/jbNJWpkjjiGzi\/8DwP5RHR37Njx\/Plzth88eLB582ZSnJyc8uXLFy1atDJlygQue\/7KgKzv2rWL0Jxg4OXLl0aqjnPnzmXKlMnY+RZwc3ODVBFIbNu2zeqdzJACTAr\/sCDYeGzM\/Y8vamwZcfjRGadI4T01m6fNO3Tw9oQXJPNKdLDWmPhhI5PT66t8cyWUFoQMwNaPHTv2+++\/nzx5EgNUrlw5jE6VKlVQDI6KB5WcgsD1pgsWLBg8eHDbtm07dOgQuMGNEj9V4Tt37syYMaNZs2YpU6aUlECEaCDB3LX2HSMtWRYhWiwPbWBOm0SoTenxcnb09oQreDl6O2lzCBzdHZy1xw\/e7uG8vN68fvusSP6U8+eEixnTW\/9sszYxMah5eyiCH4hT4a958+bt3bu3KGDYsGHLli2bPHny6tWrs506dWpZxFPE21YZzVY30InvFwKWs2nTplWrVsHUCUKM1E\/1pOZsjBkzRuYqfRNIHe7du1erVq3w4cMTJkUM0HrM3xiaCHAnmvd\/6uFaf+vQbfePOkSK6KA9loQtOOKbHbw9vBzck3skPFBnfPywEbW3EjTjxBlBKzOhtODbQCTbdtuMW7duwQNcXV2hw7BjDNDr169LliyZPn16FVL7dm4AIJJgVdq7d+\/GjRtHSDR9+vQMGTIYqUEAdSNYpVKlShGODB8+3Mdpkl8AXLm39vaBxeLu5najZZuoazaFiR7bUfPxnh7a5AMvR4u3h\/Z6grcTPJ19i5OjNjX448dXb\/7J\/WPKRb+FjxdHm\/5DjWgtahU4bR+K4Atb8YMfow6xY8c+deoUPil37tzwANtFewJRN78QtqptW7eXL18ePHhw5cqVcIKnT58aqTrIKSUoxIgRY\/z48cTrfq9MbHvdQIG5WJgBLI06W32NJZgDS4SPd9JJwWuv9w12jN1we58lUjj9S+9O2kiBJ5m8tHjl3dtK8YuuLNMrrKMzp3g5eOkTmwO5Sa0QSgu+DUQt5ddI0n3wvn37Pn78eP36ddj6oUOHULxZs2YlS5ZMPlEaFKAOUg1zTRQwFseOHYOLGPtfBZ6enp07d54yZUqLFi3Gjh0bOXJkq4b6AmjTD701Z2\/5+Obt9SbNI23fESlKNC8LKsclOGpxtHjBCjRC7g1LsHg4On546\/YsY7oUC+dESp5MmxCsLZMEtOeCofjuoWTv4cOH8ij9yZMnmzdvbt269fbt2wsVKqTnCtbQVdxnHb9x48bFixeXLVt25MgRzI6R6icohNJko2DBgvHjx69Tp0706NF\/\/PFH26FEmZxk7AQNfv7550WLFm3bto24RW7TOBCMoQcono6Ozq7eHs12T1h+dZtD5Ei6VaGtuAEvbVYBzez+Mb57jI0V+2WPk0Y\/h8BFm\/ysZQlKhNKCb4wXL15cuXKFcHzNmjXXrl17\/fq1k5NT0aJF4eMw8e7du6uPkaueCjq5J0pYvnx5pkyZihQpwu631bEePXqMGTOmVKlSW7duNZK+HNoteeie3cnByeL29Mn1pi1jHTzsHD6K\/l7wBy8YvMXR20ljBo4aLfD46G55niRt4sVTI6dJ6WVxd\/AOo2ssSqo1TQiwQKH4Yty8ebNly5ZZsmSBpCqlWLt2LfyA9G+rJv7Fhw8fqDaE5tKlS\/zeuXMHE2Qc0yFTjIGx7xO4X9sMadOmjRIlStWqVWPFilW8ePE4ceIo2xVEoA7S8lOnTl24cCFcLWbMmHIouENvPHcHz1b7ps27sskhgvbegf5KgqOD9qjAE8vi7eEZ7WPElWX6lkyUSVuvlWQy6AMMQY1QWvBtADFfv369h4fHu3fv0J9bt26FCRPG2dkZf5wxY0Z5YClQoi\/b\/AaFDdq4cePMmTOxET\/88AOWLl++fJKuxONrGj51y7\/99lvz5s1\/\/fXXX375RQ59CbgTTe20eN9Te1zAFRwcXO\/\/86hcpWgP73mGxYR56i9dOGnvNDpACyDnH186hYk5f1bU4kW9ONnB0xEerymwpjk6MQjFdw4i0f79++Pnxo8frwau5NfT0xMSr8Q12AIj8+jRI+j11atXt2zZ8vjxY6sphFJ\/bkR2vxw0VMSIEQsXLpwsWTKCnFSpUiVOnDgo3rlQjX\/\/\/n0u+v79e7PxDDA0XTc2jZ1\/pZjgW\/q\/YRSB3WBbHPtHi6XbwVlTLvxhiRiemISDjl5eXk6Ouuv3sni6R3SLsKxE74rJc2jdgrHhHP0NRa28IEYoLQhkqPb00VKgnAQZ06dPP3v2bPXq1fv27UtoHlgLDn4WVn0tNYRiUx9iiPLly1epUiVp0qRyNJigRYsWc+bMkZnPUv8vMcGaxunKiTHRFwex3B013nvitPBaodoHkMJ4e3LQy+KsfyrJy8nT2dXrvVfpkgnHj3eMjktwt3iH0ZyCRgq0AgJelVAEP1gpL960ffv2e\/funTZtWpkyZeRQsILSCDas9MLNze3kyZMXL17ctWsX1ubvv\/8mCDGO6ZCzjB0T0qVLR7jPBreMO793796oUaOg5l27dv348eOUKVOiRo26bt2627dvUz5uWM4yw7ZkAp4sWbKkSZMmV65cuXPnxsj4tjCDuhGr27EHrq6u+fPnp8uaNWtmJAUI1IN\/jtRFMxha+O7tpFXMkfuyWLhhaiYvf2s5HLzJqf3Rblsb\/bd5ZEIuLRZx8NKiCvacHJw8LZafjy8cfWK5JbKTxSGMbpS0hdo13uDthfEJ99phXrFedVLnN8r4uvBZMkIRKHj16tWZM2eOHz9OSBEpUiQickzMixcvsmbNWrp06ZEjRxr5vhboa+luedqHyZg9ezbGok6dOqiTniXY4cGDB4kSJcI8UVuMy5c+qtQ+XIBKOmsrFVss98ZO\/fjriOgRXbT1jLTJhg5OXg5hvCzu2hsGaLK3k2dYR2\/3l64vvatVTTp5gkPEiF6a2dKsBpqssX5\/265QBF+IgoiA\/fXXX02bNsWHTZo0KaQMTeOkd+\/ejcNevXo10fOlS5eMA59g67CJ4AsUKBA\/fvxs2bJhBLj3zJkzR4gQwTisK2ClSpUokAyUj01TQT8qye7WrVuv6Th16hTGBA2Vo34A2pE6deoMGTIUKVIE7c6XL19gDSTAgapVqwYtGDt2rJEUIGgKrv3QWJowaHTAwXLm9cPRB5bce\/sI518uTYGOWSuEc9TfFpQW1WYo23ICA3JIK0bfGnBm5eDDCx3DO1mcSdAWaNfO1o95e310fus5s2C3phmKfzrvayOUFgQ+oALr1693d3c\/ePAg\/Pr8+fMwd9q5bNmyKFjRokWTJUsmOUkMACn+cjx\/\/nz48OEHDhwYPHhwiRIlJNEsCd+kVr5h8eLFQ4cOLVWq1MSJE42kgEJn80DTtIczZ73rMziGSzivMI6OEHRtEAHoowToJ8Sd3vEKB1FwsLg\/e\/\/WuW7dJGNHeYdztmjfUUKTdVMRiu8Ioo\/4tt69ey9dunTEiBHymQ9RjWClFAq4\/7NnzxK44xGvX78OJzAO+I4ECRJAdzJlyoRFSpgwod8DhKdPnx40aND8+fM5i92bN2\/6OErv6el59+7dN2\/ebNmyBa5w5MgRSMnr16\/fvn1r5PAd2EPIAZFS3Lhx+Y2of7bNOGYf6CAgfI4K161bt1ixYlOnTpWjAQWdThhhDAqefH272oYht9\/esYTVhhAsHxyapio3u0R7bUV0\/XEiqZwjixBZQzuCbHFEOzb24vpe+2d4hndydHSifAvcQvtDqMLlPCyvPSf92L5D1nJ6iZ4O+kqteilfD6G0wC7QSmIUZEMazdZMbNiwAXcLp27evHmFChWiRImCiKMwwqDNHByoMr8m7t27N2fOHEweFVu5cqWsuurb7QQfwGNy5cpVvXr1kSNH+tH+n4GuuLIeyIPFy9506xnL0dEzbBiLF57eCQXF\/X909nD0dnD2dPZ0cNRWL9A6zsERtff2fun6OkyzxolGDPd21iqgTTLQQ4VQfE8g9u3SpQvasWTJkjRp0kii36pqPup3TjuhxNu30gjT8cFE8Ddu3Dh06JCrq6txQIecaOx8QsqUKRMnTly7dm028ufPb2WLBD5e7tSpU0OGDFmwYAGuGly+fNnOt6OpFZXcv3\/\/s2fPVq1ahQrb86YDFaP8kiVLxogRo0aNGmxnyZLFOGaCaiLzroBE2AnRV9q0abF16lvMVqf4ASmLRsQisI0vd\/P2qP3niA33dzlEiK4dIdnB3fL6w\/pSQyomz6XPOtJ8ula0Vr71JbRF0XR6AWZd2d72ryme4bwwOdoMJ0f9ey2exCVQAy\/KHJa95c85q1OkvpyaD88kvgJ8EKBQmKHaxyxPJAIE\/dGjR1B1pBBC8Pjx4+PHj8MGkEVor5E1GICqUvmrV69SsRMnTkAFGjVqlDdvXnWIX7btUZhvCIKh4sWLYymWL18ewHleOi3gpMerVj3r1CsOBCAsLv+9s7fzB0cXFDCsl4eXt5erq1uEsC5OTmE+OLg4OLo7ebl7obpejs6eXs8+vArfrmOCQQO0gQVtpQN4QbButFD4C+vXr69cuXLbtm3HjRsXNmxYI9V3QPdFCDmlZcuW5i8cBgyiicC2ENzzrVu31q5dS7wOFfD490QBH5EwYULI9I8\/\/pgjRw42lDv3Fy5cuDBs2LBp06ZFjx49e\/bsR48eDdhTvLdv3x4+fJjKb968GbqAITIOfILcsmoBAYl58uSh5lWrVo0XL17u3Lll0MIPSBe8e\/euUqVKmGhCIFlcQUq2p3f0GmiDheTWfxzuvn9bcEXH246PHRzDai8va4TBy\/uDW74Y2bdXHBDBElY3Axo9wLfbBAveWBVH7aGlZdGNfa13jXd18XQIE0Y3RzIUQexB\/AEncOuXpdHgfPXJqT9OMOzV10coLfALImHGjh5qL1q0qHz58kJg586dO3jwYPQTd4WjKlu2bIYMGYLncqfoYbNmzSpWrAghQMeoM1w+YGbiG2Lq1Knt27evW7cuqm4k+R9Pt2x70qp1PDcPi0tED0dPJ4u2IDmcwNPRy+mj9yuH8O5Vyjrs2h7v2T8eYaN6aFrrbrFoQwnO3l7Onu7PPnyI1L1XnJ+76CfpSh2K7wXbt29Hx5s0acK2nV5ETESHDh2uXLmybds2K4vxJXj9+jVqu2PHjjNnzohDtZrfx4WsrDeRMc4bQ5Q0aVL8KMFJ7NixjWMBBXWAJP3yyy+xYsXC9G3cuNE48AVwd3e\/du3a9evXubv79+\/v3LnTzc3Nx9mLVuCOYsSIkT9\/\/syZM2NpoSnRokWzbXDVC126dJk8eTJEpFSpUuZ0v6G3qU4LtIEB7Yy7H94UXN7tttMj3eljDHDlTloc\/+79gsI9G6YuTNH6zADyG6MC\/4J21OGPO4ca7Rj31vm9o5MWhGiWg+pohzw1mvHqfccMNScWbsrlvbSvsmk5tI1vMVwQSgs+DxQSP7R169ZLly5BXUeMGCGz4nGuT58+RS7VOJVAmtQe+fs6oJIQZyh\/kSJFzp4926ZNm8uXLzs7O5cpUwYjUrBgQVm+kBuJHz++nBJsMXLkyN69e7dq1WrGjBlG0mch2q3772d7Djxp1ibm2xfOYV3oJy9LGG+Lk6ejd1gvD2+vD8\/eeYYZ0DdZl7b312x43a59PE9vz7ARtO8sa0uPadOEtfUQPb1eurtH7t8jbocORtnyBwSXDg9FIMAeLVZ5INk4qokTJ1aoUEEOBQxPdPzxxx83btyAozx7BgvVvk7kB8RTVqlSJVGiRCVKlCCkNtN9akj1zL\/GAbtBwD19+vQWLVpwIe5uw4YNxgH\/wO\/G5BKPHz+GHPzzzz9r1qx58+bNrVu3jGN+ghtPmzZt7ty5oQjYMWqIQTOOfUL37t3Hjh07ZMiQvn37Gkl2gQoTreOYtWf7Lz66Fl\/98yn3q5Yw4UjW4nvNHDhYPr7PFjbtrmrDoruE99IMhbYMmmZtNKeOd9c+sCbFbXx4uuGfw184vXV0Ckeqo6eXtlaadtRb+xjLa7fmKatMLd5Gn3jpob35IJyAWmjX\/9r4L9IC21s2yytHZSrAhQsXjh8\/vnjx4t27d7ObOHHiWbNmBc\/3lMwQ5ZdfdiH7cIKHDx9yF9xO165drVY2VUCpfvjhh3DhwnGuLJ\/ARtSoUbNmzWrPxxjJbGz9GwGwRH6DLoCicSNqsrG6WTN01fSC1GvkWyP9Ti8PH33UqGX0588dI7pobwh5O3how6Eon1eEj+5P37336tk5Vd9ecvrdxQvduvaJ7eji7uKsfSTBy0n7fomjhxOq6u71zOFjzEG\/xmzZ2N2iMQutCvrI4td6rzgUAYRIqZIWvO+AAQP69+8vk2y+BIsWLRo\/fvzJkyfZthJIs2rYCir6eOrUqaNHj6Ke\/D548MA4oEPyWylXwoQJZRp\/+vTpCVQ+O67+JXj79i12r169esQMtWrVWrFihXEgyAAt+OuvvyAKUARaw87HDSB58uQYK+oJSSIPTURDkd6uXbtp06aZmYFVB9mDKRe2djgwwRI5vMXb2cHi7u3gafF20VZAeeU6s2CvlhmKeXuRqD0pwNro32G3eDp4OvPHwXH7kwsN\/hzxxOuZJVxYfSBAG4rQ10fx1DjBW9eGiUrPLN01nD+rFHT4b9GC9+\/fu7i4yLMxK8l49+4dPCBWrFgpUqR4+fJls2bNEE3YKxy8WLFiaGCNGjUiR45s5A7GMN\/X7Nmz+\/Xrh4KFDRs2fPjwsoaJb0rlG+DjEfUvkSRLlqxUqVLOzs6cmy1bNrSODScnJ79Jg1U7fwmkKIhO0aJFr1+\/ThwwevRolS55\/g\/uD4bnaHG3OIS1WF6fOnercdO49x+FiRCBdHiCp0YINNIf1tP99au3Hzu1SzlkoH6ep6M+mfD2jDmeP\/eNFj6CR5gwjl7auwqapns7O3s6e3m++8fZIea4UTFr19Y+s6BRe40WONGqgXSzoQh0ICeyIdKydu3an3\/+uUGDBlBMqwG\/gKFAgQKU1rp1a7mQkkkr+WT31atX27dvR4b\/+OOPR48eIdLGsU8gv6otwGQRB8tCAhUrVsQoQeKNY0EMbObcuXOrVq0K+eDuYD\/GgSCAVUMBT0\/Pc+fOXbp0aefOnXCmq1ev2vOsQRAvXjzqLPOQoFyktGrVqlu3bilTpgzA9IiXnu+Lr+1z8s1lSziYgfbNFG1FVIKOD54ZwybdVXV4HJdI2osL+pJD2pABv9qe5dCzv2tuGX7\/wxOncC6e2t1hWzTOQA5t3OHdqyrxiy4p0zuCk7NxQjDAf4sWlCtXDu1asmSJ7CJzN2\/eXLdu3fnz5zdu3Fi4cOE+ffpkz56dQ3fu3PHy8sIFxowZMwBzWb8tqPnq1asnT54Ms2HXysQECsKECSOPLeEExCtoGheNFClS+fLlo0SJwuVo58D9joO6BW4HJf\/pp5\/oF7Hpkm4NPbt8tdz18t936zeOduumU+QITh7Ojt6Ong7a1F8aJoyH16vXb1xbNU49ZoSjg5OndhWovpMM\/90cN9Hr119jhovyMUwYB4uHPnjo5OgV1tnb66OH65PIEROs\/j1atoy6NnNmsJeMUOh4\/vw57uHy5ctTp04VfUe6vlyv9+\/fTzhx+vRpH0nG7du3jxw5cubMmV27dt26dQs2YBzQIVe30tMkSZLAv9GvEiVKJE2a1JYKSP4gtUgeHh7z588vW7YsXOQr0AJjy6ebghA8ePBg\/fr1dNyff\/759OlTYjnj2Cf42IyAdEkktEudOjURRd26deWQ\/VhybV+DXcMtkYgyCPS1wX9sCwzB4vpiaI7WfX6ooZkH7YVF8hrydPLV7dqbB11zu++gkQkHiyMcxcFRYw9e2hOCd29Lxcq3otzP0VzCe3vDGTgjlBZ8dfz666\/9+\/efNGlSrly55s2bB\/1Eh+XQ4MGDCR3gAbJrBk0kUiUyF0zgY63++ecfWM6cOXMwQJIieWRbAVsjgweYp2HDhuHgyYPW7dmzhwhGCoQzwY2sjNdnATcHbCRMmBCDKwMJmTNnhnJxCUg6OhkjRgw9r1+wui8gKXIvbFC9+\/fvYyvHjx\/fuXNnySCHtNzaLjsfHSwubnce3K3zU5RLF1wiRdZ4gpeTl\/byoaf2XQQv79evXN\/Vr5168hjnMC7ae0Ra6I8McLZG+Cnr+q9DnUdNjBwlqreD9vKiPr6gjQI6WbzfvH7u2L5TwmH9dFrgpdECzVDI9UMRjGCWjTVr1sD+8+fPP3369C9cYNQsk4Dt5s2bp0iRgvIlhXgDNrBixQp+Dx065O7uLulmmEsAeF\/YQK1atdKkSVO0aFF7nt8FNRYuXFi8eHEqVr9+\/cWLFxup3xS05NWrV0\/pOHjwIKYAY2Uc+wSrhrUCN0VoYezYB1cv9yJ\/9Dr25pIlbASK1z6jpj0DsHh7uSZwTnCs8vgEEaJ6aGONGAPtO61X3z6ssnnoxXfXLOHDkaKNEzhZHLXIw0sbZnB9VyBKttUVBsYJG9ETOqEsTjCAXw33fQD\/gaNyc3PbsGEDATSM3jhgsRDRIu7FihUrXbo0ymykBnuIMTJ2dHCPqMeyZct+\/\/132wFJQcSIEYk5qlWrljFjxh9++AEPDS0oV67cX3\/9JY7cFigb9By6wOUIGtDDffv2sSEVuHfv3rlz596+fcs2FbBTkGTpEk7B3pUsWRILSCIdkTt3bvmwio\/MTIGryNUBu8LzYHiNGzeWo5Kub+uTByzOdwcPdxw2Jmzs2A7eHk4kOTg6OHh5o50WR7fnbu+qlE01c1KYCBHgBNoiptoYIEV4QiC8LWFkUO9an1+cp0yPGTmKu2NYD20K0gdjbOC167NiRVL9sVx\/KOWlkYXQpQyCJUQwkNgePXps2rQJ3ozflXR+lcz4F2Z5E2zfvh1jMnDgwMePH6OSx48ft6IC6J1cVH6tUKpUqVWrVgW3h5WLFi3CSKK2aBm6ZqQGJxAOXb58+e+\/\/5Z3SQiKMFNySDrItrXjxo0LaZNlnu3HihuH6u0c6hUpjMXbiRBCmzzo5enl6GR592Zw9pb9stf09ta+0ero4HTT7WmNzUNOvrzsECGS9qYhtkGbPYhFIfLwtri9yx0h3eqKgxJFjE5FNZOnZwmgIAY2vn9asHfv3sGDBz979uzMmTPs4pZkmuu4ceOaNm0aNWpUPVfIA3G8fBn92rVrRPmEI8oAoQmqW2EDhQoVwtxACMQHK3h5edWsWZOYKU6cOOQPgHGEgnz8+JGNV69e7dq1SyYz7ty5E82k8CdPnui57ELChAklMKKSBElhw4alStl0kIgx9e1VKzp3wIABo0aNwuIbSTpoAM29f3S9WLFO3BOnHSKEc\/bydtefKTpqjwO83710dytWLPn8SS7Ronrq31DWoM0alNFBzax4ezlrquzlfqVrr0i\/zYseOcoHpwhe2iuL5HF6\/+qNd9tWCUcMNJSeJg+ogwlF0EF0AfGeOHHirFmz\/vjjj7Rp05KCiIrMB0DyzcC2oIxbtmy5cuXK5s2breYM2g+qgTmqXr16u3btIO5GajAAgTUGBMVs0KDB3LlzjdTgCrr7xo0bW7duXbNmzY4dO4xUn0AeeXHRLmi83xGjUHXLwE2PD1hcomhBhJO2IKo3bt3jQwLHaHuqjk4dUXvQ8+j9ixp\/jjjw7IxjhIjYIW990oD2AiPxBiGF28f0YZNvqNgvZZS4hnDq7x3wG0yIwfdPC3BR6dOnJ6hNnjw5zkNeva1bty4ekfCaDMpq6NlDBrp3746Be\/PmjbGvg1sw92b27NlR43LlyokRVCCPutm+fftigxIkSGBOFJiLUod8TLSCp6enm5sbNvfo0aPySAJmduHCBQ7BXaw+3fZZEDlxUVgCt5MiRQq2nZycMJ1C8\/mFT+TNm5f4oH379th9q8lEnh8+nK9cL97JI2FcwmrvImpq5xjW293t9Ztn+QulXDQtbKw4qLX+ERNHbklTTn1gUP9few2JG+U\/jw8fr3ToEmn5shiRon1w4hKOju\/dH7o4J1y\/JFqO3N4Wbf4RqdpJxpVDEVygZBsKGyZMGLYVIQC+ibHfwPcToa5cuRJmvG3btufPn5tJOb9yUbO+RI8eHc+KH0qVKhVcXD2+tAUSXkJHpUqV1EqL3xALFiyoWLEi9rNs2bLLly83UoMHpIV968R9+\/YR+2GFjH0TMBSHDh3KnTu3sf95aCP9XGn7g5NlN\/X3jBBG03gif+2lA1y\/xeL6um3qGlMLtXri8a7en8N3Pj5miRDRASnQHk1avBz5q81UtLx3S+6QZF2lQZmjJ9DLJELRbY\/2kTatfONq3xTfCS2wIv5yU\/yuXbu2Q4cO0Pm2bdv27NkzXrx4Wm6LBUJQr149NYOGnL4JlkAyfDabLfx1Cpn5lfzckfJwZ8+eRbLXrVt38+ZNjAsUh4hcDqnC5VyQLFmyqlWrVqtWrUCBApLiB1B4eWpo7Acxrl27dvXqVTb4hchT5\/fv3x8\/fty\/XEEhRowYcIITJ048fvyY3Zw6sF9JkyZNkDBBwQIFSbw5bLRl6KjoMaK7a68ielscnT1evvgn5w8pFv0WISE3Lg8KPo+Pbm5X23aMsGZdWM+PnhaXN5GjROzWOWm3tii2tr6JRh7oAv+JRyiCCAFQVaAU0KyJCgQY+PKDBw\/ye\/LkSRE5Bcms1FAQPnz4woULw8tLly7Nr3pSiVGaMmWKbCvIddXVQbhw4cqUKQNxhyJIihg6ILtfB\/Pnz8eepE6dumjRosGNFtjC3HeQtkKFCplXQZB08tAve\/bskUT7QLHauR4WS42Nw9Y9OWAJ76I9StDmGXpaHOk1h3gfoiyt2Hv6uY2\/X9tpiRxOoxFcUJuupL2UqI03eH5I6h5rVYXBOeMkl0KDJ\/4vgiEaZlEgJpDvcbm6uubJk4f4YM6cOTLf2Ixhw4YRK3fr1m3MmDHsUoI9yvbZbAQNo0ePXrp0KXXo1atX7dq1jQN2Q8IOqj158mRsh4eHx40bN0hxdnZmW8+iQcm37HK58uXL16pVq2TJkjE\/fWjE3CxWkBuZNWsWbjVLlix23n5QAKWF6LBx5cqVvXv3Yvhev34NaaD7uF\/bycY+gsqrplBoUL\/hrFkzHF8+v1WvZcRjR8NHCGtxcPz47vXTLFmSL10YKXkyGtrOKWfSPu4fPJ+tXv\/h7FFHZ5dopcpELvSj\/qhQe2aoTzkEPq1xFoqvCLPMT5gwIUqUKMSL+pHPwHyiAM764sWLzZs3Q8fXr1\/\/6NGjf\/75xzj2CZLfLHsQ9\/jx41+8eBGG+vvvv0PTjQMmtG\/fXn3IB72OGzfukydPbMcbZBc0adKkS5cumTNnNvb1o+aqBimEFqRJk6ZIkSIhghZIyxBHtWjRgi5jVzWmHAobNizdCsuxvxk5n3zyu+\/R5bJb+ruGc3Pw1hcm0ErhmLODuyVGmEjPP75ycrZ4OnJJZ\/2C8AbNRnh7usV0j7K2zKAC8dNq30AKxvOQvhNaIOBexo8f\/9tvv02fPh2SyO6rV6+wCxJ2W0kAu\/B3wtYBAwYMHKi9sG4LYnR884cPH2AVlStX9vHTYVYYNGiQKo1Y4dKlS35\/oEwBd4j1QevWrl0LsUADz58\/f+HCBbwj9c+RI0fChAlx\/IcOHeIuNFnT11wClF+vXr369eurdZet+tR811YYMmRIunTpatSoYewHPaRuUiWrHjHj5cuXWEns8v79+x88eEC2bdu20T6cAo1QBtQM8qjCVQv07t1n+PChbrfu3Oo3zOPaNeQ9bPqU8fv0jpwyhcXLwxuyjx\/3tXlM0Nc793YkODBBm1Js8XC0hNFuhGjA4q0VF4pvD3T2p59+un\/\/\/sSJE3HPRqodcHNzI8TctWsXJHXr1q1QAZiBccwkt7KrkCBBgtixY0PK0SYsT6RIkcQQXUPkdJhPoRCZECO7+fLlw0XduXMH3V+9ejXXlXRgvhyerEKFCs2bN6d8Hz90FETAznAjWJj06dP\/+OOPX2E5oy8HlvPXX39duXIl22ZrAGQXiwdjk3Rp5M+CrNqZDvzniMVoumfKvBtrLeEjagVoE5O0xwWOXt5eXh4WJ21VIy8HJ80aaMudaJORvb0+RP0YcXnJX8okzkouahGspydzp98HcBVQWu4IncTZG6k6kGxj698YNWqUNAIbRpKeWfLDCcxz9PDKqP2qVauOHz8uOX1E1qxZyYyoibThzjErpPtWBwFHzYOKixcvNg6YMG\/ePOE3So4LFiy4ZMmSN2\/eGDn8A6lPz549J02aJCnfCn63jBnk9PDwOHbsGCq9bNmyOnXqQJ7UB9ZUsxjQ9zKmS\/vW9Z12rrf3x6cvPj59pm96wwi8vNy9PT\/K7mdBJk9vL09vT231Y60i+jY7Wjls8lc\/GIpvBK1LPgnSjh078ubN27t3b2yCpMhRgaSYgVAdOHBg4cKFeAvEST28U7AWLR0ECYgf7gebQEhqlPUJXDpDhgyQA2P\/E6QCa9asMUqxWNq0aSOHADWB\/jZq1MhqdrC5ApkyZerTp8\/ly5eNc3T4dmtfDm6EKAuCnjJlypo1axqpwQnme8fYdu\/eXa0bQbv52HcwMMnvD6D2mgXwkCud+OdGlDlVLYvKW5ZWsSyt5rSohuPiqg5Lqjgsq2xZWtmypJplaQ2HpdUcSCTDkvLhZ1deff2oXoxmSbQ\/wRjfCS1Aaomk6W8igyNHjhipvkMkibOOHj2KHhJw\/\/3336R76h9BBmz\/8ssvIkO2yJ49OxZhwoQJ8+fPh5kSYeilakieXHtoJOII2MZ5i+emWPhKu3btUOxUqVKREyRLlmzGjBkcff369dKlSxvqIEWqIeDo7du3ZalBVeywYcO06wUUUiwqNG7cOEkJofj48SMErlWrVtI4\/ArUJ0bOnj+tZzQrou7ANaeOP9derfwsJD9mARKgqIGeCsGAW2gvbWrHtbyh+AaQV2QfP37crFmzjBkz4nclXVcgDbKrgM7u27ePOLhixYroo4iKgtIyM0iJFi0arvHnn38+dOjQvXv3jLJ8AXXAsLx7p7FSBakJZsco1GLBzsghM54+fbpo0SLqJs9DBeYqYQ2qV6++detWuXGBj3f6hfjw4cPUqVO5C+Ki2tqansEL5vslWkiXLp20j96B1j2ocPq02AT\/wKAFWiQhet5y9xTL7JKWZTh+\/sEMqlrgBMsgAbCBGvw6LqnqtLiKZXGF8NMrLr20j1MMQqD9Cdb4HmgBFHvWrFk42jlz5qj4wG9Y6c\/QoUMVEVaH2rZtawiRn0A\/ofacPmjQIHmKKRKpQEqBAgVgD5T5xx9\/RIoUKWrUqFWqVOmio3Pnzjt37jRXRmAmKNCX\/Pnzq5LZqFChgmRTefwLOatXr16QG7UbImBuGQGtSu+rxhFoI30aHM6fP0sePZZHHbWzNJ8u23bftJ6RH06BAWjfX9bGCbR\/lOOuDxxIJj1jKL4FXF1dcV2JEiW6c+eOkfRvPHr06NixY4MHD65Vq1bixIl18fg\/rORHgZw1atQYOHAgVODBgwdGWZ8gogiM\/X+jTJkyY8eONXZ0SE6KMkq3WPr37y+HBFZFXblyZciQIfJpYAVzPQlRJk6c+FmOEmDQqpiIt2\/fxosXD6tlpAYz7Nq1S32txqof6T7bdVmgZcaZ9kMbFdT6xogMvL3PvrgXY2E9y6JKjvj+5ZUdllS2LKmq\/VtWzQFOsLiqIymLKjlPqzTz7HajBI1X8EsYYVc08q0QsmkBMfS1a9eIFy9cuAA5MFLtg67LGtiGC5cvX37kyJHqEL\/nzp2rVKlSrly5cOp58uTJnTu37fdUzPKnIHIJ1DYbMWPGhLtI+ebRBYFcUa\/OvzYE\/fr1k6K00nUcPnxYDpmz+Qty4urVq+fPn692QwTMVT179mz9+trnyYGjo6O5iT4NFjifv3BJy6pzAO1HbfhPM5Eu3RgYhcg\/tftpUx82CMXXB1JBXLts2bKXL18aSToeP36MDyAiJ9KNFSvWvyTEF\/0FmTJlgnnPnTt33759ttoKRAj5FUiiLZBPCP2zZ8+M\/U8nmmnBiBEjqCFiDIGAuEg2YC6WaGfTpk116tRRX0e0qnn06NGbNGmyZ88e4wQdflTMfrx582b06NEyWlCiRAkjNdjg6tWrspSZFSJHjtywYcMdO3Y8ffrUdsmTANACTeFpT1pU8+6ouda2vY4ssMwoAwOwLDNogcPiKg78Qg60RwkVLDPKjz+5UQrQnlrqHaJxAi2sCL4IMbRA65NPkJTly5eHDRu2Xr16svuFQPrTpElTtWrV169fs6uuYgaU+eTJk0uXLv3pp5\/kYYF\/Ac+QpxXAfC9AdoGxrwNtbN26NSdiBdQjT+wIh6xyBgwXL15UZCWYQwYJZJuNjRs3VqtWDQGQNqF9lKGUd9NlG1w4f0HOCkWIg6YPn2AkfUpUg+dopWwowAzWrFkDyy9SpIjty7dCH80SAkhE\/WvUqPHbb78dOHCASMMo6wsgdR4wYMC6deskRQFab1xYf11CVuEl7o8fP36nTp1u3Lhh5LNRc6yHrFYu59qCAGbmzJnPnz83TjCVYFWUnXj16hUt6erqStidN29eIzXIQCV9q6ccArL74MGD7t27w4fkxlWHxo0bFxaozCwmNFBogY+48fpJgrlNHRZU0h4lLK6m0YJlVR2Xak8QLEsqWqaVHHx0pZE1RCEk0QJlCO7cuQNxpnch9VeuXJHEL8e5c+cos2DBgkgSu0r+zNi1axfeqFWrVrYjB3YiYsSIgwcPth0Jl13ANjc4btw4tFEmMAIReicnp+HDh6v8svElOH\/+fLNmzYydkAAP\/cMt5jXgdAtvWIS0adO2bNlSFlEWYO6hPsbJoQiBsJVzM0HcunUrBB1l+Uf\/VD8qky9fPtsHBD7CxcUF0oDAEKZjRiQeMOMLVUxOf\/\/+PZ5VUhTMtGD8+PFdunTBoJG+efPmChUqUH8i3UOHDklmQFHmyuD4OTFevHhq8AAoLQBE9l27djVPjrYqwX7AsWA23EKyZMkyZMhg51Na\/8JcN9\/qqdKpDGZQLUKjbhzT2rNnT6vnKU+ePLH6CAvNS6Jx+IvR99Aiy+zSluVVdFpQ3bK0mj7HsKJleuk++xfoWXBbAWn5b4iQ9xBh3rx5UaNGpadnzJghDw4CJu4+QlY3QjMVBTFj9+7dIlgBhpLgzp07G4WaIDdy9epVqxBHnaXeUCBnoNw1tCAYDgz6CDc3t4ULFxIMSVMAsx1MkCDBqFGjzp49S4AYJ04cdYhAwfZ5cChCCkTIfXw++OLFi379+qkhNKtVzNWQADCSPgHuWLVq1SlTppw8edL2LR7RLAUjNUDwowQrWrB06dIWLVoYx7y9T506BVlPkiRJpUqVZNUvgSoQz7d8+XJ4zI0bN3799deUKVMaZelKoW6ZKKJMmTJojS0vsR\/QgrZt296\/fz9VqlRome3YTGABwrFixQqrNyysAMeaO3cuPSg3qBAmTBjonczfArSS4o63bt2y+sYExFGyBQpOPL8e8bca2vOCZdpDBO2BwuKKlpnF2+6dKRm0ZwfBeyaBLYI7LdAVwVCtS5culS9fPm7cuP3791dPENXRwIK85YzhMPZNKFy4sAiWra2xhVk\/gewC2bWaZySQe1Ff\/FSZBXhEyRaIIEjC9Bg7QQ9zZ9l2nKTYpmP7xowZo15EBOaWTJ06NcHi48ePMaCVK1cmkFqwYIHk4Tdz5swfPnwwCgpFCMTff\/+N5BcqVAj3hnNC8bdu3UoobPaFCkoqrIA\/K1u27IQJE3bt2uV3vGsrfl8IChQY+zrMcwugBZs2bbIdtIPODhw4MEeOHEWLFl2yZIkfYuzq6rpq1apy5crhHY1C\/90UadKk6du3r3lg1bZKvgHm1KRJE3QwQ4YMBGPK8AYipCYjR46kqmi6pEii\/AogT2YjoFC7dm2IlJHJBhcvXrT6CmXBggWNY18OvXZtDky3TCtqWVzOsrSiZXFZy9SizbZPknkEOp\/9\/y2EFARrWqCEg3Chd+\/ekET05OnTp3I00CHX2r17d6tWrdCBBg0aYIbQiufPn587d65du3aGWH0CZDx8+PDq8bb9KF68uJBuuaIZJ06ckHmzSqsjRYpUsmRJAqOmTZv6d1rlZ0HIRcP6ODQSFFD3q\/Wrzb2bwVFCot9++61KlSpWY4CqZZInTz5r1iwVCR0\/flwGBszffpWFzEIRcmF+IShevHg+LhqISCipUCBGrFixYq9evY4ePWqeyvf1YZZ22bCiBX\/++advz\/JgA4sWLSIcypUr1\/Dhw\/2+EcxUz549zeunmZslSpQotWrV2rBhg5lhqIr5hnfv3qGDsmgj\/tV2hYYvh9ThzJkz1A111hpLhxwF2GQU2bgNE4oVK7Zt2zYjky\/Yt2+flWwUKFDAOPbFcNfnIL72cO2wb3r0ebUiL6qTYEGDrn\/NcTVmFHIPxmzkkIV\/rQAVPPHXX391794dwjtgwIBUqVKRoupsawsCC82bN8cnseHi4hI\/fnyUFl3CQ6PPbm5u+PVYsWJly5YtZsyYBB+Eqnfu3JFnWnK64PDhwyiq1sp6PSH1bDRs2BAfHyFCBNKBGgUV1K9fH1JMNg798MMPv\/zyS\/78+ePGjQtdgE0vX77cKv8XgqvMmDEDwhEAchMooPVUiIPFef36Nd4d7r9nzx6CG0ITOWQFZ2fnGjVqwJbOnj1LGBQ7dmxuRAkDlqJMmTKksF26dGlsrqSHIiSiQoUKBNPSudKnAtERY+cTUFWcYuXKlTNlyoQfRXGMA\/q5SkK+MlQ9VQWOHDmSN29e2YYWEISsXLlyzpw5kgJwivySX51y4MAB+AF2IHv27FAlNetIYL47POvq1asXLFiAR5QUwFFVDWLuOnXqEPbYMwmD0uiCadOmtW\/fHlP88OFDc6sGCqRiqv7cu7Jy3C+h4MaNG2VXIU+ePBC+qlWryq4fnUujYXKNHR1YVPPn9QMOLajWvlHhpF\/67tvH7y0eEZzCJwyvhzHck\/a9BIt8R8l4XTqkgAYNzkAgMPpTp0419nVqCYydwIC5tPfv32\/fvv3y5cu\/\/\/47eiUj0nh347D\/gdtTwO2pGcJyF0B2BTt27DCvXoI\/Mw54e8OLZ8+ezYbVKV+OIUOG3L5929gJetC2WKtff\/21du3aZcuWJQTBiLONm0+QIAH+3rj5T0DbrRQ+Y8aMWLTWrVuXKlWqT58+8nhYGhOwfffuXfWkmTz6ZUMRIkGHSpgoYgBkW+9bAwTBxH9QbXyh7VCiSAUw9r8doAJFihSRQXir0YKtW7dajRYYldZhJOm4desWCgulqFixotULDpLTnJ8gG01Rc\/WBuelIb9SoEZ7eyO0LoAX44IsXL0IOOIsQyDgQ2NDvVYPsXr16lXBFLTmgai7rv2GoJZv5FB+B2ZQTFQgnjGNfCq7s7sP1PflHojEEKy81ynZIQTCiBXr7\/qv5ZFFr29d7AgzbSwg8PT1hwYTjnTp1QpE2bNhgHNAfrRlbgQqpiUBSjh07Jt9cEAXAR6pLYzXSpk0LsWBb5Q8sYI8IRIydQIV6NkHNCfi6dev2448\/ylqNfoMWkEaQX0GKFCm6du2KbT148OC8efP27t0rhdvi7du3KqAJpQUhGh8\/frR9nCziESNGjC5duuD5rl27ZuQO3sC\/xo8fnxiX7c\/SAr\/h5ua2ZMmS0qVL58uXj9Ot1kUQGPve3jdv3hwxYkSOHDmM6\/1brQBaOWvWLLO\/N4rQC3n06FHy5Mlv3LgBhyBzUNAC42Kf6kyUgqareYKqtpjH0aNH+\/chsnkMRhBY77R\/xwiOowWIxZ07d4jXHR0dcdJGauABwn7ixAkC1sE6CC6RSJT25MmT8v0CIDKKVUJdr1+\/LomBC6UGrq6uUFr1cq2oQdu2beUoKFasmKyQqqmOSeEDBUTqn30+F2BAtgYNGmS1Rpt\/kT9\/\/uXLl9NKRqGfw+vXr9VHrUJpQYiGh4eHvHti5clAqlSpCJ2NfMEbSm03btwYJUoUTM2pU6eM2wgQLVCAHDds2DBbtmwdO3ZU8\/ABl4OUK14OMGVcvW7duoqX06TmJ5KoTIcOHWwjBFiXi4vLvXv3ZHJVENEC2UBzhwwZEitWLKmS6vQIESIQVFi9eWgnbGnBzz\/\/bBwLhS8IXrTgzJkzRYoUQQpl7mjOnDnt+c6Q\/cDKTJo0Cc4u8iHwexht165daunioADsRy3JjhqIJhAJydcCAXqYOHHiCxe0NXk06xLYtKBmzZpYJWMnUDFmzJgECRLIrQG5O4GR5AucnJzENFSrVm3\/\/v20wLhx4yBtlCktoCAXskIoLfieQA\/Sj2aZUSKEnPg9Cz2YwBBWXVwJ8fv27au+rAgCQAtUaYIrV6706tUra9asVapUsdJlyQmMff0pHhUwz9xU7SmgwRcvXowSSX64l7OzM+aoefPmHA0KWgCwzNOnT0+TJo3UQQFfQMuI9QNW92IPZIqYGSFlAbdviG9JC8x9DINu3759unTpYIV79uzBVf\/555\/qAZJA5VcbZtimAHiGGnRC8uQTi\/HixZs6der27dtlXhuHiESPHTu25hNOnDjh7q49NJIT8+XLFz16dKg0h9TiWf6Cj3XjotyySCowK+f69evJIGetXr06RYoUsu1jOV8IaEEARgv8rsmTJ0\/UEuW+IXXq1FixSpUqyYsGyZMnb9OmzZYtW6gM7U8H5cqV69mzZ5MnT6b9GzdufPfuXaP0z10dWQqlBd8NKleuLF1pBmGuUhY8R9OmTc0fv0E8\/JaQb4hLly6hzsuWLVPTaL5ktMCM58+fQ8TRmjx58syePdv89JPW8DStAQVevnyJv\/zxxx+lDsBsfwAeul+\/fmfPnqXCVBU7Wa5cOTJ8IS2QOlj1DqYYHTcubEKdOnUkGPgS2NKCRYsWGcdC4Qu+DS1ALIAa40JJsmfP3rJlSz+GiUSS5NdvQCZu376NOylYsGD48OETJkzYrl27iRMnVqxYUcQCWoDmoBJ58+bNkSNH+vTpU6ZMaZ7shqFBK0inVsA8Zydq1KikZ8yYEcaN90IVsUczZsxAsWVGIT7JqIcNIOBk2LFjx4QJE2w\/fyKgGnPnzpX8crPLly8PzBdtbVCjRg1hIXZCdcG7d++4HQH+W6Y+AJQ8c+bMxv38G4R38ePHp6MhZKqhVq5cSdfcv39fdgV9+vQhZ+fOnaGJ5vet7YGZFhCcGamhCJmAOEpXAt\/eywdhw4atXbv2rl27jNN02GMuvj7kjSr17g+0wI8XFO2EulPUEAOSLVs2eDZKZJ5NbNsapKCtsHMsnlQGmBs2QoQI8roj9ipt2rTUGWU3Tg4QuKJAds+fP9+gQQO5lhnly5f3Y\/KQv9C\/f3+j0E9YuHChcSwUvuDbvKCoXVgXPqQWnw0bwLPKGzvqkB+ACHOKbJPZw8Pj6NGjFy5cEEaMy7l16xZ5JIMVyB+AW1ZVMp+LLkWOHPnt27cfPnxgF\/ZAEAMRKVmyZJQoUTBh7JJf\/CWOk4q5urqiV3I6sKpM4sSJYTMSHkk6GcaOHXv48OHff\/9dzxL4qF69epEiRTp06GDs24f58+cPGzaMmzL2LRaoFZQf775q1Sp2fWxnojqMoHnFVhoEK9m9e3ert56IVGjPVq1a2TNF0QrQL8wuLI1tyN+BAwdU94UixAF1gLaygSRs3rwZ0o9Zh1sTtkoGYBa2smXLtm3bltDW\/OA8mIBKUlVknmADsiuJ48aNy5QpE+TYds68\/VC3L6LO7rp166ZNm0bQUrx4cei1TNFQIANQTXT27FnIBOHZkydPJMXcpGo7XLhwp06dUh8vDgAoR2r49OnTESNGTJ8+ndaQQ4IKFSp07drVx1UKAgYYBmJj7OhAfuQjFKHwFZp0fAvgy+FxSZIkadOmDbsPHjyoVq2abytfvnjxYtu2bfib+vXrw23tmcKG8CkYSYGHLyxTaiWQFBgGrvHhw4dyv5AbGUqBTSdMmDCwiLOPgBMQvhs7vuPEiRN0Adi9ezdMRartG9R9AUiAGokZOHCglKYHDFrEsFiHJIKbN2+yC6UzTy9Xme0EhiZFihRyRWImNY00FCERarQgZsyY6mOGmIuZM2eaXZ35sQLInTv3ggULzAPpwQQiybB\/o6IWC9qEgpunGAcYUrhZWfbv3w\/vh2FD2WEeVgsZmXMCOD2sPWPGjEbNPimy+Zc2N6\/HHABA7CZNmmRec0mQP39+8ytgttULGMyPJ7gF5CR0tOCz+Bq0QDpYICk7d+7MlStX5syZ5UtW9BM6ny1btkePHr179w5fOEcH0gPXg1lj3I2O\/QIQx0fQgQ9Wjips2LCSmDp16mbNmtWuXRumIikqf4IECRo2bMhRftXotMBsiQRKhQQqRSWqbdkA6MMemy+iApgTtz9v3jwjNQiAy4wUKVLjxo3Z5opWDyCpwMaNG+FtdI35IYtAbscWxmGLBc0nErpx4wa2RlIGDRpEseoSXG7o0KHyJjfB\/ZAhQ+jo5s2by6eqAgzKV7aA7gspL7CFwkcoWoBvM7+JJ4CkEiqYh5TMEpgyZUoEzPxRDGRDYOx\/I0CyjSrqy\/0eOnSoU6dOxrEgwPXr1zt27IjtQr+4HLpmHPCpQWDVq1evLlWqlHm4RVQbyC7WG9WmWKtPTaqiZENBjoJ169bJ6vJAlUaYB4fD2hiZAhVq2SiANcAo2T\/lcPr06UhXoHxOM2Tha48WPH78GCdEBIyrwB8sW7ZMTXtBZNOmTYsPpvMkJWDAnSfTgafv1q0bzmbatGmwZiJR6PC9e\/euXLly+vTpgwcPknjp0iVJVDNv8ZSkKHDI\/KYsGoWnxHXBqWXNHKSc2NT+lb8gJbJGB3eKzC1ZssSsNmbMmDEjqL9jdOfOHWrSqlUrts0KTCPQQRAyvco+wGwjrBArVqwCBQpA6ZQRpzRpK2wTu+pCT5486dKli0QwBw4cGDBggN8fSrEf5nlqQfcWSSi+AvymBQL8U\/\/+\/c0BqFk4CTlatGhhnpP4zWFeqH\/06NFERyiCcSzIIEqNVYwdOzZc3zxlR1RSYCTpq4lDVsyfbbPS+ihRomTIkKF79+6DBw8+e\/asmi1kFKRDUgDGtnTp0saZnwBT4fa\/MAzwG2ZaANHB9q5cadfHjuW5baNGjSRYMt\/Ldw8fHgAHOsStotL79u1bsWIFPLRu3bqIUZ8+feRbxgBpM9fEateMVKlSIUx0EnlgEpkyZcIl42vlFDgBGdKlS8cuMM9R+izkipwlu1bgqPnQlClTsmbNOnPmTLza0qVL37x5w929ffuWQ9Dtu3fv\/v3332wQZMePH5\/64BfZphAUCWdcrVo1Igb1gWCrwgUQjqZNm8room+1+kLAe1D79u3bm0c158+fj57DomSXS0sF+JUUBVQOq00\/wueKFCmSP39+GrxgwYLQPsmgTixWrNiePXtoCvpdvZfs5uZG923YsIE2kZTAQrNmzebOncsGV79w4YI9T51CETyh5hYgJCdPnrRapdusGuggFp8IT8XickjkFn9QtmxZ3GG5cuX0g98SREdw7gcPHrANgS5UqBA2RL4VFBSQFlCtQcg+atQoaEGZMmXQfRWYSWOaMwOc\/aZNmxYuXIj+yiQqYG5YAR43ZcqUNWrUoIWt1lRGAYcNG8YNGvs6oBQYNyiF2Aqx5+qigQisqJKHGDFiwMa2b99uj8GBaLq7uw8fPpxtaRlJ\/0+AGw4iCL3asWMHUoLvwWFzuTRp0sC\/zA8FRRqAsf9v4EoBXVu7dm18MK5XxpwDBV9CAKdOnSpj7127dkW4JdF+5MuXDytg7HwC9ZEqzdMBufbvJHz\/4uHDh7Q8hlJ2Cd\/l7WQryHBipEiRUGbZ5rdKlSry4RZcux\/3Ir\/yoQdOXL16tX5c+3rshAkTMmfOLEOaki2wAJfS6q1DvfQcipAINVpQvnx5SUFUZOaNwEpy2N2yZYus1CvQrcv\/zQvGB0tiNe0gcMXvs0Bx1JIeEydOvHjxYpCuscPdKRhJumWWCkALFi1aZDvtABj7Os6fPz9o0KDUqVPLWdKqAkkRQPpnzJghp1y\/fr1Dhw5i+RUwHU2aNPk6j\/Zu3LgRLVo048IWC4Ec0QtWzjjsC+TGCepk9z+IIKQF4NatW+a1g6wEyBZx4sSJFy8elLOnDnzJ1atXEaBg9XRHhMbDwyNp0qTynQIUu1SpUrIA0caNG+35JDnRue0anEoPIbMxY8aEyAfR8zYg1zpz5ow80aC1YTk0vnQEqiudxYYM6mA7qPO9e\/cuXbqEQTH7Wgg1TWG21GYoHUulf+YKhw1br1atWlr9o+lBtHqjeUGIUFoQolGsWDHpx4YNG0qKkha0786dO5KiH\/kXjh071rp1a\/Xai+6\/\/m9\/cG9jx45VHsLHEoIOd+\/eVauaond4XB+\/tB5YsLq7+\/fvY7IKFSqEw8aL8xsxYkRUeMCAAWaXaTXTSPDq1atx48ap8QBpVSC7Cs2aNcNuqE+TKFStWvXgwYNGWUGP\/f\/+JFK4cOGSJUumHnZYgZu1vd\/\/JoKKFtC+e\/futVq1ypAgkwyxjQssWbLk9OnT165d+\/LlS98mD0ufAWP\/20FVY9q0adzCoUOH2KbyqNn69evHjx9fuHDh0aNH+81JobEENLY3SxhRvXp1ikXx8MFGahBAbkFNBlQwd1D69Olx4ZK\/V69e8s6IGVII9XR2doYPsQ1p6Nq167x5806fPg3n0HNpgDO56O9GhwkTBju4ePFixCNTpkwyHcxHA\/Ql6Nixo9wCCKUFIRdIRcGCBaUfrcRv3bp1JP7www\/q\/R0Bp5hlCcEbOnQozkAKAWYJT5QoERGweaWsr4PLly+rGDpChAhz5szBTxvHggzPnz9fvXp12bJluSh0H5p14MCB1zqePXs2c+ZMmHrkyJGbNm0q3321grlhHz9+jNdXny0wQ7WtFehH87ffvg6OHj1qXP4TiHx8czEKVsvo\/QcRVLQAWyyjf1ZSoqvk\/1Pix48vLyNYQURQYN6Vo98cUpN3794lTJgQPyf8lxvJnDkzjhZ3WL9+fSgRzsnHpwByert27SAHkiJAOfPnz9+oUaM4ceL88ccfRmpQok6dOvSCVacATFX37t3NzIYOxbYuWrRILVsEVI9AGvDxv\/32mwrOBGXKlCE0IcOSJUvYxQrv3LlTTqGhSGRD61cdkh4o6Ny5s1QAhNKCkIuPHz+q+TeKFoiozJ07V4QWZ+bjizzA2NcX9Zs9e7Z59plZ4ImYW7du\/eUL6tmP48ePG9fWETt2bPXublCAoLl58+YSu6ODQ4YMsbI8Atg5BEVmbpYoUWLDhg3mNuSo0HeViKErX768fgf\/h25L\/mVMsIR0VtANfPqBcePGGZX4BDyO37SgZ8+eX8f2BmcE4WgBcoB3NHrDBDVADdhAJ2vVqoUI+v1ObfDE4cOHcZbhwoWT2a0vXrwoVKiQ2C+4QpUqVVKnTt2+ffurV6\/q2Y37QrvYxl3JJ5tF2dggrOHcU6dOVahQQTLzG3Q4dOgQUb50hAIRQIsWLc6ePWtkMmHLli2EGhgCAgWrkUBz9GOFyZMnk6Fly5ZsL126VPIDaQQf75FEGImZf\/gXXbp0kauDUFoQcoEFVw+z8dySKDLz4MEDNZnfxcVlwIABaJ\/KINJli\/Xr1xOumO2PbAD4fd26dXfv3m1kDUoFNH9BESOJDcFufMnlOFfBSNIfVYwYMULm23KnxACbNm367CNz7DDWTCgUFRs1apQwe4Fc4vnz58WLF8+dOzdGHtPt25RebALsX73kBVT1OAvCN2bMGNkNIogDMvcytMD2Ia+q1dixYzNkyODbCy\/\/HQTt3IJjx47J0LE9yJgxI5Q5sF5R+woQYXr37t2yZctgxNOnT2cXe9S1a1dMj7x1I+uuFClSRL0sKyRAzhUGLdsgS5YsJ06c6Natm7ytpNKDCPXq1TOaXkeqVKm4BasB1Tt37ly6dAnjgtkijMiVK1ePHj2KFi0Kt2vQoAFVBWXKlJF5PWb1E5CNO0IPiYcSJkyoFNLNzc03ww1evXqFCTNbE\/\/CPFpgNvShCFn4559\/1NS8du3aGak6kEyrtxLkpXx7piTjlRs2bOjbtIPSpUvjtMzRbaBrIvGAcTGLZcaMGatXr4bimOOiLwF8eseOHcQkUj7GB72W2cEC31RPs0qmO92zZ48aTaxdu7Z5FaNr167FjRsXKsb206dP8+fPL9eyAvGe5DcDqqfUE4vnhx34cjRr1kwupGBLC+SWEaeSJUtCg4Loe7khC0FLC7D+SqtB5cqVV61aVb16dSt9NoNDxKNLliwJ0ifrgQKzFsncljVr1sgufrRAgQJq2ZCHDx+WK1euRo0aVjqAhojzI71nz55kQKX5XbBgAYmq8CCC1Xqo6h0BsHHjRrqpVKlS+HuzxRT4NjBgmxPSQGkyCYMCpXCAWfQjUJCHKZ99BOgHzKMF84JyPahQBCmIU+VLWqBXr15Gqg5bWiCAHKB9Pn7Rx6yw4MqVKyid2UCZBZhQGEL\/JdzUD5hpwciRI\/HZYcKEsf2osX9x69atIUOGyIyudOnSjRs3zuohJrePqbGyQgrSPgIjSR8IRIuFQmXLlg1dVp9FgIH169fPPNXfCsuXL5ecChgZGf6RccpEiRKZV4UJXHCbhQsX1ivyf0BErIYhuVl8TcyYMQlvZKqT+fb\/mwhaWkDEbNY6tYjvuXPnMNyNGjXC+quRQCvARqHtc+bMsX0Mpsut1nOyAST920K+R66i7ZUrV5YoUULNekVG69evDyG9efOmUkvsl7yYtGnTJjUVGfe5ZcsWNoL0vtRTN0yhWEMZ7QeE12b7aIZv6baIECHC+PHjpcCpU6eSQvgiu4BrNWnSxNixAbQgX758X0ILzKMFQT1QGYqgA9qkZrPjkCRR9ALGoEwHYgmTxuXkyJFDUggKcZDK5ehGwtAm8zaAsiON5o97mYU8ZcqUgwcPxt0auQPJ5phpgSz9GTt27OLFi1sNH\/oI26vj57j3ihUrRo8ePUmSJB07drSdJ+F3mZ8FKjlhwgSZdkBIDRtAu2lkuQUfwVGxfjIKQpUIM0iPFSsWp9etW5dtjLzVjNFABL2vOKWCehnbDOK3zZs3y\/YXNtT3ga9KC2wnuNIHt2\/fXrx4MRRBvR1nBexCoUKFUPILFy7YEj2Bsf9NAXfOlCkThFo9vSMWISI313n48OERI0bMlSuX6H\/VqlWb6V9Oa9mypVqMr0KFClYfTQ9cQP\/VS19iAWn5Nm3aEGbJFNw+ffrIIbN9tBOcgrFu2rSpeSwOMSARo2Dse3vXrl17g77+uY99Rzjy22+\/QZ4C3LNCC6T+vXv3NlJDEdKAP1ZDU2o6i0jF6dOnibBJF3JQqVKlU6dOkb5u3boCBQroZ2iCPWDAAFvHYytXbm5uy5YtE79lCwJiJMo84YYSbAuxH+YZ8tAOUgiQUHy5hI8lyxUFRpL+4g9GJmHChBhJaDc6FdRv248ePdqotw5lIjJkyECQY\/6egjz0uXLlSooUKdRkz4EDB+7YsaNevXoyWhA5cmQfJz8GCuh386rYArG3ZpjbMxSCr0cLnJycZPKXdINtZ+AMli5dinD7RkIpIXfu3OgnBiK4vUMit\/Po0SP0s3Tp0uruIMUEAbItgN80bNhQaAHeESsGp86ZM6d6aFKzZk0ZLQgKQD7UOs1q7metWrUIzam5vEHUvXt381H\/gnJgOevXr8f2ybsMN2\/exAqY12lYsmTJ69evaSXVUGZIoo+H7ISZFnTt2tVIDUVIw7Vr19SsWBUBi2DIqnnYffjB9u3by5QpEzNmTMjBkSNHOHrgwAE1ST5OnDhDhw5VIwe+LeMv2LlzJwpofjyBIsgGLKR+\/foyTfgLQYWlTCDvIGA0iMgJIcyV8Q3cy8yZM\/Ply0c9s2bNOnnyZPW8EsgdAWM\/8EC1xcGjWco40Oz9+\/eXKR00nSQCmD0pY8aMkV26hh4kMdanRU4B3Rd06xpBC2xfobRdes5oLB1G0n8eQUsLoK5qHdzMmTOb53qoblAbCnTn7t270ZYaNWqkSZNGyZ8Z0NLmzZuvWbMmiB7++RfqLrZt20b16tSpo26qUKFC5sfqZlStWnX16tW9evXiXtiVUzhXjWgFFqRkfL8aZTW3qrAQeDRazcbixYuNA1+MJEmSFClSRL5niF3gQvSXeTKXH1ANGACYaYHMbwhFSMTVq1eVVz5+\/LgkimDMnz+fREgD4bIsavT48eNJkyaVLFmyYsWKMhYlrwrL6QQbuF68Wt++fbVSPpXDL7Aamjp37lyrVq0guHIuMOsLl4D1GlkDJKgDBgwwyrJYChQoQJBTqlQpmQ\/hd2mwlgYNGnAv2NU2bdr48Xa3sRNIuHz5spqhrJoCUtKxY8fbt28bmUxLUtIv9Bfdl1z\/yh06+Pfff1erVo3t8OHDjxgxgsqzDdMKujnmVMz28zo9evQwDn+Caq5Ab7SQi6ClBc+fP4eqS3+oMWTpBmDPKDGRNHIzatQohFIVZQaOBz2ZO3eueaotkEvIhqR8NUyYMIGKNWnSRC794sULSKvVPGo5tHXrVuhz4sSJzZ\/zgQzJIkKBVXPKkaLEGKHVSrFFbS5dusRR2hn\/LS\/nYPUIsom3YseOrTL7CG6NPEBFdcCPU+gvqF7hwoUJ4IgkwJ49e77keYEVpBwqb1wvdLQgJMNMC06cOGGk6kB+cPCyqkHcuHHRL\/WUYd++ffDC2rVrT506FXm+cuVK06ZNpRAB6ZJToOuHBmP\/E27dukUc7MecxGnTpqmwxCjCPjEmDDBK0R\/Vv3v3DspifthhVRR3QZ0zZcpEeF2mTBmIuz0vXHwJ1Pyn+\/fvd+rUyTbsxkzJUxugqqpoATYNvU6dOrWYBdiYPOtp3LgxfTp9+nT11F8VEuiAiNhOSu3Tp49x2KaRQ6EQtLQA0q2mBclYurkb\/NsraMKqVas6dOigXmU2A2pP8D1lyhQfVxD6yujevTvOz9jx9j5y5AgGRVbykbsWyFGr2S69evUaMmQIG0ozvxBS7PXr16UvxM66uLgMHjwYzcmZM+ecOXMkZ4sWLWBgsi2Alh04cKBKlSryHNcKELVr166Rh67hHml8zKh5kNBOEPAZ1wsk9OvXzyg6dLQgJMPH0QLBL7\/8MnPmTLwphwhAa9asibMZPny4eh+VOGHy5Mk\/\/fQTwgDtvnjxonlhPsyRjCgIrHRN105DPZ8+fYpLzpo1q5wIzORA5iTKcIX9MNOCpEmTcgm18NfNmzfNMxz379\/fsGHDmDFjko36o7DGgU96HXSA8YwcOVI9c1Sg6dT6UdTBzOkVLcDrE2zQLPJEEhAJnD59GuNs\/lRVpEiRgu6FQCpg+3o8Jo5D9+7dW7hwIRtB3YYhFEFLC1A8ozf012cl8e3bt+bg2G\/QbQJjX8f79++Js+GwagU0MxCFEiVK4N6OHTtmnPAVoaqKp9y2bZsip0uXLiXskNgCRTLrkoKk\/Pnnn4QFgfUSs4IETMqiqXndFSpUIK6S7bt379Kk8jIFNZREgBaZB1QVkidPbuQwYeDAgRxauXLljh07sN0+nqgg9Zk0aZJx8hdD2tA8MSpIv2QfiiCFH7QAZ4zHwllu3Lixbdu2GTJkqF+\/PmED2ZABEQOAGJMBaohYolnyYQ4FhB+\/KznNkBIEkvLx40didDWZEZjJQfTo0REzHxcB8xGtWrUyztRn5nObZcuWFW7x4sULVHXNmjXz5s0jyIYQyKtJZn00VywoQOGECvKiI1B3miJFCnl3WiDVEEiKogVEbm5ubqS0b9+eHpTA47fffqOhJIN0a9GiRfXzggSXL1+2HS3AO9DUmTNnFvqoah4KM4KWFixatMjoDYulbt26krh8+fIIESKUKlUKT6kWJgNm8bIT6OqhQ4e6du0Kl1fmQ4GUbNmyYQ7gtlZTFOVawNgPGkCNqYa8gASKFStG4MKG39fduXMnZ\/n44rV\/oe4RWymfRBINRyvUA37irRo1arAhOVesWAFLUDbowYMH2N+MGTNGjBjRPJAo5WCO5SwzYBUo\/6+\/\/iq7GDg5BRBDtGzZMn369OaxB\/hioHOgWbNmGaXrlTRSQxHSgL8UuSWslLlpSt4QMNKRQySKCPvNmzf4UeIBWVVMk\/t\/SyZR6cSJE\/GynIVKdujQQcXBKOayZcushFBKAMb+J2zevFmGKARUQHQBhAsXrk6dOublB+R0KUcg6bJMkCB27NjUv2TJktACDBruSnwnUcTw4cPNIwdBBKNmn+r2119\/4a2lburWokWLRmXM5toMda6iBXSKpEALsPb0HUZGDjVs2DB79uxScsWKFSVbUIAe922FFZnmGQrfELS0wDx5bcKECZIIZzSS9Kl5eB2rp4YBAF7\/2LFjQ4cOzZkzp4+iAHvt3Lnz1q1bzVN2vwIIU7j6iBEj2D5y5EiSJEne6asf+gFIDD7Y7y8t2QN0VXn3MmXKUA3dgmnaOHfuXMkgh0SHNcOgpwwYMKBy5cp\/\/\/33\/PnzqT\/WFrP18OHDR48eQRrkUyuAUEYmItgC+0sGme1BOZIfxI8fnxRXV9dz587BkAjdcuTIIUGSXPrLIeVQT+OSFotM5wxFSATuRGgBVFKiT11ItS4eM2aMit0JCnE\/wqTv37+v8gjM2\/ny5SM\/otuiRYsff\/xRThekS5cOAyIL2vgIczkHDx5ErtBT42STByUagZ0ggYpn6NXRILugePHikhkQgmOU0qZNy+0kT548adKkhOkUgvE0cgcxVMUuXrxISGBU6xPgOq1atVJD\/XIjQHbnzJkzbdo0tatogSwADzp16sSuRO1ZsmSRpRLVM76OHTtKtqAAnNJ2tADAwIwcofAFX48WyLMcgJuRFELGRo0aoc8wd7j\/ggULzN\/cswe4PSWRCmfPnp06dSoxqFlpFRIlSlS\/fv1169YF9SqKuu54YRrkRalx48aRiHVTo\/e+AWmGxPhhnvwLSAkVUJyAwoWaSNNB2OkCPeP\/MWrUKDG1xv6\/sWXLFsJx4QTmsU0gZXp4eCROnFg+mrxy5Uqt3XUMGTJEMgiIjWTXx378EphfAMNUGamhCGmAU8ooYJ48eSRFyQnx\/fHjx\/v27atcETn79OnjI59WZ2XOnDlOnDhv3rzBr5sfcivEiBGjQYMGmzZt8k0BzYKKH+3VqxcmxTjZRA4AlHfSpEk+xiG1atUyMumM58CBAxhDIvIpU6a8fPmSS4wePTp37txWyhV0uHv3LjdiazAJ25RNplbm+mCmZH1lzKlqE9UXynRkyJBBUjAp6tVQNSMYbicpQQGz5TEjSFeF+T7w9WgBaiyJxKCRIkWKHDkynBqySTzatGnTwYMHIyJoNUI2YcIEImarlYuAWSEFpEii+VfhypUrXAv+a\/VZP0G8ePEIlOEogbKeBiSDm5VJQwpSH5gB\/JQrYkTGjh2LFbC9NTPID6fx7yQmBatGkMAdKIP1+++\/G8d0TJ48mTBFtt++fatCnJYtW6ZMmZLT\/Whhq12BJNKb3Ont27fVRG6Z7KMymEGKbeKXAIchFwW5cuUScxa4lwjFV8Dp06elE5WIAulHjP7atWtxqFBAHCpxhXyCOXz48L179za\/l2Tud1w1Dli9iXD48OEaNWr4OL4o9sH89h3QxFSHsa\/j8ePHw4YNQ1mMM\/9NDuDH\/fv3t5pYh3IZhy2WatWqEcmwYX4\/gktwy+pDKoELc\/1hIZD12LFjS2UU8ufPb3afVrcMfZFHiphWmYokULRg0aJF7A4fPlx2ZbgUSDmKFqxYsULSAxdyFUyQXEUgnRKkjy2+GwQtLZDP6QrU+tjEmj\/++CM6nC9fPqGiuMAFCxbgMmfMmIHAQRFwIfADWAJ2Qc4CdLb0t3+B4C5dupQy1SIKZmBTChcujGLjts0O23y5z16XCIOiZOjMfKLAzc1t4MCB8I9bt245OTl99p0cGifAD1ZU5E1IRBvKPSqYlxoUcNek0ynQ+Zw5cxIESLriExhH8kgikLsTGEk+4ebNmzFjxsyWLZsUgi22\/00kSv7CxdouXLgg1wXqE01+VzgUwRB4felENNRI+tSPf\/zxx7Rp09asWbN+\/fqqVavKoVWrVsnKHLgrzIh6yKW6HoGMGjVq3759Bw0aREwiU4Bh8+yquNaMRo0ayYmfFR786+zZs82ToM3kgItiHDB32LqhQ4eq9+lhJLKGWKxYsdTEW7kWFgBiTbEq5ctBOeaiCNXM6xIKUqVKNXfuXJVN7InaPXfuHOGckdViwZJLukDRAhQQA8JdR4wYMW3atDJOoAYb5NEqoL8kJRChqio0kV4Ajp8WZ7NacEJlDoUZQUsL0BO99zUoWnDs2LF27dqVLVsWf0wkV758+YULF4o\/fvjwIYIyYcIENIRAH7KJu23SpAk82swPAgzcA3akbdu2SKpRLRNcXFzy5MnTo0ePI0eOqKBZ8FnpqVy5MiXYDnUCq+2SJUuiFca+L0DZAja8pq519OhRtcy76AOgej7OBpDpAvyaB05evXqF2ZXZyHHixIGxmV01F1LX8hH37t0zT3LE5hoH7APhxV9\/\/WXs+B\/nz5\/nogIqL9bf7wqHIhiCgFU60UdaQDCNqmIxZBkuhU2bNsmkOYjp6NGjzTKPHGbKlIkNxJtQFU2Er6sXoyhTBvYU5EGYotq+QR0lJxZGpvIINKf0SQGdnZ1lZAK7t2HDhs2bN0tcxOnJkiUjiJJCFIhk5ANRgS66u3fvVvMKFWLEiMH9qi8hWRECjOfPP\/8sOVOnTi2zhq1oAbG4ZDh06BBWHb7VqlUreQfNXJSiBVYjl4EIZEAuIVC9kDJlymrVqhGF2lLGUCgELS3o37+\/9ApQtADf069fP2RFVsfcsWNHw4YN8+fP37lzZ\/WyECQALj99+nSIBRQBft20adN69epRiJJa+2GWSAHh+86dOzt27Gh+HdkM0jt06IDeykSnz0IW8ELtZb604sUCs4Jx1zB0SfcNKKe8sxAwTJ48WV4LVMogkJE9q6YA9EiCBAlobQ516dLFTOEfPXqkHsFS7T59+qxbtw4vq9+NX+r09OlTVQd+kyZN+tm5lmasXLnSdplS+2GmBXHjxn2jf3XJ7wqHIhhCVjgGhQoVMpJ0oFCHDx9evXo1HY0vl89uWcnktm3bMDKcK7PoIbWIQbx48dQrUYD8ZMN11alTR+bhgj179sgTgRQpUijJMZdsC8kAjH3d71avXl2t8WWliVAT7IB6PYrbQcts1yQgTEqfPr05\/ctBizVq1MhcGQBZ6dSp082bNyWPXN18OzQyVICchOA0Js0lSwIQDhk5dChaoFaqbtOmjRV1AEFNCw4ePCjVc3R0jB49usQnIG\/evKVKlSpQoEDp0qXZwJQZJ4Ti3whaWmB+PVfNLfjzzz9R12LFisWPHx\/WJsJHcDl27FikqlKlSgQBMuoL9u3bBy2AXkyZMgVyQDmJEiVq1qwZJ1rN5aEcsxzbCbz+sWPHevfunT17dpEkK2AgWrZsifhavZxjdS1oDZmxOKrmvoF7DBs2rB\/D2sQxxMpqiVZ7oMqh2MaNG0vNzZoPo2rbti1t7tt7j7J0CdaKzLhzGTaQYvmVj0Mq+PGAg8wYOxlrGT9+vLkOsmoTGYCe1y\/I99aMHf\/DR1oQihAHbIJ0ohUtQEdQ2127dp09exayizUwDtiAqENi99ixY8vQl3p3ziyHR44cQUFwGPzu3bsXTSFn2bJljcMBBZqCD1bz4TVqYNIIOApqLhOSIM3u+gcRBHI6GDNmTP369e1cL9wW5tLu3LlDqGO7HjA+3na9QoUDB4yvS8SJE2fUqFGEK8mSJVN0x2pQU0KIdOnS0UGSgjnCNso2kPKDlBZMmzYNz5IrVy7Kp7WpEh6EqBI7YF5HEk5ABrpbBX56U\/0Lkg7UNv7IxwHX7wxBSwsqVKig974G+KYkIiXhwoVLmDAhDKBr164IZc+ePdXHFffv39+5c+cSJUpAKdSCZc+fPycyGDZsmMg0v\/gwepTgFdNgtSZBwPDx40fqMG7cOKrn4xRFzMpPP\/20ePFi21lI\/CIuM2bMsBok8BEy20jW9zBLnqBHjx5I8MSJEwOw8B8mEmIutVXWp3Dhwmo0XiZpX7lyBVU3N9rFixe5qOSXE82fNRIoTQbC8GwrL8D6VK1aVZQH2i4RG4B4yWMITvTtXAVoATW3pz19RCgt+D7wyy+\/SCeaHyKAR48erVmzBsFGZ\/Gs5vUKFczCg9dX783jjOWbbQKzKD548AAiklT\/fDD4khE7M9CvXr16qWUSgMYOPmlozJgxidTNa7Oaq8RdNGzY0OzP7Icq5+XLlxhP\/LpcUaFkyZLYT8kDNLXUXzdYvnx5x44dhwwZQgAmOTG2K1euhJzlzJkTI0nYLenyFqVcCJMic4kgVXp5GrDkZkonOQOdFkixQHgkPIBtaXCMOWxP3hYh3FIkgECoS5cukSJFSpw48eTJk5EoVQhQ2+YACQtPITIX5PtG0NICmfQhkDdWAXG\/pOTIkWPhwoVHjx6dOXNm9erV4RC0u1hwRJMIoJoO2J+a4S8vN0aPHn3u3LmbNm2CatDTaO+ECRPUsJW\/QH8LjH0dly9f\/u2336CZak0uMwimITT4dfNEPPshj0uxTVavLQDMnKxt8uuvv8rngK0q5gegU7JUi9ni9O\/f3\/wQ5N69ez\/\/\/DO2ADolk4Du3r1LHpmH5eTkxK+8DwbUKmCqDuiwfPgEeiQptpDMZFALhkAF1FNM38iQLU6fPg0\/C3CQFEoLvg8gqNKJGAcjSQdGHGmE3eLgW7RooUIOM3TJ1WDsm16MihUrFn7OPAfWnBP1Fw+KXZKUgMFcJsC1Dx061PzCgpoHB4iUmjdv7uMb2uZC\/IsPHz5MnTpVXVRdjoDePJWBS2By5UL4S5k3IChTpgzUAVaRJUsW3OexY8fwsqRLURhkOZ1fjIkEVJh9rVAdWbNmNS9lKDmDaLSAO5Visc+0toxx0qru7u5ElZCA4sWLU2EzXyQblgrSgFU0kkzAC0SMGBFHw\/bGjRsprX379gE2SiEIQUsL4Il6N2kT0dXapUSTSZIkUQNruF76b+\/evQgfxL9BgwZdu3ZVjAzXi98i+qQ\/tm3bRjZOwWFArqG0o0ePhlisX7+eXocfcCId6ceCBL4pGOlyyCoDHhrlqV+\/vnhcKyAxKACqQshidaIfePfunbwOVKVKFSPpEwjZJUDZvn27WnXcD6iLwo5lHEVjBLq6UmHzkzNEee3atQMGDCDQF0Lw\/PnzUaNG4b9r1apFNzVu3JhdtfoYUK9Na03z6UJQGVQoRowY6jO1VpCc8BvKVK8pL\/q02GX69OlVot+g8jBCY8f\/MNMCGJi\/pjWEIvgAgyCdaDV8RVi\/YsUKRJqOxseYQ14FkVtg7H96bVUNgIOKFSti7o3Dn6QXsUevCYvNbwwGAOZLK7x48YI4R00HtoKLiwtij6Ezcn8q5MSJEz6OiPgNDKOMpZsBJcJsyiRcgdZGpqr26tVLzAgqjNveuXNnqVKl6tate\/v2bUwEhqV79+6kyyPX+fPnc4qcjk0W6wFv0EvSAP8wDx5IzqCgBePHj6fA0qVL01Y4AuqZOnXqxIkT41CQIvWKma1NA69evZKFq3v27ImNkiEQIB+9w\/sQc+LCMImS\/t3jK9ECfL9axZNwGTeG9CM9cGQ1tpY3b16iScJEnOKgQYPoTigqHELOQivo7GTJkpETMiiJ+Jh9+\/YhEOSfPn06ajB37lxCbXZx576tG2oWCDvx+PFjzFCrVq2QM6mtGeHDh6fygwcPhh+YqSgwX0sXRW2X+xKeYZ79BDBSSiL9gCoHvH37Vk3gEGVmg+jf6vE\/tVJvGbx8+XLs2LF16tThxGbNmhE2If09evRA6KUchaVLl5JfLgfkdLkclkV2rSDZcMOwJcUAZOKY1E2RFWyf2SJbAW5n9bDGXzDTAiIYkSJ1C6EIKVC0oEOHDkaSjjdv3hAwTJky5erVqzNmzDCvUuAHYKsUVb16dXg58YNaPADJx1yoF23QFGJciDKGRVICHW5ubiiFMo+2gJdgDJXzJkhAjOU2fRNjczrhk1qNVPQOYKZoRmVRFThRgD7myZNHZT5y5MjIkSNxtDt27Dh16hTBWIkSJbZs2UJbQWukWKEFAvpCxhqJo4wknRaYRwsE6vtJX04Ldu\/ejZDUrFlTClR2SVhCnDhxaGcSMXS+rdxsBq5HWgA6xV1v3ryZbXgkiB8\/vpqS+d3jK9ECQkw1Fw+pQp\/xRniIqFGjwgNg8TgbWWOLDkBdkcjLly\/PnDmT\/qZHFVPGN0uBlStX5nT1GiFdThzcv3\/\/4cOH41nJhlIhfPJIDKU6fPjwwYMHjx07Js\/X0QE50W+Ithg7OnB4kA+K9fEtZycnp3z58vXp0+fQoUM+XkIViNsbN25cwoQJsT6KySLK8GjZ9gOq5AMHDhDfy6WV8sPN1XwfgbooYj106FC0tGTJkly3Y8eOEAJajAaHpcFs4NcjRoxYvXq1zN2NESMG7SYlqF8ZsEHbrQiQQL+UUT21jRFUkgAXlFE4au4bB1IlBBhmWgCwZcaBUIQoKFoAkzaSTHI1e\/bsZ8+ewXHNT8r8gNACCLF6ofHSpUsEGwQnpCP8U6dOff78Od43Y8aMaERQ0AJVecGmTZtkeqOPoEq\/\/PKLvNyEGWzatCkb5tNtgdn86aeflDVQ4JbV\/C2rOsi2uECgvoCaJUsWTAF2G6ORPHnyMWPGyERgOSrwkRaYYwaCb3lB0YxAHC0gApSiAL6Drpz2aRnZTJkywY3Wrl3LNjzys+OUqk3wF5zo4uJCgXJHRIM0rDnP942vRAuI8pULhxMMGDCgUaNGkNN48eKpOQF4StRSHlyBChUqIJTYd\/wQukF+\/CiOn0P8bt26tXPnzpUqVUIszLMKbt26BQ8g9uUorGLevHkE8TKTVmD1kNIeaDqkw9jX8f79eyqGZ\/WRHwDcHtKPQ1JeH1iVQzSAS5ZnVwBmAx+3upCPgJ3QJlYPDoC85Qxevnyp1EAKXLVqVbRo0ZDyFClS1KtXb+HChbQVXTBkyBDqUKVKFdRezCt6RVGKGUA+pBApBzZAH1GOb+8jqJzyK8AkyRvbAF544cIFAjK\/x\/bNp\/sXVrRA+Mft27fNY6ehCP5QtIDg3kgyCRiJT58+RcvsnHSMucfQYz0IQowkHXfv3oXKR4oUiQslSJDgxx9\/RKHI+YVzC3yEVF5gJOkTlhs0aGB+oq80GkSJEgXuIrP\/4DHGOTbgLsgmT\/eBKgEDZX7l2OrSQHYfPnyIqSQAwzLEjRsXbUWJCM\/Q06pVq16\/fh37QJtImQAzgi2VD1MJoC\/iRNWLIQQAONRy5crJroKiBVh4IymggKYQx4ujSZo0KQafwIweJCwk6FLfspfMn4U555kzZ+gUacb8+fP79tj0u0TQ0gLl45MkSaJUF+\/epUsX+VoodMF28TvcPIE+PUEHI1K\/\/vorKZAG+CwplNakSROZREZXTZw4sb3+VQXkwLyMOY4Hh0e\/1q9fn4CY6FZqAnr37i2u2n5x8QOw6d27dyPo8l6vLVKlSoW6UnlZsMwWL168+OeffwhT2EBPzLWSbX7NiRQlS7kBpfwxY8ZcunSp6DaBDs1rNeTYs2dPyTni00Kkhw4dotpQK3pEGgSWIG\/0rlmzRn1WNU6cOMKUFdbp7\/ZAyGTXXDc\/oGwBG9hB25cdAhFWtIBWxRnQEQULFkQq\/guvGH0fULQAKmkkmeRt7ty5UNtatWp9dhaYnIKTQE1WrFhh9fBOgPVAR2TkQKDizq+Ds2fPYhhVsA7M5ECA4qPjxgmfgGFB69WJ6qzYsWOPHz\/evxNruOtcuXK1aNGCODtjxozoDlxEXvLE66NHzZs3Zxv7jAUgBuMUaV5FC1RncemIESO2a9dOdhXUskhyun8hl8Nk1ahRI0uWLDQI3oGqEgoiMIcPH8YSyrvWUBw5JWCACUk9gYuLS8OGDf\/69xprUhMlkN8NgpYWiBcHZlowYcIEBIUInogf+ZMhMlvg+AmjR48ejRQi33BeOhsxorSaNWsiAUBNNUIypk6dCqEeMGAAQbwyE1wUpozng0SLtkB4M2fOjNCLtgRijxJq47ApGR6t37Q1IM4c5aasFg9Aq+G5QJ5+matkVT34h1qFjdtR+k+sz10PGzYMZWjUqNH27dslLOZ0AduTJk2SzDQUNKtTp06cRaIchaLVqVOHBqQcIoM2bdqIhssl0D3pPsns6uqKeYWki3+VRD8gGbhrxIDS4CXnzp2DHKhDgQ7zNxEAkgO55O6ocJEiRQgjsG6+fQsnFMEHihb4+LyJ0PDixYtWob+PEDGDEESPHp1fq5kKZty5c0dWLAXokZH6FYGHw2uqlwlRQDRR1FB+U6ZMiec+\/Qn9+vVTBkcZBEA45Jtp9RuY3Lx58\/bo0QNlQUfwrDI9vFixYkeOHCHDhg0bEiRIgFGV2VRyFvjzzz\/l0qqzsLGRIkWaMmWK7Cqo5ya1a9c2kvyJDx8+FC9eHHP35MkTlJ2blXGLq1evLliwgJrQRE5OTnny5MGgySn+hXmJXnwWwpY7d+4wYcLAzGbOnGmO8Xx8nBqiEYS0gDA6ffr00qxmWoAraty4MVHpwYMHcfC2XzxDh83egnJw\/zA1KQogsk+fPuV0GQAfPny4PAIHRMDoCYk4P7NWwJrRmbRp09Kv8AnijM9GGP6CucK4ZOgL8XpUfZk\/WyRKlIijmCc1hwVFIl0t7W4Fmo7MtJicDpT+cwlifQgW5KlPnz7mSTHSjEB2YU44cjnLvNLqjh078JcYylOnTt2+fRtVl+mQCvJSoppyLAU2adKERHk0qC7hG9RZ9CPtHzduXARg8uTJckjPEsjYv3+\/XncDcFASaSiIF2aOlAYNGhAy+vg+WCiCD\/ymBWgxPWj\/UD+8OVq0aBgNLL6R5BN27tyJV06TJs03HFWCHGDWZIa1AJUXGPs2UIeyZ8+uJtMEQL9wgdx7ly5dbt26JR+AhkuZP9qEgyT9Jx3mecEq8Fikr6YKiB8iR45s1XcUpaqKXzdS\/QM4QYUKFX744QcZ40SXKYoQ9O6njzYdPXqUmAeb\/+jRI9+mefkNGpAyuUEZMFCGgpKbNm2KFMWLF69jx45mVvQ9IQhpAUGn8osEyooWQB7r1atHvx47dgz3IFMRrXrOx46Eq6rXFvBwspg57B5u2L17d8pEDoRkQOWWLVvWtWtXeo5I8c2bN3hBqMkff\/zh7OxMPE1\/44MDMV70scLo1dixYwsUKODj+okgRowY8NlRo0ZRSRkDxNIZJ+vDD8g0t6nG84FuGTSlosxcuXIReXPXKCR2xDhNr4yqj7liRMxSCCpEd8Bd0CisJPyJZuSo+tBL4cKFISIXLlyg0SpWrFijRg2uZS4Kmo\/ptHOGv1abT3lWr14tTyjl06ufPde\/kAJPnjwpNyJtRSOTCKnHH9D7pHDLUATzQtqBXpNQfDn8oAUfP37EkmCXfWQMPqJt27ZRokQhwPDtZT+RAWwFgQcRi1mnvhrMcggv6d+\/P05IGkF0H8iuwLxLaD506FBlaQMm0tAsR0fH2LFjy+wiGs2qHaAF2DRYddmyZc3vgBCPSTXUOvcYXqqEJZFdoEyQIACLtqHFmG7OxfErUkIcz266dOngUpISMEiL4UQiRoyIkWQXL8a11PQvAXeN0U6dOnXYsGELFiyo1uz\/bhCEtACvr3e9hqRJk5qnHFarVq1y5cpQsHbt2vlrBAavSd\/jqORFwQgRIlAO7g0Hjw+eOnUqwtqmTZs1a9bIhLvLly8PGjSI0BbPCjMlukXcSffw8KAvfXvYH7hAts6ePTt69GjkTL5GKvBNvWvVqoVVgq2nTZtWNNNHkB9vDZm1f8n0hw8fqgWaUqZMif7fvHmTbkLzS5cujXyTSNuajSYqjSWFOsSMGVM9pOSO9u3bJyOKfoBO8XGtZXnF0cfnu4EFREtuUyAjE4DwBSLF7fj4FfxQBBMgYIANtZyR2ffLUVzmgAEDLl68aPY6vkFKQ7MSJEiAv5fZ6b4BLoLAkE1Fn98W3COVkXYAZrvBttpFc8lpnPMFEN4MsFeouZFqAl5f3uYgtDOP9aoZA5hfSUHLwoULJ0MX2Gf1dIbAAJ\/arVs36Rd\/QZqCuyYsyZs376xZs1atWiVPJAnlYSolS5aURQgCBkhV9uzZcRbiHaBEXI7QS46a4e7uvm7duvLly5snvnwf+Eq0gN4yUvW1qMqUKQMzINZv3bq1kfo5iABduXIFX7h582ZKaNy4Mf0Bc0Q4qlevPmzYMK4IPz148CC8lTgYWVE8btGiRUTA0IIMGTIogvL1AU1BjosWLWr290q35dcK6qgZsWLF4u7MC6baiQ4dOkgJiRIl2rhxIxQ7bty4qVKlIp5mW+kzELpGW8EVcuTIAaGh2UnRTLJ9ygzb8PHp7NWrV2HZEJQgmtwLHZFFoLNkySIzJJo3b47FVC+mC+7fv4\/40RfYU6r6DUeMQ2EFJWA+0gJA3+GxoM4Ec\/ZPW0PCob8tWrTw7b04uW737t3HjRuH5\/smowVWUE3x119\/UXO1CpxAph2gSn58FcJfeP78Ocwpfvz4OFf1mFVTeJPKb926deLEifh4K1ogQzvURz3Ov6B\/33zSpEnLli2jWL3KWjyAoQ7A8\/gXL15UqlSJuskrG4SUp0+fllXbcQpGJv19LsIqmZPuX+Dpy5UrFzVqVLUELYENtnqevpijwKo1BLYpIRqa0QwiULqxpS9vZ2xZLEi2i4sLAg1nJAA1Uu0D\/J0O4EQsPh6uXr16UMWRI0dmzpz55MmTvXr1atKkCbLYrFmz6dOnFy9efM6cObA5AkS6lrMiRoyIdMogtty\/FBukkKvIb9q0adHtXbt2IdC\/\/PKLLEoqh8T3axTgE2RXq6W3t3p5CZY9fPhwbnbMmDHmhwt2gotKX2Dy0GrCJrazZs1KOpwAu6nnstDIUgF6Cj05d+6cm5sbmiZHgdTZb4hqGTs6ZBeLwC9Kjv\/WkwMT3FH+\/PkPHTrUqlWr48ePnzp16siRI\/j+pUuXyttKGDupwMCBAx89eoRJ3b1797Rp0w58+rR\/KIIDRFRevXolu1aA4dGPmO\/w4cPbI4oCTokXL16UKFH8PgXJR\/7lJT0j6ZtCalugQAEiivXr18tryQLxRpMnT5apV+xKeoARLVo0DGbOnDlr1aqFzaRwuboZqBgtb5suKWJjJQUdpzE7duwIFUDZsfmzZ89GEylf+Lr9FX748CGhC\/eO9WOXYgkvO3Xq1Lt3bxkw6Nq1KzaKQ\/C5UaNG+fbc1m\/IK2N\/\/PEHt6BukKoSRMk2EMOotYsOc+J3gyCkBeaWElGWRqTDsMWksIGi6sc\/DykN2RJNYFuIM31WqFChAQMGjB49Gk6AKOPhkiVLhnC8f\/8e0YHokRP6v2fPnuXLl2fKlEkkkgLNNQw6yFWsrkU15MVLKAutoQuYdlOSTe3yy72gV3juGDFikJlT0AR5huJfUFqcOHEQ+qSfPgYDuyLYQqmgCJIioIlUhcuWLfvx40d66s6dO+ySLmB7\/PjxUBw9lw\/gcj6qPYTmw4cPGCAqYyQFFFozfdJMAheoQP369W\/evMmuTC\/lBnPnzg19pLW5R6rNpck5f\/78hQsX5suXb\/Xq1YSkkSNHtl3kMRTfCkrAXr58KSmqlwFC9fTpU+QnYcKEUE8j1Q5IhIpLU0\/rrSAXxYb8888\/kSJFMj\/y+1ZQTSEoVaqUzLATyKHY+mLqQCzbl4ACs2XLduvWLbEw+sUNSAYgRphWYtvcL69fv+YX1qVoAdvqhU9imG3btjXXX25U8K3CFCt2XspHYWH2VGnZsmUTJkwgppdse\/fupdjnz59j81F2FF8ZHH\/RArkKlAuChU2TFyXMtyyRpII0iMBI+r4QhLTADLN7gIPHjBkTV41gqQ62E\/hIJAkXheCqLqFTKZ9DKAxUFN+P8CEx1apVQ2GQmIIFC44cObJw4cI\/\/fQT4YKc9W2hC7w3atOrV6+DBw+WKFFCEtUv4E4JAmA8RPZU\/syZM2SWRVe+BOnSpaOVRKspTVYCESXUj1sjc+bMYkZtGQDWmSoZOzaoWrWqVWvTZdwFV2cbckBA5ttF7YGcK2KwY8cOfDwRFVaDxsyYMeOhQ4ckj\/kSbBPNQEfIQzXgWJw1adKkFStWqNmsoQg+UONJarQM0ImwAfodsbxy5Yq89WoPkHnOwib4PcyGJ5OJZuaLfnPogqxJslofhXshBe4CPZKUQAHWhijfyhGagekmLufqVk6dvpANUUmAI5dZ54QWO3fulPca7IQUwi99jfWj8MePH2PST58+LRkAFSD8O3DgAEex8xkyZFCXth+0IWft37+\/cuXKFNK5c2fjgAnS8v8dBCEt8KOHJD7GuxO6GUmfg3TMmzdvEAVhgqp8NgAZAEeLFCkye\/bsa9euTZkyhZCR7Vy5ciGRRACI1Pv37+Wsbw5Vf\/z05s2bu+mr\/XALKh1XTYUhyI0bN8aJJkqUSO5RjgYMUgK+UNw5jEQ+Rao3oc\/9xXXz6OuEy9i7GfJGibHzb3AVqk2wzoaRpI\/ionWurq6VKlVqpq\/a5ttF7YScvmDBgpIlS8JvoH13796dNm0ajdmjRw\/JYwVaFffATWFiaNtx48YRJWC2jMOhCDZAWh49esQGSm0exQXyPAu3TTDw2ZEzkUAUH5KaIkUKQk+\/h6kwFC9fvuTqxn6wgdyICqVkF04ACZaUQMHt27f5NQdytpAhNyqgnrOQ8vfff8u2UnkM9du3b1F27JtVD\/oN0Wt+iSKw5zVr1sT3lytXbs2aNeooIKqZP38++ouBKl26NBsBsCeccuHChaJFizZp0kRelFD1\/88iCGmB7UiA9NnDhw\/h4zQ9kmfFN\/2AnHvz5k2ivaRJk1oVzlEB29KpBH\/t2rU7fvz4xo0by+uLH587d06momgnBDNg4EaOHJlJf4vXSNKH3dq3b79ly5aKFSsaSSaVCADM57Zp00bYFeE1beJ3sZKTxrd61os9GjBggLHzb0iB\/JpLHjx48J49e\/DfROoSkAVMA+UsSl60aBH6DP9gV6Yo37lzB09\/\/vx5uKCW1abF1K4UkjdvXslpf00CVmd7YC456K4SUgANFRIfJUoUqyEB6USZWOC3AwOSGU+P7OHz8F5+hMKwAULP5MmTQ16NpOAB7sJ+a\/kleP78ubqQj0JIUEdj3rp16+PHj\/IkF9ALtkQK\/g0g62zbL8+Sk\/s9efIk6kmAV6BAASKZvn37mqeF\/fXXXxgxbCOMgTBg6tSp27Ztw7noZXwechXZqFWrFrHZzJkzJUWZCMB94WtsI6LvG0EoZ+YeMjc0mombEWVWUvVZSC\/yy7nIpR\/9ZL4W8g0ngBngP1SKbHxbmCspQH9y5sxp7Oi6t3bt2hYtWpgrbHuWf0EJUghBRnb9M0v37t3bvXs3G0pPbCFrLV+9elUiiYBh9erVw4YNg+tA+eF2c+bMISwLwB1RTzlr\/\/79EHxsvaRjzTFMDx48mDFjBswAYwSJsSpfu\/lPKbaHjK3PQeVEhoEf7eYvUI7A2PezR\/4jECtBFGGeDUCzQKPFLWGyrSIE30BROJi7d++SH10zUm1Amfie1KlT21nsN0fAphn5ARpKUxJdyJWoK6Bi8ePHf\/369aNHjziqnrPoZ1hnxryXKFFCggrbo7bQxV8D26dPny5btiwGkNCocuXKQ4YMmTRpEnajX79+o0ePhrdt3bp1xIgR7K5YseLUqVM\/\/PADGeyfJSpXAdgQAh6Mko\/PjCJEiNCoUSP14OY\/giD0kSihsfVvPH78GBERhScOkEQ7kT59epSW01Wn2on69evPmzcPUunfdx++GiA6MqdPgNybX98IdNCGPXr0EC3avn27pOhH\/gVpZxWr+ag59mDkyJG1a9fmHufOnRsjRgxSMC7yHoR\/IfWcPXv2zp07W7VqFTt27GXLlqVKlWr9+vWjRo2SewGLFy9W328NRDx79gyKKW9ewdiAj+0WMKiiZPzGv0L+nYHbF\/Zv1cKYDpqdLiDwwBr4Nn\/QChSCiedEivWjYSkcZ0ZOMVDBH4TRxlYgAcfv5ubmG3PCetMy2A2ywZz8EH5pZ\/S0XLlyRpIdoED66PLly0WLFn3y5EnXrl0nT548f\/58VBsGUKhQocGDB6PXR48eJQwgT8GCBWED8lSaE+0UBkBmfvEICxcu3LVrFwZE0q2Ah+Lqao72fwRBSAuIBY2tfwOBu3Tp0vv37+mYtGnTGqmfg1jJ\/PnzE7nCVSNFiiQk1E5wbuPGjfPmzRtsg4ANGzYgnUrNvsKwVbVq1WQZg5MnTxIkSaKPgA0QseHOUUUjyT\/A\/ffu3Zs7mjp1Kj1IX5CI6QlYaW\/fvq1Tpw4kYMCAAX\/\/\/Xfr1q3ZpWcXLFiAbFSsWHHixImZ9A+lQEHOnj0rZwUWuDr8khgod+7cXOievtpJIAIBoJUwUufPnxfL9V+GUge1Ae7fv3\/9+nUk9sWLF69evbLTEyB1CRMmxPhEjhzZXJotyPPhw4eQQgv8G1l9FrSqq6srrN3Y\/zew6rS8bZvTpNKqtJsouOzisP14ZGMFOWX37t1lypTBvCdIkCBnzpx45SpVqkiMxCG0g41YsWKtXLkSrSfWxx0k01eJ5rpyaTsBZRk3btyWLVsox0jyBf4tOaTD0cr9BOLNmx\/OWYnRmTNn8Ap4aPtHwKgYQoNzQsjQWwq0f7wIQHK3bt3KhkheMES2bNl++OEH1f7ySmdQQ15twgPh7STFCqq5UNEsWbIQoMuugrICViBR0gmvO3XqxEbVqlXbtm3LhpTJLyaDDb8hhcgvoBPxxytWrMicOfOaNWt27NghAxhx4sSJFy\/esWPHunTp0rFjxxkzZpBI3ZYvX66fF2iCTdwAe9u\/f3+NGjWoQPHixcuWLYt9uXv3rmQwV5hf2TCDpoah0uZsSwYBu7QJ7LB9+\/alS5cWS\/cfhxI\/M0N69OgRtAA7gH\/CfNlJnsiG3Xj37h1dJqeoZjdDrkj5IYUWBHr8gJfF6foWPb958wYqRkuybW4iOkUmHsG6FA9Q3ec3zB2xZMkShP\/27duwgcuXL0PBBw0aREBy9OhRSkN30I58+fL169fv8OHDPXr0KFeu3F9\/\/cWJHBVIOb5BXevixYstW7bs06cPl5NDfsCekr8nODZr1gw9adeuHRE8+9y86qEvhFle1Uc\/AelcBcHy+zUYK0ivbNu2TWYdAvvnJQAZGQvOXYsbkK+XCuS9waAGzIxo47MtiRmlATGp5kcwMhuZQz62KomSvnbt2jt37sByUG85JOBokSJFjB1fIKLIrxQ1adKkBQsWyNsrWI1q1aohP1iHBg0aQAgwGcmTJy9YsCBHo0aNCuMpWrQo+eV9SEoILMEGKVOm7Nmz5549ezZv3lyqVClsWfXq1WV4jKuoCvsI2pxaYebYlsySzimId6VKlWA2CxcujBQpkjr03wS3L44HR2U1qUX8ur\/6FPF4+PDh8ePH6TIjSYdVCe\/fv0fUT5w4EejuNgQBbbW1zNJQNAvtIylYA8UMrly5QjexAZ\/wl2WWYkVfYPMNGzaUAd2NGzfCMCpWrEgEiI0iDCAnmr569eokSZIMGTIETYeaY4JkRrn94FpIAsYHSmH1jYZQCBx\/\/vnnypUrY6SIVuWT\/H5YNH\/BXI7VaAEyB+7fv4+rNpLsw7lz5+SBYvjw4f31nJvKCMMNziCwNrZ0lmBsBSXQ6rx589Iyfj9bQc\/v3bt35swZ84glcUObNm18m7CtrOq+ffv4xVig2JIigPf49gVqBXpNgKjgd2PGjImPh8V26NBh5cqVNBFXiRcvHpE6ZBEqUL9+fWSDEx8\/fjxixAjCekIBEvv37y8FBgowTwK24Qd4cfjB77\/\/DlWVRECVXr58KZWXFAEZ8Pfp0qVbt24duyoDvzQUtUUHx40bJzm1E\/7DeP78udBQfk+dOiWJQBoNyLYk+gFpSfwW4SxFweGQW5nhJJBsAtLJhl4I8\/hvQsmerRCSEk4H2\/AAZTdkqACotYzshOoClJp+oeXZxf1D93\/44Yfs2bO7uLhcvnwZota5c+cHDx4QOy1fvvzChQvbt2\/HCMyaNUtNOrYHFI7hghNgkdDB\/3Iv+wHt6X7Hjh0JtmBhe\/fuzZkzpwxvmvHlFgqLaWx9ijIRLBy8RH52ApWmRxFEvJTIpcDv6slRggC\/H58HB0gNpcJ+++lABOyK6yqtVqAaArah7airVQPSBWipb\/UkpDh58iQhmtAC+lpNQZUy8+TJ49vzSyB5BIR3WAc4BA6e3UePHtWsWbNAgQK\/\/PIL2djlED5Y3mmWE2PEiCGzCnDb6D+7Ym5ICRRoluzfpSVNmlSe+8jwCXYNvtK4cWNMj5ntcYgGp\/779+9Xw1f8Xrx4sWzZst26dRs5ciQpchdWl\/ivAS4oASig+2QD4Lnl2b\/MLTBSP4dbt24ZW3pUisshUsQQGUmfAP2lv3BFIaXxg7SetoVDvg8ePCjP5sydosIAbIVsfBYIucg5aNu27cyZM6tUqULgQWKtWrXgAXgN6CCBhwSB48ePhxkMGTIEwciQIQOuPVasWOiLDLx9FupazZo1o4uxKoQQKjEUZvyfK1WoUOHQoUNwMfnskFnfAtZ25lE487ASqnjp0qU0+ufM\/eWq8UA7duxAUNauXXv8+HFhBp+tm0g2lILTgzk3lLe0vyZoPWlAK\/1XrSrpMi0DYIj5xdnj0qBoqKVvYzb0+MaNG69evUo2dv\/55x9U2iwSfkBdnav07t27fPnyyMyNGzdOnz6NwBBEyqAF\/n7MmDGbNm2aPn26fKBSTuQ3W7ZsVAxHi63B+nNpbkQV+4WwtZUKchVAfVAiJyenwYMH\/\/TTT+3atUN01ehrkyZNaMnff\/9dTsEVUfmGDRtyO5KBRCDb\/1ncuXNHCYy5NWS8Go0+d+6cPPr0G3IuQstv165dO3XqlDhxYnhq\/\/79oZsjRoyAWeoZNSBd5KTj\/ptxJPdO2\/o4sCrNSPvgsCG1bKOGturvr5ngUmbPnj2XLFlCmTD71q1bx40blwCgRYsW6AhEuVixYoUKFYKLkLNixYqkYAREy0iBjtu5npVca\/LkyegdMbAMYJvlKhQK\/xd92g5NgItBo1A86YBd+nq3AdMQ8\/CyObgXjmk1pGwPqCERJ76hbt26VFLGFe3sV\/wK4h7MVd1MkkSUgxrSevJQRlIUOATu3r3bqFEjGdbGBMiUXUJhPC72NGPGjH5MjbygI9Kn1Zrx3+ahYD8gl758+bKYg169eomlOH\/+PPJ54MABKQcRwoiwgXSxIWMPnEjT8YsDkIcOderUMduFr4PcuXNTgd9++w0bOmvWrJw5c8Jd4Nx9+\/bljpInT16vXj0ZGCDwLV68eLly5cjALtrxdbo++EOxKCvguujKBw8eQBr8FVcAIsUJEyacPHkS94D0Enf+\/PPPkEjYm4wciLcQEdLPCO4IXGmBfD99+tQ3rn\/z5s327dvTMmJIEyVKpCyqai4720218PDhw+HQmTJlko+SEBotWLBg7969qMnFixc7duw4ceJEtAZrQyIZUGrURytCLyRZsmT2zy1YtmwZBaKVhQsXNpJC4RP+7ybpJDFJKVOmpGNmz56NhtBhJUuW5DcAL2KpFxQp2UwLRBr8tRYmwordR24QWUnBmP74448EWByyRxAJDnxjwcET\/nrPIsCgx1FsaIG5g4A06fLly\/PkybNw4UIigJo1ax4+fLhNmzakZ8mSBRWdNGmSfEDdR8NEyShwkiRJ5CmDmA\/7FyqYN28e3X38+HE4Qbx48QgdqlWrBh0pWrQo1EQWr40RI4b5cb5scF0qzzYsYfHixQUKFJCjXxNSAWNHF\/UmTZoQoKBHCGHTpk25haNHj2L1fvnll1q1akEaZF4kZ3EukBND4SNgA4grhDVs2LD2E31IBplFzmPFioV7owvmzp0LJ3j8+PGAAQPY6NOnzx9\/\/AFXgHd+nVeBAgCzaAHfXHjAQIAuQmjsm4AAy7cJyICWyTwY0qU+anTZqnq+QS4xaNAg2vyHH35gF9IM6cfRUDIprVq1orM6dOhAycSoq1atggFQOODqUgjb2EnzhCc\/AM8QLi7fYg6FH\/iXUqE2SiDSpk3br18\/Ijz6HpKIV+jUqZOMtpk7xje8e\/eOaM\/Y+SQEAgkCuJbexXbJ0IoVK2bOnHnt2jU1qIgwISj4s0qVKiE6ajlu4GOxyJabm5v9RuSbI0inHKr2oU1wVOwKYVLpL1++hFbXrVsXOsVurly5Vq5cKasiglT6y0twBdnw0Yhcv34dEcK1cwl2RWDUNxi1HJ9gJUsY5UaNGqG6b968oXMJBSATikQmTZoUw01srfWxXltVGhtAZBhIosA2JeggF\/Lxchg7gtRDhw799NNPGTJkwKAPHTp08+bNKJpkkLNUL3wf8Pt29G60zvD8+fNbt27Jk0fbNvn48WOkSJEQD7T+s4ZIAYeXIEECWZdGSsPxQ9cgB\/PnzydaRdSJXAmHILJv3779Orw8AKBiZukK3E98ScuoqWCq2Xv37l2jRg15Cxc6jl4PHjyYwIxdqYx56oYfoEApk45Dx6dOncrtYBa6d+9epUoVFOH06dPyfSwKxP7QQfgdbALWhr6Taykd99ueq2uREytXvXr1qlWrmqlMKHzDZ5qVdi9ZsuS0adM2bNiAS0YOcM\/SH3637Pv373Etsk1mczAq4SOl2UP0tI719v7555+PHTsGwVfh\/oULF6gGUkXYSkiK6MAu5fmTJi8mtTHDfiPybYHDCFxttwLto7pv3759auKntBtumPgVB8Z2ypQpU6dOfeDAgWHDhulZNEgPQu\/OnDkjKbbABLds2ZKS5UKY+LZt2\/bv31\/vT2vJUf2ybt06GP3ChQuhFIgNZG7jxo3wS9F\/sqVIkSJ+\/PhSgm+9HGxBtbmF6NGjt2vXjkaWMQ9SYF1FixalwZ88eaLJbki7L7\/x2dvRJULrULobO4Pthj+dOHFCvpohkELkkQFEM3LkyJgO4gT7p+MgRdGiRbMdL0TXoKGHDx\/GypnXuI0XPD61aoa0EpRIPksI0AshOoEFuYR6RYhmpxdg4fLAC7NQvHjxPHnyHDlyBGYgmQVq3TBJNB+yAmVi\/KtVq3b+\/Pk1a9ZkzJiRYhs2bHjx4sXMmTP\/8ssvWPLFixfDErD5\/MIYtm7d6t+nRWagYpSDu5k7d66kfGcqFujwixbQdvSuIFasWFOmTJk4ceLYsWMREVL8blnieLMGqsx4FAkfkQy01I+56EAuLduIDp6JcvA3hQoV2rRpE0QSF4J5rVWrFu6EsHLGjBlo+IoVK3yTIeRDFRicQesF9Rim9IiibtJZsHL0E7uMLSAmGDFiBJoJ6tSp07dvX2jZO\/2FMWlDGlNeDfKxSQk40EM6gmzsduzYURbvk6NmYNoAwR\/9e\/v2beISIulFixZRgV69ev3555+PHz+W19aVQMqJIRFKEYYMGZIsWTKkGsK0Y8cONuBn0IIQfXdmwBohgsDvO6JB6H1+9+\/fnzx58kqVKj179mzo0KHwpPHjxxuZ9Jh4+\/bthCiURmb8IuwKAfNt\/oEt8FuolbFjgiZP+ue227Rpc\/z4cchBpkyZ0L5AX1T4yyHCQ+CrHhywISuSBS5UmdjVIkWKbNmyhW3sLX2ErNJEctQMmdEJ1EiDj+AWbty4UaxYMUrGdEMECR7Q8eXLl0OLb968STyA854zZ87w4cPhDVAEOMpPP\/3k4uLCjQOjIPsgLVazZs3Tp0\/v3r0bjyPdDSRDKHyG0Ui+QPyoGXT\/vHnzMPGwBDrYSDVBTsGvqLlm9A0dLEfpV\/ENRPZLly49d+6cpPsBVYdbt25hCwYMGMA2UlWxYkWKyp49e4MGDQhDd+7cSWzKhWCXdevWHT16NE5OTgSTJk0aPHgwgti8eXMjKfgBBi0tRjB07949IzUoAYnmcoStRF2zZ89WLK1x48b0oJFJB9yLdGIFrPYff\/wh2WD32GUjh0+ARkh3cwq7ZnFiW+0ePXoUzacH2cb00KGIVpkyZdglUIDqPXjwQM9owFxOyILUHGKN76FxHj58CC0gRJajIOTemoLcAnKCBcBvQfhUonmDe0fkFixYILswPzwBjpltNLdy5coEAGodTNjqiRMn2CCmRJE7dOggT9mgqnL6Z5EwYcIf9FVEPwtXV1cqgGAHz76AoKuhxHDhwlnp6RdCljEl9iNsg7nKVTBHv\/32m5HDF0DjJDOugV2rplO7uGd5d4D+xfjQI9euXSP91KlTyl\/06NEDczR\/\/nzCv5gxY6ZLl27gwIGIStOmTTldyvEDVpeWBYvEAXHI6mgofMRnaIFvePHixapVq3Cx3bp1g4ZLojQ6YBsxojOErIGTJ09KHiI\/We\/iwIEDlCAyYSeuXr0Kc5w4caKx7+29d+9eDAQRBk5LvrW1cOFCeX4xYcIEyEHXrl2xJuREqrAm69evhzTIucEQihYQDP3zzz9GalBCPo2IQqKBcmlaePXq1cZhE4j7ZcYvdB4\/LZkTJUpEupHDF8hiA4QCxr4OhAS7I9szZ87ExGMpDh06RGlLlizB8C1evHjEiBEcvXv37qNHjyTn94EZM2akTp0apyi7\/fr1w7gjsbL7PQFiR9ebSY8A2cYrOOoPhtBTI9UEYg8CR3d3d+wDAtmuXTucOoJHfmhBly5dYuhf2wIdO3Ykv9gcv2E\/LQjmaN26tXrAESFCBBTEOBAYEFqA9skzeECj0ebGYd9RokQJyU\/cz665RzSXoO8Sr8s4xM8\/\/8wu\/cg2xoQ4Ux6oKX+BOXJzcyMP1Hnfvn07duwgTHr16pWUxq8fIAO2RbLJywtYGDkUCjvh10ME38Bp0aJFq169+qxZs\/Lmzdu7d2\/sOBSbThWQx+qZn9olG2ADMo4PCO+feT3EVYQUMruQOvCL9EyaNGnatGmlSpUisCCRqLRGjRowVqLPpUuXFilSZPr06dAFJA\/jS90UJw3OUM0YpKC5nj9\/zgZWWBYdqlevHixK2AlHgZZPB2EfdAHlv3LlChGeVA825vy5JUHkaYh0ugKn4xXoTWglsrF582Z2CThwAH369IEVvX79WsYnYB7ERn5fIgQBmSQm\/vPPP7HsclPcb8SIETGUkiGkA3PM3clbSDKeLDNXuFmYEEfZRvfpdLoefyPfy7ACJ6opt+RMnjw5bgPBY3fUqFGbNm1CboVVSBt+BWX55lAqgGqo+2XDdrbElwNCJmsEtWrVCsuQPn16rq4qYAs6VB4vgpQpU8qGApUEeGjiNwQjSpQoaAElE1uOHDmyYsWKxJDydqi6BKSwSZMm9+\/fx3oULFiwePHisDpO9KMOVuCKp0+fLlasWNu2bVu2bEmKfgf2nv5fhzSW\/UCxFSQFgRg6dCgOY+PGjZICCPUonL6Rq2zfvl3SL1y4IA\/G8ATk8VdMLC9JtmjRQnbNdQCQDEjlr7\/+Ci1ANOPHj9+8eXMZOzp+\/DiSnTlz5jRp0nTt2lXyB0Oo0QJY19OnT43UIAOtRyggV0TlVEAvDQtUQA\/Y5ReThKbJKaBhw4bqkG9A\/8mJNTf2P2H9+vXEPWqoKWnSpP3793\/8+HHNmjVxmQUKFJD1f\/wuPGQBfwnLOXPmDNta+366NVmf0Z4B0uAPQjruJXv27GxPmDCB7V69eg0bNgzXjgLiziWbPYAHZMuWjRIgiESWnTt3Vs8UMCxCC4g+7bQhtPx3MFqAzFSpUgUfKe0Af7J6vvaFwIZTLLwcLr5o0SJJNMuqj7h69aqwf\/qFsI0Uq\/z79++Xz+LQXwQed+7cETooC5UCrDq7YMaMGRs2bMDUw0s6duwodyel6bXQoJ\/hKyQDlAJpkTVLJFEgu6HwG\/6mBb7h4MGDcLq+ffvCEtjFFtDHihZg4iXbsWPHJAVa0LRpUwijpNuD6\/rMZKgf2350MMxDjWiBkiVLYo65Vvv27YlHI0WKNG7cOJFdEKwExfwQIahpga4jXrdu3Zo+fToNIr7KHjx79ixDhgxSTxcXl127dpFIUWrgzgpCC+QdBAz9zp07T548OXr06EGDBqH8AwYMkOH01KlTr127lg0IxKFDhzAchBTySiqJl\/VvqTVq1GjatGmBO2r61YDkp0qVCjVh27ahihQpAt+SbR+bMRhCdbqCpGP3EyRIgN7J560BNJ2ORsbMRNMeIAlEjcaOtzeRH6VhVcSwOOvLcKHUiIdkUNVQlRFglGLGjJkjRw5jP8QColy6dGn1vi60QD2NChSMHTuWYilf8XV7YF6m7NKlS6SY23\/v3r2Kz8l31QFdhvUgffjw4ZIya9asggULmrUb1w5XRmb8KzaAuCJdunQBONFf8FHYvgMEDi2QdnF1dcXByJNgeaFFtBder6YcouekEJtiJatWreqvR6ryOpyMFvjREzgbaGYFHfKVbgG0AFOF6\/3999\/JMEJf9NQ4J3jg69MCY8efkPX4pHPjx49PiE8iGuhjgUIL+GX7+PHj2AJ2cZCchVSwDQPgEMYdK8DG\/PnzZZIawAjyC10gG4COVKpUqXDhwpMmTQpw5b8JuEdC1W3btrFtVXPZxUpyg\/v27VMpIQK2nY5XmDp1qpoqj91XIUHAMGbMGMQA2Vi2bJlZnQVIC+SAGBSDo6a5UCWrWmE6ENe8efMa+yEW3CO+Uy33G+i0oGvXrhQrEz6s2tAPiGUGNLKKuASbNm2SrySg4LK22KpVq0iXVWfITITQpk0b5Qhe6d+pEkiKRgr86d25C5yOTIlQ5QQdvsIlvjICjRZYNY289S5wcnIiKpX0I0eOkJIiRQr0vFy5cv6iBYSPnNu5c2e2ba8osEqHqcycOVPGGwUqLD569OhXGKj3F74+LQCy7S\/FwxZTSUwAYAOyZTXb3AyhBRIKY25++umn9evXIwZz587NkiVLkiRJnj17xiE44vPnzzEKgwYNotf0qmml0Q6wfuK8xo0b4xXwr9A+ZIDu00oPCSBUrVKlinoXQyCHgNrt0KGDjL2HRGDfcczZsmWLFCkSnK9v377EiAkTJsT0y7RiBMx813ZCViKBDqoBKgHkMkKECL179379+nWRT5\/nxuvv2bNHTrS6FtSEDOQ09kMsPnz4gHMNIlpAH6GAZ8+epVV1qfx8f0keeUkEYBCUgQWjRo2SdHgbu0hIt27dfvzxx1q1asGSEQ\/JNnv27EaNGokdAHJpgdqVQ\/Zg+PDhXFHIqH\/P9S+k6CC9xDeBr7TAX7eqN76WX52lVg8Vz1FIX9ye9IEDB7KL+UAES5cuLZNLgTrRD8gLM+Y3EezEkiVLOFHQsmVLFVUEN+AapZJfhxYYWzrsaX8F9eKydC6AsZFOIbblyGcLYsaMSaCPXSClbNmys2bNYmPOnDnx48fv06cPmly4cGFZ00LeWVXlkLJo0SLEhm0ySwng7du3shHMwY20aNFCHtPaNo4ZUOSkSZOqF\/ZCCs6fPw+9o4vDhw+Pcf\/zzz\/pRzkEjcMTo+yKw2nyoUN2PwsoRc2aNdesWSN0UN6F6d69+8KFC8XTgNq1a2siqM\/IIbFnz55mqyLX2rx5MxkqV64s6SEX0AJsKWRabjnQRwv8C2leukPqA+QFRYCqwt7oDjg9sgGHY5t0mUkDEiVKpETl9OnTihZ8Cdbp3ytfsWKFsR9gcFsmITU2P6XI3wf375cvU3aRrrD\/zv5p3zpVh0\/p0oyCBw8emPtUF2HbUjQOd+f2nRvXrt+4foN\/N2\/cuKn\/Xrt67fkz32fwfCrp\/yX6ULYvtECqAox9O2CV+fr164isdL9AJrX16tXLycmJkAJOkCZNGjHudl5LaIFMbLQnvxldu3YlPM2tf40DoqpGL4IVypUrpzfVV5pyGGBcuXJFhWjCDBQtkAwC2ZXPKNDjMnUApEyZEtPABoEFG2\/evOEQ0kLQ4NurUL\/++isCA1tS4WBIAT4MFmXsfA4EauvXrzd2QgLo4qtXr8qXKpUzFshjERSNLitYsCCeQ9I5xV9DU2YgKvL2LBtwDshlu3btwuiAYhLjIpn58+dPlSqVmv4sQii0oH79+pIYcgEtQPXUyoZoTeBOOfQvpHk7d+4s9QHy8iHkgO0aNWqwvW3btgQJEoQLFy516tQICd2EfZPM48eP10r5Ykg18KbwD3ln9UtBeVqRBrRN066nfrlVK7QvoLZo2oztf2f3H6i81P\/UyVPt2rZLlyZthvQZGjdstPp37WkL8HGk7cH9BxnTZ0iWMFHSxEmSJEqcTP\/HdrgwLj26ff4lfL9rG2hTDgWoZYcOHdKmTYvpl6F7YkSCdfWesflr3HiUZcuWyYm2t20LoQUy6hAwEC60atVq586dViYsmKBkyZLSMvg\/f72j8TWhemrGjBnqEfKwYcMkUUGyvXjxQpZISpgwoUwvffLkSc6cOYX0EFnKS+2nTp3q0qULHBH5wfCRIqAQKcfNzW3Lli3m8ckQAdiMMnzqXj4LO7MFB1hV1bwLxUmcOLHMOyFIgJEremT\/DaqcbFiRCfNjBVyOEE0gH6dGg2rXrq2iLvkyeHBeysxOuLq61qtXj4BKv2\/t8wSyMua3gnQQNl\/qAwi6Bg0aJNtx4sSBtzVq1IhOwVvD2KpXr45gyJTJvn379u\/ff9KkSTJOYL9U+AjMC7SDS8iEpC8szQ9QrhS+f99fUSNEbN9aW8dTS9SPBhhz582NET2Gi6NTyqTJUyVLHjl8BLbHjhrNIS5nvh3ZfvXyZf68P8aLFTt1ipSpU6biN1WKlMmSJM3+ww+\/r1xpdYot\/K6tz7QAn9S7d+\/9+\/cb+3YAE0+XwwqzZ88+cuRIOOz58+cRCDoeTwxLIF4cOHBgjx49onz6DoKzszMEgqN2vpoly\/IfOXLE2LcbqoEwUgGOVL4CCKqkZdD24DxaoNoTgiWzwGLGjEnoZtW2ly5dQvPlHTOQJEkSgrbly5djryVnnz59cPZsEFD61q26ePstw8EU48aNU4885C6A7PoNO7MFK8jdAWNfn11UvHhxY0f3Zy1btpRhZH9BlWku\/OLFi0QdqIm89ibAwXBowYIFxNBXr17FHMFLZJRi3rx5ZMBF6WeHYODzUCgXFxcZpUOngsNCWLIwgBVKlChx4sSJPHnysJ0rVy4ZOSCFQJEU9Tr0ypUr7Vnr1m+8f\/+eS6RLl+61\/uE3XRIDX4ko0finF37uzLk4MWK2bdVaDllBctoDKQ3PGCd27NkzZ2kPER482LdnT+Z06VMmSy7U1vZ2SKlcoWKaFCmvXLpMnocPtH\/37t57q78JKBlkw0f4XTefaQFxW\/jw4fv168c2pSvIUSts27atSJEiqVKl6ty5s3qtBUNPcA+3+O2337hPjAKBoBx69OiRrDcOV6AXFy1aVLZsWciBessIGNf79xVhGJyFYBn73xe4WVEhQITtr1c3vyHoXPW9c\/OzW0JDjAWd3qlTpwgRIqC0kodt8Q3cL10vRi04czX\/QoSW21dvXv03QWhOpxs7OmiZxo0bN2zYULqbXYEctR\/EG4SbWBuMIcakZs2aIlry8tuBAwfYrlq1qvqmfrly5TA1bKgVTgNw0WACai5PEIQWpEmTRl4I\/4bAWfj4uVdomWTInDkzHI4gUFa2psL4BZlu8oUdoU7HyNg1zcJ0NfOl\/aiG7SH2JfHcmbOxY8Rs07qNJJpBBkTcU\/v5P86eOfPs2TMOyekKkvLq1SurR9uzZ82ijyVwMp8i208eP8mQNl2WDBkl0Qy9PGpguop50+aObOHrQ4QBAwagWmzIJQRm842n36t\/dL9ixYqQcZklQAbCwV69ek2fPt1HDkgGaIQMAKKrkgjXmzJlSunSpdu3b29eDpkrGls6uBBnfa+0wM3NDf3RFcqSPHly9ZJesIWIhGyrUUR84ZMnTyBwQ4cOlamdderUQR7YICwQi5YgQQLIIueaR0RUUd8B5syZ8x14oC8EDKBv375sWLUAYSIO4\/bt27Lr3\/YhXM6dO3ezZtoDXQF2RmQPQExl\/hBOaMSIEfv27Tt06BDbclQee4OQS0Mxs23btlUDrtmzZ5cx828C6TsslVqWAMinZyJFikQAgFW\/evUqxuHUqVNY73jx4o0ZM0bOJZzgdIGkBAByrryhZl5Mzw9cPH+hSqXKB\/7SBsIf3H+wauXvt27elEMHDxxYu2bNu7c+0CzC9\/Vr1+3cvuPDe+0Rp1z38IGD0SJFadvGeIgAaIp6depOHKc9N1R3deHc+Xm\/za1WuUq0yFE6tu8giV4mR623gbH7\/1Rv718HDXZ2dFKvVEgikO17d+8lSZS4ZNFi27dua9GseeUKFSuWK9+pY6fH+lv3Wh4v7xXLVzRq2MhVv6Pjx46vWf2HkMh3b95u2bT5r73a69A+wlda8Pvvv8eMGVMsu1brT9XizmfPng0Tz5EjB7ZPTQFzd3ffsGHDsGHDFi9ebJ5Tqk68c+fOuHHjqlWrVqNGjY4dOxIZhwkTxvxMGnIwa9YsiCfkAGEyUk0Qr\/m90gIaTb13RNuqObrBGXSusrB0rnwgH+UvUaKEJMJ1SpYsqR4Q3L9\/H\/In91i+fPlVq1bBIYRQfjfASLVo0UK6T9cbs6Z\/\/5D75fYRZoigSjFjxowZBQsW9FHHPwukBeExzzy9cOGCSFS7du3279+PB0L8ChQoYBz29lbDCVgeEbaQ2ykvXryAcKtHJ0WLFjUOfDvg4NXUMcAuibVr1z58+DCKQAyghg0uX77co0eP0aNH27qVAAOnw0Upk217Cpw6SXtznt8jhw5nzpDRyeKQM3uO\/fv+atWyVeSIkZwcHGvXqCkjtVLQhw8fYLepU6YicA\/v7FKoQMHFixZL\/bf++Wd4l7Dt9W+EAmxdrRqapLVpqa3RAm7cuNGgXv3E8RM4WSyRw4aLFztOkUKFjXJN9aTOWFGt5noaVz9y+PDggQNjRomaN0cu36bBPXzwMG2q1JnSpY8TM5aLs0u6VKlTJNGCrsIFCz95bEw3oSbU8O2r10sXLY4RJSq30KZ1mz+3bCmUv0D4MC5RI0bu09sgylb4Fy1QbQqnKFu2LNcwq9+tW7f69euXJk0aYj78utVgAPYdh22eLwakwDNnzvz666+tWrUaP368YgyYDMoHagohzSprDGTNmhVfAue4+YnHAYqSr6F\/r7Tg3r17KggIKW9S0SnSxbId+9P3WBESGQl4+PChWrxPYe7cuTKoCyJHjpw2bdo2bdr88ssvx44ds2f+lFxRXTdYYfXq1UTJSLKxH1zrGXSQ+8WAIAwy\/ukjYIo4b1nLwV+AcGTJksU8eRBDgSDJOtyCOXPmZMiQwdjRl9lQb9Iijap3qGoI6h2pKgqCphCwye1UqlRJjn5NSE3kFy+AWVbNy8ajR484pF4jp18iRIhgdhZ\/\/vlnYM2H+Fv\/Pk6fPn2M\/U+18gMzp02PHinyuFGjM6RNlzhBwjw5csaPG4+wO5xLWFx+lkyZnZ2cFsw3XhJ2\/+hOIM4lsmbOMnTIkN49esaOHiNZ4iR3bmsrsK35Y42To2M7nRZ4eXo1a9yEnCWKFX\/1UnPkT\/95WjB\/fkeLJWO69N06d9mwbl2+PHkzZ8wkvl8b4feppiOGj0ifOk2yBImihI9YonCRU8c1Z8dN\/eu+9M1bN26SM2qkyLlz5lqxfAXh+qOHD7t11laj6tGtu+SvVb1GupSpJo2fED1K1CwZMxXKlx9qEiNa9OhRo1LPFMmSx48T9\/w5Y6VBM6xHC3bu3Dlv3jw057fffosbN+6mTZtIxK937dqVOG\/ChAlbt2711xAc9Hzjxo1YAanotm3b1q1bd\/HixYQJE4owdevWDSkZPnw44gUhkLEgzhoyZAg6jA6oJ0bp0qUj\/\/dKC65fv64m9oe4KdP0EbKB5NC58tXX7Nmzr1+\/nu7u0qWLkcmktPTv7Nmz8+fPL\/erkChRImK7JUuWUA580YplmvEvPQkewCASyQm7D4bV+zqQGydOypYtm5r\/pR+xxvnz5zEp\/noXSXD06NGIESPmzp27QoUKlFC3bl0cg7wuL4XAsEnU82q4c+eOeo5gtagUkDzBH1JVYnFuVtGCevXqydGvCWpiRLfe3mrwD4g9p3pjxoxp3VqbiAd69+6NDYe6BeInP+TSHh4eEMQi\/lyiaub0GbGiRsuQOm3c2HEOHTq0Ye26WNFjJIyfYPzYcVibP1b\/EcbJadhQYwx7+DBtZaQa1ao\/1d8LgyVkSpuuZrXqUoE1q\/9wtDj07N6D7Q5t24VxcMyaMdOli9raz2D2zFnOjo7VKlV+985VUub9NnfihIlK+HykBa1atIwRNVrcGLFiRo1Wt2atB\/e0hV+N\/J8g23+sWk3d4CvXr\/7\/sbvrO9ccWbNlSp9BHhb07NYjboyYcWPGSpcm7bWr1wb26x8pXPjcOXKtWbOGQtq2bkOHrV75u5xrhjUtkFfnmzVrBjNo165djhw5ihcv\/sMPP9C1X\/4kGBZPdJgpU6aKFSviNrgQQMSrVKnSqlWr3bt3u7q6vn\/\/3sitvxDRv39\/nMeAAQMgFjJ0pr7R\/J0BWqCMlyzwHFJAUDh9+vQdO3YUKlQIW588efImTZocOHAA754zZ071QAFo0m2SHBguNJQMcte2QDagjylSpIAyIjY0y8yZM9Vj6WAFbhwrI9sB047vA3LvM2bMUPbax9aQRIwMjs1MHO0EMkA8unDhQsRMUl68eEGZAnY7d+586tQpNrZv365e5wNIpjxHUJD8IQV3797F0aqHCN8qfpBG27NnD1SAWA5PgZJKlQTqSxbSQVj1J0+eBEpTq0IqV64cI0YMWTHdfsyeMTNqxEgE\/StXaE+4Thw9FiVCxJ8\/jaX\/\/fffsWPGKllcM1lIVIb06ZMlTXb\/7j05euzoMbx1o\/oNZBdaECls+Hq1anfp2Cki7jZnrovnL5DuqTv8ob9qr9O3bNpszerV93XvruBbO0j65UuX\/9yypVTxEo4WS4Ef88kAqjkUl2x379zp1qXrCX0WJykaTdPT27ZslSBefJm9OHTIkIhhw6VIkvSo\/hi3a+cuLo5OG9cZK6Ns2rjJ2cFp\/dp1smuGD3MLzp07R8Dn5ORE8EqvEwWav3sm1\/YXFLXs1q3biBEj2Iazt2\/fnlaTyPK3336TnMgZdCFfvnx4C0kB3GGbNm3Cf\/oEs3qj4TsDtEB9I1VoQQCa+isDTkocUKxYMfgcIUKBAgWIlSGR8rY6WLVqlfmtMLmjw4cPkzN27NgJEiRADDhl0qRJcuMgc+bM0EHCzXnz5kEKf\/75ZwoUORFEiBABkgqlkDKDA7B9tWvXpgfZ5h4Fcui\/ifnz59N9xo5PUE3k7u5OfElUIEML9sC3tlVlgpo1a+KoKLZBgwa\/\/vrrjz\/+iOTE0T\/qT4iJWNJZy5cvV4sshRRg\/WBR8rTO0dERi0qibw0SpICZCRUoXLgwu7JglEKUKFGCdHnyli1bhgsXzvazTJ\/FogULXZycmvzUSHZvXL0WLVLkMfryAODd23c\/5s6TP++PbB8+dChi+AidOvx\/caTDhw7HiBy1YT1jUazVv6+KEyNmkvgJIoQNFy1K1B+yZnv6jxY5Cy3AjWZIlz6Mo1MYB8eUSZM1bvDTDd0+SAYfa2y+kWdPnxUvWszZyVk+IWF1j+ZdtjXof9nt0LYd1SbGZnvQwIHhXFz++LQsUq9u3cM6OW\/4RAt27dzl7OjUq4cP7wxb9CL\/f42\/\/voLooe9zp07d+LEiSNGjPjnn3\/KIXO2gIGi6E42CK2KFy+O6Fy7di1RokTqq7sQCJxE165dIQHyLpOacAF1kEEq4oCPHz9aVfs7gC0tCG6QNgeyu3btWnmsIx\/4qVWrlvRj+fLlZUqOLeTc1atXV6hQQe4UyLSpoUOHym6SJElkBMwMDw8PmOLs2bNLlSolI6jp06eHXhiHvxHkdrDUuB94jEoJhX9B7IFI3LtnhGVfCMSvQ4cOsEm1kvSaNWuiRYv26NEjwmsRM9G10aNHC78M\/h0nNUTmuYV48eJReYwk\/FiOfgVIdCfVgAQIU4dp4SkI5FBMdjNmzFioUCFp24oVK8qJgQV19blz51I+rkrS\/YXZs2Zz7sD+A2QXtY0RJeqIYf9\/l7hyxUrZs2ZjY9oUbaFGgn625bqPHj5KkyJl3Vq1tXze3iuXr4gZJVqCOHFbt2jZulXrME7OTRs3geaSVfLj3SZNmFizWvWsGbVPif6YJ+\/tW9pIp5ZBL0EgmQXaHepg+4\/Vqx0sDrJoo6QoaH0hZQgd0EcLJKFl02bx4sSV+bwDBwyMFS2GPIkA48eMpWPUzIljR49GjxqtSiUf5rFpCxFSKNQPm541a1aMO9KG\/z5y5MjevXthZGXKlClRosTx48fFK3MOvwFD6dKlCQSTJUt29uzZatWqUVTKlCkrVaqER5QM8N87d+5QHzc3NwKOnDlzUgG9ntrNSx75BqNUJhRfDXQBvzQ7cHV1JcofP378rVu3SJSgQRgePYuZUJMkbEE5dP2GDRvEjgCILdE2IaMs24AAEMaxIVcUYGiKFSuGQdy6deuFCxf69u1LoIAxUhNXvwloCsTy7du3w4cPT548uZEaCv+jU6dOPXr0aNOmDTbHSPoy9O\/f\/+TJk8QVsks3wSbxZOqBAoaV3xcvXtSpU+f9+\/d0pVnegi3kMSu1Nfa\/IjDOmvI7OMDeGjVq9PjxYxJp1e3bt7u4uGzbti1WrFjEe+vXr6dtnZ2dN23aJC+JoKRnPn1iMcBQ9ufUqVNNmzYdNGiQfI\/Rv6ButJ1afZliqeoN\/a14SXFxdr5z+\/aN6zfwUwTTkiiIEzdO5MiRVdNT1Ou3bypUrDh91szJkyfnz59\/3vx5y5YsVRnwbh06dVy5etWW7dtatWh56MjhNWv+0A7YSBpF7dyx8\/nz59ygkWSxRIkchR15vcsKWk9Y9JySXc5ysLx4\/mLfX3\/REbK2LKJCp6lby5Ili5OjE65Udoms1Ltv1uAc+gyWR+SHobdac7dGjRp58+YlGKIdu3TpomL3AOP+\/ftVqlTBoFOnKVOmkEJoiKxT8rJly7p3796zZ8\/evXsPHDiQXlEvKcD6jepaLK1bt\/7yagRDBPPRAgyrbBw7dow4YMaMGWw3btyY2v744490GTrw4MGD\/fv3k4FDKr8VVDomI1euXAkSJKBDEQBSVq\/WJtEA6KPkMQPNAcaO\/sFW7BSZR4wYYSR9dSDMKIU83eS+fLvlUPgBc7thiKCMahnjgMFcoNomeMLgbNmyJWHChMhMjhw5hgwZMmzYMLG5uDTJrJ8UTCHV++OPPypUqCB3ESFCBFkZ4utAHnLjILJlyxYjRow9e\/bIeoWpU6eGb6GM+BhadfDgwZUrV75y5Qpa\/Pvv2nS2Ivr3U2ht87yxgIHYA8f8Jd+2mDF9ejjnMDu2bZddrG6iuPHzZM\/p5mbU7ad69cM5hTm4\/8Dzp89ixYhZvaoWvgoIyYn7y5UuI2tFLF28BHv926zZcnTf3r0JYsVJlSz5Zf3RxuMnxoNUwc3rNyJGiND209uM9KVZ2g4dPOhkceyifxxYoXfPXs4Ojlv\/3Mq2rXD+tfevalWqXjPNNwQd2ndwsjh079qN\/O7u7mVKl04UP8Fd\/b0JcPLY8fBhXGZO10y3oMCP+XJlzynm1wyNFhCa2w7fST0mTZpEGMfG8ePHcQYZMmSYOnWq2TqDAKgTnSGDrgJkaNSoUXPnzjXPJoMlIF5SOP4mbdq0yJYgXrx4o0ePtroZcgagJsEHwZYWmBt29uzZ6CTmm+2dO3eioilSpMCvFy9eHLtQs2ZNtUQBMJ\/oIxAk8\/OCN2\/eyKfhCD6svtruI9auXSvN1aHDp0VCvooAyFWePXvG\/apJMF\/n0t8lzE338uVLTKdaGZdD\/m1Y3\/JjNPBnlAwV2LVrlySyQdwFYwie81jNkPuCOseJ87\/2zgIgi6ULw3R3l3RIiKICKiKKYIHdHdfu7u7ubq\/d3a2\/3d2FiAooAoKAwf\/unmVcPxABQdG7z+V+Tu3M7OzMmXN2Z2dNtLS00O3V1dV\/pVrQtWtXzPQwIFH0qFGjEAJRAClN6x+VlZUhpSdPngwDcv9+biaDxrxq1So4kpOTly9fDu3Bzs5uz549XF45Iob\/wEpwcLDgzxFz58xVVFDYzD+wB5A\/AX6lvQp5fkgUXludMHYc9IZTJ05++vgpoLS\/lrrG1MlTbt28eeXy5Xat22iraxQwt4AbKXm1QH7VSu4cqc+NG81tz9+7e88b165ZW1k1bNBg3969N6\/fOHHsWIumzZQUFEeN5NotPRAmJUuUVFdVG9C33\/Wr165dudqnZy9M4eXLlmPbK1EHgHIWya\/cWrqEe5LiX7LUvj17UMSlCxc7tG2nLK\/gZO9AjyqghJUu5WdtaRUe9pw7nl8yifqzbRWg5ZTxK21iaCyzuyLg1IJMWLx4sfgy7Ny509PT09fXl30uAXWV0RKyC3JAf0qvSJ4+fRpdjWkPM2bMQCtg2kAd0NtQDfQz6nYEqvE9ifBHAEU4H76JwJr0\/fv3w4cPF6v8ZcqUQVWhDeCiwG1lZbVw4cIGDRpAdqxevZrSZJfBgwdTC2TxHgA0A5JK3bp1+5VXPzY2tmXLliT+\/uhel69gLYlZh3ZeBxjXPzm06diDBw++4jeAq1ChwvbtX1df0xYaFhYWMHj27dtHNnE+hM5i165d\/PjggHLwC9YWoFwq+ujRo0LB\/GamCOnZsyfMxcKFCy9ZskRXV5f243vw4AG9Ul6rVi20ORwEJuAxY8bAimjWrFm2drKi0kHNmjUNDQ3TLzzKFpjRUP\/+\/fsL\/tTU+nXqujm7MLVg03ruueRqfrL\/34mTdtY2CnJyGqpq6iqqFqZmMNCVFRQH9OMORxqk3Mbf3KJKvo9\/X8SzsLGB4bkzZ0MqcRv\/qCqr6Ghpa6qqyfNrC9iqQzF07JUrVwoX4j5QTmXB4V202IP73zRUclJypQoVQyqHwP0x5WO\/Pn1VFJTUFJX0NLW01NRhUxYtXOTA\/q+3vrp27qIor0BaAjh7+gy0nOBA4UslSFO7ek1VJeX0q\/h\/oBacPXsWZrr4SmCIwlKH3le\/fn3MZELoT8CuOoNCoBagabZs2QIjcujQoYUKFULPY7t6oRq0SA0hO3bsSJ\/JHwcUoHz7guLJkycLFCjAjHICXjU1NSiI169fb9u2LUYshcMgGDhwYHh4+Nu3b6EF4xdi4vm3hIWFkYwGUDiQhlZ+QShr8t\/j9vLyyuI1vXnzJu2pXK9evV\/zegIUI1wg+gIyKklQlMTPIG5JaJajR4+mV1rE4TlAfDi6oo+Pj7e3N\/pnXFwc5i32ihMtiIFYo5T5DToF2tSPnkBDHjLlKe+gcj98+AB139\/ff+vWrSjazMysRYsWc+fOhV4OjRwJjh8\/DlHMVgHv3bsX0z+3\/i4NCocFiBYuX748BDiFZA47cOTIkSg3Z8sMxUDsoNEgNAQ\/1IK6dZ0cHJPSNrm6eP6Cs4Pjti3Ck6z79+6PHD5i4ICBw4cOgxGP6owfO279uvWIQlbTpgob9LFzPHzo8JRJ3AbPEGvz583r1aNn29ZtunXpOnXKVEhDhBPCWfGwY6OjomdOnzFowEAUN3PGjLdvvr4ASBw\/ekxBTn74sOGCH3bRlq29evZs37Ydipg8aRLb35BbgZiaeubMGSiOMWmf18FZa6qph1SuAjdVYMnCxV6ehdN\/lu8HagHODZeQ5cuAZEe3sLW1xYSNNEJoTmHtQjD32rVrp06d2rx5c\/QJjOc7d+5YWlqKryhi0VeAu7t7ji3UfALOix6Wg9\/1OnJ6IA7Gjh3boUOH4cOHQzMIDAxct24dAhEFiQCRSslQeYgq9l4ipC1S4nQUeaBZ+vn5lfqWokWLIjAgIADmPuwe9CWU0r17d7pBChlNaxQyh7oKNCrabwMZyiyOyXU+ffqEeq5ZswZuvtt+7bcSP4+4PWF9du7cGaIG7p9vZ9g2tBSGQOdEx\/P09IRqq6GhcezYMQjHkJAQdOMZM2ZgPhMOyzdQC5BaQMDyHjZMWFGfp0DC06a3t2\/fhuZtamo6btw4NKAHD4QzJXv69CltbgilPygoiG5N050egk\/FgaYWezOBktELzLRSIbdgFbh65erRI0e5+qWFxMfFkxdQSHrEUZSSEIIyBYnSp8vwWHEgJA+mfz0d3Qf8A9bvlcVV4suXT1+4dheCeCh8+9ZtOF\/y4vdjysfEtN2WxPxALYBCXaJECSbuZYCZGBwcjN65cuVKISitHwienBIbG7tp06YpU6ZA\/rL9kgEswlatWpH7xo0bderUQXexsrJC14RmUKFCBfFtK5BFnTQ\/sG\/fPm6s82DiEUJ\/K7i+aG32mfzq1atT9XDFZ82aNWDAAGdn5\/Hjxz98+BBuXAX26vnAgQN1dHRgXixZsgRqBBJAk4CRnZwG3M+ePcM4X7ZsGU5WvKc6IGOIrJAsggsNEYmjILPEvfHnu6IY5IZaLVrELTLK3ZwlMgRTS9++fWlJIECb57jZkQ+6x8KFCyGyoM5CA4DVgX7477\/\/amtr0yu1s2fP5vqfnFzZsmVpNyRAhYqh8F8MlStWCypVqjR6NPf6XK5Dpwnghk0MbZtKhF6F8U7fOEAT9ejRQ0lJSbyhJIDq4O\/v\/8MPF1HmkAyNGzcWL9ChcJi5kDb0xcX169ej6AULFvBJ\/hJy0IfevXtnoKdfr05daqLMQYocFMH4gVoAad6kSRN2vzdDli5dCp0RfVS84IAcOQZ96+jRo0xn53sLl+fdu3eNjY0x2fTv3x8Kac+ePTEwChYsiKgtW7ZYWFh4e3s3a9bs8uXLMA6gXv18TX4ZmH1p7AGY5gj5vZWHAMUUKF6NEhoaCsWrdOnSsLGontWqVYMGUKRIETMzM\/GXUnHhsvWMtn79+rDYKE9YIQCOAgUKZPc54vHjx2lpatWqVWmrk1wE3QknSx\/1B39Q1\/qjgU2C6WfDhg3U4DlrdpgWurq6tMMSpiJx34CIK168ON0QpTXzU6dOhTUCSQLxIl7XjKJzVnquQEWL1YJOnTpNmDCBYnMXKNlkUIWHh0MIlCtXzs7ODkp8YGAgyoWoRxtCPiABzdl0bx81RLuhMbNi1tPpYOKndda4xHQPkqBHBmj\/Bw8ewNGgQQMhIp+RvjfkXf+AUJ08cdKF8z++h\/rz\/EAtADABM9+dBmDwjB07FnIc8j39Sw3ZRTz24GbAypw3bx56CahRowY9vEC4o6PjhQsXNm\/ebGlp2bx5c1iusAYwzcg8C8\/njBgxgk4NkIGOU6OoXwxkaPfu3SFD0aqk9VNNcHFnzJgBlYXWb6OelStXPn369IsXL2gfTCSDNBFXG27mFYcTFBsdHQ05gkzoViFypswBfYIvK1BWcKCTTJ48GcdCt4DKSK8S5QpoChKFgMlNiV8ALiKu6bp162R6V9ZBZ9bS0hI8abCs6tWrB9sUZiumPW1tbVKFYQthNoLKi06IENbD+SN+A1S0WC3AhJ1HagGV9ezZM+hGW7duXb58OZOltFU5WoxNCojCgK1Vq1bhwoVLlSoFiw6ByIEy+R4sQURExKRJk2BXQKFntw2mTZuGUgwMDPT09FCHn39OnUfgBMQnKePNGEr043SysPYUPrOU\/Ryyzo\/VgqyDbtS0aVMHB4dx48aJNQnWA34GZIj8V6xYQW\/IwGwVIvhb1vT9dSitiIJia2FhAb0BjqFDh7I724yfr0xeIFYLIAGF0F+C+AJh8kO7oQ67d++GlQDLgMJhuLdu3fratWtoaozSAwcOYNDm+vtRISEh1AJEaGioEJFNoNBAoCMHyBR6X+An2bRp061b3IbnEr8LqI85fuRPu2ril16gFXd42KN0h4lW12PCo3t1BDRLRCkrK5csyW2I+xuhCovVAszH9MIOO5dc5NGjR05OTgsWLKAHK+xT7y1btlyyZEmTJk2gQrHvIkJWoNHYnpI54N27dx06dFBSUurUqRNEzevXr9XU1FCuq6srW9NHKf\/LcI3wS5ohN9UCAqakr6+vh4fH+vXcck0ix2o+A4dTDlAOMOvXrFmTwgEMTQxsdFYMe0dHR3QmWhD75MmTokWLIvGAAQNozxmATPKnnUePxgnacJrO9xdABWGy79evX+fOnXEFobbXr18fNYHxREv\/7t69C4sKjlWrVlWuXBlaWqtWrXChueNzj\/DwcAgjlEs3DFA6fVw7603BUsbGxtI6KdCuXTv2IAwJsp4bMW\/evDFjxuR4TpL47UCrg52wdOlSWuwGPn36hK41Y8YM9PlZs2axlQQQI\/TsnEBKfX19dCF0SPaVB8oBkPfXQMXJ3C2gJX65VROWz4YNG4yMjNBicKPbQ5ijOOjZJUqU8PLyojRoKIRDav38Il9W7okTJyDJoQrUqVNHUVHR2NgY2ok4gcSvIffVAmLlypVubm6w6WnZCPj5yRidg\/pHZGQkhjcFxsXFQZ+FOo\/p\/9ixY5gMSpcuDSFOsYmJibRQztTUdOLEienvHOQfxGoBu5n2yzh9+jT0gMWLFwt+flrV0dFp3bo1pM+BAweWL1\/OdrCAZQDrwczMjBb3sevyk1Amly9fpp07CfH6waxAlQFwo8tBI6R80D3EjwDIkRUwGfTu3ZsOYTlL\/EHIXDLywiR9\/Phx+l2z7t27h77NlhS0b98eJix7qgWNAWYJRf1iqNpitaB79+65+\/oVFTFo0CDKn3ahBdCqDx48SLdpaSEXce7cOYRAd69bty6kK70zkl1QKAYXoNKTkpJ69erFl\/91SQGiKFbi15BXagHAvNKjRw9LS8uePXv+\/CYh1DOA4E9Nffv27dy5czFvQWVu2rRpxbQdc3fs2FG0aFFyE7RJJ4ByMG3atPypHIjVgp9\/PTfrwO6fOnXqP\/\/8Q29+Hj161N7eHr9jx46FNUBpYEvBVjA0NGRvhcDSyjv5iJoUKlSImoI+3C6+7j+E+gkgL3QsWDmUW9myZcUvtvyQzZs3ow+z+wTibCX+IMRXLcOLSIEAbkxL9MAI6uCQIUPYCzgE9Mvf8i401U2sFkCu5vptxUWLFmGY05YwsAq2bdsGU2HKlCmIYq93IhBeaFQQGqqqqlZWVg4ODlAOYN9DbvDZZA++4QXgPXToEBUEOnbsmG83mPqLySu1gC4wwACD0oeZZsKECWz9F\/UAgkJ+CFKSxQYiIiLQWTFi0YnptsGWLVtcXV0pFqX4+vpiqsMQAlu3bnVzc0MPq1mzJq2XcXZ2xpwnVg6yXo28Q6wWiLcQzlMwtjHw2Op6ULVqVaES\/AeKYG2\/e\/cO4Wg9tDlUPUqW18THxwcHB6MOufJMFyYIdMcqPHQbWYj4DpRg7969ffr0wbEUKPF3g4tO1x2T4mCeSZMmvX\/\/HnoA+iG7YQAwF\/r5+bVq1erqVe4V8F8D1U2sFkBryRVBQTkD5IZT69ChQ1hYGMy50NBQWnVBN1937dpVt27d9evXwwArU6aMu7s7xC\/bRQbDqkuXLrTH18\/w6tUr6CUoVFlZGVOGt7e3np4evRJMsNpK5B15eLeAG2Rpl3D\/\/v24wBDxx44doxDxjaOsQIkTEhLQL4cPH47Jnt3oQzhM3sePH3Pl8RnS+y2MWrVqde\/enXZIrFGjBkKg+cIIQP9esGCB+MWY3wLV+deoBVQWAaMHGtuLFy+gVNG9FjSvh4cHZlD6YjIZ2VAadu\/ezT7yQfAtndVrl10oZ4gYlO7v70+BuUhWag67B9YY9Y28O1OJfAVdaFpkR7v0dO7cGW4CQsPLywuW8ZMnTypVqoSQXP92cCZQ3cRqAXRW2hs+V\/rn4cOHra2tof1gVi5QoABtDwMZi1P29PRkwx9GV2BgoLm5+fHjx+GFKX+Z\/0BAbgFjoHLlyj4+PrDlKGTUqFEaGhqw9KhEiV9AnqsFBIVgvnF0dMTETC+xABb1Qyif8PDw06dPi+86sF9GcnJysWLFMGyg+U6bNg0zHAp9+PBh2bJl6RMp6GFdu3ZFIG2nDwuSDvwt8KfF1X\/IkCH8YOfI67sFcXFx7du319LSwtibN28eGsTJyQnh9+\/fV1FRgaVOmyg8f\/7czs4O0mfcuHG06hhVjYmJ+d72VrkFNQiMddSBlLmfhG\/jr51E7M6Q8+fPd+vWjd5lz5byKvGn8\/Hjx6JFi0IjhPvatWtsP3LYFQiBVRMQEABHp06dKBzT56+xK6gTQkGnckHfvn3ptcmfZ8qUKbAHoIg3atQI+gEyh7E+a9asbdu2QRS8f\/++Xbt2sBy2b98OQwLTMzvlf\/\/9l72kAH5ypDRr1qxQoUJwjBkzhqkF4NGjR\/QuSePGjSMiIoRQiTwjD9UChrivQLvEAMMkNHTo0OwOp0z6HIvCSIbagT60YsUKb29vaAOYAm1tbRGyatWqChUqYHqjD3VjGk5JScFEiNHVtm3bffv2pX\/GQd5fA+Yhbqzz0NZAecSBAwcaNmy4aNEi6FgnTpwYy39eFk0Ey+DWrVswhtAs0J+goaOhLC0tZXSUXbt2YcROnTqV3a3JdajlIZLQFLBU2G38X3NRrl+\/js6ZrSUIEn8HmGWrV68Om4G8tCYJZoN4rU+XLl0wfOhLCmpqaugqYnM5r\/vnmjVrOAHBA32drbzOMfRKEXLDiIbZRrfrYbKvXbv2n3\/+QTjdNgCQn\/CampqSF+oyfmFCXL16NVfOevr06cgfow\/uunXritUCYsOGDbBSdHR0fvLT2xI\/5FeoBem5fft2pUqVoJ\/S3vLg5zvWixcvoNj269ePbgmAO3fulCxZctSoUSgLyi\/MYnooCFPAysqKPhuFQHgvXrzo6upqbm5eqlQpeiUG\/IIZSAxkDUYFkbtqAU6EzgVKPZShFi1aPH78eMCAAezJaJEiRerVqzd+\/HhIQHqa8ODBA7Qehij0KkojZvjw4agkNAYo9dC6cr2hKEPoH9Qa0AwgpCgqT6Fyw8LCaAlFrp+XRD5nwoQJbN+ezZs3o+\/JbEN+5swZbW1t6pbQm7W0tOguGkYWkxt5Cm3VRcCa\/8lbWTgW1j+yWrlyJQxxOPbu3QvhTO\/sQAiUKVOmfPny7dq1g2qOxJiqy5Urx94\/4vPIHS5duoT2ZFuMwLSTWTZOwJKE+QS1AKXnbgUkxPxStQAXUtyP169f7+PjExAQwL67lWMwLA8ePMh2XwZUCiYtDCQbGxsFBQXoBOj3NONiUqSteKBDIBBd39raGvNl5cqVixcv\/jMfBc8urDUqVKiAmhB5cbcAqk\/NmjUnTZoE97Fjx1DKtWvX4Iaks7W1hSMhIQFKuqam5rRp08Rb96CGrJJEmzZtmjdv7uvri0y2bNkihOYeZIhABLRs2ZJvDw5\/f39ad52nsDOFg6oh8d9B\/E046L7q6uro53CjJ0CHHjhwIERE165d0Rsxh12+fLlp06YwsilBkyZN8vTDp9Qz+\/TpQ8MBzJ49G3KPG5zfDs+sQ2uwYCnBjYEMN0QBpAQ0Y4S8f\/+ehkCnTp0gnZYvXw75AC\/JjRwXmh5YKVCwIJMFf2pqnTp1ZJ7typymjFcid\/mdagGAe+LEiVBCYbL\/zIsoTIJznYWHvG\/fvt20aVP37t0PHz68ffv2Ro0a0bd3oeNjwCN27Nix9CXfESNG0CFLliyBNzg4mN11+AWg\/uyVPJDragEUfCjgbA8JjMDAwEBy\/\/vvv\/Xq1SM3RF7v3r2fPHly4sQJChFa89sRCI1qwYIF9OyfZESuw0qEBtOxY0fapQpAWPy8EpkhuASYFdKfrMSfBS4iPQ3M8XVkB6KnQTTRUoP27dvTrh60G+n06dPhnjlzJgwJPm3q+PHjVVRUxO835QViRblZs2Y5mKFZYoxiiD7MxyTojh49CrWGHmWyHT4YM2bMwNnp6+vTo0Nkkq1CMwEXy8nJKSgoiGQ4ZQsplOErSBTLF85BgRK5zu95iCDDq1evWrdujc5BL8gC4bJn\/8KzozA+N2zYMHnyZDbDiUGgkpIShnS5cuVojFWvXp0WzsTGxtK+uaBq1arinYVyUJ8skpKSYm1tTYWCrHxT+HvIVPLZs2eYSlVVVZcuXUonCAICAqD7k7tVq1Yk75KSkqAM3b59OyIiAuYCbAVKkP6soTegiXC92rZtKwTlMVDmoN6x\/Sdgu6xatQrVoNifvy6vX7+GqkRGElMxJf5EMJfDuiXt\/+c7xrt372BO0B6pmBGhN0NisE8B3b1718fHh0YKfa6FdFZo4WfOnOGTcHX4+Wow6FY\/Ub9+\/UuXLgkRWYNqAtnYrl07HR0dCLeaNWuiwz9\/\/hwKB+RDeHj4uHHjnJ2d0++\/vmvXLshMWnpJ0KkRQlD2QU08PT0hAAU\/z8CBA+3s7ASPxC8nX6gFxMmTJzEtYQ4Tz8TZBR0UnfvcuXPz58+H\/stEvLjj7t+\/HxZA8+bNMarhZXfv2Uu3V65coRANDY3ChQtj8jt9+jRF5REYFTY2NlSogoJCbt2mg\/xq1KgRjABjY2PkDKMnKirq+PHj9vb29EWrt2\/fYq4l9\/3792ESQfZhgvTy8goMDOzQoUP6WzhUK+SDVqJFoz9fz6zz4MGDHj16UEPBdqFvSv0kycnJEEN79+6FGx3mV56ORF6AgQzNgF53yq2riQkYHY8Ma0iYrVu3Tp069fz58xYWFtApMRxoa05aBEOr8wYPHpzrKma9evX4vs+BGT27agHAkC9VqhQOd3Bw6NWr1wx++2QyhGifInD58mWoO+lXS2CMaGtrN2vW7Pr167SdCUAL56CR6RCoIFA10r9mCdHNbsNI\/Hp+v1qA3iAePJs3by5WrBgU4Zwt4UFumNgwrTL1EyEE3DExMRs2bFi0aJF4Jd2dO3esrKwwKpo0afLp06clS5a4u7vTK7yYVhMSEmjM0Js5wjG5jVgtUFdXJ33lZ0CGHTt2bNWqFe1IOmrUKMpcT08Pvzg1at579+6xmRWFMvsbigL0KqQsWLAg7XlODUiI3Xk6j3KXjc+cOQhoMLT\/BPjJhSC44rdu3WKfYxGXIvEnQlfwxo0bGLA523QvPTdv3qTd2DBGYN1iUACo7zC4oXDDgvfw8GjRokVQUBA9j8OU5ufnBzkG2yN3t8Ni3R6ULVs2u7cVocez+6O01oo+9AAtCpaAmZnZ6NGjKSXkg4wUooZFeO3atYsXL169evVZs2bBbOAHTU5Gzb59+1ABCHy4ZXKAVIH6kuOcJX6SfHS3gBEXFwfrzdPTc8SIEbn7clpsbCx6m+AR5YlZoVu3bioqKhjMVapUWblyJZJBrLRs2RKx9I4ApAA0aLhPnTrFH82RW5MiDFamFmDmpuk5WznzpyKkh7AIDg6mr6sRvXv3pswZLi4u4lsg4rJwOCROSEgImgKCDyKAfWgqPeIDfzFkOaGqgj87ULVh9uG60+SR8YkgjP1J\/FFAIW7dujX7vhHIWV\/FUVCyYRxj7oQEGDt27MWLFxGI\/OllegA9e9WqVfDCwPjnn38MDAwiIiIgQFasWIE+xswejCOmeecMViKAsGKrhbICasIO79GjB2Z9Q0NDOFA9enqL3IyMjFB\/Sg++12LICpbDy5cv4RCCsgYypDxxrLm5eeZ3+75XukRekx\/VAuLx48fNmjUrWbIke5LHutTPg3wwGNhwXb9+Pd1Y68lvY0JgdrS2tqZ31ehrTAhZsGABZty2bdvSLUrwk7WiY6H92Nra0oiFZKFb91nPlq+CkBjaQPny5WVubMB8WbhwIX0UkahTp07fvn2h74u3hyI6dOhQq1YtctOG8L9yk9esAwmrr68PZY7eNc0ukPW9evWaM2eO4P8eaFf6k\/jTwLDCtIeJnLxZH1AMOuTmzZtOTk5t2rSR2fwberOlpeXatWvPnDkDE4KWB0FFoHv77u7umzZtggM2OiyN+fPnQ8jQOp4c1ISgeR1F4NfV1TVba5NRWxwFSJOGjmJiYgJviRIl2Pbn0dHRvr6+sCLIm0egGZ2dnelzJxL5kPyoFnBTXNqwOXHiBMzWoKCgHDxFywSmENy6datatWooAsr+rl27ZFYqIZxtx406YEzCgUkIY0lNTQ3Ww8\/f7Scgv9jdgoIFCyYkJAgR2eHRo0eYzjt27EhnwYBZg0FIqkYL\/nsnTAqEhYXRUxVabUfAaKhUqRJUH6gODg4O7GXifAgUIJzOhAkTBH92gGJHb1dSfwMUDnIosyXyE+yCTp8+HTNQjt8RuHLlCqx\/JgdIdLx69QrmAWSC2Ppv3rw5eiM9rQcBAQF0uxFcvnyZG9tychAyFJIzxGoByPo31SAZoOJ7eXnhKIwahEBTweGoj5aWVrt27RBCLYaGggJ0584dFpLrVKxYEToN3WnIoyIkfoZ8ercAfUXcXebNmweVtl+\/fuKv5pPjZ6B389iWSgTlTL+HDx\/G1EiCICoqChbD7t27Bw4cSGMSYArv1q3b06dPuSN\/goiICPpACMDQzcHZrVu3DmKI9v\/atm2bv7\/\/gAEDaC0PNKpGjRrxqbin8vRulRgo7zJbFj579gyqAyzpvN7n+CehndEg7wR\/loHpJlZ3cqU7SeQrxNeU3rnPwXIl6OseHh7sDSkC8xkmNlqKBC8VtHDhQsyv+vr6NOgARAcbd2fOnEFH9fHxqVy58qxZsygwB4gfIoDM1QKqGE6hQYMGtIIPGj8dCIWGPSx48OABTCPal4lBKwrzYlxgzNI6TbiRf14UIfGT5N+HCDLExMSMHj26dOnSkydPFoLSehUQ\/FkGczyUenRQdleQMklJSZHJDXMte15Aq3UKFSp05MiRpUuXampqQqfG7Fu4cOHu3buzGZSvUfaqRHsAEBlu75UhVMqbN2+6du3asGFDpjONHTsW+cAmgFQaN24chAKzdf4yVq9eTWcqFtA\/BF0IKiauteCX+A9w9uzZ2rVrHzp0SPBnjY0bN1pbWwueNE6dOgVDhdzU5a5cuQILAZo0Bi8bhtDOixQpAsfz589pqe\/cuXMhcFq0aNG7d29aC0wgE3b\/MnNk7haIN3AjkBVVicDsTs8O6DkgSoeycuzYMVtbW2NjY\/b0EIewNwvyAlartWvX6ujowDihcIn8iQJ1r\/wPxtWgQYOg9WMEVq1alVaxsuGRXSIjIzHHw9BHH6UQZNWhQ4dSpUrJ5El3COBYsGABlAA4YEPjWLgTEhLe8hsiYVKHGwbExIkT4+LikINMJj8Ew1VwiU4Kl4cc3wMpoaC0bNnS3t5+zZo1tF05wmHN2NjYQAIuXrw4Pj5+3bp1qDxOmY76m8CZ4hfCEToZhfyQ+fPnh4eHjx8\/XllZGZrBlctXTv\/v1K0bN8OehkW+fh35ivt7zf9BvicnJwuHSfyx8IKO+0AaVGTY9CtXrhQissCTJ0\/ow8pi3N3d27dvT24arQYGBtA5rl+\/DiMBw5CiKlWqpKqqijm4QoUK0FxdXFxu3rwJgbNs2TLIioEDBw4bNgwSIzExkZMX2ZEYOB01NTVdXV3M60KQCGS1c+fOLVu2fPjwwc\/Pb8+ePQhUUVHB7\/Hjx+vVqwdTB6oJqgeDB4HIDYcgN+7gPANFQBuA9YJLAKEqhErkT\/gh8wfA9E2Aabhy5cowhekBWI4R5wmmTJmC0SJ40qC1QqNGjaKtfurWrQsDAqo9zAK0Hno50kAWtGvXzsrKCkPL398fNgGmEzo8i2zYsIEuB\/Dw8Mji4TNmzGjevDl9qSUiIuLp06d0OiNGjICiwCfhsLS07NOnD4r4+Ycd+Y27d+9CPqLRVq9eLQRlCpSnTp06McsMbaKsqKSrpW2kb2BmbGJpZk5\/zg6O7gVdzUxMjx7JnTfcJH4vbKRjDkYHwHxM4T9k9uzZ0LAFz3d48OAB5vju3buTRc7KAhAa6JxUXIkSJTA3Q3uADIEkgSVQpkwZFptF2EMEOzu7smXL0mYbMkAqwnAyMzPz9vaG+lKgQAGkp22IMCVHR0dDmXj27Bm8dHOUasvqnEegLE9Pz169egl+iXzM71ELZDsg\/Nnvk5itAwMDMajYAj3q4gSFZE4myVgUhnrv3r0hHSgEqnfr1q0pateuXbAS2NZ7mpqa7969I1sEA2DWrFkyKwe5aqUhBKUhVgtgVdC+aTLJxAc+evQIKr+ioiJ7cfmff\/6BlCE31AL2UHP9+vVNmzYld4a3zSlbQgj6c4CAo49oZ74dPZ3apk2bkIy2YCIePnzY+p\/W\/7Ro2brVP\/+0bNWqRUu4O3XoUKK4t7aGpq+PT\/pXQvh2EiDvt7t5C\/9K5GcmT54MPZ4+P8hfSQ6KkiE8PNzIyIheH5ABfe\/06dP9+vVr0qQJe1sKsKwwBzs6Oq5YsQJuWo2ooKDQt2\/frl270sv6EB2wm4sXLz5p0iQ2Nr9XE4KpBdra2ubm5myDdv4MhAMrVqxIacaOHfv8+fPSpUtDGy7JQ59E+WWwWqGtaDUGhUvkc36bWiDb9zMbC98gPhbTMPT0oKAg8ZcYYQsyczBnUG\/GQD158iQmbPawEEDb9fLyQhSmW\/qwEAbn9evX9+\/fD\/FBq40qVaqEMQnjwN\/ff8mSJTKVocwFTxpitQDWCdtdh2KB+CjkCemAGa5gwYLQS1q2bAkxp6+v361bN0oAbQl6DBxhYWFonJs3b1J4eliezPHHsWDBAmo0mVWTMuzevbtx48ZM3yIoSoZ7d++5ObsY6xscP3YMXpaMDuFITetjcHNKARdCaST+FKC+16lThxYhcpfx+xIDY9PCwgKdZ\/To0Zj+165dO2rUKLhhkbdt23bdunXptW2EIH2FChXoIfrgwYMx90NSIR+27LFnz56qqqrwYuZGB4asYF8w5zrUd5BZcsjWFvC9UDhq5syZiILN8Pbt2y5dutC7yrBhEAhzJT4+Xpw4T2EFoRrOzs4UKJH\/+Z1qQc46JjuQ9exLly7BIIbqzd7iZVE5g+\/MXzCFpF+6fPToUV9fX9jlISEhkBEY9vXq1Uvi91zCrEzfCIiIiNDR0YFBgPpgGPv5+WFMQu48ffoUGWZYNygZ\/DDnMDEx+d72QbBvWrRogTFG64MCAgIaNGjw5MkT2ikdlgdEAOwbDP4HDx4gwbNnz9iNze8JPqgy9HAhLi5uyJAh2dog5fdCLYlqQz3C6f\/7778Unh40S\/369WWsQzQIfmV6IXQLvxIlVZWU16zinkpwCXiTkW4bSPzp0HUnN6ZhGPEHDhwgb4ZQB8AYGTFiBG0bijl+2LBhs2bNyvCRHNIDdMX+\/fsLQampGNETJkyArqCurk73Cfr16yfPLwyCG2KELSzo0aNH5i9SklqA9HQIexOB6gkw3q2trZWVlY2NjU1NTWvVqvXhwwfUXE1NjYZJ2bJlM9GBchFqCjh27twJecgWbkvkf36zWkB\/mZC5HcYGA4C9DtHft29fzMpC0E\/Acub7Ngfc0D9q164N61y8qaqHhwd9dgi6OVR+WmAMhd3b25uP5\/b9xmiEuaCiojJA9PFQMTD3kYbQ1tYW783M2Lp1q5WVFftUycuXLzHUyVyABaOvrw\/dYs2aNfS9Y2Z5AOEERG3FgICA1oJ86APnBQoUQBHIWYj+Qzh06BBOmTU4g06ZlqDTLR9qBzF8wq\/MmDZdQU6uSaPGgp9XxZwcnbp25j7Df\/zY8eZNm\/Xt3Sc+Lj4qKmrc6DEN69WfPVN43wx5ZdDEEvkPdunRKzDTZ6JQZgWZXgQvKeUMaNvQDFAQxubAgQP79OmDGZp9ehQh6L3QGKZMmYKU5cqVy\/DrbgSsESRmaoTMC4qnT5\/W09ODTtCoUaPXr18bGhpCM\/Dx8YEeQyILIqJdu3YyFc4jqJQzZ84YGBhktpGoRP7jl6oF6BaE4GchcAgB38DHZANMclOnTi1fvjzbrie7OWQCZpdBgwaxh3kE8seQgwVABa1YsWL48OEUBT2ADBH6bgrApFuyZEnxmGfVg8igNEBTU5O27WOxmIFat27t5uaGWHY4RpqnpyctToSwgP1B4Y6OjjVr1oR8WbJkyfnz5+mLBgC5sQzFwJKGHEHOVatWpfuZdIPhz2LevHn05XsGneyNGzfQGlnccTYyMtLd1c3EwPDK5SvwUg5hz8J0tXVGjRj5v5MnjQwMIY811TVaNm8RWJZ7WxU6hIaaOr2u9hmWqKQY\/GkkJiZizA4dOvRT2juudN1zF1oXfOrUKfSZxo0bi28JBAYGKioq0o4j4NixYxUrVhw\/fnxSUhLqBjtHbCTA1kcODCYN0MMxfiE6mjZtunjx4u3bt+NweitSQUGBbaXAoHPMi5OlPAHc796909XVTb9RikQ+5\/fcLYAmi56axBZ\/oQ99p3dGvY589vTZ87Dn4c\/D2d\/jh4\/o6TuDdUQAC6BXr17Qlw8ePEghPw8yp1vQYsSFkjslJaVJkyZ0d3HkyJFBQUFQUFxcXAICAuzt7d++fTthwgRo+lWqVJFRL9hXHAHGtvi9XugWXl5esDDu3LkDm+P69esU3r9\/\/wYNGpDb2toaRUyaNAl2M\/tiMjLZsWPHrFmzoKxkvj0wbA6Y2sbGxigIQipP32DOU9jlINAC0AloJ0qZqAzBxcI037aVsM3LZ8zyqanobwXMLdq1blOkcBF7W7uxo8c4Ozrp6+rhr0+v3sOHDtPR0q4YXIEOkfhDWbhw4fz58+lpYFa6Sg6AxPPz82MbHgAU1LVrVwz5YsWKsRByjBo1CiZEoUKFYPEzHSImJgZihKQEwdQCSDx4tbS04F62bBlETe\/evWGHoPMfPny4bdu20BtQAfDo0SPxKpxcP1lkyB5SVK5cGcoKuSX+IH61WoApEzOci5OzsYFhgH+Z8ePGZ7jqnoApHFKxkrWllaOdva1VgQIWlhDQ1lYFIJF9vH0wSIR0PMiBIO\/Fixcxa8IK\/8mXGGVg+QMqjkGB\/\/77L90wwJyEgWpnZ0dzPOZd+m7piBEj+BEtB1WAba5Snt\/El7CysiIVJDY2tmXLlgiBKQPvggULaHcUAofQImfk7+vryzZgoN3KWH0AdAJoSPR0Iz2UEr9btmxZv349Bf5xQBJx10B01pCDNWrUuHJFsPsJisqQ5JRkv1KltNU1jvEvJQpLCXm1wNXJ2dzYxMzE9PjRY0kJH6AW2BSw3r5V+AqtT3Fv\/1J+n7L5zRiJfAJ\/nbkLjeFGNwzyAszEGMu0sIDAGA8ODlZUVCxRooT460QAsguquZGREYYzrG0mJR4+fMgeHxC0EgjaP9y2trawKGbPng1xERYWpq2tTV9kwMCnb8AyIJSGDBlCcinXYe3ZsWPH4sWL0w7H4nCJ\/M8vVQsuXrjoaO+AflnQybl8QFlLE1P08ZZNm6ckZ7zfHLpR9y5dtdQ1HGztfIt7B5cPqhgUXLJECVjhMLuh2qOXUW8jhMNELF22rELFCiNGjhS\/K5hhytzizZs3MLihrXfv3h1nyl5KXrRoESxXOFJSUlxdXRs2bLh48WIXF5datWrNmDGD9hKhMY\/DkWz79u02Njb+\/v6WlpYWFhYwHaAujBkzhs+MW9Xo6OhIiwBQFiTaixcvOnXqBE3o2bNnGbZGJiIvTxvktwCRV6lSpcy3hiW4LsQ7oA1oqmtUrlDxI7+wnLUI1AInewczI+NNG7iX0KKiojzdPfxKlKRYULVKiJmh0Y1rwl2c\/yYZdrlcgfIVLpPwTwaIk7E\/pttlnY0bN9KXRflDs3dsJmCeJsue8sSYhSqP8Z7h404\/Pz8MeUyr6MCrV692c3Mj8+bq1auQD2KWLFkCQQFH\/\/79keeaNWvgRuJXr17BgSl5+fLlSkpK9K7W0aNHjxw5gt9+\/fpxB\/NbewlF5h50Ijgv5E+7I0j8cfxStWDdmrUwuUYMG\/78WVjC+\/d3b9+pVa26iqLizu07hRTpGDZkqJqK6vp162NiYj4kfkj+kAQ9mm5SofcJFiIP2Yt0FGDuuLi4kSNHVqpYke14I06WF\/Tt2zcgIAB6AJRlTOr0+B+D1sPDgzR0jHY9Pb3x48dj9EJv0NDQoFGqoKAASQEpUL9+fcgFEhnly5dv3rz51KlTkQBuGPTIBCOfLIwMzyWvTzCfc\/ny5aJFix4+fFjwZwrfabjmate2HVp\/7Zq1FM6AWmBTwLpIIU+ye6DVBQaU9SlanKlZ\/fv2U1FSPnVSdhva\/xR51+WQM+BeBhX89M83UBpycL\/0lxaYLehrIGzHfgr8SVg+5IiPjy9dujQmckzPJUqUoGeOXF352Js3byorK8MM4A7ggZQIDg7W1NSEMCFBIYP4rQfYGAYGBgMGDDA3N2\/atKmDg4N4TwVGnz59EAuNYefO78reHINTUFdXp9USdFISfxa\/VC2AYJV5\/ebi+QuK8gprVn\/zsSIxA\/r1N9Q3ePf2m+cFAL1NRg9AkODICEwVTZs0DQkJOfbtF4dzHVQpPDz8GP\/KO4aok5MTO+XWrVuPHTsWjUDfLHBxcaFwGP2Y4xHC7hDC0mWfNIRVgWEPC8bHxwcpoRbUqlULaaAZUAKAQhloFtmW+S9x8eJFMzMzel5DrZGVpnj18qWjvUMhd4+4WNnXw6AWWJpbVKsSwm6H1qlZq1gRL+RM3tUrVykrKp08wd2Z+M82O3jx4sW+vfvEu0X9MnKr2Vk+OAu4CQr5GSgT6jDoRfSxckzzEA70ZXDx3EzPEwcNGkReVoHBgwcjHCKCSQkC4ZSApTx79mzNmjWhGcP2YIuKuDNJA97p06dDRp05c+bUqVOUILeA4IJJs3DhQrhR1n9ZFv25\/IYlh+I+smnDRvTsVf+uFPzpaN60GWy1A\/v29+zRs16dug3q1W\/auMmhg9zDNuptV69cRfj5c9yOBY8ePNy5Y+fdO9wSs4\/JKUcOH963d69Y0O\/atSswMLBLly6YuYWg3EZmDIg3Dzlw4AAGTEBAQI0aNRo3buzt7c1mGjBp0iQ0BcY8VISqVauyl6YqVqx49OjRJk2aiB9MQkto164dZMf+\/fuZ2sGKZo7\/Gjdu3DAyMqK9rfhWF6DYDKHYpYuXKMjL9+rRk4Uwnj9\/bmRgOGzwELgpokGdus4OjpFpX8Zau3oN5PSkCRPhzrysv5vJEyYpysmzJbE\/T2xs7N49e5YvXbZl02Z6NyQTTp86BUV5zKjRI4eP6NiufbPGTTq0adu+dVuIizu3s7q6iOsroiuYW1eT8qHfpUuXYpjDiJ8\/f35kZGRUVFSbNm3c3d1JaRg5cqSzszN0hQoVhEWsdFRKSgp98YhEBDmUlZVXrlx59+7dcuXK0bs24gpXq1atZ0+uPxOIYsDbr18\/lEVRuUhiYqK9vX3z5s3JK5QnqpXEH8GvVQu4Fw64LoLeA0V12tRp9rZ2JkZG50Uv2YtJfJ9Q0reEtVUBKwtLVWUVOKwLWKupqOpq6+7csYPSTJ7EvfG\/dMnSI4ePFLC0UlJQLFzIc\/u27VAgVJSUcVT1qtViRDcbMMDGjBmDKXnChAns0wN53XEpf1otTN\/4B5j79+3bR26wdetWxM6bNy86OhrKPiRFy5YtZ8yYAeth1qxZlSpVYuYpA6bAqlWrpk6devjwYVq5+V\/m8ePH0Aly9tXa0Coh6Fd7du0W\/CI4tUDfYOyo0XBTL2nSqLGmmvqxo9wNIbBmFfcVx04dOsL9X5aAM6fP0FBWuXKJexPvJ9sBh+\/bu8+7WHEMZ5oD9XV0e3Tvkcy\/KZAhixcuwmDXVNdAeoW0P6Aop7B71y4h0W8Cp0ODF8LH0tLSy8uLvTZMoOviF2Pf1tb27du3zZo18\/PzoygAMVW6dOm2bdteuHDBzMyMPy3ugSOtKHz27Jm2tranpye1OWt5FxcXuuUgcy3IW7t27Q0bNlBILoKaQ3DRmw4y5eYiyJkyF\/\/mB\/JPTX6SX6oWUKsdO3rU1dnF2tIKsrWgk\/OhA9xrhBk2aOy7d0UKFTY2NIJCMH\/uvDfR0Rgzq\/9daaCn71ey1IdE7nYlhJGBju7oESMdbO0c7ewDSvtbmpmbG5toqKlXDAou7FFIWVGJ7VjHSsFYQg8uWbIkDa08hZULJUD8Ci8M\/Vq1asHx8ePHhQsXYuSL31rE0ELdihQpMmDAAEz8bJfT9OBwWAwZ7rn23yE8PNzCwmLs2LFwswbPIpjJTAyNihct9j6efynmm\/tZqWFPnxnq6bdu0erzp88U1brVP0ryCrvSJpvT\/zulranVvl178v634JuK2mvenLnqSsrH07SlnyH2XayttY2ygmLnjp0WL1o0b+68sv7cV4VmzRAW6KXnyeMn5qZmIZWrLFq4cNHCRfzfwtmzZu3ft19I8ftgHRIzsYqKSob7rUH71NHRodWOUG1hElD4hw8fMIWzT34EBASQWgB7gELAgwcPYOfUr19f8PPUrVu3WrVqgudbYIFANSGjKFsjJXMmT57s4OBAGg875bxAJue8K+g\/y69VCyBXU1O3bNpcyNXN3NDYQEvHx6voYf6JwOeMLm1sbKydja2GqvrabxcftGrRUkNd43\/801yoBYa6eg42tmZGxufPnN2xdZuRnj68C+cvwHy5ddNmJQWFiePGIyV6Dz3oYt3o0KFD0Mrpg2YUkhdQiUDshQOmw7Rp01BJGPo7duwgFRuI7wo0atSIfdEg\/bJelich4\/3vAGXR3t6+b9++5OUbOBtNsXb1WsjZUSOEe6oyakHk60gXR2eomOx9meFDhyH9ju3C\/aqYN2+NDQwb1vtGKP9X4JuK2mv+nLkaSionjuXC2h00NRp59cqvX8WMeh3p5uwSGFBW8Kfj8cNHUM6mTZ0m+PMl1atXpw+XiPsnuYcPH87uvcNiGT2auzsFZsyYwe72I5BXCeQWLVpEIUlJSWfOnCE3RJn4A7AwJJAy\/SvHy5cvd3NzIwskW8Mkc6CmqKqqipcykCOPCAsL69SpE21JIpHr\/BK1AD3k204SHxd3+dKlfr36wO6HoXY2rWfL8OnTJ2igtHpFgM9nykTuMfycWdzXgGBA6GhoWpqZk\/V26sRJDVW10SNHcelSU+\/euWuib1ClUmXypgfdd+7cuT4+Ph06dJC5s\/fbiYyMZHsmvnjxApXs2bMnvWmJapOKQ24+yX+U+Ph4d3f3jh25e\/g5AK0XFRmJPiazGFbM48ePw8O\/fqXiyOEjbq6ubC9IXIh58+bt3rXrT7wQOAvxtpufRW+xfvoouNHP0u\/eSPfqCDrxubPnqKuo0ixFBkDk69dbt2xFSnjEjfPwwcMpEyZ26dgpOkp2i7D0sAODyweVLvX11roM+\/bsVVFSnjd3Xkpy8u6du9avXbd54yZobIiiHFAlGBK3bt3ik3Nrj8hBJCd9fZ7IShQTHR3NFvdQGkDeH0IpMXILFizIKsCg2NWrV5NxAh0X\/Zm2T4ab3ZRCiJKSklgnAMizWLFiZcuWpa2US5cuPWDAAPZslJYr1a5de\/78+eiiU6dOLVWqVEBAAD2z+Hn4NuAqf+PGDRRE26hkzLdN9b2GkwnPIBmC+NCN\/KK0eXPnigNzCH8Kjx89HjdmbMXg4JBKlWdOnRb2NLNXK69dvVotJJT+QitXwSH4rVolpKSP70pqhJ+pTz7gNyw5FAMTTUFOvmXzr0puVti0foOygiJ6OtyLFixUlJfv0U34UsC923e0NTTZzcaE9wk+xb3Llgkg7\/cIDw9v2LChl5fX0qVLKYS6+++FbhuwsYdKTpw4kV5xZDoBc\/w3gQT09vZmX47OATlrPegigksEd53+qGvxMeVjYNlyFmbmUNMfPnhQqUJFf7\/S169dS0xInDZlKqJat2od\/pxbnPtZ9PnonTt2YLh5FS7So2u3vbv30FvCCJ87ey7UAtrlF8TFxoZW4b7rs22LsK3vm+g3C+bNr161mo2llZqSMv42rs\/48Ta3BklwcsA8WPXvSl0t7ZrVawhB6YAkUVdVQ+YB\/mXUlFVQrrycnG9x74v8YmQQHRllaWrWqEFDuA\/s21\/Cx7dqSOib6Ggo3IMHDfIrUXJg\/wExMe+4k8noIiYmJi5YsAB6ORkPORh327dvx3xPbvGxfIFf2Orjtm3btmvXjtwpKSkkBNDPacnhjBkzKIoRERFRq1YtLS0tKAHQEqBevBJ98XX9+vXQAzR4QkJCoB9QhrkICnVxcfne114y5HsNJxOeQTIE8aHoVEpy8rhw4sAcs33rdntbOzSvubGJqYEhHC4Ojie+\/87a\/Xv3C5hbGOjo6mnrWJpbONjaWVsVMDMxtS1gvWKZsMnsH81vUwtoYFy\/dl1PRzekchUK\/B6UmDFhLPfxoTn8t4Nn8ftmjB0t7PNz\/+49HQ0tCDXyAgg772LFaVvT9PBDUsgchk7FihXLlCmTxVfefw0kgMSDWVxnIHb\/p0CbwE6qUUOYKmSaJevk7EDxUXDQZWIhfwSY\/j09ChUr4nX86DFM84ryCtqaWgGl\/WH6YExBvVZRVKpTqzYmJ0r\/\/n1C2zZtNdU1VJWUnR2dME9rq2tMmih8wn\/u7DkaqmrQKuD+\/OlzqxYtMTEXL1qMtvS\/dfNW0SJesAHUVFShfKAIdWWVFWkbdaeHa9Ivn48fO9a7Z68aVauZGBg62dlnsnBh9MhRkCQGunpmJibNmzZbunhJxw4doaYU9Sz8gn\/t6NXLVxYmpv1699mxbbuWuoaGmjrSVwutWsavNE4WIh7TTL8+wnOo77Fz585\/\/vmHzPrsXuvp06e3b88tQOG7yTfHMi9semdn57dvv97kIPr3749K0m6nYliavXv3+vr6sk80cQWIDv\/AI3j4gSO4fhpobP7+\/uxlaXGh3wMpvpcoffj3UpJa0KVzZ8H\/42K\/z5cvZUqX0dLQHDRw0JXLVy5euDBi2HB9flb63hZw0VHR7i6u9tY227dtR2cIf\/4cisLVy1egXgsp\/nB+qVpw\/vz5J4+5F2kAdaDHjx5DyapcsRIFZg7rc7Vr1oKadoG3A2ZOn6EgJzd\/rrDT+L07d3FFO4jWf8EmMDIwvJbp53\/EvXnmzJkFCxZs0qSJzGfQQFY6fYb8zIEZgqgNGzbADvgvf64U9lNQUBC1BmAtk9dkWMqvKTp3wVThXbRYieLepXx8LUzN58yaHVw+yEBbB7Nmj27dDx44WMSjECbjqNfCR6X79eV2x4MJfmD\/gadPn06aMFFRXr5Pr94UO3XyFE01dchHuHt276GkoOjh5n6ff9gM8dqyeQuEwJrftXMXLO8H9+6bm5qx9RkZcvvObQM9fZSoo65hV8B688bMVgePHD5CUUHBysJyv+jtnuFDh0E1oVvNr1+9crS1q1ujZmFoQl5FFy9a7Orsoq+tY2ZkPHv6jO1btsIBlYgOzIR79+41bdp0z549gj8Ll54S1K1bt0ePHuQVH8Lcy5YtMzU1zfDx\/I4dO8aP5xZIZQ7TTQGFMIeYDANzRu3atZ2cnMjNF5ulnH+meCqC1AKh7yFAVG6GdcisYl9g\/d9jH7QkGtarb21Z4NV3viUbFRlpZ21TPSRU8P91\/FK1AFY7jBLxI3xYGBj2\/fsKX\/+T4X18fO1atReJ1xbwC55hrJQvE0BPN2dMm66hpEL72IP7d++Zm5iW8i3JbsrVq1MXBsrx7OxiBG29W7duGKKjR49mphLX5XnIK0MmUYwfJsgilM+bN28mTJiwefPmhISE56LvHfAV4RD8fykNGjQoU6YMu8oSOSAxIbGkj6+poZGOhuYmfi+8Lh0762ppbUq7t9+21T8aqqoH93MfAr1+9ZqZqVlBZ5fbtwRNFPO0krzC3j17yTtp4iQ9Le3bN29BJ1BXVfPyLHw9bUNo9FVHB0dM7beucx\/sICLCX3xv13MCWsuSxUuGDhpcppQfci5WuAhZAhkyeeIkS3OLzd++WARpYKCj26RhI7ijIqMKubpBD3C0s3\/4gLuBUbxIURtLqxNpdyAqlg9yL+j6Jvqbb7BlyOvXr1xu52oAAFUASURBVNu1a8feKqLJmNyZUKtWLVpUSMOToCgMYQgcNzc3NjmxqMuXL2e3k9OxzNJlWeUWXL35PBctWqSurs70mEyg9Ldu3ZoyefLrV9yGH5Der169+vxJuG+BSQEXiNyUPyBvYkICDmHfxqMPmJFaMGjgQLgpZWRk5ODBg+mD8uzYmJiY3bt2t2ndunixYuyNYlnSEotp2qhxAQsreoKWnujoaCsz82GDBj9+9GjO7DkzZ8ycNnXaRn5zdEClHz1yZM3qNbTIJi42FtXjI7negtOhlUzcSWZU+m\/nl6oF7du2gxIQVDYQo\/fK5StDhwzV19FzcnR89OiRkIInOTn5\/v37aD70G5sC1loammh3dL6bN24O6D9AX0cXY3t32r5g06ZMVVVQYs8v38fFly5RsnjRYmwsjR45SlVZ5dT\/sr2Z1\/\/+9z8Yo4ULFxZ\/jj3zq\/i92IiIiFzcVwCliG8Dwm7z8PBo0aIFbYyYRSH1R9Ma47x4cVpa9V843zwiJTm5fNlyOppagwYKe+r16Nbd0tScXtQEixYuUpCTp\/d7MY4weGfP5LaFIGG3YukyFUWl06e4d+rApAkTTQyNKgVX1NHShp4xhX+4QCmTkpJCqlTRUFFzd3ZpWLfenFmzxXMA\/w\/\/lwYCxdc05m1Mu9ZtlBQUy5cLFN8MF5OYmPguRvbLn48ePsLEX8LbB27M924uBY30DejbFklJyWUDAqBq8Ak5GjVoqKmucfL41wWYmYNJqFevXuwFokygc1mxYoW8vDxtq8yA1YFwd3f36tWrs2+\/sXPv2rVrqVKlxE2Rdbp3796wYcO82LeN6nPs2DF9fX2Zafh7UDeACYcudOvmraePn\/iX8jM3Nevaueuzp8+gRzraO9ha20wYNx5ZsdzQOIvmL4DmamFiZm9rh855I22zLAh8ZXmFkSNGkDf23bsqlSsj84njJ1AI5pS+ffp6uLnDJlRWVELnYVEyoDBxoY8fP14wbz60ybJlAphNKMP5c+etzC0C\/EojfxSqwC9kwUjp27sPSebkpGTYwHraOm+iojdv2Ojp7mFtVQA28J1bt6tXrWZnbePpUWj79u1IycrNV\/xSteB52PPaNWtpqqqpKChpqXMfAnBxcKIJW\/xWGMabjY0NzaNbN2+xsSqgKCcH4aWtrokLAC\/bhwC\/8+bORT7Dhnx96lajajU0OlML\/l2+Aglo57ssIr5UK1eutLOzg37AVp6nByrL4cOHUWKG13jbtm06OjrsM2g\/CYoANBcSCERXhvlSunTp\/ft\/\/1vaeU2PHj0gRtmLA5JakGM+pqQEli1nbmL64oXwnkWf3n3gZZbNubNnIVLpOxFQ4nW1dWjHQGrwtatXQy34X9rHIIYNHWagq4eZtXSJUrZWBSAKI15wL+hT4suXLtWtVdva3FJLVV1RTh4j9OIF7ut\/AkiS7hpS5ybJkPThQ6mSpXS1tDO8YcAO\/ZoH73ry6LGNhWWaWhDt7ODo6uTMHgDDfPdwdfvwQVh1NHvWbEweRw9\/88XzDGH9bdasWY0bN2at9z0oPexdNzc3BweHTZs2vXz58vLlyxMmTChUqJCvry99PgCwzgxFivY4p02HWIlZgRJfuHChRIkSmpqa4j3Tcovr169DxVm8eDHcKO7H1eMT9O\/T10hPf9eOneX8y0BxLOLhWcDC0qdoMSV5BVwauA31DZj9BvnfuGEjtIB9AWvY7kHlAtFtqoaE0pUltWD6NO59VJgHTRo1poUsj\/j7QNA8ihTypMmieZOmo4aP0FRTb1Rf+Ax9eqj+K5Ytr16tuoujE3SC4kW8zqTpu+lZvmy5oZ6+ib4BlM7Zs2YdPnRoz+7dlYIroIbr+cGSmJBY1LMwTm36lKl6WtoWpmaWpmb2NrYFnZzVVVShA8HWLVmqJBk2+ZBfveQQ3X737t29evbq3bPXuLHj2IjCZaGeFRH+AopYlUqVmab24P6DYUOH9undu3ev3qNGjpS5tRAR8aJvnz7iR+zQu11dXZlaAKMfs0i2HiLIEB8fD9XbzMysQ4cOTNkXjwT6IhmtRZAZIYiytLScNm0aesCPB8\/PAcuANjmAAJKxElB0Xpf+axg+fHiGa7IksgU1HLe2oFhxCxNTNqb69Omjr61z7YqgAWPKV1VW6dKJW9g1fOgwYwMjYR0+3\/KrV69SVVQ6d+YslzQ1tUO79roami2bt4iOih4+ZChEJMQ6vfHIrhQU6AP7D9SrW09DRbWMX+kkfkrO5Cp+Tv3yKe3YmtVrwPI7Lbrtx3dqAZkQyhQnoqOljTkD7ujIKMjloMDyVCho2riJm0tB5t25YyfUgp2ZLndIz65du8qUKUPbEAGu6O+DUVmjRg0lJSUIKFg+1apVE281SDUHcEPaqaioiPc3yxlTp04tUKBAht9pzC6sbpDMJiYm0Ico\/IfgGLoeM6ZNN9QzKOjsgul\/08ZNsJ51NbWghg4YOPDpk6d9e\/WGFJ2etvME7Q4SHFj+2lXuwcq5M2e01TXq1KpNsfQQYdmSJXC3+ae1soKiW0HX22kvf44eMRJaAhQC2uQNylbbNm1W88ZkelibVKpQESWiFGM9\/X69+1BghsyeMRP5FzC3OHSQ24uPuHXjlp6OTu2aNTH1JCcl+xb3drSzh0JQxLMwdNlWLVrCskUPXLp0KWY0f7\/SpsYmbKDlN36pWsAuQIZQ11nC3beUo4\/ZIySTQ7g4USy58Xvp0qWjR4+Ko+jGgzgki+AQdhRm3IoVK5qbm8+YMYPpHHTLCMa6qakpfdqfQsCdO3dCQ0ODgoLYnhs5qEDOWLRokba2dq9evcS3JX9Z6XnH5MmTbW1t6XPSf8Hp\/Eao7aAWFC3iBbuK7R8wePBgTOcrVwhPzTAHw6ypGloV7iGDBnMTleglnZ07dkAtYC8ZVgsJ1dfRvXeXe9L8IfGDfyk\/cVYy1KlREzbZ+bP8LWgKEnHs2LEqlSu\/5Xsviw0uH6Sno0uTBEESg\/p2xIsXN258XbhAQKGBoF+6mJs8Il9HWpqZd+vSlaJA82bNMSfd4z+hArZs3qIgJ3wXI4tQJ4RkwGQv3k4gc9CBITHS73VIuZFjx44dMPfJmzNYbk+ePGnYsCFt50qBLCrr4BAm2aAQQKyRO4vQvhcwx6Glqauq0QdEZs2chaszYpiwNQusc6h906dxKzZePA93sLN3cXLGDEqxhw4dUlNUat9WeHUTaoG6kjJ0iD69+6gpqxQr4nVV9NWMzh06Qu9cuXwFu+9FfO\/EufAv\/C4RO3cNHjjIycFRPU0bzpBTJ\/+HWX\/Lxq\/7WOAXo8mvZCkHOzv6Ck+5gLL6unrOjk704APDR0dTk61vGDZkKKa59WvXkTe\/8avVAkA3yphDiOP59OlT+XKBri4FE94nUBqAZJRSJj0f+RWKBUJ0bkDZAsGfmrpu3TrMTB4eHjIPBerXr09fTSSgnhcrVgyqOnkpn9ytW4Zw5\/\/lS3Jy8pYtW1ABWCSzZs1i5TLHnwjELnQy9kkY8UWRyC7UDyDIPD08KgYFs52Lli5Ziqlx3hx+lxhYt8\/DnewdQquEwL186TJENW7YKIW\/8\/kx5eOIocNUFRXpYxCgXJkAY32D62lz87mz50yMjO1t7SJfvd6+bXuPbt1fRgjrurn7ww0aQnDTC4fpOyUqgAmjZ\/ceMWm3hTABYM5o8J2tJJGgUYOGxoZGtJM6gEWLTHS1tD3c3ekO3+tXr81MTOkVRNInOrRrr6SgwL6usnP7DkUFBVh15M0KKBfAgTk+ODh42LBhmXdLSpw5SMMyyUr6TBBn9e4dt\/AixxniQDq2R48eSkpKzN7ICjiMGnzZ0mVKiood2rZDteCdMW06bG5arQLu37sPta\/tP63hXsE\/+RUuFr8u4dBBTi2gL5YBqAVGuvpuLgW5hSyaWmyPUQhZ\/C5fvhy6gp6Wto2lVbXQqsiNSszw9OnUgODntWEnO3tUhu0gmQF8rQAOZI3ctnUbW2vr2HexcNepVVtTXYN9qL1v7z4FzC3exwn7nRzcf0BFQXHDOtk9KPMJUFl+HfI8CgoKYocQx6OoqNisWbPxEyZoaHIrDyiWT\/uNgxC7AcUCnJUQJCLDwB8i5CjKE9M\/jANo302aNKldu\/bt27cpvHTp0sePH4cjLCwM4Xv27Fm\/fj2GEMUCykfw5BlUBKy6mjVrXrx4ccqUKStXrgwICNi3bx+L\/bOgll+7di0M2cOHD0Mno5A\/8VzyIZ8+f75+\/Xr4i3DyFvEqoqqiwprWwtLCzNw8Oioaima1GtW9inrB6KwQXKFqaNXAcuVmTJ+up6cPbfjVy5dInIREKSlyaePMx9enffv2j58+mTRhwulTp6bNmB4cFFSrZq3atWqXDyy\/YePGcuXL+5YogZTpL2SNmjVgbE2dPq1CUHBoSGjF8kED+vWzsrLqP3CAkIInPjauRfMWV65cQWdAJ38XE9O0adOa1WpAIlcMrtC1a1dNba35CxaYmJggMeQ3xPfVa9dQTXm+TFMzM8j0j58+8ZnJubu7m5qYfv70mbxZgTohOiQU1gMHDsA2hXIQFxdHselBeiSmDkwOQFEA1mqvXr1evHgBwSgTlTNQHJUIt66uLgW2atUKYgEGGHmzCGU1b968adOmQZjo6ekJEVmAbyPBgZZv3qIFRD+8ZmZmygqKrLmUlZS0tbWvXb8Od1JKMnRQZ2dnLoLvHzR96xsYcB45OW7mSE19ER4eGBjo4+Ozc+fO+fPnUxSAcJ63cEHVqlU1NDSOHj7ctnXrnj16IgscJKQQwZ8ZB2vzkn6latep8y4u9mVEBKXJAAWhYXEgrhccqB4GAnx8tFxiYiJOx780tysGQGK0eWxsLHm1dLQw2YWHC+Mu38E3hUS2oWcKWlpaPXv2RIc4dOhQqVKl5syZ4+bmhpEjJMofYE4NCQmpV6+e+FEl6sx+8zm7du0yMjKi7fP+iArnf9CIaEnIqfZt25UsUZK9M4wpFjIBZhx5QVBgeVjh4fwbsNeuXYPt5ezo5GTvWNyr6MZ165ctXmJoYEhGf++evQLLlosWveAXHRnlW9x7zMhRmLA7tu\/gVtBVS0NTSV7Bztq2ds1az55wz32\/d0FfhL\/o2K69q0tBrjgHx9o1at7k70MgNWZ34VWIZctR2438q5Vg+ZJlPsW9YeRB9hewsKpUsRJ9YIyKeB\/\/vmpIKPSSBH77cLBo4UIcviHtqwFJH5JQsaDy2bs9LsP48eO9vb3PnhXWW6BomRMUe8lNv69evSpcuLCxsXEmm3DnCrNnz4bZ0LhxY64ZeVUJv4SQ4ltY1K1bt9Bc4teysg7lsGzJUjXRPphXL1+BQc8eIqAqVSpVLl60GNwL5s\/HRaSnPzgYP+fOntXX0h46aDAXwm90q6ms0qt7j5Tk5Af37psaGZsYGad\/ihQREbFj6zaPgq76unqn0tbGpuftmzfcDY00ELJ75y5UYFvaUlAxlICg9ADuiBcR1lZW3sWKf0j8AOWypG8J6NSPHwqrdvr37aeiqLR1s\/D53JMnTqirqNaqUZO8+Q1JLcg2rB+AgwcP+vv7lylTpnr16hgzXl5e9MZOfgCVZHe3ACZXKAeNGjW6dOkShYhPJN9y9OhRAwMD2rf\/j6jwHwFryS+fPtP+H+R9+fIl5s7du9M+MP0Fsvvqjh07oEBQAvDu3bu3b96mJAkrgm9cvwHRTLHifQjSQpL5+8cc8fHx+\/ftW7duHSkZQNw\/xdCsD3BIzNu37M1D5MkexX1K+RhUtlwRT89Y0TyanJx8+tTplStXPn4kbPvPHcKfLsXSqiDe\/+X8+fMVgoK\/fqTgS+q+vftytsMpl6FQL04Lt7e3Zx8IYOGA3A8ePGjbti3tYs6AsaupqUnrCcSH5C6UMybLTZs2ybx9971C6RqhY5iYmNAXX3NMrx49NdU1Ll4U3kCBrW9qYDhoALf3ANGgXn17G9vYd7Eb1q2HCS5e5wFlrqCjE3uKtHjBQhUFRfZF\/mlTpykrKgUHBSfyOh+McgonJo2fAOE8kV\/QkJ7z585bmluwXQeINq3+UVJQpB070oM+z\/bVZfTt3QeljBzOvTOJMVW0iJeHm3skv0kDmDt7jgK3s5aw7d6Na9dNDI24FyvyJZJakG0wfgjBn5oaGsrt\/Q6yvuzoFyDUkkcI4t+3LFu2LKSSzAsd+RMIbkNDQ7ajnMy5SOQYNCLXlKLno+z3G0QBXPpvE4i9X92if1mgzIEE2amC51sQnj4KITgAczypEv87flJZXmEC\/3FUhPNhslA+zBxmgez3GzLOI0sgN\/HpwGx1cXHp0aOHTCnkpS8YwaKgQALKFm1KlkHFco\/0mb9584bd2\/gecXFx7u7uvr6+39tCPos0rN9AW1OLqQXhYc+tzMxr16gJpZNCkIDbY+bk\/+LexVpaWLo4OdOLJ1BK+vfrZ2JgWMLHl7TAgf36qyopHxG9TVqrWnUFOfkVy5Zfu3oVtZ07d+6dO3cSEhOhaTVv3ASm\/6KFGQvnSxcv6Wpp29nYrl+3Ljoq6umTp4MHDYZlX6VS5cSEjDeloA0YunfpSpcMv4MGDdLV1nFycKTbAx8SEgsX8izsWfhN2mLe40ePqSkpL5i3gLzoLaV8S0CPIW9+Q1ILsg2GFkHehQsXVqpUqVu3boGBgTo6Ov369WMbcrE0+YrExER0Ymdn5759+4rVajopIPh\/N7dv3zY2NqYvw+afWklkm5+4dBkeSuvXtm7Zgj58j3\/NJx92D8xkxYsXhwrOHtDwY4ur59SpUzGp0CvT9+\/fRxo2U\/56Ll26hMpAIAh+nqdPn1asWJE9c6xXr568vDx9gelnmnrMmDEoi2khYWFh1pZWnh6F2E4SnTp0RILdO7mPRk6dPAX2uomRsX8pP0y3uppaHq5uqopKq1euRGyvXr2Qcv++r9u0XLl0WUNNPbBsuSOHDsMBPcDWqoBP0WKmRsZwc4+3vv+5ztkzZnJfAFFQLOzu4WTvgJwLFy7Mdm+kU4ZKVLtWLXpA\/DIiolJQMJIVdHIuXbIUfuG2tirA9sJCYh8fHy0tLbaD\/vVr19TV1Ok9C8Lf39\/KyorWUOc3JLUg27CB8ezZM6gCRYsWJZ0xPDwc\/cDS0tLOzm7WrFnf2yHrN8KJpbTKY9KtXLmyo6PjnDlzktN21cjEgPvFPH782MzMjPZLAfmkVhL5AXQGurNN37Hk+nR+7R4tW7Y0NTVlWwFSPSdPnqyoqIhZFnIDiq+enh6bgX49sNQHDx6MWa1KlSoYdBS4efNmhJCuALMHblrAwU4hu9BRMNwhMNnTk9f8JrYFnV0S0nbV3LZlK2b0Y0eFnew3btgYUrmKV+EidWrVPnzw0P2794LLBy1awO2Ff\/Pmza5du9K+roxxY8cOGzL048ePRw4fadqkqV+Jkv4lS0Gr6Ne3P21jnEnlDx440KxJU9\/i3jDi+\/ftx954AtTZDu7fj3aYmfYFy9evXg\/s28\/Pt0TpEiVL+vhCobnKb0LA7sBNnzG9Ro0a795x3+SEl1btsA\/lg0aNGtna2tKHxPIbklqQQ5YsWaKtrf3PP\/+wJUJQCxo0aIApds2aNVAO3N3dd6bt0JxPoC5O3ZSALe7q6lqwYMG1a4UXaYA4wW8BlpaNjc2kScKn+fKPsiKRH0BnIMRecudDRo8ebWRkxN5VBjCaYSZidrS2ti5SpAg9zvu9p7B69Wpo4bBqYM\/AC31FR0enePHiCxYswGTG1lCjkjRHZhf+En09QfKCrZu3bNqwEQ4Kgil1+fJl8UIWwB4xMMSxmcDN0PgvrcJ8CRkdKApDYvGTta+kfmnRtFkBC0t6yfZrI\/Bpufg0KDkQ\/GmJY2NjR40adT1t82YAKfcb1cHMkdSCbIPpv379+qqqqrP5LzsD1g8aN25M+52hE\/Tq1Qs2AXRw2uZI3FF+I6yqDOgxkAUODg7BwcHpX1X49cTExDg5ObHPt6evsMR\/nD+lS7BKbtq0SVNTE9YtzRDt27dXUlJSVlb28fGhp3j54XTi4+NRQygBFSpUePz4cbly5eAGsO+FFDw5qyodxY6Fg8jQyxCHpI+VgSXgMso0KxkyTE+w8LDnYbraOm34PRVAhoekDwGUEgh+HhlvPkRSCzKDrihBITCvDQ0N3dzcZN44oAStWrXatYt7MEacOXPG19e3bdu2cLMc8idxcXHDhw+3sLCoVq0ae4OIP28BCslrEhISPD0927UT9jKTkPg7uH37NgZXUFBQRERE0aJFMd2in0dHf\/dp9+\/i4sWLZcqUUVdX19Dgdo4pVKjQf3yjcTrxyMjIOnXqXOKXgPwXmkJSC34ANyXy\/eD169dNmjTBUGnRokX6zyFSmjVr1gwZwu3DRV4C5jifRz7tTOJb9M+fP2\/ZsqWZmRlUGVowAcQJ8pRPnz75+fnVqFGDvHyb5dNGk5DILi9evChWrBiMCmVlZXNz82fPniEwf\/ZwDH\/uRoGcXO3awjcIcr+eafl9zTdfjnUZ6ceJpEyaAjH58iyyyy\/d5fAPBT1j69at7u7u27dvX758+bJlyzQ1NdF2QrQINTW1R48ewSHeM0tFRYWFcInyGaiY4JKTs7KyWrp06Z49e+7fvw9DYfDgwTDfkUCcJu+oVKkSmoiWO+XPtpKQyBnozxYWFt26dXvz5s3Hjx\/t7Oysra2FuHwDG3T29vb4xajfsWMHVISYmJhfIwHyEJwZ\/WUTXvgJopuMaArPgOxnnm+R1IIfgD4RHh7eunVrT0\/Py5cvN2\/enIWTgyAvOg0pAXBwvSktDTmYN1\/BV\/Obinl5eR09enTBggX79+8fPnw4xXIDgofS5Dr16tULCwvbu3cv7SRKtQIUKyHxJ0LjBb\/oybdv36bX6uA+ffo0vaaYr3o4Vebw4cOjRo0yNjamkH\/\/\/bdo0aK7du3ik3DwYoBD8OeMtPP+ev552hLInP6yCbWJ8CuXwYb9X6H8vxP5ZyGpBT8AvR96\/d27dzFaHB0dMx8MGEvs3gCF\/InQOWKePn\/+\/IABA9hNM5wUoNjcpU2bNhCUJ06c0NHRyYv8JSR+PdSTaeDcv3+\/TJkyFhYW0AwQEhISMnr06L59uU8BUeJ8wsWLF0NDQ4sUKXLnzh1FRcVWrVq9evUKNa9atWr79u3p+wV5JAQk8g+SWpAZ6P0Aw4B05x8OBktLy5cvX75\/\/17w\/5ngfOkRGhwGBgbMfL927VpiYiIclCy36NGjx6pVq44cOWJqavrDFpaQ+FOgkYJf6AQBAQEaGhr79+9v1KgRLIeNGzdevnx57969EyZw+\/LmE16\/fl2hQoWkpKSVK1caGhrCCgoPD9fT01uxYsWuXbt27Njh6upKtw1IJkj8rUhXNzMwpGlsM2S8MmC0PHnyJD4+XvD\/seA0aeTTPM03g\/z69etbtGiRnJzMJ+Gg2O\/N5VmZ40eMGDFnzpz\/\/e9\/zs7OrCyKkpD4o0F\/Rme+dOlS2bJl4SXFNzIyEuEfP360tbVFVM2aNSlxfuDNmzcxMTHjx4+3s7ODNzAw8NixY6gw3CEhIXfv3g0NDa1atSrCo6OjpXH6FyOpBT+Amw\/TBsAPR8LTp08xitTV1QX\/H0v6U4YsGzNmzOjRoxHC5vtMGoTSPH78uFevXrNnz05JSaFAeiTBJ5GbOHHi8OHDDx48WKxYMXiRWyYZSkj8WaAzQxXw9\/dXVFTE\/ArjG4GwyP38\/EhEqKiouLi48GnzBQULFrx48WK\/fv1ohJqbm79\/\/z4hIQFuhOjo6CxYsGDnzp1xcXHPnz\/nj5D4O5HUgtwkNjbWxsYG40fw\/0VALkDMwaaHLIMDpkPbtm0fPnyIqAzncgQCzPpTp04dMmQIPVihQAD3nDlzIIB2794dEBAg1hUkJP4OoO9WqlRJW1t77969mP7RyRF4\/vx5W1tbZWVlSpOvUFBQIAWdqFKlCn6vXbtGXhqhoaGhUB28vLzglcbs34qkFuQmsAw2btyI0fX3DRjM5SQIALwWFhaWlpZ169bt1q3b27dvKU16oEbgd8CAAQYGBnQg6QSzZs3q2rUr2opEDwVKSPxNTJs2TVNTc\/\/+\/R4eHvBSJ8coKFmyJB+fH+HHtyC7MHj19fWh05AXiGMl\/mKkNaUSOefx48dDhgx58eLFvHnzXF1d0ZdkJviFCxe2a9fu6NGjZcuWZbH9+\/efMGHC5s2ba9WqRckkJP4+bt68qaKiQpox4927d9ra2oqKioI\/X0KTAkbr+PHjNTQ0aFNkif8Oklog8bM8ePAAVoWhoSHcTC0gJeD+\/fsuLi69e\/emb8yDDh06zJ8\/f9u2bdWrV2fSh6IkJCTyCeKxKY3T\/xrSQwSJnEPywsnJycjIiEIYJEQsLS3V1NSgHFBgt27dFixYcOjQIegEFCIh8beC0UEI\/j+Zv+MsJLKIpBZI5BzM\/UzwwU2qAEhISEhKSoJDU1OzUqVKJ0+eDA8P79ix48yZM48cOVK+fHlKJj5EQuLv48\/t4TI1\/0PPQiJnSGqBxE8hIz6I2NjYbt26zZ8\/HxpDSEhITExM8eLFV69effjwYXqHW0Lir+evmUozHOMSfzHS2gKJPOHZs2cjR46MiIjQ09Nbt26drq7uqVOn3N3dEYUuJ0kZCQkJifyJpBZI5DLsmQJ+GzZsCJ0AjlKlSkEt4KIltUBCQkIiHyM9RJDITcQ6wYQJEw4dOtSmTZvy5cvfv39\/27Ztjx8\/ZrEAiSm9hISEhEQ+QbpbIJH7RERENGvW7Pz584sXL65Xr97p06f9\/PwsLCzU1NQCAgJGjBhRoEABJEPfk24bSEhISOQrpLsFErnM+vXr3dzcEhISbt68CZ0AIb6+vjY2Nt7e3ocPH46NjfXx8Rk9ejR9pFVCQkJCIl8hqQUSOYd\/CMBB3tevXzdu3Lhhw4adO3c+ffq0tbU1hSsqKrZo0eLkyZNWVlabN29evXr1mTNnHj16JC99uF1CQkIinyHJZYmc8+XLF0zt9CBg+fLl\/fr1U1VV\/ffff9O\/hXj79m13d\/eNGzfWqVOHQsTHSkhISEjkE6S7BRI5h+b1K1euBAcHt2zZskqVKrdu3aLPH8iom46Ojg4ODsuWLWNRCgpc35NJJiEhISHxe5HUAomcA51g8uTJRYsWvXfv3oEDBzDra2trsyhyECoqKj4+PsePH6ebBEw5kJCQkJDIV0hqQW6DyU5mvqOQv3QSfPbsWefOnW\/fvh0cHCwEpdMJSAMIDQ39+PHj8+fP4UYCBp8kn\/Ht9fqVV4\/K+mXF5T5pVf96Crl+Mr+giD+OX9AmyFCU57c+ngyCJP5IJLUgt8E0JzPTUUi+nP5+Esz3s3i0tLR+aP2rq6unpKRAgRD8EhISfxB\/qRCTSI+kFkjkHLEq8EO7Pzk5Gb+urq7kzdd8KwF\/pTz8lWXlCWm1\/3oWuX4+v6CIP45f2yYZWwAoUboQfwWSWpDLZGIyYxIlBP8fQiYVhiqQ9TMqV67cwoUL2VuL\/wXELSNuqO+1F0vw10hXdka5izhbrll5rzgwc2RSZu7968H5EoL\/+7A0pADI9NKs5CDxRyC9oJjLoDXFoyXmbUx8fJyJiamauhq8tOAOjnz6TD0d1D1kaisTCO9vP51Pnz7duHHD1dVVTY1r59wlMTFRQ0ND8GQHaqjLly6rq6u7unG3SdBQNN4ybC+kv3r1qqqyipuHe4Yt\/0eAmoNz587p6Oi4ubkhJNfPAvljKN29e9fCwkJPTw8hWSwCB5KDpUfIn9jIMqTKpcrLyX\/5\/PnK5Su6erqOTk4UIkSng7UDyFbTZZ7472hMCUktyCvOnj4zfvz4ly9exMfFGRobexQq1KdvX3sHe77B\/5ixk+E4p8CwsLA3b954eXnlB1lw8uTJ4AoVpkye3KlTJyHoJ6AhQae0adOm8WPHbd6y2cbWlg\/IKtQsz58\/9\/X2sbezP3r8mLKKMhfOx2bYXlBufLy95b6kHj12XEdfJxOxnm+h2Sg+Lt7Dw6OUX6m1a9cKEbnHl9QvCvIKb6LfFPLw6Ni50+DBg9HUKSkp58+fR2\/U0tIS0n0fmR4LDePMmTMuLi5GRkaIQkju9mfk+eTJk3fv3hUtWlQIym3ojN7FvCtWtChUpQOHDkITFeIygk4T0JkeOXzkXUyMvIK8lqZWUHAwHBQrhorYtXPn6lWr\/fz83r558\/Tp07jYWB1d3aSkJHMLi1GjR2toqCNH4QCJPxbpIUJesX\/\/\/p07d8DQVFfXeBMVtWjhggrBwf87+T9uHAoW4x8Aavv27dt79+5BdFIISYf4+PimTZsGBARcuXKFJMvv5crly8lJSdHR0YI\/97h27Ros+ITERMGfTZKSkzHZAxLEmV94NLKqssrLV6+i30RzveQPVNmpxkpKihqYlrJwyjmC62+Rka8T3r\/HH+eXl58zZ06ZMmUWLFjAJ\/gu4eHhr169kumxW7ZsKV269KhRowR\/bgOVpX79+hUqVAh7FiYE5Q2fP31SVlJ6\/fr1e75ZMoFaAL8PHz6sWb1GaEhI7bp1atWuDUfdOnWePnlKycSQ0IIE27Rhw4B+\/UaOHLFq5crt27ev\/PfftRvWb9q4MTY2VtIJ\/g4ktSD3ITmooqKiq627YfPmk2dPnzh9atr0GTAX2rdrFxkZyVmBacISov8L\/wczSwgSwYXzwM0cHPgXB\/B8+fZAChTFi2K\/dYr\/0v7hEA7jgXfenLllywS8ePGCi8J\/\/HoCRUVFKwtLD1d3XW0d\/iAOpEZlAP1+DeWdFMtFiUrgUwikJRQh6+cRBX49JFVOSUHRteDX9YxcKfhNa16+hfnwbxGH8PEckG1MvOFILU1NRdp8Ka00jjQn\/uX\/+Ej+3LjANHtUUV5BWVER0ySbiihzOkoGpMFZKKRyBjF5uURfOL9wwLeH8bXmkY35xo946kiCPw0+LC2KL4J3CskoA+b56hYhOhb\/cG4FvuUUFBRVVVTeREVDH+JOluXJA+2HHBnCFFAOUalpWfDNAnXtytXExARlJRUKtrOxdbCz10nbNkMGZItfzFu1a9bu3FG4n0TFwWFmauri7Gygpw83MgfCeeGPTi2tlWTgsxGBgHRhAIPF3c0N1VNSUqIQIRWfns9IdhQTFMQX9TUWLnGz8yFco8Ahj3ZXVISLmugz9Xrhfw7ueBG4Ov369tu2Y3ulSpXWrFq9ZvXqJo0bb966ZXSGGhKfJ1pYUVm5fsOGK1evXr5y5YpVK1esXrV8+fKdu3eZmplyNRO1lMyFxuGCK11NJPIVklqQt2hra2toaBgZG3fp1nX48OG37tzet2cvF8ENMQEFeXn8ZXjHmAvngZt+hRHFp2VRYoRATEuCU5TgWyf9CXwTJXjoWMiOt2\/ePH7EfxMZ\/3E1SMVJrVix4sjRI\/aODuJBDpMCR2Fu+Fou\/uWd+EFKLoqP5WTZt6QlFCHr5xEFskOQF+YhCF\/ex0FV5SpDVeFqzcGVzcOlSfebHoRyqSmNUBqPTHI6H\/7cxA3CkcpdR8GdBpet4JSFL0yIhGTFwdwfHfDtYVxKQjbmWz+XAaX6CmsKvm5cFZGM0sjWn0ecH0MI4Y79qukS8GGWUkBfIC+fJ+XPF8vBx3CwysAtDudI83H\/8kVQQFxc3OfUVFx0zpMqV7N2rWvXrv3zT2s+UhZqTxVllU8fU6CXC4FcnblprLS\/\/+XLVwYNGUzh38CfGncurBo8GTYRV0haMjHQBpYuW3b8xAkLSwshiOATc9lleFhaZnyBogR8T+YcVDfOy4enwRJz2cLJ+bkQpGTVhgPB0CFq1KwxYviIDZs2NmzcqGGjRouXLatbo9aOHTvu3r1LKb\/C54p5PvljSvFixZC4UWP84f9GzZs39yxcGFcbQocrk4c7Ig3uyLRCyS2Rn5HUgrwFcyp+aTR6+\/hoqmucPn2ajxHAOPnMp8mQz58+37h+fdTwER3atX\/75i0Sf5UA8nJfPn3Gv2SfEQkJCY8fP\/78+TMNv5g3byH1KOpb0fEVpBOOFw\/YL1zFkj58gL6vrqampKCQ\/OFDYmLix+QUhJOUUVJRVtNQZ4IGcFnx5aLaFEIkJyVDq0hJTobpDO+7tzGfUj6xCSNX4OY2eXllZe7hPYOrDOrHL\/Pk9lrma\/rhw4ewMO5eLlX17duYL5\/5jRfTGkoWPpmqqirnzigJFy3MasKJ824uWACzcppeIArNGK4EJEpLJ6+ocOf2nd27dgv+b8HVoafCgv870PVKSkoiL4EaJicnP3r0KCUF15S\/LjHv0F1Z5akWQkWEf2QREsNw\/cR1Oc6dBtdz1NUVFIWrjKjDRw5T54cblUlOSYGbpgpcHXp\/VRaZcr9WiMtfUU7e3sEebpoYNbW1WHHfgC4qL5eYkKiuoW5qYqKqrIxC4+PiEYOCKYmGpgYz5YGgRaGJ+EbjvHzB+Pfqlau4IpzCIzrZzEFxSE+LjhlCV+LzgAQQj2IZcIG+eSjANxeVjv4Gx\/dqglBU+9LFSwf276dkQIhK02yaNm06dNhQnDt5oSSW9CsV9SY6KjoKXgoU8yX1i6aaemFPzzfR0WtXr1m8cPGO7Ts+pnykWC7\/VLltW7eGPw\/nS5NPTEigcOLjx4\/koPQS+ZPcFM0SYviJAMPq67iKffcOc5K9vYPg59aoXxo2dFiVylUa1m8wa+YsElVEVGTU9KnTQqtUqVA+aMzo0evXrXv18iXC+WzlIM3HjBkTEhJSs3qNGdOmv337lj9IbsXyFb4+vq9fvQ5\/\/rxBvfrFihWrXq0ahigfKdQkJiZm8cJFw4cOw9+ihYuEGn4z\/FPlFeWPHz2GrJD\/oUOHjE1MZs+aVb5sudKlS1+4cAGjGqJqxvTpe\/fuhRuHUiZv3ryZOmVq7Zq1QipXHj92XNizZ5Td7l27inp53b1zFwpBi6bNvIsVqxAcdP\/efe7YtPZ59y52+dJlw4YMHT5s+Px58zBrUPj3ePrk6bixY0cOHzlk8BDMmirKymgZuhNLkwTOesK48TWqVa8aUnXypEloE\/6+gfyKFSuKeRW9eOFiREQErBzv4sWDg4IgOhHLZywLtBlVNbXI15EL5i+oWaNGjerVp02dFh8vXCmqP7J9cP\/B6JGjQnFFatTApcQUSwkgmPkzFOlzcnIvwl9MGD8BlcfVP3H8uBCaBn8OQvJnz8Lq1K7dvl07XDUKEXPm9OmKFSocOnjo1ctXE8dPHDp46Ly58yB5EcUaFiJ79sxZ9erUrRAU3LNHz61bt7LYffv2oSlu3LgRFxvbokWLYsWLBZUvT2Yil4DPAPP3+nXr0VVgU06ZNDn+289ho1XRtmiTqlWr4ozEz85hVmpqapIb7XPwwMEa1Wp07dIV7oT3CeXLBU6aMJG7Hnx\/RnuGVK4ybtw4FkKgCuxE0LumTZmK7jFkyJANGzZ8\/vwFupq9PacWoIDDBw+NHT3mfXxGz9Tl5TGUfIoXb96ocWRUFPKpVb2Gv59f\/br1MMpw3S9hGA4bxu4iEAf2H+jdu3eFihVb\/9P63xUrMHJRMUzPzZo2HTl8RML798uXLx86ZCguOt1IywQcuG\/v3rq16zzn9VGcEc4Qf+\/evZs+fTrCK1eqPGb0GJbP7Vu3BvQfADMg5m3MhLHjKgZXKOFTYueOHexYqPvohBjgIVWqoAL379\/\/2mR8GgAHykVWuDqdO3eJi42Dl8IJcTsD8p4\/d37BokUFXQq6OLlQOIMe7SgoKmppaq5bty4woGyzJk3atGtTr27doKCge2l3F65fu1andp0lixfDPXf2nFIlS7Vvy\/Xei+cvdOzQsWKFivPmzKWUEvkX6kMSuc6APn2N9PTDw8PJi3m0UYOGGmrqUAUoZM3qNUYGhrgE1lYFTIyM1VRUq4dWjX0XiyhYJEWLeEFl09bQDC4f5F\/KT1NdY8Wy5XTgls1bnBydcKCluYWFmbmaskq5smUx8BA1eeIkFLFqxb8YtLA\/nOwd1JVVWjVrwT\/l457zbdu6rZCHBwQAYvGnrKgUUqky5kg+4zT4B4IbN2xU5ZZH6JgZmzjZ2pkaGhnq6asoq2zbtg2xd2\/fwbElS5T4DPHMJU+FQCnh7YNamRib2BSw1lBRLVzIE7MaolatXKWkoLh+zdra1WsoysmhVhqqanVq1Uab8Iemnjxx0suzMIw\/VrEypf2PHT1Gsek5feqUnQ33XgAaDTkb6RmUKeVnaWZ+69YtSnD+7Dk3fp2BuakZmlddVS2gdJnI168RNX7cOIS3a90G0hYOO1tbWD+oDB2Ynl49epqZmBb2KITzRWvoaHFPr0NDQqGKIZZr19TUrVu2Othx85OVhSWuiKqySuWKlTD5IQoKnLmxSWCZgE8fP3LZcZU\/7enugcQ4X\/yiD2DOoCg0SCkfX5sCBR4\/fgxv5KvXuPRIM2r4SNjxlIZam9izc5e2ukZopcqF3NyRjMQ8hC80A6rYh8QPzZs0RaApLqKDo4qikpa65pLFS+jw9WvXKSsorlm1GqePYx0dHNBQUKRguFOCUyf\/5+9XGieOHOhOT+lSfvv27qNYzMRFCnlS5lwjq6gVcvN48uQJopISP7gWdG3WpCmlvHzpsqO9g4qSMuZ1eG9ev6mmrNq9S1e4qVse3H8A+dSuLXsVEEcngkkF3QlpcMXRCfV0dIt7FS1gbnH7pnDF+\/fth9inj7nS09O1cxcleQVdLW0bSyu7AtYGevq4lPa2dtBjEAvlGMeiU8FNxUE9xThCP7S1sUVZGqrqUA4QHh0V5WRn7120KMYXWgwJcCAq9ujhQ3ZshgwdPAQpZ8+cDTclwxj3K1UKgRj7ttY2aHk3V1e67ps3bkb4gL790BlQALqftqYWlABcVsQ+vP\/Alx9o6DkYBainh6sblDlEvYmKdnV2cXMpCBUHXtSqiEchJTl5iAX0n0yqB8ViyKDB0B1xHY0NjZYtXYpApE9\/SMcOHTDcNFXV3F0Kdu3SZemSpfXr1VdVUg6tEkJddMkiTiEYNWLk\/Hnz0T5oZ31dPaikOEcMVQg0VHjblq2Um0T+RFIL8oo6NWpiKj139mx0VPT2bdshbTFa2vDCBezft09HUwujevGixRi9N2\/cdC\/oGuhfJjExEbH169fDZN+0YaP\/\/e9\/KckpJ46fwFhdtXIloi5fvGhhbKqppgGT9OGDB5cvXoK4t7Gxec3PeTOmTcfk7WBji6loxfLlTx4\/Dgoo61XI82MyNwH\/7+RJ5IOB2rRJ06VLlkDPwOyFWvXt3QexX4Go\/vIFgxx25JUrV7p16aquqjpm5Ci4EUKy6c6t20b6BlWrhJDggOXtVaiwspw8xB8k1KOHj0p5++hp6Vy7eg2x0GNQK1cnZwsTU0xCqBUUIGtzC0x7iEW2dtY2OhqaEHyLFy5a+e9KzFIQKE0aNUZsel48D3dxcoYwhQC6evXq\/07+r3H9hgbaOhCIJFUfPnzo6lIQmseUyVPu37t35\/adEj6+mLCf83PAlImTkBg1QfvDiEQbVg6u4Ghn\/yriJZ\/9N\/Mu6NunD1LaWBVAYpzOtatXe3bvgUbr3LETnfvFc+fNjIx1NbXmz5338MHDs2fOQivCRXkX8w6xUAtMjYyrh4TymaXC3ISCgovbrHETXFDoHJCSMJ1hfSIWaoGPt7drwYKJHz7ExsZWCuIUl6aNGsPip8NRnrh6+\/fuQx\/T19bxcHOHIIZRW65sOcy+WzZtpgQjho1ADq1btb537x6mirOnz6BvBAcFU+yOrduNcV2cXTCvr1i+AjN6zeo1oNa8esk1xdMnTxGlqqhUq0bNqVOmbli3HlcEKgKpUDBtnR0cccWHDx127+69Rw8elipREl3i5s2biIXVjmtEagH6jFfhIpjeYM3DC1au+FdRXn7E0GFw0+ns3rEL03bTpoIaIUNiQiLURC0NzXFjxnKX4No19EldDU1bqwK3bnDFgd49e6H0Z0+eklcMLhOuxeXLl9FbkI9PseKXeJ49FRJDWYEmd+7MWfLOmD4DGlsRz8KbNm5Ej0Ij6+vo\/tPqH0S9iX5TxN3DxMAQ17Rt6zZrVq3q0K49Grxd67Z07PcYM3oMLgSmZ\/LiWpT08UXIwAEDMF6ePH6CimlqaJ47dw6xu3buMjYwxGXF1Ltx\/QYoEAWdXdCe8XFxqEAp3xK4KAP79UfHxlWoU7MWUl66fBkHQtS4ODp5Fy0G96tXr0p6+6DZ27RsRSrp5y+f8ZuepKQkn+LeqIy6iqqxvsHIYcMpHO1GPZwBLRMp0XsrBVcMe\/pMCE1NbVCnLtSagwcOwr108RKozt7FikMbqFyhEroixgKsGgxJDG20ALpQw\/oN6ECJ\/ImkFuQJmDuDypYzMTSCMers5IyRgL+mjZvExcUhFnMDrA3Y07t37qL0169dN9DVa9WsOdwYpd7FvWEBPHrwgGLBS37SQrb1atdRV1aZOX0GhX9ISISdWqd2HVLVIdH0tLTxhzmMEjRp2Mje2gZzHhKEVK6ipqg0e+YsigLLly6DOBgycJDgT0MsDiaOn4A0UCMEP8\/d23dQyrBB3CvjoE+v3rAl+\/XsTV4A872oZ+G30W\/ghlqgr6MHu3bSuAkU279vX8xnZKs1a9oMx86dxRlSxJFDhyGXe3TtJvi\/Zdb0GVAa1q9ZK\/jRLMkfvTwKFfcq9o6\/ZdK+XXtUeNKEiRQbHxsHkVrQyfntG64yUAsgRqGmYD6jBI3qN1BTUkah5P1GEKamDhowEBPSwX37BT\/48qVGaFUzY5OIFy8+f\/4MhQ+XcsHceRQZ8zamgIVl3dp1EAUv1AJ0g4b16lPs8mXLcLJQ+MgLMLtoq2veuHYdbqgFvsV9MCFdOH++Zo2amipqzRo1pmoTqJu4epix0KqlS5SEpkUhZ06dhj7Ultc+3755CyUgwL8M1SQmJmbiuPGkfvFpU3ds226kp6+lrjF61GgKwclicn3yiMsNEy0mlc7tO+B8KRYTJ6bPxg0boXv06tZdSUEBFi1FAf+Spcr4lUbvhTsuNs7Z0Qma08WLF90KumKeGJbW2gDKKy7QqOEj4KaetnfXbhUFxSZNmvDxX6HYrZu3oD\/MmzOXAokGdesZ6uoxtQAnBav6mWiuYog7c5VKVdwLutGNHEbHtu201NRJLQh\/Hu5k72BpZn7z+g2KPX70GKzhWTNnwh0VGYWpuoCZORu5Xz5\/KVbECyf7MiKCQjIEKhFOecqkyeQdOngw2rZb5y7kBVANXZydoV7DDbUAVjXshIf378P76eMn2A9lywTADcUI+fTv05c7hsfPt0QBc4uw58\/hfhMVXdDRya9ESehAweXL66hrtGjSNJZXT9EI4nYQg+6xd8+e8WPHQbZgVCI3aIFC3LckJyXXq1O3pG8J1s6U446t2xTlFeio48eOW1sVwBUvWsQL+iUUMlyXoMDydEMFloCttQ10IP44iXwKd2NQItf59Pkz5n4dHR1XV1drG+tGTRrv2LXz31Ur6bvDMGevXLpUo1atKqEhlB5jJib2XSr\/eE9JSQk2PUwZmNSN6zeYNmVKzNu3ZuZmiIIxevToUV9f3y7duvLHyX1ITvqUklLAykpRURFeGGGQy0WLFu3QqSMl+PzlS8KHDwkJCTFv3l44f6FK1aqdunRGOK49fpOTklQUlbx9uHuSYsTPHaGL4Df9U1vkbGxsDAcmwgP79tnZ2vUZNICikHnSxxQjY2N9QwN438fHp3xMcXByatm6FSWAJMJM9SX1C6yfk8eOlQ0o26ZdO4RTrRISE1EB\/zJl+LTfgARbtmzxK1Wqdt06QhC3+FFJXQuzmzoaHNL50MGDhT0KdegotMCHpCSUpqOrq6wsvMyWnJxsbWfbq09v8n76IqzQJL66eFRUVNRUVQvy7zigcvTMNqhixeg30bDznj17dvLkyRKlSrXtwOkiAE36+dMnyD5ukSNI5RaUmZpxlw+VP3r0mIamVkfRnkv+\/v6JSYmPHgvPlVWUlBJi46AqHdy\/z8zUdMiwYfoGBtQsAHUTL1JQUFRMTkmBJWlrZ0chFpaWhoZGsIvhPnHyRNiL8D59+qQkJ2NOhTXfd0D\/wl5eo0YLr5+9T3iflJxs7+jQtl1bCoHuKPflC9LDfezYMXc39xGjR+N8qQLQur58+lzEy+tjysfde\/Y4OToNGDSIP457jTPl40dDA4O0tZmp2pqaF86da9G0WdjTp1aWlt26d+ODuci0f3io5fkLQA9oAIum63L8+HE0QkgIN1hYUxTxKprEL1oEnz99joqKpiGQHvHFVZCXexf7Ljyc+4wn482bN9zF4lNdu3oNOlbjJk3cC3lQSU+ePMYVxNwMN63sQV8KLF+ej+TW6BUsWPBVRMTrV68pJEMU+fWMVA9Ihr179lpZWPYb0J8P4PiYkmJiZGxkZAQ3kqEXdenaFUMG56ugqLDi3xXjJ06Ij4vfsWOHvY1t1x7d6ajEhMQPiYka6ur0Ai3qp6SiEhUVBXP89KnTVgUKjJ84UUdPFzFcI4jaAdlSS3L5KyhUqlwZlVm\/aeOMWbMwOqZPm0ZbFwgLTPDDG5AqqirLViw\/dOQwZBoF04+rm5umhgbtIQGJp6qiYmttvWbtWnT76OjolKSk0n5+9g7cmipjUxN3d3ecLPd2pRi+CIl8gqQW5AkYf5iJixUrBul58ODB5cuXV6rE3a6noXju7NmY99w2cHxaDjNTM8hEzF5wQ7qNHjs6tGrV+IQESIGevXuHhoZCVCEKwwmTXGmZ+VJeHnYAOeMxAX\/6WL1GDUxmFAIgMrS0tM6cOYOZrFChQgjBfEwy4umzZ+pqao6OjnzCjCGpSnWTAZoBfiFHYNFCFzEw4JQAAvOEUtp7AZg7kaZ69eqGvNTj4NaGy2lqal6\/fu358+dOTk5KyiQ3ubLOnzuHUrV1vu6IICY2NtbcwpzkLIG6QQ9DI8grKERGRsHkKuTpqaklrHcDsMItLSxp\/zuczoeU5CpVqshshyeePMRoaGoiZ5opGZiw0Yjnz52HsQhpWIp\/SEwXlzsDONIyw7+oHulPmIZv3rhhYW4OMUqxAHWDyfXg\/j24cfqYA2LjYjFRlShRMj7h\/dAhQ7jz+k7duOfsyspoW8GPipmZOTg6wDaEOyoyUktTC41ZLqBcx86dUL0J4yegQzo6cQtTQNizMCiRVUOronpC5YG8PK7Lg\/sPnj59WrhwYQNesSPexsSgHt7e3qgozgVnra2jTYdhduSWfKb1Q0yjSoqK9+\/ffx8X51W0aNizZ+P5e050HpjG8O\/XEnngyXBjPnQkKF7oXQX4qYgL4X\/j4mK5SZrPEG0YG\/vue4tGxaCHJCZ+eM8vj2ck8ssJqZFPnDiOTAMDy\/ExXFFm5ubKSujJnFtdQwNtBQUIo5uL5k+hWPHi6HyKGb4EkQYUJhaNNo+Kji5SpIgJelEayAqXki9IyLag6KNiUJFhDLx+9Qr2g6WVpWnagWgB2BLoyazpMMfHvIPm887H1zcyMnL48OFCe2UECqKzZtRv2KBhw4YRL8JPnfwf56dj05IgvQaP4E+DG3uI46uN\/CCFqlat5lKQFi2mws7hnu6l6QGQb2FhYffucR3+Kz++dBK\/DkktyCswUsT78zOJCWCi4ZfmVBpLHp6FrKysOFuNB5J0zfp1x06eWLdxY5NGja9eudqrR0\/MLhhgGH6GhtxCRYHUVMyICCcfBpuejm7ZwEDyAgx7GJQoMfrNmy9ynGXABZJ8\/iJ36tQpZRUV5MCnzRhtbe3MxyyKwDno6+t\/TZYqvJlJoFaoITOwCDQI0pAsoRcLOdOEz+LmrVvIU+YtR4JLD\/v7syBi6B9MSZiEIKlhxaIgnKNgs\/Jg7oTcjH8f\/\/ETd9sDlp+aimr5wK+VyVDjYQh2GA9qR+fI7RQrL+\/p6UmnSbM+gQskviJ0AJ0gTvkj\/wYgf9ICXIXlFRwceM1MPhW9QkFRceKkidt27MDMsWnDhmVLlvIJ0\/jaytydDK4gUW4fP35MTEykzqasrAL9YNrUqTExbyeOn3D85Im+\/fpiIqeU4N7du2i3QFFvAaRShD9\/\/ubtG2Z\/o8743b9\/P6ZeJIAX84DBN\/0QzfiF6Wrv3r2Li4+Hmjhn3rzVa9c4ODrOmzsXOi7FWtvYcG8JkoeQ5xa6c9pqevjG4tqZP038Tw1A755QD6BnoZgh+ZjMQApOhxR1TsAdLNjF3Hs6yIbc9I+NnZ2SqgqFoF\/p6Op+Sesw1CzQU3HRP3\/vBVceZ2dndVU1uvFGHUDfwEB8ewN9BlM01YI\/jVR6N5Lg6sdXhz\/26+BSVlWBIgi1RjgjPgoqwszZs7dt3w79b8mSJZs2buLTfgPVnH6BkD\/\/6+fv\/zk19VmY8BqRAKeApaVOg\/NyR8hduHD+fWIC3Qq9d\/fe+\/fvmYoGRQqSARKAu0PAA6UzOjr65atX5OUz4JHJXeL3IakFeQIGGDeG+GGW5uVkAY1DNzc3zEwf+P10KURLWwsinm5RMmxtbUNCQ1auXlWyZMmjx46FPw9X5dNcuHBBSCEnp6enB7lw5\/ZtkgtRUVGYJ8RWFwqF2IIBXdDFBbYIDD4EUqHbtm27efMmBjMkLJ82Y1CEYlrFkBsgNwOyDPPB9evXmeoDoeDk5PTo0aOYt1xxEFtcqOhAzNzx79\/fuXNHX98AUya9YEmm34G9+86cOmVjY2NVwIpP+w2oub6B\/tWrVyLCuV0XqVooDhKWn4rioASgBWhPRkJXVxcG7sOHD2GlwQtDTV1NTfwhRwP+fRCS0bLnxp8dzusbCylV7uCBA3q6urgunOyWl7948SKCqVWhtEHDu3HjhljboEbT1tJ2d3fDxMPebwTh4eFoAUyccMOieh8fXyYgoHmLFppampOnTDE1MxsyaNDtW7cpMXIR1xCTOlqS3ZUBMMvu3b9nzN+VSUlOTkh437lz5\/MXL\/Tp19fExITSoDM8498dRQ9Endm7+wC5xSW8v3rtGjQeczNzVFWIkJO7dfPW8ePH0bVInUUjX7lyGS0j9Ax5OeT\/PCwsLpZ7g\/HJkydPw8LKBQZWqRpawNp6zLixKGvE8OHRUdzb8C6urhqaWtRb6HANdY0MOhaPvKJCGX\/\/c+fOXbp0CV42RlL4aYbaHKeANuTn1Azz+ArSo1wqmqHIvWohHFgusBwqgiEDN2VOjzagBuFXQVGBu3uUym18CS9x9NhR6J1qal810fSgS0Cl+EADgW+9a9euid\/CdXFxefrkyau0yZIvnD+1NODGhKqto4PLSlomQKctXdo\/MiqKFA70M0zJFStUqFuvro6uzsTJk3R0dPr06f30aUabGcvL37p1q3bt2lcuC\/uX0+\/z8HB0CHQAFsJAy9y8fvMFP\/QIJIA6vmL5Ch1tbXoW+fDBg4QPXL+iBKampo6OjtwNrbSQcuW4FqbbmXBQKByAd0r8fiS1IE\/AqPh6H5n3EtT13d3cMXls376dvee9Y\/uOly9f3r9\/PzkpmXtw0LPny5eCgIiOiqZlXJiBjExMoCscPnz49P9OUey1q9cgETAJUXoaWWKpZ2FhgXJxrE8JXzdX100bN65dvebWzZvr163r378fxAqkOQwXpPzesOTsUZix38aSWUOBsAag6CDPjes38JFyz548iXv37mVExO3b\/HyWpg8xMP2kfPoIaVXEq0hhT88TJ06sX7ceOsqG9et7du+O2lpaWECxEFKLQD5NmzV79ORxhw4dIl5EIASNA4MYWaEd3r55a2Nt7Vm48JUrV44dOUqH3LxxE9XALELpMat9rQxf\/4AAblEeNCq4v6klD6ZNWGA7d+yIiuQSwNDp3q3b+s2bGjZurGegj2nb3t7+6NGjZ8+cpfQ3rl9Heghc2mcCVULmVCLOGppEVHTUsKFDE95zd6EP7N8\/ZcoUX19fB0fuySuuNTQGdqujUJHC3Xv2hNAfOnToR37HGNnqycurKKugIEh22MAPHzwcPHhwXFx8g4YNEYmydHT1zl+48Pr11zfyMb9CLrfnV0KQQkAXkWoIPePj58\/QGwyNjYoXL3b4yOGJEybiuhw6dKhd27ZJiYmYZrS1tdAlcNZnz57dtXMXjgKPHjyMjYuF7nXvHvf+OlS0D8lJLP+Q0NBu3bpdvnKFVsxxG2GpqR04cOA+\/60N5I+sON2U72Lf9DTeWSUk5Evqly5duty9c4cL+5K6cd36tWvWQKNFkyIE3VhNVRUHfnNshvBjUOb+EKdScNofd6yNjS28y5ctpyflYPMmzto+efIEeXHuySkpGIO4UjFv344ZNfr8ufMBZQOcnJwR+70KQJPAgVDa4EYbootisG9cv55iuXszb95ERkai23D+bwcLw8LSwsfbG2kwWCjk2dOnuEZow0cPH8H7LjYWY4eevqEm\/mXKdOjYAXb\/6JGj6N6bTOVwobds2fJPy5ZM79y\/b\/\/UyZMdHBzpq07fnI68XGLih7p1ageXD2LpUe22rdscOnK4YsWK6G8ISYSwoji+OFwaiBeMvk+kuPC31lBhaA9ws5EIx4+vncQvAxdDIteBWWBjaVU33dvwGA8AE9ig\/gOU5OQLubpVqVgpKLC8ob6BsYGhtobmoQMHB\/TnFu55unsgqnKlyl6ehZGySsXKHxI\/IIexY8ZCEDrZ2SO2QvkgCxNTc2MTbXUNWqfdptU\/mqpqGLRcWfgvNXXDuvUKcvJLFi2Ge+H8BWrKKkhcwMISmQSXCyzlWyK0chVUiaVPz8zpM1CfCePGw40UlPjGtetc4NhxfJLUVStXqikqmZuYVq5YqVJwBXtrG2N+iXuP7j0Q27J5CyQ+fPAQJQbr1qxBrRYsWAA3aqitqaWmoopawWCvUqFi1cpVSnj7fP4ovKkvw\/v491UqV0aGaL0KgeX9fEuoq6gaGhiiDWld+mL+NXTkxlcm2NrC0khPH80yesRIxI4ZOUpVUenqlatw07ls2bwFrdGNf40+PZMnTkJVcXaFPQqVDyhbxINbnIFL9iY6mhIMGzoMIbgiIbgiQcFmJqZmRsZaaurz589H7B5+4sTkQYkhRn2KeysrKPqX8sMVpN0goMFQLFQrfW2d2jVrkRdAmlesUBE5HD18RAgSceH8BTQ1isNfmVJ+jrbcwsPAsuVoTwUwfdp0yF1rSyuI8iqVKpcvF4hWgiYxbz733kQbfqtgzASUGGzasBGdbc5s7q2Q\/fv3G+jpqyqroCVVlJSLeBYJrVTZ082dXitdsWKFsqISOnnlChVx1tZWBXAu6FqD+bdaNm7YiJwbi164eP3qlUdBV3VllXNnz2GSqFOzFpTNgk7OAf5lrMwtcCCuUTP+BUVuhNAxov6GbJGhva0dWr5MaX90GENdPQMdXXoj4NPnz+XLBmqqazz5zr4FDPR2VPvE8eOCn6denbrInPYtgJbZvHFTFXmFkt4+ON+ypf31tLQtTM1MjYwvnLuABM2bNtPT1dPX0fUpWqxY4SLIDd3+zOkziOJq\/rXu3wCNzdLE1K9ESdj68G7euEldSRkjF61XObgCOg9OB+OlXbt2iMVJ4Srs2yPsZiFm767dWqrquNwYZegYDrZ2eto6aL0O7doj9tqVqxhHHdt3gJtqAjO9dImSKgpKaHYuEP+LQJp2bdpi0DnZ2qNhywcGojfyrbpTSJHKLezw9faZN3sO3J8+fR46hNuAwcXBsVqVkGqhoUWLeCnKK7i5FETXpfSrVq5Cgv69uXclqLjmTZriTO\/cvsP7MPa5j2q25yv8Ijy8WkjVhvUbsNEkkR\/gdG2JXAcGBywkPz9uL5r0wG4YOmzYoEGDYInCaIh48aJ3nz6Lly7V0tG+eOlS125dIa9h0Jw8ceLI4cPv379v1rz5tOnT1NTVcMH69OkzZsxYXV1dHPj8+fP6DRps2LTRw8PjOL9ZHiSVuYVF2mpw7gfT5Rc57s1GuNu0a7tq1aqSpUpBYW\/Tus3CxYthoqEypLPTPfz0GJuYqKup29JnhdPsfhguLZo19\/Hl3r0GjZs0mbtgASzIh\/fvwyRCEes3bYQBcfr0adQ5KDjIpoC1ju7XJYSwlvBLWdWtX2\/tunXly5c3NDJq1LjJ7LlzjYyMYJAJtxfToamluXz5in69+8BSfPLkSey7WNiRs2fP8vLygh2GBGiu6VOnWVhawiJ5\/PgJbM21G9YXKVKEdt5F5lZWVurCTrRcGbB\/vwg3RTIAp1+1alVY7bimcXFxikpK0NvWbViPhiXrZsDAAaNGjNTV07t3735YWFjDRg1x7i4FC0KeItbWzs7L05OWYaMpDAwMli1fHlo19Pbt28eOHkUllyxdGlCuLJ+TnKOjU+nS\/iVLluAS8yEKigp9+\/Yp6OwiXmL5FXnumTTyRHFJycl6enpdO3dZ\/u8KfX19lIX4bt27rV612sHBAfbo3Xt3X758WblK5QMHD9A7nOXKlcN0Ll5tUMjTkzNV+etSoUKFTZs3h1SpbGxkFBISsnLVvyYmJgryCrq6eoht1qzZ7FmzLMzN0chPnzwJKl9+09Yt5YOCzpw5g9jixYthLikTEAA3aoKqmJiaopO7e3ig66IlJ02dggGCK\/gyIgLdpnadOgmJiXQJmAUJ4KIbXyNHjZo0cSJO8MnTp69fv65bt878BQvQi2jdqKKCQsdOHdu2bSde5JEh6hoajk4w7DnLntGufXtMpc4uXCDGzvSZ05s2axYXH3\/n7t337xNmzpo1ZcoUtHPES+HmuaqKiqenJ3cvRF4+NDQUA7BEyRJ0\/0xceVnk5TGo6brUqlMbow8VeQgePSpavPj6jRvRzaDnIQGa5ZNcqmpGTyUqhVRZuHgRTgGjDIf6+vquW7++bLly3GOsVK6zlShRAl2dEmNWVlFR6dm7N05NId16TBSE2k6fOWPypMn6BvphT5+GPX1W2NMTfbtKaCh1P3D+3LlzF86f5TdUUFRUGDxkyOQJE1VUVdF7Dx44GBcf16x5sy3btrq5u9MhZcuVdXd10zPgvjtFwEZ6HRX59u0b8mL04ZfaAeNlx+6d27ZtexnB3VqTyC\/g8kj8LhISEp49e0abGQDM9LQ9GYDBBzNux44dL168oBAxSR8+4EDa2RA8D3v+7OlT6P7JySmRkVGczcLbCvjFmNy3bx+MVAohMIWQo3jRYpUrVyb394Btd\/78eSgWgv\/7IA00lai0U4iKirpzRzAR4BZXAEbMwYMHMUsJfp7EtFpVDAr28izyKW1fv++R8D7h2dNncbFC68mAaqMyOHHyQgBhAoODWwceFUWBBKq9Z8+e7713zqqNZKjS99rhw4ckXBHawgg8ffoUXnLTZCDD2bNnd+\/eDZ1P8KchbiVGhjmAi+fOw8psVL8BEnB1S9v1KD3R0dGYUNHfBH9aQeLrAgcaja6LuBr0DAvUrV3Hw9VNXArcaGRkTl7khrkqw1PIkFevXj0PC6MmxSWgFsvkcNQE15HdC\/les2QCasv6ZObExsaiPklJQp+EGpfIt16TBg1tC1hjnGbSGQjU9sYNYfODB\/cfmJuYlvLxTU5rTPD50+fw8HDaiAzgvGibzteRkXv37sXIpfD04MQhFtiBGPI4KWq3DNvkhw1FgyUioyGAUjZs2HDnDreLIiMuNhY6wa6du3AFhSAR6A+JH7h1r+Rdu2Ztvbr12EhEZXCtnzzh5BXcBw4cOHr0aNb7jMQvQFILfg\/phwELye4IyfBAuAnBn1G2F89f0NbQ7NSRe3Xte6Q\/KkPSJ2MhmeeQPvb+3Xu6Wtrt27ZDnBCUe2TxdH4SJoVRXJ6WePb0GT1tncYNGgr+7JC+YuKQ9LGvX712sONuNX\/v4U6unHXWj81xEeCH06SYbwr68qVW1Wr2NrZMI8+EvXv2qKqorl3L7bsVHvbcyd7Bp2ixpA+cWvD5C3unT4B5s3te4gOze2yGiDPJQYYyh4ubGl6ZWMHFI+OV+I1IDxF+G8IVSIOFiB2E2A0olpE+BCBQnofFwg3blDueJzEhcfz48bBIqlarCi+NSYqSgQ4XPN+BCgKUGDC3TCDBvDjwQwL3RgbxMTll3Nix8e\/flyxVEnHiQzKE8gGC\/1sonBIQzMvHc8DN5JEQlCMoB4DccFLkFuLyDBSQlWL4uggIQTwyIUJv4f7nekvi+6\/XBUyeNOnRk8fVq1dXUPr6Wp1YlLOzFvLJtF6UkiBvJj2Q4NN+RQjNPjiWapgJrAj6Bage75X7BAf\/OIDC08Nqps+tzFCeMnHSp48f5RUU4uPjlVVU0orGv0L35ovKwPG9BqFYADdrf6oexZIjW1AmhLhxqJKA5U8ghH4ZFE4IQXwgO00GvOzUyMG8EvkE2Wsm8RvBtRCPyR9C144OEbtloGz37dvXp3cfP34LGnk5+Rs3buw7sB\/G387du9TUuFULmRwreLJGtrK6dOHiP\/+09vEurqfPPYx89ODBlh3by5UJ2L5zx\/e2M5JgnDr5v4oVK4ZWrbpu\/TohKJe4c+t206ZNXV1dzczNcdGehz3fvGmTg6Pj4SNHLCwthET\/Jaj3pn5JrRoaeuvWrQuXLtKOhOnBOGS9vEObtosXL2rWoiU08q1bt44aNYp2NhSnATkYZX8KODVy\/K0n+HeCyybxd0PK+MmTJ91c3bQ0NOkzgCZGJi2bt3jIb1T+G7lw\/oKHm4e2ppaetg4qZqRvgFo9evgIUVRtiUy4dvWapoZG\/Tr1BH\/u8eTxk8Cy5ai36GpxH8GrGhJ6+n\/cWv3\/Mp8\/fw4NCTExMZFZniJG3GtfPA8PKO1PkraEj+9z\/ssFEhL5HOluwX8C7krzG4+8ffNWSVERXgVFRfrOwm8n6cOHqOho7gX0VDkFBXlzC84Y5fomvySb0kikB+2D30OHDllaWLq5f91N+efBzCavIP\/p06eXL19yvYUPtKDrwkfxAf850OAYRLdu3QoPDw8ODibz93tGMF0dxH748GHd2rXJSckNGzXS5T9PICGRz5HUAgkJCQkJCQkByRqTkJCQkJCQEJDUAgkJCQkJCQkBSS2QkJCQkJCQEJDUAgkJCQkJCQkBSS2QkJCQkJCQEJDUAgkJCQkJCQkBSS2QkJCQkJCQEJDUAgkJCQkJCQkBSS2QkJCQkJCQEJDUAgkJCQkJCQkBSS2QkJCQkJCQEJDUAgkJCQkJCQkeObn\/A0Hpn5DKeyFAAAAAAElFTkSuQmCC\"><\/figure>",
            "label": "Content",
            "refreshOnChange": false,
            "tableView": false,
            "key": "content1",
            "conditional": {
              "show": true,
              "when": "aksiG1Kasus1TambahDindingSebagaiPengkakuPanjang15M",
              "eq": "true"
            },
            "type": "content",
            "input": false
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_g1O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.g1O1_input;\r\ntotal_g1O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.g1O1_input;\r\ntotal_g1O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.g1O1_input;\r\ntotal_g1O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.g1O1_input;\r\ntotal_g1O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.g1O1_input;\r\ntotal_g1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.g1O1_input;\r\ntotal_g1O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.g1O1_input;\r\ntotal_g1O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.g1O1_input;\r\ntotal_g1O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.g1O1_input;\r\ntotal_g1O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.g1O1_input;\r\ntotal_g1O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.g1O1_input;\r\ntotal_g1O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.g1O1_input;\r\ntotal_g1O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.g1O1_input;\r\ntotal_g1O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.g1O1_input;\r\ntotal_g1O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.g1O1_input;\r\ntotal_g1O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.g1O1_input;\r\ntotal_g1O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.g1O1_input;\r\ntotal_g1O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.g1O1_input;\r\ntotal_g1O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.g1O1_input;\r\ntotal_g1O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.g1O1_input;\r\ntotal_g1O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.g1O1_input;\r\ntotal_g1O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.g1O1_input;\r\ntotal_g1O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.g1O1_input;\r\ntotal_g1O1_price = total_g1O1_bataMerahPcs_price + total_g1O1_batuKaliM3_price + total_g1O1_bautJLPcs_price + total_g1O1_besiPolos8MmX12MPcs_price + total_g1O1_besiUlir10MmX12MPcs_price + total_g1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_g1O1_kawatBetonKg_price + total_g1O1_kayuKelasIi57CmX4MPcs_price + total_g1O1_kayuKelasIi612CmX4MPcs_price + total_g1O1_kepalaTukangOh_price + total_g1O1_kerikilM3_price + total_g1O1_lemKayuKg_price + total_g1O1_mandorOh_price + total_g1O1_minyakBekistingLtr_price + total_g1O1_paku57CmKg_price + total_g1O1_pakuPayungKg_price + total_g1O1_papan325CmPcs_price + total_g1O1_pasirM3_price + total_g1O1_pekerjaOh_price + total_g1O1_semenSak_price + total_g1O1_sengBjlsPcs_price + total_g1O1_tripleks9MmPcs_price + total_g1O1_tukangOh_price;\r\n\r\nif (isNaN(total_g1O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_g1O1_price;\r\n  }",
            "key": "g1O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "aksiG1Kasus1TambahDindingSebagaiPengkakuPanjang15M",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi G1, Opsi 2: Ganti dinding kayu dengan dinding pasangan bata.",
            "shortcut": 0,
            "tableView": false,
            "defaultValue": false,
            "key": "aksiG2Kasus2GantiDindingKayuDenganDindingPasanganBata",
            "conditional": {
              "show": true,
              "when": "QG1",
              "eq": "true"
            },
            "type": "checkbox",
            "input": true
          }, {
            "html": "<figure class=\"image\"><img src=\"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAArEAAAFvCAIAAADSZAS4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAP+lSURBVHhe7F0FoB3F1V636\/e5xQ0IBAIEd3f70UKhSCnFaaFIkdJCi7t7CRR3twhJSCBC3F2ey9X13f+bnZfb2xchlECR+\/G4mZ2dnZ2dOXPOd2ZnZlnf95kSSiihhBJKKOEXD6773xJKKKGEEkoo4ZeNEicooYQSSiihhBIISpyghBJKKKGEEkogKHGCEkoooYQSSiiBoMQJSiihhBJKKKEEghInKKGEEkoooYQSCEprEb8v9KhYliVVjd\/u480BeoviPDf7LUoooYQSSvjloDROsJlhGMaf\/vSnf\/7zn7DNxfg+uBfN2bbtK6+88pJLLjFNs\/tECSWUUEIJJXx7lMYJNjNee+214447bvjw4VOmTFm4cOH777\/fv3\/\/Aw44QJKk7hSbG88999ypp56KwKhRo\/bee28aWUIJJZRQQgnfFqVxgs2Ml19+Gb8dHR3777\/\/Nttsc\/HFFx9++OE77LDD3LlzEU8ZWDEPW7Vq1fz58x3HoYc4RUEP10XxKRoeOnTooEGDwDzq6upofAkllFBCCSX8FyhxAiaTyXz22WcTJ07sPv5uoNZ92bJln376qWEYNHLmzJnHHHMMiAJ9iYBfRL7xxhuI3GqrrYYMGbLzzjtfc801XV1d9BTw5JNPnnbaae3t7fRwQ0Buw4YNmzFjBm4xcODAjZCJEkoooYQSStg4SpyAmTdv3n777Qfz3H383cBx3VV64oknjhs3bvLkyW+99VYsFps\/f\/4nn3yCeGr1\/\/CHP+COoAXpdFqSpClTptx888277777woULkQC48847R44cibJ5nvf3v\/99hx122GmnnV5++WV6eQ\/IsqyqavdBCSWUUEIJJfxXKHGCbiteXV1NDzcLLrnkkhdeeGG33XbbfvvtjzjiiP333x+Rn332GT17zTXXwOQjcOihh44ZM2bJkiX33HMPDmfPnj19+vQgCRMOh\/E7d+7cY4899uqrrwZp+PLLL8Ezxo8fTxMU49lnny1cWEIJJZRQQgn\/HUqcgBEEAb8HHnggPQT8AMVhgB5uIoYPH94dCjB48GD8wqjjd+LEiTfffDMCl1122bvvvrvnnnvW1dVR0gBecsghhyCg63oqlULgggsuePPNN5HgV7\/61YABA1CMf\/zjH4inwCHLssjk17\/+9SmnnJLNZnEYFPbfpV2wYMGkSZOWL19OD+mp4gRB8g0e\/gCgdwS6j4uw3sgSSiihhBK+J5Q4AbNixQr8VlRU0EOKwhD9esfqNwLP8\/ALo04PKWgmdEDi+eefx+8OO+zw97\/\/HQFq9l544QX8VlVVaZqGwOzZs2HLETBNc6eddpoyZcrIkSPvvvtuxCxcuBC\/FDRbau8VRZFlOYjujn\/\/\/fcPOuigYcOG7bzzzvg9+eSTp06dilO4I35feeWVfffdd9asWQgDKLbruoVrf0jQAgAIowy0GCWUUEIJJfzwKHEC5osvvsBvsSmi9unqq68+88wzacwmIpPJ0DF8mkMBK1euxG91dTVM7wcffIAw\/H5Jkqh5xiEdFTj00EPpIeIpt6ivr3\/zzTfBFWgYv8VrGmliGtOnTx9RFAuO9RVXXIHcPvroI8MwQHeQP2jHnnvuOX78eHrV448\/PmrUqHfffRfhW265ZejQoYMHD77wwgvpRMggjx8OqPznnnvuhBNOQBmAiy++ePTo0Yj\/4UtSQgkllPBLRokTMF1dXfgtGOMgjvnrX\/8KP\/6pp556+OGHcWoTjVN7ezv8eI7j+vXr1x0VoKWlBb+HHHIITrW1tSG83377BWe6wfM8fukgATBp0iQauOGGGyghAOjKiMKqxQKam5vxS5kBLertt99+22234fDggw8GCVi8eDFMbHl5eS6XGzNmDLlm7RsT4Ne\/\/vWVV145d+5cJLv\/\/vtvvvnmQiUUsGTJkhkBCsxp3TTrAmk2JVlra+sBBxxw6qmnvvzyyygDcO+99+6zzz5\/+ctfulOUUEIJJZTwg6DECbpBbS0Maj6fP+OMM6677joaD4d78uTJNLwRUOMHk48cZFmGs0vjAdhyOrtwyJAh8P7pGwRYaPwicbHVLFhcesetttoKJaExwLhx4\/C7++6708MCli5dit9CPqtXr77pppsQOProo995551dd901EonssMMOIAQo2JFHHkmTUU5w6623Pvvss7W1tVdfffVZZ52FmBdffLGwhBJADqAyw9Zi5513xiWI71HyYrz33nuFNPj9RlqA8o8aNQqBww8\/\/PXXX3\/ggQf22GMPHIIPPffcc0GSEkoooYQSfhBAZf\/Ccd5556EeHnnkEYR1XT\/ooINozVCTBsRisUWLFtHEGwKMPX6XL19O\/fWBAwf+9a9\/feihh2655Ra6ogG2HAmy2Ww0GsUhHHd6Fb3wT3\/6EyLvvvtuGnnsscfi8G9\/+xsOC6D8AHl2H68FLfCJJ55IDx9++GEcNjQ0wP\/GIc3\/rbfeQmQoFEqlUjhsb28vjGRsv\/32K1asQGThBQdYEQ4Byi3WxR\/\/+MfOzk6a87qgeyniWnq4oWQFmKb56KOPfvDBB93HAa666ipkgrJ1H5dQQgkllPD9ozRO0O2dH3PMMUuWLDn44IM\/\/PBDHBYIAXDooYeWlZV1H2wAND38Xdu2EVi4cOG1114LtgFj39TUVF9f\/8QTTyBeFMVtt90WATrBEFcBjuPMmjULhzDG+IUtp34z3Hf8FkBHMizLoocFdHR04BdtSQ\/pfAUQhcJQBH5nzpyJ3x133FFRFATACfCwCGia9q9\/\/QsEAmH6uQSaHhg5cuQ111yDwE477XTnnXeiWh5\/\/HHUkqqqt99++4QJEwope+CUU07B74033khvChTKtl6ARZ1zzjkFKkYTn3766fjN5XJBXAkllFBCCT8EfumcAF4s7Dcs5YwZM\/bbb78xY8bA1NHhfWqc7r333ueffz4ejwfJNwiamA4n7LvvvmADu+++OxhA79694fSPHTt20KBBOAX7d\/HFFyMlTOwee+xxySWXXHjhhSNGjKBz\/ejMBhQJthAp99prLxwWkE6n8UtvtC5omQE6yXHo0KH0kILOV0AkHcYoTCQEZRk4cCBJEUyQpAEUG8wGRh1h1Mmnn3566aWXHnjggWedddaDDz5IcyiektkDMPB4ZDCMo446atmyZQXqsKGSI56CHtL0xcsrvhHd1wfojtp8QHN0h0oooYQSfu74pXOCbDY7b948WLijjz66YMAK1uXhhx+GzaYxJPU3gU4S3GGHHWA7P\/\/88ylTpkyePPnVV1\/t27cvzQG\/sJRXXHFFOBweN27cPffcc\/\/990+bNi0SieDsm2++iV9qv2Hj6VuGAjZehm222Qa\/SEMnCvTp0yeI\/g8UDPl7772HlGVlZeeffz6NAd5\/\/338hkIh5DB69GhYZRTykUceQQwSAzi7fPnyVCpVU1NDX\/mvC5oMRGrLLbdcunTpYYcd1tLSglql8RsB0qB4hmG0trY+9dRT5557LiLBrujZjcBxnEL+tPk2L4oJYgkllFDCzxu\/dE6gqio8WrjFdMMfalRgAKqqqmDLqWXadHtAP09AXwEAW2+9NR3AL+SAAEz+LbfcArpwww03XBcAnv3UqVN79+5N3wIAlmXBOvbwUOnuxesWhsbQgQGUHyYcgR6fb6CvDAqg5KDHOxF6d7p3E\/1i08EHH9y\/f3+aP\/0FmcDvVltttZGBExS7rq7uww8\/3G677ebMmXPAAQeAHtGK3RBw9p133hkxYsSgQYPwIGeeeeaaNWuQyeWXX96dYgM455xzcJdVq1bBcm\/8Fv8d0un0zTffjMb6PjIvoYQSSvix4ZfOCZ599lmwge6DwPIBlZWVH3zwAZ3oh0PYAwABmma9QAIYWvouv9i\/p1fRHACYLhoD43f99df\/JQBc\/AEDBnz88cd0nCAWi\/3zn\/8cOXJkMpkkWawFvbCwFrFHeehIA3DEEUfg9+23325sbKQxoBf0hYIoivhFOem6hr59+5LTa0HHJxKJBH7pewo67IFi45e6y7Du+KXue48C4JDG0JT19fV0jcOMGTMeffRRBGg+G8K4ceNAjFauXEnXbYIWzJo1a72jHQUsW7YMzYdkbW1tKPDVV1+93377XXTRRZTcgJp89dVXdOsnoFDaQjk3hOIE4EDXXHMNWooellBCCSX8vPGL4AR0z76jjjrqsccee+2111599VUY76ampj\/84Q9nnXVW8aw92K2ddtrps88+ozMBaUzBQhRbi3UBI0TpRfGI97qGcEOmceDAgbvssgsCkiSddtppv\/rVrwpbCFAcdthhxxxzDJ6i+3gtegxun3rqqbDrs2fP3nXXXQ8\/\/HCkx7M89dRTOAXzjEKCE0ybNg2HdAyjB+gQAuUHtKjImQZALMaPH49TW221FQ6LUbg7TQlLjPvSDQZ23nnnP\/7xjwiQuttA7SH+uuuu++ijj0455RRKXHCjwhTFDQFswDTN\/v375\/P5vffe++9\/\/zsa7r777gM5ACXacccdR4wYgWc\/\/\/zz0cSFZykuA33YAgpnC21EJzkWDksooYQSfuagevDnDTp\/vgcqKyu7Q0WAmYTDChsD17O9vb37+m8CDC1+bdumVhYWl8b\/16CWm2a7Lh5\/\/HG6lBFAUeleCDCHNAZAeNCgQcEDdQP8AIYN7AGOOHKmGzm\/88473RcEoOshr7jiCoTpgsYtttgC\/jc9O3\/+fOq1K4oCOoWYHsVDtvh1HOevf\/0r\/YATcNlll6Fa6FmkX+8TIZJeS\/H555\/TahwwYABMfnfs+kAnQGyzzTbbbbcdAigeSMB67fc999yD9LQAAMJjx4696KKLwMP22muv2267bcKECUGW3Q+l6zp9cLqR5bHHHhucLKGEEkr4meMXwQng4N4f4O677z7xxBPp0ruNQJblSCSSTCYPPfTQ3we45JJL3nzzTXiuAFxwWOLurP8TF1xwwb777rvpZGIjKFivAughfQvQr18\/+L44hEdOJxB8+umnhTQASvj888\/Tp4Y5R\/wRRxyhaRoN9+7dG5f04C5gA4iET4\/wihUr6FSD4cOHw8\/+3e9+F4vFcMjzPOKbm5uRpkfxABAOujkBsNNOO3344Yc0Hikp6OG66HEWz0JHC1577bXuqPWBcgKK7bfffs2aNS+++CI9RDlPP\/30p59+mq6q2H\/\/\/buvCQBS1WMMBvjzn\/9Mz3Z0dGy99da9evXCg9NNJA8\/\/PBZAcAUaZoSSiihhJ8lfhGcoBidnZ3UrSwAniVwZIADDzxwn332qamp6T63AcA1B12gI\/O33norjN8HH3yA39WrV3ffZqOgJhDocVgAjV8vYJnoy4JRo0bhkM4lBC0AOcDhRq5NpVK4loZBLF555ZUezAY+PbL6wx\/+QA\/feOMNuuyQAq7\/5ZdfDlP6f\/\/3fzRB8b1omO60WFFRcfPNN2+INlGQh\/zPohYfwkencylQt91R\/wma+JNPPgmKRvaWQLMi5pZbbsHhoEGDvvzyyyChf8cddyDmkEMOoYfA6NGj6VjC0Ucf\/fbbb48cOfKggw6iVYpGRIJly5YhvF5sueWWmUwGaYpLm8vlukPrA3nOImxkvKSEEkoo4X+OXwQnKGjhr7\/+ujBRoBiw7jQlBdxBpATgST\/22GPnBvjtb3+7xx57wDTC26ZGZV3g1FZbbbXNNtsMGzbsjDPOePDBBx9++OGHHnoIdqirqwvmBNi4Pdj4WcC2bboOEKSkvb2dbkiM23WfXh+Cp+\/OtjgMFIfBGPCYlDfQ+M8++wxPAY8ZVGnChAkvvfQS7nXKKacEyf\/jWpJpcIjLN4UY0fSmaZ533nmgGt2xa4G6om83br\/99u6o\/wS91yOPPII0Q4YMKbx6uPLKKxFTnOHLL7+MGNQVPTQMg75qAQGiMRTgB4i85pprELYsC\/Tud7\/73XHHHUfXeiiKQqdbovUp+QDQlFdffTUdURg6dChu8eabb9JTBdCxHFraYqwbU0IJJZTwY8DPnxMQ4xOo4BdffJGuCFjXop9++uk08TeiKUBjY+Onn34KL\/YfAWCYYWn69etXX19PB73XBVx52LnKysqdd9750ksvvSLA448\/Tj8+tGjRIroV8aaArm4ACpME77vvvu5z6wOtAWo4abiA4hf5xcCp7lAwskIDYEW41wMPPEAPi9MEmf3H4YZyLgbdSxH44osvuqMCoDYKMw27o\/4T9F7HHHMM0oC10EgARhoxqNjuY9+nX0wocIK3334bh+Bt9BCP9sILLxxyyCH0M9MfffQRIosfZLfddkP8yJEj0ehjxoyZOHEiPQsB2H777XEKoGMMFNdeey2dPwHgKhDQr776iqZ\/5513QFnAUYrzL6GEEkr4UeEX9O6AGgygwAnKysrgCyJA56B9F8AEOgFg5+BPw9IAoAv77bff7rvvvssuu\/RY+LcuqqurjzjiiBMDwNP95JNPPg8wY8aM7nsUAXSksEPA2WefvV4zU4hEYL0J1kWPlMVh+PRwiHG7SZMmdUf9J4oTbzroJ50GDRr0\/vvvU2sKHrDrrrsiEuRpvXmSIgY4+OCDkeypp57qPrF2MmnxOMHzzz+PmAInoJtIgop9\/fXXF1xwAZ1XAYAT3HnnnTQNcqaB1atX0\/kEhYkRBaDOEY8Kwd3nzJnz7rvv\/vGPf6SbQIDh0TR0e+brr7\/+5ptvpis8KQpfgijhZw9d16dOndp9sBYFASsgEGcSue6pb4uuri4ojY2\/zyqhhI3gl\/LuAL8wOTvttBOUMuUEcOsnT5785JNPIlw8af97Qj6fh8s4YcIE+MSvvvoqfO5f\/epXp5xyykEHHRQOhzf0MoICfi1KDmJx5JFHPvTQQ\/B9X3nllRsCwPukA9QbQaBwCLqPNwwwG5ps3cQPPvggSjJgwIBsNtsd9d1AbwHbXNiGYeutt6arMYFoNEo97HVBL1yxYgVd3UDnIdLIb+QEw4cPx2HxWkrcFNU4b948mqAYhS9W06kbBdDdHVRVLczPAFatWkXnqRSyQvvisLBvxODBg2mCAw44gCYo4ecNdEzwe7Q4lROwaoCe6tG\/cFiMTRlj2xCOP\/543PGss87qPi6hhG+JX8o4AXoafpctW9a\/f3\/0mS233JJ+DPCEE07A4ZgxY4JU\/xvAnCwNAAN56623\/jnAZZddBtNVU1NTWVlJX2avi\/r6ejwIyA1SIv2NAe644w76Uh\/ZNjY2dt9jE0D1EQLwmHfYYQdYSpQH+QBPPPEEnW94yy230MTfHYXbTZ8+HWayeCHAnnvuOW7cOJomSLse0A8ilJWV0VcbNOUmcgKgoqLivPPOg7GHJ0dPrQuQEqREExTenlBccMEFiP\/LX\/6CMByyTz\/99PTTT6erP8Aw6KoTuGuF5S1HHHHElClTwKXoBAgQuyCbEn7maGlp4Xkegv3YY49dddVV4NO9e\/c+5phj1h1p24icbzpoJvQjKfA0aGQJJXxb\/LLmGAJw8qCUKSEAdtxxR3Sh74MTFO5IA0ER\/o3iUxuCbdswOQDMzKuvvvp4gIceegjlh22D0wlCQGzO+gBlJMsyPOnDDjvszDPPhN9w7rnnvv322zBOFIZhdN9mHdB5ixSKotB37cCIESN6WtD1FB9RhT96uMEpCxT0EO2Cp4P27LFrwoZANygEYUL94JDmAy6FyI1wAvpVCNCd4mURhTIUQGMoJ4B\/TyMLoDMJkPPVV189ZMgQhCn23Xdf8DCapqmpiQ5jnHbaaTQGoMsiTj755O7jEn7WaG1tjUajHMf1WPiaSCTQAbsTrcXcuXOvv\/56dNXf\/va39POq3ScCzJkzBxLVfbABUKGdN28eOhEY87pSXUIJm4Jf0HyC9YIuQ+gxOPwTwtSpUz\/++ONPAlxyySVHHXXU0Ucfffjhh693R6ZiDBo0aJ999tkvwB133PH6WoAtpVIpWC\/kU1dXF4\/HY7EYLB8cHfi+3Xf9t0UP3jXA6Lt+EIIaIr80sDbsdF+zWbFmzRqoWlCWTLA4kIJuu0S3WCDFWYcTXHrppTg86aSTCqO4BTzwwAP\/+te\/ECCPFVxLd3scOHAgPaS\/uC+dZFAAnL\/f\/e53PXY9Ao0LhUKwB9D1hciPPvoIDYSWIulK+FECBhU9Yvr06d3H3wHNzc10Vw9g1113vfHGG6+77jr6LgkC6TgOlYpsNnvNNdf0mJt8wAEH0NXFwJIlSyDqcAPoIZTVa6+9Rvcj6QGaIUVxuIQSNh0lTkA4wYbmt\/90AX0E34Li4YcfBl0ALr744p122glmHqAT4taFqqpgADvvvPMuu+xy8MEHw2sBYGVnzJgB5QVT9w379gSKiGoj\/MLZASP4npQTGMzIkSMLcyCA\/fffH49w4YUXIkwj\/\/nPfyIGDxKc9xcvXkyXFw4dOhRM6Ouvv4Zn\/8gjj8CbR2SvXr3oVfT3mWeeQSTIU3EkPDxEQkfX1NScffbZ7777bkdHB+J7AHwCacrLy+l+iLiWXk5RHC7hR4UzzjgD7UuZ3HfE0qVLZVnmeR48ozvK91966SUwRU3T6MZfhmGAguCOAF2RdO6559L1RCNGjKBThUAicQg5hPTSd50Ut912W0GQAvnqnohAuft3mZRQwi8Zv0ROUOhIwFZbbZVIJOg74J8cqCKg6I76JkBTwIZRwG29ey1gFEEFgH79+hUvrisGFBz8HmCPPfaA3QXDuOiii5\/558jZc2bNmTNzzpxZze0\/xDZ\/9HmLVV7h8cFd+vfv\/\/777xci6WelDjvssOA8AZRysaNf4EbQ3U8++SQSFHIDGUL8dtttRw9pPESloqIiFApNnjyZxgOFSwqgUzJPPPFEeogEFDRczGNK+PEANhimFw1X8NG\/C6gtBwel03Jpi4MjIkYURTrX5\/bbb0ca4M9\/\/nNBpOns1AMPPJC+QbjvvvtwCKGlc6FYlqUrgBBYuXIlvaQAUP\/a2lqQ3e7jEkr4lvhFjxPk83n0H2iB7uOfEb6LyZk\/f\/5bb70Fawr87W9\/O+SQQw444IB99933G5dT1tbXHnrIwUceecSRRx1x7bVXv\/feOx999PFHH35UPD\/\/G1EwnPTw26LHPAnHceDK93D7Vq9efd111+GhoGcjkcg+++xzzjnnFF7x4tb07nTBIZ2dUFwe6qsdccQRcAS7owLgMRH54osvInzXXXchzW9+8xuEi6\/9\/lC4S2ExZAnfFrlcjr50K+YExc2HcPHhxnHvvfciq7q6uuKXbs3NzaChkiSBlGcyGbro5vzzz+8+HfASukT2vffeozF0TivFsGHDJk2a1NraSnntM888Q9NQtLS00AxfeOEFHBaXdubMmVdcccWRRx551FFH3XnnnegCNJ4CedIPpHUfr8W6McXY+Nn\/DhvK8\/u4VwnrxS+UE1AJmzp1KvoPPGMaWcLGkUqlpk2bBv8Y5hPe9oXnn3\/OOWeddfZZ+x98UCKeVBVN4v+9F3Ix4NDQlXjDhw+HQYXf82iAt99+G1oMXhSUI4x3923WB7QXbTL6u7kAX23ZsmXdB0Wgd6Gc4Omnny7EUEyfPp2+\/U0kEhdddBEe5LHHHrvwwgvpFyLobAbq28Hho5dsXoB8PPjgg8Xz1ArFGzlyZDweR+vQwxK+FeAkVFdXo+FAi7uj1uKNN96go4mbIoE0DeWFoJ7Fl4AKqKoqy7JpmvSDHRAbul8ZHSdAPF2xUljUSifBAAMGDFizZg2NpMQUlJ0eUsyePZsO8r3++us4pPdFtn\/5y18KM4UpQCn++c9\/0juCpqCHgkzQPvjaa69BpJ999tke8xwBZEiHuGjOhcBmBxjMIwFQyNJHRn5g\/HI5AbBixYprrrnmyiuv\/J4k++eEjVdRa0dHS6arOdU5efa0ex958O933vX3u+++4MKLths6tE+fXnCVNrScEvqxoqICGgoOEMzq1QHuvvtu0DVYazji3zjderMgEId\/PyANQynfdtttdA5j8Vngo48+oksYemCvvfaiSw8onyh8PGLzArQDmUNuu4\/XAo5gUAqyu0Pxq40SNhHgBJWVlSB8hXVJACzl73\/\/e9Qq+B+N6SEM64ImoLyweJ9NYM6cOYIg8DxvGAaoGxKANNBT9Kqvv\/5akiQYaaTEIZLtvPPOSKYoSoEF6rpO99josYEprkUkUMwJzj33XBq522673XTTTaAR9FrcgsoqmAQOy8vLYYnpPmAUYLTr0oLvGwsXLjziiCOKZztBOdxwww3dp0v4\/vET5QT\/0Se\/qYeuBz169Td28l84UD9usMQA1YSA6+MAgaDmg3egdqpNH\/NRy7XXrzn73I4LLvEefsRfQjwt13ENslOL1dTU+Pbbbz7\/\/HP\/+tfzDzz44DHHHA0NBWW3xRZbdHf99QFOD3zx\/fff\/6STTjr55JOhml999dVx48aNHz8eNq94PeG3BXmWddB9LkDxYY+zNJzNZl9++WXozV0DwJl7++23aQIALh3KTz+qVHztZgHIEzK\/7rrruo+DQW9qtwDoevwOHz688J3rEjYRkNRIJDJixIjCqBWM4v\/93\/\/RioUth\/jR+I2g0Nw333wzrjrnnHPoIQUoLyJhlXGLW2+9FeECJ6B46623ELnTTjuhMDhEI9JNMIu5RVdXF92mvcdbuQInKJSTfu8DAF8sFAxMFzE77LADnejwwgsv4BAZ1tfXIwCajhog1zBM4VtiFCANf\/rTn9ATgdNPP31TVtDMnTt3I1uArIvCJMott9xy9913L3yODjJfmG9RwveKnx4nKKxzIz+wTvQo6IpU5oMAjV17bv3Y+NkS\/gOkpuj\/hB90U4RA\/4Eb+J1ffbGcY\/IMkwv+MgyzfMhAN\/\/NNgmacfr06WPHjv3888\/fe+89aC6qcehySmreNoR+\/frBGENxHHTQQX\/\/+9+fD\/DKK68sXrzYClDQ7OtF8SgoQMMUNOa74LLLLoNSg9PTfbxZQXdofu655+hhZ2cn3SIaQI0VKu3uu++mCUrYRCxduhQ0tLBydeXKlcV+MwBa8OY6X7rqgYL8wNjjkm233RZkEXYR9GLkyJF07y+IKxL84x\/\/QLhwO3oh8kdk4Uuec+bMgZFGTPEeySAK8WBr88J+GBSUE0AARo8ejUNkCMOPmOOPP54moKDSck3wxS\/gb3\/7Gw4ptt9+e\/oJdbrl65\/XfkAcBOXaa6\/tsWASuOiii9DLNtRlJk2ahOctzLSlPY6GN4QHHngAz\/74449Txt\/Y2Fgo3maZ+FnCN+KnyAnWYsPStVbw8A\/+wC4Lf8WgZ7uTBlg3poQCyLiAjcohTAC2llQmgq7voL5cw2rZYXubYXyG8xk2yzDN552HBCQdCESQtLteuw++GS0tLbDuS5Ysgavx2GOPXXnllVdddRVs7c4771wRgG4duC54nq+rq+vbt+\/gwYPPPvtsuGvALbfcAkUJFQNs\/H3EN6qtjQOX0xyoE\/Z9gO6YSwkHTEVhx26KoA6Y8847D1yhUJgSNgXUqz7iiCMQhuANHDiQVmYx7r33Xpp4QyhUOB2ip+jdu3dhim5DQwN9Rw6KgMNBgwYVj3h99tlniCyslHniiSdwCGkvXhsFDg3uAoLSYzYM5QTl5eV0oSO8fPQFJKM7JxYKRvfYRib0kG6lBYBko9PRSDqJ4dxzz6WHl1xyCU2DzM844wxQgcLjnHbaaRsy9jNnzqQ0gm5A\/l87+qgNZFL4IkkJ3yt+2vMJ8nr2y8njPvj0rdFjP1y8ZG5Ly5r2jibT3ND3PzagHBH97z9i8brjS\/gPkA4dcALSsfNdnV2rVgU1ZQcV56+67oY04QSsw7CNIbVzGvl0U\/B+wXbIdSSE\/\/GfDV6A8H8CibtDAUjGGwDOwk\/KZDKweZ9++ukjjzzy6KOPPvzww6effjp8smHDhkEXU29sXUCTwusCmdhtt93OOussMAZovSeffBK+EYwr8N0nNKF4Bd1Hwxt\/nG8LeJxUHcPvhK6nA8vFbAAoTDX4PgrwM8azzz6L2jv55JNhzOjCvx647bbbupNuAqjp7bFaZ8SIEbNnz6YJ5s+fT6f+nXTSSZMnT4ZF\/+STT\/bdd1\/EgNSCvCINZBuHxxxzDL2EAhQZkbh2+fLl3VEBpk+fjvg+ffrQeQAgwTgcOnQoPVsQAzp4UPjIy0EHHYRDUIfiz5PuGnyH7E9\/+hPCEyZMwFkc\/uY3vyl8vhUdkL5VwRNtxNjTrUWj0WiPb5+uF4USIkBBD+l7sc24sXoJGwGL\/1HdPy0EJfaXLV\/y0acftLU12Y4JkWVZTpZkSRQVWYGiHDhwSCSUYFgmES9LJsiE8A0CxCj4lyjV7lDwW0IxumvGg2HNLlve9Nvfec1NA8aO5mIxdGFUfuaLic5uuyZ8H8yg47jD+7zydlCvSO+xDBQK6zI+x7gsw7tw5RG3\/k0QNg8WB5+fpmEoyvHjxyMAzQXfmm6KvCHU1tZuscUWVAMOHz6cTu8C4OeBbdDwxtHdrwILTX97dLFi4\/2tQLNNpVJQ+mAG0Nf33XcfiBE9i1M0wfPPPw8bQyNL+FaA4w6vFzJgGEZHRweNpBUbi8UeeOABunPAxkFbAbR1m222gc0eM2YMmCiaybKscDi89957Fy8BuPnmm+lHOtbFlClTIIEgrCCvaNB\/\/etf3ScY5oknngCdRT4QZrpXAQUugb2Huw85x01xa9wO1ARkF2dpwWBoQZ3nzp371Vdf0R3bBgwYgP5y7LHHvvrqq0E2DNIgcunSpfQjpSeccMLLL7+MrEaNGkUTUMBUP\/TQQ1dccUVhpGFd5PP544477oMPPqiqqvrwww\/RiVAMxKMkNEEPrHsWbOmAAw7o6upCR17vxN71gj7segMlbBw\/PU5ALdCsubNuvuUmTmBVRYrFI6IkWpapqVpI01zHIW3vudCbmhYqL69UlVB1dU15WSXL8olEsrKqEqaK43hJ\/I\/1OcC6ElkChQeLjsrx\/NT4Me1nnFWzdBmsfeqay2v+RuZJsT7j5rOr99ylbuqsDMOYT4+sOv1XHrmI4Vhi\/MHbOF7mGRADFvWLK\/4nxCuXyy1btoyGoTc\/\/fRTtDUaHTqR8gYyIdI0aYIegKql06EHDRpE957DhfX19dCVVGA0TdvQ+ATwHVVSQTLxCHBhm5ubaXwxGhoa7r\/\/\/iOPPLL7uIRNBqwgjOjrr78O09gdVQS4ubBq9KOd39iONAF89H322UcUxWnTphW\/RCig0KC4Kfz+cePG4RAc9OCDD8a1b7\/99tVXX33TTTeB9l100UWHHXbYO++8E1xHQInCupzgjTfeOOaYY3pwAthROn5AnxHUBPKjqiolx6uC73m2tbXB3iMxLTzYM4R8yZIlc+bMGThw4NZbbz1v3rxXXnmFflmeAmlAlFevXg2yAsqykWqBxB5yyCGff\/55XV0daMF6a6MAmg9qA\/WGsr377rsop23bI0aMGDt2bDGd6gE8AtjwXnvthectLkmhnguBIPpboHAhmCKUA9ghjf+54qfHCYjzyTKdqa5zzz9vyfKlkiRqIYUXBceyIpFwLBpJJhI8xzO+wwt8PBZTVDWXy+bzWVmWZFkTeCkRT3i+L4pyfUNDWSzRUFuPLMEPYrH1Dyeghr6DMv+ZwCXuPgubufCIY3t\/\/L4CxeH7TTCEL72UOP54cAUY\/8bLL4\/cfntnQ5\/qqV8L5TFaZ\/ry5e333u+ksr0fup8l7jdHOv33X6dUsPGLuwGFcHByPYBOwS8SQBPRd7oAwnTrGMdxWltb4fzR+GJAT9GVllB54ApQu0hfU1Nz+OGH8zyP+FAoRGd0f0fQ8kMLb7nlligJwojpPscwUPQff\/xx3759EUlTAt3nStg0wPmGC07rrVC3qG3YbLjLhRhgI3VLKx90c\/\/994c1hZtbYIr0VCGM38IhFT+6qzEa9\/LLLz\/11FP32GOP1157jU6jKSwpBB555JHf\/e53CMCV79OnDwI05wceeOCCCy4ocIKJEyeCx0A+Ic\/0XQAASQaNgGTOmjUL5u2tt9466qijIpHIzJkz6V5JAE7tsMMOsH+LFi0CkwA\/gIRPmTJlSNEXv2Czd9ttNzAMkGyId\/GjFVB4xkwmAyqwcuVK3AiZF\/OYdbFmzRqaIT2Mx+Ooydtuu40+6Ybw17\/+9brrrqOjHdls9rnnnkP5UUsboembCPpo+XwexcAjoEHphlE\/V\/xUOQFwzvm\/nz1vniRLvufC2pMX3bbN+J4o8I7teD4bjcbguTmuxbBuQ0N9OKxJohRciqSuLCugurZli4LguJ4iq+Vl5ZoaQub9+w2urq6tra0RuJ7zbNeHQgXSkvXsGOuApv\/GZD8Q1lZngELRCrFBgPz48PpdhuX10Z+nD9y\/xrZ8lkOdrxw0oPL9j7R+fZEmO35i9u83yCf\/Kvkr8vmA9OQvsi+85j\/3bLSpuU2Tk1NmxoYMJO4K6ANhGN\/ny4MABdlGl6Ydmx4Wh4Eehz1QyAScAEoWKhVhuOngCrquQ2O2t7fPmDGDplkvwAmg3OnscWiTQw89lHKIcDi8\/fbb0\/cUmwhYi+OPP\/6jjz6iBS6UDfwD9gCqthCzkSf6hePLL7+EiUJgiy22QCenkQDs7l133YV6K9QhgIaDjamoqNi4kBSDpoTbve+++8Lv\/+KLL7pPrA\/0XsU5r3sj6t8Xx8Pkw2aDBSLzYtf5z3\/+80033VTgBPBrwQm+\/vprMMU777wT9hgu+913301fAUyYMAFn33777SOPPBKPCS+cZgLAm6cLLhYvXgwhHzp0KOR29uzZdFcuCmqD9957bySG3d1I\/TQ1NaFgzzzzDPoOaARYSDKZ3Eh68Axk\/u6774J24BCP+fzzzxeWR24IJ5988gsvvPCPf\/zjlFNOOeaYY8BgEIm+huYbN27cU089hQfZZptt1v3c1HpRKB4C+EV4zpw5dIQDd6GTfH+u+OlxAtpacPQv\/sOlM+bMFiTSwIokk7VnrotmJOPYLqw8EwqHc\/ms5zloXM\/1OJ6LRsK2qccToeHbbavKMs\/xyIfhOY5lTcuE0OBax3JsUARVK08meV4UOK6urqGyvLK+oZemapKkiMJ6iCd5o0FDZKicVOpage8h94Xa7hH\/PwMKRCYJwPCzpOpIDEv+CwKoHhaV4\/iuwPLgBDDnPMOuuf1W+Yo\/lZMLGN33W\/bYu+6d1\/lovPBI6RlfN992q\/rya2WmCYuHFmphWenFN+LHH0nfQvwQjOCHAhobnMAGH2WYrq4u6LJUKoXIzs5OqF3EQKeDfdLEPQD1DV8N6htaEvoLYVwI9rDnnnvSTWrhzxUcnenTp59xxhmFNegFQBtCaSJAjQcCRP7QpBvQub9wwN1cvnw5AqhthMHJUMnAusYbJvP999\/fyFhxoZ7XrfArrrgCrm3hXf5mx4IFC6LRaHV1NQx\/YYefiy666L777oPf\/8Ybb9AY0McTTjgBAkkPi\/HQQw\/BjYa4glDus88+hbExAFfRiYe4C\/jrwIED4XN\/+umnYAA0wccffwwmgVsX36uA4tp4+OGHb7zxxsbGRoTPO+88UJPi\/Yg2AhCIF1988frrrwcvoVMUN\/JpeOD\/\/u\/\/YP4vvPBCFH7+\/Pm4O\/oC+h2ervi1y9lnn01naBYXEhQfDY3uU1dXt9dee9ES9mjTJUuWgJ0g8MEHH6BycBbA2UKCnw1+guMEa3H\/ww\/987mRtfV1tuP4DNldRBSFYKK75zqOa9uQZjxcLpdHjCRKJI2jlyUjNTUVtdXVkki+tCuLUt40V69ancnpkKKG+npVlSVZRDaObUOX6\/l8PptHVmXJCsu2XNdDmvLyKssyK8oq+\/cfFAqFFXndTfpQq\/iDuGxIYujZHwFQEDJxkEz\/Q4E4Ui6fTATwQZXIifRXX67+87U1l\/8xvv8BpHZZ0AJm1RFHlL3zjsYxlscs7T+wfuzHWm1vMpYQGPulN1yv\/eXGYHyN9zgXrWD7TOqyP1TdcTutF\/yRUfWfO9ra2gjRDCYBjB49uqWlBZEQKOhfOqs8m82CNNDExYChSiQScGjC4TD0Nbw0JH700UfpNrSFPgvP7+9\/\/\/v5559PD4tBFVb3QQlFuOyyy1577TXoBHgR6XQaDdR9AoIfAKfoIap9++23h3NJx3IGDx4Mv596mWBsqPwg1fpB3eg\/\/elP8Fw3e1sUMjzuuOPgEMNC02WTlBNce+21MMNUSJAMBhJWkO6RgPIfccQRM2fOBF854IADYD5ffvllkAY85uTJkws5FzgBCOiwYcOQ8pNPPkEABr62tnbs2LHnnHMOCAES3HHHHajPHg9ID0Fh4ZSDcyBmwIABENTC7k+bjmXLlo0YMaK1tfXMM8+kyzJ7oHBr8BU6nRPNd9hhh6HyzzrrrFmzZtFke+yxB3T4hx9+iOZbuHBh7969kYwS6LvuuuvWW29tamqiKXv16gWqhIajZ1F7I0eOHDRoEOJxi8rKSpCDwiroHg\/+88BPcpwAv2iJUWNGP\/7UkzhIZdKgBTBXHM87rqsqCgJGPisSD0C2TNcwdJbzQyGlob6yrr7a82w0YyQchnNg6rnmltalS9csXrISTrCqSolENKyFoQXQ52uqKgWRD4dCYBuMD5phBQzDhbiYJroEoaLxeCIeT2pqpL6+obamPorLwhFZVomZ\/SmANj\/9JYSAhmDeIesek37zzfRF5yVXNbYNG1Y3fjwXCsHucwynL17actghofnz3f0PiN13rzJkCPRosNDA5xmua+x4Y6\/dEyD7yCn4sxjGOPfMyoef8BiP94Oa+Vl0JWiWHkqBHm5cWeAsXS0G92vSpEngB0iMmFGjRsErQjx4w7x582C0ui9YCySj8k8BowWrgAt33313qC3EIAECdIFiCRsCKhbVKMsyfNzTTjsNzKzQWLR6+\/TpU5iL2gNIiV6PBMOHD6cOJcKwFvTdUHl5eWFXA1ggalk3O1BIFANOMPjKnDlz4BzT7y1deumld999N+gI3WsIMYXngpBAVumLBpy6+eabUf5DDjlk2rRpv\/\/9708++WTwCXoKl4AB0A2X6NoHOleR5MIwsKnICoIH3x3GteA04xS9VyF86KGHwvlGephYWGg6VYLmj8A3opAPfSGy0047ff7555SQrYtUKgXKQod\/jjrqKHA+tNGWW245d+5cUIqrrrrq6KOPXrRoEW2at956i25BgczBBmD+EYmaBP9eGQCHlFchcPrpp9PvrePWjuOgldHX0O6xWAzECFQDp35m+AmPEwCmbbW2t6fTqcbGJpBfj+xYkJ85axZUrWEaubwuihKZQwBCEJb69GlIxMKO64RDaFkll81kcznb0l3ba+\/IT58xnxcVonIZh3XhxHK+7woC2AUnS5IsS6GQXFVdqciK63mqKkMsQmHFtk3LMiHAhmERZ8JnVREUIqxpoWg01qd3H1lWeF7o27evIqnBa4X1ALek3aTQDcjBDwXcko5rCwgRYsWSyYS+z7Ns4wfvdB1yxBAUiWMyHtN19jl1Dz\/M4oTvMKzY+urr7W++PujRRzlFIY\/gETpAhhhY1snlllx6hdjZ4YuCx3JIb+vpyDHH1P36LPrugNzvB33KHwibrvK+EVC4cI8QuPPOO1999dUe2eIQWO8rCXhy8GluuOGG78kg\/WwANnb88cfDBtC6pb0PqgF2AjZy6dKlYGY4tWLFCthIhJEALQJ\/GhwiyGA9gOXYaqutYF0kSRo8ePCOO+6IMOLB0hCGv4BM4IrQxBtHsSzRsuGwOBKgqxLQ4qtWrUI8tYKwoFdffXWPlN8KMLGwfCAQn376KX118tJLLyFPEFaEoc0ef\/zxW265BdUybty4XXbZpce9aGlhel955ZXLLruM7tPwjWhpaYHVh7WmL8sKj\/ziiy+edNJJeDTUPCVexaC3XrNmzYABA3Rdx+XoLJQ6bLHFFiDWhRWM6XQaJYGXX5gQgAzRKAiAsgDERTTNkSNHgsTgdlOnTkUMEt9xxx3gRrQ8xShevQm68N57740ePRrECxWy9dZbr\/dNR+Gh6OGPEz9tTrBeoN82t7a0d3SuaWzMZFLjvxiraVJdfTXHMa7jaiEwArmrs7MrlULbkK32HK+zS587bwl6NMexosjD6ju2CyaBNkTzQVBEkUw+MCyDNidYArhGWVkipKlgDQ0NdeGwFuTm8gKZDYROZem6IPKaqubzdjSSVFUtGo3E4\/FkIjlgwEBF1pB7jLyDL1YQuJT6nf8xpej7RTDgjzvBqJNXAzxhCQJ5ncCbTY1txx1fOWGCRCYF+o0MI418ruxXp\/geTBEKx\/qc6zF4YFxONh1gWBxCnpAaLKJn4ZEti2deO1nhZ8kJNjvgwz355JOQQCoM+IXSQeDpp5\/ebbfd4ORRbQVA9+EQAWjGXC4H327PPfcM8ijhP4AqQh3C2p1yyint7e2FXoZ4\/A4ZMgRmlcasF7C+dNgcembs2LF0G4POzs7x48cjBrYBtme9XA20AN0f\/isCcLup3wyLi3ak74agUzZlgAcpC2Vua2sbNGgQ7v6rX\/0qFAo9CoLOcfCO1muQvhWQJ7IqnksBnQZOANGCiQVD6tOnT3V19bJly9ZVU7Qmi+OLy7wu6Fm43aAad999N926u3AJYi699NIeqzELoMlQ83Rpz6JFi+hXJW3bBidAgWH4t99++yAtc\/DBB3\/44Yew+nSfCVANEI7zzjvvwQcfpAkWLFjw8MMP33XXXcOHD\/\/qq69QA4hEm+Ixb7vtNlRvZWXlb37zG0RmMpmzzz6b0h2wGWRVvHkDPEYQC1xC3zqhkK+99hqYSmGdMH2NiNzwu\/HK+eHxs+IEpHJhaoqqd9mKBU\/\/83HPs+Hux+Pob6xpGh0d7a5LhtHQ2KIkwPVfuappxoz5kWgC+hYawzR1DhSAzPVlXNe3LFuUJDQzVLNtWVRQAviWabmeqyhSJBp1XQdEobauuqamCrdjfC8cVsEVTMPq6OxCoVRN1fN5EA50fteC3nD79Onbq75v7z69I+E4Cp+IxVSVfNrkhwQx1cE\/CDisJwavPIjtJifZ3Jdfdu67d21O9ziyzGBNVVXkjVdjO+\/m+S7HEjbjeGAEvkCrHWSBmH2wBDfgDDgPA0Z6BXmz4JNQNycgsxmDO5SwAUDNQVtRR4SqjEJXhfsChbWu+wVrhF8YPPi+cJvWdapKoPoXqh8GAxVV0MWIh\/3LZrP9+\/eHc1msowvVDmxEd0M5AAjAWkyYMAHWGokRhqmgHzhGeOnSpTRxDxAPI5g7stNOO8Hpx4VoO1A6urIUdgWGn\/q+6wLskFopinvvvffCCy8slHkjBd4U0Hzwi3yKs6KrFTa0qqJw9wI2Xgya\/1VXXfWPf\/yjrKzs\/fffp+478PXXXx966KGNjY233HJL4bOf6+KDDz5AMlTgihUr6JcgcAm4C1oBPYXu2wjsv\/\/+4IKUE6BRkABdCfYeRAc5vPzyy3guWvjHHnsMJp9eRUFfYZx66qnPBptdFgAKDr6CVo5Go+eeey7u\/tJLL9ENIe67774LLrgAAQgG4tGO6JhgNrgRigE7gjp86KGHNj4x5YfHz4QTUKnCoxDRC8TPtHJvvf367NkzJAXWneU4XpbJRgXwDBzXDUUisOywfqqmxaPJhYuWTpw0NaxEfPi35ISPPgpjZzsuL4rZXB6eryqQwXXTMB3HlhWFFwTHtmybUAQP7jHpMrgxa6MPc6zAc5ZtRqPhWCQiSZyqyZFopCxZxqEkPCsIIqyn4zqe6+uGiTjSCB5bUVaeSCQ5nq+qqKohmyyVVVTQz4IVWMimAbltoA+uPRMM8ZPmZ2DFWbISgPMD1779k4+za5p7\/\/pUkih4qdH2xOPs2efEWZb3ffhEqd\/\/vu8DDxChIUstwBMYXIqqQQMgkrABchdUBocQyl1UEMI7vGCRQ1D3JWwQ8+fPP+qoo\/BLDwPZJlV+\/PHHQ0vCdOEUVSVU8oNUJWwq4ESeccYZzz\/\/fKFit9pqq7\/\/\/e\/HHHMMzDAYw7pVSpN9l6qGDzBjxoympiZkQueZUooAgwETQvcn2BBQvLq6OqgaMANwBToMAHu29dZbg0M888wzsENwWiAecFjpJd8R633egrAdfvjh7777LmrsyiuvpKd6gKbcxEqjiWHF8ZidnZ0wnzDeMLQTJ06Eew1yDOM9fvx4+hZmvQCZAKXAVeAT1DWfPXv29ttvj7ot5gR0HiLlBFOCPR+HDRu222674S50jiGqFNzi4osvLmxKhl9a\/j\/96U+33nrrdddd95e\/\/KXwdPi9\/vrrb7zxRrTChx9+OHToUKQEbrvtNjAYMDw8Ag5BBXAKlB0PSL9MXQAK3OM7W\/9zdDfbTxRriw5jA0tDhqwDE+R+9dUXEyaOXbp8aXV1lSyTj5FbloVe53oOWbVom2ooDPMUj8QlUW5c3jR\/4ZKFy1Z4WVvVQowsyIooCoKkyDBe4AQwfb7ns57Hc7zjgFG4MJ+CJFmGjurDIctzoiAi4Lku5Iisb+Q4UAcURZVkEElQAZzTQhqMoaoqiqrEY2EcKrIKXgwnAVLH82Q9MZwJx7YVWWJwR5ZJxMpww1gs3r\/\/QEVWIuFoIlGGP0nqsZ4HNdEto6QyEEBFdJvd4vZFGvwED0QmFML1xyHKjMrjUXNNDz3qXX6Jnddjb78bP+xQQhyQiesv\/dVJZS++hFSpk06suesevroquM16e7uHi3zHdtraPbKRMWKC1nE8IRLl4jEQC5+MJXDrubSEAFBb8PxgMGj1FnroHXfccdppp8FlhALqoVlK+LaAawirg6pGGLbhlVde8TyvX79+AwYMWC8n+F7RHAA3hXr5\/PPPQfgQRnlgt+bMmYME4BA4pImLATNZX19Ptw0YMWLEdtttB76IlHiiLbbYgkpO8fh\/D3RrjCIZK8QACEBtgnA0NDTAcBbc2dtvv\/3yyy+XJAnFK1jB7wh6308++eSPf\/wjdbILACGAY02n0G4If\/vb36699tritwCgAqgQ8APwMFQFjSzmBK+++mrxOoidd94ZLPy4444rTBEFCtWCstFhDLq5ZKGWurq6hgwZAtZSWKgJbgGu+fjjj8+dO\/ecc86hn6t49tlnf\/3rX5OMGAZtdMIJJ0D20JfxpCVOsLlQKHO3+MI0w49FoLW9afy4MZOnfMWLrCQJ4XAIjYeWg3DD4sqqxvq2yDPkXYAaEYTwjClfz\/vqa0+S8r6fa0pJoujycNth\/sEGBFlWwtGI4\/qWa4cSURhv3Bm2nwE74HnD0JFWJAsXGRtOv+fCfMo8eAP57AzhCiwbCoXQz\/PBeifiUcNBRs93Hcu24EmjX6FXS7JYlkyGIyGcjcZiES0UQbEZRs\/rmXyX55HJrnouj2w9x+MEPpEsB0UIh6LgNzXVdZUVVZHIel9DkgH7tVUU\/IIqIIZMHEBd+R7x5FmEQaZcx15+4w3a326uCpI2br1lctRnYlkV5ANPYXW0LDrqyOROu5ffdLMgSyRTMlOQjBMEmRchuKHR0rR4\/4O1tlZX4gnzYD0rZ6q\/v7j3DdeQ+9OU3f+U8B\/45z\/\/eeaZZ1LhoTHooXAB4Z3A85g0aRKUFxTxzJkz6dkS\/mu0t7dDocOZe\/HFF9FP6YwzcAKY5KL3g\/9LQAzofAXIwNSpU2fNmkXVNWzJl19+iQD84FWrVq2XLuCJoDeQHjYVHjPECeGtt956l7U7NFdWVtJh9o0AxBQ8CQEwjyOOOALKasmSJfR9Fowc6EKQ6ruCPhSAQoL9wGa\/++67sKlgIaeccspZZ52FctI0hU7RA3SiAFLCGNOY8ePH77777qIooqcMHjyYRu6xxx7jxo2jnACWG7\/I+fe\/\/z0sNLrVuo1efFP0yqeeeopyguAkAV2gARsPq\/\/BBx+8+eabIJf0FR4YyWuvvVZXV4dw4f3Oqaee+sQTT0DtI7zrrrt+8cUX77zzDu6Owx8PfoqcgHYAtBNxVrtBZgLmp03\/6uPPPspkM8lkmQonXOByoM25HDx1PCZc\/1BIc1xLVmX4sl2tmXnT5ufaUyrL5xg\/yzIty9fEQ2FZVdAPIUzkrb\/rgVWg46UzmVBEQxS4AKy9GtIkWbJRdSzZGYkJNseQFZlKj+U4gsDrhgE2AKIK9oCAaRiCwKmyYtu2Y9uBZcQfsbjByAL5I746y2iKmkwmwDZwqqq2MhTWbNNSZBl9nH7WwfZsXTds0yF7LrlkkXqvhl6SKOdzucGDh9RU19u2EYvFy5LUvvcAqT3cCmfABDwUmOxK5INtLLv4wrIHH47BQWGZjOd3HHt031de9ViOjCVwTL5xjVYTbPrm2wx5jQAisZ7sySZHLGusWW0O3jKeTQeXEjgMkzn\/gsT995GOBqkDPSq9PlgH9957L51gBfVEOyZ+obbeeustuuppwoQJ8Nig1hEgF5Tw3QAnEjaPDkp\/\/fXX8OHWfWH8g6FggQo6meqT9YLyACRYuHAh3UYT4Tlz5sBhRRjqCA5r4TNg60WvXr2GDx8O7YTbgRvRxYdAVVVVwbEGbrjhhscee6ylpQVKrDsq2BcBkYlEAtdupJCbDvrI+C0YZjwCykbDeFjcZSM3opsYwvOm6waBjz\/++MADDwQrQuWA5yEGGcIMg0sVvzsYNGhQ4Q1dAXhSMBLwp8LTwQSgTsCQUBvXX399IZ6+UEA+qVQKDRFcTba6ApU555xz6MpPAOTpjDPOAOMECSg81Lbbbjt79ux58+bRrZB+PPgpcgJSZDQJLTiVk+bWNW+9\/eriZQt5gZNVLRyOwPnVc9mWpmZFVcOhUGdnpyjw0Ri8dl+UQovmL5n51bSkoKqC7DMcCIGpitnWDl+3JEk0bTuvG7gRBBQ3wq9lmIoo8QKx7uTeHKcbOiOw4AGSoqiahpYWZZJACYdg8wVJCtYpmBBEGHIYXlxoW5YsK2SEAFLu+J7nBoRBsG2yWjp4MPRzMguSJy8jBMMwJVkhZIEQDrG8vKyyogKmmBPJMuhIJAz3kTAMx9Hz2XQqhUAEzEULdXS0a2qooqK2ob5XWVk5TAx8grraunW\/+dSNYJdH1vYa9z+wfOynAjiC73f5jPvEY5Vnnu37hDrwgQkPpgj4KL\/D+Pz6xv\/Jiws8QmOTPXTraEcbnipIQt4WpC6+KH73PeQpySiDy\/8idi36dnjuuedgkxAIxJuIBJT1o48+WlgG\/fnnn++5556XXXbZHXfcQWNK+O5AVaPCKd+Cir\/88su7T\/yUAUcI5pA+2uLFiz\/66CMqUY2NjZAi6AqApuwBqLthw4bBKcKF9fX1J5100rRp06A\/YUQbGhrg+MItRkV1p94w6K27D4JDGqCRPc7+16D5wEe\/\/\/774cTD6tN4+h2HwYMHo\/B0sq1lWTvttBOYHzgfelk+n8dT4HDfffe9+eabYaFhwpEGT4r+9dJLL+HCocFnppF\/Ltf94TG4\/vS71cgQ8X\/84x8LPRGJDznkkBNPPLGwzKHwjCArICL\/+Mc\/wCEKkSAEaAJUdZD2+0KhqPRwU\/DT4wRrC9z9mHkjO33GtC++HNfa2gKXOhIJkVmB2Zyez8EdB3iWTSaScNNdz5E1Jd2SXT5vuZExGdsydbKvEcOKWY7JCmy6sY13XEmWWJcRRMFx3Gw2A3caFhq3dF2PfGmJOPS+LEuWaXkO2TmRg7MO9sCjK\/FgA9FIFMxAENCnREEOBhs4mHofmeBKnAgKZYMLgB8ECxzISzuBl0A0YN+RueOQeYvw\/g1062DVE56UhSkmp8jmTIjQNLWsLBGNx0RJQLiiPEFNtaqSAQykAkXI6zruDrGjvAQFq6+rT4QToqxUV9XU1vUXOM+YMLZsp924ONlGFzBmzW07+IDa1avx0JzvLmDZ8i8nJnbY0WY8kRh3VAxLXgagLGSqIALr2HXUFMvoa1atHjAkpueQKIggexax511U\/+A9a4d2CK2joRKKceGFF0K70fBee+0FHUQ3h8chJP6ee+655JJL8HvRRRch8lt19RI2BFqTt9xyy5VXXkkVd\/eJnylWr15NhxkQgD8N\/YAaaGtrA28woCddF2HoKJq4GP369dM0DQnwC1MaDodxIfyTAw44gNpdmFW6vu4bsRmltzirQvjT4BtUhf0ZKeCp4\/DJJ5+kI\/kTJ048+OCD4eIjDLoDgDDhkL6vAaMqDBWgWvr27UuHXqhbT+NpZ8SN\/vrXv4JVwEnDqcJZGgbARb788stPPvmETl38gYHC4Le4PBvHT3icAKGVq5e9+e5rK1YujcbCMMOyJMEodqXwX\/d+sa7jiJwQj8ckmbjdKxasXjxzQYhXRF5wXbIQkeHYzlQqxzK2IrtpPdvR5cB95wV48TDqpmXA2BNx91nk4\/pe3iR9Bm3vkxmFHnpOKBSCgUcABbJsmyOzBGCCyVbKqFkPbCOfFQQhHI0oqgqOEOy3KAgKgqLtWGSmvs+iL3mOR6YLcFwmk+F5FrfwXNcwdeRM9kxC8RzXBBEBsSBTHcn0fpdxybt6z1dkiWd827JisVgiEUsmy\/C8YDthsupBgqNP5vuzTLorRdZa+hxuXyMp2475sv7d93KnntB+zmnh8l5ROaSVJ4X332RPPjvpuxlRtE4\/M3b7LXwsBv3BEdMezEZkQQfwrISlkLgeCHqDm8+0vPommzd8iQ7nOJ7hhLbbMbbLCEKvCH0h\/5WwLsADjzjiCGi0k08++aGHHkKDFnooZP7Xv\/41vJy77roLyohGlrC5cP755z\/44IM\/J06wXt2+EdsA54RyBRjF8ePHwzlG4vb2dnjh9LMdsJcbeh+BlFCDENc999wzGo3i1olEAhaXMlpwiC233BIJulNvPiBzAHcHisPQ0q+88kpNTQ3KQ5Mh8t5773399defeOIJkBsaM23atJtvvhkpaW4Ue+yxx1VXXQWnH2lwiGSrVq0CP0AlzJ8\/n852RG1AVz\/++OPnnHPOPvvsgw6LZMHV3ViyZAkoFx3h23333VGfP8LphOvFj58T0OKR6kZJg2pHDOu41tvvvjbxywmsyETCajwWh6nLpnNguILAi2Lgu3M8HHWYdrJxUCY3dcKUfHNOFsRsLgMTBzENKxq6QUbPd+h5R1MY03NyOjxxuNrZXNaBNy9yrke2oZV4MQS+EQohfS6XpZN3iF3jOJhz8IB8Po+SiYKI4sFsWzbZlVYGmWCZTCrNszz4B8rNCzzscywW9zjPdmxJFlWNTCnkBZEsTCT7lojgGnDuqTCCuED4CAuRVfK1BVABnPDI+wsQBVAQ0oWRzHPJOwjTgAePBzZNE\/KK7FQVdl5yOD8eCtVUVsmRUK+aattlys3soH\/9a9DEeVGGaWaYj487aO42W2mS5Gp8L618y0dGVs2Y0XnGieErb6yurdHAnFzwiHWXR5OG6A6uhU++k4SeT7Y07I4qAtnLAEmCRYvrOV1CgKVLl0JzXXbZZQgXuifVOPBvnn766fvvv3+93zgo4buA7pnzt7\/97ZprrumO+umjh\/zQQ4QRoL\/Bye6z3wgoIhjRdPCdbrguH374YUtLCzIBe4D\/vfHllEOHDi0rKwMtgOKFY00n38Hzge9OhxY2sQw9UHgEYENPRB+2+2AtiiPxUKBB0O1Q5vDx4NbT+EIaEHHQ8XA4vHDhwurqanoXnAJLAFcAY9hqq63+8Ic\/gM2DA+Fw9OjR11133fLly8EM+vbtS8cn3n333UMPPTTIeLMBtmnu3LkDBw5ETa77jDfccAPiN7RedEP4kXMCFM4LPMpgBT9aKDAls+ZOGz3649a2Zo7zedhA\/HF8NqNn0mTPUZVsHsBwAi\/JaiQetSxn0az58yfPSarRgBBkFTLRz4LT397VKfNCWbJsTWdHRmAdy+VNF5IhCjzHobqdYLSfT6XTkiCST\/+g1v1g42vy3UVk4JEX\/6KsSGT7I9SkGLw0QCF120Ri2HbfcXmOvF+A64801FpHIhH0KEEU8GjkCkkMR6OpXMb1nEgsosginHrkiqw5nixJQlfEc6H5EYb7L4sC2dUAdzFNQZBwOxfMBfTBsXCvaDhkmKalWy7ZNgnMw\/IFTmYFR9eFsBZVRF8LDe\/S\/zB6bDkqgTyRv6KqeupvT2ge2McyjEzOirS3JxsbW7cenLXYhBayQcB0r6G+V31D75rK6lA4qmphLRQW18f6yZQI+mqB9QWy6DDYoAjxjMt6hCe4QTyhE6Upht8e9MXkhOArt91RJXxnUNV\/xRVXgG\/deOONv\/vd77pPlLDJaGpqolwB\/GDMmDErVqxAJHTpl19+uXjxYigueE3QfjRxMWBoy8vLoVQlSYJPP2DAADQHwiNGjKBLHqAwi7\/RvBHQdiwObC7A4z\/22GMPPPDAv\/71r8gcMYX8J02adNRRRzU3w7ci0zNjsdiaNWvo7tf77LMPeAAdYwATAvPo3bt3cNFmg67rW265Jar3k08+ATMoLhtdn4kA3csZpwCcKpR8Q\/iRc4KeaGxcMXrsqGlfT+YFtqwsCUPreX5eNwwjB8NJFgV4nhQ47tFoHL55a3Pbwq9nNy9ZFVE0NRwOqZoqK3DcW1qadUOXNBVmKhaNtqRTaYE1dTPV3C7wgiZLZDMilpcUyfU8QzdkGGpRyudy5HPJspTN523PcW0HlliWVYEjc3dRPPJOwSeDAZIi+4yvZ\/PgAjzLkSEBSYJYoNvAtCcSia5Ul23Z4VAI+VuOrYY0x3bymQzZw4B40gwIDdpWDCmgHsgW9wU9gq2XVYWXBcM0wBjABFAwON\/gGqAGhqmDGMiywvgsWXpp5xlkIIaC6YOubts4LTqGx3MRRjp1ReOvVy4VwDZwP4\/5YsjAF3cZnleUmsoaXuZs3g+HZZ5MYHQZx2cFIW9mfccTBY3lWZCByoq6hureoCug1f37D4CcoetWVlQJ\/AamMVJ4jMeBEQQjBZu10\/4SAAnffffdoWShgOjOuCVsLqD\/QonAhqmqCvuEmG9UnSVsCqCQYSBRvfCIILrwmxGJQ\/DamTNn0mpfunQpktH0xUBDwHGHF7TddtsNGTIEGgbYeeedtwm+XwD06tUrGv3eN35FISEMKCHujl8qGMXiAdJz5513jho1iu6KDXUNZnPqqaeed955KB6duzp48OB58+bR9JsR0AkVFRWoooULF9L3jCgYqvTkk08ufMO6srJy+vTp1dXVtPDFJV8vfjKcAIbv8\/FjRo\/+JJ\/PKqocCmmqqui6kc+T3d0VBaZQMCxTkPCfoqohSQ5NmzR18bS5bN6OxxMe56F54Hpnstm2VCcvcCCtCS2Sy+cdxuvMpC2y0k9JNbfxHC+yrBAs0YH1y2QzEAVSj7C9ZKMrToLhZ+Gj66ACEk+GBmCD4ZHT9kAjwWCTTyQpipnXyUgAIApgA+AEtbW1jY2NEHSk9F1CX3L5XHtHBxxv3NcO3uehxeKJOM8LqVQK\/IPaTk0LcQLf0dkBYiOI4C28IEmqpkkqmdViOZaoyK7ngAqgmBzhKIzj+J6RD4maBVLCWDHL8k23ReIUmbU4MZ7O\/WHe0v1am8iiQI\/LMeyT9RUv9x9oMr7kOwzHhpIaeExYDFUlytWICnIB4cvnDZ\/3fM81s7pnkQWJZHjCdTU1hIdCDZN5j\/HypKz0zRus7ZC5ih6pHtcy1S22iQ0dQtqS8V2yQ0Jp3cG3A6hATU0NpBEihLboji3hO4PqwIKupB2ZhkvYFBRqjNYkQPTbJlcjTOmiRYuQGMpzypQpkydPxrUIw85t6OuUFH369AFXgEXEtcOGDSvsMdC3b1\/E0zTfHfShih+w+LkKj4nApEmT2traYP6LNz4CE9ppp51QvK+\/\/ro7avMBVbTlllvutdden3zyCY1ZtWrV2Wef\/eGHHyJcKNi2226LBGVlZYXSbgQ\/ak5QeIDFS+e\/+dZrHZ2tobCmaDCTjCSKuUwu1ZV24Cx7cGrh\/wug+dFYjGOEbEqfM3VWvi0Dw5PK5Ooa6uNhtWX1mrxpZnNZFZxCkdLpjK7r8UQM1ze1tDlhlRHEzqYW1mcVkXz0B0IJC+25XjgSRkXB9kHgwHbJ0gMWZth24LXDMitKSIVzT751S4ktimHalizJPMtl0mlJkdWQhrPpVCoSjpBPBCFzy6JcAXdBMfA4yBNPixxM047gjp7b1dVlGqamarwkoBZEScrmcmgwniXf10cBQEdAFPK6LqhyNBnTQhouR3OSOZIc73KCb3RxgppmvMrO7GmLlydY6\/EB\/VbIMu+zlu9smc79cf7iIV2doDpZiXuiT8PbA7fK2mnXAJXhbdfnbJdjXE4VrLwp8mpNubbv7gN22HZwR1e+M2fbrKhbnGU5ZIyAJfMqUulUOp\/JGVZNOnv0E69G8zkneEWAP4NhnN+fX3fXHaBWqiizZNfEfwMySAW1IIw4pOFvEuBfEDo6OuAhQQDnzJmTTHYvFSmhhJ8r4EeBE1ALNWPGjHHjxsEcQCUvWbIEhhYB+HXoDjRxMaBZ+\/fvT2d9gRzssccedOwHXGHEiBE4izDOQosGydeDgumhd6eHNKYQWTjcOKDep06dWlVVRbdJ2CwoFI\/uxnjwwQe\/\/\/77OATtOPLII+mnPmkaWtTjjz\/+0Ucf\/cYtqih+jJxgbY3jl8sbuc9GffLV1Im6Tmb2xWIRNaQYhg465hgOHFNDNy3TBFFQVMWx3GgoumT+4sXzl0YYiXF8R+Thr2c6uuBeZ\/NZ1KIWCtnk22UpWHt4+bD3tmt7LtPuWmnTaFvTDI8\/qoZgwm3H9l0\/FomgKGQ2n+\/BzMuSpJtGJpvlyOt0Dr6+AFsty0Y+j7PhcBhOM5z4XDZHXhaoqmXCaFrw7GVZgYirqqYqWiqVsi0TbYqUdENDESHCEETf9yzbURRVEnnE66aOuxsGss9DgvEsICQuChPshUwWTLpuKpPG0+N6TVNQdeAW5N2crPCaxDOuJ6m97MxpS1bvvbJJYJxXetU+PmCwrUUhq5Kq7r9w0dlz5uu89ExtzTt1NbImMx6bdgzPtEROVBXZ82zT9zI5p1bxD9u93247NiTCkseR3R6XNLY+9dpsXgxFwxFF1USBrO9QI5orKjWp1JE33hMP5l0W8NU+O352yrFe1qhMVvWq76No5JPS5EPs4Wg4tP7tVyEIm9bvfilob2+HKiwvL99EfVRCCT9L0LmNCCxevPiLL76gzGD58uWjRo2CSwblDQMBYxyk\/Q\/AiGiaBu+urq4O7jXRqL7fu3fvfffdlzhUvh+JRKCUulNvGPTu39gNiT7+Hrpq4e7\/+te\/TjnllIMOOuiDDz547733zjnnnDVr1hTuSJPRz2LRmE3Bj5QTBE\/lz5g1\/fNJo5evWBoOPOBQKIz4fC6bz+c81zV1o6y8DFY5mOvuqkqkralzwYx5qZbO6niZpoZa2ttEkQMzgJlXQmEXvrzr5PR81tAd10lGY7zrw+jCCxdZsdnKQYIaV65hXU8mtpl8jgwXwueG3MAqZ4LlBqqs5E2D51iXTP93BF70PPJBdCSzDIPjCQXxgu8lwvpDNA3ThNMP45pOZ13XLSsjE\/uQmyIHnw3iefADuvWPnsuHNI3hOE0LI7tsJgWiIGoK2qgr2FdRkWSUBz458jGRi+dFQHSyGdwlHo17DiLISIYARsyyel6XZFaWkrbrXdO29NiuTlIPjK9L\/O2DBn3aq15TFEaQtGxmn1Urm+KRSZGEBV\/fNDleMhmTcX3ftllZZnzBsHNhyT\/jkO12GlbNcGQXJp\/l8ISNLem7X5xpOLxrg8aAxyiEtYiSWllTl85c9da7iTxd4oyn4xjGnb7\/rh+feDRvGDnPzqYynI\/iSY7jqbI6aMAgVAJo04D+A8hbElYgO1GqG\/zkyS8QBS1AD0so4RcCag42Uf6JdgpSgjRMmDCBcgXwg3feeQcUAWc7OzvpJyQ2hGQyucsuu4AZIJ\/KysrDDjsMWh9hMIkd136tcdMBBk\/LvNl7Lq2WV1555fjjj7\/99ttra2tBDhBfuBES4CnuuOMOEAUas4n433ICeuvgGRAMZqPTB+pKdXw26qMvp04SJE6SpXAonIzHM5lsa0APPZTahbtsxaNRSZVZnnMNZ8mC5QvnLIxJISdnhlSttlf9ylUrXcfWwiHYKs\/2VFFu7mjRDQNtbJnw3y2yfR\/HyorIcXyHbXiK1rqmJZ\/JhuBwe2Q\/QUng4OHDWXU8mwtG7Ml7g+A7BSzL5608WdbosXDrRVHIZDII8BwYigeSgHrVVA1OvCKJYDCiIIK\/yrLMkVOekddh5lFy2HhFklAc3A40gnx0SSLUtb29VRQ4x\/MkQXIsC1WjwPUn0wiQkwh609neIfDke84QAuRC1jqyrAHzbPqqJmdzBu+yUkj2eO7gzvY\/ZTor9LzD+YLLLFcif07Gp8ajZDsHOepzDKcxoqrxnifzIg5Nz+F9jlAcSbZypuh2nXTgFvvuMdjxg2nDIBy67jtWZ8q576XplkM+CwlEo1HP9fO6nnKdqnT2xsUry03P4pEV2c+Ac9wpI7addPBBKhm5AMFhw1rI89xsJmMZliyRxRqpLvI2RxQlluHJ+EE0PrD\/wHA4hudD56wor0L9B9KxDtbKDep8A12vIOQ9ThdJYE8UhPHHgkJX3ez6pYQS\/luQvUvI\/92HFKTvwDVCKPjYKgQXWoDMLsYfVfNscCFNvYmA\/H93yUcm06ZNM00TWXV1db399tvpdBrqK5\/PjxkzBmHwhu6k62CLLbaAlsOFsLVHHnkk3doZ1mSPPfagw\/I4RV9SbByb60GQCf0A4wEHHDBq1CgQIMTQePxCheLpKI\/5Vnf8MXAClJiUl8xJhwPK+BMnfT523KiW9uZEMibCDPssHOhcNodmIy8UiH1x4MrDmqqaJoh8R0vnvCnzWlc3V8YSIGZw1smWw7IMHz3V2ZmIJ1BZ5M2TbSOLWCKGQ2SlqaFsOscLcFA9RmC68iYbi+e6Ul1t7bIqMa4It9syUmEt7vNC3s4KrAgbjFKCZ0hkrJ\/TDZPlyEsBkcxKZAxTtxyHrGXgBJh8ssuyKOZyWdwA5pzsQOg6WihkGGQLBDrDjhcE0E8UxnYd0AMyox8x4TBhu2RnJDmNx87lVUlGDB6BQwkkAbwBKR3LJt8tIA3toWy8RNgEL8q5rgzHuSGPtQSpU0\/HypMKIx6ydNE1Vk6w7eDjBtwYTb02FGsXJF9kOFEGZWEFXiEv2HiyrkGSPNZxbUbkeJnLHrLXgP136a+ovmm7KKNJvuNg4FRzh\/XI67NAPMCuXNsLhcjnpnTD1g1LdKzBpq34EsN7jkO4F4jSGplbFcyK5JFtWGmorwMVcGwzHovG4lEIAR7NI\/OQTRQDz+u6nqGbpq6DaqATlpdX9evfPxKJmrpZV1tfX9+AbFFmWSIbqBWjSKK7Q4XuAOnpDhGsPUv\/Wc+p4pgSSiihJ4ixgRFhgy+uM7D6MKjQ0cG311k4VhydSIzuBEcISQL6gPN88GoY+BF1sebmZuhYBKDQ3nzzTTAGalzfeecdnEIgG4AmLgZoAfgBGS0WhEMPPZRuYMBx3OGHH16YCww\/ngY2jh7meEOGnFR7cOqYY44prC8oJMbZ4cOHP\/nkk\/\/dxsn\/W05AENy\/+wk7OlvfePvVadMnwxxGYrGQCh9bgOvZ0dkJQw43GtYCBlWVlGgk6qLBPGbNouXjPxqtKeHyeNKHIbNtJAupGjxmhuOcvCEwnKIqndl0S3sb2bqAJ2PvcPQ5jofJgWNqWrogCTnTYuJRhWe7mlZm4VGz4eBDwmTXYdf3HN\/lORlFhYXDXzIeE3icl0zdVhQFrq0Loy7ySGaYFtlgWBRAS0SRtyy9K52BmYS4uMEnkSAroKUcA8srQYgsy9ThkXMcvHayATNZjCChUWA4YfJt8r1hVlVUCBxkFA8CPpAlPIMDY4XsgujAbEJCeEkGYRA11TX1ess8y9YncvxnkXhE0XIsbzev+YuePS6jk7cPjNMU1y6NJqe4KuOj\/CrLc6aeJ7sy8Lzrk12PNEVb2dISU9gLfrPb\/ns0gLyAD3jklYjtWBaPvs2yLV3O0+8s9nkFMWgUNB8Zr\/AZQ3dMRImsKkfRIC44XJ58PAI0QgRb4Rjf8aASbJwKPrNAJiEGUw5jsWg8EU8mE+BJOJRQEZIgCr4oiWRkgvEzmaztIAPwQML58CzJeKK8vLyhoXddTQPkKBwKJZPohOvvSBsGGhr4dl5LCSWUAAqAfseRHgR9CGIQbE+CGKgZDgeM07gmv3JFeMhWfDRCuiX6PE+GJskOrzj+tj31fwHqjyEAGzR69OiWlhbKFT766KOlS5cigLOzZs2iiXsAKcl4MMvuueeeDQ0NCABw6+nWC8DgwYPh8NDwt8WiRYv233\/\/5cuX00PkTK35IYcc8tJLL9GdpxFJz246\/lecgN70328LfMabMu2rt959FYYnkYzDBYSrDK80n0m7jJ\/X87ADeEgyHU8QJbiHaijd2jV53KRUU4en2xFNS1SUp7MZsrWQz6YzGVjoZDKJbLrSKZhePaeDZ8Czx43IMAMsis\/ACSdbDzG+63mGabLxSP\/e1WWq09rS0taWZuDuW15zSycIrigqukW2BRJlMm6vaiG0gMCLqqSmurrwEJIiIWfLtiQypUDFKY4ln2EkuyQZueVrVhAqIyvkWUluIsw3mAGEDCwBAZh8WGJUB88JZDkvqRLcgWzFSLYuVhTIZT6fD\/iHmM9neEHSQiFcCA7kBRsgonAcK+ZNc2fXuNBxdsunp8vSlYmyplA5J8idRmqrdMfNurm1nlokqXdK4amVUV1UfYN8PiHg9agDGOtg32WBE1hJz7Qdc\/jWp52wkyL7pmuhm4O+WBboi+BaDuhYZ4554rUFrKDxpPPjegenyDbGDpf3rDyce0E1zZzLi2QPZk\/gLVZUWIv3fQO1JFhBqfHgeATbtkLhsA0CpecVVQZPRCFwSgupdXU15F2PZVVUlEViEc\/3UFHBq0EPvCSTTnelukD1KpKVWbIbBFdTU1tdVUO7nyKr9fUN4BYo2Ho+zVBCCSV8VwRvU6H7YOeJBYIyIVSA95m2e243335PaFxlLV+pDtpCr65VL7+sfN99ydpk\/IEY\/GgIQQ8j+F\/Y0ZkzZ4Ir0PCnn35KNyqAep8+ffrKlStp\/HrRJwB0HcJ777330KFDEUB5tt5668L3Etdbnnnz5h166KEgJd3Ha3HOOefce++9sBTI5L94EOB\/ywkAUuiWtuY33nx5+uyv4WBHozB2mijJ+ayRSWddWItICP487F80GmM9NhpLgBnMnTF78fR5vMVIoswjNceqkuz4XnN7KwS0PBrXDd1ybUGWbbjnjkM\/PZzN5XmBM0yDLFggk\/nhN7u4KhFLINBk6\/371vRJuH4+I4sSK0q8Gm\/pTMHuCCzfuKY9DfOedzwWRo43LAuGUFM18jaDfDiYDGC4jqtoPEwRKhU+vBaMWIB2rGxcDY+efAZBFEBJYBEdmFCykZEMG88F3yF0bBdmkAybey4eEHKBU4JARuY5joMVFMAkgsWQpqkjnSjLDMflc3nEyjyxo5Ymb5nN3tjVNjSbhzPO8PwrWuzGWIKJJnwj4\/jOUbp+kGM+5ovjpRAsvSZHHNtSFREsCiXAcxm2k8tldCNbkZTPOmWP3Xfqq4UluPM865L5DuQlnK8qoVkzZieTUUaIXHfrx7bLw5snH2nUyCccPAHWX\/YMQyWfTeJyehYUSJMEVdUyvptnUNs+a\/qcBE6GJnVZjgPTQBOFwiFRlPGYoAWoBEgFTqMeQK1QA5ZtQAxisSgYA+RcCyk11dXgfI5t48FDIZXuCZ1KpcGoDN0MhUJQVqi+SCRKXkJ47JDBW9ZU1dbU1ITD8FfYSCQRiN\/6UegUtFP9172rhP8VSk32wwAGnnM9uP02S8bZOFh6WPxg3KD9gt+HHngo1J2Q7KHuvvRS7fHHr1X9SPfzb6Curi66xSEwYcKEGTNmQCwhnNOmTaNfrYQZAmiCYoAlwLGRJAnhHXfccYcddqBKadiwYdtuu+2oUaMuvPDCxsbGIG034EfdddddF1xwQffxWtALN707\/G84AewBkQmW9xj7s1GfTJk2OZtLczwL6xKOkO9uZVJpz\/Et25ZlQVYV2HVVVj3Li0Zipu2Pev8Tsz0VVcOwwuj78FPpG+hMNoOck7FkRXl5Kp9NpVN6BiaT7CrYlc2YoAgs\/GGyoUE4HDaDaYa2ZYaj8Wgkmkt3LuzqGDyk35Byz8m3wnzbjHzMaefX9Bm0YP58yXONVNPChQtWrliOi7KpfKorI6mxTNZIpTM53crkLUaArZcEshsyWIpkO5bjovzktYLAS5zAG7aZy+ZAjyXyMUYW9w7DdDFkfyRREB3XRc50M2O0LmBbDuylIIkopyAK4VAYp2AqUUvohoZt5w2d7HwEkiEpDng65\/czneuN\/O6ZTs8LXj1I8k3h8JsVZZoYyhim6DiqwDUZTiykabJgGnYmnxNEDqyCfCNJVDiea29dVRXjzj3zgL33HMQ4OcdGRyffewTFQd2iqEuXrlmwcMl2w7dwfPHPf\/1AN3BfRib7NpKZlaT8AlPLi2d15mKul2FMzuVlQsi4iTWJ8Q214DeoAV6WPMMmkzE5UDQT9IjMvuTEYJgOdMtEZwDVhagEr0csMpIRbA5NJlVyZF9IsAAQIynYhjoWi0FOkLiqqkoFEVNVUAmX1H9AJyzH8xmyBaQsq7KGemJ5YeCAASEtjAJUVVTW1tSRvcDWswNjMIZCdF3JuvyUAJ1WIgQ\/DIj+9V14RC6UcBDj+Q4OUf+p0aPNAw+qJG\/7oDn8VcO3bRg7nguR78mhbcgUhF92z+rs7KQBkAOA6PZg+yZQB6hB27ZXrVoFD4mmKQZ8IfrlRirkBZMPNnDJJZfAriUSierqapJ0Lb5Vj\/hfjRMQLFux+N333li+YmkkTr76T5YAyFImlTENslmx5xEzEI2GIXSw3hXJKj2rr1q+JtWUal6xBiofBgyZqKIM9zyl50ANVFkui8R4DtbX0mEKII6WDQPcmUrppiFpqms7VRUVupGn7CwSjbqwN6S6uFhIWW6aoYi2fS\/RzbczPJN3lcNOvmjEvgd6tsfDC\/fItxAaVy6381mRsVYsXdDetErPZ9va2tasbsrlDc9nu1LZvM7C77UdmHw\/r5sw94okRmNRNaR1Zrps04JFhNUCRUhnMuhAUjBPFayQfNKYiIXvwUC75NsAeAJBJLs1w4rFEgkyRmHZYBygSTCHORMROUEgCw\/IqzvYYh9m3tvVzd9ppXrlPRfZMt6akHKjGh8fK+ckxkxbsqZKPJvPZFVRkcNqZ649kzPCmoYSm7i9a8Yk++yT9j7miG1Nz\/QYdGdilU3bhilFURfMX7xg\/iqfFbfdrh8jSn++8aNs3pNlOOSCAYLCcpoSchi7wfMeX7WqwiT7KBAJQwF99qX68gcGblUWjviizwocQ2ZKsIoim44N2oSnJ3SBheFHEDzAga+PjgEeAEIASsLxZLoD7gRTT0QWaoaMWiLAGLqOSlJVDToK9QMDjxxCITUUAq9QqqurOI4Hz4hFo3mTLENFObNgc4aBascdzZzeq1evutpehmlUVdX0auitaVoilgC3AFEiklrCTxnQcJusD0v4llhrbbx0+5KnRzYcf7xUU4MojmUc22gasXP119N5ltF9Jn\/bbeV\/\/CN5T8uSxVLk2l9YoxSb2k2x0CtWrJg1axYUIMKLFy8GV0in0x999BE9S3NYr\/mGAtx2222hvhDu16\/fySefPGLECHpqU\/B9c4K1mZN\/\/z1WpBu5seM+Gz\/hc9MywhFNViRwAijrdAq+fTaRSJIdALs6fcaNJKIgB67LSpy8YOa8xkUr6sprsrlcTs9BxTummdfzqVwWar4sFqsoK4O1h7eq5xANH9epratDbrPmzG5vb4V5KCsv91wX52B2NFVDDLxSVAB4A8f6zTBLsjCsXpatFOyN7nE7H3TKfkefZJo6BxsN8sv5ggQvE4aSvDdzLVPPpSw927xqaePKxWGJWbVy0fLlixmPgxnv6MitbupiWE7PWp0pXVJC2bwBl1UUFFEQWdaFeSM0gLwjkFAqwzDJdoeOBTcZlgptDlupySrZ8o8kJh9GAs3xLFuWNNfB\/cnkO9TDYCOzFS+OYrj2sCI4XN40f5Pv\/ItjSzDyKArPPJes\/gsnewqbUCM5XYc37sO4MhKeBhY0lc1GVdX3mLxlSUzXmSfsceDeW8ghz\/HJKwXT1g3dFHhG5tV5cxYtXrqSZSQ05VZDG6Rw+OobPuL5kOeBuwgw66gPXpBtzq9K557raCknr1eIL0B\/nk+G\/hKtiouKILGgaHikeDwuSQIhc+EQGB7+0BZgS7phghhAKlwH1UG+GiVJMgw5ukdAPsg6IhAY\/JL1TsFW6hwvRKMxXUfb5skEC9JbyNuZcIiMG0DIwa569+qthSTQgFA4LAYIZiqY2UwKNyL7SZh2Lpsjk0JEpSxZAfGoq6uvramFBEI++\/Tpr8hkD4buZyoCik3ZCUEwoTqI+S90Hiqsx1X\/RSa\/SKDWg6qybHPhgvm2Y\/fq1TsSDpOlOhskdkRM\/l3DJEjDRZElFCP4whmpHFJzgZ9PJJbTV6xsO+0EfuxE\/zfn1D35aKH6Vv7hktCd9yQZpjkaTnw1RRo0iFB5Mqu4O4FLJinCdeme67NWXfxssZZB\/TtAQa3wN2qMSy+99J577ilOjHDfvn33339\/hOmWDJlMBvoQIBcEOProo19\/\/fXug03A98kJunPGLxQ3S7hj8MgLF8398NN3V65erigq1C78OehZWHnT0PEk+bweiURCqmZZsNY+vGyBU5YtWLlwxrwQK4kM19LREoGEhWNQ6E0tzRkjLwiwM+Rbw5Av4uvaLjxaI5+tq6ntVd9LN4yJX02CrCXLkrA7rW1tsMS4llh4WGSOE3lW5jmX5VvzOVcRtu4TinI5x2RMzx6x\/\/FH\/ur8VC4N88n6Dl1xS+WZdAjQXTAE2DSYVpaNavz7r4\/8\/N2RIYZzGScci3tSXItGs51tLU0tZETc8ruyRlNb2vY4y+VMk2zpA4MPm6cqGpx+lmdcHw+paIqEeMu2rbxBxhkEzmFYz2VF9CiBERnBZwSbMxDYNpu\/PNs+wPH+KGlvxDWGvPJXI5Zxua3\/Rs8znjddCd2lqpOTZXpWl3iOvADgiEcu8wraPq9nXV8Ia4pt2CGZOeGYbY4\/ZnvGs4INozmH7EZk+Z4ri+rUSbOXLFkRiiSgYsHRthxax2nRP9\/4IW7nOKYiy+TTDAwjckLac+Mdnc82NVaSmYlUykm9PReP\/yVeKRMG5hk522JcVZY9xwUfwzMCLC9wgiBrKi9LCIIzQW4s0B+WUWDXGca0LFEUwFEUWWU4FoVDg6LZdV1HJcL6Q2AgP2SKiM\/wosCC87CcbZH5ChY6CZE\/cjuYduQZjcUi0WhIVeLxcDQaRc4cw5KBGdfJBCuOQBps287n8xBO5BSLJ1UlVA5emSwH\/+jbp288VgYyhMjgGYvRrdyCzhVIC62GbvkpoDu2CD0SAOumKWF9QFWzbDrT+dZ7ry9ZshASXlVViZ4ZjcQqK6tj0Xh9XS+RvN0TQtp\/TPMmuunfP7SxvrGZfpEgtULWEwY1RPSDT1wltn3s553n\/K5+wVyFYVp5iX3+mfITTgrYA9fx6af+wQfFHLfp9F\/XPf0MJbzU6qe\/nqbW9WHLozhkofiIhQiacG1XKQH1AZAaYdlVq1adeOKJMPnd54pw9dVX33TTTTTc3t4OM4P04Aeff\/55V1eX53nDhg078sgjaYJNwfc8ThDkTR4sWEefz2fHThg1fsLncF45no9GI3Di4My1trY6ti3yku95lpGHAx+JhT2YW17OdeXnTZ+7asHymByWRNmwdM93ErEEum0mlYY9lzSVDMK7HgwGFDT8S\/iKITVUW1MVDofhJGRz8I11n2ObmhohklDxKAlZpwEvGgJKnFNP8D0tGs8xfmOua+s+4YSk25Zn+17twJ0PPeG3FbU18LclnmyfALcyGOEPhq7xDyqQrL\/j8ZAhVfpi9Hvj336CzedN21VC4WjNkN\/8\/g85vbO5vbGtuXnl4oWqwGbTHWtWL8\/lza6ubEdnpjOVl9VwXrfbOtI8rzg+3F8hpISIioK5I1\/38HlGZRle11Osx6rRkGPoDHx43jkuY56lO\/30NGzQ7Ih2Yyg+U9FQnjzr9E5l77Gtdpa9Uw0tEEAzRCtnw6+WRZyXQUfI5xo5sqCDFyXdtCrD\/G9P2n3PPftIIcG1eZbxTNewHQfFCMnK1Inzl8xfUVaVyOl2sBTC3WJoDadEr7zuXc+XEokYBNEwyJefZI53BJbp7Dwlk21A1bq8QyYA8LLLTYiEPwxr+VQnh1uLmg\/ihJr0yBpFBMjHpHgBFp0TRC0cIi8KWJYTOFYWJZUwAAb2n+wLIQhgD8FmjpAZ6HhIsJ7PCzxZOYGTaB2wLwgVTz5irUKiyLKG4DPTaD6yapooneAn+IYF63uiRCajgJRoihaLRZPJpBYiMxlJgcAgyDJRGZKTy2ccmw5UGGhu0ErC3jTCJ8riZf36DdDUEES9uqp6wzswBiLT\/UvVY0kDbi74k6dOeu3Nl1neCwXfCQMNNA1DQzNJ4Pxk\/SyQLC8vKytHP6qoAGeogUsSjyc23AZUNxZ+u93ZDaBYkf5MmzXgTsGzkS\/CwYSDRreOHmMcdlhdPkfE2WOWJeNV48eGhmyNBFauq3GbYcySFRUffxDa\/yB6WWr0KP3hh1rffSd+z929z\/ot0aS4EnoUF5D\/KWcogdhN\/EJVzZkzB4Rg3eWOdXV1q1evBiEALeiO2gAot+g++CZsdk5Ac1vP7b+e8dWHn7zb2t4aT8ZVRUUxZVmGD5bNZtFXUQzPZaDZWRbaWdQ0DR7j0gXLZn85i7Hc2sqabC4fDYdZx2nr6oQ5zqTT0NjllRVucMe2FjIrEJnAOPFk9r5YUV4GAcS59s4OqHtErV6zCneE9odOLysrqyyv6Ghvd13PMfXyeCKWLG9Mda7OdAzuHaqSbStnSJrUmnE9MVpZU6mpyera\/n0HDOjdf4CohVge1iBE\/GXbQh8h2wq7ribzKxfNeOOftzrpLtNi5JAiV2xxzh9u5Mi6fxGi71gGfNFcLtPcvEbyM6mO1sbVq5cvWmzkc65lt7e1m6ZnOM6ylc2tnbA9MsgGuDjrCS58Zt90PNvx4N8LOTj1nhfmpYsF9tK2Nsay8Jgsz74fSf45HMqHyL6NZiZTbxqKVtYYUWTfFXnFYxnby2a7srDThM\/gB3TDg+rU42HuwjMP3Xf3Pg6TdVwyedgin2g0YbFDqjZtwtxFsxbVVJY7jJezyD5LqLOBQyqlSOL6mz72PDkUUuleYDDXRjCzj7VdzhXjqsbw4BC+xmksr+Q5O2OmeEbkGAnchEPdWZaiqqIk5cnmRAZx3z1GN0xFklVV4TgW9pxMlICssJACh4fZDoV8gbxfUEMafgWyLyQRHvAnCD1SElLFc4QEuC7yMU0LbYOOBZoAoZQFBRfhvq5DVnmQoSXE8uT7VXQGgwM2YdmCSIagYVroUpFINFpRUYYiRaPh4HWDgTBumclkPdfHlXoOPITs9BBDChAKWUFWsVi8oaFXRXlFWbKCY8mUC9oRNorizljoSpvamX\/h+NdL\/7r73rvqGupguxVJQkNEY2gHLRqJgECi10uyJEiQDYv8w4EIMrFIDLImsEJlZRX+KqAVyiogGKTDrovixing341TOP2zbS9oAB5EINhfgAAUAU\/LMl0P3+ucd3E5PAkOXd9vOXD\/6pdeFWJRKHVjziKzvTWx6w6u63e+9pr\/2BPmuPHltokMUv93dPlLrxJbFRANZIW\/EiPogbfeeuv0008vbKDUHcswd911V3Nz8z\/+8Y\/rr7\/+hhtuoKeo4Ue4kBi\/MK\/kgk3G98EJ8EcKEZQM\/5JNgl974+WJk8ZqUVULqdFEDP4a1H0qBQ8\/A12pKAosCivy4UiIkwQYBt7i5k2fO3fK7LgWtV2nqrwiHop6ntPW2d7YQpZ2QPkqspzV81DiuXweYTJNzyFfRSIW0TTRrX3fTaczsH+uR+awRcIRaPj29nboiYqKCiP4yDKIqSoL8PNYnl\/Z2tyYT\/eqUfsmRDOTJe4jw1mOb5p5eKw2JzLk+8QRn1e0cGLAoC36DxzcUA9nmA\/Hy1QoF1FoX7346TsudTIp3XTVkCBXbnH6pX+FR87CHQ34NX7JywoSBZsElu2mOtpssvqOaVm1dNWShWsaV0788uuJk1eyvEw2N7IdlpM4ieF98jbd5UGqFZexZUYEL2nwcn\/JpffLW2RTJTLpIHy36j8mR8VQhOFd3fLguWrkVboKFUlWUIpca2tHe3ML2X8gpDiWb+e8ioj3uzP32mefrUE8XC8rMITnWJYJlxrtMmfa8nlfz68t18B\/XJbLO2g6DlU6aEiVFInffMfnpkUWfcDKijCkeESWN3XDNfOMpuZMPJkuodoUKSSSr1QZehaMTIDChQ8eLDUkmzzIskk8exArhyzO5EXTsExDhzEGmYOY487gB5YNekG+vkhmGEBrc2TiMpkyqZBPT4E8MRwrBeszeUkwTBOaHaTQtC0IA26hamQ9i2uT12woIWGQHvm8NYTV9ckkVug5CA+kNp\/XXdcKxo880yKbKkKiUCEoLagAwpDhmprqRCIuqzJ4jEw2uib0kKwVZbi8nu\/o6IQRQoEhG4l4MqSFfbIVY3Rg\/8ENvXqXJSsh7bFoJNjOoQe6uzE9oF2p0L1phy9hQ5i\/aPH5F11APlyGXu35tmmGyMtJ8hlVWZaSyXg8HtPCGli2CnKALkh2KxchomB1sFiod1lUIWDhULi+oVcsEq+qrqmqrGZZPqyRnVG6b1OEQkMRu1YU\/lkCz+f5Fnn3z\/LppYuZnBEduhWeGs8LP2vlb35X8ewzZPsz3++A83D1NQ03\/a0wrGC0ta75vxMiY0aHwcuJeUBles1bb5mcMZNHjw1WNAY7FnjfNBjzy8LIkSPPPvtsaDB6SFUBHOann376+OOP\/8Mf\/nDnnXd+208cfSM2OycoANkSIzh23Oivp09pa2\/hBRgCFiqU5ThT1w0drqEpiWQXYuhfWAc41qIkh9TInOlz5k6eVRevam1pzen5horqkKwgQWu6o7GtpTJZjmvRdbPZLNRuRWXFmqYmmAjYADgE8Gsdz23vaCcDhjyZPYDMiVKHQleIS6oo5FvGuq7HYjHYExtuspGz8mSye5eRS7FuTZUypDpk5vK5nA4qgX4ggh0InEA2LCDbABDb5Ti6nmfFsBKK+T4fq6yNlNcooUgyoqyY9omdy6WzGU0TuGivs664KZYsM7IGDCDpPmBtjMe6HoIwbMS3Bgciih98Q5B4fuGsSddfe9WsWe0w8mRdo8uz6GeiCpJk+CYn8fUZPe3oTWRaJCto7JCMe5elb2FkyeoEn23X1EsjsbEwuq7J81IoHkPuubwTFlhFEXwp3NLWlOlq5wSRh602jaTCn3va3vvvP8iVYRpF2TNcz8pbZMOESDg0e+rScZ9NHjq4H+dnYEcZScm7vBfsLT1gYIUSSfz5H58yrJzLkE3CJQFtqfCy5hGuYTMRtTOd8xw3GoqYLirZjMHLl9W8Y7jwxU3ddvxwOMRzIiyxlTdssAooalQ0C2PMoD00TQHnS+s5RJaXJfPZHNKgoUEfyMAP2TYVfYSs5AQVyOjZVKornkyC28Fyk72iRVENhYKtoMmmapqq2o5jeQ6IBmwAoaFwYghBIV+6Im+UwLYCZomzkBA0MQwGskLr4OkgMKAQEGnwEhTf58l9UQKUJKRpZWVxz7UlSaysKI8A4YjrOZlMGuwTJSSrK80c5F3PGeFwFJKJfOpqG5LJCuQBkezbt19leVUsuv4vmRZ6KDFiJWwQIHb2hX+8ZOac2WAAYFK26Sgqqf9cLgsLxHpk2a6shdFsisT269fQu1cd1BFOQTWhHR3Hc8j+HHlcYhh5sDr0d1EgYws11bWgCwj369e\/oryqrCzBgaevA9pQP9tWIk9HZgnkZ81uPOV433RqP\/lUa2iAmwLlbDc3r9xt596Ll1kM0zxoSPT+u5MHHMgwtkcmP7G+ZXfuvkfFV1\/SnChSDX3Ur74Qq6qhbcgCJWIwcI\/SSAEBVNMVV1xx3333dR+vRXl5+TPPPHPooYcifOaZZz711FPTpk3bdtttoSU2l374\/jgBs2z54nETRk\/6akI8Cfsbg1X1yGo7N5VK5fJZ+mFfOHWKokG\/C5IYjkc7W7qWzV7SsapV5MhOPrlcRoVW5shL4rwNtZqH4UnE4l2dnel0OhyJxOKxLAxwJkPml3l+RAvBXHelUzkjH4Jedh24iXSmGGoLxqa2ps713La2Nji1ZclkVAubvt3YvCafMeG8G57d6lp1NeGt6xSyvN2GnrdBAOCBGhbcegmi67lkCDpwCmFNYMoJYzBdHz6xR76o5NdXJ3lPbO9siYXVlBXafv\/jtth6x9q6+nCI2BuQALgkhuUwHllqj0OUCnVFhxIUTW5aMPH2m278YuJqIRSB1U93gVuARolZB4baPtxnLkhnv5a4qznBUrR4NNralTohn\/27ZYX0PCOKn4jiA2H1Sz6sQj44V+UlKLqsYyhw5lmZJx9jJGuEDJsBIatLcr8\/bb9dd+nDkS8euNCVeGYLBi+YXjdr2uJFM1eKrNNQWw4ek8mk4pUVTZ26DTLveX16x2OV1Zdd+3Y6Y8G1h4EE5VEkSQ1F09k21WV24UQ7nXFEVhJUxvFgZLMxZXEorFseC+Ps667PoSpUhbjvEADQr2hUgyW2LTcSjUIq4YWnMmnPckRBqKiozKbTqHlDN3yB40TyRQm0DqghTDVUEoqU6uoiXyVhyUaVVAJd3wfTAktgRV4mkqSghVQytEDcfZ+DtTZBGZE\/GB7Sw2oQOw8NZlngJcgTFzlwIuEfWSbpcCzrub4giuh\/wZpG3I3s1gqpI5eTtzFsNBICK0BWYJ9l5QncFJSSF\/k42USBiBAEVlaUdCptBEtVQQ5xYTyWqKqqsg1LUdShW22tyKrjuFXV1eXJSvIkJXwzILbs5ddePWnyZPA\/tAlZ98tzoGVg94ZpQD4FkdgnNG40ou6w\/dbJeIwT0E\/8cCjSlUrNnDkT9DQWj9fV1nBkvimZboKmcSyrs7PLMs14JBFMT3GqqqrRTLKs9O7Vu7q6rqa6GuHAmP3M7Rk0dtuLL7vnnV\/R1Qbb33XaaTX\/\/CcZDPAdhhU7P\/2s7fBD2e23q3v5DbWmCv0Qis0jVUJeNjTuvbc2ZkxO4m1ewQVQhWtYtv7Nd+oO2Df4sC3SsTxpQ3qrXzqampr69OkDBQWVUrDRO+yww0svvdS3b1+EYdR23HHH6dOnr1ixogHM7EfICYrLBH9s7OejR4\/9NK9nVE2RVEGWVfhDlm6l0yn0rmgUBo\/X9ZyqEp9J1cKhUHTJomWzv5ruZ+1kJN7S2uI7Tk1FZSgazjhWU3NzWFUT0XgmR5aVw\/pCWcMVQJ\/P5fMIw43LZrOgCzocPpZxGZ\/sY2iZYLWyLGbSGU3WypJlKBvioT3goYbDEduy80Yef2QAW5LBJBpzmURldJs6SXANx4P1YciWOZ6nkDlsHCcI8BUzOR0i7Lq+RTxHyDz8SwV2BY\/N+m40ERIEqaurI6SGHFZqThu8GEmWVfYdOChZWcPwUt\/+gyqra\/DIwax7CySDDJ4FexPIirBizheP33vXl1OaWOLBcK7HwvIJvqu5zkGZlotNO6GbaUW8StHeBSVQFd2xQVguy6fPdP13BP9q30ur8WQ03pbqRDWE0CgCbzKg6azKwgp6iWQSbuyaNa0ab599yq6HH7SljUdkPMH3Xds1YAZ9PyRrC+YuGfPhhK0GDMp2tpRXxsAo9Gy+oqZieUva8omu7N0LRqz2oqveyOleLAa7TjaVEsmcQC7jGZWm+VRTe61t50UyqA8NoDDcMxHl9opy3mV9m2UlX\/I4VJ+sKpZlQ3iCmUaEdKF9wRQhEYqmwXCKSCPJmqZ1dXWRD17AredZEDue5cHCUh2daGsInmeTbQzg\/cOPJ4P25FtRqDYwCod8CZO8QvHhx0PJIwGMNhJDAiAqqB81GoYg4dFBTD0fOdnBCzjfMCz49OiWOAULQdqabIXkgTdA9sAJkDlEAjEwIIiEOKEzhcNhyzJyuRxuB7JAyubjEhYctK6ulhdAX5ya2lotRGZk4tFM2ChQEN9Pp1LZdAbUorKiHGwplUrHYsnKitqBAwdBWkGWqiorqytqZfLtzU2ZmvBLxMiXX3riqadgsCVZtm3TccnKZGgYCBWZkUre8jh1dZUDBvRH10NrQhGpqtbRnlq2dMWUqdOz+bwsylVVFbDxkDRUeG1DTTiske0+VSUStEJXCv91QX2R118OWe0LCshynKaGBg8eVF1VV15RKUNgFdDynsPggZKkgR\/9qA81z8HoPwDpR8A29UUH7ddnzBcag1p1WqBi7r2\/5oLzkRbdl2eZ1HvvK9sOk2triVHBMyI+eGuKQMujT6mpNmaHbb1YFVmByNsOY4T7DpESZXScwGOQKa77mfOqTcfDDz983nnndR8wzG677fbyyy\/X1NTQQ7jWvXv3xu+yZcsQCERr80jUd+EE9MLuctARJAQWLJw3cdLYZcsXUw9M1TSOJ3v2ZdJZ6FYAXqUWUh0XCtSFAuUY3tCd+bMXrpi7BC4VrAKovWNavAVPS+0ysol4ErYG+afT6Xw2J6ky3eU3m8nyuIUkwdGkIozMoYuJE5ZJu76L8sAGkL0HGCYRTaAXh2PRfC7PczDfLi8IHV2dkPXAVMD7Z9HJV3d1ROuqhlT4gpWDmMJZrB8wVAYXaVnDC25ba5OezzE+mZeP3ERBti3YUFwoka82GjC+flVFLBSR21pSjsWGY2HcHE4k2ElWN4nJEBVJC5dVVdc29BMktbqud0Pf\/rhzeXlFMpmA85puWfnIbde\/885XhgfbJ8L2iHLYldg+Vv72trYt0inSw3xmVSTye16ZGo2EBRa1V21mhvvCWEfviMYlho8qUtbMmoZL+hhMEtkvkiPTE1BTLC+LCm91\/uqYEScct5OiMigWw3MWef1tokMKgrJ4wcrJY6dUJSOxcLyzqbmqoczj2HxXprK2ekVr2vZZx3b69I0lK2qvvumTtpQuyWROoiprMvmss5ly2V62+WqqrQK9Hl2diAmH9nshUXZNNO7n05oSsV3YUy8aiaLNIMqweb5LotCagAE+5zhoIKJEg5f95eVlXZ1dmWxGBsVDi3surCmoYaqzMxIOIyVuApFAdemmCZZguTbETJFk8lIADESSiNcfNLookeljgW\/viOTDE+QthKRIPEw4yyBz\/EFiTdsEReCCvaRQb1D6rMgjfS6XRxLLMCGoPPmsM3mTQkrpwsrAtDORaNTzyLsG8CTcDVUOikPmOfoMUiIV0iKfWCxWXV0J8QAFgRGqqakG+cAl0UiI53xe5LLZHOQa9ZDXyZerCANm2Oryut+cfnYkvP63DL9kkP7PMPMWLrjvwQe60qmOri5UJpk\/4nrk7SRZqGJzArv1VgOqKpOEzAfDA+jFbW1tnZ2pbEafNXsBGg3cDqJBXmCB4HsupIVwAscCpUvG4pIskjdD0VBZMg4JgWAIZGCJyWbTUASke7GsLIUhjBVl5b179UZPSSbK6xsaIuFoOBTtLut6QR+A\/NMdKkKPwyAJsE70ZgQkGeQfmtMn3zAkdyTFYhl97qzUvgdWNjVCHmHKm8JafMJEbeutfYbseMpucDYALP76jX3huYOFBwh\/n0\/1U8MFF1zwwAMPIHD++effe++9EGMaD8AaNjQ02La9ZMmSHrsWfkd8R05AG5Q0Jv7R9fxnYz\/5bPRHkJVEIhKJhoP1P3y6qwt9A48Dtg5TTeYZwmjpGUlWo5Fk8\/Lmr8ZMEh0mSt7CuhENljTc3NoK+5\/J5xVR7FPXwIl8Y2sLlGZZJJ43jUw+J4sicgNDRzmg1qGxA4eAaW1rwyHyycN4B6MuIOxlZWXECMDKBvwAbi6yUjQ1lU6T+YdwOkVek0FTnCUtzaHqsu3qRMU10L8N091mjyOOP+vCXCbtu\/nG1ctXLJnf0bTSNXLNjWty7U3EvAjk3TLqwCLzAWFU8MPlsjCyUEMcjIfLOqxAltGRMXbiSJOqgyk0Tce0fccXXFauru1TXltX37c\/LPH4T1\/74INpOYM1WB9WUQbTDgmsy57a2HG5nRVci+xDzHsfKuotkdpcMuI4RluXZfGMLCIxsUwsC2caZl4nH3W0oKg8XibTGuGy57NmZUQ764RdDjtiqAeDZXnBZspeTtfR4UVBWrxw5eQvpjQkKtSQwgpy44oVNTVlAstnurpq+jSAE1guGJVd3xAqq66\/6a7xrZ150zKgSWVFtnSdY32DV+vzmTcyHclgPUSwdAKPzLySrL4mUWZlW1RB8Cz4zrhIgAqAB4bGgc0LK1o+lwOJRAtmsllQNPj9MNXgwqqmQoQymQysKYCGg28NNxsyEItE4YiDJsI3hLSBh4JDGCYZbIA+w6NBDMBN8YcD8ABwHzK9hLzmNxEAXRCIBPEu5IKQSxSZTWWzYAkKREfTyGzEYFNnWQuBLugWmeGItnTItg2SazrgH2QAKZjrCgshBZ9BQxFwr4AQCCCp8KFAak2yOyehGHh01ya7XaDOYbrwRIJI1kNGyHuHUHlZUtXkurqq8vJyM9ggARmiAJ2dXTUVdWed8bu128iW8G8QWgZ6DvJJvp\/SumLlCsuy58yZu2TpkvaO1uaWRkHk+g\/qX1EWcyydF8TK8gpU+NKlS6EoJF7IZM2ZsxY4DnkTBE0lyQr5kAYZNQuMo89YhgVHREDDod1lMRolE5ZBKXv3qotEI7IixeIxNC4kxDZMOB4gI\/lc1sjrmhpKJBPwfEAOBEGuq62vq6uPRmKJsgQ8mu7S\/xvkjkQE\/+3zrc9GIglFYEfXYnNaU\/QEyCZoKGy5me0UtShULKkKlm179Cn33DMrcYZlHc9fvM029e++G66vJeIMWr1+0+8EhRahCch1RRSBPC3uRlQEXxojKIAIcyADu+yyy\/bbb3\/\/\/ffT+AI6Ozurqqp23HHHzz\/\/vJgrfHd8t3cHQXtSLFgy79PPPlq2YjGUKVQc2VZWVizThm+XSaVDqpaMx1LplOM70Jrk9T8xzP68mYuWz1sSF8PwtjyB6VNbLzO84VgrWptSel7iuKpkOS\/DcTSaV68hO8oxfltnh6rCRqiwEFDoMB6JRAJmPpsl4xAwFWSjfFlOZ9K2ZSXiCT2gDlDWOAtmC9uAGoS7abtOZ1eXYZiiJNiOQ5ZHMszqVCcfDw\/tJUcFy7PJXje9hu11wrlXkN7hEnVPNhH2XZ5l2tta16xZ0dKy2silyY4Dy+ZzrmGbuuk6wYxIX+BF1uENW+\/Scx6ejcxTM6EaYL1QAEVExSENnFQy2dAyLR0MwUOMHNbUKZPbciwHO+7ns5wWJVMPWDli5a\/obDm0s81HERiPE7h\/hsrvDIWdsABNIpPtw1noM1RrOp\/3RXjmjmezAit6nE32KPZ417SqIvyFvzl0n737ciKsI5nxyJA6g\/NKBFDixS+\/mK6n8yrrwbHRbbZtTVN5RVTkBHCCstrKNR26DePpubV1KjjBX24f094F22rCyAVLvHgpJJmM0Mc0H0mnK00HAgKFyvkcfN9ntMitkRDjmgIrkBcloghHDAlCoTC0cx7ak3z+ONjxGPWjkC9awVdOJJJofVJjioImJm8HggUm6BKkOcjQAAuKAMYDwiUIPKy4bRNfHK2JbKG20e4w4uQcT6RMz+dlSSLCAN\/RdhRVRQNADEAY6LZLQCqVVhXNgbEXIS2wDRBzNhSJooZ5EQ0rKpDgcAhOP5iBzzIQOfySd1WoZjIBgmyfAKHCZaZlQ7Q4j5BSiJMDFhZYGrARiALYFW6HkqAN8NzQua5tm2Q2jHroYfuDWCMmlc6g\/OTllM9sNWTYYQcdSwtZQg8U1GgPgLN+NW3SqNEfMwKjBtMP0f2RcvXq1RAtGH4Qdctmp0ydYbvB0pVgmgi4XsAxyBsu0Fo4ZLgKEgIOEVBNwi9xR9IuwUe5FFUpr6iAxwYpKy8nb+igfwJfhQiQkc+kU+m8bqhKSOAFDX6RFoIV7Ne3X3lZZWVFdVl5BVpZEmRa5m9AQWeTx+3W4JvXw0aeNLuud95r\/tsNyetuqDj0UDwIGfhjhTUXXRK97x44ZBmGadxxeN1Lr4X69MYl5J3Av21CEVDG9TUNELCDgIGQdQfdkSUAVEfBzFHXt4d4jxkzZu+99z7hhBNefPHFDUn+f4f\/hhOsvaS7GO0dLaPHfjJjznTbMWWoWE2DQke+pmFCp+OpDEuH6QEngNBbtgVVKAtK08rG6V9+rXfmE9G4REZ0Bd7nwoqa1nPLmxthsPvX1He1tJsQF6hllhMY8jmD9q5OmAr4TxbZ1VhPp9OORw5hCMnENZgaGDYy78yTyLAttLwMCyHJImTcsW3Ia3kZrrUgfrgchSlLJtLZDGxATXUNrpq7YjkXCw\/pm6gK+V4+zTFeuG7Lk39\/XZjYLaK+A3oL3R1YIJ68QkMl2GY+3dXBc2y6q33iqLdWzpvBcjZcCkVUdNfJ5tIK8fMkh2y0TxbXm5aTgyElJgQm0HdsC5mRzwqKEqcqcFvHTGjPucY5prulaz2hhJeEYrzIM5Lf0JG+rW3NgHyWdFlBeiOSuCGs4oBQBiIVEidIWT1nOwaZu8by0GsiD\/bt4kltw1cY6\/dn7nfiMTsYfgY0AUXxXfAB3XGhuaAl4dD7yxatam1sZ10zrCkwqXbeEFSoAS\/XlSmrqmjpMq2AE9TVhxLVdVfd+GEm68FJQuWjXny61SPLxzhpiGfLhGqAh7iqpDGss1LkGxVwOc3wHDObgSWEjYQaIDqX43XThAioqhzMrCBrask7fpcQm1AoRDfsRBxYIB4MEghtHg6H4Zah1VKpVDiY4Y9I6O4wKCCZNki+moFImGccAkgMcoUmhNjiEJl4tiMqMllSwjBk5yvfxTOQU0RRkZR5PY9kMmEGEFsJhzAL5J2UC2eRrHtUwqAUsPgeMicxED8Vre3hIXAhfk1ClWTwLxQDUWhh2ulgmXBo2eCBRAGjAGRGRTAem053br\/jtnvvtWtHezMOURe5XM6yDBDKPXbd99ADjyZiWMKGABoVKChiI0kbMitWLHnxleey+RRoGNRrJBzJ5nKLFy9GMlBMyJWqKTwnj\/18kmG6YKjkJaRDpgwTAigI4H3IyIQscQyZc+q4hqHjDrKMq3gPXg6ZF2sR8WfIpuFg8ppKltDE47FEIhYJh8mmFSqZNA0FqCjQA2ALZi6vw8mGLoKoRaEDybdd+QH9BsUj8YqqKvg5iIHa4dcZE6Lal+he3C+IoaY0+NlcQMaQXafrhX9lzr+oOpdpaagtGzVR69\/gMeizgtXStmbv3dW5871jjk4+\/LBcWQVhR8cPDDyqC2X5z+L4zMqRI63ZU3glAlcIjItlXMPxq089PbrFYJzHhYQU4Labz7b9vPHoo4+ee+65lBN0R20m8DfccEN3cNNA+xsAbYvfr2dMefnVfy1duUhWiPWJJ+KRUMTQjfb2DmjnQM0RvoNfGdaOE2VednLOjC9nLp+\/LCpookv2qYuXJfBHvmOYzXTmMhXlFRFJEVgOh4ZlVSSS4ASma2eNPO+T7yRBC5Px4cB9FCTyEkGR5Hg8AWcsT+Z2SYiHXMLEwpihyOiKUM8oep9eDVpIy0DFkq0GrWgsArsB61xZVRlWNPT\/1q4uRhSTYSmhkg\/vSAJnMPJWO+wPW+ZB6ANZJ4yAgbUjI8NQELYNT5FXtJigRKvreqsyP2vyeBuUJQdF4ZfXDtxjvyNth8katoH+T97sO7LCSAIT0yT8wTNFDchKCKZH151MNq3A013ZcVx782\/z+a3NvGjro3wPrEpi\/S5e7WT4EWaOE7iXw4mn4tFcSNYY2bM8i3NB0XUrbzs22JXkw\/6Bt6CqyBsBM5fuX5c486T99tt3IKs4UGQwcq5vMzBJxAoqnZ1ZWNZ4LJLqzKDk4BOKork++cISw8OYuZzHSpqKp0CvByeIxMRILPHhZwtAxgSeJUaTDNvDKQf5ctRIeBXDL3SsRYKzgmdbVW2VIqfAOhyLMRjPheKAxwHeJqmS7LsuDCQ8J2hhnew9QEwyKhY5QQWjQVHPaEEqcggQM+84ZC4Cx4IrkDf35FuRxP9DAM8DDkEGVoiDTww8Ckb5BEgh2g\/pEQCQIWRSFEXbtGVJQkNCSCRRxA1cn2xriEqG0IRDEYRt0tpklyXIFUgWkXXypB5ne7Zhta1utLK5fHuXkQEly8Mj1LNZ2ArXdmUyuiSi6BDFYEyIU0IaeUkRmC4UTNYUcGIUhg4ZOY4lSvwuu46AOfFcB56lB2om4IYczwvbDtuhrqYBiUvYIGBbiI4C\/yYKavyEMW++9QpkQdXI+zOB5bs6u5qbmqBAyJhTMP5EvHY1vGTJCj1juJZDprA6nhyCbCocXBWWBVuHMJDlv5AossiGvIIkGkYSiLDAwvE+L7CSLMHd4TkBooR+kUlnV69qXLp0xerVTYsWrlixoqm5ubOxqR3OiAnyEQlXVlUoiposS0IWCA1xzGXLlyxaOn\/ewplfTZ4w7evJS1csWrJkwZrGNZBiaAbIAIQJ8t9tN1GC4I9Sg81tTLmuTz7NHH98g22J0N6pTGfjavW4YyH+nOfx4TC\/\/bbt\/Qf1vu9eIRxBp4NDgYon5UHlk6L8R2lAE1KXXBx77gV5zFhlzGhlzFh1zOeZz8eJ++4f3mIIEhClSi7a4LuHEnpg8uTJ77zzzvDhw4855pjuqM2Eb80JgEAo2eaWxjfeeWHUuE\/ggZKlhmR5ugrl1dHZpus5MtsEwsO4gki+4icLAlkMJmsdTR1Tx0+xM0ZM1izdkBUZXLy1pS2fzbusn8vnKuJJkeXSmbRuk0\/hVVdUQH3DhEPbg1OTzgkqLorpdBo9H5oVZkBVlXgsBkMPcxiLxcnqo3weKhTOMVHE6DKeH4tGy5MJRZbJ6EIuh1JBZRg6+L5fUV6Ox3FMG6w8b1lZ0yxLwHOAwrZgEg2G327nvSIhOMuEExAmS6SXCDCMEHpjoILIm0eUBNFdHa1zpo6GjrcMDw4kF0oeeOLvt9rl4D6Dtxs8dPtttttJiyRAIFQtbFhOzrBwFRQWnNVIVJVUAZQCemj31uz5rZ0q7Jbr9WaZDpGZZtim45muO9vIZgV2qqg8oCkdUGcstJXvQVd4HLxm6A5YGPQwspcr45mWAZfYthiJMc47fb+jDtualz2bjCgQ8wz1h0dCZRp5b9rXs6Eva6ors2ndyHmcJ6jhqMuprCC4viX4jCYpHsfkyc7O5HljcUmNREeNW2Sals+S4W4Dz0KWUBBTrOO+ouB4KD\/Dkan1dioLT9eOKCFZVnUPdo6seNRk+FPBDG4OClf0HPK2XVNVtGZIC6FOyfRvtDey9Mgb\/SAtLwsiziIlciBzv0EIAkWpE55n43EQRiOB6kFycAGZ3Q\/WhbxkGQ2HSxDGI8AeW5YFd40McvBcPpfHrdCEeD5wEvo5pfKKcjJKkUpraogUgBeg96EVwVbxjEhJXrpAkCx4e2CfRDubOd3I5K0cOkE+3d6Z7ujKp7NmPu+aNiFYnosbg0+AzYoyWc+GogWK1EffQTkNK9+nb93QbbYgn5Qiox42qW7igqKlpBEjdk3EyPKZEjYEUlfk7RMZ7f\/o47c+\/Pg9QeTCkZBCxm\/YdCrTuKaR8CvyVVWyeTZkKaRqCxcsWbFkle8wHS3tds4A4c92ZR0DZtr2HAdKB1JHujwhBJBHQrdxK1EgHI4McyFDwtvQUTh4CpAgUgIkIntvc2hllAmksaOzq7W1Y\/mKNUuXrVyzpmnhwiWNjS2eR74FGiJrj8VINFxeVo4bQBSgo9rawDZXrVy5dPLUL6dO+2r+wjlfz5ja2LxKN3OdqU50C3BZFIZ0ZyLymxEkOz6eyE2bKi5ZwnPkK1L27NlZSY7uuWcgjqzS0Ltsj92hS6D5CCHAFeTdF37IviE0lwJI33jppcSiRQp6PUO2akcAfUb81cna4MGEEAS0hjCLEifYNHz11VfvvvvuOeec862+ebgp+NacAI3vM94XE8e++NLIpcsWginHYtFwSIMcQ4u2trXm8zmyuwDP22ToXgxJUjwcg2IGNZ43be7K2YtDvAaD3NneRtS9KMD2W7adjCXiyYRv2RLLdWRSLkfmfckcWbCas9A1bZ\/O5Ub343nTMAIf3UZvIBPBVNWzXUPPl8eTsWgEJ\/J5nUS6Lpn9x8AjD1dXlDEC29rWbhiGJMlIk8tmoT\/gCkCBEA81r6MY0OcGHPawFIfkEmsNZc0N22nvaCQJGwTdDbGFJoFyQOcvEn0a8KHV21vXLJg6Br6mZZmaJlisPGS7XVVRCoUjZZX10YqGPlvsOGjY7v232nGbHfatqu2bqKodsMXWrifoDlnvBB\/c4bxcc6Zvq5kkgxuM5LKDGW62xC2CMyzzvuLPlZRpvqRzLLSVaegsz5oI2Ca8TJFsrgTfhQurYXjDhkveqZSF5VOP3WXvPfqJqgNiQd7vo2rIKA7DyYKZc2dMm9femqqprSyrjKU6sul2Q88aaiTi+MiK9yxdYlDxZCmeYfkwxaAFkaimRkMfj1nUq7Z8zxGDQgpTnZCqkgoaCRXhMm6eJa6SwCiOx1uO4Qq86EuKKHAymtZH64XDEdMAo0Ctkxf5aFA8iCATu0iULsOWJZIhSY5FIuFwON2VsogDTbY1zOl5XIckhqGDEMBmw8ZDBcNkhkMhMpWS47LZLHgh8qKGHw0NuYEth8dP1CjZ10jVyPxB8tYAnAGXgHCAHJiWiZYSBUEPVgZrigapAxklxoDcAgyMzE9U4esDngvupYNSoSqh1ziy3xFkGhyEjI0FCzRMw4KsmHndNa1cKg1CCsagp2FvLPKpKcuC+UEZiOGBheE5kXd33HFYNKqB0+RyebJWgrz9IUsVKhKVu++ylyBIuBeVOChnoozXHv6ysbYWyAABq5v5F14ZOWnyF2TNpyzRd1JdXV2prjRqUlEk8DmFzAHQIuH4ojlLRr3\/meOwSjic70yRN+I+a+YNFy2f0+287ugmmi\/dmWJssokZ0QOeDx4AqSCeAMMgK0hWMLZFGgQuBf6BPBDzGUxQxU2J4wBqKwhk70tRsWw3lc62d3QtW7Zq6ZLlK1asXrBgyZrmtnQmbxoOy5G9NxU1XFlVHQppELBQWANfzWbTq1YvmzptyvSZU+fOm\/X1zKlr1qzo6mxraW0kc5vJEptgO9GeCEwu5IWEyLs3pCFiF4zZB\/YYJQ+Kjs4LtUBmxLJCSFP226vthVdj6ZTHsSGfyUye4owYofTvjxpAUvKukVxFVluQqRfk\/sSqr3t7IPvU09LSJUiPW+IPOjQLf+X4E7UthgQrDkiGwf3Xe3UJPdGnT5++ffsecMABZAb9ZgVxULqDG0fAvvHvsuVLRo\/9eP7iOZAbWSCTbshgmkDWWXV2dkFM4P8oZOo4h0vQ56BJw6HI6qWrJ3\/+Vbq5s4rs\/c6Eo5FsLguzBAMAQYJqJjMTOSGTzTQ3N0cj0UgotKa5CWVTVM0ybYhaJpsWgnVi8LQCQuDAJMTiMWhhuKEg15WRmGUYWcswHSushRReWtXSzGuy4DEJjUR0ZlKm5YCze8FAsKjIcEu74PDl9UQ4lspCWfCw++2uGyuTtqnjYLhkTkQPOeq3fx601QjLhLX7hrqS1NCCGRPffeJv8NfTnel4LOKqFSdfcmNZopLOJqO9jnQfsnEAJ6rwNtDdxGym0za7GMPLtK6aPnPsyGdeO2ip9UcjLVkmPG3w9ImqeK2UXBWKeDC4IqEkvkWm8pI+RgweHScXbfIxSfjNUkiLwPFtT3WVJ6WLzjp0r116ixLZbgU9DgnIpEKG7AVkm8zXU2Z1tmcYnx+wZcOAITUrFzcvmN6M8lX3rsvmXR4FtTo4P8eDSihaS5dhuT4ub2ioKKtPXHrNm73LQ3ts3yvv2BGZl9RkV8bIZLrYnDnoi1ViRofJpCUUOW4sL7wnc+B8sqhKYE+qnMnkySxH8A6RzZGhUbLQIBqJQa\/YJhiVBjHAc0HVQhh0SwcPg5lH+6NQxFKSLQckMk0E1c1zMMCaQl7xwlR3ZdLBAAxZfgnPA7UlkT2Iuz++rOIu0SiMLhIQnY42Ji8vwlDaGTKNUQXBImw1n08m0N\/8VCoFKgm+BVaBFhSgdj0fYkMIGHE3Sc+A2ncsGA6LJS8fiCWwTBPKT5RkmAGIK9IEyQjhgfiBOpNREBFtSV5bo11gBCzXHjCo\/pBD982bum17ed3Ew9v4j\/WS0URUiZ111nmgykTUAhC\/LPiH6OFfui6lmoz0sFVrVrz9wRtt7U2hkIq2R+dHhTc2NqYzGVQTvAhwZ9fxwJs9l5kzc\/6KhSu8vNOsZ+N1NXpzK5x93bUYwoiJEoM9h4BBetrb2slMKQFaIljnEtJsuMgiR7alEnhoKuhAklgUISfBpFHyn5HXyTaoxJEgk2BATQhnFEXHBhsmHxNnyMgadAL+IxyCzC6CZiBSw4fCoWQiyfheMhGPRUNgy2QabzCEALmFCOFpIYeGQYbHIN4g1b0aeqPvI7OBAwfFIgncq4zI8L+Fg6qw4CvjLvmHgYJEnaG0ZKpL89NPZWbPG3DbLSQZno7lW1561T\/9pCqywtfvYJiVZ54+7ImnSaeGQ0nKTTILstw4\/AWXXup\/NorTZNQoGTCDWnGZPnfcX7nnzqTpUIRNy6iE7xubPE4Ax9c2Jk\/9YuRzT7d3tZRVJOCfQdtCcMFhO7s6IB5QdpB+aENWRqSryVo8mujK5KZPmT5r9JcVQigaidgMkW9VlsgeIsG4q8JC15Kp49DXLW2tUOGJaAz+Wk7XK6oq4IDlcjoUoyDyVZU1tkFGekG30Qe0UAiEAEo6kUzKqkYGynU9b5nwAKNq2LddBwaXZ7vaOpAePSmdTsXCMYHsrEwWIgJZmE1DJ3P9CL\/3G+rr0OFT+bws87VJxQ9mwBm2XTtgaK9+Q9BXu6tiw4ADauTTC77+wrENy3ZghixWGrrz3iHY8sCfACgtINsneLrnMKAajuXzAmxhhRyrqho00OromjBm4hTTCfnOtmQhIei4VymIM0PKLNB3zzfATmDwkFHgE8M80jxhL4nCAtPxGZtYUrtXMvG7k\/fdfc8GHyrIwSW4nGzj43EO9I6V9yZPnJnJ5CQR9IhJlkfKysOpzmx7M8yzFI5H8nkTKlXkHRg4NDTc5KxOZk\/gWUJhJRxTR42eCy5XVR6BKbUst6z3sINPP6d8wBa1jnjcmEnbG+Yw1x7mONs6zDaOZav83JpEMiaTVtLJwD55HeP7tmMpZFYBqA4kgQM39HxTt\/LpXMawLV5UMrlsKpeG\/YNFxmNB0kBCoUagBPHgkARoQNNBexOTjKYkDMnz8\/k8KoeM9ksiLDGRgeBFA5Q14mGk8QttCjshyfDwHN3QYZthPMh7ChHsyjby5LMIUOIgvkhPMvH9HPnOZh5pcAnq3oJtCb7HCC3Jc4Kiyrk82SgbTj9aJGAA+IH0kZllYCFIiXjYBh+WAK2Gh\/F8WRTRKkZOT2c7txu+TU19NWqc0Gsye0bGg6OZY9FoS1NLY2MTni6d7upMtavguwKxInS4lcrALxbBiAmpgznzZrzw8rNNzWtgOcF6w+EIWnbpkiWoIMhJXs+TXdCDaaRQUJPGTly1ZEUyGu9s79Ah1Ymo4Pk2+VoScdLRcGjWYLKqjotdxoOYER+XmG6yX7eezWU6Ox3Q1VTWyOTQiBwRH7gsQbcF\/yDCR7bZgHrhQFxFwiLJPkciGC2di4f298jAQTD5iUcqsuQPZzjLtDLZXHt7Z3Nr66rVaxYtXrp06aplK9e0tHR4jp\/PGY7jw+qraqi6qjYcCnE85I1dtXrlosXzwIfWNC7\/YuL4KVO+WrJ00aLFCy3b7OzqQtcLk3kVIrkDHokNVAdKgR\/Xb7nxRu5PfxI\/\/zw\/ZIvw0KGEpzBMaKstcx2d9hcT0wxjX3pp\/7\/9lVUlMh2QiB3Jhdb\/xgEpT+67d\/Ks3yZ+c1byjNMTv8HfWbVnnh3u3YvMtkU2lBQAm5RfCd8jNpUTLFo8\/9nnn5k6fQrESVLITixwRqHKczkygx48IBwOQdtCzMMRDUIdiYZD4VjL6tYx73zSuay5IlEBh4m8UVZVdEnoOKhUaFd0n8pgEbZuW3nTMHJ5sj2+Y3Zk0rIo+Q757i38IocxI7FwDoYn2FQOnR2\/kUgE3YaoRcdNd3Ti1lDQsTD5MF0Ondi1obaRHkYdGhlkxXQdOK2SIITCYcuxc\/kcOjw8QhRbFsSGXvX19XWNa9bkkaciVicUzrUhq6Aglb0HDRgyDBymuy42DCjyiKYsmPmVnu2CTQavhx+xxfDdYrFy4t2uBVHhDJlZxzMidIcv+AlOSt19r7B0Xnj74YsXzJw3bcq8LnuZ6wxj3FrHS8vaA4L0DpgU2S1fQD0RJwIGFD2IQwmDbZXhnMJkku7H27aLugor\/hkn7nbgXv0FwSIODXlnQLQVSIMoc57Nj3p\/omsYoFYgEdBasUS4rDyS7kx1tmR5lg9HNbjUUF0i2srKwx5zvJA1bNcjXrCqimXl8Y9Hz4HTXF+TdCwdvTpcu+WOBxybrN2qX\/VA+4WntTwEA0XCn4tr0lv2kg\/bZYu+tfVxpbZeHjywKqSguIZt5uFLk2F0x3AZl7y+0S3P5W3Tsy0\/b2YNKx+ORP+fvf+Atiw9r8PAk\/M5N79Qr3Lsquqq7q7q3OiA2OhGIAACBKNkyZLHM5pZkmYk2YpDyfKS1rLkWRpL9kg2Z1GUBEEkQJAAQeTOubpy1auXc7z5npzP7O+8BggG2A1K1IAgT7267757T\/jD9+1v7z+aRkVTtBj1GqUard3MIk6jHJFl1CC4HWQ3wjyiMNgGygegrmkaahD2iRMKpBvaJElgeARlgPgSvCn8p\/QKWgM4R\/iHYcCucBOlHIGYoXBBXnJa+gZBBqaEh6LwSddxHLQa1B6+dWynnFhArA2Ej5hxCal7R54XqDGkGbeF6eLBuDnUIs4OfB\/8A5+AGzXH648\/+WjBg\/bFCPsIOWCiYASmYcK2PBcPsW\/evn5r+sZbl9+8MzP9ymuvoBCOHDpKsPon6ECd4\/hdWd4rgMvXXv+t3\/6NJItM06jVqpZlgQS0d9uI62BX79QdbWOhJ0H88nde3l3ZHrMagB1YgpsloqbS+mIezZbCMxDEcQmqq7w\/1Se8DtIFRBPoRAuBMDScR0JkzdksTmE2MMReuxv5AVRN6NIr6hVABLeFueA\/GB5uCzsBBOF2tH6qquCeJc\/I4WLwYpgTtDsRWhBA6rQCo4f18sDPwAudobe+sTk7N7+0tLKysg7SYDtuu92F8VmVqmGarVazWqtCRMHN4yzYbm+0u1tLS7PT09dv3r567foVgLnteWubm77bl1Ua6wV\/3\/37f7\/4B\/+gleUGw9jfeV7+7KeFWg3+iMAv3f\/wxu1Z4c\/+1L7\/\/h+zqgY6hYznLC3h+q45AbWG0VBk5Eag\/s3yB4EAkEnLrYBhlLwApf4nypJ\/FI93ywn+1f\/2L199\/TUdJJOAUrbMarm9LUJ2DH5gVUycA1ot6xqMUmR5mZenr95+6WvP67k8Xm1CYjqBD4KqiFLGM93hAGx5X2sciBbmWZhB5KVwAnga7mOXuyfD\/WA+HkR94ouCFoYIGlEQQvxRCzOeS4gLRyqVli4q1XqduqURv9Kk54xwR2rDzeFo+aFDhzVVQ9SEYDQMA8J6Y2uznDJAEWKs1Th04BBAfGdrE9oioTkOWcNCQIcfMpCB4wdPnDx7cS8C\/aCDIAPuAfEq8NM3LnnDXTwaOjIt2OPnHmy19gF0fuc0lFVeDqRHlC5Y3TKyz\/8q\/7f\/Nv+db+UFM5i0Lt96s9sRU8na4fOGyP2SZPw7RXPKrgEoaWphKbszEWYQA3FT+Bf1RtPof7FICy6LdTH9hU899uGnTwtqQudSWSHDQLeMREKqvPHiTW8wqleUgqUeE0Qyo6I3m5bnOLtru+7IVjUBMSkJXEXMmSymdAsixEkG381zRRErDfPrL9yBoto\/WcuTgGcLY\/LE6XMXwPC4fkf8V\/9SSam7EQ8GB0Lmhfc+cebv\/ZO7zz949PiJ8akxTVJPnjh69NDkREs\/PGUdnDBkEXCZiRynSApkv+PZSGiR0JrELCMGAehgANGFLFOLCFENGicI\/ORFWkEI5YoQjmTiE4IWlkOsBSHAhzioYYjMBnVOjAFYj2uTsl0hjMrFr8rZs\/gQj4sR5mE\/PI0X6\/d7+BNZRhmWl9Okc9S0TH3SNOBSLzenRk3AmCjuyLQWJ3wDJp3SSgkMrAxJKpfxpgO2jadTny6NjqReFColjnUD+6FHHzh68kgQh0TAUE80CT6GJxi6Oej3t7a2Tpw4btYshstVTUZ1dnu9Y0eOHTl8HF6wZ1d\/Mg7k9J3MkvszlPc0j7\/57d9+8eXnMibRNLlSqaJSdnd3u90OQixZBaKdYSiKisIP3PDSq2\/FdtA0ahIhDRsmaXs01CxLlsQ0jAANQQRbp+iMSA9wwFVUVYII8MGdy1YlEZCFkElWR51QtPs2\/syihLYzBQ3G9XFKkw5d33ecQaefQIIE1PaGiErLZ9KsKYlGJiJmgmXygqKrpL453FMgXEPKywzCg2AKNL5AM4BRsDoa\/88JAODhcLSxsb2xsbm+vj0\/v7y9vdvtDLa2d3wvBAmBXQCSm60GSLWmyzBGxxsNer07s7dWVqan529cv3FpeuHO0B2Gv\/WVyelZFX7FMkoYbM3MaZ\/4JIQciprXlPpnP1N58n1U7mW7FAEGS1OrcfpeRfwfHuSS5Zu91+\/+uce3SCWRF9CH7\/aGf3r8ER3vlhMMRqNLVy5BMW3tdNZW12HcuqZHtHsYDTABjIKGUwctw6uy1usMX\/v2K2s3FzVOMi1LM03aBybPgct9e9judxHXLd1QJAmiCYTAcZzI93VNg1xKmJwoOqlqWoYXsT\/yQ992TK0S+DFbLvWDAE+\/SpIKgYVHT46PybwYRpGDJOE7lrUHQ0lV4diTzRaC5\/bujkS9+ExW5CPHRhiA7SG4arpGZllucgPPh\/\/0bddJwrG6ptFy9bTqztj+w+AExN1\/8LGHyAgVgiisL810N+ZokA4tw5\/tO3bu4OFTiC7fj9qknwtOZsRc5cSlueyv\/819g6GWM8lLr\/U7uwsaf3PLlWR2WzFe5NVrigwyJTCJCuZPUywR\/wnJ8LwopjBGHZxly4GhGDKbjdf5\/+Jn3\/+RD54RFSYGNQEBp+lVCNFQNVA27Osv3CyC3NKRvpjhlb2Mabo6NlYBfm2v7kSuW60ZYeAHnmsZEg0OyQuQiyDOAF8QwqoKTmC9+PqSoapTLStLacV+a+LoXfc9DLUshkG6sJC2Wv7Bg+GBg8HBQ8HEWP7kB6SHn8g4ztx\/cN\/xC\/vPPHD83CPHzz5w4Oipc+cvHj95177x5tHD4\/v3aaeO1faNifvH9OMHmqIIukOMEXI6ycOy0mmlwoIGO7KKpiJO4x9KFr\/ACGklg1KFUyFDjcW0CRZMC5AOuQYM1zTUeIFoLQoCYLJSqcDiaNZDOeOxnK8B8kMLBFHEp7sQSiFE4xVX4RTcAQkCgUhQ9OX2iWSLsB5YuKYB4IDlVBuwt7KFADyCghasrVyUEDVVWkK5b4Kwt1VsHqaRVat84CPvT3PcNga\/Q4TIihQC17IqHC\/OTs9OTUxaFcsJHGqaLrsdxsfHH3vkcatc6vj7retPzgHajwLv9nZ\/9Yv\/7sb0NdqZSCYsMnSj0+n2+31ADXkbKRYigppqUOPlt19gw7yqw4Srmkrbb3YHAzcIgVQoRrqAlD3NiSH8Kbe\/AtBBAsGiyE4EGrMCp6PAxpWrdNJgZxUACHvYa47HJTCBKAwgSniE9ywbDYbQPr7j+q7nOW5s+0LGUotCTMNgKW26Ruud4Fm0chdMNClnoCKLoMUyHooHSqJIFlm2UoEZEI1QdWSNGCQoQpS4jr+z3Vld28Tr4tLGnTuL\/Z6zs9OLAsCs77vRZHOi0qyrmlhpjuWCzvKS7\/SmV6YH4xPV3rC10wElgJbJFxZszw3OnGiP+ryoKt9dzotyVmavDOMlJ3g3dlfkbB4XKRktyoIGTxewemo0IeVEcLhXaO\/ubn96\/FEe75YTbO9u3Zy+pRsVkFN4CYzryOGDAD34AA1ukcWyexUGLNy+cuvOpVtsUBiyCQuo1So8UwS0N5mXMAVgdF9jIoXtRsF2pw3rz4JYZsEkVMTpwXAEh7LtEUvNSjy8EiHKHXV+8lMPIHavrw3TnERAqzkO3wjDAMpPkWXLMBAj3Th0wwAkm5oiihxR4cDUflraiA5PBQGBd5HbIPYXQRCmcdKoN2rVCmBXEZUspyVm4zjt2nbEsabGVlVoC5rwplXHztzzKBktWfQffHwXkWn68sba\/M7iDYRGHkiSMhNHzx45effeGEM8ukQMikrUg8LziO\/O3\/3F6iuvI5ggPKgF01zdYLPsphvvItxlucfmuonw7EDKCBwygUBCDSqiSDPySYrS+AEGGsZzvCyOVC76iafvffYDp3kpikndcpSKBCSrAKNCLt986Ybd7Yw3NOp+j3JGEvdW3pVVeWyiHjhed7sLOGyN1UIar5kYhsYKAgItMhlnbEpjABhdl6oN6623N1WRn6hrUYI08PV9Jx58\/P3IFK8Z3Kc\/FX\/2s9lnPpP81Gfin\/ps\/jOfTu69kIQ+Sf8YWoqa8qnDQ1ZqEwesyUONg6eOnHvk8OkH7rrngfMXHjp45NihQ4fuPnuqVc9MS1hc2IpjLkojFiXAiQnNEkN50ngUmm9JCEVjCIAxKEP8iaiAgItITzMLWFq2CBkBw6MuZgJQGisISa9IMs6uVGoKVL8o1usNlGS\/190b90rYSx3PtL4FjQwE9wU543kYKvX+Em2lZezIhMtJrYBm0IKUlk3kQlouiUqinOgg6zpt\/1jWMG22hCPJaMgJtWaBPgg8\/OO+i\/eevu80RaQ8dW0vipMgDoDFplkB0Zmbnj9w4ECjWQ8TBKk4CmPP93C\/hx98VFV0lMQ7Bvgn7mDXN5Z\/5d\/8b9vtNdQhwqoiq6BwGxsbnU5HkmhFKfzoukG1oGnrq5svfecVpRANHmFRlkQ+jAPb9yKS9BDvqEMhDALQbVjC3hwTGBLEDIAugslxbFAyA3wMd4DzwS9ghDi5HHpC2yWQsVCjHfk2Lwq+58PPgG9IADEGWnKbIZnNEgEYDIah60WOn9hegVQEsTty8iSXZRV3UjUdachBUmlYgpizZG944t74qpIK0PIbxFTwn\/ypJK80\/0hWFE0UqbvWdb12u7u6ujE3t7i2vru6urWwsjhwM23g3r2wIFUsvr7f0k1532R+aFK9MVN1HeReY5julctfikfPrd5ZmZ+5deNKt7dlj0Y73TbsVaFRveRZvyuEoxR+gBHixIX\/5r\/p\/r2\/O\/rcv+n\/yr8Z\/OtfGf7rX1r8\/\/6ydNc54+AULiR0xb8\/JQQ\/Ase75QRwnzfffAt1h9gJHQO2vG9yQtMVxElNI\/NVJNW1wxtvXe+v7VYFQyy7iFRVgUoCmPpx6ASeqRkg5hXTjGNSQ2mRRkEA4AYz6I+GUc7KGVAyUapVRZWKLN3Z2raU\/M\/9\/Ac+8qEzM7fvzC4Pm60m1BLka5LEcLlGs0F0M8tHntsbDvZCc5FlcOX9Bw6qGpJkOzBx4DXDSIpKMYSmMFDfxFijOdZs4lZ4T2KRZfr9QQDKkKZBllQrWl3nkUZqdhdVyF9EEPI7On6w5cJpRWl9cW5t7iqwKM9ou96Jw2dOnLkASKGIBVB5x\/pZUt9cuaOBrPq370jdrogHcIyUMyf7vqZaL0PeCwxPw\/xpvibPyY7vJEUssVIUBdT+CFjhIaJJcWYUFFOtCJ98+PAnP\/WgomVhAowAAc+RDIIgoAcjvPbC26O206gDoYoEtRAniI3lQARadGViohF4dn93qAiy1aw4tgcgVA2Voa2jabHDiFaBJ9dFqLVq+mtvrIosO9kwUWjQSVvb29tr23fuTK9vAqA1arFVZZgOxDCNNeZoxSb8QCGnTIqEocBwtyTPItogMoW8VnVLr04q1anmoVOH7r7\/5PmLq7cvba8sLq47cTlHGomkfQiRm73hdQT5JJjKVl7q1tiDSMRykAAIO\/BVfAIdVm6Oj3JMg3LWP8AU8IoEQscjwgLiwLSQniAMbMeJcR41EVEzA4BeEiVUGbhXFMWwVdSi57kwb0VRwSPLwC8h3gChkSFc7gU+OARwmlrOyp4C1DxIhqqrqCn8Cf4hS7IggXDkTEoiSVSE937oCa2icXgoGBayU+RIDDJSq9UXpxc9Lzh6\/AgrcUgDPkdIIrs1q\/fde7+MyEe2Rwb443zsOR+O78vp9J1rX\/ji5x1nqFc0GQUBHy\/YjY1NxFqaaSgKwINyTh\/Igj5\/c\/bmW9fzMG3U6uONJmoLBKvd75TGILf7\/ZxjrKpF+7OEEVlAkoDbIfoBJ1EhCMGaplOrftnkidgLYwA3hZHA5CA\/cKB+RQUeTMMBKJnUkQ7qz9EQqLIDAgZDRg9qnKW0rEUOtyhkhPaMiQP4Qd7v9tIst+pVWVNwD7IQ2EKcFgl17ZeUIscJ4C5ITDn5kTbqIHpDC5PQwwily0YvWSSyj2xQw5cAnky7h7hB2B+MgoXN973y2odfvbQzP\/fFrrM1COzdTkdgpfFWY3Zej1NH07afeXh43z2JyOVMFLnu5s7ajVuXr9y4fPP22zduXVnd2ux0dzrtHWAqMlmyZhTUH3wglek\/\/idTr71aW1uvrq5W11YbaxvF+rr00Y9pp09RHvCPkAXn\/tjb8Y\/68W45AWz5hZdeHA4H1GkNExdEw9BrNU2kOd9inBRLM6vXXroihoUuQ+siwPCwUpLpceQCnIOgUalDMSGKhQS4IMQB2AEM3bAqW71OEPgAuYINaq1xQzUix43j4O7Trb\/wZx8\/flDobW+wRXV1N4VmsvvDrMgty2rUaG+etY317mgEDq5pGlwNMK8p6vjYeMEVC4uLURSCgiDwq4YBf\/F9D7FHFsVGpWrVqkNciMxwCFH5yLYhi6GB4YdwzWrVqms0EFIoiihjT198xDCrCDtlYfxgqy27tLubG0t3LrEUp6hfuLn\/+PHT90EZlqj2jtUD6+HA4E15kRZnzhgf\/FDg++7NGyg7hCZfUb4kMDep745CZ0zLASHg0ep+TM4I1E2YgdnomgE4CzwP0QjYofL5T3zo\/E9\/+n6zxpeEgAIenolHUDdGyr\/6wtXEC1t1wzIAk9rIcxDnOEmBS+NESRYnJuuh79o9D0+UTDlwocwz1VShtIGPLCdSywMyUGSyKlQblW88fxswNzVmQbXqssikwfL0lY25Syu3rtx6\/bmbV16\/c\/vGwq3b9sjDjxPYuq4axCDBamBF74AAap3PWYEYBJQOA\/ClhllaMhaZ5+euvdxZX94aMH5KPTEIhaCNWZ7ItEATtaaWWw5DgSVEQPE3za7mwMwA0LhVRkKO8JFQO0lIzFGvAwqGOqdAJsIYIs2h1lqeRmsOBgM\/BN8i8kg1RWyJOl5wUHMnFSgdKFa8gRpEveDO+ByISGSPmlIS5ArYDePBB0gYvgWC+75Pe3optBMW6prauEUeDiLyUugHx88cffJDT3i+CwpbalBqQDYMwzRN5Gnm+uy+qcmxfa0oCQOXBsRR60+aHz184sI9D1LB\/WCT\/PE5kMfvZbN88+JL3\/jyV76oG2q1ViVPE8QkSTc3NxGkEbmJjeFVFEzTQm3fvnJ78eZCRdHh+1DoqDQvCkb2yDItyBKU+8D3RFkuOxPTLKblxgWWWgjwqBQqCJVeFEk5ZhAHjA0VjyouB4RQjyYte1ny0b3PoyDME1qAEl\/BcpBauoxoBgxVBdZJPDghTBi1R00ObuCD+uMdLA0WXGs1chasnQayBK63u7YV2n7ZOpaEngf7wi3hC0gTHAnkAHwINoZyATmAQoPTowRyKA6a5sJlGQteqsJDEd554azj\/t93Np\/tu1qR73PCrTh4IYpX1lYX1zffdmMt9Bpx8W+OHXjlvnMOoxQ5q1mGJohpwVXrzVq1gsLzAq\/Xay8uLczO3bl5+9qNm9cXl+dXVheXlxdAl8OY9vpSVY0qqTxQCMl\/+A\/6wjwcnEYEgQWDWCNlP\/8z+qlT+LqcG8mU4xaJmv\/uY8\/ncMWfHv85jnfLCUACpmdnEGXhMzB9YCMsrF7RRVXtdUeL12aHax134CqSBNWlVa0kpyF10Eyb7Z1GqzneaKmyHIBT56lnu0HgDOwepPDJI6cQnVc2VgGOnMhOTk0xuTTc7afR6EPvP\/Gzn7iwvXFnbWnO0JVqY+z23LDftaHhavWaJqtAazi\/F\/rg4GyaB6AaWaYpiqHpYRrDPOGWtHo5NeuRw0BgAeLhkIB3OGKn2wWy41o4Km2GVC4iW7EsxBgniqEA6wZfpAnMNy64E2cvtsanKDDT8YOts2wcZmJ\/8c6b8GfET0WWlMr4XecfIBVLF9K1cAEJGCZwKU\/bEyGdQU03PvRB5vz5\/vQtpje4dXD8f63VOLkC\/yGwKxsESQLQQns5TWPOWYSesu2QZrcj5ZM18ec\/856PffxipSZA3POMSDs8lKP8WD4DjXj9xavDjjM53kCmVE1GIoBfiEwJLYCAP1ig28RkA0FnuGvTiAFTifwkcEJFl4GONAmL2gmofRVOKsm81TC+9fIsgPDI\/sbIHka+CxqkSryu8dBs1Tzm\/QGztW6vzy1ffmX2lW9cffXbt668defW9ZnFpVG7XxS8iluLUHGwGgnISOyMbo7EUFsiBJQAYnftpfbW5lavEBUdhYl6lCSaDlDGehrLUgZjGldIBUu7WykQiDjACWi0AY3zLxBfo3IqaWm6KYIx3gM3E0hywDTqFf\/i1PM8VVYQiVHWOAFPoNvu3ZzUGNgkFH+BdALMKRaUDQAwQjyL0kDNFdSSHMPSStoHJk3yieWimGYx0EoDOIUGtuJdhrzgO9fzMzb9wLPvrzQrIDRID4gsboJn41vTMDeXNtfWt1qNRqVhCbgdVTiMOeRY4dDBI3edPIuk\/gk6Sh+K4\/DLX\/nCiy8\/L0g04BShVZZk3ws6nTaqCQYCHozPOUmQDZMrxEvPvdZZ3qoYVpREqizZEMphqJmg1DxMKqA1JwNaipJjYD6wkDhE8cJayEvAVOFfqF4EuT1jQ70mZSsOZDvxQah26iiQIEtgEjAoTdVgHmX7E3UQ4CqADK4icgnWWuCKDDYOxkAmAnSiDilqmaDBAxBUkmTWq7RjG3UJwKpyd2hnEF7IVZraw0EWJv7QDl2PSTLoiiSM8jiBKYJloyzK8igHxMCDwL85ajDIc1oENk9pJ9KpMP5Ye6NJW7ayyO3hNJi3zF3DkIrCZ5llgb1sNF+t1WeW20vzy8uLC+vLq8tb7c3tHjANpAgQq+uVilUB\/FhVE7gRJ+Fg2Nva2VxanL9169r84sz8\/PT0nRvzi7OjUR9MN4Go+LXPc4srecFCd0Ee4afLMPJnPru3tjFKGS6HQkbyvlvN3zv2OMHvOb7\/hD89\/lMe75YTwMBohOCg39nZLYkeTb3dNzkxc3P2xqtXzVRumXUvDmDk9WoVunzk0M4FgMuJZksEwgq8HXhhGKbgkGlsO26zMTE5sb+qG44\/XNtaNXRzX23M9ePuYLdlBT\/1mUfvuf\/u29fezkahIuhwhsZ4\/cZMx7YjyzAQyYCYQ8\/Z7fdEjlcEKUoTBbbJCW4YeEnY7\/aiMAJ9hunQpqh5Tm0Aea6rakHdyrTIvCKIoR9KiowgN3RGQHPgLwwdeq7vefi8qou0iR8PQM+Onj6\/78BRYHlpi\/875lhQaEvim5efR6CAkiNgUqv3PPAY9RN8HwUuECzY1ORAnaQU6J\/GEbTy3fcYH\/7oTu58zbRvjZLE56ETEYeQ33I1COoCh9QuZStJWbBrcrCcF1nhz\/\/MY8984AAn5ElC4xiKAjQJKY05geFZ\/fql2dDxx1t1NofUBnDgZhRO8X+PN+BHksXJfQ3fcYYdG7pKrxqBE0Hdq4YClEF2cMlenyvOBkuw6ubzry6A4B\/fPw52Uq4YyeQxrf9ueOGn31p\/bKH94Grv4Y3eo1v9p9YHUGfLSjzYWNqcv7Z0681rV1658fbLd25dBnZ0u50CeEY7NvCgcSAJtFKBgELKZy69sLuzs7wFwAc\/o+GnCpWGgaKQyh5cACCQChCPvwG+MJUkpu6qMApBH4A1CKNlZwFCsKCpCmzX9Vx8UuI74T3EJWoW5UHxXuBbrRbRJWZvNJlgAitL1Mad6ZUaCAC+OB2PiMAbyqKTEeapWRgEtDxwJk6gnt8sA4NIyehII6J6YIewLpryklGbhu3ZR04d+dBHPxTEPk6njiLcE+COQxCyKJu9eicuigNTk1pVz2giBQ1kQ93rutlsjp86cYYS9L9rlD9mh+0MvvClz92ZuSUrkqzIwCXUbL8\/sEc2LMEwdWopFwR8BQMwJOP5336us7ozXm1FYQAFTeXOs4ahV3UT1MrxXNQvfKXnklWAR4IjuvYI3AtBFpEahgDQQvzmyiF1IK57C18GUQQLIUpZHgAfappCdZe9RbBPvAFhoN4CGkxNG7LDJKg5k3qdFNiYhyfC9HCXsmmB5zlkiCxHEFRT50QyNtAHuFviBwlIC4Q\/S6uww8dkQSxSsl0my3e3d0b9QeC6gQOJFMRBCH6Kc+BFHJuLAjxeSlkpgcXiSUziqJrIKadHQ4kG6jKVhJmIk9umOZR00BabY7ZoHq9KzXDUo5cNw7Dbdfvt4er66vzC8uLcytzsXJLEx44fVVQJJyDl9UYVnqLhHwDaVOHO7c7Oxvrq3Pydm7dvzM7dosm1tfrm\/gPbh8ejh+91n3pf9sgjE89+RGw234FU8sA9hPw9trz3\/e\/5+dPjj+p4t5wAIDgxMeG73r\/8F\/9zv9u3e4MkitcWV+3l9pje6Dt2x+42qpaparpCw6nChFbqtUwTVg6\/CeJIUtVBvw+6AK9qNppTk\/tLi027g169NX5g4uDq8gLC3GMXxn\/uJy\/c+96PLfbSzYWrT144Oeg7sOnJqYn51ZEfcJam05KjSTwYDHQRjq+4gQf41GQZxJzQXxDArOGHlmXBk5EMUBNSinAVOBjPAeDHqg2aLMtyrXqdGHq5IYqGlEOlxfEo8DlRqoMBMwiEkPLZ8dP37j9yF9y\/LAwY7h4O\/wEHOEEeBVff\/BZEOsUJXshF7b6Hn+A5aBeYMslZ3EE2dOblF9z\/8X8y9x2W9x9IBIWl+fhB1mhJ955\/7dqlle123\/GoLRLeTd2Gxd6ITp7jDdUApdF1xbCgg2ky0pH9lT\/\/c48YRhiBfrMyUw5+wiUMm8mS\/tYrtztb9qH9rSILENhwT1raoNxHimd5hHm4Pk6FYhqfqAWeO9gZZUmuWZpnB+7IM6umLImouILlkxyGQFKJE1izql+5tlvRKpYMoZDR4EdeEGWZN6V6zr3v+lbTi40wNYPE8hMjjLc05vo+XZUEi5aOFgw+4KJRONzZWZmdu\/HmjTdfePWFb735+ovLc9PLSwvt3d00LnRZXLz+0u5OZ6uTBD4oJTCXuleRcqRBERFZabW4MlqjxgDEMlU94JumEdIYSuJNeQ6WAN0GjIYZqKoaBLR7Fg6EkCROSwCXCJopJNMAAto7g\/pKCKEIqVBttOECNQ7jW\/xJ7SuI3mlGjRvlsXcyNTmU2zDS+\/IOIIU4EEv27oB7gXakRTnNNc0Qk0AF3vf0e\/cdnAwCH8SHFqTCUTCIa2CowdBfnl70sqRWMSpNE5QAj0WS8AiQs0MHjx09fJzO\/7GGyZKHEQvD+4XF2V\/9tX\/b63esiomq1KH1BWEwHPZ7\/b2qUVXaPyJLC6tSG7WHl77zqtd2ZEGRVaXVbASeD+2g6BpMAndFaYM7Qjz0hyM3jmBIpNplHooCZYwKpq5EsAAR4VVCeEZKiBwjMUXZyUUrX1FnPZHFjMay0Bmo1jAUZRqDQnO1aV0TCt9wG9QaTAtmgAPXItqDqeKUHFBRLmNAfgt6KvCyTj16cGEyJ9w2ymBbsDqq95KPIjEwY+AVSgfnZHEiUGdD7jueb7vlYkr2cKubQ4W5\/iBMKml0HJkXhFzgYi5ba9brfnh6NEKJwYGmgtBWlZnaGCvyTJJSo6SI7PBMysQEPYwhCihYQVbBsQM\/gq3effeZStWg8dse7osj6HX6q6vrsE8UD4qrVq8rKuBfrNWrIi+GU+Pbdx1dOX5o4cTE+pFDawf2D04e2vbdhaX5XncLagCEWaU9rH9HOH3fQTCIX6UJ\/OnxR3u8W05AB2wnzb799W\/CBMBVmTC1WEVX9O12O8yieq0qFAzYa2fQ9+LQUDRotOFw4IQ+vAJIDQwduLYE+pkz47VGkod+ZHuu1+mMgJzDbsfzd376Mw99\/JMfaB15JKkdTwu+O3fr1EGzP+wwgHKNXW37u91E0jV4EZ4lMhStO8M+MNdQVPgHAJ72W+JFPLRSrVQMM0tS27bhS6ZlgtHLCu2pA5\/sDwfw8lazOXIcmFtrfAycYGN1DUEFEDACexCEZkXRBVq2Dz43deT4kVP3fZcT\/MADdosL08C\/fuk7AIwsow5CFNK9Dz4Onyrb8YlM5Bxvoiz\/h\/\/J\/NUvpF\/+Ury9aTbr8tRkqip5BCrPzd2+vL3ekTkDAcWLIgQ8RG1AGCQyyRIK4xkncpqq+26vVWX\/+l\/5xMEDWhRTW3o5bQrnUuu7IhhX35zubPU0WjKF1loB7gAGqXGVdHCOQogT4iq4AM44Nl5FFfe2B+AERlUP3Mh3A93SgJO+6wPKEihbGknHcAJjVvQbtzvNStMQ+SynsQvA5CTlnDDRR9HF9Z6S5WEJYXtevjSuzuyrFSECb+anwFZUCA16AG2sqILG5aYY8lG\/s76wuXhn+db1q6+9dPnl54qwh+wurw4kUaZNZUQEcIruCPsku1EsTDkSARhddu2jfGEPiBaarpNaYlhVURG46asCQo\/GiFC0poKiNLMsZB9MRgC8krIsOwWAcmCKZCgldpd3plYX1CjlhEXAFmHVAPq0oBYbYishaHAM46H+nHIOGz5EqKCbl+NvcDOV1jnmaenDPAddxp9gWmbDevpjH6I9IMr5jag85CmNY4kXLd3cWtnobvdCJq01qo2xmojCZ0XAsFW1fD966MFHx5rjlJOyhH98D4qC+PX21dd\/4yu\/Nhz2QMtRT7qho3LW19cRaGvVGo0ghY\/LELgSywj99uDtF97InHis0kSQk1UZdQASFgahLquIuH6pKwxZRcm7+BRuAxtmCr1qaromKaoAS6PeOmp2w9PhItQVBc+isbsMqGQ5aoHFVTAS+qjceYvMjOdT6iKCK+NbGpoqcmRIpQ3C+8lCqNZonW9qDYI941oYKkwIZpMxebVZo7UOaWIRTKxAgE\/jBKfiKlwL4gKDgvnBlkgF8TxxFNgjTWJEWBfAQYiaxAEIhuP4Bwa9\/2pz5ZPd7htRvJQmesrGBbsrKEeCaDIIkbOeVbnaqi3UjQK5pp5Namqkicu4WQ5+zQI+YLrwfiBFmkQXL9775FOPDYdd2siU5eFHAi8uL69funR9eWXj9vTcysr65tbO5tY2ZApyLIhMgrOQc0OtNGpBjGSnA8ddW15a21paXpm9de3y9RtXVlYXp+\/cXl1fAln3A0\/VFHgTSqY0APwv3\/7p8Ud8vFtOQPqQYU3T\/MKv\/ppn2xCFzUpNKhgvCfSKTmsPSIoXhrt9EO6RKin1ajWDLE0Tz\/NVmTqMu4M+dI+lGyDYEu0jkPVHA9sBo43b3ZXD+7nPfuqh+594kmnclytTRSaCCc9ff\/PgmMRwKdRqvVG1U2l6vq9rGpAR4O74Xsrkhq7DzYGkhka9ffAQuG+9VpOAy0DqOEKwh8Cz7REtSVvurmu7Dt4gL1DY+FNXNbDzMAiQSjAJ1\/M6I1vB1yprSTlNsisyyaieve89AKDSLn+wbSI2kZxPZq6+TJ0YSYRwkEva+fsfU9UKrXVA+4UUnKRIq0vsP\/rvW35oRrF09Zr\/m19MFle1aoOZbPGKvL5we\/bm7d4o3+u2RL4AI+Da4OCmbiY5rfnI8PLG6lZNz\/7h3\/n5+85U\/dDOEDOpaYC2OcKTREG+eWXu9tWZowcmO7triJKIlYMB6NAQ9YBcgezD7WNaVofOB1VvjdcQPHvbfTAPo6Y7I9cblZxA5OMw5kQBAgBRFBkFaFQa5itvzmuKVlNlKCnq4xDhwworitWIeXBxRwII5Dn1NJTHqqUtHtiv85KhCJKmkNQi\/ZQ7KHEojzABHRI4GfTOlLmKUtT1jE1HLJPGKbe26bAMp+pW2c9Bi8\/gAoRbVDRFZhq8Qk+hoYkFwShF1jSjmE6jr\/e0OjEJ0mREI4hJwITwC3SBoYYSisQI1eXYDR6QhbtpGg2SAkwTB6WipZUG9k6jV2pdIWmIZyFmUJygj3JD02Ge+Aw2X36LJNEjwA7xRDyoNB9gLaeS6mIfes8DJ84eg2DlyrSUOEgrIOmKyubM4p0FyDJeUw4dOSjJnOt6YZxqmsry3Pra1mOPPNGst8qso+J\/PCETdbSXs5defe4b3\/oqK2SaoVarjUqlirjSbncQPPCtbtBkXlqcQFR0zdzZ7rzwjReqvI7TPN9TRVFXZT+kxSFgDETL4FnfnXOISI9accKAWvFZpjpWBzuQgWKABkNTdFnRoHclEvXliJbSfmjAByIVOAHqGlWG28LYEPPpT4HcJERkC0OdlsNiwERAf0E+EAwhS6I49hynXEOVWhFgzGSokgTDpQExeJym4m+YCnASDCCDBssJCqjLiUYm0REnMe5Ji7XQCjESTkPCYMDUioG0ge\/SbGXu3nD0twP3aS9sRjRf7E0\/Dwohc\/sbBbvNCI8lSVvg\/99TU79db6UcbUdiMBxICWwwR84YpEckk5VEEhnUkZEahvLkk4+BDmU5TYFBcIDhRmECTuC44MEyChdUezh02zu9ne3uwvzqxu7O7YX1rd2e4\/lxAI+gYUSiJterVr3VlGVaRy6X2E57Z31zaX19dWNz9eb09Vu3r9+evrmyPD8a9UCWRGiPLCU69Qe3Jfzp8Z\/mePfjCWAXcADuxRdfvH1rmia+CMJ4q3F4Yp+Qs4ORDZm+vbMLtGrW65A7sM72sB\/nGUI4ZJafpGbFrJuWzCsML6W0iYgwGI7sAUzKfeyRiZ\/\/2Y+cuu8poXpXxOnAW4GBCWYrC1dbagCV1+uHzfFaz+ZvTvdUUQb56DlDKLKJehM390K\/Vq9VdMMZ2XDTsX3jDMJiXvASLXZDkJ1lfhDglQQaB7Ifm4YJaQhCACaBGECDHl2nSihDTXiIYxENDyxqGoc74F5mbezu+5+gAQG0nRjJhHLBbxy\/C4hRRHhRFW1r7WZ7Y62g1ftIodxz4T2aWafgAGflWEOSky98wfrq12ltX4bWbjTiRL59e31+yfiJz\/KWPn\/70szMzVEoQvAIrKCqiIWZ6zmKrCAOJVkCmY47nTg89lf\/0kcfurfleyNkHIkrUqSKFjJEkIKynb5ySylEzZCgMzTNQMj2aQ2DtFK38pxxBq6uqZDrOZh+mf7mWIVl8mFnBAKiqorneMBZBChJFJI0ATOJaJs+0tzQNtVW5fnX5k2grirlZZ8IxyYIe0iGwBWeIq60KgvjzYWJxtJEZWWsMT3W2uSkJKTyTRMaLy0rKpDUtDQaKSaykgJylgdR6Afh0Ha8kACQAjcvLyz3gyAm3cYJURDAulRQQJ6Lk1SmhgMRF2qqCoXEM0gtgWMclZvQsGwAJYQ643nEABQ3NfYie9QmDPYlQ3ChSIH2aWkdQHsf3DHLdZ0IAfAX0ReZg+WT7KPSgOFT1wCMHMiEQseFKBA8iUI5UTKcSO0f1HOMygLq4xPch2NsZ4RPVEUmoykoFBkN431PPyVItDPncDh0XLsc9Uij2Q1Va2\/sdtZ3ofW0irZvagKRhr7LcsO02p1uFCWf\/Pinyun4OErT+\/E7SkIQxf5vfPkLr7\/5CuwECGOZFVFUer1+u92Gw5LZ0XxRrlyDROFYcWVl47UXXjF4ZazaAHFE\/ULv9\/s9VKVVbvZvu3Qo4ImSBN\/PyQVYJ6CIC+6mmzrCD+qLo8XAExYql+Zay5woypparVc5WtBYhI5HxZf+uMc+cRZoAY0IIN4vsDyFZAZQJjBCkiFY0u4VyBOeBs5X2gzkNQQLDx4AehAmNHYBrCFKE6AlSAnVdpoyGUOjCInGwK6ppgFctG8nRw1dsFgcgiRwoqQIFog+BI6EB9EaHMAJ5jNC9MnhEKaMM89m7IgRXmJoei1co8fkawL7ZVX\/NpRAtxfZQTDy4jjIQTYyamlEHuEoTJZKnADgQ2JQF489\/uDRYwcDn\/oMYJAk4RkGDru1tet4AVKJolNIgYioPLgUfNa3w\/Gt3bGtbWZ+xb1+J55ZdK5cyVZXu07cjfbywFUq9WqloqhKvUb73cMzB8NetwuWsDE3P3NnbvrmzSvXb1ydnbvTbm9B2\/ACS7vC0vTv39kV7HsH7riXMLzB6977Pz3ezfHD9B0QnnIry8uXL1+h\/eKybH+zBbDtDYftQY+XeF1VWrU6EL0\/GiqGRmBYjpWFvRqyPGZWoJa82O\/3OnC1MPF6w0GjUfzMp+7+yMc+XDn8UGwcCjKFpcosANtF4oS9uYPV3BKUlc1dQeEEWVtctJOcH9pDIDFiABRmnMXjjZZpGEBrUVFg+tCecRpbUPyuC54Oo3B9H6\/UGBBHIONwP3gw4oGpG2EU+dAHSQYrdAK\/0+3sGxunxRZHTqNp1HWxSEJAiazXzl18DycooMklR6XVPUtD+32mBnaOdM5c2l6eB4HOOBpJfvLMg42JqTSLRPg8L9IA\/kuX0yvXBLBrBgQIQERBVfzUJ9KPPAvP62wv3rh8uT\/Iqe2M1gYBdpBRA4Jcf4SoEDhBw2T+u1\/86XNnqq4NJkTb67EIaoha+AcwwwtfeJ1RMghYmQ9c2hpKkNjYj0CYFFOFjrb7TqVaiQB75D4s0KjWsiSRH3QGJethaagWgmUcy4ocR+B5bJwRmYOXgawbNf2V15crGjwYJA+oFQMkcybBsxOeWRmrL0401lv1BbyZrC2PN1yzHP0FPsRJiMJZBpfObYeURjkVwAA4cjzUuWhYerVaBZz6Xgg8LgR1frEryjoeKgm4tsA1oA4EqjQiJQUYgyaCHMgwEQgsjuK2BE7HcRREy+2SEe9RlCjBPXmHdJAcZ1nKYEFzxlQZ4QSf045KlO9ynjcQnyI8\/hUotlRRVV3TIfXobkQpoORoWCJiyV7lg50ASMGfUBWgnnAZyhKtbUArYuE2eDruhsoWBdn23dP33XX+wrk4CpIoSkmlojLoDEkWdFWfvTrDJgygWlKlI4cPANTBa1EX9Ubz9u071UrjEx\/9FLEBHD92iPcOprPMbnvr87\/272YXpmksP9gc7flp+I7f3t2B0xDZAgfl8TmiqyCL2tW3bty5fKOqGjK1DeigzmXoAo0mq\/BolWEHgQ4elxW549OWK4AyGLQPKyHZkJq6Vq8aXJrwEOQFJyt6DlSi8YKogVxSqJkS9Q5lrluGWrE0y+BlEXWfQ6IjggpgADQ9SIfYp4WSqLFBAh8XJd934ziSJAHVTPIaxsHRLBLKL\/XfFeAUML8oCq1aRdFooSQOaj0t4OM8TCmj6a8SjXglXwHNhad7wMA4yhICtzSPAH0ZfILlaRIF7BexPEwezhjqOsUtsuwYky9J0qqssmnhZelNjtsQZXDy0PfpgiiKPLBy1x6MQjdEybj9QeJD8RUgOaAEx48deuihC0DN0XAQ0oYmxHs834FX9boDmqCDMMEyIO8lm4C\/EYuFb\/5fO\/1faHced90nPfex7vA9vcHRre7r7dErvcHszMzSwura0uZuu729tWvbqJQcVV2t1FAI4PzN8ZZKIAOXCjrd9szsnfmF2avX37585e3l5cW19aWZuenhqA9MI31AIosAbc+Q6N1339NB6pZYwvcdP3bO8x93vOsxhmXBoXDhUS+\/8JJlWBLHq6LYsQftUX9ifMzUdHwFI4ZttSbGIbNcxwGLVzVFkQVLVHhWcKOg3dmC2OUKzvftu+7S\/sKfee\/dD32waN0fCzUar1M2wQpC7vcW7cWXz0wUByfM0mVZnecM3box128PPfiNJsnUnVbkjXoDMA9\/AEGmFWHLbWlKWOeHoxEqnwZlgcySfKW4ScO247jZaNAsf9q6ntUNA2x8MBwAHeDnsOLOyPbTrFE36ho0Ig1adPzozH2PWpVGViQIlrgKPkz\/\/6ADN5m++uru2iINXeZYCIDjZx6YOngiiwOQCWqIS1Lznnv5j3zEP3PSE7l80I\/9cJsV1L\/1N7xD+wo8w+lcevXVtU1XkzXbHcaRrSkqAo0LCGPg95HKJX\/nb\/zEuTOm73oZQz5Ak5EYmgjH8Vq36wMrVUUYtYmvMRKt\/E8rvStCAi0UxYpBYsbuj6yKnkLaIiMApKKoj1V0TRrsjnJaqB8KnYRIGaLEPdkNrVJygpxieE1\/7dKKpVWqOq3HgnAlAHIgMehOYE6ZQnQHtw85FDPwLgVBKnLUvcDKHAcoFEWB9AToJAIzbYAJiQ5YFvMUQh8\/tPycrGiApo1tRxBllHvZs0ujCCF0Rrbt+zTyEGANtCgHWuBXSl36ZEq0AQdqCEUHFAeS0nAB6hmgtSxRUKgmGAM1wOIjfEwxhXp2gSrlmBOa5AYGgJSjBGjeB+6V01wvxA7UMvAWWabmBmo+4yuWBXwH9qEoQFlYwnseNUVFi+vKsQ50XonjdCHPJnny0GMPaLocRQFEJjX\/ijQGTTW0qllx+k5vs5snuQuKmyX7pyYzmoaK68AyuOnb0x94\/wfvPXffd13zx+PYA+u9\/BCSb26v\/eqvf67T76jlflmoiyAM+92+MxzCwXEi4jrqqJzOqkqS\/tqrb63eWWyZVS6jmkLVITgCl1Cwk\/smaSBcySbB2FC5kAqofUWSoSjiLB16HpFq2LYsNyzxYE2oKryp0sI\/UMSoN2hmVDnxCVrbmOg3zJCWRaIZRYWIJOiKoMuMLoqmxtNeo7TscQSU4uA1epJn7W4H5oGToySkzOBKGgCLI6JmeURwjuYWwTEUQ8cNYTQlESlAa0b9AY0dSGjVMDyaGgFoE1FyTJQAuHISRyHj8UScdA1KJ\/LdNONTdldQR0Vyf5GWk7ALK09PcPyVnPHH6pQSJ1Jo\/AODp8IsS3pFu4Mi6UgIk6bu0GHSInQ9ezCQhOJjH\/mwptHYXlzD8jgzjeLADwLANsI5QP57LIfaB2grBzaHwXPpp3e3zwxGlTip4idNKmlqFvmNscZcxRRxYsF6Xtju9ruDwcbm9szcwsrq5ur61srKFpGeJIa\/gzJDBNRqjbHxSc1QQaABaY5nr2+ube1sLCzN3rh5dXZ2enr65ltvvz4a0SaQVGvlDqXUirp3vOMs71ga6YrfcZ8fH0f6jzl+mHaC0k3TNP3ir31RV2lygeM7EOJVVTfLNu0ggWelrUbDqlSGwyEgeKw1FseJB4sR5b7thVleqVUjP4jj\/sc\/fO7P\/ZmP1Y48zFr35IWUs5EA4kwNXvnO8lvJ5ivHLL8iw\/4zWRWn9o9NtOq7benlqztg3UHg2r5Hq8hRYz7rxaHne\/ZwBLaBqoZcVEQpQLSII0A5OAFQYK+64c\/wmFqVxsHCFQ1Vs0zTcZ2Ba8PZapUK3IoTuJ5th3kGsG4YPF8Qn0gL5p4Hn6xWx9IM8YBQGG75B4IxPoRT7awtrC3eLgkp8II\/ev7hAweOhhmTwkTBKsBM+DwZm5Tuu8d4+tnoox+Ljh6JH31U+eD7C8RRVkyD4XPPfbPXT0WJR2aIpHNKFHtws8DNWpX8b\/3NTz7+yKHAHjI01JIFO4L0JO8TC9dh1tcHms5rmuAMvc76brVRAbCkNDGSy5Is9ANFlyB5A9s3NNVPkoItlUpRNCeqksg5PZcYAHLIcDmp11TVVCAOUAwJQPTCmZDTetV48\/KqKuoNUwVvgw6hXd25UgCxbCIzOSBEUlCjTB76gpcUsQCM5AoabIRywufUGkFaH6FOECG7VergEBTAIw3XhrhLMuD2btfZ7fkRpZOHakc0pnmLJGlCmfKB82lsNowTnCCl1tfUdamPGbdAssADkGBYBeAYWVBUBTaztxoxAW7ZyI83CBhgBoAzGDawHnaCc2AkuBx4hM8Rs\/EIfI7z6c6AfMKTcqg5rim7DACCCBn4GI\/DZ0gkfiivpangAzyIXrPc9e2jp4489uSjOVhiAU6TuB6EWrnnJ1PUrFpnbXe0O0DpjJKwXq+MjbcYmhxXWJox7I5mZ+Y++IGnT544TRWH\/z9WeEZZQcnevnPtpVeey9hMN6A+eFVWYBC0KjkiUhIJsoiYS4sV0pISJszz+a8931nZHq+1cDWt0wnJnKf9Xg9AVKlWUOzwWhBHGBLirg3FEscIYHvro498d+R5RNlKblizlIYG\/u4acl415Wc+\/NGp8f1VmalqfBZ6SeyzRcrTkOuMExCraE4Bbg49o8igrqArhajxnMIJmsTBlqhOEz\/yWer7EsthigINXgac0oyBlC+b2Uvr4sOQeKSoyaqhEyEvCQCtZx1E9Ii9woEb8SR+aJ4CrWoAEstRIz2jaZJ22g\/+XuzoWXFLFgsmhna+5rtjAncBZ9AKK2Isslc0cwmiCLiRQjKQuiHCSqkT4YRITNlqVVKkPEeBw+yBHE+979Ezd+P2XhgFsHcYPq4BW4Cr8py0sbqdJ+V8XUIJEbQYZwiKxIBMMcxH2p39HomilNwBHxQxL7w51lgwTfhEwWQMkBfQyQuweUC1wImeH\/Z6w25nuLS4trG+Oz+\/uryyEQbZyHZBCDTdNEx4g66ZerVWNUw9y2nH893OTqe7u721sbm1evXa5bcuvXHjxpV2d2cwGMQJvB6lQK10ZSlSme+9KX9+97HnV99\/\/L5TfiyPH4ITlMXHQAk9\/9xz\/W4XGsswjaOT+1VBtD2n0+9VVKPRaERJDGYHc4GzAWdxCZA2iKGqUlCGgWfX1dHPfObBxz\/yfqF1byzvp5HbKH2EBUnK4tHWred1987BFiMIuSypNEaPCWNWfe2W\/e+\/8LwoAmo5mCC0FMzUccBiR7Ba6Fpi7hRxCshhmixTbp6LYAYPp\/CS0p431UoNlAXJA76DGcB8h449sG0dIlKVe8NBpWrBGWm73gJwIzUtUOWEPKTIz9\/\/nkZjCmS\/pALUVoCnUbn8rgOfwrPJiW9ffYNW7C37qo+euufg4bsgTwSCEqRTBrxzMZemkQ012ZwwL9yjPnj\/kIM\/pAore8POKy98c6PjI6bwgkRbDDCFLGkIahMt8e\/\/zc88cP8B13Vo7gVoBgIb4QELnxq58ep6D0GnWoWzSOAE3Y1OrVVJ0nzQG0EAQ\/1CcyiGbBiWO3IVWaKdDnmx7HRj6i1LU0W7a0O1lBOviClEcWiaRhz6wFa4KvkKgrPIWnXjlbeWNFGvmypSAOAAJ8CXGQJrzh4YumNeWPOjpmM3naBpO+AjviKybMawScHlPJ+zCIeIhyg0YBJ+6GlkCgTNQAdqDEAVGj07HDqxSNdysDqoapqRVy4wQFCVZojYgEXEW1yIO+A73ABAA\/2FN\/gciIpXnIzXvXCOV1xOYX5v0mB54BMcpbXQ0ocVk3pn8SfgMSSLIOqCckGqSnZBbAYwih+837sVng7DQ4SASZI1lNgKHC9bLjhEH7o1NVAjQCUfeOb9+w\/uh+oHnyhJDAuUZwXEM5VNmPbqrjdw\/DBgDfnA1CROyzmiUKZi3Lh6Yzhyn376w0cOH9uzue+9\/nE\/ANll50v0ld\/60ksvP5fT9hrUHUiNNxwzHNqkz6m7noGah9FXrKoiKM7QufLq1f5Wx5RUWsKCmmR4ELp2p91sNur1Otwf\/hJGEXy\/Vq\/v37\/fHtnQLagR0zQ91w3hiqRDyzQwDGJNoyLmaQjzlBTtM\/\/FX3rwsQ\/c99AjD73nyRN3nX74gfuPHzkos3lVFZjYyUOvSEnIQmnkNMSAL0fsE\/GlZh2oGokzqiaopaLrVrUia6phmpKiAEoQWHlaHaHkxlC0+M2zEDOiqoD0ANQoLzxch6YUisAyoq20NyO1N5RcVJZhjbAgPJlV0ugJz\/2rofuoax9lhVs5u6PpCg9doS8x3Kk8O1Ck1xX1H0jiyxwt+plDnzA0F5f4LMwyyyCfYKhgvfgbiQcTBsbhofCgY3cdfe+z7\/PjwPFdx3GyGKBYuJ4Lh1RVHbh46\/r0zlY7ptHCUeyHbFYI8BA4SpbLvPhA324lkSexgciAfYNl9BXl9bq1LBqKaLISNRWU+ztRpkBSIDvhaORKuI8gh3B5OpKdXdqEb35xZWVlc2Nja3unu7y8jgoEoMqK1myOGYauG1oV5SwLBQdR4faHvaWl+YXF2dn56WvXr0xP31pdX7oze2drZwP1k2a0FSoMpqz87zuASXu\/4Vp7P38yjh+unQAHTNB3vOe\/8x2QtCJJdVnuj\/qkbUWxquiQdkPPAXsFdYjCCDIN5kv9\/SrfHfaScHD+qPHn\/uLHTj34FFe7EIjVMvCgNgWBVfrbM87it07pnSkTVDKC53CsCOMYZOIXvjr30mvzH332PM+w1+\/sVCtW3aqMXNeNwyCM4H+IIFWrMlZvwp0YYtC0iCw+BASPRiOoXpjmgX1TFcvyXPCVHLgA1N7tdID4MKGUgXqIdFUlTYnoxPF2EEiqPF5VuIIWCIP5n7n3odb4QeQIxoEgUDKD328m9DEorjcYXbv0Aqgw3AyPPnL8rn0n7s7TiOdCJpdZTWcMM1VVQAAkNZizmwYRrWyKyEETdzr93ZuXXuv2Sf0bZhUQGUZeHCQVLftrf+XZi+eavuchtEJfs9QSicgKMSvbXryy1gWMsFwOKDA1ZTQY7a5sWVUjKzh76GkazZ6KwrA53qDRVQNPkMSUdHe5rh\/NyazKMj\/q2ohaYRhTyKM2jbBSsXzfgYDAmVAP9GCB1U319SureE7N0IBQKGpZZABz4ATNIPrZF5ceurNzZnH37HLn\/NLovqVhwQl3DtbwIMIJ4A0iHPXvx2AdeeHHmVuWKqwBXIEEMf2nkwUQgu7QBY1IUxqXp6giuF7Z0k5dRcAyYBuiLLAJdYqPEc7pKcQpSNkTVvM0Om8PVXBaqQxpQxpcjkcA\/lDFeI9PcAIuoVQgMfgN+2QYhbbAwVNoAWNVVXFOGAQ4DSQC3+LzvcZSpB4HINuyLOBrHIVgKvgEJ9J9Ss4ap7RoQZzE91w89+zHPzywhxHkI51Wtjfk4NzieGPM7djdzU4UhDGTJQKzb6y1b984LfIhSKqgvP3GZata++jHPz4+NkGPLI8fD8hCUdjO4Nd\/4\/NvvvVatWYK5Vg\/2EISJZ12D\/CNc3LqQYKbUMSq6rX15c3XnnvV4mHweuAHDauSx+kIfp7GYHVlRROlgydSrBXE40ePKpKytrICwwBdoAYD2ESahDTIFNVNXTymrrR0kbQktQblU3fdbY01aGStrE8dODR16Nixu+5+8D0fuOfigw88cOHBixdQQY2KSUP+4YxZLAippPAZuYkCRQvGLHISfBRGmLOFbqm6AaZBy21C6+oVE54F2kjWz+QJ0pkmiq5JqlL2JsA2ijgMR4Mh\/KHsqmLBO2GrOBOpBXxB3MNReVE+xub\/IByddWzko54ndYF9Jct8yajyykgWe6DUsvrPDfV2rUGuldOirvAV0BhAGuwbpJ\/gmORbBkINq2ZzcFQODiRIzLOfeEY2qbGNWiV4AcYJcBiObElSLKt66+YMtRMAfWLa1i5yA29gh7bnj0Z5EIH\/u5J0XdNerVSv1JvXxicvN5tvNeurtTq8UdIlXih4kCmZVv5GfSE\/oD9wQDhXQcN2Y0mB1yOqgHfxZcso\/IWJ4qTXG3Q7fRCFpcXVtbVN\/GysbzmuX\/YPgm6pmm5Qc4KuVWoVSESwBMcbrG8ur24srKwtXLt5eXrm+vLS0q3pG9s7m0kCcpiUS5kQ4UcCiBD8CTveNSeADZW8CUU0su3f+PUv6ZoOgAvjsNVsqJKcp9nAc\/hygTYYk6YqgG+gtqponV57t9euWsVH3n\/iJz\/9\/om7nkj0k1mh8hkgFepN4vOgs\/y62LtyrBGaKlwTngCTJf26vB3+8196GUzupz9zcaqedwbpwqqjaxqNBqLlaEnUgViMjbWmJvfBUoe2DTkIn8F73dCjJNne3UX0ODS1v6IboU+dCAD7Xq8H+iLRImhaQu2QwHQaKw4VCHeCqTlRBMgYq8oiB5eBnUf7Dp8+duweWs2eCmFvDc7fby\/4BMSfH+12blx+kaflCWn1Pbk+ceLcA6DzOQNTN7gv\/Yr61S+rd25bHC+7rgpPatTjPJayDMwWEcYPvBuvv7C+MVJEFUFWlGSQh5qV\/f2\/8zMXzo0HPqII8RIwGepvYVhJ4YbDfH6hW9AuCiIKVVMZy5ChJtvLm1bVTAvOHfqaBo\/ikihtTjbjJPWGrigJ5eRIWoEV2WxN1mkUQmdE2yOFEXV4cpDmgWUZgesKkgC+gxBMT+c5cIFXLy0bslUzVIhifC4KOTVjsryexA8udrQkFwtadZ28nSk2m9rMZJ2mM\/JF2YBI6xmjuEp9QmKaOhMApHyEh9B0A2qLpft1R952t5fRLA7aqJ4aAEFMyu55akwoVw8MwpAgFoyGtiomDYVXQO3eDlhl8KYJBURF8L5cbQYlBesh3kANBogdtCoyogMOWAL9gHDkNPxQVjUQLXBMPA4Ig8+RYgAoLAT3wXvULC4A4oN84D7gRziTOobL8eqlDqMT8W0BXYYjSZ\/52IcOnzgCHwG9oyShIHJGVTUTwYAR1mdXvJHnhQGglZF4y1Bp\/UqWqVfrawsrS0urx06c+MxPfRaxbc8nf1yAi91t73zu3\/\/y8uosWB+kWzlCiE\/CZHdrG1SMEJql7SdQgwCWscbY6sLqG8+\/Xlcr4Gmh7zcqFVM3YtLXtFEhTUiOoEhF6FpAAapkamJSLleGRu3WG41+v49b0vhZjnNDH89DJCDTkmRLE1XYYZ4weXzo9P2TU0doee+CoR6tBOEYb8HtrfrYgfH9R8\/e++C5++6\/ePHik48\/evLI\/izs8umwIua6JMiKQOObiUQWMKCScTIiLwHfoDVInXIFIpaGKjY0wiOTKltSEc1UMBJ4B0wDOOuObIGj9UfLp8P8FOgTRE7UP9FVYEgpME4F4cmU9mQCdTqW5QM2f4Wl1oCciVZF8WVe7immzPN5FuAjgRE0WQfcAc4AhkiYwHFIC1F1kIkoSvIMTxn5owefePiuu095CPDAMJwHFg7cpOWb+Eq1trPdnpmejYIkDkBbBfCoNCPwh2HjXGogjpJtQXs7it+OkyVBnhXkaUlZltVcoTlHhQQpRjjG0Pox1Psm0prr7ywIVvZq8MiQLGsoc3AEVBBSUOLWXj8mfLS0kzgbjTzbdnd2e3NzS8vLG8uLa4sLKy68yAvomowaBWVFatQbrdaYoRt4AhyWNnPqbm9srt26fWN65tbt6ZtXr19eWVnoDzqu59IsJerWIZz5k3C8a05Awe4d0rS+vv7S8y9WDNMwdXigLmmDfs\/3g+ZYC3g\/7PYUkR94QWcwNE1jOHT6\/d7pM9Vf+OknHnrPe7nWxVyapAU5mVwqOFRlEnb78y+10rmTY+CIDIwJQSTnaCrL629sfu7X3jp6+MCHP3hqee72sNe3mgeuTW\/aTjQaDeNyH6CqaRyeOmiZxsixd3d2alZFliXbdaHVHNsejWzEnPHWeKVSwQkj16FRObQ6jdJqNGF\/3W6XhqtDpcHUWTYom50RQ7wgYlSxbiEmp9TZlYTNqWMnz9+fxbTJL+x3T8X+\/qOA5\/PioA9O8AJOg5lCpapW5fyFRxANOUbWslD66\/9t7UtfYb793OgbX\/W+8AXu69+Q213m4oM5h5iHf4VQxNNX3tzaHYVR7Pq0k6ulZX\/jrz574e5WYA8RrXKiyihCoiYo5LkV999\/4Y2JiTFFIZ\/FDQydqxiqb7u7620UTlaw7shVVRFA46FwKjp8w3ND6p4UEIcFoAAiaWO8Ata+s9ElTb23kB+R8dAyoMA8GqovSgkVAAQQY1b11y6tq4pVN5RynlQm0\/L\/KAGhmqX3LHUUWioCJoPz6VhradP7qtAjNGqbdkIp+1+oBZRaUKmVEpGR+liBbNT0U+zBBM8M3XhkB7KsAuQlWn0S1I1aX0SB9zwIghD3gcQDRiDk40GoQeKUZcgHQURMzpAXwhQZKIZ8qjqtL4vIjORC8UuSZJoQebQDNcwDuVMR8MudO3BbfAa6Q33PNDyQVq1BpMclCB6arhOHzGiEtwLsp0Xmy31ryuOdhgRSlyISifwiNyJL+ymbNfOpp99LWaQeY6JfqEqR49M81gxruN3bXtgIw8iPAySxOTFWrdAaYCwNixWnr0y7QbDvwP5nnnlWhHzDUfomvf4xO6h75Z3WlfJlYXX2V7\/4OdvpqzronEpDRVR1MByMBiOcBs8Av0rzROQETTOzgtta3X7zuVerqolyhLPD91FC\/dEgyRJd11DeDm2lFiOmeJ4He6gCHCAYfB\/KAbYBBgDKqINDwNoReomBKGQzuEBSTUMxFTh\/hCh8+OT543ddBLFGYksULHvg8S4raKUg0IQ0Bk2W9YpsjZ08f97ur+\/M3JDTuCYVkzX9wv0PAH+quihmPhO6PNFg2pKUGiR56F5YO\/kftX5Qez0nKzTqFb6AGEZ5FjjgwLBj01lwp7gQZSlmMoWmOypFTkNWvSjlMmYkMotM8TBsJiJ3gMw5ywvtLLlDs4ULxs3AVTPqW4thwSSoaEhAnhRwhXJBJBbuEJa8mU8RebMCpNMLfaOmf+pnPqmbCphtOaqXeuLggy70jK4pgvzy86\/6UQbUFjJGkhXyWpL71AkHJyCODl3PaRkenHiIzH4Q0FQbwPGo69nusO\/jPcAXtYzbwr+ACfA7lA6NSICfw7NKko5voSCAA7AGuDZZDXW2UP8CuQB1OxKHIOCisUcFL0heEKxvbm\/vtBeWVlbWNkFfuu1hu90HaUxTlEVmWTWgolkxq7WapIhpnkZJaDujpZXF2fk77c7W9VuX33r7jY2dlbW11dGwmzNZEJAqk6gh6QcdhADvGPf3Wfgfi+OH7jtA3pqN5svPv4gaV2UIVMFzHT8OZVWROQGiR9FkuJzrOJIqh6GnCdlTjx75hZ9\/ev\/JC6l+LhVaCZOStdLGYFx3\/dZg\/tv75M5UVQbzJm9LaTeemNG++Ns3f+ul2x\/84P3n725cef2NXjcSROrbe+mNOcdLNRUieAijsTQFhJ52K4tTuDd8qWw8SGCvgPKaZU22xtM0DaKI2ItIOyNQoyMtVx4iQkAigGTSaoZkxyIixBDvGca2vVhkmhXFlKhLkyuS1v7jp+65n0kQfMpBa+Rzv6+iSWxDq0vwnTvXX0nDEG4HdS2Z1tmL72EEHRFNmb+T\/Otfqfk+4Nz0w6brm+1OuLmW\/pmfS0GRyJAKieduXnlrbm4Brh2EUIfsf\/vXPvzQffsRzmHKeApcAE7OMZmmyWvbwf\/zH\/96b5A9ePEYx6ZkjLSzg2SZIsR9e6ML3halmed4CHSAWXtkgxNAnvg+uFkGIZMSxtFlzYkaCnBrZQdpgGeZFQtghATB8VFQKDVASQJRwTG8yJiW+cbbazyvNaoydDIiO+27Rj0LjJHEJ9cGIiQGy8WAQOoMYFZa5uK+ikyjiQCu1C+KR5YoR3OhEccBsPBmKtQynJbLHREQdIfBbneED3kiMBxtDQw7oaZ+WqgY3BEph1cDL4BUUPtAV8QAQIbvBbqqWtQ+i5KnvlhJoQ2S8AScgOgOHCHSAFJYhnPgDd7T4kuShHgP8yBJSiyNeEqSZrgaV8FIIOipvMp1b0AgkAyKI2XDAH4obdT4StMTAIh7\/Q7ECfICQStJ4kff+8h9D9wDs0Q0wt3KygTECKJEWdycW\/P65FOkRcvRZxOTLUgvw9DzsJi9PsPK4snTp554\/EnSLnsm+McHcb53UO0j3YisHFKfv\/jqc7\/5lS8ItD6mKdJ+QgihYqfbcUe0zjRkMJUsTy3GKO16vbG71XnrxTcaWjWLI9MyEKQR0of2CLCgKLJmaFAEfrmwFS4vhygSIwQC4BxoCc\/3oQ3I9lDrSVxvtiCKYe2AFFpAgi9MrairHDUiQlRniaJoeRzLAgsnEkUZEIKog4pjSd5QSxQyg\/qlTYlYfmP+1ubMdWo8y2NRkD\/2s3\/xvc988v4HHz199z33Xbx47MihZs0Yq+lZOAL7Z9M4SUNyA55TZLWcSAgP32OoXDlbSIoj6jCRaUKMAAZKe2\/g7oKCsHeP336\/782hDHVRyYVdUeoV6XtyRskRYguVSVJF\/XrC2PAtBv4eAr2QaqK5aSrK4shzYN4gBDRvizwccZfSAnNF9kSwDk38zM98ujlehSooIzLlF3AageYWRaPZ2FzYmL45J5tW7AZ5EJVLPXP4QTHBX1C1ruPCj\/zQjkKX3Rv+VM5Fpp1acgbsYzQYevYgC+LR0A6Gw9D1kyDMohhsgqOFZmj4De7GFDm1ybE02QeaAW4GoCNDoikg+IgBu4JT4lua5pPnkkASiHJU+iqcGGjsOH63N+r2hsvLqzMz80urq+vrW9tbO2ApgESYhaGbsC5wHdDSWqMmoAgExg\/cpeXF5eW5+QWa3fDWpTdmZqcXFu4sLc2BELqODfAACgCtStPGQRCGEEE2jvf0gv\/0x+8+fpDf\/p4zf9BpfyTHH4YTwDd\/80u\/CQ0OK0uT0HFtRCbkHlBYJJEXxoUggeLCfnQx+rM\/9eATH35Mm7wYiYdjVsyYFJ5C9RmHu3OvMr3XT44VugiOXigiogJsgO+5yb\/\/1be7Hecnf\/ZpqVr7zteeO3\/yRFBO65raNza30LF9Jk4iSzeOHzxCj2FZ1D2qHe8BviCjJQ8NEAnAElAvAB3SnrwIAAbEK7BajgfgdntdCBJwCIQmmC9xBOpYpKaCkRcWIteoqJbEgTkyeTp24Ojpex4uqPOtrOOy3n5fXRFRQCTTdXnh1qV+Zwc+BAwZJdnZ80+Y5lgu5dLCXPzvP1dNST3vjb\/FJWFrIvmFX8jg7zBeCEuBvfLmCzeuz8WZ1qgU\/93f+sQD5ydgeXCInACUiDHDJJout7vF\/+MXP39jdvfIgcmzp\/dzPK01gARoKl+tgBP4u+sdSNi0yO2hKyGAm5pru\/V6FT7i2h4EtGIayTt5KurjVUnke9t9eBjKRATlL6jTERafxjEiFkcDNmlgICcwumW8\/vaaKGitKgIkiwCHKM\/RhihMJHBb49bMsfGbJyevnZy4fWjs6uH6\/EQlZSWWF1Na94mUBOqFFARpbUoA6o6SAceiV6gflDBqjm\/37B6gyyOuhnPh7rRwbJ6DciDOC+WSAAACODGAG4EZYRsMEWci43gQdCHdEyAly\/ihqShhCJzCG2QN8R\/gCHmER+P+bjk8FukB6aBJBzQDQcTf9ADq3aQA4vuw8RBmQ7IHcB74VOXlAcjGK05GXlCLOMgmM5AJ0A4RtJNkq8R+7FPPSjKPhDmODdWGTOLRCCiI+okf7yxtQkfavouogOxLutxsVXmRq1nV1fmVfruf8cWj73nPQw888p8ZLP4oDlQ2avKrX\/vNF1\/+TlaO0MOHhmGgADc2NkajUaveRNEnWQwfRv2ZugWuQAE0ZbyujUAyOTahycoAZMApN12bGIcjo2aGgwEIIu6G6qjVquB5uA\/e457ABwQ2hVbXJ+29b2IiZ9jdbheyUjfNBOaRBJYpNHUZhA42Nhj0bl56efHWazM3XtlZm3HtXXu4kyY2rWooaTIYIQ1hQVZEPE0WpJU7t9fmL7MsVC7qVjl410O18YM5J9aaE83Jg8fuOnfhwfdcvHjx0YcfOnvm7OR488DEmCoUpgD78ChScibHSMBEkNWs7GPgMjbxAkSmcrg8\/s5xbhSnT4fOL4bus1kxLLJrPCeCJeTsIsObXPpAEjI894Zs\/TNJtXVTgoBgM0hvDmIeBQ3Qo8E3EkJuQmti0NZN5DdpgiIJaJwg3CsdOP0HHnvgg898YGQPA9qjmRrkSqtOcY5pGpEX3Xzrhuslsm5k5cKNAFBKIqK+AE5PbfW4qSZr74+CDxTZ\/Xl2X+yfj6PzcXAXl8DrdkFQaI0jBawKbsPlDOCb2in9cNjphY7HQNAEMVKZl\/2w5cQegCCqkkV1IwuoZThs2Ygo4kPKFAFkTm2KtHElYQzSg0OEiMWTVE0QoU3INNI09\/2o3e7u7HaXllbn55c3tnaWlzdcl2gPjUanSWyKoVuNehOXChLfaNRkBdIo3O1sb2ytXb1+6ebtKzdu0TTItfWlkT3o9vd23IVRIK3U+vJdN\/3eu++9QSrKhHz3jO879j7fO37\/t3+Exw\/DCb6bHdTG8tLSlbcvwyjD0IfhwpLAquI4BQtjQL+LYuQNj47zf\/n\/9hNHLzzM1c4VwmQEdssmPJMissRef3P667Xo9l3jCpsnEJ3wV7DlOBUdt9jdimSGfejJC4fuesrOxpdn7tx\/9\/7usIPHHdo\/sbI1Wl4dVK3K4akDKDdwBbNSCcNwOBoQ909oqD+q0zQt4D0QmeRawZhwddovp5AY1gt96DWYL6wHagwqDuaLTMECgN8AI2gLuJaXRmONqiUzKfAoz1XdOnnPg+C+1KJXxv4\/sKIAO3jhefbm5Vf63W08mufYKCnuffi9tepYzmf8xnb3c1+CeIbkd5kiqlphvRKevIt79mMJuBLkAIXL5Mpbz7358o2iSH7x73z0gXMtbxiW8jyDn1F7NJtoqtDuMf\/wf\/zW7NJQksWqZZ07d0gUiCHjn26IFUv2bGfUHRm6FiapZweKJIA82SO73qwiiI0GTpHlesWk\/hAa0s40xiqKIvR2hvB5mLWsKICPEjZp1A8qmoQQGBR4ocgaFfPtG9scr7YsBXwdqC2JpfPxwEK+rcgjyxjWVdtShwq\/VRNjHpQwzwAoNHoBxSLgxkQHyjBQFh3KjZh+2a3AE7OnofbsTh\/KLqD1VnkB7g29jlMhsgHWtuOgrvlyRhnkOOoadYcoC9IAh4RgwYPCKAzAAmL6sW0bF+ISSiZ1nep4qGlZKbgbzVPANxFcGfHetR0E+L0zceANqDBVerkdIlILuCFIEmh6JA5AH\/6kVIkiPoFBwrqoZZjWykMMA5cTFFkP4uDCw\/fc\/8h9UF3IPMwVBkODxjNaU75aqW0vrrldW5JUYCssJ8zS1r4xWeZouX5WXJ5eAl1x0+j+B+6\/93nrL+EAAP\/0SURBVPyFvXL743ugMB1v9OXf+vUr1y+pOuiaVrGqlUoFhdntdvfmi4JOQc5y+FfKZFM3wbHg6QiYu2tbTcWUOd5LYgd0n+YKKYjMrueqxAZQa9TjY1kW6g4m4JSbm6CS4CPk46UlVEyLY4r+cBigNknXwrQSiBNQxjFLBT9wPBi2AiYIDgc+vbaytHTn1uL09dlrb85cf3Nrbba7vRQFQ+ghaG\/4iGoZjmffuf0GsCdLoI+YY2fuHd93JIOqATQiGOOVVtBSdKu5b+rw3fdcxM+DDz56\/wOPHD108O6zJ8yKFLqbbhLmHG24Ehc0cMobBonnJtBUBRgCi6f9Qhr+Pd+f9CPw9AM893qUbmZcnoacqizx+RgnXi24f6RVFyp1RaSVHHlBiXBHjtNkmK2AIEomXS6UhAJBpEcBlgwWt2fhePDoypj1kU89Kyq0KlcUhfgS38BoQRFAfVRJWZtbGbZHIzeQNT0vJ+4iz0CPiJZBoYOMPMsEjvkbSfDzcfhIGr2nSB\/P86fy9KLA3Sy4OVi2KnNg3bSVAwPfhmQDEAAggA1wKi7JWdACP4xBxb3AGzhgNJKmogapQU9B\/QMRafYvRCOUnyBJgDNkD3dASnA30l40MAmsg6Yi7\/VolGNOWBrNhitkVRRpzRTAThRD9\/tb27tr63vDERDrVvr90QCsc2Arqg74gwEpKpINdqFU6xVBQjXB+aP1rfXZudtzC7PTM7euXL88Pz\/T6e2srS\/H4GfgXglNcCgDxN6BAPK9GPJ7gsneV9\/7+c96\/GHaCXD4rv\/6q68DdVH3wDtqtMkLmpFSsHbgi7z\/sx89+9nPPjF59n1Z7QzLmNQqzKbQfiCq7dV5Z\/nV0+PRRE1h05jWgi+KME2DVBgNC3sXFi6Mnzion3lfYhxAdU3feGXcDERB6PWcQwfqEavu7qTHDxyN05jm1tNUGVhP7jguwjkMEZEG\/gySS5RYFAH0sB5qK45j3dSRfqTZdV34AKrHcR1QWwA3\/iznm5EiBLL4oMl8oalKxRSKLII1JXlx9uJjmlZBgKTu\/LIwfv9BdgmlL8mrczd31hepFQD\/OPbCo0\/Vqk0EDgmh4cQp9oNPZU9\/IH\/2Y+Kf\/4vJf\/2Xkk8+kwjgRbAYKBYiBfPXr26vzf7Vv\/zsU48cDxwfhCAHp8qQKOIEqir2RsJf+7v\/4fbCsAbkihNN106fGFdV8H6UJ6trgEIpcL3QjpBWP45BmVRFhBId2bZVMwuWAydAzJQ16veHk6Aeqk0LVLi\/26e1YPIc4SwKImoKZItyygLtK4nwj3PLdgL9zSubLKc0qypxAVowFXBF6Qfm4S0ioYKPAb2I0PBAxH8arEPDxmhcX4lHYCJ4NFKMX4jieE\/fUDc8noUy5nFJfxiARyFF+LpsVSH3xl0R+VMyP2ozBFcYDAaQ9SB\/qEdwITqtnKBIjRK4EI+j0WQU9vEQmARsIKEFmwnjkFnUXegHsJy9WE4FUkpMfIVHIj7tBX48F18hzpcJpdPoZKpzmq2OgxoPaEg4jZDfa0mgXFGDJg9I5aTiI594xqhqCFf4FIAFnYMzIVvp0Zy4cnueTRhOBDl28yyVLN2oGNUafuqZn6\/NLguyBHN85NFHz9x1Ny78Y3JQrb3zjmqQKgSlsry68Gtf\/NzaxrKkgK3KmqahYIfDYa\/Xg7eiYFGeBUvj4cGtULmBT9MHCg5KIITgg6Z0+yOcubKxwfJMq9kA\/UPgr9cagGvX8WgcaHmAfMI88GhUjE+zlEtCEIagDqauh0FAzU7kN7SdFTifQFxOrOgIr\/ic8XwE5TzlBDeKIDVhebgW9d3d3W6vzi3evjZ34+3ZG2+tzV9dmn5rfu52EvntzaUsSvO44MX06Om79x+7h7gsQ9sFUYd9WQ6Q64iXtN82ywuyqlr1qRNnjh0\/fd8997SXrkOxwg5A1jka6Me53VGRBFFajnzKcaP0fBY8laYiNXMyjSI\/IkrPZ2lXznVRdAX1lqC8oesLTCFxAUPkGv8ShXaHov4yWggcxBOQresoSbiJ57rktuJegweNZci57Cd\/7pMn7jrmeU6IkgeVQT1yLAoQIr5iWHZ3uDG\/Fkd5z\/VoVGC5eTT8HFQbj0ABprSQGoOydGP\/k6F9IogFWtg8E9ICDszm4iusOi1KRR7JtHChAqmGqoGHUhsFrYGbAwrgO\/gTqSJIygBvMAlOrViIxHBPYAABbFbQbtEQlDQBkgc1QTbKFahpiBNugZCPN0jUXtYAHgjPqASCNlBJ4GY5oBh3xz0BFOW8BwXijrY2S3KwnpXl9d2d7urK5p2Zha2t3a2t9nDk4sYlaIsGhEWlosiSVbE0XUlzUKIAMnVxaf7O7M1bt67izY0bV8sehzkaKRTHfuDSWBFe+J5rfO8oXeSdg777vd\/\/0R7vlhP8jk+Xv0DYv\/7bX1NozzceSKnLMhAfRMnzh81a8XM\/\/fCj731UO\/B4rB4qEkA\/6jYRJVZIo+2ZN8TBzdOTWUWC9uZSkGB4M6tAjw16jO8zccbHhRCzlnzwDEgtk7Oz05cnzYwr0m7PG2taKa+urqFMs93eLvE7QQSBHYJNlGKO+hprNfjMaDis1Gqw+IB6hWldWyTcddytfpeaZKk1jrVtByG4WqvBGHzfB5WkAazl0HFEtARBDnVswCdjkqssc+reR6r1CThywULjwjV\/p1R+56AoR3umrc3fXFu5g0DLMxyi2ZkLjzTG9oMT5JohPnCeO38uu+9Cce5MMt70VSOSBRgnxSBauwNmLbs7i08+NvHYw0dACODODA05AjtJ8Sqrehjx\/\/Cffu3NG+1qRYp83\/ETmOLdp\/cZOi2dBg2synytIsdB6HQdACt0PRxZ5FnQZNf1KjUTyGIPXGRD1JSco557pL3WovUJBrsj3wkARHvwR0lj4K0IYTSWouTXtMoRYtXrVzYRVSfqBu6WFRDugBHwJTFDPmRIPDHnVdgKcDCm\/VTgdiDtBbQM6QAK2e\/E+L1yRBWhEvEYCrGwipwWN8LfflCM3JA2\/sGntJEMAijggfACr7gLSRwi\/jRHAHfAwQvUcmAZUJzUDJkiVcQdqTkIJyNgAAKopZGSQesXES\/NcqgOkvs0cuKdsQ7UhV2ucID04R8+B2TgFUUKiMSZdNvyZNwAKpNGqhADINKwlyl8BfJKxIEThs5g8vD4fQ\/dC3IQBCEt21iuw4i74dEQrL2N9ursMrVFs\/yg2wWqgRNM7RvXNdms1raXt\/yekwLtFOnppz98cP8hsrc\/Nsf3eQoLusfNzt34wpf+w8gZyhqtV12pVE2zMhqNOp0OqhWlSC4HZFdASmVTNtubnVdeelXTjVqzBrnN5yzC9crq+nA4on37VRpQYtsjBCTLrIC7gdnD2kEF9pgcSDMYmh8Ee2QUB8ygYlmIH5IoIDY6XuADQWKap8DkqSQLpsXXdBrcThtzKDSGFNwEFU9MpShwMhRElDL4C7HHG9lOr7+7sb42c2tu+rqpCCIrJWEGK6tPjFUqTRpMSHNJVZghiWIaYIJfMCiye\/gHYlUI6pGliqDMXXvr8sx6JqnwFzbO2IwDUwIiRUUMdgno5DVhmhVbLHdPRisb4g4HiwwefgW+wcvgAE4aByq8mmVBdhIUGBv4AdwAFozEo4RRJmSV1ClGLV7goIivSAwyCGt2vdG5C2c\/\/LFnHHfk2iNoKtwKnhnEoEOhoWpCxs\/dnEn9tGc7IY0E5EOP+iLBh8Hx4VC4D24OLJUVJQqCn4yioyQYCB73DmiIr4v8NZgC4QoIHrX204VZJiF4Myy4uciLhcSLKq1a63gu7CaBVtEUvVZheJqBQkCQZEkYd9Y2EttzB8MYfjVyE8\/PEcxBQVjqzQGBQ55lUQFnJ8dGAbLlMqmA+hIuojgEGIHHUOrKfnAiCGVw1jRTkVXYAaqorHnO86P2bm9re3dlZWN2ZnF5ZW11ZQP6C\/nzfdqWRVF1VTVaY+OWZZVoIGiGAF05tHtLK3N35m5dufbmrekbt27dnJ656fv2cNTv9bsAD1Dfve6G7\/1QFZbF9Z\/t+CHaCd5JWfkLCvJbX\/\/Gwtws6rhVr8Nw7WHP8Qbve+rEX\/hzz9x132OxcT5VJ2GlHAPVQyvQuIPdrennm8zc4XFUOawalgesFOH0tpvbfdZ3JdQg1HDBRkxS6BMneE5WFW19bZn3+\/snqju7bRC4nFHfvLQUUWMQVCkXhgFcxLNpRGG9Ua9Va1maxWEIS4Qzw0JpXqIg0Pr5LAdF6cO4y9ZFt2xItEwTdoCogGwBQ2AicI+qZQ1cv2ePEGMqFisWCbhnEHjjR84cPno6Q1wHNyRCsAf7v+socSwXRGlt\/sbC7FXUMEtdDfyJcw+N7ztGfKJgIgQqaGfCKloPh9g3iCnoLFyZyQROTXPHElf31Zk0pD3GoApAiVjQdI5VDRXF9Xf\/8Zdeu7w22aoiQDhhFibpeLNy\/vQ+XcfjAS+sLHGNqpxF8aA9xH0V08hTJg59XafBcZUabTKbxjkkOwgI7QbI0rilassE9A12h\/3dLrgRdJszslVZRh6AYkBJOHsUUH8hCkA1tEvXd7Kcn6hrRY7UJSLEC6gSJzSC5IHFnbu27CPb\/pHt\/pHt0bHtoZQUXVMB+NGgIGqmQz3QTmslPS9\/U6cMIKOMqtSJIFIs5tihEwN2LMvUAc08RXRdU1Fk8NlGvQ4HxjsoiSCkEeYAOVQ3Xqntqlx6CHUKxKxVKijhIAr3mERS7oBAwJVlwHsZMZlGCNJIZhgWlByMBaCJuoTQR7BAve7dGWnDGxAO6FYkNophiSU1QQGxHImKhJIB8AC9REGBVaCO\/RDavkjy6L0ffqo50SCSRE3YFF9wLY2KEDhNURdvz0VeqBmWrmiIMbnEjWK\/amhjrTpY7cy1OyCqgEi1Zn3sox+rVxt\/oAX+qB576SRyjSjw+hsvfPVrvxkngVmhDYdoGwxZa7fb\/X4X3wKjUSyoEcM0UDSWYg13nBe++dJo4DZbY2NjzTQOSbTmzO7GjiHBTjX4cxzFhgHTKBdZLzemgljDV5Ii0fiCckGe0j8LMF04vmUYNDydqo961D0aTk\/tVYhJkHk0Er1iVASaV0cWSZ1EcFZoG0HVFKKKAsji3lKGYhIjOTyYa5hk0D45z0igsLRRlm+q2mjYvn3ltZU7b++s3Lbba6PupszT3okIlrA43AdyFSEHxs4yED8wYmHu1svXFjdYXhdSPiCq7Nl+yrnZY4kjMNxOQcOVA07diOMzfDYFQwVy5PkFQbgtKQu8lFFkDvM0UxiV48UgC2nVFF4A64DBgeIgj4jtZKgFfCH1gIBhgJQgBTD\/KIwBEX\/mv\/x5cI0kCpBJfArLhuN6vofCqFu1jeWNzcUNMIuQLcIihxgbdDtZDJfhAG0l32dQOEg6vDsJoguioMjcjiTtyFJHVkeCtKxJz4niJoQfXCyliUVhEIIV4VIEQtQ+HgqrgbvxBQshp8oKJVLkaDMIy4T744ARAB+zKAEbKEdLgGaxAHnQ7cDz3KGD0BB6AbQFqAOt+wSqVq6YyLPUkhHTwCSiAoARfEVqgdr2adAlJ9LCo0gMrfEMpKJNomOyHsgyUVTI6GCcNATYD0Lb9nZ22jMzi6trm4tLa4sLa53dAahUvzeEYUOawsh1w6DhyBrAA0qJqCAU1sgZrKwuvX3l0vWbV67fvDY9faM\/au\/ubPUHXco7+OkPmgP5R+b675YTvPP0UtehfPD761\/9rX57UDGUJKN9P8erwk987L6PfPyp6tS9kXwsFxSaDQqsFAkFBlt33JVX9hvdZoWmmlB7KXygEGBs9igd9NkwQLQQgKPQXixJa0aaOCLIGuRie6c92rxz15HG5k5XZIVms7LbZc1aK\/BCXVaajfrQcWABlUoFRgMUQIhBQaLSacSLF8iiqGm0mJJPO43GiCKGaXb7fSgChBnDMob9IdAfZkG1nmXQFgHtmCDQ6p0C1zRFDXwUQStLj5659+Dxc9ReTSVARUFFUrKA7x1UNDApSeztbi\/ceINa\/hI2ZdLJo6eOHLsbhD3nUtBhSVUkQZBphzVNpmG6FCv3Qkvg9b32G2K+BWLJ0bBcQB\/P0+CbBGIFEfmf\/vNvfOWbNyGYoEn9iJZLztKoZur3nT8hkUSnpniRZ2qmiCuHnSFSJMpi4NF2T9WqgUqkITZFbhoqYJRGGZeznOEbFZSNJne3O97Ig+VqijzsO1XLRBJACxRZihM2jInkIcVG1Xzt7dU4ZPaPVZDyOI3ACZD5nBPGHf8n31w9tWUf3ekf2Rke3R0da7uhUNw6WOPKVVBoxUFqxKMWSmJF8G0ki9oLcACmEZv5MiIDW\/juMOz1R8ALWAvCNyoRZ0iy5DjUbQxCjnQCPoBKIILlpBNIAXLssuWe7oLKxVMQ6VFbeI8zwXhQ3bgK0Iw3QGcYHq5Vafd92qUCd6Wkla0RxCqQuIzGNuKO0DQ4GTdErhGYSD6KNG8KbyDygCOoROomYGlTTfxp6AaQy\/FGEwcmnnjf47grLAa1Txvkc1BvnqaD5RhcxKzMLIchdXX1abwbL5paEAfNVm1yarK30+uvdgyrOoo8XhY\/\/KFnoIap0H6kj70KxQFIJdzAG9cbfuW3fu1b3\/maqEjAZiArcA\/F28Gx3Yb1ojRR0qooyagnw5I5+c71menLt2uq5UOLFfG+\/ROotADhmRejoVvEoIMhSgthGhUHoZ+Uu3ei5OGGqor4TV2EKKpmq+nYNIYG9EuiMWk0Qw9hBmQRxBzoAN6AH2J+cA+eq1Y0Cz5EdRodPHb2mc\/8l0fPXjDrY4yg6KbuBjZbxKrIySILCyQ7UUiHQKYGeawatBBPRGOdIUFjGEpvZ2N7ZW5x+sbsrUtzN95cW7izsz7fXl+I\/GES+\/B\/VZOpjx\/RQ5Hmrrx8Z26Ftk7h8wjuwWZiP\/rZNPqbSXIiF67oqicJOsNucOx64n2Q5WlRLVF8Tla\/yguxqmdMxIsKE4PHxEESUssbaCpNuSIeA10NU4dx+lC1pPsjuIGhgfrTgEaUHsLeJ37qI3edOYUvYWE09IdIEa0FF0c0BaNIiptvXoti2hUsiGOXtlORI9eDBILdlhsRgTPD3Wi7GTxOEuXpKP5mlnyjYL5WcM8rxiuq8c08W0EwRj2ICtkALSlIShyGAsPBe3A4+Bg4EGoUeEGzfEkfsYIqc7TyICEvoJstgLHIJ7gLLso1VYOuQ6XJsCRqASXBAfSGDNzc2CCN6ICBxAgNtAM1KEFM4A8qicKHz8JGkQmSlCWtgViALaDciBeifGglEmoaRFjZ8740jfEn7gAAgFTGtQAzVHq\/P1xf31xd21hdW5+fX9zZ7W9utHd2ehyv5AUPiKrXG4pGVggr5SUeNQ9N6Afu+vrq4ur87ML0teuX5xfubO1uzMzPbO9sQet5rgMnQtro0b\/H9UlZAsq\/+yn9pgD1+877Pz7efTtBeX8c9BDWsQdXr7zOFL1aTUv87Mi48nM\/c\/Hex5\/gGvfG4gSCMowYKh5lBA64tfgq0756djw3hJBneJmXi6xAaImTot8rQAiSRIAzI5rsDHa31rc02RThYdWmVB\/Ds0BUdxYvnzna7PRHaRhP7qtvbaU7u0OEg2rVhGV3u4PjJ49HUeQOR8BlKI4A7z03DIJ6ra4b5dpKUWS7jiKKx44eA9\/f3d01gakVyx6NwjhCje+1EKDiEVChAVv1MdoEQeTrOm\/yNMwnT\/PJQ8ePn32QFhFFlKcGfSqQ38MJys9gGEzk+ws3XqNWSxpnn9anDpw991Cc5ozIqTfm8pdf5WfnlOef5\/\/Fv1A+92+9L3xROHKYO3IEd+61l5eufQvgFGUMwiCMX2ATUAJZVfyI\/x\/+2Ve\/+q3pRqNehjSgKvJLFAggd9eJQ5ZFU3jhOTDcpgUzFfu7NIkAjkoriniRVdWRQU5UsiQSQOhBCWgQM3kvkm6Ycq2qDXaG7siFT0Nz+W6g0350iLHUvu0iRsUhNAmwTzP1S9e2o4jZV+6nECehRHsvcIi99Tg5t9aX4eC00gBZDm6\/NG7NTNbBcgSm1GMcQADxGGQ8BRBQkeFickO8cjBvamgsmxW7ozAvOJDtJCuCwMc5aU6zDXVNA1qmEY09BqHWNHV8bBzXjkYjiuJl7w7KH6YEqwCNwcnk8KXQp0fQ+idlE0lZ6fgFnwaEoTQpNlDFEVjgziWLpQFZSCS1cpTaZa\/Zku5TCpY9vIAblqcBsiQQBZk2zgUYE\/kJs\/DJ9z9x6PBBODbqCA8lhYJ\/EEYC32qM7y5vba5sIgHAoDiMKqjicqDC0ZNHgLyL12cTLzGtStvuN8eazz7zUVWh3Zz\/WBxFgWolbdAfdD7\/+V+5feeGVTFIGUgy+Dqgpd1uDwZ9\/K3QbkY0gMUwLFivLKlvv3Fl\/sqdiVoLZaVArLN5Y6pFm3tTX64QuX57ezePUsMwQfoREnANyhvWC+kLqIXBgAeARwJ88UmJ74JJO1ZQy3aEEBfHoL+CJI3AVlwXpoq6TpNUUEVNF2o6mGuc5Umttf+Dn\/4LUyfOHT994d4Hnjx38T1H77pv3+FTilnXrWZIzU4pL8CME0OXDUOBWYgsB13hpUmU5S4YeVpEKYIXDIr3nUGv29nYWFpfuj17643Z66\/devuljflrdns9cOwsjlcX5heWt0JOzZkI7mIW+Z9dX\/+LznDM908x2YDnbsHelQpE\/iqKlufOCcLnefEfmdoiowkAqzziWOpBzym20oR+\/PAsB0ULi0N9UJQEdBJzhb4hbVyrGKSDWTEvsrPnTj3xvseiKAgRozzPcV2gDYwcJQxiXbFqM9emQVKB4aB0nX4fXoRUBI6DX3ALvEd1A05xFXkfDk2wZc0Tjb6qjjSzzQrbgtQBFMqKE3kQTjonceV4UpoIVLbnI+jCg4i4hCHCPjCVpj6JAlxOQhHTIo\/wWnoBjAAEIp\/aeg2NZh0jU8g7riV+iIN2dKMDMQJIwSTwrxDnu47jj+in2+3ZgxGCRIJ\/XgDRQr0qxPJBKuD0UGx0OYGtQuuPIY3AEfqI0Iq6MJBhlCJILAkeWlgWMg6XEhQAdIB3Ozvd7e3OYOAsLCzfmZnb2tre3W13OwOwFwhUsdwEEvAF8qRqukkryoCUsn7ogVSsb66tri\/dvHX9zUuv3bx5bWl5fmtnI47Dbq+DStRpezZqUEECCMbL0n\/nlX5\/9927Pn6oMYZ0d\/xHUaiqPjl1oDFu1nRnf5P7yE88tv\/Ug1z9gsfpiHok8wva1jYebe3MPN\/i1k5PSELuMuAJnAyOGqeF42XDAbgbTFAE9UPI7fZ2aPFNwG6OACCrRlNs7COQZZmZq68cmTAHw6Ezcicmx6fv7A6czKrW4Veo3GodgV\/zbAfkl5YqQhwDU4cjGWYOJp+ngwGYeKzIykRrHKXfHw5azSYMruw+YMBGITgmJiZoSAHZAmuaZpoXu\/0+5IYuFVWZ+iBQwYJWuffBp2CG5FW0v3FZKBTvfudAGAOO4yOEgtuXX4hoO3Oq3fGpw2fOPQInlDQj\/c2vuH\/jr+lf\/arw4kvVxQVjbT1cXWM\/9L7i9El4ksixa8tXh7bfG4V9252oVVUW2ltkZfOf\/vPf\/uKXr1uVCjl6BvkrkIohT6ad944carZaAJGyywucoKbClnfXd6k3EWadsa5jmxaNtCc6QVOr4RtAUYYth+biOt1UKhXd7jmjnl2Wg0Ijtpo0MAPVDvIhq3KSBxxHK7LJmvraFZgmv3+sWkrmvNyTHbfOG0F0YWmAqqXAS+yVju2qenvKxBt8TgwT7kKcAFBPpACRuqSddJCR0VzEshRZbqM9hD5EzdDA7nK3a1QFgAM3oKmCUGOkRVKwBM9zUTNxFKslrCCiA+7h2ZQIBsWwNymDxhaANUIhgQTAwwFZJBEJYlAwBXBkL9jjFYZUtjskIBlIG0EMCQWaFKfKYJgipCH+xMl0Z6S8nNAVBiFQAwnGnRH44LFI6Pi+sfd+8EnNoj04wFD9KMQ\/RAlaiklVJEZYujnjuQGYFkgGUtgcb6EeTFOfOjgF99hYXE2TXBaknjs8c++5D33w6bKR80f8oIqknxKw1jaWfumX\/z8jZwhfo2mu5EQUOTY3N4HbKEyQZwQXhFIUZaU5FvnJ68+9urGwerg1OewPICKquuGFgVzR6s0acBsWG7jB6vxyvVoDRne6XdOyANBhGNK8Pc+VFZmal8phoWSh5dLsELF4D+qG9MF3EEIOHzoUJul2twOCgIqD\/YCV0K4CqtgwIc8Sam0WpRPn7ud4CfSCdLQgN8cO7D965sx9D52\/+Ojpc\/efOn1fvbV\/fOoo3DFBrCoyLodiV\/RaVdFkhS+5I\/VRFD4xCD6loJUAjmJodQTf0Wh3Y2V9fe7ypdeuvfLaaLjdo4GPMrHtQtjn2P+nTnfc8+FdyMmJnF1N2TmZjVMaHrHMKW+w3G8Jkm82RTiMxMA6C5rlkCByIfrDDlHOYEtk4ih3hvrMYK4KWTVUG5yAJHYYI4jGRkX7yZ\/6hGGR2oaT4BtCRZ4fjIa4pFKrh313bW4ZfodazfJ0p9fTKtUgCGmaPjmugKdQ2wMcFuSaSDkPBs1yKe2EImmcwABvYpbxPQ\/UjqHxXiEYFc1SfmcKGA3cId+BIpYUeBbcGaQefBEpSlmmNT4GZMEJ1MaYpVAow24v9HxkB1lD5cLzELyhSAFTfhCgzJCLOIL2o91mSBvAIBDrSxfCnZ3BCCwhi5JRf+A7bmA7eKWplb4fBRFpLogKaAZOBL0oyYKA4gIaEAHiOVB2pA1Fi3Pg\/ngcTLu0fLJxMrxSjMCeTNOioSOghkk2GtogBqurmwuLq6uo+dXN9fXtfh9JGJXDEXTLrDWbYyDNuk67cggCGyXArSBJw05n58bNq9evX55bmJm+c3NtbaU\/6ra726hxsDQYb\/nwPST9oY8fmhOUJkW4vdMb9rr27sqdc\/ee3X\/2\/ZlxAmyoXEaTp000mayzfCNce\/lYbTBV12n4AGqPZ\/B1nEsjuxj22ThSYMDAAMfzu73dsYnqxKQFmpYkvK6rTCEqE0dQmIamLky\/XZFj1PCgP1JlMUykjR3f9XxILtR9wTK727uoflqaBg6PYKDISCt1C9K6mplt26DJ460xJH4wGgxHI9gZqACAAzlB1bYaNAcaGaOi5+E\/tNVodzgE\/zVUaiqA0+Brqzlx4cGnUMW0ay1F0bIgfu9BH8HW8PX1N74deg4YEEXo8akzFx4HYEmCIizdqn3tW2MMA6FHJ0POIi4\/\/mR03\/kiyZgs2Vy7RkYEQ8yZVt2QIbZ581\/88nO\/\/PkXNcVA6ZIsZagxDfAHDgLsg\/GdOXVwbEwlOELc5bkGbSvJbK9u0uhfBC3kIYqtmok0U\/d\/CuBjaTUxKJeyuPKsUHWx0bRGvZFNawTl1aoBg240DFlFwE6tqn763MlDRyYPHzk0sW\/S9t2X3lxFSJ0ar8KZaXw4cX3yDCj6iVEUSvxIk21VGGmCK\/FL4\/pKS6cmBqh\/YuI0fIq6axgacAGjgreU7XXwVMpdqTfo9K2uA5GFAwACDMWXwCryapzI8wixYGw0hgOxnwqeWgIQ\/gn4cqAqUgbWU\/g+7biKCxAMcCEigUqt1gKMKKFhZTRsECaxRyAANSg6QFkQhtRjWXYqgXH6oV\/SwQInw\/lBBUq0pN1hgV8xNcgmCFQEtQVTPpHglhN4BJvzF84eOXkoiGkb6zCkHe9RDrEPwGIajTF7t3\/n8m3gFOw5pDGPtH7i0HcNQzt24nhnY2dzcV03zCyJ7SR434c+cM\/df5wmIqIi37765m98+ddgWLUaGCRiswI6h2IcDAYgXrqmUeyhLnZJEOVqrRl5yZsvvbm1tN4y6wEt5l1YusaJQmc4Ui0dBIuwnowuH3YHAiPYzgjXorpR73AOz3dxN3gHAEFXNQhE1LgiyahrmBBwGo9GvTZq9Wa9geRBSPTtIQyxjCgcAkoQ0RbhjQonUaMgr6rSuQtP6VqNGreZjC3AY2lMEFl+wepmsz528Mipe4+effDsfe85\/8ATUOjbK\/MC7dbEKYiBIOo5J4qsRHu+IyOkPdgcNB1ODB7J0C6u1ABegPuryA+XO6zgZhltM5wUozyxvfjBOJHKBVLMNDkiZa9y7FAyTEH28nSB58tZsAiQscBxCk+t8VmRlbmmxS4BkrBcFDLMD3aLKqGms3K8IbkDtYfRHFrbt59+5r1nzp9yPAccApQX2fN8GG0OX9AMy1DN66+8RS0edNPCC4KR7+uVKkX\/JAJOoQLKqgRm4fasWI5DZzLeDH3Bd2pRWsszIXBl31WLwIcPwOIFFDHNfpZF2Q98OC+iuefSqEZwONelCWW4FywGHg14sRo1thyQjATjISDKOdJDM0tp1jEqF7CPTCGBjk9rKlBfIQgC6DmCRDmsmFAK5Q+ugBgPFsPyNKqR5o3jPQo8zUES4e0jd9TpZQHt7Zt6UeT6TJpJvMjQ0EUUIYtSAwTotJE9LXyNh5Rr4tGGLAAxmCLqBA8qWUGB58MmwRbwHuWJR9Emsyh3SQYgg1R1231aQml9a2F+aX5uEYxhe3u33enBgaA+cKtqpWYYOtAeGlhTZZJ\/bD5yna2drdn5GfCDt9++VKvW9+3bT173hz3+MO0E5X8G7AWw2Zg8fOLs4xlXTQCdQONcpiUyc3dz9tWi99apicyUeMhF6kpAFBWVKJEG\/dx1hDxTqIldFLvDwW574+DhRjnwjYxkOAwN3QB66\/tOlG273NLcrZocVnRla3PXNDRRM2cXhqCCmgb+DSbog2fjEsRyaAVFA7mkjgDHdpAiyDGdmr+p7RcW0xv2ozjZW+QY9gTIHh8bA6oDYsbHxk3DGA6HI9uGzQURbQ9sGkrdoAZ5oIViVS4+\/BTiCiAB6fw9fAB2hpKBt5EyLruc337lG3EYZEkG22FF7b6HnoJB8YIsXbnGffNbey2\/cC1gDCKZA6b5qU8yCR9H3vLCm1nmySwtoVavm83xsf\/5l77+v\/zSt6vVccAFtAYSTKBG06xhcxxCH4zrnruP1uoS5AdsEV5fr9Hyru2NrSLNQbzhmQAjHiGVfKnsXORAy2heraxriGEFghk4wVhl1LW9gWMg43UDwVKk3VtyOMLhowcEFXVGAT1Oi4HjvnppLcvEqWYFRg9Ao4Y98BGGdWVh9lD11tGJW8enrp6cvHqoeeNgY7FZzTNahSeHAgdY4I6Uffg7YA4XUZtB6cl4QSniJCSKphSt7fSDMKZKVGjJYcI4jkMsB+7gDkEYAeGRO0JzSIcMipNa7imilxMIyybElGQNSwuYEBKgdEr0pxNohhgdpEtK9AQM4SmgHYA2+HIZ83m8B1QRXUGAjyK8h0lQQwcNi4EqCoE74Bx4A99FjcBoYQyUt4w2Z4Lu+OhPPFsfr7m+g1sB+6gPIsEbaiFtWLW567NOz2F46sVACKyaVphEg8BDKJqamlqaXmTj3LBMGKcdhx985ukTx06idPY88UfsIAvYS9l3K5T51nNf++rXfxP6hnYxKIfxoxDgGp12OwFPNcy9laFN+LOiAy6KiHnuK99I7MAyq3mcTrTGgzBA2Oj1+jHqRGLHpsYhtVDaIBOd7bZv0\/6rVB08dRlQg19JCEDxoeAc20aFtpotVAdgAa84YHKGYVSrVeDLYDiksSR5bpcthai9hBRyBk9tVERNZKEuYI8H7rpQHd9f7nSMjFEmEe9Z2vYLMQLBNiFnymJGUKz6OJtEty6\/jCQGPnQwe\/HJj5+670lWlqrVWhzGTBFDWSJga7ooKQUnFKXqJjkNPdIfOT5uJOujAF8g7MWRqN8JvPEkvxtGCEnCMmNpqovydGM8II9A1hEuIbiguzgmoR63nEnL7i7KDimljPbjRu4o8bToL7nb3oHSQBhDLIBPnT1\/6iMf\/1CY+NRCkNAcHCLVRYEyhKUiJi3dmV+fWZZ5McrKrSbjOEgzzdCBurTQvWHCe0CR8Vg8CCaAi1GwYRr9X7L0\/xz7H0rzJ+Pk\/XH0bJo9LuhrebFdjn7MAEuwlXfGF6EcY7gWPoD3EqCyLCQgXBD+CIpnVCzcFskGAuKcNEy8IS1aAAxDBuFECAg0SgKpTxJUNIqAKouGRMDLyc1xNTg9CgeXoxbKTwiEqHmP2AxhEFg+HodCQCnm1N0QZbidHwa269kuFLvvOEkQAg4pNNOUKOphVBVaOAEmQYwIFJ94AHFfarJAFCArhV+Q9yOnFAyIBCMJtGUrHoq08ER9CiDeYGhv7eyur20uLW\/cmZ5bmF\/e3e2u0Q5PQQKlmxX1RtO0IIQ1JFXVUfgqiMXRI8cOTP1HzUh695ygdILvHig+BTZiqAzcOwPI0+xr6HNJ0EbtufbCNxvs2rEWhCgjSIYApypClEYcSIMO6xHt45F7EPW1ja00d\/cfhDVRBcDc4X6jHgJ8tZBEY+xwIdBgo7WVOWd7dqyu7+z0mrWKXqvduN1lBcnzaKd\/y7JgB57nIZaDBauqBko7HA5QQyhlTdEqpoXUI1Tgid1uD3EIwQXiEvGt0WiCqDuOU6tUy7ap2CVqyRU858MIWLBYoarTimRIm6AqDz32AXARGly7hwq\/+8DjyJxQ6WCJrHDn2itOv5vFMHhUv3rxkffRqli8lG+3d195MZSk0dRU8p73Bg\/cH911jH3yiez0aciAHJI+BONmoFtho1a1+qWvXPln\/+pbsgRSBIUBephrqgKPQLyhuIAD1MfzT586uG+fRSyZOAHbrOpQATvrWyDh1PRJNkmIAD8IAloWAo4CCYICl7W9rVcZ1RDGJxrewHP7g\/GxRqWilW2AOTzl8JFDWkWlpk+Wcd14c3sErLs23aa5iDVaxyNKAhmEJIcL0uS9ACgl8qnMJQITcilQMKWiQcJIyYNllG6DQA5CQBhdLhhC7QNlMVJrQUEppVGoG7tDoCqiCERJHNOAKUXXkHHgLfAfwEWXs2QAFKeBMAI1DiNsw0NUgC7NUYaHAqlE8iSAVNnLiAfhPT4hFHin7vARrbi+xzDwLd5AWeITwjZqKUVp4Qq6CYINTsdZCFdILc7MgKLl4gfw8DIBNOMdz0BWjp06+t4PPAXRBzUIcpGEpIlR4JqumxUz7DvL04uSqAmiAMzBlROtsThLvTRujTdqRmVpZgnqAOKyO+r7WfKxT3z8HbcvU7z360fsoCShKMLI++pvf+nty68DsAyd2k5VWUOEHg4G9mhICF7KOJyJEgOqmkalt9N\/6RvPs0Fa1yuozMnxMUBLzx4OPCfzoonxVj9was0qrUBcTh5zhs7u1i4RPZQ7hUAaRof4B0uo12vUdpOmFcuChURhpKgKIBhuDmcHHCMlwBDAM+C8OxgClSVRhtiMggikjlf4esUwRKpKmO6+4ycOHDkGOIbh4tEc9YxR01SOjJY\/JZPFibT2WG9n5daVF\/A3OARM7eITH3r8g5++676Ld194+OipC4fuOmfWp2qNCTtw0jwCS8fTDM1UdNmyNN2QeEXmw6Kx7fbKTj5VYN2EveF5x9jiSAIXzFNBvizK1xi5wJnw6wjAoIhwDI7GbNIInSKFqEVoh3nDChEf4Xo4EweSSmDAUeGj5JFsmDWt7ySzP\/Nzn26MV0F8Q29vDg2yTswAWGPoJhPndy7fYBNalw43gyxnRcn1Q92yZBVUAJqXKAjCIgIUipoWvFdlRhJSnvmvPf\/JMDyQpYey7Ai9puMc9xrPL4ka8IDmWAMbINFQeXDC0olAsmn9MVqeAeBB4wMAV6plqhUTEZ78EM6YZrEfZj51KeJ8BSIJFUydqgQ1JfESwRFxwOthY7gIuQZy4mTcBMnFM\/AIJB6lA+lEPliuex2Bz0Poy2JIk0ooTaAdVMUsT9v05YU9HNGgV9D84QivgevBUEAdSP8Sm6BBzXg6FTvBA03sKttBkT\/aqwWcB+\/wOKQJSSKgAKxQ8ABvoI4rJAdJEgXYORgDhEfcbve63cHS0tqd27OLC8utVtOyDFgeoA83sCxTEuTjR05MjE\/RDf+wxw\/VToCD0l2WDxJPc3r60OLUkJ0iEghs3lu\/bK8+d8SyJzVgP3QbCp0p99Nmh\/2s38v8gM2A\/oIEcb++uWRYzORUFUYK6kruzNIwX28UgkAnIq9WJnmjJgiy7w46y5cPjNUGQ4\/JY0FT5hYDx6NJhq16E3Fu6Lq2Y9dqVVQA7oz6Rq2jmiVBqhpWFIDbOcBu6lykVYME0o5RUq\/UEMM816XNUSQZEaY\/HJTwBH8CnrNeRMsc0RxlSG2OVheZPHRqbHI\/raIF8yftTX6FEsGBC8vfgENqMlE0fWv55trSfBEXHPxFMc4\/\/KRqmHkUc1MTtY9+WPjMZ8Wf\/fn8Z386\/oln049\/hDl1TxYGIE6FwO6fvKc5tu+3fuPXr91Ye\/Xt1V\/90iua1gJ0BmmAAEXkljg4DWMB74HVUARNs2NHxqemKjmTgTQArhpVVeL57nY79uHtoEewSGLLQEDyszRRJBFugvgtfHePVNWQmmNVd+g6\/UGtbqkquRMExtFjh2utZpzRYjrg3rtt59r1BUk3r97cDMNssmHBKKACBZ42kgbGcGT9JHBk\/AH6hLLM6EOGVgKkwZmoJgrTxAkQX2lxtLKpnhKIvJWlCs8Co6Y7bfcgR2iGEhgBMWpq8KeWIYAVjQkAAFOnJEEe8H+Pno9GNp4BsgirxCPonngYHkrjhGn1OvwNvMPn+DRK4j0hhX97NQgQRGkDWyBDEftB\/HEanos04A1IJ6ocJgSPRRqQu73OgrIDE3pAxPkwDaApLiEpoInv\/\/B7a826G\/iAMaAGjBxf4MKYzTVZGa7tttfbKs2qBz21oZs1VfOjMBf5Q4cPjXZ7OfApTlDJIZvJpvHss8+Otya+ywTesb7y9UfhoDrcezcYdD\/3uV+enb1da9DeWigYSaSR+e32LhG4nMZ84TSUGLAbsh6Mubvbe\/nrz8k5dAStlTVeb2SojDiyPd8yLA08oAA\/6Fut2lijAWmOu43ALjojnERTGFA9LOe6LurJqlqe74Ihjo+PF7B56EKWRazaI2pghQgPCB6e64EdgIH1aOVKGjVCqSLcTjlVMGSlqvFpTty5NXX4+PFzeUrTz6ASCNzxv+z1wicARPqHg4agyoEzun39ZRrmkwAGmfEDh6eO3eNCy7KiaQK0Dx8\/c\/7E3fefPv\/I3fe+Z+rgyX0HjoI6AHuQOtghtP\/ja8NPz20AWhc1A0lP\/bSd5bYoPExslv1XpvGvBHmHBhGmZEoJDbblWU6VRJZnQI5kXkJARdpQznABhDuENFxZRj5qYMPJiPewcPgUIiFs773vf\/ziQ\/eMvFGECwEiMFbaoKsc\/C8IlUp1Y2E1ppWBfF6UEQJBqVB5w5FrWiYIKzgIFRt0AfVD5oIkKHAikCxaQ1z56GBwCMGbJglAflAVBFzxWxw3y8ImGI0HI6b2doAq6hClQCqFUgueANIFb+aJwDOMUbX0iom6oyG6dB8G8XjY6YOeIwsEZ2WyUUNwMWoMBjjEsV6uRYYvICRwW1yI7\/A52AZBX9negEcDPWAneA+bhH4i\/6U5F0Q3wZOQL8BOCNAscpis63rk3hzNvaShlVHioSwGo8QPQRegUGmv8yCA7cEmod4ElAi1GVAvJ26JLMi0OQvJkmxvmALIg0A8BeUg8CL1jJXflumlKIunUSKhQDhq6jh16oSuK3ESpMhIFNuOM+gNTp08vW\/yAPL4h0aGH5YTlIaPg54EA2ZHtNXQXo\/OaHn2ZXV089wBxRRBfOEtpetliRewgz4\/7MOdqdW34MW+PRiMtpoNqV6VypoFkaIIB5oO8jTs2gxDLF6r1MXKGGql3dmaufbaueNTg34vzdOJyckbt3ajON83Nh5n+cbuFgExL9Du92nSbLUQ+2Eypq4DnVF2g9EQSUdlUJeBRANtAOiNWq2cQcQbqg5C4HquQ0KTOuNhaSC4NqAljFRdqZsinwfl0Pzi6pVLt65dvvr2W9sbG2Hiu8FIUmQi9gq1Z6AyySPwylKX5NLMzZW5WygLCG2Gly888pRcbWZwTZFLW60UUdawkiwsIA2jNCpozS8QRzJzVoEtvPzcN77z3NXbc11VNxTYCNQ6zaMlh6exbhDHsA+WAiHIZhwFE+O148dBvilKoYJqFjhy0dvqRW5Moy6YHAgIJ4j8CGxXVmTDNHw\/TIsUCgM+nLOFoiuNZiXwPHBXCDv4s+O5E5OtqUP7aBk3ntaftv3irUsz3UE4Md68Nr0FzjDZqtA4ZiYlNyJLBEYVAp4B1ppLiO2InKBYCVFJBHtwRRAsOBzquvR9MnhYEzEC2ACZF8gA\/K\/0goLlV3d6QYyngwCVE4TgwIQSrGEY0J2E7Xg4TUagCygfCAh70Rr3oN5TNga3M4ywXK8GJgHyVz6PZiKgxsljIQkIj3NkRFNV2BEIBImQcjNlglGO1kVQZRW2AZBA2Eb4oV7BPAfuEMjBqHA5TBgpSQmvQG1QGEjRybMnn\/rQEwAsPBSEgGyMCpvaTAklcmHpzjJCCsIWEgY6WzErYM1uHPh5MjU+Hg+cAlZCgM7iw2OnTn7mJ3\/q9+3J9kN7\/n+6Yw96cODN7yRjaWXuV7\/wb7d3N0HNoySiXlNFBv1aXVuDr1VrVeS9SAuya1lFFaB2Z6YX3nr+9Yqo65qhmIhWipBmI2e00tuVOLmlWk7o2t4QMYyRpbHJMVgR2VPBb69vgvrDjID4I3tkVsxyqGBUq9UgH1HUCPP4CgVLWIxqKxgPNlDyYyQanAMEP+fZgUf7JaIqYaQVo0IT3kS2ZUowfFSQYpgnzj9CjVuwPwRbgkB6U2YX3KAMdHgYoh7DSJIwd\/21wB5BSIgcO37w2LG7LpBQQc1nMeysHGmdK6phVcb2Hz117PS9p+976PwDj0+dPHPo3CN3D\/L7fuMbJzz3fOA7nDRjaF4QghQPGbYtci\/oxucVPdENkqVJVMp5QB+t0YMghwiDqkBswTupXHkDZBXljAORNaCmLCLlYFHUPJ6Dx9P6PI2x2md+7icFmXNsB9aL6+GzuBbPRUSsVquDnd7KnWVaqSUMkU34raIq0ISu51cbNRVqFtQpjKmjlAZygnaQCAGO4Uw54z8wHB0OfPB88pCyzFxJfKm1b7dRpxXg4G00QYeBtRBClA2glm7ShtWiULEsVS63Bec4s1HlFQWlDdfDTWAMiR\/5lGbqZUDx4zR8CO9DLEAJxLTUaRnjKcDQwiE64FomICUJQsEgg1niVNwRDoiSwYW4hPY2ICgvAxMJMBa5gnkQTkGF0G7dsizS9mkoCxQmUoRoAocm8AkjWoM9ioGl\/sj2Rk4ep3mcUHOC4yJxRZLjlawOapMeQuAIqJFVBSQAT8eBupU4oL5EpLM8kL2iXFEKD4KdPfjQRbNiOC6ILzEKin5pfveZ85MTe+0EVIbftc8f4vhhOQGOvcfgpwBURr4XZvFouLVz5zv7hM2z+3TQGGo0pZV6yKj8gB8O2dBneRaEQMSnu52dIHaOHJ0wVJpDQuNU6a60Xhi4HYA68iGxOAg0TjPU5iFqtuey1dmbh1pS6Nt+lEw0W70RM\/LgXFHJ7kVNkmmLEN9DpIdNwSeqVcQ2n4Rk2XoGWYD3uBPiB0q52Wyg6pAFVZJRnTACBeZPDkCbg1HPHAykKIZ+QGGyovBIVJQR8oMLttd31xZXZm\/cePvlN19+7vpbbwOS2ltba6tLeRIjUNHK9opSNZTbVy+tzV4rOw54aNpz9z7YmjyIhNBQKKKzQHkETaHgVJoGJ8OJYVewEGL3WRJdef3FnZ1RkjJw5SAISYygsDggKTFZ2BBMXJHLeVPlBISJsfqpU1MsE+0hU1WXNJXvbHT9QQDvBXYChREoEW4BSDK1dAhwCEVTEaFQn7A1VVcbTSsOQzahCceIXaA6x+86CmlPIwHzYuAGV64vr6z0FU1v1JU3r6z6YTE1VifHR8GWy5ZnHHOk63301vb9S+3zy+17VnfOre5eWO3zTLrW1JBuDhIFGaEWftQGSpUcE2ANWyebYeBa1LpAARaJZviV7a7nRxVD9ylixlDruARiHTVFzFGkxQc1HX\/yoFtQ2PAsmoBAd83DKKAAXLIEz6d16ki+U+txRB7D0RrJ9NzSouFYZBVluyWYAQoZ8BeSTI1gG3vTE3EiMXeaN0UNCIpCu\/qCcu2djOup15OWsiG6ACCK0+g9Tz06fmAcd3IgHWj97BypgSkBCpu1+vby9mC7R65SLvOOq2CTuH+ChNCYC05B6eeFE\/qWablRYNarH\/voTwC5yBfp2HPG\/z8e33s6EItsFO\/evvL6b3z5C37og1Jrhl5vNCDiUT57qwqiIBGmyo4wXlGpsVcSlbnphaUbCzJL6xQ1x1oof9d2UH3t0aBeb4J0I6h7KW3bLQmSG8e18QYvUH8zol3qRTDfkupRdwz8Hc6O6sdNfMelNUuKwqpUoM6A\/qhQQoM0wbfjY2OO46CaqlbF9v2dbhd2ApuEiIQkSfJMkNmmLitiAq8BXp+++LhEY\/dgO7QkLWgkcdyyCgjH936oRQ5uLdy5+orvDPw0UwSuOXHgxNmLsNvyigRUCIGRbABuU1JPoDnHiYJktMZPnLSssf\/lf23MLkAQqkl21ndysZgpBCfOoALmBPk6eSN1iSMywTI5XiQhC\/yEzKVmsBj+CDvH\/RHoUCZEfynNkBMiXIDCJzCVJC7NxiQJzrFPf\/SDh48fiOKw7CwALBMEQlyBjCJWQbIt3J5nwtx1HGQQpZQhOuV5ezgKkqhWlw+15JbONo3U1HgFAOM7JUwJSQ40NEiNcOmqbr1eq7yuW1crjZsN65JVuaVXY0ugafqqKhiKrJsMx4Oe5xAPSBU1ObKKqCB2Ihxoqkyt8DLchEH9IWskmnM2sj1EfgrFiPyCoJatekTGWQZOB6dGUVMgoGWKad\/Lsr+fLAdygq7am6QgoMZpOzSUEgV+gadpBxE4Dr0H7KLAcSqCPV1BIz8IBCgIcoATGiZGieFBB0nZp8B2gp9ChmlzPKqJQCPN7MFw0O1FtEYC9XpHfgBUQVXhhnguahG4nZKMwf1QV7ixRMKvNDVqrSx7TMjciIJm5+89DeUGo0KdwrDB\/SCOTp86+7v7Dr7nnu\/2+ENwgu87aDZqujT7krf8yplm2DIBrsgSrVNd1ooyHObDPpsmEnhzwYtRmmxsryJoHj46hYrKYuKb1A8B4C9LgRpFgLlx7oxC0zJjVtbGD9F4NFG6\/fardT00Vamz02s2a24i3ZzpRLGPAI8oEkYhirVerdNQn7IFGNhqmjTgBUwBJYsShgkgYcAmqD04Et5Tfxm4NY0IpQX4Pd+jHkbSkV6zUUfCtro9mdaTEbRyG2Caw5DCEjigEqxP5lhdYMNRZ2Xmyo0rL9+49Nq1S6++\/MILl954dXV5Hly3191dXl0szRNUND1194VDR49DHjC5oHO4sag7UbGzzXp9adhJ3nxbNfTcrBIv4MQ8Di699o3N9Xaa07orsALEPwRLRA4kGmaJdOQ0VhA+n8OgESknWtUTx8bKvmySy7rKViy1v9Xv7\/ZVU4NVwcYgsHEVsqyoyDLugRKHjKPuBhg4ImyrYSVBCMEFeDMt7cjxQwhdGZOgpqBbr15fvH17k+c1kONmU7s6vYsYva9ZgY3meSJwxNVzcIKB9\/6ZzrgTNN2w4URNN2l4sSNLtyarJUQh\/JZziJFMYhP0n1r391ASQAXbJ+2CMxAj2d2+mzMg4BSyEYcBfqg4x3ODKISZwYE91wWFB0NSFeotBtMAUSgbCRCVCQSBtXgPgCAOUjZMlQDKAtw1TSf3plnpMjQW7gZPxuNRwjAehA0kBh\/C4ZEo4CySDzJQUvIUTANfoWCrlSoeiouRNtCxMmucokiAbqOiP\/3sh2E7e6tp4VmoMsgS+so02ZSZuT4tswIAC5XmOC5SjTwiSvlJXG01\/aFdJIRctGEjk49C9+ipE088\/hS8hRzwR+Ug1Cr5AF7T517+1nMvfguOWGpUWoEAZTgajUAIgGgoWBQCIF8RZY5G2LNZkk1fn9m6s3FobB+gH1XmObQnJKgYNGit0dBF6vW3Yx+OYKoGzLvvjJoTTc3Q8BRN1d3haHtjG\/eBm1M7kOejjqSy4RClB5IBH6aVhPLMdsAzaO4u9Gqr2aSusSzTFNKgfdexwbwzak6DFdG0QS4XJK6uSVW9bJ0S+NPnH9SNGqqxpALIMBHL7xXBdw9i5IgS68u3OjvrQCSRZeqtiRNnH4QoAhYQ1S1tHNeDAu9dircUtouUA6TcuN79J\/90PMkQU3OG09LkvO\/W4nhaUHzoSJQy7chMT4IZw7AjkAPcdm\/0Gg2poV5oWCGAB9EFbB0nwLaJKtFAPFBecjU8OktzmpIduPc+cP7pZ94fxgHt+UlrbsILCWFG7hAYaahWd6Njt4eEDKU6B0jiFajbt+GbbKNujBm8yqYym3zoQ8989JOfmZoc29eqSXxWM2QOlC3xlhTplmXeUOWblnqnWr1Vrc6ZliewMRtzLK\/Lliwi5kPi56qmAK8UXeUVEWo6AoED1NEmFzG+lnSdWglRYhQrmDRM2ls7tAIAEgbUKGdjIbSjjpBp2JKuaQjXKBwK3VS1AmIxeGEYR0DxPeaE+sYdESZKnk+zVVEV+BY\/KE8IEVQV\/oU+GIagqjTRCeUATIBUCwPqZywpr49L8Q\/FT4\/bqxra35HmM9NHHBf6PmAK76nvFsAEDeq6e2MRfNvpd7o0ICkrwNEAduWmX+UM7XLVE0pkue4rUkgAksXnzp0GWyMORwyYcI3J2bvPnh9rTaBkvnt8n2G+u4OK9Q93wLZQMtdvvh63Zy9MZJYYEqqDukMripBBRq\/DDvoc\/JSiDSc7fry8uWhU2Yl9Zp5DvVF3LG5DwI9CpPdkiLgDJ9JilyBQsecWcUiskRUlveGDDErU5oM6NXVYtqgaJsIhKCBqAG9QNqgDOAOg2dQNWMbeLBoEg7JnS0LIx+d4Ij6BKaCyg5gW+ISX7XbacAaUnz0a7S2EDDiTRRkl3e57bTuKODkRNVatSnoVoQlFHdNA5RAUX+aFmqq0DEUpgsJetTeuX\/rOF\/5f\/\/CvPf+NLxrULMpGtEU04ZCqyYqhmZVq+M1vdf\/yX43\/q59Xn\/lQ9QMftD74jPNX\/nJm94ElGVUKSpKjdinIdxwJzaGHFcGXQWhNwzL1vcY06gTBA1BWgRfSalg0bgiZQBbLwgSogDxS7x6hA6IdqgI5QvWBayOOA1LJjihphGQCoTo1kcGh4FwTUy1BLldQpJZGZjiIN9YhpBTYJ+6Pe5KZQoJQLEc66cZCwUoZl\/JM\/M6KnNBFtLUE3sWAJChfCGJEeJpnSCCIo0xPafjlUX4OsoD\/dCCGI\/7CfcgzcZ+iQLEYFQsGA3fF51CHiDxg3KDh0ID4EzekKi0LAk5OC1yWTmvQys8suABkB+3XUjIq8m1yUgr8KB6ACArLcd3ddrs\/GOCT8oYoIpp5DETBuQjeiqZLsgpSAkGAaLe0tER92DAalHIJBypCEs8iOecvnDcsLS1XWddVFVwTB6iGpCqCIG2tbnW2OgAaGCceRI1YZX8WjRDLszAIFFrzgSsHV1LfZ8bmY+NjpbP8iBxUX3u\/UdpxGnzxy\/\/h2899TZTgPrxh6PV6TZahDQbtdhtnUXHTcGvqN02YVGaAvtKNK7e7i9sTZqPf7ykSQmLkjuyePWyMt+q1upSzI8fmNblWq0I5Op5ne6QLd7a2YbGiKFdq1vjkGAonot4Z0kyoxL1n0eRbKAPTQr1QGzKUuCQjYhiGgTSAEISBb2gqannPtLL\/H3P\/AS1bdt73gVUnV6668d2XQ+cc0I0OaDQykShRlkSTGlGSR0vLSbQ9yx7ZsiWatjzS2KZl2fRYFCVZtCCKAuMQDCJFkIBAEGADaHQ3Oqf3+uWbK5yqk8P8\/rteg4prWWjMAk7fvq\/uqXP22fsL\/+\/\/7bNDnhMP+t2hY2kpDtwiT8ukIGtFpVYyn032rkrLMi1jtETdf+ngrBzYtXujDUyRyIUDpotpUQBlfCNvMo+DRhsmTmnGQfi3bDhJljTvuX\/1U3\/39XNbeZ1bDTJtqx2Vn8jyW9IF+aCGLda4p9ZWIsZh1qQ5PFaJr5kfy0m1XexXXiSjNOaNgWFF+CyUARujBpAz0GNjc+1DH3kfbprCW82SWbgJFZrNZ5hyv9uDnl+7cKVIyLWoqUaDEpMAgU67C4xDPzTe0nVg1ovC8oZH73r3R773B\/69P\/Uf\/uf\/+Y\/+9\/\/5X\/pvf\/iH\/5M\/+0N\/8kPvfte77j938vhqV+v4hWE1jxp5w5VshUsuaUksUdme9kuwMqC3P2gNodtbg+5mu9m2rLZnBzDJQLdIXTpMV6O6\/flM3dA+8Z7PS7a3TAlAUKGhpb0uaX2n28K9cq1JCjNI9DuOER3Xc6VKozqCObffaq8NV9qu37LdtuW2PN8NfJyRtiNSqt3r9tDCUracUWJgehqwLtgBj2t32koRTOoSzmaSHg\/INP7ATGi0tJanRlCXGSnpZLbYG8+u7u9fvHr99Qv75y8fXrg839nT0ITZok4zp7a0jQYRsMj0br0FVHt6rg5JA9rDQ40tfevHt95PIDJc15d3952mvRWM\/QZyb+m9cdUkM9\/fL2ZzRZmGJnz613YvjxdXT5xa6Q988iljWk00ACijT5mpFrwTpuI\/jtWYTSI\/6NkuBnZGK\/p6rd3r1\/LZW+eObexujxtKv4ZXduC\/ZTidrmg\/tCTO0k6\/lywiz3EXSUxmcHiwD5PFM7CGpc6Io5gI8RWLwghIK08cP0FKOJnNWq76EpIiI3J4jqc8sKwOwjnJNdKeRfl+3JhGdZI3olTb3olUmuH6mrpi1+qfUG9aTWt5nO\/ZLRLbMuvYpEEa0keKs729+5Xf\/72d7SuDduD92meCv\/ep1bcud6CZSeanObHI+\/jHF+dO1XlK7Vrt1vabrz337EuLRKRRxk1UoFpl7pnX\/wALIaoNy9Cafco9jh5ZOXt2DfMzgbXR73j9rjfZnaifQGtd6W0\/1VY\/gSbswdtADvUxwO0I6\/B\/L3BX13oQjXQxO3P2dH\/UyyEH5OVZuXt9\/sxXX47TUpNuLLRqr44GX39xO07ro6sDeXWT7NygW7OxEcX3XJqKbBv0BF\/4ubjSev74wMdwGxaJuhbp45mqhKCLS0wcF5ehEG412TuZTX39cI4EqSB8Gj1DiymxMBsNCBVdUkMPpVN\/3A3A5XMUL3BOQaYZyqfhAnWNoCAHEHkNHPR9\/JV8HGlQKI9EKDSCCmDVuDSC5cBmOIOb8RhMiINCFNJghCZXUFahac8aXcxTaI3f8sJZiG2TjmydOPKhj76f5BC0hsiqyzCc0QRudwJv1B298szL070xVVIyoR1oLHCHIDaeTpOqwGY6jgefSIqcCvPE\/Wj2kY985O4776NW3w0HslIQRGtakujCz\/3CP3zj\/KurawMiKPQJAZKi7ezsANBLSaIgWJrk6bmdTgvm\/5XfeSo9TNd6q7v72wAmHgqVd7S4vYZscsv48HCRxsPBANeezsPVtTXNFHDrIyePrK2t6NWD58EFX3vpVXg0IW1jbQMwgathJxQCBxPJiyLOUBmsgqKOHNkMw3Aehng6j4D846MHsxkRcjhYoUGwRdqknuRm3e8FGwPyyCqK5lunzh07ewf0V93aDRiwAhEfOG78wyFnrMlRrly8cP6VZ2x142Go3i33Puq3Vwii3EtIwXjUPWYiGcfyTnXb1RirZd92y6cvfOnCtfGRqtGDUNr2P1pZ+dXWsFHktlYw0+BcMiB+k7PiCPKiosCskbyAWWRDJSstNnNhqCkCEVCQQij1Va8VuiCF++BH33\/L7WcRx3Q2JVkiA+F6yo3iCE8ZtPtXXr90cHXf91qkDjwURFUnRKOBP05mYbvbQ+Mr7SapXNmobrn34a0Tt0RaVbAm0fY73aMnb7rp1jsfePIDj3\/kk3c98OhD733iPe9979EjW\/1uy82jdrOwqiRT8lZGeQbFCFod2\/LtpktdqyrjSco1CQYQOk0VJGNMDfEmRbJItaeHY9rsgJBJKkZuGCGwhgsDJmgcheqdHean6RJadCSKY13GXRrn4qnLRH2KDsSRK3mSxKk3LGJ4AC84z+2tdodgjDyDlnaNwfDQNWI0vQMeyIxRmYiv7IXrucuM0dbAC\/IQaszBpXzAUAGYpjbR0H\/8AIJgvmtp4qIGXVR1EadZFOdJOtPowYmGa6QJguUCAtDm5urdd9+ewUawy\/kCe+dx5HfvevDd\/d7QmNPy+APD\/L94fOucgDZji\/PZ+HB8WKaXfIuMsJnl1SK0D\/fJrpTdo9ayYV++erWyxkdPtBxiJ2m8Fq3RuErCGM3DfGmMpVk9OtTxX2fhLPb8IdHBH242u6uObU0OD\/fe+sa5Y8MrV3cdz9rcOvLiK3uXr+63\/XbZLMkkhr0Bhh5lyWE40wrj5HBF2QpacEAcAdTGINAHj8DcMTGggR+asVhE6GAWLTBKTA6STPBFl5FGO2vdTQKq3Bhnq5tJVkRFNc8b46iaLNIIY05rD+h2tVJCEEDcWlhTphpkpJc+1UPpWQQ8QQN3rlx49cWvP\/27nz\/yjVfuP5i4YIJemUtvGpB6y+32xz\/qJoRXywv8S6889+zXn4syzN0hFJMd4mZqGFZJ67SzznIMrbrR8JB+173l5k1fU20x1HLYDbpd7\/DawWR33O52p9M5dt7qtMDWxTxU3yr6ihKcR8uFGMuxPXtltU92uz7sbxxZh0rz2CytkejzX391shNqmjZqbZL9NFcG7adfuraI663VnghFs3LkZcCb7dVO7lq7w\/aFjcGl1daFVffyIHh9o7fXa+sNoeVozxaKUeXV28nvZe6Lx4pdYBlN5EFZdpJVO9PIVtGVb3r20AwMH6eFenOjfJ6Hww8CH0Uny52QROQBRPX\/y1LFNvVAPI+QzPWQA57e8uDabXJ0iCCRI1WmrtVRQB\/Tf8idGhWvmpKS+h7l479InzrA9zmNnDm4DAFSJo4PqpKJEgMQ4wMP3Xf21tPTcIKJozXdJS7vAjTk0F7lfP3LX8+TPOhocxdXm0jDJkVcCH61Z20d2cpmmnm\/iBeIaR4vKt99\/PHHb7\/1Tj3xu+LAHCTd19586VP\/8O8dTPY1Fwxc0DIP2kH78uXL4\/EhkYlL0dSSlpGmt\/3gYHv\/1375N5phuRIM82bVGXTKJG3aLoy41+kWcGHs1WnsHu6t9YdkSHvjMdLBXmzffvzDjw\/XV4gJ0KZwgXMFe9d2JoeTfm+wvqohxljIcDjkYbDOyWxKkiA7134WwdbWkblWvJwTEXFNEoO59jexmp6faRS\/5uTwV5prAB8K7XWDrZHvOdove3Xz+OnbH4IwgBK0Edyo34bct\/\/VJ0sjaL2rly9eeOkrdq01goCPM3e9uzc6RhAXcGK3oqDYpAowriA71Yt7ciXKLYrPP\/25zyyKS8OVjax8s9P\/iaPHL+Wx0yBoavkaoguhRTzSdJHiDvgSHkFQlNyKkiCEr9FGfAb5cz1P4XkALXQJh21ablokt999y8c++eE012s1tLO8mIgFwlA4oDrfn73y9ZdoMKkIcnM8h2DJxUVVaaehNPXa7d4gWCfAqRPCv\/+hD2wcPanETx0hQFGNO5DZul\/4kv+5pzavXzp1OD1zmD3UbN3fHT32fZ988hMfOX3m3JFVvfRcwS7qrJHO6mxudkDkIJHrN5t+aUYYUGvH8ALcBDKO1IS\/paZi0XD+xGc5kDftFUSYoVcYA7\/xO\/WLWNytgTvALTLnsyIpiawmOOgUER0uKNbVaIDhWv7OtaMkSXPTPw+y6tDOtwDVNAy7hHYzrJiDp5h32U0NFTCLoelS0xGuahkwkTGoL8eNAXKzkCUxgMsABKFHnqFXbIIGKOQI2JW81RC1stZIWQQekB5kW1sbd95xS5EmMF0Jw\/dRitVwHn\/kPaQSxhCXxx8Y5v\/F4x2MJ1BC2PjGlz77s5\/61PnL17dnVafVqlN3MkZsfOdYrjcOZzsH19e3WpubQ\/TT1I67airywbLlWvyHSJBWhQFpahCCtp16Po0wMBhVszUK1k41NTewcfmlr5zd6l69vtewgcuN3\/39l2eh1W31Dqa7ZCQ4V5SkPFl9QJVyxEF\/IOBuNDbX1\/M0x5JFbw0xX1sZaU3pLN\/fP+DhGAriJnAmWQJfhlDDvgajfpwlJMrtXk88FSrTJPxr5AGuhUfrVbLdnUT1wbwcL4rxIkuqZgTVbJSdroYsgA1mYSSbposhZLWvjL+BpR4JF\/cezHFfIao4ZWPiWb\/h1L8zVuTudzrt4eDCqy994+vPjqcaIJ0qLdX8AuzDfHCxTe6isfg\/\/g3B9d367rtOuZrJwVcAq9\/veeHebLw7Jp6JuYO8PS0CnSXxoN\/DEhfTOQCda5Sv0nnbtQerXVBkc31F06otErt6EeaXL+1cvXjVrvATlySF9mOoa6vdr7+0vYiqY+uiVqWmZVe1VaDdyHNfP9575fjKG8c3XzsxfHmj\/8qR1e1+yyVV0+shCsBvuVpsQBav3gG9DQWagRHhl\/iiYIsc6eL2AbjPZdyIHmgw\/6rDtNXG99Qn3ATBM9oAo1\/2mCq0S7JyNlCRbIBQDaZzMaLgWXGsHYrxfi4AMLkXoMRmiVjKbl0XQCRaAI6z2Qzh6DKNArXklmZ1PICEZ1EIf1IgT9FiCdC\/QiPa1H\/brD\/0kQ+0+75QuNC6hDgM9aS2OPrqaLhzZff3\/+lTq6M14C6Nkx68pFKiTPNn0Tytym67U5MrgGuWBV+BiLVWBx\/\/2MePHz1Jlb4bDpqC9zz99Jd+\/hd\/JivioA0jcEbdoe8FZOHb17cBPoUl8lEzSEp+ajX5c29n\/6nPfsXONdxUO90NRCtBUBSE4yAB+D2AuL27jb10bH8eJSTxXlV7Hf++xx\/0etoKS0mxZc3juN\/tT\/YO4nl8\/OjxcKq5RSsrK612MAs1qAtjlb0S81xvY22NeHf+\/HkUjU4xM3QRLsJOqzMJ59MFOK6Xx+hRIRsg05D7zlqnid8v4niwduSmex\/XGEIyIJAENH87ov8B9KpHThYNXr\/+3O\/VRYox4LOn73jX6pFzVZmCjRgE7iar1\/8UIGqAfXiXLkNj7d5ao0i+9tRnL1wanx9svNRrfbUXXHOCaDohI4k1JqAOPF9xSitza+4rcsByAD2NPSICqxtA6SYBgxoFnicq1tFC+lG8wGk8RwsUdvqtP\/LHv3cw6qRZTJCXZZvZodg1NJSw1\/E75196c7Y\/6XU7uAo8qVGrZwKQJB8XJ8iSpmf3Bv56167zxG51H\/vw9w02jhnXxoEl4tKxPc9p\/j\/\/i+7f\/gnr1369+syvlp\/5ZetXPhN\/+UvDH\/oh77b7zp6988EH3v3gI498+IMfv\/+++86cObW+2ht2\/ZV+YFdxo46rRuJo2qODRvBfRVZ1IWjGUDibReEcloQMCfCCEXPwgTNLfJEcuFmvTLSKOdJTsg53hao5Du3hGhECk2Dg0dyp8oFFvSUhFsSgOYVEcaROBczD9Lhwl+mrUO8XJkeTTQUE+MbZVYghATbi4l6ux7yJjpicFpDgeagKuzcTJTQGoixRK8aKg+D1HIaI6AWxFk9UJQsXNXfbuNXxY0duveUseIO5Al\/qCK1r1Prwux5Rj84fHH9gmP8Xj3fw7sD8fuOVl3\/j1z53fSd98fX9\/Wm11ltFfMo6rdbe4eF0sXPi1MrqajdPUsV\/DSWTJ+A1OvS6HEmqb8e854VPic+CwItFgiv1Wq432nBXj7lVYXneGy8\/e2xokYNjBtjx\/n5yZSctbaILDtUs6irWUM40TwXZw8EIC+fPteGQeJXmebfbK3JtZwel6Hd7qGT34LDdBojVzzjq972WH+fFJISl5usrw+PHT1y6vo0HU6UijrVAeVU7GFuDdKXtOprjpFf+np3qBZFIflw0DhfJNM5ncb1I67hsxpkm7WrjvFbbDTxsAlsgcJEwkpm+Mgg+d3L9a8eGz231nzq18lQ+efaF57\/81Oee\/frvfu0rz1y\/+Pp8Op7N1ZWYqOYNLEDwJnaCIWoWHMKkWkiUkOc6zfvvv6UVwJ+oWrPb9notaz6Ldq\/tU1uoLl4TtL00jeu06upFV6WdedtBlieEKXRGecPVATGxH1hlsy6bVrwoL7x59cL5aw6QBcFynQIXwz+ajV6v9ezL+\/OoPL6+oreZVe6J7JmOSsGt1rGy8RB8EpGLYqjjTtskQUG0PTrXEegVw2mF8WJOonyZQS1OwN3+IkovXj8AjChU+yLIdRTX5cCasVST2uBCFCLXDYjjwkQT74WY\/JdlWpxqCRmkQaTjfOBPNEYeCdCHoaKIPNbsSaiooLVrtEUn5+FM5PfUDSCI5guiEFXgwCrUtyx6BI+hbnqrif1B9tt+iyzh1ntuuftdd4XzeVXAJ0Ag0NlK4gjC2u\/1u2736S8\/s7972B8O00I7KQ97Qxrut1uEm\/EijKtcC8Fo7e0C0hQtFm478Hud7\/\/+HyAEGuf7Th6KeuomSX\/xlz\/9hd\/7HI3DkJC\/+v8s7ag7m2rbEbEBSICnNyCIfbS6SjLz4tMvfuk3f3e9NVoZjJaidiEGvqcBPRgOyAh1COz5Imy5LrCYCiKQQ7x2bPX+Jx8CGkjAWh3f1iA5wrNsphW0i0k8G4f49epopLSpLGFpQAIqI9\/AKgaDQZQmFy9dIjmjMhAUoCDJc030aDZIYAgOo5VVqgEnx8ywBCJJu9vudTyoXbxYtDu9W+59jLoqz74hCT4YY3r74DN\/qx+sUT\/31OehBkpFqvrUzfdsnrhNo5QlPCBPRm6bwQfyGNdth\/PxD\/3J8td+I+j327edef71Z159bduzgonv7fsuBhZPZ3IZ7sXNtP56gsThwUmaqAwErW42sRUZIw9wHdBQq7Jk2SIy2Qq8Wdskur1Oz7Lr7\/nEB46fPbqI5vw3C+dpqsk43IziGo496g3HV\/avX7yut5SepxEzWjuhglQVeYGE4SSkYZYPU22tdNQOJDkc2M0qqtMFcRd7NgvzOa7dCn7h5wdvvaXR5nAUMmYy8nbQ+OPfn66tCpqyhht0yqCztrF1y2333nPvo4++5\/0PP\/roHffc9cC7Hzo6bEXbb5BSpBkB1VNPDsQEgKgak92DRTgHcHArkwshGz5r5ghhFW5EQIXKa2AZXyA6RCT5YzNcB2iV2iQTeDbLSqLuJXXgEmPepkAlqxqkLK5kOgPQZ5pAVhBVXjaK+WJOdRAaUZxacE9R5GAZ7abkEtAqi06geVIUoLxF1qjMB4TBSgFwQZngUJ3GxApO4i\/YLZXBcgAljJxqOL4fDPteuwOmHT26fuLEBk2KomQGyi80W68ddB568NG3JyrLEs2Hf7PjBqv6lo+V9bWVjbU0t+qyc\/6t6Mruona82nKvbV8KF1fPnFkbQjBTjSoClgne\/HZdqJB5rnn1ZeKAqIEIkXqkxNC7\/Q7y5Ww8OyQTQ24Q3WC4gTg31kdEL2S6Puqi0kk0Q\/GgM+gDSUNpMOJ+u4ujoIb1wQrWgiKHnS7\/YcfUI9JMkAWGiN2gIepGXCHcTMaHU9PPubmxsbG6MTk4JHvgWRQOIpNmQkh3rlybHhxO9\/ezxaLBw0CNZrMfmAUKHC\/QhJbAstpx4UySxiRuXBknr+8kr29XV8aNg6gRV45lt3rt7mJt9HO3rf7i7Zu\/dWz1V1a7v7jS+iwUvtM52q2P+Zk1Ob\/9\/D+dXnvZceo8w\/G0Rwi2wg\/RRaPSNZ9XrgtuLeWHYLEoddNhJurk0paAnMLGoWLEMC4jLGLlOIKGY5ErmD4PDBRPN\/RaXtLUi8gC82\/aTpJWs0n88vOvEt1JM7jAC9RZolBew81k97gHlncDqVBhzn9eaWlypDIU8h\/jivxD2KusOqqzuJGpfKoDburgOiXiutyc0gNMdw4nqC0RnZRF8VKLGwfD3mD5cm45Mgh7ISVFFMYJHWWOov8wdV\/9b2bs6ng8Jr3HovSSP9HsRHWTqv\/AJjAsXx8us1hMhchBIQANJ3FOfsMMsApq0wp8KALm0ev1yKg04lUvKUnINOAI3VBn\/lws5pj1Aw\/fp8nVZBjqVc0W8wW1BW9I57rdzvUr1w\/2DilNrazrfn\/A7RKreE4dtKHDrnYyQSKagATMwWszzYsxr8C\/sweapNpJuvjUz\/zUF7\/8hT50ZjiAqcC3EPtkNrt8+Qo1h3CLHdaCPL\/TDrpdq+E8++Wvv\/DlZ4+tbkEFJodjF9yDVjnudDwetNpHNjfQ6Jgv9g4W8znSb\/mttCim88lwc3jrI3enBLU01iJ94nm+tqquy6xMiGHy0Agf0khSVBdOZ5g9aIA99DpdDGtHW9HtExWwMtSNEoEGwosGlNhYuN\/2gyiGJXOLsr0VbYWg9ePm6qasCRj7uzuLcCwjVd6jwP6vOOQMuh4j9YKOhcfjr4TShTa6xUmxES6iinYDukr0UELd8jrZ7\/zTjRdePvHl3y\/+nT9d\/t\/+\/XtfvzqwEuIrrm5XGlyMh8ipiSjqpNQLDgUPM8taLLUsgTUAFJenVTQgKzKkS3v5CkIwnU0Pxwe0GPns7m9vbK3c9+DdegVN40XJPAIiEHo4mfCUbqfXLJsXXrvQ1HJ0GgDPk5Avz03iVK5sDhzcsktPW4Bp2YMiSz77K\/\/gUz\/+o\/\/oJ\/\/Kz\/\/UX\/vsZ37y2S\/\/yuXXvpKMr7hCIB3L34jIymkApMgBGYom0TFS\/wbSXsRp1czttts7etO97333k5+86eTZVjb3myQV6qBFmAYbeFyuVTwIutAUaIKWZ9BvwjBNlqxUPW2jyuNgTvNoAVFY+rLevsi3NLDDdC8Qk5rLVxI0pm7CcduDQX9lNMSwYbqaB+C3PNsj9nCr44OlmIXQ1HKaPFdIxqHBJDfivTJUDYLWfMjlsCM4HI+CA5PtYxcCFtMlSTYLa9F74SwNozmVpALUmefCs1UqkOdpaS9oAdwHhGu1A1dJmISJ2tAdbcEKqJER8Ld+vCNOgPHf99Aj\/95\/\/MMf+vj39Idtt0qiuICOXrz6mu3Nb7pp3cZ0o5xqq4XmIEbgrpKdYo9OQN\/UEhMDcHW1XzZqF1VGhlnFMwuaRZOJXk13HqXdbmAy7dJ2eF4IZBAAuIeowEmN6AaFtQKKxydgg\/M4SafVhi7jyMtQQx3UlbyYYw2jlWGURPuHh+QHYP\/W6tpgOAgN9aPiGfFYZlgDHEouXBf2ksXJ+OAwWyQh9ODqTjpbELeLKK2S3IbQBK0Oyg8CELLpeU3Hz0v7IMzevDq7sJedH9ev7BaXQ+uS3T\/sDGzP7nvewG91zGZ9cx4zy6Ip8iBhInmlvAK\/waQQFy4D6ye0ALUm+9GesNiWYolgwvBa9WgqRHMx8lVnFxm\/+hgFTHmqjnd9q1ePiJmEHfF4TY1ZJLBptRB14TseecX0MHr91beyVEQGmYnegiC4hAnbPIwMwLw7NkI1JwF9uF43yW\/Znt+yO7nl6iE\/N2\/v33bt8Og0c3HqylymsYC6x3QambcGeoTKoU785ouluRd1hS5oKUZiBmkAGbhPxJ\/wAxJu+ZWtDgA+4IGz2Qznp3DUxyna1mq3h8OhFLfsYWvArKPpZALPozxcSCHCjFjWc80H4go0UZhnxihxRnxCvEozndANkYbHddudbqvDbx7U63ahWcARCIseT5w+cfLkSWC03++CFzGncIVoQevaWIcTzGfzKi\/U8dDU5i6QnbxSZgqxmoUzKr++traxsW4UK07lexqFsLa+Ti5jnO87eIDI1vXrl3\/qp\/72y6+8uLo6wrrExkTUHOQ\/DxfKkHxQV6PpRqM+cOa2O0Gn\/\/nf\/Pybz7y80R\/5vjtdhKCkbztg4itvvoY\/KjbUpd\/toKMqKQI70PikCXQ8WTm1dt\/jDyDfJEpxKz\/gttmF117GiR3xME42PTK+VgBSIPBrV6+F8xBpL6Mmv+UOlcaTo2I4P5yAqnLHsNeXDymdqJbb7SDneTjHIBXAzXq73IihcgZmmcWEdoRgnMwc2PPyw42DB3ASlhm0VtbWcGQeSi3ihHRWrzKXF2H0VgNnk0eASthZ61d+qQUiN52tqtH9J7\/+0N\/59f\/q1d07ZvMctMIyIPEu+X0n8MRy8Do5jF7TwoBUGfU0qzeR\/LnudLqCKvCH2ohYlzjqsN+jJp7lIyKv7Tz63kfiFOTT+l2tjuxZ5CLLtGgEDuB1rrx5OVnExDKyf+06mynqm85wC5sXtdF7N18v9z2fODwlmGdlFDWTsHn9rd0Xv\/a1L\/2TX\/31T\/\/kL\/wfP\/YP\/ve\/9Or0\/EHLPeh7+8PWwZCkqF+e3nS7fjOA5babtofzC8g0LE2ZdkNrR+aEyjwrrl67olloST5NtECt6ZcTr4qjOcp1tbCHkER9Aua9KqbIR1qNNiUkjSqoRezBK0xLnY5iV8OVEfapySfEYugEQQHvhi5o1LYUhT1TLiCzor2y1o4c2Qo67UibmsbQMFUYlTju8s0\/YIgMwQ3PpApeS4tjwuNlcFotd8ERzyP5slnwmNPUkCsRqeYntLXmd9OxqQzMAJaA2UV5GlG7WBvdKXVp6vUo1FfhFE1rhGHsuV6\/i1100B2lgXj8fifHOxpjCIZjY6fP3vTk+993+23Hrr31+1aVNavZ+oa9ttJDITS7Nl3SpuMXNauXGIUqDuBytEwZkF7nyOUEzeS72kuME4swAXWtZuWvH7dbK55r72xfO7zwzJHV9pWr14ckc17w1NPn2\/1VlI04yNuQ6aDXD2czLWrbtObxghgw6vX9VutgHsYQFvy70rsf7YwcL7RQhYbvabSahnHV9cb6On9ADigQyjgOw+l83u52ABeNSzF9zmiUeKzYoBULADGl8hk\/hIS81CiQOIHfEURQvBa68pymqwHF6F+DZ\/0Wxj1Lsum8sT2vt6dJmFlxVrWLvNO02q2h3fa1kxS8F61bzs7eHAwEbl0it8ijUIuwhJUYWoAUhVycbfnuffec7ncV2iEGPHZt2K7y6sr5y\/2udjOaTRewgm6nDWHudIN2vw3gEjfxQ8oiYsLBVtYHQdu3mvZ0nLzywvm9nQnYhWBRTxyHGHqaoyuUWg+HnRde358v8qNrI2m2UXkOpJ8ELr975\/CPfOP6A28d3HX54M7Lh3dfnt5zeRY51gtH+25l27VdalCBXjHItDWyRz3w5oOGFMhhNPWfB9mzOLm0c6hONc0UKYzVcYvGbaEUXIITNA2dcvAZx8N4kAaKoErmSngV3EgLAaE+bIMrCfOgCSGEC6iGZGg2OhKOKCOURXEZJWMV\/CaE8B0nsQyuEkSnGXehCdUWw4UhNS0gQn1WjfKjn\/jwxtGNJNNAV1Os3n0S\/AhJeD8SeP35V+NQq5z1Bv227xsehKMoOtEEWxO26pZlRixi20kKx7Rb3m333P3+976fomjpd+5oPv\/CMz\/3i5\/eP9wNtIyMTcKNHvECTaeazqi52uiIECA38A68jOfp7\/\/O773y9IvH17YgcaPRCJqnwNioptNJr9dBdODglWtXcaWqqOFYCFJLiSbRibvPPPi+d1XmdZAdBN3hyMvn\/eRKGk0XzQ65ODADLsN3G3ktGCa45SkwDbVC0er+QctmGRLUxIMAUGMn0qzGiptJIpPZNM5yv91BtVSrabsEC8wS0+u23VUtxlbFaX7rnfevbp0GtOSLN5LeJQ345qHPVbOCs7716rPbV16DYUbzeGXr1Jk7H1QHg\/CO7MfRyOUSSGl4QTO9cGH+1\/77DRmViAMxv1NVvaL8+srqhVYgpFSGnoFCfS27QipE8AmoHsEeZiNOQEA0kGtcQ3YbBFp2EzehphACMAQeDBhF6fyJDzz2yOMPwQhwetIDxGU6autwHnF\/t9uf701f\/voLbkNv7gGTaB5ihwQ5AlhRZB31Y3kHkxn4R1ZzbL3f822kh7qoBsgYpYXvD+rSLYm\/eX2wv3tl4L5wbOXpU8PnTqy9csvWm\/ec2Xn4zms+ic44i8cEUydo2X5QO64aD4RJvEoV8Lkv\/dYvheNrs9KbFr4DZ6kqnJBGJrOQtFqdIlxq9EH1AHUaghBQtCGFEBczjAAbrTRWYEmSCE\/wANosZAZSKr3mh0ciQ67kXlg4F3GhQRrIgdjhlICwWBBFlo8wIuezXlbyJxXAx5dvBDjLD7E+gGLQqKZmRlATeAb1gOaSmfANfIWLOW1MCH\/RLkrSIP+b35wv8wKgKxvVaG0N68aUG1V95tTW5uYqzIHnQ5iUtzbrwGu\/+6FHgcOlIX5rx7cOLlIB\/MdogqPd9bwgW1mpz55e7Xfa4taV0rLlfA4NrSNZWG4\/JdWoiwNvQ9aUBLVBHuaVCvWh2KamjLnahLtJ1F2M9bCqsbp5LKv9br8PEh3sHbQC69ixdXyWYI\/Suh11VO7v7fuuR1SezaZkLvA7wsj+ZDxfzKfzaSx+l68MRweHh0jcc1zCK7RLESIr+71BDxXqldgIvgZGEFuEbBzmfRJaRDeYF49DWzIOM+IPZre0OXgJLZtNw\/HewfRgPNsdR\/uzxeEsXmhJpW67RZwmbvY7WL89qqInFrM\/Pos+uHvwyFv73\/vKwXsvHE6uhhcPk724mbtdr0tQaJaN5nQ+47n4LXLAV3goiOACOWagnWv8H8sotJSnZGjMSz0iGCWypaWIz\/W0zB+e71hQTms46lGY3tSUhZkyUsLSlUhrQZR6NksvXri6t3PY6fRk3OqKVGetygIjcCTKlxpl0PpLMZsTlQURKsg47F5St4uqk+unm1etsghg65riVegi1I3oFY6XStfAXSyd0kyBKmoJs\/rbhFXRb42fEAHCkvhK\/u9qtVHwHQ2iHa4F97mYk+SMUAqaozCepkA\/aEXJhBn0SaziM1eS8VMIiluW1u505J8SoVn7zAwp5FnUp9VGHZoygxBIxuAL6jkx0xCW2lc\/CvlHlh3Z2rjt7tsgcTSQb6lSO9DkJdOX4XWD7v71vWgWmY5OMmwrjhY0iuAPMFFUq9vBYSAHJlblqdngzQ88aMWp06f4RnL5jh6vvvrq8y++qBGbRRm0OuBns+mMJxMyb6SHwWCc5GRqXlJUeSOfF7\/7a789fWv73LHTZLJuO0gWUERnHseTxXw0GJ44cpRsOMyTTq9XpTkAOU0W2+PdpExuftdtdz10x3w+Fcl29QrRK2be7PK6W51e6ywOriv1t9yiUdstV124ZogJjrEc1bXUozrtbBveDtXotFoKjaZvgK\/QLAdaBow4g7RRPt+iecyAcKmsLadS2ve2rPKdqxfwpqVxLqGPgwctjxt\/G\/ezSQc9n0weQ8fEo8VU0650k3FP8lXgvql0Ey8K+kH33\/0Ptt\/9yPWWP9drexVysRW81PEJAFRJ4d9QVW2NqaFqGuCG5K2mE\/itThtc7MG0aCkQB1yovcAaGsLIYbTaEixqa10N58TpY0+8\/\/GiLrp6BYbtJ3GcaA5Brol\/Aclvw3nr1QuBEwAPiHEWzgzc43rqfsP7EBRYSFtAHa6OwmkYLmB+nf7AC7q27\/g9L8rDOJ8naXQ4nuRxdSG3nvbclz3vZcf+ejP\/\/OHOr7303G\/8\/Kd+8X\/\/7372J37k537yR3\/z03\/zK5\/75YsvPTXfedMpwsCttZpLu9XI4p1rFy3b00JNSh0RniAIT0EIcOW11TXT5a8B3A6X6X09UMe3QgPkIK\/DB7XrpkYQazyEgEsCAYSwEJAMG6A5FINm1a+g3oVisdCYGO2UO53qsxbR0tgF4Z3eugoAjBOo55sS4MTq6iObN7QAPEG6CJDLQA3qgGXCNfi8nCRvUguhB6DEZ9pGca5l6zUxurWdwPUw1\/5wIF4roqn9IQlbkIXeAFH7K6PRUhdmsalkZWWFpxgD\/NaPb50TIMFmE4Km3g+O9fVj3eGW5RR4X12QtmJdivxN7XuDr+gVi\/FQjbyQU8g5iCymrxgNaxCpkiVdo+0fSsvmbsq3ymjWrDPFDse9chBWDQ0OT6J0ddTZOjKaTqbLXArwJmwRIykEBxiORkfWNpplNV6EGJI2G+v11tbXwXRuwRQsS6GUUsO5tjk4vnVsZTDCQvA8brcdh3yfSgL9pHmUySOoqu\/55JGwAfSKASlimRgm9DMHfA1ToHEdP9AQrCheHIb7F7e3z1\/duXR9vD89PJzOFkmnbHx\/Vvx3V7b\/yqVL\/8Ola\/\/j9Z0\/czD52EHsp8X1pL66n752PXn58uLy7qzV67m+FkKgAjHlU2XLgs9iTNQTAYK\/mAVVLcoqWsSIz4COodoSMvGMFmRa8hwRqjeGRledbssPXE7iZsBWFCFBriO0e2XlXd8eX7+yM+j2gVDXh3dqXREbosSTDOmgybAUQ6A1sJADMfBcwK\/Q7KsGJsDT9aZBtTBmpnXgqTusIW9qoSPT30AOImYgGXKCq98uTWewG55AMNaC54FivFJk3alikYYKRzcK4eop4Z9Opyv24ChFEOvQXN4cD8bxECDey10aROJoobcoScbTKboDbREmigMI1P9vFkinbBS69FigAVxY2gDn8W1yTewQbsHTKGFZYZ5oO9ad99zRG3WpFSgJuM9FVngEdquFEZ3a3r+63\/ZatJW\/eSLklQPCqgY2rF6\/H4MZUULVsWrU2m5ppQQMbxUD\/g4dRo83jjtuvxs57e2Pd3YOX3\/9wnPfeOnqtR1yJxKBJFOoiKI5poLztoNueDj\/wj\/+XHNRjLo9126urAwS2ERRLuYw7IyUl8BWVIgUPXdQJ8kDyB0RS+aHZ+44ffvDd0EI\/IanFcMHbb+MGtdf7dczAvVqv99p5HWWLhBWlnRGfUJttxUgWAJdr9tbXV3F4Dj6\/T76FSh72iuVMzIG47NgOgZBo1C6aIfs20Jf\/a4WuOQynAbMz8nrSQzqerK\/ja6Niy1\/\/uVD1skXYEzQHgAohBueiEzU8Sc2IGE6deFWhW02NsZC0+Gw+q\/+s+anf7r9jz69+C\/\/053HHrk6GH3Vdq\/WJKOa0mYyx+ZgMOz1+pBgzJKGUH\/Mj4Zge0ib9h05sgU5kGfhSVWJsXrAKQdODjpXVVwm3\/OJj9iuht0tFtqAQFfSdvJmLbvijvqDcPdwPpnBRTBvqr5I4nliZnT7pOBKkyhPiJdmYHWn3fPsbrpwZmE9nWRR2Mgiv4htwMUP7FbHJ9XCK6q0ACWnk0W8gGHZcQIEeIusMQvdw2uL17\/x3FO\/+fO\/\/lP\/08\/9r3\/pZ\/7GX\/rM3\/0ffvtnf\/KZz\/3qm89+8errzwEnecPJS0fdlQ1srEBJ4FeB8vIiTeB8+FbQ73QHXdxfexBw4IzLPAGSRFanrJvqcjh20Aqg7ABJoiEomuoF5KRpjDMCbaRQnJ8h5DJPxQlj7X0YTrBD8snRYBB4LrEJ24Ah4ZVIEN0AEYABSMxzfQ1us+EghHa+jnMtOBYlMchDjTFOTmJmGBi1MRhixhWamaVkgMQX5X5UyyAjSMVdw9VR2ahId7\/5noIb0IKsGQSBgptJdrTRGOG3frwTTsC9mpBuZFIPVzZanc2idDQI3q1JqEg+tdKsGQaBCrlIhoks1bdkOBZJohxInBvSrmv0LtwYc122Oz76IADG4ZQoA+Qe2dwKeqP98RR9ozjfd8EENIFvIETMAtkKl8sSVjXs9ggC5C4uFaq1Oeaxza1jm0f04lYTzELUgycszCo0x7aOdfzWbDzlPEwkXMzhhqiWkEgOkpsNeDioMlgNLjgEHc\/r46BDrQ7R7XSIm0RU33ULaB96L9V5UDarKI8trNFRFoj18Yj97b3rV6\/vn79y5iA8kuQahG9eB0JMj6XxFrgKo3RsOFFYWou82er1N48eJwPFqiAiXEfaiCmok8qMG8I0sXMaTuiaz\/XGWvImbEszyFb4JCZLRdXF2vB9p932lR57dn\/QGa4Ed9599t4Hbr79njPrR\/qWky\/i8NIlDTbGhwC2Xr9rYrFWAcOvqKpeCJmJgaZz\/QYn4Ik8GjVTxdSxDtruxHcOW\/YksMcte+pbETy+aFIRq3YbpTolMABZhbld4tWfpuYoEduQKehvvgIEw1BhRuaiueOaK4ymUAeOxEWIBSdZojypEtdQxrIXERvEuIRiZqkyZHU4Hk\/DGXzFa2k941hLWQhVRelMhwSX0TAejW0MBgMazpklIaCcOBE\/wPD4LIgxoQZfVGZclJ1O+9bbb57OJiQN1B3GIwvXRhAamoCV7+\/sHe4e0Do4XbfXRYnddoemrW9sIAByHTCAqoJreDxmQ3MCX0svoL7h4J9djeQ7dtxyK8ed6tfPoIYFSVQUp8OVUVvrDpCjB54vRjXo9fe2d7\/w2d9tLMphd6jhoGWeTGYYAbA3nYervX7Pb8Ek9iaHdsNajGdRGK1vHTl709mNlZUHHrz35ntuHx+OCZnKExpNkuJ6ct2NSLjV\/evZScNKYdjQJbzBbQV4JFx5MptC0sD92WwGb4MZcDE5NOrDB2XK6jPQ63dyK6yoZUZ+oX3CCUYHbtMK1A1GQZrRxWQaQl9oEeqbHOyR3HG9kcS\/8kDjSxhrnjx5xgy\/4XJ7sdByVQrWywNfrJwSuAf21B\/oFNNk4drTxx5t\/IW\/PPr5f3D+R37481sDY\/LyEYqgJuPpmKIpj2dQQ8VsY6VYITqA7l6+fIW8H9cFBwFVn6TeDKYHMXDRebS4\/+H777zndgIQ1cTJQE2iIwamkclWo9sluidvvPgKhJo0y28FOt\/URBIlBoIpLForGVAreCF198FChwv7nc6o3Ya796yml+feYu5M584kbIaEf6fvt9p9xxr2e3rbniV2sxFPsaDxQby\/Ow3TKkhymww\/SfNrV688+7Uvf+GffObT\/8eP\/8T\/+KN\/62\/81SQKa5ua6C0ISbwqVDXIf0BmPiCHWJwwA4GTGCVqvCTVQ91LyfPTarWFKHVDGXmlTY9wXr7jwM1hDIgIURFnTL+QsgelpKU2N1d3HhQIAC6LdrsF5cLpA3Xya8Qx\/FWlEJTJKHSTMhM9FMZGDaGbaIqSJDeljktEIr2SRxt8W5oDgFPwtaZPCNkIH7QtLfIYa8u0LBUPWsSRch3z7qPTI2S1Y3V65L3BgNvVDdFqUeSywG\/5eCecoIGXisMo9pSNZnDm3O0Hk2mcqgF5xW+vUSlgYDdAHReL4JCilti31uGquYYGaMibgs9yqIzd0HARSAGCBTfqslFMx1k849tOq2+73Z3dg+GgA55Ox4fdQBuDJslibXV1ZQWfB5bdjfVNPhxMp3vTMTpBX8h4NBh2g9aF8+d5mPKRdhtLOZhMSE4Q8ngCGs3cQHPKO\/0+cQLrGQ1XcSd0pOjiehJ3s0FuiPmgaYhFOJvB5XxXkxK7HeC9J36qkQD4mwIMYYMLZ+GMdpl5AfxWi6lD1rAuFyDajV4WHYjHsdRBpqlYXTuw\/aDjuh0og+s4rVbP1VtnAgtYYt56mLX5uI8HIWQsUsHfvC8gXvKDUWL3KAdWC2TK9jThU5NfR2tD22lWRVbb9c13nDt9duvsTVs33bp1571nvZaLs6VRbmtJRhhLjkYU1Oy61ZWs3i6\/RgU3fMAgoAgESS6eWNkX11b+vw+e\/dl33\/yLj93+C4\/e9HMPn\/jUu08\/e3LoNBQUy4az7AQw1ZdXUG8hjyD3hknrM9+aHoRkkVBV3ACJFkB5Yqb4G5ZtUqgaDwaz9ieHuBNqEmhqqCAg3ux1tO8whtcym\/VSKlRU8vR92FuRZjiAqUhNRq7i1MWq10OT6RRqmBXaWEEQUZWdVhvoRN04uORQlqRZIWRlHlIAnFUv1JPF8ZtOnj53FpzkodBfWkJ9MCJMX0PtLP\/iqxdQA1ojYQhnYRB0kRqwBjaDeH7bO5yNKX9rc7OyNeAxII\/WiLxFpwM960o638FDStHYqyfe817sFVPUQuKuQ0MaRd32\/H47IJPFeH2v89qrb\/3uZ784aLb73T4CDNyW1i23ne3Dg\/F8urGxtjYa4utRElVFvru\/gwL6g\/7xY5tJFt50x5kHHnsIvWAurW7f8cp+13n04Q9uHbkF+BVYFCkW0A6qnf1drU2l94B5w2+OExEUsoJ5PEcvGpeQZUQCHEQRFPB17SLXWBDMQCakQerYcBP\/hdNi3DBdbHwRzW3Ha5Lhwj7LRo4yQPNmFYZhkc0rsn9tl\/wvHkubBrzANIyi0+lWFsZuzDmOy2hWqYdM4YB\/OY0vcKneBnl25top4TJdZNPxlADw8MPTk0e1jYeKJMMCQi29Kq5KEmJPSxJRjhZbzKo8ihf8zY8GvBHjGhgTDLXGgDN4MjEzTRfzcGW1\/+gTDyd5YhxEbw24hmYi5zorW9qq1H7r\/MXZ\/gzogtzh4QQhFEqlzRtymTNSanc6WquAT9SvTMnjiwYNJckumk6DYtp4S7vf9keO3a+qVrZovP+Va3\/uqdf\/\/NOX\/pMXd\/7jl679p89f+r+\/cXCbDd\/ueZ12nMbxIp3HdZg04tI9jMpZpDlUwswGxImA3CDHAmZkEoKgIgnnSAYkh4ESS6gZ4AtK4LywBNNFqeUZtNRRU91CSBGu0O\/1260uqIIS8NlSIZzim5XWctXUAq2vSsB2LG1QokGUesfEB7w7juWwh4cTjeYutL8RQmnq9R+CgJlp5KCoBjir+cmIFtKkl\/38GcDNNAFFuAGqUW2NA9XmSa55vWOMRGAeoU9awQH2aaBAWURRaGmtdCeZoWVluFUFAap8vw2R4b440ugZYl+nDT68o5jO8Y7ul9TVENks9rm+eUw9ORruYLQGwqFUdWGbGGLYLu3UbTqJbRc8XzeTfeIl2rkUFgg9qtFl4LcIoFmeYnNABvdycrR2NCuakDVFu6oaaNyMPVoZYVn4Kvn61tGjhAvy\/el8hmpBLWhBq9NCXpevXeUaV\/Oneaoe2+l1iywjAy3ydH19ZTDo9bodbAogPnp0izYQJzxNVMN2arJJIjqKosWaQqbXvSVph4lMBYksbiaDIK7DVLV4iDJxjaEg+cAE1f4GrSO1RujzIHi+4eF2e5634zl7gf+U6\/6ffvu5rEgPx\/Od\/WaY1kmuedtIodZaFm11VQe0kTKpAH9KuubAt3kKTAsqKzeiimAIsGSyGSpBezGyoswRs8Zz+eoDAJFuvu3MaG2k\/vGygAmMp1gk6tHMl4YcRoZpqJ8IDcWa8b18kPoonSaDp8okJFAqUpWwCKucefYra60XjnReO7Ly0vHVl46svLaxtttuwRBpvsrQ+CrF9WX9KQzRNdWPqZjNCQpdlgkq0S4u5kPZqKI4RqpwS1JAUj2pkqOpYcrgpXi2Vpt2qBnSoiQyp+U0DZgQcYJr8U2kB4c7sr6BV68MR71OF5ODzqkexpqxHx6N5ozFyizFzvHYGBjV9ASii6EHHlhDyVQJj5Uk7PqhRx\/QwAitZanNFyiAhsq4lY+26gzwBS60Oux0cug4TdPVRDvscL5IdEcEjg\/6\/U67Mx6PMSWyWOF+kW0dO3rqxClTx+\/cIX\/X8eD9D2yub2Iriq9KZu3FfIFlwr2Qj+d33nzt0nNfeqZro4ViMhsjgjROocDbh\/u0fdDtYT4Hi9lkPkOkYRRbjrs2Gh0\/ujWbT3prvWC1u8jmfuC0+74PxWg6jz3w5Kmzd\/e3TjUDv63RMW4elmfXhla60OMtslUbRot\/gozRQjO7AjOGNDQdaJPJBOFiA0s\/RWvoV05keMGJE8dXV1chuxo1YlmYGaiN\/VFygF3h\/pq1IDYJxY80HVHrIrwtjH\/hWMK7hhG0iI2dNpQSZ9HyNxG5TXN5Y2HVpVUrnbdKK57ZO1f7i3DTDUZ+3yLi2q1+Z71jE6215m5A4JPZa3w7PknpuIT67WxNO8Rck1yrINBAHk5YDALNxsIgl9aLTYNIkBgIATH7+s52bDY5UyjTCwggZwwfDlx\/Npleu3QNb9czBKRTgjuPhoxi+wgECUD3+AzLIP9BDrAxlKvpRGWKIwrbb\/zktNK1iZ0gtvuuKH\/sIH3o+viBKwcPXBk\/eHV677XD9DCdplazsvotb7DS7Q3aGs1s41+tJC33D2a7e4e724fzME\/zGvqPJ1WNvNEEx6BKiiaETS06QlV0aLgrKibgBn6gyb3ICh8WKgrNTFKtjkDNFXI8jJDATALGxZQH9ce9ied6ikBIiRYHvi+TNp2iqA\/BAPjABX4NtihiFTmxHBDlKVxprqnIGhPiR6pubHQQRxES0jBuSjcWaDhZCqy1NMpB2\/rzCPNADBn8VZpEC\/NMQxPavQ5ZRJUVfAu9btE42ybouFoa0KUKgD61MtH0nR7viBO8fSACSerE6XNBZ3Q4mS+HgRvhiOOauoqXIQvpUpRTtA6bU+c2hmmQHQEgAuIN6kNkZiCqi2dp4JuhUZbXXNk8OpkXUKxWqx1Fyeqqe3Rzc3V1azqZ8DQgQH02UDaUHATKKVONy0NpV7evpdpNUpPThoMhauYrDh6t5b26ncnhGKtB7VmanTt7VjOV53OSDHgZvkw11aWs1Tw0XnRuRuHihK6vHa+11aZZVkJjKrVCDj5CZq61FElStTCCVhCjsC6KpKVYcyObP2c3\/x9N9w97rT\/W7f\/gysafX1\/7b133ZUJ4I9cSFGQL+3u729e0a9ZC81NiEtZUO3VSAh8ISBRIsf1+DwjA+BRiS1kzkkdciIwfUEN9Su2W1NEoV0c9zwGIKtjD5tG1Yyc2SCNApjQv5\/PyyuXpYp50OnhITX4MmqRxQoukG\/WBqwNTlm3MHijlPJ6DWvnXwA8S4kIYREWSwmPsgnpwH9mQ+gEgG2mjJvEKuIk7lyYsI1DOpLcOqvnSrlWyHLOpSTiUap4iaBP1R0pmgQEMD6PhYk35LisoKdoRUash0SR5Dc7gS9gTuGl63tS\/AnPgB1MZjUZ9jl5vMBzMSKMg6TTUMAA93fQo4KtgDL+pQG626kAIgK9GmNJG8+4Z1MbdSb9Onzt9+szJKEZT2togU4xX51+sPQ6sttveubJtKJsVzmPqPRh0UUcaF5ZWYsnBX0wlCHyTwqnfAt3RBNlzS7tpOWaUw3f8QEcrw+Fdd945HUP\/fMIjiieuEzvhVlTzma88+9rTr9x\/y32+5WR1trG+2qIhVXEwHeNsK\/1hxwsyki3XJUWYTGdprQ1Eht12FE9Xjq07o94ki7yAtLXK4hBIfvSR7zl57PYoDLfOniu8rpzajJJZ73ba2vZvjvEQLPsjnLufmrVD0Np4Nt3Z38N5MAlRygb2kIXhHGDFkMClhVmsYmN9HWRA8YA+miKakX5ITcZAiaxlXkVpDr0kzKTRYn\/7moutGqK8FMg\/exif0L\/AfbeHga3lSukgdtksnGAGfKV8V\/6IFdZer938xc\/YT35P40\/8scWP\/MjhX\/rLzV\/+Be+FF4ezGdCCteG8QKQGrGuiWkxIwJJD9eYlQBCRTHFfr8YQQD0LQ1pRkkZnMeibkcVq+ZWAxPbmO2664947aDUhBOqJQDBpvANWR1hVqHf9i69dqLMyyvKA3D2JaQIfekKYAJ5uRulANrxpOKOZGKTQxiCSkpBmQbSGPpUVHpdUNbAJXwQ4chyxNLHGgAGQoHiR+k7ktYskKBIKbE7COgzL2Rz8pDrtza0jR49ugFe9QQ+QDZG+HLxMRc7gDTZ6UWdboa5KyUdrvGrUMC4pvu57vcGAD9QYxoAJ0TxME1fM04yw71g2qofQ4NuIglwCrWCEUqpJahEjpS1ly79oFcRBYiA\/1sK3Blg0HQQ0ls51CBqJO5ykgTyaivKBciAj43C2yGKChcFwYzlaz5eYoOt4rt1oQr8IKbZmZYqViWQT6vodrppOZ6ibpiPxjpKajoFEARYsijpSJexaxb6z4x1xgj\/wCWV4jc1jp9ePnpmGkVZYoJqSElaqcbeIWVDKSWNANIbDfGjY6puhHFwIOdJI1GBG51poRTvL1WU23dtFaliU1x7tTVMFvYbGuJ0+ubK+0tu5uovWCZDwMgjvwfhQ3bZmEipkn6dQsvGcajTERXvTcLrMEpYVIHuezGZUbBHHOzvbpGQJLjedbaytAytwDJK+LNdWtiQjGqRE3qb8GSvRYEMYNz\/yb\/OuiEcvrY3YJW4DcGkUjHYlR9mD\/oCf4VB8mPD\/s47zkh285vfe8Lx9r2N1Vjt+n7y+cr25VvNV51M4mcHJKZbK4pA8VmI0pin56s03luxjGSBdpTcGxkUbFqKnSjCk0WjYbrcQLSlxq+VwGoBod1trG6t5qQ45kDxOi2vXZq+9ehX+5uFBDRFbmpClmluvMpW5G8FzmH4BnkQFwAVOCN8UlEtyn7Jpu3m1tshX0nwQJ6tx2s\/iXhx2s5zIj3OlesmuQwRRRqHpqbIHQw1xEOSsvEpOKppFPByNVgiHBEsQiSi7hDM8T25g+oT5ANdGAiR2fJtmCSSaZhKt8Wo4u+2SUZWYkxCx1Kw5\/Szm88WcpywiDboGFwAYLtPQIRpj+iE5dCGK1kB0pWpkfvxo6gcwoxFeZTiboWqEdM\/9d\/W6Lbg9fGjY668MRsQ\/AKhhW4HXsitroalMqj+qga2tr62T1EJ4ZvM5QQex0nzaQsg6ODjACfiQZin3UM\/lpizfqWOpeY4l+vHhyfc8cdttt2ZxqqUhbW8+jx3bJy186gtP775+Zau\/sru7DSM+urLRDtpeEKDuQa8PK9eA4CzWLIXJlILgYUAEmWfazM7ec0trpTedh\/IdvKwou37\/yfd+bOPkuXkRYzv93qhsemmldTZiEmLP7bdcTRGSn5btQbfSRkr+6sqq0LrUniA8As85fvw4aCBzNbaH3fD8JI5RwcrKyuHBAYZB2\/BrFIDpcTeYgz3gbwqipHp5RbCq82z3+iWTE\/\/rwBM0F+XFqr1W1w16S58lCw3DseSng7ShxjSdCrbcDSbF6mS68tXnBz\/xk2t\/628O\/uy\/777\/\/e6Xv9jpBnidsUMgCPssqRu3tjody9NOb0RESCTujxcgLRpcNxuw23m8yMw8acyVb0G\/waj7yT\/8sdH6CJwk+oNs3GKsu8jTBDH2uv3963sHV3ZLklEvQALhLKRwrtjb3SPnxRS7bbLqNg4IZYWkZGYbRtMcJIoL0zaSecAQ6gwhyCEElk0dgMWkaawXrs1VZoxZwwNqbLvf8gek7b1BJ1j17b5td7K0OZnE+\/uYB7S76bh+UjRi7WFeQ+kkdgDWTE3G\/fAXXAn70+gqGmPmr5K82x6t0zBSUjESM35wNBIJ8Jt74YgE8qWrwxKAAvAE6FAOQLKOZwptAjwRVYr3GLTBE2GZwJamZOulC3co4yeg8yAuoAwDWgJn\/pSdqRNX6zo4vuMF2t8my8n7tfINJkJOQgoq9g9tFN5xOemTRTUgORBQkj04BLSM0tCq+hPFy0C8QHkI4QWWJBWaFZP0LulfZ5P\/Bsc7LcJIQP\/LDywEvwonIAMwTgH0S+xqrWE9pmNA16v+5gNqBim4k7+4ColwcUW22yTxqv2W4INnuBUgK5DeOnrK9kdNkNlpZGkZOFynkUHIjRKiKL5+\/TrBnkt5AHrl8dyOpPANdMyhN4tmyxCpq9EYj8ehuhnzBMmCFKYTCbBAMHmWgRStIAC\/tXKkmeET8Z9ZBAlMwcBMtVUUMUNaIVTjYlxKUgKbcGzoIUrHdlE3AITyzJCR3CZEOD3tpRm4XQJ+nqLyeTrPhINNeXeRlHFdZxYIoxCq134kVRqYRr0xiyDAUMosK8JwwQ\/OCXIVOchIpWTEUF+ED6HWxAG70e93tjbXIQRQ7f6wt3V0gzZSNsqAeh8cJs89\/waZHsaMe1NhmLDeGlCWWWSYNoJN1AS1SYHaHPnGIgGGYYsuUJYLHy\/Lk\/vhh1\/c\/fizlz\/0zFsf\/tqFP\/T1a9\/3zLU7r89KIWUDoNciqzIF4wSyHBmAKUdvXg05Vy6BaHkAEqNppkcG324FfmswGJHT6AJjXURYEXLlFwI7SkI1nARI4zQi\/9YooSLjIfANddzjSgWBNtw\/3IcgTqZT7ASroF1qptrB\/3o0YIq+qQ\/3U0NgFG8nP1hCIS4IeMDjKXEezVc3Vu594O55FJI2Y+40QaOV9DbRpj7Yy3jnMJnFAI1MaX5YpqlrBWmiocsU1debME1yAV8AMEyOpvFEnkWtMMvTp05TQ577nT0wrWXzb7\/ttv\/yL\/zFLEpff\/G1ZJ7sXN+7dmnnc7\/6ucXl6ZHVzSvXL6bZvOP6VtFcpMn1vZ1euzNqdTRKsy53xwfI2ivqcDzpD\/rqvW17J+48561100buu3bP75Rp7XidD330+45snEwRkwNVdnYvPHfvzSuPPHx7kSSzyTgO9zaGTrHAqCvQfLSxsnFkHe4IdzfmRGgXYh47cgRHBoUIkNQfj8WYkXan1Rr2+6A2LeIMWgAiuIWDRnKGdFIXZ3DnOtVbIKU688k+Gbg6AzHBf8Uh70BAfFc1HHzCwCzBo5yHE1rNtxyAf9H0tDYhpzTxgmDQ6Dcaw4bN71FWde+4s2552Aby4l5TLgc5jJbxxoqJHBgGprWxsd7pdPEAOLF5a6BIBsGl\/iDAZDaZx7Mn3vfYmbOnMC5aisUOBsPV1VW9zKq1rgb01qmal89fGvVGnVaHyCmwwuabzb29vel0SllcrIF1rRaYQ\/tIhCjNZLk0YNls\/aiTVFLhFD\/gRaEBAXX99Ebvc8f6nz8++u2Tw396Yvi7x1efOr5eWq4GJtWZFlsFqbyA9Jfq9bqjdjD03VWr7qeJPZuWVVNREFfQMN86baAalAGBRgqmGx9iKhw1s4QAcOqMV+K2eDe5oqmOVn4jD1e6T1w3OSHGKHdrtfUWhEsKLe7EZ7XKxHsMptvtIWQaTlv5gVkiDdpM5MK\/jXvKFEx\/xI0DMDJApIOi0AJeLaMytAaQlck1tQXmMrPSC048v65n4ZTcQ5xGi8mRF1G7AqVqEJUZxyPua8AWuKMccZpUQ86JfTAbYs3yoe\/kkG9\/y8dS7fyiukvn2Dx+ZhpSuRgDRabmWwQvalATYORCpAQwSk2o42ZjPBI9UlY6JcqFjLhUtgax07sADQBZNOqU4ly\/HWVWlCaDUWexSPZ39gY9a9BvD\/p9oB3homkgG4OgYHmQQmNJHAePMFUNU1d3UIUc8SsIGlpE\/6CH52h6KzhCTTCa6RxPmhp9KdvGnnA40AEyghGgfHSDbvl2+ZTl44w3ako95cMSqAkXcIvtOVrQ0tfMVEgD\/tZIOG+XcPIymufzPK1urRuPpItjyTgLFwip4RCcVDF1DpmdPzTdxhyUT7EEJypGnqxg2NTkVyyW\/BY7WQoe7MjMAqjUztOCBO3eoE0TKPz0uVO2p7ERNCVNq9m8fOGFt8irKYFIhu4Uq9Xxru3kDZ8TKmG2hDijaORCU0T35TzSIR8QjZ3bVW6la9Hi3uuTd12aPHxp76HLBw9cmtx\/NdyczpOGdvdS5o5f6xH6JSC5Qa2WqQZHDQNX2yEk2uGpmcYpVGs+01akgAA8C2cABWgcdoYRI1276ZS5RnjAqihNliO4QF9y43a7g7ik9JwohteVeYX05UukkkjvxNGjK\/1BO2gJf7kXq2g2NIjEsfF+ZcKay6n2Uj\/Kwa0Ts5ES2sGYoYv33n93bWvTDaQ0nYV7B2Oy\/yQjbaoBHRQ33T8s4kwzidP47juPfvgDD8Mv9g\/38koxCb61oDaJ3kqQ8HW7muyAkFuBVlAAJs6cPQtOLAX0XXJ0O9377roHorN3dW\/3yt7v\/tbny2my0u7tHewjtH6ng+Es8vjKtWu4AwpFjERZrAWBO\/hCmqwMSBDd\/mr3ofc9bLe93YMDN3D1nq3VGQ7Wn3jfx3qrm3mSYoVdr3ntzaec8MU7Tjmbq9Zj95977N133XnX6eNbg2RyILBvBbXd7A01I\/FwOkHvZZav9Icnjx3HZq5cuowwcRVcCfc8PDzEJo4dOzYZH2IYK6uraFYwDWqnGfYvHqp9QTVGjCBBulqTSxDlG9V8tg9NwO7ehr1\/7qB1RkdYNkboDlfW5FMG+OCfePPyCvybq+SrrkbyUi6RFq6cNEpwPeYW+MraqAgjTF0ObfbHwt\/xM9\/1tIx2pS1elyGQiEP1ieUEbg6+NP6oNyBA2ZmbTz7w0L3TyZjUB5preql0yP3kw8RU58rrF2e7E6oJuCCTeLEgCuJ94TxEbK2OBmXDc6ECCJDqYPwoEXkKKZYN5zD4YhooyfCH+V3apff5Yxs\/ftfR\/+3eEz9x96mfuO\/033rg9M\/dvTUhH2qmWoe9uciah1UjNus+A676cT0bpjgYdkejVcdVfq9+tDqgocoQtT4BLSkxLZxaDxSg6cBf+Ao\/AqSKWpiAj0PQAWQ0mRYaAYMIwflOtwuuBgT+TgdHAzcE2pZWjNCaxNADLjUF0thAixv7Ig1ASqsN8q4MR51ODwohKRL7RSb1C4DjTw7whxsxTpTCn6Q0UAKjAs1jwtkdbzlyQFOmaZ4GwKpXO0WQmAaGChZh2mmSOrZmUWHDAjcNaYTTVIHvUofVlVUt1UqgMa8q3uHxjjgBYI3Sl4pfgvm5m29rWg7AJgWZF3gK8qIBNZJFKApfmIHe\/iEH0NuEWw1dU0ylzeIOlKlo0Wh1PARIpIjDMYKq8gpkX1nbCudJtxM0yoZVOWurHc3yW0SkVtzDU5B+u9PBDPjQ6\/WyJFtbXQXRjQGp2wKdzZcbXRNWUWGSaeBh08Zh7Moa9YcK9s0GjBVDUJXRlQKW6iRHamhKCYW9HYnVeYU+KA1tIQiAL9D8Vw1Ioc1czFPgAShYSjV80nI838r\/ZNH4sSj7nxbJjyXTv57Mf7xq\/KdldaS2AzcYdrvtQatq5hqpQGqivm4NY0FKhqqLaSoeldq5gFyWcIVgYQtLMYqvUxX+EDo0e\/2OdmhUZ5e1sbXZG2hrYKw9z6oozl5++fzObkiNSr0AyTxX0MOnItNOPwrVdaleU+ohZS8TAT0Q8yU66ik6oxCusF5ZrlTDCR38u7QNChKIIk6uMFwKcXHIrZGqStUgaprEU2gA5eHAKr\/RUIeKeLrT8lsoAr6PwOV4apIiOJXhXtNiazAYYAaQCOpbVEoHKYQHgZYUxQWiZbmWggcytIAqCdx8vggXRaKXxsRv0IGDQGI6Wn2qR8sAAg2oJEVQ1Wr1KyybILk0jp049tAjD+dawqrUy6RE2iHJ4Fo+UAjhfnd7N9eoItqY\/+E\/9PgnPvZYmsdZAS5gJlQyBehouMiQ2X9BWYnpY0AVqF5cTUL+7jo++IEPdPwA3tRxyWo1S\/dgvn\/q2HGv4S\/ifJpHb159c9gnxnfjPNkLx9uHB4AiLYZFOS2v5Xu9TuvW++6wB16exk1NKCPnz4Nu933v\/8jG+vEi1WbDMPLDN56xtr98tDtHHbbTvuuek7fddZvd2vjS778G92q3SWK9STgZrAySRPNBcBBPG4h3YZdkBbA9so4QRS+iyQTGoLVMgCDgHptAYcCFICLFIgB0XClXkqLIjYkU3BYuYvASgD882AtnU4iicYd\/+TAn9VVN+Fjf3ER3YtF1HS1Cxa3GMrMuuZ9H8Li8P9g+e\/qtdz966aGHrz304OVH3z39\/j\/W2Ngg5LqmS4bSaDX2j2FoeJMmR\/gw3UCDnDRiRqtq1lWWCGQU+cyOfPKGRnNtc+1DH\/ug17LzLIV7ABzAxe7u7t7e3nh8iMnR8DxOL752PnDc+SKCsyCcbluJloFMTXvWDHjzsmCqbUK1+zCWCZjjDxICz5HHyq3RlRzdjBfm4Bo+VDYUKvMallM5rhZNAAUsH9Fa84ad1BXOm9npolGS+4V1PW80U81UaxSSf63do2ENtIgQ2EWRgVfJhwpiLdpBPDg4CpIcFMg10VSeA\/BBHwKa5RBloQ6ofqad9AXvJAaQA3UhUEHhjbInXBV4w8tpEI8jjaN1CszmwNVxRs4gExAYKXEnbRwOEFUfzNCcZB1ahc9kl4qA\/FZNykbba5F5Ip\/lCFAQWPv1JXGJgKuSBIdgh8xMf0cTPkqducAPfJABjAG7aax51Q6kC5bJUagMj0EG4JARt8DpHR7viBPwfE1TEyAv\/2rY\/sALOuPJXKFAypL83rYZISrSwrrAPKRqaIFxHRSiLiGCbtmsSSRAW\/UkYZxVLfZkpxGpYt10tH3QxvrhYQxlrsGPRrbSdYs6I3DCb2PtgIKjtDDVDTxKfS\/lxuYGmiegktOAyEhwEcvuSVVHgyEORljpdIIwnJA3rqwNMXqybSBsoe3yxOzQH7UE7qFyNAnLIyJXuTbJRTecQUsEHsimlGjciKCATXASsyIU+Y7f9tt6WZ3jEBrgkrsutOWPZrMfitM\/uYi+P1o8NJ8en02fXERrpFZFTvbaKGvoA6GOoigHFwRc4AZkCTwUS0VixjW01QdOFcbzw6kGNmNX2Ia6GQoym1ITOJAwwrTyEzedWF9boaXEsbRszuP84mvXrl\/YJQ023MdK1JWdczkKNQbMQ5XWg9QgEWrUP9IYVkoZfKXqcTFki9OOpvIoda9qG4coiHBKhqivPEVQoKUMAQ+A2vA+vjVxtamBy\/xJUwA3dRLgpBSodxl6j6DBOBoqVYqdIMFRfwDhk2kpUsqd4HjUx1V3U5Nr+q1ex\/WHvT4N40l6iWPmnFF1siJKBwdQj1iFugTqKI0r8gPzyhbZwhLQI9Xjt\/hHAwMo4a7ol6Ig\/wQvzcWj4mWVFunpcyf5w8obgdci+VhZGfX7XcIeT\/ECL2h5h9fHSQgYwQLirfXWubPred2yrE5dZ77t+q4PPCmxy0vLtcGLaBqujlYR6pIrBL1Of6DtEGkBv797jkcef2zz+NGDwwME4fmu5dmnTpwCFoKWT4a6fbDXa\/dG7R5h8HA2tQN\/0OnjdHGe9bt9zNseBDc9cEfpWtPZHL\/wHK+Mi5XRxns\/8NFufx2Il+rd5vXXf6\/c\/erpFaJNMRis+LhnVl\/Zj37ib\/\/WoNd98K5TsV5ZZnWa+51O3WnJC8t8dWUFHCWk+a0gKbJJNCehRKFQ+eWbcoiaVKnhDQmeji2hXHSdaTy4xuGiPvVp+lYWw70pSploOD2cHO4p3mKnxqL+2R+sQN4gO7ZIM\/3WkKgq9ljbyXzOs0QJCDCieBRuQ0jtj31s5Rd+YfQPf2rwj\/7e4Gf+Qf+nP9X9sb9eHzuOAWtSofYrKTVTWSmqOso10DlZaBWdZEE4gCDDfvT6RVtRUwe8RwGJqkIhHn\/Pu4+fOjaeTYmCB+OD+XSqPf3MWxUQDZd0G+4r33gVnIb0IB21UzM2IamLWTgVPNcN1yztr83oNTGpyopMvmzikKMFUPkP31Jc5XITtOTzfGuwX3IihAJ6qV1mjnpHSquRa2UznB3301pptuVR80odBbnVpHyQ35TZbEbAjoboerbvcQr5UXWyaUCc\/wBzWk7shCdx8ItzYkmGPCnNUCjVgRnoHxyeKjaVRQDl8zjSxCStcyU8d6G1tMkMs1JjgRjjcBjEEmzFFFyPR5DlcztRIF5EMoSq1jLGZm04akjGyVO4kYe12y2t0lUj4QVYhA\/zOJ6FggpAhn+IICYDwDWIVjAOVA7xslyn1enE8wghi2XCBQX+NREl1\/DYGmsNw\/Bgf49oJa75DpN8c7zTIpZo\/81j6\/jpjc1jM9xbCSHaBH81XoyghNiNFNT5SajGeng2LEcCVxBRrmeI3XKYhsBer8daLg5QZnE8PcTSuGHz+InDaQxBJhXlqyMbg1bgk4gfziYOoNKw8FdAWft2RIkGqdv2IomxF8r3goDU37zQyagATBFHarW00+7a2lqn1zk42EckZKHRYk5iWqPHUptto1H12Plt8jiZrQKjAjaqpYWUxgGtw9gQiEifthGD\/4kH8jhQBlPGWDEpOaHnVjie19mTDAqCq6BFpld3qiJwG2IceRktUpg0vk3hS7qqaG87GCHO3+31cBceJN7KNWak6+7eLhebsKrIXZpAu4y+VGe02tk6tq4iyTrUS1aOx+Gbr1yAdwlpDKChBC6ArMHdOr1ATldBWmXJggDNpuGjUZCGZ6vPY3mC31RGPT5WeX3gPXV29JUzq1\/j59Ta08fXvnJ0dGGlDyuhrTxHr+Nk43J4Wn6jy0tFShb6aITCBzNYRx0wWAj+Q1MQiJBd5uQOBgOxedOzh0KNKkvtp4eGDDcBdvE32ZnpRcCjmlXDhao7npIQdQ8TMjSzyG1p5ggfeMoST5Hk8rN5LtXR8NdCvVtVohcEGd6o6URZBuO7\/8F7KX9OZEo1UQrpAT48lvrACUCUw4vXrLKRFpXrWLffvHLs5C3TORUrsCTf0xiiKFoAu9g\/YYksDVzAAjV6JdIbqP5wsLW1JSl9tx1W8\/0f+mAUzafjQ9d11lbWYE\/ajcaqaczmaN1zg1m8IHod3zgybAaQv6bv0ZbD6bg76t7z8H3NtgOpgjB2+h2n1dw6cuwD7\/lk1x+RJAlQnfr6G0\/Zs+dOjfJGmfZ6vqV8OL4eFn\/\/5393dXX1D3\/i3q4VHuzsoD5obVbm3ZU+NgCjGg1HGEZb69VUs8U8SszC5KYrkQ8yDDN2LAxnaPfw4EAu7Gg9OLSGTaJB3FB7\/XpWqZE+ttmrlwwlghMQoW9I4F888BJsV\/6E\/j2\/TZl4HxQhCucEkCVoOrUWxQJOrCJNh\/3D9fWJ70\/97szrzx1\/j4BVVR1XvYkYHsVhpibTUO\/x8rU49o1lUgjQMw81E4pm+r7ZK9ysuEDYPHH62GNPPEIBAGuqMbmiFgROIhlZM2DSaXXDcTjZHeONwBTy5jyYSLHhPCT2I5lOm6RJ016Q1TKp5SRInhU5Ga1yPL3pA6s0AB7fNSwAaBKkG4iv02YxSOMT0+JkWJwKoxNhcixMN+alW7QIjoUDy65rQAB8UJoph6VIwygQVVXgtKZPAqqmETr6MSOssTK+MGstiASZfAN61Ov2yAqoJvbA16gMM+ArDEBIInip+W3ogYUr484QJurdamkUKjimLhnNfqdtCuxkYjyLpiABUJ0nmncJ6gymHC6gWIyJogRhqjJAaEKaQWxIIZhPBmKmqTsAmsDUAAtFLZN7PlOkiYrcpInu6AhCAP6BUYJW0yspEG40Ou0W4sUiDVJpt3Fu1MsujUt5p8e\/zqy\/xcOyvMHqFnica7UHw4f1CBOUNGmFqi\/fkSvC6EWBfst8RXBQEyo0YziX2sUg1NOfaaZHI88sKGTdaLcHaem2NO+3NxlPXQ\/ipoECwCj3gD79fh8bnoazyTzEi0CHTr\/ra61idQ9wG4EEn1qE8067febMmeFgiJN0up3JbKaV+Vxy66Jp1UGrTTCSM1vQTHgA7KzV6fW6g2HQacPgcCCCBlGBiquBqrF6nHwPt1T\/GwpbGlyoV8gaKcddiySK08wtqv2qukjCClTop1l4rajdPuwMQ8U8Lcfru3bLrHOwNGiATPEJQ6q0zjHnOcNTsH5+Wq0OsjURVHaG7Ai\/SA+f0asqwUHzxPFN83pBC+hAssNJfP61t7A\/riVfkSnqk4xUjsQ5jVKUjQslTY+Z\/E4akzrVWoBBO1ZwjYBADgAsV84ba4Nfv\/voZ+498ev3nfmNB8\/8yn3Hfvn+oy9stng4hBh\/MQag+zj0RFQrIJZB4yumcHXKLc\/4by9WT0rHbRCCOI3JezAPOJamIhnhDPp9zQpBl60WSECBRGsuoDQRcnVTCL9IJCgN99RTzRRTjIyfaDZPTQ9zBf8zw4K4ERekhGVNJFnztG9WjKCBOCB9d9x912htLSmKoNtLsjxN8\/k8okFQtz625\/qz\/Wk2C1FDGJd+M3\/Xg2dq\/\/iFi9ccK1kdbhR1Yxpq1+BWu4UBQwPM60N1VyBUP\/AwIfS7tmoWNhaAfNccxgo++YmPr62utoLWfDY\/PDhER9d2d3b2djdGK91Wa7YId\/b3tGiYF6ivPnBPHT9Btnrs5uN3vOuuFGqaaash4BilrB85+sh7ngxaXQDO1oCy5u755\/3Fy6dXtIZhJ+g4lRNn8\/0w\/z\/\/\/hd9p\/P4Yze98sLLK912kU7VraitjRejUW9tdW00WMFUyL+wHNks9C\/RFInhcIg9uHB8M78UO9EKkurxkgnirzADzpN1YACOSfWSSCFngQM3SJdt3G823sfa1aH7Lx3GsuUMfCSAbG4d7fVHmE7QDkSN4tD0nYk0FML5HJS0NMEI0uA2KlfTagPX6vWsjnnVVanycouaxBEaOgsNucFEqDFoAw5g1rB1HEfLFYdz+DSOjOFmZfr4k4+CGZwmaK\/0h+1WR0ZsDsU7M0QRURPykYmJ4mb3GbALWOZ3odde7SAgPnGxMqigpYaJtCsFx+uV76mnUAhATSkBuXEspaGLBTH2v\/36\/n\/9ldf\/0lde\/4tfefO\/+P3X\/4svvfJnnnlzJZ7bmj\/dLCybPEsF6x5DB2BUteFVNeRGXY1UCXELe3TJN9cIUUcsFJ\/T+Cy6C8O5PBBYBkkAfL8FpqNlDRwD39R3IucltJNIGewTL+SorYY6gwg4sKtaC4q3DfaCrjwG+SIoNUwTt0oqgPD1ZMcxbxpb8AOAmD\/5iqcgCYOTAhAcWbWu9P6xq7UTtGU\/vxUsTK+ngKbS0FElTMgR+KLpdnM4Gs3nc2CMdtHmpUApiscRNWHefrvVGw4IcMqWzB5+uuadHd9mTsBx7OxtE8w2hjE1Ed7bepUa+Va\/OCNCv+SASrsQEEJUZwEoTziUyRG4lK16vg2ScmE02TVJVRV0epNIS3P3ux2UWlbzwEV6Fs4Cb\/VbwXyx2N7dXuA2Ebx8oZ57q5FkWhsf25yFs+lsgtq3to7wE4Uh\/ACLH4\/HgAXKhkYQt5ar6iRFNljtPfrEA7fecWLr2GC4EsCVq2ZGLg02YCyO72nAYRA0LFIBNZf4ItIjeqgVk3Awmmmm\/2Eb2FsKudVrv7oIq\/RZy\/5Cq\/sbvvfrrdb\/2nT+ou38aLO8Vja7lY2BTslHzOjfpZth0kRHbBTr4TxJKrLiW1kbDqMJ97ZM08xXRNByCfkSKob6NreObjpgjvoErAwMyhtvvvZWNEuwedP9LkKNGoxK1KPDh9yQUFSong5DYI1mjN\/yUZ9FkJd\/oCPQB7\/hr6xuJg07tqzYa079aupb05aT2aQRECzk4biiBQIAbseWwWLayKG\/ZNtvH+bVJoGY9qqtpRaZtl2aaOEk0L7ZLOSOLEsXmNxsHscJORl6UVNsQqzCDMEV1oTcCLri0eKdwhaMTekWeZzeRWtNGD6jIlF10xyKQF7wWuIH3iuFwnnV4SR1UFW9QtJgRhsRffWZZ18\/\/9bO3sH29u7B4YRsZrGIBc1F3nJa1y5cs1wXwjhfzG85s37L3feEVef63g5u0O8OtGiaGYGMNvFtWEukt7YNWs0jIASLKCaxFn2RBuQ23yUHYkKJR45tPfr445P5rLQaEPHruzvo9diRLcwdlYHIG6trgeWE8XxSRKQKs\/2Do6eO3fXw3WkjLZoZmUKn20VWg\/76E499NPC6SRFXdiOwre1Xfrcdfv2mlcJ1CqvV1SoOpbM7af3E3\/08Un3\/o7e8+I2nx+MocBpukyiJj2MO+cr66NTpU9re1wyzx6nxbqICuhsMBzg72kSJfEDeJHy0AihHy71uF+2DSJzkepOMKnlpuUGjgIw2IpCZ+GZV80Mo\/dtO8c8fxj0MtOFJddXtD5u2b146NJN4Hi2mihdWXTiEOIIcPMYHTYZOY5jMR8l0JTnsPfM172d\/rf3SecsJNHpOEVdvV\/nBPVS0sUCawEcCCZ7BGRAJ78D1AQGEvIgWDzz0wLlbzoQLbb2da65LhNniHeF8Tnhb8olAsrBwHyqldNZ1yamiOMJQiWSUT2DkYmTLb2pC\/CMvUoog1fNLvm\/ayr96lSmx6JD7ytFuRDJvlNWjNFuPs7Uk5\/dKwk9IhMhhfnnZKmxX6\/lgBboawS7xgb+QMjQZXahQQVsNbYP6mDgutAFllcl5LpgJ5La7bbQSeH6v04U2Jdpl4Ma8ErRMOZjBcsEYvN4FHMxMTqL7DeTRukuVxC5I1LIH4MOgP+i1u8NeX6NSlixTSFVhP1jDMqvjg3q22wSoHrEBP6VSApNKyyeYvldNai+yzGnaLe3YpKlwFK6HUpqJg+iUlI+D5KPT79OoeBFpNBEgCBg6NnjGt8IcM7gSG15aKeBAMaI97\/j4V9j0OzxWNo9XlhulMClULI6oACMbVq8vJoKaJUpDo9SBQuOUe1kGvU2TFCTITwnKda8bYI6IKJruZZECwOraZqe\/MZmGID+srN0K1gctwqzt2YN+j+fMk0ir2UMMG81z587gA+TdolENSusQlefhbG1tZevI5uH44NCMsIUPYhbYCqQMu0kj7KY1ns\/8vv\/kh5948KG73vfkQ5\/4xJMf+vAj9z942y23ndo6ttbpunrFXGdmvKDmnvqdVtBtyzQFTHoePEfhKNDgOP4OvMCzXeiuT25dFb5t\/0bT+QG782dbgz\/r+X\/V9f5+0\/5HTnVglR2rxppEm5tCNGp2o6faLL8j3SNGdVBrUCsfOINI8ZDlGURoPAvp41FVbdXHTx7vDbWhbUMbyDbho+dfu7S\/c9hpd6UUsEnOqJsEdG\/nCmgOywbXiYy24+ZKkvWCgAsNvxYOUD3+efteSBH1k4foNYN0LBoA6OLwDrfWdqNU76AIv2xCzxIO6Md8oiVLODG\/hQoCQwVjPmba\/BDKhyeknONrwrg6Q61lPSHaqRYcmMfCgQwb45qm+vgwAjdo+W0ESgqhNWjMpkTUlfYCpTzMAxdAByRowzqcfhvy3W15WqoFxGlikcihqoBRKoO1cODP\/KaKyLDT7UVJdvX6zv7B5K23rrz22vnXXz9\/eDjpdQfRJLzyxuW0LFvDbr\/VeM\/jd\/qj215548JsdtCofaqrUQmNZqfbQbV5XfUG2ulbzqOleTlZwoVPnz3dCb7TCxv\/aw5M4Y\/+238sb9R74\/GVvV2nHRzdPGJXjbjIdsYHK8NRv9VJquKQ4IQK48VgY3Dz\/bcnuCWRUQs8oJD62JETj7\/7Sd9tlRnmg1rzK6\/+01b4\/PFe0szJVh0PTulW07r8+c98HTB97CN3fe25b4TTDD16TtHzqtnBGMzU2E\/Xni5mcbQocw0+BzQJctRzdWUFMJGZmeE4OBRMADANF4vxZIwJjszg7eXLROV28rUGZkM09hx\/vtAq21BHjGr3+pU0WSw59L94GNTTP7LhyvFbjo+X1coHqmIRzhAX+sY0PdMZWnm2H4XTv\/bXxj\/wJ\/Z\/8E9NfuBPWz\/wJ7p\/7t9p\/OW\/stbuFnZF7moiggYRE2JMzx0kxjiFibtYLAKBPpqILJiFR\/ZGne\/9wx8jSW5124QrjbyPksViTmlUAAfHdMEmeBtMGrVQXRxNQ9hsi8iHO5DCIg0aQkCyNcBQC3BqSA0+r745XW\/mB9JOYdXbXovYVA0uMGf026mzyhLmK+KIZksFebMNKBLfSOHxfPKP0nMECjp0jUEVs7ApjZSPa344PC81K02Bd4s4IrOHMfC8RFufmCEIzZrWEV7h+T2tVNgBgakxt2AJpm6KOlzR7nbavc7K6urGxgZMCI1zfglECAdsQE08FBEthez5\/gALUaTXISellrVqJc6kPb71LoOKczWwFbTa3Va33+31OvixNtyn\/DTVpAOwmkqgTrXIjFhSo2sz7mGZewR+d9A\/ODhMolhXGksjjvADEAHyQSsYjUbIlkaBeUgJaOp+O9Y+\/\/ZzghOnb1ldP3owXhDlIWDgbanVKgA2dQAgZyKNTBtE1xtoTS1FtsQyk49qtSL0Kt2gjSZITQqlafiNAgxJOIUdOn4PcjwatrRMV1r0Os08TQZtrXgFm0VPUFqEeOrkSdgHYYSQT8lE5zCc89iVkTaUJPzLptX1hCh7iyg6ODjAbtAuepovZr3V\/vf8kY8NNwee76yuDFZWuqfOHH3wXXc\/\/viDn\/j4+z\/+8fe998mH77rr3MlTG90ueW9R28VyTUBX7xg6uBQMqG44siwRI437d1xPSw8Oht1237PquI5jqD+Q5hmC44E8PbvlxDkWnnmYtySqkQQ0BzNFUFhAkmqmCpYkIm9WwiLHlbua\/kOcRTLkMNYJFh07cWRtcyWvchgGZBTeuX394NKFyxgrTfMDB5vF9eAPOCQWibnjNpTP00VABIxYivapBOyMs+sB5jLitFZ6oaLmkbrSblari8UtB5Nb96dndyfn9hY37cxv254PFkWCNLjZ7L8i7ME4KMWYu0oVCGANN3rmFRQ12kLAjJrAAv5U\/q91HzACmywMtCL4q0rcags+1P5CY4YoFFnpdXwUcRkEPUU\/lXoadLkZeMh5Yj0J5vLPUq8BEVHJBeIU+KqLcHpYC+jJjRgMzsz5JXZA5i0yJ7DTTBO1LZfTmrVhe1leLqIUVQz6w8tvXYIIuraLXR1Zc4+e3Jwk3fH+AYlsw\/WSPKagdqszGAxoNaJZRPGg28fQyW9aQTANp+ubGydPnVIjjYS\/ew5htvlw7uZzx06cTPDVutRsTPXMyg41BbQqwzg6jOZ8IFk7dfOpWx65e5bP00z9f5BHr+meOn7mkXc\/AdBlRdpwmm6Vbb\/wT73ZC0cHGYkTwO1BgEt776D56Z9\/OivT7\/93\/lDZPjnJWk6rU+QOT9tcaWVxQipFlEAra1sbo5VRFM7X19aQGfY0WlnBEnAZUBf1jScTwD3otBLttT3Hv45sHsHUXVu9uxSI\/HFcn8zDsqDOhEkYRlHK\/oH8yeF+GoUEd9P6f+4wp2RieL\/6w5vOYLhGKMN4sM15OLEVaXBXfutlR+U2nO395t\/+1Nmnnz739FdPPP3caDxfaTS8118e+t6g3ZaEjUeSPnEID6sK7gs9zs20SUrGcTQTwRyY7jQcv\/dDT3ptP0oiDDWNtel+Akoq7Ck\/QgjED27Ev7geAoCbwXGTWOEWreFI1A\/LF4uymgqZWrlVK6GRR\/E4DBHkIQ8yUVxZCv+Y7E7H0k4FCMKPii+aBWGPk3Ltpc2AIJmfajxxU\/NT8V+XbyloCQgqgAvNUEP5q3oO+ASN0ztns8jP8uWdphFpW7gchZqdTifzOMJXkRdtoGA8Vyih+aRCe2BhOpvt7O9OZlPOa+kijRDSYrVQK\/ydA+Eg6sl0ara0y2bhjLvwxyTT4gHLt5kIytEuA45wtm4kUTQdT8gwkRgGxu1K4TTpwBXWmTENlAyL4iRtw8a4BfzC5GQKXGTYAEETQmbegQaLcG76J\/nfdOXqSviKQ7MoX2dBiVSbHRjEVk7IZe\/w+PZzglZ7MFzZjOLCMFFb\/iiXxJWI9Demy9PoZTxQ37r+9zCqpQEpN1QoVEcLl\/q+67e0B1ejzCgAK6HZw\/XNJMpbPgCd2Q3vKHgQQN7r+SxM4xjpbm1tHd\/aqpvl9vXtwPVwP\/ja3sHB\/uH++uoaYDGZTHjK2tqa0GE6Id7wCKIChUM9IZRHjq0\/9r5HOysdTWZtWlVRE1A0h8q119YGg567Nmrddefpj3zPez\/04fd8z8eefPL9j919963nbj41GPZcX6MEMB3Md7m2kbr1PBdmqBkLUEUzEJrwHC80FW4RZxHJa74osrixqMpFUdkBjtgKXEfvugQES\/NCePymktguIsFMCVE4OikA0RDh8S32rQgt99PqHtSk1QkET3xTW4s4PxyHly5cdcEQM6RZE2SUMXO7YqsYgDmoP3aGCpZBkN\/kNorPxqs5+AxpNb6qw8RukR80edPO7I88u\/2Hv\/7WJ59+83v5efat73v20r3Xpur84UfrB9SqTZPwbM6YAqih4EQUUWVSoHkOH6gbjxNN4TxShS1DioFprAfEoW7UkcpzL2oVPTAoKQfzATuhnpy5KPBJPPObdeaDHtBoxEmstMCQbhyeMnjWUrxL4UuaN6BKZIgD48Z1MRqMsNNq4Zac6PeHAAwMN9E6ItXKylq8SLav73S77Z7fHra6N51ZWTt2ant\/2rXbVdaYRiEEJ5qHNAThUdVM\/KA16g\/Q9WAwnE2VVvLs1nIJFElLFf5uOWQx+iFlee8TTyAi4Hlvf393elhaDa3hWDcm4cwKvI7n45sn77p567bTtVWhecBu1B\/iDOfO3PLuhx61LU251CB0u7p24QuD7LWTvcrFc3vDpqPV46eL8s0r4cZo\/ZPf+8nB8Q8fPfHkkDzJquIiz5Ji2A4yyB8ag8uVVXfYq+pia+sIegHhb7nllv6gT0QEaiNoYhwTOz0f6pbv7O3yXAgZUD4Zj\/kuWiiOAuOdbg8t4m5cjDVUebGYJ1mhhTWB\/snB\/o2Jgv\/C8Xaqy2+Miieub26BZrSXsB7OpmhZaKNXoTUREeJYrfZ7N52kLIBf5m9ud7Kk1x0Q6ZdWuqwSYKl7cYlSuxPxBQGJP\/S3NglLCHCLaPHwIw+\/7wNPmBEU2H5OIdwOMuDUdsPqtTv9wWA6nUKSljWkrhRPmiTLbjT2d3fTOIHsgjPL5Ji26DWiNrQM5RbwEnELrZ0qozS+o64tbFXtl4\/wW0LgvF4EN371xOr\/fvex\/889W3\/z3pN\/8\/5Tf+eB0798+9bcsZyCGwT\/TSRSNvhXIYKDOGdCgfop5dN8yLlSOSTnjT9CPVMN4Rbo8TCaL8nwudkAtwF2USKt+6tOBc7zhKw04\/WU4TcQDtRwf2\/v+vXrs+kUOett3fJ9hOuSvIHS4WJOU6kOLSTBGM9msIQ4AXPVuQJEcBcHZUqtGu9JEqpJ41zPVdRuHi40icxoUIoqlEWAHstRCEgYmgKicYYqIVJ0QaABuBAdxiiNSydCZh7E12SA\/V4PKoDd8hUlqAYKpjZ3ceU7PP5VNv0ODlplN52NIzcfTA\/jtIDfcRK\/wlJrmDJtqxtmzD4hSkYkCmnc4wa9bOq9eBOzQPUIETtUB5edJgty4Hk45aTT8LtrWwezWEsHeG40nR7d6KckFpOdyfhAI1UQuutqMtl8rnDoNsIohBISjldXRtroJs36vY7rOeF0sjoYWk5zPg\/DeegpGa3CaN7e7N733gcs37p29doU9sChYGMRAjvtNuY1m8+1U2agndpHK4MzZ07ec8+tTzzx0Ic\/\/NjHPv7EB97\/4H33nztzemMwamHjGhqDukhsUWY7oHmgyyyLGkR21+8V+WpR3pRGf6is\/mxV\/+ki\/kgWuVGOzRSKmhoEh7XhAEJMM3cDP8M5sV0+U3KmntfKdwPP9kotq6lX9QgaHzMvYJxMu1IVtuXMonI6S958\/VKu5aGtGjPWpEHMHWpSWw1kI9XQWmKTBWGg9Krs9oOa9I8ETkt5a5y87q3xSQgyqtLbdKnZ6FreU1rDtD4a5kfn5fFZcTzMj8+zzbgYahNCjfrhOp4BZojIYwHGILib8zSQT6LVxjI5r4XKjPC73UEHGojXmQ3vtTRxssCwiN0Q53Yr4B5f9AbEoNxcE0SsxiKNETgZEqLQa0LzipSkDcqtpVqMFwH6tFrhX5lrM9OLCXEOnI1vQRyXcrXngoCX53G9Wmm6\/mhIq9figlhLpZIJZ5QZJWnHD3pkW\/3O1UvXyoWSmgRtpJMn3n3nOHaniwgizPPgJxgVlsUTNOAErwAA8+L69nWQSDiAO1hOWubro+UAQ8UHI+3vmoPamAp93\/f9oXNnz9x+++1Bp9uED7X7WV7OFgsU59pekie3P3TH6smVtIggkr6jblUs79Y77n33Yx\/A0\/Myq1wfkrX3\/O\/0k5ePr2HqZadNuMrC6Xw2I\/9r9uzRnffet3br+9PmyBsMg+6652CmjTjNB0HglIdhOIXjgvl5lWqvb9s+GB+WKYy+AO7XBqvDbt\/E+Da\/4VvhdNooKtfSKr9htAgXIXEUs1FOiZYNdQWdZlFoOCUxVUNMXBeiTDzZVhhcWq6MeqkZPik+Ldey5DMWWTq+SrU9zLmcj5taCslycRVdiWNXxdbR+qabxo2GfuqK3\/PAm\/f6Dlk4Mdy2g3Zf62kTPzpd4kevqy1zIMjEAdFEXBKjz0oibBQvNo6sf98f+0O2Z2viQJoRsJdBC0KsDjZXQ+lx4avXr2HM8G1CHTZInWlKFCXkxOhCOGrWPoGhEkJJWCHTi8UcTXUGA0NqyqYNumkUsvb+UvKORzi0X0XpraWBISopFms\/s9b\/rVPrv3Vyk9+fP7n52bNbXz02yrlC7l9pAQfDDaitQQclxGIJUAEJubI0M1RJISkUCtUE18Fo0O32kYjeDLp6HyMqIpqESKi5WknhWUEgJX8gKHRa2gELHOCxuC7m1\/JIOYEATS+E4iMlgjqfSS+xHEnGqJjzercYADKWtszRW1ArJX1LY6LMYr6AB\/D8JcgvAzNWCJ8SIlRZlMVwqShJ4CjAhCwJzoQvA25aAqFhBkJ6ZHcNkBiQsZudfo97mtpVUyMMlA8ra9LAEZjjaHVIYorRQoOoFXwCyNSIKeSmAwkuj29++Dc4vv2cgOPm2+7F2NVyTdQ1i3ABZmY+KJ8wUP0tKJHHGaDV2x7BnelC4W8TmcQUGrXd7XYAXD7l8URrElTxcG39yv6cG3p+F+bmt\/PRWgdShtF0u90jGxtwxV4fa2nD5Q7G4ySJMRUZRN0wA21qqNne7i7cUJupOXYcJ+j5cDyeRdP++vDh9z4CaEVJTIwCV7BUdRyl2nF1NoMPLAK\/pa5qzVfBXMzcAblu3Wq7N9184s67brnvvrvuuPM2KoNF0UQOmiP7J06Z\/ffqZt4InHs6rZ\/0nd8oF79YFf9z2firZeOvVdl\/ZtcDPVMiS3P4ugayIS8MkQ\/YNCVhDUs2XRQFXBRfcJQzNLOyDMPYyI2qaZQhtlTglbad5mUcl9ev7gJPtlaA0EYPxEGVzcOwaLizyD2106u4bq\/D43zHHox6BGUVRLUVGDXDRyFdz0B5iuLcbZg6p4qGVdQOgKHrKfpto+BoahsAMQ7Dus0poa6MQLRCbVYJPErURA\/Qe4YSSm6ynQwdaViQ6+GZ0CFf+z2KdPNbKjYvHQjMfMu\/MG8CBjSMRIoPIJxtOpkUefWWKkenxAaQjiwQTfEVByLRNWZA07JAkioYOrA47PXBjm67g\/8VII6hEdqrTaZtBC6WAz2rKdDXu72O27SvX76qiaUkiNGCMHTzrbc888JFt2lduX5FnaWGjpieQs1VSrMUYfTNnoGiy3UDukPt+K\/X6Ug4kud36XHbHXd0+915HEFwsAUkGc3DNtopysPJ3l3vuufkzWcWZkkPZF4UySKenjp907vufaIqvARlu45XJjuvfHHUuHpiBDeoWt0OkRW+Pg+LcO4sFs2ciDXL4sotGnnTtdaO3xRr8EGT5D3LkvWBlcYIWZm03wksz9oh39V7t+b4gARvhs2MDw6xfFBba9+aKeDaAqvXRdHSpvZ41PLk0j1WRC7uukQXAB0LUDdy1YjSgkQFr4xnhw3Hym1L4+b5aQBuyx4AV8OBtFAHNkLEt4arx5sNR55Sl8l8jI3iMjiQBWyoYwQbr9K77o9+8E9Pf\/iHw\/\/gz83\/xo\/N\/slvF3\/\/H9btvhYGNsSD2mL0eqFVaLcO1dAmWkAhNXWecMLjYBdFnT32xLtX11cQCZkoZmm6GJVQcidR1YETNJs7O3uLRSwvJCHIsijVOg141dxMoOcaPAJTxN8JkGAftyMRxIUd6rxeMiIGvf7nvPFe46\/Gg43X6\/im51vNstXQZCu\/bASUWRR8Bpi07g51hhJwsYGBZSHYj3AG96\/rRZKjlGW6ou\/MpuS0F2loJTM\/0G4JXWhSF2WtrqyiTnxXBCJXToT6qA8oocQCBm+GjmEkfCCuwng0+wCbUEM0qY\/fk8MxGNJua2v4VqvNQ+NII1hNDqMuB4Uwcz3ZPUV5vid01tYkmboQzKgF0250TNLEFaKnwAACwdX5DkCDIswjrElrkXE99xHRbTPjQEuruC5UQxzOrFxJBYUxKLEqTPwErfX2h6dDXNAslSESUZR57vLp3+Jhiv92H63+oLK8\/YNJg+RTa+UqfiEcCUofzItz6q\/wBlbnXGNGqsjOl7\/5bsltwcZOW5tDEU6dLEIsJAHDoDhzcsU2CV6jTEeD9mjgQcbcprN5ZBUj9hWzrTTN4yQjnSQD1qgZ2+u3uu1ev7StcBoGjk+mePHq1fFYK3qGi2gWz1eOrj\/5sfdBJsghQGpiBfWBHRu\/qqbT8OBgLOQoSkBhNgupKuqEJHIBMQajJuQkSb63N3vzzSsHB1P0hHZBfOqKXXA9po9t25UL3cub+ek8vyXJz6XVMIm9OITnj9K80XLTZokRwjwRIcQWc0Qu6J4H8QgeaozQRUpdmqZwkmG2U1KfcKEHYbSEboIZ+TKJVNUM5\/m1i9dnhzNEISBI8UTcRimUSdHlcXxAA9QPuoOS1JcjQksVlhy+ckiptMdYA8VwE\/kxP1wvrctqeTD22ExtJ3TdqWcdutaB7x763sxxtBCZyF5NMm6cH2tQbxhEBIWrJ5LMytSA4vS90EH\/cg0MW9saxZHG56j\/TR0ENJO2QPW62uCkF3ht8lFkk8QZEFzBxatGv9Md9Porw9HaaGV9dQ2fVmZEACgK0ERiNfOLAAighFi+vrHB43gEoiac8BTULdpi6KxePbjaLIPriSt8pgJUv+VpsTRyjgDvR7nUnWhRVeHOYbnISCkIB\/FsduedRxv9jUVSrwx7b735BtAGISVAUjIANJ1NyWWxXaoxGo0ELrleZMRpfPLUqRMnTkjI323H2+jPQc7zQ3\/qT+1s78zC+cF8No5mGmKt1aKi299129FzW4czAYLe\/1QVyrzznvvvf+i9aB0dNO2228j3XvncZuPi0VFuVw3fbSvHKgtStWTRghNEMWbZrOIwD\/ch4Njm6vHTaTNQFlk14ASrPSeZh6K1fAfFarmO+mhdYnmSJuhrvlCPA6QtirRoD5ZGjoXkF1D9cLqI5vgqDRKJNOPIll3u6m83o8Ng1llGkleRRZTl4mD\/rTrdD9yaLNUmKsBBGp5bekACqR3Gy\/Wa4ltUp04cwzpIK3Cf6WQfsYD+RnI4FnUvyyhq\/Lk\/4f0v\/6\/Wj\/5I57\/5b+wf\/KHw1juSMye9IbA\/kvlhiHo\/hr0S19XdpZBnxhbAYPBPoh+ucTg+OHZ8874H757NaY7WNJQvm\/dc3BtqDQPCkpUm2bXre1bTM0Efr8MPNP6O67FGbJv4KjckeAcQbsJqqtf2mZZ1Qozjw0NO4iaISDBg3F\/XCyrULMTFnwbe5cE8hWokbh3ZTmq5cLTIaWbiUhAlbTdVN0u9ThIiUB7i1ztKIxxlyTiC5jOBeabDgxIVuV0bojY1\/fI8k1bouZD1Im\/7wepwNOoP8fqgo2kCRE3Uh62C0Ro8RPhU7ZWCIhZcjEZRZ9ogiZkkic8IDRA02YWGnXIGydAcUcc0g+irn9Ps+aK+PmzNbKDKNUWBKvRyJeJZ5h0HteMmrhKcLfdCNENEFUooTMuq5jRdXaL82BZaVyKkzamRXoUkJVKwQrvcaSk8kBmUo6YEAa5RHbQwKOTAZGI33NJA6L\/58W3mBMu69IYrg9Uj23sH6qOVoWD5Mj6UYVAfxSMZ0iB+FHbEazRETlyAbwyFwFcwJFqY2l6ZFpnmJs7nXplPr7+UXXvqo4\/evrYyuOmuEydv2gCP6zJdH6ydPHla69lpP7AalaRpES+SVtBaW1l10ZsICAhULeIYLDh+9Ci\/Cf\/D\/oBQtnOwO1gbvueD78maGkiCjAkfczM3lGZRF8WGum53OiT6y7bgP1y2WCxoAkaA2jgDo9zZ3nvttQuXL20bK+UyuCelibtxAaYjyuNotcsrTvCmvAhuSEtv8GviOaFFESfwLM\/hSuxI\/d7webNcBtYJXUI6\/GnMUoOBZeZNezKZpWa3UCGS+JhoAQ+exwU05dWXz8+nqd10sLbDg4mlpQsQUSR5GwemDiYoaygfmkNx+BKRHp8GHeA1eA+\/8RPjm+r9Qrcl4tZwXxRr4axW5Z5fH\/zje7Z++YFjv\/7gqd+87+Rn7jvyS\/euP7\/V0TRqdQZKoOaXZMJ9FIXtS\/sUZE7yQRZt\/jcAsXxcUy+DyVr0wj4liCITyBA2RJOpMB8oTrzc8\/hqPJuOJ+NwPucaTlIKAIqaCO2kCCBLNI8AStqIO+ndqkFb9R+Q4puuQtSAADUYIU64xnidxGsEZsl8fK1i\/fzXn33zpdd3L1\/PFhnkgKwBgg83ne4dpGGEgqC8o37zPY+\/K7YGDz\/62O2334GBgq\/dTof8ldrKuhCFWRUbZAlnoXRhaci32\/IBA5xfYuEQZfquO9AOv++7\/37qj40Ae\/uzWVxmaSO\/97H7N8+eWFSJ33GDNnqw4ih\/6KH3PvjAB8vCS5tZwyvdPL3yjc918ldX\/NDKE1IjsisS7jy3o4U3n1tRgn34VRPmkMUH10AQYkRvdasKBgRy7C9KFus9r0hC9KgKkUSO+mZVHy0X0+315uF8kcaj1RW0jBLRHyqGfqF9DBg3QrlEXtqhCGEsG6+WM5h5Ur5HrsdHwpZXZc2W7b3w+1\/52R\/\/sc\/\/9I+\/+sVfm11+pZFN4b0OuaVeCDm1TZ6bY+PQApILQ7ybvmfPw3Ecz6HWlFyCCnYBqFsNO3Fa4yyexrPDJCd0N7OJncz8VgfSUpjQIrQUVEj9uL8y1oqYrViFgWH8aZG0+60\/\/oN\/dLTSp9ZkyUqRRTrUXlq4JL5ElqvXd8k39Hq6SV6hJXTwNvAECSATjJvMFLKLHDBLPI6InGuj51m32xENMa\/maQ9GLqgxx1JQBjyAC3I3RXTVevlT23fuxx+5vP\/+q3tPXj548tLhBy7u3H9938YN5Lgu+KESudCUo4byj96rcLsWD8URRB6aWiCO5nR6vcHKCDjHnakM34JzWAJCos5UkUhD\/nd06yhNFjgI0DRpEM1SabRMeykbCOWkksggIFTTZLzeGEATYzBVMK0wXQL4o7ontVKi1223FdqtJrTVdGOSfC6oGJIWCDVr0l4c+QZWSALq0MKigDNjcYr0lExtuZ2AwsGf6AlxAQjhbCZapRtvbITGoX5PcjLHarfajlksjgNRUQgFDIajdlu9ie\/wUIO\/vQeI3u1vDFa3CrVaUkPTaJgG6jWxDFoxktbSEtSHxNA45wHzZexEaPof6QgVfQKuWbaI5GJ+9dXfiy\/9zrlR7GrHwPLo0dHNd9998fqcAH3y2HF8QDPUVUh5OJlAMClndWWNHBSjsVwtdH94eABL8FoBzGA6m3XbnZvOna2a5bk7bvrkH\/uk5eutTL\/fha6lqYb1UQvsDU1TlEtEN6tSLE0HNwJosAaqLRKfV3u7By+98Pqzz7x09equZWtVHNmfyYpppriesQPhi6vJ8UnQAv+wINtp7rT8F3vd1\/vtF9qmP1n7OZGIa5YRNtjudkBb23NJQDEu\/Acrr4mvEFLT7Yl4sFqkjIB5mhwRC5Pdi9Ds707fePVilVtm2KxOY3ZUhqtpG+GZeiJxbkF0hGjMDoOXpeIYitMl2IHXydYJT5ySPqQl\/lV2YPwZAzauXW13nd8\/1fnqydGzp9a\/cWrtuWOjp0+uvjlqgxfSPdVTZ6ACOUVQkKCAZxsT\/+bBn5yjnrgVVxoJG01QJ\/ULagcjCFBCkMjSKInlbY0b6AAhwH3gHWT6k\/lsb3ywPzm8sn2NBi0Nj\/aCaK2OgC9JFO+pCb\/nYcgHDAnnhh+gfpzQ8z10xLfLDiHkpivnc25D+zxyvL37+gsvP\/vU01\/+\/Be\/9IUvPfPUV6fb+23bJSsJtOFfAAacOt7ZOnXTZFGtbKy0gq6MQi9sMckcFetdhlqog7QsT1NN4ev1EYGSmzhBOtLod+uxNOwXXnqJVuA4QOdBOCt95+EPPdHbWp1o85FOrx20Wx4p1T33vuu++x4vIMJF3nDaVp1ef+lXR+VrG13S3Ua7N3KCKtfkMjcKOyQCcVpBjifh+NL1PThFHu5ZBQSubneHw\/UT8wSWZpM2UfawYyfRAoNpd4KNY0fyqhgNhwR+dBp4ruM5UEBgFaMaDofYGH8ue6GxH0qmFXi3wgw1MzkAQscMMD9yCQyRk5NZDKteXxmV8ezlp7\/4ud\/8pZ\/7qf\/5Z\/7mf\/tzP\/nf\/Oanf\/zFL\/\/KzpvfqMKDdrNum140TYkO3ECvfmpkBJbFc+C+UZgOMr7mofiOq8Wcur7b8bXZWdvvDZq9QTBax0JJjfQmybyoAxAJ7ZocK46hQ7FCWx0GRZ1+9BMfPnnmRAjRnWuDFGoLANEcGZUmFzj9fl\/zdRexwif4UOmlA5dRlklZ1WcGl8U5bUsox11YPR\/4kqIcz1bXeJrZWgRFsIawwAxDKfQnB7ZgHJe2Av0KifwL3H\/f+YP\/6BuX\/vw33vrzz731Hz7z1r\/7tfP\/1qvbjToBdOza00oNQhUVYoDEmLtmYpMqOArlpq08FHZADo0DLqKIhgMH1F+RUmm0SB6fqTbWM5mML1++PB6PKWlJBQKTkuk1L4VpQwVDC7KMADxfaC1zDqrAlwR53FGoaHKVWKscNsL5LFtGIpLVZg0wQ16XARshUzI3GmiFy6Ir5TZGIIKyth9Qc6C85QUOuGumRCAdgZmBbn6IMXmZkwpyM6kP2Zd0rFmNWnIG5ON60TAIn7FPI2odCqzNJnENJOGh7\/Cwf\/RHf\/TGx2\/bgfSaVy6+cu3iq0c3RiAzwkWdSI3gwj+IWIPADAJyNZaGFswrFw0+QKZqtLEnQiVEGpuLF4Vj+aS1zeLquWHRDkqn1SKTKG3nqefGP\/2zX8tybzaeH8wmUKlmAS8pp+gvzzc2N3necvQpXkI01X4IZlOZnb1danHqxHEHZtx2PvDJD7b62jm0124rSXG1ugVCb7c1Hx0lAQ1kf5RJzXBLzuAn\/IdGURg4A1m8fm3vzTeuXLu2R1SFYZZmRxyFKqXQ3HfjQK0K7MZ5Utt6veX\/E6\/9ac\/\/Jc\/\/Tcf\/zUZz3\/UhVHUTCizn4GagCtFhdlpQk0wdY77hQ+pKklvyFL0yaN5209aJo30N9a3VDTcc+k5dPf\/VF5KQwARRLTwfjCgVrgKxFi3P0GmnRUOzjyvIZndlrZssovk0BoQaRQPzz5U6twiJBFpSEmIZT\/c7rau70e5evLXaJ6+jsXo3SPIjWqAeHq9hu1qerDZjHV3Yid3g2xojp3WqPhCpPj1BB+2RtRuow4I0FlGjJK3DkPhc9fo9jQywYESOUpC6wE9ENE2vAP6vnjUzQNdIQ72XQhdKJ6ibboOl2ME7BIVmUTSXoU34J4aIQrmFEjiJcih5iXAonW+pKECodAaapq9kxujU9DopdvHQdquDWyPBRThPomSl1SWDg8sCtc2yitPZRz9wx9aZO6aJs3b0WLOufuXTvxDPFzydigErpDbhYq5shhYCSkrF1DfJQ3en44cefeSxRx7niVRPPS3697viQDLLuiArGjIYDr74xS9evXq1Mn2Y97zr\/uNnT+xN9vFr7SVlO1la3f\/gI3fe9aBWe6ozdIXILj332dXGq1t9DYknypNHJFkcTvNo7k2mjUVawaDDZPbam69MwmhjYwMht9ePNv0eoBmH491LrweOxNjy3TCvxgtr8+gWygSuD7b33dqah4vFYg77R8L4NcC51KD6ez2P9FfDyzx3EafgUK6QoInTBDIQFnKJlh3DIJ2GE6VRu+t32lZ34HRG7vpar9PWoDJC8N7O3luvvPraM0+\/\/PUvvPbily9fenkRHkCQMKjVYffFp784nx4ELplGedM9jww3TpZ5ghuAHDhlRVRMI\/fFN52r296lN3q\/9KuNn\/3Z\/Df\/cedg\/LXF\/huXrttugMXi0QCkbbrugkCZIq3QMlyNZprGx05ufv8P\/NEo1cj52WSCESpNMdZuMKrq9nrY28VL23ACPILEZNDTrMvx7uHscAa7Vxe4qxEz0Dp8ZjYLQYaOlvslO081qKXX398\/OJwvuFAad+1hl0xFkQmC0Wji5ya0yyjwadBIMVJ\/187j29OtKFYHJjatC+qZ3\/y9Y6sxktXbtlKBTaFNNEa5tiKmE2bZfDnkCQXzXcPKyfrgUmag\/jIx47zcsxZIEjJjkx5AP+WkALFcVXdjk4hCVRJY4rYiQ8twbqaHKSrzGXcGNMAKvTGpNIYD\/sF5akP85gwwSHsJ6bSDpmkVojwX1zAgQx34SO3Mu1c4nAW+YLFEHC7G9ngi1eagrloqjdt8f9k9SalloxqtrUC84kUs8CTJAo4MeUEEnUEfDIUabW2tG5qnqQfK4jS0POu0uw\/e\/8gSAI0Klse\/MVgocf92HsuEr9E4de6WWMuESuiCd8UImseXWDDCoZHL1yTim8CcDF5vjjVs0xTANVySV1bpqAddgzIwiY1WUzMJ\/A6GkNXOZ7+8++lfed2yN4rc63Tax44dtW6sgY9knGPHjqHF5ebfSDBO46TQHA845MH4EO2dPnkyWSwo\/bEnH231\/DiPAHyntngwtVEP83CwjBZB4OMc2Ewr0HSHMJzROGpuXEtxAi1eu7Z99eru7u6EME1IA9SxCezQGJJ8kkNWohcojVwDkzOvUX+x1f1fVlZ\/cjT83Gj11f7qC8PRxcGqtnx2fHAI\/+B6xCFuYeK83ouYQVKm00L9zDI\/xUt5GlaOpSNXxGfX6lTkNmw2C9NS22qYl5Aa1bIcvS\/PN05lXgEa64Gq8UicC99Bb9SZ0vQuz8RsMInHcDvfoSB4ipz+BiOW2iyiWMMlsnmVWVRIoReykdp1qWF+hFHlIFjtslkYvF5C8BTKUwWM9Rjdyx74ISfQhi8xOUETByLVHPb7kO5+pzPqD3xgkVLMOw78inIoUNHH+LlH8yxn0On5jlckGSEH56R1yA7J8gAuQ5jSYKOx7APgJLXhTwlE9qkL+EEXcAo5rpllhFT5s7atKE\/xyKxQjx8YASj6nj\/sDrYGq1ZajGeTuXkbutKz7rr3nkWpF9j99vD1N9\/c2d3ZWN+goTyC52KlfEWL4awtjYfSynqyF0mwvvnmm27I5bv72Dqy9b4PfGAwGvU6\/VFvCAuHefsaqi0NFUn98LuevO3We+NUndUopSyjt174jY3mlaMD7bpJDlVqcbbZ7NCZT4LZNI3weseaLuY7e\/u33n6qdsrJPBILG+9qHmCRHz912g76KB36lGTV0XU+N8jEsAZEt7V1BMFCyzCJRRhqP9xWS1PwlR2mMAEcAoJLfmxZbsvXGqCADFJH1GSctGhpDzA2qp+lCY6QNlrXDqtvnJ+98FZ6\/noRphjlcOvY5skTa6fOrK1ttIpssXv50pc\/+xuf+Yd\/91P\/2\/\/7b\/3Vv\/B3fuxHDg72KBlHTRP1pLSwEjMTOFciquGV1YsvXP3BP57+8X8r+RM\/YP2V\/3r4Uz+18ff+vvPTP91saoN1DZ+hVphl0wK+qE600BY4ICclEQ7xpu\/56AdbrYD2UHkwcFW7cPXwCwzM5JS693A8GU+mxD8qkRUpSRpN1lAoNbA0vebaiwtUSeMY7w60boG2F4Hmk4VCcaM4BpTwCA7Td75MVQlZpi\/DCIxjaazfxD0QoFFrPp458C+1xapAfx\/\/LRGDVTtmpwOT8gqRdJ0WDs+Fbppv0aUCxFF5bqndHQH0LNarYcI\/dJ6MZzKZLqIID6UY6skHagQO9DoaiwcwUiZpHC0FBDmDg5uq6kBEODdf6SRtNos6A7G0q9vV6Ap8nwjNjfBHyqc0AhxPWd4SwTr1opm4zt1mDR4zf5hSOUGRmKjnusv+RS7mStrCGWyS8imWQmgpvI0W4QPIlqIoHHgzAiQ\/EmMCEQAK1wFcEa4IgURyQwukpm+\/YXwHx7eZEyx1ybG2cdrvDOfzBE\/QnDWNo0akMm3RBswcOiOKwMFnMxIOLbkeRAkBKJhqZRsKhNLrSmyYWJoXzcrs\/LHI7N\/6vSt\/5+8\/tTeubN+zPac96JGWrQ2GBETw++Txk2ujYbQIuz0cUFldl7BvOUmWL+IEhwDqw3iWuOXWrSeyupgcTqqshJGYyXZCZBwDcYMpaIvPvb5SnU6nh9yxFXSjrl8TskCZyXj+xutXz79xBSzCsgUtVFziwDjwO+LpjQOvof7YPf6j2NmsWwBQ7bhkJwhBwcbGHrmTNjtasVQ9XopxABa34fIIiMuMHZAl67xjuUHLbal3dDKJ9B25uEKsxhpqsT8XsEg6fRfxRzMyVwyVuxXdsQF1t5vEGNJm3gbU5B5ogFjbGbWRpycjRI\/ExoajRJWQSQOx11I9XZqJRAHCA5ltw96axo+\/tf+eN\/cfe3330TcOHrtw8P7Xds7uzcrK1lS7UiOB0a1oMc81farIyjwZe5BoVHm+UweMPxyMHMsDucj3FKv1BpEQw9UNYk+v1VsdrIwGA5q5dGyqwW+0QxH4D67DLcoqhHhychwMaCAUiDcYOsX1omFaHdYG\/qAXCFkMrixJnkh4oBFtX+MZwa0izRxyoizHWYENak6bKQFxSYDKlOTFswiK6TRyN2uk99220l7dGEdWtz\/0mk4WxcDBkqFRpdy8kgTl8rLqDweQkZBkJE00XQJZNMu3LrymiaWiTEvBfLcc36yLRGCO97\/\/yW5bo\/tstz0+DAldeu3ltfDbdz303nO33k8jjU87ZRZdf+Hzx5zrp9aV2QStHtYaR8l8HMezZhzZC0DYsafz2dX97TNnjx3Z7G6M+gtBSh4fXCPg5GXdG244\/Q1UDMzAy9dgVK60D1oWjcLpeFES+epTVMex1bSzSC\/PDI5bs\/l8PB7jkWlBuhB3\/ADNQeJBj95giI0p\/smH1clJSJjHISo+OJi9eS28vN+8fGC9vle\/eC198VL48luHb21PDxdxw\/fWNtY6vf5ouBnN8v1r+3tXL7\/49FcXs4k4O+ht1W+99NVXvvqbe1dfT\/MwcPOW7zRdp9VdPdWsTkWLk4u8jVztBrkR5plrFXDqoGTRvMcXRmnQsmdjxNBcwk2cRY++95F7779nOpuQIBAscEOAwdVKuC7pEA81gaextzN1tD60JhkmUQYeq0fPdCi2ibiUWWu4TFoW03AGhebB4Av5T7\/Xb3nBbBaSRNtUjuvIaurKU+jCT9W\/a8wBl5U\/80ufZBUKaUD\/xLVmnoYbjwPn0Hdnvjtuubio1qqgcfCeRgFm4byEANPf0NSmhOTFWs0csKGehBCl6XzASeNcM\/QXSWTctEqihcZBpqL1GAAH5AYvp3ExuWmKQVAvJKLN0sBM2mVymwpJEOAVXQk5pufA9T0IlLojtaUrxKYk+8KECqKGtqNQDmCClBwe0wVKIFhpjmxEOOaLhfZs1LA2xbGlaIAgrhSrqMpZtJgt5tuHe9sHu5PpdDLWNAd1LARef2WFqkB3CBs0mMogQkTJB2AeNAOFSRp63W4r6BAalP4ha8GnFWgDXD3lHWYP\/\/94d4BpNAPfe\/qpz9XJbGuzLwtRpYUaSLqpNBFxkSsoDklYOJ2GttA8FGPy2Rt9PpzTqxS7bB4cht1+v2mXwxFxvfnZ37n6ud+9SkilsPWNrf3xPvxrc32D3wcHh+A7BR1OxoN+rx0EcZ55tq+9ZSI+ipV0YdS2NTi6etP9t9mePZlOUJ56CLWkpYYTUlWMhDhENcgYqGdq9qGhZA5wnBijd3ik1XkND9jePnjtlfPmZQgHWtLBv8uIwmdIBnrlO1mTnIXIpFmqCVZewHPqoEx9EposXi3KQV0uHG7DbF0MGavEhmUWYhfqEFsWhbNRDsYqFoloRXCr40dWb7t5k9xGnm5VGwMNjtq+eEDmtLo5mhyEeZq1AvVWbWyuUjhsJmgHOa0WONSBax05OjqczMZ7Ux4JGyDzbwWBuhGs2m\/5KdSdZkLyXefqfnx1e7Ha7\/uuVcFggBSuc6x7rkw\/+ururTvTczuzm\/ZmN+\/Ob9ubh77z4kZPlVf9yRzhH\/JDyYn\/+VPgJ1JBkzQGsbKo0vW9SaqlbVvy6UZNsOFqHB76AKHmA8pCGuiEP4kK36T\/yAIXUvgvcgRHq9HFspcQ0SFJLgMCUCLxmAjNGaQHseA3n40Tao9EasYPwZu6UioV5pAihCq6jAe4lnaqpWKYI5CdJ8nRo5sgJ4gcz+Pjx9rf+8n72uu3xXmwcfQY6enOtesvP\/O8tquptXgc9cJuCRiYnQsyV80syR2PctLd8YHXde++554H7nsYQzK2ZRzpu\/OoG8PhYDa5un3+Nbeu46y2260jJ9dbjvvQu99z4swttAgYdjyvUc4vfuPXtoLD4wOwt7Q9n6wgL8o4tuPIjaJaswwcfDa8unPp3E2nyPTqZhqF6cFeuLY24MrWkXMQYd9zDw52pttvNEvMz+73O1f2w6ypgZqJ9lpsRuMFvAT9JgUhsGr5fmZG4EuhVQUQQyPbnTZfkXKEqQZzozUoiwbo6W1mqVdCsiZhO8U2bZcQDlykSRqS9sXFIq3niX5m8+raznx\/PCNXnedwH3Fe9VBr9q+WNoEcZfH8+sU3X\/3GV1957veuvPT07PqlcDLNGnl7fdT\/7S9429uCSuMQKLtYX3v69lPPv\/Km7QRyD0JjXqRRgunh9cIr2yN+bp3Y+OgnPqwV9C1Lr8Y10kWv\/Q3ScIf2S+u0e1eubM\/niLVZVgUojLpWRz2A7PD6QTLXLvOAGUXAHhAZ3oGJ4zvYOJ7FeXwtIszmBV5GWM0bRacVrPW7wiHNw4RmURcRY1EM0EIYhcwE6kVtXRh5X9pc+Z0T61840f+906tfPHXkaxuDQ5fkJ3G0erdtEYeJeyIidl0Kb2DBUWGVZnyYpghVlTawmYSoxzIv8fUIjYTQyA+0r35os3kjf3LgJngWzecgNMv7fSUGKq2qSJ8QDghEm6jnMuemrvJofdDuUGgfBEiSGGcPghaJAfihYKZd+IVZXMCVRIEleQJhOE8FEBpQwFMybdFikF8cAl5jmBPCNb7Mb8xMsKO3h4KYwcrKeDwhV6A0yuegUETC0y3XHq2upnlx8tSRu+68HXADrCgZ6BPQVeWwP7r3ngfNTdz6TZD4N0YL1ezbelADVcLx2sdPnp3NYzPL1DYcTN1fSFAmxEWm81bCWfZUGzLMGcUJE+p0odY24GPD9dXXB51DevOs88v\/+Pxv\/PabDattaQnq1kIveJqdTn88mYXzea\/fh3SNpxOxsqq+vr1LIVoURgxRw+O6rh94Tv\/E2s333dZqB9SMqI98URFZPwfxcjKGvU30aLNDEqGn3e7CBkAQmAVehyLJ37udntX0zr9x9eWXzhMOFCjM22uCEPXmGtlBeWM2Jn9yGCkBgHp7V9v1Rl6\/P4k\/MR\/\/R\/P4L4fhj4TJ\/zI5\/AuTQ43\/cZ2GlgAhRIlKL2kAEoKOLAPSkprwAYkvy4YbiPLemNS3FKMkaQRMOi\/qy8WYLFaDhZtuG+XccmaqVuvFOdGXG43HaeUQLjbX16TJIgdyeGolrs0XUbTgwfypmlVm+HCZtsuyA2qXjXbZ6OSNbgG1QZFWqeGl1EkmwF3G6GUt0jW6F3joDSh\/6i9lGDUkjirGeslHUu7HC60RhhMgZaRNCaR98ILJZLK3tycpm3tpGl4k16iXQ1kJsS4pBeYh1zMHZgYKLeJIkoISyTy17foffNts+u0WN9JaxINRAVwaB2Jb0CfNnTTpDKEan+y2O92gpV3cbafT65IjiB1p8Zzo9KZ\/\/JabpgutcBC0OtPF\/PLFi3kGcyANFSiYHin1NDq+C5pjXZSA6aBnO7BPnjk9HK0YWXFIXN\/NB9Hnh\/69H\/4zP\/zvfs\/H3\/XY\/YM1b2zH2YMPPHbs1NksjZqIxWll8fTCM7961Lu20Y7rIrEtUmKomJNl7jx0FwsvSuum64WL+PLVt06cXPE0\/ocMrF5d7+iFclzVZIfzCW6BLR89eVPtaKEi0sY0Xax3vXSRlk0Hktq0m14n0EyEqtbKx8SfopgvohhO2Wi0tYKN1Wv3+p1eC5NSDLiBPIkmmGiddQW\/QrPhCRO9bh9Iz9JUPVoFAdqBeliOlxSN3XG8Pc63Z81LB+UbB8Vre+nlcT5OrKLpO57mz7sOLGcOHd46cWRza+T7xTzcu\/z6N377H\/+DX\/qZv\/5z\/9tf\/MVP\/Y+X09nMtfYDe+fYevjwXfP3PFK\/+6GTgzUNXDJj\/TFmWbexT3mTeg7yKJ2\/\/4NPkMZDdKaTSbSI5IfmbSDZMVLj46C\/AjSChLicXB6jNQcWjmRTw7CjSN3gnY7px240NzY28CacAo+gwEhrHuPDmheN2cN1OPDBpa\/K0cwBzvEfYLE0Uznx8rDs\/aB\/oRdc7LuX+91L3e75gX+108itRAOQSDsg73qARK679EmDakDeJS5xkuryA\/YVlUZ7UFt0AY5wBt11ev2Nza0lNuKPoBcnqbBAUb2rVV4VcZbGWpNULpyaZaEpEEEhU8rnoEwQHvxHwvzmjJCWdKso4vmC79qdzqAP8+wOBwM+dFptQBC\/5gzII2GaVdEAO4IPkqAO1AQHp0qgJaGBkmEAMDDTRpgH3+gr6kFag9enSQx80XwqZhStKQ80nZrwJ44AS1hE4WRyOF\/MkzSm1t1eZ6gFnL49+6F82zmBrEH6bNq33\/3wPAH4NF4DWWOLmBr\/AfzKnhGDeggkGWlCSC0DkqUu9YMF6jMyaRCOu90WZViN4Gd\/7vmvPb83PLKZNxtB0AZSD\/YOCdvLoSXtbjcRe0gRNdZAZHdch28PDg8hv14QDDuEdmt4auP0\/bfWdiOLIlVMVFT8Do0u9UoQAgvwxcVirgmyihFah8AkpiSjYmdU8PBg+sbrFy++dR0\/gsvDPDBKarw80CK\/1SIovwlFywZyyPJLqy4a5+r8f1jMf3z\/4N+f7P9gGP7bi+yRRb6VZc1CE9ypA+aq6429mlAl812Wz8FXlClR6sWLGYKgM5y\/EWtxAKGIwq1eahixQuQ1R4uWlGC05WRpbrgXh3isKXA51heuWqMbblYx9ZKdqECCOB9oIPwKhEQ+ehBiRJu0TaH5n41eRrOcqCBDqr9UzcNUQ0OfVUVBHt\/ppRGwJXyoC6CcHEMubJPM4RuKuZp7RqXyebSgZjxLublZjhCjoqU0QyvURgv4DTotRAnUYa2ZfkGwrBZSAgrNtAU1D7AQk7LEMEA97W2d6yUrJfCbMpeYofa6bq\/Xoxw+U6tc88JFoagAvuqhA22R0JWBN13XavV63v13n3J7J8mEBoMhMh9Pw\/l0Pj4cI0qjOGVsaJIPtmuvr64CNIILZGQ377j39ptuPTsajjS4cnnou+\/SY4nl3e761k33jk5AZja+54lHnnzsA8dO30nWqiV6\/CBOdt967teOujsbrdqrrW574HoOGk9jEYJ53CSPgO6HcXjx2mvHTx7p9wIAGfdp1DYIjOAXYeI06sXuFdA+L8rh+jGnNSIJxASRbNcuFuMxWhN5g\/Vq9E5NLigCodWNUg0EkYVrKQIUSxKcJyky53C1mBJRUPslSuNcZtm4PF5HMgZ4ESY5G061DxeAPBuHZZo3Si2chVlieSQpZe3lVWcet7YPrDeuRuf3Flem8UFihWVw8SC9Ms7jygvaw7WtIxsnjp48emIY9BpR9Mbzz\/xKP\/v0nRu\/cN\/GT7\/\/zN\/72Lt++c\/8kS9+\/ImdRdT2vaoEDDQuSawF2xWiQlKhuYt7H7jzjrtuxlFIjzDrTk+Tpakol8KAaWCv18\/S8utf+wYpZqKXBgpalEDT+JYPywwHGxZ4OQ5\/muRHr+FAE54KISAZ0JB+7Rc150oqokIMA+cDsqK8ZWIgXi57lp8JVxFjs+EBZ2YfFr+ogqzyc2TE1barWf52YvvAp3rl5fFAFfegIwGgULhQJp0pi65sFGImgZOvayIW0hZtyRJ4XgROK5yT3fGtNjBDK8jE5EvUByXSpIhAYWBB407nIYqmjVwgiDCNotVyd0xDoKSqqBTXJ1alSTKbzbiFa9CGizmbnIx0E94HVdB66yCU7yMfCRBuYbxVoswyAVTTaimxCuTv5AE35KToAO4NRyNawTV8JVMzB9jKb4EkNAVmTJU0t1m9xdSBqsym0+tXr03HE8pXWe\/4+PZzAo4l7B45ca52gxDOL6jAMAgaagg\/fIsNIS2Ak1YjQVmCetpkRvzPv5KLcjAFPNDXvMbN0BpczW2N9iazlKCWSb+T8DCOEwwXk1UhzXo4GgL4B+MDLF5I63sB4QTyVeVpFXVPrB2743RZpA7GGhgUSAj3C9SiOtaaxd7tdTVMt67UJd1p+60W1sZBDRXcywa848rVncuXd8+fv4SFWOrMEg2kPQpvZhIdBsNvVMVJasJJ5HDjqBpQAhjRW416khdwfjLKBhUoF5o0q7dZuQ1ZMQjAjZRpiqWkf+7gJL+XzeQ3oLS0QomZZ2iYoWhyUwMcMH1OaEyvaKnkzwdSbY1ZRW5InaK4V7ebH2SIBUKtxQkotiI3wlalNR7GJd9ESZEObuAhtV003b2Wf2HUfnOl\/cZq8MaK99rIudRzDzyakZrAr5ccsoq3H7Q8NF2BMoz5qPrmMv5Uh2VZhOGcOG\/8Slxk6dVcRBDXjDK9EyqphdZuMz5mrEhV5IzaDqCYuWRcpgu0zLsnOzOaokCKAiWRJ9cgB1OyGBiEkt\/cy+N40FLmlIB2KTxOU02V4tsYHpHEGcmWuscpmCfNZ\/HJY8Nb7769tI74naDTH0QL7sjyJKNdmAfPwrwn4zFlUk+ImouqDHEyQNvwun6Wp2srI0qU9ejJ\/P9NmX13HQiHsNBqNm49fdPZWx697eHvv+99f2L12Jk0TbBk22svov3Lz\/\/KqWB7q4fLNIJut7SsqDDz48J8FtZRol2kZvHirSuvHjs5aAV2lqTIyhizOss73QA9YGjxwRUYPTrvDdd7K0fDOENgZd7YGLb9ZlrmCQKsGtVwdYSasgKgV0gFRRGyL43bEH+yYRE+Qr7GG1bESX7zLYmaTNxEC2OKNUgvN4MF5tiPpVH9GbljrOWZ9mfh4SxbJNk8wp18N7DJoElVPccN2lCEWeZemtrnx81LE\/vV68kb15PXri3OX5pd2g6zrNEPvKPH10+fPTa\/9\/Sr95565dzWc4eTp7\/8+7\/5Cz\/9d\/6n\/+4rX\/qtXq+Dm2H2PJ7aU2Eck6bMwrDda334ox+cTA9BP7gpHMhynbTIFnFMBoZhk7qMeisvPPvi1cvXlEdq3VU5MdzUdASS26j\/mUAlCwxaS35AVMMmcQ1dYVugWKvdwl8BYjxF8ckMKxZEG0uU3uVtOuTC5jCwIOFxkg+pVWHrecPmd+Hgj\/Aaz6psdeg0C1CIzyZKCGk0XkB9B7g67aZMoQuGD3szz67BfTQFDWp3O2jKhIbCLFVpw3rI6JIsS8wKsLSFGIyj0UZF66qC3CwrRkmCPpOs0lCatuT6wqC3e1DUFUFVbKs\/GKyur6PY2VzTlTlJzCDucyOFaw68Vhf2CRzrGxubRza5BrrCt7Ieg9LLh\/KBJnAjiE12QWWoFdGO+ET6Gi0W6mE2vk4FVBmyMrPdEaWpYiYTo1ZUDn8Y9gbD\/gD5HuztaxMfiU+\/3snxbecEBumXh+1brr+ItIwgbaFV5lv9yFubZny4RAY9NKdMyMIGabOCi4zLghRhEDhC0LKTOMKcNzeHOzv7igDE0dppWDB1DSGGfQEWFLSyMlwsplmRDPvqB+OyftAhfdtaWy2LZOO2k4985D0rvc6gQ27QEo0o8zSN1T0OG9CoVM0mQD1mmrXWvUdD2k58rg3FKc91NN7t4sXLL7345ksvvQkXXM7MoRWommpxl6GPejlCWzgokDMcfDAab5DWYH2ZU+86daL3yPK\/Bhbg6rXaqHa3shLYohrYAWVSFObFVTeM1fRumZvwGYMW4JeJGIQcruc0NAojpP2I3mv5TuCDeQ5NDlrmvR3El29kshSP2Uk5KhM3V1fAfBZGYUQhxEL+1Ps7w94FzMIn3JSWqgcIiWHpuCgfpN+ifmW19XP3bPzs3cd\/+f6b9HPP2Z+55\/TX1\/sOrm45OS1q5pKXMYclbHCr9K9wKEKzRGL+NS9JxJrBI0AdLyUjwNt5Ko3FG1V\/E8jB\/RgcMGsVqFMCW0F6BrlQBq2Tg8Pdze9lMJa1mdnbiJBCeArqXkqVk8SP5VM4SFcUUvTWUfsoLrMNVOC5jvoXRGzVcUKatTB5iKTkkmNFR9bs7ubJolYeannu5SvbpBcFxLbd4qFUfjFfQFSGwyEPpKg4DDW7TONprHavPVojLvovv\/T8Z3\/rMxoshiMtK\/Rde6jnDx8c3Hvf\/aunbxrnRQXRqXJ8PZ7v7L7827cPF0f7sN\/C8d2sSsJoNp2k4bSehWUUF03HRba7h1dO37Q16Pt1BcGiRCxflmk1vSNbqxrAk6OGabnQQsXY4mDjuJYfaRIzAI58GJR6wVA04mjeHnSdwIvNuBP5JMitaUTa5qrdbS+iqCzyoN2CqZFVQz1hA67G5YHmwm4+cCXKwyCxFiwPOEbd+DIXaOkY28NjszjP5mk8iyYH08XhLB5PkvAwS6ZlGbtkjqSPro3THhxOdw6j167N3xo3r8zc1\/eKZ7fjr10Zf+PS\/4+7\/wC2ZUvvOsGdO31uf\/w515vnval65Y1ABiEhNWpsI9AAIqDV2CZ6aEMjRMPQQ8dARE93DwyDUSMI0YSENKharkolqSRVqaqkqnplnr3+Hn\/O9jv9zvn9V577gJiIaaF6YqpY77y8uTNXrvWtz\/y\/71u5MnP65r3xPMZrNhe5s8i98TQZxouc9FRPBul2oVya\/rTYDeRUdLPM3v+h94Ytjwggy\/W2QS15jhNFNK47nUzQ7ihsjU4nv\/BznwC16gXz6A9Rkdlq9RPNAlAoJzsoeB0Bo5+MnMQXP8TwqbCYL2YE5bHe\/0jBKmG7stXaB2mul+uEP8IDrQcDEpQ8UDCPquF9293Zn335zve+euuPvHLne16+\/Sdefv07btyyGmlml15ZeERzXPLgCW2ESmMYnWmiCTFQLoAqtUiIAAjCiMJHk7EeFsozvXJI+bmeTmQg2C9N2K6XpxmwQve6zckRq4kbZuCtFhmfZvvqR83RC43K4AmjYLyw1zhgvY+fFJHwazqboonkJ9TmjwEaMFfA5AV4OpfoAqgkUNAkZaxXrYdhQDUDYOCBrqNleqELeMTvnMBFN7KISwqCCTMu3RaprZxrpbBmcpfK3V6XrrhWbz4sldswkHpOi4FQB+J1lRHIV1Pe9piAUitJtbq6c+Hy5dlC3HFtfd6RwgmGTA3ckxyL8VuqjxYp9oQXYocxdbUlzshDWIRTZsJES2q3tla1ltnR263Rz62d7bW11eHoFPF1u+35Yo49gKQMDuceAD15StA1HA8vPnnt\/R9+n20+TNLrtpETxAwGA0JJQNlM\/oRwFi4TAfAvFVA5ggNRbopUXLea8tOTyd07+\/MFsoE8RKzAAodjRqkiDNKrUoX7xk70yIpRD8fXywA1LelboVd4qe3OfP+XWt1\/0e78aDv6J92V\/zGIxl6TvEj8MQEBpTY5Sv2T1up9aZjJaOEtXCULlUOVFNBhzRNAoDozT9NpiZ0fYC3saHJBrzowhZ5oU+LQdZBJu7RNM3LIpAhIDVI0EQ9qQJJQwJgr9dQGIiV8g3Uo+LFr32p5dzrhzU74es+\/0QleW+mchnBjKTRqOmST4ghE132blIKtSKgHaIZASWCpqSyjMhYlMHJspIZVqxFO6Xl+LQYEQcgP1Cbu1rx6meCAljFFvDW2hyvRrJ\/hpOw\/L4gi0Ci6BzLi2QImdFvtbqcjCFbMqueFGJSogbQ6PjPvOcEmIcNvOr5erWFYadn04JIher5ynGYRtot3vfSQ19uZJ\/NOZ4XU8tVXXwe193bvYt4AMZ4KJwMxUKjHoJsO0kKrQbbh8AQ+QWoUBG+89srP\/NSPHR7eh4B\/+6bM11yB88YH6GkX4tkmMZVe5OfPpoe3v\/hTV9uj9dBCHf2oxTDieDqfZfOJNx235sSfjk2wd29399LV7cFKh7CO4SJuybNJkoS+2VGLVknI40aRTY\/voxQo5eaFq3bQwpmTKpdZ2o2q8ckxCoPmeKHu6MH5KGolc30+dKXfA4vRGeJ8tiSaaAJwDJxjHNIlLUrF9GTXyB1NwC4IBqBCSKw3zOgFIehAnCxyEmBpJQHNDF+rF06B8ossmRbxOD\/ZH06Ho\/l4TNBgW24r6IRum8hzPClGi+pkbr2xN7t1nL16p\/jMjcUnv7j\/8ssHt+6PGpm1HrXbxXLzeNo\/GoFjske8eKaPcWCOBJ04\/0tXLj73wjM40sHKuuv44FVMaGPufkKQdN51u63OJ37hE4cHR2Y9jIMvwbvACjJs+EOSij7jUagMANYT49jLcDgkkgFhqKNAQxmIchJ8HaOuTZQtR8wuTDqzY4Ja82\/9i38I5RBCo7SLl46G33hv+K23Rr\/zxvE33zz88J3T9+xOoQp\/h5Qw1lIPXtXLA42l6YVsOGZgR+ZPCIS7JeahWT1NoRfY63ZhYt4+SSG2jmdz8Ale4fJJxOAG\/hhzpzmMiGqYNBiGuCFNoZ95gmxFZbXfX4miNmFMGEaYO4asRvXQgPyx47kAQZrnhBJcVTLQhh6JlXIiDxMiwBmMWhljnOij\/KbQNd0BZ7pdXq+BMIVRcIqBaTFUlkEKaKCYwHgQnTXMl7uQ6+RAo9frG6dYtdp6sRWyk3TSdDweowydth6Lqy9U7a+ivN0xAUwQSfqHEfnRyuloFhelZv8FZ4RquCaFfFCuOyNKT0vz0IuWEcAD8lexw2iVfAYBO3rTbMjk7WaWZ72en6VlOyTNb80m4831jc3eKopDpNjp9E6OhpPJDEi1ChpfgghJlhhBpDtXL73w3hcbenmalq2B6vI8euzTRiFAdYRH13galCMKWu12BzNDEYEB\/sNyCNoA7uFwfOf27u1be\/N5wjiMZ5O3lAqZPNLcFlPKTFZcyEyMwaAfDwpsIG7Ui5psvXfjb65s\/sHNzb\/YG\/xAO\/orXuevB+2PdIIJ\/i8TfzSLAlDpMnEWrUJR0EsaNP1yvkE1dFhfAGta4zlhjDgNWODq6BayUReSTjMVgsjR6YYXtZuORweOW+kmPIGEqd8krgCM5Z8tPYqveQELH9dfDfvdlmtbFy5tbmx0iaslT\/ARlUVcudZYg5jov96DiCsodW8iW5LAYFiEJRmd5hWpc2oXpYl3lLKY2QFFFZK50XgIPHN7XC\/hYN0uwzSDrfAhQmpNHlUtoM0UzIl4UctwbRsKakEQn83GYwaOFKaLeZpnhERwkXZoGN0ib6vFP09iYgS4ijHgoifjCVKM\/Mh3fXSsHbZDV9+cXO2vkaZJsGgPHZRVkRLsg08+gROxF4mJ7QRgamEVSVIcHxxfPh9ce\/zRrOq1Wt0o6h7tHR0d7VdpMT6dosnKxohxPSeez5ElfmvQ73X7vXkMRXEzcDsrbX14Li9Qx52t\/u2bXxZbTCStna\/JAmW6J9ZYArmtoGUXjC8qZqd7X\/nYQ6sLPXfSWBIjLBu6V5Zl7iIhzXXm6bLhuIRHt+6+cvHyoBN5Fj60oTd\/aDmukghXvgUobzbbWMdsApTMTw\/LKmsUeb+\/YwUbSZ42qjRPy7Veaz49LSqSfs+yG71Ba7XdzVHBSt8XTuMkJFgvik4QdfU1ZHSrQZbZH3S3BmuNpaWPty1JIsAezYShMBm5YgOlwkdo4SFwVCsBiKTpsvphd3PrHZFqkQqRAb45L13LW6bLeBJPTkfDo9OD+weTk3ERJwF63WgGXhCSy2bQ0lzY9vpk+Q23J9\/+2v0\/\/aU7f\/lzt\/\/qF\/e+\/\/X9b2UcTT+rCLWXTbNgm+QRKGi3Wyjz51\/+0he++Pobb96+v3cwnS0U5eayAMWXdnN1sHLzzVu\/+kuf9t1Q9tVo6HtPna4eLNS7+SPXdzA+j1zX9XF6RLfoOQEulSMzwY7J4eGU5DZ1Cy\/OEkwD6AJrEKR5Nhp26AgwrnwN0QNMHG7CIM0\/wiUlG2UzNbk7ds5frcCFlpMJ1khWhDsmPdbVkrdezJqRY3OVngiA31g0Tn9Gxo5FxPEs0VOIBckNQTxGCMTDkNpHEt4RncFiRe4gPhCjdIkMAZzQXULlAxg\/3RSlvlmU5r6jJ356pAMtGNQFYKHK55iryQC2tFQDLqc6bSIDHclKBWcALgwnSKFlhswguEyg5OjbKPRFmpTpdTBUPPtoMr0LurUOiSTCizotICiLU6xGViQlA0+apDrii92EEIISWBMFTidsAzV+FHI80QfwFHZN53oms77WzKtRZItm59+t\/Gau+T8ssl3+bzQuXXlsukhRVtFnXD6IZmRuEkETU5odwbTRB91TUMalzA1VQKVUjaZs14nTWZpmrUivqeHCyWSMh4jT+PR0iEjWVlbkC6xGN2rlWW75yFTxxnSC+qSrl7efeOlJrHr\/kOR+7tp63Ihu0bkwVMA1m83oJTBfoCEz6OrFR3I2gIUZ0BKJahlLrJcVvvLKm4dHp7Xr4loN1eyQU0KnfqBHeic5YlKCK502RTsmOCCrZXRy8b79ShD+aujf74SL7kq2ujXrBk2ffKWpfEur\/MyF4tNZIxTaEWdMU8ahihLGwn5mLIjCWQjHfvgt+w\/0pXMCWSwPqnzyJ9ujUn+la+YAuEZdQbgu0zv7AoRBv0HktdBE0NS1t86tv\/CeJz7425\/\/5m996fLVVWxTj49o+RAWU5x5d+KnuIiSKkwa\/UVzMGt042V\/ljpp2tB3iYpcswXEIVo4zQhgI1IDGLBwftaUU0g5sELJFGrNExaEZa1WBN\/wpqPxWHnegzu+RIQ4dQinJgfJD8Tfcqk7guZJZU36KahXoU36YcBYtWDQdeShlyUuRDOPuq+vuzOaNCTvdyQLGEE\/Bg7aVNDEo683H4AHxHetTkuv7fXxQGixFYQBGEuPTz9yvgq2pnGpz2Q0m4f7R6Cw64BMDnKZz2Y0BSRFod6EQcIBAXQBwqRpPFhf6a70ADugkhHjP17+3K\/FC93l\/RovUKhp40ZFUmW33GlyXzMEremaUyzTAiBrankfmXdzMfcXM4\/kE01My+TWnVvnzq+T48F+2Cg3JlAoacqAhMwJTYlCZzIbo93ZfFrFM6wo6vRWdi7rZR92Y55kWg7ebBQpUaBVVnl\/0AOWZ\/M52ZiMwpgtsgP7Ufc01ZJ+KmxsbmDj+Hj5a02YyaxQHi6plYrMEnDg4rzIicoty5bCyoZxivpGnx8EaB4yxKmixdBLTXIPBsKRAteTkFGcHh4c7O3t7t+7f7x\/oBTcdcwsnLXZ8P5Emv2p0eIDx+OrJ9OHR\/H2LK6Gw\/3xSJ8FMJCBt9VtavNpRGwNJQWIbt68s7t7cPPWvddef3P3\/j70YO\/kygzz5z7681AUBhEqDK0+2X+TUExBDykyNc39MUzBGp4OGan8S6nn9PBGxrCUj8AfFJUfWVEAzoAywZEEDVQ8wCJ2DEwitvpg\/UtNwqVllWtBNc6KBlVZdfwc8LBzEgoYiVGaWGFZAmic1mrDVHPqggH4V9+nwEyMBWsSnmPUgx5gGfvmN2KqFw\/RPvkWdWBZmmFO1FjoheF6hYDuhiBNEaAFwS6guTPIAAD\/9ElEQVShGzapL2UvcBQJeTsc4WKBvx+cuX8T9k0mE1JEVIKf4oyt9aeImIIicap2+xzRTJIQRsEH3WmSAPrNPDEGTu\/is+EOkSeNEE9owiNXLxyEAMhD+7EVROT4brvXhrOMi03geSQ80+ms9jIMhr4ElVrp8jaU35KYANEayG2sb14G51AuAi0jaCkTBSXjBwxqYgwEmca3UR\/Dr+9UwS7jAk1AIGXW\/2HkLQtCR1J57\/T0hEjQj4Iky06GJ4hwLIT1yahm8QJxwntCQQeQsKzu9tqT734mt7PJdEzARkc0bqbBtaKYeGI+n6NPlDDUdC5iQ7vAfb0axHNXVgYkcK6W6VqzaXbn9uHp6QT5QlItv5p+rjKBrmbtBPFEo3oJjeYYzND00VL6OhssnqRR+cK70m3kXavpCwAtEmtcbE5IS2wfVubxxnppAuPQjT0KRlgXmqLQOKXuFNaxT5pCJ5wxxiqr5hTjpQnwkTiB4ePa1EJDn2hSWK\/rJLK6RWwuanU7bbJbe32ji4orYnWXG+fXsiqxvXJ1DdwNkgKhRGlOgmalVXOaVmmDSKh66Hjxe14\/+q6v3Pu2V25\/x6u3v+3N29\/1+v4zB4usAosViilNFxiBcNgAjIUmIEOggMhrUuAbFeEqdkfERoF7YgKSrfRtOhSJnxhYZj5jimkxIq6l0BASdHHSRi7CBxs3jEYAgEb3YGugxzRML4JZtIEGAQUv8HFm6CVH4JuIUUQv1uhgpm8lhEG4MlgBKFEhzmoyKc8n0wkCbrf02dbx7HRjLXzu+afiaiUplp55onVvb29ldZVh60VmZrIqzbN4sSCGoBHj9aq9e7tlVqCQxASO7xEgL2YTTD6J85OTk1df+UI9wK\/hItXTaqiq0UY3Fod7n\/vRLW+368Zkxl7Ybjg+iFpkFtHAdEJYQAaHFac377yBpvUHLc15lbhzHACy1doVcYYYqiQlUso3WOk2mrrz3UiTYnyiiS2nuX7+iuW2ccipvgW6PDdoTUdTybsqo157kYMTepFR2GprJU3T7nR7QPvR8XGtM6srK0SBpyfHwiTbRp04iPLUCoDIUBPwHoKkPboXR3jRxCMB2\/zhvOZJTFhJLGTr\/pxslkILZg5P9+cXVDCTfHAIbSFQHY3Gp7uHo\/sH44OTxTy9W2aNRWoL2c0iCjFTrqOZysGWTcBBj+oCoZoLWOrr2+xj+KJKztgtyubxyZCfwFY7bH\/u17742itvgmoQhLOkTTRcSXFuXJeIWuLgtAhGxqVbJ3SI6PAznNW9cX1TAFtxhGOadS\/08niBBVgFism38U+hrwDDRkQvtukfUa8dY23af73t\/\/pa71Obg89urHxmc+Vz693PrXVTy3bKhotUy8rB9VdCMEFdw07M3KdZ+aN3OdPKVIv7aEvIRssME9IMiOlesOsRhacCWI6YV4zQK9IUguvjDhzT\/X7UAEHrKoUtsuh2K6JREB\/epmUOJjA4EI\/x1ZUpQsVK730yrNa6YzhJ+1ILmjJ3Veut0N5qTOZzsoV6VQFuBQ6ITWiz4zA4muIqtc1fnsMtiNSyLTlDqR9FgMAocIXsNBseMZmZmqKLbr9LasSgIIwUhTgVQCcaIqiFpK++vN0xgXTCFBMtbm5ebHUHp6OpCY8UPtfMZWQwSOGT7rLoIOJh11yPPil9l38VL+ugCd0BxRuz2TwMvJWeXsEdBj7uX1bhOaSMw+EQOcHrNNF7qk8OT72mN5ycXHv66vPvfwFfW6R5FLY8P6A3HIyZZCtPTk6J3OkC4aF94+mYbu2mblNNp5PZTB\/NQ4o4GJiexOWXv\/zmeBIHYYcMHkFCFMWohUJCdFiWghcxhX2Os2M4ookEKnNQR4ic0SiS+JRQUXcLz82SR6bz6\/H0w9P0jx3P3r0gTQXcFPBS0Gv+ZAbGe9Ns3RE7FHEbIK5DYBAtl4Opw3iOGOuhmJDCJQJTRKQ3FuKWtZQGnIK\/MkSUkn90WhO8bqfbXlnpwHbGwJkLF7e8UOiAgg9PZ\/PEPZ7g2ZpHk8XucH48LQ4n+e68cTBr9IfZiwej9+6evu\/u6fvujD98e\/7e3em1OVfCED1do\/tGjRyeofENOiMHUmQF3+Sy9ccv4koTF8IBOMYAhFOz+XSuBwXhpigxbyqkcJbBchGiZ1\/sNvf+KTBEab1WIQWdINKnpQGiLBfzdf8XPDd3QDSbrUe+wO400wMttrltPJ3NiC0UQ+jPhWnkJWAo2R7Iig6gq2iH9Fnm3piMRtPZYjwdPff4xsr5a7f347DVof3xaLK7u4saHezv81d7HWmJCRmBAgxEj7Iq+9GrIILIx9lgAfyPoukOYhR+5UufK4uzd8SKX1+LRQKWADCobHH7zTfW\/Wq1vWy4Ta\/dWrpNIqTFwppP7OnEXsQl\/ifNizv37q6tR6trfpbOkCE2j\/iMLuvNkmpTDUstykYVtbwgbGKqVpnFp\/v4WDK71fXz5TIAZcmB5\/PZoNXM0wXqg0fYPr8Tdts1wg56fULE9bV1x3OPT06UFJrlJsDr3v4uGmJiArm6twoqhJBMxFnhyFFKlAOhQx9XoZOQRp26MtYGCtWXSCerCqWhSaIQckHGYTyIHKiH88EyHY92SfrT4WK0SKRAFLXNSZeYoxl11+w2iEjHehwTtccuBCxsmngyxQu6DelqoSFQwsBQl6Y9PBn\/3M\/+PEZPjjye6F3sxkY0C6Jr1QWdydYojE6mkCdwMvQDzbOYxFfmg6OyLBTemKQJiQy4YxE0oYt170BNCbAFIpI9Y4D5MEHzvgyzDH\/k0tZff3bnbz178W++ePFvvXDxbz5\/\/h8\/0kpghFm8qyzQkCWz11QCAZA+YCDJV02FZDhDrZSCt4C8cmusD7yFdWgGGAk7ifIJ0+sb7SaeWWAi1IQgmIKUOSUrM997pGSaj9MTa7l5\/hDeBp5PLwxGL0037xWgPoySlZq3p6sp8yp0WiNE2Fhf7\/ZagJfmpIEwvbhJOMxZCIU8FIJxnWGDgBp0rcAieCqdaTTAHBSDUEarCsAlo0i0D+aDZdQW2b0OHIUGihTPzIgYerScHN4gcwa+trbOhV99ebtjAlOMAWvT7g36azt6HFF6hZaU5pa2tMc4Bs04izPyXnIHcJ9TtQzkGmoDMk5IqtkkucxhfieSZwU\/zfLRLvaXZ8Vqb4B7Pzo98V1vNJw4TT1p9tBT1y8\/eTluzPUCNTJZc69arltQQNRsOGoCAsI0AguOogrIfjqdcRaaPT3uShCX3b1z+OUvvzEaTm0LN4AcdU\/QyLuJ3iA5pMiWI\/XsE8PnVF3ED\/MMAh2xI0fYyImu51U1X5YX0+wvDE\/\/5uj0v5se\/43x5K+fjv7awb3vnJ7GS1FLoWWAitbZpzX5IfP6CzQDGlSjXjZfN47emCCXLuGl+uKoCv8u9RiwbvRrukXHNG2oENZgHGSqcC0\/if6tZkGqw1VZnmxsrm1tb+BFAUz88hQldvxrjz\/++NMPb5xfa4ROahV5szFfOsMpDAS8pAGMnPC41oiGPioPkcvCzlOQQJLVjBdCZRdgkbhxk5Wm9I3oLWAFZoK7tQb4YWC7kKb3KiK36XymqRfdO9RjzWTeVLOJ1RwXGFI9RgFnlFOVAq1y6dpuK4gGnX6PbD5sh34Y+SG90ABCs0BoD6+gTCiI9B51oZLuG0idSSuTLEFrFSK4Og61iB4QSRZJnurdxgCQI0dQRaH94fc\/c+swvbt7iDuHw0fHR+Rl7ACvvqeHu7AJ0qBer0+coZQCoUq+Wi\/pt1wvcos8JdIkfIEVMIQgePfunRuvfwleGlZ9bRZkbW6zCz3d\/rlHks5jDafbCv1GAwQezWfpbOIMRxWRXcP28qrcPby1fa67stoGpNFaS6+csMm5YT4SYV+tEhuhrVp+pEih3wvHE33FfzHct7IF6eTa+lbU215axHb6fsRKzyuyaS1u27e3zm9BzNra6mI+397aBpRxGLSKSaKCi3gxHA2xWZJpdKYoCrQHIcptmHsHFI4DG2zRJeNIoUioVtfnWgo76Juw4MFknuobw4RoVCsK9cWkKGqDHrDJWaIABa6Ea0krx1X1693ws732P+1G\/7fI\/9vt9t\/odn54WUySGGNqFlpZAT2e7XXQ3npOm7zB5NC0QKeuo\/c3Q0c7av3qr3x2fDpzHc0\/QlqS6nnrQq8g1c0OqKcwFhBVdFqKZoR1ZuEevaCQDBL7aRFDe54m0jROrtBT\/hwXYBOaSzJCjNrbaaSmwDETsZuwQLzKAG7krQeOJUkq2GXp6QXwKLy+Gw8qIXlZvhYeYvhQZdJENuSO9VJB+oF84vUS\/YKpll73S5qnGwyl0vdaWAyhFgoDqbcUkVpVeA12dI+YDLuj6IFT2B1WTPi5zElRlKrpZddmTpf2aQ0OsKUy13KcQdG+LlQugYgbragdhW0kGwT6lgX5v8avsFgzDVqbmeo7SVBIu4pjLKU6mqixGkG7RfIJOtW6RKcamBErDCXMCaJIjgv9zwvCFJSTsKjX1VuTQD\/COZADXeUSyPvqy9vTyv9XQR20Ch2veOWhJ07HenUYQ63NCdEgLo3XuAo0WcKW8aAPpoLUCwVjxygBWAteOla31ylI5Ip80I\/SOPVdu9vtzMazEAtz\/KPTU93CDKK4rGdlFxsXNy4+fp2f6FrXfFha+Z\/eYa58HWEhANoniUTGgHsYRXhZ9jmFeUEwfUPRwf7RzRt333jjzuHhCeoJzxT5c6WxGQpXyUN7Mid+yr8a\/WOf4ZCLG21WYEjjbGXDhLoMk3paa57\/nvH0XePRs5Pxi+PRxcW0NlvlWw8CTKICthSuoNAj+zQFAVDueopqMZ66Cums6VzMq50H3Rk1JhQqwFgv8EwsgQoiCHgvZyTj1p8YT7YaRbYelwM38hLmb2ytg17Qg3udTBex5Y0K9+K18y+964kPfujFd3\/gxZfe+8xjT1zd3CAjdwAerMvgJvQr1UUTZmn55iQ5WpTAILZZNoKy6dL9Uu8wxYeQHkKnIgX9J\/lLQwivwGIYBxAkJjAGT8zIFErbnotR6TZelpIeUQ0LxFi5HgyDMYZLeou07tXZ+qyl1maTcEhHK4UEfuAqwHIDzJ40SPIRiGBjGD8CxQg5Au\/M3BJJoWYU+QnDxUETs4tpNceJ2MAEq\/HcY5cuP\/zo0TjX6kTXIRs5OR2iJlT+3Oc+hyUQRqopk2VyFXrvQ4GZci4bS6flNdwGYIxzpRu76WqFQ6JvyL3+6pcgUorxNVrMOjL+0Tvs3WZh7Y2dG0fN42ExneXzSTojGpjb86REpwl27ty7vb7VXd\/saqTmRj5xOAKp2yI+Qz91A6DUcyUohSDYaq7026BIWhCNTfI5ht+0Xa+3fTGvNLFAHu9a2SAiNvTI0Gfz+drm+trqYDKZwGJERgKATJEFEoPrqBr2hX9nI97a9Gjs1JgbnWoHfnPWTFYUIAzeWH+K\/mkEPaE1rBv1q5ewcAk\/pRJGSWwiYnMnsW6Tyl4nCrsdLwgbBbH\/0rYaM8v5a033L\/rtvxGt\/fedtb8SRX\/bb\/3isnk0G6FgeiOSlsGQh1ZZnLlN78yQzBpbkW1pwhzCGePNG7de\/vUvhz4hCGDguORJvj7\/z5ggWOAiKoSumjBgZOabT+SatMbI4QMaDv1rq2tkwxgCgQ6N64aXnlzgUs1Y4CRNWG\/EQjPwh9wOGt9CH1MEA1pQ6JSWi9kgUOrngA9923rqgKrSGUv3EQ23aaFBsEjqT\/QGLJOVERZgPXopUBAyJi6Fq1DIGORNHpiSBgeo6QafbuFwykwwS+jsI4npfA41yIhrcfXQBnaDBfhzzhZVqZXfjk2uCSVchdXTZC1NpEaIAJcgGBUixhqPx3gk4jAAyCA1f1r6QCBFgRd0zmEKKgAI0BShFYGBkAT+6AU5Ph3RGBBcZ8Vm\/PKAeCk\/IHZpufC+0fQcrZFCEDhBIou5Hlws5WzQXC0AaxIR1gw3OC7f8psrv3UxgSFM92k6xGqJQkvNyMEUHTXCYzCgNqPB4RumIzXAG44wPJMPmniJymecwkmWhHtW4DdBcjTv8OBgrK+YNNM8HXQpukdIxjZbzB965uEXP\/yOZui2os5aZw05z5GFXm2tZA6p1M0SENSUEHkj8jRJ9CTqbA7xKAEEHB4cvfbajS998ZX9fQICdEjTbbIluTFFslgR9kMjmiQ00CAfbQo0Uw+1QClpzRQNH5ssUZ3KjqzKtxtTx5kKRUHFmmn6fysr1rOcDBqSwBmuhBfQyal6S9FB0nZj2XXvBAeYbprmtCGWkuto8QZWS65PEYd7Wnyst5RDM8fZKDN+YMH1P5h9O8KByfVQ59r1K6CrFhI27NGIvLVzNA33R6CM04q8nZ3NC+d3nn7i8Xc8\/9wH3vfih7\/p\/d67n\/3kkxd+4frlnzq\/9f\/e6P\/46vpHovAzS3c4tveP8jtHxa3D7O7B7HicztKCiFqrKmQhslt4AxsELiIbZZDvh6ViIwXrWFZE2vAEPhCGmzkZvVKCOtRk1DTCWUTMljEzNPTILN+DRW4N4UlezBZxQoKephxw4R1aqFkRPTtUc+MBvCsCUG4EJuqdhpqQgJn0kpkHhbF2KAEC1tf0tpJ2r+c2ymcfOW91NxDy1sYKvR8cHqbm\/fPtFtmwQhbGKaoYmjDI0YsT0hSg0bqGsugMOkA02QwIqpdmhS2UAwh2LOfNN149Ptw3UvraLJKelNmYv5eefPQjP\/xPPvKZH\/7oG5\/+yigp+mnix4uM88WyevPWKysb7fX11ZIUEiyVVeFwlCYiR1QAA1RTslQT3VY4AC1E7XXbrtMcTadE3NPjPQSQVeXGpWs5LkYwUi7TRcuxknmMNgkcVgcYCSKg1UMs+eSYthQfQ4a5MUwHnW6XC+mVrWZ9jRugIKC6ggmptZAF4WEYtrypBlmbDHLTP0Zz0GG0kUvUVK63o+KozEmhgcgjaQGMkgTcd33PITAJSI3sN+3Wl5vuuKpantth\/FAM7heNBQHxUroHZNoBnimk88l4vL+\/T6jhNPV5PWJabBplsi3nZ3\/qo8QNUIeKmml1ZQAMGUWt1ZVR66etaQ9ybPw\/5BnfKWiDQuXfntfr9\/BhmBWjoHfQg9PS16alp\/PEGXMnVFgEu4zZ0i4QJugTcwyG6+tGYVFtJEUnT6M8aWVJN856ac7YFnYJ+BGU1KyjfUFsg0QBPIDJlu7RL\/UqQHww0Qn2CD1QgPgYGr0bO9c0AMfpDpcM\/SAhQ8Dk6b5mOEOo1yRRHzGzxaMbEokaZ5PZlOgGV4TqOYEWuOjVVQZ2YBdXYZt6N5qBYmjgFO3DVThGTWPRCh1QEv7DXSFdLoSHeIQ6jIBqftZ6A\/9NKeEwKi2NkqqrcJXRdqXEoAO5JinobDrN4gRqolaIn0NwAD4cozLWRo8IFbWoW6g5\/5suvxXfQEKoUiz9w7\/N5uc\/83OdwF7ptUjgmpYjwNAdO1hkPvuGPpF1GTcAW3BrHIRbKCpD1iIQ6bDmEpbLeHi0CKM+sf6d\/fn946FPQNdto7We32y3OsPRZDZfZEX6+LuefPc3vBtFo1miX\/im19ZQLLtl1o1LzOaNxRJgkeEwwFvdWkZ7jNkjJ66FjJOT6e1bB4dHaI+RmT6GlGimSusYNMmskBtCtTIFTUA1+E8t0AVF8a1kLHXnGslQq2GNzMAva5lYZS8r\/+B80bZKUt3Ec2PArmkftcJPus4p1qzvCikc5Bp0jkbOmqo7VXwgFQAXZE4cbDSuXtpeX3ErUnWr4ZDid8MkXkyPF3q\/imWHWhxtE5RopgTltvWtSNCCMJ0GHLexdW7FIuwez8E2L3TW1rsXrl7Iqwylnk0JUbNJGd4dh3nDawVE8G6SE3SXkR7Z81cG\/d5gUF3eGD\/zyL0rV758ce3Ow5dvXbnw6b7\/mj4c4OaodlZNc32AdRoXcWFP4ypbOgl2ZJ4LZVQQU2iUziLJ946GWAdcZGjAKP+Izw\/etSLo0WwNCamWHCI72Sg5gr7jqGo1xxT6EBVlmZnC9cSwGiL1+nTdHdEErGXF5jVEJvCQ+OAwBRcjnNWaC3NLSxFL03RLI\/wuXFtvv6I9kDoIWnmRrbbTb\/sdz9lrj7h+6\/FHHk+Wjdu3buSLdP\/w+OGHHrr5lVcP7++SH8zTxF5ag24vLbPpYm75bs9rL\/PKjZqXH7kctjt6f1EaR6EeIkdFCUOCwJ\/NphjO1euP4SCN5PmHYjZfG0USqjeNaqXf\/dQvf+rjH3957yj\/0s3TKGr1w1DPrDWdN269srYebm119Vw6tibmLnUhIKdZEEW7MFmTR+i8mRySKaEiRN52M1mUo+lipdt1bLe1fQFhwPy7r37OKkZF3mwHth\/27xwu2mt9MjnLacSnC4VwmCsho15lrXfpIwWaxeH2O6CKN1\/Eo+nMqAuUKPlioydFXJIzAJyDWkILTYCXfhsfqANGzdAZKNQIGDvqZ+xcPsAISbpCfZNh11yiSawPAjjNWR2u8iVxFB6QEIRrytJPYr18p9PCBXJRs+FmybyeyCR4PNw7ODk83b27OxvPaATnura6cffW3ud\/\/cuhp0U28jC2Piq4sr66srFmpjlkCL7vtTsEnc10nty\/uUcFAoLE3C+AD+DYZDIldRCVFcGoDa8OTobzpNAT4fromr5y1+3qKQzN9CmtlRCRAhcY29EJFXiE1S2d\/+TW\/u+\/efDBveGHdk\/Y\/rbd8fVZ\/DIxh+NyAfJ3K9JcnCskW2nVWCAhS6vutXJzWY2PT0AOExHCVzGTwll4DGc4BmsQK+BPHfJ5MJNoSaRVVuiHDpgHfkEJ+ScUEihoDaMCHQJ\/\/C4BB0TgJcyDGHID4AAV8OgACxEAhX45YhyHua9vRggu6HUJ+iSBgg+kCYaRNvCzhhHqqAXFK4q6FGXYeppRnsDzV\/orJ4fHcM1AnzIwxTu2XtOE4rcHXa8dmBsVBA2OZVtr672Hr11m6Bwj\/YVYWC4RLxuPPfzExvoWVEm5\/vX237n8lnwX8QE1MuMwjF774q80y8X2ep8xQH+FYWl9IeYAH5Fuzgh1YwVBNXVXSQLDfgq9NhKLkgWiVJprXI5O46rhDvr9m3ujo9G022rhqcnZZos5hrMYz7Iqv\/rsIx\/4hve5jgQjkWghqOhBFsb320R8iAbfwFm27NU5NMKrHUEty8U8vn9\/f3f3+GD\/VI\/ZGXnTDlXRRZG0VBYudTQFGbEvT2NaYYvK0BD7XEWbDIxAkX1+e5anD3+wb1WtsjhXRh8LrI+GrU8H3r8KW\/9Tr\/cTYTjEPUKMubdCqRWOHhSzm2lJ2YbJZqRPuq1FKQC4yxc2Lu10lmWGmfpOc72nFzFNjhfYAzahUKfEfsTzVhSgoyU4pVRATo5m1rcHge9kYyUnq+v9y1cvmLeOkvIQE0yShvPafmMYLwEUjRdbrBpBqAVxYJ5e25SkuW81u53Ka0Wbg3B7pXtxvbfVH+ys91e7G9srrU5IrKQX8pCLFziDhpYYltU0rSZJtciXi5ggXY9jEp7vD+dAAmwidoMJYBoMRYXgLT8ZsMzRPPGBEDN9FlbZPPVlZDI7zdwoeFJ5K6fRrTtZnVFRGhLuWI2opdfXcIkYKaVEDRXeITiifc3Q6oAWGRmgQ1PJ+fhp9zrBeHyySBe6hWE7zz8R\/bZv+dBpOmi12utb549OT+7euWNX1nA6vn7t6hd+9bNH+\/tg0CKLu2Gr1+2NpuPJYt7udVZavel4vLI9GGyvMD7COmTV7XRTvclECoxO4Q+SNLt27eEgasnV1P99zRWRhG66QbuxtN64cf\/Nm3vTWUxM+ui1a\/D8zZuvtrvuzs5qmcfUAx2RhKRrrAkhwWhhnYP7MZMGuhFdG6ZsE6FheYcHpyuD9SLPWtuXKq2sjw5uvz49vhU4vms3ANy9URwMVoHkhr1coM\/zVOGjq5fPBGB9WbY7bcSKbRtvZqdFfjqZomLInq40h6ON3pE605ev5VVqrRAN5lE0ggGRKqCiaDEsRCIpSNZMu9EYnUEVzcyBok\/jJFRbHkhv6KNNegGJHLLnOL5m5dfy+FK5fNGy\/wjRTzPba3fchkMqkpNHEFkoTjXLtm1Xc2aLZDgcHR0e7u7ujsfTWzduE\/NILRRsKDoh9emvDtZ3NqXTSmeXwB1hQbfjp\/Ps4O4BNgA95ME0CYM1M5ZlrU5LUGm7eiVAUQ7n9JT75pHmvCyiyO+1WwwGCCefUExQ3\/pRvyY1kQKosAOs\/67do8dG8SAtB2nBtpdh9M2Pba2T7MvZOvi8hnIm8+jBPC\/HcVqZuxToBM3PRpNCL\/+Ry2QI4iT+wMAgWwZb64l+lvqw0ANtkmtHRgwKgWK5mDOHaRaZKuEyX09FnxTrawGTorwkieVlKy0dSIgATHfUpDnJ0bwCmYOansj1+kX2QRgAip9UMKiie+Lsc6FJQvQJViggM4G1cIhT+J1Wt4M2nZoP+UKSBoVWmIfkERl1uqt9sj3fdufT2A\/Csso7vdbVy+eBukUcz2dz4NZ4HH1Y9YlHntzaOkc7D8pvEhZ+i2KCt4qFtd9+4wvHu7e2N\/oIXfKQ0xe52A4evdS8rF4RD590gWE6B1ERDBjpIQkFC0Bzo4rnxXgar6yunk6zo+F8MhqjxLhoz9Usa7ZMrj790PPvf0eaJvPpBJ7A1roFWkZIaHYc4xpV2jitsw9i4lcAq3o+TYJHJ5Iknc\/Smzd279095LA8mKg2iYsW6Cn7p3UzChUOStimQn1QYzHZpFTWtIuwpbsGJ0hcQk+3Rt1mkDecj4XeJ8Lwc473Bdf7SuQfOc6sqednlL4qKz0rdftq0Ewx0RPNctCAJO4j15Rsnl27vHX5XA96lNc0ys2VoMjLk4OxapJf6AG8JmgG+a5ef1IBe8TaWVpWWsu03NhaCX2POAsfev2Rq64vMEJhp6MpSPOF2\/ObhwqALPhdyW3LjwLelm2W+xHqWDuTdKXhTrpemS9IxBzLDXx30G51VwcXL1+4emX74s5W0G4jc0BHaKwVVA1CGAAyTos016PJDCzOy3lWKnAmZk\/1ERHqQq0Q3KiQiekLZIdBiq\/Gl9TnYBQ7QgrDICSiiNCyNc9mplJpDcqpph0zx+CZ9QecogJFHFYakaIhmblVQdhhrF3TBigeSlAW2aAbtPUt8xbiABpWO8F\/\/O2PbVx77njY2Dp33gmiO7dv19ZLxDDoDT77y59MF3oBMjDVNg\/CaJllo1rfWG85\/iyerV9YD7vEH2ROCAg1ww\/p5ggU0i+dQysO7\/yFq2JBzYivuaJIS6ZQLa898ti3fNs3v\/COl6pkNDq8u7m5Pjy+F3bKrc0VkgREQTU8r3RdL82E5Zr5wdwEdmaBIdaDbCVTIIABa0UcYmoc75\/4Qc9uFH5\/0+1vYSj5Yn569w2n0puzB71w\/3RSeD3cGKqepXk8nPmOM5lOcc80hleIglAuyG4C2Rwcjicp3tqsUKMFogz603s3jH\/RQQiRLVTYEZKA9wSLJm+BNNBAnkN6iNaZQn1EpoNmeo+C0GtXhDqhQhyv9Y32s6J8wWn8JWv6n8bpH07T78rib83idyyLzzetT5NXOkHTa1aulSYoXQoMkNHSFo3AaM2BaQak0uNXZLeKL\/CFDYAM3c+zdGVjdWNnS3mASTGTOLUda6XfTuYJMQEpMy0EWlYb4eqgB0DBXgALTiRxDFiM5nM9Awxiy84aK4N+K3DNHA\/9aJUPPDBy4zdjEk8YJv8LEBvNDxwtzsUJ0RPShllI8yjwf+Z8O9NjnUIws2qX4EEYFOdLwgKYrEX8jKos8YGagaE\/GjWZgDHQMwSG00AQ41JXBhVzqNQaHZ+MIoFlsKtaxmlsRAN5mvAnLjRfswkhr\/6gA73RGs3SAgfRMY3qgYUhccENSb9ZhgkOEFAizVS3FzVjwREhksBEN6HqwkGYIHwx0UPdPnWIq9q93mg00vSn8SBURs9qOAKa\/ChsD7oaXblMFkmrq6+tdjrhY49c1xo1kWWsRUvsNd\/93DMvbGxs\/xsE\/yaBQTz9LSoi2lAVdddGM2RqvmVClyipIFr81syQPBz84F+tSmRIdSxPjTqqlVOUlKVbfuDoRcWNqttyksW8snTrKE1JNZajyen2w+efeulp4cLwZJGfrRigQepwOZ6ePuA4UV6nR+4lSaAT5GG9Xi9qRf1BfzBYgTzUJk+Xe\/snd+8e5lrHo7V4bxWuohEah07loObmHCrCjkZrhpAmiR5bElJIZfmHMUMNg4Ak8J3ANSsLi4gwsMrAsdq2g3aFwdILCuxvWZFp255r5iegWkXtGL2hI\/hT70OJGGVAh\/7NQQWbCr7EfOoqj5decgok1TpZ5V9gCeGBXkJIyqW7p8TowC6sNSAIC5rlhYtbUScgIAAl5zN8Y74\/s3cnAcbRjlq2FxDMkkiZ+2q65YZtYIqdw\/0rP\/gjD\/29H3r8Z3\/hsbsnG5MCumkC\/wsI0zCkeqG9vtpf7fcCAY\/CBoXgDWoW6EZl+6NkeXe4OIrz7qDXXxm02q3BSp8tGaAiLIBpWerDNuQoOGYa1VdqCDw8NAyoFnyUjEuWSXi30ONGmJlmC+vUrY4GGDyeAJYhEQo79Sl0g\/xAktLqEA\/hUtnArqaLQEm6I0oo0jL0\/He8+Oj5nXY3sjqhPRmOdzb8Z557bprgbgK\/1UFz4wXuvzlbzJVILZenR8cgNazvtNp4IAFnodufi\/kcQt3AjrotusPQRyenYdiCqYiXuFlU6YXzzWWR337ztTybP7B6EV7vfU0VyUGp3rLX63\/4t73\/u\/\/wf3TpWvfW\/dd7g+b2TlffMkBIQKVyBRI+BW5cg6kRI\/GnGT5psQzHaLamCjgHaPAriLx+vzWejF27EZ8coOVIe\/PSw7bfR4UTMukq3+z5i+msWlqIoN3vOZ5Hymv4KXbB83g+R29n0xlGhHxNqK+XpcJQvKMx95KDcvzGrnODUbbjWY6+l42FYopyLl7oaokxqSHjBa+gswInXCWsSiboDuBGgjSuxUwmwlgsFvWpekvu7+flt8waO3EjyKooq8KsaCSZV2CZduGj2lZArpQoNxWO6IO\/utulKTQaTPUIg6JgwmMtsyOZzIEH2q6hA4cHj+EjY0TbMTQYLmWWVi\/zNFtbWSWWgBqYXiMbp9CxBSlWEmvgOHwTiNd+Xj\/UrNBDuHFWdErF7BjnSqyvV0HxE2zVYlJhk+y8uczI0PXa6spZWjBZryqpuUeewJWoBwiDdpd56TluFIIBSHIQhgTN8glskQBKIojVDXs\/jFqMGlsnlJgnc7ju+q44ols3emYB+mEIkiU0L\/S6Sd1r0O0G28YwyVJwsPSMbxfBJtcHP4FcbJ+fjDAxbyyAwXqgwLzuDCwN9UQAHJIa1zAiERgpS0AP5izZ0gikUh\/VQILooZG\/CjuyCK63GkEr4hoi13gWg9hEqHTqmW\/649U822mF4erqytr6Glv40jLr6GuxfDXltzAmeKtcf\/SZonIWiW5IM+ba0xMMYBWcNZNwJgvXWBUyM3IMySiXfJ1hEWE7pwkliY\/kAHy7LNIYWZ0Oh5JKI7\/01EOPP\/9UkeobHuYJAn0WAo7TFWZ\/cnJq3gudSLTmPUX0hTODBiQ3m4EUqWTmkb72qsq9c2efP9vcgJdCmDcRcElNO\/ABWYgW2vhJg\/VxdhgR5GK+DAgCINsc1ef5KexKISwrsjxgx7U948QAmKatb296S0JvG2QJmw4pQeVhKliJTE8qqAbN\/BVHIEY7phfTt\/5XTS2Ow\/wxxtpMqaDadE4FhWFipmbbINRYlZ6C1XW6rS7uKjJvLFfX+tvnN\/B72Fqa5ohvWrRe2yusoN1tw7lWCaFB0O50YI9Z\/RPDKT9sPfTlw0e\/fPvRz7\/x0j\/+ySf+lx964v\/1z9\/zL3\/+\/I1dtxt4kJoVsxQanPFwfLC3X5u6Z7t6eMR89RwSsEfIY3hkeDlxR4mJLrWI3HcI3czDPm7UDs1bAYiARDLjRChcTAjPmKRPCsYronG0QzugZCoGUpXxYdWj8ZjxIxQYByfZclYhQs3PspzNZgAEFdBJgB8eMkAs0wCrwnlBTDJBX37P7\/vgH\/xD7\/+Ob3\/0Ay9tPv7YeultJrE92Fgn7ipz3SClPiyW7zDLkXDuUI5JI4up3oGhyQyCyOOTIzfymq4NcgBRRBVcBQEGMsA+vUuHEMdpWqPh0e69N6UGRuL8fc0UKBK5+gch6l+BO2Xz\/EW0+sL5ja3tdSAamXJSN2EwduX9+DiHfwTvS73NisvKQrdyaAnXi2+WJaHD8jNCgd6gNV+M8QrlbOQUCYda\/TUr6CmRbzTA637olHO9ChfZylocfZCCdjAlQDxeLGb8TWdQYALFMgx9LjUwbe7pGouGMI2ntqdlw7zPTK8K1o0FrJbLOKp7d4R8xMlBEEZaMeiZV1boSRbGBMJxSqtcqV9ZDfIBBdDmWUfkyz9oBVn4CFciDDF\/GoRA8SHL7SXYDT5NXk1LffFqGL5Iwqj1NHyv2yXg5oeNYpnPvlOHTNRMtKh7BmKySeEQo2F0FAVepZ6\/gBiAEWMS1HLQvCuMcJj+gU3yB+gHYQQ4tAbvzNo9EEMOXFPlhlYVxRw1wzggINcYKrts\/uRm5x9eX\/nB61v\/6PrOP76+\/g+v9v+3Cy29SLYkTtDqxMyCC0CTAgJMsem4SA3uwglJp8BqCKcYAkOhX\/KxSH7WdtNETyNx0HU8qgtBmnpQi3MG3s4+bcqgoAZbhiSYk6XZIk1RgOlsNplOMEM9fgkH6U33VihCBobBhahE7do5yk+YB9N01wl+mH3y\/lqUjJY\/F4gKiDMUAdAK7CWkV5N6Ksp87ck8UgFm0iJZncFyM4Ok2UfpORxu9zoiNdWjzvAZbYIxvi8Agdv80epikcxnDGHKeOlOTK95\/1WU3+p7ByqM+Euf+5W2Xwx6rUp+qw5EsFLdqVVaDuu1GgR5ae5I3ldhmtRX4UKD7AEbIJiq4NrJ4RRx9Pvd1++cztMlgRnp1WPPPXrliYe5Chxveg7Zm7hvCq0hUc1RVxXRJWKgXVRF+agivjN1oWtkiO7t7x3eu3N469ZeXlRISOm6eQW4KP63\/THXcW1tAFzO1hzUAwJ6vsXUR6uogJKhE\/W+QRZpuG37EI+TZPTY\/IvzyWPz+RPx\/Fum8z80WXzbbJQ0G2+APkYF8SU0XjdYtywy3joCPVJGmSMafe3S9qUdva8Q0\/Ida3MQ5cVy99YB48SLG\/sVcJSoI7SZaUNaylNybq3UW1nvd\/rh9loXDpFZ4GeHw3HccG+feEdTZ6nPMCxnixiptWQVet8DLdD4Is1bSfLYz\/7q+ZOhHt1vNLpJvn4yDt+4fbzau39uQy8LLkiavaODkzu375+ejBmZ0xT00I8GpvVURP0MWdPmJH\/oC5EUw4R18FYMl\/WYmSbsShBcf9lMH30WOoOmoC6IYJYTUosLpVcKzAyvTHR1Ji+JQ2EBCMipt3qhOdm5CfZpHBXirOJLejdzM1RAi8THpsNAbr65\/\/orrz\/xeP+hS2udXnf14jMEfGvb59ymM57He4f78Go+X3hh0MiLT\/zMx4AefdGkXOI\/NDZEYVvbm1uLyWz94npn0CVHK+IZKREwTo8ABaGA7xPO6pkxAwrlaDIKopbrBjAEdhjv+7VazMR\/u7t6tH97tHtnZ3NlCfoviXWchlZOwWMGgTI2tCak\/vyjfI4SVkwLG9SKPWRA9KY71QofKtlOfrB32u1uIMbu6lbT7xI2nty\/NTm9AajQdK\/fe3P3KOytW3blNZ3ZeEIkijMgqQJGJ3qdedUfqGjFhtUgZ5zM5wgVzUDrEDT6pzwVrwBl2G9TT6mheKLAQDktoDP1PhqGBtIOymcWIEtV+b8ei3bMy0+pjNai53VWiQKgVzKfZblVJN+Nk2xUwBaQd+q4X\/K9X\/O9lxlsEMgaMFucylLfGJbOa36VLjXfwk8skTBa+vkApvSkDMpX5Csba92VLvqMixIhjSaReK8d2Mvm\/r0D0GlzQ6sNiJPiJMaquESPXModZgRBcZqNZzNiYmOKCvJ67VboOZaEyJCAHvhgBClgp4LSDVGGWpqo6G4YvDzovry2+vJK9MWB98VOeLvtL4no9ekTUFQvJajNC5OfwG6iGYVGcsz6OJluELvwlp\/GqBm4MR3Df4kA3+x5MEOD03FV4Dj1+QVPKPAE58xxMz8Nz\/RMCv+AAFTT20td\/LGZ84ByxqWWqKs7hrWgaQpUqXGAfY4AHQIT85Yk2oHpWoRucr8zqsyTaOygx8RWNBgT\/ACCYTCdTNBqX9GPXIMQXZase5ShmQ\/xbSfDY81jThEixHl88dK5lW4bzcmXZZqkc32VSu9fofpL73x34LcYuaGWcvbPv2up3fNvbemvbfqtzvHJKVoLa2Cl4FnBnxIgw9laBop9GAcMgunapSYiMkIyvyxyxF6nQyKLHhFhzeaLyWT6+LNPbF7ZSSZjgjUvCrGzRK\/kPBMJLAXNUQi4ViuH57lRGLHDcRwiwQdWiVxRnsOD47t3dt98826W1tNES3JTyDOKpRnmMAwVQZsnm2mNAoVs+SlSjf4xZJRDFqFTGqB0xUQMpj6jA1xwrlVeVkneSJfFzjL+y9OTvzo6\/W9Oxt83Pv728f7vGI+up8sUH4lDMD5Jemaf3VWh0BoHaZk2a+BBaSEEXs0mc4KA2kmodxBEzGAcpM4W\/OBqxUmzGJXOMYt57Cn41zdNDJGaJERWpV5I0JxM5lnZGKXOadwgqHIwXj0ti5u1ScVAVvQSsOBSMiEny2d9a+g1ioaSe+BB3Ajs8YXN8Sl58HA6H02OD+7v3r+3f0jqg7uGQ4wt0wcLATsYWOhBVHDNcenGA5DMNKYRnJ4O0jhqDktJVMQiRAJGabo+CrttBgC7qUcdsJPLuYpqJoQIqctBWoM54l6zOV\/MqUlkM5lNkyxFY+ZJbGD8rNCLYaBi81qjqE8Ckzesk0n1C7\/0pRs3dz3bLZLMxSzxCJ3Q9wIAeTobx4s5FMRp0u31Dg8O6BE+Q4zuSuY52zCKZou5lkY6VrsbccJEbLpDIV0xesXQIYNd6VLVIE3bvX\/rn\/2zf\/gP\/tHfu3v3di3rr70iUOdPtgLRlv3U8x8mOh\/PldaYCmylsYwSy6CS8le5UBP\/6f0ccqL4YOpgVwarQQqhOEPWp8oCdzxZFGkyPdoTQjQaazsXiE+xBd3wWWa90FrMJnr3RKP0Wz6sH\/QHcBJPQPpIxo8nmM3mKAb9ErchX1Ix1B8akBRSAmfgvwazJKnQa6xECW3ju4zhw3p+4kJw9kZvdQeEa4RrQLzvNsn9tHbPMRm2B\/AXmrFreKT2rZbxIpp3tMtqZAX\/kxv+eS\/6PVH794etP+i431OWf5c8EYsoc6sg\/m4UREp6r5puJskNk4miusTluC4zBQLnRNWZi5bhQB5JM8bLAZOGnk2PmVvqPnkUSS3gAQ1cHir4qEgUhsPhyckxKgfT8NG1q4FsaIf5FLFbfDD+VXMMAjcjVoRqKpv61GzYpd1cEiX5JGZZRu7slJ69dE24sMyaVWYTbXjoNZfSHPEIrDUWRkNN4hMaRxkUBxkcYAvlHeIzU8R\/k82zpTuGEADcWuRkcgPHxb\/ru8lGhyAHOoX8uqVJJAf1ZDWJeW6TcE9oAq\/M+xr8WlE1BDMe+uVfyKBHcIAtClMzUwwxr9QUjUquFFZRocYKjhjtcPTpEymCeTpdr4dRszCOU0b15SMQXLfblakX+Ww8Jf5FcdBYFMy8pdFG+Is4TswbmbgKigu9oEJ5juH6V1Vqy3zbihkgxWCBSdrG4+mf\/gv\/5We+8CUCo1wzWwIImCwhoptUQZFhknBA6iUPLR\/Gb80ZUAVox4xouPJChIk7XsxzlKLbaZ7OTl744HPPvuspGusN+v2VPta3WMz5OZvPEQYFvsLuPkCAithWq6NPlaD65s5iJuDWGiKtub1x4\/aXXn799s1DHCoyQAtoDVQmEINi19c3gTKt68GBevokrnmE18hS7pnBGpwXZDB4LWVHn2wCXC2pRSPqmozTJUSvXIZZLBdgRWX5OPdz8\/kgng+ShYsm0bdlDZZL3Y6GBvInzMMmo5Lzqxmm9Ve0aDRJjFSKwj9Skek80RwcbtHcZE2hRHEVVziL2WwxK3T7r5RrMYAsiFW+phsR8oISoFZLMdImQdMYRjY7e6PmZF44XnN1fXOlvx4QV\/XayyYR7pIYQbEqLeXFyG587ts+9LN\/4He88uT1Ex\/LkQ7EG9sn51abxFFaW7M8PZ0f7J9mMQQwTjGK6FDGr+4ZnJkrhnRdS\/Ak525Cbc3qUxgyzOQnW66R3ShlV0eucZyc0hsP9VnDwPZIqDTThLvVC9KwOX1ERx8x0iKSKJJJkyvohe0ar2YANC2su1kyYhPG4TzqCQMKB2WHCFH3knR7lGFA\/Qdeunpue32UuM1wM05yfV+naS+yAlFRSbzJlyvd1ePdg0W6aHU7y3ypWErBjdwHXZZ5Eq3oC2nIQ94s0\/0mOkHLDHx7MDmKQk3KAG9kb56bl8lkdrqxumpE9jVY0KX6j\/+FqpeuPNpo9w9PRrYd4S5JJwkxkTR2Dx9gNT4Lt8kFSIF0mzCCk9iTZG0Qhf+wbh0sYbC3ttFbzMacm89GenKtyLYuPeSFW80GaJNZZbLRiZLptMqrtCqiQRec5y8ri2kar6+t7axuzEYTmoSpBCs4B9xkqQkglNIsP9FiV0wLCaRB5HuhXzWIWRutttfu+v1Ba2NjsLm92u3ig7Bw3LCZu7awJtSY8cmxQbDmHjS3gR4C4Q5bTFBf5MP7YbpLfaAPpLi9rP4veeMfNt2fspx\/Zfmf8KLDbncWtpZ6K2uprIW8GlaqHUKtZaI72oSzpBzSGdAIRcLOyRwxK7quXRqsNrzlYqEuVoYvBkFanU5SZM1l1TI35GbxnEouIZE+o9zu9Va0dhs1XizwtKi+XHWDzLtoAuSK0xr81gIhzfogHHYAGpNfG4RHvfkHy7aXcqVlM6uWqZBoSWSTpVaJQ24yLhhFaIAtyVAa8bJKoF7rl1LxTcGH0IEuDEbI5Gu8ZVD4yBqHhb0mEcfRLmYxZHk2IQ9+vRVF+FEHBIUpcisKmSAN6ybU8ixSHKX9VpmX8Vy5PgENrCPqoh9YUU\/5QBoKy3GGb+SWa0YTYZuZHvQTVMEraEWJOSJsaOjtFJSEjN7ctSHfSNH1RtXqttlVaEsRnuvGNIMnFE3zzGtHUbfDeNNFmpiPJQJiSLYB4NoNvZun4YTKbgICFzhEdOLqaXsxWe2o1NvfTJHGvL3F0CIWo7knp8M\/+Z\/+Z3\/37\/+D4Xie5MuZ5kDk+NnCOSpJtCZGAOhraIDn+lMIih9FIvBcmqzfKA2GlM8niyl+eWU9eud7n37nN7ynCr3VlRUv9LANfAd\/wHy321E6aJ4rQypwjSKP19RiIvaRkIkZEupAxunJ+N6dvfv3D+KFXmKDFpp8HkIkb3wEpm0ib\/l26aZxSBTUkUIjtZei0Bpj4BT\/0guUcy3HaQpiTDUU3dy3qqyGXsir+5GagFORb9Oc6bJ6PI9XswTdx9LU7oPgAxq0wIGGtMwB3yQCakbJX7o2tq3Xq9Csgvolu+gJZwxdcONsUMSxBMv1DChwQXpjZmSXZwy33GVuj8aL3HH3x9U81tpM+WrzfRTpo++Rma+ub3VaXV+rsP2kckjZZu3uvWee\/uh\/\/C0f\/0Pf8uXHt24H9ueeuTTyTHJUgn32yfF4OlnonmQ9FWlslIKMYRTmRoFy6bYhhD6pST1pgymMV\/wwcwa6WWpuORsFUXNcLjmbXFC8QQ\/0tYoA2wZLNFtIXmXGDvIQH7GPjGBOpkcMMFgkoXWj9fIrtIU26a5WJNFmwEhiaizd5hK2ba33PvCeR7l8krqDjQuEjKQZDOTw+Jj+FTqoBafX6Sq5y1IkjXph\/ErT\/GAyn\/X7vaxIg44+VAO4oZ+hljRrKqsGJoQOAVIk9hB84KdJRnB07twOmS7EfG0X5Y2wLGwPHnniHQcnE7wyGGceEcWRa4kcjlHZJ5CkqWkpg\/irlSJSY7FbB3GIAK6JHwENu9npttJ0Dm4sJqdlMkMBWr3Vzsp5+IWUgNRB28niCXyjs\/OXzq9urR8cHiTzeeAFRISFURX0IU70Qpgw0lto6EUdSbe04JGe5sm8u9J9\/MnrFy9vnL+wfvnq9kOPXLr+0IWLlzYvXNzcObd25dr5xx67dv36hZ1zRBo9\/JTmukhStSCJPSm7GaqZ5FDwrlyfP4aH2yKfIcUAZQhLUzJIa0lgiE\/oWUstWMgdIDO37AzSyKvYNzciRSQm32x6xJ1aRaSX9xgl0cSS+GVMiB1FX8Z8CA5wkOSgQYTqQZuFlpIk9bo9LtFSFeEHUayuRnXX1zd0lWxN75WhEapxFbsYl7YMBTEZYpCU2UhmBji1LIBK7KZW9cRo9q33ht98b\/TN96ffsjv59t3x+w9nRAMJaRehIREeneoisYYO+cF\/QAZmBSRABg6YLcZuSNXL5TAT7BFT5SKuCbTYCMEG8LtApg8YwhjZYRQGvOV9MUlBCpKgA3M5Z9S1WfavAFWZhm6qUmgBNYCagqgBDDCvsCSQK0AONmegKsCV6mqSVZNMFJgoYSAOVSWgUrvzxTyMQuBbT3OY7tSvmUvmEuiEsYOVgQRQVaPhiDY5wsihAjika\/MlaHUKCKPDwDJQBnkoGVd99eVtjgnEhrN\/rels\/n1\/9i987Bd+YWtnx3LDsuEW6E+lF2hgF5SzqkbUpIwoFszkiBSaIeoWIkLSzFVlVKSpKYSi1wlk7IvFc88+9Q2\/7V1Zincnm0SDFc2hz51ep6VJRdl8rQFs6YctXmA0HqFPHES9wGM0jYRgeDoZDeeHB8OUyMWIh55RKHqRkIzGG4HqPnS9j77wm1Hwk9Y4jouum609ljy2KfUwa92lAlfI7S1TLsOnIFvC+rhpvdru7LVad9vtz\/e6H+l2PjLo\/WoQLfQSVSklDdYGg+4a9YUfxMsySWPpihA8P2CHLsRdGaPycGgn3cHN4EU0Y3HGVSmu7i3qI5CaaYDhIEGzkbOFI7C\/ctzZlPPVKPPvnaKVekMqw4ONtENfikj0laDS9pudtcFO6F8dTdf7252w6\/vW0C++dPnC\/\/5d3\/qzv+8bv\/TUJUJC+iAxOD2cHh+NFcV70mBZnhgj0xLBZqpNBmbm4s5mIEXNWYG9lFp54AnsFbaZLAF6OMJFbCFSCAsbDHiJW9TnmO+S6tmeTeZHHk5qZnt6PYOEbixf0y26h2n+M0XMV+ivD2HXBbWhZXIFwIHK8WL27hcvXb24ce\/2YW91I2h3W51+q9XdO1ChJkqhWR5yNSWkRQjJnqdVwu0WCsYxwsNOu60nyDc2wFccpeuQdkSRHwhfhMkuTID3krXZ1je9XD+4fu0hFFzD+zooJAD2sy98cBZXp5MxKqTsUCteZUEYFQiAggkQNEeouWw0FTkIGeCCgmllDmgwiAA8IrROJ3I8azqPy\/lkvHsPVlWO39+6hHzRBsK5QcfuttRaO+qgf4sqWSQLrGK916d9LwyyZTmZToB+ABZZS71IB0sQ1hc4kcKFXqvTuvbQ1Vbbbbedbh+NQ0Q5\/rko09l8TFDSbFauZ3W60aXLO9ceOn\/9oXOXrmxu7az0+3ipWjGlkxT0B3Xlp7TZ+Et1YtaukvK2o9BpeWVoz5t2gjKX2UY8v5yN7GRUmvBIPkeWi1qpwCtErySqvoHdPMuh6YhDGBZ\/xmepLzpsdTt0A5cgg+7wtlajyQ5NzKZTobZlLeYL4uU4WfjmPX00CMEPbEiN0IuIr0MbyNdFYA5jUTItYzV\/XKGshy1XLdNv2z\/+z17d\/5Ov3f9Tb+7+qTcPvu+Ng997d+oS3ZkJTQka\/TABGSLHL9E2BkuEyOCwAXBCN\/XMewypUxMGVnCkRoyFedkwoIwKAf7UMVmTpuiprHzGOGk4j\/1yXOCv+FqVYR1Mwy9QgcFqOBoq\/8up0zg70EmbVBOrTYwFSeb5JK1MhNQzUUhr9eQweYjBJTaIWxEhfII\/kE3vi\/oRbjOvXMuOg2zRac1rdNqCpKXu4BDJkEWg+uARvQALldWI9bS8Ji9prVYt+GDG9zaUtzkmkDIYXu4dHH33\/+l7P\/3Zz5FHBmF0MtL7TEeTOUktw0NHYDCDqfWYQXGNwk\/p0lkzOmMmxlG9TF850KIkjnZbQZmli9x2o66j19dlbcRhLc3b4OHK0nPsTjvEbSvZCsONjY0OyKHSAuiF+VJY3Z7QQtyimE7me7tHN27cG41mUIGwIYDjoqMu5qYRx6G2Vov6LPuy8rPAUwJ5a1sPTdfSovGjNSagg3UgwWFMhVSi0lqiaq+y\/1ro\/+X+6n\/V6\/25lf6f2dz4Mxsbf7vTO8EaiR+Eliq1EtAvTVDq9tkxlqSO6YIjmoqCyfxGk4FQ7J5DLj7SvMmkYe6EmTe12fp2A4E6B42LdZqubRHvoN+zLBvH82Tpvfz66emsWKQJlKOmhOcoOmBExJpk8SyZLWRL3pXPfuGlf\/Iv3\/WFN1fJzkN3pd3yLC9zW\/MX3uGtXeqF7dTKj49Od2\/fH070pgSYUA\/BiP1sRAIIEEvLzZS90SEVGDX8Z\/hUk8JwzgReNbc5bniiaVJskD8Gj3CoQ3nQhWoaJml6Dm1ii0FGrVYf3F4Z+GFAJXVGjLjUEguYpm7EN73ElbMCHuQOM41A1eDSSgqrrNJnH13NZtNbt4\/W1rqgTbe3ajXsu3fvQdtsNqVTaVqmZwtvvvlmaPIzBgzZNNXr94DpJJk7PtHJ0vdcTqA6DASMA7kojEIIoqeilfEoUSiX6bI4OR0iFCiR\/L6Wyxl5YvD25ce2Lj66dzjEemCxkT5WqdlbZe0GDlRgDaeIEoxqIA7x3diUzighA54LQqZWxxtPph4OZTHWWyeXzfNXH+eE7fp5bjlV2dZ7+RpOw43jZG1nizy21+6sdHuB58uciO\/zHIigUVSH9g2r7dJEq+gTQHzx8iXbdbIcTQP2mwTKSVKm\/KX6hjWeCOg4PDg9PDje3d2\/c3tvb+90PJwVxJwaoEpNNrjPyNjniF5pjK4SGWs9IxGx3GNhN89X5fflxf+5yP5SmfzAsvE\/2\/7\/0\/OeRslIeWGUXTh6AJvaugWAgiF+IYpyg6bwzcAXBW2BcrNKQO9t5IgCpqrCmeiLH4QDlDw1+qV7qfFs3m7jirRGz\/M9lJ\/G9\/f3Q72eM0zSrE79MQl1AdSYLAU5CbPJ9BTfaEZTkjI3AqjG\/8IfTYp69U1jcnN9BM1AllPFCB4r0vuEMVj+0wUNhAJa1vP+vhuAftgiDrZukLNQC221mmhcxh4ZHWfxlLPZTE8QiFixQj7Z4AIhDtUQOAV+sa3PGg5wMkA69EjLHET9OCu2QrBZioQM6Y6+2Jq25UcoQCXRgl4jZb4E0e22lTGiPBm9wC5N+xEUAv0MAcDp9nq4gtlkorYMmtFgrSEUDrRQxaZzeHg8PB1pJYSeW2qSf4kM22632lzTbregGT4wWIaMgKIwPBP8V13O\/NZXWWrua0cb68atO9\/9PX\/08y9\/UQ\/tKJnzp\/PyZBID8cbv0KkCPfFBnNVF\/IMPMNdrhwab5HV6F7iPuhkF41yVW37uR8tOZ9iw78\/iO4eHw9EpNkUjLrHYsmqFEYZNZswlJFqwGxkj706nzf5gMIB3chpNbF5rQObT+OhodP\/+wWQ0Nx4HVTdhgXFUqEKN\/rUxQ3GtT4Z0GTb72CoH2ReJplCTUu9TrZ68lonaZMbwA61ytHqPKLohRFIjzeiz3bWPdvu\/0O++7kcAnb10ls0ClDAX1vPGmi3gJzs1GQyt7g5SIBiSOaY+RR70UEVeEOZh4cSt4BnKxCVTPZCNoje73ZCrhHWaoGb8QoRKE+rWcLRInMa902qWuOQo1Mj0ucipsUfh8WIWN+PKbbjNwLlw897FH\/nYo7snj\/zgv3jih35sZ3fcCQZ+2++sEtXGRYLxa93QJE7m8xm2T3yHQtMm\/KEwBJlHQzMfbBkkw9Bc21mOo+C6BgJKva9rxWAV0wb\/Ks0wfzItdmqpUWo5ygT1STHIh01ypTQO4qBlqEqn12n3uu1O20FrWy0n8HBHir+aenIsZ8RnSx+WsMt0i6IWSZZfv7T1xLW13f0DkLerb5h1Wu3uZDbb291bXV0FewUYiloaURSOx2O0AekAywysvncLws9nM\/J\/UgTf9XI9oaS5JPCG8IuoApCiOzNrlaDM+qnE2Wu3uxfOXzCDNzz4Wi01dYAqdDpe+MQz7z44Iq0DQ125DBUsjpNnYR\/eDI1l31ihpMQ\/pgmBgbIxIzjgEkXv9LxFMkHNp0f3q2RK9e7qRjjYiVO9TaCI841usJgOjTOq+qsr69sb\/V4PoeAp4O18rgWGQA0OFQwxL5CRyeu2GuE+ZDSaJ8PxvfsHpyckD8Nbt\/bv3j64d\/fw9q29O7f29nZPOHjvzvH+3mh\/7\/T+3SN2jg9nJ8ez4+Px6ekY+yYyEO0PUgXGwk5t1\/UR7TdxaY2karyYFn9rmn\/\/ZPSXp9PvXUzfPxu\/OJuulA19Ob2wllapb2Wa5fhmtYMeO0Ytcf\/S7gfNyt9nmSINrdCEnfpT5gQXoISe5F9lAtgTNqXHtVxdiGHB08V8QVunQ5imz4gnZOjmwSKGgGWhzHRmOCOsphX+SjNAjNcIjD\/AWN3g\/LG1Jv7yTEfNMjHBZ6NoEgQ38sqSzXOVgg4SZTIBTZXDLd0ANVOWZr5DBTSDYYyx9uJq5IGDr5GBI5w1RMkqAArNJTz4XmJdTadMqRlFHTOus2f56svlMtpd3wsCP8IGFTma55m5BDCpWU3hEqMtzYyMIQOX9MCzY7uQzU\/6ipNFksYKF8wNRApXkiFQyGRrOmmnZqxadJ1Wu83A60kLWuaEmYSAIQ3f96KQgfu9Xg8aFCaaQoTHT1P\/bShvT0NShgc7v\/6FL37PH\/ve19+82en1gWCNBwTMq1mcxVme6IUbHKA+\/DG6ae55y6WBDsb+UThagkWQZ5QYhsq1oWp5MzjIo+bWxfFyOdN3B0DNQLPMKFVD2Ty8ZkujWAFBX824etYXRIabYRgMBl1CBOV\/TYeM6\/7d45OjEY1DP1cniblZsJRH4XKawpzY5ywqRfucrY9T6pkrjkAChSNU4yz7HITiBxcuiQzeikkRvVq0zVKUiiAycDytH6p0+7CB7yqcYu5odSHtmNZMqGjooc36YS1sAwZijwT7SbIghxCowjfdgLGVMMBizFYHpFIMgh1oEEyY6QHbqlqR12oHPX2fGxkkjWZaan1PTocY72ka7E8JOJot39Njh7qRD\/mKb4gPMgDHb2d53Eyz7Y\/8\/PZwXtmNXtW48onPP\/F\/\/8GHfvEzPcfxIr9AiJ6+ClrNqyKp0iKjiaZeUiTnLVYLRGqrloXwk4MU9muW0l3NUrZ1BWhnh8JVXFvvU4ENf+asgImDXEsxfakpQD\/wAleTJmcC5aABI12vq+1m0Apd3223o6iF\/ZFhcDkeSG9LVCPKh4A585a30Gvk6fMPbW2sr9zaPTUfWw+6vQFMOjg4ODk56Xe7uoQL9BysXiMNYfAQdecIPEYoeKU0z87t7Gxub0Iag0fGxDKQSIgAH+ja4KDECI0QAx3oZF5VnW5vY33TDF6br+GCdUK64XCj8dBjz3nBynC8YBjijVYONrQkUM8ilkAGyo2wuQowRY5sqaPbKIqnUVuEQDzGhZLH6lrH9ZT+Zskomw3BijAKOhtXycRtp5zNkwhrSEZqpszwjJs7W\/PFfDKbAhb4GowK3V4Qqjb06vuaVgIC6mMUwi\/Pny9S2hmPFvUfoLGYp3GcmbiU1FeGZTe1dEAhjXw\/I0ChkHOpV4EpTtXIpQf\/Rs6APrODftZb1AaTD1GLUuvn67xbO43yHHH7Qg\/nl7E+1R91Iy8IsT+upxtiqBofpS3wy2h7bVAUBqltnhOFoepE\/mxpVqsPq2o8nijQLwrcH8iJtoE1ynKzjEABwqC7TnzBBKP\/+o9ixqP\/JFh+YvxnFWQgUIFd1oGeTtvFgecehOHNVngnat0I\/b0gOnTbENgsmrgESM0IdMiBzNQB4yZWgc6lEDev4x2SbOiBPIaJy2SAkMAZdjjOTg22ADI7DFl4AZ\/NkiAOsoXJwl3hg5CHwj7sYodeIJ4dDaGqzFxDItYqLwUFtCSJnzRLHSpQaIojnCVsIgigs9K8REFxjFirIVCNfUTBDqNZJDHC0u1\/iUDhGmyETM6iArBdr2XDtPVWfq38gFxMA79gcBvtsCFrOpuRWsDrunFIghsSuxj9NpS3JyZ4q\/z4T3zke\/7oH7999y7pEjJgwAxe+XjZGM\/T6Wwxmc9hswn\/JQkKY4Ed\/MEFjckEDDIIOUJ95oDRGrgW249mxd7MmpXYwHLQjrpe6Nkh6oHQ0Qw89Onp6Wg0EsBbVjyfI2nNCtp2omgxRsvRb3qs7XAyWdy6eW8ynodh23gczRGZiXFNANAgl9e6xbYWQC0\/yBalZq6ewkGOUJ9TUmETnHJQgjTF3LM\/CyOoSV+a4va0NN7z256W5ZKdZH6chknZT8vV+fTcIrk8KdvLJjEIxo1HOOvaWHhNHQSzR8fwWYiLlaMX9XoF0E18rCto8s2YM+ml6DGPTxOQ+jTp+XYQOlevnX\/v+9\/xgQ+\/+5kXHm+1O1AZp8s37hSTbNmKXJwkbcKxKIzIebTSQllYNV3Ol40izRt3rlw+DvQBA\/Q8tJyr+6OnfvDHHvu5z+RZGRSuXVTT8eL4YDTeHwKy+OPA1bM+BAdmVq++CyCsJDyHyxgPI4Xyt7aMz1igqKcaOxRO1TuUmrGwHb6YSyQpjtdbChfW\/\/CbFnDP8KROoKhTn+SsumaHZEiLq03s4HthS2\/BBRVqtaEAXMoKlo2tQee3v\/f66Wh6eze+cOE8\/iNqdyFmd\/e+QlthnJIqNGJjY42D48nED6NUy80lNYxZ6CYMRL0FHMR3kxER7xK\/NZ3PZnN9igY2YE1wIIr0bnaMBiUAM9fWNrqdgfjz9qDBv4ciWW6cu3rl2lO7B8dlhQUJWHXGsL1GOjhvqtauVJKRr9LktwrHSSZpqFYNgjYvsGEs+dJ8eIJHhe2bFx\/OClDbSpO8F7qVHlue0ZZB9CXhA+0HkSbJdrY28bYuZtCUq2BLGqfU1uQzYRSRnOAXHFuhPAExFova8odRQx2kiL56tlz4QG1wSwYHpnluoHVQJjWt9RNwEP2mGMWrJ6il5zSiRQx6lPGtXNaqPLfhRY9Zy1YeZ1VeZU27aOg2dYimtYFZ9FPxk8xbDDF\/uj+NWXEEjeUneMAWaKB3KEZzaZojHvqNVwvDlbXVgEjdxBbT6cTxBVx19hlFkUndNFcKA1FSxggLGCHGorCj9pHy67IeKOFaXaFR6X\/YWlbBP9\/e\/IFHt\/\/Gw1s\/cH3jB66u\/bcPr\/39C15G+Ee0R4C3JFQBZ3WHDqjRMEyUg1UA3EgE\/Yd4+C6L5n9j16YP4QZWXx+ha35Sma2uhjajSFiZIU9M1kGjWrBIXDK3hjlFHTVn5IJ8ESajolsQhR0uklD1pkXlq2Q1Zl95RY32NMhWrWmpDxKsTCNnaQ9b2ucnEkniRGgOJYA4J4x+MEZioA5ZBI2YVWKMXTMTjj6EaTgN\/UW\/31d24en9xyS90E+DfhAs9MKYs+zoqyxfVUwgicOtB+Wnfuaj\/+V\/81dOxxMQFLuAWHxSlqRVEWNqu6ewbpkouVSopkyxtqgSpYEMNMciR9AaXYWeIDIOTe\/2TSutdW+44e7CuXlaFqiQPrOD5ZvFpdk8N++nE7gmCWEBzFPOECfyjHoItZqjVQS6xhmDQbhDau7tHt28sTc8WQhr8JG+HDSnOQ8VRmuajaYe\/8uLZaxPBimERJR14TxHsI0apNAMtgwHKdM4PzmLMqEPCrGNA5PwjV6iLtIyvbDFwAeuvRk8sbT+89nsz43Hf+fk8J8fHf6L\/f1\/erz\/FOMx0IdV0SQ2jSLRWg2UNdv1agHcJNoJkuneGw4jYw\/8E1ApuILV2EbRyEkR9Aa3puWFQbPTkfqhlHj6Sw\/t9Dc7g9X+tYevbF7YLO3oaBFmS\/y8XttCKiEvBuWlvjZWwP9iOc\/KaBa3M6dsNm688+HPfseHDyOQAs6JqtKpEqtZxDkyX1pVMs+OR6O4zD0nIqCHHhPtCTfBNwobeM+FbPGXcKnmMDtwrua8xvxABLIPE4c9YKkwjn0jBQyeymgXP7lWBHEWSWnA0MdJ+Xu6Rtz8NfUws3RS31fUbIwFTBHmK5qHUDpAJbhE7z8IQ5CepIo\/5Pvwtf6TT1+8devEttyo5RE2tFpdIpPj06F546E9n+nTU6Aa2nWye7gsGnj6RTzTevGqkeZZnMfEG209Jad3MzN0MkYAP9KUlldHeYV5fxdDQCNdkhJ99yt1m9bW+jaGY7ginn\/NFsCU\/+p\/DKXNJ9754dOpPt+DuzWeESN0ZeaqI3toAggaOl4R6NdFVrNy5S\/VBhwxem6+6GH5g0GbxkjOF0cHWBqs3mg7j167EjpuMlk04nyrFYzHpw0HN2mt76ytrK\/2wnbocOEKSqAFyfpaKJ5A37ZBZRyhFxIOUQrRRpdcKaAwC1n0jDTRDFAcKbRvagW7SJRmIY7aDaB4EK3L2EF2RkyKR9HA+idXoFtGYevJA9qvDmz\/S2H0Whh8Ker\/SrvzPwf+\/9UPf84N9Rr2yiOcZ8y0bZYT4E\/1VgQLJfYDIMz2hGANLTiAHj39SEekE5AFK6FMHQhoRQ\/DyrMi0guDQz2\/hB06Lr7XmJc1nU45Fno+NpDoZZwNc6fGNCSvaYMoDLJY4k2xFBqU4RNK6bk+\/oSe1GeosMUCIw7D4JVu60a7\/Vo3utNuvdJr3WwrEyvES8Cc\/7F8xzyHbVYYLpd5VQDjlrnJiwGQ6ceLhRDWrC6CgXKH5kvEilEMPxkXlkJhOBxvkXh4HmEN+xRq0FJKA2Z1TogVI30yQkzXpOyi14hGkKRXDlsYIUkfP2pNMHyj1llyyJZ2kBwVIKkukqaJ0ozICTEV0EJXWqRRtwVoSSl0pxQ5wiONj0twVmGnbWmRib0sMqPYehpN3S0JfAPcUKNZhkHkO6G8m16koSK\/1nC63R60qPZXXYw5\/mYLIpcdmPKjP\/4T3\/dn\/uxsHrdbHeTBEQYPIwzvsNNGnDYWGe4ZnTMPgeC+JFeuX+KW5Ejgt0Id3IW+lYfTl8tAPGbq5d7MuTOu0qzA++HUUUqie\/MdPJkcLh9hcP1g0MeS2ScDhF9EWEQiEpRxGGygej6P793bv3tn7\/j4FEKQG4hvHJI8N+LBOlqtCDHTAmc5wpYRscMWhav7MoJUv2zrOhymEVTEtHZWk1+crS+hqDtT1Bg\/sCCywIb9cJ79ifHh905PPzQdXY6TC2l6MVlcqQoGS1iom1l0aDXNWiJ5R9oUz4xtiNu6YY9u6WecJqenQzNiKSgdYq3otJguHtBQjrsxIUnlesuHn3rIC13yEDL+o+EJXup0Ye2fpk4A\/7QGitxl2VQyexrHMwJuqyTqeyxePPtjP339Vz+LDBdFfueD7\/j093znzc0+484ajVff8\/xnnn\/sdDQZTqeHx8M7t+\/t7e\/rKWald5RScbEhESWBY+iMnLJAs4n1wkD4zw5b0a\/n+8VqjdowkzFTuS4Mv96p7ZOf9djNztnCBcPwuqiylAZCVeusTUlNUQKutk4RTbqn4EFYzQ51IFb\/mcooRzsMXnz6aplVuwenQcdZFvn+7S8X2eLkVN+QA1JpHASjIzMpbZVZsTIYaMLBTCBlqVL\/qmmNRqPpbI56IWjIQus8XxYE3VQgXQO7cVtmPUE2mc71lDNaXZSPPPIY1c4s8OukwEa2Dz\/2zMrGxcPjsVy9CoKS+RD28oe6Spq25nL4zwhLVwlJpfOcN\/+pNQyK6DZKswXh53yy6yPr+ezk\/ieee7r\/wnMXP\/D+p9750pO9rpvEc+wsSSdqxWjaaDhK0vTk5MQxn\/4zKUSKm1M20rQ0c2C7CA4ZYnBSgaYmMAyaaz5AsaQWf6E0tqYNzA4VEDpnDQaiMAWmCcmKKcxMGIWrjKLiDHXKmLMGkqVJlGcvh973DFa\/a33j920Mvnew9T9Eq3+n2\/rpKFy6ilpwTL5rZrlqBBAkoKx6ykBeBH9Cy3q9BsG82ao3\/hVlFFIs3RZZlhyBxYv5glHhk9jB3aJUjAzURNMWcYxThMO0rKdnHVUDqehRImAHYekF1Tpg\/upytkMXsm5FBMoSClCOnARcJ5TQi0KE8iY4kncQQ9ltFLkDqopZmC82y9DoCeensapFjgo3GAhn5+YNNMaCZenyjg\/uJsBeTtUV6ARZrK6ucpBBwQ1+YoPUJHkDHKhPREgEb756o++S16CBudNrbb+IiLiifhcC9Sk0iwhqhAejaJxma5cBaknY9aNJpb60Tn12AFKUBKqQN0ek1TRhVraq+F6r23YwfBJiA0z0jU6JE2XOQXjuBR4ZmaYuPb3sBfoZIJ1GrbCrj4b\/\/z8m0MChjL3\/8X\/5e3\/+L\/4X+dJqtVvkXhyp2ar73LJgLYAZjmbTRTkek8cDg3hfmM4wxXSZHAMi5Na6UHk5aROi0Yt0sEZn1Bwc5QH6havutHswEF6QQoOq1GdH9ZfLVhQZbjfb7Tbyg91IZTabITnO1p3euXv35S+88uorNw4PT9EPyUbTTbJLnDv7NM7AIBK+sy+OR4oPUEQaNLpiXIKBdfYRXn2KnfoIP2kW86AOLSB6TkFD3Vd9CfRT6p9cK07i5jLZRUPvNjVysarHi2W\/1KSFQx6qVx9iHbp3hekwcGpg6kZ5OGTaMROqeb6MkxTfZZrnDJfpfS4V8ETveeZ7S8cm5mqWebm52R9stkm5nKY7T5NxnJRWtDdZ5g2004pa0WB1JSD57Qy0qKPQB9mKhnfuzv67fvDH3vurrz\/x8U9f\/PKdynZOk+Llh85\/5vd\/861B586lczfe9+5RVSzieTFPjw6Oj45OAS3AGAox8lSvgRJtjBJfDMeE8aJXw6ZgYBRjnvATexP\/JVpzm0bFBOz1QXZoqkYErtU1DwpHOI7UzBWKFMQP\/jd1OEupd9S08U\/qHn4psOOP\/+lEcYYqmKew2KedOEkGPff6wzs3Dsb9c+c3trtV2ZxlSV6mh4eHdBpGIb67VhjGBVDPFzOaYPhSt0YTGYEiDIMdmneazmI6XcxnWLhmSsgiSuzfQce5BDDSjDW5jt30Ah9ku3jh2vaOPo0qP\/l1VeCHH3auPPLswcmUHKl+4Zx0FyA9cwYIQCIwojAK8cAFctgoCWqgn0Zjqm637QfWfDoOm8XJjc\/e+fyPn+8XXhVfu7b5\/LuuVU7wlVcO9u+dFrgToNi8U2I4HUkf8MpWczEnXJDnA0kQQwN\/imOMWqiCYnzTuUmPJRH+kB56x0F2jJLYdWZS3wgz5eymtaGwlg+NoUJoDi5NVxltJCxmGEqNzA517Lnt7nntEycY29WxWxWRb7uB7QR2BQQ4S032Q4CWs0g5a+MxJkCDKug2PKEWQ7UtLwi10FtzCVpjCCmlmbZM9C6c1HLtebIQQuqxGBVDpFydHJVeAkRHjtZe6MkFpSOMU9t6SNrInYtBD4wOEuS8AXZzqCSo0IrI5UqSnZ\/Mt2aLnWm8OVtcnMbbSVxoOsh29PAOoQD4q8X6wDJs0z1RE5C12u1ur6d5XL2RUMEQ5AkBjAbQXY3wkpKxfUPamdVzCh88HA6Pj48RrtjlOK0wkjF5Hq3UdQiBGDuATJ9nXNVWvpyEglN1BbrTgC3dOpE9Egma+570VZ+lPqjF5RwUEXI6WhInOqslMQcXQ4bgXpBA3s9gIbpSv2Bc6KE08MpyXJg4X8yTJEbn4CJdcBG9wp+8zNvtTqejN1XTCYQSz+F2IVidftXlTLq\/uYIGw8fv\/+\/+xl\/5q3+NeNW86Y\/83jgoKYtCWDEHRdL47QV8a8rj6lq4hbM0d8elV9Qy96tAXc1AVaXbKDxrmVvhQWN97gxanc7a2jq+Hk8piZn7ZHhrZICAMr1NQjP8s3nM9SgQeqnbBYo5dKMIoqAijtPR6WR3l9xgBudRrVp1VMxCFQpypcggjP5xhI7Y1kpAMd5K00pImstrvYQPtcZwiss5Qgt1zIHuvlWtvsr0piPUp4J2lss53oI4A4EoijYY07R8yw4bno0S4xAgyHcC87QrdNG+okW9n0s2yUjpQQt0LLLSPE4I6g0kVVrirvigWXU6IezFofg+2IT9W51Oe317E\/Kx66SxnMWjfOkfjr24CCw76LY62CEG7bt+5BNDt7ZXVwed\/iCuHvrRn7l858BpWDun8Qs\/\/vH1w5M4X+D+v7K2+en\/5Hf90u9+z+FKUM2nvt1cTOP93eMsXXpegJgRCX\/EeSiMmTdtQF4cJ9IXoYzsCr2pOWz4A++B6HqdqOzNSMc4EZmWeAiHaxmxZb++sGY1O+zWV5l9vaWAfS6vr6pLfYpLOMNVWl8G4wAsgNVMhJogQYGgqDGF+o5nhS2fUH5j4G\/0+lW+XF9bRQmPT09pKwxCE7EV9EXS246i+XSSJgnGTyYBCgsxEUOZ40rQK\/ot0rTTjhgVUCYi6V5jl+QFylZzvljAJzJaaDm3c9FthjXlX4\/lkSffucjt0SQWGiJQDinpN\/+YCF4aAe8JtZUf6I9zEoN5KsHAi4yrYS1B7043mk7HVmEd3Pxk3359qxWtds8tm+7BNPlXP\/3lk6NgMgG4ifg9HIsbBW6oz2sB6koWsxRlIVfE9zhuQFTvh4GmxrUgVH4RrTK\/lGTnOXkIWKzoBU2BzJo29qEcLUNYUAiVNVYoQJDenmVKGp6ZKObfuhpH2EdFSCIJZPTtC90bsBM6wab0YpwyyWe4DvqSwzeLieme4dMXW12r22AqTTly\/FC9MkbPu+ObLa1Wph6R95nVgD9Zrje+Qx66ivuhQm1f9a1PqIYtDMHM3GuNHHrPhRTFaoCUjFeuTiPXVpgvi2KfDfuIkSEzIF2T\/s6T0X9+8\/TP3Tr587dP\/vz907947\/T37S60rM6Av5ixdEDphGxB9HOdSaWMS6Z\/KAnNLQBwGDpxiezQMNTWI6KaNKMekcFhDhqWyIJqY2cfzw\/iM0BAGJaQaNM7O5wmyldmb06B5+zA27odYgI6InqQpzBvwJPimV5q+VKH9utroaQWNIEZAqaC2gGsA38ymeAMzC0vPYCKCwRgJfxmU0ufUR69\/VAIWeGfaJRGBFywhKBON7jhapbl06keQRSuNHU3BD0Kw4ge35bym4kJINVQi4tN\/sJ\/8Zf+7t\/\/ByvrG3oVht6UJ76Ys0p8GI5mBMtM+aXVPBwu0ryYzRdGCdQCf8TZyAPYxujgFCZGFq3n9LjS9k+KaOasIDT5dssJ3SZxguu47XZ7MBiwxRYkEi6lNwMW6O94OptMZgZzl\/VdADi7iOPJZDE8nZ6eThBHlmryAGNG\/IhcQaIRpNayZJrwf0vGbBkDRdBuNEyyMHcW2dZHUFY0sq5GU8YoGCJjkepQqEmDZ5wxjo7Cz5pdzaL4UlX+aG\/lF3vr\/2R95fvPrf23O+f+8ualf77SSnFLRZUscR4ZQZRlE7mjYAxab0dGqxga7gUGKjUw6zQVdJv7NbATDQPEMDvcarsTBZ61ttpxbUVjYeRv7WzYng\/McNXJfBYvq1kW7Y2cZeVGfsj4fS8g\/gg80K3ptDu5nmmw2mud9tqAgYFS6PO1g8MXf+qXuvAwKxt5+uULK6+v9EjMPTfKl\/bB6WR4OoFP0Iaqy75ReKUSekENP1K9aBzFFsbBWAYFQyiqIL8gza9ZB6sZdR2cnbHgwTtJ6lO6\/MG19daYk2TEKTgPz\/nJqbe0lOO1aLAxIzi1BiPxBGZwUlFVRH0NeZS6ERQvL4Nf+\/zJ7m6M72iWvtO0T05Hb9y4KcrNZCaXEQyDb\/PZjKDudHiKRpCh0cZivuj2utCYlcVgdTCajHFVJKokDfSmRyK17EO3eyCV7qCXIdOy63vEfEmSXb50VYplEPXrqBgWaufKQ0+tb1\/ZPRpaToD9ViAlPgEBMGR9RhwmK\/alUB07NVk1ctAzGFLwB9CFKnFhv9OdzfRxmbbnrEeenrF1y1np\/chHXvulT99z\/FaeJdOp3tHLta1uG8RdW1uFeegG4TJGX5FsoBvLKjDfq6waWruDvDBjCED49IUG1NJHH2tNgCwI1ilT6h2RZQo6yU8qsK1vhFHM+NWaYYU0toYLOnKKjFzILrNmMW8W+cUk+8Bs9ttHk2+czKIqZ6hOTrjqFiYeqlvQhabUhNEW+0CE3BEpGXmn\/KvJNE2yJiWmnhBIPj6N9SFvMb3SA3gQyR472B1JAEa1iBPqEudwHYOlhXq8jIDLjQlpS5vKQcw+5+kS24N3jIwjWOMjk\/Tp0fyl09m7hrN3DBfPDmdPTOZ0TMQXi5CmVeIIrNQ8YwmpxthEKMkxAqjdMGjMUWqzhUi9c8Z8loBqJnTQTGHNbV1oCtVqgmv+sK0hnYN471ocXEtXaEJdgcJZDgIIFHZqOVJoh634ZgpU1U3RCH3RmiDJlLo1aMaKld0F5G+akQIQJDTxWwxD620wjWgnCsmE2wFXVSkhY7kE+GkDWmkcL8lW30PW+gYT92j2l1SQ3sFJaRe0vS3lX6vvb7CcqYFl7e0f\/JE\/\/id\/5ud+fmVtwyynwmgI2PWsCGxSUE3EqydMiYkaRENFvpwsSiwvyxuomjRFb3Z0BfrYt5wZuinlVSjcsOPKuTlpHBdB6JiHZ5puVQi1UUu2CABtgOPs0\/XGxman3eNgu92BukyZsd5fi3ShVrFhkc8m04O90929Y4TIhQZM9S4qQYqW5hGMaMU+YkIvACejOWfyph3E\/NbwOUhhn4N0SgUOGl1SMfogX\/WWmqIcdR0KGslPqnE5ZFDYwVvedb3\/wff\/q3b3v+\/1\/vFg5R\/11v7hyuonO8QEJQGR1gxhdw1bmYgho25EU9tmsuuBFsJNKhD2ykqpieqh1RgR+GArGWquDEICCRzzzsWNoIObKYiliJEXcT6Loy+\/OR7G8WIxL7IEhRtOx9gKXREckSRNF5M0Hs+azZu\/99vuPnRB04Mmjnvs5Rsf\/PiX2+QrPX8lCvpRr8r0jsI7N3d37x\/BBUgWn01oDPE19yggi6BLiGPSAsMu\/qmTFaNouEYRgEHzg0veYhocqPmPhcAJ6kid9LwQMlJlw+SaW+qRIxSJ3UiwPsi2\/smWs\/VPTugsnTygk7502QNRssX6k2z5wz\/+qb\/zv\/7q3\/vhT94\/HgLYm5ce1dNeJvTp9XoQLV\/3IHtI44TuodZIpBG1ItQrydLT0xPdjcbZNe1Wq207Wm03my6KrFjM9D1PDrJFjblqtlgAzO1279y5i4YiCDYY\/XVVINp2wseffv5oOI3x9TDVTNAgK2kv2ok0UAwT5yFuBIQo4KREKCWnmsSnU4US59WVth+6s3iRxLjBjmUvTxfjn\/zYqz\/10dtZFbTbgVUWp0en9EGwtbm9GbZCEH06HpNTeF4QBmGcLAhQH3\/y2oWLJBtOFLiE02SMaAAkoSA4otrQasWrTRgaat1gH6VFyuzUP6lQ16GCqYPagHwoDhpbv3KUMVOTLF+LZgwuudNm9TuT+T87Gf3QcPT\/WCz+Trr4O1n8A0W1UeQJqAVM6i7jmbHUjWNTtU7WXdOp6VCFfc\/xoBtNIwyVHzMUyugUQFStKELr5HLMfDuXsKVpdsh0sDOsnt+26ymW12CFY3JoyiMoKDjsN1swR+8dknSpq4RXdw5U0cn0rSEjdp0W2jYaC7fIcUCaySj1xoWGlWJyWt9ghA1Y5AXyVBcKQPR6CTI\/quATIU9NGD7jDs2zOWeQqIuNOdc79aDqGWV2OFJzCTOkmIbNiEzyRmUqIEfYWzt1ClEFzYotRg\/rjmC4WieCMQ9EcFA79eJHaptEsSbPTEaXQagH8Qh64Twj4pTaR5YqWiQGhnWjsBO6lj4Kk4svlZpivK6jmQ9aIW0g8kICYq556AzZ0xsY7Om1m29POePsb7xI+yzr\/v3d7\/vTf+ZTn\/k11w+BSZO5OoQwhs9wg8D\/bDInMImmpu5tf\/9oMprEo3Gs9fwqml0Rg+r\/pCxElooQU8u\/P6uOE2uRVYeHR+PRKZmthu74JApEA0iFGI0S+OpUQUOj6vf7tNYGL3s9DlIdflNHctJdw\/j0ZLpYZGiB9AyWa3WbFpqHIX4dpp8998\/pWvaQZP6V5UuiZr6OfaNFCBU106MsHOcngzWa55lAB0ad+Q\/RZlqoFU5HzGILtWsCXrqg8tJuHPWiO73u3I28tCK06Vh5lBMJyWSsEmugFjGXYn8Mmmtphw0twH4GiBFBshRSL4laYH0KIWWFGizeyXWsMHT9AFyp4NL2zmZZwVVic3ka1wr3ju1h5qZlDKQu8ng8nZCSzpI0biz9aXz+Fz7TnoFaUaMqds9v3fgjv\/t00NHLw6qmVzX6X3p50162+wOIxTga9nI6W8ynw2SWgEsEWKA1JgXRUEgRBw20QRl8hNcyHezOcLx2ojpSsmP2NbpaIvIE9fApNAUHGH79V\/MfFWSHU0q1zSQk9etLTB+SY11qMnS9iSnY5ywF+OI\/EBTsrevULVCz\/klTeZlUTpnkza\/cPDrJ8hK5lzZH5c5sJ4pCPeLc1Ivo+4PBwcHBoXkrXEufp7OI+CES3VjbWN05v0OzBA6gmx5TNJ5Pj302LKCEP7hHQMBwfHxXFHW73ctXrpAmGULO6Pl6LE8\/\/5ITdPZPhkCoSXekqCT9gv6ikmVq9gsZyXPq1Flgh6R0xshEOoCIg7CKusvT6RC0j2O7aIaf+8LRT\/30DS9aC0K\/UVh+w5sRzTZsOeRID49MJlOYS\/6AAudlEaeL51588jt\/97d847e895u\/6X3vfMez165f6vdagefoBoYJPqC5pgFlgfPq22gjAjUESj0oVGMfOVLYUeCuewfSCi6stc7EItJS1ACNVYMaPj45fDhP3zef\/vZ4\/vx8vj1brC5mF+LZ9ZhxFomdgwN6JMuYSU1PnXGa2WZ5GsMxgY96pc+z4ErrD6jFcfSKS7kq9Hz+Uj2KKX8JtePxWHepzJOH2A4hRJKSW9GF7II6XKjhE3lrLkAkiJB6V+TQslUJzflPfECUtFbYZeIuga7MbWauQ2ps5sRtt9BLiqxCbzakQWxTzZurBZpy\/3o8TfR7ehwMPKAr2bUZI+TR63w+n06n9RGa4Szgz0+hipECxwGQWlI0KNdgVoapKTI9A9Qcp76RnuCIRrhQQjelPkhrHBHrDBs5Xsubn9TXjkn5lM\/ozrUMWYEXrkHCdheLWIwz07nmMgSluBDcjlqh7dqtwO2FHmMgU4Vmxuu4WkvF2A0zK+AMYZEHL+Zg64yAtRaK+MAFb1MRH38jhWHLYZuM5ItfeeUP\/\/E\/+YWvvLGyvq641zziKYVVnJsT\/XhBoO\/3me+IIXiGszSP787zajhM9TgiUsbtICQTDi7B1iInhSzthqfZbvfOtHGYRUXpJvM5Ob5RAj0Lg1\/GP9Q3mWp2+EGA6iMGAgUo6XQ0mUTM1ev21lfXtNzWagCvi3l2f\/eE8KIidC3NUsFGcW5n\/fHHr7zvfc8+9fS1C5c2+NnthloensdJrHcbaOSSXcO8als3m4xJ1IZBoIa605Q0h64ZFZcgcTDH9d0gwNywds\/3fMnTvAML+2fLwGm4VjVYx0l+arIP3ingdrMgnPnNZNlwZjGJBhYhbbQbaZnBEBJ2cwU0mIcNm5iBGlHgZWkyA12bjhellrpjWVi0C2iELqlPJWE0Gq2Oc\/HKtmVDAwTYo+ksq+yDqXt\/WhbNsh10Lccm+Wq5rU7Y9gO\/Oxw9+i9+8rn\/9ccf\/sVfw71nVpWMF29uDm7+rg+fOs2isbxzaee1P\/QfVTtbXqHPeIBESZbg5NBbi0HZDvG\/Zirq6UdTapNjB9oyTYEhGX2pSVNruh8C5srHG\/jSTQRxuw7kDQTVw4eZ7KAGhpFyKvzEvDluGpefRwokZmrSfGGyvlYUGCaKAAMW\/I+9wi+BkTmuLpqamlZQAV49KPUpthCFbJxmibx\/+dcOYv\/J0ummevadUwwXrzNBpvP5zEwNRmWcwAv8AGT6rTBfJOjH0089tH1xQ1PfoxOrQegs1dKbUfOs1WmDWYwGZQHIQcym0xxNJyfHp4PewDGvXYLG37gVf+0Uyamq+utXt64+dXQywmcjHiWQaIHCXGTDf7C\/qWRTIhD8SvRavg0ckMSj2npnEIE2msNub8WbTYbL1D6dLt+4l\/7Ij32lanSiUAA\/Ho0B2sODU33qCztapl4rxC2je55jg8dwe\/P8+mPPP2b51dbaymMPX37hhUe+8Rvf\/c3f\/J7f9ttefOEdD1+5ut5q6c6lnmXT03DAMaoKcEO5dJSCdaNwtZLwEzTQ1A6RBFTL25k3nShxrGNjjQhFrXUYpQVLldILSDw0S+G8ntBWgTWPVJmH66lILs1koHFjKGGtjTSrp1PAUtO0thzH3Az7au7VbyyuCdD6iGbleDZxP1GoaYFEhUEVbQGpVCtPE\/QtzoB037ho0E8rB9lj0OCDXjIEfhsJ0CyGIVMRssEaQwBFoxD+\/3w3+ucrvX826PzTldY\/WW3905XOz3baKdkftSsbaiBJL1HEETpNN\/BtN9BQaF8+Uky0XNsLfYgAjRPNZS4Ud5j7hnRRxwHgg9hu0gmzhfPwg3r6SARt02aK\/6iW2sruZc6pFpSY7w+Zn0gEXjmwy7HrOnVrGomCOYlcUx166dwZhqsScrP1ucuynlMl4RQOYc8NB7LLKk0yeUN+S73BlEKz403k0gBjcZhtv3CrRZVDrqCSQEKzTDCVDNDSTR+tqrKtosypjhOyKztLMuIhAjdx6G0q9vd\/\/\/ef7f7\/LEbBpIo\/\/4u\/\/Kf\/3F+4c3+\/1e4QC+HHGB\/eSDiNRgjG6weLyUq1EIwLsRkQDfBEN3bWWht9Z6XrOxZhLe7WydEfcxXe0IWdTf9WEo6LkDHruVus31VSoESRUioqJJdCfigBgTa8QGAkT5gUYuM4yRkCovc6+EUPCAju3N69f\/9Q02bme1\/4662ttQuXtldXu6120GpH5y+cv3TpwtraaqtNYx4ITK7CuE1imct5GiME6jEKipRHbwQgbtAdBIhFkfDP6IFErhueKnqawhXMm6BPusvBOtqgNY3IRAYoPoPsJen6fPZkUTwZp9fj9PnJ+JvS6Ru2ddKEXdiEtM1MFzAsWCZdpJgdqaQO0b\/TzIpyvetfubiiBYhwt2lvrga0UMzmmq2qlucvbq2u9BgY18zjBWHnMGt94W6cW3ZkO10vAsEUwERO5tr9veGT\/+hHHvrsK2sEFnd3FzurJ\/3e7GQcZ7PskUvNyj5tNr7yx77z8JGH9LQyvC5zIvvJeL577+DoeIQYGDoEwyVGLRrr+UnzvAYHsU0OQ6jGgrEZs+Qs\/KEC+woIlfErDOe4GT3aIcSp22HHFNquT1JXIRfqwgGiVumfQgdFYya8VFQnqBTr1K8x3TN+1g2ZBlWoYFqsexSIc\/YtagW2qlTajv\/+D33DyvqmuSVeLRbJxYsXAS6wZDIeN2xEsPrJj328xohFHKPVSZx2+q2da+cWRd7WbPKS0IGrdQO1apiP1DkgH12DgWIUXEHnOGfZ3\/Chbxr012sKv06LuAkH7fLzn\/r5nfUVH7+jF2wDuDZcrkWp+9MF6qzlYHBczNfL3xQ9KDwwKeBZM8pO\/MPDcRS2STd++mMvH40d6qLthFez6VRvO3fsjXPrYUev93ctd\/\/OLjEg0JwWqdNy3v+NH+itDdI8gTLpZHMJ+G9srPUH3UG\/e\/HizrVrl4CLMPSM40PvdG8fwAeUFB0aVTDaKD1EPdADkxXayJRTpCfUMzRLvxgLqljrG8xAi6SlaMUyf2yx+IYsNQNungbB1AtmkfMJx37Z9mlYT2qbwLnuRW0ZVKmbgmmmQbVfH1RZLtfW1zY21pM0DlR8wpJev7PabY8OhpPTKV3DEzKrqH7bq+stkkQPLjjOaLrIlnqLiVCNlkzLrVYEMjNkM01gglLIoIamvEUQY5eA9Yd0LLvyb\/j+p9veZzvBZ1rer7f8X29Hr3ZCzKZZedUSgVrEFzH\/I2L4gI5XVjydE6cwQDiBpdfjBeHx+TJtszCQP04xJAZOpzUaQOEDCxVdxgeTH4hCyFIWalCXmuxQwF7kwg4ehKvUiC5RVMfP0Ly5lfpSPMNqEgy24CdjozkcisDNJDyIu+6ADIQmIAiEavW6+kZjYpZuGNyAsSAa3pNe2t2u4zuR37iy6oPw90+y4SQG2nxiVlFitftd0oO8zJ564rGVfidJtaxSTyHpGw4+HieN82tXH7525SGOf\/XlNxoT1Ir+xo2bf\/SPf+\/x6QluUxNS5jWjJm2VD2SMrlmYrdjRHFFsgJksS9AdO8fmPbe6sBEMWn6n5RFLomkG7ZfE755V5VXz9Umwv\/AIAxZJiqIQtBoOw21iMvWVF+UiXhifqOeRoAsDtpoO8jMOAqWV85ZvbhBAJOPR\/O6d\/bt3D9IENyPyCE42t1bPX9jq91uu74A7Hkbg2jgv0viVle7qWm\/n3MbWxvpAH1xHIaxQ37Cn\/Qx9kXZWllYf4zkJ9o1BYNBavmBW4hitOtNOCkwQf0CHmmhTOA4haBJbU7Oal8vfFSd\/fjb6jsnpHxieftt0\/E3z6RNF8YtBdJtcl0i7ad46ov+UPdTts2XgxgCVAYkdpE\/L6vx69\/L5fkPfYoW05s5GZJVFojdiNrqDzs7FTcJWHDFBzcliVlbe3ig8HEqnvcDPE72jPwhbTbeZW17ny68\/+7\/\/ShcSm40oL4Mb98ZXL+\/3uy7uybGSi+d2n3xid+Alk5mVllkRu34wncaHB8O9\/RPaR\/vrQWNyEIz9IB1YVA\/fHJdrr\/kG16Q5xvDkBQHQBxyrcYHjwhlThwY5As1cixZJCia24KfpS3XqvqQ6jaaedZVDIduDgVg4MQoQq4fO6YtqdVN1CzUN7FAgVfsmmuQ4pR4Lp+o65AUrqyvv\/+D7o1YLOrXsJcseeeSRyWhMWjmdzbwwcpaNX\/\/kJ0m8qIB2+K6bl9Xa+dWgH1KbgCDArWmBtCAm0yrChFFj9vg6JOt4rmZxyZmqcm1166V3vi\/wWzUxX6cF8cC6Qa\/3lc9\/usjmK4MAB0AAJpegOSGCWUlU4pPXRQ1AHLJkpMHZilxdkiI+4rgiBcTr7e0f0kJvpX\/jZnZvfzSa6ZV8iHsxX2zubI1mUydw1rfkGtH1vdv3SHtTYNjJ3\/2hdw82Vw9PjzJkoe+Lgi0FTSKCeD4Hyvvgcsvd2Bxcu3756tXLV65cWh30w9BdFvp0KRRIEWVtikelNNIN1E83BWoXwGCUGoIdxk2hBXXqaX5ipQQNxPBUWi6ajYXvv+FGP9t2\/4Xv\/nTQ+mnX+5TbW9i2XtNkpqKl1KaYjv61ybCFZnjEEQhiv95Z0Vc317BuIJp4lCt6ZEOhNzkaDo9GWMV0NuVyAgJOo360GPjeIk4m80ViVl0ZMmG58hxBPznGstRxPUpGL+oI2TF6SBPmKVgQMnIdGWDu2QutIlOCTTZQuJoVJhZgAGUTRPXzhpWYBFEGQtZbLuslt\/zkj4EwUuwd8mWGmsAr6EAgTKtNrRPkLISpJqOmOv86urdplrXJfygWME1BGFvGywHGzkWAO38194zH0VdgNApgx7wFkmoQIPhQZqhJBX5yXCM2rWmSn6Jc1MNV447kA4AUxw7CEC1SyCQGWXIT0lotHGj6QW9tpVHlmx3r0sBZFNbt42w6iyEC5ZNv8vx2r+v6Xp6nTz7xCLoPP+BAWWhth7kr4ZE\/XLp49d93TIDisfnCF7\/wqU9\/anN7E5jCaKEJ6xJfTFyGJCBXD\/bQrsnkNOtrHuGFF2gzNoM6PXy+228HKystzbLKp2p+i0itsvxXx9a9abNIc9qrZObBYqH3kMNGeqe9GivrBSMIHIhEElGrDYUcj80TqIjB17ozF7FNp4u7d\/Zu3LibpgRckgjGsrG5snN+Y2trdWt7QxmspffPoDcgO4NC1bg4DH3Ufm1tsLExOH9uc+fcVreLaKKmAllyWWonaFqjgmxYg9aW8jXiku7uwAGppnEnkn3tQh6E8BQ4Vu8oojTHE9v6ztn4O0+GPRyk5qSIASq3cr\/ihy\/rAwFaoo+Kuw3X6LfhrpyT0TtzL1bKomnuAkl0vOr8ZktLB8zdma210GkUi9Go0w4uX7tsaS6fus3xZJ4UznHeORg3HA+Pv1zkGTpbFUgOY6iKebJc7wfzfP3OLiInDB7EiTubLZ57omgFZZyOq8aiWfmVfXJwOMtm9D2fzk+OJnfvHZ6cTtFYgRU01GQad0thyHUx+2eBFD\/reyvsU5P6qB07bx2ph0xhxzRj\/INphGaoUJ9CkHUt1cAOhV\/UAgdVwdBRhxG6lqvPGjC2XXdR73Pu3+pRB1S1pkRbgwgcBJjIw975rneFUUjdWO8uta9evT4eD\/MsGY7HvcHK\/q07n\/v0p7mSPMhMMltxkV167ILlNLM4WWazld4gCOvPB9Op4g+DcU2wSjIVBfrYF7Hyk48\/9\/ST76xJM5R+fRZDuuNG49Pjm298YXOtozvPCgNqKBaqUGRShHoovynmKqPqBApG4hxRBmBMG485Ps1W1zfSonFwPNHjQGEQIZUgIrsYnQ6Totg4t4nyI9rJyQhFTorsmXc9dfmRq\/NkhhyV8TkO8T8sJ3UEcGjYqCVSztkB7qMo6LRb585vXbt6YXunv72zvrrWdx0b6CNGRcXwL6iH0SJBIlZAkCONNlpjcEh6CO2MqFY2+T7Nyle4yaOo9bFO96eC9q+2O2+G\/TcC70bgpn7bNtMR8mAPphi5kEvEhAdN8ROm8VM9mcJB+lpbhytrumeP6zOT2+1W2A7dvVu705Huky7ms26nw9ipr8Ao1Po7LHA8my\/SfGnpXoEo1J11NFOz47EeGdJNCJwmDlkz3uZREaigb41HIYEcNkRVS+WKArGyKcdPaIPH06IQ11Fajlcup0lODi4t4FLCXwOkpA6QxHAYBUNjREgBoZvoWa\/uETbCdvOVSGjEl4OTdeIEEVxisqazVEHaY3be4rzgwmrixgUUZlJHnOOUYSzMEg9NCic7RGoajlbLyfYtMo06HS2I7HWpvKFiQAUB+D7fi1oR9dNFXPdIVCEK1LdmGtqrg6Ad+c386nq0Ei53x+nesJxMZ3pKQVPLAvB2r4fvz4v02rWLUSDmQ6Q+tGPmxRFcluQPXXvkyuXrEPzVl9\/wPAGkWdX21tYzzzy9ubE2Gg0ZkseAKa0I744GkEanaUyQJ7BVOMzYDRskMyJBeCw0vLTRCpvF6qC9LDMsRqrWJB\/1dxPvjl6+V\/Q6YavdL7ScMwUeTTStMFz7eeGHAYbJPvILgxCsp3ECAmQG01ELtgQHk8nk6PDkcP\/09p39JOWglt4Egb261tvaXL14YTtqB1CYpbkmG82TLUEQGpPGpiXyLE9bUag3TVaykFYUbG6uX7p8YWdnc2trrd0mbvCCEJkVNYjpFad6qiIzPu7MVtlCkn4bK62PQCGlNlmOCIXIGpvL55LkvbOF0UXcEWdIqxtfcN1PeGHp5S5Zv4Vd6Y0ub0USxvDrdXYyL37obo5te4303Ear0w3MCjnr4mbLaZTxaHjp0rlWNyrx+Q1rHhezeBkvO\/cnwSwrKitvRf3QD3O7GpDvFs0YvYe1jjW5suMenawcDLUgx2qEB6dg6+mVS4mWB+VYOZCGtWcNl1\/Hhye7+8e7e4e4bPVNPmFu+0gRTMEq9PsMNDVcdmqeaDAPanLqLZm+dZCf9an6OFfjO7nK1IFlOoXeyIlq+YsaR3M5xz4X0k7N8\/pn3WOdurFPYYeiiNMU6pu69UVqvG4BwsxxNcIpmLBzbudd73kXFsHBJE66vf7GxsbBwR6p1N3d+9evP\/zmF7\/8yhe\/uLaxjmSjVmuRpXbY3L66DTdartsosnark5rFKeghjdALA3E9F6OqLQlwmqdJELZefP49W5vmbUWGfzVhX3cFE6lHALD+2qc\/PuhErUAfejkbkDirNciw28hf0pREjJMDdmVzHOSnAU9dwf7S2rs3Bj3C1vLwYFo5AcfmswXXT8YTepgm89XtdXpybb12+s033rz68NUX3v18VijtA8xoEI+pDqvGcDQGd6EIxUAW\/OuZD38YNE6gBQRot1tbWxvbW+s75zZ2dlbW1zu9XtdoOGgYA4kimxBA06Ya9ZmOmbHUWlRrFHIHOhgRgIgBM2zUmsgRk8dBgjKlza7WG9GAycfPCn3RJo3Upe6C7ZnKGhWh8Q1Qe31Vt\/nlmGWQ7VbQCr3DO3uz0SJOY6oRE3AtWJpkqW7YEhs1GsfDUWXYCwm41sAPyEwJbpThIaemW2H1tJkv06xIUpOSc1ahj3HMiFFuvvnMZP7seHY+Ta8usstJfj1OV4tqL\/Tx2m5hlU04oHsHXAIEyFkUZbKIFSstBekME3YB9QAzxOOcxTUzE2MUwBX86XiBY4c4AJH92DxBABO4hNo1o3SdKRznCBU076JHz6woCMFPr16PKRbqEo7TNRdinowYrEaaWt1WnzUhF3UM0Xo4CMeFhijLRRaO3e31FouF1koY0dCUhGICr6bTHKz3Pd\/e7HgbLcRW3B3lx9NGMo89W887KAgpyu6gr88JO9WlCzsMk7A0IdXQR2fiLE3gCxpy6eK1q1f+PccEFM1N+ee2d559+tl3vfSO9737PZ12tMxzvdajUZn7UB7MN6auFynAcAWkmg+kFPoSneNjJ+dW2uvdxtpKt8IGUE7bSZ3WuOpO7a5n2XovBckWDoogPZmjWYA+cZjJ84QOxOmJicgI1TnIKT1+kMSEajXMIEu9qHOeHh4Od+8fTWcJGolqYZU48qtXL2xurnS75ND+dDJzQXF920apAGSjCu2oTeNoHh11ux1EQjWkSKSPQhKstYiv28HG5uqVK+fW1rrb22tECf1+F5MmJNLkR73YUPPY5gNrxn\/TMm2wD4WohRmLYA73I3bleiB7tSxfygqnKideM202Z17zM1HwM373lu85kQdrNZ3VFG7QIC3QGNqlRMQ8d4BJONiGbSd5udp2H7m24XrAQUVudZ6YoMxbnnv+Er5kqanOvBpOk8IKd2fO3ePEtZyW5zVcv3Ka67b38M\/8yqWf+WT11NVJp91Ii0nLzbe2B195rb\/QuxePI+\/NF57c3eyDYZqzbbiyaAt5Vc2qORrO7u\/uQ6SZOJWhGPEJVcVGwwTGXjNBDDExQe2Ga55wCqFrjBpRfTtW1vuAabSgYIiaHJYjUCOycA7oKD+M28YAOcIBE6WJU9iYIgAz\/8aWOkCduVAXsaUYiSgLEZ\/VrWa5QGGif87SF9u6cj06rs7y5KHr11566Z0c4T+yz8FgZXV1dX9\/jyj+4OTo+effsf\/mrde\/8hW\/TXCmR2OGs0lrLext9ELX8xggw9EyqIJ417gcFRon0AbgIXyOhuvGQeVHrW\/+7d+uj+to+Gz0b\/3P11uBbDIwq9Prv\/y5X8ymI\/JtQD1DNZWBSJaSu+Mq4zwTEyd0CqGYkEC+GwlxvFQ07JMfHh+Praa\/Moju3R0eT8iiYmQIPijFK8uT8Wj7wjmMHoBKF0mcLt7\/De8rzXe5pYeSuzwmCiM3l+lzySiJURvdGUVKgI2C8qLQk+I2CYkoQkB+4PZ60aXLO6urg62tdVK6zc3Vdpu8AS8b60tAxgcxbCm9cVSUWuF1ULZQ1rOvJYeNw7FyECTBsKAGuKxsX\/dbGy6eUhGTZh7rxEBZAfs0aKg9uwFXd2FaXrY7rW6vQ8ABExkOFbUcO7D3bt6bDecASxfNxCRNSB212gyTq+aLZBKneDNjsjBBH0yS80TLzbOU\/CMDro1Ko9NippgIS9PCVaL3LVml5SydxveNRt89Wrwnzt8XZ+9P8g\/F6fYy\/3hLz1ozqLzp5UtcPqPT+ztpSJMEkrFWn2JyWm9vxF2PtC5io+EnFfWZWfMu8BppqSSK+d9cVfOBwll+1js1ItGgD35K+poVgG52DHgIcPALBAjUkYzEccEIjOYnBNAdddihHerXToQ6NK41CnJuetX0fKLHIuqaNf1UI3jq9Dr9lXYUuquhM9u\/fzKZT5bBNGnGs3kn0NdT8yLzPb+3MtDN4Ub5yMPXiNVQyxgXmOtT4Bpu054vYgKCq\/\/e1xPAsqYMFUSult12d2N948XnXvjg+9777pfeeeHcuYvnzyfx3NUNWz0x1el2iQem0xl+EtbAMlwa8IakV1rOla1w0G+7WrFe5XbnIHHmVhvrIMQEE7E+ahP\/YQRhGHS7Xc\/3MTygstT7CmXBngf39dIkTUsbvKAoYkL2erlvfnQ4vHXj\/nSa4B04uIjnOPLt7VXC+U4nQr6FwV+EivFnhFu0TuCmO7geuu0Hetm+9EKhnr9YpIyrvmeB0uL7yRbQDhRmfZ02N9fWBxubg3Pn1nu9fsu8bgsNoFWiIghTHiPvJT9mgnRZqRqvlcmAGnWWDefIbXykM\/hHK2s\/vrb2kf7Wj4e9N\/124JJxE5sTLaRwnwsQh9EwKbqJO4l\/2YFUfXw2zYvNQfv6pUHDUnBK2VmP+pF\/YXuj4cArIcPpZJZV\/smieTSxU9mFS9oQN8ruPL7+8U8\/9r\/9zPnDk3w1ip96rhn4LS8YBm7Zjjqv3Jp2W7\/2Xd\/0hcevKCPQ65nLOJ9XWpJlL8vFIs5u3tyFmwQEuEvsUTZJNGlMkZFidXg7DrJvOMAQRCFjoMJbVso+VqAbuliXWXnA8boa2\/pyLJBa7JuDYqAMx3CGHa3QxTpNIlWjo0DtrRUGBhcEGkpA1aba1o5qskVW0CYTNl8WoTuOG26L3eywNXKkYsEFzxApP\/uMcWPNk9NRt9vb2Fg7PTm6f+\/mPI53ti\/80k9\/tMwzLwysYqm8wW5cfuRC07UD26+SWLfOzS02+lPvKstOp+25jpAOnQShbHuRZWvrW+98\/j01VYYZ+rf+5+uu6CkQ+XenLKZf+vVPba\/3HT0LI6bCRpQDNjt6OFs3XBAqsmYrqeielIICpIhgcCUmUMCcl0fHR3jt9bXNo+PJ\/nBhO\/pON+KL00TZJfnZMt8+v42T48LLVy9H7YgdorQkSXXLwNw51lr6UvfU9SaZB4ZPX3h3NLkmnsBtNpuaTLjmP\/jjlikUlt1OuL6+sro2uHDx3NbmOqenUy2FoiZDoCo6rWEaJYQ2c7kp+o52k7GtV9VmGj8fL741SZ5PZ98wT74paXyyuZy6VliCBpY+h\/VAJ9nW+xTaYJ9iVAhumS0NbqytrK0APlQhfaLjbidq+e7erb3paBqAV0tNuWGeDJZLcDxkz0mWD6dzTQOUmHsBDhOi0Rq2hnSMrajQt7E8ivLnpk2K4sjVl6QxS32WZrr8\/ZPJw3Ea5WVUlhHYm5dj2\/rJ7oreiFT6CDUpYToKoRkVpENah+94q2V6gSpEAwNBCQbIwbfmCM1PDRZG0AAKwvH6CUAuoZppw+QABj1qhOEq9mmZSzmieRET4qGXDKlOa2kWUOUnKUHUilzfB744xfDfkiDE8ZPLIdU0Sy9ylQWOst9LkmRp3idNTXpkpyYDN7CyutJqe\/122GkUo8P9GH8YrUzny2S+8PQ5DIUmaPlgbQ2gKJf5Y49e14vACd2gWY+guzALSZFyPvPMc+e26xeWfLXlNxwTGCIMaJp\/HxTc6qA\/eOzRx9754ovveukldrZ3dtJsgd\/VQgrH6nRJu7XUrNBsT0IWMIj881vdTstpt+24sPYXrczbskOv1HvgcSTwU3lBpm9B6kbgdDKZzecIFnnzBz5yHEcj+zWxNxfgNbiKGC6Jk8U8HZ7GN2\/cG43mDQulwQ3nQWBvbPa3tleJjrVOUVMy0iQu5xLqGH8th2E78lvopad3D2iwFAYCarBDNSmCWcmIxhh\/p0dZ8iI1E4nhztbahfPr58+tra91tzZXtjdXfN+BAAImIg88ZJakJsGRy5EJKahBR4n27FnD\/nLTf7nVuh\/4hz5\/wcI3XzEBNJsFoEjezShRCtFZKxakqhHo0Y1zxsEO9huE\/tXzbc8nwZCt7Kx3W61mt+Wbt7M58aw4zuLTxHnzqDlLtGKFPD0tM39pX\/lXH3\/sX368h2Zgcq\/diQkUrl+o9MjMMj+3Pdw+f\/jBd7z5xIV8kZGamfs4vkFpBxacDMd37x4cHY6Qn6tHiRinIc\/MNMJFM9crI2JIDJkdY1NveeizZw0E75oWUjUMCFYjB2owbFDJ6J0kZYBAFi7\/jc8wnDTxviCSyuC6HIu8rKlGi2aHLaI05OmgPLGZ6JM2SdGxRtIVzQeIyVqiIeBgX82abf3zAeeXUSt8\/MknHn70EXogZBiN5+vrG912cHK4\/8qrX3CdcGfz3Ed\/4iMgi2bLSEuXhddxz1+5AJUYfzqbk5mFUUQQ2Wq15vOp8RkK8prgmgYd6MtzaGbZePLRZx956EkzBDb6t\/7n67EgYeExVhqEv\/rLH4+8RrcX5Rn2iBglSMYPGqMT2Ct\/KAoS4EICY3RBgjfPviEOGrItX98lXuYHu+ON9W0ue\/PmvufrufYw0BuK6C3D\/or0\/MUdomjHbW7vbKEnYD3SJDOWoOspIhpWNAkCiEBifA7NF1pwIN0wzMdpcUoL9vSVFs2IQnCmNUmWr5eyWEBMt9vPsuLe3sHh0dDTY1D6uo\/8FBateFSUiw\/y6\/Kl4oduFTT+69Phf310\/C1x\/P40fU+WvytLN5f5x5qNYyck71qCQwavatupFRIDkXbCCoMMtaJWpRJrCBsA0ysDeuAS3DuAhjdym\/bR\/cP5bGFSnQbRABygscViht41bGe8iCcL81oR4yndQIwSt03Mwb+yV34YAtiXZLBNV1YDoyRa\/O5SD2j97nxxNYd1xnmbcui5P9bvlThc44XjOAWbFBQI\/qtc70Ug2kYTMDGaPysG8ZQAwHCzr6JroBxLhww9Z9RETsZCJE3wjfoYEX91dZgm8kzhNyEm\/9Az7SMCjVbxB3mInloCvsgYYQJ\/DJZ+xS6SGa6URxIooIooK0pKC6Y7feuX5mApDh46COGoD7PgC6k\/sofM1Y1VdGy9Y3Wa8YVz\/StXdw7mzaPTJJ2TXVuh6wODZaPoDQbkPn7gXL96schTZGriHN\/xFLwu4oUfRM8\/+8La6qYZ3Vdb\/l3uHfwfFbzmpYsXX3juufe\/773PPPHU5vr61vqmMN5tdtoEASHhmueHjWVydbtzbiXyWt1bU+8oC9GIdDEhJQSaxXpFD7BPC2Rn8xket93pYHhs4TxyRcxcQsMINi8y5IJ6EFQi4MUiOT4av3nj7ulwAk4gLXxN1HI2N\/sXL2laDzoRIhxFrrSph1yNWaZpyhFwWRpr0sFcn8FW5or1tjtENvrYBjVbep9mi1NcjsgVNuq5WikrLZcF4DPHKjzXXl9bOXd+e3Ort7Mz2NpaW1tboVuGQH0GaaILo4VacegQRhZQoZB0GaExxufRHNGzTdCNY8I+dPMNQ1aIeuaojDVCFQQz\/NrJMQBqXdpu+aGidcq59U47sgCBCg9UNoj984b76m62d0JeY5aIZtRrzrOymxTnv\/BKKPtotspl9ObN9NLl8fZGM81neZxe3RqttYHyUB9m9aGRmKAWxHg6Bfj29o7jRf3xchFD1w\/iNrCVrfbhG1sN3iAaVgWTKSKUInyvb98aEzIWrHFpzljYIbaYezFczg59qV0ZNlZMEqPxw1vd1jQGT6n7qnfYsg8B\/7oIiNUJ+IOs2akrc4YNPfBTvZhInyKaDSzWhcO+7xETXLt29rLh2TzZ2t6qyuz11165cfP1ra0L168+9Mmf\/3nSUKLHwPOarrWys+q3A2JeBBsQGXhenMRk\/0YhaVVIi1agcpyazxfksIm+TBO866X3ra1umY7+QyiwmE270z3YvXmyd3Nro0\/mIylZeDhCKDJIhWwlktHtdkBYVyhKx2R0NRLTM\/MSFSdtIfLx0dRzw06vffPuIbF9EIaHh3tREFLBD8LpYrayter4mOcanhJDw\/ARKxci+m63EwT6rl1K8ICZlmV9FutWmHA2gaQHkgMzywgxqeYXbSRFwV5xMKhHliW0M5nMX\/7iq1959QYWX3tP\/kdPaz3mWvTKmIOxaDScgTBgu\/F7xtOn5ougLGz96SUNltP4vBt9MQjlbKiNN4C+egoWFRQbhWzwQSeNnnOc\/uiBrGx1bWV1bRWjJDPBCgGodlvh0sne8Xwyp6YJCIAdYqMElkiN42Q8m2eFvklNW7j8pnklBr3U27q8ZRGYCD81SCzKiIkiw1HAvfxQtdxy7WPfmbj+1Hdzx7\/pRj9ErtAg6HUJGxYJHMDEzuKkxWzODw1BJqbsn1OIo26aE3CAU+a26dmQTUBm7N+E\/lTkYC0jeMWWn1wCCJv9s7yCYjrRoLjEiEME1FBAe3CMswyEg7iJuqaAQKGJ+Euz+sn2wdwDRdMqAQIs6kuW0h9TXw9D6LUHrU5rsDroR85WL\/Ob8Qfe+8hgxfvMq8PDkyxfxJ4jvhD1OL7bXxkkWdzptq5c3iHhIwigR1gAUeq0gleLF59\/5+rKBoR99eXtiQnEH1NqRSC531jfeOqJp97\/3vd94L3vvXb92oXz51xrqYf71tax5WWVWl5nVrWnpZ8uG\/PpeJnoUyikTZK8MX1fywjy6WKBkDqdDmIDGQmOwjCCqfUbirAFdAKZFZliN9cL7t8\/uHV7bzicwyt+F0UWRd6Fi8Qn\/Z2dDblefRJbn+KF5sS8QDcwL8SuhzA139Eygja6bXRFgQI6ulgg6Xq2wFy+hAYCAi7nJ9pDZSpkuhece74LaOGWUAm0qxUF6+urm5trF87rAchLl3a2N9cDH+xApnJFEEBcDP8Ky9YrKxouIOjl6bk4Xi+SCaGS5TUb5AcNm6tMNGEsHozTTQoDVmZuqrYXtK\/Izm9G3V5L4FAtd9bbndBqabW7fTiagj4HI+\/NQ8DXsXzf8iLbKrJ54gbu8vKmW1rha7d8E9i28sI72Iuffuy4EzJIdZxkllmS7QnN0FoGHJPExXF+cjI+PZ645lY3rBBDiQTkudFdfmifBjAJTvF3xnQqwwVTGBE\/lY2Z2TwGRX0dN0XCkFDODtb7bLEPKlNkHybx1I6xcLYwo26BmvzkIrMVCrPVVQZA6zpQhNZxpD5IGybKUk3+0d7ZcZW6QZCKgP2555+7cuUKZ0G5eZw+\/PDDyyL54sufPzzaf\/SxZzfW1j\/xsx8NXA+o8H0Xh7R2YcMJnHYrVE7QqEhh0jwj3CReJFilI5iLRifm7nVGuOk44+nc91vvf8+HoqhTE\/B1XpCRvJnJyckss89\/+pd2Nnqu00C9OCH2ajpG9w3KJSiqSI+rYIgWZBtdMa\/Z0dodfqEGAAjcOz4aZUm1tjHYPRgOh2WcxnqSIF02LSLuxsl4WDTLR594dGdnmyhNAlsqQUW25nZhM00TjJesEvgmA0EWwDqSpQtUV5rBkTgBfyBc8b30Qq800N0B5frEzzFVOXHn7v4XXn5tNkvN1J7e11LrDxfUCknRxaJfQadGYTeTZfVEHL8ziw2HdFuJK0gGftHzP6tZR1JUWjlLALjI8NK0UgcEDw7SI4c5DqT2B\/219VXdBKAUSyKebjeKfP\/WazfSuW5aMxzw0EdFlyXxQRwvxpNpgmdTNM5fyYhEjCm0Sj818eyIctGuEXEWimVlZwf1WCBju1csf65q\/kTD\/mnX+cmm87MN9+dde9d14ryY57rdSVbChVgrV4Gh9Zs51D4BEQBhIBoKjBtXDESIwthAAkGoIQnRG+qUnvGz7r3ewZTYIkcTHMAcTtUBATgvZ6+OTIE98E05ink5FUfqs3WprZKmOF0jhthpuqPUQ1YxDcNGaQ5RHXxT3KrD8IUmLPLk3kqr1dnpOeuRVPCxa+dOh9NffXUympTLLAt9D9aTl4ZR0F8dEMiurg0eeugyfKIdhAWfyD6rJXkCtuA89+yL\/f6qGf5XW96emOCMEVLE+q8+KpXGzK5cvPzc089+8P0fDEP\/U5\/59ZX1tUXRfP0oubU3XUzHjebScoJ2q4d7y5dlKiMzb5zW6yELdBUpiMGE0npdf4SKcopCD3pUIAzpVndWqubR8eTNN+8dHo4AB2ADUZFnXry0s7m52ut3CA9xXTh1BMMpujCCl9QRJwfZRxfZwT5oXAQYBeIIouUs8ISY2XItXUMbNAdgh1ls0u20sTicpe+H\/d4AHUuzFFvKs9JtBjE+M0sYRKvtbG33V1cH585vPvbotesPXV5d6+OJZLoN9+nh6XcMT795MX\/X+PBD4+nvncUvpdnLUfPUC\/B4ejLFrIOBZEGMYlJR7+BF0HutmFUIjAoTOm+vBv1Bh3381MYg6HX8VmjH83RWVMOs+cqeVWZApDvodc+\/eXdlOJ9d3NLEVuXsnt9sj+er9\/YM7FbpcHpjpb2\/NUAMblG5lgO42pbeNgrNRF1wbx4n02lysH+SpuRV+gqZFNXMZ3AWeJfASlIoLWAGyQyN2qIzqmBmWTQ1omCc44q65AyMydVmadRLsnjrJwMDQaht7Fr3TSj4Da7VHQ3q6iagXpCO8nABF2pHE\/7UVW0SR5qqMaUuNFu3T0f0p5oPfD8FYmqy2XKwRhMStlYrevb55y9cOG8gpRiP548\/+dhiPvrcr316EcfPPf8uhvHZX\/qVqihJLssq76x0orWO49k+QTD+vmqQYtb3yOED7aKHGq+ZB6JF0L1UvlI8+shTLzz\/Ho6Lmv8QioYieVtWp9d79eVfK7NJr2teVCA9AERRbLkkBgyaGglK3AjX1mNvUj\/sVGIliNTcvKYPQPKjw\/Hm1iqp4BtvHFTNBiBMLeqQ9GbLYm1n49r1K1myAGJI9jXxa25OUxAEwgVWMGz6RJc4BcggF6Se66GDBCvD9AXZHIQeRzqZyRAarU6baprXdb3T4eSLX3p9f\/+0USkaUO9az\/CvZVfvGwvRS+v4WTUV8RA2r+fxh5f5pNn4Yti5E3h3w\/CnA++nPHfMaU0rcKVSg9pGpI0PdjAK2q3bp5i20b6i3WmtrK9w2uiwbqeurPQY+\/6d3UZRtY33wnhmiwWYRsukRsJhQn6FY7h\/8YcQ7S1bqLt+qwt2OCVJQZ2oUHQuE0GBlS81dsPwZujf8dwbYXTL9d70ndvy4TIwooEsM29crDRFJNFDogIo2jG2qg74X7AgbVAepUlESr2MnSs4qBqmDrSxrQlDcLVFU9ipj3PhWYsGYThSe3oqcC0NqpOzq4i9JCKZoUGAun79k6tMnQfhVw0OkqkekqegTvRk5rR0HLI8BG1bfuS3+21U70K\/7HnLphs9ev3CcFJ95s3xeJIhSBLner6y1Ynag26SZe12eOHcNlDf6fQTPeCRLRI97qgQr1i+9I53c7wm5qssb+e9Awooq5DA\/NX\/mqM6Lq6V1Sc+9csoVrHUOyKIL8fz9GQ4OTkdnU71jWpsxvH8+SJZMOgsxxtwLchL9o7JdTod5BTHCbl4biI4iZZMDkMvliQH9+8fHR2NmxbS1Y2uKPQvXz63sTHodCIYTPoOLbXwkDqXs0MLHGTLPjrBjqt1KTagzGl0czQam05jBAxMUAclY5\/2CVn4L1ZsUfg6BCYRG7brp2YZPQiC6vi4c+O\/aVDyW1ZpkmR57DpWt9cOArfdCXZ21i5e2tw8v\/oH3rz13XduP7eYvLCIn46TnWS+vsw\/7\/hf9lsNPVNdCiE19af1E6gvP9hSarOhceGinqWxtgfuYNCiAonU1kow6EegzTxJrar9yl48Slzb9nvr0WO\/8oUnf+hfDe4cxM8\/P\/aibLYYWlWytdp9\/eYK+07z89\/+4duPXM301mqcmFeaNUqKFvRAtibrGA2Z0P37h4f7p46tmzK2lvfofelGEGeuDhOuZzWMOUmVayOkiHatrzpbKyDmGjFxFVsaZKuiDxAoOKMF5Cinj+BMYmFOqhcdN61hyZoWMpkmNJg6Usm3eoREAzg1CpvbrgY12KE1tUPWgqdRxKHCKY6zw7XsU5mfUIJqbWyuveOd71xfX2OfmH86jR++fv3WzVe++MXPg2dPPvHC7u07N778CjEKP0urWD235rX1SYZ0Pq9ykkgY5pmnjpWqMgrGyDEICz2zQh4sIzh2gxeef\/fO9gXx6D+IIrB\/sON50XR4dPO1L26ud3Q3iCK8Q0Ay89rrm9sE5iKjWsJ15cDCTolJiYPsDsTY3zsCLlw\/2N0f49gQE3lhXiTpMn3+3S+8+K4XptNxmizw1VgrfVABsSqrM7PN+L8sz1AcxIHVIwuOROYzNnQz6A+otogXRgGUOqAnxCnUZQtqR1FrOJq+9uqt11+\/LV1jJA8wh6HUCkaRUhmvxzEp7bLywTPXDi0\/cf3PB8GPhtEPO97PucFHo+AnnPDQaaPcpR5MPDMZWmBLg+goDeHwOU7LHGRbm4\/prtFpt9rdtrJxvekBPSx7gI\/j7N\/ea5MseMFkpDcXpUXGKCB1EeuZL+BCMRcUEoJhyGKw9J8tRT2aEbHlGBYNG+lRUvg3yNMeB5du6Sw9exlYrtc04bCmNbE9mFAGnmU3bEUfkqiMi2tlt8CqpzfUGysEe+WfTZDBVXSiuUwAgINABmTQO13ReS1QRoTg4EPdIKUm2JitCmdrTlLqS9jWNck3pQYZMTqHVeqm62upwCXwlv36LEf+P+z9B7xlSV7fCV533PXueZMvva00VVnetqumkQOEE+y0BIzQgAABwu0IhJFWo9HuzI5m0bCSQAgNQjD6IIRpaExDG7q7qO6uNtXl0mc+768\/5rr9\/uK8zC7YlWZ26CpQQVTWeXHjhPnH3\/\/jxInDLXS+2Gk0gv1AIwyDdCcNhCCC+g6zTyXdvIehqBdTS5OZ1Djyss7hxcpWu\/\/8q1v7jQDny5zJhDaz3Kyd0wsjiXw+12w0Aj\/wwwFXrKCUaybTbrUIgh5+6PFcrhhP5I+ZNLEvaoJGItMBmpVEZRUlEocPHz1yeAmaZm3XGvWH\/XCQsMIw5XcH6+vbV66vLa\/tf+6lG9durm1uN5vtEARCBaLtNCGwbHDU6bZBtDjJLAfhrTMaXsLm5t7168tra9sQCLy7DnY9UZ8oLSxMTU1X83nCMyebw1pDYwxYJyY8NYGKriA2HonhAxeFHIYRGKcOOgJ+2tvboxUZPAPc51arRR7uNFc5oQgyPcS8gs73PBs2ALxisZTL5bO5LHR1sy4MjupAvoZjOAkuSXS6wNLqRz487HjJ+ZlivegxowHxghAm2UADVG0bWxr02r1Wryu40CTiTgFhJiJFSVkMgfbkiHmRNH7J29SuiCHGrdnr+Ulrq2MHo2IikwhT0eKvf\/Tsz\/3GQjtYvLl6+Fc+kMf3SgwyQX+9nPv8X37Xa7OTn\/+yt7\/6jkf2CrmMA2DjftAPgwgd18CdbeyHep1Lazp7e63GXkdPeeXIoxgG5jVuKAWORTx0Kw4B0xEXm49GxmgnxRkoCrgHuwYIBNEV8YLQeBQf5E65mZd466CtMeGaodFEpFhQhZC7rpJ0ihwyWqD98eqM82Z0DXcpNyujQja4g7XiPLc0BF0Z7Uf+3ijc5RqXxFwBH+iplast0FSmnM4B89bN6+1WI+t6OB\/dLpzboS6urRagKYNHCbwgJbEjw6Rx5MwZoMYHEroch847nbb4YTTc2dtDLx47+sV53ehPPoFI4ZLLOEmYbvJHz1xq+aNWJ5B7DYOa52Pg03A7VJBh0uI80gKtwA6EACnmkF00mfmUieyueZ850272Svn8zHQx8DujcVpf\/gy6S6cOHTtzOIy6rp1GLUO4rnmAiGjv7u4i2owIW6BqUDgxCdAMJOiCV1YuFSuVEqyhb2g48suLhUI+n6eJanZVk0K\/F6ytbt+4uer3dKQy+iG2BzFfwQb0JoOhSchCU0iJ7up89EQ\/4d9Oj34ln\/9wrXpnsnKrXrxVyI9yReMQ6MR8GJr6JAZlvq9DpySCcjqMUywRFMphMhoDXMHF3EC4XM\/NAbxezYgQUxCdzymK0FqI7WBx6ECo1VdAbdNQWo4Ud0uHcQmZeHyTkZxyJTEc4hGNEw9Ewdf6zUNhYA0Q7PQgCedjsUdpy8tYTkbnwzGx9DgllGousaCZTuiTQMMxCsTxXMINRUSyMOBczgGCQxHVGJz\/gefeGjDjc6UTCskDNj1zBdUS0rvwm3G0EGJIpFMQiEnNG8FSCLiG+oQNDqaJCUngM+6cgWJQpQRNP7orD1U0pzAGCfugJ1zKiBZ6UONpAXw67+Zw+ofpPLw07PvawEbPeqMN2uLlgBajxQdMGXz53Whru3nz1urq5t7qxt7uXmd7pxlE4y5sNv6imfIvsk\/AnON\/SqJtnItLxszx0OK873fIZ9y8doImtYmGapnxcHd7\/6WXr+\/tton11zf27ixv3F5e395ttNowqJfNFtDAw4HY3Tzm0VukBNxNrFOzfev26sbGLh6wsUp6UWtmbuLw4dlqrTA1WcMuu9KxCkOhHFSHotCcrsB3HHrCKORRDdRBWqlDieEnOZsw0D0+QAVQIt+i26Et1IMJYBfDZBBzGIR+JJdCg1BOP0guPAYr4OvhEsLDpVIFZu75YX+ASAMIkYQdBandhXoPwzkeySIlEoThG8PBsYtHv+TZS5cuzS4tVQq5FIEJONTxVeb7DfCRWMmctiTkqy\/D9sgJt8cJ80SGYZIEVF3futUYD8YIol0NBnMvXqv3dYIBqDn2ux89+rsfdLw0zjNx0fKpw7\/\/LV\/\/yYcutMNeseBi9Yi32oEegejxTdRv7O3tN\/ZBP\/7c6srW\/n4TkFErxjmRpQQbZAQkuDPr80ZA9I0oNI4JwrKwAMjkFmgkMpNbIOur8+OI7rCUNDFzMlMxmwyghsyAWUKkXzIH4muEn59xkntu6AvFSXFNrgwXCz93RVmiHzywkV4k0ye7UFQj5BaVrWci9Ce1aLqNe4MBuGouxt8B0fTqOtrmwsQpxkmCwPiOa2srdiZF1KUVJBAaG5jAt7JoW3RGKnbj8GvpB\/gxLoxjxkXTAerA0qmobi8MUGDUAW9Z77\/s84z\/SBJp44z5Mz1\/tDo1v73btOwsiMW2gB84WSyFW2BiVaSbmsY+QQc9448XtA2RpXC5iZGt1EqtVtNOj7PeOMLDj\/o435Ozk2cunolGYa\/X1lvT6TScA0eDfJGm14OFyHd1vIkPT\/ETtU6fRpzMlv2RFrdEvJS+WF8sFWPTIrj02TeI6dDF+vrmjRvLjf0eXiimOLakMbcYOLVYyCyAyriUStItiACiyH2on0p7iUw2aWXGdpqoOmmP0+M+RToDXqf0GAY0CcVlPAzwIbBMonPABijumxFltmF7NdRymvQYCHC1TVgfrdUmKrWSPyqUBL18voCQCi96yV5alUmb8ZTonD4ZhbGYFyXkSaomb0NeLL3hyaOqh1H0V\/r9\/67T+Pm91n+\/3\/qrvcbJ7n4+bKXkG40Slh70jpOOegIcADIGW+jSQyKZbYajQ20lhQXw6vGnXe26xz+A+Lgg3EXCRQP9k58ISDSEmpAYUMmDItQ7gJJhJswMUKnGVQQwfiH146lpFgMUq94+oGvuQjLoxaQAjDpcBWEqzV2GoCS+CjlDPThAJTEQ3UuL6FkXiZtG7QC+69YKXi07SieJPAcuFmuY2NrGJQV+hXPoG1vRi\/a10EO1WvPcbKQPVIL8RF8ncifanXB3v7O6vp2xs1+szQSkL\/Kzg9eJ+b2stHqs2Z\/7+Md+\/hd+IZWx4BMpUMr0LtGYQHJ\/b39zdU3SD\/YH2rsPC2Lmdls+0240ezgHUYi75OIzqjsi+063sd\/a2+3cubO1vtEAm4ZFURHDmdmJyanSwsJ0NqejCXH6cl4BAlq2VShof5aIYzQCxM4qrPBi1uEW1\/jVBhoCDnQtFouG\/NIC+sJeSodcGhYUgUkod5ipo+91GktsPC3KqQ+XxDxNgYYx7wHTv7wbJo6Am0Me6Yg+\/WHk7e7k9jqtan6\/XFmfqFw\/f2zlgYtbizPp6cL0ZKU+N3n+xPG5uerMTK2Q9wAAOZdTrGcp2pHLqDGow\/FwomLXylkUqz8eTFWyC1UvGFvr7Xxj4A77EayWm5py8k7mM6+WYLVkEregsLy1tzjZrNZQSp3Q7ziZaDjQy7DJFMLFNAAbhcuUyIAH1Bge2+bG3ub6DvZbAQ+OFG36JnSQvzyenZ2YmazhCxkNL4MqtJrFefhe6wDaAGwWgggUjOKnDlXQFJoPXRJDGDYy\/gLypgclyKvBqpKhRmynGVPPkmIHgrZ3kf+FxQMKKeGnujboisuBh3JKqGya6LGUhpUpOOiEu+IwkyjkCrIh36FDi488+ijUpEqj0ZisTaAVn3\/+I0U7ncvXzt1\/\/+rtm6s3V9CU\/sA\/dt\/xcrWUtW2\/027u7RXyBWQf1cbIga8ve3W7PbplUsVCEdcPXwUrR5h7\/tyDJ0\/epzBMUP0XnoRag2sRVnMnEY9hnj7\/6efn6hOppAzmgWts6krcIMQ40tve2mCgphBOxJapE8mRfkwkZCfQWF3bmKiVYaRXr+52\/J6bTT\/wzEP62g6KPo2Ln8DphCXFh2Y\/Of3lFCVrLNfLEn3GvkJMeqyUOJVBDL8BCA3x8nu+TxVCyEKxME7otN2uH1y\/tXbzxro5FkF0FKgm0RVsQ\/8kBuIXnZDnFnZXH80bpAbJQA\/lx4kwncn1u1U\/KgRhKfCPRN2J0bjpZvpqqNFJNGQIfpoOlTR\/M4ryplDjjsfFcnFyaoIoBWuK4zIcRhP1spNMrd9aD1pMwkcCmJS2UuHCDAaFfK7R6e52esRZ0lrm7SQTrUoE7vVP51xjFDEsN\/GiU6IDZnWcGmbC5PhC4H9HEEz4QbU\/PDccPh0FfyXsLSYTz1mOj+QjZ2otgUJ81fvd\/skoVDYxDj9VibE0Lv1LQKEHSEBY1EqLvjLA1MOWqrZ5YE2Ku+IqzHA\/iW5XsEcSfRF\/OOjuo0P0sBlCqgSFBoPRf3yLwrgTMhBfgAkbNNRVfWuTh6aRzeeIVxlK61oMrdACZkWjER8kvXKukM\/PFBPT5SG4a3b9aiU3Wyt88vrulTXCvY420CVTcNcwMcwV826JWDKL\/wbl0Vu4XWIWMJBM4HKNB8lv\/OvfcGjhi3M4AemL7hP8p5K45yd\/8l989sXPIHjgW2sro6Ft2RBhd3vn1s2btUq5Wq1gN8A6xgPcBj2\/H0TYn2aj0W61O73OXrO532yC9cCPgnDY7oZrG3sbm3thoL2duJJWOlnIu4cWpmdnp7NZvT0PbRBU181CHMiLiHLFM4BLyCPqcdyP7SdQiKlOXtxjyB\/7EFEY4Tmgr8kTQMTORNwD8+CuVhflUOMCaofdXb7RCRvUpENmTX38cXrAC8Ek53M5Mvx0HC019\/wOvOrVJ3YuP\/Dc5dOfv3T2tYsnXzo0uXNoseNkcb2xyTjBxaxXKHtT07VTJ4+dOHVkaWkmm7cQ2mq57AddkIJ3gCrDtZqp2JW6lxhGycF4omzjIK11iss9K9vuuuXC0NIp\/duVeqZYKrx0VUFuOpmLBs61lfWThzo5N+j1UAB5z0MvQg\/QS33wCagIHlMklkqnrN3d5urypiIEvRSkd7JJeF9QfDDqVyr5I0fmFxYnlw7PzM5NlMqEH8QChCPIip6Y6T0fsvr6j4eQyg7LxQKrSBEGQM+TJcM6QEYrHQyOy4WaNTIrJINAEsQCvfylNyOievpAd8ATV4AiFELu+GdMXK7xT27FJeRhDwjHNc7fq8ZY8XBxNRIzpQKA4RPcf\/kBkx+32506PsEw+tQnP7o4O\/Xss39pemHhU88\/7ze6hIuon+lDs14+S9TZa7ddYn\/HgX9cz4PDjV7W0WkxYzRbTWaTkQcpD\/qBS4\/MTM9R4d6s33rJde1PffyDOXtcyLlRPxIz6JwGRZ\/QBNIiT0iUiEttKKxoHxrpQ7tGlVNF1gu8bm3u21apVqm+en19u9N86tknarNVXMlKuYw8xjEfbsc94uKwm1EseQZa+NXiE\/EcVKZOp4N71qXnmIUYipqINrINvfDy6VK+XTK9s9u6cX211fJRbtyGrbQeGq\/bayz+ySEgrykZlxR+Y0IYgH4yyGiVUFbq6dbuVzVbfykM3hYE7\/bb39xoXeqPPmpbjYSHmNAiZl5gNmDLP2AUmJNEtxTSM4lSpoBPMDU16egLR0rYnIlaCe9qZ2Wr3WjTBJ8G+KkPGmkOZPvtLm4BvhH1gTdjtN\/rR6QyI5LIUEI14So5RrIziWQg52wUjgZfOk58re9DOUAhmrAGOrYomXb+o2W36cSgheZxz\/EVeOKMkSmJs0kSSeFPoi+plIKlJhBowtoSbQTDiD8MIoMt7YJxNbvEhG10jsE9BgltonOsacJw5OmGxgodjTlQJT3+0Orj3WQwLsC0RYNEh7TFLgg4ozdIuFxgstfVG3NgU8AYVhW3JlNewbXz2UrWWqilcjbgJDq9aLLmVUruy6vhjTW\/02jpG1OJJPyOMvcK2cnpKT1MQ\/+bCaKQgV3eUgo76F+87+Jf+6qvETRfpPRm+ASGLYXu3\/iNX+t0WlCgj00NQ\/NhkHG33b5142apWMwXCp1eT66oLIwwjN4kxu+0W0NzWLQWvAbDXi\/a3282mm0\/6He70e5e0w8hm\/mwVeiXy4XZmfrEpDwrRu714Gm4WgdHxycVKt41j2zpEFoi\/xAVskE\/gGSAcrmMiHMX\/qYE8w9\/MAEozSQI1+AfSoBE\/EaRcdvpgd7wsuFROqEh5v+e60CH8RXOS1uam9wEKSa9uopvACMmU5aXzmZqhW7e6YxBj6+Tg9M2LhHePfANBlE+4\/QT4zAKxHoW\/k2E4NdqpempKs7B4uJ0tZqvVooZ5GgQlvNWsZqXdY0Gk+VCtj5zq+vNLu8e+plfruVK\/aWFsBmEiNmFE5n9bu36bbxQHJbdU6daj5xtIOfDUalUYlI4Vb7fQ6KNUB+8z2OEIdFuB6urW81WB0GA7Skn4S6gOcm4njUzV7ccvDQP77haq9bq5amp+vTM5PwCLsJkVmcoMUoeRtBqR3+YScehj+XYLsyJrOPJmZUFmX\/XhS7gQ3kZe6EfYkqYIRYoASozuhYDQKzCQGO2QS898NdgXUJOhbghiZ\/c4ieVaRU3V6nRSlzpmSsV4mucuEWiCUVn7zt79tw501my0+1NTU72us3Pffq5h+5\/4LHHn+4E\/vMf\/9j26qY+M1Mrzh2eD4bBwHyaL5f1sp4HrHhFAMUEYBIg7HY7+HmGJ1OB4uVx1su\/\/elncW0B4S50b7WEdOTyla21m+urr8xOTYxR32M91EMViJ7iDQkXgo64iBdFWvSk+dBt\/GUBKGkoaNmZ7Z1WtzGcn6ndXNuYPXns0bc\/3B9EruNxl3p+D2aX+wVjQE1wzlVM68KrGVRFEOqpAeUAAMIZgr+4CIxCoZ5jakOZDvsjYTfhFP7u77Vee+328vIWkmvYRgG94BffyregN9k7vS8sZorZUoUmOgcQ85GgjDcc\/s87m88220dC\/2jUO4TXCHOmrY+kUrezKVsQyUAa5Ihd457Jk+EnQwpmRjTGlXnVJupT0xMMaDYxSEuhKJLD0eadDdCc9Vz0JMBQGe+HMAkIt\/f3237oei4Agn7wzV1SLGhkGIK5cyV\/Dwz8+IEK9E2\/pE4cTqPHguR4NpUpjvTVG3Vhpf+Vl\/89y6YLKErDONGcxH2u\/GRGJq\/OzeT0kz9kmIDhCOPEGItOM3BILTUEvFQS9w0OIdghpjHdK4g36zp6myyeDP3SzDx9Ek7pDaSpw7sPjIRD4yRROd6tQiLPTa1GxI+F4mcNxl5wC5GGeWASOIAKMJuZiM59d51McaKCTpsppedrKbT0cJAajJKL83kin09daa5sBL1OT695GwcDMGdmZ6dmJlFkRDlMfGQ+R2mBV2AABcn03\/qmv1mv1YWAL5JaeDN8ghhTCOGv\/OovddtNJATbOdabJ1LZ8Be+PBVgJmhh7LEESaLfj8AU7S2b8DQV9sJ2sxX0QHiESFEZwwBTTs\/MEOt2Ou1s3pucqs3MTebyctvpgf5xqcAlzoDpXxJIohX5WOBfz+LECvHQlBjWkZqBxzK2yBMvJPCTf9h\/+sN5w8sAZnwL6jIcti1uvr29zS2SGhjmbnc6QIKVNVOTh0N9hJMKZrFrbOf1nHsI7R3HTqQYfqI24XrpTNYaBAN9WRK3B3keJLAQGEomFXdiHnMOMbEzMxOHl2aXDs2cPH14em4GNglheNBtZcNEqfSJVx\/4ufefurE6Wllt3Xc6KNXSVh+89OYm7Zu3Urutq+95+sbX\/eVWJZdOpolfAdvMF+XCWH0UIsBDTCbk+2Gr2bl1e21zc9es4NoxOZAB4jggolqtVp6bn6pUC\/F3U+iNWVMVsYW5S6XixGRt6fDC7PzU3NzU5FRVq2raxYN005XeJUEuAB1bYZ4kMzTtLHDHpIEK4CAyOiEGU6gbanU31lOUIzz0RWVJuBF40HVXpCXwlPBTjY0CjcvJS0FrsdREoXo8aXSiPrgi5yBuQl41SePh448\/duLkCdNDar\/ZXDx0yG9v37r6yiOPPHH05Kmr166+8PyntlbXMTRLJw57pWzaSo3CYKCDiuvEn2JvnDuzkgyPAX+v14kh6fkBLlgYDY4cOXXp4kNMWmwKEG\/JJEuQGvSjz3\/2YzMTVZA0HJg3\/kniOpFcjoP2WygY1D89oFUIOugHlBnLKINIRAapN9f2Juo5AuTp48dSNu1GtuXovGyzZgg\/x6t3RgzlGZBgVLxerZoZ68KVwQdRP5fNyRThhut15TRecrvd5id5xu32utT0\/f71a3deeeVWGMqKQFKYDnhESmOqmIXZSaP1JCk7Y\/9IZOhKE0SUVJW7wwfD9snInGU+huCq6dup96WsWx4BjbYokehZf0yiAj8PkuGRGHiuIKpcLpUrJaFAu1q5DsvFHBqwsbnf90MQC+MhHVQGkmw2i3ZeWV+PkCa9cqxoF4wDKBXiOjHwmpVhVAoFv0iUTA9tadjkMDXMDBP91Uzqw0n7pXGm69i1dLI0SjQt9\/9lezezrmU6pAe6iqdAz4AR90w6gN+IM7fulmvMuJWu3DV2HXVBF5Jp\/jdVobKprv3L0kqUS7SlnQDfIINacibIkmgajxgPGoMUj0dbatIVGWYO3VG\/pvCASbiK3lr3tUFm6u4rSxCUodAS6XGqWCnYRc9Ojo5M2rWsvlGZSFq4gSeO1og7n3+5sdMYhX6PsUEHsSIdeDmc1BSxg546aJlAsxKOsHBh9OjDj3zps19quAPguH4R0pv27CCxtrryS\/\/xF8GQ43iQUVQbC32wBLNBEeCb42GBR+jVHyg0hyS4D9DFsRyEhjZ4+AQGVjrjd3s+gXjga+vJcEC8VSjkHddKZZL9UR8Lwj\/HcYulEjwdDfrxuwZpc+hmziwS8hPlAaOgAgAPcxXbEspVM50uFUu2q8g+m9NCLrogpj2cgwmX4SN0SOvoAnGDkRA6AWY6JxOzi1jWyDzuOerIcHKq1\/OZlDgsCTZwxPWZx+EgshLDxNDODYaeryXHiURq\/uqd2es3nEZjXCgFVmaQka\/o2hYWM9Qag1wjOrEtF8WB4vH1qkqvWCyACuyo59qek6tOzO73h9bV1af\/za\/O7zRBvtvu9TZ3G8cXO46T7id2M0l\/dnp9Yerm2x\/fzNoOEqL9yTKuTI2EreKCAuUvYGOeG43Wzm5jY2Ov1w1SSdzhJBMUU0p1IAfYS5pTXae+QFaAQ+DMaTDa8LyzveP7AWGWY+MQJ\/Fm8nn30NLM4aNzC4tT9Xq5Wiu6LhKF1tJCGViFMYxm1BFsCCwZGEmGWfIm9YrO4I+xFZJnybvkXv\/xU\/Ii+Rd08TWmC3kjX1o8iG\/prtbl8Mulbu7pi3hmcbW4ZvwTaX\/k0UcOLS0ZyzLc3dufnZ37\/Kef86zkQ48+ky9VX\/jE81c\/f6XdaDlZZ3JhMu2m5fr0IywTYStOJPhiPMART5ptDWSyWXEp\/mzPPBC6dOnRpcX4nMQvluz\/KUwiR7U+9epLnxn4zWrRw78Uyc1rOAd0BFFgfCxjDPUoN9SACXQeeUxeqRRZ18zK8rqXzxWmZuxSCSLTjzEX2NMh4T0+Abobbszn8rj1cBVXxDoy20vNWFoVkzo3CkGPLYxZYkyzgayPi4xER4MICUEK1td3XnjhlWZb5wCKrcXz2FY0hrZLQjZAomMmBZhiYmNOxLryMtUtfij+AM0ILA5HwycGOr1tZE43GKaTO5b722l72UZ\/kuLJSo\/F0FIE85CPDZsB\/yDBmdlCtlQugkryMkWJUbVcwEdevnaHsEv8LSOE36OE5BLA3tnYhEH1ngNdyCgyhAa6C7CB2EwkBiAuMVMzK93aDhcOU46ddFJ28pbn\/H4y88lUyrecl9zk+9NWYDlJBTPqIUYsPcSdc+UnVyUzFf29myAx\/8johkngFpmlDgzBPW4oj\/BKO4ANU8lIq0gGGWx92B4LJARqPH0+Ql2blQbN7q6kxyhFRahWUu6UfE4t\/EgDCCb9EYfEWSfrAlmIUBtskOgEgdagqXSxXnay9nQxfagGivpwRDQc4\/GfOjbTT7h\/8NLO9l6A7sXAwcLmAWKy1Wh0O+2oF25vbEa+9st6Xo6+e50OJvS\/\/oZvqtcmDjTCwYB\/3PSmPTtIrK+t\/vpvvM\/EXTbmCqEK+2E2lwP7Qejb+g6KtmuKASVLwrIW4y29bYjcQhW8BjwmJEn7WQFd2jwij2fQajY6rRZUg+MRND+M9vc7+40WLhhGpd\/Xdi2oaHg6gUmmMoBBWzOcfEDsH+RHzlETZrVAkUQUhY55\/4QK6IuYWWVoRvom5lCfUdBrBRRxixRLCBk6R9fTJJ\/PxzyO5TdBtiwQ1akQLyFo2QA1FEToqGEik476D\/+7X7vw\/g+e+OQrJ5\/79MzHP3noM695N5aH588kF2YBNg0K9H2OiE4ZDDUF34Kinh9KPzIZ4Bnpuw99fWsAN9xOZdxBcuQOR\/O3Vyf2O\/A7HF3Z2EZZ7Z87s98L+0HgF4s7czOdVKJqzk4GyHgipFjp6PhIc8Qb2AOfQdDf22vv7bYyaYdhDdrBpbBj0KWGYGB9Y3Nzc6fRbG\/igjSaNBQVpLQt42NJspkLJKIVHojjEFQl8vns1FRtZrY+MzuxtDQ3OzthMDfUASpDJi4JRQVDOZAgnKTSiHesCCXSB+u0EmyaATZ3uMVYEA4qxzoIUOnIQHuwdAzMVCTDXVLclvmLg43EUUE8Y9JBtzq1073\/gYsLi4s0oUIv6E\/PzHzuhY8emp+6+MCT4Sjxkd\/7wO3XbsF6uXKxPF32sjYO\/9D389k83TABRoSdcOJkc8zZD2Yt2jx+iiDwOJstvOfdX+aZBweaSTzwWzShsHe3Nm9f+dTcVPlgqmP9QYhAPipfPhrk034uEcsQGSpi+QYScYWAqJCU7WQ2d81LS7X6TruNZ4UvC8tJKLDYliW2024APS+njVak9HyKMPzgPAzuw3NZT5+ujllFvJbSCiKEggEKhQIG3kbOHWdvv\/Hqa7dWV\/epDI9oOU+O9diwoPFd7ralZ5iQREYzMracWjCfrBTigB5IJ44Nh7lk+gPp1Cdz3h9ksz\/nln46697y7EQ6C+8ykVhC6YS2AtckSl7PHtShsD8YVGuVcqUEzwISKhHdNVErD6No7eZqYqA3d6ampgCU2ImeCUE3GnsN3\/dy2k2FxwNapblN3Msg9Mmg3BLYRmridCAU6dEA0Y6GfzkKJpLjNSoSnjCknVm23OeS409aw4bj4tnF0hT3cK\/DuPMYM3Qo46qwWRqGoeNCCb6RR\/3khuocMAt3UeX6SQG1pCG4Q1txi7gIBYeM8Qddx5wsPX6K69GX6ZaKijFUYkRO+kSLCDL83KLoHnjxlW5oRfBJGEmoA+1BFVTXKPLyh9rTXchni4Wc6yzVU1UdJA0Y6XAQoLNOHJnfbEQv3mjt7csnACCUIbEfNjI1Tla8fGqodeOw4zf39pfv3C7kC3\/xL\/zFSxcuPfXE0wCgFE\/+i5HelHUCLX4lf\/O33v+Zz7xA1IjthwxDfbFXrAbaB9HAc3XEPrIGgTE8zBDhBJVQ0tjyBBYOX0K0Mp4oasEIktgC5I+wkVpY7wc9jBYmLtza3sVMdjrdze3dTrvb6\/qdjk+IyRAoAj2NTxFo2ugReoDakJBRkA0EOJclILZ6vg90+VzOsW1cNrNbQJsVbcsOg5BGhONaZDPPCwDG932giy09ybJtrAUqgHnpA3fa66uFR0aHhxAwflp2Br3f6+poECdjjbGI6f7pD3x46c5mudUqtrvFwVgKKZFee+C+2zkXPi15uXEyncsXvGyOIIRxUCNRPxgMw6yn0Ae7K95NJ\/o6X680TDvDfpAYhK1k1lpYKr7ySlHHBiTtRCK3vO5XiiuTJdfzEACQh7EK\/X63p5dqYm1CzVgaQQhXBfr4c\/1hu9VbX9vpdUPbdhEY5gOURkQlq+bBW\/x0Df0yauz3drab29v7mxt7xFImv9ePoIJEFxWd9XI4v9oNPhwTFIMf4\/9lisX8xES1XCnMzU0tHpozO0XKKGJiaBS3CB6GowFCnrEdHRhFAs542UCKWNxyoDuUVZQUL7fyS6qTvzAPMMB11JQYaxlSdWVVjLcHmYQBejEvagtm06GZnZRFsVx85JGHJqYm8c8o98P+8WNLu2u3FmZnTp598OqNa5\/6\/Y81Nxow8NzhuVw1zyD4XL1Wu1Qs0gJ+QIXhMNKhWV8RwmEbSx9f0U62pJUpl+uPPfoM7TSbeOC3YtLMkvIa08n0Jz\/2G5OVXNZzhkS1aORY56OL9b1NvYst0ko5iIMglsypVLaevOFD4NJDocguhcmSn0yFgz56NuNaCvX6Ef2ASChr9AxiJZPvIeMy7jqhCA0Ag0VhlEPMcjnuIuPwBryg99nEJzq5FocAfsNpaLXbV67eevXVW1o6NK9HoGegIwwDUxmGkr8uRaPFjHj3sUJkMqTYwGhpYZyIxn3bTnupzLVk8lft9Ecs5\/ft7O+5zitObsNyhk56MNZngzDQ9KUpGLwJFcQbCJtsnhLlcSFXQKlUKtV6WY6KWU2zddZCPur5e+u7RJ+Wju5w220iJbnmwN\/tD3rRQBuH9aRPBk+xq5EpI9pgQCQjD3IAWzjhH64D9EsliEgebwf\/0A\/e4\/f8xOBOOuOj4Eh0lbL66ex4RGCikzzuzYKe4wTMwM+VQoMZnD8JpcZTkpmImwh1Emc9GSSRoVAIN\/VoC0zUMV2pN3wp8pSIo8RBgGrcNRI9qTPNAoPDJHVPLrtYLy43g6gyTUBIDPndQj0goAfUvoyIIYrxCZQYCQzniwUn55ZzNj6Bk4zwQol1CXEc21manfzUy3dW9hLbuy2UmmO2ROIuwW9oRnOsTQL\/BWMEZ26tb33DN33Te\/\/6Xz9z5qyZ6Bc5vSn7CczlQx\/+wJ1bd4RaWUSsiw83kRkNR1Zap+TCV2EIpkZh5Ot5udlvrBUC88SdLkAuOId6EANGhOJm05nIQ6yJPBt2HWJOVpeXsTzEYSZuSBJrdXvRzm5zbX2r2erhH2LcMUNQMZZSPVkYmYcIxheRC8dYOkHLxm5gvaJQ5xXiKzpmwwHgoCwMufWYIFYZqBOxi2E7QajndkxOBw\/n8jm4h\/7xEHQOo\/Y8CxGKCsM+zGk5eudWrJwaV7f2a9dXDvbHawLjIJXaeezSRqWIWLkyfoIOjHDF24CTwyh0Ml4xl2csYpuu3+2jEa1UZWO3cOV6slLuIuluJpiqhcVs9bWbOW3QQ\/2O1kaDzeOHemQHfUiD0KDdcFwAH9wyzZj1mTLQarWf0Mkg8\/atdUw7wRhoAhq8JeowdYQUgiC0gK7tWtqbjWOHOGWGA8g0brV6uzutra397a3m9s4erlurFQz6GFcgVgRDPzSEauhuCNRsNHvdDhjFN6tUipNT1dnZyWPHFg4dmp6cKttWulwpAqI5DShS8A8GR6g8Dx8c6KVpjE4RO5lZKGcwi6zDT\/AMWZSm8KkVYP7qhSgmRR2oRgdqZRQrpdqbcHfLEuSFvsVi8ZHHHqhWauNhSgcrDEanji119zYXDx\/L1WY+8qHfXH7pWj8g9kvMHK6nvUzeKw59fSzHy+ZH\/Sif9XBucEBhS3jMNafIQQsIMc6kO2EPD+zMqUsnj5+RJOk\/wDci9ZZLRu3DBqlypXbr+ou9va1qvTTuI3dEFdADNhqDJYgDZeMkA2B8NVBCaAAl+9CVTtKJvX52L1lKZ7PwEspBe+i0bI6GSbRabbQE1PNMiDJKJHGLkUgEE0GG\/7HSWkrQOVLaQAMzELDAN\/lCATHH7cYbkCjo6xUObLCysvXqq8utpg8PG13FmLIpBjyTRqMo1HntJgCWt41oGx6Tn2HkJZlJZTRLS4cQMJluOtlOZQaET66rFVTYD87Drz1wXg9k0+DNeKiGrUEFedO\/kBQzMNxbrBSrtQpDMRyFSEy5mENiG+u7QTcsFQujBAoq8FBr2kpp+8NRR0GOhMV4yDKw5mV7\/RcLlplsPFEtIwCXZH8cEEudbIf\/qNc+0WsXov5jw+FCIrk+Gq3qXUsLteLgZ9AqI8flHrQk0dGUxPMii6GOtTQ\/KIxnB4L1zyzaxM6C3BzTiW4K73pGLAsfLw\/AOSTQjlyJT\/gn9GlmJvHTTFP\/kP0MTpk5TVyjxtTkDnUU2mdQDwYRSrqH0jQADHQGlDfWeW0h3KMWBlp6Be06vE5f0c\/MFpNTZToUBiFGN0iV807WTr96p7Xfyew22snBSPFhIoFnAEJROHBGL\/DH6XG+mENhlquV\/9s\/\/u\/gTjP6Fz+9KesE8rTGv\/d7H1hbW8Ftjt\/WU6lBN4IHQhFFOezaF9r1XA9+I6+Y2yCfarFZMlG4zCQloBtZokQmVmvGBNl6wb3dbof9aG5hfnJyQl846Q+mJqf\/zt\/+zqefetrOuDDSjVu3lldWNzZ3wmgYYrHS6V7Pj+gr3g1A76lxVwcraVAET8du6POCejSI74Zs4ARAbu5SJ2ZTMnjiaBASeWDCyJFBv5vYXRGtqShLgx45mIW+yGzxEx00TCW6wcBJWAu3Nqev3KBrHIftnN3M2Rv53PVjc4O5aTeV0dJSfxCag7oY1igv7XHOuUi1BeTJFJFWMholTgSJR3\/5Ny\/8\/ie69eLtibo5ELO1PV0vB8nZ28tA\/OqJpc9+2TvWmSOeKR4JSJVkjTHkdMnVKBTJWrfbBckypslkt+NvbOxubhLoDy1bz1OYETVJAkSv5cg9NztipCsQaFgfUGMskahmpp\/CO2o2uvt7vbX17eXl1dXVje2t\/d3dVrfrQwpiCACKog7NUK22o535OGfQguaOmymVctOztUOHpo4dnz+8NFcs5wqFXCGXg7P0cMmIPA43UIAzYk953imcDxPBSbei0rRcT\/+y+9rBbkE0fdAYnEiRGlfC+ASAHcMP2jEt9Cw1mUrDGXgqTz35WA4HdJTwg95gnJyfqbcbWydOXNhtNz\/6wQ\/efPkGg3oFrz5bHaeT6Jtuc79er+EkMQqd8hevMYwiqSptMdESd4RnkEkzmO9HD1x6dG7ukEFenA4w+dZLkERsmEx\/+g8+vr99Z2ayMh4go0T\/ohKckxJB07LIZgVO3InNTqUoRadogX+kM4l7icJmb9wfOzhbWHZ0ThTpfRmGgKTxO0GGw0ehYmtJutEkenkBKiCzkIL6aB0YQHILb4suGXxi+IGBYQBYFB7Z3Ny+dm15Y6OR1mcDtWwZywJ90kOsvmAkOEfiZOxLXE4\/lJM0c26gUvAHmFU6Q+\/OyNEwksURrmgvOe5ijwgrma4WqNTKyJGYAb6hHQpQsBknQPgyT8foH3gIUicmapTgz6DqEI96vUxQsrO2nRylsrlcEOiDnOb9yQF+9ezSTK6cxROO+tpRwbhYSK1xSA604A+WJBcDPc0cZxJpHRil51zUQ0gvD9JfP+q4RBephD0Yno7CB0c6rH4zMe4l0omMnuuBC+AFeKMQhGESPwGSFM+KOrEkakQjhnEyXpFshJB7V\/\/wS3Uo16P\/GL1AHVcR5KZ\/dQX0cU39YXRDoJgQhkKCQTfNAxpT0yzRcYufBtqDHlSTbvQtb356rhsGIciiFRiL2wIYPZertXy5WPJSizUr50BHbH2CyK0d9qqVbNgL11qJ1X2\/1fZT+hbUOIOtsm1jeHSeTZNYtq1XRnf3977tu77z0uVLguaNSW\/Os4NEs9n82Z\/9N2FAMKTHfiKE2TRgkIaJNTsJxAU624sGlBoKaeUWzCKiMcGgBbJtWsH6akBbQyAtWUGeRqPR6nSOHj9erVcHo760fiL5A9\/7A5cvPTg3M\/fwgw+\/7Zl3XLhw\/5GlY71e2Gr2tnZ2b96+0+kGtEWk5a8gvaO+1m50nIY2fqOS0EjDYR+Se56BxMBm\/omZACZrvo2E2KNWDCtodQ8D6Xke8+Wf6V\/PC7gLwOJmbQLoZbMe5WgoavXDyMbsDfpreff27MytMyduPHHxxqXTq+fPbFbKIGtspfSmQdSPgwL6MeyZGPXDZKZvjh\/OOADuJE\/d3nzg137v1JWbJYLmrZ32kfluvkggEo6Sg8XZoNlem6u8+uXvWa2X8ciAU3ugjKpigrAgnSJOB35AAqw2USxmM0Gwu9teXtnAcmungnHZYqbXfIwsQQtDQSgsCQc5TJkKWjnU2iEetNSL+WYMbZCyjOs5MEaz2dnY3F9Z2cBhW1ld397Zbbd9vxNSxdaKrt5F1nCjseK8qN\/rdDVXG7cqXakWZucmjh9fOnxkdma2OjVdzGYzLrhgtJH2VYx0mLSgAmdwDj0ZqQZSMlIcQCjtAxYUF8o6x5PSiAcrhKJa\/Eca0fwcDfvVWunRxx4FafTXajUtxysVbOZ35Mi5q9df+\/iHP9bYbMCtlalKqV6Cw3Bju82GlbHpH7ozIsYDfiPv6NAePYrVYxTGBZlWJpcrPfPUu3Lmya5JX9CMb7FkzIDST\/7Mz\/zEj\/\/L44cny\/l0IeuAE2ODZfNgBipoR67ZFip9LFZLETZRC0\/cGiMeznq\/sNcVOUEt3YJbeEBSmZKQ4lbndCqJ3hzWmqHj0g9hCRShS1gUvkKU6Vauh7HfFCLLOBMMjrCXSkUKURftTnf5zub1m6tRSP9ptIR4WglpkpUyecMqRjQ0BQmKduBSHndu5gGocOYQxadXaHEUx8lDYfO4358JguM9\/11h8J6wuzjqb1iOT\/RsFvDVkVFBXOknVpsMFJfHAimHWh+yz5UqRS1f6rFXCl+nWikk+sPVG3c8x+vraNSu63hDlOawXywX7n\/8wuRMbWFxdmlpoVQs5LMuKAdd\/ENRyVorSREmM4Mk5k+rviFubGqgRyBriXGQGFweDR06VLSeqEeDk+nUr3vp\/ZRrp90+3oB29glIOgIVYBhBI484SEuAk\/iVk3ge\/Cc0StubKSiZueoueXktph9+D\/XBK3kvtKFU9sH8O9hIeMBoQgsYI09bc9uke6sUxh6ZDmNXI5HCSKX1k1JzS1oAukJTfCmUG3RDOxt3RTXUWUJbSonbyrW6m7Vniqm5siYOGQB8kMgE\/dCxtfaw1U2t7HVbrZ41JihRhKKR9G2tYalQMudXDNud9vFTJ7\/\/h\/4eYaSAe2PSm+ITJBJXr175rd96P2Kg5bvh0LEsyANq0eyQgsBI71xqZ3seXGJWoS7SAk7jFZJ7tCeDCXBdBzNEBYN5iWs6qe9l9QK\/0WzWpyYnp6aw7OKwYeIHvvf7H3nocRPli\/yQabJWP3n85Dvf9o53vv1dx4+eCLrhqJ+4fWtld6\/RbHex3cQVrpvnGprD+5CCKDRfqLRsxo10OEl6jFRgQwx3wsSACtiMaAyfXa1WqS\/AzDohrahgVgjFXmgo4hyoLN8hmQqCMJ5ehpvj0daEe+Xw3J2TxzZOLG6V8\/v54j4KqJgt2C6RUdj24XPEkn5wJDHhSGkmgfsyHA8CmFIeaCYz\/+K1Mx953mO8ZKrUDbzd7c6ps61isWhbbWuweWxu5dz5jbyTRvGZWFlbuc3HmdChwOz7erITo10IkJAwi8TOdnNra39jfU\/h9MGyHkZaJhPJQ2xoa7hXzw4QGRpSorricr3lgZIVTqie1lo9Dd1senqmOjlTYTZ6amHUWBj28dhWV7c2VhpcN7d2Nta3cBrCQBjWtxSiEN1JVwwBYtutTj\/Svh70ieNmqtU8LsLhI\/NHji4sLc1XK2VI5DgWk8L3gg+YryDSXKV3mIZQJU03MF9X0S\/pO5NAtZF\/SpVoSJZyAO0Po5nZyYcefFCPnNDXGxtTswu1StaxrXJ15pOf\/PgHf\/NDyWEyX3Qn5uspR1+IGgaBJw2il7O1PG3JIQMVqBqwrKBFWw4jgEtgJJKpifrMg5cfwyUyg98F4i2X4DQxUDLx0U\/8wQ\/84N\/DiM\/OFGpFq1LMQmG4DOImYLkxZkePosVjcJEkWkSESPLshj0w1kxVV7t0Z1UrVUgXG3vMGbVQGkaRYNfzsG4srfzUsxsxDywNKInm\/n4Y+rarE7ghPTonDvr9Xi\/reSgI7XfRbt\/Uzk7zzp3Nvb1uJu1K0IcD25b\/CqMZDpF2QrzM\/JBLfd0GTqI3SBmLCRWAjQxeDlKXStpIxzAzrPeDH9lvfXW79c4o+BI\/\/Iut9iPt9mLG+mDG2QMys81ewJpRhQJjUymJhU7jGfnVWONErpjDjwn1Oa3YYU+USzoJdfnarXptohf0sMOARJe9qHfy3PH6bA3pqFTLExPV6cn64cPzUzPV6emJQsFFeeMKS5T7g6StB6A6Lk62ODPdH9wX+mupdOhan01bd1L2pVGybPykkZX6Ga\/y63YxnRnRJqnD1hEy4JUoAXCMLhJ5SEoG9HJXJGBSpp5ma54px\/jkosZ3G2peB2u30kKmXMs23AIn\/ERTxd3cS\/EQqAPcNS34qzutdQgAcRSTMs3jgeRhSK0BuRnhLtcS6Bo8DwahQgxu0bPxGMhjqbK5XLFadtPDhUqq6pk9nopCxu2Am9qP6nn2Ti+xshP43SDvejCW3FbPC\/2wUCwQIXSaLViQGPJbv\/M7Lj\/0oIH9jUpvkk\/wiU8893u\/97tZHX8hAYB0BsdaXoOQlPTFrCBcjigyDKkghGO+WENzERyqGBIa+qouIooMEG8hnKjzIAobzUalVpuYmsBmY6FB\/bf+rW9997u+VBDouE16YFguhin0spw1NzP79JNPf8mzX3LhwqX7zl0cjJO3bq\/gH9zSceWNIOxnczrlEIayLK\/T6fZ63cDXQ1+aw7mAIcKbBSLsKGDlzEdEmAJ0zxcK3HXxL8wHmuEhpq9b\/chzvVKp1A8Vs4ANYhdLh19ZGGfgG7V7WdtJujAxMbJOPdTD\/3Gy2\/X1KoZlNA4+7yjR6aDNfAIbue46fjWh9TLazk3m1pbLRKiwbDJZ2esMU8PepfuipF7EGLi5iJgmwurrYxPAg4nF42GmAI+s463AtAgJwkBzSjDSONM4BGurO33824yWcJkRVACXekYp8UMEDhQTrQ7ohM5CYA6OSGN6CI0+RpdJ6WtPjFgqZ+sTZcL9vT1QDsBIKToGWms6TBcu2d9vbG\/vLd\/ZunNna\/nO+vr6drPRIy6Uo5FOAx5SR7jH+DgL4IRwwmxQSJQKuamp2uRk+fiJhWPHZhcXp6cmy+VyAVUg9y4cBGE06AM5gEj70wPIRG8ahyBWLFwPVq1IzBfhjCnOLPEtTp86\/sADD8JLnW7rxs1bx0+em5ooVirVbhC+71d+5TPPfXqiNoG9mF6aAqV2xsLDzHrZWKG4XhZy9KPIqEf+G8PGruP6vjav9PrR3n7r0oXLx46dEce+RRNYjTPg+rUrV7\/hm7+52W5lsKzJwfxUqZzD\/GlhgNswI3TA\/oM8EKig3OhnGInfo6S+LeZbZT83l04pcsCWw5hB4MOD0BfaQTidAp7BrdRZ9LlcAQ5FJDGWYaAPoAAGLjsSoU8BmLUctLOJUvReItKXsbQ8RivHdojqrl29c\/vOVibj4dwxFdhRTp60k1a1GE5Mo\/lJjtA+aC\/ZPCMmwGPMjewdAxnfOpFJWbg+yEkuiv5qc\/90r1MJo0I\/wk+g2qad+52cu+e5RFR0DogGb4r76d90qMEkeMYKGg7WcXi1WnViosZUYmuEUzU5UUEmd1a3QBxKLavPJaMHAjtnPfjEA3oFUfsN0Ug4HIlKpVCfqMzOTc3NTZ44fnh+brpczNeqRU\/2OtUOuv1R4nBv8GOd9n81HN4YDW8gjBnrs7a7mUpeHg2Ko8H78rn\/h130XXec6gdM2Tz7QH6B8ABBJglcBeVxOCHpJlGU0aM9PROkAlDFViCur2DFmAbymrtZuodGcYemZ40FD6hJvMZwQBfpItSTzIJprhJuqj3zN5Ivp0Hlhr4xkPxV4m9cA22pVgxtniuJO+Wu6FON6C4GLVcr+WJ2tmQt1KxkIlQwCxbGiUZvNO6nPMcq5N2N9nC3k2o12jnHkfZJjGYmJqbqU7X6pJTGcNBsNU7fd\/aHfuxH6FNaFMZ\/Y9Kb5BO8\/MpLn\/zkJ3K5LCSJ7ZlQyQ2tqINMvQwDMiE2UzUy2cc7FGUNo1ORwlgAaBeEATjRT2IBywH7Xd\/f3t3JF\/KLS4tmZ8a42Wz9zW\/8m1\/1FV+r4UU980dX\/v8CPmlrOCQ1NTl15PCRJx974rFHHjtz+ly1WscsXbl6jQh1bXMH+xIEEcRHzRCaS9eMhggQ0kXgST+oFVuL2Ao8sdmIezZ\/8LIvfOH7Ap4oHfcFGcOo5PUqsPYe4\/rBNOgIIo8gJFiRAKSzxYSTS\/hRIZEoeE4+ObD6YTOMRn08A+2owE1nFngDtGJyCFbKs0CHPgcLGhOJPdsKZ6YqV64VOoFcEQKj22t+vdI9e8xznFy2ZKXHjpVwrSzKkZFRdvFhWNpWLZxLciS5eudKnkG\/P263\/fW1nUaz47p6gxQZg0zMPaYLlAWNqM+BWeaRaBj3P0a+qa9X\/qgsx0EL+BLrQtFD10xOT3bawdralr6vJG7XzlP6dJxMvV5cXJqZmZ0oFPOlUjmdyvS60d5uc21tZ3NzjyZ37qzhqcjRGQzTGZ1F4Sm80ykIsfDq\/OSgixyhyQs5d3qqNj8\/ffz4EVQbPWe9TL1Wtu006hLg9cjUvA1PQsMAJCoAZjHQ3lU9mqxRRlxS4wsX7jt\/Xo\/3bi9f399rnDx9rpTziuXa1VtXPvibH9hd3a5UytmKW6jl8ADoOmi38AiJAOAW\/EUUldafFCvoWx6YH7MlRZFHOB4Wy1Wc2hz8cMDDb8EEJuPr9vbON3\/Lt9+6s1IolIglAz88NF2rFW2ohiMFXyD0YiUq81fxsURPTRUiSor9RLaRKg3SXqI\/dF1ss7Gyhj+RPkefodLpW3A1SVG7liojUEvbOAEGAgsL0Z\/Cij5uRKaF8e\/5cBQOAU0Q9qyXIza4dvX2K6\/dCXwt48MJQJbWh9o1HXG+EQ2oTEbuC46m4SduxSsHhoV0NU10jr2lB1zYLmFj6Ef3BcHZUNuYqMz\/pG7aen\/WXRO\/ah0iTnTIFVvPNCQ9xleQxMm0xN7GqFAq1CdrgOG4XkYrfEMEAY3R2+uFfiBgiGT8cDAeHDm1VJ+tIkfgQaxuEAjkAWoZAUmO8wWvVi9Nz9TmF6cW56cX5mZL5fyhTud7tvee7bRKYW86Pf7YINVMjtJW4pqX3x0OiJF\/3M695noOsQ3yj0xJyiVKgAeQSC+oICO8GbTE5IjhJ+kHU9IKgnl4FMsmWDNIhmzUlBcmcTX18Nf5ieNoniMYqWUyYFu4BVUINJWxRqYztZF\/cHdxgoQ3SU160simf67UNMOSj\/\/nR0waDScKmCXRWD9ICxG1OnaxXMwV7KWyVS8kouEgNcbhSHWiRD9VIDbB6GE6VhuDPX\/UbXWLXj7sdYr5XLVQcvVoVPtjdcR+Kvmdf\/e7j58+CQAxPG9QepN8gl\/6j\/9hefk2Jh5kKRJOJG1H6g88Mj3b0tQlfvICZDxApWyM8QnwXmlE8IR0aU0VlGuTkZbLRH9zivBes5kr5Obm5zOWIsV2u\/VVX\/k13\/TXv1ljx4xzkKRPxE8HP2O6QksK9I9fhXzh0OLi5fsfePvb3nHi5Mnjx0\/BJ1ev3NjY3Njb2\/d7+oomkBAG2I7OPGk2msOR9u8xBdxaeIuJ6FQD8y4ydh7NgkPDqPJ0U1oujjVODBYug8yAZeWyOjiF+CLR79Vvrxe3dw6trx355OeXXr0x8\/lX86\/cDGdnNq00OkxgSi4EOpbDzji4GNWwd\/TXPzj3mevbc\/U2aO4EzWIlNTdf\/fwrOQBKJLZnpjYevG+rXhxEg\/ibDV4um8vrlXemw9DABubRgr1uD\/yDekBnEESu3WpDhJWVzdXVjXTaSab1PRjiJ4SO+hIGIVKP7phyjFWJbizPRvaQ0oNbTFkETPQHOm1idq42PVsl5Nrbae\/tdnSeFUGSdD3OfqpQyE5OVXJ5N6sXQrVpwMtZ9YlyfaIEO3hZr9PrNlodgunl5e2b19fwD9bXtjqdYKA4BIejiKHvdbqAikbWYm9SnIO0u24ml8+UynatVjhz9sThI7OzszW8k3q9iscFNdEGwEBMGQcRRoOMLB0bIDkHOcyMm17OOXPf6WPHTg2G\/avXXsIsHD52fHF6BuXw0ec+9OqnX16\/s1GdqCwcnXXzTqFQHEVRajQolUqKSsGTjoLo65FHGsdr2DTHZsCNGKMOsWtiPDkx++Rjz4AzcbH45a2XpGNhHhjpv\/3BH\/zdD3+0XK4rrkuO\/F5YzrmTpXS5kNXuI8NMUsqIseIBI7a05obpAeuwPS4kspN62D7WxwWpC7Fo4noe7Icth9XjtSV4n8ZxKKIOjc9KAgz4A6cNscXngGFojoTSHPOuR\/1abEiPBuPV1c2XXr663+glU0QCepENCibGGB\/kyPA8wxysJ4n\/ZQLNq3GAS4onH49LBi9B652JdIjQaLPAEMX30Gh4DG7MpH3LupPBFbDW3PzzGWczoxfVaEhvtAUviJTpMTZFBw63bJkKpdqKRQL9mlYZdWhm0rEzk\/UKamv99lrsnjIjP+i5Ref4uWODMUKNagEbeNT9VFoHoEUB6loee2I8dG2EtG\/Z6VK5WKsWl5Zmntlaf\/rFK\/ouQjKxMBzPpa1POd5uCoQlrqTTv+lkVywnaaWHiYE9TicGiZQdrxAIeGBmrIE+DAndRVKDNGh6QBSVmqeucc14mvHPWOUKo\/ECAGJrqsdBhdH3d5FgYIdUqiv3DLFOyjkzBkkVFNeo1T1mIA81+Rn3SUYrGEZPEtHRsXpUz+oCvuSudLyCKKhJJwlcq2KpWCiVqyVnsTywUqM+0+fGOLnvJ1LZop3s72xt7u13Gn2rGQ47rXYlX4x6HWwiRCHhhgJWz+9Oz8\/+rb\/931hmD\/vdOb0h6Q30CYRTMMp\/icTP\/dv\/tdXcNwvII2YJB+eynkElVBhqHQ8Cy73Svm5hXtMWcqEZ1AXjkhlpzgwhMnIZuw4Q1veDZqfjFQqHlg7RLe16nd6z73z227\/1O5ENwfEF7P2h3Ov+iZXiZAoOEj\/nZuZOHjvx9BNP3X\/x\/vvvv5zPFjEDL7929c7yRquDVu8HAV6KOW9HcShwjvWxf715rH40N7PtN62PWqQgMwyPGgI1lnkLDhljkvjj+VwWj2FMcIil22+8+xd+9cmPfvroi1fnb61N31qdvrMx6rW2L13ay+ZyFnG2hauJvcINz+VLGduuN5v3\/fv3X\/rwp6burOy57u3piaAfRMPQn5gAX9Wrd1Zmai9+y9etnzwadgPQDYSSGcPzAACwWGV+woJZneGKwknXahVBZfYWECatrG5tbje6XT2noAHq0kwxRtoBj\/J\/TEfkA9lEp5oR5FugUqEX1dBiJsP0k4V8dma2lsu5W1t6LhCF8WNRAYQSYqKzs5OTUyWa4MHQFvAcx\/ay4MjCXSiVC+VKEUM+Mz0JYpDDdre7tdW4fn3lxo2123fW19e2ceRaLR8Ng7edy+XANdrOrNZrj8gg0rMnE6Onp6aqU1MTR48unTi5uLAwvbgwWyzSq5sr5jrdtrw6otSUDVyw9UBT0zp2xkmdu+\/s8SMnW\/tbt26\/Vi5PnTh9Yn56bmX99mc+8fytl26sr28tHJtbOrVEE9e2Ovu748GI0AHtDB\/Ts2NWNbQMZs7MKWQ94AmwZLYdRNG5U5eOHz1zF81vqWTULBdxBdl\/+s9+4if\/9b8uVyva20JEjuqVBUouTWUnqkVEZ9THsYuw6OY9Wr1DgngPhhEeOTwcjTO7A7s1dtW8HyBfoc6hgh+1h4POiBy0icN18YMZFaFDWtOWXlVnOERRTsBg4Nr460kcf2OkbSy8bpn1LSJsoCUCd1233QlevXLn5u0NSIO6IngxT8\/E9vRlREEhL33ry6860lhftVDVu7SUXTBJXos6kds30hsBiVEqYY1xMdLtxPCFtP1Bx\/2AZ\/9UceLflSd+K++tmtdn5BkZ6wV4NJcqNeqWMTBZhln0yiIzVvF4XNBR4hPIiLbiMB07PVUrt\/b2mpv7xVJJbYdJP+oeOjk3tzQLJsCDfJNREvcIvCGAiDCdR6N+xsu4CSsx0GhRNBz3g8F4iCTnbi9Xd5vMG8IdH\/jFhdndk4dw\/ZPj1B6TYsLDpPb7khcWtPvXUPggMRGDTCl2\/oK9uJB2BmmarP6IZ4xxMZiknoHTKFLzUE\/VTAXuChE0oa5BN\/+YAj2qgGLdkhERzgw09EYD8GrGNbAZlAIxQ6m9wSxD8FvdgDdAwLU3v0UVGMZMwkwvlfacYq2M4ZirJCeK4ElvFeD\/EJd1B3iq1iho+92wA1oTuXZvRDxWKRTwjxis6\/dgHfMtLtR296u+9qsuXn7AAK7\/3rj0RvkE4MvgVOT5tff9ygc+8DuOo2\/c6hR92CGVDgJ9ypoE\/iAAHIAxJaM98OZK83gdGwmU2cxkQh0bIqPSHwzQqtAV47bbaIKk48ePimDjcbfTOXf63A\/\/4A87+ojOHzfRIVcGrdVqhxYWH7r84Dve8Y4LF87nc\/lqpXrj5u2r1291zLZEfAXb9eSjZ3QCD\/BjNRuNJv4qXWBHbR0t4KB8mDWTDUPmohH43\/OwZ9oO2Q39ZCZRzeVmbi\/Pr+4yQ3xCDAWxQKuQvXb+TC9XSIxRV2Emke\/7vVEG1Wanws7ZX3r\/5U++7CQS+re7v1erbhVdXPvROLM\/Ve6VSstPP766ODHsD3RsgmFwSAAmYzyjxcxmO1lrEiKGoQK0Xq9LoIDz0G73dvc6+\/sd5A6qQiBERgIDc5pEK64D87w23rQlbWiwRwkGjwax7x8nmdhEolotzs5N4tWtr2439ttQkE6k1PA5Bv1SKT83P1Uu5\/GV6Ypuc7kstwA0MH4VozueC1anp6fwYIql3NT0RLGYt520bePKhBsbcsHXVraW72yuru5sb7V39va0MSqV7vV6AKfdnaMB8OKJmrOegFayX60VpiZLc\/MTJ08unTl1dH5+slzKVcs13LFut42IghzFGqOx6zmX7r94\/NjJV17+zPr68uLS8bNn7isX8y++\/NlrL726\/NpyPzE6cmppan4KjzAK\/G6jCcB4BMJgIkHUFtNigJrWzqlUPpvt9HqoFTQ6rHfp4oMzMwsxJpl7jL23RjKTiWeU\/Pl\/\/x\/+7\/\/j\/1QuV\/kNF9kO4RCR6xAyzUwWS9lEvZiNgmAkRhtntERPcJ6Dc\/v9QMeXpDPNgdUY2L2+vkFFKc4jQieVbVZzZQb7\/Xy+kMqkup0edi6by6JYHJzBVJq\/0BRPsVIuQ5FuB1ZM4sbKOTDOKL142SwsjMjksrlOJ7h2bfnqtTtaf5OOTkC+SAt4CbMWKMJxBdRYUqCsYhvz6o3EzOyrF6trFUFdaIHQrLFhnXCWM3I3B0QSdyzrNa\/wsuPcdNyWm+vB1dpVYMGldE1Dca1xKeIO6YQ+gVeF6A3jf8eFuXwuV8gj+5Qr9M8kK6W8vgvX7KF4mX23001aifMPnreyNqDFm5ez2SwwM0qod+71BofmFKWbzX1\/EBat5MhODZlzPxFUs8PJCe+V60Xfh40Rj\/lme\/LC+amnH1o4PFkpuKVCFmegH\/ijxAB3HxhkiY3eiK8kE9RJBuMoHIzFP2M9yU9QZHSOmaVRFPyIb6F4QQN5dWRqgBMT9+hhjAIzxWVp\/D\/qMGICl5JxDQuqO5l5k5GfQCshjZok2saQyAUwKR6CaiRhHghNdCsP0uglQCGCHYxH5Vo1m3PzznhpMp3LOAyh16DG4\/3uKJnJO+loHLZy7jhbLrYDe68dEK0U3KzO2AkC4jbYhszm1saRE8d+8Ed\/xICk+RogDv5+0dMb5ROAMq6g7Jd\/9Vd\/+Ed\/qF6vK8ZnTsYDQIDgeVgWSiBNmfjB6kB4B8XUgQupFgRBzOvkqc9dBI8mUAb3ATlvdjoQ9MjxY25WCyy0mp9Z+L9+\/9+r1yYYOobhj5Ne3wM5xoV3piamL99\/+fFHHj9\/gRjuJEYQt6DZ6m5u7XZ0IGGfaDbes484GTdWzeHFnt7yD10CRBN2xB3qYABuE+j4UTKtB0uTOJZXrk3cXIP+zJnW1IwGyVtnj21PZAe9XhT62jGP94qMIfxRYmZ3b+rmsoO1TiWqfljc2PbPnenl8za+vzPeOLPUrU1lRqme3xlo372+Tgafe+bQVpCGqGgbv9lDoBBNC7PckQdNJuyPut1gbW0by27sPa0liUYiJLFMNVZMXKEXpWg63TPCxl1u8ZM8GRIjohXzBW9mrup5zubG7vr6nulBjwZxZRgY9NQnS\/WJcjbr0j23yCieMy+hZXXQsnQr9LD0aDUiHEFevKxTLhcmJqqTk7V6vVKtV1DC+Ry+WrLZbK2url+9unL9xvrq8ibT2djYwifAqdJhCpksXdBVs9n5nd\/++JXXbgMVPMj0geTI4cVjxxYOH6mfPD0\/O1tePDRdLuVRjVrYs9KPPvpwvVq9dv1lHK56feHsqfsy1vjjz334xkvXV29ujK3xfQ\/dh7ISzlGEYWBOUJDu0ONtbZ2TRQFvvp5K6WENSEc3oFAcJ\/vQ5cdLxapB2x+Xmf\/0JXEI7PTc85\/6zu\/+3pTlem6OSaImZC2MZvaDfr6QXZjyJvIukoCDhbOEJyzjIRc2MR6EOHL+2N3rO30rFw3GmCPXtVNpCweYuB+PU17waKyVJKkXuEYJJsTAgHKtPOlZnr6\/ZZnDAXEOoAhBHGDw38DYc\/4fDPTBdMLvO8vrr752c2urISMmeyDbL5NjFiZj8w8\/a4bYDMJXY+HgfyronknkAYPpq5nx\/3AJUsOklTR7hRAdnOp0YhRv9rXtRGYcaQ0EyR0St8bcQD9xt\/FYJEq48DMekb+6jse5Qq5Q1FoaM4HrCP6rxcI46u+ubQW9cNDXu8GFWuH4mWPRUB4VdZic47h0pweNaF7kH3Ay6UQ07oyG1WR4+oPPT7x6u3XoUAc7Pxps1CrpWqn22SueWQ1Yr2VbD15MnDqcq2VnZyaOHllcmJ+u1Uv1uoQaeeh1dfBrDDlXErDqalyc+I6ZTnz3Xh4zrGV58lxjRcTVTFd+WIwQrpIZghjtFiTJQ+K3zCz4MVYcUqkyTbWlOsYYl9gJ0KD80BjCqMalWjxEfIseNKySwINn5Bzols5rwCsAXZVa1UqPJ8rJxZqV1PNwNNh4MOq3I08nZKZblXzymafOeqXCS9f3G50AjTbGz8OK6MwYBWZw6TAx+Lvf\/z0nz5ymcyUGicn\/xqQ38NkBqELsfuiHf6gX9qZnppgbQgpOQXcUabM9jjySCaoJCjCclBM+UkIdrKmaa2+wSA1JREtjXR3XhSYIarPdCaL+zNxsfbIOHf1ur16t\/6N\/+I8WF3S6C9T6oiBOFDfJBLEHPcKQ5GuV6snjJ5556um\/8J6\/8MClB7JeLp2yrly7cfP2yvLqGrE1DKknn9iNVML3fbwfBBqVB2sh8rAHncC+iB+uehCF5i2U9CgclF94aWJ1s5u1148uri9MblerW8cO7506vo9HDq+k3eJkDU3T9UMvken0+61Dc6W9dm1jG0djlEiXu93xwF87fShKJXJoMa2SJgY9KUHLIV41bxOYrVI634kOzeEYtj7lDIrHZCAOdl17OROZ\/f3Wzk5zY3M\/Y7moKiRKuixGhWlgRFUP2EhxnnnhGEA4VTGro9BOHlLsIuj5rjM5WZmaqqKUtzdbzWaPalKv5pAJ1E8+70zNVLnqicx4bNna5WQ6U9TFoKVSURKoD9RmBoM+fdK5eGwQgV\/5S4lhoZxFAU1N1aamq+VqrlDJ2g4eQFInXm\/tra\/ura81r19bvXN7c2urGa8P37mz9cIL17Y2e8vL29dvrL300pW1tS24stFoJcdJz7PLlfzMzMTi4uzJU4cuXTqXzTmHDi3iH9y48WqxUCoUJi\/ed6HR2fnohz5465Xbt2\/dyddy5y6fhcRS\/wReWteQQoSvkQdgplWr1Tb+WdLRZncLb2CYGLV7Qb02\/bannyVqEqrfggmCpnb29v\/2d3z37l7D9XJEaqhMaKeH7yBIuygyg9F4fsKpZS0i+3BI1E4E7MAr0NfsXx35ycx2mO0lsrhwWdwofbB0COvCL\/xrttqBH2AHcF\/hvW6vizyC9gAd1Der\/bLKKWytjZyaxWcYldqFYjGDqKTSCmCMrQXiTMbe2W1du76yurrDLwyKMQ1ifhpSAf43EqDz1uBFSuIK2gBr3GUSXXE1tw5SnFUPyVHSRge4fc0N602M209LYhKpQehGY2s0yFKKljDmhyakuFsSJejMGNR75XQMULl8rlQuGM9ULz3iPVdK+bDbbW7tBz0dqZK0k\/c\/crFUKwah38ORkvUa2ba+3I38qjeUldnMByvPRoNHfuWD53\/3hdkrd1qHZ9dr9fZuMxEGnXrdHo1r1++szpRe+2++\/s6ZY81uKwyYAg6uXSmXpqdqc\/NTCwszlWo5DAetjr7\/aSIN4Y2B4lmI+LG030UUVxKVtYQPbkZ6eAIiZUGkjWNkqhV1uNIQpXPXjnMRS+mWKqktRWgSZiXiGqLFbc2YynM5KKR3zV5jCH2mc6O9xTw4BrQy6Bqa\/W+wk7QiU\/EK2Uq1WvAS83Wr6qaHI3+gJ+BZPxwP04ViNpVPD\/NO6tBCeavVf\/Ga32xHYa9DSwTe0QOvlN73HEbTCzP\/7Q\/9PdusfAsgEGKub1B6Y\/cYgqyNzY1O0LXNIcRGWadBqpFWkRqkxroYVBLAxmaDPCUHQfZYsordggxiXAUQyMq4Af4Gg5m5mWq1gpUbRJGdcb73737\/qROvc6a+uEmSe9CtZPRekkufqlaqF89ffPrJpx9\/7KmHLj+CM9hp97Z3927dWt7f24NxUUnYWuwBpAVyrCT8gQMO+2Aw4DSzLXHkeOgjqzc7v\/rQ2euPXlp94tGNS\/dtnD+z9+Dpfq2K4GTcjJMt5lKZuSuvpsepRjoRpiMC51ZtqrS+M9Fowrqw1HCneX1pfjg97aX1ht7ADzp9n6BiNAQSoR\/FgU\/AFfQq2RnAQCbBMCjGVBu+TzQb3e2d5tr6Di6NXiA0y554DEyZbmlHNVpRxl0ojB58vcqLvToStePKlNO+WMxNTVXoYWtrb3enSYRkfH+tNKBMh8NwarK6sDjlZbUsId1kPkAF2nCtkOS4Ky0\/6jObFh0WCiUKqcOVTmLnEsbIep7f69l22su7uYK7dHhmeqZa017CSs7LWraWQxvN5tra9p3bG9euLa+v7yLsuA5pHYyRHAz1tsUrr9548XOvLd9Zm56eyXq2WbLS5xkLhezO9u7c7NzqGm7gzWIRZpw5d9\/Zm8tXPvGhj3Z2OzdWb527fHpiZkJnb9h22OnlclnFfPpAnxL80O31tEyRzRGdmimMUVfBgMhscN\/ZyyePvyFHmv\/pSMl2p\/td3\/P9n\/7s53KFAkhAW0s76zhXaV4umbTth+FE2ZkqZ4t5T6tB0h6ZAdpA3uEoSjnr7cxWLzlOZWAdWGFEvGaYEBUCEmVmYDm9YiCOJvyAV\/WGSaRNP5gHojVUDkEHmId74VDaetksv7utDmDgrsEn8CcZbaxZ2bp+baUf6akxNeEfZBk\/n1FEUfNMzWSUYHuNqszBeqdEzFg4yZHZcIAR4Se1uCSt1AjXQbv7x4P0eH4w+vJ270LUe6rV\/aa95td021\/R6x4Zp15IjHvaFahHdbTVHCVZXBiLPGVKDMdYJPz7XCFXrZX7A3lCYJ5IvZT38Ala2\/t+VwsA1dnKqfOnCFEl3RLxDNoKESNpFFz2jJWUJ5LOdHsP\/fLvXfrEy14iaSUS1vpae35hy04M\/E4nnfQXFrec1O13PHLryJFBN4wiH91grHaKeGQ0QtvjWzvI8s5eG19Q64J66QF1YUy+dIV+3gOexLy4G+OT+2RQMUyQW2bu8Uqkmf\/dyas5f0QNpbgwzmOG4CEmaSpo0Hu9qSDuQXOWmjeq3vTC1M0YqnlAa0MyWqED9dVN46nGPZtwpTpRh3emy9Z8LZMcRGJEPKpEsuV7WIFKLsAAlHL25ETx+lrnpVs9bd8mbNOJ8QqwcGfEyePh2971tvd86V+I+YSh5WQqCdo3Ir2xewzB1\/Lqykc\/8RzBnOdlXXOoOAYQpY5KBcFwHjWpBh5pAJYRHuwOwgnTIIqQvBt\/5hhRMQSAiHs6OSCs1WvoYMXgY73c+He+\/TsffeixeOg3NhmyfIEiJhNzEuARKs5Nzzzx6ONve\/ptD9x\/2XM9LP7q+tbNW7e3dxvNVgeTA3PIuGbSnW5Xi0RBYJsjFkBC1++iz4KZemOmslvMbieSvcFoz8407eQwk3L08NupDRJnf+cjZ\/\/9++rNxvbZ4307W7DszkRhODNV\/9xrhSjayuc++ewTK4cXxzraxB34\/qCvJdZEX+fBxSIk2TIKRU84jVTE5rzX9cE2igB1AAEb+5319Z1Go4eKkOrEHpqgn8rGJ5AzRwexV2eEOcaDERWDEBJ05R634rvo1lq9XCpngWt9dUshuEQaOorbGTyfc5YOz5XKOaAAe\/KgzPurqDvxDQrehHRAgq8gdyZtMTh6IlbcMf\/AY7ls3k7bwNHt9hjXzHEY6cwJt1YtFMvekSMz07PVUilfruUcHRWAM9RXOI9Wpro+0yWopF7GqXw+++hjl4p5FNx4EGmJstPqXr+2euLE2c2N1TDqWLa3tHTy0NGFT7\/w\/MpL1\/vhYJxLHDmxhL33XGcYBFFP58mDPzCYzWbxycAb7gtdxV\/jBIFhEPn9KIlWsNzHHnlbvTYJ5G\/J1Ov5P\/QjP\/Zr73t\/vliAWQb9wJwBd6CaSVATox0FIbw\/U8cBy7jCPSGb\/ES9V55xNkNrrZWIhloPExuPRmEfCdPBl\/0IjSoXs1guwav0jP7hL3VgKzyGfmSON8bR8P1UUiemMCgcitHAwQ38AHbFLkIp2BJ3DUd5b799\/cbKzk4brodncaMxaVgAWsmZAXIpKJkKqEwTI2IIiDxpOmdoZgffkueWycgKxnIBiJlEeiQfeEDvkeceGnS\/r7n7l7q9R8PgeNiZ7wdzUdCyMr+RyXSN7BmAJWtxIs8Qkmftv9QQcUIccoVsuapvIOE0IN3jxGCyVg47nc5Ok5g7HAbnHjhbmS4PBv1iXntrARwNBQbxD+iUHtLJTBj54ShwEnZtY3Ph5moGjCVTxVbP2dzaOLXQyLk5y4ab904udidnMtqbGeghIuJr3mwEMKQbeLq9YHV14+atdd+H4nh3ghwU3dMnsWsVT83M8QvTjHVtnOX\/+JZcBZOn83uoptzoOmPfRZQ4qZQ6tKAG7qchTryKQEPF\/fImGE6OmXqQ3ZEZpku118AmcU8MGvMN90xGzz7TDmrMyzv5YinrZebrdtXRc6xxQltW29EwSBaLznCqNGp22sWiPVEpvXRzd7WdOHJkqb2zH3Ta0st0qe1x7RNnTzzy5CNnTp+J1wlelw7A+KKnN3adAPQ1W80P\/f6HgR8EEhmDuZgMSGOhWMRtxzoRIRk9qfUgfoJreAg+gkVC8wEivaqgB3sKARqtlh+E1Xq1WCK2EHFbjcZ3fvt3v+3ptx+M+sYkSa1JhhQSe6b3OrqIKSkDeGbBL9u269XaA5fuf+c73nXffZfOnT6XyxW2tnbW1zYb+61Wu7XfaNEFOssGC+igyNeJ4MNUPz3EUbJ6o6gbEQyPMlopWegNKhvbvibsnvyVD9z\/679bH4xym81Bvd47fXwI2sJ+o+SOnEyv0frUlz376fuO6a3N4ag38vthlBL+uBDPaD8sQoLKc5U8w6xjWV9pE5ko7BN45t\/ObmNldWttYy8MhxCMSaLpJCZSYQeiQVf85EriZ7yQgCBBX0fnw5MX5g4kVNlxvpCr1wnrU\/t7nb3dJreQRrMvR33iXXC3WsvbNhTXJ8ZhjE6niwIlwTjGBzcb9fEFHIf4Ch0XhDoJSphPjeVumRc+kUzUIzAwKOaBLFC5OgnLxh6Hoc6YAuxs0Z2cqSwtLUCXvf2WZmY0guZnYJYzRFSasff29u6sLJudZRiX9Esvvba30z556uytW1etzOjw0tELFx4Yjvufeu7jm9fX2r7\/wFOXsnknk7JcK6PdhTa+X4aBsRYEUACGTwMkGB7GJFD2\/S64CME94VTaffShp\/JfONL4rZbe9xvv\/3\/+T\/+0WCpCVmgnWsOkxirggUnedCJWH53M7amJXK2YKRUdnEPQkx7rTaVuqrgV2u1oVMwVCoW876MYwlEyoxU4HTwqIho\/IDMam90zGNp+5GPXjG1mCDLtVhv\/F74lAmFMgEEcGYJCCJTDUyRWHgzyuXwUjdY2du\/c2dAXMVLYyz52RU+C9LRLJyDhuQL0KKHtL\/yEDeEeeka8tT4gd1qL8AzNVSsV5iRWU4IQyXrJ8TUehWJyHMNu+HS7tdTr6d1H3U3z\/w3b+k3bDnN5VCddInbMDtRpn4HxipBiMmCYoemLEsTW89xc3pMgIucIrJWcnigPwv72yuYg6nsF9\/ITlztB23N1CCPMqbU4F\/FywC1dpSwbkfaDnmMl85Vao1rxVter+01EK5VIlRrNftjvnjyV9vKDsY8fpceVQ6TS7NdhdlqtGbeaTQIgRCAKR6sr2zdursqqmrgfgFFXyBoYA+2xqIIYozLiqzmCnalio432IYFPrkbbSDvRSTxxOox\/0oq6wrupaeii3kwgj3x\/oas4oyujApTuGOmnc61PS4MBKoXxEPFdADX004i0RoXRJUwMH8mzyhPXWHPVtJsyW0EAIZVu+AnLzdZyUSlrNzv9ajk7Uat\/9sZOmKmmGzbaTAAA4SZJREFUx6mt2yuZpE77xUoGejUqOnP2zInTJ8\/fdxE+ise9m4z+fQPSG+4TFAvF61evbW\/udNsdZBBBIjLmlvYQgCIrgx9uuYRzVlYfRx71+yGBX+yi4RMQ6CKfoVnKRm34QdT1g3KtMjc\/PRzpQHJ0+9d+zdf91S\/7qnjENy5Bgfjf6359IRl2UpkY6+DHQeLHRK167MjRRx9+5N3vevfl+x90Mu4wkVpeWb91a3V3t6n3cmFCfd7FrlWKCGIqmW7tt\/r8zWSmG72TL3z6vl\/94PSHX9i9cLI3VZ24cn3hys1MIuUkRvby7cTs7H69FoR+H8t3aGnrofNrszU8r7y+4yx9gJAjkoAFuox0mA3VAQ69ZE+7C4VsIJV8ooWhEe4XLvz2Xmd5ZTvwFQzpdurgWYCZ1pjWaD0mi2LSb7owt4xuQqQzRglq4Yf+8f51SRJ4ZcoVVLiHnt3Y2Op1sfpSnYoWEgNURrlYPHRoNp9HQaOsBggaasDsxqCFTi82z0vHfuDLThv\/g3JEyAAmicRVSAzRSAPPtbkL2ChuGjI9NDsZpklnZgFAoh5GuA6ZTju4cuWGztgEVBFUywVGCwhuKcogWFvbubW888prt27cuPPaq7c2NrePHZrwSt7O9uZ0PffOd73n4oWHXnn5cy9+4oWt9V0359WmiqhM1\/EyqVGn3YrXMGBt8CLnxiwmo+nAFRbC\/Bwm0pke3kovOHv6vgcvP\/5H2OwtlSC8pY9mhf1Ae74Ut6kYtoEfMMlgCTqmHSvoJ6p5e65mF0sehEvpvP20nyp0M8WRlfdss03EGD\/ugq88foAZAT7mXxDpu9u4v4MI7wJmEV9yF00vVkpKF+k7FCYahs1gNv7AWpQTvUhL2Q7K58bNjZdfvdHrBrYlwwnExm7pFTU9TNZWIRkF\/tGtxMH4HNhWUZYx0fMAad6bj0kvGBShIjvUpwuJK7ydMgdsAVduELzT7y8GPSkWIYf\/U33L\/t1Sbkf7qjKK+8dEBHQhjUm3RgrVuemZn2TVcy6XzRfyBPrAxIxS9mh6spocpDZvrYX93skLJyfmp6lM2IA3QCdakBPk41Q0ZmITpdzstTtZyx5UinYq3bTt3XqutrxZ7fSYDXFGZq+5cfLwesnL9MdocsDXdmvwj3rRMUXMHN8dqzhOW8l2B1m7s7nVSOqdKs0LUO\/ZWjQGP0mUU4jISD+YRCF5ZsRfg2PKVZNbRtUoAFDp3cQdrtTnSs84GwaHcvFpF+OKVnfHZSxt\/dZalfGoDAxcxAPqwJCOf0Ntx2ZkaRIROQYpYT6aYMDRyQ2lUiFfnK2kJ7xQ1AdLyUx3kOoNrJqXqeV1\/t1+oz0\/VUAfXtmMhony\/tp+r9WGF\/LZouNACisPtrPW4489c+bMfTGQJgmGg+wbkN7YPYZcCUWfeOyJs2fO1ut1CBYFYbfT1YEtqQSCiM8OHfUkezBAS6aJEjJpBcu49upA3I2BxGKEg0EnCIi9qtXy3NwMBCVmbjXb73rns9\/2Ld8hkTFUjwf9U5tQEBP1ifvvv\/+pJ59+6KFHJmoTM9OzjUZrZ1cfEWh3e61eLznOJKORm0we7YdHn3vx9K9+4IHf\/3R1d79ZnVh94OJuLpUq5UuvXK90uti\/YjjI3FjePjK7V8nVnAKaoJ934UDXc3Ey4XLCYmkFoxckHuboaK1LOHidirZhbcpj3WRqDX1gSCSbzd72VnN\/v4f64z+q0UmMZBLakzq0IsOVEm7RNr5L71wlCKYck8x\/NMfJK5XztXrFy2JHG\/FOAhjANOQ+1VOTE7VyWac1mDU7+pZAahnJ+IhcEbtut5vXN2wUDwEAM9L6B42TKSIbaWGjjqWVBapaM4QWgXU+RBBFYTbrUY2EcIEry7Jv3FheX92NP02kZQsDeXylrZSNzIB0JUzW7flw71Q1d\/RQPRwPMDZHFuYuXLqcK9Y\/\/rGPvvb5l4I28VB6YraWdu1CrhB02\/hKOn7fnNYAQuiW1Gq16BcwyAMi3IuXHAz0WuQTjz0zPb0IBH+qGfr\/bGK+E\/X6255++uGHH1o6dGhudhYmwxwb66njI\/D5YFg9UpT6T6SGwVw9Vym6DlaK+6nsTqLYT5dRxdjFrAV3yRMlwWoQFI1tXi4VSsGglEx\/GIWB4eSDLcwoX2idy+XIx1xEc1gLohg2g\/HGQRjAP+mMvbyy8fmXrm1v76b0DF1BLZOgK9qSaMikECtKYD2ISQdcGBqSirMNFfkVN2H6ZGDgGBWx4OCuRFoPIF6mIhpxCC+eSI0LifEtN\/eRXPZj+dxni\/lPuLkrTlF7ZJAI4YeY33wXxnRrWP6AdUkIAcMBQLFULFVL\/YFemESWcObnpieG\/mB7ecvKZo6cOxEO8EoVFqCMcYA82070k1Ew9EehlRqd+thzZ3\/yF2v9UefiaT+TyQ2G7cmpsJibfukKkcd63v3sOx56aWlCnytBevT6Bt7YILaQgMP\/4MGxdX57EPQ3N3avXlvu9XD7Yr0kExsDDFpIAEyKZxGXkOgqvsYJIoJ2UwsEHnhaVIhbqdRk4sokyuJyrrGiM0Y+vqVEW65UYOj4p2lHOoBBPYqmsEasLcVBNKA9\/ZmoQ02o5BVyXjGbd0aLE\/iPOu4WnCcy6YaftJ1cJT8sFXSMfbPZPHZ4hkDl2kp3Y6O1dv1ms92xLKfgOa6dtFy3Mjt17Myp\/\/pvfJM01ZuV3th1gpgAzGdmeubShYtPP\/X0Y48+tjA332t3uOV3A26DR1xTZHIA5rD\/mYyby8LIZlUpBS69XN6Pop1ms9Fq54qFxcVZyWNCr7Lgbfzd7\/w+1HQ8EEkE\/FOcYm4jwUCVUvn8ufseffjRJ598+sJ9F9FNzf3u1nbr6rUrt\/dbizeX3\/1Lv3nu+c\/ONNtyhsfjlenizQsnR9ncqJzPt3r1KzexUdwqdnugpnHmZNJzU8lMp9UephIwJCaQwBSfDNVDwlgS\/+MooLmq1RrIRf2JrTGY5v3Dfh+J1vIjpMAIrm\/sra\/vo7sMO6oaIRTVjBwqKAfnuBQUkpE44PMfnEckwlEnXlSgOYUkZu94dq1WmZ6Z5Ofa2m63q3OXjWYmhtIj3lzerU2UikWdZzUYyWuUNJk4jKgjl8\/HW0xwCACDzsEkqpxxGRFHk0J61qps1NeeYjgqhke6IsXEGYjZxdVACIk+bNfudcPXXr0Zv+YyTujZAInKBmwlbpgoR5sNYOtREmfLOj6fn5sp7hA4ZjL3n7t47sLD243Gh373A9vLm8n+GNuRq+UTGeOWmdM44mcW0mU4FsaEAAkwgCgmxRCgQYd1Z1HI2Qfuf7hUqmloA8BbLJnJiouKhcLpkycff+SRBx944OSJo9MTE4qQ0APpFKSKqU+1oNeZqOQmytlK1oYxdvpu5E1mnGI\/jMbjgamJTe3jt1ngczDA8cLvhPmhYC6Xh6NFdy1GqTewjRKXzjHb9PgJCYAHcsA8ZGBFGD3o42sm05bd6YQvv3Lt9q0NCW5Suw3oR1xwsMdNHBwzPx0yNzQSjMQ08TW5RRrLOZBPQJ5yqjEWGdOPeIwrt5I61CZ+3qbFK9yGm+nhb9vWb7rF\/1Apf6Bc+Wi59MlsLkq6mKQxYb4eVKYA1WwU0PaXg0BVDo1eN4gVLP2hD0qVYr+vr2ngzONCLC3M95rdtZvLM0sztfkJHGXGGw\/1ZXPsHvgfjIbBKJEdBOff\/+Ez\/\/GD09HQXVkPJid2js5J+AejzmQZ7eDv7L\/0Ve959f4LUWpkp7XyI2kl2NAjACHBKPIkTh7gZLO5\/b3m8srWyuqOQmtE25zQAHLoMpYCEnmSKT9IzI7eyMR9xoWvz8TlVCPdu0X\/RndpsRCEk7nXLePGeTOUEvn4Z5whxf3EGcoFgCZjYKDEOBnmDp7Q2KwuMAoqMpEtFZ28O5UfzFUyOh5BSznpIJHqRk4pb9cKY4e4rz+OwsSJwzN09unPX5udzJ09VpydKhTydq\/XbHbbNjQrFr\/qq77y7KkzMVT34HlD0xv+7EDTiJFsvK1CvnDi2Il3v+vdTzz2eLFYTGr9dtxptwNZFwk2rE1N6Uizg8x2vVyxNBwnu52u8S2m0KiEVH4vXJxf\/JEf+tH4gWs8EMmM9Kc3HUAZ40SrgfqDlE5NTt1\/8f4vefe7n3n0KWYcJVKl5v7x516YoobebdfK+0a9vPbgub7jgiirkC2+9Fq5F8KQzWRi4\/KF3dOHu4kxbdE+lmNnknoDO07wE84BCYGwMxYZxocWqD9EF8kFHiQ26vfRZXROi929zvLyVs8f2LbOMDD6itYyWkasJB6GRPIhaB4bfn7Gc4wbSHLgMGO8Y7HERSkVC47rtJvd3e0Wgox6VddSxynHtSqVXKWSVWSl71iqL8J6eqYTFB9eDsoU5RsHZLRiCgyqChltQbXMlj3iPM1B7\/erGm3jdUUa0tzXmSpavgIqmgOV43n7+507tzYdh5ARHSsFzjTpn54Zi5o0VCGBxcA8X8zY9bJz\/ngxY1k7rWh2qnrx\/INzi6deufrSpz72nD5NEUWliVJtpp7MpLOOkx4NQXugV7xQWKBH+AdaBqCm8RLMomUm1fbxdcNKdfKpJ96e1oPJt6ZPQBKfvC7BGMePHnvskUcfuvzg\/Zcuzs1MT0zWwn4P9gThhPieay3M1EtFb7dv7QwLmPlut4O9I\/aEA+hNPlYmbZasZXEdxwXJBK3aaC4DJZstVhvjoQWMbzxCaXRkBN6AClCZBDD5fA5Gz1hpvM8gHN64uXbt2nIUcQeY+XdgvQw1D6wFPcT8Dyj0xfQYk1gQEwKxzbiQHfsgSwh41FShcRFiVIjjkuO07dEjNl3vMiTTu7a95ri7VhoJsWHzsSLUoXnALYHTwkMGR0ViyTh63qFzNhmb2wJVQMoo6V3EStH19LIr2MhmrZmJ6vrq+v727n0PnBslh+ZodgsPTB+KttEENv5WP9kvU+F\/+625IGImLnJ6fbk3M7k3VU2OgpRlt5fmN08dubo072rjAR78KOtmzasNiAoe0hADqlBkAIb1SI5bO7utW7c39hodoKQaCezFGDC6QoUxes3NAwUS5w+waArJ3GslQt\/tJE7kSQcUuVszLr+XoTwmBL9oHhfGFIlHiQvjfJyhAoVkqEYezhSOUeV6NVHySyFqJ1cql4vuoWqqqLeUIBQa3NrvJTJuvpjtV7JaCtK2w+Hw2OJEu9P69GevlfPJB87Nz89UlxYnjx2fqdTdUqV04fzFr\/qKr4x3F9JzDMYbnd5Yn+AgMZf\/r+ngMJ4+efrpJ5966MGHL128iEu\/sb4R9PxOpyMHThyO4tSqHPztuO7szGwhl4NiBFudTnd6aubHfvgfTNSnYoK9afj6oiXsy0ECfv4BP1NOEgpfPH\/xPW97x+l3PBt6xcEHfzef0Dd5uP0HUxMfzOWDcSoI+8OJ6al2t3T99nYp96G3P\/HyU+d9j2DV6bXa1ggzpoUpYgJEAh1nLJ+x3OgtvcinnUckCjG1VKlgigmm8jm8sna7u7WlFQIdySKXGJlBAFCUBzaSfoyoIE7qh7z5KXHlFlesciwzd+VN1DG1ZJv3G42tzS3tooi0GRCNBmhkqJMreIuL0\/m8iwaBAdDv6Ac9tzDnK9MPc4mFHO3PVFDljEIhd4GMmvwkUYc8zaQfjcaHRygkcZfeaMtwXPnJFB03u7qyvbPTAkLq0xC9KXocoMj4NKhVPQ8epRPpsB\/mS8Xjs7n7T9VvbTRHCe\/MicMX7n805ZY+9rHfvfnSlbA7JHStzpS8ko6BQxGGnW6pWGQ4oCV+7XV1QKRgNZ4T8BPC8p\/lud0oaLY6Z89cPHPqvFibsQ0O3+rpIOjiv0I+Pz83d\/n+Bx5\/7JHz9509fGipmPegBBoaI51xc61UsTPygub+YBTAzESm45Q+gwkGh4kR7hhYzeUKsH0QhNl8DtuPtrEtPIZMNutRDhVKxRLlOs6SiBemMqemGi5N6RkTWE8ncQgGw8Sd5c1XX725v9cxDC+ugMMHA+2fh4UM8DJLDEq3iBkeq+REh2rYhPDyKaXH9FYRFais45ONR86VapTQlqvGxLdGVvTtbHkVsEg0TjgJ\/MUU7v9gpAPEkmHPG4VaEkimR+YsBx1ogRE1NiyWUWP45SHQkJ4Rx2whW6mUEA4dPxT2XSczPVFZW1tzrMzJs8eigZ\/3cgj7OCl\/iK56\/YE\/8InKMnKfh5XX7mgvZTJRDEJ7eb19\/mQvm8ffihLj9cTAxp1PR8MoSmP1aJLJ5Ap50RLM6MhaoatWqwIZ8e\/WZuPm7Q3jtMcaQ2e7GUZXKM9VuLtrreM8eANFlJCPBYLZcaWcnzEaSXFz09tBwzgDobnSQ9x5fOUWqAJHdEeXdBKXk+IOVcEoE8rJ37vGKe5NlCUPl+i0yrRihkSiUCwUS\/nJYma6RHQz6EfqfZTK+H0r66ZqhSHISiXTcBE2bnYy7weDl17bLHvOwsxkq6fd3oVcplzOPvbEO77uvX\/bdnL3Rn9z0pviE\/z\/SMK53KvxOJf1JusTD1y8\/+3PPPPApQcWZ+fz2fzu9na72QjhP9uybCcMtaorvxj16of1cv0f\/Og\/XFxY1NqYwdWbibIvUvojACd1CgcclcQbIh5PYTmqzzzVTKX3n\/9Euh\/ZicRzR458NFdtbe+Oh+Nt4uxhf3fc\/8w7n7h64ayfHnmD1BBfIQVvjjMoiyGCpBUCukZIkFKprSH+QaCDR+7yNpwd21fEQG+FDMf7+61mo7e53SDaog3OLDYVzheIxo7GDflJbX7SeewsxFqJSig7CmJxleQgukN+DtFQaBWiej3oNe67EWz511QjjyBNTFa5em4OP8HL6ah1hMfYcpnze4lxKQSwGBKmhmwz2XhesAw+Af2D1KiP1tKddqslVU6z4ZApMxwJ\/rEdu9nuvfi5K5F5bUreKErDKB1SrJjQOjAfoA5QwQRq6bHj2vcdyh6dLbyy2q6WJx66ePno2Ytru1svfOzje6ubfX+YLWYXTs6Fw6hSKHb29uXipBW1YG+sVGZojiIgxQ8OgAcgsTDRsN+LCL\/cBy49PDezaFDO+H8Wkkj3h2ViZFvO3Mz8hfsuXLp03yc+\/dmk7XW6wX4wagZJ2ClpuVkvm3PtwRDXMEHo7+sD5XqDQB\/vSGjZgDwUBMNYQdgyZlf0uOu54hhzfobK9Q2ReOlXDEOwi6KhqefltreaV67dXlnZijDGMgEQSnqfbmPegBshq\/jmwEgYK6Gle2OrDLuS5IeaZ3CMK8bS6Uym\/HV+MyKUTqQGYyQFbnEQqmFyiB9hd7q1aLAwDGbCYCpqPzwM5kapFX0cxqVyUkurozQha8yueuYKnAAQW0qJPwPiOrlZW0eCjZPDPiKQnJqsbG9vzs7NeAVPIYpeXRqANAd\/Yjiyo6ib8HXwacruzE3mdveqG7tGcSTyra7fCe6cPh4ymE4vSGtTtJUeMegYxeUyWUmL2auR9fRJdLrFvcCp2t7aM19O2QefoDLGEn0ClsmIA2jIT65CiznGStO4u5wQ50mayUHzA75h+vFPkshjdAIlJHqKe+UWfw7K+SGKMqmDX5AyHp08HZKPwTA9KN27RSKjRMSPItLKn55eOa6Tr5bKWWuhlCq4o77CmETayXRC\/A+3nB1Xc+kxaiSZ7DR89PL8bLkT9V+9sjlVzVfr2d4okXKIzRLDhPPsX3qvk63JxP0huXjD05vhExBd6aJ0b3JM826eO2AW91lL6JNnz5x98vHHz54+fe7sOfhid3cPfRpFffOZqdHuzraVsX\/0R\/7BsaPHxBsH2PoCnf5LSYJdGDD\/sGUkeQVxFq+SP3r7qPj0M8N3v7sRdsLNve3z5z+bzySGUSJljfrh7UH0Snnqpp3t9JqpIb5nbjwcZYs5TwvmckI77RZdYh0HwwGmCEEdHjzF1M4pA4JG00HuCr7H2vspX3+kAwmaPT00RSrGoxTROjk9l5QIDIyxhygwOzE8bftGJ4oEOAE4B0aQkDKRVSWUIa78VDlSh8DGlEPSUFV0bpqnon6\/0Wjs7za7nQCnASWq1VR0oi1tYoRWm4HRcZSHkTnGCuVLeezkmAVA3++hzQkHKfCDkIAdocpYNuFREGrhhJkg+ABpTmzFQ7Jv3lxZX91OglWpdU0E2AS50Q70yVWrGSILjn\/Sdq181nrm\/jnHSl1Z7x6am7t06ZGJhSOfeuG5269c6e12Or2gNFXIVfTJpVIuRwwLosAwHRKtMiyzQEViw0R8\/CG6TRNOBYFZaMQePPPkuwr5olFXhjPeikk89YeTmaeRDP5IFR5ksl5+d3\/\/tWs3LMfr9BMNnLhOszdI9Lohpg+3NZ2yoXWn2zUvr6oV\/O\/7gatdpXrHBNMPY4JronXuWhnLyeiRkLwxHZutxE\/8A2ht7IKO8Gu2endur9+5s9Ht4jc48aZE2ACfE4pRk2qwBxJBQ\/L0TIJptGhhBlJHhouYjJmYVpvFsQltnILx1ZtZSBBLGkWJkTd1MygARjjmB+8NOl\/d2ftbjb2\/1mh+Vcd\/Txg1M86HLPwFZ4xT0O\/J0mnFwIx+N54GWLOyJRaCkXCDzEYNoNXiYdZLVwpu2s4cWToUDQnkEQd9DSVtZQqON\/nS1fkPPp+sT7aK2RT+tOt0jy0V7myU9xoM4icSa2cPLy9ONzsdIg9cdNtOWyM83WTaTYLlfjSIl1KAR6xOAmOyvqP9vc7y6s7ebst2XVABYoA0dqrAv4FcCKMhJSBCTCD5NqrngB+UcObivDHlSkazqcSgXLafycaJcq6UkCHJUdTypyh1lziqrH5N4hbXuH58pTV9xkApcjJ+YdyKv+go5kAdyqu1ip2zJ\/LWQiU9ToZMRQtcttXyMwQ4tVzSdfSsB0FvNXqOl1hcqOx3ei+9sro4W5qYyPuDvJM9fN8Dz156\/Evr04eNNGAMDiB\/c9Kb4ROIsAf\/NLn4X\/wHtCrF9V6XJiYmjh45+szTb7v8wINHlg4X87nQD7Y35RB8x7d9x0MPPmRqGfVtkvn5X1L6QxAbVPBPtgHDphw\/pTi46c3OFr78r2a++usHc3Mf+sRH7YwzxBv13IzlDR0r7HXHRN6DRNv3d1utqD\/U69dwks7Y8bSuOBgSBmFuOu12P+w7jr5JrQVXE6\/g1YJF6UwCrLTV7vi7e621zZ2BPAFz8o8xxji29GlkRTKEDCPqCs0TDC625Q4\/uUdGEqln+fokK3cQCkKYWr04N193XGx2gAqjG+QLEAzpJIDplDUQ8INeB8+g3Wh2drb3Gg0cm16\/P0KxFIsFxN7LEsbo1XCUANhC66HIJI3DcaRX0rXIj7bFvUBNM4Wh3kXUiWDUBKXAbmdsPBF+9kcRMU0\/HF199U7PRyvqWRUKG5CZMgnIYuCUZE+YbYKQyPayC5POX3r65K2N7sZ+\/8FL505dfMhyy89\/5EO3X72+v9OOkv25YxP5ctm1spHf3NvZtR38mLHnukCYzlh6GR83VwsF8RKHPktDgBclxmEQnThy5qHLTwgA2QaScPTWS4bl\/9C\/u8Xmz+uEmuzmxuYLL3zSPDgfgJRWu9tqtDvd4M7KZkNHnBOQ6YOpeFqOTYjb10qRVoMy3W6HWA0O4V8un4V5BpGiOpQypp8mNEDkaALbuvrkAfYrk9M2gv7Wxv6NGyu7OqHI0rM+PTVWgvnjgJIUc4fxdGMLoc+X0yEDIj5UIMOccArNWYdie+oQI9OfRNBKa+0KLsVX0Ju9eJ800JapcXLUTyQXev639loPtNr5aOCOR+5waI0Gr6STH\/ByAxuRSyaQADAkg0RHgCHNwW+GNmpEuyLRAyAm62WZ+BgXPjGy3VQtny3UKvjkDJpMI65gLO3Z2cUXPv\/gz\/3qyevLVi\/Yu3BCu5QGoy36n61OvHgtGvY\/\/47HPvclT7YziW6j09fHxHFeEjpPZqSVGKYRmpBDKgINE39lrT9wbMvvBesbe8sru\/0+dlgGGdTcS1TG3IKf+Gfs2YgdRgfuwj1s81NTNf49eUpAdZzXrO8mfsYlXOk8\/kmKnwEZZaVCmvOTq8GeasaV43JTX8g0PxnaRBRyYg6GZhYIM9OmciqTKderdiYxX7VqXmowRqmMHdvpBONwnKvnx+WcneD2CBds3It6+bw7O1le327euL61uFDOeelgXJg+dOGhJ7+kUpugQ6YfW4E3M\/1JPTv4P5rKpfLhQ0uXH7j86COPTU1NvePt73jqiSchBPQgHVR66yYYnH9oMKdU6Hqp3\/nN30LIdO5Kz4c\/c+azQH63C4s2Gs1+NGw0W9s7u00CqV6gxTl0GYonnemhGYNwnBhqZdCS2pEUjZOOpe83wtddOsGx6ITXb640Gt14lxFSbWO1jE+d1oN\/vS41GA5sbJneLZSoS8sQmqSk37DHxorp0T6NpfnM4\/ls1p2ark1NTQJnrxMgtsiYDLk5RJmEPPILNYE0osIkColUFA3299r7+AeN1t5eY2dnv9XuACRqyMo4+Xwp3jVGE0kprkF\/kEnpkONhX98egzv6A1\/Pm219EAGowrAHkPp8pYkJLCttW26z0bt5Y5UYTf4A2NaxM1+QfNO5VA+yLZiAMjWuT1TOLWUvn1t4+dpmIu1evP\/ysZPnd\/Z3PvHxj+0sb1N9kOxPLtSZIUgYhb6dzujwfLNZwSx46MQFunXkIqD5E\/gHshC2hcJFMZ8\/d\/\/S0jGRXynGxp\/dBC3glv\/3P\/+Jza31SrUM02Hp4DSo1O32PveZz0Vhv9eF302cO8S6D20363hFz82OIl+HztIDMiRDnQ6DAF9SEmUifogORWBpmJmxCoUCDGMC7mRjv7uyunn79gZBIEDAojShdswSam7sB1Xjnzh4sV6iDl4pGcq5cos6SBxEFy3vbnxD11OPJipPJhEZx3JlEbW+r9uMiqErReGzvd4E\/i5gGeniXpC2f6tQEXPjIvFbyxZiEv6kifRTFhCBH3GyJFcNAU+fE9MTxWEkNsxM1aueZXn4RK5bKZaBJ2vnZl589aF\/+2vzPX2MJ7uz28s7K5MV8JoYBf16vVUtrZw79NmHL3WxfoQiAmhkvnqvb7zhdjB1JtTr6dhQQnnwY179MMueg+HuXsO8cbCl7ZIAJxJo4pJ5SIECobt4itylU\/7xG3qZn3EiD7pIIJb+aQft+MnQXMFtXIeE+qIkzt8rjEl2l3z8EztQkxLqUEiKK8eEiwvj+vHg\/K8\/sFOc4MXBAJ+PkfPFfLFcqGQzcxXbSkfmCSkEyDSDVM61a8VMNosDSn180WSz052sFmsV7+r19fWN1ulTc+jcoTP5yJNfWp2cYSixwJ+E7N+d2J\/KBEpEKEOiQj7\/7Dvf9chDD5tfX6DxWzshFohdZpxq7O7\/D\/\/9\/6Bnd3pASEhvhf0+gRJyRdrZ3P7cC5+9feNWr93r+\/39vSZuwZ3lzavX7mDj19a2iL8tJ5\/La588dp04GxkOAr\/ZaBJPI0iO7e03Oxtbe50eZsnFGRCCx0mcf4QZ1WnrA79aBXQ9D0+Bm0gX4NGP4DzYeKUYLpZZRMzQTg\/5KtVCoZgNo6Dd6mDXg0CvEtCW+gyNTigVvUrVw1inM3Khh3q3OWJoog7b1hGHgT\/a3endvrn36kvrr760fP3aysqdrb2dThgmXKfoOnkrnfJsu1jIu6o\/CIM2swwCQeT7UeD3UT46AcvzmAWDo0By2TwlGxs7GBMAJjQwtkCgxY+ZSbRnmgi80T1ovoFbyg377WOz7sb66n6zffLoodrUXK5QurN89fbN24lhIgj9Wr1am5iETI6VxhVDadqWzZTwpfDA9vf3UYKupxcfAj+gHN8Eh0SrNdrDYc\/OzguLf57uJjyo0O8OorC5txthb4ba3A45bly5hhK2U1Zjt7Vye+329ZUbV+9cu3LnOpkbKytrO5v7vVHahZ9hYHT3vg7c2MOlVkyuuHOMo4vWNQ8X+p6n7Yc6ZNrxMFpRP9Fo+IkE7q8OMECRY1bhf7GUSTFgsRGCsnAILASj6KGAeSOGckmCSfgiAUJIp8ZWialwLzBHMhD4snoSbx5LJ7VQYeMuZnVot2XDtkApuyh\/FFHQmwg7tuukjBlD8jDmeiBBnxnq4\/ooOKWBeFYJGYs5Gc9lqDXu\/igKh4E\/zuDQ8y9pZ+xwEAXJQcq1c9ViIoscUJwoDkYXf+33T37uhp118qVSqxO9dt+pF87dF1hpa5hIDkMn0deWDYBMJvXagh7qSQ9Qhitg8DPa2d3Z3d0Ncdx06sSw2eygF8AUkQbYAQsJTV2zk9+kzjzCbTlwRhTpkCnQf4xM+gRvXPlJeZxXb3cLqRPnSdCUBAzkKb\/XnIbUJE9G6xommbzoopamK66UUz\/2OeLO42tc5V5lANDPTNpF0jOJWt7KWvpQ5Hg0zCTTfpQYJu2cM9J3uS1mOxgP8V0zg1EinyVeQFXCMplc3hsm7IVDJ+YWD8fd3k1Gp76J6U\/1OgGYhgBKBwVKByV\/qOz\/7xSTnBT3A9\/873Z4jycOft9t+4Ym88aB\/vtf\/+2\/+1c\/\/a\/mF+eILCzzih0QEazD4H63t76ykk4ksUTMpB+G\/SDqyV0YR36I1en5oR7B+mG362O4NVd0nuu2O51mu0k13w+x1Ns7zZXVHTK2peMB9E+IwehL+SA0OJAynEiAkVL9bzAATtCVsLWJe\/QIE\/0Dtoxm0jeOJ6crRG6tVntzc8\/v6jXoOKzR\/MajbNZZWppdWpqZnKwVi3msNj4BmCbCAwSceC7oCmOatRm73x+2W93Nzd21tc3t7f1mo9Nu97QdVR+RMq9V2BnznoECdVpJc5q3JFD9GGOUIxYfaL1srtsJr1y5FfhyZSgGcgMXKl2+luA0Se4NQIz1ACJbzBUz\/nseO7q+vtdPlY6fPHP41EXH9T74wd+69fLN1CC509ieO7qQrxRAWL\/bSwyGuHAgxTEuFUMzEIqGBIRRGFA+BNnJZKvb4V6lPPGud34pFDL4AZo3nMf+9KeoH\/72b\/9Wp9OGJTI6cbKJOcW7jHx\/sl7XCUappGs7URh12502Xif\/Ndu7e\/tb+219BUlOnsJp1L+X1QeNVDLo46TCDEGoEyMgDRSRVZDNyOzsNl977fb6xi56XoZWLwLAO3Sgjf2xmaHD2FooF7OZ2YRLhB47ChIesyQgCSEwNCG7GFJ3dDP+QxNjHHXYKOwrMyk9I0nD9cckeaP+dafws9Xa\/1au\/lLe+w9e9pezmR1LfsrI0rtwmaQO7lT9jMVY8JWYFjkHMIJNqSy9xYNTLPHsS67zbnJ2tlyslFNWNuVg4jOpccpyUuHinJMaFz53RTv1k1Z+EBU2N4PzZ5q1qSFC1tPRW4NRyu9302kEmQAhj5vLFPWGgl4FksPk+z2MMTNifPQPSGbiuDNr67vXb66GoXYUgZqRjjfS7gqagBcElxmkzZGp8sL1pE\/IiRdgmI6ZiJKmZhQRtcnzl3xcHteMiUKeoclwl5K4eYyZOAPF42pxnkQmzlNIIkNb6ou4REimE7ox\/fE\/rc1qB\/+A382Wy7mCl5yrWq5x2EZDvE+3jbLx3OlyspjXe9fjQTRKpP1+OgrDE4enHDd9606r50cnTswmku7Zy8\/Wpo+ZeSoaFP2U4uublP60Pzt4oxO0vXeF2g1CA9\/Xbi+TyJPid9lfXzNOr8+\/YUkOAbbq53\/+5\/TJAj2JGqIG0DXwZdbVGa43rt1o7e9P1qr6MD8+QRSkxiPsUD\/wUY0YyyDQKhbXRqO9s9fo+UGnG7S7vU6vZxSJ5fv9re399fXd3f229isZ11xqTLsFMJNU0qFAae0qkJozS5UkiQYgIjcIj4EWeVHoYsRQz0S5lCv5QtElv7\/X2t9tS4PFhhfpHQ+Jr2ZmJqenKjqdNjV2HKs+Uc3m7EIhWyrncRcsF52Q0vHWQS8WSTNwOg4rUKOBH3ba\/t5OiyBwa6uxs73flduhjZYMUqmUcznPaKtQ4hjG7yUOdLJwIn3r5trqyjYK2RAylvKYqgyhFA+nUQUx+nCMv\/Hkpdlzh6c+8dnrpYmZYyfPHz55363btz77iU9FOs09THuppdNLWHcLY9Zug8JCsYgrhilCI6A00X0MIZB0tE5IVEgkZ7kOHhCtTp88f\/rUBYHz5+luglV\/7dd\/td1sEt7rJAe9m6qPSU5NTYBxfCwiai2nYSUHAx1jaQ7gon6v0\/K7nX38xkY7GqTCkZb9YZ+or48adDpd3Mlh7C7o8zxD3E3bybaanVdfvXX12gpBpnjN+MCGHcTk+q2kEzOBRcGg5ERyoXpYKeMQUDNmnoNEMxOSxi42mTDUtkRJEz6B3AsjM8YaUWism47B6WfsF9Pp53PFF\/OVV3KFK567YrmRXcu4epg37ut1pXRoxqI9sbWsF4YKZ1qWBFGL4cehwW9He2D+k4OxlxkfWZjH+0\/l3anNbWtvZzhdTY+Sg164NzOT7HXLt9Yco3vSvbCVLQZnToC8cRL9M67kClnPGSedMBwRc5hFx5G+nGKOKcMMk7knQZJS8JZMNFvdmzc35EkPhANh0rzNb0TvQOrMebZmEwYAH3gIaeaG48CsYnzGvVKZaiRKwFVszvlJnbgwrkMmThrDJCCMMxRSmQw14zwJzMe3Xp+oQJ9xo7gyOWkv0xydKCxlUm6hUCq6tVxyokB32uACwsOh4\/cz5Xy6XqCh9k8AQDiyW50oOe6fODKbsa3Pv7pKX8eOLkxMzZ+6+HbLLdMxg2gYeuJism9aEuL+DKaY2CTyr7322k\/8xE9893d\/99NPP33s2LHjx49zjRN50jPPPPNd3\/Vd\/\/yf\/\/MrV678kbZvTnrttZevX3nJhjMHYRYGRZ30\/H4QBd2g2+p1mp1iqVSolKPRoK+zURUuGHHGPGs7H9ou6LSa21tBp9P3o06z53ei7c3G8p2trY3WOnZ0v91oKvKmTxl\/NZV4o1hj1scV0PK5bqW02hW\/QkCSJkJ6v3AwADKjqAsLT8xkZwqlbL6o4+SCINzfayqCMQJGl1QgwvM8q1LOow1QLih382S3j5LELSiWsnMLE8dOTJ8+t3jqzMKJk4fqk8V83kGvhqFv3kDT81rCEXkNGaffH\/d6\/e2t1o3ray+88Br\/rl9buXZlefn2JhG4ZWVdGydDb6t7notQ9\/zezVu39WRPSW9GxBRlTigmipgLKZ6akJHQ2cyVrHP6aHW30d5thLOzU7XphXw+v76x0t0VIZqtRrFWdLKYeKeY9VJjc0q3+pU6w7+kZwBg+hTRLfYgVmftTidtdnBMTU0bKP48fSFtbmwR\/eM8wX\/yVAc6JSKTtmAiz8vCANhb7e1LYF8V2okTRyOH0H806jSaW6vrK7dXr75y9caVW69dWX7plVt3Vrb3Gn6\/j\/3GHZRpwv\/nP5p1O\/7G+tby8kaEB6GIETaIzY8oqD8KH3EIzNa5oT4bGNs2uDB+AMTQ4iFxlGwhCd7BbtCRXAftWj9YKIjZbCBDGNtCfAtAwM2AZSS52MMMRtkudpyim0pgKyb6dj5jpZ30YMzk0vqqWTI9JlzQaw6yN4LTeLeMzHARsh+EgBRF\/e2d3cZeo9NsEBQwt35C775Ov\/ba+Z\/594\/\/s5+duHp7mLDDwWAzk\/j8l71r+fwxAOgkEjcfvbjz1P39UejaVi5fyBdyrmMmpk+qMUcogTMGAoOuTt04OP3JtnV6ND9BUdacHr2\/t78dv4KYSvWHWi3T6xn9gV7XM36ATCwWMImKQOFouRGfaKh3lWWkbL2VrsOMRWEjMsLs3XV1NE+MTAQ2I3\/\/wMbzk8pk6D+29+SBisrm\/hfK7zWJ68RdxT9J0jAmxQJLRtXkeokfAcVKW67nOXamlEvDJSGEGPeTSbsdjImnio4e+NKZ+cpdohslo0ECRLa73XZ3iKNbrVX8YLC2ub27u0fPCgO1kSxOBzC8aenP7jrB6urqT\/\/0T\/\/AD\/zA933f973vfe977rnn7ty5Ey8M\/JF0+\/Zt7v7ar\/0arsOHP\/zhdru9sLBQKBQOOnojk84qSCR\/49d\/5Q8++QeEzvAikiFm5F5yHIVhPusVCwWMnJ4a6hQHnQwI0\/r48OYdPNQoooR4w9TwP1Lgd3u7O7tR0E+N00GgLwpqp4CL5dZZyAgEiimIQganH4aB73EFpLAQ46FO8ZPWg2+RIvxeYErrjYN47zSAWdpqpC\/KZOxktuDU62WkdHu7sb\/XwmdAg6IM5RzoDfLM5GQln9cxJ3SDikCfIKXIOyomfh5hXpFIlorFWq08Ozs5M1svlvOOYxH9I2IDfV0XYRZ0GaOahRgUZDIdhYMoHO7utnZ3WhvrO9tbDb+H8OtBgOtkc1kM+c7tm2tWRnugTKsD8y+0m0QmLpFZYKxxNFmbOH248viF2udeut5oD85ePHP87GO4I8\/\/wUduv3S72+q2\/Nb8sVmvmHWsbNRpO6l0tVbHDIR+gIlCszA6w+FsdTva8AjWiX39IGz7PcfTpvcnn3hnIV9m6D9P99L1Gzd+57d\/E1xBFMwnaIRfwzCEB3GwxHuyqnIo4wfqkA5FTzUidi0CjfXBun7gh91Wo9HsdHs9P2i1O2GokDVtybrDup6bzdjO3l775Vevr67u4NzC4JgAwwsYCYkAwBhjr\/VtKAkfw6D6eoV2CejgHSpylXzKK1DgKzkBJCTQrB\/op5Edw1eSHn7TFTZDpi5Fn9g2jcgQMkVY9tQ4So27ibCXTPXHqUJiVO13Rv10pBNzh4kU\/kGfHGwlZx6PaYhQjAnlc1kc63y1WqqU8sWyd3hp5sih6dNHFw8dnp1dmPTszNkbq4\/\/7PuXVreLfj+Js3D+9Pq4b0XjMGONpyqZ15a3Lp9\/8a\/\/lZ1CdhTg14yAxXOY5qDjh8h6MQfPZrHeiBPTiWEG84gtAo7pZeb9SPswms3W+ubeyupOhHek+ZvwWvKaxIGSX4WI6RUK80afcaAJoIVtuQY4CgajhkxkwCR9MAro46chBzc1PP9oq+6NIHMFq3GepB4ky6obVyOZjNEh5nFhXPI6t+MLSe6FZskgyouvzH5hJuFlsxnH8jKj2bJLXzAkpBslvGZnWC45kyU90mQS0tHj1F4naTvu7HRpNOz74aBcq9dqlQRETGfPXX6Xmy3RP\/RUxG5AiBH2piVx30H2rZviOXKNSb6ysvLjP\/7j\/\/pf\/+vNzU1zX4lborbhFa4HpXfTHymcnp7+2q\/92m\/7tm87evToQdEblra3Nr7\/B76n3W4gZgCJVAzDCNWCw4zU5XI5rHHUj7a2d3HdES5jeNCR+sIrYhNPGUHF3puvTqeJGMIg0mppOoVSROAmJicx+\/li0WzM1hdO0ZjGmx71uj5DYmL1BQEjPkRIuOJy4fF4cTvuLhKgo7HhesCgN8IZc1Sr52ZmKtPTE\/t7vavX7jQa7WTCQgyGgwBQs17Oy6YmJov1yRLdhmFULpfpJzJHyHY6naz5XgMl\/HRdtz\/Si5Fa\/BwOs6436I8a+028lKAXbO\/sdbs92QQTpBkdET+M1FNe5mH0FdrB7PAZRblctlgsdNqdRkNfRqaJCM9kqHT3faR43Jjo\/G+U0mh6au6vPFp\/8v76v3\/fZyYnSk++590PP\/MNt1e3f+Fnf+LWC7fHScsfdxfPzlcmJ4pePtjfdZMjx80G+lCCXoUHoal0Av8AxRe\/8Oi4LhhOZtItSgfhofkj7\/2\/fIttZxn0YNg\/T4nEJz7x3A\/\/\/R\/EtcX2EGhREitLqBOz3+7ubhD24hWgXk8vu8qapjEJ+IUDqsMJ\/X4wTgysdGacTPfCCNfAzeUOHT6Er5b3XMdK5bKu7Xg3b6+9cvXOIBqnEQbD5PSvFRw98YFVxA8QDqVvNtPBUSnEQA5xRh9ERgC03GXeqSNDNdf1gHNAFGuULcYhtivIVzqjoJb+iT\/pU9WQKWMB8HEMZ8rTqSSSF0fRQkQPiF3\/2GA0O4zel6t8cq7uFply3nasQj6PlFarVewR7pGWvDDh48H05DRA4mEn7ESiH2XzWTzU5HC02+06g8HTv\/qhxz75ckYDjrvJxPPvefSVL3lXkMxEke86qdp6289muhMFa6QNtjgwg\/EQzxYFQqSEkQPhyVTG9wPQ2+v1jBOmk8Tord\/XgYn5vAd+QlzzvebLr968fWsDoUR3gRlUirGqUsra6GGWHnEUwAO4QpHhMSTw2OROyY+PNXB8Bc+Ugrt46wZNGDRGINSiU\/6BeUpIYqC7LgLNufb7IRm0gWQebpDKUq+GEBqdu2S+MNzr2qq52UkN6YS1\/qgf+SNrUC\/XiUQmiumpHPonkXOHTsZuBqN+aJ8\/M1kuQWB7PAgHw7A3cPY6TqlWLRWHOdgqNc6kANVpdHaXjj76nq\/5nniUP8H0Z2idADIjxv\/sn\/2zv\/E3\/sb73\/\/+brdLIZSOiQ3tTa3\/XIprcsViPffccz\/7sz+LrXr44Yfj8jcmjd\/\/6+\/72Md+H\/2kfVCSOmkUAnumg0VBPoPA564U0WiEHaWJWQ+Ttx4vuDFr5A\/AEQG8B8pw0OPH2FrBGyXw4q9dv9Zo7FcrFQSuWCjMz84QpROho4iJyM0GBilHSS+SjMgxiBEpUnxLcZICH+k5bmas5NRUbXpqAqd\/bWN3b6+JRUYEmBLYIiZy7MzEJEqsSERBmaZq3mKiK8AGpYVCgZ4RUaPf0RIZJJ8UBn4UBugPl0gohzrPFIo5+pmoV+r1sueBJ1R2GAt8DBudm0UH87LTSC9T4EMg2tgAPB7uxmEBYwED+Vi7kbhFcymI4aiQL03U3Gcfngv7wUuv7R0\/OjO7cPzQ8Uuff+Xl5z784UQgQ1VfnChNlVD0+BS9Vss1E8kXinRF5\/Qmj8o870ibs94YCL6EKEFfW8Mvnr984riONL7LUG8cX\/2XlJaXb3\/oQx\/yPAd7FuMkNqXgFqJyJenxljb8y7OD\/zGTsArsDaoRUvDfN0fu6zDNRLoXBI1ma2KiTpO9nd1vfO83vP2Zd7ZbHZzL3d1GgM890jK\/6WHAgHq\/L52ChPRsxoKcQxPcanMg4b\/Ek95VgHXTlljGxTPQvj5zfOEwgrXM0gJwEECL2\/UGLz\/J0hTpHJmPmGf0aW8rn7OLebdc9CYXak94qW+\/fuNrtzbf3tx7W6d5od2a7XbdJ87Uv+zdZ88eXVqcPn588eSJpfmF6anJSqmUrdeLtVoRv8VxrXIpz9gdv00gMRyOO\/1hp91LYghHGadYSE+USq\/dLvR8bK87StWurgTF\/Pqh2dHQHyZGm3ZyPzmwo3HOdUcmiAe7zCtmZoQU2YnAVWKs8wqNBw8\/g1KYHL3EDMulIihvt9vmGwer3W6oLugklQJBiZQOb1Yck9bTAv7RBBSK5HqwiI8vAdR+Q2OhlZce05HGWmJImTcPzXscjKKL2bFBZa3G6Rk\/LXUKKk1iKb6bAf380k+mQBNTfGD444H4qc4NPHFN8qamMmoIwagMKkahk7OzXhHtl7OIz9oosUI2Mztd2dptuY5zaL4q8qbTYdgdJjOtbjphlyyvsN8db+8nwm6QN4FP0q0+9NRfLddm6PxPNr31fYKYlqQXX3zxK77iK37qp34Kix6XHNRIJODmBx988Nlnn\/2u7\/quL\/\/yL\/+yL\/syapKJr8SvVFhbW4u5IU40x1nGt0BbXbp0aXr6DXkMjKD89E\/\/q1arKcWE8CTTaCkpJHkGuNGSMCDJZnOK\/o3tN69aSWRQiHEfA3PgK4XxUzoUFlKB4qQ+AsS\/VruNFNUnJvK4FOPxj\/3wj3ztV3714sKCnUkj1Vhh7GmhWMgVc2MdEJQKtXl+QIf9UBnGACBgE1YSKSSJ2KlYcicmK1kvu7vbXFnZ7vmBonSNJouIVLpean5+umg2E0QRMGcI8oyiwVVHf+nbtQgmXdII7we5QZkiqMxdo5uTAdGvev6a6LueVSzlavXyxERlaqpeq5WyOSeVIVyI0pa2fdEK8OgczAiAFPbjIAjgii4DdWSE5LuxBW3iDOWgPJfPlnODt19eWt5stnqDyTqKb1RbOPH8Jz+1fWtj2Bt4rltdrI+tkWvZhGKoLmJQOCaMIswSA4ElfDRUBj1DPv3TNkxtPcq4DnA9+vAz9boY6S5vfoFF\/yyn23duf+QjH8rn9OwsnZKZhXXJiy6GRlANmsbmFk7GMEnLSrOPqUwdEZcgVIT2uLG7v1+uVqYmp9rN1tNPPfUtf\/NbZqbnHnrw0aeefPrs6XO1WmVysg6jmN0LhKHqBwMl6R+ntPprxA4WQihNUCq2p04f2dOGgiF+MKSFeDATGT0WSA6xqtmsXSh4+byTzzmlklcoWFNT5cXFKYz64aWZQ4emT5yaP35i9tTJxXNnD506OX\/0yOSxE4ceTqdPfOITOZ1hkWS240QKTo0mp+9cPp+2BsnRwMk4kR\/5AZzVVQSfzsBmsJPjZAEaJx4YAY2ijGsX3BxB+jDsIMu7heLYtSeu3PDgx\/TYGyfs25vri7OtqQquAGF4aqgH4RlmJ5FLRLgAZhkPfYIkyRibFxH5SzkJmXXwCMw3kT3HEbUymWartXxnc319T6eG4JOJbkKhLLcWTjI4VhDy7nsYIhzlXGF\/CaweDipxK84YLcKktHcgVoxc6Y3b1NfGDmPz6QCNwxUGAMi4h7j8XjL64MAPiCvE5fdSXP9uBYGgBhpem5xVMu7nCwXb8nCapsujxZkCkcVULf\/4Y+f398N80a6VnLQOaB8Mx\/1emOyFnlesD5NWM0h2+0QI\/VJ53PXDy4996dlL7zRj\/gmnA3S8JVM8NSjI9Rd\/8Rff+973IjRxyb1Zv+1tb\/vKr\/zKZ5555syZM3HJfyp9+tOf\/vCHP\/wLv\/ALH\/\/4x+OSe\/3U6\/V\/8S\/+Bd4DeUriEf+YKe5nfX31+7\/ve5rNfR2Ep21TnuXY7VYDH9pxXIQB5sSCEtWghtqdNgYmftEO5UgPEih5zXqW4DrukL86fgSh0oe5gjDAeusM+cZ+sVxYXDqE1XrXO5\/97r\/zvQdAJBLRoP\/7z330xc98brexe+3G9W6n2+30EN5QrkByf3vPBDp6SdGy9WJkKk18hglMLx6anp2bTAxTt26urqzuoCQJyBUPJZL9cGilEwvzVXyCbN5BWvDSMhmpS+2HIsYPA1wc5ssE5UC7LjY7dj4oQelKT+iskgEEQB2AbyICHAgMAC4TagEl3Gy3GRSnotfFggxbzW4QRJ1uG4klSkG5I830QCsQJUwqWFERKaYsI5IHHqbFz8PHj5+crZyup4r1cpKQNdiYnD5x5smv\/pVfft+LH\/30KBhMz0xUTkyNrFHRzSaYQ6eTzxXwXVAcwN\/tdh3PQzP0ut0cPpzOl\/XCXjdpZwaiRqqQr379132zlMufpz+cfv4Xfu7f\/MxPl8p5zIaJTeUawhUQCLqQwRpBo2azCZLxLDEE8L84HxuAGy0WNXoA851I7Taa\/dHg8JHDNC8VS\/\/z\/\/hPZ6fn4oHupf4wvHN75c7K8kc\/\/tyVK1e2tnf2G81eB+1BJBDAdPEOGLgGWYC4wMBPhoCRstm0l9WhXljvvL7AZHt4rIY\/iadpIg4jeI8CbVwzi1JYUMytZdlwLNySVJQrA5z13JSXP\/zilUf+5b+Z1IfllfiDs399ZvK3v\/dvdtP91ChZyBUoxF7LYpnFJ9d2QjnQ\/Rw9p0eZcabV6Y6s1JFRcv4\/\/Ob67NTnzy+ZJ1mFTHL0xEf+4MFf\/\/0cDJ9I3Jya+OB7v2JzoZ4OhMBsJhNol19i2AusnOd3\/U6njSOQy2Vx37HpfSaVzWKGQSZUiEWJW6gC4HccyePtO+svvXT7lVdu27aLUhsMdSAKPgDoEsbMazh6E0FeMqpJRNI0TVdc9duoWTNHE8bQKoO5l2aL1waoJqSaRAnixACgQkujJgEe1ZgReTP6gZdASVx4L8XlMQAGEHEOnXPVqqpK8WFQtPgKBEWhbSULxTyTTgy7X\/3u44\/df\/wXf\/mjpez4\/H2Lr15vZfNWRa8gpvtREI2i\/TZKcNKrTHSCUTuEWhl7NHj68bOPPPTY7MKJtPkI7Z94eiuvE0A+6E3mx37sx77t274NloWupJjY73rXu37iJ36CWw8++ODEhDlI8j+bZmZmHnnkkW\/8xm+8fPny9vb2jRs34nKGQBPhKyDwjz\/+OP3DQJSTiSv8n0hAGDd\/\/\/t\/\/eMf\/5j5YKuPpQdwIycD5AMN52Wzw0E\/CgM0C7459QcDbKpkAxNsO3odloiUJqgJxEBxth7IEzLFJxJKDvf28TAG07PTuPeFXPE7\/853lYpf2OMG8x9eXHrkoYeffPLJxx999NSJk9hR1Fy5VMLRdx27VNbH1gBWgZR2\/2j9oFwpTM9oYXZre29rqxGG6Be9XIQ2YVZ4HoRKc3O1QhFFBFx6PY\/wAuhQ32aO2sNFZfKe+XKBmciBbZY7YM5hjNVrr0doos\/hmGPsFGxol1ZKpwUHfkTe85xqpTAxVZqeLle1kFDDhWm3u1REkzBQzCS6GueJTMwkXOMMCKTDIycXx8Ho6qvryyt7n3vxSjqZ90ozrXB046WrO6vbqLbSVDGTQ0OlClmv7\/fwlvCTmAI6SkpoONDBCSMtSmku5mmF9hWkE1uNBp7ZzOT8xQsPC+l\/nl6XPvO5T\/\/Yj\/1ouVzAzCiy1AfoEASlmKtjAkE1fopDzDpw7BPAvQgidUC1cJ5Kt3u9Vrc7vzify2d7ne63\/+3vuP\/C\/QcjfSGNiW+rlerhQ0uPP\/bYE48\/fnhpybGtUiVrO\/DGsFzOLSzi8tbnFmqHj8yePo27OD8zWzl2bP7I0dljR+fOnjp27MihpcWZ+ZmJyXqpUsnnck61prdm8HiByPP0yXL4HE+d4WTqzOI8YjvWqRX95BjXR99xSAwSKd+vXLnFTNoF13ed5en6lbOL66eObMxM4dNmLCfhWgFtQn39gd5cPALXhr3BV1LP6JN+OLASo4Wwd+Lf\/daZj32qdms1PHqsOTuTxlvNOfuzU9n1reLW3rUziy\/8tfdsTFbHkeKMbt9HrOgXZFoygkmtgdCv+QQJOfSGluuMrUUHcgV30MI8wdR7oRLDcLC51bhxYzUMR9hSqABEEigTohPoq9uBdiZJ6oDfiCEZRqFDMlBcpt1sPITWukvvB8v9d4VUP4yTgcEWOMiVKtEw7oTEoDSnWlwCqHG5OIluTbpXHpdQ894tkuop\/CIZROtX38vKB81rFTV14Whuqup+\/PlXThydz7lWo+WXynpd3KiacTDM9PpWtlAfJdIdX3w7GgXV2uQ7n\/0rx06cJZqiIAbgTza9ZX0CMA5FyXzXd33XP\/7H\/5ifMbrJLC4u\/st\/+S8pjHcIUgKN\/3fpQTUSfZ44ceK9730vnXzqU59qE4ze7fm3f\/u3p6am8DDi+n8c6sZtiZ7\/l\/\/lxzvtFvYSn8DK2CgRhouCXsbS0jeVtF9mjO7gP70G7JtvCpuJIxnaTmhe2aIkPYiGsbi4jhMGek2fH9qG3fNL1XK1Wul0u\/\/V1\/9XTz72tAHhIDFcnEkn04V88dDioWeeeuZtzzxz+PDh8+fOoYUJziw7UyoVkYlSucDAhESTE7X6ZI3wfHVts93yMYd0ROyOCCMHtmXV66W6eY2Xf4gu8T1zDPXIU+obb6BUKuFSMC7WPo7WKRcBzHoj16gfokOlKvSMMx3oCwd9nB90jlE2VCful6di2xniGbRQ1PfzhXytVt\/c2t3e2gMn9A8SCTBAi0HaAZkZkGv8i45InmsfOTy7v9NKJ+zlzZ1WK9pvjDZ08EO\/vxf0Wq1BIlk7VEtbKdv2rFSisbVRLlZsxwtD3wyB86FPeRmKSDcFUaQtbChyfCkLiowefvCxhYXDKBBqApeA+TOfgiD41m\/9llarVS4Xsco6mRhW19q5PoAb1wG3MEAY+a6nY3PCIOxH8g3hItBITRI+Q\/yqwu7+fq5UmF+Y9XvdRx599Ju\/4ZsxHHE\/r0sqoRVXuAJ7fuzIkaeeePyJJ56YX1gol8rZnIfXAcvPzk0eWpqdnqp5TrqEJ+iJtlnXhakBFR6E82VFFL+PLLMdstfTN7o8l\/88rTFktEfPdmwkTKZRDvOQtvAMfCuzO\/QjJ9VZmL\/21EMvPnrphfOnXjx7fO\/hS\/vzc1FSi39aKofTA2J08Y3Bhh6WYYcsy+kRISSIRp1qt332n\/\/i6c+\/ig+Si\/oWUfzF037WGg0jP5nqTE003NRr737brXo9DLojreRlHEz4QMt1BPLIlPQNyieKbLNLSQKT1OdbAQCxxYTHSCNvWza\/5cONxs1mZ31jb2VlS858Uuc1JfUNR5yhHDKm9UotioBwOodYCR0ANDT7BPlPa4HUOqBQLImGmvIBuaG\/iLpx+xg7\/kcdbVUgY1QXPcRtgTfOk4CftmReXxgnsQv93GWA+C55M7j5abpiUPGYnXFzNuVVHRSduHCkVC2VXvj8nfPnFpOjVNvvymMYExJEg3Gy6adHmaKTL\/jhODSxDyrnoQcvPv7o43JzoZ7m8ief3rI+gQiYSPz9v\/\/3\/8k\/+SdkoGJM46\/56q\/++Z\/\/+UcffVSVFDBDbGrDlfxn2vwnkniWgPVunUuXLn3d133d5z\/\/+evXr\/Mz7v9973sffsaFCxf+sz39H00\/9VM\/+QfPP1eplIg4kSe99Os4gwg7hAAO+Sl4iNETYx0IYOtRgh6OwFpyirWaNx5q9xPcZtST9gxTX7E4OsoIVavdweguLC6gLk8cO\/F3vv07UZ1mcCNP6kkTEXLMH6wsBcj87Mzs0SNHn3ryqQfuv\/\/SpYsoCdjZ\/CPpU8J4LTs7u7t7jQhx0JZDhk4QzERRgBqZX5gslbIOqtDgHS0DtKQwDHK5PLICzKG0j46oIUwhqGIIMCypF2xakOA\/FKvrusOoHysIapoXlBBChHfYC9oZi6gln8nYDJ3NFmw73ekE16\/eCYII0wKs9CONjVpF3o1midVEzC3YGM1Hh9faC7OHdjZ3mrtbhHh6pz2TdmsFz7L3V7bbrebISkwfrufzeUKrqNcDy+RhGShSLBZxWIT\/g7PedLICTtBwoJN0sV1An83l3\/HMl+RyhXuYN9c\/6wnMv\/TyS+YhVyL9\/2nvOwDtKMq2t5w9u6ffe25vyU3vvfeQUEMXSEAIVYoiFhQVBUUFP+H3Q7F9oChFQAQE6d3Qe0KHdFJvb6dvP\/\/zzpwcLiEgIOXem324nMzOzs7Ozr7zvs87O0WBIbNhRSAtcKwhLSQOu3bHt\/m+BuzFgRkzV5VrfOrEIjItSt09KZiLhsENtmOBGv7gvPNjYZr3tavOOXaveWoCJBVyUAsOGzIMGnzqlOmVFdUQkO6u7rb2dvDLXJbWnqK9EwW4wlZPT5dh6pJP1DQFugUMxSf70XbACFHsYCCE3CDquC8EGwIciYRhZcDqkUkuq4OUlsZLFL+SyaTRonK2mK2q7FHUbk1OB1UxGESDzzmWoqFRhPOWkNOzyFYNBCH1suQzDCuRTOBeyMEPwgB\/wBVCiq9q3eaKpjZ6GlEOtbQ5XR3W5HF6IByUVbmuqnn0sFQg6NNpWxA49GXxMvoaYNBcX\/BtqB5TN1AbEGMUGPkS26ZVm2hmMnE11hmJYqDO4cywEdykWnsSmW3b2zo6k2SpRRqWgdYN2s8GcTrgbTDqaBQwiqh3pkXpFojEayXSz5o7KRXWDFEAvGJmQZmW29U8ARSAh0HtbVoGgLwIAHnyl8gDlDlLCUFB8Uidsb4NxOBahPGLW\/AYBPDLL8cvCA0Ps\/4nghrw+1Ra8ayiqkyTnAWTB+mGvXZj0\/Ah1T3dadqFS6QBJVB7uuNL5XxapCIvKVmdFjWAPqyurDrwgAMqK6roGXnWPN8vFAONE\/D3CqB6b7\/99rPPPpuHefzXv\/71v\/71r\/BBSaRYQvbO6TR+mAzTmT0qZHaCkvHrcBQJh4877jjIzRNPPIH8+Qu94447Jk6cOGbMGEr1X+Ctt16\/4ne\/DgYDCk1sFWG5QCJJ5QmurPhA31m3AQ0fcqBzWPnRzMAVoAvQuKiLDlwBdJhm7VPRideycVLQktQyZfrEaNlueWW8pCQGW33uN789cvjoXQ\/C\/wishgpH7BHfBY7ipfHBDYPmzp47d+bsKROnVFdWhiMhqEnAdvKaFtRoxzUJTrxl2q5tQUuXV8BRq4Z5RlHBtenDIHkkeArq8gVRAI+BoiGPBIrB7w8Fg3gQMCKUDf+GQiHQGsuA+Vdos0QRmUMHkDLCPUiFsdXdcSW8CL8CqqQgPUoOW4Jbbd68s2lHJ6oIbxKReFzSUSJtRAR9AfVNxWHAOVQ4AjiN4u\/Ytk3EIxg0IjJnmYFQcGjjYCj8ztYOmKfSmnBpZdgw3YCqZVMpsK5oOAyOg0fI5mgyBfUVU54IaEQ1BBEUyBWkvKyYgh2LlMyfs5R9NNlV13s98Loh4X7N\/9Ira5SACj9UpF382GyxPA0+x1m8HcgMGRlFgpWFsg5HIsSZmXGCXEAn4+WiyYAQpDJmRXVZOKRmU7lzvvaNyROm8la9q87fU\/N46Rz8gMUVwHoOhs+eOXfWjHlDh4wES9+6tamppRW3gKKnUQZwslW8eT+eAXJFs4VN\/l3LhWePhsy\/9IE34xHQHkl+XQdsUqMv8SJERWEzdNioSdpZES07bxpoR4LtqrIKG+9I4BYlqpu3nCykEvlDLMEr0LxptU4YTtwDboMs68jbtHRQz8aGwBvrStM5cHfkHt7Z7paUJMaOgvPPuijEaCgEEg4VgWaHooHh68S9HMYzqE1BblEqcAIdhZEkEC\/UD\/gZbg0gAc7irXGvA3Qc9ry5pXPTpmYQcdEHLYusuO9ALw43gnVH8+T1DCJCfR7UW0DGHm0Fle7SKumkkVB10F+4Cu8aNUzDOFEvzMzjDG4HjoEwvSdScQXjze5CwCGB6Unmu7ALIWDERuiF8cT8AZEeARzSTXe5B9AN+Idujzcs0mcsURYVjUgXaipeVuK3UvMn1e9o6dq2s62qvCyZToSCUWRmWlnwgEQGMhrSAqU5U8DbRvPHi549a\/bs2XPpKajcTMjeI2hfDAZmPwFe8MaNG5cvX55KpRDmL\/V3v\/sdf1gcMg5J9c9\/IWCQO1r\/go6peez2csjA0iXQRYV+LZ4rXueSJUvQHp566ikko0xpEMADK1euhHfILv04oALQvxC4H5z\/\/e6uzmBQI07A7gvLFwCRl2kCNKMI1IMKkWbslVoKzCrKQ7Kbh\/Gl1fuhcZAhqAD0JkpbEG7qsaSO+vaOjmA43NBQl0z0zJ83\/5STTmPnC0\/xcREIBisrKyeMn7B44T4zZ04fMXRESTSGBoW8AqovoKlwofFkoZBaVV3JxouRq4+ztDUDfZij4Q3hcATNm2Zw0eSIwkar0DVIi0pG+ySSAE3HuhY0GqtPkwjwZFBeOIvnZelp4AhaezaT9as0Eoq+rUo0VhEcaMP6rdk0rfECfw7ZIiWAq6CxUcm4KYAYnKL6YjWCnKmwtlkeK40Go0SqXAfKprK83Mzp6a4EUtUOqdYiKFGIqtukmRrQ7JlcDpYByoYpHUnXDQSRGI4sHhfFVoNBRxBzpjV21ISxoyfzmvRQALVNsaw8\/trrr2\/dujWbzeDV4w9KmvgBXjZbUAjtAu8LIgMfnN5XnlxMGlbK+mMgJ4IoZXN6R09XpCRSUhKBCztv7rxTTjoV74I3t48LLhUoG953dWX19CnTlyxeAj6t+bWO9q4dTU2pdMYVUCQVv4LkQzm6ezrRBmlOENlamQYqMpIKuQIPhREl8SPFQiqFGyR6KOKOkEm3LB4PBGMg1IKTDbe2VO1sL09mZFVN4qlN2sPQ50qKpJKlg72X2MJlPl\/Ecsq2N+UDWlZwoEx6Alq+JB7fuCVkmlAYsNgdmVzrmDE5WTD0HMqBu0O94KZs2gLdHSVE60NNl5SUoPlwww\/phQ5BYpyl+uerkTAzjGLTa6FnRAZiOqvv3Nm+s6kT5B8X8jTMyUaLQ2vldhfNE40LWhfX0DuFiUaYVBrTzqgoKgzxJx8MP6oeLg3ui0gkRUKE8daROTnlVAHs3rvAU1It4+5UxQzsZtRhwI09nXyXRuw6T2EezyNZ\/nghdC8UA1Y9EAzgessww9FQTYk8bVz1xneaW9vT8dKQ30\/TU21acgKMTQYpCkTKBVnL0q7sNM2iqrLyoGUHlZXGkT+B7rnr9wvFAOQE\/I0eccQRb775JsIkMIJw+eWXf\/Ob30QAhwUTimhqhPifJryxVs7EBwEmV\/RvL8C2skQ8rQRJpQE8jCksXbq0u7v7+eefpwNaydxYu3btcccdhzC79OOAXfGTn\/7k0X8\/Ul9XCz+BcmRNDmaFGg+NyFMhx+DU0JA4BxcWSYLBEC22TzvrgBM4YBJonmjV9FC72g\/yAamHOEPY27s60awHNQ5C+8ep73773IqK6mKBi4GPCF7JHLi2NBYfMXzk3FlzZ8+cNW7MWFJqZaVQCrgVvGS0ebRBKhVKKCu0IYOh47ngLeGJaNyjIKQzabgSXOnjiXAtsOsuedIlUC3kbOBuVFTUBTsFVhGG+0JWgb4O+Ezyb0hn4YUjsrMjuWnjdog9LoIgvOcxSfW8++BUvF1sgB8G\/P7y0ng0AEcUxl+LhSMS9Fo+b2R1f9A\/aMQgWVWIxNCirRYCKLDENm3CreGM4JDN1CLFSnmSZNJ6vCBrriPOnrGgumr30e97OcggwPAo6vTp0wc1DIJcNDU1pZMpsqCSqAa1UCiEVgBJoDfH1DdeGqgYJAYeNipZoq07QJqlzu5uvPPGYYNxqiQS+\/73zy8rLQwrphfdWww+At6bnhdSqa6qnjRh8qIFi0cMGxUOR3fsaN60eQvNVsgZEAO2MIGLZ+FNGIVDHmjBIDQQDOQAcWYNuvBtntMCFq8EA+GqrVvH3\/7g2NVvjnzljdEvvz58zRtlb6zP1ZVvi9Mex+R3y64ggz7QgPusbYejkbhgj7jn8ZF3PCRrSuuQhlQ6a5m5ZH29FAxUr1vvc4SWkkjLcYd3VpdkbNp4HUoAd+RTN1EnnK8QKRGpSvFLKoi53Xh+WDuUDeFsNkttkdlmnpi1VSsSDsOYNrd0bNna0tWVAUECI+Ifask3YSac1zzaAW7EapTO4rFRP4iFV8DUFvKk1aNAlNiF5Nyzq9419jzAOQSywb9Ub+xxcAo3wiHOkFOBYyTGK3OJuhcuRHJ2gl1deLk4xC+AfBADsGekMQqsDJSnqpHutHI6Gx2iDq2Sxw4re2tdc0dXtqIMKoIutGwzL\/gyumRLIS1YmrXyhkn9DeA2M2fNnDt7DucxBdCdv3gMNE6A14DfP\/3pT3\/4wx94GDjssMOuuOIKBPAmyQ7gBdNrERyJDiVBQjwZehFvC9egie3+cgpsAWlBBOgSOib6uOsWBx100ObNm1999VV+040bNw4dOnTy5I\/r+dH9n33xhfPP\/97IkcMhcKQXWIc5a2gW9QC4Lug7XCJSdgy4DKwTMoyGyhunrudovSE2\/QkaCGWFd4VfHOFP9vlTmWwyk46XxWtraxLd3V86\/MhlBx3GCkAVyB\/hY4FfxUGNhkDPEgoG62prQQ6WLFoycdKkEcNHBALBlpYW6Er40LbjZmkRAqSUDdOCzXaJQJMX7tJCRtRQ8RSGYbI8kTe1e9bhSuv8IAo1g1+8BthaBKDIcA5XwXdBSuSMU6hG1BK9NEHesH57V2cKFciyoxzxL8JIgKt4bhyob5zFOSgd0jv0pVYsjUThuOUMHV5LWSxWXVbmmrZu5OI18ZKqUkTCQOnJFO1xq\/gNg1aZRHngV+E97gJ186CcuDcy1eHMOk5D\/bB9Fu3PxsR5eD\/cgBocPnTYPgv3mTNnzpjRY8ED9Fyuq7MbmhmmIhiLSKqPxA3vktlR\/EKF44VClhDu6OrOGebQEUMVVbZ185yzvzFjKm25zl4vl4GPDZKNAkiQisDrrqqsGj92wsIFi6ZMnFpVUQMxgIve1tppWS6MvkL9RhBUGlQLcebf3dEqkUmQmV4IG34hwJBJEkLZFwiHal57fdz9Tw5uaa9u6ylP6CWGU6LbibKSpmGDbcE1WDMRbTNDayfkQZlLM\/r4O\/898bEXakxb3bYz1dDQXRETHEtS\/Nm6al93h+m6b590zDtTxjRnekzLkPNkPvk3CxQAYor2Rf3xzPjB4MGgwj+BTmGEm1bdQIDaBbOdKCcIAQ7hDtG1NAtRTSYzzS1dzS3dmYxFHeVUU6QT0HgZJSJigReFqwBkQi+NqD6NJaKqpJwLX\/3JHcoXFnmEowMOAlXOHQYkpJzpl1492imuRoYoBs5y9cjOUhrEkA1mvIRdgSOa1wB9g9NIA+BCnh7g+QM8N6SkWPYseNHg\/VCwlm5WVVVAzw6KmyOHVb\/w0gafolVXl4IgIWP6YiQoqbSkRcoc0Z8zUGU0z6KisvKwQw59t5OgL2EA9hO0tbUtX76cz43Bexw9evRtt90G95EEAuIACcMrd2mAqyOCFUiuaUHIIKQ0qwan8qyJs593QWIkOoYOQcYBDDWTMiZou7BkyZLrr78+lUrx+z7\/\/POnnHIKmlnh9H8CLkGWyXTq2+eem86mhw4Z7MLBRaQEi06LujP5hvELWLCRjFNDlcA+soZAjQqWhts2yCtMK9ow4tHQIOeQZjRyNF1kARPcnUwhzeBBDXisuuq6H\/zg\/F1DCzmowRSCnxjvqRtCWWkpNPu82XP2Wbxk+rQZ5WUVkVC0uamlubkVvhQNXmSNENYdLhXIBPuC4ANJoI+a5PORsoBCgI+Od4UHhRHFY6KB7aoc5nhZtMIBVKqmQS8hrQbVpvhVcJFEIr1pw3bqYmRFg0JAk8eFeF\/4BVAnyAmX83dBlc90NBKDpEBblUVLUH3pTBqVGdJoiFdHR4dh6YNGN8ghsDCfKsvZZDISCilsyGc4FEqlkhApvBqUk5UcZoNuB82DguRsuBl6XXXjlMkzCzf1sDsKdQKhLI2VDB0ydMG8BYvmL2qorQtHIm3t7V3d3RADJEKFS+RWksmBNKFRW47bk0x2JxKVNZVl8Xgymdh\/yQEnnXAKZUq5\/ve1jUIV\/wCWIYJsKk15WfnI4aPmzZ4\/Y9qMivJaRfJv3bp9+\/YdEFjIg1\/VTItmDCFkwCrLkq7r0B6QDd5JQL+i5NdoJ+TYxh3Vr6+jb28kIlBgeTT7ZKxk+9xpjmXCpxEdQTfQyPPhcFD0KaUvr5tx7+NkcEQhbNpKR2dbdUUmFg9p\/nTe6Bo5tGv2jJbBtdlMSjDyIbXUzdPMe9w6l6XhiqhJugW5JNQHwBsIBJi+3fj9iILpRt5oGhBpemJ2LX7R7pA+FAiBQ3T3pJqaOptbeqDCUCdgaEhEHQykumTUD9fEzH7jdtQYUVo48NBayISbY94niwLguXELxJNS8LG5VPDs2C+loimXpAFg3XEn6AFeJFyIAH4pL5qlZeEUP+R5Qg6QABcjXLwEvzw9YhBPyQBIFBWPYlAClATvBzbf1I3KqjJVU8bWKdUVJes2NMdLgTASmyZKI6f1vCNE\/aGSrOUY0OjszvPmzJk1axZqlt2nb2EAcoLLLrvsvvvuw5vj0nDjjTdOmjSJXjzJHL1XEAJwAUdy\/YLP2LbjrS8fFygvDQ4fSaepK2E3W88hdlx7zY7zv1e+eL4ci1MSzgp2AfmjeYwfP\/6GG27gkoTmDUKwePFiflhI98HgaX7161\/\/\/R83T5o4IRhQXbbuENqPSTv8irTRvuPCUAYCcPohtw48YGpFtDwYyRYSEJu3bZhCi\/6lPnP2yNQwyHWGuAtCdyKZs+za+rpYLJpK9px28ikTxk9hN6L\/duE\/F\/gDgUvfczVrYLvIPx4T\/lBNVfWk8RPnzZ43cfyk0aPGwBFsb+uEdaTdaXRQGdSnoKq0bp1h6n7a9olyZI\/sg8E3Mjr4N1qlaRiULXtGgClTSkn1w7Zm8dOqKSbIgeuK27btbGtNQAGhpsmdolJyNgBCSAqC1SopBXYvKjblBVrAlJEGFYBKNHSDRlXpZSUx3CyRSMqqPHzCUF8A55W8qUNThiNROEyUFxEMS1OJq8F5gi6FP4H88WoQVlQtbdHMuTnTFzU0NPLKwQ097BlkJVA\/VEtoWcOHj5g9c9acWbNHDBse8Gtt7W1d3V2ZbFbyyfDBLVoNAkww2JXsQaXW19fpWb0iXvaD834YCoXxOvDGC9kyvVAIfmzgwt5\/u+IYSDJJSwjgo6AyM6bPnDp1xpChwxxb3NnUvmNHU2tLO\/gsdSqRoZKzOVq0GzZPCwQgJJZJfV15X143nWAyN+SlVwKsEaWFfLciZ91817CGzPxFgmtpIU1y8xnd1ALBklgADnUmGA4Z6eodbWQwBTHanVQS6dzUCVmUBsIcK81Eo45J814g5vB54e6i7eRyOZ1t3YmwqtLqIDaMKBs0AHmGmQ9o1JNh6LqPDfWFxsMvYlh6lcYZOE5ZWbkiK7Q9dSKzdVtrMqXjcvrWSmqV3Gs0PbYEIvWKQaGR5uHvgt5D3qAVVmykpZ5OsHawIPpwjxJSY+LTExAQ8vRlFBoA1SWzldDQrNF+ISSIIQrORjmwzAkoGA\/gEsSjelESkijqJKBTVDASMGr4SIww0iC+mAl+aTQDYsiXyNNi15IAZYDb1w+qEvLOookNfp\/Q1NwdL4sqCh\/xTRwuowuBUDV4CjSbk0fbd2uqq5YdeFB5WRky74MYaJwAftvJJ5+czUL46XWuXLnyO9\/5Dj+FxkFmgH7xkh0fCEF7Z9Mxxwx6bFX3vx+VFu2j1tZCACAglJYZIUZTKdB9zz36qadXrlvfs3pN8KBDxXCImVCSIZYvjVFEzPDhw19\/\/fW3336b3339+vWnnXbaR+8qAB5d9e+u7s6ysjhJJn0usKHiIPSQP7gREFwJZWLr4uHeZPeYdbMtkw0ggOjbiEZqxNJ3AocG8qCl8CYB\/4n2N0pnSuPx+rq6dCo5ZdKkr511Dkk\/e0z+w\/Bu6FMAq0z8T7VCdbYrc1Eoi5eNGDZiwdz5c+fMmz5tRkm0JBKKtra2NzW1phIZMASYTDyg36\/hYjwXVEM2nSXN5ViKCuWvwOqjLTtsuzw8h+3YqVQaWgb6EfeCJcZTw6UX8r7NG7fTlxO2Dx4oBISBKsmlsYRgUdTmaToGfWhAdUFpocYYQ6R+GKgHmfk1tmXjaXBhWbyEtqzzSWV15bGqEgFqy6ANEOljTx4vy8B7d\/K0Kj7+g7IlQuC60Kx4I3hxCOhc+eV9s2csLCuroGpiYuNhj0DloHqKVUQvUURDDDcOapw1Y9bsmXNGjhwVDoTR9tvbO1D\/UPzR0mhlTRXsI64xcvpZp3918iTQXyaH7+YEfJrVzpVCAbsy5ookEo5QaafPmjF91vBhI2kHr5y5Y3tzV3fSMGxRVIKhAImiSC0a9o2srG26luSGQj7DSpVGe2qr22ZPadtvSdOMMTvHDO5Q\/Lbk+LUwzGAQ3oImIq2UV9OgCFXR6NYdZcksqgksuLSju01VOgZVgQMENU1xRdMkE26ZUDL0bQuFhNJAtaIdwaZCRHHWtmmrZRt2jDZRC8KY8p1WYIhJ9bDlCsCTIeo0vYjRfSgo2Mt0Nrd9Z1tzc49h0EJMqGpqFew\/GEs0AWSCGDQ11troboXeBDbKB02GyrMLCKNVcrONX9KG4ACFNPQHlwCFRqNGGyIdCUiFQUusnBTgWo6H8S6YF0B9DzjCLwsUbD+upnNMPnDI4lkA8ezWOIW7oPRmzoQWipeF9ExyweR6qJPWrlQkrCEv5IfqzFmS7Ya0UGnWsMjZIcUjzZ8\/b+b0GXgOKmffwwDhBOx90Yu8+uqrb7\/9dgQQAxp70003lTE6Rm8YL9alzh84hyAEVk+y6djjqh5fBYURTGXaHnrQt+++\/spqCAL\/ww8z9GLykX+nj\/9yTTKhQTK2bk+8\/mbw0AMkLUQiwqwddS3DF2c2Y+rUqX\/961\/RVBCbTqcbGhpmzpzJ0nwkvPzqmp5kjz\/gD4TCAuOijmupGi1FYNMiJCDXJMNopZbJPsLRCoagqrQ5KRrqLiNHHdTZrK7QmCaSdRJ5ttNBR1cPOHB9XY0sizCh3\/vuedW0sCuesvDMDO+GPg3wzPHL7kEBdof33iQaidRUVU+dPHXh\/IWTJ00tLy2PxeI7dzS3d3ZBb5JvTmO15DybDUA9huBKCnn89E3EsYh25PM0dYtGMsLxog1a\/LQSoogYuIaJ7syWre2SRNsK4HpUBdqkjexQLciLjSRCxrgeAdQZ4qHscC+uvJCCvDlZ0k2dlhuCki2JBv0BW3RKG0qDJVHXyoNrOJYOz4m6fMm7EuhrDduGB4cqLS\/jp9fExhvCz8HdVX8gHIovXrSvX6HJaSSiHj4adqurSDg8ZPCQubPn7LNoSVVFVV19QyqVamtvBkeEuepo71i6z9JTTjwVV5EAst9d+JTrHNm9\/4\/9\/y5gO2ura0Fl5s9b2Ng4PBSKdfdkmls6O7u6sroO+YUVkny0V1MmnaVuKUVtnTRmy6zxb04c1Tp+dGdDdWtlZXc46Jgm46BixK+MfvHVijUvSyPGZIP+iKokQkG3pjy6cWskS\/ued\/vFnYMam+viugC9ohimDvEmesr2jiJzCWPAxuFC4BEmwWWjMVKJJM2XoPG\/KkrFSTakGRoFaaDoCtZUoM8lqFa46TDpmYyxo6mjqamL1lmmDayRhn3jIz2N\/OFnk++OCLwNstUw97RCOo21RPNhL6jw2Y5KwloilZDRApSZfdNnIaIU3NfDK0XZYbMZCaIGzRZmkUS0OyIK9FmC7ogcKDc8M2vyKDnjIoWWvkdTTQ0WSekqpuVFGilg67Qti6wIsbJYRM3PnlSL95fKWWzwVp7mhqH2MrJPKwdhSeo0r8qynOrqykMOPrgsHifzUci+b2Hg9BOQCAjC2Wef3dzczMMrV6489dRT2ckiwJLzsijbmdzOlV+uuP++MAiCJCqiEOrpaVr1sH\/ZQWppGRMwgfitIGWeez51zFE1HZ2QFEsWVLzJTRt61r8dOvhgkb7BU2tAU8nTRjbUsEBB1q1bVxxs2NPTc\/LJJ\/Nm9lHw1DNPv7NtayAcRGsMhkKBIPkN4MRoHMiExtATK9f0nEGGn3YhlNEw4VRQFyBspk9Bq7PJf6VOtRwtiEZNC3YREt2TSKVzuXi8tKwins2k99t3\/yMPP7pw4z4AanXsPcZLSydOmDh\/7ryZM2eNGjp8aOMQaKV0JtPc1prRc5bjSjIsOhl1cAPHchWavGAmUyny\/aFl8nmwAWryEjn6mqrJkm\/9hi3tHSlUGqw+7kLKg14KGXvUG9cFRf5EGgT6hCgZeQOoOqptSkxTPSEceDHlJSWu7YZLw3VDamDgNUWR8lY2kwkGgqFwyLFpPRa8rnA4iMKz\/ht6Ossy8WJMC5yAGAN0TH194+SJM7h+4DLj4ROAvyPUoupXR44YMX3qtLlz5w5rHBoKhto7OgJ+9XvfOa8kVor323cqGYUBQayuqpowbvyihQtHjBhRXVnZ3t69aePWzi7aBxzmjPrO4Xn78raQyUKO8j5RsAUXUm8zF0dSJLEhpw95cNXw2+6te3srWkTX8EaaCmmLucZGMRSuWvNaIuh\/6aiD184aZ6oBjSgptAh9+Id4g+iy+oDUu9lMlhitJOVyObgQiEYjAhugjwUQfZm+eTFDXqhDw6BVjBAGVLYFKCgC\/BP89vRkmpq7u7szPp\/KzDD7gMiaJDf5dD+a4s9NeCEXimSDLRCGGcYRAigPN8nUGBmIKzC1iyxxyMpA2eOB2I1QPOgBmq3AToho42AO9ESs4HQjyAr19tHoQkaHSCEgK5ziGaJyEKDysDLgjghQDP4nxQvz4DqmBTJVEo8Gg8GysDRlZM07W7YKMl4IathEOXRLNl2\/FinRLSFnghLR08ydM3vO7NmoBCoCu3Vfw4DiBC+\/\/PL\/\/M\/\/kMSwl\/r73\/8ebjo\/C0BnQCiYFbF2nHxS\/Pbbg0QkSZPgz5f3aR0dzU88Fjj4ECUWQxwRgtdf7T766KqdTbQEF+OHSO4HbVy7PrV9e+jgAwWfH62PE0dQCEgp3jJowbXXXstvun379hUrVnyU\/RQ4HnvisfUb1lO\/t5DPspYJ6w4TgsYToJlXtPAfhJI3JzRs6hWn2Y+6RlvC0Pc2WDLIL62XwlbvoQ5x2yG6khc6unp8qn\/EyGEgCaXR2I9+8KNQMFy4cR8A3mDxFy0PgZJYbPjwEZMmTFq6dN85M2fD1S6NxVPJdFdHdzqd6elJsqkYaM+0eKGey+n01ZP0FL0PWGwhn06n4IKnMsbate+4Dtp5oRVSy+aKwM2TY8I0An75JwOc5B0JKAulxH+OQ9M6kQVcHjcfCgQG19Zmc3qkPFJaFZFEf0hTE90tPsFXEi\/NZDJIA01KPhNTrNCe0HSWZQRUsMq8QSNEXMNxksnMgvn71Nc1ojD0hvqmkugXoMqjKmRBEiO8oyGNQ2ZNnzV75sxFCxc1NgyBNYFSphR9A7zAJJJM9irLK0aNGL1o0T7jx06qqqzt6kq2tHR093SYtqmpIdUn+V1fMFwKV16VXKW1dcL9z\/gyevuQuvIdO8dfc1uV5aqCpGzdrg+r7q4ugyJA28hWlCZ89o5ZU1oXL9EDkuK44Exw9Hn7ggLhkq\/rOYg5M5ekNBAJw12QfDKc9GGODphehapBM4FI68zlAJAG3IvniVaSTKeamrq2be8wLerPI8PrgiKDLfihfnkrQwMhZUpZ0pvj1pcfA8S8d7UFxhtYPeECVio0V7B8JEAySsk+A1LGcPGREhYfv1CSZPTziuzDAUqA9DQnmHUDICVyhxZFSvZY9ORUAEaOcBUP0AmGYrtEFFISp4BSdZC5HItHNdVfEc2XR\/3bdzYHQkEhL1tWDuQgmZGUYExU1KyRt12U1q2sKD\/44GUV8XJkVcyzr2GAcAK8Jvz+9a9\/ffjhh3nMuHHjLr74Yh7PQRIviEYitf2s0+M33RyDHDG2BmuPRLYkaHmJ5sk9\/Uzg8EN8oUhu3YbOY46o3LAZdpg1HYhRQUo0OHyvvZ7a0azuu1Ty+7lMUttm96uurr799tvb29t54uHDh8+ZM4fLWe\/y7BGbN2\/a\/M47cPwDgcLOsLgGbRikGb+QaNAFxa+gVaF5+ECofdR5gNMqXGPFR+2XJtGRnUOYpvzbpAcVVevs6tEts6KmqqI8ruvZ5UcvnzNzPrWHDy5RoZG\/L\/zZoXgLRq4KIfYjRiPRqZOmLJy7YM6sOTWV1fGSsubmFp31gWbwPDnqm5PIB3L8qh91BVOM60gXSP6dO9ubm7pEAZyAbkHdOqgU0nxwIGwYfH4bfivoAig+AI+MsEgT3Om9x6PRoJ8+ICg+3EEpK4mZthWvK1XDiAxKrpVNdQWDEQU6l0ZuK3DGcJdQMEhLODokQdBfqG9oUigOEALdNGtr6g\/Y72C\/n4ZuvVsEDx8fVIHsl4B\/C7H0EwlFSkvi0OeMEPSxGmavnYrM7C\/+hU4qLysbOWLkvHkLpk2e2lA\/SJUCW3a0NbcmXFkJykJDe+uw+5+cdM+jI19dlygt3zxxFJp65fadpR09ouALOpa4bVt22BCzvMxnWV25dGLk0HRjve1aruloElwFsuvhcBg3hXhDJmHd0WpCoXBApY1JoXUsy6aReooCZUJdCrYVCoehX9AiAjT+kWixYVjg6CgwSbtPzmVzGbYHPTRFKp1tae1paU265KwTk0a7gxkmfrDL3UdK+hQIxcJcbzw7CgMiLjFLjzSFZihJNl1OytNHc76orkApqBePNk+y8UpZ9wBlSATBLbAcVCtRfSYIuBhnkACshD8FikIDBml4AHVaoKFTMgYcshi6I\/8FkA3Kg6emsV00ZJs6I3EaUdX1VfFoeHhd2LVyNluZEcwTRiVnirodUCOluuMapkidBJKwYP78ubNn46Y8276JATXG8LLLLtuwYQPeKMKnn3760qVL+UvlMdToBCG9ZUfPBedXZXJEOklyaL0BkliwRlFQRIEMyGuvKyNHdJ95Rtkrr6uUQLDlvEQJkB3JEMmIkG+23egJK\/3BAC7EC2ffGohhQPA2b95c3FIZtP7YY48lQWPF+BCgtBPGTzhw\/wMaGhr4LJd0KmObtNkBqLZlWsR8cRd4n2gqEEgiKXkEQFTRgOEjo8VmshkcUU+fJBlwnA1TVvy6bnYnU+FIuK62Cmpg9PBR537zO7CIVCUfXKjeBUa4Vwv5Dw\/yKQB3YH\/8lr3vFw6FR40cNXvmrP323X\/hgkXRWAkafyqVaWpqhp6yTOqQVxQVT4dWHwyHQPff2bwjnTTADyhD1pLRKtkHAlIH9O0AFoN6FwugkRn0qZLi8LDQkn7FHwNLozEZYAQq\/IMgNGLEXzGo0g\/fX9EsPSs4ZjgUQ3rHhUqlVwAFhDxybHAoLvQxP8Wmb6qiL6DKPrWutmHqlHmFuxI++4rdG7BLeN6LPUT1IZAO4cWjX0gpGnA0Gh3SOGzatJkzZs0FD1bfeGvIrbfPePDxxrc2V6RzsJBbJgzbObyhx7IgkI1vrOP6KZbMSTs7UuOG9EgOFIQuygFIo+CkLVPVNJBUaCT2yYBW9vT7oRx0iDetuyqK9NWAAW4IzDx0JrOjtCgnuAGjxDTwBZeQ\/SXnm4oNRz6TQfY01B+p29p6tmxp7enJ4lrHsWDToYvwOFC3uAZNgD5s+hToJTwsffBkG6AjJ+oBYbMTma9OTY\/dhFoo2jj7BEB+HFoTHpRGEcH5oVbMQN8U4B0RgUDudDvqeKAvCMgBkQAupHbtgBxI5EKxciCe63SeDBWC0qIM7AoqOfJGMUAeqLQsWySmeCqYWN1Qo8puqWK6tqEGgtDQFpiUIKVzsi8QF5SATl98aCm5mpqaQ5YtK4v30ekGRbyr6Ps74OFPnTqVDybAC7v\/\/vv3228\/PB29bg7qcrclyZd6+smeI4+qaW+Hr+2yoeUkfTAg\/K3n8wbea0DTcjpsL0QVFoOGpsKKkOmAGAh63tk5ekztnbcHRo52Cgsl0zQ\/4g20To78yCOP4O78tvX19Vu3biVh+lBXmwRwlwhyJJLJjRs3bnrnndVrXty2Y3tPskdGO1Lwvw93YQ2SWjVypNVO0FCzKJebTCRo8J0gQLTRdDt7EuDHre3dum3XN1RXlMVyGf3b3zx3v6X7E1FGkYqN6r2gW2\/a9Oqrr0JZjBkzZvLkyTH6pELl\/JCn+ByAAlCxe3PtfL6tq33jhk1vvf3W6jWre3q6DTOL5\/L5xWhJFOrr1ZfXp1O0rCzqDo0Tb5G3cBYWfUphY1aWNX0o9FH\/QQH0ctnnUsW0NJrbLGV1o7qiIqJplfWljeOH2K4bDgUF3QCt9PtUwyIGYNPi06SMAkE1k8kgXz\/5XQq0jm4ZqEGB1uLNz5+7z7w5XE5wZ\/zt+V142JtAkkCtjPss+J96MkH\/7W1LDyp\/7JEgpaHe686A\/1\/7LNw4b5rP7w4x84uvu33I+s1oGNAOXYLw+ClHb5o10WdbNDlPkIM+f9axggqtkwErDbOFW0QiEeQFHsAEH8JHM6j5YSBAi6VC2mn6UsGmuuFwOBQKo7EgDSQcDoemqbC\/ZLjZOuUwqAi+vX7H669vTaYNWYF9sQVaboCN75ElmiNKUwepM598LNr5GmadNk1AJHKAyaeeCTaTEO0Od2XTCwrAIeXFqDYfGMQKiaZW6NVDDMrMLT3AL6ErKUBf8XASzy\/R0g\/U\/OkiFIkNccBNi4nxjOws6To8P1N4dJKxCpqFRFu35OF7yMPHDZftniFho7a+TITGsWxHAMEJJDNqoLRSd5WcgSfF1dKygw484vBDwW8oL\/4Vok+S1IHDCeCa872PAcg6zHBpaSnC\/L1SLEwJXgR9chJ6HnokufxLtYkUZBAVgPPkMhNBkNk0RWIBADtEegd8lEiuZONq0823DBlcfve94XHjwMPBG+nqwttlPqAobdiwYdq0aWhgiIJNffbZZ8eOHftuSfYEdkO6GyVDbr0S6kaupbX134\/9+9XXXmtpbUmmU+C4kFoaMIQWwhbvIxCbltn2ZXnLNPK0DrwEYrFjZ1N3IhUrLR3cWGca2elTZlx80S+QHIVFq2RFek+pOjo6fvKTn9xwww3JZLIQJQhDhw791re+dc455xSOP2NwoaRiFcVzV58BRVFNwoQXjnsXP5PNdnZ2vPjii6+8\/vLWbVvauzoM3VLVcCKVpU0IHZrfBUUAxUGuCRudzGdCo+LR2skRIV0kOjSHwYLmos5GOARCvoQmHbtQSHBGaqsqQwF\/zdBq\/NF+Nz4p0doSC0XVgJpKJaE3WQes5VdBCFKsm0Fl6xOQQlFDwbaerqxhQL+dfMIZI4aPLxSdnuc9L8LDJ0NRLoD+UqG8zKy0RTEvHEEtMeshJf5xi3PsCig18l7cfHM8tvHCi27cvjlvppVYdPHrbxx2z2Oa66RU5fXZk56ePT0RCUUCTDH4ZNuwVC2kqQGYOssyoWTcvAOODNecptfSDuZ+GGpa1sS20FJisShCoA45g\/YhR0HQNgIMJls4AS4JU2gumgsCMKtcvDu7km+8uWXLtjbTci3HZA0LdJh2\/XDo+z356MgNxXBwNbPT5GaR18WG+1HjJkMNwsH9eCov27IZlUAthO0TgcpBBqgUh23yQk2WVRxVGVfo\/JdG9RaWNMV9cUzOm4sygFWgdRM7QpzfR2XC5bgLLgGQOcJUxkLvAgeOcJK+IkNb4L7BYCBSEikNWDOHx9Qg8lBc0xSgDbJ5Sa1Sw2Up3TZsAbU6ZFDj6aedVl9fWL+cG5j3aPk+g4Hz7QB29+9\/\/zsPDxky5OyzzwadRJhJCwP+JWkkghYYNtQZPbIHdp0G1ODVkIGh9T1F\/Lz7niBZ7I8+RdILpG1Phabqmvi\/7ohOonWLmTDSD2VOfwQITllZ2T333LN9+3YcQrjnz58\/YcIEhHm2ewTLgBJQsvcmRNsoiZVMmTRl38VLx40dN6iuAW0bli+VSlumGQrR3oM267gDK8hkcygSiAIaIrU\/v6qzLvXKyjKYvuqqmvO\/dz5yYw2IwO5MQLFxCGp18MEHo\/AoNo\/n6O7uvv\/++1taWg455BAcon3gl13+meDdYvEQO9gV5MV+97g34IzHYrGxY8bus2iffRYsaRw0dFD9oHQmrfl9kWgQWjEQUuHtQN9RPyNTK2D90Ez0fZE1esiIy8Y8M6dCoVGpkqSgSkUhoNAcEMF1NEksr4rXjRiMWBUvAw6RY4JwGDbESWaLRxECeC\/QWTQIirofAloAtwAbsNmwqfJ4zaIFhVmIDO99Eg+fFEW56EcV2qu0u8q+61+SdyghUdDGjepo77RefDEAUyoIRmmls\/L4K2+8vqely5SFjKbUtSRTivjcQQtXz5vdSf47U25srV\/Kj4k6bCQElR8qIAJ+FS0fvjKEnJlFGtUPw497QoCpFbCBNbCLYA\/4BSFAK4GQwyLSBC74S5JIYxVMIxIJQ9PwTY9SbGwBGlgelh+Emnrs2daF9DikcHGIArCWR2wCAcRQq6C\/gm7h7j7KAIVGaQl0WxhmWFkegWP8koFl5p+Vi3r+0dxg0ulhqKFbNLyUqX9JdmVfXiVtoIXDSlkFqL6STdMKDciHqzWEeQFIG7B4fghTwJmGCNePKkEIhcOuI6iSWxoi\/5+GGQiOlVe6UqYarlACMYMGdFl5UVq6eJ\/p06fxrCg3lg0P9zUMHE7wl7\/85amnnuKVfuSRRx511FE8\/j2A2aPXQcHg6LHWkMHJu\/8VgXRSdwFFUq8Be\/fUkt4DvFZIp9BaVln6z9tjs9l66buy6g2KZ2W4+uqrd+zYwSOXL18+btw4Hv5kQLb4lX1yZWUlDN7C+Qvmzp07euQobtqSNIeYtvzhH9HRGhBPUxB8sj+gVlZVlMRiKFRXZ9exy1csmLuI54nCI9PiE6DY6XT6iCOOWL16dSHqfcCpTCaz\/\/7788OiiPcp8LpC2aDahg4dOnXKlMWLFs2g1ZTLdVPXAioURCColZTGghFaqog+RFKNkS8CjQMyBA2GekEUtBVVEJwMUQipYAI+KAyaPhDSSipLtFgAd1MVX6qnG2oiEg4zBco1rx0MBlmXK1WxpvmzuQz4ClQMSEbOpFFdgxuGTp08u9cb8ODhfaBuSO7yurCu4QMOSJdHu9a84stkjdLQxeveeK25KR6LkiMcjbXEoq8Mb3yxpqrHcHNGFrIoy5qs0GI+oXBIJl9e1LNZxzapO9LNa4rqk30wmeAPkFiQALQaAESBOsnYtFtQ3pKSEsgxvHOcgmKBmkRLobO0jDQuswp+uiB0dvW0tXc3t3QbVnHFYthOItfULgCZjDajCHDQCzoWtp9\/HkEEsuWR1L2xq3sfAdAXWF1ciDaIu+dpMWbkAUcI9pmaL03RzNuKT\/TJeTxxQFOCAX9pPFxREYuVhCoqY7U15YMH11bXlg0bVj9kaP2wYbUVlZGamqp0ItPV2UO6krEfDhSA3YXIEH4ZV4BiR\/FlPI1lGngwaGN\/IOBT5VjYl8+aXYm0rptgJmnDSetyKFYJkkMrOll2TU3dYYceyr+99n0MHE6watWqJ598ksvmzJkzuTu7GyDiEGSInwSREqXghImZ2qrEvfdF8cqJFMjUlS6wRvhe4EKIXkskFLrl5pJ99qGxfgKbtbAn8DLcfffd69at4zHwvD\/+fki7A6LJc2ZWRohGokMbhy5ZtM+c2XPqa+v8Pj+aSCqZNHWdfQoD08H\/RJMhlWjzhq5XlJd\/9fSzotFYMSug8A\/Dz3\/+85tuuqlw8D7wS5555pnDDz+8pqamGNP3Ace9LB4fP3bskiX7zJ0xq6y0NBSk1R\/wokMhTdU0TYW99sFjMMhak3Kk70xU0dBKNF814PcHZIWWK6LpW2Iw5G8Y1lBRWwaZCQe0dKIzoAZ9Cq4gxwX8DPXOvByXDedScrmsQuu\/+m3X0aEk8tQTMXPG3Pq6IYUievCwR7ABTzZraNRfLfvCs+aqR38pUV21TpCu2boxHC2VXSNrmtGy6h0BpS0UMHK2nTFtI22a+Z6edCaT89Pq2nC7\/SablhwIBGFckaVlW+l0Stdzfj91qVKfPBlj2jMCKgKtgAbc0UB7Emm0EmgS\/NL8Z1JHLrx38sFxa\/pYRuMTE8nszp3tXd1ZXEK8AbcR8mhaoBGwszCi5PDD3PJZADR\/AQEcQkfR5wxkgtNMq5AxRlNi2g6\/ooxLZVH2CbRZuiLGYuFQWItEQrFYsKQkEo0FKspLBw+uKy+L1ddX19dV19ZUDh5UW10dr6goCQT85eWxqqoyLaAEAmo0GvH7QfJJNTq2tHHdtlyOZlugMCgzu2lB2XIgjBgCdV3Q6DIUV2bdGFooBCpRU6IKZsYwnYqy8KRJw7sSRnfCDcUqciZbVkGUaPv4GdN5Vvgt5NZXMTA5wbRp0\/bICeDaUwujTwGUDkQgPHW6URpzVj2m0UI\/zAhQqt2BmLaKSv9115UfdDByoNW7eXfee0wqofjK33jjjWJ54NPPm9d7ePnHBhV4V8673TLI5mGDGcybM3fChAkVFRXdXd2GoXf3JNCqYOEg6nouZ+b0s7\/6tSmTp+OSYlZAMdTT03P66aenUqneZ\/cIpPnSl76EwH9M+YWAauq9KJwg0idHwpGxo8cunLdgwbx5M6ZOqywv7+zoCIcD8Xi8ob4uFon4aQyU4NrUWeDQD6pIhItFu5xChQmikU3HK6N1jTWC7IbC4bxpZJM9sWhpMKSlM1m8DjYdmpZe4U4PdE0mm41FY6Zp9KRSgk8xbbskGl+6z\/4BjQZ5efDwwYATDhkEQ5Ull2wklBf838j8BZc+\/PCzb7xSU11nZXO2JNbU1sMtxXkNxpMmKrnwgF9Z84qRowm7qUSmuyuTTuuQPUnxwwWGsTcsI6dnYfLgUbA5AgRYR3ACEAXIMOgs6AIMP8KgAqFQBHwCthDFCofDICm5bI6m5MSisKQdXT2dXZmdTR3pLH1HQ7vh3QLIGa2JpheAJbNvE4wqMOvI+upBNZA\/nHGa4yBLtN8gM8O8PPT5H5Gar66hYnBj9YhRg4cOrW8cOpic\/pryhkHVpfFoMKSCE4AKKH7cMO9TRLh3ql\/G06HN0vqj7AuDaeRUVYUacF0blYKcTVN8Z1MTbo6ysHtR3wCnBUCRDeAUwjTxgcExTSpnQA1FgtlU97jGyMLZI7p6suGgM3Hc8I5Oe2drIl5RY+fpS83ghkGHH3o4qgj59NZFfRaFhx8wKL7FPQFW3PE5kGTRhlgI1IeFV1R5zrecyRNJ9ZNgwLvuNc51F6DapaVLKg49DLlLbBEtSvYht2J7ieKXl6f3YL3PCLgPWum40WOXf+mY\/\/c\/l172i8uOOfKYhuqGoF9zTSvR3TNtyvQD9ltWSL0nrF+\/vqmpqXDwoXj++efJ0vYH+d4deBu7\/sLB8MjhI1ccteIPV1zx21\/9+tQTV+YtM6j66morx4wePmnS+JEjh8EFiUSDedExLd0VHSXgh7sPlVlVUxWJhUzLyrtONpUOBsPgD4ZJU6lzOd2286oaMAyLBhNA9fqUYDAA9WealqJpkDnoydraunhJJSuKBw8fCBJVNqbNER1Xdtknd5KZ1a+9ft+TT1RXxYOaPGTkyMGDB2WSHRoMlaDAzpIF9Kk9yUQuk3Esu3lH89bN2wt\/W3Zu2by9o6OnozNpGK4ka34tKEg+xoGpDzWTycCjQOPmq3TjXpBgTdNgmGHhcBaAWgNdCAaCZaWl8ZJSGFMIOZhzMplNZQwa7cD4QJ46\/gULXJq7UHxUAO6Sz8NXsS1bpK5ZWGA0KVmSFaSGda+sLg+FgwYNwiXzTJMJ8y6aYXVNvL6uvCTmD9Aqr1ZeMP2KqGm+YFCJRDRwFV3P+FXwFcc2DHCPbDYLU47bkRV3UA20uDKOJBmEBUXGsd3V2QH2gzIhDdV2L\/OBMMCvpVKAEPDygF\/QI+CZnHA4WBkvGVpXOmp4ueAa4aBo5FJBzddQWyq4FugPmNDUqVNraqsLmfYHDDRO8KHAi8QPWX8IDpsaSI\/fcuEF4ppXXBEcFi+bC8Xu1UJfxu68q\/X\/\/ogw4wws2YcaRbScQkgQ4IMWQp8O8Ajvyi4DDumPSXFeU7VBdQ2nn3TqFb\/6zc8u\/Nl53zlvyaIlxx93QiFtL\/R+gAcffJAHkAcPfBA6OjrefvvtwkH\/Aik9\/KGyUE8ExAXUYHm8vLG+\/pmnnnh59QvJ7o50qluUrPq6iqnTxk+fMXHMuBGDh9bH4I6UhONV8crqymi8xMrbMPzQZHo25xN9Ac2fSuXYNGsCNIhp0kL1UCg03yHP9rNxyOECk4CmqKmpR6pdVc1fnwcP7wO0FP3Rdn401ZmiSMT+\/Ocrza5EWUlFwA\/bHdREv50xculu0UzTeD8LjrDevGNHSSwWi0QUOP6Ck80k2lqb2pqad27dvnXj1h3v7Gxt7kr2GMlkLpHNwHBbjo28M9l0d3dnNpMhm0ousZVmAwaZJ08GEtYcv0y\/5XkHv99PPQd+2tIdyeDTB\/Af2U5JBCcARaYBOwyse54vRkRfA0j+2YIuoNp4NJcG+vjYvEIQBjQgmgbh5i34YX6\/TGsOUMen61iOZcLP1w22FYosygG0RCIVNCggHCaCIMv+cDhaUlKCRoqbgM3QcguuiF8a+ehKQl7xyWo2S90hSIAHpNzhJ7KeDDwrb5tUAPbUxBtAN0hxgNPTVw8kKCmNlZeHK0r9lp4D8YlGS7NZA9xpyqRhsagG1jGoYfD06dORLb23foKBwwl2qVfCHt8BnRZp7SHIPewC\/7DTctkvpIsvKTUtH80q5LJBhJEDJJObTUSV57L5s7\/ece31PI6xdcqS3\/Xde+\/Cyy+\/XAgJwkdf2\/ijgJk1\/PZ6YJSHlZOAwK5ziBw+dPi82fN\/cuFFex7k2CuLRCKBX1Yr\/wFIuX379sJBX8Z73wqrNP7H3jMDO6Z0111\/fXtHhyyJ2XQKtKC7rbl5+5bu9tZsJlVdW1FeFY\/XVVY0VNY21saqSpVoWFBU6DLovGAwWFApohSJRKBLoPEQQBR+kQY6BaqKqIDPH9A0x3bSqWx97WDclHS1Bw8fAjACtk4Bmw7to9F8gtDa1vbkqkfKK2PhYBiMIJvLmAZtSWCLohpQNZ8rGFk5Z44ZPrKuphbWHWYUZwMB2G4p71g9XZ07t23fumnb5nXvvLP+nY1r39mwbuuGDVuam7vTWVhwyXLzJo0TMGB1M9kMLCLsr2XZeo7GxsJnRrlg0mnvJFjHPHW9mqadzhjJlCGKNByBed3w\/WkbN+INYAeiyHZLoD3G0OIQT92y1BZpuVVJoKSyKMDww2zTcoqUCfEP\/CCJqvpc285mQKzzTl4CuYaaF9kcBDBssuUOcQsE\/Ko\/GArQSmIBFdciE40txqwoCnGUvAAikc3oUO6SqKTSOorJKpo+EOByhbZjJrXAuAJpBsQzgBkgDqWlyY18niTSp1OdoYAvk6HlZOkTjCQ7VtYPnoJqUsSZM6bX0Xa7\/QkDUyWB4RZCvVAQQEgSdZLRV4P2P\/5e+sEFZYJgyZID5gc2wI0G2Vz8S9YR\/JAW1AatlISqfN4684yOW2+mFCTQkEuSfRId+o8H2b+7TCwHhBK\/xVP\/JSCyu\/6KQJD+OHiK3UDx70evOL5\/Iwq555S9UF9fP3\/+\/MJBX8Z7nwNHvavu3ZOi2N7Rft8DD8C6h4IheCthv6ZKpIM2b9zU0tyM5q0Fg1os7A+qgl+KVlVsb21rbemKBsNWLmeYJmw\/1LJp6lBsUD1QHMlkkgd0XYeao2FWMvHRRCIJnVJSEi8vqyrcnfCe4njwUARNiSpq6V0K5I9X\/rGtsytaVgpXO9HT7RgOfarPuz5ByWVhuW1oMkVVY7FYNEokFU0aXi2MOuwUdJvq94dCQeRr5HLdnZ3NO5rXv7XptZfXvvNOU3Nrd1Nr146Wzqxu0Q5rtK0AyESQBhtKIigCHH2QBduyYOS5rVf8tIJQd0+yta0nmcrJPoVWiHVpqIAoy2pAg4vPFlpTIOK4AMXhxhbNgdl3BGmIF5obfZmTZB0tyrSJTwCwztTxqfoVmuJLHFoUDVN3QFvyeXj8OKQJAyATIN\/w\/5lPD\/PtU2TLNnETGHHkEo2isYZ8fiUciaLx03rlgp3JZdLZLCyBwzpgWMHYfzaPIFAZqBjMJKDAjiW4NEiIbipJ8B+iYS0WDbR1dWdyaTyoY+EpZNukBRUHDa6fNHkCnu5TUvyfEwYOJ9hvv\/2KxuyJJ57YMy0AqaThJCScPddc63zr3EoIAo0roBkHkEzeT0ercZCWRlBk64UwiUFQkqtMI3fyaZ33PojzxCzoCpr7iz8mNQUQnaRJOwX0DvdZzJo1C8JfOPhQDB48mI+WGAhgIrNp00YY+Ug4TEOvaf9lm\/cRmZZZXlEOB0ZR4XhQJ2RPKkWfW3XTMmg8V7Knh4YUUE9rWvHJepZ6XElbEchBYWOa6EsqlKJP8cO7QGbl8fJohBbU8uDh46KlrfXue+4uj8fjJXHIVChEOxHAPvn9tE0RGUR4Nww0q5aNE4TMwd4BZN1oCKEMH5hMFU3DdSDePcnEpk2bm3c2Lz9q+dlnnDNl\/HTX8q99e9v69dsyadg3QZYUCLTf79NUPzOerqmbPZ3dmVQO+o\/m49AnhpRlG9CmXGmyzwq4H91O9smkVNkwA+oykEhzwvo6+HNctAsaCC3Qzm3kjFN\/gg36ANOOXzQZxEciYT8tKc5G+TmurEh4ThQepcpmc9msTvqaPSSqiHvw+KVBiww0WSIQQGNkfRhQ+VQm3EfP6UiJdk1dKUQtRDvvoMjIhKtzVCNVEwsQmWAmBuW2HTsSjYKFlMbwBjQojIAWiMUjWcNiCyKBaYhTpkyrqeadBP2JFAwcTtDQ0MDeHaG9vT2Xy\/HwewC7TS9VTNx2W+brX6uwrDzZ8ryPtkBiDIC2IoXUECOnL0sIc+OAP5JzB0azDhbghJU9q1axXbpo\/jqJCQPvWgDWrVv32muv8XBJScn06buP9u+DqK2tXbx4ceHgQ\/GVr3wFv8XaHgB46KEH9FwWWpW+StKygwpcENpm0bBCoShNS6ZVoFRq7XkB6g8qMBKJ2IapyGIJfJBIGFo5CJdIgfYBr6DNUlVVgVfR09OF945LCI7tw0m\/v3FIYcFNDx4+KnYpj79e89fNmzaWlcWDwYBM9pUmysMIWRZ8axhNsoPgARBRbhdhDmEFLdP10Ta+skPr6hTyYit4SjCp6XRGVbWxY8YtmL1g+qQZ3\/76dy780c+\/ctrXZk6bL+bVdWu3vPbquk0btydSObjQPh889gAaR0+iJ5NO6bkcsoVVBltmxpOWC8Af9KZEu3uwPYLRpvx+mGU1oKEhoZgoGCVmG5AiBs45lUf2OU7eoNZCe7srqgICgz8t6Fc1FSYbkbgdNA8ZdRrsS+slJBKJLJz0dBrZwerjiVAb+MVZkAY0O9zLsExd16GzUIxwOFxSWkobZ9PnYiIpXJWhiFQiNpSAhlYwFcdJBrIiNkAjzli+rHfEr9E20LAdoPqtnRlq96qPloNii9+VlVVMmzIdb4TVCeXfXzBwOEFpaemQIYXZ3vDV+BZE77Fb9MLJgKfvvjd72mmVWYgyLD44YaFjgK1hCCqbzwpCT2W5gdqh7axQRfhDCsHNy44guLJQ3dOeWnFs8tknSU7yMv\/kwEaXQfzpVps2bSquAwjjUVx0uS8DeuTSSy9Fo0KlQew5CucY+OGUKVOOPvpoHtPfwcWju6f7qaefCoVDkVAQzwhtgkeFxunp6YGGRRo4E7QHs2FAl2nBkA9NX5ZDmiY4Dho7lC+og6aSFwLpKuoReCn4RSQYhmtTz20ynYLGUNTA0MbhdHsPHj4OIJzbd+78xy23lpaUxOCkwvSykf2wizB+OItfIgVMaDkzgDDDVCGAs2AGsNXsPEwvWU2IP+Ih3bDbsVhsv6X7MZVI98ItFi1YdMbpZ\/3ohxed+60fLFp4gOYv3bBh+8uvrt3R3N6TzMJmiirMPC1anE5nOzp6EsmsY4u0zyh0JPWtUzEU+u6Ou8uwp1CmbPAeGhdsfAjMAiBCI7hw7BUfdXVYtp3OZLnWpg\/6pHIcsG1V4wabPhYg20wma+g6tTW+9hHTvXgc6q9gqy0RnWerGofDEeTDK0GScDcf2A\/S4gK2oChxfSqjTPMkQWJ4RlSZqFa2KwTCQOEGVGOCH5UrE9+CqogF\/bLi70makXAgFAqxacuK6AtOmjy9rrYeV7FL6f\/+ggHCCfC24vH4xIkTEcb7g1JetWoVD9OL5IDVF8XEOxu3nXpKZTLpo09EOEW0GQDhoy24BSvlCt0nnRR45vmOffZNk5igtTHOwD4lgGji1y+KNe1tO1Ycm2nZRq\/btekLAu6QL3wjuO++++iQicPcuXN5Md4tSV\/F9OnTL7jgAgTeX1T+CGBdN9xwA4g2wvzp+jX4I\/zzX3c8\/+KLcPdhvvN5mpPFVkgVI5FwRUW5TxJcx6JxUNAypklfAWRR8cl+Scxl0lB8mhYwDFqdhNYxJe3smnQEIYSGshVFBRswTAOXQTel0hlNDVZV0opPHjx8XNxy263vbNlSWVVB226xNgqzSoac9cpDGrlIo3kiDKMIgYTp4uOZSFFBLsFKQQooOfV4gVPkDBP2sqGhfv78XWuokGaE\/OKPvuWPHjX62OUrLrn4lxee\/9NDDz6yqrLhnXd2bNq8s609mTPz2Zzd1ZPu6ExYJlhKntqCacM9p5s5Lu1HgFsjQxzaNLcBkTiFBEQWmJ1GO5R9UiQaUhQZV\/tkJRgMETWnpQts5pRLtmUwvY7WSVSBfqCbcTEjPXgg3ASEAGyAq6YMzahk3\/hMC\/kzDgQ2EMB5VAsacy6nd3X20IhKnKAFy2gdZYTBTXA5RfqoUw8BXqXED3Bz20Hl0tDFvBsMh0Up31hfQWcEf2lJyDQs2xVkNVBSXjt+4pRCVfY3DBBOwLFo0a5Ve9kygnj3CPA3ygFhCtXWh884pYfEFM2DfRggiYWhd0XBSufzXYd9qerKq4LDhpb97W8dM6dYjsDmKqBFQdQctqQBSXhKEMoPOVKLxikPiAakiO5A8g9x5PP6+K1Rqt5l6LNAk8AvOMG1114LgoVDHtMbQ4cOHTt2LA+\/\/2x\/BNr2gw895CM1KdvQajSJ2c3qtEvssGFDGxsboVMsKCoaPQA3i6w7J5fQano2qyhwdjTqTBRo9jb3SKCOoezwm8vlMjS8QID6g+6GuoJmGTVqlKaFC7f34OEjo6Wt7cabbgJPraqqYr1QNG6A90fCNsIYIwCjCHsJMctlc8QQJDJmwSBbaIj3AeTzYLckvw65xTpE27QgriAEdTW1OE3cARIuQKFRj1lRD8iSOG70mGOOPPq8b3\/vR9\/7yREHL6+vGrFzR\/fb67fu2NmRyug2fTKAGU7BkKMhgB6jJDRp0NTRpkgDsrujzGTQAZ433YYYSiwWVgMqjC2bTYDk1KZwMhYNBwKaTUsuZnK5LBqmT5b9fuqIoCelh3VUv4qWiCzxsPSNAFXDxvkiTDMWqc\/ATqfT2VwWZcLdcFtUFCJQLuJJNM+Q5iHgQmq8fj\/dnrEBDiotrxX6paESeBA0ct3I+mQnlda7kxmfDGcgn8mZoqwMGTG2srqW9R9TlyG7qN9ggHAC\/toOPPDAUCjEJXjjxo1PPPEEO\/ke+FSt4ZJLM9\/5ZieTSZfWJKRNEX15IQNCsO++tX+7RtFUSJ5WV111y+2t48dZ9K2L5IE+KIEWuG4iL5hfOaXyt7+Rg1DukCm0T1aTbFrL008\/vXnzZgQgl2hsKBWd6SVbfRa86k466aSXX3755z\/\/+UEHHVRaWgoFhObBTz322GOPPvooS\/sestV\/8fqbbz71zJMlkVg4GPTT91V6g9ALMOGpTAp+AbSaKoq5VDKXSttZQ3RcKNeIRpshBcPRYDAMn0VT\/VAo8Lr46C28d7gs\/O2jTpEhnA7Doj4Gn6KOGlUgVR48fCzcc8\/d72zZNGhwPWwkmCqaIFxqsouOBQsJu8h7y4kW5PNqQEMTRQJciMYbiUTgxfN8TLLZJJg+yZfN6TB91VWV+y4t7O3OTPe7YK0cGZBzThYORlwUR44YcdjBh55\/3vcvuuBnJ59w2sL5i6ZMmjxy5NDBjTVlZWG2gSgINsgGfHRyw6E3wRgsuNe7lAaaGJoDdXDkaaljn19Q\/KJh0hxDEAbcDJfAzAc0NRIOlcSimhZAy8IDwXbjpCz58g4tYgADD4qDNoeMYP\/BCZA5fsm005rKZPLRiPWcjpu5tNg7LWls224uZ2XSOkoD3kGFAUvClaTiabwh+Xns2wprvgjLNGWDTueJKIlSMBzC\/QOyqMpuMp1NpVOa6jOMjCT7faGK4WOmMnWPi\/ufkhwgnIBjzJgxxc8HkJs\/\/OEPPH4XIM0kgvip\/9XlybPO6IZoMh4ngRAIbvv8BdV\/\/7s\/GoVY0uvMC4HBjeW33tI2ZKhFokFjEMFgE4KQPXZF5W9\/L7A1PhmZJUkvvvwrr7wSvyQSgrBgwQL4miy6r4OEeFeLHTRo0AUXXHDfffdt2LBh3bp1J598Mk+AFvXDH\/6QNzxqtv0ZvPyvv\/667dgqefeK6qdFBuHTN9TWMqchT9vDCHlLz+EXZEE07bxh6JlULp3euHlrIqODg\/okUdezso92mIGCBlBRJSUlCKC6kDF1PUDBaUq8PF5eWhEJ9o+tUDz0NTQ37xjSOAg2kvWAwjBRPwD+mDNKOyqT0mJAC7UsGFjQU\/LXkZ6+gMuyT\/HZjgNjyS6kuYXJZBpiP3n8xOmTp7GbIBNmy94FEtJd2I24qnsXdbW1Sxbtc\/aZZ\/\/PxT8\/\/zvnnnnayQfst8+EcaMGD6opjUf8MJhkhR1YeZQwT0u\/UGcCSohfWjI578hEo104+YrfR18VyI1ns\/upt8CNxqKxWCgIfkPOPP5D4QQiFzbtI+BYtpHT8Th4XF03fD4\/CAiUNEw+wvQZQaDFjuDwgwnwT36yLNgO7a2QTmUN3WZ9J1QeekjaULHQfmlUMWVVeGrUnKpqqEIqA3mRYjAUNK2cJtrl8XBGN1Fj5WWleiaTs8SawZPi5bRwIZJyC\/ueKuvzoBIPDOC94pcPiee46667XnnllcIBIwOsM4f+lwRp0O\/\/2H3iCWnwvnw+lxdaZ0yq\/cff1fJy6G966fTeKXFo9NjS225pq6uBJEuumBSE9GGHVP75aiFQ+J63G2Bj7rnnHgR4eVauXAkJY2f6E1B4Xv6ysrJYLPaDH\/xA02gLQcS88MILd9xxR398qN7gzwI8\/sTjeceNx+NQmtQNm8+H2H6GiqqRZyDJgVBQUajbX88lZV\/e71ccKBXdadrR1tHRDW2XymSgNKBYUEWhcJj3qWSzWeQGbcW7bV0BWilvGlZFRVVZ3FvS2MMnQU1dXW1drUTD2xRwUEipSRsDQkgV2FvdMimSNibQ0Dihv0BK9VwWRg+tFUJIowp2GT84MtCHOcOEYcap+fMXUuQnAtcUJZGSubPmrDhy+QU\/+OGPf\/SDM049ecmiuePHDB8yuDpeGhDcnGVkBMekEVci\/lwTRBu3tyxwA\/bhoAR216bhDXgeGt9HRIeWb8yHIwEYYzQltMR4vNTPtitDjA1ewBZSjEQiID30sd\/J57I6bV0u0VoFPhk15cr0zYSWmKGRwQpt5AieBANv4cnzdGvbsnU9hxzAXaDV0OYB\/ODRUFd4OE5G6HsH\/qElCmicoyjLAb8aUIRgSGtr7ZbzMi4wHTGZdcaO+2+3u\/tiMUA4AXtzZKWOPvpo+Lj8EC\/vpz\/9KU8A8HZC\/8D\/I2GSB135p64vHdkpCK3jxlXd+k+tto7vzoGEuB4iKQgWmGZ46rToP27eWVaaEtzsgsXVf7laDofBcImyvg\/f\/va3GYsnDB06dMWKFTzcT4GahJYZMWLEqaeeWogShMsuuwy\/vML7KVB44IWXXnz0kUeDaoA2O6IHpd5+LaCZNNDJZ1qkLjNZHeTATx8sFdM0XMeGRoLOCgXDzc1tLS3tfpVmIcERodlQ7DslKg2\/oVAI2ooUjSRZrtOdSLS3dVWSAwFF04+rzsPnD0gUfoPhUFdXwtBNW8gHS6Lh0pJgNKqFw7CNtGGfqliuDQ+bdQFQj7wC2yhLfjZKHnIIKcUJ2DRYY5prJ4mJZBJyPXbs2H33LX44IC3JlORHAtO0lBwBFBHKMxaKTR4\/+bhjVvzkRxf8\/McXfu2Mrxx9xKGTxo+tqoyXxEKaBtYCJpCxrBxaCS4DcUHxUETLsrNZWhMJUazrNa8oUjQCSq2A0mi0algYT0OrFIaikWhYC4Ad+LRAAJoczJt2bXZMn0\/UjUwmk4QRh7UOh6N+JQAj7vcHJNHvuHI6YyeSRktbYsfOVlZ+3NCBvUf90LIHooymCT3AFAKBaow9F8qJJ8QvdQwrciCgKZJUV10iCHYmZch4eNf2BaNDR42vqR3E6qa\/YoDsi8jfHKCyqXQPPfQQj1y7du2ECRMg9IjEi6WeJyhkthpBHs6dooQPWralo6P2fy4Ljx6NKFxCKVjnGVvfGgHQJlEbNNgeM6K1I9Hw12tkWqsSOSAlfthdWZPApTfeeOP\/\/u\/\/4pA7ixdeeOGCBQt4gv4FqgdWpcXA5MmTr7nmGj5+p6mpaciQIf\/97s9fOH7z2989\/sSqqsryKBSrbUFLlldWKopqwIEx7XAkgpdoGOAEQi6XlX0K9AvEA7oVCsCyjLxIS7SWlZbQrBVFEdw8tJsL1UA6jno+8ZtKpcghoYnakBBl3pxFFeW0guEugfXg4T8DbRAaqSxeVlNVDfHrSiS6ehIwZWpA86mKz6+QSWM9BOCmkCxosJyeUzWaHEuj59jAAkZqaW4AImkAYF7o6umBjV2xfMU+C2l0Nldi\/I4fESw9XYIAC7HLSZPS9gflZeWjR46eO2vOpInjRg0fPrihAXRF01Q2WUAxcrrrwn3Kh0KBWCxkW05Lcwf7lM\/VjqD4xPp62vZQUemTB6iEycYCwP\/3q\/TYIAogBLDgRMpdwTDgwtH4RDybbpqdncmuznRbW6KjPdna0tXa1r3lneZtW1u2b2vbtqUpmczShwSqVxSXVDnKRsVnCziglqgmYQioTqhIpNLFvEsLLEqaplTVVRnZ9Oj6wLAh8c3bEkbOHD2qSonVNoycOmL4BKgFqof+CeobKQQHCpLJ5MSJE7du3QqxwtPV1NQ8\/vjj8HTRZiQJr5vkhu3HRYlpFgEXagfWH\/LoQxOSBEd0fKgbC5wbvClPY2EpMa1NUBhtx1tDb3R0dOAuPT09\/L7Dhg175ZVXaEfRgYLzzjvvV7\/6FX+62trat956Kxbrx5\/GE8nEAcuW7di5DQ5MCW1PQCMByyrKHYt6i2zbhv8Pn4WcLhHqxpQlFfIDDUJdRHmoYEfVAsGAOnX8KAH6ynFi0aiiyIlEAsQUypd1HjjpdFoLhVOmqTt2abTyjFPPDgajqMD3iY8HDx8J0D7rNqx7e\/3a5194ftPmzbZtso8BZNVkWqs\/b5o0NR+mS\/H5aCshy1R8SkDVoAARn0kldAsiLnZ292Rzem1dzW9+9esZ02aQaWROUeE2\/w16m5T35rdt+7atO7a\/8tqrb77xVlNze3eiM5FMUo9aVMtkjZamLot1zokiKIwvGFBGjhxUWV2iBvwgNig1Hg1UG4QGhEGSaF4P0qOV6blsOmPmsmh2hsg2SjB0g+3UQAsY0GNRT4qCJk6OPo0Kg0bH4+IMHD9m+Vm\/gIxr6ZMEAXmhXlFpRB2Ym0csQTcV2aeG1cZRg41Uz+FzK6dPHnzzHc9rfvWApVOMwJBw5agliw9lGfRXDJB+giLwXkGWYbFuu+02HELE4aitX7\/+hBNOQBgvG1Ig0VhDcL+C5CIMY08RJL74oXj6hezQCBMQAlxGnQdglTZ9MqDpMyATvakgHOijjjoKZpLuwkjDX\/\/6V1ATHh4YBmDSpEnXX3893+8RtRoIBHpP\/uwXwMsovonHHn\/8qj\/\/uaQkWhINwZtS\/P6y8gpm7UnrwBXAu6OFThQ5l83CccB7py5E\/EdiJsDRAiewTLO6PB4Mwj8jlqDrWSgpcALkj5QyjVXGLaUcdULII0eMmTBuKmOhBWGjcnjw8NFAosfYJPzvMSNHL164aMbUadWVNSFNa2ttbe\/ocmwHtsuvqZbrgOCS7Mo07R5UwCfTBy+IKBuWZzBO0O1Xlbmz55x60ilsQB+TSJJLEvCPLJw8MfC+9Igo+NmkTfEfAvAiBjcMmjV9xpTJEyeMH19fWx2LhFE8lMpxaBEhw9Rh8iUJxZb8PjyEnDXszq5UR3t6x\/b21tbulpZOePwtzV1NTW07d7a3NHe0tXV3dKYSyWw6a2R1C\/Q8Z1im7YJXoJ1Kso+tVET7SqLp0dhBmUpCe+OyZoiWDd4Aw484BFBqRCCMkqNRI8A7fdkHBYc2zwXZCvhKK8tcI7dwSl0sHH3u5Y2xeGj48MZQxajutDtm1J52m+s\/GGicAMBbHDdu3Jo1a0AFEAY2btwIm73vvvuSOoYYQPrpX6SklQdYkHUdQWhISEQXYgDGQK2D\/qdT7IiBxp\/gkDxGnGMSD3E59thj7733XoQRg\/iVK1eef\/75lIIB8YVQf0Y4HIa1e+CBB\/ghavi4444rKSnhh\/0E\/N3TW\/\/dH37\/xhtvxKLhkmgYTgl8FZriZZq0sCXSkenHm5doDAFbzUwLaLgWugNaxTAMVIWqajQYynUioQANlRLyUEWgSjRxCXrEyed0HW4INJwj5qGQp0+eVV9Hk1DoDiQSA0EqPPz34GqkcLAL27ZtI0ZKE+oKII3VKxlkLF4aHzNq9Lw582bPml1XWxcMBJqaWhKJJIRXJNOXj8ZiiqrKfkVWZGIEeScYCuumlaTJ+gZk9bgVx02ZRKvrkOJ7N\/OPJZyFlEUd2Vu0C3kWfvBPIVU0Emuor586ecr8efNGjRxRX1sbDUVRflWR\/X4QFDQsNDKjO5Ho7s50deIv1dGR6OlOZzN2NmPS2gfg5WiY0MQ0c4G8Nzj5PrL9tPQQ3H7qKVGI1SMlnHvG52kGBE2CYIreRcN2YQJwuYNcECbaT+r9PfUMFA5dS6G1jPz+YLCmvqY8Gqkvj+G+tijXVMbxXJ05obZh1OCGwnK6\/RQFGzbw0NXVNWvWLLABvE7+jD\/+8Y\/5kMM9tsD\/BieeeOLf\/vY3BPi9qqqqXnvttcrKSn52YIBXWiaTmTp1KidbiFmxYsXNN99cSNEfAHXAGKEIa33okYe99fprDfU1oaAGdwq+Fx7Khqvl2JIIf0AMh8KWY+k5wydL1KXp97mOCx0D5z+dToEI+hknqCqPjxpe71fy8EdsC+oG+siGSlJ9im6YeUUx847pWKo\/csqJZ1aU1xUKQvg0hdBD\/wVkCbIH8MPHHnvst7\/97erVq1999dWPy7m3bN3y5ttrn33+uXUb1pt2Dn62Fgz42Apatm7kMlm4w4lU8rU33oIFnDB2\/A3XXltZ3ic0lWkY69av37B5w0trXnpny9aW1vZMFg3IyuVokQM0GE6JoMuheXwK9eeDGMDYw6KjAtl3PWa8WR8eHzjIdlEWLdP0+WhJMRzJPhlNG80Zl1BHgOnIoiKAwIMWsO8vuBa\/yMbJ06cW5Imqwx0BwTZpyxPFX1FfM27C6HWvrMmn01VVJSNGNgypLQmXB9JycPGSL48aSvPh+y8GLCcAHn744QMOOAAPSLTRpQGDxx9\/\/FVXXUWrUn9KSKfT3\/jGN6655hqE+V0ikciDDz44Z84cnmDAgMsJ2srdd9992GGH8UjggQceQCUXDvo8ipzgpn\/849zvfjteEqkqL4NfomkBNHVawYq2kYH6cJAUXhT+oUWNdeoVEGW4JBI4A1wS4g2036oLP0R0rQljhtVUxS3LtAzbp\/gNW4ceASfIZHLwXEyoF1EcPGjkscecsuuLk8cJPOyOZDJ5++23\/+lPf+J7tcRisR07dnzEAUnF5skPoey2bHln0+ZNjz\/5+Pad25OpJBKEQyFQ2Dw0oSy2tnV2dnYduO9+l13yy74ghyhesfCmbWzevOXttWtfee21TZs2dyfTnd3dqVRKN000XRoyyTp0bVoQiS0vhjZIDYomXaqaApvGqsONREOyQhMyZFEqLY354d6rqqJp6azx4vMvJxMZqGs0Z0SBYeh6DjWDfBDp89E+6ZQFO4RGQEtHlpIj+mUx4BfHTR4rKb6Xn19THi5PZXO6ka2vLp27aFppbcWK5ScOrh\/NH6SfYsByAi5kYABnnXUWDhHmT7po0aIrrrhi0qRJLNV\/hbfeeuvEE08EnUeY5w\/Lcdddd+2\/\/\/787jzZwACeCADvQXjZsmX3338\/f+TRo0fDm2FD8fsB8vSlkAYXHXnMMc89\/3RtVWU0rMViYXj8Ai1UgST02tjXT9e0zEgkCktPusNxaBFjVc1ldZutxgZtAV9D0\/yuY44ZMaShvirR0xmPxeFe5IxcKBjSczmktEUx50J5+ebOWbx00cG8GB489MbmzZtvuOEGuBZbtmwpRAnCzJkzn3rqqd7fDt4PNMDeeoYf9o508nZrS+v6jeR8v\/XW280tzY5rBUIhLRDQM\/rFP\/3ZhDETSN77CD1lDa9YeMPSW1vbNm\/Z8sZbbz\/7\/HOtbe2GYWb1nOu4NElAFDVVCQa0YEijvjtZhGmHBqbFw6g\/gMh9IBBEbRi6Ho0QtQKNAEfo7k4\/8\/TLpkG9BY5j4UqcAstHS0cNov5wf9u0aRoC29MZmdlsm0TJEQKyHML\/PjEUjjimKAlyT6YL1dc4ZNCocSPqG+tXHndSdQXvC+yvGIDjCYqA0EyfPh2OO5+aCEGBfGzduvXmm2\/WNA20oNjeEM8DHEWhBHqfeldYDeN\/\/\/d\/QQiQG49HMuR\/2223HXww6f3eOQwM4ImKDzVjxowrr7wSlhIxHR0dePYlS5YgntdVMVmfBGmclvb2\/\/31r6FWSiLh0mgYpt6lLdVlv6LC+OPlwkOQZMm2bWgXuBmO4+KpkAYPBocBCcCB4DhoAdpaxtQNRZHL4jHTNFRFoXnONJ1F0LNZn+LPmgbUSk43Fy7Yr5xWK\/KwN+KDNMyzzz574YUXfuMb34CO6unp4ZEcxx13HF8W\/UOwW1vjh70jJVECr20c3Dh39tzZs2cNHzrcNM2eRKKluWVY45ATvnwCLeaNovWRNksjDlhJ6Cfvk5VYNNY4aPDMadMXzJ0zfsyY8rKyWCSs+MRYSaiurqK6Kl5eFqkoLykpDUWj\/mBQsa1sQPM7rikJeUXxufQdUKCli1yHuvFs27SM9o6unTs7JFlF4yYnh32TAIPASwKhBxUgSsHmGjjU3PMg9qTrBEER82FN8wly3hIa64fEIlE2dtEf0MRBw+Il1cFBgwZNnTTL76Mhxv0XA5YT4DWjHeJ37ty5VVVVjz\/+OFQ5vXtJyuVyDz74IBx6kMoxY8awqS\/vgl\/LMykaOQ6EE4nEjTfeePrpp+OXT1bhySBDiBkwmwh\/OMrKyvDgq1at4nWyevXq\/fffv66O2DGP6bPgr\/f6v9147\/33x0oi8Vi0LF4CJwBKACdMy1JVP40\/om8Ivkg4iiZvGrRwKekGlgG0ABSErtNCRsynIfWRSidj0F6RUB6OB\/vYCZEgn0eSTccxbbuionrJogP5Ni2QF+TDAh72LjAtQshkMtA\/Z599NgjBq6++Ck3C4wvpGGbNmvVpfZXjmjAcCg8dMnTp4qXz58yrqa0d1jh0wrgJnNnzhtEngIIUyoJ\/WJtDSxKFUCg8GORg+oyZ06aNGD5M9ftNXe\/u7kxlkrS3gm2hDhUfdeOlU1mafkjjBUH0aY8okHu4f3hIBARR7uhItTR3ShLFcPbP1TjAW7ck4xS9LdaKUQiRFjcURL\/oqkQdpMqKGtpkwjJlWVR94sK504aNbjRMszJeM3XyLBqlyLPrn6DHLgQHHLi4k8QLwlNPPXXMMce0tLQgjJjiU48ePfqoo45C24PvS2t\/fgBgA55++unHHnvspptu4vsbAcV8hg4devXVV++zzz48fmADj4wHh1JbuHDhmjVrYBEdx5k\/f\/4jjzwC75nXdh8G3pd4+FHL17z2Sk1N+ZDaas0nZfQcfVAgq5\/nswZ6uhMBLYim7VMUvHrXskW2WxoeHm6ESf4GbSUH249IUzeTPe2Ng6vGjBpGQ70FUQ1puWwWNaGbNgiCbptVFQ1nnPbtXQUA+rXS8PDJsX379ptvvvnPf\/7zhg0bClFMk\/BAb2188cUX\/+hHP+LNrRD1MUGyvitEOTOXmEdwUOY85hPe4XPBrhaDJ+hdE9093a+\/+dqbb725bfvWbTu3m6YRDocdx6btDFwX5B4GG9oJzRpNlVqr7Mvpuk8JvPHG5q1bmhV\/kIYfUmJq1KgKXOVYbMt7kdgDzUoQaR0SJJBxe9f15x1NRav3D64fJOXFnq5uJ2\/V1JTst8\/sjJBL6sbEMTOPPubEd6u9f2IgcwKAPx1vVDt27AAxBz1nZ9616Bxwc0HMx48fj3jYNpUtO0PdyPk8iPxLL720c+fOQtL3XrtixYrLLrts0CBazxKR\/F4DG\/wxH3300QMPPBCEgMf8\/Oc\/v+CCC3gYv322Hp5+7tnjTzoFvH\/o4NraihJDz8ENgApAqUO0mqFNs6V1MxikAVmST4IqgRjQuqaiCM0iiXnec2C7DkhDMBiUBDmbTZaXRadNGis5VtYgny+nZ4OhUNa2\/KFQOpObO3PxvksOYXmgcga+hHjYDel0eu3ataACt9xyS\/EbQW818n6AcE+ZMuWTqZTemRYupm6r9zOAd+P6Bnh1vKdA\/7F0sPTbd25\/9bVX33777eaWpo7OVskn0mjCoAq3UGbrNPjoE0k+mUnJYvCVVze0t3f71aAi+ziBoOZsW+zWtMItKtyxLdALarBs0LGLs5blF\/Oqz19RVhkNBw0j57A9FubMG1tbV2ZJdkdP6ohDls+cSV9R+zUGOCd4P2699daLLrrorbfe4ofSrikJHxG9m3FjYyMM4QknnMAP90KcfvrpV199Na8TkPSHH3549uzZvbtn+iD+8c9bf3flVY5p1VaWqX7BtkxdpzUH8VJDobCFw5wBheCTZfqDMpEkw6SN1OBNBAMB09ChPgJqMJfTZcVHWyJZjmEagaA6edyIeETLizQEIZ1M+cOBHj2b90maP3rUocc2NAxFHn22Wjx8pnjyyScXLlxYOHivGvkgvPnmm2PHettqfwzYjtvUtPPF1S9s2LR+\/YZ1iWSP7Bfj8TLqJSBmrzuO5eb9Tz\/zcjpj+P0a7SXp2DJoPutHoT4+9i8NKqQFIE1BoO8Ksk9ybEN2bJ+QV2W1uqwmFNJUzdeTSPoVed\/9pws+R1KVRDp32KHLJ02YQ0yiP7fygTzGcI8YN27cypUrq6ur4fe3tbUVW+aHK+vdzo4aNeq888676qqrZs2ahUMSp71S1y9duhQcq7OzE2HTNOHZnHLKKWzZEELfrJM33npzR\/P2uroa6AlaJk32mWwtWPqkmHdc2xYFx6\/RvjE+1afrumVb9H2QTWH0EU+QoFxM0waNwBF9VjRppzXLMkoi4UgkqOdoCjjcC1vIp7JZPWcObRwxb85iNkEMJ\/ZGOfEwaNCgysrK5557LpfLFaL+E84+++yKioq9Vrd8XECRw7rHYrGxo8fOn7tg2tRp0WgsEoz0dCWNrJFMpgwDbVzqSWa2bNnJqpQ+ArouLWSORs0Wr2eanOVGk4ocmugoscUJaBCBK\/hEieiF35dOZ2SfL2emJ04ZNaihOpNNm44TipSMHjWhvKy6v7+uvY4T4AVrmgZ39uSTTwY\/gJR0dHTw9Xr\/I9BEjznmmJ\/85CeXXnrpkiVLAoEAIpEhfvfOdgu7CHp0yy238EVAm5ubUZmHHHIIP9vn6oQR+BdeevHl11+RFDa6WPFJPkULBPwqrWCo+TU0dZtWKbaDoYCbpw4kSaI9Z2VRdh04FbT\/ikMTk4gjgDZARUiyCOpA2UlifW2tzydmM2mcgP5IpDO25Q4fNnrkiHG7xGRvlBMPeO8zZszYb7\/97r333lQqVYj9YMycOfO73\/0ubJInMB8RvJ6KFCoaiY0fM37u7PlzZs0dPWoMGm9HR1cmk5VlxXEF+j5owY6Dt5Php66CXcOIkQOpdBpkQEvbS7Kk+P2kAgxDlf3RSEj1K9lMrru7p64hPmv2BFGAX2BbjhuKxKZPmxMMRqkc\/Rl73beD9yORSDzyyCOwZ2iuvQcNFNHQ0LBs2bKamhq4xf16159PHRAetMBzzjnn97\/\/PQI4hGG87777+vIqRtfccO0td9yqaWja+M\/vuHkwGzyJZZiOZYlskSIh78BBcF0XpxzbtUwLegNaA94EGADtkSgp5FDQjhhCMBhI9KTou6PoTh4\/uqYylk4lZUWxRLEjkVZk9bjjTho1YkLh9h72brzzzjtf+9rXiguEfxCgcKCOCgefNrjOfz\/baG9v7+npgatTX19fiHofPujavo90Jn3dTdfeedc9tXUNUFMw6h0dne0dXXrOAPmHMyAKsivQ3hDUaUAMIQ8CIbF1DuAQmKnUsLpBtTXVhql3dydyufS8hRNHjqxLpTIZQxd9fp8a\/upZ3w4F+9da73uAxwk8fHJAeKAdstnskiVLnn\/+eU4LwuHwyy+\/PHz48EKiPobf\/uG3dz1wb0BTVVABCVZdFthel7QzmuMGg5pt2ZIgBAMB27IMXbdtW8\/kVFWFdhAF0TR0pAQnoH4BHxwM8Ac7p1sgAaLgjB01rK6qVM9lgtFQ2rQcQQ74wyuPPzUWqyjc3sNeD8MwvvWtb11\/\/fVoOIWo92Hfffd9+OGHCwefGd54441Nmzbdeuut3d3duVxu48aNoAWhUGjkyJGlpaXgwUcccQQacu+REGgn+O1nnABFZuX9xa\/+59JLL4VdH9LYWBYv04IBxxW6unq6OhNdyUQykXIFgfaEsGilZDyi368K5AYIPtdRXLcsEq2sqIrGopalhyP+KVNGSJKdSmccQcgYVryi7szTz\/H7P7VFcr8oeJyApByACHyIoPeupQ9JtreBVwsq5IUXXoDi4CtAIPKQQw65++67eZo+Bre5tfWll9c88\/QzO3ZuTaQT8AxoTqHsM0wDHoHf78ehD3\/03VChJYx0PQ8vIafjwdhERETkJEFWNU3x04cD2zB0wwE\/sG2rvqZizPAG08z5NFWi7enE0mj5yStPF4QPW43Ow94DrmpM05wyZUpxpPP7AdP1ve99r3DwaaOzsxM84KabbnrxxRd1XS\/EfjDGjx+\/fPnyY445ZvTofrZqb55vhk9jgYSckTvxlJOfeHxVaSxSWkL7lQeCAVFWYrHSYDjiCKLjuolkuqW5LdGdzGZzUPOqGiDtJuVBCIKy5BhmOBLTguG8kFu4cGpDbYVAeyKYkuJPZo0p02cfuP9RdM\/\/PFWiT2OvG0+wR+C9A4WDPaH32Q9PuVeBVRvVRh3DnXfeySPXr1\/f0tLCBxZwJUip+wYi4cio4SP3XbJ05oyZtVW1tdU1mVQKVj2VSNGYQceluQayTN8bLcu2XU0LiLS8uqwGNFGmuYkS7XJEnyEdx9ENWmnVzTs+ny8YDCQTifLSWGlZtDud6k6kdd2YMGHKsCHQpJ7M7O0oEujm5ubDDz\/8pZde+pB28c1vfhPO+qfedjKZzG9\/+9vTTjsNhGDbtm22TUv2\/ke0tbWtWrXqmmuuaWpqGjt2bGlpKSL7WrveIwrlo3\/E9o62K\/90laHnSmJRNFUh76D4Zg4ReiadMnIZRRbL4yWNgxvq6mpCwaDPJxqWQasUuI7s5P302VB08\/l0JlkaD02dMpZWTHBpJQNRlvzB4LBho+rrhuAl9\/1q+XB4nOBdw\/bh4MmAwrGH9wJ+z6uvvrp27Vp+uHr1argXfDJVX6q0d0sSjURHjRw1fer0efMWTpwwCW0b3ls2kwEZCGgBaIC8mw9oGnQfnAbLsamXgPiApGqaT1FEWdY0PyJ01sGgBTTDNMASYpEQHA+TxiPiueUli\/crLfE+HOztKBKC7du3L1u27IUXXuCH+IWJ5c46DjkQPuKII8aNG8fDnxi4afG++P3nP\/953HHHgQ0kEon35zxp0qRRo0YNGjSosbGxqqqqq6urN2NAerDkF1988cYbb3Rdd86cORJbKv6\/LOFnDxSP\/wkbNm78241\/E8V8OBiWZRTeFcD0JVp4TBZpHdN0oqeroy2V6LFtqwzkoLGhoqo8ENBU2edapiQIiuKzXcvOG9OnTywrjcpiHhqDJi4Jdkd3d0314GFDR6Gm+F37L7xvBx4+BXDtsNvAgrKysgcffHDatGmFRH0eqUxqy9YtKH9rW9vb69ZCCdJWCGgkomSael6knZBCwRCNJqRIkW2ZmKONVehIVBQ\/jstLQ8NHDoJzkcnagwYNPvn4M339fP1zD\/89eANpb2\/fd999X3vtNYR55IIFC6677rrvfOc7d9xxB2IQj8hwOPzss8+CUrNLPzmQFX6RJ0zXd7\/73d\/97nc8voiJEycuWrRo+fLloVBowoQJxVnEwNtvv51MJh955JFVDHwRF148BPbZZx9wi+rqapa2f+Ca6\/563vnfj4SDVWUVikKcwHVcmjck+sD+fX5aqIYeU5QymVw6k4EPMGrMmLKKSkkQs8mkkc329PS0tLaWV8WXHbQkILuSaxs5+AN+VxG6U5n99j1i0YL9Czfrz\/A4gYdPAUXts2bNmpkzZ\/KpiYisra196qmnhgwZwpP1Kewm+ShwISQIbt7d2dz85ltvPfb4v9s7Ozs6O8H8LdsIBAIy2xxF4pPE8rQfElvdyAe1G9A0OBOZdPf48aMVzZ\/J5mZOnX3EISt4nh72crzzzjvHHHPM6tWri5Z1+vTpDzzwAKgzDi+55JILL7yQpxw+fHjvlY8\/MZAt7tXU1ASr\/\/TTTxdiGY488sizzz573rx5H7KgexEvv\/zy1VdfDe7Se872sGHD\/vznP\/ejBd2v+N1vfnrJxfGSkvLSEp8sKQpNLJJlNFl6HQijrqC4wBJM3WpuazUcZ\/ykSbUNDSItfeyqsg++QSqTcUW7LKqNHlIvWfAJbJAIR85nLXfll88c1DA8T+MJoC36cU8BW6nBg4f\/DmhOAAJTp0695pprECjqo+OPPx4ON4+hpH0GvMxFUFve9SeJUkNt3YH77veLn\/3iZxdedOpJJ08aP2H86LGaomaSKQfsIJfTc7lkKmXRdiu06Yms+HyqXw2HIqVlze3dqbSed4UhjWzyRd96bg+fEyDwRZmHq71w4UK+rzqPXLx48f333w9CgDDE74ILLrjqqqv4VGcQTd5kPhn4fQFk29nZefDBB\/cmBCAijz322O2337506dKPQgiAKVOm\/OEPf3jppZfALXgMct60adMhhxzyxBNP4BAGFbfjp\/omXNdZvWaNRjspw7QLNASIffinAYT5PKgAzS6grwMKUuKEYZihUKS8olKQJDufzxhGQs+m4QBoGi7t6uzKO65pObLPrwUCtGuqKPHKpB5Edsf+C48TePiUsXLlyt\/85jc8jLby7LPPfve73+XhPq049tSU4SHU1dQevuzQn11w0aUXX3rZxZcu\/9LyiWMnqj6\/bZhWznDZ9gg5XZdlOZvN5nI5uBs5021qbkeO9fVsFwxawdDD3gjIPH4feughmM8dO3bwQ+DUU08FISgvLyfTvatRnHHGGUgZj8ej0SjvjvpvgHul0+lDDz30lVdeKd73vPPOe\/TRRxctWsQPPyJ4CUePHv2Pf\/zj2muvhfFDjCRJEHjk\/9xzzyFcvEXfRCab3rxpE6iAX1UUv4LSggQ4tg23nliCIIPBKz7aws2yHFVVqyorystKQwHVr\/joIwMtcOrkDCOTzprZXG1FhegiOm+YJq13KIo+nyIwVrFnPdKv4H078PApAxKFprX\/\/vs\/\/PDDXFMghm\/yxhP0PfAmQMudc\/Ru1vxxWOjdE+s3rHv2uefa2ltfef2VTCarm0ZZeZmqaY5jW7bj9wdNPT1j2qRvfe08Wu8QV\/Ztjenhs8Mll1xy0UUX2bYNw0mfqwXh5JNPLvalASwVmXAuZmvXrm1qalqy5JNvpcPzzGQyRx555COPPIJsERMKhX71q1+dddZZxQT8dh8JSN8rMYgL6MvWrVt5zpWVlc8888ywYcMKp\/sknn3u6ZNPOUW3rYqKeEDxuY6r+TWweZ9Ppq3S8yItMmY7suILh4J+xY94x7UcV4iWxS32QQEPazqOrhtRRZo4YnBIFW3BzZl4rT5bEkLhklNO\/npQjbC79dIU\/RAeJ\/DwKQMShfbT2tq63377vf7664VYQbj88su\/\/W2+X3BfA28Ce+YE76KQiv3uQiab2bBpwz333tvR1dnU0ozTkiLHIrGuzvZTTjxx2X4H7\/EqD3sDcrncj3\/8Y1hihLn5RODMM8\/8v\/\/7P36IX5aw0GR4+L8Hzw1c5IILLuA3gmd\/1113oT0Wz\/KUHwy4zS5trQxGixyY7Eu9JHnrlq2HHHzoG2+9zvM\/5JBDkD8PU5JP71n+SxCZQdlF8YEHHzj9zDPVgL+irFSD+bdoZVKZefagayg3mzoUiITD9Lw00lAAvXfzQiAUcPCPKEqipCJs20NrK0siSiDgs0wbpCEvyznbHjZi3LFHncJrB1XQV57\/E8H7duDhUwbXCFVVVffdd9+IESMQhoeE33PPPffPf\/4zpehzQIGpzPwfCu0RezoXCoYmT5h8wQ9+dOkvLvvaGV+bO3POoLqGnq4ux3YaBw2lFB+YnYeBDHDigw46aDdC8Je\/\/OXKK6\/kDaS34fx0jShye+GFF8AJEOb3veGGGzghAD7avUS4zrjS5UXFHxm6vANLieO8MLhx8B13\/isapZV\/kOE999xT\/FzY90A18Mqrbwg05ofNN7BdNnWIRhSi\/PQIshwKhUAIoKl8Mo09pKnIgkRrl5HyyjuGZRtmqjvh6mY6kVRUNU8dDK4syPm84zpuOBRl9TQQUBBWDx4+C6xfv37RokUtLS1QHFzSbrrppuOOO46f7e94t+30UrSpbHr7ju2bN25cunTfgEq7ZHnY2\/Dwww+fcsopfPMULvkVFRW\/\/vWvjz\/+eMRwsflotvmTwDTNxYsXP\/vss\/zwtNNOu\/rqq3FTADf9qPeFB7zLYURxeScBfkALZAGOM7xJ6f\/+749f+9rZLIlQVla2evXqwYMH87vwyC8eKKgomJZ58mmn\/3vVvyvLS2PhAJ+CyAkBAkFansinqiqvHIR1XQctQAwul3y0YZKhW36\/P2sYpbGoYOuDB1fV1VUJjuuTlZSRTeTMZQcdMXtGYQoGu2c\/htdP4OGzAprcyJEj77rrrqI\/gciVK1cihifo7+BPRIqEPSzC+I0Ew2NHjjlk2aEeIdg7cfHFFy9btqy4mxpEYujQoY899lhvQvCZ4l\/\/+hcIARfOKVOmFJclIEH9yNaavhywktL6HGyCHdgAAj6+TgE9Rf6rX\/3aV077CiVi6yX\/4he\/4OG+hubmpnXr1yqK7Ce3n2YR84EdmqaVlpZCO\/GhHvQ1QZZzuRzoAgI22wSVPShlgqvCwaBpWIZpJ1NZVQ04jmuCbji2KErhcL\/fDrEIjxN4+KzAFdCMGTP+\/ve\/g2VzWoD2duyxxz766KM4hZjPQUV+pigqWQrQx8uPqnM9DBgUZbi5ufmQQw658MIL6RP1LsE48sgjn3jiCb6gJ4B4Dn74KYIXA7btsssu4zHAL3\/5S76l+8e9KaMB9CNBqunzusDW5UBGeWIJgkzCzkZQVlZWsivoC8WmTZs+i0f75GBl0U09o2dp7VEaFlD4lBkKhWKxGGx\/NptlUxBdy7JQhz4f+1wg0E7oOCtJomlZqqriFB2Iomm7uawps52U82Ie2YJGIEx36t\/KrACPE3j4zAG36a9\/\/SsaGNoVGhWa0BFHHPHMM88gDBQSDQDgUfDHdOnA0A4ePgq4DN9xxx0zZ87kGxwjhlvo888\/\/9Zbb62rq6N0nzF4MR566KHiskigI\/vvTyvr8cJ8dLDU9FNonMQLhD+vuf\/8R\/6C28jgBewEyEFlVeW3vvUtlkiAce17A4boKVa\/\/HIqk\/ZrquKjGQcw9sFgMBqN4pcmD7PVihCJlCBz+AVFwC\/idV3PZDIK612QZFn1KyAJokTbndAmikjt2D6fUlfXUFISxyUDAx4n8PB54Pjjj+f6gtOCdDp9+OGHP\/XUU\/zswADUT0GP8r8CCtEeBipSqdTZZ5\/9pS99aceOHdzFhJDX1tbefPPNv\/jFL0CFYV14ys8BV199NX5RABi5H\/zgBzzMznwMQHgl3idA0w7wr3jNaw989YHLfvnM1T978m88AXsk+jnzzDMrKgo7etxyyy2GYfBwH0FeyL+0enUylXLdPN5FMBAoKSkpLS3FmwIhUFWVM4BIJIIYvloU3heoAw6hqWg0oijatuU6TiadxiWoTU4d\/KpflkWQBtCL8jitPcXQ79u7xwk8fE445ZRTei9x2NHRcdBBB91444387CfQXH0N72EC78EHRHvoh4CgcvDDhx9+eNasWX\/84x8RhlRz87\/vvvs+8cQTK1YUlrXmROFzQGtr66pVq3h4\/PjxM2bMQAClAngkwEwWCknT6Kis9Bz0MMzG00kWQf8hgMvwe\/6qP53+4GVOKC\/EAz958s+Xv0jjgSSap4iL3Hg8fvTRR9PVbP1mvrJhsX6+aIipdKqpuXnc2NHRaDAcDQVCIbAlUAG8FLwslBMB0AJQAUrNPm66eVdRFcexTcP0+fyuQ2+QBiGyQQZgCoZtgzz4fQp9PiDWhBz87G4sj37e3j1O4OHzw8knn1z0Y9D80un0CSeccOWVVyKmt9oaWBioz7XXgYgAM3VkY5n0fvOb3zzwwAPffvvtYgLYm+9\/\/\/sPPvjgsGHDeOLPEy+99FJXVxcPH3vssR\/cpkQ2qYBOw7Djf\/xQUvZw9C\/MGi3YK9hC\/uv3XPHLp65xNEGU\/aLgE4LKeY\/89g+r7yHL58pox0jfeybRY489xgOf\/+PvEYZuxKLRMWNGjR83JlpSIik+FMuwTBQcvMcwTfAC0zSz2SwoAmqMdRuItAFCHlxAAENADDgB2ADoA96vDE5gmj3JZDqdAXuwbCscikgidTYMDHicwMPnitNOO+2KK65AACqD66yvfvWrnCh48NCXwcWV\/955552zZs367W9\/yw0JO0+u+V133fXLX\/4SJuQLsYh86C7HAQccUAhxoDj0B1Po8E8CKDR1B9Af\/bBn4ONkyf0XJXFnuuPo2y744+u3CiVhSfDnRYnO+nyunXx521uUmq1hAMyYMaOxsZEFaUADfot18oVj7dq1W7duzaQzNptNoGiqL6jmJdGkzczzSkCVFDkvupIkuK7tg\/WXRZ+Y12jkgYN6ATPgr5Lto2jThmeKAmYgSgj5cMYyzZKSUqq6gQKPE3j4vPGNb3wDehOBIi04\/fTTzz67MNHZg4c+C4jrxo0bTz311COOOOKtt97i0sttBqjtqlWrDjroIBzymM\/ZLoKdrF+\/nodHjx5dNNIEbroJsOK0PqFOa\/UBsOpUSJdNN2RBPA5NMdiR7jrk7z+6c\/NDUlj1ubCalCovOflU91GjD7r80HPygkPUgtlCTdOmTJlCF7PvF+l0moe\/eOSFUaNGrTzhhMb6Rjxec2trV09P1jTziqwEtEAo5OBxZcmvqi4CeBRRlCTR7\/fbbIuDgKbiEEzC71dQczb7cKDIPsd1O7u7BElSNS0SifGZHQMGHifw8AXg+9\/\/\/k033dR73YI\/\/vGPJ554Ih+gxLUqB0vuwcMXhqIQIvCHP\/xh+vTpfFgM5JafGjly5L\/+9S8IcHl5OY\/noGs+R6RSqeI6RShSSUkJDxMhoNEBVFTqABDENr17+XXn\/XPdKhpICNsu0sQCZuBxREsXPrH1jcNu+sErna8LkWhelF0J51z6kpBOHzho8TVHnh\/1BRAlUmShcoqbJu\/YseP555\/n4T6AfGVF5fHLv3zpJf\/zsx\/\/9Kgjjpo4YZJP9jU3t6YzWVQJqsVxHNN2ZL+qqJoo+WzbNdlWB4Fg0KadDny2Y2eyGdM0XIe4k6Iofr9qWw4t9ihJpaWlwWCocLcBAY8TePhicNxxx913333hcBjNkuvQv\/3tb4sWLeJ7qxQSefDwRYNLI2R1\/vz5X\/\/61xOJBI\/hVvarX\/3qSy+9dPjhh1PSLxrSrsGMfCz9u0B5aUBgHsY9ZWVP+dcv797+76\/d\/f8e2\/4q6zWgFPwzAPzk+zY+f9g\/vv9y8i0xGhJtWpUgL4JL5POp9ILaOTce\/ZOIT2PWlC1\/TKfeA1SLruuFgy8cuzQJGMywxmFfP+vr\/++Sy37x01+cdNzKiWMmgAs5Th7W3XbdQChUWl4ejITDpSWyplqu6+RpLKEg+UzTxBGeFSdln2yxxScMy8rqRkdnVyqVqayo4ncZGPA4gYcvBtAd8+bNu\/vuuwcNGsTVK1oaPIz99tvviSeeQJiDJ\/bg4YvC66+\/fsQRRxx88MHPPPMMDiGTXFwnT568atWqP\/7xj5FIhMd8sYAlttkcOYAvS\/AewACKYs6xT7\/70vu2PCWUV3RKyRX\/vOjZ5vVkAxhpAK574+Ev33Vxwp8UA5rgSrIr0yQF0c6nMzMrZvzjqIviaoi2BKIpC7T\/j0CLFxGGDx9ebK1FatJXgCLSLAsQGToaNWzEaSed+vOLfnr5Zf975mlnTp00LRyNtnd3tna0W3gun4\/WLigvk1VNDYbdfF7x+xXZpyqKbYMPOIauJ9mkRMM0fYpiGCYSstsMEHicwMMXA65BFi9e\/PTTT8+cORNaFUDkhg0bli5det111\/FkPB7ghx48fG5obW294IILwFzvvPNOHHKJhSjGYrH\/9\/\/+37PPPgvpZQkLp75YtLS0ZLNZHq6qIs+V2cBCw4GjbAn2OQ\/8+h\/rHhTCIRG+rl9rs9uPv+Unr3YWlmG+4LFrT77jkoSUERWVrqUP7DDvvnwuM75k9C0rfl4TpO8REkXTE\/OH5k8+ZMgQv5\/Nx2MbLuC3L9RJASgI+9RBAV4feUGWfPW19UccevhPf\/LTn\/7oohOPPWH86PGyIHd2dCZ7kqZp03cCpJck2e8XVdWSZUH00b6niqpJfp9Eyx2qfq2iojIcCrNMBwg8TuDhC0Z9ff19990HVwxhbvvh7px88slf+cpXDMPoQ5rFw0BHkXomEolf\/vKXU6dOveSSS1KpFBdCfnb58uUvvPDCd7\/7XU3TWNq+ArQavjoC4NCYeWBX2xGFHjPzzYd+\/5fX\/ilEQrROMR4JTxPQ3tG3nX73Zet7mn\/85F8ueeYvQkwSfT7RlWjsoeQ4suPmkiNCI25dfsngcO+l+shaFoIMvl1LAgN9kcGjvLwyev8yIDi0ceiKo479+Y9\/dvFPLz7h2BPGjBydt53uzq6Ozg7dNFy2\/oCsanhIW5IsPJ0oWa7QncqAOcRipZoaKeQ1IOBxAg9fMKBBysrK7rjjjvPOO4\/HcBX8l7\/8BX4YH93NYzx4+EwBMdN1\/corr5wxY8b555\/f1NTEI7mRW7hw4YMPPviPf\/xj5MiRiOEr3rDr+gRqa2vD4YLDWliBhxhCoeG83rb1qmfvEgJ+UZDBBmggAC3974rhwOrONxbd9PWfP3uDENUECYSArhLzCn0iMLvrtZpbjvnF6NIaIc95xp7R3NxcXMGQdhTsV8B7xPtErQyqa1hx1DEX\/ujCy\/\/f5eec9Y1pk6eLgtjW1tbT04NEJniXnHd8oqgpjk9O5HTDyWsqOBYN1Rww8DiBhy8eXLdedtllN9xwA99uBIfQxc8999yiRYv4MG8PHj5TpNPpq666Cmzgq1\/96oYNGwqxTDjr6+v\/+Mc\/PvbYY723D+hrPJXv+cvDDzzwAP3DC0i\/7vz6Mb9Zdo6QlfJ5m\/hAns1CdGUwAFcTWvLtQpD6BqQ84gScpn52PVMlld9yzP9MLm\/AQwsijTf8IIC7F3spOHgt9QuwV8nWMGKQRam2quawgw+97JJLf\/3\/fn3O2efMmjELJ8EMLNsyXVtW\/fHyct1y33hzA5KzLFhGAwIeJ\/DwBQMNsqhejz\/++IcffnjChAkIo3EivqOj49RTTz3ppJM6Ozt5GsTzgAcPnwBM7RMKx4IAXf\/rX\/962rRpZ5111htvvIGYokCWlpZecMEFq1evBlEoRpK87gKP6QuASbZ3jTGEa0v\/oHTk\/rr5PNn7c2Yc+bN9zhbSZj7vyDSQHt6tLy\/wLwV+QQCfgDlAmDoIHCdTmi+56ahL51SPFMAbaGGDD2t3vQlB77rtLyi8TobeD9o4qPFLh37poh9ddMnPLv7W174xZ9qsoD9oZM2Ots5cKhePxefMmldIShgIqqnQLebBwxcOLopok+ABX\/\/61\/\/xj3\/wQx4\/YsSI3\/zmN8uWLaOkHjx8IhRljB82Nzf\/7W9\/u\/LKK9955x0eU5Q3v99\/2mmnnXfeeUOGDOGn+jhM01y0aNFzzz2H8OzZsx977DHqw3ddMv3M95PwWKLw48eu+\/kzfxEi9BGBZg2ALLDnzbM1CmQXRFywHT1sqzd96dJDh05BbdAyBCJ1HhTmLfYCnWWVefrpp\/PVSGtqatasWVNdXV081d\/BKBX+LTzL1h1bQRzXrlv\/2iuvnHjCyqVL90UkqpA9K6vifg6PE3joKyiKIlcll19+OVy0HO1NzlobOwuucMkll0SjUUrnwcMnxebNm6+66qprr72Wu9RFKgBomrZixYpvfetbkydPxiGPx2+fm2L3Pnz1q1\/lu4cAmzZtGjp0KNl5brBcMv68KZ378FW\/fvE6IRYUaYFCGl9PhEGCo0+fDPK2rWXlvx35s6NHzxXyriviqWktgj0aO1QLz3PcuHFvvUULHiPA+1qKp\/oduBwUi04PgiMcuyBX7z5RV1dXLBqVfTIXHEgQi+73Xe\/9\/gE8DBhAg3Dww3PPPfff\/\/73tGnT0CaL+uX3v\/\/93Llz\/\/nPf\/I0HDhbCHnw8F68XzbgSZ9wwgmw95dddtluhCAWi5199tkvvvgiuAInBPws0PcJATB16tRC6N29D9BqWMtB8ekfesz\/3e\/Mr0xeISTSeckqnhdcH\/7J53UpK1x1yAVECJAYD86ug1XcI1Az+AUJ2LJlC49B8+QBfqo\/AuXuXXR6EH4MQsCkiUtLPB6X2QCOXU+623X9FR4n8NB3MXv27CeeeAIeG8KcFgBvvvnm0UcffeaZZ8IT4sk8eNgjuMzwsK7rN91005IlS2C0brzxRj7DkJ9FsmAw+I1vfGPNmjUgnePHj+eX9Dvg6YqLBNx99930D56N7Bc9JvUBsLkIOPjDsm8cP\/ZIIaEjAcUiEv+YeSkh\/PaAc0+cwNddoGh+If2zJ\/DcH3jggeLSCCgDDwxMsIooChUDqyKK4X\/9Ht63Aw\/9AFA6YAbr1q1DGM2PCy28up\/97GdQ5SyJBw97xoYNG6677jrwgKIvWxQhoKamZsWKFWecccaYMWN4TMGKfqAd7LtwXRcm+fHHH0cY5GD16tXgN3ic4rPgwWhHA4qRDdc57rb\/uWPjPWIsSg8tGEIy\/6vF3\/nOnCPyeZt1EHwkjzGXy02dOnXt2rUIo0mitisqKvgpD\/0RXj+Bhz4NrqAPPPDAF154AYpb2rULLdRcIpH45je\/uWDBgnvvvZel9eDhXcBzvfXWWw899NBx48ZdcsklnBBw68hFaMSIERdffPGrr77661\/\/mhMCHg\/0R0KAwqN1gN8gjPKbpnn55ZcXT\/EAnooNKxAsIa9K8vVHfu+AxsX5ZIa+lPeYP15wOggBW4VA+sCvBe\/DXXfdxQkBcOSRR3qEoN8D4uLBQ3\/BI488MnHiRC66vRX3EUccAa+Ip4G3BPCwh4EN\/q6BwjHDk08+ed555xX9fo7e0lL8fFC4YECAV0JHRwdf2BjQNG3z5s387LtAKte187ZFoXybkZp77TeF86d+75E\/8fM2JWB\/H4zedV7cJRlAzfNID\/0XHifw0D9QVEOZTObSSy+NxWJcDRUHf\/n9\/tNPP33dunU8vYe9DVu2bLniiitmz57N5YGjNxWIRqMnnHDC008\/XbRnQO9wvwZrH\/QsP\/zhDwsPLAiHHXYYP\/sukIRSuU7eoZ98fmOi5TdP36azk5QNThfSfCCK90JLxF14Je+\/\/\/78rId+DW88gYf+AS6o+OUk4M0337zoootuu+02dpKYAZQUAiUlJWAG55xzTkNDAz\/lYWBj27Ztjz766F133fXwww+DL\/JIWKnemm3ChAlf\/vKXjz\/++N5SUUzQmzf0X\/DHwbN0d3fjeXfuLOxs9Le\/\/Q1MiIfhAzqCIws+kSYp4go0Gbk4vY6m2iEbPjvxQ1ctxJW40YYNGyZNmpTL5RCDw+eff37GjBk8gYd+DLxdDx76C7h3UsT9998\/Z86cgij3Qnl5+fe\/\/304joV0vTwbD\/0L\/MVxFKIYtm7deuONNx5++OGlpaWFt84sE1A4YKsQggc89NBDjkMO8d4D1EyhClj\/GWoAkbwCqXtgF1zeUdAblAT\/77m6er+Cpqam3l9nzjrrrMIJD\/0cXj+Bh\/4N6Knrrrvusssu4wOduEngUl1WVrZy5crTTjut\/84u25tB6om5+73N\/I4dO+67775\/\/etfL774YkdHRyGWvfeiKpNleeHChUceeSQYw6BBg3jk3gNeY3j2u+66i1dLPB5\/4IEH\/nsnHm0NGQJdXV377bffmjVreP51dXWvvvoqmlshnYf+DI8TeOjHgJLinxJSqdSVV155xRVXFLtMubZCQNM0mAf4MbAT\/JSH\/oVsNrt58+bbbrtt1apVsD2JRKJw4n0YOXLk0Ucfjdc9ffr0QtQuG1k42AvAnzedTs+aNYtvK4qYqqqqe+65p3e1fGIkk8lly5Y9\/fTTPOdoNIr30nu5JA\/9Gh4n8NC\/0Vvjt7a2\/okB3iSP4WqLh8EJzjjjDKiz3r3NQO8cPHzO+JDK37p1K0zarbfe+sILLyDQW1P1fq0AqMCSJUuOOOKIfffdV5YLH8KLfHFvQ7FKn3rqqcWLFzuOw0fbwI8HbwZn4sk+Ct7\/dl588cWvf\/3reCPFV\/DnP\/\/5K1\/5Cj\/rYQDA4wQeBhra2tpAC6D+3t9nADQ2Nn75y19esWJFcU5j8dRu6s\/DZ4HeCgdh1HnvajcM49FHH127du1tt922fv364maYHEjZ+\/IRI0bA5uFVwiEOh8OFWA+9cMstt5x00km6rher7lvf+tb5559fWVmJMGKA3vVfDPPE\/Gwx8vLLL\/\/xj3+cyWQQwxP84he\/QG78rIeBAY8TeBhQKOo4mBMoRJCDV155hZ\/i8VzgNU2bPXv28uXLjzrqKK4fPXxRaG9vB3u78847X3311dWrV2\/btq1wgqFofjh8Pt\/gwYPx1g4++OApU6ZEIpHCCQ\/vA28LTzzxxIknnrh169ZiTTY0NJx77rkrV678iCMAstnsgw8++Ktf\/eqZZ57BIc9HkqTrrruOz2jg2fL25aG\/w+MEHgYUivLMNZRlWTfffPP111\/\/yCOP8HigqByBeDx+wAEHwNecO3eutwTb54YtW7a0tbXdfvvt27dvf\/jhh7u6uhyHLaDHwN9db9VUUlIycuTIY445ZuHChZMmTaJdgBn4BwKk9AzS+8ErEDWzfv364447bs2aNTyeo6am5rDDDgMtHjp0aGNjYyG2F\/BSNmzYcMcdd9x99918z8MicO3ll19+7LHHIswHHiLgvYKBAY8TeNgr8NRTT\/3lL3+BM9rd3V2Iei\/gPM2ePRuqc+nSpbvtxdy7jXiKrze4MX6\/DtljLT333HNNTU0gZ2vXrn3llVfe\/yLenxXM1dSpU0EFpk2bNmzYsEIsA7914cDDf4Ku6z\/84Q9\/\/\/vfgyUXonYBtHjy5Mmoz0AgMHr06K1bt4INoG7B2zZv3lxI1AvLli37v\/\/7v+KEDu9FDDB4nMDDXoSdO3feeuut119\/\/csvv1yI6rXeEcfgwYNnzJgBf\/Twww+vra31se1QOXhj8TRgEdwe7NEqdHR05HK5e++9N5PJ3HPPPc3NzfBWd9M2\/KrdIsvLyxctWjR27Nijjz4ahqekpKRwwsN\/jSeffPKiiy7697\/\/XTj+mAAzO\/\/884866qjCsYeBCI8TeBj44EJetFtwlZ599tm77rrrjjvu6O0J7WaiIpHIqFGjZs+eDXIAJ3XIkCE83sMe8fbbbzuO88QTT6xdu7apqenRRx+1bTudThdO7wLnEIWDXYDtB\/0CCYCfOm\/evN14wG6vz8MnQO86fOSRR6655pqHH364vb2dnfwP0DRtzpw5Z5111pe+9KXeFNnDgITHCTwMfBSFfDe7AhcWPtNNN90ESwYzVojdlax30wA\/mD9\/\/pgxY\/bff\/8RI0YMHTq0cGJvxcaNGzdt2uS67r333rt169aenp5nnnmmd3dLEe+vTA5wrJEjR+67776cB+w2QZQDV+Fyfu1u787Dx0KxJovVuGPHDryym2++ubOz87nnnjNNk8cXMXXq1IqKisMOOwySv9skHe9dDGB4nMCDB6GlpQVq8a677rr\/\/vsRLsQyFG1SEbBejY2N0JgzZsyAYYMLpSgKfKnC6V4oKmKEd9PInwPe37T53YvlYXEfhlwuB18f6VE577zzDmJWr1794osv4locggfwZLuh9116IxwOT5gwAdZlypQpM2fOHDx4cDweL5zz8IXi7bff1nUdgd5SMX78eK9XYC+Exwk87O1AEyiqwq6uLjhPTz\/99J133rllyxa+v8uHo6qqKhKJLFu2LBgMTpo0ia8gC4PXj\/Rpc3Mzf9JMJvPYY4\/hEOG2tjaE+a5Cu\/Gkj4j6+npVVffbb79BgwaBBMDGwO\/cbR2hj05QPHjw8DnA4wQe9nYUm0Bvy+S67ptvvvnyyy\/\/85\/\/XL9+Pd9M4aMAVAAZTps2jX9fgGfM11RG5kOGDKmtrWWpPlfAod+2bRtfEhjFyGazL7zwAp6Ok6Hu7m54\/9zp53sFsYs+CcaNG1daWjpmzJglS5aEQiE8OH5340Y8f9x3j9Xu4QsBfxf4LTI27+3stfA4gQcPpAE\/RPfBiL7yyitr1qx57rnnYE23bt2628fX4rUf3ppqamoaGxt54kAgMGrUqClTpiDAz3IEGWBKwwzFlXpxlWEY8NoBXdfT6TRKxU8VYdv2hg0bNm\/eDEe\/WEIUqbW1FZwAZ3nMfwQv4Yc8C8w8jEdZWdn8+fP9fj94z4IFC1DUyZMnF1cO8ODBQ3+Exwk8ePgYSCaTXV1dq1at2rRp04svvvjGG28g5v2j64uAff1kTUzTNJjb3j3tcOJh6cEMCsf\/Hf6j4eeApa+urkay8vLy\/fffH0XiqzyBr4C4eKs8efAwwOBxAg8ePhJ4S+GmtAh47Tt27Hjqqadc173nnnsQhhO\/26Jve8RHNMkfgvezjWKe7z\/1UTB27NhAIIALq6qqli1bxsOIhPePs2AD7x8h0fsuu9WMBw8e+iM8TuDBw8cA2kvR4u7RCvLFD3g\/\/x133JFMJpFs69atu60su0fwDPkteMz7m2cxDT\/86IDHP3Xq1Lq6usKxIBTnmCG3WCyGs4qi8FN7RPGmKAMvZO8YHvDgwUO\/hscJPHj4zOG6bnH7ZtM0H3\/8cT62nwMGdd26df\/+97+LGzl+RJSXl8OuT58+HfnvZpVLS0vnzZtXVlZWNN6SJNXX1xdOe\/DgwcOe4HECDx48ePDgwQPhPXOFPXjw4MGDBw97LTxO4MGDBw8ePHggeJzAgwcPHjx48EDwOIEHDx48ePDggeBxAg8ePHjw4MEDweMEHjx48ODBgweCxwk8ePDgwYMHDwSPE3jw4MGDBw8eCB4n8ODBgwcPHjwQPE7gwYMHDx48eCB4nMCDBw8ePHjwQPA4gQcPHjx48OCB4HECDx48ePDgwYMgCML\/Bzs9qTm3RMiJAAAAAElFTkSuQmCC\"><\/figure>",
            "label": "Content",
            "refreshOnChange": false,
            "tableView": false,
            "key": "content4",
            "conditional": {
              "show": true,
              "when": "aksiG2Kasus2GantiDindingKayuDenganDindingPasanganBata",
              "eq": "true"
            },
            "type": "content",
            "input": false
          }, {
            "label": "G1 O2 Jumlah dinding, unit:",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_g1O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.g1O2_input;\r\ntotal_g1O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.g1O2_input;\r\ntotal_g1O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.g1O2_input;\r\ntotal_g1O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.g1O2_input;\r\ntotal_g1O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.g1O2_input;\r\ntotal_g1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.g1O2_input;\r\ntotal_g1O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.g1O2_input;\r\ntotal_g1O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.g1O2_input;\r\ntotal_g1O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.g1O2_input;\r\ntotal_g1O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.g1O2_input;\r\ntotal_g1O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.g1O2_input;\r\ntotal_g1O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.g1O2_input;\r\ntotal_g1O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.g1O2_input;\r\ntotal_g1O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.g1O2_input;\r\ntotal_g1O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.g1O2_input;\r\ntotal_g1O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.g1O2_input;\r\ntotal_g1O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.g1O2_input;\r\ntotal_g1O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.g1O2_input;\r\ntotal_g1O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.g1O2_input;\r\ntotal_g1O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.g1O2_input;\r\ntotal_g1O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.g1O2_input;\r\ntotal_g1O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.g1O2_input;\r\ntotal_g1O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.g1O2_input;\r\ntotal_g1O2_price = total_g1O2_bataMerahPcs_price + total_g1O2_batuKaliM3_price + total_g1O2_bautJLPcs_price + total_g1O2_besiPolos8MmX12MPcs_price + total_g1O2_besiUlir10MmX12MPcs_price + total_g1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_g1O2_kawatBetonKg_price + total_g1O2_kayuKelasIi57CmX4MPcs_price + total_g1O2_kayuKelasIi612CmX4MPcs_price + total_g1O2_kepalaTukangOh_price + total_g1O2_kerikilM3_price + total_g1O2_lemKayuKg_price + total_g1O2_mandorOh_price + total_g1O2_minyakBekistingLtr_price + total_g1O2_paku57CmKg_price + total_g1O2_pakuPayungKg_price + total_g1O2_papan325CmPcs_price + total_g1O2_pasirM3_price + total_g1O2_pekerjaOh_price + total_g1O2_semenSak_price + total_g1O2_sengBjlsPcs_price + total_g1O2_tripleks9MmPcs_price + total_g1O2_tukangOh_price;\r\n\r\nif (isNaN(total_g1O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_g1O2_price;\r\n  }",
            "key": "g1O2TotalPrice",
            "conditional": {
              "show": true,
              "when": "aksiG2Kasus2GantiDindingKayuDenganDindingPasanganBata",
              "eq": "true"
            },
            "type": "number",
            "input": true
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_h1O1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.h1O1_input;\r\ntotal_h1O1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.h1O1_input;\r\ntotal_h1O1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.h1O1_input;\r\ntotal_h1O1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.h1O1_input;\r\ntotal_h1O1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.h1O1_input;\r\ntotal_h1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.h1O1_input;\r\ntotal_h1O1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.h1O1_input;\r\ntotal_h1O1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.h1O1_input;\r\ntotal_h1O1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.h1O1_input;\r\ntotal_h1O1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.h1O1_input;\r\ntotal_h1O1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.h1O1_input;\r\ntotal_h1O1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.h1O1_input;\r\ntotal_h1O1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.h1O1_input;\r\ntotal_h1O1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.h1O1_input;\r\ntotal_h1O1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.h1O1_input;\r\ntotal_h1O1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.h1O1_input;\r\ntotal_h1O1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.h1O1_input;\r\ntotal_h1O1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.h1O1_input;\r\ntotal_h1O1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.h1O1_input;\r\ntotal_h1O1_semenSak_price = v1.semenSak_price * v2.semenSak * data.h1O1_input;\r\ntotal_h1O1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.h1O1_input;\r\ntotal_h1O1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.h1O1_input;\r\ntotal_h1O1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.h1O1_input;\r\ntotal_h1O1_price = total_h1O1_bataMerahPcs_price + total_h1O1_batuKaliM3_price + total_h1O1_bautJLPcs_price + total_h1O1_besiPolos8MmX12MPcs_price + total_h1O1_besiUlir10MmX12MPcs_price + total_h1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_h1O1_kawatBetonKg_price + total_h1O1_kayuKelasIi57CmX4MPcs_price + total_h1O1_kayuKelasIi612CmX4MPcs_price + total_h1O1_kepalaTukangOh_price + total_h1O1_kerikilM3_price + total_h1O1_lemKayuKg_price + total_h1O1_mandorOh_price + total_h1O1_minyakBekistingLtr_price + total_h1O1_paku57CmKg_price + total_h1O1_pakuPayungKg_price + total_h1O1_papan325CmPcs_price + total_h1O1_pasirM3_price + total_h1O1_pekerjaOh_price + total_h1O1_semenSak_price + total_h1O1_sengBjlsPcs_price + total_h1O1_tripleks9MmPcs_price + total_h1O1_tukangOh_price;\r\n\r\nif (isNaN(total_h1O1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_h1O1_price;\r\n  }",
            "key": "h1O1TotalPrice",
            "conditional": {
              "show": true,
              "when": "aksiH1Opsi1GantiGentengYangBeratDenganPenutupAtapYangBerbahanRinganSepertiSeng",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }, {
            "label": "Aksi H1, Opsi 2: Jika tetap memakai genteng, Ikatkan genteng ke reng bisa dengan menggunakan kawat dan paku. Pastikan terdapat tiang beton bertulang yang terhubung dari pondasi ke kayu nok dan juga terhubung dengan baik ke ring balok diatas pasangan dinding bata.",
            "shortcut": 0,
            "tableView": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_h1O2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.h1O2_input;\r\ntotal_h1O2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.h1O2_input;\r\ntotal_h1O2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.h1O2_input;\r\ntotal_h1O2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.h1O2_input;\r\ntotal_h1O2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.h1O2_input;\r\ntotal_h1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.h1O2_input;\r\ntotal_h1O2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.h1O2_input;\r\ntotal_h1O2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.h1O2_input;\r\ntotal_h1O2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.h1O2_input;\r\ntotal_h1O2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.h1O2_input;\r\ntotal_h1O2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.h1O2_input;\r\ntotal_h1O2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.h1O2_input;\r\ntotal_h1O2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.h1O2_input;\r\ntotal_h1O2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.h1O2_input;\r\ntotal_h1O2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.h1O2_input;\r\ntotal_h1O2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.h1O2_input;\r\ntotal_h1O2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.h1O2_input;\r\ntotal_h1O2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.h1O2_input;\r\ntotal_h1O2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.h1O2_input;\r\ntotal_h1O2_semenSak_price = v1.semenSak_price * v2.semenSak * data.h1O2_input;\r\ntotal_h1O2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.h1O2_input;\r\ntotal_h1O2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.h1O2_input;\r\ntotal_h1O2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.h1O2_input;\r\ntotal_h1O2_price = total_h1O2_bataMerahPcs_price + total_h1O2_batuKaliM3_price + total_h1O2_bautJLPcs_price + total_h1O2_besiPolos8MmX12MPcs_price + total_h1O2_besiUlir10MmX12MPcs_price + total_h1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_h1O2_kawatBetonKg_price + total_h1O2_kayuKelasIi57CmX4MPcs_price + total_h1O2_kayuKelasIi612CmX4MPcs_price + total_h1O2_kepalaTukangOh_price + total_h1O2_kerikilM3_price + total_h1O2_lemKayuKg_price + total_h1O2_mandorOh_price + total_h1O2_minyakBekistingLtr_price + total_h1O2_paku57CmKg_price + total_h1O2_pakuPayungKg_price + total_h1O2_papan325CmPcs_price + total_h1O2_pasirM3_price + total_h1O2_pekerjaOh_price + total_h1O2_semenSak_price + total_h1O2_sengBjlsPcs_price + total_h1O2_tripleks9MmPcs_price + total_h1O2_tukangOh_price;\r\n\r\nif (isNaN(total_h1O2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_h1O2_price;\r\n  }",
            "key": "h1O1TotalPrice1",
            "conditional": {
              "show": true,
              "when": "aksiH1Opsi2JikaTetapMemakaiGentengIkatkanGentengKeRengBisaDenganMenggunakanKawatDanPakuPastikanTerdapatTiangBetonBertulangYangTerhubungDariPondasiKeKayuNokDanJugaTerhubungDenganBaikKeRingBalokDiatasPasanganDindingBata",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QH2: Tidak ada ikatan antara struktur atap dengan ring balok",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_h2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.h2_input;\r\ntotal_h2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.h2_input;\r\ntotal_h2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.h2_input;\r\ntotal_h2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.h2_input;\r\ntotal_h2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.h2_input;\r\ntotal_h2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.h2_input;\r\ntotal_h2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.h2_input;\r\ntotal_h2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.h2_input;\r\ntotal_h2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.h2_input;\r\ntotal_h2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.h2_input;\r\ntotal_h2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.h2_input;\r\ntotal_h2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.h2_input;\r\ntotal_h2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.h2_input;\r\ntotal_h2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.h2_input;\r\ntotal_h2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.h2_input;\r\ntotal_h2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.h2_input;\r\ntotal_h2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.h2_input;\r\ntotal_h2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.h2_input;\r\ntotal_h2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.h2_input;\r\ntotal_h2_semenSak_price = v1.semenSak_price * v2.semenSak * data.h2_input;\r\ntotal_h2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.h2_input;\r\ntotal_h2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.h2_input;\r\ntotal_h2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.h2_input;\r\ntotal_h2_price = total_h2_bataMerahPcs_price + total_h2_batuKaliM3_price + total_h2_bautJLPcs_price + total_h2_besiPolos8MmX12MPcs_price + total_h2_besiUlir10MmX12MPcs_price + total_h2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_h2_kawatBetonKg_price + total_h2_kayuKelasIi57CmX4MPcs_price + total_h2_kayuKelasIi612CmX4MPcs_price + total_h2_kepalaTukangOh_price + total_h2_kerikilM3_price + total_h2_lemKayuKg_price + total_h2_mandorOh_price + total_h2_minyakBekistingLtr_price + total_h2_paku57CmKg_price + total_h2_pakuPayungKg_price + total_h2_papan325CmPcs_price + total_h2_pasirM3_price + total_h2_pekerjaOh_price + total_h2_semenSak_price + total_h2_sengBjlsPcs_price + total_h2_tripleks9MmPcs_price + total_h2_tukangOh_price;\r\n\r\nif (isNaN(total_h2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_h2_price;\r\n  }",
            "key": "h1O1TotalPrice2",
            "conditional": {
              "show": true,
              "when": "QH2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QH3: Tidak ada ikatan angin",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "calculateValue": "let v1 = data;\r\nlet v2 =data;\r\ntotal_h3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.h3_input;\r\ntotal_h3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.h3_input;\r\ntotal_h3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.h3_input;\r\ntotal_h3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.h3_input;\r\ntotal_h3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.h3_input;\r\ntotal_h3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.h3_input;\r\ntotal_h3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.h3_input;\r\ntotal_h3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.h3_input;\r\ntotal_h3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.h3_input;\r\ntotal_h3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.h3_input;\r\ntotal_h3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.h3_input;\r\ntotal_h3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.h3_input;\r\ntotal_h3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.h3_input;\r\ntotal_h3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.h3_input;\r\ntotal_h3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.h3_input;\r\ntotal_h3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.h3_input;\r\ntotal_h3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.h3_input;\r\ntotal_h3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.h3_input;\r\ntotal_h3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.h3_input;\r\ntotal_h3_semenSak_price = v1.semenSak_price * v2.semenSak * data.h3_input;\r\ntotal_h3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.h3_input;\r\ntotal_h3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.h3_input;\r\ntotal_h3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.h3_input;\r\ntotal_h3_price = total_h3_bataMerahPcs_price + total_h3_batuKaliM3_price + total_h3_bautJLPcs_price + total_h3_besiPolos8MmX12MPcs_price + total_h3_besiUlir10MmX12MPcs_price + total_h3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_h3_kawatBetonKg_price + total_h3_kayuKelasIi57CmX4MPcs_price + total_h3_kayuKelasIi612CmX4MPcs_price + total_h3_kepalaTukangOh_price + total_h3_kerikilM3_price + total_h3_lemKayuKg_price + total_h3_mandorOh_price + total_h3_minyakBekistingLtr_price + total_h3_paku57CmKg_price + total_h3_pakuPayungKg_price + total_h3_papan325CmPcs_price + total_h3_pasirM3_price + total_h3_pekerjaOh_price + total_h3_semenSak_price + total_h3_sengBjlsPcs_price + total_h3_tripleks9MmPcs_price + total_h3_tukangOh_price;\r\n\r\nif (isNaN(total_h3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_h3_price;\r\n  }",
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\n\r\ntotal_i1_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.i1_input;\r\ntotal_i1_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.i1_input;\r\ntotal_i1_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.i1_input;\r\ntotal_i1_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.i1_input;\r\ntotal_i1_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.i1_input;\r\ntotal_i1_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.i1_input;\r\ntotal_i1_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.i1_input;\r\ntotal_i1_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.i1_input;\r\ntotal_i1_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.i1_input;\r\ntotal_i1_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.i1_input;\r\ntotal_i1_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.i1_input;\r\ntotal_i1_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.i1_input;\r\ntotal_i1_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.i1_input;\r\ntotal_i1_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.i1_input;\r\ntotal_i1_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.i1_input;\r\ntotal_i1_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.i1_input;\r\ntotal_i1_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.i1_input;\r\ntotal_i1_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.i1_input;\r\ntotal_i1_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.i1_input;\r\ntotal_i1_semenSak_price = v1.semenSak_price * v2.semenSak * data.i1_input;\r\ntotal_i1_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.i1_input;\r\ntotal_i1_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.i1_input;\r\ntotal_i1_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.i1_input;\r\ntotal_i1_price = total_i1_bataMerahPcs_price + total_i1_batuKaliM3_price + total_i1_bautJLPcs_price + total_i1_besiPolos8MmX12MPcs_price + total_i1_besiUlir10MmX12MPcs_price + total_i1_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_i1_kawatBetonKg_price + total_i1_kayuKelasIi57CmX4MPcs_price + total_i1_kayuKelasIi612CmX4MPcs_price + total_i1_kepalaTukangOh_price + total_i1_kerikilM3_price + total_i1_lemKayuKg_price + total_i1_mandorOh_price + total_i1_minyakBekistingLtr_price + total_i1_paku57CmKg_price + total_i1_pakuPayungKg_price + total_i1_papan325CmPcs_price + total_i1_pasirM3_price + total_i1_pekerjaOh_price + total_i1_semenSak_price + total_i1_sengBjlsPcs_price + total_i1_tripleks9MmPcs_price + total_i1_tukangOh_price;\r\n\r\nif (isNaN(total_i1_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_i1_price;\r\n  }",
            "key": "i1TotalPrice",
            "conditional": {
              "show": true,
              "when": "QI1",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QI2: Ring balok di beranda posisinya lebih tinggi dari 3m",
          "shortcut": 0,
          "tableView": false,
          "defaultValue": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\n\r\ntotal_i2_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.i2_input;\r\ntotal_i2_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.i2_input;\r\ntotal_i2_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.i2_input;\r\ntotal_i2_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.i2_input;\r\ntotal_i2_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.i2_input;\r\ntotal_i2_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.i2_input;\r\ntotal_i2_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.i2_input;\r\ntotal_i2_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.i2_input;\r\ntotal_i2_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.i2_input;\r\ntotal_i2_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.i2_input;\r\ntotal_i2_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.i2_input;\r\ntotal_i2_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.i2_input;\r\ntotal_i2_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.i2_input;\r\ntotal_i2_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.i2_input;\r\ntotal_i2_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.i2_input;\r\ntotal_i2_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.i2_input;\r\ntotal_i2_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.i2_input;\r\ntotal_i2_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.i2_input;\r\ntotal_i2_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.i2_input;\r\ntotal_i2_semenSak_price = v1.semenSak_price * v2.semenSak * data.i2_input;\r\ntotal_i2_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.i2_input;\r\ntotal_i2_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.i2_input;\r\ntotal_i2_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.i2_input;\r\ntotal_i2_price = total_i2_bataMerahPcs_price + total_i2_batuKaliM3_price + total_i2_bautJLPcs_price + total_i2_besiPolos8MmX12MPcs_price + total_i2_besiUlir10MmX12MPcs_price + total_i2_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_i2_kawatBetonKg_price + total_i2_kayuKelasIi57CmX4MPcs_price + total_i2_kayuKelasIi612CmX4MPcs_price + total_i2_kepalaTukangOh_price + total_i2_kerikilM3_price + total_i2_lemKayuKg_price + total_i2_mandorOh_price + total_i2_minyakBekistingLtr_price + total_i2_paku57CmKg_price + total_i2_pakuPayungKg_price + total_i2_papan325CmPcs_price + total_i2_pasirM3_price + total_i2_pekerjaOh_price + total_i2_semenSak_price + total_i2_sengBjlsPcs_price + total_i2_tripleks9MmPcs_price + total_i2_tukangOh_price;\r\n\r\nif (isNaN(total_i2_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_i2_price;\r\n  }",
            "key": "i2TotalPrice",
            "conditional": {
              "show": true,
              "when": "QI2",
              "eq": "true"
            },
            "type": "number",
            "input": true
          }]
        }, {
          "label": "QI3: Jarak antara beranda dengan bagian depan rumah lebih dari 2m",
          "shortcut": 0,
          "tableView": false,
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
            "defaultValue": 0,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "clearOnHide": false,
            "calculateValue": "let v1 = data;\r\nlet v2 = data;\r\ntotal_i3_bataMerahPcs_price = v1.bataMerahPcs_price * v2.bataMerahPcs * data.i3_input;\r\ntotal_i3_batuKaliM3_price = v1.batuKaliM3_price * v2.batuKaliM3 * data.i3_input;\r\ntotal_i3_bautJLPcs_price = v1.bautJLPcs_price * v2.bautJLPcs * data.i3_input;\r\ntotal_i3_besiPolos8MmX12MPcs_price = v1.besiPolos8MmX12MPcs_price * v2.besiPolos8MmX12MPcs * data.i3_input;\r\ntotal_i3_besiUlir10MmX12MPcs_price = v1.besiUlir10MmX12MPcs_price * v2.besiUlir10MmX12MPcs * data.i3_input;\r\ntotal_i3_kawatAnyam1MmX1InSpaciX12MX30MBal_price = v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price * v2.kawatAnyam1MmX1InSpaciX12MX30MBal * data.i3_input;\r\ntotal_i3_kawatBetonKg_price = v1.kawatBetonKg_price * v2.kawatBetonKg * data.i3_input;\r\ntotal_i3_kayuKelasIi57CmX4MPcs_price = v1.kayuKelasIi57CmX4MPcs_price * v2.kayuKelasIi57CmX4MPcs * data.i3_input;\r\ntotal_i3_kayuKelasIi612CmX4MPcs_price = v1.kayuKelasIi612CmX4MPcs_price * v2.kayuKelasIi612CmX4MPcs * data.i3_input;\r\ntotal_i3_kepalaTukangOh_price = v1.kepalaTukangOh_price * v2.kepalaTukangOh * data.i3_input;\r\ntotal_i3_kerikilM3_price = v1.kerikilM3_price * v2.kerikilM3 * data.i3_input;\r\ntotal_i3_lemKayuKg_price = v1.lemKayuKg_price * v2.lemKayuKg * data.i3_input;\r\ntotal_i3_mandorOh_price = v1.mandorOh_price * v2.mandorOh * data.i3_input;\r\ntotal_i3_minyakBekistingLtr_price = v1.minyakBekistingLtr_price * v2.minyakBekistingLtr * data.i3_input;\r\ntotal_i3_paku57CmKg_price = v1.paku57CmKg_price * v2.paku57CmKg * data.i3_input;\r\ntotal_i3_pakuPayungKg_price = v1.pakuPayungKg_price * v2.pakuPayungKg * data.i3_input;\r\ntotal_i3_papan325CmPcs_price = v1.papan325CmPcs_price * v2.papan325CmPcs * data.i3_input;\r\ntotal_i3_pasirM3_price = v1.pasirM3_price * v2.pasirM3 * data.i3_input;\r\ntotal_i3_pekerjaOh_price = v1.pekerjaOh_price * v2.pekerjaOh * data.i3_input;\r\ntotal_i3_semenSak_price = v1.semenSak_price * v2.semenSak * data.i3_input;\r\ntotal_i3_sengBjlsPcs_price = v1.sengBjlsPcs_price * v2.sengBjlsPcs * data.i3_input;\r\ntotal_i3_tripleks9MmPcs_price = v1.tripleks9MmPcs_price * v2.tripleks9MmPcs * data.i3_input;\r\ntotal_i3_tukangOh_price = v1.tukangOh_price * v2.tukangOh * data.i3_input;\r\ntotal_i3_price = total_i3_bataMerahPcs_price + total_i3_batuKaliM3_price + total_i3_bautJLPcs_price + total_i3_besiPolos8MmX12MPcs_price + total_i3_besiUlir10MmX12MPcs_price + total_i3_kawatAnyam1MmX1InSpaciX12MX30MBal_price + total_i3_kawatBetonKg_price + total_i3_kayuKelasIi57CmX4MPcs_price + total_i3_kayuKelasIi612CmX4MPcs_price + total_i3_kepalaTukangOh_price + total_i3_kerikilM3_price + total_i3_lemKayuKg_price + total_i3_mandorOh_price + total_i3_minyakBekistingLtr_price + total_i3_paku57CmKg_price + total_i3_pakuPayungKg_price + total_i3_papan325CmPcs_price + total_i3_pasirM3_price + total_i3_pekerjaOh_price + total_i3_semenSak_price + total_i3_sengBjlsPcs_price + total_i3_tripleks9MmPcs_price + total_i3_tukangOh_price;\r\n\r\nif (isNaN(total_i3_price)) {\r\n  value = 0;\r\n  } else {\r\n    value = total_i3_price;\r\n  }",
            "key": "i3TotalPrice",
            "conditional": {
              "show": true,
              "when": "QI3",
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
        "title": "Summary Page",
        "label": "Page 12",
        "type": "panel",
        "key": "page12",
        "components": [{
          "label": "Wrap Up",
          "autoExpand": false,
          "tableView": true,
          "clearOnHide": false,
          "calculateValue": "let v1 = data;\r\n\r\nlet totalbataMerahPcsARR = [total_a1_bataMerahPcs_price,total_a2O1_bataMerahPcs_price,total_a2O2_bataMerahPcs_price,total_a3_bataMerahPcs_price,total_a4_bataMerahPcs_price,total_a5_bataMerahPcs_price,total_a6C1_bataMerahPcs_price,total_a6C2_bataMerahPcs_price,total_b1_bataMerahPcs_price,total_b2_bataMerahPcs_price,total_b3_bataMerahPcs_price,total_c1O1_bataMerahPcs_price,total_c1O2_bataMerahPcs_price,total_c1O3_bataMerahPcs_price,total_c2O1_bataMerahPcs_price,total_c2O2_bataMerahPcs_price,total_c2O3_bataMerahPcs_price,total_c3O1_bataMerahPcs_price,total_c3O2_bataMerahPcs_price,total_c3O3_bataMerahPcs_price,total_c4O1_bataMerahPcs_price,total_c4O2_bataMerahPcs_price,total_c4O3_bataMerahPcs_price,total_c5O1_bataMerahPcs_price,total_c5O2_bataMerahPcs_price,total_c6_bataMerahPcs_price,total_c7O1_bataMerahPcs_price,total_c7O2_bataMerahPcs_price,total_c8_bataMerahPcs_price,total_d1_bataMerahPcs_price,total_d2O1_bataMerahPcs_price,total_d2O2_bataMerahPcs_price,total_e1_bataMerahPcs_price,total_f1_bataMerahPcs_price,total_g1O1_bataMerahPcs_price,total_g1O2_bataMerahPcs_price,total_h1O1_bataMerahPcs_price,total_h1O2_bataMerahPcs_price,total_h2_bataMerahPcs_price,total_h3_bataMerahPcs_price,total_i1_bataMerahPcs_price,total_i2_bataMerahPcs_price,total_i3_bataMerahPcs_price];\r\nlet totalbatuKaliM3ARR = [total_a1_batuKaliM3_price,total_a2O1_batuKaliM3_price,total_a2O2_batuKaliM3_price,total_a3_batuKaliM3_price,total_a4_batuKaliM3_price,total_a5_batuKaliM3_price,total_a6C1_batuKaliM3_price,total_a6C2_batuKaliM3_price,total_b1_batuKaliM3_price,total_b2_batuKaliM3_price,total_b3_batuKaliM3_price,total_c1O1_batuKaliM3_price,total_c1O2_batuKaliM3_price,total_c1O3_batuKaliM3_price,total_c2O1_batuKaliM3_price,total_c2O2_batuKaliM3_price,total_c2O3_batuKaliM3_price,total_c3O1_batuKaliM3_price,total_c3O2_batuKaliM3_price,total_c3O3_batuKaliM3_price,total_c4O1_batuKaliM3_price,total_c4O2_batuKaliM3_price,total_c4O3_batuKaliM3_price,total_c5O1_batuKaliM3_price,total_c5O2_batuKaliM3_price,total_c6_batuKaliM3_price,total_c7O1_batuKaliM3_price,total_c7O2_batuKaliM3_price,total_c8_batuKaliM3_price,total_d1_batuKaliM3_price,total_d2O1_batuKaliM3_price,total_d2O2_batuKaliM3_price,total_e1_batuKaliM3_price,total_f1_batuKaliM3_price,total_g1O1_batuKaliM3_price,total_g1O2_batuKaliM3_price,total_h1O1_batuKaliM3_price,total_h1O2_batuKaliM3_price,total_h2_batuKaliM3_price,total_h3_batuKaliM3_price,total_i1_batuKaliM3_price,total_i2_batuKaliM3_price,total_i3_batuKaliM3_price];\r\nlet totalbautJLPcsARR = [total_a1_bautJLPcs_price,total_a2O1_bautJLPcs_price,total_a2O2_bautJLPcs_price,total_a3_bautJLPcs_price,total_a4_bautJLPcs_price,total_a5_bautJLPcs_price,total_a6C1_bautJLPcs_price,total_a6C2_bautJLPcs_price,total_b1_bautJLPcs_price,total_b2_bautJLPcs_price,total_b3_bautJLPcs_price,total_c1O1_bautJLPcs_price,total_c1O2_bautJLPcs_price,total_c1O3_bautJLPcs_price,total_c2O1_bautJLPcs_price,total_c2O2_bautJLPcs_price,total_c2O3_bautJLPcs_price,total_c3O1_bautJLPcs_price,total_c3O2_bautJLPcs_price,total_c3O3_bautJLPcs_price,total_c4O1_bautJLPcs_price,total_c4O2_bautJLPcs_price,total_c4O3_bautJLPcs_price,total_c5O1_bautJLPcs_price,total_c5O2_bautJLPcs_price,total_c6_bautJLPcs_price,total_c7O1_bautJLPcs_price,total_c7O2_bautJLPcs_price,total_c8_bautJLPcs_price,total_d1_bautJLPcs_price,total_d2O1_bautJLPcs_price,total_d2O2_bautJLPcs_price,total_e1_bautJLPcs_price,total_f1_bautJLPcs_price,total_g1O1_bautJLPcs_price,total_g1O2_bautJLPcs_price,total_h1O1_bautJLPcs_price,total_h1O2_bautJLPcs_price,total_h2_bautJLPcs_price,total_h3_bautJLPcs_price,total_i1_bautJLPcs_price,total_i2_bautJLPcs_price,total_i3_bautJLPcs_price];\r\nlet totalbesiPolos8MmX12MPcsARR = [total_a1_besiPolos8MmX12MPcs_price,total_a2O1_besiPolos8MmX12MPcs_price,total_a2O2_besiPolos8MmX12MPcs_price,total_a3_besiPolos8MmX12MPcs_price,total_a4_besiPolos8MmX12MPcs_price,total_a5_besiPolos8MmX12MPcs_price,total_a6C1_besiPolos8MmX12MPcs_price,total_a6C2_besiPolos8MmX12MPcs_price,total_b1_besiPolos8MmX12MPcs_price,total_b2_besiPolos8MmX12MPcs_price,total_b3_besiPolos8MmX12MPcs_price,total_c1O1_besiPolos8MmX12MPcs_price,total_c1O2_besiPolos8MmX12MPcs_price,total_c1O3_besiPolos8MmX12MPcs_price,total_c2O1_besiPolos8MmX12MPcs_price,total_c2O2_besiPolos8MmX12MPcs_price,total_c2O3_besiPolos8MmX12MPcs_price,total_c3O1_besiPolos8MmX12MPcs_price,total_c3O2_besiPolos8MmX12MPcs_price,total_c3O3_besiPolos8MmX12MPcs_price,total_c4O1_besiPolos8MmX12MPcs_price,total_c4O2_besiPolos8MmX12MPcs_price,total_c4O3_besiPolos8MmX12MPcs_price,total_c5O1_besiPolos8MmX12MPcs_price,total_c5O2_besiPolos8MmX12MPcs_price,total_c6_besiPolos8MmX12MPcs_price,total_c7O1_besiPolos8MmX12MPcs_price,total_c7O2_besiPolos8MmX12MPcs_price,total_c8_besiPolos8MmX12MPcs_price,total_d1_besiPolos8MmX12MPcs_price,total_d2O1_besiPolos8MmX12MPcs_price,total_d2O2_besiPolos8MmX12MPcs_price,total_e1_besiPolos8MmX12MPcs_price,total_f1_besiPolos8MmX12MPcs_price,total_g1O1_besiPolos8MmX12MPcs_price,total_g1O2_besiPolos8MmX12MPcs_price,total_h1O1_besiPolos8MmX12MPcs_price,total_h1O2_besiPolos8MmX12MPcs_price,total_h2_besiPolos8MmX12MPcs_price,total_h3_besiPolos8MmX12MPcs_price,total_i1_besiPolos8MmX12MPcs_price,total_i2_besiPolos8MmX12MPcs_price,total_i3_besiPolos8MmX12MPcs_price];\r\nlet totalbesiUlir10MmX12MPcsARR = [total_a1_besiUlir10MmX12MPcs_price,total_a2O1_besiUlir10MmX12MPcs_price,total_a2O2_besiUlir10MmX12MPcs_price,total_a3_besiUlir10MmX12MPcs_price,total_a4_besiUlir10MmX12MPcs_price,total_a5_besiUlir10MmX12MPcs_price,total_a6C1_besiUlir10MmX12MPcs_price,total_a6C2_besiUlir10MmX12MPcs_price,total_b1_besiUlir10MmX12MPcs_price,total_b2_besiUlir10MmX12MPcs_price,total_b3_besiUlir10MmX12MPcs_price,total_c1O1_besiUlir10MmX12MPcs_price,total_c1O2_besiUlir10MmX12MPcs_price,total_c1O3_besiUlir10MmX12MPcs_price,total_c2O1_besiUlir10MmX12MPcs_price,total_c2O2_besiUlir10MmX12MPcs_price,total_c2O3_besiUlir10MmX12MPcs_price,total_c3O1_besiUlir10MmX12MPcs_price,total_c3O2_besiUlir10MmX12MPcs_price,total_c3O3_besiUlir10MmX12MPcs_price,total_c4O1_besiUlir10MmX12MPcs_price,total_c4O2_besiUlir10MmX12MPcs_price,total_c4O3_besiUlir10MmX12MPcs_price,total_c5O1_besiUlir10MmX12MPcs_price,total_c5O2_besiUlir10MmX12MPcs_price,total_c6_besiUlir10MmX12MPcs_price,total_c7O1_besiUlir10MmX12MPcs_price,total_c7O2_besiUlir10MmX12MPcs_price,total_c8_besiUlir10MmX12MPcs_price,total_d1_besiUlir10MmX12MPcs_price,total_d2O1_besiUlir10MmX12MPcs_price,total_d2O2_besiUlir10MmX12MPcs_price,total_e1_besiUlir10MmX12MPcs_price,total_f1_besiUlir10MmX12MPcs_price,total_g1O1_besiUlir10MmX12MPcs_price,total_g1O2_besiUlir10MmX12MPcs_price,total_h1O1_besiUlir10MmX12MPcs_price,total_h1O2_besiUlir10MmX12MPcs_price,total_h2_besiUlir10MmX12MPcs_price,total_h3_besiUlir10MmX12MPcs_price,total_i1_besiUlir10MmX12MPcs_price,total_i2_besiUlir10MmX12MPcs_price,total_i3_besiUlir10MmX12MPcs_price];\r\nlet totalkawatAnyam1MmX1InSpaciX12MX30MBalARR = [total_a1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_a2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_a2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_a3_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_a4_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_a5_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_a6C1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_a6C2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_b1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_b2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_b3_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c1O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c2O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c3O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c3O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c3O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c4O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c4O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c4O3_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c5O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c5O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c6_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c7O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c7O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_c8_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_d1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_d2O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_d2O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_e1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_f1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_g1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_g1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_h1O1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_h1O2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_h2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_h3_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_i1_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_i2_kawatAnyam1MmX1InSpaciX12MX30MBal_price,total_i3_kawatAnyam1MmX1InSpaciX12MX30MBal_price];\r\nlet totalkawatBetonKgARR = [total_a1_kawatBetonKg_price,total_a2O1_kawatBetonKg_price,total_a2O2_kawatBetonKg_price,total_a3_kawatBetonKg_price,total_a4_kawatBetonKg_price,total_a5_kawatBetonKg_price,total_a6C1_kawatBetonKg_price,total_a6C2_kawatBetonKg_price,total_b1_kawatBetonKg_price,total_b2_kawatBetonKg_price,total_b3_kawatBetonKg_price,total_c1O1_kawatBetonKg_price,total_c1O2_kawatBetonKg_price,total_c1O3_kawatBetonKg_price,total_c2O1_kawatBetonKg_price,total_c2O2_kawatBetonKg_price,total_c2O3_kawatBetonKg_price,total_c3O1_kawatBetonKg_price,total_c3O2_kawatBetonKg_price,total_c3O3_kawatBetonKg_price,total_c4O1_kawatBetonKg_price,total_c4O2_kawatBetonKg_price,total_c4O3_kawatBetonKg_price,total_c5O1_kawatBetonKg_price,total_c5O2_kawatBetonKg_price,total_c6_kawatBetonKg_price,total_c7O1_kawatBetonKg_price,total_c7O2_kawatBetonKg_price,total_c8_kawatBetonKg_price,total_d1_kawatBetonKg_price,total_d2O1_kawatBetonKg_price,total_d2O2_kawatBetonKg_price,total_e1_kawatBetonKg_price,total_f1_kawatBetonKg_price,total_g1O1_kawatBetonKg_price,total_g1O2_kawatBetonKg_price,total_h1O1_kawatBetonKg_price,total_h1O2_kawatBetonKg_price,total_h2_kawatBetonKg_price,total_h3_kawatBetonKg_price,total_i1_kawatBetonKg_price,total_i2_kawatBetonKg_price,total_i3_kawatBetonKg_price];\r\nlet totalkayuKelasIi57CmX4MPcsARR = [total_a1_kayuKelasIi57CmX4MPcs_price,total_a2O1_kayuKelasIi57CmX4MPcs_price,total_a2O2_kayuKelasIi57CmX4MPcs_price,total_a3_kayuKelasIi57CmX4MPcs_price,total_a4_kayuKelasIi57CmX4MPcs_price,total_a5_kayuKelasIi57CmX4MPcs_price,total_a6C1_kayuKelasIi57CmX4MPcs_price,total_a6C2_kayuKelasIi57CmX4MPcs_price,total_b1_kayuKelasIi57CmX4MPcs_price,total_b2_kayuKelasIi57CmX4MPcs_price,total_b3_kayuKelasIi57CmX4MPcs_price,total_c1O1_kayuKelasIi57CmX4MPcs_price,total_c1O2_kayuKelasIi57CmX4MPcs_price,total_c1O3_kayuKelasIi57CmX4MPcs_price,total_c2O1_kayuKelasIi57CmX4MPcs_price,total_c2O2_kayuKelasIi57CmX4MPcs_price,total_c2O3_kayuKelasIi57CmX4MPcs_price,total_c3O1_kayuKelasIi57CmX4MPcs_price,total_c3O2_kayuKelasIi57CmX4MPcs_price,total_c3O3_kayuKelasIi57CmX4MPcs_price,total_c4O1_kayuKelasIi57CmX4MPcs_price,total_c4O2_kayuKelasIi57CmX4MPcs_price,total_c4O3_kayuKelasIi57CmX4MPcs_price,total_c5O1_kayuKelasIi57CmX4MPcs_price,total_c5O2_kayuKelasIi57CmX4MPcs_price,total_c6_kayuKelasIi57CmX4MPcs_price,total_c7O1_kayuKelasIi57CmX4MPcs_price,total_c7O2_kayuKelasIi57CmX4MPcs_price,total_c8_kayuKelasIi57CmX4MPcs_price,total_d1_kayuKelasIi57CmX4MPcs_price,total_d2O1_kayuKelasIi57CmX4MPcs_price,total_d2O2_kayuKelasIi57CmX4MPcs_price,total_e1_kayuKelasIi57CmX4MPcs_price,total_f1_kayuKelasIi57CmX4MPcs_price,total_g1O1_kayuKelasIi57CmX4MPcs_price,total_g1O2_kayuKelasIi57CmX4MPcs_price,total_h1O1_kayuKelasIi57CmX4MPcs_price,total_h1O2_kayuKelasIi57CmX4MPcs_price,total_h2_kayuKelasIi57CmX4MPcs_price,total_h3_kayuKelasIi57CmX4MPcs_price,total_i1_kayuKelasIi57CmX4MPcs_price,total_i2_kayuKelasIi57CmX4MPcs_price,total_i3_kayuKelasIi57CmX4MPcs_price];\r\nlet totalkayuKelasIi612CmX4MPcsARR = [total_a1_kayuKelasIi612CmX4MPcs_price,total_a2O1_kayuKelasIi612CmX4MPcs_price,total_a2O2_kayuKelasIi612CmX4MPcs_price,total_a3_kayuKelasIi612CmX4MPcs_price,total_a4_kayuKelasIi612CmX4MPcs_price,total_a5_kayuKelasIi612CmX4MPcs_price,total_a6C1_kayuKelasIi612CmX4MPcs_price,total_a6C2_kayuKelasIi612CmX4MPcs_price,total_b1_kayuKelasIi612CmX4MPcs_price,total_b2_kayuKelasIi612CmX4MPcs_price,total_b3_kayuKelasIi612CmX4MPcs_price,total_c1O1_kayuKelasIi612CmX4MPcs_price,total_c1O2_kayuKelasIi612CmX4MPcs_price,total_c1O3_kayuKelasIi612CmX4MPcs_price,total_c2O1_kayuKelasIi612CmX4MPcs_price,total_c2O2_kayuKelasIi612CmX4MPcs_price,total_c2O3_kayuKelasIi612CmX4MPcs_price,total_c3O1_kayuKelasIi612CmX4MPcs_price,total_c3O2_kayuKelasIi612CmX4MPcs_price,total_c3O3_kayuKelasIi612CmX4MPcs_price,total_c4O1_kayuKelasIi612CmX4MPcs_price,total_c4O2_kayuKelasIi612CmX4MPcs_price,total_c4O3_kayuKelasIi612CmX4MPcs_price,total_c5O1_kayuKelasIi612CmX4MPcs_price,total_c5O2_kayuKelasIi612CmX4MPcs_price,total_c6_kayuKelasIi612CmX4MPcs_price,total_c7O1_kayuKelasIi612CmX4MPcs_price,total_c7O2_kayuKelasIi612CmX4MPcs_price,total_c8_kayuKelasIi612CmX4MPcs_price,total_d1_kayuKelasIi612CmX4MPcs_price,total_d2O1_kayuKelasIi612CmX4MPcs_price,total_d2O2_kayuKelasIi612CmX4MPcs_price,total_e1_kayuKelasIi612CmX4MPcs_price,total_f1_kayuKelasIi612CmX4MPcs_price,total_g1O1_kayuKelasIi612CmX4MPcs_price,total_g1O2_kayuKelasIi612CmX4MPcs_price,total_h1O1_kayuKelasIi612CmX4MPcs_price,total_h1O2_kayuKelasIi612CmX4MPcs_price,total_h2_kayuKelasIi612CmX4MPcs_price,total_h3_kayuKelasIi612CmX4MPcs_price,total_i1_kayuKelasIi612CmX4MPcs_price,total_i2_kayuKelasIi612CmX4MPcs_price,total_i3_kayuKelasIi612CmX4MPcs_price];\r\nlet totalkepalaTukangOhARR = [total_a1_kepalaTukangOh_price,total_a2O1_kepalaTukangOh_price,total_a2O2_kepalaTukangOh_price,total_a3_kepalaTukangOh_price,total_a4_kepalaTukangOh_price,total_a5_kepalaTukangOh_price,total_a6C1_kepalaTukangOh_price,total_a6C2_kepalaTukangOh_price,total_b1_kepalaTukangOh_price,total_b2_kepalaTukangOh_price,total_b3_kepalaTukangOh_price,total_c1O1_kepalaTukangOh_price,total_c1O2_kepalaTukangOh_price,total_c1O3_kepalaTukangOh_price,total_c2O1_kepalaTukangOh_price,total_c2O2_kepalaTukangOh_price,total_c2O3_kepalaTukangOh_price,total_c3O1_kepalaTukangOh_price,total_c3O2_kepalaTukangOh_price,total_c3O3_kepalaTukangOh_price,total_c4O1_kepalaTukangOh_price,total_c4O2_kepalaTukangOh_price,total_c4O3_kepalaTukangOh_price,total_c5O1_kepalaTukangOh_price,total_c5O2_kepalaTukangOh_price,total_c6_kepalaTukangOh_price,total_c7O1_kepalaTukangOh_price,total_c7O2_kepalaTukangOh_price,total_c8_kepalaTukangOh_price,total_d1_kepalaTukangOh_price,total_d2O1_kepalaTukangOh_price,total_d2O2_kepalaTukangOh_price,total_e1_kepalaTukangOh_price,total_f1_kepalaTukangOh_price,total_g1O1_kepalaTukangOh_price,total_g1O2_kepalaTukangOh_price,total_h1O1_kepalaTukangOh_price,total_h1O2_kepalaTukangOh_price,total_h2_kepalaTukangOh_price,total_h3_kepalaTukangOh_price,total_i1_kepalaTukangOh_price,total_i2_kepalaTukangOh_price,total_i3_kepalaTukangOh_price];\r\nlet totalkerikilM3ARR = [total_a1_kerikilM3_price,total_a2O1_kerikilM3_price,total_a2O2_kerikilM3_price,total_a3_kerikilM3_price,total_a4_kerikilM3_price,total_a5_kerikilM3_price,total_a6C1_kerikilM3_price,total_a6C2_kerikilM3_price,total_b1_kerikilM3_price,total_b2_kerikilM3_price,total_b3_kerikilM3_price,total_c1O1_kerikilM3_price,total_c1O2_kerikilM3_price,total_c1O3_kerikilM3_price,total_c2O1_kerikilM3_price,total_c2O2_kerikilM3_price,total_c2O3_kerikilM3_price,total_c3O1_kerikilM3_price,total_c3O2_kerikilM3_price,total_c3O3_kerikilM3_price,total_c4O1_kerikilM3_price,total_c4O2_kerikilM3_price,total_c4O3_kerikilM3_price,total_c5O1_kerikilM3_price,total_c5O2_kerikilM3_price,total_c6_kerikilM3_price,total_c7O1_kerikilM3_price,total_c7O2_kerikilM3_price,total_c8_kerikilM3_price,total_d1_kerikilM3_price,total_d2O1_kerikilM3_price,total_d2O2_kerikilM3_price,total_e1_kerikilM3_price,total_f1_kerikilM3_price,total_g1O1_kerikilM3_price,total_g1O2_kerikilM3_price,total_h1O1_kerikilM3_price,total_h1O2_kerikilM3_price,total_h2_kerikilM3_price,total_h3_kerikilM3_price,total_i1_kerikilM3_price,total_i2_kerikilM3_price,total_i3_kerikilM3_price];\r\nlet totallemKayuKgARR = [total_a1_lemKayuKg_price,total_a2O1_lemKayuKg_price,total_a2O2_lemKayuKg_price,total_a3_lemKayuKg_price,total_a4_lemKayuKg_price,total_a5_lemKayuKg_price,total_a6C1_lemKayuKg_price,total_a6C2_lemKayuKg_price,total_b1_lemKayuKg_price,total_b2_lemKayuKg_price,total_b3_lemKayuKg_price,total_c1O1_lemKayuKg_price,total_c1O2_lemKayuKg_price,total_c1O3_lemKayuKg_price,total_c2O1_lemKayuKg_price,total_c2O2_lemKayuKg_price,total_c2O3_lemKayuKg_price,total_c3O1_lemKayuKg_price,total_c3O2_lemKayuKg_price,total_c3O3_lemKayuKg_price,total_c4O1_lemKayuKg_price,total_c4O2_lemKayuKg_price,total_c4O3_lemKayuKg_price,total_c5O1_lemKayuKg_price,total_c5O2_lemKayuKg_price,total_c6_lemKayuKg_price,total_c7O1_lemKayuKg_price,total_c7O2_lemKayuKg_price,total_c8_lemKayuKg_price,total_d1_lemKayuKg_price,total_d2O1_lemKayuKg_price,total_d2O2_lemKayuKg_price,total_e1_lemKayuKg_price,total_f1_lemKayuKg_price,total_g1O1_lemKayuKg_price,total_g1O2_lemKayuKg_price,total_h1O1_lemKayuKg_price,total_h1O2_lemKayuKg_price,total_h2_lemKayuKg_price,total_h3_lemKayuKg_price,total_i1_lemKayuKg_price,total_i2_lemKayuKg_price,total_i3_lemKayuKg_price];\r\nlet totalmandorOhARR = [total_a1_mandorOh_price,total_a2O1_mandorOh_price,total_a2O2_mandorOh_price,total_a3_mandorOh_price,total_a4_mandorOh_price,total_a5_mandorOh_price,total_a6C1_mandorOh_price,total_a6C2_mandorOh_price,total_b1_mandorOh_price,total_b2_mandorOh_price,total_b3_mandorOh_price,total_c1O1_mandorOh_price,total_c1O2_mandorOh_price,total_c1O3_mandorOh_price,total_c2O1_mandorOh_price,total_c2O2_mandorOh_price,total_c2O3_mandorOh_price,total_c3O1_mandorOh_price,total_c3O2_mandorOh_price,total_c3O3_mandorOh_price,total_c4O1_mandorOh_price,total_c4O2_mandorOh_price,total_c4O3_mandorOh_price,total_c5O1_mandorOh_price,total_c5O2_mandorOh_price,total_c6_mandorOh_price,total_c7O1_mandorOh_price,total_c7O2_mandorOh_price,total_c8_mandorOh_price,total_d1_mandorOh_price,total_d2O1_mandorOh_price,total_d2O2_mandorOh_price,total_e1_mandorOh_price,total_f1_mandorOh_price,total_g1O1_mandorOh_price,total_g1O2_mandorOh_price,total_h1O1_mandorOh_price,total_h1O2_mandorOh_price,total_h2_mandorOh_price,total_h3_mandorOh_price,total_i1_mandorOh_price,total_i2_mandorOh_price,total_i3_mandorOh_price];\r\nlet totalminyakBekistingLtrARR = [total_a1_minyakBekistingLtr_price,total_a2O1_minyakBekistingLtr_price,total_a2O2_minyakBekistingLtr_price,total_a3_minyakBekistingLtr_price,total_a4_minyakBekistingLtr_price,total_a5_minyakBekistingLtr_price,total_a6C1_minyakBekistingLtr_price,total_a6C2_minyakBekistingLtr_price,total_b1_minyakBekistingLtr_price,total_b2_minyakBekistingLtr_price,total_b3_minyakBekistingLtr_price,total_c1O1_minyakBekistingLtr_price,total_c1O2_minyakBekistingLtr_price,total_c1O3_minyakBekistingLtr_price,total_c2O1_minyakBekistingLtr_price,total_c2O2_minyakBekistingLtr_price,total_c2O3_minyakBekistingLtr_price,total_c3O1_minyakBekistingLtr_price,total_c3O2_minyakBekistingLtr_price,total_c3O3_minyakBekistingLtr_price,total_c4O1_minyakBekistingLtr_price,total_c4O2_minyakBekistingLtr_price,total_c4O3_minyakBekistingLtr_price,total_c5O1_minyakBekistingLtr_price,total_c5O2_minyakBekistingLtr_price,total_c6_minyakBekistingLtr_price,total_c7O1_minyakBekistingLtr_price,total_c7O2_minyakBekistingLtr_price,total_c8_minyakBekistingLtr_price,total_d1_minyakBekistingLtr_price,total_d2O1_minyakBekistingLtr_price,total_d2O2_minyakBekistingLtr_price,total_e1_minyakBekistingLtr_price,total_f1_minyakBekistingLtr_price,total_g1O1_minyakBekistingLtr_price,total_g1O2_minyakBekistingLtr_price,total_h1O1_minyakBekistingLtr_price,total_h1O2_minyakBekistingLtr_price,total_h2_minyakBekistingLtr_price,total_h3_minyakBekistingLtr_price,total_i1_minyakBekistingLtr_price,total_i2_minyakBekistingLtr_price,total_i3_minyakBekistingLtr_price];\r\nlet totalpaku57CmKgARR = [total_a1_paku57CmKg_price,total_a2O1_paku57CmKg_price,total_a2O2_paku57CmKg_price,total_a3_paku57CmKg_price,total_a4_paku57CmKg_price,total_a5_paku57CmKg_price,total_a6C1_paku57CmKg_price,total_a6C2_paku57CmKg_price,total_b1_paku57CmKg_price,total_b2_paku57CmKg_price,total_b3_paku57CmKg_price,total_c1O1_paku57CmKg_price,total_c1O2_paku57CmKg_price,total_c1O3_paku57CmKg_price,total_c2O1_paku57CmKg_price,total_c2O2_paku57CmKg_price,total_c2O3_paku57CmKg_price,total_c3O1_paku57CmKg_price,total_c3O2_paku57CmKg_price,total_c3O3_paku57CmKg_price,total_c4O1_paku57CmKg_price,total_c4O2_paku57CmKg_price,total_c4O3_paku57CmKg_price,total_c5O1_paku57CmKg_price,total_c5O2_paku57CmKg_price,total_c6_paku57CmKg_price,total_c7O1_paku57CmKg_price,total_c7O2_paku57CmKg_price,total_c8_paku57CmKg_price,total_d1_paku57CmKg_price,total_d2O1_paku57CmKg_price,total_d2O2_paku57CmKg_price,total_e1_paku57CmKg_price,total_f1_paku57CmKg_price,total_g1O1_paku57CmKg_price,total_g1O2_paku57CmKg_price,total_h1O1_paku57CmKg_price,total_h1O2_paku57CmKg_price,total_h2_paku57CmKg_price,total_h3_paku57CmKg_price,total_i1_paku57CmKg_price,total_i2_paku57CmKg_price,total_i3_paku57CmKg_price];\r\nlet totalpakuPayungKgARR = [total_a1_pakuPayungKg_price,total_a2O1_pakuPayungKg_price,total_a2O2_pakuPayungKg_price,total_a3_pakuPayungKg_price,total_a4_pakuPayungKg_price,total_a5_pakuPayungKg_price,total_a6C1_pakuPayungKg_price,total_a6C2_pakuPayungKg_price,total_b1_pakuPayungKg_price,total_b2_pakuPayungKg_price,total_b3_pakuPayungKg_price,total_c1O1_pakuPayungKg_price,total_c1O2_pakuPayungKg_price,total_c1O3_pakuPayungKg_price,total_c2O1_pakuPayungKg_price,total_c2O2_pakuPayungKg_price,total_c2O3_pakuPayungKg_price,total_c3O1_pakuPayungKg_price,total_c3O2_pakuPayungKg_price,total_c3O3_pakuPayungKg_price,total_c4O1_pakuPayungKg_price,total_c4O2_pakuPayungKg_price,total_c4O3_pakuPayungKg_price,total_c5O1_pakuPayungKg_price,total_c5O2_pakuPayungKg_price,total_c6_pakuPayungKg_price,total_c7O1_pakuPayungKg_price,total_c7O2_pakuPayungKg_price,total_c8_pakuPayungKg_price,total_d1_pakuPayungKg_price,total_d2O1_pakuPayungKg_price,total_d2O2_pakuPayungKg_price,total_e1_pakuPayungKg_price,total_f1_pakuPayungKg_price,total_g1O1_pakuPayungKg_price,total_g1O2_pakuPayungKg_price,total_h1O1_pakuPayungKg_price,total_h1O2_pakuPayungKg_price,total_h2_pakuPayungKg_price,total_h3_pakuPayungKg_price,total_i1_pakuPayungKg_price,total_i2_pakuPayungKg_price,total_i3_pakuPayungKg_price];\r\nlet totalpapan325CmPcsARR = [total_a1_papan325CmPcs_price,total_a2O1_papan325CmPcs_price,total_a2O2_papan325CmPcs_price,total_a3_papan325CmPcs_price,total_a4_papan325CmPcs_price,total_a5_papan325CmPcs_price,total_a6C1_papan325CmPcs_price,total_a6C2_papan325CmPcs_price,total_b1_papan325CmPcs_price,total_b2_papan325CmPcs_price,total_b3_papan325CmPcs_price,total_c1O1_papan325CmPcs_price,total_c1O2_papan325CmPcs_price,total_c1O3_papan325CmPcs_price,total_c2O1_papan325CmPcs_price,total_c2O2_papan325CmPcs_price,total_c2O3_papan325CmPcs_price,total_c3O1_papan325CmPcs_price,total_c3O2_papan325CmPcs_price,total_c3O3_papan325CmPcs_price,total_c4O1_papan325CmPcs_price,total_c4O2_papan325CmPcs_price,total_c4O3_papan325CmPcs_price,total_c5O1_papan325CmPcs_price,total_c5O2_papan325CmPcs_price,total_c6_papan325CmPcs_price,total_c7O1_papan325CmPcs_price,total_c7O2_papan325CmPcs_price,total_c8_papan325CmPcs_price,total_d1_papan325CmPcs_price,total_d2O1_papan325CmPcs_price,total_d2O2_papan325CmPcs_price,total_e1_papan325CmPcs_price,total_f1_papan325CmPcs_price,total_g1O1_papan325CmPcs_price,total_g1O2_papan325CmPcs_price,total_h1O1_papan325CmPcs_price,total_h1O2_papan325CmPcs_price,total_h2_papan325CmPcs_price,total_h3_papan325CmPcs_price,total_i1_papan325CmPcs_price,total_i2_papan325CmPcs_price,total_i3_papan325CmPcs_price];\r\nlet totalpasirM3ARR = [total_a1_pasirM3_price,total_a2O1_pasirM3_price,total_a2O2_pasirM3_price,total_a3_pasirM3_price,total_a4_pasirM3_price,total_a5_pasirM3_price,total_a6C1_pasirM3_price,total_a6C2_pasirM3_price,total_b1_pasirM3_price,total_b2_pasirM3_price,total_b3_pasirM3_price,total_c1O1_pasirM3_price,total_c1O2_pasirM3_price,total_c1O3_pasirM3_price,total_c2O1_pasirM3_price,total_c2O2_pasirM3_price,total_c2O3_pasirM3_price,total_c3O1_pasirM3_price,total_c3O2_pasirM3_price,total_c3O3_pasirM3_price,total_c4O1_pasirM3_price,total_c4O2_pasirM3_price,total_c4O3_pasirM3_price,total_c5O1_pasirM3_price,total_c5O2_pasirM3_price,total_c6_pasirM3_price,total_c7O1_pasirM3_price,total_c7O2_pasirM3_price,total_c8_pasirM3_price,total_d1_pasirM3_price,total_d2O1_pasirM3_price,total_d2O2_pasirM3_price,total_e1_pasirM3_price,total_f1_pasirM3_price,total_g1O1_pasirM3_price,total_g1O2_pasirM3_price,total_h1O1_pasirM3_price,total_h1O2_pasirM3_price,total_h2_pasirM3_price,total_h3_pasirM3_price,total_i1_pasirM3_price,total_i2_pasirM3_price,total_i3_pasirM3_price];\r\nlet totalpekerjaOhARR = [total_a1_pekerjaOh_price,total_a2O1_pekerjaOh_price,total_a2O2_pekerjaOh_price,total_a3_pekerjaOh_price,total_a4_pekerjaOh_price,total_a5_pekerjaOh_price,total_a6C1_pekerjaOh_price,total_a6C2_pekerjaOh_price,total_b1_pekerjaOh_price,total_b2_pekerjaOh_price,total_b3_pekerjaOh_price,total_c1O1_pekerjaOh_price,total_c1O2_pekerjaOh_price,total_c1O3_pekerjaOh_price,total_c2O1_pekerjaOh_price,total_c2O2_pekerjaOh_price,total_c2O3_pekerjaOh_price,total_c3O1_pekerjaOh_price,total_c3O2_pekerjaOh_price,total_c3O3_pekerjaOh_price,total_c4O1_pekerjaOh_price,total_c4O2_pekerjaOh_price,total_c4O3_pekerjaOh_price,total_c5O1_pekerjaOh_price,total_c5O2_pekerjaOh_price,total_c6_pekerjaOh_price,total_c7O1_pekerjaOh_price,total_c7O2_pekerjaOh_price,total_c8_pekerjaOh_price,total_d1_pekerjaOh_price,total_d2O1_pekerjaOh_price,total_d2O2_pekerjaOh_price,total_e1_pekerjaOh_price,total_f1_pekerjaOh_price,total_g1O1_pekerjaOh_price,total_g1O2_pekerjaOh_price,total_h1O1_pekerjaOh_price,total_h1O2_pekerjaOh_price,total_h2_pekerjaOh_price,total_h3_pekerjaOh_price,total_i1_pekerjaOh_price,total_i2_pekerjaOh_price,total_i3_pekerjaOh_price];\r\nlet totalsemenSakARR = [total_a1_semenSak_price,total_a2O1_semenSak_price,total_a2O2_semenSak_price,total_a3_semenSak_price,total_a4_semenSak_price,total_a5_semenSak_price,total_a6C1_semenSak_price,total_a6C2_semenSak_price,total_b1_semenSak_price,total_b2_semenSak_price,total_b3_semenSak_price,total_c1O1_semenSak_price,total_c1O2_semenSak_price,total_c1O3_semenSak_price,total_c2O1_semenSak_price,total_c2O2_semenSak_price,total_c2O3_semenSak_price,total_c3O1_semenSak_price,total_c3O2_semenSak_price,total_c3O3_semenSak_price,total_c4O1_semenSak_price,total_c4O2_semenSak_price,total_c4O3_semenSak_price,total_c5O1_semenSak_price,total_c5O2_semenSak_price,total_c6_semenSak_price,total_c7O1_semenSak_price,total_c7O2_semenSak_price,total_c8_semenSak_price,total_d1_semenSak_price,total_d2O1_semenSak_price,total_d2O2_semenSak_price,total_e1_semenSak_price,total_f1_semenSak_price,total_g1O1_semenSak_price,total_g1O2_semenSak_price,total_h1O1_semenSak_price,total_h1O2_semenSak_price,total_h2_semenSak_price,total_h3_semenSak_price,total_i1_semenSak_price,total_i2_semenSak_price,total_i3_semenSak_price];\r\nlet totalsengBjlsPcsARR = [total_a1_sengBjlsPcs_price,total_a2O1_sengBjlsPcs_price,total_a2O2_sengBjlsPcs_price,total_a3_sengBjlsPcs_price,total_a4_sengBjlsPcs_price,total_a5_sengBjlsPcs_price,total_a6C1_sengBjlsPcs_price,total_a6C2_sengBjlsPcs_price,total_b1_sengBjlsPcs_price,total_b2_sengBjlsPcs_price,total_b3_sengBjlsPcs_price,total_c1O1_sengBjlsPcs_price,total_c1O2_sengBjlsPcs_price,total_c1O3_sengBjlsPcs_price,total_c2O1_sengBjlsPcs_price,total_c2O2_sengBjlsPcs_price,total_c2O3_sengBjlsPcs_price,total_c3O1_sengBjlsPcs_price,total_c3O2_sengBjlsPcs_price,total_c3O3_sengBjlsPcs_price,total_c4O1_sengBjlsPcs_price,total_c4O2_sengBjlsPcs_price,total_c4O3_sengBjlsPcs_price,total_c5O1_sengBjlsPcs_price,total_c5O2_sengBjlsPcs_price,total_c6_sengBjlsPcs_price,total_c7O1_sengBjlsPcs_price,total_c7O2_sengBjlsPcs_price,total_c8_sengBjlsPcs_price,total_d1_sengBjlsPcs_price,total_d2O1_sengBjlsPcs_price,total_d2O2_sengBjlsPcs_price,total_e1_sengBjlsPcs_price,total_f1_sengBjlsPcs_price,total_g1O1_sengBjlsPcs_price,total_g1O2_sengBjlsPcs_price,total_h1O1_sengBjlsPcs_price,total_h1O2_sengBjlsPcs_price,total_h2_sengBjlsPcs_price,total_h3_sengBjlsPcs_price,total_i1_sengBjlsPcs_price,total_i2_sengBjlsPcs_price,total_i3_sengBjlsPcs_price];\r\nlet totaltripleks9MmPcsARR = [total_a1_tripleks9MmPcs_price,total_a2O1_tripleks9MmPcs_price,total_a2O2_tripleks9MmPcs_price,total_a3_tripleks9MmPcs_price,total_a4_tripleks9MmPcs_price,total_a5_tripleks9MmPcs_price,total_a6C1_tripleks9MmPcs_price,total_a6C2_tripleks9MmPcs_price,total_b1_tripleks9MmPcs_price,total_b2_tripleks9MmPcs_price,total_b3_tripleks9MmPcs_price,total_c1O1_tripleks9MmPcs_price,total_c1O2_tripleks9MmPcs_price,total_c1O3_tripleks9MmPcs_price,total_c2O1_tripleks9MmPcs_price,total_c2O2_tripleks9MmPcs_price,total_c2O3_tripleks9MmPcs_price,total_c3O1_tripleks9MmPcs_price,total_c3O2_tripleks9MmPcs_price,total_c3O3_tripleks9MmPcs_price,total_c4O1_tripleks9MmPcs_price,total_c4O2_tripleks9MmPcs_price,total_c4O3_tripleks9MmPcs_price,total_c5O1_tripleks9MmPcs_price,total_c5O2_tripleks9MmPcs_price,total_c6_tripleks9MmPcs_price,total_c7O1_tripleks9MmPcs_price,total_c7O2_tripleks9MmPcs_price,total_c8_tripleks9MmPcs_price,total_d1_tripleks9MmPcs_price,total_d2O1_tripleks9MmPcs_price,total_d2O2_tripleks9MmPcs_price,total_e1_tripleks9MmPcs_price,total_f1_tripleks9MmPcs_price,total_g1O1_tripleks9MmPcs_price,total_g1O2_tripleks9MmPcs_price,total_h1O1_tripleks9MmPcs_price,total_h1O2_tripleks9MmPcs_price,total_h2_tripleks9MmPcs_price,total_h3_tripleks9MmPcs_price,total_i1_tripleks9MmPcs_price,total_i2_tripleks9MmPcs_price,total_i3_tripleks9MmPcs_price];\r\nlet totaltukangOhARR = [total_a1_tukangOh_price,total_a2O1_tukangOh_price,total_a2O2_tukangOh_price,total_a3_tukangOh_price,total_a4_tukangOh_price,total_a5_tukangOh_price,total_a6C1_tukangOh_price,total_a6C2_tukangOh_price,total_b1_tukangOh_price,total_b2_tukangOh_price,total_b3_tukangOh_price,total_c1O1_tukangOh_price,total_c1O2_tukangOh_price,total_c1O3_tukangOh_price,total_c2O1_tukangOh_price,total_c2O2_tukangOh_price,total_c2O3_tukangOh_price,total_c3O1_tukangOh_price,total_c3O2_tukangOh_price,total_c3O3_tukangOh_price,total_c4O1_tukangOh_price,total_c4O2_tukangOh_price,total_c4O3_tukangOh_price,total_c5O1_tukangOh_price,total_c5O2_tukangOh_price,total_c6_tukangOh_price,total_c7O1_tukangOh_price,total_c7O2_tukangOh_price,total_c8_tukangOh_price,total_d1_tukangOh_price,total_d2O1_tukangOh_price,total_d2O2_tukangOh_price,total_e1_tukangOh_price,total_f1_tukangOh_price,total_g1O1_tukangOh_price,total_g1O2_tukangOh_price,total_h1O1_tukangOh_price,total_h1O2_tukangOh_price,total_h2_tukangOh_price,total_h3_tukangOh_price,total_i1_tukangOh_price,total_i2_tukangOh_price,total_i3_tukangOh_price];\r\n\r\nlet totalbataMerahPcsPrice = totalbataMerahPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalbatuKaliM3Price = totalbatuKaliM3ARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalbautJLPcsPrice = totalbautJLPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalbesiPolos8MmX12MPcsPrice = totalbesiPolos8MmX12MPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalbesiUlir10MmX12MPcsPrice = totalbesiUlir10MmX12MPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalkawatAnyam1MmX1InSpaciX12MX30MBalPrice = totalkawatAnyam1MmX1InSpaciX12MX30MBalARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalkawatBetonKgPrice = totalkawatBetonKgARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalkayuKelasIi57CmX4MPcsPrice = totalkayuKelasIi57CmX4MPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalkayuKelasIi612CmX4MPcsPrice = totalkayuKelasIi612CmX4MPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalkepalaTukangOhPrice = Math.ceil(totalkepalaTukangOhARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0)*100)\/100;\r\nlet totalkerikilM3Price = totalkerikilM3ARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totallemKayuKgPrice = totallemKayuKgARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalmandorOhPrice = totalmandorOhARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalminyakBekistingLtrPrice = totalminyakBekistingLtrARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalpaku57CmKgPrice = totalpaku57CmKgARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalpakuPayungKgPrice = totalpakuPayungKgARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalpapan325CmPcsPrice = totalpapan325CmPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalpasirM3Price = totalpasirM3ARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalpekerjaOhPrice = totalpekerjaOhARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalsemenSakPrice = totalsemenSakARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totalsengBjlsPcsPrice = totalsengBjlsPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totaltripleks9MmPcsPrice = totaltripleks9MmPcsARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\nlet totaltukangOhPrice = totaltukangOhARR.reduce((acc, val) => {return isNaN(val)? acc : acc + val;}, 0);\r\n\r\nlet total__price = Math.round((totalbataMerahPcsPrice + totalbatuKaliM3Price + totalbautJLPcsPrice + totalbesiPolos8MmX12MPcsPrice + totalbesiUlir10MmX12MPcsPrice + totalkawatAnyam1MmX1InSpaciX12MX30MBalPrice + totalkawatBetonKgPrice + totalkayuKelasIi57CmX4MPcsPrice + totalkayuKelasIi612CmX4MPcsPrice + totalkepalaTukangOhPrice + totalkerikilM3Price + totallemKayuKgPrice + totalmandorOhPrice + totalminyakBekistingLtrPrice + totalpaku57CmKgPrice + totalpakuPayungKgPrice + totalpapan325CmPcsPrice + totalpasirM3Price + totalpekerjaOhPrice + totalsemenSakPrice + totalsengBjlsPcsPrice + totaltripleks9MmPcsPrice + totaltukangOhPrice) * 100)\/100;\r\n\r\nlet totalbataMerahPcsQty = totalbataMerahPcsPrice \/ v1.bataMerahPcs_price;\r\nlet totalbatuKaliM3Qty = totalbatuKaliM3Price \/ v1.batuKaliM3_price;\r\nlet totalbautJLPcsQty = totalbautJLPcsPrice \/ v1.bautJLPcs_price;\r\nlet totalbesiPolos8MmX12MPcsQty = totalbesiPolos8MmX12MPcsPrice \/ v1.besiPolos8MmX12MPcs_price;\r\nlet totalbesiUlir10MmX12MPcsQty = totalbesiUlir10MmX12MPcsPrice \/ v1.besiUlir10MmX12MPcs_price;\r\nlet totalkawatAnyam1MmX1InSpaciX12MX30MBalQty = totalkawatAnyam1MmX1InSpaciX12MX30MBalPrice \/ v1.kawatAnyam1MmX1InSpaciX12MX30MBal_price;\r\nlet totalkawatBetonKgQty = totalkawatBetonKgPrice \/ v1.kawatBetonKg_price;\r\nlet totalkayuKelasIi57CmX4MPcsQty = totalkayuKelasIi57CmX4MPcsPrice \/ v1.kayuKelasIi57CmX4MPcs_price;\r\nlet totalkayuKelasIi612CmX4MPcsQty = totalkayuKelasIi612CmX4MPcsPrice \/ v1.kayuKelasIi612CmX4MPcs_price;\r\nlet totalkepalaTukangOhQty = totalkepalaTukangOhPrice \/ v1.kepalaTukangOh_price;\r\nlet totalkerikilM3Qty = totalkerikilM3Price \/ v1.kerikilM3_price;\r\nlet totallemKayuKgQty = totallemKayuKgPrice \/ v1.lemKayuKg_price;\r\nlet totalmandorOhQty = totalmandorOhPrice \/ v1.mandorOh_price;\r\nlet totalminyakBekistingLtrQty = totalminyakBekistingLtrPrice \/ v1.minyakBekistingLtr_price;\r\nlet totalpaku57CmKgQty = totalpaku57CmKgPrice \/ v1.paku57CmKg_price;\r\nlet totalpakuPayungKgQty = totalpakuPayungKgPrice \/ v1.pakuPayungKg_price;\r\nlet totalpapan325CmPcsQty = totalpapan325CmPcsPrice \/ v1.papan325CmPcs_price;\r\nlet totalpasirM3Qty = totalpasirM3Price \/ v1.pasirM3_price;\r\nlet totalpekerjaOhQty = totalpekerjaOhPrice \/ v1.pekerjaOh_price;\r\nlet totalsemenSakQty = totalsemenSakPrice \/ v1.semenSak_price;\r\nlet totalsengBjlsPcsQty = totalsengBjlsPcsPrice \/ v1.sengBjlsPcs_price;\r\nlet totaltripleks9MmPcsQty = totaltripleks9MmPcsPrice \/ v1.tripleks9MmPcs_price;\r\nlet totaltukangOhQty = totaltukangOhPrice \/ v1.tukangOh_price;\r\n\r\n\r\n\r\nvalue = ((totalbataMerahPcsQty == 0) ? \"\" : \"\\nTotal bata merah is \" + totalbataMerahPcsQty + \" pcs for a total price of \" + totalbataMerahPcsPrice + \" rupiah.\") + \r\n((totalbatuKaliM3Qty == 0) ? \"\" : \"\\nTotal batu kali is \" + totalbatuKaliM3Qty + \" m3 for a total price of \" + totalbatuKaliM3Price + \" rupiah.\") + \r\n((totalbautJLPcsQty == 0) ? \"\" : \"\\nTotal baut J\/L is \" + totalbautJLPcsQty + \" pcs for a total price of \" + totalbautJLPcsPrice + \" rupiah.\") + \r\n((totalbesiPolos8MmX12MPcsQty == 0) ? \"\" : \"\\nTotal besi polos 8mm x 12m is \" + totalbesiPolos8MmX12MPcsQty + \" pcs for a total price of \" + totalbesiPolos8MmX12MPcsPrice + \" rupiah.\") + \r\n((totalbesiUlir10MmX12MPcsQty == 0) ? \"\" : \"\\nTotal besi ulir 10mm x 12m is \" + totalbesiUlir10MmX12MPcsQty + \" pcs for a total price of \" + totalbesiUlir10MmX12MPcsPrice + \" rupiah.\") + \r\n((totalkawatAnyam1MmX1InSpaciX12MX30MBalQty == 0) ? \"\" : \"\\nTotal kawat anyam 1mm x 1in spaci x 1.2m x 30m is \" + totalkawatAnyam1MmX1InSpaciX12MX30MBalQty + \" bal for a total price of \" + totalkawatAnyam1MmX1InSpaciX12MX30MBalPrice + \" rupiah.\") + \r\n((totalkawatBetonKgQty == 0) ? \"\" : \"\\nTotal kawat benton is \" + totalkawatBetonKgQty + \" kg for a total price of \" + totalkawatBetonKgPrice + \" rupiah.\") + \r\n((totalkayuKelasIi57CmX4MPcsQty == 0) ? \"\" : \"\\nTotal kayu kelas II 5\/7cm x 4m is \" + totalkayuKelasIi57CmX4MPcsQty + \" pcs for a total price of \" + totalkayuKelasIi57CmX4MPcsPrice + \" rupiah.\") + \r\n((totalkayuKelasIi612CmX4MPcsQty == 0) ? \"\" : \"\\nTotal kayu kelas II 6\/12cm x 4m is \" + totalkayuKelasIi612CmX4MPcsQty + \" pcs for a total price of \" + totalkayuKelasIi612CmX4MPcsPrice + \" rupiah.\") + \r\n((totalkepalaTukangOhQty == 0) ? \"\" : \"\\nTotal kepala tukang is \" + totalkepalaTukangOhQty + \" OH for a total price of \" + totalkepalaTukangOhPrice + \" rupiah.\") + \r\n((totalkerikilM3Qty == 0) ? \"\" : \"\\nTotal kerikil is \" + totalkerikilM3Qty + \" m3 for a total price of \" + totalkerikilM3Price + \" rupiah.\") + \r\n((totallemKayuKgQty == 0) ? \"\" : \"\\nTotal lem kayu is \" + totallemKayuKgQty + \" kg for a total price of \" + totallemKayuKgPrice + \" rupiah.\") + \r\n((totalmandorOhQty == 0) ? \"\" : \"\\nTotal mandor is \" + totalmandorOhQty + \" OH for a total price of \" + totalmandorOhPrice + \" rupiah.\") + \r\n((totalminyakBekistingLtrQty == 0) ? \"\" : \"\\nTotal minyak bekisting is \" + totalminyakBekistingLtrQty + \" Liter for a total price of \" + totalminyakBekistingLtrPrice + \" rupiah.\") + \r\n((totalpaku57CmKgQty == 0) ? \"\" : \"\\nTotal paku 5-7cm is \" + totalpaku57CmKgQty + \" kg for a total price of \" + totalpaku57CmKgPrice + \" rupiah.\") + \r\n((totalpakuPayungKgQty == 0) ? \"\" : \"\\nTotal paku payung is \" + totalpakuPayungKgQty + \" kg for a total price of \" + totalpakuPayungKgPrice + \" rupiah.\") + \r\n((totalpapan325CmPcsQty == 0) ? \"\" : \"\\nTotal papan 3\/25cm is \" + totalpapan325CmPcsQty + \" pcs for a total price of \" + totalpapan325CmPcsPrice + \" rupiah.\") + \r\n((totalpasirM3Qty == 0) ? \"\" : \"\\nTotal pasir is \" + totalpasirM3Qty + \" m3 for a total price of \" + totalpasirM3Price + \" rupiah.\") + \r\n((totalpekerjaOhQty == 0) ? \"\" : \"\\nTotal pekerja is \" + totalpekerjaOhQty + \" OH for a total price of \" + totalpekerjaOhPrice + \" rupiah.\") + \r\n((totalsemenSakQty == 0) ? \"\" : \"\\nTotal semen is \" + totalsemenSakQty + \" sak for a total price of \" + totalsemenSakPrice + \" rupiah.\") + \r\n((totalsengBjlsPcsQty == 0) ? \"\" : \"\\nTotal seng BJLS is \" + totalsengBjlsPcsQty + \" pcs for a total price of \" + totalsengBjlsPcsPrice + \" rupiah.\") + \r\n((totaltripleks9MmPcsQty == 0) ? \"\" : \"\\nTotal Tripleks 9mm is \" + totaltripleks9MmPcsQty + \" pcs for a total price of \" + totaltripleks9MmPcsPrice + \" rupiah.\") + \r\n((totaltukangOhQty == 0) ? \"\" : \"\\nTotal tukang is \" + totaltukangOhQty + \" OH for a total price of \" + totaltukangOhPrice + \" rupiah.\") +\r\n\r\n\"\\n\\n\\nTotal Project Price is \" + parseInt(total__price) + \" rupiah.\";",
          "key": "wrapUp",
          "type": "textarea",
          "rows": 15,
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
      }];
    return (
      <View style={{backgroundColor:'#f1f2f3'}}>
      <KeyboardAwareScrollView>


        <FormioComponentsList
       //  components={formId=='hqlhW0T1oyJyICDXzHZu'?staticdata:currentPageComponents}   
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
      //hqlhW0T1oyJyICDXzHZu
  var formId=state.form.form._id;

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
    formId,
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
