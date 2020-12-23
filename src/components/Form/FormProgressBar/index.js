import React from 'react';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import globalStyles from '../../../globalStyles';
import styles from './style';
class FormProgressBar extends React.PureComponent {
  render() {
    const { wizard: { pages, currentPage },submission } = this.props;

    return (
      <View style={[styles.progressBarContainer,{backgroundColor:'#FF6347'}]}>
        {pages.map((page, i) => {
          //if (i !== currentPage) {
           // return <Text key={page.key} style={globalStyles.text}>{page.title}</Text>;
           //return <Text></Text>;
          //}
          if (i === currentPage) 
          return (
          <View>
          <Text key={page.key} 
          
          style={[
            globalStyles.text, 
            { flex:1,fontWeight: 'bold',textAlign:'center',alignSelf:'center',color:'#fff' }]}>
              
              
              {page.title}</Text>
              <Text key={page.key} 
          
          style={[
            globalStyles.text, 
            { flex:1,fontWeight: 'bold',textAlign:'center',alignSelf:'center',color:'#fff' }]}>
              
              
              {submission.submissionId==null?'No submission':submission.submissionId}</Text>
            </View>
          

            
            
            )
        })}
      </View>
    );
  }
}
FormProgressBar.propTypes = {
  wizard: PropTypes.shape({
    pages: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string,
      title: PropTypes.string,
    })).isRequired,
    currentPage: PropTypes.number,
  }).isRequired,
};
const mapStateToProps = state => ({
  wizard: state.wizard,
  submission:state.submission,
});
const ConnectedFormProgressBar = connect(
  mapStateToProps,
  null,
)(FormProgressBar);

export default ConnectedFormProgressBar;
