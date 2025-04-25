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

app.get("/", (_req, res) => {
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

const validatedNamespaceConstant = process.env.WS_VALIDATED_NAMESPACE;
const validatedNamespace = io.of(`/${validatedNamespaceConstant}`);

// TODO: fix this
function joinGameHelper(
	socket: Socket,
	data: { name: string; roomId: string },
) {
	const token = socket.handshake.auth.token;

	logger.log({
		socketId: socket.id,
		token: token,
		event: "join_game_helper",
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
			event: "join_game_helper",
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
		event: "join_game_helper",
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
			event: "join_game_helper",
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
			event: "join_game_helper",
			namespace: validatedNamespaceConstant,
			message: "Player already in room",
		});

		socket.emit("entered_game_response", {
			roomCode: room.getId(),
		});
		return;
	}
	// Check if game is already in progress
	if (room.getGameState() === "in_game") {
		logger.log({
			socketId: socket.id,
			token: token,
			event: "join_game_helper",
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

function onConnectionHelper(socket: Socket) {
	logger.log({
		socketId: socket.id,
		token: socket.handshake.auth.token,
		namespace: validatedNamespaceConstant,
		event: "connection_helper",
		message: "a user connected",
	});

	// Retrieve token and check if player exists (should be done in middleware)
	const token = socket.handshake.auth.token;

	const player = playersRegistry.get(token);

	if (!token || !player) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			event: "connection_helper",
			message: "No player instance found for token or token is invalid",
		});

		// Generate a new UUID
		const newUUID = crypto.randomUUID();
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			event: "connection_helper",
			message: "Creating new player instance",
		});
		const newPlayer = new PlayerInstance(newUUID);
		playersRegistry.set(newUUID, newPlayer);
		// !IMPORTANT, we must assign, so each successive events can use the same token
		socket.handshake.auth.token = newUUID;
		socket.emit("register_new_player_token_response", {
			token: newUUID,
			toastMessage: "New player token created",
		});
		return;
	}

	logger.log({
		socketId: socket.id,
		token: token,
		namespace: validatedNamespaceConstant,
		event: "connection_helper",
		message: "Retrieved token and player",
		data: {
			player: player,
			token: token,
		},
	});
}

/**
 * connection
 * This event is fired when a new socket connection is established.
 */
validatedNamespace.on("connection", (socket) => {
	onConnectionHelper(socket);

	/**
	 * validated_player
	 * This event is fired when the client emits a validated_player event.
	 */
	socket.on("validated_player", (data) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "validated_player",
			namespace: validatedNamespaceConstant,
			message: "validated player",
			data: data,
		});
	});

	/**
	 * check_if_already_created_game_before
	 * This event is fired when the client emits a check_if_already_created_game_before event.
	 */
	socket.on("check_if_already_created_game_before", () => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "check_if_already_created_game_before",
			namespace: validatedNamespaceConstant,
			message: "check if already created game before",
		});

		// Check if player already exists
		const player = playersRegistry.get(token);

		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_already_created_game_before",
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
					event: "check_if_already_created_game_before",
					namespace: validatedNamespaceConstant,
					message: "Player already a host of a room",
				});

				// Add player to players array in room
				room.addPlayer(player.getId());

				// Let socket join the room
				socket.join(room.getId());

				socket.emit("entered_game_response", {
					roomCode: room.getId(),
					toastMessage: "You are already a host of a room",
				});
				return;
			}
		}
		return;
	});

	/**
	 * create_game
	 * This event is fired when the client emits a create_game event.
	 */
	socket.on("create_game", (data: { name: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "create_game",
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
				event: "create_game",
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
					event: "create_game",
					namespace: validatedNamespaceConstant,
					message: "Player already a host of a room",
				});

				// Add player to players array in room
				room.addPlayer(player.getId());

				// Let socket join the room
				socket.join(room.getId());

				// TODO: make host join their own already created room
				socket.emit("entered_game_response", {
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
			event: "create_game",
			namespace: validatedNamespaceConstant,
			message: "new room created",
			data: newRoom,
		});

		socket.emit("entered_game_response", {
			roomCode: newRoom.getId(),
			toastMessage: "You have created a new game",
		});
	});

	/**
	 * join_game
	 * This event is fired when the client emits a join_game event.
	 */
	socket.on("join_game", (data: { name: string; code: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "join_game",
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
				event: "join_game",
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
				event: "join_game",
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
				event: "join_game",
				namespace: validatedNamespaceConstant,
				message: "Player already in room",
			});

			socket.emit("entered_game_response", {
				roomCode: room.id,
			});
			return;
		}

		// Check if game is already in progress
		if (room.getGameState() === "in_game") {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "join_game",
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
		socket.emit("entered_game_response", {
			roomCode: room.id,
		});

		// Send to all players in the room
		io.to(room.getId()).emit("player_joined_game_broadcast_all", {
			playerId: player.getId(),
			playerName: data.name,
		});
	});

	/**
	 * check_if_allowed_in_game
	 * This event is fired when the client emits a check_if_allowed_in_game event.
	 */
	socket.on("check_if_allowed_in_game", (data: { code: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "check_if_allowed_in_game",
			namespace: validatedNamespaceConstant,
			message: "check if allowed in game",
			data: data,
		});
		// Check if room already exists
		const room = roomsRegistry.get(data.code);
		if (!room) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message: "No room instance found for code",
			});
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "not_allowed",
				toastMessage: `The room ${data.code} does not exist`,
			});
			return;
		}
		// Check if player already exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message:
					"Socket is attempting direct join, since player is not in registry",
			});
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_register",
				toastMessage:
					"You are allowed to join the game, but you need a name first",
			});
			return;
		}
		// Check if player is the host of the room
		if (room.getHost() === player.getId()) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message: "Player is host of room",
			});
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_join",
				isHost: true,
				toastMessage: "You can join - welcome back, host!",
			});
			io.to(room.getId()).emit("player_joined_game_broadcast_all", {
				playerId: player.getId(),
				playerName: player.getName(),
			});
			return;
		}
		// Check if player is not in the room
		if (!room.getPlayers().includes(player.getId())) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message: "Player not in room",
			});

			// Check if game is already in progress
			if (room.getGameState() === "in_game") {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "check_if_allowed_in_game",
					namespace: validatedNamespaceConstant,
					message: "Game is already in progress",
				});
				socket.emit("check_if_allowed_in_game_response", {
					allowedState: "not_allowed",
					toastMessage: "Game is already in progress",
				});
				return;
			}

			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message: "Allowed to join game",
			});

			// If it is not in progress, then the player can join the game
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_join",
				toastMessage: `Joined room ${data.code}`,
			});
			return;
		}
	});
		
	/**
	 * disconnecting
	 * Here the rooms for a socket are still present.
	 */
	socket.on("disconnecting", () => {
		const token = socket.handshake.auth.token;
		// socket.rooms.size > 0 here

		logger.log({
			socketId: socket.id,
			token: token,
			event: "disconnecting",
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
					event: "disconnecting",
					namespace: validatedNamespaceConstant,
					message: "No room instance found for code",
				});
				return;
			}

			// Check if the player is a valid player
			const player = playersRegistry.get(token);
			if (!player) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "disconnecting",
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
					event: "disconnecting",
					namespace: validatedNamespaceConstant,
					message: "Player is host of room",
				});

				// Resets the game, though does not kick the players
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
			event: "disconnecting",
			namespace: validatedNamespaceConstant,
			message: "user disconnected",
		});
	});

	/**
	 * disconnect
	 * Here the rooms for a socket are empty.
	 */
	socket.on("disconnect", () => {
		const token = socket.handshake.auth.token;
		// socket.rooms.size === 0 here
		logger.log({
			socketId: socket.id,
			token: token,
			event: "disconnect",
			namespace: validatedNamespaceConstant,
			message: "user disconnected",
		});
	});
});
