import { messages, addMessage, clearMessages } from "$lib/stores/messages.js"
import { users, addUser, removeUser, clearUsers } from "$lib/stores/users.js"
const types = {}

types["MESSAGE"] = ({ data }) => {
	addMessage(data)
}

types["USER_ADD"] = ({ data }) => {
	addUser(data)
}

types["USER_REMOVE"] = ({ data }) => {
	removeUser(data)
}

types["CLEAR"] = () => {
	clearMessages()
	clearUsers()
}

export function handler(data, socket) {
	if (types[data.type]) types[data.type](data, socket)
}
