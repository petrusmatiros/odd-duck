import type { Namespace } from "socket.io";
import type { RoomInstance } from "../RoomInstance/Roominstance";

export class TimerInstance {
	id: string;
	durationMinutes: number;
	elapsedTimeInSeconds: number;
	interval: ReturnType<typeof setInterval> | null;

	constructor(durationMinutes: number) {
		this.id = crypto.randomUUID();
		this.durationMinutes = durationMinutes;
		this.elapsedTimeInSeconds = 0;
		this.interval = null;
	}
	start({
		socketNamespace,
		room,
		socketEvent,
	}: {
		socketNamespace: Namespace;
		room: RoomInstance;
		socketEvent: string;
	}) {
		if (this.interval) {
			console.warn(`Timer ${this.id} is already running.`);
			return;
		}
		console.log(`Starting timer ${this.id} for ${this.durationMinutes} minutes.`);

		this.interval = setInterval(() => {
			console.log(this.durationMinutes);
			this.elapsedTimeInSeconds += 1;
			const timeLeftInSeconds =
				(this.durationMinutes * 60) - this.elapsedTimeInSeconds;
			const minutesLeft = Math.floor(timeLeftInSeconds / 60);
			const secondsLeft = timeLeftInSeconds % 60;

			console.log(
				`Timer ${this.id}: ${minutesLeft} minutes and ${secondsLeft} seconds left`,
			);

			if (timeLeftInSeconds <= 0) {
				this.stop();
				console.log(`Timer ${this.id} has finished.`);
			}

			// Emit after the check to avoid emitting when the timer is stopped
			socketNamespace.to(room.getId()).emit(socketEvent, {
				timeLeft: this.getTimeLeft(),
			});
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
		console.log(`Timer ${this.id} has been stopped.`);
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
	private getId() {
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
}
