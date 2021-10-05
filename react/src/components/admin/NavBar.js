import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import UserService from "../../services/UserService";
import { Container, Row, Col, Button } from 'react-bootstrap';
import './admin.css';
import { userActions } from "../../store/UserReducer";
import { taskFilterActions } from "../../store/TaskReducer";
import TaskFilter from "../TaskFilter";

const axios = require("axios").default;
const userService = new UserService();


const NavBar = (props) => {
    // The login component handles submiting user info to the server for authorization
    // If valid credentials are submited it retreves an auth token and stores it in state
    // and to session storage
    const history = useHistory();
    const [localUserName, setLocalUserName] = useState("")
    const [localPassord, setLocalPassword] = useState("")
    
    const logout = async() => { // send a request to logout then clear all credentials localy
        await axios.get('/api/users/logout')
        axios.defaults.headers.common['Authorization'] = ``;
        localStorage.clear();
        clearTimeout()
        props.userDispatch({type: userActions.UN_SET})
        history.push("/") 
    }

    const handleKeyDown = (e) => {
        //this method submits the login form if a user presses enter
        if (e.key === 'Enter') {
            login(); //if a key is pressed with the nav bar in focus and the key is the enter key run login
        }


    }

    const refresh = async() => { // refresh the user credentials
        try {
            const serverResponce = await axios.get(`/api/users/refresh`);
            axios.defaults.headers.common['Authorization'] = `Bearer ${serverResponce.data.token}`;
            props.userDispatch({type: userActions.SET, user:serverResponce.data.user})
            setTimeout(refresh, 27000);
        } catch (error) {
            logout();
        }
    }

    const login = async() => {
        // this function gets an auth token from the server
        try {
            let serverResponce = await userService.login(localUserName, localPassord);
            console.log(serverResponce)
            if (serverResponce.status ===203) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${serverResponce.data.token}`;
                props.userDispatch({type: userActions.SET, user:serverResponce.data.user});
                localStorage.setItem("session", JSON.stringify(serverResponce.data));
                setTimeout(refresh, 27000)  
                return;              
            }else if (serverResponce.response.status > 499) {
                    alert(`server problem please wait a moment then try again`)
                    return;
                }
            alert('Bad User name or Password');
            return;
        } catch (error) {
            console.log(error)
            alert(`error in login ${error}`)
        }
    }

        return ( // the return method holds the jsx that controls the rendering of the component
            <div className='NavBar'>
                {props.userState.id > 0 ? // if there is a logged in user render the loged in version of the nav bar
                <>
                    <div className='logout'>
                        <h3 className="banner">Task&Account Management System</h3>
                        <Container>
                            <Row>
                                <Col>
                                    <Link to='/dashboard'
                                        class="btn btn-secondary"
                                        name="linkToDashboard"
                                        >Dashboard</Link>
                                </Col>
                                {['admin', 'manager', 'supervisor'].includes(props.userState.role) // if the logged in user is an enhansed user render the profile menue
                                    ?
                                        <>
                                            <Col>
                                                <Link to="/profile"
                                                    class="btn btn-secondary"
                                                    name="editProfile"
                                                    >Profile</Link>
                                            </Col>
                                        </>
                                    : // if the user is a standard user no special rendering is needed
                                    <></>
                                }
                                <Col>
                                    <Container>
                                        <Row>
                                                {`Hello ${props.userState.name}`}
                                        </Row>
                                    </Container>
                                </Col>
                                <Col>
                                    <Button
                                        class="btn btn-primary"
                                        name="submitLogin"
                                        onClick={logout}
                                        >Logout</Button>
                                </Col>
                            </Row>
                        </Container>
                    </div>
                    <TaskFilter taskFilterReducer={props.taskFilterReducer}
                                taskFilter={props.taskFilter}
                                userFilter={props.userFilter}
                                setUserFilter={props.setUserFilter}
                                teamFilter={props.teamFilter}
                                setTeamFilter={props.setTeamFilter}
                    />
                </>
                : // if no user is loged in render the no user version of the nav bar
                    <div className='login'>
                        <Container fluid>
                            <Row>
                                <Col xs={7}>
                        <h2 className="banner">Task&Account Management System</h2>
                        </Col>
                        <Col className="justify-center-right">
                        <input
                            type="text"
                            name="userName"
                            placeholder="user name"
                            value= {localUserName}
                            onChange={(e) => setLocalUserName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e)}
                            />
                        <input
                            type="password"
                            name="password"
                            placeholder="password"
                            value={localPassord}
                            onChange={(e) => setLocalPassword(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e)}
                            />
                        <button
                            class="btn btn-primary"
                            name="submitLogin"
                            onClick={login}
                            >Submit</button>
                            </Col>
                            </Row>
                        </Container>
                    </div>
                }
            </div>
        );

}

export default NavBar;