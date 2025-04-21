import { WebsocketClient } from "@/communication/WebsocketClient";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Logger } from "@/utils/log-utils";
import { toast } from "sonner";
import Image from "next/image";

export default function Index() {
  const newPlayerWsClient = new WebsocketClient(
    `${process.env.NEXT_PUBLIC_WS_SERVER_URL}/${process.env.NEXT_PUBLIC_WS_NEW_PLAYER_NAMESPACE}`,
    "test_token",
  );
  let validatedWsClient: WebsocketClient | null = null;

  const logger = new Logger("Client");

  newPlayerWsClient.socket.on("new_player", (data: { uuid: string }) => {
    console.log("New player", data);
    // set new token
    validatedWsClient = new WebsocketClient(
      `${process.env.NEXT_PUBLIC_WS_SERVER_URL}/${process.env.NEXT_PUBLIC_WS_VALIDATED_NAMESPACE}`,
      data.uuid,
    );
    newPlayerWsClient.socket.disconnect();
  });

  newPlayerWsClient.socket.on("connect", () => {
    console.log("Connected to server");
  });
  newPlayerWsClient.socket.on("connect_error ", (err: unknown) => {
    console.log("Connection error", err);
    console.log("Connection error");
  });
  newPlayerWsClient.socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });

  return (
    <>
      <Toaster />
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold">Odd Duck</h1>
        <Image
          src="/avatars/odd_duck.webp"
          alt="Odd Duck"
          width={200}
          height={200}
        />
        <Button
          type="button"
          style={{
            width: "100%",
            padding: "2rem",
          }}
          onClick={() => {
            console.log("test");
            toast("New game created");
          }}
        >
          New Game
        </Button>
        <Button
          type="button"
          style={{
            width: "100%",
            padding: "2rem",
          }}
        >
          Join Game
        </Button>
      </div>
    </>
  );
}
