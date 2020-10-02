import ActionTypes from '../actions/actionTypes';
const initalState = [];

export default function resource(state = initalState, action) {
    switch (action.type) {
        case ActionTypes.CLEAR_SINGLE_SUBMISSION:
            return state = [];
        case ActionTypes.ADD_SINGLE_SUBMISSION:
            var data = action.data;
            return [...state, data];
        default:
            return state
    }
}
