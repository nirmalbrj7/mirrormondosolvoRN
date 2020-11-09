import clone from 'lodash/clone';
import PropTypes from 'prop-types';
import { deepEqual } from '../../../util';
import BaseComponent from './Base';
import { validate } from '../componentUtils/validators';
import { safeSingleToMultiple } from '../componentUtils/safeSingleToMultiple';
import { getDefaultValue } from '../componentUtils/getDefaultValue';
import { Alert } from 'react-native';
import { jsonLogic } from '../../../../formio/utils/utils';

export default class ValueComponent extends BaseComponent {
  constructor(props) {

    super(props);
    const value = getDefaultValue(this.props.value, this.props.component, this.getInitialValue, this.onChangeCustom);
    console.log("VALUECOMP"+JSON.stringify(value));
    const valid = this.validate(value);
    console.log("VALUECOMP2"+JSON.stringify(valid));
    this.state = {
      open: false,
      showSignaturePad: false,
      value,
      isValid: valid.isValid,
      errorType: valid.errorType,
      errorMessage: valid.errorMessage,
      isPristine: true,
    };
    if (typeof this.customState === 'function') {
      this.state = this.customState(this.state);
    }
    this.data = {};
    this.validate = this.validate.bind(this);
    this.onChange = this.onChange.bind(this);
    this.setValue = this.setValue.bind(this);
    this.getDisplay = this.getDisplay.bind(this);
    this.getElements = this.getElements.bind(this);
  }

  componentDidMount() {
   
    this.unmounting = false;
    if (!this.props.options || !this.props.options.skipInit || !this.props.options.isInit) {
      this.setValue(this.state.value, null, true);
    }
    if (typeof this.props.attachToForm === 'function') {
      this.props.attachToForm(this);
    }
  }

  componentWillUnmount() {
    this.unmounting = true;
    if (typeof this.props.detachFromForm === 'function') {
      this.props.detachFromForm(this);
    }
  }

  componentDidUpdate=(prevProps)=> {
    const { component } = prevProps;
  
    let value;

    

    if (
      this.props.value &&
      (!prevProps.value || prevProps.value !== this.props.value)
    ) {
      value = safeSingleToMultiple(this.props.value, this.props.component);

    }

    // This occurs when a datagrid row is deleted.
    let defaultValue = getDefaultValue(
      value,
      this.props.component,
      this.getInitialValue,
      this.onChangeCustom
    );
    if (value === null && this.state.value !== defaultValue) {
      value = defaultValue;
      this.setState({
        isPristine: true
      });

    }
    if (typeof value !== "undefined" && value !== null) {
      const valid = this.validate(value);
      this.setState({
        //value: c,
        value:valid,
        isValid: valid.isValid,
        errorType: valid.errorType,
        errorMessage:valid.errorMessage
      });

    }
    if (typeof this.willReceiveProps === "function") {

      this.willReceiveProps(this.props);
    }

  };

  validate(value) {
    
   /* if( this.props.component.data.resource){
      this.props.data['aaaa']="sssssssssss";
      return validate(value, this.props.component, this.props.data, this.validateCustom);
    }*/
 //   this.props.data['aaaa']="sssssssssss";
 console.log("6666666666666666666666VALUEDATA"+JSON.stringify(value));
 if(this.props.component){
   if(this.props.component.data){
     if(this.props.component.data.resource){
       al
      console.log("this"+JSON.stringify(value));

      //[{"label":"Ffcc","value":{"cityUnitPrices":"Ffcc","sss":"Ffcc"}}]
      if(value){
        console.log("heres1");
        if(value!=null || value!="" || value!="undefined"){
          console.log("heres3");
          if(value[0]==undefined){

            console.log("this3");
          }
          else{
            console.log("heres4");
            console.log("heres");
            alert("here4");
            if(value[0].value!=null || value[0].value!="" || value[0].value!=undefined){
              var obj=value[0].value;
              console.log("heres5"+JSON.stringify(obj));
              console.log("heres5"+JSON.stringify(typeof(obj)));
              
              var compKey=this.props.component.key;
              console.log("heres55555"+compKey);
              if(typeof obj === "object"){
                this.props.data['"'+compKey+'"']=value[0].label ;
                for (var key in obj) {
                  console.log("heres7"+JSON.stringify(key));
                  if (obj.hasOwnProperty(key)) {

                    console.log("heres6"+JSON.stringify(obj[key]));
                   
                    this.props.data[key]=obj[key] ;
                    console.log("dddddddddd"+JSON.stringify(this.props.data));
                    
                  }
                }
     
            
                return true;
              } 
              else{
                //console.log("here99"+JSON.stringify(this.props.component));
               // delete this.props.data[this.props.component.label];
               this.props.data[this.props.component.key]="ppt" ;
                this.props.data[this.props.component.key]=obj ;
                return true;
              }
             
           /*   if (obj.hasOwnProperty(key)) {
                for (var key in obj) {
                  console.log("heres7"+JSON.stringify(key));
                  if (obj.hasOwnProperty(key)) {
                    console.log("heres6"+JSON.stringify(obj[key]));
                    this.props.data[key]=obj[key] ;
                  }
                }
              }
              else{
                this.props.data[key]=obj ;
              }*/

              

            }
          }
          console.log("this2"+JSON.stringify(value[0]));
          if(value[0]!=null || value[0]!="" || value[0]!="undefined"){

  /*          if(value[0].value!=null || value[0].value!="" || value[0].value!=undefined){
              var obj=value[0].value;
              for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                  this.props.data[key]=obj[key] ;
                }
              }
            }
*/
          }
         // var obj=value[0].value;
         /* var obj=value[0].value;
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              this.props.data[key]=obj[key] ;
            }
          }*/
        }
      }


      //this.props.data['aaaa']="sssssssssss";
     }
     else{
       
     }

   }

 }
 else{

 }

    return validate(value, this.props.component, this.props.data, this.validateCustom);
  }

  // Evoked from component when it changes
  onChange(event, type) {
   
    if (type === 'file' || type === 'location' || type === 'address' || type === 'number') {
      console.log('ENVOKED');
      this.setValue(event);
      return;
    }
    let value = event.nativeEvent.text;
    // Allow components to respond to onChange event.
    if (typeof this.props.onChangeCustom === 'function') {
      value = this.props.onChangeCustom(value);
    }
    const index = (this.props.component.multiple ? event.nativeEvent.target : null);
    this.setValue(value, index);
  }

  setValue(value, index, pristine) {
    console.log('setvLAUE'+JSON.stringify(value));
    if (index === undefined) {
      index = null;
    }
    let newValue;
    if (index !== null && Array.isArray(this.state.value)) {
      // Clone so we keep state immutable.
      //newValue = clone(this.state.value);
      console.log("newValue"+JSON.stringify(newValue))
      newValue[index] = value;
     // console.log("newValue[index]"+JSON.stringify(newValue[index]))
    } else {
      newValue = value;
      //console.log("newValue2"+JSON.stringify(newValue))
    }
    const validatedValue = this.validate(newValue);
    this.setState({
      isPristine: !!pristine,
      value: validatedValue,
    }, () => {
      if (typeof this.props.onChange === 'function') {
        if (!this.state.isPristine || (this.props.value && this.props.value.item !== this.state.value.item)) {
          this.props.onChange(this);
        }
      }
    });
  }

  getDisplay(component, value) {
    if (typeof this.getValueDisplay === 'function') {
      if (Array.isArray(value) && component.multiple && component.type !== 'file') {
        return value.map(this.getValueDisplay.bind(null, component)).join(', ');
      }

      return this.getValueDisplay(component, value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    // If this is still an object, something went wrong and we don't know what to do with it.
    if (typeof value === 'object') {
      return '[object Object]';
    }
    return value;
  }

  render() {
    let element;
    if (typeof this.props.onElementRender === 'function') {
      element = this.props.onElementRender(this, element);
    }
    element = this.getElements();
    return element;
  }
}

ValueComponent.propTypes = {
  data: PropTypes.any,
  options: PropTypes.object,
  component: PropTypes.any,
  value: PropTypes.any,
  row: PropTypes.any,
  onChange: PropTypes.func,
  onElementRender: PropTypes.func,
  attachToForm: PropTypes.func,
  detachFromForm: PropTypes.func,
};
