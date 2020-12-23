import ActionTypes from '../actions/actionTypes';
const initalState = [];

export default function user(state = initalState, action) {
   
    switch (action.type) {
        
        case ActionTypes.CLEAR_USER:
            return state = [];
        case ActionTypes.ADD_USER:
            var data = action.data;
            return data
        default:
            return state
    }
}
