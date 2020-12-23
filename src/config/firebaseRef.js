import {connect} from 'react-redux';

const PartialReview = ({auth}) => {
return '00000'
};

  const mapStateToProps = (state) => {
    return {auth: state.submissions}
    };
  export default connect(mapStateToProps)(PartialReview)