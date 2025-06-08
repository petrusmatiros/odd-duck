import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { createServer } from "node:http";
import { Namespace, Server, type Socket } from "socket.io";
import helmet from "helmet";
import path from "node:path";

import { Logger } from "../utils/log-utils";

import { PlayerInstance } from "./PlayerInstance/PlayerInstance";
import { RoomInstance } from "./RoomInstance/Roominstance";
import { entertainment_pack } from "../data/packs/entertainment_pack";
import type {
	GameLocation,
	GamePack,
	GameSupportedLanguages,
} from "../data/types";
import { dark_pack } from "../data/packs/dark_pack";
import { urban_living_pack } from "../data/packs/urban_living_pack";
import { pickRandom } from "../utils/random-utils";

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
gamePacksRegistry.set("urban_living_pack", urban_living_pack);
gamePacksRegistry.set("dark_pack", dark_pack);
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

	// Join the player's own room
	socket.join(player.getId());

	for (const room of roomsRegistry.values()) {
		/**
		 * !IMPORTANT:
		 * When a host creates a game, and go to /room from the index page - the socket disconnects.
		 * This make the socket leave it's rooms
		 * Two cases:
		 * 1. Player is not in room. but is host of room, has to rejoin
		 * 2. Player is already in room, has to rejoin
		 */
		// Not in the room, but is host of the room
		if (!room.hasPlayer(player) && room.getHost().getId() === player.getId()) {
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				event: "rejoin_rooms_helper",
				message: "Rejoining room as host",
				data: room.getId(),
			});
			socket.join(room.getId());
		}
		// Player is already in the room
		if (room.hasPlayer(player)) {
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

function leaveAllPreviousRoomsHelper(socket: Socket) {
	const token = socket.handshake.auth.token;
	logger.log({
		socketId: socket.id,
		token: token,
		namespace: validatedNamespaceConstant,
		event: "leave_all_previous_rooms_helper",
		message: "Leaving all previous rooms for player",
	});
	// Check if player exists
	const player = playersRegistry.get(token);
	if (!player) {
		logger.log({
			socketId: socket.id,
			token: token,
			namespace: validatedNamespaceConstant,
			event: "leave_all_previous_rooms_helper",
			message: "No player instance found for token",
			data: {
				token: token,
			},
		});
		return;
	}
	// Leave all rooms that the player is in
	for (const room of roomsRegistry.values()) {
		if (room.getHost().getId() === player.getId()) {
			// Skip leaving the room if the player is the host of that room
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				event: "leave_all_previous_rooms_helper",
				message: "Skipping leaving room as host",
				data: room.getId(),
			});
			continue;
		}
		if (room.hasPlayer(player)) {
			logger.log({
				socketId: socket.id,
				token: token,
				namespace: validatedNamespaceConstant,
				event: "leave_all_previous_rooms_helper",
				message: "Leaving room",
				data: room.getId(),
			});
			socket.leave(room.getId());
			room.removePlayer(player);
		}
	}
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
		// Leave all previous rooms
		leaveAllPreviousRoomsHelper(socket);

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
		if (room.hasPlayer(player)) {
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

		// Here the player is not a part of the room, is not the host, and the game is not in progress

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
		// Leave all previous rooms
		leaveAllPreviousRoomsHelper(socket);

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

		// This occurs, when a player has a token, but has not set a name yet, and is trying to join directly (if someone directly joins via link)
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
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "check_if_allowed_in_game",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: data,
			});
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "not_allowed",
				toastMessage: "You are not registered as a player",
			});
			return;
		}
		// This occurs when a player gets a new token, and has to input a new name
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

			// But if game is already in progress, then the player cannot join
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

			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_register",
				isHost: room.getHost().getId(),
				playerId: player.getId(),
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

			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_join",
				isHost: room.getHost().getId(),
				playersInLobby: room.getPlayers(),
				playerId: player.getId(),
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
		if (!room.hasPlayer(player)) {
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

			// Make sure to re-add the player to the room
			room.addPlayer(player);

			// Let socket join the room, since it cannot be done in the rejoinRoomsHelper.
			socket.join(room.getId());

			// If it is not in progress, then the player can join the game
			socket.emit("check_if_allowed_in_game_response", {
				allowedState: "allow_join",
				playersInLobby: room.getPlayers(),
				playerId: player.getId(),
				isHost: room.getHost().getId(),
				toastMessage: `Joined room ${data.code}`,
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

		// player is already in the room, so they can join
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
			playerId: player.getId(),
			isHost: room.getHost().getId(),
			toastMessage: `You are already in the room ${data.code}`,
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
	 * get_current_username
	 * This event is fired when the client emits a get_current_username event.
	 */
	socket.on("get_current_username", () => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "get_current_username",
			namespace: validatedNamespaceConstant,
			message: "get current username",
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
				event: "get_current_username",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: {
					token: token,
				},
			});
			return;
		}
		// Emit to the player that their name has been retrieved
		socket.emit("get_current_username_response", {
			toastMessage: `Your current name is ${player.getName()}`,
			name: player.getName(),
		});
	});

	/**
	 * change_username
	 * This event is fired when the client emits a change_username event.
	 */
	socket.on("change_username", (data: { name: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "change_username",
			namespace: validatedNamespaceConstant,
			message: "change username",
			data: data,
		});
		// Check if player already exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "change_username",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: data,
			});
			return;
		}
		// Set player name
		player.setName(data.name);
		logger.log({
			socketId: socket.id,
			token: token,
			event: "change_username",
			namespace: validatedNamespaceConstant,
			message: "Player name changed",
			data: {
				player: player,
			},
		});
		// Emit to the player that their name has been changed
		socket.emit("change_username_response", {
			toastMessage: `Your name has been changed to ${data.name}`,
		});
	});

	/**
	 * kick_player
	 * This event is fired when the client emits a kick_player event.
	 */
	socket.on("kick_player", (data: { playerId: string; code: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "kick_player",
			namespace: validatedNamespaceConstant,
			message: "kick player",
			data: data,
		});
		// Check if room exists
		const room = roomsRegistry.get(data.code);
		if (!room) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "kick_player",
				namespace: validatedNamespaceConstant,
				message: "No room instance found for code",
				data: data,
			});
			return;
		}
		// Check if player exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "kick_player",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: data,
			});
			return;
		}
		// Check if player is the host of the room
		if (!room.isHost(player)) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "kick_player",
				namespace: validatedNamespaceConstant,
				message: "Player is not the host of the room",
				data: {
					player: player,
					room: room.getId(),
				},
			});
			return;
		}
		// Check if player to kick exists
		const playerToKick = Array.from(playersRegistry.values()).find(
			(p) => p.getId() === data.playerId,
		);
		if (!playerToKick) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "kick_player",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for player to kick",
				data: {
					playerId: data.playerId,
					room: room.getId(),
				},
			});
			return;
		}

		// Check if the player to kick is in the room
		if (!room.hasPlayer(playerToKick)) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "kick_player",
				namespace: validatedNamespaceConstant,
				message: "Player to kick is not in the room",
				data: {
					playerId: data.playerId,
					room: room.getId(),
				},
			});
			return;
		}
		// If all checks pass, kick the player from the room
		room.removePlayer(playerToKick);

		// Emit to the player that they have been kicked
		validatedNamespace.to(playerToKick.getId()).emit("kick_player_response", {
			toastMessage: `You have been kicked from the room ${data.code}`,
		});

		// Emit to all players in the room that the player has left
		validatedNamespace
			.to(room.getId())
			.emit("player_disconnected_broadcast_all", {
				player: {
					id: playerToKick.getId(),
					name: playerToKick.getName(),
				},
				playersInLobby: room.getPlayers(),
			});
	});

	/**
	 * pause_game
	 * This event is fired when the client emits a pause_game event.
	 */
	socket.on("toggle_pause_game", (data: { code: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "toggle_pause_game",
			namespace: validatedNamespaceConstant,
			message: "pause game",
			data: data,
		});
		// Check if room exists
		const room = roomsRegistry.get(data.code);
		if (!room) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "toggle_pause_game",
				namespace: validatedNamespaceConstant,
				message: "No room instance found for code",
				data: data,
			});
			return;
		}
		// Check if player exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "toggle_pause_game",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: data,
			});
			return;
		}
		// Check if player is the host of the room
		if (!room.isHost(player)) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "toggle_pause_game",
				namespace: validatedNamespaceConstant,
				message: "Player is not the host of the room",
				data: {
					player: player,
					room: room.getId(),
				},
			});
			return;
		}

		// Game must be in progress to toggle pause
		if (room.getGameState() !== "in_game") {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "toggle_pause_game",
				namespace: validatedNamespaceConstant,
				message: "Game is not in progress",
				data: {
					player: player,
					room: room.getId(),
				},
			});
			return;
		}

		const timerState = room.getTimer().getState();

		// Toggle pause state
		if (timerState === "paused") {
			room.getTimer().resume();
			logger.log({
				socketId: socket.id,
				token: token,
				event: "toggle_pause_game",
				namespace: validatedNamespaceConstant,
				message: "Game resumed",
				data: {
					room: room.getId(),
				},
			});
			// Emit to all players in the room that the game has resumed
			validatedNamespace
				.to(room.getId())
				.emit("toggle_pause_game_broadcast_all", {
					toastMessage: "The game has been resumed",
					timerState: room.getTimer().getState(),
				});
		} else if (timerState === "running") {
			room.getTimer().pause();
			logger.log({
				socketId: socket.id,
				token: token,
				event: "toggle_pause_game",
				namespace: validatedNamespaceConstant,
				message: "Game paused",
				data: {
					room: room.getId(),
				},
			});
			// Emit to all players in the room that the game has paused
			validatedNamespace
				.to(room.getId())
				.emit("toggle_pause_game_broadcast_all", {
					toastMessage: "The game has been paused",
					timerState: room.getTimer().getState(),
				});
		} else {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "toggle_pause_game",
				namespace: validatedNamespaceConstant,
				message: "Game timer is in an unexpected state",
				data: {
					room: room.getId(),
				},
			});
			return;
		}
	});

	/**
	 * end_game
	 * This event is fired when the client emits a end_game event.
	 */
	socket.on("end_game", (data: { code: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "end_game",
			namespace: validatedNamespaceConstant,
			message: "end game",
			data: data,
		});
		// Check if room exists
		const room = roomsRegistry.get(data.code);
		if (!room) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "end_game",
				namespace: validatedNamespaceConstant,
				message: "No room instance found for code",
				data: data,
			});
			return;
		}
		// Check if player exists
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "end_game",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
				data: data,
			});
			return;
		}
		// Check if player is the host of the room
		if (!room.isHost(player)) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "end_game",
				namespace: validatedNamespaceConstant,
				message: "Player is not the host of the room",
				data: {
					player: player,
					room: room.getId(),
				},
			});
			return;
		}
		// reset game state
		room.resetGame();
		logger.log({
			socketId: socket.id,
			token: token,
			event: "end_game",
			namespace: validatedNamespaceConstant,
			message: "Game ended",
			data: {
				room: room.getId(),
			},
		});
		// Emit to all players in the room that the game has ended
		validatedNamespace.to(room.getId()).emit("end_game_broadcast_all", {
			toastMessage: `The game has ended by the host ${player.getName()}`,
			playersInLobby: room.getPlayers(),
		});
		// Send new game state to all players in the room
		// We set everything except gameState and gamePacks to null, since when starting the game again, they will be computed again
		validatedNamespace.to(room.getId()).emit("get_game_state_response", {
			gameState: room.getGameState(),
			gamePacks: Array.from(gamePacksRegistry.values()),
			gamePack: null,
			location: null,
			playerRole: null,
			timeLeft: null,
			timerState: null,
		});
	});

	/**
	 * get_game_state
	 * This event is fired when the client emits a get_game_state event.
	 */
	socket.on(
		"get_game_state",
		(data: { code: string; locale: GameSupportedLanguages }) => {
			const token = socket.handshake.auth.token;
			logger.log({
				socketId: socket.id,
				token: token,
				event: "get_game_state",
				namespace: validatedNamespaceConstant,
				message: "get game state",
				data: data,
			});
			// Check if room exists
			const room = roomsRegistry.get(data.code);
			if (!room) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "get_game_state",
					namespace: validatedNamespaceConstant,
					message: "No room instance found for code",
					data: data,
				});
				return;
			}
			// Check if player exists
			const player = playersRegistry.get(token);
			if (!player) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "get_game_state",
					namespace: validatedNamespaceConstant,
					message: "No player instance found for token",
					data: data,
				});
				return;
			}
			// Check if player is in the room
			if (!room.hasPlayer(player)) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "get_game_state",
					namespace: validatedNamespaceConstant,
					message: "Player is not in the room",
					data: {
						player: player,
						room: room.getId(),
					},
				});
				return;
			}

			const locationId = room.getLocation();
			const gamePackId = room.getGamePackId();
			let playerRole: string | null = null;
			let locationObject: GameLocation | null = null;
			// If game state is in lobby, playerRole and locationObject will be null
			// If game state is in game, we will get the location and player role

			if (room.getGameState() === "in_game") {
				if (!locationId) {
					logger.log({
						socketId: socket.id,
						token: token,
						event: "get_game_state",
						namespace: validatedNamespaceConstant,
						message: "No location id set for room",
						data: data,
					});
					return;
				}
				if (!gamePackId) {
					logger.log({
						socketId: socket.id,
						token: token,
						event: "get_game_state",
						namespace: validatedNamespaceConstant,
						message: "No game pack id set for room",
						data: data,
					});
					return;
				}
				const gamePackObject = gamePacksRegistry.get(gamePackId);

				if (!gamePackObject) {
					logger.log({
						socketId: socket.id,
						token: token,
						event: "get_game_state",
						namespace: validatedNamespaceConstant,
						message: "No location object found for game pack id",
						data: data,
					});
					return;
				}

				if (room.hasSpy(player)) {
					playerRole = "spy";
				} else {
					// If player is not a spy, get their civilian role index
					const playerRoleIndex = room.getCivilianRole(player);

					if (!playerRoleIndex) {
						logger.log({
							socketId: socket.id,
							token: token,
							event: "get_game_state",
							namespace: validatedNamespaceConstant,
							message: "No player role index found for player",
							data: data,
						});
						return;
					}

					if (!data.locale) {
						logger.log({
							socketId: socket.id,
							token: token,
							event: "get_game_state",
							namespace: validatedNamespaceConstant,
							message: "No locale provided for player",
							data: data,
						});
						return;
					}

					// Location object is asigned a value here, so the spy will not have a location object
					locationObject =
						gamePackObject.locations.find((loc) => loc.id === locationId) ??
						null;

					if (!locationObject) {
						logger.log({
							socketId: socket.id,
							token: token,
							event: "get_game_state",
							namespace: validatedNamespaceConstant,
							message: "No location object found for location id",
							data: data,
						});
						return;
					}

					const foundPlayerRole =
						locationObject.translations[data.locale].roles[playerRoleIndex];

					if (!foundPlayerRole) {
						logger.log({
							socketId: socket.id,
							token: token,
							event: "get_game_state",
							namespace: validatedNamespaceConstant,
							message: "No player role found for player",
							data: data,
						});
						return;
					}
					playerRole = foundPlayerRole;
				}
			}

			// Emit the game state to the client
			// !IMPORTANT, location may not be sent to the spy
			socket.emit("get_game_state_response", {
				gameState: room.getGameState(),
				gamePacks: Array.from(gamePacksRegistry.values()),
				gamePack: gamePackId ? gamePacksRegistry.get(gamePackId) : null,
				location: locationObject,
				playerRole: playerRole,
				timeLeft: room.getTimer().getTimeLeft(),
				timerState: room.getTimer().getState(),
			});
		},
	);

	/**
	 * get_game_packs
	 * This event is fired when the client emits a get_game_packs event.
	 */
	socket.on("get_game_packs", () => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "get_game_packs",
			namespace: validatedNamespaceConstant,
			message: "get game packs",
			data: {
				token: token,
			},
		});
		// Emit the game packs to the client
		socket.emit("get_game_packs_response", {
			gamePacks: Array.from(gamePacksRegistry.values()),
		});
	});

	/**
	 * get_current_game_pack
	 * This event is fired when the client emits a get_current_game_pack event.
	 */
	socket.on("get_current_game_pack", (data: { code: string }) => {
		const token = socket.handshake.auth.token;
		logger.log({
			socketId: socket.id,
			token: token,
			event: "get_current_game_pack",
			namespace: validatedNamespaceConstant,
			message: "get current game pack",
			data: data,
		});
		// Check if room exists
		const room = roomsRegistry.get(data.code);
		if (!room) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "get_current_game_pack",
				namespace: validatedNamespaceConstant,
				message: "No room instance found for code",
				data: data,
			});
			return;
		}
		// Check if game pack exists
		const gamePackId = room.getGamePackId();
		if (!gamePackId) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "get_current_game_pack",
				namespace: validatedNamespaceConstant,
				message: "No game pack id set for room",
				data: data,
			});
			return;
		}
		const gamePack = gamePacksRegistry.get(gamePackId);
		if (!gamePack) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "get_current_game_pack",
				namespace: validatedNamespaceConstant,
				message: "No game pack instance found for id",
				data: data,
			});
			return;
		}
		// Just send entire game pack
		socket.emit("get_current_game_pack_response", {
			gamePack: gamePack,
		});
	});

	/**
	 * start_game
	 * This event is fired when the client emits a start_game event.
	 */
	socket.on(
		"start_game",
		(data: { code: string; gamePackId: string; durationInMinutes: string }) => {
			const token = socket.handshake.auth.token;
			logger.log({
				socketId: socket.id,
				token: token,
				event: "start_game",
				namespace: validatedNamespaceConstant,
				message: "start game",
				data: data,
			});
			// Check if room exists
			const room = roomsRegistry.get(data.code);
			if (!room) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "No room instance found for code",
					data: data,
				});
				return;
			}
			// Start conditions here:
			// 1. Player that issued the event is the host of the room
			// 2. Room has at least 2 players
			// 3. Don't care about checking game state, just reset it
			const player = playersRegistry.get(token);
			if (!player) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "No player instance found for token",
					data: data,
				});
				return;
			}
			if (!room.isHost(player)) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "Player is not the host of the room",
					data: {
						player: player,
						room: room.getId(),
					},
				});
				validatedNamespace
					.to(room.getId())
					.emit("start_game_response_broadcast_all", {
						gameStarted: false,
						toastMessage: "Player that issued the start event is not the host",
					});
				return;
			}
			if (room.getPlayers().length < 2) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "Not enough players to start the game",
					data: {
						player: player,
						room: room.getId(),
					},
				});
				validatedNamespace
					.to(room.getId())
					.emit("start_game_response_broadcast_all", {
						gameStarted: false,
						toastMessage: "Not enough players to start the game",
					});
				return;
			}

			// Reset the game
			room.resetGame();

			if (!data.gamePackId) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "No game pack id provided",
					data: data,
				});
				validatedNamespace
					.to(room.getId())
					.emit("start_game_response_broadcast_all", {
						gameStarted: false,
						toastMessage: "No game pack id provided",
					});
				return;
			}

			// Pick random location out of pack
			const gamePack = gamePacksRegistry.get(data.gamePackId);
			if (!gamePack) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "No game pack instance found for id",
					data: data,
				});
				validatedNamespace
					.to(room.getId())
					.emit("start_game_response_broadcast_all", {
						gameStarted: false,
						toastMessage: "No game pack found for id",
					});
				return;
			}

			// Set game pack to the room, and pick location
			room.setGamePackId(data.gamePackId);

			// Ensure that provided duration is a number
			if (!data.durationInMinutes) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "No duration provided",
					data: data,
				});
				validatedNamespace
					.to(room.getId())
					.emit("start_game_response_broadcast_all", {
						gameStarted: false,
						toastMessage: "No duration provided",
					});
				return;
			}
			const durationInMinutes = Number.parseInt(data.durationInMinutes, 10);
			if (Number.isNaN(durationInMinutes) || durationInMinutes <= 0) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "Invalid duration provided",
					data: data,
				});
				validatedNamespace
					.to(room.getId())
					.emit("start_game_response_broadcast_all", {
						gameStarted: false,
						toastMessage: "Invalid duration provided",
					});
				return;
			}

			// Set the timer duration
			room.getTimer().setDuration(durationInMinutes);

			const gamePackLocations = gamePack.locations;

			// Pick random location from the game pack
			const randomLocation = pickRandom(0, gamePackLocations.length - 1);
			const location = gamePackLocations[randomLocation];
			if (!location) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "start_game",
					namespace: validatedNamespaceConstant,
					message: "No location found in game pack",
					data: data,
				});
				validatedNamespace
					.to(room.getId())
					.emit("start_game_response_broadcast_all", {
						gameStarted: false,
						toastMessage: "No location found in game pack",
					});
				return;
			}
			// Set location to the room
			room.setLocation(location.id);

			// Pass socket event to be emitted by the room's timer instance
			// The startGame function will handle assignment of roles, starting the timer, and broadcasting the event
			room.startGame({
				roles: location.translations.en.roles,
				socketNamespace: validatedNamespace,
				room: room,
				socketEvent: "timer_response_broadcast_all",
			});

			logger.log({
				socketId: socket.id,
				token: token,
				event: "start_game",
				namespace: validatedNamespaceConstant,
				message: "Game started",
				data: {
					roomId: room.getId(),
					playerId: player.getId(),
					gamePackId: data.gamePackId,
					location: location.id,
				},
			});
			// Emit to all players in the room that the game has started
			validatedNamespace
				.to(room.getId())
				.emit("start_game_response_broadcast_all", {
					gameStarted: true,
					toastMessage: `Game started in room ${room.getId()}`,
				});
		},
	);

	/**
	 * disconnect
	 * Here the rooms for a socket are empty.
	 * Issue: is called 4 times when a player disconnects.
	 */
	socket.on("disconnect", () => {
		const token = socket.handshake.auth.token;
		// socket.rooms.size === 0 here

		// Check if the player is a valid player
		const player = playersRegistry.get(token);
		if (!player) {
			logger.log({
				socketId: socket.id,
				token: token,
				event: "disconnect",
				namespace: validatedNamespaceConstant,
				message: "No player instance found for token",
			});
			return;
		}

		for (const room of roomsRegistry.values()) {
			// Do not emit to all others if the player is not in the room
			if (!room.hasPlayer(player)) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "disconnect",
					namespace: validatedNamespaceConstant,
					message: "Player is not in the room",
					data: {
						roomId: room.getId(),
						playerId: player.getId(),
					},
				});
				continue;
			}

			// If the player is a host of the room, reset the game
			if (room.getHost().getId() === player.getId()) {
				logger.log({
					socketId: socket.id,
					token: token,
					event: "disconnect",
					namespace: validatedNamespaceConstant,
					message: "Player is host of the room",
					data: {
						roomId: room.getId(),
						playerId: player.getId(),
					},
				});
			} else {
				// !IMPORTANT, we do not remove a player from the room, IF the game is in progress.
				if (room.getGameState() === "in_lobby") {
					room.removePlayer(player);
					logger.log({
						socketId: socket.id,
						token: token,
						event: "disconnect",
						namespace: validatedNamespaceConstant,
						message: "Player removed from room (in_lobby)",
						data: {
							roomId: room.getId(),
							playerId: player.getId(),
						},
					});
				}
				validatedNamespace
					.to(room.getId())
					.emit("player_disconnected_broadcast_all", {
						player: { id: player.getId(), name: player.getName() },
						playersInLobby: room.getPlayers(),
					});
			}
		}

		logger.log({
			socketId: socket.id,
			token: token,
			event: "disconnect",
			namespace: validatedNamespaceConstant,
			message: "user disconnected",
		});

		/**
		 * !IMPORTANT, We do this, since the disconnect event is triggered 4 times (unknown reason).
		 * There are still sockets with the same token, so we need to clean them up.
		 */
		// Find all sockets that contain the same token
		const socketValues = Array.from(validatedNamespace.sockets.values());
		const socketsWithToken = socketValues?.filter(
			(sock) => sock.handshake.auth.token === token,
		);
		// No cleanup needed if no sockets with the token
		if (socketsWithToken.length === 0) {
			logger.info("===DISCONNECTED===");
			return;
		}
		// Cleanup needed if there are sockets with the token
		for (const sock of socketsWithToken) {
			sock.handshake.auth.token = null;
		}
		logger.info("===DISCONNECTED WITH CLEANUP===");
	});
});
