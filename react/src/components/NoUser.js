import React from 'react';
import NavBar from './admin/NavBar';

const NoUser = (props) => { // this component is the root component for a user that isn't logged in
    return (
        <div className="Main">
            <NavBar {...props}/>
        </div>
    )
}

 
export default NoUser;