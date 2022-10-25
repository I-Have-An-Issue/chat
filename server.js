import { handler } from "./build/handler.js"
import express from "express"
import WebSocket, { WebSocketServer } from "ws"
import { createServer } from "http"
import { randomUUID } from "crypto"
import { commands } from "./src/lib/commands.js"

const app = express()
const server = createServer(app)

app.use(handler)

const wss = new WebSocketServer({ server })

function existingUsername(username) {
	return new Promise((resolve, reject) => {
		wss.clients.forEach((client) => {
			if (client.username == username) resolve(client)
		})
		resolve(false)
	})
}

function send(client, type, data) {
	client.send(
		JSON.stringify({
			type,
			[type.toLowerCase()]: data,
		})
	)
}

function broadcast(type, data, ws) {
	wss.clients.forEach((client) => {
		if (client !== ws && client.readyState === WebSocket.OPEN && client.username) {
			return send(client, type, data)
		}
	})
}

wss.on("connection", (ws, request) => {
	send(ws, "MESSAGE", {
		content: "Guest login is enabled. Your next message will be your username.",
		timestamp: Date.now(),
		server: true,
	})

	ws.chatState = "SET_USERNAME"
	ws.id = randomUUID()

	ws.on("pong", () => (ws.isAlive = true))

	ws.on("message", async (message, isBinary) => {
		try {
			var data = JSON.parse(message.toString())
		} catch (_) {
			return send(ws, "MESSAGE", {
				content: "Malformed message.",
				timestamp: Date.now(),
				server: true,
			})
		}

		switch (ws.chatState) {
			case "SET_USERNAME":
				if (!data.content || data.content.length <= 0)
					return send(ws, "MESSAGE", {
						content: "You must enter a username.",
						timestamp: Date.now(),
						server: true,
					})

				if (data.content.length > 16)
					return send(ws, "MESSAGE", {
						content: "Usernames can only be 1-16 characters long.",
						timestamp: Date.now(),
						server: true,
					})

				if (new RegExp(/[^A-Za-z0-9_]/g).test(data.content))
					return send(ws, "MESSAGE", {
						content: "Usernames can only be letters, numbers, and underscores.",
						timestamp: Date.now(),
						server: true,
					})

				if (await existingUsername(data.content))
					return send(ws, "MESSAGE", {
						content: "Somebody already has that username.",
						timestamp: Date.now(),
						server: true,
					})

				ws.username = data.content
				ws.chatState = "READY"

				broadcast("MESSAGE", {
					content: `${ws.username} has joined the chatroom.`,
					timestamp: Date.now(),
					server: true,
				})
				break
			case "READY":
				if (data.content.startsWith("/")) {
					let args = data.content.split(" ")
					let commandName = args[0].slice(1)
					let command = commands[commandName]

					if (!command)
						return send(ws, "MESSAGE", {
							content: "Unknown command.",
							timestamp: Date.now(),
							server: true,
						})

					return command(ws, args.slice(1))
				} else if (data.content.length > 100 || data.content.length <= 0)
					return send(ws, "MESSAGE", {
						content: "Messages can only be 1-100 characters long.",
						timestamp: Date.now(),
						server: true,
					})

				ws.chatState = "COOLDOWN"
				setTimeout(() => (ws.chatState = "READY"), 500)

				broadcast("MESSAGE", {
					username: ws.username,
					content: data.content,
					timestamp: Date.now(),
				})
				break
			default:
				break
		}
	})

	ws.on("close", (code, reason) => {
		if (ws.chatState == "READY" && ws.username) {
			broadcast("MESSAGE", {
				content: `${ws.username} has left the chatroom.`,
				timestamp: Date.now(),
				server: true,
			})

			ws.id = undefined
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
