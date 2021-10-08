import {useState} from 'react';
import { Button } from 'react-bootstrap';

import { taskFilterActions } from '../store/TaskReducer';

const TaskFilter = (props) => { // the filter component is used to set the global filters
    // state object and toggle for the task filter
    const [taskVisible, toggleTaskVisible] = useState(false)
    const setTaskVisible = () => {
        toggleTaskVisible(!taskVisible)
    }
    const handleTaskFilter = (e) => { // handler for task filter set
        props.taskFilterReducer({type:taskFilterActions.UPDATE, action:{[e.target.name]:!props.taskFilter.viewedStatuses[e.target.name]}})
    }
    const resetTaskFilter = () => { // reset task filter to default
        props.taskFilterReducer({type:taskFilterActions.RESET})
    }

    // state object and toggle for team filter
    const [teamVisible, toggleTeamVisible] = useState(false)
    const setTeamVisible = () => {
        toggleTeamVisible(!teamVisible)
    }

    const handleTeamFilter = (e) => {// handler for team filter
        props.setTeamFilter(e.target.value)
    }

    // state object and toggle for user filter
    const [userVisible, toggleUserVisible] = useState(false)
    const setUserVisible = () => {
        toggleUserVisible(!userVisible)
    }

    const handleUserFilter = (e) => { // handler for user filter
        props.setUserFilter(e.target.value)
    }

    return ( // the return function holds the jsx that controls rendering for the component
        <div className='task-filter'>
            <div class='anchor' onClick={setTaskVisible}>Set Task Filter</div>
            {taskVisible ?  // if task visible render the task filter controler
                <ul class="items">
                    <li><Button onClick={resetTaskFilter}
                        >Reset Task Filter
                        </Button>
                    </li>
                    <li><input type="checkbox" name="created"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['created']}
                        />Created
                    </li>
                    <li><input type="checkbox" name="assigned"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['assigned']}
                        />Assigned
                    </li>
                    <li><input type="checkbox" name="viewed"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['viewed']}
                        />Viewed
                    </li>
                    <li><input type="checkbox" name="in_progress"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['in_progress']}
                        />In Progress
                    </li>
                    <li><input type="checkbox" name="on_hold"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['on_hold']}
                        />On Hold
                    </li>
                    <li><input type="checkbox" name="submited"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['submited']}
                        />Submited
                    </li>
                    <li><input type="checkbox" name="regected"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['regected']}
                        />Regected
                    </li>
                    <li><input type="checkbox" name="verified"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['verified']}
                        />Verified
                    </li>
                    <li><input type="checkbox" name="completed"
                            onChange={handleTaskFilter}
                            checked={props.taskFilter.viewedStatuses['completed']}
                        />Completed
                    </li>
                </ul>
            : // if view task filter false do not render controls
                <></>}
            <div class='anchor' onClick={setTeamVisible}>Set Team Filter</div>
            {teamVisible ? // it team visable true render the team filter control
                <input
                    type="text"
                    value={props.teamFilter}
                    onChange={handleTeamFilter}
                />
            : // if team visible false do not render the control
                <></>
            }
            <div class='anchor' onClick={setUserVisible}>Set User Filter</div>
            {userVisible ? // if uservisible true render the user filter controler
                <input
                    type="text"
                    value={props.userFilter}
                    onChange={handleUserFilter}
                />
            : // if user visible false do not render the controler
                <></>
            }
        </div>
    )
}
export default TaskFilter;