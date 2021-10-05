import React, { useReducer, useState } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import './App.css';
import Main from './components/Main';
import AdminDashboard from './components/dashboards/AdminDashboard';
import Profile from './components/admin/Profile';
import NoUser from './components/NoUser';
import { userReducer, initialUserState } from "./store/UserReducer";
import { taskReducer, initialTaskState } from "./store/TaskReducer";
import Dashboard from "./components/dashboards/Dashboard";

const axios = require("axios").default;
const url = process.env.REACT_APP_BACKEND
axios.defaults.baseURL = url;
axios.defaults.headers.post['Content-Type'] = "application/json";
axios.defaults.headers.put['Content-Type'] = "application/json";
axios.defaults.headers.patch['Content-Type'] = "application/json";

function App (props) {

  const [userState, userDispatch] = useReducer(userReducer, initialUserState);
  const [taskFilter, taskFilterReducer] = useReducer(taskReducer, initialTaskState);
  const [userFilter, setUserFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  return(
    <Router>
      <div className="App">
        {userState.user.id > 0 &&  userState.user.role !== 'inactive'?//check to see if a user is logged in
          <div className="main">
            <Switch>
              <Route exact path="/" render={props =><Main userState={userState.user}
                                                          userDispatch={userDispatch}
                                                          taskFilter={taskFilter}
                                                          taskFilterReducer={taskFilterReducer}
                                                          userFilter={userFilter}
                                                          setUserFilter={setUserFilter}
                                                          teamFilter={teamFilter}
                                                          setTeamFilter={setTeamFilter}
                                                    />} />
              <Route exact path="/profile" render={props =><Profile userState={userState.user}
                                                                    userDispatch={userDispatch}
                                                                    taskFilter={taskFilter}
                                                                    taskFilterReducer={taskFilterReducer}
                                                                    userFilter={userFilter}
                                                                    setUserFilter={setUserFilter}
                                                                    teamFilter={teamFilter}
                                                                    setTeamFilter={setTeamFilter}
                                                            />} />
                {userState.user.role === 'standard'? //check to see if the user is a standard user
                //if the user is an elivated user they get a management dashboard 
                //as well as access to the budgets module
                <div>
                  <Route exact path="/dashboard" render={props =><Dashboard userState={userState.user}
                                                                  user={userState.user}
                                                                  userDispatch={userDispatch}
                                                                  taskFilter={taskFilter}
                                                                  taskFilterReducer={taskFilterReducer}
                                                                  userFilter={userFilter}
                                                                  setUserFilter={setUserFilter}
                                                                  teamFilter={teamFilter}
                                                                  setTeamFilter={setTeamFilter}
                                                            />} />
                </div>
                :
                <div>
                  <Switch>
                    <Route exact path="/dashboard" render={props =><AdminDashboard userState={userState.user}
                                                                                   userDispatch={userDispatch}
                                                                                   taskFilter={taskFilter}
                                                                                   taskFilterReducer={taskFilterReducer}
                                                                                   userFilter={userFilter}
                                                                                   setUserFilter={setUserFilter}
                                                                                   teamFilter={teamFilter}
                                                                                   setTeamFilter={setTeamFilter}
                                                                    />} />
                  </Switch>
                </div>
                }
            </Switch>
          </div>  
        :
        <div>
          <Switch>
            <Route path="/" render={props =><NoUser userState={userState.user}
                                                    userDispatch={userDispatch}
                                                    taskFilter={taskFilter}
                                                    taskFilterReducer={taskFilterReducer}
                                                    userFilter={userFilter}
                                                    setUserFilter={setUserFilter}
                                                    teamFilter={teamFilter}
                                                    setTeamFilter={setTeamFilter}
                                              />} />
          </Switch>
        </div>
        }
      </div>
    </Router>
  )
}

export default App;
