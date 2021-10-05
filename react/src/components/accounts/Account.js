import { Button, Container, Col, Row } from "react-bootstrap";
import { useState, useEffect } from "react";

import AccountService from "../../services/AccountService";
import UserService from "../../services/UserService";
import Transaction from "./Transaction";
import SubAccount from "./SubAccount";
import NewSubAccount from "./NewSubAccount";

const accountService = new AccountService();

const Account = (props) => {
    const [edits, setEdits] = useState(props.account);
    const edit = (e) => {
        setEdits({...edits, [e.target.name]: e.target.value})
    };

    const getSubAccounts = async() => { // get a list of all sub account objects associated with this account
        let serverResponse = await accountService.getSubAccounts(props.account.id);
        if (serverResponse.status === 200) {
            setSubAccounts(serverResponse.data);
            return
        }else{
            alert(`failed to retreve sub accounts\nServer responded with ${serverResponse.message}`);
            console.log(serverResponse)
            return
        }
    }

    const getTransacitons = async() => { // get a list of all allocation objects associated with this account
        let serverResponse = await accountService.getAccountTransactions(props.account.id);
        if (serverResponse.status === 200) {
            setTransactions(serverResponse.data);
        } else{
            alert(`could not get account transactions\nServer responded: ${serverResponse.status}`)
            console.log(serverResponse)
        }
    }

    const resetEdits = () => { // discard changes made it edit mode
        setEdits(props.account);
    };
    
    const submitEdits = async() => { // submit edits to the server
        let serverResponse = await accountService.updateAccount(edits);
        if (serverResponse.status === 202) {
            alert("updates recorded")
            toggleEditor();
            props.refreshAccounts()
        }else{
            alert(`failed to update account\nServer responded with ${serverResponse.status}`);
            console.log(serverResponse.message);
        };
    };

    // the state object and toggle function to flip display of the transfer menue
    const [transferMenue, setTransferMenue] =useState(false)
    const toggleTransferMenue = () => {
        setTransferMenue(!transferMenue)
    }

    // the state object and setter function for the transfer amount var used to change the ballance of an account
    const [transferAmmount, setTransferAmmount] = useState(0)
    const handleTransfer = (e) => {
        setTransferAmmount(parseFloat(e.target.value))
    }

    const transferFundsIn = async(e) => { // submits a ballance increase to the server
        let serverResponce = await accountService.updateAccount({...edits, 'add_funds': transferAmmount})
        if (serverResponce.status === 202) {
            alert('updates recorded')
            toggleTransferMenue()
            toggleEditor()
            props.refreshAccounts()
        }else {
            alert(`failed to record changes server responded with ${serverResponce.responce.status}`)
        }
    }


    const transferFundsOut = async(e) => { // subbmits a ballance decrease to the server
        if (transferAmmount > (props.account.ballance - props.account.allocated)){
            alert(`$${transferAmmount} is more then what is avalible in the account`)
            return;
        }
        let serverResponce = await accountService.updateAccount({...edits, 'subtract_funds': transferAmmount})
        if (serverResponce.status === 202) {
            alert('updates recorded')
            toggleTransferMenue()
            toggleEditor()
            props.refreshAccounts()
        }else{
            alert(`failed to record changes server responded with ${serverResponce.responce.status}`)
        }
    }

    const cancelEdits = () => { // resets editor values and closes the editor
        resetEdits();
        toggleEditor();
    };


    // the state object and toggle function to open and close the editor
    const [editor, setEditor] = useState(false);
    const toggleEditor = () => {
        setEditor(!editor);
    };


    // the state object and toggle function to open and close the view details menue
    const [viewDetails, setViewDetails] = useState(false);
    const toggleDetails = () => {
        setViewDetails(!viewDetails);
    };

    const [subAccounts, setSubAccounts] = useState([]); // a list of the sub accounts associated with this acocunt
    
    // the state object and toggle function to view sub accounts 
    const [viewSubAccounts, setViewSubAccounts] = useState(false);
    const toggleViewSubAccounts = async() => {
        setViewSubAccounts(!viewSubAccounts);
        await getSubAccounts() // this function updates the list of sub accounts whenever the toggle is flipped
    };

    const fetchSubAccounts = async() => { // calls the sub account update as well as refresh accounts in the parrent component
        props.refreshAccounts()
        await getSubAccounts()
    }

    const [transactions, setTransactions] = useState(props.account.transactions); // the list of transactions associated with the account
    
    // the state object and toggle function to view transactions
    const [viewTransactions, setViewTransactions] = useState(false);
    const toggleViewTransactions = () => {
        getTransacitons() // calling the toggle funcation also refreshes the list of transactions
        setViewTransactions(!viewTransactions);
    }

    useEffect(() => { // on the first load of the component get sub accounts
        async function loadAccounts() {
            await getSubAccounts();
        }
        loadAccounts()
    }, []); // the dependancy array is set to an empty list so this will only run on the first render

    useEffect(() => { // on the first load of the component get transactions
        async function loadTransactions(){
            await getTransacitons();
        }
        loadTransactions()
    }, []); // the dependancy array is set to an empty list so this will only run on the first render

    return ( // the render function contains the jsx for the account object
        <div className="account box Anchor">
            {editor === false // if the editor state object is false show the regular menu
                ?
                    <>
                        <div onClick={toggleDetails} className="account Header">
                                <b>{props.account.name}</b> {' '}
                                Ballance: ${props.account.ballance} {' '}
                                Allocated: ${props.account.allocated} {' '}
                                Avalible: ${props.account.ballance - props.account.allocated}
                        </div>
                        {viewDetails === true // if view details is true show the expanded component
                            ?
                                <div className='Anchor account'>
                                    For information contact: {props.account.owner_info.name} {' '}
                                    <Button size='sm' variant="secondary" onClick={toggleEditor}>Edit Account</Button><br/>
                                    {viewTransactions === true // if view transactions is true show the transacitons sub menue
                                        ?
                                            <div className='account bottom-pad'>
                                                <div className="account Header">Transactions</div>
                                                <Container>
                                                    <Row className="bottom-line">
                                                        <Col>
                                                            Memo
                                                        </Col>
                                                        <Col>
                                                            Ballance Avalible
                                                        </Col>
                                                        <Col>
                                                            Ammount Spent
                                                        </Col>
                                                        <Col>
                                                            Transaction Pending?
                                                        </Col>
                                                    </Row>
                                                    {transactions.map(transaction => 
                                                        <Transaction transaction={transaction} key={transaction.id}/>
                                                    )}
                                                </Container>
                                                <div className='account right'>
                                                    <Button size='sm' variant="secondary" onClick={toggleViewTransactions}>Hide Transactions</Button>
                                                </div>
                                            </div>
                                        : // if view transactions is false render the view transactions button
                                            <div className='account bottom-pad'>
                                                <Button size='sm' variant="secondary" onClick={toggleViewTransactions}>View Transactions</Button>
                                                <br/>
                                            </div>
                                    }
                                    {viewSubAccounts === true
                                        ? // if view sub accounts is true render the accounts sub menue
                                            <div className="account bottom-pad">
                                                <div className="Header account">Sub-Accounts</div>
                                                {subAccounts.map((subAccount) =>
                                                    <SubAccount subAccount={subAccount} account={props.account} refreshSubAccounts={fetchSubAccounts} key={subAccount.id} user={props.user}/>
                                                )
                                                }
                                                <NewSubAccount account={props.account} refreshSubAccounts={fetchSubAccounts} creator={props.user}/><br/>
                                                <Button size='sm' variant="secondary" onClick={toggleViewSubAccounts}>Hide Sub Accounts</Button>
                                            </div>
                                        : // if view sub accounts is false render the view sub accounts button
                                        <div className='bottom-pad account'>
                                            <Button size='sm' variant="secondary" onClick={toggleViewSubAccounts}>View Sub Accounts</Button>
                                        </div>
                                    }

                                </div>
                            : // if view details is false do not render the expanded component
                                <></>
                        }
                    </>
                : // if editor is true show the editor menue instead of the normal component
                <>
                    <input
                        type="text"
                        value={edits.name}
                        onChange={edit}
                    />
                    <input
                        type="number"
                        name="ballance"
                        value={props.account.ballance}
                        readOnly
                        className="read-only"
                        step=".01"
                    />
                    {transferMenue ?
                        <>
                            <input
                                type="number"
                                min="0"
                                step=".01"
                                name="transfer"
                                onChange={handleTransfer}
                            />
                            <Button size='sm' variant="secondary" onClick={transferFundsIn}>Deposit</Button>
                            <Button size='sm' variant="secondary" onClick={transferFundsOut}>Withdraw</Button>
                        </>
                    :<Button size='sm' variant="dark" onClick={toggleTransferMenue}>Edit Funds</Button>}
                    <Button size='sm' variant="dark" onClick={submitEdits}>Submit Changes</Button>
                    <Button size='sm' variant="secondary" onClick={resetEdits}>Reset Edits</Button>
                    <Button size='sm' variant="secondary" onClick={cancelEdits}>Cancel</Button>
                </>
            }
        </div>
    )
}

export default Account;