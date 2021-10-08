import React from "react";

import NavBar from "../admin/NavBar";
import User from "../users/User";
import UserService from "../../services/UserService";
import { userActions } from "../../store/UserReducer";


const Dashboard = (props) => {
    const userService = new UserService()

    const updateUser = async(user) => { // this function submits user updates to the server
        let serverResponce = await userService.updateUser(user);
        if(serverResponce.status === 200){
            props.userDispatch({type:userActions.UPDATE, user:user})
            return true;
        }
        alert(`failed to update user\nServer returned: ${serverResponce.status}`)
        return false;
    }

    return( // the return function holds the jsx the controls rendering of the component
        <div className="">
            <NavBar userState={props.userState}
                    userDispatch={props.userDispatch}
                    taskFilter={props.taskFilter}
                    taskFilterReducer={props.taskFilterReducer}
                    userFilter={props.userFilter}
                    setUserFilter={props.setUserFilter}
                    teamFilter={props.setTeamFilter}
            />
            <div className="Dashboard">
                <User user={props.user}
                      userState={props.userState}
                      updateUser={updateUser}
                      userFilter={props.userFilter}
                      taskFilter={props.taskFilter}
                      teamFilter={props.teamFilter}
                      inbeded={false}
                />
            </div>
        </div>
    )
}

export default Dashboard