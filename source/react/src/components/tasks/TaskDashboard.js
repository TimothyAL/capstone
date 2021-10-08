import { useState, useEffect } from 'react';

import TaskService from '../../services/TaskService';
import Task from './Task';
import NewTask from './NewTask';

const TaskDashboard = (props) => {
    const taskService = new TaskService()
    const [tasks, setTasks] = useState([])
    const [viewTasks, setViewTasks] = useState(false)
    
    const getTasks = async() => { // get all tasks from the server
        let serverResponce = await taskService.getTasks()
        if (serverResponce.status === 200){
            setTasks(serverResponce.data)
        } else{
            alert(`failed to load tasks\nServer responded with: ${serverResponce.response.status}`)
        }
    }

    const toggleViewTasks = () => { // view tasks toggle also refreshes the tasks
        getTasks()
        setViewTasks(!viewTasks)
    }

    useEffect(() => { // on initial load get tasks from server
        async function loadTasks(){
            await getTasks()
        }
        loadTasks()
    }, []) // dependancy array is left empty so the useEffect is only run on the first render

    const refreshTasks = async() => { // second calling funtion to get tasks meant to be passed to child components
        await getTasks()
        return true;
    }


    return ( // the return holds the jsx that handles rendering of the component
        <div className="Dashboard">
            <div className="Dashboard-Header" onClick={toggleViewTasks}>Tasks</div>
            {viewTasks ? // if view tasks is true display a mapping of the tasks list
                tasks.map((task) =>
                    <Task key={task.id}
                          task={task}
                          user={props.userState}
                          taskFilter={props.taskFilter}
                          refreshTasks={getTasks}
                    />
                )
            : // if view tasks is false render nothing
            <></>
            }
            <NewTask assigner={props.userState} refreshTasks={refreshTasks}/>
        </div>
    )
}
export default TaskDashboard