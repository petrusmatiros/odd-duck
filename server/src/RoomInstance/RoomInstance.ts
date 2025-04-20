import cryptoRandomString from "crypto-random-string";
import type { PlayerInstance } from "../PlayerInstance/PlayerInstance";
import type { TimerInstance } from "../TimerInstance/TimerInstance";

export class RoomInstance {
		id: string;
    host: string;
		players: string[];
    spies: string[];
    civilians: string[];
		gamePackId: string;
		timer: TimerInstance;
		gameState: "in_lobby" | "in_game";

    constructor(host: string, gamePackId: string, timer: TimerInstance) {
      this.id = cryptoRandomString({length: 6, type: 'distinguishable'});
      this.host = host;
      this.players = [];
      this.spies = [];
      this.civilians = [];
      this.gamePackId = gamePackId;
      this.timer = timer;
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
    addPlayer(playerId: string) {
      if (!this.players.includes(playerId)) {
        this.players.push(playerId);
      }
    }
    removePlayer(playerId: string) {
      this.players = this.players.filter(pId => pId !== playerId);
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
      this.spies = this.spies.filter(pId => pId !== playerId);
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
      this.civilians = this.civilians.filter(pId => pId !== playerId);
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
	}
