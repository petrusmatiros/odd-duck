import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import helmet from "helmet";
import path from "node:path";

import { Logger } from "../utils/log-utils";

import { PlayerInstance } from "./PlayerInstance/PlayerInstance";
import { RoomInstance } from "./RoomInstance/Roominstance";
import { TimerInstance } from "./TimerInstance/TimerInstance";
import { entertainment_pack } from "../data/packs/entertainment_pack";
import type { GamePack } from "../data/types";

// load environment variables from .env file
config();

const logger = new Logger("Server");

const PORT = process.env.WS_SERVER_PORT || 8080;
const API_URL = process.env.WS_SERVER_URL || "http://localhost:8080";

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

const newPlayerNamespaceConstant = process.env.WS_NEW_PLAYER_NAMESPACE;
const validatedNamespaceConstant = process.env.WS_VALIDATED_NAMESPACE;
const newPlayerNamespace = io.of(`/${newPlayerNamespaceConstant}`);
const validatedNamespace = io.of(`/${validatedNamespaceConstant}`);

newPlayerNamespace.on("connection", (socket) => {
	const token = socket.handshake.auth.token;
	logger.log({
		socketId: socket.id,
		token: token,
		namespace: newPlayerNamespaceConstant,
		message: "a user connected",
	});

	const isValidToken = playersRegistry.has(token);
	if (!isValidToken) {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: newPlayerNamespaceConstant,
				message: "No player instance found for token",
			}
		);
		const newUUID = crypto.randomUUID();
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: newPlayerNamespaceConstant,
				message: "Creating new player instance",
			}
		);
		socket.emit("new_player", { uuid: newUUID });
		playersRegistry.set(newUUID, new PlayerInstance(newUUID, ""));
	}

	logger.log(
		{
			socketId: socket.id,
			token: token,
			namespace: newPlayerNamespaceConstant,
			message: "Player instance found for token",
		}
	);

	socket.on("disconnect", () => {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: newPlayerNamespaceConstant,
				message: "user disconnected",
			}
		);
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
	// Retrieve token and check if player exists (should be done in middleware)
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

	if (!player) {
		logger.log(
			{
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
			}
		);
		return;
	}

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
