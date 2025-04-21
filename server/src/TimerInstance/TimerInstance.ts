export class TimerInstance {
	id: string;
	durationMinutes: number;
	elapsedTimeInSeconds: number;
	interval: NodeJS.Timeout | null;

	constructor(durationMinutes: number) {
		this.id = crypto.randomUUID();
		this.durationMinutes = durationMinutes;
		this.elapsedTimeInSeconds = 0;
		this.interval = null;
	}
	start() {
		if (this.interval) {
			console.warn(`Timer ${this.id} is already running.`);
			return;
		}

		this.interval = setInterval(() => {
			this.elapsedTimeInSeconds += 1;
			const timeLeftInSeconds =
				this.durationMinutes * 60 - this.elapsedTimeInSeconds;
			const minutesLeft = Math.floor(timeLeftInSeconds / 60);
			const secondsLeft = timeLeftInSeconds % 60;

			console.log(
				`Timer ${this.id}: ${minutesLeft} minutes and ${secondsLeft} seconds left`,
			);

			if (timeLeftInSeconds <= 0) {
				this.stop();
				console.log(`Timer ${this.id} has finished.`);
			}
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
	setInterval(newInterval: NodeJS.Timeout) {
		this.interval = newInterval;
		console.log(`Timer ${this.getId()} interval set.`);
	}
	getInterval() {
		return this.interval;
	}
	private getId() {
		return this.id;
	}
	private getDuration() {
		return this.durationMinutes;
	}
	private setDuration(newDurationMinutes: number) {
		this.durationMinutes = newDurationMinutes;
		console.log(
			`Timer ${this.getId()} duration set to ${this.durationMinutes} minutes.`,
		);
	}
}
