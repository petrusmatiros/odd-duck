import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { WebsocketClient } from "../communication/WebsocketClient";
import Popup from "../components/Popup/Popup";
import { getCookie, setCookie } from "../utils/cookie-utils";
import { Logger } from "../utils/log-utils";

interface Player {
	id: string;
	name: string;
}

export default function Page() {
	const [isAllowedInRoom, setIsAllowedInRoom] = useState(false);
	const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
	const [playersInLobby, setPlayersInLobby] = useState<Player[]>([]);
	const [, setIsHost] = useState(false);

	const roomCode = window.location.pathname.split("/").pop();
	const logger = new Logger(`client/room/${roomCode}`);

	const validatedWsClient = useRef<WebsocketClient>(
		new WebsocketClient(
			`${import.meta.env.VITE_WS_SERVER_URL}/${import.meta.env.VITE_WS_VALIDATED_NAMESPACE}`,
			(getCookie("token") as string) || "",
		),
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		console.log("Starting useEffect");
		if (!validatedWsClient?.current) {
			return;
		}

		const sockRef = validatedWsClient?.current.socket;

		console.log("Validated socket", sockRef);

		console.log("Room code", roomCode);
		sockRef.on("connect", () => {
			logger.log("Validated socket connected");
			sockRef.emit("check_if_allowed_in_game", {
				code: roomCode,
			});
		});
		sockRef.on("disconnect", () => {
			logger.log("Validated socket disconnected");
		});
		sockRef.on("connect_error", (err: Error) => {
			logger.log("Validated socket connection error", err);
		});

		sockRef.on(
			"register_new_player_token_response",
			(data: { token: string }) => {
				logger.log("Register new player token", data.token);
				setCookie("token", data.token, {
					sameSite: "Strict",
					secure: true,
					maxAge: 60 * 60 * 24, // 1 day
					path: "/",
				});
			},
		);

		sockRef.on(
			"check_if_allowed_in_game_response",
			(data: {
				allowedState: "not_allowed" | "allow_join" | "allow_register";
				isHost?: boolean;
				playersInLobby?: Player[];
				toastMessage: string;
			}) => {
				toast(data.toastMessage);
				if (data.allowedState === "not_allowed") {
					logger.log("Not allowed in game", data);
					window.location.href = "/";
					return;
				}

				if (data.allowedState === "allow_register") {
					setIsAllowedInRoom(true);
				}

				if (data.allowedState === "allow_join") {
					setIsAllowedInRoom(true);
					setPlayersInLobby(data.playersInLobby || []);
					setHasJoinedRoom(true);
				}

				// Is only defined if allowed
				setIsHost(data.isHost || false);

				logger.log("check_if_allowed_in_game_response", data);
			},
		);

		sockRef.on(
			"direct_join_game_response",
			(data: {
				roomCode: string;
				playersInLobby?: Player[];
				toastMessage: string;
			}) => {
				logger.log("Direct join game response", data);
				toast(data.toastMessage);
				if (data.roomCode) {
					setPlayersInLobby(data.playersInLobby || []);
					setHasJoinedRoom(true);
				}
			},
		);

		sockRef.on("player_joined_game_broadcast_all", (data: Player) => {
			logger.log("Player joined game", data);
			toast(`${data.name} has joined the game!`);
			setPlayersInLobby((prev) => {
				if (!prev) {
					return [];
				}
				return [...prev, data];
			});
		});

		return () => {
			logger.log("Cleaning up");
			sockRef.off("connect");
			sockRef.off("disconnect");
			sockRef.off("connect_error");
			sockRef.off("check_if_allowed_in_game_response");
			sockRef.off("register_new_player_token_response");
			sockRef.off("player_joined_game_broadcast_all");
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomCode]);

	if (!roomCode) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}

	return (
		<>
			{isAllowedInRoom && hasJoinedRoom ? (
				<div className="flex flex-col items-center justify-center min-h-screen">
					<h1 className="text-4xl font-bold">Odd Duck</h1>
					<p className="text-2xl font-bold">Room Code: {roomCode}</p>
					{playersInLobby?.map((player) => {
						console.log("Player", player);
						return (
							<div
								key={player.id}
								className="flex flex-row items-center justify-between w-full max-w-2xl p-4 border-b border-gray-300"
							>
								<p className="text-xl font-bold">{player.name}</p>
							</div>
						);
					})}
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
