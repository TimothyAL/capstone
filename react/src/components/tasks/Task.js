import React from "react";
import { useEffect, useState} from "react";
import { Container, Button, Col, Row } from "react-bootstrap";

import TaskService from "../../services/TaskService";
import TeamService from "../../services/TeamService";
import UserService from "../../services/UserService";
import NewTaskNote from "./NewTaskNote";
import TaskNote from "./TaskNote";

function Task(props) {
    const taskService = new TaskService();
    const teamService = new TeamService();
    const userService = new UserService();
    const [state, setState] = useState({ // the inital state of the task object
        id: props.task.id,
        name: props.task.name,
        assigner: props.task.assigner,
        due_date: props.task.due_date,
        description: props.task.description,
        status: props.task.status,
        requires_verification: props.task.requires_verification,
        displayDetails: false,
        editMode: false,
        allocation: props.task.budget,
        notes: props.task.notes,
    })

    const showDetails = () => { // toggle the display details portion of state
        setState({
            ...state,
            displayDetails: !state.displayDetails
        })
    }

    const overdue = { // the overdue style adjustment
        borderBottom: 'solid red'
    }

    const editMode = () => {
        setState({ // toggle edit mode reset edits when toggling
            ...state,
            id: props.task.id,
            name: props.task.name,
            assigner: props.task.assigner,
            due_date: props.task.due_date,
            description: props.task.description,
            status: props.task.status,
            requires_verification: props.task.requires_verification,
            displayDetails: false,
            editMode: false,
            allocation: props.task.budget,
            notes: props.task.notes,
            editMode: !state.editMode,
            edit: {
                id: props.task.id,
                name: props.task.name,
                assigner: props.task.assigner,
                due_date: props.task.due_date.length > 10 ? props.task.due_date.slice(0,-6) : props.task.due_date,
                description: props.task.description,
                status: props.task.status,
                requires_verification: props.task.requires_verification,
                team: props.task.team,
                user: props.task.user,
            }
        })
    }

    const resetEdits = () => {
        setState({ // reset edits
            ...state,
            id: props.task.id,
            name: props.task.name,
            assigner: props.task.assigner,
            due_date: props.task.due_date,
            description: props.task.description,
            status: props.task.status,
            requires_verification: props.task.requires_verification,
            displayDetails: false,
            allocation: props.task.budget,
            notes: props.task.notes,
            edit: {
                id: props.task.id,
                name: props.task.name,
                assigner: props.task.assigner,
                due_date: props.task.due_date.length > 10 ? props.task.due_date.slice(0,-6) : props.task.due_date,
                description: props.task.description,
                status: props.task.status,
                requires_verification: props.task.requires_verification,
                ballance: props.ballance,
                allcount: props.account,
                sub_account: props.sub_account,
                team: props.task.team,
                user: props.task.user,
            }
        })
    }

    const handleEdit = (e) => {
        setState({ // the handler for an edit
            ...state,
            edit:{
                ...state.edit,
                [e.target.name]: e.target.value
            }
        })
    }

    const handleEditTeam = (e) => {
        setState({ // the handler for setting the assigned team
            ...state,
            edit:{
                ...state.edit,
                [e.target.name]: e.target.value,
                user:''
            }
        })
    }

    const handleEditUser = (e) => {
        setState({ // the handler for setting the assigned user
            ...state,
            edit:{
                ...state.edit,
                [e.target.name]: e.target.value,
                team:''
            }
        })
    }

    const handleEditTogle = (e) => {
        setState({ // the handler for toggles 
            ...state,
            edit: {
                ...state.edit,
                [e.target.name]: !state.edit[e.target.name]
            }
        })
    }

    // view image toggle
    const [viewImage, toggleViewImage] = useState(false)
    const showImage = (e) => { 
        toggleViewImage(e)
    }

    // hard set to make image no longer viewable
    const clearImage = () => {
        toggleViewImage(false)
    }

    // submits updates for the task to the server
    const submitEdits = async () => {
        let serverResponce = await taskService.updateTask(state.edit).then(data => data)
        if (serverResponce.status === 201) {
            await props.refreshTasks()
            editMode()
        }
    }

    // validates the task can be deleted then requests the server to delete the task
    const deleteTask = async () => {
        if (props.task.budget && (props.task.budget.ballance > 0 || props.task.budget.ammount > 0)){
            alert(`cannot delete a task with allocated or spent funds`)
            return;
        }
        let serverResponce = await taskService.deleteTask(state.id)
        if (serverResponce.status === 202) {
            props.refreshTasks()
        }
    }

    // adds a note to the task
    const addNote = async(note, status, noteImage, recept) => {
        let serverResponce = await taskService.addNote(state.id, note,  status, noteImage, recept)
        if (serverResponce.status === 201) {
            props.refreshTasks()
            let noteList = state.notes
            noteList.push(serverResponce.data)
            setState({...state, notes:noteList})
            return true
        } else if (serverResponce.response.status === 403){
            alert(`insuficent funds please talk to a manager about creating a new task`);
            return false;
        }
        alert(`Failed to post Task Note\n Server Responded with: ${serverResponce.response.status}`)
        console.log(serverResponce)
        return false
    }

    const [users, setUsers] = useState([]) // list of users state object
    const [teams, setTeams] = useState([]) // list of teams state object
    useEffect(() => { // useEffect loads users and teams from the server
        async function getResources() {
            if (users.length === 0) {
                let serverResponce = await userService.getUsers();
                if (serverResponce.status === 200) {
                    setUsers(serverResponce.data)
                }else {
                    alert('failed to get users')
                    return
                }
            }
            if (teams.length === 0) {
                let serverResponce = await teamService.getAllTeams();
                if (serverResponce.status === 200) {
                    setTeams(serverResponce.data)
                }else {
                    alert('failed to get teams')
                    return
                }
            }
        }
        getResources()
    }, []) // dependancy array is left empty so the useEffect is only run the first time the component is rendered

    return( // the return holds the jsx that controls rendering of the component
        <div className="task">{props.taskFilter.viewedStatuses[props.task.status] ?
            <div className="task header Anchor box">{state.id
                ?//if there isn't a task do not render component
                <div>
                    {viewImage? // if view image is true render the image
                        <div onClick={clearImage} className="noteImageDisplay">
                            <img src={`/api/tasks/image/${viewImage}`}/><br/>
                            Click image to close
                        </div>
                    : // if view image is false render nothing
                        <></>}
                    {state.editMode === false
                        ?//check for edit mode active, if not render static text
                            <>
                                <div onClick={showDetails}>
                                    <div className='task-header' style={(Date.parse(state.due_date) < Date.now()) && state.status !== 'completed'? overdue:null}><b>{state.name}</b>{' '}
                                        <label className='task-info'><i>due: </i></label>
                                        <button class="btn status">{state.due_date}</button>
                                        <label className='task-info'><i>status:</i> </label>
                                        <button
                                            class="btn status"
                                            name="taskStatus"
                                        >{state.status}</button>
                                        {props.task.assigned_team !== null ? // if assigned team is not null display assigned team info
                                            <><label className='task-info'>assigned team:</label>{' '}{props.task.assigned_team.name}{' '}</>
                                            :""
                                        }{props.task.assigned_user !== null ? // if assigned user is not null dispaly assigned user info
                                            <><label className='task-info'>assigned user:</label>{' '}{props.task.assigned_user.name}{''}</>
                                            :""
                                        }
                                    </div>
                                    {state.ballance > 0
                                        ?//if funds avalible show ballance
                                            <button
                                                class="btn btn-secondary"
                                                name="funds"
                                            >{state.ballance}</button>
                                        ://if no funds show nothing
                                            <></>
                                    }
                                    
                                </div>
                            </>
                        :// if in edit mode render editor
                            <>
                                <input
                                    type="text"
                                    name="name"
                                    value={state.edit.name}
                                    onChange={handleEdit}
                                />
                                <input
                                    type="date"
                                    name="due_date"
                                    value={state.edit.due_date}
                                    onChange={handleEdit}
                                />
                                <input
                                    type="text"
                                    name="description"
                                    value={state.edit.description}
                                    onChange={handleEdit}
                                />
                                <select
                                    name="status"
                                    value={state.edit.status}
                                    onChange={handleEdit}
                                >
                                    <option value="created">Created</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="viewed">Viewed</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="submited">Submited</option>
                                    <option value="regected">Regected</option>
                                    <option value="verified">Verified</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <label>Requires Manager Signoff:</label>
                                <input
                                    type="checkbox"
                                    name="requires_verification"
                                    onChange={handleEditTogle}
                                    value={state.edit.requires_verification}
                                />
                                <select
                                    name="team"
                                    onChange={handleEditTeam}
                                    value={state.edit.team}
                                >
                                    <option value="">-</option>
                                    {teams.map( (team) =>
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    )}
                                </select>
                                <select
                                    name="user"
                                    onChange={handleEditUser}
                                    value={state.edit.user}
                                >
                                    <option value="">-</option>
                                    {users.map( (user) =>
                                        <option value={user.id} key={user.id}>{user.name}</option>
                                    )}
                                </select>
                                <button
                                    className="btn btn-primary"
                                    onClick={submitEdits}
                                >Submit Edits</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={resetEdits}
                                >Reset</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={editMode}
                                >Cancel</button>
                            </>
                    }
                    {state.displayDetails
                        ?// if displayDetails is true display notes and description
                            <>
                                {props.task.budget && (props.task.budget.ballance > 0 || props.task.budget.ammount > 0) ?
                                    <div>
                                        <span>funds Avalible: ${props.task.budget.ballance}{' '}</span>
                                        <span>spent: ${props.task.budget.ammount}{' '}</span>
                                        <span>{props.task.budget.account ? `from Account: ${props.task.budget.account_allocations.name}`
                                                    :`from Sub-Account: ${props.task.budget.sub_account_allocations.name}`}</span><br/>
                                        <b>Details:</b>{' '}{props.task.description}
                                    </div>:<></>
                                }
                                <div className="bottom-line"/>
                                <Container fluid className=''>
                                    <Row className="bottom-line">
                                        <Col xs={5}><b>Note</b></Col>
                                        <Col xs={1}><b>End Status</b></Col>
                                        <Col xs={2}><b>Updated By</b></Col>
                                        <Col xs={2}><b>At</b></Col>
                                        <Col xs={2}><b>Image</b></Col>
                                    </Row>
                                {state.notes.map((note) =>
                                    <TaskNote key={note.id} note={note} showImage={showImage}/>
                                )}
                                </Container>
                                <NewTaskNote task={props.task} user={props.user} createNote={addNote}/>
                                {(['admin', 'manager', 'supervisor'].includes(props.user.role) && state.editMode === false)
                                    ?//if logged in user is admin or manager allow to edit task details
                                        <>
                                            <Button
                                                class="btn btn-primary"
                                                name="updateTask"
                                                onClick={editMode}
                                            >Edit Task</Button>
                                            <Button
                                                class="btn btn-primary"
                                                name="deleteTask"
                                                onClick={deleteTask}
                                            >Delete Task</Button>
                                        </>
                                    ://if check faild do not render button
                                        <></>
                                }
                            </>
                        :// if displayDetails is false do not render
                            <></>
                    }
                </div>
            :// if no task avalible do not render anything on component
                <></>
            }</div>
        :<></>}   
        </div>
    )
}

export default Task;