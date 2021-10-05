import React from 'react';
import NavBar from './admin/NavBar';

const Main = (props) => { // this component is the root route for a logged in user
    return (
        <div className="">
            <NavBar userState={props.userState}
                    userDispatch={props.userDispatch}
                    taskFilter={props.taskFilter}
                    taskFilterReducer={props.setTaskFilter}
                    userFilter={props.userFilter}
                    setUserFilter={props.setUserFilter}
                    teamFilter={props.teamFilter}
                    setTeamFilter={props.setTeamFilter}
            />
        </div>
    )
}

export default Main;