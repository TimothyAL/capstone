import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { propTypes } from "react-bootstrap/esm/Image";

import UserService from "../../services/UserService";

const userService = new UserService();

const NewUser = (props) => {
    // this component allows a manager to add a new user to the system
    const [editor, setEditor] =useState(false)

    const blankUser = { // template new user
        userName: '',
        name: '',
        email: '',
        phone: '',
        role: 'standard'
    }

    const [newUser, setNewUser] = useState(blankUser) // preload new user with template

    const toggleNewUserInterface = () => { // toggle editor
        setEditor(!editor)
    };

    const clearNewUser = () => { // reset component to template user
        setNewUser(blankUser)
    }

    const submitNewUser = async() => {
        //this method will be used to submit the new user to the user service   
        const password = userService.createPassword();
        if (newUser.name.length < 1){
            alert('please enter a name for the new user')
            return
        }
        if (newUser.userName.length < 1){
            alert('please enter a username for the new user')
            return
        }
        const serverResponce = await userService.submitNewUser(newUser, password);
        if (serverResponce.status === 201){
            alert(`username: ${newUser.userName} password: ${password}`);
            clearNewUser();
            toggleNewUserInterface();
            props.newUser()
        }else if(serverResponce.response.status === 409){
            alert(`username ${newUser.userName} is already in use please try again with a unique username`)
        }else {
            console.log(serverResponce.response)
            alert(`failed to create new user\n status code: ${serverResponce.response.status}`)
        }
        
    };


    return ( // the return method contains the jsx that will be used to control the rendering of the component
        <>
            {editor === false // if editor mode turned off only render the new user button
                ?
                    <Button id="newUserButton" onClick={toggleNewUserInterface}>New User</Button>
                : // if new user mode true render new user editor editor
                    <div id='newUserForm'>
                        <h1>New User</h1>
                        <input
                            type="text"
                            placeholder='Name'
                            name="name"
                            onChange={(e) => setNewUser({...newUser, [e.target.name]: e.target.value})}
                        />
                        <input
                            type="text"
                            placeholder="User Name"
                            name="userName"
                            onChange={(e) => setNewUser({...newUser, [e.target.name]: e.target.value})}
                        />
                        <input
                            type="text"
                            placeholder="email"
                            name="email"
                            onChange={(e) => setNewUser({...newUser, [e.target.name]: e.target.value})}
                        />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            name="phonehone"
                            onChange={(e) => setNewUser({...newUser, [e.target.name]: e.target.value})}
                        />
                        <select name="role" defaultValue="standard" onChange={(e) => setNewUser({...newUser, [e.target.name]: e.target.value})}>
                            <option value='inactive'>Inactive</option>
                            <option value='standard'>Standard</option>
                            <option value='supervisor'>Supervisor</option>
                        </select>
                        <Button
                            class="btn btn-primary"
                            name="submitUser"
                            onClick={submitNewUser}
                            >Submit</Button>
                        <Button
                            class="btn btn-primary"
                            name="clearNewUser"
                            onClick={clearNewUser}
                            >Clear</Button>
                        <Button
                            class="btn btn-primary"
                            name="closeNewUserInterface"
                            onClick={toggleNewUserInterface}
                            >Cancel</Button>
                    </div>
            }
            
            <br/>
        </>
    )
}


export default NewUser;