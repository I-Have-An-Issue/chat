import { handler } from './build/handler.js';
import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app)

app.use(handler);

const wss = new WebSocketServer({ server })

wss.on("connection", (ws) => {
	ws.on("message", (message, isBinary) => {
		const data = JSON.parse(message.toString())
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(message, { binary: isBinary })
			}
		});
	})
})

server.listen(5173)
