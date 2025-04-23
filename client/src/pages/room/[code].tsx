import { WebsocketClient } from "@/communication/WebsocketClient";
import Popup from "@/components/Popup/Popup";
import { Logger } from "@/utils/log-utils";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [isAllowedInRoom, setIsAllowedInRoom] = useState(false);
  const router = useRouter();

  const logger = new Logger("client/room/code");

  const roomCode = router.query?.code;

  if (!roomCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const validatedWsClient = new WebsocketClient(
    `${process.env.NEXT_PUBLIC_WS_SERVER_URL}/${process.env.NEXT_PUBLIC_WS_VALIDATED_NAMESPACE}`,
    (getCookie("token") as string) || "",
  );

  validatedWsClient.socket.on(
    "check_if_allowed_in_game_response",
    (data: { allowed: boolean; toastMessage: string }) => {
      if (!data.allowed) {
        logger.log("Not allowed in game", data);
        toast(data.toastMessage);
        router.push("/");
      }
      setIsAllowedInRoom(data.allowed);
      logger.log("check_if_allowed_in_game_response", data);

      // if allowed, show ui for name popup, take name and join game
    },
  );

  /**
   * TODO:
   * 1. emit, check_if_allowed_in_game, either show the lobby or not (checks if player is in the game)
   * 3. emit, check_if_host_of_game, either show host state ui or not
   */

  return (
    <>
      {isAllowedInRoom ? (
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
            validatedWsClient.socket.emit("join_game", {
              name: name,
              code: roomCode,
            });
          }}
        />
      )}
    </>
  );
}
