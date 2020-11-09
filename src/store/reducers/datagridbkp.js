export const initalState = [
]
export default function datagridReducer(state = initalState, action) {
//export const datagridReducer = (state,action)=>{
   switch(action.type){
          case "add_card":
              return [...state,{id:Math.random(),title:`blog title${state.length+1}`,schema:action.payload}]
          case "update_card":
              return [...state,{id:Math.random(),title:action.payload.title,content:action.payload.content}]
          case "remove_card":
              return state.filter((post)=> action.payload !== post.id)
         default:
            return state
   }

}