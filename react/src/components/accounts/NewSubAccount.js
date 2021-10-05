import { Button } from "react-bootstrap";
import { useState, useEffect } from "react";


import UserService from "../../services/UserService";
import AccountService from "../../services/AccountService";

const accountService = new AccountService();
const userService = new UserService();

const NewSubAccount = (props) => {
    const blankSubAccount = { // the template for a new sub account
        name: "",
        discription: "",
        ballance: 0,
    }

    const [state, setState] = useState({ // set the inital state of the new sub account object
        ...blankSubAccount,
        owner: props.creator.id,
        main_account: props.account.id
    });
    const [editor, setEditor] = useState(false);
    const [users, setUsers] = useState([]);
    


    const toggleEditor = () => { // the function that toggles the state of the editor mode
        setEditor(!editor);
    };

    const edit = (e) => { // the handler for the new account if the edit is for the ballance to transfer validates that there are enough funds to transfer into the new account
        if (e.target.name === 'ballance' && e.target.value > (props.account.ballance - props.account.allocated)){
            alert('Not enough funds to transfer');
            setState({...state, ballance:(props.account.ballance - props.account.allocated)})
            return;
        }
        setState({...state, [e.target.name]: e.target.value});
    };

    useEffect(()=> { // get a list of all users to set the owner of the new sub account
        async function getUsers() {
            let serverResponse = await userService.getUsers();
            if (serverResponse.status === 200) {
                setUsers(serverResponse.data);
            };
        };
        getUsers();
    }, []); // the dependancy array is empty so this function only runs on the first render of the component


    const clearSubAccount = () => { // reset the state of the new account to a blank sub account
        setState({...state,...blankSubAccount});
    };

    const submitNewSubAccount = async() => { // submit the new sub account to the server
        let serverResponse = await accountService.createSubAccount(state)
        if (serverResponse.status === 201) {
            props.refreshSubAccounts()
            alert("sub account Created")
            cancelNewSubAccount();
        } else {
            alert(`sub account creation failed with ${serverResponse.status}`);
            console.log(serverResponse);
        }
    }

    const cancelNewSubAccount = () => { // reset the new sub account and close the editor
        setState({...state,...blankSubAccount});
        toggleEditor();
    }

    return ( // the return contains the jsx to control the rendering of the component
        <>
            {editor === false // if editor is false only render the toggle editor button
                ?
                    <>
                        <Button size='sm' variant="primary"
                            name="activateEditor"
                            onClick={setEditor}
                        >New Sub-Account</Button>
                    </>
                : // if editor mode is true render the full component
                    <>
                        <input
                            type="text"
                            name="name"
                            placeholder="SubAccount Name"
                            value={state.name}
                            onChange={edit}
                        />
                        <input
                            type="text"
                            name="discription"
                            placeholder="description"
                            value={state.discription}
                            onChange={edit}
                        />
                        <label>transfer in:</label>
                        <input
                            type="number"
                            name="ballance"
                            step=".01"
                            min="0"
                            max={props.account.ballance - props.account.allocated}
                            value={state.ballance}
                            onChange={edit}
                        />
                        <select
                            name="owner"
                            value={state.owner}
                            onChange={edit}
                        >
                            {users.map((user) =>
                                <option key={user.id} value={user.id}>{user.name}</option>
                            )}
                        </select>
                        <Button size='sm' variant="dark"
                            name="submitAccount"
                            onClick={submitNewSubAccount}
                        >Submit</Button>
                        <Button size='sm' variant="secondary"
                            name="clearEdits"
                            onClick={clearSubAccount}
                        >Clear</Button>
                        <Button size='sm' variant="secondary"
                            name="cancelNewAccount"
                            onClick={cancelNewSubAccount}
                        >Cancel</Button>
                    </>
            }
        </>


    )


}
export default NewSubAccount;