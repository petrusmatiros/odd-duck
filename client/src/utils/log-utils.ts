export class Logger {
	private prefix: string;
	constructor(prefix: string) {
		this.prefix = prefix;
	}

	private consoleLogger = (
		type: "log" | "error" | "warn" | "info" | "debug" | "trace",
		...args: unknown[]
	) => {
		const message = this.formatMessage(...args);
		console[type](message.prefix, ...args);
	};

	private formatMessage(...args: unknown[]) {
		const timestamp = new Date().toISOString();
		return { prefix: `[${timestamp}] [${this.prefix}]`, ...args };
	}

	log(...args: unknown[]) {
		this.consoleLogger("log", ...args);
	}
	error(...args: unknown[]) {
		this.consoleLogger("error", ...args);
	}
	warn(...args: unknown[]) {
		this.consoleLogger("warn", ...args);
	}
	info(...args: unknown[]) {
		this.consoleLogger("info", ...args);
	}
	debug(...args: unknown[]) {
		this.consoleLogger("debug", ...args);
	}
	trace(...args: unknown[]) {
		this.consoleLogger("trace", ...args);
	}
}
