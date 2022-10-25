import { writable } from "svelte/store";
export const chats = writable([]);

/*
    {
        "id": String,
        "username": String,
        "content": String,
        "timestamp": Date,
        "server": Boolean,
        "pm": Boolean
    }
*/

export function addChat(message) {
	chats.update((_) => {
		_.push(message);
		return _;
	});
}

export function clearChat() {
	chats.set([]);
}
