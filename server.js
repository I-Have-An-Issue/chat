import { handler } from "./build/handler.js"
import express from "express"
import WebSocket, { WebSocketServer } from "ws"
import { createServer } from "http"
import { state } from "./src/lib/state.js"
import { rawMessage, broadcast, serverMessage } from "./src/lib/util.js"

const app = express()
const server = createServer(app)
app.use(handler)
const wss = new WebSocketServer({ server })

wss.on("connection", (ws, request) => {
	serverMessage({ ws, content: "Guest login is enabled. Your next message will be your username." })
	ws.chatState = "SET_USERNAME"

	ws.on("message", (data, isBinary) => state(wss, ws, data))

	ws.on("close", (code, reason) => {
		broadcast({
			wss,
			type: "USER_REMOVE",
			channel: ws.channel,
			data: ws.username,
		})

		broadcast({
			wss,
			type: "MESSAGE",
			channel: ws.channel,
			data: {
				content: `${ws.username} has left #${ws.channel}`,
				timestamp: Date.now(),
				server: true,
			},
		})
	})

	ws.on("pong", () => {
		ws.isAlive = true
		broadcast({
			wss,
			type: "USER_ADD",
			channel: ws.channel,
			data: ws.username,
		})
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
