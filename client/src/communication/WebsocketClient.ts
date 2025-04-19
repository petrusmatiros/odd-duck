import { io, type Socket } from "socket.io-client";

export class WebsocketClient {
	socket: Socket;
	constructor(url: string, authToken: string) {
		this.socket = io(url, {
			secure: true,
			auth: {
				token: authToken,
			},
		});
	}
}
