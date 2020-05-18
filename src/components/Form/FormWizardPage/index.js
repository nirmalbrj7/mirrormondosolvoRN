import React from 'react';
import { connect } from 'react-redux';
import { clone } from 'lodash';
import PropTypes from 'prop-types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {Text, Alert,View} from 'react-native';
import FormioComponentsList from '../formioForm/formComponents/FormioComponentsList';
import '../formioForm/formComponents/FormComponents';
import theme from '../formioForm/defaultTheme';
import colors from '../formioForm/defaultTheme/colors';
import Myglobal from '../../../components/Form/global';
import { useSelector,useDispatch } from 'react-redux'



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

    // Form components that are currently rendered on the screen
    this.inputs = {};

    this.state = {
      // Passed to submit buttons on the form. Set to true when form is submitting
      isSubmitting: false,
      isValid: true,
      isPristine: true,
    };
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

  dummy = () => true;

  dummyThatSaysFalse = () => false;

  externalChange = (component, context) => {
    // TODO: make saga to save validated submission data
    console.groupCollapsed('Evoking external change');
    console.groupEnd();
  };

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
  
    const  cardId  = this.props.cardSelected.datagridreducer;
    /* console.groupCollapsed('OnChange');
    console.log(component.props.component.key);
    console.log(component.state.value.item);
    console.log(context);
    console.groupEnd(); */
    //console.log(context);
    //console.log(component.state.value.item);
   /* console.log('context1'+JSON.stringify(JSON.stringify(component.props.component.key)));
  
    console.log('context3'+JSON.stringify(component.props.component));
    console.log('context2'+JSON.stringify(JSON.stringify(this.data)));
    console.log('context3'+JSON.stringify(JSON.stringify(context)));*/
    console.log('here'+JSON.stringify(this.props.cardSelected.datagridreducer));

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
          console.log('val'+JSON.stringify(val));
          console.log('index'+JSON.stringify(index));
          console.log('val.id'+JSON.stringify(val.id));
  
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
      console.log('DATAGRID CONTEXT');
      // this.data[context.datagrid.props.component.key] = context.datagrid.state.value;
    } else if (context.hasOwnProperty('container')) {
      // this.data[context.container.props.component.key] = context.container.state.value;
    } else if (component.state.value === null) {
      delete this.data[component.props.component.key];
    } else {
      this.data[component.props.component.key] = component.state.value.item;
      //console.log('dddd'+this.data[component.props] );
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
  };

  /* checkConditional(component, row = {}) {
    const show = FormioUtils.checkCondition(component, row, this.data);

    // If element is hidden, remove any values already on the form
    // (this can happen when data is loaded into the form
    // and the field is initially hidden)
    if (!show) {
      // Recursively delete data for all components under this component.
      this.clearHiddenData(component);
    }

    return show;
  } */

  render() {
    const {
      cardSelected,
      currentPageComponents, currentPageSubmissionData, options, onElementRender,
    } = this.props;
    const { isSubmitting, isValid, isPristine } = this.state;
    return (
      <KeyboardAwareScrollView>
<View>
 
    <FormioComponentsList
          components={currentPageComponents}
          values={currentPageSubmissionData} // Data filled by user
          data={currentPageSubmissionData}

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
          checkConditional={this.dummy} // Something for hidden components and data removal
          formPristine={isPristine}
        />
</View>

      
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
  let currentPage = null;
  let currentPageComponents = null;
  let currentPageSubmissionData = null;
let cardSelected=state;
console.log('STATE'+JSON.stringify(state));
  if (state.form.form) {
    if (state.form.form.display === 'form') {
      currentPageComponents = state.form.form.components;
      currentPageSubmissionData = state.submission.rawSubmission.data.root;
    } else {
      currentPage = state.form.form.components[state.wizard.currentPage];
      currentPageComponents = state.form.form.components[state.wizard.currentPage].components;

      if (state.submission.rawSubmission) {
        currentPageSubmissionData = state.submission.rawSubmission.data[currentPage.key];
      }
    }
  }

  return {
    currentPageComponents,
    currentPageSubmissionData,
    cardSelected
  };
};

const ConnectedFormWizardPage = connect(
  mapStateToProps,
  null,
)(FormWizardPage);

export default ConnectedFormWizardPage;
