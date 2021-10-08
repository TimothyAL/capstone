import React from "react";
import NavBar from "./NavBar";

import User from "../users/User"
import UserService from "../../services/UserService";
import { userActions } from "../../store/UserReducer";

const Profile = (props) => {
    const userService = new UserService()

    const updateUser = async(user, password) => { // submit user updates to the server
        delete user['role']
        let serverResponce = await userService.updateUser(user, password);
        if (serverResponce.status === 200){
            props.userDispatch({type: userActions.UPDATE, user:serverResponce.data.user});
            return true;
        }else{
            alert(`Failed up update profile\n Server Responded with: ${serverResponce.status}`);
            console.log(serverResponce)
            return false;
        }
    }

    return( // the return holds the jsx that controls the rendering of the component
        <div className="Dashboard">
            <NavBar userState={props.userState}
                    userDispatch={props.userDispatch}
                    profile={true}
                    userFilter={props.userFilter}
                    setUserFilter={props.setUserFilter}
                    teamFilter={props.teamFilter}
                    setTeamFilter={props.setTeamFilter}
                    taskFilter={props.taskFilter}
                    taskFilterReducer={props.taskFilterReducer}
            />
            <br/>
            <User userState={props.userState}
                  user={props.userState}
                  updateUser={updateUser}
                  inbeded={false}
                  userFilter={props.userFilter}
                  setUserFilter={props.setUserFilter}
                  teamFilter={props.teamFilter}
                  setTeamFilter={props.setTeamFilter}
                  taskFilter={props.taskFilter}
                  taskFilterReducer={props.taskFilterReducer}
                  expanded = {true}
            />
        </div>
    )
}

export default Profile;