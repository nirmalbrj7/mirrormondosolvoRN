export const initalState = [
    /*{
        key:'',
        components:[],
        data:[]
    }*/
]
export default function datagridReducer(state = initalState, action) {
//export const datagridReducer = (state,action)=>{
   switch(action.type){

       case "clear_data":
       return state=[];

       case "select_card":
       return state=action.payload;
    case "init_data":
        if(state=[])
        return [...state,
            {
                number:0,
                id:Math.random(),
                key:action.payload.key,
                components:action.payload,
                data:action.payload.data
            }]
            else
            return state

          case "add_card":
              return [...state,{
                number:state.length+1,  
                id:Math.random(), 
                key:action.payload.key,
                components:action.payload,
                data:action.payload.data}]
          case "update_card":
              return [...state,{id:Math.random(),title:action.payload.title,content:action.payload.content}]
          case "remove_card":
              return state.filter((post)=> action.payload !== post.id)
         default:
            return state
   }

}