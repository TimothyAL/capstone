import {useState, useEffect} from "react";

import AccountService from "../../services/AccountService";
import NewAccount from "./NewAccount";
import Account from "./Account";

const BudgetDashboard = (props) => {
    const accountService = new AccountService();

    const getAccounts = async() => { // load accounts from the server
        let serverResponse = await accountService.getAccounts();
        if (serverResponse.status === 200) {
            setAccounts(serverResponse.data)
        }else{
            alert(`could not retreve accounts.\nserver responded with: ${serverResponse.status}`)
        }
    }

    // the state component and toggle function for the budget dashboard
    const [viewAccounts, setViewAccounts] = useState(false)
    const toggleViewAccounts = async() => {
        await getAccounts() // on toggle refresh the accounts from the server
        setViewAccounts(!viewAccounts);
    };

    const [accounts, setAccounts] = useState([]); // the list of accounts
    useEffect(() => { // on the first load get all accounts from the server
        async function loadAccounts(){
            await getAccounts()
        }
        loadAccounts()
    }, []) // the dependancy array is an empty array so this useEffect will only run on the first render of the component


    return( // the return function contains the jsx that controls the rendering of the component
        <div className="Dashboard">
            <div className="Dashboard-Header" onClick={toggleViewAccounts}>Accounts</div>
            {viewAccounts // if view accounts is true render the list of accounts component
                ?
                    <>
                        {accounts.map((account)=>
                            <Account key={account.id} refreshAccounts={getAccounts} account={account} user={props.user} />
                        )}
                        <NewAccount creator={props.user} refreshAccounts={getAccounts}/>
                    </>
                : // if view accounts is false render nothing other then the header
                    <></> 
            }
        </div>
    )
}

export default BudgetDashboard;