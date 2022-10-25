import WebSocket from "ws"

export const ALPHA_REGEX = new RegExp(/[^A-Za-z0-9_]/g)

export function rawMessage({ ws, type, data }) {
	ws.send(
		JSON.stringify({
			type,
			data,
		})
	)
}

export function broadcast({ wss, ws, type, data, channel }) {
	wss.clients.forEach((client) => {
		if (client !== ws && client.readyState === WebSocket.OPEN && client.username) {
			if (channel) {
				if (client.channel == channel) return rawMessage({ ws: client, type, data })
			} else {
				return rawMessage({ ws: client, type, data })
			}
		}
	})
}

export function serverMessage({ ws, content, timestamp, type }) {
	return rawMessage({
		ws,
		type: "MESSAGE",
		data: {
			content,
			timestamp: timestamp || Date.now(),
			server: true,
		},
	})
}

export function existingUsername(wss, username) {
	return new Promise((resolve, reject) => {
		wss.clients.forEach((client) => {
			if (client.username == username) resolve(client)
		})
		resolve(false)
	})
}

export function pingChannel(wss, channel) {
	wss.clients.forEach((ws) => {
		if (ws.channel == channel) {
			if (ws.isAlive === false) return ws.terminate()
			ws.isAlive = false
			ws.ping()
		}
	})
}
