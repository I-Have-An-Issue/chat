import { handler } from "./build/handler.js"
import express from "express"
import WebSocket, { WebSocketServer } from "ws"
import { createServer } from "http"

const app = express()
const server = createServer(app)

app.use(handler)

const wss = new WebSocketServer({ server })

let users = {}
let past_messages = []

function broadcast(data, ws) {
	past_messages.push(JSON.stringify(data))
	wss.clients.forEach((client) => {
		if (client !== ws && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(data))
		}
	})
}

wss.on("connection", (ws, request) => {
	for (let i = 0; i < past_messages.length; i++) {
		let pastMessage = past_messages[i]
		ws.send(pastMessage)
	}

	users[`${request.socket.remoteAddress}:${request.socket.remotePort}`] = {}
	ws.send(JSON.stringify({ type: "SERVER_MESSAGE", content: "The server has enabled guest login. Your next message will be your username." }))
	users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].state = "SET_USERNAME"

	ws.on("pong", () => (ws.isAlive = true))

	ws.on("message", (message, isBinary) => {
		let data
		try {
			data = JSON.parse(message.toString())
		} catch (_) {}

		if (users[`${request.socket.remoteAddress}:${request.socket.remotePort}`]) {
			switch (users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].state) {
				case "SET_USERNAME":
					if (!data.content || data.content.length <= 0) return ws.send(JSON.stringify({ type: "SERVER_MESSAGE", content: "You must enter a username." }))
					if (data.content.length > 16) return ws.send(JSON.stringify({ type: "SERVER_MESSAGE", content: "Usernames can only be 1-16 characters long." }))
					if (new RegExp(/[^A-Za-z0-9_]/g).test(data.content)) return ws.send(JSON.stringify({ type: "SERVER_MESSAGE", content: "Usernames can only be letters, numbers, and underscores." }))
					if (Object.values(users).find((_) => _?.username == data.content)) return ws.send(JSON.stringify({ type: "SERVER_MESSAGE", content: "Somebody already has that username." }))

					users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].state = "READY"
					users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].username = data.content

					console.log(`${request.headers["x-forwarded-for"] || request.socket.remoteAddress} ${data.content} has joined the chatroom.`)
					broadcast({ type: "USER_ADD", name: data.content, rank: 1 })
					return broadcast({ type: "SERVER_MESSAGE", content: `${data.content} has joined the chatroom.`, timestamp: Date.now() })
					break
				case "READY":
					if (data.content.length > 100 || data.content.length <= 0) return ws.send(JSON.stringify({ type: "SERVER_MESSAGE", content: "Messages can only be 1-100 characters long." }))

					//setTimeout(() => (users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].state = "READY"), 500)
					//users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].state = "COOLDOWN"

					console.log(`${request.headers["x-forwarded-for"] || request.socket.remoteAddress} ${users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].username} ${data.content}`)
					return broadcast({
						type: "USER_MESSAGE",
						author: users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].username,
						content: data.content,
						timestamp: Date.now(),
					})
					break
				case "COOLDOWN":
					break
				default:
					return ws.send(JSON.stringify({ type: "SERVER_MESSAGE", content: "ERR_UNKNOWN_STATE" }))
					break
			}
		}
	})

	ws.on("close", (code, reason) => {
		if (users[`${request.socket.remoteAddress}:${request.socket.remotePort}`] && users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].username) {
			console.log(`${request.headers["x-forwarded-for"] || request.socket.remoteAddress} ${users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].username} has left the chatroom.`)

			broadcast({ type: "USER_REMOVE", name: users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].username })
			broadcast({
				type: "SERVER_MESSAGE",
				content: `${users[`${request.socket.remoteAddress}:${request.socket.remotePort}`].username} has left the chatroom.`,
				timestamp: Date.now(),
			})

			users[`${request.socket.remoteAddress}:${request.socket.remotePort}`] = undefined
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
