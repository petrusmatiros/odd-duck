import { BASE_CONFIG } from "@/config/config";
import { Howl } from "howler";
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

export default function Index() {
	const logger = new Logger("client/index");
	const [hasPlayername, setHasPlayername] = useState(false);
	const [currentUsername, setCurrentUsername] = useState<string | null>(null);

	const validatedWsClient = useRef<WebsocketClient>(
		new WebsocketClient(
			`${BASE_CONFIG.VITE_WS_SERVER_URL}/${BASE_CONFIG.VITE_WS_VALIDATED_NAMESPACE}`,
			(getCookie("token") as string) || "",
		),
	);

	const sound_quack = new Howl({
		src: [BASE_CONFIG.ODD_DUCK_SOUND_SRC],
		volume: 0.3,
		loop: false,
	});

	useEffect(() => {
		const sound_theme = new Howl({
			src: [BASE_CONFIG.ODD_DUCK_THEME_SRC],
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
			const openEyesSrc = BASE_CONFIG.ODD_DUCK_OPEN_EYES_SRC;
			const closedEyesSrc = BASE_CONFIG.ODD_DUCK_CLOSED_EYES_SRC;

			// open eyes should always be, but every 5 seconds, should be 30% chance to be closed, then quickly open again
			const randomNum = Math.random();
			let newImage = openEyesSrc;
			if (randomNum < BASE_CONFIG.ODD_DUCK_BLINK_CHANCE) {
				newImage = closedEyesSrc;
			}
			const img = document.getElementById(
				BASE_CONFIG.ODD_DUCK_IMAGE_ID,
			) as HTMLImageElement;
			if (img) {
				img.src = newImage;
			}

			setTimeout(() => {
				if (img) {
					img.src = openEyesSrc;
				}
			}, BASE_CONFIG.ODD_DUCK_IMAGE_SWITCH_DELAY);
		}, BASE_CONFIG.ODD_DUCK_IMAE_INTERVAL);
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
			sockRef.emit("check_if_player_name_exists");
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
				logger.log("Already a host of a game", data.roomCode);
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

		sockRef.on("change_username_response", (data: { toastMessage: string }) => {
			logger.log("Change username response", data.toastMessage);
			toast(data.toastMessage);
		});

		sockRef.on(
			"get_current_username_response",
			(data: { name: string }) => {
				setCurrentUsername(data.name);
				logger.log("Current username", data.name);
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
			sockRef.off("change_username_response");
			sockRef.off("get_current_username_response");
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<div className="flex flex-col items-center justify-center min-h-screen">
				<h1 className="text-4xl font-bold">Odd Duck</h1>
				<img
					id={BASE_CONFIG.ODD_DUCK_IMAGE_ID}
					src={BASE_CONFIG.ODD_DUCK_OPEN_EYES_SRC}
					alt="Odd Duck"
					width={200}
					height={200}
				/>
				<div className="flex flex-col items-center w-full gap-2">
					<Popup
						triggerButton={{
							buttonVariant: "outline",
							buttonTitle: "Create Game",
							triggerButtonClick: () => {
								logger.log("Create game clicked");
								// play sound
								sound_quack.play();

								// Check if already created a game before
								validatedWsClient?.current?.socket.emit(
									"check_if_already_created_game_before",
								);
							}
						}}
						dialog={{
							dialogTitle: "Create Game",
							dialogDescription: "What be your name veary traveller?"
						}}
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
						submitButton={{
							submitButtonTitle: "Create Game",
							submitButtonOnClick: (e) => {
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
							}
						}}
					/>

					{hasPlayername ? (
						<Popup
							triggerButton={{
								buttonVariant: "outline",
								buttonTitle: "Join Game",
								triggerButtonClick: () => {
									logger.log("Join game clicked");
									validatedWsClient?.current?.socket.emit(
										"check_if_player_name_exists",
									);
									validatedWsClient?.current?.socket.emit(
										"get_current_username",
									);
									// play sound
									sound_quack.play();
								}
							}}
							dialog={{
								dialogTitle: "Join Game",
								dialogDescription: "What be the code to the room ye be joinin?"
							}}
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
							submitButton={{
								submitButtonTitle: "Join Game",
								submitButtonOnClick: (e) => {
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
								}
							}}
						/>
					) : (
						<Popup
							triggerButton={{
								buttonVariant: "outline",
								buttonTitle: "Join Game",
								triggerButtonClick: () => {
									logger.log("Join game clicked");
									validatedWsClient?.current?.socket.emit(
										"check_if_player_name_exists",
									);
									// play sound
									sound_quack.play();
								}
							}}
							dialog={{
								dialogTitle: "Join Game",
								dialogDescription: "What be your name veary traveller? And what be the code to the room ye be joinin?"
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
							submitButton={{
								submitButtonTitle: "Join Game",
								submitButtonOnClick: (e) => {
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
								}
							}}
						/>
					)}
					{hasPlayername && <Popup
						triggerButton={{
							buttonVariant: "outline",
							buttonTitle: "Change Username",
							triggerButtonClick: () => {
								logger.log("Change Username clicked");
								// play sound
								sound_quack.play();
								validatedWsClient?.current?.socket.emit(
									"get_current_username",
								);
							}
						}}
						dialog={{
							dialogTitle: "Change Username",
							dialogDescription: "What be your new name veary traveller?"
						}}
						inputs={[
							{
								id: "name",
								type: "text",
								labelTitle: "Name",
								placeholder: "Name",
								value: currentUsername || "",
								required: true,
								minLength: 1,
								maxLength: 20,
								className: "col-span-3",
								onChange: (e) => {
									const lowerBound = 1.75;
									const upperBound = 2;
									const randomNum = Math.random() + lowerBound;
									sound_quack.rate(
										randomNum < upperBound ? randomNum : lowerBound,
									);
									sound_quack.play();
									setCurrentUsername(e.target.value);
								},
							},
						]}
						submitButton={{
							submitButtonTitle: "Change Username",
							submitButtonOnClick: (e) => {
								e.preventDefault();
								logger.log("Change Username clicked");
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

								validatedWsClient?.current?.socket.emit("change_username", {
									name: name,
								});
							}
						}}
					/>}
				</div>
			</div>
		</>
	);
}
