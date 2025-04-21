import { WebsocketClient } from "@/communication/WebsocketClient";
import { Logger } from "@/utils/log-utils";

export default function Index() {
  const unvalidatedWsClient = new WebsocketClient(`${process.env.WS_SERVER_URL}/${process.env.WS_UNVALIDATED_NAMESPACE}`, "test_token");
  let validatedWsClient: WebsocketClient | null = null;

  const logger = new Logger("Client");

  unvalidatedWsClient.socket.on("new_player", (data: {uuid: string}) => {
    console.log("New player", data);
    // set new token
    validatedWsClient = new WebsocketClient(`${process.env.WS_SERVER_URL}/${process.env.WS_VALIDATED_NAMESPACE}`, data.uuid);
    validatedWsClient.socket.emit("validated_player", { token: data.uuid });
    unvalidatedWsClient.socket.disconnect();
  });

  unvalidatedWsClient.socket.on("connect", () => {
    console.log("Connected to server");
  });
  unvalidatedWsClient.socket.on("connect_error ", (err: unknown) => {
    console.log("Connection error", err);
    console.log("Connection error");
  });
  unvalidatedWsClient.socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });
  
	return (
		<>
			<div>test</div>
      <button type="button">test</button>
		</>
	);
}
