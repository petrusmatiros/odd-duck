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
import { Howl } from "howler";

const ODD_DUCK_IMAE_INTERVAL = 5000; // 5 seconds
const ODD_DUCK_IMAGE_SWITCH_DELAY = 250; // 0.25 seconds
const ODD_DUCK_BLINK_CHANCE = 0.45; // 45% chance to blink
const ODD_DUCK_OPEN_EYES_SRC = "/avatars/odd_duck_open.webp";
const ODD_DUCK_CLOSED_EYES_SRC = "/avatars/odd_duck_closed.webp";
const ODD_DUCK_SOUND_SRC = "quack.mp3";
const ODD_DUCK_THEME_SRC = "odd_duck_theme.mp3";
const ODD_DUCK_IMAGE_ID = "odd-duck-image";

export default function Index() {
	const logger = new Logger("client/index");
	const [hasPlayername, setHasPlayername] = useState(false);

	const validatedWsClient = useRef<WebsocketClient>(
		new WebsocketClient(
			`${import.meta.env.VITE_WS_SERVER_URL}/${import.meta.env.VITE_WS_VALIDATED_NAMESPACE}`,
			(getCookie("token") as string) || "",
		),
	);

	const sound_quack = new Howl({
		src: [ODD_DUCK_SOUND_SRC],
		volume: 0.3,
		loop: false,
	});

	useEffect(() => {
		const sound_theme = new Howl({
			src: [ODD_DUCK_THEME_SRC],
			volume: 0.3,
			loop: true,
		});

		// Clear listener after first call.
		sound_theme.once("load", () => {
			console.log("Sound loaded");
			sound_theme.play();
		});

		// Fires when the sound finishes playing.
		sound_theme.on("end", () => {
			console.log("Finished!");
		});
		const interval = setInterval(() => {
			const openEyesSrc = ODD_DUCK_OPEN_EYES_SRC;
			const closedEyesSrc = ODD_DUCK_CLOSED_EYES_SRC;

			// open eyes should always be, but every 5 seconds, should be 30% chance to be closed, then quickly open again
			const randomNum = Math.random();
			let newImage = openEyesSrc;
			if (randomNum < ODD_DUCK_BLINK_CHANCE) {
				newImage = closedEyesSrc;
			}
			const img = document.getElementById(
				ODD_DUCK_IMAGE_ID,
			) as HTMLImageElement;
			if (img) {
				img.src = newImage;
			}

			setTimeout(() => {
				if (img) {
					img.src = openEyesSrc;
				}
			}, ODD_DUCK_IMAGE_SWITCH_DELAY);
		}, ODD_DUCK_IMAE_INTERVAL);
		return () => {
			clearInterval(interval);
			sound_theme.stop();
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!validatedWsClient?.current) {
			return;
		}
		const sockRef = validatedWsClient?.current.socket;

		sockRef.on("connect", () => {
			logger.log("Validated socket connected");
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
			"check_if_already_created_game_before_response",
			(data: { roomCode: string; toastMessage: string }) => {
				logger.log("Entered game", data.roomCode);
				toast(data.toastMessage);
				window.location.href = `/room/${data.roomCode}`;
			},
		);

		sockRef.on(
			"check_if_player_name_exists_response",
			(data: { name: string | null }) => {
				if (data.name) {
					logger.log("Player name exists", data.name);
					setHasPlayername(true);
				}
			},
		);

		return () => {
			logger.log("Cleaning up socket listeners");
			sockRef.off("connect");
			sockRef.off("disconnect");
			sockRef.off("connect_error");
			sockRef.off("register_new_player_token_response");
			sockRef.off("check_if_already_created_game_before_response");
			sockRef.off("check_if_player_name_exists_response");
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<div className="flex flex-col items-center justify-center min-h-screen">
				<h1 className="text-4xl font-bold">Odd Duck</h1>
				<img
					id={ODD_DUCK_IMAGE_ID}
					src={ODD_DUCK_OPEN_EYES_SRC}
					alt="Odd Duck"
					width={200}
					height={200}
				/>
				<div className="flex flex-col items-center w-full gap-2">
					<Popup
						buttonTitle="Create Game"
						triggerButtonClick={() => {
							logger.log("Create game clicked");
							// play sound
							sound_quack.play();
							validatedWsClient?.current?.socket.emit(
								"check_if_already_created_game_before",
							);
						}}
						dialogTitle="Create Game"
						dialogDescription="What be your name veary traveller?"
						submitButtonTitle="Create Game"
						inputs={[
							{
								id: "name",
								type: "text",
								labelTitle: "Name",
								placeholder: "Name",
								required: true,
								minLength: 1,
								maxLength: 20,
								className: "col-span-3",
								onChange: () => {
									const lowerBound = 1.75;
									const upperBound = 2;
									const randomNum = Math.random() + lowerBound;
									sound_quack.rate(
										randomNum < upperBound ? randomNum : lowerBound,
									);
									sound_quack.play();
								},
							},
						]}
						submitButtonOnClick={(e) => {
							e.preventDefault();
							logger.log("Create game clicked");
							const name = (document.getElementById("name") as HTMLInputElement)
								.value;
							logger.log("Name", name);
							if (!name) {
								return;
							}

							logger.log("Name", name.length);

							if (name.length < 1 || name.length > 20) {
								return;
							}

							logger.log("creating game...", name);

							validatedWsClient?.current?.socket.emit("create_game", {
								name: name,
							});
						}}
					/>

					{hasPlayername ? (
						<Popup
							buttonTitle="Join Game"
							triggerButtonClick={() => {
								logger.log("Join game clicked");
								validatedWsClient?.current?.socket.emit(
									"check_if_player_name_exists",
								);
								// play sound
								sound_quack.play();
							}}
							dialogTitle="Join Game"
							dialogDescription="What be the code to the room ye be joinin?"
							submitButtonTitle="Join Game"
							inputs={[
								{
									id: "code",
									type: "text",
									placeholder: "Code",
									labelTitle: "Code",
									required: true,
									minLength: 3,
									maxLength: 20,
									className: "col-span-3",
									onChange: (e) => {
										// must be 6 characters long, most be upper case
										const value = e.target.value.trim();
										if (!value) {
											return;
										}
										const formattedValue = value.toUpperCase();
										e.target.value = formattedValue;

										if (formattedValue.length > 6) {
											e.target.value = formattedValue.slice(0, 6);
											return;
										}

										const lowerBound = 1.75;
										const upperBound = 2;
										const randomNum = Math.random() + lowerBound;
										sound_quack.rate(
											randomNum < upperBound ? randomNum : lowerBound,
										);
										sound_quack.play();
									},
								},
							]}
							submitButtonOnClick={(e) => {
								e.preventDefault();
								const code = (
									document.getElementById("code") as HTMLInputElement
								).value;

								if (!code) {
									return;
								}

								if (code.length !== 6) {
									return;
								}

								validatedWsClient?.current?.socket.emit("join_game", {
									name: null,
									code: code,
								});
							}}
						/>
					) : (
						<Popup
							buttonTitle="Join Game"
							triggerButtonClick={() => {
								logger.log("Join game clicked");
								validatedWsClient?.current?.socket.emit(
									"check_if_player_name_exists",
								);
								// play sound
								sound_quack.play();
							}}
							dialogTitle="Join Game"
							dialogDescription="What be your name veary traveller? And what be the code to the room ye be joinin?"
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
											return;
										}

										const lowerBound = 1.75;
										const upperBound = 2;
										const randomNum = Math.random() + lowerBound;
										sound_quack.rate(
											randomNum < upperBound ? randomNum : lowerBound,
										);
										sound_quack.play();
									},
								},
								{
									id: "code",
									type: "text",
									placeholder: "Code",
									labelTitle: "Code",
									required: true,
									minLength: 3,
									maxLength: 20,
									className: "col-span-3",
									onChange: (e) => {
										// must be 6 characters long, most be upper case
										const value = e.target.value.trim();
										if (!value) {
											return;
										}
										const formattedValue = value.toUpperCase();
										e.target.value = formattedValue;

										if (formattedValue.length > 6) {
											e.target.value = formattedValue.slice(0, 6);
											return;
										}

										const lowerBound = 1.75;
										const upperBound = 2;
										const randomNum = Math.random() + lowerBound;
										sound_quack.rate(
											randomNum < upperBound ? randomNum : lowerBound,
										);
										sound_quack.play();
									},
								},
							]}
							submitButtonOnClick={(e) => {
								e.preventDefault();
								const name = (
									document.getElementById("name") as HTMLInputElement
								).value;
								const code = (
									document.getElementById("code") as HTMLInputElement
								).value;

								if (!name || !code) {
									return;
								}

								if (name.length < 1 || name.length > 20) {
									return;
								}

								if (code.length !== 6) {
									return;
								}

								validatedWsClient?.current?.socket.emit("join_game", {
									name: name,
									code: code,
								});
							}}
						/>
					)}
				</div>
			</div>
		</>
	);
}
