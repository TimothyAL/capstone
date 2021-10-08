import {useState, useEffect} from 'react';

const TeamMember = (props) => {
    const [team, setTeam] = useState(props.team); 
    const setStatusChange = (e) => { // set status change passes the even to the parrent component so the relationship can be updated
        let status = props.statusChange(props.team.id, e.target.value)
        if (status){
            setTeam({...team, status:e.target.value})
        }
    }

    useEffect(() => { // gets props from team and updates component any time the relation changes
        setTeam(props.team)
    }, [props.team])

    return(
        <div className="user">
            {team.name}{` `}
            <select
                onChange={setStatusChange}
                value={team.status}
            >
                <option value="inactive">-</option>
                <option value="member" >Member</option>
            </select>
            <br/>
        </div>
    )
}

export default TeamMember;