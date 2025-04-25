import { WebsocketClient } from "@/communication/WebsocketClient";
import Popup from "@/components/Popup/Popup";
import { Logger } from "@/utils/log-utils";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [isAllowedInRoom, setIsAllowedInRoom] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const router = useRouter();

  const roomCode = router.query?.code;
  const logger = new Logger(`client/room/${roomCode}`);

  const validatedWsClient = useRef<WebsocketClient>(
    new WebsocketClient(
      `${process.env.NEXT_PUBLIC_WS_SERVER_URL}/${process.env.NEXT_PUBLIC_WS_VALIDATED_NAMESPACE}`,
      (getCookie("token") as string) || "",
    ),
  );

  // TODO: when refreshing the page, the socket is not connected?



  if (!roomCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  validatedWsClient?.current?.socket.on("connect", () => {
    logger.log("Validated socket connected");
    validatedWsClient?.current?.socket.emit("check_if_allowed_in_game", {
      code: roomCode,
    });
  });
  validatedWsClient?.current?.socket.on("disconnect", () => {
    logger.log("Validated socket disconnected");
  });
  validatedWsClient?.current?.socket.on("connect_error", (err: Error) => {
    logger.log("Validated socket connection error", err);
  });

  validatedWsClient?.current?.socket.on(
    "check_if_allowed_in_game_response",
    (data: {
      allowedState: "not_allowed" | "allow_join" | "allow_register";
      isHost?: boolean;
      toastMessage: string;
    }) => {
      toast(data.toastMessage);
      if (data.allowedState === "not_allowed") {
        logger.log("Not allowed in game", data);
        router.push("/");
        return;
      }

      if (data.allowedState === "allow_register") {
        setIsAllowedInRoom(true);
      }

      if (data.allowedState === "allow_join") {
        setIsAllowedInRoom(true);
        setHasJoinedRoom(true);
      }

      // Is only defined if allowed
      setIsHost(data.isHost || false);

      logger.log("check_if_allowed_in_game_response", data);
    },
  );

  validatedWsClient?.current?.socket.on(
			"direct_join_game_response",
			(data: {
				roomCode: string;
				toastMessage: string;
			}) => {
				logger.log("Direct join game response", data);
				toast(data.toastMessage);
				if (data.roomCode) {
					setHasJoinedRoom(true);
				}
			},
		);


  validatedWsClient?.current?.socket.on(
    "player_joined_game_broadcast_all",
    (data: { playerId: string; playerName: string }) => {
      logger.log("Player joined game", data);
      toast(`${data.playerName} has joined the game!`);
    },
  );

  return (
    <>
      {isAllowedInRoom && hasJoinedRoom ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold">Odd Duck</h1>
          <p className="text-2xl font-bold">Room Code: {roomCode}</p>
          {/* <Image
          src="/images/odd-duck.png"
          alt="Odd Duck"
          width={500}
          height={500}
        /> */}
        </div>
      ) : (
        <Popup
          open={!isAllowedInRoom}
          withoutTriggerButton
          dialogTitle="Join Game"
          dialogDescription="What be your name veary traveller?"
          submitButtonTitle="Join Game"
          inputs={[
            {
              id: "name",
              type: "text",
              placeholder: "Name",
              labelTitle: "Name",
              required: true,
              minLength: 1,
              maxLength: 20,
              className: "col-span-3",
              onChange: (e) => {
                // must be 6 characters long, most be upper case
                const value = e.target.value.trim();
                if (!value) {
                  return;
                }

                if (value.length > 20) {
                  e.target.value = value.slice(0, 20);
                }
              },
            },
          ]}
          submitButtonOnClick={(e) => {
            e.preventDefault();
            const name = (document.getElementById("name") as HTMLInputElement)
              .value;

            if (!name || !roomCode) {
              return;
            }

            if (name.length < 1 || name.length > 20) {
              return;
            }

            if (roomCode.length !== 6) {
              return;
            }

            // TODO: should this be different since this is already within lobby
            validatedWsClient?.current?.socket.emit("direct_join_game", {
              name: name,
              code: roomCode,
            });
          }}
        />
      )}
    </>
  );
}
