import PropTypes from 'prop-types';
import BaseComponent from './Base';
import { validate } from '../componentUtils/validators';
import { safeSingleToMultiple } from '../componentUtils/safeSingleToMultiple';
import { getDefaultValue } from '../componentUtils/getDefaultValue';
import store from "../../../../../../store/store";


class ValueComponent extends BaseComponent {
  constructor(props) {
    super(props);
    const value = getDefaultValue(this.props.value, this.props.component, this.getInitialValue, this.onChangeCustom);
    const valid = this.validate(value);
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

  componentDidUpdate = (prevProps) => {
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
        value: valid,
        isValid: valid.isValid,
        errorType: valid.errorType,
        errorMessage: valid.errorMessage
      });

    }
    if (typeof this.willReceiveProps === "function") {

      this.willReceiveProps(this.props);
    }

  };

  validate(value) {
   // console.log("VVVVVVVVVVVVVVVV"+JSON.stringify(value));
    if (this.props.component.type == 'selectboxes') {
      // {"":false}
      if (value[""] == false) {
        console.log("selectbox value2" + JSON.stringify(value));
        this.setState({
          isPristine: false,
        });

        //this.props.data["selectBoxes1"]={"aaa":true} ;
        return validate({}, this.props.component, this.props.data, this.validateCustom);
      }
      //  console.log("selectbox value"+JSON.stringify(value));

    }

    if (this.props.component) {
      if (this.props.component.data) {
        if (this.props.component.data.resource) {

          if (value) {
            this.props.data[this.props.component.key]=value;

var propsData=this.props.data;
            var componentkey = this.props.component.key;
            console.log("this" + JSON.stringify(value));
            var store2 = store;
            var store3 = store.getState().resourcereducer;
           console.log("store3" + JSON.stringify(store3));

            var allData = JSON.stringify(store3[0]);


            if( (typeof value === "object" || typeof value === 'function') && (value !== null) )
            {
              Object.keys(value).map((key, index)=>{
               console.log("key"+key);
              console.log("index"+index);
              this.props.data[key] = 'aaaaaaaaaaa';
                //console.log("value[index]"+value[key]); 
                //console.log("this.props.data"+JSON.stringify(propsData)); 
                if (isNaN(value[key])) {
                  if(this.props.data[key]!=undefined)
                  this.props.data[key] = value[key];

                }
                else {
                  if(this.props.data[key]!=undefined)
                  this.props.data[key] = JSON.stringify(value[key]);

                }

              })

            }




          }
        }
      }
    }


  /*  if (this.props.component) {
      if (this.props.component.data) {
        if (this.props.component.data.resource) {

          if (value) {
            var componentkey = this.props.component.key;
            console.log("this" + JSON.stringify(value));
            var store2 = store;
            var store3 = store.getState().resourcereducer;
            console.log("store3" + JSON.stringify(store3));

            var allData = JSON.stringify(store3[0]);

            if (store3.length > 0) {
              var selectField = this.props.component.selectFields;
              var selectFieldArray = selectField.split(',');
              var key2 = selectFieldArray[0];
              store3.map((val, index) => {
                if (val[key2] == value) {

                  var obj = Number.isInteger(val) == true ? JSON.stringify(val) : val;

                  for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {

                      if (isNaN(obj[key])) {
                        this.props.data[key] = obj[key];

                      }
                      else {
                        this.props.data[key] = JSON.stringify(obj[key]);

                      }
                    }
                  }
                }
              })
            }

            this.rerender = true;
          }
        }
      }
    }*/
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
    if (index === undefined) {
      index = null;
    }
    let newValue;
    if (index !== null && Array.isArray(this.state.value)) {
      newValue[index] = value;

    } else {
      newValue = value;
    }
    const validatedValue = this.validate(newValue);
    if (this.props.component.type == 'selectboxes') {
      this.setState({
        //  isPristine: !!pristine,
        isPristine: false,
        value: validatedValue,
      }, () => {
        if (typeof this.props.onChange === 'function') {
          if (!this.state.isPristine || (this.props.value && this.props.value.item !== this.state.value.item)) {
            this.props.onChange(this);
          }
        }
      });
    }
    else {
      this.setState({
        //  isPristine: !!pristine,
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



export default ValueComponent;
