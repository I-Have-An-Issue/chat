import { rawMessage, broadcast, serverMessage, ALPHA_REGEX, existingUsername, pingChannel } from "./util.js"
const commands = {}

commands["args"] = (wss, ws, args) => {
	return serverMessage({ ws, content: args.join(", ") })
}

commands["channel"] = (wss, ws, args) => {
	const channel = args[0]
	const oldChannel = ws.channel

	if (channel.length > 20 || channel.length <= 0) return serverMessage({ ws, content: "Channels must be 1-20 characters long." })

	ws.channel = channel
	rawMessage({ ws, type: "CLEAR", data: {} })

	broadcast({
		wss,
		type: "MESSAGE",
		channel: oldChannel,
		data: {
			content: `${ws.username} has left #${oldChannel}`,
			timestamp: Date.now(),
			server: true,
		},
	})

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

export function command(wss, ws, cmd, args) {
	if (commands[cmd]) commands[cmd](wss, ws, args.slice(1))
}
