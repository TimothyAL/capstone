const {default: axios } = require('axios')

class TeamService {
    getTeam = async (teamID) => {
        return await axios.get(`/api/teams/${teamID}`).then(data => data)
    }

    getMyTeams = async () => {
        return await axios.get(`/api/teams/me/`)
    }

    getAllTeams = async () => {
        return await axios.get(`/api/teams/`).then(data => data)
    }

    updateTeam = async (team) => {
        try{
            return await axios.patch(`/api/teams/${team.id}`, team).then(data => data)
        }catch(error) {return error}
    }

    createTeam = async (team) => {
        try{
            return await axios.post(`/api/teams/`, JSON.stringify({
                name:team.name,
                owner:team.owner,
                description:team.description
            }))
        } catch(error){return error}
    }

    getTeamMembers = async (teamID) => {
        try{
            return await axios.get(`/api/teams/${teamID}/members`)
        }catch(error) {return error}
    }

    assignMember = async (teamID, userID, status) => {
        return await axios.post(`/api/teams/${teamID}`,
            {member: userID,
             status: status}).then(data => data)
    }

    updateMember = async (teamID, userID, status) => {
        return await axios.patch(`/api/teams/${teamID}`,
            {member: userID,
             status: status}).then(data => data)
    }
}
export default TeamService;