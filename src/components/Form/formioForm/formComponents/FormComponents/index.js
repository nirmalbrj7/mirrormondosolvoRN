import {FormioComponents} from '../../factories';

import address from './address';
import Button from './button/Button';
import Columns from './columns/Columns';
// import container from './container';
import Content from './content/Content';
import Currency from './currency/Currency';
// import custom from './custom';
import Datagrid from './datagrid/datagrid';
// import editgrid from './editgrid';
import Datetime from './datetime/Datetime';
import Day from './day/Day';
import Email from './email/Email';
import Fieldset from './fieldset/Fieldset';
import file from './file';
// import hidden from './hidden';
import HtmlElement from './htmlelement/HtmlElement';
import Number from './number/Number';
import Panel from './panel/Panel';
import Password from './password/Password';
import PhoneNumber from './phoneNumber/PhoneNumber';
import Radio from './radio/Radio';
// import resource from './resource';
// import survey from './survey';
import Select from './select/Select';
import Selectboxes from './selectboxes/SelectBoxes';
import Signature from './signature/Signature';
import Switch from './switch/Switch';
// import table from './table';
import Textarea from './textarea/Textarea';
import TextField from './textfield/TextField';
import Time from './time/Time';
import Location from './location';
// import well from './well';

FormioComponents.register('address', address);           //⏳
FormioComponents.register('button', Button);          //✅
FormioComponents.register('columns', Columns);        //✅
// FormioComponents.register('container', container);       //⭕️
FormioComponents.register('content', Content);        //✅
FormioComponents.register('currency', Currency);      //✅
// FormioComponents.register('custom', custom);             //⭕️
FormioComponents.register('tag', Number);         //⭕️
// FormioComponents.register('editgrid', editgrid);         //⭕️
FormioComponents.register('datetime', Datetime);      //✅
FormioComponents.register('day', Day);                //✅
FormioComponents.register('email', Email);            //✅
FormioComponents.register('fieldset', Fieldset);      //✅
FormioComponents.register('file', file);
// FormioComponents.register('hidden', hidden);             //⭕️
FormioComponents.register('htmlelement', HtmlElement);//⏳
FormioComponents.register('number', Number);          //✅
FormioComponents.register('panel', Panel);            //✅
FormioComponents.register('password', Password);      //✅
FormioComponents.register('phoneNumber', PhoneNumber);//✅
FormioComponents.register('radio', Radio);            //✅
// FormioComponents.register('resource', resource);         //⏳
// FormioComponents.register('survey', survey);             //⭕️
FormioComponents.register('select', Select);          //✅
FormioComponents.register('selectboxes', Selectboxes);//✅
FormioComponents.register('signature', Signature);        //⭕️
FormioComponents.register('checkbox', Switch);        //✅
// FormioComponents.register('table', table);               //⭕️
FormioComponents.register('textarea', Textarea);      //✅
FormioComponents.register('textfield', TextField);    //✅
FormioComponents.register('time', Time);              //✅
FormioComponents.register('geolocation', Location); 
FormioComponents.register('datagrid', Datagrid); 

// FormioComponents.register('well', well);                 //⭕️
