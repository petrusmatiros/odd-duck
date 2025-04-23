import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import helmet from "helmet";
import path from "node:path";

import { Logger } from "../utils/log-utils";

import { PlayerInstance } from "./PlayerInstance/PlayerInstance";
import { RoomInstance } from "./RoomInstance/Roominstance";
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
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: newPlayerNamespaceConstant,
			message: "No player instance found for token",
		});
		const newUUID = crypto.randomUUID();
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: newPlayerNamespaceConstant,
			message: "Creating new player instance",
		});
		socket.emit("new_player", { uuid: newUUID });
		playersRegistry.set(newUUID, new PlayerInstance(null));
	}

	logger.log({
		socketId: socket.id,
		token: token,
		namespace: newPlayerNamespaceConstant,
		message: "Player instance found for token",
	});

	socket.on("disconnect", () => {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: newPlayerNamespaceConstant,
			message: "user disconnected",
		});
	});
});

// no disconnect event will be emitted if the client is not connected
validatedNamespace.use((socket, next) => {
	const token = socket.handshake.auth.token;
	logger.log({
		socketId: socket.id,
		token: token,
		namespace: validatedNamespaceConstant,
		message: "a user is attempting to connect to validated namespace",
	});

	if (!token) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "No token provided",
		});
		next(new Error("Authentication error"));
		return;
	}

	const isValidToken = playersRegistry.has(token);
	if (!isValidToken) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "No player instance found for token",
		});
		next(new Error("Authentication error"));
		return;
	}

	logger.log({
		socketId: socket.id,
		token: token,
		namespace: validatedNamespaceConstant,
		message: "Player instance found for token",
	});
	next();
});

// TODO: fix this
function joinGameHelper(
	socket: Socket,
	data: { name: string; roomId: string },
) {
	const token = socket.handshake.auth.token;

	logger.log({
		socketId: socket.id,
		token: token,
		namespace: validatedNamespaceConstant,
		message: "join game helper",
		data: data,
	});

	// Check if player already exists
	const player = playersRegistry.get(token);
	if (!player) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "No player instance found for token",
		});
		return;
	}

	// Set player name
	player.setName(data.name);

	logger.log({
		socketId: socket.id,
		token: token,
		namespace: validatedNamespaceConstant,
		message: "player name set",
		data: player,
	});

	// Check if room already exists
	const room = roomsRegistry.get(data.roomId);
	if (!room) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "No room instance found for code",
		});
		return;
	}

	// Check if player is already in the room
	if (room.getPlayers().includes(player.getId())) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "Player already in room",
		});

		socket.emit("entered_game", {
			roomCode: room.getId(),
		});
		return;
	}
	// Check if game is already in progress
	if (room.getGameState() === "in_game") {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "Game is already in progress",
		});
		return;
	}

	// Add player to players array
	room.addPlayer(player.getId());

	// Let socket join the room
	socket.join(room.id);

	// Emit to the player that they have joined the game
	socket.emit("direct_join_game_response");

	// Send to all players in the room (except the sender)
	socket.broadcast.to(room.getId()).emit("player_joined", {
		playerId: player.getId(),
		playerName: data.name,
	});
}

validatedNamespace.on("connection", (socket) => {
	logger.log({
		socketId: socket.id,
		token: socket.handshake.auth.token,
		namespace: validatedNamespaceConstant,
		message: "a user connected",
	});
	// Retrieve token and check if player exists (should be done in middleware)
	const token = socket.handshake.auth.token;

	const player = playersRegistry.get(token);

	logger.log({
		socketId: socket.id,
		token: token,
		namespace: validatedNamespaceConstant,
		message: "player instance found for token",
		data: player,
	});

	if (!player) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "No player instance found for token",
		});
		return;
	}

	socket.on("validated_player", (data) => {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "validated player",
			data: data,
		});
	});

	socket.on("check_if_already_created_game_before", () => {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "check if already created game before",
		});

		// Check if player already exists
		const player = playersRegistry.get(token);

		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
			});
			return;
		}
		// Check if player is already a host of a room
		for (const room of roomsRegistry.values()) {
			if (room.getHost() === player.getId()) {
				logger.log({
					socketId: socket.id,
					token: token,
					namespace: validatedNamespaceConstant,
					message: "Player already a host of a room",
				});

				// Add player to players array in room
				room.addPlayer(player.getId());

				// Let socket join the room
				socket.join(room.getId());

				socket.emit("entered_game", {
					roomCode: room.getId(),
					toastMessage: "You are already a host of a room",
				});
				return;
			}
		}
	});

	socket.on("create_game", (data: { name: string }) => {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "create room",
			data: data,
		});

		// Check if player already exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
			});
			return;
		}

		// Set player name
		player.setName(data.name);

		// TODO:
		// Ensure that player, creating the room, is not already a host of a room
		// Iterate through all rooms, and check if the player matches the host
		for (const room of roomsRegistry.values()) {
			if (room.getHost() === player.getId()) {
				logger.log({
					socketId: socket.id,
					token: token,
					namespace: validatedNamespaceConstant,
					message: "Player already a host of a room",
				});

				// Add player to players array in room
				room.addPlayer(player.getId());

				// Let socket join the room
				socket.join(room.getId());

				// TODO: make host join their own already created room
				socket.emit("entered_game", {
					roomCode: room.getId(),
					toastMessage: "You are already a host of a room",
				});

				return;
			}
		}

		// Create new room
		const newRoom = new RoomInstance(player.getId());

		// Add room to registry
		roomsRegistry.set(newRoom.getId(), newRoom);

		// Add player to players array
		newRoom.addPlayer(player.getId());

		// Let socket join the room
		socket.join(newRoom.getId());

		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "new room created",
			data: newRoom,
		});

		socket.emit("entered_game", {
			roomCode: newRoom.getId(),
			toastMessage: "You have created a new game",
		});
	});

	socket.on("join_game", (data: { name: string; code: string }) => {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "create room",
			data: data,
		});

		// Check if player already exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
			});
			return;
		}

		// Set player name
		player.setName(data.name);

		// Check if room already exists
		const room = roomsRegistry.get(data.code);
		if (!room) {
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "No room instance found for code",
			});
			return;
		}

		// Check if player is already in the room
		if (room.getPlayers().includes(player.getId())) {
			// TODO: need to handle logic here to rejoin? or will this ever happen?
			// If a player is already apart of the players, and you cannot join when it's in game, that means this player must rejoin the game since they are apart of it and accidentally disconnected
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "Player already in room",
			});

			socket.emit("entered_game", {
				roomCode: room.id,
			});
			return;
		}

		// Check if game is already in progress
		if (room.getGameState() === "in_game") {
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				message: "Game is already in progress",
			});
			return;
		}

		// Add player to players array
		room.addPlayer(player.getId());

		// Let socket join the room
		socket.join(room.id);

		// Emit to the player that they have joined the game
		socket.emit("joined_game", {
			roomCode: room.id,
		});

		// Send to all players in the room (except the sender)
		socket.broadcast.to(room.getId()).emit("player_joined", {
			playerId: player.getId(),
			playerName: data.name,
		});
	});

	/**
	 * Here the rooms for a socket are still present.
	 */
	socket.on("disconnecting", () => {
		// socket.rooms.size > 0 here

		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "user attempting to disconnect",
		});

		// Go through all rooms, and make sure to remove the player from the room
		for (const roomId of socket.rooms) {
			// Check if the roomId is a valid room
			const room = roomsRegistry.get(roomId);
			if (!room) {
				logger.log({
					socketId: socket.id,
					token: token,
					namespace: validatedNamespaceConstant,
					message: "No room instance found for code",
				});
				continue;
			}

			// Check if the player is a valid player
			const player = playersRegistry.get(token);
			if (!player) {
				logger.log({
					socketId: socket.id,
					token: token,
					namespace: validatedNamespaceConstant,
					message: "No player instance found for token",
				});
				return;
			}

			const PLAYER_ID = player.getId();

			// !IMPORTANT, if the socket is a player, that is a host of a room, reset the game (everyone goes back to lobby)
			if (room.getHost() === PLAYER_ID) {
				logger.log({
					socketId: socket.id,
					token: token,
					namespace: validatedNamespaceConstant,
					message: "Player is host of room",
				});

				// Reset the game, do not kick the players
				room.resetGame();

				socket.broadcast.to(roomId).emit("host_disconnected", {
					host: PLAYER_ID,
				});
			}

			// Remove player from room (removes them from all lists)
			room.removePlayer(PLAYER_ID);

			// !IMPORTANT: no need to leave room since this will be done on 'disconnect'
		}

		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "user disconnected",
		});
	});

	/**
	 * Here the rooms for a socket are empty.
	 */
	socket.on("disconnect", () => {
		// socket.rooms.size === 0 here
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			message: "user disconnected",
		});
	});
});
