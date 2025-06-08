import type { Namespace } from "socket.io";
import type { RoomInstance } from "../RoomInstance/Roominstance";

export class TimerInstance {
	id: string;
	durationMinutes: number;
	timerState: "stopped" | "running" | "paused";
	elapsedTimeInSeconds: number;
	interval: ReturnType<typeof setInterval> | null;
	timerSocketConfig: {
		socketNamespace: Namespace | null;
		room: RoomInstance | null;
		socketEvent: string | null;
	};

	constructor(durationMinutes: number) {
		this.id = crypto.randomUUID();
		this.durationMinutes = durationMinutes;
		this.elapsedTimeInSeconds = 0;
		this.interval = null;
		this.timerState = "stopped"; // Initial state
		this.timerSocketConfig = {
			socketNamespace: null,
			room: null,
			socketEvent: null,
		};
	}
	setSocketConfig({
		socketNamespace,
		room,
		socketEvent,
	}: {
		socketNamespace: Namespace;
		room: RoomInstance;
		socketEvent: string;
	}) {
		this.timerSocketConfig.socketNamespace = socketNamespace;
		this.timerSocketConfig.room = room;
		this.timerSocketConfig.socketEvent = socketEvent;
	}
	getSocketConfig() {
		return this.timerSocketConfig;
	}
	start() {
		if (this.interval) {
			console.warn(`Timer ${this.id} is already running.`);
			return;
		}
		console.log(
			`Starting timer ${this.id} for ${this.durationMinutes} minutes.`,
		);

		this.setState("running");

		this.interval = setInterval(() => {
			if (!this.timerSocketConfig.socketNamespace) {
				console.error(
					`Socket namespace is not set for timer ${this.id}. Cannot start.`,
				);
				return;
			}
			if (!this.timerSocketConfig.room) {
				console.error(`Room is not set for timer ${this.id}. Cannot start.`);
				return;
			}

			if (!this.timerSocketConfig.socketEvent) {
				console.error(
					`Socket event is not set for timer ${this.id}. Cannot start.`,
				);
				return;
			}
			const timeLeftInSeconds = this.getTimeLeft();
			const minutesLeft = Math.floor(timeLeftInSeconds / 60);
			const secondsLeft = timeLeftInSeconds % 60;

			console.log(
				`Timer ${this.id}: ${minutesLeft} minutes and ${secondsLeft} seconds left`,
			);

			// Emit after the check to avoid emitting when the timer is stopped
			this.timerSocketConfig.socketNamespace
				.to(this.timerSocketConfig.room.getId())
				.emit(this.timerSocketConfig.socketEvent, {
					timeLeft: this.getTimeLeft(),
					timerState: this.getState(),
				});

			if (this.getTimeLeft() <= 0) {
				// Set the timer state to stopped and emit the final state
				this.setState("stopped");
				this.timerSocketConfig.socketNamespace
					.to(this.timerSocketConfig.room.getId())
					.emit(this.timerSocketConfig.socketEvent, {
						timeLeft: this.getTimeLeft(),
						timerState: this.getState(),
					});
				this.stop();
				console.log(`Timer ${this.id} has finished.`);
				// End early to prevent further incrementation of elapsed time
				return;
			}
			this.elapsedTimeInSeconds += 1;
		}, 1000); // 1 second interval
	}
	stop() {
		if (!this.interval) {
			console.warn(`Timer ${this.id} is not running.`);
			return;
		}

		clearInterval(this.interval);
		this.interval = null;
		this.elapsedTimeInSeconds = 0; // Reset elapsed time
		this.setState("stopped");
		console.log(`Timer ${this.id} has been stopped.`);
	}
	pause() {
		if (!this.interval) {
			console.warn(`Timer ${this.id} is not running.`);
			return;
		}
		clearInterval(this.interval);
		this.interval = null;
		this.setState("paused");
		console.log(`Timer ${this.id} has been paused.`);
	}
	resume() {
		if (this.interval) {
			console.warn(`Timer ${this.id} is already running.`);
			return;
		}
		this.setState("running");
		console.log(`Resuming timer ${this.id}.`);
		this.start();
	}
	reset(newDurationMinutes: number) {
		this.stop();
		this.setDuration(newDurationMinutes);
	}
	getTimeLeft() {
		return this.getDuration() * 60 - this.elapsedTimeInSeconds;
	}
	isRunning() {
		return this.interval !== null;
	}
	setInterval(newInterval: ReturnType<typeof setInterval>) {
		this.interval = newInterval;
		console.log(`Timer ${this.getId()} interval set.`);
	}
	getInterval() {
		return this.interval;
	}
	getId() {
		return this.id;
	}
	getDuration() {
		return this.durationMinutes;
	}
	setDuration(newDurationMinutes: number) {
		this.durationMinutes = newDurationMinutes;
		console.log(
			`Timer ${this.getId()} duration set to ${this.durationMinutes} minutes.`,
		);
	}
	setState(newState: "stopped" | "running" | "paused") {
		this.timerState = newState;
	}
	getState() {
		return this.timerState;
	}
}
