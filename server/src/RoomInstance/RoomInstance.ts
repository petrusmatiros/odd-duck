import cryptoRandomString from "crypto-random-string";
import { TimerInstance } from "../TimerInstance/TimerInstance";
import type { PlayerInstance } from "../PlayerInstance/PlayerInstance";
import type { GameLocation } from "../../data/types";

export class RoomInstance {
	id: string;
	host: PlayerInstance["id"] | null;
	location: GameLocation["id"] | null;
	players: PlayerInstance["id"][];
	spies: PlayerInstance["id"][];
	civilians: PlayerInstance["id"][];
	gamePackId: string | null;
	timer: TimerInstance;
	gameState: "in_lobby" | "in_game";

	constructor(host: string) {
		this.id = cryptoRandomString({ length: 6, type: "distinguishable" });
		this.host = host;
		this.location = null;
		this.players = [];
		this.spies = [];
		this.civilians = [];
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
	setHost(newHost: string) {
		this.host = newHost;
	}
	getLocation() {
		return this.location;
	}
	setLocation(newLocation: GameLocation["id"]) {
		this.location = newLocation;
	}
	addPlayer(playerId: string) {
		if (!this.players.includes(playerId)) {
			this.players.push(playerId);
		}
	}
	removePlayer(playerId: string) {
		this.players = this.players.filter((pId) => pId !== playerId);
	}
	getPlayers() {
		return this.players;
	}
	addSpy(playerId: string) {
		if (!this.spies.includes(playerId)) {
			this.spies.push(playerId);
		}
	}
	removeSpy(playerId: string) {
		this.spies = this.spies.filter((pId) => pId !== playerId);
	}
	getSpies() {
		return this.spies;
	}
	addCivilian(playerId: string) {
		if (!this.civilians.includes(playerId)) {
			this.civilians.push(playerId);
		}
	}
	removeCivilian(playerId: string) {
		this.civilians = this.civilians.filter((pId) => pId !== playerId);
	}
	getCivilians() {
		return this.civilians;
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
	startGame() {
		this.setGameState("in_game");
		this.timer.start();
	}
	endGame() {
		this.setGameState("in_lobby");
		this.timer.stop();
	}
	resetGame() {
		this.spies = [];
		this.location = null;
    this.gamePackId = null;
		this.civilians = [];
		this.timer.reset(0);
		this.setGameState("in_lobby");
	}
}
