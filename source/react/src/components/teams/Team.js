import {Button} from "react-bootstrap";
import {useState, useEffect} from "react";

import TeamService from '../../services/TeamService';
import User from "../users/User";
import Task from "../tasks/Task";
import UserService from '../../services/UserService'

import TaskService from "../../services/TaskService";

const taskService = new TaskService()
const teamService = new TeamService()
const userService = new UserService()

const Team = (props) => {
    const [team, setTeam] = useState(props.team); // get the team info from props

    
    const [edits, setEdits] = useState(props.team); // store edits in a seperate state object
    const handleChange = (e) => { // basic handler for edits
    setEdits({...edits, [e.target.name]:e.target.value})
    }

    const clearEdits = () => { // reset edits to the initial state of the team object
        setEdits(team)
    }


    // state object and toggle for the editor mode
    const [editor, setEditor] =useState(false);
    const toggleViewEditor = () => {
        setEditor(!editor);
    };

    // state object and toggle for the view detials expanded mode
    const [viewDetails, setViewDetails] = useState(false);
    const toggleViewDetails = () => {
    setViewDetails(!viewDetails);
    };
    
    const [tasks, setTasks] = useState([]) // list of tasks that belong to the team object

    // the state object and toggle for the view tasks expanded mode
    const [viewTasks, setViewTasks] = useState(false);
    const toggleViewTasks = () => {
        setViewTasks(!viewTasks);
    };

    const getTasks = async() => { // load tasks from the server
        let serverResponce = await taskService.getTeamTasks(team.id)
        if (serverResponce.status === 200){
            setTasks(serverResponce.data)
        }else{
            alert(`Failed to get ${team.name}'s tasks\nServer responded with: ${serverResponce.response.status}`)
        }
    }

    useEffect(() => { // on initial render load tasks from the server
        async function loadTasks(){
            await getTasks()
        }
        loadTasks()
    }, []) // dependancy array is left empty so the useEffect only runs on initial render

    const refreshTasks = async() => { // function call get tasks to be passed to children components
        await getTasks()
    }


    const [users, setUsers] = useState([]); // list of users
    const getUsers = async() => { // retreves list of users from the server
        let serverResponse = await userService.getUsers();
        if (serverResponse.status === 200) {
            setUsers(serverResponse.data);
        }else{
            alert(`failed to retreve users\nStatus: ${serverResponse.status}`);
        };
    };

    useEffect(() => { // load users on initial render
        async function loadUsers(){
            await getUsers(); }
        loadUsers();
    }, []); // dependancy array is left empty so useEffect only runs on initial render

    const [teamMembers, setTeamMembers] = useState([]) // list of team members

    // state object and toggle for view team members expanded mode
    const [viewTeamMembers, setViewTeamMembers] = useState(false);
    const toggleViewTeamMembers = () => {
        setViewTeamMembers(!viewTeamMembers);
    };

    useEffect(() => { // load team members
        async function getMembers(){
            let serverResponce = await teamService.getTeamMembers(team.id)
            if (serverResponce.status === 200) {
                setTeamMembers(serverResponce.data)
                return
            }else{
                alert(`Failed to get team members for ${team.name}\nServer responded with: ${serverResponce.response.status}`)
            }
        }
        getMembers()
    }, []) // dependancy array left empty so that function only runs on initial render

    const updateUser = async(user) => { // submit user updates to the server, passed as props to child user components
        let userList = teamMembers;
        let serverResponce = await userService.updateUser(user);
        if(serverResponce.status === 200){
            for (let i=0; i < userList.length; i++) {
                if (user.id === userList[i].id) {
                    userList[i] = user;
                    setTeamMembers(userList); // updates user in member list
                    return true;
                }
            }
        }
        alert(`failed to update user\nServer returned: ${serverResponce.status}`)
        return false;
    }


    const resetComponent = () => { // closes edit mode and view details mode, discards edits made to team
        clearEdits();
        setViewDetails(false);
        setEditor(false)
    }

    const submitChanges = async() => { // submits team update to server then resets component
        let serverResponce = await teamService.updateTeam(edits)
        if (serverResponce.status === 201) {
            resetComponent()
        }else {alert(`failed to update team\n server responed with: ${serverResponce.response.status}`)}
    }


    return ( // return holds jsx that controls render of the component
        <>{team.name.toLowerCase().includes(props.teamFilter.toLowerCase()) || props.teamFilter === "" ? // if the filter does not match do not render component
            <div className='team Anchor box'>
                {editor === false // if editor mode is false do not render editor
                    ?
                        <>
                            <div className="team Header inline" onClick={toggleViewDetails}>
                                <b>{team.name}</b> Supervisor: {team.supervisor.name}{' '}{team.discription}
                            </div>
                        </>
                    : // if editor mode is true render in edit mode
                        <>
                            <input 
                                type="text"
                                name="name"
                                placeholder="Name"
                                value={edits.name}
                                onChange={handleChange}
                            />
                            {' '}<label>Supervisor:</label>{' '}
                            <select
                                name="owner"
                                value={edits.owner}
                                onChange={handleChange}
                            >
                                {users.map((user) => 
                                <>{['admin', 'manager', 'supervisor'].includes(user.role)?
                                    <option value={user.id} key={`userKey${user.id}`}>{user.name}</option>
                                    :<></>}
                                </>
                                )}
                            </select>
                            <input
                                name="description"
                                placeholder="description"
                                value={edits.desctiption}
                                onChange={handleChange}
                            />
                            <Button size='sm' variant="dark"
                                name="submitChanges"
                                onClick={submitChanges}
                            >Submit</Button>
                            <Button size='sm' variant="secondary"
                                name="clearEdits"
                                onClick={clearEdits}
                            >Reset</Button>
                            <Button size='sm' variant="secondary"
                                name="cancel"
                                onClick={resetComponent}
                            >Cancel</Button>
                        </>
                }
            
                {viewDetails && props.inbeded < 2 // if view details mode is true and component is not imbeded to deep render expanded component
                    ?//if state.details is true show detailed view
                        <>
                            {editor === false && ['manager', 'admin'].includes(props.userState.role) ? // if editor is false and user has access render team editor toggle button
                                    <Button size='sm' variant="secondary"
                                        name="editMode"
                                        onClick={toggleViewEditor}
                                    >Edit</Button>
                                : // do not allow editor mode to be toggled on if user is not appropriate role or if already on
                                <></>
                            }
                            <div className="team Header " onClick={toggleViewTeamMembers}>Team Members</div>
                            {viewTeamMembers
                                ? // if view team members true map team member list
                                    teamMembers.map((user) => 
                                        <User key={`userMap${user.id}`}
                                              userState={user}
                                              user={props.userState}
                                              userFilter={props.userFilter}
                                              teamFilter={props.teamFilter}
                                              taskFilter={props.taskFilter}
                                              inbeded={props.inbeded + 1}
                                              updateUser={updateUser}
                                        />
                                    )
                                : // if view team members false to not render anything extra
                                    <></>
                            }
                            <div className="team Header" onClick={toggleViewTasks}>Assigned Tasks</div>
                            {viewTasks // if view tasks true map task list to task components
                                ?
                                    tasks.map((task) =>
                                        <Task key={`taskMap${task.id}`}
                                              user={props.userState}
                                              task={task}
                                              taskFilter={props.taskFilter}
                                              refreshTasks={refreshTasks}
                                        />
                                    )
                                : // if view tasks is false do not render anything extra
                                    <></>
                            }

                        </>
                    ://if state.details is false render nothing
                        <></>
                }
            </div>
        : // if filter condition not met render nothing
            <></>
        }
        </>
    )

}

export default Team