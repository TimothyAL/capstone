import {useState, useEffect } from "react";
import { Button } from "react-bootstrap";

import TeamService from "../../services/TeamService";
import NewTeam from "./NewTeam";
import Team from "./Team";


const TeamsDashboard = (props) => {
    const teamService = new TeamService();
    
    const [viewTeams, setViewTeams] = useState(false); // view teams toggle state object
    const getTeams = async() => { // retreves list of all teams from server
        let serverResponse = await teamService.getAllTeams();
        if (serverResponse.status === 200){
            setTeamsList(serverResponse.data);
        }else{
            alert(`Failed to import teams\nServer Responded with: ${serverResponse.status}`);
            console.log(serverResponse);
        }
    }

    // toggles view teams also updates teams list
    const toggleViewTeams = async() => {
        await getTeams()
        setViewTeams(!viewTeams);
    };



    // refresh teams function to be passed to child component. refreshes list of teams from server
    const refreshTeams = async() => {
        await getTeams()
    }

    const [teamsList, setTeamsList] = useState([])// teams list state object
    useEffect(() => { // on initial render get list of teams from server
        async function loadTeams() {
            await getTeams();
        }
        loadTeams()
    }, []) // dependancy array left empty so useEffect only runs on initial render


    return( // return holds jsx to control rendering of the component
        <div className="Dashboard">
            <div className="Dashboard-Header" onClick={toggleViewTeams}>Teams</div>
            {viewTeams ? // if view teams mode is false only render header if true render new teams component and map list of teams to team components
                <>
                    {teamsList.map((team) => 
                        <Team key={team.id} team={team}
                              userState={props.userState}
                              inbeded={0}
                              taskFilter={props.taskFilter}
                              userFilter={props.userFilter}
                              teamFilter={props.teamFilter}
                              refreshTeams={refreshTeams}
                        />
                    )}
                    <NewTeam userState={props.userState} userDispatch={props.userDispatch} refreshTeams={refreshTeams}/>
                </>
            : // if view teams is false render nothing but header
                <></>
            }
        </div>
    )
}
export default TeamsDashboard;