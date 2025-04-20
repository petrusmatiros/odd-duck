export class TimerInstance {
  id: string;
  durationMinutes: number;
  interval: NodeJS.Timeout | null;

  constructor(durationMinutes: number) {
    this.id = crypto.randomUUID();
    this.durationMinutes = durationMinutes;
    this.interval = null;
  }
  start() {
    if (this.interval) {
      console.warn(`Timer ${this.id} is already running.`);
      return;
    }

    this.interval = setInterval(() => {
      this.durationMinutes -= 1;
      console.log(`Timer ${this.id}: ${this.durationMinutes} minutes left`);

      if (this.durationMinutes <= 0) {
        this.stop();
        console.log(`Timer ${this.id} has finished.`);
      }
    }, 60000); // 1 minute interval
  }
  stop() {
    if (!this.interval) {
      console.warn(`Timer ${this.id} is not running.`);
      return;
    }

    clearInterval(this.interval);
    this.interval = null;
    console.log(`Timer ${this.id} has been stopped.`);
  }
  reset(newDurationMinutes: number) {
    this.stop();
    this.setDuration(newDurationMinutes);
  }
  getTimeLeft() {
    return this.getDuration();
  }
  isRunning() {
    return this.interval !== null;
  }
  private getId() {
    return this.id;
  }
  private getDuration() {
    return this.durationMinutes;
  }
  private setDuration(newDurationMinutes: number) {
    this.durationMinutes = newDurationMinutes;
    console.log(`Timer ${this.getId()} duration set to ${this.durationMinutes} minutes.`);
  }
}