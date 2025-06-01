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
const API_URL = process.env.WS_SERVER_URL || `http://localhost:${PORT}`;

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
const staticFileDirectoryPath = "../../client/dist";
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

app.get("/room/:code", (_req, res) => {
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
	logger.log(`Server is running on port ${process.env.WS_SERVER_URL}`);
});

const roomsRegistry = new Map<string, RoomInstance>();
const playersRegistry = new Map<string, PlayerInstance>();
const gamePacksRegistry = new Map<string, GamePack>();

gamePacksRegistry.set("entertainment_pack", entertainment_pack);
logger.log("gamePacksRegistry", gamePacksRegistry);

const validatedNamespaceConstant = process.env.WS_VALIDATED_NAMESPACE;
const validatedNamespace = io.of(`/${validatedNamespaceConstant}`);

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
			data: {
				token: token,
			},
		});

		// Generate a new UUID
		const newUUID = crypto.randomUUID();
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			event: "connection_helper",
			message: "Creating new player instance",
			data: {
				newUUID: newUUID,
			},
		});
		const newPlayer = new PlayerInstance();
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
	return;
}

function rejoinRoomsHelper(socket: Socket) {
	logger.log({
		socketId: socket.id,
		token: socket.handshake.auth.token,
		namespace: validatedNamespaceConstant,
		event: "rejoin_rooms_helper",
		message: "Rejoining rooms for player",
	});

	const token = socket.handshake.auth.token;
	const player = playersRegistry.get(token);

	if (!player) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			event: "rejoin_rooms_helper",
			message: "No player instance found for token",
			data: {
				token: token,
			},
		});
		return;
	}

	for (const room of roomsRegistry.values()) {
		if (room.isInPlayers(player) && !socket.rooms.has(room.getId())) {
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				event: "rejoin_rooms_helper",
				message: "Rejoining room",
				data: room.getId(),
			});
			socket.join(room.getId());
		}
	}
	return;
}

/**
 * connection
 * This event is fired when a new socket connection is established.
 */
validatedNamespace.on("connection", (socket) => {
	onConnectionHelper(socket);
	rejoinRoomsHelper(socket);

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
			message: "Check if already created game before",
			data: {
				token: token,
			},
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
				data: {
					token: token,
				},
			});
			return;
		}
		// Check if player is already a host of a room
		for (const room of roomsRegistry.values()) {
			if (room.isHost(player)) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "check_if_already_created_game_before",
					namespace: validatedNamespaceConstant,
					message: "Player already a host of a room",
				});

				// Add player to players array in room
				room.addPlayer(player);

				// Let socket join the room
				socket.join(room.getId());

				socket.emit("check_if_already_created_game_before_response", {
					roomCode: room.getId(),
					toastMessage: "You are already a host of a room",
				});
				return;
			}
		}
		return;
	});

	/**
	 * check_if_player_name_exists
	 * This event is fired when the client emits a check_if_player_name_exists event.
	 */
	socket.on("check_if_player_name_exists", () => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "check_if_player_name_exists",
			namespace: validatedNamespaceConstant,
			message: "Check if player name exists",
			data: {
				token: token,
			},
		});

		// Check if player already exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_player_name_exists",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: {
					token: token,
				},
			});
			return;
		}

		socket.emit("check_if_player_name_exists_response", {
			name: player.getName() ? player.getName() : null,
		});
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
				data: data,
			});
			return;
		}

		// Set player name
		player.setName(data.name);

		// Ensure that player, creating the room, is not already a host of a room
		// Iterate through all rooms, and check if the player matches the host
		for (const roomInstanceId of roomsRegistry.values()) {
			const room = roomsRegistry.get(roomInstanceId.getId());
			if (!room) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "create_game",
					namespace: validatedNamespaceConstant,
					message: "No room instance found for code",
					data: {
						roomId: roomInstanceId.getId(),
					},
				});
				continue;
			}
			if (room.isHost(player)) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "create_game",
					namespace: validatedNamespaceConstant,
					message: "Player already a host of a room",
					data: {
						player: player,
						room: room.getId(),
					},
				});

				// Add player to players array in room
				room.addPlayer(player);

				// Let socket join the room
				socket.join(room.getId());

				// TODO: make host join their own already created room
				socket.emit("check_if_already_created_game_before_response", {
					roomCode: room.getId(),
					toastMessage: "You are already a host of a room",
				});

				return;
			}
		}

		// Create new room
		const newRoom = new RoomInstance(player);

		// Add room to registry
		roomsRegistry.set(newRoom.getId(), newRoom);

		// Add player to players array
		newRoom.addPlayer(player);

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

		socket.emit("check_if_already_created_game_before_response", {
			roomCode: newRoom.getId(),
			toastMessage: "You have created a new game",
		});
	});

	/**
	 * join_game
	 * This event is fired when the client emits a join_game event.
	 */
	socket.on("join_game", (data: { name: string | null; code: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "join_game",
			namespace: validatedNamespaceConstant,
			message: "create room",
			data: data,
		});

		// Check if room already exists
		const room = roomsRegistry.get(data.code);
		if (!room) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "join_game",
				namespace: validatedNamespaceConstant,
				message: "No room instance found for code",
				data: data,
			});
			return;
		}

		// Check if player already exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "join_game",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: data,
			});
			return;
		}

		// check if player is host of the room
		if (room.isHost(player)) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "join_game",
				namespace: validatedNamespaceConstant,
				message: "Player is host of room",
				data: {
					player: player,
					room: room.getId(),
				},
			});

			socket.emit("check_if_already_created_game_before_response", {
				roomCode: room.getId(),
				toastMessage: `You are the host of the room ${data.code}`,
			});
			return;
		}

		// Set player name
		// Ensure that if player already has a name, null will be passed
		if (data.name) {
			// If the player does not have a name, set it to the provided name
			logger.log({
				socketId: socket.id,
				token: token,
				event: "join_game",
				namespace: validatedNamespaceConstant,
				message: "Setting player name for player instance",
				data: data,
			});
			player.setName(data.name);
		}

		// Check if player is already in the room
		if (room.isInPlayers(player)) {
			// TODO: need to handle logic here to rejoin? or will this ever happen?
			// If a player is already apart of the players, and you cannot join when it's in game, that means this player must rejoin the game since they are apart of it and accidentally disconnected
			logger.log({
				socketId: socket.id,
				token: token,
				event: "join_game",
				namespace: validatedNamespaceConstant,
				message: "Player already in room",
				data: {
					player: player,
					room: room.getId(),
				},
			});

			socket.emit("check_if_already_created_game_before_response", {
				roomCode: room.getId(),
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
				data: {
					player: player,
					room: room.getId(),
				},
			});
			return;
		}

		// Add player to players array
		room.addPlayer(player);

		// Let socket join the room
		socket.join(room.getId());

		// Emit to the player that they have joined the game
		socket.emit("check_if_already_created_game_before_response", {
			roomCode: room.getId(),
		});

		// Send to all players in the room
		validatedNamespace
			.to(room.getId())
			.emit("player_joined_game_broadcast_all", {
				player: {
					id: player.getId(),
					name: player.getName(),
				},
				playersInLobby: room.getPlayers(),
			});
	});

	/**
	 * direct_join_game
	 * This event is fired when the client emits a direct_join_game event.
	 */
	socket.on("direct_join_game", (data: { name: string; code: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "direct_join_game",
			namespace: validatedNamespaceConstant,
			message: "direct join game",
			data: data,
		});
		// Check if room already exists
		const room = roomsRegistry.get(data.code);
		if (!room) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "direct_join_game",
				namespace: validatedNamespaceConstant,
				message: "No room instance found for code",
				data: data,
			});
			return;
		}

		// Check if player already exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "direct_join_game",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: data,
			});
			return;
		}
		if (!player?.getName()) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "direct_join_game",
				namespace: validatedNamespaceConstant,
				message: "Setting player name for player instance",
				data: data,
			});

			player.setName(data.name);

			// Add player to players array
			room.addPlayer(player);

			// Let socket join the room
			socket.join(room.getId());

			logger.log({
				socketId: socket.id,
				token: token,
				event: "direct_join_game",
				namespace: validatedNamespaceConstant,
				message: "new player name set",
				data: player,
			});

			socket.emit("direct_join_game_response", {
				roomCode: room.getId(),
				playersInLobby: room.getPlayers(),
				toastMessage: `You have joined the game as ${player.getName()}`,
			});

			// Send to all players in the room
			validatedNamespace
				.to(room.getId())
				.emit("player_joined_game_broadcast_all", {
					player: {
						id: player.getId(),
						name: player.getName(),
					},
					playersInLobby: room.getPlayers(),
				});

			return;
		}
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
				data: data,
			});
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "not_allowed",
				toastMessage: `The room ${data.code} does not exist`,
			});
			return;
		}
		// Check if player already exists, but has no name
		// The current setup will make it so the player is created before this, so there will always be a player instance
		const player = playersRegistry.get(token);
		if (!player?.getName()) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message:
					"Socket is attempting direct join. Player exists but has no name",
				data: data,
			});
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_register",
				toastMessage:
					"You are allowed to join the game, but you need a name first",
			});
			return;
		}
		// Check if player is the host of the room
		if (room.isHost(player)) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message: "Player is host of room",
				data: {
					player: player,
					room: room.getId(),
				},
			});

			// Makre sure to re-add the player to the room
			room.addPlayer(player);

			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_join",
				isHost: true,
				playersInLobby: room.getPlayers(),
				toastMessage: "You can join - welcome back, host!",
			});

			// Send to all players in the room
			validatedNamespace
				.to(room.getId())
				.emit("player_joined_game_broadcast_all", {
					player: {
						id: player.getId(),
						name: player.getName(),
					},
					playersInLobby: room.getPlayers(),
				});

			return;
		}
		// Check if player is not in the room
		if (!room.isInPlayers(player)) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message: "Player not in room",
				data: {
					player: player,
					room: room.getId(),
				},
			});

			// Check if game is already in progress
			if (room.getGameState() === "in_game") {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "check_if_allowed_in_game",
					namespace: validatedNamespaceConstant,
					message: "Game is already in progress",
					data: {
						player: player,
						room: room.getId(),
					},
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
				data: {
					player: player,
					room: room.getId(),
				},
			});

			// Makre sure to re-add the player to the room
			room.addPlayer(player);

			// If it is not in progress, then the player can join the game
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_join",
				playersInLobby: room.getPlayers(),
				toastMessage: `Joined room ${data.code}`,
			});
			return;
		}

		// player is already in the room
		logger.log({
			socketId: socket.id,
			token: token,
			event: "check_if_allowed_in_game",
			namespace: validatedNamespaceConstant,
			message: "Player already in room",
			data: {
				player: player,
				room: room.getId(),
			},
		});
		socket.emit("check_if_allowed_in_game_response", {
			allowedState: "allow_join",
			playersInLobby: room.getPlayers(),
			toastMessage: `You are already in the room ${data.code}`,
		});
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

		logger.log(socket.rooms);

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

		// Go through all rooms, and make sure to remove the player from the room
		for (const roomInstanceId of socket.rooms) {
			// Check if the roomId is a valid room
			const room = roomsRegistry.get(roomInstanceId);
			if (!room) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "disconnecting",
					namespace: validatedNamespaceConstant,
					message: "No room instance found for code",
					data: {
						roomId: roomInstanceId,
					},
				});
				// If we dont find one, we contine
				continue;
			}

			// !IMPORTANT, if the socket is a player, that is a host of a room, reset the game (everyone goes back to lobby)
			if (room.getHost().getId() === player.getId()) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "disconnecting",
					namespace: validatedNamespaceConstant,
					message: "Player is host of room",
					data: {
						roomId: room.getId(),
						playerId: player.getId(),
					},
				});

				// Resets the game, though does not kick the players
				room.resetGame();

				validatedNamespace.to(room.getId()).emit("host_disconnected", {
					host: player.getId(),
				});
			}

			validatedNamespace
				.to(room.getId())
				.emit("player_disconnected_broadcast_all", {
					player: { id: player.getId(), name: player.getName() },
					playersInLobby: room.getPlayers(),
				});

			// Remove player from room (removes them from all lists)
			room.removePlayer(player);

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
