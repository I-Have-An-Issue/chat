import { addChat, clearChat } from "$lib/chats.js";
import { setUsers } from "$lib/users.js";
const types = {};

types["MESSAGE"] = ({ message }) => {
	addChat(message);
};

types["USERS"] = ({ users }) => {
	setUsers(users);
};

types["CLEAR"] = () => {
	clearChat();
};

/*
    {
        "history": [ <Message> ... ],
        "channel": String
    }
*/
types["INFO"] = () => {};

export function message(data) {
	if (types[data.type]) return types[data.type](data);
}
