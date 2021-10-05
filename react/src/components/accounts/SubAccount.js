import { Button, Container, Col, Row } from "react-bootstrap";
import {useState, useEffect} from "react";

import AccountService from "../../services/AccountService";
import Transaction from "./Transaction";

const accountService = new AccountService();

const SubAccount = (props) => {
    // the state onject and toggle function that control the editor mode
    const [editor, setEditor] = useState(false);
    const toggleEditor = () => {
        setEditor(!editor);
    };

    const [edits, setEdits] = useState(props.subAccount); // the state object that contains the edits of the sub account
    const resetEdits = () => { // reset the editor to the initial state
        setEdits(props.subAccount);
    };

    const edit = (e) => { // the handler for changing the state of edits
        setEdits({...edits, [e.target.name]: e.target.value});
    };

    const submitEdits = async() => { // submit changes to the server
        let serverResponce = await accountService.updateSubAccount(edits)
        if (serverResponce.status === 201) {
            toggleEditor() // close edit mode
            props.refreshSubAccounts() // cause the parrent account to refresh the sub accounts

            alert("account updated");
        }else{
            alert("failed to update account");
        };
    };

    const cancelEdits = () => { // resets the edits to initial state and closes the editor
        resetEdits();
        toggleEditor();

    }


    // the state object and toggle function that controls showing expanded details
    const [viewDetails, setViewDetails] = useState(false);
    const toggleDetails = () => {
        setViewDetails(!viewDetails);
    };


    const [transactions, setTrancactions] = useState([]); // the list of transactions associated with the sub account

    // the state object and toggle function to control viewing sub account transactions
    const [viewTransactions, setViewTransactions] = useState(false)
    const toggleViewTransactions = () => {
        setViewTransactions(!viewTransactions);
    };
    

    useEffect(() => { // on first render get all the transactions associated with the sub account
        async function getTransactions() {
            let serverResponse = await accountService.getSubAccountTransactions(props.subAccount.id);
            if (serverResponse.status === 200) {
                setTrancactions(serverResponse.data);
            };
        };
        getTransactions();
    }, []); // the dependancy array is left empty so that the useEffect will only run dirring the first rendering

    // the state object and the toggle function that controls the viewing of the transfer sub menue
    const [transferFunds, setTransferFunds] = useState(false)
    const toggleTransferMenue = () => {
        setTransferFunds(!transferFunds)
    }

    // the amount to be transfered and the handler to set the tranfer amount
    const [transferAmmount, setTransferAmmount] = useState(0)
    const handleTransferAmmount = (e) => {
        setTransferAmmount(e.target.value)
    }

    const allocateFunds = async() => { // validate the transfer amount is valid and submit the transfer
        if (transferAmmount > (props.account.ballance - props.account.allocated)){
            setTransferAmmount(props.account.ballance - props.account.allocated)
            alert('Insuficient funds to make transfer')
            return
        }
        let serverResponce = await accountService.allocateFundsToSub(props.subAccount.id, transferAmmount)
        transferResponse(serverResponce)
    }

    const dealocateFunds = async() => { //validate the transfer amount is valid and submit the transfer
        if (transferAmmount > props.subAccount.ballance - props.subAccount.allocated){
            setTransferAmmount(props.subAccount.ballance - props.subAccount.allocated)
            alert('Insuficient funds, Consider closing out allocations to free up funds')
            return
        }
        let serverResponce = await accountService.releaseFundsFromSub(props.subAccount.id, transferAmmount)
        transferResponse(serverResponce)
    }

    const transferResponse = (serverResponce) => { // if the funds were transfered cause the parent object to refresh sub accounts
        if (serverResponce.status === 201) {
            alert('Funds transfered sucsessfully')
            props.refreshSubAccounts()
            toggleTransferMenue()
        }
        else if (serverResponce.response.status === 422){
            alert('Not enough funds avalible for transfer')
        } else {
            console.log(serverResponce.response)
            alert(`Failed to process request\n Server responded with: ${serverResponce.response.status}`)
        }
    }


    return ( // the return function handles the jsx that controls rendering of the component
        <div className='Anchor box'>
            {editor === false // if the component is not in edit mode render the standard function
                ?
                    <>
                        <div onClick={toggleDetails}>
                            {props.subAccount.name} Ballance: ${props.subAccount.ballance} 
                            Allocated: ${props.subAccount.allocated} 
                            Avalible: ${props.subAccount.ballance - props.subAccount.allocated}
                        </div>
                        {viewDetails === true // if view datails mode active show the expanded component
                            ?
                                <>
                                    {props.subAccount.owner}
                                    {transferFunds === false 
                                        ? // if transfer funds mode is false render the other view details components
                                            <>
                                                <Button onClick={toggleEditor}>Edit Account</Button>
                                                <Button onClick={toggleTransferMenue}>TransferFunds</Button>

                                                {viewTransactions === true // if view transactions mode is active show the transactions sub menue
                                                    ?
                                                        <>
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
                                                                    )
                                                                    }
                                                                </Container>
                                                            <Button onClick={toggleViewTransactions}>Hide Transactions</Button>
                                                        </>
                                                    : // if view transactions false render the view transactions button
                                                        <Button onClick={toggleViewTransactions}>View Transactions</Button>
                                                }
                                            </>
                                        : // this portion isn't used for the transfer mode
                                            <></>
                                    }
                                </>
                            : // if view details is false do not render the expanded component
                                <></>
                        }
                    </>
                : // if editor mode is true render the editor
                <>
                        <input
                            type="text"
                            name="name"
                            value={edits.name}
                            onChange={edit}
                        />
                        <input
                            type="number"
                            name="ballance"
                            className="read-only"
                            value={edits.ballance}
                            readOnly
                            step=".01"
                        />
                        <Button onClick={submitEdits}>Submit Changes</Button>
                        <Button onClick={resetEdits}>Reset Edits</Button>
                        <Button onClick={cancelEdits}>Cancel</Button>
                </>}
                    {transferFunds
                        ? // if transfer funds is true render the transfer menue
                            <>
                                <input
                                    type='number'
                                    name='transfer'
                                    value={transferAmmount}
                                    onChange={handleTransferAmmount}
                                    step='.01'
                                    min='0'
                                />
                                <Button onClick={allocateFunds}>Allocate Funds</Button>
                                <Button onClick={dealocateFunds}>Release Funds</Button>
                                <Button onClick={toggleTransferMenue}>Cancel Transfer</Button>
                            </>
                        : // if transfer funds is false render nothing
                            <></>
                    }
            <br/>
        </div>
    )
}
export default SubAccount;