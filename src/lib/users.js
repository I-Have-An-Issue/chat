import { writable } from "svelte/store";
export const users = writable([]);

/*
    { 
        "id": String,
        "username": String, 
        "rank": Number 
    }
*/

export function setUsers(_) {
	users = _;
}
