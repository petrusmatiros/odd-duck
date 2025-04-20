import colors from "yoctocolors";
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
		console.error(colors.red(this.formatMessage(message, ...args)));
	}
	warn(message: string, ...args: unknown[]) {
		console.warn(colors.yellow(this.formatMessage(message, ...args)));
	}
	info(message: string, ...args: unknown[]) {
		console.info(colors.cyan(this.formatMessage(message, ...args)));
	}
	debug(message: string, ...args: unknown[]) {
		console.debug(this.formatMessage(message, ...args));
	}
	trace(message: string, ...args: unknown[]) {
		console.trace(this.formatMessage(message, ...args));
	}
}
