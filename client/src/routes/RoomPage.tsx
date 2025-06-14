import TooltipHint from "@/components/Popup/TooltipHint";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BASE_CONFIG } from "@/config/config";
import { copyToClipboard } from "@/utils/clipboard-utils";
import unsplashImageUrl from "@/utils/img-utils";
import capitalizeFirstLetter from "@/utils/string-utils";
import clsx from "clsx";
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

interface Player {
	id: string;
	name: string;
}

type GameSupportedLanguages = "en" | "sv";

interface GameLocation {
	id: Lowercase<string>;
	img_url: string;
	translations: Record<GameSupportedLanguages, GameTranslation>;
}

type GameTranslation = {
	title: string;
	description: string;
	roles: Lowercase<string>[];
};

type GameCategory =
	| "mixed"
	| "dark"
	| "light"
	| "nature"
	| "scifi"
	| "fantasy"
	| "horror"
	| "urban"
	| "historical"
	| "mythology"
	| "mystery"
	| "supernatural"
	| "adventure"
	| "entertainment";

/**
 * GamePack is a collection of game locations, each with its own translations and images.
 * Should have 20 locations, where each location has atleast 10 roles.
 */
interface GamePack {
	id: string;
	title: string;
	locations: GameLocation[];
	category: GameCategory;
}

function timeLeftElementSetter(
	timeLeft: number | null,
	timerState: "stopped" | "running" | "paused" | null,
	logger: Logger,
) {
	const timeLeftElement = document.getElementById("timeLeft");
	if (!timeLeftElement) {
		logger.log("No time left element found, skipping update");
		return;
	}
	if (timerState === "stopped") {
		timeLeftElement.textContent = "Game has ended";
		return;
	}
	if (timeLeft === null) {
		timeLeftElement.textContent = "No timer";
		return;
	}
	const minutes = Math.floor(timeLeft / 60);
	const minutesWithLeadingZero = String(minutes).padStart(2, "0");
	const seconds = timeLeft % 60;
	const secondsWithLeadingZero = String(seconds).padStart(2, "0");
	timeLeftElement.textContent = `Time left: ${minutesWithLeadingZero}:${secondsWithLeadingZero}`;
}

export default function Page() {
	const [isAllowedInRoom, setIsAllowedInRoom] = useState(false);
	const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
	const [playersInLobby, setPlayersInLobby] = useState<Player[]>([]);
	const [playerId, setPlayerId] = useState<string | null>(null);
	const [gamePacks, setGamePacks] = useState<GamePack[] | null>(null);
	const [gameState, setGameState] = useState<"in_lobby" | "in_game">(
		"in_lobby",
	);
	const [gamePack, setGamePack] = useState<GamePack | null>(null);
	const [location, setLocation] = useState<GameLocation | null>(null);
	const [role, setRole] = useState<{ value: "spy" | string, label: "Spy" | string } | null>(null);
	const [playerCardVisible, setPlayerCardVisible] = useState(false);
	const [isHost, setIsHost] = useState<string | null>(null);
	const [selectedLocale, setSelectedLocale] =
		useState<GameSupportedLanguages>("en");
	const [playerToKick, setPlayerToKick] = useState<Player | null>(null);
	const [timerState, setTimerState] = useState<
		"stopped" | "running" | "paused" | null
	>(null);

	const roomCode = window.location.pathname.split("/").pop();
	const logger = new Logger(`client/room/${roomCode}`);

	const validatedWsClient = useRef<WebsocketClient>(
		new WebsocketClient(
			`${BASE_CONFIG.VITE_WS_SERVER_URL}/${BASE_CONFIG.VITE_WS_VALIDATED_NAMESPACE}`,
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

		copyToClipboard(window.location.href);

		sockRef.on("connect", () => {
			logger.log("Validated socket connected");
			sockRef.emit("check_if_allowed_in_game", {
				code: roomCode,
			});
			// Reset player card visibility
			setPlayerCardVisible(false);
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

		sockRef.on(
			"check_if_allowed_in_game_response",
			(data: {
				allowedState: "not_allowed" | "allow_join" | "allow_register";
				isHost: string;
				playersInLobby?: Player[];
				playerId?: string;
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

				setPlayerId(data.playerId || null);

				logger.log("check_if_allowed_in_game_response", data);

				sockRef.emit("get_game_state", {
					code: roomCode,
					locale: selectedLocale,
				});
			},
		);

		sockRef.on(
			"get_game_state_response",
			(data: {
				gameState: "in_lobby" | "in_game";
				gamePacks: GamePack[];
				gamePack: GamePack | null;
				location: GameLocation | null;
				playerRole: string | null;
				timeLeft: number | null;
				timerState: "stopped" | "running" | "paused" | null;
			}) => {
				logger.log("Game state received", data);
				setGameState(data.gameState);
				setGamePacks(data.gamePacks);
				setGamePack(data.gamePack || null);
				setRole(
					data.playerRole ? { value: data.playerRole, label: capitalizeFirstLetter(data.playerRole) } : null,
				);
				setLocation(data.location || null);
				setTimerState(data.timerState || null);

				timeLeftElementSetter(data.timeLeft, data.timerState, logger);
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
			(data: {
				player: Player;
				playersInLobby: Player[];
				isHost?: boolean;
			}) => {
				logger.log("Player left game", data);
				toast(
					isHost
						? `${data.player.name} (host) has left the game!`
						: `${data.player.name} has left the game!`,
				);
				setPlayersInLobby(data.playersInLobby || []);
			},
		);

		sockRef.on(
			"start_game_response_broadcast_all",
			(data: {
				gameStarted: boolean;
				toastMessage: string;
			}) => {
				toast(data.toastMessage);
				if (!data.gameStarted) {
					return;
				}
				logger.log("Game started", data);
				sockRef.emit("get_game_state", {
					code: roomCode,
					locale: selectedLocale,
				});
				// Reset player card visibility
				setPlayerCardVisible(false);
			},
		);

		sockRef.on(
			"timer_response_broadcast_all",
			(data: {
				timeLeft: number;
				timerState: "stopped" | "running" | "paused" | null;
			}) => {
				setTimerState(data.timerState || null);
				timeLeftElementSetter(data.timeLeft, data.timerState, logger);
			},
		);

		sockRef.on(
			"toggle_pause_game_broadcast_all",
			(data: {
				toastMessage: string;
				timerState: "stopped" | "running" | "paused" | null;
			}) => {
				toast(data.toastMessage, {
					richColors: true,
				});
				logger.log("Game paused/resumed", data);
				setTimerState(data.timerState || null);
			},
		);

		sockRef.on("kick_player_response", (data: { toastMessage: string }) => {
			logger.log("You've been kicked from the lobby!", data);
			toast("You've been kicked from the lobby!", {
				richColors: true,
			});
			// window.location.href = "/";
		});

		sockRef.on("end_game_broadcast_all", (data: { toastMessage: string }) => {
			logger.log("Game ended", data);
			toast(data.toastMessage);
			// Reset player card visibility
			setPlayerCardVisible(false);
		});

		return () => {
			logger.log("Cleaning up");
			sockRef.off("connect");
			sockRef.off("disconnect");
			sockRef.off("connect_error");
			sockRef.off("check_if_allowed_in_game_response");
			sockRef.off("get_game_state_response");
			sockRef.off("direct_join_game_response");
			sockRef.off("register_new_player_token_response");
			sockRef.off("player_joined_game_broadcast_all");
			sockRef.off("player_disconnected_broadcast_all");
			sockRef.off("start_game_response_broadcast_all");
			sockRef.off("timer_response_broadcast_all");
			sockRef.off("kick_player_response");
			sockRef.off("end_game_broadcast_all");
			sockRef.off("toggle_pause_game_broadcast_all");
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
					dialog={{
						dialogTitle: "Join Game",
						dialogDescription: "What be your name veary traveller?",
					}}
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
					submitButton={{
						submitButtonTitle: "Join Game",
						submitButtonOnClick: (e) => {
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
						},
					}}
				/>
			) : gameState === "in_lobby" ? (
				<div className="flex flex-col items-center justify-center w-full min-h-screen">
					<div className="flex flex-col items-center justify-start min-h-screen gap-8 p-4 w-full max-w-md ">
						{/* Lobby UI */}
						<div className="flex flex-col items-center justify-center gap-2">
							<Button variant="link" className="text-2xl font-bold">
								<a href="/">Odd Duck</a>
							</Button>
							<TooltipHint tooltipText="Copy code">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										copyToClipboard(roomCode);
										toast("Room code copied to clipboard!", {
											description: roomCode,
											richColors: true,
										});
									}}
								>
									{roomCode}
								</Button>
							</TooltipHint>
						</div>

						<div className="flex flex-col items-center justify-center gap-2">
							{/* Only the host should be able to pick game packs */}
							{isHost === playerId ? (
								<div className="flex flex-col items-center justify-center gap-1">
									<label htmlFor="game-pack-select">
										Select a game pack to play:
									</label>
									<select
										name="game-pack-select"
										id="game-pack-select"
										disabled={isHost !== playerId}
										className="w-full p-2 border border-gray-300 rounded-sm"
									>
										{gamePacks?.map((pack) => {
											return (
												<option key={pack.id} value={pack.id}>
													{pack.title}
												</option>
											);
										})}
									</select>
								</div>
							) : null}

							{/* Only the host should be able to adjust the duration */}
							{isHost === playerId ? (
								<div className="flex flex-col items-center justify-center gap-1">
									<label htmlFor="game-duration-select">
										Select game duration:
									</label>
									<select
										name="game-duration-select"
										id="game-duration-select"
										className="w-full p-2 border border-gray-300 rounded-sm"
									>
										<option value="1">1 minute</option>
										<option value="2">2 minutes</option>
										<option value="3">3 minutes</option>
										<option value="4">4 minutes</option>
										<option value="5">5 minutes</option>
										<option value="7">7 minutes</option>
										<option value="10">10 minutes</option>
										<option value="15">15 minutes</option>
									</select>
								</div>
							) : null}
						</div>

						{/* Only the host should be able to start the game */}
						{isHost === playerId ? (
							<Button
								type="button"
								disabled={playersInLobby.length < 2}
								onClick={() => {
									if (!validatedWsClient?.current) {
										return;
									}
									const currentGamePackSelected = document.getElementById(
										"game-pack-select",
									) as HTMLSelectElement;
									if (!currentGamePackSelected) {
										toast("Please select a game pack first!", {
											description:
												"You must select a game pack to start the game.",
											richColors: true,
										});
										return;
									}
									if (!currentGamePackSelected.value) {
										toast("Please select a game pack first!", {
											description:
												"You must select a game pack to start the game.",
											richColors: true,
										});
										return;
									}

									const currentDurationSelected = document.getElementById(
										"game-duration-select",
									) as HTMLSelectElement;
									if (!currentDurationSelected) {
										toast("Please select a game duration first!", {
											description:
												"You must select a game duration to start the game.",
											richColors: true,
										});
										return;
									}
									if (!currentDurationSelected.value) {
										toast("Please select a game duration first!", {
											description:
												"You must select a game duration to start the game.",
											richColors: true,
										});
										return;
									}
									const durationInMinutes = Number.parseInt(
										currentDurationSelected.value,
									);
									if (Number.isNaN(durationInMinutes)) {
										toast("Please select a valid game duration!", {
											description:
												"You must select a valid game duration to start the game.",
											richColors: true,
										});
										return;
									}
									console.log(durationInMinutes);
									validatedWsClient?.current?.socket.emit("start_game", {
										code: roomCode,
										gamePackId: currentGamePackSelected.value,
										durationInMinutes: durationInMinutes,
									});
								}}
							>
								Start
							</Button>
						) : null}

						{/* Only the host should be able to kick players */}
						{playerToKick !== null && isHost === playerId && (
							<Popup
								open={playerToKick !== null}
								onOpenChange={(open) => {
									if (!open) {
										setPlayerToKick(null);
									}
								}}
								dialog={{
									dialogTitle: `Kick ${playerToKick.name}`,
									dialogDescription:
										"Are you sure you want to kick this player?",
								}}
								submitButton={{
									submitButtonTitle: `Kick ${playerToKick.name}`,
									submitButtonOnClick: (e) => {
										e.preventDefault();
										if (!validatedWsClient?.current) {
											return;
										}
										validatedWsClient?.current.socket.emit("kick_player", {
											code: roomCode,
											playerId: playerToKick.id,
										});
										setPlayerToKick(null);
										toast("Player kicked from the lobby", {
											richColors: true,
										});
									},
								}}
								closeButton={{
									closeButtonTitle: "Cancel",
									closeButtonOnClick: (e) => {
										e.preventDefault();
										setPlayerToKick(null);
										toast("Kick player cancelled", {
											richColors: true,
										});
									},
								}}
							/>
						)}

						{/* Players in the lobby */}
						<div className="flex flex-col items-center w-full justify-start gap-4 p-4">
							{playersInLobby?.map((player) => {
								return (
									<div
										key={player.id}
										className={clsx(
											"flex flex-row items-center justify-between w-full p-4 border-b border-gray-300",
											isHost === playerId ? "cursor-pointer" : "",
										)}
										onClick={() => {
											// Only allow popup to kick if the player is host
											if (isHost !== playerId) {
												return;
											}
											setPlayerToKick(player);
										}}
										onKeyUp={() => {
											// Only allow popup to kick if the player is host
											if (isHost !== playerId) {
												return;
											}
											setPlayerToKick(player);
										}}
									>
										<p
											className={clsx(
												"text-xl",
												playerId === player.id ? "font-bold" : "",
											)}
										>
											{player.name}
										</p>
										{isHost && player.id === isHost ? (
											<span>{"(Host)"}</span>
										) : null}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center w-full min-h-screen">
					<div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 max-w-md">
						{/* Role Card */}
						<div
							className="cursor-pointer flex flex-row items-center justify-center gap-4 p-4 rounded-md bg-gray-100 min-w-full h-48"
							onClick={() => {
								setPlayerCardVisible(!playerCardVisible);
							}}
							onKeyUp={() => {
								setPlayerCardVisible(!playerCardVisible);
							}}
						>
							{playerCardVisible ? (
								<>
									<img
										src={
											role?.value === "spy"
												? BASE_CONFIG.ODD_DUCK_OPEN_EYES_SRC
												: BASE_CONFIG.DUCK_IMAGE_SRC
										}
										alt="Duck"
										width={150}
										className="h-auto rounded-md select-none"
									/>
									<div className="flex flex-col items-start justify-center gap-2 w-full">
										<p className="flex flex-col">
											{"Role: "}
											<span className="font-bold">{role?.label}</span>
										</p>
										{/* Location should not be sent to spy players */}
										<p className="flex flex-col">
											{"Location: "}
											<span className="font-bold">
												{location
													? `${location?.translations[selectedLocale].title}`
													: "?"}
											</span>
										</p>
									</div>
								</>
							) : (
								<span className="flex min-w-full h-48 text-9xl font-bold items-center justify-center">
									?
								</span>
							)}
						</div>

						{/* timer */}
						<div
							id="timeLeft"
							className={clsx(
								"tabular-nums",
								timerState === "paused" ? "opacity-25" : "",
							)}
						>
							{gameState === "in_game" && timerState === "stopped"
								? "Game has ended"
								: "No timer"}
						</div>

						{/* Host admin UI */}
						{isHost === playerId && (
							<div className="flex flex-row items-center justify-between gap-2">
								<Popup
									triggerButton={{
										buttonVariant: "default",
										buttonTitle: "End Game",
										triggerButtonClick: () => {
											logger.log("End Game clicked");
										},
									}}
									dialog={{
										dialogTitle: "End Game",
										dialogDescription: "Are you sure you want to end the game?",
									}}
									submitButton={{
										submitButtonTitle: "End Game",
										submitButtonOnClick: (e) => {
											e.preventDefault();
											logger.log("End Game clicked");

											validatedWsClient?.current?.socket.emit("end_game", {
												code: roomCode,
											});
										},
									}}
								/>
								<Button
									type="button"
									variant="secondary"
									disabled={timerState === "stopped"}
									onClick={() => {
										if (!validatedWsClient?.current) {
											return;
										}
										validatedWsClient?.current.socket.emit(
											"toggle_pause_game",
											{
												code: roomCode,
											},
										);
									}}
								>
									{timerState === "paused" ? "Resume" : "Pause"}
								</Button>
							</div>
						)}

						<Button
							type="button"
							variant="secondary"
							onClick={() => {
								const localeToToggle = selectedLocale === "en" ? "sv" : "en";
								if (!validatedWsClient?.current) {
									return;
								}
								validatedWsClient?.current?.socket.emit("get_game_state", {
									code: roomCode,
									locale: localeToToggle,
								});
								setSelectedLocale(localeToToggle);
								toast(
									`Language switched to ${selectedLocale === "en" ? "Swedish" : "English"}`,
									{
										richColors: true,
									},
								);
							}}
						>
							Switch to {selectedLocale === "en" ? "sv" : "en"}
						</Button>

						<Separator />

						{/* players */}
						<div className="grid grid-cols-3 gap-2">
							{playersInLobby?.map((player) => {
								return (
									<div
										key={player.id}
										className="cursor-pointer flex flex-col items-center justify-start p-2 px-4 border-2 rounded-md border-gray-300"
										onClick={(e) => {
											e.currentTarget.classList.toggle("line-through");
											e.currentTarget.classList.toggle("opacity-25");
										}}
										onKeyUp={(e) => {
											e.currentTarget.classList.toggle("line-through");
											e.currentTarget.classList.toggle("opacity-25");
										}}
									>
										<img
											alt={`player-${player.id}`}
											src={BASE_CONFIG.DUCK_IMAGE_SRC}
											width={75}
											className="h-auto rounded-md select-none"
										/>
										<p
											className={clsx(
												"text-xl",
												playerId === player.id ? "font-bold" : "",
											)}
										>
											{player.name}
										</p>
										{isHost && player.id === isHost ? (
											<span>{"(Host)"}</span>
										) : null}
									</div>
								);
							})}
						</div>

						<Separator />

						{/* all locations in the game pack */}
						<div className="grid grid-cols-1 gap-2">
							{gamePack?.locations.map((location) => {
								return (
									<div
										key={location.id}
										className="cursor-pointer flex flex-col items-center justify-center w-full p-4 border-2 rounded-md border-gray-300 gap-2"
										onClick={(e) => {
											e.currentTarget.classList.toggle("line-through");
											e.currentTarget.classList.toggle("opacity-25");
										}}
										onKeyUp={(e) => {
											e.currentTarget.classList.toggle("line-through");
											e.currentTarget.classList.toggle("opacity-25");
										}}
									>
										<img
											src={unsplashImageUrl(location.img_url)}
											width={250}
											alt={location.translations[selectedLocale].title}
											className="h-auto rounded-sm aspect-3/2 object-cover select-none"
										/>
										<div
											className="flex flex-col items-center justify-center text-center"
											id={`${location.id}-text`}
										>
											<h2 className="font-bold">
												{location.translations[selectedLocale].title}
											</h2>
											<p className="text-sm">
												{location.translations[selectedLocale].description}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
