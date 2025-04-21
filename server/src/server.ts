import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import helmet from "helmet";
import cryptoRandomString from "crypto-random-string";
import path from "node:path";
// import session from "express-session";

import { Logger } from "../utils/log-utils";

import { PlayerInstance } from "./PlayerInstance/PlayerInstance";
import { RoomInstance } from "./RoomInstance/Roominstance";
import { TimerInstance } from "./TimerInstance/TimerInstance";
import { entertainment_pack } from "../data/packs/entertainment_pack";
import type { GamePack } from "../data/types";

// load environment variables from .env file
config();

const logger = new Logger("Server");

const PORT = process.env.PORT || 8080;
const API_URL = process.env.API_URL || "http://localhost:8000";

const app = express();
const server = createServer(app);

const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

// Middleware to set security headers
io.engine.use(helmet());

// // Middleware for session management
// io.engine.use(session({
//   secret: "keyboard cat",
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true }
// }));

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse URL-encoded requests
app.use(cors());

// Middleware to serve static files
const staticFileDirectoryPath = "../../client/out";
const pathToStaticFiles = path.join(__dirname, staticFileDirectoryPath);

app.use(express.static(pathToStaticFiles));

const indexFileName = "index.html";

app.get("/", (req, res) => {
	logger.log(`Serving ${indexFileName}`);

	logger.log(path.join(pathToStaticFiles, indexFileName));
	res.sendFile(path.join(pathToStaticFiles, indexFileName), (err) => {
		if (err) {
			logger.error(`Error sending ${indexFileName}:`, err);
			res.status(err.status).end();
		} else {
			logger.log(`${indexFileName} sent successfully`);
		}
	});
});

server.listen(PORT, () => {
	logger.log(`Server is running on port ${PORT}`);
});

const roomsRegistry = new Map<string, RoomInstance>();
const playersRegistry = new Map<string, PlayerInstance>();
const gamePacksRegistry = new Map<string, GamePack>();

gamePacksRegistry.set("entertainment_pack", entertainment_pack);
const player1 = new PlayerInstance("123", "potato potato");
const room1 = new RoomInstance(
	player1.getId(),
	"entertainment_pack",
	new TimerInstance(5),
);
roomsRegistry.set(room1.id, room1);
playersRegistry.set(player1.getId(), player1);

logger.log("roomsRegistry", roomsRegistry);
logger.log("playersRegistry", playersRegistry);
logger.log("gamePacksRegistry", gamePacksRegistry);

const unvalidatedNamespaceConstant = process.env.WS_UNVALIDATED_NAMESPACE;
const validatedNamespaceConstant = process.env.WS_VALIDATED_NAMESPACE;
const unvalidatedNamespace = io.of(`/${unvalidatedNamespaceConstant}`);
const validatedNamespace = io.of(`/${validatedNamespaceConstant}`);

unvalidatedNamespace.on("connection", (socket) => {
	const token = socket.handshake.auth.token;
	logger.log({
		socketId: socket.id,
		token: token,
		namespace: unvalidatedNamespaceConstant,
		message: "a user connected",
	});

	const isValidToken = playersRegistry.has(token);
	if (!isValidToken) {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: unvalidatedNamespaceConstant,
				message: "No player instance found for token",
			}
		);
		const newUUID = crypto.randomUUID();
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: unvalidatedNamespaceConstant,
				message: "Creating new player instance",
			}
		);
		socket.emit("new_player", { uuid: newUUID });
		playersRegistry.set(newUUID, new PlayerInstance(newUUID, ""));
	}
	socket.on("disconnect", () => {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: unvalidatedNamespaceConstant,
				message: "user disconnected",
			}
		);

		// // join the room named 'some room'
		// socket.join('some room');

		// // broadcast to all connected clients in the room
		// io.to('some room').emit('hello', 'world');

		// // broadcast to all connected clients except those in the room
		// io.except('some room').emit('hello', 'world');

		// // leave the room
		// socket.leave('some room');
	});
});

// no disconnect event will be emitted if the client is not connected
validatedNamespace.use((socket, next) => {
	const token = socket.handshake.auth.token;
	logger.log(
		{
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "a user is attempting to connect to validated namespace",
		}
	);

	if (!token) {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "No token provided",
			}
		);
		next(new Error("Authentication error"));
		return;
	}

	const isValidToken = playersRegistry.has(token);
	if (!isValidToken) {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
			}
		);
		next(new Error("Authentication error"));
		return;
	}

	logger.log(
		{
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "Player instance found for token",
		}
	);
	next();
});

validatedNamespace.on("connection", (socket) => {
	logger.log(
		{
			socketId: socket.id,
			token: socket.handshake.auth.token,
			namespace: validatedNamespaceConstant,
			message: "a user connected",
		}
	);
	const token = socket.handshake.auth.token;
	const player = playersRegistry.get(token);

	logger.log(
		{
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "player instance found for token",
			data: player,
		}
	);

	socket.on("validated_player", (data) => {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "validated player",
				data: data,
			}
		);
	});

	socket.on("disconnect", () => {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "user disconnected",
			}
		);
	});
});
