export class Logger {
	private prefix: string;
	constructor(prefix: string) {
		this.prefix = prefix;
	}

	private formatMessage(message: string, ...args: unknown[]) {
		const timestamp = new Date().toISOString();
		const updatedMessage =
			args.length > 0 ? `${message} ${args.join(" ")}` : message;
		return `[${timestamp}] [${this.prefix}] ${updatedMessage}`;
	}

	log(message: string, ...args: unknown[]) {
		console.log(this.formatMessage(message, ...args));
	}
	error(message: string, ...args: unknown[]) {
		console.error(this.formatMessage(message, ...args));
	}
	warn(message: string, ...args: unknown[]) {
		console.warn(this.formatMessage(message, ...args));
	}
	info(message: string, ...args: unknown[]) {
		console.info(this.formatMessage(message, ...args));
	}
	debug(message: string, ...args: unknown[]) {
		console.debug(this.formatMessage(message, ...args));
	}
	trace(message: string, ...args: unknown[]) {
		console.trace(this.formatMessage(message, ...args));
	}
}
