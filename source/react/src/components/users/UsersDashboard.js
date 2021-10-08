import React, {useState, useEffect} from "react";

import UserService from "../../services/UserService";
import NewUser from "./NewUser";
import User from "./User"

const UsersDashboard = (props) => {
    const userService = new UserService();
    const [users, setUsers] = useState([]) // the list of users
    const [viewUsers, setViewUsers] = useState(false) // toggles view user mode

    const fetchUsers = async() => { // this function gets all the users from the server
        let serverResponse = await userService.getUsers();
        if (serverResponse.status === 200) {
            setUsers(serverResponse.data)
        }
    }
    
    const toggleViewUsers = async() => { // toggles view users mode and updates the list of users
        await fetchUsers()
        setViewUsers(!viewUsers);
    };

    useEffect(() => { // on initial component load pre populate the list of users
        async function loadUsers(){
            await fetchUsers()
        }
        loadUsers()
    }, []) // dependancy array is left empty so the useEffect is only run on the initial render

    const updateUser = async(user) => { // update user submits user update then refreshes the user list
        let serverResponce = await userService.updateUser(user);
        if(serverResponce.status === 200){
            fetchUsers();
            return true;
        }console.log(serverResponce.response)
        alert(`failed to update user\nServer returned: ${serverResponce.response.status}`)
        return false;
    }

    const newUser = async() => { // new user function is passed to child component and calls for a refresh when a new user is created
        await fetchUsers()
    }

    return ( // the return method holds the jsx that controls the rendering of the component
        <div className="Dashboard">
            <div className="Dashboard-Header" onClick={toggleViewUsers}>Users</div>
            {viewUsers ? // if view users is true map the list of users to the user component
                <>
                    {users.map( (targetUser) =>
                        <User userState={targetUser}
                                user={props.user}
                                updateUser={updateUser}
                                key={targetUser.id}
                                inbeded={0}
                                taskFilter={props.taskFilter}
                                userFilter={props.userFilter}
                                teamFilter={props.teamFilter}
                        />
                    )}
                    {props.user.role !== 'supervisor' ? // if the logged in user is not a supervisor allow them to create a new user
                        <NewUser userState={props.user} newUser={newUser} userDispatch={props.userDispatch}/>
                        : // if the logged in user is a supervisor do not render new user component
                        <></>
                    }
                </>
            : // if view users true only render the dashboard header
                <></>
            }
        </div>
    )
}

export default UsersDashboard;