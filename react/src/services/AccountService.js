const {default: axios } = require('axios')

class AccountService {

    loadAccounts = async () => {
        return await axios.get(`/api/accounts/load/`).then(data => data)
        
    }

    getAccounts = async () => {
        return await axios.get(`/api/accounts/`).then(data => data)
    }

    createAccount = async (account) => {
        return await axios.post(`/api/accounts/`, account).then(data => data)
    }

    getAccountDetails = async (accountID) => {
        return await axios.get(`/api/accounts/${accountID}`).then(data => data)
    }

    getAccountTransactions = async (accountID) => {
        try{
            return await axios.get(`/api/accounts/${accountID}/transactions`).then(data => data)
        }catch(error) {return error}
    }

    updateAccount = async (account) => {
        return await axios.patch(`/api/accounts/${account.id}`, account).then(data => data)
    }

    getSubAccounts = async (accountID) => {
        try{
            return await axios.get(`/api/accounts/${accountID}/sub`).then(data => data)
        }catch(error) {return error}
    }

    getSubAccountTransactions = async(accountID) => {
        try{
            return await axios.get(`api/accounts/sub/${accountID}/transactions`).then(data => data)
        }catch(error) {return error}
    }

    createSubAccount = async (subAccount) => {
        try{
            return await axios.post(`/api/accounts/${subAccount.main_account}`, subAccount).then(data => data)
        } catch(error) {return error}
    }

    getSubAccount = async (subAccountID) => {
        return await axios.get(`/api/accounts/sub/${subAccountID}`).then(data => data)
    }

    updateSubAccount = async (subAccount) => {
        try{
            return await axios.patch(`/api/accounts/sub/${subAccount.id}`, subAccount).then(data => data)
        }catch(error) {return error}
    }

    allocateFundsToSub = async (subAccountID, ammount) => {
        try{
            return await axios.post(`/api/accounts/sub/${subAccountID}/allocate`, {amount:ammount}).then(data => data)
        }catch(error){return error}
    }

    releaseFundsFromSub = async (subAccountID, ammount) => {
        try{
            return await axios.post(`/api/accounts/sub/${subAccountID}/deallocate`, {amount:ammount}).then(data => data)
        }catch(error){return error}
    }

    ballanceReport = async () => {
        return await axios.get(`/api/accounts/ballances`).then(data => data)
    }

}

export default AccountService