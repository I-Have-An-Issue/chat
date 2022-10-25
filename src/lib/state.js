import { command } from "./command.js"
import { rawMessage, broadcast, serverMessage, ALPHA_REGEX, existingUsername, pingChannel } from "./util.js"
const states = {}

states["SET_USERNAME"] = async (wss, ws, data) => {
	const { content } = data

	if (!content || content.length <= 0)
		return serverMessage({
			ws,
			content: "You must set a username.",
		})

	if (content.length > 16)
		return serverMessage({
			ws,
			content: "Usernames can only be 1-16 characters long.",
		})

	if (ALPHA_REGEX.test(content))
		return serverMessage({
			ws,
			content: "Usernames can only be letters, numbers, and underscores.",
		})

	if (await existingUsername(wss, content))
		return serverMessage({
			ws,
			content: "Someone already has that username.",
		})

	ws.username = data.content
	ws.channel = "main"
	ws.chatState = "READY"

	pingChannel(wss, ws.channel)

	return broadcast({
		wss,
		type: "MESSAGE",
		channel: ws.channel,
		data: {
			content: `${ws.username} has joined #${ws.channel}`,
			timestamp: Date.now(),
			server: true,
		},
	})
}

states["READY"] = (wss, ws, data) => {
	const { content } = data

	if (content.length > 100 || content.length <= 0)
		return serverMessage({
			ws,
			content: "Messages must be 1-100 characters long.",
		})

	if (content.startsWith("/")) {
		const args = content.split(" ")
		const cmd = args[0].slice(1)

		return command(wss, ws, cmd, args)
	} else {
		setTimeout(() => (ws.chatState = "READY"), 500)
		ws.chatState = "COOLDOWN"

		return broadcast({
			wss,
			type: "MESSAGE",
			channel: ws.channel,
			data: {
				username: ws.username,
				content,
				timestamp: Date.now(),
			},
		})
	}
}

export function state(wss, ws, data) {
	try {
		var message = JSON.parse(data)
	} catch (_) {
		return
	}

	if (states[ws.chatState]) states[ws.chatState](wss, ws, message)
}
