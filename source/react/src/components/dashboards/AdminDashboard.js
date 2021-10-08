import React from "react";

import UsersDashboard from "../users/UsersDashboard";
import NavBar from "../admin/NavBar";
import BudgetDashboard from "../accounts/BudgetDashboard";
import TeamsDashborad from "../teams/TeamsDashboard";
import TaskDashboard from "../tasks/TaskDashboard";



const AdminDashboard = (props) => {
    return( // the return function contains the jsx that controls rendering of the component
        <div className="">
            <NavBar userState={props.userState}
                    userDispatch={props.userDispatch}
                    taskFilter={props.taskFilter}
                    taskFilterReducer={props.taskFilterReducer}
                    userFilter={props.userFilter}
                    setUserFilter={props.setUserFilter}
                    teamFilter={props.teamFilter}
                    setTeamFilter={props.setTeamFilter}
            />
            <br/>
            <div className="Dashbaord">
                <TeamsDashborad userState={props.userState}
                                userDispatch={props.userDispatch}
                                taskFilter={props.taskFilter}
                                userFilter={props.userFilter}
                                setUserFilter={props.setUserFilter}
                                teamFilter={props.teamFilter}
                                setTeamFilter={props.setTeamFilter}
                />
                {props.userState.role !=='supervisor'
                    ?
                        <BudgetDashboard user={props.userState}/>
                    :
                        <></>
                }
                <UsersDashboard user={props.userState}
                                taskFilter={props.taskFilter}
                                userFilter={props.userFilter}
                                setUserFilter={props.setUserFilter}
                                teamFilter={props.teamFilter}
                                setTeamFilter={props.setTeamFilter}
                />
                <TaskDashboard userState={props.userState}
                               taskFilter={props.taskFilter}
                />
            </div>
        </div>
    )
}

export default AdminDashboard;