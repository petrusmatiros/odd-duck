import { WebsocketClient } from "@/communication/WebsocketClient";
import { Logger } from "@/utils/log-utils";

export default function Index() {
  const wsClient = new WebsocketClient("http://localhost:8080", "test_token");
  const logger = new Logger("Client");

  wsClient.socket.on("connect", () => {
    logger.log("Connected to server");
  });
  wsClient.socket.on("connect_error ", () => {
    logger.log("Connection error");
  });
  wsClient.socket.on("disconnect", () => {
    logger.log("Disconnected from server");
  });
	return (
		<>
			<div>test</div>
      <button type="button">test</button>
		</>
	);
}
