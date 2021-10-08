export default function getUserName(userID, userList) {
    for(let i=0; i < userList.length; i++){
        if (userID === userList[i].id){
            return userList[i].name;
        };
    };
    return "UserName Unknown";
}