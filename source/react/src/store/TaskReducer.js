export const initialTaskState = {viewedStatuses:{'created':true, 'assigned':true, 'viewed':true,
                                                 'in_progress':true, 'on_hold':true, 'submited':true,
                                                 'regected':true, 'verified':true, 'completed':false}}

export const taskFilterActions = {
    UPDATE: 'update',
    RESET: 'view all'
}

export function taskReducer(state, action) {
    switch(action.type) {
        case taskFilterActions.UPDATE:
            return {viewedStatuses:{...state.viewedStatuses, ...action.action}}
        case taskFilterActions.RESET:
            return initialTaskState;
        default:
            return new Error()
    }
}