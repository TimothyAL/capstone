import { Button } from "react-bootstrap";
import { useState, useEffect } from "react";

import AccountService from "../../services/AccountService"
import UserService from "../../services/UserService";

const accountService = new AccountService();
const userService = new UserService();

const NewAccount = (props) => {
    const blankAccount = { // the template object for a blank new account
        name: "",
        discription: "",
        ballance: 0,
        owner: props.creator.id
    }

    const [state, setState] = useState({ // create the initial state from the template
        ...blankAccount,
        editor: false
    })
    const [users, setUsers] = useState([]) // a list of all users so set the owner of the new account
    useEffect(() => { // on first render get a list of all users from the server
        async function getUsers() {
            let serverResponse = await userService.getUsers();
            if (serverResponse.status === 200) {
                setUsers(serverResponse.data)
            }
        }
        getUsers();
    }, []) // the dependancy array is empty so that this useEffect will only run on the first render of the component



    const handleChange = (e) => { // the basic change function to set the account state
        setState({...state, [e.target.name]: e.target.value})
    }

    const setEditor = () => { // toggles the view mode of the new account component
        setState({...state, editor: !state.editor})
    }

    const clearAccount = () => { // sets the new account back to a template
        setState({...state, ...blankAccount})
    }

    const resetComponent = () => { //resets the new accoutn back to the template and closes the editor
        setState({...state, ...blankAccount, editor: false})
    }

    const submitNewAccount = async() => { // submits the new account to the server
        const serverResponse = await accountService.createAccount(state)
        if (serverResponse.status === 201) {
            alert("account created");
            resetComponent(); // clears the account if the account is created
            props.refreshAccounts(); //causes the parrent component to refresh the account list
        }else {
            alert(`account creation failed with ${serverResponse.status}`)
        }
    }

    return ( // the return holds the jsx that controls rendering of the component
        <div className="">
            {state.editor === false // if the editor mode is false only render the new account button
                ?
                    <>
                        <Button
                            name="activateEditor"
                            onClick={setEditor}
                        >New Account</Button>
                    </>
                : // if editor is true render the enditor menue for the new account
                    <>
                        <input
                            type="text"
                            name="name"
                            placeholder="Account Name"
                            value={state.name}
                            onChange={handleChange}
                        />
                        <input
                            type="text"
                            name="discription"
                            placeholder="Discription"
                            value={state.discription}
                            onChange={handleChange}
                        />
                        <label htmlFor="ballance">Ballance:</label>
                        <input
                            type="number"
                            name="ballance"
                            min="0"
                            step=".01"
                            value={state.ballance}
                            onChange={handleChange}
                        />
                        <label htmlFor="owner">Account Owner: </label>
                        <select
                            name="owner"
                            value={state.owner}
                            onChange={handleChange}
                        >
                            {users.map((user) =>
                                <option key={user.id} value={user.id}>{user.name}</option>
                            )}
                        </select>
                        <Button size='sm' variant="dark"
                            name="submitAccount"
                            onClick={submitNewAccount}
                        >Submit</Button>
                        <Button size='sm' variant="secondary"
                            name="clearEdits"
                            onClick={clearAccount}
                        >Clear</Button>
                        <Button size='sm' variant="secondary"
                            name="cancelNewAccount"
                            onClick={resetComponent}
                        >Cancel</Button>
                    </>
            }
        </div>
    )
}

export default NewAccount;