import React from 'react';
import { connect } from 'react-redux';
import { clone } from 'lodash';
import PropTypes from 'prop-types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text } from 'react-native';
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
  if(this.props.currentPage.key){
    this.props.updateSubmissionDataAllPagesLocally(this.props.currentPage.key, this.data);
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
    return (
      <KeyboardAwareScrollView>{
        /**
         *     <Text>this.data{JSON.stringify(this.data)}</Text>        
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
      currentPageSubmissionData = state.submission.rawSubmission.data[currentPage.key];
    
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
    currentPage
  };
};


const ConnectedFormWizardPage = connect(

  mapStateToProps,
  {

    updateSubmissionDataAllPagesLocally: StoreActionsSubmission.updateSubmissionDataForPageLocally,

  },
)(FormWizardPage);

export default ConnectedFormWizardPage;
