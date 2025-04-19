import { WebsocketClient } from "@/communication/WebsocketClient";

export default function Index() {
  const wsClient = new WebsocketClient("http://localhost:8080", "test_token");

  wsClient.socket.on("connect", () => {
    console.log("Connected to server");
  });
  wsClient.socket.on("connect_error ", () => {
    console.log("Connection error");
  });
  wsClient.socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });
	return (
		<>
			<div>test</div>
		</>
	);
}
