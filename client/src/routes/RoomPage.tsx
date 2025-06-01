import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { WebsocketClient } from "../communication/WebsocketClient";
import Popup from "../components/Popup/Popup";
import {
	defaultCookieOptions,
	getCookie,
	setCookie,
} from "../utils/cookie-utils";
import { Logger } from "../utils/log-utils";
import { copyToClipboard } from "@/utils/clipboard-utils";

interface Player {
	id: string;
	name: string;
}

export default function Page() {
	const [isAllowedInRoom, setIsAllowedInRoom] = useState(false);
	const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
	const [playersInLobby, setPlayersInLobby] = useState<Player[]>([]);
	const [isHost, setIsHost] = useState<string | null>(null);

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
		copyToClipboard(window.location.href)
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
				setCookie({
					key: "token",
					value: data.token,
					options: defaultCookieOptions,
				});
			},
		);

		sockRef.on("test", (data: { message: string }) => {
			logger.log("Test event received", data);
			toast(data.message);
		});

		sockRef.on(
			"check_if_allowed_in_game_response",
			(data: {
				allowedState: "not_allowed" | "allow_join" | "allow_register";
				isHost?: string;
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
				setIsHost(data.isHost || null);

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

		sockRef.on(
			"player_joined_game_broadcast_all",
			(data: { player: Player; playersInLobby: Player[] }) => {
				logger.log("Player joined game", data);
				toast(`${data.player.name} has joined the game!`);
				setPlayersInLobby(data.playersInLobby || []);
			},
		);

		sockRef.on(
			"player_disconnected_broadcast_all",
			(data: { player: Player; playersInLobby: Player[] }) => {
				logger.log("Player left game", data);
				setPlayersInLobby(data.playersInLobby || []);
			},
		);

		return () => {
			logger.log("Cleaning up");
			sockRef.off("connect");
			sockRef.off("disconnect");
			sockRef.off("connect_error");
			sockRef.off("check_if_allowed_in_game_response");
			sockRef.off("direct_join_game_response");
			sockRef.off("register_new_player_token_response");
			sockRef.off("player_joined_game_broadcast_all");
			sockRef.off("player_disconnected_broadcast_all");
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
			{isAllowedInRoom && !hasJoinedRoom ? (
				<Popup
					open={isAllowedInRoom && !hasJoinedRoom}
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
			) : (
				<div className="flex flex-col items-center justify-center min-h-screen">
					<h1 className="text-4xl font-bold">Odd Duck</h1>
					<p className="text-2xl font-bold">Room Code: {roomCode}</p>
					{playersInLobby?.map((player) => {
						return (
							<div
								key={player.id}
								className="flex flex-row items-center justify-between w-full max-w-2xl p-4 border-b border-gray-300"
							>
								<p className="text-xl font-bold">{player.name}</p>
								{isHost && player.id === isHost ? (
									<span>{"(Host)"}</span>
								) : null}
							</div>
						);
					})}
				</div>
			)}
		</>
	);
}
