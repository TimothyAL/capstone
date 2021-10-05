export const initialUserState = {user:{userName:''}}

export const userActions = {
    SET: 'set',
    UN_SET: 'unset',
    UPDATE: 'update'
}



export function userReducer(state, action) {
    switch(action.type) {
        case userActions.SET:
            return {user:{...action.user}};
        case userActions.UN_SET:
            return {user:{}};
        case userActions.UPDATE:
            return {user:{...state.user, ...action.user}}
        default:
            throw new Error();

    };
};