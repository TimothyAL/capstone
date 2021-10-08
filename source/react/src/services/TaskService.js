const {default: axios } = require('axios')

class TaskService {

    getTasks = async () => {
        try{
            return await axios.get(`/api/tasks/`).then(data => data)
        }catch(error){return error}
    }

    getUsersTasks = async (userID) => {
        return await axios.get(`/api/tasks/user/${userID}`).then(data => data)
    }

    createNewTask = async (taskInfo) => {
        try{
            return await axios.post(`/api/tasks/`, {...taskInfo}).then(data => data)
        }catch(error) {return error}
    }

    deleteTask = async (id) => {
        try{
            return await axios.delete(`/api/tasks/${id}`)
        }catch(error) {return error}
    }

    getTeamTasks = async (teamID) => {
        try{
            return await axios.get(`/api/tasks/team/${teamID}`).then(data => data)
        }catch(error) {return error}
    }

    createTeamTask = async (task, teamID) => {
        return await axios.post(`/api/tasks/${teamID}`, task)
    }

    getUserTasks = async (userId) => {
        try{
            return await axios.get(`/api/tasks/user/${userId}`).then(data => data)
        }catch(error){return error}
    }

    getTask = async (taskID) => {
        return await axios.get(`/api/tasks/${taskID}`).then(data => data)
    }

    updateTask = async (task) => {
        return await axios.patch(`/api/tasks/${task.id}`, task).then(data => data)
    }

    attachNote = async (taskID, note) => {
        return await axios.post(`/api/tasks/${taskID}`, note).then(data => data)
    }

    deleteNote = async (taskID) => {
        return await axios.delete(`/api/tasks/${taskID}`).then(data => data)
    }

    getTaskInfo = async (taskId) => {
        return await axios.get(`/api/tasks/note/${taskId}`).then(data => data)
    }

    getNotes = async (taskID) => {
        return await axios.get(`/api/tasks/note/${taskID}`).then(data => data)
    }

    editNote = async (taskID, note) => {
        return await axios.patch(`/api/tasks/note/${taskID}`, note).then(data => data)
    }

    assignTask = async (taskID, userID) => {
        return await axios.post(`/api/tasks/user/${userID}/assign/${taskID}`).then(data => data)
    }

    getTaskByStatus = async (status) => {
        return await axios.get(`/api/tasks/status/${status}`).then(data => data)
    }

    addNote = async (taskID, note, endStatus, image, recept) => {
        try{
            const formData = new FormData()
            if (image !== null && typeof image !== 'undefined'){formData.append('file', image, image.name)}
            formData.append('note', note)
            formData.append('end_status', endStatus)
            formData.append('recept', recept)
            return await axios.post(`/api/tasks/${taskID}`, formData)
        }catch(error){
            return error
        }
    }
}

export default TaskService;