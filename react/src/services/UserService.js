const {default: axios } = require('axios')

class UserService {

    login = async (username, password) => {
        try {
            return await axios.post("/api/users/login", JSON.stringify({
                username: username,
                password: password
            }));
        } catch(error) {return error}
    }

    createPassword = () => {
        let pwd = "";
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let charsLengh = characters.length;
        for(let i = 0; i < 10; i++){
            pwd += characters.charAt(Math.floor(Math.random() * charsLengh))
        }
        return pwd
    }

    submitNewUser = async (newUser, password) => {
        try {
            return await axios.post("/api/users/", JSON.stringify({
                username:newUser.userName,
                name:newUser.name,
                email:newUser.email,
                phone:newUser.phone,
                role:newUser.role,
                password:password
            }))
        } catch(error) {return error}
    }

    submitUserUpdates = async (user) => {
        return await axios.patch(`/api/users/${user.id}`, JSON.stringify({
            name: user.name,
            username: user.username,
            phone: user.phone,
            role: user.role,
            email: user.email    
        }))
    }

    resetPassword = async (id) => {
        let pwd = this.createPassword();
        try{
            let response =  await axios.patch(`/api/users/${id}`, JSON.stringify({
            password: pwd}))
            return {response: response, password: pwd}
        }catch(error) {return error}
    }

    getUsers = async () => {
        return await axios.get("/api/users/")
    }

    updateSelf = async (user) => {
        return await axios.patch(`/api/users/`, user)
    }

    getUserTeams = async (userID) => {
        return await axios.get(`/api/users/${userID}/teams`)
    }

    updateTeamAssignment = async (userID, teamID, status) => {
        if(status==='member'){
            return await axios.post(`/api/users/${userID}/teams/${teamID}`,
                                    {team: teamID})
        }else if(status==='inactive'){
            return await axios.delete(`/api/users/${userID}/teams/${teamID}`)
        }
    }

    getUser = async (userID) => {
        return await axios.get(`/api/users/${userID}`)
    }

    updateUser = async (user) => {
        try{
            return await axios.patch(`/api/users/${user.id}`, user)
        }catch(error) {return error}
    }

    getOwnTeams = async () => {
        return await axios.get(`/api/users/myteams`)
    }

}

export default UserService;