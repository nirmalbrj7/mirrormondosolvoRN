import React from 'react';
import { connect } from 'react-redux';
import { clone } from 'lodash';
import PropTypes from 'prop-types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text, View, ActivityIndicator } from 'react-native';
import FormioComponentsList from '../formioForm/formComponents/FormioComponentsList';
import '../formioForm/formComponents/FormComponents';
import theme from '../formioForm/defaultTheme';
import colors from '../formioForm/defaultTheme/colors';
import { checkCondition, evaluate, evaluate2, checkCalculated, checkTrigger } from '../formio/utils/utils';
import StoreActionsSubmission from '../../../store/actions/submission';
import AsyncStorage from '@react-native-async-storage/async-storage';


class FormWizardPage extends React.PureComponent {
  constructor(props) {
    super(props);
    var currentPageSubmissionData2 = this.props.currentPageSubmissionData;
    //  this.props.navigation.navigate('ListRecord');
    this.selectCard = props.cardSelected;
    // data object is used to store user inputs. It's component of submission object
    console.log("qqqqqqqqqqqqqq" + JSON.stringify(this.props.currentPageSubmissionData));

    if (this.props.currentPageSubmissionData) {
      console.log("pppppppppppppppppppppppp");
      console.log("pppppppppppppppppppppppp" + JSON.stringify(this.props.currentPageSubmissionData));
      this.data = clone(currentPageSubmissionData2);


    } else {
      this.data = {};


    }

    //this.data = clone(this.props.currentPageSubmissionData);
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
  getUser = async () => {
    try {
      const user = await AsyncStorage.getItem('user')

      if (user !== null) {
        return user
      }

    } catch (e) {
      return 0;
      // read error
    }

    console.log('Done.')

  }
  async componentDidMount() {
    //  alert("ddd");
    if (this.props.currentPageSubmissionData) {

      this.data = clone(this.props.currentPageSubmissionData);
      this.data.user = await this.getUser();

      const { receiverOfCallbackForDataRetrieval } = this.props;

      receiverOfCallbackForDataRetrieval(this.getData);
    }
    else {
      this.data.user = await this.getUser();

      const { receiverOfCallbackForDataRetrieval } = this.props;

      receiverOfCallbackForDataRetrieval(this.getData);
    }
  }
  /* componentWillReceiveProps(nextProps) {
     if (nextProps.currentPageSubmissionData) {
       alert("heee");
       // Rest of code
       if (this.props.currentPageSubmissionData) {
         console.log("pppppppppppppppppppppppp2");
         console.log("pppppppppppppppppppppppp2"+JSON.stringify(this.props.currentPageSubmissionData));
               this.data =  clone(this.props.currentPageSubmissionData);
               
         
             } else {
               this.data = {};
          
               
             }
     }
   }*/

  async componentDidMount() {



    this.data.user = await this.getUser();

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

  dummyThatSaysFalse = (component) => {


    if (component.hasOwnProperty("logic")) {
      if (component.logic.length != 0) {
        // alert("hhhhhhhhhhs");

        var component = component;
        var rowData = this.data;
        var key = component.key;
        var logic = component.logic[0].trigger.javascript;

        console.log("============================================");
        console.log("============================================");
        console.log("============================================");
        console.log("componentkety" + component.key);
        var calculateValue = logic;

        var componentDisable = component.disabled;
        const user = { 'id': 'ss', 'name': 'ssss' };
        const logicDisable = evaluate2(
          user,
          calculateValue,
          {
            value: undefined,
            data: rowData,
            row: rowData,
            component: component,
            util: this

          },
          "value"
        );
        if (componentDisable == true || logicDisable == true) {
          console.log("true aayo");
          return true;
        }
        else {
          console.log("false aayo");
          return false;
        }
      }

    }

    return false;


  };

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

  findPath = (a, obj) => {
    function iter(o, p) {
      return Object.keys(o).some(function (k) {
        result = p.concat(Array.isArray(o) ? +k : k);
        return o[k] === a || o[k] && typeof o[k] === 'object' && iter(o[k], result);
      });
    }
    var result;
    return iter(obj, []) && result || undefined;
  }

  resetForm = () => {

    //this.props.receiverSubmit();
  }

  onSubmit = (event) => {

    this.props.receiverSubmit(event);
  }
  onChange = (component, context = {}) => {
    //  console.log("this.data" + JSON.stringify(component.props));
    const { isPristine } = this.state;
    const cardId = this.props.cardSelected.datagridreducer;
    const currentComponent = component.props.component;
    console.log("current component" + JSON.stringify(currentComponent));
    if (component.hasOwnProperty("calculateValue")) {
      var component = component;
      var rowData = this.data;
      var key = component.key;
      console.log("b" + JSON.stringify(key));
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
      console.log("**************************************************");
      console.log("**************************************************");
      console.log("**************************************************");

      console.log("this.form" + JSON.stringify(this.props.form));
      console.log("**************************************************");
      console.log("**************************************************");
      console.log("**************************************************");
      console.log("this.data2sn" + JSON.stringify(this.data));

      const datagridId = currentComponent.datagridId;
      const datagridItem = currentComponent.datagridItem;
      const currentkey = component.props.component.key;
      const parentkey = currentComponent.datagridItem;
      // const parentkey ="dataGrid";


      var currentArray = this.data[parentkey];
      console.log("this.data333" + JSON.stringify(currentComponent));
      console.log("this.data222" + JSON.stringify(parentkey));
      const datagridSchema = this.props.datagridSchema;

      console.log("datagridSchema" + JSON.stringify(datagridSchema));
      datagridSchema.map((val, index) => {
        if (val.key == parentkey) {
          if (val.parent_key.length == 0) {
            if (this.data[parentkey] && this.data[parentkey].length > 0) {
              this.data[parentkey].map((val, index) => {
                var newindex = 0;
                if (cardId == val.id) {
                  this.data[parentkey][index][currentkey] = component.state.value.item;
                }
              })
            }
          }

          else if (val.parent_key.length == 1) {
            var grandParent = val.parent_key[0];
            //s  var mainDatagrid = this.data[grandParent][0][parentkey];
            if (this.data) {
              if (this.data[grandParent]) {
                this.data[grandParent].map((val, index) => {
                  if (val[parentkey]) {
                    this.data[grandParent][index][parentkey].map((val2, index2) => {
                      if (val2.id == cardId) {
                        this.data[grandParent][index][parentkey][index2][currentkey] = component.state.value.item;
                      }
                    });
                  }
                });
              }
            }

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
    if (this.props.checkform == 'wizard') {
      if (this.props.currentPage.key) {
        this.props.updateSubmissionDataAllPagesLocally(this.props.currentPage.key, this.data);
      }
    }

    this.props.updateSubmissionDataAllPagesLocally('__root', this.data);
    this.validate();
    this.rerender = true;
  };



  render() {
    const {
      currentPageComponents, currentPageSubmissionData, options, onElementRender, formId
    } = this.props;
    const { isSubmitting, isValid, isPristine } = this.state;
    const { navigation } = this.props;
    const staticData =
      [
        {
          "title": "Page 2",
          "label": "Page 2",
          "type": "panel",
          "key": "page2",
          "components": [{
            "label": "Text Field",
            "tableView": true,
            "key": "textField2",
            "type": "textfield",
            "input": true
          }, {
            "label": "Text Area",
            "autoExpand": false,
            "tableView": true,
            "key": "textArea",
            "type": "textarea",
            "input": true
          }, {
            "label": "Time",
            "tableView": true,
            "key": "time",
            "type": "time",
            "input": true,
            "inputMask": "99:99"
          }, {
            "label": "Date \/ Time",
            "defaultValue": "00\/00\/0000",
            "tableView": false,
            "enableMinDateInput": false,
            "datePicker": {
              "disableWeekends": false,
              "disableWeekdays": false
            },
            "enableMaxDateInput": false,
            "key": "dateTime",
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
            "label": "Day",
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
            "key": "day",
            "type": "day",
            "input": true,
            "defaultValue": "00\/00\/0000"
          }, {
            "label": "Signature",
            "tableView": false,
            "key": "signature",
            "type": "signature",
            "input": true
          }],
          "input": false,
          "tableView": false
        }
      ];
    return (
      <View style={{ backgroundColor: '#f1f2f3' }}>

        <KeyboardAwareScrollView>

    
        {
          this.props.formtype=='form'?
          this.props.currentPageSubmissionData?
          <FormioComponentsList
              //  components={formId=='hqlhW0T1oyJyICDXzHZu'?staticdata:currentPageComponents}   
              components={currentPageComponents}
              values={currentPageSubmissionData}
              data={this.data}
              navigation={navigation}
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
            :
            <ActivityIndicator color="purple" size={30} /> 
          :
          this.props.currentPage.key=='page1'?
          this.props.currentPageSubmissionData ?
          <FormioComponentsList
    //  components={formId=='hqlhW0T1oyJyICDXzHZu'?staticdata:currentPageComponents}   
    components={currentPageComponents}
    values={currentPageSubmissionData}
    data={this.data}
    navigation={navigation}
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
  :
  <ActivityIndicator color="purple" size={30} /> 
  :
  <FormioComponentsList
  //  components={formId=='hqlhW0T1oyJyICDXzHZu'?staticdata:currentPageComponents}   
  components={currentPageComponents}
  values={currentPageSubmissionData}
  data={this.data}
  navigation={navigation}
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
        }


     

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
  receiverSubmit: PropTypes.func.isRequired,
  navigation: PropTypes.func.isRequired,
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
  let datagridSchema = state.form.datagrid;
  let allsubmission = state.submission;
  //console.log("sttate"+JSON.stringify(state));
  const checkform = state.form && state.form.form && state.form.form.display;

  var form = state.form;
  var formtype=null;
  if (state.form) {
    if (checkform === 'wizard') {
      formtype='wizard';
      currentPage = state.form.form.components[state.wizard.currentPage];
      var pageNo = state.wizard.currentPage;
      var mycomponents = state.form.form.components;
      var mycurrentPageComponents = null;
     // console.log("currentsubmiss" + JSON.stringify(state.submission));


      currentPageComponents = state.form.form.components[state.wizard.currentPage].components;
      currentPageComponents.user = { 'id': '111', name: 'ssss' };
      //hqlhW0T1oyJyICDXzHZu
      var formId = state.form.form._id;

      if (state.submission.rawSubmission) {
        console.log("************************************************");
        console.log("************************************************");
        console.log("************************************************");
        currentPageSubmissionData = state.submission.rawSubmission.data[currentPage.key];
        //this.data=currentPageSubmissionData;
        console.log("currentsubmiss" + JSON.stringify(currentPageSubmissionData));
        console.log("************************************************");
        console.log("************************************************");
        console.log("************************************************");

      }
    }
    else {
      formtype='form';
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
    form,
    formtype,
    formId,
    currentPageComponents,
    currentPageSubmissionData,
    cardSelected,
    datagridSchema,
    allsubmission,
    sub: state.submission,
    resource: state.resourcereducer,
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
