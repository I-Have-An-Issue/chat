import { writable } from "svelte/store"

export const messages = writable([])

export function addMessage(message) {
	messages.update((_) => {
		_.push(message)
		return _
	})
}

export function clearMessages() {
	messages.set([])
}
