export const initalState = []
export default function datagridReducer(state = initalState, action) {
    switch (action.type) {
        case "clear_data":
            return state = [];
        case "select_card":
          //  alert("sssss"+JSON.stringify(action));
            return state = action.payload;
        case "init_data":
            if (state == [])
                return [
                    {
                        number: 0,
                        id: Math.random(),
                        key: action.payload.key,
                        components: action.payload,
                        data: action.payload.data
                    }]
            else
                return state

        case "add_card":
            if (state.length == 0)
                return [{
                    number: state.length + 1,
                    id: Math.random(),
                    key: action.payload.key,
                    components: action.payload,
                    data: action.payload.data
                }]
            else
     
                return [...state, {
                    number: state.length + 1,
                    id: Math.random(),
                    key: action.payload.key,
                    components: action.payload,
                    data: action.payload.data
                }]
        case "update_card":
            console.log("here" + JSON.stringify(action));
            return [...state, { id: Math.random(), title: action.payload.title, content: action.payload.content }]
        case "remove_card":
            return state.filter((post) => action.payload !== post.id)
        default:
            return state
    }

}