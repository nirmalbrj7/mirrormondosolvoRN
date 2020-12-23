import React from 'react';
import renderer from 'react-test-renderer';
import Fieldset from '../fieldset/Fieldset';
import colors from '../../../../../../../../react-native-formio-master/src/defaultTheme/colors';
import theme from '../../../../../../../../react-native-formio-master/src/defaultTheme';

import components from '../../../../../../../../react-native-formio-master/test/forms/componentSpec';

describe('Fieldset', () => {
  describe(' Fieldset component', () => {
    var component= {
      'input': false,
      'tableView': true,
      'legend': '',
      'components': [
        components.textfeild,
        components.password,
        components.phoneNumber
      ],
      'type': 'fieldset',
      'conditional': {
        'show': '',
        'when': null,
        'eq': ''
      }
    };
    const attachToForm = jest.fn();

    it.only('Renders a basic fieldset component', () => {
      const element = renderer.create(<Fieldset
        component={component}
        attachToForm={attachToForm}
        colors={colors}
        theme={theme}
        />);
        expect(element).toMatchSnapshot();
        // expect(element.find('fieldset').length).to.equal(1);
    });

    it('Check with legend for fieldset component', function(done) {
      component.legend = 'My fieldset';
      const element = renderer.create(<Fieldset
        component={component}
        attachToForm={attachToForm}
        />);
      expect(element.find('legend').length).to.equal(1);
      done();
    });

    it('Check without legend for fieldset component', function(done) {
      component.legend = '';
      const element = renderer.create(<Fieldset
        component={component}
        attachToForm={attachToForm}
         />);
      expect(element.find('legend').length).to.equal(0);
      done();
    });

    it('Check the nested components of fieldset', function(done) {
      const element = renderer.create(<Fieldset
        component={component}
        attachToForm={attachToForm}
       />);

      //To test type of nested components of fieldset
      for (var i= 0; i<component.components.length; i++) {
        expect(element.nodes[0].props.children[1].props.component.components[i].type).to.equal(component.components[i].type);
      }
      done();
    });
  });
});
