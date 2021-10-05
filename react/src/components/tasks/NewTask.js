import React, { useEffect } from "react"
import {useState} from "react";
import { Button } from "react-bootstrap";

import AccountService from "../../services/AccountService";
import TaskService from "../../services/TaskService"
import TeamService from "../../services/TeamService";
import UserService from "../../services/UserService";

function NewTask(props) {
    const taskService = new TaskService();
    const teamService = new TeamService();
    const userService = new UserService();
    const accountService = new AccountService()

    const getUsers = async() => { // load users from the server
        let serverResponce = await userService.getUsers();
        if (serverResponce.status === 200) {
            setUsers(serverResponce.data)
        }else {
            alert('failed to get users')
            return
        }
    }
    const getTeams = async() => { // load teams from the server
        let serverResponce = await teamService.getAllTeams();
        if (serverResponce.status === 200) {
            setTeams(serverResponce.data)
        }else {
            alert('failed to get teams')
            return
        }
    }


    const [editor, setEditor] = useState(false)
    const [teams, setTeams] = useState([])
    const [users, setUsers] = useState([])
    const [accounts, setAccounts] = useState([])
    const [subAccounts, setSubAccounts] = useState([])
    const[name, setName] = useState('')
    const handleNameChange = (e) => { // the handler for a name change
        setName(e.target.value)
    }

    // the due date state for a new task as well as the handler to set it
    const[due_date, setDueDate] = useState('')
    const handleDueDateChange = (e) => {
        setDueDate(e.target.value)
    }

    // the description state object and the handler to change it
    const[description, setDiscription] = useState('')
    const handleDiscriptionChange = (e) => {
        setDiscription(e.target.value)
    }

    // the state object for the status of a new task and handler to change it
    // the change handler is unused at the moment but may be used in future implementations
    const[status, setStatus] = useState('created')
    const handleStatusChange = (e) => {
        setStatus(e.target.value)
    }

    // the state object and handler for setting if the task requires verification
    const[requires_verification, setRequiresVerification] = useState(false)
    const handleRequiresVerificationToggle = () => {
        setRequiresVerification(!requires_verification)
    }

    // the state object and handler for setting the team the task is assigned to
    const[assignedTeam, setAssignedTeam] = useState(0)
    const handleTeamAssignment = (e) => {
        setAssignedTeam(e.target.value)
    }

    // the state object and handler for setting the user the task is assigned to
    const[assignedUser, setAssignedUser] = useState(0)
    const handleUserAssignment = (e) => {
        setAssignedUser(e.target.value)
    }

    // the state object and handler for setting the ballance assigned to the task
    const[ballance, setBallance] = useState(0)
    const handleBallanceChange = async(e) => {
        if(accounts.length === 0) { // if no accounts are loaded load the accounts
            let serverResponce = await accountService.loadAccounts();
            if (serverResponce.status === 200) {
                if (serverResponce.data.accounts.length === 0 && serverResponce.data.sub_account.length === 0) {
                    alert('no accounts returned by the server please create one before allocating funds')
                    return
                }
                setAccounts(serverResponce.data.accounts);
                setSubAccounts(serverResponce.data.sub_accounts);
            } else 
                alert("Failed to load accounts you will not be ablet to set an allocation");
                return;
            }
            setBallance(e.target.value)
        };

    // the state object for setting the assigner of the taks object. currently only the logged in user is a valid option
    const[assigner, setAssigner] = useState(props.assigner.id)

    // the state object and handler for setting the account that a task is assigned to
    const[account, setAccount] = useState(0)
    const handleAccountChange = (e) => {
        setAccount(e.target.value)
    }

    // the state object and handler for setting the sub account that a task is assigned to
    const[sub_account, setSubAccount] = useState(0)
    const handleSubAccountChange = (e) => {
        setSubAccount(e.target.value)
    }

    useEffect(() => { // when the component is loaded get teams and users
        async function getResources() {
            await getTeams()
            await getUsers()
        }
        getResources()
    }, []) // the dependancy array is left empty so that it will only run at the initial rendering



    const clearTask = () => { // reset the new task object
        setName('')
        setDueDate('')
        setDiscription('')
        setStatus('created')
        setRequiresVerification(false)
        setAssignedTeam(0)
        setAssignedUser(0)
        setBallance(0)
        setAccount(0)
        setSubAccount(0)
    }

    const cancelNewTask = () => { // reset the new task object and close the editor
        clearTask()
        setEditor(false)
    }

    const toggleEditor = async() => { // reload the teams and users then toggle the editor
        await getUsers()
        await getTeams()
        setEditor(!editor)
    }

    const submitNewTask = async() => { // validate the new task object then submit it to the server
        if(name === ""){
            alert('please give this task a name before submitting');
            return;
        }
        if(ballance > 0 && account === 0 && sub_account === 0){
            alert("you must pick an account if your are assigning funds");
            return;
        }
        if(assignedTeam === 0 && assignedUser === 0){
            alert("please assign this task before submitting");
            return;
        }
        if(due_date === ''){
            alert('Please assign a due date');
            return;
        }
        if(description === "") { 
                if (window.confirm("do you want to submit this task without a discription?") === false) {
                    return;
                }
            }
        let serverResponce = await taskService.createNewTask(
                                                    {
                                                        name:name,
                                                        assigner:assigner,
                                                        ballance:ballance,
                                                        due_date:due_date,
                                                        description:description,
                                                        status:status,
                                                        requires_verification:requires_verification,
                                                        assignedTeam:assignedTeam,
                                                        assignedUser:assignedUser,
                                                        account:account,
                                                        sub_account:sub_account
                                                    }
                                                ).then(data => data);
        if (serverResponce.status === 201){
            alert("task created");
            props.refreshTasks()
            cancelNewTask();
        } else if (serverResponce.response.status === 403){
            alert(`Insuficient funds.\nPlease adjust allocation`)
        } else {
            console.log(serverResponce.response)
            alert(`failed to create task\nstatus: ${serverResponce.response.status}`)
        }
    }
 
    return ( // the return method holds the jsx that controls rendering of the component
        <>
            {editor === false // if edit mode is not active render the create task button
                ?
                    <>
                        <Button name="editor" onClick={toggleEditor}>
                            Create Task
                        </Button>
                    </>
                : // if the edit mode is active render the editor
                    <>
                        <h1>New Task</h1>
                        <input
                            type="text"
                            name="name"
                            placeholder="task name"
                            onChange={handleNameChange}
                            value={name}
                        />
                        <label>Due by:</label>
                        <input
                            type="date"
                            name="due_date"
                            onChange={handleDueDateChange}
                            value={due_date}
                        />
                        <input
                            type="text"
                            name="description"
                            placeholder="description of task"
                            onChange={handleDiscriptionChange}
                            value={description}
                        />
                        <input
                            type="checkbox"
                            name="requires_verification"
                            onChange={handleRequiresVerificationToggle}
                            value={requires_verification}
                        />
                        <label>
                            Require manager Signoff
                        </label>
                        <select
                            name="assignedTeam"
                            onChange={handleTeamAssignment}
                            value={assignedTeam}
                        >
                            <option>-</option>
                            {teams.map( (team) =>
                                <option key={team.id} value={team.id}>{team.name}</option>
                            )}
                        </select>
                        <select
                            name="assignedUser"
                            onChange={handleUserAssignment}
                            value={assignedUser}
                        >
                            <option>-</option>
                            {users.map( (user) =>
                                <option value={user.id} key={user.id}>{user.name}</option>
                            )}
                        </select>
                        Assign Funds
                        <input
                            type="number"
                            name="ballance"
                            min="0"
                            step='.01'
                            onChange={handleBallanceChange}
                            value={ballance}
                        />
                        {ballance > 0
                            ?//if there are funds appllied ask for account info
                            <>
                                <select
                                    name="account"
                                    onChange={handleAccountChange}
                                    value={account}
                                    placeholder="Accounts"
                                >
                                    <option value='-'>-</option>
                                    {accounts.map( (account) =>
                                        <option key={account.id} value={account.id}>{account.name}</option>
                                    )}
                                </select>
                                <select
                                    name="sub_account"
                                    onChange={handleSubAccountChange}
                                    value={sub_account}
                                    placeholder="Sub Accounts"
                                >
                                    <option value='-'>-</option>
                                    {subAccounts.map( (account) =>
                                        <option key={account.id} value={account.id}>{account.name}</option>
                                    )}
                                </select>
                                
                            </>
                            ://if no funds avalible do not render account info
                            <></>
                        }

                        <Button name="submitTask" onClick={submitNewTask}>
                            Submit Task
                        </Button>
                        <Button name="clear" onClick={clearTask}>
                            Clear
                        </Button>
                        <Button name="cancel" onClick={cancelNewTask}>
                            Cancel
                        </Button>
                    </>
            }
            <br/>
        </>
    )

}

export default NewTask;