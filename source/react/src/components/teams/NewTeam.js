import { Button } from "react-bootstrap";
import { useState, useEffect } from "react";

import TeamService from '../../services/TeamService'
import UserService from '../../services/UserService'

const teamService = new TeamService()
const userService = new UserService()



const NewTeam = (props) => {
    const [users, setUsers] = useState([])
    const [state, setState] = useState({ // instantiate blank state for new team
        name: '',
        description: '',
        owner: props.userState.id,
        editor: false
    })
    
    const blankTeam = { // template blank team
        name: '',
        description: '',
        owner: props.userState.id
}

    const handleChange = (e) => { // basic handler for new team
        setState({...state, [e.target.name]: e.target.value})
    }

    const setEditor = () => { // toggler for edit mode
        setState({...state, editor: !state.editor})
    }

    const clearTeam = () => { // reset team object
        setState({...state, ...blankTeam})
    }

    const resetComponent = () => { // reset team and set editor false
        setState({...state, ...blankTeam, editor: false})
    }

    const getUsers = async() => { // load users from server 
        let serverResponse = await userService.getUsers();
        if (serverResponse.status === 200) {
            setUsers(serverResponse.data)
        }else{
            alert(`failed to retreve users\nStatus: ${serverResponse.status}`)
        }
    }

    const submitNewTeam = async() => { // submit new team to the server
        const serverResponse = await teamService.createTeam(state)
        if ( serverResponse.status === 201) {
            alert("team created")
            props.refreshTeams()
            resetComponent();
        }else{
            console.log(serverResponse.response)
            alert(`creation failed status: ${serverResponse.response.status}`)
        }
    } 

    useEffect(() => { // load users from server on initial render
        async function loadUsers(){
            getUsers(); }
        loadUsers();
    }, []); // dependancy array is left empty so the function only runs on initial render

    return ( // the return function holds the jsx that controls rendering of the component
        <>
            {state.editor === false
                ? // if edit modde is false only display the new team button
                <>
                    <Button
                        name="activateEditor"
                        onClick={setEditor}
                    >New Team</Button>
                </>
                : // if editor is true render the expanded component
                <>
                    <input
                        type="text"
                        name="name"
                        placeholder="Team Name"
                        value={state.name}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={state.description}
                        onChange={handleChange}
                    />
                    <select
                        name="owner"
                        value={state.owner}
                        onChange={handleChange}
                    >
                        {users.map((user, index) => 
                            <option value={user.id} key={index}>{user.name}</option>
                        )}
                    </select>
                    <Button
                        name="submitTeam"
                        onClick={submitNewTeam}
                    >Submit</Button>
                    <Button
                        name="clear"
                        onClick={clearTeam}
                    >Clear</Button>
                    <Button
                        name="reset"
                        onClick={resetComponent}
                    >Cancel</Button>
                </>
            }
            <br/>  
        </>
    )
}
export default NewTeam;