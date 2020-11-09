import ActionTypes from '../actions/actionTypes';
const initalState = [];

export default function resource(state = initalState, action) {
    switch (action.type) {
        case ActionTypes.CLEAR_RESOURCE:
            return state = [];
        case ActionTypes.ADD_RESOURCE:
            var data = action.data;
            return [...state, data];
        default:
            return state
    }
}
