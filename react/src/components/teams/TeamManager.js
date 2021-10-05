import { Button } from "react-bootstrap";
import {useState, useEffect} from "react";

import TeamService from "../../services/TeamService";
import UserService from "../../services/UserService";
import TeamMember from "./TeamMember";

const TeamManager = (props) => {
    const teamService = new TeamService();
    const userService = new UserService();
    const [teams, setManagerTeams] = useState([]);
    const [userTeams, setUserTeams] = useState(props.teams)

    useEffect(() => { //on initial load get list of teams then mark the ones the user is part of
        async function setTeams() {
            let teamsList = []
            let serverResponce = await teamService.getAllTeams(); // retreves teams from server
            if (serverResponce.status === 200) {
                teamsList = serverResponce.data;
            }else{
                alert(`Failed to retreve teams from the server\nServer responded with ${serverResponce.status}`);
                console.log(serverResponce);
                return;
            }
            for(let i=0; i < teamsList.length; i++){ // if user in team replace with the team with the local copy and mark as member
                let match = false;
                for(let y=0; y < userTeams.length; y++){
                    if (teamsList[i].id === userTeams[y].id){
                        teamsList[i] = userTeams[y]
                        match = true;
                        break;
                    }
                }
                if (match === false) {
                    teamsList[i].status = 'inactive'
                }else{
                    teamsList[i].status = 'member'
                }
            }
            setManagerTeams(teamsList)
        }
        setTeams();
    }, []) // dependancy array left empty so it will only run on initial render

    const setTeamMember = async(teamID, status) => { // handler for updateing team assignment, updates component and sends update to server
        let serverResponce = await userService.updateTeamAssignment(props.user.id, teamID, status);
        if (serverResponce.status === 200) {
            for(let i=0; i < teams.length; i++) {
                if (teams[i].id === teamID) {
                    let teamsCopy = teams
                    teamsCopy[i].memberStatus = status;
                    setManagerTeams(teamsCopy)
                    return true;
                }
            }
        }else{
            alert(`Failed to update member relationship ${serverResponce.status}`);
            console.log(serverResponce);
            return false;
        }
    }

    return( // return renders team member component map after calculating correct team status
        <div className="user Anchor box">
            {teams.map((team) =>
                <TeamMember key={team.id} team={team} user={props.user} statusChange={setTeamMember} />
            )}
        </div>
    )


}
export default TeamManager;