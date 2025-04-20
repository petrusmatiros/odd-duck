import cryptoRandomString from "crypto-random-string";
import type { PlayerInstance } from "../PlayerInstance/PlayerInstance";
import type { TimerInstance } from "../TimerInstance/TimerInstance";

export class RoomInstance {
		id: string;
    host: PlayerInstance;
		players: PlayerInstance[];
    spies: PlayerInstance[];
    civilians: PlayerInstance[];
		gamePackId: string;
		timer: TimerInstance;
		gameState: "in_lobby" | "in_game";

    constructor(gamePackId: string, timer: TimerInstance) {
      this.id = cryptoRandomString({length: 6, type: 'distinguishable'});
      this.players = [];
      this.spies = [];
      this.civilians = [];
      this.gamePackId = gamePackId;
      this.timer = timer;
      this.gameState = "in_lobby";
    }
    addPlayer(player: PlayerInstance) {
      this.players.push(player);
    }
    removePlayer(playerId: string) {
      this.players = this.players.filter(player => player.getId() !== playerId);
    }
    getPlayers() {
      return this.players;
    }
    addSpy(player: PlayerInstance) {
      this.spies.push(player);
    }
    removeSpy(playerId: string) {
      this.spies = this.spies.filter(player => player.getId() !== playerId);
    }
    getSpies() {
      return this.spies;
    }
    addCivilian(player: PlayerInstance) {
      this.civilians.push(player);
    }
    removeCivilian(playerId: string) {
      this.civilians = this.civilians.filter(player => player.getId() !== playerId);
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
      this.players = [];
      this.spies = [];
      this.civilians = [];
      this.timer.reset(0);
      this.setGameState("in_lobby");
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
	}
