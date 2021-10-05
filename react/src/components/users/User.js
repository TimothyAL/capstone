import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

import UserService from "../../services/UserService";
import Team from "../teams/Team"
import Task from "../tasks/Task"
import TaskService from "../../services/TaskService";
import TeamService from "../../services/TeamService";
import TeamManager from "../teams/TeamManager";

const userService = new UserService();
const taskService = new TaskService();
const teamService = new TeamService();

const User = (props) => {
    const [edits, setEdits] = useState({ // get initial user state from props
        ...props.userState,
        password:''
    })

    const [editorActive, ToggleEditor] = useState(false)
    const [showDetails, toggleShowDetails] = useState(props.props? true:false) // if props start expanded

    const [viewTasks, toggleViewTasks] = useState(false) 
    const [tasks, setTasks] = useState([])


    const getTasks = async() => { // get assigned tasks from server if logged in user is self or enhansed user
        if (props.user.id === props.userState.id || ['admin', 'manager', 'supervisor'].includes(props.user.role)){
            let serverResponse = await taskService.getUserTasks(props.userState.id);
            if (serverResponse.status === 203) {
                setTasks(serverResponse.data)
            }else{
                alert('failed to load tasks')
            }
        }
    }

    useEffect(() => { // call gettasks on initial load
        async function loadTasks(){
            await getTasks()
        }
        loadTasks()
    },[]) // dependancy array is left blank so useEffect only runs on initial render

    const refreshTasks = async() => { // function calls gettasks can be passed to child component
        await getTasks();
    }

    const [viewTeams, toggleViewTeams] = useState(false)
    const [teams, setTeams] = useState([])

    const getTeams = async() => { // loads teams from server if self or enhansed user
        if (props.user.id === props.userState.id || ['admin', 'manager', 'supervisor'].includes(props.user.role)){
            let serverResponse = await userService.getUserTeams(props.userState.id);
            if (serverResponse.status === 200) {
                setTeams(serverResponse.data);
            }else{
                alert(`unable to retreve teams\nServer responded with ${serverResponse.status}`);
                console.log(serverResponse);
            }
        }
    }

    useEffect(() => { // calles get teams on initial run
        async function loadTeams(){
            await getTeams()
        }
        loadTeams()
    }, []) // dependancy array is left blank so useEffect only runs on initial render

    const [viewTeamManager, setViewTeamManager] = useState(false)
    const toggleViewTeamManager = () => { // toggle team viewer on toggle refresh teams
        getTeams()
        setViewTeamManager(!viewTeamManager)
    }

    const clearEdits = () => { // reset edits to match user state
        setEdits({...props.userState, password:''})
    }

    const setEditor = () => { // toggle editor
        ToggleEditor(!editorActive)
    }

    const handleEdit = (e) => { // method that handles editor
        setEdits({...edits, [e.target.name]: e.target.value})
    }

    
    const submitEdits = async() => { // calls funciton in parrent component to update the user
        let status = await props.updateUser(edits)
        if (status) {
            setEditor();
        }
    }
    const getPassword = async() => { // reset pasword method for enhansed users. gets random string and sets password to match
        let serverResponce = await userService.resetPassword(props.userState.id)
        if (serverResponce.response.status === 200){
            alert(`Password for ${props.userState.name} reset to: ${serverResponce.password}`)
        }else{
            alert(`Failed to reset password\nServer responded with ${serverResponce.response.status}`)
        }
    }

    const expandDetails = () => { // toggle expanded detials
        toggleShowDetails(!showDetails)
    }

    const toggleShowTasks = () => { // toggle view tasks mode
        getTasks()
        toggleViewTasks(!viewTasks)
    }

    const toggleShowTeams = () => { // toggle view teams mode
        toggleViewTeams(!viewTeams)
    }

    return ( // the return function holds all the jsx that controls rendering the component
        <div className="user Anchor box">
            {props.userState.name.toLowerCase().includes(props.userFilter.toLowerCase()) || props.userFilter === "" ? // if the user's name doesn't match the case insensitive user filter do not render component
                <div className="">
                    {editorActive === false // if edit mode is false render the standard mode component
                        ?
                            <>
                                <div className="user Header" onClick={expandDetails}>
                                    <b>{props.userState.name}</b> <i>type:</i> {props.userState.role} <i>Username:</i> {props.userState.username}
                                </div>

                            </>
                        : // if edit mode is true render the editor
                            <div className="user">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Name"
                                    value={edits.name}
                                    onChange={handleEdit}
                                />
                                <input
                                    type="text"
                                    name="username"
                                    readOnly
                                    className='read-only'
                                    value={edits.username}
                                />
                                <input
                                    type="text"
                                    name="email"
                                    placeholder="email"
                                    value={edits.email}
                                    onChange={handleEdit}
                                />
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Phone number"
                                    value={edits.phone}
                                    onChange={handleEdit}
                                />
                                {props.user.id === props.userState.id?
                                    <input 
                                        type="password"
                                        name="password"
                                        value={edits.password}
                                        onChange={handleEdit}
                                        placeholder="password"
                                    />
                                    :
                                    <></>
                                }
                                {props.userState.id !== props.user.id && ['admin','manager'].includes(props.user.role) // if logged in user is administrator or manager allow managing of role and password
                                    ?
                                    <>
                                        <select
                                            name="role"
                                            value={edits.role}
                                            onChange={handleEdit}
                                        >
                                            <option value="inactive">Inactive</option>
                                            <option value="standard">Standard</option>
                                            <option value="supervisor">Supervisor</option>
                                            {props.user.role === 'admin' && props.user.id !== props.userState.id // if logged in user is an admin allow promotion to manager or admin
                                                ?
                                                <>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                                </>
                                                : // if user is not admin do not allow managment level role promotion
                                                <></>
                                            }
                                        </select>
                                        <Button  size='sm' variant="secondary"
                                            name='resetPassword'
                                            onClick={getPassword}
                                        >Reset Password</Button>
                                    </>
                                    : // if user is not manager do not allow user to manage role
                                    <></>
                                }
                                <Button size='sm' variant="dark"
                                    name="submitEdits"
                                    onClick={submitEdits}
                                >Submit</Button>
                                <Button size='sm' variant="secondary"
                                    name="clearEdits"
                                    onClick={clearEdits}
                                >Reset</Button>
                                <Button size='sm' variant="secondary"
                                    name="resetComponent"
                                    onClick={setEditor}
                                >Cancel</Button>
                            </div>
                    }   
                    {showDetails || props.expanded === true // if props expanded or showDetials true show the expanded component
                        ?
                        <div className="Anchor user">
                            {editorActive === false // if not in editor mode show user contact info and edit button
                                ?
                                    <>
                                    {props.userState.email} {props.userState.phone}
                                    {(props.user.id === props.userState.id || ['admin', 'manager', 'supervisor'].includes(props.user.role)) // if role is enhansed render edit button
                                        ?
                                            <Button size='sm' variant="secondary"
                                                name="setEditor"
                                                onClick={setEditor}
                                            >Edit</Button>
                                        : // if not enhansed user do not render edit button
                                            <></>
                                    }
                                    </>
                                : // if editor mode is true do not render standard contact info or edit button
                                    <></>
                            }
                            {props.inbeded < 2 ? // if the component is inbeded to deep do not allow task or teams to be rendered
                                <>
                                    <div className="Header user" onClick={toggleShowTeams}>{props.userState.name}'s Teams</div>
                                    {viewTeams || props.expanded === true
                                        ? // if view teams or expanded render the teams
                                            viewTeamManager === false
                                                ? // if teams manager is false map teams user is a member to
                                                    <>
                                                        {teams.map((team) => 
                                                            <Team key={team.id}
                                                                    team={team}
                                                                    userState={props.userState}
                                                                    inbeded={props.inbeded + 1}
                                                                    taskFilter={props.taskFilter}
                                                                    userFilter={props.userFilter}
                                                                    teamFilter={props.teamFilter}
                                                            />
                                                        )}
                                                        {['admin', 'manager'].includes(props.user.role) // if logged in user is an admin or manager allow the user to activate manage teams mode
                                                            ?
                                                                <Button size='sm'
                                                                        variant="secondary"
                                                                        onClick={toggleViewTeamManager}
                                                                >Manage {props.userState.name}'s Teams</Button>
                                                            : // if user is not a manager or admin do not render team manager button
                                                                <></>
                                                        }
                                                    </>
                                                : // if view team manager is true render the team manager
                                                    <>
                                                        <TeamManager user={props.userState} teams={teams} />
                                                        <Button size='sm'
                                                                variant="secondary"
                                                                onClick={toggleViewTeamManager}
                                                        >Close Team Manager</Button>
                                                    </>
                                        : // if neither view details or props expanded are true hide the team details
                                            <></>
                                    }
                                    <div className="user Header" onClick={toggleShowTasks}>{props.userState.name}'s Tasks</div>
                                    {viewTasks || props.expanded === true // if view tasks or props expanded true map the assigned tasks
                                        ?
                                            <>
                                                {tasks.map((task) =>
                                                    <Task key={task.id}
                                                        task={task}
                                                        user={props.user}
                                                        taskFilter={props.taskFilter}
                                                        refreshTasks={refreshTasks}
                                                        />
                                                )}
                                                {tasks.length === 0 ? // if there are no assigned tasks display message stating there are no tasks
                                                    <i className="Anchor">(no tasks to display)</i>
                                                : // if there are assigned tasks message is not needed
                                                    <></>
                                                }
                                            </>
                                        : // if view tasks and props expanded both false hide the tasks
                                            <></>
                                    }   
                                </>
                            : // if component inbeded to deep do not render expanded details
                                <></>
                            }
                        </div>
                    : // if show details and props expanded both false do not render contact info or expanded details
                        <></>
                    
                    
                    
                    
                    }
                </div>
            : // if user does not match filter do not render component
                <></>
            }  
        </div>
    )
}
export default User;