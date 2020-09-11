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
    const staticdata=[
      {
      "title": "INFORMACI\u00d3N GENERAL",
      "breadcrumbClickable": true,
      "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
      },
      "collapsible": false,
      "tableView": false,
      "key": "page1",
      "type": "panel",
      "label": "Page 1",
      "components": [{
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >>Metadata\n  <\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html1",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Location",
        "tableView": false,
        "key": "geoLocation",
        "type": "geolocation",
        "input": true
      }, {
        "label": "Status",
        "disabled": true,
        "tableView": true,
        "customDefaultValue": "Visitada",
        "key": "status",
        "type": "textfield",
        "input": true
      }, {
        "label": "Assigned",
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "assigned",
        "type": "textfield",
        "input": true
      }, {
        "label": "Project",
        "disabled": true,
        "tableView": true,
        "calculateValue": "val = data.assigned;\nif(val.includes('arauca')){\n  value = 'COL - CDVD (Arauca)';\n}else if(val.includes('pasto')){\n  value = 'COL - CDVD (Pasto)';\n}else if(val.includes('ibague')){\n  value = 'COL - CDVD (Ibague)';\n}else if(val.includes('neiva')){\n  value = 'COL - CDVD (Neiva)';\n}else{\n  value = '';\n}",
        "key": "project",
        "type": "textfield",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>> Resumen estado de la vivienda<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html5",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Clasificaci\u00f3n VULNERABILIDAD vivienda POST-INTERVENCI\u00d3N",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_14",
        "customConditional": "show = data.a_gen_categ8>1;",
        "type": "textfield",
        "input": true
      }, {
        "label": "Clasificaci\u00f3n VULNERABILIDAD vivienda PRE-INTERVENCI\u00d3N",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_13",
        "customConditional": "show = data.a_gen_categ8>1;",
        "type": "textfield",
        "input": true
      }, {
        "label": "METODOLOGIA DE DISE\u00d1O recomendada",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_15",
        "customConditional": "show = data.a_gen_categ8>1;",
        "type": "textfield",
        "input": true
      }, {
        "label": "PRESUPUESTO PRIORIZADO vivienda",
        "disabled": true,
        "tableView": true,
        "defaultValue": "COP 0.00",
        "calculateValue": "if(data.costo_total_priorizado === '' || isNaN(data.costo_total_priorizado) ){\n  value = 'Incompleto\/No aplica';\n}else{\n  value = data.costo_total_priorizado;\n }\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_16",
        "type": "textfield",
        "input": true
      }, {
        "label": "prio_storage",
        "hidden": true,
        "tableView": true,
        "key": "prio_storage",
        "type": "textfield",
        "input": true
      }, {
        "label": "Contrase\u00f1a modifica campos (solo para 'Supervisor (CDVD)')",
        "tableView": true,
        "key": "contrasena",
        "conditional": {
          "show": true,
          "when": "assigned",
          "eq": "supervisor"
        },
        "type": "textfield",
        "input": true
      }, {
        "label": "Fecha \/ Hora",
        "tableView": false,
        "enableMinDateInput": false,
        "datePicker": {
          "disableWeekends": false,
          "disableWeekdays": false
        },
        "enableMaxDateInput": false,
        "validate": {
          "required": true
        },
        "key": "fechaHora",
        "type": "datetime",
        "input": true,
        "widget": {
          "type": "calendar",
          "displayInTimezone": "viewer",
          "language": "en",
          "useLocaleSettings": false,
          "allowInput": true,
          "mode": "single",
          "enableTime": true,
          "noCalendar": false,
          "format": "yyyy-MM-dd hh:mm a",
          "hourIncrement": 1,
          "minuteIncrement": 1,
          "time_24hr": false,
          "minDate": null,
          "disableWeekends": false,
          "disableWeekdays": false,
          "maxDate": null
        }
      }, {
        "label": "Nombre personal ejecutor",
        "widget": "choicesjs",
        "tableView": true,
        "data": {
          "values": [{
            "label": "EJE1a - Pasto Personal 1",
            "value": "EJE1a - Pasto Personal 1"
          }, {
            "label": "EJE1a - Pasto Personal 2",
            "value": "EJE1a - Pasto Personal 2"
          }, {
            "label": "EJE1a - Pasto Personal 3",
            "value": "EJE1a - Pasto Personal 3"
          }, {
            "label": "EJE1a - Pasto Personal 4",
            "value": "EJE1a - Pasto Personal 4"
          }, {
            "label": "EJE1a - Pasto Personal 5",
            "value": "EJE1a - Pasto Personal 5"
          }, {
            "label": "Other",
            "value": "Other"
          }]
        },
        "selectThreshold": 0.3,
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_6",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "nombre_encuesta_cal1",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_inf_6 !== ''){\r\n  value = data.a_gen_inf_6;\r\n}",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_6a",
        "type": "textfield",
        "input": true
      }, {
        "label": "C\u00f3digo ID vivienda \u00fanico (asignado automaticamente)",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "redrawOn": "assigned",
        "calculateValue": "rand = Math.floor(Math.random() * 100000000 ) + 1;\r\nval = data.assigned;\r\nif(val.includes('arauca')){\r\n  value = 'COL-CDVD-Arauca_'+rand;\r\n}else if(val.includes('pasto')){\r\n  value = 'COL-CDVD-Pasto_'+rand;\r\n}else if(val.includes('ibague')){\r\n  value = 'COL-CDVD-Ibague'+rand;\r\n}else if(val.includes('neiva')){\r\n  value = 'COL-CDVD-Neiva'+rand;\r\n}else{\r\n  value = '';",
        "key": "a_gen_inf_7",
        "type": "textfield",
        "input": true
      }, {
        "label": "INGRESAR c\u00f3digo ID vivienda 'Casa Digna, Vida Digna' (c\u00e9dula de ciudadan\u00eda del jefe de hogar de la vivienda sin puntos o otros caracteres)",
        "tooltip": "La c\u00e9dula de ciudadan\u00eda pueden tener de 3 a 11 d\u00edgitos, sin puntos, espacios o caracteres especiales. C\u00e9dula de ciudadan\u00eda de 9 d\u00edgitos no est\u00e1n permitidas.",
        "tableView": true,
        "validate": {
          "required": true,
          "pattern": "\\d{3,8}|\\d{10,11}"
        },
        "key": "a_gen_inf_7d",
        "type": "textfield",
        "input": true
      }, {
        "label": "CONFIRMAR c\u00f3digo ID vivienda 'Casa Digna, Vida Digna' (c\u00e9dula de ciudadan\u00eda del jefe de hogar de la vivienda sin puntos o otros caracteres)",
        "tableView": true,
        "validate": {
          "required": true,
          "custom": "valid = (input === data.a_gen_inf_7d) ? \ntrue : 'Los campos \"INGRESAR c\u00f3digo ID vivienda\" y \"CONFIRMAR c\u00f3digo ID vivienda\" no coinciden, por favor verificar la consistencia de la informaci\u00f3n.';"
        },
        "key": "a_gen_inf_7a",
        "type": "textfield",
        "input": true
      }, {
        "label": "IMPORTAR datos b\u00e1sicos de la vivienda desde la plataforma de postulaci\u00f3n 'Casa Digna, Vida Digna'. En caso de que el registro solicitado no aparezca, por favor ingresar la informaci\u00f3n manualmente.",
        "widget": "choicesjs",
        "tableView": true,
        "dataSrc": "resource",
        "data": {
          "values": [{
            "label": "",
            "value": ""
          }],
          "resource": "VmeWD9rs0uvbTK87LczX"
        },
        "template": "<span>{{ item.numero_documento }}<\/span>",
        "selectThreshold": 0.3,
        "key": "importar_datos_basicos_vivienda",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "selectFields": "id_hogar,numero_documento,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,direccion,telefono,cedula_catastral,matricula_inmobiliaria,barrio,departamento,municipio,nombre_completo",
        "input": true,
        "addResource": false,
        "reference": false
      }, {
        "label": "idcdvd (importado por interoperabilidad)",
        "hidden": true,
        "tableView": true,
        "calculateValue": "value = data.importar_datos_basicos_vivienda.id_hogar;",
        "key": "idcdvd",
        "type": "textfield",
        "input": true
      }, {
        "label": "departamento (importado por interoperabilidad)",
        "hidden": true,
        "tableView": true,
        "calculateValue": "value = data.importar_datos_basicos_vivienda.departamento;",
        "key": "departamento_cdvd",
        "type": "textfield",
        "input": true
      }, {
        "label": "municipalidad (importado por interoperabilidad)",
        "tableView": true,
        "calculateValue": "value = data.importar_datos_basicos_vivienda.municipio;",
        "key": "municipalidad_cdvd",
        "type": "textfield",
        "input": true
      }, {
        "label": "C\u00e9dula Catastral",
        "tableView": true,
        "calculateValue": "value = data.importar_datos_basicos_vivienda.cedula_catastral;",
        "validate": {
          "required": true
        },
        "key": "cedula_catastral",
        "type": "textfield",
        "input": true
      }, {
        "label": "Matr\u00edcula Inmobiliaria",
        "tableView": true,
        "calculateValue": "value = data.importar_datos_basicos_vivienda.matricula_inmobiliaria;",
        "validate": {
          "required": true
        },
        "key": "matricula_inmobiliaria",
        "type": "textfield",
        "input": true
      }, {
        "label": "codigo_id_cdvd_calc1",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_inf_7d == data.a_gen_inf_7a){\n  value = 1;\n}else{\n  value = 0;\n}\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_7e",
        "type": "textfield",
        "input": true
      }, {
        "label": "codigo_id_entidad_calc1",
        "hidden": true,
        "tableView": true,
        "calculateValue": "if(data.a_gen_inf_7a == \"null\"){\n  if(data.a_surh_hmown_5b == \"null\"|| data.a_surh_hmown_5b == 'si'){\n    value == data.a_gen_inf_7a;\n  }\n  else{\n    value == concat(data.a_gen_inf_7a, '_p',data.a_surh_hmown_5c )\n  }\n}\nelse{\n  value === \"\";\n}\ninstance.setValue(value);",
        "key": "a_gen_inf_7b",
        "type": "textfield",
        "input": true
      }, {
        "label": "INFORMACI\u00d3N GENERAL -> FOTOS fachada (min. 1 foto, max. 2 fotos)",
        "tableView": false,
        "storage": "url",
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "multiple": true,
        "validate": {
          "custom": "valid = (data.a_comentarios_1 != 'viviendas_tramitadas');",
          "multiple": true
        },
        "key": "a_gen_inf_12",
        "type": "file",
        "url": "https:\/\/web.mondasolvo.net\/api\/fileUpload",
        "input": true
      }, {
        "label": "INFORMACI\u00d3N GENERAL -> VIDEO recorrido vivienda (max. 2 minutos)",
        "tableView": false,
        "storage": "url",
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "key": "a_gen_inf_12a",
        "type": "file",
        "url": "https:\/\/web.mondasolvo.net\/api\/fileUpload",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>> Localizaci\u00f3n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Latitud",
        "disabled": true,
        "tableView": true,
     //   "calculateValue": "value=data.geoLocation",
        "calculateValue": "var str = data.geoLocation;\r\nvar res = str.split(\",\");\r\nvar num = parseFloat(res[0]);\r\nvalue = num.toFixed(6);",
        "key": "a_gen_inf_gd_1",
        "type": "textfield",
        "input": true
      }, {
        "label": "Longitud",
        "disabled": true,
        "tableView": true,
        "calculateValue": "var str = data.geoLocation;\r\nvar res = str.split(\",\");\r\nnum = parseFloat(res[1]);\r\nvalue = num.toFixed(6);",
        "key": "a_gen_inf_gd_2",
        "type": "textfield",
        "input": true
      }, {
        "label": "redondear_latitud",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_inf_gd_1>=4.45 && data.a_gen_inf_gd_1<=4.85 && data.a_gen_inf_gd_2>=-74.25 && data.a_gen_inf_gd_2<=-73.95){\r\n    if(Math.abs(Math.abs(((Math.ceil(data.a_gen_inf_gd_1*200))\/200).toFixed(3))-Math.abs(data.a_gen_inf_gd_1)) < Math.abs(Math.abs(((Math.floor(data.a_gen_inf_gd_1*200))\/200).toFixed(3))-Math.abs(data.a_gen_inf_gd_1))){\r\n        value = ((Math.ceil(data.a_gen_inf_gd_1*200))\/200).toFixed(3);\r\n    }else{\r\n        value = ((Math.floor(data.a_gen_inf_gd_1*200))\/200).toFixed(3);\r\n    }\r\n}else{\r\n    if(Math.abs(Math.abs(((Math.ceil(data.a_gen_inf_gd_1*20))\/20).toFixed(2))-Math.abs(data.a_gen_inf_gd_1)) < Math.abs(Math.abs(((Math.floor(data.a_gen_inf_gd_1*20))\/20).toFixed(2))-Math.abs(data.a_gen_inf_gd_1))){\r\n        value = ((Math.ceil(data.a_gen_inf_gd_1*20))\/20).toFixed(2);\r\n    }else{\r\n        value = ((Math.floor(data.a_gen_inf_gd_1*20))\/20).toFixed(2);\r\n    }\r\n}",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_gd_3",
        "type": "textfield",
        "input": true
      }, {
        "label": "redondear_longitud",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_inf_gd_1>=4.45 && data.a_gen_inf_gd_1<=4.85 && data.a_gen_inf_gd_2>=-74.25 && data.a_gen_inf_gd_2<=-73.95){\r\n    if(Math.abs(Math.abs(((Math.ceil(data.a_gen_inf_gd_2*200))\/200).toFixed(3))-Math.abs(data.a_gen_inf_gd_2)) < Math.abs(Math.abs(((Math.floor(data.a_gen_inf_gd_2*200))\/200).toFixed(3)) - Math.abs(data.a_gen_inf_gd_2))){\r\n        value = ((Math.ceil(data.a_gen_inf_gd_2*200))\/200).toFixed(3);\r\n    }else{\r\n        value = ((Math.floor(data.a_gen_inf_gd_2*200))\/200).toFixed(3);\r\n    }\r\n}else{\r\n    if(Math.abs(Math.abs(((Math.ceil(data.a_gen_inf_gd_2*20))\/20).toFixed(2)) - Math.abs(data.a_gen_inf_gd_2)) < Math.abs(Math.abs(((Math.floor(data.a_gen_inf_gd_2*20))\/20).toFixed(2)) - Math.abs(data.a_gen_inf_gd_2))){\r\n        value = ((Math.ceil(data.a_gen_inf_gd_2*20))\/20).toFixed(2);\r\n    }else{\r\n        value = ((Math.floor(data.a_gen_inf_gd_2*20))\/20).toFixed(2);\r\n    }",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_gd_4",
        "type": "textfield",
        "input": true
      }, {
        "label": "title",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_gd_3+', '+data.a_gen_inf_gd_4;",
        "key": "title",
        "type": "textfield",
        "input": true
      }, {
        "label": "Altitud [m]",
        "hidden": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "val = value.toFixed(2);\nvalue = val;\ninstance.setValue(value);",
        "key": "a_gen_inf_gd_5",
        "type": "textfield",
        "input": true
      }, {
        "label": "Pa\u00eds",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_gd_6",
        "type": "textfield",
        "input": true
      }, {
        "label": "Departamento > Municipalidad (Colombia)",
        "widget": "choicesjs",
        "tableView": true,
        "dataSrc": "json",
        "data": {
          "values": [{
            "label": "",
            "value": ""
          }],
          "json": [{
            "label": "Amazonas\t-\tEl Encanto",
            "value": "91263"
          }, {
            "label": "Amazonas\t-\tLa Chorrera",
            "value": "91405"
          }, {
            "label": "Amazonas\t-\tLa Pedrera",
            "value": "91407"
          }, {
            "label": "Amazonas\t-\tLa Victoria",
            "value": "91430"
          }, {
            "label": "Amazonas\t-\tLeticia",
            "value": "91001"
          }, {
            "label": "Amazonas\t-\tMiriti - Parana",
            "value": "91460"
          }, {
            "label": "Amazonas\t-\tPuerto Alegria",
            "value": "91530"
          }, {
            "label": "Amazonas\t-\tPuerto Arica",
            "value": "91536"
          }, {
            "label": "Amazonas\t-\tPuerto Narino",
            "value": "91540"
          }, {
            "label": "Amazonas\t-\tPuerto Santander",
            "value": "91669"
          }, {
            "label": "Amazonas\t-\tTarapaca",
            "value": "91798"
          }, {
            "label": "Antioquia\t-\tAbejorral",
            "value": "5002"
          }, {
            "label": "Antioquia\t-\tAbriaqui",
            "value": "5004"
          }, {
            "label": "Antioquia\t-\tAlejandria",
            "value": "5021"
          }, {
            "label": "Antioquia\t-\tAmaga",
            "value": "5030"
          }, {
            "label": "Antioquia\t-\tAmalfi",
            "value": "5031"
          }, {
            "label": "Antioquia\t-\tAndes",
            "value": "5034"
          }, {
            "label": "Antioquia\t-\tAngelopolis",
            "value": "5036"
          }, {
            "label": "Antioquia\t-\tAngostura",
            "value": "5038"
          }, {
            "label": "Antioquia\t-\tAnori",
            "value": "5040"
          }, {
            "label": "Antioquia\t-\tAnza",
            "value": "5044"
          }, {
            "label": "Antioquia\t-\tApartado",
            "value": "5045"
          }, {
            "label": "Antioquia\t-\tArboletes",
            "value": "5051"
          }, {
            "label": "Antioquia\t-\tArgelia",
            "value": "5055"
          }, {
            "label": "Antioquia\t-\tArmenia",
            "value": "5059"
          }, {
            "label": "Antioquia\t-\tBarbosa",
            "value": "5079"
          }, {
            "label": "Antioquia\t-\tBello",
            "value": "5088"
          }, {
            "label": "Antioquia\t-\tBelmira",
            "value": "5086"
          }, {
            "label": "Antioquia\t-\tBetania",
            "value": "5091"
          }, {
            "label": "Antioquia\t-\tBetulia",
            "value": "5093"
          }, {
            "label": "Antioquia\t-\tBriceno",
            "value": "5107"
          }, {
            "label": "Antioquia\t-\tBuritica",
            "value": "5113"
          }, {
            "label": "Antioquia\t-\tCaceres",
            "value": "5120"
          }, {
            "label": "Antioquia\t-\tCaicedo",
            "value": "5125"
          }, {
            "label": "Antioquia\t-\tCaldas",
            "value": "5129"
          }, {
            "label": "Antioquia\t-\tCampamento",
            "value": "5134"
          }, {
            "label": "Antioquia\t-\tCanasgordas",
            "value": "5138"
          }, {
            "label": "Antioquia\t-\tCaracoli",
            "value": "5142"
          }, {
            "label": "Antioquia\t-\tCaramanta",
            "value": "5145"
          }, {
            "label": "Antioquia\t-\tCarepa",
            "value": "5147"
          }, {
            "label": "Antioquia\t-\tCarolina",
            "value": "5150"
          }, {
            "label": "Antioquia\t-\tCaucasia",
            "value": "5154"
          }, {
            "label": "Antioquia\t-\tChigorodo",
            "value": "5172"
          }, {
            "label": "Antioquia\t-\tCisneros",
            "value": "5190"
          }, {
            "label": "Antioquia\t-\tCiudad Bolivar",
            "value": "5101"
          }, {
            "label": "Antioquia\t-\tCocorna",
            "value": "5197"
          }, {
            "label": "Antioquia\t-\tConcepcion",
            "value": "5206"
          }, {
            "label": "Antioquia\t-\tConcordia",
            "value": "5209"
          }, {
            "label": "Antioquia\t-\tCopacabana",
            "value": "5212"
          }, {
            "label": "Antioquia\t-\tDabeiba",
            "value": "5234"
          }, {
            "label": "Antioquia\t-\tDonmatias",
            "value": "5237"
          }, {
            "label": "Antioquia\t-\tEbejico",
            "value": "5240"
          }, {
            "label": "Antioquia\t-\tEl Bagre",
            "value": "5250"
          }, {
            "label": "Antioquia\t-\tEl Carmen De Viboral",
            "value": "5148"
          }, {
            "label": "Antioquia\t-\tEl Santuario",
            "value": "5697"
          }, {
            "label": "Antioquia\t-\tEntrerrios",
            "value": "5264"
          }, {
            "label": "Antioquia\t-\tEnvigado",
            "value": "5266"
          }, {
            "label": "Antioquia\t-\tFredonia",
            "value": "5282"
          }, {
            "label": "Antioquia\t-\tFrontino",
            "value": "5284"
          }, {
            "label": "Antioquia\t-\tGiraldo",
            "value": "5306"
          }, {
            "label": "Antioquia\t-\tGirardota",
            "value": "5308"
          }, {
            "label": "Antioquia\t-\tGomez Plata",
            "value": "5310"
          }, {
            "label": "Antioquia\t-\tGranada",
            "value": "5313"
          }, {
            "label": "Antioquia\t-\tGuadalupe",
            "value": "5315"
          }, {
            "label": "Antioquia\t-\tGuarne",
            "value": "5318"
          }, {
            "label": "Antioquia\t-\tGuatape",
            "value": "5321"
          }, {
            "label": "Antioquia\t-\tHeliconia",
            "value": "5347"
          }, {
            "label": "Antioquia\t-\tHispania",
            "value": "5353"
          }, {
            "label": "Antioquia\t-\tItag\u00fci",
            "value": "5360"
          }, {
            "label": "Antioquia\t-\tItuango",
            "value": "5361"
          }, {
            "label": "Antioquia\t-\tJardin",
            "value": "5364"
          }, {
            "label": "Antioquia\t-\tJerico",
            "value": "5368"
          }, {
            "label": "Antioquia\t-\tLa Ceja",
            "value": "5376"
          }, {
            "label": "Antioquia\t-\tLa Estrella",
            "value": "5380"
          }, {
            "label": "Antioquia\t-\tLa Pintada",
            "value": "5390"
          }, {
            "label": "Antioquia\t-\tLa Union",
            "value": "5400"
          }, {
            "label": "Antioquia\t-\tLiborina",
            "value": "5411"
          }, {
            "label": "Antioquia\t-\tMaceo",
            "value": "5425"
          }, {
            "label": "Antioquia\t-\tMarinilla",
            "value": "5440"
          }, {
            "label": "Antioquia\t-\tMedellin",
            "value": "5001"
          }, {
            "label": "Antioquia\t-\tMontebello",
            "value": "5467"
          }, {
            "label": "Antioquia\t-\tMurindo",
            "value": "5475"
          }, {
            "label": "Antioquia\t-\tMutata",
            "value": "5480"
          }, {
            "label": "Antioquia\t-\tNarino",
            "value": "5483"
          }, {
            "label": "Antioquia\t-\tNechi",
            "value": "5495"
          }, {
            "label": "Antioquia\t-\tNecocli",
            "value": "5490"
          }, {
            "label": "Antioquia\t-\tOlaya",
            "value": "5501"
          }, {
            "label": "Antioquia\t-\tPenol",
            "value": "5541"
          }, {
            "label": "Antioquia\t-\tPeque",
            "value": "5543"
          }, {
            "label": "Antioquia\t-\tPueblorrico",
            "value": "5576"
          }, {
            "label": "Antioquia\t-\tPuerto Berrio",
            "value": "5579"
          }, {
            "label": "Antioquia\t-\tPuerto Nare",
            "value": "5585"
          }, {
            "label": "Antioquia\t-\tPuerto Triunfo",
            "value": "5591"
          }, {
            "label": "Antioquia\t-\tRemedios",
            "value": "5604"
          }, {
            "label": "Antioquia\t-\tRetiro",
            "value": "5607"
          }, {
            "label": "Antioquia\t-\tRionegro",
            "value": "5615"
          }, {
            "label": "Antioquia\t-\tSabanalarga",
            "value": "5628"
          }, {
            "label": "Antioquia\t-\tSabaneta",
            "value": "5631"
          }, {
            "label": "Antioquia\t-\tSalgar",
            "value": "5642"
          }, {
            "label": "Antioquia\t-\tSan Andres De Cuerquia",
            "value": "5647"
          }, {
            "label": "Antioquia\t-\tSan Carlos",
            "value": "5649"
          }, {
            "label": "Antioquia\t-\tSan Francisco",
            "value": "5652"
          }, {
            "label": "Antioquia\t-\tSan Jeronimo",
            "value": "5656"
          }, {
            "label": "Antioquia\t-\tSan Jose De La Montana",
            "value": "5658"
          }, {
            "label": "Antioquia\t-\tSan Juan De Uraba",
            "value": "5659"
          }, {
            "label": "Antioquia\t-\tSan Luis",
            "value": "5660"
          }, {
            "label": "Antioquia\t-\tSan Pedro De Los Milagros",
            "value": "5664"
          }, {
            "label": "Antioquia\t-\tSan Pedro De Uraba",
            "value": "5665"
          }, {
            "label": "Antioquia\t-\tSan Rafael",
            "value": "5667"
          }, {
            "label": "Antioquia\t-\tSan Roque",
            "value": "5670"
          }, {
            "label": "Antioquia\t-\tSan Vicente Ferrer",
            "value": "5674"
          }, {
            "label": "Antioquia\t-\tSanta Barbara",
            "value": "5679"
          }, {
            "label": "Antioquia\t-\tSanta Fe De Antioquia",
            "value": "5042"
          }, {
            "label": "Antioquia\t-\tSanta Rosa De Osos",
            "value": "5686"
          }, {
            "label": "Antioquia\t-\tSanto Domingo",
            "value": "5690"
          }, {
            "label": "Antioquia\t-\tSegovia",
            "value": "5736"
          }, {
            "label": "Antioquia\t-\tSonson",
            "value": "5756"
          }, {
            "label": "Antioquia\t-\tSopetran",
            "value": "5761"
          }, {
            "label": "Antioquia\t-\tTamesis",
            "value": "5789"
          }, {
            "label": "Antioquia\t-\tTaraza",
            "value": "5790"
          }, {
            "label": "Antioquia\t-\tTarso",
            "value": "5792"
          }, {
            "label": "Antioquia\t-\tTitiribi",
            "value": "5809"
          }, {
            "label": "Antioquia\t-\tToledo",
            "value": "5819"
          }, {
            "label": "Antioquia\t-\tTurbo",
            "value": "5837"
          }, {
            "label": "Antioquia\t-\tUramita",
            "value": "5842"
          }, {
            "label": "Antioquia\t-\tUrrao",
            "value": "5847"
          }, {
            "label": "Antioquia\t-\tValdivia",
            "value": "5854"
          }, {
            "label": "Antioquia\t-\tValparaiso",
            "value": "5856"
          }, {
            "label": "Antioquia\t-\tVegachi",
            "value": "5858"
          }, {
            "label": "Antioquia\t-\tVenecia",
            "value": "5861"
          }, {
            "label": "Antioquia\t-\tVigia Del Fuerte",
            "value": "5873"
          }, {
            "label": "Antioquia\t-\tYali",
            "value": "5885"
          }, {
            "label": "Antioquia\t-\tYarumal",
            "value": "5887"
          }, {
            "label": "Antioquia\t-\tYolombo",
            "value": "5890"
          }, {
            "label": "Antioquia\t-\tYondo",
            "value": "5893"
          }, {
            "label": "Antioquia\t-\tZaragoza",
            "value": "5895"
          }, {
            "label": "Arauca\t-\tArauca",
            "value": "81001"
          }, {
            "label": "Arauca\t-\tArauquita",
            "value": "81065"
          }, {
            "label": "Arauca\t-\tCravo Norte",
            "value": "81220"
          }, {
            "label": "Arauca\t-\tFortul",
            "value": "81300"
          }, {
            "label": "Arauca\t-\tPuerto Rondon",
            "value": "81591"
          }, {
            "label": "Arauca\t-\tSaravena",
            "value": "81736"
          }, {
            "label": "Arauca\t-\tTame",
            "value": "81794"
          }, {
            "label": "Archipielago De San Andres y Providencia\t-\tProvidencia",
            "value": "88564"
          }, {
            "label": "Archipielago De San Andres y Providencia\t-\tSan Andres",
            "value": "88001"
          }, {
            "label": "Atlantico\t-\tBaranoa",
            "value": "8078"
          }, {
            "label": "Atlantico\t-\tBarranquilla",
            "value": "8001"
          }, {
            "label": "Atlantico\t-\tCampo De La Cruz",
            "value": "8137"
          }, {
            "label": "Atlantico\t-\tCandelaria",
            "value": "8141"
          }, {
            "label": "Atlantico\t-\tGalapa",
            "value": "8296"
          }, {
            "label": "Atlantico\t-\tJuan De Acosta",
            "value": "8372"
          }, {
            "label": "Atlantico\t-\tLuruaco",
            "value": "8421"
          }, {
            "label": "Atlantico\t-\tMalambo",
            "value": "8433"
          }, {
            "label": "Atlantico\t-\tManati",
            "value": "8436"
          }, {
            "label": "Atlantico\t-\tPalmar De Varela",
            "value": "8520"
          }, {
            "label": "Atlantico\t-\tPiojo",
            "value": "8549"
          }, {
            "label": "Atlantico\t-\tPolonuevo",
            "value": "8558"
          }, {
            "label": "Atlantico\t-\tPonedera",
            "value": "8560"
          }, {
            "label": "Atlantico\t-\tPuerto Colombia",
            "value": "8573"
          }, {
            "label": "Atlantico\t-\tRepelon",
            "value": "8606"
          }, {
            "label": "Atlantico\t-\tSabanagrande",
            "value": "8634"
          }, {
            "label": "Atlantico\t-\tSabanalarga",
            "value": "8638"
          }, {
            "label": "Atlantico\t-\tSanta Lucia",
            "value": "8675"
          }, {
            "label": "Atlantico\t-\tSanto Tomas",
            "value": "8685"
          }, {
            "label": "Atlantico\t-\tSoledad",
            "value": "8758"
          }, {
            "label": "Atlantico\t-\tSuan",
            "value": "8770"
          }, {
            "label": "Atlantico\t-\tTubara",
            "value": "8832"
          }, {
            "label": "Atlantico\t-\tUsiacuri",
            "value": "8849"
          }, {
            "label": "Bogota, D. C.\t-\tBogota, D.C.",
            "value": "11001"
          }, {
            "label": "Bolivar\t-\tAchi",
            "value": "13006"
          }, {
            "label": "Bolivar\t-\tAltos Del Rosario",
            "value": "13030"
          }, {
            "label": "Bolivar\t-\tArenal",
            "value": "13042"
          }, {
            "label": "Bolivar\t-\tArjona",
            "value": "13052"
          }, {
            "label": "Bolivar\t-\tArroyohondo",
            "value": "13062"
          }, {
            "label": "Bolivar\t-\tBarranco De Loba",
            "value": "13074"
          }, {
            "label": "Bolivar\t-\tCalamar",
            "value": "13140"
          }, {
            "label": "Bolivar\t-\tCantagallo",
            "value": "13160"
          }, {
            "label": "Bolivar\t-\tCartagena De Indias",
            "value": "13001"
          }, {
            "label": "Bolivar\t-\tCicuco",
            "value": "13188"
          }, {
            "label": "Bolivar\t-\tClemencia",
            "value": "13222"
          }, {
            "label": "Bolivar\t-\tCordoba",
            "value": "13212"
          }, {
            "label": "Bolivar\t-\tEl Carmen De Bolivar",
            "value": "13244"
          }, {
            "label": "Bolivar\t-\tEl Guamo",
            "value": "13248"
          }, {
            "label": "Bolivar\t-\tEl Penon",
            "value": "13268"
          }, {
            "label": "Bolivar\t-\tHatillo De Loba",
            "value": "13300"
          }, {
            "label": "Bolivar\t-\tMagangue",
            "value": "13430"
          }, {
            "label": "Bolivar\t-\tMahates",
            "value": "13433"
          }, {
            "label": "Bolivar\t-\tMargarita",
            "value": "13440"
          }, {
            "label": "Bolivar\t-\tMaria La Baja",
            "value": "13442"
          }, {
            "label": "Bolivar\t-\tMompos",
            "value": "13468"
          }, {
            "label": "Bolivar\t-\tMontecristo",
            "value": "13458"
          }, {
            "label": "Bolivar\t-\tMorales",
            "value": "13473"
          }, {
            "label": "Bolivar\t-\tNorosi",
            "value": "13490"
          }, {
            "label": "Bolivar\t-\tPinillos",
            "value": "13549"
          }, {
            "label": "Bolivar\t-\tRegidor",
            "value": "13580"
          }, {
            "label": "Bolivar\t-\tRio Viejo",
            "value": "13600"
          }, {
            "label": "Bolivar\t-\tSan Cristobal",
            "value": "13620"
          }, {
            "label": "Bolivar\t-\tSan Estanislao",
            "value": "13647"
          }, {
            "label": "Bolivar\t-\tSan Fernando",
            "value": "13650"
          }, {
            "label": "Bolivar\t-\tSan Jacinto",
            "value": "13654"
          }, {
            "label": "Bolivar\t-\tSan Jacinto Del Cauca",
            "value": "13655"
          }, {
            "label": "Bolivar\t-\tSan Juan Nepomuceno",
            "value": "13657"
          }, {
            "label": "Bolivar\t-\tSan Martin De Loba",
            "value": "13667"
          }, {
            "label": "Bolivar\t-\tSan Pablo",
            "value": "13670"
          }, {
            "label": "Bolivar\t-\tSanta Catalina",
            "value": "13673"
          }, {
            "label": "Bolivar\t-\tSanta Rosa",
            "value": "13683"
          }, {
            "label": "Bolivar\t-\tSanta Rosa Del Sur",
            "value": "13688"
          }, {
            "label": "Bolivar\t-\tSimiti",
            "value": "13744"
          }, {
            "label": "Bolivar\t-\tSoplaviento",
            "value": "13760"
          }, {
            "label": "Bolivar\t-\tTalaigua Nuevo",
            "value": "13780"
          }, {
            "label": "Bolivar\t-\tTiquisio",
            "value": "13810"
          }, {
            "label": "Bolivar\t-\tTurbaco",
            "value": "13836"
          }, {
            "label": "Bolivar\t-\tTurbana",
            "value": "13838"
          }, {
            "label": "Bolivar\t-\tVillanueva",
            "value": "13873"
          }, {
            "label": "Bolivar\t-\tZambrano",
            "value": "13894"
          }, {
            "label": "Boyaca\t-\tAlmeida",
            "value": "15022"
          }, {
            "label": "Boyaca\t-\tAquitania",
            "value": "15047"
          }, {
            "label": "Boyaca\t-\tArcabuco",
            "value": "15051"
          }, {
            "label": "Boyaca\t-\tBelen",
            "value": "15087"
          }, {
            "label": "Boyaca\t-\tBerbeo",
            "value": "15090"
          }, {
            "label": "Boyaca\t-\tBeteitiva",
            "value": "15092"
          }, {
            "label": "Boyaca\t-\tBoavita",
            "value": "15097"
          }, {
            "label": "Boyaca\t-\tBoyaca",
            "value": "15104"
          }, {
            "label": "Boyaca\t-\tBriceno",
            "value": "15106"
          }, {
            "label": "Boyaca\t-\tBuenavista",
            "value": "15109"
          }, {
            "label": "Boyaca\t-\tBusbanza",
            "value": "15114"
          }, {
            "label": "Boyaca\t-\tCaldas",
            "value": "15131"
          }, {
            "label": "Boyaca\t-\tCampohermoso",
            "value": "15135"
          }, {
            "label": "Boyaca\t-\tCerinza",
            "value": "15162"
          }, {
            "label": "Boyaca\t-\tChinavita",
            "value": "15172"
          }, {
            "label": "Boyaca\t-\tChiquinquira",
            "value": "15176"
          }, {
            "label": "Boyaca\t-\tChiquiza",
            "value": "15232"
          }, {
            "label": "Boyaca\t-\tChiscas",
            "value": "15180"
          }, {
            "label": "Boyaca\t-\tChita",
            "value": "15183"
          }, {
            "label": "Boyaca\t-\tChitaraque",
            "value": "15185"
          }, {
            "label": "Boyaca\t-\tChivata",
            "value": "15187"
          }, {
            "label": "Boyaca\t-\tChivor",
            "value": "15236"
          }, {
            "label": "Boyaca\t-\tCienega",
            "value": "15189"
          }, {
            "label": "Boyaca\t-\tCombita",
            "value": "15204"
          }, {
            "label": "Boyaca\t-\tCoper",
            "value": "15212"
          }, {
            "label": "Boyaca\t-\tCorrales",
            "value": "15215"
          }, {
            "label": "Boyaca\t-\tCovarachia",
            "value": "15218"
          }, {
            "label": "Boyaca\t-\tCubara",
            "value": "15223"
          }, {
            "label": "Boyaca\t-\tCucaita",
            "value": "15224"
          }, {
            "label": "Boyaca\t-\tCuitiva",
            "value": "15226"
          }, {
            "label": "Boyaca\t-\tDuitama",
            "value": "15238"
          }, {
            "label": "Boyaca\t-\tEl Cocuy",
            "value": "15244"
          }, {
            "label": "Boyaca\t-\tEl Espino",
            "value": "15248"
          }, {
            "label": "Boyaca\t-\tFiravitoba",
            "value": "15272"
          }, {
            "label": "Boyaca\t-\tFloresta",
            "value": "15276"
          }, {
            "label": "Boyaca\t-\tGachantiva",
            "value": "15293"
          }, {
            "label": "Boyaca\t-\tGameza",
            "value": "15296"
          }, {
            "label": "Boyaca\t-\tGaragoa",
            "value": "15299"
          }, {
            "label": "Boyaca\t-\tGuacamayas",
            "value": "15317"
          }, {
            "label": "Boyaca\t-\tGuateque",
            "value": "15322"
          }, {
            "label": "Boyaca\t-\tGuayata",
            "value": "15325"
          }, {
            "label": "Boyaca\t-\tG\u00fcican De La Sierra",
            "value": "15332"
          }, {
            "label": "Boyaca\t-\tIza",
            "value": "15362"
          }, {
            "label": "Boyaca\t-\tJenesano",
            "value": "15367"
          }, {
            "label": "Boyaca\t-\tJerico",
            "value": "15368"
          }, {
            "label": "Boyaca\t-\tLa Capilla",
            "value": "15380"
          }, {
            "label": "Boyaca\t-\tLa Uvita",
            "value": "15403"
          }, {
            "label": "Boyaca\t-\tLa Victoria",
            "value": "15401"
          }, {
            "label": "Boyaca\t-\tLabranzagrande",
            "value": "15377"
          }, {
            "label": "Boyaca\t-\tMacanal",
            "value": "15425"
          }, {
            "label": "Boyaca\t-\tMaripi",
            "value": "15442"
          }, {
            "label": "Boyaca\t-\tMiraflores",
            "value": "15455"
          }, {
            "label": "Boyaca\t-\tMongua",
            "value": "15464"
          }, {
            "label": "Boyaca\t-\tMongui",
            "value": "15466"
          }, {
            "label": "Boyaca\t-\tMoniquira",
            "value": "15469"
          }, {
            "label": "Boyaca\t-\tMotavita",
            "value": "15476"
          }, {
            "label": "Boyaca\t-\tMuzo",
            "value": "15480"
          }, {
            "label": "Boyaca\t-\tNobsa",
            "value": "15491"
          }, {
            "label": "Boyaca\t-\tNuevo Colon",
            "value": "15494"
          }, {
            "label": "Boyaca\t-\tOicata",
            "value": "15500"
          }, {
            "label": "Boyaca\t-\tOtanche",
            "value": "15507"
          }, {
            "label": "Boyaca\t-\tPachavita",
            "value": "15511"
          }, {
            "label": "Boyaca\t-\tPaez",
            "value": "15514"
          }, {
            "label": "Boyaca\t-\tPaipa",
            "value": "15516"
          }, {
            "label": "Boyaca\t-\tPajarito",
            "value": "15518"
          }, {
            "label": "Boyaca\t-\tPanqueba",
            "value": "15522"
          }, {
            "label": "Boyaca\t-\tPauna",
            "value": "15531"
          }, {
            "label": "Boyaca\t-\tPaya",
            "value": "15533"
          }, {
            "label": "Boyaca\t-\tPaz De Rio",
            "value": "15537"
          }, {
            "label": "Boyaca\t-\tPesca",
            "value": "15542"
          }, {
            "label": "Boyaca\t-\tPisba",
            "value": "15550"
          }, {
            "label": "Boyaca\t-\tPuerto Boyaca",
            "value": "15572"
          }, {
            "label": "Boyaca\t-\tQuipama",
            "value": "15580"
          }, {
            "label": "Boyaca\t-\tRamiriqui",
            "value": "15599"
          }, {
            "label": "Boyaca\t-\tRaquira",
            "value": "15600"
          }, {
            "label": "Boyaca\t-\tRondon",
            "value": "15621"
          }, {
            "label": "Boyaca\t-\tSaboya",
            "value": "15632"
          }, {
            "label": "Boyaca\t-\tSachica",
            "value": "15638"
          }, {
            "label": "Boyaca\t-\tSamaca",
            "value": "15646"
          }, {
            "label": "Boyaca\t-\tSan Eduardo",
            "value": "15660"
          }, {
            "label": "Boyaca\t-\tSan Jose De Pare",
            "value": "15664"
          }, {
            "label": "Boyaca\t-\tSan Luis De Gaceno",
            "value": "15667"
          }, {
            "label": "Boyaca\t-\tSan Mateo",
            "value": "15673"
          }, {
            "label": "Boyaca\t-\tSan Miguel De Sema",
            "value": "15676"
          }, {
            "label": "Boyaca\t-\tSan Pablo De Borbur",
            "value": "15681"
          }, {
            "label": "Boyaca\t-\tSanta Maria",
            "value": "15690"
          }, {
            "label": "Boyaca\t-\tSanta Rosa De Viterbo",
            "value": "15693"
          }, {
            "label": "Boyaca\t-\tSanta Sofia",
            "value": "15696"
          }, {
            "label": "Boyaca\t-\tSantana",
            "value": "15686"
          }, {
            "label": "Boyaca\t-\tSativanorte",
            "value": "15720"
          }, {
            "label": "Boyaca\t-\tSativasur",
            "value": "15723"
          }, {
            "label": "Boyaca\t-\tSiachoque",
            "value": "15740"
          }, {
            "label": "Boyaca\t-\tSoata",
            "value": "15753"
          }, {
            "label": "Boyaca\t-\tSocha",
            "value": "15757"
          }, {
            "label": "Boyaca\t-\tSocota",
            "value": "15755"
          }, {
            "label": "Boyaca\t-\tSogamoso",
            "value": "15759"
          }, {
            "label": "Boyaca\t-\tSomondoco",
            "value": "15761"
          }, {
            "label": "Boyaca\t-\tSora",
            "value": "15762"
          }, {
            "label": "Boyaca\t-\tSoraca",
            "value": "15764"
          }, {
            "label": "Boyaca\t-\tSotaquira",
            "value": "15763"
          }, {
            "label": "Boyaca\t-\tSusacon",
            "value": "15774"
          }, {
            "label": "Boyaca\t-\tSutamarchan",
            "value": "15776"
          }, {
            "label": "Boyaca\t-\tSutatenza",
            "value": "15778"
          }, {
            "label": "Boyaca\t-\tTasco",
            "value": "15790"
          }, {
            "label": "Boyaca\t-\tTenza",
            "value": "15798"
          }, {
            "label": "Boyaca\t-\tTibana",
            "value": "15804"
          }, {
            "label": "Boyaca\t-\tTibasosa",
            "value": "15806"
          }, {
            "label": "Boyaca\t-\tTinjaca",
            "value": "15808"
          }, {
            "label": "Boyaca\t-\tTipacoque",
            "value": "15810"
          }, {
            "label": "Boyaca\t-\tToca",
            "value": "15814"
          }, {
            "label": "Boyaca\t-\tTog\u00fci",
            "value": "15816"
          }, {
            "label": "Boyaca\t-\tTopaga",
            "value": "15820"
          }, {
            "label": "Boyaca\t-\tTota",
            "value": "15822"
          }, {
            "label": "Boyaca\t-\tTunja",
            "value": "15001"
          }, {
            "label": "Boyaca\t-\tTunungua",
            "value": "15832"
          }, {
            "label": "Boyaca\t-\tTurmeque",
            "value": "15835"
          }, {
            "label": "Boyaca\t-\tTuta",
            "value": "15837"
          }, {
            "label": "Boyaca\t-\tTutaza",
            "value": "15839"
          }, {
            "label": "Boyaca\t-\tUmbita",
            "value": "15842"
          }, {
            "label": "Boyaca\t-\tVentaquemada",
            "value": "15861"
          }, {
            "label": "Boyaca\t-\tVilla De Leyva",
            "value": "15407"
          }, {
            "label": "Boyaca\t-\tViracacha",
            "value": "15879"
          }, {
            "label": "Boyaca\t-\tZetaquira",
            "value": "15897"
          }, {
            "label": "Caldas\t-\tAguadas",
            "value": "17013"
          }, {
            "label": "Caldas\t-\tAnserma",
            "value": "17042"
          }, {
            "label": "Caldas\t-\tAranzazu",
            "value": "17050"
          }, {
            "label": "Caldas\t-\tBelalcazar",
            "value": "17088"
          }, {
            "label": "Caldas\t-\tChinchina",
            "value": "17174"
          }, {
            "label": "Caldas\t-\tFiladelfia",
            "value": "17272"
          }, {
            "label": "Caldas\t-\tLa Dorada",
            "value": "17380"
          }, {
            "label": "Caldas\t-\tLa Merced",
            "value": "17388"
          }, {
            "label": "Caldas\t-\tManizales",
            "value": "17001"
          }, {
            "label": "Caldas\t-\tManzanares",
            "value": "17433"
          }, {
            "label": "Caldas\t-\tMarmato",
            "value": "17442"
          }, {
            "label": "Caldas\t-\tMarquetalia",
            "value": "17444"
          }, {
            "label": "Caldas\t-\tMarulanda",
            "value": "17446"
          }, {
            "label": "Caldas\t-\tNeira",
            "value": "17486"
          }, {
            "label": "Caldas\t-\tNorcasia",
            "value": "17495"
          }, {
            "label": "Caldas\t-\tPacora",
            "value": "17513"
          }, {
            "label": "Caldas\t-\tPalestina",
            "value": "17524"
          }, {
            "label": "Caldas\t-\tPensilvania",
            "value": "17541"
          }, {
            "label": "Caldas\t-\tRiosucio",
            "value": "17614"
          }, {
            "label": "Caldas\t-\tRisaralda",
            "value": "17616"
          }, {
            "label": "Caldas\t-\tSalamina",
            "value": "17653"
          }, {
            "label": "Caldas\t-\tSamana",
            "value": "17662"
          }, {
            "label": "Caldas\t-\tSan Jose",
            "value": "17665"
          }, {
            "label": "Caldas\t-\tSupia",
            "value": "17777"
          }, {
            "label": "Caldas\t-\tVictoria",
            "value": "17867"
          }, {
            "label": "Caldas\t-\tVillamaria",
            "value": "17873"
          }, {
            "label": "Caldas\t-\tViterbo",
            "value": "17877"
          }, {
            "label": "Caqueta\t-\tAlbania",
            "value": "18029"
          }, {
            "label": "Caqueta\t-\tBelen De Los Andaquies",
            "value": "18094"
          }, {
            "label": "Caqueta\t-\tCartagena Del Chaira",
            "value": "18150"
          }, {
            "label": "Caqueta\t-\tCurillo",
            "value": "18205"
          }, {
            "label": "Caqueta\t-\tEl Doncello",
            "value": "18247"
          }, {
            "label": "Caqueta\t-\tEl Paujil",
            "value": "18256"
          }, {
            "label": "Caqueta\t-\tFlorencia",
            "value": "18001"
          }, {
            "label": "Caqueta\t-\tLa Montanita",
            "value": "18410"
          }, {
            "label": "Caqueta\t-\tMilan",
            "value": "18460"
          }, {
            "label": "Caqueta\t-\tMorelia",
            "value": "18479"
          }, {
            "label": "Caqueta\t-\tPuerto Rico",
            "value": "18592"
          }, {
            "label": "Caqueta\t-\tSan Jose Del Fragua",
            "value": "18610"
          }, {
            "label": "Caqueta\t-\tSan Vicente Del Caguan",
            "value": "18753"
          }, {
            "label": "Caqueta\t-\tSolano",
            "value": "18756"
          }, {
            "label": "Caqueta\t-\tSolita",
            "value": "18785"
          }, {
            "label": "Caqueta\t-\tValparaiso",
            "value": "18860"
          }, {
            "label": "Casanare\t-\tAguazul",
            "value": "85010"
          }, {
            "label": "Casanare\t-\tChameza",
            "value": "85015"
          }, {
            "label": "Casanare\t-\tHato Corozal",
            "value": "85125"
          }, {
            "label": "Casanare\t-\tLa Salina",
            "value": "85136"
          }, {
            "label": "Casanare\t-\tMani",
            "value": "85139"
          }, {
            "label": "Casanare\t-\tMonterrey",
            "value": "85162"
          }, {
            "label": "Casanare\t-\tNunchia",
            "value": "85225"
          }, {
            "label": "Casanare\t-\tOrocue",
            "value": "85230"
          }, {
            "label": "Casanare\t-\tPaz De Ariporo",
            "value": "85250"
          }, {
            "label": "Casanare\t-\tPore",
            "value": "85263"
          }, {
            "label": "Casanare\t-\tRecetor",
            "value": "85279"
          }, {
            "label": "Casanare\t-\tSabanalarga",
            "value": "85300"
          }, {
            "label": "Casanare\t-\tSacama",
            "value": "85315"
          }, {
            "label": "Casanare\t-\tSan Luis De Palenque",
            "value": "85325"
          }, {
            "label": "Casanare\t-\tTamara",
            "value": "85400"
          }, {
            "label": "Casanare\t-\tTauramena",
            "value": "85410"
          }, {
            "label": "Casanare\t-\tTrinidad",
            "value": "85430"
          }, {
            "label": "Casanare\t-\tVillanueva",
            "value": "85440"
          }, {
            "label": "Casanare\t-\tYopal",
            "value": "85001"
          }, {
            "label": "Cauca\t-\tAlmaguer",
            "value": "19022"
          }, {
            "label": "Cauca\t-\tArgelia",
            "value": "19050"
          }, {
            "label": "Cauca\t-\tBalboa",
            "value": "19075"
          }, {
            "label": "Cauca\t-\tBolivar",
            "value": "19100"
          }, {
            "label": "Cauca\t-\tBuenos Aires",
            "value": "19110"
          }, {
            "label": "Cauca\t-\tCajibio",
            "value": "19130"
          }, {
            "label": "Cauca\t-\tCaldono",
            "value": "19137"
          }, {
            "label": "Cauca\t-\tCaloto",
            "value": "19142"
          }, {
            "label": "Cauca\t-\tCorinto",
            "value": "19212"
          }, {
            "label": "Cauca\t-\tEl Tambo",
            "value": "19256"
          }, {
            "label": "Cauca\t-\tFlorencia",
            "value": "19290"
          }, {
            "label": "Cauca\t-\tGuachene",
            "value": "19300"
          }, {
            "label": "Cauca\t-\tGuapi",
            "value": "19318"
          }, {
            "label": "Cauca\t-\tInza",
            "value": "19355"
          }, {
            "label": "Cauca\t-\tJambalo",
            "value": "19364"
          }, {
            "label": "Cauca\t-\tLa Sierra",
            "value": "19392"
          }, {
            "label": "Cauca\t-\tLa Vega",
            "value": "19397"
          }, {
            "label": "Cauca\t-\tLopez De Micay",
            "value": "19418"
          }, {
            "label": "Cauca\t-\tMercaderes",
            "value": "19450"
          }, {
            "label": "Cauca\t-\tMiranda",
            "value": "19455"
          }, {
            "label": "Cauca\t-\tMorales",
            "value": "19473"
          }, {
            "label": "Cauca\t-\tPadilla",
            "value": "19513"
          }, {
            "label": "Cauca\t-\tPaez",
            "value": "19517"
          }, {
            "label": "Cauca\t-\tPatia",
            "value": "19532"
          }, {
            "label": "Cauca\t-\tPiamonte",
            "value": "19533"
          }, {
            "label": "Cauca\t-\tPiendamo - Tunia",
            "value": "19548"
          }, {
            "label": "Cauca\t-\tPopayan",
            "value": "19001"
          }, {
            "label": "Cauca\t-\tPuerto Tejada",
            "value": "19573"
          }, {
            "label": "Cauca\t-\tPurace",
            "value": "19585"
          }, {
            "label": "Cauca\t-\tRosas",
            "value": "19622"
          }, {
            "label": "Cauca\t-\tSan Sebastian",
            "value": "19693"
          }, {
            "label": "Cauca\t-\tSanta Rosa",
            "value": "19701"
          }, {
            "label": "Cauca\t-\tSantander De Quilichao",
            "value": "19698"
          }, {
            "label": "Cauca\t-\tSilvia",
            "value": "19743"
          }, {
            "label": "Cauca\t-\tSotara",
            "value": "19760"
          }, {
            "label": "Cauca\t-\tSuarez",
            "value": "19780"
          }, {
            "label": "Cauca\t-\tSucre",
            "value": "19785"
          }, {
            "label": "Cauca\t-\tTimbio",
            "value": "19807"
          }, {
            "label": "Cauca\t-\tTimbiqui",
            "value": "19809"
          }, {
            "label": "Cauca\t-\tToribio",
            "value": "19821"
          }, {
            "label": "Cauca\t-\tTotoro",
            "value": "19824"
          }, {
            "label": "Cauca\t-\tVilla Rica",
            "value": "19845"
          }, {
            "label": "Cesar\t-\tAguachica",
            "value": "20011"
          }, {
            "label": "Cesar\t-\tAgustin Codazzi",
            "value": "20013"
          }, {
            "label": "Cesar\t-\tAstrea",
            "value": "20032"
          }, {
            "label": "Cesar\t-\tBecerril",
            "value": "20045"
          }, {
            "label": "Cesar\t-\tBosconia",
            "value": "20060"
          }, {
            "label": "Cesar\t-\tChimichagua",
            "value": "20175"
          }, {
            "label": "Cesar\t-\tChiriguana",
            "value": "20178"
          }, {
            "label": "Cesar\t-\tCurumani",
            "value": "20228"
          }, {
            "label": "Cesar\t-\tEl Copey",
            "value": "20238"
          }, {
            "label": "Cesar\t-\tEl Paso",
            "value": "20250"
          }, {
            "label": "Cesar\t-\tGamarra",
            "value": "20295"
          }, {
            "label": "Cesar\t-\tGonzalez",
            "value": "20310"
          }, {
            "label": "Cesar\t-\tLa Gloria",
            "value": "20383"
          }, {
            "label": "Cesar\t-\tLa Jagua De Ibirico",
            "value": "20400"
          }, {
            "label": "Cesar\t-\tLa Paz",
            "value": "20621"
          }, {
            "label": "Cesar\t-\tManaure Balcon Del Cesar",
            "value": "20443"
          }, {
            "label": "Cesar\t-\tPailitas",
            "value": "20517"
          }, {
            "label": "Cesar\t-\tPelaya",
            "value": "20550"
          }, {
            "label": "Cesar\t-\tPueblo Bello",
            "value": "20570"
          }, {
            "label": "Cesar\t-\tRio De Oro",
            "value": "20614"
          }, {
            "label": "Cesar\t-\tSan Alberto",
            "value": "20710"
          }, {
            "label": "Cesar\t-\tSan Diego",
            "value": "20750"
          }, {
            "label": "Cesar\t-\tSan Martin",
            "value": "20770"
          }, {
            "label": "Cesar\t-\tTamalameque",
            "value": "20787"
          }, {
            "label": "Cesar\t-\tValledupar",
            "value": "20001"
          }, {
            "label": "Choco\t-\tAcandi",
            "value": "27006"
          }, {
            "label": "Choco\t-\tAlto Baudo",
            "value": "27025"
          }, {
            "label": "Choco\t-\tAtrato",
            "value": "27050"
          }, {
            "label": "Choco\t-\tBagado",
            "value": "27073"
          }, {
            "label": "Choco\t-\tBahia Solano",
            "value": "27075"
          }, {
            "label": "Choco\t-\tBajo Baudo",
            "value": "27077"
          }, {
            "label": "Choco\t-\tBojaya",
            "value": "27099"
          }, {
            "label": "Choco\t-\tCarmen Del Darien",
            "value": "27150"
          }, {
            "label": "Choco\t-\tCertegui",
            "value": "27160"
          }, {
            "label": "Choco\t-\tCondoto",
            "value": "27205"
          }, {
            "label": "Choco\t-\tEl Canton Del San Pablo",
            "value": "27135"
          }, {
            "label": "Choco\t-\tEl Carmen De Atrato",
            "value": "27245"
          }, {
            "label": "Choco\t-\tEl Litoral Del San Juan",
            "value": "27250"
          }, {
            "label": "Choco\t-\tIstmina",
            "value": "27361"
          }, {
            "label": "Choco\t-\tJurado",
            "value": "27372"
          }, {
            "label": "Choco\t-\tLloro",
            "value": "27413"
          }, {
            "label": "Choco\t-\tMedio Atrato",
            "value": "27425"
          }, {
            "label": "Choco\t-\tMedio Baudo",
            "value": "27430"
          }, {
            "label": "Choco\t-\tMedio San Juan",
            "value": "27450"
          }, {
            "label": "Choco\t-\tNovita",
            "value": "27491"
          }, {
            "label": "Choco\t-\tNuqui",
            "value": "27495"
          }, {
            "label": "Choco\t-\tQuibdo",
            "value": "27001"
          }, {
            "label": "Choco\t-\tRio Iro",
            "value": "27580"
          }, {
            "label": "Choco\t-\tRio Quito",
            "value": "27600"
          }, {
            "label": "Choco\t-\tRiosucio",
            "value": "27615"
          }, {
            "label": "Choco\t-\tSan Jose Del Palmar",
            "value": "27660"
          }, {
            "label": "Choco\t-\tSipi",
            "value": "27745"
          }, {
            "label": "Choco\t-\tTado",
            "value": "27787"
          }, {
            "label": "Choco\t-\tUnguia",
            "value": "27800"
          }, {
            "label": "Choco\t-\tUnion Panamericana",
            "value": "27810"
          }, {
            "label": "Cordoba\t-\tAyapel",
            "value": "23068"
          }, {
            "label": "Cordoba\t-\tBuenavista",
            "value": "23079"
          }, {
            "label": "Cordoba\t-\tCanalete",
            "value": "23090"
          }, {
            "label": "Cordoba\t-\tCerete",
            "value": "23162"
          }, {
            "label": "Cordoba\t-\tChima",
            "value": "23168"
          }, {
            "label": "Cordoba\t-\tChinu",
            "value": "23182"
          }, {
            "label": "Cordoba\t-\tCienaga De Oro",
            "value": "23189"
          }, {
            "label": "Cordoba\t-\tCotorra",
            "value": "23300"
          }, {
            "label": "Cordoba\t-\tLa Apartada",
            "value": "23350"
          }, {
            "label": "Cordoba\t-\tLorica",
            "value": "23417"
          }, {
            "label": "Cordoba\t-\tLos Cordobas",
            "value": "23419"
          }, {
            "label": "Cordoba\t-\tMomil",
            "value": "23464"
          }, {
            "label": "Cordoba\t-\tMonitos",
            "value": "23500"
          }, {
            "label": "Cordoba\t-\tMontelibano",
            "value": "23466"
          }, {
            "label": "Cordoba\t-\tMonteria",
            "value": "23001"
          }, {
            "label": "Cordoba\t-\tPlaneta Rica",
            "value": "23555"
          }, {
            "label": "Cordoba\t-\tPueblo Nuevo",
            "value": "23570"
          }, {
            "label": "Cordoba\t-\tPuerto Escondido",
            "value": "23574"
          }, {
            "label": "Cordoba\t-\tPuerto Libertador",
            "value": "23580"
          }, {
            "label": "Cordoba\t-\tPurisima De La Concepcion",
            "value": "23586"
          }, {
            "label": "Cordoba\t-\tSahagun",
            "value": "23660"
          }, {
            "label": "Cordoba\t-\tSan Andres De Sotavento",
            "value": "23670"
          }, {
            "label": "Cordoba\t-\tSan Antero",
            "value": "23672"
          }, {
            "label": "Cordoba\t-\tSan Bernardo Del Viento",
            "value": "23675"
          }, {
            "label": "Cordoba\t-\tSan Carlos",
            "value": "23678"
          }, {
            "label": "Cordoba\t-\tSan Jose De Ure",
            "value": "23682"
          }, {
            "label": "Cordoba\t-\tSan Pelayo",
            "value": "23686"
          }, {
            "label": "Cordoba\t-\tTierralta",
            "value": "23807"
          }, {
            "label": "Cordoba\t-\tTuchin",
            "value": "23815"
          }, {
            "label": "Cordoba\t-\tValencia",
            "value": "23855"
          }, {
            "label": "Cundinamarca\t-\tAgua De Dios",
            "value": "25001"
          }, {
            "label": "Cundinamarca\t-\tAlban",
            "value": "25019"
          }, {
            "label": "Cundinamarca\t-\tAnapoima",
            "value": "25035"
          }, {
            "label": "Cundinamarca\t-\tAnolaima",
            "value": "25040"
          }, {
            "label": "Cundinamarca\t-\tApulo",
            "value": "25599"
          }, {
            "label": "Cundinamarca\t-\tArbelaez",
            "value": "25053"
          }, {
            "label": "Cundinamarca\t-\tBeltran",
            "value": "25086"
          }, {
            "label": "Cundinamarca\t-\tBituima",
            "value": "25095"
          }, {
            "label": "Cundinamarca\t-\tBojaca",
            "value": "25099"
          }, {
            "label": "Cundinamarca\t-\tCabrera",
            "value": "25120"
          }, {
            "label": "Cundinamarca\t-\tCachipay",
            "value": "25123"
          }, {
            "label": "Cundinamarca\t-\tCajica",
            "value": "25126"
          }, {
            "label": "Cundinamarca\t-\tCaparrapi",
            "value": "25148"
          }, {
            "label": "Cundinamarca\t-\tCaqueza",
            "value": "25151"
          }, {
            "label": "Cundinamarca\t-\tCarmen De Carupa",
            "value": "25154"
          }, {
            "label": "Cundinamarca\t-\tChaguani",
            "value": "25168"
          }, {
            "label": "Cundinamarca\t-\tChia",
            "value": "25175"
          }, {
            "label": "Cundinamarca\t-\tChipaque",
            "value": "25178"
          }, {
            "label": "Cundinamarca\t-\tChoachi",
            "value": "25181"
          }, {
            "label": "Cundinamarca\t-\tChoconta",
            "value": "25183"
          }, {
            "label": "Cundinamarca\t-\tCogua",
            "value": "25200"
          }, {
            "label": "Cundinamarca\t-\tCota",
            "value": "25214"
          }, {
            "label": "Cundinamarca\t-\tCucunuba",
            "value": "25224"
          }, {
            "label": "Cundinamarca\t-\tEl Colegio",
            "value": "25245"
          }, {
            "label": "Cundinamarca\t-\tEl Penon",
            "value": "25258"
          }, {
            "label": "Cundinamarca\t-\tEl Rosal",
            "value": "25260"
          }, {
            "label": "Cundinamarca\t-\tFacatativa",
            "value": "25269"
          }, {
            "label": "Cundinamarca\t-\tFomeque",
            "value": "25279"
          }, {
            "label": "Cundinamarca\t-\tFosca",
            "value": "25281"
          }, {
            "label": "Cundinamarca\t-\tFunza",
            "value": "25286"
          }, {
            "label": "Cundinamarca\t-\tFuquene",
            "value": "25288"
          }, {
            "label": "Cundinamarca\t-\tFusagasuga",
            "value": "25290"
          }, {
            "label": "Cundinamarca\t-\tGachala",
            "value": "25293"
          }, {
            "label": "Cundinamarca\t-\tGachancipa",
            "value": "25295"
          }, {
            "label": "Cundinamarca\t-\tGacheta",
            "value": "25297"
          }, {
            "label": "Cundinamarca\t-\tGama",
            "value": "25299"
          }, {
            "label": "Cundinamarca\t-\tGirardot",
            "value": "25307"
          }, {
            "label": "Cundinamarca\t-\tGranada",
            "value": "25312"
          }, {
            "label": "Cundinamarca\t-\tGuacheta",
            "value": "25317"
          }, {
            "label": "Cundinamarca\t-\tGuaduas",
            "value": "25320"
          }, {
            "label": "Cundinamarca\t-\tGuasca",
            "value": "25322"
          }, {
            "label": "Cundinamarca\t-\tGuataqui",
            "value": "25324"
          }, {
            "label": "Cundinamarca\t-\tGuatavita",
            "value": "25326"
          }, {
            "label": "Cundinamarca\t-\tGuayabal De Siquima",
            "value": "25328"
          }, {
            "label": "Cundinamarca\t-\tGuayabetal",
            "value": "25335"
          }, {
            "label": "Cundinamarca\t-\tGutierrez",
            "value": "25339"
          }, {
            "label": "Cundinamarca\t-\tJerusalen",
            "value": "25368"
          }, {
            "label": "Cundinamarca\t-\tJunin",
            "value": "25372"
          }, {
            "label": "Cundinamarca\t-\tLa Calera",
            "value": "25377"
          }, {
            "label": "Cundinamarca\t-\tLa Mesa",
            "value": "25386"
          }, {
            "label": "Cundinamarca\t-\tLa Palma",
            "value": "25394"
          }, {
            "label": "Cundinamarca\t-\tLa Pena",
            "value": "25398"
          }, {
            "label": "Cundinamarca\t-\tLa Vega",
            "value": "25402"
          }, {
            "label": "Cundinamarca\t-\tLenguazaque",
            "value": "25407"
          }, {
            "label": "Cundinamarca\t-\tMacheta",
            "value": "25426"
          }, {
            "label": "Cundinamarca\t-\tMadrid",
            "value": "25430"
          }, {
            "label": "Cundinamarca\t-\tManta",
            "value": "25436"
          }, {
            "label": "Cundinamarca\t-\tMedina",
            "value": "25438"
          }, {
            "label": "Cundinamarca\t-\tMosquera",
            "value": "25473"
          }, {
            "label": "Cundinamarca\t-\tNarino",
            "value": "25483"
          }, {
            "label": "Cundinamarca\t-\tNemocon",
            "value": "25486"
          }, {
            "label": "Cundinamarca\t-\tNilo",
            "value": "25488"
          }, {
            "label": "Cundinamarca\t-\tNimaima",
            "value": "25489"
          }, {
            "label": "Cundinamarca\t-\tNocaima",
            "value": "25491"
          }, {
            "label": "Cundinamarca\t-\tPacho",
            "value": "25513"
          }, {
            "label": "Cundinamarca\t-\tPaime",
            "value": "25518"
          }, {
            "label": "Cundinamarca\t-\tPandi",
            "value": "25524"
          }, {
            "label": "Cundinamarca\t-\tParatebueno",
            "value": "25530"
          }, {
            "label": "Cundinamarca\t-\tPasca",
            "value": "25535"
          }, {
            "label": "Cundinamarca\t-\tPuerto Salgar",
            "value": "25572"
          }, {
            "label": "Cundinamarca\t-\tPuli",
            "value": "25580"
          }, {
            "label": "Cundinamarca\t-\tQuebradanegra",
            "value": "25592"
          }, {
            "label": "Cundinamarca\t-\tQuetame",
            "value": "25594"
          }, {
            "label": "Cundinamarca\t-\tQuipile",
            "value": "25596"
          }, {
            "label": "Cundinamarca\t-\tRicaurte",
            "value": "25612"
          }, {
            "label": "Cundinamarca\t-\tSan Antonio Del Tequendama",
            "value": "25645"
          }, {
            "label": "Cundinamarca\t-\tSan Bernardo",
            "value": "25649"
          }, {
            "label": "Cundinamarca\t-\tSan Cayetano",
            "value": "25653"
          }, {
            "label": "Cundinamarca\t-\tSan Francisco",
            "value": "25658"
          }, {
            "label": "Cundinamarca\t-\tSan Juan De Rioseco",
            "value": "25662"
          }, {
            "label": "Cundinamarca\t-\tSasaima",
            "value": "25718"
          }, {
            "label": "Cundinamarca\t-\tSesquile",
            "value": "25736"
          }, {
            "label": "Cundinamarca\t-\tSibate",
            "value": "25740"
          }, {
            "label": "Cundinamarca\t-\tSilvania",
            "value": "25743"
          }, {
            "label": "Cundinamarca\t-\tSimijaca",
            "value": "25745"
          }, {
            "label": "Cundinamarca\t-\tSoacha",
            "value": "25754"
          }, {
            "label": "Cundinamarca\t-\tSopo",
            "value": "25758"
          }, {
            "label": "Cundinamarca\t-\tSubachoque",
            "value": "25769"
          }, {
            "label": "Cundinamarca\t-\tSuesca",
            "value": "25772"
          }, {
            "label": "Cundinamarca\t-\tSupata",
            "value": "25777"
          }, {
            "label": "Cundinamarca\t-\tSusa",
            "value": "25779"
          }, {
            "label": "Cundinamarca\t-\tSutatausa",
            "value": "25781"
          }, {
            "label": "Cundinamarca\t-\tTabio",
            "value": "25785"
          }, {
            "label": "Cundinamarca\t-\tTausa",
            "value": "25793"
          }, {
            "label": "Cundinamarca\t-\tTena",
            "value": "25797"
          }, {
            "label": "Cundinamarca\t-\tTenjo",
            "value": "25799"
          }, {
            "label": "Cundinamarca\t-\tTibacuy",
            "value": "25805"
          }, {
            "label": "Cundinamarca\t-\tTibirita",
            "value": "25807"
          }, {
            "label": "Cundinamarca\t-\tTocaima",
            "value": "25815"
          }, {
            "label": "Cundinamarca\t-\tTocancipa",
            "value": "25817"
          }, {
            "label": "Cundinamarca\t-\tTopaipi",
            "value": "25823"
          }, {
            "label": "Cundinamarca\t-\tUbala",
            "value": "25839"
          }, {
            "label": "Cundinamarca\t-\tUbaque",
            "value": "25841"
          }, {
            "label": "Cundinamarca\t-\tUne",
            "value": "25845"
          }, {
            "label": "Cundinamarca\t-\tUtica",
            "value": "25851"
          }, {
            "label": "Cundinamarca\t-\tVenecia",
            "value": "25506"
          }, {
            "label": "Cundinamarca\t-\tVergara",
            "value": "25862"
          }, {
            "label": "Cundinamarca\t-\tViani",
            "value": "25867"
          }, {
            "label": "Cundinamarca\t-\tVilla De San Diego De Ubate",
            "value": "25843"
          }, {
            "label": "Cundinamarca\t-\tVillagomez",
            "value": "25871"
          }, {
            "label": "Cundinamarca\t-\tVillapinzon",
            "value": "25873"
          }, {
            "label": "Cundinamarca\t-\tVilleta",
            "value": "25875"
          }, {
            "label": "Cundinamarca\t-\tViota",
            "value": "25878"
          }, {
            "label": "Cundinamarca\t-\tYacopi",
            "value": "25885"
          }, {
            "label": "Cundinamarca\t-\tZipacon",
            "value": "25898"
          }, {
            "label": "Cundinamarca\t-\tZipaquira",
            "value": "25899"
          }, {
            "label": "Guainia\t-\tBarranco Minas",
            "value": "94343"
          }, {
            "label": "Guainia\t-\tCacahual",
            "value": "94886"
          }, {
            "label": "Guainia\t-\tInirida",
            "value": "94001"
          }, {
            "label": "Guainia\t-\tLa Guadalupe",
            "value": "94885"
          }, {
            "label": "Guainia\t-\tMapiripana",
            "value": "94663"
          }, {
            "label": "Guainia\t-\tMorichal",
            "value": "94888"
          }, {
            "label": "Guainia\t-\tPana Pana",
            "value": "94887"
          }, {
            "label": "Guainia\t-\tPuerto Colombia",
            "value": "94884"
          }, {
            "label": "Guainia\t-\tSan Felipe",
            "value": "94883"
          }, {
            "label": "Guaviare\t-\tCalamar",
            "value": "95015"
          }, {
            "label": "Guaviare\t-\tEl Retorno",
            "value": "95025"
          }, {
            "label": "Guaviare\t-\tMiraflores",
            "value": "95200"
          }, {
            "label": "Guaviare\t-\tSan Jose Del Guaviare",
            "value": "95001"
          }, {
            "label": "Huila\t-\tAcevedo",
            "value": "41006"
          }, {
            "label": "Huila\t-\tAgrado",
            "value": "41013"
          }, {
            "label": "Huila\t-\tAipe",
            "value": "41016"
          }, {
            "label": "Huila\t-\tAlgeciras",
            "value": "41020"
          }, {
            "label": "Huila\t-\tAltamira",
            "value": "41026"
          }, {
            "label": "Huila\t-\tBaraya",
            "value": "41078"
          }, {
            "label": "Huila\t-\tCampoalegre",
            "value": "41132"
          }, {
            "label": "Huila\t-\tColombia",
            "value": "41206"
          }, {
            "label": "Huila\t-\tElias",
            "value": "41244"
          }, {
            "label": "Huila\t-\tGarzon",
            "value": "41298"
          }, {
            "label": "Huila\t-\tGigante",
            "value": "41306"
          }, {
            "label": "Huila\t-\tGuadalupe",
            "value": "41319"
          }, {
            "label": "Huila\t-\tHobo",
            "value": "41349"
          }, {
            "label": "Huila\t-\tIquira",
            "value": "41357"
          }, {
            "label": "Huila\t-\tIsnos",
            "value": "41359"
          }, {
            "label": "Huila\t-\tLa Argentina",
            "value": "41378"
          }, {
            "label": "Huila\t-\tLa Plata",
            "value": "41396"
          }, {
            "label": "Huila\t-\tNataga",
            "value": "41483"
          }, {
            "label": "Huila\t-\tNeiva",
            "value": "41001"
          }, {
            "label": "Huila\t-\tOporapa",
            "value": "41503"
          }, {
            "label": "Huila\t-\tPaicol",
            "value": "41518"
          }, {
            "label": "Huila\t-\tPalermo",
            "value": "41524"
          }, {
            "label": "Huila\t-\tPalestina",
            "value": "41530"
          }, {
            "label": "Huila\t-\tPital",
            "value": "41548"
          }, {
            "label": "Huila\t-\tPitalito",
            "value": "41551"
          }, {
            "label": "Huila\t-\tRivera",
            "value": "41615"
          }, {
            "label": "Huila\t-\tSaladoblanco",
            "value": "41660"
          }, {
            "label": "Huila\t-\tSan Agustin",
            "value": "41668"
          }, {
            "label": "Huila\t-\tSanta Maria",
            "value": "41676"
          }, {
            "label": "Huila\t-\tSuaza",
            "value": "41770"
          }, {
            "label": "Huila\t-\tTarqui",
            "value": "41791"
          }, {
            "label": "Huila\t-\tTello",
            "value": "41799"
          }, {
            "label": "Huila\t-\tTeruel",
            "value": "41801"
          }, {
            "label": "Huila\t-\tTesalia",
            "value": "41797"
          }, {
            "label": "Huila\t-\tTimana",
            "value": "41807"
          }, {
            "label": "Huila\t-\tVillavieja",
            "value": "41872"
          }, {
            "label": "Huila\t-\tYaguara",
            "value": "41885"
          }, {
            "label": "La Guajira\t-\tAlbania",
            "value": "44035"
          }, {
            "label": "La Guajira\t-\tBarrancas",
            "value": "44078"
          }, {
            "label": "La Guajira\t-\tDibulla",
            "value": "44090"
          }, {
            "label": "La Guajira\t-\tDistraccion",
            "value": "44098"
          }, {
            "label": "La Guajira\t-\tEl Molino",
            "value": "44110"
          }, {
            "label": "La Guajira\t-\tFonseca",
            "value": "44279"
          }, {
            "label": "La Guajira\t-\tHatonuevo",
            "value": "44378"
          }, {
            "label": "La Guajira\t-\tLa Jagua Del Pilar",
            "value": "44420"
          }, {
            "label": "La Guajira\t-\tMaicao",
            "value": "44430"
          }, {
            "label": "La Guajira\t-\tManaure",
            "value": "44560"
          }, {
            "label": "La Guajira\t-\tRiohacha",
            "value": "44001"
          }, {
            "label": "La Guajira\t-\tSan Juan Del Cesar",
            "value": "44650"
          }, {
            "label": "La Guajira\t-\tUribia",
            "value": "44847"
          }, {
            "label": "La Guajira\t-\tUrumita",
            "value": "44855"
          }, {
            "label": "La Guajira\t-\tVillanueva",
            "value": "44874"
          }, {
            "label": "Magdalena\t-\tAlgarrobo",
            "value": "47030"
          }, {
            "label": "Magdalena\t-\tAracataca",
            "value": "47053"
          }, {
            "label": "Magdalena\t-\tAriguani",
            "value": "47058"
          }, {
            "label": "Magdalena\t-\tCerro De San Antonio",
            "value": "47161"
          }, {
            "label": "Magdalena\t-\tChivolo",
            "value": "47170"
          }, {
            "label": "Magdalena\t-\tCienaga",
            "value": "47189"
          }, {
            "label": "Magdalena\t-\tConcordia",
            "value": "47205"
          }, {
            "label": "Magdalena\t-\tEl Banco",
            "value": "47245"
          }, {
            "label": "Magdalena\t-\tEl Pinon",
            "value": "47258"
          }, {
            "label": "Magdalena\t-\tEl Reten",
            "value": "47268"
          }, {
            "label": "Magdalena\t-\tFundacion",
            "value": "47288"
          }, {
            "label": "Magdalena\t-\tGuamal",
            "value": "47318"
          }, {
            "label": "Magdalena\t-\tNueva Granada",
            "value": "47460"
          }, {
            "label": "Magdalena\t-\tPedraza",
            "value": "47541"
          }, {
            "label": "Magdalena\t-\tPijino Del Carmen",
            "value": "47545"
          }, {
            "label": "Magdalena\t-\tPivijay",
            "value": "47551"
          }, {
            "label": "Magdalena\t-\tPlato",
            "value": "47555"
          }, {
            "label": "Magdalena\t-\tPuebloviejo",
            "value": "47570"
          }, {
            "label": "Magdalena\t-\tRemolino",
            "value": "47605"
          }, {
            "label": "Magdalena\t-\tSabanas De San Angel",
            "value": "47660"
          }, {
            "label": "Magdalena\t-\tSalamina",
            "value": "47675"
          }, {
            "label": "Magdalena\t-\tSan Sebastian De Buenavista",
            "value": "47692"
          }, {
            "label": "Magdalena\t-\tSan Zenon",
            "value": "47703"
          }, {
            "label": "Magdalena\t-\tSanta Ana",
            "value": "47707"
          }, {
            "label": "Magdalena\t-\tSanta Barbara De Pinto",
            "value": "47720"
          }, {
            "label": "Magdalena\t-\tSanta Marta",
            "value": "47001"
          }, {
            "label": "Magdalena\t-\tSitionuevo",
            "value": "47745"
          }, {
            "label": "Magdalena\t-\tTenerife",
            "value": "47798"
          }, {
            "label": "Magdalena\t-\tZapayan",
            "value": "47960"
          }, {
            "label": "Magdalena\t-\tZona Bananera",
            "value": "47980"
          }, {
            "label": "Meta\t-\tAcacias",
            "value": "50006"
          }, {
            "label": "Meta\t-\tBarranca De Upia",
            "value": "50110"
          }, {
            "label": "Meta\t-\tCabuyaro",
            "value": "50124"
          }, {
            "label": "Meta\t-\tCastilla La Nueva",
            "value": "50150"
          }, {
            "label": "Meta\t-\tCubarral",
            "value": "50223"
          }, {
            "label": "Meta\t-\tCumaral",
            "value": "50226"
          }, {
            "label": "Meta\t-\tEl Calvario",
            "value": "50245"
          }, {
            "label": "Meta\t-\tEl Castillo",
            "value": "50251"
          }, {
            "label": "Meta\t-\tEl Dorado",
            "value": "50270"
          }, {
            "label": "Meta\t-\tFuentedeoro",
            "value": "50287"
          }, {
            "label": "Meta\t-\tGranada",
            "value": "50313"
          }, {
            "label": "Meta\t-\tGuamal",
            "value": "50318"
          }, {
            "label": "Meta\t-\tLa Macarena",
            "value": "50350"
          }, {
            "label": "Meta\t-\tLejanias",
            "value": "50400"
          }, {
            "label": "Meta\t-\tMapiripan",
            "value": "50325"
          }, {
            "label": "Meta\t-\tMesetas",
            "value": "50330"
          }, {
            "label": "Meta\t-\tPuerto Concordia",
            "value": "50450"
          }, {
            "label": "Meta\t-\tPuerto Gaitan",
            "value": "50568"
          }, {
            "label": "Meta\t-\tPuerto Lleras",
            "value": "50577"
          }, {
            "label": "Meta\t-\tPuerto Lopez",
            "value": "50573"
          }, {
            "label": "Meta\t-\tPuerto Rico",
            "value": "50590"
          }, {
            "label": "Meta\t-\tRestrepo",
            "value": "50606"
          }, {
            "label": "Meta\t-\tSan Carlos De Guaroa",
            "value": "50680"
          }, {
            "label": "Meta\t-\tSan Juan De Arama",
            "value": "50683"
          }, {
            "label": "Meta\t-\tSan Juanito",
            "value": "50686"
          }, {
            "label": "Meta\t-\tSan Martin",
            "value": "50689"
          }, {
            "label": "Meta\t-\tUribe",
            "value": "50370"
          }, {
            "label": "Meta\t-\tVillavicencio",
            "value": "50001"
          }, {
            "label": "Meta\t-\tVistahermosa",
            "value": "50711"
          }, {
            "label": "Narino\t-\tAlban",
            "value": "52019"
          }, {
            "label": "Narino\t-\tAldana",
            "value": "52022"
          }, {
            "label": "Narino\t-\tAncuya",
            "value": "52036"
          }, {
            "label": "Narino\t-\tArboleda",
            "value": "52051"
          }, {
            "label": "Narino\t-\tBarbacoas",
            "value": "52079"
          }, {
            "label": "Narino\t-\tBelen",
            "value": "52083"
          }, {
            "label": "Narino\t-\tBuesaco",
            "value": "52110"
          }, {
            "label": "Narino\t-\tChachag\u00fci",
            "value": "52240"
          }, {
            "label": "Narino\t-\tColon",
            "value": "52203"
          }, {
            "label": "Narino\t-\tConsaca",
            "value": "52207"
          }, {
            "label": "Narino\t-\tContadero",
            "value": "52210"
          }, {
            "label": "Narino\t-\tCordoba",
            "value": "52215"
          }, {
            "label": "Narino\t-\tCuaspud",
            "value": "52224"
          }, {
            "label": "Narino\t-\tCumbal",
            "value": "52227"
          }, {
            "label": "Narino\t-\tCumbitara",
            "value": "52233"
          }, {
            "label": "Narino\t-\tEl Charco",
            "value": "52250"
          }, {
            "label": "Narino\t-\tEl Penol",
            "value": "52254"
          }, {
            "label": "Narino\t-\tEl Rosario",
            "value": "52256"
          }, {
            "label": "Narino\t-\tEl Tablon De Gomez",
            "value": "52258"
          }, {
            "label": "Narino\t-\tEl Tambo",
            "value": "52260"
          }, {
            "label": "Narino\t-\tFrancisco Pizarro",
            "value": "52520"
          }, {
            "label": "Narino\t-\tFunes",
            "value": "52287"
          }, {
            "label": "Narino\t-\tGuachucal",
            "value": "52317"
          }, {
            "label": "Narino\t-\tGuaitarilla",
            "value": "52320"
          }, {
            "label": "Narino\t-\tGualmatan",
            "value": "52323"
          }, {
            "label": "Narino\t-\tIles",
            "value": "52352"
          }, {
            "label": "Narino\t-\tImues",
            "value": "52354"
          }, {
            "label": "Narino\t-\tIpiales",
            "value": "52356"
          }, {
            "label": "Narino\t-\tLa Cruz",
            "value": "52378"
          }, {
            "label": "Narino\t-\tLa Florida",
            "value": "52381"
          }, {
            "label": "Narino\t-\tLa Llanada",
            "value": "52385"
          }, {
            "label": "Narino\t-\tLa Tola",
            "value": "52390"
          }, {
            "label": "Narino\t-\tLa Union",
            "value": "52399"
          }, {
            "label": "Narino\t-\tLeiva",
            "value": "52405"
          }, {
            "label": "Narino\t-\tLinares",
            "value": "52411"
          }, {
            "label": "Narino\t-\tLos Andes",
            "value": "52418"
          }, {
            "label": "Narino\t-\tMag\u00fci",
            "value": "52427"
          }, {
            "label": "Narino\t-\tMallama",
            "value": "52435"
          }, {
            "label": "Narino\t-\tMosquera",
            "value": "52473"
          }, {
            "label": "Narino\t-\tNarino",
            "value": "52480"
          }, {
            "label": "Narino\t-\tOlaya Herrera",
            "value": "52490"
          }, {
            "label": "Narino\t-\tOspina",
            "value": "52506"
          }, {
            "label": "Narino\t-\tPasto",
            "value": "52001"
          }, {
            "label": "Narino\t-\tPolicarpa",
            "value": "52540"
          }, {
            "label": "Narino\t-\tPotosi",
            "value": "52560"
          }, {
            "label": "Narino\t-\tProvidencia",
            "value": "52565"
          }, {
            "label": "Narino\t-\tPuerres",
            "value": "52573"
          }, {
            "label": "Narino\t-\tPupiales",
            "value": "52585"
          }, {
            "label": "Narino\t-\tRicaurte",
            "value": "52612"
          }, {
            "label": "Narino\t-\tRoberto Payan",
            "value": "52621"
          }, {
            "label": "Narino\t-\tSamaniego",
            "value": "52678"
          }, {
            "label": "Narino\t-\tSan Andres De Tumaco",
            "value": "52835"
          }, {
            "label": "Narino\t-\tSan Bernardo",
            "value": "52685"
          }, {
            "label": "Narino\t-\tSan Lorenzo",
            "value": "52687"
          }, {
            "label": "Narino\t-\tSan Pablo",
            "value": "52693"
          }, {
            "label": "Narino\t-\tSan Pedro De Cartago",
            "value": "52694"
          }, {
            "label": "Narino\t-\tSandona",
            "value": "52683"
          }, {
            "label": "Narino\t-\tSanta Barbara",
            "value": "52696"
          }, {
            "label": "Narino\t-\tSantacruz",
            "value": "52699"
          }, {
            "label": "Narino\t-\tSapuyes",
            "value": "52720"
          }, {
            "label": "Narino\t-\tTaminango",
            "value": "52786"
          }, {
            "label": "Narino\t-\tTangua",
            "value": "52788"
          }, {
            "label": "Narino\t-\tTuquerres",
            "value": "52838"
          }, {
            "label": "Narino\t-\tYacuanquer",
            "value": "52885"
          }, {
            "label": "Norte De Santander\t-\tAbrego",
            "value": "54003"
          }, {
            "label": "Norte De Santander\t-\tArboledas",
            "value": "54051"
          }, {
            "label": "Norte De Santander\t-\tBochalema",
            "value": "54099"
          }, {
            "label": "Norte De Santander\t-\tBucarasica",
            "value": "54109"
          }, {
            "label": "Norte De Santander\t-\tCachira",
            "value": "54128"
          }, {
            "label": "Norte De Santander\t-\tCacota",
            "value": "54125"
          }, {
            "label": "Norte De Santander\t-\tChinacota",
            "value": "54172"
          }, {
            "label": "Norte De Santander\t-\tChitaga",
            "value": "54174"
          }, {
            "label": "Norte De Santander\t-\tConvencion",
            "value": "54206"
          }, {
            "label": "Norte De Santander\t-\tCucuta",
            "value": "54001"
          }, {
            "label": "Norte De Santander\t-\tCucutilla",
            "value": "54223"
          }, {
            "label": "Norte De Santander\t-\tDurania",
            "value": "54239"
          }, {
            "label": "Norte De Santander\t-\tEl Carmen",
            "value": "54245"
          }, {
            "label": "Norte De Santander\t-\tEl Tarra",
            "value": "54250"
          }, {
            "label": "Norte De Santander\t-\tEl Zulia",
            "value": "54261"
          }, {
            "label": "Norte De Santander\t-\tGramalote",
            "value": "54313"
          }, {
            "label": "Norte De Santander\t-\tHacari",
            "value": "54344"
          }, {
            "label": "Norte De Santander\t-\tHerran",
            "value": "54347"
          }, {
            "label": "Norte De Santander\t-\tLa Esperanza",
            "value": "54385"
          }, {
            "label": "Norte De Santander\t-\tLa Playa",
            "value": "54398"
          }, {
            "label": "Norte De Santander\t-\tLabateca",
            "value": "54377"
          }, {
            "label": "Norte De Santander\t-\tLos Patios",
            "value": "54405"
          }, {
            "label": "Norte De Santander\t-\tLourdes",
            "value": "54418"
          }, {
            "label": "Norte De Santander\t-\tMutiscua",
            "value": "54480"
          }, {
            "label": "Norte De Santander\t-\tOcana",
            "value": "54498"
          }, {
            "label": "Norte De Santander\t-\tPamplona",
            "value": "54518"
          }, {
            "label": "Norte De Santander\t-\tPamplonita",
            "value": "54520"
          }, {
            "label": "Norte De Santander\t-\tPuerto Santander",
            "value": "54553"
          }, {
            "label": "Norte De Santander\t-\tRagonvalia",
            "value": "54599"
          }, {
            "label": "Norte De Santander\t-\tSalazar",
            "value": "54660"
          }, {
            "label": "Norte De Santander\t-\tSan Calixto",
            "value": "54670"
          }, {
            "label": "Norte De Santander\t-\tSan Cayetano",
            "value": "54673"
          }, {
            "label": "Norte De Santander\t-\tSantiago",
            "value": "54680"
          }, {
            "label": "Norte De Santander\t-\tSardinata",
            "value": "54720"
          }, {
            "label": "Norte De Santander\t-\tSilos",
            "value": "54743"
          }, {
            "label": "Norte De Santander\t-\tTeorama",
            "value": "54800"
          }, {
            "label": "Norte De Santander\t-\tTibu",
            "value": "54810"
          }, {
            "label": "Norte De Santander\t-\tToledo",
            "value": "54820"
          }, {
            "label": "Norte De Santander\t-\tVilla Caro",
            "value": "54871"
          }, {
            "label": "Norte De Santander\t-\tVilla Del Rosario",
            "value": "54874"
          }, {
            "label": "Putumayo\t-\tColon",
            "value": "86219"
          }, {
            "label": "Putumayo\t-\tMocoa",
            "value": "86001"
          }, {
            "label": "Putumayo\t-\tOrito",
            "value": "86320"
          }, {
            "label": "Putumayo\t-\tPuerto Asis",
            "value": "86568"
          }, {
            "label": "Putumayo\t-\tPuerto Caicedo",
            "value": "86569"
          }, {
            "label": "Putumayo\t-\tPuerto Guzman",
            "value": "86571"
          }, {
            "label": "Putumayo\t-\tPuerto Leguizamo",
            "value": "86573"
          }, {
            "label": "Putumayo\t-\tSan Francisco",
            "value": "86755"
          }, {
            "label": "Putumayo\t-\tSan Miguel",
            "value": "86757"
          }, {
            "label": "Putumayo\t-\tSantiago",
            "value": "86760"
          }, {
            "label": "Putumayo\t-\tSibundoy",
            "value": "86749"
          }, {
            "label": "Putumayo\t-\tValle Del Guamuez",
            "value": "86865"
          }, {
            "label": "Putumayo\t-\tVillagarzon",
            "value": "86885"
          }, {
            "label": "Quindio\t-\tArmenia",
            "value": "63001"
          }, {
            "label": "Quindio\t-\tBuenavista",
            "value": "63111"
          }, {
            "label": "Quindio\t-\tCalarca",
            "value": "63130"
          }, {
            "label": "Quindio\t-\tCircasia",
            "value": "63190"
          }, {
            "label": "Quindio\t-\tCordoba",
            "value": "63212"
          }, {
            "label": "Quindio\t-\tFilandia",
            "value": "63272"
          }, {
            "label": "Quindio\t-\tGenova",
            "value": "63302"
          }, {
            "label": "Quindio\t-\tLa Tebaida",
            "value": "63401"
          }, {
            "label": "Quindio\t-\tMontenegro",
            "value": "63470"
          }, {
            "label": "Quindio\t-\tPijao",
            "value": "63548"
          }, {
            "label": "Quindio\t-\tQuimbaya",
            "value": "63594"
          }, {
            "label": "Quindio\t-\tSalento",
            "value": "63690"
          }, {
            "label": "Risaralda\t-\tApia",
            "value": "66045"
          }, {
            "label": "Risaralda\t-\tBalboa",
            "value": "66075"
          }, {
            "label": "Risaralda\t-\tBelen De Umbria",
            "value": "66088"
          }, {
            "label": "Risaralda\t-\tDosquebradas",
            "value": "66170"
          }, {
            "label": "Risaralda\t-\tGuatica",
            "value": "66318"
          }, {
            "label": "Risaralda\t-\tLa Celia",
            "value": "66383"
          }, {
            "label": "Risaralda\t-\tLa Virginia",
            "value": "66400"
          }, {
            "label": "Risaralda\t-\tMarsella",
            "value": "66440"
          }, {
            "label": "Risaralda\t-\tMistrato",
            "value": "66456"
          }, {
            "label": "Risaralda\t-\tPereira",
            "value": "66001"
          }, {
            "label": "Risaralda\t-\tPueblo Rico",
            "value": "66572"
          }, {
            "label": "Risaralda\t-\tQuinchia",
            "value": "66594"
          }, {
            "label": "Risaralda\t-\tSanta Rosa De Cabal",
            "value": "66682"
          }, {
            "label": "Risaralda\t-\tSantuario",
            "value": "66687"
          }, {
            "label": "Santander\t-\tAguada",
            "value": "68013"
          }, {
            "label": "Santander\t-\tAlbania",
            "value": "68020"
          }, {
            "label": "Santander\t-\tAratoca",
            "value": "68051"
          }, {
            "label": "Santander\t-\tBarbosa",
            "value": "68077"
          }, {
            "label": "Santander\t-\tBarichara",
            "value": "68079"
          }, {
            "label": "Santander\t-\tBarrancabermeja",
            "value": "68081"
          }, {
            "label": "Santander\t-\tBetulia",
            "value": "68092"
          }, {
            "label": "Santander\t-\tBolivar",
            "value": "68101"
          }, {
            "label": "Santander\t-\tBucaramanga",
            "value": "68001"
          }, {
            "label": "Santander\t-\tCabrera",
            "value": "68121"
          }, {
            "label": "Santander\t-\tCalifornia",
            "value": "68132"
          }, {
            "label": "Santander\t-\tCapitanejo",
            "value": "68147"
          }, {
            "label": "Santander\t-\tCarcasi",
            "value": "68152"
          }, {
            "label": "Santander\t-\tCepita",
            "value": "68160"
          }, {
            "label": "Santander\t-\tCerrito",
            "value": "68162"
          }, {
            "label": "Santander\t-\tCharala",
            "value": "68167"
          }, {
            "label": "Santander\t-\tCharta",
            "value": "68169"
          }, {
            "label": "Santander\t-\tChima",
            "value": "68176"
          }, {
            "label": "Santander\t-\tChipata",
            "value": "68179"
          }, {
            "label": "Santander\t-\tCimitarra",
            "value": "68190"
          }, {
            "label": "Santander\t-\tConcepcion",
            "value": "68207"
          }, {
            "label": "Santander\t-\tConfines",
            "value": "68209"
          }, {
            "label": "Santander\t-\tContratacion",
            "value": "68211"
          }, {
            "label": "Santander\t-\tCoromoro",
            "value": "68217"
          }, {
            "label": "Santander\t-\tCuriti",
            "value": "68229"
          }, {
            "label": "Santander\t-\tEl Carmen De Chucuri",
            "value": "68235"
          }, {
            "label": "Santander\t-\tEl Guacamayo",
            "value": "68245"
          }, {
            "label": "Santander\t-\tEl Penon",
            "value": "68250"
          }, {
            "label": "Santander\t-\tEl Playon",
            "value": "68255"
          }, {
            "label": "Santander\t-\tEncino",
            "value": "68264"
          }, {
            "label": "Santander\t-\tEnciso",
            "value": "68266"
          }, {
            "label": "Santander\t-\tFlorian",
            "value": "68271"
          }, {
            "label": "Santander\t-\tFloridablanca",
            "value": "68276"
          }, {
            "label": "Santander\t-\tGalan",
            "value": "68296"
          }, {
            "label": "Santander\t-\tGambita",
            "value": "68298"
          }, {
            "label": "Santander\t-\tGiron",
            "value": "68307"
          }, {
            "label": "Santander\t-\tGuaca",
            "value": "68318"
          }, {
            "label": "Santander\t-\tGuadalupe",
            "value": "68320"
          }, {
            "label": "Santander\t-\tGuapota",
            "value": "68322"
          }, {
            "label": "Santander\t-\tGuavata",
            "value": "68324"
          }, {
            "label": "Santander\t-\tG\u00fcepsa",
            "value": "68327"
          }, {
            "label": "Santander\t-\tHato",
            "value": "68344"
          }, {
            "label": "Santander\t-\tJesus Maria",
            "value": "68368"
          }, {
            "label": "Santander\t-\tJordan",
            "value": "68370"
          }, {
            "label": "Santander\t-\tLa Belleza",
            "value": "68377"
          }, {
            "label": "Santander\t-\tLa Paz",
            "value": "68397"
          }, {
            "label": "Santander\t-\tLandazuri",
            "value": "68385"
          }, {
            "label": "Santander\t-\tLebrija",
            "value": "68406"
          }, {
            "label": "Santander\t-\tLos Santos",
            "value": "68418"
          }, {
            "label": "Santander\t-\tMacaravita",
            "value": "68425"
          }, {
            "label": "Santander\t-\tMalaga",
            "value": "68432"
          }, {
            "label": "Santander\t-\tMatanza",
            "value": "68444"
          }, {
            "label": "Santander\t-\tMogotes",
            "value": "68464"
          }, {
            "label": "Santander\t-\tMolagavita",
            "value": "68468"
          }, {
            "label": "Santander\t-\tOcamonte",
            "value": "68498"
          }, {
            "label": "Santander\t-\tOiba",
            "value": "68500"
          }, {
            "label": "Santander\t-\tOnzaga",
            "value": "68502"
          }, {
            "label": "Santander\t-\tPalmar",
            "value": "68522"
          }, {
            "label": "Santander\t-\tPalmas Del Socorro",
            "value": "68524"
          }, {
            "label": "Santander\t-\tParamo",
            "value": "68533"
          }, {
            "label": "Santander\t-\tPiedecuesta",
            "value": "68547"
          }, {
            "label": "Santander\t-\tPinchote",
            "value": "68549"
          }, {
            "label": "Santander\t-\tPuente Nacional",
            "value": "68572"
          }, {
            "label": "Santander\t-\tPuerto Parra",
            "value": "68573"
          }, {
            "label": "Santander\t-\tPuerto Wilches",
            "value": "68575"
          }, {
            "label": "Santander\t-\tRionegro",
            "value": "68615"
          }, {
            "label": "Santander\t-\tSabana De Torres",
            "value": "68655"
          }, {
            "label": "Santander\t-\tSan Andres",
            "value": "68669"
          }, {
            "label": "Santander\t-\tSan Benito",
            "value": "68673"
          }, {
            "label": "Santander\t-\tSan Gil",
            "value": "68679"
          }, {
            "label": "Santander\t-\tSan Joaquin",
            "value": "68682"
          }, {
            "label": "Santander\t-\tSan Jose De Miranda",
            "value": "68684"
          }, {
            "label": "Santander\t-\tSan Miguel",
            "value": "68686"
          }, {
            "label": "Santander\t-\tSan Vicente De Chucuri",
            "value": "68689"
          }, {
            "label": "Santander\t-\tSanta Barbara",
            "value": "68705"
          }, {
            "label": "Santander\t-\tSanta Helena Del Opon",
            "value": "68720"
          }, {
            "label": "Santander\t-\tSimacota",
            "value": "68745"
          }, {
            "label": "Santander\t-\tSocorro",
            "value": "68755"
          }, {
            "label": "Santander\t-\tSuaita",
            "value": "68770"
          }, {
            "label": "Santander\t-\tSucre",
            "value": "68773"
          }, {
            "label": "Santander\t-\tSurata",
            "value": "68780"
          }, {
            "label": "Santander\t-\tTona",
            "value": "68820"
          }, {
            "label": "Santander\t-\tValle De San Jose",
            "value": "68855"
          }, {
            "label": "Santander\t-\tVelez",
            "value": "68861"
          }, {
            "label": "Santander\t-\tVetas",
            "value": "68867"
          }, {
            "label": "Santander\t-\tVillanueva",
            "value": "68872"
          }, {
            "label": "Santander\t-\tZapatoca",
            "value": "68895"
          }, {
            "label": "Sucre\t-\tBuenavista",
            "value": "70110"
          }, {
            "label": "Sucre\t-\tCaimito",
            "value": "70124"
          }, {
            "label": "Sucre\t-\tChalan",
            "value": "70230"
          }, {
            "label": "Sucre\t-\tColoso",
            "value": "70204"
          }, {
            "label": "Sucre\t-\tCorozal",
            "value": "70215"
          }, {
            "label": "Sucre\t-\tCovenas",
            "value": "70221"
          }, {
            "label": "Sucre\t-\tEl Roble",
            "value": "70233"
          }, {
            "label": "Sucre\t-\tGaleras",
            "value": "70235"
          }, {
            "label": "Sucre\t-\tGuaranda",
            "value": "70265"
          }, {
            "label": "Sucre\t-\tLa Union",
            "value": "70400"
          }, {
            "label": "Sucre\t-\tLos Palmitos",
            "value": "70418"
          }, {
            "label": "Sucre\t-\tMajagual",
            "value": "70429"
          }, {
            "label": "Sucre\t-\tMorroa",
            "value": "70473"
          }, {
            "label": "Sucre\t-\tOvejas",
            "value": "70508"
          }, {
            "label": "Sucre\t-\tPalmito",
            "value": "70523"
          }, {
            "label": "Sucre\t-\tSampues",
            "value": "70670"
          }, {
            "label": "Sucre\t-\tSan Benito Abad",
            "value": "70678"
          }, {
            "label": "Sucre\t-\tSan Juan De Betulia",
            "value": "70702"
          }, {
            "label": "Sucre\t-\tSan Luis De Since",
            "value": "70742"
          }, {
            "label": "Sucre\t-\tSan Marcos",
            "value": "70708"
          }, {
            "label": "Sucre\t-\tSan Onofre",
            "value": "70713"
          }, {
            "label": "Sucre\t-\tSan Pedro",
            "value": "70717"
          }, {
            "label": "Sucre\t-\tSantiago De Tolu",
            "value": "70820"
          }, {
            "label": "Sucre\t-\tSincelejo",
            "value": "70001"
          }, {
            "label": "Sucre\t-\tSucre",
            "value": "70771"
          }, {
            "label": "Sucre\t-\tTolu Viejo",
            "value": "70823"
          }, {
            "label": "Tolima\t-\tAlpujarra",
            "value": "73024"
          }, {
            "label": "Tolima\t-\tAlvarado",
            "value": "73026"
          }, {
            "label": "Tolima\t-\tAmbalema",
            "value": "73030"
          }, {
            "label": "Tolima\t-\tAnzoategui",
            "value": "73043"
          }, {
            "label": "Tolima\t-\tArmero",
            "value": "73055"
          }, {
            "label": "Tolima\t-\tAtaco",
            "value": "73067"
          }, {
            "label": "Tolima\t-\tCajamarca",
            "value": "73124"
          }, {
            "label": "Tolima\t-\tCarmen De Apicala",
            "value": "73148"
          }, {
            "label": "Tolima\t-\tCasabianca",
            "value": "73152"
          }, {
            "label": "Tolima\t-\tChaparral",
            "value": "73168"
          }, {
            "label": "Tolima\t-\tCoello",
            "value": "73200"
          }, {
            "label": "Tolima\t-\tCoyaima",
            "value": "73217"
          }, {
            "label": "Tolima\t-\tCunday",
            "value": "73226"
          }, {
            "label": "Tolima\t-\tDolores",
            "value": "73236"
          }, {
            "label": "Tolima\t-\tEspinal",
            "value": "73268"
          }, {
            "label": "Tolima\t-\tFalan",
            "value": "73270"
          }, {
            "label": "Tolima\t-\tFlandes",
            "value": "73275"
          }, {
            "label": "Tolima\t-\tFresno",
            "value": "73283"
          }, {
            "label": "Tolima\t-\tGuamo",
            "value": "73319"
          }, {
            "label": "Tolima\t-\tHerveo",
            "value": "73347"
          }, {
            "label": "Tolima\t-\tHonda",
            "value": "73349"
          }, {
            "label": "Tolima\t-\tIbague",
            "value": "73001"
          }, {
            "label": "Tolima\t-\tIcononzo",
            "value": "73352"
          }, {
            "label": "Tolima\t-\tLerida",
            "value": "73408"
          }, {
            "label": "Tolima\t-\tLibano",
            "value": "73411"
          }, {
            "label": "Tolima\t-\tMelgar",
            "value": "73449"
          }, {
            "label": "Tolima\t-\tMurillo",
            "value": "73461"
          }, {
            "label": "Tolima\t-\tNatagaima",
            "value": "73483"
          }, {
            "label": "Tolima\t-\tOrtega",
            "value": "73504"
          }, {
            "label": "Tolima\t-\tPalocabildo",
            "value": "73520"
          }, {
            "label": "Tolima\t-\tPiedras",
            "value": "73547"
          }, {
            "label": "Tolima\t-\tPlanadas",
            "value": "73555"
          }, {
            "label": "Tolima\t-\tPrado",
            "value": "73563"
          }, {
            "label": "Tolima\t-\tPurificacion",
            "value": "73585"
          }, {
            "label": "Tolima\t-\tRioblanco",
            "value": "73616"
          }, {
            "label": "Tolima\t-\tRoncesvalles",
            "value": "73622"
          }, {
            "label": "Tolima\t-\tRovira",
            "value": "73624"
          }, {
            "label": "Tolima\t-\tSaldana",
            "value": "73671"
          }, {
            "label": "Tolima\t-\tSan Antonio",
            "value": "73675"
          }, {
            "label": "Tolima\t-\tSan Luis",
            "value": "73678"
          }, {
            "label": "Tolima\t-\tSan Sebastian De Mariquita",
            "value": "73443"
          }, {
            "label": "Tolima\t-\tSanta Isabel",
            "value": "73686"
          }, {
            "label": "Tolima\t-\tSuarez",
            "value": "73770"
          }, {
            "label": "Tolima\t-\tValle De San Juan",
            "value": "73854"
          }, {
            "label": "Tolima\t-\tVenadillo",
            "value": "73861"
          }, {
            "label": "Tolima\t-\tVillahermosa",
            "value": "73870"
          }, {
            "label": "Tolima\t-\tVillarrica",
            "value": "73873"
          }, {
            "label": "Valle Del Cauca\t-\tAlcala",
            "value": "76020"
          }, {
            "label": "Valle Del Cauca\t-\tAndalucia",
            "value": "76036"
          }, {
            "label": "Valle Del Cauca\t-\tAnsermanuevo",
            "value": "76041"
          }, {
            "label": "Valle Del Cauca\t-\tArgelia",
            "value": "76054"
          }, {
            "label": "Valle Del Cauca\t-\tBolivar",
            "value": "76100"
          }, {
            "label": "Valle Del Cauca\t-\tBuenaventura",
            "value": "76109"
          }, {
            "label": "Valle Del Cauca\t-\tBugalagrande",
            "value": "76113"
          }, {
            "label": "Valle Del Cauca\t-\tCaicedonia",
            "value": "76122"
          }, {
            "label": "Valle Del Cauca\t-\tCali",
            "value": "76001"
          }, {
            "label": "Valle Del Cauca\t-\tCalima",
            "value": "76126"
          }, {
            "label": "Valle Del Cauca\t-\tCandelaria",
            "value": "76130"
          }, {
            "label": "Valle Del Cauca\t-\tCartago",
            "value": "76147"
          }, {
            "label": "Valle Del Cauca\t-\tDagua",
            "value": "76233"
          }, {
            "label": "Valle Del Cauca\t-\tEl Aguila",
            "value": "76243"
          }, {
            "label": "Valle Del Cauca\t-\tEl Cairo",
            "value": "76246"
          }, {
            "label": "Valle Del Cauca\t-\tEl Cerrito",
            "value": "76248"
          }, {
            "label": "Valle Del Cauca\t-\tEl Dovio",
            "value": "76250"
          }, {
            "label": "Valle Del Cauca\t-\tFlorida",
            "value": "76275"
          }, {
            "label": "Valle Del Cauca\t-\tGinebra",
            "value": "76306"
          }, {
            "label": "Valle Del Cauca\t-\tGuacari",
            "value": "76318"
          }, {
            "label": "Valle Del Cauca\t-\tGuadalajara De Buga",
            "value": "76111"
          }, {
            "label": "Valle Del Cauca\t-\tJamundi",
            "value": "76364"
          }, {
            "label": "Valle Del Cauca\t-\tLa Cumbre",
            "value": "76377"
          }, {
            "label": "Valle Del Cauca\t-\tLa Union",
            "value": "76400"
          }, {
            "label": "Valle Del Cauca\t-\tLa Victoria",
            "value": "76403"
          }, {
            "label": "Valle Del Cauca\t-\tObando",
            "value": "76497"
          }, {
            "label": "Valle Del Cauca\t-\tPalmira",
            "value": "76520"
          }, {
            "label": "Valle Del Cauca\t-\tPradera",
            "value": "76563"
          }, {
            "label": "Valle Del Cauca\t-\tRestrepo",
            "value": "76606"
          }, {
            "label": "Valle Del Cauca\t-\tRiofrio",
            "value": "76616"
          }, {
            "label": "Valle Del Cauca\t-\tRoldanillo",
            "value": "76622"
          }, {
            "label": "Valle Del Cauca\t-\tSan Pedro",
            "value": "76670"
          }, {
            "label": "Valle Del Cauca\t-\tSevilla",
            "value": "76736"
          }, {
            "label": "Valle Del Cauca\t-\tToro",
            "value": "76823"
          }, {
            "label": "Valle Del Cauca\t-\tTrujillo",
            "value": "76828"
          }, {
            "label": "Valle Del Cauca\t-\tTulua",
            "value": "76834"
          }, {
            "label": "Valle Del Cauca\t-\tUlloa",
            "value": "76845"
          }, {
            "label": "Valle Del Cauca\t-\tVersalles",
            "value": "76863"
          }, {
            "label": "Valle Del Cauca\t-\tVijes",
            "value": "76869"
          }, {
            "label": "Valle Del Cauca\t-\tYotoco",
            "value": "76890"
          }, {
            "label": "Valle Del Cauca\t-\tYumbo",
            "value": "76892"
          }, {
            "label": "Valle Del Cauca\t-\tZarzal",
            "value": "76895"
          }, {
            "label": "Vaupes\t-\tCaruru",
            "value": "97161"
          }, {
            "label": "Vaupes\t-\tMitu",
            "value": "97001"
          }, {
            "label": "Vaupes\t-\tPacoa",
            "value": "97511"
          }, {
            "label": "Vaupes\t-\tPapunahua",
            "value": "97777"
          }, {
            "label": "Vaupes\t-\tTaraira",
            "value": "97666"
          }, {
            "label": "Vaupes\t-\tYavarate",
            "value": "97889"
          }, {
            "label": "Vichada\t-\tCumaribo",
            "value": "99773"
          }, {
            "label": "Vichada\t-\tLa Primavera",
            "value": "99524"
          }, {
            "label": "Vichada\t-\tPuerto Carreno",
            "value": "99001"
          }, {
            "label": "Vichada\t-\tSanta Rosalia",
            "value": "99624"
          }]
        },
        "selectThreshold": 0.3,
        "calculateValue": "if (data.municipalidad_cdvd == 'Arauca'){\n  value = 'Arauca - Arauca';\n}else if(data.municipalidad_cdvd == 'Neiva'){\n  value = 'Huila - Neiva';\n}else if(data.municipalidad_cdvd == 'Pasto'){\n  value = 'Narino - Pasto';\n}else if(data.municipalidad_cdvd == 'Ibague'){\n  value = 'Tolima - Ibague';\n}",
        "validate": {
          "required": true
        },
        "key": "departamentoMunicipalidadColombia",
        "customConditional": "show == data.a_gen_inf_gd_6=='colombia';",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "Barrio\/Comuna\/Localidad\/Sector (si es desconocido ingresar 0)",
        "tableView": true,
        "calculateValue": "value = data.importar_datos_basicos_vivienda.barrio;",
        "validate": {
          "required": true
        },
        "key": "barrioComunaLocalidadSectorSiEsDesconocidoIngresar0",
        "type": "textfield",
        "input": true
      }, {
        "label": "Direcci\u00f3n (ej. Carrera 27CC # 106BB-28, si es desconocido ingresar 0)",
        "tableView": true,
        "calculateValue": "value = data.importar_datos_basicos_vivienda.direccion;",
        "validate": {
          "required": true
        },
        "key": "direccionEjCarrera27Cc106Bb28SiEsDesconocidoIngresar0",
        "type": "textfield",
        "input": true
      }, {
        "label": "Visualiza vivienda en Google Map Street View (beta)",
        "tableView": true,
        "key": "visualizaViviendaEnGoogleMapStreetViewBeta",
        "type": "url",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>> Datos s\u00edsmicos<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html10",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>>> Datos s\u00edsmicos (Colombia)<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "sec0_2_2",
        "customConditional": "show = data.a_gen_inf_gd_6=='colombia';",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "IMPORTAR datos s\u00edsmicos",
        "widget": "choicesjs",
        "tableView": true,
        "dataSrc": "resource",
        "data": {
          "values": [{
            "label": "",
            "value": ""
          }],
          "resource": "ijAdVXNVFH85uAaAwDLh"
        },
        "template": "<span>{{ item.title }}<\/span>",
        "selectThreshold": 0.3,
        "calculateValue": "var r = value;\nconsole.log(r);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_1",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "selectFields": "title",
        "input": true,
        "addResource": false,
        "reference": false
      }, {
        "label": "Aceleraci\u00f3n de pico efectiva - Aa_col [g]",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "calculateValue": "value = data.a_gen_inf_sd_col_1.aa_g;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_2",
        "type": "number",
        "input": true
      }, {
        "label": "Velcidad de pico efectiva - Av_col [m\/s]",
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "calculateValue": "value = data.a_gen_inf_sd_col_1.av_g;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_3",
        "type": "number",
        "input": true
      }, {
        "label": "fa_A_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fa_A;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_4",
        "type": "number",
        "input": true
      }, {
        "label": "fa_B_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fa_B;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_5",
        "type": "number",
        "input": true
      }, {
        "label": "fa_C_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fa_C;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_6",
        "type": "number",
        "input": true
      }, {
        "label": "fa_D_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fa_D;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_7",
        "type": "number",
        "input": true
      }, {
        "label": "fa_E_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fa_E;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_8",
        "type": "number",
        "input": true
      }, {
        "label": "fv_A_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fv_A;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_9",
        "type": "number",
        "input": true
      }, {
        "label": "fv_B_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fv_B;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_10",
        "type": "number",
        "input": true
      }, {
        "label": "fv_C_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fv_C;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_11",
        "type": "number",
        "input": true
      }, {
        "label": "fv_D_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fv_D;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_12",
        "type": "number",
        "input": true
      }, {
        "label": "fv_E_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.fv_E;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_13",
        "type": "number",
        "input": true
      }, {
        "label": "m_des_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.m_des;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_14",
        "type": "number",
        "input": true
      }, {
        "label": "m_fa_475_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.m_fa_475;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_15",
        "type": "number",
        "input": true
      }, {
        "label": "m_fv_475_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.m_fa_475;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_16",
        "type": "number",
        "input": true
      }, {
        "label": "m_tc_s_475_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.m_tc_s_475;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_17",
        "type": "number",
        "input": true
      }, {
        "label": "m_tl_s_col",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "disabled": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_1.m_tl_s;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_18",
        "type": "number",
        "input": true
      }, {
        "label": "perfil_suelo_calc",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_inf_sd_col_14 != 'na'){\r\n  value = 1;\r\n}else{\r\n  value = 0;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_19",
        "type": "textfield",
        "input": true
      }, {
        "label": "Perfil de suelo (si es desconocido ingresar suelo tipo 'D')",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "defaultValue": "d",
        "values": [{
          "label": "A - Roca competente",
          "value": "a",
          "shortcut": 0
        }, {
          "label": "B - Roca rigidez media",
          "value": "b",
          "shortcut": 0
        }, {
          "label": "C - Suelo muy denso o roca blanda",
          "value": "c",
          "shortcut": ""
        }, {
          "label": "D - Suelo r\u00edgido",
          "value": "d",
          "shortcut": ""
        }, {
          "label": "E - Suelo suave",
          "value": "e",
          "shortcut": ""
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_inf_sd_col_20",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "perfil_suelo_col_calc1",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "value = data.a_gen_inf_sd_col_20;\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_20a",
        "type": "textfield",
        "input": true
      }, {
        "label": "Coeficiente de sitio per\u00edodo corto - Fa_col",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_inf_sd_col_19==1)\r\n{\r\n  value = data.a_gen_inf_sd_col_15;\r\n}\r\nelse if(data.a_gen_inf_sd_col_20 == 'a')\r\n{\r\n  value = data.a_gen_inf_sd_col_4;\r\n}\r\nelse if(data.a_gen_inf_sd_col_20 =='b')\r\n{\r\n  value = data.a_gen_inf_sd_col_5;\r\n}\r\n\r\nelse if(data.a_gen_inf_sd_col_20 =='c')\r\n{\r\n  value = data.a_gen_inf_sd_col_6;\r\n}\r\nelse if(data.a_gen_inf_sd_col_20 =='d')\r\n{\r\n  value = data.a_gen_inf_sd_col_7;\r\n}\r\nelse\r\n{\r\n  value = data.a_gen_inf_sd_col_8;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_21",
        "type": "textfield",
        "input": true
      }, {
        "label": "Coeficiente de sitio per\u00edodo intermedio - Fv_col",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_inf_sd_col_19==1)\r\n{\r\n  value = data.a_gen_inf_sd_col_16;\r\n}\r\nelse if(data.a_gen_inf_sd_col_20 == 'a')\r\n{\r\n  value = data.a_gen_inf_sd_col_9;\r\n}\r\nelse if(data.a_gen_inf_sd_col_20 =='b')\r\n{\r\n  value = data.a_gen_inf_sd_col_10;\r\n}\r\nelse if(data.a_gen_inf_sd_col_20 =='c')\r\n{\r\n  value = data.a_gen_inf_sd_col_11;\r\n}\r\nelse if(data.a_gen_inf_sd_col_20 =='d')\r\n{\r\n  value = data.a_gen_inf_sd_col_12;\r\n}\r\nelse\r\n{\r\n  value = data.a_gen_inf_sd_col_13;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_22",
        "type": "textfield",
        "input": true
      }, {
        "label": "Importancia obra",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "defaultValue": "normal",
        "values": [{
          "label": "I - Estructuras de ocupacion normal",
          "value": "normal",
          "shortcut": 0
        }, {
          "label": "II - Estructuras de ocupacion especial",
          "value": "especial",
          "shortcut": 0
        }, {
          "label": "III - Edificaciones de atencion a la comunidad",
          "value": "comunidad",
          "shortcut": ""
        }, {
          "label": "IV - Edificaciones indispensables",
          "value": "indispensables",
          "shortcut": ""
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_inf_sd_col_23",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "Factor de importancia obra - I_col",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_inf_sd_col_23== \"normal\")\r\n{\r\n  value = 1;\r\n}\r\nelse if(data.a_gen_inf_sd_col_23 == \"especial\")\r\n{\r\n  value = 1.1;\r\n}\r\nelse if(data.a_gen_inf_sd_col_23 ==\"comunidad\")\r\n{\r\n  value = 1.25;\r\n}\r\nelse\r\n{\r\n  value = 1.5;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_24",
        "type": "textfield",
        "input": true
      }, {
        "label": "Periodo de vibraci\u00f3n inicio aceleraci\u00f3n constante - T0_col [s]",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "value1 = data.a_gen_inf_sd_col_3 * data.a_gen_inf_sd_col_22;\r\nvalue2 = data.a_gen_inf_sd_col_2 * data.a_gen_inf_sd_col_21;\r\nvalue = (0.1*(value1\/value2)).toFixed(2);\r\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_25",
        "type": "textfield",
        "input": true
      }, {
        "label": "Periodo de vibraci\u00f3n fin aceleraci\u00f3n constante - TC_col [s]",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "value1 = data.a_gen_inf_sd_col_3 * data.a_gen_inf_sd_col_22;\r\nvalue2 = data.a_gen_inf_sd_col_2 * data.a_gen_inf_sd_col_21;\r\nvalue = (0.48*(value1\/value2)).toFixed(2);\r\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_26",
        "type": "textfield",
        "input": true
      }, {
        "label": "Periodo de vibraci\u00f3n desplazamiento constante - TL_col [s]",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "value = (2.4*data.a_gen_inf_sd_col_22).toFixed(2);\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_27",
        "type": "textfield",
        "input": true
      }, {
        "label": "Aceleraci\u00f3n espectral de dise\u00f1o maxima (T < TC) - Sa_col [g]",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "value = (2.5 * data.a_gen_inf_sd_col_2 * data.a_gen_inf_sd_col_21 * data.a_gen_inf_sd_col_24).toFixed(2);\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_28",
        "type": "textfield",
        "input": true
      }, {
        "label": "Velocidad espectral de dise\u00f1o maxima (TC < T < TL) - Sv_col [m\/s]",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "value = (1.87 * data.a_gen_inf_sd_col_3 * data.a_gen_inf_sd_col_22 * data.a_gen_inf_sd_col_24).toFixed(2);\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_col_29",
        "type": "textfield",
        "input": true
      }, {
        "label": "Aceleraci\u00f3n espectral para calculo PAM (porcentaje \u00e1rea de muros) - S [g]",
        "disabled": true,
        "tableView": true,
        "calculateValue": "if (isNaN(data.a_gen_inf_sd_col_28)){\r\n  value = \"\"; \r\n}\r\nelse\r\n{\r\n  value = data.a_gen_inf_sd_col_28;",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_sd_1",
        "type": "textfield",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<b><p class = \"text-danger\">Por favor, llenar el modulo 'FILTRO DE SELECCI\u00d3N INICIAL' para continuar con la encuesta.\r\n<\/p><\/b>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "a_gen_filtro_6",
        "customConditional": "show = ((data.a_gen_filtro1 === '') || (a_gen_filtro2 === '') || (data.a_gen_filtro4 === '') || (data.a_gen_filtro5 === '') || (data.a_gen_filtro8 === '') || (data.a_gen_filtro8a === '') || (data.a_gen_filtro11 === '') || (data.a_gen_filtro12 === '') || (data.a_gen_filtro13 === '') || (data.a_gen_filtro9 === ''));",
        "type": "htmlelement",
        "input": false
      }],
      "input": false
    }, {
      "title": "FILTRO DE SELECCI\u00d3N INICIAL",
      "breadcrumbClickable": true,
      "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
      },
      "collapsible": false,
      "tableView": false,
      "key": "page2",
      "type": "panel",
      "label": "Page 2",
      "input": false,
      "components": [{
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >> Riesgos globales\n<\/h5>",
        "refreshOnChange": false,
        "hidden": true,
        "tableView": false,
        "key": "html3",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "REMOCI\u00d3N EN MASA - La vivienda se encuentra fuera de zona de riesgo por remoci\u00f3n en masa.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "defaultValue": "c",
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "clearOnHide": false,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro1",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "INUNDACI\u00d3N - La vivienda se encuentra fuera de zona de riesgo por inundaci\u00f3n.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "defaultValue": "c",
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "clearOnHide": false,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro2",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "LIQUEFACI\u00d3N - La vivienda se encuentra fuera de zona de riesgo por licuefacci\u00f3n.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "defaultValue": "c",
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "clearOnHide": false,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro4",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "FALLA GEOLOGICA - La vivienda no se encuentra a menos de 60 m de una falla geologica conocida.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "defaultValue": "c",
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "clearOnHide": false,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro5",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >> Riesgos locales\n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html8",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "LADERA - La vivienda se encuentra a m\u00e1s de 10 m de una ladera pronunciada en terreno natural.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro8",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "PROXIMIDAD MURO DE CONTENCI\u00d3N - Cualquier muro de contenci\u00f3n con altura superior a 2 m, que se encuentre en la vivienda o alrededor de la misma (a menos de 10 m de distancia) est\u00e1 en buenas condiciones (si el muro de contenci\u00f3n es menos alto de 2 m el criterio CUMPLE).",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro8a",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >> Aplicabilidad para diagnostico\n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html4",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "MATERIAL TRANSITORIO O PERECEDERO - La vivienda se encuentra construida en material permanente (ej. ladrillos, concreto, etc.).",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro11",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "SERVICIOS P\u00daBLICOS - La vivienda cuenta con disponibilidad de servicios p\u00fablicos de acueducto y alcantarillado (prestados por sistemas convencionales o no convencionales).",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro12",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "V\u00cdAS DE ACCESO - La vivienda cuenta con v\u00edas de acceso pavimentadas o no pavimentadas.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro13",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "USO SUELO - El uso de suelo del predio es para viviendas seg\u00fan el Plan de Ordenamiento Territorial.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "defaultValue": "cumple",
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_filtro9",
        "conditional": {
          "eq": null
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "filtro_calc1",
        "disabled": true,
        "tableView": true,
        "calculateValue": "if(data.a_gen_filtro1=='c' && data.a_gen_filtro2=='c' && data.a_gen_filtro4=='c' && data.a_gen_filtro5=='c' && data.a_gen_filtro8=='c' && data.a_gen_filtro8a=='c'){\n  value = 1;\n}else{\n  value = 0;\n}\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_filtro10",
        "type": "textfield",
        "input": true
      }, {
        "label": "filtro_calc2",
        "disabled": true,
        "tableView": true,
        "calculateValue": "if(data.a_gen_filtro11=='c' && data.a_gen_filtro12=='c' && data.a_gen_filtro13=='c' && data.a_gen_filtro9=='c'){\n  value = 1;\n}else{\n  value = 0;\n}\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_filtro10a",
        "type": "textfield",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<b>\n  <p class=\"text-danger\">\"!! ATENCI\u00d3N !!\n  <br>\n\nNo se recomienda intervenir la vivienda por condiciones de sitio no adecuadas. Se recomienda tratar su viabilizaci\u00f3n en el Comit\u00e9 Tecnico.\"\n<\/p><\/b>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "a_gen_filtro11a",
        "customConditional": "show = (data.a_gen_filtro10===0) && (data.a_gen_filtro1 !== '') && (data.a_gen_filtro2 !== '') && (data.a_gen_filtro4 !== '') && (data.a_gen_filtro5 !== '') && (data.a_gen_filtro8 !== '') &&(data.a_gen_filtro8a !== '') && (data.a_gen_filtro11 !== '') &&(data.a_gen_filtro12 !== '') && (data.a_gen_filtro13 !== '') && (data.a_gen_filtro9 !== '');",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<b>\n  <p class=\"text-danger\">\n\"!! ATENCI\u00d3N !!\n<br>\nNo es posible intervenir la vivienda por no aplicabilidad de los requerimientos para el diagnostico. No ser\u00e1 posible categorizar la vivienda.\"  \n<\/p>\n<\/b>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html2",
        "customConditional": "show = (data.a_gen_filtro10a===0) && (data.a_gen_filtro1 !== '') && (data.a_gen_filtro2 !== '') && (data.a_gen_filtro4 !== '') && (data.a_gen_filtro5 !== '') && (data.a_gen_filtro8 !== '') && (data.a_gen_filtro8a !== '') && (data.a_gen_filtro11 !== '') && (data.a_gen_filtro12 !== '') && (data.a_gen_filtro13 !== '') && (data.a_gen_filtro9 !== '');",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<b><p class=\"text-danger\">\nLa vivienda puede ser intervenida ya que cumple los par\u00e1metros m\u00ednimos por condiciones de sitio.  \n<\/p><\/b>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html7",
        "customConditional": "show = (data.a_gen_filtro10===0) && (data.a_gen_filtro10a===0) && (data.a_gen_filtro1 !== '') && (data.a_gen_filtro2 !== '') && (data.a_gen_filtro4 !== '') && (data.a_gen_filtro5 !== '') && (data.a_gen_filtro8 !== '') && (data.a_gen_filtro8a !== '') && (data.a_gen_filtro11 !== '') && (data.a_gen_filtro12 !== '') && (data.a_gen_filtro13 !== '') && (data.a_gen_filtro9 !== '');",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "***INTERVENTOR*** - El modulo 'FILTRO DE SELECCI\u00d3N INICIAL' requiere correcciones? En caso afirmativo, por favor seleccionar 'Otro'\/'Other' y especificar.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "values": [{
          "label": "No",
          "value": "no",
          "shortcut": 0
        }, {
          "label": "Other",
          "value": "other",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "filtro_seleccion_inicial_interventor",
        "conditional": {
          "show": true,
          "when": "assigned",
          "eq": "interventor"
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "***SUPERVISOR*** - El modulo 'FILTRO DE SELECCI\u00d3N INICIAL' requiere correcciones? En caso afirmativo, por favor seleccionar 'Otro'\/'Other' y especificar.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "values": [{
          "label": "No",
          "value": "no",
          "shortcut": 0
        }, {
          "label": "Other",
          "value": "other",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "filtro_seleccion_inicial_supervisor",
        "conditional": {
          "show": true,
          "when": "assigned",
          "eq": "supervisor"
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<b><p class=\"text-danger\">\nPor favor, llenar el modulo 'FILTRO DE CATEGORIZACI\u00d3N INICIAL' para continuar con la encuesta.\n<\/p><\/b>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "a_gen_filtro_6a",
        "customConditional": "show = (data.a_gen_categ8a === 0) && (data.a_gen_filtro10a ==1 );",
        "type": "htmlelement",
        "input": false
      }]
    }, {
      "title": "FILTRO DE CATEGORIZACI\u00d3N INICIAL",
      "breadcrumbClickable": true,
      "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
      },
      "collapsible": false,
      "tableView": false,
      "key": "page3",
      "customConditional": "show = data.a_gen_filtro10a==1",
      "type": "panel",
      "label": "FILTRO DE CATEGORIZACI\u00d3N INICIAL",
      "input": false,
      "components": [{
        "label": "N\u00famero total de pisos de la vivienda",
        "widget": "choicesjs",
        "tableView": true,
        "data": {
          "values": [{
            "label": "1",
            "value": "1"
          }, {
            "label": "2",
            "value": "2"
          }, {
            "label": ">2",
            "value": "more than 2"
          }]
        },
        "selectThreshold": 0.3,
        "validate": {
          "required": true
        },
        "key": "a_gen_categ1",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "numero_pisos_calc1",
        "hidden": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_categ1 == 'more than 2'){\n  value = 100;\n}else{\n  value = data.a_gen_categ1;\n}\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_categ1a",
        "type": "textfield",
        "input": true
      }, {
        "label": "En los muros, NO existen grietas visibles mayores de1 mm de espesor (grieta: abertura larga y estrecha que atraviesa el elemento de una cara a la otra).",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ2",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "En caso de cubierta pesada (ej. losa\/placa), NO se evidencia ning\u00fan tipo de da\u00f1o o deterioro (ej. acero expuesto, grietas visibles, deformaciones notorias, etc.). Si la cubierta es liviana, el criterio debe ser CUMPLE.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ4",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2)",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "En caso de cubierta pesada (ej. losa\/placa), los voladizos se encuentran libres de ocupaci\u00f3n, uso o parapetos vulnerables m\u00e1s altos de 20 cm (1 bloque). Si la cubierta es liviana, el criterio debe ser CUMPLE.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ11",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "En viviendas construidas en zonas de laderas, donde sea posible observar externamente la viga de cimentaci\u00f3n, \u00e9sta se encuentra por debajo de todos los muros. Adem\u00e1s, donde sea presente, el muro de contenci\u00f3n de cimentaci\u00f3n est\u00e1 en buenas condiciones, sin desplomes, grietas u otros da\u00f1os. Si la vivienda no se encuentra construida en una zona de ladera o si no es posible observar la viga de cimentaci\u00f3n, el criterio debe ser CUMPLE.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ12",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "Los muros se encuentran visiblemente alineados y sin desplomes (verticalidad).",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ7",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "Visualmente, las aristas o las esquinas internas y externas de los muros se encuentran debidamente alineadas, trabadas, aplomadas y en buen estado. NO se observa alg\u00fan tipo de deterioro (se aceptan fisuras en las esquinas que no traspasen los muros).",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ6",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "Visualmente, la placa de contrapiso se encuentra en buen estado, sin grietas notables, cambios de nivel por expansi\u00f3n o contracci\u00f3n del suelo de soporte (se aceptan fisuras que no impliquen el levantamiento o hundimiento de la placa de contrapiso).",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ13",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "La distancia entre muros longitudinales paralelos es m\u00e1ximo 35 veces el espesor del muro perpendicular.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ14",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "La fachada o las fachadas de la vivienda presentan como m\u00ednimo 1 m de muro s\u00f3lido continuo a cada piso. Alternativamente, dentro de la vivienda, existen por lo menos 1 m de muro s\u00f3lido continuo posicionado a m\u00e1ximo 25%*L, donde L es la longitud del edificio perpendicular a la fachada considerada. ",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ14a",
        "conditional": {
          "show": true,
          "when": "a_gen_categ1a",
          "eq": "2"
        },
        "customConditional": "show = data.a_gen_categ1a == 2;",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "La losa de entrepiso NO presenta ning\u00fan tipo de da\u00f1o o deterioro (ej. acero expuesto, grietas visibles, deformaciones notorias, etc.). La losa de entrepiso NO es placa f\u00e1cil. ",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ14b",
        "conditional": {
          "show": true,
          "when": "a_gen_categ1a",
          "eq": "2"
        },
        "customConditional": "show = data.a_gen_categ1a == 2;",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "Los voladizos de la losa de entrepiso se encuentran desocupados y no se prev\u00e9 ocuparse con el mejoramiento. Si existe un voladizo ocupado, este no evidencia grietas en la parte superior de la losa de entrepiso en el sentido longitudinal (e.g. paralelas a la fachada) ni se caracteriza por una longitud mayor a 50 cm.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ14c",
        "conditional": {
          "show": true,
          "when": "a_gen_categ1a",
          "eq": "2"
        },
        "customConditional": "show = data.a_gen_categ1a == 2;",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "La vivienda se encuentra ubicada en un complejo residencial (multifamiliar o unifamiliar) que cuente con un permiso de construcci\u00f3n otorgado por un organismo competente (ej. curaduria urbana o secretaria de planeaci\u00f3n).",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Cumple",
          "value": "c",
          "shortcut": 0
        }, {
          "label": "No Cumple",
          "value": "nc",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "a_gen_categ15",
        "conditional": {
          "show": true,
          "when": "a_gen_categ1a",
          "eq": "100"
        },
        "customConditional": "show = data.a_gen_categ1a == 100;",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "categorizacion_calc1",
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if(data.a_gen_filtro11 !== '' && data.a_gen_filtro12 !== '' && data.a_gen_filtro13 !== '' && data.a_gen_filtro9 !== '' && data.a_gen_filtro10a ===0){\r\n    value = -1;\r\n}else{\r\n    if((data.a_gen_categ1a == 1 && data.a_gen_categ2 == 'c' && data.a_gen_categ4 == 'c' && data.a_gen_categ11 == 'c' && data.a_gen_categ12 == 'c' && data.a_gen_categ7 == 'c' && data.a_gen_categ6 == 'c' && data.a_gen_categ13 == 'c' && data.a_gen_categ14 == 'c') || (data.a_gen_categ1a==2 && data.a_gen_categ2=='c' && data.a_gen_categ4=='c' && data.a_gen_categ11=='c' && data.a_gen_categ12=='c' && data.a_gen_categ7=='c' && data.a_gen_categ6=='c' && data.a_gen_categ13=='c' && data.a_gen_categ14=='c' && data.a_gen_categ14a=='c' && data.a_gen_categ14b=='c' && data.a_gen_categ14c=='c') || (data.a_gen_categ1a==100 && data.a_gen_categ15=='c')){\r\n    value = 1;\r\n    }else{\r\n        value = 0;\r\n    }",
        "validate": {
          "required": true
        },
        "key": "a_gen_categ8",
        "type": "textfield",
        "input": true
      }, {
        "label": "visibilidad_calc1",
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if((data.a_gen_categ1a==1 && data.a_gen_categ2 !== '' && data.a_gen_categ4 !== '' &&  data.a_gen_categ11 !== '' &&  data.a_gen_categ12 !== '' &&  data.a_gen_categ7 !== '' &&  data.a_gen_categ6 !== '' &&  data.a_gen_categ13 !== '' &&  data.a_gen_categ14 !== '' && data.a_gen_categ1a==2 !== '' &&  data.a_gen_categ2 !== '' &&  data.a_gen_categ4 !== '' &&  data.a_gen_categ11 !== '' &&  data.a_gen_categ12 !== '' &&  data.a_gen_categ7 !== '' &&  data.a_gen_categ6 !== '' &&  data.a_gen_categ13 !== '' &&  data.a_gen_categ14 !== '' &&  data.a_gen_categ14a !== '' && data.a_gen_categ14b !== '' &&  data.a_gen_categ14c !== '') || (data.a_gen_categ1a==100 && data.a_gen_categ15 !== '')){\r\n    value = 1;\r\n}else{\r\n    value = 0;",
        "validate": {
          "required": true
        },
        "key": "a_gen_categ8a",
        "type": "textfield",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<b><p class=\"text-danger\">\n!! ATENCI\u00d3N !!\n<br>\nSe recomienda intervenir la vivienda bajo una categor\u00eda diferente a la Categor\u00eda I (CAT. I).\n<\/p><\/b>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "a_gen_categ9",
        "customConditional": "show = (data.a_gen_categ8 === 0) && (data.a_gen_categ8a == 1);",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<b><p class=\"text-danger\">\nLa vivienda cumple los par\u00e1metros m\u00ednimos para ser intervenida en Categor\u00eda I (CAT. I).\n<\/p><\/b>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "a_gen_categ10",
        "customConditional": "show = (data.a_gen_categ8 == 1) && (data.a_gen_categ8a == 1);",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "***INTERVENTOR*** - El modulo 'FILTRO DE CATEGORIZACI\u00d3N INICIAL' requiere correcciones? En caso afirmativo, por favor seleccionar 'Otro'\/'Other' y especificar.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "values": [{
          "label": "No",
          "value": "no",
          "shortcut": 0
        }, {
          "label": "Other",
          "value": "other",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "filtro_categorizacion_inicial_interventor",
        "conditional": {
          "show": true,
          "when": "assigned",
          "eq": "interventor"
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "***SUPERVISOR*** - El modulo 'FILTRO DE CATEGORIZACI\u00d3N INICIAL' requiere correcciones? En caso afirmativo, por favor seleccionar 'Otro'\/'Other' y especificar.",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "values": [{
          "label": "No",
          "value": "no",
          "shortcut": 0
        }, {
          "label": "Other",
          "value": "other",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "filtro_categorizacion_inicial_supervisor",
        "conditional": {
          "show": true,
          "when": "assigned",
          "eq": "supervisor"
        },
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "Waiting for answers...",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "Si",
          "shortcut": 0
        }, {
          "label": "No",
          "value": "No",
          "shortcut": 0
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "custom": null
        },
        "errorLabel": null,
        "key": "radio25",
        "customConditional": "(data.assigned.includes('interventor')) ? 'yes' : 'no';\nshow = (user == 'yes') && (data.a_gen_categ8a==1) && (data.a_gen_filtro1 !== '') && (data.a_gen_filtro2 !== '') && (data.a_gen_filtro4 !== '') && (data.a_gen_filtro5 !== '') && (data.a_gen_filtro8 !== '') && (data.a_gen_filtro8a !== '') && (data.a_gen_filtro11 !== '') && (data.a_gen_filtro12 !== '') && (data.a_gen_filtro13 !== '') && (data.a_gen_filtro9 !== '');",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "La vivienda no puede ser intervenida en Categor\u00eda I (CAT. I) y se decidi\u00f3 igualmente de seguir con el diagn\u00f3stico. Por favor, proporcionar a continuaci\u00f3n las razones por las cuales se tom\u00f3 esta decisi\u00f3n.",
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "comentarios_no_cat1",
        "customConditional": "show = (data.a_gen_inf_11d == 'si') && (data.a_gen_categ8 === 0);",
        "type": "textfield",
        "input": true
      }, {
        "label": "encuesta_a_llenar_calc1",
        "hidden": true,
        "disabled": true,
        "tableView": true,
        "clearOnHide": false,
        "calculateValue": "if((data.a_gen_filtro10 == 1 && data.a_gen_filtro10a == 1 && data.a_gen_categ8 == 1) || data.a_gen_inf_11d == 'si'){\n  value = 1;\n}else{\n  value = 0;\n}\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_11a",
        "type": "textfield",
        "input": true
      }, {
        "label": "\u00bfCu\u00e1les ENCUESTAS desea llenar?",
        "optionsLabelPosition": "right",
        "tableView": false,
        "defaultValue": {
          "": false,
          "ocupantes_survey": false,
          "construccion_survey": false,
          "ninguna": false
        },
        "values": [{
          "label": "Informaci\u00f3n de los ocupantes",
          "value": "ocupantes_survey",
          "shortcut": ""
        }, {
          "label": "Informaci\u00f3n de la vivienda",
          "value": "construccion_survey",
          "shortcut": ""
        }, {
          "label": "NINGUNA",
          "value": "ninguna",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "a_gen_inf_11",
        "customConditional": "show = (data.a_gen_inf_11a==1);",
        "type": "selectboxes",
        "input": true,
        "inputType": "checkbox"
      }]
    }, {
      "title": "INFORMACI\u00d3N DE LOS OCUPANTES",
      "breadcrumbClickable": true,
      "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
      },
      "collapsible": false,
      "tableView": false,
      "key": "sec1",
      "customConditional": "show = (data.a_gen_inf_11.ocupantes_survey === true);",
      "type": "panel",
      "label": "INFORMACI\u00d3N DE LOS OCUPANTES",
      "input": false,
      "components": [{
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >> Datos ocupante entrevistado\n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html11",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<b>\n  <p class=\"text-danger\">\n    *** NOTA INICIAL: La informaci\u00f3n recolectada no se utilizar\u00e1 por fines comerciales. ***\n  <\/p>\n<\/b>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "a_surh_hmown_8",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Nombre y apellidos del jefe de hogar de la vivienda (si es desconocido ingresar 0)",
        "tableView": true,
        "redrawOn": "importar_datos_basicos_vivienda",
        "calculateValue": "value = data.importar_datos_basicos_vivienda.nombre_completo;",
        "validate": {
          "required": true
        },
        "key": "a_surh_hmown_1",
        "type": "textfield",
        "input": true
      }, {
        "label": "Genero ocupante del jefe de hogar de la vivienda",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Hombre",
          "value": "hombre",
          "shortcut": 0
        }, {
          "label": "Mujer",
          "value": "mujer",
          "shortcut": 0
        }, {
          "label": "Otro",
          "value": "otro",
          "shortcut": ""
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_surh_hmown_2",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "Edad del jefe de hogar de la vivienda (si es desconocido ingresar 0)",
        "hidden": true,
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "clearOnHide": false,
        "validate": {
          "required": true
        },
        "key": "a_surh_hmown_2a",
        "type": "number",
        "input": true
      }, {
        "label": "N\u00famero del documento de identificaci\u00f3n del jefe de hogar de la vivienda (si es desconocido ingresar 0)",
        "tableView": true,
        "redrawOn": "importar_datos_basicos_vivienda",
        "calculateValue": "value = data.importar_datos_basicos_vivienda.numero_documento;",
        "validate": {
          "required": true
        },
        "key": "a_surh_hmown_4",
        "type": "textfield",
        "input": true
      }, {
        "label": "Numero de tel\u00e9fono del jefe de hogar de la vivienda (si es desconocido ingresar 0)",
        "tableView": true,
        "redrawOn": "importar_datos_basicos_vivienda",
        "calculateValue": "value = data.importar_datos_basicos_vivienda.telefono;",
        "validate": {
          "required": true
        },
        "key": "a_surh_hmown_5",
        "type": "textfield",
        "input": true
      }, {
        "label": "\u00bfEl ocupante entrevistado ocupa todos los pisos de la vivienda?",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": 0
        }, {
          "label": "No",
          "value": "no",
          "shortcut": 0
        }, {
          "label": "DESCONOCIDO",
          "value": "desconocido",
          "shortcut": ""
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_surh_hmown_5b",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "Piso de la vivienda ocupado por el ocupante entrevistado (si es desconocido seleccionar 'Other' y ingresar 0)",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "1",
          "value": "1",
          "shortcut": 0
        }, {
          "label": "2",
          "value": "2",
          "shortcut": 0
        }, {
          "label": "3",
          "value": "3",
          "shortcut": ""
        }, {
          "label": "4",
          "value": "4",
          "shortcut": ""
        }, {
          "label": "Otro",
          "value": "otro",
          "shortcut": ""
        }],
        "dataType": 0,
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_surh_hmown_5c",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = data.a_surh_hmown_5b == 'no';",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "radio",
        "input": true,
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "\u00bfCu\u00e1les de las OTRAS secciones opcionales, en 'INFORMACI\u00d3N DE LOS OCUPANTES', desea llenar?",
        "optionsLabelPosition": "right",
        "description": null,
        "tooltip": null,
        "customClass": null,
        "tabindex": null,
        "inline": true,
        "hidden": true,
        "tableView": false,
        "defaultValue": {
          "": false,
          "hombre": false,
          "mujer": false,
          "otro": false,
          "Datos unidad familiar": false,
          "Habitat saludable y vectores de riesgo": false,
          "Hogares comunitarios": false,
          "ninguna": false
        },
        "values": [{
          "label": "Datos unidad familiar",
          "value": "Datos unidad familiar",
          "shortcut": ""
        }, {
          "label": "Habitat saludable y vectores de riesgo",
          "value": "Habitat saludable y vectores de riesgo",
          "shortcut": ""
        }, {
          "label": "Hogares comunitarios",
          "value": "Hogares comunitarios",
          "shortcut": ""
        }, {
          "label": "NINGUNA",
          "value": "ninguna",
          "shortcut": ""
        }],
        "redrawOn": null,
        "customDefaultValue": null,
        "calculateValue": null,
        "validate": {
          "required": true,
          "custom": null
        },
        "errorLabel": null,
        "key": "a_surh_1",
        "conditional": {
          "eq": null
        },
        "customConditional": "show = (data.a_gen_categ1a == 1) || (data.a_gen_categ1a == 2);",
        "overlay": {
          "style": null,
          "left": null,
          "top": null,
          "width": null,
          "height": null
        },
        "type": "selectboxes",
        "dataType": 0,
        "input": true,
        "inputType": "checkbox",
        "placeholder": null,
        "prefix": null,
        "suffix": null,
        "refreshOn": null
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >> Datos unidad familiar\n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html9",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "N\u00famero de adultos HOMBRES (>= 18 a\u00f1os), incluso el jefe de hogar de la vivienda (si aplica)",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_1",
        "type": "number",
        "input": true
      }, {
        "label": "N\u00famero de adultos MUJERES (>= 18 a\u00f1os), incluso el jefe de hogar de la vivienda (si aplica)",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_2",
        "type": "number",
        "input": true
      }, {
        "label": "N\u00famero de adultos que se identifican en un OTRO GENERO (>= 18 a\u00f1os), incluso el jefe de hogar de la vivienda (si aplica)",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_2a",
        "type": "number",
        "input": true
      }, {
        "label": "N\u00famero de menores NI\u00d1OS (< 18 a\u00f1os)",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_3",
        "type": "number",
        "input": true
      }, {
        "label": "N\u00famero de menores NI\u00d1AS (< 18 a\u00f1os)",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_4",
        "type": "number",
        "input": true
      }, {
        "label": "N\u00famero de menores que se identifican en un OTRO GENERO (< 18 a\u00f1os)",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_4a",
        "type": "number",
        "input": true
      }, {
        "label": "Numero TOTAL adultos",
        "disabled": true,
        "tableView": true,
        "calculateValue": "value = data.a_surh_fam_1 + data.a_surh_fam_2 + data.a_surh_fam_2a;\ninstance.setValue(value);",
        "validate": {
          "required": true,
          "custom": "value = data.a_surh_fam_1 + data.a_surh_fam_2 + data.a_surh_fam_2a;"
        },
        "key": "a_surh_fam_5",
        "type": "textfield",
        "input": true
      }, {
        "label": "Numero TOTAL menores",
        "disabled": true,
        "tableView": true,
        "calculateValue": "value = data.a_surh_fam_3 + data.a_surh_fam_4 + data.a_surh_fam_4a;\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_6",
        "type": "textfield",
        "input": true
      }, {
        "label": "N\u00famero TOTAL ocupantes de la vivienda",
        "disabled": true,
        "tableView": true,
        "calculateValue": "value = data.a_surh_fam_5 + data.a_surh_fam_6;\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_7",
        "type": "textfield",
        "input": true
      }, {
        "label": "Tipo de vivienda",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Casa ",
          "value": "casa",
          "shortcut": ""
        }, {
          "label": " Apartamento",
          "value": "apartamento",
          "shortcut": ""
        }, {
          "label": "Vivienda tradicional \u00e9tnica",
          "value": "viviendaTradicionalEtnica",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "tipo_vivienda_social",
        "type": "radio",
        "input": true
      }, {
        "label": "\u00bfExisten miembros del hogar que pertenezcan a una de las siguientes minor\u00edas \u00e9tnica?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "defaultValue": {
          "": false,
          "no": false,
          "raizal": false,
          "indigena": false,
          "rom": false,
          "negro": false,
          "afrodescendiente": false,
          "palenquero": false
        },
        "values": [{
          "label": "No",
          "value": "no",
          "shortcut": ""
        }, {
          "label": "Raizal",
          "value": "raizal",
          "shortcut": ""
        }, {
          "label": "Indigena",
          "value": "indigena",
          "shortcut": ""
        }, {
          "label": " ROM",
          "value": "rom",
          "shortcut": ""
        }, {
          "label": "Negro",
          "value": "negro",
          "shortcut": ""
        }, {
          "label": "Afrodescendiente",
          "value": "afrodescendiente",
          "shortcut": ""
        }, {
          "label": "Palenquero",
          "value": "palenquero",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "minoria",
        "type": "selectboxes",
        "input": true,
        "inputType": "checkbox"
      }, {
        "label": "\u00bfCu\u00e1l es el m\u00e1ximo nivel educativo que ha alcanzado cualesquiera de los miembros del hogar?",
        "optionsLabelPosition": "right",
        "inline": false,
        "tableView": false,
        "values": [{
          "label": "Ninguno",
          "value": "ninguno",
          "shortcut": ""
        }, {
          "label": "Pre-escolar",
          "value": "preEscolar",
          "shortcut": ""
        }, {
          "label": "Primaria",
          "value": "primaria",
          "shortcut": ""
        }, {
          "label": "Bachillerato",
          "value": "bachillerato",
          "shortcut": ""
        }, {
          "label": "T\u00e9cnico",
          "value": "tecnico",
          "shortcut": ""
        }, {
          "label": "Profesional",
          "value": "profesional",
          "shortcut": ""
        }, {
          "label": "Posgrado",
          "value": "posgrado",
          "shortcut": ""
        }, {
          "label": "DESCONOCIDO",
          "value": "desconocido",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "a_surh_hmown_6",
        "type": "radio",
        "input": true
      }, {
        "label": "\u00bfAlgun MIEMBRO del HOGAR se encuentra en situaci\u00f3n de DISCAPACIDAD?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_8aa",
        "type": "radio",
        "input": true
      }, {
        "label": "\u00bfQue tipo de discapacidad es presente?",
        "optionsLabelPosition": "right",
        "tableView": false,
        "defaultValue": {
          "": false,
          "discapacidadFisicaQueAfecteSuMovilidadOActividadCotidiana": false,
          "discapacidadAuditiva": false,
          "discapacidadVisual": false,
          "discapacidadSordoCeguera": false,
          "discapacidadIntelectual": false,
          "discapacidadPsicoSocialMental": false,
          "usuarioDeSillaDeRueda": false
        },
        "values": [{
          "label": "Discapacidad f\u00edsica que afecte su movilidad o actividad cotidiana",
          "value": "discapacidadFisicaQueAfecteSuMovilidadOActividadCotidiana",
          "shortcut": ""
        }, {
          "label": "Discapacidad auditiva",
          "value": "discapacidadAuditiva",
          "shortcut": ""
        }, {
          "label": "Discapacidad visual",
          "value": "discapacidadVisual",
          "shortcut": ""
        }, {
          "label": "Discapacidad sordo-ceguera",
          "value": "discapacidadSordoCeguera",
          "shortcut": ""
        }, {
          "label": "Discapacidad intelectual",
          "value": "discapacidadIntelectual",
          "shortcut": ""
        }, {
          "label": "Discapacidad psico-social (mental)",
          "value": "discapacidadPsicoSocialMental",
          "shortcut": ""
        }, {
          "label": "Usuario de silla de rueda",
          "value": "usuarioDeSillaDeRueda",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_8a",
        "customConditional": "show = data.a_surh_fam_8aa == 'si';",
        "type": "selectboxes",
        "input": true,
        "inputType": "checkbox"
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >>> Datos financieros unidad familiar\n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html13",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "\u00bfLa unidad familiar tiene ingresos econ\u00f3micos permanentes?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_fin_1",
        "type": "radio",
        "input": true
      }, {
        "label": "Valor estimado de ingresos mensuales como unidad familiar en unidad de referencia (SMMLV - Salario M\u00ednimo Mensual Legal Vigente)?",
        "widget": "choicesjs",
        "disabled": true,
        "tableView": true,
        "data": {
          "values": [{
            "label": "LATAM - Rangos ingresos mensuales de la unidad familiar para subsidio",
            "value": "latamRangosIngresosMensualesDeLaUnidadFamiliarParaSubsidio"
          }]
        },
        "selectThreshold": 0.3,
        "validate": {
          "required": true
        },
        "key": "a_surh_fam_fin_3",
        "customConditional": "show = data.a_surh_fam_fin_1 == 'si';",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >> Habitat saludable y vectores de riesgo\n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html12",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "\u00bfEn el hogar se hace reciclaje y aprovechamiento de residuos s\u00f3lidos?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }, {
          "label": "NA",
          "value": "na",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "enElHogarSeHaceReciclajeYAprovechamientoDeResiduosSolidos",
        "type": "radio",
        "input": true
      }, {
        "label": "\u00bfEl agua que se consume es potable y se maneja con la higiene necesaria?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }, {
          "label": "NA",
          "value": "na",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "elAguaQueSeConsumeEsPotableYSeManejaConLaHigieneNecesaria",
        "type": "radio",
        "input": true
      }, {
        "label": "\u00bfSe utiliza un combustible diferente a una conexi\u00f3n de gas intradomiciliaria?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }, {
          "label": "NA",
          "value": "na",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "seUtilizaUnCombustibleDiferenteAUnaConexionDeGasIntradomiciliaria",
        "type": "radio",
        "input": true
      }, {
        "label": "\u00bfSe perciben presencia de insectos o plagas en la vivienda y sus alrededores?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }, {
          "label": "NA",
          "value": "na",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "sePercibenPresenciaDeInsectosOPlagasEnLaViviendaYSusAlrededores",
        "type": "radio",
        "input": true
      }, {
        "label": "\u00bfHay presencia de animales y mascotas en la vivienda?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }, {
          "label": "NA",
          "value": "na",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "animales_mascotas",
        "type": "radio",
        "input": true
      }, {
        "label": "\u00bfSi hay presencia de animales y mascotas en la vivienda, \u00e9stos est\u00e1n vacunados?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }, {
          "label": "NA",
          "value": "na",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "animales_mascotas_vacunados",
        "customConditional": "show = data.animales_mascotas == 'si';",
        "type": "radio",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">\n  >> Hogares comunitarios\n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "html14",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "\u00bfEn la vivienda funciona un hogar comunitario ?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "funciona_hogar_comunitario",
        "type": "radio",
        "input": true
      }, {
        "label": "Horario de atenci\u00f3n (desde)",
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "horario_desde",
        "customConditional": "show = data.funciona_hogar_comunitario == 'si';",
        "type": "time",
        "input": true,
        "inputMask": "99:99"
      }, {
        "label": "Horario de atenci\u00f3n (hasta)",
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "horario_hasta",
        "customConditional": "show = data.funciona_hogar_comunitario == 'si';",
        "type": "time",
        "input": true,
        "inputMask": "99:99"
      }, {
        "label": "Numero de menores NI\u00d1OS atendidos",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "ninos_atendidos",
        "customConditional": "show = data.funciona_hogar_comunitario == 'si';",
        "type": "number",
        "input": true
      }, {
        "label": "Numero de menores NI\u00d1AS atendidas",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "ninas_atendidas",
        "customConditional": "show = data.funciona_hogar_comunitario == 'si';",
        "type": "number",
        "input": true
      }, {
        "label": "Numero de menores que se identifican en un OTRO GENERO",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "otro_genero_atendido",
        "customConditional": "show = data.funciona_hogar_comunitario == 'si';",
        "type": "number",
        "input": true
      }, {
        "label": "Numero TOTAL menores",
        "disabled": true,
        "tableView": true,
        "calculateValue": "value = data.ninos_atendidos + data.ninas_atendidas + data.otro_genero_atendido;\ninstance.setValue(value);",
        "validate": {
          "required": true
        },
        "key": "total_menores",
        "customConditional": "show = data.funciona_hogar_comunitario == 'si';",
        "type": "textfield",
        "input": true
      }, {
        "label": "EDAD M\u00cdNIMA de los menores atendidos",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "edad_minima",
        "customConditional": "show = data.funciona_hogar_comunitario == 'si';",
        "type": "number",
        "input": true
      }, {
        "label": "EDAD M\u00c1XIMA de los menores atendidos",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "validate": {
          "required": true
        },
        "key": "edad_maxima",
        "customConditional": "show = data.funciona_hogar_comunitario == 'si';",
        "type": "number",
        "input": true
      }, {
        "label": "Comentarios generales - ocupantes de la vivienda (opcional)",
        "tableView": true,
        "key": "a_surh_hmown_5d",
        "type": "textfield",
        "input": true
      }, {
        "label": "Nombre personal social",
        "widget": "choicesjs",
        "tableView": true,
        "data": {
          "values": [{
            "label": "CDVD - Personal supervisores",
            "value": "cdvdPersonalSupervisores"
          }, {
            "label": "interventores",
            "value": "interventores"
          }, {
            "label": "ejecutores y entes territoriales",
            "value": "ejecutoresYEntesTerritoriales"
          }, {
            "label": "OTHER",
            "value": "other"
          }]
        },
        "selectThreshold": 0.3,
        "key": "nombre_personal_social",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "Firma personal social",
        "tableView": false,
        "key": "firma_personal_social",
        "type": "signature",
        "input": true
      }, {
        "label": "***INTERVENTOR*** - El modulo 'INFORMACI\u00d3N DE LOS OCUPANTES' requiere correcciones? En caso afirmativo, por favor seleccionar 'Otro'\/'Other' y especificar.",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "values": [{
          "label": "No",
          "value": "no",
          "shortcut": ""
        }, {
          "label": "OTHER",
          "value": "other",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "interventorElModuloInformacionDeLosOcupantesRequiereCorreccionesEnCasoAfirmativoPorFavorSeleccionarOtroOtherYEspecificar",
        "conditional": {
          "show": true,
          "when": "assigned",
          "eq": "interventor"
        },
        "type": "radio",
        "input": true
      }]
    }, {
      "title": "INFORMACI\u00d3N DE LA VIVIENDA1",
      "breadcrumbClickable": true,
      "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
      },
      "collapsible": false,
      "tableView": false,
      "key": "page5",
      "customConditional": "show = (data.a_gen_inf_11.construccion_survey === true);",
      "type": "panel",
      "label": "INFORMACI\u00d3N DE LA VIVIENDA",
      "input": false,
      "components": [{
        "label": "\u00bfCu\u00e1les m\u00f3dulos en 'INFORMACI\u00d3N DE LA VIVIENDA' desea llenar?",
        "optionsLabelPosition": "right",
        "inline": true,
        "tableView": false,
        "defaultValue": {
          "": false,
          "caracteristicas": false,
          "disenoYPresupuestoDeLaVivienda": false,
          "ninguna": false
        },
        "values": [{
          "label": "Caracteristicas, dise\u00f1o y presupuesto de la vivienda",
          "value": "aracteristicas_diseno",
          "shortcut": ""
        }, {
          "label": "NINGUNA",
          "value": "ninguna",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "a_bldg_1",
        "type": "selectboxes",
        "input": true,
        "inputType": "checkbox"
      }, {
        "label": ">> INSPECCI\u00d3N DOMICILIARIA, DISE\u00d1O Y PRESUPUESTO DE LA VIVIENDA",
        "tableView": false,
        "key": "container1",
        "customConditional": "show = (data.a_bldg_1.aracteristicas_diseno === true);",
        "type": "container",
        "input": true,
        "components": [{
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<h5 class=\"bg-info text-white\">\n  >>INSPECCI\u00d3N DOMICILIARIA, DISE\u00d1O Y PRESUPUESTO DE LA VIVIENDA\n<\/h5>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "html15",
          "customConditional": "show = data.a_bldg_1 != 'ninguna';",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<b><p class=\"text-danger\">\n!! ATENCI\u00d3N !!\n<br>\nPor favor llenar este modulo solo despu\u00e9s haber levantado la vivienda. El levantamiento de la vivienda se puede realizar a mano o a trav\u00e9s la aplicaci\u00f3n magicplan.\"\n<\/p><\/b>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "a_bldg_dis_pres_1",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<h5 class=\"bg-info text-white\">\n  >>PRECIOS UNITARIOS, DESCUENTOS Y DATOS CONTRATOS - Importaci\u00f3n precios unitarios por zona, descuentos por ejecutor y los datos de los contratos\n<\/h5>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "html16",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "zona",
          "hidden": true,
          "disabled": true,
          "tableView": true,
          "calculateValue": "var id = data.assigned;\r\nvalue = id.split(\"@\")[0].split('.')[1];\r\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "a_bldg_precio_u_1",
          "type": "textfield",
          "input": true
        }, {
          "label": "IMPORTAR precios unitarios",
          "widget": "choicesjs",
          "tableView": true,
          "dataSrc": "resource",
          "data": {
            "values": [{
              "label": "",
              "value": ""
            }],
            "resource": "PIt6TME6QWKqSov3xyVN"
          },
          "template": "<span>{{ item.title }}<\/span>",
          "selectThreshold": 0.3,
          "validate": {
            "required": true
          },
          "key": "a_bldg_precio_u_2",
          "type": "select",
          "indexeddb": {
            "filter": []
          },
          "selectFields": "title",
          "input": true,
          "addResource": false,
          "reference": false
        }, {
          "label": "global",
          "hidden": true,
          "disabled": true,
          "tableView": true,
          "clearOnHide": false,
          "calculateValue": "value = data.container1.a_bldg_precio_u_2.global;",
          "validate": {
            "required": true
          },
          "key": "global",
          "type": "textfield",
          "input": true
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<b><p class=\"text-danger\">Los precios unitarios fueron importados correctamente.\r\n<\/p><\/b>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "a_bldg_precio_u_0",
          "customConditional": "show = !!data.container1.global;",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "id_descuento",
          "disabled": true,
          "tableView": true,
          "calculateValue": "var id = data.assigned;\r\nvalue = id.split(\"@\")[0];\r\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "id_descuento",
          "type": "textfield",
          "input": true
        }, {
          "label": "IMPORTAR descuentos y AIU",
          "widget": "choicesjs",
          "tableView": true,
          "dataSrc": "resource",
          "data": {
            "values": [{
              "label": "",
              "value": ""
            }],
            "resource": "zLdlesje4WXqwjZfvLQ2"
          },
          "template": "<span>{{ item.id_descuento }}<\/span>",
          "selectThreshold": 0.3,
          "key": "importar_descuentos",
          "type": "select",
          "indexeddb": {
            "filter": []
          },
          "selectFields": "id_descuento,nombre,descuento,aiu_total,global_aiu,global_contrato",
          "input": true,
          "addResource": false,
          "reference": false
        }, {
          "label": "Nombre ejecutor",
          "tableView": true,
          "redrawOn": "inspeccionDomiciliariaDisenoYPresupuestoDeLaVivienda.importar_descuentos",
          "calculateValue": "value = data.container1.importar_descuentos.nombre;",
          "validate": {
            "required": true
          },
          "key": "nombre_ejecutor",
          "type": "textfield",
          "input": true
        }, {
          "label": "Descuento ejecutor (moltiplicar por 100) [%]",
          "mask": false,
          "spellcheck": true,
          "tableView": false,
          "delimiter": false,
          "requireDecimal": false,
          "inputFormat": "plain",
          "calculateValue": "value = data.container1.importar_descuentos.descuento;",
          "validate": {
            "required": true
          },
          "key": "descuento_ejecutor",
          "type": "number",
          "input": true
        }, {
          "label": "AIU ejecutor (moltiplicar por 100) [%]",
          "mask": false,
          "spellcheck": true,
          "tableView": false,
          "delimiter": false,
          "requireDecimal": false,
          "inputFormat": "plain",
          "calculateValue": "value = data.container1.importar_descuentos.aiuTotal;",
          "validate": {
            "required": true
          },
          "key": "aiu_ejecutor",
          "type": "number",
          "input": true
        }, {
          "label": "global_aiu",
          "tableView": true,
          "calculateValue": "value = data.container1.importar_descuentos.global_aiu;",
          "validate": {
            "required": true
          },
          "key": "global_aiu",
          "type": "textfield",
          "input": true
        }, {
          "label": "global_contrato",
          "tableView": true,
          "calculateValue": "value = data.container1.importar_descuentos.globalContrato;",
          "validate": {
            "required": true
          },
          "key": "global_contrato",
          "type": "textfield",
          "input": true
        }, {
          "label": "\u00bfDesea ingresar los valores de las medidas de intervenci\u00f3n por cada falencia AHORA?",
          "optionsLabelPosition": "right",
          "inline": true,
          "tableView": false,
          "values": [{
            "label": "Si",
            "value": "si",
            "shortcut": ""
          }, {
            "label": "No",
            "value": "no",
            "shortcut": ""
          }],
          "validate": {
            "required": true
          },
          "key": "a_bldg_dis_viv_0a",
          "customConditional": "show = (data.a_bldg_precio_u_2 != \"null\") && (data.importar_descuentos != \"null\");",
          "type": "radio",
          "input": true
        }]
      }, {
        "label": "Lista de verificaci\u00f3n y medidas de intervenci\u00f3n",
        "hidden": true,
        "tableView": false,
        "key": "container2",
        "conditional": {
          "show": true,
          "when": "container1.a_bldg_dis_viv_0a",
          "eq": "si"
        },
        "type": "container",
        "input": true,
        "components": [{
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<h5 class=\"bg-info text-white\">\n  >>> INSPECCI\u00d3N DOMICILIARIA Y DISE\u00d1O VIVIENDA - Lista de verificaci\u00f3n y medidas de intervenci\u00f3n\n<\/h5>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "html17",
          "customConditional": "show = data.a_bldg_dis_viv_0a !== null;",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<b><p class = \"text-danger\">El presente m\u00f3dulo permite identificar las falencias de la vivienda por espacio, por favor ingrese seleccione cada espacio y diligencie todas las preguntas.<\/p><\/b>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "a_bldg_dis_arq0",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "test100a",
          "disabled": true,
          "tableView": true,
          "calculateValue": "value = data.espacios_choice;\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "test100a",
          "type": "textfield",
          "input": true
        }, {
          "label": "test101a",
          "disabled": true,
          "tableView": true,
          "calculateValue": "value = data.espacios_title;\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "test101a",
          "type": "textfield",
          "input": true
        }, {
          "label": "test101ab",
          "disabled": true,
          "tableView": true,
          "calculateValue": "value = data.test1001;\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "test101ab",
          "type": "textfield",
          "input": true
        }, {
          "label": "aprobacion_labels",
          "disabled": true,
          "tableView": true,
          "calculateValue": "if(data.espacios_title === \"\"){\r\n  var arr = [];\r\n}\r\nelse{\r\n  var arr = data.espacios_title;\r\n}\r\nvar arr_no = ['No'];\r\nvar result = arr.map((s, i) => 'Si - ' + s);\r\nvalue == concat(arr_no,result);\r\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "aprobacion_labels",
          "type": "textfield",
          "input": true
        }, {
          "label": "aprobacion_values",
          "disabled": true,
          "tableView": true,
          "calculateValue": "if(data.espacios_title === \"\"){\r\n  var arr = [];\r\n} else {\r\n  var arr = data.espacios_title;\r\n}\r\nvar arr_no = ['no'];\r\nvar result = arr.map((s, i) => 'si_' + s.toLowerCase().replace(\/\\s\/g, '_').replace(\/\\\/\/g, '_').replace(\/\\(\/g, '').replace(\/\\)\/g, '').replace(\/\u00f1\/g, 'n'));\r\nvalue == concat(arr_no,result);\r\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "aprobacion_values",
          "type": "textfield",
          "input": true
        }, {
          "label": "espacio_precios_unitarios_adicionales_tot",
          "disabled": true,
          "tableView": true,
          "calculateValue": "value = data.espacio_precios_unitarios_adicionales;\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "espacio_precios_unitarios_adicionales_tot",
          "type": "textfield",
          "input": true
        }, {
          "label": "\u00c1rea total PRIMER PISO - a1_tot [m2]",
          "mask": false,
          "spellcheck": true,
          "disabled": true,
          "tableView": false,
          "delimiter": false,
          "requireDecimal": false,
          "inputFormat": "plain",
          "validate": {
            "required": true
          },
          "key": "area1",
          "customConditional": "show = data.a_gen_categ1a > 0;",
          "type": "number",
          "input": true
        }, {
          "label": "\u00c1rea total SEGUNDO PISO - a2_tot [m2]",
          "mask": false,
          "spellcheck": true,
          "disabled": true,
          "tableView": false,
          "delimiter": false,
          "requireDecimal": false,
          "inputFormat": "plain",
          "validate": {
            "required": true
          },
          "key": "area2",
          "customConditional": "show = data.a_gen_categ1a > 1;",
          "type": "number",
          "input": true
        }, {
          "label": "\u00c1rea total TERCER PISO - a3_tot [m2]",
          "mask": false,
          "spellcheck": true,
          "disabled": true,
          "tableView": false,
          "delimiter": false,
          "requireDecimal": false,
          "inputFormat": "plain",
          "validate": {
            "required": true
          },
          "key": "area3",
          "customConditional": "show = data.a_gen_categ1a > 2;",
          "type": "number",
          "input": true
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<b><p class =\"text-danger\">!! ATENCI\u00d3N !!\n<br>\n\nLa aplicaci\u00f3n no registra el area total de pisos mayor al tercero.\"<\/p>\n<\/b>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "a_bldg_dis_arq7",
          "customConditional": "show = data.a_gen_categ1a == 100;",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "Resumen de las falencias en la vivienda evaluada",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "def_summary0",
          "type": "textfield",
          "input": true
        }, {
          "label": "Costo TOTAL intervenci\u00f3n",
          "disabled": true,
          "tableView": true,
          "calculateValue": "if(data.espacio_cost === \"\"){\n  value === 0;\n}\nelse{\n  value == data.espacio_cost;\n}\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "cost_total",
          "type": "textfield",
          "input": true
        }, {
          "label": "visibility_cu",
          "disabled": true,
          "tableView": true,
          "calculateValue": "if(data.visiblity_cu_espacio === \"\" || visiblity_cu_espacio === 0){\n  value === 0;\n}\nelse{\n  value == 1;\n}\ninstance.setValue(value);",
          "validate": {
            "required": true
          },
          "key": "visibility_cu",
          "type": "textfield",
          "input": true
        }, {
          "label": "Listado costos unitarios NO DEFINIDOS",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "cu_nd",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Los ESPACIOS evaluados requieren correcciones? En caso afirmativo, por favor comentar en los campos  continuaci\u00f3n.",
          "optionsLabelPosition": "right",
          "inline": true,
          "hidden": true,
          "tableView": false,
          "values": [{
            "label": "yes",
            "value": "yes",
            "shortcut": ""
          }, {
            "label": "no",
            "value": "no",
            "shortcut": ""
          }],
          "validate": {
            "required": true
          },
          "key": "espacios_interventor",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "type": "radio",
          "input": true
        }, {
          "label": "int_comments_visibility_calc1",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "int_comments_visibility_calc1",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios COCINA",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_cocina",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"cocina\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios ZONA DE LAVADO",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_lavado",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"lavado\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios BA\u00d1O",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_bano",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"bano\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios SALA\/COMEDOR\/PASILLOS",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_sala_comedor",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"sala_comedor\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios MUROS DIVISORIOS INTERNOS",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_divisorios",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"divisorios\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios ALCOBA",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_alcoba",
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"alcoba\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios PATIO",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_patio",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"patio\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios MUROS PERIMETRALES",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_perimetrales",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"perimetrales\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios REDES INTRADOMICILIARIAS",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_intradomiciliarias",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"intradomiciliarias\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***INTERVENTOR*** - Comentarios TECHO\/CUBIERTA",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "interventor_comentarios_techo",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "interventor"
          },
          "customConditional": "var str = data.int_comments_visibility_calc1;\r\nshow = str.includes(\"techo\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Los ESPACIOS evaluados requieren correcciones? En caso afirmativo, por favor comentar en los campos  continuaci\u00f3n.",
          "optionsLabelPosition": "right",
          "inline": false,
          "hidden": true,
          "tableView": false,
          "values": [{
            "label": "test1",
            "value": "test1",
            "shortcut": ""
          }],
          "validate": {
            "required": true
          },
          "key": "espacios_supervisor",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "type": "radio",
          "input": true
        }, {
          "label": "sup_comments_visibility_calc1",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "sup_comments_visibility_calc1",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios COCINA",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_cocina",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"cocina\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios ZONA DE LAVADO",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_lavado",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"lavado\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios BA\u00d1O",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_bano",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"bano\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios SALA\/COMEDOR\/PASILLOS",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_sala_comedor",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"sala_comedor\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios MUROS DIVISORIOS INTERNOS",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_divisorios",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"divisorios\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios ALCOBA",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_alcoba",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"alcoba\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios PATIO",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_patio",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"patio\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios MUROS PERIMETRALES",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_perimetrales",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"perimetrales\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios REDES INTRADOMICILIARIAS",
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_intradomiciliarias",
          "conditional": {
            "show": true,
            "when": "assigned",
            "eq": "supervisor"
          },
          "customConditional": "var str = data.sup_comments_visibility_calc1;\r\nshow = str.includes(\"intradomiciliarias\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "***SUPERVISOR*** - Comentarios TECHO\/CUBIERTA",
          "hidden": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "supervisor_comentarios_techo",
          "customConditional": "var str = data.sup_comments_visibility_calc1;\nshow = str.includes(\"techo\");",
          "type": "textfield",
          "input": true
        }, {
          "label": "check_photo_int",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "check_photo_int",
          "type": "textfield",
          "input": true
        }, {
          "label": "check_photo_sup",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "check_photo_sup",
          "type": "textfield",
          "input": true
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<h5 class=\"bg-info text-white\">\n  >>>> Espacios de la vivienda a evaluar\n  <\/h5>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "html",
          "type": "htmlelement",
          "input": false
        }, {
          "label": ">>>> Espacios de la vivienda a evaluar",
          "tableView": false,
          "templates": {
            "header": "<div class=\"row\">\n  \nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\n\n<\/div>",
            "row": "<div class=\"row\">\n  {% util.eachComponent(components, function(component) { %}\n    <div class=\"col-sm-2\">\n      {{ getView(component, row[component.key]) }}\n    <\/div>\n  {% }) %}\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\n    <div class=\"col-sm-2\">\n      <div class=\"btn-group pull-right\">\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\n        {% } %}\n      <\/div>\n    <\/div>\n  {% } %}\n<\/div>"
          },
          "rowDrafts": false,
          "key": "espaciosDeLaVivienda",
          "type": "editgrid",
          "input": true,
          "components": [{
            "label": "count_cocina_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_cocina_bis",
            "type": "number",
            "input": true
          }, {
            "label": "count_lavado_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_lavado_bis",
            "type": "number",
            "input": true
          }, {
            "label": "count_bano_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_bano_bis",
            "type": "number",
            "input": true
          }, {
            "label": "count_sala_comedor_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_sala_comedor_bis",
            "type": "number",
            "input": true
          }, {
            "label": "count_divisorios_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_divisorios_bis",
            "type": "number",
            "input": true
          }, {
            "label": "count_alcoba_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_alcoba_bis",
            "type": "number",
            "input": true
          }, {
            "label": "count_patio_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_patio_bis1",
            "type": "number",
            "input": true
          }, {
            "label": "count_perimetrales_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_perimetrales_bis",
            "type": "number",
            "input": true
          }, {
            "label": "count_techo_cubierta_bis",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "count_techo_cubierta_bis1",
            "type": "number",
            "input": true
          }, {
            "label": "test1001",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "test1002",
            "type": "textfield",
            "input": true
          }, {
            "label": "espacios_title_2",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "espacios_title_2",
            "type": "textfield",
            "input": true
          }, {
            "label": "Costo TOTAL por espacio",
            "disabled": true,
            "tableView": true,
            "calculateValue": "IF(NOT(ISBLANK($3611_cost)),$3611_cost,0)+\r\nIF(NOT(ISBLANK($3612_cost)),$3612_cost,0)+\r\nIF(NOT(ISBLANK($3613_cost)),$3613_cost,0)+\r\nIF(NOT(ISBLANK($3614_cost)),$3614_cost,0)+\r\nIF(NOT(ISBLANK($3615_cost)),$3615_cost,0)+\r\nIF(NOT(ISBLANK($3616_cost)),$3616_cost,0)+\r\nIF(NOT(ISBLANK($3617_cost)),$3617_cost,0)+\r\nIF(NOT(ISBLANK($3618_cost)),$3618_cost,0)+\r\nIF(NOT(ISBLANK($3619a_cost)),$3619a_cost,0)+\r\nIF(NOT(ISBLANK($36110_cost)),$36110_cost,0)+\r\nIF(NOT(ISBLANK($36111_cost)),$36111_cost,0)+\r\nIF(NOT(ISBLANK($36112_cost)),$36112_cost,0)+\r\nIF(NOT(ISBLANK($36113_cost)),$36113_cost,0)+\r\nIF(NOT(ISBLANK($36114_cost)),$36114_cost,0)+\r\nIF(NOT(ISBLANK($36115_cost)),$36115_cost,0)+\r\nIF(NOT(ISBLANK($36116_cost)),$36116_cost,0)+\r\nIF(NOT(ISBLANK($36117_cost)),$36117_cost,0)+\r\nIF(NOT(ISBLANK($36118_cost)),$36118_cost,0)+\r\nIF(NOT(ISBLANK($36119_cost)),$36119_cost,0)+\r\nIF(NOT(ISBLANK($36120_cost)),$36120_cost,0)+\r\nIF(NOT(ISBLANK($36121_cost)),$36121_cost,0)+\r\nIF(NOT(ISBLANK($36122_cost)),$36122_cost,0)+\r\nIF(NOT(ISBLANK($36123_cost)),$36123_cost,0)+\r\nIF(NOT(ISBLANK($36124_cost)),$36124_cost,0)+\r\nIF(NOT(ISBLANK($36125_cost)),$36125_cost,0)+\r\nIF(NOT(ISBLANK($36126_cost)),$36126_cost,0);\r\ninstance.setValue(value);",
            "validate": {
              "required": true
            },
            "key": "cost_espacio",
            "type": "textfield",
            "input": true
          }, {
            "label": "visiblity_cu_espacio",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "visiblity_cu_espacio",
            "type": "textfield",
            "input": true
          }, {
            "label": "Listado costos unitarios NO DEFINIDOS por espacio",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "cu_nd_espacio",
            "customConditional": "show = data.visiblity_cu_espacio == 1;",
            "type": "textfield",
            "input": true
          }, {
            "label": "Espacio(s) a evaluar",
            "tableView": true,
            "data": {
              "values": [{
                "label": "Cocina",
                "value": "cocina"
              }, {
                "label": "Zona de lavado",
                "value": "lavado"
              }, {
                "label": "Ba\u00f1o",
                "value": "bano"
              }, {
                "label": "Sala\/Comedor\/Pasillos",
                "value": "sala_comedor"
              }, {
                "label": "Muros divisorios internos",
                "value": "divisorios"
              }, {
                "label": "Alcoba",
                "value": "alcoba"
              }, {
                "label": "Patio",
                "value": "patio"
              }, {
                "label": "Muros perimetrales",
                "value": "fachada"
              }, {
                "label": "Redes intradomiciliarias",
                "value": "redes_intradomiciliarias"
              }, {
                "label": "Techo\/Cubierta",
                "value": "techo_cubierta"
              }]
            },
            "selectThreshold": 0.3,
            "calculateValue": "console.log(value);",
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp1",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "input": true
          }, {
            "label": "\u00c1rea total ESPACIO - ae_tot [m2]",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "area_espacio",
            "customConditional": "show = row.a_bldg_dis_arq_esp1 == 'cocina' || row.a_bldg_dis_arq_esp1 == 'lavado' || row.a_bldg_dis_arq_esp1 == 'bano' || row.a_bldg_dis_arq_esp1 == 'sala_comedor' || row.a_bldg_dis_arq_esp1 == 'alcoba' || row.a_bldg_dis_arq_esp1 == 'patio' || row.a_bldg_dis_arq_esp1 == 'techo_cubierta';",
            "type": "number",
            "input": true
          }, {
            "label": "\u00c1rea total FACHADA PRINCIPAL - af_tot [m2]",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "area_fachada",
            "customConditional": "show = row.a_bldg_dis_arq_esp1 == 'fachada';",
            "type": "number",
            "input": true
          }, {
            "label": "Piso en el cual se encuentra el espacio a evaluar",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "1",
              "value": "1",
              "shortcut": ""
            }, {
              "label": "2",
              "value": "2",
              "shortcut": ""
            }, {
              "label": "3",
              "value": "3",
              "shortcut": ""
            }],
            "key": "pisoEnElCualSeEncuentraElEspacioAEvaluar",
            "type": "radio",
            "input": true
          }, {
            "label": "espacios_choice",
            "disabled": true,
            "tableView": true,
            "calculateValue": "value = row.a_bldg_dis_arq_esp1;\ninstance.setValue(value);",
            "validate": {
              "required": true
            },
            "key": "espacios_choice",
            "type": "textfield",
            "input": true
          }, {
            "label": "espacios_title",
            "disabled": true,
            "tableView": true,
            "calculateValue": "if(row.a_bldg_dis_arq_esp1 == 'cocina'){\r\n    if(row.count_cocina_bis === 0 || row.count_cocina_bis === ''){\r\n        val = 'Cocina';\r\n    }else{\r\n        val = 'Cocina '.concat(row.count_cocina_bis+1);\r\n    }\r\n}else if(row.a_bldg_dis_arq_esp1 =='lavado'){\r\n    if(row.count_lavado_bis === 0 || row.count_lavado_bis === ''){\r\n        val = 'Zona de lavado';\r\n    }else{\r\n        val = 'Zona de lavado '.concat(row.count_lavado_bis+1);\r\n    }\r\n}else if(row.a_bldg_dis_arq_esp1 == 'bano'){\r\n    if(row.count_bano_bis ===0 || row.count_bano_bis === ''){\r\n        val = 'Ba\u00f1o';\r\n    }else{\r\n        val = 'Ba\u00f1o '.concat(row.count_bano_bis+1);\r\n    }\r\n}else if(row.a_bldg_dis_arq_esp1 == 'sala_comedor'){\r\n    if(row.count_sala_comedor_bis ===0 || row.count_sala_comedor_bis === ''){\r\n        val = 'Sala\/Comedor\/Pasillos';\r\n    }else{\r\n        val = 'Sala\/Comedor\/Pasillos '.concat(row.count_sala_comedor_bis+1);\r\n    }\r\n}else if(row.a_bldg_dis_arq_esp1 == 'divisorios'){\r\n    if(row.count_divisorios_bis ===0 || row.count_divisorios_bis === ''){\r\n        val = 'Muros divisorios internos';\r\n    }else{\r\n        val = 'Muros divisorios internos '.concat(row.count_divisorios_bis+1);\r\n    }\r\n}else if(row.a_bldg_dis_arq_esp1 == 'alcoba'){\r\n    if(row.count_alcoba_bis ===0 || row.count_alcoba_bis === ''){\r\n        val = 'Alcoba';\r\n    }else{\r\n        val = 'Alcoba '.concat(row.count_alcoba_bis+1);\r\n    }        \r\n}else if(row.a_bldg_dis_arq_esp1 == 'patio'){\r\n    if(row.count_patio_bis ===0 || row.count_patio_bis === ''){\r\n        val = 'Patio';\r\n    }else{\r\n        val = 'Patio '.concat(row.count_patio_bis+1);\r\n    }\r\n}else if(row.a_bldg_dis_arq_esp1 == 'fachada'){\r\n    if(row.count_perimetrales_bis ===0 || row.count_perimetrales_bis === ''){\r\n        val = 'Muros perimetrales';\r\n    }else{\r\n        val = 'Muros perimetrales '.concat(row.count_perimetrales_bis+1);\r\n    }\r\n}else if(row.a_bldg_dis_arq_esp1=='redes_intradomiciliarias'){\r\n    if(row.count_redes_intradomiciliarias_bis ===0 || row.count_redes_intradomiciliarias_bis === ''){\r\n        val = 'Redes intradomiciliarias';\r\n    }else{\r\n        val = 'Redes intradomiciliarias '.concat(row.count_redes_intradomiciliarias_bis+1);\r\n    } \r\n}else if(row.a_bldg_dis_arq_esp1 == 'techo_cubierta'){\r\n    if(row.count_techo_cubierta_bis ===0 || row.count_techo_cubierta_bis  === ''){\r\n        val = 'Techo\/Cubierta';\r\n    }else{\r\n        val = 'Techo\/Cubierta '.concat(row.count_techo_cubierta_bis+1);\r\n    }\r\n}else{\r\n    val = '';\r\n}\r\n                                     \r\nif(row.espacio_piso === ''){\r\n    val1 = '';\r\n}else{\r\n    val1 = ' (PISO '+ row.espacio_piso +')';\r\n}\r\n\r\nvalue = val.concat(val1);\r\ninstance.setValue(value);",
            "validate": {
              "required": true
            },
            "key": "espacios_title",
            "type": "textfield",
            "input": true
          }, {
            "label": "espacio_precios_unitarios_adicionales",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "espacio_precios_unitarios_adicionales",
            "type": "textfield",
            "input": true
          }, {
            "label": "LISTA DE VERIFICACI\u00d3N - Inspecci\u00f3n domiciliaria -> FOTOS (min. 1 foto, max. 10 fotos)",
            "tableView": false,
            "storage": "url",
            "webcam": false,
            "fileTypes": [{
              "label": "",
              "value": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp2",
            "type": "file",
            "url": "http:\/\/mondasolvo.net\/fileUpload",
            "input": true
          }, {
            "label": "***INTERVENTOR*** - LISTA DE VERIFICACI\u00d3N - Inspecci\u00f3n domiciliaria -> FOTOS (min. 1 foto, max. 10 fotos)",
            "hidden": true,
            "tableView": false,
            "storage": "url",
            "webcam": false,
            "fileTypes": [{
              "label": "",
              "value": ""
            }],
            "key": "interventor_fotos_espacio",
            "conditional": {
              "show": true,
              "when": "assigned",
              "eq": "interventor"
            },
            "type": "file",
            "url": "http:\/\/mondasolvo.net\/fileUpload",
            "input": true
          }, {
            "label": "check_photo_int_espacio",
            "disabled": true,
            "tableView": true,
            "calculateValue": "if(data.interventor_fotos_espacio == 'null'){\n   value === 0;\n  }\nelse{\n  value == 1;\n}\ninstance.setValue(value);",
            "validate": {
              "required": true
            },
            "key": "check_photo_int_espacio",
            "type": "textfield",
            "input": true
          }, {
            "label": "LISTA DE VERIFICACI\u00d3N - Inspecci\u00f3n domiciliaria -> FOTOS (min. 1 foto, max. 10 fotos)",
            "tableView": false,
            "storage": "url",
            "webcam": false,
            "fileTypes": [{
              "label": "",
              "value": ""
            }],
            "validate": {
              "required": true
            },
            "key": "supervisor_fotos_espacio",
            "type": "file",
            "url": "https:\/\/web.mondasolvo.net\/api\/fileUpload",
            "input": true
          }, {
            "label": "check_photo_sup_espacio",
            "disabled": true,
            "tableView": true,
            "calculateValue": "if(data.supervisor_fotos_espacio == 'null'){\n  value = 0;\n}\nelse\n{\n  value = 1;\n}\ninstance.setValue(value);",
            "validate": {
              "required": true
            },
            "key": "check_photo_sup_espacio",
            "type": "textfield",
            "input": true
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">\n  >>>>> ***3611 - TUBERIA DE AGUA POTABLE***\n  <\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_1",
            "customConditional": "show = row.a_bldg_dis_arq_esp1 == 'redes_intradomiciliarias';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3611 - TUBERIA DE AGUA POTABLE - El espacio presenta tuberia de agua potable en buen estado, sin escapes ni riesgo a contaminantes.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp1z",
            "customConditional": "show = row.a_bldg_dis_arq_esp1 == 'redes_intradomiciliarias';",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_1_1_panel",
            "tableView": false,
            "key": "sec3_6_1_1_1_panel",
            "customConditional": "show = data.container1.a_bldg_dis_viv_0a == 'si' && row.a_bldg_dis_arq_esp1z == 'nc';",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">\n  3611 - TUBERIA DE AGUA POTABLE - Medidas de intervenci\u00f3n\n  <\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_1_1",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n baldosa de piso (incluye guarda-escoba y retiro de sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_1_1_16",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n enchape de muro (incluye retiro de sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_1_1_17",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Desmonte tuber\u00edas PVCS y PVCP (incluye retiro) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_1_1_24",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n tuber\u00eda PVCP de 1\/2\" [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_1_3_4",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n tuber\u00eda CPVC de 1\/2\" [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_1_3_5",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n tuber\u00eda PVCS 2\" (incluye accesorios, zanjado y relleno con arena cernida) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_1_3_8",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n tanque de distribuci\u00f3n 500 lts (incluye todos los accesorios para el correcto funcionamiento) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_1_3_22",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Regatas con cortadora de disco de 9\" (bloque), incluye pa\u00f1ete [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_1_6_2",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">\n  En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.\n  <\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3611_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>",
                "row": "<div class=\"row\">\n  {% util.eachComponent(components, function(component) { %}\n    <div class=\"col-sm-2\">\n      {{ getView(component, row[component.key]) }}\n    <\/div>\n  {% }) %}\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\n    <div class=\"col-sm-2\">\n      <div class=\"btn-group pull-right\">\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\n        {% } %}\n      <\/div>\n    <\/div>\n  {% } %}\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesite11",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "widget": "choicesjs",
                "tableView": true,
                "dataSrc": "json",
                "data": {
                  "values": [{
                    "label": "",
                    "value": ""
                  }],
                  "json": [{
                    "label": "1a - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Construcci\u00f3n y\/o habilitaci\u00f3n de redes hidr\u00e1ulicas y sanitarias",
                    "value": "1a"
                  }, {
                    "label": "1b - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Construcci\u00f3n de placa de contrapiso que permita la instalaci\u00f3n de acabados permanentes",
                    "value": "1b"
                  }, {
                    "label": "1c - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Habilitaci\u00f3n o instalaci\u00f3n de BA\u00d1OS",
                    "value": "1c"
                  }, {
                    "label": "1d - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Habilitaci\u00f3n o instalaci\u00f3n de COCINAS",
                    "value": "1d"
                  }, {
                    "label": "1e - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Adecuaci\u00f3n y mantenimiento de redes electricas y de gas",
                    "value": "1e"
                  }, {
                    "label": "2a - HABITABILIDAD: Reparaci\u00f3n de cubiertas",
                    "value": "2a"
                  }, {
                    "label": "2b - HABITABILIDAD: Pa\u00f1etes con o sin elementos de amarre que den estabilidad y acabados a los muros",
                    "value": "2b"
                  }, {
                    "label": "3a  - HACINAMIENTO: Re-ubicaci\u00f3n y adecuaciones de muros divisorios que no son estructurales",
                    "value": "3a"
                  }, {
                    "label": "4a - CONFORT VIVIENDA: Habilitaci\u00f3n o instalaci\u00f3n de LAVADEROS",
                    "value": "4a"
                  }, {
                    "label": "4b - CONFORT VIVIENDA: Recubrimiento de pisos con materiales que permitan la instalaci\u00f3n y mantenimiento",
                    "value": "4b"
                  }, {
                    "label": "4c - CONFORT VIVIENDA: Instalaci\u00f3n de ventanas y puertas",
                    "value": "4c"
                  }, {
                    "label": "4d - CONFORT VIVIENDA: Mantenimiento y adecuaci\u00f3n de fachadas",
                    "value": "4d"
                  }, {
                    "label": "Other",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "key": "_3611_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3611_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(row._3611_seleccione_apu.value == \"other\"){\r\n  value = 1;\r\n}\r\nelse{\r\n  value = 0 ;",
                "validate": {
                  "required": true
                },
                "key": "_3611_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3611_ingresar_costo",
                "conditional": {
                  "show": true,
                  "when": "container2.espaciosDeLaVivienda.sec3_6_1_1_1_panel.enCasoNecesite11._3611_hasother_calc",
                  "eq": "1"
                },
                "customConditional": "show = row._3611_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3611_ingresar_valor",
                "type": "number",
                "input": true,
                "defaultValue": 0
              }, {
                "label": "3611 - TUBER\u00cdA DE AGUA POTABLE - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3611_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3611_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3611_ingresar_costo = Number(row._3611_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3611_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3611_ingresar_costo = Number(des_3611_ingresar_costo+data.container1.aiu_ejecutor*des_3611_ingresar_costo);\r\n\r\nif(row._3611_seleccione_apu != 'other'){\r\n    val = row._3611_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3611_ingresar_valor*fin_3611_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3611_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3611 - TUBERIA DE AGUA POTABLE - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "calculateValue": "var nc_3611 = (row.a_bldg_dis_arq_esp1z == 'c') ? 1 : 0;\r\nconsole.log(nc_3611);\r\n \r\nvar cost_1_16 = Number(data.container1.global.split('$1_16:').pop().split('$')[0]);\r\nvar cost_1_17 = Number(data.container1.global.split('$1_17:').pop().split('$')[0]);\r\nvar cost_1_24 = Number(data.container1.global.split('$1_24:').pop().split('$')[0]);\r\nvar cost_3_4 = Number(data.container1.global.split('$3_4:').pop().split('$')[0]);\r\nvar cost_3_5 = Number(data.container1.global.split('$3_5:').pop().split('$')[0]);\r\nvar cost_3_8 = Number(data.container1.global.split('$3_8:').pop().split('$')[0]);\r\nvar cost_3_22 = Number(data.container1.global.split('$3_22:').pop().split('$')[0]);\r\nvar cost_6_2 = Number(data.container1.global.split('$6_2:').pop().split('$')[0]);\r\nvar cost_6_2a = Number(data.container1.global.split('$6_2a:').pop().split('$')[0]);\r\n \r\nvar des_cost_1_16 = Number(cost_1_16-data.container1.descuento_ejecutor*cost_1_16);\r\nvar des_cost_1_17 = Number(cost_1_17-data.container1.descuento_ejecutor*cost_1_17);\r\nvar des_cost_1_24 = Number(cost_1_24-data.container1.descuento_ejecutor*cost_1_24);\r\nvar des_cost_3_4 = Number(cost_3_4-data.container1.descuento_ejecutor*cost_3_4);\r\nvar des_cost_3_5 = Number(cost_3_5-data.container1.descuento_ejecutor*cost_3_5);\r\nvar des_cost_3_8 = Number(cost_3_8-data.container1.descuento_ejecutor*cost_3_8);\r\nvar des_cost_3_22 = Number(cost_3_22-data.container1.descuento_ejecutor*cost_3_22);\r\nvar des_cost_6_2 = Number(cost_6_2-data.container1.descuento_ejecutor*cost_6_2);\r\nvar des_cost_6_2a = Number(cost_6_2a-data.container1.descuento_ejecutor*cost_6_2a);\r\n \r\nvar fin_cost_1_16 = Number(des_cost_1_16+data.container1.aiu_ejecutor*des_cost_1_16);\r\nvar fin_cost_1_17 = Number(des_cost_1_17+data.container1.aiu_ejecutor*des_cost_1_17);\r\nvar fin_cost_1_24 = Number(des_cost_1_24+data.container1.aiu_ejecutor*des_cost_1_24);\r\nvar fin_cost_3_4 = Number(des_cost_3_4+data.container1.aiu_ejecutor*des_cost_3_4);\r\nvar fin_cost_3_5 = Number(des_cost_3_5+data.container1.aiu_ejecutor*des_cost_3_5);\r\nvar fin_cost_3_8 = Number(des_cost_3_8+data.container1.aiu_ejecutor*des_cost_3_8);\r\nvar fin_cost_3_22 = Number(des_cost_3_22+data.container1.aiu_ejecutor*des_cost_3_22);\r\nvar fin_cost_6_2 = Number(des_cost_6_2+data.container1.aiu_ejecutor*des_cost_6_2);\r\nvar fin_cost_6_2a = Number(des_cost_6_2a+data.container1.aiu_ejecutor*des_cost_6_2a);\r\n\r\nvar _3611_cost_adicionales = (row._3611_cost_adicionales === null) ? 0 : row._3611_cost_adicionales; \r\nconsole.log(_3611_cost_adicionales);\r\nval = row.a_bldg_dis_arq_esp_med_1_1_16*fin_cost_1_16+row.a_bldg_dis_arq_esp_med_1_1_17*fin_cost_1_17+row.a_bldg_dis_arq_esp_med_1_1_24*fin_cost_1_24+row.a_bldg_dis_arq_esp_med_1_3_4*fin_cost_3_4+row.a_bldg_dis_arq_esp_med_1_3_5*fin_cost_3_5+row.a_bldg_dis_arq_esp_med_1_3_8*fin_cost_3_8+row.a_bldg_dis_arq_esp_med_1_3_22*fin_cost_3_22+row.a_bldg_dis_arq_esp_med_1_6_2*fin_cost_6_2+row.a_bldg_dis_arq_esp_med_1_6_2a*fin_cost_6_2a+_3611_cost_adicionales;\r\nvalue = nc_3611*val.toFixed(2);\r\ninstance.setValue(value);\r\nconsole.log(value);",
                "validate": {
                  "required": true
                },
                "key": "_3611_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">\n  >>>>> ***3612 - LAVADERO\/LAVAPLATOS\/LAVAMANOS***\n  <\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_2",
            "customConditional": "show = row.a_bldg_dis_arq_esp1=='cocina' || row.a_bldg_dis_arq_esp1=='lavado' || row.a_bldg_dis_arq_esp1=='bano';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3612 - LAVADERO\/LAVAPLATOS\/LAVAMANOS - El espacio cuenta con una zona de lavado con agua potable y sif\u00f3n para aguas negras.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp2z",
            "customConditional": "show = row.a_bldg_dis_arq_esp1=='cocina' || row.a_bldg_dis_arq_esp1=='lavado' || row.a_bldg_dis_arq_esp1=='bano';",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_2_1_panel",
            "tableView": false,
            "key": "sec3_6_1_2_1_panel",
            "customConditional": "show = data.container1.a_bldg_dis_viv_0a=='si' && row.a_bldg_dis_arq_esp2z=='nc';",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">\n  3612 - LAVADERO\/LAVAPLATOS\/LAVAMANOS - Medidas de intervenci\u00f3n\n  <\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_2_1",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Desmonte lavamanos (incluye retiro de sobrantes) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "defaultValue": 0,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_2_1_5",
              "customConditional": "show = row.a_bldg_dis_arq_esp1=='bano';",
              "type": "number",
              "input": true
            }, {
              "label": "Desmonte de lavaplatos (incluye retiro de sobrantes) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_2_1_6",
              "customConditional": "show = row.a_bldg_dis_arq_esp1=='cocina';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Desmonte lavadero (incluye retiro) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_2_1_23",
              "customConditional": "show = row.a_bldg_dis_arq_esp1=='lavado';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n poyo para lavadero (incluye retiro) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_2_1_29",
              "customConditional": "show = row.a_bldg_dis_arq_esp1=='lavado';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Poyo para muebles en concreto f'c=2500 psi, mezcla en obra 1:2,5:4,5, acabado liso, e=8 cm [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_2_9_4",
              "customConditional": "show = row.a_bldg_dis_arq_esp1=='cocina';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n lavamanos y grifer\u00eda (incluye accesorios) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_2_14_5",
              "customConditional": "show = row.a_bldg_dis_arq_esp1=='bano';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n de lavaplatos 49 x 37cm en acero inoxidable, para mezclador (incluye kit sif\u00f3n y rejilla) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_2_14_9",
              "customConditional": "show = row.a_bldg_dis_arq_esp1=='cocina';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n lavadero granito pulido de 60 x 50 x 20 cm (incluye desag\u00fce y sif\u00f3n) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_2_14_15",
              "customConditional": "show = row.a_bldg_dis_arq_esp1=='lavado';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">\n  En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.\n  <\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3612_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>",
                "row": "<div class=\"row\">\n  {% util.eachComponent(components, function(component) { %}\n    <div class=\"col-sm-2\">\n      {{ getView(component, row[component.key]) }}\n    <\/div>\n  {% }) %}\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\n    <div class=\"col-sm-2\">\n      <div class=\"btn-group pull-right\">\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\n        {% } %}\n      <\/div>\n    <\/div>\n  {% } %}\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesite12",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "widget": "choicesjs",
                "tableView": true,
                "dataSrc": "json",
                "data": {
                  "values": [{
                    "label": "",
                    "value": ""
                  }],
                  "json": [{
                    "label": "1a - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Construcci\u00f3n y\/o habilitaci\u00f3n de redes hidr\u00e1ulicas y sanitarias",
                    "value": "1a"
                  }, {
                    "label": "1b - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Construcci\u00f3n de placa de contrapiso que permita la instalaci\u00f3n de acabados permanentes",
                    "value": "1b"
                  }, {
                    "label": "1c - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Habilitaci\u00f3n o instalaci\u00f3n de BA\u00d1OS",
                    "value": "1c"
                  }, {
                    "label": "1d - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Habilitaci\u00f3n o instalaci\u00f3n de COCINAS",
                    "value": "1d"
                  }, {
                    "label": "1e - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Adecuaci\u00f3n y mantenimiento de redes electricas y de gas",
                    "value": "1e"
                  }, {
                    "label": "2a - HABITABILIDAD: Reparaci\u00f3n de cubiertas",
                    "value": "2a"
                  }, {
                    "label": "2b - HABITABILIDAD: Pa\u00f1etes con o sin elementos de amarre que den estabilidad y acabados a los muros",
                    "value": "2b"
                  }, {
                    "label": "3a  - HACINAMIENTO: Re-ubicaci\u00f3n y adecuaciones de muros divisorios que no son estructurales",
                    "value": "3a"
                  }, {
                    "label": "4a - CONFORT VIVIENDA: Habilitaci\u00f3n o instalaci\u00f3n de LAVADEROS",
                    "value": "4a"
                  }, {
                    "label": "4b - CONFORT VIVIENDA: Recubrimiento de pisos con materiales que permitan la instalaci\u00f3n y mantenimiento",
                    "value": "4b"
                  }, {
                    "label": "4c - CONFORT VIVIENDA: Instalaci\u00f3n de ventanas y puertas",
                    "value": "4c"
                  }, {
                    "label": "4d - CONFORT VIVIENDA: Mantenimiento y adecuaci\u00f3n de fachadas",
                    "value": "4d"
                  }, {
                    "label": "Other",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "key": "_3612_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3612_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(row.row._3612_seleccione_apu == \"other\"){\r\n  value == 1;\r\n}\r\nelse{\r\n  value === 0 ;",
                "validate": {
                  "required": true
                },
                "key": "_3612_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3612_ingresar_costo",
                "customConditional": "show = data._3611_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3612_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "3612 - LAVADERO\/LAVAPLATOS\/LAVAMANOS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3612_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3612_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3612_ingresar_costo = Number(row._3612_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3612_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3612_ingresar_costo = Number(des_3612_ingresar_costo+data.container1.aiu_ejecutor*des_3612_ingresar_costo);\r\n\r\nif(row._3612_seleccione_apu != 'other'){\r\n    val = row._3612_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3612_ingresar_valor*fin_3612_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3612_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3612 - LAVADERO\/LAVAPLATOS\/LAVAMANOS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3612_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***3613 - GRIFERIA LAVADERO\/LAVAPLATOS\/LAVAMANOS***\n<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_3",
            "customConditional": "show = row.a_bldg_dis_arq_esp1=='cocina' || row.a_bldg_dis_arq_esp1=='lavado' || row.a_bldg_dis_arq_esp1=='bano';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3613 - GRIFERIA LAVADERO\/LAVAPLATOS\/LAVAMANOS - El espacio cuenta con una griferia en buen estado y limpieza sin remiendos ni da\u00f1os.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple ",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "3613GriferiaLavaderoLavaplatosLavamanosElEspacioCuentaConUnaGriferiaEnBuenEstadoYLimpiezaSinRemiendosNiDanos",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_3_1_panel",
            "tableView": false,
            "key": "sec3_6_1_3_1_panel",
            "customConditional": "show == data.container1.a_bldg_dis_viv_0a=='si' && row.a_bldg_dis_arq_esp3z=='nc';",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML ",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">3613 - GRIFERIA LAVADERO\/LAVAPLATOS\/LAVAMANOS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_3_1",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Punto hidr\u00e1ulico de 1\/2\", L_max=2,5 m (incluye materiales, mano de obra incluye regata) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_3_3_1",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n registro de 1\/2\" (incluye materiales y mano de obra) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_3_3_2",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n grifer\u00eda lavaplatos tipo econ\u00f3mica con mezclador, monocontrol y accesorios sanitarios [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_3_14_8",
              "customConditional": "show == data.a_bldg_dis_arq_esp1=='Cocina';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.\n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3613_apus_adicionales1",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesite13",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "widget": "choicesjs",
                "tableView": true,
                "dataSrc": "json",
                "data": {
                  "values": [{
                    "label": "",
                    "value": ""
                  }],
                  "json": [{
                    "label": "1a - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Construcci\u00f3n y\/o habilitaci\u00f3n de redes hidr\u00e1ulicas y sanitarias",
                    "value": "1a"
                  }, {
                    "label": "1b - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Construcci\u00f3n de placa de contrapiso que permita la instalaci\u00f3n de acabados permanentes",
                    "value": "1b"
                  }, {
                    "label": "1c - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Habilitaci\u00f3n o instalaci\u00f3n de BA\u00d1OS",
                    "value": "1c"
                  }, {
                    "label": "1d - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Habilitaci\u00f3n o instalaci\u00f3n de COCINAS",
                    "value": "1d"
                  }, {
                    "label": "1e - ACCESO INADECUADO A SERVICIOS P\u00daBLICOS: Adecuaci\u00f3n y mantenimiento de redes electricas y de gas",
                    "value": "1e"
                  }, {
                    "label": "2a - HABITABILIDAD: Reparaci\u00f3n de cubiertas",
                    "value": "2a"
                  }, {
                    "label": "2b - HABITABILIDAD: Pa\u00f1etes con o sin elementos de amarre que den estabilidad y acabados a los muros",
                    "value": "2b"
                  }, {
                    "label": "3a  - HACINAMIENTO: Re-ubicaci\u00f3n y adecuaciones de muros divisorios que no son estructurales",
                    "value": "3a"
                  }, {
                    "label": "4a - CONFORT VIVIENDA: Habilitaci\u00f3n o instalaci\u00f3n de LAVADEROS",
                    "value": "4a"
                  }, {
                    "label": "4b - CONFORT VIVIENDA: Recubrimiento de pisos con materiales que permitan la instalaci\u00f3n y mantenimiento",
                    "value": "4b"
                  }, {
                    "label": "4c - CONFORT VIVIENDA: Instalaci\u00f3n de ventanas y puertas",
                    "value": "4c"
                  }, {
                    "label": "4d - CONFORT VIVIENDA: Mantenimiento y adecuaci\u00f3n de fachadas",
                    "value": "4d"
                  }, {
                    "label": "Other",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "key": "_3613_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3613_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(row.row._3613_seleccione_apu == \"other\"){\r\n  value == 1;\r\n}\r\nelse{\r\n  value === 0 ;",
                "key": "_3613_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "key": "_3613_ingresar_costo",
                "customConditional": "show = data._3613_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "key": "_3613_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "3613 - GRIFERIA LAVADERO\/LAVAPLATOS\/LAVAMANOS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3613_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3613_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3613_ingresar_costo = Number(row._3613_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3613_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3613_ingresar_costo = Number(des_3613_ingresar_costo+data.container1.aiu_ejecutor*des_3613_ingresar_costo);\r\n\r\nif(row._3613_seleccione_apu != 'other'){\r\n    val = row._3613_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3613_ingresar_valor*fin_3613_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3613_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3613 - GRIFERIA LAVADERO\/LAVAPLATOS\/LAVAMANOS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3613_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>> ***3614 - TUBERIA AGUAS NEGRAS***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_4",
            "customConditional": "show == data.a_bldg_dis_arq_esp1=='Redes intradomiciliarias';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3614 - TUBERIA AGUAS NEGRAS - El espacio presenta tuberia de aguas negras en buen estado, sin escapes.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp4z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_4_1_panel",
            "tableView": false,
            "key": "sec3_6_1_4_1_panel",
            "customConditional": "show == data.container1.a_bldg_dis_viv_0a=='si' && row.a_bldg_dis_arq_esp3z=='nc';",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">3614 - TUBERIA AGUAS NEGRAS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_4_1",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n baldosa de piso (incluye guarda-escoba y retiro de sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_4_1_16",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n enchape de muro (incluye retiro de sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_4_1_17",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Desmonte tuber\u00edas PVCS y PVCP (incluye retiro) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_4_1_24",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n punto de desag\u00fce de 3\" o 4\", L_max=2 m [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_4_3_9",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3614_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesite14",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "widget": "choicesjs",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2) ",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_3614_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3614_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._3614_seleccione_apu == \"OTHER\"){\r\n  value == 1;\r\n}\r\nelse{\r\n  value === 0;",
                "validate": {
                  "required": true
                },
                "key": "_3614_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3614_ingresar_costo",
                "customConditional": "show == data._3614_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3614_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "3614 - TUBERIA AGUAS NEGRAS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3614_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3614_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3614_ingresar_costo = Number(row._3614_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3614_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3614_ingresar_costo = Number(des_3614_ingresar_costo+data.container1.aiu_ejecutor*des_3614_ingresar_costo);\r\n\r\nif(row._3614_seleccione_apu != 'other'){\r\n    val = row._3614_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3614_ingresar_valor*fin_3614_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3614_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3614 - TUBERIA AGUAS NEGRAS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3614_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***3615 - REJILLA SIF\u00d3N***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_5",
            "customConditional": "show == data.a_bldg_dis_arq_esp1=='Cocina' || data.a_bldg_dis_arq_esp1=='Zona de lavado' || data.a_bldg_dis_arq_esp1=='Patio' || data.a_bldg_dis_arq_esp1=='Ba\u00f1o';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3615 - REJILLA SIF\u00d3N - Todos los sifones tienen rejillas.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "3615RejillaSifonTodosLosSifonesTienenRejillas",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_5_panel",
            "tableView": false,
            "key": "sec3_6_1_5_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">3615 - REJILLA SIF\u00d3N - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_5_3",
              "customConditional": "show == data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp5z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Suministro e instalaci\u00f3n rejilla de piso 3\" [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_5_3_20",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3615_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "widget": "choicesjs",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "precioUnitarioAdicionalASeleccionar1",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3615_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._3615_seleccione_apu == \"OTHER\"){\r\n  value == 1;\r\n}\r\nelse{\r\n  value === 0;",
                "validate": {
                  "required": true
                },
                "key": "_3615_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3615_ingresar_costo",
                "customConditional": "show == data._3615_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3615_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "3615 - REJILLA SIF\u00d3N - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3615_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3615_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3615_ingresar_costo = Number(row._3615_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3615_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3615_ingresar_costo = Number(des_3615_ingresar_costo+data.container1.aiu_ejecutor*des_3615_ingresar_costo);\r\n\r\nif(row._3615_seleccione_apu != 'other'){\r\n    val = row._3615_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3615_ingresar_valor*fin_3615_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3615_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3615 - REJILLA SIF\u00d3N - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3615_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***3616 - RED EL\u00c9CTRICA***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_6",
            "customConditional": "show == data.a_bldg_dis_arq_esp1=='Redes intradomiciliarias';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3616 - RED EL\u00c9CTRICA - El espacio cuenta con conexi\u00f3n a la red el\u00e9ctrica y los cables el\u00e9ctricos se encuentran en buena condici\u00f3n (ej. no cables expuestos o da\u00f1ados).",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp6z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_6_panel",
            "tableView": false,
            "key": "sec3_6_1_6_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">3616 - RED EL\u00c9CTRICA - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_6_1",
              "customConditional": "show == data.a_bldg_dis_viv_0a=='si'|| data.a_bldg_dis_arq_esp6z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n baldosa de piso (incluye guarda-escoba y retiro de sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_1_16",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n enchape de muro (incluye retiro de sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_1_17",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n tablero monof\u00e1sico 4 circuitos (incluye caja y tacos) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_4_1",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Salida toma el\u00e9ctrica, incluye toma corriente GFCI, caja 5800, tuber\u00eda, alambre de cobre THW 12 AWG, adaptadores, L_max=4,5 m [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_4_3",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n tubo PVC 1\/2\" el\u00e9ctrico con alambre [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_4_5",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Salida toma el\u00e9ctrica, incluye toma corriente est\u00e1ndar, caja 5800, tuber\u00eda, alambre de cobre THW 12 AWG, adaptadores, L_max=4,5 m [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_4_10",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Regatas con cortadora de disco de 9\" (bloque), incluye pa\u00f1ete [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_6_2",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Regatas con cortadora de disco de 9\" (ladrillo recocido), incluye pa\u00f1ete [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_6_2a",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Alistado de muros para enchape (incluye picada, filos y dilataciones) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_6_7_6",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3616_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>",
                "row": "<div class=\"row\">\r\n  {% instance.eachComponent(function(component) { %}\r\n    <div class=\"col-sm-2\">\r\n      {{ component.getView(component.dataValue) }}\r\n    <\/div>\r\n  {% }, rowIndex) %}\r\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\r\n    <div class=\"col-sm-2\">\r\n      <div class=\"btn-group pull-right\">\r\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\r\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\r\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\r\n        {% } %}\r\n      <\/div>\r\n    <\/div>\r\n  {% } %}\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "widget": "choicesjs",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_3616_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3616_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._3616_seleccione_apu == \"OTHER\"){\r\n  value == 1;\r\n}\r\nelse{\r\n  value === 0;",
                "validate": {
                  "required": true
                },
                "key": "_3616_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3616_ingresar_costo",
                "customConditional": "show == data._3616_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3616_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "3616 - RED EL\u00c9CTRICA - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3616_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3616_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3616_ingresar_costo = Number(row._3616_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3616_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3616_ingresar_costo = Number(des_3616_ingresar_costo+data.container1.aiu_ejecutor*des_3616_ingresar_costo);\r\n\r\nif(row._3616_seleccione_apu != 'other'){\r\n    val = row._3616_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3616_ingresar_valor*fin_3616_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3616_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3616 - RED EL\u00c9CTRICA - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3616_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***3617 - ACCESORIOS EL\u00c9CTRICOS***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_7",
            "customConditional": "show == data.a_bldg_dis_arq_esp1=='Redes intradomiciliarias';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3617 - ACCESORIOS EL\u00c9CTRICOS - El espacio cuenta con accesorios de red el\u00e9ctrica en buen estado que no generan un resigo para los ocupantes.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "3617AccesoriosElectricosElEspacioCuentaConAccesoriosDeRedElectricaEnBuenEstadoQueNoGeneranUnResigoParaLosOcupantes",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_7_panel",
            "tableView": false,
            "key": "sec3_6_1_7_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">3617 - ACCESORIOS EL\u00c9CTRICOS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_7_1",
              "customConditional": "show == data.a_bldg_dis_viv_0a=='si'&& data.a_bldg_dis_arq_esp7z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Suministro e instalaci\u00f3n interruptor sencillo [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_7_4_6",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n interruptor (doble, interruptor conmutable, salida para toma tel\u00e9fono, salida toma televisi\u00f3n) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_7_4_7",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n roseta plaf\u00f3n cer\u00e1mica (incluye bombillo LED) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_7_4_8",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n toma corriente doble est\u00e1ndar [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_7_4_9",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3617_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>",
                "row": "<div class=\"row\">\r\n  {% instance.eachComponent(function(component) { %}\r\n    <div class=\"col-sm-2\">\r\n      {{ component.getView(component.dataValue) }}\r\n    <\/div>\r\n  {% }, rowIndex) %}\r\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\r\n    <div class=\"col-sm-2\">\r\n      <div class=\"btn-group pull-right\">\r\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\r\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\r\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\r\n        {% } %}\r\n      <\/div>\r\n    <\/div>\r\n  {% } %}\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "precioUnitarioAdicionalASeleccionar2",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3617_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._3617_seleccione_apu == \"OTHER\"){\n  value == 1;\n}\nelse{\n  value === 0;\n}\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3617_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3617_ingresar_costo",
                "customConditional": "show == data._3617_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3617_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "3617 - ACCESORIOS EL\u00c9CTRICOS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3617_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3617_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3617_ingresar_costo = Number(row._3617_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3617_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3617_ingresar_costo = Number(des_3617_ingresar_costo+data.container1.aiu_ejecutor*des_3617_ingresar_costo);\r\n\r\nif(row._3617_seleccione_apu != 'other'){\r\n    val = row._3617_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3617_ingresar_valor*fin_3617_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3617_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3617 - ACCESORIOS EL\u00c9CTRICOS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3617_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***3618 - PUERTAS***\r\n<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_8",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Muros perimetrales' || data.a_bldg_dis_arq_esp1=='Muros divisorios internos';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3618 - PUERTAS - El espacio cuenta con con una puerta que garantiza su privacidad e independecia.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp8z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_8_panel",
            "tableView": false,
            "key": "sec3_6_1_8_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">3618 - PUERTAS - Medidas de intervenci\u00f3n\r\n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_8_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp8z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n de muros bloque de e=0,12 m a e=0,15 m (incluye retiro sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_8_1_28x",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n de muros bloque de e=0,12 m a e=0,15 m (incluye retiro sobrantes) (y-dir = transversal) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_8_1_28y",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Construcci\u00f3n dintel en bloque No. 5 (incluye refuerzo) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_8_6_9",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n puerta triplex entamborada 0,60-0,80 x 2,00 m (incluye hoja, marco, 3 bisagras, cerradura con manija y acabado) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_8_11_1",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Puerta en l\u00e1mina cold-rolled calibre 18, (incluye suministro, marco, hoja, anticorrosivo e instalaci\u00f3n) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_8_12_1",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n cerradura puerta principal 3 pasadores (incluye escudo) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_8_12_3",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n marco en l\u00e1mina calibre 18, h=2,0 m (incluye anticorrosivo) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_8_12_9",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3618_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>",
                "row": "<div class=\"row\">\r\n  {% instance.eachComponent(function(component) { %}\r\n    <div class=\"col-sm-2\">\r\n      {{ component.getView(component.dataValue) }}\r\n    <\/div>\r\n  {% }, rowIndex) %}\r\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\r\n    <div class=\"col-sm-2\">\r\n      <div class=\"btn-group pull-right\">\r\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\r\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\r\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\r\n        {% } %}\r\n      <\/div>\r\n    <\/div>\r\n  {% } %}\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_3618_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3618_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._3618_seleccione_apu == \"OTHER\"){\n  value == 1;\n}\nelse{\n  value === 0;\n}\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3618_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "3618_activar_ejes",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3618_activar_ejes",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar direcci\u00f3n de los ejes a considerar",
                "optionsLabelPosition": "right",
                "inline": true,
                "disabled": true,
                "tableView": false,
                "values": [{
                  "label": "x-dir = longitudinal",
                  "value": "xDirLongitudinal",
                  "shortcut": ""
                }, {
                  "label": "y-dir = transversal",
                  "value": "yDirTransversal",
                  "shortcut": ""
                }],
                "validate": {
                  "required": true
                },
                "key": "_3618_ejes",
                "customConditional": "show = data._3618_activar_ejes == 1;",
                "type": "radio",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3618_ingresar_costo",
                "customConditional": "show = data._3618_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3618_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "3618 - PUERTAS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3618_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3618_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3618_ingresar_costo = Number(row._3618_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3618_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3618_ingresar_costo = Number(des_3618_ingresar_costo+data.container1.aiu_ejecutor*des_3618_ingresar_costo);\r\n\r\nif(row._3618_seleccione_apu != 'other'){\r\n    val = row._3618_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3618_ingresar_valor*fin_3618_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3618_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3618 - PUERTAS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3618_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***3619a - VENTANAS***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_9a",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Muros perimetrales' || data.a_bldg_dis_arq_esp1=='Muros divisorios internos';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "3619a - VENTANAS - El espacio cuenta con una ventana que garantiza su ventilici\u00f3n e iluminaci\u00f3n. Las ventanas se encuentran en buen estado.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp9az",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_9a_panel",
            "tableView": false,
            "key": "sec3_6_1_9a_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">3619a - VENTANAS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_9a_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp9az=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n de muros bloque de e=0,12 m a e=0,15 m (incluye retiro sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_9a_1_28x",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n de muros bloque de e=0,12 m a e=0,15 m (incluye retiro sobrantes) (y-dir = transversal) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_9a_1_28y",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Construcci\u00f3n dintel en bloque No. 5 (incluye refuerzo) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_9a_6_9",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n ventana, l\u00e1mina cold-rolled calibre 16 con anticorrosivo y basculante (incluye vidrio 4 mm). Para las medidas menores de 1 m2, se pagar\u00e1 el mismo precio [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_9a_12_10",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_3619a_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>",
                "row": "<div class=\"row\">\r\n  {% instance.eachComponent(function(component) { %}\r\n    <div class=\"col-sm-2\">\r\n      {{ component.getView(component.dataValue) }}\r\n    <\/div>\r\n  {% }, rowIndex) %}\r\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\r\n    <div class=\"col-sm-2\">\r\n      <div class=\"btn-group pull-right\">\r\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\r\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\r\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\r\n        {% } %}\r\n      <\/div>\r\n    <\/div>\r\n  {% } %}\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_3619a_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3619a_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._3619a_seleccione_apu == \"OTHER\"){\n  value == 1;\n}\nelse{\n  value === 0;\n}\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3619a_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "3619a_activar_ejes",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3619a_activar_ejes",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar direcci\u00f3n de los ejes a considerar",
                "optionsLabelPosition": "right",
                "inline": true,
                "disabled": true,
                "tableView": false,
                "values": [{
                  "label": "x-dir = longitudinal",
                  "value": "xDirLongitudinal",
                  "shortcut": ""
                }, {
                  "label": "y-dir = transversal",
                  "value": "yDirTransversal",
                  "shortcut": ""
                }],
                "validate": {
                  "required": true
                },
                "key": "_3619a_ejes",
                "customConditional": "show = data._3619a_activar_ejes == 1;",
                "type": "radio",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3619a_ingresar_costo",
                "customConditional": "show = data._3619a_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_3619a_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "3619 - VENTANAS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3619a_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3619a_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3619a_ingresar_costo = Number(row._3619a_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3619a_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3619a_ingresar_costo = Number(des_3619a_ingresar_costo+data.container1.aiu_ejecutor*des_3619a_ingresar_costo);\r\n\r\nif(row._3619a_seleccione_apu != 'other'){\r\n    val = row._3619a_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3619a_ingresar_valor*fin_3619a_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_3619a_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "3619 - VENTANAS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_3619a_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36110 - SANITARIO***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_10",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Ba\u00f1o';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36110 - SANITARIO - El espacio cuenta con un sanitario en buenas condiciones de estado y funcionamiento, sin quebradizos y con adecuada conexi\u00f3n a la red de aguas negras.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp10z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_10_panel",
            "tableView": false,
            "key": "sec3_6_1_10_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36110 - SANITARIO - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_10_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp10z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Desmonte aparato sanitario (incluye retiro de sobrantes) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_10_1_5a",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n sanitario (incluye accesorios y transporte) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_10_14_2",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36110_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>",
                "row": "<div class=\"row\">\r\n  {% instance.eachComponent(function(component) { %}\r\n    <div class=\"col-sm-2\">\r\n      {{ component.getView(component.dataValue) }}\r\n    <\/div>\r\n  {% }, rowIndex) %}\r\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\r\n    <div class=\"col-sm-2\">\r\n      <div class=\"btn-group pull-right\">\r\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\r\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\r\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\r\n        {% } %}\r\n      <\/div>\r\n    <\/div>\r\n  {% } %}\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "widget": "choicesjs",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36110_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36110_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36110_seleccione_apu){\n  value == 1;\n}\nelse{\n  value === 0;\n}\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36110_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36110_ingresar_costo",
                "customConditional": "show = data._36110_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36110_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36110 - SANITARIO - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36110_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36110_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36110_ingresar_costo = Number(row._36110_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36110_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36110_ingresar_costo = Number(des_36110_ingresar_costo+data.container1.aiu_ejecutor*des_36110_ingresar_costo);\r\n\r\nif(row._36110_seleccione_apu != 'other'){\r\n    val = row._36110_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36110_ingresar_valor*fin_36110_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36110_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36110 - SANITARIO - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36110_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36111 - DUCHA Y GRIFERIA***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_11",
            "customConditional": "show = data.a_bldg_dis_arq_esp1 == 'Ba\u00f1o';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36111 - DUCHA Y GRIFER\u00cdA - El espacio cuenta con una ducha independiente y cerrada, con todas sus superficies impermeables, limpias y libres de materia org\u00e1nica (ej. moho, humedad, etc.). La grifer\u00eda es adecuada para el uso de ducha.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp11z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_11_panel",
            "tableView": false,
            "key": "sec3_6_1_11_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36111 - DUCHA Y GRIFER\u00cdA - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_11_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp11z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Desmonte de ducha [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_11_1_4",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Alistado de muros para enchape (incluye picada, filos y dilataciones) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_11_7_6",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Instalaci\u00f3n ducha [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_11_14_6",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n grifer\u00eda ducha tipo econ\u00f3mica con mezclador y monocontrol [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_11_14_7",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n cortina de ducha (incluye lona pl\u00e1stica, tubo ajustable y accesorios) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_11_14_17",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36111_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>",
                "row": "<div class=\"row\">\r\n  {% instance.eachComponent(function(component) { %}\r\n    <div class=\"col-sm-2\">\r\n      {{ component.getView(component.dataValue) }}\r\n    <\/div>\r\n  {% }, rowIndex) %}\r\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\r\n    <div class=\"col-sm-2\">\r\n      <div class=\"btn-group pull-right\">\r\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\r\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\r\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\r\n        {% } %}\r\n      <\/div>\r\n    <\/div>\r\n  {% } %}\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "widget": "choicesjs",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": " OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36111_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36111_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36111_seleccione_apu == \"OTHER\") {\nvalue == 1;\n}\nelse{\nvalue === 0;\n}\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36111_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36111_ingresar_costo",
                "customConditional": "show = data._36111_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36111_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36111 - DUCHA Y GRIFER\u00cdA - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36111_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36111_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36111_ingresar_costo = Number(row._36111_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36111_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36111_ingresar_costo = Number(des_36111_ingresar_costo+data.container1.aiu_ejecutor*des_36111_ingresar_costo);\r\n\r\nif(row._36111_seleccione_apu != 'other'){\r\n    val = row._36111_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36111_ingresar_valor*fin_36111_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36111_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36111 - DUCHA Y GRIFER\u00cdA - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36111_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36112 - ACCESORIOS SANITARIOS***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_12",
            "customConditional": "show == data.a_bldg_dis_arq_esp1=='Ba\u00f1o';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36112 - ACCESORIOS SANITARIOS - El espacio cuenta con todos los accesorios requeridos para su buen funcionamiento e higiene.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp12z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_12_panel",
            "tableView": false,
            "key": "sec3_6_1_12_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36112 - ACCESORIOS SANITARIOS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_12_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp12z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Suministro e instalaci\u00f3n flotador mec\u00e1nico de 1\/2\" [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_12_3_24",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36112_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>",
                "row": "<div class=\"row\">\r\n  {% instance.eachComponent(function(component) { %}\r\n    <div class=\"col-sm-2\">\r\n      {{ component.getView(component.dataValue) }}\r\n    <\/div>\r\n  {% }, rowIndex) %}\r\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\r\n    <div class=\"col-sm-2\">\r\n      <div class=\"btn-group pull-right\">\r\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\r\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\r\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\r\n        {% } %}\r\n      <\/div>\r\n    <\/div>\r\n  {% } %}\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo1",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36112_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36112_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36112_seleccione_apu == \"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36112_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36112_ingresar_costo",
                "customConditional": "show = data._36112_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36112_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36112 - ACCESORIOS SANITARIOS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36112_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36112_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36112_ingresar_costo = Number(row._36112_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36112_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36112_ingresar_costo = Number(des_36112_ingresar_costo+data.container1.aiu_ejecutor*des_36112_ingresar_costo);\r\n\r\nif(row._36112_seleccione_apu != 'other'){\r\n    val = row._36112_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36112_ingresar_valor*fin_36112_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36112_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36112 - ACCESORIOS SANITARIOS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36112_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36113 - MUEBLES COCINA***\r\n<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_13",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36113 - MUEBLES COCINA - El espacio cuenta con muebles para el almacenamiento de alimentos y utensilios de cocina de forma segura y limpia.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp13z",
            "type": "radio",
            "input": true
          }, {
            "label": "Container",
            "tableView": false,
            "key": "container9",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36113 - MUEBLES COCINA - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_13_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp13z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Poyo para muebles en concreto f'c=2500 psi, mezcla en obra 1:2,5:4,5, acabado liso, e=8 cm [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_13_9_4",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n mueble modular superior de cocina, en l\u00e1mina RH, L=1,5 m (incluye 4 puertas, divisorios, entrepa\u00f1os y accesorios para el correcto funcionamiento) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_13_11_5b",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n mueble modular inferior de cocina, en l\u00e1mina RH, L=1,2 m (incluye 2 puertas, 4 cajones, divisorios, entrepa\u00f1os y accesorios para el correcto funcionamiento) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_13_11_4b",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "36113_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\r\nPor favor, presionar 'Add Another' para ingresar un nuevo espacio.\r\n<\/div>",
                "row": "<div class=\"row\">\r\n  {% instance.eachComponent(function(component) { %}\r\n    <div class=\"col-sm-2\">\r\n      {{ component.getView(component.dataValue) }}\r\n    <\/div>\r\n  {% }, rowIndex) %}\r\n  {% if (!instance.options.readOnly && !instance.originalComponent.disabled) { %}\r\n    <div class=\"col-sm-2\">\r\n      <div class=\"btn-group pull-right\">\r\n        <button class=\"btn btn-default btn-light btn-sm editRow\"><i class=\"{{ iconClass('edit') }}\"><\/i><\/button>\r\n        {% if (!instance.hasRemoveButtons || instance.hasRemoveButtons()) { %}\r\n          <button class=\"btn btn-danger btn-sm removeRow\"><i class=\"{{ iconClass('trash') }}\"><\/i><\/button>\r\n        {% } %}\r\n      <\/div>\r\n    <\/div>\r\n  {% } %}\r\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36113_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36113_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36113_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36113_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36113_ingresar_costo",
                "customConditional": "show = data._36113_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36113_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36113 - MUEBLES COCINA - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36113_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36113_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36113_ingresar_costo = Number(row._36113_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36113_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36113_ingresar_costo = Number(des_36113_ingresar_costo+data.container1.aiu_ejecutor*des_36113_ingresar_costo);\r\n\r\nif(row._36113_seleccione_apu != 'other'){\r\n    val = row._36113_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36113_ingresar_valor*fin_36113_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36113_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36113 - MUEBLES COCINA - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36113_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36114 - MESON***\r\n<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_14",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36114 - MESON - El meson es firme, impermeable y de f\u00e1cil limpeza.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp14z",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_14_panel",
            "tableView": false,
            "key": "sec3_6_1_14_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36114 - MESON - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_14_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp14z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n mes\u00f3n cocina (incluye retiro) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_14_1_39",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Mes\u00f3n en concreto, mezcla en obra de 3000 psi, e=6 cm, ancho=60 cm (incluye refuerzo en acero 3\/8\") [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_14_2_41",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n mes\u00f3n en acero inoxidable 1,00 m con poceta para mezclador (incluye accesorios) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_14_14_10",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36114_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n  Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2) ",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36114_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36114_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36114_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36114_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36114_ingresar_costo",
                "customConditional": "show = data._36114_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36114_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36114 - MESON - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36114_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36114_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36114_ingresar_costo = Number(row._36114_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36114_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36114_ingresar_costo = Number(des_36114_ingresar_costo+data.container1.aiu_ejecutor*des_36114_ingresar_costo);\r\n\r\nif(row._36114_seleccione_apu != 'other'){\r\n    val = row._36114_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36114_ingresar_valor*fin_36114_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36114_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36114 - MESON - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36114_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">\r\n  >>>>> ***36115 - ESTUFA***\r\n<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_15",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36115 - ESTUFA - El espacio cuenta con una estufa con conexi\u00f3n adecuada y segura a la red de gas o el\u00e9ctrica, seg\u00fan sea su forma de alimentaci\u00f3n para su correcto funcionamiento.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp15z",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_15_panel",
            "tableView": false,
            "key": "sec3_6_1_15_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36115 - ESTUFA - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_15_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp15z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Suministro e instalaci\u00f3n mes\u00f3n en acero inoxidable 1,20 m con estufa gas 4 puestos, poceta para monocontrol (incluye accesorios) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_15_14_12",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36115_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36115_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "3611_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36115_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36115_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36115_ingresar_costo",
                "customConditional": "show = data._36115_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36115_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36115 - ESTUFA - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36115_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36115_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36115_ingresar_costo = Number(row._36115_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36115_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36115_ingresar_costo = Number(des_36115_ingresar_costo+data.container1.aiu_ejecutor*des_36115_ingresar_costo);\r\n\r\nif(row._36115_seleccione_apu != 'other'){\r\n    val = row._36115_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36115_ingresar_valor*fin_36115_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36115_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36115 - ESTUFA - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36115_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36116 - RED DE GAS***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_16",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Redes intradomiciliarias';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36116 - RED DE GAS - El espacio cuenta con red de gas en buen estado, sin fugas ni reparaciones inadecuadas.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp16z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_16_panel",
            "tableView": false,
            "key": "sec3_6_1_16_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36116 - RED DE GAS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_16_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp16z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36116_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36116_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36116_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36116_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36116_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36116_ingresar_costo",
                "customConditional": "show = data._36116_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36116_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36116 - RED DE GAS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36116_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36116_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3611_ingresar_costo = Number(row._3611_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3611_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3611_ingresar_costo = Number(des_3611_ingresar_costo+data.container1.aiu_ejecutor*des_3611_ingresar_costo);\r\n\r\nif(row._36116_seleccione_apu != 'other'){\r\n    val = row._3611_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3611_ingresar_valor*fin_3611_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36116_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36116 - RED DE GAS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36116_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">\r\n >>>>> ***36126 - CONSTRUCCI\u00d3N DE PISOS***\r\n<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_26",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36126 - CONSTRUCCI\u00d3N DE PISOS - El espacio cuenta con un placa de contrapiso en concreto que permita la instalaci\u00f3n de acabados permanentes.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp26z",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_26_panel",
            "tableView": false,
            "key": "sec3_6_1_26_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36126 - CONSTRUCCI\u00d3N DE PISOS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_26_2",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp26z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n placa contrapiso e=15 cm (incluye retiro de escombros) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_26_1_27",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Fundir placa concreto 2500 psi, incluye malla electrosoldada, H-131, e=8 cm [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_26_2_3",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Alistado de piso impermeabilizado, mortero 1:4, e=4 cm (incluye materiales y mano de obra) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_26_9_2",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36126_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n  Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36126_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36126_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36126_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36126_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36126_ingresar_costo",
                "customConditional": "show = data._36126_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36126_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36126 - CONSTRUCCI\u00d3N DE PISOS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36126_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36126_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36126_ingresar_costo = Number(row._36126_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36126_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36126_ingresar_costo = Number(des_36126_ingresar_costo+data.container1.aiu_ejecutor*des_36126_ingresar_costo);\r\n\r\nif(row._36126_seleccione_apu != 'other'){\r\n    val = row._36126_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36126_ingresar_valor*fin_3611_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36126_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36126 - CONSTRUCCI\u00d3N DE PISOS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "36126ConstruccionDePisosCostoActividadPorEspacio",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">\r\n  >>>>> ***36117 - ACABADO PISOS***\r\n<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_17",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36117 - ACABADO PISOS - El espacio cuenta con pisos firmes, impermeables y de f\u00e1cil limpieza. El acabado de los pisos se encuentra en buen estado.",
            "optionsLabelPosition": "right",
            "inline": true,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp17z",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina';",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_17_panel",
            "tableView": false,
            "key": "sec3_6_1_17_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36117 - ACABADO PISOS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_17_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp17z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Picada de piso existente para afinado (incluye retiro de sobrantes y limpieza) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_17_9_1",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Alistado de piso, mortero 1:4, e=4 cm (incluye materiales y mano de obra) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_17_9_3",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n de guarda escoba en cer\u00e1mica o similar h=8 cm, habitaci\u00f3n y sala comedor (incluye adhesivo base cemento para enchape y boquilla) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_17_10_1",
              "customConditional": "show = data.a_bldg_dis_arq_esp1=='Alcoba' || data.a_bldg_dis_arq_esp1=='Sala\/Comedor\/Pasillos';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n de guarda escoba en cer\u00e1mica o similar h=8 cm, en cocina, ba\u00f1o y cuarto de ropas (incluye adhesivo base cemento para enchape y boquilla) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_17_10_2",
              "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina' || data.a_bldg_dis_arq_esp1=='Ba\u00f1o' || data.a_bldg_dis_arq_esp1=='Zona de lavado';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n piso cer\u00e1mica semi-brillante de 33,8 x 33,8 cm, en sala, comedor y alcobas (incluye adhesivo base cemento para enchape y boquilla) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_17_10_3",
              "customConditional": "show = data.a_bldg_dis_arq_esp1=='Alcoba' || data.a_bldg_dis_arq_esp1=='Sala\/Comedor\/Pasillos';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n piso cer\u00e1mica antideslizante de 33,8 x 33,8 cm, en cocina, ba\u00f1o y cuarto de ropas (incluye adhesivo base cemento para enchape y boquilla) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_17_10_4",
              "customConditional": "show = data.a_bldg_dis_arq_esp1=='Cocina' || data.a_bldg_dis_arq_esp1=='Ba\u00f1o' || data.a_bldg_dis_arq_esp1=='Zona de lavado';",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36117_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n  Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36117_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36117_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36117_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36117_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36117_ingresar_costo",
                "customConditional": "show = data._36117_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36117_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36117 - ACABADO PISOS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36121_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36121_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36121_ingresar_costo = Number(row._36121_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36121_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36121_ingresar_costo = Number(des_36121_ingresar_costo+data.container1.aiu_ejecutor*des_36121_ingresar_costo);\r\n\r\nif(row._36121_seleccione_apu != 'other'){\r\n    val = row._36121_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36121_ingresar_valor*fin_36121_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36117_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36117 - ACABADO PISOS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36117_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36118 - INCRUSTACIONES***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_18",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Ba\u00f1o';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36118 - INCRUSTACIONES - El espacio cuenta con todas las incrustaciones necesarias (colgadera, barra para el jabon, etc.).",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp18z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_18_panel",
            "tableView": false,
            "key": "sec3_6_1_18_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36118 - INCRUSTACIONES - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_18_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp18z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Suministro e instalaci\u00f3n juego accesorios (5 piezas) [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_18_14_18",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36118_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n  Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36118_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36118_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36118_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36118_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36118_ingresar_costo",
                "customConditional": "show = data._36118_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36118_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36118 - INCRUSTACIONES - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36118_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36118_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36118_ingresar_costo = Number(row._36118_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36118_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36118_ingresar_costo = Number(des_36118_ingresar_costo+data.container1.aiu_ejecutor*des_36118_ingresar_costo);\r\n\r\nif(row._36118_seleccione_apu != 'other'){\r\n    val = row._36118_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36118_ingresar_valor*fin_36118_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36118_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36118 - INCRUSTACIONES - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36118_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36119 - DEMOLICI\u00d3N MUROS***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_19",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Muros divisorios internos';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36119 - DEMOLICI\u00d3N MUROS - No se requiere demoler muros porque se encuentran en buenas condiciones, no generan riesgo de colapso para sus habitantes y porque garantizan el buen funcionamiento de los espacios (ej. ventilaci\u00f3n, iluminaci\u00f3n, \u00e1reas m\u00ednimas).",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp19z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_19_panel",
            "tableView": false,
            "key": "sec3_6_1_19_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36119 - DEMOLICI\u00d3N MUROS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_19_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp19z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<p class=\"text-danger\"><b>\"!! ATENCI\u00d3N !!<br>\n \n No tener en cuenta demolici\u00f3n de muros de las culatas.\"<\/b><\/p>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "a_bldg_dis_arq_esp_med_19_0",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n de muros bloque de e=0,12 m a e=0,15 m (incluye retiro sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_19_1_28x",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n de muros bloque de e=0,12 m a e=0,15 m (incluye retiro sobrantes) (y-dir = transversal) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_19_1_28y",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "36119_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36119_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36119_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36119_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36119_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "36119_activar_ejes",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36119_activar_ejes",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar direcci\u00f3n de los ejes a considerar",
                "optionsLabelPosition": "right",
                "inline": false,
                "disabled": true,
                "tableView": false,
                "values": [{
                  "label": "x-dir = longitudinal",
                  "value": "xDirLongitudinal",
                  "shortcut": ""
                }, {
                  "label": "y-dir = transversal",
                  "value": "yDirTransversal",
                  "shortcut": ""
                }],
                "validate": {
                  "required": true
                },
                "key": "_36119_ejes",
                "customConditional": "show = data._36119_activar_ejes == 1;",
                "type": "radio",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36119_ingresar_costo",
                "customConditional": "show = data._36119_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36119_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36119 - DEMOLICI\u00d3N MUROS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36119_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36119_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36119_ingresar_costo = Number(row._36119_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36119_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36119_ingresar_costo = Number(des_36119_ingresar_costo+data.container1.aiu_ejecutor*des_36119_ingresar_costo);\r\n\r\nif(row._36119_seleccione_apu != 'other'){\r\n    val = row._36119_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36119_ingresar_valor*fin_36119_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36119_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36119 - DEMOLICI\u00d3N MUROS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36119_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36120 - CONSTRUCCI\u00d3N MUROS***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_20",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Muros divisorios internos';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36120 - CONSTRUCCI\u00d3N MUROS - No se requiere construir muros nuevos para divisi\u00f3n de espacios.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp20z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_20_panel",
            "tableView": false,
            "key": "sec3_6_1_20_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36120 - CONSTRUCCI\u00d3N MUROS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_20_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp20z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<p class=\"text-danger\"><b>\"!! ATENCI\u00d3N !!<br>\n \n No tener en cuenta construcci\u00f3n de muros de las culatas.\"<\/b><\/p>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "a_bldg_dis_arq_esp_med_20_0",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n placa contrapiso e=15 cm (incluye retiro de escombros) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_1_27",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n de muros bloque de e=0,12 m a e=0,15 m (incluye retiro sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_1_28",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Fundir concreto cicl\u00f3peo 60\/40 (2500 psi) [m3]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_2_1",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Fundir placa concreto 2500 psi, incluye malla electrosoldada, H-131, e=8 cm [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_2_3",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Excavaci\u00f3n manual de 0 a 1,20 m (incluye retiro) [m3]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_2_15",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Vigas de cimentaci\u00f3n 0,30 x 0,30 m concreto de 3000 psi (incluye refuerzo) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_2_19",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Relleno en material seleccionado de la excavaci\u00f3n (incluye extendido, nivelaci\u00f3n y compactaci\u00f3n) [m3]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_2_21",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Columneta 0,25 x 0,125 m, concreto 3000 psi (incluye refuerzo y formaleta) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_2_32",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n mamposter\u00eda en bloque No. 5 [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_6_1x",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n mamposter\u00eda en bloque No. 5 (y-dir = transversal) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_6_1y",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n de muro en Superboard, doble cara e=10 cm (incluye todos los materiales para su correcto acabado) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_20_6_15",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36120_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n  Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36120_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36120_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36120_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36120_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "36120_activar_ejes",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36120_activar_ejes",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar direcci\u00f3n de los ejes a considerar",
                "optionsLabelPosition": "right",
                "inline": false,
                "disabled": true,
                "tableView": false,
                "values": [{
                  "label": "x-dir = longitudinal",
                  "value": "xDirLongitudinal",
                  "shortcut": ""
                }, {
                  "label": "y-dir = transversal",
                  "value": "yDirTransversal",
                  "shortcut": ""
                }],
                "validate": {
                  "required": true
                },
                "key": "_36120_ejes",
                "customConditional": "show = data._36120_activar_ejes == 1;",
                "type": "radio",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36120_ingresar_costo",
                "customConditional": "show = data._36120_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36120_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36120 - CONSTRUCCI\u00d3N MUROS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36120_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36120_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36120_ingresar_costo = Number(row._36120_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36120_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36120_ingresar_costo = Number(des_36120_ingresar_costo+data.container1.aiu_ejecutor*des_36120_ingresar_costo);\r\n\r\nif(row._36120_seleccione_apu != 'other'){\r\n    val = row._36120_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36120_ingresar_valor*fin_36120_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36120_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36120 - CONSTRUCCI\u00d3N MUROS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36120_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36121 - ACABADO MUROS Y REVOQUES***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_21",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Muros perimetrales' || data.a_bldg_dis_arq_esp1=='Muros divisorios internos';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36121 - ACABADO MUROS Y REVOQUES - Todas las superficies accesibles de los muros tiene acabado con revoques en buen estado (no presenten fisuras, hinchamiento por humedad, que no presenten desprendimiento, etc.).",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp21z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_21_panel",
            "tableView": false,
            "key": "sec3_6_1_21_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36121 - ACABADO MUROS Y REVOQUES - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_21_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp21z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Demolici\u00f3n de pa\u00f1ete (incluye retiro) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_1_21x",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n de pa\u00f1ete (incluye retiro) (y-dir = transversal) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_1_21y",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Revoque estructural sin malla e=1,5 cm (incluye mortero 1:4 con arena de rio lavada) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_2_51x",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Revoque estructural sin malla e=1,5 cm (incluye mortero 1:4 con arena de rio lavada) (y-dir = transversal) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_2_51y",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Revoque estructural con malla e=3 cm [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_2_52x",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Revoque estructural con malla e=3 cm (y-dir = transversal) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_2_52y",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n de Vinilo, 3 manos [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_8_1",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Filos y dilataciones (incluye materiales y mano de obra) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_8_2",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n pared cer\u00e1mica brillante lisa 20 x 30 cm (incluye adhesivo base cemento para enchape y boquilla) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_21_10_5",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36121_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n  Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36121_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36121_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36121_seleccione_apu ==\"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36121_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "36121_activar_ejes",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36121_activar_ejes",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar direcci\u00f3n de los ejes a considerar",
                "optionsLabelPosition": "right",
                "inline": false,
                "disabled": true,
                "tableView": false,
                "values": [{
                  "label": "x-dir = longitudinal",
                  "value": "xDirLongitudinal",
                  "shortcut": ""
                }, {
                  "label": "y-dir = transversal",
                  "value": "yDirTransversal",
                  "shortcut": ""
                }],
                "validate": {
                  "required": true
                },
                "key": "_36121_ejes",
                "customConditional": "show = data._36121_activar_ejes == 1;",
                "type": "radio",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36121_ingresar_costo",
                "customConditional": "show = data._36121_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36121_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36121 - ACABADO MUROS Y REVOQUES - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._3611_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._3611_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_3611_ingresar_costo = Number(row._3611_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._3611_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_3611_ingresar_costo = Number(des_3611_ingresar_costo+data.container1.aiu_ejecutor*des_3611_ingresar_costo);\r\n\r\nif(row._3611_seleccione_apu != 'other'){\r\n    val = row._3611_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._3611_ingresar_valor*fin_3611_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36121_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36121 - ACABADO MUROS Y REVOQUES - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36121_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36122 - TEJAS\/CIELO RASO***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_22",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Techo\/Cubierta';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36122 - TEJAS\/CIELO RASO - La cubierta se encuentra en buen estado, sin filtraciones, tiene elementos de soporte adecuados los cuales est\u00e1n fijados a un elemento de amarre en concreto reforzado anclado a las culatas que permita la correcta trasferencia de las cargas.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp22z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_22_panel",
            "tableView": false,
            "key": "sec3_6_1_22_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36122 - TEJAS\/CIELO RASO - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_22_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp22z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<p><b class=\"text-danger\">\"!! ATENCI\u00d3N !!<br>\n \n En este modulo SE PUEDE tener en cuenta demolici\u00f3n\/construcci\u00f3n de muros de las culatas.\"<\/b>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "a_bldg_dis_arq_esp_med_22_0",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Desmonte alistado teja de barro (incluye retiro) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_1_8",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Desmonte cubierta lamina de zinc (incluye retiro) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_1_9",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Desmonte de teja asbesto cemento (incluye retiro y estructura) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_1_10",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Demolici\u00f3n de muros bloque de e=0,12 m a e=0,15 m (incluye retiro sobrantes) [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_1_28",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Viga cinta (0,10 x 0,10 m) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_2_48",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Culatas en bloque No. 4 (incluye materiales y mano de obra) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_5_5",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n teja en fibrocemento perfil 7, tipo Eternit o similar [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_5_8",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n teja trasl\u00facida perfil 7, tipo Eternit o similar [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_5_9",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n flanche en l\u00e1mina calibre 26 [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_5_11",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Estructura perfil en C-18, 160 x 60 mm, e=2 mm (luces hasta 3,5 m), aplica para cubierta en fibrocemento (incluye anticorrosivo) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_5_13",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Anclaje de correa a viga cinta met\u00e1lica [und]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_5_38",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n mamposter\u00eda en bloque No. 5 [m2]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_22_6_1",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36122_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36122_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36122_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36122_seleccione_apu == \"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36122_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36122_ingresar_costo",
                "customConditional": "show = data._36122_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36122_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36122 - TEJAS\/CIELO RASO - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36122_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36122_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36122_ingresar_costo = Number(row._36122_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36122_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36122_ingresar_costo = Number(des_36122_ingresar_costo+data.container1.aiu_ejecutor*des_36122_ingresar_costo);\r\n\r\nif(row._36122_seleccione_apu != 'other'){\r\n    val = row._36122_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36122_ingresar_valor*fin_36122_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36122_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36122 - TEJAS\/CIELO RASO - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36122_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36123 - CANAL***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_23",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Muros perimetrales';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36123 - CANAL - La vivienda cuenta con una canal en buen estado que garantizar la recolecci\u00f3n de aguas lluvias provenientes de la cubierta.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp23z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_23_panel",
            "tableView": false,
            "key": "sec3_6_1_23_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36123 - CANAL - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_23_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp23z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Desmonte canal (incluye retiro) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_23_1_37",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n canal l\u00e1mina galvanizada calibre 22, desarrollo 0,75 m [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_23_5_15",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36123_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n  Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36123_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36123_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36123_seleccione_apu == \"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36123_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36123_ingresar_costo",
                "customConditional": "show = data._36123_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36123_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36123 - CANAL - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36123_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36123_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36123_ingresar_costo = Number(row._36123_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36123_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36123_ingresar_costo = Number(des_36123_ingresar_costo+data.container1.aiu_ejecutor*des_36123_ingresar_costo);\r\n\r\nif(row._36123_seleccione_apu != 'other'){\r\n    val = row._36123_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36123_ingresar_valor*fin_36123_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36123_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36123 - CANAL - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36123_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36124 - BAJANTE***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_24",
            "customConditional": "show = data.a_bldg_dis_arq_esp1=='Muros perimetrales';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36124 - BAJANTE - La vivienda cuenta con una bajante en buen estado y completa.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp24z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_24_panel",
            "tableView": false,
            "key": "sec3_6_1_24_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36124 - BAJANTE - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_24_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp24z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Desmonte bajante A.LL. (incluye retiro) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_24_1_15",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Suministro e instalaci\u00f3n bajante 12 x 6 cm en l\u00e1mina galvanizada calibre 26 [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_24_5_20",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36124_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "editGrid",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36124_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36124_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36124_seleccione_apu == \"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36124_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36124_ingresar_costo",
                "customConditional": "show = data._36124_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36124_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36124 - BAJANTE - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36124_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36124_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36124_ingresar_costo = Number(row._36124_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36124_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36124_ingresar_costo = Number(des_36124_ingresar_costo+data.container1.aiu_ejecutor*des_36124_ingresar_costo);\r\n\r\nif(row._36124_seleccione_apu != 'other'){\r\n    val = row._36124_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36124_ingresar_valor*fin_36124_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36124_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36124 - BAJANTE - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36124_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }, {
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">>>>>> ***36125 - ELEMENTOS DE CONEXI\u00d3N TECHO-MUROS***<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "sec3_6_1_25",
            "customConditional": "show == data.a_bldg_dis_arq_esp1=='Techo\/Cubierta';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "36125 - ELEMENTOS DE CONEXI\u00d3N TECHO-MUROS - Si la altura del pico\/caballete de la culata supera los 50 cm con respecto a su base, existe un elemento horizontal de concreto reforzado a la base de la misma\/culata, continuo por encima de todos los muros, que garantice adecuada conexi\u00f3n entre las culatas y los muros.",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Cumple",
              "value": "c",
              "shortcut": ""
            }, {
              "label": "No Cumple",
              "value": "nc",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "a_bldg_dis_arq_esp25z",
            "type": "radio",
            "input": true
          }, {
            "label": "sec3_6_1_25_panel",
            "tableView": false,
            "key": "sec3_6_1_25_panel",
            "type": "container",
            "input": true,
            "components": [{
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">36125 - ELEMENTOS DE CONEXI\u00d3N TECHO-MUROS - Medidas de intervenci\u00f3n<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "sec3_6_1_25_1",
              "customConditional": "show = data.a_bldg_dis_viv_0a=='si' && data.a_bldg_dis_arq_esp25z=='nc';",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "Viga de amarre (0,15 x 0,20 m) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_25_2_46",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "Viga de amarre (0,10 x 0,20 m) [m]",
              "mask": false,
              "spellcheck": true,
              "tableView": false,
              "delimiter": false,
              "requireDecimal": false,
              "inputFormat": "plain",
              "validate": {
                "required": true
              },
              "key": "a_bldg_dis_arq_esp_med_25_2_47",
              "type": "number",
              "input": true,
              "defaultValue": 0
            }, {
              "label": "HTML",
              "attrs": [{
                "attr": "",
                "value": ""
              }],
              "content": "<h5 class=\"bg-info text-white\">En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.<\/h5>",
              "refreshOnChange": false,
              "tableView": false,
              "key": "_36125_apus_adicionales",
              "type": "htmlelement",
              "input": false
            }, {
              "label": "En caso necesite incluir PRECIOS UNITARIOS adicionales, por favor ingrese a este modulo.",
              "tableView": false,
              "templates": {
                "header": "<div class=\"row\">\n  Por favor, presionar 'Add Another' para ingresar un nuevo espacio.\n<\/div>"
              },
              "rowDrafts": false,
              "key": "enCasoNecesiteIncluirPreciosUnitariosAdicionalesPorFavorIngreseAEsteModulo",
              "type": "editgrid",
              "input": true,
              "components": [{
                "label": "PRECIO UNITARIO adicional a seleccionar",
                "tableView": true,
                "data": {
                  "values": [{
                    "label": "CDVD - Listado precios unitarios (rev2)",
                    "value": "cdvdListadoPreciosUnitariosRev2"
                  }, {
                    "label": "OTHER",
                    "value": "other"
                  }]
                },
                "selectThreshold": 0.3,
                "validate": {
                  "required": true
                },
                "key": "_36125_seleccione_apu",
                "type": "select",
                "indexeddb": {
                  "filter": []
                },
                "input": true
              }, {
                "label": "36125_hasother_calc",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if(data._36125_seleccione_apu == \"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
                "validate": {
                  "required": true
                },
                "key": "_36125_hasother_calc",
                "type": "textfield",
                "input": true
              }, {
                "label": "Ingresar costo unitario (SIN descuento)",
                "mask": false,
                "spellcheck": true,
                "disabled": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36125_ingresar_costo",
                "customConditional": "show = data._36125_hasother_calc == 1;",
                "type": "number",
                "input": true
              }, {
                "label": "Ingresar cantidad",
                "mask": false,
                "spellcheck": true,
                "tableView": false,
                "delimiter": false,
                "requireDecimal": false,
                "inputFormat": "plain",
                "validate": {
                  "required": true
                },
                "key": "_36125_ingresar_valor",
                "type": "number",
                "input": true
              }, {
                "label": "36125 - ELEMENTOS DE CONEXI\u00d3N TECHO-MUROS - Costo precio unitario adicional",
                "disabled": true,
                "tableView": true,
                "calculateValue": "if (row._36125_seleccione_apu.value !== '') {\r\n  var choice_eval = '$' + row._36125_seleccione_apu.value + ':';\r\n} else {\r\n  var choice_eval = '';\r\n}\r\n \r\nif (data.container1.global !== null) {\r\n  var cost_adc = Number(data.container1.global.split(choice_eval).pop().split('$')[0]);\r\n} else {\r\n  var cost_adc = 0;\r\n}\r\n \r\nvar des_cost_adc = Number(cost_adc-data.container1.descuento_ejecutor*cost_adc);\r\nvar des_36125_ingresar_costo = Number(row._36125_ingresar_costo)-Number(data.container1.descuento_ejecutor*row._36125_ingresar_costo);\r\n \r\nvar aiu_ejecutor = data.container1.aiu_ejecutor;\r\nvar fin_cost_adc = Number(des_cost_adc+aiu_ejecutor*des_cost_adc);\r\nvar fin_36125_ingresar_costo = Number(des_36125_ingresar_costo+data.container1.aiu_ejecutor*des_36125_ingresar_costo);\r\n\r\nif(row._36125_seleccione_apu != 'other'){\r\n    val = row._36125_ingresar_valor*fin_cost_adc;\r\n}else{\r\n    val = row._36125_ingresar_valor*fin_36125_ingresar_costo;\r\n}\r\nvalue = val.toFixed(2);\r\ninstance.setValue(value);",
                "validate": {
                  "required": true
                },
                "key": "_36125_cost_adicionales",
                "type": "textfield",
                "input": true
              }, {
                "label": "36125 - ELEMENTOS DE CONEXI\u00d3N TECHO-MUROS - Costo actividad por espacio",
                "disabled": true,
                "tableView": true,
                "validate": {
                  "required": true
                },
                "key": "_36125_cost",
                "type": "textfield",
                "input": true
              }]
            }]
          }]
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<h5 class=\"bg-info text-white\">>>> PRESUPUESTO VIVIENDA - Priorizaci\u00f3n de las actividades<\/h5>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "sec3_6_3",
          "customConditional": "show = data.a_bldg_dis_viv_0a=='si';",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "Resumen de las falencias en la vivienda evaluada",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "def_summary",
          "type": "textfield",
          "input": true
        }, {
          "label": "Costo TOTAL intervenci\u00f3n",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "cost_total_bis",
          "type": "textfield",
          "input": true
        }, {
          "label": "Seleccionar las sub-categor\u00edas a priorizar (minimo: 1 sub-categoria, m\u00e1ximo: 5 sub categor\u00edas - solo cuando el 'Costo TOTAL intervenci\u00f3n' > 'Subsidio')",
          "optionsLabelPosition": "right",
          "tableView": false,
          "values": [{
            "label": "CDVD - Listado priorizaci\u00f3n actividades (rev1)",
            "value": "cdvdListadoPriorizacionActividadesRev1",
            "shortcut": ""
          }],
          "validate": {
            "required": true
          },
          "key": "priorizacion_select",
          "type": "selectboxes",
          "input": true,
          "inputType": "checkbox",
          "defaultValue": {
            "": false
          }
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<p><b class=\"text-danger\">\"!! ATENCI\u00d3N !!<br>\n \n Cualquier cambio a las sub-categor\u00edas a priorizar cancela la selecci\u00f3n de las actividades a priorizar en el campo a continuaci\u00f3n.\"<\/b><\/p>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "label000",
          "customConditional": "show = data.priorizacion_select_choices !== null && data.visibility_actividades !== 0;",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "priorizacion_select_choices",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "priorizacion_select_choices",
          "type": "textfield",
          "input": true
        }, {
          "label": "dyn_actividades_labels",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "dyn_actividades_labels",
          "type": "textfield",
          "input": true
        }, {
          "label": "dyn_actividades_values",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "dyn_actividades_values",
          "type": "textfield",
          "input": true
        }, {
          "label": "visibility_actividades",
          "mask": false,
          "spellcheck": true,
          "disabled": true,
          "tableView": false,
          "delimiter": false,
          "requireDecimal": false,
          "inputFormat": "plain",
          "validate": {
            "required": true
          },
          "key": "visibility_actividades",
          "type": "number",
          "input": true
        }, {
          "label": ">> Resumen actividades anteriormente seleccionadas por el 'Ejecutor' <<",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "resumen_prio",
          "type": "textfield",
          "input": true
        }, {
          "label": "Seleccionar actividades a priorizar",
          "optionsLabelPosition": "right",
          "tableView": false,
          "values": [{
            "label": "test1",
            "value": "test1",
            "shortcut": ""
          }],
          "validate": {
            "required": true
          },
          "key": "dyn_actividades_setchoices",
          "customConditional": "show = data.priorizacion_select_choices !== null;",
          "type": "selectboxes",
          "input": true,
          "inputType": "checkbox",
          "defaultValue": {
            "": false
          }
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<p><b class=\"text-danger\">No hay actividades para las sub-categor\u00edas seleccionadas.<\/b><\/p>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "label001",
          "customConditional": "show = data.visibility_actividades === 0;",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "dyn_actividades_choices",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "dyn_actividades_choices",
          "type": "textfield",
          "input": true
        }, {
          "label": "cu_nd_final",
          "disabled": true,
          "tableView": true,
          "validate": {
            "required": true
          },
          "key": "cu_nd_final",
          "type": "textfield",
          "input": true
        }, {
          "label": "HTML",
          "attrs": [{
            "attr": "",
            "value": ""
          }],
          "content": "<h5 class=\"bg-info text-white\">TRABAJOS PARCIALES O ADICIONALES<\/h5>",
          "refreshOnChange": false,
          "tableView": false,
          "key": "trabajos_parciales_adicionales",
          "type": "htmlelement",
          "input": false
        }, {
          "label": "\u00bfDesea incluir en el PRESUPUESTO PRIORIZADO trabajos parciales o adicionales?",
          "optionsLabelPosition": "right",
          "inline": false,
          "tableView": false,
          "values": [{
            "label": "Si",
            "value": "si",
            "shortcut": ""
          }, {
            "label": "No",
            "value": "no",
            "shortcut": ""
          }],
          "validate": {
            "required": true
          },
          "key": "trabajos_adicionales",
          "customConditional": "show = data.priorizacion_select_choices !== null && data.visibility_actividades !== 0;",
          "type": "radio",
          "input": true
        }, {
          "label": "trabajos_parciales_adicionales_panel",
          "tableView": false,
          "key": "trabajos_parciales_adicionales_panel",
          "type": "container",
          "input": true,
          "components": [{
            "label": "HTML",
            "attrs": [{
              "attr": "",
              "value": ""
            }],
            "content": "<h5 class=\"bg-info text-white\">Ingresar TRABAJOS PARCIALES o ADICIONALES a incluir en el presupuesto<\/h5>",
            "refreshOnChange": false,
            "tableView": false,
            "key": "final_apus_adicionales",
            "customConditional": "show = data.priorizacion_select_choices !== null && data.visibility_actividades !== 0 && data.trabajos_adicionales == 'si';",
            "type": "htmlelement",
            "input": false
          }, {
            "label": "resumen_trbj_parciales_adc",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "resumen_trbj_parciales_adc",
            "type": "textfield",
            "input": true
          }, {
            "label": "Espacio a seleccionar",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "GENERAL",
              "value": "general",
              "shortcut": ""
            }, {
              "label": "Cocina",
              "value": "cocina",
              "shortcut": ""
            }, {
              "label": "Zona de lavado",
              "value": "zonaDeLavado",
              "shortcut": ""
            }, {
              "label": "Ba\u00f1o",
              "value": "bano",
              "shortcut": ""
            }, {
              "label": "Sala\/Comedor",
              "value": "salaComedor",
              "shortcut": ""
            }, {
              "label": "Muros divisorios internos",
              "value": "murosDivisoriosInternos",
              "shortcut": ""
            }, {
              "label": "Alcoba",
              "value": "alcoba",
              "shortcut": ""
            }, {
              "label": "Patio",
              "value": "patio",
              "shortcut": ""
            }, {
              "label": "Muros perimetrales",
              "value": "murosPerimetrales",
              "shortcut": ""
            }, {
              "label": "Redes intradomiciliarias",
              "value": "redesIntradomiciliarias",
              "shortcut": ""
            }, {
              "label": "Techo\/Cubierta",
              "value": "techoCubierta",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "espacio_seleccionar",
            "type": "radio",
            "input": true
          }, {
            "label": "PRECIO UNITARIO a seleccionar",
            "tableView": true,
            "data": {
              "values": [{
                "label": "CDVD - Listado precios unitarios (rev2)",
                "value": "cdvdListadoPreciosUnitariosRev2"
              }, {
                "label": "OTHER",
                "value": "other"
              }]
            },
            "selectThreshold": 0.3,
            "validate": {
              "required": true
            },
            "key": "final_seleccione_apu",
            "customConditional": "show = data.espacio_seleccionar == 'GENERAL';",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "input": true
          }, {
            "label": "PRECIO UNITARIO a seleccionar",
            "tableView": true,
            "data": {
              "values": [{
                "label": "CDVD - Listado precios unitarios preseleccionados por espacio (rev0)",
                "value": "cdvdListadoPreciosUnitariosPreseleccionadosPorEspacioRev0"
              }]
            },
            "selectThreshold": 0.3,
            "validate": {
              "required": true
            },
            "key": "final_seleccione_apu_espacio",
            "customConditional": "show = data.espacio_seleccionar !== 'GENERAL' && data.espacio_seleccionar !== null;",
            "type": "select",
            "indexeddb": {
              "filter": []
            },
            "input": true
          }, {
            "label": "espacio_seleccionar_calc1",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "espacio_seleccionar_calc1",
            "type": "textfield",
            "input": true
          }, {
            "label": "final_hasother_calc",
            "disabled": true,
            "tableView": true,
            "calculateValue": "if(data.final_seleccione_apu == \"OTHER\"){\nvalue == 1;\n}\nelse{\nvalue === 0;\n}",
            "validate": {
              "required": true
            },
            "key": "final_hasother_calc",
            "type": "textfield",
            "input": true
          }, {
            "label": "final_activar_ejes",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "final_activar_ejes",
            "type": "textfield",
            "input": true
          }, {
            "label": "Ingresar direcci\u00f3n de los ejes a considerar",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "x-dir = longitudinal",
              "value": "xDirLongitudinal",
              "shortcut": ""
            }, {
              "label": "y-dir = transversal",
              "value": "yDirTransversal",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "final_ejes",
            "customConditional": "show = data.final_activar_ejes == 1;",
            "type": "radio",
            "input": true
          }, {
            "label": "Ingresar costo unitario (SIN descuento)",
            "mask": false,
            "spellcheck": true,
            "disabled": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "final_ingresar_costo",
            "customConditional": "show = data.final_hasother_calc == 1;",
            "type": "number",
            "input": true
          }, {
            "label": "Ingresar cantidad",
            "mask": false,
            "spellcheck": true,
            "tableView": false,
            "delimiter": false,
            "requireDecimal": false,
            "inputFormat": "plain",
            "validate": {
              "required": true
            },
            "key": "final_ingresar_valor",
            "type": "number",
            "input": true
          }, {
            "label": "FINAL - Costo precio unitario adicional",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "final_cost_adicionales",
            "type": "textfield",
            "input": true
          }, {
            "label": "Costo TOTAL intervenci\u00f3n PRIORIZADO",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "costo_total_priorizado",
            "type": "textfield",
            "input": true
          }, {
            "label": "\u00bfEl diagnostico tendr\u00e1 costo?",
            "optionsLabelPosition": "right",
            "inline": false,
            "tableView": false,
            "values": [{
              "label": "Si",
              "value": "si",
              "shortcut": ""
            }, {
              "label": "No",
              "value": "no",
              "shortcut": ""
            }],
            "validate": {
              "required": true
            },
            "key": "costo_diagnostico",
            "type": "radio",
            "input": true
          }, {
            "label": "Costo diagnostico",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "costo_diagnostico_calc1",
            "customConditional": "show = data.costo_diagnostico == 'si';",
            "type": "textfield",
            "input": true
          }, {
            "label": "Monto SUBSIDIO todav\u00eda DISPONIBLE (COP 9,937,392.00 = 12 SMMLV en 2019)",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "subsidio_disponible",
            "type": "textfield",
            "input": true
          }, {
            "label": "Porcentaje de cumplimiento prioridades y sub-prioridades (monto atacado) [%]",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "porcentaje_prio_cost",
            "type": "textfield",
            "input": true
          }, {
            "label": "Porcentaje de cumplimiento prioridades y sub-prioridades (numero falencias atacadas) [%]",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "porcentaje_prio",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio13_cost_nc",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio13_cost_nc",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio13_cost_nc_prioritized",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio13_cost_nc_prioritized",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio4_cost_nc",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio4_cost_nc",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio4_cost_nc_prioritized",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio4_cost_nc_prioritized",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio13_c",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio13_c",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio13_nc",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio13_nc",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio13_nc_prioritized",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio13_nc_prioritized",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio4_c",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio4_c",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio4_nc",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio4_nc",
            "type": "textfield",
            "input": true
          }, {
            "label": "summary_prio4_nc_prioritized",
            "disabled": true,
            "tableView": true,
            "validate": {
              "required": true
            },
            "key": "summary_prio4_nc_prioritized",
            "type": "textfield",
            "input": true
          }]
        }]
      }]
    }, {
      "title": "CIERRE",
      "breadcrumbClickable": true,
      "buttonSettings": {
        "previous": true,
        "cancel": true,
        "next": true
      },
      "collapsible": false,
      "tableView": false,
      "key": "page6",
      "type": "panel",
      "label": "CIERRE",
      "input": false,
      "components": [{
        "label": "Fecha estimada inicio de las obras",
        "tableView": true,
        "key": "fecha_estimada_inicio_obras",
        "customConditional": "show = data.costo_total_priorizado > 0;",
        "type": "textfield",
        "input": true
      }, {
        "label": "Duraci\u00f3n estimada de las obras [dias]",
        "mask": false,
        "spellcheck": true,
        "tableView": false,
        "delimiter": false,
        "requireDecimal": false,
        "inputFormat": "plain",
        "key": "duracion_estimada_obras",
        "customConditional": "show = data.costo_total_priorizado > 0;",
        "type": "number",
        "input": true
      }, {
        "label": "Fecha estimada fin de las obras",
        "disabled": true,
        "tableView": false,
        "storage": "url",
        "image": true,
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "multiple": true,
        "validate": {
          "required": true,
          "multiple": true
        },
        "key": "fecha_estimada_fin_obras",
        "type": "file",
        "url": "mondasolvo.net\/fileUpload",
        "input": true
      }, {
        "label": "Comentarios generales (opcional)",
        "tableView": true,
        "key": "comentariosGeneralesOpcional1",
        "type": "textfield",
        "input": true
      }, {
        "label": "CIERRE -> FOTOS generales de la vivienda",
        "tableView": false,
        "storage": "url",
        "image": true,
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "multiple": true,
        "validate": {
          "multiple": true
        },
        "key": "cierreFotosGeneralesDeLaVivienda2",
        "type": "file",
        "input": true,
        "url": "mondasolvo.net\/fileUpload"
      }, {
        "label": "CIERRE -> FOTOS planos de la vivienda",
        "tableView": false,
        "storage": "url",
        "image": true,
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "multiple": true,
        "validate": {
          "required": true,
          "multiple": true
        },
        "key": "fotos_planos",
        "customConditional": "show = data.costo_total_priorizado > 0;",
        "type": "file",
        "url": "mondasolvo.net\/fileUpload",
        "input": true
      }, {
        "label": "Firma personal ejecutor",
        "tableView": false,
        "validate": {
          "required": true,
          "custom": "valid = data.a_comentarios_1 !== 'viviendas_tramitadas';"
        },
        "key": "firmaPersonalEjecutor",
        "type": "signature",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>> Concertaci\u00f3n intervenciones con jefe de hogar<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "concertacion_jefe_de_hogar",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Resumen actividades y presupuesto",
        "disabled": true,
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "resumen_concertacion",
        "type": "textfield",
        "input": true
      }, {
        "label": "Con el fin de suscribir el Acta de Concertaci\u00f3n con el hogar habilitado para DIAGNOSTICO, seg\u00fan el orden de las prioridades y su condici\u00f3n a subsanar, favorecidas para el Programa de Mejoras Locativas de la vivienda, el jefe de hogar:",
        "optionsLabelPosition": "right",
        "inline": false,
        "tableView": false,
        "values": [{
          "label": "Aprueba",
          "value": "aprueba",
          "shortcut": ""
        }, {
          "label": "Rechaza,",
          "value": "rechaza",
          "shortcut": ""
        }, {
          "label": " INDECISO",
          "value": "indeciso",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "aprobacion_jefe",
        "customConditional": "show = data.costo_total_priorizado !== 0 && data.costo_total_priorizado !== null;",
        "type": "radio",
        "input": true
      }, {
        "label": "Firma jefe de hogar",
        "tableView": false,
        "validate": {
          "required": true
        },
        "key": "a_firma_jefe",
        "customConditional": "show = (data.costo_total_priorizado !== 0) && (data.costo_total_priorizado !== null) && (data.aprobacion_jefe !== 'INDECICO') && (data.aprobacion_jefe !== null);",
        "type": "signature",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>>> Aprobaci\u00f3n ente territorial<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "aprobacion_ente_territorial",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<p><b class=\"text-danger\">Rellenar los campos a continuaci\u00f3n solo si el ente territorial acompa\u00f1a la visita. En caso contrario, dejar los campos en blanco.<\/b><\/p>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "label_ente_territorial",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Nombre personal ente territorial",
        "tableView": true,
        "data": {
          "values": [{
            "label": "\"CDVD - Personal supervisores, interventores, ejecutores y entes territoriales'",
            "value": "cdvdPersonalSupervisoresInterventoresEjecutoresYEntesTerritoriales"
          }, {
            "label": "OTHER ",
            "value": "other"
          }]
        },
        "selectThreshold": 0.3,
        "key": "nombre_ente_territorial",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "Nombre y apellido personal ente territorial",
        "tableView": true,
        "key": "nombre_ente_territorial2",
        "type": "textfield",
        "input": true
      }, {
        "label": "Nombre del ente territorial",
        "tableView": true,
        "key": "ente_territorial",
        "type": "textfield",
        "input": true
      }, {
        "label": "Cargo personal ente territorial",
        "tableView": true,
        "key": "cargo_ente_territorial",
        "type": "textfield",
        "input": true
      }, {
        "label": "Firma personal ente territorial",
        "tableView": false,
        "key": "firma_ente_territorial",
        "type": "signature",
        "input": true
      }, {
        "label": "calc1",
        "disabled": true,
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "calc1",
        "type": "textfield",
        "input": true
      }, {
        "label": "calc2",
        "disabled": true,
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "calc2",
        "type": "textfield",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>> Aprobaci\u00f3n<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "aprobacion",
        "customConditional": "show = data.calc1 !== -1;",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>>> Aprobaci\u00f3n interventor -> ejecutor<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "aprobacion_interventor",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Nombre personal interventor (TECNICO)",
        "tableView": true,
        "data": {
          "values": [{
            "label": "\"CDVD - Personal supervisores, interventores, ejecutores y entes territoriales'",
            "value": "cdvdPersonalSupervisoresInterventoresEjecutoresYEntesTerritoriales"
          }, {
            "label": "OTHER ",
            "value": "other"
          }]
        },
        "selectThreshold": 0.3,
        "validate": {
          "required": true
        },
        "key": "nombre_interventor",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "Nombre personal interventor (SOCIAL)",
        "tableView": true,
        "data": {
          "values": [{
            "label": "\"CDVD - Personal supervisores, interventores, ejecutores y entes territoriales'",
            "value": "cdvdPersonalSupervisoresInterventoresEjecutoresYEntesTerritoriales"
          }, {
            "label": "OTHER",
            "value": "other"
          }]
        },
        "selectThreshold": 0.3,
        "validate": {
          "required": true
        },
        "key": "nombre_interventor_social",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "Resumen correcciones",
        "disabled": true,
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "resumen_correcciones_interventor",
        "type": "textfield",
        "input": true
      }, {
        "label": "El interventor aprueba",
        "optionsLabelPosition": "right",
        "inline": false,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "elInterventorAprueba",
        "type": "radio",
        "input": true
      }, {
        "label": "Comentarios",
        "tableView": true,
        "key": "comentarios_interventor",
        "customConditional": "show = data.el_interventor_aprueba == 'no';",
        "type": "textfield",
        "input": true
      }, {
        "label": "Fotos",
        "tableView": false,
        "storage": "url",
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "key": "fotos_interventor",
        "type": "file",
        "url": "https:\/\/web.mondasolvo.net\/api\/fileUpload",
        "input": true
      }, {
        "label": "Fecha",
        "tableView": false,
        "enableMinDateInput": false,
        "datePicker": {
          "disableWeekends": false,
          "disableWeekdays": false
        },
        "enableMaxDateInput": false,
        "validate": {
          "required": true
        },
        "key": "fecha_interventor",
        "type": "datetime",
        "input": true,
        "widget": {
          "type": "calendar",
          "displayInTimezone": "viewer",
          "language": "en",
          "useLocaleSettings": false,
          "allowInput": true,
          "mode": "single",
          "enableTime": true,
          "noCalendar": false,
          "format": "yyyy-MM-dd hh:mm a",
          "hourIncrement": 1,
          "minuteIncrement": 1,
          "time_24hr": false,
          "minDate": null,
          "disableWeekends": false,
          "disableWeekdays": false,
          "maxDate": null
        }
      }, {
        "label": "Firma personal interventor (TECNICO)",
        "tableView": false,
        "validate": {
          "required": true
        },
        "key": "firma_interventor",
        "customConditional": "show = data.el_interventor_aprueba == 'si';",
        "type": "signature",
        "input": true
      }, {
        "label": "Firma personal interventor (SOCIAL)",
        "tableView": false,
        "validate": {
          "required": true
        },
        "key": "firma_interventor_social",
        "customConditional": "show = data.el_interventor_aprueba == 'si';",
        "type": "signature",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>>>> Correcci\u00f3n ejecutor<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "correccion_ejecutor",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Nombre personal ejecutor",
        "tableView": true,
        "data": {
          "values": [{
            "label": "\"CDVD - Personal supervisores, interventores, ejecutores y entes territoriales'",
            "value": "cdvdPersonalSupervisoresInterventoresEjecutoresYEntesTerritoriales"
          }, {
            "label": "OTHER",
            "value": "other"
          }]
        },
        "selectThreshold": 0.3,
        "validate": {
          "required": true
        },
        "key": "nombre_ejecutor_corr",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "El ejecutor levant\u00f3 las correcciones del interventor",
        "optionsLabelPosition": "right",
        "inline": false,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "el_ejecutor_corrigio_corr",
        "type": "radio",
        "input": true
      }, {
        "label": "Comentarios",
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "comentarios_ejecutor_corr",
        "customConditional": "show = data.el_ejecutor_corrigio_corr == 'no';",
        "type": "textfield",
        "input": true
      }, {
        "label": "Fotos",
        "tableView": false,
        "storage": "url",
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "key": "fotos_ejecutor_corr",
        "type": "file",
        "url": "https:\/\/web.mondasolvo.net\/api\/fileUpload",
        "input": true
      }, {
        "label": "Fecha",
        "tableView": false,
        "enableMinDateInput": false,
        "datePicker": {
          "disableWeekends": false,
          "disableWeekdays": false
        },
        "enableMaxDateInput": false,
        "validate": {
          "required": true
        },
        "key": "fecha_ejecutor_corr",
        "type": "datetime",
        "input": true,
        "widget": {
          "type": "calendar",
          "displayInTimezone": "viewer",
          "language": "en",
          "useLocaleSettings": false,
          "allowInput": true,
          "mode": "single",
          "enableTime": true,
          "noCalendar": false,
          "format": "yyyy-MM-dd hh:mm a",
          "hourIncrement": 1,
          "minuteIncrement": 1,
          "time_24hr": false,
          "minDate": null,
          "disableWeekends": false,
          "disableWeekdays": false,
          "maxDate": null
        }
      }, {
        "label": "Firma personal ejecutor",
        "tableView": false,
        "validate": {
          "required": true
        },
        "key": "firma_ejecutor_corr",
        "customConditional": "show = data.el_ejecutor_corrigio_corr == 'si';",
        "type": "signature",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>>> Aprobaci\u00f3n supervisor -> interventor<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "aprobacion_supervisor",
        "customConditional": "show = data.calc2 != -1;",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Nombre personal supervisor",
        "tableView": true,
        "data": {
          "values": [{
            "label": "\"CDVD - Personal supervisores, interventores, ejecutores y entes territoriales'",
            "value": "cdvdPersonalSupervisoresInterventoresEjecutoresYEntesTerritoriales"
          }, {
            "label": "OTHER",
            "value": "other"
          }]
        },
        "selectThreshold": 0.3,
        "validate": {
          "required": true
        },
        "key": "nombre_supervisor",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "Resumen correcciones",
        "disabled": true,
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "resumen_correcciones_supervisor",
        "type": "textfield",
        "input": true
      }, {
        "label": "El supervisor aprueba",
        "optionsLabelPosition": "right",
        "inline": false,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "el_supervisor_aprueba",
        "type": "radio",
        "input": true
      }, {
        "label": "Comentarios",
        "tableView": true,
        "key": "comentarios_supervisor",
        "customConditional": "show = data.el_ejecutor_corrigio_corr == 'no';",
        "type": "textfield",
        "input": true
      }, {
        "label": "Fotos",
        "tableView": false,
        "storage": "url",
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "key": "fotos_supervisor",
        "type": "file",
        "url": "https:\/\/web.mondasolvo.net\/api\/fileUpload",
        "input": true
      }, {
        "label": "Fecha",
        "tableView": false,
        "enableMinDateInput": false,
        "datePicker": {
          "disableWeekends": false,
          "disableWeekdays": false
        },
        "enableMaxDateInput": false,
        "validate": {
          "required": true
        },
        "key": "fecha_supervisor",
        "type": "datetime",
        "input": true,
        "widget": {
          "type": "calendar",
          "displayInTimezone": "viewer",
          "language": "en",
          "useLocaleSettings": false,
          "allowInput": true,
          "mode": "single",
          "enableTime": true,
          "noCalendar": false,
          "format": "yyyy-MM-dd hh:mm a",
          "hourIncrement": 1,
          "minuteIncrement": 1,
          "time_24hr": false,
          "minDate": null,
          "disableWeekends": false,
          "disableWeekdays": false,
          "maxDate": null
        }
      }, {
        "label": "Firma personal supervisor",
        "tableView": false,
        "validate": {
          "required": true
        },
        "key": "firma_supervisor",
        "customConditional": "show = data.el_ejecutor_corrigio_corr == 'si';",
        "type": "signature",
        "input": true
      }, {
        "label": "HTML",
        "attrs": [{
          "attr": "",
          "value": ""
        }],
        "content": "<h5 class=\"bg-info text-white\">>>>> Correcci\u00f3n interventor<\/h5>",
        "refreshOnChange": false,
        "tableView": false,
        "key": "correccion_interventor",
        "type": "htmlelement",
        "input": false
      }, {
        "label": "Nombre personal interventor",
        "tableView": true,
        "data": {
          "values": [{
            "label": "\"CDVD - Personal supervisores, interventores, interventores y entes territoriales'",
            "value": "cdvdPersonalSupervisoresInterventoresInterventoresYEntesTerritoriales"
          }, {
            "label": "OTHER",
            "value": "other"
          }]
        },
        "selectThreshold": 0.3,
        "validate": {
          "required": true
        },
        "key": "nombre_interventor_corr",
        "type": "select",
        "indexeddb": {
          "filter": []
        },
        "input": true
      }, {
        "label": "El interventor levant\u00f3 las correcciones del interventor",
        "optionsLabelPosition": "right",
        "inline": false,
        "tableView": false,
        "values": [{
          "label": "Si",
          "value": "si",
          "shortcut": ""
        }, {
          "label": "No",
          "value": "no",
          "shortcut": ""
        }],
        "validate": {
          "required": true
        },
        "key": "el_interventor_corrigio_corr",
        "type": "radio",
        "input": true
      }, {
        "label": "Comentarios",
        "tableView": true,
        "validate": {
          "required": true
        },
        "key": "comentarios_interventor_corr",
        "customConditional": "show = data.el_ejecutor_corrigio_corr == 'no';",
        "type": "textfield",
        "input": true
      }, {
        "label": "Fotos",
        "tableView": false,
        "storage": "url",
        "webcam": false,
        "fileTypes": [{
          "label": "",
          "value": ""
        }],
        "key": "fotos_interventor_corr",
        "type": "file",
        "url": "https:\/\/web.mondasolvo.net\/api\/fileUpload",
        "input": true
      }, {
        "label": "Fecha",
        "tableView": false,
        "enableMinDateInput": false,
        "datePicker": {
          "disableWeekends": false,
          "disableWeekdays": false
        },
        "enableMaxDateInput": false,
        "validate": {
          "required": true
        },
        "key": "fecha_interventor_corr",
        "type": "datetime",
        "input": true,
        "widget": {
          "type": "calendar",
          "displayInTimezone": "viewer",
          "language": "en",
          "useLocaleSettings": false,
          "allowInput": true,
          "mode": "single",
          "enableTime": true,
          "noCalendar": false,
          "format": "yyyy-MM-dd hh:mm a",
          "hourIncrement": 1,
          "minuteIncrement": 1,
          "time_24hr": false,
          "minDate": null,
          "disableWeekends": false,
          "disableWeekdays": false,
          "maxDate": null
        }
      }, {
        "label": "Firma personal interventor",
        "tableView": false,
        "validate": {
          "required": true
        },
        "key": "firma_interventor_corr",
        "customConditional": "show = data.el_ejecutor_corrigio_corr == 'si';",
        "type": "signature",
        "input": true
      }]
    }];
    return (
      <View style={{backgroundColor:'#f1f2f3'}}>
      <KeyboardAwareScrollView>

        {
          /**
           *            <Text>this.data{JSON.stringify(this.data)}</Text>        
    <Text>this.state{JSON.stringify(currentPageSubmissionData)}</Text>
    <Text>this.state{JSON.stringify(this.props.sub)}</Text>
           * 
           */
        }

         
  
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
