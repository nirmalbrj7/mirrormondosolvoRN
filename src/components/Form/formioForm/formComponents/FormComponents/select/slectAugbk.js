import React from 'react';
import { Text, Alert } from 'react-native';
import { connect } from 'react-redux';
import { interpolate, serialize, raw } from '../../../util';
import SelectComponent from '../sharedComponents/Select';
import firestore from '@react-native-firebase/firestore';
class Select extends SelectComponent {
  constructor(props) {
    super(props);
    this.getValueField = this.getValueField.bind(this);
    this.refreshItems = this.refreshItems.bind(this);
    this.loadMoreItems = this.loadMoreItems.bind(this);
    this.setResult = this.setResult.bind(this);
    //this.getValueDisplay = this.getValueDisplay.bind(this);
  }

  async componentDidMount() {
 
   
    switch (this.props.component.data) {
    

      /* case 'values':
         this.internalFilter = true;
         this.setState({
           selectItems: this.props.component.data.values,
         });
         break;*/
      /* case 'json':
        try {
          if (typeof this.props.component.data.json === 'string') {
            this.items = JSON.parse(this.props.component.data.json);
          }
          else if (typeof this.props.component.data.json === 'object') {
            this.items = this.props.component.data.json;
          }
          else {
            this.items = [];
          }
        }
        catch (error) {
          this.items = [];
        }
        this.options.params = {
          limit: parseInt(this.props.component.limit) || 20,
          skip: 0
        };
        this.refreshItems = (input, url, append) => {
          // If they typed in a search, reset skip.
          if ((this.lastInput || input) && this.lastInput !== input) {
            this.lastInput = input;
            this.options.params.skip = 0;
          }
          let items = this.items;
          if (input) {
            items = items.filter(item => {
              // Get the visible string from the interpolated item.
              const value = interpolate(this.props.component.template, {item}).replace(/<(?:.|\n)*?>/gm, '');
              switch (this.props.component.filter) {
                case 'startsWith':
                  return value.toLowerCase().lastIndexOf(input.toLowerCase(), 0) === 0;
                case 'contains':
                default:
                  return value.toLowerCase().indexOf(input.toLowerCase()) !== -1;
              }
            });
          }
          items = items.slice(this.options.params.skip, this.options.params.skip + this.options.params.limit);
          this.setResult(items, append);
        };
        this.refreshItems();
        break;
      case 'custom':
        this.refreshItems = () => {
          try {
            /!* eslint-disable no-unused-vars *!/
            const {data, row} = this.props;
            /!* eslint-enable no-unused-vars *!/
            let selectItems = eval('(function(data, row) { var values = [];' + this.props.component.data.custom.toString() + '; return values; })(data, row)');
            if (!Array.isArray(selectItems)) {
              throw 'Didn\'t return an array.';
            }
            this.setState({
              selectItems
            });
          }
          catch (error) {
            this.setState({
              selectItems: []
            });
          }
        };
        this.refreshItems();
        break;
      case 'resource':
      case 'url':
        if (this.props.component.dataSrc === 'url') {
          this.url = this.props.component.data.url;
          if (this.url.substr(0, 1) === '/') {
            this.url = formiojs.getBaseUrl() + this.props.component.data.url;
          }

          // Disable auth for outgoing requests.
          if (!this.props.component.authenticate && this.url.indexOf(formiojs.getBaseUrl()) === -1) {
            this.options = {
              disableJWT: true,
              headers: {
                Authorization: undefined,
                Pragma: undefined,
                'Cache-Control': undefined
              }
            };
          }
        }
        else {
          this.url = formiojs.getBaseUrl();
          if (this.props.component.data.project) {
            this.url += '/project/' + this.props.component.data.project;
          }
          this.url += '/form/'  + this.props.component.data.resource + '/submission';
        }

        this.options.params = {
          limit: this.props.component.limit || 100,
          skip: 0
        };

        this.refreshItems = (input, newUrl, append) => {
          let {data, row} = this.props;
          newUrl = newUrl || this.url;
          // Allow templating the url.
          newUrl = interpolate(newUrl, {
            data,
            row,
            formioBase: formiojs.getBaseUrl()
          });
          if (!newUrl) {
            return;
          }

          // If this is a search, then add that to the filter.
          if (this.props.component.searchField && input) {
            // If they typed in a search, reset skip.
            if (this.lastInput !== input) {
              this.lastInput = input;
              this.options.params.skip = 0;
            }
            newUrl += ((newUrl.indexOf('?') === -1) ? '?' : '&') +
              encodeURIComponent(this.props.component.searchField) +
              '=' +
              encodeURIComponent(input);
          }

          // Add the other filter.
          if (this.props.component.filter) {
            const filter = interpolate(this.props.component.filter, {data});
            newUrl += ((newUrl.indexOf('?') === -1) ? '?' : '&') + filter;
          }

          // If they wish to return only some fields.
          if (this.props.component.selectFields) {
            this.options.params.select = this.props.component.selectFields;
          }

          // If this is a search, then add that to the filter.
          newUrl += ((newUrl.indexOf('?') === -1) ? '?' : '&') + serialize(this.options.params);
          formiojs.request(newUrl).then(data => {
            // If the selectValue prop is defined, use it.
            if (this.props.component.selectValues) {
              this.setResult(get(data, this.props.component.selectValues, []), append);
            }
            // Attempt to default to the formio settings for a resource.
            else if (data.hasOwnProperty('data')) {
              this.setResult(data.data, append);
            }
            else if (data.hasOwnProperty('items')) {
              this.setResult(data.items, append);
            }
            // Use the data itself.
            else {
              this.setResult(data, append);
            }
          });
        };

        this.refreshItems();

        break; */
      default:
        this.setState({
          selectItems: [],
        });
    }


    if (this.props.component.data.resource) {
      var resourceId = this.props.component.data.resource;
      var selectField = this.props.component.selectFields;

      var selectFieldArray = selectField.split(',');


      console.log("resourceId" + resourceId);
      console.log("selectFieldArray" + JSON.stringify(selectField));
      console.log("selectFieldArray" + JSON.stringify(selectFieldArray));
      //selectFieldArray = ['status', 'geoLocation', 'phoneNumber'];


      //eafeb8d4cb2548a8aca4
      var dataArray = [];

      const querySnapshot = await firestore()
      .collection('submissions')
      .doc(this.props.component.data.resource)
      .collection('submissionData')
      .get();
    querySnapshot.forEach(async (documentSnapshot) => {



      if (documentSnapshot.exists == true) {

        console.log('aaaaaaaa exists: ', documentSnapshot.exists);
 
        const slug = documentSnapshot.id;
        if(documentSnapshot.exists==true){
          const data = documentSnapshot.data();
          console.log('User data: ', data.data);
          var data2 = data.data;
          var obj = {};
          obj.label =data2[selectFieldArray[0]];
          var valueArray = {};
          Object.keys(data2)
            .forEach((page, index) => {

             
              selectFieldArray.map((val, index) => {
                if (val == page) {
                  var tempobj={};
                  tempobj[val]=data2[page];
                  Object.assign(valueArray,tempobj);

                }


              })
              console.log("valueArray" + JSON.stringify(valueArray));
             

              // obj.value = data2[page];
              //obj.value={"sss":"sss","ass":"ass"};
              // newobj[key] = data2[page];
              //  newobj["sss"] = submissionData[page][key];
              // labelFirst= submissionData[page][key];




            });
            obj.value = valueArray;
            console.log("obj" + JSON.stringify(obj));
            dataArray.push(obj);
          this.setState({
            // selectItems: [{"label":"aaa","value":"bbbb"}],
            selectItems: dataArray
          });

         Alert("DATAARRAY"+JSON.stringify(data));
        }


       
      }



    });




  /*    firestore()
        .collection('submissions')
        .doc("Tuxv5IP6p2eDrL85PLId").collection("submissionData").doc("e9783f131ff645a3aadf")
        .get()
        .then(documentSnapshot => {
          console.log('User exists: ', documentSnapshot.exists);
          console.log("========================================================================");
          console.log("========================================================================");
          console.log("========================================================================");
          console.log("========================================================================");
          if (documentSnapshot.exists) {

            const data = documentSnapshot.data();
            console.log('User data: ', data.data);
            var data2 = data.data;
            var obj = {};
            obj.label =data2[selectFieldArray[0]];
            var valueArray = {};
            Object.keys(data2)
              .forEach((page, index) => {

               
                selectFieldArray.map((val, index) => {
                  if (val == page) {
                    var tempobj={};
                    tempobj[val]=data2[page];
                    Object.assign(valueArray,tempobj);

                  }


                })
                console.log("valueArray" + JSON.stringify(valueArray));
               

                // obj.value = data2[page];
                //obj.value={"sss":"sss","ass":"ass"};
                // newobj[key] = data2[page];
                //  newobj["sss"] = submissionData[page][key];
                // labelFirst= submissionData[page][key];




              });
              obj.value = valueArray;
              console.log("obj" + JSON.stringify(obj));
              dataArray.push(obj);
            this.setState({
              // selectItems: [{"label":"aaa","value":"bbbb"}],
              selectItems: dataArray
            });

          }
          console.log("========================================================================");
          console.log("========================================================================");
          console.log("========================================================================");
          console.log("========================================================================");
        });
*/


      /* firestore()
         .collection('submissions')
         .where('status', '==', "Submitted")
         .where('formId', '==', 'eafeb8d4cb2548a8aca4')
         .get()
         .then(querySnapshot => {
 
           console.log('Total users: ', querySnapshot.size);
 
           var obj = {};
           querySnapshot.forEach(documentSnapshot => {
 
             console.log('User ID: ', documentSnapshot.id, documentSnapshot.data());
             var data = documentSnapshot.data();
 
 
             var submissionData = data.rawSubmission.data;
             var newobj = {};
             var labelFirst="";
             Object.keys(submissionData)
               .forEach((page) => {
                 console.log("page" + JSON.stringify(page));
 
                 Object.keys(submissionData[page])
                   .forEach((key) => {
 
 
                     if (selectFieldArray[0] == key) {
                       console.log("match" + key);
                       newobj[key] = submissionData[page][key];
                     //  newobj["sss"] = submissionData[page][key];
                       labelFirst= submissionData[page][key];
                    
                     }
                  
 
 
 
 
 
 
  
                   });
 
 
               });
 
             obj.label = labelFirst;
             obj.value = newobj;
 
             dataArray.push(obj);
             console.log("newobj" + JSON.stringify(newobj));
 
           });
 
           console.log(dataArray);
           this.internalFilter = true;
 
           // alert(JSON.stringify(dataArray));
           this.setState({
             // selectItems: [{"label":"aaa","value":"bbbb"}],
             selectItems: dataArray
           });
         });*/

    }

    else if (this.props.component.data.values) {
      this.internalFilter = true;


      this.setState({
        selectItems: this.props.component.data.values,
      });
      if(this.props.currentPageSubmissionData){
        var currentPageSubmissionData=this.props.currentPageSubmissionData;
        var componentkey=this.props.component.key
        if(currentPageSubmissionData[componentkey]){
          this.setValue(currentPageSubmissionData[componentkey])
        }
      }
    }
    else {

    }

    if (this.props.component.defaultValue != "") {
      // console.log("aaaaaaaaaaaa"+JSON.parse(JSON.stringify(this.props.component.defaultValue)));
      /*this.setState({
        selectItems: this.props.component.defaultValue,
      });*/

    }
    else {

    }



  }

  getValueField() {
    //alert('bb'+JSON.stringify(this.props.component.valueProperty));
    if (this.props.component.dataSrc === 'custom' || this.props.component.dataSrc === 'json') {
      return false;
    }
    if (this.props.component.dataSrc === 'resource' && this.props.component.valueProperty === '') {
      return '_id';
    }
    return this.props.component.valueProperty || 'value';
  }

  refreshItems() { }

  loadMoreItems(event) {
    event.stopPropagation();
    event.preventDefault();
    this.props.onEvent('loadMore', this.loadMoreItems);
    this.options.params.skip += this.options.params.limit;
    this.refreshItems(null, null, true);
  }

  setResult(data, append) {

    if (!Array.isArray(data)) {
      data = [data];
    }
    if (append) {
      this.setState({
        selectItems: [...this.state.selectItems, ...data],
        hasNextPage: this.state.selectItems.length >= (this.options.params.limit + this.options.params.skip),
      });
    } else {
      this.setState({
        selectItems: data,
        hasNextPage: this.state.selectItems.length >= (this.options.params.limit + this.options.params.skip),
      });
    }
  }

  /*getValueDisplay(component, data) {
    const getItem = (data) => {
     
      switch (component.dataSrc) {
        case 'values':
          component.data.values.forEach((item) => {
            if (item.value === data) {
              data = item;
            }
          });
          return data;
        case 'json':
          if (component.valueProperty) {
            let selectItems;
            try {
              selectItems = JSON.parse(component.data.json);
            } catch (error) {
              selectItems = [];
            }
            selectItems.forEach((item) => {
              if (item[component.valueProperty] === data) {
                data = item;
              }
            });
          }
          return data;
        // TODO: implement url and resource view.
        case 'url':
        case 'resource':
        default:
          return data;
      }
    };
    if (component.multiple && Array.isArray(data)) {
      return data.map(getItem).reduce((prev, item) => {
        let value;
        if (typeof item === 'object') {
          value = (<Text>{raw(interpolate(component.template, { item }))}</Text>);
        } else {
          value = item;
        }
        return (prev === '' ? '' : ', ') + value;
      }, '');
    }

    const item = getItem(data);
    let value;
    if (typeof item === 'object') {
      value = (<Text>{raw(interpolate(component.template, { item }))}</Text>);
    } else {
      value = item;
    }
    return value;
  }*/
}
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
      //console.log(JSON.stringify("SIMPLE"+JSON.stringify(state.form)));
      //alert(JSON.stringify("SIMPLE"+JSON.stringify(state.form)));
      currentPageSubmissionData = state.submission.rawSubmission.data.__root;
   
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
    allsubmission
  };
};

const ConnectedSelect = connect(
  mapStateToProps,

  null,
)(Select);

export default ConnectedSelect;
