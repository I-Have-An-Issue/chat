import { writable } from "svelte/store"

export const users = writable([])

export function addUser(username) {
	users.update((usrs) => {
		if (usrs.find((value) => value == username)) return usrs
		usrs.push(username)
		return usrs
	})
}

export function removeUser(username) {
	users.update((_) => {
		_.pop(username)
		return _
	})
}

export function clearUsers() {
	users.set([])
}
