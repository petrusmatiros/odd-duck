import cryptoRandomString from "crypto-random-string";
import { TimerInstance } from "../TimerInstance/TimerInstance";
import type { PlayerInstance } from "../PlayerInstance/PlayerInstance";
import type { GameLocation } from "../../data/types";
import { pickRandom } from "../../utils/random-utils";
import type { Namespace } from "socket.io";

export class RoomInstance {
	id: string;
	host: PlayerInstance;
	location: GameLocation["id"] | null;
	players: PlayerInstance[];
	spies: PlayerInstance[];
	civilians: PlayerInstance[];
	civilianRoles: Map<string, string>;
	gamePackId: string | null;
	timer: TimerInstance;
	gameState: "in_lobby" | "in_game";

	constructor(host: PlayerInstance) {
		this.id = cryptoRandomString({ length: 6, type: "distinguishable" });
		this.host = host;
		this.location = null;
		this.players = [];
		this.spies = [];
		this.civilians = [];
		this.civilianRoles = new Map<string, string>();
		this.gamePackId = null;
		// Default timer set to 5 minutes
		this.timer = new TimerInstance(5);
		this.gameState = "in_lobby";
	}
	getId() {
		return this.id;
	}
	setId(newId: string) {
		this.id = newId;
	}
	getHost() {
		return this.host;
	}
	setHost(newHost: PlayerInstance) {
		this.host = newHost;
	}
	isHost(player: PlayerInstance) {
		return this.host?.getId() === player.getId();
	}
	getLocation() {
		return this.location;
	}
	setLocation(newLocation: GameLocation["id"]) {
		this.location = newLocation;
	}
	addPlayer(player: PlayerInstance) {
		const found = this.players.find((p) => p.getId() === player.getId());
		if (!found) {
			this.players.push(player);
		}
	}
	/**
	 * Removes a player from the room (removes from all lists in the room).
	 * @param {string} player - The player to remove.
	 *
	 */
	removePlayer(player: PlayerInstance) {
		// Remove player from all lists since player is the lobby list, but spies and civilians are in game lists
		this.players = this.players.filter((p) => p.getId() !== player.getId());
		this.civilians = this.civilians.filter(
			(civ) => civ.getId() !== player.getId(),
		);
		this.spies = this.spies.filter((spy) => spy.getId() !== player.getId());
	}
	getPlayers() {
		return this.players;
	}
	hasPlayer(player: PlayerInstance) {
		return this.players.some((p) => p.getId() === player.getId());
	}
	setPlayers(newPlayers: PlayerInstance[]) {
		this.players = newPlayers;
	}
	addSpy(player: PlayerInstance) {
		const found = this.spies.find((spy) => spy.getId() === player.getId());
		if (!found) {
			this.spies.push(player);
		}
	}
	removeSpy(player: PlayerInstance) {
		this.spies = this.spies.filter((spy) => spy.getId() !== player.getId());
	}
	getSpies() {
		return this.spies;
	}
	hasSpy(player: PlayerInstance) {
		return this.spies.some((spy) => spy.getId() === player.getId());
	}
	setSpies(newSpies: PlayerInstance[]) {
		this.spies = newSpies;
	}
	addCivilian(player: PlayerInstance) {
		const found = this.civilians.find((civ) => civ.getId() === player.getId());
		if (!found) {
			this.civilians.push(player);
		}
	}
	removeCivilian(player: PlayerInstance) {
		this.civilians = this.civilians.filter(
			(civ) => civ.getId() !== player.getId(),
		);
	}
	getCivilians() {
		return this.civilians;
	}
	hasCivilian(player: PlayerInstance) {
		return this.civilians.some((civ) => civ.getId() === player.getId());
	}
	setCivilians(newCivilians: PlayerInstance[]) {
		this.civilians = newCivilians;
	}
	hasCivilianRole(player: PlayerInstance) {
		return this.civilianRoles.has(player.getId());
	}
	addCivilianRole(player: PlayerInstance, role: string) {
		if (!this.hasCivilianRole(player)) {
			this.civilianRoles.set(player.getId(), role);
		}
	}
	removeCivilianRole(player: PlayerInstance) {
		if (this.hasCivilianRole(player)) {
			this.civilianRoles.delete(player.getId());
		}
	}
	getCivilianRole(player: PlayerInstance) {
		return this.civilianRoles.get(player.getId());
	}
	getGamePackId() {
		return this.gamePackId;
	}
	setGamePackId(newGamePackId: string) {
		this.gamePackId = newGamePackId;
	}
	getTimer() {
		return this.timer;
	}
	setTimer(newTimer: TimerInstance) {
		this.timer = newTimer;
	}
	getGameState() {
		return this.gameState;
	}
	setGameState(newState: "in_lobby" | "in_game") {
		this.gameState = newState;
	}
	private assignRolesToPlayers() {
		const totalPlayers = this.players.length;
		// must be atleast 1 spy, and everyone else is a civilian
		const randomPlayerToBeSpy = this.players[pickRandom(0, totalPlayers - 1)];
		this.spies.push(randomPlayerToBeSpy);
		this.civilians = this.players.filter(
			(player) => player.getId() !== randomPlayerToBeSpy.getId(),
		);
	}
	private assignCivilianRoles(roles: string[]) {
		if (this.civilians.length === 0) {
			throw new Error("No civilians to assign roles to.");
		}
		for (const civilian of this.civilians) {
			const randomRole = roles[pickRandom(0, roles.length - 1)];
			this.addCivilianRole(civilian, randomRole);
		}
	}
	startGame({
		roles,
		socketNamespace,
		room,
		socketEvent,
	}: {
		roles: string[];
		socketNamespace: Namespace;
		room: RoomInstance;
		socketEvent: string;
	}) {
		if (!this.location) {
			throw new Error("Cannot start game without a location set.");
		}
		if (!this.gamePackId) {
			throw new Error("Cannot start game without a game pack set.");
		}
		this.assignRolesToPlayers();
		this.assignCivilianRoles(roles);
		this.setGameState("in_game");
		this.timer.start({roles, socketNamespace, room, socketEvent});
	}
	endGame() {
		this.setGameState("in_lobby");
		this.timer.stop();
	}
	resetGame() {
		// we do not reset players, host, gamePackId
		this.location = null;
		this.gamePackId = null;
		this.civilians = [];
		this.spies = [];
		this.timer.reset(0);
		this.setGameState("in_lobby");
	}
}
