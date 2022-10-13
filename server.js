import { handler } from "./build/handler.js"
import express from "express"
import WebSocket, { WebSocketServer } from "ws"
import { createServer } from "http"

const app = express()
const server = createServer(app)

app.use(handler)

const wss = new WebSocketServer({ server })

let pastMessages = []

function existingUsername(username) {
	return new Promise((resolve, reject) => {
		wss.clients.forEach((client) => {
			if (client.username == username) resolve(client)
		})
		resolve(false)
	})
}

function broadcast(data, ws) {
	if (["SERVER_MESSAGE", "USER_MESSAGE", "USER_ADD", "USER_REMOVE"].includes(data.type)) pastMessages.push(data)
	wss.clients.forEach((client) => {
		if (client !== ws && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(data))
		}
	})
}

wss.on("connection", (ws, request) => {
	for (let i = 0; i < pastMessages.length; i++) {
		let pastMessage = pastMessages[i]
		ws.send(JSON.stringify(pastMessage))
	}

	ws.send(JSON.stringify({ type: "SERVER_MESSAGE", content: "Guest login is enabled. Your next message will be your username.", color: 1 }))
	ws.chatState = "SET_USERNAME"

	ws.on("pong", () => (ws.isAlive = true))

	ws.on("message", async (message, isBinary) => {
		let data
		try {
			data = JSON.parse(message.toString())
		} catch (_) {}

		switch (ws.chatState) {
			case "SET_USERNAME":
				if (!data.content || data.content.length <= 0)
					return ws.send(
						JSON.stringify({
							type: "SERVER_MESSAGE",
							content: "You must enter a username.",
							color: 2,
						})
					)

				if (data.content.length > 16)
					return ws.send(
						JSON.stringify({
							type: "SERVER_MESSAGE",
							content: "Usernames can only be 1-16 characters long.",
							color: 2,
						})
					)

				if (new RegExp(/[^A-Za-z0-9_]/g).test(data.content))
					return ws.send(
						JSON.stringify({
							type: "SERVER_MESSAGE",
							content: "Usernames can only be letters, numbers, and underscores.",
							color: 2,
						})
					)

				if (await existingUsername(data.content))
					return ws.send(
						JSON.stringify({
							type: "SERVER_MESSAGE",
							content: "Somebody already has that username.",
							color: 2,
						})
					)

				ws.chatState = "READY"
				ws.username = data.content

				console.log(`${request.headers["x-forwarded-for"] || request.socket.remoteAddress} ${ws.username} has joined the chatroom.`)

				broadcast({
					type: "USER_ADD",
					name: ws.username,
					rank: 0,
				})

				broadcast({
					type: "SERVER_MESSAGE",
					content: `${ws.username} has joined the chatroom.`,
					timestamp: Date.now(),
					color: 1,
				})
				break
			case "READY":
				if (data.content.length > 100 || data.content.length <= 0)
					return ws.send(
						JSON.stringify({
							type: "SERVER_MESSAGE",
							content: "Messages can only be 1-100 characters long.",
							color: 2,
						})
					)

				setTimeout(() => (ws.chatState = "READY"), 500)
				ws.chatState = "COOLDOWN"

				console.log(`${request.headers["x-forwarded-for"] || request.socket.remoteAddress} ${ws.username} ${data.content}`)

				broadcast({
					type: "USER_MESSAGE",
					author: ws.username,
					content: data.content,
					timestamp: Date.now(),
					color: 0,
				})
				break
			case "COOLDOWN":
				break
			default:
				ws.send(
					JSON.stringify({
						type: "SERVER_MESSAGE",
						content: "ERR_UNKNOWN_STATE",
					})
				)
				break
		}
	})

	ws.on("close", (code, reason) => {
		if (ws.chatState == "READY" && ws.username) {
			console.log(`${request.headers["x-forwarded-for"] || request.socket.remoteAddress} ${ws.username} has left the chatroom.`)

			broadcast({
				type: "USER_REMOVE",
				name: ws.username,
			})

			broadcast({
				type: "SERVER_MESSAGE",
				content: `${ws.username} has left the chatroom.`,
				timestamp: Date.now(),
				color: 1,
			})

			ws.chatState = undefined
			ws.username = undefined
		}
	})
})

const interval = setInterval(() => {
	wss.clients.forEach((ws) => {
		if (ws.isAlive === false) return ws.terminate()
		ws.isAlive = false
		ws.ping()
	})
}, 30000)

wss.on("close", () => clearInterval(interval))

server.listen(process.env.PORT || 5173)
console.log(`Listening on http://127.0.0.1:${process.env.PORT || 5173}/`)
