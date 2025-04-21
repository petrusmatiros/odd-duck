import colors from "yoctocolors";
import util from "node:util";
export class Logger {
	private prefix: string;
	constructor(prefix: string) {
		this.prefix = prefix;
	}

	private formatArg(arg: unknown): string {
		if (typeof arg === "string") {
			return arg;
		}
		return util.inspect(arg, { depth: 2, colors: true });
	}

	private formatMessage(...args: unknown[]) {
		const timestamp = new Date().toISOString();
		const formattedArgs = args.map(this.formatArg).join(" ");
		return `[${timestamp}] [${this.prefix}] ${formattedArgs}`;
	}

	log(...args: unknown[]) {
		console.log(this.formatMessage(...args));
	}
	error(...args: unknown[]) {
		console.error(colors.red(this.formatMessage(...args)));
	}
	warn(...args: unknown[]) {
		console.warn(colors.yellow(this.formatMessage(...args)));
	}
	info(...args: unknown[]) {
		console.info(colors.cyan(this.formatMessage(...args)));
	}
	debug(...args: unknown[]) {
		console.debug(this.formatMessage(...args));
	}
	trace(...args: unknown[]) {
		console.trace(this.formatMessage(...args));
	}
}
